import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Unit types for categorization
 */
export const UNIT_TYPES = ['weight', 'volume', 'count', 'length', 'area'] as const;
export type UnitType = (typeof UNIT_TYPES)[number];

/**
 * Default units of measurement for seeding
 */
export const DEFAULT_UNITS = [
  // Weight units
  { code: 'MT', name: 'Metric Ton', pluralName: 'Metric Tons', symbol: 'MT', type: 'weight' as UnitType, baseUnit: 'KG', conversionFactor: 1000, isActive: true },
  { code: 'KG', name: 'Kilogram', pluralName: 'Kilograms', symbol: 'kg', type: 'weight' as UnitType, isActive: true },
  { code: 'G', name: 'Gram', pluralName: 'Grams', symbol: 'g', type: 'weight' as UnitType, baseUnit: 'KG', conversionFactor: 0.001, isActive: true },
  { code: 'LB', name: 'Pound', pluralName: 'Pounds', symbol: 'lb', type: 'weight' as UnitType, baseUnit: 'KG', conversionFactor: 0.453592, isActive: true },
  { code: 'OZ', name: 'Ounce', pluralName: 'Ounces', symbol: 'oz', type: 'weight' as UnitType, baseUnit: 'KG', conversionFactor: 0.0283495, isActive: true },
  { code: 'TON', name: 'Short Ton', pluralName: 'Short Tons', symbol: 'ton', type: 'weight' as UnitType, baseUnit: 'KG', conversionFactor: 907.185, isActive: true },
  { code: 'LT', name: 'Long Ton', pluralName: 'Long Tons', symbol: 'LT', type: 'weight' as UnitType, baseUnit: 'KG', conversionFactor: 1016.05, isActive: true },
  { code: 'QTL', name: 'Quintal', pluralName: 'Quintals', symbol: 'qtl', type: 'weight' as UnitType, baseUnit: 'KG', conversionFactor: 100, isActive: true },

  // Volume units
  { code: 'L', name: 'Liter', pluralName: 'Liters', symbol: 'L', type: 'volume' as UnitType, isActive: true },
  { code: 'ML', name: 'Milliliter', pluralName: 'Milliliters', symbol: 'mL', type: 'volume' as UnitType, baseUnit: 'L', conversionFactor: 0.001, isActive: true },
  { code: 'GAL', name: 'Gallon', pluralName: 'Gallons', symbol: 'gal', type: 'volume' as UnitType, baseUnit: 'L', conversionFactor: 3.78541, isActive: true },
  { code: 'BBL', name: 'Barrel', pluralName: 'Barrels', symbol: 'bbl', type: 'volume' as UnitType, baseUnit: 'L', conversionFactor: 158.987, isActive: true },
  { code: 'CBM', name: 'Cubic Meter', pluralName: 'Cubic Meters', symbol: 'm³', type: 'volume' as UnitType, baseUnit: 'L', conversionFactor: 1000, isActive: true },
  { code: 'CFT', name: 'Cubic Foot', pluralName: 'Cubic Feet', symbol: 'ft³', type: 'volume' as UnitType, baseUnit: 'L', conversionFactor: 28.3168, isActive: true },

  // Count units
  { code: 'PCS', name: 'Piece', pluralName: 'Pieces', symbol: 'pcs', type: 'count' as UnitType, isActive: true },
  { code: 'CTN', name: 'Carton', pluralName: 'Cartons', symbol: 'ctn', type: 'count' as UnitType, isActive: true },
  { code: 'PKG', name: 'Package', pluralName: 'Packages', symbol: 'pkg', type: 'count' as UnitType, isActive: true },
  { code: 'PAL', name: 'Pallet', pluralName: 'Pallets', symbol: 'pal', type: 'count' as UnitType, isActive: true },
  { code: 'BOX', name: 'Box', pluralName: 'Boxes', symbol: 'box', type: 'count' as UnitType, isActive: true },
  { code: 'BAG', name: 'Bag', pluralName: 'Bags', symbol: 'bag', type: 'count' as UnitType, isActive: true },
  { code: 'DZN', name: 'Dozen', pluralName: 'Dozens', symbol: 'dz', type: 'count' as UnitType, isActive: true },
  { code: 'SET', name: 'Set', pluralName: 'Sets', symbol: 'set', type: 'count' as UnitType, isActive: true },
  { code: 'CONT', name: 'Container', pluralName: 'Containers', symbol: 'cont', type: 'count' as UnitType, isActive: true },

  // Length units
  { code: 'M', name: 'Meter', pluralName: 'Meters', symbol: 'm', type: 'length' as UnitType, isActive: true },
  { code: 'CM', name: 'Centimeter', pluralName: 'Centimeters', symbol: 'cm', type: 'length' as UnitType, baseUnit: 'M', conversionFactor: 0.01, isActive: true },
  { code: 'FT', name: 'Foot', pluralName: 'Feet', symbol: 'ft', type: 'length' as UnitType, baseUnit: 'M', conversionFactor: 0.3048, isActive: true },
  { code: 'IN', name: 'Inch', pluralName: 'Inches', symbol: 'in', type: 'length' as UnitType, baseUnit: 'M', conversionFactor: 0.0254, isActive: true },
  { code: 'YD', name: 'Yard', pluralName: 'Yards', symbol: 'yd', type: 'length' as UnitType, baseUnit: 'M', conversionFactor: 0.9144, isActive: true },

  // Area units
  { code: 'SQM', name: 'Square Meter', pluralName: 'Square Meters', symbol: 'm²', type: 'area' as UnitType, isActive: true },
  { code: 'SQF', name: 'Square Foot', pluralName: 'Square Feet', symbol: 'ft²', type: 'area' as UnitType, baseUnit: 'SQM', conversionFactor: 0.092903, isActive: true },
  { code: 'HA', name: 'Hectare', pluralName: 'Hectares', symbol: 'ha', type: 'area' as UnitType, baseUnit: 'SQM', conversionFactor: 10000, isActive: true },
  { code: 'AC', name: 'Acre', pluralName: 'Acres', symbol: 'ac', type: 'area' as UnitType, baseUnit: 'SQM', conversionFactor: 4046.86, isActive: true },
];

@Schema({ timestamps: true, collection: 'units' })
export class Unit extends Document {
  /**
   * Short code for the unit (e.g., "MT", "KG", "LBS")
   */
  @Prop({ required: true, unique: true, uppercase: true, index: true })
  code: string;

  /**
   * Full singular name (e.g., "Metric Ton", "Kilogram")
   */
  @Prop({ required: true })
  name: string;

  /**
   * Plural form of the name (e.g., "Metric Tons", "Kilograms")
   */
  @Prop({ required: true })
  pluralName: string;

  /**
   * Display symbol (e.g., "MT", "kg", "lb")
   */
  @Prop({ required: true })
  symbol: string;

  /**
   * Type of measurement
   */
  @Prop({ required: true, enum: UNIT_TYPES, index: true })
  type: UnitType;

  /**
   * Reference unit code for conversion (e.g., "KG" for weight units)
   * If null, this is the base unit for its type
   */
  @Prop()
  baseUnit?: string;

  /**
   * Factor to convert this unit to the base unit
   * value_in_base_unit = value * conversionFactor
   */
  @Prop()
  conversionFactor?: number;

  /**
   * Whether this unit is active and visible in dropdowns
   */
  @Prop({ required: true, default: true, index: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const UnitSchema = SchemaFactory.createForClass(Unit);

// Indexes
UnitSchema.index({ type: 1, isActive: 1 });
