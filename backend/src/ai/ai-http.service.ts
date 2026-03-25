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
  CountryTradeVolume,
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
    this.aiServerUrl =
      this.configService.get<string>('AI_SERVER_URL') ||
      'http://localhost:8000';
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
        this.logger.debug(
          `AI Request: ${config.method?.toUpperCase()} ${config.url}`,
        );
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
        this.logger.debug(
          `AI Response: ${response.status} from ${response.config.url}`,
        );
        return response;
      },
      (error: AxiosError) => {
        this.logger.error(
          `AI Error: ${error.response?.status} - ${error.message}`,
        );
        return Promise.reject(error);
      },
    );

    this.logger.log(
      `AI HTTP Service initialized - Server: ${this.aiServerUrl}`,
    );
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
      if (params.country_preference)
        payload.country_preference = params.country_preference;
      if (params.port_preference)
        payload.port_preference = params.port_preference;
      if (params.price_range) payload.price_range = params.price_range;
      if (params.hs_code) payload.hs_code = params.hs_code;
      if (params.profile) payload.profile = params.profile;

      this.logger.log(
        `Predicting partners for ${params.commodity} (${params.role}) with payload: ${JSON.stringify(payload)}`,
      );
      const response = await this.client.post<AIRawLinkPredictionResponse>(
        '/v1/links/predict',
        payload,
      );

      // Transform raw AI response to expected format
      const rawData = (response.data as any)?.data || response.data;
      const transformed = this.transformLinkPredictionResponse(
        rawData,
        params.commodity,
      );
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

    const topPartners: AIPartner[] = matches.map((match) => {
      // Prefer AI probability for display (already relative across matches).
      // Fall back to gravity_score when probability is unavailable.
      const rawProbability = Number(match.probability);
      const hasProbability = Number.isFinite(rawProbability) && rawProbability > 0;

      const rawGravity = Number(match.gravity_score);
      const hasGravity = Number.isFinite(rawGravity) && rawGravity > 0;

      let matchScore = 0;
      if (hasProbability) {
        matchScore = rawProbability <= 1 ? rawProbability * 100 : rawProbability;
      } else if (hasGravity) {
        matchScore = rawGravity <= 1 ? rawGravity * 100 : rawGravity;
      }

      // Keep one decimal to avoid collapsing close scores into identical integers.
      matchScore = Math.min(100, Math.max(0, Math.round(matchScore * 10) / 10));

      return {
        id: undefined, // AI service doesn't provide IDs
        name: match.company_name || 'Unknown',
        match_score: matchScore,
        match_reason: this.buildMatchReason(match),
        commodity: match.product || commodity,
        country: match.country,
        link_type: raw.match_strategy || undefined,
        contact_info: {
          email: match.contact_email,
          phone: match.contact_phone,
          address: match.location,
        },
        // Pass through AI-provided values for risk and price fluctuation
        risk_level: match.risk_level,
        price_fluctuation: match.next_month_price_fluctuation,
      };
    });

    return {
      top_partners: topPartners,
      total_matches: matches.length,
      waterfall_stage_reached: raw.match_strategy || undefined,
      warning: raw.warning, // Pass through country filter fallback warning
    };
  }

  /**
   * Build human-readable match reason from AI match data
   */
  private buildMatchReason(match: AIRawMatch): string {
    const reasons: string[] = [];

    const rawProbability = Number(match.probability);
    if (Number.isFinite(rawProbability) && rawProbability > 0) {
      const normalizedProbability =
        rawProbability <= 1 ? rawProbability * 100 : rawProbability;
      reasons.push(
        `${Math.round(normalizedProbability * 10) / 10}% probability`,
      );
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
      const response = await this.client.post<GravityScoreRawResponse>(
        '/v1/trades/score',
        params,
      );
      return this.transformGravityScore(response.data);
    } catch (error) {
      this.handleError(error, 'Gravity score calculation');
    }
  }

  /**
   * Transform raw gravity score response to frontend format
   */
  private transformGravityScore(
    raw: GravityScoreRawResponse,
  ): GravityScoreResponse {
    const factors = raw.factors;

    // Calculate breakdown scores (normalize to 0-100)
    const breakdown = {
      volumeScore: Math.round(
        ((factors.demand + factors.trade_frequency) / 2) * 10,
      ),
      proximityScore: Math.round(
        ((factors.port_proximity + factors.source_geography) / 2) * 10,
      ),
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
    else if (factors.port_proximity <= 3)
      negative.push('Poor port accessibility');

    if (factors.trade_frequency >= 7) positive.push('Frequent trade activity');
    else if (factors.trade_frequency <= 3) negative.push('Low trade frequency');

    if (factors.weather_risk >= 7) positive.push('Low weather risk');
    else if (factors.weather_risk <= 3) negative.push('High weather risk');

    if (factors.trade_barriers >= 7) positive.push('Favorable trade policies');
    else if (factors.trade_barriers <= 3)
      negative.push('Trade barriers present');

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
   *
   * AI server returns: { statusCode, message, data: { jobId, status, ... } }
   * We need to unwrap the 'data' envelope to access the actual job data
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
      const response = await this.client.post<any>(
        '/v1/analysis/initiate',
        params,
      );

      // AI service wraps response in { statusCode, message, data: {...} }
      // We need to unwrap the 'data' property to get the actual job data
      const outerData = response.data;
      const jobData = outerData?.data || outerData;

      // Handle both camelCase and snake_case responses from AI server
      const jobId = jobData.jobId || jobData.job_id;
      const status = (jobData.status || 'ACCEPTED').toUpperCase();

      this.logger.log(`Analysis job started: ${jobId}`);

      return {
        jobId,
        status: status as 'ACCEPTED',
        commodity: jobData.commodity || params.commodity,
        hs_code: jobData.hs_code,
        initial_charts: jobData.initial_charts,
      };
    } catch (error) {
      this.handleError(error, 'Analysis initiation');
    }
  }

  /**
   * Get analysis results (poll)
   * GET /v1/analysis/results/{jobId}
   * Transforms raw AI response to frontend-expected format
   *
   * AI server returns: { statusCode, message, data: { jobId, status, result, ... } }
   * We need to unwrap the 'data' envelope to access the actual job data
   */
  async getAnalysisResults(
    jobId: string,
    commodity?: string,
    hsCode?: string,
  ): Promise<AnalysisResultResponse> {
    try {
      const response = await this.client.get<any>(
        `/v1/analysis/results/${jobId}`,
      );

      // AI service wraps response in { statusCode, message, data: {...} }
      // We need to unwrap the 'data' property to get the actual job data
      const jobData = response.data?.data || response.data;

      this.logger.debug(
        `Analysis results for ${jobId}: status=${jobData?.status}, hasResult=${!!jobData?.result}`,
      );

      return this.transformAnalysisResult(jobData, jobId, commodity, hsCode);
    } catch (error) {
      this.handleError(error, 'Analysis results');
    }
  }

  /**
   * Transform raw analysis result to frontend format
   *
   * AI Server returns result with structure:
   * {
   *   commodity, hs_code, db_stats, market_context,
   *   charts: { demand_forecast, capital_required, price_volatility },
   *   insights: { summary, key_insights, recommendations },
   *   analysis: { market_analysis, supply_chain, ground_check, futures },
   *   predictions, company_contacts
   * }
   *
   * We transform this to match the frontend's AnalysisResult interface
   */
  private transformAnalysisResult(
    raw: any,
    originalJobId: string,
    commodity?: string,
    hsCode?: string,
  ): AnalysisResultResponse {
    // Handle both camelCase and snake_case from AI server
    const jobId = raw.jobId || raw.job_id || originalJobId;

    // Normalize status to uppercase for consistent comparison
    // AI server may return lowercase ('pending', 'completed') or uppercase ('PENDING', 'COMPLETED')
    const normalizedStatus = (raw.status || 'PENDING').toUpperCase();

    // For pending/processing/failed, return status with progress indication
    if (normalizedStatus !== 'COMPLETED' || !raw.result) {
      const response: AnalysisResultResponse = {
        jobId,
        status: normalizedStatus as
          | 'PENDING'
          | 'PROCESSING'
          | 'COMPLETED'
          | 'FAILED',
        error: raw.error,
      };
      // Include progress based on status to give users feedback
      // PENDING: Job queued, waiting to start (15%)
      // PROCESSING: Job actively running (50%)
      // FAILED: Job failed (0%)
      if (normalizedStatus === 'PENDING') {
        response.progress = 15;
      } else if (normalizedStatus === 'PROCESSING') {
        response.progress = 50;
      }
      return response;
    }

    const result = raw.result;

    // Safely extract data from the new AI response structure
    const insights = result.insights || {};
    const analysis = result.analysis || {};
    const charts = result.charts || {};
    const marketAnalysis = analysis.market_analysis || {};
    const groundCheck = analysis.ground_check || {};
    const supplyChain = analysis.supply_chain || {};

    // Build summary - try new structure first, fall back to old
    let summary = insights.summary || '';
    if (!summary && result.market_overview) {
      // Fallback for old response format
      summary = [
        result.market_overview.export_side,
        result.market_overview.import_side,
      ]
        .filter(Boolean)
        .join(' ');
    }
    if (!summary) {
      // Build from market analysis sections if available
      const exportSide = marketAnalysis.export_side?.summary || '';
      const importSide = marketAnalysis.import_side?.summary || '';
      summary =
        [exportSide, importSide].filter(Boolean).join(' ') ||
        'Market analysis completed.';
    }

    // Build price trends from charts or predictions
    const priceTrends = this.buildPriceTrends(
      charts,
      result.predictions,
      result.price_predictions,
    );

    // Extract risk factors from ground_check
    const riskFactors: string[] = [];
    if (groundCheck.weather_storage?.summary) {
      riskFactors.push(groundCheck.weather_storage.summary);
    }
    if (groundCheck.market_barriers?.summary) {
      riskFactors.push(groundCheck.market_barriers.summary);
    }
    // Fallback for old format
    if (riskFactors.length === 0 && result.ground_check) {
      if (
        result.ground_check.weather_risk &&
        result.ground_check.weather_risk !== 'Low'
      ) {
        riskFactors.push(`Weather Risk: ${result.ground_check.weather_risk}`);
      }
      if (
        result.ground_check.barriers &&
        result.ground_check.barriers !== 'None'
      ) {
        riskFactors.push(`Trade Barriers: ${result.ground_check.barriers}`);
      }
    }

    // Extract opportunities from insights or supply chain
    let opportunities: string[] = insights.recommendations || [];
    if (opportunities.length === 0 && insights.key_insights) {
      opportunities = insights.key_insights.filter(
        (insight: string) =>
          !insight.toLowerCase().includes('risk') &&
          !insight.toLowerCase().includes('barrier'),
      );
    }
    // Fallback for old format
    if (opportunities.length === 0 && result.supply_chain_insights) {
      opportunities = result.supply_chain_insights.filter(
        (insight: string) =>
          !insight.toLowerCase().includes('risk') &&
          !insight.toLowerCase().includes('barrier'),
      );
    }

    // Determine demand forecast
    const tradeFrequency =
      groundCheck.trade_frequency?.summary ||
      result.ground_check?.frequency ||
      '';
    let demandDirection: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (
      tradeFrequency.toLowerCase().includes('high') ||
      tradeFrequency.toLowerCase().includes('increas')
    ) {
      demandDirection = 'increasing';
    } else if (
      tradeFrequency.toLowerCase().includes('low') ||
      tradeFrequency.toLowerCase().includes('decreas')
    ) {
      demandDirection = 'decreasing';
    }

    // Extract top exporters and importers
    const topExporters = this.extractTopTraders(
      result.db_stats?.top_exporters ||
        charts.demand_forecast?.top_exporters ||
        result.company_contacts?.filter((c: any) => c.role === 'exporter'),
      'exporter',
    );

    const topImporters = this.extractTopTraders(
      result.db_stats?.top_importers ||
        charts.demand_forecast?.top_importers ||
        result.company_contacts?.filter((c: any) => c.role === 'importer'),
      'importer',
    );

    // Extract seasonality patterns
    const seasonality = this.extractSeasonality(
      result.predictions?.seasonality ||
        analysis.market_analysis?.seasonality ||
        charts.demand_forecast?.seasonality,
    );

    // Extract chart data for frontend visualization
    // Pass chart type to handle AI server's specific response structures
    const chartData = {
      demandForecast: this.extractChartData(charts.demand_forecast, 'demand'),
      capitalRequired: this.extractChartData(charts.capital_required, 'capital'),
      priceVolatility: this.extractChartData(charts.price_volatility, 'price'),
    };

    // Extract key insights for display
    const keyInsights = insights.key_insights || [];

    this.logger.log(
      `Analysis transformed successfully for ${commodity || result.commodity}`,
    );

    return {
      jobId,
      status: 'COMPLETED',
      progress: 100,
      result: {
        commodity: commodity || result.commodity || 'Unknown',
        hsCode: hsCode || result.hs_code,
        summary,
        priceTrends,
        topExporters,
        topImporters,
        seasonality,
        riskFactors,
        opportunities,
        demandForecast: {
          direction: demandDirection,
          confidence: 75,
          explanation: tradeFrequency || 'Based on market analysis',
        },
        // Additional data for enhanced UI
        chartData,
        keyInsights,
      },
    };
  }

  /**
   * Extract top traders (exporters or importers) from various data sources
   */
  private extractTopTraders(
    data: any,
    role: 'exporter' | 'importer',
  ): CountryTradeVolume[] {
    if (!data) return [];

    // Handle array of country strings (from initial_charts)
    if (Array.isArray(data) && typeof data[0] === 'string') {
      return data.slice(0, 5).map((country: string, idx: number) => ({
        country,
        volume: Math.round(10000 / (idx + 1)), // Descending volume placeholder
        percentage: Math.round(100 / (idx + 1)),
      }));
    }

    // Handle array of objects with country data
    if (Array.isArray(data) && typeof data[0] === 'object') {
      const totalVolume = data.reduce(
        (sum: number, item: any) => sum + (item.volume || item.trade_volume || 0),
        0,
      );
      return data.slice(0, 5).map((item: any) => ({
        country: item.country || item.name || 'Unknown',
        volume: item.volume || item.trade_volume || 0,
        percentage:
          totalVolume > 0
            ? Math.round(((item.volume || item.trade_volume || 0) / totalVolume) * 100)
            : 0,
      }));
    }

    return [];
  }

  /**
   * Extract seasonality patterns from analysis data
   */
  private extractSeasonality(data: any): { peakMonths: string[]; lowMonths: string[] } | undefined {
    if (!data) return undefined;

    // Handle object format
    if (data.peak_months || data.peakMonths || data.low_months || data.lowMonths) {
      return {
        peakMonths: data.peak_months || data.peakMonths || [],
        lowMonths: data.low_months || data.lowMonths || [],
      };
    }

    // Handle string description format - parse months
    if (typeof data === 'string') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const peakMonths: string[] = [];
      const lowMonths: string[] = [];

      const lowerData = data.toLowerCase();
      if (lowerData.includes('peak') || lowerData.includes('high')) {
        months.forEach((m) => {
          if (lowerData.includes(m.toLowerCase())) {
            peakMonths.push(m);
          }
        });
      }

      return peakMonths.length > 0 ? { peakMonths, lowMonths } : undefined;
    }

    return undefined;
  }

  /**
   * Extract chart data for frontend visualization
   * Returns empty structure if no valid data found (no placeholder data)
   *
   * Handles AI server's chart structures:
   * - demand_forecast: { countries, current_demand, forecast_3m, ... }
   * - capital_required: { timeline, historical, projected }
   * - price_volatility: { timeline, prices, volatility_percent }
   */
  private extractChartData(
    chart: any,
    chartType?: 'demand' | 'capital' | 'price',
  ): { labels: string[]; data: number[] } {
    // Return empty structure if no chart data
    if (!chart) return { labels: [], data: [] };

    // Handle AI server's specific chart structures based on type
    if (chartType) {
      switch (chartType) {
        case 'demand':
          // demand_forecast: countries + current_demand
          if (chart.countries && chart.current_demand) {
            return {
              labels: Array.isArray(chart.countries) ? chart.countries : [],
              data: Array.isArray(chart.current_demand) ? chart.current_demand : [],
            };
          }
          break;

        case 'capital':
          // capital_required: timeline + historical
          if (chart.timeline && chart.historical) {
            return {
              labels: Array.isArray(chart.timeline) ? chart.timeline : [],
              data: Array.isArray(chart.historical) ? chart.historical : [],
            };
          }
          break;

        case 'price':
          // price_volatility: timeline + prices
          if (chart.timeline && chart.prices) {
            return {
              labels: Array.isArray(chart.timeline) ? chart.timeline : [],
              data: Array.isArray(chart.prices) ? chart.prices : [],
            };
          }
          break;
      }
    }

    // Handle standard chart format (fallback)
    if (chart.labels && chart.data) {
      return {
        labels: Array.isArray(chart.labels) ? chart.labels : [],
        data: Array.isArray(chart.data) ? chart.data : [],
      };
    }

    // Handle data array with month/value pairs
    if (Array.isArray(chart.data) && chart.data.length > 0) {
      const labels = chart.data.map((d: any) => d.month || d.label || '');
      const data = chart.data.map((d: any) => d.value || d.price || d.amount || 0);
      return { labels, data };
    }

    // Return empty structure - no placeholder data
    return { labels: [], data: [] };
  }

  /**
   * Build price trends from various possible data sources
   */
  private buildPriceTrends(
    charts: any,
    predictions: any,
    oldPricePredictions: any,
  ): any[] {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const currentMonth = new Date().toLocaleString('default', {
      month: 'short',
    });
    const currentMonthIndex = months.indexOf(currentMonth.slice(0, 3));

    // Try to use price volatility chart data if available
    if (charts.price_volatility?.data) {
      const volatilityData = charts.price_volatility.data;
      if (Array.isArray(volatilityData) && volatilityData.length > 0) {
        return volatilityData.slice(-6).map((item: any, idx: number) => ({
          month: item.month || months[(currentMonthIndex - 5 + idx + 12) % 12],
          avgPrice: item.price || item.avg || 0,
          minPrice: item.min || Math.round((item.price || item.avg || 0) * 0.9),
          maxPrice: item.max || Math.round((item.price || item.avg || 0) * 1.1),
        }));
      }
    }

    // Try to use predictions if available
    if (predictions?.price_forecast) {
      const forecast = predictions.price_forecast;
      return months
        .slice(Math.max(0, currentMonthIndex - 5), currentMonthIndex + 1)
        .map((month, idx) => ({
          month,
          avgPrice: forecast.avg || forecast.predicted || 1000,
          minPrice: forecast.min || Math.round((forecast.avg || 1000) * 0.9),
          maxPrice: forecast.max || Math.round((forecast.avg || 1000) * 1.1),
        }));
    }

    // Fallback to old format price_predictions (only if valid data exists)
    if (oldPricePredictions && oldPricePredictions.avg) {
      return months
        .slice(Math.max(0, currentMonthIndex - 5), currentMonthIndex + 1)
        .map((month, idx) => {
          const variance = 0.1 * (idx + 1);
          return {
            month,
            avgPrice: Math.round(
              oldPricePredictions.avg * (1 + variance * 0.1),
            ),
            minPrice: Math.round(
              oldPricePredictions.min * (1 + variance * 0.05),
            ),
            maxPrice: Math.round(
              oldPricePredictions.max * (1 + variance * 0.15),
            ),
          };
        });
    }

    // No data available - return empty array (no placeholder/dummy data)
    return [];
  }

  /**
   * Search niche commodities
   * POST /v1/commodities/search-niche
   *
   * @deprecated This method is no longer used. All commodity search is now done
   * through MongoDB categories only. Use CategoriesService.getCategoriesGroupedByClassification()
   * instead. This method now returns empty results.
   */
  async searchNicheCommodities(
    query: string,
    limit: number = 20,
  ): Promise<NicheSearchResponse> {
    this.logger.warn(
      'searchNicheCommodities is deprecated. Use MongoDB categories instead.',
    );
    return { results: [], total: 0 };
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
