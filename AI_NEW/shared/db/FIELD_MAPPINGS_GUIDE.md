# Field Mappings Guide

This document explains how the AI pipeline maps raw Excel columns into the canonical schema. Use it as the reference when adding new data files or modifying mappings.

---

## Overview

The field mapping system (`field_mappings.py`) normalizes columns from diverse raw data sources into consistent tables. Key features:

1. **Multiple source columns -> one target field**: Many column name variations map to a single normalized field.
2. **Automatic transformations**: Cleaning functions for strings, numbers, dates, currencies, and country names.
3. **JSONB `extra`**: Unmapped columns are preserved in `extra`; the full original row is stored in `raw_data`.
4. **Canonical schema alignment**: Canonical tables are `companies`, `deals` (alias `trade_records`), `people`, `investors`, `rounds`, and `products` (see `shared/db/CANONICAL_SCHEMA.md`).

---

## How to Check New Data Files

### Step 1: Extract columns from new files

```python
import pandas as pd
from pathlib import Path

new_file = Path('raw_data/your_new_file.xlsx')
xl = pd.ExcelFile(new_file)

for sheet in xl.sheet_names:
    df = pd.read_excel(xl, sheet_name=sheet, nrows=0)
    print(f"\n=== {sheet} ===")
    for col in df.columns:
        print(f"  - {col}")
```

### Step 2: Compare against existing mappings

Check if each column is already covered in `field_mappings.py`. Look for:
- Exact match in any `source_columns` list.
- Case-insensitive match (mappings handle case variations).
- Similar patterns (e.g., `EXPORTER_NAME` vs `Exporter_Name`).

### Step 3: Add missing mappings

For any unmapped columns, add them to the appropriate `source_columns` list in `field_mappings.py`.

---

## Target Tables & Fields

### 1. Companies (`COMPANY_FIELD_MAPPINGS`)

| Target Field | Description | Sample Source Columns |
|-------------|-------------|----------------------|
| `name` | Company name (required) | Company Name, EXPORTERNAME, IMPORTER, Supplier_Name |
| `country` | Country location | Country, FOREIGNCOUNTRY, COUNTRY OF DESTINATION |
| `state` | State/Province | State, Exporter_City_State, CITY/ STATE |
| `city` | City | City, EXPORTER CITY |
| `pin_code` | Postal/ZIP code | Pin Code, Pin_Code, EXPORTER PIN |
| `address_full` | Full address | EXPORTERADDRESS, Exporter_Address, CONSIGNEE ADD |
| `iec_code` | India Export Code | IEC, IEC_NO, EXPORTER ID |
| `iec_pan` | PAN linked to IEC | IEC_PAN |
| `iec_established` | IEC establishment date | IEC_Date_of_Establishment |
| `business_details` | Business description | Details, BUSINESS DETAILS, Consumer Type |
| `email` | Email address | EMAIL, EMAILID, E_MAIL_ID |
| `phone` | Phone number | PHONE, CONTACTNO, Contact No. |
| `contact_person` | Contact person name | CONTACT PERSON, Exporter_Contact |
| `website` | Website URL | Website, WEBSITE |

### 2. Deals (canonical) (`DEAL_FIELD_MAPPINGS` / `TRADE_RECORD_FIELD_MAPPINGS`)

| Target Field | Description | Sample Source Columns |
|-------------|-------------|----------------------|
| `sb_number` | Shipping Bill Number | SBNUMBER, SB_No, Sbill_No, BE_NO |
| `sb_date` | Shipping Bill Date | SBDATE, Date, SBDT, SB DATE |
| `deal_date` | Canonical deal date alias | SBDATE, Date, SB DATE |
| `reg_date` | Registration Date | REG_DATE |
| `invoice_number` | Invoice Number | INVOICE NO, Invoice No., INVOICE_NO |
| `exporter_name` / `seller_name` | Exporter/seller name | EXPORTERNAME, Exporter_Name, EXPORTER, Supplier_Name |
| `exporter_address` / `seller_address` | Exporter/seller address | EXPORTERADDRESS, Exporter_Address, SUPPLIER_ADDRESS |
| `exporter_iec` | Exporter IEC code | IEC, IEC_NO |
| `importer_name` / `buyer_name` | Importer/buyer name | IMPORTER, Importer_Name, CONSINEENAME |
| `importer_address` / `buyer_address` | Importer/buyer address | IMPORTERADDRESS, Consignee_Address |
| `consignee_name` | Consignee name | CONSINEENAME, CONSIGNEENAME, Consignee |
| `consignee_address` | Consignee address | CONSINEEADDRESS, Consignee_Address |
| `consignee_country` / `buyer_country` | Consignee/buyer country | Consignee_Country, FOREIGNCOUNTRY |
| `supplier_name` | Supplier name | SUPPLIER_NAME, Supplier_Name |
| `supplier_address` | Supplier address | SUPPLIER_ADDRESS, Supplier_Add1 |
| `hs_code` | HS Code | HS_CODE, HS_Code, RITC_Code, HSCODE |
| `hs_chapter` | HS Chapter (2 digits) | CHAPTER, Chapter, CH, CHP |
| `ritc_code` | RITC Code | RITC, RITC_2, RITC_4 |
| `product_description` | Product description | ProductDescription, GOODSDESCRIPTION, ITEM |
| `item_number` | Item number | Item Number |
| `product_group` | Product group | A_Group |
| `quantity` | Quantity | QUANTITY, Quantity, QTY |
| `unit_of_measurement` | Unit (KGS, MTS, etc.) | UNITQUANTITY, UQC, Unit |
| `net_weight_kg` | Net weight in KG | NET WEIGHT, Net_Weight |
| `unit_price` | Unit price (FC) | ITEM_RATE_IN_FC, Unit Rate in FC, UNITPRICE |
| `unit_price_usd` | Unit price in USD | Unit_Rate_USD, Unit_Price USD |
| `unit_price_inr` | Unit price in INR | Unit_Rate_in_INR, UNT PRICE INR |
| `currency` | Currency code | CURRENCY, Currency, INVOICECURRENCY |
| `exchange_rate` | Exchange rate | Exchange_Rate, Exchange_Rate_USD |
| `total_value_fc` | Total value (FC) | Total_Value_IN_FC, Value IN FC |
| `total_value_usd` | Total value in USD | Total_Value_IN_USD, Total Value USD |
| `total_value_inr` | Total value in INR | ACCESS_VALUE_IN_INR, Total FOB Value in INR |
| `fob_value` | FOB value | FOB, FOBVALUEINRS, FOB in INR |
| `duty_value` | Duty amount | DUTY, Total_Duty_Paid Inr |
| `drawback_value` | Drawback amount | DRAWBACK, DRAWBAKDVALUE, DWARBACK |
| `indian_port` | Indian port name | INDIAN_PORT, PORT, Port of Loading |
| `indian_port_code` | Indian port code | PORT_CODE, CUSH, POS |
| `foreign_port` | Foreign port name | FOREIGNPORT, PORT OF DESTINATION, PORT OF DISCHARGE |
| `mode_of_transport` | Transport mode | MODE, Mode of Shipment |
| `origin_country` / `seller_country` | Origin/seller country | ORIGIN_COUNTRY |
| `destination_country` | Destination country | FOREIGNCOUNTRY, COUNTRY OF DESTINATION |
| `trade_month` | Trade month | MONTH, Month, MONTHS |
| `trade_year` | Trade year | YEAR, Year |
| `trade_period` | Trade period | PERIOD, Period |
| `cha_name` | Customs House Agent | CHA_NUMBER, CHA_Name |
| `shipment_type` | Shipment type | TYP, SHIPMENT_STATUS, TYPE |
| `system_id` | Source system ID | System_ID |

### 3. People (`PEOPLE_FIELD_MAPPINGS`)

| Target Field | Description | Sample Source Columns |
|-------------|-------------|----------------------|
| `full_name` | Contact person | CONTACT PERSON, Exporter_Contact, ContactPerson |
| `company_name` | Attached company | Company Name, EXPORTERNAME, IMPORTER, Supplier Name |
| `email` | Email | EMAIL, EMAILID, E_MAIL_ID |
| `phone` | Phone | PHONE, CONTACTNO, Contact No., MOBILE |
| `mobile` | Mobile | MOBILE, MOBILE_NO |
| `website` | Website | Website, WEBSITE |
| `country` | Country | Country, FOREIGNCOUNTRY, Consignee_Country |
| `state` | State | State, Exporter_City_State, CITY/ STATE |
| `city` | City | City, EXPORTER CITY |
| `postal_code` | ZIP/Pin | Pin Code, PIN, EXPORTER PIN |

### 4. Investors (`INVESTOR_FIELD_MAPPINGS`)

| Target Field | Description | Sample Source Columns |
|-------------|-------------|----------------------|
| `name` | Party name (importer/exporter/supplier/consignee) | IMPORTER, EXPORTERNAME, SUPPLIER_NAME, CONSIGNEENAME |
| `country` | Country | Country, FOREIGNCOUNTRY, ORIGIN_COUNTRY |
| `state` | State | State, Exporter_City_State |
| `city` | City | City, EXPORTER CITY |
| `email` | Email | EMAIL, EMAILID, E_MAIL_ID |
| `phone` | Phone | PHONE, CONTACT_NO, MOBILE |

### 5. Rounds (`ROUND_FIELD_MAPPINGS`)

| Target Field | Description | Sample Source Columns |
|-------------|-------------|----------------------|
| `trade_year` | Year | YEAR |
| `trade_month` | Month | MONTH |
| `trade_period` | Period label | PERIOD |
| `hs_code` | HS Code | HS_CODE, RITC_Code |
| `hs_chapter` | HS Chapter | CHAPTER, CH |
| `product_description` | Product description | ProductDescription, GOODSDESCRIPTION |
| `company_name` | Party | EXPORTERNAME, IMPORTER |
| `country` | Country | Country, FOREIGNCOUNTRY, Consignee_Country |

### 6. Products (`PRODUCT_FIELD_MAPPINGS`)

| Target Field | Description | Sample Source Columns |
|-------------|-------------|----------------------|
| `name` | Product name (required) | Product Detail, Product Name, Product |
| `category` | Product category | Product Category, Category, Consumer Type |
| `price_value` | Price amount | Price, Price (?/Kg or ?/Tonne) |
| `packaging_info` | Packaging details | Weight/Packaging, Packaging |
| `city` | City of origin | City |
| `manufacturer_name` | Manufacturer name | Exporter Name, Wholesaler/Manufacturer |

---

## How to Add New Mappings

### Adding a new source column to existing field

Find the appropriate `FieldMapping` in `field_mappings.py` and add the new column name:

```python
# Before
FieldMapping(
    target_field="exporter_name",
    source_columns=["EXPORTERNAME", "Exporter_Name", "EXPORTER"],
    transform=clean_string
),

# After (adding "SHIPPER_NAME")
FieldMapping(
    target_field="exporter_name",
    source_columns=["EXPORTERNAME", "Exporter_Name", "EXPORTER", "SHIPPER_NAME"],
    transform=clean_string
),
```

### Adding a completely new field

1. **Add to schema** (`schema.sql`):
```sql
-- In the appropriate table
new_field_name VARCHAR(100),
```

2. **Add mapping** (`field_mappings.py`):
```python
FieldMapping(
    target_field="new_field_name",
    source_columns=["Source Column 1", "Source_Column_2"],
    transform=clean_string  # or appropriate transform
),
```

---

## Transformation Functions

| Function | Purpose | Use For |
|----------|---------|---------|
| `clean_string` | Trim, normalize spaces, handle nulls | Text fields |
| `clean_numeric` | Parse numbers, remove currency symbols | Numeric values |
| `clean_integer` | Parse integers | Counts, years |
| `clean_date` | Parse dates to ISO format | Date fields |
| `clean_hs_code` | Extract numeric HS code | HS codes |
| `clean_country` | Normalize country names | Country fields |
| `clean_currency` | Normalize currency codes | Currency codes |
| `clean_price_value` | Handle prices with units | Price fields |

---

## Data Source Detection

The `detect_data_source_type()` function determines:
- Target table (companies, deals/trade_records, products; people/investors derive from the same rows).
- Data source type.
- Record type (export/import for deals).

Based on:
- Column names present in the data.
- Filename patterns (e.g., "exp" -> export, "imp" -> import).

---

## Common Column Patterns by Data Type

### Indian Trade Data (Export)
```
EXPORTERNAME, EXPORTER_ADDRESS, IEC, HS_CODE, SBDT, FOB,
INDIAN_PORT, FOREIGNCOUNTRY, QUANTITY, CURRENCY
```

### Indian Trade Data (Import)
```
IMPORTER, IMPORTERADDRESS, SUPPLIER_NAME, SUPPLIER_ADDRESS,
HS_CODE, DUTY, ORIGIN_COUNTRY, REG_DATE
```

### International Buyer Data
```
Company Name, Country, City, Contact No., Email Ids.,
BUSINESS DETAILS, Website
```

### Product Catalog
```
Product Detail, Product Category, Price, City,
Wholesaler/Manufacturer, Consumer Type
```

---
## Folding Strategy (no new tables)

- `people` / `investors` mappings are folded into existing tables:
  - Contacts go into `companies.contact_info` and `companies.extra.contacts` with roles when available.
  - Party aliases (importer/exporter/supplier/consignee) live in `extra.parties` on deals.
- `rounds` mappings are used for derived aggregates (views/materialized views) and are not stored as a separate table.
- All unmapped columns always land in `extra`; the original row is kept in `raw_data` for lossless recovery.

---
## Notes

- **Case sensitivity**: Mappings match exact case, but normalization comparison ignores case.
- **Unmapped columns**: Automatically stored in `extra` JSONB—no data is lost.
- **Priority**: First matching source column wins (order matters in lists).
- **Required fields**: Only `name` is required for companies/products; `full_name` is required for people contacts when present.

---

## Last Updated

2025-12-17 — Added canonical tables (companies, deals, people, investors, rounds) and refreshed alias mappings.
