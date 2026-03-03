import axios, { AxiosProgressEvent } from "axios";
import { ConversionResult } from "@/types";

// Port disesuaikan ke 10000 agar sesuai dengan backend Docker/Render kita
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 120_000, // Timeout 2 menit untuk file besar
});

export async function convertFiles(
  endpoint: string,
  files: File[],
  extraFields: Record<string, string | number> = {},
  onProgress?: (percent: number) => void,
  category: string = "image"
): Promise<ConversionResult> {
  const formData = new FormData();
  
  // Penentuan field name: 'files' jika banyak, 'file' jika tunggal
  const fieldName = files.length > 1 ? "files" : "file";
  files.forEach((f) => formData.append(fieldName, f));

  // Masukkan field tambahan seperti quality atau format tujuan
  Object.entries(extraFields).forEach(([k, v]) => formData.append(k, String(v)));

  // Logika prefix: '/pdf' untuk fitur PDF, '/convert' untuk gambar/dokumen lain
  const prefix = category === "pdf" ? "/pdf" : "/convert";
  
  // Memastikan endpoint tidak double slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `${prefix}/${cleanEndpoint}`;

  console.log("🚀 Menembak API ke:", API_BASE + url);

  const response = await api.post<ConversionResult>(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt: AxiosProgressEvent) => {
      if (evt.total && onProgress) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    },
  });

  return response.data;
}

/**
 * Fungsi untuk membuat URL download yang valid dari path relatif backend
 */
export function buildDownloadUrl(relativeUrl: string): string {
  if (!relativeUrl) return "";
  const cleanPath = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
  return `${API_BASE}${cleanPath}`;
}