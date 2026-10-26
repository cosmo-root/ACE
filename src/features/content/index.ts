// Public API of the content feature. Other features may import ONLY
// from here (never sibling files directly). Wraps: unified/remark/rehype,
// katex (CSS via /vendor), mermaid, function-plot.
export {
  renderMarkdown,
  extractWikilinks,
  wikilinkTargetToSlug,
  renderCacheSize,
  clearRenderCache,
} from "./pipeline";
export type { RenderOptions, RenderResult, Heading } from "./pipeline";
export { BLOCK_TYPES, isBlockLanguage } from "./rehypeBlockSlots";
export type { BlockType } from "./rehypeBlockSlots";
export { RichContent, Toc } from "./RichContent";
export { BlockMounts } from "./blocks";
export { slugifyTitle, splitWikilinkBody } from "./slugify";
