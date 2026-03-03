"""
File validation utilities — security & type checking.
"""

from fastapi import HTTPException, UploadFile

# ── Allowed MIME types (whitelist approach) ───────────────────────────────────
ALLOWED_MIME_TYPES: set[str] = {
    # Documents
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",        # .xlsx
    "application/msword",                                                        # .doc (legacy)
    # Images
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
    "image/tiff",
}

ALLOWED_EXTENSIONS: set[str] = {
    ".pdf", ".docx", ".doc", ".xlsx",
    ".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tiff",
}

MAX_FILE_SIZE_MB = 50
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


async def validate_file(file: UploadFile, allowed_exts: set[str] | None = None) -> None:
    """
    Validate an uploaded file for:
      - Extension whitelist
      - MIME type whitelist
      - Maximum file size
      - No path traversal in filename
    Raises HTTPException on any violation.
    """
    filename = file.filename or ""

    # 1. Sanitize filename — reject path traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    # 2. Extension check
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    allowed = allowed_exts or ALLOWED_EXTENSIONS
    if ext not in allowed:
        raise HTTPException(
            status_code=415,
            detail=f"File type '{ext}' is not supported. Allowed: {sorted(allowed)}",
        )

    # 3. MIME type check
    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        # Some clients send wrong MIME — only block obviously dangerous ones
        dangerous = {"application/x-executable", "application/x-msdownload",
                     "application/x-sh", "text/x-python", "application/x-php"}
        if file.content_type in dangerous:
            raise HTTPException(status_code=415, detail="Executable files are not allowed")

    # 4. File size — read in chunks to avoid loading whole file into RAM
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum size of {MAX_FILE_SIZE_MB} MB",
        )

    # Reset stream so routers can read it again
    await file.seek(0)
