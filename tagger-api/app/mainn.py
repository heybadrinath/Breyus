from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models import ProductTitle
from app.tagging import generate_tags

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/suggest-tags")
async def suggest_tags(product: ProductTitle):
    tags = generate_tags(product.title)
    return {
        "title": product.title,
        "suggested_tags": tags
    }
