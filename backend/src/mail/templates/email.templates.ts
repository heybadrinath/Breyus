export const emailTemplates = {
  /**
   * OTP Verification Email Template
   * Modern gradient design with Breyus branding
   */
  otpVerification: (otp: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - Breyus</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0a0a0a;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background: linear-gradient(145deg, #1F1F1F 0%, #000000 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(188, 168, 107, 0.15);">
          <!-- Header with gradient accent -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #bca86b 0%, #d4c896 50%, #bca86b 100%);"></td>
          </tr>

          <!-- Logo Section -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #bca86b; letter-spacing: 2px;">BREYUS</h1>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 3px;">Commodity Trading Platform</p>
            </td>
          </tr>

          <!-- Content Section -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #ffffff; text-align: center;">Verify Your Email</h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #b0b0b0; text-align: center;">
                Use the verification code below to complete your authentication. This code will expire in 10 minutes.
              </p>
            </td>
          </tr>

          <!-- OTP Box -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="background: linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%); border: 1px solid #bca86b; border-radius: 12px; padding: 24px; text-align: center;">
                    <span style="font-size: 36px; font-weight: 700; color: #bca86b; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Warning Section -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="background-color: rgba(188, 168, 107, 0.1); border-radius: 8px; padding: 16px;">
                    <p style="margin: 0; font-size: 13px; color: #999999; text-align: center;">
                      <strong style="color: #bca86b;">Security Notice:</strong> Never share this code with anyone. Breyus team will never ask for your OTP.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: rgba(0, 0, 0, 0.3); border-top: 1px solid #2a2a2a;">
              <p style="margin: 0; font-size: 12px; color: #666666; text-align: center;">
                This is an automated message from Breyus. Please do not reply to this email.
              </p>
              <p style="margin: 12px 0 0 0; font-size: 12px; color: #666666; text-align: center;">
                &copy; ${new Date().getFullYear()} Breyus. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `,

  /**
   * Password Reset Email Template
   * Modern gradient design with Breyus branding
   */
  passwordReset: (otp: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Breyus</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0a0a0a;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background: linear-gradient(145deg, #1F1F1F 0%, #000000 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(188, 168, 107, 0.15);">
          <!-- Header with gradient accent -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #bca86b 0%, #d4c896 50%, #bca86b 100%);"></td>
          </tr>

          <!-- Logo Section -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #bca86b; letter-spacing: 2px;">BREYUS</h1>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 3px;">Commodity Trading Platform</p>
            </td>
          </tr>

          <!-- Lock Icon Section -->
          <tr>
            <td style="padding: 20px 40px 0 40px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 64px; height: 64px; background: linear-gradient(145deg, #bca86b 0%, #8a7a4f 100%); border-radius: 50%; text-align: center; vertical-align: middle;">
                    <span style="font-size: 28px; line-height: 64px;">&#128274;</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Section -->
          <tr>
            <td style="padding: 24px 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #ffffff; text-align: center;">Password Reset Request</h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #b0b0b0; text-align: center;">
                We received a request to reset your password for your Breyus account. Use the code below to proceed with the reset.
              </p>
            </td>
          </tr>

          <!-- OTP Box -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="background: linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%); border: 1px solid #bca86b; border-radius: 12px; padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #888888; text-transform: uppercase; letter-spacing: 1px;">Your Reset Code</p>
                    <span style="font-size: 36px; font-weight: 700; color: #bca86b; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</span>
                    <p style="margin: 12px 0 0 0; font-size: 13px; color: #666666;">Valid for 10 minutes</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Info Section -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #888888; text-align: center;">
                If you did not request a password reset, please ignore this email or contact our support team if you have concerns about your account security.
              </p>
            </td>
          </tr>

          <!-- Warning Section -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="background-color: rgba(188, 168, 107, 0.1); border-radius: 8px; padding: 16px;">
                    <p style="margin: 0; font-size: 13px; color: #999999; text-align: center;">
                      <strong style="color: #bca86b;">Security Tip:</strong> Create a strong password with a mix of letters, numbers, and special characters.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: rgba(0, 0, 0, 0.3); border-top: 1px solid #2a2a2a;">
              <p style="margin: 0; font-size: 12px; color: #666666; text-align: center;">
                This is an automated message from Breyus. Please do not reply to this email.
              </p>
              <p style="margin: 12px 0 0 0; font-size: 12px; color: #666666; text-align: center;">
                &copy; ${new Date().getFullYear()} Breyus. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `,

  /**
   * Trade Notification Base Template
   */
  tradeNotificationBase: (title: string, message: string, actionText?: string, actionUrl?: string, highlight?: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Breyus</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0a0a0a;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background: linear-gradient(145deg, #1F1F1F 0%, #000000 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(188, 168, 107, 0.15);">
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #bca86b 0%, #d4c896 50%, #bca86b 100%);"></td>
          </tr>
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #bca86b; letter-spacing: 2px;">BREYUS</h1>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 3px;">Commodity Trading Platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #ffffff; text-align: center;">${title}</h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #b0b0b0; text-align: center;">
                ${message}
              </p>
            </td>
          </tr>
          ${highlight ? `
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="background: linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%); border: 1px solid #bca86b; border-radius: 12px; padding: 20px; text-align: center;">
                    <span style="font-size: 18px; font-weight: 600; color: #bca86b;">${highlight}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}
          ${actionText && actionUrl ? `
          <tr>
            <td style="padding: 0 40px 32px 40px; text-align: center;">
              <a href="${actionUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(145deg, #bca86b 0%, #8a7a4f 100%); color: #000000; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 8px; text-transform: uppercase; letter-spacing: 1px;">${actionText}</a>
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 24px 40px; background-color: rgba(0, 0, 0, 0.3); border-top: 1px solid #2a2a2a;">
              <p style="margin: 0; font-size: 12px; color: #666666; text-align: center;">
                This is an automated notification from Breyus. Please do not reply to this email.
              </p>
              <p style="margin: 12px 0 0 0; font-size: 12px; color: #666666; text-align: center;">
                &copy; ${new Date().getFullYear()} Breyus. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `,

  /**
   * Counter Offer Received Email
   */
  counterOfferReceived: (productName: string, counterpartyName: string, newPrice: string): string => {
    return emailTemplates.tradeNotificationBase(
      'New Counter Offer Received',
      `You have received a counter offer for <strong style="color: #ffffff;">${productName}</strong> from <strong style="color: #bca86b;">${counterpartyName}</strong>. Review the new terms and respond to continue the negotiation.`,
      'View Counter Offer',
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/trade`,
      `New Offered Price: ${newPrice}`
    );
  },

  /**
   * Trade Accepted Email
   */
  tradeAccepted: (productName: string, counterpartyName: string): string => {
    return emailTemplates.tradeNotificationBase(
      'Trade Accepted!',
      `Great news! Your trade for <strong style="color: #ffffff;">${productName}</strong> has been accepted by <strong style="color: #bca86b;">${counterpartyName}</strong>. You can now proceed with document uploads.`,
      'View Trade Details',
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/trade`
    );
  },

  /**
   * Trade Rejected Email
   */
  tradeRejected: (productName: string, counterpartyName: string, reason?: string): string => {
    const reasonText = reason ? `Reason provided: "${reason}"` : 'No reason was provided.';
    return emailTemplates.tradeNotificationBase(
      'Trade Rejected',
      `Unfortunately, your trade for <strong style="color: #ffffff;">${productName}</strong> was rejected by <strong style="color: #bca86b;">${counterpartyName}</strong>. ${reasonText}`,
      'View Trade History',
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/trade`
    );
  },

  /**
   * Document Uploaded Email
   */
  documentUploaded: (productName: string, documentType: string, uploaderName: string): string => {
    const docTypeName = documentType.toUpperCase();
    return emailTemplates.tradeNotificationBase(
      'New Document Uploaded',
      `A new <strong style="color: #bca86b;">${docTypeName}</strong> document has been uploaded for your trade of <strong style="color: #ffffff;">${productName}</strong> by <strong style="color: #bca86b;">${uploaderName}</strong>. Please review and verify the document.`,
      'Review Document',
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/trade`,
      `Document Type: ${docTypeName}`
    );
  },

  /**
   * Phase Advanced Email
   */
  phaseAdvanced: (productName: string, newPhase: string): string => {
    const phaseDescriptions: Record<string, string> = {
      'SCO': 'Soft Corporate Offer phase',
      'ICPO': 'Irrevocable Corporate Purchase Order phase',
      'SPA': 'Sales Purchase Agreement phase',
      'PAYMENT': 'Payment verification phase',
      'BOL': 'Bill of Lading phase',
      'COMPLETED': 'Trade Completed!'
    };
    const phaseDescription = phaseDescriptions[newPhase] || newPhase;
    return emailTemplates.tradeNotificationBase(
      'Trade Phase Updated',
      `Your trade for <strong style="color: #ffffff;">${productName}</strong> has advanced to the <strong style="color: #bca86b;">${phaseDescription}</strong>. Check your trade dashboard for the next steps.`,
      'View Trade Progress',
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/trade`,
      `Current Phase: ${newPhase}`
    );
  },

  /**
   * Trade Completed Email
   */
  tradeCompleted: (productName: string, totalAmount: string): string => {
    return emailTemplates.tradeNotificationBase(
      'Trade Completed Successfully!',
      `Congratulations! Your trade for <strong style="color: #ffffff;">${productName}</strong> has been completed successfully. Thank you for using Breyus for your commodity trading needs.`,
      'View Invoice',
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/trade`,
      `Total Amount: ${totalAmount}`
    );
  },

  /**
   * Documents Invalidated Email
   * Sent when a document is replaced and subsequent documents are invalidated
   */
  documentsInvalidated: (productName: string, replacedDocument: string, invalidatedDocuments: string[]): string => {
    const docList = invalidatedDocuments.join(', ');
    return emailTemplates.tradeNotificationBase(
      'Action Required: Documents Need Re-submission',
      `The <strong style="color: #bca86b;">${replacedDocument}</strong> document for your trade of <strong style="color: #ffffff;">${productName}</strong> has been updated. As a result, the following documents have been invalidated and need to be re-submitted: <strong style="color: #bca86b;">${docList}</strong>.`,
      'View Trade',
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/trade`,
      `Invalidated Documents: ${docList}`
    );
  },
};
