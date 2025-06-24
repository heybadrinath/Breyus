-- Bar Graph table
CREATE TABLE IF NOT EXISTS bar_graph (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id TEXT NOT NULL,
    date TEXT NOT NULL,
    storeVisits INTEGER NOT NULL,
    uniqueVisitors INTEGER NOT NULL
);

-- Scatter Graph table
CREATE TABLE IF NOT EXISTS scatter_graph (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id TEXT NOT NULL,
    day TEXT NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL
);

-- Pie Chart table
CREATE TABLE IF NOT EXISTS pie_chart (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id TEXT NOT NULL,
    category TEXT NOT NULL,
    value INTEGER NOT NULL
);

-- Country Sales table
CREATE TABLE IF NOT EXISTS country_sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id TEXT NOT NULL,
    country TEXT NOT NULL,
    flag TEXT NOT NULL,
    sales INTEGER NOT NULL,
    value TEXT NOT NULL,
    bounce TEXT NOT NULL,
    sales_count INTEGER NOT NULL
); 