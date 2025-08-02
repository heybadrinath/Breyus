from groq import Groq
from dotenv import load_dotenv
import os
import json
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import pandas as pd
import re
from datetime import datetime
from dateutil.relativedelta import relativedelta # For precise month arithmetic

# Load environment variables
load_dotenv()

# Initialize Groq client
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise ValueError("GROQ_API_KEY not found in environment variables. Please set it.")
client = Groq(api_key=api_key)

# --- Helper Function to Extract Country ---
def extract_country(text, countries):
    text_lower = text.lower()
    for country in countries:
        if country.lower() in text_lower:
            return country
    return None

# --- Supported Countries List (Provided by User) ---
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

# --- Function to make LLM calls ---
def get_llm_response(prompt_text, model="llama-3.1-8b-instant", temperature=0.8, max_tokens=1024, top_p=1, stream=False):
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt_text}],
            temperature=temperature,
            max_tokens=max_tokens,
            top_p=top_p,
            stream=stream
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error during LLM call: {e}")
        return None

# --- Function to extract JSON from a string that might contain extra text ---
def extract_json_from_llm_response(text):
    if not text:
        return None
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        json_string = match.group(0)
        try:
            return json.loads(json_string)
        except json.JSONDecodeError as e:
            print(f"DEBUG: Found potential JSON string but failed to parse: {e}")
            print(f"DEBUG: Malformed JSON string: {json_string[:500]}...")
            return None
    else:
        print(f"DEBUG: No JSON object found in response for JSON extraction.")
        print(f"DEBUG: Response content start: {text[:200]}...")
        return None

# --- User Input Collection from ENV (for API integration) ---
commodity_input = os.environ.get("COMMODITY_INPUT", "").strip()
export_country = os.environ.get("EXPORT_COUNTRY", "").strip()
nearest_port = os.environ.get("NEAREST_PORT", "").strip()

# --- LLM Call 1: Overall Commodity Analysis ---
analysis_prompt = f"""
You are a trade assistant. A buyer wants to import **{commodity_input}** from **{export_country}**.
Their nearest port is **{nearest_port}**.

Now generate a COMMODITY REPORT with the following details in a concise format:
- Export country
- Import country (Assume India, based on current location and common use case)
- Nearest port
- Market price range (₹/kg or $/kg, specify currency based on typical trade for this commodity)
- Weather impact in source country
- Transport cost (rough estimate in USD/ton or similar, specify unit)
- Trade frequency (e.g., High, Medium, Low)
- Capital required (e.g., Low, Medium, High)
- Finance probability (loan availability, e.g., High, Medium, Low)
- Market barriers (e.g., Tariffs, Regulations, Geopolitical risk)

Keep the tone informative and clean.
"""
commodity_analysis_text = get_llm_response(analysis_prompt)
if commodity_analysis_text:
    print("\nCOMMODITY ANALYSIS REPORT:\n")
    print(commodity_analysis_text)
else:
    print("Failed to generate commodity analysis.")
    exit()

# (The rest of your code for charts and further LLM calls can be added here)
