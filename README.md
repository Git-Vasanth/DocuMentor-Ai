# DocuMentor-AI

DocuMentor-AI is an intelligent assistant designed to help you quickly find information within your documents and linked content. Simply upload your documents or drop your links, and let our AI provide answers directly from your content, ensuring transparency and accuracy.

---

## Features

- **Content Upload:** Upload various document types, including PDFs, DOC/DOCX, and TXT files, or provide URLs for analysis.
- **Direct Answers:** Get answers straight from your uploaded content, eliminating guesswork.
- **Knowledgeable Assistant:** DocuMentor-AI acts as your mentor, ready to support your quest for knowledge by providing thorough and accurate answers.
- **Scalable Performance:** Efficiently handles a range of document sizes with competitive response times and high faithfulness in generated responses.

---

## How it Works

DocuMentor-AI utilizes a robust RAG (Retrieval Augmented Generation) pipeline to process and understand your documents:

1. **Server Initialization:** Upon server start, the system checks for an existing local vector database. If one doesn't exist, an empty one is created.
2. **Extraction & Transformation:** Uploaded documents (PDF, DOC/DOCX, TXT) or content from URLs are extracted and transformed into formatted text files.
3. **Embeddings:** The formatted text is then converted into numerical representations called embeddings, which are stored in a vector database.
4. **Query Processing:** When a user submits a query, it is also converted into a vector.
5. **Search & Retrieval:** The system performs a search within the vector database using techniques like Cosine Similarity and BM25 to find the most relevant document embeddings.
6. **Context Generation:** Relevant document contexts are extracted, keeping only unique documents.
7. **Response Generation:** The user query, along with the retrieved context and previous chat history, is fed into a prompt template to generate a comprehensive and accurate response.
8. **Dynamic Vector Database Updates:** New embeddings from uploaded documents are seamlessly added to the existing vector database, or a new one is created if none exists.

---

## Technology Stack

### Frontend

- React
- Material UI

### Backend

- Flask
- Langchain
- Python
- Firebase
- OpenAI
- pdfplumber
- docx
- bs4

---

## Data Validation

DocuMentor-AI employs rigorous data validation using:

- **Packages:** DeepEval and Ragas.
- **Metrics:** Faithfulness, Context Precision, and Response Relevancy are used to evaluate the quality of the RAG pipeline's generator, assess the relevance of retrieved contexts, and determine how relevant a response is to the user input.

---

## Benchmarks

Measurements are based on logs, and all values represent averages.

| Pages       | Response Time | Model Accuracy (Faithfulness) |
|-------------|---------------|-------------------------------|
| 501 - 1k    | ≤ 1 Min       | 70-73%                        |
| 1k - 1.5k   | 2 - 3 Min     | AI: 9 Secs                   |
| 2k+         | 10+ Min       | AI: 1.1 Secs                 |

*Note: With Proof of Video Samples available. Other metrics are yet to be used.*

---
## Presentation

You can view the full presentation here: [DocuMentor-AI Presentation (PDF)]((https://github.com/Git-Vasanth/DocuMentor-Ai/blob/master/Documentor%20-%20Ai%20-%20presentation.pdf))

## Business Impact

DocuMentor-AI delivers significant business value by:

- **Saving Time:** Rapidly extract insights from vast amounts of documentation, reducing manual review time.
- **Improving Decision Making:** Provide quick, accurate, and context-rich answers, enabling better-informed decisions.
- **Enhancing Knowledge Management:** Centralize and democratize access to information within an organization, fostering a more knowledgeable workforce.
- **Increasing Efficiency:** Automate the information retrieval process, freeing up valuable human resources for more complex tasks.
- **Ensuring Accuracy:** Leverage robust data validation and RAG mechanisms to deliver highly faithful and relevant responses, minimizing errors.

---

## Metrics-Driven Impact

The application of metrics such as Faithfulness, Context Precision, and Response Relevancy directly translates to:

- **High-Quality Outputs:** Guaranteeing that generated responses are consistently accurate and relevant to user queries.
- **Trust and Reliability:** Building user confidence in the information provided, as responses are validated against retrieved contexts.
- **Continuous Improvement:** Providing quantifiable data to identify areas for refinement in the RAG pipeline, leading to ongoing enhancements in performance and accuracy.

