import { ErrorMessage } from 'formik';
import React, { useRef } from 'react';
import Select, { components } from 'react-select';
import './CombinedLedgerAccountSelect.css';
import { themeDictionary } from '../../Utils/Constants/ColorConstants';
import useThemeStore from '../../Stores/ThemeStore';

const CombinedLedgerAccountSelect = ({
  ledgerOptions,
  accountOptions,
  ledgerValue,
  accountValue,
  onLedgerChange,
  onAccountChange,
  isDisabled,
  handleBlur,
}) => {
  const ledgerRef = useRef(null);
  const accountRef = useRef(null);
  const { theme } = useThemeStore();

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
      fontSize: '14px',
      '&:hover': getHoverStyles(state, theme),
    }),
  };

  // Find the selected ledger and account options
  const selectedLedgerOption =
    ledgerOptions.find((option) => option.value === ledgerValue) || null;
  const selectedAccountOption =
    accountOptions.find((option) => option.value === accountValue) || null;

  return (
    <div className="combined-select-container">
      <label className="mainLabel">Ledger</label>

      <div className="combined-select-input">
        <div className="combined-select-left">
          <Select
            ref={ledgerRef}
            options={ledgerOptions}
            value={selectedLedgerOption}
            onChange={onLedgerChange}
            isDisabled={isDisabled}
            placeholder="Select Ledger"
            styles={customStyles}
            onBlur={handleBlur}
            className="ledger-select"
            classNamePrefix="ledger-select"
            menuPortalTarget={document.body}
            components={{ MenuList }}
          />
        </div>

        <div className="separator-between-selects">|</div>

        <div className="combined-select-right">
          <Select
            ref={accountRef}
            options={accountOptions}
            value={selectedAccountOption}
            onChange={onAccountChange}
            isDisabled={isDisabled}
            placeholder="Select Account"
            styles={customStyles}
            onBlur={handleBlur}
            className="account-select"
            classNamePrefix="account-select"
            menuPortalTarget={document.body}
            components={{ MenuList }}
          />
        </div>
      </div>

      <div className="error-container">
        <ErrorMessage
          name="ledger"
          component="div"
          className="input-error-message text-danger"
        />
        <ErrorMessage
          name="account_id"
          component="div"
          className="input-error-message text-danger"
        />
      </div>
    </div>
  );
};

export default CombinedLedgerAccountSelect;
