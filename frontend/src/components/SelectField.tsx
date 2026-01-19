import React, { useEffect, useMemo, useRef, useState } from 'react';

type SelectOption = {
  value: string | number;
  label: string;
  disabled?: boolean;
};

interface SelectFieldProps {
  value?: string | number;
  name?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  wrapperClassName?: string;
  menuClassName?: string;
  placeholder?: string;
  children: React.ReactNode;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onValueChange?: (value: string | number) => void;
}

const isFragmentElement = (
  child: React.ReactNode,
): child is React.ReactElement<{ children?: React.ReactNode }, typeof React.Fragment> =>
  React.isValidElement(child) && child.type === React.Fragment;

const isOptionElement = (
  child: React.ReactNode,
): child is React.ReactElement<React.OptionHTMLAttributes<HTMLOptionElement>, 'option'> =>
  React.isValidElement(child) && child.type === 'option';

const buildOptions = (children: React.ReactNode): SelectOption[] => {
  const options: SelectOption[] = [];

  React.Children.forEach(children, (child) => {
    if (isFragmentElement(child)) {
      options.push(...buildOptions(child.props.children));
      return;
    }

    if (isOptionElement(child)) {
      const rawValue = child.props.value ?? child.props.children ?? '';
      const value =
        typeof rawValue === 'number'
          ? rawValue
          : typeof rawValue === 'string'
            ? rawValue
            : rawValue === null || rawValue === undefined
              ? ''
              : String(rawValue);
      const label = child.props.children ?? String(value);
      options.push({
        value,
        label: typeof label === 'string' ? label : String(label),
        disabled: Boolean(child.props.disabled),
      });
    }
  });

  return options;
};

const SelectField: React.FC<SelectFieldProps> = ({
  value,
  name,
  id,
  disabled = false,
  className = '',
  wrapperClassName = '',
  menuClassName = '',
  placeholder = 'Select',
  children,
  onChange,
  onValueChange,
}) => {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [internalValue, setInternalValue] = useState<string | number | undefined>(value);

  const options = useMemo(() => buildOptions(children), [children]);
  const currentValue = value === undefined ? internalValue : value;
  const selectedIndex = options.findIndex(
    (option) => String(option.value) === String(currentValue),
  );
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : options[0];
  const displayLabel = selectedOption?.label ?? placeholder;
  const isPlaceholder = !selectedOption || String(selectedOption.value) === '';
  const isDark = className.includes('select-field--dark');

  const emitChange = (nextValue: string | number) => {
    if (value === undefined) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
    if (onChange) {
      const syntheticEvent = {
        target: { name, value: nextValue },
      } as React.ChangeEvent<HTMLSelectElement>;
      onChange(syntheticEvent);
    }
  };

  const closeMenu = () => {
    setOpen(false);
    setFocusedIndex(-1);
  };

  const handleSelect = (option: SelectOption) => {
    if (disabled || option.disabled) return;
    emitChange(option.value);
    closeMenu();
  };

  const focusOption = (index: number) => {
    setFocusedIndex(index);
    requestAnimationFrame(() => {
      const optionNode = menuRef.current?.querySelector(
        `[data-index="${index}"]`,
      ) as HTMLElement | null;
      optionNode?.scrollIntoView({ block: 'nearest' });
    });
  };

  const findNextEnabled = (start: number, direction: 1 | -1) => {
    if (options.length === 0) return -1;
    let index = start;
    for (let i = 0; i < options.length; i += 1) {
      index = (index + direction + options.length) % options.length;
      if (!options[index].disabled) return index;
    }
    return -1;
  };

  const handleButtonKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        if (!open) {
          setOpen(true);
          const nextIndex = selectedIndex >= 0 ? selectedIndex : 0;
          focusOption(nextIndex);
        } else {
          const nextIndex = findNextEnabled(
            focusedIndex >= 0 ? focusedIndex : selectedIndex,
            1,
          );
          if (nextIndex >= 0) focusOption(nextIndex);
        }
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        if (!open) {
          setOpen(true);
          const nextIndex = selectedIndex >= 0 ? selectedIndex : 0;
          focusOption(nextIndex);
        } else {
          const nextIndex = findNextEnabled(
            focusedIndex >= 0 ? focusedIndex : selectedIndex,
            -1,
          );
          if (nextIndex >= 0) focusOption(nextIndex);
        }
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        if (!open) {
          setOpen(true);
          const nextIndex = selectedIndex >= 0 ? selectedIndex : 0;
          focusOption(nextIndex);
        } else if (focusedIndex >= 0) {
          handleSelect(options[focusedIndex]);
        }
        break;
      }
      case 'Escape':
        if (open) {
          event.preventDefault();
          closeMenu();
        }
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open && selectedIndex >= 0) {
      focusOption(selectedIndex);
    }
  }, [open, selectedIndex]);

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  return (
    <div ref={rootRef} className={`relative ${wrapperClassName}`}>
      <button
        type="button"
        id={id}
        name={name}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        onKeyDown={handleButtonKeyDown}
        className={`select-field w-full text-left ${className} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        <span className={isPlaceholder ? 'text-gray-400' : ''}>{displayLabel}</span>
      </button>
      {open && (
        <div
          ref={menuRef}
          role="listbox"
          className={`absolute z-30 mt-2 w-full rounded-xl border shadow-lg max-h-64 overflow-y-auto ${
            isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
          } ${menuClassName}`}
        >
          {options.map((option, index) => {
            const isActive = index === focusedIndex;
            const isSelected = String(option.value) === String(currentValue);
            const baseText = isDark ? 'text-gray-200' : 'text-gray-700';
            const hoverClass = isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50';
            const activeClass = isDark ? 'bg-gray-700 text-white' : 'bg-gray-900 text-white';
            const selectedClass = isDark ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-900';
            const disabledClass = isDark ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed';
            return (
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                data-index={index}
                key={`${option.value}-${option.label}`}
                className={`w-full text-left px-3 py-2 text-sm transition ${
                  option.disabled
                    ? disabledClass
                    : isActive
                      ? activeClass
                      : isSelected
                        ? selectedClass
                        : `${baseText} ${hoverClass}`
                }`}
                onClick={() => handleSelect(option)}
                disabled={option.disabled}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SelectField;
