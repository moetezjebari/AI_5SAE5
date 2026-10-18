import { Injectable, inject } from '@angular/core';
import { CourseService } from './course.service';
import { Course } from '../models/lms.model';

export interface SummaryResult {
  courseId: string;
  courseTitle: string;
  length: 'Court' | 'Moyen' | 'Détaillé';
  overview: string;
  keyPoints: string[];
  essentialConcepts: Array<{ term: string; explanation: string }>;
  pitfalls: string[];
  keywords: string[];
  studyAdvice: string;
  modelUsed: string;
  generatedAt: string;
}

export interface SummaryOptions {
  courseId: string;
  length: 'Court' | 'Moyen' | 'Détaillé';
  customText?: string;
  apiKey?: string;
  modelName?: string;
}

const GEMINI_STORAGE_KEY = 'lms_gemini_api_key';
export const DEFAULT_GEMINI_KEY = '';

@Injectable({ providedIn: 'root' })
export class AiSummaryService {
  private readonly courseService = inject(CourseService);

  getStoredApiKey(): string {
    return localStorage.getItem(GEMINI_STORAGE_KEY) || DEFAULT_GEMINI_KEY;
  }

  setStoredApiKey(key: string): void {
    if (key?.trim()) {
      localStorage.setItem(GEMINI_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(GEMINI_STORAGE_KEY);
    }
  }

  hasApiKey(): boolean {
    return !!this.getStoredApiKey();
  }

  async generateSummary(options: SummaryOptions): Promise<SummaryResult> {
    const course = this.courseService.getById(options.courseId);
    const title = course ? course.title : 'Document personnalisé';
    const apiKey = options.apiKey?.trim() || this.getStoredApiKey();

    if (apiKey) {
      try {
        return await this.callGeminiSummary(course, options, apiKey);
      } catch (err) {
        console.warn('Erreur appel API Gemini pour le résumé, basculement vers moteur local:', err);
        return this.generateLocalSummary(course, options, 'Moteur IA de Synthèse (Fallback local)');
      }
    }

    return this.generateLocalSummary(course, options, 'Moteur IA de Synthèse Pédagogique');
  }

  private async callGeminiSummary(
    course: Course | undefined,
    options: SummaryOptions,
    apiKey: string
  ): Promise<SummaryResult> {
    const courseContext = course
      ? this.courseService.getDetailedCourseContext(course.id)
      : '';
    const textToSummarize = options.customText?.trim()
      ? `EXTRAIT SPÉCIFIQUE FOURNI PAR L'UTILISATEUR :\n${options.customText}\n\nCONTEXTE DU COURS :\n${courseContext}`
      : courseContext;

    const lengthGuide = {
      Court: 'Synthèse très concise de 2 paragraphes, 3 à 4 points clés, pour une révision rapide en 3 minutes.',
      Moyen: 'Synthèse équilibrée de 3 à 4 paragraphes, 5 points clés et définitions essentielles.',
      Détaillé: 'Fiche de révision exhaustive, analyse approfondie de chaque sous-notion, formules et exemples.'
    }[options.length];

    const prompt = `Tu es un professeur agrégé et expert en pédagogie universitaire.
Génère une synthèse pédagogique structurée et claire à partir du cours suivant.

CONSIGNES DE SYNTHÈSE :
- Format demandé : '${options.length}' -> ${lengthGuide}
- Langue : Français soigné et didactique.
- Retourne STRICTEMENT un JSON valide respectant cette structure exacte, sans aucun texte autour :
{
  "overview": "Paragraphe(s) de synthèse globale présentant les fondements du sujet...",
  "keyPoints": [
    "Point clé 1...",
    "Point clé 2...",
    "Point clé 3..."
  ],
  "essentialConcepts": [
    { "term": "Nom du concept", "explanation": "Définition précise et rôle" }
  ],
  "pitfalls": [
    "Piège fréquent ou confusion à éviter..."
  ],
  "keywords": ["mot-clé 1", "mot-clé 2", "mot-clé 3", "mot-clé 4"],
  "studyAdvice": "Conseil concret pour mémoriser et réussir l'évaluation sur ce sujet."
}

CONTENU À RÉSUMER :
${textToSummarize}`;

    const models = [
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-3.5-flash',
      'gemini-flash-latest',
      'gemini-1.5-flash'
    ];
    let lastError: Error | null = null;

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.3
            }
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Erreur HTTP ${response.status}`);
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) throw new Error('Réponse vide reçue de l\'API Gemini');

        const cleanJson = rawText.trim().replace(/^```json/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(cleanJson);

        return {
          courseId: course?.id || 'custom',
          courseTitle: course?.title || 'Extrait de cours',
          length: options.length,
          overview: parsed.overview || 'Synthèse rédigée par l\'IA.',
          keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
          essentialConcepts: Array.isArray(parsed.essentialConcepts) ? parsed.essentialConcepts : [],
          pitfalls: Array.isArray(parsed.pitfalls) ? parsed.pitfalls : [],
          keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
          studyAdvice: parsed.studyAdvice || 'Révisez régulièrement les définitions fondamentales.',
          modelUsed: `Gemini (${model})`,
          generatedAt: new Date().toLocaleDateString('fr-FR')
        };
      } catch (err: any) {
        lastError = err;
        continue;
      }
    }

    throw lastError || new Error('Échec de la génération avec Gemini');
  }

  private generateLocalSummary(
    course: Course | undefined,
    options: SummaryOptions,
    modelName: string
  ): SummaryResult {
    if (!course) {
      return {
        courseId: 'custom',
        courseTitle: 'Texte analysé',
        length: options.length,
        overview: options.customText
          ? `L'extrait soumis aborde les notions clés suivantes : ${options.customText.slice(0, 150)}...`
          : 'Aucun contenu fourni à analyser.',
        keyPoints: [
          'Identifier les concepts directeurs dans le texte.',
          'Structurer les définitions et cas d\'usage.',
          'Tester la compréhension par des questions ciblées.'
        ],
        essentialConcepts: [
          { term: 'Notion principale', explanation: 'Élément central abordé dans le texte analysé.' }
        ],
        pitfalls: ['Ne pas confondre la terminologie avec des concepts voisins.'],
        keywords: ['analyse', 'synthèse', 'définitions'],
        studyAdvice: 'Relisez le passage attentivement et reformulez avec vos propres mots.',
        modelUsed: modelName,
        generatedAt: new Date().toLocaleDateString('fr-FR')
      };
    }

    // Synthèse adaptée par cours
    const summariesByCourse: Record<string, Partial<SummaryResult>> = {
      algo: {
        overview: `Ce cours d'Algorithmique et structures de données pose les bases de l'efficacité logicielle. Il s'articule autour de l'analyse asymptotique de complexité (notation Grand O) permettant de prédire le passage à l'échelle d'un algorithme, et de la sélection rigoureuse des structures de données (listes chaînées, piles LIFO, files FIFO, ABR et graphes) adaptées aux contraintes temporelles et spatiales des problèmes informatiques.`,
        keyPoints: [
          'La notation Grand O caractérise la complexité dans le pire des cas en négligeant les constantes multiplicatives.',
          'L\'accès par index est en O(1) pour les tableaux, contre O(n) pour les listes chaînées.',
          'Une pile suit le principe LIFO (dernière entrée, première sortie) tandis qu\'une file suit le principe FIFO.',
          'Les Arbres Binaires de Recherche équilibrés garantissent des opérations en O(log n), mais peuvent dégénérer en O(n) en cas d\'insertion ordonnée.',
          'Le parcours en largeur (BFS) utilise une file pour calculer les plus courts chemins non pondérés, tandis que Dijkstra utilise une file de priorité pour les graphes pondérés positivement.'
        ],
        essentialConcepts: [
          { term: 'Notation O(n log n)', explanation: 'Complexité optimale des tris par comparaison (Tri Fusion, QuickSort en moyenne).' },
          { term: 'Arbre Binaire de Recherche (ABR)', explanation: 'Structure hiérarchique ordonnée : sous-arbre gauche < racine ≤ sous-arbre droit.' },
          { term: 'Algorithme de Dijkstra', explanation: 'Calcul glouton des plus courts chemins à partir d\'une source dans un graphe à poids positifs.' }
        ],
        pitfalls: [
          'Confondre complexité au pire des cas et complexité en moyenne (ex: QuickSort est O(n log n) en moyenne mais O(n²) au pire).',
          'Oublier de vérifier la présence de poids négatifs avant d\'appliquer l\'algorithme de Dijkstra.'
        ],
        keywords: ['Grand O', 'QuickSort', 'LIFO / FIFO', 'ABR', 'Dijkstra', 'BFS / DFS'],
        studyAdvice: 'Pratiquez le calcul de boucles imbriquées et dessinez systématiquement l\'état des pointeurs et des arbres lors des insertions.'
      },
      bdd: {
        overview: `Le cours de Bases de données relationnelles enseigne la structuration formelle des données et leur interrogation via le langage SQL standard. De la modélisation conceptuelle (Entité-Association) au schéma relationnel normalisé (1FN, 2FN, 3FN), il détaille les mécanismes d'intégrité référentielle, l'exécution optimisée des jointures et des agrégations, ainsi que la robustesse des transactions garantie par les propriétés ACID.`,
        keyPoints: [
          'Une clé primaire identifie de façon unique et non nulle chaque ligne ; une clé étrangère maintient l\'intégrité référentielle.',
          'INNER JOIN sélectionne l\'intersection stricte des tables, tandis que LEFT JOIN conserve tous les enregistrements de la table gauche.',
          'WHERE filtre les lignes individuelles avant regroupement ; HAVING filtre les groupes calculés par GROUP BY.',
          'La 3ème Forme Normale (3FN) élimine toute dépendance transitive entre colonnes non-clés.',
          'Les propriétés ACID (Atomicité, Cohérence, Isolation, Durabilité) assurent la résilience et la fiabilité totale des transactions financières et critiques.'
        ],
        essentialConcepts: [
          { term: 'Jointure externe (LEFT JOIN)', explanation: 'Conserve toutes les lignes de la table gauche et complète par NULL les correspondances absentes à droite.' },
          { term: 'Clause HAVING', explanation: 'Condition appliquée exclusivement aux résultats des fonctions d\'agrégation (SUM, COUNT, AVG).' },
          { term: 'Propriétés ACID', explanation: 'Règles garantissant qu\'une transaction est exécutée en "tout ou rien" (Atomicité) et pérenne (Durabilité).' }
        ],
        pitfalls: [
          'Utiliser WHERE au lieu de HAVING pour filtrer une fonction d\'agrégation comme COUNT(*) > 5.',
          'Oublier d\'inclure dans la clause GROUP BY toutes les colonnes sélectionnées non agrégées.'
        ],
        keywords: ['Modèle relationnel', 'SQL SELECT', 'INNER / LEFT JOIN', 'GROUP BY / HAVING', '3FN', 'ACID'],
        studyAdvice: 'Rédigez d\'abord vos requêtes SQL étape par étape : FROM + JOIN d\'abord, puis WHERE, puis GROUP BY, et enfin SELECT.'
      },
      reseaux: {
        overview: `Ce cours offre une vue d'ensemble des architectures de communication et des protocoles réseau qui forment l'infrastructure de l'Internet. Il met en regard le modèle théorique OSI à 7 couches et le modèle d'implémentation TCP/IP, tout en détaillant l'adressage IPv4 et le découpage en sous-réseaux (CIDR), la fiabilité de transport TCP face à la légèreté d'UDP, et les services applicatifs majeurs.`,
        keyPoints: [
          'Le modèle OSI divise la communication en 7 couches : Physique (1), Liaison (2), Réseau (3), Transport (4), Session (5), Présentation (6), Application (7).',
          'La couche Réseau (IP) achemine les paquets via des adresses logiques, tandis que la couche Liaison gère les trames et les adresses MAC physiques.',
          'Un masque CIDR /24 réserve 8 bits aux hôtes, offrant 254 adresses utilisables (2^8 - 2).',
          'TCP établit une session fiable par la poignée de main en 3 temps (SYN -> SYN-ACK -> ACK), alors qu\'UDP est sans connexion et optimise la latence.',
          'DNS (port 53) résout les noms de domaine en adresses IP ; DHCP configure dynamiquement les paramètres réseau des machines.'
        ],
        essentialConcepts: [
          { term: 'CIDR et Masque de sous-réseau', explanation: 'Délimite la part réseau (NetID) de la part machine (HostID) dans une adresse IPv4 de 32 bits.' },
          { term: '3-Way Handshake TCP', explanation: 'Protocole de synchronisation initiale assurant que l\'émetteur et le récepteur sont prêts à échanger.' },
          { term: 'Encapsulation', explanation: 'Processus où chaque couche protocolaire enveloppe les données de la couche supérieure avec son propre en-tête.' }
        ],
        pitfalls: [
          'Oublier de soustraire 2 au calcul du nombre d\'hôtes (adresse réseau et adresse de broadcast réservées).',
          'Confondre le rôle de la couche 3 (routage IP inter-réseaux) avec celui de la couche 2 (commutation Ethernet locale).'
        ],
        keywords: ['Modèle OSI', 'IPv4 / CIDR', 'TCP Handshake', 'UDP', 'DNS', 'DHCP'],
        studyAdvice: 'Maîtrisez les puissances de 2 (2, 4, 8, 16, 32, 64, 128, 256) pour calculer instantanément les masques de sous-réseaux.'
      },
      web: {
        overview: `Ce cours explore les architectures d'applications frontend d'entreprise avec Angular moderne. Il couvre l'abandon progressif des modules au profit des composants Standalone, le nouveau paradigme de réactivité granulaire basé sur les Signals (signal, computed, effect), la navigation protégée par des Guards fonctionnels, et l'orchestration des flux HTTP asynchrones.`,
        keyPoints: [
          'Les composants Standalone éliminent le besoin de NgModule et déclarent directement leurs dépendances via le tableau imports.',
          'Les Signals Angular permettent un suivi fin des dépendances et réduisent la dépendance à Zone.js pour la détection de changements.',
          'computed() définit une valeur réactive calculée en lecture seule, mémoïsée et synchronisée avec ses dépendances.',
          'Les intercepteurs HTTP (HttpInterceptorFn) centralisent l\'injection de jetons JWT et la capture des erreurs 401/403.',
          'Les services déclarés avec providedIn: "root" sont des singletons globaux automatiquement tree-shakables.'
        ],
        essentialConcepts: [
          { term: 'Angular Signals', explanation: 'Primitifs réactifs encapsulant une valeur qui notifie ses consommateurs dès qu\'une modification intervient.' },
          { term: 'CanActivateFn', explanation: 'Guard fonctionnel bloquant ou autorisant l\'accès à une route selon l\'état d\'authentification.' },
          { term: 'Data Binding bidirectionnel', explanation: '[(ngModel)] liant dynamiquement la vue HTML et la propriété TypeScript.' }
        ],
        pitfalls: [
          'Modifier un signal directement à l\'intérieur d\'un effect() sans précaution, ce qui risque de créer des boucles infinies de mise à jour.',
          'Ne pas désabonner les Observables RxJS manuels (préférer l\'utilisation du pipe async ou des Signals).'
        ],
        keywords: ['Standalone', 'Signals', 'computed()', 'HttpClient', 'Guards', 'Intercepteurs'],
        studyAdvice: 'Privilégiez les Signals pour l\'état local ou partagé simple, et réservez RxJS pour les flux asynchrones complexes.'
      },
      ia: {
        overview: `Le cours d'Introduction à l'intelligence artificielle dresse le panorama des méthodes d'apprentissage machine et du deep learning contemporain. De la distinction fondamentale entre apprentissage supervisé, non supervisé et par renforcement, jusqu'aux réseaux de neurones profonds et aux architectures Transformers à base de Self-Attention qui alimentent les grands modèles de langage (LLMs).`,
        keyPoints: [
          'L\'apprentissage supervisé exploite des exemples étiquetés pour résoudre des problèmes de régression (valeur continue) ou classification (catégories).',
          'L\'apprentissage non supervisé découvre des groupements spontanés (clustering K-Means) sans aucune étiquette préalable.',
          'La rétropropagation du gradient ajuste itérativement les poids synaptiques pour minimiser la fonction de perte.',
          'La fonction d\'activation ReLU (max(0, x)) prévient efficacement la disparition du gradient dans les réseaux multicouches.',
          'Le mécanisme de Self-Attention des Transformers permet le traitement parallèle de séquences entières sans les limitations récursives des RNNs.'
        ],
        essentialConcepts: [
          { term: 'Rétropropagation (Backpropagation)', explanation: 'Algorithme appliquant la règle de dérivation en chaîne pour calculer le gradient de l\'erreur par rapport à chaque poids.' },
          { term: 'Mécanisme de Self-Attention', explanation: 'Calcul de matrices de scores permettant à chaque mot d\'évaluer l\'importance contextuelle des autres mots d\'une phrase.' },
          { term: 'Fonction Softmax', explanation: 'Transformation vectorielle normalisant des scores arbitraires en une distribution de probabilités sommant à 1.' }
        ],
        pitfalls: [
          'Confondre sous-apprentissage (modèle trop simple) et surapprentissage (modèle mémorisant le bruit du jeu d\'entraînement).',
          'Utiliser l\'exactitude brute (accuracy) sur un jeu de données fortement déséquilibré.'
        ],
        keywords: ['Supervisé / Non supervisé', 'Perceptron', 'Rétropropagation', 'ReLU / Softmax', 'Transformers', 'LLM'],
        studyAdvice: 'Visualisez les étapes du pipeline ML : Collecte -> Nettoyage -> Entraînement -> Validation -> Inférence.'
      },
      maths: {
        overview: `Ce cours de mathématiques discrètes fournit l'outillage formel requis pour le raisonnement logique, la conception d'algorithmes et la cryptographie. Il aborde la logique des propositions, les tables de vérité, les lois de simplification booléenne de De Morgan, la combinatoire fondamentale et le calcul des probabilités conditionnelles avec la formule de Bayes.`,
        keyPoints: [
          'Une implication logique P ⇒ Q n\'est fausse que lorsque l\'hypothèse P est vraie et que la conclusion Q est fausse.',
          'Les lois de De Morgan transforment la négation d\'un ET en OU : ¬(P ∧ Q) ≡ (¬P) ∨ (¬Q).',
          'La combinatoire distingue les permutations n! (ordre total), les arrangements A(n, k) (ordre partiel) et les combinaisons C(n, k) (sans ordre).',
          'La formule des probabilités totales partitionne l\'univers pour calculer la probabilité globale d\'un événement.',
          'Le théorème de Bayes relie la probabilité a posteriori P(A|B) à la probabilité a priori P(A) et à la vraisemblance P(B|A).'
        ],
        essentialConcepts: [
          { term: 'Lois de De Morgan', explanation: 'Règles fondamentales d\'inversion des conjonctions et disjonctions en algèbre de Boole.' },
          { term: 'Combinaisons C(n, k)', explanation: 'Nombre de sous-ensembles de k éléments choisis parmi n sans tenir compte de l\'ordre.' },
          { term: 'Théorème de Bayes', explanation: 'Formule d\'inférence statistique mettant à jour la probabilité d\'une hypothèse à la lumière de nouvelles preuves.' }
        ],
        pitfalls: [
          'Penser que P ⇒ Q signifie que P et Q doivent avoir la même valeur (c\'est l\'équivalence P ⇔ Q).',
          'Confondre combinaisons (pas d\'ordre) et arrangements (l\'ordre compte).'
        ],
        keywords: ['Logique', 'De Morgan', 'Tables de vérité', 'Permutations', 'Combinaisons', 'Théorème de Bayes'],
        studyAdvice: 'Vérifiez vos raisonnements logiques en construisant systématiquement une petite table de vérité sur les cas limites.'
      }
    };

    const specific = summariesByCourse[course.id] || {};

    let overview = specific.overview || course.description;
    let keyPoints = specific.keyPoints || (course.modules.flatMap(m => m.lessons.map(l => l.title)));
    let essentialConcepts = specific.essentialConcepts || [
      { term: course.title, explanation: course.description }
    ];

    if (options.length === 'Court') {
      keyPoints = keyPoints.slice(0, 3);
      essentialConcepts = essentialConcepts.slice(0, 2);
    } else if (options.length === 'Détaillé') {
      overview += `\n\nApprofondissement pédagogique : Ce cours comprend ${course.modules.length} modules structurés (${course.durationHours} heures prévues) supervisés par ${course.teacher}. Les apprenants sont invités à valider chaque notion avant de passer aux exercices appliqués.`;
    }

    return {
      courseId: course.id,
      courseTitle: course.title,
      length: options.length,
      overview,
      keyPoints,
      essentialConcepts,
      pitfalls: specific.pitfalls || ['Éviter les raccourcis sans maîtriser les prérequis fondamentaux.'],
      keywords: specific.keywords || (course.topics || ['LMS', 'Cours', 'Révision']),
      studyAdvice: specific.studyAdvice || 'Alternez lecture de synthèse, fiches mémo et quiz d\'auto-évaluation réguliers.',
      modelUsed: modelName,
      generatedAt: new Date().toLocaleDateString('fr-FR')
    };
  }
}
