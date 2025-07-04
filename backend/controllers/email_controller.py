from db import emails_collection

def save_email_to_db(subject: str, body: str, tone: str, sender: str, recipient: str):
    # Normalize and strip input fields
    subject = subject.strip()
    body = body.strip()
    tone = tone.strip().capitalize()
    sender = sender.strip()
    recipient = recipient.strip()

    # Check if a similar email already exists
    existing = emails_collection.find_one({
        "subject": subject,
        "body": body,
        "tone": tone,
        "sender": sender,
        "recipient": recipient,
    })

    if existing:
        return str(existing["_id"])  # Return existing ID if duplicate

    # Save new email
    email_data = {
        "subject": subject,
        "body": body,
        "tone": tone,
        "sender": sender,
        "recipient": recipient,
    }
    result = emails_collection.insert_one(email_data)
    return str(result.inserted_id)


