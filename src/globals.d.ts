// Global type declarations

declare module '*.css' {
  const content: any;
  export default content;
}

declare module '*.scss' {
  const content: any;
  export default content;
}

declare module 'prismjs/themes/prism-tomorrow.css';
declare module 'prismjs/components/prism-python';
declare module 'prismjs/components/prism-javascript';
declare module 'prismjs/components/prism-java';
declare module 'prismjs/components/prism-cpp';

// Environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    GEMINI_API_KEY: string;
    NODE_ENV: 'development' | 'production' | 'test';
    NEXT_PUBLIC_APP_URL?: string;
    DATABASE_URL?: string;
    RATE_LIMIT_REQUESTS?: string;
  }
}