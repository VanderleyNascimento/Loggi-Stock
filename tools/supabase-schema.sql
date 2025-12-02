-- =====================================
-- Supabase Database Schema
-- =====================================
-- Execute este SQL no Supabase SQL Editor
-- (Dashboard -> SQL Editor -> New Query)

-- Tabela: estoque
CREATE TABLE IF NOT EXISTS estoque (
    id INTEGER PRIMARY KEY,
    material TEXT NOT NULL UNIQUE,
    estoqueAtual INTEGER DEFAULT 0,
    estoqueCritico INTEGER DEFAULT 0,
    qtdRetiradas INTEGER DEFAULT 0,
    epiAtivo INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela: movimentacoes
CREATE TABLE IF NOT EXISTS movimentacoes (
    id SERIAL PRIMARY KEY,
    dataHora TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    material TEXT NOT NULL,
    tipoOperacao TEXT NOT NULL CHECK (tipoOperacao IN ('Entrada', 'Saída')),
    quantidade INTEGER NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
   email TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    cargo TEXT NOT NULL CHECK (cargo IN ('Administrador', 'Operador')),
    ativo INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela: inventario (opcional - para histórico de inventário)
CREATE TABLE IF NOT EXISTS inventario (
    id SERIAL PRIMARY KEY,
    dataInventario TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    material TEXT NOT NULL,
    estoqueAnterior INTEGER,
    estoqueContado INTEGER,
    diferenca INTEGER,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_estoque_material ON estoque(material);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_material ON movimentacoes(material);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_datahora ON movimentacoes(dataHora DESC);
CREATE INDEX IF NOT EXISTS idx_usuarios_cargo ON usuarios(cargo);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_estoque_updated_at BEFORE UPDATE ON estoque
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (permissões públicas por enquanto)
-- TODO: Implementar autenticação e restringir depois

-- Estoque: Leitura pública, escrita restrita
CREATE POLICY "Enable read access for all users" ON estoque FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON estoque FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON estoque FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON estoque FOR DELETE USING (true);

-- Movimentacoes: Leitura pública, escrita restrita
CREATE POLICY "Enable read access for all users" ON movimentacoes FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON movimentacoes FOR INSERT WITH CHECK (true);

-- Usuarios: Leitura pública
CREATE POLICY "Enable read access for all users" ON usuarios FOR SELECT USING (true);
CREATE POLICY "Enable write for all users" ON usuarios FOR ALL USING (true);

-- Inventario: Todas operações
CREATE POLICY "Enable all access for all users" ON inventario FOR ALL USING (true);

-- Comentários nas tabelas
COMMENT ON TABLE estoque IS 'Tabela principal de controle de estoque';
COMMENT ON TABLE movimentacoes IS 'Histórico de todas as movimentações (entrada/saída)';
COMMENT ON TABLE usuarios IS 'Usuários do sistema';
COMMENT ON TABLE inventario IS 'Histórico de inventários realizados';
