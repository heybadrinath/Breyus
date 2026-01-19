import React, { useEffect, useState, useMemo } from 'react';
import { getUnits, getUnitsGrouped, Unit, UnitType, UnitsGrouped, formatUnitOption } from '../services/content.service';
import SelectField from './SelectField';

interface UnitSelectorProps {
  name?: string;
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  type?: UnitType;
  grouped?: boolean;
  className?: string;
  wrapperClassName?: string;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * UnitSelector
 *
 * A dynamic dropdown for selecting measurement units.
 * Fetches units from the admin-managed content API.
 *
 * Features:
 * - Optional type filter (weight, volume, count, length, area)
 * - Grouped mode shows units organized by type
 * - Displays unit name with symbol: "Kilogram (kg)"
 *
 * Usage:
 * <UnitSelector
 *   name="stockUnit"
 *   value={stockUnit}
 *   onChange={handleChange}
 *   type="weight" // optional filter
 * />
 */
const UnitSelector: React.FC<UnitSelectorProps> = ({
  name,
  value,
  onChange,
  type,
  grouped = false,
  className = '',
  wrapperClassName = '',
  disabled = false,
  placeholder = 'Select Unit',
}) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [groupedUnits, setGroupedUnits] = useState<UnitsGrouped | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch units on mount or when type changes
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setLoading(true);
        setError(null);

        if (grouped && !type) {
          const data = await getUnitsGrouped();
          setGroupedUnits(data);
        } else {
          const data = await getUnits(type);
          setUnits(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load units');
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
  }, [type, grouped]);

  // Generate options for non-grouped display
  const unitOptions = useMemo(() => {
    return units.map((unit) => ({
      value: unit.code.toLowerCase(),
      label: formatUnitOption(unit),
    }));
  }, [units]);

  // Type labels for grouped display
  const typeLabels: Record<UnitType, string> = {
    weight: 'Weight',
    volume: 'Volume',
    count: 'Count/Quantity',
    length: 'Length',
    area: 'Area',
  };

  // Check if inline styling is requested (no border, for combined input/select fields)
  const isInline = className.includes('!border-0') || className.includes('border-l');

  // Base styles - different for inline vs standalone
  const baseSelectStyles = isInline
    ? `w-full h-full px-3 py-3 outline-none transition-all cursor-pointer appearance-none ${className}`
    : `w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C4A962] focus:border-transparent outline-none transition-all ${className}`;

  if (loading) {
    return (
      <div className={wrapperClassName}>
        <select
          disabled
          className={isInline ? `w-full h-full px-3 py-3 bg-gray-50 text-gray-500 ${className}` : `w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 ${className}`}
        >
          <option>Loading...</option>
        </select>
      </div>
    );
  }

  if (error) {
    return (
      <div className={wrapperClassName}>
        <select
          disabled
          className={`w-full px-4 py-3 border border-red-300 rounded-lg bg-red-50 text-red-500 ${className}`}
        >
          <option>Error loading units</option>
        </select>
      </div>
    );
  }

  // Grouped display with optgroups
  if (grouped && groupedUnits) {
    return (
      <div className={wrapperClassName}>
        <select
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={baseSelectStyles}
        >
          <option value="">{placeholder}</option>
          {(Object.keys(groupedUnits) as UnitType[]).map((unitType) => {
            const typeUnits = groupedUnits[unitType];
            if (typeUnits.length === 0) return null;

            return (
              <optgroup key={unitType} label={typeLabels[unitType]}>
                {typeUnits.map((unit) => (
                  <option key={unit._id} value={unit.code.toLowerCase()}>
                    {formatUnitOption(unit)}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </div>
    );
  }

  // For inline styling, use native select for better control
  if (isInline) {
    return (
      <div className={wrapperClassName}>
        <select
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={baseSelectStyles}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {unitOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Standard display using SelectField
  return (
    <SelectField
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      wrapperClassName={wrapperClassName}
      className={className}
      placeholder={placeholder}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {unitOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </SelectField>
  );
};

export default UnitSelector;
