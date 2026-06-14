-- ══════════════════════════════════════════════════════════════════════════════
-- PASO 1: Tabla de configuración
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS config (
  id                        INTEGER PRIMARY KEY,
  ficticia_enabled          BOOLEAN NOT NULL DEFAULT TRUE,
  ficticia_interval_minutes INTEGER NOT NULL DEFAULT 3
);

INSERT INTO config (id, ficticia_enabled, ficticia_interval_minutes)
VALUES (1, TRUE, 3)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "config_select" ON config FOR SELECT TO anon USING (true);
CREATE POLICY "config_update" ON config FOR UPDATE TO anon
  USING (id = 1) WITH CHECK (id = 1);


-- ══════════════════════════════════════════════════════════════════════════════
-- PASO 2: Activar extensiones para el cron
-- ══════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;


-- ══════════════════════════════════════════════════════════════════════════════
-- PASO 3: Cron job que llama a la Edge Function cada minuto
-- (ejecutar DESPUÉS de haber desplegado la Edge Function)
-- ══════════════════════════════════════════════════════════════════════════════

SELECT cron.schedule(
  'generate-ficticia',
  '* * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://jywhmvvazlgdvnetqvdy.supabase.co/functions/v1/generate-ficticia',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);
