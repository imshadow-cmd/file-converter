"""
Image conversion endpoints:
  POST /convert/jpg-to-png
  POST /convert/png-to-jpg
  POST /convert/image-to-pdf
  POST /convert/to-webp
"""

import uuid
import logging
from pathlib import Path
from io import BytesIO

from fastapi import APIRouter, UploadFile, File, BackgroundTasks, Request, HTTPException, Form
from typing import Optional

from utils.validators import validate_file
from utils.cleanup import schedule_file_cleanup

router = APIRouter()
logger = logging.getLogger(__name__)

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tiff"}


def _save_upload(content: bytes, suffix: str, tmp_dir: Path) -> Path:
    path = tmp_dir / f"{uuid.uuid4().hex}{suffix}"
    path.write_bytes(content)
    return path


# ── Generic Image Converter ───────────────────────────────────────────────────
async def _do_image_convert(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile,
    target_format: str,         # e.g. "PNG", "JPEG", "WEBP"
    target_ext: str,            # e.g. ".png"
    quality: int = 85,
    allowed_exts: set[str] = IMAGE_EXTS,
):
    await validate_file(file, allowed_exts=allowed_exts)
    content = await file.read()
    tmp_dir: Path = request.app.state.tmp_dir

    ext = Path(file.filename).suffix.lower()
    input_path = _save_upload(content, ext, tmp_dir)
    output_id = uuid.uuid4().hex
    output_path = tmp_dir / f"{output_id}{target_ext}"

    try:
        from PIL import Image

        img = Image.open(input_path)

        # Convert RGBA / palette to RGB for JPEG compatibility
        if target_format == "JPEG" and img.mode in ("RGBA", "P", "LA"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "P":
                img = img.convert("RGBA")
            background.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
            img = background

        save_kwargs = {"format": target_format}
        if target_format in ("JPEG", "WEBP"):
            save_kwargs["quality"] = quality
            save_kwargs["optimize"] = True
        if target_format == "PNG":
            save_kwargs["optimize"] = True

        img.save(str(output_path), **save_kwargs)

    except Exception as e:
        input_path.unlink(missing_ok=True)
        logger.error("image convert failed (%s): %s", target_format, e)
        raise HTTPException(status_code=422, detail=f"Conversion failed: {str(e)}")

    schedule_file_cleanup(background_tasks, input_path, output_path)

    stem = Path(file.filename).stem
    return {
        "task_id": output_id,
        "file_id": output_id,
        "status": "done",
        "output_filename": f"{stem}{target_ext}",
        "download_url": f"/download/{output_id}",
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────
@router.post("/jpg-to-png", summary="JPG → PNG")
async def jpg_to_png(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    return await _do_image_convert(
        request, background_tasks, file,
        target_format="PNG", target_ext=".png",
        allowed_exts={".jpg", ".jpeg"},
    )


@router.post("/png-to-jpg", summary="PNG → JPG")
async def png_to_jpg(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    quality: int = Form(default=85, ge=10, le=100),
):
    return await _do_image_convert(
        request, background_tasks, file,
        target_format="JPEG", target_ext=".jpg",
        quality=quality,
        allowed_exts={".png"},
    )


@router.post("/to-webp", summary="Any image → WEBP")
async def to_webp(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    quality: int = Form(default=80, ge=10, le=100),
):
    return await _do_image_convert(
        request, background_tasks, file,
        target_format="WEBP", target_ext=".webp",
        quality=quality,
    )


@router.post("/image-to-pdf", summary="Image(s) → PDF")
async def image_to_pdf(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """Convert a single image to a PDF page (A4-fitted)."""
    await validate_file(file, allowed_exts=IMAGE_EXTS)
    content = await file.read()
    tmp_dir: Path = request.app.state.tmp_dir

    ext = Path(file.filename).suffix.lower()
    input_path = _save_upload(content, ext, tmp_dir)
    output_id = uuid.uuid4().hex
    output_path = tmp_dir / f"{output_id}.pdf"

    try:
        from PIL import Image
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Image as RLImage
        from reportlab.lib.units import cm
        from io import BytesIO

        img = Image.open(input_path)

        # Convert to RGB if needed
        if img.mode in ("RGBA", "P", "LA"):
            bg = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "P":
                img = img.convert("RGBA")
            bg.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
            img = bg
        elif img.mode != "RGB":
            img = img.convert("RGB")

        # Save as JPEG buffer for ReportLab
        buf = BytesIO()
        img.save(buf, format="JPEG", quality=90)
        buf.seek(0)

        # Fit image inside A4 with margins
        page_w, page_h = A4
        margin = 1.5 * cm
        max_w = page_w - 2 * margin
        max_h = page_h - 2 * margin

        img_w, img_h = img.size
        ratio = min(max_w / img_w, max_h / img_h)
        draw_w = img_w * ratio
        draw_h = img_h * ratio

        doc = SimpleDocTemplate(str(output_path), pagesize=A4,
                                leftMargin=margin, rightMargin=margin,
                                topMargin=margin, bottomMargin=margin)
        rl_img = RLImage(buf, width=draw_w, height=draw_h)
        doc.build([rl_img])

    except Exception as e:
        input_path.unlink(missing_ok=True)
        logger.error("image-to-pdf failed: %s", e)
        raise HTTPException(status_code=422, detail=f"Conversion failed: {str(e)}")

    schedule_file_cleanup(background_tasks, input_path, output_path)

    return {
        "task_id": output_id,
        "file_id": output_id,
        "status": "done",
        "output_filename": f"{Path(file.filename).stem}.pdf",
        "download_url": f"/download/{output_id}",
    }
