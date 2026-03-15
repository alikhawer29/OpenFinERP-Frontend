import React, { useCallback, useMemo } from 'react';
import CustomInput from '../../../../Components/CustomInput';
import SearchableSelect from '../../../../Components/SearchableSelect/SearchableSelect';
import { formatNumberWithCommas } from '../../../../Utils/Helpers';

const TTRConfirmationRow = ({
  row,
  isDisabled,
  updateField,
  documentOptions,
  unConfirmed,
  totalConfirmedAmount,
}) => {
  // Calculate available amount for this row
  const availableAmount = useMemo(() => {
    const currentRowAmount = parseFloat(row.tmn_amount) || 0;
    const otherRowsAmount = totalConfirmedAmount - currentRowAmount;
    return Math.max(0, unConfirmed - otherRowsAmount);
  }, [unConfirmed, totalConfirmedAmount, row.tmn_amount]);

  // Handle amount change with validation
  const handleAmountChange = useCallback(
    (value) => {
      const numericValue = parseFloat(value) || 0;

      // Validate against available amount
      if (numericValue > availableAmount) {
        // You can show a toast message here if needed
        console.warn(`Amount cannot exceed ${availableAmount}`);
        return;
      }

      updateField(row.id, 'tmn_amount', value);
    },
    [availableAmount, updateField, row.id]
  );

  // Handle document type change
  const handleDocTypeChange = useCallback(
    (selected) => {
      updateField(row.id, 'doc_type', selected?.value || '');
    },
    [updateField, row.id]
  );

  // Handle document number change
  const handleDocNoChange = useCallback(
    (e) => {
      updateField(row.id, 'doc_no', e.target.value);
    },
    [updateField, row.id]
  );

  // Handle narration change
  const handleNarrationChange = useCallback(
    (e) => {
      updateField(row.id, 'narration', e.target.value);
    },
    [updateField, row.id]
  );

  // Prepare document options
  const docOptions = useMemo(
    () =>
      documentOptions?.map((item) => ({
        value: item.id,
        label: item.description,
      })) || [],
    [documentOptions]
  );

  return (
    <tr>
      <td>
        <SearchableSelect
          isDisabled={isDisabled}
          options={docOptions}
          placeholder="Select Doc Type"
          value={row.doc_type}
          onChange={handleDocTypeChange}
          borderRadius={10}
          minWidth={380}
          style={{ maxWidth: 280, width: 280 }}
        />
      </td>

      <td>
        <CustomInput
          type="text"
          value={row.doc_no}
          placeholder="Enter Doc No."
          disabled={isDisabled}
          onChange={handleDocNoChange}
          borderRadius={10}
          style={{ minWidth: 280, maxWidth: 280, width: 280 }}
        />
      </td>

      <td>
        <CustomInput
          type="text"
          value={row.narration}
          placeholder="Enter Narration"
          disabled={isDisabled}
          onChange={handleNarrationChange}
          borderRadius={10}
          style={{ minWidth: 380, maxWidth: 380, width: 380 }}
          title={row.narration}
        />
      </td>

      <td>
        <div className="position-relative ">
          <CustomInput
            type="number"
            value={formatNumberWithCommas(row.tmn_amount)}
            placeholder="Enter TMN Amount"
            disabled={isDisabled}
            onChange={(e) => handleAmountChange(e.target.value)}
            min={0}
            max={availableAmount}
            step="0.01"
            borderRadius={10}
            style={{ minWidth: 280, maxWidth: 280, width: 280 }}
            title={formatNumberWithCommas(row.tmn_amount)}
            className={
              parseFloat(row.tmn_amount) > availableAmount
                ? 'border-danger'
                : ''
            }
          />

          {/* Error message */}
          {parseFloat(row.tmn_amount) > availableAmount && (
            <div className="text-danger small mt-1">
              Amount exceeds available balance
            </div>
          )}
        </div>

      </td>
    </tr>
  );
};

export default TTRConfirmationRow;
