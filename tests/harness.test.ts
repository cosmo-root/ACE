import { describe, expect, test } from "vitest";
import { z } from "zod";
import {
  MockLlmProvider,
  OpenAiCompatibleProvider,
} from "../src/harness/provider";
import { callWithValidation, extractJson } from "../src/harness/validated";
import { generateLesson } from "../src/harness/services";
import type { ChatMessage, LlmProvider } from "../src/harness/provider";

const ShapeSchema = z.object({ answer: z.number() });

/** Queue-backed stub: replays the given responses in order. */
class QueueProvider implements LlmProvider {
  readonly seen: ChatMessage[][] = [];
  private readonly queue: string[];

  constructor(responses: string[]) {
    this.queue = [...responses];
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    this.seen.push(messages);
    const next = this.queue.shift();
    if (next === undefined) {
      throw new Error("no more queued responses");
    }
    return next;
  }
}

describe("harness plumbing", () => {
  test("mock returns valid JSON passes through schema", async () => {
    const provider = new MockLlmProvider('{"answer":42}');
    const result = await generateLesson(provider, "caller-built prompt", ShapeSchema);
    expect(result).toEqual({ answer: 42 });
  });

  test("invalid JSON then valid JSON on retry succeeds", async () => {
    const provider = new QueueProvider(["not json at all", '{"answer":7}']);
    const result = await callWithValidation(
      provider,
      [{ role: "user", content: "caller-built prompt" }],
      ShapeSchema,
      "Return ONLY valid JSON matching the requested shape, no prose.",
    );
    expect(result).toEqual({ answer: 7 });
    expect(provider.seen).toHaveLength(2);
    expect(provider.seen[1].at(-1)).toEqual({
      role: "user",
      content: "Return ONLY valid JSON matching the requested shape, no prose.",
    });
  });

  test("two failures throws", async () => {
    const provider = new QueueProvider(["garbage", "still garbage"]);
    await expect(
      callWithValidation(
        provider,
        [{ role: "user", content: "caller-built prompt" }],
        ShapeSchema,
        "retry",
      ),
    ).rejects.toThrow();
    expect(provider.seen).toHaveLength(2);
  });

  test("transport errors are never retried", async () => {
    let calls = 0;
    const flaky: LlmProvider = {
      async chat() {
        calls += 1;
        const err = new Error("hung provider");
        err.name = "TimeoutError";
        throw err;
      },
    };
    await expect(
      callWithValidation(flaky, [{ role: "user", content: "p" }], ShapeSchema, "retry"),
    ).rejects.toThrow("hung provider");
    expect(calls).toBe(1);
  });

  test("empty prompt throws", async () => {
    const provider = new MockLlmProvider('{"answer":1}');
    await expect(generateLesson(provider, "", ShapeSchema)).rejects.toThrow();
  });

  test("oversized prompt throws", async () => {
    const provider = new MockLlmProvider('{"answer":1}');
    await expect(generateLesson(provider, "x".repeat(20001), ShapeSchema)).rejects.toThrow();
  });

  test("extractJson handles bare JSON", () => {
    expect(extractJson('{"answer":1}')).toEqual({ answer: 1 });
  });

  test("extractJson handles fenced JSON", () => {
    expect(extractJson('```json\n{"answer":2}\n```')).toEqual({ answer: 2 });
  });

  test("extractJson rejects garbage", () => {
    expect(() => extractJson("hello world")).toThrow();
  });

  test("OpenAiCompatibleProvider constructor reads env defaults without network", () => {
    const savedBase = process.env.LLM_BASE_URL;
    const savedKey = process.env.LLM_API_KEY;
    const savedModel = process.env.LLM_MODEL;
    delete process.env.LLM_BASE_URL;
    delete process.env.LLM_API_KEY;
    delete process.env.LLM_MODEL;
    try {
      const provider = new OpenAiCompatibleProvider();
      expect(provider.baseUrl).toBe("https://api.meta.ai/v1");
      expect(provider.model).toBe("spark");
      expect(provider.apiKey).toBeUndefined();
    } finally {
      if (savedBase !== undefined) process.env.LLM_BASE_URL = savedBase;
      if (savedKey !== undefined) process.env.LLM_API_KEY = savedKey;
      if (savedModel !== undefined) process.env.LLM_MODEL = savedModel;
    }
  });

  test("OpenAiCompatibleProvider constructor picks up env values", () => {
    const savedBase = process.env.LLM_BASE_URL;
    const savedKey = process.env.LLM_API_KEY;
    const savedModel = process.env.LLM_MODEL;
    process.env.LLM_BASE_URL = "https://example.test/v1";
    process.env.LLM_API_KEY = "secret";
    process.env.LLM_MODEL = "custom";
    try {
      const provider = new OpenAiCompatibleProvider();
      expect(provider.baseUrl).toBe("https://example.test/v1");
      expect(provider.apiKey).toBe("secret");
      expect(provider.model).toBe("custom");
    } finally {
      if (savedBase !== undefined) process.env.LLM_BASE_URL = savedBase;
      else delete process.env.LLM_BASE_URL;
      if (savedKey !== undefined) process.env.LLM_API_KEY = savedKey;
      else delete process.env.LLM_API_KEY;
      if (savedModel !== undefined) process.env.LLM_MODEL = savedModel;
      else delete process.env.LLM_MODEL;
    }
  });
});
