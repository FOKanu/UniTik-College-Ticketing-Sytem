from datetime import datetime

from pydantic import BaseModel, Field


class FaqCreate(BaseModel):
    question: str = Field(min_length=1)
    answer: str = Field(min_length=1)
    language: str = "en"
    category: str | None = None


class FaqResponse(BaseModel):
    id: str
    question: str
    answer: str
    language: str
    category: str | None
    createdAt: datetime
    updatedAt: datetime

    model_config = {"from_attributes": True}


class FaqSearchRequest(BaseModel):
    query: str = Field(min_length=1)
    limit: int = Field(default=5, ge=1, le=20)


class FaqSearchResult(BaseModel):
    id: str
    question: str
    answer: str
    category: str | None
    score: float
