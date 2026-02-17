import sql from "@/app/api/utils/sql";

export async function ensureChat({ userId, caseId = null }) {
  // Create a chat if none exists for this user+case (simple approach)
  const rows = await sql`
    SELECT id FROM chats
    WHERE user_id = ${userId} AND (case_id IS NOT DISTINCT FROM ${caseId})
    ORDER BY created_at DESC
    LIMIT 1
  `;
  if (rows?.length) return rows[0].id;

  const created = await sql`
    INSERT INTO chats (user_id, case_id, created_at)
    VALUES (${userId}, ${caseId}, NOW())
    RETURNING id
  `;
  return created[0].id;
}

export async function addMessage({ chatId, role, content }) {
  await sql`
    INSERT INTO chat_messages (chat_id, role, content, created_at)
    VALUES (${chatId}, ${role}, ${content}, NOW())
  `;
}

export async function getRecentMessages({ chatId, limit = 12 }) {
  const rows = await sql`
    SELECT role, content
    FROM chat_messages
    WHERE chat_id = ${chatId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows.reverse(); // oldest -> newest
}

export async function audit({ userId, action, entityType, entityId }) {
  await sql`
    INSERT INTO audit_log (user_id, action, entity_type, entity_id, created_at)
    VALUES (${userId}, ${action}, ${entityType}, ${entityId}, NOW())
  `;
}
