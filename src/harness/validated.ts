import type { ZodType } from "zod";
import type { ChatMessage, LlmProvider } from "./provider";

/**
 * Parse raw model output as JSON. Accepts bare JSON or a single
 * ```json fenced block. Throws an Error when neither parses.
 */
export function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence !== null ? fence[1].trim() : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    throw new Error("failed to parse JSON from provider response");
  }
}

/**
 * Plumbing only: sends messages, parses JSON, validates against the schema.
 * On parse/validation failure appends `retryNote` as a user message and
 * retries exactly once, then throws the Zod error message.
 */
function validateOrThrow<T>(raw: string, schema: ZodType<T>): T {
  const data = extractJson(raw);
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }
  return parsed.data;
}

export async function callWithValidation<T>(
  provider: LlmProvider,
  messages: ChatMessage[],
  schema: ZodType<T>,
  retryNote: string,
): Promise<T> {
  // Transport errors (network, timeouts, HTTP failures) propagate
  // immediately and are NEVER retried: retrying a hung provider doubles
  // the hang, and "return only JSON" cannot fix a transport failure.
  // Only parse/validation failures get exactly one retry.
  const raw = await provider.chat(messages);
  try {
    return validateOrThrow(raw, schema);
  } catch {
    const retryRaw = await provider.chat([...messages, { role: "user", content: retryNote }]);
    return validateOrThrow(retryRaw, schema);
  }
}
