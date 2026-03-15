import { debounce } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { FaMagnifyingGlass } from 'react-icons/fa6';
import { sortingOptions } from '../../Utils/Constants/SelectOptions';
import { capitilize, toSnakeCase } from '../../Utils/Utils';
import CustomButton from '../CustomButton';
import CustomCheckbox from '../CustomCheckbox/CustomCheckbox';
import CustomInput from '../CustomInput';
import CustomSelect from '../CustomSelect';
import './customFilters.css';

const CustomFilters = ({
  filters,
  setFilters,
  showFilterBorders = false,
  selectOptions = [],
  checkBoxFilters = [],
  additionalFilters = [],
  rangeFilters = [],
  dateFilters = [],
  hideSearch = false,
  hideItemsPerPage = false,
  useApplyButton = false,
  useClearButton = false,
  searchPlaceholder = 'Search',
  onNonTriggeringFiltersChange = null, // Callback to notify parent of non-triggering filter changes
  onClearFilters = null, // Callback to customize clear behavior
  onApplyFilters = null, // Callback to customize apply behavior (e.g., preserve certain filters)
  initialNonTriggeringFilters = {}, // Initial non-triggering filters to restore state
}) => {
  const [formData, setFormData] = useState({});
  const [localFormData, setLocalFormData] = useState({});
  // Separate state for non-triggering filters
  const [nonTriggeringFilters, setNonTriggeringFilters] = useState(
    initialNonTriggeringFilters
  );

  // Sync initialNonTriggeringFilters when provided (e.g., when advanced filter reopens)
  // Sync when advanced filter reopens to restore preserved state
  useEffect(() => {
    if (Object.keys(initialNonTriggeringFilters).length > 0) {
      // Always sync when initialNonTriggeringFilters is provided (e.g., when advanced filter reopens)
      // This ensures ledger is restored from preserved state
      setNonTriggeringFilters(initialNonTriggeringFilters);
    }
  }, [initialNonTriggeringFilters]);

  useEffect(() => {
    // Preserve non-triggering filters when syncing with parent filters
    const updatedFormData = {
      ...filters,
      ...nonTriggeringFilters,
    };
    setFormData(updatedFormData);
    setLocalFormData(updatedFormData);
  }, [filters, nonTriggeringFilters]);

  const debouncedSetFilters = useCallback(
    debounce((updatedFormData) => {
      setFilters(updatedFormData);
    }, 500),
    [setFilters]
  );

  // Function to get API filters (excluding non-triggering filters)
  const getApiFilters = (allFormData) => {
    const apiFilters = { ...allFormData };

    // Remove non-triggering filter values from API filters
    Object.keys(nonTriggeringFilters).forEach((key) => {
      delete apiFilters[key];
    });

    return apiFilters;
  };

  const handleChange = (name, value) => {
    const updatedFormData = {
      ...formData,
      [name]: value,
      ...nonTriggeringFilters,
    };

    if (useApplyButton) {
      setLocalFormData(updatedFormData);
      setFormData(updatedFormData);
    } else {
      setFormData(updatedFormData);

      // Debounce for text inputs
      if (
        name === 'search' ||
        additionalFilters?.some(
          (filter) =>
            toSnakeCase(filter.title) === name &&
            (filter.type === 'text' || filter.type === 'number')
        )
      ) {
        debouncedSetFilters(getApiFilters(updatedFormData));
      } else {
        setFilters(getApiFilters(updatedFormData));
      }
    }
  };

  const handleApplyFilters = () => {
    const apiFilters = getApiFilters(localFormData);
    // Allow parent to customize apply behavior (e.g., preserve certain filters)
    if (onApplyFilters) {
      onApplyFilters(apiFilters, setNonTriggeringFilters, nonTriggeringFilters);
    } else {
      setFilters(apiFilters);
    }
  };

  const handleClearFilters = () => {
    setFilters('');
    // Allow parent to customize clear behavior (e.g., preserve certain filters)
    if (onClearFilters) {
      onClearFilters(setNonTriggeringFilters);
    } else {
      setNonTriggeringFilters({});
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    handleChange(name, value);
  };

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    handleChange(name, checked);
  };

  const handleSelectChange = (name, value) => {
    // Reset page to 1 when per_page changes
    if (name === 'per_page') {
      const updatedFormData = {
        ...formData,
        [name]: value,
        page: 1, // Reset to page 1
        // Preserve non-triggering filters
        ...nonTriggeringFilters,
      };
      setFormData(updatedFormData);
      setFilters(getApiFilters(updatedFormData));
    } else {
      handleChange(name, value);
    }
  };

  // Handle non-triggering filter changes
  const handleNonTriggeringSelectChange = (name, value) => {
    const updatedNonTriggeringFilters = {
      ...nonTriggeringFilters,
      [name]: value,
    };
    setNonTriggeringFilters(updatedNonTriggeringFilters);

    // Update formData to show the value in UI
    const updatedFormData = {
      ...formData,
      [name]: value,
      // ...nonTriggeringFilters
    };
    setFormData(updatedFormData);

    // Notify parent component of non-triggering filter changes
    if (onNonTriggeringFiltersChange) {
      onNonTriggeringFiltersChange(updatedNonTriggeringFilters);
    }

    if (useApplyButton) {
      setLocalFormData(updatedFormData);
    }
  };

  return (
    <>
      <div className="tableFilters mb-3">
        <div className="d-flex justify-content-end justify-content-sm-start align-items-end flex-wrap flex-sm-nowrap gap-2 gap-lg-3">
          <div className="filterWrapper d-flex flex-wrap align-items-end mb-0 gap-2 gap-lg-3 flex-grow-1">
            {!hideSearch ? (
              <CustomInput
                inputClass={'tableInputs tableSearch'}
                type="text"
                placeholder={searchPlaceholder || 'Search'}
                error={false}
                label="Search"
                showBorders={showFilterBorders}
                borderRadius={10}
                name="search"
                rightIcon={FaMagnifyingGlass}
                value={formData?.search || ''}
                onChange={handleInputChange}
              />
            ) : null}
            {selectOptions?.map((option, index) => (
              <div key={index}>
                {option && !option.hide ? (
                  <CustomSelect
                    className={'tableSelect'}
                    name={option.title}
                    value={formData[option.title] || ''}
                    onChange={(e) => {
                      // Handle non-triggering filters separately
                      if (option?.triggerFilterOnChange === false) {
                        handleNonTriggeringSelectChange(
                          option.title,
                          e.target.value
                        );
                      } else {
                        handleSelectChange(option.title, e.target.value);
                      }
                    }}
                    label={capitilize(option?.label ?? option?.title)}
                    disabled={option.disabled}
                    options={option?.options}
                  />
                ) : null}
              </div>
            ))}

            {additionalFilters?.map(
              ({ title, placeholder, type, label }, index) => (
                <div key={index}>
                  <CustomInput
                    inputClass={'tableInputs'}
                    showBorders={showFilterBorders}
                    borderRadius={10}
                    type={type}
                    error={false}
                    label={label}
                    name={toSnakeCase(title)}
                    placeholder={placeholder}
                    onChange={handleInputChange}
                    value={formData[toSnakeCase(title)] ?? ''}
                  />
                </div>
              )
            )}
            {rangeFilters?.map(({ title, label }, index) => (
              <div
                className="filterWrapper gap-md-2 d-flex align-items-center flex-wrap mb-0"
                key={index}
              >
                <CustomInput
                  inputClass={'tableInputs'}
                  showBorders={showFilterBorders}
                  borderRadius={10}
                  error={false}
                  label={label}
                  name={`${toSnakeCase(title)}_from`}
                  placeholder="From"
                  onChange={handleInputChange}
                  value={formData[`${toSnakeCase(title)}_from`] || ''}
                />
                <div className="separator d-sm-block d-none">
                  <span>-</span>
                </div>
                <CustomInput
                  inputClass={'tableInputs'}
                  showBorders={showFilterBorders}
                  borderRadius={10}
                  label={' '}
                  error={false}
                  name={`${toSnakeCase(title)}_to`}
                  min={formData[`${toSnakeCase(title)}_from`] || null}
                  placeholder="To"
                  onChange={handleInputChange}
                  value={formData[`${toSnakeCase(title)}_to`] || ''}
                />
              </div>
            ))}
            {dateFilters?.map(({ title, label, disabled, readOnly }, index) => (
              <div
                className="filterWrapper gap-md-2 d-flex align-items-center flex-wrap mb-0"
                key={index}
              >
                <CustomInput
                  inputClass={'tableInputs'}
                  disabled={disabled}
                  readOnly={readOnly}
                  showBorders={showFilterBorders}
                  borderRadius={10}
                  type="date"
                  error={false}
                  label={label}
                  name={`${toSnakeCase(title)}_from`}
                  placeholder="From"
                  onChange={handleInputChange}
                  value={formData[`${toSnakeCase(title)}_from`] || ''}
                />
                <div className="separator d-sm-block d-none">
                  <span>-</span>
                </div>
                <CustomInput
                  inputClass={'tableInputs'}
                  showBorders={showFilterBorders}
                  borderRadius={10}
                  type="date"
                  readOnly={readOnly}
                  disabled={disabled}
                  label={' '}
                  error={false}
                  name={`${toSnakeCase(title)}_to`}
                  min={formData[`${toSnakeCase(title)}_from`] || null}
                  placeholder="To"
                  onChange={handleInputChange}
                  value={formData[`${toSnakeCase(title)}_to`] || ''}
                />
              </div>
            ))}
            {checkBoxFilters?.map(
              ({ title, readOnly, label, checked }, index) => (
                <div key={index}>
                  <CustomCheckbox
                    style={{
                      border: 'none',
                      marginBottom: 0,
                      paddingInline: 0,
                    }}
                    checked={
                      checked !== undefined
                        ? checked
                        : formData[toSnakeCase(title)] || false
                    }
                    name={toSnakeCase(title)}
                    label={label}
                    readOnly={readOnly}
                    onChange={handleCheckboxChange}
                  />
                </div>
              )
            )}
            {useApplyButton && (
              <CustomButton
                text={'Apply Filters'}
                onClick={handleApplyFilters}
              />
            )}
            {useClearButton && (
              <CustomButton
                text={'Clear Filters'}
                onClick={handleClearFilters}
              />
            )}
          </div>
          <div className="flex-shrink-0 mb-0 d-flex gap-2">
            {!hideItemsPerPage ? (
              <CustomSelect
                className={'tableSelect'}
                value={formData?.per_page}
                name="per_page"
                label="Show"
                onChange={(e) => handleSelectChange('per_page', e.target.value)}
                options={sortingOptions}
              />
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomFilters;
