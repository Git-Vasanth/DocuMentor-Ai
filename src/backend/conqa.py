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
from typing import List, Dict
from typing_extensions import List, TypedDict
from langchain_community.retrievers import BM25Retriever
from langchain_core.documents import Document
import pickle
from deepeval.test_case import LLMTestCase
from deepeval.metrics import FaithfulnessMetric
from langchain.chains import create_history_aware_retriever, create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(), logging.FileHandler("app.log")]
)

openai_api_key = "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"

openai.api_key = openai_api_key

formatted_texts_file_path = r"M:\Projects\documentor-ai\documentor-ai\src\backend\uploaded_files\formatted\files_combined_formatted.txt"
formatted_urls_file_path = r"M:\Projects\documentor-ai\documentor-ai\src\backend\uploaded_files\formatted\Urls_combined_formatted.txt"
file_names_path = r"M:\Projects\documentor-ai\documentor-ai\src\backend\uploaded_files\docs\old\file_names.txt"  # Added file_names path
individual_files_dir = r"uploaded_files/formatted/individual_files"
individual_urls_dir = r"uploaded_files/formatted/individual_urls"

FAISS_FILE_PATH = r"M:\Projects\documentor-ai\documentor-ai\src\backend\uploaded_files\vecdbs"
PKL_FILE_PATH = r"M:\Projects\documentor-ai\documentor-ai\src\backend\uploaded_files\vecdbs"

embeddings = OpenAIEmbeddings(model="text-embedding-ada-002")

model = init_chat_model("gpt-4o-mini", model_provider="openai")

embedding_dim = 1536

vector_store = None
index_name = 'index'
user_preferences = ""
file_names = ''  

def create_empty_faiss_index():
    logging.info(f"Creating an empty FAISS index with {embedding_dim} dimensions.")
    # Create a FAISS index (Flat Inner Product)
    index = faiss.IndexFlatIP(embedding_dim)
    
    # Save the empty FAISS index to file
    faiss.write_index(index, os.path.join(FAISS_FILE_PATH, f"{index_name}.faiss"))
    logging.info(f"FAISS index created and saved to {FAISS_FILE_PATH}/{index_name}.faiss")

def create_empty_pkl_file():
    logging.info(f"Creating an empty PKL file for docstore.")
    index_to_docstore = {}  # Empty docstore map (no documents yet)
    
    with open(os.path.join(FAISS_FILE_PATH, f"{index_name}.pkl"), 'wb') as f:
        pickle.dump(index_to_docstore, f)
    logging.info(f"PKL docstore file created and saved to {FAISS_FILE_PATH}/{index_name}.pkl")

def get_uploaded_files():
    try:
        with open(file_names_path, 'r') as f:
            return f.read().splitlines()
    except FileNotFoundError:
        return []


def initialize_vector_store():
    global vector_store
    print(f"Attempting to load vector store from: {FAISS_FILE_PATH}")
    if os.path.exists(FAISS_FILE_PATH):
        try:
            vector_store = FAISS.load_local(
                FAISS_FILE_PATH,
                embeddings,
                allow_dangerous_deserialization=True  # Add this parameter
            )
            logging.info(f"Vector store loaded successfully from {FAISS_FILE_PATH} with {vector_store.index.ntotal} vectors.")
        except Exception as e:
            logging.error(f"Error loading vector store from {FAISS_FILE_PATH}: {e}", exc_info=True)
            print(f"Error loading vector store: {e}")
            index = faiss.IndexFlatIP(embedding_dim)
            vector_store = FAISS(
                embedding_function=embeddings,
                index=index,
                docstore=InMemoryDocstore(),
                index_to_docstore_id={},
            )
            logging.info("Initialized a new empty vector store due to loading error.")
            print("Initialized a new empty vector store.")
    else:
        index = faiss.IndexFlatIP(embedding_dim)
        vector_store = FAISS(
            embedding_function=embeddings,
            index=index,
            docstore=InMemoryDocstore(),
            index_to_docstore_id={},
        )
        logging.info("Initialized a new empty vector store (no existing file found).")
        print("Initialized a new empty vector store (no existing file found).")

def check_local_vector_store():
    global vector_store
    if os.path.exists(FAISS_FILE_PATH):
        try:
            vector_store = FAISS.load_local(
                FAISS_FILE_PATH,
                embeddings,
                'index',
                allow_dangerous_deserialization=True
            )
            logging.info(f"Local vector store found and loaded from {FAISS_FILE_PATH} with {vector_store.index.ntotal} vectors.")
            print(f"Local vector store found and loaded with {vector_store.index.ntotal} vectors.")
            return True
        except Exception as e:
            logging.error(f"Error loading local vector store from {FAISS_FILE_PATH}: {e}", exc_info=True)
            print(f"Error loading local vector store: {e}")
            vector_store = None
            return False
    else:
        logging.info("No local vector store found.")
        print("No local vector store found.")
        vector_store = None
        return False

def update_vector_store(formatted_file_paths: List[str] = None, formatted_url_paths: Dict[str, str] = None):
    global vector_store
    if vector_store is None:
        initialize_vector_store()

    new_documents = []

    if formatted_file_paths:
        for file_path in formatted_file_paths:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    new_documents.append(Document(page_content=content))
                logging.info(f"Read content from: {file_path}")
                print(f"File {file_path} read successfully.")
            except Exception as e:
                logging.error(f"Error reading formatted file {file_path}: {e}")
                print(f"Error reading file {file_path}: {e}")

    if formatted_url_paths:
        for url, file_path in formatted_url_paths.items():
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    new_documents.append(Document(page_content=content, metadata={"source": url}))
                logging.info(f"Read content from URL formatted file: {file_path} (source: {url})")
                print(f"URL file {file_path} read successfully.")
            except Exception as e:
                logging.error(f"Error reading formatted URL file {file_path}: {e}")
                print(f"Error reading url file {file_path}: {e}")

    if new_documents:
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=50)
        all_splits = text_splitter.split_documents(new_documents)
        print(f"length of Document splits: {len(all_splits)}")
        try:
            print("Adding documents to vector store...")
            vector_store.add_documents(documents=all_splits)
            print("Documents added to vector store.")
            logging.info(f"Added {len(all_splits)} new documents to the vector store.")
            vector_store.save_local(FAISS_FILE_PATH, 'index') #save the vector store after adding.
        except Exception as e:
            print(f"Error adding documents to vector store: {e}")
    else:
        logging.info("No new formatted files or URLs to update the vector store with.")
        print("No documents added to vector store.")

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
        "You are Documentor-AI, a highly knowledgeable and helpful AI assistant and mentor. "
        "Your job is to assist the user by providing thorough, accurate, and helpful answers to their questions. "
        "You should always answer based on the information available from the documents the user has uploaded, as well as from your internal knowledge base. "
        "If the answer to a user's question can be found in the uploaded documents (PDFs, URLs), provide that information first. "
        "If the answer cannot be found in the documents, respond using your internal knowledge and clarify that the information is not from the documents but from your own knowledge base. "
        "Always ensure to state clearly when your answer is based on documents and when it's based on your internal knowledge. "
        "\n\n"
    )

    # Add user preferences if available
    if user_preferences:
        prompt += f"\n\nThe user has specified the following preferences: {user_preferences}. "
        prompt += "Please consider these preferences when formulating your response."

    # Add uploaded files if available
    uploaded_files = get_uploaded_files()
    if uploaded_files:
        prompt += f"\n\nThe user has uploaded the following documents (PDFs, URLs): {', '.join(uploaded_files)}. "
        prompt += "You should consider the content of these documents when answering the user's question."

    # Add relevant documents if available
    if relevant_docs:
        prompt += "\n\nRelevant Information:\n"
        prompt += '\n\n'.join([doc.page_content for doc in relevant_docs])
        prompt += "\n\n"
    else:
        prompt += "No relevant documents were found.\n\n"

    # Add user query
    prompt += f"User Question: {query}\n\nAnswer:"
    
    return prompt

def remove_deduplicated_documents(documents: List[Document]) -> List[Document]:
    unique_docs = list({doc.page_content: doc for doc in documents}.values())
    return unique_docs

def retrieve(state: State):
    global vector_store
    print(f"Entering retrieve function. Vector store: {vector_store}")
    if vector_store and vector_store.index.ntotal > 0:
        print(f"Vector store has {vector_store.index.ntotal} vectors. Proceeding with search.")
        question = state["question"]
        cosine_retriever = vector_store.as_retriever(search_type="similarity", search_kwargs={"k": 5})
        cosine_docs = cosine_retriever.invoke(question)
        print(f"Retrieved {len(cosine_docs)} documents using cosine similarity on original query.")
    else:
        print("Vector store is empty or not initialized, skipping cosine similarity retrieval.")
        cosine_docs = []
        question = state["question"] # Still need the question for BM25

    bm25_docs = []
    if vector_store and vector_store.docstore._dict:
        bm25_retriever = BM25Retriever.from_documents(
            documents=vector_store.docstore._dict.values(),
            k=10
        )
        bm25_docs = bm25_retriever.invoke(question)
        print(f"Retrieved {len(bm25_docs)} documents using BM25 keyword search on original query.")
    else:
        print("Vector store is empty or docstore is empty, skipping BM25 keyword search.")

    combined_docs = list(cosine_docs) + list(bm25_docs)
    unique_combined_docs = remove_deduplicated_documents(combined_docs)
    print(f"Combined {len(unique_combined_docs)} unique documents.")

    mmr_selected_docs = []
    if unique_combined_docs and vector_store and vector_store.index.ntotal > 0:
        mmr_retriever = vector_store.as_retriever(search_type="mmr", search_kwargs={"k": 5, "fetch_k": len(unique_combined_docs)})
        mmr_selected_docs = mmr_retriever.invoke(input=question, documents=unique_combined_docs)
        print(f"Selected {len(mmr_selected_docs)} documents using MMR on original query.")
    else:
        print("Vector store is empty or no combined documents, skipping MMR selection.")

    return {"context": mmr_selected_docs, "chat_history": state["chat_history"]}

def generate(state: State):
    docs_content = state["context"]
    question = state["question"]
    prompt_str = create_prompt(question, docs_content)
    response = model.invoke(prompt_str)
    return {"answer": response.content, "context": docs_content, "question": question, "chat_history": state["chat_history"] + [HumanMessage(content=question), AIMessage(content=response.content)]}

def evaluate_response(state: State):
    metric = FaithfulnessMetric(threshold=0.7, model="gpt-4o-mini", include_reason=True)
    test_case = LLMTestCase(input=state["question"], actual_output=state["answer"], retrieval_context=[doc.page_content for doc in state["context"]])
    try:
        result = metric.measure(test_case)
        if isinstance(result, tuple):
            score, reason = result
            print(f"Faithfulness Score: {round(score,2)*100}%, Reason: {reason}")
        elif isinstance(result, float):
            print(f"Faithfulness Score: {round(score,2)*100}%, Reason: No reason provided.")
        else:
            print("Unexpected result type from DeepEval.")
        return {"answer": state["answer"], "chat_history": state["chat_history"]}
    except Exception as e:
        print(f"Error during evaluation: {e}")
        return {"answer": state["answer"], "chat_history": state["chat_history"]}

graph_builder = StateGraph(State)
graph_builder.add_node("retrieve", retrieve)
graph_builder.add_node("generate", generate)
graph_builder.add_node("evaluate", evaluate_response)
graph_builder.set_entry_point("retrieve")
graph_builder.add_edge("retrieve", "generate")
graph_builder.add_edge("generate","evaluate")
graph = graph_builder.compile()

chat_histories = {}
def process_user_message(user_message, chat_history, user_id):
    global chat_histories
    global vector_store

    if vector_store is None:
        check_local_vector_store()

    if user_id not in chat_histories:
        chat_histories[user_id] = []
    result = graph.invoke({"question": user_message, "chat_history": chat_history})
    chat_histories[user_id].append(HumanMessage(content=user_message))
    chat_histories[user_id].append(AIMessage(content=result["answer"]))
    return {"answer": result['answer'], "chat_history": chat_histories[user_id]}
