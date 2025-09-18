import { z } from 'zod';
import { 
  QuestionSchema, 
  ChatMessageSchema, 
  GenerateRequestSchema, 
  ExportFormatSchema, 
  ChatRequestSchema,
  ValidationError 
} from './types';

export function validateQuestion(data: unknown) {
  try {
    return QuestionSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new ValidationError(
        `Invalid question data: ${firstError.message}`,
        firstError.path.join('.')
      );
    }
    throw new ValidationError('Invalid question data');
  }
}

export function validateChatMessage(data: unknown) {
  try {
    return ChatMessageSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new ValidationError(
        `Invalid chat message: ${firstError.message}`,
        firstError.path.join('.')
      );
    }
    throw new ValidationError('Invalid chat message');
  }
}

export function validateGenerateRequest(data: unknown) {
  try {
    return GenerateRequestSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new ValidationError(
        `Invalid generate request: ${firstError.message}`,
        firstError.path.join('.')
      );
    }
    throw new ValidationError('Invalid generate request');
  }
}

export function validateExportFormat(data: unknown) {
  try {
    return ExportFormatSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new ValidationError(
        `Invalid export format: ${firstError.message}`,
        firstError.path.join('.')
      );
    }
    throw new ValidationError('Invalid export format');
  }
}

export function validateChatRequest(data: unknown) {
  try {
    return ChatRequestSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new ValidationError(
        `Invalid chat request: ${firstError.message}`,
        firstError.path.join('.')
      );
    }
    throw new ValidationError('Invalid chat request');
  }
}

// Additional validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function validateAndSanitizeTitle(title: string): string {
  if (!title || typeof title !== 'string') {
    throw new ValidationError('Title is required');
  }

  const sanitized = title.trim();
  
  if (sanitized.length === 0) {
    throw new ValidationError('Title cannot be empty');
  }

  if (sanitized.length > 200) {
    throw new ValidationError('Title cannot exceed 200 characters');
  }

  return sanitized;
}

export function validateProgrammingLanguage(language: string): boolean {
  const supportedLanguages = ['python', 'javascript', 'java', 'cpp', 'c', 'go', 'rust'];
  return supportedLanguages.includes(language.toLowerCase());
}