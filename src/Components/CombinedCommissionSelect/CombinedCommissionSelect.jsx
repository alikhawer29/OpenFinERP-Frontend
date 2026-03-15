import { ErrorMessage } from 'formik';
import React, { useRef, useState, useEffect } from 'react';
import './CombinedCommissionSelect.css';
import { themeDictionary } from '../../Utils/Constants/ColorConstants';
import useThemeStore from '../../Stores/ThemeStore';

const CombinedCommissionSelect = ({
  commissionValue,
  commissionAmountValue,
  onCommissionChange,
  isDisabled,
  handleBlur,
}) => {
  const { theme } = useThemeStore();
  const [fontSize, setFontSize] = useState('14px');

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

  return (
    <div className="combined-select-container">
      <label className="mainLabel">Commission Percentage</label>

      <div className="combined-select-input">
        <div className="combined-select-left">
          <input
            type="number"
            name="commission"
            value={commissionValue || ''}
            onChange={onCommissionChange}
            disabled={isDisabled}
            placeholder="Enter Commission Percentage"
            onBlur={handleBlur}
            className="commission-input"
            style={{ fontSize }}
            min={0}
            max={100}
          />
          <ErrorMessage
            name="commission"
            component="div"
            className="input-error-message text-danger"
          />
        </div>

        <div className="separator-between-selects">|</div>

        <div className="combined-select-right">
          <input
            type="text"
            name="commission_amount"
            value={commissionAmountValue || ''}
            disabled={true}
            placeholder="Commission Amount"
            className="commission-amount-input"
            style={{ fontSize }}
          />
          <ErrorMessage
            name="commission_amount"
            component="div"
            className="input-error-message text-danger"
          />
        </div>
      </div>
    </div>
  );
};

export default CombinedCommissionSelect;
