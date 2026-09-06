/**
 * Derovia — Proxy vers l'API Groq (fonction Netlify).
 *
 * La clé d'API est lue dans les variables d'environnement du site Netlify et
 * n'est jamais transmise au navigateur : celui-ci n'appelle que `/api/groq`.
 *
 * Équivalent en développement local : la route `/api/groq` de `server.py`.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/** Garde-fou : une requête légitime pèse quelques kilo-octets. */
const MAX_REQUEST_BYTES = 256 * 1024;

const json = (payload, status) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export default async (request) => {
  if (request.method !== 'POST') {
    return json({ error: 'Méthode non autorisée' }, 405);
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    // Sur Netlify : Site configuration → Environment variables.
    return json({ error: 'GROQ_API_KEY absente de la configuration du site' }, 500);
  }

  const body = await request.text();
  if (!body || body.length > MAX_REQUEST_BYTES) {
    return json({ error: 'Corps de requête absent ou trop volumineux' }, 413);
  }

  try {
    const upstream = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'derovia-site/1.0',
      },
      body,
    });

    // L'API renvoie déjà un corps JSON, succès comme erreur : on le transmet tel quel.
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return json({ error: `API Groq injoignable : ${error.message}` }, 502);
  }
};

export const config = { path: '/api/groq' };
