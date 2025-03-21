import os 
import getpass

from langchain_openai import OpenAIEmbeddings
from dotenv import load_dotenv
import faiss
from langchain_community.docstore.in_memory import InMemoryDocstore
from langchain_community.vectorstores import FAISS
"""
load_dotenv()

embeddings = OpenAIEmbeddings(model="text-embedding-3-large")


dim = 3072

index = faiss.IndexFlatIP(dim)

vector_store = FAISS(
    embedding_function=embeddings,
    index=index,
    docstore=InMemoryDocstore(),
    index_to_docstore_id={},
)
"""
file = r"M:\Projects\documentor-ai\documentor-ai\src\backend\uploaded_files\docs\files_combined_formatted.txt"
with open(file, 'r') as file:
    file_content = file.read()

chunks = file_content.split('\n\n')

print(chunks)