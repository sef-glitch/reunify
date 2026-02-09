import { neon } from '@neondatabase/serverless';
import pg from 'pg';

/**
 * Database connection utility
 *
 * Uses @neondatabase/serverless for Neon (production)
 * Uses pg for local PostgreSQL (development)
 */

const DATABASE_ERROR_MESSAGE = `
Database connection not configured.

To fix this:
1. Copy apps/web/.env.example to apps/web/.env.local
2. Set DATABASE_URL to your PostgreSQL connection string
3. Restart the development server

See docs/ENV.md for detailed setup instructions.
`.trim();

const NullishQueryFunction = () => {
  throw new Error(DATABASE_ERROR_MESSAGE);
};

NullishQueryFunction.transaction = () => {
  throw new Error(DATABASE_ERROR_MESSAGE);
};

/**
 * Check if DATABASE_URL points to localhost
 */
function isLocalDatabase(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

/**
 * Create a tagged template wrapper for pg that matches neon's interface
 */
function createPgTaggedTemplate(pool) {
  const sql = async (strings, ...values) => {
    // Convert tagged template to parameterized query
    let query = '';
    strings.forEach((str, i) => {
      query += str;
      if (i < values.length) {
        query += `$${i + 1}`;
      }
    });

    const result = await pool.query(query, values);
    return result.rows;
  };

  // Add transaction support
  sql.transaction = async (callback) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create a transaction-scoped tagged template
      const txn = async (strings, ...values) => {
        let query = '';
        strings.forEach((str, i) => {
          query += str;
          if (i < values.length) {
            query += `$${i + 1}`;
          }
        });
        const result = await client.query(query, values);
        return result.rows;
      };

      const result = await callback(txn);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  };

  return sql;
}

// Initialize connection
let sql;

if (!process.env.DATABASE_URL) {
  sql = NullishQueryFunction;
} else if (isLocalDatabase(process.env.DATABASE_URL)) {
  // Use pg for local PostgreSQL
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  sql = createPgTaggedTemplate(pool);
} else {
  // Use neon for remote Neon database
  sql = neon(process.env.DATABASE_URL);
}

export default sql;
