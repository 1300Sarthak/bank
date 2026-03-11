"use client";

import ToolCallBadge from "./ToolCallBadge";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: { name: string; input: Record<string, unknown> }[];
}

function renderMarkdown(text: string) {
  // Simple markdown: bold, code blocks, inline code, bullets, headers
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      result.push(
        <pre
          key={i}
          style={{
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "10px 12px",
            fontSize: 12,
            overflowX: "auto",
            margin: "6px 0",
            fontFamily: "monospace",
          }}
        >
          {codeLines.join("\n")}
        </pre>
      );
      i++;
      continue;
    }

    // Heading
    if (line.startsWith("### ")) {
      result.push(<h4 key={i} style={{ margin: "10px 0 4px", fontSize: 13, fontWeight: 700 }}>{inlineFormat(line.slice(4))}</h4>);
    } else if (line.startsWith("## ")) {
      result.push(<h3 key={i} style={{ margin: "10px 0 4px", fontSize: 14, fontWeight: 700 }}>{inlineFormat(line.slice(3))}</h3>);
    } else if (line.startsWith("# ")) {
      result.push(<h2 key={i} style={{ margin: "10px 0 4px", fontSize: 15, fontWeight: 700 }}>{inlineFormat(line.slice(2))}</h2>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      result.push(
        <div key={i} style={{ display: "flex", gap: 6, margin: "2px 0" }}>
          <span style={{ color: "var(--accent)", flexShrink: 0 }}>•</span>
          <span>{inlineFormat(line.slice(2))}</span>
        </div>
      );
    } else if (line === "") {
      result.push(<div key={i} style={{ height: 6 }} />);
    } else {
      result.push(<div key={i}>{inlineFormat(line)}</div>);
    }
    i++;
  }

  return result;
}

function inlineFormat(text: string): React.ReactNode {
  // Handle bold (**text**), inline code (`code`)
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          style={{
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border)",
            borderRadius: 3,
            padding: "0 4px",
            fontSize: 11,
            fontFamily: "monospace",
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export default function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div
          style={{
            maxWidth: "80%",
            padding: "10px 14px",
            borderRadius: 14,
            borderBottomRightRadius: 4,
            background: "var(--accent)",
            color: "white",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "var(--accent)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        Vertex AI
      </div>
      <div
        style={{
          maxWidth: "92%",
          padding: "12px 16px",
          borderRadius: 14,
          borderBottomLeftRadius: 4,
          background: "var(--bg-hover)",
          border: "1px solid var(--border)",
          fontSize: 13,
          lineHeight: 1.6,
          color: "var(--text-primary)",
        }}
      >
        {renderMarkdown(message.content)}
      </div>
      {message.toolCalls && message.toolCalls.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {message.toolCalls.map((tc, i) => (
            <ToolCallBadge key={i} name={tc.name} loading={false} />
          ))}
        </div>
      )}
    </div>
  );
}
