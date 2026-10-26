"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type QuickSwitcherTopic = {
  slug: string;
  title: string;
};

export function QuickSwitcher({ topics }: { topics: QuickSwitcherTopic[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    triggerRef.current?.focus();
  }, []);

  const toggle = useCallback(() => {
    // Route every close through close() so the query clears and focus
    // returns to the trigger — a bare setOpen(false) skips both.
    if (open) close();
    else setOpen(true);
  }, [open, close]);

  const go = useCallback(
    (slug: string) => {
      close();
      router.push(`/topic/${slug}`);
    },
    [close, router],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      } else if (e.key === "Escape" && open) {
        close();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, close, open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (open) inputRef.current?.focus();
  }, [open ]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? topics.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q),
      )
    : topics;

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
        Jump to topic (Ctrl+K)
      </button>
      <dialog ref={dialogRef} aria-label="Jump to topic" onClose={close}>
        <button type="button" onClick={close}>
          Close
        </button>
        <input
          ref={inputRef}
          type="text"
          aria-label="Filter topics"
          placeholder="Type to filter topics"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && filtered.length > 0) go(filtered[0].slug);
          }}
        />
        <ul>
          {filtered.map((t) => (
            <li key={t.slug}>
              <button type="button" onClick={() => go(t.slug)}>
                {t.title}
              </button>
            </li>
          ))}
        </ul>
      </dialog>
    </>
  );
}
