# CiteAI - Academic Paper Generator

This application generates academic papers on any topic using AI. It's a frontend-only solution that interacts directly with the OpenRouter API.

## Features

- Generate academic papers with customizable word limits
- Extract different sections (Abstract, Introduction, etc.)
- Calculate readability scores
- Plagiarism detection simulation
- Export to PDF and DOCX formats

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

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

3. Create a `.env` file in the frontend directory with your OpenRouter API key:
   ```
   VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
   VITE_BASE_URL=http://localhost:5173
   ```

   You can get an API key from [OpenRouter](https://openrouter.ai/).

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

## Deployment

This application can be deployed to Vercel or any other static hosting service:

```
npm run build
```

Then deploy the `dist` directory.

### Important Security Considerations

Note that this application includes your OpenRouter API key in the frontend code, which is not secure for production use. For a more secure approach, consider:

1. Implementing user authentication (e.g., with Clerk.js or Auth.js)
2. Using a serverless function to make the API calls, keeping your API key secure
3. Setting up an API proxy service

## How it Works

This application is a React/TypeScript frontend that:

1. Takes user input for research topics
2. Directly calls the OpenRouter API to generate academic content
3. Processes the API response to extract different paper sections
4. Calculates metrics (readability, word count)
5. Provides export options for the generated paper

The previous version used a Python backend, but this has been replaced with frontend JavaScript to simplify deployment and reduce complexity.

## License

MIT 