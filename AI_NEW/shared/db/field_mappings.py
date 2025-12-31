"""
Field Mappings: Raw Data Columns → Schema Fields

This file defines how columns from various raw data sources map to the
normalized database schema. Used by the normalization pipeline.

Key Features:
- Multiple source column names can map to one target field
- Transformation functions for data cleaning
- Extra fields go into JSONB 'extra' column automatically
"""

from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass
from enum import Enum


class TargetTable(Enum):
    COMPANIES = "companies"
    DEALS = "deals"
    TRADE_RECORDS = "trade_records"  # Backward compatibility alias for deals
    PRODUCTS = "products"
    ENTITIES = "entities"
    PEOPLE = "people"
    INVESTORS = "investors"
    ROUNDS = "rounds"


@dataclass
class FieldMapping:
    """Maps source column(s) to target schema field."""
    target_field: str
    source_columns: List[str]  # Possible column names in source data
    transform: Optional[Callable[[Any], Any]] = None
    required: bool = False


# =============================================================================
# TRANSFORMATION FUNCTIONS
# =============================================================================

def clean_string(value: Any) -> Optional[str]:
    """Clean and normalize string values."""
    if value is None or (isinstance(value, float) and str(value) == 'nan'):
        return None
    s = str(value).strip()
    if s.lower() in ('null', 'nan', 'none', '', 'n/a', 'na'):
        return None
    # Remove multiple spaces
    import re
    s = re.sub(r'\s+', ' ', s)
    return s if s else None


def parse_list(value: Any) -> Optional[List[str]]:
    """Parse comma/pipe/semicolon separated values into a list."""
    if value is None:
        return None
    if isinstance(value, (list, tuple, set)):
        cleaned = [clean_string(v) for v in value]
        return [v for v in cleaned if v]
    text = clean_string(value)
    if not text:
        return None
    for sep in [",", "|", ";"]:
        if sep in text:
            parts = [clean_string(p) for p in text.split(sep)]
            return [p for p in parts if p]
    return [text]


def clean_numeric(value: Any) -> Optional[float]:
    """Clean numeric values."""
    if value is None:
        return None
    try:
        if isinstance(value, str):
            # Remove currency symbols and commas
            value = value.replace(',', '').replace('$', '').replace('₹', '')
            value = value.strip()
            if not value or value.lower() in ('null', 'nan', 'none', 'n/a'):
                return None
        return float(value)
    except (ValueError, TypeError):
        return None


def clean_integer(value: Any) -> Optional[int]:
    """Clean integer values."""
    num = clean_numeric(value)
    return int(num) if num is not None else None


def clean_date(value: Any) -> Optional[str]:
    """Clean and normalize date values to ISO format."""
    if value is None:
        return None
    import pandas as pd
    try:
        if isinstance(value, str):
            value = value.strip()
            if value.lower() in ('null', 'nan', 'none', ''):
                return None
        dt = pd.to_datetime(value)
        return dt.strftime('%Y-%m-%d') if pd.notna(dt) else None
    except:
        return None


def clean_hs_code(value: Any) -> Optional[str]:
    """Clean HS code values."""
    s = clean_string(value)
    if s is None:
        return None
    # Remove non-numeric characters except for standard separators
    import re
    s = re.sub(r'[^0-9]', '', s)
    return s if s else None


def extract_hs_chapter(hs_code: Any) -> Optional[int]:
    """Extract chapter (first 2 digits) from HS code."""
    code = clean_hs_code(hs_code)
    if code and len(code) >= 2:
        try:
            return int(code[:2])
        except:
            return None
    return None


def clean_country(value: Any) -> Optional[str]:
    """Normalize country names."""
    s = clean_string(value)
    if s is None:
        return None
    # Standardize common variations
    country_map = {
        'USA': 'UNITED STATES',
        'U.S.A': 'UNITED STATES',
        'US': 'UNITED STATES',
        'UK': 'UNITED KINGDOM',
        'U.K': 'UNITED KINGDOM',
        'UAE': 'UNITED ARAB EMIRATES',
        'U.A.E': 'UNITED ARAB EMIRATES',
    }
    upper = s.upper()
    return country_map.get(upper, s.title())


def clean_currency(value: Any) -> Optional[str]:
    """Normalize currency codes."""
    s = clean_string(value)
    if s is None:
        return None
    # Standardize common variations
    currency_map = {
        'US$': 'USD',
        'US DOLLAR': 'USD',
        'USDOLLAR': 'USD',
        '$': 'USD',
        '₹': 'INR',
        'RS': 'INR',
        'RUPEE': 'INR',
        'INR.': 'INR',
        '€': 'EUR',
        'EUR.': 'EUR',
        '£': 'GBP',
        'GBP.': 'GBP',
        'AED.': 'AED',
    }
    upper = s.upper().strip()
    return currency_map.get(upper, upper)


def clean_entity_type(value: Any) -> List[str]:
    """Determine entity types from business details."""
    s = clean_string(value)
    if s is None:
        return ['unknown']

    s_lower = s.lower()
    types = []

    if any(word in s_lower for word in ['export', 'exporter']):
        types.append('exporter')
    if any(word in s_lower for word in ['import', 'importer']):
        types.append('importer')
    if any(word in s_lower for word in ['manufacturer', 'mfr', 'mfrs', 'manufacturing']):
        types.append('manufacturer')
    if any(word in s_lower for word in ['wholesaler', 'wholesale', 'distributor']):
        types.append('wholesaler')
    if any(word in s_lower for word in ['supplier', 'supply']):
        types.append('supplier')
    if any(word in s_lower for word in ['buyer', 'procurement']):
        types.append('buyer')
    if any(word in s_lower for word in ['seller', 'trader', 'trading']):
        types.append('seller')

    return types if types else ['unknown']


def parse_contact_info(row: dict) -> dict:
    """Extract contact info from row into structured format."""
    contact = {}

    # Phone numbers
    phones = []
    for key in ['PHONE', 'CONTACT_NO', 'CONTACTNO', 'Contact No.', 'Contact No. ']:
        if key in row and clean_string(row[key]):
            phones.append(clean_string(row[key]))
    if phones:
        contact['phone'] = phones

    # Mobile
    mobiles = []
    for key in ['MOBILE', 'Mobile', 'MOBILE_NO']:
        if key in row and clean_string(row[key]):
            mobiles.append(clean_string(row[key]))
    if mobiles:
        contact['mobile'] = mobiles

    # Email
    emails = []
    for key in ['EMAIL', 'E_MAIL_ID', 'Email Ids.', 'EMAILID', 'E-MAIL']:
        if key in row and clean_string(row[key]):
            email = clean_string(row[key])
            if email and '@' in email:
                emails.append(email)
    if emails:
        contact['email'] = emails

    # Website
    for key in ['Website', 'WEBSITE', 'Web']:
        if key in row and clean_string(row[key]):
            contact['website'] = clean_string(row[key])
            break

    # Contact person
    for key in ['CONTACT PERSON', 'ContactPerson', 'Contact Person']:
        if key in row and clean_string(row[key]):
            contact['contact_person'] = clean_string(row[key])
            break

    return contact


# =============================================================================
# COMPANY TABLE MAPPINGS
# =============================================================================

COMPANY_FIELD_MAPPINGS: List[FieldMapping] = [
    # Core name
    FieldMapping(
        target_field="name",
        source_columns=[
            "Company Name", "COMPANY NAME", "Exporter_Name", "EXPORTERNAME",
            "EXPORTER", "IMPORTER", "Wholesaler/Manufacturer", "Exporter Name",
            "SUPPLIER_NAME", "CONSINEENAME", "CONSIGNEENAME", "Consignee_Name",
            "EXPORTER NAME", "IMPORTER NAME", "Supplier Name", "Supplier_Name",
            "Exporter Names", "Exporter_Names", "Importer Names", "Importer_Names"
        ],
        transform=clean_string,
        required=True
    ),

    # Location - Country
    FieldMapping(
        target_field="country",
        source_columns=[
            "Country", "COUNTRY", "FOREIGNCOUNTRY", "ORIGIN_COUNTRY",
            "COUNTRYOFDESTINATIONNAME", "Country ORIGIN DESTINATION",
            "Consignee_Country", "COUNTRY OF DESTINATION", "Ctry of Destination",
            "Foreign Country", "foreign Country", "Foreign_Country", "FOREIGN_COUNTRY"
        ],
        transform=clean_country
    ),

    # Location - State
    FieldMapping(
        target_field="state",
        source_columns=[
            "State", "STATE", "Exporter_City_State", "Exporter_City_State.1",
            "Importer_City_State", "CITY/ STATE", "City/ State", "CITY_STATE",
            "EXPORTER CITY/STATE"
        ],
        transform=clean_string
    ),

    # Location - City
    FieldMapping(
        target_field="city",
        source_columns=[
            "City", "CITY", "Exporter_City", "EXPORTER CITY", "Exporter City"
        ],
        transform=clean_string
    ),

    # Location - Pin Code
    FieldMapping(
        target_field="pin_code",
        source_columns=[
            "Pin Code", "Pin_Code", "PIN", "Exporter_PIN", "PIN CODE",
            "EXPORTER PIN", "EXPORTER PIN CODE", "Importer_PIN"
        ],
        transform=clean_string
    ),

    # Full Address
    FieldMapping(
        target_field="address_full",
        source_columns=[
            "Add.", "ADD.", "EXPORTERADDRESS", "Exporter_Address",
            "IMPORTERADDRESS", "CONSINEEADDRESS", "Consignee_Address",
            "SUPPLIER_ADDRESS", "Exporter Address", "EXPORTER ADDRESS",
            "IMPORTER ADDRESS", "Importer Address", "Importer_Address",
            "EXPORTER ADD", "Exporter Add", "Exporter_Add",
            "Exporter_Address.1", "Exporter Address & state",
            "CONSIGNEE ADD", "Consignee & Consignee_Address",
            "Consignee_Address1", "Consignee_Address3", "Consignee_Address4",
            "Supplier_Add1", "CONSINEE_ADDRESS", "CONSIGNEE_ADDRESS"
        ],
        transform=clean_string
    ),

    # IEC Code (Indian)
    FieldMapping(
        target_field="iec_code",
        source_columns=[
            "IEC", "IEC_CODE", "iec", "IEC_NO", "IECNO", "EXPORTER ID"
        ],
        transform=clean_string
    ),

    # IEC PAN (related to IEC)
    FieldMapping(
        target_field="iec_pan",
        source_columns=["IEC_PAN"],
        transform=clean_string
    ),

    # IEC Establishment Date
    FieldMapping(
        target_field="iec_established",
        source_columns=["IEC_Date_of_Establishment"],
        transform=clean_date
    ),

    # Business Details
    FieldMapping(
        target_field="business_details",
        source_columns=[
            "Details", "BUSINESS DETAILS", "Business Details",
            "Consumer Type", "Consumer  type", "Type", "TYPE"
        ],
        transform=clean_string
    ),

    # Email (for contact_info JSONB)
    FieldMapping(
        target_field="email",
        source_columns=[
            "EMAIL", "E_MAIL_ID", "Email Ids.", "EMAILID", "Email id",
            "Exporter_Email", "EXPORTER_EMAIL", "Exporter_mail"
        ],
        transform=clean_string
    ),

    # Phone (for contact_info JSONB)
    FieldMapping(
        target_field="phone",
        source_columns=[
            "PHONE", "CONTACT_NO", "CONTACTNO", "Contact No.",
            "Exporter_Phone", "EXPORTER_PHONE", "MOBILE"
        ],
        transform=clean_string
    ),

    # Contact Person
    FieldMapping(
        target_field="contact_person",
        source_columns=[
            "CONTACT PERSON", "Exporter_Contact", "Exporter_Person_Name",
            "Exporter_Contact_Person_1", "Exporter_Contact_Person_2"
        ],
        transform=clean_string
    ),

    # Website
    FieldMapping(
        target_field="website",
        source_columns=["Website", "WEBSITE"],
        transform=clean_string
    ),
]


# =============================================================================
# TRADE RECORDS TABLE MAPPINGS
# =============================================================================

TRADE_RECORD_FIELD_MAPPINGS: List[FieldMapping] = [
    # Transaction IDs - Shipping Bill
    FieldMapping(
        target_field="sb_number",
        source_columns=[
            "SBNUMBER", "SB_No", "SBNO", "SB Number", "SB NO", "SB_NO",
            "Sbill_No", "BE_NO"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="sb_date",
        source_columns=[
            "SBDATE", "Date", "SBDT", "SB DATE", "SB_DT",
            "Sbill_Date", "Shipping_Bill_Date", "DATE"
        ],
        transform=clean_date
    ),
    FieldMapping(
        target_field="reg_date",
        source_columns=["REG_DATE", "Registration Date"],
        transform=clean_date
    ),

    # Invoice
    FieldMapping(
        target_field="invoice_number",
        source_columns=[
            "INVOICE NO", "Invoice No.", "INVOICE_NO", "INVOICE_NUMBER"
        ],
        transform=clean_string
    ),

    # Exporter
    FieldMapping(
        target_field="exporter_name",
        source_columns=[
            "EXPORTERNAME", "Exporter_Name", "EXPORTER", "Exporter Name",
            "EXPORTER NAME", "Exporter Names", "Exporter_Names", "EXPORTER NAME"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="exporter_address",
        source_columns=[
            "EXPORTERADDRESS", "Exporter_Address", "Exporter Address",
            "EXPORTER_ADDRESS", "EXPORTER ADDRESS", "EXPORTER ADD", "Exporter Add",
            "Exporter_Add", "Exporter_Address.1", "Exporter Address & state"
        ],
        transform=clean_string
    ),

    # Buyer (often used in international trade data)
    FieldMapping(
        target_field="buyer_name",
        source_columns=[
            "BUYER NAME", "Buyer Name", "BUYER", "Buyer"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="buyer_address",
        source_columns=[
            "BUYER ADDRESS", "Buyer Address", "BUYER ADD"
        ],
        transform=clean_string
    ),

    # Declarant (customs agent/representative)
    FieldMapping(
        target_field="declarant_name",
        source_columns=[
            "DECLARANT NAME", "Declarant Name", "DECLARANT", "Declarant"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="declarant_address",
        source_columns=[
            "DECLARANT ADDRESS", "Declarant Address"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="exporter_iec",
        source_columns=["IEC", "iec", "IEC_NO", "IECNO", "EXPORTER ID"],
        transform=clean_string
    ),

    # Importer/Consignee
    FieldMapping(
        target_field="importer_name",
        source_columns=[
            "IMPORTER", "Importer_Name", "IMPORTER NAME",
            "Importer Names", "Importer_Names"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="importer_address",
        source_columns=[
            "IMPORTERADDRESS", "Importer_Address", "IMPORTER ADDRESS", "Importer Address"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="importer_tel",
        source_columns=["IMPORTER TEL", "Importer Tel", "Importer Phone"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="importer_department",
        source_columns=["IMPORTER DEPARTMENT", "Importer Department"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="exporter_department",
        source_columns=["EXPORTER DEPARTMENT", "Exporter Department"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="consignee_name",
        source_columns=[
            "CONSINEENAME", "CONSIGNEENAME", "Consignee_Name", "Consignee",
            "CONSIGNEE", "CONSINEE_NAME", "FOREIGN IMPORTER NAME", "PROB_CONSINEENAME"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="consignee_address",
        source_columns=[
            "CONSINEEADDRESS", "CONSIGNEEADDRESS", "Consignee_Address",
            "CONSINEE_ADDRESS", "CONSIGNEE_ADDRESS", "CONSIGNEE ADD",
            "Consignee & Consignee_Address", "Consignee_Address1",
            "Consignee_Address3", "Consignee_Address4"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="consignee_country",
        source_columns=["Consignee_Country"],
        transform=clean_country
    ),

    # Supplier
    FieldMapping(
        target_field="supplier_name",
        source_columns=[
            "SUPPLIER_NAME", "Supplier_Name", "Supplier Name", "SUPPLIER",
            "Supplier", "SHIPPER NAME", "Shipper Name"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="supplier_address",
        source_columns=["SUPPLIER_ADDRESS", "Supplier_Address", "Supplier_Add1"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="supplier_city",
        source_columns=["SUPPLIER CITY", "Supplier City"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="supplier_country",
        source_columns=[
            "SUPPLIER COUNTRY", "Supplier Country", "ORIGIN SUPPLIER COUNTRY"
        ],
        transform=clean_country
    ),

    # Agent/Intermediary
    FieldMapping(
        target_field="agent_name",
        source_columns=["AGENT", "Agent", "Agent Name"],
        transform=clean_string
    ),

    # Product - HS Codes
    FieldMapping(
        target_field="hs_code",
        source_columns=[
            "HS_CODE", "HS_Code", "Hs_Code", "HSCODE", "HS CODE",
            "RITC_Code", "RITCCODE", "RITS code", "4 Digit HS Code"
        ],
        transform=clean_hs_code
    ),
    FieldMapping(
        target_field="hs_chapter",
        source_columns=[
            "CHAPTER", "Chapter", "CH", "CHP", "CHAPTER's", "2 DIGIT"
        ],
        transform=clean_integer
    ),
    FieldMapping(
        target_field="hs_heading",
        source_columns=[
            "HEADING", "Heading", "HS Heading"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="hs_subheading",
        source_columns=[
            "SUB HEADING", "Sub Heading", "Subheading", "SUB-HEADING"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="ritc_code",
        source_columns=["RITC", "RITC_2", "RITC_4"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="product_description",
        source_columns=[
            "ProductDescription", "PRODUCTDESCRIPITION", "GOODSDESCRIPTION",
            "Item_Description", "ITEM", "ITME", "PRODUCT DESCRIPTION",
            "HS CODE DESCRIPTION", "Product_Description", "PRODUCT_DESCRIPITION",
            "HSN_DESCRIPTION", "RITC DESCRIPTION", "Description", "Product",
            "HS DESCRIPTION", "COMERCIAL DESCRIPTION", "Commercial Description",
            "HS CODE DESCRIPTION SPANISH", "PRODUCT DESCRIPTION SPANISH"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="item_number",
        source_columns=["Item Number", "ITEM NUMBER", "Items No", "ITEM NO"],
        transform=clean_integer
    ),
    FieldMapping(
        target_field="product_group",
        source_columns=["A_Group"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="brand",
        source_columns=["BRAND", "Brand", "Brand Name"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="variety",
        source_columns=["VARIETY", "Variety", "Product Variety"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="condition",
        source_columns=["CONDITION", "Condition", "Product Condition"],
        transform=clean_string
    ),

    # Quantity
    FieldMapping(
        target_field="quantity",
        source_columns=[
            "QUANTITY", "Quantity", "QTY", "Qty",
            "QTY COMMERCIAL", "QTY EST. MARKET BAL. EXP.",
            "Unit Quantity", "Unit_Quantity", "COMMERCIAL QUANTITY"
        ],
        transform=clean_numeric
    ),
    FieldMapping(
        target_field="unit_of_measurement",
        source_columns=[
            "UNITQUANTITY", "UNIT_QUANTITY", "UNITOFMEASUREMENT", "UQC",
            "EST MEASUREMENT UNIT", "Unit", "UNIT", "UNIT OF QUANTITY",
            "Unit of Quantity", "Quantity UOM", "COMMERCIAL UNIT",
            "MEASURE UNIT", "UNIT CODE"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="net_weight_kg",
        source_columns=[
            "NET WEIGHT", "Net_Weight", "NET WEIGHT KG", "Net Weight Kg",
            "NET WEIGHT PER UNIT", "Net Weight Per Unit"
        ],
        transform=clean_numeric
    ),
    FieldMapping(
        target_field="gross_weight_kg",
        source_columns=[
            "GROSS WEIGHT", "Gross Weight", "Gross Weight Kg", "Gross Weight Uom",
            "GROSS WEIGTH KG", "WEIGHT (KGS)", "Weight (Kgs)", "WEIGHT"
        ],
        transform=clean_numeric
    ),
    FieldMapping(
        target_field="packages",
        source_columns=[
            "PACKAGES", "Packages", "NO OF PACKAGES", "No Of Package Type",
            "Package Type", "TOTAL PACKAGES", "NO OF PACKAGES ITEM",
            "BULKS", "Bulks", "CONTAINER", "Container", "PACKAGE UNIT",
            "QUANTITY OF PACKAGES", "PACKAGES QUANTITY", "NUMBER OF PRODUCTS"
        ],
        transform=clean_string
    ),

    # Pricing - Unit Prices
    FieldMapping(
        target_field="unit_price",
        source_columns=[
            "ITEM_RATE_IN_FC", "Unit_Value_As_Per_Invoice", "UNITPRICE",
            "Unit Rate in FC", "ITEM_RATE", "UNITARY VALUE",
            "UNT PRICE FC", "UNIT PRICE FC", "Unit_Price_FC", "UNIT_VALUE_FC",
            "Unit Rate in Foreign Currency", "PRICE KG", "Price Kg",
            "FOB PER UNIT", "Fob Per Unit"
        ],
        transform=clean_numeric
    ),
    FieldMapping(
        target_field="unit_price_usd",
        source_columns=[
            "Unit_Rate_USD", "Unit_Value_USD_Exchange", "UNIT_VALUE_USD",
            "Unit_Price USD"
        ],
        transform=clean_numeric
    ),
    FieldMapping(
        target_field="unit_price_inr",
        source_columns=[
            "Unit_Rate_in_INR", "Unit_Value_In_INR", "UNIT_VALUE_INR",
            "UNT PRICE INR", "Unit_Price inr"
        ],
        transform=clean_numeric
    ),

    # Currency
    FieldMapping(
        target_field="currency",
        source_columns=[
            "CURRENCY", "Currency", "INVOICECURRENCY", "INVOICE_Currency",
            "INVOICE_CURRENCY", "CURR", "Unit Rate Currency"
        ],
        transform=clean_currency
    ),
    FieldMapping(
        target_field="exchange_rate",
        source_columns=["Exchange_Rate", "Exchange_Rate_USD", "EXCHANGE_USD"],
        transform=clean_numeric
    ),

    # Total Values
    FieldMapping(
        target_field="total_value_fc",
        source_columns=[
            "Total_Value_IN_FC", "Total_Value_in_FC", "TOTAL_VALUE_FC",
            "Total Value in FC", "Value IN FC", "INV VALUE FC",
            "FOB VALUE FC", "CIF IN FOREIGN CURRENCY"
        ],
        transform=clean_numeric
    ),
    FieldMapping(
        target_field="total_value_usd",
        source_columns=[
            "Total_Value_IN_USD", "Total_Value_USD_Exchange", "TOTAL_VALUE_USD",
            "Total Value USD", "FOB VALUE IN USD", "FOB VALUE USD",
            "CIF VALUE USD", "CIF VALUE IN USD", "TOTAL VALUE USD",
            "TOTAL FOB VALUE IN USD", "Sum of Total Value USD"
        ],
        transform=clean_numeric
    ),
    FieldMapping(
        target_field="total_value_inr",
        source_columns=[
            "ACCESS_VALUE_IN_INR", "Total FOB Value in INR", "TOTAL_ASS_VALUE"
        ],
        transform=clean_numeric
    ),
    FieldMapping(
        target_field="fob_value",
        source_columns=[
            "FOB", "FOBVALUEINRS", "VALUE FOB",
            "FOB in INR", "FOB in USD", "FOB INR", "FOB_in_INR",
            "TOTAL FOB", "Total FOB", "ITEM FOB", "Item FOB",
            "FOB TOTAL", "ITEM FOB USD FIRST", "ITEM FOB USD LAST",
            "TOTAL FOB USD FIRST", "TOTAL FOB USD LAST", "FOB VALUE",
            "FOB (USD)", "US$ FOB", "FOB VALUE USD", "TOTAL FOB VALUE",
            "Assessed Fob FC", "Sum of Assessed FOB FC", "Assessed Fob GHS",
            "Sum of Assessed FOB GHS"
        ],
        transform=clean_numeric
    ),
    FieldMapping(
        target_field="cif_value",
        source_columns=[
            "CIF", "TOTAL CIF", "Total CIF", "ITEM CIF", "Item CIF",
            "CIF TOTAL", "CIF TOTAL FIRST BOB", "CIF TOTAL LAST BOB",
            "CIF (USD)", "CIF IN USD", "CIF VALUE", "CIF VALUE CDF",
            "CIF VALUE ETB", "CIF VALUE IN WEST AFRICAN CFA FRANC"
        ],
        transform=clean_numeric
    ),
    FieldMapping(
        target_field="freight_value",
        source_columns=[
            "FREIGHT", "Freight", "TOTAL FREIGHT", "US$ FREIGHT",
            "ITEM FREIGHT", "Assessed Freight FC", "Freight BWP"
        ],
        transform=clean_numeric
    ),
    FieldMapping(
        target_field="insurance_value",
        source_columns=[
            "INSURANCE", "Insurance", "TOTAL INSURANCE", "ITEM INSURANCE"
        ],
        transform=clean_numeric
    ),
    FieldMapping(
        target_field="duty_value",
        source_columns=[
            "DUTY", "Duty", "Total_Duty_Paid Inr", "IMPORT DUTY",
            "EXPORT DUTY", "IMPORT DUTY GYD", "EXPORT DUTY GYD",
            "Sum of Import Duty", "Sum of Export Duty"
        ],
        transform=clean_numeric
    ),
    FieldMapping(
        target_field="tax_value",
        source_columns=["TAX", "Tax", "VAT", "VAT GYD", "Vat"],
        transform=clean_numeric
    ),
    FieldMapping(
        target_field="drawback_value",
        source_columns=["DRAWBACK", "DRAWBAKDVALUE", "Drawback", "DWARBACK"],
        transform=clean_numeric
    ),
    FieldMapping(
        target_field="local_currency_value",
        source_columns=[
            "Total Value GHS", "TOTAL VALUE GYD", "CIF VALUE CDF",
            "CIF VALUE ETB", "Total Value BWP", "Invoice Amount BWP"
        ],
        transform=clean_numeric
    ),

    # Ports - Indian
    FieldMapping(
        target_field="indian_port",
        source_columns=[
            "INDIAN_PORT", "Indian_Port", "Indian Port", "PORT", "location",
            "Port of Loading", "PORT OF LOADING"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="indian_port_code",
        source_columns=[
            "PORT_CODE", "Port_Code", "PORT CODE", "Port Code",
            "CUSTOMHOUSECODE", "CUSH", "PORT_CD", "POS"
        ],
        transform=clean_string
    ),

    # Ports - Foreign
    FieldMapping(
        target_field="foreign_port",
        source_columns=[
            "FOREIGNPORT", "FOREIGN_PORT", "Foreign_Port", "Foreign Port",
            "Forign Port", "PORT OF DESTINATION", "Port of Destination",
            "PORT OF DISCHARGE", "Place Of Discharge", "Port Of Entry",
            "ORIGIN PORT", "Origin Port", "LANDING PORT", "Landing Port",
            "UNLOADING PLACE", "Unloading Place", "DESTINATION PORT",
            "Destination Port", "PORT OF EXIT", "Port of Exit",
            "Port of Unloading", "Port of Shipment", "PORT NAME", "Port Name"
        ],
        transform=clean_string
    ),

    # Transport
    FieldMapping(
        target_field="mode_of_transport",
        source_columns=[
            "MODE", "Mode", "VIA TRANSPORTATION", "Mode of Shipment",
            "MODE OF TRANSPORT", "Mode of Transport", "TRANSPORT MODE",
            "Transport Mode", "ORIGIN TRANSPORT MODE", "TRANSPORT TYPE",
            "Transport Type"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="transport_company",
        source_columns=[
            "TRANSPORT COMPANY", "Transport Company", "TRANSPORT CORPORATION",
            "Transport Corporation", "CARRIER", "Carrier"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="vessel_name",
        source_columns=["SHIP NAME", "Ship Name", "Vessel Name", "VESSEL"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="load_type",
        source_columns=["LOAD TYPE", "Load Type", "Container Type"],
        transform=clean_string
    ),

    # Countries
    FieldMapping(
        target_field="origin_country",
        source_columns=[
            "ORIGIN_COUNTRY", "COUNTRY ORIGIN DESTINATION", "ORIGIN COUNTRY",
            "Origin Country", "Export Country", "EXPORT COUNTRY", "COUNTRY PROCEED",
            "SALES COUNTRY", "SHIPPING COUNTRY", "Shipping Country",
            "PROVENANCE COUNTRY", "Provenance Country", "COUNTRY CONSIGNMENT",
            "Country Consignment", "ACQUIRE", "COUNTRY ACQUIRED", "Country Acquired"
        ],
        transform=clean_country
    ),
    FieldMapping(
        target_field="destination_country",
        source_columns=[
            "FOREIGNCOUNTRY", "COUNTRYOFDESTINATIONNAME", "Country", "COUNTRY",
            "COUNTRY OF DESTINATION", "Ctry of Destination", "Foreign_Country",
            "FOREIGN_COUNTRY", "Foreign Country", "foreign Country",
            "DESTINATION COUNTRY", "Destination Country", "DESTINATION  COUNTRY",
            "COUNTRY DESTINATION", "Country Destination", "BUYER COUNTRY",
            "Buyer Country"
        ],
        transform=clean_country
    ),

    # Time period
    FieldMapping(
        target_field="trade_month",
        source_columns=["MONTH", "Month", "MONTHS"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="trade_year",
        source_columns=["YEAR", "Year"],
        transform=clean_integer
    ),
    FieldMapping(
        target_field="trade_period",
        source_columns=["PERIOD", "Period"],
        transform=clean_string
    ),

    # Clearance
    FieldMapping(
        target_field="cha_name",
        source_columns=["CHA_NUMBER", "CHA", "CHA_Name"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="shipment_type",
        source_columns=[
            "TYP", "SHIPMENT_STATUS", "Type", "TYPE", "TRANS TYPE",
            "Trans Type", "Transaction Type"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="customs_info",
        source_columns=[
            "CUSTOMS", "Customs", "Customs Info", "CUSTOM", "Custom",
            "CUSTOMS NAME", "Customs Name", "OFFICE NAME", "Office Name",
            "Declaration Office"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="incoterms",
        source_columns=["INCOTERMS", "Incoterms", "Incoterm"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="currency_name",
        source_columns=["CURRENCY NAME", "Currency Name"],
        transform=clean_string
    ),

    # System ID (for tracking)
    FieldMapping(
        target_field="system_id",
        source_columns=["System_ID"],
        transform=clean_string
    ),
]


# =============================================================================
# PRODUCT TABLE MAPPINGS
# =============================================================================

def clean_price_value(value: Any) -> Optional[float]:
    """Clean price values with currency symbols."""
    if value is None:
        return None
    s = str(value)
    # Remove currency symbols and unit indicators
    s = s.replace('₹', '').replace('Rs', '').replace('Rs.', '')
    s = s.replace('/Kg', '').replace('/Tonne', '').replace('/kg', '').replace('/tonne', '')
    return clean_numeric(s)


PRODUCT_FIELD_MAPPINGS: List[FieldMapping] = [
    FieldMapping(
        target_field="name",
        source_columns=[
            "Product Detail", "Product Name", "Item Name", "Product",
            "Product Description", "Description"
        ],
        transform=clean_string,
        required=True
    ),
    FieldMapping(
        target_field="category",
        source_columns=["Product Category", "Category", "Consumer Type", "Consumer  type"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="price_value",
        source_columns=["Price", "Price (₹/Kg or ₹/Tonne)"],
        transform=clean_price_value
    ),
    FieldMapping(
        target_field="packaging_info",
        source_columns=["Weight/Packaging", "Packaging"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="city",
        source_columns=["City", "CITY"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="manufacturer_name",
        source_columns=["Exporter Name", "Wholesaler/Manufacturer", "Manufacturer", "Supplier Name"],
        transform=clean_string
    ),
]


# =============================================================================
# ENTITIES TABLE MAPPINGS (flexible catch-all)
# =============================================================================

ENTITIES_FIELD_MAPPINGS: List[FieldMapping] = [
    FieldMapping(
        target_field="name",
        source_columns=[
            "name", "Name", "full_name", "Full Name", "contact_name", "person",
            "contact", "investor", "investor_name", "firm", "fund", "organization",
        ],
        transform=clean_string,
        required=True
    ),
    FieldMapping(
        target_field="description",
        source_columns=["description", "bio", "profile", "summary", "notes"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="entity_type",
        source_columns=["entity_type", "type", "role", "category"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="subtype",
        source_columns=["subtype", "stage", "round_type", "designation", "title"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="country",
        source_columns=["country", "country_name"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="country_code",
        source_columns=["country_code", "iso3"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="state",
        source_columns=["state", "state_name", "province"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="city",
        source_columns=["city", "city_name"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="address_full",
        source_columns=["address", "full_address", "address_full"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="tags",
        source_columns=["tags", "labels", "segments", "sectors"],
        transform=parse_list
    ),
    # Contact fields (folded into contact_info downstream)
    FieldMapping(target_field="email", source_columns=["email", "email_id", "contact_email"], transform=clean_string),
    FieldMapping(target_field="phone", source_columns=["phone", "phone_number", "contact_phone"], transform=clean_string),
    FieldMapping(target_field="mobile", source_columns=["mobile", "mobile_number"], transform=clean_string),
    FieldMapping(target_field="website", source_columns=["website", "url"], transform=clean_string),
    FieldMapping(target_field="contact_person", source_columns=["contact_person", "primary_contact"], transform=clean_string),
]


# =============================================================================
# PEOPLE TABLE MAPPINGS (canonical contacts)
# =============================================================================

PEOPLE_FIELD_MAPPINGS: List[FieldMapping] = [
    FieldMapping(
        target_field="full_name",
        source_columns=[
            "CONTACT PERSON", "ContactPerson", "Contact Person", "contact_person",
            "Exporter_Contact", "Exporter_Person_Name",
            "Exporter_Contact_Person_1", "Exporter_Contact_Person_2"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="company_name",
        source_columns=[
            "Company Name", "COMPANY NAME", "EXPORTERNAME", "Exporter_Name",
            "EXPORTER", "IMPORTER", "Supplier Name", "Supplier_Name",
            "CONSINEENAME", "CONSIGNEENAME", "Consignee_Name"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="email",
        source_columns=[
            "EMAIL", "E_MAIL_ID", "Email Ids.", "EMAILID", "Email id",
            "Exporter_Email", "EXPORTER_EMAIL", "Exporter_mail", "E-MAIL"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="phone",
        source_columns=[
            "PHONE", "CONTACT_NO", "CONTACTNO", "Contact No.", "CONTACT NO",
            "Exporter_Phone", "EXPORTER_PHONE", "MOBILE", "MOBILE_NO"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="mobile",
        source_columns=["MOBILE", "MOBILE_NO", "Mobile"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="website",
        source_columns=["Website", "WEBSITE", "Web"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="country",
        source_columns=[
            "Country", "COUNTRY", "FOREIGNCOUNTRY", "ORIGIN_COUNTRY",
            "COUNTRYOFDESTINATIONNAME", "Country ORIGIN DESTINATION",
            "Consignee_Country", "COUNTRY OF DESTINATION", "Ctry of Destination",
            "Foreign Country", "foreign Country", "Foreign_Country", "FOREIGN_COUNTRY"
        ],
        transform=clean_country
    ),
    FieldMapping(
        target_field="state",
        source_columns=[
            "State", "STATE", "Exporter_City_State", "Exporter_City_State.1",
            "Importer_City_State", "CITY/ STATE", "City/ State", "CITY_STATE",
            "EXPORTER CITY/STATE"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="city",
        source_columns=["City", "CITY", "Exporter_City", "EXPORTER CITY", "Exporter City"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="postal_code",
        source_columns=["Pin Code", "Pin_Code", "PIN", "Exporter_PIN", "PIN CODE", "EXPORTER PIN", "EXPORTER PIN CODE", "Importer_PIN"],
        transform=clean_string
    ),
]


# =============================================================================
# INVESTOR TABLE MAPPINGS (derived parties)
# =============================================================================

INVESTOR_FIELD_MAPPINGS: List[FieldMapping] = [
    FieldMapping(
        target_field="name",
        source_columns=[
            "IMPORTER", "Importer_Name", "IMPORTER NAME", "Importer Names", "Importer_Names",
            "EXPORTERNAME", "Exporter_Name", "EXPORTER", "Exporter Name", "EXPORTER NAME",
            "SUPPLIER_NAME", "Supplier_Name", "Supplier Name",
            "CONSINEENAME", "CONSIGNEENAME", "Consignee_Name", "Consignee"
        ],
        transform=clean_string,
        required=True
    ),
    FieldMapping(
        target_field="country",
        source_columns=[
            "Country", "COUNTRY", "FOREIGNCOUNTRY", "ORIGIN_COUNTRY",
            "COUNTRYOFDESTINATIONNAME", "Country ORIGIN DESTINATION",
            "Consignee_Country", "COUNTRY OF DESTINATION", "Ctry of Destination",
            "Foreign Country", "foreign Country", "Foreign_Country", "FOREIGN_COUNTRY"
        ],
        transform=clean_country
    ),
    FieldMapping(
        target_field="state",
        source_columns=[
            "State", "STATE", "Exporter_City_State", "Exporter_City_State.1",
            "Importer_City_State", "CITY/ STATE", "City/ State", "CITY_STATE"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="city",
        source_columns=["City", "CITY", "Exporter_City", "EXPORTER CITY", "Exporter City"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="email",
        source_columns=["EMAIL", "E_MAIL_ID", "Email Ids.", "EMAILID", "Email id", "E-MAIL"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="phone",
        source_columns=["PHONE", "CONTACT_NO", "CONTACTNO", "Contact No.", "CONTACT NO", "MOBILE", "MOBILE_NO"],
        transform=clean_string
    ),
]


# =============================================================================
# ROUNDS TABLE MAPPINGS (period seeds for aggregation)
# =============================================================================

ROUND_FIELD_MAPPINGS: List[FieldMapping] = [
    FieldMapping(
        target_field="trade_year",
        source_columns=["YEAR", "Year"],
        transform=clean_integer
    ),
    FieldMapping(
        target_field="trade_month",
        source_columns=["MONTH", "Month", "MONTHS"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="trade_period",
        source_columns=["PERIOD", "Period"],
        transform=clean_string
    ),
    FieldMapping(
        target_field="hs_code",
        source_columns=[
            "HS_CODE", "HS_Code", "Hs_Code", "HSCODE", "HS CODE",
            "RITC_Code", "RITCCODE", "RITS code", "4 Digit HS Code"
        ],
        transform=clean_hs_code
    ),
    FieldMapping(
        target_field="hs_chapter",
        source_columns=["CHAPTER", "Chapter", "CH", "CHP", "CHAPTER's", "2 DIGIT"],
        transform=clean_integer
    ),
    FieldMapping(
        target_field="product_description",
        source_columns=[
            "ProductDescription", "PRODUCTDESCRIPITION", "GOODSDESCRIPTION",
            "Item_Description", "ITEM", "ITME", "PRODUCT DESCRIPTION",
            "HS CODE DESCRIPTION", "Product_Description", "PRODUCT_DESCRIPITION",
            "HSN_DESCRIPTION", "RITC DESCRIPTION", "Description", "Product"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="company_name",
        source_columns=[
            "EXPORTERNAME", "Exporter_Name", "EXPORTER", "Exporter Name", "EXPORTER NAME",
            "Importer_Name", "IMPORTER NAME", "IMPORTER", "Supplier_Name", "Supplier Name"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="country",
        source_columns=[
            "Country", "COUNTRY", "FOREIGNCOUNTRY", "ORIGIN_COUNTRY",
            "COUNTRYOFDESTINATIONNAME", "COUNTRY OF DESTINATION", "Foreign Country",
            "foreign Country", "Foreign_Country", "FOREIGN_COUNTRY", "Consignee_Country"
        ],
        transform=clean_country
    ),
]


# =============================================================================
# DEALS (CANONICAL) MAPPINGS
# =============================================================================

DEAL_FIELD_MAPPINGS: List[FieldMapping] = [
    *TRADE_RECORD_FIELD_MAPPINGS,
    # Canonical aliases for parties
    FieldMapping(
        target_field="seller_name",
        source_columns=[
            "EXPORTERNAME", "Exporter_Name", "EXPORTER", "Exporter Name", "EXPORTER NAME",
            "Exporter Names", "Exporter_Names", "SUPPLIER_NAME", "Supplier_Name", "Supplier Name"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="seller_address",
        source_columns=[
            "EXPORTERADDRESS", "Exporter_Address", "Exporter Address",
            "EXPORTER_ADDRESS", "EXPORTER ADDRESS", "Exporter_Add", "Exporter Address & state",
            "SUPPLIER_ADDRESS", "Supplier_Address", "Supplier_Add1"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="buyer_name",
        source_columns=[
            "IMPORTER", "Importer_Name", "IMPORTER NAME", "Importer Names", "Importer_Names",
            "CONSINEENAME", "CONSIGNEENAME", "Consignee_Name", "Consignee", "CONSIGNEE"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="buyer_address",
        source_columns=[
            "IMPORTERADDRESS", "Importer_Address", "IMPORTER ADDRESS", "Importer Address",
            "CONSINEEADDRESS", "CONSIGNEEADDRESS", "Consignee_Address",
            "CONSINEE_ADDRESS", "CONSIGNEE_ADDRESS", "CONSIGNEE ADD"
        ],
        transform=clean_string
    ),
    FieldMapping(
        target_field="buyer_country",
        source_columns=[
            "FOREIGNCOUNTRY", "COUNTRYOFDESTINATIONNAME", "COUNTRY OF DESTINATION",
            "Ctry of Destination", "Foreign_Country", "FOREIGN_COUNTRY", "Foreign Country",
            "foreign Country", "Consignee_Country"
        ],
        transform=clean_country
    ),
    FieldMapping(
        target_field="seller_country",
        source_columns=["ORIGIN_COUNTRY", "COUNTRY ORIGIN DESTINATION", "Country ORIGIN DESTINATION"],
        transform=clean_country
    ),
    FieldMapping(
        target_field="deal_date",
        source_columns=["SBDATE", "Date", "SBDT", "SB DATE", "SB_DT", "Sbill_Date", "Shipping_Bill_Date", "DATE"],
        transform=clean_date
    ),
]


# =============================================================================
# DATA SOURCE DETECTION
# =============================================================================

def detect_data_source_type(columns: List[str], filename: str) -> tuple:
    """
    Detect the type of data source and target table based on columns and filename.

    Returns: (target_table, data_source_type)
    """
    filename_lower = filename.lower()

    def normalize_key(value: str) -> str:
        import re
        return re.sub(r"[^a-z0-9]", "", value.lower())

    normalized_columns = {normalize_key(c) for c in columns}

    def has_any(indicators: List[str]) -> bool:
        return any(normalize_key(ind) in normalized_columns for ind in indicators)

    # Check for trade records (export/import)
    export_indicators = ['exportername', 'exporter', 'exporter_name', 'sb_no', 'sbno', 'fob']
    import_indicators = ['importer', 'importeraddress', 'supplier_name', 'reg_date']

    if has_any(export_indicators + import_indicators):
        if 'exp' in filename_lower or 'export' in filename_lower:
            return TargetTable.DEALS, 'indian_trade_records', 'export'
        elif 'imp' in filename_lower or 'import' in filename_lower:
            return TargetTable.DEALS, 'indian_trade_records', 'import'
        # Guess based on columns
        if has_any(import_indicators):
            return TargetTable.DEALS, 'indian_trade_records', 'import'
        return TargetTable.DEALS, 'indian_trade_records', 'export'

    # Check for flexible entities (people/investors/rounds/misc)
    entity_indicators = [
        'full name', 'fullname', 'person', 'contact_name', 'bio', 'profile',
        'investor', 'fund', 'valuation', 'round', 'round_type', 'stage', 'designation'
    ]
    if has_any(entity_indicators) or 'investor' in filename_lower or 'round' in filename_lower:
        entity_type = None
        if has_any(['investor', 'fund']):
            entity_type = 'investor'
        elif has_any(['round', 'round_type', 'valuation', 'stage']):
            entity_type = 'round'
        else:
            entity_type = 'person'
        return TargetTable.ENTITIES, 'other', entity_type

    # Check for company directory
    company_indicators = ['company name', 'business details', 'email ids.']
    if has_any(company_indicators):
        if 'international' in filename_lower:
            return TargetTable.COMPANIES, 'company_directory', None
        elif 'india' in filename_lower or 'indian' in filename_lower:
            return TargetTable.COMPANIES, 'company_directory', None
        return TargetTable.COMPANIES, 'company_directory', None

    # Check for product catalog
    product_indicators = ['product detail', 'product category', 'consumer type']
    if has_any(product_indicators):
        return TargetTable.PRODUCTS, 'product_catalog', None

    # Default to trade records
    return TargetTable.DEALS, 'other', None


# =============================================================================
# NORMALIZER FUNCTION
# =============================================================================

def normalize_row(
    row: dict,
    target_table: TargetTable,
    field_mappings: List[FieldMapping]
) -> dict:
    """
    Normalize a raw data row to target schema.

    Returns dict with:
    - mapped fields
    - 'extra' field containing unmapped columns
    - 'raw_data' containing original row
    """
    result = {}
    mapped_columns = set()

    # Apply mappings
    for mapping in field_mappings:
        for source_col in mapping.source_columns:
            if source_col in row:
                value = row[source_col]
                if mapping.transform:
                    value = mapping.transform(value)
                if value is not None:
                    result[mapping.target_field] = value
                    mapped_columns.add(source_col)
                    break

    # Collect unmapped columns into 'extra'
    extra = {}
    for col, value in row.items():
        if col not in mapped_columns:
            cleaned = clean_string(value)
            if cleaned is not None:
                # Clean the column name
                clean_col = col.strip().replace(' ', '_').lower()
                extra[clean_col] = cleaned

    if extra:
        result['extra'] = extra

    # Store raw data
    result['raw_data'] = {k: str(v) if v is not None else None for k, v in row.items()}

    return result


TABLE_MAPPING_REGISTRY: Dict[TargetTable, List[FieldMapping]] = {
    TargetTable.COMPANIES: COMPANY_FIELD_MAPPINGS,
    TargetTable.DEALS: DEAL_FIELD_MAPPINGS,
    TargetTable.TRADE_RECORDS: DEAL_FIELD_MAPPINGS,  # Alias
    TargetTable.PRODUCTS: PRODUCT_FIELD_MAPPINGS,
    TargetTable.ENTITIES: ENTITIES_FIELD_MAPPINGS,
    TargetTable.PEOPLE: PEOPLE_FIELD_MAPPINGS,
    TargetTable.INVESTORS: INVESTOR_FIELD_MAPPINGS,
    TargetTable.ROUNDS: ROUND_FIELD_MAPPINGS,
}


def get_mappings_for_table(table: TargetTable) -> List[FieldMapping]:
    """Get the appropriate field mappings for a target table."""
    return TABLE_MAPPING_REGISTRY.get(table, [])
