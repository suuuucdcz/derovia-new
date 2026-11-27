/* ==========================================================================
   Derovia — Relais serveur Netlify Forms -> Derovia OS (/leads + alerte Slack)
   Déclenché automatiquement par l'événement plateforme vérifié `formSubmitted`.
   ========================================================================== */

const DEFAULT_WEBHOOK_URL = "https://app.derovia.fr/api/webhooks/netlify-forms";

function cleanField(value, maxLen = 1500) {
  return typeof value === "string" ? value.trim().slice(0, maxLen) : "";
}

export default {
  async formSubmitted(event) {
    const secret = Netlify.env.get("DEROVIA_OS_WEBHOOK_SECRET")?.trim();
    const endpoint =
      Netlify.env.get("DEROVIA_OS_WEBHOOK_URL")?.trim() || DEFAULT_WEBHOOK_URL;

    if (!secret) {
      console.error("[derovia] DEROVIA_OS_WEBHOOK_SECRET manquant.");
      return;
    }

    const d = event?.data && typeof event.data === "object" ? event.data : {};
    const email = cleanField(d.email, 160);
    if (!email) return;

    const formName = cleanField(d["form-name"], 60) || "besoin";
    const submissionId =
      typeof event?.id === "string" && event.id.trim()
        ? event.id.trim()
        : undefined;

    const payload = {
      ...(submissionId ? { id: submissionId } : {}),
      form_name: formName,
      data: {
        nom: cleanField(d.nom, 120),
        email,
        telephone: cleanField(d.telephone, 30),
        metier: cleanField(d.metier, 100),
        formule: cleanField(d.formule, 80),
        taches: cleanField(d.taches, 240),
        message: cleanField(d.message, 1500),
      },
    };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Derovia-Webhook-Secret": secret,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        console.error(
          `[derovia] Échec transfert lead vers Derovia OS : HTTP ${res.status}`
        );
      }
    } catch (err) {
      console.error("[derovia] Erreur réseau transfert lead :", err);
    }
  },
};
