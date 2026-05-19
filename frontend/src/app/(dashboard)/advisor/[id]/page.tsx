'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowRight,
  Apple,
  BadgeCheck,
  Brain,
  CalendarCheck,
  ClipboardList,
  HeartHandshake,
  Home,
  Landmark,
  MessageCircle,
  Quote,
  Scale,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, Button, Spinner } from '@/components/ui';

type ToolAction =
  | { type: 'chat' }
  | { type: 'chat_prompt'; prompt: string }
  | { type: 'analyze' }
  | { type: 'contracts' }
  | { type: 'create' }
  | { type: 'crisis' }
  | { type: 'exercises' }
  | { type: 'wellness' }
  | { type: 'mood' };

interface AdvisorTool {
  label: string;
  icon: string;
  description: string;
  action: ToolAction;
}

interface ProfessionalProfile {
  area: string;
  person: string;
  credential: string;
  specialty: string;
  summary: string;
  approach: string;
  trust: string;
  image?: {
    src: string;
    alt: string;
    width: number;
    height: number;
    cropBottom?: boolean;
  };
  icon: LucideIcon;
  color: string;
  chips: string[];
  services: string[];
  credentialsList: { title: string; description: string }[];
  areas: { title: string; description: string }[];
  quote: string;
  steps: { title: string; description: string }[];
  guidePrompt: string;
  humanPrompt: string;
}

const PROFESSIONAL_PROFILES: Record<string, ProfessionalProfile> = {
  psychology: {
    area: 'Bienestar',
    person: 'Lic. Luciana Francesia',
    credential: 'Psicologa',
    specialty: 'Bienestar emocional, ansiedad y conciencia corporal',
    summary:
      'Acompana procesos de autoconocimiento integrando salud mental, respiracion consciente y trabajo corporal desde una mirada calida, terapeutica e integral.',
    approach:
      'Su enfoque articula cuerpo, emociones y mente para trabajar regulacion emocional, autoestima, ansiedad, mindfulness y Pole Terapeutico.',
    trust: 'Profesional verificada | Psicologa matriculada | Atencion presencial y online',
    image: {
      src: '/advisors/luciana-francesia.jpeg',
      alt: 'Perfil profesional de la Lic. Luciana Francesia',
      width: 1536,
      height: 1024,
    },
    icon: Brain,
    color: '#8B5FBF',
    chips: ['Ansiedad y estres', 'Gestion emocional', 'Mindfulness', 'Conciencia corporal', 'Pole Terapeutico'],
    services: [
      'Psicoterapia y acompanamiento emocional',
      'Manejo de ansiedad y estres',
      'Autoestima y autoconocimiento',
      'Respiracion consciente y relajacion',
      'Psicologia aplicada al deporte',
      'Bienestar fisico y mental',
    ],
    credentialsList: [
      { title: 'Formacion', description: 'Licenciada en Psicologia' },
      { title: 'Enfoque', description: 'Bienestar emocional y conciencia corporal' },
      { title: 'Modalidad', description: 'Acompanamiento presencial y online' },
      { title: 'Integracion corporal', description: 'Respiracion, mindfulness y Pole Terapeutico' },
    ],
    areas: [
      { title: 'Ansiedad y estres', description: 'Herramientas de regulacion y respiracion consciente.' },
      { title: 'Autoestima', description: 'Procesos de autoconocimiento y confianza personal.' },
      { title: 'Cuerpo y emociones', description: 'Trabajo corporal integrado a la salud mental.' },
      { title: 'Mindfulness', description: 'Practicas breves para volver al presente.' },
      { title: 'Vinculos', description: 'Ordenar conflictos, limites y conversaciones dificiles.' },
      { title: 'Derivacion', description: 'Preparar una consulta humana cuando hace falta.' },
    ],
    quote: 'El bienestar empieza cuando podes escucharte sin juicio y encontrar recursos posibles para hoy.',
    steps: [
      { title: 'Entender lo que te pasa', description: 'La guia ordena emociones, contexto, intensidad y recursos actuales.' },
      { title: 'Practicar herramientas', description: 'El agente propone respiracion, registro emocional y pautas de regulacion.' },
      { title: 'Derivar con criterio', description: 'Si hace falta, prepara el resumen para una consulta con Luciana.' },
    ],
    guidePrompt:
      'Quiero iniciar una guia personalizada de bienestar emocional. Haceme preguntas de a una para entender que estoy sintiendo, desde cuando, intensidad, contexto, recursos actuales y si necesito derivacion profesional.',
    humanPrompt:
      'Quiero solicitar una consulta humana con la Lic. Luciana Francesia. Ayudame a resumir lo que me pasa y los datos necesarios para coordinar una atencion.',
  },
  health: {
    area: 'Salud',
    person: 'Dra. Maria Belen Acosta',
    credential: 'Medica generalista',
    specialty: 'Especialista en Medicina Familiar',
    summary:
      'Acompana a personas y familias en el cuidado integral de su salud, con foco preventivo, escucha activa y orientacion clara.',
    approach:
      'Trabaja desde una mirada centrada en la persona, su entorno familiar, sus habitos y el seguimiento continuo.',
    trust: 'Medica con especializacion en Medicina Familiar | Atencion presencial y online',
    image: {
      src: '/advisors/maria-belen-acosta.jpeg',
      alt: 'Perfil profesional de la Dra. Maria Belen Acosta',
      width: 1024,
      height: 1536,
    },
    icon: Stethoscope,
    color: '#006D77',
    chips: ['Medicina familiar', 'Prevencion', 'Habitos saludables', 'Salud integral', 'Seguimiento'],
    services: [
      'Consultas generales',
      'Prevencion y control de enfermedades',
      'Salud de la mujer',
      'Salud del adulto y adulto mayor',
      'Orientacion familiar',
      'Habitos saludables y calidad de vida',
    ],
    credentialsList: [
      { title: 'Formacion', description: 'Medica generalista' },
      { title: 'Especialidad', description: 'Medicina Familiar' },
      { title: 'Mirada clinica', description: 'Atencion integral, preventiva y centrada en la persona' },
      { title: 'Modalidad', description: 'Orientacion inicial y preparacion de consulta' },
    ],
    areas: [
      { title: 'Sintomas frecuentes', description: 'Ordenar motivo de consulta y senales de alarma.' },
      { title: 'Prevencion', description: 'Controles, vacunas y habitos por etapa de vida.' },
      { title: 'Salud familiar', description: 'Contexto, antecedentes y seguimiento integral.' },
      { title: 'Mujer y ciclos', description: 'Preparar preguntas y datos para consulta medica.' },
      { title: 'Adultos mayores', description: 'Controles, medicacion y calidad de vida.' },
      { title: 'Derivacion segura', description: 'Identificar cuando conviene escalar a atencion profesional.' },
    ],
    quote: 'La salud se cuida mejor cuando la informacion es clara, humana y ubicada en tu contexto real.',
    steps: [
      { title: 'Ordenar la consulta', description: 'La guia pregunta sintomas, antecedentes, medicacion y senales de alarma.' },
      { title: 'Recibir orientacion', description: 'El agente ayuda con informacion clara y preparacion para la consulta.' },
      { title: 'Escalar a profesional', description: 'Cuando corresponde, resume el caso para la Dra. Maria Belen.' },
    ],
    guidePrompt:
      'Quiero iniciar una guia personalizada de salud familiar. Haceme preguntas de a una para orientar mi consulta, detectar senales de alarma y preparar una consulta medica si hace falta.',
    humanPrompt:
      'Quiero solicitar una consulta humana con la Dra. Maria Belen Acosta. Ayudame a resumir mi motivo de consulta, sintomas, antecedentes y datos importantes.',
  },
  nutrition: {
    area: 'Nutricion',
    person: 'Ana Sofía Rosalía Valdiviezo',
    credential: 'Licenciada en Nutricion',
    specialty: 'Especialista en Nutricion Integral',
    summary:
      'Te acompana a mejorar tu relacion con la alimentacion desde un enfoque integral, real y consciente, adaptado a tu estilo de vida y tus necesidades.',
    approach:
      'Trabaja con una mirada no peso centrista y sin dietas, integrando alimentacion consciente, educacion alimentaria, ciencia, empatia y acompanamiento en cada etapa.',
    trust: 'Matricula provincial: Salta 851; Jujuy 240 | Universidad Nacional de Salta | Diplomatura en Medicina del Estilo de Vida',
    image: {
      src: '/advisors/ana-sofia-rosalia-valdiviezo-portrait.jpeg',
      alt: 'Perfil profesional de Ana Sofía Rosalía Valdiviezo',
      width: 485,
      height: 555,
    },
    icon: Apple,
    color: '#2F9E44',
    chips: ['No peso centrista', 'Alimentacion consciente', 'Habitos reales', 'Ciencia y empatia', 'Atencion personalizada'],
    services: [
      'Alimentacion consciente, intuitiva y real',
      'Alimentacion para distintas edades y momentos biologicos',
      'Patologias: diabetes, hipertension, hipotiroidismo y enfermedad renal',
      'Nutricion deportiva',
      'Alimentacion basada en plantas, vegetariana y vegana',
      'Modelo no peso centrista, sin dieta',
    ],
    credentialsList: [
      { title: 'Formacion', description: 'Licenciada en Nutricion, Universidad Nacional de Salta' },
      { title: 'Matricula provincial', description: 'Salta 851; Jujuy 240' },
      { title: 'Diplomatura', description: 'Medicina del Estilo de Vida' },
      { title: 'Enfoque', description: 'No peso centrista, sin dietas y con educacion alimentaria' },
    ],
    areas: [
      { title: 'Mujer y ciclos hormonales', description: 'Acompanamiento nutricional segun etapa y contexto.' },
      { title: 'Salud digestiva y metabolica', description: 'Ordenar habitos, sintomas y datos para consulta.' },
      { title: 'Embarazo y lactancia', description: 'Orientacion inicial y preparacion de preguntas.' },
      { title: 'Enfermedades cronicas', description: 'Diabetes, hipertension, hipotiroidismo y enfermedad renal.' },
      { title: 'Deporte y rendimiento', description: 'Habitos de energia, recuperacion y constancia.' },
      { title: 'Alimentacion vegetal', description: 'Opciones vegetarianas, veganas y basadas en plantas.' },
    ],
    quote: 'La alimentacion no se trata de perfeccion, se trata de conexion, bienestar y decisiones que te hagan bien hoy y siempre.',
    steps: [
      { title: 'Conocer tu historia', description: 'La guia pregunta objetivo, rutina, contexto, etapas de vida y relacion actual con la comida.' },
      { title: 'Armar cambios reales', description: 'El agente propone pequenos cambios sostenibles, sin culpa ni restricciones innecesarias.' },
      { title: 'Preparar la consulta', description: 'Si hace falta acompanamiento humano, resume tu caso para coordinar con Ana Sofía.' },
    ],
    guidePrompt:
      'Quiero iniciar una guia personalizada de nutricion. Haceme preguntas de a una para entender mi objetivo, rutina, comidas actuales, presupuesto, restricciones y si necesito derivacion profesional.',
    humanPrompt:
      'Quiero solicitar una consulta humana con Ana Sofía Rosalía Valdiviezo. Ayudame a resumir mi objetivo, rutina, antecedentes, restricciones y dudas principales.',
  },
  finance: {
    area: 'Finanzas',
    person: 'Fernando Martinis',
    credential: 'Contador Publico',
    specialty: 'Finanzas, gestion e impuestos',
    summary:
      'Acompana a personas, emprendedores y profesionales a ordenar numeros, optimizar recursos y tomar mejores decisiones.',
    approach:
      'Integra experiencia contable, gestion institucional y asesoramiento universitario para convertir informacion financiera en decisiones claras.',
    trust: 'Contador Publico | Asesor universitario en Salta | Gestion contable hospitalaria',
    image: {
      src: '/advisors/fernando-martinis.jpeg',
      alt: 'Perfil profesional de Fernando Martinis',
      width: 1024,
      height: 1536,
      cropBottom: true,
    },
    icon: Landmark,
    color: '#C47342',
    chips: ['Planificacion financiera', 'Impuestos', 'Gestion empresarial', 'Presupuestos', 'Optimizacion'],
    services: [
      'Planificacion financiera personal y familiar',
      'Asesoramiento contable e impositivo',
      'Gestion para emprendedores y pymes',
      'Analisis de costos y rentabilidad',
      'Presupuestos y control financiero',
      'Acompanamiento en decisiones clave',
    ],
    credentialsList: [
      { title: 'Formacion', description: 'Contador Publico' },
      { title: 'Experiencia', description: 'Asesoramiento a personas, empresas e instituciones' },
      { title: 'Gestion', description: 'Criterio contable y mirada institucional' },
      { title: 'Enfoque', description: 'Numeros claros para decidir con mas seguridad' },
    ],
    areas: [
      { title: 'Presupuesto personal', description: 'Ingresos, gastos, deudas y prioridades del mes.' },
      { title: 'Impuestos', description: 'Monotributo, facturacion y dudas administrativas.' },
      { title: 'Emprendedores', description: 'Costos, rentabilidad y flujo de caja.' },
      { title: 'Deudas', description: 'Estrategias realistas para ordenar pagos.' },
      { title: 'Metas financieras', description: 'Convertir objetivos en pasos medibles.' },
      { title: 'Consulta contable', description: 'Preparar datos para hablar con Fernando.' },
    ],
    quote: 'Ordenar los numeros no es solo calcular: es recuperar claridad para tomar mejores decisiones.',
    steps: [
      { title: 'Diagnostico financiero', description: 'La guia releva ingresos, gastos, deudas, impuestos y prioridades.' },
      { title: 'Plan claro', description: 'El agente organiza acciones posibles con orden, plazos y foco realista.' },
      { title: 'Consulta humana', description: 'Si el caso necesita criterio contable, prepara la consulta con Fernando.' },
    ],
    guidePrompt:
      'Quiero iniciar una guia personalizada de finanzas. Haceme preguntas de a una para entender ingresos, gastos, deudas, impuestos, objetivos y ordenar prioridades.',
    humanPrompt:
      'Quiero solicitar una consulta humana con Fernando Martinis. Ayudame a resumir mi situacion financiera, contable o impositiva para coordinar una atencion.',
  },
  home: {
    area: 'Hogar',
    person: 'Asistente Hogar IA',
    credential: 'Orientacion para el hogar',
    specialty: 'Mantenimiento, reparaciones y derivacion a profesionales',
    summary:
      'Ayuda a entender problemas cotidianos del hogar y, cuando no conviene resolverlo con IA, deriva a profesionales de Toori Servicios Ya.',
    approach:
      'Primero identifica riesgos, urgencia y pasos seguros. Si requiere oficio matriculado o visita tecnica, prepara la derivacion.',
    trust: 'IA de orientacion | Red profesional por Toori Servicios Ya',
    icon: Home,
    color: '#2E86C1',
    chips: ['Mantenimiento', 'Plomeria', 'Electricidad', 'Pintura', 'Derivacion'],
    services: [
      'Diagnostico inicial del problema',
      'Checklist de seguridad',
      'Mantenimiento preventivo',
      'Preparacion para pedir presupuesto',
      'Derivacion a profesionales',
      'Seguimiento del caso',
    ],
    credentialsList: [
      { title: 'Red de apoyo', description: 'Derivacion a profesionales de Toori Servicios Ya' },
      { title: 'Seguridad', description: 'Deteccion de riesgos de gas, electricidad, altura y estructuras' },
      { title: 'Alcance', description: 'Orientacion inicial para mantenimiento y reparaciones menores' },
      { title: 'Preparacion', description: 'Datos claros para pedir presupuesto o asistencia tecnica' },
    ],
    areas: [
      { title: 'Plomeria', description: 'Perdidas, canillas, desagues y diagnostico inicial.' },
      { title: 'Electricidad segura', description: 'Problemas basicos y senales para llamar a un profesional.' },
      { title: 'Pintura y humedad', description: 'Preparacion, materiales y causas posibles.' },
      { title: 'Mantenimiento', description: 'Checklists preventivos para evitar urgencias.' },
      { title: 'Presupuesto', description: 'Resumen del problema para pedir cotizaciones.' },
      { title: 'Derivacion', description: 'Cuando hace falta oficio o visita tecnica.' },
    ],
    quote: 'La mejor solucion empieza por entender el problema, medir el riesgo y pedir ayuda a tiempo.',
    steps: [
      { title: 'Identificar el problema', description: 'La guia pregunta ubicacion, sintomas, riesgos y urgencia.' },
      { title: 'Resolver lo simple', description: 'El agente sugiere pasos seguros cuando el caso lo permite.' },
      { title: 'Derivar por Toori', description: 'Si requiere oficio, prepara los datos para buscar profesional.' },
    ],
    guidePrompt:
      'Quiero iniciar una guia personalizada para un problema del hogar. Haceme preguntas de a una para identificar el problema, riesgos, urgencia y si conviene derivar a un profesional.',
    humanPrompt:
      'Quiero solicitar ayuda humana para un problema del hogar. Ayudame a resumir el caso para derivarlo a un profesional de Toori Servicios Ya.',
  },
  legal: {
    area: 'Legal',
    person: 'Asesor Legal IA',
    credential: 'Orientacion legal inicial',
    specialty: 'Contratos, documentos y preparacion de consulta',
    summary:
      'Ayuda a ordenar dudas legales, revisar documentos y preparar preguntas para un abogado cuando el caso necesita criterio profesional.',
    approach:
      'La IA orienta de forma informativa, detecta riesgos y arma un resumen claro para derivar al profesional legal.',
    trust: 'IA de orientacion | Derivacion a abogado cuando corresponda',
    icon: Scale,
    color: '#6C5CE7',
    chips: ['Contratos', 'Documentos', 'Riesgos', 'Derechos', 'Derivacion legal'],
    services: [
      'Consulta legal inicial',
      'Analisis de documentos',
      'Preparacion de contratos',
      'Resumen para abogado',
      'Organizacion de pruebas',
      'Preguntas para la consulta',
    ],
    credentialsList: [
      { title: 'Alcance', description: 'Orientacion legal inicial generada por IA' },
      { title: 'Documentos', description: 'Contratos, reclamos, borradores y resumen de casos' },
      { title: 'Jurisdiccion', description: 'Preparacion segun pais y contexto informado' },
      { title: 'Derivacion', description: 'Resumen para validar con abogado matriculado' },
    ],
    areas: [
      { title: 'Contratos', description: 'Alquiler, servicios, confidencialidad y acuerdos simples.' },
      { title: 'Revision inicial', description: 'Detectar riesgos, ambiguedades y preguntas clave.' },
      { title: 'Reclamos', description: 'Ordenar hechos, fechas, pruebas y proximos pasos.' },
      { title: 'Documentos', description: 'Preparar borradores claros para revision profesional.' },
      { title: 'Derechos', description: 'Entender opciones antes de tomar decisiones.' },
      { title: 'Consulta legal', description: 'Armar un resumen para abogado matriculado.' },
    ],
    quote: 'Un caso bien ordenado permite preguntar mejor, decidir con mas calma y llegar mas preparado a una consulta profesional.',
    steps: [
      { title: 'Entender el caso', description: 'La guia releva hechos, fechas, documentos y jurisdiccion.' },
      { title: 'Ordenar opciones', description: 'El agente brinda orientacion informativa y proximos pasos.' },
      { title: 'Derivar al abogado', description: 'Si hace falta, deja listo el resumen para consulta humana.' },
    ],
    guidePrompt:
      'Quiero iniciar una guia personalizada legal. Haceme preguntas de a una para entender el caso, jurisdiccion, documentos disponibles y pasos posibles.',
    humanPrompt:
      'Quiero solicitar una consulta humana con un abogado. Ayudame a resumir mi caso, documentos y preguntas principales.',
  },
};

const ADVISOR_TOOLS: Record<string, AdvisorTool[]> = {
  legal: [
    { label: 'Crear contrato', icon: 'DOC', description: 'Arma un primer borrador para revisar con criterio profesional.', action: { type: 'create' } },
    { label: 'Analizar documento', icon: 'REV', description: 'Detecta puntos sensibles y preguntas para hacer antes de firmar.', action: { type: 'analyze' } },
    { label: 'Consulta legal', icon: 'IA', description: 'Ordena una duda juridica y prepara el resumen del caso.', action: { type: 'chat_prompt', prompt: 'Tengo una consulta legal y quiero ordenarla paso a paso.' } },
    { label: 'Mis contratos', icon: 'ARC', description: 'Ver y gestionar contratos guardados.', action: { type: 'contracts' } },
  ],
  health: [
    { label: 'Consultar sintomas', icon: 'SAL', description: 'Ordena sintomas, antecedentes y signos de alarma.', action: { type: 'chat_prompt', prompt: 'Tengo sintomas y necesito orientacion para saber como proceder.' } },
    { label: 'Checklist medico', icon: 'CHK', description: 'Prepara controles, vacunas o preguntas para consulta.', action: { type: 'chat_prompt', prompt: 'Quiero preparar un checklist medico segun mi edad y situacion.' } },
    { label: 'Habitos saludables', icon: 'HAB', description: 'Arma cambios simples de descanso, alimentacion y actividad.', action: { type: 'chat_prompt', prompt: 'Necesito orientacion para mejorar mis habitos de salud.' } },
    { label: 'Consulta libre', icon: 'IA', description: 'Habla con el agente de salud.', action: { type: 'chat' } },
  ],
  nutrition: [
    { label: 'Alimentacion consciente', icon: 'CON', description: 'Reconecta hambre, saciedad y disfrute de comer.', action: { type: 'chat_prompt', prompt: 'Quiero mejorar mi relacion con la comida desde la alimentacion consciente.' } },
    { label: 'Habitos reales', icon: 'HAB', description: 'Define pequenos cambios sostenibles para tu dia a dia.', action: { type: 'chat_prompt', prompt: 'Quiero mejorar mis habitos alimentarios sin hacer una dieta extrema.' } },
    { label: 'Areas de acompanamiento', icon: 'ARE', description: 'Orienta el motivo de consulta y datos importantes.', action: { type: 'chat_prompt', prompt: 'Quiero saber si mi caso corresponde a nutricion integral y que datos deberia llevar.' } },
    { label: 'Consulta humana', icon: 'PRO', description: 'Prepara datos para coordinar con Ana Sofía.', action: { type: 'chat_prompt', prompt: 'Quiero preparar una consulta con Ana Sofía Rosalía Valdiviezo. Que datos deberia llevar?' } },
  ],
  finance: [
    { label: 'Mi presupuesto', icon: 'PTO', description: 'Organiza ingresos, gastos y prioridades del mes.', action: { type: 'chat_prompt', prompt: 'Quiero organizar mi presupuesto mensual. Por donde empiezo?' } },
    { label: 'Salir de deudas', icon: 'DEU', description: 'Define una estrategia realista para ordenar pagos.', action: { type: 'chat_prompt', prompt: 'Tengo varias deudas y no se por donde empezar. Que estrategia me recomendas?' } },
    { label: 'Consulta impositiva', icon: 'IMP', description: 'Prepara dudas sobre impuestos, monotributo o facturacion.', action: { type: 'chat_prompt', prompt: 'Tengo dudas sobre monotributo, impuestos o facturacion.' } },
    { label: 'Metas financieras', icon: 'MET', description: 'Convierte objetivos en pasos medibles.', action: { type: 'chat_prompt', prompt: 'Quiero establecer metas financieras realistas y ordenarlas.' } },
  ],
  psychology: [
    { label: 'Necesito hablar', icon: 'ESC', description: 'Un espacio inicial para expresar lo que estas viviendo.', action: { type: 'chat_prompt', prompt: 'Necesito hablar, estoy pasando por un momento dificil.' } },
    { label: 'Manejo de ansiedad', icon: 'ANS', description: 'Estrategias de regulacion y respiracion consciente.', action: { type: 'chat_prompt', prompt: 'Estoy sintiendo mucha ansiedad y necesito herramientas para manejarla.' } },
    { label: 'Ejercicios guiados', icon: 'RES', description: 'Respiracion, mindfulness y relajacion.', action: { type: 'exercises' } },
    { label: 'Lineas de ayuda', icon: 'SOS', description: 'Recursos de ayuda en crisis.', action: { type: 'crisis' } },
  ],
  home: [
    { label: 'Plomeria', icon: 'PLO', description: 'Perdidas, canillas, desagues y pasos seguros.', action: { type: 'chat_prompt', prompt: 'Tengo un problema de plomeria en mi casa.' } },
    { label: 'Electricidad', icon: 'ELE', description: 'Orientacion basica y senales para llamar a un profesional.', action: { type: 'chat_prompt', prompt: 'Tengo un problema electrico en casa. Que puedo hacer de forma segura?' } },
    { label: 'Mantenimiento', icon: 'MAN', description: 'Checklist de tareas preventivas para el hogar.', action: { type: 'chat_prompt', prompt: 'Necesito un checklist de mantenimiento preventivo para mi hogar.' } },
    { label: 'Derivar profesional', icon: 'PRO', description: 'Prepara el caso para pedir ayuda especializada.', action: { type: 'chat_prompt', prompt: 'Necesito derivar un problema del hogar a un profesional. Ayudame a resumirlo.' } },
  ],
};

const WHATSAPP_CONTACTS: Record<string, string | undefined> = {
  legal: process.env.NEXT_PUBLIC_WHATSAPP_LEGAL,
  health: process.env.NEXT_PUBLIC_WHATSAPP_HEALTH,
  nutrition: process.env.NEXT_PUBLIC_WHATSAPP_NUTRITION,
  finance: process.env.NEXT_PUBLIC_WHATSAPP_FINANCE,
  psychology: process.env.NEXT_PUBLIC_WHATSAPP_PSYCHOLOGY,
  home: process.env.NEXT_PUBLIC_WHATSAPP_HOME,
};

function buildWhatsAppUrl(phone: string | undefined, message: string) {
  const cleanedPhone = phone?.replace(/[^\d]/g, '');
  if (!cleanedPhone) return null;
  return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
}

function CrisisModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--text-strong)]/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-strong animate-fade-in">
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-subtle)] hover:text-[var(--text-strong)]"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mb-5 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-[var(--brand-lavender)]" strokeWidth={1.8} />
          <h2 className="mt-3 font-display text-xl font-bold tracking-tight text-[var(--text-strong)]">
            Lineas de ayuda en crisis
          </h2>
          <p className="mt-1.5 text-sm text-[var(--text-medium)]">Si estas en peligro, contacta de inmediato.</p>
        </div>
        <div className="space-y-2.5">
          {[
            { country: 'Argentina', line: '135', desc: 'Centro de Asistencia al Suicida, 24 hs gratuito' },
            { country: 'Mexico', line: '800-911-2000', desc: 'SAPTEL, crisis y orientacion 24 hs' },
            { country: 'Colombia', line: '106', desc: 'Linea 106, salud mental y crisis' },
            { country: 'Emergencias', line: '911', desc: 'Emergencias generales o 123 en Colombia' },
          ].map((item) => (
            <a
              key={item.country}
              href={`tel:${item.line.replace(/-/g, '')}`}
              className="flex items-center justify-between gap-4 rounded-xl border border-transparent bg-[var(--brand-lavender-bg)] p-3.5 transition-colors hover:border-[var(--brand-lavender)]/40"
            >
              <span className="min-w-0">
                <span className="block font-display text-[14px] font-bold text-[var(--text-strong)]">{item.country}</span>
                <span className="mt-0.5 block text-[12px] text-[var(--text-medium)]">{item.desc}</span>
              </span>
              <span className="flex-shrink-0 font-display text-[17px] font-bold text-[var(--brand-lavender)]">
                {item.line}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdvisorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [advisor, setAdvisor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCrisis, setShowCrisis] = useState(false);
  const profile = PROFESSIONAL_PROFILES[id];

  useEffect(() => {
    api.ai.getAdvisor(id)
      .then(setAdvisor)
      .catch(() => {
        if (profile) {
          setAdvisor({
            id,
            name: profile.area,
            title: profile.specialty,
            description: profile.summary,
            color: profile.color,
            available: true,
          });
          return;
        }

        toast.error('Error al cargar asesor');
      })
      .finally(() => setLoading(false));
  }, [id, profile]);

  const openGuide = () => {
    router.push(`/advisor?advisor=${id}&prompt=${encodeURIComponent(profile.guidePrompt)}`);
  };

  const openChat = () => {
    router.push(`/advisor?advisor=${id}`);
  };

  const openHumanConsultation = () => {
    router.push(`/advisor?advisor=${id}&prompt=${encodeURIComponent(profile.humanPrompt)}`);
  };

  const handleTool = (tool: AdvisorTool) => {
    const { action } = tool;
    switch (action.type) {
      case 'chat':
        openChat();
        break;
      case 'chat_prompt':
        router.push(`/advisor?advisor=${id}&prompt=${encodeURIComponent(action.prompt)}`);
        break;
      case 'analyze':
        router.push('/analysis');
        break;
      case 'contracts':
        router.push('/contracts');
        break;
      case 'create':
        router.push('/advisor?advisor=legal&mode=create');
        break;
      case 'crisis':
        setShowCrisis(true);
        break;
      case 'exercises':
        router.push(`/advisor?advisor=${id}&prompt=${encodeURIComponent('Quiero hacer un ejercicio guiado de bienestar. Que opciones tengo?')}`);
        break;
      case 'wellness':
        router.push(`/advisor?advisor=${id}&prompt=${encodeURIComponent('Quiero registrar como me siento hoy. Podes guiarme?')}`);
        break;
      case 'mood':
        router.push(`/advisor?advisor=${id}&prompt=${encodeURIComponent('Quiero escribir en mi diario emocional de hoy.')}`);
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!advisor || !profile) {
    return (
      <div className="p-10 text-center">
        <p className="text-[var(--text-medium)]">Asesor no encontrado.</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push('/home')}>Volver</Button>
      </div>
    );
  }

  const tools = ADVISOR_TOOLS[id] || [];
  const Icon = profile.icon;
  const advisorColor = profile.color || advisor.color || 'var(--primary)';
  const whatsappMessage = `Hola, quiero solicitar una consulta con ${profile.person}. Ya estoy usando MiAsesor y quiero compartir un resumen de mi caso.`;
  const whatsappUrl = buildWhatsAppUrl(
    WHATSAPP_CONTACTS[id] || process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT,
    whatsappMessage,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-8 md:py-10">
      {showCrisis && <CrisisModal onClose={() => setShowCrisis(false)} />}

      <button
        onClick={() => router.push('/home')}
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-medium)] transition-colors hover:text-[var(--text-strong)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.4} /> Asesores
      </button>

      <section className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)] shadow-soft">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{
                  background: `color-mix(in srgb, ${advisorColor} 14%, var(--surface-subtle))`,
                  color: advisorColor,
                }}
              >
                <Icon className="h-6 w-6" strokeWidth={2} />
              </span>
              <div>
                <p className="font-display text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  {profile.area}
                </p>
                <p className="font-display text-sm font-bold text-[var(--text-strong)]">{profile.credential}</p>
              </div>
              {!advisor.available && <Badge color="orange">Plan Pro</Badge>}
            </div>

            <h1 className="font-display text-[clamp(30px,5vw,54px)] font-bold leading-[0.98] tracking-tight text-[var(--text-strong)]">
              {profile.person}
            </h1>
            <p className="mt-3 max-w-2xl font-display text-xl font-semibold leading-snug text-[var(--text-strong)] sm:text-2xl">
              {profile.specialty}
            </p>
            <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-[var(--text-medium)]">
              {profile.summary}
            </p>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--text-medium)]">
              {profile.approach}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {profile.chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full px-3 py-1 text-[12px] font-semibold"
                  style={{
                    background: `color-mix(in srgb, ${advisorColor} 11%, var(--surface-subtle))`,
                    color: advisorColor,
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Button
                size="lg"
                onClick={openGuide}
                className="justify-between !bg-[var(--cta)] hover:!bg-[var(--cta-dark)]"
              >
                <span className="inline-flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" strokeWidth={2.4} />
                  Iniciar guia personalizada
                </span>
                <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
              </Button>
              <Button size="lg" variant="secondary" onClick={openChat} className="justify-between">
                <span className="inline-flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" strokeWidth={2.4} />
                  Hablar con IA
                </span>
                <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
              </Button>
            </div>

            <button
              onClick={openHumanConsultation}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] px-5 py-3 text-sm font-semibold text-[var(--text-strong)] transition-all hover:border-[var(--border-strong)] hover:bg-[var(--surface)] sm:w-auto"
            >
              <CalendarCheck className="h-4 w-4" strokeWidth={2.4} />
              Solicitar consulta humana
            </button>

            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: advisorColor }} strokeWidth={2.1} />
              <p className="text-[13px] leading-relaxed text-[var(--text-medium)]">{profile.trust}</p>
            </div>
          </div>

          <div className="bg-[var(--surface-subtle)] p-4 sm:p-6 lg:p-7">
            {profile.image ? (
              <div
                className="relative h-full min-h-[360px] overflow-hidden rounded-3xl bg-white shadow-soft"
                style={{ aspectRatio: profile.image.cropBottom ? '0.72' : `${profile.image.width} / ${profile.image.height}` }}
              >
                <Image
                  src={profile.image.src}
                  alt={profile.image.alt}
                  width={profile.image.width}
                  height={profile.image.height}
                  priority
                  className={`h-full w-full ${profile.image.cropBottom ? 'object-cover object-top' : 'object-contain'}`}
                  sizes="(min-width: 1024px) 44vw, 100vw"
                />
              </div>
            ) : (
              <div className="flex h-full min-h-[360px] flex-col justify-between rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7">
                <Sparkles className="h-10 w-10" style={{ color: advisorColor }} strokeWidth={1.8} />
                <div>
                  <p className="font-display text-3xl font-bold leading-tight text-[var(--text-strong)]">{profile.person}</p>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--text-medium)]">{profile.summary}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.88fr]">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-soft">
          <div className="mb-5 flex items-center gap-3">
            <ClipboardList className="h-5 w-5" style={{ color: advisorColor }} strokeWidth={2.2} />
            <h2 className="font-display text-xl font-bold tracking-tight text-[var(--text-strong)]">
              Guia inteligente de primera linea
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { title: '1. Releva datos clave', description: 'Pregunta de a una cosa: motivo, contexto, urgencia, antecedentes y objetivo.' },
              { title: '2. Clasifica el caso', description: 'Distingue consultas simples, casos que necesitan seguimiento y situaciones de riesgo.' },
              { title: '3. Resuelve lo orientativo', description: 'Entrega pasos claros cuando la IA puede ayudar sin reemplazar criterio profesional.' },
              { title: '4. Prepara derivacion', description: 'Si hace falta humano, arma un resumen listo para enviar por WhatsApp o llevar a consulta.' },
            ].map((step) => (
              <div key={step.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                <p className="font-display text-[14px] font-bold text-[var(--text-strong)]">{step.title}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-medium)]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-soft">
          <div className="mb-5 flex items-center gap-3">
            <MessageCircle className="h-5 w-5" style={{ color: advisorColor }} strokeWidth={2.2} />
            <h2 className="font-display text-xl font-bold tracking-tight text-[var(--text-strong)]">
              WhatsApp con contexto
            </h2>
          </div>
          <p className="text-[14px] leading-relaxed text-[var(--text-medium)]">
            La IA atiende primero y deja un resumen breve para que el profesional no tenga que empezar desde cero. El canal humano queda asincronico y reservado para casos que realmente lo necesitan.
          </p>
          <div className="mt-5 space-y-2.5">
            {['Resumen del motivo y datos importantes', 'Prioridad sugerida antes de contactar', 'Mensaje listo para copiar o enviar'].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-2xl bg-[var(--surface-subtle)] px-4 py-3 text-[13px] font-semibold text-[var(--text-medium)]">
                <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: advisorColor }} strokeWidth={2.2} />
                {item}
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-3">
            <Button size="lg" onClick={openHumanConsultation} className="justify-between">
              <span className="inline-flex items-center gap-2">
                <ClipboardList className="h-4 w-4" strokeWidth={2.4} />
                Preparar resumen
              </span>
              <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
            </Button>
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] px-5 py-3 text-sm font-semibold text-[var(--text-strong)] transition-all hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
              >
                <Send className="h-4 w-4" strokeWidth={2.4} />
                Abrir WhatsApp
              </a>
            ) : (
              <button
                type="button"
                onClick={openHumanConsultation}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] px-5 py-3 text-sm font-semibold text-[var(--text-strong)] transition-all hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
              >
                <Send className="h-4 w-4" strokeWidth={2.4} />
                Preparar mensaje WhatsApp
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-soft">
          <div className="mb-5 flex items-center gap-3">
            <BadgeCheck className="h-5 w-5" style={{ color: advisorColor }} strokeWidth={2.2} />
            <h2 className="font-display text-xl font-bold tracking-tight text-[var(--text-strong)]">
              Credenciales y respaldo
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {profile.credentialsList.map((item) => (
              <div key={item.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                <p className="font-display text-[14px] font-bold text-[var(--text-strong)]">{item.title}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-medium)]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div
          className="flex min-h-[260px] flex-col justify-between rounded-3xl p-7 text-white shadow-soft"
          style={{ background: `linear-gradient(135deg, ${advisorColor}, color-mix(in srgb, ${advisorColor} 62%, #102B33))` }}
        >
          <Quote className="h-10 w-10 text-white/68" strokeWidth={1.8} />
          <div>
            <p className="font-display text-[clamp(24px,3vw,34px)] font-bold leading-tight tracking-normal">
              {profile.quote}
            </p>
            <p className="mt-5 text-sm font-semibold text-white/78">- {profile.person}</p>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-soft">
        <div className="mb-5 flex items-center gap-3">
          <Sparkles className="h-5 w-5" style={{ color: advisorColor }} strokeWidth={2.1} />
          <h2 className="font-display text-xl font-bold tracking-tight text-[var(--text-strong)]">
            Areas de acompanamiento
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profile.areas.map((area) => (
            <div key={area.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <p className="font-display text-[15px] font-bold text-[var(--text-strong)]">{area.title}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-medium)]">{area.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-soft">
          <div className="mb-5 flex items-center gap-3">
            <UserRound className="h-5 w-5" style={{ color: advisorColor }} strokeWidth={2.2} />
            <h2 className="font-display text-xl font-bold tracking-tight text-[var(--text-strong)]">
              En que puede ayudarte
            </h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {profile.services.map((service) => (
              <div key={service} className="rounded-2xl bg-[var(--surface-subtle)] px-4 py-3 text-sm font-medium text-[var(--text-medium)]">
                {service}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-soft">
          <div className="mb-5 flex items-center gap-3">
            <HeartHandshake className="h-5 w-5" style={{ color: advisorColor }} strokeWidth={2.2} />
            <h2 className="font-display text-xl font-bold tracking-tight text-[var(--text-strong)]">
              Metodo de acompanamiento
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {profile.steps.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                <span
                  className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-full font-display text-sm font-bold text-white"
                  style={{ background: advisorColor }}
                >
                  {index + 1}
                </span>
                <p className="font-display text-[15px] font-bold text-[var(--text-strong)]">{step.title}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-medium)]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {tools.length > 0 && (
        <section className="mt-8" aria-labelledby="tools-heading">
          <h2 id="tools-heading" className="mb-4 font-display text-lg font-bold tracking-tight text-[var(--text-strong)]">
            Atajos utiles
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tools.map((tool) => (
              <button
                key={tool.label}
                onClick={() => handleTool(tool)}
                className="bento-card rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-left"
              >
                <span
                  className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl font-display text-[11px] font-bold"
                  style={{ background: `color-mix(in srgb, ${advisorColor} 12%, var(--surface-subtle))`, color: advisorColor }}
                >
                  {tool.icon}
                </span>
                <span className="block font-display text-[14.5px] font-semibold tracking-tight text-[var(--text-strong)]">
                  {tool.label}
                </span>
                <span className="mt-1.5 block text-[12.5px] leading-relaxed text-[var(--text-medium)]">{tool.description}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="mx-auto mb-2 mt-8 max-w-4xl rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
        <span className="mr-1 font-semibold">Aviso:</span>
        {id === 'legal' && (
          <>Las respuestas son orientacion informativa generada por IA. No reemplazan a un abogado matriculado. Verifica con un profesional antes de firmar o presentar documentos.</>
        )}
        {id === 'health' && (
          <>Las respuestas son orientacion informativa generada por IA. No reemplazan la consulta con un profesional de la salud. Ante una emergencia, llama al 107, 911 o numero local.</>
        )}
        {id === 'nutrition' && (
          <>Las respuestas son orientacion informativa generada por IA. No reemplazan a una nutricionista matriculada ni indicaciones medicas, especialmente ante condiciones clinicas, embarazo, medicacion o antecedentes de trastornos alimentarios.</>
        )}
        {id === 'finance' && (
          <>Las respuestas son orientacion informativa generada por IA. No reemplazan a un contador o asesor financiero matriculado para decisiones patrimoniales, tributarias o de inversion.</>
        )}
        {id === 'psychology' && (
          <>Las respuestas son orientacion informativa generada por IA. No reemplazan la terapia con un profesional licenciado. En crisis, contacta una linea de ayuda o emergencias.</>
        )}
        {id === 'home' && (
          <>Las respuestas son orientacion informativa generada por IA. Para gas, alta tension, estructuras o riesgos fisicos, contrata siempre un profesional matriculado.</>
        )}
      </div>
    </div>
  );
}
