export interface Flashcard {
  question: string;
  answer: string;
}

export interface ExamQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  unit: string;
}

export interface MockExam {
  questions: ExamQuestion[];
}

export interface AIResponse {
  role: 'user' | 'assistant' | 'system' | 'model';
  content: string;
}

export interface StudySession {
  id: string;
  title: string;
  created_at?: string;
  messages: AIResponse[];
}
