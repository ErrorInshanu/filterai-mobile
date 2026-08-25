import os
import re
import uuid
from datetime import datetime, timezone
from typing import List, Optional
import certifi
from dotenv import load_dotenv
import pymupdf as fitz  # PyMuPDF
from fastapi import FastAPI, HTTPException, status, Depends, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient, DESCENDING

from models import SignupRequest, LoginRequest, AnalyzeRequest
from auth import hash_password, verify_password, create_access_token, get_current_user

# 1. Load environment variables from .env
load_dotenv()

# --- Lazy-loaded Globals for ML & Vector DB ---
_embedding_model = None
_chroma_client = None
_text_splitter = None

def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        print("Loading embedding model...")
        from sentence_transformers import SentenceTransformer
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
        print("Embedding model loaded")
    return _embedding_model

def get_chroma_client():
    global _chroma_client
    if _chroma_client is None:
        print("Initializing ChromaDB client...")
        import chromadb
        _chroma_client = chromadb.EphemeralClient()
        print("ChromaDB client initialized")
    return _chroma_client

def get_text_splitter():
    global _text_splitter
    if _text_splitter is None:
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        _text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    return _text_splitter

# 2. MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "")
client = (
    MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000, tlsCAFile=certifi.where())
    if MONGO_URI
    else None
)

db = client["filterai"] if client else None
users_collection = db["users"] if db is not None else None
batches_collection = db["batches"] if db is not None else None
candidates_collection = db["candidates"] if db is not None else None
activity_log_collection = db["activity_log"] if db is not None else None

# 3. Create MongoDB Indexes
if db is not None:
    try:
        users_collection.create_index("email", unique=True)
        candidates_collection.create_index("batch_id")
        candidates_collection.create_index("candidate_id")
        activity_log_collection.create_index("batch_id")
        activity_log_collection.create_index([("timestamp", DESCENDING)])
    except Exception as e:
        print(f"Warning: Index creation failed or deferred: {e}")

# 4. Create FastAPI app instance
app = FastAPI(title="FilterAI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root route
@app.get("/")
def root():
    return {"status": "ok", "message": "FilterAI backend running"}

# Test DB connection route
@app.get("/test-db")
def test_db():
    if not client:
        return {"status": "error", "detail": "MONGO_URI environment variable is not configured"}
    try:
        client.admin.command("ping")
        return {"status": "connected"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}

# --- Auth Routes ---

@app.post("/auth/signup", status_code=status.HTTP_201_CREATED)
def signup(req: SignupRequest):
    if users_collection is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection unavailable"
        )

    # Check if email is already registered
    existing_user = users_collection.find_one({"email": req.email.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_pw = hash_password(req.password)
    new_user = {
        "email": req.email.lower(),
        "password_hash": hashed_pw,
        "name": req.name,
        "created_at": datetime.now(timezone.utc)
    }

    insert_result = users_collection.insert_one(new_user)
    user_id = str(insert_result.inserted_id)

    token = create_access_token(user_id=user_id, email=req.email.lower())

    return {
        "user": {
            "id": user_id,
            "email": req.email.lower(),
            "name": req.name
        },
        "token": token
    }

@app.post("/auth/login")
def login(req: LoginRequest):
    if users_collection is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection unavailable"
        )

    user = users_collection.find_one({"email": req.email.lower()})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    if not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    user_id = str(user["_id"])
    token = create_access_token(user_id=user_id, email=user["email"])

    return {
        "user": {
            "id": user_id,
            "email": user["email"],
            "name": user.get("name", "")
        },
        "token": token
    }

@app.get("/auth/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"]
    }

# --- Ingestion / Resume Upload Route ---

EMAIL_REGEX = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")

@app.post("/api/upload")
async def upload_resumes(
    files: List[UploadFile] = File(...),
    job_description: str = Form(""),
):
    if batches_collection is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection unavailable",
        )

    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files uploaded",
        )

    batch_id = str(uuid.uuid4())
    file_records = []
    response_files = []

    for file in files:
        file_name = file.filename or "unknown.pdf"
        try:
            file_bytes = await file.read()
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            extracted_text = ""
            for page in doc:
                extracted_text += page.get_text()
            extracted_text = extracted_text.strip()

            # Email extraction via regex
            email_match = EMAIL_REGEX.search(extracted_text)
            extracted_email = email_match.group(0) if email_match else None

            # Best-guess candidate name extraction
            candidate_name = None
            lines = [line.strip() for line in extracted_text.splitlines() if line.strip()]
            if lines:
                first_line = lines[0][:60].strip()
                if first_line and "@" not in first_line:
                    candidate_name = first_line

            text_length = len(extracted_text)

            record = {
                "file_name": file_name,
                "candidate_name": candidate_name,
                "extracted_email": extracted_email,
                "text_length": text_length,
                "raw_text": extracted_text,
            }
            file_records.append(record)

            response_files.append({
                "file_name": file_name,
                "candidate_name": candidate_name,
                "extracted_email": extracted_email,
                "text_length": text_length,
            })
        except Exception as e:
            file_records.append({
                "file_name": file_name,
                "error": str(e),
                "candidate_name": None,
                "extracted_email": None,
                "text_length": 0,
            })
            response_files.append({
                "file_name": file_name,
                "error": f"Failed to parse PDF: {str(e)}",
                "candidate_name": None,
                "extracted_email": None,
                "text_length": 0,
            })

    batch_doc = {
        "batch_id": batch_id,
        "job_description": job_description,
        "created_at": datetime.now(timezone.utc),
        "files": file_records,
        "status": "uploaded",
    }
    batches_collection.insert_one(batch_doc)

    return {
        "batch_id": batch_id,
        "files": response_files,
    }


# --- Resume Matching / Analysis Route ---

@app.post("/api/analyze")
def analyze_batch(req: AnalyzeRequest):
    if batches_collection is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection unavailable",
        )

    # 1. Fetch batch document
    batch_doc = batches_collection.find_one({"batch_id": req.batch_id})
    if not batch_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch not found",
        )

    job_description = batch_doc.get("job_description", "")
    files = batch_doc.get("files", [])
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Batch contains no files to analyze",
        )

    # Lazy-load embedding model, ChromaDB client, and text splitter
    try:
        embedding_model = get_embedding_model()
        chroma_client = get_chroma_client()
        text_splitter = get_text_splitter()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Embedding model or Vector database failed to load: {str(e)}",
        )

    # 2. Reset / delete existing ChromaDB collection for this batch
    col_name = f"batch_{req.batch_id.replace('-', '_')}"
    try:
        chroma_client.delete_collection(name=col_name)
    except Exception:
        pass

    try:
        collection = chroma_client.create_collection(
            name=col_name,
            metadata={"hnsw:space": "cosine"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create ChromaDB collection: {str(e)}",
        )

    skipped_files = []
    total_chunks_added = 0
    candidate_meta_map = {}  # file_name -> { candidate_name, extracted_email }

    # 3. Chunk and embed each resume
    for file_record in files:
        file_name = file_record.get("file_name", "unknown.pdf")
        if file_record.get("error"):
            skipped_files.append({"file_name": file_name, "reason": file_record.get("error")})
            continue

        raw_text = file_record.get("raw_text", "")
        if not raw_text or not raw_text.strip():
            skipped_files.append({"file_name": file_name, "reason": "No extracted text available"})
            continue

        candidate_name = file_record.get("candidate_name") or file_name.replace(".pdf", "")
        extracted_email = file_record.get("extracted_email")
        candidate_meta_map[file_name] = {
            "file_name": file_name,
            "candidate_name": candidate_name,
            "extracted_email": extracted_email,
        }

        try:
            chunks = text_splitter.split_text(raw_text)
            if not chunks:
                skipped_files.append({"file_name": file_name, "reason": "Text splitting produced 0 chunks"})
                continue

            embeddings = embedding_model.encode(chunks).tolist()
            chunk_ids = [f"{file_name}_chunk_{i}_{uuid.uuid4().hex[:4]}" for i in range(len(chunks))]
            metadatas = [
                {
                    "file_name": file_name,
                    "candidate_name": candidate_name or "",
                    "chunk_index": i,
                }
                for i in range(len(chunks))
            ]

            collection.add(
                ids=chunk_ids,
                embeddings=embeddings,
                documents=chunks,
                metadatas=metadatas,
            )
            total_chunks_added += len(chunks)
        except Exception as e:
            skipped_files.append({"file_name": file_name, "reason": f"Embedding error: {str(e)}"})

    if total_chunks_added == 0:
        return {
            "batch_id": req.batch_id,
            "ranked_candidates": [],
            "skipped": skipped_files,
            "message": "No valid resume chunks were indexed.",
        }

    # 4. Embed Job Description and Query ChromaDB
    try:
        query_text = (
            job_description.strip()
            if job_description.strip()
            else "Qualified candidate skills and experience"
        )
        jd_embedding = embedding_model.encode([query_text]).tolist()

        query_results = collection.query(
            query_embeddings=jd_embedding,
            n_results=min(total_chunks_added, 50),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query vector database: {str(e)}",
        )

    # 5. Aggregate score per candidate
    candidate_scores = {}  # file_name -> list of chunk scores

    retrieved_metas = query_results.get("metadatas", [[]])[0]
    retrieved_distances = query_results.get("distances", [[]])[0]

    for meta, dist in zip(retrieved_metas, retrieved_distances):
        f_name = meta.get("file_name")
        if not f_name:
            continue
        # Cosine distance d in [0, 2]. Similarity = 1 - d.
        similarity = max(0.0, min(1.0, 1.0 - float(dist)))
        chunk_score = round(similarity * 100.0, 1)

        if f_name not in candidate_scores:
            candidate_scores[f_name] = []
        candidate_scores[f_name].append(chunk_score)

    ranked_list = []
    for f_name, meta_info in candidate_meta_map.items():
        if f_name in candidate_scores and len(candidate_scores[f_name]) > 0:
            best_score = max(candidate_scores[f_name])
        else:
            best_score = 50.0  # baseline fallback if not in top query chunks

        ranked_list.append({
            "candidate_id": f_name.replace(".pdf", "").replace(" ", "_").lower(),
            "file_name": f_name,
            "candidate_name": meta_info["candidate_name"],
            "extracted_email": meta_info["extracted_email"],
            "match_score": round(best_score, 1),
            "status": "pending",
        })

    # Rank descending by match_score and pick top 10
    ranked_list.sort(key=lambda x: x["match_score"], reverse=True)
    ranked_candidates = ranked_list[:10]

    # 6. Update batch document in MongoDB
    batches_collection.update_one(
        {"batch_id": req.batch_id},
        {
            "$set": {
                "status": "analyzed",
                "ranked_candidates": ranked_candidates,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    return {
        "batch_id": req.batch_id,
        "ranked_candidates": ranked_candidates,
        "skipped": skipped_files,
    }


