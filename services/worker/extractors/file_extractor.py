import io
import csv
from typing import Tuple, Optional
from pypdf import PdfReader
from pypdf.errors import PdfReadError

def extract_text_from_file(file_bytes: bytes, file_name: str, mime_type: str) -> Tuple[bool, str, Optional[str]]:
    """
    Extrator de conteúdo por formato real.
    
    Retorna: (sucesso: bool, texto_extraido: str, erro_explicativo: Optional[str])
    
    Regras de integridade:
    - Se o arquivo for vazio: retorna falha com 'Arquivo vazio'.
    - Se for texto plano (.txt, .md, text/plain): decodifica UTF-8/latin1.
    - Se for CSV (.csv, text/csv): extrai células e linhas textuais.
    - Se for PDF (.pdf, application/pdf):
      - Se protegido por senha: não quebra, retorna (False, '', 'Arquivo protegido por senha').
      - Se corrompido: retorna (False, '', 'PDF corrompido ou ilegível').
      - Se for digitalizado/imagem sem camada de texto: retorna (True, '', 'Sem camada de texto legível (requer OCR)').
    - Se for formato sem extrator instalado (ex.: binários proprietários):
      retorna (False, '', 'Formato sem suporte a extração automática. Disponível para organização manual.').
    """
    if not file_bytes or len(file_bytes) == 0:
        return False, "", "Arquivo vazio."

    ext = file_name.split(".")[-1].lower() if "." in file_name else ""

    # 1. Arquivos de Texto Plano
    if ext in ["txt", "md"] or "text/plain" in mime_type:
        try:
            text = file_bytes.decode("utf-8")
            return True, text, None
        except UnicodeDecodeError:
            try:
                text = file_bytes.decode("latin-1")
                return True, text, None
            except Exception as e:
                return False, "", f"Erro de codificação textual: {str(e)}"

    # 2. Arquivos CSV
    if ext == "csv" or "csv" in mime_type:
        try:
            content_str = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            content_str = file_bytes.decode("latin-1", errors="replace")
        
        try:
            reader = csv.reader(io.StringIO(content_str))
            rows = [" ".join(row) for row in reader]
            extracted = "\n".join(rows)
            return True, extracted, None
        except Exception as e:
            return False, "", f"Falha ao ler estrutura CSV: {str(e)}"

    # 3. Documentos PDF
    if ext == "pdf" or "application/pdf" in mime_type:
        try:
            pdf_stream = io.BytesIO(file_bytes)
            reader = PdfReader(pdf_stream)

            if reader.is_encrypted:
                return False, "", "Arquivo protegido por senha. Leitura indisponível."

            extracted_pages = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    extracted_pages.append(page_text)

            full_text = "\n".join(extracted_pages).strip()
            if not full_text:
                return True, "", "Documento digitalizado sem camada de texto vetorial."

            return True, full_text, None

        except PdfReadError as e:
            return False, "", f"PDF corrompido ou estrutura inválida: {str(e)}"
        except Exception as e:
            return False, "", f"Erro inesperado ao processar PDF: {str(e)}"

    # 4. Imagens (Rasterizadas)
    if ext in ["jpg", "jpeg", "png", "webp"] or mime_type.startswith("image/"):
        return True, "", "Imagem rasterizada recebida. Aguardando pipeline de OCR."

    # 5. Formatos não suportados
    return False, "", "Formato sem extrator disponível na plataforma atual."
