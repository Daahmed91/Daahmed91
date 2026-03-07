"use client";
import { Sparkles, User, Loader2, Wrench } from "lucide-react";
import CodePreview from "@/components/outputs/CodePreview";
import ImagePreview from "@/components/outputs/ImagePreview";
import TokensPreview from "@/components/outputs/TokensPreview";
import CopyPreview from "@/components/outputs/CopyPreview";

export type MessageContent =
  | { kind: "text"; text: string }
  | { kind: "code"; code: string; framework?: string; component?: string }
  | { kind: "image"; url: string; provider: string; model: string; prompt?: string }
  | { kind: "tokens"; tokens: Record<string, string>; format: string }
  | { kind: "copy"; content: string; contentType?: string }
  | { kind: "tool_loading"; tool: string };

export interface Message {
  id: string;
  role: "user" | "assistant";
  parts: MessageContent[];
  isStreaming?: boolean;
}

interface Props {
  message: Message;
  onRegenerateImage?: (messageId: string) => void;
}

export default function MessageBubble({ message, onRegenerateImage }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} mb-6`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-white/10 border border-white/20"
            : "bg-gradient-to-br from-purple-600 to-violet-700"
        }`}
      >
        {isUser ? (
          <User size={14} className="text-gray-300" />
        ) : (
          <Sparkles size={14} className="text-white" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 max-w-[85%] space-y-3 ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        {message.parts.map((part, i) => {
          if (part.kind === "text") {
            return (
              <div
                key={i}
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? "bg-white/10 text-gray-100 rounded-tr-sm"
                    : "bg-[var(--surface-2)] text-gray-200 rounded-tl-sm"
                } ${message.isStreaming && i === message.parts.length - 1 ? "after:content-['▋'] after:animate-pulse after:text-purple-400" : ""}`}
              >
                {part.text}
              </div>
            );
          }

          if (part.kind === "code") {
            return (
              <div key={i} className="w-full">
                <CodePreview
                  code={part.code}
                  framework={part.framework}
                  component={part.component}
                />
              </div>
            );
          }

          if (part.kind === "image") {
            return (
              <div key={i} className="w-full max-w-lg">
                <ImagePreview
                  url={part.url}
                  provider={part.provider}
                  model={part.model}
                  prompt={part.prompt}
                  onRegenerate={onRegenerateImage ? () => onRegenerateImage(message.id) : undefined}
                />
              </div>
            );
          }

          if (part.kind === "tokens") {
            return (
              <div key={i} className="w-full">
                <TokensPreview tokens={part.tokens} format={part.format} />
              </div>
            );
          }

          if (part.kind === "copy") {
            return (
              <div key={i} className="w-full">
                <CopyPreview content={part.content} contentType={part.contentType} />
              </div>
            );
          }

          if (part.kind === "tool_loading") {
            return (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-900/20 border border-purple-500/20 text-xs text-purple-400"
              >
                <Loader2 size={12} className="animate-spin" />
                <Wrench size={12} />
                <span>Using {part.tool.replace(/_/g, " ")}…</span>
              </div>
            );
          }

          return null;
        })}

        {message.isStreaming && message.parts.length === 0 && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[var(--surface-2)] text-sm text-gray-400 rounded-tl-sm">
            <Loader2 size={14} className="animate-spin text-purple-400" />
            Thinking…
          </div>
        )}
      </div>
    </div>
  );
}
