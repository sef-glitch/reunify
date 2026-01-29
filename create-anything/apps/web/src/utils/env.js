/**
 * Environment Variable Validation
 *
 * This module validates required environment variables at startup and fails fast
 * with clear error messages if any are missing or invalid.
 *
 * SECURITY: This module never logs secret values. All sensitive data is masked.
 */

// List of environment variables that contain secrets (never log these)
const SECRET_VARS = [
  'DATABASE_URL',
  'AUTH_SECRET',
];

// Required environment variables for the web app
const REQUIRED_VARS = [
  {
    name: 'DATABASE_URL',
    description: 'Neon PostgreSQL connection string',
    validate: (value) => {
      if (!value.startsWith('postgresql://') && !value.startsWith('postgres://')) {
        return 'Must be a valid PostgreSQL connection string starting with postgresql:// or postgres://';
      }
      return null;
    },
  },
  {
    name: 'AUTH_SECRET',
    description: 'Auth.js secret key for session encryption',
    validate: (value) => {
      if (value.length < 32) {
        return 'Must be at least 32 characters long. Generate with: openssl rand -base64 32';
      }
      return null;
    },
  },
  {
    name: 'AUTH_URL',
    description: 'Application base URL for authentication',
    validate: (value) => {
      if (!value.startsWith('http://') && !value.startsWith('https://')) {
        return 'Must be a valid URL starting with http:// or https://';
      }
      return null;
    },
  },
];

// Optional environment variables (validated if present)
const OPTIONAL_VARS = [
  {
    name: 'CORS_ORIGINS',
    description: 'Comma-separated list of allowed CORS origins',
    validate: (value) => {
      const origins = value.split(',').map(o => o.trim());
      for (const origin of origins) {
        if (!origin.startsWith('http://') && !origin.startsWith('https://')) {
          return `Invalid origin "${origin}". Each origin must start with http:// or https://`;
        }
      }
      return null;
    },
  },
  {
    name: 'NEXT_PUBLIC_PROJECT_GROUP_ID',
    description: 'Create.xyz project group ID',
    validate: (value) => {
      // UUID format validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        return 'Must be a valid UUID format';
      }
      return null;
    },
  },
];

/**
 * Masks a secret value for safe logging
 * Shows first 4 chars and last 4 chars, masks the middle
 */
function maskSecret(value) {
  if (!value || value.length <= 8) {
    return '****';
  }
  return `${value.slice(0, 4)}${'*'.repeat(Math.min(value.length - 8, 20))}${value.slice(-4)}`;
}

/**
 * Validates all environment variables and fails fast if any are invalid
 * @throws {Error} If any required variable is missing or invalid
 */
export function validateEnv() {
  const errors = [];
  const warnings = [];

  // Check required variables
  for (const varConfig of REQUIRED_VARS) {
    const value = process.env[varConfig.name];

    if (!value || value.trim() === '') {
      errors.push({
        name: varConfig.name,
        message: `Missing required environment variable: ${varConfig.name}`,
        description: varConfig.description,
      });
      continue;
    }

    if (varConfig.validate) {
      const validationError = varConfig.validate(value);
      if (validationError) {
        errors.push({
          name: varConfig.name,
          message: `Invalid ${varConfig.name}: ${validationError}`,
          description: varConfig.description,
        });
      }
    }
  }

  // Check optional variables (only if present)
  for (const varConfig of OPTIONAL_VARS) {
    const value = process.env[varConfig.name];

    if (value && value.trim() !== '' && varConfig.validate) {
      const validationError = varConfig.validate(value);
      if (validationError) {
        warnings.push({
          name: varConfig.name,
          message: `Invalid ${varConfig.name}: ${validationError}`,
          description: varConfig.description,
        });
      }
    }
  }

  // Log warnings (non-fatal)
  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment variable warnings:');
    for (const warning of warnings) {
      console.warn(`   - ${warning.name}: ${warning.message}`);
    }
    console.warn('');
  }

  // Fail fast if there are errors
  if (errors.length > 0) {
    console.error('\n❌ Environment validation failed!\n');
    console.error('The following required environment variables are missing or invalid:\n');

    for (const error of errors) {
      console.error(`   ${error.name}`);
      console.error(`   └─ ${error.message}`);
      console.error(`   └─ ${error.description}`);
      console.error('');
    }

    console.error('📖 See docs/ENV.md for setup instructions.\n');
    console.error('💡 Quick fix: Copy .env.example to .env.local and fill in the values:\n');
    console.error('   cp apps/web/.env.example apps/web/.env.local\n');

    throw new Error(
      `Environment validation failed: ${errors.map(e => e.name).join(', ')} missing or invalid`
    );
  }

  // Log success (without revealing secrets)
  console.log('\n✅ Environment variables validated successfully');
  console.log('   Required variables configured:');
  for (const varConfig of REQUIRED_VARS) {
    const value = process.env[varConfig.name];
    const isSecret = SECRET_VARS.includes(varConfig.name);
    const displayValue = isSecret ? maskSecret(value) : (value.length > 50 ? value.slice(0, 47) + '...' : value);
    console.log(`   - ${varConfig.name}: ${displayValue}`);
  }
  console.log('');
}

/**
 * Gets an environment variable value, throwing if not set
 * Use this for required variables that must exist
 */
export function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

/**
 * Gets an environment variable value with a default fallback
 * Use this for optional variables
 */
export function getEnv(name, defaultValue = '') {
  return process.env[name] || defaultValue;
}

/**
 * Checks if we're in production mode
 */
export function isProduction() {
  return process.env.NODE_ENV === 'production' ||
         process.env.NEXT_PUBLIC_CREATE_ENV === 'PRODUCTION';
}

/**
 * Safely logs an object, masking any secret values
 * Use this instead of console.log when logging might include env vars
 */
export function safeLog(message, data = {}) {
  const safeData = { ...data };

  for (const key of Object.keys(safeData)) {
    const upperKey = key.toUpperCase();
    // Check if this key looks like a secret
    if (
      SECRET_VARS.some(secret => upperKey.includes(secret.replace(/_/g, ''))) ||
      upperKey.includes('SECRET') ||
      upperKey.includes('PASSWORD') ||
      upperKey.includes('TOKEN') ||
      upperKey.includes('KEY') ||
      upperKey.includes('CREDENTIAL')
    ) {
      safeData[key] = maskSecret(safeData[key]);
    }
  }

  console.log(message, safeData);
}

/**
 * S3 environment variables (for file storage)
 */
export const env = {
  S3_BUCKET: process.env.S3_BUCKET || "",
  S3_REGION: process.env.S3_REGION || "auto",
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID || "",
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY || "",
  S3_ENDPOINT: process.env.S3_ENDPOINT || "",
  S3_PUBLIC_BASE_URL: process.env.S3_PUBLIC_BASE_URL || "",
};

/**
 * Check if S3 storage is configured
 */
export function isS3Configured() {
  return !!(env.S3_BUCKET && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY);
}

export default {
  validateEnv,
  getRequiredEnv,
  getEnv,
  isProduction,
  safeLog,
  env,
  isS3Configured,
};
