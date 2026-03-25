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
- `totalVisits`: Approximated as total trades x 5 (representing product views)
- `totalSales`: Count of completed trades for the seller's products
- `totalRevenue`: Sum of (price x quantity) for all completed trades
- `totalCustomers`: Count of unique buyers who have traded with this seller

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
- `date`: Day of week (Sun, Mon, Tue, Wed, Thu, Fri, Sat) or date string
- `storeVisits`: Number of trades initiated x 3 (for visualization scaling)
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
    { "x": 1, "y": 5000 },
    { "x": 2, "y": 7500 },
    { "x": 3, "y": 3200 },
    { "x": 4, "y": 0 },
    { "x": 5, "y": 8100 },
    { "x": 6, "y": 4500 },
    { "x": 7, "y": 6200 }
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
- Returns data for the specified date range
- `x`: Day number within the range
- `y`: Total trade value (sum of offered prices) for that day
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
      "value": "75,000",
      "bounce": "29.9%"
    },
    {
      "country": "United States",
      "flag": "https://flagcdn.com/w40/us.png",
      "sales": 9,
      "value": "25,000",
      "bounce": "35.4%"
    },
    {
      "country": "United Kingdom",
      "flag": "https://flagcdn.com/w40/gb.png",
      "sales": 5,
      "value": "12,500",
      "bounce": "42.1%"
    },
    {
      "country": "Germany",
      "flag": "https://flagcdn.com/w40/de.png",
      "sales": 5,
      "value": "12,500",
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
- `flag`: URL to country flag image from flagcdn.com
- `bounce`: Static placeholder value (not calculated from actual data)
- Future enhancement: Aggregate by actual buyer country

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
    "totalRevenue": 250000,
    "revenueChange": 12.5,
    "totalOrders": 45,
    "ordersChange": 8.3,
    "averageOrderValue": 5555.55,
    "aovChange": 3.2,
    "conversionRate": 15.5,
    "conversionChange": -2.1,
    "topSellingProducts": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "name": "Product A",
        "revenue": 50000,
        "units": 100
      }
    ],
    "recentOrders": [
      {
        "tradeId": "507f1f77bcf86cd799439011",
        "buyerName": "Company XYZ",
        "amount": 5000,
        "status": "completed",
        "date": "2024-01-15T10:30:00.000Z"
      }
    ]
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
- `*Change` fields show percentage change from previous period
- Positive values indicate growth, negative indicate decline
- Includes top selling products and recent orders

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
      "productId": "507f1f77bcf86cd799439011",
      "name": "Coffee Beans",
      "revenue": 50000,
      "orders": 25,
      "units": 500,
      "avgPrice": 100
    },
    {
      "productId": "507f1f77bcf86cd799439012",
      "name": "Tea Leaves",
      "revenue": 35000,
      "orders": 18,
      "units": 350,
      "avgPrice": 100
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
- Returns top 10 products by revenue
- Useful for radar/spider chart visualization
- Includes all key metrics per product

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
      "date": "2024-01-01",
      "revenue": 5000,
      "orders": 3,
      "units": 50
    },
    {
      "date": "2024-01-02",
      "revenue": 7500,
      "orders": 5,
      "units": 75
    },
    {
      "date": "2024-01-03",
      "revenue": 3200,
      "orders": 2,
      "units": 32
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
- Returns daily aggregated data
- Date format: `YYYY-MM-DD`
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
Date,Revenue,Orders,Units,Average Order Value
2024-01-01,5000,3,50,1666.67
2024-01-02,7500,5,75,1500.00
2024-01-03,3200,2,32,1600.00
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
- Filename includes the date range
- UTF-8 encoded
- Includes headers in first row
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
  totalVisits: number;     // Approximated page views
  totalSales: number;      // Completed trades count
  totalRevenue: number;    // Total value of completed trades
  totalCustomers: number;  // Unique buyers count
}
```

### BarGraphData
```typescript
interface BarGraphData {
  date: string;        // Day name (Sun, Mon, etc.) or date string
  storeVisits: number; // Activity count for the day
}
```

### ScatterGraphData
```typescript
interface ScatterGraphData {
  x: number; // Day number in range
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

### SalesMetricsData
```typescript
interface SalesMetricsData {
  totalRevenue: number;
  revenueChange: number;      // Percentage change
  totalOrders: number;
  ordersChange: number;       // Percentage change
  averageOrderValue: number;
  aovChange: number;          // Percentage change
  conversionRate: number;
  conversionChange: number;   // Percentage change
  topSellingProducts: TopProduct[];
  recentOrders: RecentOrder[];
}
```

### TopProduct
```typescript
interface TopProduct {
  productId: string;
  name: string;
  revenue: number;
  orders: number;
  units: number;
  avgPrice: number;
}
```

### TimeSeriesData
```typescript
interface TimeSeriesData {
  date: string;    // YYYY-MM-DD format
  revenue: number;
  orders: number;
  units: number;
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
   - Display metrics at top (4 cards: Visits, Sales, Revenue, Customers)
   - Bar chart for weekly/daily activity
   - Scatter plot for revenue trends
   - Pie chart for customer distribution
   - Table for country-wise sales

2. **Sales Page Layout:**
   - Metrics cards with change indicators (arrows up/down)
   - Time series chart (line or area)
   - Top products radar chart
   - Recent orders table

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

## Related Modules
- **Trade Module:** Source of sales and revenue data
- **Products Module:** Used to identify seller's products
- **Auth Module:** Company ID extracted from auth token
- **Company Module:** Company information for reports
