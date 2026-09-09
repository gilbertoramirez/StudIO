export type Tab = 'documento' | 'chat' | 'plan' | 'examen';

export type Theme = 'light' | 'dark';

export interface ChatMessage {
  role: 'user' | 'ai';
  html: string;
}

export interface PlanSession {
  title: string;
  pages: string;
  duration: number;
  objectives: string;
}

export interface ExamQuestion {
  text: string;
  options: string[];
  correct: number;
  explanation: string;
}
