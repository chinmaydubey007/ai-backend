import os
import logging
import fitz  # PyMuPDF

logger = logging.getLogger("AI_Backend.DocProcessor")

class DocumentProcessor:
    """
    Handles PDF ingestion: extracts text and splits it into chunks.
    Each chunk retains metadata (source file, page number) for citations.
    """

    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = upload_dir
        os.makedirs(upload_dir, exist_ok=True)
        logger.info(f"Document processor ready. Upload dir: {upload_dir}")

    def save_file(self, filename: str, content: bytes) -> str:
        """Save uploaded file to disk and return the path."""
        filepath = os.path.join(self.upload_dir, filename)
        with open(filepath, "wb") as f:
            f.write(content)
        logger.info(f"Saved file: {filepath} ({len(content)} bytes)")
        return filepath

    def extract_text_from_pdf(self, filepath: str) -> list[dict]:
        """
        Extracts text from each page of a PDF.
        Returns a list of {page, text} dicts.
        """
        pages = []
        doc = fitz.open(filepath)
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text("text")
            if text.strip():
                pages.append({
                    "page": page_num + 1,
                    "text": text.strip()
                })
        doc.close()
        logger.info(f"Extracted {len(pages)} pages from {filepath}")
        return pages

    def chunk_text(self, pages: list[dict], filename: str, chunk_size: int = 500, overlap: int = 50) -> list[dict]:
        """
        Splits extracted page text into overlapping chunks.
        Each chunk carries metadata for citation purposes.
        
        chunk_size: approximate number of characters per chunk
        overlap: number of characters to overlap between chunks
        """
        chunks = []
        chunk_id = 0

        for page_data in pages:
            text = page_data["text"]
            page_num = page_data["page"]
            
            # Slide a window over the text
            start = 0
            while start < len(text):
                end = start + chunk_size
                chunk_text = text[start:end]
                
                # Only add if the chunk has meaningful content
                if len(chunk_text.strip()) > 20:
                    chunks.append({
                        "id": f"{filename}_p{page_num}_c{chunk_id}",
                        "text": chunk_text.strip(),
                        "metadata": {
                            "source": filename,
                            "page": page_num,
                            "chunk_index": chunk_id,
                        }
                    })
                    chunk_id += 1
                
                start += chunk_size - overlap

        logger.info(f"Created {len(chunks)} chunks from {filename}")
        return chunks
