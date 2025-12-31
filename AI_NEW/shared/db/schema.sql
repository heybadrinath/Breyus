-- =============================================================================
-- BREYUS AI DATABASE SCHEMA
-- PostgreSQL + pgvector + PostGIS
-- =============================================================================
-- Note: Use migrations in shared/db/migrations as the source of truth.
--
-- Design Principles:
-- 1. Core normalized fields for common queries and indexing
-- 2. JSONB 'extra' column for row-specific additional data
-- 3. JSONB nested structures for complex objects (contact, address, trade details)
-- 4. Vector embeddings via pgvector for similarity search
-- 5. PostGIS for geospatial queries
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- For gen_random_uuid()

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE entity_type AS ENUM (
    'exporter',
    'importer',
    'buyer',
    'seller',
    'manufacturer',
    'wholesaler',
    'supplier',
    'consignee',
    'unknown'
);

CREATE TYPE record_type AS ENUM (
    'export',
    'import'
);

CREATE TYPE data_source_type AS ENUM (
    'indian_trade_records',
    'international_trade_records',
    'company_directory',
    'product_catalog',
    'manual_entry',
    'platform_generated',
    'other'
);

-- =============================================================================
-- TABLE: companies
-- =============================================================================
-- Stores all company/entity information from various data sources
-- Core fields are normalized; extra data goes in JSONB columns

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Core identifiers (frequently queried, indexed)
    name VARCHAR(500) NOT NULL,
    name_normalized VARCHAR(500),  -- Lowercase, trimmed, for matching
    iec_code VARCHAR(50),          -- India Export Code (for Indian companies)
    iec_pan VARCHAR(20),           -- PAN linked to IEC
    iec_established DATE,          -- Date of IEC establishment

    -- Entity classification
    entity_types entity_type[] DEFAULT ARRAY['unknown']::entity_type[],

    -- Location (core fields for queries)
    country VARCHAR(100),
    country_code CHAR(3),          -- ISO 3166-1 alpha-3
    state VARCHAR(100),
    city VARCHAR(100),
    pin_code VARCHAR(20),

    -- Address (structured for flexibility)
    address_full TEXT,             -- Full address as provided
    address_details JSONB DEFAULT '{}',  -- {line1, line2, landmark, etc.}

    -- Geospatial
    location GEOGRAPHY(POINT, 4326),  -- PostGIS point for geo queries

    -- Contact Information (JSONB for flexible structure)
    contact_info JSONB DEFAULT '{}',
    -- Structure: {
    --   "phone": ["..."],
    --   "mobile": ["..."],
    --   "email": ["..."],
    --   "website": "...",
    --   "contact_person": "...",
    --   "fax": "..."
    -- }

    -- Business information
    business_details TEXT,         -- Description of business
    product_categories TEXT[],     -- Array of categories they deal in
    hs_codes_dealt INTEGER[],      -- Array of HS codes they trade

    -- Trade statistics (computed/aggregated)
    total_exports INTEGER DEFAULT 0,
    total_imports INTEGER DEFAULT 0,
    total_trade_value_usd DECIMAL(18, 2) DEFAULT 0,
    countries_traded_with TEXT[],

    -- Verification & source
    is_verified BOOLEAN DEFAULT FALSE,
    data_source data_source_type DEFAULT 'other',
    source_file VARCHAR(255),
    source_row_id VARCHAR(100),    -- Original row identifier from source

    -- Embeddings for AI similarity search
    name_embedding vector(384),    -- For company name similarity
    profile_embedding vector(384), -- For business profile similarity

    -- Flexible extra data (for source-specific fields)
    extra JSONB DEFAULT '{}',
    -- Can contain any additional fields like:
    -- - source_specific fields
    -- - custom attributes
    -- - temporary processing data

    -- Raw data preservation
    raw_data JSONB,                -- Original row as imported

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT company_name_not_empty CHECK (name <> '')
);

-- =============================================================================
-- TABLE: trade_records
-- =============================================================================
-- Stores all trade transaction records (exports and imports)

CREATE TABLE trade_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Record classification
    record_type record_type NOT NULL,

    -- Transaction identifiers
    sb_number VARCHAR(50),         -- Shipping Bill Number
    sb_date DATE,                  -- Shipping Bill Date
    reg_date DATE,                 -- Registration Date
    invoice_number VARCHAR(100),   -- Invoice Number

    -- Parties involved (references to companies table optional)
    exporter_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    exporter_name VARCHAR(500),
    exporter_address TEXT,
    exporter_iec VARCHAR(50),

    importer_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    importer_name VARCHAR(500),    -- Could be consignee/buyer
    importer_address TEXT,

    supplier_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    supplier_name VARCHAR(500),
    supplier_address TEXT,

    consignee_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    consignee_name VARCHAR(500),
    consignee_address TEXT,
    consignee_country VARCHAR(100),

    -- Product information
    hs_code VARCHAR(20),           -- Harmonized System code
    hs_chapter INTEGER,            -- HS Chapter (first 2 digits)
    ritc_code VARCHAR(20),         -- RITC code (alternative classification)
    product_description TEXT,
    item_description TEXT,         -- Alternative description field

    -- Quantity and units
    quantity DECIMAL(18, 4),
    unit_of_measurement VARCHAR(20),  -- KGS, MTS, PCS, NOS, etc.
    net_weight_kg DECIMAL(18, 4),

    -- Pricing and value
    unit_price DECIMAL(18, 6),
    unit_price_usd DECIMAL(18, 6),
    unit_price_inr DECIMAL(18, 6),
    currency VARCHAR(50),
    exchange_rate DECIMAL(12, 6),
    total_value_fc DECIMAL(18, 2),    -- Foreign currency
    total_value_usd DECIMAL(18, 2),
    total_value_inr DECIMAL(18, 2),
    fob_value DECIMAL(18, 2),
    duty_value DECIMAL(18, 2),
    drawback_value DECIMAL(18, 2),

    -- Ports and transportation
    indian_port VARCHAR(100),
    indian_port_code VARCHAR(20),
    foreign_port VARCHAR(100),
    foreign_port_code VARCHAR(20),
    mode_of_transport VARCHAR(50),   -- SEA, AIR, ROAD, RAIL
    customs_house_code VARCHAR(20),

    -- Countries
    origin_country VARCHAR(100),
    destination_country VARCHAR(100),

    -- Time period
    trade_month VARCHAR(20),
    trade_year INTEGER,
    trade_period VARCHAR(50),      -- Period description (e.g., "Q1 2023", "Jan-Mar")

    -- Clearance details
    cha_name VARCHAR(255),         -- Customs House Agent
    shipment_type VARCHAR(100),
    shipment_status VARCHAR(50),

    -- Embeddings for AI search
    product_embedding vector(384), -- For product similarity search

    -- Trade-specific extra data (JSONB for flexibility)
    trade_details JSONB DEFAULT '{}',
    -- Can contain:
    -- - incoterms
    -- - payment_terms
    -- - additional_charges
    -- - special_conditions
    -- - source-specific fields

    -- Source tracking
    data_source data_source_type DEFAULT 'other',
    source_file VARCHAR(255),
    source_sheet VARCHAR(100),
    source_row_id VARCHAR(100),

    -- Raw data preservation
    raw_data JSONB,

    -- Flexible extra fields (for row-specific data)
    extra JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE: products
-- =============================================================================
-- Stores product catalog information

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Product identification
    name VARCHAR(500) NOT NULL,
    name_normalized VARCHAR(500),
    hs_code VARCHAR(20),
    hs_chapter INTEGER,

    -- Classification
    category VARCHAR(200),
    subcategory VARCHAR(200),
    product_type VARCHAR(100),

    -- Target market
    consumer_types TEXT[],         -- Array: cattle, poultry, human, industrial, etc.

    -- Pricing
    price_value DECIMAL(18, 4),
    price_unit VARCHAR(50),        -- per KG, per tonne, etc.
    price_currency VARCHAR(50),
    is_negotiable BOOLEAN DEFAULT FALSE,

    -- Packaging
    packaging_info VARCHAR(255),
    weight_value DECIMAL(12, 4),
    weight_unit VARCHAR(20),

    -- Source/manufacturer info
    manufacturer_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    manufacturer_name VARCHAR(500),
    city VARCHAR(100),
    country VARCHAR(100),

    -- Embedding for AI search
    product_embedding vector(384),

    -- Extra flexible fields
    specifications JSONB DEFAULT '{}',  -- Technical specs, dimensions, etc.
    extra JSONB DEFAULT '{}',           -- Any additional row-specific data

    -- Source tracking
    data_source data_source_type DEFAULT 'other',
    source_file VARCHAR(255),
    raw_data JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE: entities (flexible catch-all for new domain objects)
-- =============================================================================
-- Purpose:
-- - Hold flexible records that do not yet fit the core tables (people, investors, rounds, misc)
-- - Avoid schema churn by using JSONB for attributes/extra/raw_data
-- - Allow embeddings/geospatial for discovery

CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Classification
    entity_type TEXT NOT NULL DEFAULT 'generic',   -- e.g., person, investor, round, org, misc
    subtype TEXT,                                  -- optional finer grain (e.g., "seed_round")

    -- Basic identity
    name VARCHAR(500) NOT NULL,
    name_normalized VARCHAR(500),
    description TEXT,

    -- Link back to canonical table if it maps later
    canonical_table VARCHAR(50),                   -- e.g., companies, trade_records, products
    canonical_id UUID,                             -- UUID in canonical table (if linked)

    -- Location & contact
    country VARCHAR(100),
    country_code CHAR(3),
    state VARCHAR(100),
    city VARCHAR(100),
    address_full TEXT,
    address_details JSONB DEFAULT '{}',
    contact_info JSONB DEFAULT '{}',               -- phones/emails/etc
    location GEOGRAPHY(POINT, 4326),

    -- Flexible attributes
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    attributes JSONB DEFAULT '{}',                 -- key/value normalized attributes
    extra JSONB DEFAULT '{}',                      -- overflow
    raw_data JSONB,                                -- original row

    -- Embedding for similarity
    embedding vector(384),

    -- Source tracking
    data_source data_source_type DEFAULT 'other',
    source_file VARCHAR(255),
    source_row_id VARCHAR(100),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT entities_name_not_empty CHECK (name <> '')
);

-- =============================================================================
-- TABLE: trade_links
-- =============================================================================
-- Stores actual trade relationships between entities

CREATE TABLE trade_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Link parties (at least one of each pair should be set)
    source_company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    source_company_name VARCHAR(500),  -- Denormalized for quick access

    target_company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    target_company_name VARCHAR(500),

    -- Link characteristics
    link_type VARCHAR(50) NOT NULL,    -- 'export_to', 'import_from', 'supplier_buyer'
    relationship_strength DECIMAL(5, 4), -- 0.0 to 1.0

    -- Aggregated statistics
    total_trades INTEGER DEFAULT 0,
    total_value_usd DECIMAL(18, 2) DEFAULT 0,
    first_trade_date DATE,
    last_trade_date DATE,

    -- Common trade details
    commodities_traded TEXT[],
    hs_codes_traded INTEGER[],

    -- Computed/derived
    is_active BOOLEAN DEFAULT TRUE,    -- Had trade in last 12 months

    -- Extra data
    extra JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure no duplicate links
    CONSTRAINT unique_trade_link UNIQUE (source_company_id, target_company_id, link_type)
);

-- =============================================================================
-- TABLE: predicted_partners
-- =============================================================================
-- Pre-computed partner predictions from AI matching

CREATE TABLE predicted_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The company we're predicting partners for
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    company_name VARCHAR(500),

    -- Predicted partner
    partner_company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    partner_company_name VARCHAR(500),

    -- Prediction details
    prediction_type VARCHAR(50),       -- 'buyer_for', 'seller_for', 'similar_trade_pattern'
    probability_score DECIMAL(5, 4),   -- 0.0 to 1.0
    confidence_level VARCHAR(20),      -- 'high', 'medium', 'low'

    -- Explanation
    prediction_reasons JSONB,          -- Array of reasons with scores
    -- Structure: [
    --   {"factor": "same_commodity", "weight": 0.3, "score": 0.85},
    --   {"factor": "geographic_proximity", "weight": 0.2, "score": 0.7},
    --   ...
    -- ]

    -- Commodity context
    for_commodity VARCHAR(200),
    for_hs_code VARCHAR(20),

    -- Validity
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,           -- When to recompute

    -- Extra data
    extra JSONB DEFAULT '{}',

    CONSTRAINT unique_prediction UNIQUE (company_id, partner_company_id, prediction_type, for_commodity)
);

-- =============================================================================
-- TABLE: ai_cache_link_predictions
-- =============================================================================
-- Stores long-lived cached link prediction responses with TTL.

CREATE TABLE ai_cache_link_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT NOT NULL,
    commodity VARCHAR(200),
    response JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_ai_cache_links_key ON ai_cache_link_predictions (cache_key, commodity);
CREATE INDEX idx_ai_cache_links_expires ON ai_cache_link_predictions (expires_at);

-- =============================================================================
-- TABLE: ai_cache_trade_scores
-- =============================================================================
-- Stores long-lived cached trade score responses with TTL.

CREATE TABLE ai_cache_trade_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_key TEXT NOT NULL,
    seller_key TEXT NOT NULL,
    commodity VARCHAR(200),
    response JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_ai_cache_trade_keys ON ai_cache_trade_scores (buyer_key, seller_key, commodity);
CREATE INDEX idx_ai_cache_trade_expires ON ai_cache_trade_scores (expires_at);

-- =============================================================================
-- TABLE: ai_cache_analysis_results
-- =============================================================================
-- Stores long-lived analysis results with TTL.

CREATE TABLE ai_cache_analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id TEXT NOT NULL,
    commodity VARCHAR(200),
    hs_code VARCHAR(20),
    request JSONB,
    response JSONB,
    status VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_ai_cache_analysis_job ON ai_cache_analysis_results (job_id);
CREATE INDEX idx_ai_cache_analysis_expires ON ai_cache_analysis_results (expires_at);

-- =============================================================================
-- TABLE: data_import_log
-- =============================================================================
-- Tracks all data imports for pipeline management

CREATE TABLE data_import_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- File information
    file_name VARCHAR(500) NOT NULL,
    file_path TEXT,
    file_hash VARCHAR(64),             -- SHA256 hash of file
    file_size_bytes BIGINT,

    -- Import details
    import_type VARCHAR(50),           -- 'companies', 'trade_records', 'products'
    source_type data_source_type,
    sheet_name VARCHAR(100),           -- For Excel files with multiple sheets

    -- Processing status
    status VARCHAR(20) DEFAULT 'pending',  -- pending, processing, completed, failed

    -- Statistics
    total_rows INTEGER,
    rows_imported INTEGER DEFAULT 0,
    rows_skipped INTEGER DEFAULT 0,
    rows_failed INTEGER DEFAULT 0,

    -- Error tracking
    errors JSONB DEFAULT '[]',         -- Array of error messages

    -- Timestamps
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE: embedding_queue
-- =============================================================================
-- Tracks progress of embedding generation for batch processing

CREATE TABLE embedding_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Target information
    table_name VARCHAR(50) NOT NULL,       -- 'companies', 'trade_records', 'products'
    record_id UUID NOT NULL,                -- ID of the record

    -- Embedding fields to generate
    embedding_field VARCHAR(100),           -- 'name_embedding', 'profile_embedding', 'product_embedding'

    -- Status
    status VARCHAR(20) DEFAULT 'pending',   -- pending, processing, completed, failed
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,

    -- Processing info
    batch_id UUID,                          -- Group related embedding jobs
    priority INTEGER DEFAULT 0,             -- Higher priority processed first

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    CONSTRAINT unique_embedding_task UNIQUE (table_name, record_id, embedding_field)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Companies indexes
CREATE INDEX idx_companies_name ON companies USING gin (name gin_trgm_ops);
CREATE INDEX idx_companies_name_normalized ON companies (name_normalized);
CREATE INDEX idx_companies_country ON companies (country);
CREATE INDEX idx_companies_iec ON companies (iec_code) WHERE iec_code IS NOT NULL;
CREATE INDEX idx_companies_entity_types ON companies USING gin (entity_types);
CREATE INDEX idx_companies_hs_codes ON companies USING gin (hs_codes_dealt);
CREATE INDEX idx_companies_location ON companies USING gist (location);
CREATE INDEX idx_companies_data_source ON companies (data_source);
CREATE INDEX idx_companies_source_file ON companies (source_file);

-- Company embedding indexes (HNSW for fast approximate search)
CREATE INDEX idx_companies_name_embedding ON companies
    USING hnsw (name_embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
CREATE INDEX idx_companies_profile_embedding ON companies
    USING hnsw (profile_embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Trade records indexes
CREATE INDEX idx_trade_records_type ON trade_records (record_type);
CREATE INDEX idx_trade_records_sb_date ON trade_records (sb_date);
CREATE INDEX idx_trade_records_hs_code ON trade_records (hs_code);
CREATE INDEX idx_trade_records_hs_chapter ON trade_records (hs_chapter);
CREATE INDEX idx_trade_records_exporter_name ON trade_records USING gin (exporter_name gin_trgm_ops);
CREATE INDEX idx_trade_records_importer_name ON trade_records USING gin (importer_name gin_trgm_ops);
CREATE INDEX idx_trade_records_supplier_name ON trade_records USING gin (supplier_name gin_trgm_ops);
CREATE INDEX idx_trade_records_consignee_name ON trade_records USING gin (consignee_name gin_trgm_ops);
CREATE INDEX idx_trade_records_product_description ON trade_records USING gin (product_description gin_trgm_ops);
CREATE INDEX idx_trade_records_item_description ON trade_records USING gin (item_description gin_trgm_ops);
CREATE INDEX idx_trade_records_origin_country ON trade_records (origin_country);
CREATE INDEX idx_trade_records_destination_country ON trade_records (destination_country);
CREATE INDEX idx_trade_records_indian_port ON trade_records (indian_port);
CREATE INDEX idx_trade_records_trade_year ON trade_records (trade_year);
CREATE INDEX idx_trade_records_exporter_id ON trade_records (exporter_id);
CREATE INDEX idx_trade_records_importer_id ON trade_records (importer_id);
CREATE INDEX idx_trade_records_supplier_id ON trade_records (supplier_id);
CREATE INDEX idx_trade_records_consignee_id ON trade_records (consignee_id);
CREATE INDEX idx_trade_records_source_file ON trade_records (source_file);

-- Trade record product embedding index
CREATE INDEX idx_trade_records_product_embedding ON trade_records
    USING hnsw (product_embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Products indexes
CREATE INDEX idx_products_name ON products USING gin (name gin_trgm_ops);
CREATE INDEX idx_products_hs_code ON products (hs_code);
CREATE INDEX idx_products_category ON products (category);
CREATE INDEX idx_products_country ON products (country);
CREATE INDEX idx_products_embedding ON products
    USING hnsw (product_embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Entities indexes
CREATE INDEX idx_entities_name ON entities USING gin (name gin_trgm_ops);
CREATE INDEX idx_entities_type ON entities (entity_type);
CREATE INDEX idx_entities_country ON entities (country);
CREATE INDEX idx_entities_tags ON entities USING gin (tags);
CREATE INDEX idx_entities_embedding ON entities
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Trade links indexes
CREATE INDEX idx_trade_links_source ON trade_links (source_company_id);
CREATE INDEX idx_trade_links_target ON trade_links (target_company_id);
CREATE INDEX idx_trade_links_type ON trade_links (link_type);
CREATE INDEX idx_trade_links_active ON trade_links (is_active);

-- Predicted partners indexes
CREATE INDEX idx_predicted_partners_company ON predicted_partners (company_id);
CREATE INDEX idx_predicted_partners_partner ON predicted_partners (partner_company_id);
CREATE INDEX idx_predicted_partners_type ON predicted_partners (prediction_type);
CREATE INDEX idx_predicted_partners_commodity ON predicted_partners (for_commodity);
CREATE INDEX idx_predicted_partners_score ON predicted_partners (probability_score DESC);

-- Data import log indexes
CREATE INDEX idx_import_log_file_hash ON data_import_log (file_hash);
CREATE INDEX idx_import_log_status ON data_import_log (status);

-- Embedding queue indexes
CREATE INDEX idx_embedding_queue_status ON embedding_queue (status);
CREATE INDEX idx_embedding_queue_priority ON embedding_queue (priority DESC, created_at);
CREATE INDEX idx_embedding_queue_batch ON embedding_queue (batch_id);

-- =============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trade_records_updated_at
    BEFORE UPDATE ON trade_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entities_updated_at
    BEFORE UPDATE ON entities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trade_links_updated_at
    BEFORE UPDATE ON trade_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Normalize company name for matching
CREATE OR REPLACE FUNCTION normalize_company_name(name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(
        TRIM(
            REGEXP_REPLACE(
                REGEXP_REPLACE(name, '\s+', ' ', 'g'),  -- Multiple spaces to single
                '(private|pvt|limited|ltd|llc|inc|corp|co\.?|company)\.?', '', 'gi'
            )
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-populate name_normalized
CREATE OR REPLACE FUNCTION set_normalized_name()
RETURNS TRIGGER AS $$
BEGIN
    NEW.name_normalized = normalize_company_name(NEW.name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_company_name_normalized
    BEFORE INSERT OR UPDATE OF name ON companies
    FOR EACH ROW EXECUTE FUNCTION set_normalized_name();

CREATE TRIGGER set_product_name_normalized
    BEFORE INSERT OR UPDATE OF name ON products
    FOR EACH ROW EXECUTE FUNCTION set_normalized_name();

-- =============================================================================
-- VIEWS
-- =============================================================================

-- View: Recent trade activity by company
CREATE VIEW company_trade_summary AS
SELECT
    c.id,
    c.name,
    c.country,
    COUNT(DISTINCT tr.id) as total_trades,
    COUNT(DISTINCT CASE WHEN tr.record_type = 'export' THEN tr.id END) as export_count,
    COUNT(DISTINCT CASE WHEN tr.record_type = 'import' THEN tr.id END) as import_count,
    SUM(tr.total_value_usd) as total_value_usd,
    array_agg(DISTINCT tr.destination_country) FILTER (WHERE tr.destination_country IS NOT NULL) as export_destinations,
    array_agg(DISTINCT tr.origin_country) FILTER (WHERE tr.origin_country IS NOT NULL) as import_origins,
    MAX(tr.sb_date) as last_trade_date
FROM companies c
LEFT JOIN trade_records tr ON tr.exporter_id = c.id OR tr.importer_id = c.id
GROUP BY c.id, c.name, c.country;

-- View: HS Code trade volumes
CREATE VIEW hs_code_volumes AS
SELECT
    hs_chapter,
    hs_code,
    COUNT(*) as trade_count,
    SUM(total_value_usd) as total_value_usd,
    SUM(quantity) as total_quantity,
    array_agg(DISTINCT origin_country) as origin_countries,
    array_agg(DISTINCT destination_country) as destination_countries
FROM trade_records
GROUP BY hs_chapter, hs_code;

-- =============================================================================
-- SAMPLE QUERIES (for reference)
-- =============================================================================

-- Find similar companies by name embedding
-- SELECT id, name, 1 - (name_embedding <=> query_embedding) as similarity
-- FROM companies
-- WHERE name_embedding IS NOT NULL
-- ORDER BY name_embedding <=> query_embedding
-- LIMIT 10;

-- Find companies within radius (using PostGIS)
-- SELECT id, name, ST_Distance(location, ST_MakePoint(lon, lat)::geography) as distance_meters
-- FROM companies
-- WHERE ST_DWithin(location, ST_MakePoint(lon, lat)::geography, 100000)  -- 100km radius
-- ORDER BY distance_meters;

-- Find trade records with extra data matching criteria
-- SELECT * FROM trade_records
-- WHERE extra->>'incoterms' = 'FOB'
-- AND trade_details->>'payment_terms' ILIKE '%LC%';

-- Get company with all its flexible data
-- SELECT
--     c.*,
--     c.contact_info->>'email' as primary_email,
--     c.address_details->>'line1' as address_line1,
--     c.extra->>'custom_field' as custom_value
-- FROM companies c
-- WHERE c.id = 'some-uuid';
