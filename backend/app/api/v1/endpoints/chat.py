from fastapi import APIRouter, status
from app.agents.shopping_agent import shopping_agent
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter()


@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Process shopping request via AI agent",
    description="Analyzes natural-language shopping requests, extracts structured requirements, and identifies missing parameters."
)
async def chat_endpoint(payload: ChatRequest) -> ChatResponse:
    """
    Handle natural language shopping inquiries.
    Extracts product, origin, destination, budget, and delivery constraints.
    """
    return await shopping_agent.process_message(payload.message)

