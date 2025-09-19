import Link from 'next/link';
import { Question } from '@/lib/types';
import { ChevronLeft, ChevronRight, Home, List } from 'lucide-react';

interface NavigationProps {
  prevQuestion: Question | null;
  nextQuestion: Question | null;
  currentIndex?: number | undefined;
  totalQuestions?: number;
}

export default function Navigation({ 
  prevQuestion, 
  nextQuestion, 
  currentIndex, 
  totalQuestions 
}: NavigationProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <List className="h-5 w-5" />
          Navigation
        </h3>
        {currentIndex !== undefined && totalQuestions !== undefined && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {currentIndex + 1} of {totalQuestions}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {/* Home link */}
        <Link
          href="/"
          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
        >
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center">
            <Home className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Back to Questions
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              View all questions
            </div>
          </div>
        </Link>

        {/* Previous question */}
        {prevQuestion ? (
          <Link
            href={`/question/${prevQuestion.id}`}
            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
          >
            <div className="flex-shrink-0 w-8 h-8 bg-gray-600 text-white rounded-lg flex items-center justify-center">
              <ChevronLeft className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Previous
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {prevQuestion.title}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {prevQuestion.difficulty}
              </div>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg opacity-50">
            <div className="flex-shrink-0 w-8 h-8 bg-gray-400 text-white rounded-lg flex items-center justify-center">
              <ChevronLeft className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Previous
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No previous question
              </div>
            </div>
          </div>
        )}

        {/* Next question */}
        {nextQuestion ? (
          <Link
            href={`/question/${nextQuestion.id}`}
            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
          >
            <div className="flex-shrink-0 w-8 h-8 bg-gray-600 text-white rounded-lg flex items-center justify-center">
              <ChevronRight className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Next
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {nextQuestion.title}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {nextQuestion.difficulty}
              </div>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg opacity-50">
            <div className="flex-shrink-0 w-8 h-8 bg-gray-400 text-white rounded-lg flex items-center justify-center">
              <ChevronRight className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Next
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No next question
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>Previous:</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">←</kbd>
          </div>
          <div className="flex justify-between">
            <span>Next:</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">→</kbd>
          </div>
          <div className="flex justify-between">
            <span>Home:</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">H</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}