-- Extensão necessária para gerar UUIDs automaticamente no Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TABELA: admin_users
-- ==========================================
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'commercial' CHECK (role IN ('commercial', 'superadmin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    last_login TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- TABELA: leads
-- ==========================================
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    
    -- Dados de Contato e Básicos
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    
    -- Bloco 1 (Dados Físicos)
    age TEXT NOT NULL,
    weight TEXT,
    height TEXT,
    sex TEXT NOT NULL,
    condition TEXT,
    
    -- Pilares e Score (Motor de Regras)
    score_total INTEGER CHECK (score_total >= 0 AND score_total <= 50),
    score_metabolic INTEGER CHECK (score_metabolic >= 0 AND score_metabolic <= 10),
    score_hormonal INTEGER CHECK (score_hormonal >= 0 AND score_hormonal <= 10),
    score_sleep INTEGER CHECK (score_sleep >= 0 AND score_sleep <= 10),
    score_stress INTEGER CHECK (score_stress >= 0 AND score_stress <= 10),
    score_lifestyle INTEGER CHECK (score_lifestyle >= 0 AND score_lifestyle <= 10),
    score_business INTEGER CHECK (score_business >= 0 AND score_business <= 10),
    risk_level TEXT CHECK (risk_level IN ('high', 'medium', 'low')),
    
    -- Perfil Empresarial e Intenção
    primary_goal TEXT,
    followup_interest TEXT,
    business_dependency TEXT,
    business_growth TEXT,
    
    -- Resultados de Inteligência Artificial (Claude)
    ai_headline TEXT,
    ai_diagnostico TEXT,
    ai_prognostico TEXT,
    ai_business_impact TEXT,
    ai_plan JSONB,
    
    -- Assets e Status de Automações
    pdf_url TEXT,
    email_sent BOOLEAN DEFAULT false,
    whatsapp_sent BOOLEAN DEFAULT false,
    
    -- Controle de CRM (Admin)
    admin_notes TEXT,
    admin_contacted BOOLEAN DEFAULT false,
    admin_status TEXT DEFAULT 'new' CHECK (admin_status IN ('new', 'contacted', 'scheduled', 'converted', 'not_interested'))
);

-- ==========================================
-- CONFIGURAÇÕES DE ROW LEVEL SECURITY (RLS)
-- ==========================================
-- Habilitar RLS nas tabelas
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Políticas para 'leads'
-- 1. Qualquer pessoa (ou API pública anônima) pode CRIAR um lead (insert)
CREATE POLICY "Permitir inserção anônima de leads" 
ON leads FOR INSERT 
TO public 
WITH CHECK (true);

-- 2. Apenas usuários autenticados (Admin/Comercial) podem LER e ATUALIZAR leads
CREATE POLICY "Admins podem visualizar leads" 
ON leads FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Admins podem editar leads" 
ON leads FOR UPDATE 
TO authenticated 
USING (true);

-- Políticas para 'admin_users'
-- 1. Apenas admins autenticados podem ver os usuários.
CREATE POLICY "Acesso de leitura restrito aos admins" 
ON admin_users FOR SELECT 
TO authenticated 
USING (true);
