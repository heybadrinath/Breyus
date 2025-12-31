export const INCOTERM_OPTIONS = ['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'];

export const TRADE_STATUS_COLORS = {
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    COUNTERED: 'bg-blue-100 text-blue-800',
    BUYER_RESPONDED: 'bg-purple-100 text-purple-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    DEFAULT: 'bg-gray-100 text-gray-800'
};

export const getStatusColor = (status?: string): string => {
    switch (status) {
        case 'accepted': return TRADE_STATUS_COLORS.ACCEPTED;
        case 'rejected': return TRADE_STATUS_COLORS.REJECTED;
        case 'countered': return TRADE_STATUS_COLORS.COUNTERED;
        case 'buyer_responded': return TRADE_STATUS_COLORS.BUYER_RESPONDED;
        case 'pending': return TRADE_STATUS_COLORS.PENDING;
        default: return TRADE_STATUS_COLORS.DEFAULT;
    }
};
