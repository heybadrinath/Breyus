-- Add AI cache tables for link predictions, trade scores, and analysis results

CREATE TABLE IF NOT EXISTS ai_cache_link_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT NOT NULL,
    commodity VARCHAR(200),
    response JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_links_key
    ON ai_cache_link_predictions (cache_key, commodity);
CREATE INDEX IF NOT EXISTS idx_ai_cache_links_expires
    ON ai_cache_link_predictions (expires_at);

CREATE TABLE IF NOT EXISTS ai_cache_trade_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_key TEXT NOT NULL,
    seller_key TEXT NOT NULL,
    commodity VARCHAR(200),
    response JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_trade_keys
    ON ai_cache_trade_scores (buyer_key, seller_key, commodity);
CREATE INDEX IF NOT EXISTS idx_ai_cache_trade_expires
    ON ai_cache_trade_scores (expires_at);

CREATE TABLE IF NOT EXISTS ai_cache_analysis_results (
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

CREATE INDEX IF NOT EXISTS idx_ai_cache_analysis_job
    ON ai_cache_analysis_results (job_id);
CREATE INDEX IF NOT EXISTS idx_ai_cache_analysis_expires
    ON ai_cache_analysis_results (expires_at);
