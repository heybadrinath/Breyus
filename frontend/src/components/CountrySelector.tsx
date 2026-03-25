import React, { useEffect, useState, useMemo, useRef } from 'react';
import { getCountries, Country, Continent, formatCountryOption } from '../services/content.service';
import { ChevronDown, Search, X } from 'lucide-react';

interface CountrySelectorProps {
  name?: string;
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onCountrySelect?: (country: Country | null) => void;
  continent?: Continent;
  className?: string;
  wrapperClassName?: string;
  disabled?: boolean;
  placeholder?: string;
  searchable?: boolean;
}

/**
 * CountrySelector
 *
 * A dynamic dropdown for selecting countries.
 * Fetches countries from the admin-managed content API.
 *
 * Features:
 * - Shows flag emoji + country name
 * - Optional continent filter
 * - Searchable mode with type-to-filter
 *
 * Usage:
 * <CountrySelector
 *   name="country"
 *   value={country}
 *   onChange={handleChange}
 *   searchable
 * />
 */
const CountrySelector: React.FC<CountrySelectorProps> = ({
  name,
  value,
  onChange,
  onCountrySelect,
  continent,
  className = '',
  wrapperClassName = '',
  disabled = false,
  placeholder = 'Select Country',
  searchable = false,
}) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Searchable dropdown state
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch countries on mount or when continent changes
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCountries(continent);
        setCountries(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load countries');
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, [continent]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter countries based on search term
  const filteredCountries = useMemo(() => {
    if (!searchTerm) return countries;
    const term = searchTerm.toLowerCase();
    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(term) ||
        country.isoCode.toLowerCase().includes(term)
    );
  }, [countries, searchTerm]);

  // Get selected country display value
  const selectedCountry = useMemo(() => {
    return countries.find((c) => c.isoCode === value || c.name === value);
  }, [countries, value]);

  // Handle country selection in searchable mode
  const handleSelectCountry = (country: Country) => {
    const syntheticEvent = {
      target: { name, value: country.name },
    } as React.ChangeEvent<HTMLSelectElement>;
    onChange(syntheticEvent);
    onCountrySelect?.(country);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Handle clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    const syntheticEvent = {
      target: { name, value: '' },
    } as React.ChangeEvent<HTMLSelectElement>;
    onChange(syntheticEvent);
    onCountrySelect?.(null);
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className={wrapperClassName}>
        <div
          className={`w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 animate-pulse ${className}`}
        >
          Loading countries...
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

  // Searchable dropdown mode
  if (searchable) {
    return (
      <div ref={dropdownRef} className={`relative ${wrapperClassName}`}>
        {/* Trigger button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between focus:ring-2 focus:ring-[#C4A962] focus:border-transparent outline-none transition-all ${
            disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
          } ${className}`}
        >
          <span className={selectedCountry ? 'text-gray-900' : 'text-gray-400'}>
            {selectedCountry ? formatCountryOption(selectedCountry) : placeholder}
          </span>
          <div className="flex items-center gap-1">
            {selectedCountry && !disabled && (
              <X
                className="w-4 h-4 text-gray-400 hover:text-gray-600"
                onClick={handleClear}
              />
            )}
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-hidden">
            {/* Search input */}
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search countries..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-[#C4A962] focus:border-transparent outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Options list */}
            <div className="max-h-52 overflow-y-auto">
              {filteredCountries.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No countries found
                </div>
              ) : (
                filteredCountries.map((country) => (
                  <button
                    key={country._id}
                    type="button"
                    onClick={() => handleSelectCountry(country)}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                      selectedCountry?._id === country._id
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700'
                    }`}
                  >
                    {formatCountryOption(country)}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Standard select mode
  return (
    <div className={wrapperClassName}>
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C4A962] focus:border-transparent outline-none transition-all ${className}`}
      >
        <option value="">{placeholder}</option>
        {countries.map((country) => (
          <option key={country._id} value={country.name}>
            {formatCountryOption(country)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CountrySelector;
