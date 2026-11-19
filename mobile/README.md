# JOB-CENTER Mobile

Application candidat Android/iOS construite avec Expo, React Native, Expo Router et Supabase.

## Configuration locale

1. Copier `.env.example` vers `.env` dans ce dossier.
2. Renseigner `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY` avec les valeurs publiques du projet Supabase.
3. Dans Supabase Auth, autoriser l’URL de redirection native `jbc-togo://auth/callback` (ainsi que l’URL fournie par Expo pendant le développement) pour confirmer les inscriptions depuis l’application.
4. Vérifier que les migrations du dossier `../supabase/migrations` sont appliquées, notamment le schéma initial, les accès candidat, les candidatures en un clic et les notifications Realtime.
5. Depuis `mobile/`, lancer `npm start`, puis ouvrir l’application avec Expo Go ou un build de développement.

Les variables `EXPO_PUBLIC_*` sont intégrées au binaire mobile et ne doivent contenir que l’URL Supabase et la clé publishable/anon. Ne jamais utiliser la clé `service_role` dans l’application.

## Écrans

- Splash de démarrage et restauration de session.
- Connexion Supabase et inscription candidat avec confirmation e-mail.
- Tableau de bord candidat avec statistiques, alertes non lues et offres récentes.
- Recherche d’offres par mot-clé et ville, détail, sauvegarde et candidature rapide.
- Profil candidat avec CV PDF/DOC/DOCX téléversé dans le bucket privé `candidate-resumes`.
- Historique des notifications Supabase Realtime avec marquage comme lu.

Les règles RLS Supabase restent l’autorité pour l’accès aux profils, offres, CV, candidatures et notifications. La session Auth est persistée localement avec AsyncStorage. Le build iOS natif nécessite macOS; le développement via Expo Go fonctionne depuis Windows.

`npm run typecheck` vérifie les types. `npm run lint` lance Expo ESLint lorsque la configuration ESLint est installée.
