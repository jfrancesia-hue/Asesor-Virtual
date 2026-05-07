-- ============================================================
-- Rebranding: TuAsesor → MiAsesor
-- ============================================================
-- COMO USAR: Supabase Dashboard -> SQL Editor -> New query ->
-- pegar TODO -> Run.
-- Es seguro correrlo varias veces (idempotente).
-- ============================================================
-- Actualiza los system prompts y welcome messages de los 5 asesores
-- (legal, health, finance, psychology, home) que tenían el nombre
-- "TuAsesor" embebido. La IA usará el nombre nuevo cuando responda.

UPDATE public.advisors
SET system_prompt = REPLACE(system_prompt, 'TuAsesor', 'MiAsesor'),
    welcome_message = REPLACE(welcome_message, 'TuAsesor', 'MiAsesor');
