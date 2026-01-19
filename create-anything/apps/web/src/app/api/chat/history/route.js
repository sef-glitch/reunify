import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const session = await auth();
  if (!session?.user)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const caseId = url.searchParams.get("caseId");

  try {
    let chatId;
    if (caseId) {
      const rows =
        await sql`SELECT id FROM chats WHERE user_id = ${session.user.id} AND case_id = ${caseId}`;
      if (rows.length > 0) chatId = rows[0].id;
    } else {
      const rows =
        await sql`SELECT id FROM chats WHERE user_id = ${session.user.id} AND case_id IS NULL`;
      if (rows.length > 0) chatId = rows[0].id;
    }

    if (!chatId) {
      return Response.json([]);
    }

    const messages = await sql`
      SELECT * FROM chat_messages WHERE chat_id = ${chatId} ORDER BY created_at ASC
    `;

    return Response.json(messages);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

export async function POST(request) {
  // Use this to sync messages to DB
  const session = await auth();
  if (!session?.user)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { caseId, role, content } = body;

  try {
    let chatId;

    // Find or create chat
    if (caseId) {
      const rows =
        await sql`SELECT id FROM chats WHERE user_id = ${session.user.id} AND case_id = ${caseId}`;
      if (rows.length > 0) {
        chatId = rows[0].id;
      } else {
        const newChat =
          await sql`INSERT INTO chats (user_id, case_id) VALUES (${session.user.id}, ${caseId}) RETURNING id`;
        chatId = newChat[0].id;
      }
    } else {
      const rows =
        await sql`SELECT id FROM chats WHERE user_id = ${session.user.id} AND case_id IS NULL`;
      if (rows.length > 0) {
        chatId = rows[0].id;
      } else {
        const newChat =
          await sql`INSERT INTO chats (user_id, case_id) VALUES (${session.user.id}, NULL) RETURNING id`;
        chatId = newChat[0].id;
      }
    }

    const [newMessage] = await sql`
      INSERT INTO chat_messages (chat_id, role, content)
      VALUES (${chatId}, ${role}, ${content})
      RETURNING *
    `;

    return Response.json(newMessage);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to save message" }, { status: 500 });
  }
}
