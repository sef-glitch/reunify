import { auth } from "@/auth";
import { env, isAIConfigured } from "@/utils/env";
import { systemPrompt, shouldRefuse, refusalMessage } from "@/utils/aiPrompt";

export async function POST(request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAIConfigured()) {
    console.warn("[chat] AI not configured - OPENAI_API_KEY is missing");
    return Response.json(
      { error: "AI_NOT_CONFIGURED", message: "AI assistant is not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { messages, stream = false } = body;

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "messages array is required" }, { status: 400 });
    }

    // Check for harmful content in the latest user message
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMessage && shouldRefuse(lastUserMessage.content)) {
      return Response.json({
        choices: [
          {
            message: {
              role: "assistant",
              content: refusalMessage(),
            },
          },
        ],
      });
    }

    // Prepend system prompt
    const messagesWithSystem = [
      { role: "system", content: systemPrompt() },
      ...messages,
    ];

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || "gpt-4o-mini",
        messages: messagesWithSystem,
        stream,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      console.error("[chat] OpenAI API error:", openaiResponse.status, errorData);

      if (openaiResponse.status === 401) {
        return Response.json(
          { error: "AI_NOT_CONFIGURED", message: "Invalid API key" },
          { status: 503 }
        );
      }

      return Response.json(
        { error: "AI request failed", details: errorData.error?.message },
        { status: 502 }
      );
    }

    if (stream) {
      // Return streaming response
      return new Response(openaiResponse.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming response
    const data = await openaiResponse.json();
    return Response.json(data);
  } catch (error) {
    console.error("[chat] Server error:", error);
    return Response.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to check if AI is configured
export async function GET() {
  const configured = Boolean(env.OPENAI_API_KEY);
  return Response.json({
    configured,
    provider: configured ? "openai" : "none",
    model: env.OPENAI_MODEL || "gpt-4o-mini",
  });
}
