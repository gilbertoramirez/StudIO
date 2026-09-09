'use client';

import { useRef, useState } from 'react';
import { useStudio } from '@/context/StudioContext';
import { formatSize } from '@/lib/format';

export default function DocumentView() {
  const {
    hasFile,
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
    setTotalPages,
    setRange,
    setContentText,
    saveApiKey,
  } = useStudio();

  const [dragOver, setDragOver] = useState(false);
  const [apiOpen, setApiOpen] = useState(false);
  const [apiInput, setApiInput] = useState(apiKey);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="view active" id="view-documento">
      {!hasFile && (
        <div
          className={'upload-zone' + (dragOver ? ' dragover' : '')}
          id="uploadZone"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const dropped = e.dataTransfer.files[0];
            if (dropped) handleFile(dropped);
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <polyline points="9 15 12 12 15 15" />
          </svg>
          <p>Arrastra un archivo PDF aquí o haz clic para seleccionar</p>
          <input
            type="file"
            accept=".pdf"
            id="fileInput"
            ref={fileInputRef}
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) handleFile(selected);
            }}
          />
        </div>
      )}

      {hasFile && (
        <div className="file-card" id="fileCard">
          <div className="file-icon">PDF</div>
          <div className="file-meta">
            <div className="file-name" id="fileName">
              {fileName}
            </div>
            <div className="file-size" id="fileSize">
              {formatSize(fileSize)}
            </div>
          </div>
          <button className="file-remove" id="fileRemove" title="Quitar archivo" aria-label="Quitar archivo" onClick={removeFile}>
            &times;
          </button>
        </div>
      )}

      {hasFile && (
        <div id="rangeSection">
          <div className="range-row">
            <div className="range-field">
              <label htmlFor="pageFrom">Desde página</label>
              <input
                type="number"
                id="pageFrom"
                min={1}
                max={totalPages}
                value={pageFrom}
                onChange={(e) => setPageFrom(parseInt(e.target.value, 10) || 1)}
              />
            </div>
            <div className="range-field">
              <label htmlFor="pageTo">Hasta página</label>
              <input
                type="number"
                id="pageTo"
                min={1}
                max={totalPages}
                value={pageTo}
                onChange={(e) => setPageTo(parseInt(e.target.value, 10) || 1)}
              />
            </div>
            <div className="range-field">
              <label>Total</label>
              <input
                type="number"
                id="totalPages"
                min={1}
                value={totalPages}
                style={{ width: 80 }}
                title="Ajusta el total de páginas si la detección no fue precisa"
                onChange={(e) => setTotalPages(parseInt(e.target.value, 10) || 1)}
              />
            </div>
          </div>
          <div className="range-presets">
            <button className="btn btn-sm btn-outline" onClick={() => setRange(1, totalPages)}>
              Todas
            </button>
            <button className="btn btn-sm btn-outline" onClick={() => setRange(1, Math.ceil(totalPages / 2))}>
              Primera mitad
            </button>
            <button className="btn btn-sm btn-outline" onClick={() => setRange(Math.ceil(totalPages / 2) + 1, totalPages)}>
              Segunda mitad
            </button>
          </div>
        </div>
      )}

      {hasFile && (
        <div className="content-area" id="contentSection">
          <label htmlFor="contentText">Contenido para analizar</label>
          <textarea
            id="contentText"
            placeholder="Pega aquí el texto de las páginas seleccionadas para que la IA pueda analizarlo..."
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
          />
          <div className="content-hint">
            Copia el texto relevante de tu PDF y pégalo aquí. Esto permite el análisis incluso sin conexión al API.
          </div>
        </div>
      )}

      <div className="api-section">
        <button className="api-toggle" id="apiToggle" onClick={() => setApiOpen((v) => !v)}>
          <span className={'arrow' + (apiOpen ? ' open' : '')} id="apiArrow">
            &#9654;
          </span>
          Configurar API de Groq
        </button>
        <div className={'api-body' + (apiOpen ? ' open' : '')} id="apiBody">
          <div className="api-row">
            <input
              type="password"
              id="apiKey"
              placeholder="gsk_xxxxxxxxxxxxxxxx"
              autoComplete="off"
              value={apiInput}
              onChange={(e) => setApiInput(e.target.value)}
            />
            <button className="btn btn-sm btn-primary" onClick={() => saveApiKey(apiInput.trim())}>
              Guardar
            </button>
          </div>
          <div className="content-hint" style={{ marginTop: 8 }}>
            Tu API key se guarda localmente en el navegador. Nunca se envía a terceros.
          </div>
        </div>
      </div>
    </section>
  );
}
