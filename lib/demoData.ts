import { escapeHtml } from './format';
import type { ExamQuestion } from '@/types/studio';

export const DEMO_QUESTIONS: ExamQuestion[] = [
  {
    text: '¿Cuál es el propósito principal del marco teórico presentado en el documento?',
    options: [
      'Describir la metodología de investigación utilizada',
      'Establecer las bases conceptuales para el análisis',
      'Presentar los resultados del estudio',
      'Comparar diferentes enfoques prácticos',
    ],
    correct: 1,
    explanation:
      'El marco teórico tiene como función principal establecer las bases conceptuales que fundamentan el análisis posterior.',
  },
  {
    text: 'Según el contenido, ¿qué relación existe entre los conceptos fundamentales A y B?',
    options: [
      'Son independientes entre sí',
      'A es un subconjunto de B',
      'Son complementarios y se refuerzan mutuamente',
      'B contradice los principios de A',
    ],
    correct: 2,
    explanation:
      'Los conceptos se presentan como complementarios: cada uno aporta una dimensión distinta que fortalece la comprensión del conjunto.',
  },
  {
    text: '¿Cuál de las siguientes NO es una limitación mencionada en el análisis?',
    options: [
      'Tamaño reducido de la muestra',
      'Sesgo en la selección de participantes',
      'Falta de validación externa',
      'Exceso de variables de control',
    ],
    correct: 3,
    explanation:
      'El exceso de variables de control no se menciona como una limitación; de hecho, el documento sugiere que podrían haberse incluido más controles.',
  },
  {
    text: '¿Qué enfoque metodológico recomienda el autor para futuras investigaciones?',
    options: [
      'Estudios exclusivamente cuantitativos',
      'Métodos mixtos combinando datos cualitativos y cuantitativos',
      'Análisis puramente teórico sin datos empíricos',
      'Replicación exacta del estudio actual',
    ],
    correct: 1,
    explanation:
      'El autor recomienda métodos mixtos para obtener una visión más completa, combinando la profundidad cualitativa con la precisión cuantitativa.',
  },
  {
    text: '¿Cuál es la conclusión principal del documento respecto al tema central?',
    options: [
      'El tema necesita una revisión completa de sus fundamentos',
      'Los hallazgos confirman parcialmente la hipótesis inicial',
      'No es posible llegar a conclusiones definitivas',
      'Los resultados son contrarios a toda la literatura previa',
    ],
    correct: 1,
    explanation:
      'La conclusión indica una confirmación parcial: los datos apoyan la hipótesis en ciertos aspectos pero revelan matices no anticipados.',
  },
];

export function getDemoResponse(question: string, fileName: string, pageFrom: number, pageTo: number): string {
  const lower = question.toLowerCase();

  if (lower.includes('concepto') || lower.includes('clave') || lower.includes('tema')) {
    return (
      '<p>Basándome en las páginas ' +
      pageFrom +
      '–' +
      pageTo +
      ' de <strong>' +
      fileName +
      '</strong>, identifico estos conceptos principales:</p><ul><li><strong>Fundamentos teóricos</strong> — definiciones y marco conceptual base</li><li><strong>Metodología de análisis</strong> — procesos y herramientas aplicadas</li><li><strong>Casos de aplicación</strong> — ejemplos prácticos documentados</li><li><strong>Evaluación crítica</strong> — limitaciones y áreas de mejora</li></ul><p>Pega el contenido del documento para un análisis específico.</p>'
    );
  }
  if (lower.includes('resum') || lower.includes('sintetiza')) {
    return '<p>Para generar un resumen preciso necesito el contenido de las páginas seleccionadas. Puedes pegarlo en la pestaña <strong>Documento</strong>.</p><p>Con el texto disponible, generaré un resumen estructurado con los puntos principales, argumentos de soporte y conclusiones clave.</p>';
  }
  if (lower.includes('estudiar primero') || lower.includes('orden') || lower.includes('prioridad')) {
    return '<p>Te sugiero este orden de estudio:</p><ol><li><strong>Definiciones base</strong> — asegúrate de dominar la terminología</li><li><strong>Conceptos fundamentales</strong> — los pilares teóricos del tema</li><li><strong>Relaciones entre conceptos</strong> — cómo se conectan entre sí</li><li><strong>Aplicaciones prácticas</strong> — casos y ejemplos</li><li><strong>Análisis crítico</strong> — evaluación y perspectiva propia</li></ol>';
  }
  if (lower.includes('pregunta') || lower.includes('repaso') || lower.includes('quiz')) {
    return '<p>Aquí tienes algunas preguntas de repaso basadas en la estructura típica del contenido:</p><ol><li>¿Cuál es la definición central del tema principal?</li><li>¿Qué diferencia hay entre los conceptos A y B presentados?</li><li>Describe un caso de aplicación práctica mencionado en el texto.</li><li>¿Cuáles son las tres limitaciones principales identificadas?</li></ol><p>Para preguntas específicas del contenido, genera un <strong>Examen</strong> desde la pestaña correspondiente.</p>';
  }
  return (
    '<p>Para darte una respuesta precisa sobre <em>' +
    escapeHtml(question) +
    '</em>, necesito analizar el contenido real del documento.</p><p>Tienes dos opciones:</p><ul><li>Pega el texto del PDF en la pestaña <strong>Documento</strong></li><li>Configura tu <strong>API key de Groq</strong> para análisis automático</li></ul>'
  );
}
