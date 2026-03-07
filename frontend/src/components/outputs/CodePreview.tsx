"use client";
import { useState } from "react";
import { Copy, Check, Download } from "lucide-react";

interface Props {
  code: string;
  framework?: string;
  component?: string;
}

export default function CodePreview({ code, framework = "react-tailwind", component = "component" }: Props) {
  const [copied, setCopied] = useState(false);

  const ext = framework === "html-css" ? "html" : "tsx";
  const language = framework === "html-css" ? "html" : "tsx";

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${component.replace(/\s+/g, "-")}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Extract just the code from markdown code fences if present
  const cleanCode = code.replace(/^```[\w-]*\n?/, "").replace(/\n?```$/, "").trim();

  return (
    <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-[#0d0d14]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--surface-2)] border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-purple-400">{language}</span>
          <span className="text-xs text-gray-500">{component}</span>
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
            Download
          </button>
        </div>
      </div>
      {/* Code */}
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-gray-300 font-mono text-xs">{cleanCode}</code>
      </pre>
    </div>
  );
}
