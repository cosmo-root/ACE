import { describe, expect, it } from "vitest";
import { BLOCK_TYPES, isBlockLanguage } from "../src/features/content";

describe("block registry", () => {
  it("registers mermaid, plot, and toc with hints", () => {
    expect(Object.keys(BLOCK_TYPES).sort()).toEqual(["mermaid", "plot", "toc"]);
    for (const key of ["mermaid", "plot", "toc"] as const) {
      expect(BLOCK_TYPES[key].language).toBe(key);
      expect(BLOCK_TYPES[key].hint.length).toBeGreaterThan(0);
    }
  });

  it("matches fence languages exactly", () => {
    expect(isBlockLanguage("mermaid")).toBe(true);
    expect(isBlockLanguage("plot")).toBe(true);
    expect(isBlockLanguage("toc")).toBe(true);
    expect(isBlockLanguage("python")).toBe(false);
    expect(isBlockLanguage(undefined)).toBe(false);
    expect(isBlockLanguage("Mermaid")).toBe(false);
  });
});
