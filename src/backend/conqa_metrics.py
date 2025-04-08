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
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

openai_api_key = "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"

openai.api_key = openai_api_key

formatted_texts_file_path = r"M:\Projects\documentor-ai\documentor-ai\src\backend\uploaded_files\formatted\files_combined_formatted.txt"
formatted_urls_file_path = r"M:\Projects\documentor-ai\documentor-ai\src\backend\uploaded_files\formatted\Urls_combined_formatted.txt"
file_names_path = r"M:\Projects\documentor-ai\documentor-ai\src\backend\uploaded_files\docs\file_names.txt"  # Added file_names path


embeddings = OpenAIEmbeddings(model="text-embedding-ada-002")

model = init_chat_model("gpt-4o-mini", model_provider="openai")

embedding_dim = 1536

# Initialize vector_store as None initially
vector_store = None
user_preferences = ""  # Store user preferences globally

def retrieve_top_k(query_embedding, document_embeddings, k=5):
    """Retrieves the top-k documents based on cosine similarity."""
    similarities = cosine_similarity(query_embedding.reshape(1, -1), document_embeddings)[0]
    sorted_indices = np.argsort(similarities)[::-1]
    top_k_indices = sorted_indices[:k]
    top_k_scores = similarities[top_k_indices]
    return top_k_indices, top_k_scores

def mmr_retrieval(query_embedding, document_embeddings, selected_count=5, lambda_param=0.5, initial_top_n=10):
    """Retrieves a diverse set of documents using MMR."""
    if len(document_embeddings) < initial_top_n:
        initial_indices = np.arange(len(document_embeddings))
    else:
        similarities = cosine_similarity(query_embedding.reshape(1, -1), document_embeddings)[0]
        initial_indices = np.argsort(similarities)[::-1][:initial_top_n]

    candidate_embeddings = document_embeddings[initial_indices]
    remaining_indices = list(range(len(candidate_embeddings)))
    selected_indices_mmr = []

    if not remaining_indices:
        return initial_indices[:selected_count], np.array([])  # Return initial if no candidates

    # Select the most relevant document first
    query_similarity = cosine_similarity(query_embedding.reshape(1, -1), candidate_embeddings)[0]
    first_relevant_index = np.argmax(query_similarity)
    selected_indices_mmr.append(initial_indices[first_relevant_index])
    remaining_indices.remove(first_relevant_index)

    for _ in range(selected_count - 1):
        if not remaining_indices:
            break

        mmr_scores = {}
        for i in remaining_indices:
            candidate_index_original = initial_indices[i]
            relevance = cosine_similarity(query_embedding.reshape(1, -1), document_embeddings[candidate_index_original].reshape(1, -1))[0][0]
            diversity = 1.0
            if selected_indices_mmr:
                similarity_to_selected = cosine_similarity(
                    document_embeddings[candidate_index_original].reshape(1, -1),
                    document_embeddings[selected_indices_mmr]
                )[0]
                diversity = 1.0 - np.max(similarity_to_selected)

            mmr_score = lambda_param * relevance + (1 - lambda_param) * diversity
            mmr_scores[i] = mmr_score

        if mmr_scores:
            best_candidate_index_relative = max(mmr_scores, key=mmr_scores.get)
            selected_indices_mmr.append(initial_indices[best_candidate_index_relative])
            remaining_indices.remove(best_candidate_index_relative)
        else:
            break # No more candidates to select

    selected_mmr_scores = cosine_similarity(query_embedding.reshape(1, -1), document_embeddings[selected_indices_mmr])[0]
    return selected_indices_mmr, selected_mmr_scores

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

def retrieve(state: State):
    if vector_store is None:
        initialize_vector_store()

    query_embedding = embeddings.embed_query(state["question"])
    document_embeddings = vector_store.index.reconstruct_n(0, vector_store.index.ntotal) # Get all embeddings

    if document_embeddings.size == 0:
        return {"context": [], "chat_history": state["chat_history"]}

    high_relevance_threshold = 0.85 # You can tune this
    lambda_mmr = 0.5 # You can tune this

    top_k_indices, top_k_scores = retrieve_top_k(query_embedding, document_embeddings, k=5)
    avg_similarity_topk = np.mean(top_k_scores) if top_k_scores.size > 0 else 0.0
    top_similarity_topk = top_k_scores[0] if top_k_scores.size > 0 else 0.0

    mmr_indices, mmr_scores = mmr_retrieval(query_embedding, document_embeddings, selected_count=5, lambda_param=lambda_mmr, initial_top_n=10)
    avg_similarity_mmr_selected = np.mean(cosine_similarity(query_embedding.reshape(1, -1), document_embeddings[mmr_indices])[0]) if mmr_indices else 0.0
    confidence_topk = avg_similarity_topk * 100
    confidence_mmr = avg_similarity_mmr_selected * 100

    selected_docs = []
    confidence_percentage = 0.0

    if top_similarity_topk >= high_relevance_threshold:
        selected_docs = [vector_store.docstore.get(vector_store.index_to_docstore_id[i]) for i in top_k_indices]
        confidence_percentage = confidence_topk
        print(f"Using Top-k Results (Confidence: {confidence_percentage:.2f}%)")
    else:
        selected_docs = [vector_store.docstore.get(vector_store.index_to_docstore_id[i]) for i in mmr_indices]
        confidence_percentage = confidence_mmr
        print(f"Using MMR Results (Confidence: {confidence_percentage:.2f}%)")

    return {"context": selected_docs, "chat_history": state["chat_history"]}

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