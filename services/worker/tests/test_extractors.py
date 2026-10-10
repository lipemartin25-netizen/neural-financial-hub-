import pytest
import io
import uuid
from pypdf import PdfWriter

from services.worker.extractors.file_extractor import extract_text_from_file
from services.worker.pipeline import enqueue_document_job, process_next_job, PROCESSING_JOBS_QUEUE
from services.api.app.schemas import DocumentStatus

def create_sample_pdf(text: str, encrypted: bool = False, password: str = "") -> bytes:
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    # Se pypdf permitir anotação ou texto simples:
    # Para teste de texto vetorial ou criptografia:
    buf = io.BytesIO()
    if encrypted:
        writer.encrypt(password)
    writer.write(buf)
    return buf.getvalue()

def test_extract_plain_text():
    content = "Comprovante de transferencia PIX efetuada com sucesso".encode("utf-8")
    success, text, err = extract_text_from_file(content, "recibo.txt", "text/plain")
    assert success is True
    assert "PIX" in text
    assert err is None

def test_extract_csv_rows():
    csv_bytes = b"Data,Descricao,Valor\n2026-10-10,Pagamento Fornecedor,150.00\n"
    success, text, err = extract_text_from_file(csv_bytes, "extrato.csv", "text/csv")
    assert success is True
    assert "Pagamento Fornecedor" in text

def test_extract_empty_file():
    success, text, err = extract_text_from_file(b"", "vazio.pdf", "application/pdf")
    assert success is False
    assert "vazio" in err.lower()

def test_extract_corrupted_pdf():
    garbage_bytes = b"%PDF-1.4 CORROMPIDO INVALIDO DADOS BINARIOS"
    success, text, err = extract_text_from_file(garbage_bytes, "quebrado.pdf", "application/pdf")
    assert success is False
    assert "corrompido" in err.lower() or "inválida" in err.lower()

def test_extract_password_protected_pdf():
    pdf_bytes = create_sample_pdf("Texto Secreto", encrypted=True, password="senha_forte_123")
    success, text, err = extract_text_from_file(pdf_bytes, "protegido.pdf", "application/pdf")
    assert success is False
    assert "protegido por senha" in err.lower()

def test_unsupported_format_honest_fallback():
    binary_data = b"\x00\x01\x02\x03\x04\x05"
    success, text, err = extract_text_from_file(binary_data, "arquivo.xyz", "application/octet-stream")
    assert success is False
    assert "sem extrator" in err.lower()

def test_worker_pipeline_end_to_end():
    # Limpa fila para o teste
    PROCESSING_JOBS_QUEUE.clear()

    doc_id = uuid.uuid4()
    user_id = uuid.uuid4()
    text_content = b"Comprovante de pagamento de exame laboratorio Saude paciente CRM 5544"

    job_id = enqueue_document_job(
        document_id=doc_id,
        user_id=user_id,
        file_name="exame_medico.txt",
        mime_type="text/plain",
        file_bytes=text_content
    )
    assert len(PROCESSING_JOBS_QUEUE) == 1

    processed_job = process_next_job()
    assert processed_job is not None
    assert processed_job["id"] == job_id
    assert processed_job["status"] == "completed"
    assert processed_job["result"]["document_status"] == DocumentStatus.READY
    assert processed_job["result"]["suggested_sector"] == "Saúde"
    assert processed_job["result"]["confidence_score"] >= 0.60
