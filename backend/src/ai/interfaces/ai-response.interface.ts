/**
 * AI Server Response Interfaces
 * These match the responses from the AI_NEW FastAPI server
 */

// ============================================
// Raw AI Service Response (actual format from FastAPI)
// ============================================

export interface AIRawMatch {
  company_name: string;
  country?: string;
  location?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_website?: string;
  product?: string;
  probability?: number;
  next_month_price_fluctuation?: string;
  risk_level?: string;
  gravity_score?: number;
  sources?: string[];
}

export interface AIRawLinkPredictionResponse {
  matches: AIRawMatch[];
  match_strategy?: string;
  legacy?: {
    found: boolean;
    predicted_partner?: string;
    distance_km?: number;
    confidence?: number;
    method?: string;
  };
}

// ============================================
// Link Prediction Response (transformed for backend use)
// ============================================

export interface AIPartner {
  id?: string;
  name: string;
  match_score: number;
  match_reason: string;
  commodity: string;
  country?: string;
  link_type?: string;
  contact_info?: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

export interface LinkPredictionResponse {
  top_partners: AIPartner[];
  total_matches: number;
  waterfall_stage_reached?: string;
}

// ============================================
// Gravity Score Response (Raw from AI server)
// ============================================

export interface GravityScoreFactors {
  demand: number;
  source_geography: number;
  port_proximity: number;
  transport_cost: number;
  capital: number;
  financing: number;
  price_range: number;
  weather_risk: number;
  volatility: number;
  trade_barriers: number;
  trade_frequency: number;
}

export interface GravityScoreRawResponse {
  score_value: number;
  factors: GravityScoreFactors;
  confidence: number;
}

// ============================================
// Gravity Score Response (Transformed for Frontend)
// ============================================

export interface GravityScoreResponse {
  gravityScore: number;
  confidence: number;
  breakdown: {
    volumeScore: number;
    proximityScore: number;
    priceScore: number;
    historyScore: number;
    demandScore: number;
  };
  recommendation: 'highly_recommended' | 'recommended' | 'neutral' | 'caution' | 'not_recommended';
  factors: {
    positive: string[];
    negative: string[];
  };
}

// ============================================
// Market Analysis Response (Raw from AI server)
// ============================================

export interface AnalysisInitiateResponse {
  jobId: string;
  status: 'ACCEPTED';
  commodity: string;
  hs_code?: string;
  initial_charts?: {
    price_trend: {
      labels: string[];
      prices: number[];
    };
    top_exporters: string[];
    top_importers: string[];
  };
}

export interface MarketAnalysisRawResult {
  market_overview: {
    export_side: string;
    import_side: string;
  };
  supply_chain_insights: string[];
  ground_check: {
    weather_risk: string;
    barriers: string;
    frequency: string;
  };
  price_predictions: {
    min: number;
    avg: number;
    max: number;
  };
  recommendations: string[];
}

export interface AnalysisRawResultResponse {
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  result?: MarketAnalysisRawResult;
  error?: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// Market Analysis Response (Transformed for Frontend)
// ============================================

export interface PriceTrendData {
  month: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
}

export interface CountryTradeVolume {
  country: string;
  volume: number;
  percentage: number;
}

export interface AnalysisResult {
  commodity: string;
  hsCode?: string;
  summary: string;
  priceTrends?: PriceTrendData[];
  topExporters?: CountryTradeVolume[];
  topImporters?: CountryTradeVolume[];
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
}

export interface AnalysisResultResponse {
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress?: number;
  result?: AnalysisResult;
  error?: string;
}

// ============================================
// Niche Search Response
// ============================================

export interface NicheSearchResult {
  name: string;
  hs_code?: string;
  description?: string;
  category?: string;
  source: 'ai';
}

export interface NicheSearchResponse {
  results: NicheSearchResult[];
  total: number;
}

// ============================================
// Health Check Response
// ============================================

export interface AIHealthResponse {
  status: string;
  timestamp: string;
  uptime_seconds?: number;
  services?: {
    database: string;
    redis: string;
    embedding_model: string;
  };
}
