-- ============================================================
-- AbogadoVirtual — Migration 003: Advisor-Specific Tools
-- ============================================================

-- ============================================================
-- SALUD: Consultas de síntomas
-- ============================================================
CREATE TABLE health_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symptoms JSONB NOT NULL DEFAULT '[]',
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'emergency')),
  ai_response TEXT,
  recommended_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_health_checks_user_id ON health_checks(user_id);
CREATE INDEX idx_health_checks_tenant_id ON health_checks(tenant_id);

ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY health_checks_isolation ON health_checks USING (tenant_id = auth.tenant_id());

-- ============================================================
-- SALUD: Diario de bienestar diario
-- ============================================================
CREATE TABLE wellness_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood INT CHECK (mood BETWEEN 1 AND 5),
  energy INT CHECK (energy BETWEEN 1 AND 5),
  sleep_hours NUMERIC(4,1),
  water_glasses INT,
  exercise_minutes INT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, log_date)
);
CREATE INDEX idx_wellness_logs_user_id ON wellness_logs(user_id);
CREATE INDEX idx_wellness_logs_date ON wellness_logs(log_date);

ALTER TABLE wellness_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY wellness_logs_isolation ON wellness_logs
  USING (user_id = (SELECT id FROM users WHERE id = auth.uid() LIMIT 1));

-- ============================================================
-- FINANZAS: Registro de ingresos/gastos
-- ============================================================
CREATE TYPE budget_entry_type AS ENUM ('income', 'expense', 'saving');

CREATE TABLE budget_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type budget_entry_type NOT NULL DEFAULT 'expense',
  category VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'ARS',
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_budget_entries_user_id ON budget_entries(user_id);
CREATE INDEX idx_budget_entries_tenant_id ON budget_entries(tenant_id);
CREATE INDEX idx_budget_entries_date ON budget_entries(entry_date);

ALTER TABLE budget_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY budget_entries_isolation ON budget_entries USING (tenant_id = auth.tenant_id());

-- ============================================================
-- FINANZAS: Metas financieras
-- ============================================================
CREATE TYPE goal_status AS ENUM ('active', 'completed', 'paused');

CREATE TABLE financial_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  target_amount NUMERIC(12,2) NOT NULL,
  current_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'ARS',
  deadline DATE,
  status goal_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_financial_goals_user_id ON financial_goals(user_id);

ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY financial_goals_isolation ON financial_goals
  USING (user_id = (SELECT id FROM users WHERE id = auth.uid() LIMIT 1));

-- ============================================================
-- BIENESTAR: Diario emocional
-- ============================================================
CREATE TABLE mood_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood INT NOT NULL CHECK (mood BETWEEN 1 AND 5),
  emotions JSONB NOT NULL DEFAULT '[]',
  triggers TEXT,
  journal_text TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, entry_date)
);
CREATE INDEX idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX idx_mood_entries_date ON mood_entries(entry_date);

ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY mood_entries_isolation ON mood_entries
  USING (user_id = (SELECT id FROM users WHERE id = auth.uid() LIMIT 1));

-- ============================================================
-- BIENESTAR: Ejercicios guiados
-- ============================================================
CREATE TABLE guided_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advisor_id VARCHAR(50) REFERENCES advisors(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 5,
  description TEXT NOT NULL,
  instructions JSONB NOT NULL DEFAULT '[]',
  difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  icon VARCHAR(10),
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE guided_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY guided_exercises_read ON guided_exercises FOR SELECT USING (TRUE);

-- ============================================================
-- HOGAR: Checklists de mantenimiento
-- ============================================================
CREATE TYPE checklist_frequency AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');

CREATE TABLE home_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  category VARCHAR(100) NOT NULL,
  frequency checklist_frequency NOT NULL DEFAULT 'monthly',
  items JSONB NOT NULL DEFAULT '[]',
  last_completed DATE,
  next_due DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_home_checklists_user_id ON home_checklists(user_id);

ALTER TABLE home_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY home_checklists_isolation ON home_checklists
  USING (user_id = (SELECT id FROM users WHERE id = auth.uid() LIMIT 1));

-- ============================================================
-- SEEDS: Ejercicios guiados de bienestar
-- ============================================================
INSERT INTO guided_exercises (advisor_id, title, category, duration_minutes, description, instructions, difficulty, icon, sort_order) VALUES

('psychology', 'Respiración 4-7-8', 'respiracion', 5,
'Técnica de respiración que activa el sistema nervioso parasimpático, ideal para reducir ansiedad aguda y prepararse para dormir.',
'[
  {"step": 1, "text": "Adoptá una postura cómoda, espalda recta. Podés estar sentado o acostado."},
  {"step": 2, "text": "Exhalá completamente por la boca, vaciando los pulmones."},
  {"step": 3, "text": "Cerrá la boca e inhalá suavemente por la nariz contando mentalmente hasta 4."},
  {"step": 4, "text": "Retení el aire contando hasta 7. No fuerces — si necesitás, hacé la pausa más corta."},
  {"step": 5, "text": "Exhalá completamente por la boca durante 8 segundos, haciendo un suave sonido."},
  {"step": 6, "text": "Este ciclo completo es una respiración. Repetí 3 a 4 veces."},
  {"step": 7, "text": "Con la práctica diaria, este ejercicio se vuelve más efectivo."}
]',
'beginner', '🌬️', 1),

('psychology', 'Body Scan', 'relajacion', 15,
'Técnica de atención plena que recorre el cuerpo sistemáticamente para liberar tensión y conectar con las sensaciones físicas.',
'[
  {"step": 1, "text": "Acostáte boca arriba en un lugar cómodo y silencioso."},
  {"step": 2, "text": "Cerrá los ojos y tomá 3 respiraciones profundas para centrarte."},
  {"step": 3, "text": "Llevá tu atención a los dedos de los pies. Notá cualquier sensación: temperatura, tensión, hormigueo."},
  {"step": 4, "text": "Subí lentamente por las plantas de los pies, tobillos, pantorrillas."},
  {"step": 5, "text": "Continuá hacia las rodillas, muslos, cadera. Respirá en cada zona."},
  {"step": 6, "text": "Pasá por el abdomen, pecho, espalda baja y alta."},
  {"step": 7, "text": "Continuá por los hombros, brazos, manos y dedos."},
  {"step": 8, "text": "Finalizá con cuello, mandíbula, cara y cabeza."},
  {"step": 9, "text": "Tomá un momento con atención en todo el cuerpo antes de abrir los ojos."}
]',
'beginner', '🧘', 2),

('psychology', 'Journaling de gratitud', 'journaling', 10,
'Práctica de escritura reflexiva que redirige la atención hacia aspectos positivos y fortalece la resiliencia emocional.',
'[
  {"step": 1, "text": "Tomá un cuaderno o usá la sección de notas de la app. Elegí un momento tranquilo."},
  {"step": 2, "text": "Escribí 3 cosas por las que estás agradecido/a hoy. Pueden ser grandes o pequeñas."},
  {"step": 3, "text": "Para cada una, escribí brevemente por qué te genera gratitud."},
  {"step": 4, "text": "Escribí algo bueno que hiciste hoy, aunque sea pequeño."},
  {"step": 5, "text": "Escribí algo que querés mejorar mañana, con compasión, sin autocrítica."},
  {"step": 6, "text": "Releé lo que escribiste antes de cerrar."}
]',
'beginner', '📓', 3),

('psychology', 'Grounding 5-4-3-2-1', 'grounding', 5,
'Técnica de anclaje sensorial para salir de una crisis de ansiedad o disociación, conectando con el presente a través de los sentidos.',
'[
  {"step": 1, "text": "Reconocé que estás teniendo un momento difícil. Eso requiere valentía."},
  {"step": 2, "text": "VISTA: Nombrá 5 cosas que podés ver ahora mismo a tu alrededor."},
  {"step": 3, "text": "TACTO: Identificá 4 cosas que podés tocar. Tocálas y describí cómo se sienten."},
  {"step": 4, "text": "OÍDO: Escuchá y nombrá 3 sonidos que podés escuchar en este momento."},
  {"step": 5, "text": "OLFATO: Identificá 2 cosas que podés oler (perfume, comida, aire fresco)."},
  {"step": 6, "text": "GUSTO: Nombrá 1 cosa que podés saborear o que te gustaría saborear."},
  {"step": 7, "text": "Tomá una respiración profunda. Observá si te sentís más presente."}
]',
'beginner', '🌱', 4),

('psychology', 'Reestructuración cognitiva ABC', 'cognitivo', 15,
'Técnica de Terapia Cognitivo-Conductual para identificar y cuestionar pensamientos automáticos negativos.',
'[
  {"step": 1, "text": "A - ACONTECIMIENTO: Describí la situación que desencadenó el malestar. Solo los hechos, sin interpretación."},
  {"step": 2, "text": "B - BELIEFS (Creencias): ¿Qué pensaste sobre esa situación? Escribí todos los pensamientos que surgieron."},
  {"step": 3, "text": "C - CONSECUENCIAS: ¿Qué emoción sentiste? ¿Qué hiciste como resultado de ese pensamiento?"},
  {"step": 4, "text": "CUESTIONAR: Para cada pensamiento preguntate: ¿Tengo evidencia real de que esto es cierto?"},
  {"step": 5, "text": "ALTERNATIVAS: ¿Hay otra forma de ver la misma situación que sea más balanceada?"},
  {"step": 6, "text": "NUEVO PENSAMIENTO: Escribí una versión más realista y equilibrada del pensamiento original."},
  {"step": 7, "text": "EMOCIÓN NUEVA: ¿Cómo te sentís con el pensamiento alternativo?"}
]',
'intermediate', '🧠', 5)

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEEDS: Checklists de mantenimiento del hogar
-- ============================================================
-- Nota: home_checklists requiere user_id, se seedean como templates
-- Los checklists se crean por usuario desde la app
-- Guardamos templates en la tabla guided_exercises del asesor hogar

INSERT INTO guided_exercises (advisor_id, title, category, duration_minutes, description, instructions, difficulty, icon, sort_order) VALUES

('home', 'Checklist mantenimiento mensual', 'mantenimiento', 30,
'Revisión mensual del hogar para prevenir problemas mayores y mantener todo en buen estado.',
'[
  {"step": 1, "text": "Revisar filtros de aire acondicionado/ventilación y limpiar si corresponde."},
  {"step": 2, "text": "Inspeccionar bajo mesada de cocina y baño — buscar humedad, pérdidas o manchas."},
  {"step": 3, "text": "Revisar grifería: canillas, ducheras, inodoros. Verificar que no gotee nada."},
  {"step": 4, "text": "Limpiar rejillas de desagüe del baño y cocina con destaponador preventivo."},
  {"step": 5, "text": "Verificar tomacorrientes e interruptores — ninguno debe estar flojo, caliente o con marcas."},
  {"step": 6, "text": "Revisar estado de selladores en ventanas y puertas (evita filtraciones)."},
  {"step": 7, "text": "Controlar estado de la pintura en zonas húmedas (baño, cocina) buscando manchas."},
  {"step": 8, "text": "Revisar puertas y ventanas: bisagras, cerraduras y burletes en buen estado."}
]',
'beginner', '🏠', 10),

('home', 'Preparación para invierno', 'estacional', 60,
'Checklist para preparar el hogar antes de la temporada de frío y evitar problemas con el clima.',
'[
  {"step": 1, "text": "Revisar calefacción (caldera, estufas, radiadores). Si usás gas, llamá a un gasista matriculado para el service anual."},
  {"step": 2, "text": "Verificar que todas las ventanas y puertas cierren bien y no haya corrientes de aire."},
  {"step": 3, "text": "Inspeccionar el techo si es accesible — buscar tejas rotas, canaletas obstruidas con hojas."},
  {"step": 4, "text": "Limpiar canaletas de desagüe pluvial para evitar desborde con lluvias."},
  {"step": 5, "text": "Revisar impermeabilización de terrazas y balcones (manchas o deterioro del membrana)."},
  {"step": 6, "text": "Verificar desagüe de patio o garaje — que el agua escurra correctamente."},
  {"step": 7, "text": "Guardar o cubrir muebles de jardín y plantas sensibles al frío."},
  {"step": 8, "text": "Revisar extintores — verificar fecha de vencimiento y presión."}
]',
'beginner', '❄️', 11)

ON CONFLICT (id) DO NOTHING;
