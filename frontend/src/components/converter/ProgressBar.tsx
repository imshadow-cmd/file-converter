"use client";

// src/components/converter/ProgressBar.tsx
import { motion } from "framer-motion";
import { ConversionStatus } from "@/types";

interface ProgressBarProps {
  status: ConversionStatus;
  progress: number;
}

const STATUS_LABELS: Record<ConversionStatus, string> = {
  idle: "",
  uploading: "Mengunggah file…",
  processing: "Memproses konversi…",
  done: "Selesai!",
  error: "Terjadi kesalahan",
};

export default function ProgressBar({ status, progress }: ProgressBarProps) {
  if (status === "idle") return null;

  // During "processing" show indeterminate animation
  const isIndeterminate = status === "processing";
  const displayProgress = isIndeterminate ? 100 : progress;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-white/70">{STATUS_LABELS[status]}</span>
        {!isIndeterminate && status === "uploading" && (
          <span className="text-sm text-white/50 font-mono">{progress}%</span>
        )}
      </div>

      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        {isIndeterminate ? (
          // Indeterminate sliding bar
          <motion.div
            className="h-full w-1/3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
            animate={{ x: ["0%", "300%", "0%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : (
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
            initial={{ width: 0 }}
            animate={{ width: `${displayProgress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        )}
      </div>
    </div>
  );
}
