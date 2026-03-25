/**
 * Breyus Email Templates
 * ========================
 * Professional light-themed, responsive email templates
 * Redesigned January 2025
 *
 * Features:
 * - 800px max-width responsive layout
 * - Light/white theme with gold accents
 * - Comprehensive trade information display
 * - Role-aware deep linking (buyer/seller)
 * - Timeline indicators for trade phases
 * - Support footer with contact info
 */

type ThemeName = 'auth' | 'trade' | 'trade-warning' | 'trade-success';

interface ThemeConfig {
  primary: string;
  secondary: string;
  background: string;
  cardBg: string;
  border: string;
  muted: string;
  accent: string;
  headerGradient: string;
  buttonGradient: string;
}

interface TradeEmailContext {
  tradeId?: string;
  productName?: string;
  quantity?: number;
  quantityUnit?: string;
  currency?: string;
  unitPrice?: number | null;
  estimatedTotal?: number | null;
  tradePhase?: string;
  incoterm?: string;
  paymentSummary?: string;
  recipientRole?: 'buyer' | 'seller';
  counterpartyName?: string;
  counterpartyEmail?: string;
  actionUrl?: string;
  actionText?: string;
  highlight?: string;
  nextStep?: string;
  reason?: string;
  documentType?: string;
  remainingAttempts?: number;
  invalidatedDocuments?: string;
  replacedDocumentType?: string;
  totalAmount?: string;
  buyerOfferedPrice?: number;
  newPrice?: number | string;
  oldPrice?: number | string;
  negotiationCount?: number;
  deadline?: string;
}

// ========================
// THEME CONFIGURATION
// ========================

/**
 * Theme configurations - Dark mode compatible
 * Using solid white backgrounds and high-contrast colors
 * that work well when email clients invert for dark mode
 */
const THEMES: Record<ThemeName, ThemeConfig> = {
  auth: {
    primary: '#B8860B',
    secondary: '#1f2937',    // Darker gray for better contrast
    background: '#ffffff',
    cardBg: '#ffffff',       // Solid white - inverts nicely to dark
    border: '#e5e7eb',       // Neutral gray border
    muted: '#4b5563',        // Darker muted for better visibility
    accent: '#0056b3',
    headerGradient: 'linear-gradient(135deg, #B8860B 0%, #d4a915 100%)',
    buttonGradient: 'linear-gradient(135deg, #B8860B 0%, #8a6a08 100%)',
  },
  trade: {
    primary: '#B8860B',
    secondary: '#1f2937',    // Darker gray for better contrast
    background: '#ffffff',
    cardBg: '#ffffff',       // Solid white - inverts nicely to dark
    border: '#e5e7eb',       // Neutral gray border
    muted: '#4b5563',        // Darker muted for better visibility
    accent: '#B8860B',
    headerGradient: 'linear-gradient(135deg, #B8860B 0%, #d4a915 100%)',
    buttonGradient: 'linear-gradient(135deg, #B8860B 0%, #8a6a08 100%)',
  },
  'trade-warning': {
    primary: '#dc6803',
    secondary: '#1f2937',    // Darker gray for better contrast
    background: '#ffffff',
    cardBg: '#ffffff',       // Solid white - inverts nicely to dark
    border: '#e5e7eb',       // Neutral gray border
    muted: '#4b5563',        // Darker muted for better visibility
    accent: '#dc6803',
    headerGradient: 'linear-gradient(135deg, #dc6803 0%, #ea8b1f 100%)',
    buttonGradient: 'linear-gradient(135deg, #dc6803 0%, #b55502 100%)',
  },
  'trade-success': {
    primary: '#059669',
    secondary: '#1f2937',    // Darker gray for better contrast
    background: '#ffffff',
    cardBg: '#ffffff',       // Solid white - inverts nicely to dark
    border: '#e5e7eb',       // Neutral gray border
    muted: '#4b5563',        // Darker muted for better visibility
    accent: '#059669',
    headerGradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    buttonGradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
  },
};

// ========================
// UTILITY FUNCTIONS
// ========================

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatNumber = (value: number): string =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);

const formatCurrency = (
  currency: string | undefined,
  value: number | null | undefined,
): string | undefined => {
  if (
    !currency ||
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return undefined;
  }
  return `${currency} ${formatNumber(value)}`;
};

const formatDate = (date: Date | string | undefined): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const shortTradeId = (tradeId?: string): string | undefined => {
  if (!tradeId) return undefined;
  const cleaned = tradeId.trim();
  if (cleaned.length <= 10) return cleaned.toUpperCase();
  return `#${cleaned.slice(-8).toUpperCase()}`;
};

const mapPhaseLabel = (phase?: string): string | undefined => {
  if (!phase) return undefined;
  const labels: Record<string, string> = {
    PR: 'Purchase Request',
    SCO: 'Soft Corporate Offer',
    ICPO: 'Irrevocable Corporate Purchase Order',
    SPA: 'Sales Purchase Agreement',
    PAYMENT: 'Payment Verification',
    BOL: 'Bill of Lading',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };
  return labels[phase] || phase;
};

const truncateText = (text: string | undefined | null, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Sanitize URL - ensure it's a valid URL and encode special characters
 */
const sanitizeUrl = (url: string | undefined | null): string => {
  if (!url) return '#';
  // Basic URL validation - just ensure it starts with http(s):// or /
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
    return trimmed;
  }
  return '#';
};

// ========================
// URL BUILDER (Fixed Routes)
// ========================

const buildTradeUrl = (
  recipientRole: 'buyer' | 'seller' | undefined,
  path: string = '',
  query: string = '',
): string => {
  // Remove trailing slashes from base URL to prevent double slashes
  const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const rolePrefix = recipientRole === 'seller' ? '/seller' : '/buyer';
  const queryString = query ? `?${query}` : '';
  return `${baseUrl}${rolePrefix}${path}${queryString}`;
};

const buildNegotiationUrl = (
  recipientRole: 'buyer' | 'seller' | undefined,
  tradeId: string,
): string => {
  // Remove trailing slashes from base URL to prevent double slashes
  const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const rolePrefix = recipientRole === 'seller' ? '/seller' : '/buyer';
  // MongoDB ObjectIds are hex-only, but encode for safety
  const encodedTradeId = encodeURIComponent(tradeId);
  return `${baseUrl}${rolePrefix}/negotiation/${encodedTradeId}`;
};

// ========================
// EMAIL-SAFE COMPONENTS
// ========================

/**
 * Creates an email-safe button
 */
const emailButton = (
  text: string,
  url: string,
  theme: ThemeConfig,
  variant: 'primary' | 'secondary' = 'primary',
): string => {
  if (variant === 'secondary') {
    return `
      <a href="${url}" style="display: inline-block; padding: 14px 32px; background: #ffffff; color: ${theme.primary}; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 8px; border: 2px solid ${theme.primary}; text-transform: uppercase; letter-spacing: 0.5px;">
        ${escapeHtml(text)}
      </a>
    `;
  }
  return `
    <a href="${url}" style="display: inline-block; padding: 14px 32px; background: ${theme.buttonGradient}; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
      ${escapeHtml(text)}
    </a>
  `;
};

/**
 * Creates a responsive spacer
 */
const spacer = (height: number): string => `
  <tr><td style="height: ${height}px; line-height: ${height}px; font-size: 1px;">&nbsp;</td></tr>
`;

/**
 * Creates a horizontal divider
 */
const divider = (color: string = '#e9ecef'): string => `
  <tr>
    <td style="padding: 0 24px;">
      <div style="height: 1px; background: ${color};"></div>
    </td>
  </tr>
`;

// ========================
// LAYOUT COMPONENTS
// ========================

/**
 * Text-based logo (no external image dependency)
 * Dark mode compatible with high contrast colors
 */
const logoBlock = (theme: ThemeConfig): string => `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td style="padding: 32px 0; text-align: center;">
        <div style="display: inline-block; padding: 8px 24px; border-radius: 8px;">
          <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: ${theme.primary}; letter-spacing: 3px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            ✦ BREYUS ✦
          </h1>
          <p style="margin: 6px 0 0 0; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 2px;">
            Commodity Trading Platform
          </p>
        </div>
      </td>
    </tr>
  </table>
`;

/**
 * Email type badge/eyebrow - Dark mode compatible
 */
const typeBadge = (text: string, theme: ThemeConfig): string => `
  <div style="display: inline-block; padding: 6px 16px; border-radius: 20px; background: #ffffff; border: 2px solid ${theme.primary}; color: ${theme.primary}; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
    ${escapeHtml(text)}
  </div>
`;

/**
 * Support footer with contact information - Dark mode compatible
 */
const supportFooter = (): string => {
  const supportEmail = process.env.SUPPORT_EMAIL || 'support@breyus.com';
  const year = new Date().getFullYear();

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #ffffff; border-top: 2px solid #e5e7eb;">
      <tr>
        <td style="padding: 32px 40px;">
          <!-- Support Contact -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
            <tr>
              <td style="text-align: center;">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151; font-weight: 600;">
                  Need help?
                </p>
                <p style="margin: 0; font-size: 14px; color: #4b5563;">
                  Contact us at <a href="mailto:${supportEmail}" style="color: #B8860B; text-decoration: none; font-weight: 600;">${supportEmail}</a>
                </p>
              </td>
            </tr>
          </table>

          <!-- Divider -->
          <div style="height: 1px; background: #d1d5db; margin: 16px 0;"></div>

          <!-- Copyright -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="text-align: center;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
                  This is an automated message from Breyus. Please do not reply directly to this email.
                </p>
                <p style="margin: 0; font-size: 12px; color: #6b7280;">
                  © ${year} Breyus. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
};

// ========================
// CONTENT COMPONENTS
// ========================

/**
 * Trade Summary Card - Comprehensive trade information display
 * Dark mode compatible with solid backgrounds and borders
 */
const tradeSummaryCard = (
  context: TradeEmailContext | undefined,
  theme: ThemeConfig,
): string => {
  if (!context) return '';

  const currency = context.currency || 'USD';
  const unitPriceText = formatCurrency(currency, context.unitPrice ?? undefined);
  const totalText = formatCurrency(currency, context.estimatedTotal ?? undefined);
  const quantityText =
    context.quantity !== undefined && context.quantityUnit
      ? `${formatNumber(context.quantity)} ${escapeHtml(context.quantityUnit)}`
      : undefined;
  const phaseLabel = mapPhaseLabel(context.tradePhase);
  const tradeIdDisplay = shortTradeId(context.tradeId);

  // Build rows only for defined values
  const rows: Array<{ label: string; value: string }> = [];
  if (context.productName) rows.push({ label: 'Product', value: escapeHtml(context.productName) });
  if (quantityText) rows.push({ label: 'Quantity', value: quantityText });
  if (unitPriceText) rows.push({ label: 'Unit Price', value: unitPriceText });
  if (totalText) rows.push({ label: 'Total Value', value: totalText });
  if (context.totalAmount) rows.push({ label: 'Total Amount', value: escapeHtml(context.totalAmount) });
  if (context.incoterm) rows.push({ label: 'Incoterm', value: escapeHtml(context.incoterm) });
  if (context.paymentSummary) rows.push({ label: 'Payment Terms', value: escapeHtml(context.paymentSummary) });
  if (phaseLabel) rows.push({ label: 'Current Phase', value: escapeHtml(phaseLabel) });

  if (rows.length === 0) return '';

  const rowsHtml = rows
    .map(
      (row, index) => `
        <tr>
          <td style="padding: 12px 16px; border-bottom: ${index < rows.length - 1 ? '1px solid #e5e7eb' : 'none'}; color: #6b7280; font-size: 13px; width: 40%;">
            ${row.label}
          </td>
          <td style="padding: 12px 16px; border-bottom: ${index < rows.length - 1 ? '1px solid #e5e7eb' : 'none'}; color: #1f2937; font-size: 14px; font-weight: 600;">
            ${row.value}
          </td>
        </tr>
      `,
    )
    .join('');

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin: 20px 0;">
      <!-- Header -->
      <tr>
        <td colspan="2" style="padding: 16px; background: #ffffff; border-bottom: 2px solid #e5e7eb;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="font-size: 14px; font-weight: 700; color: #1f2937; text-transform: uppercase; letter-spacing: 0.5px;">
                📦 Trade Summary
              </td>
              ${tradeIdDisplay ? `<td style="text-align: right; font-size: 13px; color: #6b7280; font-family: monospace;">${tradeIdDisplay}</td>` : ''}
            </tr>
          </table>
        </td>
      </tr>
      ${rowsHtml}
    </table>
  `;
};

/**
 * Counterparty Card - Display trading partner information
 * Dark mode compatible
 */
const counterpartyCard = (context: TradeEmailContext | undefined, theme: ThemeConfig): string => {
  if (!context?.counterpartyName) return '';

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin: 20px 0;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 12px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">
            👤 Your Trading Partner
          </p>
          <p style="margin: 0 0 4px 0; font-size: 16px; color: #1f2937; font-weight: 700;">
            ${escapeHtml(context.counterpartyName)}
          </p>
          ${context.counterpartyEmail ? `
            <p style="margin: 0; font-size: 14px; color: #4b5563;">
              <a href="mailto:${escapeHtml(context.counterpartyEmail)}" style="color: ${theme.primary}; text-decoration: none; font-weight: 600;">
                ${escapeHtml(context.counterpartyEmail)}
              </a>
            </p>
          ` : ''}
        </td>
      </tr>
    </table>
  `;
};

/**
 * Timeline Indicator - Visual trade phase progress
 * Dark mode compatible with high contrast colors
 */
const timelineIndicator = (currentPhase: string | undefined, theme: ThemeConfig): string => {
  if (!currentPhase) return '';

  const phases = ['PR', 'SCO', 'ICPO', 'SPA', 'PAY', 'BOL'];
  const phaseLabels: Record<string, string> = {
    PR: 'PR',
    SCO: 'SCO',
    ICPO: 'ICPO',
    SPA: 'SPA',
    PAY: 'PAY',
    BOL: 'BOL',
  };

  // Handle COMPLETED and CANCELLED phases - show all phases as completed
  const isTerminalPhase = currentPhase === 'COMPLETED' || currentPhase === 'CANCELLED';
  // Map PAYMENT to PAY for index lookup
  const normalizedPhase = currentPhase === 'PAYMENT' ? 'PAY' : currentPhase;
  const currentIndex = isTerminalPhase ? phases.length : phases.indexOf(normalizedPhase);

  // If phase not found and not terminal, return empty
  if (currentIndex === -1) return '';

  // Dark mode compatible colors - using solid colors that work on any background
  const completedBg = theme.primary; // Gold/brand color
  const completedText = '#ffffff';
  const currentBg = theme.primary;
  const currentText = '#ffffff';
  const pendingBg = '#6b7280'; // Medium gray - visible on both light and dark
  const pendingText = '#ffffff';
  const labelCompleted = '#1f2937'; // Dark gray for labels - high contrast
  const labelCurrent = theme.primary;
  const labelPending = '#9ca3af'; // Lighter gray for pending labels

  const stepsHtml = phases
    .map((phase, index) => {
      const isCompleted = index < currentIndex;
      const isCurrent = index === currentIndex;
      const isPending = index > currentIndex;

      let circleBg = pendingBg;
      let circleText = pendingText;
      let labelColor = labelPending;
      let ringStyle = '';

      if (isCompleted) {
        circleBg = completedBg;
        circleText = completedText;
        labelColor = labelCompleted;
      } else if (isCurrent) {
        circleBg = currentBg;
        circleText = currentText;
        labelColor = labelCurrent;
        ringStyle = `box-shadow: 0 0 0 3px rgba(184, 134, 11, 0.3);`;
      }

      // Each phase step (circle + label) - fixed width column
      return `
        <td width="16.66%" style="text-align: center; vertical-align: top; padding: 0 2px;">
          <div style="display: inline-block; width: 32px; height: 32px; border-radius: 50%; background: ${circleBg}; color: ${circleText}; font-size: 12px; font-weight: 700; line-height: 32px; text-align: center; ${ringStyle}">
            ${isCompleted ? '✓' : (index + 1)}
          </div>
          <p style="margin: 8px 0 0 0; font-size: 11px; color: ${labelColor}; font-weight: ${isCurrent ? '700' : '600'}; letter-spacing: 0.5px;">
            ${phaseLabels[phase]}
          </p>
        </td>
      `;
    })
    .join('');

  // Build progress bar - shows completed portion in primary color
  const progressPercent = Math.min(100, (currentIndex / (phases.length - 1)) * 100);

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin: 20px 0;">
      <tr>
        <td style="padding: 24px 16px;">
          <p style="margin: 0 0 20px 0; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; text-align: center;">
            📍 Trade Progress
          </p>

          <!-- Progress Bar -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 16px;">
            <tr>
              <td style="padding: 0 24px;">
                <div style="height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden;">
                  <div style="width: ${progressPercent}%; height: 100%; background: ${theme.primary}; border-radius: 3px;"></div>
                </div>
              </td>
            </tr>
          </table>

          <!-- Phase Steps -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              ${stepsHtml}
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
};

/**
 * Action Card - Prominent call-to-action section
 * Dark mode compatible
 */
const actionCard = (
  title: string,
  description: string,
  buttonText: string,
  buttonUrl: string,
  theme: ThemeConfig,
): string => `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #ffffff; border: 2px solid ${theme.primary}; border-radius: 12px; overflow: hidden; margin: 24px 0;">
    <tr>
      <td style="padding: 28px 24px; text-align: center;">
        <p style="margin: 0 0 12px 0; font-size: 14px; color: ${theme.primary}; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">
          ${escapeHtml(title)}
        </p>
        <p style="margin: 0 0 20px 0; font-size: 15px; color: #374151; line-height: 1.6;">
          ${escapeHtml(description)}
        </p>
        ${emailButton(buttonText, buttonUrl, theme)}
      </td>
    </tr>
  </table>
`;

/**
 * Highlight Block - For important information callouts
 * Dark mode compatible with border emphasis
 */
const highlightBlock = (text: string | undefined, theme: ThemeConfig): string => {
  if (!text) return '';
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0;">
      <tr>
        <td style="padding: 16px 20px; background: #ffffff; border: 1px solid #e5e7eb; border-left: 4px solid ${theme.primary}; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; font-size: 15px; color: #1f2937; font-weight: 600;">
            ${escapeHtml(text)}
          </p>
        </td>
      </tr>
    </table>
  `;
};

/**
 * Next Step Block - Shows what action to take next
 * Dark mode compatible with border emphasis
 */
const nextStepBlock = (nextStep: string | undefined, theme: ThemeConfig): string => {
  if (!nextStep) return '';
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0;">
      <tr>
        <td style="padding: 16px 20px; background: #ffffff; border: 2px solid #10b981; border-radius: 8px;">
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #059669; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700;">
            ▶ Next Step
          </p>
          <p style="margin: 0; font-size: 14px; color: #1f2937; line-height: 1.6;">
            ${escapeHtml(nextStep)}
          </p>
        </td>
      </tr>
    </table>
  `;
};

/**
 * Reason Block - For rejection reasons or explanations
 * Dark mode compatible with border emphasis
 */
const reasonBlock = (reason: string | undefined, theme: ThemeConfig): string => {
  if (!reason) return '';
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0;">
      <tr>
        <td style="padding: 16px 20px; background: #ffffff; border: 1px solid #fca5a5; border-left: 4px solid #ef4444; border-radius: 0 8px 8px 0;">
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #dc2626; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700;">
            Reason
          </p>
          <p style="margin: 0; font-size: 14px; color: #991b1b; line-height: 1.6;">
            ${escapeHtml(reason)}
          </p>
        </td>
      </tr>
    </table>
  `;
};

/**
 * Warning Block - For urgent warnings
 * Dark mode compatible with border emphasis
 */
const warningBlock = (text: string, theme: ThemeConfig): string => `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0;">
    <tr>
      <td style="padding: 16px 20px; background: #ffffff; border: 2px solid #f59e0b; border-radius: 8px;">
        <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.6;">
          <strong style="color: #d97706;">⚠️ Warning:</strong> ${escapeHtml(text)}
        </p>
      </td>
    </tr>
  </table>
`;

/**
 * Security Tip Block - For auth-related emails
 * Dark mode compatible with border emphasis
 */
const securityTipBlock = (text: string): string => `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0;">
    <tr>
      <td style="padding: 16px 20px; background: #ffffff; border: 2px solid #3b82f6; border-radius: 8px;">
        <p style="margin: 0; font-size: 13px; color: #1e40af; line-height: 1.6;">
          <strong style="color: #1d4ed8;">🔒 Security Note:</strong> ${escapeHtml(text)}
        </p>
      </td>
    </tr>
  </table>
`;

/**
 * Price Comparison Block - For counter offers
 * Dark mode compatible
 */
const priceComparisonBlock = (
  oldPrice: string | undefined,
  newPrice: string | undefined,
  theme: ThemeConfig,
): string => {
  if (!oldPrice && !newPrice) return '';

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0;">
      <tr>
        <td style="padding: 20px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              ${oldPrice ? `
                <td style="width: 48%; text-align: center; padding: 12px;">
                  <p style="margin: 0 0 6px 0; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Previous Price</p>
                  <p style="margin: 0; font-size: 20px; color: #9ca3af; font-weight: 700; text-decoration: line-through;">${escapeHtml(oldPrice)}</p>
                </td>
              ` : ''}
              ${oldPrice && newPrice ? `<td style="width: 4%; text-align: center; color: #6b7280; font-size: 20px;">→</td>` : ''}
              ${newPrice ? `
                <td style="width: 48%; text-align: center; padding: 12px;">
                  <p style="margin: 0 0 6px 0; font-size: 11px; color: ${theme.primary}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">New Offer</p>
                  <p style="margin: 0; font-size: 24px; color: ${theme.primary}; font-weight: 800;">${escapeHtml(newPrice)}</p>
                </td>
              ` : ''}
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
};

// ========================
// BASE LAYOUT
// ========================

const baseLayout = (params: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  bodyHtml: string;
  actionText?: string;
  actionUrl?: string;
  theme?: ThemeName;
  footerNote?: string;
}): string => {
  const theme = THEMES[params.theme || 'trade'];

  const actionBlock =
    params.actionText && params.actionUrl
      ? `
        <tr>
          <td style="padding: 8px 40px 32px 40px; text-align: center;">
            ${emailButton(params.actionText, params.actionUrl, theme)}
          </td>
        </tr>
      `
      : '';

  const eyebrowBlock = params.eyebrow
    ? `<div style="margin: 0 0 16px 0;">${typeBadge(params.eyebrow, theme)}</div>`
    : '';

  const footerNoteHtml = params.footerNote
    ? `<p style="margin: 16px 0 0 0; font-size: 13px; color: #6c757d; text-align: center; font-style: italic;">${escapeHtml(params.footerNote)}</p>`
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(params.title)} - Breyus</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    @media screen and (max-width: 600px) {
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .mobile-full-width { width: 100% !important; max-width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; -webkit-font-smoothing: antialiased;">
  <!-- Outer wrapper with background -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <!-- Inner container - 800px max width -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="800" class="mobile-full-width" style="max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

          <!-- Gold accent bar -->
          <tr>
            <td style="height: 4px; background: ${theme.headerGradient};"></td>
          </tr>

          <!-- Logo -->
          <tr>
            <td>
              ${logoBlock(theme)}
            </td>
          </tr>

          <!-- Title Section -->
          <tr>
            <td style="padding: 0 40px 8px 40px;" class="mobile-padding">
              ${eyebrowBlock}
              <h2 style="margin: 0; font-size: 26px; font-weight: 700; color: #1f2937; line-height: 1.3;">
                ${escapeHtml(params.title)}
              </h2>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 16px 40px 8px 40px;" class="mobile-padding">
              ${params.bodyHtml}
            </td>
          </tr>

          <!-- Action Button -->
          ${actionBlock}

          <!-- Footer Note (if any) -->
          ${footerNoteHtml ? `
          <tr>
            <td style="padding: 0 40px 24px 40px;" class="mobile-padding">
              ${footerNoteHtml}
            </td>
          </tr>
          ` : ''}

          <!-- Support Footer -->
          <tr>
            <td>
              ${supportFooter()}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

// ========================
// TRADE NOTIFICATION BASE
// ========================

const tradeNotificationBase = (
  title: string,
  message: string,
  actionText?: string,
  actionUrl?: string,
  highlight?: string,
  options?: {
    theme?: ThemeName;
    context?: TradeEmailContext;
    eyebrow?: string;
    footerNote?: string;
    showTimeline?: boolean;
    showCounterparty?: boolean;
  },
): string => {
  const themeName = options?.theme || 'trade';
  const theme = THEMES[themeName];
  const context = options?.context;

  const finalActionText = context?.actionText || actionText;
  const finalActionUrl = context?.actionUrl || actionUrl;
  const finalHighlight = context?.highlight || highlight;

  const invalidatedDocsBlock = context?.invalidatedDocuments
    ? `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0;">
        <tr>
          <td style="padding: 16px 20px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px;">
            <p style="margin: 0 0 8px 0; font-size: 11px; color: #92400e; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700;">
              📋 Documents Requiring Attention
            </p>
            <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.6;">
              ${escapeHtml(context.invalidatedDocuments)}
            </p>
          </td>
        </tr>
      </table>
    `
    : '';

  const bodyHtml = `
    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.7; color: #374151;">
      ${message}
    </p>

    ${highlightBlock(finalHighlight, theme)}
    ${reasonBlock(context?.reason, theme)}
    ${options?.showTimeline !== false ? timelineIndicator(context?.tradePhase, theme) : ''}
    ${tradeSummaryCard(context, theme)}
    ${options?.showCounterparty !== false ? counterpartyCard(context, theme) : ''}
    ${invalidatedDocsBlock}
    ${nextStepBlock(context?.nextStep, theme)}
  `;

  return baseLayout({
    title,
    eyebrow: options?.eyebrow,
    bodyHtml,
    actionText: finalActionText,
    actionUrl: finalActionUrl,
    theme: themeName,
    footerNote: options?.footerNote,
  });
};

// ========================
// EMAIL TEMPLATES EXPORT
// ========================

export const emailTemplates = {
  // ========================
  // AUTHENTICATION EMAILS
  // ========================

  /**
   * OTP Verification Email
   * Sent when user logs in and needs to verify with OTP
   */
  otpVerification: (otp: string): string => {
    const safeOtp = escapeHtml(otp);
    const theme = THEMES.auth;

    const bodyHtml = `
      <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.7; color: #374151;">
        Use the verification code below to confirm your email and complete sign-in.
        This code expires in <strong style="color: ${theme.secondary};">10 minutes</strong>.
      </p>

      <!-- OTP Display Box -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
        <tr>
          <td style="padding: 32px; background: linear-gradient(135deg, #fffef7 0%, #fef3c7 100%); border: 2px solid ${theme.primary}; border-radius: 16px; text-align: center;">
            <p style="margin: 0 0 12px 0; font-size: 12px; color: ${theme.muted}; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
              Your Verification Code
            </p>
            <div style="font-size: 42px; font-weight: 800; letter-spacing: 12px; color: ${theme.primary}; font-family: 'Courier New', monospace;">
              ${safeOtp}
            </div>
            <p style="margin: 12px 0 0 0; font-size: 13px; color: ${theme.muted};">
              Valid for 10 minutes
            </p>
          </td>
        </tr>
      </table>

      ${nextStepBlock('Enter this code in the app to finish verification.', theme)}
      ${securityTipBlock('Breyus will never ask you to share this code. Do not share it with anyone.')}
    `;

    return baseLayout({
      title: 'Verify Your Email',
      eyebrow: 'Email Verification',
      bodyHtml,
      theme: 'auth',
      footerNote: 'If you did not request this, you can safely ignore this email.',
    });
  },

  /**
   * Password Reset Email
   * Sent when user requests a password reset
   */
  passwordReset: (otp: string): string => {
    const safeOtp = escapeHtml(otp);
    const theme = THEMES.auth;

    const bodyHtml = `
      <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.7; color: #374151;">
        We received a request to reset your Breyus account password. Use the code below to continue.
        This code expires in <strong style="color: ${theme.secondary};">10 minutes</strong>.
      </p>

      <!-- OTP Display Box -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
        <tr>
          <td style="padding: 32px; background: linear-gradient(135deg, #fffef7 0%, #fef3c7 100%); border: 2px solid ${theme.primary}; border-radius: 16px; text-align: center;">
            <p style="margin: 0 0 12px 0; font-size: 12px; color: ${theme.muted}; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
              Password Reset Code
            </p>
            <div style="font-size: 42px; font-weight: 800; letter-spacing: 12px; color: ${theme.primary}; font-family: 'Courier New', monospace;">
              ${safeOtp}
            </div>
            <p style="margin: 12px 0 0 0; font-size: 13px; color: ${theme.muted};">
              Valid for 10 minutes
            </p>
          </td>
        </tr>
      </table>

      <!-- Password Tips -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
        <tr>
          <td style="padding: 20px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 12px;">
            <p style="margin: 0 0 12px 0; font-size: 13px; color: ${theme.secondary}; font-weight: 700;">
              📝 When setting your new password:
            </p>
            <ul style="margin: 0; padding: 0 0 0 20px; font-size: 13px; color: ${theme.muted}; line-height: 1.8;">
              <li>Use at least 8 characters</li>
              <li>Include uppercase and lowercase letters</li>
              <li>Add numbers and special characters</li>
              <li>Avoid using personal information</li>
            </ul>
          </td>
        </tr>
      </table>

      ${securityTipBlock('If you did not request this password reset, please secure your account immediately and contact support.')}
    `;

    return baseLayout({
      title: 'Password Reset Request',
      eyebrow: 'Account Security',
      bodyHtml,
      theme: 'auth',
      footerNote: 'If you did not request a reset, please ignore this email or contact support if you have concerns.',
    });
  },

  // ========================
  // TRADE NOTIFICATION EMAILS
  // ========================

  /**
   * Trade Notification Base Template (for internal use)
   */
  tradeNotificationBase,

  /**
   * New Trade Request (Purchase Request Created)
   * Sent to seller when a buyer submits a new purchase request
   */
  tradeCreated: (
    productName: string,
    buyerName: string,
    quantity: string,
    offeredPrice?: string,
    context?: TradeEmailContext,
  ): string => {
    const safeProduct = escapeHtml(productName);
    const safeBuyer = escapeHtml(buyerName);
    const theme = THEMES.trade;

    // Build the action URL correctly for seller
    const actionUrl = context?.actionUrl || buildTradeUrl('seller', '/trade', 'tab=pr');

    return tradeNotificationBase(
      'New Purchase Request Received',
      `You have received a new purchase request for <strong style="color: ${theme.primary};">${safeProduct}</strong> from <strong style="color: ${theme.secondary};">${safeBuyer}</strong>. Review the request details and respond to start the negotiation process.`,
      'Review Request',
      actionUrl,
      offeredPrice ? `Offered Price: ${escapeHtml(offeredPrice)}` : `Requested Quantity: ${escapeHtml(quantity)}`,
      {
        theme: 'trade',
        eyebrow: 'Purchase Request',
        context: { ...context, recipientRole: 'seller' },
      },
    );
  },

  /**
   * Counter Offer Received
   * Sent when the other party submits a counter offer
   */
  counterOfferReceived: (
    productName: string,
    counterpartyName: string,
    newPrice: string,
    context?: TradeEmailContext,
  ): string => {
    const safeProduct = escapeHtml(productName);
    const safeCounterparty = escapeHtml(counterpartyName);
    const theme = THEMES.trade;

    // Format prices for comparison
    const formattedNewPrice =
      context?.currency && typeof context.newPrice === 'number'
        ? formatCurrency(context.currency, context.newPrice) || newPrice
        : newPrice;

    const formattedOldPrice =
      context?.currency && typeof context.oldPrice === 'number'
        ? formatCurrency(context.currency, context.oldPrice as number)
        : context?.oldPrice?.toString();

    // Build the action URL based on recipient role, linking to negotiation page
    const actionUrl =
      context?.actionUrl ||
      (context?.tradeId
        ? buildNegotiationUrl(context.recipientRole, context.tradeId)
        : buildTradeUrl(context?.recipientRole, '/trade'));

    const negotiationCountText =
      context?.negotiationCount !== undefined
        ? `<br><span style="font-size: 13px; color: ${theme.muted};">Negotiation round: ${context.negotiationCount}</span>`
        : '';

    const bodyMessage = `
      You have received a counter offer for <strong style="color: ${theme.primary};">${safeProduct}</strong> from <strong style="color: ${theme.secondary};">${safeCounterparty}</strong>.${negotiationCountText}
      <br><br>
      Review the new terms and respond to continue the negotiation. You can accept, reject, or submit your own counter offer.
    `;

    // Custom body with price comparison
    const bodyHtml = `
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.7; color: #374151;">
        ${bodyMessage}
      </p>

      ${priceComparisonBlock(formattedOldPrice, formattedNewPrice, theme)}
      ${context?.deadline ? warningBlock(`Please respond within ${context.deadline} to keep this negotiation active.`, theme) : ''}
      ${timelineIndicator(context?.tradePhase, theme)}
      ${tradeSummaryCard(context, theme)}
      ${counterpartyCard(context, theme)}
      ${nextStepBlock(context?.nextStep || 'Review the counter offer and decide whether to accept, reject, or submit your own counter.', theme)}
    `;

    return baseLayout({
      title: 'New Counter Offer Received',
      eyebrow: 'Negotiation Update',
      bodyHtml,
      actionText: 'View Counter Offer',
      actionUrl,
      theme: 'trade',
    });
  },

  /**
   * Trade Accepted
   * Sent when the other party accepts the trade
   */
  tradeAccepted: (
    productName: string,
    counterpartyName: string,
    context?: TradeEmailContext,
  ): string => {
    const safeProduct = escapeHtml(productName);
    const safeCounterparty = escapeHtml(counterpartyName);
    const theme = THEMES['trade-success'];

    // Build URL linking to ongoing trades
    const actionUrl =
      context?.actionUrl ||
      buildTradeUrl(
        context?.recipientRole,
        '/trade',
        context?.tradeId ? `tab=ongoing&tradeId=${context.tradeId}` : 'tab=ongoing',
      );

    const roleSpecificNextStep =
      context?.recipientRole === 'seller'
        ? 'As the seller, please upload your Soft Corporate Offer (SCO) document to proceed to the next phase.'
        : 'The seller will now upload the Soft Corporate Offer (SCO). You will be notified when it is ready for review.';

    return tradeNotificationBase(
      '🎉 Trade Accepted!',
      `Great news! Your trade for <strong style="color: ${theme.primary};">${safeProduct}</strong> has been accepted by <strong style="color: ${theme.secondary};">${safeCounterparty}</strong>. You can now proceed with the document upload phase.`,
      'View Trade Details',
      actionUrl,
      '✓ Status: Accepted',
      {
        theme: 'trade-success',
        eyebrow: 'Trade Accepted',
        context: {
          ...context,
          nextStep: context?.nextStep || roleSpecificNextStep,
        },
      },
    );
  },

  /**
   * Trade Rejected
   * Sent when the other party rejects the trade
   */
  tradeRejected: (
    productName: string,
    counterpartyName: string,
    reason?: string,
    context?: TradeEmailContext,
  ): string => {
    const safeProduct = escapeHtml(productName);
    const safeCounterparty = escapeHtml(counterpartyName);

    // Build URL linking to trade history
    const actionUrl =
      context?.actionUrl || buildTradeUrl(context?.recipientRole, '/trade', 'tab=history');

    return tradeNotificationBase(
      'Trade Rejected',
      `Unfortunately, your trade for <strong style="color: #1a1a1a;">${safeProduct}</strong> was rejected by <strong style="color: #1a1a1a;">${safeCounterparty}</strong>.`,
      'View Trade History',
      actionUrl,
      'Status: Rejected',
      {
        theme: 'trade-warning',
        eyebrow: 'Trade Update',
        context: {
          ...context,
          reason: reason || context?.reason,
          nextStep:
            context?.nextStep ||
            'You can view this trade in your history. If you believe this was in error, you may contact the other party or raise a dispute.',
        },
      },
    );
  },

  /**
   * Document Uploaded
   * Sent when a party uploads a trade document
   */
  documentUploaded: (
    productName: string,
    documentType: string,
    uploaderName: string,
    context?: TradeEmailContext,
  ): string => {
    const docTypeName = documentType.toUpperCase();
    const safeProduct = escapeHtml(productName);
    const safeUploader = escapeHtml(uploaderName);
    const theme = THEMES.trade;

    // Build URL linking to ongoing trade
    const actionUrl =
      context?.actionUrl ||
      buildTradeUrl(
        context?.recipientRole,
        '/trade',
        context?.tradeId ? `tab=ongoing&tradeId=${context.tradeId}` : 'tab=ongoing',
      );

    return tradeNotificationBase(
      'New Document Uploaded',
      `A new <strong style="color: ${theme.primary};">${escapeHtml(docTypeName)}</strong> document has been uploaded for your trade of <strong style="color: ${theme.secondary};">${safeProduct}</strong> by <strong style="color: ${theme.secondary};">${safeUploader}</strong>.`,
      'Review Document',
      actionUrl,
      `Document Type: ${docTypeName}`,
      {
        theme: 'trade',
        eyebrow: 'Document Update',
        context: {
          ...context,
          documentType: docTypeName,
          nextStep:
            context?.nextStep ||
            'Please review and verify the uploaded document. If everything looks correct, approve it to advance the trade.',
        },
      },
    );
  },

  /**
   * Phase Advanced
   * Sent when the trade advances to a new phase
   */
  phaseAdvanced: (
    productName: string,
    newPhase: string,
    context?: TradeEmailContext,
  ): string => {
    const phaseDescriptions: Record<string, { name: string; description: string }> = {
      SCO: {
        name: 'Soft Corporate Offer',
        description: 'The seller needs to upload the Soft Corporate Offer document.',
      },
      ICPO: {
        name: 'Irrevocable Corporate Purchase Order',
        description: 'The buyer needs to upload the ICPO document.',
      },
      SPA: {
        name: 'Sales Purchase Agreement',
        description: 'Both parties need to sign the Sales Purchase Agreement.',
      },
      PAYMENT: {
        name: 'Payment Verification',
        description: 'The buyer needs to complete payment and upload proof.',
      },
      BOL: {
        name: 'Bill of Lading',
        description: 'The seller needs to upload the Bill of Lading after shipment.',
      },
      COMPLETED: {
        name: 'Trade Completed',
        description: 'Congratulations! The trade has been successfully completed.',
      },
    };

    const phaseInfo = phaseDescriptions[newPhase] || { name: newPhase, description: '' };
    const safeProduct = escapeHtml(productName);
    const theme = THEMES.trade;

    // Build URL based on phase
    const tabParam = newPhase === 'SPA' ? 'tab=spa' : 'tab=ongoing';
    const tradeIdParam = context?.tradeId ? `&tradeId=${context.tradeId}` : '';
    const actionUrl =
      context?.actionUrl || buildTradeUrl(context?.recipientRole, '/trade', `${tabParam}${tradeIdParam}`);

    return tradeNotificationBase(
      'Trade Phase Updated',
      `Your trade for <strong style="color: ${theme.secondary};">${safeProduct}</strong> has advanced to the <strong style="color: ${theme.primary};">${escapeHtml(phaseInfo.name)}</strong> phase.`,
      'View Trade Progress',
      actionUrl,
      `Current Phase: ${newPhase}`,
      {
        theme: 'trade',
        eyebrow: 'Phase Update',
        context: {
          ...context,
          tradePhase: newPhase,
          nextStep: context?.nextStep || phaseInfo.description,
        },
      },
    );
  },

  /**
   * Trade Completed
   * Sent when the trade is successfully completed
   */
  tradeCompleted: (
    productName: string,
    totalAmount: string,
    context?: TradeEmailContext,
  ): string => {
    const safeProduct = escapeHtml(productName);
    const theme = THEMES['trade-success'];

    // Build URL linking to trade history
    const actionUrl =
      context?.actionUrl || buildTradeUrl(context?.recipientRole, '/trade', 'tab=history');

    const bodyHtml = `
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.7; color: #374151;">
        🎉 <strong>Congratulations!</strong> Your trade for <strong style="color: ${theme.primary};">${safeProduct}</strong> has been successfully completed.
        Thank you for using Breyus for your commodity trading needs.
      </p>

      <!-- Success Banner -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
        <tr>
          <td style="padding: 24px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid ${theme.primary}; border-radius: 16px; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: ${theme.muted}; text-transform: uppercase; letter-spacing: 1px;">
              Trade Completed Successfully
            </p>
            <p style="margin: 0; font-size: 28px; font-weight: 800; color: ${theme.primary};">
              ${escapeHtml(totalAmount)}
            </p>
          </td>
        </tr>
      </table>

      ${timelineIndicator('COMPLETED', theme)}
      ${tradeSummaryCard(context, theme)}
      ${counterpartyCard(context, theme)}

      <!-- Feedback Request -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
        <tr>
          <td style="padding: 20px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 12px; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: ${theme.secondary}; font-weight: 600;">
              How was your experience?
            </p>
            <p style="margin: 0; font-size: 13px; color: ${theme.muted};">
              Your feedback helps us improve Breyus for everyone.
            </p>
          </td>
        </tr>
      </table>
    `;

    return baseLayout({
      title: '🎉 Trade Completed Successfully!',
      eyebrow: 'Trade Complete',
      bodyHtml,
      actionText: 'View Trade Summary',
      actionUrl,
      theme: 'trade-success',
    });
  },

  /**
   * Documents Invalidated
   * Sent when a document is replaced and subsequent documents need re-submission
   */
  documentsInvalidated: (
    productName: string,
    replacedDocument: string,
    invalidatedDocuments: string[],
    context?: TradeEmailContext,
  ): string => {
    const docList = invalidatedDocuments.join(', ');
    const safeProduct = escapeHtml(productName);
    const safeReplaced = escapeHtml(replacedDocument);
    const theme = THEMES['trade-warning'];

    // Build URL
    const actionUrl =
      context?.actionUrl ||
      buildTradeUrl(
        context?.recipientRole,
        '/trade',
        context?.tradeId ? `tab=ongoing&tradeId=${context.tradeId}` : 'tab=ongoing',
      );

    return tradeNotificationBase(
      'Action Required: Documents Need Re-submission',
      `The <strong style="color: ${theme.primary};">${safeReplaced}</strong> document for your trade of <strong style="color: #1a1a1a;">${safeProduct}</strong> has been updated. As a result, the following documents have been invalidated and require re-submission.`,
      'View Trade',
      actionUrl,
      `Replaced: ${safeReplaced}`,
      {
        theme: 'trade-warning',
        eyebrow: 'Action Required',
        context: {
          ...context,
          invalidatedDocuments: docList,
          nextStep: `Please re-upload the following documents: ${docList}. These documents were invalidated because they reference the previous version of ${safeReplaced}.`,
        },
      },
    );
  },

  // ========================
  // DOCUMENT REJECTION EMAILS
  // ========================

  /**
   * Document Rejected
   * Sent when a document is rejected with remaining attempts info
   */
  documentRejected: (
    productName: string,
    documentType: string,
    reason: string,
    remainingAttempts: number,
    context?: TradeEmailContext,
  ): string => {
    const docTypeName = documentType.toUpperCase();
    const safeProduct = escapeHtml(productName);
    const theme = THEMES['trade-warning'];

    // Build URL
    const actionUrl =
      context?.actionUrl ||
      buildTradeUrl(
        context?.recipientRole,
        '/trade',
        context?.tradeId ? `tab=ongoing&tradeId=${context.tradeId}` : 'tab=ongoing',
      );

    const urgencyText =
      remainingAttempts === 1
        ? `<br><br><strong style="color: #dc2626;">⚠️ IMPORTANT: This is your FINAL attempt!</strong> If this document is rejected again, the trade will be automatically cancelled.`
        : '';

    return tradeNotificationBase(
      'Document Rejected',
      `Your <strong style="color: ${theme.primary};">${escapeHtml(docTypeName)}</strong> document for the trade of <strong style="color: #1a1a1a;">${safeProduct}</strong> has been rejected.${urgencyText}`,
      'Re-upload Document',
      actionUrl,
      `Remaining Attempts: ${remainingAttempts}`,
      {
        theme: 'trade-warning',
        eyebrow: 'Action Required',
        context: {
          ...context,
          documentType: docTypeName,
          reason,
          remainingAttempts,
          nextStep: `Review the rejection reason and upload a corrected ${docTypeName} document. You have ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining. Consider using the chat feature to clarify any requirements with the other party.`,
        },
      },
    );
  },

  /**
   * Last Attempt Warning
   * Sent when only one upload attempt remains
   */
  lastAttemptWarning: (
    productName: string,
    documentType: string,
    context?: TradeEmailContext,
  ): string => {
    const docTypeName = documentType.toUpperCase();
    const safeProduct = escapeHtml(productName);
    const theme = THEMES['trade-warning'];

    // Build URL
    const actionUrl =
      context?.actionUrl ||
      buildTradeUrl(
        context?.recipientRole,
        '/trade',
        context?.tradeId ? `tab=ongoing&tradeId=${context.tradeId}` : 'tab=ongoing',
      );

    const bodyHtml = `
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.7; color: #374151;">
        <strong style="color: #dc2626;">⚠️ IMPORTANT:</strong> Your next upload for the
        <strong style="color: ${theme.primary};">${escapeHtml(docTypeName)}</strong> document for
        <strong style="color: #1a1a1a;">${safeProduct}</strong> will be your <strong style="color: #dc2626;">FINAL attempt</strong>.
      </p>

      ${warningBlock('If this document is rejected again, the trade will be automatically cancelled and any reserved stock will be restored.', theme)}

      ${tradeSummaryCard(context, theme)}

      <!-- Checklist -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
        <tr>
          <td style="padding: 20px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 12px;">
            <p style="margin: 0 0 12px 0; font-size: 14px; color: ${theme.secondary}; font-weight: 700;">
              📋 Before uploading, please ensure:
            </p>
            <ul style="margin: 0; padding: 0 0 0 20px; font-size: 14px; color: ${theme.muted}; line-height: 1.8;">
              <li>The document meets all specified requirements</li>
              <li>All information is accurate and matches previous documents</li>
              <li>The file is clear and legible</li>
              <li>All required signatures are present</li>
            </ul>
          </td>
        </tr>
      </table>

      ${nextStepBlock('Use the chat feature to confirm requirements with the other party before uploading.', theme)}
    `;

    return baseLayout({
      title: '⚠️ Final Upload Attempt Warning',
      eyebrow: 'Urgent Action Required',
      bodyHtml,
      actionText: 'View Requirements',
      actionUrl,
      theme: 'trade-warning',
    });
  },

  /**
   * Trade Auto-Cancelled
   * Sent when a trade is automatically cancelled due to document rejection limits
   */
  tradeAutoCancelled: (
    productName: string,
    reason: string,
    context?: TradeEmailContext,
  ): string => {
    const safeProduct = escapeHtml(productName);
    const theme = THEMES['trade-warning'];

    // Build URL to trade history
    const actionUrl =
      context?.actionUrl || buildTradeUrl(context?.recipientRole, '/trade', 'tab=history');

    return tradeNotificationBase(
      'Trade Automatically Cancelled',
      `The trade for <strong style="color: #1a1a1a;">${safeProduct}</strong> has been <strong style="color: #dc2626;">automatically cancelled</strong>.`,
      'View Trade History',
      actionUrl,
      'Status: CANCELLED',
      {
        theme: 'trade-warning',
        eyebrow: 'Trade Cancelled',
        context: {
          ...context,
          reason,
          nextStep:
            'Any reserved stock has been restored. You may raise a dispute within 30 days if you believe this cancellation was in error.',
        },
      },
    );
  },

  /**
   * Signed SPA Required
   * Sent to buyer after seller's SPA is approved
   */
  signedSpaRequired: (
    productName: string,
    sellerName: string,
    context?: TradeEmailContext,
  ): string => {
    const safeProduct = escapeHtml(productName);
    const safeSeller = escapeHtml(sellerName);
    const theme = THEMES.trade;

    // Build URL to SPA tab
    const actionUrl =
      context?.actionUrl ||
      buildTradeUrl(
        'buyer',
        '/trade',
        context?.tradeId ? `tab=spa&tradeId=${context.tradeId}` : 'tab=spa',
      );

    return tradeNotificationBase(
      'Action Required: Upload Signed SPA',
      `The Sales Purchase Agreement (SPA) from <strong style="color: ${theme.secondary};">${safeSeller}</strong> for your trade of <strong style="color: ${theme.primary};">${safeProduct}</strong> has been <strong style="color: #059669;">approved</strong>.`,
      'Upload Signed SPA',
      actionUrl,
      'Next Step: Upload Signed SPA',
      {
        theme: 'trade',
        eyebrow: 'Action Required',
        context: {
          ...context,
          recipientRole: 'buyer',
          nextStep:
            'Please download the SPA, sign all required sections, and upload your signed copy to proceed to the payment phase.',
        },
      },
    );
  },

  // ========================
  // NEGOTIATION LIMIT EMAILS
  // ========================

  /**
   * Last Counter Warning
   * Sent when buyer has one counter opportunity remaining
   */
  lastCounterWarning: (
    productName: string,
    sellerName: string,
    countersUsed: number,
    maxCounters: number,
  ): string => {
    const safeProduct = escapeHtml(productName);
    const safeSeller = escapeHtml(sellerName);
    const theme = THEMES['trade-warning'];
    const remaining = maxCounters - countersUsed;

    const bodyHtml = `
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.7; color: #374151;">
        You have used <strong style="color: ${theme.primary};">${countersUsed} of ${maxCounters}</strong> counter opportunities
        for your trade of <strong style="color: #1a1a1a;">${safeProduct}</strong> with <strong style="color: #1a1a1a;">${safeSeller}</strong>.
      </p>

      ${warningBlock(`Your next response will be your FINAL offer. After that, the seller will only be able to Accept or Reject your trade.`, theme)}

      <!-- Counter Progress -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
        <tr>
          <td style="padding: 24px; background: ${theme.cardBg}; border: 1px solid ${theme.border}; border-radius: 12px; text-align: center;">
            <p style="margin: 0 0 12px 0; font-size: 12px; color: ${theme.muted}; text-transform: uppercase; letter-spacing: 1px;">
              Counter Opportunities
            </p>
            <p style="margin: 0; font-size: 32px; font-weight: 800; color: ${theme.primary};">
              ${remaining}
            </p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: ${theme.muted};">
              remaining
            </p>
          </td>
        </tr>
      </table>

      ${nextStepBlock('Consider using the chat feature to discuss terms with the seller before submitting your final counter offer.', theme)}
    `;

    const actionUrl = buildTradeUrl('buyer', '/trade');

    return baseLayout({
      title: '⚠️ Last Counter Opportunity',
      eyebrow: 'Negotiation Alert',
      bodyHtml,
      actionText: 'View Negotiation',
      actionUrl,
      theme: 'trade-warning',
    });
  },

  /**
   * Final Offer Notification
   * Sent to seller when buyer submits their final offer
   */
  finalOfferNotification: (
    productName: string,
    buyerName: string,
    finalPrice: string,
  ): string => {
    const safeProduct = escapeHtml(productName);
    const safeBuyer = escapeHtml(buyerName);
    const theme = THEMES.trade;

    const bodyHtml = `
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.7; color: #374151;">
        <strong style="color: ${theme.secondary};">${safeBuyer}</strong> has submitted their
        <strong style="color: ${theme.primary};">FINAL offer</strong> for
        <strong style="color: ${theme.secondary};">${safeProduct}</strong>.
      </p>

      <!-- Final Offer Display -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
        <tr>
          <td style="padding: 28px; background: linear-gradient(135deg, #fffef7 0%, #fef3c7 100%); border: 2px solid ${theme.primary}; border-radius: 16px; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: ${theme.muted}; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
              Final Offer
            </p>
            <p style="margin: 0; font-size: 32px; font-weight: 800; color: ${theme.primary};">
              ${escapeHtml(finalPrice)}
            </p>
          </td>
        </tr>
      </table>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0;">
        <tr>
          <td style="padding: 16px 20px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #1e40af; line-height: 1.6;">
              <strong>Note:</strong> The buyer has used all their counter opportunities. You can now only
              <strong style="color: #059669;">Accept</strong> or <strong style="color: #dc2626;">Reject</strong>
              this trade — no further counter-offers are possible.
            </p>
          </td>
        </tr>
      </table>

      ${nextStepBlock('Consider the offer carefully and use the chat feature if you need to discuss terms before making your decision.', theme)}
    `;

    const actionUrl = buildTradeUrl('seller', '/trade', 'tab=pr');

    return baseLayout({
      title: '🔔 Final Offer Received',
      eyebrow: 'Decision Required',
      bodyHtml,
      actionText: 'Make Decision',
      actionUrl,
      theme: 'trade',
    });
  },

  // ========================
  // CATEGORY MANAGEMENT
  // ========================

  /**
   * Category Rejection
   * Sent when admin rejects a user-suggested category
   */
  categoryRejection: (
    userName: string,
    categoryName: string,
    replacementCategory: string,
    productName: string,
    rejectionReason?: string,
  ): string => {
    const safeUser = escapeHtml(userName);
    const safeCategory = escapeHtml(categoryName);
    const safeReplacement = escapeHtml(replacementCategory);
    const safeProduct = escapeHtml(productName);
    const theme = THEMES['trade-warning'];

    const bodyHtml = `
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.7; color: #374151;">
        Hello <strong style="color: ${theme.secondary};">${safeUser}</strong>,
      </p>

      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.7; color: #374151;">
        Your suggested category "<strong style="color: ${theme.primary};">${safeCategory}</strong>" was not approved by our admin team.
      </p>

      ${rejectionReason ? reasonBlock(rejectionReason, theme) : ''}

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
        <tr>
          <td style="padding: 20px; background: ${theme.cardBg}; border: 1px solid ${theme.border}; border-radius: 12px;">
            <p style="margin: 0 0 12px 0; font-size: 13px; color: ${theme.muted};">
              Your product has been automatically reassigned:
            </p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid ${theme.border};">
                  <span style="color: ${theme.muted}; font-size: 13px;">Product:</span>
                  <span style="color: ${theme.secondary}; font-size: 14px; font-weight: 600; float: right;">${safeProduct}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">
                  <span style="color: ${theme.muted}; font-size: 13px;">New Category:</span>
                  <span style="color: ${theme.primary}; font-size: 14px; font-weight: 600; float: right;">${safeReplacement}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${nextStepBlock('If you believe this is incorrect, please contact our support team or suggest a different category.', theme)}
    `;

    const actionUrl = buildTradeUrl('seller', '/inventory');

    return baseLayout({
      title: 'Category Suggestion Not Approved',
      eyebrow: 'Category Update',
      bodyHtml,
      actionText: 'View My Products',
      actionUrl,
      theme: 'trade-warning',
    });
  },

  // ========================
  // NEWSLETTER
  // ========================

  /**
   * Weekly Digest Email
   * Clean, mobile-friendly newsletter with responsive blog post cards
   */
  weeklyDigest: (
    posts: any[],
    unsubscribeUrl: string,
    blogUrl: string,
  ): string => {
    const theme = THEMES.trade;
    // Sanitize URLs to prevent injection
    const safeBlogUrl = sanitizeUrl(blogUrl);
    const safeUnsubscribeUrl = sanitizeUrl(unsubscribeUrl);

    const postCards = posts
      .map(
        (post, index) => {
          const safeSlug = encodeURIComponent(post.slug || '');
          const safeImageUrl = sanitizeUrl(post.featuredImage);
          const postUrl = `${safeBlogUrl}/blog/post/${safeSlug}`;
          const isFirst = index === 0;

          return `
          <tr>
            <td style="padding: 0 0 16px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
                    <!-- Post Image -->
                    ${
                      post.featuredImage && safeImageUrl !== '#'
                        ? `<a href="${postUrl}" style="display: block;">
                            <img src="${safeImageUrl}" alt="${escapeHtml(post.title || '')}" style="width: 100%; max-height: ${isFirst ? '180px' : '140px'}; object-fit: cover; display: block;" />
                          </a>`
                        : `<div style="width: 100%; height: 60px; background: linear-gradient(135deg, #1A1A2E 0%, #2D2D4A 100%);"></div>`
                    }
                    <!-- Post Content -->
                    <div style="padding: 16px;">
                      <!-- Category -->
                      ${
                        post.categories && post.categories.length > 0
                          ? `<p style="margin: 0 0 8px 0; font-size: 11px; color: ${theme.primary}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">${escapeHtml(post.categories[0])}</p>`
                          : ''
                      }
                      <!-- Title -->
                      <h3 style="margin: 0 0 8px 0; font-size: ${isFirst ? '18px' : '16px'}; font-weight: 600; color: #1A1A2E; line-height: 1.3;">
                        <a href="${postUrl}" style="color: #1A1A2E; text-decoration: none;">${escapeHtml(post.title || '')}</a>
                      </h3>
                      <!-- Excerpt -->
                      <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.5; color: #6b7280;">
                        ${post.excerpt ? escapeHtml(truncateText(post.excerpt, 100)) : ''}
                      </p>
                      <!-- Read More + Author -->
                      <div style="display: flex; align-items: center; justify-content: space-between;">
                        <a href="${postUrl}" style="display: inline-block; padding: 8px 16px; background: ${theme.primary}; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 12px; border-radius: 4px;">
                          Read Article
                        </a>
                        ${
                          post.writerDisplayName
                            ? `<span style="font-size: 12px; color: #9ca3af;">By ${escapeHtml(post.writerDisplayName)}</span>`
                            : ''
                        }
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
        },
      )
      .join('');

    const year = new Date().getFullYear();
    const postCount = posts.length;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Your Weekly Breyus Blog Digest</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%;">
  <!-- Outer wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td style="padding: 24px 12px;">
        <!-- Main container - 600px max for better mobile support -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">

          <!-- Gold accent bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #B8860B 0%, #D4A017 100%);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 24px 20px 16px 20px; text-align: center; background: #1A1A2E;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #B8860B; letter-spacing: 2px;">
                BREYUS
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 2px;">
                Weekly Blog Digest
              </p>
            </td>
          </tr>

          <!-- Intro Section -->
          <tr>
            <td style="padding: 20px 20px 16px 20px; text-align: center; background: #fafafa; border-bottom: 1px solid #e5e7eb;">
              <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #1A1A2E;">
                This Week's Top Articles
              </h2>
              <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #6b7280;">
                ${postCount} new ${postCount === 1 ? 'article' : 'articles'} on commodity trading, market trends, and industry insights.
              </p>
            </td>
          </tr>

          <!-- Post Cards -->
          <tr>
            <td style="padding: 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                ${postCards}
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 20px 24px 20px; text-align: center;">
              <a href="${safeBlogUrl}/blog" style="display: inline-block; padding: 12px 32px; background: #1A1A2E; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 6px;">
                Browse All Articles
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af;">
                You're receiving this because you subscribed to the Breyus newsletter.
              </p>
              <p style="margin: 0 0 12px 0; font-size: 12px;">
                <a href="${safeUnsubscribeUrl}" style="color: #B8860B; text-decoration: underline;">Unsubscribe</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #d1d5db;">
                © ${year} Breyus. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  },

  // ========================
  // WELCOME & ONBOARDING EMAILS
  // ========================

  /**
   * Comprehensive Welcome Email
   * Sent after user completes registration (SetPassword step)
   */
  welcomeEmail: (
    userName: string,
    companyName: string,
    role: 'buyer' | 'seller',
  ): string => {
    const theme = THEMES['trade-success'];
    const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');

    const roleSpecificFeatures = role === 'buyer'
      ? `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid ${theme.border};">
            <strong style="color: ${theme.secondary};">🔍 Browse Marketplace</strong>
            <p style="margin: 6px 0 0 0; font-size: 14px; color: ${theme.muted};">Discover quality commodities from verified global sellers</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid ${theme.border};">
            <strong style="color: ${theme.secondary};">📝 Create Purchase Requests</strong>
            <p style="margin: 6px 0 0 0; font-size: 14px; color: ${theme.muted};">Submit offers directly to sellers and start negotiations</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid ${theme.border};">
            <strong style="color: ${theme.secondary};">🤝 Negotiate Deals</strong>
            <p style="margin: 6px 0 0 0; font-size: 14px; color: ${theme.muted};">Counter-offer until you find the perfect terms</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0;">
            <strong style="color: ${theme.secondary};">📦 Track Shipments</strong>
            <p style="margin: 6px 0 0 0; font-size: 14px; color: ${theme.muted};">Monitor your trades from agreement to delivery</p>
          </td>
        </tr>
      `
      : `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid ${theme.border};">
            <strong style="color: ${theme.secondary};">📦 List Products</strong>
            <p style="margin: 6px 0 0 0; font-size: 14px; color: ${theme.muted};">Showcase your commodities to global buyers</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid ${theme.border};">
            <strong style="color: ${theme.secondary};">📊 Manage Inventory</strong>
            <p style="margin: 6px 0 0 0; font-size: 14px; color: ${theme.muted};">Control stock levels and pricing in real-time</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid ${theme.border};">
            <strong style="color: ${theme.secondary};">💬 Respond to Inquiries</strong>
            <p style="margin: 6px 0 0 0; font-size: 14px; color: ${theme.muted};">Accept, reject, or counter buyer offers</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0;">
            <strong style="color: ${theme.secondary};">📈 Grow Your Business</strong>
            <p style="margin: 6px 0 0 0; font-size: 14px; color: ${theme.muted};">Access analytics and insights to maximize sales</p>
          </td>
        </tr>
      `;

    const primaryCtaText = role === 'buyer' ? 'Explore Marketplace' : 'Add Your First Product';
    const primaryCtaUrl = role === 'buyer' ? `${baseUrl}/buyer/homepage` : `${baseUrl}/seller/add-products`;

    const bodyHtml = `
      <!-- Welcome Message -->
      <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.7; color: #374151;">
        Welcome to <strong style="color: ${theme.primary};">Breyus</strong>, <strong style="color: ${theme.secondary};">${escapeHtml(userName)}</strong> from <strong style="color: ${theme.secondary};">${escapeHtml(companyName)}</strong>!
      </p>

      <!-- What is Breyus -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
        <tr>
          <td style="padding: 24px; background: ${theme.cardBg}; border: 1px solid ${theme.border}; border-radius: 12px;">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: ${theme.secondary};">
              🌍 What is Breyus?
            </h3>
            <p style="margin: 0; font-size: 15px; line-height: 1.7; color: ${theme.muted};">
              Breyus is a B2B commodity trading marketplace connecting global buyers and sellers.
              We streamline the entire trading lifecycle — from product discovery and negotiation
              to documentation and delivery.
            </p>
          </td>
        </tr>
      </table>

      <!-- Role-Specific Features -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
        <tr>
          <td style="padding: 24px; background: #ffffff; border: 1px solid ${theme.border}; border-radius: 12px;">
            <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; color: ${theme.secondary};">
              ${role === 'buyer' ? '🛒 As a Buyer, You Can:' : '💼 As a Seller, You Can:'}
            </h3>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              ${roleSpecificFeatures}
            </table>
          </td>
        </tr>
      </table>

      <!-- AI-Powered Tools -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
        <tr>
          <td style="padding: 24px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #93c5fd; border-radius: 12px;">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: #1e40af;">
              🤖 AI-Powered Trading
            </h3>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #1e40af;">
              <strong>Find the right trading partners faster</strong> with our intelligent matching system.
            </p>
            <p style="margin: 0; font-size: 14px; color: #3b82f6;">
              Get market insights, demand forecasts, and risk assessments to make informed decisions.
            </p>
          </td>
        </tr>
      </table>

      <!-- How Trading Works -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
        <tr>
          <td style="padding: 24px; background: ${theme.cardBg}; border: 1px solid ${theme.border}; border-radius: 12px;">
            <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; color: ${theme.secondary}; text-align: center;">
              📋 How Trading Works
            </h3>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="text-align: center; padding: 8px; width: 16.66%;">
                  <div style="width: 40px; height: 40px; border-radius: 50%; background: ${theme.primary}; color: white; line-height: 40px; text-align: center; margin: 0 auto 8px; font-weight: 700;">1</div>
                  <p style="margin: 0; font-size: 11px; color: ${theme.muted};">Request</p>
                </td>
                <td style="text-align: center; padding: 8px; width: 16.66%;">
                  <div style="width: 40px; height: 40px; border-radius: 50%; background: ${theme.primary}; color: white; line-height: 40px; text-align: center; margin: 0 auto 8px; font-weight: 700;">2</div>
                  <p style="margin: 0; font-size: 11px; color: ${theme.muted};">Offer</p>
                </td>
                <td style="text-align: center; padding: 8px; width: 16.66%;">
                  <div style="width: 40px; height: 40px; border-radius: 50%; background: ${theme.primary}; color: white; line-height: 40px; text-align: center; margin: 0 auto 8px; font-weight: 700;">3</div>
                  <p style="margin: 0; font-size: 11px; color: ${theme.muted};">Agreement</p>
                </td>
                <td style="text-align: center; padding: 8px; width: 16.66%;">
                  <div style="width: 40px; height: 40px; border-radius: 50%; background: ${theme.primary}; color: white; line-height: 40px; text-align: center; margin: 0 auto 8px; font-weight: 700;">4</div>
                  <p style="margin: 0; font-size: 11px; color: ${theme.muted};">Payment</p>
                </td>
                <td style="text-align: center; padding: 8px; width: 16.66%;">
                  <div style="width: 40px; height: 40px; border-radius: 50%; background: ${theme.primary}; color: white; line-height: 40px; text-align: center; margin: 0 auto 8px; font-weight: 700;">5</div>
                  <p style="margin: 0; font-size: 11px; color: ${theme.muted};">Shipping</p>
                </td>
                <td style="text-align: center; padding: 8px; width: 16.66%;">
                  <div style="width: 40px; height: 40px; border-radius: 50%; background: ${theme.primary}; color: white; line-height: 40px; text-align: center; margin: 0 auto 8px; font-weight: 700;">6</div>
                  <p style="margin: 0; font-size: 11px; color: ${theme.muted};">Complete</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- CTA Buttons -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
        <tr>
          <td style="text-align: center;">
            ${emailButton(primaryCtaText, primaryCtaUrl, theme)}
          </td>
        </tr>
        <tr>
          <td style="text-align: center; padding-top: 16px;">
            <a href="${baseUrl}/${role}/settings" style="color: ${theme.primary}; text-decoration: underline; font-size: 14px;">Complete Your Profile →</a>
          </td>
        </tr>
      </table>
    `;

    return baseLayout({
      title: 'Welcome to Breyus!',
      eyebrow: 'Welcome',
      bodyHtml,
      theme: 'trade-success',
      footerNote: "We're here to help you succeed in global commodity trading.",
    });
  },

  // ========================
  // DISPUTE EMAIL TEMPLATES
  // ========================

  /**
   * Dispute Created
   * Sent to admins when a user creates a dispute
   */
  disputeCreated: (
    disputeId: string,
    productName: string,
    reason: string,
    raisedByEmail: string,
    context?: TradeEmailContext,
  ): string => {
    const theme = THEMES['trade-warning'];
    const baseUrl = (process.env.ADMIN_PORTAL_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const actionUrl = `${baseUrl}/disputes/${disputeId}`;

    const bodyHtml = `
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.7; color: #374151;">
        A new dispute has been raised for the trade of <strong style="color: ${theme.secondary};">${escapeHtml(productName)}</strong>.
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0; background: ${theme.cardBg}; border: 1px solid ${theme.border}; border-radius: 12px; overflow: hidden;">
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid ${theme.border};">
            <span style="color: ${theme.muted}; font-size: 13px;">Dispute ID:</span>
            <span style="color: ${theme.secondary}; font-size: 14px; font-weight: 600; float: right; font-family: monospace;">${escapeHtml(disputeId.slice(-8).toUpperCase())}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid ${theme.border};">
            <span style="color: ${theme.muted}; font-size: 13px;">Raised By:</span>
            <span style="color: ${theme.secondary}; font-size: 14px; font-weight: 600; float: right;">${escapeHtml(raisedByEmail)}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px;">
            <span style="color: ${theme.muted}; font-size: 13px;">Reason:</span>
            <span style="color: ${theme.primary}; font-size: 14px; font-weight: 600; float: right;">${escapeHtml(reason)}</span>
          </td>
        </tr>
      </table>

      ${tradeSummaryCard(context, theme)}
      ${nextStepBlock('Review the dispute details and assign it to an admin for resolution.', theme)}
    `;

    return baseLayout({
      title: 'New Dispute Raised',
      eyebrow: 'Dispute Alert',
      bodyHtml,
      actionText: 'Review Dispute',
      actionUrl,
      theme: 'trade-warning',
    });
  },

  /**
   * Dispute Assigned
   * Sent to the admin when assigned to a dispute
   */
  disputeAssigned: (
    disputeId: string,
    productName: string,
    assignedByEmail: string,
    context?: TradeEmailContext,
  ): string => {
    const theme = THEMES.trade;
    const baseUrl = (process.env.ADMIN_PORTAL_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const actionUrl = `${baseUrl}/disputes/${disputeId}`;

    const bodyHtml = `
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.7; color: #374151;">
        You have been assigned to handle a dispute for <strong style="color: ${theme.primary};">${escapeHtml(productName)}</strong>.
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0; background: ${theme.cardBg}; border: 1px solid ${theme.border}; border-radius: 12px; overflow: hidden;">
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid ${theme.border};">
            <span style="color: ${theme.muted}; font-size: 13px;">Dispute ID:</span>
            <span style="color: ${theme.secondary}; font-size: 14px; font-weight: 600; float: right; font-family: monospace;">${escapeHtml(disputeId.slice(-8).toUpperCase())}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px;">
            <span style="color: ${theme.muted}; font-size: 13px;">Assigned By:</span>
            <span style="color: ${theme.secondary}; font-size: 14px; font-weight: 600; float: right;">${escapeHtml(assignedByEmail)}</span>
          </td>
        </tr>
      </table>

      ${tradeSummaryCard(context, theme)}
      ${nextStepBlock('Review the dispute history and communicate with both parties to reach a resolution.', theme)}
    `;

    return baseLayout({
      title: 'Dispute Assigned to You',
      eyebrow: 'Action Required',
      bodyHtml,
      actionText: 'View Dispute',
      actionUrl,
      theme: 'trade',
    });
  },

  /**
   * Dispute Status Updated
   * Sent to the user who raised the dispute when status changes
   */
  disputeStatusUpdated: (
    disputeId: string,
    productName: string,
    oldStatus: string,
    newStatus: string,
    context?: TradeEmailContext,
  ): string => {
    const isPositiveChange = newStatus === 'resolved' || newStatus === 'under_review';
    const theme = isPositiveChange ? THEMES['trade-success'] : THEMES.trade;

    const statusLabels: Record<string, string> = {
      open: 'Open',
      under_review: 'Under Review',
      resolved: 'Resolved',
      closed: 'Closed',
    };

    const bodyHtml = `
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.7; color: #374151;">
        The status of your dispute for <strong style="color: ${theme.secondary};">${escapeHtml(productName)}</strong> has been updated.
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
        <tr>
          <td style="padding: 20px; background: ${theme.cardBg}; border: 1px solid ${theme.border}; border-radius: 12px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="width: 45%; text-align: center; padding: 12px;">
                  <p style="margin: 0 0 6px 0; font-size: 11px; color: ${theme.muted}; text-transform: uppercase; letter-spacing: 0.5px;">Previous Status</p>
                  <p style="margin: 0; font-size: 18px; color: #9ca3af; font-weight: 700;">${escapeHtml(statusLabels[oldStatus] || oldStatus)}</p>
                </td>
                <td style="width: 10%; text-align: center; color: ${theme.muted};">→</td>
                <td style="width: 45%; text-align: center; padding: 12px;">
                  <p style="margin: 0 0 6px 0; font-size: 11px; color: ${theme.primary}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">New Status</p>
                  <p style="margin: 0; font-size: 18px; color: ${theme.primary}; font-weight: 800;">${escapeHtml(statusLabels[newStatus] || newStatus)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${tradeSummaryCard(context, theme)}
      ${nextStepBlock(newStatus === 'under_review' ? 'An admin is now reviewing your dispute. You will be notified of updates.' : 'Check the dispute details for more information.', theme)}
    `;

    const actionUrl = context?.actionUrl || buildTradeUrl(context?.recipientRole, '/trade', 'tab=history');

    return baseLayout({
      title: 'Dispute Status Updated',
      eyebrow: 'Dispute Update',
      bodyHtml,
      actionText: 'View Details',
      actionUrl,
      theme: isPositiveChange ? 'trade-success' : 'trade',
    });
  },

  /**
   * Dispute Message
   * Sent when there's a new message in a dispute
   */
  disputeMessage: (
    disputeId: string,
    senderName: string,
    messagePreview: string,
    context?: TradeEmailContext,
  ): string => {
    const theme = THEMES.trade;
    const actionUrl = context?.actionUrl || buildTradeUrl(context?.recipientRole, '/trade', 'tab=history');

    const bodyHtml = `
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.7; color: #374151;">
        You have a new message in your dispute.
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0; background: ${theme.cardBg}; border: 1px solid ${theme.border}; border-radius: 12px; overflow: hidden;">
        <tr>
          <td style="padding: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: ${theme.muted}; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">
              💬 Message from ${escapeHtml(senderName)}
            </p>
            <p style="margin: 0; font-size: 15px; color: ${theme.secondary}; line-height: 1.6; font-style: italic;">
              "${escapeHtml(truncateText(messagePreview, 200))}"
            </p>
          </td>
        </tr>
      </table>

      ${tradeSummaryCard(context, theme)}
    `;

    return baseLayout({
      title: 'New Dispute Message',
      eyebrow: 'Dispute Update',
      bodyHtml,
      actionText: 'View Message',
      actionUrl,
      theme: 'trade',
    });
  },

  /**
   * Dispute Resolved
   * Sent when admin resolves a dispute
   */
  disputeResolved: (
    disputeId: string,
    resolution: string,
    productName: string,
    context?: TradeEmailContext,
  ): string => {
    const theme = THEMES['trade-success'];
    const actionUrl = context?.actionUrl || buildTradeUrl(context?.recipientRole, '/trade', 'tab=history');

    const bodyHtml = `
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.7; color: #374151;">
        Great news! Your dispute for <strong style="color: ${theme.primary};">${escapeHtml(productName)}</strong> has been resolved.
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
        <tr>
          <td style="padding: 24px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid ${theme.primary}; border-radius: 12px; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: ${theme.muted}; text-transform: uppercase; letter-spacing: 1px;">
              ✓ Dispute Resolved
            </p>
            <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${theme.secondary};">
              Dispute ID: ${escapeHtml(disputeId.slice(-8).toUpperCase())}
            </p>
          </td>
        </tr>
      </table>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
        <tr>
          <td style="padding: 20px; background: ${theme.cardBg}; border: 1px solid ${theme.border}; border-radius: 12px;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: ${theme.muted}; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">
              📋 Resolution Notes
            </p>
            <p style="margin: 0; font-size: 15px; color: ${theme.secondary}; line-height: 1.6;">
              ${escapeHtml(resolution)}
            </p>
          </td>
        </tr>
      </table>

      ${tradeSummaryCard(context, theme)}
    `;

    return baseLayout({
      title: 'Dispute Resolved',
      eyebrow: 'Resolution',
      bodyHtml,
      actionText: 'View Details',
      actionUrl,
      theme: 'trade-success',
      footerNote: 'Thank you for your patience during the resolution process.',
    });
  },

  // ========================
  // ADMIN ACTION EMAILS
  // ========================

  /**
   * Account Suspended
   * Sent when admin suspends a user account
   */
  accountSuspended: (
    reason: string,
    suspendedAt: Date,
  ): string => {
    const theme = THEMES['trade-warning'];
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@breyus.com';

    const bodyHtml = `
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.7; color: #374151;">
        Your Breyus account has been <strong style="color: #dc2626;">suspended</strong> by an administrator.
      </p>

      ${warningBlock('You will not be able to log in or access platform features until your account is reactivated.', theme)}

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0; background: ${theme.cardBg}; border: 1px solid ${theme.border}; border-radius: 12px; overflow: hidden;">
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid ${theme.border};">
            <span style="color: ${theme.muted}; font-size: 13px;">Suspension Date:</span>
            <span style="color: ${theme.secondary}; font-size: 14px; font-weight: 600; float: right;">${formatDate(suspendedAt)}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px;">
            <p style="margin: 0 0 8px 0; color: ${theme.muted}; font-size: 13px;">Reason:</p>
            <p style="margin: 0; color: ${theme.secondary}; font-size: 14px; font-weight: 600;">${escapeHtml(reason)}</p>
          </td>
        </tr>
      </table>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
        <tr>
          <td style="padding: 20px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 12px; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: ${theme.secondary}; font-weight: 600;">
              Believe this is an error?
            </p>
            <p style="margin: 0; font-size: 14px; color: ${theme.muted};">
              Contact our support team at <a href="mailto:${supportEmail}" style="color: ${theme.primary}; text-decoration: none; font-weight: 600;">${supportEmail}</a>
            </p>
          </td>
        </tr>
      </table>
    `;

    return baseLayout({
      title: 'Account Suspended',
      eyebrow: 'Account Notice',
      bodyHtml,
      theme: 'trade-warning',
    });
  },

  /**
   * Account Unsuspended
   * Sent when admin reactivates a user account
   */
  accountUnsuspended: (
    reactivatedAt: Date,
  ): string => {
    const theme = THEMES['trade-success'];
    const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');

    const bodyHtml = `
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.7; color: #374151;">
        Good news! Your Breyus account has been <strong style="color: ${theme.primary};">reactivated</strong>.
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
        <tr>
          <td style="padding: 24px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid ${theme.primary}; border-radius: 12px; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: ${theme.muted}; text-transform: uppercase; letter-spacing: 1px;">
              ✓ Account Reactivated
            </p>
            <p style="margin: 0; font-size: 18px; font-weight: 700; color: ${theme.primary};">
              ${formatDate(reactivatedAt)}
            </p>
          </td>
        </tr>
      </table>

      <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.7; color: #374151;">
        You can now log in and use all platform features as usual. Any ongoing trades or negotiations you had will be accessible.
      </p>

      ${nextStepBlock('Log in to your account to continue where you left off.', theme)}
    `;

    return baseLayout({
      title: 'Account Reactivated',
      eyebrow: 'Good News',
      bodyHtml,
      actionText: 'Log In Now',
      actionUrl: `${baseUrl}/login`,
      theme: 'trade-success',
    });
  },

  /**
   * Password Reset Required
   * Sent when admin forces a password reset
   */
  passwordResetRequired: (
    otp: string,
  ): string => {
    const theme = THEMES.auth;

    const bodyHtml = `
      <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.7; color: #374151;">
        An administrator has initiated a password reset for your Breyus account for security reasons.
        Use the code below to set a new password.
      </p>

      ${warningBlock('Your current password has been invalidated. Please complete this reset promptly.', THEMES['trade-warning'])}

      <!-- OTP Display Box -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
        <tr>
          <td style="padding: 32px; background: linear-gradient(135deg, #fffef7 0%, #fef3c7 100%); border: 2px solid ${theme.primary}; border-radius: 16px; text-align: center;">
            <p style="margin: 0 0 12px 0; font-size: 12px; color: ${theme.muted}; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
              Password Reset Code
            </p>
            <div style="font-size: 42px; font-weight: 800; letter-spacing: 12px; color: ${theme.primary}; font-family: 'Courier New', monospace;">
              ${escapeHtml(otp)}
            </div>
            <p style="margin: 12px 0 0 0; font-size: 13px; color: ${theme.muted};">
              Valid for 10 minutes
            </p>
          </td>
        </tr>
      </table>

      ${securityTipBlock('If you did not expect this reset, please contact support immediately as your account may be compromised.')}
    `;

    return baseLayout({
      title: 'Password Reset Required',
      eyebrow: 'Security Alert',
      bodyHtml,
      theme: 'auth',
      footerNote: 'This action was initiated by an administrator.',
    });
  },

  // ========================
  // WISHLIST & PRODUCT ALERTS
  // ========================

  /**
   * Product Back In Stock
   * Sent to users who have the product in their wishlist
   */
  productBackInStock: (
    productName: string,
    sellerName: string,
    actionUrl: string,
  ): string => {
    const theme = THEMES['trade-success'];

    const bodyHtml = `
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.7; color: #374151;">
        Good news! A product from your wishlist is now available:
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
        <tr>
          <td style="padding: 24px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid ${theme.primary}; border-radius: 12px; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: ${theme.muted}; text-transform: uppercase; letter-spacing: 1px;">
              ✓ Back In Stock
            </p>
            <p style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: ${theme.secondary};">
              ${escapeHtml(productName)}
            </p>
            <p style="margin: 0; font-size: 14px; color: ${theme.muted};">
              from ${escapeHtml(sellerName)}
            </p>
          </td>
        </tr>
      </table>

      ${nextStepBlock('View the product details and submit a purchase request before it sells out.', theme)}
    `;

    return baseLayout({
      title: 'Wishlist Item Back In Stock!',
      eyebrow: 'Stock Alert',
      bodyHtml,
      actionText: 'View Product',
      actionUrl: sanitizeUrl(actionUrl),
      theme: 'trade-success',
    });
  },

  /**
   * Wishlist Price Dropped
   * Sent when a wishlisted product's price decreases
   */
  wishlistPriceDropped: (
    productName: string,
    oldPrice: number,
    newPrice: number,
    currency: string,
    actionUrl: string,
  ): string => {
    const theme = THEMES['trade-success'];
    const savings = oldPrice - newPrice;
    const savingsPercent = Math.round((savings / oldPrice) * 100);

    const bodyHtml = `
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.7; color: #374151;">
        The price has dropped on a product from your wishlist!
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
        <tr>
          <td style="padding: 24px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid ${theme.primary}; border-radius: 12px; text-align: center;">
            <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: ${theme.secondary};">
              ${escapeHtml(productName)}
            </p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="width: 40%; text-align: center;">
                  <p style="margin: 0 0 4px 0; font-size: 11px; color: ${theme.muted}; text-transform: uppercase;">Was</p>
                  <p style="margin: 0; font-size: 18px; color: #9ca3af; font-weight: 600; text-decoration: line-through;">${escapeHtml(currency)} ${formatNumber(oldPrice)}</p>
                </td>
                <td style="width: 20%; text-align: center;">
                  <span style="display: inline-block; padding: 4px 12px; background: ${theme.primary}; color: white; border-radius: 20px; font-size: 12px; font-weight: 700;">
                    -${savingsPercent}%
                  </span>
                </td>
                <td style="width: 40%; text-align: center;">
                  <p style="margin: 0 0 4px 0; font-size: 11px; color: ${theme.primary}; text-transform: uppercase; font-weight: 700;">Now</p>
                  <p style="margin: 0; font-size: 24px; color: ${theme.primary}; font-weight: 800;">${escapeHtml(currency)} ${formatNumber(newPrice)}</p>
                </td>
              </tr>
            </table>
            <p style="margin: 16px 0 0 0; font-size: 14px; color: ${theme.primary}; font-weight: 600;">
              You save ${escapeHtml(currency)} ${formatNumber(savings)}!
            </p>
          </td>
        </tr>
      </table>

      ${nextStepBlock('Take advantage of this price drop and submit a purchase request.', theme)}
    `;

    return baseLayout({
      title: 'Price Drop Alert!',
      eyebrow: 'Wishlist Alert',
      bodyHtml,
      actionText: 'View Product',
      actionUrl: sanitizeUrl(actionUrl),
      theme: 'trade-success',
    });
  },

  // ========================
  // TRADE REMINDER EMAILS
  // ========================

  /**
   * Stalled Trade Reminder
   * Sent by admin to remind users about inactive trades
   */
  stalledTradeReminder: (
    productName: string,
    counterpartyName: string,
    daysSinceActivity: number,
    currentPhase: string,
    actionUrl: string,
    adminMessage?: string,
  ): string => {
    const theme = THEMES['trade-warning'];
    const phaseLabel = mapPhaseLabel(currentPhase);

    const bodyHtml = `
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.7; color: #374151;">
        Your trade for <strong style="color: ${theme.secondary};">${escapeHtml(productName)}</strong> with
        <strong style="color: ${theme.secondary};">${escapeHtml(counterpartyName)}</strong> has been
        <strong style="color: ${theme.primary};">inactive for ${daysSinceActivity} days</strong>.
      </p>

      ${warningBlock(`This trade has been stalled in the "${phaseLabel}" phase. Please take action to keep it moving forward.`, theme)}

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0; background: ${theme.cardBg}; border: 1px solid ${theme.border}; border-radius: 12px; overflow: hidden;">
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid ${theme.border};">
            <span style="color: ${theme.muted}; font-size: 13px;">Product:</span>
            <span style="color: ${theme.secondary}; font-size: 14px; font-weight: 600; float: right;">${escapeHtml(productName)}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid ${theme.border};">
            <span style="color: ${theme.muted}; font-size: 13px;">Trading Partner:</span>
            <span style="color: ${theme.secondary}; font-size: 14px; font-weight: 600; float: right;">${escapeHtml(counterpartyName)}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid ${theme.border};">
            <span style="color: ${theme.muted}; font-size: 13px;">Current Phase:</span>
            <span style="color: ${theme.primary}; font-size: 14px; font-weight: 600; float: right;">${escapeHtml(phaseLabel || currentPhase)}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px;">
            <span style="color: ${theme.muted}; font-size: 13px;">Days Inactive:</span>
            <span style="color: #dc2626; font-size: 14px; font-weight: 700; float: right;">${daysSinceActivity} days</span>
          </td>
        </tr>
      </table>

      ${adminMessage ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
          <tr>
            <td style="padding: 20px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #1e40af; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">
                📝 Message from Admin
              </p>
              <p style="margin: 0; font-size: 15px; color: #1e40af; line-height: 1.6;">
                ${escapeHtml(adminMessage)}
              </p>
            </td>
          </tr>
        </table>
      ` : ''}

      ${nextStepBlock('Log in to review the trade and take the necessary action to move it forward.', theme)}
    `;

    return baseLayout({
      title: 'Trade Reminder: Action Required',
      eyebrow: 'Stalled Trade',
      bodyHtml,
      actionText: 'Resume Trade',
      actionUrl: sanitizeUrl(actionUrl),
      theme: 'trade-warning',
    });
  },

  // ========================
  // ANALYSIS EMAILS
  // ========================

  /**
   * Analysis Completed
   * Sent when async market analysis job completes
   */
  analysisCompleted: (
    commodityName: string,
    actionUrl: string,
  ): string => {
    const theme = THEMES['trade-success'];

    const bodyHtml = `
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.7; color: #374151;">
        Your market analysis for <strong style="color: ${theme.primary};">${escapeHtml(commodityName)}</strong> is ready!
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
        <tr>
          <td style="padding: 24px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid ${theme.primary}; border-radius: 12px; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: ${theme.muted}; text-transform: uppercase; letter-spacing: 1px;">
              ✓ Analysis Complete
            </p>
            <p style="margin: 0; font-size: 20px; font-weight: 700; color: ${theme.primary};">
              ${escapeHtml(commodityName)}
            </p>
          </td>
        </tr>
      </table>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0; background: ${theme.cardBg}; border: 1px solid ${theme.border}; border-radius: 12px; overflow: hidden;">
        <tr>
          <td style="padding: 20px;">
            <p style="margin: 0 0 12px 0; font-size: 14px; color: ${theme.secondary}; font-weight: 700;">
              Your analysis includes:
            </p>
            <ul style="margin: 0; padding: 0 0 0 20px; font-size: 14px; color: ${theme.muted}; line-height: 1.8;">
              <li>Price trends and forecasts</li>
              <li>Demand indicators</li>
              <li>Risk assessment</li>
              <li>Top market players</li>
              <li>Seasonality patterns</li>
            </ul>
          </td>
        </tr>
      </table>

      ${nextStepBlock('View your analysis results to make informed trading decisions.', theme)}
    `;

    return baseLayout({
      title: 'Market Analysis Ready',
      eyebrow: 'AI Analysis',
      bodyHtml,
      actionText: 'View Results',
      actionUrl: sanitizeUrl(actionUrl),
      theme: 'trade-success',
    });
  },
};
