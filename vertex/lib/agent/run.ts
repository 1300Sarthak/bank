import "server-only";
import OpenAI from "openai";
import { financialTools } from "@/lib/tools/definitions";
import { executeTool } from "@/lib/tools/executor";
import { SYSTEM_PROMPT } from "./prompts";

const MAX_ITERATIONS = 10;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ProviderConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  name: string;
}

function resolveProvider(): ProviderConfig | null {
  // 1. BLACKBOX AI (user's primary choice)
  if (process.env.BLACKBOXAIAPI) {
    return {
      baseURL: "https://api.blackbox.ai/v1",
      apiKey: process.env.BLACKBOXAIAPI,
      model: process.env.BLACKBOX_MODEL || "moonshotai/Kimi-K2-Instruct",
      name: "BLACKBOX AI",
    };
  }
  // 2. Groq free tier — get key at console.groq.com
  if (process.env.GROQ_API_KEY) {
    return {
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      name: "Groq",
    };
  }
  // 3. OpenAI fallback
  if (process.env.OPENAI_API_KEY) {
    return {
      baseURL: "https://api.openai.com/v1",
      apiKey: process.env.OPENAI_API_KEY,
      model: "gpt-4o-mini",
      name: "OpenAI",
    };
  }
  return null;
}

export async function* runAgent(
  messages: ChatMessage[],
  onToolUse?: (name: string, input: Record<string, unknown>) => void
): AsyncGenerator<string> {
  const provider = resolveProvider();

  if (!provider) {
    yield [
      "**No AI API key configured.** Set one of the following in `.env.local`:",
      "",
      "- `BLACKBOXAIAPI` — BLACKBOX AI (top up at blackbox.ai if balance < $2)",
      "- `GROQ_API_KEY` — Groq free tier (get key at console.groq.com)",
      "- `OPENAI_API_KEY` — OpenAI",
    ].join("\n");
    return;
  }

  const client = new OpenAI({
    baseURL: provider.baseURL,
    apiKey: provider.apiKey,
  });

  const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    let response: OpenAI.Chat.ChatCompletion;
    try {
      response = await client.chat.completions.create({
        model: provider.model,
        max_tokens: 8192,
        tools: financialTools,
        messages: openaiMessages,
      });
    } catch (err) {
      // Surface actionable errors instead of a generic crash
      const e = err as { status?: number; message?: string; error?: { message?: string } };
      const detail = e.error?.message ?? e.message ?? String(err);

      if (e.status === 402 || detail.includes("credits") || detail.includes("balance")) {
        yield [
          `**${provider.name} — Insufficient credits.**`,
          "",
          detail,
          "",
          provider.name === "BLACKBOX AI"
            ? "Top up at **blackbox.ai**, or add a free `GROQ_API_KEY` to `.env.local` (get one at console.groq.com)."
            : "Please add credits to your account.",
        ].join("\n");
      } else if (e.status === 401) {
        yield `**${provider.name} — Invalid API key.** Check that \`${provider.name === "BLACKBOX AI" ? "BLACKBOXAIAPI" : "GROQ_API_KEY"}\` is correct in \`.env.local\`.`;
      } else if (e.status === 429) {
        yield `**${provider.name} — Rate limited.** Please wait a moment and try again.`;
      } else {
        yield `**${provider.name} error (${e.status ?? "unknown"}): ${detail}**`;
      }
      return;
    }

    const choice = response.choices[0];
    if (!choice) break;

    const message = choice.message;

    // Yield text content
    if (message.content) {
      yield message.content;
    }

    // No tool calls — done
    if (!message.tool_calls || message.tool_calls.length === 0) {
      break;
    }

    // Add the full assistant message (with tool_calls) to history
    openaiMessages.push(message);

    // Execute each tool call and collect results
    for (const toolCall of message.tool_calls) {
      if (toolCall.type !== "function") continue;
      const name = toolCall.function.name;
      let input: Record<string, unknown> = {};
      try {
        input = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
      } catch {
        // Malformed arguments — pass empty object
      }

      onToolUse?.(name, input);

      const result = await executeTool(name, input);

      openaiMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result,
      });
    }
  }
}
