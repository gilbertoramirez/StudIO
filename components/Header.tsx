'use client';

import { useEffect, useRef, useState } from 'react';
import { useStudio } from '@/context/StudioContext';
import ApiKeyPanel from '@/components/ApiKeyPanel';

export default function Header() {
  const { theme, toggleTheme, apiKeyStatus } = useStudio();
  const [apiOpen, setApiOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!apiOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setApiOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [apiOpen]);

  const keyColor = apiKeyStatus === 'valid' ? 'var(--success)' : apiKeyStatus === 'invalid' ? 'var(--danger)' : undefined;

  return (
    <header className="header">
      <div className="logo">
        Stud<b>IO</b>
      </div>
      <div className="header-actions" style={{ position: 'relative' }} ref={panelRef}>
        <button
          className="icon-btn"
          id="apiKeyBtn"
          title="Configurar API de Groq"
          aria-label="Configurar API de Groq"
          style={{ color: keyColor }}
          onClick={() => setApiOpen((v) => !v)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="8" cy="15" r="4" />
            <line x1="10.85" y1="12.15" x2="19" y2="4" />
            <line x1="18" y1="5" x2="20" y2="7" />
            <line x1="15" y1="8" x2="17" y2="10" />
          </svg>
        </button>
        <button
          className="icon-btn"
          id="themeBtn"
          title="Cambiar tema"
          aria-label="Cambiar tema"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </button>

        {apiOpen && (
          <div className="card" style={{ position: 'absolute', top: 44, right: 0, width: 280, zIndex: 20 }}>
            <div className="card-title" style={{ fontSize: '.95rem' }}>
              API de Groq
            </div>
            <ApiKeyPanel />
          </div>
        )}
      </div>
    </header>
  );
}
