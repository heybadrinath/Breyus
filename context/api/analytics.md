---
type: api-doc
module: analytics
tags: [api, analytics]
---

# Analytics API

## Overview
The Analytics API provides dashboard metrics and chart data for sellers to track their business performance. It includes both dashboard endpoints and sales page endpoints, plus data export functionality. All endpoints return data specific to the authenticated company's products and trades.

## Base URL
```
/analytics
```

## Authentication
All endpoints require authentication via signed cookie. Protected by AuthGuard which validates:
- Cookie-based JWT authentication
- User existence in database
- User is not suspended

---

## Query Parameters

All analytics endpoints support time range filtering via query parameters:

| Parameter | Type | Values | Default | Description |
|-----------|------|--------|---------|-------------|
| `range` | string | `7d`, `30d`, `90d`, `1y`, `custom` | `7d` | Predefined time range |
| `startDate` | string | ISO date string | - | Custom range start (required if range=custom) |
| `endDate` | string | ISO date string | - | Custom range end (required if range=custom) |

**Example:**
```
GET /analytics/metrics?range=30d
GET /analytics/metrics?range=custom&startDate=2024-01-01&endDate=2024-01-31
```

---

## Dashboard Endpoints

### 1. Get Metrics

Retrieves key performance metrics for the dashboard.

**Endpoint:** `GET /analytics/metrics`

**Authentication:** Required (signed cookie)

**Query Parameters:** See [Query Parameters](#query-parameters)

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
    "totalCustomers": 32,
    "currency": "INR",
    "comparison": {
      "visitsChange": 12,
      "salesChange": -5,
      "revenueChange": 8,
      "customersChange": 3
    }
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
- `totalVisits`: Real product views aggregated from `Product.dailyViews` array within the date range
- `totalSales`: Count of completed trades (`tradePhase: 'COMPLETED'`) for the seller's products
- `totalRevenue`: Sum of (price x quantity) for all completed trades
- `totalCustomers`: Count of unique buyers who have traded with this seller
- `currency`: ISO 4217 currency code inferred from the company's country (falls back to `USD`)
- `comparison`: Percentage change vs the previous period of equal length (e.g., last 7d vs prior 7d). Positive = growth, negative = decline

---

### 2. Get Bar Graph Data

Retrieves daily trade activity data for a bar chart visualization.

**Endpoint:** `GET /analytics/bar-data`

**Authentication:** Required (signed cookie)

**Query Parameters:** See [Query Parameters](#query-parameters)

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
- Returns data based on the specified date range
- `date`: Day of week (Sun, Mon, Tue, Wed, Thu, Fri, Sat) for ≤7 day ranges, or date label (e.g., "Jan 15") for longer ranges
- `storeVisits`: Real product view count aggregated from `Product.dailyViews` array (not approximated)
- For ranges >7 days, dates are bucketed into up to 12 data points
- Days are ordered chronologically

---

### 3. Get Scatter Graph Data

Retrieves daily trade values for a scatter plot visualization.

**Endpoint:** `GET /analytics/scatter-data`

**Authentication:** Required (signed cookie)

**Query Parameters:** See [Query Parameters](#query-parameters)

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Scatter graph data retrieved successfully",
  "data": [
    { "x": 1, "y": 5000, "date": "Sun" },
    { "x": 2, "y": 7500, "date": "Mon" },
    { "x": 3, "y": 3200, "date": "Tue" },
    { "x": 4, "y": 0, "date": "Wed" },
    { "x": 5, "y": 8100, "date": "Thu" },
    { "x": 6, "y": 4500, "date": "Fri" },
    { "x": 7, "y": 6200, "date": "Sat" }
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
- Returns data for the specified date range, bucketed into up to 12 data points
- `x`: Bucket number within the range (1-indexed)
- `y`: Total trade value (sum of price × quantity) for that bucket
- `date`: Human-readable label — day name (Sun, Mon, etc.) for ≤7 day ranges, or date label (e.g., "Jan 15") for longer ranges
- Returns 0 for days with no trades

---

### 4. Get Pie Chart Data

Retrieves customer distribution data (new vs returning customers).

**Endpoint:** `GET /analytics/pie-data`

**Authentication:** Required (signed cookie)

**Query Parameters:** See [Query Parameters](#query-parameters)

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

**Query Parameters:** See [Query Parameters](#query-parameters)

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
      "percentage": "52.9%"
    },
    {
      "country": "United States",
      "flag": "https://flagcdn.com/w40/us.png",
      "sales": 9,
      "value": "₹25,000",
      "percentage": "17.6%"
    },
    {
      "country": "United Kingdom",
      "flag": "https://flagcdn.com/w40/gb.png",
      "sales": 5,
      "value": "₹12,500",
      "percentage": "9.8%"
    },
    {
      "country": "Germany",
      "flag": "https://flagcdn.com/w40/de.png",
      "sales": 5,
      "value": "₹12,500",
      "percentage": "9.8%"
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
- Aggregates trades by delivery destination (`trade.selectedAddress.country`)
- `flag`: URL to country flag image from flagcdn.com (supports 20+ countries, defaults to UN flag)
- `value`: Formatted with currency symbol (inferred from company's country, e.g., `₹75,000`)
- `percentage`: Calculated as `(country sales / total sales) × 100`, e.g., "52.9%"
- Sorted by sales count descending, limited to top 10 countries

---

## Sales Page Endpoints

### 6. Get Sales Metrics

Retrieves comprehensive sales data for the sales analytics page.

**Endpoint:** `GET /analytics/sales-metrics`

**Authentication:** Required (signed cookie)

**Query Parameters:** See [Query Parameters](#query-parameters)

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Sales metrics retrieved successfully",
  "data": {
    "totalSales": 45,
    "totalVolume": 2500,
    "totalRevenue": 250000,
    "averageOrderValue": 5556,
    "totalCustomers": 32,
    "newCustomers": 25,
    "returningCustomers": 7,
    "currency": "INR",
    "comparison": {
      "salesChange": 12,
      "volumeChange": 8,
      "revenueChange": 15,
      "averageOrderChange": 3,
      "customersChange": -2
    }
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
  "message": "Failed to get sales metrics",
  "error": "error details"
}
```

**Implementation Notes:**
- `totalSales`: Count of completed trades (`tradePhase: 'COMPLETED'`)
- `totalVolume`: Sum of quantities from completed trades
- `totalRevenue`: Sum of (price × quantity) from completed trades
- `averageOrderValue`: `totalRevenue / totalSales` (rounded)
- `newCustomers`: Buyers with exactly 1 trade in the period
- `returningCustomers`: Buyers with 2+ trades in the period
- `currency`: ISO 4217 code inferred from company's country
- `comparison`: Percentage change vs the previous period of equal length

---

### 7. Get Top Products

Retrieves top products data for radar chart visualization.

**Endpoint:** `GET /analytics/top-products`

**Authentication:** Required (signed cookie)

**Query Parameters:** See [Query Parameters](#query-parameters)

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Top products retrieved successfully",
  "data": [
    {
      "productName": "Coffee Beans",
      "productId": "507f1f77bcf86cd799439011",
      "tradeCount": 25,
      "totalValue": 50000
    },
    {
      "productName": "Tea Leaves",
      "productId": "507f1f77bcf86cd799439012",
      "tradeCount": 18,
      "totalValue": 35000
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
  "message": "Failed to get top products",
  "error": "error details"
}
```

**Implementation Notes:**
- Returns top 6 products sorted by trade count (for radar chart with 6 axes)
- Only counts completed trades (`tradePhase: 'COMPLETED'`)
- `totalValue`: Sum of (price × quantity) for the product's completed trades

---

### 8. Get Time Series

Retrieves time series data for line/area chart visualization.

**Endpoint:** `GET /analytics/time-series`

**Authentication:** Required (signed cookie)

**Query Parameters:** See [Query Parameters](#query-parameters)

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Time series data retrieved successfully",
  "data": [
    {
      "date": "Sun",
      "revenue": 5000,
      "volume": 50
    },
    {
      "date": "Mon",
      "revenue": 7500,
      "volume": 75
    },
    {
      "date": "Tue",
      "revenue": 3200,
      "volume": 32
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
  "message": "Failed to get time series data",
  "error": "error details"
}
```

**Implementation Notes:**
- Returns data bucketed into up to 12 data points
- `date`: Day name (Sun, Mon, etc.) for ≤7 day ranges, or date label (e.g., "Jan 15") for longer ranges
- Only counts completed trades (`tradePhase: 'COMPLETED'`)
- `volume`: Sum of quantities, `revenue`: Sum of (price × quantity)
- Useful for line, area, or stacked charts

---

## Export Endpoints

### 9. Export CSV

Exports analytics data as a CSV file.

**Endpoint:** `GET /analytics/export/csv`

**Authentication:** Required (signed cookie)

**Query Parameters:** See [Query Parameters](#query-parameters)

**Response:**

**Success (200 OK):**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="breyus-analytics-YYYY-MM-DD-to-YYYY-MM-DD.csv"`
- Body: CSV file content

**CSV Format Example:**
```csv
Breyus Analytics Report
Generated: 2025-01-15T10:30:00.000Z
Period: 2025-01-01 to 2025-01-15
Currency: INR

=== SUMMARY METRICS ===
Metric,Value,Change vs Previous Period
Total Sales,45,12%
Total Volume,2500,8%
Total Revenue,250000,15%
Average Order Value,5556,3%
Total Customers,32,-2%
New Customers,25,-
Returning Customers,7,-

=== TOP PRODUCTS ===
Product Name,Trade Count,Total Value
"Coffee Beans",25,50000
"Tea Leaves",18,35000

=== SALES BY COUNTRY ===
Country,Sales Count,Value,Percentage
"India",27,"₹75,000",52.9%

=== TIME SERIES DATA ===
Date,Revenue,Volume
Sun,5000,50
Mon,7500,75
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
  "message": "Failed to export CSV",
  "error": "error details"
}
```

**Implementation Notes:**
- Multi-section report: Summary Metrics, Top Products, Sales by Country, Time Series
- Filename includes the date range
- UTF-8 encoded
- Includes currency in header and in country sales values
- Can be opened in Excel, Google Sheets, etc.

---

### 10. Export PDF (HTML)

Returns HTML that can be converted to PDF using browser's print API.

**Endpoint:** `GET /analytics/export/pdf`

**Authentication:** Required (signed cookie)

**Query Parameters:** See [Query Parameters](#query-parameters)

**Response:**

**Success (200 OK):**
- Content-Type: `text/html`
- Body: HTML document with analytics report

**HTML Structure:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Analytics Report</title>
  <style>/* Print-friendly styles */</style>
</head>
<body>
  <h1>Analytics Report</h1>
  <p>Period: Jan 1, 2024 - Jan 31, 2024</p>
  <div class="metrics">
    <div class="metric">
      <h3>Total Revenue</h3>
      <p>$125,000</p>
    </div>
    <!-- More metrics -->
  </div>
  <table>
    <!-- Data table -->
  </table>
</body>
</html>
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
  "message": "Failed to export PDF",
  "error": "error details"
}
```

**Implementation Notes:**
- Returns HTML, not actual PDF
- Frontend should use `window.print()` or a PDF library
- Includes print-friendly CSS styles
- Designed for A4 paper size

---

## Data Types

### MetricsData
```typescript
interface MetricsData {
  totalVisits: number;     // Real product views from dailyViews
  totalSales: number;      // Completed trades count
  totalRevenue: number;    // Total value of completed trades
  totalCustomers: number;  // Unique buyers count
  currency: string;        // ISO 4217 currency code (e.g., 'USD', 'INR')
  comparison: MetricsComparison;
}

interface MetricsComparison {
  visitsChange: number;    // % change vs previous period
  salesChange: number;
  revenueChange: number;
  customersChange: number;
}
```

### BarGraphData
```typescript
interface BarGraphData {
  date: string;        // Day name (Sun, Mon, etc.) or date label
  storeVisits: number; // Real product view count for the day/bucket
}
```

### ScatterGraphData
```typescript
interface ScatterGraphData {
  x: number;   // Bucket number in range (1-indexed)
  y: number;   // Total trade value for that bucket
  date: string; // Human-readable date label for X-axis
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
  country: string;    // Country name (from trade delivery address)
  flag: string;       // URL to flag image
  sales: number;      // Number of trades
  value: string;      // Formatted with currency symbol (e.g., "₹75,000")
  percentage: string; // Share of total sales (e.g., "52.9%")
}
```

### SalesMetricsData
```typescript
interface SalesMetricsData {
  totalSales: number;         // Completed trades count
  totalVolume: number;        // Sum of quantities
  totalRevenue: number;       // Sum of price × quantity
  averageOrderValue: number;  // totalRevenue / totalSales
  totalCustomers: number;     // Unique buyers
  newCustomers: number;       // Buyers with 1 trade
  returningCustomers: number; // Buyers with 2+ trades
  currency: string;           // ISO 4217 code
  comparison: SalesMetricsComparison;
}

interface SalesMetricsComparison {
  salesChange: number;        // % change vs previous period
  volumeChange: number;
  revenueChange: number;
  averageOrderChange: number;
  customersChange: number;
}
```

### TopProductData
```typescript
interface TopProductData {
  productName: string;  // Product name
  productId: string;    // MongoDB ObjectId
  tradeCount: number;   // Number of completed trades
  totalValue: number;   // Sum of (price × quantity)
}
```

### TimeSeriesData
```typescript
interface TimeSeriesData {
  date: string;    // Day name or date label
  revenue: number; // Sum of (price × quantity)
  volume: number;  // Sum of quantities
}
```

---

## Example Requests

### Get Metrics (Last 7 Days)
```bash
curl -X GET "http://localhost:3001/analytics/metrics" \
  -H "Cookie: account=s%3A<signed-token>"
```

### Get Metrics (Last 30 Days)
```bash
curl -X GET "http://localhost:3001/analytics/metrics?range=30d" \
  -H "Cookie: account=s%3A<signed-token>"
```

### Get Metrics (Custom Range)
```bash
curl -X GET "http://localhost:3001/analytics/metrics?range=custom&startDate=2024-01-01&endDate=2024-01-31" \
  -H "Cookie: account=s%3A<signed-token>"
```

### Export CSV
```bash
curl -X GET "http://localhost:3001/analytics/export/csv?range=30d" \
  -H "Cookie: account=s%3A<signed-token>" \
  -o analytics-report.csv
```

---

## Frontend Integration Notes

1. **Dashboard Layout:**
   - Display metrics at top (4 cards: Visits, Sales, Revenue, Customers) with comparison badges
   - Bar chart for weekly/daily activity (real product views)
   - Scatter plot for revenue trends (use `date` field for X-axis labels)
   - Pie chart for customer distribution
   - Table for country-wise sales (uses `percentage` field, not bounce)

2. **Sales Page Layout:**
   - Metrics cards with change indicators from `comparison` object (arrows up/down)
   - Time series chart with revenue + volume (line or area)
   - Top products radar chart (6 products max)
   - Currency displayed from `currency` field

3. **Chart Libraries:**
   - Use Chart.js or Recharts for rendering
   - Bar chart: Use `date` as x-axis, `storeVisits` as y-axis
   - Scatter plot: Use `x` and `y` coordinates directly
   - Pie chart: Use `category` as labels, `value` as data
   - Line chart: Use `date` as x-axis, multiple y-axes for metrics

4. **Date Range Selector:**
   ```jsx
   <DateRangeSelector>
     <QuickSelect>
       <Button onClick={() => setRange('7d')}>7 Days</Button>
       <Button onClick={() => setRange('30d')}>30 Days</Button>
       <Button onClick={() => setRange('90d')}>90 Days</Button>
       <Button onClick={() => setRange('1y')}>1 Year</Button>
     </QuickSelect>
     <DatePicker
       startDate={startDate}
       endDate={endDate}
       onChange={(start, end) => {
         setRange('custom');
         setStartDate(start);
         setEndDate(end);
       }}
     />
   </DateRangeSelector>
   ```

5. **Data Refresh:**
   - Fetch all endpoints on dashboard load
   - Refetch when date range changes
   - Consider adding refresh button or auto-refresh interval
   - Cache data briefly to avoid excessive API calls

6. **Export Buttons:**
   ```jsx
   <ExportButtons>
     <Button onClick={async () => {
       const response = await fetch('/analytics/export/csv?range=' + range);
       const blob = await response.blob();
       downloadFile(blob, 'analytics.csv');
     }}>
       Export CSV
     </Button>
     <Button onClick={async () => {
       const response = await fetch('/analytics/export/pdf?range=' + range);
       const html = await response.text();
       const printWindow = window.open('', '_blank');
       printWindow.document.write(html);
       printWindow.print();
     }}>
       Export PDF
     </Button>
   </ExportButtons>
   ```

7. **Empty State:**
   - Handle case where seller has no products or trades
   - Display placeholder values or "No data available" message

---

## Performance & Caching

All analytics endpoints use Redis caching via `CacheService`:
- **TTL**: 60 seconds (1 minute)
- **Cache key format**: `analytics:{companyId}:{endpoint}:{dateRange}`
- Cache is automatically invalidated when trades are created/updated via `invalidateCompanyCache()`

## Currency Inference

The analytics system infers the display currency from the company's country:
1. If company has an explicit `currency` field set (not default `USD`), use it
2. Otherwise, map from company `country` field (e.g., India → `INR`, UK → `GBP`)
3. Falls back to `USD` if country not recognized
4. Currency symbol is used in formatted values (country sales `value` field)

Supported country → currency mappings: India/INR, US/USD, UK/GBP, Germany/France/Italy/Spain/Netherlands/EUR, Japan/JPY, China/CNY, Australia/AUD, Canada/CAD, Singapore/SGD, UAE/AED, Brazil/BRL, Russia/RUB, South Korea/KRW, Mexico/MXN, Thailand/THB, Chile/CLP, Argentina/ARS.

## Related Modules
- **Trade Module:** Source of sales and revenue data
- **Products Module:** Used to identify seller's products (includes `dailyViews` for visit tracking)
- **Auth Module:** Company ID extracted from auth token
- **Company Module:** Company information for currency inference
- **Cache Module:** Redis caching for all analytics queries

## Related
- [[api/trade]] — Trade metrics
- [[api/products]] — Product metrics
- [[MOC-API]]
