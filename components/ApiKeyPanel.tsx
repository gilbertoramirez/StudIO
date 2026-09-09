'use client';

import { useEffect, useState } from 'react';
import { useStudio } from '@/context/StudioContext';

export default function ApiKeyPanel() {
  const { apiKey, apiKeyStatus, apiKeyError, saveApiKey } = useStudio();
  const [apiInput, setApiInput] = useState(apiKey);

  useEffect(() => {
    setApiInput(apiKey);
  }, [apiKey]);

  return (
    <div>
      <div className="api-row">
        <input
          type="password"
          placeholder="gsk_xxxxxxxxxxxxxxxx"
          autoComplete="off"
          value={apiInput}
          onChange={(e) => setApiInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveApiKey(apiInput.trim());
          }}
        />
        <button className="btn btn-sm btn-primary" onClick={() => saveApiKey(apiInput.trim())} disabled={apiKeyStatus === 'checking'}>
          {apiKeyStatus === 'checking' ? 'Verificando...' : 'Guardar'}
        </button>
      </div>

      {apiKeyStatus === 'valid' && (
        <div className="content-hint" style={{ marginTop: 8, color: 'var(--success)' }}>
          ✓ Conectado correctamente a Groq.
        </div>
      )}
      {apiKeyStatus === 'invalid' && (
        <div className="content-hint" style={{ marginTop: 8, color: 'var(--danger)' }}>
          ✗ No se pudo validar la API key{apiKeyError ? ': ' + apiKeyError : '.'}
        </div>
      )}
      {apiKeyStatus === 'unverified' && (
        <div className="content-hint" style={{ marginTop: 8, color: 'var(--accent)' }}>
          ⚠ No se pudo confirmar la conexión, pero la key se guardó y se usará al generar contenido.{apiKeyError ? ' ' + apiKeyError : ''}
        </div>
      )}

      <div className="content-hint" style={{ marginTop: 8 }}>
        Tu API key se guarda localmente en el navegador. Nunca se envía a terceros.
      </div>
    </div>
  );
}
