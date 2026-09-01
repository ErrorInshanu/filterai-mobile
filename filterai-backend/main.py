import os
import re
import json
import uuid
import smtplib
import base64
from email.mime.text import MIMEText
from datetime import datetime, timezone
from typing import List, Optional
import certifi
from dotenv import load_dotenv
import pymupdf as fitz  # PyMuPDF
from fastapi import FastAPI, HTTPException, status, Depends, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient, DESCENDING
from pydantic import BaseModel

from models import (
    SignupRequest,
    LoginRequest,
    AnalyzeRequest,
    CandidateInsightsRequest,
    GenerateLetterRequest,
    SendLetterRequest,
)
from auth import hash_password, verify_password, create_access_token, get_current_user

# 1. Load environment variables from .env
load_dotenv()

# --- Lazy-loaded Globals for ML, Vector DB, LLM & Gmail API ---
_embedding_model = None
_chroma_client = None
_text_splitter = None
_groq_client = None
_gmail_service = None

def get_gmail_service():
    global _gmail_service
    if _gmail_service is None:
        client_id = os.getenv("GMAIL_CLIENT_ID")
        client_secret = os.getenv("GMAIL_CLIENT_SECRET")
        refresh_token = os.getenv("GMAIL_REFRESH_TOKEN")

        missing_vars = []
        if not client_id:
            missing_vars.append("GMAIL_CLIENT_ID")
        if not client_secret:
            missing_vars.append("GMAIL_CLIENT_SECRET")
        if not refresh_token:
            missing_vars.append("GMAIL_REFRESH_TOKEN")

        if missing_vars:
            raise ValueError(f"Missing OAuth environment variables: {', '.join(missing_vars)}")

        print("Initializing Gmail API client...")
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build

        creds = Credentials(
            None,
            refresh_token=refresh_token,
            client_id=client_id,
            client_secret=client_secret,
            token_uri="https://oauth2.googleapis.com/token",
        )
        _gmail_service = build("gmail", "v1", credentials=creds)
        print("Gmail API client initialized")
    return _gmail_service

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
def analyze_batch(req: AnalyzeRequest, current_user: dict = Depends(get_current_user)):
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

    # 7. Log to activity_log_collection
    if activity_log_collection is not None:
        try:
            now_utc = datetime.now(timezone.utc)
            job_preview = (job_description[:50] + "...") if len(job_description) > 50 else job_description
            details_str = (
                f"Analyzed {len(ranked_candidates)} resumes for job: {job_preview}"
                if job_preview
                else f"Analyzed {len(ranked_candidates)} resumes"
            )
            activity_log_collection.insert_one({
                "user_id": current_user["id"],
                "user_name": current_user["email"],
                "action_type": "batch_analyzed",
                "batch_id": req.batch_id,
                "candidate_count": len(ranked_candidates),
                "details": details_str,
                "timestamp": now_utc,
            })
        except Exception as e:
            print(f"Warning: Failed to record activity log in analyze: {e}")

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


# =====================================================================
# Temporary testing endpoint - remove or protect before production use
# =====================================================================

class TestEmailRequest(BaseModel):
    to_emails: List[str]

@app.post("/api/test-email")
def test_send_email(req: TestEmailRequest):
    gmail_user = os.getenv("GMAIL_USER")
    gmail_app_password = os.getenv("GMAIL_APP_PASSWORD")

    if not gmail_user or not gmail_app_password:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GMAIL_USER or GMAIL_APP_PASSWORD environment variables are not configured.",
        )

    if not req.to_emails or len(req.to_emails) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="to_emails list cannot be empty.",
        )

    if len(req.to_emails) > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="to_emails list cannot contain more than 5 email addresses.",
        )

    results = []

    # Attempt SMTP connection and authentication with Gmail
    try:
        server = smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15)
        server.login(gmail_user, gmail_app_password)
    except smtplib.SMTPAuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gmail SMTP authentication failed. Check GMAIL_USER and GMAIL_APP_PASSWORD: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to connect to Gmail SMTP server: {str(e)}",
        )

    # Send plain-text test email to each recipient individually
    try:
        for to_email in req.to_emails:
            clean_email = to_email.strip()
            if not clean_email:
                results.append({"email": to_email, "status": "failed", "error": "Empty email address"})
                continue

            try:
                msg = MIMEText(
                    "This is a test email from your FilterAI backend to confirm Gmail SMTP is working correctly.",
                    "plain",
                    "utf-8",
                )
                msg["Subject"] = "FilterAI - Test Email"
                msg["From"] = gmail_user
                msg["To"] = clean_email

                server.sendmail(gmail_user, [clean_email], msg.as_string())
                results.append({"email": clean_email, "status": "sent"})
            except Exception as e:
                results.append({"email": clean_email, "status": "failed", "error": str(e)})
    finally:
        try:
            server.quit()
        except Exception:
            pass

    return {"results": results}


# =====================================================================
# Offer / Rejection Letter Generation & Dispatch Routes
# =====================================================================

@app.post("/api/candidate-email-status")
def get_candidate_email_status(req: CandidateInsightsRequest):
    if batches_collection is None:
        return {"email_status": "not_sent"}

    batch_doc = None
    if req.batch_id:
        batch_doc = batches_collection.find_one({"batch_id": req.batch_id})
    if not batch_doc:
        batch_doc = batches_collection.find_one(
            {"status": {"$in": ["analyzed", "uploaded"]}},
            sort=[("created_at", DESCENDING)],
        )
    if not batch_doc:
        return {"email_status": "not_sent"}

    files = batch_doc.get("files", [])
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

    if not target_file and files:
        target_file = files[0]

    if not target_file:
        return {"email_status": "not_sent"}

    file_name = target_file.get("file_name", "candidate.pdf")
    safe_file_key = file_name.replace(".", "_").replace("$", "_")
    email_status_record = (batch_doc.get("candidate_email_status") or {}).get(safe_file_key) or {}

    is_sent = (
        email_status_record.get("email_status") == "sent"
        or target_file.get("email_status") == "sent"
    )

    return {
        "email_status": "sent" if is_sent else "not_sent",
        "email_type_sent": email_status_record.get("email_type_sent") or target_file.get("email_type_sent"),
        "email_sent_at": email_status_record.get("email_sent_at") or target_file.get("email_sent_at"),
        "to_email": email_status_record.get("to_email") or target_file.get("extracted_email"),
        "subject": email_status_record.get("subject"),
    }


@app.post("/api/generate-letter")
def generate_candidate_letter(req: GenerateLetterRequest):
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

    # 2. Locate target candidate record
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

    if not target_file and files:
        target_file = files[0]

    if not target_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate record not found in batch",
        )

    file_name = target_file.get("file_name", "candidate.pdf")
    safe_file_key = file_name.replace(".", "_").replace("$", "_")
    candidate_id = target_file.get("candidate_id") or file_name.replace(".pdf", "").replace(" ", "_").lower()
    candidate_name = target_file.get("candidate_name") or file_name.replace(".pdf", "")
    extracted_email = target_file.get("extracted_email") or ""

    # 3. Server-side Hard Block: Check if already sent
    email_status_record = (batch_doc.get("candidate_email_status") or {}).get(safe_file_key) or {}
    is_already_sent = (
        email_status_record.get("email_status") == "sent"
        or target_file.get("email_status") == "sent"
    )

    if is_already_sent:
        sent_type = email_status_record.get("email_type_sent") or target_file.get("email_type_sent") or "letter"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An email ({sent_type}) has already been sent to this candidate. Duplicate sends are not allowed.",
        )

    raw_text = target_file.get("raw_text", "")
    letter_type = "offer" if req.letter_type.lower() == "offer" else "rejection"

    # 4. Lazy-load Groq client
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

    # 5. Build prompt
    if letter_type == "offer":
        system_prompt = (
            "You are an experienced, professional talent acquisition leader. "
            "Draft a warm, welcoming, and polished formal job offer email to the candidate based on the job description and resume. "
            "Reference candidate's name, role, and 1-2 genuine strengths from their resume. "
            "Do NOT fabricate specific numbers for salary or dates; instead use clear placeholder brackets like [START DATE], [SALARY], and [BENEFITS]. "
            "Return ONLY a JSON object with 'subject' (a clear subject line) and 'body' (the complete plain-text email body with greetings and sign-off). "
            "Do NOT include markdown fences, backticks, or text outside the JSON object."
        )
    else:
        system_prompt = (
            "You are a compassionate, professional corporate recruiter. "
            "Draft a respectful, kind, and professional candidate rejection email for the role in the job description. "
            "Thank them warmly for their time, acknowledge their background without giving false specific promises, and wish them well. "
            "Return ONLY a JSON object with 'subject' (a clear subject line) and 'body' (the complete plain-text email body with greetings and sign-off). "
            "Do NOT include markdown fences, backticks, or text outside the JSON object."
        )

    user_content = (
        f"TARGET ROLE & JOB DESCRIPTION:\n{job_description or 'Software / Professional Role'}\n\n"
        f"CANDIDATE NAME: {candidate_name}\n"
        f"CANDIDATE RESUME EXCERPT:\n{raw_text[:4000]}"
    )

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
                temperature=0.3,
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
                    detail="AI letter generation is temporarily rate-limited, please try again in a moment",
                )
            last_error = e

    if not raw_output:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Groq API letter generation failed: {str(last_error)}",
        )

    # 6. Parse JSON output
    cleaned_output = raw_output.strip()
    if cleaned_output.startswith("```json"):
        cleaned_output = cleaned_output[7:]
    elif cleaned_output.startswith("```"):
        cleaned_output = cleaned_output[3:]
    if cleaned_output.endswith("```"):
        cleaned_output = cleaned_output[:-3]
    cleaned_output = cleaned_output.strip()

    try:
        parsed_letter = json.loads(cleaned_output)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse AI letter response as JSON: {str(e)}",
        )

    default_subject = (
        f"Job Offer: Exciting Opportunity with FilterAI"
        if letter_type == "offer"
        else f"Update regarding your application with FilterAI"
    )

    subject = parsed_letter.get("subject") or default_subject
    body = parsed_letter.get("body") or ""

    return {
        "batch_id": batch_id,
        "file_name": file_name,
        "candidate_id": candidate_id,
        "candidate_name": candidate_name,
        "recipient_email": extracted_email,
        "letter_type": letter_type,
        "subject": subject,
        "body": body,
        "email_status": "not_sent",
    }


@app.post("/api/send-letter")
def send_candidate_letter(req: SendLetterRequest, current_user: dict = Depends(get_current_user)):
    gmail_user = os.getenv("GMAIL_USER")
    if not gmail_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GMAIL_USER environment variable is not configured.",
        )

    # Initialize Gmail API service (lazy-loaded)
    try:
        service = get_gmail_service()
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gmail API configuration error: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize Gmail API service: {str(e)}",
        )

    if not req.to_email or not req.to_email.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recipient email address is required.",
        )

    if not req.body or not req.body.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email body content cannot be empty.",
        )

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

    # 2. Locate target candidate
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

    if not target_file and files:
        target_file = files[0]

    if not target_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate record not found in batch",
        )

    file_name = target_file.get("file_name", "candidate.pdf")
    safe_file_key = file_name.replace(".", "_").replace("$", "_")
    candidate_id = target_file.get("candidate_id") or file_name.replace(".pdf", "").replace(" ", "_").lower()
    candidate_name = target_file.get("candidate_name") or file_name.replace(".pdf", "")

    # 3. Server-side Hard Block: Duplicate send prevention check
    email_status_record = (batch_doc.get("candidate_email_status") or {}).get(safe_file_key) or {}
    is_already_sent = (
        email_status_record.get("email_status") == "sent"
        or target_file.get("email_status") == "sent"
    )

    if is_already_sent:
        sent_type = email_status_record.get("email_type_sent") or target_file.get("email_type_sent") or "letter"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An email ({sent_type}) has already been sent to this candidate. Duplicate sends are not allowed.",
        )

    to_email_clean = req.to_email.strip()
    subject_clean = (req.subject or "FilterAI Communication").strip()
    body_clean = req.body.strip()
    letter_type = "offer" if req.letter_type.lower() == "offer" else "rejection"

    # 4. Dispatch Email via Gmail REST API over HTTPS
    try:
        msg = MIMEText(body_clean, "plain", "utf-8")
        msg["Subject"] = subject_clean
        msg["From"] = gmail_user
        msg["To"] = to_email_clean

        raw_message = base64.urlsafe_b64encode(msg.as_bytes()).decode("utf-8")
        service.users().messages().send(userId="me", body={"raw": raw_message}).execute()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email via Gmail API: {str(e)}",
        )

    # 5. On successful send: Update MongoDB batch document
    now_utc = datetime.now(timezone.utc)
    status_record = {
        "email_status": "sent",
        "email_type_sent": letter_type,
        "email_sent_at": now_utc,
        "to_email": to_email_clean,
        "subject": subject_clean,
    }

    try:
        batches_collection.update_one(
            {"batch_id": batch_id},
            {
                "$set": {
                    f"candidate_email_status.{safe_file_key}": status_record,
                    "updated_at": now_utc,
                }
            },
        )
        batches_collection.update_one(
            {"batch_id": batch_id, "files.file_name": file_name},
            {
                "$set": {
                    "files.$.email_status": "sent",
                    "files.$.email_type_sent": letter_type,
                    "files.$.email_sent_at": now_utc,
                }
            },
        )
    except Exception as e:
        print(f"Warning: Failed to update candidate email status in MongoDB: {e}")

    # 6. Log to activity_log_collection
    if activity_log_collection is not None:
        try:
            action_type = "offer_sent" if letter_type == "offer" else "rejection_sent"
            activity_log_collection.insert_one({
                "user_id": current_user["id"],
                "user_name": current_user["email"],
                "action_type": action_type,
                "batch_id": batch_id,
                "candidate_id": candidate_id,
                "candidate_name": candidate_name,
                "recipient_email": to_email_clean,
                "details": f"{'Offer letter' if letter_type == 'offer' else 'Rejection letter'} dispatched to {to_email_clean} (Subject: {subject_clean})",
                "timestamp": now_utc,
            })
        except Exception as e:
            print(f"Warning: Failed to record activity log: {e}")

    return {
        "success": True,
        "message": f"{'Offer letter' if letter_type == 'offer' else 'Rejection letter'} sent successfully",
        "recipient": to_email_clean,
        "letter_type": letter_type,
        "sent_at": now_utc.isoformat(),
    }


# --- Activity Log Route ---

@app.get("/api/activity-log")
def get_activity_log(current_user: dict = Depends(get_current_user)):
    if activity_log_collection is None:
        return []

    try:
        cursor = activity_log_collection.find().sort("timestamp", DESCENDING).limit(50)
        logs = []
        for doc in cursor:
            raw_ts = doc.get("timestamp")
            if isinstance(raw_ts, datetime):
                ts_iso = raw_ts.isoformat()
            elif raw_ts:
                ts_iso = str(raw_ts)
            else:
                ts_iso = datetime.now(timezone.utc).isoformat()

            entry = {
                "id": str(doc.get("_id", "")),
                "action_type": doc.get("action_type", ""),
                "user_name": doc.get("user_name", ""),
                "batch_id": doc.get("batch_id", ""),
                "details": doc.get("details", ""),
                "timestamp": ts_iso,
            }
            if doc.get("candidate_name"):
                entry["candidate_name"] = doc["candidate_name"]
            if doc.get("candidate_count") is not None:
                entry["candidate_count"] = doc["candidate_count"]

            logs.append(entry)
        return logs
    except Exception as e:
        print(f"Warning: Failed to fetch activity log: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch activity log: {str(e)}",
        )






