"use client";

// Light markdown editor (CodeMirror 6, not Monaco). Plain <textarea> is the
// no-JS fallback: the form posts the same `body` field either way.
import { useEffect, useRef } from "react";

export function MarkdownEditor({
  name,
  defaultValue,
  onChange,
}: {
  name: string;
  defaultValue: string;
  onChange?: (value: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const host = hostRef.current;
    const fallback = textRef.current;
    if (!host || !fallback) return;
    let view: { destroy(): void } | null = null;
    let cancelled = false;
    void Promise.all([
      import("@codemirror/state"),
      import("@codemirror/view"),
      import("@codemirror/lang-markdown"),
    ]).then(([state, viewMod, md]) => {
      if (cancelled) return;
      const startDoc = fallback.value;
      const update = viewMod.EditorView.updateListener.of((u) => {
        if (u.docChanged) {
          const v = u.state.doc.toString();
          fallback.value = v;
          onChangeRef.current?.(v);
        }
      });
      const st = state.EditorState.create({
        doc: startDoc,
        extensions: [md.markdown(), update, viewMod.lineNumbers()],
      });
      view = new viewMod.EditorView({ state: st, parent: host });
      fallback.hidden = true;
    });
    return () => {
      cancelled = true;
      view?.destroy();
      if (fallback) fallback.hidden = false;
    };
  }, []);

  return (
    <div>
      <div ref={hostRef} aria-label="Markdown editor" />
      <textarea
        ref={textRef}
        name={name}
        aria-label="Lesson markdown source"
        defaultValue={defaultValue}
        // Keystrokes typed before the CodeMirror chunks load must not be
        // lost: forward them until the editor takes over (it hides this).
        onChange={(e) => onChangeRef.current?.(e.target.value)}
        rows={20}
        cols={80}
      />
    </div>
  );
}
