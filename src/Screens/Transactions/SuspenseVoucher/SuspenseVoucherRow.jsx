import React, { useState } from 'react';
import { HiOutlineTrash } from 'react-icons/hi2';
import CustomInput from '../../../Components/CustomInput';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { serialNum } from '../../../Utils/Utils';

const SuspenseVoucherRow = ({
  row,
  index,
  isDisabled,
  updateField,
  handleDeleteRow,
  errors: externalErrors = {},
}) => {
  const [internalErrors, setInternalErrors] = useState({});

  // Check if row should be disabled based on status
  const isRowDisabled = isDisabled || row.status === 'Settle';

  // Check if delete action should be shown
  const shouldShowDelete = row.status !== 'Settle';

  // Validate numeric input
  const validateNumericInput = (value) => {
    if (value === '') return true; // Allow empty values
    const numericRegex = /^[0-9]+(\.[0-9]+)?$/;
    return numericRegex.test(value);
  };

  // Handle input changes with status logic and validation
  const handleInputChange = (field, value) => {
    // If status is 'Approved' and any input is changed, automatically change to 'Open'
    if (row.status === 'Approved') {
      updateField(row.id, 'status', 'open');
    }

    // Validate numeric fields
    if (field === 'debit' || field === 'credit') {
      if (!validateNumericInput(value)) {
        setInternalErrors((prev) => ({
          ...prev,
          [field]: 'Enter numbers only',
        }));
        return; // Don't update the field if validation fails
      } else {
        setInternalErrors((prev) => ({
          ...prev,
          [field]: '',
        }));
      }
    }

    updateField(row.id, field, value);
  };

  // Get display status
  const getDisplayStatus = (status) => {
    switch (status) {
      case 'open':
        return 'Open';
      case 'closed':
        return 'Closed';
      case 'Approved':
        return 'Approved';
      case 'Settle':
        return 'Settled';
      default:
        return status;
    }
  };

  return (
    <tr>
      <td>{serialNum(index + 1)}</td>
      <td>
        <CustomInput
          type={'text'}
          value={row.narration}
          placeholder="Enter Narration"
          disabled={isRowDisabled}
          onChange={(e) => handleInputChange('narration', e.target.value)}
          borderRadius={10}
        />
      </td>

      <td>
        <div>
          <CustomInput
            type={'text'}
            value={row.debit}
            placeholder="Enter Debit Amount"
            disabled={isRowDisabled}
            onChange={(e) => handleInputChange('debit', e.target.value)}
            borderRadius={10}
            error={internalErrors.debit || externalErrors.debit}
            inputErrorClass="journal-voucher-Row-error"
          />
        </div>
      </td>
      <td>
        <div>
          <CustomInput
            type={'text'}
            value={row.credit}
            placeholder="Enter Credit Amount"
            disabled={isRowDisabled}
            onChange={(e) => handleInputChange('credit', e.target.value)}
            borderRadius={10}
            error={internalErrors.credit || externalErrors.credit}
            inputErrorClass="journal-voucher-Row-error"
          />
        </div>
      </td>
      <td>
        <CustomInput
          type={'text'}
          value={getDisplayStatus(row.status)}
          placeholder="Status"
          disabled={true}
          onChange={(e) => updateField(row.id, 'status', e.target.value)}
          borderRadius={10}
        />
      </td>

      <td>
        {shouldShowDelete && (
          <TableActionDropDown
            actions={[
              {
                name: 'Delete',
                icon: HiOutlineTrash,
                onClick: () => handleDeleteRow(row.id),
                className: 'delete',
              },
            ]}
          />
        )}
      </td>
    </tr>
  );
};

export default SuspenseVoucherRow;
