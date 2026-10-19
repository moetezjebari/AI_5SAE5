# Gestion 1 — intégration (utilisateurs, profils, assistant)

La Gestion 1 a été intégrée **sans remplacer** l'authentification existante du projet (JWT, `User`, `AuthService`).
Elle ajoute ce qui manquait : l'assistant conversationnel, le choix du rôle, la photo de profil, l'administration des rôles et la déconnexion avec invalidation des jetons.

## Backend (`backend/`, port 8082)

| Fichier | Changement |
|---|---|
| `db/migration/V4__gestion1_profile_and_assistant.sql` | colonnes `field`, `level`, `avatar`, `token_version`, `last_login_at` sur `users` ; tables `conversations` et `chat_messages` |
| `user/User.java` | nouveaux champs correspondant à la migration V4 |
| `security/dto/RegisterRequest.java` | champ facultatif `role` (`STUDENT` par défaut, `TEACHER` autorisé, `ADMIN` refusé avec 403) |
| `security/dto/ProfileUpdateRequest.java` | champs facultatifs `field` et `level` (absent = inchangé) |
| `security/AuthService.java` | rôle à l'inscription, `last_login_at`, filière/niveau, claim JWT `tv`, `logout()` ; l'e-mail est normalisé **avant** le test d'unicité (corrige un doublon par la casse) |
| `security/AuthController.java` | `POST /api/auth/logout` |
| `security/JwtService.java`, `JwtAuthFilter.java` | un jeton dont le claim `tv` ne correspond plus à `users.token_version` est refusé (déconnexion, changement de rôle) ; les anciens jetons sans `tv` valent 0 |
| `security/SecurityConfig.java` | requête non authentifiée → **401** JSON (au lieu de 403) |
| `common/GlobalExceptionHandler.java` | JSON mal formé → 400 ; service IA indisponible → 503 |
| `recommendation/GeminiClient.java` | méthode `chat(...)` (multi-tours, instruction système) qui réutilise `app.gemini.*` ; clé envoyée en en-tête |
| `assistant/*` | conversations et messages, service, contrôleur, `AiClient` (interface) et `GeminiAssistantClient` (adaptateur sur `GeminiClient`) |
| `user/UserController.java`, `UserService.java`, `UserProfileDto.java`, `UserRequests.java` | profil détaillé, photo, administration des rôles |
| `src/test/...Gestion1IntegrationTest.java` | 18 tests d'intégration (H2 en mode MySQL, avec les vraies migrations Flyway) |

### Endpoints ajoutés

| Méthode | Route | Accès |
|---|---|---|
| POST | `/api/auth/logout` | connecté |
| GET | `/api/users/me` | connecté (profil détaillé : photo, filière, niveau, activité) |
| PUT / DELETE | `/api/users/me/avatar` | connecté |
| GET | `/api/users` | ADMIN |
| GET | `/api/users/{id}` | soi-même ou ADMIN |
| PUT | `/api/users/{id}/role` | ADMIN (pas sur soi-même) |
| POST | `/api/assistant/chat` | connecté |
| GET | `/api/assistant/conversations`, `/conversations/{id}/messages` | propriétaire |
| DELETE | `/api/assistant/conversations/{id}` | propriétaire |

Les endpoints existants ne changent pas (`/api/auth/register|login|me|profile|password`).

## Frontend (`src/app/`)

- `features/assistant/pages/assistant-page.ts` : chat réel (historique, nouvelle conversation, suppression, nouvel essai, erreurs) ; `core/services/assistant.service.ts`.
- `features/auth/pages/register-page.ts` : choix Étudiant / Enseignant.
- `features/profile/pages/profile-page.ts` : photo, activité, filière et niveau **enregistrés sur le serveur**.
- `features/admin/*` : page « Utilisateurs » (ADMIN) ; `roleGuard` ajouté dans `core/guards/auth.guard.ts`.
- `core/services/auth-api.service.ts` : `register(..., role)`, `updateProfile(..., field, level)`, `setAvatar`, `logout`, `getMe` (appelle maintenant `/users/me`).
- `core/services/auth.service.ts` : `updateUser` fusionne avec l'utilisateur courant et ne stocke pas la photo dans `localStorage`.
- `layouts/main-layout/*` : photo dans la barre, entrée de menu administrateur, déconnexion qui appelle l'API.
- `core/utils/http-error.ts` : `errorMessage()` ; les données fictives du chat ont été retirées de `mock-data.ts` et `lms.model.ts`.

## Points d'attention pour l'équipe

- **Inscription :** elle crée désormais un `STUDENT` ou un `TEACHER` au choix de l'utilisateur ; l'ancien commentaire « toujours étudiant » ne s'applique plus. `ADMIN` reste réservé aux administrateurs.
- **Jeton :** le claim `tv` est ajouté ; rien d'autre ne change (le sujet reste l'e-mail et les claims `userId`, `role`, `firstName`, `lastName` sont conservés).
- **Budget CSS :** `ng build` (production) échoue sur `recommendations-page.ts` (budget de styles dépassé). Ce n'est pas lié à la Gestion 1 ; `ng build --configuration development` passe.
- **Clé Gemini :** `GEMINI_API_KEY` (variable d'environnement). Sans clé, l'assistant répond 503 avec un message explicite, sans réponse simulée.
- **Tests :** `cd backend && mvn test`.
