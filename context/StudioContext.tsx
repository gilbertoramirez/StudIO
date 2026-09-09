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
import type { ChatMessage, ExamQuestion, PlanSession, Tab, Theme } from '@/types/studio';
import { queryGroq } from '@/lib/groq';
import { DEMO_QUESTIONS, getDemoResponse } from '@/lib/demoData';
import { escapeHtml, formatResponse } from '@/lib/format';

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

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const [planSessions, setPlanSessions] = useState<PlanSession[] | null>(null);
  const [planChecked, setPlanChecked] = useState<Set<number>>(new Set());
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const [examQuestions, setExamQuestions] = useState<ExamQuestion[] | null>(null);
  const [examAnswers, setExamAnswers] = useState<Record<number, number>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examSeconds, setExamSeconds] = useState(0);
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  const examTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem('studio_theme');
    } catch {}
    const initial = stored ?? (window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
    setTheme(initial as Theme);
    try {
      setApiKey(localStorage.getItem('studio_key') || '');
    } catch {}
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

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (!(result instanceof ArrayBuffer)) return;
      const bytes = new Uint8Array(result);
      const text = new TextDecoder('latin1').decode(bytes);
      const matches = text.match(/\/Type\s*\/Page[^s]/g);
      const pages = matches ? matches.length : 20;
      setTotalPages(pages);
      setPageFromState(1);
      setPageToState(pages);
    };
    reader.readAsArrayBuffer(f);
  }, []);

  const removeFile = useCallback(() => {
    setFile(null);
    setFileName('');
    setFileSize(0);
    setTotalPages(0);
    setPageFromState(1);
    setPageToState(0);
    setContentText('');
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
    try {
      localStorage.setItem('studio_key', key);
    } catch {}
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setMessages((prev) => [...prev, { role: 'user', html: escapeHtml(text) }]);
      setIsTyping(true);

      const context = contentText
        ? 'Contenido del documento (pp. ' + pageFrom + '-' + pageTo + '):\n\n' + contentText
        : 'Documento: ' + fileName + ', analizando páginas ' + pageFrom + ' a ' + pageTo + '.';

      const systemPrompt =
        'Eres StudIO, un asistente de estudio. Responde de forma clara y útil basándote en el contenido proporcionado. Usa formato simple con listas cuando sea apropiado.';
      const userMsg = context + '\n\nPregunta del estudiante: ' + text;

      const aiResponse = await queryGroq(apiKey, systemPrompt, userMsg);
      setIsTyping(false);

      const html = aiResponse ? formatResponse(aiResponse) : getDemoResponse(text, fileName, pageFrom, pageTo);
      setMessages((prev) => [...prev, { role: 'ai', html }]);
    },
    [apiKey, contentText, fileName, pageFrom, pageTo]
  );

  const generatePlan = useCallback(async () => {
    setIsGeneratingPlan(true);
    const context = contentText ? 'Contenido: ' + contentText.substring(0, 2000) : 'Documento: ' + fileName;
    const systemPrompt =
      'Genera un plan de estudio en formato JSON. Devuelve SOLO un array JSON con objetos que tengan: title, pages, duration (en minutos), objectives (string). Entre 4 y 6 sesiones.';
    const result = await queryGroq(apiKey, systemPrompt, context + '. Páginas ' + pageFrom + ' a ' + pageTo + '.');

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

    const context = contentText ? 'Contenido: ' + contentText.substring(0, 2000) : 'Documento: ' + fileName;
    const systemPrompt =
      'Genera un examen de opción múltiple en formato JSON. Devuelve SOLO un array JSON con 5 objetos, cada uno con: text (pregunta), options (array de 4 strings), correct (indice 0-3 de la respuesta correcta), explanation (breve explicación).';
    const result = await queryGroq(apiKey, systemPrompt, context + '. Páginas ' + pageFrom + ' a ' + pageTo + '.');

    let questions: ExamQuestion[] | null = null;
    if (result) {
      try {
        const match = result.match(/\[[\s\S]*\]/);
        if (match) questions = JSON.parse(match[0]);
      } catch {}
    }

    setExamQuestions(questions || DEMO_QUESTIONS);
    setExamSeconds(0);
    stopExamTimer();
    examTimerRef.current = setInterval(() => {
      setExamSeconds((s) => s + 1);
    }, 1000);
    setIsGeneratingExam(false);
  }, [apiKey, contentText, fileName, pageFrom, pageTo, stopExamTimer]);

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
