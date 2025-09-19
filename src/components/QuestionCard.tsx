import Link from 'next/link';
import { Question, DIFFICULTY_COLORS } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Calendar, Clock, Tag } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
}

export default function QuestionCard({ question }: QuestionCardProps) {
  if (!question) {
    return null;
  }

  const difficultyColor = DIFFICULTY_COLORS[question.difficulty] || DIFFICULTY_COLORS.Easy;

  return (
    <Link href={`/question/${question.id}`} className="block h-full">
      <article className="card-hover p-6 h-full cursor-pointer group">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyColor}`}>
            {question.difficulty}
          </span>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(question.created_at)}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {question.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 leading-relaxed">
          {question.description}
        </p>

        {/* Topics */}
        <div className="flex flex-wrap gap-2 mb-4">
          {question.topics.slice(0, 3).map((topic, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-md text-xs font-medium"
            >
              <Tag className="h-3 w-3" />
              {topic}
            </span>
          ))}
          {question.topics.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md text-xs font-medium">
              +{question.topics.length - 3} more
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="h-3 w-3" />
            <span>ID: {question.id}</span>
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium group-hover:underline">
            View Solution →
          </div>
        </div>
      </article>
    </Link>
  );
}