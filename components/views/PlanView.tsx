'use client';

import { useStudio } from '@/context/StudioContext';

export default function PlanView() {
  const { hasFile, planSessions, planChecked, isGeneratingPlan, generatePlan, toggleSession, setTab } = useStudio();

  if (!hasFile) {
    return (
      <section className="view active" id="view-plan">
        <div id="planEmpty" className="empty">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
          </div>
          <p>Sube un documento para generar un plan de estudio personalizado basado en su contenido.</p>
          <button className="btn btn-primary" onClick={() => setTab('documento')}>
            Ir a Documento
          </button>
        </div>
      </section>
    );
  }

  const totalMin = planSessions?.reduce((s, x) => s + (x.duration || 0), 0) ?? 0;
  const done = planChecked.size;
  const total = planSessions?.length ?? 0;

  return (
    <section className="view active" id="view-plan">
      <div id="planMain">
        <div className="plan-header">
          <h2>Plan de estudio</h2>
          <button className="btn btn-primary" onClick={() => void generatePlan()} disabled={isGeneratingPlan}>
            {isGeneratingPlan ? 'Generando...' : planSessions ? 'Regenerar plan' : 'Generar plan'}
          </button>
        </div>
        <div id="planContent">
          {planSessions && (
            <>
              <div className="plan-stats">
                <span>
                  <b>{total}</b> sesiones
                </span>
                <span>
                  <b>{totalMin}</b> min totales
                </span>
                <span>
                  <b>
                    {done}/{total}
                  </b>{' '}
                  completadas
                </span>
              </div>
              {planSessions.map((s, i) => {
                const checked = planChecked.has(i);
                return (
                  <div className="session-card" key={i}>
                    <div className={'session-check' + (checked ? ' done' : '')} onClick={() => toggleSession(i)}>
                      {checked ? '✓' : ''}
                    </div>
                    <div className="session-body">
                      <div className="session-title">{s.title}</div>
                      <div className="session-desc">{s.objectives}</div>
                      <div className="session-meta">
                        <span>pp. {s.pages}</span>
                        <span>{s.duration} min</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
