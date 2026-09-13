"""Derovia — serveur de développement.

Reproduit en local ce que Netlify fait en production : sert les fichiers
statiques de `public/` et intercepte l'envoi du questionnaire.

    POST /   reçoit le besoin qualifié au format formulaire et l'ajoute
             à `leads.jsonl` (en production : Netlify Forms)

Usage :
    python server.py

Configuration (variables d'environnement, ou fichier `.env` à la racine) :
    PORT  port d'écoute (8001 par défaut)
"""

from __future__ import annotations

import json
import os
import re
import sys
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

# Netlify intercepte les envois de formulaire postés à la racine du site.
LEADS_PATH = "/"

# Garde-fou : une requête légitime pèse quelques kilo-octets.
MAX_REQUEST_BYTES = 256 * 1024

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
    """Fichiers statiques en GET, questionnaire en POST."""

    def do_POST(self) -> None:  # noqa: N802 (nom imposé par BaseHTTPRequestHandler)
        if self.path != LEADS_PATH:
            self.send_error(404, "Endpoint inconnu")
            return

        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > MAX_REQUEST_BYTES:
            self._send_json(413, {"error": "Corps de requête absent ou trop volumineux"})
            return

        self._handle_lead(self.rfile.read(length))

    def _handle_lead(self, payload: bytes) -> None:
        fields = parse_qs(payload.decode("utf-8", errors="replace"), keep_blank_values=True)
        reponses = {cle: valeurs[0].strip() for cle, valeurs in fields.items()}

        if not EMAIL_PATTERN.match(reponses.get("email", "")):
            self._send_json(400, {"error": "Adresse électronique invalide"})
            return

        # Aucune liste de champs n'est tenue ici : le questionnaire vit dans
        # FORM_STEPS (config.js), et ce relevé prend ce qui arrive. Ajouter une
        # question ne demande donc rien de ce côté.
        record = {
            "received_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            **{cle: valeur for cle, valeur in reponses.items() if cle != "form-name"},
        }

        try:
            with leads_lock, LEADS_FILE.open("a", encoding="utf-8") as handle:
                handle.write(json.dumps(record, ensure_ascii=False) + "\n")
        except OSError as error:
            self._send_json(500, {"error": f"Enregistrement impossible : {error}"})
            return

        print(f"Nouveau besoin qualifié : {reponses['email']}")
        self._send_json(201, {"ok": True})

    # -- Utilitaires ---------------------------------------------------------

    def _send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
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

    if not PUBLIC_DIR.is_dir():
        print(f"Erreur : dossier introuvable — {PUBLIC_DIR}", file=sys.stderr)
        return 1

    port = int(os.environ.get("PORT", "8001"))
    handler = partial(DeroviaHandler, directory=str(PUBLIC_DIR))

    ThreadingHTTPServer.allow_reuse_address = True
    with ThreadingHTTPServer(("", port), handler) as server:
        print(f"Derovia — http://localhost:{port}  (Ctrl+C pour arrêter)")
        print(f"Besoins qualifiés enregistrés dans {LEADS_FILE.name}")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nArrêt.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
