# Déroulé de la démonstration — Gestion 1 (environ 7 minutes)

## A. Préparation (à faire AVANT, 15 minutes avant la présentation)

1. **XAMPP** : ouvrir le panneau, cliquer sur **Start** à côté de **MySQL** (vert, port 3306).
2. **Backend** : dans PowerShell, une seule fenêtre, une seule fois.
   ```powershell
   $env:Path += ";C:\Users\ousse\.m2\wrapper\dists\apache-maven-3.9.12-bin\5nmfsn99br87k5d4ajlekdq10k\apache-maven-3.9.12\bin"
   cd C:\Users\ousse\Downloads\AI_5SAE5-recommandation\AI_5SAE5-recommandation\backend
   mvn spring-boot:run
   ```
   Attendre `Started LmsBackendApplication`.
3. **Frontend** : dans une 2e fenêtre PowerShell.
   ```powershell
   cd C:\Users\ousse\Downloads\AI_5SAE5-recommandation\AI_5SAE5-recommandation
   npm start
   ```
   Ouvrir http://localhost:4200 (de préférence dans une fenêtre de navigation privée, pour partir sans session).
4. **Comptes à préparer** (les mots de passe du jeu de données initial ne sont pas connus) :
   - un compte **étudiant** créé à l'avance, par exemple `etudiant.demo@test.local` ;
   - un compte **administrateur** : créer `admin.demo@test.local`, puis dans phpMyAdmin (bouton **Admin** de XAMPP), base `lms_db`, table `users`, passer son `role` à `ADMIN`.
5. **Tester l'assistant 10 minutes avant** avec une vraie question. Gemini dépend du réseau et du quota gratuit.
6. Préparer une photo de profil (png ou jpeg, quelques centaines de Ko au maximum, elle est redimensionnée à 256 px).
7. Garder ouverts : le rapport `docs/RAPPORT_GESTION1.md` et la Pull Request GitHub.

## B. Déroulé

| Min | Action | Ce qu'on dit | Résultat attendu |
|---|---|---|---|
| 0:00 | Présenter l'architecture (schéma du rapport, section 2) | Angular 20, Spring Boot, MySQL, JWT, Gemini appelé depuis le serveur | — |
| 0:45 | **Inscription** : page « Créer un compte », choisir « Enseignant / Formateur », valider | Le rôle est choisi à l'inscription ; l'administrateur n'est jamais choisissable | Arrivée sur le tableau de bord, le menu affiche « Gestion recommandations » |
| 1:30 | Déconnexion, puis **réinscription avec le même e-mail** | Unicité de l'e-mail, erreur 409 gérée | Message « Un compte existe déjà avec cet e-mail » |
| 2:00 | **Connexion** étudiant, puis recharger la page (F5) | Le jeton JWT est conservé, la session survit | Toujours connecté |
| 2:30 | **Profil** : changer photo, filière, niveau, enregistrer ; recharger | Les données sont enregistrées côté serveur ; la photo est contrôlée (format, taille, contenu) | Valeurs et photo conservées, l'activité est affichée |
| 3:30 | **Rôles** : étudiant, taper `/admin/users` dans l'URL | Le garde Angular n'est qu'un confort ; la vraie protection est côté serveur | Redirection vers le tableau de bord |
| 4:00 | Se connecter en **administrateur** : menu « Utilisateurs », changer le rôle de l'étudiant en Formateur | Seul un ADMIN peut changer un rôle, jamais le sien ; les anciens jetons de la cible sont invalidés | Rôle modifié dans la liste |
| 5:00 | **Assistant** (compte étudiant) : « Explique-moi la récursivité » puis « Peux-tu me donner un exemple ? » | La conversation garde le contexte ; l'historique est enregistré | Deux réponses cohérentes |
| 5:45 | Demander : « Que contient mon cours d'algorithmique ? » | L'assistant n'a pas accès aux contenus et ne les invente pas | Il le dit et renvoie vers la page Cours |
| 6:15 | Montrer l'historique, créer une **nouvelle conversation**, en supprimer une | Les conversations sont privées à chaque compte | Liste mise à jour |
| 6:45 | Montrer le **prompt** (rapport, section 7) | Instruction système : rôle pédagogique, limites explicites, protection contre l'injection | — |

## C. Plan B

- **L'assistant affiche « service IA indisponible »** : c'est le comportement prévu quand Gemini est injoignable ou que le quota est dépassé (erreur 503 explicite, rien d'inventé). Le montrer comme une preuve de robustesse, puis ouvrir une ancienne conversation de l'historique et montrer la persistance.
- **Réponse lente** : le projet essaie plusieurs modèles Gemini à la suite (le modèle par défaut répond 404 et un modèle de repli prend le relais), ce qui peut ajouter quelques secondes.
- **Le backend ne démarre pas** (`Communications link failure`) : MySQL n'est pas démarré dans XAMPP.
- **Port déjà utilisé** : arrêter l'ancien processus ou relancer, le backend écoute sur 8082 et le frontend sur 4200.
- **Ne pas lancer deux backends à la fois** : cela a déjà bloqué la base une fois.

## D. Questions probables du jury

- **Pourquoi la clé Gemini est-elle côté serveur ?** Pour qu'elle n'atteigne jamais le navigateur (pas visible dans les outils de développement). Elle est lue depuis une variable d'environnement ou un fichier local ignoré par Git.
- **Pourquoi JWT ?** API sans session serveur. Une version de jeton (`tv`) en base permet de l'invalider à la déconnexion ou au changement de rôle.
- **Où est stocké le jeton, et quel est le risque ?** Dans `localStorage` : simple, mais exposé en cas de faille XSS. Le choix du projet n'a pas été changé.
- **L'assistant connaît-il les cours ?** Non, il n'y a pas de récupération de données (pas de RAG). Il le dit explicitement. Évolution possible : lui fournir un extrait de cours choisi par l'étudiant.
- **Comment éviter les doublons de messages ?** Chaque message porte un identifiant (`clientMessageId`) ; un message rejoué renvoie la réponse déjà produite sans nouvel appel à l'IA.
- **Un étudiant peut-il lire les conversations d'un autre ?** Non : chaque lecture est filtrée par propriétaire (404 pour un autre compte). Un test d'intégration le vérifie.
- **Comment est testé le projet ?** 18 tests d'intégration backend (`mvn test`), plus une vérification manuelle complète avec le vrai Gemini.
- **Qu'est-ce qui n'est pas fait ?** Pas de tests Angular pour la Gestion 1, « mot de passe oublié » simulé, pas de déploiement, assistant non relié aux contenus.
