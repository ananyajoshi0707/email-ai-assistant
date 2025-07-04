from fastapi import APIRouter, Request, HTTPException
from controllers.email_controller import save_email_to_db

router = APIRouter()

@router.post("/save-email")

async def save_email(request: Request):
    try:
        data = await request.json()

        # Validate required fields
        required_fields = ["subject", "body", "tone", "sender", "recipient"]
        for field in required_fields:
            if field not in data:
                raise HTTPException(status_code=400, detail=f"Missing field: {field}")

        # Call controller function (sync call — no await)
        email_id = save_email_to_db(**data)
        return {"status": "saved", "id": email_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving email: {str(e)}")


