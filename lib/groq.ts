const MODEL = 'llama-3.3-70b-versatile';

export interface GroqResult {
  content: string | null;
  error: string | null;
}

export async function queryGroq(apiKey: string, systemPrompt: string, userMsg: string): Promise<GroqResult> {
  if (!apiKey) return { content: null, error: null };
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMsg },
        ],
        temperature: 0.7,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { content: null, error: data?.error?.message || 'Error de Groq (' + res.status + ').' };
    }
    return { content: data?.choices?.[0]?.message?.content ?? null, error: null };
  } catch {
    return { content: null, error: 'No se pudo conectar con Groq. Revisa tu conexión.' };
  }
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
