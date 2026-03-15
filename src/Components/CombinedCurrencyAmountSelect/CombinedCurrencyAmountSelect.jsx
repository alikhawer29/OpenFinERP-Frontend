import { ErrorMessage } from 'formik';
import React, { useRef, useState, useEffect } from 'react';
import Select, { components } from 'react-select';
import { sanitizeAmountInput, formatAmountValue, formatNumberWithCommasForDisplay } from '../../Utils/Helpers';
import './CombinedCurrencyAmountSelect.css';
import { themeDictionary } from '../../Utils/Constants/ColorConstants';
import useThemeStore from '../../Stores/ThemeStore';

const CombinedCurrencyAmountSelect = ({
  currencyOptions,
  currencyValue,
  amountValue,
  onCurrencyChange,
  onAmountChange,
  isDisabled,
  handleBlur,
  isLoadingCurrencyRate,
}) => {
  const currencyRef = useRef(null);
  const amountInputRef = useRef(null);
  const { theme } = useThemeStore();
  const [fontSize, setFontSize] = useState('14px');
  const [displayAmount, setDisplayAmount] = useState(amountValue || '');
  const isFocusedRef = useRef(false);
  const lastAmountValueRef = useRef(amountValue);

  // Update font size based on screen width to match SearchableSelect
  const updateSizing = () => {
    if (window.innerWidth < 575) {
      // Default for small screens
      setFontSize('14px');
    } else if (window.innerWidth < 768) {
      setFontSize('13px');
    } else if (window.innerWidth < 992) {
      setFontSize('14px');
    } else if (window.innerWidth >= 992) {
      setFontSize('14px');
    }
  };

  // Add event listener for window resize
  useEffect(() => {
    updateSizing();
    window.addEventListener('resize', updateSizing);
    return () => window.removeEventListener('resize', updateSizing);
  }, []);

  // Sync displayAmount when amountValue prop changes
  // Don't format during typing - only format on initial load or when value changes externally
  useEffect(() => {
    const valueChanged = lastAmountValueRef.current !== amountValue;
    const isInitialLoad = lastAmountValueRef.current === undefined;
    
    // Only update if value changed AND we're not currently focused (user typing)
    // or if this is the initial load
    if (valueChanged && (!isFocusedRef.current || isInitialLoad)) {
      if (amountValue !== undefined && amountValue !== null) {
        setDisplayAmount(formatAmountValue(amountValue));
      } else {
        setDisplayAmount('');
      }
      lastAmountValueRef.current = amountValue;
    }
  }, [amountValue]);

  // Functions to match SearchableSelect styling
  const getTextAlign = (label) =>
    label?.toLowerCase().startsWith('add new') ? 'center' : '';

  const getBackgroundColor = (state, theme) => {
    const { label } = state?.data || {};
    if (label?.toLowerCase().startsWith('add new')) {
      return themeDictionary[theme][1];
    }
    if (state.isSelected) {
      return themeDictionary[theme][0];
    }
    if (state.isFocused) {
      return themeDictionary[theme][1];
    }
    return themeDictionary[theme][4];
  };

  const getTextColor = (state, theme) => {
    const { label } = state?.data || {};
    if (label?.toLowerCase().startsWith('add new')) {
      return theme === 'blue'
        ? themeDictionary[theme][6]
        : themeDictionary[theme][5];
    }
    if (state.isDisabled) {
      return themeDictionary[theme][3];
    }
    if (state.isSelected) {
      return themeDictionary[theme][6];
    }
    if (state.isFocused) {
      return theme === 'blue'
        ? themeDictionary[theme][6]
        : themeDictionary[theme][7];
    }
    return themeDictionary[theme][5];
  };

  const getHoverStyles = (state, theme) =>
    !state.isDisabled
      ? {
          backgroundColor: themeDictionary[theme][0],
          color: themeDictionary[theme][6],
        }
      : null;

  // Custom MenuList component to handle the fixed button at the bottom
  const MenuList = props => {
    const { children, ...menuListProps } = props;
    const scrollableRef = useRef(null);
    const childrenArray = React.Children.toArray(children);

    // Find the "Add New" option if it exists
    const addNewOption = childrenArray.find(child =>
      child.props?.data?.label?.toLowerCase?.()?.startsWith('add new'));

    // Filter out the "Add New" option from the regular options
    const regularOptions = addNewOption
      ? childrenArray.filter(child =>
          !child.props?.data?.label?.toLowerCase?.()?.startsWith('add new'))
      : childrenArray;

    // Handle wheel events to ensure proper scrolling
    const handleWheel = (e) => {
      if (scrollableRef.current) {
        // Get the scroll amount from the wheel event
        const scrollAmount = e.deltaY;

        // Manually scroll the container
        scrollableRef.current.scrollTop += scrollAmount;

        // Prevent default behavior and stop propagation
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Add global wheel event listener when component mounts
    React.useEffect(() => {
      const scrollableElement = scrollableRef.current;

      if (scrollableElement) {
        scrollableElement.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
          scrollableElement.removeEventListener('wheel', handleWheel);
        };
      }
    }, []);

    return (
      <components.MenuList {...menuListProps} className="searchable-select-menu-list">
        <div
          className="scrollable-options"
          ref={scrollableRef}
        >
          {regularOptions}
        </div>
        {addNewOption && (
          <div
            className="fixed-add-new-option"
            style={{ backgroundColor: themeDictionary[theme][4] }}
          >
            {addNewOption}
          </div>
        )}
      </components.MenuList>
    );
  };

  // Custom styles for the selects
  const customStyles = {
    control: (provided) => ({
      ...provided,
      border: 'none',
      boxShadow: 'none',
      background: 'transparent',
      cursor: 'pointer',
      minHeight: '42px',
      height: '42px',
      fontSize,
      backgroundColor: isDisabled
        ? themeDictionary[theme][9]
        : 'transparent',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: 'rgba(100, 100, 100, 0.5)',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#6c757d',
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
      overflow: 'hidden',
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: '200px',
      padding: 0,
    }),
    option: (provided, state) => ({
      ...provided,
      textAlign: getTextAlign(state?.data?.label),
      backgroundColor: getBackgroundColor(state, theme),
      color: getTextColor(state, theme),
      whiteSpace: 'break-spaces',
      fontSize,
      '&:hover': getHoverStyles(state, theme),
    }),
  };

  // Find the selected currency option
  const selectedCurrencyOption =
    currencyOptions.find((option) => option.value === currencyValue) || null;

  return (
    <div className="combined-select-container">
      <label className="mainLabel">Currency</label>

      <div className="combined-select-input">
        <div className="combined-select-left">
          <Select
            ref={currencyRef}
            options={currencyOptions}
            value={selectedCurrencyOption}
            onChange={onCurrencyChange}
            isDisabled={isDisabled}
            placeholder="Select Currency"
            styles={customStyles}
            onBlur={handleBlur}
            className="currency-select"
            classNamePrefix="currency-select"
            menuPortalTarget={document.body}
            components={{ MenuList }}
          />
          {isLoadingCurrencyRate && (
            <p className="m-0 position-absolute primary-color-text">
              Fetching currency rate...
            </p>
          )}
          <ErrorMessage
            name="currency_id"
            component="div"
            className="input-error-message text-danger"
          />
        </div>

        <div className="separator-between-selects">|</div>

        <div className="combined-select-right">
          <input
            ref={amountInputRef}
            type="text"
            name="amount"
            value={displayAmount}
            onChange={(e) => {
              const sanitized = sanitizeAmountInput(e.target.value);
              // During typing, only add commas, don't force decimal places
              setDisplayAmount(formatNumberWithCommasForDisplay(sanitized || ''));
              
              // Create event with clean value (no commas)
              const cleanValue = sanitized.replace(/,/g, '');
              const sanitizedEvent = {
                ...e,
                target: { ...e.target, value: cleanValue, name: 'amount' },
                currentTarget: { ...e.currentTarget, value: cleanValue, name: 'amount' },
              };
              onAmountChange?.(sanitizedEvent);
            }}
            disabled={isDisabled}
            placeholder="Enter Amount"
            onFocus={(e) => {
              isFocusedRef.current = true;
            }}
            onBlur={(e) => {
              isFocusedRef.current = false;
              // Format on blur
              const currentValue = e.target.value.replace(/,/g, '');
              if (currentValue !== '' && currentValue !== '.') {
                const formatted = formatAmountValue(currentValue);
                setDisplayAmount(formatted);
                lastAmountValueRef.current = formatted.replace(/,/g, '');
                
                // Update the value through onChange to sync with form state
                const cleanValue = formatted.replace(/,/g, '');
                const formattedEvent = {
                  ...e,
                  target: { ...e.target, value: cleanValue, name: 'amount' },
                  currentTarget: { ...e.currentTarget, value: cleanValue, name: 'amount' },
                };
                onAmountChange?.(formattedEvent);
              }
              handleBlur?.(e);
            }}
            className="amount-input"
            style={{ fontSize }}
            onKeyDown={(e) => {
              if (!isDisabled) {
                const allowedKeys = [
                  'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
                  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                  'Home', 'End', 'Clear'
                ];
                const isControlKey = e.ctrlKey || e.metaKey || e.altKey;
                const isAllowedKey = allowedKeys.includes(e.key);
                const isNumericKey = /^\d$/.test(e.key);
                const isDecimalPoint = e.key === '.' && !e.target.value.replace(/,/g, '').includes('.');
                if (isControlKey) return;
                if (!isAllowedKey && !isNumericKey && !isDecimalPoint) e.preventDefault();
              }
            }}
          />
          <ErrorMessage
            name="amount"
            component="div"
            className="input-error-message text-danger"
          />
        </div>
      </div>
    </div>
  );
};

export default CombinedCurrencyAmountSelect;
