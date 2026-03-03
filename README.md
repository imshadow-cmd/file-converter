# 🔄 FileConverter — All-in-One File Conversion Platform

Platform konversi file lengkap dengan **Next.js 14** (Frontend) dan **FastAPI** (Backend).

---

## 📁 Struktur Proyek

```
fileconverter/
├── backend/                    ← FastAPI (Python)
│   ├── main.py                 ← Entry point, CORS, lifespan, download endpoint
│   ├── requirements.txt
│   ├── routers/
│   │   ├── documents.py        ← Word→PDF, PDF→Word, Excel→PDF
│   │   ├── images.py           ← JPG↔PNG, Image→PDF, →WebP
│   │   └── pdf_tools.py        ← Merge, Split, Compress PDF
│   └── utils/
│       ├── validators.py       ← Security: extension/MIME/size checks
│       └── cleanup.py          ← Auto-delete temp files after 1 hour
│
└── frontend/                   ← Next.js 14 (TypeScript)
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx        ← Home page with category grid
        │   └── globals.css
        ├── components/
        │   └── converter/
        │       ├── ConversionCard.tsx   ← Individual format card
        │       ├── ConverterModal.tsx   ← Main conversion dialog
        │       ├── DropZone.tsx         ← Drag & drop upload area
        │       ├── ProgressBar.tsx      ← Upload/processing progress
        │       └── ResultModal.tsx      ← Success + download modal
        ├── hooks/
        │   └── useConverter.ts  ← Conversion state management
        ├── lib/
        │   ├── api.ts           ← Axios API client
        │   ├── conversions.ts   ← All conversion options config
        │   └── utils.ts         ← cn() helper
        └── types/
            └── index.ts         ← TypeScript interfaces
```

---

## 🚀 Cara Menjalankan Secara Lokal

### Prasyarat
- Python 3.10+
- Node.js 18+
- npm atau yarn

---

### 1. Backend (FastAPI)

```bash
# Masuk ke folder backend
cd fileconverter/backend

# Buat virtual environment
python -m venv venv

# Aktivasi virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install semua dependensi
pip install -r requirements.txt

# Jalankan server (development)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend akan berjalan di: **http://localhost:8000**

Dokumentasi API otomatis: **http://localhost:8000/docs**

---

### 2. Frontend (Next.js)

```bash
# Masuk ke folder frontend
cd fileconverter/frontend

# Copy file environment
cp .env.example .env.local

# Install dependensi
npm install

# Jalankan development server
npm run dev
```

Frontend akan berjalan di: **http://localhost:3000**

---

### 3. Jalankan Keduanya Sekaligus (Linux/macOS)

```bash
# Terminal 1 — Backend
cd fileconverter/backend && source venv/bin/activate && uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd fileconverter/frontend && npm run dev
```

---

## 🔌 API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/health` | Health check |
| `POST` | `/convert/word-to-pdf` | DOCX → PDF |
| `POST` | `/convert/pdf-to-word` | PDF → DOCX |
| `POST` | `/convert/excel-to-pdf` | XLSX → PDF |
| `POST` | `/convert/jpg-to-png` | JPG → PNG |
| `POST` | `/convert/png-to-jpg` | PNG → JPG (+ quality param) |
| `POST` | `/convert/image-to-pdf` | Image → PDF |
| `POST` | `/convert/to-webp` | Any image → WebP |
| `POST` | `/pdf/merge` | Merge 2-20 PDFs |
| `POST` | `/pdf/split` | Split PDF by page range |
| `POST` | `/pdf/compress` | Compress PDF (low/medium/high) |
| `GET` | `/status/{task_id}` | Check task status |
| `GET` | `/download/{file_id}` | Download converted file |

### Contoh Request dengan cURL

```bash
# Word to PDF
curl -X POST http://localhost:8000/convert/word-to-pdf \
  -F "file=@document.docx" \
  -o result.json

# Compress PDF
curl -X POST http://localhost:8000/pdf/compress \
  -F "file=@document.pdf" \
  -F "level=medium" \
  -o result.json

# Merge PDF
curl -X POST http://localhost:8000/pdf/merge \
  -F "files=@file1.pdf" \
  -F "files=@file2.pdf" \
  -o result.json
```

---

## 🛡️ Keamanan yang Diimplementasikan

1. **Whitelist extension** — Hanya format file yang diizinkan yang diterima
2. **MIME type validation** — Mencegah file executable yang menyamar sebagai gambar
3. **Path traversal prevention** — Nama file disanitasi dari karakter berbahaya
4. **File size limit** — Maksimum 50 MB per file
5. **Secure file ID** — File disimpan dengan UUID random, bukan nama asli
6. **Auto-cleanup** — File temporary otomatis dihapus setelah 1 jam

---

## 📦 Dependensi Utama

### Backend
| Library | Kegunaan |
|---------|----------|
| `fastapi` | Web framework |
| `uvicorn` | ASGI server |
| `python-docx` | Read/write DOCX |
| `pdf2docx` | Convert PDF → DOCX |
| `reportlab` | Generate PDF |
| `openpyxl` | Read Excel files |
| `Pillow` | Image processing |
| `PyMuPDF` | PDF merge/split/compress |

### Frontend
| Library | Kegunaan |
|---------|----------|
| `next` 14 | React framework |
| `framer-motion` | Animasi smooth |
| `react-dropzone` | Drag & drop upload |
| `axios` | HTTP client |
| `tailwindcss` | Utility CSS |
| `lucide-react` | Icon set |

---

## 🔧 Pengembangan Lanjutan

- **Task Queue**: Ganti `BackgroundTasks` dengan **Celery + Redis** untuk file besar
- **Storage**: Ganti `/tmp/` dengan **AWS S3** atau **MinIO** untuk produksi
- **Auth**: Tambah JWT authentication untuk user management
- **Rate limiting**: Implementasikan `slowapi` untuk mencegah abuse
- **Docker**: Tambah `docker-compose.yml` untuk deployment mudah
