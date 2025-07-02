# Import required FastAPI components for building the API
from fastapi import FastAPI, HTTPException, Request, UploadFile, File
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
# Import Pydantic for data validation and settings management
from pydantic import BaseModel
# Import OpenAI client for interacting with OpenAI's API
from openai import OpenAI
import os
from typing import Optional
import json
from uuid import uuid4
from aimakerspace.text_utils import PDFLoader, CharacterTextSplitter
from aimakerspace.vectordatabase import VectorDatabase
from aimakerspace.openai_utils.embedding import EmbeddingModel

# Initialize FastAPI application with a title
app = FastAPI(title="OpenAI Chat API")

# Configure CORS (Cross-Origin Resource Sharing) middleware
# This allows the API to be accessed from different domains/origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only! Allows all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Define the data model for chat requests using Pydantic
# This ensures incoming request data is properly validated
class ChatRequest(BaseModel):
    developer_message: str  # Message from the developer/system
    user_message: str      # Message from the user
    model: Optional[str] = "gpt-4.1-mini"  # Optional model selection with default
    api_key: str          # OpenAI API key for authentication

# In-memory storage for session vector DBs
SESSION_VECTOR_DBS = {}

@app.options("/api/chat")
async def options_chat():
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Max-Age": "3600",
        }
    )

# Define the main chat endpoint that handles POST requests
@app.post("/api/chat")
async def chat(request: Request):
    try:
        # Parse request body
        body = await request.json()
        chat_request = ChatRequest(**body)
        api_key = chat_request.api_key.strip() if chat_request.api_key else chat_request.api_key
        model = chat_request.model or "gpt-4.1-mini"
        # Initialize OpenAI client with the provided API key
        client = OpenAI(api_key=api_key)
        
        # Create a streaming response
        async def generate():
            try:
                stream = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": chat_request.developer_message},
                        {"role": "user", "content": chat_request.user_message}
                    ],
                    stream=True
                )
                
                for chunk in stream:
                    if chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content
                        
            except Exception as e:
                error_message = f"Error in stream: {str(e)}"
                print(error_message)
                yield error_message
        
        return StreamingResponse(
            generate(),
            media_type="text/plain",
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            }
        )
    
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid JSON: {str(e)}"
        )
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

# Define a health check endpoint to verify API status
@app.get("/api/health")
async def health_check():
    return JSONResponse(
        content={"status": "ok"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.post("/api/upload_pdf")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    session_id = str(uuid4())
    contents = await file.read()
    temp_path = f"/tmp/{session_id}.pdf"
    with open(temp_path, "wb") as f:
        f.write(contents)
    # Extract text
    loader = PDFLoader(temp_path)
    texts = loader.load_documents()
    # Chunk text
    splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.split_texts(texts)
    # Build vector DB
    embedding_model = EmbeddingModel()
    vector_db = await VectorDatabase(embedding_model).abuild_from_list(chunks)
    SESSION_VECTOR_DBS[session_id] = (vector_db, chunks)
    os.remove(temp_path)
    return {"session_id": session_id}

@app.post("/api/chat_with_pdf")
async def chat_with_pdf(request: Request):
    data = await request.json()
    session_id = data.get("session_id")
    question = data.get("question")
    api_key = data.get("api_key")
    if api_key:
        api_key = api_key.strip()
    if not (session_id and question and api_key):
        raise HTTPException(status_code=400, detail="Missing required fields.")
    if session_id not in SESSION_VECTOR_DBS:
        raise HTTPException(status_code=404, detail="Session not found.")
    vector_db, chunks = SESSION_VECTOR_DBS[session_id]
    # Find top-k relevant chunks
    k = 4
    top_chunks = vector_db.search_by_text(question, k=k, return_as_text=True)
    context = "\n".join(top_chunks)
    # Compose prompt
    prompt = f"You are a helpful assistant. Use the following context from a PDF to answer the user's question.\n\nContext:\n{context}\n\nQuestion: {question}\nAnswer:"
    client = OpenAI(api_key=api_key)
    completion = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[{"role": "user", "content": prompt}]
    )
    answer = completion.choices[0].message.content
    return {"answer": answer}

@app.options("/api/chat_with_pdf")
async def options_chat_with_pdf():
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Entry point for running the application directly
if __name__ == "__main__":
    import uvicorn
    # Start the server on all network interfaces (0.0.0.0) on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
