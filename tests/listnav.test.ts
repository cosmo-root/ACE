import { describe, expect, it } from "vitest";
import { moveListIndex, resolveListNavDelta } from "../src/features/search/listNav";

describe("resolveListNavDelta", () => {
  it("maps j/ArrowDown to +1 and k/ArrowUp to -1", () => {
    expect(resolveListNavDelta("j")).toBe(1);
    expect(resolveListNavDelta("ArrowDown")).toBe(1);
    expect(resolveListNavDelta("k")).toBe(-1);
    expect(resolveListNavDelta("ArrowUp")).toBe(-1);
  });

  it("ignores unrelated keys", () => {
    expect(resolveListNavDelta("Enter")).toBe(0);
    expect(resolveListNavDelta("x")).toBe(0);
  });
});

describe("moveListIndex", () => {
  it("starts at the first/last entry from nothing selected", () => {
    expect(moveListIndex(-1, 1, 3)).toBe(0);
    expect(moveListIndex(-1, -1, 3)).toBe(2);
  });

  it("wraps around both ends and stays put on empty lists", () => {
    expect(moveListIndex(2, 1, 3)).toBe(0);
    expect(moveListIndex(0, -1, 3)).toBe(2);
    expect(moveListIndex(-1, 1, 0)).toBe(-1);
  });
});
