-- FIX: Adicionar coluna senha à tabela usuarios
-- Execute este SQL no Supabase SQL Editor

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS senha TEXT NOT NULL DEFAULT '';

-- Verificar estrutura da tabela
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'usuarios';
