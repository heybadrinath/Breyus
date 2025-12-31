
import asyncio
import logging
import sys
import os
from unittest.mock import MagicMock, AsyncMock

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

# Mock anthropic module before import
sys.modules["anthropic"] = MagicMock()

from server.services.market_analyzer import MarketAnalyzer
from server.utils.ai_factory import AIClientFactory

# Setup mock logging
logging.basicConfig(level=logging.INFO)

async def main():
    print("Starting verification...")

    # Mock DB and Redis
    mock_db = AsyncMock()
    mock_db.fetch.return_value = []
    mock_db.fetchrow.return_value = {"cnt": 100}

    mock_redis = MagicMock()

    # Mock AI Client
    mock_ai_client = AsyncMock()
    mock_ai_client.analyze_market.return_value = {
        "market": {
            "export_side": {
                "general_info": "Vietnam is the world's second-largest coffee producer, specifically for Robusta beans.",
                "choice": "Your source is Vietnam, which offers a competitive price advantage for Robusta blends.",
                "suggestion": "Focus on high-grade Robusta for espresso blends to maximize margin."
            },
            "import_side": {
                "general_info": "Germany is the largest coffee importer in Europe with a strong processing industry.",
                "choice": "Your destination is Hamburg, a major hub for green coffee logistics in Europe.",
                "suggestion": "Demand for sustainable certification (Rainforest Alliance) is rising in Germany."
            },
            "price_range": {
                "general_info": "Global Robusta prices are currently trading between $2,200 - $2,400 per tonne.",
                "choice": "Vietnam -> Germany trade typically sees prices around $2,350 CIF Hamburg.",
                "suggestion": "Lock in prices now as forecasts suggest a slight rise due to dry weather in Dak Lak."
            }
        },
        "supply_chain": {
            "ports_movement": {
                "general_info": "Ho Chi Minh City to Hamburg is a standard high-volume coffee route.",
                "choice": "Route: Cat Lai Port (VN) -> Hamburg (DE). Transit time approx 28-32 days.",
                "suggestion": "Use reputable carriers like Maersk or Hapag-Lloyd to avoid transshipment delays."
            },
            "transport_costs": {
                "general_info": "Freight rates have stabilized after the post-pandemic surge.",
                "choice": "$900 - $1,100 per 20ft container (approx 18-19 tonnes).",
                "suggestion": "Book slots 3 weeks in advance as pre-Tet holiday congestion is starting."
            },
            "financing_support": {
                "general_info": "Banks are willing to finance coffee against LC or CAD terms.",
                "choice": "Vietnam exporters often prefer LC at sight or CAD 100%.",
                "suggestion": "Consider Confirmation of LC if working with smaller suppliers."
            }
        },
        "ground_check": {
            "weather_storage": {
                "general_info": "Coffee beans are hygroscopic and sensitive to moisture during sea transit.",
                "choice": "Risk of high humidity during Vietnam's rainy season.",
                "suggestion": "Use Kraft paper lining and desiccant bags (Dry-Bag) to prevent container rain."
            },
            "market_barriers": {
                "general_info": "EU Deforestation Regulation (EUDR) is a major upcoming compliance hurdle.",
                "choice": "Germany enforces strict residue limits (MRLs) for glyphosate.",
                "suggestion": "Ensure Supplier provides geocoordinates for farms to comply with upcoming EUDR."
            },
            "trade_frequency": {
                "general_info": "High frequency, year-round trade, peaking Nov-Jan (Harvest).",
                "choice": "This is a very active corridor with multiple weekly sailings.",
                "suggestion": "Spot availability is high; consider long-term contracts for price stability."
            }
        },
        "futures": {
            "open_interest": "High open interest on London Robusta futures indicates strong hedging activity.",
            "contract_price": "$2,410 (Sep contract)",
            "volatility": "Moderate (18% annualized volatility)",
            "prediction": "Bullish trend expected over next month due to El Nino concerns."
        },
        "demand_forecast": {
            "Germany": {"month3": 12.5, "month6": 13.0, "month9": 14.2},
            "Italy": {"month3": 8.0, "month6": 7.8, "month9": 8.1}
        },
        "price_forecast": {
            "month3": 2450.0,
            "month6": 2500.0,
            "month9": 2480.0
        },
        "summary": "This is a prime opportunity to source Robusta from Vietnam for the German market. Prices are competitive, but EUDR compliance and weather-induced volatility require careful vendor selection and hedging.",
        "recommendations": [
            "Source Grade 1 Screen 18 polished for better acceptance in German market.",
            "Verify EUDR readiness of the supplier immediately.",
            "Hedge currency risk (EUR/USD) as volatility is increasing."
        ]
    }

    # Patch factory
    AIClientFactory.get_client = MagicMock(return_value=mock_ai_client)

    analyzer = MarketAnalyzer(mock_db, mock_redis)
    
    context = {
        "role": "seller",
        "buyer_country": "Germany",
        "seller_country": "Vietnam",
        "port": "Hamburg",
        "price_range": {"min": 100, "max": 200}
    }

    try:
        result = await analyzer.run_analysis("Coffee", "0901", context)
        print("\nAnalysis Result Structure:")
        import json
        print(json.dumps(result["analysis"], indent=2))
        
        # Verify specific fields
        assert result["analysis"]["market"]["export_side"]["general_info"] == "Info"
        print("\n✅ Verification SUCCESS: Structure matches requirements.")
    except Exception as e:
        print(f"\n❌ Verification FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
