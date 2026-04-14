import { Hono } from "hono";

const aiRouter = new Hono();

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY;
const API_URL = "https://api.anthropic.com/v1/messages";

// Valid Anthropic models: claude-sonnet-4-20250514 (current), claude-3-5-sonnet-latest (legacy)
const AI_MODEL = "claude-sonnet-4-20250514";

aiRouter.post("/chat", async (c) => {
  if (!ANTHROPIC_API_KEY) {
    return c.json({ error: "AI service not configured" }, 500);
  }

  const { systemPrompt, userPrompt } = await c.req.json<{
    systemPrompt: string;
    userPrompt: string;
  }>();

  if (!systemPrompt || !userPrompt) {
    return c.json({ error: "Missing systemPrompt or userPrompt" }, 400);
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", errorText);
      return c.json(
        { error: "Failed to get AI response. Please try again." },
        502
      );
    }

    const data = await response.json();
    const content = (data as any).content?.[0]?.text;

    if (!content) {
      console.error("Empty response from Anthropic:", JSON.stringify(data));
      return c.json({ error: "AI returned an empty response." }, 502);
    }

    const stopReason = (data as any).stop_reason;

    return c.json({ content, stopReason });
  } catch (error) {
    console.error("AI route error:", error);
    return c.json({ error: "Failed to get AI response. Please try again." }, 500);
  }
});

export { aiRouter };
