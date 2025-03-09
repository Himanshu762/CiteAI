# CiteAI - Academic Paper Generator

CiteAI is a powerful AI-driven platform for generating high-quality academic papers with proper citations and formatting.

## Project Structure

The project uses a modern React + TypeScript + Vite setup with Tailwind CSS for styling.

### Key Directories
- `src/components` - React components organized by feature
- `src/pages` - Page components for different routes
- `src/lib` - Utility functions and hooks
- `src/types` - TypeScript type definitions

### Consolidated Components
To keep the codebase clean, components are consolidated into a few key files:

- `components/ui/components.tsx` - All UI components (Button, Input, Badge, etc.)
- `components/navigation/Navigation.tsx` - All navigation components
- `components/Footer.tsx` - Footer component

### Features
- **Paper Generation**: Generate academic papers with AI
- **Quality Analysis**: Check papers for plagiarism and readability
- **Export Options**: Download papers as PDF or DOCX
- **Responsive UI**: Works on mobile, tablet, and desktop
- **Dark Mode**: Toggle between light and dark themes

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the root directory with:
```
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Backend Integration

The frontend connects to a FastAPI backend at `http://localhost:8000`. Make sure the backend is running when testing the paper generation feature.

## Technology Stack
- React 18+
- TypeScript
- Vite
- Tailwind CSS
- Clerk for authentication
- React Router for navigation
- Framer Motion for animations
- Lucide React for icons
- pdf-lib for PDF generation
