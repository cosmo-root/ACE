import { describe, expect, it } from "vitest";
import { parsePlotSpec, type PlotSpec } from "../src/features/content/blocks";

describe("parsePlotSpec", () => {
  it("parses a single fn line", () => {
    expect(parsePlotSpec("fn: x^2")).toEqual({ data: [{ fn: "x^2" }] });
  });

  it("parses multiple fn lines in order with x and y ranges", () => {
    const spec: PlotSpec = parsePlotSpec("fn: x\nfn: x^2\nx: -10 10\ny: -5 5");
    expect(spec.data).toEqual([{ fn: "x" }, { fn: "x^2" }]);
    expect(spec.xMin).toBe(-10);
    expect(spec.xMax).toBe(10);
    expect(spec.yMin).toBe(-5);
    expect(spec.yMax).toBe(5);
  });

  it("ignores blank lines and # comments", () => {
    const spec = parsePlotSpec("\n# a comment\nfn: sin(x)\n\n   \n# another\n");
    expect(spec.data).toEqual([{ fn: "sin(x)" }]);
  });

  it("ignores indented comments", () => {
    const spec = parsePlotSpec("   # indented comment\nfn: cos(x)");
    expect(spec.data).toEqual([{ fn: "cos(x)" }]);
  });

  it("throws when no fn line is present", () => {
    expect(() => parsePlotSpec("")).toThrow(/at least one/);
  });

  it("throws when the source has only ranges and comments", () => {
    expect(() => parsePlotSpec("# just a comment\nx: -10 10")).toThrow(
      /at least one/,
    );
  });

  it("ignores malformed range lines but keeps valid fns", () => {
    const spec = parsePlotSpec("fn: x\nx: foo bar\ny: 1\nx: -- 10");
    expect(spec.data).toEqual([{ fn: "x" }]);
    expect(spec.xMin).toBeUndefined();
    expect(spec.xMax).toBeUndefined();
    expect(spec.yMin).toBeUndefined();
    expect(spec.yMax).toBeUndefined();
  });

  it("handles extra whitespace and case-insensitive keys", () => {
    const spec = parsePlotSpec("FN  :   x + 1\nX : -10   10\nY:  0  5");
    expect(spec.data).toEqual([{ fn: "x + 1" }]);
    expect(spec.xMin).toBe(-10);
    expect(spec.xMax).toBe(10);
    expect(spec.yMin).toBe(0);
    expect(spec.yMax).toBe(5);
  });

  it("keeps single-quoted expressions and trims surrounding spaces", () => {
    const spec = parsePlotSpec("fn:   'x^2'   ");
    expect(spec.data).toEqual([{ fn: "'x^2'" }]);
  });

  it("ignores unknown keys", () => {
    const spec = parsePlotSpec("fn: x\ntitle: hello\ncolor: red");
    expect(spec.data).toEqual([{ fn: "x" }]);
    expect(spec).not.toHaveProperty("title");
  });
});
