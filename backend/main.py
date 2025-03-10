import requests
from fastapi import FastAPI, HTTPException, Request, Response
from pydantic import BaseModel, Field
import os
from dotenv import load_dotenv
import re
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(
    title="CiteAI API",
    description="API for generating academic papers with AI",
    version="1.0.0"
)

class PaperRequest(BaseModel):
    topic: str = Field(..., description="Research topic for the paper")
    word_limit: int = Field(..., description="Maximum word count for the paper")
    sections: list[str] = Field(
        default=["Abstract", "Introduction", "Literature Review", "Methodology", 
                "Results", "Discussion", "Conclusion", "References"]
    )

def extract_section(content: str, section_title: str, all_sections: list[str]) -> str:
    """Extract content between current section and the next section"""
    try:
        # Create regex pattern that matches the section title at the beginning of a line
        pattern = rf"(?:^|\n)({section_title}[:\.\s]*?)(?:\n|$)"
        match = re.search(pattern, content, re.IGNORECASE)
        
        if not match:
            return ""
            
        start_idx = match.end()
        
        # Find the next section
        next_sections = [s for s in all_sections if s > section_title]
        for next_section in next_sections:
            next_pattern = rf"(?:^|\n)({next_section}[:\.\s]*?)(?:\n|$)"
            next_match = re.search(next_pattern, content[start_idx:], re.IGNORECASE)
            if next_match:
                end_idx = start_idx + next_match.start()
                return content[start_idx:end_idx].strip()
        
        # If no next section found, return the rest of the content
        return content[start_idx:].strip()
    except Exception as e:
        logger.error(f"Error extracting section {section_title}: {e}")
        return ""

def calculate_readability(text: str) -> float:
    """Simple readability score (higher is better)"""
    if not text:
        return 0
        
    words = text.split()
    word_count = len(words)
    if word_count < 10:
        return 0
        
    sentence_count = len(re.split(r'[.!?]+', text))
    if sentence_count == 0:
        sentence_count = 1
    
    avg_sentence_length = word_count / sentence_count
    
    # Simple score based on average sentence length (optimal is around 15-20 words)
    readability = 100 - abs(avg_sentence_length - 17.5) * 2.5
    
    # Clamp between 0 and 100
    return max(0, min(100, readability))

@app.post("/api/create-content")
async def generate_paper(request: PaperRequest):
    try:
        api_key = os.getenv('OPENROUTER_API_KEY')
        if not api_key:
            logger.error("API key not configured on server")
            raise HTTPException(status_code=500, detail="API key not configured on server")
            
        # Log the request
        logger.info(f"Received request to generate paper on topic: {request.topic}")
        
        # API Configuration
        openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "http://localhost:5173",
            "Content-Type": "application/json"
        }

        # Construct academic prompt with section structure
        sections_list = ", ".join(request.sections)
        prompt = (
            f"Generate a rigorous academic paper on '{request.topic}' with approximately {request.word_limit} words. "
            f"Structure the paper with the following clearly labeled sections: {sections_list}. "
            f"Maintain a formal academic tone throughout. Include proper citations in APA format "
            f"and reference academic sources where appropriate. Make the paper detail-oriented with factual "
            f"content. Ensure each section starts with its title on a new line."
        )

        # Log the API request
        logger.info(f"Sending request to OpenRouter API with model: deepseek/deepseek-r1-zero")
        
        # API Request payload
        payload = {
            "model": "deepseek/deepseek-r1-zero:free",  # Using free tier deepseek model
            "messages": [{"role": "user", "content": prompt}]
        }
        
        # Log the payload (for debugging)
        logger.info(f"Request payload: {json.dumps(payload)}")
        
        # Make the API request
        response = requests.post(
            openrouter_url,
            headers=headers,
            json=payload,
            timeout=60  # Add a timeout to prevent hanging
        )

        # Process response
        if response.status_code != 200:
            logger.error(f"API error: {response.status_code} - {response.text}")
            error_detail = response.json().get('error', {}).get('message', 'Unknown error')
            return {"status": "error", "message": f"AI request failed: {error_detail}"}

        # Log successful response
        logger.info("Received successful response from OpenRouter API")
        
        # Extract the content from the response
        response_data = response.json()
        content = response_data['choices'][0]['message']['content']
        
        # Extract sections from the response
        sections = {}
        for section in request.sections:
            section_content = extract_section(content, section, request.sections)
            if section_content:
                sections[section.lower()] = section_content
        
        # Calculate word count for entire paper
        word_count = sum(len(s.split()) for s in sections.values())
        
        # Calculate readability score
        all_text = " ".join(sections.values())
        readability_score = calculate_readability(all_text)
        
        # For demo purposes, generate a fake plagiarism score
        # In a real system, this would involve comparing against a database
        import random
        plagiarism_score = random.randint(1, 15)  # Low plagiarism (1-15%)

        # Log successful paper generation
        logger.info(f"Successfully generated paper on '{request.topic}' with {word_count} words")
        
        return {
            "status": "success",
            "sections": sections,
            "word_count": word_count,
            "readability_score": round(readability_score),
            "plagiarism_score": plagiarism_score
        }

    except requests.exceptions.Timeout:
        logger.error("Request to OpenRouter API timed out")
        return {"status": "error", "message": "Request timed out. Please try again."}
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error: {str(e)}")
        return {"status": "error", "message": f"Network error: {str(e)}"}
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    api_key = os.getenv('OPENROUTER_API_KEY')
    return {
        "status": "healthy", 
        "version": "1.0.0",
        "api_key_configured": bool(api_key)
    }

@app.get("/api/status")
async def api_status():
    """Simple endpoint to check if the API is running"""
    return {"status": "online", "message": "API is operational"}

@app.options("/api/{path:path}")
async def options_handler(request: Request, path: str):
    """Handle OPTIONS preflight requests for CORS"""
    response = Response(status_code=204)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept"
    response.headers["Access-Control-Max-Age"] = "86400"  # 24 hours
    return response