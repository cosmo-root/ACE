// The markdown pipeline. Server-only: must never be imported by a
// 'use client' module (it pulls unified + shiki + katex into the bundle).
// Client interactivity for blocks lives in blocks.tsx, driven purely by
// the data-block slots this pipeline emits.
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import wikiLinkPlugin from "remark-wiki-link";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeCallouts from "rehype-callouts";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeKatex from "rehype-katex";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { remarkObsidianText } from "./remarkObsidianText";
import { rehypeBlockSlots, rehypeTocSlots } from "./rehypeBlockSlots";
import { rehypeHeadingIds, rehypeShiftHeadings, type Heading } from "./rehypeHeadingIds";
import { aceSanitizeSchema } from "./sanitize";
import { slugifyTitle, splitWikilinkBody } from "./slugify";

export type { Heading };

export interface RenderOptions {
  /** Slugs that count as existing topics (for wikilink styling). */
  permalinks?: string[];
}

export interface RenderResult {
  html: string;
  headings: Heading[];
}

/** Resolve a [[target]] to a topic slug (drops #section / ^block refs). */
export function wikilinkTargetToSlug(rawTarget: string): string {
  const cut = rawTarget.split("#")[0].split("^")[0];
  return slugifyTitle(cut);
}

// remark-wiki-link option shape (its bundled types are loose).
interface WikiLinkOptions {
  permalinks?: string[];
  pageResolver?: (name: string) => string[];
  hrefTemplate?: (permalink: string) => string;
  wikiLinkClassName?: string;
  newClassName?: string;
  aliasDivider?: string;
}

// Bounded in-memory render cache. The load test showed the sync
// remark/rehype/shiki chain saturating one Node process under parallel
// renders; lesson bodies repeat across navigations, so memoizing the
// pure (source, permalinks) -> HTML mapping is the cheapest lever.
// Cap: 100 entries, FIFO eviction. Pure function of input, so no
// invalidation story is needed. HUMAN: replace with a persistent cache
// (or ISR) if ACE ever serves many users from one process.
const RENDER_CACHE_MAX = 100;
// Completed renders (insertion-ordered for FIFO eviction) plus in-flight
// promises: concurrent renders of the same uncached source share one
// pipeline run instead of each paying the full shiki chain.
const renderCache = new Map<string, RenderResult>();
const inflight = new Map<string, Promise<RenderResult>>();

function cacheKey(source: string, permalinks: string[]): string {
  // JSON encoding: a naive join(",") conflates ["a,b"] with ["a","b"],
  // and a permalink containing "\n" would blur a string separator.
  return JSON.stringify({ source, permalinks: [...permalinks].sort() });
}

function copyResult(r: RenderResult): RenderResult {
  return { html: r.html, headings: r.headings.map((h) => ({ ...h })) };
}

export function renderCacheSize(): number {
  return renderCache.size;
}

export function clearRenderCache(): void {
  renderCache.clear();
  inflight.clear();
}

async function renderUncached(source: string, permalinks: string[]): Promise<RenderResult> {
  const headings: Heading[] = [];
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(wikiLinkPlugin, {
      permalinks,
      pageResolver: (name: string) => [wikilinkTargetToSlug(name)],
      hrefTemplate: (permalink: string) => `/topic/${permalink}`,
      wikiLinkClassName: "ace-wikilink",
      newClassName: "ace-wikilink-new",
      aliasDivider: "|",
    } satisfies WikiLinkOptions)
    .use(remarkObsidianText)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeCallouts)
    .use(rehypeBlockSlots)
    .use(rehypePrettyCode, { theme: "github-light" })
    .use(rehypeKatex)
    .use(rehypeShiftHeadings)
    .use(rehypeHeadingIds, headings)
    .use(rehypeTocSlots, headings)
    .use(rehypeSanitize, aceSanitizeSchema)
    .use(rehypeStringify)
    .process(source);
  return { html: String(file), headings };
}

export async function renderMarkdown(
  source: string,
  options: RenderOptions = {}
): Promise<RenderResult> {
  const permalinks = options.permalinks ?? [];
  const key = cacheKey(source, permalinks);
  const done = renderCache.get(key);
  if (done) return copyResult(done);
  const running = inflight.get(key);
  if (running) return copyResult(await running);
  const task = renderUncached(source, permalinks).then(
    (result) => {
      renderCache.set(key, result);
      if (renderCache.size > RENDER_CACHE_MAX) {
        const oldest = renderCache.keys().next();
        if (!oldest.done) renderCache.delete(oldest.value);
      }
      inflight.delete(key);
      return result;
    },
    (err: unknown) => {
      // Failures are never cached: the next caller retries fresh.
      inflight.delete(key);
      throw err;
    }
  );
  inflight.set(key, task);
  return copyResult(await task);
}

/**
 * Pure wikilink-target extraction (graph + backlinks). Excludes fenced
 * blocks, inline code spans, and math spans — the renderer never
 * linkifies inside those, so counting them would create phantom edges.
 */
export function extractWikilinks(source: string): string[] {
  const cleaned = source
    .replace(/```[\s\S]*?(?:```|$)/g, "")
    .replace(/`[^`\n]*`/g, "")
    .replace(/\$\$[\s\S]*?\$\$/g, "")
    .replace(/\$[^\n$]*\$/g, "");
  const found = new Set<string>();
  const re = /\[\[([^\]\n]+)\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleaned)) !== null) {
    const { target } = splitWikilinkBody(m[1]);
    const slug = wikilinkTargetToSlug(target);
    if (slug) found.add(slug);
  }
  return [...found];
}
