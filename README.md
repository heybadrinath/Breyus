# Breyus Trading Platform with PDF Generation

## New PDF Generation Feature

This update adds professional PDF generation for purchase requests using Puppeteer.

### Features Added:
1. **Professional PDF Purchase Requests**: When buyers submit purchase requests, PDFs are automatically generated with company details, product information, terms, and pricing.
2. **Seller PDF Access**: In the seller trade panel, the "Offered Price" column has been replaced with "View Request" links that open the generated PDFs.
3. **Form Data Integration**: All purchase request form data (company details, payment terms, etc.) is now included in the generated PDFs.

### Installation

You need to install Puppeteer in the backend to enable PDF generation:

```bash
cd backend
npm install puppeteer @types/puppeteer
```

### Database Migration

The trade entity now includes a `purchase_request_data` column to store form data. You may need to run database migrations or update your database schema.

### PDF Format

The generated PDFs match the professional format shown in the provided image, including:
- Company headers with NOVAL branding
- Vendor and delivery address sections
- Product specifications table
- Terms and conditions
- Tax calculations (SGST/CGST)
- Amount in words conversion
- Professional layout and styling

### Backend Changes:
- Added `PdfService` for PDF generation using Puppeteer
- Enhanced `TradesService` with PDF data mapping
- New endpoint `/trades/:id/pdf` for serving PDFs
- Extended trade entity to store purchase request form data

### Frontend Changes:
- Modified seller trade table to show "View Request" links instead of offered price
- Updated purchase request form to pass form data to backend
- Enhanced success page with PDF generation confirmation

### Usage

1. Buyers fill out the purchase request form with company details, payment terms, etc.
2. Upon submission, trade requests are created with embedded form data
3. Sellers can view professional PDF purchase requests by clicking "View PDF" in their trade panel
4. PDFs open in a new tab and can be downloaded or printed

### Technical Details

- Uses Puppeteer headless Chrome for PDF generation
- Professional HTML template with CSS styling
- Responsive PDF layout optimized for A4 format
- Amount to words conversion for Indian currency format
- Real-time PDF generation based on stored trade data

The PDF generation feature integrates seamlessly with the existing trade system while providing professional documentation for business transactions. 