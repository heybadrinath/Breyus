import React, { ReactNode, useEffect, useState } from 'react';
import { getIncoterms, Incoterm as BackendIncoterm } from '../services/content.service';

type Trader = 'Buyer' | 'Seller';

// Define all possible incoterms
type IncotermType = 'EXW' | 'FCA' | 'FAS' | 'FOB' | 'CFR' | 'CIF' | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP';

// Define the structure for each incoterm row
interface IncotermRowData {
  [key: string]: Trader;
}

// Main incoterms state interface
interface IncotermsState {
  selectedIncoterm: IncotermType | '';
  selectedIncotermData: IncotermRowData;
  defaults: Record<IncotermType, IncotermRowData>;
}

interface IncotermsProps {
  incoterms: IncotermsState;
  setIncoterms: React.Dispatch<React.SetStateAction<IncotermsState>>;
  readOnly?: boolean;
}

// Incoterm order for display
const INCOTERM_ORDER: IncotermType[] = ['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'];

// Map backend costAllocation keys to display row names
const COST_ALLOCATION_ROWS: { key: string; label: string }[] = [
  { key: 'commercialInvoice', label: 'Commercial Invoice' },
  { key: 'packagingQualityControl', label: 'Packaging, Quality Control, Marking' },
  { key: 'loadingInlandDelivery', label: 'Loading & Inland Delivery' },
  { key: 'exportDutyTaxes', label: 'Export Duty & Taxes' },
  { key: 'originTerminalHandling', label: 'Origin Terminal Handling' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'carriageCharges', label: 'Carriage Charges' },
  { key: 'destinationTerminalHandling', label: '*Destination Terminal Handling' },
  { key: 'deliveryToDestination', label: 'Delivery to Destination' },
  { key: 'unloadingAtDestination', label: 'Unloading at Destination' },
  { key: 'importDutyTaxes', label: 'Import Duty & Taxes' },
];

const Incoterms: React.FC<IncotermsProps> = ({ incoterms, setIncoterms, readOnly = true }) => {
  const [backendIncoterms, setBackendIncoterms] = useState<BackendIncoterm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Read selectedIncoterm directly from props on every render
  const selectedIncoterm = incoterms?.selectedIncoterm || '';

  // Fetch incoterms from backend on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getIncoterms();
        setBackendIncoterms(data);

        // Build defaults from backend data and update parent state (only if not readOnly)
        if (!readOnly) {
          const defaults: Record<string, IncotermRowData> = {};
          data.forEach((incoterm) => {
            const rowData: IncotermRowData = {};
            if (incoterm.costAllocation) {
              COST_ALLOCATION_ROWS.forEach(({ key, label }) => {
                const value = (incoterm.costAllocation as Record<string, string>)[key];
                if (value) {
                  rowData[label] = value as Trader;
                }
              });
            }
            defaults[incoterm.code] = rowData;
          });

          setIncoterms((prev) => ({
            ...prev,
            defaults: defaults as Record<IncotermType, IncotermRowData>,
          }));
        }
      } catch (err) {
        console.error('Failed to fetch incoterms:', err);
        setError('Failed to load incoterms data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [readOnly]);

  // Create a map for quick lookup
  const incotermMap = new Map(backendIncoterms.map((i) => [i.code, i]));

  // Get value for a cell from backend data
  const getCellValue = (incotermCode: IncotermType, costKey: string, rowLabel: string): Trader => {
    // If this is the selected incoterm, check selectedIncotermData first
    if (incotermCode === selectedIncoterm && incoterms.selectedIncotermData[rowLabel]) {
      return incoterms.selectedIncotermData[rowLabel];
    }
    // Otherwise get from backend data
    const incoterm = incotermMap.get(incotermCode);
    if (incoterm?.costAllocation) {
      return ((incoterm.costAllocation as Record<string, string>)[costKey] as Trader) || 'Buyer';
    }
    return 'Buyer';
  };

  const handleCheckboxChange = (term: IncotermType): void => {
    const newSelectedTerm = selectedIncoterm === term ? '' : term;

    if (newSelectedTerm) {
      setIncoterms((prevState) => ({
        ...prevState,
        selectedIncoterm: newSelectedTerm,
        selectedIncotermData: prevState.defaults[newSelectedTerm] || {},
      }));
    } else {
      setIncoterms((prevState) => ({
        ...prevState,
        selectedIncoterm: '',
        selectedIncotermData: {},
      }));
    }
  };

  // Cell component that displays colored Buyer/Seller value
  const CostCell = ({ incotermCode, costKey, rowLabel }: { incotermCode: IncotermType; costKey: string; rowLabel: string }) => {
    const value = getCellValue(incotermCode, costKey, rowLabel);
    const bgColor = value === 'Buyer' ? 'bg-[#F3E7DD]' : 'bg-[#DDF6F7]';

    return (
      <div className={`w-full py-3 px-2 flex items-center justify-center text-xs font-medium rounded-md border border-transparent text-gray-900 ${bgColor}`}>
        <p className="mx-auto">{value}</p>
      </div>
    );
  };

  const DisabledColumnTableHeader = ({ children, term }: { children: ReactNode; term: IncotermType }) => {
    return (
      <th
        className={`bg-[#1F2937] text-white border border-[#2f2f2f] px-2 py-2 text-[11px] font-semibold text-center align-middle tracking-wide ${
          selectedIncoterm === '' || term === selectedIncoterm ? 'opacity-100' : 'opacity-30'
        }`}
      >
        <div className="flex items-center justify-center gap-2">{children}</div>
      </th>
    );
  };

  const DisabledColumnTableData = ({ children, term }: { children: ReactNode; term: IncotermType }) => {
    return (
      <td
        className={`bg-[#F8FAFC] text-gray-700 border border-gray-200 px-3 py-3 text-left align-top text-[11px] leading-relaxed ${
          selectedIncoterm === '' || term === selectedIncoterm ? 'opacity-100' : 'opacity-40'
        }`}
      >
        {children}
      </td>
    );
  };

  const DisabledColumnTable = ({ children, term }: { children: ReactNode; term: IncotermType }) => {
    return (
      <td
        className={`border border-gray-200 text-center align-top px-2 py-2 text-[11px] font-medium text-gray-800 bg-white ${
          selectedIncoterm === '' || term === selectedIncoterm ? 'opacity-100' : 'opacity-40'
        }`}
      >
        {children}
      </td>
    );
  };

  const rowHeaderClassName =
    'bg-[#111827] text-white border border-[#2f2f2f] px-2 py-3 text-left text-[11px] font-semibold leading-snug w-36 sticky left-0 z-20 break-words';

  if (loading) {
    return (
      <div className="w-full my-0 p-8 text-center">
        <p className="text-gray-500">Loading incoterms...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full my-0 p-8 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full my-0">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-0">
        <div className="overflow-x-auto">
          <table className="min-w-[1680px] w-full table-fixed border-separate border-spacing-0 text-[11px] bg-white">
            <thead>
              <tr>
                <th rowSpan={2} className="bg-[#111827] text-white px-2 py-3 border border-[#2f2f2f] rounded-tl-lg w-36 sticky left-0 z-30"></th>
                <th colSpan={2} className="bg-[#111827] text-white px-2 py-2 border border-[#2f2f2f] text-[11px] font-semibold uppercase tracking-wide">
                  Any Transport mode
                </th>
                <th colSpan={4} className="bg-[#111827] text-white px-2 py-2 border border-[#2f2f2f] text-[11px] font-semibold uppercase tracking-wide">
                  Sea/Inland Waterway Transport
                </th>
                <th colSpan={5} className="bg-[#111827] text-white px-2 py-2 border border-[#2f2f2f] rounded-tr-lg text-[11px] font-semibold uppercase tracking-wide">
                  Any Transport mode
                </th>
              </tr>
              <tr>
                {INCOTERM_ORDER.map((code) => (
                  <DisabledColumnTableHeader key={code} term={code}>
                    <input
                      onChange={() => handleCheckboxChange(code)}
                      checked={selectedIncoterm === code}
                      className="mr-1 border-white !accent-white"
                      type="checkbox"
                    />
                    {code}
                  </DisabledColumnTableHeader>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Row 1: Charges/Fees - Incoterm names from backend */}
              <tr>
                <td className={rowHeaderClassName}>Charges/Fees</td>
                {INCOTERM_ORDER.map((code) => {
                  const incoterm = incotermMap.get(code);
                  return (
                    <DisabledColumnTableData key={code} term={code}>
                      {incoterm?.name || code}
                    </DisabledColumnTableData>
                  );
                })}
              </tr>

              {/* Row 2: Transfer of Risk - from backend */}
              <tr>
                <td className={rowHeaderClassName}>Transfer of risk</td>
                {INCOTERM_ORDER.map((code) => {
                  const incoterm = incotermMap.get(code);
                  return (
                    <DisabledColumnTableData key={code} term={code}>
                      {incoterm?.riskTransferPoint || incoterm?.description || '-'}
                    </DisabledColumnTableData>
                  );
                })}
              </tr>

              {/* Dynamic cost allocation rows from backend */}
              {COST_ALLOCATION_ROWS.map(({ key, label }) => (
                <tr key={key}>
                  <td className={rowHeaderClassName}>{label}</td>
                  {INCOTERM_ORDER.map((code) => (
                    <DisabledColumnTable key={code} term={code}>
                      <CostCell incotermCode={code} costKey={key} rowLabel={label} />
                    </DisabledColumnTable>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export { Incoterms };
