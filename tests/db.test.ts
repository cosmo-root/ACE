import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { describe, expect, it } from "vitest";
import { attempts, lessons, topicRecords, topics } from "../src/db/schema";

const MIGRATIONS_DIR = join(__dirname, "..", "drizzle");

async function applyMigrations(client: PGlite): Promise<void> {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  expect(files.length).toBeGreaterThan(0);
  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    // Migration files separate statements with `--> statement-breakpoint`.
    // Split on the marker, drop empties, exec each chunk (each chunk is
    // one statement; trailing ";" is fine for PGlite.exec).
    const chunks = sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const chunk of chunks) {
      await client.exec(chunk);
    }
  }
}

describe("drizzle migrations against real Postgres (PGlite)", () => {
  // PGlite boots a WASM Postgres on first use; allow generous time.
  it("applies migrations and round-trips topic+lesson+attempt+record", async () => {
    const client = new PGlite();
    try {
      await applyMigrations(client);
      const db = drizzle(client, { schema: { topics, lessons, attempts, topicRecords } });

      const now = new Date();
      await db.insert(topics).values({
        id: "t_optics",
        slug: "optics",
        title: "Optics",
        createdAt: now,
        updatedAt: now,
      });
      await db.insert(lessons).values({
        topicSlug: "optics",
        body: "Lenses bend light.",
        updatedAt: now,
      });
      await db.insert(attempts).values({
        id: "a_1",
        topicSlug: "optics",
        kind: "practice",
        correct: true,
        createdAt: now,
      });
      await db.insert(attempts).values({
        id: "a_2",
        topicSlug: "optics",
        kind: "practice",
        correct: false,
        createdAt: now,
      });
      await db.insert(attempts).values({
        id: "a_3",
        topicSlug: "optics",
        kind: "revisit",
        correct: null,
        createdAt: now,
      });
      await db.insert(topicRecords).values({
        topicSlug: "optics",
        status: "learning",
        updatedAt: now,
      });

      const gotTopics = await db.select().from(topics);
      expect(gotTopics).toHaveLength(1);
      expect(gotTopics[0]?.slug).toBe("optics");
      expect(gotTopics[0]?.title).toBe("Optics");

      const gotLessons = await db.select().from(lessons);
      expect(gotLessons).toHaveLength(1);
      expect(gotLessons[0]?.body).toBe("Lenses bend light.");

      const gotAttempts = await db.select().from(attempts);
      expect(gotAttempts).toHaveLength(3);
      const byId = new Map(gotAttempts.map((a) => [a.id, a.correct]));
      // Boolean round-trip: true stays true, false stays false, null stays null.
      expect(byId.get("a_1")).toBe(true);
      expect(byId.get("a_2")).toBe(false);
      expect(byId.get("a_3")).toBeNull();

      const gotRecords = await db.select().from(topicRecords);
      expect(gotRecords).toHaveLength(1);
      expect(gotRecords[0]?.status).toBe("learning");
    } finally {
      await client.close();
    }
  }, 60_000);

  it("enforces the lesson -> topic foreign key", async () => {
    const client = new PGlite();
    try {
      await applyMigrations(client);
      const db = drizzle(client, { schema: { topics, lessons, attempts, topicRecords } });

      // drizzle-orm wraps the Postgres error; the violation text lives on cause.
      const err = await db
        .insert(lessons)
        .values({
          topicSlug: "no-such-topic",
          body: "orphan",
          updatedAt: new Date(),
        })
        .then(
          () => null,
          (e: unknown) =>
            e instanceof Error
              ? `${e.message} :: ${(e as { cause?: { message?: string } }).cause?.message ?? ""}`
              : String(e)
        );
      expect(err).toMatch(/foreign key|violates/i);
    } finally {
      await client.close();
    }
  }, 60_000);
});
