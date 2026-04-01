import { NextRequest } from "next/server";
import { runAgent } from "@/lib/agent/run";
import { checkRateLimit } from "@/lib/ratelimit";
import getDb from "@/lib/db";

export async function POST(req: NextRequest) {
  if (!checkRateLimit("chat")) {
    return new Response(JSON.stringify({ error: "Rate limited" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages } = await req.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "Messages required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const toolCalls: { name: string; input: Record<string, unknown> }[] = [];
  const lastUserMessage = messages[messages.length - 1]?.content ?? "";

  const stream = new ReadableStream({
    async start(controller) {
      let finalResponse = "";
      try {
        const generator = runAgent(messages, (name, input) => {
          toolCalls.push({ name, input });
          // Send tool use event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "tool_use", name, input })}\n\n`
            )
          );
        });

        for await (const chunk of generator) {
          finalResponse += chunk;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "text", content: chunk })}\n\n`
            )
          );
        }

        // Persist session to DB
        try {
          const db = getDb();
          db.prepare(
            "INSERT INTO ai_sessions (query, response, tool_calls) VALUES (?, ?, ?)"
          ).run(
            lastUserMessage,
            finalResponse,
            JSON.stringify(toolCalls.map((tc) => tc.name))
          );
        } catch {
          // Non-fatal: don't fail the stream if DB write fails
        }

        // Send done event with tool call summary
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "done", toolCalls })}\n\n`
          )
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
