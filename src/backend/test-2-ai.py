from langchain_community.chat_models import ChatOpenAI
from langchain_openai import ChatOpenAI  
from langchain.schema import HumanMessage
from dotenv import load_dotenv
import logging
import openai
import numpy as np
from langchain_openai import OpenAIEmbeddings
import faiss

load_dotenv()
logging.basicConfig(level=logging.INFO)

openai_api_key = "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"

if not openai_api_key:
    logging.error("OPENAI_API_KEY environment variable is missing!")
    raise EnvironmentError("API key not found. Please check your environment variables.")

openai.api_key = openai_api_key

# Load the embeddings and FAISS index
embeddings_filename = r"M:\Projects\documentor-ai\documentor-ai\src\backend\uploaded_files\embds\embeddings.npy"
faiss_index_filename = r"M:\Projects\documentor-ai\documentor-ai\src\backend\uploaded_files\embds\faiss_index.index"

# Load embeddings and index
embeddings = np.load(embeddings_filename)
index = faiss.read_index(faiss_index_filename)

# Load OpenAI embeddings model
embeddings_model = OpenAIEmbeddings(model="text-embedding-ada-002")

def pref_message(message):
    try:
        user_pref = message

        return user_pref

    except Exception as e:
        print(f"Error processing message in docai: {e}")
        return "An error occurred while processing your request."
    
def get_query_embedding(query: str) -> np.ndarray:
    try:
        embedding = embeddings_model.embed_documents([query])
        return np.array(embedding).astype("float32")
    except Exception as e:
        logging.error(f"Error generating query embedding: {e}")
        return None
    
def find_relevant_documents(query_embedding: np.ndarray, top_n=5) -> list:
    try:
        # Search the FAISS index
        distances, indices = index.search(query_embedding, top_n)
        return indices, distances
    except Exception as e:
        logging.error(f"Error finding relevant documents: {e}")
        return [], []

def get_documents_by_indices(indices: np.ndarray, document_texts: list) -> list:
    """
    Retrieves document chunks from 'document_texts' based on FAISS indices.

    Args:
        indices: A NumPy array of indices returned by FAISS.
        document_texts: A list of document chunks (strings).

    Returns:
        A list of document chunks corresponding to the given indices.
    """
    try:
        # Flatten indices in case it is a 2D array.
        flat_indices = indices.flatten().tolist()
        relevant_docs = [document_texts[i] for i in flat_indices]
        return relevant_docs
    except IndexError as e:
        logging.error(f"IndexError: {e}. Indices out of range for document_texts.")
        return []
    except Exception as e:
        logging.error(f"Error retrieving documents by indices: {e}")
        return []

def generate_prompt(query: str, relevant_docs: list) -> str:
    prompt = (
        f"You are a knowledgeable mentor with vast expertise in various fields, including the content of the uploaded documents and the world’s most up-to-date knowledge. "
        f"You are well-versed in the documents the user has uploaded and can combine that knowledge with the latest information from the internet. "
        f"Answer the user's questions based on your understanding of the uploaded documents and external knowledge. "
        f"If you don't know the answer, say 'no'. If you're not sure about something, say 'I'm not sure'. Otherwise, provide the most accurate and helpful answer you can. "
        f"\n\nHere are some relevant pieces of information from the uploaded documents to help answer the question:\n\n"
    )
    for i, doc in enumerate(relevant_docs):
        prompt += f"Document {i+1}: {doc}\n\n"
    prompt += f"Question: {query}\n\nAnswer:"
    return prompt

def generate_response(query: str, relevant_docs: list) -> str:
    prompt = generate_prompt(query, relevant_docs)
    try:
        response = openai.Completion.create(
            model="gpt-3.5-turbo",  # Choose the appropriate OpenAI model
            prompt=prompt,
            max_tokens=50,
            temperature=0.7
        )
        return response['choices'][0]['text'].strip()
    except Exception as e:
        logging.error(f"Error generating AI response: {e}")
        return "An error occurred while generating the response."