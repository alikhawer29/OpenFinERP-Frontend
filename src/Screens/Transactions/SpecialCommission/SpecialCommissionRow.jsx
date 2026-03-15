import React from 'react';
import { HiOutlineTrash } from 'react-icons/hi2';
import CustomInput from '../../../Components/CustomInput';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { serialNum } from '../../../Utils/Utils';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import useAccountsByType from '../../../Hooks/useAccountsByType';

const SpecialCommissionRow = ({
  row,
  index,
  isDisabled,
  commissionAmount,
  updateField,
  handleDeleteRow,
  setShowAddLedgerModal,
  isDeleteDisabled = false,
}) => {
  const { getAccountsByTypeOptions } = useAccountsByType();
  return (
    <tr>
      <td>{serialNum(index + 1)}</td>
      <td>
        <SearchableSelect
          options={[
            { label: 'PL', value: 'party' },
            { label: 'GL', value: 'general' },
            { label: 'WIC', value: 'walkin' },
          ]}
          isDisabled={isDisabled}
          placeholder="Ledger"
          value={row.ledger}
          onChange={(selected) => {
            updateField(row.id, 'ledger', selected.value);
          }}
          borderRadius={10}
        />
      </td>
      <td>
        <SearchableSelect
          options={getAccountsByTypeOptions(row.ledger)}
          isDisabled={isDisabled}
          placeholder="Account"
          value={row.credit_account_id}
          isLoose={true}
          onChange={(selected) => {
            if (selected.label?.toLowerCase()?.startsWith('add new')) {
              if (setShowAddLedgerModal) {
                setShowAddLedgerModal(selected.label?.toLowerCase(), row.id);
              }
            } else {
              updateField(row.id, 'credit_account_id', selected.value);
            }
          }}
          borderRadius={10}
          minWidth={240}
        />
      </td>
      <td>
        <CustomInput
          type={'text'}
          value={row.narration}
          disabled={isDisabled}
          placeholder="Enter Narration"
          onChange={(e) => updateField(row.id, 'narration', e.target.value)}
          borderRadius={10}
          style={{ minWidth: 300 }}
        />
      </td>
      <td>
        <CustomInput
          type={'text'}
          value={row.percentage || ''}
          disabled={isDisabled}
          onChange={(e) => {
            let value = e.target.value;

            // Handle empty value
            if (value === '' || value === null || value === undefined) {
              updateField(row.id, 'percentage', '', true);
              return;
            }

            // Strict validation: Only allow numbers with maximum 2 decimal places
            // Regex pattern: allows numbers with optional decimal point and max 2 decimal digits
            const decimalPattern = /^-?\d*\.?\d{0,2}$/;

            // Check if the value matches the pattern (allows typing up to 2 decimals)
            if (!decimalPattern.test(value)) {
              // If it doesn't match, prevent the input by using the previous value
              return;
            }

            // Prevent negative values
            if (value.startsWith('-')) {
              return;
            }

            // Prevent values greater than 100
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && numValue > 100) {
              return;
            }

            // Handle leading zeros: "050" should be treated as 50
            if (value && typeof value === 'string' && value.trim() !== '') {
              // Don't normalize if user is typing a decimal (e.g., "0.5" should stay as "0.5")
              if (!value.includes('.')) {
                const normalizedValue = value.replace(/^0+/, '') || '0';
                if (value.replace(/^0+/, '') === '' && value.length > 1) {
                  value = '0';
                } else if (normalizedValue !== value) {
                  value = normalizedValue;
                }
              }
            }

            // Update the field with the validated value (store raw value while typing)
            updateField(row.id, 'percentage', value, true);
          }}
          onBlur={(e) => {
            // On blur, ensure the value is rounded to 2 decimal places
            const value = e.target.value;
            if (value && value !== '' && value !== null && value !== undefined) {
              const numValue = parseFloat(value);
              if (!isNaN(numValue)) {
                // Round to 2 decimal places
                const roundedValue = Math.round(numValue * 100) / 100;
                // Format to ensure exactly 2 decimal places are shown (always show decimals)
                const formattedValue = roundedValue.toFixed(2);
                if (formattedValue !== value) {
                  updateField(row.id, 'percentage', formattedValue, true);
                }
              }
            }
          }}
          min={0}
          max={100}
          step={0.01}
          borderRadius={10}
          style={{ maxWidth: 100 }}
        />
      </td>

      <td>
        <CustomInput
          type={'text'}
          value={row.amount ? (typeof row.amount === 'number' ? row.amount.toFixed(2) : parseFloat(row.amount || 0).toFixed(2)) : ''}
          disabled={true}
          placeholder="Amount"
          onChange={(e) => updateField(row.id, 'amount', e.target.value)}
          borderRadius={10}
          style={{ maxWidth: 135 }}
          readOnly
        />
      </td>

      <td>
        <TableActionDropDown
          actions={[
            {
              name: 'Delete',
              icon: HiOutlineTrash,
              onClick: () => handleDeleteRow(row.id),
              className: 'delete',
              disabled: isDisabled || isDeleteDisabled,
            },
          ]}
        />
      </td>
    </tr>
  );
};

export default SpecialCommissionRow;
