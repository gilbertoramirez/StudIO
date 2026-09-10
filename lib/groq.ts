const MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.1-8b-instant'];
const REQUEST_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function describeNetworkError(e: unknown): string {
  if (e instanceof DOMException && e.name === 'AbortError') {
    return 'Groq no respondió a tiempo (más de ' + REQUEST_TIMEOUT_MS / 1000 + 's). Revisa tu conexión.';
  }
  return 'No se pudo conectar con Groq. Revisa tu conexión o si un bloqueador de anuncios/privacidad está interfiriendo con api.groq.com.';
}

export interface GroqResult {
  content: string | null;
  error: string | null;
}

export async function queryGroq(apiKey: string, systemPrompt: string, userMsg: string, maxTokens = 3000): Promise<GroqResult> {
  if (!apiKey) return { content: null, error: null };

  let lastError: string | null = null;

  for (const model of MODELS) {
    try {
      const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
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
          max_tokens: maxTokens,
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
    } catch (e) {
      lastError = describeNetworkError(e);
      break;
    }
  }

  return { content: null, error: lastError };
}

export type ApiKeyCheckStatus = 'valid' | 'invalid' | 'unverified';

export async function verifyGroqApiKey(apiKey: string): Promise<{ status: ApiKeyCheckStatus; error: string | null }> {
  if (!apiKey) return { status: 'invalid', error: 'Ingresa una API key.' };
  try {
    const res = await fetchWithTimeout('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: 'Bearer ' + apiKey },
    });
    if (res.ok) return { status: 'valid', error: null };
    const data = await res.json().catch(() => null);
    return { status: 'invalid', error: data?.error?.message || 'La API key no es válida (' + res.status + ').' };
  } catch (e) {
    // A network-level failure (timeout, CORS, blocked by an extension) doesn't
    // mean the key itself is wrong — save it and let the user try using it.
    return { status: 'unverified', error: describeNetworkError(e) };
  }
}
