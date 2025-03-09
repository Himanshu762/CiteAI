# CiteAI Backend

This is the backend server for CiteAI, an academic paper generation application.

## Setup Instructions

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. Create a virtual environment (optional but recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
```

2. Install the required packages:
```bash
pip install -r requirements.txt
```

3. Configure your OpenRouter API key:

   a. Get your free API key from [OpenRouter](https://openrouter.ai/)
   
   b. Create a `.env` file in the backend directory with the following content:
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```
   Replace `your_openrouter_api_key_here` with your actual API key.

### Running the Backend

Run the server using the provided script:
```bash
python run_server.py
```

The server will start on `http://localhost:8000`.

## API Endpoints

### Generate Paper
- **URL**: `/generate-paper`
- **Method**: POST
- **Request Body**:
  ```json
  {
    "topic": "Your research topic",
    "word_limit": 5000,
    "sections": ["Abstract", "Introduction", "Literature Review", "Methodology", "Results", "Discussion", "Conclusion", "References"]
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "sections": {
      "abstract": "...",
      "introduction": "...",
      ...
    },
    "word_count": 4800,
    "readability_score": 85,
    "plagiarism_score": 5
  }
  ```

### Health Check
- **URL**: `/health`
- **Method**: GET
- **Response**:
  ```json
  {
    "status": "healthy",
    "version": "1.0.0",
    "api_key_configured": true
  }
  ```

## Troubleshooting

If you encounter the following issues:

1. **"API key not configured"**: Make sure you've created the `.env` file with your OpenRouter API key.

2. **Connection refused errors**: Ensure nothing else is running on port 8000 or modify the port in `run_server.py`.

3. **OpenRouter API errors**: Check the `api.log` file for detailed error messages.

## License

This project is licensed under the MIT License. 