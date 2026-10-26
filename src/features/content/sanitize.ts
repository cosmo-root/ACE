// Sanitize schema: default (GitHub-style) bans scripts, event handlers,
// iframes and javascript: URLs. We extend it for server-generated markup:
// KaTeX spans (class + style), callout <div>/<details> hooks, code
// highlighting classes/vars, block slots, heading ids.
//
// Two subtleties learned from the sanitizer's source (hast-util-sanitize):
// 1. hast property keys here are the literal keys plugins set: rehype
//    plugins use dashed `data-*` keys, while remark-rehype camelCases
//    `aria-*` to `ariaHidden`. Both spellings are allowlisted.
// 2. A tag-specific definition shadows the '*' wildcard, so widening a
//    rule (e.g. className on <a>) requires replacing the tag's own entry,
//    not just appending to '*'.
//
// Deliberate hole, documented: `style` is allowed because KaTeX and shiki
// emit deterministic server-side styles. Pair with a restrictive
// Content-Security-Policy if ACE ever renders untrusted third-party HTML.
// HUMAN: tighten this (drop `style`, allowlist per-tag classes) if ACE
// ever renders untrusted third-party HTML.
import { defaultSchema, type Options } from "rehype-sanitize";

type AttrList = NonNullable<Options["attributes"]>[string];
type AttrDef = AttrList[number];

const baseAttrs: Record<string, AttrList> = { ...(defaultSchema.attributes ?? {}) };

const shared: AttrDef[] = [
  "className",
  "style",
  "id",
  "ariaHidden",
  "data-block",
  "data-lang",
  "data-language",
  "data-line",
  "data-theme",
  "data-callout",
  "data-collapsible",
];

function defName(def: AttrDef): string {
  return Array.isArray(def) ? def[0] : def;
}

/** Tag's base rules minus anything `shared` widens, then the widenings. */
function widened(tag: string, extras: AttrDef[] = []): AttrList {
  const widenedNames = new Set([...shared, ...extras].map(defName));
  const kept = (baseAttrs[tag] ?? []).filter((d) => !widenedNames.has(defName(d)));
  return [...kept, ...shared, ...extras];
}

const TAGS_WITH_EXTRAS = [
  "a",
  "div",
  "span",
  "pre",
  "code",
  "details",
  "summary",
  "section",
  "mark",
  "nav",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
] as const;

const attributes: Record<string, AttrList> = { ...baseAttrs };
for (const tag of TAGS_WITH_EXTRAS) {
  // `nav` carries the server-rendered toc block's accessible name; the
  // base schema allows ariaLabel only on select tags, so widen it here.
  attributes[tag] = widened(
    tag,
    tag === "details" ? ["open"] : tag === "nav" ? ["ariaLabel"] : []
  );
}
if (!("details" in attributes)) attributes["details"] = widened("details", ["open"]);

export const aceSanitizeSchema = {
  ...defaultSchema,
  tagNames: Array.from(
    new Set([...(defaultSchema.tagNames ?? []), "details", "summary", "mark", "nav", "section"])
  ),
  attributes,
  protocols: {
    ...(defaultSchema.protocols ?? {}),
    // Base schema allows `srcSet` on <source> with no protocol check;
    // close the javascript:/data: bypass (verified by probe 2026-10-26).
    srcSet: ["http", "https"],
  },
};
