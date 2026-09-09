const MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.1-8b-instant'];

export interface GroqResult {
  content: string | null;
  error: string | null;
}

export async function queryGroq(apiKey: string, systemPrompt: string, userMsg: string): Promise<GroqResult> {
  if (!apiKey) return { content: null, error: null };

  let lastError: string | null = null;

  for (const model of MODELS) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMsg },
          ],
          temperature: 0.7,
        }),
      });
      const data = await res.json().catch(() => null);

      if (res.ok) {
        return { content: data?.choices?.[0]?.message?.content ?? null, error: null };
      }

      lastError = data?.error?.message || 'Error de Groq (' + res.status + ').';
      // A model-not-found/decommissioned response is worth retrying with the next
      // model in the list; anything else (auth, rate limit, etc.) applies to every model.
      if (res.status !== 400 && res.status !== 404) break;
    } catch {
      lastError = 'No se pudo conectar con Groq. Revisa tu conexión.';
      break;
    }
  }

  return { content: null, error: lastError };
}

export async function verifyGroqApiKey(apiKey: string): Promise<{ ok: boolean; error: string | null }> {
  if (!apiKey) return { ok: false, error: 'Ingresa una API key.' };
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: 'Bearer ' + apiKey },
    });
    if (res.ok) return { ok: true, error: null };
    const data = await res.json().catch(() => null);
    return { ok: false, error: data?.error?.message || 'La API key no es válida (' + res.status + ').' };
  } catch {
    return { ok: false, error: 'No se pudo conectar con Groq. Revisa tu conexión.' };
  }
}
