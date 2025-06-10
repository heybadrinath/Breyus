import React from "react";

interface NoArrowNumberInputProps {
  className?: string;
  placeholder?: string;
  value?: number | string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min?: number;
  max?: number;
  step?: number;
  name?: string;
  disabled?: boolean;
}

const NoArrowNumberInput: React.FC<NoArrowNumberInputProps> = ({
  className = "",
  placeholder = "",
  value,
  onChange,
  min,
  max,
  step,
  name,
  disabled,
}) => (
  <input
    type="number"
    className={`no-arrows ${className}`}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    min={min}
    max={max}
    step={step}
    name={name}
    disabled={disabled}
    style={{ MozAppearance: "textfield" }}
    inputMode="numeric"
    pattern="[0-9]*"
  />
);

export default NoArrowNumberInput; 