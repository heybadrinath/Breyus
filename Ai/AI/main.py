from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
import os
import json
import re
from datetime import datetime
from dateutil.relativedelta import relativedelta
import asyncio
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Groq client with error handling
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    logger.error("GROQ_API_KEY not found in environment variables")
    raise ValueError("GROQ_API_KEY not found in environment variables. Please set it.")

try:
    client = Groq(api_key=api_key)
    logger.info("Groq client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Groq client: {e}")
    raise

app = FastAPI(
    title="AI Trade Analysis API",
    description="API to connect frontend requests with Groq AI for trade analysis and consolidation.",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic model for incoming request payload
class UserInput(BaseModel):
    commodity: str
    country: str = None
    port: str

# Supported Countries List
supported_countries = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
    "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas",
    "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin",
    "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei",
    "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon",
    "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia",
    "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba",
    "Cyprus", "Czechia (Czech Republic)", "Democratic Republic of the Congo",
    "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
    "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini (fmr. Swaziland)",
    "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia",
    "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea",
    "Guinea-Bissau", "Guyana", "Haiti", "Holy See", "Honduras", "Hungary",
    "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
    "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati",
    "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia",
    "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi",
    "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania",
    "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia",
    "Montenegro", "Morocco", "Mozambique", "Myanmar (Burma)", "Namibia", "Nauru",
    "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria",
    "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau",
    "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru",
    "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda",
    "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines",
    "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal",
    "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia",
    "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan",
    "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
    "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga",
    "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
    "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States of America",
    "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "Yemen",
    "Zambia", "Zimbabwe"
]

def extract_country(text, countries):
    """Check if any country from the list is mentioned in the text (case-insensitive)."""
    text_lower = text.lower()
    for country in countries:
        if re.search(r'\b' + re.escape(country.lower()) + r'\b', text_lower):
            return country
    return None

def get_llm_response(prompt_text, model="llama-3.1-8b-instant", temperature=0.8, max_tokens=1024, top_p=1, stream=False):
    """Makes a synchronous call to the Groq LLM and returns the response content."""
    try:
        logger.info(f"Making LLM request with prompt length: {len(prompt_text)}")
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt_text}],
            temperature=temperature,
            max_tokens=max_tokens,
            top_p=top_p,
            stream=stream
        )
        content = response.choices[0].message.content
        logger.info(f"LLM response received, length: {len(content) if content else 0}")
        return content
    except Exception as e:
        logger.error(f"Error during LLM call: {e}")
        return None

def extract_json_from_llm_response(text):
    """
    Attempts to find and extract a JSON object from a string that may contain
    preamble, postamble, or other non-JSON text.
    """
    if not text:
        logger.debug("Input text for JSON extraction is empty.")
        return None

    # First try to parse the entire response as JSON
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    # Try to find JSON object in the text
    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        json_string = match.group(0)
        try:
            return json.loads(json_string)
        except json.JSONDecodeError as e:
            logger.debug(f"Found potential JSON string but failed to parse: {e}")
            logger.debug(f"Malformed JSON string (first 500 chars): {json_string[:500]}...")
            return None
    else:
        logger.debug("No JSON object found in response for JSON extraction.")
        logger.debug(f"Response content start (first 200 chars): {text[:200]}...")
        return None

def get_month_year_labels_12():
    """Generate 12 month labels: 5 past months, current month, 6 future months"""
    current_date = datetime.now()
    start_date = current_date - relativedelta(months=5)
    labels = [(start_date + relativedelta(months=i)).strftime('%b %Y') for i in range(12)]
    return labels

# Root endpoint for health check
@app.get("/")
async def read_root():
    return {
        "message": "FastAPI Groq AI Trade Analysis Backend is running!",
        "groq_client": "connected",
        "timestamp": datetime.now().isoformat()
    }

# Test endpoint
@app.get("/test")
async def test_endpoint():
    return {"message": "Backend test successful!", "timestamp": datetime.now().isoformat()}

# Individual AI Endpoints
@app.post("/ai/commodity.px")
async def get_commodity_analysis_and_charts(user_input: UserInput):
    """
    Endpoint to get all AI results (commodity analysis, charts data) and return them in a single consolidated JSON response.
    """
    logger.info(f"Received request: {user_input}")

    # Validate input
    if not user_input.commodity or not user_input.port:
        raise HTTPException(status_code=400, detail="Commodity and port are required")
    
    commodity_input = user_input.commodity.strip()
    nearest_port = user_input.port.strip()
    
    # Determine export_country
    export_country = user_input.country
    if not export_country:
        extracted_country = extract_country(commodity_input, supported_countries)
        if extracted_country:
            export_country = extracted_country
        else:
            country_prompt = f"Considering '{commodity_input}', which country is a typical or major exporter? Respond with only the country name."
            llm_country_response = get_llm_response(country_prompt)
            if llm_country_response:
                export_country = extract_country(llm_country_response, supported_countries) or llm_country_response.strip()
            else:
                export_country = "Unknown_Country"
    
    logger.info(f"Processing: commodity={commodity_input}, country={export_country}, port={nearest_port}")

    # Calculate month labels
    month_year_labels_12 = get_month_year_labels_12()
    logger.info(f"Generated 12-month period: {month_year_labels_12[0]} to {month_year_labels_12[-1]}")

    try:
        # Define all prompts
        analysis_prompt = f"""
You are a trade assistant. A buyer wants to import **{commodity_input}** from **{export_country}**.
Their nearest port is **{nearest_port}**.

Generate a COMMODITY REPORT with the following details in a concise format using bullet points:
- Export country: {export_country}
- Import country: India
- Nearest port: {nearest_port}
- Market price range (specify currency)
- Weather impact in source country (detailed description)
- Transport cost estimate: (High, Low, Mid)
- Financing Probability: (Low, High, Mid)
- Weather (Risk + Storage): (High, Low, Mid)
- Price Volatility: (High, Low, Mid)
- Market Barrier: (High, Low, Mid)
- Trade Frequency: (High, Low, Mid)
- Capital required: (Low, Medium, High)
- Finance probability: (Low, Medium, High) (Note: This is different from Financing Probability above)
- Market barriers: (detailed description)

Keep the response informative, structured, and concise. Use only the specified categories (High, Low, Mid) for Transport cost estimate, Financing Probability, Weather (Risk + Storage), Price Volatility, Market Barrier, and Trade Frequency. Ensure all fields are included.
"""

        line_chart_capital_prompt = f"""
Generate monthly capital required per ton to import {commodity_input} from {export_country} for the period from {month_year_labels_12[0]} to {month_year_labels_12[-1]} (12 months, where first 6 months are historical data and last 6 months are predicted).
give realistic values for each month and accurate data
Return ONLY valid JSON in this exact format:
{{
  "data": [
    {{"month_year": "{month_year_labels_12[0]}", "capital_required_per_ton": 1500.50, "is_predicted": false}},
    {{"month_year": "{month_year_labels_12[1]}", "capital_required_per_ton": 1600.75, "is_predicted": false}},
    {{"month_year": "{month_year_labels_12[6]}", "capital_required_per_ton": 1700.25, "is_predicted": true}}
  ],
  "title": "Monthly Capital Required per Ton for {commodity_input} from {export_country}",
  "x_label": "Month",
  "y_label": "Capital Required (USD/Ton)"
}}

Include all 12 months with realistic USD/ton values, marking predicted months with is_predicted: true.
"""

        ref_line_capital_prompt = f"""
For commodity {commodity_input} from {export_country}, provide average capital required per ton.
give realistic values for each month and accurate data
Return ONLY valid JSON:
{{
  "target_value": 2500.00,
  "label": "Average Capital Required"
}}
"""

        radar_country_demand_prompt = f"""
For commodity {commodity_input}, identify 5 relevant countries and provide demand scores (1-5 scale).
give realistic values for each month and accurate data
Return ONLY valid JSON:
{{
  "countries_demand_data": [
    {{"country_name": "Brazil", "demand_score": 4.5}},
    {{"country_name": "Vietnam", "demand_score": 3.8}},
    {{"country_name": "{export_country}", "demand_score": 4.2}}
  ],
  "title": "Demand by Country for {commodity_input}",
  "scale_max": 5.0
}}

Include {export_country} in the list.
"""

        line_chart_price_fluctuation_prompt = f"""
Generate monthly price fluctuation percentage for {commodity_input} from {export_country} for the period from {month_year_labels_12[0]} to {month_year_labels_12[-1]} (12 months).

Return ONLY valid JSON:
{{
  "data": [
    {{"month_year": "{month_year_labels_12[0]}", "price_fluctuation_percent": 2.5}},
    {{"month_year": "{month_year_labels_12[1]}", "price_fluctuation_percent": -1.8}}
  ],
  "title": "Monthly Price Fluctuation for {commodity_input} from {export_country}",
  "x_label": "Month",
  "y_label": "Price Fluctuation (%)"
}}

Include all 12 months with realistic percentage values.
"""

        # Create tasks for concurrent execution
        tasks = [
            asyncio.to_thread(get_llm_response, analysis_prompt),
            asyncio.to_thread(get_llm_response, line_chart_capital_prompt),
            asyncio.to_thread(get_llm_response, ref_line_capital_prompt),
            asyncio.to_thread(get_llm_response, radar_country_demand_prompt),
            asyncio.to_thread(get_llm_response, line_chart_price_fluctuation_prompt)
        ]
        logger.info("Starting concurrent LLM requests...")
        (
            commodity_analysis_text,
            line_chart_capital_raw_response,
            ref_line_capital_raw_response,
            radar_country_demand_raw_response,
            line_chart_price_fluctuation_raw_response
        ) = await asyncio.gather(*tasks)
        logger.info("All LLM requests completed")

        # Process responses with fallbacks
        def create_fallback_monthly_data(title, value_key, base_value, is_capital=False):
            data = []
            for i, month in enumerate(month_year_labels_12):
                entry = {
                    "month_year": month,
                    value_key: base_value + i * (100.0 if value_key == "capital_required_per_ton" else 0.5)
                }
                if is_capital:
                    entry["is_predicted"] = i >= 6
                data.append(entry)
            return {
                "data": data,
                "title": title,
                "x_label": "Month",
                "y_label": "Capital Required (USD/Ton)" if is_capital else "Price Fluctuation (%)"
            }

        def create_fallback_radar_data():
            countries = ["USA", "China", "Germany", "Japan", export_country]
            return {
                "countries_demand_data": [
                    {"country_name": country, "demand_score": 3.0 + i * 0.3}
                    for i, country in enumerate(countries)
                ],
                "title": f"Demand by Country for {commodity_input}",
                "scale_max": 5.0
            }

        # Extract JSON with fallbacks
        line_capital_data = extract_json_from_llm_response(line_chart_capital_raw_response)
        if not line_capital_data or not isinstance(line_capital_data, dict) or 'data' not in line_capital_data:
            logger.warning("Using fallback for monthly capital data")
            line_capital_data = create_fallback_monthly_data(
                f"Monthly Capital Required per Ton for {commodity_input} from {export_country}",
                "capital_required_per_ton",
                2000.0,
                is_capital=True
            )

        ref_line_capital_data = extract_json_from_llm_response(ref_line_capital_raw_response)
        if not ref_line_capital_data:
            logger.warning("Using fallback for average capital data")
            ref_line_capital_data = {
                "target_value": 2500.0,
                "label": "Average Capital Required"
            }

        radar_country_demand_data = extract_json_from_llm_response(radar_country_demand_raw_response)
        if not radar_country_demand_data:
            logger.warning("Using fallback for country demand data")
            radar_country_demand_data = create_fallback_radar_data()

        line_price_fluctuation_data = extract_json_from_llm_response(line_chart_price_fluctuation_raw_response)
        if not line_price_fluctuation_data:
            logger.warning("Using fallback for price fluctuation data")
            line_price_fluctuation_data = create_fallback_monthly_data(
                f"Monthly Price Fluctuation for {commodity_input} from {export_country}",
                "price_fluctuation_percent",
                0.0
            )

        # Construct the consolidated response
        consolidated_results = {
            "commodity_analysis": commodity_analysis_text or "Analysis not available at this time.",
            "monthly_capital_data": line_capital_data,
            "average_capital_data": ref_line_capital_data,
            "country_demand_data": radar_country_demand_data,
            "monthly_price_fluctuation_data": line_price_fluctuation_data,
            "processed_commodity": commodity_input,
            "processed_export_country": export_country,
            "processed_nearest_port": nearest_port
        }

        logger.info(f"Successfully processed request for {commodity_input} from {export_country}")
        return JSONResponse(content=consolidated_results)

    except Exception as e:
        logger.error(f"Error consolidating AI results: {e}")
        raise HTTPException(status_code=500, detail=f"Error consolidating AI results: {str(e)}")

# Update /aiz.px endpoint to match /ai/commodity.px
@app.post("/aiz.px")
async def get_all_ai_results(user_input: UserInput):
    """
    Endpoint to get all AI results (commodity analysis, charts data) concurrently
    and return them in a single consolidated JSON response.
    """
    return await get_commodity_analysis_and_charts(user_input)

@app.post("/ai/country.px")
async def get_country_from_ai_endpoint(user_input: UserInput):
    """Endpoint to get the country from the AI service."""
    commodity_input = user_input.commodity
    export_country = user_input.country

    if not export_country:
        extracted_country = extract_country(commodity_input, supported_countries)
        if extracted_country:
            export_country = extracted_country
        else:
            country_prompt = f"Given the commodity '{commodity_input}', which country is a primary exporter of this commodity? Respond with only the country name."
            llm_country_response = get_llm_response(country_prompt)
            if llm_country_response:
                found_country = extract_country(llm_country_response, supported_countries)
                if found_country:
                    export_country = found_country
                else:
                    export_country = llm_country_response.strip()
            else:
                export_country = "Not specified"

    return {"country": export_country}

@app.post("/ai/port.px")
async def get_port_from_ai_endpoint(user_input: UserInput):
    """Endpoint to get the port from the AI service."""
    nearest_port_input = user_input.port
    return {"port": nearest_port_input}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)