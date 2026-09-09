import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StudIO — Asistente de Estudio con IA',
  description: 'Sube un PDF y estudia con un asistente de IA: chat, plan de estudio y exámenes de simulación.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
