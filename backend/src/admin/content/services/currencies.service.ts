import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Currency } from '../schemas/currency.schema';
import {
  CreateCurrencyDto,
  UpdateCurrencyDto,
  GetCurrenciesQueryDto,
} from '../dto';

@Injectable()
export class CurrenciesService {
  constructor(
    @InjectModel(Currency.name)
    private readonly currencyModel: Model<Currency>,
  ) {}

  /**
   * Get all currencies with optional filters
   */
  async getCurrencies(query: GetCurrenciesQueryDto) {
    const filter: any = {};

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.search) {
      filter.$or = [
        { code: { $regex: query.search, $options: 'i' } },
        { name: { $regex: query.search, $options: 'i' } },
      ];
    }

    const currencies = await this.currencyModel
      .find(filter)
      .sort({ code: 1 })
      .lean();

    return {
      currencies,
      total: currencies.length,
    };
  }

  /**
   * Get currency by ID
   */
  async getCurrencyById(id: string) {
    const currency = await this.currencyModel.findById(id).lean();
    if (!currency) {
      throw new NotFoundException('Currency not found');
    }
    return currency;
  }

  /**
   * Get currency by code
   */
  async getCurrencyByCode(code: string) {
    const currency = await this.currencyModel
      .findOne({ code: code.toUpperCase() })
      .lean();
    if (!currency) {
      throw new NotFoundException('Currency not found');
    }
    return currency;
  }

  /**
   * Create a new currency
   */
  async createCurrency(dto: CreateCurrencyDto) {
    // Check if code already exists
    const existing = await this.currencyModel.findOne({
      code: dto.code.toUpperCase(),
    });
    if (existing) {
      throw new ConflictException(
        `Currency with code ${dto.code} already exists`,
      );
    }

    const currency = new this.currencyModel({
      ...dto,
      code: dto.code.toUpperCase(),
    });
    await currency.save();
    return currency.toObject();
  }

  /**
   * Update an existing currency
   */
  async updateCurrency(id: string, dto: UpdateCurrencyDto) {
    const currency = await this.currencyModel.findById(id);
    if (!currency) {
      throw new NotFoundException('Currency not found');
    }

    Object.assign(currency, dto);
    await currency.save();
    return currency.toObject();
  }

  /**
   * Delete a currency
   */
  async deleteCurrency(id: string) {
    const currency = await this.currencyModel.findByIdAndDelete(id);
    if (!currency) {
      throw new NotFoundException('Currency not found');
    }
    return { deleted: true };
  }

  /**
   * Seed default currencies
   */
  async seedDefaultCurrencies() {
    const defaultCurrencies = [
      { code: 'USD', name: 'US Dollar', symbol: '$', symbolPosition: 'before', decimalPlaces: 2 },
      { code: 'EUR', name: 'Euro', symbol: '€', symbolPosition: 'before', decimalPlaces: 2 },
      { code: 'GBP', name: 'British Pound', symbol: '£', symbolPosition: 'before', decimalPlaces: 2 },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹', symbolPosition: 'before', decimalPlaces: 2 },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥', symbolPosition: 'before', decimalPlaces: 0 },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', symbolPosition: 'before', decimalPlaces: 2 },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', symbolPosition: 'before', decimalPlaces: 2 },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', symbolPosition: 'before', decimalPlaces: 2 },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', symbolPosition: 'before', decimalPlaces: 2 },
      { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', symbolPosition: 'before', decimalPlaces: 2 },
      { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', symbolPosition: 'after', decimalPlaces: 2 },
      { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', symbolPosition: 'after', decimalPlaces: 2 },
      { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', symbolPosition: 'before', decimalPlaces: 2 },
      { code: 'MXN', name: 'Mexican Peso', symbol: '$', symbolPosition: 'before', decimalPlaces: 2 },
      { code: 'ZAR', name: 'South African Rand', symbol: 'R', symbolPosition: 'before', decimalPlaces: 2 },
    ];

    let created = 0;
    let skipped = 0;

    for (const currency of defaultCurrencies) {
      const exists = await this.currencyModel.findOne({ code: currency.code });
      if (!exists) {
        await this.currencyModel.create({ ...currency, isActive: true });
        created++;
      } else {
        skipped++;
      }
    }

    return { created, skipped, total: defaultCurrencies.length };
  }
}
