"use client";
import { useRef, useState, KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, disabled, placeholder }: Props) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleInput = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  };

  const suggestions = [
    "Create a hero section for our homepage",
    "Generate design tokens from my brand",
    "Write 3 hero headline variations",
    "Design a pricing card component",
  ];

  return (
    <div className="space-y-3">
      {/* Suggestion chips (when empty) */}
      {text === "" && (
        <div className="flex flex-wrap gap-2 px-1">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => {
                setText(s);
                textareaRef.current?.focus();
              }}
              className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-gray-400 hover:text-white hover:border-purple-500/50 hover:bg-purple-500/10 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-3 p-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] focus-within:border-purple-500/50 transition-colors">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          onInput={handleInput}
          disabled={disabled}
          placeholder={placeholder || "Ask BrandMind to design something…"}
          rows={1}
          className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 resize-none outline-none leading-relaxed"
          style={{ maxHeight: "200px" }}
        />
        <button
          onClick={send}
          disabled={!text.trim() || disabled}
          className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <Send size={14} className="text-white" />
        </button>
      </div>
      <p className="text-center text-xs text-gray-700">
        BrandMind can make mistakes. Review outputs before using in production.
      </p>
    </div>
  );
}
