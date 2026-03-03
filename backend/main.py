"""
FileConverter API — FastAPI Backend (Final Production Version)
Optimized for: Auto-Cleanup, Docker, and Koyeb/Render Deployment
"""

import os
import time
import asyncio
import logging
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks
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
    """Menangani inisialisasi state dan pembersihan background."""
    app.state.tasks = TASKS
    app.state.tmp_dir = TMP_DIR
    
    logger.info("🚀 FileConverter API started — tmp dir: %s", TMP_DIR)
    
    # Jalankan background task pembersihan otomatis berkala
    cleanup_task = asyncio.create_task(periodic_cleanup())
    
    yield
    
    cleanup_task.cancel()
    logger.info("👋 FileConverter API shutting down")

async def periodic_cleanup():
    """Menghapus file yang lebih tua dari 10 menit setiap 10 menit (Agresif)."""
    while True:
        await asyncio.sleep(600)  # Cek setiap 10 menit
        now = time.time()
        deleted = 0
        try:
            for f in TMP_DIR.iterdir():
                # Hapus file jika usianya lebih dari 600 detik (10 menit)
                if f.is_file() and (now - f.stat().st_mtime) > 600:
                    f.unlink(missing_ok=True)
                    deleted += 1
            if deleted:
                logger.info("🧹 Periodic Cleanup: deleted %d stale files", deleted)
        except Exception as e:
            logger.error(f"❌ Cleanup Error: {e}")

# ── App Initialization ────────────────────────────────────────────────────────
app = FastAPI(
    title="FileConverter API",
    description="All-in-One file conversion service",
    version="1.3.0",
    lifespan=lifespan,
)

# ── CORS Middleware ───────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Izinkan semua asal untuk kemudahan testing awal di internet
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]
)

# ── Attach Routers ──────────────────────────────────────────────────────────
app.include_router(documents.router, prefix="/convert", tags=["Documents"])
app.include_router(images.router,     prefix="/convert", tags=["Images"])
app.include_router(pdf_tools.router, prefix="/pdf",     tags=["PDF Tools"])

# ── Core Endpoints ────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "message": "Backend is Live!"}

@app.get("/health", tags=["Health"])
async def health():
    return {
        "status": "healthy", 
        "tmp_files": len(list(TMP_DIR.iterdir())),
        "storage_path": str(TMP_DIR)
    }

@app.get("/download/{file_id}", tags=["Tasks"])
async def download_file(file_id: str, background_tasks: BackgroundTasks):
    """Unduh file dan langsung hapus dari server setelah sukses terkirim."""
    if not all(c in "0123456789abcdef-" for c in file_id):
        raise HTTPException(status_code=400, detail="Invalid file ID")

    matches = list(TMP_DIR.glob(f"{file_id}.*"))
    if not matches:
        raise HTTPException(status_code=404, detail="File expired or not found")

    file_path = matches[0]

    # DAFTARKAN TUGAS PENGHAPUSAN INSTAN (Background Task)
    # File akan dihapus HANYA setelah response selesai dikirim ke pengguna.
    background_tasks.add_task(os.remove, str(file_path))

    return FileResponse(
        path=file_path,
        filename=file_path.name,
        media_type="application/octet-stream",
    )