"use client";
import { Download, RefreshCw } from "lucide-react";

interface Props {
  url: string;
  provider: string;
  model: string;
  prompt?: string;
  onRegenerate?: () => void;
}

export default function ImagePreview({ url, provider, model, prompt, onRegenerate }: Props) {
  const download = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `brandmind-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      // For data URIs
      const a = document.createElement("a");
      a.href = url;
      a.download = `brandmind-${Date.now()}.png`;
      a.click();
    }
  };

  return (
    <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-2)]">
      {/* Image */}
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={prompt || "Generated image"}
          className="w-full object-cover max-h-[512px]"
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
        <div className="text-xs text-gray-500">
          <span className="text-purple-400">{provider}</span>
          <span className="mx-1">·</span>
          <span>{model}</span>
          {prompt && (
            <>
              <span className="mx-1">·</span>
              <span className="text-gray-600 truncate max-w-[200px] inline-block align-bottom">{prompt}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
            >
              <RefreshCw size={12} />
              Regenerate
            </button>
          )}
          <button
            onClick={download}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
          >
            <Download size={12} />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
