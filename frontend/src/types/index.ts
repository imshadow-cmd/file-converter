// src/types/index.ts

export type ConversionCategory = "document" | "image" | "pdf";

export interface ConversionOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  endpoint: string;
  acceptedFormats: string[];           // e.g. [".docx", ".doc"]
  acceptedMime: Record<string, string[]>; // for react-dropzone
  category: ConversionCategory;
  color: string;                       // Tailwind gradient classes
  multiFile?: boolean;                 // for merge PDF
  extraFields?: ExtraField[];
}

export interface ExtraField {
  name: string;
  label: string;
  type: "number" | "select";
  defaultValue: string | number;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
}

export type ConversionStatus = "idle" | "uploading" | "processing" | "done" | "error";

export interface ConversionResult {
  task_id: string;
  file_id: string;
  status: string;
  output_filename: string;
  download_url: string;
  original_size_kb?: number;
  compressed_size_kb?: number;
  reduction_percent?: number;
}
