// Assigns deterministic ids to headings (h1..h6) and optionally collects
// them for a table of contents. Ids are later prefixed `user-content-`
// by the sanitizer's clobber protection; TOC links apply the same prefix.
import { slugifyTitle } from "./slugify";

export interface Heading {
  depth: number;
  id: string;
  text: string;
}

interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  value?: string;
}

function textOf(node: HastNode): string {
  if (node.type === "text") return node.value ?? "";
  if (!node.children) return "";
  return node.children.map(textOf).join("");
}

/**
 * Shift every heading down one level (h1 -> h2, …, h5 -> h6, h6 stays).
 * Lesson content is embedded under the page's own <h1>, so embedded h1s
 * would break the one-h1-per-page structure. Run before rehypeHeadingIds.
 */
export function rehypeShiftHeadings() {
  const shift = (node: HastNode): void => {
    if (
      node.type === "element" &&
      node.tagName &&
      /^h[1-6]$/.test(node.tagName)
    ) {
      const depth = Math.min(Number(node.tagName[1]) + 1, 6);
      node.tagName = `h${depth}`;
    }
    for (const child of node.children ?? []) shift(child);
  };
  return (tree: HastNode) => {
    shift(tree);
  };
}

function walk(node: HastNode, seen: Map<string, number>, out: Heading[]): void {
  if (node.type === "element" && node.tagName && /^h[1-6]$/.test(node.tagName)) {
    const depth = Number(node.tagName[1]);
    const text = textOf(node).trim();
    const base = slugifyTitle(text) || "section";
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    const id = n === 0 ? base : `${base}-${n}`;
    node.properties = { ...(node.properties ?? {}), id };
    out.push({ depth, id, text });
  }
  for (const child of node.children ?? []) walk(child, seen, out);
}

// rehype plugin factory: rehypeHeadingIds(collector?).
export function rehypeHeadingIds(collector?: Heading[]) {
  return (tree: HastNode) => {
    walk(tree, new Map(), collector ?? []);
  };
}
