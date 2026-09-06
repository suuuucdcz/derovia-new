/**
 * Derovia — Parcours de qualification
 *
 * Quatre phases successives, portées par `data-phase` sur le conteneur :
 *   intro   → la question d'accroche et les métiers proposés
 *   chat    → l'échange avec le modèle, une question à la fois
 *   summary → la synthèse relue par le prospect, puis ses coordonnées
 *   sent    → la confirmation
 */

import { askModel, submitLead } from './api.js';
import {
  CLOSING_INSTRUCTION,
  MAX_TURNS,
  OPENING_QUESTION,
  SUMMARY_FIELDS,
  SYSTEM_PROMPT,
  TEXTAREA_MAX_HEIGHT,
  TIMING,
  TRADE_SUGGESTIONS,
} from './config.js';

const LOADING_CLASS = 'is-loading';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function createSurvey() {
  const root = document.getElementById('survey');
  if (!root) return null;

  const el = {
    heading: document.getElementById('typewriter-text'),
    caret: document.getElementById('survey-caret'),
    step: document.getElementById('survey-step'),
    progress: document.getElementById('survey-progress-fill'),
    history: document.getElementById('chat-history'),
    suggestions: document.getElementById('suggestions'),
    input: document.getElementById('needs-input'),
    submit: document.getElementById('btn-analyze'),
    summaryForm: document.getElementById('summary-form'),
    summaryFields: document.getElementById('summary-fields'),
    email: document.getElementById('lead-email'),
    company: document.getElementById('lead-company'),
    leadError: document.getElementById('lead-error'),
    leadSubmit: document.getElementById('btn-send-lead'),
  };

  if (Object.values(el).some((node) => !node)) {
    console.error('Derovia : structure du parcours incomplète.');
    return null;
  }

  const loader = el.history.querySelector('.chat-loading');
  const typewriter = createTypewriter(el.heading, OPENING_QUESTION, el.caret);

  let conversation = [{ role: 'system', content: SYSTEM_PROMPT }];
  let turn = 0;
  let summary = null;
  let busy = false;

  /* ----------------------------------------------------------------------
     Affichage
     ---------------------------------------------------------------------- */

  const setPhase = (phase) => {
    root.dataset.phase = phase;
  };

  const setProgress = () => {
    const done = Math.min(turn, MAX_TURNS);
    el.progress.style.width = `${(done / MAX_TURNS) * 100}%`;
    el.step.textContent =
      done >= MAX_TURNS ? 'Synthèse' : `Étape ${done + 1} sur ${MAX_TURNS}`;
  };

  /** Le texte du prospect est inséré comme texte, jamais comme balisage. */
  const appendMessage = (text, role) => {
    const message = document.createElement('div');
    message.className = `chat-message ${role === 'user' ? 'user-message' : 'ai-message'}`;

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = text;

    message.append(bubble);
    el.history.insertBefore(message, loader);
    el.history.scrollTop = el.history.scrollHeight;
  };

  const renderSuggestions = (items) => {
    el.suggestions.replaceChildren();

    for (const item of items) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = item;
      chip.addEventListener('click', () => send(item));
      el.suggestions.append(chip);
    }
  };

  const renderSummary = (data) => {
    el.summaryFields.replaceChildren();

    for (const { key, label } of SUMMARY_FIELDS) {
      const value = data?.[key];
      const text = Array.isArray(value) ? value.join(' · ') : value;
      if (!text) continue;

      const term = document.createElement('dt');
      term.textContent = label;

      const detail = document.createElement('dd');
      detail.dataset.key = key;
      detail.textContent = String(text);

      el.summaryFields.append(term, detail);
    }
  };

  const setBusy = (value) => {
    busy = value;
    el.history.classList.toggle(LOADING_CLASS, value);
    el.input.disabled = value;
    el.submit.disabled = value || el.input.value.trim().length === 0;
    el.suggestions.toggleAttribute('inert', value);
  };

  /** Ajuste la hauteur du champ à son contenu et l'état du bouton d'envoi. */
  const syncInput = () => {
    el.submit.disabled = busy || el.input.value.trim().length === 0;
    el.input.style.height = 'auto';
    el.input.style.height = `${Math.min(el.input.scrollHeight, TEXTAREA_MAX_HEIGHT)}px`;
  };

  /* ----------------------------------------------------------------------
     Échanges
     ---------------------------------------------------------------------- */

  const send = async (text) => {
    const answer = text.trim();
    if (!answer || busy) return;

    if (turn === 0) setPhase('chat');
    appendMessage(answer, 'user');
    conversation.push({ role: 'user', content: answer });
    turn += 1;

    el.input.value = '';
    syncInput();
    renderSuggestions([]);
    setBusy(true);
    setProgress();
    el.history.scrollTop = el.history.scrollHeight;

    // Au dernier tour, on demande explicitement la conclusion.
    const messages =
      turn >= MAX_TURNS
        ? [...conversation, { role: 'system', content: CLOSING_INSTRUCTION }]
        : conversation;

    try {
      const reply = await askModel(messages);
      conversation.push({ role: 'assistant', content: JSON.stringify(reply) });

      appendMessage(reply.message, 'assistant');

      if (reply.done) {
        summary = reply.summary;
        renderSummary(summary);
        turn = MAX_TURNS;
        setProgress();
        setPhase('summary');
        el.email.focus({ preventScroll: true });
      } else {
        renderSuggestions(reply.suggestions);
      }
    } catch (error) {
      console.error('Derovia : échec de la requête au modèle.', error);
      // La question est retirée de l'historique et rendue au prospect.
      conversation.pop();
      turn -= 1;
      setProgress();
      el.input.value = answer;
      appendMessage('Une erreur est survenue. Vous pouvez renvoyer votre réponse.', 'assistant');
    } finally {
      setBusy(false);
      syncInput();
    }
  };

  /* ----------------------------------------------------------------------
     Transmission du besoin
     ---------------------------------------------------------------------- */

  const sendLead = async (event) => {
    event.preventDefault();

    const email = el.email.value.trim();
    if (!EMAIL_PATTERN.test(email)) {
      showLeadError('Merci d’indiquer une adresse professionnelle valide.');
      return;
    }

    showLeadError(null);
    el.leadSubmit.disabled = true;
    el.leadSubmit.dataset.label = el.leadSubmit.textContent;
    el.leadSubmit.textContent = 'Transmission…';

    try {
      await submitLead({
        email,
        company: el.company.value.trim(),
        summary,
        conversation: conversation.filter((entry) => entry.role !== 'system'),
      });
      setPhase('sent');
    } catch (error) {
      console.error('Derovia : échec de la transmission du besoin.', error);
      showLeadError('La transmission a échoué. Merci de réessayer dans un instant.');
      el.leadSubmit.disabled = false;
      el.leadSubmit.textContent = el.leadSubmit.dataset.label;
    }
  };

  const showLeadError = (message) => {
    el.leadError.textContent = message ?? '';
    el.leadError.hidden = !message;
  };

  /* ----------------------------------------------------------------------
     Cycle de vie
     ---------------------------------------------------------------------- */

  el.input.addEventListener('input', syncInput);

  el.input.addEventListener('keydown', (event) => {
    const isSubmit = event.key === 'Enter' && (event.ctrlKey || event.metaKey || !event.shiftKey);
    if (!isSubmit) return;

    event.preventDefault();
    send(el.input.value);
  });

  el.submit.addEventListener('click', () => send(el.input.value));
  el.summaryForm.addEventListener('submit', sendLead);

  return {
    /** Démarre l'accroche, propose les métiers et donne le focus au champ. */
    start() {
      typewriter.play();
      if (turn === 0) renderSuggestions(TRADE_SUGGESTIONS);
      // `preventScroll` est indispensable : les diapositives sont déplacées par
      // transform, et un défilement automatique vers le champ les décalerait.
      setTimeout(() => el.input.focus({ preventScroll: true }), TIMING.inputFocus);
    },

    /** Remet le parcours à zéro pour une prochaine visite. */
    reset() {
      typewriter.clear();
      setPhase('intro');
      setBusy(false);

      el.history.querySelectorAll('.chat-message').forEach((node) => node.remove());
      el.suggestions.replaceChildren();
      el.summaryFields.replaceChildren();
      showLeadError(null);

      el.input.value = '';
      el.input.style.height = '';
      el.email.value = '';
      el.company.value = '';
      el.leadSubmit.disabled = false;
      if (el.leadSubmit.dataset.label) el.leadSubmit.textContent = el.leadSubmit.dataset.label;

      conversation = [conversation[0]];
      turn = 0;
      summary = null;
      setProgress();
    },
  };
}

/**
 * Affiche un texte caractère par caractère, à un rythme irrégulier.
 * Le curseur disparaît une fois la frappe terminée.
 */
function createTypewriter(target, text, caret) {
  let index = 0;
  let timer = null;

  const typeNext = () => {
    if (index >= text.length) {
      timer = null;
      caret.classList.add('is-done');
      return;
    }

    target.textContent += text.charAt(index);
    index += 1;

    const { typewriterMinDelay: min, typewriterMaxDelay: max } = TIMING;
    timer = setTimeout(typeNext, min + Math.random() * (max - min));
  };

  return {
    /** Sans effet si la frappe est en cours ou déjà terminée. */
    play() {
      if (timer !== null || index > 0) return;

      target.textContent = '';
      caret.classList.remove('is-done');
      timer = setTimeout(typeNext, TIMING.typewriterStart);
    },

    clear() {
      clearTimeout(timer);
      timer = null;
      index = 0;
      target.textContent = '';
      caret.classList.remove('is-done');
    },
  };
}
