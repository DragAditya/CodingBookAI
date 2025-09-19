import Database from 'better-sqlite3';
import { Question, DatabaseQuestion, DatabaseError } from './types';
import { getErrorMessage } from './utils';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'src/data/questions.db');
const dbDir = path.dirname(dbPath);

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db: Database.Database;

try {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = 1000');
  db.pragma('temp_store = MEMORY');
} catch (error) {
  throw new DatabaseError(`Failed to initialize database: ${getErrorMessage(error)}`);
}

// Initialize database schema
const initializeSchema = () => {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
        topics TEXT NOT NULL,
        description TEXT NOT NULL,
        example TEXT NOT NULL,
        solution_python TEXT NOT NULL,
        step_by_step_explanation TEXT NOT NULL,
        pseudocode TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        UNIQUE(title) ON CONFLICT REPLACE
      );
      
      CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
      CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_questions_title ON questions(title);
    `);
  } catch (error) {
    throw new DatabaseError(`Failed to initialize schema: ${getErrorMessage(error)}`);
  }
};

initializeSchema();

// Prepared statements for better performance
const statements = {
  insert: db.prepare(`
    INSERT OR REPLACE INTO questions 
    (id, title, difficulty, topics, description, example, solution_python, step_by_step_explanation, pseudocode, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  
  selectById: db.prepare('SELECT * FROM questions WHERE id = ?'),
  
  selectAll: db.prepare('SELECT * FROM questions ORDER BY created_at DESC'),
  
  selectByDifficulty: db.prepare('SELECT * FROM questions WHERE difficulty = ? ORDER BY created_at DESC'),
  
  selectByTopic: db.prepare(`
    SELECT * FROM questions 
    WHERE topics LIKE ? 
    ORDER BY created_at DESC
  `),
  
  delete: db.prepare('DELETE FROM questions WHERE id = ?'),
  
  count: db.prepare('SELECT COUNT(*) as count FROM questions'),
  
  search: db.prepare(`
    SELECT * FROM questions 
    WHERE title LIKE ? OR description LIKE ? 
    ORDER BY created_at DESC
  `),
};

function convertDbToQuestion(row: DatabaseQuestion): Question {
  try {
    return {
      id: row.id,
      title: row.title,
      difficulty: row.difficulty as 'Easy' | 'Medium' | 'Hard',
      topics: JSON.parse(row.topics),
      description: row.description,
      example: JSON.parse(row.example),
      solution_python: row.solution_python,
      step_by_step_explanation: JSON.parse(row.step_by_step_explanation),
      pseudocode: row.pseudocode ? JSON.parse(row.pseudocode) : undefined,
      created_at: row.created_at,
      updated_at: row.updated_at || undefined,
    };
  } catch (error) {
    throw new DatabaseError(`Failed to parse question data: ${getErrorMessage(error)}`);
  }
}

export function saveQuestion(question: Question): void {
  try {
    const now = new Date().toISOString();
    statements.insert.run(
      question.id,
      question.title,
      question.difficulty,
      JSON.stringify(question.topics),
      question.description,
      JSON.stringify(question.example),
      question.solution_python,
      JSON.stringify(question.step_by_step_explanation),
      question.pseudocode ? JSON.stringify(question.pseudocode) : null,
      question.created_at,
      now
    );
  } catch (error) {
    throw new DatabaseError(`Failed to save question: ${getErrorMessage(error)}`);
  }
}

export function getQuestion(id: string): Question | null {
  try {
    if (!id || typeof id !== 'string') {
      return null;
    }
    
    const row = statements.selectById.get(id) as DatabaseQuestion | undefined;
    return row ? convertDbToQuestion(row) : null;
  } catch (error) {
    throw new DatabaseError(`Failed to get question: ${getErrorMessage(error)}`);
  }
}

export function getAllQuestions(): Question[] {
  try {
    const rows = statements.selectAll.all() as DatabaseQuestion[];
    return rows.map(convertDbToQuestion);
  } catch (error) {
    throw new DatabaseError(`Failed to get all questions: ${getErrorMessage(error)}`);
  }
}

export function getQuestionsByDifficulty(difficulty: 'Easy' | 'Medium' | 'Hard'): Question[] {
  try {
    const rows = statements.selectByDifficulty.all(difficulty) as DatabaseQuestion[];
    return rows.map(convertDbToQuestion);
  } catch (error) {
    throw new DatabaseError(`Failed to get questions by difficulty: ${getErrorMessage(error)}`);
  }
}

export function searchQuestions(searchTerm: string): Question[] {
  try {
    if (!searchTerm || typeof searchTerm !== 'string') {
      return [];
    }
    
    const term = `%${searchTerm.trim()}%`;
    const rows = statements.search.all(term, term) as DatabaseQuestion[];
    return rows.map(convertDbToQuestion);
  } catch (error) {
    throw new DatabaseError(`Failed to search questions: ${getErrorMessage(error)}`);
  }
}

export function getQuestionsByTopic(topic: string): Question[] {
  try {
    if (!topic || typeof topic !== 'string') {
      return [];
    }
    
    const topicPattern = `%"${topic}"%`;
    const rows = statements.selectByTopic.all(topicPattern) as DatabaseQuestion[];
    return rows.map(convertDbToQuestion);
  } catch (error) {
    throw new DatabaseError(`Failed to get questions by topic: ${getErrorMessage(error)}`);
  }
}

export function deleteQuestion(id: string): boolean {
  try {
    if (!id || typeof id !== 'string') {
      return false;
    }
    
    const result = statements.delete.run(id);
    return result.changes > 0;
  } catch (error) {
    throw new DatabaseError(`Failed to delete question: ${getErrorMessage(error)}`);
  }
}

export function getQuestionCount(): number {
  try {
    const result = statements.count.get() as { count: number };
    return result.count;
  } catch (error) {
    throw new DatabaseError(`Failed to get question count: ${getErrorMessage(error)}`);
  }
}

export function getQuestionStats(): { total: number; byDifficulty: Record<string, number> } {
  try {
    const total = getQuestionCount();
    const byDifficulty = {
      Easy: getQuestionsByDifficulty('Easy').length,
      Medium: getQuestionsByDifficulty('Medium').length,
      Hard: getQuestionsByDifficulty('Hard').length,
    };
    
    return { total, byDifficulty };
  } catch (error) {
    throw new DatabaseError(`Failed to get question stats: ${getErrorMessage(error)}`);
  }
}

// Cleanup function for graceful shutdown
export function closeDatabase(): void {
  try {
    if (db) {
      db.close();
    }
  } catch (error) {
    console.error('Error closing database:', getErrorMessage(error));
  }
}

// Handle process termination
process.on('SIGINT', closeDatabase);
process.on('SIGTERM', closeDatabase);
process.on('exit', closeDatabase);