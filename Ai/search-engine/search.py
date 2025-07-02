from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from fuzzywuzzy import fuzz, process
import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
import uvicorn
from typing import List, Dict, Any
import logging

try:
    nltk.download('punkt', quiet=True)
    nltk.download('punkt_tab', quiet=True)
    nltk.download('stopwords', quiet=True)
    nltk.download('wordnet', quiet=True)
    nltk.download('omw-1.4', quiet=True)
except Exception as e:
    print(f"NLTK download warning: {e}")

app = FastAPI(title="Buyer Dataset AI Search", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchRequest(BaseModel):
    query: str
    limit: int = 10

class BuyerItem(BaseModel):
    importer_name: str
    importer_address: str
    country: str
    hs_code: str
    product_description: str
    product: str
    mapped_commodity: str
    price: str
    relevance_score: float

class SearchResponse(BaseModel):
    results: List[BuyerItem]
    total_found: int
    query_processed: str

buyer_data = None
embeddings = None
sentence_model = None
lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))

class AISearchEngine:
    def __init__(self):
        self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.lemmatizer = WordNetLemmatizer()
        self.stop_words = set(stopwords.words('english'))
        
    def preprocess_text(self, text: str) -> str:
        """Clean and preprocess text for better matching"""
        if pd.isna(text) or text == '':
            return ''

        text = str(text).lower()
        
        text = re.sub(r'[^\w\s]', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        
        try:

            tokens = word_tokenize(text)
            tokens = [self.lemmatizer.lemmatize(token) for token in tokens 
                     if token not in self.stop_words and len(token) > 2]
        except Exception as e:
            tokens = text.split()
            tokens = [token for token in tokens if len(token) > 2]
        
        return ' '.join(tokens)
    
    def create_searchable_text(self, row) -> str:
        """Combine relevant fields into searchable text"""
        fields = [
            str(row.get('PRODUCT', '')),
            str(row.get('PRODUCT DESCRIPTION', '')),
            str(row.get('MAPPED COMMODITY', '')),
            str(row.get('IMPORTER NAME', ''))
        ]
        
        combined_text = ' '.join(fields)
        return self.preprocess_text(combined_text)
    
    def load_and_process_data(self, csv_file_path: str):
        """Load CSV data and create embeddings"""
        global buyer_data, embeddings
        
        try:
            encodings = ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252', 'utf-8-sig']
            buyer_data = None
            
            for encoding in encodings:
                try:
                    buyer_data = pd.read_csv(csv_file_path, encoding=encoding)
                    logging.info(f"Successfully loaded CSV with {encoding} encoding")
                    break
                except UnicodeDecodeError:
                    continue
                except Exception as e:
                    logging.error(f"Error with {encoding} encoding: {str(e)}")
                    continue
            
            if buyer_data is None:
                raise Exception("Could not load CSV with any supported encoding")

            buyer_data.columns = buyer_data.columns.str.strip()
            
            logging.info(f"Loaded {len(buyer_data)} records")
            logging.info(f"Columns: {list(buyer_data.columns)}")
            
            required_columns = ['IMPORTER NAME', 'PRODUCT', 'PRODUCT DESCRIPTION', 'MAPPED COMMODITY']
            missing_columns = [col for col in required_columns if col not in buyer_data.columns]
            
            if missing_columns:
                logging.warning(f"Missing columns: {missing_columns}")
                logging.info("Available columns: " + ", ".join(buyer_data.columns))
            
            buyer_data = buyer_data.fillna('')

            buyer_data['searchable_text'] = buyer_data.apply(self.create_searchable_text, axis=1)

            searchable_texts = buyer_data['searchable_text'].tolist()
            embeddings = self.sentence_model.encode(searchable_texts)
            
            logging.info(f"Loaded {len(buyer_data)} records and created embeddings")
            return True
            
        except Exception as e:
            logging.error(f"Error loading data: {str(e)}")
            return False
    
    def semantic_search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Perform semantic search using sentence embeddings"""
        if buyer_data is None or embeddings is None:
            return []

        processed_query = self.preprocess_text(query)
        
        query_embedding = self.sentence_model.encode([processed_query])
        
        similarities = cosine_similarity(query_embedding, embeddings)[0]
        
        top_indices = np.argsort(similarities)[::-1][:limit * 2] 
        
        results = []
        for idx in top_indices:
            if similarities[idx] > 0.1:  
                row = buyer_data.iloc[idx]
                result = {
                    'importer_name': str(row.get('IMPORTER NAME', '')),
                    'importer_address': str(row.get('IMPORTER ADDRESS', '')),
                    'country': str(row.get('COUNTRY', '')),
                    'hs_code': str(row.get('HS CODE', '')),
                    'product_description': str(row.get('PRODUCT DESCRIPTION', '')),
                    'product': str(row.get('PRODUCT', '')),
                    'mapped_commodity': str(row.get('MAPPED COMMODITY', '')),
                    'price': str(row.get('PRICE', 'Negotiable')),
                    'relevance_score': float(similarities[idx])
                }
                results.append(result)
        
        return results[:limit]
    
    def fuzzy_search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Perform fuzzy string matching search"""
        if buyer_data is None:
            return []
        
        searchable_texts = [(idx, text) for idx, text in enumerate(buyer_data['searchable_text'].tolist())]
        texts = [text for _, text in searchable_texts]
        matches = process.extract(query.lower(), texts, limit=limit * 2, scorer=fuzz.token_sort_ratio)
        
        results = []
        for match_text, score in matches:
            if score > 40: 
                original_idx = None
                for idx, text in searchable_texts:
                    if text == match_text:
                        original_idx = idx
                        break
                
                if original_idx is not None:
                    row = buyer_data.iloc[original_idx]
                    result = {
                        'importer_name': str(row.get('IMPORTER NAME', '')),
                        'importer_address': str(row.get('IMPORTER ADDRESS', '')),
                        'country': str(row.get('COUNTRY', '')),
                        'hs_code': str(row.get('HS CODE', '')),
                        'product_description': str(row.get('PRODUCT DESCRIPTION', '')),
                        'product': str(row.get('PRODUCT', '')),
                        'mapped_commodity': str(row.get('MAPPED COMMODITY', '')),
                        'price': str(row.get('PRICE', 'Negotiable')),
                        'relevance_score': float(score / 100)  # Normalize to 0-1 range
                    }
                    results.append(result)
        
        return results[:limit]
    
    def hybrid_search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Combine semantic and fuzzy search for better results"""
        semantic_results = self.semantic_search(query, limit)
        fuzzy_results = self.fuzzy_search(query, limit)
    
        all_results = []
        seen_products = set()
        
        for result in semantic_results:
            key = f"{result['product']}_{result['importer_name']}"
            if key not in seen_products:
                result['search_method'] = 'semantic'
                all_results.append(result)
                seen_products.add(key)
        
        for result in fuzzy_results:
            key = f"{result['product']}_{result['importer_name']}"
            if key not in seen_products:
                result['search_method'] = 'fuzzy'
                all_results.append(result)
                seen_products.add(key)
    
        all_results.sort(key=lambda x: x['relevance_score'], reverse=True)
        
        return all_results[:limit]

search_engine = AISearchEngine()

@app.on_event("startup")
async def startup_event():
    """Load data on startup"""
    import os
    

    possible_paths = [
        'buyer.csv', 
        r'C:\Breyus\breyus\Ai\search-engine\buyer.csv',  # Absolute path
        '../buyer.csv',  # Parent directory
        '../../buyer.csv',  # Two levels up
        r'C:\Breyus\buyer.csv',  # In Breyus root
    ]
    
    csv_path = None
    for path in possible_paths:
        if os.path.exists(path):
            csv_path = path
            logging.info(f"Found CSV file at: {path}")
            break
    
    if csv_path is None:
        logging.error("buyer.csv not found in any of the expected locations:")
        for path in possible_paths:
            logging.error(f"  - {os.path.abspath(path)} {'(exists)' if os.path.exists(path) else '(not found)'}")
        logging.error(f"Current working directory: {os.getcwd()}")
        logging.error(f"Files in current directory: {os.listdir('.')}")
        return
    
    success = search_engine.load_and_process_data(csv_path)
    if not success:
        logging.warning(f"Failed to load {csv_path}. Make sure the file exists and path is correct.")

@app.get("/")
async def root():
    return {"message": "Buyer Dataset AI Search API", "status": "running"}

@app.post("/buyer/ai", response_model=SearchResponse)
async def search_buyers(request: SearchRequest):
    """
    AI-powered search endpoint for buyer data
    """
    try:
        if not request.query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")

        results = search_engine.hybrid_search(request.query, request.limit)

        buyer_items = []
        for result in results:
            buyer_item = BuyerItem(
                importer_name=result['importer_name'],
                importer_address=result['importer_address'],
                country=result['country'],
                hs_code=result['hs_code'],
                product_description=result['product_description'],
                product=result['product'],
                mapped_commodity=result['mapped_commodity'],
                price=result['price'],
                relevance_score=result['relevance_score']
            )
            buyer_items.append(buyer_item)
        
        return SearchResponse(
            results=buyer_items,
            total_found=len(buyer_items),
            query_processed=search_engine.preprocess_text(request.query)
        )
        
    except Exception as e:
        logging.error(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.get("/buyer/ai-product")
async def get_search_results():
    """
    Get all available products (for display purposes)
    """
    try:
        if buyer_data is None:
            raise HTTPException(status_code=503, detail="Data not loaded")
        
        unique_products = buyer_data.drop_duplicates(subset=['PRODUCT']).head(50)
        
        results = []
        for _, row in unique_products.iterrows():
            result = {
                'importer_name': str(row.get('IMPORTER NAME', '')),
                'importer_address': str(row.get('IMPORTER ADDRESS', '')),
                'country': str(row.get('COUNTRY', '')),
                'hs_code': str(row.get('HS CODE', '')),
                'product_description': str(row.get('PRODUCT DESCRIPTION', '')),
                'product': str(row.get('PRODUCT', '')),
                'mapped_commodity': str(row.get('MAPPED COMMODITY', '')),
                'price': str(row.get('PRICE', 'Negotiable')),
                'relevance_score': 1.0
            }
            results.append(result)
        
        return {
            "results": results,
            "total_found": len(results),
            "message": "Sample products from dataset"
        }
        
    except Exception as e:
        logging.error(f"Error getting products: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get products: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    data_loaded = buyer_data is not None
    embeddings_ready = embeddings is not None
    
    return {
        "status": "healthy" if data_loaded and embeddings_ready else "initializing",
        "data_loaded": data_loaded,
        "embeddings_ready": embeddings_ready,
        "total_records": len(buyer_data) if buyer_data is not None else 0
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
