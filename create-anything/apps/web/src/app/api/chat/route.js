import { auth } from "@/auth";
import { env } from "@/utils/env";
import { systemPrompt, shouldRefuse, refusalMessage } from "@/utils/aiPrompt";
import { openaiChat } from "@/utils/openai";
import { ensureChat, addMessage, getRecentMessages, audit } from "@/utils/chatStore";

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!env.OPENAI_API_KEY) {
    return Response.json({ error: "AI not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const userText = body?.message?.toString() ?? "";
  const caseId = body?.case_id ?? null;

  if (!userText.trim()) {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }

  const userId = session.user.id;
  const chatId = await ensureChat({ userId, caseId });

  // Store user message
  await addMessage({ chatId, role: "user", content: userText });

  // Refusal
  if (shouldRefuse(userText)) {
    const reply = refusalMessage();
    await addMessage({ chatId, role: "assistant", content: reply });
    await audit({ userId, action: "chat_refused", entityType: "chat", entityId: chatId });
    return Response.json({ chat_id: chatId, reply });
  }

  // Build context from recent history
  const history = await getRecentMessages({ chatId, limit: 12 });

  const messages = [
    { role: "system", content: systemPrompt() },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    const reply = await openaiChat({ messages });

    await addMessage({ chatId, role: "assistant", content: reply });
    await audit({ userId, action: "chat_completed", entityType: "chat", entityId: chatId });

    return Response.json({ chat_id: chatId, reply });
  } catch (err) {
    console.error("Chat error:", err);
    return Response.json({ error: err?.message || "Chat failed" }, { status: 500 });
  }
}
