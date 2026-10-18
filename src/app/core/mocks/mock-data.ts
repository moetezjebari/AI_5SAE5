import { ChatMessage, Course, Exercise, Quiz, Recommendation, Result } from '../models/lms.model';

export const MOCK_COURSES: Course[] = [
  {
    id: 'algo',
    title: 'Algorithmique et structures de données',
    category: 'Informatique',
    level: 'Intermédiaire',
    teacher: 'Dr. Sana Ben Ali',
    description: 'Complexité, tris, listes, arbres et graphes : les fondamentaux pour concevoir des programmes efficaces.',
    progress: 80,
    durationHours: 36,
    topics: ['Complexité algorithmique', 'Grand O', 'Listes chaînées', 'Piles LIFO', 'Files FIFO', 'Arbres binaires de recherche', 'Parcours de graphes BFS/DFS', 'Algorithme de Dijkstra'],
    fullContent: `Ce cours approfondit l'analyse d'algorithmes et les structures de données fondamentales en informatique.
1. Analyse de complexité :
- La notation Grand O (O) exprime le comportement asymptotique dans le pire des cas.
- Hiérarchie usuelle : O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2^n) < O(n!).
- L'accès par index dans un tableau est O(1). La recherche linéaire est O(n). La recherche dichotomique dans un tableau trié est O(log n).
- Les algorithmes de tri efficace comme le Tri Fusion (Merge Sort) et le Tri Rapide (QuickSort) s'exécutent en moyenne en O(n log n). Le tri à bulles ou par sélection est en O(n²).

2. Structures de données linéaires :
- Liste simplement chaînée : chaque nœud stocke une valeur et un pointeur vers le nœud suivant. L'insertion en tête est en O(1), mais l'accès au k-ième élément est en O(k).
- Pile (Stack) : structure LIFO (Last In, First Out). Les opérations principales sont push (empiler) et pop (dépiler), toutes deux en O(1). Utilisée pour la gestion des appels de fonction et l'évaluation d'expressions.
- File (Queue) : structure FIFO (First In, First Out). Les opérations principales sont enqueue (enfiler) et dequeue (défiler), en O(1). Utilisée pour les ordonnanceurs et les parcours en largeur.

3. Arbres et graphes :
- Arbre Binaire de Recherche (ABR / BST) : pour chaque nœud, tous les éléments du sous-arbre gauche sont strictement inférieurs, et ceux du sous-arbre droit sont supérieurs ou égaux. La recherche, insertion et suppression sont en O(h) où h est la hauteur (O(log n) si équilibré, O(n) si dégénéré en liste).
- Le parcours infixe (In-Order) d'un ABR visite les nœuds dans l'ordre croissant.
- Graphes : représentés par matrice d'adjacence ou liste d'adjacence.
- Parcours en largeur (BFS) : utilise une File (Queue) et permet de trouver le chemin le plus court dans un graphe non pondéré.
- Parcours en profondeur (DFS) : utilise une Pile (Stack) ou la récursion pour explorer chaque branche jusqu'au bout.
- Algorithme de Dijkstra : trouve les plus courts chemins depuis un sommet source dans un graphe pondéré à poids positifs en utilisant une file de priorité.`,
    modules: [
      {
        title: 'Complexité',
        summary: 'Mesure de performance temporelle et spatiale des algorithmes.',
        lessons: [
          {
            title: 'Notation grand O',
            duration: '25 min',
            done: true,
            content: 'La notation grand O caractérise la vitesse de croissance d\'une fonction lorsque la taille des données d\'entrée (n) tend vers l\'infini. Elle ignore les constantes multiplicatives et les termes de bas degré.',
            keyPoints: ['O(1) : temps constant indépendant de n', 'O(log n) : division par deux à chaque étape (ex: dichotomie)', 'O(n log n) : complexité optimale des tris par comparaison']
          },
          {
            title: 'Analyse de boucles',
            duration: '30 min',
            done: true,
            content: 'L\'analyse de boucles consiste à sommer le nombre d\'itérations. Une boucle simple de 1 à n exécutant une opération O(1) donne O(n). Deux boucles imbriquées de 1 à n donnent O(n²). Si le pas est multiplié par 2 à chaque tour, la complexité devient logarithmique O(log n).',
            keyPoints: ['Boucles imbriquées : multiplication des complexités', 'Boucles dépendantes : somme arithmétique 1+2+...+n = n(n+1)/2 = O(n²)']
          }
        ]
      },
      {
        title: 'Structures linéaires',
        summary: 'Organisation séquentielle des éléments en mémoire : listes, piles et files.',
        lessons: [
          {
            title: 'Listes chaînées',
            duration: '40 min',
            done: true,
            content: 'Une liste chaînée est une structure dynamique où chaque cellule contient une valeur et un pointeur (référence) vers la cellule suivante. Contrairement aux tableaux, la taille est dynamique sans réallocation continue.',
            keyPoints: ['Insertion/suppression en tête en O(1)', 'Recherche et accès par indice en O(n)', 'Pas de localité spatiale du cache contrairement aux tableaux']
          },
          {
            title: 'Piles et files',
            duration: '35 min',
            done: false,
            content: 'La pile applique le principe LIFO : le dernier élément inséré est le premier retiré. La file applique le principe FIFO : le premier élément inséré est le premier retiré.',
            keyPoints: ['Pile : LIFO, push/pop en O(1)', 'File : FIFO, enqueue/dequeue en O(1)', 'File utilisée pour le BFS, pile utilisée pour le DFS']
          }
        ]
      },
      {
        title: 'Arbres et graphes',
        summary: 'Structures hiérarchiques et réseaux relationnels non linéaires.',
        lessons: [
          {
            title: 'Arbres binaires de recherche',
            duration: '45 min',
            done: false,
            content: 'Un Arbre Binaire de Recherche maintient une relation d\'ordre stricte : sous-arbre gauche < racine < sous-arbre droit. Le parcours infixe produit la séquence triée.',
            keyPoints: ['Hauteur minimale log₂(n), maximale n', 'Parcours infixe (gauche, racine, droite) = ordre croissant', 'Recherche en O(log n) si arbre équilibré']
          },
          {
            title: 'Parcours de graphes',
            duration: '50 min',
            done: false,
            content: 'Les graphes modélisent des sommets reliés par des arêtes. Le BFS (largeur) explore couche par couche avec une file. Le DFS (profondeur) explore au plus profond avec une pile.',
            keyPoints: ['BFS utilise une file et trouve le plus court chemin non pondéré', 'DFS utilise la récursion/pile et détecte les cycles', 'Dijkstra calcule les distances minimales avec poids positifs']
          }
        ]
      }
    ]
  },
  {
    id: 'bdd',
    title: 'Bases de données relationnelles',
    category: 'Informatique',
    level: 'Débutant',
    teacher: 'M. Karim Trabelsi',
    description: 'Modélisation, SQL, jointures, normalisation et transactions.',
    progress: 55,
    durationHours: 28,
    topics: ['Modèle entité-association', 'SQL SELECT', 'Jointures INNER/LEFT/RIGHT', 'GROUP BY et HAVING', 'Sous-requêtes', 'Formes normales 1NF/2NF/3NF', 'Transactions ACID'],
    fullContent: `Ce cours couvre les concepts essentiels des bases de données relationnelles (SGBDR) et du langage SQL.
1. Modélisation relationnelle :
- Le schéma relationnel est constitué de tables (relations), lignes (uplets ou tuples) et colonnes (attributs).
- Clé primaire (PK) : attribut ou ensemble d'attributs qui identifie de manière unique chaque enregistrement d'une table (non nulle et unique).
- Clé étrangère (FK) : attribut référençant la clé primaire d'une autre table pour assurer l'intégrité référentielle.
- Relations : 1 à 1 (1:1), 1 à plusieurs (1:N), et plusieurs à plusieurs (N:M, requiert une table d'association).

2. Langage SQL :
- Requêtes de projection et sélection : SELECT colonnes FROM table WHERE condition.
- Jointures :
  * INNER JOIN : ne retourne que les lignes ayant une correspondance dans les deux tables.
  * LEFT JOIN (ou LEFT OUTER JOIN) : conserve toutes les lignes de la table gauche, complétées par NULL si aucune correspondance à droite.
  * RIGHT JOIN : conserve toutes les lignes de la table droite.
  * FULL JOIN : conserve toutes les lignes des deux tables.
- Agrégations : COUNT(), SUM(), AVG(), MIN(), MAX().
- GROUP BY regroupe les lignes partageant les mêmes valeurs pour appliquer des fonctions d'agrégation.
- HAVING filtre les groupes formés par GROUP BY (tandis que WHERE filtre les lignes individuelles AVANT le regroupement).

3. Normalisation et intégrité :
- 1FN (Première Forme Normale) : les valeurs de chaque attribut sont atomiques (pas de listes ou valeurs répétées).
- 2FN (Deuxième Forme Normale) : en 1FN et chaque attribut non-clé dépend de la TOTALITÉ de la clé primaire (pas de dépendance partielle).
- 3FN (Troisième Forme Normale) : en 2FN et aucun attribut non-clé ne dépend d'un autre attribut non-clé (élimination des dépendances transitives).

4. Transactions et propriétés ACID :
- Atomicité : la transaction s'exécute entièrement ou pas du tout (commit ou rollback).
- Cohérence : la transaction fait passer la base d'un état valide à un autre état valide.
- Isolation : les transactions concurrentes ne s'interfèrent pas entre elles.
- Durabilité : une fois validée, la modification est persistée de façon permanente même en cas de panne système.`,
    modules: [
      {
        title: 'Modélisation',
        summary: 'Conception de schémas de données relationnels solides.',
        lessons: [
          {
            title: 'Modèle entité-association',
            duration: '30 min',
            done: true,
            content: 'Le modèle conceptuel entité-association définit les entités du domaine, leurs propriétés et les associations qui les relient avec leurs cardinalités (0,1, 1,1, 0,n, 1,n).',
            keyPoints: ['Entité : objet ou concept du monde réel', 'Association : lien logique entre entités', 'Cardinalités : multiplicité minimale et maximale']
          },
          {
            title: 'Passage au relationnel',
            duration: '30 min',
            done: true,
            content: 'Les règles de passage transforment les entités en tables, et traduisent les associations selon leurs cardinalités : une relation 1:N devient une clé étrangère du côté N.',
            keyPoints: ['Entité -> Table avec clé primaire', 'Association 1:N -> Clé étrangère dans la table fille', 'Association N:M -> Nouvelle table de jonction']
          }
        ]
      },
      {
        title: 'SQL',
        summary: 'Interrogation et manipulation des données avec SQL standard.',
        lessons: [
          {
            title: 'Requêtes SELECT',
            duration: '35 min',
            done: true,
            content: 'SELECT permet d\'extraire des données en filtrant les lignes avec WHERE, en triant avec ORDER BY (ASC/DESC) et en limitant les résultats avec LIMIT.',
            keyPoints: ['Projection : choix des colonnes', 'Sélection : filtres WHERE avec opérateurs AND/OR/IN/BETWEEN/LIKE', 'Tri : ORDER BY']
          },
          {
            title: 'Jointures',
            duration: '40 min',
            done: false,
            content: 'Les jointures SQL permettent de croiser les données de plusieurs tables liées par des clés étrangères.',
            keyPoints: ['INNER JOIN : intersection stricte', 'LEFT JOIN : conserve toute la table de gauche', 'ON spécifie la condition d\'égalité des clés']
          },
          {
            title: 'Agrégations',
            duration: '35 min',
            done: false,
            content: 'Les fonctions d\'agrégation calculent des métriques globales ou par groupe défini via GROUP BY. Le filtre de groupe s\'effectue impérativement via HAVING.',
            keyPoints: ['WHERE s\'applique avant le regroupement', 'HAVING filtre les résultats agrégés', 'COUNT(*) compte les lignes, COUNT(col) ignore les NULL']
          }
        ]
      }
    ]
  },
  {
    id: 'reseaux',
    title: 'Réseaux informatiques',
    category: 'Réseaux',
    level: 'Intermédiaire',
    teacher: 'Mme Ines Gharbi',
    description: 'Modèle OSI, TCP/IP, adressage, routage et services réseau.',
    progress: 30,
    durationHours: 30,
    topics: ['Modèle OSI 7 couches', 'Modèle TCP/IP', 'Adressage IPv4 et masques CIDR', 'TCP vs UDP', 'Protocole IP et routage', 'DNS, DHCP et HTTP'],
    fullContent: `Ce cours explore les fondements des réseaux informatiques et de la communication de données.
1. Les modèles en couches :
- Modèle OSI (7 couches) :
  1. Physique : transmission binaire sur support matériel (câbles, ondes, signaux électriques/optiques).
  2. Liaison de données : trames, adresses physiques MAC, détection d'erreurs (Ethernet, Wi-Fi 802.11).
  3. Réseau : paquets, adressage logique IP, routage entre réseaux distincts (IPv4, IPv6, ICMP).
  4. Transport : segments, contrôle de flux, fiabilité de bout en bout (TCP, UDP).
  5. Session : établissement, maintien et clôture des sessions de communication.
  6. Présentation : formatage, encodage, compression et chiffrement des données (SSL/TLS).
  7. Application : interface directe avec les applications utilisateur (HTTP, DNS, SMTP, FTP).
- Modèle TCP/IP (4 couches) : Accès réseau, Internet, Transport, Application.
- Encapsulation : chaque couche ajoute son en-tête (header) aux données reçues de la couche supérieure.

2. Adressage IPv4 et sous-réseaux :
- Une adresse IPv4 fait 32 bits (4 octets notés de 0 à 255).
- Composée d'une partie réseau (NetID) et d'une partie hôte (HostID), délimitées par le masque de sous-réseau.
- Notation CIDR : /24 signifie que 24 bits sont réservés pour le réseau (masque 255.255.255.0), laissant 8 bits pour les hôtes.
- Nombre d'hôtes adressables par sous-réseau : 2^(bits hôte) - 2 (l'adresse avec tous les bits hôte à 0 est l'adresse réseau, et tous à 1 est l'adresse de broadcast/diffusion).

3. Couche Transport : TCP versus UDP :
- TCP (Transmission Control Protocol) : orienté connexion, fiable, garantit l'ordre et la livraison sans perte des paquets grâce à des accusés de réception (ACK), contrôle de flux et de congestion. Connexion établie par la poignée de main à trois voies (3-way handshake : SYN -> SYN-ACK -> ACK).
- UDP (User Datagram Protocol) : sans connexion, rapide, sans garantie d'ordre ni de retransmission, très léger. Utilisé pour le streaming en direct, VoIP, jeux en ligne et requêtes DNS.

4. Services fondamentaux :
- DNS (Domain Name System, port 53) : traduit les noms de domaine en adresses IP.
- DHCP (Dynamic Host Configuration Protocol) : attribue automatiquement des adresses IP dynamiques aux machines du réseau.
- HTTP / HTTPS (ports 80 / 443) : protocoles de transfert hypertexte du web, sécurisé avec TLS pour HTTPS.`,
    modules: [
      {
        title: 'Modèles en couches',
        summary: 'Comprendre l\'architecture en couches et la communication réseau.',
        lessons: [
          {
            title: 'Modèle OSI',
            duration: '30 min',
            done: true,
            content: 'Le modèle OSI comporte 7 couches standardisant la communication. La couche 3 gère le routage par adresse IP, la couche 4 gère les ports et la fiabilité de transport.',
            keyPoints: ['7 couches : Physique, Liaison, Réseau, Transport, Session, Présentation, Application', 'Couche 2 = Trame et adresse MAC', 'Couche 3 = Paquet et adresse IP', 'Couche 4 = Segment et ports']
          },
          {
            title: 'TCP/IP',
            duration: '35 min',
            done: false,
            content: 'Le modèle TCP/IP est la mise en œuvre pratique d\'Internet. TCP assure un flux fiable avec handshake SYN/ACK, tandis qu\'UDP privilégie la vitesse et le temps réel.',
            keyPoints: ['TCP : 3-way handshake (SYN, SYN-ACK, ACK), fiable', 'UDP : non connecté, rapide, tolérant aux pertes', 'Ports 0 à 1023 réservés pour les services connus']
          }
        ]
      },
      {
        title: 'Adressage',
        summary: 'Calcul et répartition des adresses IP et sous-réseaux.',
        lessons: [
          {
            title: 'IPv4 et sous-réseaux',
            duration: '50 min',
            done: false,
            content: 'L\'adressage IPv4 utilise 32 bits découpés en réseau et hôtes. Le masque délimite ces deux zones. Dans chaque sous-réseau, 2 adresses sont réservées (réseau et broadcast).',
            keyPoints: ['Format 32 bits : 4 octets', 'Formule hôtes : 2^h - 2', 'CIDR /24 = 256 adresses = 254 machines']
          }
        ]
      }
    ]
  },
  {
    id: 'web',
    title: 'Développement web avec Angular',
    category: 'Développement',
    level: 'Avancé',
    teacher: 'Mme Rim Cherif',
    description: 'Composants standalone, signaux réactifs, routage et services HTTP.',
    progress: 10,
    durationHours: 32,
    topics: ['Composants Standalone', 'Angular Signals (signal, computed, effect)', 'Templates et Data Binding', 'Routing et Guards', 'Services et Injection de dépendances', 'HttpClient et Intercepteurs'],
    fullContent: `Ce cours détaille les architectures modernes de développement web avec Angular (version moderne standalone et signaux).
1. Composants Standalone :
- Les composants Angular modernes se déclarent sans NgModule avec imports autonomes dans le décorateur @Component.
- Structure d'un composant : template HTML, styles SCSS/CSS encapsulés et classe TypeScript de logique.
- Liaisons de données (Data Binding) :
  * Interpolation : {{ variable }} pour afficher du texte.
  * Property Binding : [propriété]="valeur" pour lier un attribut HTML ou un input enfant.
  * Event Binding : (événement)="action()" pour écouter les interactions utilisateur.
  * Two-way Binding : [(ngModel)]="valeur" pour synchroniser formulaire et modèle.

2. Réactivité avec les Signals :
- signal() : valeur mutable réactive qui notifie automatiquement le moteur de rendu lors d'une mise à jour (via .set() ou .update()).
- computed() : signal dérivé en lecture seule recalculé uniquement lorsque ses dépendances changent.
- effect() : fonction exécutée en réponse aux changements de signaux (effets de bord, synchronisation).
- Avantage : performances accrues et détection de changement granulaire sans dépendre exclusivement de Zone.js.

3. Routage et cycle de vie :
- RouterOutlet permet d'afficher les composants selon l'URL active.
- Routes protégées par des guards fonctionnels (canActivate) pour restreindre l'accès aux utilisateurs authentifiés.
- Lazy Loading : chargement à la demande des modules ou composants pour réduire le temps de chargement initial.

4. Services, Injection de dépendances et HTTP :
- Les services décorés avec @Injectable({ providedIn: 'root' }) sont des singletons partagés dans toute l'application.
- HttpClient permet d'effectuer des requêtes HTTP (GET, POST, PUT, DELETE) typées avec RxJS.
- Intercepteurs HTTP (HttpInterceptorFn) : interceptent les requêtes et réponses pour injecter le token JWT d'authentification ou centraliser la gestion des erreurs 401/500.`,
    modules: [
      {
        title: 'Fondamentaux',
        summary: 'Composants, templates et réactivité moderne avec Signals.',
        lessons: [
          {
            title: 'Composants standalone',
            duration: '40 min',
            done: true,
            content: 'Les composants standalone importent directement leurs dépendances. Ils simplifient la structure du projet et facilitent le découpage modulaire.',
            keyPoints: ['Standalone: imports directs sans NgModule', 'Liaison descendante [input] et ascendante (output)', 'Encapsulation des styles par défaut']
          },
          {
            title: 'Routage',
            duration: '35 min',
            done: false,
            content: 'Le routeur Angular associe des chemins d\'URL à des composants. Les guards vérifient les autorisations avant d\'activer une route.',
            keyPoints: ['Routes typées et lazy-loading dynamique', 'Guards fonctionnels canActivate pour la sécurité', 'Paramètres de route et query params']
          }
        ]
      }
    ]
  },
  {
    id: 'ia',
    title: 'Introduction à l’intelligence artificielle',
    category: 'Intelligence artificielle',
    level: 'Intermédiaire',
    teacher: 'Dr. Sana Ben Ali',
    description: 'Apprentissage supervisé, réseaux de neurones, LLMs et traitement du langage naturel.',
    progress: 0,
    durationHours: 26,
    topics: ['Apprentissage supervisé vs non supervisé', 'Réseaux de neurones artificiels', 'Rétropropagation du gradient', 'Fonctions d\'activation ReLU et Softmax', 'Architectures Transformers', 'Modèles de langage (LLM) et Prompt Engineering'],
    fullContent: `Ce cours explore les fondements théoriques et appliqués de l'intelligence artificielle et du machine learning moderne.
1. Paradigmes d'apprentissage machine :
- Apprentissage supervisé : le modèle apprend à partir d'exemples étiquetés (données d'entrée X avec cibles y connues). Deux tâches majeures :
  * Régression : prédiction d'une valeur continue (ex: prix d'un bien, température).
  * Classification : prédiction d'une classe discrète (ex: spam ou non-spam, diagnostic médical).
- Apprentissage non supervisé : les données ne comportent pas d'étiquettes. L'algorithme détecte des structures intrinsèques (clustering k-means, réduction de dimension avec PCA).
- Apprentissage par renforcement : un agent apprend en interagissant avec un environnement par essai-erreur, maximisant une récompense cumulative (Q-learning, RLHF).

2. Réseaux de neurones artificiels et Deep Learning :
- Perceptron : unité de base calculant la somme pondérée des entrées plus un biais, passée à travers une fonction d'activation non linéaire.
- Fonctions d'activation :
  * ReLU (Rectified Linear Unit, f(x) = max(0, x)) : la plus utilisée, rapide et évite la disparition du gradient pour les valeurs positives.
  * Sigmoïde : compresse la sortie entre 0 et 1 (idéale pour probabilité binaire).
  * Softmax : transforme un vecteur de scores réels en distribution de probabilités sommant à 1 (idéale pour classification multi-classes).
- Entraînement : calcul de la fonction de perte (Loss), calcul des gradients par Rétropropagation (Backpropagation) et mise à jour des poids via descente de gradient (SGD, Adam).

3. Traitement automatique du langage naturel (NLP) et Transformers :
- L'architecture Transformer (2017) repose sur le mécanisme de Self-Attention (Attention multi-têtes), éliminant la récurrence séquentielle des RNN/LSTM et permettant une parallélisation massive.
- Modèles de langage géants (LLM) : pré-entraînés sur des corpus massifs de texte pour prédire le prochain mot (token), puis alignés (RLHF, DPO) pour suivre les instructions utilisateur.
- Prompt Engineering : technique consistant à formuler des consignes précises, du contexte (few-shot) et des contraintes pour maximiser la pertinence des réponses du modèle.`,
    modules: [
      {
        title: 'Panorama',
        summary: 'Histoire, concepts clés et grandes familles du Machine Learning.',
        lessons: [
          {
            title: 'Histoire et définitions',
            duration: '30 min',
            done: false,
            content: 'L\'IA englobe les systèmes capables d\'effectuer des tâches cognitives. Le Machine Learning en est le sous-domaine où les systèmes apprennent à partir de données sans être explicitement programmés pour chaque règle.',
            keyPoints: ['Supervisé = données étiquetées', 'Non supervisé = découverte de motifs sans labels', 'Par renforcement = agent et récompenses']
          }
        ]
      }
    ]
  },
  {
    id: 'maths',
    title: 'Mathématiques pour l’informatique',
    category: 'Mathématiques',
    level: 'Débutant',
    teacher: 'Dr. Mehdi Jaziri',
    description: 'Logique, ensembles, combinatoire et probabilités discrètes.',
    progress: 100,
    durationHours: 24,
    topics: ['Logique propositionnelle', 'Lois de De Morgan', 'Tables de vérité', 'Théorie des ensembles', 'Combinatoire et dénombrement', 'Probabilités conditionnelles et théorème de Bayes'],
    fullContent: `Ce cours présente les outils mathématiques essentiels pour le raisonnement informatique et l'analyse d'algorithmes.
1. Logique propositionnelle :
- Une proposition est une affirmation vraie (V) ou fausse (F).
- Connecteurs logiques fondamentaux :
  * Négation (NON ¬) : inverse la valeur de vérité.
  * Conjonction (ET ∧) : vraie uniquement si les deux propositions sont vraies.
  * Disjonction (OU ∨) : vraie si au moins l'une des propositions est vraie.
  * Implication (P ⇒ Q) : fausse UNIQUEMENT lorsque P est vraie et Q est fausse.
  * Équivalence (P ⇔ Q) : vraie si P et Q ont la même valeur de vérité.
- Lois de De Morgan :
  * ¬(P ∧ Q) ≡ (¬P) ∨ (¬Q)
  * ¬(P ∨ Q) ≡ (¬P) ∧ (¬Q)

2. Théorie des ensembles :
- Ensemble : collection d'éléments distincts.
- Opérations : Union (A ∪ B), Intersection (A ∩ B), Complémentaire (A\B ou A^c).
- Cardinalité : nombre d'éléments. Formule du crible : |A ∪ B| = |A| + |B| - |A ∩ B|.
- Produit cartésien : A × B contient tous les couples (a, b) avec a ∈ A et b ∈ B.

3. Dénombrement et Combinatoire :
- Factorielle n! = n × (n-1) × ... × 1 (avec 0! = 1).
- Permutation de n éléments distincts : n! manières de les ordonner.
- Combinaisons sans remise C(n, k) = n! / (k! (n-k)!) : choix de k éléments parmi n sans ordre.
- Arrangements A(n, k) = n! / (n-k)! : choix de k éléments parmi n avec ordre.

4. Probabilités discrètes :
- Univers Ω des issues possibles. Probabilité uniforme P(A) = |A| / |Ω|.
- Probabilité conditionnelle P(A|B) = P(A ∩ B) / P(B) pour P(B) > 0.
- Théorème de Bayes : P(A|B) = [P(B|A) × P(A)] / P(B), crucial en apprentissage automatique et filtres bayésiens.`,
    modules: [
      {
        title: 'Logique',
        summary: 'Propositions, connecteurs et tables de vérité.',
        lessons: [
          {
            title: 'Propositions et connecteurs',
            duration: '25 min',
            done: true,
            content: 'La logique formelle structure la conception de conditions algorithmiques et la vérification de programmes.',
            keyPoints: ['Table de vérité de l\'implication P -> Q', 'Lois de De Morgan indispensables pour simplifier les conditions IF', 'Tautologie = toujours vraie']
          }
        ]
      }
    ]
  }
];

export const MOCK_EXERCISES: Exercise[] = [
  { id: 'ex1', title: 'Inverser une liste chaînée', course: 'Algorithmique', difficulty: 'Moyen',
    statement: 'Écrivez une fonction qui inverse une liste simplement chaînée en O(n) et O(1) en mémoire supplémentaire.',
    hints: ['Utilisez trois pointeurs : précédent, courant, suivant.', 'Pensez au cas de la liste vide.'],
    status: 'Terminé', score: 16 },
  { id: 'ex2', title: 'Jointure entre trois tables', course: 'Bases de données', difficulty: 'Moyen',
    statement: 'Écrivez une requête SQL listant, pour chaque étudiant, les cours suivis et la note moyenne.',
    hints: ['Joignez étudiant, inscription et cours.', 'Utilisez GROUP BY avec AVG.'],
    status: 'À faire' },
  { id: 'ex3', title: 'Calcul de complexité', course: 'Algorithmique', difficulty: 'Facile',
    statement: 'Donnez la complexité d’une double boucle imbriquée dont la boucle interne dépend de l’indice externe.',
    hints: ['Sommez le nombre d’itérations.'], status: 'Terminé', score: 18 },
  { id: 'ex4', title: 'Découpage en sous-réseaux', course: 'Réseaux', difficulty: 'Difficile',
    statement: 'Découpez 192.168.10.0/24 en 6 sous-réseaux et donnez la plage d’adresses de chacun.',
    hints: ['Combien de bits faut-il emprunter ?', 'Calculez le masque obtenu.'], status: 'À faire' },
  { id: 'ex5', title: 'Formulaire réactif', course: 'Développement web', difficulty: 'Moyen',
    statement: 'Créez un formulaire d’inscription Angular avec validation de l’e-mail et du mot de passe.',
    hints: ['Utilisez FormBuilder et Validators.'], status: 'À faire' }
];

export const MOCK_QUIZZES: Quiz[] = [
  {
    id: 'q-algo', title: 'Complexité et tris', course: 'Algorithmique et structures de données', courseId: 'algo', difficulty: 'Moyen', durationMin: 10,
    questions: [
      { text: 'Quelle est la complexité moyenne du tri rapide (QuickSort) ?',
        options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], correct: 1,
        explanation: 'Le tri rapide divise le tableau récursivement autour d\'un pivot, d’où O(n log n) en moyenne.' },
      { text: 'Quelle structure suit le principe LIFO (Last In, First Out) ?',
        options: ['File', 'Pile', 'Arbre binaire', 'Graphe'], correct: 1,
        explanation: 'Une pile (Stack) dépile en premier le dernier élément inséré.' },
      { text: 'La recherche dichotomique exige un tableau…',
        options: ['Trié', 'De taille paire', 'Sans doublons', 'De nombres entiers'], correct: 0,
        explanation: 'On compare la valeur cible avec l’élément central, ce qui suppose un tableau trié.' }
    ]
  },
  {
    id: 'q-sql', title: 'Fondamentaux SQL et Modélisation', course: 'Bases de données relationnelles', courseId: 'bdd', difficulty: 'Facile', durationMin: 8,
    questions: [
      { text: 'Quelle clause filtre les groupes après un GROUP BY ?',
        options: ['WHERE', 'HAVING', 'ORDER BY', 'LIMIT'], correct: 1,
        explanation: 'HAVING s’applique aux agrégations de groupes, tandis que WHERE filtre les lignes individuelles.' },
      { text: 'Quelle jointure conserve toutes les lignes de la table de gauche ?',
        options: ['INNER JOIN', 'LEFT JOIN', 'CROSS JOIN', 'SELF JOIN'], correct: 1,
        explanation: 'LEFT JOIN garde toutes les lignes de la table gauche même en l’absence de correspondance à droite.' },
      { text: 'Quelle propriété ACID garantit qu\'une transaction s\'exécute entièrement ou pas du tout ?',
        options: ['Atomicité', 'Cohérence', 'Isolation', 'Durabilité'], correct: 0,
        explanation: 'L\'atomicité assure le principe "tout ou rien" (commit ou rollback).' }
    ]
  },
  {
    id: 'q-net', title: 'Modèle OSI et Réseaux', course: 'Réseaux informatiques', courseId: 'reseaux', difficulty: 'Difficile', durationMin: 12,
    questions: [
      { text: 'Quelle couche OSI gère le routage et l\'adressage logique des paquets ?',
        options: ['Liaison de données (2)', 'Réseau (3)', 'Transport (4)', 'Session (5)'], correct: 1,
        explanation: 'La couche réseau (3) achemine les paquets via les adresses logiques IP.' },
      { text: 'Quel mécanisme TCP établit une connexion fiable avant l\'échange de données ?',
        options: ['Sliding Window', '3-Way Handshake (SYN, SYN-ACK, ACK)', 'Checksum UDP', 'CSMA/CD'], correct: 1,
        explanation: 'TCP utilise la poignée de main en 3 temps (SYN -> SYN-ACK -> ACK) pour synchroniser les numéros de séquence.' }
    ]
  },
  {
    id: 'q-web', title: 'Architecture et Signaux Angular', course: 'Développement web avec Angular', courseId: 'web', difficulty: 'Moyen', durationMin: 10,
    questions: [
      { text: 'Quelle primitive réactive Angular crée une valeur dérivée en lecture seule ?',
        options: ['signal()', 'computed()', 'effect()', 'BehaviorSubject()'], correct: 1,
        explanation: 'computed() définit un signal dérivé mis à jour de façon synchrone et optimisée.' },
      { text: 'Quel mot-clé dans @Component permet d\'utiliser un composant sans NgModule ?',
        options: ['standalone: true / imports direct', 'inline: true', 'isolated: true', 'independent: true'], correct: 0,
        explanation: 'Dans Angular moderne, les composants sont standalone par défaut et déclarent leurs imports directement.' }
    ]
  },
  {
    id: 'q-ia', title: 'Machine Learning et Deep Learning', course: 'Introduction à l’intelligence artificielle', courseId: 'ia', difficulty: 'Moyen', durationMin: 10,
    questions: [
      { text: 'Quel type d\'apprentissage utilise des données étiquetées pour prédire une classe ou valeur ?',
        options: ['Apprentissage supervisé', 'Apprentissage non supervisé', 'Apprentissage par renforcement', 'Clustering K-Means'], correct: 0,
        explanation: 'L\'apprentissage supervisé exploite des exemples avec entrées et labels cibles connus.' },
      { text: 'Quelle fonction d\'activation est définie par f(x) = max(0, x) ?',
        options: ['Sigmoïde', 'Tangente hyperbolique (tanh)', 'ReLU', 'Softmax'], correct: 2,
        explanation: 'ReLU (Rectified Linear Unit) renvoie 0 pour x <= 0 et x pour x > 0.' }
    ]
  }
];

export const MOCK_RECOMMENDATIONS: Recommendation[] = [
  { id: 'r1', title: 'Revoir les jointures SQL', type: 'Cours', priority: 'Haute',
    reason: 'Votre score au quiz SQL est inférieur à 60 % sur les jointures.', link: '/courses/bdd' },
  { id: 'r2', title: 'Exercice : découpage en sous-réseaux', type: 'Exercice', priority: 'Haute',
    reason: 'Le cours Réseaux est à 30 % et cet exercice n’a pas encore été tenté.', link: '/exercises/ex4' },
  { id: 'r3', title: 'Quiz : complexité et tris', type: 'Quiz', priority: 'Moyenne',
    reason: 'Pour consolider le module terminé la semaine dernière.', link: '/quizzes/q-algo' },
  { id: 'r4', title: 'Réviser par sessions courtes de 25 minutes', type: 'Méthode', priority: 'Basse',
    reason: 'Vos sessions longues montrent une baisse de performance après 45 minutes.', link: '/assistant' },
  { id: 'r5', title: 'Commencer l’introduction à l’IA', type: 'Cours', priority: 'Basse',
    reason: 'Correspond à vos centres d’intérêt et à votre niveau.', link: '/courses/ia' }
];

export const MOCK_RESULTS: Result[] = [
  { label: 'Complexité et tris', kind: 'Quiz', course: 'Algorithmique', score: 16, date: '28/09/2026' },
  { label: 'Fondamentaux SQL', kind: 'Quiz', course: 'Bases de données', score: 11, date: '25/09/2026' },
  { label: 'Calcul de complexité', kind: 'Exercice', course: 'Algorithmique', score: 18, date: '23/09/2026' },
  { label: 'Inverser une liste chaînée', kind: 'Exercice', course: 'Algorithmique', score: 16, date: '20/09/2026' },
  { label: 'Modèle OSI', kind: 'Quiz', course: 'Réseaux', score: 9, date: '18/09/2026' }
];

export const MOCK_CHAT: ChatMessage[] = [
  { from: 'assistant', text: 'Bonjour ! Je suis votre assistant d’apprentissage. Posez-moi une question sur vos cours, ou demandez-moi de vous expliquer une notion.' }
];

export const MOCK_CHAT_HISTORY = [
  'Différence entre pile et file',
  'Expliquer la normalisation',
  'Plan de révision réseaux'
];

export const WEEKLY_HOURS = [
  { label: 'Lun', value: 2 },
  { label: 'Mar', value: 3.5 },
  { label: 'Mer', value: 1 },
  { label: 'Jeu', value: 4 },
  { label: 'Ven', value: 2.5 },
  { label: 'Sam', value: 5 },
  { label: 'Dim', value: 1.5 }
];
