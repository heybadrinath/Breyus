import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

interface TradeData {
  _id: any;
  product?: {
    name?: string;
    price?: string;
    currency?: string;
    hsnCode?: string;
    description?: string;
    origin?: string;
  };
  buyer?: {
    mail?: string;
    companyId?: {
      companyName?: string;
      country?: string;
      registrationNumber?: string;
    };
  } | null;
  seller?: {
    mail?: string;
    companyId?: {
      companyName?: string;
      country?: string;
      registrationNumber?: string;
    };
  } | null;
  quantity: string;
  quantityUnit: string;
  buyerOfferedPrice?: string;
  sellerOfferedPrice?: string;
  selectedAddress?: {
    fullName?: string;
    streetName?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    mobileNumber?: string;
  };
  paymentMethod?: {
    type?: string;
    method?: string;
    percentage?: string;
    days?: string;
  };
  buyerIncoterms?: {
    selectedIncoterm?: string;
  };
  sellerOfferedIncoterms?: {
    selectedIncoterm?: string;
  };
  createdAt: Date;
  completedAt?: Date;
  acceptedAt?: Date;
  tradePhase: string;
  negotiationStatus?: string;
  buyerMessage?: string;
}

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  // Brand colors extracted from Breyus logo
  private readonly BRAND_PRIMARY = '#6B6B4E'; // Dark olive/bronze
  private readonly BRAND_SECONDARY = '#9A9A7E'; // Light olive/gold
  private readonly BRAND_DARK = '#4A4A35'; // Darker olive for emphasis
  private readonly TEXT_PRIMARY = '#1A1A1A'; // Near black
  private readonly TEXT_SECONDARY = '#5A5A5A'; // Medium gray
  private readonly BG_LIGHT = '#F8F7F5'; // Warm off-white
  private readonly BORDER_COLOR = '#E5E4E0'; // Subtle warm gray

  // Cached logo base64
  private logoBase64Cache: string | null = null;

  // Configurable logo path from environment
  private readonly customLogoPath: string | undefined;

  constructor(private readonly configService: ConfigService) {
    // Get custom logo path from environment variable (optional)
    this.customLogoPath = this.configService.get<string>('INVOICE_LOGO_PATH');
    if (this.customLogoPath) {
      this.logger.log(`Using custom invoice logo path: ${this.customLogoPath}`);
    }
  }

  // Logo as base64 (Breyus "B" logo) - reads from file or uses fallback
  private getLogoBase64(): string {
    // Return cached version if available
    if (this.logoBase64Cache) {
      return this.logoBase64Cache;
    }

    // Build paths to try - custom path takes priority if configured
    const pathsToTry: string[] = [];

    // 1. Custom path from environment variable (highest priority)
    if (this.customLogoPath) {
      pathsToTry.push(this.customLogoPath);
    }

    // 2. Standard paths for different environments
    pathsToTry.push(
      // Production (compiled): dist/trade -> dist/assets
      path.join(__dirname, '..', 'assets', 'logo.png'),
      // Production alternative: from working directory
      path.join(process.cwd(), 'dist', 'assets', 'logo.png'),
      // Development: from src folder
      path.join(process.cwd(), 'src', 'assets', 'logo.png'),
      // Docker: absolute path (configurable via INVOICE_LOGO_PATH instead)
      path.join(process.cwd(), 'assets', 'logo.png'),
      // Fallback: frontend public folder (local dev)
      path.join(process.cwd(), '..', 'frontend', 'public', 'Logo.png'),
    );

    for (const logoPath of pathsToTry) {
      try {
        if (fs.existsSync(logoPath)) {
          const logoBuffer = fs.readFileSync(logoPath);
          this.logoBase64Cache = `data:image/png;base64,${logoBuffer.toString('base64')}`;
          this.logger.log(`Logo loaded successfully from: ${logoPath}`);
          return this.logoBase64Cache;
        }
      } catch (error) {
        this.logger.debug(
          `Could not load logo from ${logoPath}: ${error.message}`,
        );
      }
    }

    this.logger.warn(
      'Could not load logo file from any path, using SVG text fallback',
    );
    this.logger.warn(`Paths tried: ${pathsToTry.join(', ')}`);
    this.logger.warn(
      'To fix, set INVOICE_LOGO_PATH environment variable to your logo file path',
    );

    // Fallback to a styled SVG text logo
    const svgLogo = `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="55" viewBox="0 0 140 55">
            <rect width="140" height="55" fill="white"/>
            <text x="10" y="40" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="bold" fill="#6B6B4E">Breyus</text>
        </svg>`;
    this.logoBase64Cache = `data:image/svg+xml;base64,${Buffer.from(svgLogo).toString('base64')}`;
    return this.logoBase64Cache;
  }

  // Common CSS for all documents - modern minimalist professional design
  private getCommonStyles(): string {
    return `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 10px;
                line-height: 1.5;
                color: ${this.TEXT_PRIMARY};
                background: #fff;
            }
            .document {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px 25px;
            }

            /* Modern Table Styling */
            .bordered-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 0;
            }
            .bordered-table td, .bordered-table th {
                border: 1px solid ${this.BORDER_COLOR};
                padding: 8px 10px;
                vertical-align: top;
            }
            .bordered-table th {
                background: ${this.BG_LIGHT};
                font-weight: 600;
                text-align: left;
                color: ${this.TEXT_PRIMARY};
                text-transform: uppercase;
                font-size: 9px;
                letter-spacing: 0.5px;
            }

            /* Utility Classes */
            .no-border { border: none !important; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .bold { font-weight: 600; }

            /* Section Headers - Modern Style */
            .section-header {
                background: ${this.BRAND_PRIMARY};
                color: #fff;
                font-weight: 600;
                padding: 10px 12px;
                text-transform: uppercase;
                font-size: 10px;
                letter-spacing: 1px;
            }

            /* Labels */
            .label {
                font-weight: 500;
                color: ${this.TEXT_SECONDARY};
                width: 120px;
                font-size: 9px;
                text-transform: uppercase;
                letter-spacing: 0.3px;
            }

            /* Header Section */
            .company-header {
                border-bottom: 2px solid ${this.BRAND_PRIMARY};
                padding-bottom: 20px;
                margin-bottom: 15px;
            }
            .logo-section {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .logo-img {
                height: 50px;
                width: auto;
            }
            .company-info {
                text-align: right;
                font-size: 9px;
                color: ${this.TEXT_SECONDARY};
                line-height: 1.6;
            }
            .company-info strong {
                color: ${this.TEXT_PRIMARY};
                font-size: 11px;
            }

            /* Document Title - Clean Underline Style */
            .doc-title {
                text-align: center;
                font-size: 20px;
                font-weight: 700;
                padding: 15px 0 10px 0;
                margin: 15px 0;
                letter-spacing: 3px;
                color: ${this.TEXT_PRIMARY};
                border-bottom: 3px solid ${this.BRAND_PRIMARY};
                text-transform: uppercase;
            }

            /* Amount Words Box */
            .amount-words {
                background: ${this.BG_LIGHT};
                padding: 10px 12px;
                border: 1px solid ${this.BORDER_COLOR};
                border-left: 3px solid ${this.BRAND_PRIMARY};
                font-style: italic;
                color: ${this.TEXT_SECONDARY};
            }
            .amount-words strong {
                color: ${this.TEXT_PRIMARY};
                font-style: normal;
            }

            /* Signature Section */
            .signature-section {
                margin-top: 30px;
                page-break-inside: avoid;
            }
            .signature-box {
                border: 1px solid ${this.BORDER_COLOR};
                padding: 10px;
                min-height: 80px;
                text-align: center;
            }
            .signature-line {
                border-top: 1px solid ${this.TEXT_PRIMARY};
                margin-top: 50px;
                padding-top: 8px;
                font-size: 9px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            /* Footer Note */
            .footer-note {
                margin-top: 25px;
                padding: 15px;
                border: 1px solid ${this.BORDER_COLOR};
                border-left: 3px solid ${this.BRAND_PRIMARY};
                background: ${this.BG_LIGHT};
                font-size: 8px;
                color: ${this.TEXT_SECONDARY};
                line-height: 1.6;
            }
            .footer-note strong {
                color: ${this.TEXT_PRIMARY};
            }

            /* Terms Section */
            .terms-section {
                margin-top: 15px;
            }
            .terms-section td {
                padding: 6px 10px;
            }

            /* Watermark - Subtle */
            .watermark {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 100px;
                color: rgba(107, 107, 78, 0.04);
                font-weight: 700;
                pointer-events: none;
                z-index: -1;
                letter-spacing: 10px;
            }

            /* Status Badges */
            .status-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 4px;
                font-weight: 600;
                font-size: 9px;
                letter-spacing: 0.5px;
                text-transform: uppercase;
            }
            .status-pending { background: #FFF3E0; color: #E65100; }
            .status-negotiation { background: #E3F2FD; color: #1565C0; }
            .status-accepted { background: #E8F5E9; color: #2E7D32; }
            .status-rejected { background: #FFEBEE; color: #C62828; }
            .status-confirmed { background: ${this.BG_LIGHT}; color: ${this.BRAND_DARK}; border: 1px solid ${this.BRAND_PRIMARY}; }

            /* Highlight Rows */
            .highlight-row {
                background: ${this.BG_LIGHT};
            }
            .total-row {
                background: ${this.BG_LIGHT};
                font-weight: 600;
            }
            .total-row td {
                border-top: 2px solid ${this.BRAND_PRIMARY} !important;
            }

            /* Info Grid for cleaner layout */
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0;
            }
            .info-box {
                padding: 12px;
                border: 1px solid ${this.BORDER_COLOR};
            }
            .info-box-header {
                font-size: 9px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: ${this.TEXT_SECONDARY};
                margin-bottom: 8px;
                padding-bottom: 5px;
                border-bottom: 1px solid ${this.BORDER_COLOR};
            }
        `;
  }

  // Convert number to words for amount
  private numberToWords(num: number, currency: string): string {
    const ones = [
      '',
      'One',
      'Two',
      'Three',
      'Four',
      'Five',
      'Six',
      'Seven',
      'Eight',
      'Nine',
      'Ten',
      'Eleven',
      'Twelve',
      'Thirteen',
      'Fourteen',
      'Fifteen',
      'Sixteen',
      'Seventeen',
      'Eighteen',
      'Nineteen',
    ];
    const tens = [
      '',
      '',
      'Twenty',
      'Thirty',
      'Forty',
      'Fifty',
      'Sixty',
      'Seventy',
      'Eighty',
      'Ninety',
    ];

    const currencyNames: { [key: string]: { main: string; sub: string } } = {
      USD: { main: 'US Dollars', sub: 'Cents' },
      EUR: { main: 'Euros', sub: 'Cents' },
      GBP: { main: 'British Pounds', sub: 'Pence' },
      INR: { main: 'Indian Rupees', sub: 'Paise' },
      AED: { main: 'UAE Dirhams', sub: 'Fils' },
      CNY: { main: 'Chinese Yuan', sub: 'Fen' },
    };

    const curr = currencyNames[currency] || { main: currency, sub: 'cents' };

    if (num === 0) return `Zero ${curr.main} Only`;

    const convertLessThanThousand = (n: number): string => {
      if (n === 0) return '';
      if (n < 20) return ones[n];
      if (n < 100)
        return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      return (
        ones[Math.floor(n / 100)] +
        ' Hundred' +
        (n % 100 ? ' ' + convertLessThanThousand(n % 100) : '')
      );
    };

    const convert = (n: number): string => {
      if (n === 0) return '';
      if (n < 1000) return convertLessThanThousand(n);
      if (n < 1000000)
        return (
          convertLessThanThousand(Math.floor(n / 1000)) +
          ' Thousand' +
          (n % 1000 ? ' ' + convertLessThanThousand(n % 1000) : '')
        );
      if (n < 1000000000)
        return (
          convertLessThanThousand(Math.floor(n / 1000000)) +
          ' Million' +
          (n % 1000000 ? ' ' + convert(n % 1000000) : '')
        );
      return (
        convertLessThanThousand(Math.floor(n / 1000000000)) +
        ' Billion' +
        (n % 1000000000 ? ' ' + convert(n % 1000000000) : '')
      );
    };

    const intPart = Math.floor(num);
    const decPart = Math.round((num - intPart) * 100);

    let result = convert(intPart) + ' ' + curr.main;
    if (decPart > 0) {
      result += ' and ' + convert(decPart) + ' ' + curr.sub;
    }
    return result + ' Only';
  }

  // Get Incoterm description
  private getIncotermDescription(incoterm: string): string {
    const descriptions: { [key: string]: string } = {
      EXW: "Ex Works - Buyer bears all costs and risks from seller's premises",
      FCA: 'Free Carrier - Seller delivers goods to carrier at named place',
      FAS: 'Free Alongside Ship - Seller delivers goods alongside vessel at port',
      FOB: 'Free On Board - Seller delivers goods on board the vessel',
      CFR: 'Cost and Freight - Seller pays costs and freight to destination port',
      CIF: 'Cost, Insurance & Freight - Seller pays costs, insurance and freight',
      CPT: 'Carriage Paid To - Seller pays carriage to named destination',
      CIP: 'Carriage & Insurance Paid - Seller pays carriage and insurance',
      DAP: 'Delivered At Place - Seller delivers goods at named destination',
      DPU: 'Delivered at Place Unloaded - Seller unloads at destination',
      DDP: 'Delivered Duty Paid - Seller bears all costs including duties',
    };
    return descriptions[incoterm] || incoterm;
  }

  async generateInvoice(
    trade: TradeData,
    signatureDataUrl?: string,
  ): Promise<Buffer> {
    const html = this.buildInvoiceHTML(trade, signatureDataUrl);

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          bottom: '10mm',
          left: '10mm',
          right: '10mm',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private buildInvoiceHTML(
    trade: TradeData,
    signatureDataUrl?: string,
  ): string {
    const invoiceId = `INV-${trade._id.toString().slice(-8).toUpperCase()}`;
    const orderId = `ORD-${trade._id.toString().slice(-8).toUpperCase()}`;
    const invoiceDate = this.formatDate(trade.createdAt);
    const completionDate = trade.completedAt
      ? this.formatDate(trade.completedAt)
      : 'Pending';

    // Calculate values
    const finalPrice = parseFloat(
      trade.sellerOfferedPrice ||
        trade.buyerOfferedPrice ||
        trade.product?.price ||
        '0',
    );
    const quantity = parseFloat(trade.quantity);
    const subtotal = finalPrice * quantity;
    const currency = trade.product?.currency || 'USD';

    // Get incoterm
    const incoterm =
      trade.sellerOfferedIncoterms?.selectedIncoterm ||
      trade.buyerIncoterms?.selectedIncoterm ||
      'FOB';

    // Safe access
    const sellerCompany = trade.seller?.companyId?.companyName || 'Seller';
    const sellerEmail = trade.seller?.mail || 'N/A';
    const sellerCountry = trade.seller?.companyId?.country || '';
    const buyerCompany =
      trade.buyer?.companyId?.companyName ||
      trade.selectedAddress?.fullName ||
      'Buyer';
    const buyerEmail = trade.buyer?.mail || 'N/A';
    const buyerName = trade.selectedAddress?.fullName || '';
    const buyerStreet = trade.selectedAddress?.streetName || '';
    const buyerCity = trade.selectedAddress?.city || '';
    const buyerState = trade.selectedAddress?.state || '';
    const buyerPincode = trade.selectedAddress?.pincode || '';
    const buyerCountry = trade.selectedAddress?.country || '';
    const buyerPhone = trade.selectedAddress?.mobileNumber || '';
    const productName = trade.product?.name || 'N/A';
    const productHsnCode = trade.product?.hsnCode || '-';
    const productOrigin = trade.product?.origin || '-';

    const paymentTerms = this.formatPaymentTerms(trade.paymentMethod);
    const amountInWords = this.numberToWords(subtotal, currency);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Commercial Invoice ${invoiceId}</title>
    <style>${this.getCommonStyles()}</style>
</head>
<body>
    <div class="document">
        <div class="watermark">INVOICE</div>

        <!-- Header with Logo -->
        <div class="company-header">
            <div class="logo-section">
                <div>
                    <img src="${this.getLogoBase64()}" alt="Breyus" class="logo-img" style="height: 55px;" />
                </div>
                <div class="company-info">
                    <strong>Breyus Trading Platform</strong><br>
                    Global Commodity Trading<br>
                    support@breyus.com<br>
                    www.breyus.com
                </div>
            </div>
        </div>

        <div class="doc-title">Commercial Invoice</div>

        <!-- Invoice Info Row -->
        <table class="bordered-table">
            <tr>
                <td class="label" style="width: 15%;">Invoice No.</td>
                <td style="width: 20%;"><strong style="color: ${this.BRAND_PRIMARY};">${invoiceId}</strong></td>
                <td class="label" style="width: 15%;">Invoice Date</td>
                <td style="width: 20%;"><strong>${invoiceDate}</strong></td>
                <td class="label" style="width: 15%;">Order Ref.</td>
                <td style="width: 15%;"><strong>${orderId}</strong></td>
            </tr>
        </table>

        <!-- Seller & Buyer Details -->
        <table class="bordered-table" style="margin-top: -1px;">
            <tr>
                <td colspan="3" class="section-header">Seller / Exporter</td>
                <td colspan="3" class="section-header">Buyer / Importer</td>
            </tr>
            <tr>
                <td class="label">Company</td>
                <td colspan="2"><strong>${sellerCompany}</strong></td>
                <td class="label">Company</td>
                <td colspan="2"><strong>${buyerCompany}</strong></td>
            </tr>
            <tr>
                <td class="label">Contact</td>
                <td colspan="2">${sellerEmail}</td>
                <td class="label">Contact</td>
                <td colspan="2">${buyerName}</td>
            </tr>
            <tr>
                <td class="label">Country</td>
                <td colspan="2">${sellerCountry || 'Via Breyus Platform'}</td>
                <td class="label">Address</td>
                <td colspan="2">${buyerStreet}, ${buyerCity}, ${buyerState} ${buyerPincode}</td>
            </tr>
            <tr>
                <td class="label">Email</td>
                <td colspan="2">${sellerEmail}</td>
                <td class="label">Country</td>
                <td colspan="2">${buyerCountry}</td>
            </tr>
            <tr>
                <td class="label"></td>
                <td colspan="2"></td>
                <td class="label">Phone/Email</td>
                <td colspan="2">${buyerPhone} / ${buyerEmail}</td>
            </tr>
        </table>

        <!-- Delivery Address -->
        <table class="bordered-table" style="margin-top: -1px;">
            <tr>
                <td colspan="6" class="section-header">Ship To / Delivery Address</td>
            </tr>
            <tr>
                <td colspan="6" style="padding: 12px;">
                    <strong>${buyerName}</strong><br>
                    ${buyerStreet}<br>
                    ${buyerCity}, ${buyerState} ${buyerPincode}<br>
                    ${buyerCountry}<br>
                    <span style="color: ${this.TEXT_SECONDARY};">Phone: ${buyerPhone}</span>
                </td>
            </tr>
        </table>

        <!-- Product Details -->
        <table class="bordered-table" style="margin-top: -1px;">
            <tr>
                <th style="width: 5%;">S.No</th>
                <th style="width: 35%;">Description of Goods</th>
                <th style="width: 12%;">HS Code</th>
                <th style="width: 10%;">Origin</th>
                <th style="width: 10%;">Qty</th>
                <th style="width: 13%;">Unit Price</th>
                <th style="width: 15%;" class="text-right">Amount</th>
            </tr>
            <tr>
                <td class="text-center">1</td>
                <td><strong>${productName}</strong></td>
                <td>${productHsnCode}</td>
                <td>${productOrigin}</td>
                <td class="text-center">${trade.quantity} ${trade.quantityUnit}</td>
                <td class="text-right">${currency} ${finalPrice.toFixed(2)}</td>
                <td class="text-right"><strong>${currency} ${subtotal.toFixed(2)}</strong></td>
            </tr>
            <tr>
                <td colspan="4" rowspan="3" class="amount-words">
                    <strong>Amount in Words:</strong><br>
                    ${amountInWords}
                </td>
                <td colspan="2" class="text-right" style="color: ${this.TEXT_SECONDARY};">Subtotal</td>
                <td class="text-right">${currency} ${subtotal.toFixed(2)}</td>
            </tr>
            <tr>
                <td colspan="2" class="text-right" style="color: ${this.TEXT_SECONDARY};">Shipping & Handling</td>
                <td class="text-right">As per ${incoterm}</td>
            </tr>
            <tr class="total-row">
                <td colspan="2" class="text-right bold">Total Amount</td>
                <td class="text-right bold" style="font-size: 13px; color: ${this.BRAND_PRIMARY};">${currency} ${subtotal.toFixed(2)}</td>
            </tr>
        </table>

        <!-- Terms & Conditions -->
        <table class="bordered-table terms-section" style="margin-top: -1px;">
            <tr>
                <td colspan="4" class="section-header">Terms & Conditions</td>
            </tr>
            <tr>
                <td class="label" style="width: 20%;">Incoterm</td>
                <td style="width: 30%;"><strong style="color: ${this.BRAND_PRIMARY};">${incoterm}</strong></td>
                <td class="label" style="width: 20%;">Payment Method</td>
                <td style="width: 30%;"><strong>${trade.paymentMethod?.method || 'N/A'}</strong></td>
            </tr>
            <tr>
                <td class="label">Incoterm Detail</td>
                <td colspan="3" style="font-size: 9px; color: ${this.TEXT_SECONDARY};">${this.getIncotermDescription(incoterm)}</td>
            </tr>
            <tr>
                <td class="label">Payment Terms</td>
                <td><strong>${paymentTerms}</strong></td>
                <td class="label">Completion Date</td>
                <td><strong>${completionDate}</strong></td>
            </tr>
        </table>

        <!-- Payment Information -->
        <table class="bordered-table" style="margin-top: -1px;">
            <tr>
                <td colspan="4" class="section-header">Payment Information</td>
            </tr>
            <tr>
                <td colspan="4" style="text-align: center; padding: 18px; color: ${this.TEXT_SECONDARY}; background: ${this.BG_LIGHT};">
                    Payment is to be arranged directly between Buyer and Seller outside the Breyus platform.<br>
                    <span style="font-size: 9px;">Please contact the seller for bank transfer details and payment instructions.</span>
                </td>
            </tr>
        </table>

        <!-- Signatures -->
        <table class="bordered-table" style="margin-top: 25px;">
            <tr>
                <td style="width: 50%; text-align: center; padding: 20px; background: #fff;">
                    <div style="min-height: 60px;">
                        ${signatureDataUrl ? `<img src="${signatureDataUrl}" style="max-height: 50px;" />` : ''}
                    </div>
                    <div class="signature-line">Authorized Signatory (Seller)</div>
                </td>
                <td style="width: 50%; text-align: center; padding: 20px; background: #fff;">
                    <div style="min-height: 60px;"></div>
                    <div class="signature-line">Received By (Buyer)</div>
                </td>
            </tr>
        </table>

        <!-- Footer -->
        <div class="footer-note">
            <strong>Declaration:</strong> We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.<br><br>
            <strong>Note:</strong> This is a ${signatureDataUrl ? 'digitally signed' : 'computer-generated'} commercial invoice facilitated through the Breyus Trading Platform.
            For any queries, please contact support@breyus.com. All disputes are subject to the platform's terms of service.
        </div>
    </div>
</body>
</html>
        `;
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private formatPaymentTerms(paymentMethod?: {
    type?: string;
    percentage?: string;
    days?: string;
  }): string {
    if (!paymentMethod || !paymentMethod.type) {
      return 'N/A';
    }

    const type = paymentMethod.type;

    if (type === 'advance') {
      return `${paymentMethod.percentage || '100'}% Advance`;
    } else if (type === 'credit') {
      return `${paymentMethod.days || '30'} Days Credit`;
    } else if (type === 'openAccount') {
      return 'Open Account';
    }

    return type;
  }

  /**
   * Generate Purchase Request PDF
   * Available as soon as a trade is created
   */
  async generatePurchaseRequest(trade: TradeData): Promise<Buffer> {
    const html = this.buildPRHTML(trade);

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          bottom: '10mm',
          left: '10mm',
          right: '10mm',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate Purchase Order PDF
   * Available after negotiation is accepted
   */
  async generatePurchaseOrder(trade: TradeData): Promise<Buffer> {
    const html = this.buildPOHTML(trade);

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          bottom: '10mm',
          left: '10mm',
          right: '10mm',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private buildPRHTML(trade: TradeData): string {
    const prNumber = `PR-${trade._id.toString().slice(-8).toUpperCase()}`;
    const prDate = this.formatDate(trade.createdAt);
    const validityDate = new Date(trade.createdAt);
    validityDate.setDate(validityDate.getDate() + 30);
    const validUntil = this.formatDate(validityDate);

    // Calculate values
    const offeredPrice = parseFloat(
      trade.buyerOfferedPrice || trade.product?.price || '0',
    );
    const quantity = parseFloat(trade.quantity);
    const totalValue = offeredPrice * quantity;
    const currency = trade.product?.currency || 'USD';

    // Get incoterm
    const incoterm = trade.buyerIncoterms?.selectedIncoterm || 'FOB';

    // Safe access
    const buyerCompany =
      trade.buyer?.companyId?.companyName ||
      trade.selectedAddress?.fullName ||
      'Buyer';
    const buyerEmail = trade.buyer?.mail || 'N/A';
    const sellerCompany = trade.seller?.companyId?.companyName || 'Seller';
    const sellerEmail = trade.seller?.mail || 'N/A';
    const sellerCountry = trade.seller?.companyId?.country || '';
    const buyerName = trade.selectedAddress?.fullName || '';
    const buyerPhone = trade.selectedAddress?.mobileNumber || '';
    const buyerStreet = trade.selectedAddress?.streetName || '';
    const buyerCity = trade.selectedAddress?.city || '';
    const buyerState = trade.selectedAddress?.state || '';
    const buyerPincode = trade.selectedAddress?.pincode || '';
    const buyerCountry = trade.selectedAddress?.country || '';
    const productName = trade.product?.name || 'N/A';
    const productHsnCode = trade.product?.hsnCode || '-';
    const productOrigin = trade.product?.origin || '-';

    const paymentTerms = this.formatPaymentTerms(trade.paymentMethod);
    const amountInWords = this.numberToWords(totalValue, currency);

    // Determine status with modern styling
    let status = 'Pending Review';
    let statusClass = 'status-pending';
    if (trade.negotiationStatus === 'countered') {
      status = 'Under Negotiation';
      statusClass = 'status-negotiation';
    } else if (trade.negotiationStatus === 'accepted') {
      status = 'Accepted';
      statusClass = 'status-accepted';
    } else if (trade.negotiationStatus === 'rejected') {
      status = 'Rejected';
      statusClass = 'status-rejected';
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Purchase Request ${prNumber}</title>
    <style>${this.getCommonStyles()}</style>
</head>
<body>
    <div class="document">
        <div class="watermark">REQUEST</div>

        <!-- Header with Logo -->
        <div class="company-header">
            <div class="logo-section">
                <div>
                    <img src="${this.getLogoBase64()}" alt="Breyus" class="logo-img" style="height: 55px;" />
                </div>
                <div class="company-info">
                    <strong>Breyus Trading Platform</strong><br>
                    Global Commodity Trading<br>
                    support@breyus.com<br>
                    www.breyus.com
                </div>
            </div>
        </div>

        <div class="doc-title">Purchase Request</div>

        <!-- PR Info Row -->
        <table class="bordered-table">
            <tr>
                <td class="label" style="width: 15%;">PR Number</td>
                <td style="width: 20%;"><strong style="color: ${this.BRAND_PRIMARY};">${prNumber}</strong></td>
                <td class="label" style="width: 12%;">PR Date</td>
                <td style="width: 18%;"><strong>${prDate}</strong></td>
                <td class="label" style="width: 12%;">Valid Until</td>
                <td style="width: 23%;"><strong>${validUntil}</strong></td>
            </tr>
            <tr>
                <td class="label">Status</td>
                <td colspan="5"><span class="status-badge ${statusClass}">${status}</span></td>
            </tr>
        </table>

        <!-- Buyer & Seller Details -->
        <table class="bordered-table" style="margin-top: -1px;">
            <tr>
                <td colspan="3" class="section-header">Buyer / Requester</td>
                <td colspan="3" class="section-header">Seller / Supplier</td>
            </tr>
            <tr>
                <td class="label">Company</td>
                <td colspan="2"><strong>${buyerCompany}</strong></td>
                <td class="label">Company</td>
                <td colspan="2"><strong>${sellerCompany}</strong></td>
            </tr>
            <tr>
                <td class="label">Contact</td>
                <td colspan="2">${buyerName || buyerEmail}</td>
                <td class="label">Contact</td>
                <td colspan="2">${sellerEmail}</td>
            </tr>
            <tr>
                <td class="label">Email</td>
                <td colspan="2">${buyerEmail}</td>
                <td class="label">Email</td>
                <td colspan="2">${sellerEmail}</td>
            </tr>
            <tr>
                <td class="label">Phone</td>
                <td colspan="2">${buyerPhone || '-'}</td>
                <td class="label">Country</td>
                <td colspan="2">${sellerCountry || 'Via Breyus Platform'}</td>
            </tr>
        </table>

        <!-- Delivery Address -->
        <table class="bordered-table" style="margin-top: -1px;">
            <tr>
                <td colspan="6" class="section-header">Requested Delivery Address</td>
            </tr>
            <tr>
                <td colspan="6" style="padding: 12px;">
                    <strong>${buyerName}</strong><br>
                    ${buyerStreet}<br>
                    ${buyerCity}${buyerState ? ', ' + buyerState : ''} ${buyerPincode}<br>
                    ${buyerCountry}<br>
                    <span style="color: ${this.TEXT_SECONDARY};">${buyerPhone ? 'Phone: ' + buyerPhone : ''}</span>
                </td>
            </tr>
        </table>

        <!-- Product Details -->
        <table class="bordered-table" style="margin-top: -1px;">
            <tr>
                <th style="width: 5%;">S.No</th>
                <th style="width: 35%;">Product Description</th>
                <th style="width: 12%;">HS Code</th>
                <th style="width: 10%;">Origin</th>
                <th style="width: 10%;">Qty</th>
                <th style="width: 13%;">Offered Price</th>
                <th style="width: 15%;" class="text-right">Total Value</th>
            </tr>
            <tr>
                <td class="text-center">1</td>
                <td><strong>${productName}</strong></td>
                <td>${productHsnCode}</td>
                <td>${productOrigin}</td>
                <td class="text-center">${trade.quantity} ${trade.quantityUnit}</td>
                <td class="text-right">${currency} ${offeredPrice.toFixed(2)}</td>
                <td class="text-right"><strong>${currency} ${totalValue.toFixed(2)}</strong></td>
            </tr>
            <tr>
                <td colspan="4" rowspan="2" class="amount-words">
                    <strong>Amount in Words:</strong><br>
                    ${amountInWords}
                </td>
                <td colspan="2" class="text-right" style="color: ${this.TEXT_SECONDARY};">Subtotal</td>
                <td class="text-right">${currency} ${totalValue.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
                <td colspan="2" class="text-right bold">Requested Total</td>
                <td class="text-right bold" style="font-size: 13px; color: ${this.BRAND_PRIMARY};">${currency} ${totalValue.toFixed(2)}</td>
            </tr>
        </table>

        <!-- Requested Terms -->
        <table class="bordered-table terms-section" style="margin-top: -1px;">
            <tr>
                <td colspan="4" class="section-header">Requested Terms & Conditions</td>
            </tr>
            <tr>
                <td class="label" style="width: 20%;">Requested Incoterm</td>
                <td style="width: 30%;"><strong style="color: ${this.BRAND_PRIMARY};">${incoterm}</strong></td>
                <td class="label" style="width: 20%;">Payment Method</td>
                <td style="width: 30%;"><strong>${trade.paymentMethod?.method || 'To be negotiated'}</strong></td>
            </tr>
            <tr>
                <td class="label">Incoterm Detail</td>
                <td colspan="3" style="font-size: 9px; color: ${this.TEXT_SECONDARY};">${this.getIncotermDescription(incoterm)}</td>
            </tr>
            <tr>
                <td class="label">Payment Terms</td>
                <td colspan="3"><strong>${paymentTerms}</strong></td>
            </tr>
        </table>

        ${
          trade.buyerMessage
            ? `
        <!-- Buyer Message -->
        <table class="bordered-table" style="margin-top: -1px;">
            <tr>
                <td colspan="4" class="section-header">Additional Notes / Requirements</td>
            </tr>
            <tr>
                <td colspan="4" style="padding: 14px; font-style: italic; background: ${this.BG_LIGHT}; color: ${this.TEXT_SECONDARY}; border-left: 3px solid ${this.BRAND_SECONDARY};">
                    "${trade.buyerMessage}"
                </td>
            </tr>
        </table>
        `
            : ''
        }

        <!-- Signature Section -->
        <table class="bordered-table" style="margin-top: 25px;">
            <tr>
                <td style="width: 50%; text-align: center; padding: 20px; background: #fff;">
                    <div style="min-height: 50px;"></div>
                    <div class="signature-line">Buyer / Requester Signature</div>
                    <div style="font-size: 8px; color: ${this.TEXT_SECONDARY}; margin-top: 5px;">Date: _______________</div>
                </td>
                <td style="width: 50%; text-align: center; padding: 20px; background: #fff;">
                    <div style="min-height: 50px;"></div>
                    <div class="signature-line">For Internal Use Only</div>
                    <div style="font-size: 8px; color: ${this.TEXT_SECONDARY}; margin-top: 5px;">Date: _______________</div>
                </td>
            </tr>
        </table>

        <!-- Footer / Disclaimer -->
        <div class="footer-note" style="border-left-color: #E65100;">
            <strong style="color: #E65100;">⚠ Important Notice:</strong> This Purchase Request is a preliminary inquiry and does NOT constitute a binding order or contract.
            All terms, prices, and conditions are subject to negotiation and formal acceptance by the seller. A legally binding agreement
            will only be formed upon issuance of a confirmed Purchase Order accepted by both parties.<br><br>
            <span style="color: ${this.BRAND_PRIMARY};"><strong>Document Reference:</strong> ${prNumber}</span> | Generated via Breyus Trading Platform | support@breyus.com
        </div>
    </div>
</body>
</html>
        `;
  }

  private buildPOHTML(trade: TradeData): string {
    const poNumber = `PO-${trade._id.toString().slice(-8).toUpperCase()}`;
    const prNumber = `PR-${trade._id.toString().slice(-8).toUpperCase()}`;
    const poDate = this.formatDate(trade.createdAt);
    const acceptedDate = trade.acceptedAt
      ? this.formatDate(new Date(trade.acceptedAt))
      : this.formatDate(new Date());

    // Calculate final agreed values
    const finalPrice = parseFloat(
      trade.sellerOfferedPrice ||
        trade.buyerOfferedPrice ||
        trade.product?.price ||
        '0',
    );
    const quantity = parseFloat(trade.quantity);
    const totalValue = finalPrice * quantity;
    const currency = trade.product?.currency || 'USD';

    // Get final incoterm
    const finalIncoterm =
      trade.sellerOfferedIncoterms?.selectedIncoterm ||
      trade.buyerIncoterms?.selectedIncoterm ||
      'FOB';

    // Safe access
    const buyerCompany =
      trade.buyer?.companyId?.companyName ||
      trade.selectedAddress?.fullName ||
      'Buyer';
    const buyerEmail = trade.buyer?.mail || 'N/A';
    const sellerCompany = trade.seller?.companyId?.companyName || 'Seller';
    const sellerEmail = trade.seller?.mail || 'N/A';
    const sellerCountry = trade.seller?.companyId?.country || '';
    const buyerName = trade.selectedAddress?.fullName || '';
    const buyerPhone = trade.selectedAddress?.mobileNumber || '';
    const buyerStreet = trade.selectedAddress?.streetName || '';
    const buyerCity = trade.selectedAddress?.city || '';
    const buyerState = trade.selectedAddress?.state || '';
    const buyerPincode = trade.selectedAddress?.pincode || '';
    const buyerCountry = trade.selectedAddress?.country || '';
    const productName = trade.product?.name || 'N/A';
    const productHsnCode = trade.product?.hsnCode || '-';
    const productOrigin = trade.product?.origin || '-';

    const paymentTerms = this.formatPaymentTerms(trade.paymentMethod);
    const amountInWords = this.numberToWords(totalValue, currency);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Purchase Order ${poNumber}</title>
    <style>${this.getCommonStyles()}</style>
</head>
<body>
    <div class="document">
        <div class="watermark">CONFIRMED</div>

        <!-- Header with Logo -->
        <div class="company-header">
            <div class="logo-section">
                <div>
                    <img src="${this.getLogoBase64()}" alt="Breyus" class="logo-img" style="height: 55px;" />
                </div>
                <div class="company-info">
                    <strong>Breyus Trading Platform</strong><br>
                    Global Commodity Trading<br>
                    support@breyus.com<br>
                    www.breyus.com
                </div>
            </div>
        </div>

        <div class="doc-title">Purchase Order</div>

        <!-- PO Info Row -->
        <table class="bordered-table">
            <tr>
                <td class="label" style="width: 15%;">PO Number</td>
                <td style="width: 20%;"><strong style="color: ${this.BRAND_PRIMARY};">${poNumber}</strong></td>
                <td class="label" style="width: 12%;">PO Date</td>
                <td style="width: 18%;"><strong>${poDate}</strong></td>
                <td class="label" style="width: 12%;">PR Ref.</td>
                <td style="width: 23%;"><strong>${prNumber}</strong></td>
            </tr>
            <tr>
                <td class="label">Status</td>
                <td><span class="status-badge status-confirmed">✓ Confirmed</span></td>
                <td class="label">Accepted Date</td>
                <td colspan="3"><strong>${acceptedDate}</strong></td>
            </tr>
        </table>

        <!-- Buyer & Seller Details -->
        <table class="bordered-table" style="margin-top: -1px;">
            <tr>
                <td colspan="3" class="section-header">Buyer Details</td>
                <td colspan="3" class="section-header">Seller Details</td>
            </tr>
            <tr>
                <td class="label">Company</td>
                <td colspan="2"><strong>${buyerCompany}</strong></td>
                <td class="label">Company</td>
                <td colspan="2"><strong>${sellerCompany}</strong></td>
            </tr>
            <tr>
                <td class="label">Contact</td>
                <td colspan="2">${buyerName || buyerEmail}</td>
                <td class="label">Contact</td>
                <td colspan="2">${sellerEmail}</td>
            </tr>
            <tr>
                <td class="label">Address</td>
                <td colspan="2">${buyerStreet}, ${buyerCity}</td>
                <td class="label">Email</td>
                <td colspan="2">${sellerEmail}</td>
            </tr>
            <tr>
                <td class="label">Country</td>
                <td colspan="2">${buyerCountry}</td>
                <td class="label">Country</td>
                <td colspan="2">${sellerCountry || 'Via Breyus Platform'}</td>
            </tr>
            <tr>
                <td class="label">Phone/Email</td>
                <td colspan="2">${buyerPhone} / ${buyerEmail}</td>
                <td class="label"></td>
                <td colspan="2"></td>
            </tr>
        </table>

        <!-- Delivery Address -->
        <table class="bordered-table" style="margin-top: -1px;">
            <tr>
                <td colspan="6" class="section-header">Ship To / Delivery Address</td>
            </tr>
            <tr>
                <td colspan="6" style="padding: 12px;">
                    <strong>${buyerName}</strong><br>
                    ${buyerStreet}<br>
                    ${buyerCity}${buyerState ? ', ' + buyerState : ''} ${buyerPincode}<br>
                    ${buyerCountry}<br>
                    <span style="color: ${this.TEXT_SECONDARY};">${buyerPhone ? 'Phone: ' + buyerPhone : ''}</span>
                </td>
            </tr>
        </table>

        <!-- Product Details -->
        <table class="bordered-table" style="margin-top: -1px;">
            <tr>
                <th style="width: 5%;">S.No</th>
                <th style="width: 35%;">Description of Goods</th>
                <th style="width: 12%;">HS Code</th>
                <th style="width: 10%;">Origin</th>
                <th style="width: 10%;">Qty</th>
                <th style="width: 13%;">Unit Price</th>
                <th style="width: 15%;" class="text-right">Amount</th>
            </tr>
            <tr>
                <td class="text-center">1</td>
                <td><strong>${productName}</strong></td>
                <td>${productHsnCode}</td>
                <td>${productOrigin}</td>
                <td class="text-center">${trade.quantity} ${trade.quantityUnit}</td>
                <td class="text-right">${currency} ${finalPrice.toFixed(2)}</td>
                <td class="text-right"><strong>${currency} ${totalValue.toFixed(2)}</strong></td>
            </tr>
            <tr>
                <td colspan="4" rowspan="3" class="amount-words">
                    <strong>Amount in Words:</strong><br>
                    ${amountInWords}
                </td>
                <td colspan="2" class="text-right" style="color: ${this.TEXT_SECONDARY};">Subtotal</td>
                <td class="text-right">${currency} ${totalValue.toFixed(2)}</td>
            </tr>
            <tr>
                <td colspan="2" class="text-right" style="color: ${this.TEXT_SECONDARY};">Shipping & Handling</td>
                <td class="text-right">As per ${finalIncoterm}</td>
            </tr>
            <tr class="total-row">
                <td colspan="2" class="text-right bold">Order Total</td>
                <td class="text-right bold" style="font-size: 13px; color: ${this.BRAND_PRIMARY};">${currency} ${totalValue.toFixed(2)}</td>
            </tr>
        </table>

        <!-- Agreed Terms -->
        <table class="bordered-table terms-section" style="margin-top: -1px;">
            <tr>
                <td colspan="4" class="section-header">Agreed Terms & Conditions</td>
            </tr>
            <tr>
                <td class="label" style="width: 20%;">Incoterm</td>
                <td style="width: 30%;"><strong style="color: ${this.BRAND_PRIMARY};">${finalIncoterm}</strong></td>
                <td class="label" style="width: 20%;">Payment Method</td>
                <td style="width: 30%;"><strong>${trade.paymentMethod?.method || 'N/A'}</strong></td>
            </tr>
            <tr>
                <td class="label">Incoterm Detail</td>
                <td colspan="3" style="font-size: 9px; color: ${this.TEXT_SECONDARY};">${this.getIncotermDescription(finalIncoterm)}</td>
            </tr>
            <tr>
                <td class="label">Payment Terms</td>
                <td><strong>${paymentTerms}</strong></td>
                <td class="label">Currency</td>
                <td><strong>${currency}</strong></td>
            </tr>
        </table>

        <!-- Standard Terms -->
        <table class="bordered-table" style="margin-top: -1px;">
            <tr>
                <td colspan="2" class="section-header">Standard Purchase Order Terms</td>
            </tr>
            <tr>
                <td style="width: 50%; vertical-align: top; font-size: 8px; padding: 12px; line-height: 1.6; color: ${this.TEXT_SECONDARY};">
                    <strong style="color: ${this.TEXT_PRIMARY};">1. Acceptance:</strong> This PO is subject to seller's acceptance. Commencement of performance constitutes acceptance.<br><br>
                    <strong style="color: ${this.TEXT_PRIMARY};">2. Delivery:</strong> Time is of the essence. Seller shall deliver goods per the agreed Incoterm and schedule.<br><br>
                    <strong style="color: ${this.TEXT_PRIMARY};">3. Quality:</strong> All goods must conform to specifications and be free from defects. Seller warrants goods for merchantability.
                </td>
                <td style="width: 50%; vertical-align: top; font-size: 8px; padding: 12px; line-height: 1.6; color: ${this.TEXT_SECONDARY};">
                    <strong style="color: ${this.TEXT_PRIMARY};">4. Payment:</strong> Payment per agreed terms, subject to satisfactory delivery and inspection of goods.<br><br>
                    <strong style="color: ${this.TEXT_PRIMARY};">5. Inspection:</strong> Buyer reserves right to inspect goods upon delivery. Acceptance does not waive latent defect claims.<br><br>
                    <strong style="color: ${this.TEXT_PRIMARY};">6. Governing Law:</strong> This PO is governed by laws agreed upon by both parties via the platform's terms of service.
                </td>
            </tr>
        </table>

        <!-- Signatures -->
        <table class="bordered-table" style="margin-top: 20px;">
            <tr>
                <td style="width: 50%; text-align: center; padding: 20px; background: #fff;">
                    <div style="min-height: 50px;"></div>
                    <div class="signature-line">Authorized Buyer Signature</div>
                    <div style="font-size: 8px; color: ${this.TEXT_SECONDARY}; margin-top: 5px;">Name: _______________</div>
                    <div style="font-size: 8px; color: ${this.TEXT_SECONDARY};">Date: _______________</div>
                </td>
                <td style="width: 50%; text-align: center; padding: 20px; background: #fff;">
                    <div style="min-height: 50px;"></div>
                    <div class="signature-line">Authorized Seller Signature</div>
                    <div style="font-size: 8px; color: ${this.TEXT_SECONDARY}; margin-top: 5px;">Name: _______________</div>
                    <div style="font-size: 8px; color: ${this.TEXT_SECONDARY};">Date: _______________</div>
                </td>
            </tr>
        </table>

        <!-- Footer -->
        <div class="footer-note">
            <strong style="color: ${this.BRAND_DARK};">✓ Binding Agreement:</strong> This Purchase Order constitutes a legally binding agreement between the Buyer and Seller
            based on the terms negotiated and mutually accepted through the Breyus Trading Platform. Both parties agree to fulfill their
            respective obligations as specified herein.<br><br>
            <span style="color: ${this.BRAND_PRIMARY};"><strong>Document Reference:</strong> ${poNumber}</span> | PR Reference: ${prNumber} | Generated via Breyus Trading Platform | support@breyus.com
        </div>
    </div>
</body>
</html>
        `;
  }
}
