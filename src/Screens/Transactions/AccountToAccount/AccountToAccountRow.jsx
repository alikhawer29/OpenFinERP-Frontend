import React, { useState } from 'react';
import { HiOutlineTrash } from 'react-icons/hi2';
import CustomInput from '../../../Components/CustomInput';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { serialNum } from '../../../Utils/Utils';

const AccountToAccountRow = ({
  row,
  index,
  isDisabled,
  updateField,
  handleDeleteRow,
}) => {
  const [errors, setErrors] = useState({});
  const isRowDisabled = isDisabled || row.status === 'Settle';
  const shouldShowDelete = row.status !== 'Settle';

  const validateNumericInput = (value) => {
    if (value === '') return true;
    const numericRegex = /^[0-9]+(\.[0-9]+)?$/;
    return numericRegex.test(value);
  };

  const handleInputChange = (field, value) => {
    if (row.status === 'Approved') {
      updateField(row.id, 'status', 'open');
    }
    if (field === 'debit' || field === 'credit') {
      if (!validateNumericInput(value)) {
        setErrors((prev) => ({ ...prev, [field]: 'Enter debit or credit amount (numbers only)' }));
        return;
      } else {
        setErrors((prev) => ({ ...prev, [field]: '' }));
      }
    }
    updateField(row.id, field, value);
  };

  const getDisplayStatus = (status) => {
    switch (status) {
      case 'open': return 'Open';
      case 'closed': return 'Closed';
      case 'Approved': return 'Approved';
      case 'Settle': return 'Settle';
      default: return status;
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
          style={{ minWidth: 300 }}
        />
      </td>
      <td>
        <CustomInput
          type={'text'}
          value={row.debit}
          placeholder="Enter Debit Amount"
          disabled={isRowDisabled}
          onChange={(e) => handleInputChange('debit', e.target.value)}
          borderRadius={10}
          error={errors.debit}
        />
      </td>
      <td>
        <CustomInput
          type={'text'}
          value={row.credit}
          placeholder="Enter Credit Amount"
          disabled={isRowDisabled}
          onChange={(e) => handleInputChange('credit', e.target.value)}
          borderRadius={10}
          error={errors.credit}
        />
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
            actions={[{
              name: 'Delete',
              icon: HiOutlineTrash,
              onClick: () => handleDeleteRow(row.id),
              className: 'delete',
            }]}
          />
        )}
      </td>
    </tr>
  );
};

export default AccountToAccountRow; 