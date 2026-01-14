import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from mem0 import Memory
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Memory API",
    description="API for mem0 memory operations with Supabase vector store",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
supabase_connection_string = os.environ.get("SUPABASE_CONNECTION_STRING")
neo4j_url = os.environ.get("NEO4J_URL")
neo4j_username = os.environ.get("NEO4J_USERNAME", "neo4j")
neo4j_password = os.environ.get("NEO4J_PASSWORD")

if not supabase_connection_string:
    raise ValueError("SUPABASE_CONNECTION_STRING environment variable is required")

config = {
    "llm": {
    "provider": "openai",
    "config": {
        "model": "gpt-4.1-nano-2025-04-14",
        "enable_vision": True,
        }
    },
    "vector_store": {
        "provider": "supabase",
        "config": {
            "connection_string": supabase_connection_string,
            "collection_name": os.environ.get("SUPABASE_COLLECTION_NAME", "memories"),
            "index_method": os.environ.get("SUPABASE_INDEX_METHOD", "hnsw"),
            "index_measure": os.environ.get("SUPABASE_INDEX_MEASURE", "cosine_distance")
        }
    }
}

if neo4j_url and neo4j_password:
    config["graph_store"] = {
        "provider": "neo4j",
        "config": {
            "url": neo4j_url,
            "username": neo4j_username,
            "password": neo4j_password,
        }
    }

print("=" * 50)
print("MEM0 CONFIGURATION:")
print(f"  Vector Store: supabase")
print(f"  Graph Store: {'neo4j' if 'graph_store' in config else 'disabled'}")
print("=" * 50)

memory = Memory.from_config(config)

class Message(BaseModel):
    role: str
    content: str


class AddMemoryRequest(BaseModel):
    messages: list[Message]
    user_id: str
    metadata: Optional[dict] = None


class SearchMemoryRequest(BaseModel):
    query: str
    user_id: str
    limit: Optional[int] = 10


class UpdateMemoryRequest(BaseModel):
    memory_id: str
    data: str


class DeleteMemoryRequest(BaseModel):
    memory_id: str


class GetAllMemoriesRequest(BaseModel):
    user_id: str


class AddImageMemoryRequest(BaseModel):
    image_url: str
    context: Optional[str] = None
    user_id: str
    metadata: Optional[dict] = None


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "Memory API is running"}


@app.post("/memory/add")
async def add_memory(request: AddMemoryRequest):
    """
    Add new memories from a conversation.
    Mem0 automatically extracts and stores relevant facts.
    """
    try:
        messages = [{"role": m.role, "content": m.content} for m in request.messages]
        result = memory.add(
            messages,
            user_id=request.user_id,
            metadata=request.metadata
        )
        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/memory/search")
async def search_memory(request: SearchMemoryRequest):
    """
    Search memories based on a query.
    Returns relevant memories with similarity scores.
    """
    try:
        results = memory.search(
            request.query,
            user_id=request.user_id,
            limit=request.limit
        )
        return {"success": True, "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/memory/get_all")
async def get_all_memories(request: GetAllMemoriesRequest):
    try:
        memories = memory.get_all(user_id=request.user_id)
        return {"success": True, "memories": memories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/memory/add_image")
async def add_image_memory(request: AddImageMemoryRequest):
    try:
        messages = []
        
        if request.context:
            messages.append({"role": "user", "content": request.context})
        
        messages.append({
            "role": "user",
            "content": {
                "type": "image_url",
                "image_url": {"url": request.image_url}
            }
        })
        
        print(f"[add_image] Processing image URL: {request.image_url[:100]}...")
        print(f"[add_image] Messages: {messages}")
        
        result = memory.add(
            messages,
            user_id=request.user_id,
            metadata=request.metadata or {"source": "screen_capture"}
        )
        print(f"[add_image] Result: {result}")
        return {"success": True, "result": result}
    except Exception as e:
        print(f"[add_image] ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/memory/{memory_id}")
async def get_memory(memory_id: str):
    """
    Get a specific memory by ID.
    """
    try:
        result = memory.get(memory_id)
        return {"success": True, "memory": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/memory/update")
async def update_memory(request: UpdateMemoryRequest):
    """
    Update an existing memory.
    """
    try:
        result = memory.update(request.memory_id, request.data)
        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/memory/{memory_id}")
async def delete_memory(memory_id: str):
    """
    Delete a specific memory by ID.
    """
    try:
        result = memory.delete(memory_id)
        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/memory/user/{user_id}")
async def delete_all_user_memories(user_id: str):
    """
    Delete all memories for a specific user.
    """
    try:
        result = memory.delete_all(user_id=user_id)
        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/memory/history/{memory_id}")
async def get_memory_history(memory_id: str):
    """
    Get the history/changelog of a specific memory.
    """
    try:
        history = memory.history(memory_id)
        return {"success": True, "history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
