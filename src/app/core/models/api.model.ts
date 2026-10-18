// DTOs mirroring the Spring Boot backend (see backend/src/main/java/com/aisae/lms/**/dto).
// These are the real, persisted courses/quizzes/performance records — never mock data.

export type ApiRole = 'STUDENT' | 'TEACHER' | 'ADMIN';
export type ApiCourseLevel = 'DEBUTANT' | 'INTERMEDIAIRE' | 'AVANCE';
export type ApiStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type ApiQuizDifficulty = 'FACILE' | 'MOYEN' | 'DIFFICILE';
export type ApiQuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
export type ApiAttemptStatus = 'IN_PROGRESS' | 'SUBMITTED';
export type ApiProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type RecommendationType = 'COURSE' | 'QUIZ';
export type RecommendationPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type RecommendationAction = 'OPEN_COURSE' | 'START_QUIZ';

export interface ApiUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: ApiRole;
}

export interface ApiAuthResponse {
  token: string;
  user: ApiUser;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ApiLesson {
  id?: number;
  title: string;
  content?: string;
  topic?: string;
  durationMinutes: number;
  position: number;
}

export interface ApiCourse {
  id: number;
  title: string;
  description?: string;
  subject: string;
  level: ApiCourseLevel;
  estimatedDurationMinutes: number;
  status: ApiStatus;
  createdBy: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  lessons?: ApiLesson[] | null;
}

export interface ApiQuizOption {
  id?: number;
  optionText: string;
  correct?: boolean | null;
  position: number;
}

export interface ApiQuizQuestion {
  id?: number;
  questionText: string;
  questionType: ApiQuestionType;
  topic?: string;
  points: number;
  position: number;
  options: ApiQuizOption[];
}

export interface ApiQuiz {
  id: number;
  courseId: number;
  courseTitle: string;
  title: string;
  description?: string;
  difficulty: ApiQuizDifficulty;
  durationMinutes: number;
  passingScore: number;
  status: ApiStatus;
  questionCount: number;
  questions?: ApiQuizQuestion[] | null;
}

export interface AnswerSubmission {
  questionId: number;
  selectedOptionIds: number[];
}

export interface AttemptAnswerResult {
  questionId: number;
  questionText: string;
  topic?: string;
  correct: boolean;
  pointsEarned: number;
  selectedOptionIds: number[];
  correctOptionIds: number[];
}

export interface AttemptResult {
  attemptId: number;
  quizId: number;
  quizTitle: string;
  courseId: number;
  courseTitle: string;
  status: ApiAttemptStatus;
  score: number | null;
  totalPossibleScore: number | null;
  scorePercent: number;
  correctCount: number | null;
  questionCount: number;
  passed: boolean;
  startedAt: string;
  submittedAt: string | null;
  timeSpentSeconds: number | null;
  answers: AttemptAnswerResult[];
}

export interface CourseProgress {
  courseId: number;
  courseTitle: string;
  subject: string;
  status: ApiProgressStatus;
  progressPercent: number;
  startedAt: string | null;
  completedAt: string | null;
}

export interface LearningActivityItem {
  id: number;
  type: 'COURSE_STARTED' | 'LESSON_COMPLETED' | 'COURSE_COMPLETED' | 'QUIZ_ATTEMPTED';
  description: string;
  courseId: number | null;
  courseTitle: string | null;
  quizId: number | null;
  quizTitle: string | null;
  createdAt: string;
}

export interface ScoreTrendPoint {
  attemptId: number;
  quizTitle: string;
  courseTitle: string;
  scorePercent: number;
  submittedAt: string;
}

export interface TopicPerformance {
  topic: string;
  questionsAnswered: number;
  correctAnswers: number;
  accuracyPercent: number;
  sufficientEvidence: boolean;
  classification: 'STRONG' | 'WEAK' | 'NEUTRAL' | 'INSUFFICIENT_EVIDENCE';
}

export interface DashboardStats {
  totalCoursesEnrolled: number;
  coursesCompleted: number;
  coursesInProgress: number;
  overallProgressPercent: number;
  averageQuizScorePercent: number;
  totalQuizAttempts: number;
  courseProgress: CourseProgress[];
  recentActivities: LearningActivityItem[];
  scoreTrend: ScoreTrendPoint[];
  topicStrengths: TopicPerformance[];
  topicWeaknesses: TopicPerformance[];
}

export interface RecommendationItem {
  type: RecommendationType;
  resourceId: number;
  title: string;
  reason: string;
  priority: RecommendationPriority;
  action: RecommendationAction;
}

export interface RecommendationResponse {
  summary: string;
  recommendations: RecommendationItem[];
  source: 'gemini' | 'fallback';
  modelUsed: string;
  generatedAt: string;
}

export interface CourseUpsertPayload {
  title: string;
  description?: string;
  subject: string;
  level: ApiCourseLevel;
  estimatedDurationMinutes: number;
  status: ApiStatus;
  lessons?: {
    id?: number;
    title: string;
    content?: string;
    topic?: string;
    durationMinutes: number;
    position: number;
  }[];
}

export interface QuizUpsertPayload {
  courseId: number;
  title: string;
  description?: string;
  difficulty: ApiQuizDifficulty;
  durationMinutes: number;
  passingScore: number;
  status: ApiStatus;
  questions: {
    id?: number;
    questionText: string;
    questionType: ApiQuestionType;
    topic?: string;
    points: number;
    position: number;
    options: {
      id?: number;
      optionText: string;
      correct?: boolean | null;
      position: number;
    }[];
  }[];
}

export interface TeacherRecommendation {
  id: number;
  teacherId: number;
  teacherName: string;
  studentId: number;
  studentName: string;
  studentEmail: string;
  courseId: number;
  courseTitle: string;
  courseSubject?: string;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
  updatedAt?: string;
}

export interface TeacherRecommendationPayload {
  studentId?: number | null;
  studentEmail?: string;
  courseId?: number | null;
  courseTitle?: string;
  reason: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface StudentOption {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface CourseOption {
  id: number;
  title: string;
  subject?: string;
  level?: string;
}

export interface QuizRecommendationItem {
  quizId: number;
  title: string;
  courseId: number;
  courseTitle: string;
  difficulty: 'FACILE' | 'MOYEN' | 'DIFFICILE';
  durationMinutes: number;
  passingScore: number;
  bestScore: number | null;
  lastScore: number | null;
  attemptCount: number;
  status: 'NOT_STARTED' | 'NEEDS_IMPROVEMENT' | 'REVIEW_SUGGESTED' | 'EXPLORATION';
  statusLabel: string;
  primaryTopic?: string | null;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
}

export interface QuizRecommendationResponse {
  summary: string;
  recommendations: QuizRecommendationItem[];
  source: 'gemini' | 'fallback';
  modelUsed: string;
  generatedAt: string;
  cached: boolean;
}

