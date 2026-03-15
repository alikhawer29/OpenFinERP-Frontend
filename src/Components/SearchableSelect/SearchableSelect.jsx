import React, { useEffect, useState, forwardRef } from 'react';
import Select, { components } from 'react-select';
import { themeDictionary } from '../../Utils/Constants/ColorConstants';
import useThemeStore from '../../Stores/ThemeStore';
import './SearchableSelect.css';

const SearchableSelect = forwardRef(
  (
    {
      label,
      options,
      required = false,
      isDisabled = false,
      onChange,
      placeholder,
      name,
      value,
      menuPlacement = 'auto',
      borderRadius,
      minWidth,
      style,
      className,
      showBorders = true, // <-- Add border prop with default true
      error,
      onBlur,
      tooltipText, // Add tooltip prop
      formatOptionLabel, // Custom format function for option labels
    },
    ref
  ) => {
    const { theme } = useThemeStore();
    const [fontSize, setFontSize] = useState('14px');
    const [padding, setPadding] = useState('4px 0px 5px 4px');

    const updateSizing = () => {
      if (window.innerWidth < 575) {
      } else if (window.innerWidth < 768) {
        setFontSize('13px');
        setPadding('0px 0px 0px 0px');
      } else if (window.innerWidth < 992) {
        setFontSize('14px');
        setPadding('2px 0px 3px 2px');
      } else if (window.innerWidth >= 992) {
        setFontSize('14px');
        setPadding('4px 0px 5px 4px');
      }
    };

    // Add event listener for window resize
    useEffect(() => {
      updateSizing();
      window.addEventListener('resize', updateSizing);
      return () => window.removeEventListener('resize', updateSizing);
    }, []);

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

    // Custom Menu List component to handle the fixed button at the bottom
    const MenuList = (props) => {
      const { children, ...menuListProps } = props;
      const scrollableRef = React.useRef(null);
      const childrenArray = React.Children.toArray(children);

      // Find the focused option index
      const focusedIndex = childrenArray.findIndex(
        (child) => child.props.isFocused
      );

      // Scroll the focused option into view when it changes
      React.useEffect(() => {
        if (focusedIndex !== -1 && scrollableRef.current) {
          // Find the focused option DOM node inside scrollable-options
          const optionNodes =
            scrollableRef.current.querySelectorAll('[class*="option"]');
          if (optionNodes[focusedIndex]) {
            optionNodes[focusedIndex].scrollIntoView({ block: 'nearest' });
          }
        }
      }, [focusedIndex]);

      // Find the "Add New GL" option if it exists
      const addNewOption = childrenArray.find((child) =>
        child.props?.data?.label?.toLowerCase?.().startsWith('add new')
      );

      // Filter out the "Add New GL" option from the regular options
      const regularOptions = addNewOption
        ? childrenArray.filter(
            (child) =>
              !child.props?.data?.label?.toLowerCase?.().startsWith('add new')
          )
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
          // Add wheel event listener to the scrollable element
          scrollableElement.addEventListener('wheel', handleWheel, {
            passive: false,
          });

          // Also add a wheel event listener to the parent menu list to capture events
          const menuList = scrollableElement.closest(
            '.searchable-select-menu-list'
          );
          if (menuList) {
            menuList.addEventListener(
              'wheel',
              (e) => {
                // If we're in the scrollable area, let the scrollable area handle it
                if (e.target.closest('.scrollable-options')) {
                  return;
                }

                // Otherwise, manually scroll the scrollable area
                if (scrollableRef.current) {
                  scrollableRef.current.scrollTop += e.deltaY;
                  e.preventDefault();
                  e.stopPropagation();
                }
              },
              { passive: false }
            );
          }

          return () => {
            scrollableElement.removeEventListener('wheel', handleWheel);
            if (menuList) {
              menuList.removeEventListener('wheel', handleWheel);
            }
          };
        }
      }, []);

      return (
        <components.MenuList
          {...menuListProps}
          className="searchable-select-menu-list"
        >
          <div className="scrollable-options" ref={scrollableRef}>
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

    const customStyles = {
      control: (provided, state) => ({
        ...provided,
        backgroundColor: isDisabled
          ? themeDictionary[theme][9]
          : `${themeDictionary[theme][4]}`,
        padding,
        fontSize,
        marginTop: 2,
        border: showBorders
          ? state.isFocused
            ? `1px solid ${themeDictionary[theme][8]}`
            : `1px solid rgba(100, 100, 100, 0.22)`
          : 'none', // <-- Use border prop here
        boxShadow: 'none',
        '&:hover': {
          border: showBorders
            ? `1px solid ${themeDictionary[theme][0]} !important`
            : 'none', // <-- Use border prop here
        },
        ...(borderRadius && { borderRadius }),
      }),
      menuPortal: (base) => ({
        ...base,
        zIndex: 1056,
      }),
      menu: (provided) => ({
        ...provided,
        overflow: 'hidden',
      }),
      menuList: (provided) => ({
        ...provided,
        maxHeight: 'none',
        padding: 0,
        overflow: 'visible', // Allow scrolling within child elements
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
      singleValue: (provided) => ({
        ...provided,
        color: themeDictionary[theme][7], // Selected value color
      }),
      placeholder: (provided) => ({
        ...provided,
        color: '#666', // Selected value color
      }),
      input: (provided) => ({
        ...provided,
        color: themeDictionary[theme][7], // Selected value color
      }),
    };
    // Get selected option label for tooltip
    const selectedOption = options?.find((option) => option.value === value);
    const tooltipLabel = tooltipText || selectedOption?.label || '';

    return (
      <div className="inputWrapper mb-0" style={{ minWidth, ...style }}>
        {label && (
          <label className="mainLabel">
            {label}
            {required && <span className="text-danger">*</span>}
          </label>
        )}
        <div 
          className="tooltip-toggle-wrapper" 
          title={tooltipLabel}
          aria-label={tooltipLabel}
          style={{ position: 'relative' }}
        >
          <Select
            classNamePrefix="react-select"
            ref={ref} // <-- Pass the ref here
            isDisabled={isDisabled}
            value={
              typeof value === 'object' && value !== null
                ? value
                : options?.find((option) => option.value === value) ?? null
            } // Supports both primitive value and full option object
            name={name}
            options={options}
            onChange={(opt) => onChange?.(opt)}
            formatOptionLabel={formatOptionLabel}
            placeholder={placeholder}
            className={className}
            styles={customStyles}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            menuPlacement={menuPlacement}
            components={{ MenuList }}
            onBlur={onBlur}
          />
        </div>
        {error && (
          <div className="input-error-message text-danger">{error}</div>
        )}
      </div>
    );
  }
);

export default SearchableSelect;
