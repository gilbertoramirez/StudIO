'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { ChatMessage, ExamDifficulty, ExamQuestion, PlanSession, Tab, Theme } from '@/types/studio';
import { queryGroq, verifyGroqApiKey } from '@/lib/groq';
import { buildDemoQuestions, getDemoResponse } from '@/lib/demoData';
import { escapeHtml, formatResponse } from '@/lib/format';
import { extractiveSummary } from '@/lib/summary';
import { buildLabeledContentForBudget } from '@/lib/content';

const DIFFICULTY_LABEL: Record<ExamDifficulty, string> = {
  facil: 'fácil',
  media: 'media',
  dificil: 'difícil',
};

interface StudioContextValue {
  tab: Tab;
  setTab: (t: Tab) => void;
  theme: Theme;
  toggleTheme: () => void;

  hasFile: boolean;
  fileName: string;
  fileSize: number;
  totalPages: number;
  pageFrom: number;
  pageTo: number;
  contentText: string;
  apiKey: string;
  isExtracting: boolean;
  extractError: string | null;
  apiKeyStatus: 'idle' | 'checking' | 'valid' | 'invalid';
  apiKeyError: string | null;
  groqError: string | null;

  handleFile: (file: File) => void;
  removeFile: () => void;
  setPageFrom: (n: number) => void;
  setPageTo: (n: number) => void;
  setTotalPages: (n: number) => void;
  setRange: (from: number, to: number) => void;
  setContentText: (t: string) => void;
  saveApiKey: (key: string) => void;

  messages: ChatMessage[];
  isTyping: boolean;
  sendMessage: (text: string) => Promise<void>;

  summaryText: string | null;
  isGeneratingSummary: boolean;
  generateSummary: () => Promise<void>;

  planSessions: PlanSession[] | null;
  planChecked: Set<number>;
  isGeneratingPlan: boolean;
  generatePlan: () => Promise<void>;
  toggleSession: (i: number) => void;

  examQuestions: ExamQuestion[] | null;
  examAnswers: Record<number, number>;
  examSubmitted: boolean;
  examSeconds: number;
  isGeneratingExam: boolean;
  examQuestionCount: number;
  setExamQuestionCount: (n: number) => void;
  examDifficulty: ExamDifficulty;
  setExamDifficulty: (d: ExamDifficulty) => void;
  generateExam: () => Promise<void>;
  selectOption: (qi: number, oi: number) => void;
  submitExam: () => void;
}

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<Tab>('documento');
  const [theme, setTheme] = useState<Theme>('light');

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageFrom, setPageFromState] = useState(1);
  const [pageTo, setPageToState] = useState(0);
  const [contentText, setContentText] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [pageTexts, setPageTexts] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [groqError, setGroqError] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const [planSessions, setPlanSessions] = useState<PlanSession[] | null>(null);
  const [planChecked, setPlanChecked] = useState<Set<number>>(new Set());
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const [examQuestions, setExamQuestions] = useState<ExamQuestion[] | null>(null);
  const [examAnswers, setExamAnswers] = useState<Record<number, number>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examSeconds, setExamSeconds] = useState(0);
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  const [examQuestionCount, setExamQuestionCount] = useState(5);
  const [examDifficulty, setExamDifficulty] = useState<ExamDifficulty>('media');
  const examTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem('studio_theme');
    } catch {}
    const initial = stored ?? (window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
    setTheme(initial as Theme);
    let storedKey = '';
    try {
      storedKey = localStorage.getItem('studio_key') || '';
    } catch {}
    setApiKey(storedKey);
    if (storedKey) {
      setApiKeyStatus('checking');
      void verifyGroqApiKey(storedKey).then((result) => {
        setApiKeyStatus(result.ok ? 'valid' : 'invalid');
        setApiKeyError(result.error);
      });
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('studio_theme', next);
      } catch {}
      return next;
    });
  }, []);

  const handleFile = useCallback((f: File) => {
    if (f.type !== 'application/pdf') return;
    setFile(f);
    setFileName(f.name);
    setFileSize(f.size);
    setPageTexts([]);
    setContentText('');
    setSummaryText(null);
    setExtractError(null);
    setIsExtracting(true);

    (async () => {
      try {
        const { extractPdfPageTexts } = await import('@/lib/pdf');
        const texts = await extractPdfPageTexts(f);
        const pages = texts.length || 1;
        setPageTexts(texts);
        setTotalPages(pages);
        setPageFromState(1);
        setPageToState(pages);
        if (!texts.some((t) => t.length > 0)) {
          setExtractError(
            'No se pudo extraer texto de este PDF (parece un documento escaneado). Puedes escribir el contenido manualmente abajo.'
          );
        }
      } catch {
        setTotalPages(1);
        setPageFromState(1);
        setPageToState(1);
        setExtractError('No se pudo leer el PDF. Puedes escribir el contenido manualmente abajo.');
      } finally {
        setIsExtracting(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (pageTexts.length === 0) return;
    const from = Math.max(1, Math.min(pageFrom, pageTexts.length));
    const to = Math.max(from, Math.min(pageTo || pageTexts.length, pageTexts.length));
    setContentText(pageTexts.slice(from - 1, to).join('\n\n'));
  }, [pageFrom, pageTo, pageTexts]);

  const removeFile = useCallback(() => {
    setFile(null);
    setFileName('');
    setFileSize(0);
    setTotalPages(0);
    setPageFromState(1);
    setPageToState(0);
    setContentText('');
    setPageTexts([]);
    setExtractError(null);
    setSummaryText(null);
  }, []);

  const setPageFrom = useCallback(
    (n: number) => {
      setPageFromState((_prev) => {
        const clamped = Math.max(1, Math.min(n, totalPages || 1));
        setPageToState((prevTo) => (clamped > prevTo ? clamped : prevTo));
        return clamped;
      });
    },
    [totalPages]
  );

  const setPageTo = useCallback(
    (n: number) => {
      setPageToState((_prev) => {
        return Math.max(pageFrom, Math.min(n, totalPages || 1));
      });
    },
    [pageFrom, totalPages]
  );

  const setRange = useCallback(
    (from: number, to: number) => {
      setPageFromState(Math.max(1, from));
      setPageToState(Math.min(totalPages, to));
    },
    [totalPages]
  );

  const handleSetTotalPages = useCallback((n: number) => {
    const value = Math.max(1, n || 1);
    setTotalPages(value);
    setPageToState((prevTo) => (prevTo > value ? value : prevTo));
  }, []);

  const saveApiKey = useCallback((key: string) => {
    setApiKey(key);
    setGroqError(null);
    try {
      localStorage.setItem('studio_key', key);
    } catch {}

    if (!key) {
      setApiKeyStatus('idle');
      setApiKeyError(null);
      return;
    }

    setApiKeyStatus('checking');
    setApiKeyError(null);
    void verifyGroqApiKey(key).then((result) => {
      setApiKeyStatus(result.ok ? 'valid' : 'invalid');
      setApiKeyError(result.error);
    });
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setMessages((prev) => [...prev, { role: 'user', html: escapeHtml(text) }]);
      setIsTyping(true);

      const context = contentText
        ? 'Contenido del documento (pp. ' + pageFrom + '-' + pageTo + '):\n\n' + contentText.substring(0, 8000)
        : 'Documento: ' + fileName + ', analizando páginas ' + pageFrom + ' a ' + pageTo + '.';

      const systemPrompt =
        'Eres StudIO, un asistente de estudio. Responde de forma clara y útil basándote en el contenido proporcionado. Usa formato simple con listas cuando sea apropiado.';
      const userMsg = context + '\n\nPregunta del estudiante: ' + text;

      const { content: aiResponse, error } = await queryGroq(apiKey, systemPrompt, userMsg);
      setGroqError(error);
      setIsTyping(false);

      const html = aiResponse ? formatResponse(aiResponse) : getDemoResponse(text, fileName, pageFrom, pageTo);
      setMessages((prev) => [...prev, { role: 'ai', html }]);
    },
    [apiKey, contentText, fileName, pageFrom, pageTo]
  );

  const generateSummary = useCallback(async () => {
    setIsGeneratingSummary(true);
    const systemPrompt =
      'Genera un resumen claro y estructurado (con encabezados breves y viñetas) del contenido proporcionado, en español. Basa el resumen únicamente en ese contenido.';
    const { content: result, error } = contentText
      ? await queryGroq(apiKey, systemPrompt, contentText.substring(0, 6000))
      : { content: null, error: null };
    setGroqError(error);
    setSummaryText(result ? result.trim() : extractiveSummary(contentText));
    setIsGeneratingSummary(false);
  }, [apiKey, contentText]);

  const generatePlan = useCallback(async () => {
    setIsGeneratingPlan(true);
    const context = contentText ? 'Contenido: ' + contentText.substring(0, 6000) : 'Documento: ' + fileName;
    const systemPrompt =
      'Genera un plan de estudio en formato JSON. Devuelve SOLO un array JSON con objetos que tengan: title, pages, duration (en minutos), objectives (string). Entre 4 y 6 sesiones.';
    const { content: result, error } = await queryGroq(apiKey, systemPrompt, context + '. Páginas ' + pageFrom + ' a ' + pageTo + '.');
    setGroqError(error);

    let sessions: PlanSession[] | null = null;
    if (result) {
      try {
        const match = result.match(/\[[\s\S]*\]/);
        if (match) sessions = JSON.parse(match[0]);
      } catch {}
    }

    if (!sessions) {
      const rangeSize = pageTo - pageFrom + 1;
      const chunk = Math.ceil(rangeSize / 5);
      sessions = [
        {
          title: 'Introducción y contexto general',
          pages: pageFrom + '–' + Math.min(pageFrom + chunk - 1, pageTo),
          duration: 45,
          objectives: 'Comprender el marco teórico y los objetivos principales del material.',
        },
        {
          title: 'Conceptos fundamentales',
          pages: pageFrom + chunk + '–' + Math.min(pageFrom + chunk * 2 - 1, pageTo),
          duration: 60,
          objectives: 'Dominar las definiciones clave y sus interrelaciones.',
        },
        {
          title: 'Desarrollo y análisis',
          pages: pageFrom + chunk * 2 + '–' + Math.min(pageFrom + chunk * 3 - 1, pageTo),
          duration: 60,
          objectives: 'Estudiar los argumentos principales y la evidencia presentada.',
        },
        {
          title: 'Aplicaciones prácticas',
          pages: pageFrom + chunk * 3 + '–' + Math.min(pageFrom + chunk * 4 - 1, pageTo),
          duration: 50,
          objectives: 'Revisar casos prácticos y ejemplos de aplicación.',
        },
        {
          title: 'Revisión y consolidación',
          pages: pageFrom + chunk * 4 + '–' + pageTo,
          duration: 40,
          objectives: 'Repasar conceptos clave, resolver dudas y preparar notas de síntesis.',
        },
      ];
    }

    setPlanSessions(sessions);
    setPlanChecked(new Set());
    setIsGeneratingPlan(false);
  }, [apiKey, contentText, fileName, pageFrom, pageTo]);

  const toggleSession = useCallback((i: number) => {
    setPlanChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }, []);

  const stopExamTimer = useCallback(() => {
    if (examTimerRef.current) {
      clearInterval(examTimerRef.current);
      examTimerRef.current = null;
    }
  }, []);

  const generateExam = useCallback(async () => {
    setIsGeneratingExam(true);
    setExamAnswers({});
    setExamSubmitted(false);

    const labeled = pageTexts.length > 0 ? buildLabeledContentForBudget(pageTexts, pageFrom, pageTo, 8000) : contentText.substring(0, 8000);
    const context = labeled
      ? 'Contenido (cada sección está marcada con [Página N]; puede ser una muestra representativa de todo el rango de páginas):\n' + labeled
      : 'Documento: ' + fileName;
    const systemPrompt =
      'Genera un examen de opción múltiple en formato JSON basado únicamente en el contenido proporcionado. Devuelve SOLO un array JSON con ' +
      examQuestionCount +
      ' objetos, cada uno con: text (pregunta), options (array de 4 strings), correct (indice 0-3 de la respuesta correcta), explanation (breve explicación), pages (el número o rango de página, tal como aparece en las marcas [Página N] del contenido, donde se encuentra la respuesta), topic (título breve, de máximo 6 palabras, del tema o sección al que pertenece la pregunta). Nivel de dificultad: ' +
      DIFFICULTY_LABEL[examDifficulty] +
      '.';
    const { content: result, error } = await queryGroq(apiKey, systemPrompt, context + '. Páginas ' + pageFrom + ' a ' + pageTo + '.');
    setGroqError(error);

    let questions: ExamQuestion[] | null = null;
    if (result) {
      try {
        const match = result.match(/\[[\s\S]*\]/);
        if (match) questions = JSON.parse(match[0]);
      } catch {}
    }

    setExamQuestions(
      questions && questions.length ? questions.slice(0, examQuestionCount) : buildDemoQuestions(examQuestionCount, pageFrom, pageTo)
    );
    setExamSeconds(0);
    stopExamTimer();
    examTimerRef.current = setInterval(() => {
      setExamSeconds((s) => s + 1);
    }, 1000);
    setIsGeneratingExam(false);
  }, [apiKey, contentText, fileName, pageFrom, pageTo, pageTexts, examQuestionCount, examDifficulty, stopExamTimer]);

  const selectOption = useCallback(
    (qi: number, oi: number) => {
      if (examSubmitted) return;
      setExamAnswers((prev) => ({ ...prev, [qi]: oi }));
    },
    [examSubmitted]
  );

  const submitExam = useCallback(() => {
    if (!examQuestions) return;
    const unanswered = examQuestions.length - Object.keys(examAnswers).length;
    if (unanswered > 0) {
      const proceed = window.confirm(
        'Tienes ' + unanswered + ' pregunta(s) sin responder. ¿Deseas calificar de todas formas?'
      );
      if (!proceed) return;
    }
    setExamSubmitted(true);
    stopExamTimer();
  }, [examAnswers, examQuestions, stopExamTimer]);

  useEffect(() => () => stopExamTimer(), [stopExamTimer]);

  const value: StudioContextValue = {
    tab,
    setTab,
    theme,
    toggleTheme,

    hasFile: !!file,
    fileName,
    fileSize,
    totalPages,
    pageFrom,
    pageTo,
    contentText,
    apiKey,
    isExtracting,
    extractError,
    apiKeyStatus,
    apiKeyError,
    groqError,

    handleFile,
    removeFile,
    setPageFrom,
    setPageTo,
    setTotalPages: handleSetTotalPages,
    setRange,
    setContentText,
    saveApiKey,

    messages,
    isTyping,
    sendMessage,

    summaryText,
    isGeneratingSummary,
    generateSummary,

    planSessions,
    planChecked,
    isGeneratingPlan,
    generatePlan,
    toggleSession,

    examQuestions,
    examAnswers,
    examSubmitted,
    examSeconds,
    isGeneratingExam,
    examQuestionCount,
    setExamQuestionCount,
    examDifficulty,
    setExamDifficulty,
    generateExam,
    selectOption,
    submitExam,
  };

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio(): StudioContextValue {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('useStudio must be used within a StudioProvider');
  return ctx;
}
