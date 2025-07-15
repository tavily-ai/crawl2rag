import json
import logging
import os

import certifi
from langchain_mongodb import MongoDBAtlasVectorSearch
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langgraph.checkpoint.mongodb import AsyncMongoDBSaver
from langgraph.prebuilt import create_react_agent
from pymongo import MongoClient

from .prompts import PROMPT

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Agent:
    def __init__(
        self,
        checkpointer: AsyncMongoDBSaver = None,
        thread_id: str = None,
    ):
        self.llm = ChatOpenAI(
            model="gpt-4.1-nano", api_key=os.getenv("OPENAI_API_KEY")
        ).with_config({"tags": ["streaming"]})

        self.prompt = PROMPT
        self.thread_id = thread_id
        self.checkpointer = checkpointer

    def build_graph(self, api_key: str):
        """
        Build and compile the LangGraph workflow.
        """
        if not api_key:
            raise ValueError("API key is required")

        vector_search_tool = self.vector_search_tool(self.thread_id)

        return create_react_agent(
            prompt=self.prompt,
            model=self.llm,
            tools=[vector_search_tool],
            checkpointer=self.checkpointer,
        )

    def vector_search_tool(self, thread_id: str = None):
        """Create a vector search tool for a specific session"""
        # define embeddings as default OpenAI embeddings
        embeddings = OpenAIEmbeddings(
            model="text-embedding-3-large", api_key=os.getenv("OPENAI_API_KEY")
        )
        mongo_usr = os.getenv("mongo_usr")
        mongo_pass = os.getenv("mongo_pass")
        mongo_cluster_url = os.getenv("MONGO_CLUSTER_URL")

        mongodb_uri = f"mongodb+srv://{mongo_usr}:{mongo_pass}@{mongo_cluster_url}/?retryWrites=true&w=majority&appName=Cluster2"
        # initialize MongoDB python client
        client = MongoClient(mongodb_uri, tlsCAFile=certifi.where())

        DB_NAME = os.getenv("DB_NAME")
        COLLECTION_NAME = os.getenv("COLLECTION1")
        ATLAS_VECTOR_SEARCH_INDEX_NAME = os.getenv("ATLAS_VECTOR_SEARCH_INDEX_NAME")

        MONGODB_COLLECTION = client[DB_NAME][COLLECTION_NAME]

        vector_store = MongoDBAtlasVectorSearch(
            collection=MONGODB_COLLECTION,
            embedding=embeddings,
            index_name=ATLAS_VECTOR_SEARCH_INDEX_NAME,
            relevance_score_fn="cosine",
        )

        # Create a custom tool with better debugging
        def vector_search_func(query: str) -> str:
            """Search for relevant documents in the vector store"""
            logger.info(f"Vector search query: {query}")

            try:
                # If thread_id is provided, search with metadata filter
                all_results = vector_store.similarity_search(query, k=20)

                if thread_id:
                    results = [
                        doc
                        for doc in all_results
                        if doc.metadata.get("thread_id") == thread_id
                    ]
                    results = results[:10]
                else:
                    results = all_results[:10]

                logger.info(f"Found {len(results)} results")

                if not results:
                    return json.dumps({"content": {"query": query, "results": []}})

                # Format results as JSON structure
                formatted_results = []
                for doc in results:
                    formatted_results.append(
                        {
                            "url": doc.metadata.get("url", "Unknown URL"),
                            "content": doc.page_content,
                            "favicon": doc.metadata.get("favicon", ""),
                        }
                    )

                result_json = {
                    "content": {"query": query, "results": formatted_results}
                }
                return json.dumps(result_json, indent=2)

            except Exception as e:
                logger.error(f"Vector search error: {str(e)}")
                return json.dumps(
                    {"error": f"Error performing vector search: {str(e)}"}
                )

        from langchain.tools import tool

        @tool
        def vector_search(query: str) -> str:
            """
            Perform a vector search on the crawled data for this session.
            This searches through documents that were vectorized from URLs provided in this conversation.
            """
            return vector_search_func(query)

        return vector_search

