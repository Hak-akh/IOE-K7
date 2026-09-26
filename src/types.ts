export type QuestionType =
  | 'multiple_choice'
  | 'fill_blank'
  | 'word_order'
  | 'listening_multiple_choice'
  | 'listening_fill'
  | 'pronunciation'
  | 'stress'
  | 'odd_one_out'
  | 'image_fill'
  | 'image_multiple_choice';

export interface VocabularyItem {
  word: string;
  pos: string; // n, v, adj, adv, prep
  ipa?: string;
  meaning: string;
}

export interface Question {
  id: string;
  number: number;
  type: QuestionType;
  question: string;
  options?: string[];
  answer: string;
  audio?: string | null;
  vietnameseTranslation: string;
  explanation: string;
  grammarPoint: string;
  vocabulary: VocabularyItem[];
  hints: string[];
  learning?: {
    vietnameseTranslation?: string;
    translation?: string;
    explanation?: string;
    grammar?: string;
    vocabulary?: VocabularyItem[];
    hints?: string[];
  };
}

export interface QuestionSetData {
  examId: string;
  setId: string;
  title: string;
  totalQuestions: number;
  questions: Question[];
}

export interface SetMeta {
  setId: string;
  examId: string;
  title: string;
  totalQuestions: number;
  file: string;
}

export interface SetsIndexData {
  title: string;
  totalSets: number;
  totalQuestions: number;
  sets: SetMeta[];
}

export interface QuestionProgress {
  userAnswer: string;
  isCorrect: boolean;
  timestamp: number;
}

export interface ExamRecord {
  id: string;
  setId: string;
  title: string;
  score: number; // calculated according to IOE point scale, e.g. 10 points per question
  correctCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  date: string;
  answers: Record<string, { userAnswer: string; isCorrect: boolean }>;
}

export interface UserSettings {
  soundEnabled: boolean;
  autoSpeak: boolean;
  fontSize: 'normal' | 'large' | 'huge';
  darkMode: boolean;
  instantFeedback: boolean;
}

export interface UserProgress {
  answers: Record<string, QuestionProgress>;
  bookmarkedIds: string[];
  wrongQuestionIds: string[];
  examHistory: ExamRecord[];
  settings: UserSettings;
}
