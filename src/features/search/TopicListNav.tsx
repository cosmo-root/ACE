"use client";

import { useEffect, useRef, useState } from "react";
import { moveListIndex, resolveListNavDelta } from "./listNav";
import type { QuickSwitcherTopic } from "./QuickSwitcher";

// Progressive enhancement for the home topic list. Server output is a
// plain <ul> of links, identical to the no-JS markup, so without JS the
// list keeps working as ordinary links. With JS, j/k (or ArrowUp/Down)
// move focus across the links; Enter follows the focused link natively.
export function TopicListNav({ topics }: { topics: QuickSwitcherTopic[] }) {
  const [active, setActive] = useState(-1);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      // Modified keys belong to the browser/chrome — never claim them.
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // Only drive the list when focus is on the page body or inside
      // the list itself. Never steal keys from form fields, editable
      // text, buttons, links, or the QuickSwitcher dialog: pressing j
      // on a header control must not yank focus into the list, and
      // ArrowUp/Down must keep scrolling the page elsewhere.
      if (
        !target ||
        target.closest("input, textarea, select, dialog") ||
        target.isContentEditable ||
        (target !== document.body && !listRef.current?.contains(target))
      )
        return;
      const delta = resolveListNavDelta(e.key);
      if (delta === 0) return;
      e.preventDefault();
      setActive((current) => {
        const next = moveListIndex(current, delta, topics.length);
        linkRefs.current[next]?.focus();
        return next;
      });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [topics.length]);

  return (
    <ul ref={listRef}>
      {topics.map((t, i) => (
        <li key={t.slug}>
          <a
            ref={(node) => {
              linkRefs.current[i] = node;
            }}
            href={`/topic/${t.slug}`}
            data-active={i === active ? "true" : undefined}
          >
            {t.title}
          </a>
        </li>
      ))}
    </ul>
  );
}
