import { FaMagnifyingGlass } from 'react-icons/fa6';
import { HiOutlineTrash } from 'react-icons/hi2';
import CustomInput from '../../../Components/CustomInput';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { payTypeOptions } from '../../../Utils/Constants/SelectOptions';
import { serialNum } from '../../../Utils/Utils';

const InwardPaymentOrderRow = ({
  row,
  index,
  isDisabled,
  updateField,
  handleDeleteRow,
  currencyOptions = [],
  onOpenWalkinModal, // new prop
  hasSpecialCommission = false, // new prop to disable commission field
  setSelectedCurrency, // new prop for currency rate checking
  setHasShownMissingRateModal, // new prop for currency rate checking
  fieldErrors = {}, // new prop for showing field-level errors
  forceShowErrors = false,
}) => {
  return (
    <tr>
      <td>{serialNum(index + 1)}</td>
      <td>
        <CustomInput
          type="text"
          value={row.refNo}
          placeholder="Enter Ref No"
          disabled={isDisabled}
          onChange={(e) => updateField(row.id, 'refNo', e.target.value)}
          borderRadius={10}
        />
        <div style={{ minHeight: 18 }}></div>
      </td>
      <td style={{ minWidth: '120px' }}>
        <SearchableSelect
          options={payTypeOptions}
          value={row.payType || ''}
          isDisabled={isDisabled}
          borderRadius={10}
          onChange={(selected) => {
            updateField(row.id, 'payType', selected.value);
            // If pay type is PDC, increment payDate by one day
            try {
              if (selected?.value === 'pdc') {
                const base = row.payDate ? new Date(row.payDate) : new Date();
                const next = new Date(base);
                next.setDate(base.getDate() + 1);
                const iso = next.toISOString().split('T')[0];
                updateField(row.id, 'payDate', iso);
              }
            } catch (e) {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              updateField(row.id, 'payDate', tomorrow.toISOString().split('T')[0]);
            }
          }}
          onBlur={() => {}}
          placeholder="Select Pay Type"
        />
        <div style={{ minHeight: 18 }}>
          {fieldErrors.payType && forceShowErrors ? (
            <div className="input-error-message text-danger">Pay Type is required</div>
          ) : null}
        </div>
      </td>
      <td style={{ minWidth: '200px', position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <CustomInput
            type="text"
            value={row.walkInCustomer || ''}
            placeholder="Select Beneficiary"
            disabled={isDisabled}
            readOnly
            borderRadius={10}
            rightIcon={FaMagnifyingGlass}
            onButtonClick={() => {
              if (!isDisabled) {
                onOpenWalkinModal(row.id);
              }
            }}
            searchIconDisabled={isDisabled}
            onBlur={() => {}}
          />
        </div>
        <div style={{ minHeight: 18 }}>
          {fieldErrors.walkInCustomerId && forceShowErrors ? (
            <div className="input-error-message text-danger">Beneficiary is required</div>
          ) : null}
        </div>
      </td>
      <td>
        <CustomInput
          type="text"
          value={row.sender}
          placeholder="Enter Sender"
          disabled={isDisabled}
          onChange={(e) => updateField(row.id, 'sender', e.target.value)}
          borderRadius={10}
        />
        <div style={{ minHeight: 18 }}></div>
      </td>
      <td>
        <CustomInput
          type="text"
          value={row.idNumber && row.idNumber !== '0' ? row.idNumber : ''}
          placeholder="Enter ID Number"
          disabled={isDisabled}
          onChange={(e) => updateField(row.id, 'idNumber', e.target.value)}
          borderRadius={10}
        />
        <div style={{ minHeight: 18 }}></div>
      </td>
      <td>
        <CustomInput
          type="text"
          value={row.contactNo}
          placeholder="Enter Contact No"
          disabled={isDisabled}
          onChange={(e) => {
            // Allow only numbers
            const value = e.target.value.replace(/[^0-9]/g, '');
            updateField(row.id, 'contactNo', value);
          }}
          borderRadius={10}
        />
        <div style={{ minHeight: 18 }}></div>
      </td>
      <td style={{ minWidth: '120px' }}>
        <SearchableSelect
          options={currencyOptions}
          value={row.currency || ''}
          borderRadius={10}
          isDisabled={isDisabled}
          onChange={(selected) => {
            // Update currency in row
            updateField(row.id, 'currency', selected.value);
            // Set selected currency for rate checking (following Receipt Voucher pattern)
            if (setSelectedCurrency) {
              setSelectedCurrency(selected.value);
            }
            // Reset the missing rate modal flag when currency changes
            if (setHasShownMissingRateModal) {
              setHasShownMissingRateModal(false);
            }
          }}
          onBlur={() => {}}
          placeholder="Select Currency"
        />
      <div style={{ minHeight: 18 }}>
        {fieldErrors.currency && forceShowErrors ? (
          <div className="input-error-message text-danger">Currency is required</div>
        ) : null}
      </div>
      </td>
      <td>
        <CustomInput
          type="number"
          value={row.fcAmount ? parseFloat(row.fcAmount).toFixed(2) : ''}
          placeholder="Enter FC Amount"
          disabled={isDisabled}
          onChange={(e) => updateField(row.id, 'fcAmount', e.target.value)}
          onBlur={() => {}}
          borderRadius={10}
        />
        <div style={{ minHeight: 18 }}>
          {fieldErrors.fcAmount && forceShowErrors ? (
            <div className="input-error-message text-danger">FC Amount is required</div>
          ) : null}
        </div>
      </td>
      <td>
        <CustomInput
          type="number"
          value={row.commission ? parseFloat(row.commission).toFixed(2) : ''}
          placeholder="Enter Commission Amount"
          style={{ cursor: hasSpecialCommission ? 'not-allowed' : '' }}
          disabled={isDisabled || hasSpecialCommission}
          readOnly={hasSpecialCommission}
          onChange={(e) => {
            // Allow any positive commission amount (not restricted to 100)
            const value = parseFloat(e.target.value);
            if (isNaN(value) || value >= 0) {
              updateField(row.id, 'commission', e.target.value);
            }
          }}
          min="0"
          step="0.01"
          borderRadius={10}
        />
        <div style={{ minHeight: 18 }}></div>
      </td>
      <td>
        <CustomInput
          type="date"
          value={row.payDate}
          placeholder="Select Pay Date"
          disabled={isDisabled}
          onChange={(e) => updateField(row.id, 'payDate', e.target.value)}
          onBlur={() => {}}
          borderRadius={10}
        />
        <div style={{ minHeight: 18 }}>
          {fieldErrors.payDate && forceShowErrors ? (
            <div className="input-error-message text-danger">Pay Date is required</div>
          ) : null}
        </div>
      </td>
      <td style={{ minWidth: '120px' }}>
        <CustomInput
          type="text"
          value={row.bankName}
          placeholder="Enter bank name"
          disabled={isDisabled}
          onChange={(e) => updateField(row.id, 'bankName', e.target.value)}
          onBlur={() => {}}
          borderRadius={10}
        />
        <div style={{ minHeight: 18 }}>
          {/* Removed Bank Name validation error */}
        </div>
      </td>
      <td>
        <CustomInput
          type="text"
          value={row.bankAc}
          placeholder="Enter Bank A/c"
          disabled={isDisabled}
          onChange={(e) => updateField(row.id, 'bankAc', e.target.value)}
          onBlur={() => {}}
          borderRadius={10}
        />
        <div style={{ minHeight: 18 }}>
          {/* Removed Bank Account validation error */}
        </div>

      </td>
      <td>
        <CustomInput
          type="text"
          value={row.narration}
          placeholder="Enter Narration"
          disabled={isDisabled}
          onChange={(e) => updateField(row.id, 'narration', e.target.value)}
          borderRadius={10}
        />
        <div style={{ minHeight: 18 }}></div>

      </td>
      <td>
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
      </td>
    </tr>
  );
};

export default InwardPaymentOrderRow;
