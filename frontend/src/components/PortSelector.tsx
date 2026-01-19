import React, { useEffect, useState, useMemo } from 'react';
import { getPorts, Port, PortType, Country } from '../services/content.service';
import SelectField from './SelectField';
import { Ship, Plane, Truck } from 'lucide-react';

interface PortSelectorProps {
  name?: string;
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onPortSelect?: (port: Port | null) => void;
  countryId?: string;
  type?: PortType;
  className?: string;
  wrapperClassName?: string;
  disabled?: boolean;
  placeholder?: string;
  showTypeBadge?: boolean;
}

/**
 * PortSelector
 *
 * A dynamic dropdown for selecting ports.
 * Fetches ports from the admin-managed content API.
 *
 * Features:
 * - Cascades from country selection
 * - Optional type filter (sea, air, land)
 * - Shows port type badge with icons
 *
 * Usage:
 * <PortSelector
 *   name="port"
 *   value={port}
 *   onChange={handleChange}
 *   countryId={selectedCountryId}
 *   type="sea" // optional filter
 * />
 */
const PortSelector: React.FC<PortSelectorProps> = ({
  name,
  value,
  onChange,
  onPortSelect,
  countryId,
  type,
  className = '',
  wrapperClassName = '',
  disabled = false,
  placeholder = 'Select Port',
  showTypeBadge = true,
}) => {
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch ports when country or type changes
  useEffect(() => {
    const fetchPorts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPorts(countryId, type);
        setPorts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load ports');
      } finally {
        setLoading(false);
      }
    };

    fetchPorts();
  }, [countryId, type]);

  // Group ports by type for display
  const groupedPorts = useMemo(() => {
    const groups: Record<PortType, Port[]> = {
      sea: [],
      air: [],
      land: [],
    };

    ports.forEach((port) => {
      if (groups[port.type]) {
        groups[port.type].push(port);
      }
    });

    return groups;
  }, [ports]);

  // Get type icon
  const getTypeIcon = (portType: PortType) => {
    switch (portType) {
      case 'sea':
        return <Ship className="w-4 h-4" />;
      case 'air':
        return <Plane className="w-4 h-4" />;
      case 'land':
        return <Truck className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // Get type label
  const getTypeLabel = (portType: PortType): string => {
    switch (portType) {
      case 'sea':
        return 'Sea Ports';
      case 'air':
        return 'Airports';
      case 'land':
        return 'Land Ports';
      default:
        return 'Ports';
    }
  };

  // Get type badge color
  const getTypeBadgeClass = (portType: PortType): string => {
    switch (portType) {
      case 'sea':
        return 'bg-blue-100 text-blue-700';
      case 'air':
        return 'bg-purple-100 text-purple-700';
      case 'land':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Handle port selection
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e);
    const selectedPort = ports.find((p) => p.code === e.target.value || p.name === e.target.value);
    onPortSelect?.(selectedPort || null);
  };

  // Format port option
  const formatPortOption = (port: Port): string => {
    const countryName =
      typeof port.country === 'object' ? (port.country as Country).name : '';
    const cityPart = port.city ? `, ${port.city}` : '';
    const countryPart = countryName ? ` (${countryName})` : '';
    return `${port.name}${cityPart}${countryPart}`;
  };

  if (loading) {
    return (
      <div className={wrapperClassName}>
        <div
          className={`w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 animate-pulse ${className}`}
        >
          Loading ports...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={wrapperClassName}>
        <div
          className={`w-full px-4 py-3 border border-red-300 rounded-lg bg-red-50 text-red-500 text-sm ${className}`}
        >
          {error}
        </div>
      </div>
    );
  }

  // If a specific type filter is applied, show simple select
  if (type) {
    return (
      <SelectField
        name={name}
        value={value}
        onChange={handleChange}
        disabled={disabled || ports.length === 0}
        wrapperClassName={wrapperClassName}
        className={className}
        placeholder={ports.length === 0 ? 'No ports available' : placeholder}
      >
        <option value="">{ports.length === 0 ? 'No ports available' : placeholder}</option>
        {ports.map((port) => (
          <option key={port._id} value={port.code}>
            {formatPortOption(port)}
          </option>
        ))}
      </SelectField>
    );
  }

  // Show grouped ports by type
  const hasAnyPorts = ports.length > 0;

  return (
    <div className={wrapperClassName}>
      <select
        name={name}
        value={value}
        onChange={handleChange}
        disabled={disabled || !hasAnyPorts}
        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C4A962] focus:border-transparent outline-none transition-all ${className}`}
      >
        <option value="">{hasAnyPorts ? placeholder : 'No ports available'}</option>
        {(Object.keys(groupedPorts) as PortType[]).map((portType) => {
          const typePorts = groupedPorts[portType];
          if (typePorts.length === 0) return null;

          return (
            <optgroup key={portType} label={getTypeLabel(portType)}>
              {typePorts.map((port) => (
                <option key={port._id} value={port.code}>
                  {formatPortOption(port)}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
    </div>
  );
};

// Export a compact version for inline display with type badge
export const PortBadge: React.FC<{ port: Port }> = ({ port }) => {
  const getTypeIcon = (portType: PortType) => {
    switch (portType) {
      case 'sea':
        return <Ship className="w-3 h-3" />;
      case 'air':
        return <Plane className="w-3 h-3" />;
      case 'land':
        return <Truck className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getBadgeClass = (portType: PortType): string => {
    switch (portType) {
      case 'sea':
        return 'bg-blue-100 text-blue-700';
      case 'air':
        return 'bg-purple-100 text-purple-700';
      case 'land':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeClass(port.type)}`}
    >
      {getTypeIcon(port.type)}
      {port.name}
    </span>
  );
};

export default PortSelector;
