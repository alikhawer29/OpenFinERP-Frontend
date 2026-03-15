import React, { useEffect, useState } from 'react';
import { HiOutlineTrash } from 'react-icons/hi2';
import CustomInput from '../../../Components/CustomInput';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { serialNum } from '../../../Utils/Utils';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';

const InternalPaymentVoucherRow = ({
  row,
  index,
  updateField,
  isDisabled,
  handleDeleteRow,
  accountData,
  setShowAddLedgerModal,
  currencyOptions,
  vatData,
  currency,
  setShowVatOutOfScopeModal,
  setCurrentRowForVat,
  isVatTypeMismatch,
  voucherVatType,
  fieldErrors = {}, // new prop for showing field-level errors
  forceShowErrors = false,
}) => {
  const [touchedAmount, setTouchedAmount] = useState(false);

  // Set currency_id from the form's selected currency
  useEffect(() => {
    if (currency && !row.currency_id) {
      updateField(row.id, 'currency_id', currency);
    }
  }, [currency, row.id, row.currency_id]);

  const getAccountsByTypeOptions = (accountType) => {
    if (!accountType) {
      return [{ label: 'Select Ledger', value: null, isDisabled: true }];
    }

    const { data, loading, error, errorMessage } =
      accountData[accountType] || {};

    if (loading) {
      return [{ label: 'Loading...', value: null, isDisabled: true }];
    }

    if (error) {
      return [{ label: 'Unable to fetch Accounts', value: null }];
    }
    let options =
      data?.map((x) => ({
        value: x?.id,
        label: x?.title,
      })) || [];
    switch (accountType) {
      case 'party':
        options.push({
          label: `Add New PL`,
          value: null,
        });
        break;
      case 'general':
        options.push({
          label: `Add New GL`,
          value: null,
        });
        break;
      case 'walkin':
        options.push({
          label: `Add New WIC`,
          value: null,
        });
        break;
      default:
        break;
    }
    return options;
  };

  // Helper to get selected account label for tooltip
  const getSelectedAccountLabel = () => {
    const options = getAccountsByTypeOptions(row.ledger);
    const selected = options.find(opt => opt.value === row.debit_account_id);
    return selected?.label || '';
  };

  // Helper to get selected VAT terms label for tooltip
  const getSelectedVATTermsLabel = () => {
    const options = getVATTermsOptions();
    const selected = options.find(opt => opt.value === row.vat_terms_id);
    return selected?.label || row.vat_terms || '';
  };

  const getVATTermsOptions = () => {
    if (vatData.isLoadingVatType) {
      return [{ label: 'Loading...', value: '' }];
    }

    if (vatData.isErrorVatType) {
      return [{ label: 'Unable to fetch VAT Terms', value: null }];
    }

    return (
      vatData?.vatType?.vats?.map((item) => ({
        label: `${item.title}${!isNaN(parseFloat(item.percentage))
          ? ' - ' + item.percentage + '%'
          : ''
          }`,
        value: item.id, // Use ID as value for proper selection
        id: item.id, // Include the VAT term ID
        title: item.title, // Include the title for VAT condition checks
        percentage: item.percentage, // Include the percentage for calculations
      })) || []
    );
  };

  // Helper function to check if VAT amount should be 0 based on VAT terms
  const shouldVatAmountBeZero = (vatTerms) => {
    if (!vatTerms) return false;

    const vatTermsLower = vatTerms.toLowerCase();
    return (
      vatTermsLower === 'exempted' ||
      vatTermsLower.includes('zero rate') ||
      vatTermsLower === 'out of scope' ||
      vatTermsLower.includes('0.00%')
    );
  };

  const vatOptions = getVATTermsOptions();

  // Auto-set VAT for fixed VAT type
  useEffect(() => {
    if (
      vatData?.vatType?.vat_type === 'fixed' &&
      vatData?.vatType?.vat_percentage !== undefined &&
      vatData?.vatType?.vat_percentage !== null &&
      !row.vat_terms
    ) {
      // For fixed VAT, store "Fixed" as vat_terms
      updateField(row.id, 'vat_terms', 'Fixed');
      updateField(row.id, 'vat_percentage', vatData.vatType.vat_percentage);
      updateField(row.id, 'vat_type', vatData?.vatType?.vat_type || ''); // Store VAT type
      // Set VAT terms ID for fixed VAT type
      if (vatData?.vatType?.vats && vatData.vatType.vats.length > 0) {
        updateField(row.id, 'vat_terms_id', vatData.vatType.vats[0].id);
      }

      // Recalculate VAT amount and total for fixed VAT
      const amount = parseFloat(row.amount || 0);
      let vatAmount = 0;

      // Check if VAT amount should be 0 based on VAT terms
      if (shouldVatAmountBeZero('Fixed')) {
        vatAmount = 0;
      } else if (amount && vatData.vatType.vat_percentage) {
        vatAmount = (amount * vatData.vatType.vat_percentage) / 100;
      }

      updateField(row.id, 'vat_amount', vatAmount);

      const netTotal = amount + vatAmount;
      updateField(row.id, 'total', netTotal);
    }
  }, [
    vatData?.vatType?.vat_type,
    vatData?.vatType?.vat_percentage,
    row.vat_terms,
    row.amount,
  ]);

  return (
    <tr>
      <td>{serialNum(index + 1)}</td>
      <td>
        <div style={{ position: 'relative', marginBottom: 15 }}>
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
          {(fieldErrors.ledger && forceShowErrors) && (
            <div className="input-error-message text-danger" style={{ fontSize: '0.75rem', position: 'absolute', bottom: -18, left: 0 }}>
              Ledger is required
            </div>
          )}
        </div>
      </td>
      <td>
        <div style={{ position: 'relative', marginBottom: 15 }}>
          <SearchableSelect
            isDisabled={isDisabled}
            options={getAccountsByTypeOptions(row.ledger)}
            placeholder="Account"
            value={row.debit_account_id}
            onChange={(selected) => {
              if (selected.label?.toLowerCase()?.startsWith('add new')) {
                setShowAddLedgerModal(selected.label?.toLowerCase());
              } else {
                updateField(row.id, 'debit_account_id', selected.value);
              }
            }}
            borderRadius={10}
            minWidth={250}
            style={{ maxWidth: 250 }}
            tooltipText={getSelectedAccountLabel()}
          />
          {(fieldErrors.account && forceShowErrors) && (
            <div className="input-error-message text-danger" style={{ fontSize: '0.75rem', position: 'absolute', bottom: -18, left: 0 }}>
              Account is required
            </div>
          )}
        </div>
      </td>
      <td>
        <CustomInput
          type={'text'}
          value={row.narration}
          disabled={isDisabled}
          placeholder="Enter Narration"
          onChange={(e) => updateField(row.id, 'narration', e.target.value)}
          borderRadius={10}
          style={{ minWidth: 250, maxWidth: 250, width: 250, marginBottom: 15 }}
          title={row.narration}
        />
      </td>
      <td>
        <div style={{ position: 'relative', marginBottom: 15 }}>
          <CustomInput
            type={'text'}
            disabled={isDisabled}
            value={row.amount}
            onBlur={() => setTouchedAmount(true)}
            placeholder="Amount"
            onChange={(e) => {
              const amount = parseFloat(e.target.value || 0);
              updateField(row.id, 'amount', amount);

              // Calculate VAT amount using same logic as Payment Voucher
              const vatPercentage =
                vatData.vatType?.vat_percentage ||
                (!isNaN(row.vat_percentage) ? row.vat_percentage : 0);

              let vatAmount = 0;

              // Check if VAT amount should be 0 based on VAT terms
              if (shouldVatAmountBeZero(row.vat_terms)) {
                vatAmount = 0;
              } else if (amount && vatPercentage) {
                vatAmount = (amount * vatPercentage) / 100;
              }

              updateField(row.id, 'vat_amount', vatAmount);

              // Calculate net total
              const netTotal = amount + vatAmount;
              updateField(row.id, 'total', netTotal);
            }}
            borderRadius={10}
            style={{ minWidth: 135, maxWidth: 135, width: 135 }}
            title={row.amount}
          />
          {fieldErrors.amount && (touchedAmount || forceShowErrors) ? (
            <div className="input-error-message text-danger" style={{ fontSize: '0.75rem', position: 'absolute', bottom: -18, left: 0 }}>
              Amount is required
            </div>
          ) : null}
        </div>
      </td>

      <td>
        <div style={{ marginBottom: 15 }}>
          {vatData?.vatType?.vat_type === 'variable' ||
            (isVatTypeMismatch && voucherVatType === 'variable') ? (
            <SearchableSelect
              name="vat_terms"
              borderRadius={10}
              options={
                isVatTypeMismatch
                  ? (() => {
                    const currentOptions = getVATTermsOptions();
                    const selectedOption = currentOptions.find(
                      (opt) => opt.value === row.vat_terms_id
                    );

                    // If the selected option exists in current options, return current options
                    if (selectedOption) {
                      return currentOptions;
                    }

                    // If selected option doesn't exist, add it to the options
                    return [
                      ...currentOptions,
                      {
                        label: `${row.vat_terms}${row.vat_percentage && row.vat_percentage !== 'Nill'
                          ? ' - ' + row.vat_percentage + '%'
                          : ''
                          }`,
                        value: row.vat_terms_id,
                        id: row.vat_terms_id,
                        title: row.vat_terms,
                        percentage: row.vat_percentage,
                      },
                    ];
                  })()
                  : vatOptions
              }
              isDisabled={isDisabled || isVatTypeMismatch}
              placeholder="Select VAT %"
              value={row.vat_terms_id}
              onChange={(selected) => {
                if (
                  selected.percentage
                    ?.toString()
                    .startsWith('A small popup will appear')
                ) {
                  // Set current row for VAT out of scope
                  if (setCurrentRowForVat) {
                    setCurrentRowForVat(row.id);
                  }
                  if (setShowVatOutOfScopeModal) {
                    setShowVatOutOfScopeModal(true);
                  }
                } else {
                  // For variable VAT, store the selected option as vat_terms
                  const vatTerms = selected?.title ?? '';
                  const vatPercentage = selected?.percentage ?? '';
                  updateField(row.id, 'vat_terms', vatTerms);
                  updateField(row.id, 'vat_terms_id', selected.id); // Store VAT terms ID
                  updateField(
                    row.id,
                    'vat_type',
                    vatData?.vatType?.vat_type || ''
                  ); // Store VAT type

                  // Set VAT percentage to 0 for exempted/zero rate/out of scope conditions
                  if (shouldVatAmountBeZero(vatTerms)) {
                    updateField(row.id, 'vat_percentage', 0);
                  } else {
                    updateField(row.id, 'vat_percentage', vatPercentage);
                  }

                  // Recalculate VAT amount and total
                  const amount = parseFloat(row.amount || 0);
                  let vatAmount = 0;

                  // Check if VAT amount should be 0 based on VAT terms
                  if (shouldVatAmountBeZero(vatTerms)) {
                    vatAmount = 0;
                  } else if (amount && vatPercentage) {
                    vatAmount = (amount * vatPercentage) / 100;
                  }

                  updateField(row.id, 'vat_amount', vatAmount);

                  const netTotal = amount + vatAmount;
                  updateField(row.id, 'total', netTotal);
                }
              }}
              minWidth={180}
              style={{ maxWidth: 180 }}
              tooltipText={getSelectedVATTermsLabel()}
            />
          ) : (
            <CustomInput
              type="text"
              value={
                row.vat_terms === 'Fixed'
                  ? `${row.vat_terms} - ${row.vat_percentage}%`
                  : row.vat_terms
              }
              disabled={true}
              placeholder="VAT Terms"
              borderRadius={10}
              style={{ minWidth: 180, maxWidth: 180, width: 180 }}
              title={
                row.vat_terms === 'Fixed'
                  ? `${row.vat_terms} - ${row.vat_percentage}%`
                  : row.vat_terms
              }
            />
          )}
        </div>
      </td>

      <td>
        <CustomInput
          name={'vat_amount'}
          type={'text'}
          disabled={true}
          placeholder={'Enter VAT Amount'}
          value={row.vat_amount}
          borderRadius={10}
          style={{ minWidth: 135, maxWidth: 135, width: 135, marginBottom: 15 }}
          title={row.vat_amount}
        />
      </td>

      <td>
        <CustomInput
          type={'text'}
          value={row.total}
          disabled={true}
          placeholder="Net Total"
          onChange={(e) => updateField(row.id, 'total', e.target.value)}
          borderRadius={10}
          style={{ minWidth: 135, maxWidth: 135, width: 135, marginBottom: 15 }}
          title={row.total}
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
            },
          ]}
        />
      </td>
    </tr>
  );
};

export default InternalPaymentVoucherRow;
