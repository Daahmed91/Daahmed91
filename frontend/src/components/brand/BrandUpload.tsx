"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { ingestPDF } from "@/lib/api";

interface Props {
  onComplete: (brandId: string) => void;
}

export default function BrandUpload({ onComplete }: Props) {
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [brandName, setBrandName] = useState("");

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setStatus("uploading");
      setMessage(`Processing ${file.name}…`);
      try {
        const result = await ingestPDF(file, brandName);
        setStatus("success");
        setMessage(`Brand "${result.name}" extracted successfully!`);
        setTimeout(() => onComplete(result.id), 1500);
      } catch (err) {
        setStatus("error");
        setMessage(String(err));
      }
    },
    [brandName, onComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: status === "uploading",
  });

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1.5">
          Brand Name (optional — we&apos;ll extract it from the PDF if blank)
        </label>
        <input
          className="input-base"
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          placeholder="Acme Corp"
        />
      </div>

      <div
        {...getRootProps()}
        className={`rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all ${
          isDragActive
            ? "border-purple-500 bg-purple-500/10"
            : status === "success"
            ? "border-green-500 bg-green-500/10"
            : status === "error"
            ? "border-red-500 bg-red-500/10"
            : "border-[var(--border)] hover:border-purple-500/50 hover:bg-white/5"
        }`}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-3">
          {status === "uploading" && <Loader2 size={32} className="text-purple-400 animate-spin" />}
          {status === "success" && <CheckCircle size={32} className="text-green-400" />}
          {status === "error" && <AlertCircle size={32} className="text-red-400" />}
          {status === "idle" && (
            isDragActive ? (
              <FileText size={32} className="text-purple-400" />
            ) : (
              <Upload size={32} className="text-gray-500" />
            )
          )}

          <div>
            {status === "idle" && (
              <>
                <p className="text-sm text-gray-300 font-medium">
                  {isDragActive ? "Drop your brand guide here" : "Drop your brand guide PDF here"}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  or click to browse — Claude will extract colors, fonts, tone & more
                </p>
              </>
            )}
            {status === "uploading" && (
              <p className="text-sm text-gray-300">{message}</p>
            )}
            {status === "success" && (
              <p className="text-sm text-green-300">{message}</p>
            )}
            {status === "error" && (
              <>
                <p className="text-sm text-red-300">Extraction failed</p>
                <p className="text-xs text-red-400 mt-1">{message}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setStatus("idle"); }}
                  className="mt-2 text-xs text-gray-400 hover:text-white underline"
                >
                  Try again
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-600 text-center">
        Supports any PDF brand guide, style guide, or brand book. Max 50MB.
      </p>
    </div>
  );
}
