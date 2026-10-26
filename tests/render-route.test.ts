import { afterEach, describe, expect, it, vi } from "vitest";

// `@/*` resolves via vitest.config.ts resolve.alias, so route handlers
// are imported directly and run their genuine logic.
import { POST as renderPOST } from "../src/app/api/render/route";
import { POST as lessonPOST } from "../src/app/api/harness/lesson/route";

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("/api/render", () => {
  it("rejects invalid JSON with 400", async () => {
    const res = await renderPOST(jsonRequest("http://localhost/api/render", "not json{{"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid JSON" });
  });

  it("rejects an overlong body with 400", async () => {
    const res = await renderPOST(
      jsonRequest("http://localhost/api/render", { body: "x".repeat(200_001) })
    );
    expect(res.status).toBe(400);
  });

  it("rejects a missing body with 400", async () => {
    const res = await renderPOST(jsonRequest("http://localhost/api/render", {}));
    expect(res.status).toBe(400);
  });

  it("renders markdown to HTML with 200", async () => {
    const res = await renderPOST(
      jsonRequest("http://localhost/api/render", {
        body: "# Hello\n\nSome **bold** text\n",
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    // Embedded h1s demote to h2 (the page owns the single h1).
    expect(json.html).toContain('<h2 id="user-content-hello">Hello</h2>');
    expect(json.html).not.toContain("<h1");
    expect(json.html).toContain("<strong>bold</strong>");
  });
});

describe("/api/harness/lesson", () => {
  it("rejects invalid JSON with 400", async () => {
    const res = await lessonPOST(
      jsonRequest("http://localhost/api/harness/lesson", "not json{{")
    );
    expect(res.status).toBe(400);
  });

  it("rejects an empty prompt with 400", async () => {
    const res = await lessonPOST(
      jsonRequest("http://localhost/api/harness/lesson", { prompt: "" })
    );
    expect(res.status).toBe(400);
  });

  it("rejects a missing prompt with 400", async () => {
    const res = await lessonPOST(
      jsonRequest("http://localhost/api/harness/lesson", {})
    );
    expect(res.status).toBe(400);
  });

  it("returns the canned lesson JSON via the mock provider when LLM_API_KEY is unset", async () => {
    const savedKey = process.env.LLM_API_KEY;
    delete process.env.LLM_API_KEY;
    try {
      const res = await lessonPOST(
        jsonRequest("http://localhost/api/harness/lesson", { prompt: "teach me fractions" })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.topicSlug).toBe("canned-topic");
      expect(json.body).toContain("Canned lesson");
    } finally {
      if (savedKey !== undefined) process.env.LLM_API_KEY = savedKey;
    }
  });

  it("returns 502 when the provider returns garbage twice", async () => {
    const savedKey = process.env.LLM_API_KEY;
    process.env.LLM_API_KEY = "test-key-for-502-path";
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      async () => {
        calls += 1;
        return new Response(
          JSON.stringify({ choices: [{ message: { content: "not json at all" } }] }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
    );
    try {
      const res = await lessonPOST(
        jsonRequest("http://localhost/api/harness/lesson", { prompt: "teach me fractions" })
      );
      expect(res.status).toBe(502);
      const json = await res.json();
      expect(typeof json.error).toBe("string");
      // One initial attempt plus exactly one retry.
      expect(calls).toBe(2);
    } finally {
      if (savedKey !== undefined) process.env.LLM_API_KEY = savedKey;
      else delete process.env.LLM_API_KEY;
      vi.unstubAllGlobals();
    }
  });
});
