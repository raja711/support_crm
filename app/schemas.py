from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict


class TicketCreate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    subject: str
    description: str


class NoteResponse(BaseModel):
    id: int
    note: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TicketUpdate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    subject: str
    description: str
    status: str
    notes: str | None = None


class TicketResponse(BaseModel):
    ticket_id: str
    customer_name: str
    customer_email: str
    subject: str
    description: str
    status: str
    created_at: datetime
    updated_at: datetime
    notes: list[NoteResponse] = []

    model_config = ConfigDict(from_attributes=True)