"""Derovia — serveur de développement.

Reproduit en local ce que Netlify fait en production. Sert les fichiers
statiques de `public/` et expose deux routes :

    POST /api/groq   relaie la requête vers l'API Groq en y ajoutant la clé
                     d'API côté serveur, qui n'atteint donc jamais le navigateur
                     (en production : netlify/functions/groq.mjs)
    POST /           reçoit le besoin qualifié au format formulaire et l'ajoute
                     à `leads.jsonl` (en production : Netlify Forms)

Usage :
    python server.py

Configuration (variables d'environnement, ou fichier `.env` à la racine) :
    GROQ_API_KEY  clé d'API Groq (obligatoire)
    PORT          port d'écoute (8001 par défaut)
"""

from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Lock
from urllib.parse import parse_qs

ROOT = Path(__file__).resolve().parent
PUBLIC_DIR = ROOT / "public"
ENV_FILE = ROOT / ".env"
LEADS_FILE = ROOT / "leads.jsonl"

GROQ_PATH = "/api/groq"
# Netlify intercepte les envois de formulaire postés à la racine du site.
LEADS_PATH = "/"

# Clés de la synthèse, dans l'ordre de SUMMARY_FIELDS (config.js).
SUMMARY_KEYS = ("metier", "besoins", "volume", "gainTemps", "gainArgent")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

# Garde-fou : une requête légitime pèse quelques kilo-octets.
MAX_REQUEST_BYTES = 256 * 1024
UPSTREAM_TIMEOUT = 60

EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")

# Les écritures viennent de plusieurs fils : une ligne à la fois.
leads_lock = Lock()


def load_env_file(path: Path) -> None:
    """Charge un fichier `.env` simple (KEY=value) sans écraser l'environnement."""
    if not path.is_file():
        return

    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


class DeroviaHandler(SimpleHTTPRequestHandler):
    """Fichiers statiques en GET, API en POST."""

    api_key: str = ""

    def do_POST(self) -> None:  # noqa: N802 (nom imposé par BaseHTTPRequestHandler)
        routes = {GROQ_PATH: self._handle_groq, LEADS_PATH: self._handle_lead}
        handler = routes.get(self.path)

        if handler is None:
            self.send_error(404, "Endpoint inconnu")
            return

        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > MAX_REQUEST_BYTES:
            self._send_json(413, {"error": "Corps de requête absent ou trop volumineux"})
            return

        handler(self.rfile.read(length))

    # -- Proxy vers le modèle ------------------------------------------------

    def _handle_groq(self, payload: bytes) -> None:
        request = urllib.request.Request(
            GROQ_URL,
            data=payload,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                # Le User-Agent par défaut d'urllib est filtré en amont de l'API.
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=UPSTREAM_TIMEOUT) as response:
                self._send_raw_json(response.status, response.read())
        except urllib.error.HTTPError as error:
            # L'API renvoie déjà un corps JSON décrivant l'erreur : on le transmet tel quel.
            self._send_raw_json(error.code, error.read())
        except urllib.error.URLError as error:
            self._send_json(502, {"error": f"API Groq injoignable : {error.reason}"})
        except OSError as error:
            self._send_json(500, {"error": str(error)})

    # -- Enregistrement des besoins qualifiés --------------------------------

    def _handle_lead(self, payload: bytes) -> None:
        fields = parse_qs(payload.decode("utf-8", errors="replace"), keep_blank_values=True)

        def field(name: str) -> str:
            return (fields.get(name) or [""])[0].strip()

        email = field("email")
        if not EMAIL_PATTERN.match(email):
            self._send_json(400, {"error": "Adresse électronique invalide"})
            return

        # Mêmes champs qu'en production : ce que montre `leads.jsonl` est ce
        # que contiendra le courriel de notification envoyé par Netlify.
        record = {
            "received_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "subject": field("subject"),
            "email": email,
            "company": field("company"),
            "synthese": {cle: field(cle) for cle in SUMMARY_KEYS},
            "echange": field("echange"),
        }

        try:
            with leads_lock, LEADS_FILE.open("a", encoding="utf-8") as handle:
                handle.write(json.dumps(record, ensure_ascii=False) + "\n")
        except OSError as error:
            self._send_json(500, {"error": f"Enregistrement impossible : {error}"})
            return

        print(f"Nouveau besoin qualifié : {email}")
        self._send_json(201, {"ok": True})

    # -- Utilitaires ---------------------------------------------------------

    def _send_json(self, status: int, payload: dict) -> None:
        self._send_raw_json(status, json.dumps(payload).encode("utf-8"))

    def _send_raw_json(self, status: int, body: bytes) -> None:
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self) -> None:
        # Les fichiers changent à chaque itération : on évite le cache du navigateur.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main() -> int:
    load_env_file(ENV_FILE)

    api_key = os.environ.get("GROQ_API_KEY", "").strip()
    if not api_key:
        print(
            "Erreur : GROQ_API_KEY est absente.\n"
            "Renseignez-la dans un fichier .env à la racine du projet "
            "(voir .env.example) ou dans vos variables d'environnement.",
            file=sys.stderr,
        )
        return 1

    if not PUBLIC_DIR.is_dir():
        print(f"Erreur : dossier introuvable — {PUBLIC_DIR}", file=sys.stderr)
        return 1

    port = int(os.environ.get("PORT", "8001"))

    DeroviaHandler.api_key = api_key
    handler = partial(DeroviaHandler, directory=str(PUBLIC_DIR))

    ThreadingHTTPServer.allow_reuse_address = True
    with ThreadingHTTPServer(("", port), handler) as server:
        print(f"Derovia — http://localhost:{port}  (Ctrl+C pour arrêter)")
        print(f"Besoins qualifiés enregistrés dans {LEADS_FILE.name}")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nArrêt du serveur.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
