# crawl2rag
Turn Any Website into a Searchable Knowledge Base and Chat with it using Tavily and MongoDB. The system operates through a two-step process:

1. **Website Crawling & Vectorization**: Use Tavily's crawling endpoint to extract and sitemap content from a webpage URL, then embed it into a MongoDB Atlas vector index for retrieval.

<div align="center">
  <img src="images/gif1.gif" alt="Tavily Chatbot Demo" width="800"/>
</div>

2. **Intelligent Q&A Interface**: Query your crawled data through a conversational agent that provides citation-backed answers while maintaining conversation history and context. The agent intelligently distinguishes between informational questions (requiring vector search) and conversational queries (using general knowledge).


<div align="center">
  <img src="images/gif2.gif" alt="Tavily Chatbot Demo" width="800"/>
</div>

**Demo Video:**  
[Watch the full demo here.](images/crawl2rag.mp4)

## Features
- 🕷️ **Advanced Web Crawling**: Deep website content extraction using Tavily's crawling API
- 🔍 **Vector Search**: MongoDB Atlas vector search with OpenAI embeddings for semantic content retrieval
- 🤖 **Smart Question Routing**: Automatic detection of informational vs. conversational queries
- 🧠 **Persistent Memory**: Conversation history and context preservation using LangGraph-MongoDB checkpointing
- 🗂️ **Session Management**: Thread-based conversational persistance and vector store management

## 📂 Repository Structure

### Backend ([`backend/`](./backend))
The core backend logic, powered by Tavily and LangGraph:
- [`agent.py`](./backend/agent.py) – Defines the ReAct agent architecture, state management, and vector search.
- [`prompts.py`](./backend/prompts.py) – Contains customizable prompt templates.

### Server
- [`app.py`](./app.py) – FastAPI server that handles web crawl and vector store creation, vector store deletion, and chatbot streaming responses.

---

## Setup Instructions

### Setting Up MongoDB for Persistence & Vector Storage

To enable vector search, you need to configure a vector index in MongoDB Atlas.

1. **Create a Vector Search Index Collection**  
   Follow the official [MongoDB documentation](https://www.mongodb.com/docs/compass/indexes/create-vector-search-index/) to create a vector search index in your collection. You can name this collection `crawled_index`.

2. **Set the Correct Embedding Dimensions**  
   Make sure the `numDimensions` parameter matches your embedding model.  
   - For **OpenAI's `text-embedding-3-large`**, use: `3072`

3. **Example Vector Index Definition**  
   Replace `<field-to-index>` with the name of the field in your documents that stores the embedding vectors (e.g., `"embedding"`):

   ```json
   {
     "fields": [
       {
         "type": "vector",
         "path": "<field-to-index>",
         "numDimensions": 3072,
         "similarity": "cosine"
       }
     ]
   }
   ```

### Switching Vector Storage Backends

If you want to use a different vector storage solution (other than MongoDB Atlas Vector Search), you will need to update the following parts of the code:

- **`/vectorize` and `/delete_vector_store` endpoints** in [`app.py`](./app.py)
- **`vector_search_tool` method** in [`agent.py`](./backend/agent.py)

Replace the MongoDB-specific logic in these locations with the integration code for your chosen vector database (e.g., Pinecone, Weaviate, Chroma, etc.).

---

### Enabling Conversational Persistence

To enable persistent conversation history, make sure to create **two regular MongoDB collections** (not vector search collections):

- `checkpoint_writes_aio`
- `checkpoints_aio`

These collections will be used for storing and retrieving conversation checkpoints through LangGraph-Mongo integration.

#### Set up environment variables:

   a. Create a `.env` file in the root directory with:
   ```bash
    TAVILY_API_KEY="your-tavily-api-key"
    OPENAI_API_KEY="your-openai-api-key"
    VITE_APP_URL=http://localhost:5173
    DB_NAME=crawl-to-rag
    COLLECTION1=crawled_index
    COLLECTION2=checkpoints_aio
    COLLECTION3=checkpoint_writes_aio
    mongo_usr=xxxxx
    mongo_pass=xxxxx
    MONGO_CLUSTER_URL=xxxxx
    ATLAS_VECTOR_SEARCH_INDEX_NAME=index
   ```

   b. Create a `.env` file in the `ui` directory with:
   ```bash
   VITE_BACKEND_URL=http://localhost:8080
   ```


### Backend Setup
#### Python Virtual Environment
1. Create a virtual environment and activate it:
```bash
python3.11 -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
```

2. Install dependencies:
```bash
python3.11 -m pip install -r requirements.txt
```
3. From the root of the project, run the backend server:
```bash
python app.py
```
#### Alternatively, run the backend with Docker

1. Build and run using Docker:
```bash
# Build the Docker image
docker build -t crawl2rag .

# Run the container
docker run -p 8080:8080 --env-file .env crawl2rag
```

### Frontend Setup

1. In a new terminal, navigate to the frontend directory:
```bash
cd ui
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```
Open the app in your browser at the locally hosted url (e.g. http://localhost:5173/)

## API Endpoints

### Health & Authentication

- **`GET /`**: Health check endpoint that returns server status

### Core Functionality

- **`POST /vectorize`**: Crawl and vectorize a website URL
  - **Body**: `{ "url": "string", "thread_id": "string" }`
  - **Purpose**: Crawls the specified URL using Tavily and creates vector embeddings stored in MongoDB
  - **Response**: Success confirmation with document count

- **`POST /stream_agent`**: Stream conversational agent responses
  - **Body**: `{ "input": "string", "thread_id": "string" }`
  - **Purpose**: Process user queries with streaming responses, automatic tool usage, and citation support
  - **Response**: Server-sent events with real-time agent execution steps

- **`POST /delete_vector_store`**: Delete session-specific vector store data
  - **Body**: `{ "thread_id": "string" }`
  - **Purpose**: Remove all vectorized documents and conversation history for a specific thread
  - **Response**: Confirmation with deletion counts

## Contributing

Feel free to submit issues and enhancement requests!

## 📞 Contact Us

Have questions, feedback, or looking to build something custom? We'd love to hear from you!

---

<div align="center">
  <img src="images/logo_circle.png" alt="Tavily Logo" width="80"/>
  <p>Powered by <a href="https://tavily.com">Tavily</a> - The web API Built for AI Agents</p>
</div>
