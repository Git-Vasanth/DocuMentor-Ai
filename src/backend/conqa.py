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
file_names_path = r"M:\Projects\documentor-ai\documentor-ai\src\backend\uploaded_files\docs\old\file_names.txt"  # Added file_names path
individual_files_dir = r"uploaded_files/formatted/individual_files"
individual_urls_dir = r"uploaded_files/formatted/individual_urls"


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
        logging.info("Vector store initialized.")

def update_vector_store(formatted_file_paths: List[str] = None, formatted_url_paths: dict = None):
    global vector_store
    if vector_store is None:
        initialize_vector_store()

    new_documents = []

    # Process newly formatted files
    if formatted_file_paths:
        for file_path in formatted_file_paths:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    new_documents.append(Document(page_content=content))
                logging.info(f"Read content from: {file_path}")
            except Exception as e:
                logging.error(f"Error reading formatted file {file_path}: {e}")

    # Process newly formatted URLs
    if formatted_url_paths:
        for url, file_path in formatted_url_paths.items():
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    new_documents.append(Document(page_content=content, metadata={"source": url}))
                logging.info(f"Read content from URL formatted file: {file_path} (source: {url})")
            except Exception as e:
                logging.error(f"Error reading formatted URL file {file_path}: {e}")

    if new_documents:
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=50)
        all_splits = text_splitter.split_documents(new_documents)
        vector_store.add_documents(documents=all_splits)
        logging.info(f"Added {len(all_splits)} new documents to the vector store.")
    else:
        logging.info("No new formatted files or URLs to update the vector store with.")

class State(TypedDict):
    question: str
    context: List[Document]
    answer: str
    chat_history: List[HumanMessage | AIMessage]

def pref_message(message):
    global user_preferences
    user_preferences = message
    return "Preferences received."

def get_uploaded_files():
    try:
        with open(file_names_path, 'r') as f:
            return f.read().splitlines()
    except FileNotFoundError:
        return []

def create_prompt(query: str, relevant_docs: List[Document]) -> str:
    global user_preferences
    prompt = (
        "You are Documentor-Ai, a highly knowledgeable and versatile mentor. "
        "Your expertise spans a wide range of fields, drawing from both the content of the user's uploaded documents and the most current information available online. "
        "You possess a deep understanding of the user's uploaded documents and can seamlessly integrate this knowledge with real-time, internet-sourced data to provide comprehensive and accurate responses. "
        "Your primary goal is to assist the user by answering their questions thoughtfully and thoroughly. "
        "If you cannot find an answer within the provided documents or your general knowledge, please state 'I cannot provide an answer based on the given information.' "
        "If you are uncertain about any aspect of the query, it is acceptable to say 'I'm not entirely sure, but here's what I understand...'. "
        "Otherwise, strive to deliver the most precise, informative, and helpful response possible. "
    )

    uploaded_files = get_uploaded_files()

    if uploaded_files:
        prompt += f"\n\nThe user has uploaded the following documents for your reference: {', '.join(uploaded_files)}. "
        "Please consider the content of these documents when formulating your response."

    if user_preferences:
        prompt += f"\n\nAdditionally, the user has specified the following preferences: {user_preferences}. "
        "Please take these preferences into account when answering."

    if relevant_docs:
        prompt += "\n\nHere is relevant information extracted from the uploaded documents that may assist in answering the user's question:\n\n"
        prompt += '\n\n'.join([doc.page_content for doc in relevant_docs])
    else:
        prompt += "\n\nNo relevant information was found in the uploaded documents. Please answer using your general knowledge and internet resources."

    prompt += f"\n\nUser Question: {query}\n\nAnswer:"
    return prompt

def remove_deduplicated_documents(documents: List[Document]) -> List[Document]:
    """Removes duplicate documents from a list based on their content."""
    unique_docs = list({doc.page_content: doc for doc in documents}.values())
    return unique_docs

def retrieve(state: State):
    if vector_store is None:
        initialize_vector_store()

    question = state["question"]

    # Create retrievers for similarity and MMR
    retriever_vanilla = vector_store.as_retriever(search_type="similarity", search_kwargs={"k": 5})
    retriever_mmr = vector_store.as_retriever(search_type="mmr", search_kwargs={"k": 5, "fetch_k": 10}) # Added fetch_k for MMR

    # Retrieve documents using both methods
    vanilla_relevant_docs = retriever_vanilla.invoke(question)
    mmr_relevant_docs = retriever_mmr.invoke(question)

    # Deduplicate the retrieved documents
    unique_vanilla_docs = remove_deduplicated_documents(vanilla_relevant_docs)
    unique_mmr_docs = remove_deduplicated_documents(mmr_relevant_docs)

    # For this example, we will just use the MMR results, but you could
    # implement logic to choose between them or combine them.
    print(f"Retrieved {len(unique_vanilla_docs)} unique documents using similarity search.")
    print(f"Retrieved {len(unique_mmr_docs)} unique documents using MMR search.")

    return {"context": unique_mmr_docs, "chat_history": state["chat_history"]}

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

chat_histories = {}

def process_user_message(user_message, chat_history, user_id):
    if user_id not in chat_histories:
        chat_histories[user_id] = []

    response = graph.invoke({"question": user_message, "chat_history": chat_histories[user_id]})
    chat_histories[user_id] = response["chat_history"]

    return response["answer"], response["chat_history"]