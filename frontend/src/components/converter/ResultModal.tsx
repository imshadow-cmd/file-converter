"use client";

// src/components/converter/ResultModal.tsx
import { motion, AnimatePresence } from "framer-motion";
import { Download, CheckCircle2, X, RotateCcw, FileIcon } from "lucide-react";
import { ConversionResult } from "@/types";

interface ResultModalProps {
  isOpen: boolean;
  result: ConversionResult | null;
  onDownload: () => void;
  onReset: () => void;
}

export default function ResultModal({ isOpen, result, onDownload, onReset }: ResultModalProps) {
  return (
    <AnimatePresence>
      {isOpen && result && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onReset}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-gray-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl pointer-events-auto">
              {/* Close */}
              <button
                onClick={onReset}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>

              {/* Success icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1, stiffness: 260, damping: 16 }}
                className="flex justify-center mb-6"
              >
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </div>
                  {/* Ring animation */}
                  <motion.div
                    initial={{ opacity: 1, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.6 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="absolute inset-0 rounded-full border-2 border-green-400"
                  />
                </div>
              </motion.div>

              <h2 className="text-white text-xl font-bold text-center mb-1">
                Konversi Berhasil! 🎉
              </h2>
              <p className="text-white/50 text-sm text-center mb-6">
                File Anda siap untuk diunduh
              </p>

              {/* File info card */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                  <FileIcon className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">
                    {result.output_filename}
                  </p>
                  {result.compressed_size_kb && (
                    <p className="text-white/40 text-xs mt-0.5">
                      {result.original_size_kb} KB → {result.compressed_size_kb} KB
                      {result.reduction_percent && result.reduction_percent > 0 && (
                        <span className="text-green-400 ml-1">
                          (-{result.reduction_percent}%)
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onDownload}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-semibold py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-500/20"
                >
                  <Download className="w-5 h-5" />
                  Unduh File
                </motion.button>

                <button
                  onClick={onReset}
                  className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 font-medium py-3 rounded-2xl transition-colors border border-white/10"
                >
                  <RotateCcw className="w-4 h-4" />
                  Konversi File Lain
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
