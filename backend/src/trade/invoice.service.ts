import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

interface TradeData {
    _id: any;
    product: {
        name: string;
        price: string;
        currency: string;
        hsnCode?: string;
    };
    buyer: {
        mail: string;
    };
    seller: {
        mail: string;
    };
    quantity: string;
    quantityUnit: string;
    buyerOfferedPrice?: string;
    sellerOfferedPrice?: string;
    selectedAddress: {
        fullName: string;
        streetName: string;
        city: string;
        state: string;
        country: string;
        pincode: string;
        mobileNumber: string;
    };
    paymentMethod: {
        type: string;
        method: string;
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
    tradePhase: string;
}

@Injectable()
export class InvoiceService {
    async generateInvoice(trade: TradeData, signatureDataUrl?: string): Promise<Buffer> {
        const html = this.buildInvoiceHTML(trade, signatureDataUrl);

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        try {
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    bottom: '20mm',
                    left: '15mm',
                    right: '15mm'
                }
            });

            return Buffer.from(pdfBuffer);
        } finally {
            await browser.close();
        }
    }

    private buildInvoiceHTML(trade: TradeData, signatureDataUrl?: string): string {
        const orderId = `ORD-${trade._id.toString().slice(-8).toUpperCase()}`;
        const invoiceId = `INV-${trade._id.toString().slice(-8).toUpperCase()}`;
        const orderDate = this.formatDate(trade.createdAt);
        const deliveryDate = trade.completedAt ? this.formatDate(trade.completedAt) : 'Pending';

        // Calculate final price (use agreed price from negotiation or original)
        const finalPrice = parseFloat(trade.sellerOfferedPrice || trade.buyerOfferedPrice || trade.product.price || '0');
        const quantity = parseFloat(trade.quantity);
        const subtotal = finalPrice * quantity;
        const currency = trade.product.currency || 'USD';

        // Get incoterm
        const incoterm = trade.sellerOfferedIncoterms?.selectedIncoterm ||
                        trade.buyerIncoterms?.selectedIncoterm ||
                        'FOB';

        // Payment terms text
        const paymentTerms = this.formatPaymentTerms(trade.paymentMethod);

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceId}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #333;
            background: #fff;
        }

        .invoice {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }

        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #0076D3;
        }

        .logo span {
            color: #333;
        }

        .invoice-title {
            text-align: right;
        }

        .invoice-title h1 {
            font-size: 32px;
            color: #333;
            margin-bottom: 5px;
        }

        .invoice-title p {
            color: #666;
            font-size: 14px;
        }

        .parties {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }

        .party {
            width: 45%;
        }

        .party h3 {
            font-size: 12px;
            text-transform: uppercase;
            color: #666;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }

        .party p {
            margin-bottom: 3px;
        }

        .party .name {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 5px;
        }

        .order-info {
            display: flex;
            justify-content: space-between;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 30px;
        }

        .order-info-item {
            text-align: center;
        }

        .order-info-item label {
            display: block;
            font-size: 10px;
            text-transform: uppercase;
            color: #666;
            margin-bottom: 5px;
        }

        .order-info-item span {
            font-weight: bold;
            font-size: 13px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }

        th {
            background: #333;
            color: #fff;
            padding: 12px 10px;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
        }

        th:last-child {
            text-align: right;
        }

        td {
            padding: 12px 10px;
            border-bottom: 1px solid #eee;
        }

        td:last-child {
            text-align: right;
        }

        .product-name {
            font-weight: bold;
        }

        .product-code {
            color: #666;
            font-size: 11px;
        }

        .totals {
            display: flex;
            justify-content: flex-end;
        }

        .totals-table {
            width: 300px;
        }

        .totals-table tr td {
            padding: 8px 0;
            border: none;
        }

        .totals-table tr td:first-child {
            text-align: left;
            color: #666;
        }

        .totals-table tr td:last-child {
            text-align: right;
            font-weight: bold;
        }

        .totals-table .total-row {
            border-top: 2px solid #333;
        }

        .totals-table .total-row td {
            font-size: 16px;
            padding-top: 12px;
        }

        .terms {
            margin-top: 30px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
        }

        .terms h3 {
            font-size: 12px;
            text-transform: uppercase;
            color: #666;
            margin-bottom: 10px;
        }

        .terms-grid {
            display: flex;
            gap: 40px;
        }

        .terms-item {
            flex: 1;
        }

        .terms-item label {
            display: block;
            font-size: 10px;
            text-transform: uppercase;
            color: #888;
            margin-bottom: 3px;
        }

        .terms-item span {
            font-weight: bold;
        }

        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 11px;
        }

        .footer p {
            margin-bottom: 5px;
        }

        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .status-completed {
            background: #d4edda;
            color: #155724;
        }

        .status-pending {
            background: #fff3cd;
            color: #856404;
        }

        .signature-section {
            margin-top: 40px;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }

        .signature-section h3 {
            font-size: 12px;
            text-transform: uppercase;
            color: #666;
            margin-bottom: 15px;
        }

        .signature-container {
            display: flex;
            justify-content: flex-end;
            align-items: flex-end;
        }

        .signature-block {
            text-align: center;
            min-width: 200px;
        }

        .signature-image {
            max-width: 200px;
            max-height: 80px;
            margin-bottom: 10px;
        }

        .signature-line {
            border-top: 1px solid #333;
            padding-top: 5px;
            font-size: 11px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="invoice">
        <div class="header">
            <div class="logo">
                Brey<span>us</span>
            </div>
            <div class="invoice-title">
                <h1>INVOICE</h1>
                <p>${invoiceId}</p>
            </div>
        </div>

        <div class="parties">
            <div class="party">
                <h3>From (Seller)</h3>
                <p class="name">${trade.seller.mail}</p>
                <p>Via Breyus Trading Platform</p>
            </div>
            <div class="party">
                <h3>Bill To (Buyer)</h3>
                <p class="name">${trade.selectedAddress.fullName}</p>
                <p>${trade.selectedAddress.streetName}</p>
                <p>${trade.selectedAddress.city}, ${trade.selectedAddress.state} ${trade.selectedAddress.pincode}</p>
                <p>${trade.selectedAddress.country}</p>
                <p>Phone: ${trade.selectedAddress.mobileNumber}</p>
                <p>Email: ${trade.buyer.mail}</p>
            </div>
        </div>

        <div class="order-info">
            <div class="order-info-item">
                <label>Order Number</label>
                <span>${orderId}</span>
            </div>
            <div class="order-info-item">
                <label>Order Date</label>
                <span>${orderDate}</span>
            </div>
            <div class="order-info-item">
                <label>Delivery Date</label>
                <span>${deliveryDate}</span>
            </div>
            <div class="order-info-item">
                <label>Status</label>
                <span class="status-badge ${trade.tradePhase === 'COMPLETED' ? 'status-completed' : 'status-pending'}">
                    ${trade.tradePhase === 'COMPLETED' ? 'Completed' : 'In Progress'}
                </span>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <div class="product-name">${trade.product.name}</div>
                        ${trade.product.hsnCode ? `<div class="product-code">HSN: ${trade.product.hsnCode}</div>` : ''}
                    </td>
                    <td>${trade.quantity} ${trade.quantityUnit}</td>
                    <td>${currency} ${finalPrice.toFixed(2)}</td>
                    <td>${currency} ${subtotal.toFixed(2)}</td>
                </tr>
            </tbody>
        </table>

        <div class="totals">
            <table class="totals-table">
                <tr>
                    <td>Subtotal</td>
                    <td>${currency} ${subtotal.toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                    <td>Total</td>
                    <td>${currency} ${subtotal.toFixed(2)}</td>
                </tr>
            </table>
        </div>

        <div class="terms">
            <h3>Trade Terms</h3>
            <div class="terms-grid">
                <div class="terms-item">
                    <label>Incoterm</label>
                    <span>${incoterm}</span>
                </div>
                <div class="terms-item">
                    <label>Payment Method</label>
                    <span>${trade.paymentMethod.method}</span>
                </div>
                <div class="terms-item">
                    <label>Payment Terms</label>
                    <span>${paymentTerms}</span>
                </div>
            </div>
        </div>

        ${signatureDataUrl ? `
        <div class="signature-section">
            <h3>Authorized Signature</h3>
            <div class="signature-container">
                <div class="signature-block">
                    <img src="${signatureDataUrl}" alt="Signature" class="signature-image" />
                    <div class="signature-line">Authorized Signatory</div>
                </div>
            </div>
        </div>
        ` : ''}

        <div class="footer">
            <p>Thank you for trading with Breyus!</p>
            <p>${signatureDataUrl ? 'This invoice has been digitally signed.' : 'This is a computer-generated invoice and does not require a signature.'}</p>
            <p>For queries, contact support@breyus.com</p>
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
            day: 'numeric'
        });
    }

    private formatPaymentTerms(paymentMethod: { type: string; percentage?: string; days?: string }): string {
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
}
