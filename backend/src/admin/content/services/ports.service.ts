import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Port } from '../schemas/port.schema';
import { Country } from '../schemas/country.schema';
import { CreatePortDto, UpdatePortDto, GetPortsQueryDto } from '../dto';

@Injectable()
export class PortsService {
  constructor(
    @InjectModel(Port.name)
    private readonly portModel: Model<Port>,
    @InjectModel(Country.name)
    private readonly countryModel: Model<Country>,
  ) {}

  /**
   * Get ports with optional filters and pagination
   */
  async getPorts(query: GetPortsQueryDto) {
    const filter: any = {};

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.country) {
      filter.country = new Types.ObjectId(query.country);
    }

    if (query.type) {
      filter.type = query.type;
    }

    if (query.search) {
      filter.$or = [
        { code: { $regex: query.search, $options: 'i' } },
        { name: { $regex: query.search, $options: 'i' } },
        { city: { $regex: query.search, $options: 'i' } },
      ];
    }

    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const [ports, total] = await Promise.all([
      this.portModel
        .find(filter)
        .populate('country', 'isoCode isoCode3 name flagEmoji')
        .sort({ code: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.portModel.countDocuments(filter),
    ]);

    return {
      ports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get port by ID
   */
  async getPortById(id: string) {
    const port = await this.portModel
      .findById(id)
      .populate('country', 'isoCode isoCode3 name flagEmoji')
      .lean();
    if (!port) {
      throw new NotFoundException('Port not found');
    }
    return port;
  }

  /**
   * Get port by code
   */
  async getPortByCode(code: string) {
    const port = await this.portModel
      .findOne({ code: code.toUpperCase() })
      .populate('country', 'isoCode isoCode3 name flagEmoji')
      .lean();
    if (!port) {
      throw new NotFoundException('Port not found');
    }
    return port;
  }

  /**
   * Get ports by country
   */
  async getPortsByCountry(countryId: string) {
    const ports = await this.portModel
      .find({ country: new Types.ObjectId(countryId), isActive: true })
      .sort({ name: 1 })
      .lean();
    return { ports, total: ports.length };
  }

  /**
   * Create a new port
   */
  async createPort(dto: CreatePortDto) {
    // Verify country exists
    const country = await this.countryModel.findById(dto.country);
    if (!country) {
      throw new BadRequestException('Country not found');
    }

    // Check if code already exists
    const existing = await this.portModel.findOne({
      code: dto.code.toUpperCase(),
    });
    if (existing) {
      throw new ConflictException(`Port with code ${dto.code} already exists`);
    }

    const port = new this.portModel({
      ...dto,
      code: dto.code.toUpperCase(),
      country: new Types.ObjectId(dto.country),
    });
    await port.save();

    // Return populated
    return this.getPortById(port._id.toString());
  }

  /**
   * Update an existing port
   */
  async updatePort(id: string, dto: UpdatePortDto) {
    const port = await this.portModel.findById(id);
    if (!port) {
      throw new NotFoundException('Port not found');
    }

    // If changing country, verify it exists
    if (dto.country) {
      const country = await this.countryModel.findById(dto.country);
      if (!country) {
        throw new BadRequestException('Country not found');
      }
      dto.country = new Types.ObjectId(dto.country) as any;
    }

    // If changing code, ensure uniqueness
    if (dto.code && dto.code.toUpperCase() !== port.code) {
      const existing = await this.portModel.findOne({
        code: dto.code.toUpperCase(),
        _id: { $ne: id },
      });
      if (existing) {
        throw new ConflictException(`Port with code ${dto.code} already exists`);
      }
      dto.code = dto.code.toUpperCase();
    }

    Object.assign(port, dto);
    await port.save();

    return this.getPortById(id);
  }

  /**
   * Delete a port
   */
  async deletePort(id: string) {
    const port = await this.portModel.findByIdAndDelete(id);
    if (!port) {
      throw new NotFoundException('Port not found');
    }
    return { deleted: true };
  }

  /**
   * Seed default ports - Comprehensive global port data
   */
  async seedDefaultPorts() {
    // First, get countries by ISO code
    const countries = await this.countryModel.find({}).lean();
    const countryMap = new Map(countries.map((c) => [c.isoCode, c._id]));

    const defaultPorts = [
      // ==================== NORTH AMERICA ====================
      // United States - Sea Ports
      { code: 'USNYC', name: 'Port of New York and New Jersey', country: 'US', type: 'sea', city: 'New York' },
      { code: 'USLAX', name: 'Port of Los Angeles', country: 'US', type: 'sea', city: 'Los Angeles' },
      { code: 'USLGB', name: 'Port of Long Beach', country: 'US', type: 'sea', city: 'Long Beach' },
      { code: 'USHOU', name: 'Port of Houston', country: 'US', type: 'sea', city: 'Houston' },
      { code: 'USSAV', name: 'Port of Savannah', country: 'US', type: 'sea', city: 'Savannah' },
      { code: 'USSEA', name: 'Port of Seattle', country: 'US', type: 'sea', city: 'Seattle' },
      { code: 'USTIW', name: 'Port of Tacoma', country: 'US', type: 'sea', city: 'Tacoma' },
      { code: 'USOAK', name: 'Port of Oakland', country: 'US', type: 'sea', city: 'Oakland' },
      { code: 'USMIA', name: 'Port of Miami', country: 'US', type: 'sea', city: 'Miami' },
      { code: 'USNOR', name: 'Port of New Orleans', country: 'US', type: 'sea', city: 'New Orleans' },
      { code: 'USBAL', name: 'Port of Baltimore', country: 'US', type: 'sea', city: 'Baltimore' },
      { code: 'USCHA', name: 'Port of Charleston', country: 'US', type: 'sea', city: 'Charleston' },
      // United States - Air Ports
      { code: 'USJFK', name: 'John F. Kennedy International Airport', country: 'US', type: 'air', city: 'New York' },
      { code: 'USORD', name: "O'Hare International Airport", country: 'US', type: 'air', city: 'Chicago' },
      { code: 'USLAX', name: 'Los Angeles International Airport', country: 'US', type: 'air', city: 'Los Angeles' },
      { code: 'USATL', name: 'Hartsfield-Jackson Atlanta International', country: 'US', type: 'air', city: 'Atlanta' },
      { code: 'USDFW', name: 'Dallas/Fort Worth International Airport', country: 'US', type: 'air', city: 'Dallas' },
      // United States - Land Ports
      { code: 'USLRD', name: 'Laredo Border Crossing', country: 'US', type: 'land', city: 'Laredo' },
      { code: 'USELP', name: 'El Paso Border Crossing', country: 'US', type: 'land', city: 'El Paso' },
      { code: 'USDET', name: 'Detroit-Windsor Tunnel', country: 'US', type: 'land', city: 'Detroit' },

      // Canada
      { code: 'CAVAN', name: 'Port of Vancouver', country: 'CA', type: 'sea', city: 'Vancouver' },
      { code: 'CAMTR', name: 'Port of Montreal', country: 'CA', type: 'sea', city: 'Montreal' },
      { code: 'CATOR', name: 'Port of Toronto', country: 'CA', type: 'sea', city: 'Toronto' },
      { code: 'CAHAL', name: 'Port of Halifax', country: 'CA', type: 'sea', city: 'Halifax' },
      { code: 'CAYYZ', name: 'Toronto Pearson International Airport', country: 'CA', type: 'air', city: 'Toronto' },
      { code: 'CAYVR', name: 'Vancouver International Airport', country: 'CA', type: 'air', city: 'Vancouver' },

      // Mexico
      { code: 'MXMAN', name: 'Port of Manzanillo', country: 'MX', type: 'sea', city: 'Manzanillo' },
      { code: 'MXLCB', name: 'Port of Lazaro Cardenas', country: 'MX', type: 'sea', city: 'Lazaro Cardenas' },
      { code: 'MXVER', name: 'Port of Veracruz', country: 'MX', type: 'sea', city: 'Veracruz' },
      { code: 'MXALT', name: 'Port of Altamira', country: 'MX', type: 'sea', city: 'Altamira' },
      { code: 'MXMEX', name: 'Mexico City International Airport', country: 'MX', type: 'air', city: 'Mexico City' },

      // ==================== SOUTH AMERICA ====================
      // Brazil
      { code: 'BRSSZ', name: 'Port of Santos', country: 'BR', type: 'sea', city: 'Santos' },
      { code: 'BRPNG', name: 'Port of Paranagua', country: 'BR', type: 'sea', city: 'Paranagua' },
      { code: 'BRRIO', name: 'Port of Rio de Janeiro', country: 'BR', type: 'sea', city: 'Rio de Janeiro' },
      { code: 'BRITJ', name: 'Port of Itajai', country: 'BR', type: 'sea', city: 'Itajai' },
      { code: 'BRSFS', name: 'Port of Sao Francisco do Sul', country: 'BR', type: 'sea', city: 'Sao Francisco' },
      { code: 'BRGRU', name: 'Sao Paulo Guarulhos International', country: 'BR', type: 'air', city: 'Sao Paulo' },

      // Argentina
      { code: 'ARBUE', name: 'Port of Buenos Aires', country: 'AR', type: 'sea', city: 'Buenos Aires' },
      { code: 'ARROS', name: 'Port of Rosario', country: 'AR', type: 'sea', city: 'Rosario' },
      { code: 'ARBHI', name: 'Port of Bahia Blanca', country: 'AR', type: 'sea', city: 'Bahia Blanca' },
      { code: 'AREZE', name: 'Buenos Aires Ezeiza International', country: 'AR', type: 'air', city: 'Buenos Aires' },

      // Chile
      { code: 'CLSAI', name: 'Port of San Antonio', country: 'CL', type: 'sea', city: 'San Antonio' },
      { code: 'CLVAP', name: 'Port of Valparaiso', country: 'CL', type: 'sea', city: 'Valparaiso' },
      { code: 'CLSCL', name: 'Santiago International Airport', country: 'CL', type: 'air', city: 'Santiago' },

      // Colombia
      { code: 'COCTG', name: 'Port of Cartagena', country: 'CO', type: 'sea', city: 'Cartagena' },
      { code: 'COBUN', name: 'Port of Buenaventura', country: 'CO', type: 'sea', city: 'Buenaventura' },
      { code: 'COBOG', name: 'El Dorado International Airport', country: 'CO', type: 'air', city: 'Bogota' },

      // Peru
      { code: 'PECLL', name: 'Port of Callao', country: 'PE', type: 'sea', city: 'Callao' },
      { code: 'PELIM', name: 'Lima Jorge Chavez International', country: 'PE', type: 'air', city: 'Lima' },

      // Ecuador
      { code: 'ECGYE', name: 'Port of Guayaquil', country: 'EC', type: 'sea', city: 'Guayaquil' },

      // ==================== EUROPE ====================
      // Netherlands
      { code: 'NLRTM', name: 'Port of Rotterdam', country: 'NL', type: 'sea', city: 'Rotterdam' },
      { code: 'NLAMS', name: 'Port of Amsterdam', country: 'NL', type: 'sea', city: 'Amsterdam' },
      { code: 'NLAMS', name: 'Amsterdam Schiphol Airport', country: 'NL', type: 'air', city: 'Amsterdam' },

      // Germany
      { code: 'DEHAM', name: 'Port of Hamburg', country: 'DE', type: 'sea', city: 'Hamburg' },
      { code: 'DEBRV', name: 'Port of Bremerhaven', country: 'DE', type: 'sea', city: 'Bremerhaven' },
      { code: 'DEFRA', name: 'Frankfurt Airport', country: 'DE', type: 'air', city: 'Frankfurt' },
      { code: 'DEMUC', name: 'Munich Airport', country: 'DE', type: 'air', city: 'Munich' },

      // Belgium
      { code: 'BEANR', name: 'Port of Antwerp', country: 'BE', type: 'sea', city: 'Antwerp' },
      { code: 'BEZEE', name: 'Port of Zeebrugge', country: 'BE', type: 'sea', city: 'Zeebrugge' },
      { code: 'BEBRU', name: 'Brussels Airport', country: 'BE', type: 'air', city: 'Brussels' },

      // United Kingdom
      { code: 'GBFXT', name: 'Port of Felixstowe', country: 'GB', type: 'sea', city: 'Felixstowe' },
      { code: 'GBSOU', name: 'Port of Southampton', country: 'GB', type: 'sea', city: 'Southampton' },
      { code: 'GBLGP', name: 'London Gateway Port', country: 'GB', type: 'sea', city: 'London' },
      { code: 'GBLIV', name: 'Port of Liverpool', country: 'GB', type: 'sea', city: 'Liverpool' },
      { code: 'GBLHR', name: 'London Heathrow Airport', country: 'GB', type: 'air', city: 'London' },
      { code: 'GBLGW', name: 'London Gatwick Airport', country: 'GB', type: 'air', city: 'London' },

      // France
      { code: 'FRLEH', name: 'Port of Le Havre', country: 'FR', type: 'sea', city: 'Le Havre' },
      { code: 'FRMAR', name: 'Port of Marseille', country: 'FR', type: 'sea', city: 'Marseille' },
      { code: 'FRDKK', name: 'Port of Dunkirk', country: 'FR', type: 'sea', city: 'Dunkirk' },
      { code: 'FRCDG', name: 'Paris Charles de Gaulle Airport', country: 'FR', type: 'air', city: 'Paris' },

      // Spain
      { code: 'ESVLC', name: 'Port of Valencia', country: 'ES', type: 'sea', city: 'Valencia' },
      { code: 'ESALG', name: 'Port of Algeciras', country: 'ES', type: 'sea', city: 'Algeciras' },
      { code: 'ESBCN', name: 'Port of Barcelona', country: 'ES', type: 'sea', city: 'Barcelona' },
      { code: 'ESLPG', name: 'Port of Las Palmas', country: 'ES', type: 'sea', city: 'Las Palmas' },
      { code: 'ESMAD', name: 'Madrid Barajas Airport', country: 'ES', type: 'air', city: 'Madrid' },

      // Italy
      { code: 'ITGOA', name: 'Port of Genoa', country: 'IT', type: 'sea', city: 'Genoa' },
      { code: 'ITGIT', name: 'Port of Gioia Tauro', country: 'IT', type: 'sea', city: 'Gioia Tauro' },
      { code: 'ITLIV', name: 'Port of Livorno', country: 'IT', type: 'sea', city: 'Livorno' },
      { code: 'ITMIL', name: 'Milan Malpensa Airport', country: 'IT', type: 'air', city: 'Milan' },
      { code: 'ITFCO', name: 'Rome Fiumicino Airport', country: 'IT', type: 'air', city: 'Rome' },

      // Greece
      { code: 'GRPIR', name: 'Port of Piraeus', country: 'GR', type: 'sea', city: 'Piraeus' },
      { code: 'GRTHE', name: 'Port of Thessaloniki', country: 'GR', type: 'sea', city: 'Thessaloniki' },

      // Turkey
      { code: 'TRIST', name: 'Port of Istanbul (Ambarli)', country: 'TR', type: 'sea', city: 'Istanbul' },
      { code: 'TRMER', name: 'Port of Mersin', country: 'TR', type: 'sea', city: 'Mersin' },
      { code: 'TRIZM', name: 'Port of Izmir', country: 'TR', type: 'sea', city: 'Izmir' },
      { code: 'TRIST', name: 'Istanbul Airport', country: 'TR', type: 'air', city: 'Istanbul' },

      // Poland
      { code: 'PLGDN', name: 'Port of Gdansk', country: 'PL', type: 'sea', city: 'Gdansk' },
      { code: 'PLGDY', name: 'Port of Gdynia', country: 'PL', type: 'sea', city: 'Gdynia' },

      // Russia
      { code: 'RULED', name: 'Port of St. Petersburg', country: 'RU', type: 'sea', city: 'St. Petersburg' },
      { code: 'RUNVS', name: 'Port of Novorossiysk', country: 'RU', type: 'sea', city: 'Novorossiysk' },
      { code: 'RUVVO', name: 'Port of Vladivostok', country: 'RU', type: 'sea', city: 'Vladivostok' },
      { code: 'RUSVO', name: 'Moscow Sheremetyevo Airport', country: 'RU', type: 'air', city: 'Moscow' },

      // ==================== ASIA ====================
      // China
      { code: 'CNSHA', name: 'Port of Shanghai', country: 'CN', type: 'sea', city: 'Shanghai' },
      { code: 'CNSHE', name: 'Port of Shenzhen (Yantian)', country: 'CN', type: 'sea', city: 'Shenzhen' },
      { code: 'CNNGB', name: 'Port of Ningbo-Zhoushan', country: 'CN', type: 'sea', city: 'Ningbo' },
      { code: 'CNGZU', name: 'Port of Guangzhou (Nansha)', country: 'CN', type: 'sea', city: 'Guangzhou' },
      { code: 'CNQIN', name: 'Port of Qingdao', country: 'CN', type: 'sea', city: 'Qingdao' },
      { code: 'CNTXG', name: 'Port of Tianjin', country: 'CN', type: 'sea', city: 'Tianjin' },
      { code: 'CNXMN', name: 'Port of Xiamen', country: 'CN', type: 'sea', city: 'Xiamen' },
      { code: 'CNDLC', name: 'Port of Dalian', country: 'CN', type: 'sea', city: 'Dalian' },
      { code: 'CNPVG', name: 'Shanghai Pudong International', country: 'CN', type: 'air', city: 'Shanghai' },
      { code: 'CNPEK', name: 'Beijing Capital International', country: 'CN', type: 'air', city: 'Beijing' },
      { code: 'CNCAN', name: 'Guangzhou Baiyun International', country: 'CN', type: 'air', city: 'Guangzhou' },
      { code: 'CNHKG', name: 'Hong Kong International Airport', country: 'CN', type: 'air', city: 'Hong Kong' },

      // India
      { code: 'INNSA', name: 'Jawaharlal Nehru Port (JNPT)', country: 'IN', type: 'sea', city: 'Mumbai' },
      { code: 'INMUN', name: 'Mundra Port', country: 'IN', type: 'sea', city: 'Mundra' },
      { code: 'INMAA', name: 'Chennai Port', country: 'IN', type: 'sea', city: 'Chennai' },
      { code: 'INPAV', name: 'Pipavav Port', country: 'IN', type: 'sea', city: 'Pipavav' },
      { code: 'INKRI', name: 'Krishnapatnam Port', country: 'IN', type: 'sea', city: 'Krishnapatnam' },
      { code: 'INTUT', name: 'Tuticorin Port (V.O. Chidambaranar)', country: 'IN', type: 'sea', city: 'Tuticorin' },
      { code: 'INCOK', name: 'Cochin Port', country: 'IN', type: 'sea', city: 'Kochi' },
      { code: 'INHAL', name: 'Haldia Port', country: 'IN', type: 'sea', city: 'Haldia' },
      { code: 'INCCU', name: 'Kolkata Port', country: 'IN', type: 'sea', city: 'Kolkata' },
      { code: 'INVTZ', name: 'Visakhapatnam Port', country: 'IN', type: 'sea', city: 'Visakhapatnam' },
      { code: 'INDEL', name: 'Indira Gandhi International Airport', country: 'IN', type: 'air', city: 'Delhi' },
      { code: 'INBOM', name: 'Chhatrapati Shivaji International', country: 'IN', type: 'air', city: 'Mumbai' },
      { code: 'INBLR', name: 'Kempegowda International Airport', country: 'IN', type: 'air', city: 'Bangalore' },
      { code: 'INMAA', name: 'Chennai International Airport', country: 'IN', type: 'air', city: 'Chennai' },
      // India - Land Ports (ICD)
      { code: 'INTKG', name: 'ICD Tughlakabad (Delhi)', country: 'IN', type: 'land', city: 'Delhi' },
      { code: 'INLUD', name: 'ICD Ludhiana', country: 'IN', type: 'land', city: 'Ludhiana' },
      { code: 'INJAI', name: 'ICD Jaipur', country: 'IN', type: 'land', city: 'Jaipur' },
      { code: 'INAHD', name: 'ICD Ahmedabad', country: 'IN', type: 'land', city: 'Ahmedabad' },

      // Japan
      { code: 'JPYOK', name: 'Port of Yokohama', country: 'JP', type: 'sea', city: 'Yokohama' },
      { code: 'JPTYO', name: 'Port of Tokyo', country: 'JP', type: 'sea', city: 'Tokyo' },
      { code: 'JPKOB', name: 'Port of Kobe', country: 'JP', type: 'sea', city: 'Kobe' },
      { code: 'JPOSA', name: 'Port of Osaka', country: 'JP', type: 'sea', city: 'Osaka' },
      { code: 'JPNGO', name: 'Port of Nagoya', country: 'JP', type: 'sea', city: 'Nagoya' },
      { code: 'JPNRT', name: 'Narita International Airport', country: 'JP', type: 'air', city: 'Tokyo' },
      { code: 'JPHND', name: 'Tokyo Haneda Airport', country: 'JP', type: 'air', city: 'Tokyo' },
      { code: 'JPKIX', name: 'Kansai International Airport', country: 'JP', type: 'air', city: 'Osaka' },

      // South Korea
      { code: 'KRPUS', name: 'Port of Busan', country: 'KR', type: 'sea', city: 'Busan' },
      { code: 'KRICN', name: 'Port of Incheon', country: 'KR', type: 'sea', city: 'Incheon' },
      { code: 'KRICN', name: 'Incheon International Airport', country: 'KR', type: 'air', city: 'Seoul' },

      // Singapore
      { code: 'SGSIN', name: 'Port of Singapore (PSA)', country: 'SG', type: 'sea', city: 'Singapore' },
      { code: 'SGSIN', name: 'Singapore Changi Airport', country: 'SG', type: 'air', city: 'Singapore' },

      // Malaysia
      { code: 'MYPKG', name: 'Port Klang', country: 'MY', type: 'sea', city: 'Port Klang' },
      { code: 'MYTPP', name: 'Port of Tanjung Pelepas', country: 'MY', type: 'sea', city: 'Johor' },
      { code: 'MYPEN', name: 'Port of Penang', country: 'MY', type: 'sea', city: 'Penang' },
      { code: 'MYKUL', name: 'Kuala Lumpur International Airport', country: 'MY', type: 'air', city: 'Kuala Lumpur' },

      // Thailand
      { code: 'THLCH', name: 'Laem Chabang Port', country: 'TH', type: 'sea', city: 'Laem Chabang' },
      { code: 'THBKK', name: 'Bangkok Port (Klong Toey)', country: 'TH', type: 'sea', city: 'Bangkok' },
      { code: 'THBKK', name: 'Suvarnabhumi Airport', country: 'TH', type: 'air', city: 'Bangkok' },

      // Vietnam
      { code: 'VNSGN', name: 'Port of Ho Chi Minh (Cat Lai)', country: 'VN', type: 'sea', city: 'Ho Chi Minh City' },
      { code: 'VNHPH', name: 'Port of Hai Phong', country: 'VN', type: 'sea', city: 'Hai Phong' },
      { code: 'VNSGN', name: 'Tan Son Nhat International', country: 'VN', type: 'air', city: 'Ho Chi Minh City' },
      { code: 'VNHAN', name: 'Noi Bai International Airport', country: 'VN', type: 'air', city: 'Hanoi' },

      // Indonesia
      { code: 'IDJKT', name: 'Port of Tanjung Priok', country: 'ID', type: 'sea', city: 'Jakarta' },
      { code: 'IDSUB', name: 'Port of Tanjung Perak', country: 'ID', type: 'sea', city: 'Surabaya' },
      { code: 'IDBLW', name: 'Port of Belawan', country: 'ID', type: 'sea', city: 'Medan' },
      { code: 'IDCGK', name: 'Soekarno-Hatta International', country: 'ID', type: 'air', city: 'Jakarta' },

      // Philippines
      { code: 'PHMNL', name: 'Port of Manila', country: 'PH', type: 'sea', city: 'Manila' },
      { code: 'PHSUB', name: 'Port of Subic Bay', country: 'PH', type: 'sea', city: 'Subic Bay' },
      { code: 'PHMNL', name: 'Ninoy Aquino International Airport', country: 'PH', type: 'air', city: 'Manila' },

      // Taiwan
      { code: 'TWKHH', name: 'Port of Kaohsiung', country: 'TW', type: 'sea', city: 'Kaohsiung' },
      { code: 'TWTPE', name: 'Port of Taipei (Keelung)', country: 'TW', type: 'sea', city: 'Taipei' },
      { code: 'TWTPE', name: 'Taiwan Taoyuan International', country: 'TW', type: 'air', city: 'Taipei' },

      // UAE
      { code: 'AEJEA', name: 'Jebel Ali Port', country: 'AE', type: 'sea', city: 'Dubai' },
      { code: 'AEKLF', name: 'Khalifa Port', country: 'AE', type: 'sea', city: 'Abu Dhabi' },
      { code: 'AESHJ', name: 'Port of Sharjah', country: 'AE', type: 'sea', city: 'Sharjah' },
      { code: 'AEDXB', name: 'Dubai International Airport', country: 'AE', type: 'air', city: 'Dubai' },
      { code: 'AEAUH', name: 'Abu Dhabi International Airport', country: 'AE', type: 'air', city: 'Abu Dhabi' },

      // Saudi Arabia
      { code: 'SAJED', name: 'King Abdullah Port (Jeddah)', country: 'SA', type: 'sea', city: 'Jeddah' },
      { code: 'SADMM', name: 'King Abdulaziz Port (Dammam)', country: 'SA', type: 'sea', city: 'Dammam' },
      { code: 'SARUH', name: 'King Khalid International Airport', country: 'SA', type: 'air', city: 'Riyadh' },
      { code: 'SAJED', name: 'King Abdulaziz International Airport', country: 'SA', type: 'air', city: 'Jeddah' },

      // Pakistan
      { code: 'PKKHI', name: 'Port of Karachi', country: 'PK', type: 'sea', city: 'Karachi' },
      { code: 'PKQCT', name: 'Port Qasim', country: 'PK', type: 'sea', city: 'Karachi' },
      { code: 'PKGWD', name: 'Gwadar Port', country: 'PK', type: 'sea', city: 'Gwadar' },
      { code: 'PKKHI', name: 'Jinnah International Airport', country: 'PK', type: 'air', city: 'Karachi' },
      { code: 'PKLHE', name: 'Allama Iqbal International Airport', country: 'PK', type: 'air', city: 'Lahore' },

      // Bangladesh
      { code: 'BDCGP', name: 'Port of Chittagong', country: 'BD', type: 'sea', city: 'Chittagong' },
      { code: 'BDDAC', name: 'Hazrat Shahjalal International', country: 'BD', type: 'air', city: 'Dhaka' },

      // Sri Lanka
      { code: 'LKCMB', name: 'Port of Colombo', country: 'LK', type: 'sea', city: 'Colombo' },
      { code: 'LKCMB', name: 'Bandaranaike International Airport', country: 'LK', type: 'air', city: 'Colombo' },

      // ==================== AFRICA ====================
      // South Africa
      { code: 'ZADUR', name: 'Port of Durban', country: 'ZA', type: 'sea', city: 'Durban' },
      { code: 'ZACPT', name: 'Port of Cape Town', country: 'ZA', type: 'sea', city: 'Cape Town' },
      { code: 'ZAJNB', name: 'O.R. Tambo International Airport', country: 'ZA', type: 'air', city: 'Johannesburg' },

      // Egypt
      { code: 'EGPSD', name: 'Port Said', country: 'EG', type: 'sea', city: 'Port Said' },
      { code: 'EGALX', name: 'Port of Alexandria', country: 'EG', type: 'sea', city: 'Alexandria' },
      { code: 'EGCAI', name: 'Cairo International Airport', country: 'EG', type: 'air', city: 'Cairo' },

      // Morocco
      { code: 'MAPTM', name: 'Tanger Med Port', country: 'MA', type: 'sea', city: 'Tangier' },
      { code: 'MACAS', name: 'Port of Casablanca', country: 'MA', type: 'sea', city: 'Casablanca' },

      // Nigeria
      { code: 'NGAPP', name: 'Apapa Port (Lagos)', country: 'NG', type: 'sea', city: 'Lagos' },
      { code: 'NGTIN', name: 'Tin Can Island Port', country: 'NG', type: 'sea', city: 'Lagos' },
      { code: 'NGLOS', name: 'Murtala Muhammed International', country: 'NG', type: 'air', city: 'Lagos' },

      // Kenya
      { code: 'KEMBA', name: 'Port of Mombasa', country: 'KE', type: 'sea', city: 'Mombasa' },
      { code: 'KENBO', name: 'Jomo Kenyatta International Airport', country: 'KE', type: 'air', city: 'Nairobi' },

      // Ghana
      { code: 'GHTEM', name: 'Port of Tema', country: 'GH', type: 'sea', city: 'Tema' },

      // Tanzania
      { code: 'TZDAR', name: 'Port of Dar es Salaam', country: 'TZ', type: 'sea', city: 'Dar es Salaam' },

      // ==================== OCEANIA ====================
      // Australia
      { code: 'AUSYD', name: 'Port of Sydney', country: 'AU', type: 'sea', city: 'Sydney' },
      { code: 'AUMEL', name: 'Port of Melbourne', country: 'AU', type: 'sea', city: 'Melbourne' },
      { code: 'AUBNE', name: 'Port of Brisbane', country: 'AU', type: 'sea', city: 'Brisbane' },
      { code: 'AUFRE', name: 'Port of Fremantle', country: 'AU', type: 'sea', city: 'Perth' },
      { code: 'AUADL', name: 'Port Adelaide', country: 'AU', type: 'sea', city: 'Adelaide' },
      { code: 'AUSYD', name: 'Sydney Kingsford Smith Airport', country: 'AU', type: 'air', city: 'Sydney' },
      { code: 'AUMEL', name: 'Melbourne Airport', country: 'AU', type: 'air', city: 'Melbourne' },

      // New Zealand
      { code: 'NZAKL', name: 'Port of Auckland', country: 'NZ', type: 'sea', city: 'Auckland' },
      { code: 'NZTRG', name: 'Port of Tauranga', country: 'NZ', type: 'sea', city: 'Tauranga' },
      { code: 'NZAKL', name: 'Auckland Airport', country: 'NZ', type: 'air', city: 'Auckland' },
    ];

    let created = 0;
    let skipped = 0;
    let missingCountry = 0;

    for (const port of defaultPorts) {
      const countryId = countryMap.get(port.country);
      if (!countryId) {
        missingCountry++;
        continue;
      }

      const exists = await this.portModel.findOne({ code: port.code });
      if (!exists) {
        await this.portModel.create({
          code: port.code,
          name: port.name,
          country: countryId,
          type: port.type,
          city: port.city,
          isActive: true,
        });
        created++;
      } else {
        skipped++;
      }
    }

    return { created, skipped, missingCountry, total: defaultPorts.length };
  }
}
