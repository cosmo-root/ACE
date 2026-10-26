"use client";

// Client-side enhancer for server-rendered block slots. The server always
// emits the source text inside [data-block]; this component progressively
// replaces each slot with the interactive rendering. No-JS and error states
// keep the readable source. Heavy libraries load only on routes that
// actually contain their block type, via dynamic import().

import { useEffect, useRef } from "react";

let mermaidReady: Promise<unknown> | null = null;

function loadMermaid(): Promise<typeof import("mermaid")> {
  if (!mermaidReady) {
    mermaidReady = import("mermaid")
      .then((mod) => {
        const mermaid = mod.default;
        // Strict mode makes mermaid sanitize diagram labels itself
        // (it bundles DOMPurify for this); our server sanitizer never
        // sees compiler output, so strict is load-bearing. Do not relax.
        mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });
        return mod;
      })
      .catch((err: unknown) => {
        // A rejected load must not poison later renders (offline blip,
        // flaky chunk): reset so the next slot retries the import.
        mermaidReady = null;
        throw err;
      });
  }
  return mermaidReady as Promise<typeof import("mermaid")>;
}

async function renderMermaid(el: HTMLElement, source: string): Promise<void> {
  // Wrap first so success AND failure keep the source collapsible.
  wrapSourceInDetails(el);
  try {
    const { default: mermaid } = await loadMermaid();
    const id = `ace-mmd-${Math.random().toString(36).slice(2, 10)}`;
    const { svg } = await mermaid.render(id, source);
    const figure = document.createElement("figure");
    figure.setAttribute("data-block-rendered", "mermaid");
    figure.setAttribute("role", "img");
    figure.setAttribute("aria-label", "Diagram");
    figure.innerHTML = svg;
    const caption = document.createElement("figcaption");
    caption.textContent = "Diagram";
    figure.appendChild(caption);
    el.appendChild(figure);
  } catch (err) {
    const note = document.createElement("p");
    note.textContent = `Diagram error: ${err instanceof Error ? err.message : String(err)}`;
    el.appendChild(note);
  }
}

export interface PlotSpec {
  data: Array<{ fn: string }>;
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
}

export function parsePlotSpec(source: string): PlotSpec {
  const spec: PlotSpec = { data: [] };
  for (const rawLine of source.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const fn = line.match(/^fn\s*:\s*(.+)$/i);
    if (fn) {
      spec.data.push({ fn: fn[1].trim() });
      continue;
    }
    const range = line.match(/^([xy])\s*:\s*(-?[\d.]+)\s+(-?[\d.]+)$/i);
    if (range) {
      const lo = Number(range[2]);
      const hi = Number(range[3]);
      if (Number.isFinite(lo) && Number.isFinite(hi)) {
        if (range[1].toLowerCase() === "x") {
          spec.xMin = lo;
          spec.xMax = hi;
        } else {
          spec.yMin = lo;
          spec.yMax = hi;
        }
      }
    }
  }
  if (spec.data.length === 0) throw new Error("plot block needs at least one `fn: <expression>` line");
  return spec;
}

async function renderPlot(el: HTMLElement, source: string): Promise<void> {
  const target = document.createElement("div");
  target.setAttribute("data-block-rendered", "plot");
  target.setAttribute("aria-label", "Function plot");
  wrapSourceInDetails(el);
  el.appendChild(target);
  try {
    const spec = parsePlotSpec(source);
    const { default: functionPlot } = await import("function-plot");
    functionPlot({
      target,
      width: 560,
      height: 360,
      disableZoom: true,
      xAxis: spec.xMin !== undefined ? { domain: [spec.xMin, spec.xMax!] } : undefined,
      yAxis: spec.yMin !== undefined ? { domain: [spec.yMin, spec.yMax!] } : undefined,
      data: spec.data,
    });
  } catch (err) {
    target.remove();
    const note = document.createElement("p");
    note.textContent = `Plot error: ${err instanceof Error ? err.message : String(err)}`;
    el.appendChild(note);
  }
}

/**
 * Keep the source available to everyone: move the <pre> into a native
 * <details> instead of hiding it, so keyboard and screen-reader users
 * keep both the rendering and its source. No CSS needed.
 */
function wrapSourceInDetails(el: HTMLElement): void {
  const pre = el.querySelector("pre");
  // The server already wraps slot sources in <details> (so no-JS users
  // get the collapsible source); only wrap client-side when missing.
  if (!pre || pre.parentElement?.tagName === "DETAILS") return;
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "Source";
  details.appendChild(summary);
  pre.replaceWith(details);
  details.appendChild(pre);
}

const RENDERERS: Record<string, (el: HTMLElement, source: string) => Promise<void>> = {
  mermaid: renderMermaid,
  plot: renderPlot,
};

export function BlockMounts({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const slots = root.querySelectorAll<HTMLElement>("[data-block]:not([data-block-done])");
    slots.forEach((slot) => {
      slot.setAttribute("data-block-done", "true");
      const kind = slot.getAttribute("data-block") ?? "";
      const pre = slot.querySelector("pre");
      const source = (pre?.textContent ?? "").trim();
      if (!source) return;
      const render = RENDERERS[kind];
      if (!render) return;
      void render(slot, source);
    });
  }, [html]);
  // Sanitized server-side (see sanitize.ts); innerHTML is the transport.
  return <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}
