export type Level = 'Débutant' | 'Intermédiaire' | 'Avancé';
export type Difficulty = 'Facile' | 'Moyen' | 'Difficile';

export interface Lesson {
  title: string;
  duration: string;
  done: boolean;
  content?: string;
  keyPoints?: string[];
}

export interface CourseModule {
  title: string;
  summary?: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  category: string;
  level: Level;
  teacher: string;
  description: string;
  progress: number;
  durationHours: number;
  modules: CourseModule[];
  fullContent?: string;
  topics?: string[];
}

export interface Exercise {
  id: string;
  title: string;
  course: string;
  difficulty: Difficulty;
  statement: string;
  hints: string[];
  status: 'À faire' | 'Terminé';
  score?: number;
}

export interface QuizQuestion {
  text: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  course: string;
  courseId?: string;
  difficulty: Difficulty;
  durationMin: number;
  questions: QuizQuestion[];
  isAiGenerated?: boolean;
  aiModel?: string;
  createdAt?: string;
}

export type RecommendationType = 'Cours' | 'Exercice' | 'Quiz' | 'Méthode';

export interface Recommendation {
  id: string;
  title: string;
  type: RecommendationType;
  priority: 'Haute' | 'Moyenne' | 'Basse';
  reason: string;
  link: string;
}

export interface ChatMessage {
  from: 'user' | 'assistant';
  text: string;
}

export interface Result {
  label: string;
  kind: 'Quiz' | 'Exercice';
  course: string;
  score: number;
  date: string;
}
