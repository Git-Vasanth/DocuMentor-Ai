from langchain_community.chat_models import ChatOpenAI
from langchain_openai import ChatOpenAI  
from langchain.schema import HumanMessage
from dotenv import load_dotenv
import logging
import openai

load_dotenv()
logging.basicConfig(level=logging.INFO)

openai_api_key = "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"

if not openai_api_key:
    logging.error("OPENAI_API_KEY environment variable is missing!")
    raise EnvironmentError("API key not found. Please check your environment variables.")

openai.api_key = openai_api_key

file_path = r""

def pref_message(message):
    try:
        user_pref = message

        return user_pref

    except Exception as e:
        print(f"Error processing message in docai: {e}")
        return "An error occurred while processing your request."
    
