import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HSN } from '../../../products/schema/hsn.schema';
import {
  CreateHSNCodeDto,
  UpdateHSNCodeDto,
  GetHSNCodesQueryDto,
  BulkImportHSNDto,
} from '../dto';

export interface BulkImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; code?: string; error: string }>;
}

@Injectable()
export class HSNCodesService {
  constructor(
    @InjectModel(HSN.name)
    private readonly hsnModel: Model<HSN>,
  ) {}

  /**
   * Get HSN codes with filters and pagination
   */
  async getHSNCodes(query: GetHSNCodesQueryDto) {
    const filter: any = {};

    if (query.search) {
      filter.$or = [
        { hsn_code: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.category) {
      filter.category = { $regex: query.category, $options: 'i' };
    }

    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const [hsnCodes, total] = await Promise.all([
      this.hsnModel
        .find(filter)
        .sort({ hsn_code: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.hsnModel.countDocuments(filter),
    ]);

    // Transform to consistent format
    const transformed = hsnCodes.map((hsn) => ({
      _id: hsn._id,
      code: hsn.hsn_code,
      description: hsn.description,
      category: hsn.category,
    }));

    return {
      hsnCodes: transformed,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get HSN code by ID
   */
  async getHSNCodeById(id: string) {
    const hsn = await this.hsnModel.findById(id).lean();
    if (!hsn) {
      throw new NotFoundException('HSN code not found');
    }
    return {
      _id: hsn._id,
      code: hsn.hsn_code,
      description: hsn.description,
      category: hsn.category,
    };
  }

  /**
   * Get HSN code by code
   */
  async getHSNCodeByCode(code: string) {
    const hsn = await this.hsnModel.findOne({ hsn_code: code }).lean();
    if (!hsn) {
      throw new NotFoundException('HSN code not found');
    }
    return {
      _id: hsn._id,
      code: hsn.hsn_code,
      description: hsn.description,
      category: hsn.category,
    };
  }

  /**
   * Search HSN codes (for autocomplete)
   */
  async searchHSNCodes(query: string, limit: number = 20) {
    const filter = {
      $or: [
        { hsn_code: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
    };

    const hsnCodes = await this.hsnModel
      .find(filter)
      .sort({ hsn_code: 1 })
      .limit(limit)
      .lean();

    return hsnCodes.map((hsn) => ({
      _id: hsn._id,
      code: hsn.hsn_code,
      description: hsn.description,
      category: hsn.category,
    }));
  }

  /**
   * Create a new HSN code
   */
  async createHSNCode(dto: CreateHSNCodeDto) {
    // Check if code already exists
    const existing = await this.hsnModel.findOne({ hsn_code: dto.code });
    if (existing) {
      throw new ConflictException(`HSN code ${dto.code} already exists`);
    }

    const hsn = new this.hsnModel({
      hsn_code: dto.code,
      description: dto.description,
      category: dto.category || '',
    });
    await hsn.save();

    return {
      _id: hsn._id,
      code: hsn.hsn_code,
      description: hsn.description,
      category: hsn.category,
    };
  }

  /**
   * Update an existing HSN code
   */
  async updateHSNCode(id: string, dto: UpdateHSNCodeDto) {
    const hsn = await this.hsnModel.findById(id);
    if (!hsn) {
      throw new NotFoundException('HSN code not found');
    }

    if (dto.description !== undefined) {
      hsn.description = dto.description;
    }
    if (dto.category !== undefined) {
      hsn.category = dto.category;
    }

    await hsn.save();

    return {
      _id: hsn._id,
      code: hsn.hsn_code,
      description: hsn.description,
      category: hsn.category,
    };
  }

  /**
   * Delete an HSN code
   */
  async deleteHSNCode(id: string) {
    const hsn = await this.hsnModel.findByIdAndDelete(id);
    if (!hsn) {
      throw new NotFoundException('HSN code not found');
    }
    return { deleted: true };
  }

  /**
   * Bulk import HSN codes from parsed CSV data
   */
  async bulkImportHSNCodes(
    data: Array<{ code: string; description: string; category?: string }>,
    skipDuplicates: boolean = true,
  ): Promise<BulkImportResult> {
    const result: BulkImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 1; // 1-indexed for user display

      try {
        // Validate code
        if (!row.code || !/^\d+$/.test(row.code.trim())) {
          result.failed++;
          result.errors.push({
            row: rowNum,
            code: row.code,
            error: 'Invalid HSN code format (must be digits only)',
          });
          continue;
        }

        // Validate description
        if (!row.description || row.description.trim().length === 0) {
          result.failed++;
          result.errors.push({
            row: rowNum,
            code: row.code,
            error: 'Description is required',
          });
          continue;
        }

        const code = row.code.trim();
        const description = row.description.trim();
        const category = row.category?.trim() || '';

        // Check for duplicate
        const existing = await this.hsnModel.findOne({ hsn_code: code });
        if (existing) {
          if (skipDuplicates) {
            // Skip silently
            continue;
          } else {
            result.failed++;
            result.errors.push({
              row: rowNum,
              code,
              error: `HSN code ${code} already exists`,
            });
            continue;
          }
        }

        // Create new record
        await this.hsnModel.create({
          hsn_code: code,
          description,
          category,
        });
        result.success++;
      } catch (err: any) {
        result.failed++;
        result.errors.push({
          row: rowNum,
          code: row.code,
          error: err.message || 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Get statistics about HSN codes
   */
  async getStats() {
    const [total, byCategory] = await Promise.all([
      this.hsnModel.countDocuments(),
      this.hsnModel.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    return {
      total,
      byCategory: byCategory.map((c) => ({
        category: c._id || 'Uncategorized',
        count: c.count,
      })),
    };
  }

  /**
   * Get all unique categories
   */
  async getCategories() {
    const categories = await this.hsnModel.distinct('category');
    return categories.filter((c) => c && c.trim().length > 0).sort();
  }
}
