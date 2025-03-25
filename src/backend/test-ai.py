import os
import logging
import numpy as np
import faiss
import openai
from langchain_openai import OpenAIEmbeddings
from langchain_community.chat_models import ChatOpenAI
from typing import List
from dotenv import load_dotenv
from typing import Tuple
from openai import OpenAI

load_dotenv()
logging.basicConfig(level=logging.INFO)

openai_api_key = "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"

if not openai_api_key:
    logging.error("OPENAI_API_KEY environment variable is missing!")
    raise EnvironmentError("API key not found. Please check your environment variables.")

openai.api_key = openai_api_key

index = faiss.read_index(r"M:\Projects\documentor-ai\documentor-ai\src\backend\uploaded_files\embds\faiss_index")  # Replace with your index file path

documents = np.load(r"M:\Projects\documentor-ai\documentor-ai\src\backend\uploaded_files\embds\embeddings.npy", allow_pickle=True).tolist()  # Replace with your documents file

# Function to get embeddings for the query
def get_query_embedding(query):
    embedder = OpenAIEmbeddings(model="text-embedding-ada-002")
    query_embeds = embedder.embed_query(query)
    return query_embeds 

"np.array(response.data[0].embedding, dtype=np.float32)"

# Function to retrieve top-k documents using FAISS
def retrieve_documents(query_embedding, k=5):
    # Search FAISS index for top-k similar embeddings
    distances, indices = index.search(np.array([query_embedding]), k)
    # Retrieve corresponding documents
    retrieved_docs = [documents[idx] for idx in indices[0]]
    return retrieved_docs

# Function to generate response using OpenAI with retrieved documents
def generate_response(query, retrieved_docs, model="gpt-3.5-turbo"):
    # Combine query and retrieved documents into a prompt
    context = "\n\n".join(retrieved_docs)
    prompt = f"Query: {query}\n\nContext:\n{context}\n\nAnswer the query based on the context provided."
    
    # Call OpenAI API to generate a response
    response = OpenAI.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=300,
        temperature=0.7
    )
    return response.choices[0].message.content.strip()

u_q_e = get_query_embedding("Explain What python is ?")  # This gives the embedding of the query
r_d = retrieve_documents(u_q_e)  # Use the query embedding to retrieve documents, not call `get_query_embedding` again
print(r_d)

"""

# Main RAG function
def rag_pipeline(query, k=5):
    # Step 1: Get query embedding
    query_embedding = get_query_embedding(query)
    """"""
    # Step 2: Retrieve relevant documents
    retrieved_docs = retrieve_documents(query_embedding, k)
    
    # Step 3: Generate response with retrieved documents
    response = generate_response(query, retrieved_docs)
    
    return response

# Example usage
if __name__ == "__main__":
    query = "What is the Python?"  # Replace with your query
    response = rag_pipeline(query, k=5)
    print("Response:", response)"
    """