# Canonical AI Schema

Canonical targets for the AI pipeline built from the current raw trade/company data. These tables are the single source of truth the normalizer should emit. Names align with AI compute (link prediction, gravity score, market analysis).

## Coverage Notes
- Source data inspected: export/import records, company directories, and product catalogs in `raw_data/`.
- Unmapped columns remain in `extra` JSON and the original row is preserved in `raw_data`.
- `deals` is the canonical name for the shipment/transaction records that correspond to `trade_records` in `schema.sql`.
- `investors` and `rounds` are derived from the parties and periods in `deals` (no standalone investor files exist yet).

## Tables

### companies
- `legal_name` (req): Company name.
- `normalized_name`: Lowercased/cleaned name for matching.
- `roles`: Array of roles (`exporter`, `importer`, `buyer`, `seller`, `manufacturer`, `wholesaler`, `supplier`, `consignee`, `unknown`).
- `country`, `state`, `city`, `postal_code`.
- `address_full`, `address_details`.
- `contact`: `emails[]`, `phones[]`, `mobiles[]`, `website`, `contact_person`.
- `iec_code`, `iec_pan`, `iec_established`.
- `business_details`, `product_categories[]`, `hs_codes_dealt[]`.
- `data_source`, `source_file`, `source_row_id`, `raw_data`, `extra`.

### people
- `full_name` (req).
- `company_name`, `company_role` (exporter/importer/supplier/buyer/etc).
- `emails[]`, `phones[]`, `mobiles[]`, `website`.
- `country`, `state`, `city`, `postal_code`, `address_full`.
- `source_file`, `source_row_id`, `raw_data`, `extra`.

### investors
- Derived parties that finance/own deals; seeded from importer/exporter/supplier/consignee parties until dedicated investor data exists.
- `name` (req), `roles` (buyer/seller/supplier/consignee), `country`, `state`, `city`, `contact`, `source_file`, `source_row_id`, `raw_data`, `extra`.

### deals (alias: trade_records)
- `direction` (`export`/`import`).
- Identifiers: `sb_number`, `sb_date`, `reg_date`, `invoice_number`, `system_id`.
- Parties: `seller_name` (exporter/supplier), `buyer_name` (importer/consignee), `consignee_name`, `supplier_name`, addresses, countries, IEC codes.
- Product: `hs_code`, `hs_chapter`, `ritc_code`, `product_description`, `item_number`, `product_group`.
- Quantity: `quantity`, `unit_of_measurement`, `net_weight_kg`.
- Pricing: `unit_price`, `unit_price_usd`, `unit_price_inr`, `currency`, `exchange_rate`.
- Totals: `total_value_fc`, `total_value_usd`, `total_value_inr`, `fob_value`, `duty_value`, `drawback_value`.
- Logistics: `indian_port`, `indian_port_code`, `foreign_port`, `foreign_port_code`, `mode_of_transport`, `cha_name`, `shipment_type`, `shipment_status`.
- Geography/time: `origin_country`, `destination_country`, `trade_month`, `trade_year`, `trade_period`.
- Metadata: `data_source`, `source_file`, `source_sheet`, `source_row_id`, `raw_data`, `extra`.

### rounds (derived)
- Periodic aggregates derived from `deals`.
- `entity_name`, `direction`, `hs_code`, `hs_chapter`, `trade_month`, `trade_year`, `trade_period`.
- Aggregates: `total_value_usd`, `total_quantity`, `first_trade_date`, `last_trade_date`, `origin_countries[]`, `destination_countries[]`, `ports[]`.
- Metadata: `data_source`, `source_file`, `raw_rows[]` (ids), `extra`.

## Mapping Hints (raw → canonical)
- Company names/addresses: `Company Name`, `EXPORTERNAME`, `IMPORTER`, `Supplier Name`, `CONSINEENAME`, `EXPORTERADDRESS`, `IMPORTERADDRESS`, `SUPPLIER_ADDRESS`.
- Contact: `EMAIL`, `Email Ids.`, `PHONE`, `CONTACT_NO`, `MOBILE`, `Website`, `CONTACT PERSON`.
- Parties in deals: exporter/importer/consignee/supplier columns seed `companies`, `investors`, and `people`.
- Period/rounds: `MONTH`, `YEAR`, `PERIOD`, `SBDATE`, `REG_DATE`.
- Product/value: `HS_CODE`, `CHAPTER`, `ProductDescription`, `QUANTITY`, `UNIT`, `FOB`, `Total_Value_IN_USD`, `CURRENCY`, ports, and country columns map into `deals`.
