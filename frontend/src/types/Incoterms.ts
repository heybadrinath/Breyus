
// incoterms state 
export type Trader = 'Buyer' | 'Seller';

// Define all possible incoterms
export type IncotermType = 'EXW' | 'FCA' | 'FAS' | 'FOB' | 'CFR' | 'CIF' | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP';

// Define all possible row names
export type RowName =
    | 'Charges/Fees'
    | 'Transfer of risk'
    | 'Commercial Invoice'
    | 'Packaging, Quality Control, Marking'
    | 'Loading & Inland Delivery'
    | 'Export Duty & Taxes'
    | 'Origin Terminal Handling'
    | 'Insurance'
    | 'Carriage Charges'
    | '*Destination Terminal Handling'
    | 'Delivery to Destination'
    | 'Unloading at Destination'
    | 'Import Duty & Taxes';

// Define the structure for each incoterm row
export interface IncotermRowData {
    [key: string]: Trader;
}

// Main incoterms state interface
export interface IncotermsState {
    // The currently selected incoterm column
    selectedIncoterm: IncotermType | '';

    // Data for only the selected incoterm (not all incoterms)
    selectedIncotermData: IncotermRowData;

    // Default values for each incoterm (for reference)
    defaults: Record<IncotermType, IncotermRowData>;
}

/**
 * Simplified Incoterm selection type.
 * Used when only the selected Incoterm type is needed (user selection).
 * Cost allocations are auto-filled from admin-defined defaults on the backend.
 */
export interface IncotermSelection {
    selectedIncoterm: IncotermType | '';
}

// Initialize the default values for each incoterm
export const defaultIncotermValues: Record<IncotermType, IncotermRowData> = {
    EXW: {

        'Origin Terminal Handling': 'Buyer',
        'Insurance': 'Buyer',
        'Carriage Charges': 'Buyer',
        'Unloading at Destination': 'Buyer',
    },
    FCA: {
        'Loading & Inland Delivery': 'Seller',
        'Insurance': 'Buyer',
        'Carriage Charges': 'Buyer',
        'Unloading at Destination': 'Buyer',
    },
    FAS: {
        'Insurance': 'Buyer',
        'Unloading at Destination': 'Buyer',
    },
    FOB: {
        'Insurance': 'Buyer',
        'Unloading at Destination': 'Buyer',
    },
    CFR: {
        'Insurance': 'Buyer',
        'Unloading at Destination': 'Buyer',
    },
    CIF: {
        'Insurance': 'Seller',
        'Unloading at Destination': 'Buyer',
    },
    CPT: {
        '*Destination Terminal Handling': 'Buyer',
        'Unloading at Destination': 'Buyer',
    },
    CIP: {
        'Insurance': 'Buyer',
        '*Destination Terminal Handling': 'Buyer',
        'Unloading at Destination': 'Buyer',

    },
    DAP: {
        'Insurance': 'Buyer',
        '*Destination Terminal Handling': 'Seller',
        'Unloading at Destination': 'Buyer',
    },
    DPU: {
        'Insurance': 'Buyer',
        '*Destination Terminal Handling': 'Seller',
    },
    DDP: {
        'Insurance': 'Buyer',
        '*Destination Terminal Handling': 'Seller',
        'Unloading at Destination': 'Buyer',
    },
};
