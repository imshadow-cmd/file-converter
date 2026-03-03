"use client";

// src/components/converter/ConverterModal.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, AlertCircle } from "lucide-react";
import { ConversionOption } from "@/types";
import { useConverter } from "@/hooks/useConverter";
import DropZone from "./DropZone";
import ProgressBar from "./ProgressBar";
import ResultModal from "./ResultModal";
import { cn } from "@/lib/utils";

interface ConverterModalProps {
  option: ConversionOption;
  onClose: () => void;
}

export default function ConverterModal({ option, onClose }: ConverterModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [extraFields, setExtraFields] = useState<Record<string, string | number>>(() => {
    const defaults: Record<string, string | number> = {};
    option.extraFields?.forEach((f) => { defaults[f.name] = f.defaultValue; });
    return defaults;
  });

  const { status, uploadProgress, result, error, convert, reset, downloadResult } = useConverter();

  const isConverting = status === "uploading" || status === "processing";
  const isDone = status === "done";

  const handleConvert = async () => {
    if (!files.length) return;
    await convert(option, files, extraFields);
  };

  const handleReset = () => {
    reset();
    setFiles([]);
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-30 bg-black/70 backdrop-blur-md"
        onClick={isConverting ? undefined : onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="fixed inset-0 z-30 overflow-y-auto flex items-center justify-center p-4"
        style={{ pointerEvents: "none" }}
      >
        <div
          className="bg-gray-950 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl"
          style={{ pointerEvents: "auto" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br", option.color)}>
                {option.icon}
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">{option.label}</h2>
                <p className="text-white/40 text-xs">{option.description}</p>
              </div>
            </div>
            {!isConverting && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-white/50" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Drop zone */}
            <DropZone
              option={option}
              files={files}
              onFilesChange={setFiles}
            />

            {/* Extra fields */}
            {option.extraFields && option.extraFields.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {option.extraFields.map((field) => (
                  <div key={field.name} className="space-y-1.5">
                    <label className="block text-xs text-white/50 font-medium">
                      {field.label}
                    </label>
                    {field.type === "select" ? (
                      <select
                        value={extraFields[field.name]}
                        onChange={(e) =>
                          setExtraFields((prev) => ({ ...prev, [field.name]: e.target.value }))
                        }
                        className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                      >
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-gray-900">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        value={extraFields[field.name]}
                        min={field.min}
                        max={field.max}
                        onChange={(e) =>
                          setExtraFields((prev) => ({
                            ...prev,
                            [field.name]: Number(e.target.value),
                          }))
                        }
                        className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Progress */}
            <AnimatePresence>
              {(status === "uploading" || status === "processing") && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <ProgressBar status={status} progress={uploadProgress} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {status === "error" && error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-rose-300 text-sm leading-relaxed">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Convert button */}
            <motion.button
              whileHover={files.length && !isConverting ? { scale: 1.01 } : {}}
              whileTap={files.length && !isConverting ? { scale: 0.99 } : {}}
              onClick={handleConvert}
              disabled={!files.length || isConverting}
              className={cn(
                "w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-base transition-all",
                files.length && !isConverting
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                  : "bg-white/5 text-white/30 cursor-not-allowed"
              )}
            >
              {isConverting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
                  />
                  {status === "uploading" ? "Mengunggah…" : "Memproses…"}
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Mulai Konversi
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Result modal (rendered above converter modal) */}
      <ResultModal
        isOpen={isDone}
        result={result}
        onDownload={downloadResult}
        onReset={() => { handleReset(); onClose(); }}
      />
    </>
  );
}
