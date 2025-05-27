from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import re

# Initialize app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load data
buyers_df = pd.read_csv("buyer.csv", encoding="ISO-8859-1", low_memory=False)
sellers_df = pd.read_csv("seller.csv", encoding="ISO-8859-1", low_memory=False)

buyers_df.columns = [col.strip().lower().replace(" ", "_") for col in buyers_df.columns]
sellers_df.columns = [col.strip().lower().replace(" ", "_") for col in sellers_df.columns]

class SearchRequest(BaseModel):
    query: str

def extract_product_and_country(query: str):
    """
    Very basic rule-based extraction assuming format like:
    'coffee from uganda' or 'meat from india'
    """
    query = query.lower().strip()
    if " from " in query:
        parts = query.split(" from ")
        product = parts[0].strip()
        country = parts[1].strip()
        return product, country
    else:
        # fallback: no 'from' found
        return query.strip(), ""

@app.post("/search/")
async def simple_keyword_search(search_request: SearchRequest):
    query = search_request.query.strip().lower()

    product_kw, country_kw = extract_product_and_country(query)
    print(f"🔍 Product: {product_kw} | Country: {country_kw}")

    product_words = set(re.findall(r'\w+', product_kw))

    def match(df, role):
        name_col = "importer_name" if role == "buyer" else "exporter_name"
        addr_col = "importer_address" if role == "buyer" else "exporter_address"

        def row_match(row):
            country_ok = country_kw in str(row.get("country", "")).lower() if country_kw else True
            product_text = str(row.get("product", "") + " " + row.get("product_description", "")).lower()
            product_ok = any(word in product_text for word in product_words)
            return country_ok and product_ok

        results = []
        for _, row in df[df.apply(row_match, axis=1)].head(20).iterrows():
            results.append({
                "Type": role.capitalize(),
                "Company": row.get(name_col, ""),
                "Company address": row.get(addr_col, ""),
                "Country": row.get("country", ""),
                "Product": row.get("product", ""),
                "Product description": row.get("product_description", ""),
                "HS Code": row.get("hs_code", "")
            })
        return results

    buyers = match(buyers_df, "buyer")
    sellers = match(sellers_df, "seller")

    final_results = buyers + sellers

    return {
        "product": product_kw,
        "country": country_kw,
        "matches": final_results,
        "message": "✅ Matches found." if final_results else "❌ No matches found for your search."
    }
