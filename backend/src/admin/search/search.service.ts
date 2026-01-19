import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

interface SearchResult {
  type: 'user' | 'company' | 'trade' | 'product';
  id: string;
  title: string;
  subtitle: string;
  url: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectModel('User') private userModel: Model<any>,
    @InjectModel('Company') private companyModel: Model<any>,
    @InjectModel('Trade') private tradeModel: Model<any>,
    @InjectModel('Product') private productModel: Model<any>,
  ) {}

  async globalSearch(
    query: string,
    limit: number = 10,
    types?: ('user' | 'company' | 'trade' | 'product')[],
  ): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchRegex = new RegExp(query.trim(), 'i');
    const results: SearchResult[] = [];
    const perTypeLimit = Math.ceil(limit / 4);

    const searchTypes = types || ['user', 'company', 'trade', 'product'];

    const searchPromises: Promise<SearchResult[]>[] = [];

    if (searchTypes.includes('user')) {
      searchPromises.push(this.searchUsers(searchRegex, perTypeLimit));
    }

    if (searchTypes.includes('company')) {
      searchPromises.push(this.searchCompanies(searchRegex, perTypeLimit));
    }

    if (searchTypes.includes('trade')) {
      searchPromises.push(this.searchTrades(searchRegex, perTypeLimit));
    }

    if (searchTypes.includes('product')) {
      searchPromises.push(this.searchProducts(searchRegex, perTypeLimit));
    }

    const allResults = await Promise.all(searchPromises);

    // Flatten and interleave results
    for (const typeResults of allResults) {
      results.push(...typeResults);
    }

    // Sort by relevance (exact matches first) and limit
    return results
      .sort((a, b) => {
        const aExact = a.title.toLowerCase().includes(query.toLowerCase()) ? 0 : 1;
        const bExact = b.title.toLowerCase().includes(query.toLowerCase()) ? 0 : 1;
        return aExact - bExact;
      })
      .slice(0, limit);
  }

  private async searchUsers(searchRegex: RegExp, limit: number): Promise<SearchResult[]> {
    try {
      const users = await this.userModel
        .find({
          $or: [
            { email: searchRegex },
            { firstName: searchRegex },
            { lastName: searchRegex },
          ],
        })
        .select('_id email firstName lastName role createdAt')
        .limit(limit)
        .exec();

      return users.map((user) => ({
        type: 'user' as const,
        id: user._id.toString(),
        title: user.email,
        subtitle: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.role || 'User',
        url: `/users/${user._id}`,
        metadata: {
          role: user.role,
          createdAt: user.createdAt,
        },
      }));
    } catch (error) {
      this.logger.error(`User search error: ${error.message}`);
      return [];
    }
  }

  private async searchCompanies(searchRegex: RegExp, limit: number): Promise<SearchResult[]> {
    try {
      const companies = await this.companyModel
        .find({
          $or: [
            { companyName: searchRegex },
            { email: searchRegex },
            { registrationNumber: searchRegex },
          ],
        })
        .select('_id companyName email country isVerified createdAt')
        .limit(limit)
        .exec();

      return companies.map((company) => ({
        type: 'company' as const,
        id: company._id.toString(),
        title: company.companyName,
        subtitle: company.email,
        url: `/companies/${company._id}`,
        metadata: {
          country: company.country,
          isVerified: company.isVerified,
          createdAt: company.createdAt,
        },
      }));
    } catch (error) {
      this.logger.error(`Company search error: ${error.message}`);
      return [];
    }
  }

  private async searchTrades(searchRegex: RegExp, limit: number): Promise<SearchResult[]> {
    try {
      const trades = await this.tradeModel
        .find({
          $or: [
            { tradeId: searchRegex },
            { productName: searchRegex },
          ],
        })
        .select('_id tradeId productName status quantity createdAt')
        .limit(limit)
        .exec();

      return trades.map((trade) => ({
        type: 'trade' as const,
        id: trade._id.toString(),
        title: trade.tradeId || `Trade ${trade._id}`,
        subtitle: `${trade.productName || 'Product'} - ${trade.status}`,
        url: `/trades/${trade._id}`,
        metadata: {
          status: trade.status,
          quantity: trade.quantity,
          createdAt: trade.createdAt,
        },
      }));
    } catch (error) {
      this.logger.error(`Trade search error: ${error.message}`);
      return [];
    }
  }

  private async searchProducts(searchRegex: RegExp, limit: number): Promise<SearchResult[]> {
    try {
      const products = await this.productModel
        .find({
          $or: [
            { name: searchRegex },
            { hsnCode: searchRegex },
            { category: searchRegex },
          ],
        })
        .select('_id name hsnCode category pricePerUnit createdAt')
        .limit(limit)
        .exec();

      return products.map((product) => ({
        type: 'product' as const,
        id: product._id.toString(),
        title: product.name,
        subtitle: product.category || product.hsnCode || 'Product',
        url: `/products/${product._id}`,
        metadata: {
          hsnCode: product.hsnCode,
          category: product.category,
          pricePerUnit: product.pricePerUnit,
          createdAt: product.createdAt,
        },
      }));
    } catch (error) {
      this.logger.error(`Product search error: ${error.message}`);
      return [];
    }
  }

  async getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchRegex = new RegExp(`^${query.trim()}`, 'i');
    const suggestions: string[] = [];

    try {
      // Get user email suggestions
      const users = await this.userModel
        .find({ email: searchRegex })
        .select('email')
        .limit(limit)
        .exec();
      suggestions.push(...users.map((u) => u.email));

      // Get company name suggestions
      const companies = await this.companyModel
        .find({ companyName: searchRegex })
        .select('companyName')
        .limit(limit)
        .exec();
      suggestions.push(...companies.map((c) => c.companyName));

      // Get product name suggestions
      const products = await this.productModel
        .find({ name: searchRegex })
        .select('name')
        .limit(limit)
        .exec();
      suggestions.push(...products.map((p) => p.name));

      // Return unique suggestions
      return [...new Set(suggestions)].slice(0, limit);
    } catch (error) {
      this.logger.error(`Search suggestions error: ${error.message}`);
      return [];
    }
  }
}
