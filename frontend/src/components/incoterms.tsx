import React, { ReactNode, useEffect, useState } from 'react';

type Trader = 'Buyer' | 'Seller';

// Define all possible incoterms
type IncotermType = 'EXW' | 'FCA' | 'FAS' | 'FOB' | 'CFR' | 'CIF' | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP';

// Define all possible row names
type RowName = 
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
interface IncotermRowData {
  [key: string]: Trader;
}

// Main incoterms state interface
interface IncotermsState {
  // The currently selected incoterm column
  selectedIncoterm: IncotermType | '';
  
  // Data for only the selected incoterm (not all incoterms)
  selectedIncotermData: IncotermRowData;
  
  // Default values for each incoterm (for reference)
  defaults: Record<IncotermType, IncotermRowData>;
}

interface IncotermsProps {
  incoterms: IncotermsState;
  setIncoterms: React.Dispatch<React.SetStateAction<IncotermsState>>;  
}

const Incoterms: React.FC<IncotermsProps> = ({incoterms, setIncoterms}) => {
  // Use the selectedIncoterm from the parent state instead of local state
  const selectedIncoterm = incoterms.selectedIncoterm;

  const addIncoterm = (key: IncotermType, value: IncotermRowData) => {
    setIncoterms((prevState) => ({
      ...prevState,         
      selectedIncotermData: value
    }));
  };

  // Remove the removeIncoterm function as it's not needed for this use case

  const FlipableButton = ({ 
    defaultTrader, 
    onClick, 
    disabled, 
    rowName, 
    incotermName 
  }: { 
    defaultTrader: string, 
    onClick: () => void, 
    disabled?: boolean,
    rowName: RowName,
    incotermName: IncotermType
  }) => {
    // Only use selectedIncotermData if this is the currently selected column
    // Otherwise, use the default value from defaults
    const currentValue = incotermName === selectedIncoterm 
      ? (incoterms.selectedIncotermData[rowName] || defaultTrader)
      : (incoterms.defaults[incotermName]?.[rowName] || defaultTrader);
    
    const handleClick = () => {
      // Only allow changes if this is the selected column
      if (incotermName !== selectedIncoterm) {
        return;
      }
      
      const newValue = currentValue === 'Buyer' ? 'Seller' : 'Buyer';
      
      // Update the state with the new value for the selected incoterm
      setIncoterms(prevState => ({
        ...prevState,
        selectedIncotermData: {
          ...prevState.selectedIncotermData,
          [rowName]: newValue
        }
      }));
      
      onClick();
    };

    return (
      <button
        disabled={disabled}
        className={`w-full ${(!disabled) ? 'cursor-pointer hover:scale-[1.03]' : 'cursor-not-allowed opacity-80'} py-3 px-2 flex items-center justify-center text-xs font-medium transition-all duration-150 ease-in-out rounded-md border border-transparent text-gray-900 ${(currentValue === 'Buyer') ? 'bg-[#F3E7DD]' : (currentValue === 'Seller') ? 'bg-[#DDF6F7]' : 'bg-[#FDE68A]'}`}
        onClick={handleClick}>
        <p className='mx-auto flex items-center gap-2'>{currentValue}
          <svg width="12" height="12" className='h-3 w-3' viewBox="0 0 7 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M3.245 0.0108658C3.76277 -0.03332 4.28313 0.0577431 4.75512 0.275135C5.22711 0.492527 5.63454 0.828792 5.9375 1.25099V0.656241C5.9375 0.581649 5.96713 0.510112 6.01988 0.457367C6.07262 0.404622 6.14416 0.374991 6.21875 0.374991C6.29334 0.374991 6.36488 0.404622 6.41762 0.457367C6.47037 0.510112 6.5 0.581649 6.5 0.656241V2.24999H4.90625C4.83166 2.24999 4.76012 2.22036 4.70738 2.16761C4.65463 2.11487 4.625 2.04333 4.625 1.96874C4.625 1.89415 4.65463 1.82261 4.70738 1.76987C4.76012 1.71712 4.83166 1.68749 4.90625 1.68749H5.55387C5.29742 1.28621 4.92903 0.968836 4.49421 0.774587C4.05939 0.580338 3.57719 0.517718 3.10718 0.594465C2.63717 0.671211 2.19994 0.88396 1.84949 1.20643C1.49905 1.5289 1.25074 1.94697 1.13525 2.40899C1.12673 2.44528 1.11108 2.47952 1.08921 2.50971C1.06734 2.5399 1.03969 2.56545 1.00786 2.58485C0.976031 2.60426 0.940661 2.61715 0.903807 2.62276C0.866952 2.62838 0.829349 2.62661 0.793184 2.61756C0.757019 2.60852 0.723014 2.59237 0.693145 2.57006C0.663276 2.54775 0.638141 2.51973 0.619199 2.48762C0.600258 2.45551 0.587889 2.41996 0.582812 2.38303C0.577735 2.34609 0.580051 2.30852 0.589625 2.27249C0.741329 1.6659 1.07878 1.12187 1.5548 0.716446C2.03082 0.311021 2.62162 0.0644648 3.24462 0.0112408L3.245 0.0108658ZM1.97 5.58037C2.37199 5.81863 2.82409 5.9597 3.29026 5.99231C3.75642 6.02493 4.22375 5.94819 4.65501 5.76822C5.08627 5.58825 5.46952 5.31003 5.77421 4.95572C6.07891 4.60142 6.29662 4.18083 6.41 3.72749C6.42688 3.65556 6.41479 3.57988 6.37632 3.5168C6.33786 3.45372 6.27612 3.40831 6.20445 3.39038C6.13278 3.37245 6.05693 3.38344 5.99329 3.42098C5.92966 3.45852 5.88335 3.51959 5.86438 3.59099C5.74882 4.05291 5.5005 4.47087 5.15009 4.79326C4.79968 5.11565 4.36251 5.32835 3.89258 5.40509C3.42265 5.48183 2.94053 5.41925 2.50577 5.22508C2.071 5.03091 1.70262 4.71366 1.44613 4.31249H2.09375C2.16834 4.31249 2.23988 4.28286 2.29262 4.23011C2.34537 4.17737 2.375 4.10583 2.375 4.03124C2.375 3.95665 2.34537 3.88511 2.29262 3.83237C2.23988 3.77962 2.16834 3.74999 2.09375 3.74999H0.5V5.34374C0.5 5.41833 0.529632 5.48987 0.582376 5.54261C0.635121 5.59536 0.706658 5.62499 0.78125 5.62499C0.855842 5.62499 0.927379 5.59536 0.980124 5.54261C1.03287 5.48987 1.0625 5.41833 1.0625 5.34374V4.74899C1.30429 5.08585 1.61329 5.36894 1.97 5.58037Z" fill="black" />
          </svg> </p>

      </button>
    );
  }

  const DisabledColumnTableHeader = ({ children, term }: { children: ReactNode, term: IncotermType }) => {
    return (
      <th className={`bg-[#1F2937] text-white border border-[#2f2f2f] px-2 py-2 text-[11px] font-semibold text-center align-middle tracking-wide ${(selectedIncoterm === '' || term === selectedIncoterm) ? 'opacity-100' : 'opacity-30'}`}>
        <div className="flex items-center justify-center gap-2">
          {children}
        </div>
      </th>
    );
  }

  const DisabledColumnTableData = ({ children, term }: { children: ReactNode, term: IncotermType }) => {
    return (
      <td className={`bg-[#F8FAFC] text-gray-700 border border-gray-200 px-3 py-3 text-left align-top text-[11px] leading-relaxed ${(selectedIncoterm === '' || term === selectedIncoterm) ? 'opacity-100' : 'opacity-40'}`}>
        {children}
      </td>
    );
  }

  const DisabledColumnTable = ({ children, term }: { children: ReactNode, term: IncotermType }) => {
    return (
      <td className={`border border-gray-200 text-center align-top px-2 py-2 text-[11px] font-medium text-gray-800 bg-white ${(selectedIncoterm === '' || term === selectedIncoterm) ? 'opacity-100' : 'opacity-40'}`}>
        {children}
      </td>
    );
  }

  const handleCheckboxChange = (term: IncotermType): void => {
    const newSelectedTerm = selectedIncoterm === term ? '' : term;
    
    if (newSelectedTerm) {
      // When selecting a new incoterm, initialize it with default values
      setIncoterms(prevState => ({
        ...prevState,
        selectedIncoterm: newSelectedTerm,
        selectedIncotermData: prevState.defaults[newSelectedTerm] || {}
      }));
    } else {
      // When deselecting, clear the selected data
      setIncoterms(prevState => ({
        ...prevState,
        selectedIncoterm: '',
        selectedIncotermData: {}
      }));
    }
  };

  // useEffect(() => {
  //   setSelectedIncoterm((!selectedIncoterm)?incoterms.term: selectedIncoterm)
  //   addIncoterm("term", selectedIncoterm)
  // },[selectedIncoterm])

  const rowHeaderClassName = 'bg-[#111827] text-white border border-[#2f2f2f] px-2 py-3 text-left text-[11px] font-semibold leading-snug w-36 sticky left-0 z-20 break-words';

  return (
    <div className="w-full my-0">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-0">
        <div className="overflow-x-auto">
          <table className="min-w-[1680px] w-full table-fixed border-separate border-spacing-0 text-[11px] bg-white">
        <thead>
          <tr>
            <th rowSpan={2} className="bg-[#111827] text-white px-2 py-3 border border-[#2f2f2f] rounded-tl-lg w-36 sticky left-0 z-30"></th>
            <th colSpan={2} className="bg-[#111827] text-white px-2 py-2 border border-[#2f2f2f] text-[11px] font-semibold uppercase tracking-wide">Any Transport mode</th>
            <th colSpan={6} className="bg-[#111827] text-white px-2 py-2 border border-[#2f2f2f] text-[11px] font-semibold uppercase tracking-wide">Sea/Inland Waterway Transport</th>
            <th colSpan={3} className="bg-[#111827] text-white px-2 py-2 border border-[#2f2f2f] rounded-tr-lg text-[11px] font-semibold uppercase tracking-wide">Any Transport mode</th>
          </tr>
          <tr>
            <DisabledColumnTableHeader term='EXW'>{<input onChange={() => handleCheckboxChange("EXW")} checked={selectedIncoterm === 'EXW'} className='mr-1 border-white !accent-white' type='checkbox' />} EXW </DisabledColumnTableHeader>
            <DisabledColumnTableHeader term='FCA'>{<input onChange={() => handleCheckboxChange("FCA")} checked={selectedIncoterm === 'FCA'} className='mr-1 border-white !accent-white' type='checkbox' />} FCA </DisabledColumnTableHeader>
            <DisabledColumnTableHeader term='FAS'>{<input onChange={() => handleCheckboxChange("FAS")} checked={selectedIncoterm === 'FAS'} className='mr-1 border-white !accent-white' type='checkbox' />} FAS</DisabledColumnTableHeader>
            <DisabledColumnTableHeader term='FOB'>{<input onChange={() => handleCheckboxChange("FOB")} checked={selectedIncoterm === 'FOB'} className='mr-1 border-white !accent-white' type='checkbox' />} FOB</DisabledColumnTableHeader>
            <DisabledColumnTableHeader term='CFR'>{<input onChange={() => handleCheckboxChange("CFR")} checked={selectedIncoterm === 'CFR'} className='mr-1 border-white !accent-white' type='checkbox' />} CFR</DisabledColumnTableHeader>
            <DisabledColumnTableHeader term='CIF'>{<input onChange={() => handleCheckboxChange("CIF")} checked={selectedIncoterm === 'CIF'} className='mr-1 border-white !accent-white' type='checkbox' />} CIF</DisabledColumnTableHeader>
            <DisabledColumnTableHeader term='CPT'>{<input onChange={() => handleCheckboxChange("CPT")} checked={selectedIncoterm === 'CPT'} className='mr-1 border-white !accent-white' type='checkbox' />} CPT</DisabledColumnTableHeader>
            <DisabledColumnTableHeader term='CIP'>{<input onChange={() => handleCheckboxChange("CIP")} checked={selectedIncoterm === 'CIP'} className='mr-1 border-white !accent-white' type='checkbox' />} CIP</DisabledColumnTableHeader>
            <DisabledColumnTableHeader term='DAP'>{<input onChange={() => handleCheckboxChange("DAP")} checked={selectedIncoterm === 'DAP'} className='mr-1 border-white !accent-white' type='checkbox' />} DAP</DisabledColumnTableHeader>
            <DisabledColumnTableHeader term='DPU'>{<input onChange={() => handleCheckboxChange("DPU")} checked={selectedIncoterm === 'DPU'} className='mr-1 border-white !accent-white' type='checkbox' />} DPU</DisabledColumnTableHeader>
            <DisabledColumnTableHeader term='DDP'>{<input onChange={() => handleCheckboxChange("DDP")} checked={selectedIncoterm === 'DDP'} className='mr-1 border-white !accent-white' type='checkbox' />} DDP</DisabledColumnTableHeader>
          </tr>
        </thead>
        <tbody>
          {/* Row 1: Charges/Fees */}
          <tr>
            <td className={rowHeaderClassName}>Charges/Fees</td>
            <DisabledColumnTableData term='EXW'>Ex Works</DisabledColumnTableData>
            <DisabledColumnTableData term='FCA'>Free Carrier</DisabledColumnTableData>
            <DisabledColumnTableData term='FAS'>Free Alongside Ship</DisabledColumnTableData>
            <DisabledColumnTableData term='FOB'>Free On Board</DisabledColumnTableData>
            <DisabledColumnTableData term='CFR'>Cost & Freight</DisabledColumnTableData>
            <DisabledColumnTableData term='CIF'>Cost Insurance & Freight</DisabledColumnTableData>
            <DisabledColumnTableData term='CPT'>Carriage Paid To</DisabledColumnTableData>
            <DisabledColumnTableData term='CIP'>Carriage Insurance Paid To</DisabledColumnTableData>
            <DisabledColumnTableData term='DAP'>Delivered at Place</DisabledColumnTableData>
            <DisabledColumnTableData term='DPU'>Delivered at Place Unloaded</DisabledColumnTableData>
            <DisabledColumnTableData term='DDP'>Delivered Duty Paid</DisabledColumnTableData>
          </tr>
          {/* Row 2: Transfer of Risk */}
          <tr>
            <td className={rowHeaderClassName}>Transfer of risk</td>
            <DisabledColumnTableData term='EXW'>when seller places the goods at the buyer's disposal at a namedplace</DisabledColumnTableData>
            <DisabledColumnTableData term='FCA'>1) When seller loads goods to the buyer’s carrier 2) When goods are at the buyer’s disposal & ready for unloading at a named place</DisabledColumnTableData>
            <DisabledColumnTableData term='FAS'>when the goods are handed over to the seller’s nominated carrier at a named place</DisabledColumnTableData>
            <DisabledColumnTableData term='FOB'>when goods are alongside the vessel nominated by the buyer at named port</DisabledColumnTableData>
            <DisabledColumnTableData term='CFR'>when goods are on board the vessel nominated by the seller at named port</DisabledColumnTableData>
            <DisabledColumnTableData term='CIF'>when the goods are on board the vessel nominated by the seller at origin</DisabledColumnTableData>
            <DisabledColumnTableData term='CPT'>when the goods are handed over to the seller's nominated carrier at a named place</DisabledColumnTableData>
            <DisabledColumnTableData term='CIP'>when the goods are handed over to the seller’s nominated carrier at a named place</DisabledColumnTableData>
            <DisabledColumnTableData term='DAP'>when the goods are placed at the buyer’s disposal at a named place or agreed point within that place</DisabledColumnTableData>
            <DisabledColumnTableData term='DPU'>when the goods are delivered and unloaded at a named place or agreed point within that place</DisabledColumnTableData>
            <DisabledColumnTableData term='DDP'>when the goods are placed at the buyer’s disposal at a named place or agreed point within that place</DisabledColumnTableData>
          </tr>
          {/* Row 3: Commercial Invoice */}
          <tr>
            <td className={rowHeaderClassName}>Commercial Invoice</td>
            <DisabledColumnTable term='EXW'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='FCA'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='FAS'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='FOB'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='CFR'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='CIF'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='CPT'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='CIP'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='DAP'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='DPU'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='DDP'>Seller</DisabledColumnTable>

          </tr>
          {/* Row 4: Packaging, Quality Control, Marking */}
          <tr>
            <td className={rowHeaderClassName}>Packaging, Quality Control, Marking</td>
            <DisabledColumnTable term='EXW'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='FCA'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='FAS'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='FOB'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='CFR'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='CIF'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='CPT'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='CIP'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='DAP'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='DPU'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='DDP'>Seller</DisabledColumnTable>

          </tr>
          {/* Row 5: Loading & Inland Delivery */}
          <tr>
            <td className={rowHeaderClassName}>Loading & Inland Delivery</td>
            <DisabledColumnTable term='EXW'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='FCA'><FlipableButton disabled={selectedIncoterm !== 'FCA'} onClick={() => { }} defaultTrader='Seller' rowName='Loading & Inland Delivery' incotermName='FCA' /></DisabledColumnTable>
            <DisabledColumnTable term='FAS'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='FOB'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='CFR'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='CIF'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='CPT'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='CIP'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='DAP'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='DPU'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='DDP'>Seller</DisabledColumnTable>

          </tr>
          {/* Row 6: Export Duty & Taxes */}
          <tr>
            <td className={rowHeaderClassName}>Export Duty & Taxes</td>
            <DisabledColumnTable term='EXW'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='FCA'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='FAS'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='FOB'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='CFR'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='CIF'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='CPT'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='CIP'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='DAP'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='DPU'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='DDP'>Seller</DisabledColumnTable>

          </tr>
          {/* Row 7: Origin Terminal Handling*/}
          <tr>
            <td className={rowHeaderClassName}>Origin Terminal Handling</td>
            <DisabledColumnTable term='EXW'><FlipableButton disabled={selectedIncoterm !== 'EXW'} onClick={() => { }} defaultTrader='Buyer' rowName='Origin Terminal Handling' incotermName='EXW' /></DisabledColumnTable>
            <DisabledColumnTable term='FCA'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='FAS'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='FOB'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='CFR'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='CIF'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='CPT'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='CIP'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='DAP'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='DPU'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='DDP'>Seller</DisabledColumnTable>

          </tr>
          {/* Row 8: Insurance*/}
          <tr>
            <td className={rowHeaderClassName}>Insurance</td>
            <DisabledColumnTable term='EXW'><FlipableButton disabled={selectedIncoterm !== 'EXW'} onClick={() => { }} defaultTrader='Buyer' rowName='Insurance' incotermName='EXW' /></DisabledColumnTable>
            <DisabledColumnTable term='FCA'><FlipableButton disabled={selectedIncoterm !== 'FCA'} onClick={() => { }} defaultTrader='Buyer' rowName='Insurance' incotermName='FCA' /></DisabledColumnTable>
            <DisabledColumnTable term='FAS'><FlipableButton disabled={selectedIncoterm !== 'FAS'} onClick={() => { }} defaultTrader='Buyer' rowName='Insurance' incotermName='FAS' /></DisabledColumnTable>
            <DisabledColumnTable term='FOB'><FlipableButton disabled={selectedIncoterm !== 'FOB'} onClick={() => { }} defaultTrader='Buyer' rowName='Insurance' incotermName='FOB' /></DisabledColumnTable>
            <DisabledColumnTable term='CFR'><FlipableButton disabled={selectedIncoterm !== 'CFR'} onClick={() => { }} defaultTrader='Buyer' rowName='Insurance' incotermName='CFR' /></DisabledColumnTable>
            <DisabledColumnTable term='CIF'><FlipableButton disabled={selectedIncoterm !== 'CIF'} onClick={() => { }} defaultTrader='Buyer' rowName='Insurance' incotermName='CIF' /></DisabledColumnTable>
            <DisabledColumnTable term='CPT'>Seller "All Risk"</DisabledColumnTable>
            <DisabledColumnTable term='CIP'><FlipableButton disabled={selectedIncoterm !== 'CIP'} onClick={() => { }} defaultTrader='Buyer' rowName='Insurance' incotermName='CIP' /></DisabledColumnTable>
            <DisabledColumnTable term='DAP'><FlipableButton disabled={selectedIncoterm !== 'DAP'} onClick={() => { }} defaultTrader='Buyer' rowName='Insurance' incotermName='DAP' /></DisabledColumnTable>
            <DisabledColumnTable term='DPU'><FlipableButton disabled={selectedIncoterm !== 'DPU'} onClick={() => { }} defaultTrader='Buyer' rowName='Insurance' incotermName='DPU' /></DisabledColumnTable>
            <DisabledColumnTable term='DDP'><FlipableButton disabled={selectedIncoterm !== 'DDP'} onClick={() => { }} defaultTrader='Buyer' rowName='Insurance' incotermName='DDP' /></DisabledColumnTable>

          </tr>
          {/* Row 9: Carriage Charges*/}
          <tr>
            <td className={rowHeaderClassName}>Carriage Charges</td>
            <DisabledColumnTable term='EXW'><FlipableButton disabled={selectedIncoterm !== 'EXW'} onClick={() => { }} defaultTrader='Buyer' rowName='Carriage Charges' incotermName='EXW' /></DisabledColumnTable>
            <DisabledColumnTable term='FCA'><FlipableButton disabled={selectedIncoterm !== 'FCA'} onClick={() => { }} defaultTrader='Buyer' rowName='Carriage Charges' incotermName='FCA' /></DisabledColumnTable>
            <DisabledColumnTable term='FAS'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='FOB'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='CFR'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='CIF'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='CPT'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='CIP'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='DAP'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='DPU'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='DDP'>Seller</DisabledColumnTable>

          </tr>
          {/* Row 10: *Destination Terminal Handling*/}
          <tr>
            <td className={rowHeaderClassName}>*Destination Terminal Handling</td>
            <DisabledColumnTable term='EXW'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='FCA'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='FAS'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='FOB'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='CFR'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='CIF'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='CPT'><FlipableButton disabled={selectedIncoterm !== 'CPT'} onClick={() => { }} defaultTrader='Buyer' rowName='*Destination Terminal Handling' incotermName='CPT' /></DisabledColumnTable>
            <DisabledColumnTable term='CIP'><FlipableButton disabled={selectedIncoterm !== 'CIP'} onClick={() => { }} defaultTrader='Buyer' rowName='*Destination Terminal Handling' incotermName='CIP' /></DisabledColumnTable>
            <DisabledColumnTable term='DAP'><FlipableButton disabled={selectedIncoterm !== 'DAP'} onClick={() => { }} defaultTrader='Seller' rowName='*Destination Terminal Handling' incotermName='DAP' /></DisabledColumnTable>
            <DisabledColumnTable term='DPU'><FlipableButton disabled={selectedIncoterm !== 'DPU'} onClick={() => { }} defaultTrader='Seller' rowName='*Destination Terminal Handling' incotermName='DPU' /></DisabledColumnTable>
            <DisabledColumnTable term='DDP'><FlipableButton disabled={selectedIncoterm !== 'DDP'} onClick={() => { }} defaultTrader='Seller' rowName='*Destination Terminal Handling' incotermName='DDP' /></DisabledColumnTable>

          </tr>
          {/* Row 11: Delivery to Destination*/}
          <tr>
            <td className={rowHeaderClassName}>Delivery to Destination</td>
            <DisabledColumnTable term='EXW'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='FCA'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='FAS'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='FOB'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='CFR'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='CIF'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='CPT'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='CIP'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='DAP'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='DPU'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='DDP'>Seller</DisabledColumnTable>

          </tr>
          {/* Row 12: Unloading at Destination*/}
          <tr>
            <td className={rowHeaderClassName}>Unloading at Destination</td>
            <DisabledColumnTable term='EXW'><FlipableButton disabled={selectedIncoterm !== 'EXW'} onClick={() => { }} defaultTrader='Buyer' rowName='Unloading at Destination' incotermName='EXW' /></DisabledColumnTable>
            <DisabledColumnTable term='FCA'><FlipableButton disabled={selectedIncoterm !== 'FCA'} onClick={() => { }} defaultTrader='Buyer' rowName='Unloading at Destination' incotermName='FCA' /></DisabledColumnTable>
            <DisabledColumnTable term='FAS'><FlipableButton disabled={selectedIncoterm !== 'FAS'} onClick={() => { }} defaultTrader='Buyer' rowName='Unloading at Destination' incotermName='FAS' /></DisabledColumnTable>
            <DisabledColumnTable term='FOB'><FlipableButton disabled={selectedIncoterm !== 'FOB'} onClick={() => { }} defaultTrader='Buyer' rowName='Unloading at Destination' incotermName='FOB' /></DisabledColumnTable>
            <DisabledColumnTable term='CFR'><FlipableButton disabled={selectedIncoterm !== 'CFR'} onClick={() => { }} defaultTrader='Buyer' rowName='Unloading at Destination' incotermName='CFR' /></DisabledColumnTable>
            <DisabledColumnTable term='CIF'><FlipableButton disabled={selectedIncoterm !== 'CIF'} onClick={() => { }} defaultTrader='Buyer' rowName='Unloading at Destination' incotermName='CIF' /></DisabledColumnTable>
            <DisabledColumnTable term='CPT'><FlipableButton disabled={selectedIncoterm !== 'CPT'} onClick={() => { }} defaultTrader='Buyer' rowName='Unloading at Destination' incotermName='CPT' /></DisabledColumnTable>
            <DisabledColumnTable term='CIP'><FlipableButton disabled={selectedIncoterm !== 'CIP'} onClick={() => { }} defaultTrader='Buyer' rowName='Unloading at Destination' incotermName='CIP' /></DisabledColumnTable>
            <DisabledColumnTable term='DAP'><FlipableButton disabled={selectedIncoterm !== 'DAP'} onClick={() => { }} defaultTrader='Buyer' rowName='Unloading at Destination' incotermName='DAP' /></DisabledColumnTable>
            <DisabledColumnTable term='DPU'>Seller</DisabledColumnTable>
            <DisabledColumnTable term='DDP'><FlipableButton disabled={selectedIncoterm !== 'DDP'} onClick={() => { }} defaultTrader='Buyer' rowName='Unloading at Destination' incotermName='DDP' /></DisabledColumnTable>

          </tr>
          {/* Row 13: Import Duty & Taxes*/}
          <tr>
            <td className={rowHeaderClassName}>Import Duty & Taxes</td>
            <DisabledColumnTable term='EXW'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='FCA'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='FAS'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='FOB'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='CFR'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='CIF'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='CPT'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='CIP'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='DAP'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='DPU'>Buyer</DisabledColumnTable>
            <DisabledColumnTable term='DDP'>Seller</DisabledColumnTable>

          </tr>
        </tbody>
      </table>
        </div>
      </div>
    </div>
  );
};

export { Incoterms };
