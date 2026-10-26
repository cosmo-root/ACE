"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section>
      <h1>Something went wrong</h1>
      <p>{error.message}</p>
      <button type="button" onClick={reset}>
        Try again
      </button>{" "}
      <Link href="/">Back home</Link>
    </section>
  );
}
