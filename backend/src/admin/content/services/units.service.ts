import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Unit, DEFAULT_UNITS, UNIT_TYPES, UnitType } from '../schemas/unit.schema';
import {
  CreateUnitDto,
  UpdateUnitDto,
  GetUnitsQueryDto,
} from '../dto';

@Injectable()
export class UnitsService {
  private readonly logger = new Logger(UnitsService.name);

  constructor(
    @InjectModel(Unit.name)
    private readonly unitModel: Model<Unit>,
  ) {}

  /**
   * Get units with optional filters
   */
  async getUnits(query: GetUnitsQueryDto) {
    const filter: any = {};

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.type) {
      filter.type = query.type;
    }

    if (query.search) {
      filter.$or = [
        { code: { $regex: query.search, $options: 'i' } },
        { name: { $regex: query.search, $options: 'i' } },
        { symbol: { $regex: query.search, $options: 'i' } },
      ];
    }

    const units = await this.unitModel
      .find(filter)
      .sort({ type: 1, name: 1 })
      .lean();

    return {
      units,
      total: units.length,
    };
  }

  /**
   * Get unit by ID
   */
  async getUnitById(id: string) {
    const unit = await this.unitModel.findById(id).lean();
    if (!unit) {
      throw new NotFoundException(`Unit with ID ${id} not found`);
    }
    return unit;
  }

  /**
   * Get unit by code
   */
  async getUnitByCode(code: string) {
    const unit = await this.unitModel.findOne({ code: code.toUpperCase() }).lean();
    if (!unit) {
      throw new NotFoundException(`Unit with code ${code} not found`);
    }
    return unit;
  }

  /**
   * Create a new unit
   */
  async createUnit(dto: CreateUnitDto) {
    const code = dto.code.toUpperCase();

    // Check for existing code
    const existing = await this.unitModel.findOne({ code });
    if (existing) {
      throw new ConflictException(`Unit with code "${code}" already exists`);
    }

    const unit = new this.unitModel({
      ...dto,
      code,
    });

    await unit.save();
    return unit.toObject();
  }

  /**
   * Update an existing unit
   */
  async updateUnit(id: string, dto: UpdateUnitDto) {
    const unit = await this.unitModel.findById(id);
    if (!unit) {
      throw new NotFoundException(`Unit with ID ${id} not found`);
    }

    // Update fields
    Object.assign(unit, dto);
    await unit.save();

    return unit.toObject();
  }

  /**
   * Delete a unit
   */
  async deleteUnit(id: string) {
    const unit = await this.unitModel.findByIdAndDelete(id);
    if (!unit) {
      throw new NotFoundException(`Unit with ID ${id} not found`);
    }
    return { deleted: true };
  }

  /**
   * Get available unit types
   */
  getUnitTypes() {
    return UNIT_TYPES;
  }

  /**
   * Get units grouped by type
   */
  async getUnitsGrouped() {
    const units = await this.unitModel
      .find({ isActive: true })
      .sort({ type: 1, name: 1 })
      .lean();

    // Group by type
    const grouped: Record<UnitType, any[]> = {
      weight: [],
      volume: [],
      count: [],
      length: [],
      area: [],
    };

    for (const unit of units) {
      if (grouped[unit.type]) {
        grouped[unit.type].push(unit);
      }
    }

    return grouped;
  }

  /**
   * Get statistics about units
   */
  async getStats() {
    const [total, active, inactive] = await Promise.all([
      this.unitModel.countDocuments(),
      this.unitModel.countDocuments({ isActive: true }),
      this.unitModel.countDocuments({ isActive: false }),
    ]);

    // Count by type
    const byType = await this.unitModel.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: ['$isActive', 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      total,
      active,
      inactive,
      byType,
    };
  }

  /**
   * Convert a value from one unit to another (same type only)
   */
  async convert(value: number, fromCode: string, toCode: string): Promise<number | null> {
    const fromUnit = await this.unitModel.findOne({ code: fromCode.toUpperCase() }).lean();
    const toUnit = await this.unitModel.findOne({ code: toCode.toUpperCase() }).lean();

    if (!fromUnit || !toUnit) {
      return null;
    }

    // Must be same type
    if (fromUnit.type !== toUnit.type) {
      return null;
    }

    // Convert to base unit first, then to target
    let valueInBase = value;
    if (fromUnit.conversionFactor) {
      valueInBase = value * fromUnit.conversionFactor;
    }

    let result = valueInBase;
    if (toUnit.conversionFactor) {
      result = valueInBase / toUnit.conversionFactor;
    }

    return result;
  }

  /**
   * Seed default units
   */
  async seedDefaultUnits() {
    let created = 0;
    let skipped = 0;

    for (const unitData of DEFAULT_UNITS) {
      const existing = await this.unitModel.findOne({ code: unitData.code });

      if (existing) {
        skipped++;
        continue;
      }

      await this.unitModel.create(unitData);
      created++;
    }

    this.logger.log(`Seeded units: ${created} created, ${skipped} skipped`);

    return {
      created,
      skipped,
      total: DEFAULT_UNITS.length,
    };
  }
}
