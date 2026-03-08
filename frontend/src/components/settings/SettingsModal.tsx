"use client";

import { useEffect, useState } from "react";
import { getImageProviders } from "@/lib/api";

const PROVIDER_KEY_LABELS: Record<string, string> = {
  openai: "OpenAI API Key",
  stability: "Stability AI API Key",
  fal: "fal.ai API Key",
  google: "Google API Key",
};

const CLAUDE_MODELS = [
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (Recommended)" },
  { id: "claude-opus-4-6", label: "Claude Opus 4.6 (Powerful)" },
  { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (Fast)" },
];

function loadFromStorage() {
  if (typeof window === "undefined") return {};
  return {
    anthropicKey: localStorage.getItem("brandmind_anthropic_key") || "",
    claudeModel: localStorage.getItem("brandmind_claude_model") || "claude-sonnet-4-6",
    imageProvider: localStorage.getItem("brandmind_image_provider") || "openai",
    imageModel: localStorage.getItem("brandmind_image_model") || "dall-e-3",
    openaiKey: localStorage.getItem("brandmind_openai_key") || "",
    stabilityKey: localStorage.getItem("brandmind_stability_key") || "",
    falKey: localStorage.getItem("brandmind_fal_key") || "",
    googleKey: localStorage.getItem("brandmind_google_key") || "",
  };
}

export default function SettingsModal() {
  const [open, setOpen] = useState(false);
  const [providers, setProviders] = useState<Record<string, Array<{ id: string; label: string }>>>({});
  const [form, setForm] = useState({
    anthropicKey: "",
    claudeModel: "claude-sonnet-4-6",
    imageProvider: "openai",
    imageModel: "dall-e-3",
    openaiKey: "",
    stabilityKey: "",
    falKey: "",
    googleKey: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = loadFromStorage();
    setForm((f) => ({ ...f, ...stored }));
    // Auto-open if no Anthropic key saved
    if (!stored.anthropicKey) setOpen(true);

    getImageProviders()
      .then(setProviders)
      .catch(() => {});
  }, []);

  const providerModels = providers[form.imageProvider] || [];

  function handleProviderChange(provider: string) {
    const defaultModel = (providers[provider] || []).find((m) => (m as any).default)?.id
      || (providers[provider]?.[0]?.id ?? "");
    setForm((f) => ({ ...f, imageProvider: provider, imageModel: defaultModel }));
  }

  function save() {
    if (!form.anthropicKey.trim()) {
      setError("Anthropic API key is required.");
      return;
    }
    localStorage.setItem("brandmind_anthropic_key", form.anthropicKey.trim());
    localStorage.setItem("brandmind_claude_model", form.claudeModel);
    localStorage.setItem("brandmind_image_provider", form.imageProvider);
    localStorage.setItem("brandmind_image_model", form.imageModel);
    localStorage.setItem("brandmind_openai_key", form.openaiKey.trim());
    localStorage.setItem("brandmind_stability_key", form.stabilityKey.trim());
    localStorage.setItem("brandmind_fal_key", form.falKey.trim());
    localStorage.setItem("brandmind_google_key", form.googleKey.trim());
    setError("");
    setOpen(false);
  }

  const providerKeyField = {
    openai: { label: "OpenAI API Key", value: form.openaiKey, key: "openaiKey" },
    stability: { label: "Stability AI API Key", value: form.stabilityKey, key: "stabilityKey" },
    fal: { label: "fal.ai API Key", value: form.falKey, key: "falKey" },
    google: { label: "Google API Key", value: form.googleKey, key: "googleKey" },
  }[form.imageProvider];

  return (
    <>
      {/* Gear button — always visible */}
      <button
        onClick={() => setOpen(true)}
        title="API Settings"
        className="fixed top-4 right-4 z-40 p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { if (form.anthropicKey) setOpen(false); }} />
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white">API Settings</h2>
              <p className="text-sm text-zinc-400 mt-1">Keys are stored locally in your browser and never sent to any server other than their respective APIs.</p>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">{error}</p>
            )}

            {/* Anthropic key */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-300">Anthropic API Key <span className="text-red-400">*</span></label>
              <input
                type="password"
                placeholder="sk-ant-..."
                value={form.anthropicKey}
                onChange={(e) => setForm((f) => ({ ...f, anthropicKey: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-600 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-zinc-400"
              />
            </div>

            {/* Claude model */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-300">Claude Model</label>
              <select
                value={form.claudeModel}
                onChange={(e) => setForm((f) => ({ ...f, claudeModel: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-600 text-white text-sm focus:outline-none focus:border-zinc-400"
              >
                {CLAUDE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>

            <hr className="border-zinc-700" />

            {/* Image provider */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-300">Image Provider</label>
              <select
                value={form.imageProvider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-600 text-white text-sm focus:outline-none focus:border-zinc-400"
              >
                {Object.keys(providers).length > 0
                  ? Object.keys(providers).map((p) => (
                      <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))
                  : ["openai", "stability", "fal", "google"].map((p) => (
                      <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))
                }
              </select>
            </div>

            {/* Image model */}
            {providerModels.length > 0 && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-300">Image Model</label>
                <select
                  value={form.imageModel}
                  onChange={(e) => setForm((f) => ({ ...f, imageModel: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-600 text-white text-sm focus:outline-none focus:border-zinc-400"
                >
                  {providerModels.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Provider-specific API key */}
            {providerKeyField && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-300">{providerKeyField.label}</label>
                <input
                  type="password"
                  placeholder="Paste key here..."
                  value={providerKeyField.value}
                  onChange={(e) => setForm((f) => ({ ...f, [providerKeyField.key]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-600 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-zinc-400"
                />
              </div>
            )}

            <div className="flex gap-3 pt-1">
              {form.anthropicKey && (
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-zinc-600 text-zinc-300 text-sm hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={save}
                className="flex-1 px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
