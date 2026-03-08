"use client";
import { useState } from "react";
import { Globe, Loader2, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { ingestURL } from "@/lib/api";

interface Props {
  onComplete: (brandId: string) => void;
}

export default function BrandURLInput({ onComplete }: Props) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const scrape = async () => {
    if (!url.trim()) return;
    setStatus("loading");
    setMessage("Loading page and extracting brand…");
    try {
      const data = await ingestURL(url);
      setStatus("success");
      setMessage(`Brand "${data.name}" extracted from ${url}`);
      setTimeout(() => onComplete(data.id), 2000);
    } catch (err) {
      setStatus("error");
      setMessage(String(err));
    }
  };

  const steps = [
    "Rendering page with headless browser",
    "Extracting CSS custom properties & computed styles",
    "Detecting fonts and color palette",
    "Analyzing tone of voice from page copy",
    "Building brand profile with Claude",
  ];

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <label className="block text-xs text-gray-500 mb-1.5">Website URL</label>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] focus-within:border-purple-500/50">
            <Globe size={14} className="text-gray-500 flex-shrink-0" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && scrape()}
              placeholder="https://yourcompany.com"
              className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none"
              disabled={status === "loading"}
            />
          </div>
          <button
            onClick={scrape}
            disabled={!url.trim() || status === "loading"}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 text-white text-sm flex items-center gap-2 transition-colors"
          >
            {status === "loading" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            {status === "loading" ? "Analyzing…" : "Extract Brand"}
          </button>
        </div>
      </div>

      {status === "loading" && (
        <div className="rounded-xl border border-purple-500/20 bg-purple-900/10 p-4 space-y-2">
          <p className="text-xs font-medium text-purple-400 mb-3">What we&apos;re doing:</p>
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 size={10} className="animate-spin text-purple-400 flex-shrink-0" />
              {step}
            </div>
          ))}
        </div>
      )}

      {status === "success" && (
        <div className="rounded-xl border border-green-500/20 bg-green-900/10 p-4 flex items-start gap-3">
          <CheckCircle size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-green-300 font-medium">{message}</p>
            <p className="text-xs text-gray-500 mt-1">Redirecting to chat…</p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="rounded-xl border border-red-500/20 bg-red-900/10 p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-300 font-medium">Extraction failed</p>
            <p className="text-xs text-red-400 mt-1">{message}</p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-2 text-xs text-gray-400 hover:text-white underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[var(--border)] p-4 space-y-2">
        <p className="text-xs font-medium text-gray-400">What gets extracted:</p>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• CSS custom properties and computed colors</li>
          <li>• Web fonts and typography hierarchy</li>
          <li>• Color palette from backgrounds, text, and CTAs</li>
          <li>• Brand tone from headlines and copy</li>
          <li>• Logo description and visual style</li>
        </ul>
      </div>
    </div>
  );
}
