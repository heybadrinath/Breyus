import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import {
  GSTVerificationResult,
  GSTFormatValidationResult,
  CashfreeGSTResponse,
} from './interfaces/gst-response.interface';

@Injectable()
export class GstService {
  private readonly GSTIN_REGEX =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  private readonly CASHFREE_BASE_URL =
    process.env.CASHFREE_BASE_URL || 'https://api.cashfree.com';

  /**
   * Validates GSTIN format using regex and checksum algorithm
   * GSTIN Format: 22AAAAA0000A1Z5
   * - Positions 1-2: State code (01-37)
   * - Positions 3-12: PAN number
   * - Position 13: Entity number (1-9, A-Z)
   * - Position 14: Z (default)
   * - Position 15: Check digit (calculated using Luhn-like algorithm)
   */
  validateGSTFormat(gstin: string): GSTFormatValidationResult {
    if (!gstin) {
      return { valid: false, error: 'GSTIN is required' };
    }

    const normalizedGstin = gstin.toUpperCase().trim();

    if (normalizedGstin.length !== 15) {
      return { valid: false, error: 'GSTIN must be exactly 15 characters' };
    }

    if (!this.GSTIN_REGEX.test(normalizedGstin)) {
      return {
        valid: false,
        error:
          'Invalid GSTIN format. Expected: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric',
      };
    }

    // Validate state code (01-37 are valid Indian state codes)
    const stateCode = parseInt(normalizedGstin.substring(0, 2), 10);
    if (stateCode < 1 || stateCode > 37) {
      return { valid: false, error: 'Invalid state code in GSTIN' };
    }

    // Validate checksum (15th character)
    if (!this.validateGSTChecksum(normalizedGstin)) {
      return { valid: false, error: 'Invalid GSTIN checksum' };
    }

    return { valid: true };
  }

  /**
   * Validates GSTIN checksum using the government's algorithm
   * Similar to Luhn algorithm but with different character mappings
   */
  private validateGSTChecksum(gstin: string): boolean {
    const charMapping: { [key: string]: number } = {
      '0': 0,
      '1': 1,
      '2': 2,
      '3': 3,
      '4': 4,
      '5': 5,
      '6': 6,
      '7': 7,
      '8': 8,
      '9': 9,
      A: 10,
      B: 11,
      C: 12,
      D: 13,
      E: 14,
      F: 15,
      G: 16,
      H: 17,
      I: 18,
      J: 19,
      K: 20,
      L: 21,
      M: 22,
      N: 23,
      O: 24,
      P: 25,
      Q: 26,
      R: 27,
      S: 28,
      T: 29,
      U: 30,
      V: 31,
      W: 32,
      X: 33,
      Y: 34,
      Z: 35,
    };

    const reverseMapping: { [key: number]: string } = {};
    for (const [key, value] of Object.entries(charMapping)) {
      reverseMapping[value] = key;
    }

    try {
      let sum = 0;
      for (let i = 0; i < 14; i++) {
        const char = gstin[i];
        const value = charMapping[char];
        if (value === undefined) return false;

        const factor = i % 2 === 0 ? 1 : 2;
        const product = value * factor;
        sum += Math.floor(product / 36) + (product % 36);
      }

      const checkDigit = (36 - (sum % 36)) % 36;
      const expectedChar = reverseMapping[checkDigit];

      return gstin[14] === expectedChar;
    } catch {
      return false;
    }
  }

  /**
   * Verifies GSTIN using Cashfree GST Verification API
   * API Documentation: https://docs.cashfree.com/docs/gst-verification
   */
  async verifyGST(gstin: string): Promise<GSTVerificationResult> {
    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new HttpException(
        'GST verification service is not configured. Please contact support.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      const response = await axios.post<CashfreeGSTResponse>(
        `${this.CASHFREE_BASE_URL}/verification/gst`,
        { gstin: gstin.toUpperCase() },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': clientId,
            'x-client-secret': clientSecret,
          },
          timeout: 30000, // 30 second timeout
        },
      );

      const data = response.data;

      return {
        status: data.status,
        gstin: data.gstin,
        legalName: data.legal_name,
        tradeName: data.trade_name,
        statusOfGstin: data.status_of_gstin,
        registrationDate: data.registration_date,
        address: data.address,
        stateJurisdiction: data.state_jurisdiction,
        natureOfBusiness: data.nature_of_business,
      };
    } catch (error: any) {
      // Handle specific Cashfree API errors
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;

        if (status === 401) {
          throw new HttpException(
            'GST verification service authentication failed',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }

        if (status === 400) {
          // Invalid GSTIN from API
          return {
            status: 'INVALID',
            gstin: gstin,
            legalName: '',
            statusOfGstin: 'Inactive',
          };
        }

        if (status === 422 || status === 404) {
          // GSTIN not found in government records
          return {
            status: 'INVALID',
            gstin: gstin,
            legalName: '',
            statusOfGstin: 'Inactive',
          };
        }

        console.error('Cashfree GST API error:', errorData);
      }

      // Network or other errors - throw to trigger manual review flag
      throw new Error('GST verification service temporarily unavailable');
    }
  }

  /**
   * Fuzzy matches company name against GST-registered names
   * Handles variations like:
   * - "ABC Private Limited" vs "ABC PVT LTD"
   * - "XYZ Industries LLP" vs "XYZ INDUSTRIES LIMITED LIABILITY PARTNERSHIP"
   * - Case differences
   * - Common abbreviations
   */
  matchCompanyName(
    enteredName: string,
    gstLegalName: string,
    gstTradeName?: string,
  ): boolean {
    const normalizeCompanyName = (name: string): string => {
      return (
        name
          .toUpperCase()
          .trim()
          // Replace common abbreviations
          .replace(/\bPRIVATE\b/g, 'PVT')
          .replace(/\bPVT\.?\b/g, 'PVT')
          .replace(/\bLIMITED\b/g, 'LTD')
          .replace(/\bLTD\.?\b/g, 'LTD')
          .replace(/\bLIMITED LIABILITY PARTNERSHIP\b/g, 'LLP')
          .replace(/\bINDIA\b/g, '')
          .replace(/\bINTERNATIONAL\b/g, 'INTL')
          .replace(/\bINTL\.?\b/g, 'INTL')
          .replace(/\bCOMPANY\b/g, 'CO')
          .replace(/\bCO\.?\b/g, 'CO')
          .replace(/\bCORPORATION\b/g, 'CORP')
          .replace(/\bCORP\.?\b/g, 'CORP')
          .replace(/\bINCORPORATED\b/g, 'INC')
          .replace(/\bINC\.?\b/g, 'INC')
          .replace(/\bENTERPRISES?\b/g, 'ENT')
          .replace(/\bINDUSTRIES\b/g, 'IND')
          .replace(/\bTRADING\b/g, 'TRDG')
          .replace(/\bEXPORTS?\b/g, 'EXP')
          .replace(/\bIMPORTS?\b/g, 'IMP')
          // Remove special characters and extra spaces
          .replace(/[^A-Z0-9\s]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
      );
    };

    const normalizedEntered = normalizeCompanyName(enteredName);
    const normalizedLegal = normalizeCompanyName(gstLegalName);
    const normalizedTrade = gstTradeName
      ? normalizeCompanyName(gstTradeName)
      : '';

    // Exact match after normalization
    if (
      normalizedEntered === normalizedLegal ||
      normalizedEntered === normalizedTrade
    ) {
      return true;
    }

    // Check if one contains the other (for partial matches)
    if (
      normalizedLegal.includes(normalizedEntered) ||
      normalizedEntered.includes(normalizedLegal)
    ) {
      return true;
    }

    if (
      normalizedTrade &&
      (normalizedTrade.includes(normalizedEntered) ||
        normalizedEntered.includes(normalizedTrade))
    ) {
      return true;
    }

    // Calculate similarity score using Levenshtein distance
    const similarityWithLegal = this.calculateSimilarity(
      normalizedEntered,
      normalizedLegal,
    );
    const similarityWithTrade = normalizedTrade
      ? this.calculateSimilarity(normalizedEntered, normalizedTrade)
      : 0;

    // Threshold: 80% similarity is acceptable
    const SIMILARITY_THRESHOLD = 0.8;

    return (
      similarityWithLegal >= SIMILARITY_THRESHOLD ||
      similarityWithTrade >= SIMILARITY_THRESHOLD
    );
  }

  /**
   * Calculates similarity between two strings using Levenshtein distance
   * Returns a value between 0 (completely different) and 1 (identical)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const maxLength = Math.max(str1.length, str2.length);
    const distance = this.levenshteinDistance(str1, str2);

    return 1 - distance / maxLength;
  }

  /**
   * Calculates Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;

    // Create distance matrix
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    // Initialize first row and column
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    // Fill in the rest of the matrix
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // Deletion
          dp[i][j - 1] + 1, // Insertion
          dp[i - 1][j - 1] + cost, // Substitution
        );
      }
    }

    return dp[m][n];
  }
}
