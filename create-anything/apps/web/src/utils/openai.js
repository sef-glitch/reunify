import { env } from "@/utils/env";

export async function openaiChat({ messages }) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.3,
      messages,
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.error?.message || `OpenAI error (${res.status})`;
    throw new Error(msg);
  }

  const text = data?.choices?.[0]?.message?.content ?? "";
  return text.trim();
}
