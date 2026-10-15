// src/lib/boletos/identifier.ts
// IMPLEMENTAR:

/*
Identificar automaticamente o tipo de boleto pelo cedente/valor:

REGRAS DE IDENTIFICAÇÃO:
- CPFL, Enel, Cemig, Light → type: 'utility' (energia)
- Sabesp, Copasa, Sanepar → type: 'utility' (água)
- Comgás, Naturgy → type: 'utility' (gás)
- Claro, Vivo, Tim, Oi → type: 'utility' (telecom)
- Prefeitura, IPTU → type: 'tax'
- DETRAN, IPVA → type: 'tax'
- Receita Federal, DAS → type: 'tax'
- Seguradora, Porto, Azul → type: 'insurance'
- Condomínio, Administradora → type: 'condominium'
- Escola, Universidade, FIES → type: 'education'
- Unimed, Amil, SulAmérica → type: 'health'
- Aluguel, Imobiliária → type: 'rent'

Mapear para categoria automaticamente.
*/
