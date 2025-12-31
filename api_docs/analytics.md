# Analytics API

## Overview
The Analytics API provides dashboard metrics and chart data for sellers to track their business performance. All endpoints return data specific to the authenticated company's products and trades.

## Base URL
```
/analytics
```

## Authentication
All endpoints require authentication via signed cookie.

---

## Endpoints

### 1. Get Metrics

Retrieves key performance metrics for the dashboard.

**Endpoint:** `GET /analytics/metrics`

**Authentication:** Required (signed cookie)

**Request:** No parameters required

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Metrics retrieved successfully",
  "data": {
    "totalVisits": 1250,
    "totalSales": 45,
    "totalRevenue": 125000,
    "totalCustomers": 32
  }
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "No valid cookie found"
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Failed to get metrics",
  "error": "error details"
}
```

**Implementation Notes:**
- `totalVisits`: Approximated as total trades × 5 (representing product views)
- `totalSales`: Count of completed trades for the seller's products
- `totalRevenue`: Sum of (price × quantity) for all completed trades
- `totalCustomers`: Count of unique buyers who have traded with this seller

---

### 2. Get Bar Graph Data

Retrieves daily trade activity for the last 7 days.

**Endpoint:** `GET /analytics/bar-data`

**Authentication:** Required (signed cookie)

**Request:** No parameters required

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Bar graph data retrieved successfully",
  "data": [
    { "date": "Sun", "storeVisits": 15 },
    { "date": "Mon", "storeVisits": 24 },
    { "date": "Tue", "storeVisits": 18 },
    { "date": "Wed", "storeVisits": 30 },
    { "date": "Thu", "storeVisits": 21 },
    { "date": "Fri", "storeVisits": 27 },
    { "date": "Sat", "storeVisits": 12 }
  ]
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "No valid cookie found"
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Failed to get bar graph data",
  "error": "error details"
}
```

**Implementation Notes:**
- Returns data for the last 7 days
- `date`: Day of week (Sun, Mon, Tue, Wed, Thu, Fri, Sat)
- `storeVisits`: Number of trades initiated × 3 (for visualization scaling)
- Days are ordered from 6 days ago to today

---

### 3. Get Scatter Graph Data

Retrieves daily trade values for the last 30 days.

**Endpoint:** `GET /analytics/scatter-data`

**Authentication:** Required (signed cookie)

**Request:** No parameters required

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Scatter graph data retrieved successfully",
  "data": [
    { "x": 1, "y": 5000 },
    { "x": 2, "y": 7500 },
    { "x": 3, "y": 3200 },
    ...
    { "x": 30, "y": 8100 }
  ]
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "No valid cookie found"
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Failed to get scatter graph data",
  "error": "error details"
}
```

**Implementation Notes:**
- Returns data for the last 30 days
- `x`: Day of month (1-30)
- `y`: Total trade value (sum of offered prices) for that day
- Returns 0 for days with no trades

---

### 4. Get Pie Chart Data

Retrieves customer distribution data (new vs returning customers).

**Endpoint:** `GET /analytics/pie-data`

**Authentication:** Required (signed cookie)

**Request:** No parameters required

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Pie chart data retrieved successfully",
  "data": [
    { "category": "New Customers", "value": 25 },
    { "category": "Returning", "value": 7 }
  ]
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "No valid cookie found"
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Failed to get pie chart data",
  "error": "error details"
}
```

**Implementation Notes:**
- `New Customers`: Buyers who have only one trade with this seller
- `Returning`: Buyers who have multiple trades with this seller
- Minimum value of 1 is returned if no data to ensure chart renders

---

### 5. Get Country Sales Data

Retrieves sales breakdown by country.

**Endpoint:** `GET /analytics/country-sales`

**Authentication:** Required (signed cookie)

**Request:** No parameters required

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Country sales data retrieved successfully",
  "data": [
    {
      "country": "India",
      "flag": "https://flagcdn.com/w40/in.png",
      "sales": 27,
      "value": "₹75,000",
      "bounce": "29.9%"
    },
    {
      "country": "United States",
      "flag": "https://flagcdn.com/w40/us.png",
      "sales": 9,
      "value": "₹25,000",
      "bounce": "35.4%"
    },
    {
      "country": "United Kingdom",
      "flag": "https://flagcdn.com/w40/gb.png",
      "sales": 5,
      "value": "₹12,500",
      "bounce": "42.1%"
    },
    {
      "country": "Germany",
      "flag": "https://flagcdn.com/w40/de.png",
      "sales": 5,
      "value": "₹12,500",
      "bounce": "38.6%"
    }
  ]
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "No valid cookie found"
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Failed to get country sales data",
  "error": "error details"
}
```

**Implementation Notes:**
- Currently returns approximated data based on completed trades
- Distribution: India (60%), United States (20%), UK (10%), Germany (10%)
- `flag`: URL to country flag image from flagcdn.com
- `bounce`: Static placeholder value (not calculated from actual data)
- Future enhancement: Aggregate by actual buyer country

---

## Data Types

### MetricsData
```typescript
interface MetricsData {
  totalVisits: number;     // Approximated page views
  totalSales: number;      // Completed trades count
  totalRevenue: number;    // Total value of completed trades
  totalCustomers: number;  // Unique buyers count
}
```

### BarGraphData
```typescript
interface BarGraphData {
  date: string;        // Day name (Sun, Mon, etc.)
  storeVisits: number; // Activity count for the day
}
```

### ScatterGraphData
```typescript
interface ScatterGraphData {
  x: number; // Day of month (1-30)
  y: number; // Total trade value for that day
}
```

### PieChartData
```typescript
interface PieChartData {
  category: string; // "New Customers" | "Returning"
  value: number;    // Count of customers in category
}
```

### CountrySalesData
```typescript
interface CountrySalesData {
  country: string; // Country name
  flag: string;    // URL to flag image
  sales: number;   // Number of sales
  value: string;   // Formatted currency value
  bounce: string;  // Bounce rate percentage (placeholder)
}
```

---

## Example Requests

### Get Metrics
```bash
curl -X GET http://localhost:3001/analytics/metrics \
  -H "Cookie: account=s%3A<signed-token>"
```

### Get Bar Graph Data
```bash
curl -X GET http://localhost:3001/analytics/bar-data \
  -H "Cookie: account=s%3A<signed-token>"
```

### Get Scatter Graph Data
```bash
curl -X GET http://localhost:3001/analytics/scatter-data \
  -H "Cookie: account=s%3A<signed-token>"
```

### Get Pie Chart Data
```bash
curl -X GET http://localhost:3001/analytics/pie-data \
  -H "Cookie: account=s%3A<signed-token>"
```

### Get Country Sales Data
```bash
curl -X GET http://localhost:3001/analytics/country-sales \
  -H "Cookie: account=s%3A<signed-token>"
```

---

## Frontend Integration Notes

1. **Dashboard Layout:**
   - Display metrics at top (4 cards: Visits, Sales, Revenue, Customers)
   - Bar chart for weekly activity
   - Scatter plot for monthly trends
   - Pie chart for customer distribution
   - Table for country-wise sales

2. **Chart Libraries:**
   - Use Chart.js or Recharts for rendering
   - Bar chart: Use `date` as x-axis, `storeVisits` as y-axis
   - Scatter plot: Use `x` and `y` coordinates directly
   - Pie chart: Use `category` as labels, `value` as data

3. **Data Refresh:**
   - Fetch all endpoints on dashboard load
   - Consider adding refresh button or auto-refresh interval
   - Cache data briefly to avoid excessive API calls

4. **Empty State:**
   - Handle case where seller has no products or trades
   - Display placeholder values or "No data available" message

5. **Currency Formatting:**
   - Country sales values are pre-formatted with ₹ symbol
   - Metrics revenue is returned as number - format on frontend

---

## Related Modules
- **Trade Module:** Source of sales and revenue data
- **Products Module:** Used to identify seller's products
- **Auth Module:** Company ID extracted from auth token
