// src/hooks/useConverter.ts
import { useState, useCallback } from "react";
import { ConversionOption, ConversionStatus, ConversionResult } from "@/types";
import { convertFiles, buildDownloadUrl } from "@/lib/api";

interface UseConverterState {
  status: ConversionStatus;
  uploadProgress: number;
  result: ConversionResult | null;
  error: string | null;
}

interface UseConverterActions {
  convert: (
    option: ConversionOption,
    files: File[],
    extraFields?: Record<string, string | number>
  ) => Promise<void>;
  reset: () => void;
  downloadResult: () => void;
}

export function useConverter(): UseConverterState & UseConverterActions {
  const [status, setStatus] = useState<ConversionStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setUploadProgress(0);
    setResult(null);
    setError(null);
  }, []);

  const convert = useCallback(
    async (
      option: ConversionOption,
      files: File[],
      extraFields: Record<string, string | number> = {}
    ) => {
      setStatus("uploading");
      setUploadProgress(0);
      setError(null);
      setResult(null);

      try {
        const data = await convertFiles(
          option.endpoint,
          files,
          extraFields,
          (pct) => {
            setUploadProgress(pct);
            if (pct === 100) setStatus("processing");
          },
          option.category
        );

        setResult(data);
        setStatus("done");
      } catch (err: unknown) {
        let message = "Terjadi kesalahan saat konversi.";

        if (err && typeof err === "object" && !("response" in err)) {
          message = "Gagal terhubung ke server (Network Error). Pastikan Backend menyala.";
        }

        if (err && typeof err === "object" && "response" in err) {
          const axErr = err as { response?: { data?: { detail?: string } } };
          message = axErr.response?.data?.detail || message;
        } else if (err instanceof Error) {
          message = err.message;
        }

        setError(message);
        setStatus("error");
      }
    },
    []
  );

  // PEMBAHARUAN: Otomatis kembali ke halaman utama setelah download
  const downloadResult = useCallback(() => {
    if (!result) return;
    
    // 1. Jalankan proses pengunduhan
    const url = buildDownloadUrl(result.download_url);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.output_filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // 2. Beri jeda 2 detik agar browser memproses download, lalu reset state
    // Ini akan mengarahkan UI kembali ke tampilan pemilihan file (halaman utama)
    setTimeout(() => {
      reset();
    }, 1000); 
  }, [result, reset]);

  return { status, uploadProgress, result, error, convert, reset, downloadResult };
}