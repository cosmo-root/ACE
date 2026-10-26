import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ACE — Actually Comprehend Everything",
  description: "Say what you want to study. Get a short lesson, prove it, revisit it.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header>
          <nav>
            <Link href="/">ACE</Link> <Link href="/playground">Playground</Link>{" "}
            <Link href="/graph">Graph</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
