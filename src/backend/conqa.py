# conqa.py
import logging
import os
from langchain_openai import OpenAI
from langchain.chat_models import init_chat_model
import openai
from langchain_core.messages import HumanMessage, AIMessage
import faiss
from langchain_community.docstore.in_memory import InMemoryDocstore
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.graph import START, StateGraph
from typing_extensions import List, TypedDict
from langchain_core.documents import Document

openai_api_key = "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"

openai.api_key = openai_api_key

formatted_texts_file_path = r"M:\Projects\documentor-ai\documentor-ai\src\backend\uploaded_files\formatted\files_combined_formatted.txt"
formatted_urls_file_path = r"M:\Projects\documentor-ai\documentor-ai\src\backend\uploaded_files\formatted\Urls_combined_formatted.txt"

embeddings = OpenAIEmbeddings(model="text-embedding-ada-002")

model = init_chat_model("gpt-4o-mini", model_provider="openai")

embedding_dim = 1536

# Initialize vector_store as None initially
vector_store = None
user_preferences = ""  # Store user preferences globally

def initialize_vector_store():
    global vector_store
    if vector_store is None:
        index = faiss.IndexFlatIP(embedding_dim)
        vector_store = FAISS(
            embedding_function=embeddings,
            index=index,
            docstore=InMemoryDocstore(),
            index_to_docstore_id={},
        )
        update_vector_store()

def update_vector_store():
    global vector_store
    if vector_store is None:
        initialize_vector_store()

    try:
        with open(formatted_texts_file_path, 'r', encoding='utf-8') as file:
            content_file = file.read()

        with open(formatted_urls_file_path, 'r', encoding='utf-8') as file:
            content_url = file.read()

        document = Document(page_content=content_file + content_url)

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=50)

        all_splits = text_splitter.split_documents([document])

        vector_store.add_documents(documents=all_splits)
        logging.info("Vector store updated successfully.")
    except Exception as e:
        logging.error(f"Error updating vector store: {e}")

class State(TypedDict):
    question: str
    context: List[Document]
    answer: str
    chat_history: List[HumanMessage | AIMessage]

def pref_message(message):
    global user_preferences
    user_preferences = message
    return "Preferences received."

def create_prompt(query: str, relevant_docs: List[Document]) -> str:
    global user_preferences
    prompt = (
        f"Youre Name is Documentor-Ai"
        f"You are a knowledgeable mentor with vast expertise in various fields, including the content of the uploaded documents and the world’s most up-to-date knowledge. "
        f"You are well-versed in the documents the user has uploaded and can combine that knowledge with the latest information from the internet. "
        f"Answer the user's questions based on your understanding of the uploaded documents and external knowledge. "
        f"If you don't know the answer, say 'no'. If you're not sure about something, say 'I'm not sure'. Otherwise, provide the most accurate and helpful answer you can. "
    )
    if user_preferences:
        prompt += f"\n\nUser Preferences: {user_preferences}"

    prompt += f"\n\nHere are some relevant pieces of information from the uploaded documents to help answer the question:\n\n"

    prompt += '\n\n'.join([doc.page_content for doc in relevant_docs])
    prompt += f"\n\nQuestion: {query}\n\nAnswer:"
    return prompt

def retrieve(state: State):
    if vector_store is None:
        initialize_vector_store()
    retrieved_docs = vector_store.similarity_search(state["question"])
    return {"context": retrieved_docs, "chat_history": state["chat_history"]}

def generate(state: State):
    docs_content = state["context"]
    question = state["question"]
    prompt_str = create_prompt(question, docs_content)
    messages = state["chat_history"] + [HumanMessage(content=prompt_str)]
    response = model.invoke(messages)
    return {"answer": response.content, "chat_history": state["chat_history"] + [HumanMessage(content=question), AIMessage(content=response.content)]}

graph_builder = StateGraph(State).add_sequence([retrieve, generate])
graph_builder.add_edge(START, "retrieve")
graph = graph_builder.compile()

chat_histories = {}  # store the chat histories here.

def process_user_message(user_message, chat_history, user_id):
    if user_id not in chat_histories:
        chat_histories[user_id] = []

    response = graph.invoke({"question": user_message, "chat_history": chat_histories[user_id]})
    chat_histories[user_id] = response["chat_history"]

    return response["answer"], response["chat_history"]