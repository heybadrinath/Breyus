import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  AIPartner,
  AIRawMatch,
  AIRawLinkPredictionResponse,
  LinkPredictionResponse,
  GravityScoreResponse,
  GravityScoreRawResponse,
  GravityScoreFactors,
  AnalysisInitiateResponse,
  AnalysisResultResponse,
  AnalysisRawResultResponse,
  MarketAnalysisRawResult,
  NicheSearchResponse,
  AIHealthResponse,
} from './interfaces';

/**
 * AI HTTP Service
 * Handles all HTTP communication with the AI_NEW FastAPI server
 */
@Injectable()
export class AIHttpService {
  private readonly logger = new Logger(AIHttpService.name);
  private readonly client: AxiosInstance;
  private readonly aiServerUrl: string;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.aiServerUrl = this.configService.get<string>('AI_SERVER_URL') || 'http://localhost:8000';
    this.apiKey = this.configService.get<string>('AI_API_KEY') || '';

    this.client = axios.create({
      baseURL: this.aiServerUrl,
      timeout: 60000, // 60 second timeout for AI operations
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug(`AI Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('AI Request Error:', error);
        return Promise.reject(error);
      },
    );

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(`AI Response: ${response.status} from ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        this.logger.error(`AI Error: ${error.response?.status} - ${error.message}`);
        return Promise.reject(error);
      },
    );

    this.logger.log(`AI HTTP Service initialized - Server: ${this.aiServerUrl}`);
  }

  /**
   * Health check for AI server
   */
  async checkHealth(): Promise<AIHealthResponse> {
    try {
      const response = await this.client.get<AIHealthResponse>('/health');
      return response.data;
    } catch (error) {
      this.handleError(error, 'Health check');
    }
  }

  /**
   * Predict trade partners (link prediction)
   * POST /v1/links/predict
   */
  async predictPartners(params: {
    commodity: string;
    role: 'buyer' | 'seller';
    buyer_id?: string;
    buyer_name?: string;
    seller_id?: string;
    seller_name?: string;
    country_preference?: string;
    port_preference?: string;
    price_range?: { min: number; max: number };
    hs_code?: string;
    top_k?: number;
    profile?: {
      country?: string;
      location?: { lat: number; lon: number };
      mean_monthly_revenue?: any;
      payment_terms?: any;
    };
  }): Promise<LinkPredictionResponse> {
    try {
      // Build payload and filter out undefined values to avoid serialization issues
      const payload: Record<string, any> = {
        commodity: params.commodity,
        role: params.role,
        top_k: params.top_k || 20,
      };

      // Add optional fields only if they have values
      if (params.buyer_id) payload.buyer_id = params.buyer_id;
      if (params.buyer_name) payload.buyer_name = params.buyer_name;
      if (params.seller_id) payload.seller_id = params.seller_id;
      if (params.seller_name) payload.seller_name = params.seller_name;
      if (params.country_preference) payload.country_preference = params.country_preference;
      if (params.port_preference) payload.port_preference = params.port_preference;
      if (params.price_range) payload.price_range = params.price_range;
      if (params.hs_code) payload.hs_code = params.hs_code;
      if (params.profile) payload.profile = params.profile;

      this.logger.log(`Predicting partners for ${params.commodity} (${params.role}) with payload: ${JSON.stringify(payload)}`);
      const response = await this.client.post<AIRawLinkPredictionResponse>('/v1/links/predict', payload);

      // Transform raw AI response to expected format
      const transformed = this.transformLinkPredictionResponse(response.data, params.commodity);
      this.logger.log(`Found ${transformed.total_matches} potential partners`);
      return transformed;
    } catch (error) {
      this.handleError(error, 'Link prediction');
    }
  }

  /**
   * Raw response format from AI service
   */
  private transformLinkPredictionResponse(
    raw: AIRawLinkPredictionResponse,
    commodity: string,
  ): LinkPredictionResponse {
    const matches = raw.matches || [];

    const topPartners: AIPartner[] = matches.map((match) => ({
      id: undefined, // AI service doesn't provide IDs
      name: match.company_name || 'Unknown',
      match_score: match.gravity_score || match.probability || 0,
      match_reason: this.buildMatchReason(match),
      commodity: match.product || commodity,
      country: match.country,
      link_type: raw.match_strategy || undefined,
      contact_info: {
        email: match.contact_email,
        phone: match.contact_phone,
        address: match.location,
      },
    }));

    return {
      top_partners: topPartners,
      total_matches: matches.length,
      waterfall_stage_reached: raw.match_strategy || undefined,
    };
  }

  /**
   * Build human-readable match reason from AI match data
   */
  private buildMatchReason(match: AIRawMatch): string {
    const reasons: string[] = [];

    if (match.probability) {
      reasons.push(`${match.probability}% probability`);
    }
    if (match.risk_level) {
      reasons.push(`${match.risk_level} risk`);
    }
    if (match.country) {
      reasons.push(`Located in ${match.country}`);
    }
    if (match.next_month_price_fluctuation) {
      reasons.push(`Price trend: ${match.next_month_price_fluctuation}`);
    }

    return reasons.length > 0 ? reasons.join('. ') : 'AI-matched partner';
  }

  /**
   * Calculate gravity score for a trade
   * POST /v1/trades/score
   * Transforms raw AI response to frontend-expected format
   */
  async calculateGravityScore(params: {
    commodity: string;
    hs_code?: string;
    buyer_id?: string;
    buyer_name?: string;
    seller_id?: string;
    seller_name?: string;
    buyer_country?: string;
    seller_country?: string;
    buyer_port?: string;
    price_range?: { min: number; max: number };
    role?: 'buyer' | 'seller';
    profile?: {
      country?: string;
      location?: { lat: number; lon: number };
      mean_monthly_revenue?: any;
      payment_terms?: any;
    };
  }): Promise<GravityScoreResponse> {
    try {
      const response = await this.client.post<GravityScoreRawResponse>('/v1/trades/score', params);
      return this.transformGravityScore(response.data);
    } catch (error) {
      this.handleError(error, 'Gravity score calculation');
    }
  }

  /**
   * Transform raw gravity score response to frontend format
   */
  private transformGravityScore(raw: GravityScoreRawResponse): GravityScoreResponse {
    const factors = raw.factors;

    // Calculate breakdown scores (normalize to 0-100)
    const breakdown = {
      volumeScore: Math.round((factors.demand + factors.trade_frequency) / 2 * 10),
      proximityScore: Math.round((factors.port_proximity + factors.source_geography) / 2 * 10),
      priceScore: Math.round(factors.price_range * 10),
      historyScore: Math.round(factors.trade_frequency * 10),
      demandScore: Math.round(factors.demand * 10),
    };

    // Determine recommendation based on score
    const score = raw.score_value;
    let recommendation: GravityScoreResponse['recommendation'];
    if (score >= 80) recommendation = 'highly_recommended';
    else if (score >= 60) recommendation = 'recommended';
    else if (score >= 40) recommendation = 'neutral';
    else if (score >= 20) recommendation = 'caution';
    else recommendation = 'not_recommended';

    // Build positive/negative factors
    const positive: string[] = [];
    const negative: string[] = [];

    if (factors.demand >= 7) positive.push('High market demand');
    else if (factors.demand <= 3) negative.push('Low market demand');

    if (factors.port_proximity >= 7) positive.push('Good port accessibility');
    else if (factors.port_proximity <= 3) negative.push('Poor port accessibility');

    if (factors.trade_frequency >= 7) positive.push('Frequent trade activity');
    else if (factors.trade_frequency <= 3) negative.push('Low trade frequency');

    if (factors.weather_risk >= 7) positive.push('Low weather risk');
    else if (factors.weather_risk <= 3) negative.push('High weather risk');

    if (factors.trade_barriers >= 7) positive.push('Favorable trade policies');
    else if (factors.trade_barriers <= 3) negative.push('Trade barriers present');

    if (factors.volatility >= 7) positive.push('Stable price environment');
    else if (factors.volatility <= 3) negative.push('High price volatility');

    return {
      gravityScore: Math.round(raw.score_value),
      confidence: raw.confidence,
      breakdown,
      recommendation,
      factors: { positive, negative },
    };
  }

  /**
   * Initiate market analysis (async)
   * POST /v1/analysis/initiate
   */
  async initiateAnalysis(params: {
    commodity: string;
    hs_code?: string;
    destination_country?: string;
    source_country?: string;
    role?: 'buyer' | 'seller' | 'supplier';
    market_context?: {
      buyer_country?: string;
      seller_country?: string;
      port?: string;
      price_range?: { min: number; max: number };
    };
  }): Promise<AnalysisInitiateResponse> {
    try {
      this.logger.log(`Initiating market analysis for ${params.commodity}`);
      const response = await this.client.post<AnalysisInitiateResponse>('/v1/analysis/initiate', params);

      this.logger.log(`Analysis job started: ${response.data.jobId}`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Analysis initiation');
    }
  }

  /**
   * Get analysis results (poll)
   * GET /v1/analysis/results/{jobId}
   * Transforms raw AI response to frontend-expected format
   */
  async getAnalysisResults(jobId: string, commodity?: string, hsCode?: string): Promise<AnalysisResultResponse> {
    try {
      const response = await this.client.get<AnalysisRawResultResponse>(`/v1/analysis/results/${jobId}`);
      return this.transformAnalysisResult(response.data, commodity, hsCode);
    } catch (error) {
      this.handleError(error, 'Analysis results');
    }
  }

  /**
   * Transform raw analysis result to frontend format
   */
  private transformAnalysisResult(
    raw: AnalysisRawResultResponse,
    commodity?: string,
    hsCode?: string,
  ): AnalysisResultResponse {
    // For pending/processing, just pass through status
    // Don't send progress for PENDING - let frontend use estimated progress
    // Only send progress for PROCESSING (50%) to indicate job is being worked on
    if (raw.status !== 'COMPLETED' || !raw.result) {
      const response: AnalysisResultResponse = {
        jobId: raw.jobId,
        status: raw.status,
        error: raw.error,
      };
      // Only include progress when job is actively being processed
      if (raw.status === 'PROCESSING') {
        response.progress = 50;
      }
      return response;
    }

    const result = raw.result;

    // Build summary from market overview
    const summary = [
      result.market_overview.export_side,
      result.market_overview.import_side,
    ].filter(Boolean).join(' ');

    // Transform price predictions to price trends (mock monthly data from min/avg/max)
    const currentMonth = new Date().toLocaleString('default', { month: 'short' });
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIndex = months.indexOf(currentMonth.slice(0, 3));

    const priceTrends = months.slice(Math.max(0, currentMonthIndex - 5), currentMonthIndex + 1).map((month, idx) => {
      const variance = 0.1 * (idx + 1); // Simulate price change over time
      return {
        month,
        avgPrice: Math.round(result.price_predictions.avg * (1 + variance * 0.1)),
        minPrice: Math.round(result.price_predictions.min * (1 + variance * 0.05)),
        maxPrice: Math.round(result.price_predictions.max * (1 + variance * 0.15)),
      };
    });

    // Extract risk factors from ground_check
    const riskFactors: string[] = [];
    if (result.ground_check.weather_risk && result.ground_check.weather_risk !== 'Low') {
      riskFactors.push(`Weather Risk: ${result.ground_check.weather_risk}`);
    }
    if (result.ground_check.barriers && result.ground_check.barriers !== 'None') {
      riskFactors.push(`Trade Barriers: ${result.ground_check.barriers}`);
    }

    // Extract opportunities from supply chain insights
    const opportunities = result.supply_chain_insights.filter(
      insight => !insight.toLowerCase().includes('risk') && !insight.toLowerCase().includes('barrier'),
    );

    return {
      jobId: raw.jobId,
      status: 'COMPLETED',
      progress: 100,
      result: {
        commodity: commodity || 'Unknown',
        hsCode,
        summary,
        priceTrends,
        riskFactors,
        opportunities,
        demandForecast: {
          direction: result.ground_check.frequency?.toLowerCase().includes('high') ? 'increasing' : 'stable',
          confidence: 75,
          explanation: `Based on trade frequency: ${result.ground_check.frequency}`,
        },
      },
    };
  }

  /**
   * Search niche commodities
   * POST /v1/commodities/search-niche
   */
  async searchNicheCommodities(query: string, limit: number = 20): Promise<NicheSearchResponse> {
    try {
      // AI service wraps response in { statusCode, message, data: {...} }
      // We need to unwrap the 'data' property to get the actual results
      const response = await this.client.post<{ statusCode: number; message: string; data: NicheSearchResponse }>('/v1/commodities/search-niche', {
        commodity: query,
        limit,
      });
      // Extract the inner data object which contains 'results'
      const innerData = response.data?.data || { results: [], total: 0 };
      return {
        results: innerData.results || [],
        total: innerData.total || innerData.results?.length || 0,
      };
    } catch (error) {
      // If niche search fails, return empty results (non-critical)
      this.logger.warn(`Niche search failed for "${query}": ${error.message}`);
      return { results: [], total: 0 };
    }
  }

  /**
   * Handle errors from AI server
   */
  private handleError(error: any, operation: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        // Server responded with error
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        const message = data?.detail || data?.message || axiosError.message;

        this.logger.error(`${operation} failed: ${status} - ${message}`);

        if (status === 503) {
          throw new HttpException(
            'AI service is temporarily unavailable. Please try again later.',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }

        throw new HttpException(
          `AI ${operation} failed: ${message}`,
          status >= 500 ? HttpStatus.BAD_GATEWAY : status,
        );
      } else if (axiosError.request) {
        // No response received
        this.logger.error(`${operation} failed: No response from AI server`);
        throw new HttpException(
          'AI service is not responding. Please try again later.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
    }

    // Unknown error
    this.logger.error(`${operation} failed:`, error);
    throw new HttpException(
      `AI ${operation} failed unexpectedly`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
