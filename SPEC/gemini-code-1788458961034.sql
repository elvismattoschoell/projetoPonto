-- Habilitar extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Funcionários
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id VARCHAR(50) UNIQUE NOT NULL, -- Matrícula (ex: FUNC-1024)
    name VARCHAR(255) NOT NULL,
    face_descriptor TEXT, -- Array JSON com os dados biométricos da face
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Registros de Ponto (Eventos de Entrada e Saída)
CREATE TABLE time_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    log_type VARCHAR(10) CHECK (log_type IN ('IN', 'OUT')), -- Entrada ou Saída
    log_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    photo_url TEXT, -- URL da foto salva no Supabase Storage (se aplicável)
    status VARCHAR(20) DEFAULT 'VALID', -- VALID, SUSPENDED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Resumo Diário e Faltas (Calculada ou gerada por Job)
CREATE TABLE daily_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_hours NUMERIC(5, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'PRESENT', -- PRESENT, ABSENT, SUSPENDED
    UNIQUE(employee_id, date)
);

-- Tabela de Pontos de Penalidade (Atrasos e Faltas)
CREATE TABLE penalty_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason TEXT NOT NULL, -- Ex: "Atraso superior a 15 minutos"
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas de Segurança Simples (RLS - Row Level Security)
-- Assumindo uso da API Key anon para inserções públicas do totem
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE penalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

-- Permitir leitura de funcionários ativos
CREATE POLICY "Allow public read of active employees" ON employees FOR SELECT USING (is_active = TRUE);
-- Permitir inserção de logs de tempo pelo sistema/totem
CREATE POLICY "Allow public insert of time logs" ON time_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read of time logs" ON time_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert to penalties" ON penalty_points FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert/update to summaries" ON daily_summaries FOR ALL USING (true);