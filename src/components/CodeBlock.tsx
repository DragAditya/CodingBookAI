'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { copyToClipboard, downloadFile } from '@/lib/utils';
import toast from 'react-hot-toast';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-cpp';

interface CodeBlockProps {
  code: string;
  language: string;
  title?: string;
  showLineNumbers?: boolean;
  maxHeight?: string;
}

export default function CodeBlock({ 
  code, 
  language = 'python', 
  title,
  showLineNumbers = true,
  maxHeight = 'none'
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  const handleCopy = async () => {
    try {
      const success = await copyToClipboard(code);
      if (success) {
        setCopied(true);
        toast.success('Code copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error('Copy failed');
      }
    } catch (error) {
      console.error('Failed to copy code:', error);
      toast.error('Failed to copy code');
    }
  };

  const handleDownload = () => {
    try {
      const extension = getFileExtension(language);
      const filename = title 
        ? `${title.toLowerCase().replace(/\s+/g, '-')}.${extension}`
        : `code.${extension}`;
      
      downloadFile(code, filename, 'text/plain');
      toast.success('Code downloaded');
    } catch (error) {
      console.error('Failed to download code:', error);
      toast.error('Failed to download code');
    }
  };

  const getFileExtension = (lang: string): string => {
    const extensions: Record<string, string> = {
      python: 'py',
      javascript: 'js',
      typescript: 'ts',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      go: 'go',
      rust: 'rs',
    };
    return extensions[lang] || 'txt';
  };

  const getLanguageDisplayName = (lang: string): string => {
    const names: Record<string, string> = {
      python: 'Python',
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      java: 'Java',
      cpp: 'C++',
      c: 'C',
      go: 'Go',
      rust: 'Rust',
    };
    return names[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  if (!code || typeof code !== 'string') {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center text-gray-500 dark:text-gray-400">
        No code available
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 dark:bg-gray-900 text-white px-4 py-2 rounded-t-lg">
        <div className="flex items-center gap-3">
          {title && (
            <span className="text-sm font-medium">{title}</span>
          )}
          <span className="text-xs bg-gray-700 dark:bg-gray-800 px-2 py-1 rounded">
            {getLanguageDisplayName(language)}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="p-1.5 rounded hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors"
            title="Download code"
            aria-label="Download code"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors"
            title={copied ? 'Copied!' : 'Copy code'}
            aria-label={copied ? 'Copied!' : 'Copy code'}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Code Content */}
      <div 
        className="relative overflow-x-auto"
        style={{ maxHeight: maxHeight !== 'none' ? maxHeight : undefined }}
      >
        <pre 
          className={`language-${language} !mt-0 !rounded-t-none ${showLineNumbers ? 'line-numbers' : ''}`}
          style={{
            fontSize: '0.875rem',
            lineHeight: '1.5',
            margin: 0,
            borderRadius: '0 0 0.5rem 0.5rem',
          }}
        >
          <code 
            ref={codeRef}
            className={`language-${language}`}
          >
            {code}
          </code>
        </pre>
      </div>

      {/* Loading overlay while syntax highlighting */}
      <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center opacity-0 group-loading:opacity-100 transition-opacity">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Highlighting syntax...
        </div>
      </div>
    </div>
  );
}

// Line numbers CSS (to be added to globals.css if needed)
const lineNumbersCSS = `
.line-numbers .line-numbers-rows {
  position: absolute;
  pointer-events: none;
  top: 0;
  font-size: 100%;
  left: -3.8em;
  width: 3em;
  letter-spacing: -1px;
  border-right: 1px solid #999;
  user-select: none;
}

.line-numbers-rows > span {
  display: block;
  counter-increment: linenumber;
}

.line-numbers-rows > span:before {
  content: counter(linenumber);
  color: #999;
  display: block;
  padding-right: 0.8em;
  text-align: right;
}
`;