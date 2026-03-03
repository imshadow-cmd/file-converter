"""
PDF Tool endpoints:
  POST /pdf/merge     — Merge multiple PDFs
  POST /pdf/split     — Split PDF into individual pages
  POST /pdf/compress  — Compress PDF file size
"""

import uuid
import logging
from pathlib import Path
from typing import List

from fastapi import APIRouter, UploadFile, File, BackgroundTasks, Request, HTTPException, Form

from utils.validators import validate_file
from utils.cleanup import schedule_file_cleanup

router = APIRouter()
logger = logging.getLogger(__name__)


def _save_bytes(content: bytes, suffix: str, tmp_dir: Path) -> Path:
    path = tmp_dir / f"{uuid.uuid4().hex}{suffix}"
    path.write_bytes(content)
    return path


# ── Merge PDF ─────────────────────────────────────────────────────────────────
@router.post("/merge", summary="Merge multiple PDFs into one")
async def merge_pdfs(
    request: Request,
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
):
    """Accept 2–20 PDF files and merge them in order."""
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="Please upload at least 2 PDF files")
    if len(files) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 files per merge")

    tmp_dir: Path = request.app.state.tmp_dir
    input_paths: list[Path] = []

    for f in files:
        await validate_file(f, allowed_exts={".pdf"})
        content = await f.read()
        input_paths.append(_save_bytes(content, ".pdf", tmp_dir))

    output_id = uuid.uuid4().hex
    output_path = tmp_dir / f"{output_id}.pdf"

    try:
        import fitz  # PyMuPDF

        merged = fitz.open()
        for ip in input_paths:
            src = fitz.open(str(ip))
            merged.insert_pdf(src)
            src.close()
        merged.save(str(output_path), garbage=4, deflate=True)
        merged.close()

    except Exception as e:
        for p in input_paths:
            p.unlink(missing_ok=True)
        logger.error("merge failed: %s", e)
        raise HTTPException(status_code=422, detail=f"Merge failed: {str(e)}")

    schedule_file_cleanup(background_tasks, *input_paths, output_path)

    return {
        "task_id": output_id,
        "file_id": output_id,
        "status": "done",
        "output_filename": "merged.pdf",
        "page_count": None,  # filled below if needed
        "download_url": f"/download/{output_id}",
    }


# ── Split PDF ─────────────────────────────────────────────────────────────────
@router.post("/split", summary="Split PDF — extract a page range")
async def split_pdf(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    start_page: int = Form(default=1, ge=1, description="First page (1-indexed)"),
    end_page: int = Form(default=1, ge=1, description="Last page (inclusive)"),
):
    """
    Extract pages [start_page, end_page] from a PDF.
    For splitting into ALL individual pages, use start_page=1 end_page=total_pages
    and set the 'split_all' flag (future enhancement).
    """
    await validate_file(file, allowed_exts={".pdf"})
    content = await file.read()
    tmp_dir: Path = request.app.state.tmp_dir

    input_path = _save_bytes(content, ".pdf", tmp_dir)
    output_id = uuid.uuid4().hex
    output_path = tmp_dir / f"{output_id}.pdf"

    try:
        import fitz

        src = fitz.open(str(input_path))
        total = src.page_count

        # Validate page range
        if start_page > total or end_page > total:
            raise HTTPException(
                status_code=400,
                detail=f"PDF has only {total} pages (requested {start_page}–{end_page})",
            )
        if start_page > end_page:
            raise HTTPException(status_code=400, detail="start_page must be ≤ end_page")

        # PyMuPDF uses 0-indexed pages
        new_doc = fitz.open()
        new_doc.insert_pdf(src, from_page=start_page - 1, to_page=end_page - 1)
        new_doc.save(str(output_path))
        new_doc.close()
        src.close()

    except HTTPException:
        raise
    except Exception as e:
        input_path.unlink(missing_ok=True)
        logger.error("split failed: %s", e)
        raise HTTPException(status_code=422, detail=f"Split failed: {str(e)}")

    schedule_file_cleanup(background_tasks, input_path, output_path)
    stem = Path(file.filename).stem

    return {
        "task_id": output_id,
        "file_id": output_id,
        "status": "done",
        "output_filename": f"{stem}_pages_{start_page}-{end_page}.pdf",
        "download_url": f"/download/{output_id}",
    }


# ── Compress PDF ──────────────────────────────────────────────────────────────
@router.post("/compress", summary="Reduce PDF file size")
async def compress_pdf(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    level: str = Form(default="medium", description="'low' | 'medium' | 'high'"),
):
    """
    Compress a PDF by downsampling embedded images.
    Levels map to JPEG quality:  low=40  medium=65  high=85
    """
    if level not in ("low", "medium", "high"):
        raise HTTPException(status_code=400, detail="level must be 'low', 'medium', or 'high'")

    await validate_file(file, allowed_exts={".pdf"})
    content = await file.read()
    tmp_dir: Path = request.app.state.tmp_dir

    input_path = _save_bytes(content, ".pdf", tmp_dir)
    output_id = uuid.uuid4().hex
    output_path = tmp_dir / f"{output_id}.pdf"

    quality_map = {"low": 40, "medium": 65, "high": 85}
    jpeg_quality = quality_map[level]

    try:
        import fitz

        doc = fitz.open(str(input_path))

        for page in doc:
            # Re-compress each image in the page
            for img_info in page.get_images(full=True):
                xref = img_info[0]
                try:
                    base_image = doc.extract_image(xref)
                    img_bytes = base_image["image"]
                    img_ext = base_image["ext"]

                    if img_ext.lower() not in ("jpeg", "jpg", "png", "bmp"):
                        continue  # skip exotic formats

                    from PIL import Image
                    from io import BytesIO

                    pil_img = Image.open(BytesIO(img_bytes))
                    if pil_img.mode in ("RGBA", "P"):
                        pil_img = pil_img.convert("RGB")

                    buf = BytesIO()
                    pil_img.save(buf, format="JPEG", quality=jpeg_quality, optimize=True)
                    buf.seek(0)

                    doc.update_stream(xref, buf.read())
                except Exception:
                    pass  # skip problematic images, continue

        # Save with PDF compression flags
        doc.save(
            str(output_path),
            garbage=4,        # remove unused objects
            deflate=True,     # compress streams
            clean=True,       # sanitize content streams
        )
        doc.close()

    except Exception as e:
        input_path.unlink(missing_ok=True)
        logger.error("compress failed: %s", e)
        raise HTTPException(status_code=422, detail=f"Compression failed: {str(e)}")

    original_size = input_path.stat().st_size
    compressed_size = output_path.stat().st_size
    reduction_pct = round((1 - compressed_size / original_size) * 100, 1) if original_size else 0

    schedule_file_cleanup(background_tasks, input_path, output_path)
    stem = Path(file.filename).stem

    return {
        "task_id": output_id,
        "file_id": output_id,
        "status": "done",
        "output_filename": f"{stem}_compressed.pdf",
        "download_url": f"/download/{output_id}",
        "original_size_kb": round(original_size / 1024, 1),
        "compressed_size_kb": round(compressed_size / 1024, 1),
        "reduction_percent": reduction_pct,
    }
