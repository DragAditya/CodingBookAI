'use client';

import { useState, useRef, useEffect } from 'react';
import { Question, ChatMessage, ApiResponse } from '@/lib/types';
import { Send, Bot, User, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ChatBoxProps {
  question: Question;
}

interface ChatState {
  messages: ChatMessage[];
  input: string;
  isLoading: boolean;
  error: string | null;
}

export default function ChatBox({ question }: ChatBoxProps) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    input: '',
    isLoading: false,
    error: null,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  useEffect(() => {
    // Load chat history from localStorage
    const savedMessages = localStorage.getItem(`chat_${question.id}`);
    if (savedMessages) {
      try {
        const messages = JSON.parse(savedMessages);
        setState(prev => ({ ...prev, messages }));
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    }
  }, [question.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const saveChatHistory = (messages: ChatMessage[]) => {
    try {
      localStorage.setItem(`chat_${question.id}`, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  };

  const sendMessage = async () => {
    const trimmedInput = state.input.trim();
    if (!trimmedInput || state.isLoading) return;

    if (trimmedInput.length > 1000) {
      toast.error('Message too long. Please keep it under 1000 characters.');
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: trimmedInput,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...state.messages, userMessage];
    setState(prev => ({
      ...prev,
      messages: newMessages,
      input: '',
      isLoading: true,
      error: null,
    }));

    saveChatHistory(newMessages);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          message: trimmedInput,
          chatHistory: state.messages.slice(-10), // Send last 10 messages for context
        }),
      });

      const data: ApiResponse<{ response: string }> = await response.json();

      if (data.success && data.data) {
        const assistantMessage: ChatMessage = {
          id: `msg_${Date.now()}_assistant`,
          role: 'assistant',
          content: data.data.response,
          timestamp: new Date().toISOString(),
        };

        const updatedMessages = [...newMessages, assistantMessage];
        setState(prev => ({
          ...prev,
          messages: updatedMessages,
          isLoading: false,
        }));

        saveChatHistory(updatedMessages);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...newMessages, errorMessage];
      setState(prev => ({
        ...prev,
        messages: updatedMessages,
        isLoading: false,
        error: 'Failed to send message',
      }));

      toast.error('Failed to send message. Please try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setState(prev => ({ ...prev, messages: [] }));
    localStorage.removeItem(`chat_${question.id}`);
    toast.success('Chat history cleared');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, input: e.target.value }));
  };

  return (
    <div className="card p-6 h-96 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          AI Assistant
        </h3>
        {state.messages.length > 0 && (
          <button
            onClick={clearChat}
            className="p-1 text-gray-500 hover:text-red-500 transition-colors"
            title="Clear chat history"
            aria-label="Clear chat history"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-3 scrollbar-thin">
        {state.messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              Hi! I'm here to help you understand this problem. Ask me about:
            </p>
            <ul className="text-xs text-gray-400 dark:text-gray-500 mt-2 space-y-1">
              <li>• Alternative solutions</li>
              <li>• Code explanations</li>
              <li>• Optimization tips</li>
              <li>• Debugging help</li>
            </ul>
          </div>
        )}

        {state.messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>
              {message.role === 'user' ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>

            {/* Message */}
            <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-3 rounded-lg text-sm ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm'
              }`}>
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              </div>
              <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}>
                {formatDate(message.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {/* Loading message */}
        {state.isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <Bot className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </div>
            <div className="flex-1">
              <div className="inline-block p-3 bg-gray-100 dark:bg-gray-700 rounded-lg rounded-bl-sm">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Thinking...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error message */}
      {state.error && (
        <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-600 dark:text-red-400">{state.error}</span>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={state.input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question about this problem..."
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus-ring bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-500 dark:placeholder-gray-400"
          disabled={state.isLoading}
          maxLength={1000}
        />
        <button
          onClick={sendMessage}
          disabled={!state.input.trim() || state.isLoading}
          className="btn-primary px-3 py-2 min-w-[44px] flex items-center justify-center"
          aria-label="Send message"
        >
          {state.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Character count */}
      {state.input.length > 800 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
          {state.input.length}/1000
        </div>
      )}
    </div>
  );
}