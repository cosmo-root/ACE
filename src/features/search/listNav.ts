export type ListNavDelta = -1 | 0 | 1;

// Map a key to a list-navigation step. Returns 0 for unrelated keys.
export function resolveListNavDelta(key: string): ListNavDelta {
  if (key === "j" || key === "ArrowDown") return 1;
  if (key === "k" || key === "ArrowUp") return -1;
  return 0;
}

// Next active index with wrap-around. current of -1 means "nothing
// active yet", so any step lands on the first/last entry. count of 0
// (empty list) always yields -1.
export function moveListIndex(
  current: number,
  delta: ListNavDelta,
  count: number,
): number {
  if (count <= 0 || delta === 0) return current < 0 || count <= 0 ? -1 : current;
  if (current < 0) return delta > 0 ? 0 : count - 1;
  return (current + delta + count) % count;
}
