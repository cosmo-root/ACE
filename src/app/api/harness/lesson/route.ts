import { z } from "zod";
import { LessonSchema } from "@/features/topics/schemas";
import {
  generateLesson,
  MockLlmProvider,
  OpenAiCompatibleProvider,
} from "@/harness";

const LessonRequestSchema = z.object({
  prompt: z.string().min(1).max(20000),
});

function cannedLessonJson(): string {
  return JSON.stringify({
    topicSlug: "canned-topic",
    body: "# Canned lesson",
    updatedAt: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  const parsed = LessonRequestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }
  const provider =
    process.env.LLM_API_KEY !== undefined && process.env.LLM_API_KEY !== ""
      ? new OpenAiCompatibleProvider()
      : new MockLlmProvider(cannedLessonJson());
  try {
    // HUMAN: the caller owns prompt design — the route passes the
    // request prompt through to the provider untouched.
    const lesson = await generateLesson(provider, parsed.data.prompt, LessonSchema);
    return Response.json(lesson);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "harness request failed" },
      { status: 502 },
    );
  }
}
