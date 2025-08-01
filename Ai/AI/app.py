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
from typing import Optional

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
    title="AI Trade Analysis API - Seller",
    description="API to connect seller frontend requests with Groq AI for export analysis and consolidation.",
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
    country: Optional[str] = None
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

def extract_country(text: str, countries: list) -> Optional[str]:
    """Check if any country from the list is mentioned in the text (case-insensitive)."""
    text_lower = text.lower()
    for country in countries:
        if re.search(r'\b' + re.escape(country.lower()) + r'\b', text_lower):
            return country
    return None

def get_llm_response(prompt_text: str, model: str = "llama-3.1-8b-instant", temperature: float = 0.8, max_tokens: int = 1024, top_p: float = 1, stream: bool = False) -> Optional[str]:
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

def extract_json_from_llm_response(text: Optional[str]) -> Optional[dict]:
    """
    Attempts to find and extract a JSON object from a string that may contain
    preamble, postamble, or other non-JSON text.
    """
    if not text:
        logger.debug("Input text for JSON extraction is empty.")
        raise ValueError("LLM response is empty.")

    # Try to find JSON object in the text
    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        json_string = match.group(0)
        try:
            parsed_json = json.loads(json_string)
            logger.info("Successfully extracted JSON from LLM response.")
            return parsed_json
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON: {e}")
            logger.debug(f"Malformed JSON string (first 500 chars): {json_string[:500]}...")
            raise ValueError(f"Invalid JSON format in LLM response: {e}")
    else:
        logger.error("No JSON object found in LLM response.")
        logger.debug(f"Response content start (first 200 chars): {text[:200]}...")
        raise ValueError("No JSON object found in LLM response.")

def validate_json_data(json_data: dict, expected_keys: list, data_type: str) -> None:
    """Validate the JSON data structure for charts."""
    if not isinstance(json_data, dict):
        raise ValueError(f"{data_type} is not a valid dictionary.")
    
    for key in expected_keys:
        if key not in json_data:
            raise ValueError(f"{data_type} missing required key: {key}")
    
    if not isinstance(json_data.get("data"), list) or not json_data["data"]:
        raise ValueError(f"{data_type} data array is empty or invalid.")
    
    for item in json_data["data"]:
        if not isinstance(item, dict):
            raise ValueError(f"Invalid data point in {data_type}: {item}")
        
        if data_type == "country_demand_data":
            if not isinstance(item.get("country_name"), str) or not item["country_name"]:
                raise ValueError(f"Invalid country_name in {data_type}: {item}")
            if not isinstance(item.get("demand_score"), (int, float)) or item["demand_score"] < 0:
                raise ValueError(f"Invalid demand_score in {data_type}: {item}")
        elif data_type in ["monthly_capital_data", "monthly_price_fluctuation_data"]:
            if not isinstance(item.get("month_year"), str) or not item["month_year"]:
                raise ValueError(f"Invalid month_year in {data_type}: {item}")
            value_key = "capital_required_per_ton" if data_type == "monthly_capital_data" else "price_fluctuation_percent"
            if not isinstance(item.get(value_key), (int, float)):
                raise ValueError(f"Invalid {value_key} in {data_type}: {item}")
            if data_type == "monthly_capital_data" and item[value_key] < 0:
                raise ValueError(f"Negative capital_required_per_ton in {data_type}: {item}")
            if not isinstance(item.get("is_predicted"), bool):
                raise ValueError(f"Missing or invalid is_predicted in {data_type}: {item}")

def get_month_year_labels_12() -> list:
    """Generate 12 month labels: 5 past months, current month, 6 future months"""
    current_date = datetime.now()
    start_date = current_date - relativedelta(months=5)
    labels = [(start_date + relativedelta(months=i)).strftime('%b %Y') for i in range(12)]
    return labels

# Root endpoint for health check
@app.get("/")
async def read_root():
    return {
        "message": "FastAPI Groq AI Trade Analysis Backend - Seller is running!",
        "groq_client": "connected",
        "timestamp": datetime.now().isoformat()
    }

# Test endpoint
@app.get("/test")
async def test_endpoint():
    return {"message": "Backend test successful!", "timestamp": datetime.now().isoformat()}

# Individual AI Endpoints
@app.post("/ai/seller-commodity.px")
async def get_seller_commodity_analysis_and_charts(user_input: UserInput):
    """
    Endpoint to get all AI results (export analysis, charts data) and return them in a single consolidated JSON response.
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
            country_prompt = f"Given the commodity '{commodity_input}', which country is a primary exporter of this commodity? Respond with only the country name."
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
You are a trade assistant. A seller wants to export **{commodity_input}** from **{export_country}**.
Their nearest port is **{nearest_port}**.

Generate an EXPORT REPORT with the following details in a concise format using bullet points:
- Export country: {export_country}
- Target market: India
- Nearest port: {nearest_port}
- Market price range (specify currency)
- Weather impact in source country (detailed description)
- Transport cost estimate: (High, Low, Mid)
- Financing Probability: (Low, High, Mid)
- Weather (Risk + Storage): (High, Low, Mid)
- Price Volatility: (High, Low, Mid)
- Market Barrier: (High, Low, Mid)
- Trade Frequency: (High, Low, Mid)
- Capital required for export: (Low, Medium, High)
- Export financing probability: (Low, Medium, High) (Note: This is different from Financing Probability above)
- Market opportunities: (detailed description)

Keep the response informative, structured, and concise. Use only the specified categories (High, Low, Mid) for Transport cost estimate, Financing Probability, Weather (Risk + Storage), Price Volatility, Market Barrier, and Trade Frequency. Ensure all fields are included.
"""

        line_chart_capital_prompt = f"""
You are a trade analyst. Generate monthly capital required per ton (in USD) to export {commodity_input} from {export_country} for the period from {month_year_labels_12[0]} to {month_year_labels_12[-1]} (12 months, where the first 6 months are historical data and the last 6 months are predicted).

Return ONLY a valid JSON object in this exact format:
{{
  "data": [
    {{"month_year": "{month_year_labels_12[0]}", "capital_required_per_ton": 1500.50, "is_predicted": false}},
    {{"month_year": "{month_year_labels_12[1]}", "capital_required_per_ton": 1600.75, "is_predicted": false}},
    {{"month_year": "{month_year_labels_12[6]}", "capital_required_per_ton": 1700.25, "is_predicted": true}},
    ...
  ],
  "title": "Monthly Export Capital Required per Ton for {commodity_input} from {export_country}",
  "x_label": "Month",
  "y_label": "Capital Required (USD/Ton)"
}}

- Include all 12 months in the data array.
- Ensure capital_required_per_ton values are realistic (positive numbers, 2 decimal places) and reflect export market trends for {commodity_input}.
- Mark the first 6 months as historical (is_predicted: false) and the last 6 months as predicted (is_predicted: true).
- Do not include any text outside the JSON object.
"""

        ref_line_capital_prompt = f"""
You are a trade analyst. Provide the average capital required per ton (in USD) to export {commodity_input} from {export_country}.

Return ONLY a valid JSON object in this exact format:
{{
  "target_value": 2500.00,
  "label": "Average Export Capital Required"
}}

- Ensure target_value is a realistic positive number with 2 decimal places.
- Do not include any text outside the JSON object.
"""

        radar_country_demand_prompt = f"""
You are a trade analyst. For the commodity {commodity_input}, identify 5 relevant countries with significant buyer demand and provide demand scores on a 1-5 scale (1 = low demand, 5 = high demand).

Return ONLY a valid JSON object in this exact format:
{{
  "data": [
    {{"country_name": "India", "demand_score": 4.5}},
    {{"country_name": "China", "demand_score": 3.8}},
    {{"country_name": "{export_country}", "demand_score": 2.0}},
    ...
  ],
  "title": "Buyer Demand by Country for {commodity_input}",
  "scale_max": 5.0
}}

- Include exactly 5 countries, one of which must be {export_country} (with a lower demand score as it’s the export origin).
- Ensure demand_score values are realistic (between 1.0 and 5.0, 1 decimal place).
- Do not include any text outside the JSON object.
"""

        line_chart_price_fluctuation_prompt = f"""
You are a trade analyst. Generate monthly price fluctuation percentage for {commodity_input} exported from {export_country} for the period from {month_year_labels_12[0]} to {month_year_labels_12[-1]} (12 months, where the first 6 months are historical data and the last 6 months are predicted).

Return ONLY a valid JSON object in this exact format:
{{
  "data": [
    {{"month_year": "{month_year_labels_12[0]}", "price_fluctuation_percent": 2.5, "is_predicted": false}},
    {{"month_year": "{month_year_labels_12[1]}", "price_fluctuation_percent": -1.8, "is_predicted": false}},
    {{"month_year": "{month_year_labels_12[6]}", "price_fluctuation_percent": 1.5, "is_predicted": true}},
    ...
  ],
  "title": "Monthly Price Fluctuation for {commodity_input} Export from {export_country}",
  "x_label": "Month",
  "y_label": "Price Fluctuation (%)"
}}

- Include all 12 months in the data array.
- Ensure price_fluctuation_percent values are realistic (between -10.0 and 10.0, 1 decimal place) and reflect export market volatility for {commodity_input}.
- Mark the first 6 months as historical (is_predicted: false) and the last 6 months as predicted (is_predicted: true).
- Do not include any text outside the JSON object.
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

        # Process and validate responses
        # Commodity analysis (text)
        if not commodity_analysis_text:
            logger.error("Commodity analysis response is empty.")
            raise HTTPException(status_code=500, detail="Failed to generate commodity analysis.")

        # Monthly capital data
        line_capital_data = extract_json_from_llm_response(line_chart_capital_raw_response)
        if not line_capital_data:
            logger.error("Invalid or missing JSON for monthly capital data.")
            raise HTTPException(status_code=500, detail="Failed to generate valid monthly capital data.")
        validate_json_data(
            line_capital_data,
            ["data", "title", "x_label", "y_label"],
            "monthly_capital_data"
        )
        if len(line_capital_data["data"]) != 12:
            logger.error(f"Monthly capital data has incorrect number of months: {len(line_capital_data['data'])}")
            raise HTTPException(status_code=500, detail="Monthly capital data must include exactly 12 months.")

        # Average capital data
        ref_line_capital_data = extract_json_from_llm_response(ref_line_capital_raw_response)
        if not ref_line_capital_data:
            logger.error("Invalid or missing JSON for average capital data.")
            raise HTTPException(status_code=500, detail="Failed to generate valid average capital data.")
        if not isinstance(ref_line_capital_data.get("target_value"), (int, float)) or ref_line_capital_data["target_value"] < 0:
            logger.error(f"Invalid target_value in average capital data: {ref_line_capital_data}")
            raise HTTPException(status_code=500, detail="Invalid average capital data.")

        # Country demand data
        radar_country_demand_data = extract_json_from_llm_response(radar_country_demand_raw_response)
        if not radar_country_demand_data:
            logger.error("Invalid or missing JSON for country demand data.")
            raise HTTPException(status_code=500, detail="Failed to generate valid country demand data.")
        # Rename 'countries_demand_data' to 'data' to match frontend expectation
        if "countries_demand_data" in radar_country_demand_data:
            radar_country_demand_data["data"] = radar_country_demand_data.pop("countries_demand_data")
        validate_json_data(
            radar_country_demand_data,
            ["data", "title", "scale_max"],
            "country_demand_data"
        )
        if len(radar_country_demand_data["data"]) != 5:
            logger.error(f"Country demand data has incorrect number of countries: {len(radar_country_demand_data['data'])}")
            raise HTTPException(status_code=500, detail="Country demand data must include exactly 5 countries.")
        if not any(item["country_name"] == export_country for item in radar_country_demand_data["data"]):
            logger.error(f"Country demand data missing export country: {export_country}")
            raise HTTPException(status_code=500, detail=f"Country demand data must include {export_country}.")

        # Price fluctuation data
        line_price_fluctuation_data = extract_json_from_llm_response(line_chart_price_fluctuation_raw_response)
        if not line_price_fluctuation_data:
            logger.error("Invalid or missing JSON for price fluctuation data.")
            raise HTTPException(status_code=500, detail="Failed to generate valid price fluctuation data.")
        validate_json_data(
            line_price_fluctuation_data,
            ["data", "title", "x_label", "y_label"],
            "monthly_price_fluctuation_data"
        )
        if len(line_price_fluctuation_data["data"]) != 12:
            logger.error(f"Price fluctuation data has incorrect number of months: {len(line_price_fluctuation_data['data'])}")
            raise HTTPException(status_code=500, detail="Price fluctuation data must include exactly 12 months.")

        # Construct the consolidated response
        consolidated_results = {
            "commodity_analysis": commodity_analysis_text,
            "monthly_capital_data": line_capital_data,
            "average_capital_data": ref_line_capital_data,
            "country_demand_data": radar_country_demand_data,
            "monthly_price_fluctuation_data": line_price_fluctuation_data,
            "processed_commodity": commodity_input,
            "processed_export_country": export_country,
            "processed_nearest_port": nearest_port,
            "products": [
                {
                    "productName": f"Premium {commodity_input} Export",
                    "price": "USD 130/ton",
                    "countryOfOrigin": export_country,
                    "contactNumber": "+61 412 345 678",
                    "productDescription": f"<p>High-quality {commodity_input} for export from {export_country}. Optimized for international markets.</p>",
                    "sellerQuality": "Excellent",
                    "priceFluctuation": "Stable"
                },
                {
                    "productName": f"Standard {commodity_input} Export",
                    "price": "USD 110/ton",
                    "countryOfOrigin": export_country,
                    "contactNumber": "+61 412 987 654",
                    "productDescription": f"<p>Competitive {commodity_input} export grade from {export_country}. Suitable for bulk orders.</p>",
                    "sellerQuality": "Good",
                    "priceFluctuation": "Moderate Volatility"
                }
            ]
        }

        logger.info(f"Successfully processed request for {commodity_input} from {export_country}")
        return JSONResponse(content=consolidated_results)

    except Exception as e:
        logger.error(f"Error consolidating AI results: {e}")
        raise HTTPException(status_code=500, detail=f"Error consolidating AI results: {str(e)}")

# Update /aiz.px endpoint to match /ai/seller-commodity.px
@app.post("/aiz.px")
async def get_all_seller_ai_results(user_input: UserInput):
    """
    Endpoint to get all AI results (export analysis, charts data) concurrently
    and return them in a single consolidated JSON response.
    """
    return await get_seller_commodity_analysis_and_charts(user_input)

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