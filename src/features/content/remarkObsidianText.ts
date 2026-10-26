// Hand-rolled remark plugin for two Obsidian text conventions:
//   ==highlight==  -> <mark>highlight</mark>
//   %%comment%%    -> removed (never rendered)
// No dependency: these are ~40 lines and every "just this" package found
// was stale or bundled with unrelated features. Operates on mdast text
// nodes only, so code spans/blocks and math are never touched.
//
// Limitations (documented, not bugs): markers must open and close inside
// one text run (formatting like ==a **b** c== ends the run early and the
// rest stays literal); inner == == content is treated as literal text.

interface MdNode {
  type: string;
  value?: string;
  children?: MdNode[];
  [key: string]: unknown;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const SKIP = new Set(["code", "inlineCode", "math", "html", "definition"]);

function transformTextNode(text: string): MdNode[] {
  // Strip %%comments%% first.
  const uncommented = text.replace(/%%[\s\S]*?%%/g, "");
  // Then split ==mark== runs into text + raw <mark> html nodes.
  const out: MdNode[] = [];
  const re = /==(.+?)==/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(uncommented)) !== null) {
    if (m.index > last) out.push({ type: "text", value: uncommented.slice(last, m.index) });
    out.push({ type: "html", value: `<mark>${escapeHtml(m[1])}</mark>` });
    last = m.index + m[0].length;
  }
  if (last < uncommented.length) out.push({ type: "text", value: uncommented.slice(last) });
  if (out.length === 0) out.push({ type: "text", value: "" });
  return out;
}

function walk(node: MdNode): void {
  if (!node || typeof node.type !== "string") return;
  if (SKIP.has(node.type)) return;
  const kids = node.children;
  if (!Array.isArray(kids)) return;
  const next: MdNode[] = [];
  for (const child of kids) {
    if (child.type === "text" && typeof child.value === "string") {
      next.push(...transformTextNode(child.value));
    } else {
      walk(child);
      next.push(child);
    }
  }
  node.children = next;
}

// remark plugin: () => transformer.
export function remarkObsidianText() {
  return (tree: MdNode) => {
    walk(tree);
  };
}
