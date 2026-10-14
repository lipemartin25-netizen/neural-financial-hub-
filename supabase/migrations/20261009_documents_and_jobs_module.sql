-- Migração Neurafin Hub: Módulo de Documentos e Processamento Assíncrono
-- Adiciona tabelas para ingestão privada, setores, tags, versões e jobs de extração/OCR

-- 1. Setores configuráveis por usuário
CREATE TABLE IF NOT EXISTS public.sectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#10b981',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- 2. Documentos
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sector_id UUID REFERENCES public.sectors(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    storage_path TEXT NOT NULL, -- Caminho privado no bucket/disco, nunca exposto diretamente
    status TEXT NOT NULL DEFAULT 'received' CHECK (
        status IN (
            'received',
            'pending_processing',
            'processing',
            'ready',
            'review_required',
            'read_unavailable',
            'error',
            'pending_sync'
        )
    ),
    suggested_sector_id UUID REFERENCES public.sectors(id) ON DELETE SET NULL,
    confidence_score NUMERIC(5, 2) DEFAULT 0.00,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Versões de Documentos (Auditoria & Conflitos de Sincronização)
CREATE TABLE IF NOT EXISTS public.document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    version INT NOT NULL,
    storage_path TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Conteúdo Extraído & Metadados Derivados
CREATE TABLE IF NOT EXISTS public.extracted_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL UNIQUE REFERENCES public.documents(id) ON DELETE CASCADE,
    raw_text TEXT,
    structured_data JSONB DEFAULT '{}'::jsonb,
    suggested_financial_data JSONB DEFAULT '{}'::jsonb, -- Sugestões de valor/data para lançamentos SEM criar transações automaticamente
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tags de Documentos
CREATE TABLE IF NOT EXISTS public.document_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id, tag)
);

-- 6. Fila de Processamento Assíncrono (Jobs de Extração e OCR)
CREATE TABLE IF NOT EXISTS public.processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL CHECK (task_type IN ('ocr', 'extraction', 'classification', 'report')),
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    error_message TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Operações de Sincronização Offline (Idempotência)
CREATE TABLE IF NOT EXISTS public.sync_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_operation_id TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('insert', 'update', 'delete')),
    payload JSONB NOT NULL,
    server_synced_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, client_operation_id)
);

-- Habilitar RLS em todas as novas tabelas
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_operations ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para isolamento seguro por usuário
CREATE POLICY "Sectors isolados por usuario" ON public.sectors
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Documents isolados por usuario" ON public.documents
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Document versions isoladas por dono" ON public.document_versions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.documents d
            WHERE d.id = document_versions.document_id AND d.user_id = auth.uid()
        )
    );

CREATE POLICY "Extracted content isolado por dono" ON public.extracted_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.documents d
            WHERE d.id = extracted_content.document_id AND d.user_id = auth.uid()
        )
    );

CREATE POLICY "Document tags isoladas por usuario" ON public.document_tags
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Processing jobs isolados por dono do documento" ON public.processing_jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.documents d
            WHERE d.id = processing_jobs.document_id AND d.user_id = auth.uid()
        )
    );

CREATE POLICY "Sync operations isoladas por usuario" ON public.sync_operations
    FOR ALL USING (auth.uid() = user_id);
