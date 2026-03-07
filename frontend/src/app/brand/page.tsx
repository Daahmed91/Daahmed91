"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Globe, FormInput } from "lucide-react";
import BrandWizard from "@/components/brand/BrandWizard";
import BrandUpload from "@/components/brand/BrandUpload";
import BrandURLInput from "@/components/brand/BrandURLInput";
import { useRouter } from "next/navigation";

type Tab = "wizard" | "upload" | "url";

const TABS: { id: Tab; label: string; icon: React.ReactNode; description: string }[] = [
  {
    id: "wizard",
    label: "Setup Wizard",
    icon: <FormInput size={16} />,
    description: "Fill in a guided form to build your brand profile",
  },
  {
    id: "upload",
    label: "Upload PDF",
    icon: <FileText size={16} />,
    description: "Upload your existing brand guide — Claude extracts everything",
  },
  {
    id: "url",
    label: "From URL",
    icon: <Globe size={16} />,
    description: "Point to your website and we reverse-engineer your brand",
  },
];

export default function BrandPage() {
  const [activeTab, setActiveTab] = useState<Tab>("wizard");
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleComplete = (_brandId: string) => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)]">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back to chat
        </Link>
        <div className="w-px h-4 bg-[var(--border)]" />
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center text-xs">
            ✦
          </div>
          <span className="font-medium text-sm">Brand Setup</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Page title */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold mb-2">Set Up Your Brand Profile</h1>
          <p className="text-sm text-gray-500">
            BrandMind uses your brand profile to generate perfectly on-brand
            designs, code, images, and copy every time.
          </p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center ${
                activeTab === tab.id
                  ? "border-purple-500 bg-purple-500/10 text-white"
                  : "border-[var(--border)] bg-[var(--surface)] text-gray-400 hover:border-purple-500/30 hover:text-gray-200"
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  activeTab === tab.id ? "bg-purple-600" : "bg-white/5"
                }`}
              >
                {tab.icon}
              </div>
              <span className="text-xs font-medium">{tab.label}</span>
              <span className="text-xs text-gray-600 leading-tight hidden sm:block">
                {tab.description}
              </span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 sm:p-8">
          {activeTab === "wizard" && <BrandWizard onComplete={handleComplete} />}
          {activeTab === "upload" && <BrandUpload onComplete={handleComplete} />}
          {activeTab === "url" && <BrandURLInput onComplete={handleComplete} />}
        </div>
      </div>
    </div>
  );
}
