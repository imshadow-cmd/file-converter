import axios, { AxiosProgressEvent } from "axios";
import { ConversionResult } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 120_000,
});

export async function convertFiles(
  endpoint: string,
  files: File[],
  extraFields: Record<string, string | number> = {},
  onProgress?: (percent: number) => void,
  category: string = "image" // Default category
): Promise<ConversionResult> {
  const formData = new FormData();
  
  // Penentuan field name berdasarkan jumlah file
  const fieldName = files.length > 1 ? "files" : "file";
  files.forEach((f) => formData.append(fieldName, f));

  // Masukkan field tambahan (quality, dsb)
  Object.entries(extraFields).forEach(([k, v]) => formData.append(k, String(v)));

  // PENENTUAN PREFIX:
  // Jika kategori adalah 'pdf', gunakan '/pdf', selain itu gunakan '/convert'
  const prefix = category === "pdf" ? "/pdf" : "/convert";
  const url = `${prefix}/${endpoint}`;

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

export function buildDownloadUrl(relativeUrl: string): string {
  const cleanPath = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
  return `${API_BASE}${cleanPath}`;
}