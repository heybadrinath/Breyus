---
type: api-doc
module: commodities
tags: [api, commodities]
---

# Commodities API

## Overview
The Commodities API provides real-time and near-real-time commodity futures prices for the marketplace. It powers the CommodityPriceWidget on the marketplace page, displaying prices for energy, metals, agricultural commodities, and precious metals. Data is sourced from Alpha Vantage API with smart lazy-refresh caching.

## Base URL
```
/commodities
```

## Authentication
All endpoints are **public** and do not require authentication.

---

## Data Source & Caching

### Alpha Vantage Integration
- **Data Source:** Alpha Vantage commodity futures API
- **Price Delay:** ~15 minutes from exchange
- **Refresh Strategy:** Lazy refresh on user request

### Rate Limiting Strategy

| Constraint | Value |
|------------|-------|
| API calls per day (free tier) | 25 |
| Commodities tracked | 12 |
| Max refreshes per day | 2 |
| Minimum refresh interval | 12 hours |
| Stale data threshold | 24 hours (always refresh) |

### Lazy Refresh Logic
1. On user request, check when data was last updated
2. If data > 24 hours old: **Always refresh** (stale override)
3. If data > 12 hours old: **Refresh** (normal interval)
4. Otherwise: **Return cached data**

**Note:** No cron jobs - refresh only happens when users request data.

---

## Endpoints

### 1. Get All Commodity Prices

Returns all tracked commodity prices with summary metadata and refresh status.

**Endpoint:** `GET /commodities/prices`

**Authentication:** None required

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Commodity prices fetched successfully",
  "data": {
    "prices": [
      {
        "_id": "commodity-CL",
        "symbol": "CL",
        "name": "Crude Oil WTI",
        "price": 78.45,
        "currency": "USD",
        "change": 1.23,
        "changePercent": 1.59,
        "exchange": "ALPHA_VANTAGE",
        "category": "Energy",
        "unit": "per bbl",
        "fetchedAt": "2025-01-15T14:30:00.000Z",
        "delayMinutes": 15,
        "isActive": true,
        "priceHistory": [
          { "date": "2025-01-09", "value": 76.20 },
          { "date": "2025-01-10", "value": 77.35 },
          { "date": "2025-01-11", "value": 76.90 },
          { "date": "2025-01-12", "value": 77.80 },
          { "date": "2025-01-13", "value": 78.10 },
          { "date": "2025-01-14", "value": 77.22 },
          { "date": "2025-01-15", "value": 78.45 }
        ],
        "weekHigh": 78.45,
        "weekLow": 76.20
      },
      {
        "_id": "commodity-GC",
        "symbol": "GC",
        "name": "Gold",
        "price": 2045.30,
        "currency": "USD",
        "change": -12.50,
        "changePercent": -0.61,
        "exchange": "ALPHA_VANTAGE",
        "category": "Precious Metals",
        "unit": "per oz",
        "fetchedAt": "2025-01-15T14:30:00.000Z",
        "delayMinutes": 15,
        "isActive": true,
        "priceHistory": [...],
        "weekHigh": 2065.00,
        "weekLow": 2030.50
      }
    ],
    "lastUpdated": "2025-01-15T14:30:00.000Z",
    "delayMinutes": 15,
    "totalCount": 12,
    "nextRefreshAt": "2025-01-16T02:30:00.000Z",
    "refreshIntervalHours": 12,
    "dataSource": "Alpha Vantage",
    "isLoading": false
  }
}
```

**Response When API Key Not Configured:**
```json
{
  "statusCode": 200,
  "message": "Commodity prices fetched successfully",
  "data": {
    "prices": [],
    "lastUpdated": null,
    "delayMinutes": 15,
    "totalCount": 0,
    "nextRefreshAt": null,
    "refreshIntervalHours": 12,
    "dataSource": "Unavailable - API key not configured",
    "isLoading": false
  }
}
```

---

### 2. Get Price by Symbol

Returns the price for a specific commodity by its trading symbol.

**Endpoint:** `GET /commodities/prices/:symbol`

**Authentication:** None required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| symbol | string | Commodity trading symbol (case-insensitive) |

**Available Symbols:**

| Symbol | Name | Category |
|--------|------|----------|
| CL | Crude Oil WTI | Energy |
| BZ | Brent Crude | Energy |
| NG | Natural Gas | Energy |
| HG | Copper | Metals |
| ALI | Aluminum | Metals |
| ZW | Wheat | Agricultural |
| ZC | Corn | Agricultural |
| CT | Cotton | Agricultural |
| SB | Sugar #11 | Agricultural |
| KC | Coffee | Agricultural |
| GC | Gold | Precious Metals |
| SI | Silver | Precious Metals |

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Commodity price fetched successfully",
  "data": {
    "_id": "commodity-GC",
    "symbol": "GC",
    "name": "Gold",
    "price": 2045.30,
    "currency": "USD",
    "change": -12.50,
    "changePercent": -0.61,
    "exchange": "ALPHA_VANTAGE",
    "category": "Precious Metals",
    "unit": "per oz",
    "fetchedAt": "2025-01-15T14:30:00.000Z",
    "delayMinutes": 15,
    "isActive": true,
    "priceHistory": [
      { "date": "2025-01-09", "value": 2055.00 },
      { "date": "2025-01-10", "value": 2060.25 },
      { "date": "2025-01-11", "value": 2057.80 },
      { "date": "2025-01-12", "value": 2065.00 },
      { "date": "2025-01-13", "value": 2030.50 },
      { "date": "2025-01-14", "value": 2057.80 },
      { "date": "2025-01-15", "value": 2045.30 }
    ],
    "weekHigh": 2065.00,
    "weekLow": 2030.50
  }
}
```

**Error (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Commodity with symbol 'XYZ' not found"
}
```

---

### 3. Get Prices by Category

Returns all commodity prices within a specific category.

**Endpoint:** `GET /commodities/prices/category/:category`

**Authentication:** None required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Commodity category name |

**Valid Categories:**
- `Energy`
- `Metals`
- `Agricultural`
- `Precious Metals`

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Commodity prices for category 'Energy' fetched successfully",
  "data": [
    {
      "_id": "commodity-CL",
      "symbol": "CL",
      "name": "Crude Oil WTI",
      "price": 78.45,
      "currency": "USD",
      "change": 1.23,
      "changePercent": 1.59,
      "exchange": "ALPHA_VANTAGE",
      "category": "Energy",
      "unit": "per bbl",
      "fetchedAt": "2025-01-15T14:30:00.000Z",
      "delayMinutes": 15,
      "isActive": true,
      "priceHistory": [...],
      "weekHigh": 78.45,
      "weekLow": 76.20
    },
    {
      "_id": "commodity-BZ",
      "symbol": "BZ",
      "name": "Brent Crude",
      "price": 82.15,
      "currency": "USD",
      "change": 0.87,
      "changePercent": 1.07,
      "exchange": "ALPHA_VANTAGE",
      "category": "Energy",
      "unit": "per bbl",
      "fetchedAt": "2025-01-15T14:30:00.000Z",
      "delayMinutes": 15,
      "isActive": true,
      "priceHistory": [...],
      "weekHigh": 83.00,
      "weekLow": 80.50
    },
    {
      "_id": "commodity-NG",
      "symbol": "NG",
      "name": "Natural Gas",
      "price": 3.42,
      "currency": "USD",
      "change": -0.08,
      "changePercent": -2.29,
      "exchange": "ALPHA_VANTAGE",
      "category": "Energy",
      "unit": "per MMBtu",
      "fetchedAt": "2025-01-15T14:30:00.000Z",
      "delayMinutes": 15,
      "isActive": true,
      "priceHistory": [...],
      "weekHigh": 3.65,
      "weekLow": 3.30
    }
  ]
}
```

**Error (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Category 'Invalid' not found. Valid categories: Energy, Metals, Agricultural, Precious Metals"
}
```

---

## Data Models

### CommodityPrice

```typescript
interface CommodityPrice {
  _id: string;              // Format: "commodity-{SYMBOL}"
  symbol: string;           // Trading symbol (e.g., "CL", "GC")
  name: string;             // Display name (e.g., "Crude Oil WTI")
  price: number;            // Current price (2 decimal places)
  currency: string;         // Currency code (always "USD")
  change: number;           // Price change from previous day
  changePercent: number;    // Percentage change
  exchange: Exchange;       // Data source exchange
  category: CommodityCategory;
  unit: string;             // Price unit (e.g., "per bbl", "per oz")
  fetchedAt: string;        // ISO timestamp of last fetch
  delayMinutes: number;     // Price delay from exchange (~15)
  isActive: boolean;        // Whether commodity is actively tracked
  priceHistory: PriceHistoryPoint[];  // Last 7 days for sparklines
  weekHigh: number;         // 7-day high price
  weekLow: number;          // 7-day low price
}
```

### PriceHistoryPoint

```typescript
interface PriceHistoryPoint {
  date: string;    // ISO date string (YYYY-MM-DD)
  value: number;   // Price value
}
```

### CommodityPriceSummary

```typescript
interface CommodityPriceSummary {
  prices: CommodityPrice[];
  lastUpdated: string | null;       // ISO timestamp of last refresh
  delayMinutes: number;             // Price delay (~15 minutes)
  totalCount: number;               // Number of commodities
  nextRefreshAt: string | null;     // When next refresh is allowed
  refreshIntervalHours: number;     // Refresh interval (12 hours)
  dataSource: string;               // "Alpha Vantage" or error message
  isLoading: boolean;               // Whether refresh is in progress
}
```

### CommodityCategory

```typescript
type CommodityCategory =
  | 'Energy'
  | 'Metals'
  | 'Agricultural'
  | 'Precious Metals';
```

### Exchange

```typescript
type Exchange =
  | 'CME'
  | 'NYMEX'
  | 'LME'
  | 'COMEX'
  | 'CBOT'
  | 'ICE'
  | 'MCX'
  | 'ALPHA_VANTAGE';
```

---

## Tracked Commodities

### Energy

| Symbol | Name | Unit |
|--------|------|------|
| CL | Crude Oil WTI | per bbl |
| BZ | Brent Crude | per bbl |
| NG | Natural Gas | per MMBtu |

### Metals

| Symbol | Name | Unit |
|--------|------|------|
| HG | Copper | per lb |
| ALI | Aluminum | per MT |

### Agricultural

| Symbol | Name | Unit |
|--------|------|------|
| ZW | Wheat | per bu |
| ZC | Corn | per bu |
| CT | Cotton | per lb |
| SB | Sugar #11 | per lb |
| KC | Coffee | per lb |

### Precious Metals

| Symbol | Name | Unit |
|--------|------|------|
| GC | Gold | per oz |
| SI | Silver | per oz |

---

## Error Handling

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 404 | Commodity or category not found |
| 500 | Internal Server Error |

---

## Example Requests

### Get All Prices
```bash
curl -X GET "http://localhost:3001/commodities/prices"
```

### Get Gold Price
```bash
curl -X GET "http://localhost:3001/commodities/prices/GC"
```

### Get Energy Commodities
```bash
curl -X GET "http://localhost:3001/commodities/prices/category/Energy"
```

---

## Frontend Integration Notes

1. **Sparkline Charts:** Use the `priceHistory` array (7 data points) to render mini charts for each commodity.

2. **Price Change Indicators:** Use `change` and `changePercent` to show price movement with appropriate colors (green for positive, red for negative).

3. **Range Display:** Use `weekHigh` and `weekLow` to show 7-day price range.

4. **Loading State:** Check `isLoading` in the summary response to show a loading indicator during background refresh.

5. **Refresh Status:** Display `lastUpdated` and `nextRefreshAt` to inform users about data freshness.

6. **Empty State:** Handle the case when `prices` array is empty (API key not configured).

7. **Symbol Lookup:** Symbols are case-insensitive in the API (converted to uppercase internally).

---

## Environment Configuration

To enable real commodity prices, set the Alpha Vantage API key:

```env
ALPHA_VANTAGE_API_KEY=your-api-key-here
```

Get a free API key at: https://www.alphavantage.co/support/#api-key

---

## Related Modules
- **AI Module:** Uses commodity data for market analysis
- **Products Module:** Associates products with commodity categories

## Related
- [[api/ai]] — AI commodity search
- [[api/products]] — Product listings
- [[MOC-AI]]
- [[MOC-API]]
