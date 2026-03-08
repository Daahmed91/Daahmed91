const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type StreamEvent =
  | { type: "text"; text: string }
  | { type: "tool_start"; tool: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool: string; result: string; metadata: ToolMetadata }
  | { type: "done" }
  | { type: "error"; message: string };

export type ToolMetadata =
  | { type: "code"; framework: string; component: string }
  | { type: "image"; url: string; provider: string; model: string; prompt: string }
  | { type: "tokens"; format: string; tokens: Record<string, string> }
  | { type: "copy"; content_type: string }
  | { type: "brand_profile"; brand_id: string }
  | { type: "brand_updated" }
  | Record<string, unknown>;

/** Read all stored keys from localStorage and build request headers. */
export function buildApiHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const h: Record<string, string> = {};
  const anthropicKey = localStorage.getItem("brandmind_anthropic_key");
  const claudeModel = localStorage.getItem("brandmind_claude_model");
  const imageProvider = localStorage.getItem("brandmind_image_provider");
  const imageModel = localStorage.getItem("brandmind_image_model");
  const openaiKey = localStorage.getItem("brandmind_openai_key");
  const stabilityKey = localStorage.getItem("brandmind_stability_key");
  const falKey = localStorage.getItem("brandmind_fal_key");
  const googleKey = localStorage.getItem("brandmind_google_key");

  if (anthropicKey) h["X-Anthropic-Key"] = anthropicKey;
  if (claudeModel) h["X-Claude-Model"] = claudeModel;
  if (imageProvider) h["X-Image-Provider"] = imageProvider;
  if (imageModel) h["X-Image-Model"] = imageModel;
  if (openaiKey) h["X-OpenAI-Key"] = openaiKey;
  if (stabilityKey) h["X-Stability-Key"] = stabilityKey;
  if (falKey) h["X-Fal-Key"] = falKey;
  if (googleKey) h["X-Google-Key"] = googleKey;
  return h;
}

export async function* streamChat(
  messages: ChatMessage[],
  opts: {
    brandId?: string;
    imageProvider?: string;
    imageModel?: string;
  } = {}
): AsyncGenerator<StreamEvent> {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...buildApiHeaders() },
    body: JSON.stringify({
      messages,
      brand_id: opts.brandId,
      image_provider: opts.imageProvider,
      image_model: opts.imageModel,
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat API error: ${response.status}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const json = line.slice(6).trim();
        if (json) {
          try {
            yield JSON.parse(json) as StreamEvent;
          } catch {
            // skip malformed
          }
        }
      }
    }
  }
}

// Brand API
export async function getBrand(brandId?: string) {
  const url = brandId
    ? `${API_BASE}/api/brand/${brandId}`
    : `${API_BASE}/api/brand`;
  const res = await fetch(url, { headers: buildApiHeaders() });
  if (!res.ok) return null;
  return res.json();
}

export async function listBrands() {
  const res = await fetch(`${API_BASE}/api/brands`, { headers: buildApiHeaders() });
  return res.json();
}

export async function submitBrandForm(data: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/api/ingest/form`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...buildApiHeaders() },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function ingestURL(url: string) {
  const res = await fetch(`${API_BASE}/api/ingest/url`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...buildApiHeaders() },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function ingestPDF(file: File, brandName?: string) {
  const form = new FormData();
  form.append("file", file);
  if (brandName) form.append("brand_name", brandName);
  const res = await fetch(`${API_BASE}/api/ingest/pdf`, {
    method: "POST",
    headers: buildApiHeaders(), // no Content-Type — browser sets multipart boundary
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getImageProviders() {
  const res = await fetch(`${API_BASE}/api/image-providers`, { headers: buildApiHeaders() });
  return res.json() as Promise<Record<string, Array<{ id: string; label: string; default?: boolean }>>>;
}

// Image model preferences (localStorage)
const STORAGE_KEY = "brandmind_image_prefs";

export function getImagePrefs(): { provider: string; model: string } {
  if (typeof window === "undefined") return { provider: "openai", model: "dall-e-3" };
  try {
    const provider = localStorage.getItem("brandmind_image_provider");
    const model = localStorage.getItem("brandmind_image_model");
    if (provider && model) return { provider, model };
    // Legacy fallback
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { provider: "openai", model: "dall-e-3" };
  } catch {
    return { provider: "openai", model: "dall-e-3" };
  }
}

export function setImagePrefs(provider: string, model: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("brandmind_image_provider", provider);
  localStorage.setItem("brandmind_image_model", model);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ provider, model }));
}
