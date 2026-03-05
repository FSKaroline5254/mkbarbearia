-- =============================================
-- MKBarbearia - Script de criação do banco de dados
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- Tabela de serviços
CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 45,
  price TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0
);

-- Tabela de horários de funcionamento
CREATE TABLE business_hours (
  day_of_week INTEGER PRIMARY KEY CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_open BOOLEAN DEFAULT false,
  open_time TEXT DEFAULT '10:00',
  close_time TEXT DEFAULT '20:00'
);

-- Tabela de agendamentos
CREATE TABLE appointments (
  id BIGSERIAL PRIMARY KEY,
  services TEXT NOT NULL,
  service_ids INTEGER[] DEFAULT '{}',
  total_duration INTEGER NOT NULL,
  total_price DECIMAL(10,2),
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  status TEXT DEFAULT 'confirmado',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de configurações (senha admin, etc)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- =============================================
-- Dados iniciais
-- =============================================

-- Serviços padrão
INSERT INTO services (id, name, duration, price, sort_order) VALUES
  (1, 'Corte de Cabelo', 45, '35', 1),
  (2, 'Barba', 30, '25', 2),
  (3, 'Sobrancelha', 15, '15', 3),
  (4, 'Combo (Corte + Barba)', 60, '55', 4),
  (5, 'Pintura de Cabelo', 90, '80', 5),
  (6, 'Luzes', 120, '120', 6),
  (7, 'Platinado', 120, '150', 7);

-- Horários padrão (0=Domingo ... 6=Sábado)
INSERT INTO business_hours (day_of_week, is_open, open_time, close_time) VALUES
  (0, false, '10:00', '20:00'),
  (1, false, '10:00', '20:00'),
  (2, true,  '10:00', '20:00'),
  (3, true,  '10:00', '20:00'),
  (4, true,  '10:00', '20:00'),
  (5, true,  '10:00', '20:00'),
  (6, true,  '10:00', '20:00');

-- Senha padrão do admin
INSERT INTO settings (key, value) VALUES ('admin_password', 'MKbarbearia2026.');

-- =============================================
-- Permissões (Row Level Security)
-- =============================================

-- Habilitar RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública dos serviços e horários
CREATE POLICY "Servicos publicos" ON services FOR SELECT USING (true);
CREATE POLICY "Horarios publicos" ON business_hours FOR SELECT USING (true);

-- Permitir inserção e leitura de agendamentos
CREATE POLICY "Criar agendamentos" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Ler agendamentos" ON appointments FOR SELECT USING (true);
CREATE POLICY "Atualizar agendamentos" ON appointments FOR UPDATE USING (true);

-- Permitir leitura e atualização das configurações
CREATE POLICY "Ler config" ON settings FOR SELECT USING (true);
CREATE POLICY "Atualizar config" ON settings FOR UPDATE USING (true);

-- Permitir atualização de serviços e horários (admin)
CREATE POLICY "Atualizar servicos" ON services FOR UPDATE USING (true);
CREATE POLICY "Atualizar horarios" ON business_hours FOR UPDATE USING (true);
