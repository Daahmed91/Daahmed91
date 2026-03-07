"use client";
import { useEffect, useState } from "react";
import { Settings, Image as ImageIcon, ChevronDown } from "lucide-react";
import { getImageProviders, getImagePrefs, setImagePrefs } from "@/lib/api";

interface Model { id: string; label: string; default?: boolean; }
interface Providers { [key: string]: Model[]; }

interface Props {
  onChange?: (provider: string, model: string) => void;
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  stability: "Stability AI",
  fal: "fal.ai",
  google: "Google Imagen",
};

export default function ImageModelSelector({ onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [providers, setProviders] = useState<Providers>({});
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [selectedModel, setSelectedModel] = useState("dall-e-3");

  useEffect(() => {
    const prefs = getImagePrefs();
    setSelectedProvider(prefs.provider);
    setSelectedModel(prefs.model);

    getImageProviders()
      .then(setProviders)
      .catch(() => {});
  }, []);

  const handleProviderChange = (provider: string) => {
    const models = providers[provider] || [];
    const defaultModel = models.find((m) => m.default)?.id || models[0]?.id || "";
    setSelectedProvider(provider);
    setSelectedModel(defaultModel);
    setImagePrefs(provider, defaultModel);
    onChange?.(provider, defaultModel);
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    setImagePrefs(selectedProvider, model);
    onChange?.(selectedProvider, model);
  };

  const models = providers[selectedProvider] || [];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors border border-transparent hover:border-[var(--border)]"
        title="Image generation settings"
      >
        <ImageIcon size={14} />
        <span className="hidden sm:inline">
          {PROVIDER_LABELS[selectedProvider] || selectedProvider}
        </span>
        <span className="hidden sm:inline text-gray-600">·</span>
        <span className="hidden sm:inline text-purple-400 truncate max-w-[120px]">
          {models.find((m) => m.id === selectedModel)?.label || selectedModel}
        </span>
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Settings size={14} className="text-purple-400" />
                <span className="text-sm font-medium">Image Generation</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Select provider & model</p>
            </div>

            <div className="p-3 space-y-3">
              {/* Provider */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">Provider</label>
                <div className="grid grid-cols-2 gap-1">
                  {Object.keys(providers).length > 0
                    ? Object.keys(providers).map((p) => (
                        <button
                          key={p}
                          onClick={() => handleProviderChange(p)}
                          className={`px-3 py-2 rounded-lg text-xs text-left transition-colors ${
                            selectedProvider === p
                              ? "bg-purple-600 text-white"
                              : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {PROVIDER_LABELS[p] || p}
                        </button>
                      ))
                    : ["openai", "stability", "fal", "google"].map((p) => (
                        <button
                          key={p}
                          onClick={() => handleProviderChange(p)}
                          className={`px-3 py-2 rounded-lg text-xs text-left transition-colors ${
                            selectedProvider === p
                              ? "bg-purple-600 text-white"
                              : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {PROVIDER_LABELS[p]}
                        </button>
                      ))}
                </div>
              </div>

              {/* Model */}
              {models.length > 0 && (
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Model</label>
                  <div className="space-y-1">
                    {models.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleModelChange(m.id)}
                        className={`w-full px-3 py-2 rounded-lg text-xs text-left transition-colors flex items-center justify-between ${
                          selectedModel === m.id
                            ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                            : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <span>{m.label}</span>
                        {m.default && (
                          <span className="text-[10px] text-gray-600">default</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-[var(--border)] bg-black/20">
              <p className="text-xs text-gray-600">
                Selection saved automatically & sent with every image request
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
