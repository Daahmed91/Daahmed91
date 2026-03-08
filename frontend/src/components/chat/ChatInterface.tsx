"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { streamChat, getImagePrefs, ChatMessage } from "@/lib/api";
import MessageBubble, { Message, MessageContent } from "./MessageBubble";
import ChatInput from "./ChatInput";
import { nanoid } from "@/lib/nanoid";

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (isStreaming) return;

    const userMsg: Message = {
      id: nanoid(),
      role: "user",
      parts: [{ kind: "text", text }],
    };

    setMessages((prev) => [...prev, userMsg]);

    const assistantId = nanoid();
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      parts: [],
      isStreaming: true,
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setIsStreaming(true);

    // Build message history for API
    const history: ChatMessage[] = [
      ...messages.map((m) => ({
        role: m.role,
        content: m.parts
          .filter((p) => p.kind === "text")
          .map((p) => (p as { kind: "text"; text: string }).text)
          .join("\n"),
      })),
      { role: "user", content: text },
    ];

    const prefs = getImagePrefs();

    try {
      let currentTextIndex: number | null = null;

      for await (const event of streamChat(history, {
        imageProvider: prefs.provider,
        imageModel: prefs.model,
      })) {
        if (event.type === "text") {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== assistantId) return m;
              const parts = [...m.parts];
              if (currentTextIndex !== null && parts[currentTextIndex]?.kind === "text") {
                (parts[currentTextIndex] as { kind: "text"; text: string }).text += event.text;
              } else {
                currentTextIndex = parts.length;
                parts.push({ kind: "text", text: event.text });
              }
              return { ...m, parts };
            })
          );
        } else if (event.type === "tool_start") {
          currentTextIndex = null;
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== assistantId) return m;
              return {
                ...m,
                parts: [...m.parts, { kind: "tool_loading", tool: event.tool }],
              };
            })
          );
        } else if (event.type === "tool_result") {
          const meta = event.metadata;
          let newPart: MessageContent | null = null;

          if (meta.type === "code") {
            newPart = {
              kind: "code",
              code: event.result,
              framework: (meta as { framework: string }).framework,
              component: (meta as { component: string }).component,
            };
          } else if (meta.type === "image") {
            const parsed = JSON.parse(event.result);
            newPart = {
              kind: "image",
              url: parsed.url,
              provider: parsed.provider,
              model: parsed.model,
              prompt: parsed.prompt,
            };
          } else if (meta.type === "tokens") {
            const parsed = JSON.parse(event.result);
            newPart = {
              kind: "tokens",
              tokens: parsed,
              format: (meta as { format: string }).format,
            };
          } else if (meta.type === "copy") {
            newPart = {
              kind: "copy",
              content: event.result,
              contentType: (meta as { content_type: string }).content_type,
            };
          }

          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== assistantId) return m;
              // Remove the tool_loading part and add the result
              const parts = m.parts.filter((p) => p.kind !== "tool_loading");
              if (newPart) parts.push(newPart);
              return { ...m, parts };
            })
          );
          currentTextIndex = null;
        } else if (event.type === "done") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, isStreaming: false } : m
            )
          );
        } else if (event.type === "error") {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== assistantId) return m;
              return {
                ...m,
                isStreaming: false,
                parts: [
                  ...m.parts.filter((p) => p.kind !== "tool_loading"),
                  {
                    kind: "text" as const,
                    text: `Error: ${event.message}`,
                  },
                ],
              };
            })
          );
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== assistantId) return m;
          return {
            ...m,
            isStreaming: false,
            parts: [{ kind: "text", text: `Connection error: ${String(err)}` }],
          };
        })
      );
    } finally {
      setIsStreaming(false);
    }
  }, [messages, isStreaming]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center text-2xl shadow-2xl shadow-purple-900/50">
              ✦
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Your AI Designer is ready
              </h2>
              <p className="text-sm text-gray-500 max-w-sm">
                Ask me to design components, generate images, create design tokens,
                or write on-brand copy. I follow your brand guidelines to the letter.
              </p>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border)] bg-[var(--background)] p-4">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSend={sendMessage}
            disabled={isStreaming}
            placeholder="Ask BrandMind to design something…"
          />
        </div>
      </div>
    </div>
  );
}
