import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/user.schema';
import { Company } from '../company/company.schema';
import { AIPartner } from './interfaces';
import { EnrichedPartner } from './interfaces/merged-result.interface';

/**
 * Platform Awareness Service
 * Checks if companies/users from AI results exist on the Breyus platform
 */
@Injectable()
export class PlatformAwarenessService {
  private readonly logger = new Logger(PlatformAwarenessService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Company.name) private companyModel: Model<Company>,
  ) {}

  /**
   * Enrich AI partners with platform awareness
   * Checks if each AI result exists on the Breyus platform
   */
  async enrichPartners(partners: AIPartner[]): Promise<EnrichedPartner[]> {
    const enrichedPartners = await Promise.all(
      partners.map(async (partner) => {
        const platformMatch = await this.findPlatformMatch(partner);

        // Normalize match score (AI may return 0-1 or 0-100)
        let normalizedScore = partner.match_score || 0;
        if (normalizedScore > 0 && normalizedScore <= 1) {
          normalizedScore = normalizedScore * 100;
        }
        normalizedScore = Math.min(100, Math.max(0, Math.round(normalizedScore)));

        // Parse price fluctuation from AI (format: "+5%" or "-3%" or "5%")
        const priceFluctuation = this.parsePriceFluctuation(
          partner.price_fluctuation,
        );

        const enriched: EnrichedPartner = {
          resultType: 'partner', // Discriminant for type narrowing
          id: partner.id,
          name: partner.name,
          matchScore: normalizedScore,
          matchReason: partner.match_reason,
          commodity: partner.commodity,
          country: partner.country,
          contactInfo: partner.contact_info
            ? {
                email: partner.contact_info.email,
                phone: partner.contact_info.phone,
                address: partner.contact_info.address,
              }
            : undefined,
          isOnPlatform: !!platformMatch,
          platformCompanyId: platformMatch?.companyId,
          platformUserId: platformMatch?.userId,
          sourceType: platformMatch ? 'platform_and_ai' : 'ai_only',
          // Use AI-provided values when available, otherwise calculate
          probability: this.calculateProbability(
            normalizedScore,
            !!platformMatch,
          ),
          riskLevel: this.parseRiskLevel(partner.risk_level) ||
            this.calculateRiskLevel(normalizedScore),
          priceFluctuation: priceFluctuation,
        };

        return enriched;
      }),
    );

    this.logger.log(
      `Enriched ${partners.length} partners: ${enrichedPartners.filter((p) => p.isOnPlatform).length} on platform`,
    );

    return enrichedPartners;
  }

  /**
   * Find if a partner exists on the Breyus platform
   * Priority: email > phone > company name (fuzzy)
   */
  private async findPlatformMatch(
    partner: AIPartner,
  ): Promise<{ companyId: string; userId: string } | null> {
    try {
      // 1. Try exact email match (User model uses 'mail' field)
      if (partner.contact_info?.email) {
        const userByEmail = (await this.userModel
          .findOne({
            mail: partner.contact_info.email.toLowerCase(),
          })
          .select('_id company')) as any;

        if (userByEmail) {
          return {
            userId: userByEmail._id.toString(),
            companyId: userByEmail.company?.toString() || '',
          };
        }
      }

      // 2. Try phone match (normalize phone number)
      if (partner.contact_info?.phone) {
        const normalizedPhone = this.normalizePhone(partner.contact_info.phone);

        const companyByPhone = (await this.companyModel
          .findOne({
            companyMobile: { $regex: normalizedPhone, $options: 'i' },
          })
          .lean()) as any;

        if (companyByPhone) {
          // Find the user associated with this company
          const userForCompany = (await this.userModel
            .findOne({ company: companyByPhone._id })
            .select('_id')
            .lean()) as any;
          // Only return match if we found both company AND user
          // A company without a user can't be contacted via platform
          if (userForCompany?._id) {
            return {
              companyId: companyByPhone._id.toString(),
              userId: userForCompany._id.toString(),
            };
          }
          // Log warning if company has no user (orphaned company)
          this.logger.warn(
            `Company ${companyByPhone._id} found but has no associated user`,
          );
        }
      }

      // 3. Try fuzzy company name match
      if (partner.name) {
        const normalizedName = this.normalizeCompanyName(partner.name);

        // First try exact match
        let company = (await this.companyModel
          .findOne({
            companyName: {
              $regex: `^${this.escapeRegex(normalizedName)}$`,
              $options: 'i',
            },
          })
          .lean()) as any;

        // If no exact match, try contains match
        if (!company) {
          company = (await this.companyModel
            .findOne({
              companyName: {
                $regex: this.escapeRegex(normalizedName),
                $options: 'i',
              },
            })
            .lean()) as any;
        }

        if (company) {
          // Find the user associated with this company
          const userForCompany = (await this.userModel
            .findOne({ company: company._id })
            .select('_id')
            .lean()) as any;
          // Only return match if we found both company AND user
          if (userForCompany?._id) {
            return {
              companyId: company._id.toString(),
              userId: userForCompany._id.toString(),
            };
          }
          // Log warning if company has no user (orphaned company)
          this.logger.warn(
            `Company ${company._id} found but has no associated user`,
          );
        }
      }

      return null;
    } catch (error) {
      this.logger.warn(
        `Failed to find platform match for ${partner.name}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Batch lookup for multiple company names
   * More efficient for checking many companies at once
   */
  async batchCheckPlatformPresence(
    companyNames: string[],
  ): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    // Normalize all names
    const normalizedNames = companyNames.map((name) => ({
      original: name,
      normalized: this.normalizeCompanyName(name),
    }));

    // Build regex pattern for batch query
    const patterns = normalizedNames.map((n) => this.escapeRegex(n.normalized));
    const regexPattern = patterns.join('|');

    // Single query for all companies
    const matches = await this.companyModel
      .find({
        companyName: { $regex: regexPattern, $options: 'i' },
      })
      .select('companyName');

    const matchedNames = new Set(
      matches.map((m) => this.normalizeCompanyName(m.companyName)),
    );

    // Check each original name against matches
    normalizedNames.forEach(({ original, normalized }) => {
      results.set(original, matchedNames.has(normalized));
    });

    return results;
  }

  /**
   * Calculate buying/selling probability based on match score and platform presence
   */
  private calculateProbability(
    matchScore: number,
    isOnPlatform: boolean,
  ): number {
    // Base probability from AI match score (0-100)
    let probability = Math.min(100, Math.max(0, matchScore));

    // Boost if on platform (proven entity)
    if (isOnPlatform) {
      probability = Math.min(100, probability + 15);
    }

    return Math.round(probability);
  }

  /**
   * Calculate risk level based on match score
   */
  private calculateRiskLevel(matchScore: number): EnrichedPartner['riskLevel'] {
    if (matchScore >= 90) return 'Very Low';
    if (matchScore >= 75) return 'Low';
    if (matchScore >= 50) return 'Medium';
    if (matchScore >= 25) return 'High';
    return 'Very High';
  }

  /**
   * Parse AI-provided risk level string to our enum
   */
  private parseRiskLevel(
    riskLevel?: string,
  ): EnrichedPartner['riskLevel'] | null {
    if (!riskLevel) return null;

    const normalized = riskLevel.toLowerCase().trim();

    // Map various AI response formats to our enum
    if (normalized.includes('very low') || normalized === 'minimal') {
      return 'Very Low';
    }
    if (normalized === 'low' || normalized.includes('low risk')) {
      return 'Low';
    }
    if (normalized === 'medium' || normalized === 'moderate') {
      return 'Medium';
    }
    if (normalized === 'high' && !normalized.includes('very')) {
      return 'High';
    }
    if (normalized.includes('very high') || normalized === 'critical') {
      return 'Very High';
    }

    return null; // Unknown format, will fall back to calculated
  }

  /**
   * Parse price fluctuation from AI (can be string like "+5%", "-3%", "5%" or a number)
   * Returns a number where positive = price increase, negative = price decrease
   */
  private parsePriceFluctuation(fluctuation?: string | number): number | undefined {
    if (fluctuation === undefined || fluctuation === null) return undefined;

    // If it's already a number, return it directly
    if (typeof fluctuation === 'number') {
      return isNaN(fluctuation) ? undefined : fluctuation;
    }

    // If it's not a string either, return undefined
    if (typeof fluctuation !== 'string') {
      return undefined;
    }

    // Extract number from string like "+5%", "-3%", "5%", "up 5%", "down 3%"
    const normalized = fluctuation.toLowerCase().trim();

    // Try to extract the numeric value
    const match = normalized.match(/([+-]?\d+(?:\.\d+)?)/);
    if (!match) return undefined;

    let value = parseFloat(match[1]);

    // Determine direction from string context
    if (normalized.includes('-') || normalized.includes('down') || normalized.includes('decrease')) {
      value = -Math.abs(value);
    } else if (normalized.includes('+') || normalized.includes('up') || normalized.includes('increase')) {
      value = Math.abs(value);
    }

    return value;
  }

  /**
   * Normalize phone number for comparison
   */
  private normalizePhone(phone: string): string {
    // Remove all non-digit characters except + at the start
    return phone.replace(/[^\d+]/g, '').replace(/^\+/, '');
  }

  /**
   * Normalize company name for comparison
   */
  private normalizeCompanyName(name: string): string {
    return (
      name
        .toLowerCase()
        .trim()
        // Remove common suffixes
        .replace(
          /\s*(pvt\.?\s*ltd\.?|private\s*limited|ltd\.?|llc|inc\.?|corp\.?|co\.?)\s*$/i,
          '',
        )
        // Remove extra whitespace
        .replace(/\s+/g, ' ')
        .trim()
    );
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
