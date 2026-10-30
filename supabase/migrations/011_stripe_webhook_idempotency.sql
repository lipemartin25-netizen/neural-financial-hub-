-- Tabela de idempotência para webhooks do Stripe
-- Previne processamento duplicado de eventos
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index para lookup rápido pelo event_id
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_id
    ON stripe_webhook_events(event_id);

-- Limpeza automática de eventos antigos (>90 dias)
-- Executar via cron/pg_cron se disponível
-- DELETE FROM stripe_webhook_events WHERE processed_at < now() - INTERVAL '90 days';

-- RLS: apenas service_role pode acessar
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
-- Sem policies = apenas service_role (admin) tem acesso
