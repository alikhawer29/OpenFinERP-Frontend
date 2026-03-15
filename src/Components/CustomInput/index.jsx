import { forwardRef, useState, useEffect, useRef } from 'react';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa';
import {
  sanitizeRateInput,
  sanitizeAmountInput,
  formatRateValue,
  formatAmountValue,
  formatNumberWithCommasForDisplay,
  isRateField,
  isAmountField,
} from '../../Utils/Helpers';
import './style.css';

// Format number with commas for display
const formatNumberWithCommas = (val) => {
  if (!val) return '';
  const [intPart, decimalPart] = val.toString().split('.');
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimalPart !== undefined ? `${withCommas}.${decimalPart}` : withCommas;
};

// Sanitize input: allow only digits and decimal point (no negative numbers)
const sanitizeNumberInput = (value) => {
  if (value === '') return '';
  let sanitized = value.replace(/[^\d.]/g, ''); // remove '-' as well

  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('');
  }

  if (sanitized === '.') return '.';

  return sanitized;
};

const CustomInput = forwardRef(
  (
    {
      rightIcon: IconToBeUsed,
      label,
      required,
      type,
      placeholder,
      autoComplete = 'off',
      id,
      name,
      inputClass,
      borderRadius,
      style,
      labelClass,
      onChange,
      onBlur,
      value,
      defaultValue,
      rows = 1,
      cols,
      min,
      max,
      iconColor,
      error = true,
      showBorders = true,
      disabled = false,
      direction,
      readOnly = false,
      onButtonClick,
      rightText,
      autoFocus,
      maxLength,
      step,
      textBelowInput,
      title,
      inputErrorClass,
      inputStyle,
    },
    ref
  ) => {
    const [typePass, setTypePass] = useState(true);
    const [displayValue, setDisplayValue] = useState(value || '');
    const isFocusedRef = useRef(false);
    const lastValueRef = useRef(value);

    // Detect field type
    const isRate = isRateField(name, inputClass, placeholder);
    const isAmount = isAmountField(name, inputClass, placeholder);
    const isCommission = name === 'commission' || inputClass?.includes('commission') || placeholder?.toLowerCase().includes('commission');

    // Toggle password visibility
    const togglePassType = () => setTypePass(!typePass);

    // Sync displayValue when value prop changes (for numbers and rate/amount text fields)
    // Don't format during typing - only format on initial load or when value changes externally
    useEffect(() => {
      if (type === 'number' || (type === 'text' && (isRate || isAmount || isCommission))) {
        // Only update if value changed AND we're not currently focused (user typing)
        // or if this is the initial load
        const valueChanged = lastValueRef.current !== value;
        const isInitialLoad = lastValueRef.current === undefined;

        if (valueChanged && (!isFocusedRef.current || isInitialLoad)) {
          if (isRate) {
            setDisplayValue(value !== undefined && value !== null ? formatRateValue(value) : '');
          } else if (isAmount) {
            setDisplayValue(value !== undefined && value !== null ? formatAmountValue(value) : '');
          } else if (isCommission) {
            // Special formatting for commission percentage
            if (value !== undefined && value !== null && value !== '') {
              const numValue = parseFloat(value);
              if (!isNaN(numValue)) {
                // Check if whole number, add .00
                if (Number.isInteger(numValue)) {
                  setDisplayValue(numValue.toFixed(2));
                } else {
                  // For decimals, use formatNumberWithCommas
                  setDisplayValue(formatNumberWithCommas(value));
                }
              } else {
                setDisplayValue('');
              }
            } else {
              setDisplayValue('');
            }
          } else if (type === 'number') {
            setDisplayValue(value !== undefined && value !== null ? formatNumberWithCommas(value) : '');
          } else {
            setDisplayValue(value !== undefined && value !== null ? value : '');
          }
          lastValueRef.current = value;
        }
      }
    }, [value, type, isRate, isAmount, isCommission]);

    return (
      <div className={`inputWrapper ${!error ? 'mb-0' : ''}`} style={style}>
        {label && (
          <label htmlFor={id} className={labelClass}>
            {label}
            {required && <span className="text-danger">*</span>}
          </label>
        )}

        {type === 'password' ? (
          <div className="d-flex align-items-center position-relative">
            <input
              ref={ref}
              type={typePass ? 'password' : 'text'}
              placeholder={placeholder}
              id={id}
              name={name}
              className={`mainInput passInput ${inputClass} ${IconToBeUsed ? 'paddingWithRightIcon' : ''}`}
              style={{ borderRadius }}
              value={value}
              onChange={(e) => {
                if (!maxLength || e.target.value.length <= maxLength) onChange?.(e);
              }}
              onBlur={onBlur}
              readOnly={readOnly}
              maxLength={maxLength}
            />
            <button type="button" className="right-icon" onClick={togglePassType}>
              {typePass ? <FaRegEyeSlash color={inputClass ? '#bbb' : '#707C8B'} /> : <FaRegEye color={inputClass ? '#bbb' : '#707C8B'} />}
            </button>
          </div>
        ) : type === 'textarea' ? (
          <textarea
            ref={ref}
            style={{ borderRadius }}
            direction={direction}
            disabled={disabled}
            placeholder={placeholder}
            id={id}
            name={name}
            rows={rows}
            cols={cols}
            className={`mainInput ${inputClass}`}
            onChange={(e) => {
              if (!maxLength || e.target.value.length <= maxLength) onChange?.(e);
            }}
            onBlur={onBlur}
            value={value}
            defaultValue={defaultValue}
            readOnly={readOnly}
            maxLength={maxLength}
          />
        ) : (
          <div className="d-flex align-items-center position-relative" style={inputStyle}>
            <input
              ref={ref}
              dir={direction}
              disabled={disabled}
              type={type === 'number' ? 'text' : type} // use text to allow commas
              placeholder={placeholder}
              autoComplete={autoComplete}
              autoFocus={autoFocus}
              id={id}
              name={name}
              title={title || value}
              aria-label={title || value}
              style={{
                borderRadius,
                paddingRight: rightText && '60px',
                ...(!showBorders && { borderColor: '#00000000' }),
              }}
              className={`mainInput tooltip-toggle ${inputClass} ${IconToBeUsed ? 'morePadding' : ''}`}
              value={(type === 'number' || (type === 'text' && (isRate || isAmount || isCommission))) ? displayValue : value}
              onChange={(e) => {
                let inputVal = e.target.value;

                // Handle number type or text type rate/amount fields
                if (type === 'number' || (type === 'text' && (isRate || isAmount || isCommission))) {
                  // Apply rate or amount specific sanitization
                  if (isRate) {
                    inputVal = sanitizeRateInput(inputVal);
                  } else if (isAmount) {
                    inputVal = sanitizeAmountInput(inputVal);
                  } else if (isCommission) {
                    // For commission fields, use amount sanitization (max 2 decimal places)
                    inputVal = sanitizeAmountInput(inputVal);
                  } else if (type === 'number') {
                    inputVal = sanitizeNumberInput(inputVal.replace(/,/g, ''));
                  }

                  // Limit max value
                  if (max !== undefined && inputVal !== '' && inputVal !== '.') {
                    const numericVal = parseFloat(inputVal);
                    if (!isNaN(numericVal) && numericVal > max) return;
                  }

                  // Update display with commas only (no forced decimals during typing)
                  if (isRate || isAmount || isCommission) {
                    // During typing, only add commas, don't force decimal places
                    setDisplayValue(formatNumberWithCommasForDisplay(inputVal || ''));
                  } else if (type === 'number') {
                    setDisplayValue(formatNumberWithCommas(inputVal));
                  } else {
                    setDisplayValue(inputVal);
                  }

                  // Emit clean value for payload (without commas)
                  const cleanValue = inputVal.replace(/,/g, '');
                  const sanitizedEvent = {
                    ...e,
                    target: { ...e.target, value: cleanValue, name: name || e.target.name },
                    currentTarget: { ...e.currentTarget, value: cleanValue, name: name || e.currentTarget.name },
                  };
                  onChange?.(sanitizedEvent);
                  return;
                }

                // Non-number input
                if (!maxLength || e.target.value.length <= maxLength) onChange?.(e);
              }}
              onFocus={(e) => {
                isFocusedRef.current = true;
              }}
              onBlur={(e) => {
                isFocusedRef.current = false;
                // Format on blur for rate, amount, and commission fields (both number and text types)
                if ((type === 'number' || (type === 'text' && (isRate || isAmount || isCommission))) && !readOnly && !disabled) {
                  const currentValue = e.target.value.replace(/,/g, '');
                  if (currentValue !== '' && currentValue !== '.') {
                    let formattedValue = '';
                    if (isRate) {
                      formattedValue = formatRateValue(currentValue);
                    } else if (isAmount) {
                      formattedValue = formatAmountValue(currentValue);
                    } else if (isCommission) {
                      // Special formatting for commission percentage
                      const numValue = parseFloat(currentValue);
                      if (!isNaN(numValue)) {
                        // Check if whole number, add .00
                        if (Number.isInteger(numValue)) {
                          formattedValue = numValue.toFixed(2);
                        } else {
                          // For decimals, use formatNumberWithCommas
                          formattedValue = formatNumberWithCommas(currentValue);
                        }
                      }
                    }

                    if (formattedValue) {
                      setDisplayValue(formattedValue);
                      lastValueRef.current = formattedValue.replace(/,/g, '');
                      // Update the value through onChange to sync with form state
                      const cleanValue = formattedValue.replace(/,/g, '');
                      const formattedEvent = {
                        ...e,
                        target: { ...e.target, value: cleanValue, name: name || e.target.name },
                        currentTarget: { ...e.currentTarget, value: cleanValue, name: name || e.currentTarget.name },
                      };
                      onChange?.(formattedEvent);
                    }
                  }
                }
                onBlur?.(e);
              }}
              min={['number', 'date', 'time'].includes(type) ? min : undefined}
              max={['number', 'date', 'time'].includes(type) ? max : undefined}
              step={step}
              readOnly={readOnly}
              maxLength={maxLength}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && onButtonClick) onButtonClick();

                // Handle number type or text type rate/amount fields
                if ((type === 'number' || (type === 'text' && (isRate || isAmount || isCommission))) && !readOnly) {
                  const allowedKeys = [
                    'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
                    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                    'Home', 'End', 'Clear'
                  ];

                  const isControlKey = e.ctrlKey || e.metaKey || e.altKey;
                  const isAllowedKey = allowedKeys.includes(e.key);
                  const isNumericKey = /^\d$/.test(e.key);
                  const currentValue = e.target.value.replace(/,/g, '');
                  const isDecimalPoint = e.key === '.' && !currentValue.includes('.');

                  if (isControlKey) return;
                  if (!isAllowedKey && !isNumericKey && !isDecimalPoint) e.preventDefault(); // minus disabled
                }
              }}
            />
            {IconToBeUsed ? (
              <div className="right-icon" onClick={onButtonClick}>
                <IconToBeUsed color={iconColor} />
              </div>
            ) : rightText ? (
              <div className="right-icon" style={{ fontSize: '12px' }} onClick={onButtonClick}>
                {rightText}
              </div>
            ) : null}
          </div>
        )}

        {textBelowInput && <p className="m-0 position-absolute primary-color-text">{textBelowInput}</p>}
        {error && <div className={`input-error-message text-danger ${inputErrorClass}`}>{error}</div>}
      </div>
    );
  }
);

export default CustomInput;
