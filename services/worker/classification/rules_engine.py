import re
from typing import Dict, Any, Tuple

# Setores padrão do sistema
DEFAULT_SECTORS = [
    "Financeiro",
    "Pessoal",
    "Trabalho",
    "Contratos",
    "Saúde",
    "Educação",
    "Comprovantes",
    "Revisar"
]

# Regras e palavras-chave para classificação automática
KEYWORD_RULES = {
    "Financeiro": ["banco", "extrato", "fatura", "cartao", "pix", "transferencia", "saldo", "tarifa"],
    "Comprovantes": ["comprovante", "pagamento efetuado", "autenticacao", "terminal", "cupom fiscal", "danfe", "nfe"],
    "Contratos": ["contrato", "clausula", "locacao", "prestacao de servicos", "rescisao", "termo", "assinatura"],
    "Saúde": ["exame", "receita medica", "consulta", "laboratorio", "crm", "paciente", "diagnostico", "laudo"],
    "Educação": ["faculdade", "escola", "matricula", "curso", "certificado", "diploma", "disciplina", "boletim"],
    "Trabalho": ["holerite", "recibo de salario", "admissao", "demissao", "inss", "fgts", "carteira de trabalho"],
    "Pessoal": ["rg", "cpf", "cnh", "passaporte", "certidao", "titulo de eleitor"]
}

def classify_text(text: str) -> Tuple[str, float]:
    """
    Classifica um texto extraído em um setor padrão e retorna a pontuação de confiança (0.0 a 1.0).
    Se a confiança for inferior a 0.60, sugere 'Revisar'.
    """
    if not text or len(text.strip()) < 10:
        return ("Revisar", 0.0)

    clean_text = text.lower()
    scores: Dict[str, int] = {sector: 0 for sector in KEYWORD_RULES}

    for sector, keywords in KEYWORD_RULES.items():
        for kw in keywords:
            matches = len(re.findall(r'\b' + re.escape(kw) + r'\b', clean_text))
            scores[sector] += matches

    best_sector, max_matches = max(scores.items(), key=lambda item: item[1])

    if max_matches == 0:
        return ("Revisar", 0.20)

    # Cálculo simplificado de confiança proporcional à frequência de palavras-chave
    confidence = min(1.0, 0.40 + (max_matches * 0.15))

    if confidence < 0.60:
        return ("Revisar", round(confidence, 2))

    return (best_sector, round(confidence, 2))
