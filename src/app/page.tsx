'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Question, ApiResponse, GenerationStatus } from '@/lib/types';
import { DIFFICULTY_COLORS } from '@/lib/types';
import QuestionCard from '@/components/QuestionCard';
import { Loader2, Plus, Download, Search, Filter, Sun, Moon, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { debounce } from '@/lib/utils';

interface HomePageState {
  questions: Question[];
  filteredQuestions: Question[];
  inputTitles: string;
  isGenerating: boolean;
  isDarkMode: boolean;
  searchTerm: string;
  selectedDifficulty: 'all' | 'Easy' | 'Medium' | 'Hard';
  isLoading: boolean;
}

export default function HomePage() {
  const [state, setState] = useState<HomePageState>({
    questions: [],
    filteredQuestions: [],
    inputTitles: '',
    isGenerating: false,
    isDarkMode: false,
    searchTerm: '',
    selectedDifficulty: 'all',
    isLoading: true,
  });

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchTerm: string, difficulty: string, questions: Question[]) => {
      let filtered = questions;

      if (searchTerm.trim()) {
        filtered = filtered.filter(
          (q) =>
            q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.topics.some((topic) =>
              topic.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
      }

      if (difficulty !== 'all') {
        filtered = filtered.filter((q) => q.difficulty === difficulty);
      }

      setState((prev) => ({ ...prev, filteredQuestions: filtered }));
    }, 300),
    []
  );

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    debouncedSearch(state.searchTerm, state.selectedDifficulty, state.questions);
  }, [state.searchTerm, state.selectedDifficulty, state.questions, debouncedSearch]);

  const initializeApp = async () => {
    try {
      // Check for dark mode preference
      const savedDarkMode = localStorage.getItem('darkMode') === 'true';
      setState((prev) => ({ ...prev, isDarkMode: savedDarkMode }));
      
      if (savedDarkMode) {
        document.documentElement.classList.add('dark');
      }

      await fetchQuestions();
    } catch (error) {
      console.error('Error initializing app:', error);
      toast.error('Failed to initialize application');
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/questions');
      const data: ApiResponse<Question[]> = await response.json();

      if (data.success && data.data) {
        setState((prev) => ({
          ...prev,
          questions: data.data || [],
          filteredQuestions: data.data || [],
        }));
      } else {
        throw new Error(data.error || 'Failed to fetch questions');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
      setState((prev) => ({
        ...prev,
        questions: [],
        filteredQuestions: [],
      }));
    }
  };

  const handleGenerate = async () => {
    if (!state.inputTitles.trim()) {
      toast.error('Please enter at least one question title');
      return;
    }

    const titles = state.inputTitles
      .split('\n')
      .map((title) => title.trim())
      .filter((title) => title.length > 0);

    if (titles.length === 0) {
      toast.error('Please enter valid question titles');
      return;
    }

    if (titles.length > 20) {
      toast.error('Maximum 20 questions can be generated at once');
      return;
    }

    setState((prev) => ({ ...prev, isGenerating: true }));

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titles }),
      });

      const data: ApiResponse<GenerationStatus> = await response.json();

      if (data.success || response.status === 207) {
        // Success or partial success
        const status = data.data;
        if (status) {
          if (status.completed > 0) {
            toast.success(
              `Successfully generated ${status.completed} question${status.completed !== 1 ? 's' : ''}`
            );
            
            if (status.failed > 0) {
              toast.error(`Failed to generate ${status.failed} question${status.failed !== 1 ? 's' : ''}`);
            }
            
            await fetchQuestions();
            setState((prev) => ({ ...prev, inputTitles: '' }));
          } else {
            toast.error('Failed to generate any questions');
          }
        }
      } else {
        throw new Error(data.error || 'Failed to generate questions');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error('Failed to generate questions. Please try again.');
    } finally {
      setState((prev) => ({ ...prev, isGenerating: false }));
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !state.isDarkMode;
    setState((prev) => ({ ...prev, isDarkMode: newDarkMode }));
    localStorage.setItem('darkMode', String(newDarkMode));
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const exportQuestions = async (format: 'pdf' | 'markdown') => {
    if (state.questions.length === 0) {
      toast.error('No questions available for export');
      return;
    }

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });

      if (response.ok) {
        if (format === 'markdown') {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `coding-questions-${Date.now()}.md`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          toast.success('Questions exported as Markdown');
        } else if (format === 'pdf') {
          // Handle PDF generation client-side
          const data = await response.json();
          if (data.success && data.data) {
            await generatePDF(data.data);
            toast.success('Questions exported as PDF');
          } else {
            throw new Error('Failed to get questions data for PDF');
          }
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }
    } catch (error) {
      console.error('Error exporting questions:', error);
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    }
  };

  const generatePDF = async (data: any) => {
    // Dynamic import for client-side only
    const { jsPDF } = await import('jspdf');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    let yPosition = 20;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 6;
    
    // Title
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AI Coding Book - Questions', margin, yPosition);
    yPosition += 15;
    
    // Date
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated on: ${data.metadata.generatedOn}`, margin, yPosition);
    yPosition += 10;
    
    // Questions count
    pdf.text(`Total Questions: ${data.metadata.totalQuestions}`, margin, yPosition);
    yPosition += 15;
    
    data.questions.forEach((question: any, index: number) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = 20;
      }
      
      // Question header
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      const title = `${question.id}: ${question.title}`;
      pdf.text(title, margin, yPosition);
      yPosition += 10;
      
      // Difficulty and Topics
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Difficulty: ${question.difficulty}`, margin, yPosition);
      yPosition += lineHeight;
      
      pdf.text(`Topics: ${question.topics.join(', ')}`, margin, yPosition);
      yPosition += lineHeight + 2;
      
      // Description
      pdf.setFont('helvetica', 'bold');
      pdf.text('Description:', margin, yPosition);
      yPosition += lineHeight;
      
      pdf.setFont('helvetica', 'normal');
      const descriptionLines = pdf.splitTextToSize(question.description, 170);
      descriptionLines.forEach((line: string) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
      yPosition += 3;
      
      // Add separator if not last question
      if (index < data.questions.length - 1) {
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPosition, 190, yPosition);
        yPosition += 10;
      }
    });
    
    pdf.save(`coding-questions-${Date.now()}.pdf`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState((prev) => ({ ...prev, inputTitles: e.target.value }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({ ...prev, searchTerm: e.target.value }));
  };

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setState((prev) => ({
      ...prev,
      selectedDifficulty: e.target.value as 'all' | 'Easy' | 'Medium' | 'Hard',
    }));
  };

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Coding Book
              </h1>
            </div>
            <button
              onClick={toggleDarkMode}
              className="p-3 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 focus-ring"
              aria-label="Toggle dark mode"
            >
              {state.isDarkMode ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Generate comprehensive coding problems with AI-powered explanations, solutions, and interactive learning.
            Master programming with personalized AI assistance.
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6 mb-12"
        >
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
            <Plus className="h-6 w-6" />
            Generate New Questions
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="question-titles" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter question titles (one per line):
              </label>
              <textarea
                id="question-titles"
                value={state.inputTitles}
                onChange={handleInputChange}
                placeholder="Check if a number is even or odd&#10;Generate Fibonacci series&#10;Find all prime numbers in a range&#10;Calculate factorial of a number"
                className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus-ring resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                disabled={state.isGenerating}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Maximum 20 questions per generation
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleGenerate}
                disabled={state.isGenerating || !state.inputTitles.trim()}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {state.isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Generate Questions
                  </>
                )}
              </button>
              {state.questions.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => exportQuestions('pdf')}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export PDF
                  </button>
                  <button
                    onClick={() => exportQuestions('markdown')}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export MD
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Search and Filter Section */}
        {state.questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6 mb-8"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={state.searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus-ring bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={state.selectedDifficulty}
                  onChange={handleDifficultyChange}
                  className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus-ring bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none min-w-[150px]"
                >
                  <option value="all">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Showing {state.filteredQuestions.length} of {state.questions.length} questions
            </div>
          </motion.div>
        )}

        {/* Questions Grid */}
        {state.filteredQuestions.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {state.filteredQuestions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <QuestionCard question={question} />
              </motion.div>
            ))}
          </motion.div>
        ) : state.questions.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No questions match your search
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search terms or filters
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No questions yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Generate some questions to get started with your coding journey!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}