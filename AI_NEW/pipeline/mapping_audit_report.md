# Mapping Audit Report

Generated: 2025-12-20T22:16:35.589147Z

## Summary
- Total entries (file or sheet): 112
- Status counts: OK=86, WARN=26, BLOCKER=0
- Target tables: companies=2, deals=109, products=1

## File Results

### 2309_export__Export_Records.csv
- Path: pipeline\csv\2309_export__Export_Records.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: WARN
- Columns: 33 | Mapped: 33 | Coverage: 100%
- Issues:
  - warn: missing date columns (sb_date/reg_date)

### 23_import_sample_2309__Import_Records.csv
- Path: pipeline\csv\23_import_sample_2309__Import_Records.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 33 | Mapped: 33 | Coverage: 100%

### 31_ALL_EXPORT_TO_WORLD_JUNE_25__Sheet1.csv
- Path: pipeline\csv\31_ALL_EXPORT_TO_WORLD_JUNE_25__Sheet1.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: WARN
- Columns: 33 | Mapped: 33 | Coverage: 100%
- Issues:
  - warn: missing product columns (hs_code/product_description/etc)

### 31_ALL_EXPORT_TO_WORLD_MAY_25__Sheet1.csv
- Path: pipeline\csv\31_ALL_EXPORT_TO_WORLD_MAY_25__Sheet1.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: WARN
- Columns: 33 | Mapped: 33 | Coverage: 100%
- Issues:
  - warn: missing product columns (hs_code/product_description/etc)

### 31_ALL_PORT_EXPORT_JULY_2025__Sheet1.csv
- Path: pipeline\csv\31_ALL_PORT_EXPORT_JULY_2025__Sheet1.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: WARN
- Columns: 21 | Mapped: 21 | Coverage: 100%
- Issues:
  - warn: missing product columns (hs_code/product_description/etc)

### 31_ALL_PORT_EXPORT_MAR_2025__Sheet1.csv
- Path: pipeline\csv\31_ALL_PORT_EXPORT_MAR_2025__Sheet1.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: WARN
- Columns: 21 | Mapped: 21 | Coverage: 100%
- Issues:
  - warn: missing product columns (hs_code/product_description/etc)

### 31_ALL_PORT_IMPORT_APR_2025__Sheet1.csv
- Path: pipeline\csv\31_ALL_PORT_IMPORT_APR_2025__Sheet1.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 26 | Mapped: 26 | Coverage: 100%

### 31_EXPORT_AUG_2025__Export_Records.csv
- Path: pipeline\csv\31_EXPORT_AUG_2025__Export_Records.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: WARN
- Columns: 33 | Mapped: 33 | Coverage: 100%
- Issues:
  - warn: missing date columns (sb_date/reg_date)

### 71_ALL_PORT_EXPORT_FEB_2025__Sheet1.csv
- Path: pipeline\csv\71_ALL_PORT_EXPORT_FEB_2025__Sheet1.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 24 | Mapped: 24 | Coverage: 100%

### 85_ALL_PORT_EXPORT_FEB_2025__Export_Data.csv
- Path: pipeline\csv\85_ALL_PORT_EXPORT_FEB_2025__Export_Data.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 24 | Mapped: 24 | Coverage: 100%

### Animal_Feed_Products__Sheet1.csv
- Path: pipeline\csv\Animal_Feed_Products__Sheet1.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: WARN
- Columns: 7 | Mapped: 6 | Coverage: 86%
- Unmapped columns (sample): ['S.no']
- Issues:
  - warn: missing date columns (sb_date/reg_date)
  - warn: missing quantity/weight columns
  - warn: filename suggests products but detected deals

### Animal_Feed_Wholesaler_Detailed__Sheet1.csv
- Path: pipeline\csv\Animal_Feed_Wholesaler_Detailed__Sheet1.csv
- Detected: products (source_type=product_catalog)
- Status: OK
- Columns: 8 | Mapped: 7 | Coverage: 88%
- Unmapped columns (sample): ['S.No']

### Aug24EXP1_xlsx_19_1__Sheet1.csv
- Path: pipeline\csv\Aug24EXP1_xlsx_19_1__Sheet1.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 22 | Mapped: 22 | Coverage: 100%

### Aug24EXP1_xlsx_31__Sheet1.csv
- Path: pipeline\csv\Aug24EXP1_xlsx_31__Sheet1.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 22 | Mapped: 22 | Coverage: 100%

### CH_1_50_Exp_feb_2025__Sheet1.csv
- Path: pipeline\csv\CH_1_50_Exp_feb_2025__Sheet1.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: WARN
- Columns: 20 | Mapped: 20 | Coverage: 100%
- Issues:
  - warn: missing date columns (sb_date/reg_date)

### EXP31DEC24__Sheet1.csv
- Path: pipeline\csv\EXP31DEC24__Sheet1.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: WARN
- Columns: 20 | Mapped: 20 | Coverage: 100%
- Issues:
  - warn: missing product columns (hs_code/product_description/etc)

### IMPORT_31_AUG_2025__Import_Records.csv
- Path: pipeline\csv\IMPORT_31_AUG_2025__Import_Records.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 33 | Mapped: 33 | Coverage: 100%

### Import_74__Import_Records.csv
- Path: pipeline\csv\Import_74__Import_Records.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 33 | Mapped: 33 | Coverage: 100%

### International_Buyer_Importer_From_200_Countries_Data__Sheet1.csv
- Path: pipeline\csv\International_Buyer_Importer_From_200_Countries_Data__Sheet1.csv
- Detected: companies (source_type=company_directory)
- Status: OK
- Columns: 8 | Mapped: 7 | Coverage: 88%
- Unmapped columns (sample): ['S.No.']

### Trade_data__argentina_export.csv
- Path: pipeline\csv\Trade_data__argentina_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 19 | Mapped: 17 | Coverage: 89%
- Unmapped columns (sample): ['SUBITEM FOB', 'SUBITEM QUANTITY']

### Trade_data__argentina_import.csv
- Path: pipeline\csv\Trade_data__argentina_import.csv
- Detected: deals (source_type=other)
- Status: OK
- Columns: 26 | Mapped: 24 | Coverage: 92%
- Unmapped columns (sample): ['SUBITEM FOB', 'SUBITEM QUANTITY']

### Trade_data__bangladesh_export.csv
- Path: pipeline\csv\Trade_data__bangladesh_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 40 | Mapped: 25 | Coverage: 62%
- Unmapped columns (sample): ['PACKAGE UNIT CODE', 'PACKAGE UNIT NAME', 'DECLARED UNIT PRICE FC', 'ASSESSABLE UNIT PRICE FC', 'ITEM PRICE FC', 'TOTAL INVOICE VALUE FC', 'ASSESSABLE VALUE BDT', 'ASSESSABLE VALUE USD', 'TOTAL DECLARATION', 'DELIVERY TERMS']

### Trade_data__bangladesh_import.csv
- Path: pipeline\csv\Trade_data__bangladesh_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 43 | Mapped: 24 | Coverage: 56%
- Unmapped columns (sample): ['MARKS NUMBERS', 'ITEMS', 'TOTOAL PACKAGES', 'PACKAGE UNIT CODE', 'PACKAGE UNIT NAME', 'DECLARED UNIT PRICE FC', 'ASSESSABLE UNIT PRICE FC', 'ITEM PRICE FC', 'TOTAL INVOICE VALUE FC', 'ASSESSABLE VALUE BDT']

### Trade_data__bolivia_export.csv
- Path: pipeline\csv\Trade_data__bolivia_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 27 | Mapped: 26 | Coverage: 96%
- Unmapped columns (sample): ['CHANNEL']

### Trade_data__bolivia_import.csv
- Path: pipeline\csv\Trade_data__bolivia_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 29 | Mapped: 28 | Coverage: 97%
- Unmapped columns (sample): ['CHANNEL']

### Trade_data__botswana_export.csv
- Path: pipeline\csv\Trade_data__botswana_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 29 | Mapped: 26 | Coverage: 90%
- Unmapped columns (sample): ['Net Weight UOM', 'Customs Value BWP', 'Customs Value USD']

### Trade_data__botswana_import.csv
- Path: pipeline\csv\Trade_data__botswana_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 34 | Mapped: 30 | Coverage: 88%
- Unmapped columns (sample): ['ORIGIN Origin Country', 'Net Weight UOM', 'Customs Value Bwp', 'Customs value USD']

### Trade_data__brazil_export.csv
- Path: pipeline\csv\Trade_data__brazil_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 17 | Mapped: 14 | Coverage: 82%
- Unmapped columns (sample): ['UA LOCAL DISBQ.\xa0PACKAGE', 'UF UNBQ. PACKAGE', 'ITEMS. COMMERCIAL']

### Trade_data__brazil_import.csv
- Path: pipeline\csv\Trade_data__brazil_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: WARN
- Columns: 17 | Mapped: 17 | Coverage: 100%
- Issues:
  - warn: missing date columns (sb_date/reg_date)

### Trade_data__chile_export.csv
- Path: pipeline\csv\Trade_data__chile_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 32 | Mapped: 27 | Coverage: 84%
- Unmapped columns (sample): ['US$ FOB UNIT', 'US$ CIF', 'US$ INSURANCE', 'EXPORTER REGION', 'TRANSPORT COMPANY COUNTRY']

### Trade_data__chile_import.csv
- Path: pipeline\csv\Trade_data__chile_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 34 | Mapped: 29 | Coverage: 85%
- Unmapped columns (sample): ['US$ CIF', 'CIF UNIT', 'US$ FOB UNIT', 'US$ INSURANCE', 'TRANSPORT COMPANY COUNTRY']

### Trade_data__colombia_export.csv
- Path: pipeline\csv\Trade_data__colombia_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 24 | Mapped: 24 | Coverage: 100%

### Trade_data__colombia_import.csv
- Path: pipeline\csv\Trade_data__colombia_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 34 | Mapped: 33 | Coverage: 97%
- Unmapped columns (sample): ['LOGISTIC COMPANY']

### Trade_data__costa_rica_export.csv
- Path: pipeline\csv\Trade_data__costa_rica_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: WARN
- Columns: 15 | Mapped: 15 | Coverage: 100%
- Issues:
  - warn: missing value columns (total_value/fob/unit_price)

### Trade_data__costa_rica_import.csv
- Path: pipeline\csv\Trade_data__costa_rica_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: WARN
- Columns: 17 | Mapped: 17 | Coverage: 100%
- Issues:
  - warn: missing value columns (total_value/fob/unit_price)

### Trade_data__dr_congo_export.csv
- Path: pipeline\csv\Trade_data__dr_congo_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 30 | Mapped: 29 | Coverage: 97%
- Unmapped columns (sample): ['SUM OF FOB VALUE FC']

### Trade_data__dr_congo_import.csv
- Path: pipeline\csv\Trade_data__dr_congo_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 30 | Mapped: 29 | Coverage: 97%
- Unmapped columns (sample): ['SUM OF FOB VALUE FC']

### Trade_data__ecuador_export.csv
- Path: pipeline\csv\Trade_data__ecuador_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 21 | Mapped: 21 | Coverage: 100%

### Trade_data__ecuador_import.csv
- Path: pipeline\csv\Trade_data__ecuador_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 26 | Mapped: 26 | Coverage: 100%

### Trade_data__ethiopia_export.csv
- Path: pipeline\csv\Trade_data__ethiopia_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 17 | Mapped: 16 | Coverage: 94%
- Unmapped columns (sample): ['4 DIGIT']

### Trade_data__ethiopia_import.csv
- Path: pipeline\csv\Trade_data__ethiopia_import.csv
- Detected: deals (source_type=other)
- Status: OK
- Columns: 16 | Mapped: 15 | Coverage: 94%
- Unmapped columns (sample): ['4 DIGIT']

### Trade_data__ghana_export.csv
- Path: pipeline\csv\Trade_data__ghana_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 23 | Mapped: 23 | Coverage: 100%

### Trade_data__ghana_import.csv
- Path: pipeline\csv\Trade_data__ghana_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 27 | Mapped: 27 | Coverage: 100%

### Trade_data__guyana_export.csv
- Path: pipeline\csv\Trade_data__guyana_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 23 | Mapped: 23 | Coverage: 100%

### Trade_data__guyana_import.csv
- Path: pipeline\csv\Trade_data__guyana_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 24 | Mapped: 24 | Coverage: 100%

### Trade_data__indonesia_export.csv
- Path: pipeline\csv\Trade_data__indonesia_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 28 | Mapped: 28 | Coverage: 100%

### Trade_data__indonesia_import.csv
- Path: pipeline\csv\Trade_data__indonesia_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 26 | Mapped: 26 | Coverage: 100%

### Trade_data__ivory_coast_export.csv
- Path: pipeline\csv\Trade_data__ivory_coast_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 23 | Mapped: 23 | Coverage: 100%

### Trade_data__ivory_coast_import.csv
- Path: pipeline\csv\Trade_data__ivory_coast_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 22 | Mapped: 22 | Coverage: 100%

### Trade_data__kazakhstan_export.csv
- Path: pipeline\csv\Trade_data__kazakhstan_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: WARN
- Columns: 35 | Mapped: 10 | Coverage: 29%
- Unmapped columns (sample): ['TRADING COUNTRY', 'TOTAL NUMBER OF PACKAGES', 'TOTAL CUSTOMS VALUE', 'DEPARTURE COUNTRY NAME', 'COUNTRY OF ORIGIN NAME', 'DELIVERY TERMS CODE', 'DELIVERY TERMS PLACE', 'TOTAL INVOICE VALUE', 'INVOICE CURRENCY CODE', 'INVOICE CURRENCY EXCHANGE RATE']
- Issues:
  - warn: low mapping coverage (29%)

### Trade_data__kazakhstan_import.csv
- Path: pipeline\csv\Trade_data__kazakhstan_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: WARN
- Columns: 36 | Mapped: 10 | Coverage: 28%
- Unmapped columns (sample): ['TRADING COUNTRY', 'TOTAL NUMBER OF PACKAGES', 'TOTAL CUSTOMS VALUE', 'DEPARTURE COUNTRY NAME', 'COUNTRY OF ORIGIN NAME', 'DELIVERY TERMS CODE', 'DELIVERY TERMS PLACE', 'TOTAL INVOICE VALUE', 'INVOICE CURRENCY CODE', 'INVOICE CURRENCY EXCHANGE RATE']
- Issues:
  - warn: low mapping coverage (28%)

### Trade_data__kenya_export.csv
- Path: pipeline\csv\Trade_data__kenya_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 14 | Mapped: 11 | Coverage: 79%
- Unmapped columns (sample): ['AGENT ADDRESS', 'COMMECIAL DESCRIPTION', 'TOTAL VALUE KES']

### Trade_data__kenya_import.csv
- Path: pipeline\csv\Trade_data__kenya_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 24 | Mapped: 21 | Coverage: 88%
- Unmapped columns (sample): ['Total Value KES', 'Station', 'Agent Address']

### Trade_data__kosovo_export.csv
- Path: pipeline\csv\Trade_data__kosovo_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 33 | Mapped: 21 | Coverage: 64%
- Unmapped columns (sample): ['FIRST DESTINATION COUNTRY', 'FINAL DESTINATION COUNTRY', 'TRADING COUNTRY', 'TYPE OF PACKAGES', 'NUMBER OF ITEMS', 'ITEM PRICE', 'DECLARED VALUE', 'CUSTOMS VALUE', 'INVOICE VALUE', 'INSURANCE CURRENCY RATE']

### Trade_data__kosovo_import.csv
- Path: pipeline\csv\Trade_data__kosovo_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 36 | Mapped: 19 | Coverage: 53%
- Unmapped columns (sample): ['ITEM ORIGIN COUNTRY', 'FIRST DESTINATION COUNTRY', 'FINAL DESTINATION COUNTRY', 'TRADING COUNTRY', 'TYPE OF PACKAGES', 'NUMBER OF ITEMS', 'ITEM PRICE', 'DECLARED VALUE', 'CUSTOMS VALUE', 'INVOICE VALUE']

### Trade_data__lesotho_export.csv
- Path: pipeline\csv\Trade_data__lesotho_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 23 | Mapped: 18 | Coverage: 78%
- Unmapped columns (sample): ['COUNTRY OF ORIGIN', 'NUMBER OF PACKAGES', 'TOTAL VALUE LSL', 'TAX AMOUNT LSL', 'TAX AMOUNT USD']

### Trade_data__lesotho_import.csv
- Path: pipeline\csv\Trade_data__lesotho_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 25 | Mapped: 20 | Coverage: 80%
- Unmapped columns (sample): ['COUNTRY OF ORIGIN', 'NUMBER OF PACKAGES', 'TOTAL VALUE LSL', 'IMPORT DUTY LSL', 'IMPORT DUTY USD']

### Trade_data__liberia_export.csv
- Path: pipeline\csv\Trade_data__liberia_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 24 | Mapped: 16 | Coverage: 67%
- Unmapped columns (sample): ['COUNTRY DESTINATION CODE', 'UPDATED COUNTRY DESTINATION', 'TOTAL EXPORT DUTIES', 'PCK NBR', 'PCK TYP COD', 'PCK TYP NAM', 'TRANSPORT', 'UPDATED TRANSPORT']

### Trade_data__liberia_import.csv
- Path: pipeline\csv\Trade_data__liberia_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 26 | Mapped: 16 | Coverage: 62%
- Unmapped columns (sample): ['COMMECIAL DESCRIPTION', 'PCK NBR', 'PCK TYP COD', 'PCK TYP NAM', 'QUA TYPE', 'TOTAL IMPORT DUTIES USD', 'CUSTOM OFFICE', 'TRANSPORT', 'UPDATED TRANSPORT', 'IMPORT TYPE']

### Trade_data__malawi_export.csv
- Path: pipeline\csv\Trade_data__malawi_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 28 | Mapped: 25 | Coverage: 89%
- Unmapped columns (sample): ['TOTAL ITEMS', 'INVOICE PRICE', 'TOTAL VALUE MWK']

### Trade_data__malawi_import.csv
- Path: pipeline\csv\Trade_data__malawi_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 29 | Mapped: 23 | Coverage: 79%
- Unmapped columns (sample): ['IMPORTER CITY', 'TOTAL ITEMS', 'INVOICE PRICE FC', 'TOTAL VALUE MWK', 'TOTAL TAX MWK', 'TOTAL TAX USD']

### Trade_data__mexico_export.csv
- Path: pipeline\csv\Trade_data__mexico_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 22 | Mapped: 17 | Coverage: 77%
- Unmapped columns (sample): ['Exporter State', 'Buyer City', 'Port of Loading Spanish', 'Customs Regime', 'Mode of Transport Spanish']

### Trade_data__mexico_import.csv
- Path: pipeline\csv\Trade_data__mexico_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 22 | Mapped: 17 | Coverage: 77%
- Unmapped columns (sample): ['Importer State', 'Value in USD', 'Invoice Value in MXN', 'Port of Discharge Spanish', 'Mode of Transport Spanish']

### Trade_data__moldova_export.csv
- Path: pipeline\csv\Trade_data__moldova_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 14 | Mapped: 10 | Coverage: 71%
- Unmapped columns (sample): ['CONTRACTOR', 'UNIT PRICE LEU', 'TOTAL VALUE LEU', 'TOTAL ITEM NO']

### Trade_data__moldova_import.csv
- Path: pipeline\csv\Trade_data__moldova_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 14 | Mapped: 10 | Coverage: 71%
- Unmapped columns (sample): ['CONTRACTOR', 'UNIT PRICE LEU', 'TOTAL VALUE LEU', 'TOTAL ITEM NO']

### Trade_data__nambia_import.csv
- Path: pipeline\csv\Trade_data__nambia_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 32 | Mapped: 25 | Coverage: 78%
- Unmapped columns (sample): ['Package Quantity', 'Supplementary Quantity', 'Supplementary Unit', 'FOB Value NAD', 'CIF Value NAD', 'Vat Duty Amount Nad', 'Office']

### Trade_data__nigeria_import.csv
- Path: pipeline\csv\Trade_data__nigeria_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 30 | Mapped: 15 | Coverage: 50%
- Unmapped columns (sample): ['COUNTRY OF SUPPLY', 'COUNTRY OF ORIGIN', 'UNIT NAME', 'ITEM FOB VALUE NGN', 'ITEM FOB VALUE USD', 'ITEM CIF VALUE NGN', 'ITEM CIF VALUE USD', 'ITEM TOTAL TAXES NGN', 'ITEM TOTAL TAXES USD', 'ITEM FOB FCX']

### Trade_data__pakistan_export.csv
- Path: pipeline\csv\Trade_data__pakistan_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 18 | Mapped: 13 | Coverage: 72%
- Unmapped columns (sample): ['PAKISTAN PORT', 'VALUE FC', 'VALUE PKR', 'VALUE USD', '4 DIGITS']

### Trade_data__pakistan_import.csv
- Path: pipeline\csv\Trade_data__pakistan_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 16 | Mapped: 12 | Coverage: 75%
- Unmapped columns (sample): ['PAKISTAN PORT CODE', 'VALUE PKR', 'VALUE USD', '4 DIGITS']

### Trade_data__panama_export.csv
- Path: pipeline\csv\Trade_data__panama_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 17 | Mapped: 12 | Coverage: 71%
- Unmapped columns (sample): ['DEST COUNTRY', 'PRODUCT DESC', 'N WEIGHT', 'G WEIGHT', 'CUSTOMS ZONE']

### Trade_data__panama_import.csv
- Path: pipeline\csv\Trade_data__panama_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 20 | Mapped: 17 | Coverage: 85%
- Unmapped columns (sample): ['N WEIGHT', 'G WEIGHT', 'CUSTOMS ZONE']

### Trade_data__paraguay_export.csv
- Path: pipeline\csv\Trade_data__paraguay_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 19 | Mapped: 14 | Coverage: 74%
- Unmapped columns (sample): ['DEST COUNTRY', 'G WEIGHT', 'N WEIGHT', 'FOB UNIT', 'TRANS CORP']

### Trade_data__paraguay_import.csv
- Path: pipeline\csv\Trade_data__paraguay_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 21 | Mapped: 17 | Coverage: 81%
- Unmapped columns (sample): ['SALER', 'G WEIGHT', 'N WEIGHT', 'TRANS CORP']

### Trade_data__peru_export.csv
- Path: pipeline\csv\Trade_data__peru_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 26 | Mapped: 13 | Coverage: 50%
- Unmapped columns (sample): ['EXPORTER STATE', 'EXPORTER DISTRICT', 'EXPORTER TEL', 'HS CODE DESC', 'N WEIGHT', 'G WEIGHT', 'FOB UNIT', 'PHYSICAL QUANTITY', 'UNIT OF PHYSICAL QUANTITY', 'DEST COUNTRY']

### Trade_data__peru_import.csv
- Path: pipeline\csv\Trade_data__peru_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 37 | Mapped: 24 | Coverage: 65%
- Unmapped columns (sample): ['IMPORTER CITY', 'IMPORTER STATE', 'IMPORTER DISTRICT', 'AD VALOREM', 'LOCAL TAX', 'N WEIGHT', 'G WEIGHT', 'CIF UNIT', 'UNIT OF COMMERCIAL QUANTITY', 'TYPE OF PACKAGE']

### Trade_data__philippines_export.csv
- Path: pipeline\csv\Trade_data__philippines_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 47 | Mapped: 28 | Coverage: 60%
- Unmapped columns (sample): ['BROKER', 'Broker Address', 'SELECTIVITY', 'ORIGIN COUNTRY CODE', 'NO OF CONTAINER', 'DESTINATION PORT CODE', 'DESTINATION PORT NAME', 'NATL DESCRIPTION', 'SUPP UNITS', 'PACKAGES KIND']

### Trade_data__philippines_import.csv
- Path: pipeline\csv\Trade_data__philippines_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 21 | Mapped: 19 | Coverage: 90%
- Unmapped columns (sample): ['Product Descriptions', 'Quantity Of Package']

### Trade_data__russia_export.csv
- Path: pipeline\csv\Trade_data__russia_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: WARN
- Columns: 23 | Mapped: 9 | Coverage: 39%
- Unmapped columns (sample): ['DEPARTURE COUNTRY', 'TRADING COUNTRY CODE', 'POINT OF DELIVERY OF GOODS', 'CURRENCY OF THE CONTRACT', "MANUFACTURER'S NAME", 'TRADEMARK', 'QUANTITY OF ITEMS', 'NUMBER OF CONTAINERS', 'GROSS WEIGHT (KG)', 'NET WEIGHT (KG)']
- Issues:
  - warn: low mapping coverage (39%)

### Trade_data__russia_import.csv
- Path: pipeline\csv\Trade_data__russia_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: WARN
- Columns: 25 | Mapped: 8 | Coverage: 32%
- Unmapped columns (sample): ['TRADING COUNTRY CODE', 'DEPARTURE COUNTRY', 'COUNTRY OF ORIGIN', 'CUSTOMS CURRENCY CODE', 'ALPHABETIC CODE OF THE CONDITION OF DELIVERY', 'POINT OF DELIVERY OF GOODS', 'CURRENCY OF THE CONTRACT', "MANUFACTURER'S NAME", 'TRADEMARK', 'QUANTITY OF ITEMS']
- Issues:
  - warn: low mapping coverage (32%)

### Trade_data__sao_tome_and_principe_export.csv
- Path: pipeline\csv\Trade_data__sao_tome_and_principe_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 24 | Mapped: 22 | Coverage: 92%
- Unmapped columns (sample): ['FOB VALUE STD', 'CIF VALUE FC']

### Trade_data__sao_tome_and_principe_import.csv
- Path: pipeline\csv\Trade_data__sao_tome_and_principe_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 25 | Mapped: 22 | Coverage: 88%
- Unmapped columns (sample): ['LOGISTICS SHIPPING COMPANY', 'FOB VALUE STD', 'CIF VALUE FC']

### Trade_data__sierra_leone_export.csv
- Path: pipeline\csv\Trade_data__sierra_leone_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 28 | Mapped: 19 | Coverage: 68%
- Unmapped columns (sample): ['BROKER', 'BROKER ADDRESS', 'PACKAGE CODE', 'PACKAGE NAME', 'PACKAGE NUMBER', 'INVOICE AMOUNT', 'INVOICE CURRENCY CODE', 'INVOICE CURRENCY RATE', 'CUSTOMS OFFICE']

### Trade_data__sierra_leone_import.csv
- Path: pipeline\csv\Trade_data__sierra_leone_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 33 | Mapped: 21 | Coverage: 64%
- Unmapped columns (sample): ['BROKER', 'BROKER ADDRESS', 'PACKAGE CODE', 'PACKAGE NAME', 'PACKAGE NUMBER', 'INVOICE AMOUNT', 'INVOICE CURRENCY CODE', 'INVOICE CURRENCY RATE', 'EXTERNAL FREIGHT AMOUNT', 'INSURANCE AMOUNT']

### Trade_data__sri_lanka_export.csv
- Path: pipeline\csv\Trade_data__sri_lanka_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 29 | Mapped: 23 | Coverage: 79%
- Unmapped columns (sample): ['EXPORTER TELEPHONE', 'EXPORTER FAX', 'EXPORTER WEBSITE', 'UNIT PRICE IN FOREIGN CURRENCY', 'TOTAL VALUE IN FOREIGN CURRENCY', 'LOAD VESSEL NAME']

### Trade_data__sri_lanka_import.csv
- Path: pipeline\csv\Trade_data__sri_lanka_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 29 | Mapped: 22 | Coverage: 76%
- Unmapped columns (sample): ['IMPORTER TELEPHONE', 'IMPORTER FAX', 'IMPORTER EMAIL', 'IMPORTER WEBSITE', 'UNIT PRICE IN FOREIGN CURRENCY', 'TOTAL VALUE IN FOREIGN CURRENCY', 'LOAD VESSEL NAME']

### Trade_data__tanzania_export.csv
- Path: pipeline\csv\Trade_data__tanzania_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 29 | Mapped: 20 | Coverage: 69%
- Unmapped columns (sample): ['ORIGIN COUNTY', 'CONSIGNMENT COUNTRY', 'TRADING COUNTRY', 'ITEM INVOICE AMOUNT IN FC', 'ITEM STATISTICAL VALUE USD', 'ITEM CUSTOMS VALUE TZS', 'DECLARED CUSTOMS VALUE TZS', 'ASSESSED CUSTOMS VALUE TZS', 'TRANSPORT CODE DESCRIPTION']

### Trade_data__tanzania_import.csv
- Path: pipeline\csv\Trade_data__tanzania_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 37 | Mapped: 22 | Coverage: 59%
- Unmapped columns (sample): ['Origin county', 'Consignment Country', 'Trading country', 'Transport Mode Code', 'Item Invoice Amount in FC', 'Item Statistical Value USD', 'Item Customs Value TZS', 'Import Duty TZS', 'VAT TZS', 'Railway DEV LEVY TZS']

### Trade_data__turkey_export.csv
- Path: pipeline\csv\Trade_data__turkey_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 26 | Mapped: 21 | Coverage: 81%
- Unmapped columns (sample): ['Customs Office Name', 'REGION', 'Invoice Amount', 'Calculated Item Value USD', 'Statistical Value USD']

### Trade_data__turkey_import.csv
- Path: pipeline\csv\Trade_data__turkey_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 26 | Mapped: 20 | Coverage: 77%
- Unmapped columns (sample): ['Dispatch Country', 'Customs Office Name', 'REGION', 'Invoice Amount', 'Calculated Item Value USD', 'Statistical Value USD']

### Trade_data__uganda_export.csv
- Path: pipeline\csv\Trade_data__uganda_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 23 | Mapped: 18 | Coverage: 78%
- Unmapped columns (sample): ['TAX AMOUNT USD', 'CIF VALUE AMT UGX', 'CIF VALUE AMT USD', 'TAX PAYER', '4 DIGIT HS']

### Trade_data__uganda_import.csv
- Path: pipeline\csv\Trade_data__uganda_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 25 | Mapped: 18 | Coverage: 72%
- Unmapped columns (sample): ['Tax Amount UGX', 'TAX AMOUNT USD', 'CIF VALUE AMT UGX', 'CIF VALUE AMT USD', 'TAX PAYER', 'REGIME NAME', '4 DIGIT HS']

### Trade_data__ukraine_export.csv
- Path: pipeline\csv\Trade_data__ukraine_export.csv
- Detected: deals (source_type=other)
- Status: WARN
- Columns: 23 | Mapped: 11 | Coverage: 48%
- Unmapped columns (sample): ['CUSTOMS OFFICE NAME', 'CONTRACT HOLDER NAME', 'DEST COUNTRY NAME', 'N WEIGHT IN KG', 'INVOICE CARGO VALUE USD', 'CUSTOMS CARGO VALUE USD', 'DELIVERY CONDITION CODE', 'DELIVERY CONDITION NAME', 'PLACE OF DELIVERY', 'TRANS TYPE NAME CROSS BORDER']
- Issues:
  - warn: low mapping coverage (48%)

### Trade_data__ukraine_import.csv
- Path: pipeline\csv\Trade_data__ukraine_import.csv
- Detected: deals (source_type=other)
- Status: OK
- Columns: 29 | Mapped: 18 | Coverage: 62%
- Unmapped columns (sample): ['SHIPPER ADDRESS', 'G WEIGHT IN KG', 'N WEIGHT IN KG', 'INVOICE CARGO VALUE USD', 'CUSTOMS CARGO VALUE', 'STATISTICS CARGO VALUE', 'CUSTOMS CARGO VALUE USD', 'CUSTOMS CARGO VALUE USD PER KG', 'DEPARTURE COUNTRY', 'TRANS NUMBER AT BORDER']

### Trade_data__uruguay_export.csv
- Path: pipeline\csv\Trade_data__uruguay_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 16 | Mapped: 12 | Coverage: 75%
- Unmapped columns (sample): ['N WEIGHT', 'G WEIGHT', 'PHYSICAL QUANTITY', 'UNIT OF PHYSICAL QUANTITY']

### Trade_data__uruguay_import.csv
- Path: pipeline\csv\Trade_data__uruguay_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: WARN
- Columns: 23 | Mapped: 15 | Coverage: 65%
- Unmapped columns (sample): ['PRODUCT DESCRIPITON', 'N WEIGHT', 'G WEIGHT', 'PHYSICAL QUANTITY', 'UNIT OF PHYSICAL QUANTITY', 'FREIGHT CURRENCY', 'INSURANCE CURRENCY', 'TRANS TYPE EN']
- Issues:
  - warn: missing value columns (total_value/fob/unit_price)

### Trade_data__usa_export.csv
- Path: pipeline\csv\Trade_data__usa_export.csv
- Detected: deals (source_type=other)
- Status: WARN
- Columns: 16 | Mapped: 5 | Coverage: 31%
- Unmapped columns (sample): ['SHIPPER ADDRESS', 'US PORT', 'CONTAINER QUANTITY', 'CONTAINER QUANTITY UNITS', 'CONTAINER MEASUREMENT', 'CONTAINER SEAL NUMBER', 'CONTAINER GROSS WEIGHT KG', 'CONTAINER TEU', 'ITEM GROSS WEIGHT KG', 'ITEM QUANTITY']
- Issues:
  - warn: missing party columns (exporter/importer/consignee/supplier)
  - warn: missing value columns (total_value/fob/unit_price)
  - warn: low mapping coverage (31%)

### Trade_data__usa_import.csv
- Path: pipeline\csv\Trade_data__usa_import.csv
- Detected: deals (source_type=other)
- Status: WARN
- Columns: 26 | Mapped: 13 | Coverage: 50%
- Unmapped columns (sample): ['Shipper Address', 'Notify Party Name', 'Notify Party Address', 'Marks & Numbers', 'Mode of Transportation', 'Loading Port', 'Unloading Port', 'Place of Receipt', 'Weight in KG', 'Weight Unit']
- Issues:
  - warn: missing value columns (total_value/fob/unit_price)

### Trade_data__uzbekistan_export.csv
- Path: pipeline\csv\Trade_data__uzbekistan_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 23 | Mapped: 15 | Coverage: 65%
- Unmapped columns (sample): ['CARGO MOVEMENT TYPE NAME', 'CARGO VALUE USD', 'CUSTOMS VALUE USD', 'STAT VALUE 1000USD', 'DELIVER CONDITION LETTER CODE', 'DELIVER CONDITION NAME', 'DESTINATION PLACE', 'HS 4 DIGIT']

### Trade_data__uzbekistan_import.csv
- Path: pipeline\csv\Trade_data__uzbekistan_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 23 | Mapped: 14 | Coverage: 61%
- Unmapped columns (sample): ['DECLARATION TYPE NAME', 'PREV DECLARATION TYPE NAME', 'DEPARTURE COUNTRY', 'ORIGIN PLACE', 'CARGO VALUE USD', 'CUSTOMS VALUE USD', 'STAT VALUE 1000USD', 'DELIVER CONDITION NAME', 'HS 4 DIGIT']

### Trade_data__venezuela_export.csv
- Path: pipeline\csv\Trade_data__venezuela_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 18 | Mapped: 12 | Coverage: 67%
- Unmapped columns (sample): ['CHAPTER DESCRIPTION', 'DEST COUNTRY CODE', 'G WEIGHT', 'N WEIGHT', 'BO FOB', 'US FOB']

### Trade_data__venezuela_import.csv
- Path: pipeline\csv\Trade_data__venezuela_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 19 | Mapped: 11 | Coverage: 58%
- Unmapped columns (sample): ['CHAPTER DESCRIPTION', 'EMBARQ PORT', 'G WEIGHT', 'N WEIGHT', 'BO FOB', 'US FOB', 'BO CIF', 'US CIF']

### Trade_data__vietnam_export.csv
- Path: pipeline\csv\Trade_data__vietnam_export.csv
- Detected: deals (source_type=other)
- Status: WARN
- Columns: 41 | Mapped: 11 | Coverage: 27%
- Unmapped columns (sample): ['EXPORTER COMPANY', 'PROVINCE', 'AREA CODE', 'EXPORTER PHONE NEW NUMBER', 'EXPORTER PHONE OLD NUMBER', 'IMPORT COMPANY', 'ADD 1 STREET AND NUMBER P O BOX', 'ADD 2 STREET AND NUMBER P O BOX', 'ADD 3 CITY NAME', 'ADD4 COUNTRY SUB ENTITY NAME']
- Issues:
  - warn: low mapping coverage (27%)

### Trade_data__vietnam_import.csv
- Path: pipeline\csv\Trade_data__vietnam_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: WARN
- Columns: 43 | Mapped: 10 | Coverage: 23%
- Unmapped columns (sample): ['IMPORTER COMPANY', 'PROVINCE', 'AREA CODE', 'IMPORTER NEW PHONE NUMBER', 'IMPORTER OLD PHONE NUMBER', 'EXPORT COMPANY', 'POSTAL CODE', 'ADD 1 STREET AND NUMBER P O BOX', 'ADD 2 STREET AND NUMBER P O BOX', 'ADD 3 CITY NAME']
- Issues:
  - warn: low mapping coverage (23%)

### Trade_data__zambia_export.csv
- Path: pipeline\csv\Trade_data__zambia_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 23 | Mapped: 15 | Coverage: 65%
- Unmapped columns (sample): ['Consignment Country', 'Invoice Value', 'Invoice Value ZMW', 'CIF Value ZMW', 'Statistical Value ZMW', 'Tranport Mode', 'Customs Office', 'Procedure']

### Trade_data__zambia_import.csv
- Path: pipeline\csv\Trade_data__zambia_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 23 | Mapped: 15 | Coverage: 65%
- Unmapped columns (sample): ['Consignment Country', 'Invoice Value', 'Invoice Value ZMW', 'CIF Value ZMW', 'Statistical Value ZMW', 'Duties And Taxes ZMW', 'Tranport Mode', 'Customs Office']

### Trade_data__zimbabwe_export.csv
- Path: pipeline\csv\Trade_data__zimbabwe_export.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: OK
- Columns: 34 | Mapped: 19 | Coverage: 56%
- Unmapped columns (sample): ['CTY FST CODE', 'CTY FST NAME', 'SUPP QUANTITY', 'TOTAL INVOICE VALUE FC', 'TOTAL INVOICE VALUE USD', 'CIF VALUE FC', 'ITEM PRICE FC', 'ITEM PRICE USD', 'AMOUNT FEE', 'AMOUNT DUTY']

### Trade_data__zimbabwe_import.csv
- Path: pipeline\csv\Trade_data__zimbabwe_import.csv
- Detected: deals (source_type=indian_trade_records, record_type=import)
- Status: OK
- Columns: 28 | Mapped: 17 | Coverage: 61%
- Unmapped columns (sample): ['CTY FLT NAME', 'SUPP UNITS', 'CIF VALUE FC', 'CUSTOMS DUTY FC', 'CUSTOMS DUTY USD', 'VAT AMOUNT FC', 'VAT AMOUNT USD', 'DELIVERY TERM', 'DELIVERY PLACE', 'MODE OF PAYMENT']

### ch_31_exp_feb_24__Sheet1.csv
- Path: pipeline\csv\ch_31_exp_feb_24__Sheet1.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: WARN
- Columns: 23 | Mapped: 23 | Coverage: 100%
- Issues:
  - warn: missing product columns (hs_code/product_description/etc)

### ch_31_exp_sep_24__Sheet1.csv
- Path: pipeline\csv\ch_31_exp_sep_24__Sheet1.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: WARN
- Columns: 30 | Mapped: 30 | Coverage: 100%
- Issues:
  - warn: missing product columns (hs_code/product_description/etc)
  - warn: missing date columns (sb_date/reg_date)

### coffee_sample__Export_Records.csv
- Path: pipeline\csv\coffee_sample__Export_Records.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: WARN
- Columns: 33 | Mapped: 33 | Coverage: 100%
- Issues:
  - warn: missing date columns (sb_date/reg_date)

### export_23_april_2309__Export_Records.csv
- Path: pipeline\csv\export_23_april_2309__Export_Records.csv
- Detected: deals (source_type=indian_trade_records, record_type=export)
- Status: WARN
- Columns: 33 | Mapped: 33 | Coverage: 100%
- Issues:
  - warn: missing date columns (sb_date/reg_date)

### indian_importer_exporter_data_final__Sheet1.csv
- Path: pipeline\csv\indian_importer_exporter_data_final__Sheet1.csv
- Detected: companies (source_type=company_directory)
- Status: OK
- Columns: 11 | Mapped: 10 | Coverage: 91%
- Unmapped columns (sample): ['S. No.']
