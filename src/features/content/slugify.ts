// Slug helpers shared by wikilinks, routes and the graph builder.
// HUMAN: this slug scheme is the canonical topic identity. If you want
// unicode slugs or a different scheme, change it here and in
// src/features/topics (permalinks) together.

export function slugifyTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

// Split a raw [[...]] body into target + optional alias.
// Obsidian uses [[target|alias]] and the pipeline configures
// remark-wiki-link with aliasDivider "|", so ONLY "|" splits here.
// (Splitting on ":" too would make the graph disagree with rendered links.)
export function splitWikilinkBody(body: string): { target: string; alias: string } {
  const bar = body.indexOf("|");
  if (bar >= 0) {
    return {
      target: body.slice(0, bar).trim(),
      alias: body.slice(bar + 1).trim() || body.slice(0, bar).trim(),
    };
  }
  const t = body.trim();
  return { target: t, alias: t };
}
