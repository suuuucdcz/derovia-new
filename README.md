# Derovia

Site vitrine statique de **Derovia** ([derovia.fr](https://derovia.fr)) — Intelligence Artificielle & automatisation sur-mesure pour artisans et petites entreprises.

Zéro dépendance, zéro étape de build : le dossier `public/` est publié tel quel sur Netlify.

## Structure

```text
.
├── netlify.toml               # Publication public/, en-têtes sécurité (CSP, HSTS…), cache et redirections
├── .gitignore
└── public/
    ├── index.html             # Page principale
    ├── mentions-legales.html  # Mentions légales (LCEN)
    ├── confidentialite.html   # Politique de confidentialité (RGPD)
    ├── 404.html               # Page d'erreur 404
    ├── favicon.ico            # Favicon multi-tailles (48×48 + 96×96) pour Google Search
    ├── robots.txt
    ├── sitemap.xml
    ├── llms.txt               # Index Markdown pour agents IA (standard llmstxt.org)
    ├── llms-full.txt          # Fiche complète Derovia en Markdown pour agents IA
    ├── .well-known/security.txt
    └── assets/
        ├── favicon.svg        # Monogramme D transparent (navbar)
        ├── icon.svg           # Favicon SVG sur fond clair (onglets clair/sombre)
        ├── favicon-96.png     # Favicon PNG 96×96 (Google Search)
        ├── favicon-192.png    # Icône PNG 192×192 (Android & Schema.org Logo)
        ├── apple-touch-icon.png # Icône iOS 180×180
        ├── og-derovia.png     # Carte OpenGraph / réseaux sociaux (1200×630)
        ├── css/styles.css
        ├── js/app.js
        └── logos/             # 12 logos officiels hébergés localement
```

## Aperçu local

```bash
python -m http.server 8000 --directory public --bind 127.0.0.1
```

Puis ouvrir <http://127.0.0.1:8000>.

## Déploiement & Formulaire (Netlify)

- Chaque push sur `main` déclenche automatiquement la mise à jour de `derovia.fr` sur Netlify (`publish = "public"`).
- Le formulaire de contact utilise **Netlify Forms** sous le nom `besoin` (avec champ honeypot anti-spam `bot-field`), compatible avec les notifications e-mail déjà configurées dans Netlify.
