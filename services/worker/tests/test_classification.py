import pytest
from services.worker.classification.rules_engine import classify_text

def test_classify_comprovante_pagamento():
    sample_text = "Comprovante de pagamento efetuado via PIX com autenticacao eletronica 12345."
    sector, confidence = classify_text(sample_text)
    assert sector == "Comprovantes"
    assert confidence >= 0.60

def test_classify_saude():
    sample_text = "Laudo de exame laboratorial. Paciente apresentando diagnostico sob consulta CRM 9988."
    sector, confidence = classify_text(sample_text)
    assert sector == "Saúde"
    assert confidence >= 0.60

def test_classify_low_confidence_requires_review():
    sample_text = "Arquivo com pouquissimas informacoes genericas sem termos especificos."
    sector, confidence = classify_text(sample_text)
    assert sector == "Revisar"
    assert confidence < 0.60

def test_classify_empty_text():
    sector, confidence = classify_text("")
    assert sector == "Revisar"
    assert confidence == 0.0
