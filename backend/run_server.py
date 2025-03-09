import os
import sys
import uvicorn
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("api.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def main():
    # Load environment variables
    load_dotenv()
    
    # Check if API key is configured
    api_key = os.getenv('OPENROUTER_API_KEY')
    if not api_key or api_key == "your_openrouter_api_key_here":
        logger.error("OpenRouter API key is not properly configured!")
        logger.error("Please update the .env file with your actual API key.")
        print("\n=====================================================")
        print(" ERROR: OpenRouter API key is not configured!")
        print(" Please add your API key to the .env file and try again.")
        print(" Get your free API key at: https://openrouter.ai/")
        print("=====================================================\n")
        return
    
    logger.info("Starting CiteAI backend server...")
    
    # Run the server
    try:
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}")
        print(f"\nError starting server: {str(e)}")

if __name__ == "__main__":
    main() 