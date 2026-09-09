'use client';

import { useStudio } from '@/context/StudioContext';
import type { Tab } from '@/types/studio';

const TABS: { id: Tab; label: string }[] = [
  { id: 'documento', label: 'Documento' },
  { id: 'chat', label: 'Conversación' },
  { id: 'plan', label: 'Plan de estudio' },
  { id: 'examen', label: 'Examen' },
];

export default function Tabs() {
  const { tab, setTab } = useStudio();

  return (
    <nav className="tabs" role="tablist">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={'tab' + (tab === t.id ? ' active' : '')}
          role="tab"
          aria-selected={tab === t.id}
          onClick={() => setTab(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
