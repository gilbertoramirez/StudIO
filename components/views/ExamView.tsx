'use client';

import { useStudio } from '@/context/StudioContext';

const LETTERS = ['A', 'B', 'C', 'D'];

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
    generateExam,
    selectOption,
    submitExam,
    setTab,
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

  return (
    <section className="view active" id="view-examen">
      <div id="examMain">
        <div className="exam-header">
          <h2>Examen de simulación</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
