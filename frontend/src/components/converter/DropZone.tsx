"use client";

// src/components/converter/DropZone.tsx
import { useCallback, useState } from "react";
import { useDropzone, FileRejection } from "react-dropzone"; // Tambahkan FileRejection
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileCheck, X, AlertCircle } from "lucide-react";
import { ConversionOption } from "@/types";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  option: ConversionOption;
  files: File[];
  onFilesChange: (files: File[]) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

export default function DropZone({ option, files, onFilesChange }: DropZoneProps) {
  const [sizeError, setSizeError] = useState<string | null>(null);

  // Perbaikan Tipe Data pada parameter rejected
  const onDrop = useCallback(
    (accepted: File[], fileRejections: FileRejection[]) => {
      setSizeError(null);
      
      if (fileRejections.length > 0) {
        // Mengambil pesan error pertama dari library
        const msg = fileRejections[0].errors[0]?.message || "File ditolak";
        setSizeError(msg);
        return;
      }

      if (option.multiFile) {
        onFilesChange([...files, ...accepted]);
      } else {
        onFilesChange(accepted.slice(0, 1));
      }
    },
    [files, option.multiFile, onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, // Sekarang sudah kompatibel dengan TypeScript
    accept: option.acceptedMime,
    multiple: option.multiFile ?? false,
    maxSize: 50 * 1024 * 1024, // 50 MB
  });

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Drop area */}
      <div
        {...getRootProps()}
        className={cn(
          "relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center",
          "transition-all duration-200",
          isDragActive
            ? "border-blue-400 bg-blue-50/10 scale-[1.01]"
            : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
        )}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {isDragActive ? (
            <motion.div
              key="dragging"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="text-5xl">📂</div>
              <p className="text-blue-300 font-semibold">Lepas file di sini!</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex flex-col items-center gap-3"
            >
              <div className={cn("p-4 rounded-2xl bg-gradient-to-br", option.color)}>
                <Upload className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-base">
                  Seret & lepas file{option.multiFile ? " (bisa lebih dari satu)" : ""}
                </p>
                <p className="text-white/50 text-sm mt-1">
                  atau <span className="text-blue-300 underline">klik untuk memilih</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                {option.acceptedFormats.map((fmt) => (
                  <span
                    key={fmt}
                    className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-xs font-mono"
                  >
                    {fmt.toUpperCase()}
                  </span>
                ))}
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-xs">
                  max 50 MB
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Size/type error */}
      <AnimatePresence>
        {sizeError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-rose-400 text-sm bg-rose-500/10 rounded-xl px-4 py-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {sizeError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* File list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {files.map((file, i) => (
              <motion.li
                key={`${file.name}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10"
              >
                <FileCheck className="w-5 h-5 text-green-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{file.name}</p>
                  <p className="text-white/40 text-xs">{formatBytes(file.size)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Hapus file"
                >
                  <X className="w-4 h-4 text-white/50 hover:text-rose-400" />
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}