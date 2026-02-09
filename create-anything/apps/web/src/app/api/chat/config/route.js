import { env } from "@/utils/env";

export async function GET() {
  const configured = Boolean(env.OPENAI_API_KEY);
  return Response.json({
    configured,
    provider: configured ? "openai" : "none",
    model: env.OPENAI_MODEL || "gpt-4o-mini",
  });
}
