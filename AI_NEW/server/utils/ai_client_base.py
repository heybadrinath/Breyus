"""
Abstract Base Class for AI Clients

Defines the interface that all AI providers must implement.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any


class AIClientBase(ABC):
    """Abstract base class for AI client implementations."""

    @abstractmethod
    async def analyze_market(
        self,
        commodity: str,
        historical_prices: List[float],
        historical_volumes: List[float],
        top_countries: List[Dict[str, Any]],
        context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Generate market analysis using AI.

        Args:
            commodity: Commodity name
            historical_prices: List of historical prices
            historical_volumes: List of historical volumes
            top_countries: List of top trading countries with data
            context: Additional market context (buyer/seller countries, port, price range)

        Returns:
            Dict with:
                - summary: Market overview (str)
                - key_insights: List of insights (List[str])
                - weather_impact: Weather description (str)
                - recommendations: List of recommendations (List[str])
                - demand_forecast: Country demand predictions (List[Dict] or Dict)
                - price_forecast: Price predictions (Dict)
        """
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        """Return the name of the AI provider (e.g., 'claude', 'gemini')."""
        pass

    def _build_market_analysis_prompt(
        self,
        commodity: str,
        prices: List[float],
        volumes: List[float],
        countries: List[Dict[str, Any]],
        context: Dict[str, Any],
    ) -> str:
        """
        Build standardized prompt for market analysis.

        This method can be shared across providers or overridden.
        """
        avg_price = sum(prices) / len(prices) if prices else 0.0
        
        buyer_country = context.get("buyer_country", "Unknown")
        seller_country = context.get("seller_country", "Unknown")
        port = context.get("port", "Unknown")
        role = context.get("role", "seller")
        db_stats = context.get("db_stats") or {}
        db_notes = context.get("db_notes")
        db_stat_lines = []
        for key, value in db_stats.items():
            if value is None or value == "":
                continue
            db_stat_lines.append(f"- {key}: {value}")
        db_stats_block = "\n".join(db_stat_lines) if db_stat_lines else "- none"
        db_notes_block = db_notes if db_notes else "none"
        country_names = [
            c.get("country")
            for c in (countries or [])
            if isinstance(c, dict) and c.get("country")
        ]
        countries_block = ", ".join(country_names) if country_names else "none"
        
        # Determine strict role string
        user_role = str(role).lower() if role else "seller"
        if user_role not in ("buyer", "seller"):
            user_role = "seller"

        prompt = f"""You are an expert commodity trader assistant specializing in {commodity}.
Your task is to provide a detailed market analysis for a {user_role} looking to trade {commodity} between {seller_country} (Export) and {buyer_country} (Import).

**Context Data:**
- Commodity: {commodity}
- Role: {user_role.capitalize()}
- Source (Export): {seller_country}
- Destination (Import): {buyer_country}
- Current Avg Price: ${avg_price:.2f}
- Closest Port Pair: {port} (if applicable)
- Internal DB Stats (weak signals; do not overfit):
{db_stats_block}
- DB Notes: {db_notes_block}
- Top countries by volume (use exact names for demand_forecast): {countries_block}

**Requirements:**
Provide a detailed analysis in strictly valid JSON format. Do not use Markdown notation like ```json ... ```, just return the raw JSON.
Output fields in the order shown below.
The JSON must have the following structure:

{{
  "demand_forecast": [
     {{ "country": "CountryName1", "month3": 10.5, "month6": 12.0, "month9": 14.0 }},
     {{ "country": "CountryName2", "month3": 5.0, "month6": 5.5, "month9": 6.0 }}
  ],
  "price_forecast": {{
     "month3": 4.5,
     "month6": 4.8,
     "month9": 5.2
  }},
  "market": {{
    "export_side": {{
      "general_info": "Biggest suppliers worldwide...",
      "choice": "Your source is {seller_country}...",
      "suggestion": "Suggestion based on {seller_country}'s detailed situation (weather, costs, competition)..."
    }},
    "import_side": {{
      "general_info": "Strongest demand hubs globally...",
      "choice": "Your destination is {buyer_country}...",
      "suggestion": "Suggestion based on {buyer_country}'s demand (seasonality, trends)..."
    }},
    "price_range": {{
      "general_info": "Global trading range for {commodity}...",
      "choice": "{seller_country} -> {buyer_country} trend...",
      "suggestion": "Current price trend analysis..."
    }}
  }},
  "supply_chain": {{
    "ports_movement": {{
      "general_info": "Major ports handling {commodity}...",
      "choice": "Route is...",
      "suggestion": "Port efficiency and logistics suggestion..."
    }},
    "transport_costs": {{
      "general_info": "Average freight...",
      "choice": "{seller_country} -> {buyer_country}...",
      "suggestion": "Freight cost analysis and advice..."
    }},
    "financing_support": {{
      "general_info": "Banks favor {commodity} trades...",
      "choice": "{seller_country} -> {buyer_country}...",
      "suggestion": "Financing availability and terms advice..."
    }}
  }},
  "ground_check": {{
    "weather_storage": {{
      "general_info": "{commodity} is sensitive to...",
      "choice": "{seller_country} -> {buyer_country}...",
      "suggestion": "Weather and storage risk analysis..."
    }},
    "market_barriers": {{
      "general_info": "Trade rules...",
      "choice": "{seller_country} -> {buyer_country}...",
      "suggestion": "Barriers and regulation advice..."
    }},
    "trade_frequency": {{
      "general_info": "Trades year-round...",
      "choice": "{seller_country} -> {buyer_country}...",
      "suggestion": "Trade frequency analysis..."
    }}
  }},
  "futures": {{
    "open_interest": "High/Low description...",
    "contract_price": "Approximate futures price...",
    "volatility": "Current volatility status...",
    "prediction": "Volatility prediction for next month..."
  }},
  "summary": "Executive summary of the trade opportunity...",
  "recommendations": ["Rec 1", "Rec 2"]
}}

Fill in the fields with realistic, high-quality, professional trading insights based on the {commodity} market and the specific route ({seller_country} -> {buyer_country}).
Use specific reasons (e.g., weather, regulations, seasonal demand) in your 'suggestion' fields.
Use internal DB stats only as supporting evidence; do not let them dominate the analysis.
Demand forecast values must be 0-100 index values (100 = highest among listed countries).
Each string must be <= 10 words; fragments are OK; avoid commas when possible.
"""
        return prompt

    def _get_fallback_analysis(self, commodity: str) -> Dict[str, Any]:
        """
        Return fallback analysis if AI API fails.

        This provides a graceful degradation.
        """
        return {
            "market": {
                "export_side": {"general_info": "N/A", "choice": "N/A", "suggestion": "N/A"},
                "import_side": {"general_info": "N/A", "choice": "N/A", "suggestion": "N/A"},
                "price_range": {"general_info": "N/A", "choice": "N/A", "suggestion": "N/A"},
            },
            "supply_chain": {
                "ports_movement": {"general_info": "N/A", "choice": "N/A", "suggestion": "N/A"},
                "transport_costs": {"general_info": "N/A", "choice": "N/A", "suggestion": "N/A"},
                "financing_support": {"general_info": "N/A", "choice": "N/A", "suggestion": "N/A"},
            },
            "ground_check": {
                "weather_storage": {"general_info": "N/A", "choice": "N/A", "suggestion": "N/A"},
                "market_barriers": {"general_info": "N/A", "choice": "N/A", "suggestion": "N/A"},
                "trade_frequency": {"general_info": "N/A", "choice": "N/A", "suggestion": "N/A"},
            },
            "futures": {
                "open_interest": "N/A", "contract_price": "N/A", "volatility": "N/A", "prediction": "N/A"
            },
            "summary": f"Analysis unavailable for {commodity}. Please try again later.",
            "recommendations": []
        }
