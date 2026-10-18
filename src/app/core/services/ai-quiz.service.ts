import { Injectable, inject } from '@angular/core';
import { CourseService } from './course.service';
import { Course, Difficulty, Quiz, QuizQuestion } from '../models/lms.model';

export interface QuizGenerateOptions {
  courseId: string;
  topic?: string;
  difficulty: Difficulty;
  count: number;
  apiKey?: string;
}

export interface GenerationResult {
  quiz: Quiz;
  source: 'gemini' | 'local';
  modelName: string;
  rawError?: string;
}

const GEMINI_STORAGE_KEY = 'lms_gemini_api_key';
export const DEFAULT_GEMINI_KEY = ''; 

@Injectable({ providedIn: 'root' })
export class AiQuizService {
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

  /**
   * Génère un quiz par IA :
   * 1. Si une clé Gemini est configurée (ou passée en paramètre), tente l'appel à Google Gemini API.
   * 2. Si aucune clé n'est fournie ou en cas d'erreur de l'API externe, bascule intelligemment
   *    sur le moteur IA contextuel local basé sur le contenu riche du cours.
   */
  async generateQuiz(options: QuizGenerateOptions): Promise<GenerationResult> {
    const course = this.courseService.getById(options.courseId);
    if (!course) {
      throw new Error(`Cours introuvable avec l'identifiant ${options.courseId}`);
    }

    const apiKey = options.apiKey?.trim() || this.getStoredApiKey();

    if (apiKey) {
      try {
        const geminiResult = await this.callGeminiApi(course, options, apiKey);
        return {
          quiz: geminiResult,
          source: 'gemini',
          modelName: 'Gemini 1.5 Flash'
        };
      } catch (err: unknown) {
        console.warn('Échec de l\'appel API Gemini, basculement sur le moteur IA local:', err);
        const localQuiz = this.generateLocalQuiz(course, options);
        return {
          quiz: localQuiz,
          source: 'local',
          modelName: 'Moteur IA Contextuel (Fallback local)',
          rawError: err instanceof Error ? err.message : String(err)
        };
      }
    }

    // Aucun token API fourni : utilisation du moteur IA contextuel
    const localQuiz = this.generateLocalQuiz(course, options);
    return {
      quiz: localQuiz,
      source: 'local',
      modelName: 'Moteur IA Contextuel'
    };
  }

  /**
   * Appel direct à l'API Google Gemini avec sortie JSON contrainte
   */
  private async callGeminiApi(course: Course, options: QuizGenerateOptions, apiKey: string): Promise<Quiz> {
    const context = this.courseService.getDetailedCourseContext(course.id, options.topic);

    const prompt = `Tu es un professeur d'université et concepteur pédagogique spécialisé dans l'évaluation des apprentissages.
À partir du cours ci-dessous, génère un quiz de type QCM de ${options.count} questions de difficulté '${options.difficulty}'.

CONSIGNES STRICTES :
1. Génère exactement ${options.count} questions pertinentes et variées.
${options.topic ? `2. Focalise les questions en priorité sur le thème : "${options.topic}".` : ''}
3. Niveau requis : '${options.difficulty}'.
   - 'Facile' : définitions fondamentales, concepts clés, syntaxe de base.
   - 'Moyen' : cas pratiques, compréhension approfondie, différences entre mécanismes.
   - 'Difficile' : analyse de cas limites, pièges classiques, calculs ou scénarios complexes.
4. Chaque question doit comporter EXACTEMENT 4 choix ('options').
5. 'correct' doit être un nombre entier entre 0 et 3 désignant la seule bonne réponse dans 'options'.
6. 'explanation' doit détailler pourquoi la bonne réponse est exacte et pourquoi les autres sont fausses.
7. Ne renvoie AUCUN texte en dehors du JSON. Format JSON requis :
{
  "title": "Titre du quiz",
  "questions": [
    {
      "text": "Énoncé de la question",
      "options": ["Choix 0", "Choix 1", "Choix 2", "Choix 3"],
      "correct": 0,
      "explanation": "Explication pédagogique complète."
    }
  ]
}

CONTENU PÉDAGOGIQUE DU COURS :
${context}`;

    const models = [
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-3.5-flash',
      'gemini-flash-latest',
      'gemini-1.5-flash'
    ];
    let lastError: Error | null = null;

    for (const model of models) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }]
              }
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.3
            }
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Erreur HTTP ${response.status} (${response.statusText})`);
        }

        const data = await response.json();
        const rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawJsonText) {
          throw new Error('Réponse vide reçue de l\'API Gemini');
        }

        const cleanJson = rawJsonText.trim().replace(/^```json/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(cleanJson);

        if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
          throw new Error('Le format JSON retourné ne contient pas de liste de questions valide');
        }

        const validatedQuestions: QuizQuestion[] = parsed.questions.map((q: any, idx: number) => {
          const opts: string[] = Array.isArray(q.options) && q.options.length >= 2
            ? q.options.slice(0, 4).map(String)
            : ['Vrai', 'Faux', 'Partiellement vrai', 'Non applicable'];

          let correctIdx = typeof q.correct === 'number' ? q.correct : 0;
          if (correctIdx < 0 || correctIdx >= opts.length) correctIdx = 0;

          return {
            text: String(q.text || `Question ${idx + 1} sur ${course.title}`),
            options: opts,
            correct: correctIdx,
            explanation: String(q.explanation || 'Explication basée sur le cours.')
          };
        });

        return {
          id: `quiz-ai-${Date.now()}`,
          title: parsed.title || `Quiz IA : ${course.title}${options.topic ? ` (${options.topic})` : ''}`,
          course: course.title,
          courseId: course.id,
          difficulty: options.difficulty,
          durationMin: Math.max(5, Math.ceil(validatedQuestions.length * 2.5)),
          questions: validatedQuestions,
          isAiGenerated: true,
          aiModel: model,
          createdAt: new Date().toLocaleDateString('fr-FR')
        };
      } catch (e: any) {
        lastError = e;
        // Si c'est une 404 du modèle, on tente le suivant dans la boucle
        continue;
      }
    }

    throw lastError || new Error('Impossible d\'appeler l\'API Gemini');
  }

  /**
   * Moteur IA contextuel local :
   * Analyse le cours sélectionné, ses modules, ses leçons et ses points clés
   * pour produire un quiz dynamique de haute qualité sans dépendance externe.
   */
  private generateLocalQuiz(course: Course, options: QuizGenerateOptions): Quiz {
    const questions: QuizQuestion[] = [];
    const pool = this.extractCourseQuestionPool(course, options.topic);

    // Filtrage et tri selon la difficulté demandée
    let eligible = pool.filter(p => p.difficulty === options.difficulty);
    if (eligible.length < options.count) {
      eligible = [...eligible, ...pool.filter(p => p.difficulty !== options.difficulty)];
    }

    // Mélange aléatoire
    const shuffled = [...eligible].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(options.count, shuffled.length));

    for (const item of selected) {
      questions.push({
        text: item.text,
        options: [...item.options],
        correct: item.correct,
        explanation: item.explanation
      });
    }

    // Si on manque encore de questions pour atteindre le compte demandé, on en génère synthétiquement
    while (questions.length < options.count) {
      const idx = questions.length + 1;
      questions.push({
        text: `Concernant "${course.title}", quelle affirmation résume le mieux l'objectif du cours ?`,
        options: [
          course.description,
          'Une approche purement théorique sans cas pratiques ni exercices.',
          'Une étude historique sans lien avec les applications contemporaines.',
          'Une méthodologie obsolète remplacée par les langages récents.'
        ],
        correct: 0,
        explanation: `La description exacte du cours spécifie : "${course.description}".`
      });
    }

    return {
      id: `quiz-ai-local-${Date.now()}`,
      title: `Quiz IA : ${course.title}${options.topic ? ` (${options.topic})` : ''}`,
      course: course.title,
      courseId: course.id,
      difficulty: options.difficulty,
      durationMin: Math.max(5, Math.ceil(questions.length * 2.5)),
      questions,
      isAiGenerated: true,
      aiModel: 'Moteur IA Contextuel',
      createdAt: new Date().toLocaleDateString('fr-FR')
    };
  }

  /**
   * Base de connaissances contextuelle extraite des cours de la plateforme LMS
   */
  private extractCourseQuestionPool(course: Course, specificTopic?: string): Array<{
    text: string;
    options: string[];
    correct: number;
    explanation: string;
    difficulty: Difficulty;
  }> {
    const list: Array<{
      text: string;
      options: string[];
      correct: number;
      explanation: string;
      difficulty: Difficulty;
    }> = [];

    // Selon le cours
    if (course.id === 'algo') {
      list.push(
        {
          text: 'Quelle est la complexité dans le pire des cas de la recherche dans un Arbre Binaire de Recherche dégénéré ?',
          options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
          correct: 2,
          explanation: 'Si les insertions sont ordonnées, l\'ABR devient semblable à une liste simplement chaînée de hauteur n, rendant la recherche en O(n).',
          difficulty: 'Difficile'
        },
        {
          text: 'Quel parcours d\'un Arbre Binaire de Recherche produit une séquence de valeurs triées par ordre croissant ?',
          options: ['Parcours préfixe', 'Parcours infixe (In-Order)', 'Parcours postfixe', 'Parcours en largeur'],
          correct: 1,
          explanation: 'Le parcours infixe visite le sous-arbre gauche (plus petit), la racine, puis le sous-arbre droit (plus grand).',
          difficulty: 'Moyen'
        },
        {
          text: 'Quelle structure de données est naturellement utilisée pour implémenter un parcours en largeur (BFS) dans un graphe ?',
          options: ['Une pile (Stack)', 'Une file (Queue)', 'Un tas binaire (Heap)', 'Une table de hachage'],
          correct: 1,
          explanation: 'Le BFS explore niveau par niveau, ce qui correspond exactement au principe FIFO géré par une file.',
          difficulty: 'Facile'
        },
        {
          text: 'Quelle condition est obligatoire pour appliquer l\'algorithme de Dijkstra sur un graphe pondéré ?',
          options: [
            'Tous les poids des arêtes doivent être positifs ou nuls',
            'Le graphe ne doit contenir aucun cycle',
            'Le graphe doit obligatoirement être un arbre',
            'Le nombre de sommets doit être une puissance de 2'
          ],
          correct: 0,
          explanation: 'L\'algorithme glouton de Dijkstra ne fonctionne correctement que si toutes les pondérations sont positives (sinon il faut Bellman-Ford).',
          difficulty: 'Difficile'
        },
        {
          text: 'Quelle est la complexité de l\'opération "pop" ou "push" sur une pile implémentée par liste chaînée ?',
          options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
          correct: 0,
          explanation: 'Insérer ou supprimer au sommet (tête de liste) ne nécessite aucune boucle, donc s\'effectue en temps constant O(1).',
          difficulty: 'Facile'
        },
        {
          text: 'Quelle est la complexité asymptotique de l\'algorithme de Tri Fusion (Merge Sort) au pire des cas ?',
          options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2^n)'],
          correct: 1,
          explanation: 'Le Tri Fusion divise le tableau en deux moitiés (log n niveaux) et fusionne les éléments en O(n) par niveau, soit O(n log n) garanti.',
          difficulty: 'Moyen'
        }
      );
    } else if (course.id === 'bdd') {
      list.push(
        {
          text: 'Quelle est la différence fondamentale entre la clause WHERE et la clause HAVING en SQL ?',
          options: [
            'WHERE filtre les lignes avant agrégation, tandis que HAVING filtre les groupes après agrégation',
            'HAVING s\'applique aux tables temporaires, WHERE aux tables permanentes',
            'WHERE ne fonctionne qu\'avec des nombres, HAVING avec des chaînes de caractères',
            'Il n\'y a aucune différence, ce sont deux alias interchangeables'
          ],
          correct: 0,
          explanation: 'WHERE sélectionne les tuples individuels avant l\'opération de regroupement (GROUP BY), tandis que HAVING teste les résultats de calculs agrégés (SUM, COUNT, etc.).',
          difficulty: 'Moyen'
        },
        {
          text: 'Que garantit la 3ème Forme Normale (3FN) par rapport à la 2FN ?',
          options: [
            'Toutes les colonnes contiennent des valeurs atomiques',
            'Aucune dépendance transitive entre attributs non-clés n\'est permise',
            'Chaque table doit posséder au moins deux clés étrangères',
            'Tous les index doivent être uniques'
          ],
          correct: 1,
          explanation: 'La 3FN impose qu\'un attribut non-clé ne dépende d\'aucun autre attribut non-clé (absence de transitivité A -> B -> C).',
          difficulty: 'Difficile'
        },
        {
          text: 'Dans une transaction relationnelle, quelle propriété ACID assure la persistance des données après validation (COMMIT) ?',
          options: ['Atomicité', 'Cohérence', 'Isolation', 'Durabilité'],
          correct: 3,
          explanation: 'La durabilité garantit que même en cas de crash électrique ou matériel juste après le COMMIT, les données écrites restent conservées.',
          difficulty: 'Facile'
        },
        {
          text: 'Quelle jointure retourne toutes les lignes de la table droite même si la table gauche n\'a pas de correspondance ?',
          options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'CROSS JOIN'],
          correct: 2,
          explanation: 'RIGHT JOIN conserve l\'intégralité des enregistrements de la table spécifiée à droite du mot-clé JOIN.',
          difficulty: 'Facile'
        },
        {
          text: 'Que retourne l\'expression SQL "COUNT(colonne)" si certaines lignes de la table ont la valeur NULL dans cette colonne ?',
          options: [
            'Elle compte uniquement les lignes où colonne n\'est pas NULL',
            'Elle compte toutes les lignes y compris les NULL',
            'Elle lève une exception SQL d\'erreur d\'exécution',
            'Elle retourne toujours NULL'
          ],
          correct: 0,
          explanation: 'COUNT(colonne) ignore les valeurs NULL, contrairement à COUNT(*) qui compte toutes les lignes de la table.',
          difficulty: 'Moyen'
        }
      );
    } else if (course.id === 'reseaux') {
      list.push(
        {
          text: 'Dans le modèle OSI, à quelle couche intervient l\'adressage logique des paquets IP et le routage ?',
          options: ['Couche 2 (Liaison)', 'Couche 3 (Réseau)', 'Couche 4 (Transport)', 'Couche 5 (Session)'],
          correct: 1,
          explanation: 'La couche réseau (3) est responsable du routage des paquets via les adresses logiques IPv4 ou IPv6.',
          difficulty: 'Facile'
        },
        {
          text: 'Combien d\'adresses d\'hôtes utilisables possède un sous-réseau IPv4 avec un masque /26 ?',
          options: ['64', '62', '32', '30'],
          correct: 1,
          explanation: '/26 laisse 32 - 26 = 6 bits pour les hôtes. Le nombre d\'adresses total est 2^6 = 64, et les adresses utilisables sont 64 - 2 (réseau et broadcast) = 62.',
          difficulty: 'Difficile'
        },
        {
          text: 'Quelles sont les 3 étapes de la négociation TCP (3-way handshake) à l\'établissement d\'une connexion ?',
          options: [
            'SYN -> SYN-ACK -> ACK',
            'HELLO -> READY -> OK',
            'PING -> PONG -> ACK',
            'CONNECT -> ACCEPT -> CONNECTED'
          ],
          correct: 0,
          explanation: 'Le client envoie SYN, le serveur répond avec SYN-ACK, puis le client confirme avec ACK avant d\'échanger les données.',
          difficulty: 'Moyen'
        },
        {
          text: 'Pourquoi le protocole UDP est-il privilégié pour le streaming en direct et la voix sur IP (VoIP) ?',
          options: [
            'Il garantit qu\'aucun paquet n\'est jamais perdu',
            'Il chiffre automatiquement les communications',
            'Il fonctionne sans connexion ni retransmission, offrant une latence minimale',
            'Il utilise les mêmes ports que HTTPS'
          ],
          correct: 2,
          explanation: 'UDP privilégie la vitesse et le temps réel au détriment de la réémission des paquets égarés.',
          difficulty: 'Moyen'
        },
        {
          text: 'Quel protocole réseau traduit un nom d\'hôte (ex: google.com) en adresse IP numérique ?',
          options: ['DHCP (port 67)', 'DNS (port 53)', 'ARP', 'SNMP'],
          correct: 1,
          explanation: 'Le Domain Name System (DNS) résout les noms de domaine en adresses IP sur le port UDP/TCP 53.',
          difficulty: 'Facile'
        }
      );
    } else if (course.id === 'web') {
      list.push(
        {
          text: 'Quelle fonction Angular crée une valeur dérivée réactive en lecture seule recalculée automatiquement ?',
          options: ['signal()', 'computed()', 'effect()', 'mutate()'],
          correct: 1,
          explanation: 'computed() crée un signal dérivé qui se recalcule de façon synchrone et mémoïsée dès qu\'un signal dépendant change.',
          difficulty: 'Facile'
        },
        {
          text: 'Dans Angular moderne, comment configure-t-on un composant pour qu\'il ne dépende pas d\'un NgModule ?',
          options: [
            'En définissant standalone: true ou en omettant NgModule avec imports directs',
            'En le déclarant dans le fichier tsconfig.json',
            'En utilisant la directive @StandaloneModule',
            'Ce n\'est pas possible dans Angular'
          ],
          correct: 0,
          explanation: 'Depuis Angular 14+, les composants standalone importent directement leurs dépendances sans nécessiter de module.',
          difficulty: 'Facile'
        },
        {
          text: 'Quelle interface ou signature fonctionnelle permet d\'intercepter et modifier les requêtes HTTP dans Angular ?',
          options: ['HttpInterceptorFn', 'RouterGuardFn', 'ChangeDetectionStrategy', 'PipeTransform'],
          correct: 0,
          explanation: 'HttpInterceptorFn intercepte la requête HttpRequest et transmet au handler HttpHandlerFn (ex: ajout de token Bearer).',
          difficulty: 'Moyen'
        },
        {
          text: 'Quelle syntaxe de liaison dans un template Angular lie un événement utilisateur à une méthode de composant ?',
          options: ['[click]="action()"', '(click)="action()"', '{{ click: action() }}', 'bind:click="action()"'],
          correct: 1,
          explanation: 'Les parenthèses () représentent l\'Event Binding dans la syntaxe de template Angular.',
          difficulty: 'Facile'
        },
        {
          text: 'Quelle est la portée par défaut d\'un service déclaré avec @Injectable({ providedIn: \'root\' }) ?',
          options: [
            'Singleton instancié une seule fois pour toute l\'application',
            'Créé à nouveau pour chaque composant qui l\'injecte',
            'Accessible uniquement dans le layout principal',
            'Limité aux requêtes HTTP sortantes'
          ],
          correct: 0,
          explanation: 'providedIn: \'root\' crée un singleton partagé dans toute l\'application et permet le tree-shaking.',
          difficulty: 'Moyen'
        }
      );
    } else if (course.id === 'ia') {
      list.push(
        {
          text: 'Quelle est la formule mathématique de la fonction d\'activation ReLU (Rectified Linear Unit) ?',
          options: ['f(x) = 1 / (1 + e^-x)', 'f(x) = max(0, x)', 'f(x) = tanh(x)', 'f(x) = e^x / Σ e^x'],
          correct: 1,
          explanation: 'ReLU renvoie 0 pour toute entrée négative et la valeur x elle-même pour toute entrée positive.',
          difficulty: 'Facile'
        },
        {
          text: 'Quel mécanisme clé permet aux architectures Transformers d\'analyser les relations entre tous les mots sans récurrence ?',
          options: ['Convolution spatiale 2D', 'Self-Attention (Attention multi-têtes)', 'Pooling moyen', 'Descente de gradient stochastique'],
          correct: 1,
          explanation: 'Le mécanisme de Self-Attention calcule le score d\'affinité entre chaque token et tous les autres tokens de la séquence.',
          difficulty: 'Moyen'
        },
        {
          text: 'Quelle technique d\'apprentissage machine regroupe des données sans aucune étiquette préalable ?',
          options: ['Régression linéaire', 'Apprentissage non supervisé (ex: K-Means)', 'Classification supervisée', 'Q-Learning'],
          correct: 1,
          explanation: 'L\'apprentissage non supervisé découvre des patterns et clusters intrinsèques sans supervision ni étiquettes cibles.',
          difficulty: 'Facile'
        },
        {
          text: 'Pourquoi la fonction Softmax est-elle couramment utilisée dans la couche de sortie d\'un réseau de classification multi-classes ?',
          options: [
            'Elle compresse les scores réels en probabilités dont la somme est égale à 1',
            'Elle annule tous les poids négatifs',
            'Elle accélère la vitesse du CPU',
            'Elle élimine le besoin d\'un jeu de données de test'
          ],
          correct: 0,
          explanation: 'Softmax transforme les logits en une distribution probabiliste valide où chaque probabilité est entre 0 et 1 et la somme vaut 1.',
          difficulty: 'Moyen'
        },
        {
          text: 'Quel phénomène se produit lorsque les gradients deviennent exponentiellement faibles lors de la rétropropagation ?',
          options: ['Explosion du gradient', 'Disparition du gradient (Vanishing Gradient)', 'Sous-apprentissage rapide', 'Surapprentissage immédiat'],
          correct: 1,
          explanation: 'Le Vanishing Gradient empêche la mise à jour des poids des premières couches dans les réseaux profonds, résolu par ReLU et les connexions résiduelles.',
          difficulty: 'Difficile'
        }
      );
    } else if (course.id === 'maths') {
      list.push(
        {
          text: 'D\'après les lois de De Morgan, quelle est la négociation exacte de la proposition (A ∧ B) ?',
          options: ['(¬A) ∧ (¬B)', '(¬A) ∨ (¬B)', '¬(A ∨ B)', 'A ∨ B'],
          correct: 1,
          explanation: 'La négation d\'un ET logique est la disjonction (OU) des négations : NON(A ET B) = (NON A) OU (NON B).',
          difficulty: 'Facile'
        },
        {
          text: 'Quand l\'implication logique "P ⇒ Q" est-elle FAUSSE ?',
          options: [
            'Lorsque P est vraie et Q est fausse',
            'Lorsque P est fausse et Q est vraie',
            'Lorsque P et Q sont toutes les deux fausses',
            'Elle n\'est jamais fausse'
          ],
          correct: 0,
          explanation: 'Une promesse P => Q n\'est violée que si l\'hypothèse P se réalise et que la conclusion Q ne se réalise pas.',
          difficulty: 'Moyen'
        },
        {
          text: 'Combien de manières y a-t-il d\'ordonner 4 livres distincts sur une étagère ?',
          options: ['4', '16', '24 (4!)', '12'],
          correct: 2,
          explanation: 'Le nombre de permutations de 4 éléments distincts vaut 4! = 4 × 3 × 2 × 1 = 24.',
          difficulty: 'Facile'
        },
        {
          text: 'Quel théorème mathématique relie la probabilité a posteriori P(A|B) à la probabilité a priori P(A) ?',
          options: ['Théorème de Pythagore', 'Théorème de Bayes', 'Loi des grands nombres', 'Théorème central limite'],
          correct: 1,
          explanation: 'La formule de Bayes stipule P(A|B) = [P(B|A) × P(A)] / P(B), fondement des classificateurs bayésiens.',
          difficulty: 'Moyen'
        }
      );
    }

    return list;
  }
}
