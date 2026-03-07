"use client";
import { useState } from "react";
import { Copy, Check, Download } from "lucide-react";

interface Props {
  tokens: Record<string, string>;
  format: string;
}

type Tab = "json" | "css" | "tailwind";

export default function TokensPreview({ tokens, format }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(
    format === "all" ? "css" : (format as Tab)
  );
  const [copied, setCopied] = useState(false);

  const content = tokens[activeTab] ?? Object.values(tokens)[0] ?? "";

  const copy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const ext = activeTab === "css" ? "css" : activeTab === "tailwind" ? "js" : "json";
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `design-tokens.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = Object.keys(tokens) as Tab[];

  return (
    <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-[#0d0d14]">
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--surface-2)] border-b border-[var(--border)]">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                activeTab === tab
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copy}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
          >
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={download}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
          >
            <Download size={12} />
            Export
          </button>
        </div>
      </div>
      <pre className="p-4 overflow-x-auto text-xs font-mono text-gray-300 leading-relaxed max-h-80">
        {content}
      </pre>
    </div>
  );
}
