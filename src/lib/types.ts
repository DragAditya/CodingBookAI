import { z } from 'zod';

// Zod schemas for runtime validation
export const QuestionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  topics: z.array(z.string()).min(1).max(10),
  description: z.string().min(10).max(2000),
  example: z.object({
    input: z.string().min(1),
    output: z.string().min(1),
    explanation: z.string().min(1),
  }),
  solution_python: z.string().min(1),
  step_by_step_explanation: z.array(z.string()).min(1),
  pseudocode: z.array(z.string()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
});

export const ChatMessageSchema = z.object({
  id: z.string().min(1),
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(5000),
  timestamp: z.string().datetime(),
});

export const GenerateRequestSchema = z.object({
  titles: z.array(z.string().min(1).max(200)).min(1).max(20),
});

export const ExportFormatSchema = z.object({
  format: z.enum(['pdf', 'markdown']),
  questionIds: z.array(z.string()).optional(),
});

export const ChatRequestSchema = z.object({
  questionId: z.string().min(1),
  message: z.string().min(1).max(1000),
  chatHistory: z.array(ChatMessageSchema).max(50),
});

// TypeScript types inferred from Zod schemas
export type Question = z.infer<typeof QuestionSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;
export type ExportFormat = z.infer<typeof ExportFormatSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

// Additional types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DatabaseQuestion {
  id: string;
  title: string;
  difficulty: string;
  topics: string; // JSON string
  description: string;
  example: string; // JSON string
  solution_python: string;
  step_by_step_explanation: string; // JSON string
  pseudocode: string | null; // JSON string
  created_at: string;
  updated_at: string | null;
}

export interface GenerationStatus {
  total: number;
  completed: number;
  failed: number;
  errors: string[];
}

export interface ThemeContextType {
  isDark: boolean;
  toggle: () => void;
}

// Error types
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class GeminiError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'GeminiError';
  }
}

// Constants
export const DIFFICULTY_COLORS = {
  Easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  Hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
} as const;

export const SUPPORTED_LANGUAGES = ['python', 'javascript', 'java', 'cpp'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const MAX_QUESTIONS_PER_GENERATION = 20;
export const MAX_CHAT_HISTORY = 50;
export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 2000;