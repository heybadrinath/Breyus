import React from 'react';

const ABBREVIATION_MAP: Record<string, string> = {
    PR: 'Purchase Request',
    PO: 'Purchase Order',
    SCO: 'Soft Corporate Offer',
    ICPO: 'Irrevocable Corporate Purchase Order',
    SPA: 'Sales Purchase Agreement',
    BoL: 'Bill of Lading',
    HSN: 'Harmonized System Nomenclature',
    MOQ: 'Minimum Order Quantity',
};

interface TradeAbbreviationProps {
    abbreviation: string;
    className?: string;
}

const TradeAbbreviation: React.FC<TradeAbbreviationProps> = ({ abbreviation, className = '' }) => {
    const fullName = ABBREVIATION_MAP[abbreviation];

    if (!fullName) {
        return <span className={className}>{abbreviation}</span>;
    }

    return (
        <span
            title={fullName}
            className={`border-b border-dotted border-gray-400 cursor-help ${className}`}
        >
            {abbreviation}
        </span>
    );
};

export default TradeAbbreviation;
