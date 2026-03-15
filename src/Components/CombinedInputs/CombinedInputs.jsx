import { ErrorMessage } from 'formik';
import React from 'react';
import CustomInput from '../CustomInput';
import SearchableSelect from '../SearchableSelect/SearchableSelect';
import { isRateField, isAmountField } from '../../Utils/Helpers';
import './CombinedInputs.css';

const CombinedInputs = ({
  label,
  rightIcon,
  type1 = 'select',
  type2 = 'select',
  options1 = [],
  options2 = [],
  value1,
  value2,
  onChange1,
  onChange2,
  isDisabled = false,
  isfirstInputDisabled = false,
  isSecondInputDisabled = false,
  handleBlur,
  name1,
  name2,
  placeholder1 = 'Select',
  placeholder2 = 'Select',
  inputType1 = 'text',
  inputType2 = 'text',
  inputProps1 = {},
  inputProps2 = {},
  className1 = 'input1',
  className2 = 'input2',
  min1,
  max1,
  min2,
  max2,
  additionalProps,
  setFieldValue,
  values,
  onButtonClick

}) => {
  // Render the first input based on type
  const renderInput1 = () => {
    const handleInput1Change = (selectedOrEvent) => {
      if (setFieldValue && name1) {
        // For select, selectedOrEvent is an object; for input, it's an event
        if (type1 === 'select') {
          setFieldValue(name1, selectedOrEvent.value);
        } else {
          setFieldValue(name1, selectedOrEvent.target.value);
        }
      }
      if (onChange1) {
        onChange1(selectedOrEvent);
      }
    };
    if (type1 === 'select') {
      return (
        <>
          <SearchableSelect
            label={null}
            options={options1}
            value={value1}
            onChange={handleInput1Change}
            isDisabled={isDisabled || isfirstInputDisabled }
            placeholder={placeholder1}
            name={name1}
            handleBlur={handleBlur}
            showBorders={false}
            {...inputProps1}
          />
        </>
      );
    } else {
      // Detect if this is a rate or amount field
      const fieldIsRate = isRateField(name1, className1, placeholder1);
      const fieldIsAmount = isAmountField(name1, className1, placeholder1);
      
      return (
        <CustomInput
          type={inputType1}
          name={name1}
          value={value1 || ''}
          onChange={handleInput1Change}
          disabled={isDisabled || isfirstInputDisabled}
          placeholder={placeholder1}
          onBlur={handleBlur}
          className={`${className1}-input ${fieldIsRate ? 'rate' : ''} ${fieldIsAmount ? 'amount' : ''}`}
          inputClass={fieldIsRate ? 'rate' : fieldIsAmount ? 'amount' : inputProps1.inputClass}
          showBorders={false}
          error={false}
          min={inputType1 === 'number' ? min1 : undefined}
          max={inputType1 === 'number' ? max1 : undefined}
          {...inputProps1}
        />
      );
    }
  };

  // Render the second input based on type
  const renderInput2 = () => {
    const handleInput2Change = (selectedOrEvent) => {
      if (setFieldValue && name2) {
        if (type2 === 'select') {
          setFieldValue(name2, selectedOrEvent.value);
        } else {
          setFieldValue(name2, selectedOrEvent.target.value);
        }
      }
      if (onChange2) {
        onChange2(selectedOrEvent);
      }
    };
    if (type2 === 'select') {
      return (
        <SearchableSelect
          label={null}
          options={options2}
          value={value2}
          onChange={handleInput2Change}
          isDisabled={isDisabled || isSecondInputDisabled}
          placeholder={placeholder2}
          name={name2}
          handleBlur={handleBlur}
          showBorders={false}
          {...inputProps2}
        />
      );
    } else {
      // Detect if this is a rate or amount field
      const fieldIsRate = isRateField(name2, className2, placeholder2);
      const fieldIsAmount = isAmountField(name2, className2, placeholder2);
      
      return (
        <CustomInput
          type={inputType2}
          name={name2}
          value={value2 || ''}
          rightIcon={rightIcon}
          onChange={handleInput2Change}
          disabled={isDisabled || isSecondInputDisabled || inputProps2.readOnly}
          placeholder={placeholder2}
          onBlur={handleBlur}
          className={`${className2}-input ${fieldIsRate ? 'rate' : ''} ${fieldIsAmount ? 'amount' : ''}`}
          inputClass={fieldIsRate ? 'rate' : fieldIsAmount ? 'amount' : inputProps2.inputClass}
          showBorders={false}
          error={false}
          min={inputType2 === 'number' ? min2 : undefined}
          max={inputType2 === 'number' ? max2 : undefined}
          {...inputProps2}
          onButtonClick={onButtonClick}
        />
      );
    }
  };
  return (
    <div className="combined-select-container">
      {label && <label className="mainLabel">{label}</label>}

      <div className="combined-select-input">
        <div
          className={`combined-select-left ${className1}-container ${
            isDisabled ? 'disabled-error' : ''
          }`}
        >
          {renderInput1()}
        </div>

        <div
          className={`${
            isDisabled ? 'separator-disabled' : ''
          } separator-between-selects bg-white`}
        >
          |
        </div>

        <div
          className={`combined-select-right ${className2}-container ${
            isDisabled ? 'disabled-error' : ''
          }`}
        >
          {renderInput2()}
        </div>
      </div>
      {additionalProps?.isLoadingCurrencyRate && (
        <p className="m-0 position-absolute primary-color-text">
          Fetching rate...
        </p>
      )}
    </div>
  );
};

export default CombinedInputs;
