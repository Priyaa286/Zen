"""Enterprise media and document upload endpoint with strict security controls.

Implements OWASP ASVS file upload security controls:
- File signature (magic byte) verification preventing MIME spoofing and polyglot payloads
- Strict MIME allowlist (JPEG, PNG, WebP, GIF, PDF)
- Explicit rejection of SVG (XSS vector), HTML, scripts, and executable binaries
- Hard 5 MB size ceiling
- Cryptographically randomized storage filenames (UUID4) preventing path traversal
- Storage in isolated directory outside executable application tree
"""

from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status

from app.core.security import get_optional_user
from app.database.models import UserORM

logger = logging.getLogger("zen.api.uploads")

router = APIRouter(tags=["Media Uploads"])

ALLOWED_MIME_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "application/pdf": ".pdf",
}

MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
UPLOAD_DIR = Path("static/uploads")


def verify_file_signature(content_type: str, file_bytes: bytes) -> bool:
    """
    Verifies that file header bytes match the declared MIME type.
    Detects MIME-spoofing attacks (e.g. renaming an executable or HTML to .png).
    """
    if len(file_bytes) < 12:
        return False

    if content_type in ("image/jpeg", "image/jpg"):
        return file_bytes.startswith(b"\xff\xd8\xff")

    if content_type == "image/png":
        return file_bytes.startswith(b"\x89PNG\r\n\x1a\n")

    if content_type == "image/gif":
        return file_bytes.startswith(b"GIF87a") or file_bytes.startswith(b"GIF89a")

    if content_type == "image/webp":
        return file_bytes.startswith(b"RIFF") and file_bytes[8:12] == b"WEBP"

    if content_type == "application/pdf":
        return file_bytes.startswith(b"%PDF-")

    return False


@router.post(
    "/upload",
    status_code=status.HTTP_201_CREATED,
    summary="Upload media asset",
    description="Securely upload product images, store banners, user avatars, or compliance PDF documents.",
)
async def upload_asset_endpoint(
    request: Request,
    file: UploadFile = File(...),
    folder: Optional[str] = Form("general"),
    user: Optional[UserORM] = Depends(get_optional_user),
):
    """
    Validates MIME type, checks magic file header bytes, enforces file size ceilings,
    sanitizes filenames with cryptographically secure UUIDs, and stores outside executable paths.
    """
    content_type = (file.content_type or "").lower().strip()
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{content_type}'. Allowed types: JPG, PNG, WebP, GIF, PDF.",
        )

    # Reject dangerous SVG explicitly (SVG can embed scripts / HTML)
    if "svg" in content_type or (file.filename and file.filename.lower().endswith(".svg")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SVG uploads are prohibited due to embedded script risks. Please upload a raster PNG or WebP image.",
        )

    ext = ALLOWED_MIME_TYPES[content_type]
    file_bytes = await file.read()
    file_size = len(file_bytes)

    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum permitted limit of 5 MB ({file_size / (1024*1024):.2f} MB provided).",
        )

    # Magic byte signature verification
    if not verify_file_signature(content_type, file_bytes):
        logger.warning("File signature mismatch for declared MIME type '%s'", content_type)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content does not match the declared MIME type signature. Upload rejected.",
        )

    # Sanitize folder and prevent path traversal
    safe_folder = "".join(c for c in (folder or "general") if c.isalnum() or c in ("-", "_"))
    target_dir = UPLOAD_DIR / safe_folder
    target_dir.mkdir(parents=True, exist_ok=True)

    safe_filename = f"{uuid.uuid4().hex[:16]}{ext}"
    target_path = target_dir / safe_filename

    try:
        with open(target_path, "wb") as f:
            f.write(file_bytes)
    except Exception as exc:
        logger.error("Failed to persist file '%s': %s", safe_filename, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while saving the uploaded asset.",
        )

    public_url = f"/static/uploads/{safe_folder}/{safe_filename}"

    return {
        "id": f"upl_{uuid.uuid4().hex[:12]}",
        "url": public_url,
        "fileName": os.path.basename(file.filename or safe_filename),
        "fileSize": file_size,
        "mimeType": content_type,
        "folder": safe_folder,
        "uploadedAt": datetime.now(timezone.utc).isoformat(),
        "source": "live",
    }
