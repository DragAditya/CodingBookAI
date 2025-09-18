'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Question, ApiResponse, DIFFICULTY_COLORS } from '@/lib/types';
import CodeBlock from '@/components/CodeBlock';
import ChatBox from '@/components/ChatBox';
import Navigation from '@/components/Navigation';
import { formatDate } from '@/lib/utils';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Tag, 
  BookOpen, 
  Code, 
  Lightbulb,
  Target,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface QuestionPageState {
  question: Question | null;
  allQuestions: Question[];
  loading: boolean;
  error: string | null;
}

export default function QuestionPage() {
  const params = useParams();
  const router = useRouter();
  const [state, setState] = useState<QuestionPageState>({
    question: null,
    allQuestions: [],
    loading: true,
    error: null,
  });

  const questionId = params.id as string;

  useEffect(() => {
    if (questionId) {
      Promise.all([fetchQuestion(questionId), fetchAllQuestions()]);
    }
  }, [questionId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return; // Don't handle shortcuts when typing in inputs
      }

      const currentIndex = state.allQuestions.findIndex(q => q.id === questionId);
      
      switch (event.key) {
        case 'ArrowLeft':
          if (currentIndex > 0) {
            const prevQ = state.allQuestions[currentIndex - 1];
            if (prevQ) {
              router.push(`/question/${prevQ.id}`);
            }
          }
          break;
        case 'ArrowRight':
          if (currentIndex < state.allQuestions.length - 1) {
            const nextQ = state.allQuestions[currentIndex + 1];
            if (nextQ) {
              router.push(`/question/${nextQ.id}`);
            }
          }
          break;
        case 'h':
        case 'H':
          router.push('/');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [state.allQuestions, questionId, router]);

  const fetchQuestion = async (id: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch(`/api/questions?id=${id}`);
      const data: ApiResponse<Question> = await response.json();

      if (data.success && data.data) {
        setState(prev => ({ ...prev, question: data.data || null, loading: false }));
      } else {
        throw new Error(data.error || 'Question not found');
      }
    } catch (error) {
      console.error('Error fetching question:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load question',
        loading: false 
      }));
      toast.error('Failed to load question');
    }
  };

  const fetchAllQuestions = async () => {
    try {
      const response = await fetch('/api/questions');
      const data: ApiResponse<Question[]> = await response.json();

      if (data.success && data.data) {
        setState(prev => ({ ...prev, allQuestions: data.data || [] }));
      }
    } catch (error) {
      console.error('Error fetching all questions:', error);
    }
  };

  const goHome = useCallback(() => {
    router.push('/');
  }, [router]);

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading question...</p>
        </div>
      </div>
    );
  }

  if (state.error || !state.question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {state.error || 'Question not found'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The question you're looking for doesn't exist or couldn't be loaded.
          </p>
          <button
            onClick={goHome}
            className="btn-primary flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const { question, allQuestions } = state;
  const currentIndex = allQuestions.findIndex(q => q.id === question.id);
  const prevQuestion = currentIndex > 0 ? allQuestions[currentIndex - 1] : null;
  const nextQuestion = currentIndex < allQuestions.length - 1 ? allQuestions[currentIndex + 1] : null;
  const difficultyColor = DIFFICULTY_COLORS[question.difficulty];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={goHome}
            className="mb-6 text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Questions
          </button>
          
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyColor}`}>
                  {question.difficulty}
                </span>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  {formatDate(question.created_at)}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  {question.id}
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                {question.title}
              </h1>
              
              <div className="flex flex-wrap gap-2">
                {question.topics.map((topic, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-md text-sm font-medium"
                  >
                    <Tag className="h-3 w-3" />
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-6"
            >
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
                Problem Description
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                  {question.description}
                </p>
              </div>
            </motion.section>

            {/* Example */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-6"
            >
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <Target className="h-6 w-6 text-green-600" />
                Example
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Input:
                  </h3>
                  <code className="block bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-sm font-mono">
                    {question.example.input}
                  </code>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    Output:
                  </h3>
                  <code className="block bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-sm font-mono">
                    {question.example.output}
                  </code>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Explanation:
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {question.example.explanation}
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Solution */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card p-6"
            >
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <Code className="h-6 w-6 text-purple-600" />
                Python Solution
              </h2>
              <CodeBlock 
                code={question.solution_python} 
                language="python"
                title="Solution"
                showLineNumbers={true}
              />
            </motion.section>

            {/* Step by Step Explanation */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card p-6"
            >
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-yellow-500" />
                Step-by-Step Explanation
              </h2>
              <div className="space-y-4">
                {question.step_by_step_explanation.map((step, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {step}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Pseudocode */}
            {question.pseudocode && question.pseudocode.length > 0 && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="card p-6"
              >
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <Code className="h-6 w-6 text-gray-600" />
                  Pseudocode
                </h2>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg font-mono text-sm">
                  {question.pseudocode.map((line, index) => (
                    <div key={index} className="flex gap-4">
                      <span className="text-gray-400 w-6 text-right">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {line}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Navigation */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
            <Navigation 
              prevQuestion={prevQuestion || null}
              nextQuestion={nextQuestion || null}
              currentIndex={currentIndex >= 0 ? currentIndex : undefined}
              totalQuestions={allQuestions.length}
            />
            </motion.div>
            
            {/* Chat */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <ChatBox question={question} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}