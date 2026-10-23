import os
import shutil
import tempfile
from typing import Tuple
from pypdf import PdfReader
from fastapi import UploadFile, HTTPException

MAX_FILE_SIZE_MB = 10
ALLOWED_EXTENSIONS = {".pdf"}

def validate_pdf_file(file: UploadFile) -> None:
    """Validate file extension and mime type."""
    filename = file.filename or ""
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format '{ext}'. Only text-based PDF files are supported."
        )

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF bytes using PyPDF."""
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as temp_pdf:
        temp_path = temp_pdf.name
        temp_pdf.write(file_bytes)

    extracted_text = ""
    try:
        reader = PdfReader(temp_path)
        if len(reader.pages) == 0:
            raise HTTPException(status_code=400, detail="The uploaded PDF contains no pages.")
        
        for idx, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                extracted_text += f"\n--- Page {idx + 1} ---\n" + text

        extracted_text = extracted_text.strip()
        if not extracted_text or len(extracted_text) < 30:
            raise HTTPException(
                status_code=400,
                detail="Could not extract readable text from this PDF. Please ensure the PDF is not a scanned image and contains selectable text."
            )
        return extracted_text
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
