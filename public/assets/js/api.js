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
  MODEL_RETRY_MAX_DELAY,
  SUMMARY_FIELDS,
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
    if (attempt > 0) await wait(lastError?.attenteMs ?? MODEL_RETRY_DELAY);

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

  if (!response.ok) {
    const erreur = new Error(`Réponse ${response.status} du proxy Groq`);
    erreur.attenteMs = attenteApres(response.status, await response.text().catch(() => ''));
    throw erreur;
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error('Réponse du modèle vide');

  return normalizeReply(parseJson(raw));
}

/**
 * Transmet le besoin qualifié. L'envoi est encodé comme un formulaire : c'est le
 * format attendu par Netlify Forms en production, et par `server.py` en local.
 *
 * Chaque information part dans son propre champ, en texte lisible. Le courriel
 * de notification devient ainsi une fiche qu'on lit d'un coup d'œil sur un
 * téléphone, au lieu d'un bloc JSON à déplier.
 *
 * @param {{email: string, company: string, summary: object, conversation: Array}} lead
 */
export async function submitLead(lead) {
  const body = new URLSearchParams({
    'form-name': LEADS_FORM_NAME,
    // Netlify reprend ce champ comme objet du courriel de notification.
    subject: sujet(lead),
    email: lead.email,
    company: lead.company ?? '',
    echange: transcrire(lead.conversation ?? []),
  });

  // Un champ par ligne de la synthèse. Ajouter une entrée à SUMMARY_FIELDS
  // suffit ici, mais il faut aussi la déclarer dans le formulaire caché
  // d'index.html : Netlify n'enregistre que les champs qu'il a vus au
  // déploiement.
  for (const { key } of SUMMARY_FIELDS) {
    body.set(key, lisible(lead.summary?.[key]));
  }

  const response = await fetch(LEADS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) throw new Error(`Réponse ${response.status} lors de la transmission`);
}

/** Une valeur de synthèse est un texte ou une liste ; les deux se lisent. */
const lisible = (valeur) =>
  Array.isArray(valeur) ? valeur.join(' · ') : String(valeur ?? '').trim();

/** Objet du courriel : le métier et l'adresse suffisent à trier une boîte. */
function sujet(lead) {
  const metier = lisible(lead.summary?.metier) || 'Nouveau besoin';
  return `Derovia — ${metier} — ${lead.email}`;
}

const INTERLOCUTEURS = { user: 'Prospect', assistant: 'Derovia' };

/**
 * Rend l'échange sous forme de dialogue, lisible dans un courriel. La
 * conversation ne contient plus que du texte : le modèle n'y reçoit que ses
 * propres messages, plus les objets JSON qu'il avait produits.
 */
function transcrire(conversation) {
  return conversation
    .map((entree) => `${INTERLOCUTEURS[entree.role] ?? entree.role} : ${entree.content}`)
    .join('\n\n');
}

/**
 * Combien attendre avant de reprendre. Le palier gratuit de Groq compte les
 * jetons par minute ; quand il est dépassé, il dit précisément dans combien de
 * temps réessayer. Autant le croire plutôt que de deviner : 700 ms n'ont
 * jamais suffi à franchir une fenêtre qui se libère au bout de sept secondes.
 */
function attenteApres(statut, corps) {
  if (statut !== 429) return MODEL_RETRY_DELAY;

  const secondes = Number(corps.match(/try again in ([\d.]+)s/i)?.[1]);
  if (!Number.isFinite(secondes)) return MODEL_RETRY_DELAY;

  // La marge absorbe l'imprécision entre le moment du refus et celui de la reprise.
  return Math.min(Math.ceil(secondes * 1000) + 400, MODEL_RETRY_MAX_DELAY);
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
