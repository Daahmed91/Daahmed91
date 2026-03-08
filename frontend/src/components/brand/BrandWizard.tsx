"use client";
import { useState } from "react";
import { Check, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { submitBrandForm } from "@/lib/api";

interface Props {
  onComplete: (brandId: string) => void;
}

const STEPS = ["Identity", "Colors", "Typography", "Tone", "Review"];

const PERSONALITY_OPTIONS = [
  "Professional", "Friendly", "Innovative", "Bold", "Playful",
  "Minimalist", "Luxurious", "Approachable", "Authoritative", "Creative",
];

const PRINCIPLE_OPTIONS = [
  "Minimalist", "Bold", "Accessible", "Clean", "Modern",
  "Elegant", "Vibrant", "Trustworthy", "Human-centered",
];

export default function BrandWizard({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    brand_name: "",
    industry: "",
    target_audience: "",
    primary_color: "#7c3aed",
    secondary_color: "#ffffff",
    accent_color: "#a78bfa",
    background_color: "#0a0a0f",
    text_color: "#ededed",
    palette: [] as string[],
    heading_font: "Inter",
    body_font: "Inter",
    personality: [] as string[],
    avoid: [] as string[],
    example_copy: [] as string[],
    design_principles: [] as string[],
    logo_description: "",
  });

  const update = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleArr = (field: string, val: string) => {
    const arr = form[field as keyof typeof form] as string[];
    update(field, arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const submit = async () => {
    setLoading(true);
    try {
      const result = await submitBrandForm(form);
      onComplete(result.id);
    } finally {
      setLoading(false);
    }
  };

  const StepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <Field label="Brand Name" required>
              <input
                className="input-base"
                value={form.brand_name}
                onChange={(e) => update("brand_name", e.target.value)}
                placeholder="Acme Corp"
              />
            </Field>
            <Field label="Industry">
              <input
                className="input-base"
                value={form.industry}
                onChange={(e) => update("industry", e.target.value)}
                placeholder="e.g. SaaS, E-commerce, Healthcare"
              />
            </Field>
            <Field label="Target Audience">
              <input
                className="input-base"
                value={form.target_audience}
                onChange={(e) => update("target_audience", e.target.value)}
                placeholder="e.g. B2B software teams"
              />
            </Field>
            <Field label="Logo Description">
              <textarea
                className="input-base resize-none"
                rows={2}
                value={form.logo_description}
                onChange={(e) => update("logo_description", e.target.value)}
                placeholder="A minimal wordmark in bold sans-serif..."
              />
            </Field>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {(["primary", "secondary", "accent", "background", "text"] as const).map((key) => {
                const fieldKey = `${key}_color`;
                return (
                  <Field key={key} label={`${key.charAt(0).toUpperCase() + key.slice(1)} Color`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form[fieldKey as keyof typeof form] as string}
                        onChange={(e) => update(fieldKey, e.target.value)}
                        className="w-10 h-10 rounded-lg border border-[var(--border)] bg-transparent cursor-pointer"
                      />
                      <input
                        className="input-base flex-1 font-mono"
                        value={form[fieldKey as keyof typeof form] as string}
                        onChange={(e) => update(fieldKey, e.target.value)}
                        placeholder="#000000"
                      />
                    </div>
                  </Field>
                );
              })}
            </div>
            {/* Color preview */}
            <div className="rounded-xl p-4 border border-[var(--border)]" style={{ background: form.background_color }}>
              <p style={{ color: form.text_color, fontFamily: form.heading_font }} className="text-lg font-bold mb-1">
                {form.brand_name || "Brand Name"}
              </p>
              <p style={{ color: form.text_color + "99" }} className="text-sm">Your brand colors live preview</p>
              <button className="mt-3 px-4 py-2 rounded-lg text-sm text-white" style={{ background: form.primary_color }}>
                Primary CTA
              </button>
              <button className="mt-3 ml-2 px-4 py-2 rounded-lg text-sm" style={{ background: form.accent_color, color: form.background_color }}>
                Accent Action
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Field label="Heading Font">
              <input
                className="input-base"
                value={form.heading_font}
                onChange={(e) => update("heading_font", e.target.value)}
                placeholder="Inter, Playfair Display, Sora..."
              />
            </Field>
            <Field label="Body Font">
              <input
                className="input-base"
                value={form.body_font}
                onChange={(e) => update("body_font", e.target.value)}
                placeholder="Inter, DM Sans, Lato..."
              />
            </Field>
            <Field label="Design Principles">
              <div className="flex flex-wrap gap-2">
                {PRINCIPLE_OPTIONS.map((p) => (
                  <button
                    key={p}
                    onClick={() => toggleArr("design_principles", p)}
                    className={`px-3 py-1 rounded-full text-xs transition-colors ${
                      form.design_principles.includes(p)
                        ? "bg-purple-600 text-white"
                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Field label="Brand Personality (select all that apply)">
              <div className="flex flex-wrap gap-2">
                {PERSONALITY_OPTIONS.map((p) => (
                  <button
                    key={p}
                    onClick={() => toggleArr("personality", p)}
                    className={`px-3 py-1 rounded-full text-xs transition-colors ${
                      form.personality.includes(p)
                        ? "bg-purple-600 text-white"
                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Things to Avoid (one per line)">
              <textarea
                className="input-base resize-none"
                rows={3}
                value={form.avoid.join("\n")}
                onChange={(e) =>
                  update("avoid", e.target.value.split("\n").filter(Boolean))
                }
                placeholder={"Jargon\nNegative language\nAll-caps text"}
              />
            </Field>
            <Field label="Example Copy (one per line — helps the AI match your voice)">
              <textarea
                className="input-base resize-none"
                rows={3}
                value={form.example_copy.join("\n")}
                onChange={(e) =>
                  update("example_copy", e.target.value.split("\n").filter(Boolean))
                }
                placeholder={"Move fast, stay grounded.\nBuilt for people who mean business."}
              />
            </Field>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Review your brand profile before saving.
            </p>
            <div className="rounded-xl border border-[var(--border)] p-4 space-y-3 text-sm">
              <Row label="Brand" value={form.brand_name} />
              <Row label="Industry" value={form.industry} />
              <Row label="Audience" value={form.target_audience} />
              <Row label="Personality" value={form.personality.join(", ") || "—"} />
              <Row label="Principles" value={form.design_principles.join(", ") || "—"} />
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-28">Colors</span>
                <div className="flex gap-1">
                  {[form.primary_color, form.secondary_color, form.accent_color,
                    form.background_color, form.text_color].map((c, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full border border-white/20"
                      style={{ background: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
              <Row label="Heading Font" value={form.heading_font} />
              <Row label="Body Font" value={form.body_font} />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canNext =
    step === 0 ? !!form.brand_name.trim() : true;

  return (
    <div className="max-w-xl mx-auto">
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                i < step
                  ? "bg-purple-600 text-white"
                  : i === step
                  ? "bg-purple-600/30 text-purple-400 border border-purple-500"
                  : "bg-white/5 text-gray-600 border border-[var(--border)]"
              }`}
            >
              {i < step ? <Check size={12} /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px ${i < step ? "bg-purple-600" : "bg-[var(--border)]"}`} />
            )}
          </div>
        ))}
      </div>

      <h3 className="text-lg font-semibold mb-6">{STEPS[step]}</h3>

      <StepContent />

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext}
            className="flex items-center gap-1 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Save Brand Profile
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children, required }: {
  label: string; children: React.ReactNode; required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5">
        {label} {required && <span className="text-purple-400">*</span>}
      </label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-500 w-28 flex-shrink-0">{label}</span>
      <span className="text-gray-300">{value || "—"}</span>
    </div>
  );
}
