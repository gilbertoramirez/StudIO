'use client';

import { useStudio } from '@/context/StudioContext';
import type { ExamDifficulty } from '@/types/studio';

const LETTERS = ['A', 'B', 'C', 'D'];
const QUESTION_COUNT_OPTIONS = [3, 5, 8, 10, 15, 20, 25];
const DIFFICULTY_OPTIONS: { value: ExamDifficulty; label: string }[] = [
  { value: 'facil', label: 'Fácil' },
  { value: 'media', label: 'Media' },
  { value: 'dificil', label: 'Difícil' },
];

function formatTimer(totalSeconds: number): string {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return m + ':' + s;
}

export default function ExamView() {
  const {
    hasFile,
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
    setTab,
    apiKey,
    groqError,
    totalPages,
    pageFrom,
    pageTo,
    setPageFrom,
    setPageTo,
    setRange,
  } = useStudio();

  if (!hasFile) {
    return (
      <section className="view active" id="view-examen">
        <div id="examEmpty" className="empty">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div>
          <p>Sube un documento para generar un examen de simulación con preguntas de opción múltiple.</p>
          <button className="btn btn-primary" onClick={() => setTab('documento')}>
            Ir a Documento
          </button>
        </div>
      </section>
    );
  }

  const correct = examSubmitted && examQuestions ? examQuestions.filter((q, i) => examAnswers[i] === q.correct).length : 0;
  const pct = examSubmitted && examQuestions ? Math.round((correct / examQuestions.length) * 100) : 0;

  const failedTopics =
    examSubmitted && examQuestions
      ? examQuestions
          .map((q, i) => ({ q, i }))
          .filter(({ q, i }) => examAnswers[i] !== q.correct && (q.pages || q.topic))
          .map(({ q }) => ({ pages: q.pages, topic: q.topic }))
      : [];
  const uniqueFailedTopics = failedTopics.filter(
    (t, i, arr) => arr.findIndex((o) => o.pages === t.pages && o.topic === t.topic) === i
  );

  return (
    <section className="view active" id="view-examen">
      <div id="examMain">
        {!apiKey && (
          <div className="demo-banner">
            Modo demo — usa el ícono de llave 🔑 en la parte superior para conectar tu API key de Groq y generar preguntas reales sobre tu documento
          </div>
        )}
        {apiKey && groqError && examQuestions && (
          <div className="demo-banner" style={{ color: 'var(--danger)' }}>
            Groq no pudo generar el examen ({groqError}). Se muestran preguntas de ejemplo, no del documento.
          </div>
        )}
        <div className="range-row" style={{ marginTop: 0, marginBottom: 16 }}>
          <div className="range-field">
            <label htmlFor="examPageFrom">Desde página</label>
            <input
              type="number"
              id="examPageFrom"
              min={1}
              max={totalPages}
              value={pageFrom}
              disabled={isGeneratingExam}
              onChange={(e) => setPageFrom(parseInt(e.target.value, 10) || 1)}
            />
          </div>
          <div className="range-field">
            <label htmlFor="examPageTo">Hasta página</label>
            <input
              type="number"
              id="examPageTo"
              min={1}
              max={totalPages}
              value={pageTo}
              disabled={isGeneratingExam}
              onChange={(e) => setPageTo(parseInt(e.target.value, 10) || 1)}
            />
          </div>
          <button className="btn btn-sm btn-outline" disabled={isGeneratingExam} onClick={() => setRange(1, totalPages)}>
            Todo el documento
          </button>
        </div>

        <div className="exam-header">
          <h2>
            Examen de simulación <span style={{ color: 'var(--ink-2)', fontWeight: 400, fontSize: '.8rem' }}>(pp. {pageFrom}–{pageTo})</span>
          </h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={examQuestionCount}
              onChange={(e) => setExamQuestionCount(parseInt(e.target.value, 10))}
              disabled={isGeneratingExam}
              title="Cantidad de preguntas"
            >
              {QUESTION_COUNT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} preguntas
                </option>
              ))}
            </select>
            <select
              value={examDifficulty}
              onChange={(e) => setExamDifficulty(e.target.value as ExamDifficulty)}
              disabled={isGeneratingExam}
              title="Dificultad"
            >
              {DIFFICULTY_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <span className="exam-timer" id="examTimer">
              {formatTimer(examSeconds)}
            </span>
            <button className="btn btn-primary" id="examGenBtn" onClick={() => void generateExam()} disabled={isGeneratingExam}>
              {isGeneratingExam ? 'Generando...' : examQuestions ? 'Nuevo examen' : 'Generar examen'}
            </button>
          </div>
        </div>
        <div id="examContent">
          {examSubmitted && examQuestions && (
            <div className="score-card">
              <div className="score-num">{pct}%</div>
              <div className="score-label">
                {correct} de {examQuestions.length} correctas
              </div>
            </div>
          )}

          {examSubmitted && uniqueFailedTopics.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">Dónde repasar</div>
              <div className="options">
                {uniqueFailedTopics.map((t, i) => (
                  <div key={i} className="option" style={{ cursor: 'default' }}>
                    <span className="option-letter">📍</span>
                    {t.topic ? t.topic + ' — ' : ''}
                    {t.pages ? 'página ' + t.pages : 'revisa esta sección'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {examQuestions?.map((q, qi) => (
            <div className="question" key={qi}>
              <div className="question-num">Pregunta {qi + 1}</div>
              <div className="question-text">{q.text}</div>
              <div className="options">
                {q.options.map((opt, oi) => {
                  let cls = 'option';
                  if (examSubmitted) {
                    if (oi === q.correct) cls += ' correct';
                    else if (examAnswers[qi] === oi) cls += ' wrong';
                  } else if (examAnswers[qi] === oi) {
                    cls += ' selected';
                  }
                  return (
                    <div className={cls} key={oi} onClick={examSubmitted ? undefined : () => selectOption(qi, oi)}>
                      <span className="option-letter">{LETTERS[oi]}</span>
                      {opt}
                    </div>
                  );
                })}
              </div>
              {examSubmitted && q.explanation && <div className="explanation visible">{q.explanation}</div>}
              {examSubmitted && examAnswers[qi] !== q.correct && (q.pages || q.topic) && (
                <div className="explanation visible" style={{ color: 'var(--danger)' }}>
                  📍 Repasa esto {q.topic ? 'en "' + q.topic + '"' : ''}
                  {q.pages ? (q.topic ? ', página ' : 'en la página ') + q.pages : ''}.
                </div>
              )}
            </div>
          ))}

          {!examSubmitted && examQuestions && examQuestions.length > 0 && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <button className="btn btn-primary" onClick={submitExam}>
                Calificar examen
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
