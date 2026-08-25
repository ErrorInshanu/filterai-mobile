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

from models import SignupRequest, LoginRequest
from auth import hash_password, verify_password, create_access_token, get_current_user

# 1. Load environment variables from .env
load_dotenv()

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

