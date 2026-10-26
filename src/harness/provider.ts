export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmProvider {
  chat(messages: ChatMessage[]): Promise<string>;
}

/** Deterministic stub: returns the canned response verbatim, no network. */
export class MockLlmProvider implements LlmProvider {
  private readonly canned: string;

  constructor(canned = '{"ok":true}') {
    this.canned = canned;
  }

  async chat(): Promise<string> {
    return this.canned;
  }
}

interface ChatCompletionsResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

/**
 * Minimal OpenAI-compatible chat client.
 * NOTE: untested against a real API — no live call has been made from this
 * repo, so field shapes may need adjusting once wired to a real endpoint.
 */
export class OpenAiCompatibleProvider implements LlmProvider {
  readonly baseUrl: string;
  readonly apiKey: string | undefined;
  readonly model: string;

  constructor() {
    const baseUrl = process.env.LLM_BASE_URL;
    this.baseUrl = (
      baseUrl !== undefined && baseUrl !== "" ? baseUrl : "https://api.meta.ai/v1"
    ).replace(/\/+$/, "");
    this.apiKey = process.env.LLM_API_KEY;
    const model = process.env.LLM_MODEL;
    this.model = model !== undefined && model !== "" ? model : "spark";
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    // Bounded: a hung LLM must not hang the API route past this.
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey !== undefined && this.apiKey !== ""
          ? { Authorization: `Bearer ${this.apiKey}` }
          : {}),
      },
      body: JSON.stringify({ model: this.model, messages }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      throw new Error(
        `LLM request failed with status ${response.status} ${response.statusText}`.trim()
      );
    }
    const json = (await response.json()) as ChatCompletionsResponse;
    const content = json.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("LLM response missing message content");
    }
    return content;
  }
}
