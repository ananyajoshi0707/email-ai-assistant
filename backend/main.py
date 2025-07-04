from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import google.generativeai as genai
from db import emails_collection

from routes.api import router as api_router

app = FastAPI()
app.include_router(api_router)
# Load API key from .env
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request schema
class EmailRequest(BaseModel):
    prompt: str
    tone: str
    sender: str = "Me"
    recipient: str = "You"

# Generate email
@app.post("/generate-email")
async def generate_email(req: EmailRequest):
    refined_prompt = (
        f"Write a {req.tone.lower()} email from {req.sender} to {req.recipient} based on: {req.prompt}"
    )

    try:
        # Generate using Gemini
        model = genai.GenerativeModel(model_name="models/gemini-1.5-flash")
        response = model.generate_content(refined_prompt)

        email_text = response.text.strip()
        parts = email_text.split("\n\n")
        subject = parts[0] if parts else "Subject"
        body = "\n\n".join(parts[1:]) if len(parts) > 1 else email_text

        # ✅ UPSERT: Prevent duplicates (update if exists, else insert)
        emails_collection.update_one(
            {
                "prompt": req.prompt.strip(),
                "sender": req.sender.strip(),
                "recipient": req.recipient.strip(),
                "tone": req.tone.strip()
            },
            {
                "$set": {
                    "subject": subject.strip(),
                    "body": body.strip()
                }
            },
            upsert=True
        )

        return {"generated_email": email_text}

    except Exception as e:
        return {"error": str(e)}

# Root health check endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to the AI Email Assistant API!"}

# Get all email history
@app.get("/email-history")
async def get_history():
    history = list(emails_collection.find({}, {"_id": 0}))
    return history


@app.delete("/clear-history")
async def clear_history():
    emails_collection.delete_many({})
    return {"status": "cleared"}




