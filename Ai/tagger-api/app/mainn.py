from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models import ProductTitle
from app.tagging import generate_tags
from app.recommendation import ProductRecommender

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

product_list = [
    "High-Performance Engine Oil",
    "Synthetic Gear Lubricant",
    "Petroleum-Based Diesel Additive",
    "Organic Wheat Grain",
    "Pure Silver Coins",
    "Gold Investment Bar",
    "Extra Virgin Olive Oil",
    "Refined Sunflower Oil",
    "Lubricating Grease for Industrial Machinery"
]

recommender = ProductRecommender(product_list)

@app.post("/suggest-tags")
async def suggest_tags(product: ProductTitle):
    tags = generate_tags(product.title)
    return {
        "title": product.title,
        "suggested_tags": tags
    }

@app.post("/recommend-products")
async def recommend_products(product: ProductTitle):
    recommendations = recommender.recommend(product.title)
    return {
        "title": product.title,
        "recommendations": recommendations
    }
