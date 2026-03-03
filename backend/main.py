"""
FileConverter API — FastAPI Backend (Final Optimized)
Fix: State registration in lifespan to prevent AttributeError
"""

import os
import time
import asyncio
import logging
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

# Impor router dari folder routers
from routers import documents, images, pdf_tools

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
TMP_DIR = BASE_DIR / "tmp_fileconverter"
TMP_DIR.mkdir(parents=True, exist_ok=True)

# In-memory task store {task_id: TaskStatus}
TASKS: dict[str, dict] = {}

# ── Lifespan (Startup / Shutdown) ────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Menangani inisialisasi aplikasi dan pembersihan file.
    Daftarkan state di sini agar dapat diakses oleh semua router.
    """
    # Daftarkan variabel global ke dalam state aplikasi
    app.state.tasks = TASKS
    app.state.tmp_dir = TMP_DIR
    
    logger.info("🚀 FileConverter API started — tmp dir: %s", TMP_DIR)
    
    # Jalankan background task pembersihan otomatis
    cleanup_task = asyncio.create_task(periodic_cleanup())
    
    yield
    
    # Berhenti dan bersihkan saat shutdown
    cleanup_task.cancel()
    logger.info("👋 FileConverter API shutting down")

async def periodic_cleanup():
    """Menghapus file yang lebih tua dari 1 jam setiap 10 menit."""
    while True:
        await asyncio.sleep(600)  # Setiap 10 menit
        now = time.time()
        deleted = 0
        try:
            for f in TMP_DIR.iterdir():
                if f.is_file() and (now - f.stat().st_mtime) > 3600:
                    f.unlink(missing_ok=True)
                    deleted += 1
            if deleted:
                logger.info("🧹 Cleanup: deleted %d stale files", deleted)
        except Exception as e:
            logger.error(f"❌ Cleanup Error: {e}")

# ── App Initialization ────────────────────────────────────────────────────────
app = FastAPI(
    title="FileConverter API",
    description="All-in-One file conversion service",
    version="1.2.0",
    lifespan=lifespan, # Menggunakan lifespan yang sudah diperbaiki
)

# ── CORS Middleware (FIX Network Error) ───────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        # Tambahkan domain Vercel Anda di sini jika sudah deploy
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]
)

# ── Attach Routers ──────────────────────────────────────────────────────────
# Menghubungkan semua logika konversi berdasarkan kategori
app.include_router(documents.router, prefix="/convert", tags=["Documents"])
app.include_router(images.router,     prefix="/convert", tags=["Images"])
app.include_router(pdf_tools.router, prefix="/pdf",     tags=["PDF Tools"])

# ── Core Endpoints ────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "message": "Backend FileConverter is running!"}

@app.get("/health", tags=["Health"])
async def health():
    return {
        "status": "healthy", 
        "tmp_files": len(list(TMP_DIR.iterdir())),
        "storage_path": str(TMP_DIR)
    }

@app.get("/download/{file_id}", tags=["Tasks"])
async def download_file(file_id: str):
    """Endpoint untuk mengunduh file hasil konversi berdasarkan ID."""
    if not all(c in "0123456789abcdef-" for c in file_id):
        raise HTTPException(status_code=400, detail="Invalid file ID")

    # Mencari file dengan ID unik tersebut (mendukung semua ekstensi)
    matches = list(TMP_DIR.glob(f"{file_id}.*"))
    if not matches:
        raise HTTPException(status_code=404, detail="File expired or not found")

    file_path = matches[0]
    return FileResponse(
        path=file_path,
        filename=file_path.name,
        media_type="application/octet-stream",
    )