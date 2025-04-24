import os
import sys
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.llms import OpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
import pickle

# Define constants - Only FAISS and PKL paths are needed. These are the ONLY paths used.
FAISS_FILE_PATH = r"M:\Projects\documentor-ai\documentor-ai\src\backend\uploaded_files\vecdbs"
PKL_FILE_PATH = r"M:\Projects\documentor-ai\documentor-ai\src\backend\uploaded_files\vecdbs"
embeddings = []
new_vector_store = FAISS.load_local(
    FAISS_FILE_PATH, embeddings, allow_dangerous_deserialization=True
)

print(new_vector_store)