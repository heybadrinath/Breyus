import asyncio
import json
import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict, Optional

try:
    import httpx
except ImportError:
    print("Error: 'httpx' module not found. Please install it using 'pip install httpx'.")
    sys.exit(1)

logging.basicConfig(level=logging.INFO, format="%(message)s")
logging.getLogger("httpx").setLevel(logging.WARNING)

BASE_URL = "http://localhost:8000"
API_KEY = os.getenv("AI_API_KEY", "dev-secret-key-change-in-production")


def print_separator(title: str) -> None:
    print(f"\n{'=' * 12} {title} {'=' * 12}")


def log_curl(method: str, url: str, headers: Dict[str, str], json_body: Optional[Dict] = None) -> None:
    header_str = " ".join([f'-H "{k}: {v}"' for k, v in headers.items()])
    body_str = f"-d '{json.dumps(json_body)}'" if json_body else ""
    cmd = f"curl -X {method} {url} {header_str} {body_str}"
    print(f"\n[CURL]\n{cmd}\n")


def print_status(resp: httpx.Response) -> None:
    print(f"Status: {resp.status_code}")


def print_error(body: Dict[str, Any]) -> None:
    message = body.get("message")
    error = body.get("error")
    print(f"Error: {message} ({error})")


def summarize_niche(body: Dict[str, Any]) -> None:
    data = body.get("data", {})
    results = data.get("results", [])
    summary = data.get("result_summary", {})
    print(f"Results: {summary.get('total', 0)} (niche={summary.get('niche', 0)}, mainstream={summary.get('mainstream', 0)})")
    for item in results[:3]:
        print(f"- {item.get('name')} | niche={item.get('is_niche')} | similarity={item.get('similarity')}")


def summarize_matches(body: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    data = body.get("data", {})
    matches = data.get("matches", []) or []
    if not matches:
        print("Matches: 0")
        return None
    print(f"Matches: {len(matches)} (showing top 3)")
    for match in matches[:3]:
        print(
            f"- {match.get('company_name')} | prob={match.get('probability')} | "
            f"risk={match.get('risk_level')} | fluct={match.get('next_month_price_fluctuation')} | "
            f"gravity={match.get('gravity_score')}"
        )
    return matches[0]


def summarize_trade_score(body: Dict[str, Any]) -> None:
    data = body.get("data", {})
    print(f"Gravity Score: {data.get('gravity_score')} | Probability: {data.get('probability')}")
    breakdown = data.get("breakdown", {})
    if breakdown:
        print("Breakdown:")
        for key in [
            "demand",
            "source_geography",
            "port_proximity",
            "transport_cost",
            "capital",
            "financing",
            "price_range",
            "weather",
            "volatility",
            "barrier",
            "frequency",
        ]:
            print(f"  {key}: {breakdown.get(key)}")


def summarize_analysis(body: Dict[str, Any]) -> None:
    data = body.get("data", {})
    result = data.get("result") or {}
    charts = result.get("charts", {})
    print(f"Status: {data.get('status')}")
    print(f"Charts: demand={len(charts.get('demand_forecast', {}).get('countries', []))} "
          f"capital={len(charts.get('capital_required', {}).get('timeline', []))} "
          f"volatility={len(charts.get('price_volatility', {}).get('timeline', []))}")
    insights = result.get("insights", {})
    summary = insights.get("summary")
    if summary:
        print(f"Summary: {summary}")


async def run_flow() -> None:
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip("'").strip('"')
                    if k == "AI_API_KEY":
                        global API_KEY
                        API_KEY = v

    headers = {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
        "X-Request-ID": "test-flow-123",
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        # 1. Health Check
        print_separator("1. Health Check")
        url = f"{BASE_URL}/health"
        log_curl("GET", url, headers)
        resp = await client.get(url, headers=headers)
        print_status(resp)

        # 2. Niche Search (base)
        print_separator("2. Niche Search (Base)")
        url = f"{BASE_URL}/v1/commodities/search-niche"
        payload = {"commodity": "Coffee", "limit": 5}
        log_curl("POST", url, headers, payload)
        resp = await client.post(url, headers=headers, json=payload)
        print_status(resp)
        body = resp.json()
        if resp.status_code == 200:
            summarize_niche(body)
        else:
            print_error(body)

        # 3. Niche Search (filtered)
        print_separator("3. Niche Search (Filtered)")
        payload = {
            "commodity": "Coffee",
            "country_preference": "India",
            "port_preference": "Mumbai",
            "price_range": {"min": 2000, "max": 2500},
            "limit": 5,
        }
        log_curl("POST", url, headers, payload)
        resp = await client.post(url, headers=headers, json=payload)
        print_status(resp)
        body = resp.json()
        if resp.status_code == 200:
            summarize_niche(body)
        else:
            print_error(body)

        # 4. Buyer Flow - Link Prediction
        print_separator("4. Buyer Flow - Link Prediction")
        url = f"{BASE_URL}/v1/links/predict"
        payload = {
            "role": "buyer",
            "buyer_name": "Buyer Co",
            "commodity": "Coffee Beans",
            "hs_code": "090111",
            "port_preference": "Nhava Sheva",
            "price_range": {"min": 2000, "max": 2500},
            "profile": {
                "country": "Switzerland",
                "location": {"lat": 47.3769, "lon": 8.5417},
                "mean_monthly_revenue": 550000,
                "payment_terms": "letter of credit",
            },
        }
        log_curl("POST", url, headers, payload)
        resp = await client.post(url, headers=headers, json=payload)
        print_status(resp)
        body = resp.json()
        top_match = summarize_matches(body) if resp.status_code == 200 else None

        # 5. Buyer Flow - Trade Score (details for top seller or fallback)
        print_separator("5. Buyer Flow - Trade Score")
        url = f"{BASE_URL}/v1/trades/score"
        seller_name = top_match.get("company_name") if top_match else "Seller Co"
        payload = {
            "role": "buyer",
            "buyer_name": "Buyer Co",
            "seller_name": seller_name,
            "commodity": "Coffee Beans",
            "hs_code": "090111",
            "buyer_port": "Nhava Sheva",
            "price_range": {"min": 2000, "max": 2500},
            "profile": {
                "country": "Switzerland",
                "location": {"lat": 47.3769, "lon": 8.5417},
                "mean_monthly_revenue": 550000,
                "payment_terms": "letter of credit",
            },
        }
        log_curl("POST", url, headers, payload)
        resp = await client.post(url, headers=headers, json=payload)
        print_status(resp)
        body = resp.json()
        if resp.status_code == 200:
            summarize_trade_score(body)
        else:
            print_error(body)

        # 6. Seller Flow - Link Prediction
        print_separator("6. Seller Flow - Link Prediction")
        url = f"{BASE_URL}/v1/links/predict"
        payload = {
            "role": "seller",
            "seller_name": "Seller Co",
            "commodity": "Coffee Beans",
            "hs_code": "090111",
            "port_preference": "Rotterdam",
            "price_range": {"min": 1800, "max": 2300},
            "profile": {
                "country": "India",
                "location": {"lat": 12.9716, "lon": 77.5946},
                "mean_monthly_revenue": 500000,
                "payment_terms": "advance",
            },
        }
        log_curl("POST", url, headers, payload)
        resp = await client.post(url, headers=headers, json=payload)
        print_status(resp)
        body = resp.json()
        summarize_matches(body) if resp.status_code == 200 else print_error(body)

        # 7. Market Analysis
        print_separator("7. Market Analysis")
        url = f"{BASE_URL}/v1/analysis/initiate"
        payload = {
            "commodity": "Coffee",
            "hs_code": "090111",
            "market_context": {
                "buyer_country": "Switzerland",
                "seller_country": "India",
                "port": "Nhava Sheva",
                "price_range": {"min": 2000, "max": 2500},
                "role": "buyer",
            },
        }
        log_curl("POST", url, headers, payload)
        resp = await client.post(url, headers=headers, json=payload)
        print_status(resp)
        body = resp.json()
        job_id = body.get("data", {}).get("jobId") if resp.status_code == 202 else None

        if job_id:
            url = f"{BASE_URL}/v1/analysis/results/{job_id}"
            log_curl("GET", url, headers)
            resp = await client.get(url, headers=headers)
            body = resp.json()
            print_status(resp)
            if resp.status_code == 200:
                summarize_analysis(body)
            else:
                print_error(body)


if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(run_flow())
