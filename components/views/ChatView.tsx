'use client';

import { useEffect, useRef, useState } from 'react';
import { useStudio } from '@/context/StudioContext';

const SUGGESTIONS = [
  '¿Cuáles son los conceptos clave?',
  'Resume las páginas seleccionadas',
  '¿Qué debería estudiar primero?',
  'Genera preguntas de repaso',
];

export default function ChatView() {
  const { hasFile, apiKey, messages, isTyping, sendMessage, setTab } = useStudio();
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  function handleSend(text: string) {
    if (!text.trim()) return;
    setShowSuggestions(false);
    setInput('');
    void sendMessage(text);
  }

  return (
    <section className="view active" id="view-chat">
      {!hasFile && (
        <div id="chatEmpty" className="empty">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <p>
            Sube un documento en la pestaña <strong>Documento</strong> para empezar a conversar con su contenido.
          </p>
          <button className="btn btn-primary" onClick={() => setTab('documento')}>
            Ir a Documento
          </button>
        </div>
      )}

      {hasFile && (
        <div id="chatMain">
          {!apiKey && (
            <div className="demo-banner" id="demoBanner">
              Modo demo — conecta tu API key de Groq para respuestas reales
            </div>
          )}
          <div className="chat-container">
            <div className="messages" id="messages" ref={messagesRef}>
              {messages.map((m, i) => (
                <div key={i} className={'msg msg-' + m.role}>
                  <div className="msg-avatar">{m.role === 'user' ? 'Tú' : 'IO'}</div>
                  <div className="msg-bubble" dangerouslySetInnerHTML={{ __html: m.html }} />
                </div>
              ))}
              {isTyping && (
                <div className="msg msg-ai" id="typing">
                  <div className="msg-avatar">IO</div>
                  <div className="msg-bubble msg-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
            </div>

            {showSuggestions && (
              <div className="suggestions" id="suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="suggestion" onClick={() => handleSend(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="chat-input">
              <input
                type="text"
                id="chatInput"
                placeholder="Escribe tu pregunta..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend(input);
                }}
              />
              <button className="btn btn-primary" onClick={() => handleSend(input)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
