# Rapport de configuration Supabase

## Section 1 — Variables attendues

| Variable | Usage | Nécessité |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase web | Obligatoire pour les clients web et middleware |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique `anon`/publishable correspondante | Obligatoire pour les clients web et middleware |
| `NEXT_PUBLIC_SITE_URL` | URL publique du site pour les métadonnées et redirections | Recommandée en Production; le code a des valeurs de repli |
| `VERCEL_URL`, `VERCEL_ENV` | Contexte de déploiement | Variables système fournies par Vercel |
| `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Configuration de l’application mobile Expo | Requises uniquement dans l’environnement mobile |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé Supabase privilégiée côté serveur | Non utilisée par l’application actuelle; ne pas ajouter |

## Section 2 — Variables manquantes

- **Vercel (`job-center/jbc-togo`) :** avant correction, aucune variable de projet n’était déclarée, ce qui expliquait `Missing NEXT_PUBLIC_SUPABASE_URL`. `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont maintenant configurées pour **Production** et **Preview**.
- **Local (`.env.local`) :** les valeurs de `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et `NEXT_PUBLIC_SITE_URL` sont présentes. La valeur de la clé n’est pas reproduite dans ce rapport.
- **`SUPABASE_SERVICE_ROLE_KEY` :** absente, mais ce n’est pas une variable manquante pour l’application web actuelle.
- **Mobile :** `mobile/.env.example` documente les deux noms Expo; configurez-les dans l’environnement mobile si l’application mobile est utilisée.

## Section 3 — Fichiers utilisant ces variables

**Lecture directe des variables d’environnement**

- `lib/supabase/env.ts` — lit les deux variables Supabase web et `NEXT_PUBLIC_SITE_URL`.
- `app/layout.tsx`, `app/robots.ts` — lisent `NEXT_PUBLIC_SITE_URL` et `VERCEL_URL`.
- `mobile/src/lib/supabase.ts` — lit les deux variables `EXPO_PUBLIC_*`.

**Clients Supabase et authentification web**

- Création des clients : `lib/supabase/client.ts`, `lib/supabase/server.ts`, `middleware.ts`.
- Utilisation directe des factories : `app/actions/auth.ts`, `app/actions/candidate.ts`, `app/auth/callback/route.ts`, `app/emplois/page.tsx`, `app/emplois/[slug]/page.tsx`, `lib/auth/roles.ts`, `components/candidate/candidate-avatar-upload.tsx`, `components/candidate/resume-replace.tsx`, `components/candidate/resume-upload.tsx`, `components/company/company-logo-upload.tsx`, `components/notifications/notification-realtime-provider.tsx`.
- Déclarations et documentation : `.env.local`, `.env.example`, `.github/workflows/ci.yml`, `mobile/.env.example`, `README.md`, `mobile/README.md`.

## Section 4 — Corrections appliquées

- Aucun nom erroné ou changement de nom Supabase n’a été trouvé dans le code web. Le code historique de la configuration de production utilisait déjà `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Le mobile utilise correctement le préfixe Expo distinct `EXPO_PUBLIC_*`; ne le remplacez pas par le préfixe Next.js.
- `middleware.ts` lit la même configuration web que les clients serveur et utilise `@supabase/ssr` avec les cookies Next.js. Aucun recours à la clé `service_role` n’est nécessaire.
- Le code distingue déjà les erreurs de configuration en signalant le nom exact de la variable Supabase manquante.
- Les deux variables publiques ont été ajoutées aux paramètres du projet Vercel pour **Production** et **Preview**, avec leurs valeurs locales correspondantes. Aucun nom de variable du dépôt n’avait à être corrigé.
- Après l’ajout des variables, un redéploiement Production du commit courant `bdf77ef` a été lancé et terminé avec le statut **Ready**. Le domaine de production `https://jbc-togo.vercel.app` lui est assigné.

## Section 5 — Valeurs à créer dans Vercel

Les variables suivantes sont désormais présentes dans **Vercel → Project → Settings → Environment Variables** pour **Production** et **Preview** :

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://amymbyyztdfzmkphemks.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<clé publishable de .env.local, déjà enregistrée dans Vercel>
SUPABASE_SERVICE_ROLE_KEY=<ne pas créer; non utilisée par l’application>
```

La valeur de `NEXT_PUBLIC_SUPABASE_ANON_KEY` doit être copiée depuis `.env.local` (ou depuis **Supabase → Project Settings → API Keys**, pour le même projet). Elle n’est volontairement pas incluse ici. N’utilisez que la clé publique `anon`/publishable; ne placez jamais une clé `service_role` dans une variable `NEXT_PUBLIC_*`.

Il est recommandé de définir également `NEXT_PUBLIC_SITE_URL` sur le domaine de production du projet. **Redéployez** pour que les variables prennent effet : elles ne modifient pas un déploiement déjà créé.
