-- Sample / demo seed data, clearly separated from any future production data.
-- Demo account passwords (bcrypt-hashed below): admin@lms.local / Admin123!,
-- teacher@lms.local / Teacher123!, student@lms.local / Student123!

INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('admin@lms.local',   '$2b$10$IsWHZgpny/MRVRa0xF..1e/XtI.aIUL2E.5d7y0hJAyaJYtwAPn56', 'Admin', 'Système', 'ADMIN'),
('teacher@lms.local',  '$2b$10$q2HyMOAHBPDxxPP7Mya.6eyAOYiw.aZmeVTz1YxQKg41kkIh4BmTW', 'Sana', 'Ben Ali', 'TEACHER'),
('student@lms.local',  '$2b$10$1z4x7zYMrpoNM3rMl7fX3.BR5slgTrLN1r0WB32UxE8jKesWDyr4i', 'Amine', 'Khelifi', 'STUDENT');

-- Courses (migrated from the former frontend-only mock catalog)
INSERT INTO courses (title, description, subject, level, estimated_duration_minutes, status, created_by) VALUES
('Algorithmique et structures de données', 'Complexité, tris, listes, arbres et graphes : les fondamentaux pour concevoir des programmes efficaces.', 'Informatique', 'INTERMEDIAIRE', 2160, 'PUBLISHED', (SELECT id FROM users WHERE email = 'teacher@lms.local')),
('Bases de données relationnelles', 'Modélisation, SQL, jointures, normalisation et transactions.', 'Informatique', 'DEBUTANT', 1680, 'PUBLISHED', (SELECT id FROM users WHERE email = 'teacher@lms.local')),
('Réseaux informatiques', 'Modèle OSI, TCP/IP, adressage, routage et services réseau.', 'Réseaux', 'INTERMEDIAIRE', 1800, 'PUBLISHED', (SELECT id FROM users WHERE email = 'teacher@lms.local')),
('Développement web avec Angular', 'Composants standalone, signaux réactifs, routage et services HTTP.', 'Développement', 'AVANCE', 1920, 'PUBLISHED', (SELECT id FROM users WHERE email = 'teacher@lms.local')),
('Introduction à l''intelligence artificielle', 'Apprentissage supervisé, réseaux de neurones, LLMs et traitement du langage naturel.', 'Intelligence artificielle', 'INTERMEDIAIRE', 1560, 'PUBLISHED', (SELECT id FROM users WHERE email = 'teacher@lms.local')),
('Mathématiques pour l''informatique', 'Logique, ensembles, combinatoire et probabilités discrètes.', 'Mathématiques', 'DEBUTANT', 1440, 'PUBLISHED', (SELECT id FROM users WHERE email = 'teacher@lms.local'));

-- Lessons

INSERT INTO course_lessons (course_id, title, content, topic, duration_minutes, position) VALUES
((SELECT id FROM courses WHERE title = 'Algorithmique et structures de données'), 'Notation grand O', 'La notation grand O caractérise la vitesse de croissance d''une fonction lorsque la taille des données d''entrée (n) tend vers l''infini. Elle ignore les constantes multiplicatives et les termes de bas degré.', 'Complexité algorithmique', 25, 1),
((SELECT id FROM courses WHERE title = 'Algorithmique et structures de données'), 'Analyse de boucles', 'L''analyse de boucles consiste à sommer le nombre d''itérations. Une boucle simple de 1 à n donne O(n). Deux boucles imbriquées donnent O(n²).', 'Complexité algorithmique', 30, 2),
((SELECT id FROM courses WHERE title = 'Algorithmique et structures de données'), 'Listes chaînées', 'Une liste chaînée est une structure dynamique où chaque cellule contient une valeur et un pointeur vers la cellule suivante.', 'Structures linéaires', 40, 3),
((SELECT id FROM courses WHERE title = 'Algorithmique et structures de données'), 'Piles et files', 'La pile applique le principe LIFO. La file applique le principe FIFO.', 'Structures linéaires', 35, 4),
((SELECT id FROM courses WHERE title = 'Algorithmique et structures de données'), 'Arbres binaires de recherche', 'Un ABR maintient une relation d''ordre stricte : sous-arbre gauche < racine < sous-arbre droit.', 'Arbres et graphes', 45, 5),
((SELECT id FROM courses WHERE title = 'Algorithmique et structures de données'), 'Parcours de graphes', 'Le BFS explore couche par couche avec une file. Le DFS explore au plus profond avec une pile.', 'Arbres et graphes', 50, 6),

((SELECT id FROM courses WHERE title = 'Bases de données relationnelles'), 'Modèle entité-association', 'Le modèle conceptuel entité-association définit les entités, leurs propriétés et les associations qui les relient.', 'Modélisation', 30, 1),
((SELECT id FROM courses WHERE title = 'Bases de données relationnelles'), 'Passage au relationnel', 'Les règles de passage transforment les entités en tables et les associations en clés étrangères.', 'Modélisation', 30, 2),
((SELECT id FROM courses WHERE title = 'Bases de données relationnelles'), 'Requêtes SELECT', 'SELECT permet d''extraire des données en filtrant avec WHERE, triant avec ORDER BY et limitant avec LIMIT.', 'SQL', 35, 3),
((SELECT id FROM courses WHERE title = 'Bases de données relationnelles'), 'Jointures', 'Les jointures SQL permettent de croiser les données de plusieurs tables liées par des clés étrangères.', 'SQL', 40, 4),
((SELECT id FROM courses WHERE title = 'Bases de données relationnelles'), 'Agrégations', 'Les fonctions d''agrégation calculent des métriques globales ou par groupe défini via GROUP BY, filtré par HAVING.', 'SQL', 35, 5),

((SELECT id FROM courses WHERE title = 'Réseaux informatiques'), 'Modèle OSI', 'Le modèle OSI comporte 7 couches standardisant la communication réseau.', 'Modèles en couches', 30, 1),
((SELECT id FROM courses WHERE title = 'Réseaux informatiques'), 'TCP/IP', 'TCP assure un flux fiable avec handshake SYN/ACK ; UDP privilégie la vitesse et le temps réel.', 'Modèles en couches', 35, 2),
((SELECT id FROM courses WHERE title = 'Réseaux informatiques'), 'IPv4 et sous-réseaux', 'L''adressage IPv4 utilise 32 bits découpés en réseau et hôtes, délimités par le masque de sous-réseau.', 'Adressage', 50, 3),

((SELECT id FROM courses WHERE title = 'Développement web avec Angular'), 'Composants standalone', 'Les composants standalone importent directement leurs dépendances sans NgModule.', 'Fondamentaux', 40, 1),
((SELECT id FROM courses WHERE title = 'Développement web avec Angular'), 'Routage', 'Le routeur Angular associe des chemins d''URL à des composants, protégés par des guards fonctionnels.', 'Fondamentaux', 35, 2),

((SELECT id FROM courses WHERE title = 'Introduction à l''intelligence artificielle'), 'Histoire et définitions', 'L''IA englobe les systèmes capables d''effectuer des tâches cognitives ; le Machine Learning apprend à partir de données.', 'Panorama', 30, 1),

((SELECT id FROM courses WHERE title = 'Mathématiques pour l''informatique'), 'Propositions et connecteurs', 'La logique formelle structure la conception de conditions algorithmiques et la vérification de programmes.', 'Logique', 25, 1);

-- Quizzes (migrated from the former frontend-only mock quiz bank)

INSERT INTO quizzes (course_id, title, description, difficulty, duration_minutes, passing_score, status, created_by) VALUES
((SELECT id FROM courses WHERE title = 'Algorithmique et structures de données'), 'Complexité et tris', 'Quiz sur la complexité algorithmique et les structures linéaires.', 'MOYEN', 10, 50, 'PUBLISHED', (SELECT id FROM users WHERE email = 'teacher@lms.local')),
((SELECT id FROM courses WHERE title = 'Bases de données relationnelles'), 'Fondamentaux SQL et Modélisation', 'Quiz sur le SQL de base, les jointures et les propriétés ACID.', 'FACILE', 8, 50, 'PUBLISHED', (SELECT id FROM users WHERE email = 'teacher@lms.local')),
((SELECT id FROM courses WHERE title = 'Réseaux informatiques'), 'Modèle OSI et Réseaux', 'Quiz sur le modèle OSI et les protocoles de transport.', 'DIFFICILE', 12, 50, 'PUBLISHED', (SELECT id FROM users WHERE email = 'teacher@lms.local')),
((SELECT id FROM courses WHERE title = 'Développement web avec Angular'), 'Architecture et Signaux Angular', 'Quiz sur les signaux réactifs et les composants standalone.', 'MOYEN', 10, 50, 'PUBLISHED', (SELECT id FROM users WHERE email = 'teacher@lms.local')),
((SELECT id FROM courses WHERE title = 'Introduction à l''intelligence artificielle'), 'Machine Learning et Deep Learning', 'Quiz sur l''apprentissage supervisé et les fonctions d''activation.', 'MOYEN', 10, 50, 'PUBLISHED', (SELECT id FROM users WHERE email = 'teacher@lms.local'));

-- Quiz: Complexité et tris
INSERT INTO quiz_questions (quiz_id, question_text, question_type, topic, points, position) VALUES
((SELECT id FROM quizzes WHERE title = 'Complexité et tris'), 'Quelle est la complexité moyenne du tri rapide (QuickSort) ?', 'SINGLE_CHOICE', 'Complexité algorithmique', 1, 1),
((SELECT id FROM quizzes WHERE title = 'Complexité et tris'), 'Quelle structure suit le principe LIFO (Last In, First Out) ?', 'SINGLE_CHOICE', 'Structures linéaires', 1, 2),
((SELECT id FROM quizzes WHERE title = 'Complexité et tris'), 'La recherche dichotomique exige un tableau…', 'SINGLE_CHOICE', 'Complexité algorithmique', 1, 3);

INSERT INTO quiz_options (question_id, option_text, is_correct, position) VALUES
((SELECT id FROM quiz_questions WHERE question_text = 'Quelle est la complexité moyenne du tri rapide (QuickSort) ?'), 'O(n)', FALSE, 1),
((SELECT id FROM quiz_questions WHERE question_text = 'Quelle est la complexité moyenne du tri rapide (QuickSort) ?'), 'O(n log n)', TRUE, 2),
((SELECT id FROM quiz_questions WHERE question_text = 'Quelle est la complexité moyenne du tri rapide (QuickSort) ?'), 'O(n²)', FALSE, 3),
((SELECT id FROM quiz_questions WHERE question_text = 'Quelle est la complexité moyenne du tri rapide (QuickSort) ?'), 'O(log n)', FALSE, 4),

((SELECT id FROM quiz_questions WHERE question_text = 'Quelle structure suit le principe LIFO (Last In, First Out) ?'), 'File', FALSE, 1),
((SELECT id FROM quiz_questions WHERE question_text = 'Quelle structure suit le principe LIFO (Last In, First Out) ?'), 'Pile', TRUE, 2),
((SELECT id FROM quiz_questions WHERE question_text = 'Quelle structure suit le principe LIFO (Last In, First Out) ?'), 'Arbre binaire', FALSE, 3),
((SELECT id FROM quiz_questions WHERE question_text = 'Quelle structure suit le principe LIFO (Last In, First Out) ?'), 'Graphe', FALSE, 4),

((SELECT id FROM quiz_questions WHERE question_text = 'La recherche dichotomique exige un tableau…'), 'Trié', TRUE, 1),
((SELECT id FROM quiz_questions WHERE question_text = 'La recherche dichotomique exige un tableau…'), 'De taille paire', FALSE, 2),
((SELECT id FROM quiz_questions WHERE question_text = 'La recherche dichotomique exige un tableau…'), 'Sans doublons', FALSE, 3),
((SELECT id FROM quiz_questions WHERE question_text = 'La recherche dichotomique exige un tableau…'), 'De nombres entiers', FALSE, 4);

-- Quiz: Fondamentaux SQL et Modélisation
INSERT INTO quiz_questions (quiz_id, question_text, question_type, topic, points, position) VALUES
((SELECT id FROM quizzes WHERE title = 'Fondamentaux SQL et Modélisation'), 'Quelle clause filtre les groupes après un GROUP BY ?', 'SINGLE_CHOICE', 'SQL', 1, 1),
((SELECT id FROM quizzes WHERE title = 'Fondamentaux SQL et Modélisation'), 'Quelle jointure conserve toutes les lignes de la table de gauche ?', 'SINGLE_CHOICE', 'SQL', 1, 2),
((SELECT id FROM quizzes WHERE title = 'Fondamentaux SQL et Modélisation'), 'Quelle propriété ACID garantit qu''une transaction s''exécute entièrement ou pas du tout ?', 'SINGLE_CHOICE', 'Modélisation', 1, 3);

INSERT INTO quiz_options (question_id, option_text, is_correct, position) VALUES
((SELECT id FROM quiz_questions WHERE question_text = 'Quelle clause filtre les groupes après un GROUP BY ?'), 'WHERE', FALSE, 1),
((SELECT id FROM quiz_questions WHERE question_text = 'Quelle clause filtre les groupes après un GROUP BY ?'), 'HAVING', TRUE, 2),
((SELECT id FROM quiz_questions WHERE question_text = 'Quelle clause filtre les groupes après un GROUP BY ?'), 'ORDER BY', FALSE, 3),
((SELECT id FROM quiz_questions WHERE question_text = 'Quelle clause filtre les groupes après un GROUP BY ?'), 'LIMIT', FALSE, 4),

((SELECT id FROM quiz_questions WHERE question_text = 'Quelle jointure conserve toutes les lignes de la table de gauche ?'), 'INNER JOIN', FALSE, 1),
((SELECT id FROM quiz_questions WHERE question_text = 'Quelle jointure conserve toutes les lignes de la table de gauche ?'), 'LEFT JOIN', TRUE, 2),
((SELECT id FROM quiz_questions WHERE question_text = 'Quelle jointure conserve toutes les lignes de la table de gauche ?'), 'CROSS JOIN', FALSE, 3),
((SELECT id FROM quiz_questions WHERE question_text = 'Quelle jointure conserve toutes les lignes de la table de gauche ?'), 'SELF JOIN', FALSE, 4),

((SELECT id FROM quiz_questions WHERE question_text = 'Quelle propriété ACID garantit qu''une transaction s''exécute entièrement ou pas du tout ?'), 'Atomicité', TRUE, 1),
((SELECT id FROM quiz_questions WHERE question_text = 'Quelle propriété ACID garantit qu''une transaction s''exécute entièrement ou pas du tout ?'), 'Cohérence', FALSE, 2),
((SELECT id FROM quiz_questions WHERE question_text = 'Quelle propriété ACID garantit qu''une transaction s''exécute entièrement ou pas du tout ?'), 'Isolation', FALSE, 3),
((SELECT id FROM quiz_questions WHERE question_text = 'Quelle propriété ACID garantit qu''une transaction s''exécute entièrement ou pas du tout ?'), 'Durabilité', FALSE, 4);

-- Quiz: Modèle OSI et Réseaux
INSERT INTO quiz_questions (quiz_id, question_text, question_type, topic, points, position) VALUES
((SELECT id FROM quizzes WHERE title = 'Modèle OSI et Réseaux'), 'Quelle couche OSI gère le routage et l''adressage logique des paquets ?', 'SINGLE_CHOICE', 'Modèles en couches', 1, 1),
((SELECT id FROM quizzes WHERE title = 'Modèle OSI et Réseaux'), 'Quel mécanisme TCP établit une connexion fiable avant l''échange de données ?', 'SINGLE_CHOICE', 'Modèles en couches', 1, 2);

INSERT INTO quiz_options (question_id, option_text, is_correct, position) VALUES
((SELECT id FROM quiz_questions WHERE question_text = 'Quelle couche OSI gère le routage et l''adressage logique des paquets ?'), 'Liaison de données (2)', FALSE, 1),
((SELECT id FROM quiz_questions WHERE question_text = 'Quelle couche OSI gère le routage et l''adressage logique des paquets ?'), 'Réseau (3)', TRUE, 2),
((SELECT id FROM quiz_questions WHERE question_text = 'Quelle couche OSI gère le routage et l''adressage logique des paquets ?'), 'Transport (4)', FALSE, 3),
((SELECT id FROM quiz_questions WHERE question_text = 'Quelle couche OSI gère le routage et l''adressage logique des paquets ?'), 'Session (5)', FALSE, 4),

((SELECT id FROM quiz_questions WHERE question_text = 'Quel mécanisme TCP établit une connexion fiable avant l''échange de données ?'), 'Sliding Window', FALSE, 1),
((SELECT id FROM quiz_questions WHERE question_text = 'Quel mécanisme TCP établit une connexion fiable avant l''échange de données ?'), '3-Way Handshake (SYN, SYN-ACK, ACK)', TRUE, 2),
((SELECT id FROM quiz_questions WHERE question_text = 'Quel mécanisme TCP établit une connexion fiable avant l''échange de données ?'), 'Checksum UDP', FALSE, 3),
((SELECT id FROM quiz_questions WHERE question_text = 'Quel mécanisme TCP établit une connexion fiable avant l''échange de données ?'), 'CSMA/CD', FALSE, 4);

-- Quiz: Architecture et Signaux Angular
INSERT INTO quiz_questions (quiz_id, question_text, question_type, topic, points, position) VALUES
((SELECT id FROM quizzes WHERE title = 'Architecture et Signaux Angular'), 'Quelle primitive réactive Angular crée une valeur dérivée en lecture seule ?', 'SINGLE_CHOICE', 'Fondamentaux', 1, 1),
((SELECT id FROM quizzes WHERE title = 'Architecture et Signaux Angular'), 'Quel mot-clé dans @Component permet d''utiliser un composant sans NgModule ?', 'SINGLE_CHOICE', 'Fondamentaux', 1, 2);

INSERT INTO quiz_options (question_id, option_text, is_correct, position) VALUES
((SELECT id FROM quiz_questions WHERE question_text = 'Quelle primitive réactive Angular crée une valeur dérivée en lecture seule ?'), 'signal()', FALSE, 1),
((SELECT id FROM quiz_questions WHERE question_text = 'Quelle primitive réactive Angular crée une valeur dérivée en lecture seule ?'), 'computed()', TRUE, 2),
((SELECT id FROM quiz_questions WHERE question_text = 'Quelle primitive réactive Angular crée une valeur dérivée en lecture seule ?'), 'effect()', FALSE, 3),
((SELECT id FROM quiz_questions WHERE question_text = 'Quelle primitive réactive Angular crée une valeur dérivée en lecture seule ?'), 'BehaviorSubject()', FALSE, 4),

((SELECT id FROM quiz_questions WHERE question_text = 'Quel mot-clé dans @Component permet d''utiliser un composant sans NgModule ?'), 'standalone: true / imports direct', TRUE, 1),
((SELECT id FROM quiz_questions WHERE question_text = 'Quel mot-clé dans @Component permet d''utiliser un composant sans NgModule ?'), 'inline: true', FALSE, 2),
((SELECT id FROM quiz_questions WHERE question_text = 'Quel mot-clé dans @Component permet d''utiliser un composant sans NgModule ?'), 'isolated: true', FALSE, 3),
((SELECT id FROM quiz_questions WHERE question_text = 'Quel mot-clé dans @Component permet d''utiliser un composant sans NgModule ?'), 'independent: true', FALSE, 4);

-- Quiz: Machine Learning et Deep Learning
INSERT INTO quiz_questions (quiz_id, question_text, question_type, topic, points, position) VALUES
((SELECT id FROM quizzes WHERE title = 'Machine Learning et Deep Learning'), 'Quel type d''apprentissage utilise des données étiquetées pour prédire une classe ou valeur ?', 'SINGLE_CHOICE', 'Panorama', 1, 1),
((SELECT id FROM quizzes WHERE title = 'Machine Learning et Deep Learning'), 'Quelle fonction d''activation est définie par f(x) = max(0, x) ?', 'SINGLE_CHOICE', 'Panorama', 1, 2);

INSERT INTO quiz_options (question_id, option_text, is_correct, position) VALUES
((SELECT id FROM quiz_questions WHERE question_text = 'Quel type d''apprentissage utilise des données étiquetées pour prédire une classe ou valeur ?'), 'Apprentissage supervisé', TRUE, 1),
((SELECT id FROM quiz_questions WHERE question_text = 'Quel type d''apprentissage utilise des données étiquetées pour prédire une classe ou valeur ?'), 'Apprentissage non supervisé', FALSE, 2),
((SELECT id FROM quiz_questions WHERE question_text = 'Quel type d''apprentissage utilise des données étiquetées pour prédire une classe ou valeur ?'), 'Apprentissage par renforcement', FALSE, 3),
((SELECT id FROM quiz_questions WHERE question_text = 'Quel type d''apprentissage utilise des données étiquetées pour prédire une classe ou valeur ?'), 'Clustering K-Means', FALSE, 4),

((SELECT id FROM quiz_questions WHERE question_text = 'Quelle fonction d''activation est définie par f(x) = max(0, x) ?'), 'Sigmoïde', FALSE, 1),
((SELECT id FROM quiz_questions WHERE question_text = 'Quelle fonction d''activation est définie par f(x) = max(0, x) ?'), 'Tangente hyperbolique (tanh)', FALSE, 2),
((SELECT id FROM quiz_questions WHERE question_text = 'Quelle fonction d''activation est définie par f(x) = max(0, x) ?'), 'ReLU', TRUE, 3),
((SELECT id FROM quiz_questions WHERE question_text = 'Quelle fonction d''activation est définie par f(x) = max(0, x) ?'), 'Softmax', FALSE, 4);
