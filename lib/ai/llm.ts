/**
 * Server-only helper for optional LLM-powered coach replies.
 *
 * Uses an OpenAI-compatible `/chat/completions` endpoint. Everything is
 * configured through environment variables:
 *   AI_API_KEY  — required for LLM replies
 *   AI_BASE_URL — defaults to https://api.openai.com/v1
 *   AI_MODEL    — defaults to gpt-4o-mini
 *
 * If no key is configured the caller falls back to the rules engine.
 */

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export function isLlmConfigured(): boolean {
  return Boolean(process.env.AI_API_KEY);
}

export async function llmReply(
  messages: ChatMessage[],
  options: { temperature?: number; maxTokens?: number } = {},
): Promise<string | null> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return null;

  const baseUrl = (process.env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(
    /\/$/,
    "",
  );
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 220,
      }),
      signal: controller.signal,
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}