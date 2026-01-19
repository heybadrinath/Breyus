import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Country } from '../schemas/country.schema';
import {
  CreateCountryDto,
  UpdateCountryDto,
  GetCountriesQueryDto,
} from '../dto';

@Injectable()
export class CountriesService {
  constructor(
    @InjectModel(Country.name)
    private readonly countryModel: Model<Country>,
  ) {}

  /**
   * Get all countries with optional filters
   */
  async getCountries(query: GetCountriesQueryDto) {
    const filter: any = {};

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.continent) {
      filter.continent = query.continent;
    }

    if (query.search) {
      filter.$or = [
        { isoCode: { $regex: query.search, $options: 'i' } },
        { isoCode3: { $regex: query.search, $options: 'i' } },
        { name: { $regex: query.search, $options: 'i' } },
      ];
    }

    const countries = await this.countryModel
      .find(filter)
      .sort({ name: 1 })
      .lean();

    return {
      countries,
      total: countries.length,
    };
  }

  /**
   * Get country by ID
   */
  async getCountryById(id: string) {
    const country = await this.countryModel.findById(id).lean();
    if (!country) {
      throw new NotFoundException('Country not found');
    }
    return country;
  }

  /**
   * Get country by ISO code
   */
  async getCountryByCode(isoCode: string) {
    const country = await this.countryModel
      .findOne({ isoCode: isoCode.toUpperCase() })
      .lean();
    if (!country) {
      throw new NotFoundException('Country not found');
    }
    return country;
  }

  /**
   * Create a new country
   */
  async createCountry(dto: CreateCountryDto) {
    // Check if code already exists
    const existing = await this.countryModel.findOne({
      $or: [
        { isoCode: dto.isoCode.toUpperCase() },
        { isoCode3: dto.isoCode3.toUpperCase() },
      ],
    });
    if (existing) {
      throw new ConflictException('Country with this ISO code already exists');
    }

    const country = new this.countryModel({
      ...dto,
      isoCode: dto.isoCode.toUpperCase(),
      isoCode3: dto.isoCode3.toUpperCase(),
    });
    await country.save();
    return country.toObject();
  }

  /**
   * Update an existing country
   */
  async updateCountry(id: string, dto: UpdateCountryDto) {
    const country = await this.countryModel.findById(id);
    if (!country) {
      throw new NotFoundException('Country not found');
    }

    Object.assign(country, dto);
    await country.save();
    return country.toObject();
  }

  /**
   * Delete a country
   */
  async deleteCountry(id: string) {
    const country = await this.countryModel.findByIdAndDelete(id);
    if (!country) {
      throw new NotFoundException('Country not found');
    }
    return { deleted: true };
  }

  /**
   * Seed default countries
   */
  async seedDefaultCountries() {
    const defaultCountries = [
      // North America
      { isoCode: 'US', isoCode3: 'USA', name: 'United States', flagEmoji: '🇺🇸', continent: 'North America' },
      { isoCode: 'CA', isoCode3: 'CAN', name: 'Canada', flagEmoji: '🇨🇦', continent: 'North America' },
      { isoCode: 'MX', isoCode3: 'MEX', name: 'Mexico', flagEmoji: '🇲🇽', continent: 'North America' },

      // Europe
      { isoCode: 'GB', isoCode3: 'GBR', name: 'United Kingdom', flagEmoji: '🇬🇧', continent: 'Europe' },
      { isoCode: 'DE', isoCode3: 'DEU', name: 'Germany', flagEmoji: '🇩🇪', continent: 'Europe' },
      { isoCode: 'FR', isoCode3: 'FRA', name: 'France', flagEmoji: '🇫🇷', continent: 'Europe' },
      { isoCode: 'IT', isoCode3: 'ITA', name: 'Italy', flagEmoji: '🇮🇹', continent: 'Europe' },
      { isoCode: 'ES', isoCode3: 'ESP', name: 'Spain', flagEmoji: '🇪🇸', continent: 'Europe' },
      { isoCode: 'NL', isoCode3: 'NLD', name: 'Netherlands', flagEmoji: '🇳🇱', continent: 'Europe' },
      { isoCode: 'CH', isoCode3: 'CHE', name: 'Switzerland', flagEmoji: '🇨🇭', continent: 'Europe' },

      // Asia
      { isoCode: 'IN', isoCode3: 'IND', name: 'India', flagEmoji: '🇮🇳', continent: 'Asia' },
      { isoCode: 'CN', isoCode3: 'CHN', name: 'China', flagEmoji: '🇨🇳', continent: 'Asia' },
      { isoCode: 'JP', isoCode3: 'JPN', name: 'Japan', flagEmoji: '🇯🇵', continent: 'Asia' },
      { isoCode: 'KR', isoCode3: 'KOR', name: 'South Korea', flagEmoji: '🇰🇷', continent: 'Asia' },
      { isoCode: 'SG', isoCode3: 'SGP', name: 'Singapore', flagEmoji: '🇸🇬', continent: 'Asia' },
      { isoCode: 'AE', isoCode3: 'ARE', name: 'United Arab Emirates', flagEmoji: '🇦🇪', continent: 'Asia' },
      { isoCode: 'SA', isoCode3: 'SAU', name: 'Saudi Arabia', flagEmoji: '🇸🇦', continent: 'Asia' },
      { isoCode: 'TH', isoCode3: 'THA', name: 'Thailand', flagEmoji: '🇹🇭', continent: 'Asia' },
      { isoCode: 'VN', isoCode3: 'VNM', name: 'Vietnam', flagEmoji: '🇻🇳', continent: 'Asia' },
      { isoCode: 'ID', isoCode3: 'IDN', name: 'Indonesia', flagEmoji: '🇮🇩', continent: 'Asia' },
      { isoCode: 'MY', isoCode3: 'MYS', name: 'Malaysia', flagEmoji: '🇲🇾', continent: 'Asia' },
      { isoCode: 'PH', isoCode3: 'PHL', name: 'Philippines', flagEmoji: '🇵🇭', continent: 'Asia' },

      // South America
      { isoCode: 'BR', isoCode3: 'BRA', name: 'Brazil', flagEmoji: '🇧🇷', continent: 'South America' },
      { isoCode: 'AR', isoCode3: 'ARG', name: 'Argentina', flagEmoji: '🇦🇷', continent: 'South America' },
      { isoCode: 'CL', isoCode3: 'CHL', name: 'Chile', flagEmoji: '🇨🇱', continent: 'South America' },
      { isoCode: 'CO', isoCode3: 'COL', name: 'Colombia', flagEmoji: '🇨🇴', continent: 'South America' },
      { isoCode: 'PE', isoCode3: 'PER', name: 'Peru', flagEmoji: '🇵🇪', continent: 'South America' },

      // Africa
      { isoCode: 'ZA', isoCode3: 'ZAF', name: 'South Africa', flagEmoji: '🇿🇦', continent: 'Africa' },
      { isoCode: 'NG', isoCode3: 'NGA', name: 'Nigeria', flagEmoji: '🇳🇬', continent: 'Africa' },
      { isoCode: 'EG', isoCode3: 'EGY', name: 'Egypt', flagEmoji: '🇪🇬', continent: 'Africa' },
      { isoCode: 'KE', isoCode3: 'KEN', name: 'Kenya', flagEmoji: '🇰🇪', continent: 'Africa' },
      { isoCode: 'MA', isoCode3: 'MAR', name: 'Morocco', flagEmoji: '🇲🇦', continent: 'Africa' },

      // Oceania
      { isoCode: 'AU', isoCode3: 'AUS', name: 'Australia', flagEmoji: '🇦🇺', continent: 'Oceania' },
      { isoCode: 'NZ', isoCode3: 'NZL', name: 'New Zealand', flagEmoji: '🇳🇿', continent: 'Oceania' },
    ];

    let created = 0;
    let skipped = 0;

    for (const country of defaultCountries) {
      const exists = await this.countryModel.findOne({ isoCode: country.isoCode });
      if (!exists) {
        await this.countryModel.create({ ...country, isActive: true });
        created++;
      } else {
        skipped++;
      }
    }

    return { created, skipped, total: defaultCountries.length };
  }
}
