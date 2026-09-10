from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .database import get_db
from .models import Note, Ticket
from .schemas import TicketCreate, TicketResponse, TicketUpdate

router = APIRouter(prefix="/api", tags=["Tickets"])


# Create Ticket
@router.post("/tickets", response_model=TicketResponse)
def create_ticket(
    ticket: TicketCreate,
    db: Session = Depends(get_db)
):
    ticket_count = db.query(Ticket).count() + 1
    ticket_id = f"TKT-{ticket_count:03d}"

    new_ticket = Ticket(
        ticket_id=ticket_id,
        customer_name=ticket.customer_name,
        customer_email=ticket.customer_email,
        subject=ticket.subject,
        description=ticket.description,
        status="Open",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    return new_ticket


# Get All Tickets
@router.get("/tickets", response_model=list[TicketResponse])
def get_tickets(
    status: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Ticket)

    if status:
        query = query.filter(Ticket.status == status)

    if search:
        search_text = f"%{search}%"

        query = query.filter(
            (Ticket.ticket_id.ilike(search_text))
            | (Ticket.subject.ilike(search_text))
            | (Ticket.customer_name.ilike(search_text))
            | (Ticket.customer_email.ilike(search_text))
        )

    tickets = query.order_by(
        Ticket.created_at.desc()
    ).all()

    return tickets


# Get Single Ticket
@router.get("/tickets/{ticket_id}", response_model=TicketResponse)
def get_ticket(
    ticket_id: str,
    db: Session = Depends(get_db)
):
    ticket = (
        db.query(Ticket)
        .filter(Ticket.ticket_id == ticket_id)
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    return ticket


# Update Customer + Ticket
@router.put("/tickets/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: str,
    ticket_data: TicketUpdate,
    db: Session = Depends(get_db),
):
    ticket = (
        db.query(Ticket)
        .filter(Ticket.ticket_id == ticket_id)
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    # Update Customer
    ticket.customer_name = ticket_data.customer_name
    ticket.customer_email = ticket_data.customer_email

    # Update Ticket
    ticket.subject = ticket_data.subject
    ticket.description = ticket_data.description
    ticket.status = ticket_data.status

    # Update timestamp
    ticket.updated_at = datetime.utcnow()

    # Add Note / Comment
    if ticket_data.notes and ticket_data.notes.strip():
        new_note = Note(
            ticket_id=ticket.id,
            note=ticket_data.notes.strip(),
            created_at=datetime.utcnow()
        )

        db.add(new_note)

    db.commit()
    db.refresh(ticket)

    return ticket