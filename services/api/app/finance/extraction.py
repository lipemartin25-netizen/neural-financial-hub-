import re
from typing import Dict, Any, Optional, Tuple
from datetime import datetime

def extract_receipt_suggestion(text: str, file_name: str = "") -> Dict[str, Any]:
    """
    Analisa o texto extraído de um comprovante ou documento e identifica dados financeiros sugeridos.
    
    IMPORTANTE - GOVERNANÇA:
    Esta função gera APENAS SUGESTÕES REVISÁVEIS.
    NENHUM auto-lançamento é realizado no sistema sem a confirmação e revisão explícita do usuário.
    """
    clean_text = text or ""
    
    # 1. Extração de Valor (R$)
    suggested_amount = 0.0
    amount_found = False
    
    # Padrões comuns em comprovantes brasileiros:
    # "TOTAL: R$ 150,00", "VALOR: 50.00", "R$ 1.250,50", "Valor Pago: 89,90"
    amount_patterns = [
        r'(?:total|valor\s*(?:pago|total|líquido)?)\s*:?\s*r?\$?\s*([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})',
        r'r\$\s*([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})',
        r'r\$\s*([0-9]+(?:\.[0-9]{2}))',
        r'(?:total|valor)\s*:?\s*([0-9]+(?:[\.,][0-9]{2}))',
        r'([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})'
    ]
    
    for pat in amount_patterns:
        match = re.search(pat, clean_text, re.IGNORECASE)
        if match:
            raw_val = match.group(1).replace(".", "").replace(",", ".")
            try:
                val = float(raw_val)
                if val > 0:
                    suggested_amount = val
                    amount_found = True
                    break
            except ValueError:
                continue

    # Fallback caso não ache no texto
    if not amount_found:
        suggested_amount = 100.0  # valor base sugerido para edição
    
    # 2. Extração de Data
    suggested_date = datetime.now().strftime("%Y-%m-%d")
    date_found = False
    
    # dd/mm/yyyy ou yyyy-mm-dd
    date_match = re.search(r'([0-3][0-9])/(0[1-9]|1[0-2])/([12][0-9]{3})', clean_text)
    if date_match:
        day, month, year = date_match.groups()
        suggested_date = f"{year}-{month}-{day}"
        date_found = True
    else:
        iso_match = re.search(r'([12][0-9]{3})-(0[1-9]|1[0-2])-([0-3][0-9])', clean_text)
        if iso_match:
            suggested_date = iso_match.group(0)
            date_found = True

    # 3. Tipo (Receita vs Despesa)
    income_keywords = ["salário", "provento", "recebimento", "pix recebido", "transferência recebida", "depósito recebido", "restituição"]
    is_income = any(k in clean_text.lower() for k in income_keywords)
    suggested_type = "income" if is_income else "expense"

    # 4. Descrição Sugerida
    suggested_description = "Comprovante / Recibo"
    if file_name:
        clean_name = file_name.rsplit(".", 1)[0].replace("_", " ").replace("-", " ")
        suggested_description = f"Despesa: {clean_name}" if not is_income else f"Receita: {clean_name}"
    
    # 5. Categoria Estimada
    text_lower = clean_text.lower()
    suggested_category_name = "Outros"
    if any(w in text_lower for w in ["mercado", "supermercado", "padaria", "alimento", "restaurante", "ifood"]):
        suggested_category_name = "Alimentação"
    elif any(w in text_lower for w in ["farmácia", "drogaria", "médico", "saúde", "exame", "hospital"]):
        suggested_category_name = "Saúde"
    elif any(w in text_lower for w in ["uber", "combustível", "gasolina", "estacionamento", "posto", "pedágio"]):
        suggested_category_name = "Transporte"
    elif any(w in text_lower for w in ["aluguel", "condomínio", "energia", "luz", "água", "iptu", "internet"]):
        suggested_category_name = "Moradia"
    elif is_income:
        suggested_category_name = "Salário"

    # 6. Score de Confiança
    confidence = 0.40
    if amount_found:
        confidence += 0.35
    if date_found:
        confidence += 0.15
    if len(clean_text) > 50:
        confidence += 0.10
    confidence = min(round(confidence, 2), 0.95)

    return {
        "suggested_type": suggested_type,
        "suggested_amount": suggested_amount,
        "suggested_description": suggested_description,
        "suggested_date": suggested_date,
        "suggested_category_name": suggested_category_name,
        "confidence_score": confidence
    }
