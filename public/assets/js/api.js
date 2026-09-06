/**
 * Derovia — Accès réseau
 *
 * Deux appels : l'un interroge le modèle à travers un proxy qui détient la clé
 * d'API, l'autre transmet le besoin qualifié. En production, le proxy est une
 * fonction Netlify et la transmission passe par Netlify Forms ; en local,
 * `server.py` assure les deux.
 */

import {
  API_ENDPOINT,
  LEADS_ENDPOINT,
  LEADS_FORM_NAME,
  MODEL,
  MODEL_RETRIES,
  MODEL_RETRY_DELAY,
} from './config.js';

/** Réponse attendue du modèle, une fois validée. */
const EMPTY_REPLY = { message: '', suggestions: [], done: false, summary: null };

/**
 * Interroge le modèle et renvoie sa réponse structurée.
 * @param {Array<{role: string, content: string}>} messages Conversation complète.
 * @returns {Promise<typeof EMPTY_REPLY>}
 */
export async function askModel(messages) {
  let lastError;

  for (let attempt = 0; attempt <= MODEL_RETRIES; attempt += 1) {
    if (attempt > 0) await wait(MODEL_RETRY_DELAY);

    try {
      return await requestReply(messages);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Une tentative unique : la reprise sur échec est gérée par `askModel`. */
async function requestReply(messages) {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL.name,
      messages,
      temperature: MODEL.temperature,
      max_tokens: MODEL.maxTokens,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) throw new Error(`Réponse ${response.status} du proxy Groq`);

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error('Réponse du modèle vide');

  return normalizeReply(parseJson(raw));
}

/**
 * Transmet le besoin qualifié. L'envoi est encodé comme un formulaire : c'est le
 * format attendu par Netlify Forms en production, et par `server.py` en local.
 * @param {{email: string, company: string, summary: object, conversation: Array}} lead
 */
export async function submitLead(lead) {
  const body = new URLSearchParams({
    'form-name': LEADS_FORM_NAME,
    email: lead.email,
    company: lead.company ?? '',
    // Les champs de formulaire sont des chaînes : la structure est sérialisée.
    summary: JSON.stringify(lead.summary ?? null),
    conversation: JSON.stringify(lead.conversation ?? []),
  });

  const response = await fetch(LEADS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) throw new Error(`Réponse ${response.status} lors de la transmission`);
}

/**
 * Le mode JSON du modèle est fiable, mais une réponse encadrée d'un bloc de code
 * ou précédée d'un préambule reste possible : on récupère le premier objet.
 */
function parseJson(raw) {
  const cleaned = raw.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end <= start) throw new Error('Réponse du modèle illisible');
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

/** Garantit la forme attendue quelle que soit la fantaisie du modèle. */
function normalizeReply(reply) {
  const message = typeof reply?.message === 'string' ? reply.message.trim() : '';
  if (!message) throw new Error('Réponse du modèle sans message');

  const suggestions = Array.isArray(reply.suggestions)
    ? reply.suggestions.filter((item) => typeof item === 'string' && item.trim()).slice(0, 4)
    : [];

  const done = reply.done === true;

  return {
    ...EMPTY_REPLY,
    message,
    // Une fois la synthèse atteinte, plus rien à proposer : on force la sortie.
    suggestions: done ? [] : suggestions,
    done,
    summary: done && reply.summary && typeof reply.summary === 'object' ? reply.summary : null,
  };
}
