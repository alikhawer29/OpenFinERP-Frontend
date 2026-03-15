import { useEffect, useState, useRef } from 'react';
import { HiOutlineTrash } from 'react-icons/hi2';
import Skeleton from 'react-loading-skeleton';
import CustomInput from '../../../Components/CustomInput';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import useCurrencyRate from '../../../Hooks/useCurrencyRate';
import useUserStore from '../../../Stores/UserStore';
import { formatNumberForDisplay } from '../../../Utils/Utils';

const JournalVoucherRow = ({
  row,
  length = 3,
  index,
  isDisabled,
  updateField,
  currencyOptions,
  setShowMissingCurrencyRateModal,
  setCurrencyToSelect,
  getAccountsByTypeOptions,
  newlyCreatedAccount,
  setShowAddLedgerModal,
  handleDeleteRow,
  date,
  inputErrorClass,
  onRateChange,

}) => {
  const { user: { base_currency } = {} } = useUserStore();
  const [showRowRateError, setShowRowRateError] = useState(false);
  // Initialize as manually edited if we already have a custom rate or a saved pair_id (Edit mode/Clone)
  const isRateManuallyEdited = useRef(Boolean(row.rate && (row.pair_id || row.rate !== '1.00000000')));
  const previousCurrencyId = useRef(row.currency_id);

  // Only fetch currency rate if we have currency_id but missing rate or pair_id
  const shouldFetchRate = Boolean(
    row.currency_id &&
    (!row.rate || row.rate === '' || row.rate === '1.00000000' || !row.pair_id)
  );

  const { data: currencyRate, isLoading: isLoadingCurrencyRate } =
    useCurrencyRate(row.currency_id, date, {
      enabled: !!row.currency_id,
    });

  // Consolidate currency and rate synchronization
  useEffect(() => {
    // 1. Handle Currency Change / Reset
    if (previousCurrencyId.current !== row.currency_id) {
      const currencyIdChanged = previousCurrencyId.current !== row.currency_id;
      previousCurrencyId.current = row.currency_id;

      if (!row.currency_id) {
        // Currency cleared
        updateField(row.id, 'rate', '');
        updateField(row.id, 'pair_id', '');
        updateField(row.id, 'lc_amount', 0);
        isRateManuallyEdited.current = false;
        return;
      } else if (currencyIdChanged) {
        // Currency changed to a new one
        isRateManuallyEdited.current = false;
        // Don't clear rate immediately if we already have a valid rate for this currency/date
        // This helps with cloning or restoring. We'll let the currencyRate sync logic handle it.
      }
    }

    // 2. Handle Rate Synchronization and Range Storage
    if (currencyRate?.rate && row.currency_id) {
      // Always ensure ranges are synced to row state for save-time validation
      if (row.minRange !== currencyRate.min_range || row.maxRange !== currencyRate.max_range) {
        updateField(row.id, 'minRange', currencyRate.min_range);
        updateField(row.id, 'maxRange', currencyRate.max_range);
      }

      const needsUpdate =
        !row.rate ||
        row.rate === '' ||
        row.rate === '0' ||
        row.rate === 0 ||
        (row.pair_id !== currencyRate.id);

      if (needsUpdate) {
        // Always update pair_id to match current valid rate ID
        updateField(row.id, 'pair_id', currencyRate.id);

        // Update rate only if not manually edited or if rate is currently invalid/missing
        if (!isRateManuallyEdited.current || !row.rate || row.rate === '0' || row.rate === 0) {
          updateField(row.id, 'rate', currencyRate.rate);
        }
      }
    } else if (currencyRate !== undefined && !currencyRate?.rate && row.currency_id) {
      // Rate not found for selected currency
      setCurrencyToSelect(row.currency_id);
      setShowMissingCurrencyRateModal(true);
      updateField(row.id, 'lc_amount', 0);
      updateField(row.id, 'rate', '');
      updateField(row.id, 'currency_id', null);
      updateField(row.id, 'pair_id', '');
      isRateManuallyEdited.current = false;
      previousCurrencyId.current = null;
    }
  }, [currencyRate, row.currency_id, row.rate, row.pair_id, date]);

  // Handle LC Amount calculation whenever rate or fc_amount changes
  useEffect(() => {
    if (row.rate && row.fc_amount) {
      const calculatedLC = parseFloat(row.fc_amount) * parseFloat(row.rate);
      // Use a small epsilon check or just update if different
      if (Math.abs((parseFloat(row.lc_amount) || 0) - calculatedLC) > 0.000001) {
        updateField(row.id, 'lc_amount', calculatedLC);
      }
    } else if ((!row.rate || !row.fc_amount) && parseFloat(row.lc_amount) !== 0) {
      updateField(row.id, 'lc_amount', 0);
    }
  }, [row.rate, row.fc_amount, row.lc_amount]);

  // Helper to get selected account label for tooltip
  const getSelectedAccountLabel = () => {
    const options = getAccountsByTypeOptions(row.ledger);
    const selected = options.find(opt => opt.value === row.account_id);
    return selected?.label || '';
  };

  // Helper to get selected currency label for tooltip
  const getSelectedCurrencyLabel = () => {
    const selected = currencyOptions.find(opt => opt.value === row.currency_id);
    return selected?.label || '';
  };

  return (
    <tr>
      <td className="text-center">{index + 1}</td>
      <td>
        <SearchableSelect
          isDisabled={isDisabled}
          options={[
            { label: 'PL', value: 'party' },
            { label: 'GL', value: 'general' },
            { label: 'WIC', value: 'walkin' },
          ]}
          placeholder="Ledger"
          value={row.ledger}
          onChange={(selected) => {
            updateField(row.id, 'ledger', selected.value);
          }}
          borderRadius={10}
          minWidth={120}
          style={{ maxWidth: 120 }}
          tooltipText={
            row.ledger === 'party' ? 'PL' :
              row.ledger === 'general' ? 'GL' :
                row.ledger === 'walkin' ? 'WIC' : ''
          }
        />
      </td>
      <td>
        <SearchableSelect
          isDisabled={isDisabled}
          options={getAccountsByTypeOptions(row.ledger)}
          placeholder="Account"
          value={row.account_id}
          onChange={(selected) => {
            if (selected.label?.toLowerCase()?.startsWith('add new')) {
              setShowAddLedgerModal(selected.label?.toLowerCase());
            } else {
              updateField(row.id, 'account_id', selected.value);
            }
          }}
          borderRadius={10}
          minWidth={250}
          style={{ maxWidth: 250 }}
          tooltipText={getSelectedAccountLabel()}
        />
      </td>
      <td>
        <CustomInput
          type={'text'}
          value={row.narration}
          placeholder="Enter Narration"
          disabled={isDisabled}
          onChange={(e) => updateField(row.id, 'narration', e.target.value)}
          borderRadius={10}
          style={{ minWidth: 250, maxWidth: 250, width: 250 }}
          title={row.narration}

        />
      </td>
      <td>
        <SearchableSelect
          isDisabled={isDisabled}
          options={currencyOptions}
          value={row.currency_id}
          onChange={(selected) => {
            updateField(row.id, 'currency_id', selected.value);
          }}
          borderRadius={10}
          minWidth={120}
          style={{ maxWidth: 120 }}
          tooltipText={getSelectedCurrencyLabel()}
        />
      </td>
      <td>
        <CustomInput
          type={'number'}
          value={row.fc_amount}
          placeholder="Enter FC Amount"
          disabled={isDisabled}
          onChange={(e) => {
            if (row.rate) {
              if (e.target.value === '') {
                updateField(row.id, 'lc_amount', 0);
              } else {
                updateField(
                  row.id,
                  'lc_amount',
                  parseFloat(e.target.value) * parseFloat(row.rate)
                );
              }
            }
            updateField(row.id, 'fc_amount', e.target.value);
          }}
          borderRadius={10}
          title={row.fc_amount}
        />
      </td>
      <td>
        {isLoadingCurrencyRate ? (
          <Skeleton duration={1} width={'100%'} baseColor="#ddd" height={16} />
        ) : (
          <CustomInput
            type={'text'}
            value={row.rate || ''}
            placeholder="Rate"
            inputClass={showRowRateError ? 'text-danger' : ''}
            disabled={isDisabled}
            error={
              showRowRateError
                ? (row.rate === '' && row.currency_id)
                  ? 'Rate is required'
                  : currencyRate?.min_range
                    ? `Range: ${formatNumberForDisplay(currencyRate.min_range, 8)} - ${formatNumberForDisplay(currencyRate.max_range, 8)}`
                    : ''
                : ''
            }
            onChange={(e) => {
              // Mark rate as manually edited
              isRateManuallyEdited.current = true;
              const newRate = parseFloat(e.target.value);

              const isError =
                (e.target.value === '' && row.currency_id) ||
                (e.target.value !== '' &&
                  (isNaN(newRate) ||
                    newRate < parseFloat(currencyRate?.min_range || 0) ||
                    newRate > parseFloat(currencyRate?.max_range || 999999999)));

              setShowRowRateError(isError);
              updateField(row.id, 'error', isError);
              updateField(row.id, 'rate', e.target.value);
            }}
            onBlur={(e) => {
              const newRate = parseFloat(e.target.value);
              const isError =
                (e.target.value === '' && row.currency_id) ||
                (e.target.value !== '' &&
                  (isNaN(newRate) ||
                    newRate < parseFloat(currencyRate?.min_range || 0) ||
                    newRate > parseFloat(currencyRate?.max_range || 999999999)));

              // Notify parent of rate change with range data only on blur
              if (onRateChange && currencyRate && isError) {
                onRateChange({
                  rowId: row.id,
                  currencyId: row.currency_id,
                  currentRate: newRate,
                  minRange: parseFloat(currencyRate.min_range),
                  maxRange: parseFloat(currencyRate.max_range),
                  currency: currencyOptions.find(opt => opt.value === row.currency_id)?.label || 'Unknown',
                  isError
                });
              }
            }}
            borderRadius={10}
            title={formatNumberForDisplay(row.rate, 8)}
            inputErrorClass={"journal-voucher-Row-error "}
          />
        )}
      </td>
      <td>
        <CustomInput
          type={'number'}
          value={row.lc_amount}
          placeholder={`${base_currency || 'LC'} Amount`}
          disabled={true}
          onChange={(e) => updateField(row.id, 'lc_amount', e.target.value)}
          borderRadius={10}
          style={{ minWidth: 135, maxWidth: 135, width: 135 }}
          title={row.lc_amount}
        />
      </td>
      <td>
        <SearchableSelect
          isDisabled={isDisabled}
          options={[
            {
              label: 'Debit',
              value: 'Debit',
            },
            {
              label: 'Credit',
              value: 'Credit',
            },
          ]}
          value={row.sign}
          onChange={(selected) => updateField(row.id, 'sign', selected.value)}
          borderRadius={10}
          minWidth={135}
          style={{ maxWidth: 135 }}
          tooltipText={row.sign === 'Debit' ? 'Debit' : row.sign === 'Credit' ? 'Credit' : ''}
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
              disabled: isDisabled ? isDisabled : length <= 2 ? true : false,
            },
          ]}
        />
      </td>
    </tr>
  );
};

export default JournalVoucherRow;
