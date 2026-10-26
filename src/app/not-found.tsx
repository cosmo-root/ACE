import Link from "next/link";

export default function NotFound() {
  return (
    <section>
      <h1>Topic not found</h1>
      <p>This topic does not exist.</p>
      <Link href="/">Back home</Link>
    </section>
  );
}
