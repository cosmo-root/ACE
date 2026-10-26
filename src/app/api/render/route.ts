import { z } from "zod";
import { renderMarkdown } from "@/features/content";

const RenderRequestSchema = z.object({
  body: z.string().max(200_000),
  permalinks: z.array(z.string().min(1)).max(5000).optional(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  const parsed = RenderRequestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }
  try {
    const { html } = await renderMarkdown(parsed.data.body, {
      permalinks: parsed.data.permalinks ?? [],
    });
    return Response.json({ html });
  } catch {
    return Response.json({ error: "render failed" }, { status: 400 });
  }
}
