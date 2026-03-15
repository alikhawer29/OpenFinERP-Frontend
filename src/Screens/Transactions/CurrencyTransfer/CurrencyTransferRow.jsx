import { useEffect, useState } from 'react';
import { HiOutlineTrash } from 'react-icons/hi2';
import CustomInput from '../../../Components/CustomInput';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import useCurrencyRate from '../../../Hooks/useCurrencyRate';
import { serialNum } from '../../../Utils/Utils';
import { FaPaperclip } from 'react-icons/fa6';
import { formatNumberWithCommas } from '../../../Utils/Helpers';

const CurrencyTransferRow = ({
  row,
  index,
  isDisabled,
  updateField,
  handleDeleteRow,
  setShowMissingCurrencyRateModal,
  setCurrencyToSelect,
  currencyOptions = [],
  date,
  bankOptions = [],
  docTypeOptions = [],
  cityOptions = [],
  // Row-level attachment props
  onRowAttachmentClick,
  fieldErrors = {},
  forceShowErrors = false,
}) => {
  const [touchedAmount, setTouchedAmount] = useState(false);
  const [touchedCurrency, setTouchedCurrency] = useState(false);

  // Fetch currency rate using custom hook (following JournalVoucherRow pattern)
  const { data: currencyRate } =
    useCurrencyRate(row.currency_id, date);

  // Handle currency rate response (following JournalVoucherRow pattern)
  useEffect(() => {
    if (currencyRate?.rate) {
      updateField(row.id, 'rate', currencyRate.rate);
    } else if (currencyRate && !isDisabled) {
      // Only show rate modal when form is not disabled
      // Ensure we have a currency selected before showing modal
      if (row.currency_id) {
        setCurrencyToSelect(row.currency_id);
        setShowMissingCurrencyRateModal(true);
      }
    }
  }, [currencyRate?.rate, isDisabled, row.currency_id]);

  // Track previous disabled state to detect when form becomes enabled
  const [prevIsDisabled, setPrevIsDisabled] = useState(isDisabled);

  // Check for missing rate when form becomes enabled (for TMN currency)
  useEffect(() => {
    // Only trigger when form changes from disabled to enabled
    if (
      prevIsDisabled &&
      !isDisabled &&
      row.currency_id &&
      currencyRate &&
      !currencyRate.rate
    ) {
      // When form becomes enabled and TMN currency is selected but has no rate, show modal
      setCurrencyToSelect(row.currency_id);
      setShowMissingCurrencyRateModal(true);
    }
    setPrevIsDisabled(isDisabled);
  }, [isDisabled, row.currency_id, currencyRate, prevIsDisabled]);

  return (
    <tr style={{ verticalAlign: 'middle' }}>
      <td style={{ paddingBottom: 15 }}>{serialNum(index + 1)}</td>
      <td style={{ minWidth: '120px', paddingBottom: 15 }}>
        <div style={{ position: 'relative' }}>
          <SearchableSelect
            options={currencyOptions}
            value={row.currency}
            borderRadius={10}
            isDisabled={isDisabled}
            onChange={(selected) => {
              // Following JournalVoucherRow pattern for currency selection
              updateField(row.id, 'currency', selected.value);
              updateField(row.id, 'currency_id', selected.value); // Store currency_id for rate fetching
            }}
            onBlur={() => setTouchedCurrency(true)}
            placeholder="Select Currency"
          />
          {fieldErrors.currency && (touchedCurrency || forceShowErrors) && (
            <div
              className="input-error-message text-danger"
              style={{
                fontSize: '0.75rem',
                position: 'absolute',
                bottom: -18,
                left: 0,
              }}
            >
              Currency is required
            </div>
          )}
        </div>
      </td>
      <td style={{ minWidth: '300px', paddingBottom: 15 }}>
        <div style={{ position: 'relative' }}>
          <CustomInput
            type="number"
            value={formatNumberWithCommas(row.amount) || row.amount}
            placeholder="Enter Amount"
            disabled={isDisabled}
            onChange={(e) => updateField(row.id, 'amount', e.target.value)}
            onBlur={() => setTouchedAmount(true)}
            borderRadius={10}
          />
          {fieldErrors.amount && (touchedAmount || forceShowErrors) && (
            <div
              className="input-error-message text-danger"
              style={{
                fontSize: '0.75rem',
                position: 'absolute',
                bottom: -18,
                left: 0,
              }}
            >
              Amount is required
            </div>
          )}
        </div>
      </td>
      <td style={{ minWidth: '300px', paddingBottom: 15 }}>
        <CustomInput
          type="text"
          value={row.narration}
          placeholder="Enter Narration"
          disabled={isDisabled}
          onChange={(e) => updateField(row.id, 'narration', e.target.value)}
          borderRadius={10}
        />
      </td>
      <td style={{ minWidth: '150px', paddingBottom: 15 }}>
        <SearchableSelect
          options={docTypeOptions}
          value={row.docType}
          borderRadius={10}
          isDisabled={isDisabled}
          onChange={(selected) =>
            updateField(row.id, 'docType', selected.value)
          }
          placeholder="Select Doc Type"
        />
      </td>
      <td style={{ paddingBottom: 15 }}>
        <CustomInput
          type="text"
          value={row.docNo}
          placeholder="Enter Doc No"
          disabled={isDisabled}
          onChange={(e) => updateField(row.id, 'docNo', e.target.value)}
          borderRadius={10}
        />
      </td>
      <td style={{ minWidth: '120px', paddingBottom: 15 }}>
        <SearchableSelect
          options={bankOptions}
          value={row.bank}
          borderRadius={10}
          isDisabled={isDisabled}
          onChange={(selected) => updateField(row.id, 'bank', selected.value)}
          placeholder="Select Bank"
        />
      </td>
      <td style={{ minWidth: '120px', paddingBottom: 15 }}>
        <SearchableSelect
          options={cityOptions}
          value={row.city}
          borderRadius={10}
          isDisabled={isDisabled}
          onChange={(selected) => updateField(row.id, 'city', selected.value)}
          placeholder="Select City"
        />
      </td>
      <td style={{ paddingBottom: 15 }}>
        <CustomInput
          type="text"
          value={row.code}
          placeholder="Enter Code"
          disabled={isDisabled}
          onChange={(e) => updateField(row.id, 'code', e.target.value)}
          borderRadius={10}
        />
      </td>
      <td style={{ paddingBottom: 15 }}>
        <TableActionDropDown
          actions={[
            {
              name: 'Delete',
              icon: HiOutlineTrash,
              disabled: isDisabled,
              onClick: () => handleDeleteRow(row.id),
              className: 'delete',
            },
            {
              name: 'Attachment',
              icon: FaPaperclip,
              onClick: () => onRowAttachmentClick?.(row.id),
              disabled: isDisabled,
            },
          ]}
        />
      </td>
    </tr>
  );
};

export default CurrencyTransferRow;
