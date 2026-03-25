---
type: api-doc
module: ai
tags: [api, ai]
---

# AI API

## Overview

The AI API provides intelligent trade partner matching, market analysis, commodity search, and gravity scoring capabilities for the Breyus platform. The module integrates with an external AI server (AI_NEW FastAPI) to deliver ML-powered predictions and insights.

**Key Features:**
- **Link Prediction**: ML-based trade partner matching using a 5-strategy waterfall approach
- **Market Analysis**: Async job-based analysis with demand forecasting, price trends, and risk assessment
- **Commodity Search**: Semantic search supporting mainstream and niche commodity discovery
- **Gravity Score**: Multi-factor trade opportunity scoring with risk assessment
- **3-Tier Results**: Confidence-based result organization (platform verified, AI enriched, AI-only)

## Base URL

```
/ai
```

## Authentication

All endpoints require cookie-based authentication via signed cookies named `account`, except for the health check endpoint which is public.

---

## Architecture

```
Frontend (React) --> NestJS Backend (/ai/*) --> AI_NEW (FastAPI)
                            |                        |
                            v                        v
                       MongoDB                  PostgreSQL
                                              + pgvector + PostGIS
```

**Flow:**
1. Frontend calls NestJS AI endpoints
2. `ai.service.ts` orchestrates the request
3. `ai-http.service.ts` forwards to FastAPI server
4. `platform-awareness.service.ts` enriches results with MongoDB data
5. Results returned with 3-tier confidence levels

---

## Endpoints

### 1. AI Search (Main)

Performs trade partner search for both buyers and sellers. Returns 3-tier results based on user role.

**Endpoint:** `POST /ai/search`

**Authentication:** Required

**Request Body:**

```json
{
  "commodity": "string",
  "hsCode": "string (optional)",
  "country": "string (optional)",
  "port": "string (optional)",
  "priceRange": {
    "min": 0,
    "max": 10000,
    "currency": "USD (optional)",
    "unit": "per_tonne (optional)"
  },
  "limit": 20
}
```

**Validation Rules (AISearchInputDto):**

| Field | Type | Rules | Description |
|-------|------|-------|-------------|
| commodity | string | Required | Commodity name to search for |
| hsCode | string | Optional | HS code for precise matching |
| country | string | Optional | Preferred country filter |
| port | string | Optional | Preferred port filter |
| priceRange | object | Optional | Price range filter |
| priceRange.min | number | Min: 0 | Minimum price |
| priceRange.max | number | Min: 0 | Maximum price |
| priceRange.currency | string | Optional | Currency code (e.g., "USD") |
| priceRange.unit | string | Optional | Price unit (e.g., "per_tonne") |
| limit | number | Optional, 1-100 | Max results (default: 20) |

**Response:**

**Success (200 OK):**

```json
{
  "statusCode": 200,
  "message": "Search completed successfully",
  "data": {
    "tier1": [
      {
        "resultType": "partner",
        "id": "string",
        "name": "ABC Trading Co.",
        "matchScore": 95,
        "matchReason": "Completed 5 trade(s) for this commodity",
        "commodity": "Rice",
        "country": "India",
        "contactInfo": {
          "email": "contact@abc.com",
          "phone": "+91-1234567890",
          "address": "Mumbai, India"
        },
        "isOnPlatform": true,
        "platformCompanyId": "64a1b2c3d4e5f6g7h8i9j0k1",
        "platformUserId": "64a1b2c3d4e5f6g7h8i9j0k2",
        "sourceType": "platform_trade_history",
        "probability": 95,
        "riskLevel": "Very Low",
        "priceFluctuation": 2.5,
        "tradeCount": 5,
        "totalQuantity": 50000,
        "lastTradeDate": "2024-01-15T10:30:00.000Z"
      }
    ],
    "tier2": [
      {
        "resultType": "product",
        "_id": "64a1b2c3d4e5f6g7h8i9j0k3",
        "name": "Premium Basmati Rice",
        "price": "850",
        "currency": "USD",
        "hsnCode": "1006301000",
        "category": "Rice",
        "description": "Premium quality basmati rice",
        "stock": "10000",
        "stockUnit": "kg",
        "moq": "1000",
        "moqUnit": "kg",
        "userId": "64a1b2c3d4e5f6g7h8i9j0k4",
        "sellerName": "XYZ Exports",
        "sellerCompanyId": "64a1b2c3d4e5f6g7h8i9j0k5",
        "sellerCountry": "India",
        "contactInfo": {
          "email": "seller@xyz.com",
          "phone": "+91-9876543210"
        },
        "productImages": ["image1.jpg", "image2.jpg"],
        "selectedIncoterm": "FOB",
        "nearestPort": "Mumbai",
        "exportLocation": "Maharashtra",
        "isOnPlatform": true,
        "sourceType": "platform_only",
        "probability": 75,
        "riskLevel": "Low",
        "priceFluctuation": -1.2
      }
    ],
    "tier3": [
      {
        "resultType": "partner",
        "name": "Global Commodities Inc.",
        "matchScore": 65,
        "matchReason": "AI-matched partner. Located in USA",
        "commodity": "Rice",
        "country": "USA",
        "contactInfo": {
          "email": "info@globalcom.com"
        },
        "isOnPlatform": false,
        "sourceType": "ai_only",
        "probability": 65,
        "riskLevel": "Medium"
      }
    ],
    "totalMatches": 15,
    "searchType": "buyer",
    "commodity": "Rice",
    "hsCode": "1006",
    "searchParams": {
      "country": "India",
      "port": "Mumbai",
      "priceRange": {
        "min": 500,
        "max": 1500
      }
    },
    "warning": "No exact matches found for India. Showing global results."
  }
}
```

**Tier Definitions:**

| Tier | For Buyer Search | For Seller Search |
|------|-----------------|-------------------|
| **Tier 1** | Platform products where seller is also in AI results (highest confidence) | Platform buyers with completed trade history (proven buyers) |
| **Tier 2** | Other platform products (medium confidence) | Platform buyers with active interests + AI matches on platform |
| **Tier 3** | AI-only sellers (off-platform) | AI-only buyers (off-platform) |

**Error Responses:**

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Search failed: AI service error message"
}
```

---

### 2. Commodity Search

Search for commodities on the selection page. Returns mainstream and niche commodity options.

**Endpoint:** `POST /ai/commodity-search`

**Authentication:** Required

**Request Body:**

```json
{
  "query": "string",
  "limit": 20
}
```

**Validation Rules (CommoditySearchDto):**

| Field | Type | Rules | Description |
|-------|------|-------|-------------|
| query | string | Required | Search query |
| limit | number | Optional, 1-50 | Max results (default: 20) |

**Response:**

**Success (200 OK):**

```json
{
  "statusCode": 200,
  "message": "Commodity search completed",
  "data": {
    "mainstream": [
      {
        "name": "Rice",
        "hsCode": "1006",
        "category": "Cereals",
        "source": "platform",
        "isMainstream": true
      },
      {
        "name": "Wheat",
        "hsCode": "1001",
        "category": "Cereals",
        "source": "platform",
        "isMainstream": true
      }
    ],
    "niche": [
      {
        "name": "Black Rice",
        "hsCode": "100630",
        "category": "Rice",
        "source": "platform",
        "isMainstream": false
      }
    ],
    "totalResults": 3
  }
}
```

**Implementation Notes:**
- Commodities are sourced from MongoDB categories database only
- AI_NEW commodity search has been deprecated
- Users can suggest new categories which admins can approve/reject

---

### 3. Start Market Analysis

Initiates an async market analysis job. Returns a jobId for polling.

**Endpoint:** `POST /ai/analysis/start`

**Authentication:** Required

**Request Body:**

```json
{
  "commodity": "string",
  "hsCode": "string (optional)",
  "destinationCountry": "string (optional)",
  "sourceCountry": "string (optional)"
}
```

**Validation Rules (MarketAnalysisDto):**

| Field | Type | Rules | Description |
|-------|------|-------|-------------|
| commodity | string | Required | Commodity to analyze |
| hsCode | string | Optional | HS code for precise analysis |
| destinationCountry | string | Optional | Import destination country |
| sourceCountry | string | Optional | Export source country |

**Response:**

**Success (202 Accepted):**

```json
{
  "statusCode": 202,
  "message": "Analysis started",
  "data": {
    "jobId": "job_abc123xyz",
    "status": "ACCEPTED",
    "commodity": "Rice",
    "hs_code": "1006",
    "initial_charts": {
      "price_trend": {
        "labels": ["Jan", "Feb", "Mar"],
        "prices": [850, 875, 900]
      },
      "top_exporters": ["India", "Thailand", "Vietnam"],
      "top_importers": ["China", "Nigeria", "Philippines"]
    }
  }
}
```

**Implementation Notes:**
- The job runs asynchronously on the AI server
- User is tracked for notification when analysis completes
- Jobs expire after 24 hours

---

### 4. Get Analysis Results

Poll for analysis job results.

**Endpoint:** `GET /ai/analysis/:jobId`

**Authentication:** Required

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| jobId | string | The job ID from the start analysis response |

**Response:**

**Pending/Processing (200 OK):**

```json
{
  "statusCode": 200,
  "message": "Analysis results retrieved",
  "data": {
    "jobId": "job_abc123xyz",
    "status": "PROCESSING",
    "progress": 50
  }
}
```

**Completed (200 OK):**

```json
{
  "statusCode": 200,
  "message": "Analysis results retrieved",
  "data": {
    "jobId": "job_abc123xyz",
    "status": "COMPLETED",
    "progress": 100,
    "result": {
      "commodity": "Rice",
      "hsCode": "1006",
      "summary": "The global rice market shows strong export activity from Asia with India leading exports. Import demand is highest in Africa and Southeast Asia.",
      "priceTrends": [
        {
          "month": "Jan",
          "avgPrice": 850,
          "minPrice": 800,
          "maxPrice": 900
        },
        {
          "month": "Feb",
          "avgPrice": 875,
          "minPrice": 825,
          "maxPrice": 925
        }
      ],
      "topExporters": [
        {
          "country": "India",
          "volume": 10000000,
          "percentage": 35
        },
        {
          "country": "Thailand",
          "volume": 7500000,
          "percentage": 26
        }
      ],
      "topImporters": [
        {
          "country": "China",
          "volume": 5000000,
          "percentage": 20
        },
        {
          "country": "Nigeria",
          "volume": 3500000,
          "percentage": 14
        }
      ],
      "seasonality": {
        "peakMonths": ["Oct", "Nov", "Dec"],
        "lowMonths": ["Mar", "Apr"]
      },
      "demandForecast": {
        "direction": "increasing",
        "confidence": 75,
        "explanation": "High trade frequency with growing demand in African markets"
      },
      "riskFactors": [
        "Weather Risk: Moderate monsoon variability expected",
        "Trade Barriers: Some import restrictions in target markets"
      ],
      "opportunities": [
        "Growing demand in West African markets",
        "Premium pricing for specialty rice varieties"
      ],
      "chartData": {
        "demandForecast": {
          "labels": ["India", "Thailand", "Vietnam"],
          "data": [35, 26, 18]
        },
        "capitalRequired": {
          "labels": ["Q1", "Q2", "Q3", "Q4"],
          "data": [50000, 55000, 48000, 62000]
        },
        "priceVolatility": {
          "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          "data": [850, 875, 900, 880, 920, 915]
        }
      },
      "keyInsights": [
        "India dominates global rice exports",
        "African import demand growing 8% annually",
        "Q4 typically sees highest prices"
      ]
    }
  }
}
```

**Failed (200 OK):**

```json
{
  "statusCode": 200,
  "message": "Analysis results retrieved",
  "data": {
    "jobId": "job_abc123xyz",
    "status": "FAILED",
    "error": "Analysis timed out"
  }
}
```

**Status Values:**

| Status | Description | Progress |
|--------|-------------|----------|
| PENDING | Job queued, waiting to start | 15% |
| PROCESSING | Job actively running | 50% |
| COMPLETED | Analysis complete | 100% |
| FAILED | Analysis failed | N/A |

**Implementation Notes:**
- When status is COMPLETED, a notification is sent to the user
- Frontend should poll every 3-5 seconds until completion
- Recommended polling timeout: 5 minutes

---

### 5. Calculate Gravity Score

Calculate a trade opportunity score for a potential trade between buyer and seller.

**Endpoint:** `POST /ai/gravity-score`

**Authentication:** Required

**Request Body:**

```json
{
  "commodity": "string",
  "hsCode": "string (optional)",
  "buyerId": "string (optional)",
  "buyerName": "string (optional)",
  "sellerId": "string (optional)",
  "sellerName": "string (optional)",
  "buyerCountry": "string (optional)",
  "sellerCountry": "string (optional)",
  "priceRange": {
    "min": 0,
    "max": 10000
  }
}
```

**Validation Rules (GravityScoreDto):**

| Field | Type | Rules | Description |
|-------|------|-------|-------------|
| commodity | string | Required | Commodity being traded |
| hsCode | string | Optional | HS code |
| buyerId | string | Optional | Platform buyer ID |
| buyerName | string | Optional | Buyer company name |
| sellerId | string | Optional | Platform seller ID |
| sellerName | string | Optional | Seller company name |
| buyerCountry | string | Optional | Buyer country |
| sellerCountry | string | Optional | Seller country |
| priceRange | object | Optional | Expected price range |

**Response:**

**Success (200 OK):**

```json
{
  "statusCode": 200,
  "message": "Gravity score calculated",
  "data": {
    "gravityScore": 78,
    "confidence": 85,
    "breakdown": {
      "volumeScore": 80,
      "proximityScore": 65,
      "priceScore": 75,
      "historyScore": 90,
      "demandScore": 82
    },
    "recommendation": "recommended",
    "factors": {
      "positive": [
        "High market demand",
        "Frequent trade activity",
        "Stable price environment"
      ],
      "negative": [
        "Poor port accessibility"
      ]
    }
  }
}
```

**Recommendation Values:**

| Score Range | Recommendation | Description |
|-------------|----------------|-------------|
| 80-100 | highly_recommended | Excellent trade opportunity |
| 60-79 | recommended | Good trade opportunity |
| 40-59 | neutral | Average opportunity, proceed with caution |
| 20-39 | caution | Below average, significant risks |
| 0-19 | not_recommended | High risk, not advisable |

**Score Factors (11 raw factors from AI server):**

| Factor | Description |
|--------|-------------|
| `demand` | Market demand level for the commodity |
| `port_proximity` | Distance/accessibility between buyer/seller ports |
| `source_geography` | Source country geographic factors |
| `transport_cost` | Estimated transport/logistics cost |
| `capital` | Capital requirements for the trade |
| `financing` | Financing availability/cost |
| `price_range` | Price range alignment |
| `trade_frequency` | Historical trading patterns |
| `volatility` | Price stability assessment |
| `weather_risk` | Climate-related trade risks |
| `trade_barriers` | Regulatory/tariff considerations |

**Breakdown Scores (computed composites):**

The `breakdown` object in the response contains composite scores derived from the raw factors:
- `volumeScore` = avg(`demand`, `trade_frequency`) × 10
- `proximityScore` = avg(`port_proximity`, `source_geography`) × 10
- `priceScore` = `price_range` × 10
- `historyScore` = `trade_frequency` × 10
- `demandScore` = `demand` × 10

---

### 6. Get Seller Inventory

Get the authenticated seller's product inventory for AI-based buyer search.

**Endpoint:** `GET /ai/seller/inventory`

**Authentication:** Required (Seller or "Seller and Buyer" role)

**Response:**

**Success (200 OK):**

```json
{
  "statusCode": 200,
  "message": "Seller inventory retrieved successfully",
  "data": {
    "products": [
      {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
        "name": "Premium Basmati Rice",
        "category": "Rice",
        "price": "850",
        "currency": "USD",
        "priceUnit": "per_unit",
        "stock": "10000",
        "stockUnit": "kg",
        "moq": "1000",
        "moqUnit": "kg",
        "hsnCode": "1006301000",
        "isActive": true,
        "productImages": ["image1.jpg"],
        "selectedIncoterm": "FOB",
        "nearestPort": "Mumbai",
        "isNicheCommodity": false
      }
    ],
    "totalProducts": 1,
    "companyName": "XYZ Exports Pvt Ltd"
  }
}
```

**Error Responses:**

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Only sellers can access inventory",
  "data": null
}
```

---

### 7. Search Buyers for Product

Search for potential buyers based on a specific product from the seller's inventory.

**Endpoint:** `POST /ai/search/from-product`

**Authentication:** Required (Seller or "Seller and Buyer" role)

**Response message:** `"Buyer search completed successfully"` (differs from main search)

**Request Body:**

```json
{
  "productId": "string",
  "country": "string (optional)",
  "limit": 20
}
```

**Validation Rules (SearchFromProductDto):**

| Field | Type | Rules | Description |
|-------|------|-------|-------------|
| productId | string | Required | Product ID from seller's inventory |
| country | string | Optional | Filter by buyer country |
| limit | number | Optional, 1-100 | Max results (default: 20) |

**Response:**

**Success (200 OK):**

Same structure as the main AI search response (see endpoint #1), but `searchType` will be `"seller"`.

**Error Responses:**

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Only sellers can search for buyers",
  "data": null
}
```

```json
{
  "statusCode": 403,
  "message": "You can only search for buyers for your own products"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Product not found"
}
```

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Product does not have a valid commodity name or category"
}
```

---

### 8. Health Check

Check AI server health status.

**Endpoint:** `GET /ai/health`

**Authentication:** Not required (public)

**Response:**

**Success (200 OK):**

```json
{
  "statusCode": 200,
  "message": "AI server health check",
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "uptime_seconds": 86400,
    "services": {
      "database": "connected",
      "redis": "connected",
      "embedding_model": "loaded"
    }
  }
}
```

**Service Unavailable (503):**

```json
{
  "statusCode": 503,
  "message": "AI service is temporarily unavailable. Please try again later."
}
```

---

## Data Models

### EnrichedPartner

Represents a trade partner result enriched with platform awareness.

```typescript
interface EnrichedPartner {
  resultType: 'partner';           // Discriminant for type narrowing
  id?: string;                     // AI-provided ID
  name: string;                    // Company name
  matchScore: number;              // 0-100 score
  matchReason: string;             // Human-readable match explanation
  commodity: string;               // Matched commodity
  country?: string;                // Company country

  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };

  // Platform awareness
  isOnPlatform: boolean;           // Whether company exists on Breyus
  platformCompanyId?: string;      // MongoDB Company ID
  platformUserId?: string;         // MongoDB User ID

  // Calculated scores
  probability?: number;            // 0-100 trade probability
  riskLevel?: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
  priceFluctuation?: number;       // Price trend percentage

  // Source tracking
  sourceType: 'platform_trade_history' | 'platform_and_ai' | 'platform_only' | 'ai_only';

  // Trade history (for platform_trade_history type)
  tradeCount?: number;             // Number of completed trades
  totalQuantity?: number;          // Total quantity traded
  lastTradeDate?: Date;            // Most recent trade date
}
```

### ProductResult

Represents a product result for buyer searches.

```typescript
interface ProductResult {
  resultType: 'product';           // Discriminant for type narrowing
  _id: string;                     // Product MongoDB ID
  name: string;                    // Product name
  price: string;                   // Price value
  currency: string;                // Currency code
  hsnCode: string;                 // HS code
  category: string;                // Product category
  description: string;             // Product description
  stock: string;                   // Available stock
  stockUnit: string;               // Stock unit
  moq: string;                     // Minimum order quantity
  moqUnit: string;                 // MOQ unit

  // Seller info
  userId: string;                  // Seller user ID
  sellerName?: string;             // Seller company name
  sellerCompanyId?: string;        // Seller company ID
  sellerCountry?: string;          // Seller country

  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };

  productImages?: string[];        // Product image URLs
  selectedIncoterm?: string;       // Selected Incoterm
  nearestPort?: string;            // Nearest port
  exportLocation?: string;         // Export location

  isOnPlatform: boolean;           // Always true for products
  sourceType: 'platform_and_ai' | 'platform_only';

  // AI match info (if in AI results)
  aiMatchScore?: number;           // AI match score
  aiMatchReason?: string;          // AI match reason

  // Calculated scores
  probability?: number;            // 0-100 probability
  riskLevel?: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
  priceFluctuation?: number;       // Price trend percentage
}
```

### MergedSearchResult

Main search response structure.

```typescript
interface MergedSearchResult {
  tier1: (EnrichedPartner | ProductResult)[];  // Best matches
  tier2: (EnrichedPartner | ProductResult)[];  // Secondary matches
  tier3: EnrichedPartner[];                    // AI-only (off-platform)

  totalMatches: number;
  searchType: 'buyer' | 'seller';
  commodity: string;
  hsCode?: string;

  searchParams: {
    country?: string;
    port?: string;
    priceRange?: {
      min: number;
      max: number;
    };
  };

  warning?: string;  // Country filter fallback warning
}
```

### CommodityOption

```typescript
interface CommodityOption {
  name: string;                    // Commodity name
  hsCode?: string;                 // HS code prefix
  category?: string;               // Parent category
  source: 'mainstream' | 'platform' | 'ai';
  isMainstream: boolean;           // Mainstream vs niche
}
```

### AnalysisResult

```typescript
interface AnalysisResult {
  commodity: string;
  hsCode?: string;
  summary: string;

  priceTrends?: {
    month: string;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
  }[];

  topExporters?: {
    country: string;
    volume: number;
    percentage: number;
  }[];

  topImporters?: {
    country: string;
    volume: number;
    percentage: number;
  }[];

  demandForecast?: {
    direction: 'increasing' | 'stable' | 'decreasing';
    confidence: number;
    explanation: string;
  };

  seasonality?: {
    peakMonths: string[];
    lowMonths: string[];
  };

  riskFactors?: string[];
  opportunities?: string[];

  chartData?: {
    demandForecast?: { labels: string[]; data: number[] };
    capitalRequired?: { labels: string[]; data: number[] };
    priceVolatility?: { labels: string[]; data: number[] };
  };

  keyInsights?: string[];
}
```

### GravityScoreResponse

```typescript
interface GravityScoreResponse {
  gravityScore: number;            // 0-100 overall score
  confidence: number;              // Confidence percentage

  breakdown: {
    volumeScore: number;           // Composite: avg(demand, trade_frequency) * 10
    proximityScore: number;        // Composite: avg(port_proximity, source_geography) * 10
    priceScore: number;            // price_range * 10
    historyScore: number;          // trade_frequency * 10
    demandScore: number;           // demand * 10
  };

  recommendation: 'highly_recommended' | 'recommended' | 'neutral' | 'caution' | 'not_recommended';

  factors: {
    positive: string[];            // Positive factors
    negative: string[];            // Negative/risk factors
  };
}
```

### SellerInventoryItem

```typescript
interface SellerInventoryItem {
  _id: string;
  name: string;
  category: string;
  price: string;
  currency: string;
  priceUnit: string;
  stock: string;
  stockUnit: string;
  moq: string;
  moqUnit: string;
  hsnCode: string;
  isActive: boolean;
  productImages?: string[];
  selectedIncoterm?: string;
  nearestPort?: string;
  isNicheCommodity: boolean;
}
```

---

## Flow Diagrams

### Buyer AI Workflow

```
1. Commodity Selection (/buyer/ai-select)
   |
   v
2. Search Commodities (POST /ai/commodity-search)
   |
   v
3. Select Commodity (user selects mainstream or niche)
   |
   v
4. Configure Search (country, port, price filters)
   |
   v
5. Execute Search (POST /ai/search)
   |
   v
6. View Results (/buyer/ai-result)
   |-- Tier 1: Products with AI-verified sellers
   |-- Tier 2: Other platform products
   |-- Tier 3: Off-platform sellers (AI suggestions)
   |
   v
7. Optional: Start Market Analysis (POST /ai/analysis/start)
   |
   v
8. Poll Results (GET /ai/analysis/:jobId)
   |
   v
9. View Analysis (price trends, forecasts, risks)
   |
   v
10. Contact Seller / Create Purchase Request
```

### Seller AI Workflow

```
1. Inventory Selection (/seller/ai-inventory)
   |
   v
2. Get Seller Inventory (GET /ai/seller/inventory)
   |
   v
3. Select Product (user selects from their products)
   |
   v
4. Configure Search (country filter)
   |
   v
5. Search Buyers (POST /ai/search/from-product)
   |
   v
6. View Results (/seller/ai-result)
   |-- Tier 1: Buyers with trade history for this commodity
   |-- Tier 2: Interested platform buyers + AI matches on platform
   |-- Tier 3: Off-platform buyers (AI suggestions)
   |
   v
7. Optional: Calculate Gravity Score (POST /ai/gravity-score)
   |
   v
8. Save Contact (off-platform) / Message Buyer (on-platform)
```

---

## Frontend Integration

### Service Functions (ai.service.ts)

```typescript
import {
  aiSearch,
  searchCommodities,
  startAnalysis,
  getAnalysisResults,
  calculateGravityScore,
  getSellerInventory,
  searchBuyersForProduct,
  checkAIHealth
} from '../services/ai.service';

// Main search
const results = await aiSearch({
  commodity: 'Rice',
  country: 'India',
  priceRange: { min: 500, max: 1500 }
});

// Commodity search
const commodities = await searchCommodities({ query: 'rice' });

// Market analysis (async)
const { data: { jobId } } = await startAnalysis({
  commodity: 'Rice',
  destinationCountry: 'USA'
});

// Poll for results
const analysisResult = await getAnalysisResults(jobId);

// Gravity score
const score = await calculateGravityScore({
  commodity: 'Rice',
  buyerCountry: 'USA',
  sellerCountry: 'India'
});
```

### Using the Analysis Polling Hook

```typescript
import { useAnalysisPolling } from '../hooks/useAnalysisPolling';

const MyComponent = () => {
  const {
    startPolling,
    status,
    progress,
    result,
    error
  } = useAnalysisPolling();

  const handleStartAnalysis = async () => {
    await startPolling({
      commodity: 'Rice',
      destinationCountry: 'USA'
    });
  };

  return (
    <div>
      {status === 'PROCESSING' && <Progress value={progress} />}
      {status === 'COMPLETED' && <AnalysisDisplay result={result} />}
      {status === 'FAILED' && <Error message={error} />}
    </div>
  );
};
```

### Type Narrowing for Results

```typescript
// Use resultType discriminant for type-safe access
results.data.tier1.forEach(item => {
  if (item.resultType === 'partner') {
    // Access EnrichedPartner properties
    console.log(item.tradeCount, item.lastTradeDate);
  } else if (item.resultType === 'product') {
    // Access ProductResult properties
    console.log(item.sellerName, item.productImages);
  }
});
```

---

## Error Handling

All endpoints follow a consistent error handling pattern:

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 202 | Accepted (async job started) |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid authentication |
| 403 | Forbidden - Insufficient permissions (wrong role) |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server-side error |
| 502 | Bad Gateway - AI server error |
| 503 | Service Unavailable - AI server not responding |

---

## Link Prediction Waterfall

The AI uses a 5-strategy waterfall for trade partner matching:

| Priority | Strategy | Confidence | Source |
|----------|----------|------------|--------|
| 1 | Historical Match | High | `trade_links` table |
| 2 | Similarity Match | Medium | pgvector embeddings |
| 3 | Geospatial Cluster | Low | PostGIS radius search |
| 4 | Pre-computed Predictions | Inferred | `predicted_partners` table |
| 5 | Commodity Pool | Low | Top traders for commodity |

---

## Source Types

| Source Type | Description | Confidence |
|-------------|-------------|------------|
| `platform_trade_history` | Company has completed trades on Breyus | Highest |
| `platform_and_ai` | Platform company also matched by AI | High |
| `platform_only` | Platform company (no AI match) | Medium |
| `ai_only` | AI-generated (not on platform) | Lower |

---

## Risk Level Calculation

| Score Range | Risk Level |
|-------------|------------|
| >=90 | Very Low |
| >=75 | Low |
| >=55 | Medium |
| >=35 | High |
| <35 | Very High |

---

## Environment Variables

```env
# Backend (.env)
AI_SERVER_URL=http://localhost:8000
AI_API_KEY=your-ai-api-key

# Frontend (.env)
REACT_APP_BACKEND_URL=http://localhost:3001
```

---

## Related Modules

- **Products Module:** Product data enrichment for search results
- **Trade Module:** Trade history for buyer/seller matching
- **Company Module:** Company data for platform awareness
- **Notification Module:** Analysis completion notifications
- **Wishlist Module:** Save off-platform AI contacts
- **Categories Service:** Commodity data source

## Related
- [[api/commodities]] — Commodity data
- [[api/products]] — Platform products
- [[api/trade]] — Trade matching
- [[MOC-AI]]
- [[MOC-API]]

---

## Example Requests

### AI Search (cURL)

```bash
curl -X POST http://localhost:3001/ai/search \
  -H "Content-Type: application/json" \
  -H "Cookie: account=s%3A<signed-token>" \
  -d '{
    "commodity": "Rice",
    "country": "India",
    "priceRange": {
      "min": 500,
      "max": 1500
    },
    "limit": 20
  }'
```

### Start Analysis (cURL)

```bash
curl -X POST http://localhost:3001/ai/analysis/start \
  -H "Content-Type: application/json" \
  -H "Cookie: account=s%3A<signed-token>" \
  -d '{
    "commodity": "Rice",
    "destinationCountry": "USA",
    "sourceCountry": "India"
  }'
```

### Poll Analysis Results (cURL)

```bash
curl -X GET http://localhost:3001/ai/analysis/job_abc123xyz \
  -H "Cookie: account=s%3A<signed-token>"
```

### Calculate Gravity Score (cURL)

```bash
curl -X POST http://localhost:3001/ai/gravity-score \
  -H "Content-Type: application/json" \
  -H "Cookie: account=s%3A<signed-token>" \
  -d '{
    "commodity": "Rice",
    "buyerCountry": "USA",
    "sellerCountry": "India",
    "priceRange": {
      "min": 500,
      "max": 1500
    }
  }'
```

### Get Seller Inventory (cURL)

```bash
curl -X GET http://localhost:3001/ai/seller/inventory \
  -H "Cookie: account=s%3A<signed-token>"
```

### Search Buyers for Product (cURL)

```bash
curl -X POST http://localhost:3001/ai/search/from-product \
  -H "Content-Type: application/json" \
  -H "Cookie: account=s%3A<signed-token>" \
  -d '{
    "productId": "64a1b2c3d4e5f6g7h8i9j0k1",
    "country": "USA",
    "limit": 20
  }'
```

### Health Check (cURL)

```bash
curl -X GET http://localhost:3001/ai/health
```
