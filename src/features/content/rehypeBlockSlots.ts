import type { Heading } from "./rehypeHeadingIds";

// Block registry: the map from fenced-code language to an interactive block.
// ADD A BLOCK TYPE BY ADDING ONE ENTRY HERE plus one dynamic import in
// blocks.tsx — unless the block is fully server-rendered like `toc`,
// which needs no client renderer (BlockMounts leaves slots without a
// renderer untouched). Server rendering always emits the source text, so
// a block degrades to readable source with JS off or on render error.

export interface BlockType {
  /** Fence language, e.g. ```mermaid -> "mermaid". */
  language: string;
  /** Short human label used in the no-JS fallback. */
  label: string;
  /** Short description of the expected source format. */
  hint: string;
}

export const BLOCK_TYPES: Record<string, BlockType> = {
  mermaid: {
    language: "mermaid",
    label: "Diagram",
    hint: "Mermaid diagram source (flowchart, sequence, class, ...)",
  },
  plot: {
    language: "plot",
    label: "Plot",
    hint: "One `fn: <expression>` line per series, e.g. `fn: x^2`",
  },
  toc: {
    language: "toc",
    label: "Contents",
    hint: "Table of contents of the current document (fence body is ignored)",
  },
};

export function isBlockLanguage(language: string | undefined): boolean {
  return !!language && language in BLOCK_TYPES;
}

// Minimal hast node shape (structural; avoids coupling to hast versions).
interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  value?: string;
}

function codeLanguage(preChild: HastNode): string | undefined {
  if (preChild.type !== "element" || preChild.tagName !== "code") return undefined;
  const props = preChild.properties ?? {};
  const cls = props["className"];
  const classes = Array.isArray(cls) ? cls : [];
  for (const c of classes) {
    const s = String(c);
    if (s.startsWith("language-")) return s.slice("language-".length);
  }
  if (typeof props["dataLanguage"] === "string") return props["dataLanguage"];
  return undefined;
}

function textOf(node: HastNode): string {
  if (node.type === "text") return node.value ?? "";
  if (!node.children) return "";
  return node.children.map(textOf).join("");
}

function walk(node: HastNode): void {
  if (!node.children) return;
  node.children = node.children.map((child) => {
    if (
      child.type === "element" &&
      child.tagName === "pre" &&
      child.children &&
      child.children.length === 1
    ) {
      const lang = codeLanguage(child.children[0]);
      if (isBlockLanguage(lang)) {
        const source = textOf(child);
        const block: HastNode = {
          type: "element",
          tagName: "div",
          properties: {
            className: ["ace-block"],
            // Dashed keys on purpose: the sanitizer matches property keys
            // literally, and dashed `data-*` is the HTML convention.
            "data-block": lang,
            "data-lang": lang,
          },
          // Source ships inside a native <details> so it is collapsible
          // with JS disabled too. The client enhancer
          // (wrapSourceInDetails) skips pres that are already wrapped.
          children: [
            {
              type: "element",
              tagName: "details",
              // properties must exist (even empty): later plugins such
              // as rehype-katex read node.properties.className on every
              // element and crash on undefined.
              properties: {},
              children: [
                {
                  type: "element",
                  tagName: "summary",
                  properties: {},
                  children: [{ type: "text", value: "Source" }],
                },
                {
                  type: "element",
                  tagName: "pre",
                  properties: { className: ["ace-block-source"] },
                  children: [{ type: "text", value: source }],
                },
              ],
            },
          ],
        };
        return block;
      }
    }
    walk(child);
    return child;
  });
}

// rehype plugin: () => transformer.
export function rehypeBlockSlots() {
  return (tree: HastNode) => {
    walk(tree);
  };
}

function textNode(value: string): HastNode {
  return { type: "text", value };
}

/**
 * Usable link list for one `toc` slot. Anchor targets use the same
 * `user-content-` prefix the sanitizer applies to heading ids (see
 * rehypeHeadingIds), so the links work with JS disabled. An empty text
 * falls back to the id so the link is never an empty anchor.
 */
function tocNav(headings: Heading[]): HastNode {
  return {
    type: "element",
    tagName: "nav",
    // Distinct from the page-level <Toc> ("Table of contents") so a
    // lesson with a toc fence never ships two identically-named
    // navigation landmarks. Matches the visible "Contents" caption.
    properties: { ariaLabel: "Contents" },
    children: [
      {
        type: "element",
        tagName: "p",
        // properties required on every hand-built node (see slot
        // details note above): later plugins read properties blindly.
        properties: {},
        children: [textNode("Contents")],
      },
      {
        type: "element",
        tagName: "ul",
        properties: {},
        children: headings.map((h) => ({
          type: "element",
          tagName: "li",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "a",
              properties: { href: `#user-content-${h.id}` },
              children: [textNode(h.text || h.id)],
            },
          ],
        })),
      },
    ],
  };
}

function tocNotice(): HastNode {
  return {
    type: "element",
    tagName: "p",
    // Empty properties: see the rehype-katex note on the slot details.
    properties: {},
    children: [textNode("No headings in this document.")],
  };
}

function expandTocSlots(node: HastNode, headings: Heading[]): void {
  for (const child of node.children ?? []) {
    if (
      child.type === "element" &&
      child.tagName === "div" &&
      child.properties?.["data-block"] === "toc"
    ) {
      // Never crash on edge cases: no headings, or a fence body of any
      // shape (the body is ignored — the TOC covers the whole document).
      const filler = headings.length > 0 ? tocNav(headings) : tocNotice();
      child.children = [...(child.children ?? []), filler];
    }
    expandTocSlots(child, headings);
  }
}

// rehype plugin factory: rehypeTocSlots(headings). Must run AFTER
// rehypeHeadingIds (same shared collector array) and BEFORE sanitize:
// it appends the server-rendered nav into each toc slot, so the block
// is complete HTML with JS disabled and needs no client renderer.
export function rehypeTocSlots(headings: Heading[]) {
  return (tree: HastNode) => {
    expandTocSlots(tree, headings);
  };
}
