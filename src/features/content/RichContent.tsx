// Server component: lesson markdown -> sanitized HTML + client enhancers.
// Text-only pages ship ~no client JS: only BlockMounts (a small scanner;
// mermaid/function-plot split into lazy chunks loaded on demand).
import { BlockMounts } from "./blocks";
import { renderMarkdown, type Heading } from "./pipeline";

export type { Heading };

export async function RichContent({
  source,
  permalinks = [],
}: {
  source: string;
  permalinks?: string[];
}) {
  const { html, headings } = await renderMarkdown(source, { permalinks });
  return (
    <>
      {html.includes("katex") && (
        <>
          {/* eslint-disable-next-line @next/next/no-css-tags -- vendored KaTeX CSS, loaded only on pages that render math (no global stylesheet). */}
          <link rel="stylesheet" href="/vendor/katex/katex.min.css" />
        </>
      )}
      <article>
        <BlockMounts html={html} />
      </article>
      <Toc headings={headings} />
    </>
  );
}

export function Toc({ headings }: { headings: Heading[] }) {
  if (headings.length === 0) return null;
  return (
    <nav aria-label="Table of contents">
      <p>Contents</p>
      <ul>
        {headings.map((h) => (
          <li key={h.id}>
            <a href={`#user-content-${h.id}`}>{h.text || h.id}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
