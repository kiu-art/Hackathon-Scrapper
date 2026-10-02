import io
import re
import httpx
import pdfplumber


class PDFExtractionError(Exception):
    """Custom exception raised when downloading or extracting text from a PDF fails."""
    pass


def clean_pdf_text(raw_text: str) -> str:
    """
    Cleans raw text extracted from PDF:
    - Removes null bytes and non-printable control characters
    - Normalizes non-breaking spaces and tabs
    - Collapses consecutive newlines
    - Strips dangling whitespace on each line
    """
    if not raw_text:
        return ""

    # Remove null bytes (common in poorly encoded PDF fonts)
    text = raw_text.replace("\x00", "")

    # Normalize unicode non-breaking spaces
    text = text.replace("\u00a0", " ")

    # Strip trailing whitespace on each line
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.splitlines()]

    # Collapse excessive blank lines down to double newlines
    cleaned = "\n".join(lines)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)

    return cleaned.strip()


async def extract_text_from_pdf_url(
    pdf_url: str,
    timeout: float = 20.0,
    min_char_count: int = 50,
) -> str:
    """
    Downloads a PDF from an ImageKit (or any HTTP/HTTPS) URL into memory and extracts text.

    Args:
        pdf_url: Public ImageKit URL pointing to the uploaded PDF.
        timeout: Request timeout in seconds.
        min_char_count: Minimum characters required to consider extraction valid.

    Raises:
        PDFExtractionError: If download fails, response is not a PDF, or text is unreadable/scanned.

    Returns:
        Cleaned, contiguous plain text extracted across all pages.
    """
    if not pdf_url or not (pdf_url.startswith("http://") or pdf_url.startswith("https://")):
        raise PDFExtractionError("A valid HTTP or HTTPS PDF URL must be provided.")

    # 1. Fetch PDF bytes asynchronously
    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            response = await client.get(pdf_url)

            if response.status_code != 200:
                raise PDFExtractionError(
                    f"Failed to fetch PDF from ImageKit URL. Status Code: {response.status_code}"
                )

            file_bytes = response.content

    except httpx.TimeoutException:
        raise PDFExtractionError(f"Request timed out while downloading PDF after {timeout} seconds.")
    except httpx.RequestError as exc:
        raise PDFExtractionError(f"Network error while fetching PDF: {str(exc)}")

    # 2. Basic file header validation (PDF magic bytes)
    if not file_bytes.startswith(b"%PDF"):
        raise PDFExtractionError(
            "The URL did not return a valid PDF document. Check that the ImageKit link is correct."
        )

    # 3. Extract text page-by-page from in-memory bytes
    try:
        extracted_pages = []

        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            if not pdf.pages:
                raise PDFExtractionError("The PDF document contains no pages.")

            for page in pdf.pages:
                page_text = page.extract_text(layout=False)
                if page_text:
                    extracted_pages.append(page_text)

        full_text = "\n\n".join(extracted_pages)
        cleaned_text = clean_pdf_text(full_text)

        # Scanned documents / image-only PDFs return empty or negligible text
        if len(cleaned_text) < min_char_count:
            raise PDFExtractionError(
                "Unable to extract text. The document appears to be an image-only scan "
                "or contains protected font encodings. Please ensure the PDF is text-based."
            )

        return cleaned_text

    except PDFExtractionError:
        raise
    except Exception as exc:
        raise PDFExtractionError(f"Failed to parse PDF document content: {str(exc)}") from exc