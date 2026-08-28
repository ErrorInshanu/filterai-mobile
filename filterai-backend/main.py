import os
import re
import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional
import certifi
from dotenv import load_dotenv
import pymupdf as fitz  # PyMuPDF
from fastapi import FastAPI, HTTPException, status, Depends, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient, DESCENDING

from models import SignupRequest, LoginRequest, AnalyzeRequest, CandidateInsightsRequest
from auth import hash_password, verify_password, create_access_token, get_current_user

# 1. Load environment variables from .env
load_dotenv()

# --- Lazy-loaded Globals for ML, Vector DB & LLM ---
_embedding_model = None
_chroma_client = None
_text_splitter = None
_groq_client = None

def get_groq_client():
    global _groq_client
    if _groq_client is None:
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            raise ValueError("GROQ_API_KEY environment variable is not configured")
        print("Initializing Groq client...")
        from groq import Groq
        _groq_client = Groq(api_key=groq_api_key)
        print("Groq client initialized")
    return _groq_client

def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        print("Loading embedding model...")
        from fastembed import TextEmbedding
        _embedding_model = TextEmbedding("BAAI/bge-small-en-v1.5")
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

            embeddings = [e.tolist() for e in embedding_model.embed(chunks)]
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
        jd_embedding = [list(embedding_model.embed([query_text]))[0].tolist()]

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


# --- Groq AI Candidate Insights Route ---

@app.post("/api/candidate-insights")
def get_candidate_insights(req: CandidateInsightsRequest):
    if batches_collection is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection unavailable",
        )

    # 1. Fetch batch document
    batch_doc = None
    if req.batch_id:
        batch_doc = batches_collection.find_one({"batch_id": req.batch_id})

    if not batch_doc:
        # Fallback to the latest analyzed batch if batch_id was omitted
        batch_doc = batches_collection.find_one(
            {"status": {"$in": ["analyzed", "uploaded"]}},
            sort=[("created_at", DESCENDING)],
        )

    if not batch_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch not found",
        )

    batch_id = batch_doc.get("batch_id")
    files = batch_doc.get("files", [])
    job_description = batch_doc.get("job_description", "")

    # 2. Find target candidate record
    target_file = None
    target_candidate_id = req.candidate_id or ""
    target_file_name = req.file_name or ""

    for file_record in files:
        f_name = file_record.get("file_name", "")
        cand_id_derived = f_name.replace(".pdf", "").replace(" ", "_").lower()
        cand_name = (file_record.get("candidate_name") or "").lower()

        if target_file_name and f_name.lower() == target_file_name.lower():
            target_file = file_record
            break
        if target_candidate_id and (
            cand_id_derived == target_candidate_id.lower()
            or cand_name == target_candidate_id.lower()
        ):
            target_file = file_record
            break

    # If not matched by exact query and there is only 1 file or first file
    if not target_file and files:
        target_file = files[0]

    if not target_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate resume record not found in batch",
        )

    file_name = target_file.get("file_name", "candidate.pdf")
    safe_file_key = file_name.replace(".", "_").replace("$", "_")
    candidate_id = target_file.get("candidate_id") or file_name.replace(".pdf", "").replace(" ", "_").lower()

    # 3. Check cached insights
    cached_insights = (batch_doc.get("candidate_insights") or {}).get(safe_file_key)
    if cached_insights and isinstance(cached_insights, dict):
        return {
            "batch_id": batch_id,
            "file_name": file_name,
            "candidate_id": candidate_id,
            "insights": cached_insights,
            "cached": True,
        }

    raw_text = target_file.get("raw_text", "")
    if not raw_text or not raw_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Extracted resume text is not available for this candidate",
        )

    # 4. Initialize Groq client
    try:
        groq_client = get_groq_client()
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Groq API is not configured: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize Groq client: {str(e)}",
        )

    # 5. Prompt Construction
    system_prompt = (
        "You are an expert talent evaluator and technical recruiter. "
        "Analyze the provided resume against the target job description. "
        "You MUST return ONLY a valid JSON object matching this schema:\n"
        "{\n"
        '  "summary": "A 2-3 sentence executive summary of the candidate\'s fit for the role",\n'
        '  "strengths": ["3-5 short strings highlighting key strengths relevant to the job"],\n'
        '  "skill_gaps": ["3-5 short strings of skills/experience in the job description that the resume does not clearly demonstrate, or an empty array if none"],\n'
        '  "interview_questions": ["4-6 tailored interview questions to probe candidate strengths and verify gaps"],\n'
        '  "red_flags": ["Short strings noting any concerns like employment gaps, unclear claims, or job-hopping, or an empty array if none"]\n'
        "}\n"
        "Do NOT include markdown fences, backticks, or any preamble or explanation. Output raw JSON only."
    )

    user_content = (
        f"JOB DESCRIPTION:\n{job_description if job_description.strip() else 'General Professional & Engineering Role'}\n\n"
        f"CANDIDATE RESUME TEXT:\n{raw_text[:5000]}"
    )

    # 6. Call Groq API with model list
    models_to_try = [
        "llama-3.3-70b-versatile",
        "openai/gpt-oss-120b",
        "qwen/qwen3.8-27b",
        "openai/gpt-oss-20b",
    ]
    raw_output = None
    last_error = None

    for model_name in models_to_try:
        try:
            chat_completion = groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                model=model_name,
                temperature=0.2,
                response_format={"type": "json_object"},
            )
            raw_output = chat_completion.choices[0].message.content
            if raw_output:
                break
        except Exception as e:
            err_str = str(e).lower()
            if "429" in err_str or "rate limit" in err_str:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="AI analysis is temporarily rate-limited, please try again in a moment",
                )
            last_error = e

    if not raw_output:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Groq API evaluation failed: {str(last_error)}",
        )

    # 7. Clean and parse JSON response defensively
    cleaned_output = raw_output.strip()
    if cleaned_output.startswith("```json"):
        cleaned_output = cleaned_output[7:]
    elif cleaned_output.startswith("```"):
        cleaned_output = cleaned_output[3:]
    if cleaned_output.endswith("```"):
        cleaned_output = cleaned_output[:-3]
    cleaned_output = cleaned_output.strip()

    try:
        parsed_insights = json.loads(cleaned_output)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse AI insights response as JSON: {str(e)}",
        )

    # Format fields safely
    insights_data = {
        "summary": parsed_insights.get("summary") or "Evaluation complete.",
        "strengths": parsed_insights.get("strengths") if isinstance(parsed_insights.get("strengths"), list) else [],
        "skill_gaps": parsed_insights.get("skill_gaps") if isinstance(parsed_insights.get("skill_gaps"), list) else [],
        "interview_questions": parsed_insights.get("interview_questions") if isinstance(parsed_insights.get("interview_questions"), list) else [],
        "red_flags": parsed_insights.get("red_flags") if isinstance(parsed_insights.get("red_flags"), list) else [],
    }

    # 8. Cache in MongoDB document
    try:
        batches_collection.update_one(
            {"batch_id": batch_id},
            {
                "$set": {
                    f"candidate_insights.{safe_file_key}": insights_data,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
    except Exception as e:
        print(f"Warning: Failed to cache candidate insights in MongoDB: {e}")

    return {
        "batch_id": batch_id,
        "file_name": file_name,
        "candidate_id": candidate_id,
        "insights": insights_data,
        "cached": False,
    }



