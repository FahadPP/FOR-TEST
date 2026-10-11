/**
 * Academic Tracker Data Types
 */

export interface CourseResource {
  id: string;
  title: string;
  type: "file" | "link";
  url: string;
  category: "lectures" | "exams" | "links"; // محاضرات، اختبارات سابقة، روابط مفيدة
  createdAt: string;
}

export interface CourseGrades {
  assignments: number; // e.g., 18
  assignmentsMax: number; // e.g., 20
  quizzes: number; // e.g., 15
  quizzesMax: number; // e.g., 20
  midterm: number; // e.g., 25
  midtermMax: number; // e.g., 30
  finalWeight: number; // e.g., 30 (%)
}

export interface Flashcard {
  front: string;
  back: string;
  box?: number; // Leitner Box (1-5)
  nextReviewDate?: string; // YYYY-MM-DD
  status?: "new" | "review" | "learned";
  isTeacherHighlighted?: boolean; // تلميح / تنويه المعلم (مهم للاختبار)
}

export interface MCQ {
  question: string;
  options: string[];
  answerIndex: number;
  isTeacherHighlighted?: boolean; // تلميح / تنويه المعلم (مهم للاختبار)
}

export interface MindMapNode {
  topic: string;
  branches: {
    title: string;
    subpoints: string[];
  }[];
}

export interface StudyMaterial {
  textContext?: string;
  summary?: string;
  flashcards?: Flashcard[];
  quizzes?: MCQ[];
  mindMap?: MindMapNode;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  instructor: string;
  color: string; // Tailwind bg color class prefix, e.g., 'emerald', 'sky', 'rose'
  schedule: {
    day: string; // e.g., 'الأحد', 'الاثنين'
    time: string; // e.g., '10:00 - 11:30'
  }[];
  resources?: CourseResource[];
  grades?: CourseGrades;
  studyMaterial?: StudyMaterial;
}

export type LectureStatus = 'attended' | 'missed' | 'scheduled';

export interface Lecture {
  id: string;
  courseId: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: LectureStatus;
  notes: string;
  summary?: string; // Cache for AI summary
  summaryLoading?: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export type AssignmentPriority = 'high' | 'medium' | 'low';
export type AssignmentStatus = 'pending' | 'submitted' | 'graded';
export type AssignmentType = 'assignment' | 'discussion' | 'project' | 'quiz' | 'other';

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  priority: AssignmentPriority;
  status: AssignmentStatus;
  type?: AssignmentType;
  grade?: string; // e.g., 'A', '95/100', etc.
  explanation?: string; // Cache for AI explanation/hint
  explanationLoading?: boolean;
  subtasks?: Subtask[]; // مهام فرعية مقسمة
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachment?: {
    name: string;
    mimeType: string;
    data: string;
  };
}

export interface StickyNote {
  id: string;
  content: string;
  color: string; // yellow, pink, blue, green, purple
  createdAt: string; // ISO string
}

export interface UserProfile {
  name: string;
  major: string;
  university: string;
}

