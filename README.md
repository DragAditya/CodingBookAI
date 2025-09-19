# AI-Powered Interactive Coding Book

A comprehensive, modern web application that automatically generates coding problems from simple question titles using Google's Gemini AI. Features interactive learning, AI chat assistance, and professional-grade code solutions.

![AI Coding Book](https://img.shields.io/badge/AI-Powered-blue) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3-cyan)

## ✨ Features

### 🤖 AI-Powered Generation
- **Automatic Question Generation**: Enter simple titles, get comprehensive coding problems
- **Smart Metadata Creation**: AI generates descriptions, examples, solutions, and explanations
- **Multiple Difficulty Levels**: Automatically categorized as Easy, Medium, or Hard
- **Topic Classification**: Intelligent tagging with relevant programming concepts

### 🎯 Interactive Learning
- **AI Chat Assistant**: Get personalized help on each question
- **Step-by-Step Explanations**: Detailed breakdowns of solution approaches
- **Code Highlighting**: Syntax-highlighted solutions with copy functionality
- **Multiple Examples**: Clear input/output examples with explanations

### 🚀 Modern User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Dark/Light Mode**: Automatic theme switching with user preference
- **Smooth Animations**: Framer Motion powered transitions
- **Book-like Navigation**: Seamless flow between questions
- **Keyboard Shortcuts**: Quick navigation with arrow keys

### 📊 Advanced Features
- **Search & Filter**: Find questions by title, description, or topics
- **Export Functionality**: Download as PDF or Markdown
- **Progress Tracking**: Visual indicators and navigation aids
- **Error Boundaries**: Graceful error handling and recovery
- **Performance Optimized**: Caching, lazy loading, and optimizations

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Lucide React** - Beautiful icons

### Backend
- **Next.js API Routes** - Serverless functions
- **SQLite + better-sqlite3** - Fast, embedded database
- **Google Gemini AI** - Advanced language model
- **Zod** - Runtime type validation

### Developer Experience
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking
- **Hot Reload** - Instant development feedback

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ai-coding-book.git
   cd ai-coding-book
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your Gemini API key to `.env.local`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### Generating Questions

1. **Enter Question Titles**: Add one title per line in the input box
   ```
   Check if a number is even or odd
   Generate Fibonacci series
   Find all prime numbers in a range
   Calculate factorial of a number
   ```

2. **Generate**: Click "Generate Questions" and wait for AI processing

3. **Browse Results**: View automatically created questions with full solutions

### Interactive Learning

- **Question Pages**: Click any question card to view detailed solutions
- **AI Chat**: Ask follow-up questions for clarification or alternative approaches
- **Navigation**: Use arrow keys or navigation panel to move between questions
- **Export**: Download individual questions or entire collections

### Search & Organization

- **Search Bar**: Find questions by title, description, or topics
- **Difficulty Filter**: Filter by Easy, Medium, or Hard difficulty levels
- **Topic Tags**: Browse questions by programming concepts

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── questions/     # Question CRUD operations
│   │   ├── generate/      # AI question generation
│   │   ├── chat/         # AI chat functionality
│   │   └── export/       # Export functionality
│   ├── question/[id]/    # Dynamic question pages
│   ├── layout.tsx        # Root layout
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles
├── components/           # React components
│   ├── ErrorBoundary.tsx
│   ├── QuestionCard.tsx
│   ├── CodeBlock.tsx
│   ├── ChatBox.tsx
│   └── Navigation.tsx
├── lib/                 # Utilities and configurations
│   ├── types.ts        # TypeScript definitions
│   ├── database.ts     # Database operations
│   ├── gemini.ts      # AI integration
│   ├── validation.ts  # Input validation
│   ├── utils.ts      # Helper functions
│   ├── cache.ts      # Caching system
│   └── rate-limit.ts # Rate limiting
└── data/               # Database files
```

## 🔧 Configuration

### Environment Variables

```env
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional
DATABASE_URL=./src/data/questions.db
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
RATE_LIMIT_REQUESTS=100
```

### Customization

- **Themes**: Modify `tailwind.config.js` for custom colors
- **AI Prompts**: Edit prompts in `src/lib/gemini.ts`
- **Database Schema**: Update schema in `src/lib/database.ts`
- **Rate Limits**: Adjust limits in `src/lib/rate-limit.ts`

## 📊 API Endpoints

### Questions
- `GET /api/questions` - Fetch all questions
- `GET /api/questions?id=Q1` - Fetch specific question
- `GET /api/questions?search=fibonacci` - Search questions
- `GET /api/questions?difficulty=Easy` - Filter by difficulty

### Generation
- `POST /api/generate` - Generate questions from titles
  ```json
  {
    "titles": ["Question title 1", "Question title 2"]
  }
  ```

### Chat
- `POST /api/chat` - AI chat interaction
  ```json
  {
    "questionId": "Q1",
    "message": "Explain this solution",
    "chatHistory": []
  }
  ```

### Export
- `POST /api/export` - Export questions
  ```json
  {
    "format": "pdf" | "markdown",
    "questionIds": ["Q1", "Q2"] // optional
  }
  ```

## 🔒 Security Features

- **Input Validation**: Zod schema validation on all inputs
- **Rate Limiting**: Protection against API abuse
- **Error Handling**: Comprehensive error boundaries
- **XSS Protection**: Input sanitization
- **CORS Configuration**: Proper cross-origin handling

## 🚀 Performance Optimizations

- **Server-Side Caching**: In-memory caching for frequently accessed data
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic code splitting with Next.js
- **Lazy Loading**: Components loaded on demand
- **Database Indexing**: Optimized SQLite queries

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Run build test
npm run build
```

## 📦 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy automatically

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Manual Deployment
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for powerful language generation
- **Next.js Team** for the amazing framework
- **Tailwind CSS** for beautiful styling utilities
- **Framer Motion** for smooth animations
- **Lucide** for beautiful icons

## 📞 Support

- 📧 Email: support@aicodingbook.com
- 💬 Discord: [Join our community](https://discord.gg/aicodingbook)
- 📖 Documentation: [Full docs](https://docs.aicodingbook.com)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/ai-coding-book/issues)

---

<div align="center">

**[⭐ Star this repo](https://github.com/your-username/ai-coding-book)** if you find it helpful!

Made with ❤️ by the AI Coding Book Team

</div>