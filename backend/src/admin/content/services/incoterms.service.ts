import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Incoterm, CostAllocation } from '../schemas/incoterm.schema';
import {
  UpdateIncotermDto,
  GetIncotermsQueryDto,
  INCOTERM_CODES,
} from '../dto/incoterm/incoterm.dto';

/**
 * Standard Incoterms 2020 definitions
 * These are the 11 internationally recognized trade terms
 */
interface IncotermDefinition {
  code: string;
  name: string;
  description: string;
  riskTransferDescription: string;
  transportMode: 'any' | 'sea_inland';
  costAllocation: CostAllocation;
}

// Default cost allocations for all 11 Incoterms
const DEFAULT_INCOTERMS: IncotermDefinition[] = [
  {
    code: 'EXW',
    name: 'Ex Works',
    description:
      'The seller makes the goods available at their premises or another named place. The buyer bears all costs and risks from that point.',
    riskTransferDescription:
      "Risk transfers to buyer when goods are placed at seller's disposal at the named place.",
    transportMode: 'any',
    costAllocation: {
      commercialInvoice: 'Seller',
      packagingQualityControl: 'Seller',
      loadingInlandDelivery: 'Buyer',
      exportDutyTaxes: 'Buyer',
      originTerminalHandling: 'Buyer',
      insurance: 'Buyer',
      carriageCharges: 'Buyer',
      destinationTerminalHandling: 'Buyer',
      deliveryToDestination: 'Buyer',
      unloadingAtDestination: 'Buyer',
      importDutyTaxes: 'Buyer',
    },
  },
  {
    code: 'FCA',
    name: 'Free Carrier',
    description:
      "The seller delivers goods to the carrier or another person nominated by the buyer at the seller's premises or another named place.",
    riskTransferDescription:
      'Risk transfers when goods are handed over to the carrier at the named place.',
    transportMode: 'any',
    costAllocation: {
      commercialInvoice: 'Seller',
      packagingQualityControl: 'Seller',
      loadingInlandDelivery: 'Seller',
      exportDutyTaxes: 'Seller',
      originTerminalHandling: 'Buyer',
      insurance: 'Buyer',
      carriageCharges: 'Buyer',
      destinationTerminalHandling: 'Buyer',
      deliveryToDestination: 'Buyer',
      unloadingAtDestination: 'Buyer',
      importDutyTaxes: 'Buyer',
    },
  },
  {
    code: 'FAS',
    name: 'Free Alongside Ship',
    description:
      'The seller delivers goods alongside the vessel at the named port of shipment. The buyer bears all costs and risks from that point.',
    riskTransferDescription:
      'Risk transfers when goods are placed alongside the ship at the port of shipment.',
    transportMode: 'sea_inland',
    costAllocation: {
      commercialInvoice: 'Seller',
      packagingQualityControl: 'Seller',
      loadingInlandDelivery: 'Seller',
      exportDutyTaxes: 'Seller',
      originTerminalHandling: 'Seller',
      insurance: 'Buyer',
      carriageCharges: 'Buyer',
      destinationTerminalHandling: 'Buyer',
      deliveryToDestination: 'Buyer',
      unloadingAtDestination: 'Buyer',
      importDutyTaxes: 'Buyer',
    },
  },
  {
    code: 'FOB',
    name: 'Free On Board',
    description:
      'The seller delivers goods on board the vessel at the named port of shipment. Risk passes when goods are on board.',
    riskTransferDescription:
      "Risk transfers when goods pass over the ship's rail at the port of shipment.",
    transportMode: 'sea_inland',
    costAllocation: {
      commercialInvoice: 'Seller',
      packagingQualityControl: 'Seller',
      loadingInlandDelivery: 'Seller',
      exportDutyTaxes: 'Seller',
      originTerminalHandling: 'Seller',
      insurance: 'Buyer',
      carriageCharges: 'Buyer',
      destinationTerminalHandling: 'Buyer',
      deliveryToDestination: 'Buyer',
      unloadingAtDestination: 'Buyer',
      importDutyTaxes: 'Buyer',
    },
  },
  {
    code: 'CFR',
    name: 'Cost and Freight',
    description:
      'The seller delivers goods on board the vessel and pays freight to the destination port. Risk passes when goods are on board.',
    riskTransferDescription:
      'Risk transfers when goods are loaded on board the vessel, but seller pays for freight.',
    transportMode: 'sea_inland',
    costAllocation: {
      commercialInvoice: 'Seller',
      packagingQualityControl: 'Seller',
      loadingInlandDelivery: 'Seller',
      exportDutyTaxes: 'Seller',
      originTerminalHandling: 'Seller',
      insurance: 'Buyer',
      carriageCharges: 'Seller',
      destinationTerminalHandling: 'Buyer',
      deliveryToDestination: 'Buyer',
      unloadingAtDestination: 'Buyer',
      importDutyTaxes: 'Buyer',
    },
  },
  {
    code: 'CIF',
    name: 'Cost, Insurance and Freight',
    description:
      'The seller delivers goods on board and pays freight and insurance to the destination port. Risk passes when goods are on board.',
    riskTransferDescription:
      'Risk transfers when goods are loaded on board, but seller pays for freight and minimum insurance.',
    transportMode: 'sea_inland',
    costAllocation: {
      commercialInvoice: 'Seller',
      packagingQualityControl: 'Seller',
      loadingInlandDelivery: 'Seller',
      exportDutyTaxes: 'Seller',
      originTerminalHandling: 'Seller',
      insurance: 'Seller',
      carriageCharges: 'Seller',
      destinationTerminalHandling: 'Buyer',
      deliveryToDestination: 'Buyer',
      unloadingAtDestination: 'Buyer',
      importDutyTaxes: 'Buyer',
    },
  },
  {
    code: 'CPT',
    name: 'Carriage Paid To',
    description:
      'The seller delivers goods to the carrier and pays freight to the destination. Risk passes when goods are handed to the first carrier.',
    riskTransferDescription:
      'Risk transfers when goods are handed to the first carrier, but seller pays for carriage.',
    transportMode: 'any',
    costAllocation: {
      commercialInvoice: 'Seller',
      packagingQualityControl: 'Seller',
      loadingInlandDelivery: 'Seller',
      exportDutyTaxes: 'Seller',
      originTerminalHandling: 'Seller',
      insurance: 'Buyer',
      carriageCharges: 'Seller',
      destinationTerminalHandling: 'Buyer',
      deliveryToDestination: 'Buyer',
      unloadingAtDestination: 'Buyer',
      importDutyTaxes: 'Buyer',
    },
  },
  {
    code: 'CIP',
    name: 'Carriage and Insurance Paid To',
    description:
      'The seller delivers goods to the carrier, pays freight and insurance to the destination. Risk passes when goods are handed to the first carrier.',
    riskTransferDescription:
      'Risk transfers when goods are handed to the first carrier, but seller pays for carriage and insurance.',
    transportMode: 'any',
    costAllocation: {
      commercialInvoice: 'Seller',
      packagingQualityControl: 'Seller',
      loadingInlandDelivery: 'Seller',
      exportDutyTaxes: 'Seller',
      originTerminalHandling: 'Seller',
      insurance: 'Seller',
      carriageCharges: 'Seller',
      destinationTerminalHandling: 'Buyer',
      deliveryToDestination: 'Buyer',
      unloadingAtDestination: 'Buyer',
      importDutyTaxes: 'Buyer',
    },
  },
  {
    code: 'DAP',
    name: 'Delivered at Place',
    description:
      'The seller delivers goods when they are placed at the disposal of the buyer on the arriving means of transport, ready for unloading at the named destination.',
    riskTransferDescription:
      "Risk transfers when goods are at buyer's disposal on the arriving transport at the named destination.",
    transportMode: 'any',
    costAllocation: {
      commercialInvoice: 'Seller',
      packagingQualityControl: 'Seller',
      loadingInlandDelivery: 'Seller',
      exportDutyTaxes: 'Seller',
      originTerminalHandling: 'Seller',
      insurance: 'Seller',
      carriageCharges: 'Seller',
      destinationTerminalHandling: 'Seller',
      deliveryToDestination: 'Seller',
      unloadingAtDestination: 'Buyer',
      importDutyTaxes: 'Buyer',
    },
  },
  {
    code: 'DPU',
    name: 'Delivered at Place Unloaded',
    description:
      'The seller delivers goods when they are unloaded from the arriving means of transport and placed at the disposal of the buyer at the named destination.',
    riskTransferDescription:
      "Risk transfers when goods are unloaded and placed at buyer's disposal at the named destination.",
    transportMode: 'any',
    costAllocation: {
      commercialInvoice: 'Seller',
      packagingQualityControl: 'Seller',
      loadingInlandDelivery: 'Seller',
      exportDutyTaxes: 'Seller',
      originTerminalHandling: 'Seller',
      insurance: 'Seller',
      carriageCharges: 'Seller',
      destinationTerminalHandling: 'Seller',
      deliveryToDestination: 'Seller',
      unloadingAtDestination: 'Seller',
      importDutyTaxes: 'Buyer',
    },
  },
  {
    code: 'DDP',
    name: 'Delivered Duty Paid',
    description:
      'The seller delivers goods cleared for import at the named destination. The seller bears all costs and risks including import duties and taxes.',
    riskTransferDescription:
      "Risk transfers when goods are placed at buyer's disposal, cleared for import, at the named destination.",
    transportMode: 'any',
    costAllocation: {
      commercialInvoice: 'Seller',
      packagingQualityControl: 'Seller',
      loadingInlandDelivery: 'Seller',
      exportDutyTaxes: 'Seller',
      originTerminalHandling: 'Seller',
      insurance: 'Seller',
      carriageCharges: 'Seller',
      destinationTerminalHandling: 'Seller',
      deliveryToDestination: 'Seller',
      unloadingAtDestination: 'Seller',
      importDutyTaxes: 'Seller',
    },
  },
];

@Injectable()
export class IncotermsService {
  constructor(
    @InjectModel(Incoterm.name) private incotermModel: Model<Incoterm>,
  ) {}

  /**
   * Get all incoterms with optional filters
   */
  async getIncoterms(query: GetIncotermsQueryDto = {}) {
    const filter: Record<string, unknown> = {};

    if (query.transportMode) {
      filter.transportMode = query.transportMode;
    }

    const incoterms = await this.incotermModel
      .find(filter)
      .sort({ code: 1 }) // Sort by code alphabetically
      .exec();

    return {
      incoterms,
      total: incoterms.length,
    };
  }

  /**
   * Get a single incoterm by its code
   */
  async getIncotermByCode(code: string): Promise<Incoterm> {
    const upperCode = code.toUpperCase();

    if (
      !INCOTERM_CODES.includes(upperCode as (typeof INCOTERM_CODES)[number])
    ) {
      throw new NotFoundException(`Invalid incoterm code: ${code}`);
    }

    const incoterm = await this.incotermModel
      .findOne({ code: upperCode })
      .exec();

    if (!incoterm) {
      throw new NotFoundException(
        `Incoterm ${code} not found. Please seed the database first.`,
      );
    }

    return incoterm;
  }

  /**
   * Update an incoterm (no create or delete - fixed 11 types)
   */
  async updateIncoterm(
    code: string,
    dto: UpdateIncotermDto,
  ): Promise<Incoterm> {
    const upperCode = code.toUpperCase();

    if (
      !INCOTERM_CODES.includes(upperCode as (typeof INCOTERM_CODES)[number])
    ) {
      throw new NotFoundException(`Invalid incoterm code: ${code}`);
    }

    const incoterm = await this.incotermModel
      .findOneAndUpdate({ code: upperCode }, { $set: dto }, { new: true })
      .exec();

    if (!incoterm) {
      throw new NotFoundException(
        `Incoterm ${code} not found. Please seed the database first.`,
      );
    }

    return incoterm;
  }

  /**
   * Seed all 11 standard Incoterms 2020
   * This should be run once to populate the database
   */
  async seedDefaultIncoterms(): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    for (const incoterm of DEFAULT_INCOTERMS) {
      const exists = await this.incotermModel
        .findOne({ code: incoterm.code })
        .exec();

      if (exists) {
        skipped++;
        continue;
      }

      await this.incotermModel.create(incoterm);
      created++;
    }

    return { created, skipped };
  }

  /**
   * Reset and reseed all incoterms to their defaults
   * Use with caution - this will overwrite any customizations
   */
  async resetToDefaults(): Promise<{ updated: number }> {
    let updated = 0;

    for (const incoterm of DEFAULT_INCOTERMS) {
      await this.incotermModel.findOneAndUpdate(
        { code: incoterm.code },
        { $set: incoterm },
        { upsert: true },
      );
      updated++;
    }

    return { updated };
  }

  /**
   * Get all incoterm codes (for dropdown/validation)
   */
  getIncotermCodes(): string[] {
    return [...INCOTERM_CODES];
  }
}
