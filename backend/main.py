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

if not supabase_connection_string:
    raise ValueError("SUPABASE_CONNECTION_STRING environment variable is required")

supabase_config = {
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

print("=" * 50)
print("MEM0 CONFIGURATION:")
print(f"  Vector Store Provider: {supabase_config['vector_store']['provider']}")
print(f"  Collection Name: {supabase_config['vector_store']['config']['collection_name']}")
print(f"  Connection String: {supabase_connection_string[:50]}..." if len(supabase_connection_string) > 50 else f"  Connection String: {supabase_connection_string}")
print("=" * 50)

memory = Memory.from_config(supabase_config)

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
    """
    Get all memories for a specific user.
    """
    try:
        memories = memory.get_all(user_id=request.user_id)
        return {"success": True, "memories": memories}
    except Exception as e:
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
    uvicorn.run(app, host="0.0.0.0", port=8000)
