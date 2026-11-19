# JOB-CENTER — Authentification

## Installation

1. Copier `.env.example` vers `.env.local` et renseigner l’URL, la clé publique Supabase et l’URL du site.
2. Exécuter les migrations Supabase du dossier `supabase/migrations`.
3. Dans Supabase Auth, activer la confirmation d’adresse e-mail et ajouter les URL de redirection locale et de production, notamment `/auth/callback`.
4. Installer les dépendances puis lancer `npm run dev`.

La clé `service_role` ne doit jamais être ajoutée aux variables `NEXT_PUBLIC_*` ni exposée au navigateur.

## Configuration Supabase appliquée

- `.env.local` est renseigné pour le développement local avec l’URL du projet et une clé publishable. Ce fichier est ignoré par Git.
- Supabase Auth utilise `http://localhost:3000` comme Site URL et autorise `http://localhost:3000/auth/callback`. L’authentification par e-mail et la confirmation d’adresse sont activées.
- La Data API est activée; l’exposition automatique des nouvelles tables est désactivée et l’activation automatique de RLS est activée.
- Les migrations du dossier `supabase/migrations` sont appliquées et suivies dans `supabase_migrations.schema_migrations`. Le bucket CV `candidate-resumes` est privé.
- Avant la mise en production, remplacer l’URL locale par le domaine du site, autoriser son URL `/auth/callback` dans Supabase Auth et configurer un fournisseur SMTP de production sans placer ses identifiants dans le navigateur ou dans Git.

## Parcours et autorisations

- Les profils sont créés par le déclencheur `on_auth_user_created`; le rôle est lu dans les métadonnées Auth et limité à `candidate` ou `company` (les autres valeurs donnent `candidate`). Le rôle `admin` ne peut pas être défini à l’inscription.
- L’inscription entreprise conserve le nom et le slug dans les métadonnées Auth jusqu’à la confirmation de l’adresse. Après confirmation, le callback appelle `create_company`, qui crée l’entreprise, son membership `owner` actif et confirme le rôle `company` dans une même transaction.
- Les données de rôle sont relues côté serveur. Le middleware rafraîchit la session et redirige les accès incompatibles; les layouts vérifient également les rôles.
- Les changements de rôle administrateur doivent être effectués par une opération de confiance (SQL opérateur ou backend avec la clé `service_role`). Aucun client ne peut s’octroyer le rôle administrateur.
- Les invitations d’autres membres d’entreprise doivent être émises par un endpoint serveur de confiance; les clients ne disposent pas du droit d’insérer arbitrairement des appartenances.

## Configuration des e-mails

Configurer les modèles Supabase Auth pour les confirmations et réinitialisations de mot de passe. Les liens utilisent le flux PKCE et sont traités par `/auth/callback`.

## Espace candidat

Le tableau de bord est disponible sous `/candidate` : profil et compétences, CV privés, offres recommandées, candidatures, notifications et paramètres. Les recommandations utilisent les compétences du candidat lorsqu’elles existent, puis complètent avec les offres publiées les plus récentes.

Appliquer toutes les migrations, y compris les migrations `candidate_*` ajoutées avec le tableau de bord. Elles donnent au candidat accès aux détails des offres déjà postulées même après leur clôture, remplacent ses compétences de façon atomique et gèrent le CV principal. Les CV sont téléversés directement vers le bucket privé `candidate-resumes`; la taille maximale est de 10 Mo.

## Offres d’emploi

- La recherche publique et les détails sont accessibles sous `/emplois` et `/emplois/[slug]`. La recherche prend en charge les mots-clés, la ville, le domaine, le contrat, le salaire minimum en XOF et le niveau d’expérience.
- Les candidats connectés peuvent sauvegarder des offres depuis la liste ou le détail, puis les retrouver sous `/candidate/offres/sauvegardees`. Postuler nécessite un profil candidat et un CV principal.
- Exécuter également `20261106085900_job_search_and_saved_jobs.sql` pour ajouter les champs de filtrage et la table `saved_jobs` avec ses politiques RLS.

## Espace entreprise

- La page `/company/offres/nouvelle` permet aux propriétaires, administrateurs et recruteurs actifs de publier une offre. Le tenant est vérifié côté serveur et par les politiques RLS; un identifiant d’entreprise envoyé par le navigateur ne suffit pas à autoriser la publication.
- La publication est immédiate. La fiche inclut le salaire en XOF, le type de contrat, l’expérience, le niveau d’étude minimum et la date limite.
- Exécuter également `20261106100000_job_education_level.sql` pour ajouter et contraindre le niveau d’étude minimum sur les offres.
- La page `/company/candidatures` liste les candidatures reçues. L’envoi requiert un compte candidat et un CV; la notification des recruteurs actifs est créée dans la même transaction que la candidature par un déclencheur SQL.
- Exécuter également `20261106110000_one_click_applications.sql` pour imposer le CV par RLS, donner accès aux profils candidats après leur candidature et notifier les membres de l’entreprise.
- Les recruteurs peuvent programmer un entretien avec une date et une heure, puis accepter ou refuser une candidature. Les candidats sont notifiés lors de ces changements.

## Notifications temps réel

- Tous les comptes candidats reçoivent une notification pour chaque nouvelle offre publiée; les recruteurs actifs reçoivent celles des nouvelles candidatures; les candidats reçoivent aussi les programmations d’entretien, acceptations et refus.
- Les historiques `/candidate/notifications` et `/company/notifications`, ainsi que les badges, se mettent à jour via Supabase Realtime. La migration `20261106120000_realtime_notifications.sql` active la publication `supabase_realtime` sur `notifications`.

## Application mobile Expo

- L’application Android/iOS autonome se trouve dans `mobile/`; elle utilise Expo Router, React Native et Supabase Auth/Data/Storage/Realtime.
- Suivre `mobile/README.md` pour configurer les variables `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY`, puis démarrer avec `npm start` depuis `mobile/`.
- Les écrans candidats comprennent l’accueil, la recherche et le détail des offres, le profil avec téléversement sécurisé du CV et les notifications temps réel.

## Déploiement web en production (GitHub + Vercel)

### Application web installable (PWA)

- Le site est installable sous Android Chrome, Samsung Internet et Edge Mobile; Safari sur iPhone/iPad propose l’ajout manuel à l’écran d’accueil. La bannière « Installer Job Center » déclenche l’invite native quand le navigateur l’autorise et affiche sinon les instructions adaptées.
- `public/manifest.json` définit le nom, les couleurs, l’affichage autonome, les raccourcis et les icônes. Les icônes PNG et les écrans de démarrage Apple se trouvent sous `public/icons/`.
- En production, le service worker `public/sw.js` est généré par `@ducanh2912/next-pwa` pendant `npm run build`; il est volontairement désactivé en développement local. Vercel sert les fichiers statiques générés comme les autres assets Next.js.
- Hors ligne, une page de secours s’affiche. Seuls les assets statiques versionnés Next.js sont mis en cache; les navigations, les routes protégées, les appels Supabase et les données de compte ne sont pas mis en cache. Les formulaires et tableaux de bord nécessitent donc une connexion.
- Pour tester l’installation, déployez en HTTPS (ou utilisez localhost sur un appareil de développement), ouvrez le site dans un navigateur compatible puis choisissez **Installer l’application** ou **Ajouter à l’écran d’accueil**. Sur iPhone/iPad : Safari → **Partager** → **Sur l’écran d’accueil**. Le service worker de production ne s’active pas avec `npm run dev`.

### Contrôles locaux

```powershell
npm ci
npm run lint
npm run typecheck
npm run build
```

Le projet web se déploie depuis la racine du dépôt. Le dossier `mobile/` est une application Expo séparée et ne doit pas être défini comme répertoire racine Vercel.

### Git et GitHub

Le dépôt doit rester privé tant que sa visibilité publique n’est pas voulue. Depuis la racine du projet, après avoir configuré votre identité Git si elle n’est pas déjà définie :

```powershell
git init
git add .
git status --short
git check-ignore .env.local
git commit -m "Production Ready"
gh repo create JBC_Togo --private --source=. --remote=origin --push
```

Vérifiez `git status --short` avant le commit : `.env.local`, les dépendances, les builds Next.js et les sorties Expo sont ignorés. Ne forcez jamais l’ajout d’un fichier `.env*` contenant des valeurs réelles.

Une CI GitHub s’exécute sur les pull requests et les branches `main`/`master` pour installer avec `npm ci`, lancer ESLint et vérifier TypeScript. Vercel réalise le build de production à chaque déploiement.

### Vercel

1. Importez le dépôt GitHub dans Vercel, sélectionnez **Next.js** et définissez **Root Directory** sur `.` (la racine).
2. Gardez les commandes détectées automatiquement ou configurez **Install Command** `npm ci` et **Build Command** `npm run build`. Laissez **Output Directory** vide pour le runtime Next.js.
3. Ajoutez les variables ci-dessous dans les environnements Vercel concernés. `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont nécessaires en Production (et Preview si ces déploiements utilisent Supabase). La clé `service_role` n'est pas utilisée par l'application web et ne doit jamais être exposée au navigateur.
4. Déployez. Notez le domaine `https://<projet>.vercel.app`, puis configurez-le dans Supabase Auth et comme URL de production ci-dessous.

Vérifiez les conditions d’utilisation du plan Vercel choisi : le plan Hobby est destiné aux projets personnels/non commerciaux. Une plateforme de recrutement opérée comme SaaS commercial peut nécessiter un plan payant.

| Variable | Production | Preview | Development |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase | Même projet ou projet de test | Valeur de `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé `anon`/publishable du projet | Clé correspondante | Valeur de `.env.local` |
| `NEXT_PUBLIC_SITE_URL` | `https://<projet>.vercel.app` | Facultative : Vercel `VERCEL_URL` est utilisée automatiquement | `http://localhost:3000` dans `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | Non requise par l'application actuelle | Non requise | Ne pas définir sauf ajout futur d'un client serveur privilégié |

Ajoutez les deux variables Supabase avec leur nom exact dans **Vercel → Project → Settings → Environment Variables**, en sélectionnant **Production** (et **Preview** si nécessaire), puis redéployez. Une variable ajoutée après un déploiement n'est pas injectée rétroactivement dans celui-ci. Les variables publiques doivent être disponibles au moment du build; l'application les valide avant de créer un client Supabase et échoue avec le nom exact de la variable manquante.

`NEXT_PUBLIC_SITE_URL` sert à construire les métadonnées et les liens de confirmation/réinitialisation. Pour les Preview Deployments, le code utilise le domaine système `VERCEL_URL` lorsqu’aucune URL explicite n’est configurée.

### Supabase avant la mise en production

1. Confirmez que toutes les migrations `supabase/migrations/*.sql` sont appliquées au projet de production. Elles activent les politiques RLS, configurent le bucket privé `candidate-resumes` (PDF/DOC/DOCX, limite 10 Mo) et inscrivent `notifications` dans `supabase_realtime`.
2. Dans **Authentication → URL Configuration**, définissez le **Site URL** sur `https://<projet>.vercel.app`.
3. Ajoutez à **Redirect URLs** `https://<projet>.vercel.app/auth/callback`, les URLs de réinitialisation qui passent par `/auth/callback`, l’URL locale `http://localhost:3000/auth/callback` et, si nécessaire, un motif Preview limité à votre équipe Vercel.
4. Configurez un fournisseur SMTP de production, validez les modèles de confirmation et de réinitialisation, puis testez ces e-mails avec un compte dédié.
5. Vérifiez dans le Dashboard Supabase que RLS est activé pour les tables métier, que `candidate-resumes` est privé et que la publication `supabase_realtime` contient `notifications`. Les migrations présentes dans le dépôt décrivent ces réglages; elles ne certifient pas à elles seules l’état actuel d’un autre projet Supabase.

La configuration Supabase locale utilise actuellement `http://localhost:3000`. Son Site URL et ses Redirect URLs doivent être remplacés/complétés pour la production; ne modifiez pas `.env.local` pour publier des secrets dans Git.
