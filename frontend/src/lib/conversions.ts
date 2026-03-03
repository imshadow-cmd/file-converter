// C:\fileconverter\frontend\src\lib\conversions.ts
import { ConversionOption } from "@/types";

export const CONVERSIONS: ConversionOption[] = [
  // ── Documents ──────────────────────────────────────────────────────────────
  {
    id: "word-to-pdf",
    label: "Word → PDF",
    description: "Konversi dokumen DOCX menjadi PDF berkualitas tinggi",
    icon: "📝",
    endpoint: "word-to-pdf", // Diperbaharui: Dihapus prefix /convert/
    acceptedFormats: [".docx", ".doc"],
    acceptedMime: { "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] },
    category: "document",
    color: "from-blue-500 to-blue-700",
  },
  {
    id: "pdf-to-word",
    label: "PDF → Word",
    description: "Ubah PDF menjadi dokumen Word yang dapat diedit",
    icon: "📄",
    endpoint: "pdf-to-word", // Diperbaharui
    acceptedFormats: [".pdf"],
    acceptedMime: { "application/pdf": [".pdf"] },
    category: "document",
    color: "from-indigo-500 to-indigo-700",
  },
  {
    id: "excel-to-pdf",
    label: "Excel → PDF",
    description: "Ekspor spreadsheet Excel ke PDF dengan tabel rapi",
    icon: "📊",
    endpoint: "excel-to-pdf", // Diperbaharui
    acceptedFormats: [".xlsx", ".xls"],
    acceptedMime: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
    category: "document",
    color: "from-green-500 to-green-700",
  },

  // ── Images ─────────────────────────────────────────────────────────────────
  {
    id: "jpg-to-png",
    label: "JPG → PNG",
    description: "Konversi gambar JPEG ke format PNG transparan",
    icon: "🖼️",
    endpoint: "jpg-to-png", // Diperbaharui
    acceptedFormats: [".jpg", ".jpeg"],
    acceptedMime: { "image/jpeg": [".jpg", ".jpeg"] },
    category: "image",
    color: "from-orange-500 to-orange-700",
  },
  {
    id: "png-to-jpg",
    label: "PNG → JPG",
    description: "Kompres gambar PNG menjadi JPEG dengan kontrol kualitas",
    icon: "🎨",
    endpoint: "png-to-jpg", // Diperbaharui
    acceptedFormats: [".png"],
    acceptedMime: { "image/png": [".png"] },
    category: "image",
    color: "from-rose-500 to-rose-700",
    extraFields: [
      {
        name: "quality",
        label: "Kualitas JPEG",
        type: "select",
        defaultValue: "85",
        options: [
          { label: "Tinggi (85%)", value: "85" },
          { label: "Sedang (65%)", value: "65" },
          { label: "Rendah (45%)", value: "45" },
        ],
      },
    ],
  },
  {
    id: "image-to-pdf",
    label: "Image → PDF",
    description: "Ubah foto atau gambar apapun menjadi dokumen PDF",
    icon: "🖼️",
    endpoint: "image-to-pdf", // Diperbaharui
    acceptedFormats: [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"],
    acceptedMime: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"] },
    category: "image",
    color: "from-amber-500 to-amber-700",
  },
  {
    id: "to-webp",
    label: "→ WebP",
    description: "Konversi gambar apapun ke format WebP modern yang lebih kecil",
    icon: "⚡",
    endpoint: "to-webp", // Diperbaharui
    acceptedFormats: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff"],
    acceptedMime: { "image/*": [".jpg", ".jpeg", ".png", ".gif", ".bmp"] },
    category: "image",
    color: "from-purple-500 to-purple-700",
    extraFields: [
      {
        name: "quality",
        label: "Kualitas WebP",
        type: "select",
        defaultValue: "80",
        options: [
          { label: "Tinggi (80%)", value: "80" },
          { label: "Sedang (60%)", value: "60" },
          { label: "Rendah (40%)", value: "40" },
        ],
      },
    ],
  },

  // ── PDF Tools ──────────────────────────────────────────────────────────────
  {
    id: "merge-pdf",
    label: "Merge PDF",
    description: "Gabungkan beberapa file PDF menjadi satu dokumen",
    icon: "🔗",
    endpoint: "merge", // Diperbaharui: Dihapus prefix /pdf/
    acceptedFormats: [".pdf"],
    acceptedMime: { "application/pdf": [".pdf"] },
    category: "pdf",
    color: "from-teal-500 to-teal-700",
    multiFile: true,
  },
  {
    id: "split-pdf",
    label: "Split PDF",
    description: "Pisahkan halaman tertentu dari PDF menjadi file baru",
    icon: "✂️",
    endpoint: "split", // Diperbaharui
    acceptedFormats: [".pdf"],
    acceptedMime: { "application/pdf": [".pdf"] },
    category: "pdf",
    color: "from-cyan-500 to-cyan-700",
    extraFields: [
      { name: "start_page", label: "Halaman Awal", type: "number", defaultValue: 1, min: 1 },
      { name: "end_page",   label: "Halaman Akhir", type: "number", defaultValue: 1, min: 1 },
    ],
  },
  {
    id: "compress-pdf",
    label: "Compress PDF",
    description: "Perkecil ukuran file PDF tanpa kehilangan kualitas",
    icon: "🗜️",
    endpoint: "compress", // Diperbaharui
    acceptedFormats: [".pdf"],
    acceptedMime: { "application/pdf": [".pdf"] },
    category: "pdf",
    color: "from-sky-500 to-sky-700",
    extraFields: [
      {
        name: "level",
        label: "Level Kompresi",
        type: "select",
        defaultValue: "medium",
        options: [
          { label: "Rendah (kualitas tinggi)", value: "high" },
          { label: "Sedang (seimbang)", value: "medium" },
          { label: "Tinggi (file kecil)", value: "low" },
        ],
      },
    ],
  },
];