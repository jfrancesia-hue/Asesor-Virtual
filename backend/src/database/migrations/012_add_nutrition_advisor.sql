-- ============================================================
-- Migration 012: Nutrition advisor
-- ============================================================

INSERT INTO advisors (
  id,
  name,
  category,
  title,
  description,
  icon,
  color,
  system_prompt,
  welcome_message,
  quick_actions,
  capabilities,
  requires_plan,
  sort_order,
  is_active
) VALUES (
  'nutrition',
  'Ana Sofía Nutrición',
  'Nutricion',
  'Licenciada en Nutricion Integral',
  'Alimentacion consciente, enfoque no peso centrista, habitos reales y educacion alimentaria.',
  '🥗',
  '#2F9E44',
  'Sos el Asesor Nutricional IA de MiAsesor. Tu nombre es Nuta.

PERSONALIDAD: Clara, calida, practica y sin juicio. Ayudas a ordenar habitos alimentarios con lenguaje simple, enfoque realista y respeto por el contexto economico, cultural y familiar de cada persona.

PERFIL PROFESIONAL HUMANO:
- Referente profesional: Lic. Ana Sofía Rosalía Valdiviezo.
- Licenciada en Nutricion, recibida en la Universidad Nacional de Salta.
- Matricula provincial: Salta 851; Jujuy 240.
- Diplomada en Medicina del Estilo de Vida.
- Enfoque no peso centrista y sin dietas, alimentacion consciente, intuitiva y real.
- Acompanamiento personalizado y empatico en todas las etapas.

CAPACIDADES:
- Orientacion general sobre alimentacion saludable y planificacion de comidas
- Ideas de desayunos, almuerzos, cenas y colaciones segun objetivos generales
- Educacion nutricional: porciones, grupos de alimentos, hidratacion, lectura de etiquetas
- Organizacion de compras y meal prep con presupuesto
- Habitos para energia, saciedad, digestion y constancia
- Preparacion de preguntas para consulta con la Lic. Ana Sofía Rosalía Valdiviezo

REGLAS DE SEGURIDAD CRITICAS:
1. NUNCA diagnosticar enfermedades, trastornos alimentarios ni deficiencias nutricionales.
2. NUNCA indicar dietas extremas, ayunos prolongados, restricciones severas ni metas de descenso rapido de peso.
3. NUNCA reemplazar indicaciones medicas o nutricionales existentes.
4. Si el usuario menciona embarazo, lactancia, diabetes, enfermedad renal, cardiaca, hepatica, TCA, bajo peso, menores de edad, medicacion o sintomas persistentes, derivar a profesional de salud/nutricionista antes de personalizar.
5. No calcular planes clinicos estrictos ni prescribir suplementos. Podes explicar informacion general y sugerir consulta profesional.
6. Evitar moralizar alimentos. Usar un enfoque flexible: frecuencia, porciones, contexto y sostenibilidad.

FORMATO DE RESPUESTA:
- Primero preguntar objetivo, edad aproximada, pais, rutina, restricciones, presupuesto y condiciones de salud relevantes si faltan datos.
- Dar pasos accionables y simples, no planes rigidos.
- Para menus, ofrecer ejemplos flexibles y alternativas.
- Cerrar indicando cuando conviene consultar a una nutricionista matriculada.',
  'Hola, soy **Nuta**, el Asesor Nutricional IA de la **Lic. Ana Sofía Rosalía Valdiviezo**. Puedo ayudarte a ordenar comidas, mejorar habitos y preparar una consulta nutricional.

Importante: mi orientacion es informativa y no reemplaza a una nutricionista ni a tu medico, especialmente si hay enfermedades, embarazo, medicacion o antecedentes de trastornos alimentarios.

Contame tu objetivo y como es un dia habitual de comidas.',
  '[
    {"label": "Ordenar mis comidas", "prompt": "Quiero ordenar mis comidas de la semana. Podes guiarme paso a paso?"},
    {"label": "Menu simple y economico", "prompt": "Necesito ideas de comidas saludables, simples y economicas para la semana."},
    {"label": "Mejorar energia", "prompt": "Quiero mejorar mi energia durante el dia con mejores habitos de alimentacion."},
    {"label": "Lista de compras", "prompt": "Ayudame a armar una lista de compras saludable y realista para mi presupuesto."},
    {"label": "Preparar consulta", "prompt": "Quiero preparar una consulta con la Lic. Ana Sofía Rosalía Valdiviezo. Que datos deberia llevar?"}
  ]',
  '["Nutricion integral", "Alimentacion consciente", "Habitos reales", "Educacion alimentaria", "Derivacion profesional"]',
  'start',
  3,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  system_prompt = EXCLUDED.system_prompt,
  welcome_message = EXCLUDED.welcome_message,
  quick_actions = EXCLUDED.quick_actions,
  capabilities = EXCLUDED.capabilities,
  requires_plan = EXCLUDED.requires_plan,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

UPDATE advisors
SET sort_order = CASE id
  WHEN 'legal' THEN 1
  WHEN 'health' THEN 2
  WHEN 'nutrition' THEN 3
  WHEN 'finance' THEN 4
  WHEN 'psychology' THEN 5
  WHEN 'home' THEN 6
  ELSE sort_order
END
WHERE id IN ('legal', 'health', 'nutrition', 'finance', 'psychology', 'home');

UPDATE advisors
SET
  title = 'Orientacion en Salud Familiar',
  description = 'Sintomas, prevencion, controles y bienestar general. Orientacion profesional de salud.',
  system_prompt = replace(
    replace(
      replace(
        replace(
          replace(
            replace(
              system_prompt,
              '- Informacion sobre nutricion y alimentacion saludable' || chr(10),
              ''
            ),
            '- Información sobre nutrición y alimentación saludable' || chr(10),
            ''
          ),
          '- Para nutrición, usá listas organizadas por categorías',
          '- Para habitos de salud, usa listas practicas y deriva nutricion especifica al asesor nutricional'
        ),
        '- Para nutricion, usa listas organizadas por categorias',
        '- Para habitos de salud, usa listas practicas y deriva nutricion especifica al asesor nutricional'
      ),
      'sintomas, nutricion, prevencion y bienestar general',
      'sintomas, prevencion, controles y bienestar general'
    ),
    'sintomas, nutrición, prevención y bienestar general',
    'sintomas, prevencion, controles y bienestar general'
  ),
  welcome_message = replace(
    replace(
      welcome_message,
      'sintomas, nutricion, prevencion y bienestar general',
      'sintomas, prevencion, controles y bienestar general'
    ),
    'síntomas, nutrición, prevención y bienestar general',
    'sintomas, prevencion, controles y bienestar general'
  ),
  quick_actions = '[
    {"label": "Tengo dolor de cabeza", "prompt": "Tengo dolor de cabeza frecuente. Que podria estar causandolo?"},
    {"label": "Chequeo preventivo", "prompt": "Quiero preparar un chequeo preventivo segun mi edad y antecedentes."},
    {"label": "Sintomas de estres", "prompt": "Creo que tengo mucho estres. Que sintomas son normales y cuando debo preocuparme?"},
    {"label": "Ejercicio para principiantes", "prompt": "Quiero empezar a hacer ejercicio. Por donde empiezo siendo principiante?"},
    {"label": "Cuando ir al medico", "prompt": "Como se cuando un sintoma es grave y necesito ir al medico urgente?"}
  ]',
  capabilities = '["Orientacion de sintomas", "Prevencion", "Controles de salud", "Habitos saludables", "Bienestar general"]',
  updated_at = NOW()
WHERE id = 'health';
