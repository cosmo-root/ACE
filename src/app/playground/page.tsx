// Playground preview runs on the CLIENT on this route only: the editor
// debounces input and POSTs to /api/render (same server pipeline as
// lessons), then mounts the sanitized HTML. Text routes stay server-only.
"use client";

import { useEffect, useState } from "react";
// NOTE: BlockMounts is imported from the leaf module, not the content
// barrel — the barrel re-exports the server-only pipeline (unified +
// shiki), which must never enter the client bundle.
import { BlockMounts } from "@/features/content/blocks";
import { MarkdownEditor } from "@/features/editor";

const STARTER = `# Playground

Try **markdown**, $x^2$ math, ==highlights==, and [[Quadratic Functions]] links.

> [!tip] Callouts work here
> Including collapsible ones.

\`\`\`mermaid
flowchart LR
    A[Type] --> B[Preview]
\`\`\`

\`\`\`plot
fn: sin(x)
x: -6.28 6.28
\`\`\`
`;

export default function PlaygroundPage() {
  const [source, setSource] = useState(STARTER);
  const [html, setHtml] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setError("");
      void fetch("/api/render", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: source }),
        signal: ctrl.signal,
      })
        .then(async (r) => {
          if (!r.ok) throw new Error(`render failed: ${r.status}`);
          const data = (await r.json()) as { html?: unknown };
          if (typeof data.html !== "string") throw new Error("bad render response");
          setHtml(data.html);
        })
        .catch((e: unknown) => {
          // Stale responses from superseded keystrokes abort silently.
          if (e instanceof Error && e.name === "AbortError") return;
          setError(e instanceof Error ? e.message : String(e));
        });
    }, 400);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [source]);

  return (
    <div>
      <h1>Playground</h1>
      <p>Editor on the left (progressively enhanced), live preview on the right.</p>
      <MarkdownEditor name="body" defaultValue={source} onChange={setSource} />
      <section aria-label="Preview">
        <h2>Preview</h2>
        <noscript>
          <p>
            Live preview needs JavaScript. Lesson pages render fully on
            the server — open any topic to read the rendered result.
          </p>
        </noscript>
        {error ? <p>Preview error: {error}</p> : <BlockMounts html={html} />}
      </section>
    </div>
  );
}
