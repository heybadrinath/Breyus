import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';

export interface PurchaseRequestData {
  // Buyer company details
  buyerCompany: {
    name: string;
    address1: string;
    address2?: string;
    gstin: string;
    state: string;
    stateCode: string;
  };
  
  // Seller company details  
  sellerCompany: {
    name: string;
    address1: string;
    address2?: string;
    gstin: string;
    state: string;
    stateCode: string;
  };

  // Purchase request details
  purchaseRequest: {
    poNumber: string;
    poDate: string;
    poDetails: string;
    sizeDays: string;
  };

  // Delivery address
  deliveryAddress: {
    name: string;
    address1: string;
    address2?: string;
    gstin: string;
    state: string;
    stateCode: string;
  };

  // Product details
  product: {
    name: string;
    description: string;
    specification?: string;
    quantity: number;
    price: number;
    cost: number;
    sgst: number;
    cgst: number;
    total: number;
  };

  // Terms and conditions
  terms: {
    paymentTerms: string;
    deliverySchedule: string;
    otherTerms: string;
    brokerage: string;
    totalAmountBeforeTax: number;
    cost: number;
    sgst: number;
    cgst: number;
    taxAmount: number;
    totalAmountAfterTax: number;
    amountInWords: string;
  };

  // Special instructions
  specialInstructions?: string;
}

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  async generatePurchaseRequestPdf(data: PurchaseRequestData): Promise<Buffer> {
    this.logger.log('Generating purchase request PDF');
    
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      // Set the page size to A4
      await page.setViewport({ width: 794, height: 1123 });
      
      const htmlContent = this.generateHtmlTemplate(data);
      
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        }
      });
      
      this.logger.log('PDF generated successfully');
      return pdfBuffer;
      
    } catch (error) {
      this.logger.error('Error generating PDF:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private generateHtmlTemplate(data: PurchaseRequestData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Purchase Request</title>
    <style>        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 15px;
            font-size: 12px;
            color: #3C342A;
            background-color: #FDFCFA;
        }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 2px solid #8B7355;
            padding: 10px;
            margin-bottom: 10px;
            background-color: #FAFAF8;
            border-radius: 6px;
        }
        
        .logo-section {
            display: flex;
            align-items: center;
        }
          .logo {
            width: 60px;
            height: 60px;
            background: linear-gradient(45deg, #8B7355, #A68B5B);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 18px;
            margin-right: 15px;
        }
        
        .company-info {
            text-align: right;
            font-size: 10px;
        }
        
        .company-info h1 {
            margin: 0;
            font-size: 14px;
            font-weight: bold;
        }
          .purchase-order-title {
            text-align: center;
            font-weight: bold;
            font-size: 16px;
            margin: 10px 0;
            padding: 8px;
            background: linear-gradient(135deg, #8B7355, #A68B5B);
            color: white;
            border: 1px solid #6B5B47;
            border-radius: 4px;
        }
        
        .vendor-section {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
        }
          .vendor-details, .po-details {
            flex: 1;
            border: 1px solid #8B7355;
            padding: 8px;
            background-color: #FAFAF8;
            border-radius: 4px;
        }
          .section-header {
            background: linear-gradient(135deg, #A68B5B, #C4A975);
            color: white;
            font-weight: bold;
            text-align: center;
            padding: 6px;
            margin: -8px -8px 8px -8px;
            border-radius: 3px 3px 0 0;
        }
        
        .address-section {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
        }
          .company-address {
            flex: 1;
            border: 1px solid #8B7355;
            padding: 8px;
            background-color: #FAFAF8;
            border-radius: 4px;
        }
          .address-header {
            background: linear-gradient(135deg, #A68B5B, #C4A975);
            color: white;
            font-weight: bold;
            text-align: center;
            padding: 6px;
            margin: -8px -8px 8px -8px;
            border-radius: 3px 3px 0 0;
        }
        
        .product-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
          .product-table th {
            background: linear-gradient(135deg, #A68B5B, #C4A975);
            color: white;
            border: 1px solid #8B7355;
            padding: 8px;
            text-align: center;
            font-weight: bold;
            font-size: 10px;
        }
          .product-table td {
            border: 1px solid #8B7355;
            padding: 8px;
            text-align: center;
            font-size: 10px;
            background-color: #FAFAF8;
        }
        
        .product-description {
            text-align: left;
            font-size: 9px;
        }
        
        .terms-section {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }
          .terms-left {
            flex: 1;
            border: 1px solid #8B7355;
            padding: 8px;
            background-color: #FAFAF8;
            border-radius: 4px;
        }
        
        .terms-right {
            width: 200px;
            border: 1px solid #8B7355;
            padding: 8px;
            background-color: #FAFAF8;
            border-radius: 4px;
        }
          .terms-header {
            background: linear-gradient(135deg, #A68B5B, #C4A975);
            color: white;
            font-weight: bold;
            text-align: center;
            padding: 6px;
            margin: -8px -8px 8px -8px;
            border-radius: 3px 3px 0 0;
        }
        
        .amount-row {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
        }
        
        .signature-section {
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
        }
          .signature-box {
            width: 200px;
            height: 80px;
            border: 1px solid #8B7355;
            text-align: center;
            padding: 10px;
            background-color: #FAFAF8;
            border-radius: 4px;
        }
          .special-instructions {
            margin-top: 10px;
            border: 1px solid #8B7355;
            padding: 8px;
            background-color: #F5F3F0;
            border-radius: 4px;
        }
          .field-label {
            font-weight: bold;
            display: inline-block;
            min-width: 80px;
            color: #6B5B47;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">        <div class="logo-section">
            <div class="logo">
                BR
            </div>
            <div>
                <strong>BREYUS</strong>
            </div>
        </div>
        <div class="company-info">
            <h1>BREYUS SUSTAINABILITY SOLUTIONS PVT LTD</h1>
            <div>220/1C NELLIPPAKKAMMEL COMPLEX, NORTH GATE</div>
            <div>VAIKAM P.O, KOTTAYAM KERALA - 686141</div>
        </div>
    </div>

    <!-- Purchase Order Title -->
    <div class="purchase-order-title">PURCHASE ORDER</div>

    <!-- Vendor and PO Details -->
    <div class="vendor-section">
        <div class="vendor-details">
            <div class="section-header">Vendor Name</div>
            <div><span class="field-label">Address1:</span> ${data.sellerCompany.address1}</div>
            <div><span class="field-label">Address2:</span> ${data.sellerCompany.address2 || ''}</div>
            <div><span class="field-label">GSTIN:</span> ${data.sellerCompany.gstin}</div>
        </div>
        <div class="po-details">
            <div class="section-header">PO Details</div>
            <div><span class="field-label">P.O No:</span> ${data.purchaseRequest.poNumber}</div>
            <div><span class="field-label">P.O Date:</span> ${data.purchaseRequest.poDate}</div>
            <div><span class="field-label">P.O Days:</span> ${data.purchaseRequest.poDetails}</div>
            <div><span class="field-label">Size Date:</span> ${data.purchaseRequest.sizeDays}</div>
        </div>
    </div>

    <!-- Company and Delivery Address -->
    <div class="address-section">
        <div class="company-address">
            <div class="address-header">COMPANY ADDRESS</div>
            <div><span class="field-label">Name:</span> ${data.buyerCompany.name}</div>
            <div><span class="field-label">Address1:</span> ${data.buyerCompany.address1}</div>
            <div><span class="field-label">Address2:</span> ${data.buyerCompany.address2 || ''}</div>
            <div><span class="field-label">GSTIN:</span> ${data.buyerCompany.gstin}</div>
            <div><span class="field-label">State:</span> ${data.buyerCompany.state} <span class="field-label">State code:</span> ${data.buyerCompany.stateCode}</div>
        </div>
        <div class="company-address">
            <div class="address-header">Delivery Address</div>
            <div><span class="field-label">Name:</span> ${data.deliveryAddress.name}</div>
            <div><span class="field-label">Address1:</span> ${data.deliveryAddress.address1}</div>
            <div><span class="field-label">Address2:</span> ${data.deliveryAddress.address2 || ''}</div>
            <div><span class="field-label">GSTIN:</span> ${data.deliveryAddress.gstin}</div>
            <div><span class="field-label">State:</span> ${data.deliveryAddress.state} <span class="field-label">State code:</span> ${data.deliveryAddress.stateCode}</div>
        </div>
    </div>

    <!-- Product Table -->
    <table class="product-table">
        <thead>
            <tr>
                <th>S.No</th>
                <th>NAME OF THE PRODUCT/SERVICE</th>
                <th>HSN CODE</th>
                <th>QTY(MT)</th>
                <th>RATE</th>
                <th>AMOUNT</th>
                <th>COST</th>
                <th>SGST</th>
                <th>CGST</th>
                <th>TOTAL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>1</td>
                <td class="product-description">
                    <strong>${data.product.name}</strong><br/>
                    ${data.product.description}<br/>
                    ${data.product.specification || ''}
                </td>
                <td>-</td>
                <td>${data.product.quantity}</td>
                <td>₹${data.product.price.toFixed(2)}</td>
                <td>₹${(data.product.price * data.product.quantity).toFixed(2)}</td>
                <td>₹${data.product.cost.toFixed(2)}</td>
                <td>₹${data.product.sgst.toFixed(2)}</td>
                <td>₹${data.product.cgst.toFixed(2)}</td>
                <td>₹${data.product.total.toFixed(2)}</td>
            </tr>
            <tr>
                <td colspan="9" style="text-align: right; font-weight: bold;">TOTAL</td>
                <td style="font-weight: bold;">₹${data.product.total.toFixed(2)}</td>
            </tr>
        </tbody>
    </table>

    <!-- Terms and Conditions -->
    <div class="terms-section">
        <div class="terms-left">
            <div class="terms-header">Terms and Conditions</div>
            <div><strong>PAYMENT TERMS:</strong> ${data.terms.paymentTerms}</div>
            <div><strong>DELIVERY SCHEDULE:</strong> ${data.terms.deliverySchedule}</div>
            <div><strong>OTHER TERMS:</strong> ${data.terms.otherTerms}</div>
            <div><strong>BROKERAGE:</strong> ${data.terms.brokerage}</div>
        </div>
        <div class="terms-right">
            <div class="terms-header">Total Amount Before Tax</div>
            <div class="amount-row">
                <span>COST:</span>
                <span>₹${data.terms.cost.toFixed(2)}</span>
            </div>
            <div class="amount-row">
                <span>SGST:</span>
                <span>₹${data.terms.sgst.toFixed(2)}</span>
            </div>
            <div class="amount-row">
                <span>CGST:</span>
                <span>₹${data.terms.cgst.toFixed(2)}</span>
            </div>
            <div class="amount-row">
                <span>Tax Amount:</span>
                <span>₹${data.terms.taxAmount.toFixed(2)}</span>
            </div>            <div class="amount-row" style="border-top: 1px solid #8B7355; margin-top: 5px; padding-top: 5px; font-weight: bold;">
                <span>Total Amount After Tax:</span>
                <span>₹${data.terms.totalAmountAfterTax.toFixed(2)}</span>
            </div>
            <div style="margin-top: 10px;">
                <strong>Amount in Words:</strong><br/>
                ${data.terms.amountInWords}
            </div>
        </div>
    </div>

    <!-- Special Instructions -->
    ${data.specialInstructions ? `
    <div class="special-instructions">
        <strong>Special Instructions:</strong> ${data.specialInstructions}
    </div>
    ` : ''}

    <!-- Signature Section -->
    <div class="signature-section">
        <div class="signature-box">
            <div style="margin-bottom: 50px;"><strong>From</strong></div>
            <div style="margin-bottom: 10px;"><strong>Buyer</strong></div>
        </div>
        <div class="signature-box">
            <div style="margin-bottom: 50px;"><strong>SUPPLIER</strong></div>
        </div>
    </div>
</body>
</html>
    `;
  }
} 