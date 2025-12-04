import logging
import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))
logging.basicConfig(level=logging.ERROR, format="%(message)s")
import json
from contextlib import asynccontextmanager
from uuid import uuid4

import certifi
import requests
import uvicorn
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from langchain.schema import Document, HumanMessage
from langchain_mongodb import MongoDBAtlasVectorSearch
from langchain_openai import OpenAIEmbeddings
from langgraph.checkpoint.mongodb import AsyncMongoDBSaver
from langgraph.graph.graph import CompiledGraph
from pydantic import BaseModel
from pymongo import AsyncMongoClient, MongoClient
from tavily import TavilyClient

from backend.agent import Agent
from backend.utils import check_api_key

load_dotenv()
mongo_usr = os.getenv("mongo_usr")
mongo_pass = os.getenv("mongo_pass")
mongo_cluster_url = os.getenv("MONGO_CLUSTER_URL")

mongodb_uri = f"mongodb+srv://{mongo_usr}:{mongo_pass}@{mongo_cluster_url}/?retryWrites=true&w=majority&appName=Cluster2"
mongodb_client = AsyncMongoClient(mongodb_uri, tlsCAFile=certifi.where())


@asynccontextmanager
async def lifespan(app: FastAPI):

    checkpointer = AsyncMongoDBSaver(
        mongodb_client,
        db_name=os.getenv("DB_NAME"),
        collection_name=os.getenv("COLLECTION2"),
    )
    agent = Agent(checkpointer=checkpointer)
    app.state.agent = agent
    yield
    await mongodb_client.close()


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("VITE_APP_URL")] if os.getenv("VITE_APP_URL") else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_agent():
    return {
        "agent": app.state.agent,
    }


class DeleteVectorStoreRequest(BaseModel):
    thread_id: str


class AgentRequest(BaseModel):
    input: str
    thread_id: str


class VectorizeRequest(BaseModel):
    url: str
    thread_id: str


@app.get("/")
async def ping():
    return {"message": "Alive"}


@app.post("/stream_agent")
async def stream_agent(
    body: AgentRequest,
    fastapi_request: Request,
    agent: CompiledGraph = Depends(get_agent),
):

    api_key = fastapi_request.headers.get("Authorization")
    try:
        # Check authorization before proceeding
        check_api_key(api_key=api_key)

    except requests.exceptions.HTTPError as e:
        raise HTTPException(
            status_code=e.response.status_code, detail=e.response.json()
        )

    # Create agent with thread_id for this session
    session_agent = Agent(
        checkpointer=agent["agent"].checkpointer,
        thread_id=body.thread_id,
    )
    agent_runnable = session_agent.build_graph(api_key=api_key)

    async def event_generator():
        config = {"configurable": {"thread_id": body.thread_id, "api_key": api_key}}

        async for event in agent_runnable.astream_events(
            input={"messages": [HumanMessage(content=body.input)]},
            config=config,
        ):
            # Filter for chat model streaming events
            if event["event"] == "on_chat_model_stream":
                content = event["data"]["chunk"]
                # Check if the chunk has content
                if hasattr(content, "content") and content.content:
                    print(content.content, end="", flush=True)
                    yield (
                        json.dumps(
                            {
                                "type": "chatbot",
                                "content": content.content,
                            }
                        )
                        + "\n"
                    )

            elif event["event"] == "on_tool_start":
                tool_name = event.get("name", "unknown_tool")
                tool_input = event["data"].get("input", {})

                # Safely serialize tool input
                try:
                    if isinstance(tool_input, dict):
                        serializable_input = {k: str(v) for k, v in tool_input.items()}
                    else:
                        serializable_input = str(tool_input)
                except:
                    serializable_input = "Unable to serialize input"

                yield (
                    json.dumps(
                        {
                            "type": "tool_start",
                            "tool_name": tool_name,
                            "content": serializable_input,
                        }
                    )
                    + "\n"
                )

            elif event["event"] == "on_tool_end":
                tool_name = event.get("name", "unknown_tool")
                tool_output = event["data"].get("output")

                # Safely serialize tool output
                try:
                    if hasattr(tool_output, "content"):
                        # Handle ToolMessage objects
                        serializable_output = str(tool_output.content)
                    elif isinstance(tool_output, dict):
                        serializable_output = {
                            k: str(v) for k, v in tool_output.items()
                        }
                    elif isinstance(tool_output, list):
                        serializable_output = [str(item) for item in tool_output]
                    else:
                        serializable_output = str(tool_output)
                except:
                    serializable_output = "Unable to serialize output"

                yield (
                    json.dumps(
                        {
                            "type": "tool_end",
                            "tool_name": tool_name,
                            "content": serializable_output,
                        }
                    )
                    + "\n"
                )

    return StreamingResponse(event_generator(), media_type="application/json")


@app.post("/vectorize")
async def vectorize_url(
    body: VectorizeRequest,
    fastapi_request: Request,
):
    """
    Vectorize a URL by crawling it and creating a session-specific vector index
    """
    api_key = fastapi_request.headers.get("Authorization")
    try:
        # Check authorization before proceeding
        check_api_key(api_key=api_key)

    except requests.exceptions.HTTPError as e:
        raise HTTPException(
            status_code=e.response.status_code, detail=e.response.json()
        )
    try:
        tavily_client = TavilyClient(api_key=api_key)
        crawl_result = tavily_client.crawl(
            url=body.url, format="text", include_favicon=True
        )

        documents = []
        for result in crawl_result["results"]:
            raw_content = result.get("raw_content")
            if not raw_content:  # Skip if None, empty string, or falsy
                continue
            
            doc = Document(
                page_content=raw_content,
                metadata={
                    "url": result.get("url", ""),
                    "thread_id": body.thread_id,
                    "favicon": result.get("favicon", ""),
                },
            )
            documents.append(doc)

        if not documents:
            raise HTTPException(status_code=400, detail="No content found to vectorize")

        embeddings = OpenAIEmbeddings(
            model="text-embedding-3-large", api_key=os.getenv("OPENAI_API_KEY")
        )

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
        uuids = [str(uuid4()) for _ in range(len(documents))]
        vector_store.add_documents(documents, ids=uuids)

        return JSONResponse(
            content={
                "success": True,
                "message": f"Successfully vectorized {len(documents)} documents from {body.url}",
                "documents_count": len(documents),
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error vectorizing URL: {str(e)}")


@app.post("/delete_vector_store")
async def delete_vector_store(body: DeleteVectorStoreRequest):
    """
    Delete all documents from the session-specific vector store
    """
    try:

        client = MongoClient(mongodb_uri, tlsCAFile=certifi.where())

        DB_NAME = os.getenv("DB_NAME")

        CRAWLED_INDEX = os.getenv("COLLECTION1")
        CHECKPOINT_INDEX = os.getenv("COLLECTION2")
        CHECKPOINT_WRITE_INDEX = os.getenv("COLLECTION3")

        MONGODB_COLLECTION1 = client[DB_NAME][CRAWLED_INDEX]
        MONGODB_COLLECTION2 = client[DB_NAME][CHECKPOINT_INDEX]
        MONGODB_COLLECTION3 = client[DB_NAME][CHECKPOINT_WRITE_INDEX]

        vector_filter = {"thread_id": {"$in": [body.thread_id]}}
        matching_docs_collection1 = MONGODB_COLLECTION1.count_documents(vector_filter)

        # Only delete if we have matching documents
        if matching_docs_collection1 > 0:
            result = MONGODB_COLLECTION1.delete_many(vector_filter)
        else:
            result = type("obj", (object,), {"deleted_count": 0})()

        checkpoint_filter = {"thread_id": body.thread_id}
        matching_docs_collection2 = MONGODB_COLLECTION2.count_documents(
            checkpoint_filter
        )

        if matching_docs_collection2 > 0:
            result_write = MONGODB_COLLECTION2.delete_many(checkpoint_filter)
        else:
            result_write = type("obj", (object,), {"deleted_count": 0})()

        matching_docs_collection3 = MONGODB_COLLECTION3.count_documents(
            checkpoint_filter
        )

        if matching_docs_collection3 > 0:
            result3 = MONGODB_COLLECTION3.delete_many(checkpoint_filter)
        else:
            result3 = type("obj", (object,), {"deleted_count": 0})()

        return JSONResponse(
            content={
                "success": True,
                "message": f"Deleted documents for thread_id '{body.thread_id}'",
                "deleted_counts": {
                    "vector_collection": result.deleted_count,
                    "checkpoint_collection": result3.deleted_count,
                    "checkpoint_write_collection": result_write.deleted_count,
                },
            }
        )

    except Exception as e:
        print(f"Error in delete_vector_store: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error deleting vector store: {str(e)}"
        )


if __name__ == "__main__":
    uvicorn.run(app=app, host="0.0.0.0", port=8080)
