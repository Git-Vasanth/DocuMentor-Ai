import os
import logging
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
import openai
import numpy as np
import faiss  
from typing import List, Tuple
from langchain_community.chat_models import ChatOpenAI
from langchain_openai import ChatOpenAI  
from langchain.schema import HumanMessage

load_dotenv()
logging.basicConfig(level=logging.INFO)

openai_api_key = "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"

if not openai_api_key:
    logging.error("OPENAI_API_KEY environment variable is missing!")
    raise EnvironmentError("API key not found. Please check your environment variables.")

openai.api_key = openai_api_key

file_path = r"M:\Projects\documentor-ai\documentor-ai\src\backend\uploaded_files\docs\files_combined_formatted.txt"

# Reading file
def read_file(file_path: str) -> str:
    logging.info("Order - 1 : Reading the file")
    if not os.path.exists(file_path):
        logging.error(f"File not found: {file_path}")
        raise FileNotFoundError(f"The file at {file_path} does not exist.")
    with open(file_path, 'r', encoding='utf-8') as file:
        return file.read()

# Splitting text into chunks
def split_into_chunks(text: str, chunk_size: int = 400, chunk_overlap: int = 100) -> List:
    logging.info("Order - 2 : Splitting the text into chunks")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        is_separator_regex=False,
    )
    documents = text_splitter.create_documents([text])
    logging.info(f"Created {len(documents)} chunks. First few chunk sizes: {[(i, len(doc.page_content)) for i, doc in enumerate(documents[:5])]}")

    return documents

# Generating embeddings
def generate_embeddings(documents: List) -> Tuple[np.ndarray, List[str]]:
    logging.info("Order - 3 : Generate Embeddings")
    embeddings_model = OpenAIEmbeddings(model="text-embedding-ada-002")
    document_texts = [doc.page_content for doc in documents]

    try:
        embeddings = embeddings_model.embed_documents(document_texts)
        logging.info(f"Successfully embedded {len(documents)} chunks.")
    except Exception as e:
        logging.error(f"Error embedding documents: {e}")
        raise

    embeddings_array = np.array(embeddings).astype("float32")
    logging.info(f"Shape of generated embeddings: {embeddings_array.shape}")

    return embeddings_array, document_texts

# Function to save embeddings to a .npy file
def save_embeddings(embeddings_array: np.ndarray, filename: str):
    logging.info(f"Saving embeddings to {filename}")
    np.save(filename, embeddings_array)
    logging.info(f"Embeddings saved to {filename}")

# Function to save the FAISS index to a .index file
def save_faiss_index(index: faiss.Index, filename: str):
    logging.info(f"Saving FAISS index to {filename}")
    faiss.write_index(index, filename)
    logging.info(f"FAISS index saved to {filename}")

# Main function that does the entire process and saves files internally
def build_and_save():
    # File paths for saving
    embeddings_filename = "./embds/embeddings.npy"  # Output path for embeddings
    faiss_index_filename = "./embds/faiss_index.index"  # Output path for FAISS index
    
    # Step 1: Read the file
    text = read_file(file_path)

    # Step 2: Split text into chunks
    doc = split_into_chunks(text)

    # Step 3: Generate embeddings
    emb, text_list = generate_embeddings(doc)

    # Step 4: Save embeddings to file
    save_embeddings(emb, embeddings_filename)

    # Step 5: Create FAISS index
    dimension = emb.shape[1]
    index = faiss.IndexFlatIP(dimension)  # Using inner product (cosine similarity)
    index.add(emb)  # Add embeddings to the index
    logging.info(f"Total vectors in the index: {index.ntotal}")

    # Step 6: Save FAISS index to file
    save_faiss_index(index, faiss_index_filename)