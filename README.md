# CiteAI - Academic Paper Generator

>it's still a wip

This application generates academic papers on any topic using Google's Gemini AI. It's a frontend-only solution that interacts directly with the Gemini API.

## Features

- Generate academic papers with customizable word limits
- Extract different sections (Abstract, Introduction, etc.)
- Calculate readability scores
- Plagiarism detection simulation
- Export to PDF and DOCX formats
- Powered by Google's experimental Gemini 2.5 Pro model for superior academic content

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Google Gemini API key with access to experimental models

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/CiteAI.git
   cd CiteAI/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

3. Create a `.env` file in the frontend directory with your Gemini API key:
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_BASE_URL=http://localhost:5173
   ```

   You can get a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey). Make sure your API key has access to experimental models.

### Running the Application

Start the development server:
```
npm run dev
```
or
```
yarn dev
```

The application will be available at http://localhost:5173.

## About Gemini 2.5 Pro

This application uses Gemini 2.5 Pro (experimental), which offers:

- Higher token context windows for longer papers
- Better understanding of academic formatting and citations
- Improved factual accuracy for research topics
- More nuanced handling of complex academic subjects

Note that as an experimental model, some features and behaviors may change as Google continues to refine it.

## Deployment

This application can be deployed to Vercel or any other static hosting service:

```
npm run build
```

Then deploy the `dist` directory.

### Important Security Considerations

Note that this application includes your Gemini API key in the frontend code, which is not secure for production use. For a more secure approach, consider:

1. Implementing user authentication (e.g., with Clerk.js or Auth.js)
2. Using a serverless function to make the API calls, keeping your API key secure
3. Setting up an API proxy service

## How it Works

This application is a React/TypeScript frontend that:

1. Takes user input for research topics
2. Directly calls the Gemini 2.5 Pro API to generate academic content
3. Processes the API response to extract different paper sections
4. Calculates metrics (readability, word count)
5. Provides export options for the generated paper

The application started with OpenRouter's API, then migrated to Gemini 1.5, and now uses Gemini 2.5 Pro for optimal performance and quality.

## License

MIT 
