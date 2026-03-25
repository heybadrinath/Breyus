/**
 * ComboboxDropdown Component
 *
 * A flexible autocomplete/combobox component that supports:
 * - Search/filter functionality
 * - Custom text input (with optional warning)
 * - Loading states
 * - Grouped options
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search, AlertCircle, Check, X, Loader2 } from 'lucide-react';

export interface ComboboxOption {
  value: string;
  label: string;
  subLabel?: string;
  group?: string;
  icon?: React.ReactNode;
  data?: any; // Additional data to pass with option
}

export interface ComboboxDropdownProps {
  /** Array of options to display */
  options: ComboboxOption[];
  /** Current value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string, option?: ComboboxOption) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Label for the dropdown */
  label?: string;
  /** Allow custom values not in the list */
  allowCustom?: boolean;
  /** Show warning when custom value is entered */
  showCustomWarning?: boolean;
  /** Custom warning message */
  customWarningMessage?: string;
  /** Whether the dropdown is disabled */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string;
  /** Additional class names */
  className?: string;
  /** Whether to group options */
  grouped?: boolean;
  /** Optional empty state message */
  emptyMessage?: string;
  /** Filter function - if not provided, uses default text filter */
  filterFunction?: (option: ComboboxOption, searchText: string) => boolean;
}

const ComboboxDropdown: React.FC<ComboboxDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select or search...',
  label,
  allowCustom = false,
  showCustomWarning = true,
  customWarningMessage = 'This value is not in our standard list',
  disabled = false,
  loading = false,
  error,
  className = '',
  grouped = false,
  emptyMessage = 'No options found',
  filterFunction,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Check if current value is a custom value (not in options)
  const isCustomValue = value && !options.some(opt => opt.value === value || opt.label.toLowerCase() === value.toLowerCase());

  // Default filter function
  const defaultFilter = useCallback((option: ComboboxOption, search: string): boolean => {
    const searchLower = search.toLowerCase();
    return (
      option.label.toLowerCase().includes(searchLower) ||
      option.value.toLowerCase().includes(searchLower) ||
      (option.subLabel?.toLowerCase().includes(searchLower) ?? false)
    );
  }, []);

  // Filter options based on search text
  const filteredOptions = searchText
    ? options.filter(opt => (filterFunction || defaultFilter)(opt, searchText))
    : options;

  // Group filtered options if needed
  const groupedOptions = grouped
    ? filteredOptions.reduce((acc, option) => {
        const group = option.group || 'Other';
        if (!acc[group]) acc[group] = [];
        acc[group].push(option);
        return acc;
      }, {} as Record<string, ComboboxOption[]>)
    : { '': filteredOptions };

  // Get flat list of filtered options for keyboard navigation
  const flatFilteredOptions = Object.values(groupedOptions).flat();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset search text to selected value when closing
        setSearchText('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev =>
            prev < flatFilteredOptions.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0 && highlightedIndex < flatFilteredOptions.length) {
          const selected = flatFilteredOptions[highlightedIndex];
          onChange(selected.value, selected);
          setSearchText('');
          setIsOpen(false);
        } else if (allowCustom && searchText) {
          onChange(searchText);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchText('');
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  // Handle option selection
  const handleSelect = (option: ComboboxOption) => {
    onChange(option.value, option);
    setSearchText('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchText(newValue);
    setHighlightedIndex(-1);
    if (!isOpen) setIsOpen(true);

    // If allowCustom, also update the actual value
    if (allowCustom) {
      onChange(newValue);
    }
  };

  // Handle clear
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchText('');
    inputRef.current?.focus();
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-option]');
      const highlightedItem = items[highlightedIndex];
      if (highlightedItem) {
        highlightedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // Get display value
  const displayValue = isOpen
    ? searchText
    : options.find(opt => opt.value === value)?.label || value;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      {/* Input Container */}
      <div
        className={`
          relative flex items-center border rounded-lg bg-white transition-all duration-200
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-300'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-text'}
          ${error ? 'border-red-500' : ''}
          ${isCustomValue && showCustomWarning ? 'border-yellow-400' : ''}
        `}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        {/* Search Icon */}
        <div className="pl-3 text-gray-400">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={() => !disabled && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            flex-1 py-3 px-2 text-gray-900 placeholder-gray-400
            focus:outline-none bg-transparent
            ${disabled ? 'cursor-not-allowed' : ''}
          `}
        />

        {/* Warning Icon for Custom Value */}
        {isCustomValue && showCustomWarning && value && (
          <div className="pr-1">
            <AlertCircle className="w-4 h-4 text-yellow-500" />
          </div>
        )}

        {/* Clear Button */}
        {value && !disabled && (
          <button
            onClick={handleClear}
            className="p-1 mr-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Dropdown Arrow */}
        <div className="pr-3 text-gray-400">
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Custom Value Warning */}
      {isCustomValue && showCustomWarning && value && !isOpen && (
        <p className="mt-1 text-xs text-yellow-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {customWarningMessage}
        </p>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}

      {/* Dropdown List */}
      {isOpen && !disabled && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {loading ? (
            <li className="px-4 py-3 text-gray-500 text-center">
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            </li>
          ) : flatFilteredOptions.length === 0 ? (
            <li className="px-4 py-3 text-gray-500 text-center">
              {emptyMessage}
              {allowCustom && searchText && (
                <div className="mt-2">
                  <button
                    onClick={() => {
                      onChange(searchText);
                      setIsOpen(false);
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Use "{searchText}" as custom value
                  </button>
                </div>
              )}
            </li>
          ) : (
            Object.entries(groupedOptions).map(([group, groupOptions]) => (
              <React.Fragment key={group}>
                {/* Group Header */}
                {grouped && group && (
                  <li className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 sticky top-0">
                    {group}
                  </li>
                )}

                {/* Options */}
                {groupOptions.map((option, idx) => {
                  const globalIndex = flatFilteredOptions.indexOf(option);
                  const isHighlighted = globalIndex === highlightedIndex;
                  const isSelected = option.value === value;

                  return (
                    <li
                      key={`${option.value}-${idx}`}
                      data-option
                      onClick={() => handleSelect(option)}
                      className={`
                        px-4 py-3 cursor-pointer flex items-center justify-between
                        ${isHighlighted ? 'bg-blue-50' : ''}
                        ${isSelected ? 'bg-blue-50' : ''}
                        hover:bg-gray-50
                      `}
                    >
                      <div className="flex items-center gap-3">
                        {option.icon && (
                          <span className="text-gray-400">{option.icon}</span>
                        )}
                        <div>
                          <p className="text-gray-900">{option.label}</p>
                          {option.subLabel && (
                            <p className="text-xs text-gray-500">{option.subLabel}</p>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </li>
                  );
                })}
              </React.Fragment>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default ComboboxDropdown;
