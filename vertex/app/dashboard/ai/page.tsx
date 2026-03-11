import ChatPanel from "@/components/chat/ChatPanel";

export const metadata = { title: "AI Assistant — Vertex" };

export default function AiPage() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <ChatPanel />
    </div>
  );
}
