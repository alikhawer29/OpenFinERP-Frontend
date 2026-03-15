import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import { useCallback, useEffect, useRef, useState } from 'react';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CustomButton from '../../../Components/CustomButton';
import CustomCheckbox from '../../../Components/CustomCheckbox/CustomCheckbox';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import FileDisplayList from '../../../Components/FileDisplayList/FileDisplayList.jsx';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import {
  inwardPaymentOrderNewHeaders,
  SUMMARY_TABLE_HEADERS,
  walkInHeaders,
} from '../../../Utils/Constants/TableHeaders';
import InwardPaymentOrderRow from './InwardPaymentOrderRow';

import { useNavigate } from 'react-router-dom';
import AccountBalanceCard from '../../../Components/AccountBalanceCard/AccountBalanceCard.jsx';
import CombinedInputs from '../../../Components/CombinedInputs/CombinedInputs';
import withModal from '../../../HOC/withModal.jsx';
import useAccountsByType from '../../../Hooks/useAccountsByType';
import useCurrencyRate from '../../../Hooks/useCurrencyRate';
import { getAccountBalances, pairReleased } from '../../../Services/General.js';
import {
  createInwardPaymentOrder,
  getIPOCurrencies,
  getIPOOfficeLocations,
  getIPOVATType,
} from '../../../Services/Transaction/InwardPaymentOrder';
import useFormStore from '../../../Stores/FormStore';
import useSettingsStore from '../../../Stores/SettingsStore';
import { ledgerOptions } from '../../../Utils/Constants/SelectOptions.js';
import { formatNumberForDisplay, showErrorToast } from '../../../Utils/Utils';
import SpecialCommission from '../SpecialCommission/SpecialCommission';
const generateInitialRows = (count, defaultDate = '') => {
  const rows = {};
  Array.from({ length: count }).forEach(() => {
    const id = crypto.randomUUID();
    rows[id] = {
      id,
      refNo: '',
      payType: '',
      beneficiary: '',
      walkInCustomer: '', // Add missing field
      walkInCustomerId: '', // Add missing field
      sender: '',
      idNumber: '',
      contactNo: '',
      currency: '',
      fcAmount: '',
      commission: '',
      payDate: '', // User will manually select Pay Date
      bankName: '',
      bankAc: '',
      narration: '',
    };
  });
  return rows;
};

const NewInwardPaymentOrder = ({
  date,
  setDate,
  isDisabled = false,
  setIsDisabled,
  setPageState,
  setSearchTerm,
  setWriteTerm,
  onFormDataChange,
  currencyToSelect,
  setCurrencyToSelect,
  getAccountsByTypeOptions,
  newlyCreatedAccount,
  setShowAddLedgerModal,
  lastVoucherNumbers,
  permissions,
  hasPrintPermission,
  state,
  showModal,
}) => {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState(() => generateInitialRows(3, date));
  const [showOutOfScopeModal, setShowOutOfScopeModal] = useState(false);
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [hasShownMissingRateModal, setHasShownMissingRateModal] =
    useState(false);
  const [showMissingCurrencyRateModal, setShowMissingCurrencyRateModal] =
    useState(false);
  const [restoreValuesFromStore, setRestoreValuesFromStore] = useState(false);
  const [currentVatPercentage, setCurrentVatPercentage] = useState(0); // Track current VAT percentage
  // TMN-style attachment state management
  const [uploadAttachmentsModal, setUploadAttachmentsModal] = useState(false);
  const [addedAttachments, setAddedAttachments] = useState([]);
  // Save Walk-in accounts data to store when available
  const [walkInCustomersData, setWalkInCustomers] = useState([]);
  // Walk-in modal state management
  const [walkinModal, setWalkinModal] = useState(false);
  const [walkinModalRowId, setWalkinModalRowId] = useState(null);
  const [filters, setFilters] = useState({}); // for modal table (if needed)
  const [walkinSearchTerm, setWalkinSearchTerm] = useState(''); // <-- Add search term state

  const [isLoading, setIsLoading] = useState(false); // for modal table
  const [isError, setIsError] = useState(false); // for modal table

  // State for added special commission values
  const [addedSpecialCommissionValues, setAddedSpecialCommissionValues] =
    useState(null);
  const [showSCModal, setShowSCModal] = useState(false);
  // Row field errors for Special Commission validation highlight
  const [rowFieldErrors, setRowFieldErrors] = useState({});
  // Track which rows have been interacted with (any field changed) to force-show errors
  const [rowsTouched, setRowsTouched] = useState({});

  // Required fields for a row
  const REQUIRED_ROW_FIELDS = [
    'payType',
    'walkInCustomerId',
    'currency',
    'fcAmount',
    'payDate',
  ];


  const formikRef = useRef();
  const navigate = useNavigate();
  // Get settings store functions
  const {
    getPrintSettings,
    getAccountBalanceSettings,
    updateAccountBalanceSetting,
    updatePrintSetting,
  } = useSettingsStore();

  // Use accounts by type hook
  const { walkinAccounts } = useAccountsByType();

  // Fetch office locations
  const { data: officeLocations, isLoading: isLoadingOffices } = useQuery({
    queryKey: ['ipoOfficeLocations'],
    queryFn: getIPOOfficeLocations,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  // Fetch VAT types
  const { data: vatType, isLoading: isLoadingVatType } = useQuery({
    queryKey: ['vatType'],
    queryFn: getIPOVATType,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Set VAT terms type and percentage in Formik after vatType loads
  useEffect(() => {
    if (vatType && formikRef.current) {
      formikRef.current.setFieldValue('vat_terms_type', vatType.vat_type || '');
      formikRef.current.setFieldValue(
        'vat_terms_percentage',
        vatType.vat_type === 'fixed'
          ? parseFloat(vatType.vat_percentage) || 0
          : 0
      );
    }
  }, [vatType]);

  const vatData = {
    vatType,
    isLoadingVatType,
    isErrorVatType: false, // This will be updated based on vatType.isError
    errorVatType: null, // This will be updated based on vatType.error
  };
  const getVATTermsOptions = () => {
    if (isLoadingVatType)
      return [
        {
          label: 'Loading...',
          value: '',
        },
      ];
    return (
      vatType?.vats?.map((item) => ({
        id: item.id,
        label: `${item.title}${!isNaN(parseFloat(item.percentage))
          ? ' - ' + item.percentage + '%'
          : ''
          }`,
        value: item.id,
        percentage: item.percentage,
      })) || []
    );
  };

  // Fetch currencies
  const { data: currencyOptions, isLoading: isLoadingCurrencies } = useQuery({
    queryKey: ['ipoCurrencies'],
    queryFn: getIPOCurrencies,
    staleTime: 1000 * 60 * 5,
    retry: 1,
    select: (data) => {
      return Array.isArray(data)
        ? data.map((currency) => ({
          label: currency.currency_code || currency.title,
          value: currency.id,
        }))
        : [];
    },
  });

  // Account balances for Ledger and Mode accounts
  const { data: ledgerAccountBalance } = useQuery({
    queryKey: ['accountBalance', selectedLedgerAccount?.value],
    queryFn: () =>
      getAccountBalances(
        selectedLedgerAccount.value,
        selectedLedgerAccount.accountType
      ),
    enabled: !!selectedLedgerAccount?.value,
    staleTime: 0,
    retry: 1,
  });

  // Fetch currency rate for the selected Currency (following Receipt Voucher pattern)
  const { data: currencyRate, isLoading: isLoadingCurrencyRate } =
    useCurrencyRate(selectedCurrency, date);

  // Create Inward Payment Order mutation
  const createInwardPaymentOrderMutation = useMutation({
    mutationFn: createInwardPaymentOrder,
    onSuccess: (data) => {
      showToast('Inward Payment Order Created!', 'success');
      // Print if enabled and PDF URL is available
      if (hasPrintPermission && getPrintSettings('inward_payment_order') && data?.detail?.pdf_url) {
        window.open(data.detail.pdf_url, '_blank');
      }
      queryClient.invalidateQueries(['inwardPaymentOrderListing']);
      handleCancel();
    },
    onError: (error) => {
      if (error.message == 'Voucher limit reached for this branch.') {
        showModal(
          'Cannot Create',
          'You have reached the maximum number of DBN. To create new transactions you need to increase the transaction count form the Transaction Number Register.',
          null,
          'error'
        );
      } else {
        showErrorToast(error);
      }
    },
  });

  useEffect(() => {
    if (walkinAccounts && walkinAccounts.length > 0) {
      setWalkInCustomers(walkinAccounts);
    }
  }, [walkinAccounts, setWalkInCustomers]);

  // Handle newly created account from modal
  useEffect(() => {
    if (newlyCreatedAccount && formikRef.current) {
      formikRef.current.setFieldValue('account_id', newlyCreatedAccount.id);
      setSelectedLedgerAccount(newlyCreatedAccount.id);
    }
  }, [newlyCreatedAccount]);

  // Handle missing currency rate (following Receipt Voucher pattern)
  useEffect(() => {
    if (
      selectedCurrency &&
      currencyRate &&
      !currencyRate?.rate &&
      !hasShownMissingRateModal
    ) {
      // Clear currency field in all rows (following Receipt Voucher pattern)
      setRows((prevRows) => {
        const updatedRows = { ...prevRows };
        Object.keys(updatedRows).forEach((rowId) => {
          if (updatedRows[rowId].currency === selectedCurrency) {
            updatedRows[rowId] = {
              ...updatedRows[rowId],
              currency: '',
            };
          }
        });
        return updatedRows;
      });

      setCurrencyToSelect(selectedCurrency);
      setShowMissingCurrencyRateModal(true);
      setHasShownMissingRateModal(true);
    }
  }, [selectedCurrency, currencyRate?.rate, hasShownMissingRateModal]);

  // Validation function to check if all required fields are filled
  const isFormValid = () => {
    const rowValues = Object.values(rows);

    const isRowFullyFilled = (r) =>
      REQUIRED_ROW_FIELDS.every((k) => r && r[k] !== undefined && r[k] !== '' && r[k] !== null);

    const isRowPartiallyFilled = (r) => {
      // Only consider a row "partial" if the user interacted with it (rowsTouched)
      // This prevents default values (like default currency) from making untouched rows appear partial.
      if (!r || !r.id) return false;
      if (!rowsTouched[r.id]) return false;
      // partially filled: at least one required field has a value, but not all
      const any = REQUIRED_ROW_FIELDS.some((k) => r && r[k] !== undefined && r[k] !== '' && r[k] !== null);
      const all = isRowFullyFilled(r);
      return any && !all;
    };

    // If any row is partially filled, treat the form as invalid (prevent save)
    const hasPartial = rowValues.some((r) => isRowPartiallyFilled(r));
    if (hasPartial) return false;

    // Otherwise require at least one fully filled row
    return rowValues.some((r) => isRowFullyFilled(r));
  };

  // Removed: Auto-sync date changes to Pay Date fields
  // Users can now manually select Pay Date for each row

  useEffect(() => {
    if (formikRef.current && date) {
      formikRef.current.setFieldValue('date', date);
    }
  }, [date]);

  const handleAddRows = useCallback(() => {
    const newRows = {};
    const id = crypto.randomUUID();
    newRows[id] = {
      id,
      refNo: '',
      payType: '',
      beneficiary: '',
      walkInCustomer: '', // Add missing field
      walkInCustomerId: '', // Add missing field
      sender: '',
      idNumber: '',
      contactNo: '',
      currency: '',
      fcAmount: '',
      commission: '',
      payDate: '', // User will manually select Pay Date
      bankName: '',
      bankAc: '',
      narration: '',
    };
    setRows((prevRows) => {
      const updatedRows = { ...prevRows, ...newRows };

      // If this is the first row (no existing rows), mark it as touched
      if (Object.keys(prevRows).length === 0) {
        setRowsTouched({ [id]: true });
      }

      return updatedRows;
    });

    // Clear any existing errors for the new row since it's empty
    setRowFieldErrors((prev) => ({
      ...prev,
      [id]: {},
    }));

    // Recalculate special commission when new rows are added
    if (addedSpecialCommissionValues) {
      const updatedRows = { ...rows, ...newRows };

      // Recalculate special commission based on all amounts
      const validRows = Object.values(updatedRows).filter((row) => {
        return row.currency && row.fcAmount && !isNaN(parseFloat(row.fcAmount));
      });

      // Group by currency and sum amounts
      const currencyGroups = validRows.reduce((acc, row) => {
        const currency = row.currency;
        const fcAmount = parseFloat(row.fcAmount) || 0;

        if (!acc[currency]) {
          acc[currency] = 0;
        }
        acc[currency] += fcAmount;
        return acc;
      }, {});

      const scCurrencyId = addedSpecialCommissionValues.currency_id;
      const baseAmount = currencyGroups[scCurrencyId] || 0;

      let newCommissionAmount = 0;
      // Check commission type case-insensitively
      const commissionType = (addedSpecialCommissionValues.commission_type || '').toLowerCase();
      if (commissionType === 'percentage') {
        const percentage = parseFloat(addedSpecialCommissionValues.commission) || 0;
        newCommissionAmount = (baseAmount * percentage) / 100;
      } else {
        // For fixed commission, keep the existing commission amount
        newCommissionAmount = parseFloat(addedSpecialCommissionValues.total_commission) || 0;
      }

      // Update the special commission values with new calculated amount
      setAddedSpecialCommissionValues(prev => ({
        ...prev,
        amount: baseAmount,
        total_commission: newCommissionAmount,
      }));
    }
  }, [date, addedSpecialCommissionValues, rows]);

  const handleSubmit = async () => {
    if (!formikRef.current) return;

    // Validate the form using Formik first
    const errors = await formikRef.current.validateForm();

    // Trigger row validation to show errors for only the first invalid row
    const nextErrors = {};
    let firstInvalidRowId = null;

    // Find the first row with validation errors
    for (const r of Object.values(rows)) {
      const currencyError = !r.currency || r.currency === '' || r.currency === null || r.currency === undefined;
      const amountError = !r.fcAmount || isNaN(parseFloat(r.fcAmount));
      const payTypeError = !r.payType || r.payType === '' || r.payType === null || r.payType === undefined;
      const beneficiaryError = !r.walkInCustomerId || r.walkInCustomerId === '' || r.walkInCustomerId === null || r.walkInCustomerId === undefined;
      const payDateError = !r.payDate || r.payDate === '' || r.payDate === null || r.payDate === undefined;

      if (currencyError || amountError || payTypeError || beneficiaryError || payDateError) {
        nextErrors[r.id] = {
          currency: currencyError,
          fcAmount: amountError,
          payType: payTypeError,
          walkInCustomerId: beneficiaryError,
          payDate: payDateError,
        };
        firstInvalidRowId = r.id;
        break; // Stop after finding the first invalid row
      }
    }
    setRowFieldErrors(nextErrors);

    // Don't automatically mark rows as touched - let user interaction control error display
    // setRowsTouched((prev) => {
    //   const newState = {};
    //   Object.keys(rows).forEach(rowId => {
    const rowsWithDataErrors = Object.keys(nextErrors).filter(rowId => {
      const row = rows[rowId];
      // Only block submission if the row has data AND has validation errors AND user is actively working on it
      return row &&
        Object.values(row).some(value => value !== undefined && value !== '' && value !== null) &&
        rowsTouched[rowId];
    });

    // If there are validation errors in rows with data that user is working on, show them and stop
    if (Object.keys(errors).length > 0 || rowsWithDataErrors.length > 0) {
      // Show errors for rows with data by marking them as touched
      const touchedRowsToSet = {};
      rowsWithDataErrors.forEach(rowId => {
        touchedRowsToSet[rowId] = true;
      });
      setRowsTouched(touchedRowsToSet);

      // Set Formik fields as touched to show validation errors
      formikRef.current.setTouched(
        Object.keys(errors).reduce((acc, key) => ({ ...acc, [key]: true }), {})
      );
      return;
    }

    // All validation passed - proceed with API call
    const values = formikRef.current.values;

    // Use only rows that have all mandatory fields filled
    const filledRows = Object.values(rows).filter((row) => {
      if (!row) return false;

      // Check if all required fields are filled and not empty
      return REQUIRED_ROW_FIELDS.every(
        (field) => row[field] !== undefined && row[field] !== '' && row[field] !== null
      );
    });

    // Determine commission presence and VAT application
    const rowCommissionTotal = Object.values(rows).reduce(
      (sum, r) => sum + (parseFloat(r.commission) || 0),
      0
    );
    const hasNormalCommission = rowCommissionTotal > 0;
    const hasSpecialCommission = !!(
      addedSpecialCommissionValues &&
      parseFloat(addedSpecialCommissionValues.total_commission) > 0
    );
    const hasAnyCommission = hasNormalCommission || hasSpecialCommission;

    // Validate Special Commission if present
    if (addedSpecialCommissionValues) {
      if (
        !addedSpecialCommissionValues.total_commission ||
        parseFloat(addedSpecialCommissionValues.total_commission) <= 0
      ) {
        // Set validation error instead of showing toast
        formikRef.current.setFieldError('special_commission', 'Special Commission amount must be greater than 0');
        formikRef.current.setTouched({ special_commission: true });
        return;
      }
      if (!addedSpecialCommissionValues.commission_type) {
        // Set validation error instead of showing toast
        formikRef.current.setFieldError('special_commission_type', 'Special Commission type is required');
        formikRef.current.setTouched({ special_commission_type: true });
        return;
      }
      if (!addedSpecialCommissionValues.currency_id) {
        // Set validation error instead of showing toast
        formikRef.current.setFieldError('special_commission_currency', 'Special Commission currency is required');
        formikRef.current.setTouched({ special_commission_currency: true });
        return;
      }

      // Validate that Special Commission currency matches a row currency
      const validRowCurrencies = filledRows
        .map((row) => row.currency)
        .filter(Boolean);
      if (
        !validRowCurrencies.includes(addedSpecialCommissionValues.currency_id)
      ) {
        // Set validation error instead of showing toast
        formikRef.current.setFieldError('special_commission_currency_match', 'Special Commission currency must match a currency from IPO rows');
        formikRef.current.setTouched({ special_commission_currency_match: true });
        return;
      }
    }

    // Resolve VAT terms with safe fallbacks
    const finalVatTermsType = values.vat_terms_type || vatType?.vat_type || '';
    const finalVatTermsPercentage =
      finalVatTermsType === 'fixed'
        ? Number(values.vat_terms_percentage) ||
        Number(vatType?.vat_percentage) ||
        0
        : parseFloat(values.vat_terms) || 0;

    // If Formik is missing VAT fields, sync them once for consistency
    if (formikRef.current) {
      if (!values.vat_terms_type && vatType?.vat_type) {
        formikRef.current.setFieldValue('vat_terms_type', vatType.vat_type);
      }
      if (
        finalVatTermsType === 'fixed' &&
        !values.vat_terms_percentage &&
        vatType?.vat_percentage != null
      ) {
        formikRef.current.setFieldValue(
          'vat_terms_percentage',
          Number(vatType.vat_percentage) || 0
        );
      }
    }

    let payload = {
      date: values.date,
      debit_account_ledger: values.account_ledger,
      debit_account_id: values.account_id,
      office_id: values.office,
      vat_type: values.vatType,
      ...addedAttachments,
      ...(outOfScope && { out_of_scope_reason: outOfScope }),
    };

    // Include VAT percentage/terms only if any commission exists
    if (hasAnyCommission) {
      payload = {
        ...payload,
        ...(values.vat_terms_id && { vat_terms_id: values.vat_terms_id }),
        vat_terms_percentage: finalVatTermsPercentage,
        vat_terms_type: finalVatTermsType,
        vat_amount: values.vat_amount || 0,
      };
    }

    // Transform details array to flattened format following
    const transformDetails = (row, index) => {
      return Object.entries({
        ref_no: row.refNo,
        pay_type: row.payType,
        walkin_id: row.walkInCustomerId,
        sender: row.sender,
        id_number: row.idNumber,
        contact_no: row.contactNo,
        currency_id: row.currency,
        fc_amount: row.fcAmount,
        commission: row.commission,
        pay_date: row.payDate,
        bank_name: row.bankName,
        bank_account: row.bankAc,
        narration: row.narration,
      }).reduce((acc, [key, value]) => {
        acc[`details[${index}][${key}]`] = value;
        return acc;
      }, {});
    };

    // Create details array for the payload
    const detailsArray = filledRows.map((row, index) => {
      return {
        ref_no: row.refNo,
        pay_type: row.payType,
        walkin_id: row.walkInCustomerId,
        sender: row.sender,
        id_number: row.idNumber,
        contact_no: row.contactNo,
        currency_id: row.currency,
        fc_amount: row.fcAmount,
        commission: row.commission,
        pay_date: row.payDate,
        bank_name: row.bankName,
        bank_account: row.bankAc,
        narration: row.narration,
      };
    });

    // Add flattened details to payload (only filled rows)
    filledRows.forEach((row, index) => {
      const flattenedRow = transformDetails(row, index);
      payload = { ...payload, ...flattenedRow };
    });

    // Also add details array to payload
    payload.details = detailsArray;

    // Add summary data to payload in the required format
    const summaryData = calculateSummaryData(values);
    summaryData.forEach((summaryRow, index) => {
      // Parse the formatted values back to numbers for database
      const total = parseFloat(summaryRow.total.replace(/,/g, '')) || 0;
      const commission = parseFloat(summaryRow.commission.replace(/,/g, '')) || 0;
      const vatAmount = parseFloat(summaryRow.vatAmount.replace(/,/g, '')) || 0;
      const netTotal = parseFloat(summaryRow.netTotal.replace(/,/g, '')) || 0;

      // Add required fields
      payload[`summary[${index}][currency_id]`] = summaryRow.currencyId;
      payload[`summary[${index}][total]`] = total;

      // Include commission if any commission is applied (normal or special)
      if (hasAnyCommission) {
        payload[`summary[${index}][commission]`] = commission;
      }

      payload[`summary[${index}][vat_amount]`] = vatAmount;
      payload[`summary[${index}][net_total]`] = netTotal;
    });

    // Add commission_amount or special_commission based on commission type
    if (hasSpecialCommission && addedSpecialCommissionValues) {
      // Special commission is applied - send special_commission[total_commission]
      const converted = {};
      const sc = {
        transaction_no: getVoucherNo(),
        date: values.date,
        commission_type: addedSpecialCommissionValues?.commission_type,
        ledger: values.account_ledger,
        account_id: values.account_id,
        currency_id:
          addedSpecialCommissionValues.currency_id || filledRows[0]?.currency,
        amount:
          addedSpecialCommissionValues.amount || filledRows[0]?.fcAmount || 0,
        ...addedSpecialCommissionValues,
      };

      for (const key in sc) {
        if (key === 'distributions' && Array.isArray(sc[key])) {
          sc[key].forEach((item, index) => {
            for (const subKey in item) {
              converted[
                `special_commission[distribution][${index}][${subKey}]`
              ] = item[subKey];
            }
          });
        } else {
          converted[`special_commission[${key}]`] = sc[key];
        }
      }

      // Ensure amount is included in the payload
      if (!converted['special_commission[amount]'] && sc.amount) {
        converted['special_commission[amount]'] = sc.amount;
      }

      payload = {
        ...payload,
        ...converted,
      };
    } else if (hasNormalCommission) {
      // Normal commission is applied - send commission_amount
      const totalNormalCommission = Object.values(rows).reduce(
        (sum, r) => sum + (parseFloat(r.commission) || 0),
        0
      );
      payload = {
        ...payload,
        commission_amount: totalNormalCommission,
      };
    }
    setDate(new Date().toLocaleDateString('en-CA'))
    handlePairReleased();
    createInwardPaymentOrderMutation.mutate(payload);
  };

  //mutation for pair released
  const pairReleasedMutation = useMutation({
    mutationFn: pairReleased,
    onSuccess: (data) => {
      console.log('Pair Released Successfully');
    },
    onError: (error) => {
      console.log(error);
    },
  });

  //pair id release
  const handlePairReleased = async () => {
    // Collect all unique pair_ids from current rows
    const pairIds = Object.values(rows)
      .map((row) => row?.currency)
      .filter((item) => item?.currency !== '');

    // Remove duplicates
    const uniquePairIds = [...new Set(pairIds)];

    // Release each pair_id
    uniquePairIds.forEach((pairId) => {
      pairReleasedMutation.mutate(pairId);
    });
  };

  const handleCancel = () => {
    handlePairReleased()
    // Reset all state variables
    setRows(generateInitialRows(3, date)); // Use date when resetting rows
    setIsDisabled(true);
    setAddedAttachments([]);
    setAddedSpecialCommissionValues(null);
    setSelectedLedgerAccount(null);
    setSelectedCurrency(null);
    setCurrentVatPercentage(0);
    setUploadAttachmentsModal(false);
    setWalkinModal(false);
    setWalkinModalRowId(null);
    setWalkinSearchTerm('');
    setIsLoading(false);
    setIsError(false);
    setDate(new Date().toLocaleDateString('en-CA'))

    // Reset form
    if (formikRef.current) {
      formikRef.current.resetForm();
    }
  };

  // Handle file removal
  const handleRemoveFile = (file) => {
    setAddedAttachments((prevFiles) => {
      const updatedFiles = { ...prevFiles };

      for (const key in updatedFiles) {
        if (
          updatedFiles[key]?.name === file.name &&
          updatedFiles[key]?.size === file.size
        ) {
          delete updatedFiles[key];
          break;
        }
      }

      return updatedFiles;
    });
  };

  // Helper function to get currency name from ID
  const getCurrencyName = useCallback(
    (currencyId) => {
      if (!currencyOptions || !Array.isArray(currencyOptions)) {
        return currencyId;
      }
      // Ensure both values are strings for consistent comparison
      const currencyIdStr = String(currencyId);
      const currency = currencyOptions.find(
        (option) => String(option.value) === currencyIdStr
      );
      const currencyName = currency ? currency.label : currencyIdStr;
      return currencyName;
    },
    [currencyOptions]
  );

  // Helper to get the correct voucher number for transaction_no
  const getVoucherNo = () =>
    lastVoucherNumbers?.voucher_no?.last || lastVoucherNumbers?.current || '';
  // Calculate summary data dynamically based on rows
  const calculateSummaryData = useCallback((formikValues = null) => {
    const validRows = Object.values(rows).filter((row) => {
      return row.currency && row.fcAmount && !isNaN(parseFloat(row.fcAmount));
    });

    // Group by currency and sum amounts (use string keys for consistent comparison)
    const currencyGroups = validRows.reduce((acc, row) => {
      const currency = String(row.currency || '');
      const currencyName = getCurrencyName(currency); // Get currency name instead of ID
      const fcAmount = parseFloat(row.fcAmount) || 0;
      const commission = parseFloat(row.commission) || 0;

      if (!acc[currency]) {
        acc[currency] = {
          currency: currencyName, // Store currency name for display
          currencyId: currency, // Store currency ID for reference
          total: 0,
          commission: 0,
          specialCommission: 0, // Add special commission tracking
          vatAmount: 0, // Will be calculated based on VAT configuration
          netTotal: 0,
        };
      }

      acc[currency].total += fcAmount;
      acc[currency].commission += commission;

      return acc;
    }, {});

    // Add Special Commission to the appropriate currency group
    if (
      addedSpecialCommissionValues &&
      addedSpecialCommissionValues.total_commission
    ) {
      // Ensure currency ID is converted to string for consistent comparison
      const scCurrencyId = String(addedSpecialCommissionValues.currency_id || '');
      const scCurrencyName = getCurrencyName(scCurrencyId);

      // Use the updated total_commission from addedSpecialCommissionValues
      // instead of recalculating it
      const scAmount = parseFloat(addedSpecialCommissionValues.total_commission) || 0;

      // Find matching currency group or create new one
      // Convert currency keys to string for comparison
      const matchingKey = Object.keys(currencyGroups).find(
        key => String(key) === scCurrencyId
      ) || scCurrencyId;

      if (currencyGroups[matchingKey]) {
        currencyGroups[matchingKey].specialCommission = scAmount; // Use = instead of += to avoid accumulation
      } else {
        currencyGroups[matchingKey] = {
          currency: scCurrencyName,
          currencyId: scCurrencyId,
          total: 0,
          commission: 0,
          specialCommission: scAmount,
          vatAmount: 0,
          netTotal: 0,
        };
      }
    }

    // Calculate VAT and net total for each currency group
    return Object.values(currencyGroups).map((group) => {
      // Get VAT percentage from form values, falling back to currentVatPercentage
      // Use passed formikValues if available, otherwise fall back to formikRef
      const values = formikValues || formikRef.current?.values || {};
      let vatPercentage = 0;
      if (values.vat_terms_type === 'fixed') {
        vatPercentage = Number(values.vat_terms_percentage) || currentVatPercentage || 0;
      } else {
        vatPercentage = parseFloat(values.vat_terms) || currentVatPercentage || 0;
      }

      // Calculate total commission (row commissions + special commission)
      const totalCommission = group.commission + group.specialCommission;

      // VAT Amount calculation: total commission * (vatPercentage / 100)
      group.vatAmount = totalCommission * (vatPercentage / 100);

      // Apply VAT calculation based on VAT Type from form values
      const vatType = values.vatType || 'absorb';
      if (vatType === 'absorb') {
        // If VAT Type is "Absorb": Net Total = Total + Total Commission
        group.netTotal = group.total + totalCommission;
      } else {
        // If VAT Type is "Charge": Net Total = Total + Total Commission + VAT Amount
        group.netTotal = group.total + totalCommission + group.vatAmount;
      }

      return {
        ...group,
        total: formatNumberForDisplay(group.total, 2),
        commission: formatNumberForDisplay(totalCommission, 2), // Show total commission (regular + special)
        specialCommission: formatNumberForDisplay(group.specialCommission, 2),
        totalCommission: formatNumberForDisplay(totalCommission, 2),
        vatAmount: formatNumberForDisplay(group.vatAmount, 2),
        netTotal: formatNumberForDisplay(group.netTotal, 2),
      };
    });
  }, [
    rows,
    addedSpecialCommissionValues,
    vatType,
    currentVatPercentage,
    getCurrencyName,
  ]);

  // Helper function to check if a row has Special Commission applied
  const getRowSpecialCommissionStatus = useCallback(
    (rowId) => {
      if (!addedSpecialCommissionValues) return false;

      // Check if the Special Commission is linked to this specific row
      const scCurrencyId = addedSpecialCommissionValues.currency_id;
      const row = Object.values(rows).find((r) => r.id === rowId);

      return row && row.currency === scCurrencyId;
    },
    [addedSpecialCommissionValues, rows]
  );

  // Recalculate special commission when FC amounts change (if special commission exists)
  useEffect(() => {
    if (!addedSpecialCommissionValues) return;



    // Calculate current FC amount for special commission currency
    const scCurrencyId = String(addedSpecialCommissionValues.currency_id || '');
    const validRows = Object.values(rows).filter((row) => {
      return row.currency && row.fcAmount && !isNaN(parseFloat(row.fcAmount));
    });

    const currentFcAmount = validRows
      .filter(row => String(row.currency || '') === scCurrencyId)
      .reduce((sum, row) => sum + (parseFloat(row.fcAmount) || 0), 0);


    // Recalculate special commission based on current FC amount
    const baseAmount = currentFcAmount;

    let newCommissionAmount = 0;
    // Check commission type case-insensitively
    const commissionType = (addedSpecialCommissionValues.commission_type || '').toLowerCase();
    if (commissionType === 'percentage') {
      const percentage = parseFloat(addedSpecialCommissionValues.commission) || 0;
      newCommissionAmount = (baseAmount * percentage) / 100;
    } else {
      // For fixed commission, keep the existing commission amount
      newCommissionAmount = parseFloat(addedSpecialCommissionValues.total_commission) || 0;
    }


    // Always update to ensure values are in sync with current rows
    // Force update even for small changes to ensure UI updates
    setAddedSpecialCommissionValues(prev => {
      const currentAmount = parseFloat(prev?.amount || 0);
      const currentCommission = parseFloat(prev?.total_commission || 0);


      // Always update to ensure UI reflects current state
      const updated = {
        ...prev,
        amount: baseAmount,
        total_commission: newCommissionAmount,
      };

      return updated;
    });
  }, [
    rows,
    addedSpecialCommissionValues?.currency_id,
    addedSpecialCommissionValues?.commission_type,
    addedSpecialCommissionValues?.commission,
    // Create a simple string dependency that changes when any row's currency or fcAmount changes
    Object.values(rows).map(r => `${r.id}:${r.currency || ''}:${r.fcAmount || ''}`).join('|'),
  ]);

  // Handler functions for rows
  const updateField = useCallback((id, field, value) => {
    setRows((prev) => {
      const newRows = {
        ...prev,
        [id]: {
          ...prev[id],
          [field]: value,
        },
      };

      return newRows;
    });

    // Check if row has any meaningful data after this update
    const updatedRow = { ...rows[id], [field]: value };

    // Only consider important fields for determining if row has data
    const importantFields = [
      'payType', 'walkInCustomerId', 'currency', 'fcAmount',
      'payDate', 'bankName', 'bankAc'
    ];

    const hasAnyData = importantFields.some(key => {
      const val = updatedRow[key];
      return val !== undefined && val !== '' && val !== null && val !== 'null';
    });

    if (hasAnyData) {
      // Row has data - mark as touched and validate IMMEDIATELY
      setRowsTouched((prev) => ({
        ...prev,
        [id]: true,
      }));

      // Validate this row and show errors
      const currencyError = !updatedRow.currency || updatedRow.currency === '';
      const amountError = !updatedRow.fcAmount || isNaN(parseFloat(updatedRow.fcAmount));
      const beneficiaryError = !updatedRow.walkInCustomerId || updatedRow.walkInCustomerId === '';
      const payDateError = !updatedRow.payDate || updatedRow.payDate === '';

      const errors = {
        currency: currencyError,
        fcAmount: amountError,
        walkInCustomerId: beneficiaryError,
        payDate: payDateError,
      };

      // Clear error for the field that was just filled
      if (errors[field]) {
        errors[field] = undefined;
      }

      // Set errors immediately to ensure they show up
      setRowFieldErrors((prev) => ({
        ...prev,
        [id]: errors,
      }));

      // Also ensure touched state is set by using a separate effect
      setTimeout(() => {
        setRowsTouched((prev) => ({
          ...prev,
          [id]: true,
        }));
      }, 0);
    } else {
      // Row is completely empty - remove touched state and clear errors
      setRowsTouched((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });

      setRowFieldErrors((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  }, [rows, REQUIRED_ROW_FIELDS]);

  const handleDeleteRow = useCallback((id) => {
    setRows((prevRows) => {
      const newState = { ...prevRows };
      delete newState[id];
      return newState;
    });
    // remove touched tracking for deleted row
    setRowsTouched((prev) => {
      const copy = { ...prev };
      if (copy[id]) delete copy[id];
      return copy;
    });

    // Recalculate special commission when a row is deleted
    if (addedSpecialCommissionValues) {
      const updatedRows = { ...rows };
      delete updatedRows[id];

      // Recalculate special commission based on remaining amounts
      const validRows = Object.values(updatedRows).filter((row) => {
        return row.currency && row.fcAmount && !isNaN(parseFloat(row.fcAmount));
      });

      // Group by currency and sum amounts
      const currencyGroups = validRows.reduce((acc, row) => {
        const currency = row.currency;
        const fcAmount = parseFloat(row.fcAmount) || 0;

        if (!acc[currency]) {
          acc[currency] = 0;
        }
        acc[currency] += fcAmount;
        return acc;
      }, {});

      const scCurrencyId = addedSpecialCommissionValues.currency_id;
      const baseAmount = currencyGroups[scCurrencyId] || 0;

      let newCommissionAmount = 0;
      // Check commission type case-insensitively
      const commissionType = (addedSpecialCommissionValues.commission_type || '').toLowerCase();
      if (commissionType === 'percentage') {
        const percentage = parseFloat(addedSpecialCommissionValues.commission) || 0;
        newCommissionAmount = (baseAmount * percentage) / 100;
      } else {
        // For fixed commission, keep the existing commission amount
        newCommissionAmount = parseFloat(addedSpecialCommissionValues.total_commission) || 0;
      }

      // Update the special commission values with new calculated amount
      setAddedSpecialCommissionValues(prev => ({
        ...prev,
        amount: baseAmount,
        total_commission: newCommissionAmount,
      }));
    }
  }, [rows, addedSpecialCommissionValues]);

  // Handler to open the Walk-in modal for a specific row
  const handleOpenWalkinModal = (rowId) => {
    setWalkinModalRowId(rowId);
    setWalkinModal(true);
    // Set search term to the current value of that row's walk-in customer input
    setWalkinSearchTerm(rows[rowId]?.walkInCustomer || '');
  };

  // Handler to select a walk-in customer from the modal
  const handleSelectWalkinCustomer = (customer) => {
    if (walkinModalRowId !== null && walkinModalRowId !== undefined) {
      // Use updateField to ensure error clearing and row touching logic is applied
      updateField(walkinModalRowId, 'walkInCustomer', customer.title);
      updateField(walkinModalRowId, 'walkInCustomerId', customer.id);
    }
    setWalkinModal(false);
    setWalkinModalRowId(null);
  };

  const handleCloseWalkinModal = () => {
    // Clean up all walk-in modal related state to prevent stale updates or loops
    setWalkinModal(false);
    setWalkinModalRowId(null);
    setFilters({});
    // setPagination(defaultPagination); // This line was not in the original file, so I'm removing it.
    setIsLoading(false);
    setIsError(false);
    setWalkinSearchTerm(''); // Reset search term when closing
  };

  // Add outOfScope state
  const [outOfScope, setOutOfScope] = useState('');

  const {
    saveFormValues,
    getFormValues,
    hasFormValues,
    clearFormValues,
    setLastVisitedPage,
    getLastVisitedPage,
    clearLastVisitedPage,
  } = useFormStore();
  const formId = 'new_inward_payment_order';
  const isRestoringRef = useRef(false);

  // Restore form state after returning from Special Commission or Rate of Exchange
  useEffect(() => {
    const lastPage = getLastVisitedPage(formId);
    if (
      lastPage === 'special-commission' &&
      hasFormValues(formId) &&
      formikRef.current
    ) {
      const savedValues = getFormValues(formId);
      isRestoringRef.current = true;
      formikRef.current.setValues(savedValues.values);
      setRows(savedValues.rows || generateInitialRows(3, date));
      setAddedAttachments(savedValues.addedAttachments || []);
      clearLastVisitedPage(formId);
      clearFormValues(formId);
      if (hasFormValues('special-commission')) {
        setAddedSpecialCommissionValues(getFormValues('special-commission'));
        clearFormValues('special-commission');
      } else {
        // Only set from main form values if no special-commission form values exist
        setAddedSpecialCommissionValues(
          savedValues.addedSpecialCommissionValues || null
        );
      }
      setIsDisabled(false);
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 500);
    } else if (lastPage === 'rate-of-exchange' && hasFormValues(formId)) {
      // Set page state to new and enable the form
      setIsDisabled(false);
      setRestoreValuesFromStore(true);
    }
  }, []);

  // Handle special commission data from navigation state ()
  useEffect(() => {
    if (state?.specialCommissionData) {
      setAddedSpecialCommissionValues(state.specialCommissionData);
    }
  }, [state]);

  // Restore form data from store for Rate of Exchange flow
  useEffect(() => {
    if (restoreValuesFromStore) {
      const savedFormData = getFormValues(formId);
      if (savedFormData && formikRef.current) {
        formikRef.current.setValues(savedFormData.values || {});
        setRows(savedFormData.rows || generateInitialRows(3, date));
        setAddedAttachments(savedFormData.addedAttachments || []);
        setAddedSpecialCommissionValues(
          savedFormData.addedSpecialCommissionValues || null
        );
        setIsDisabled(false);
        clearFormValues(formId);
        clearLastVisitedPage(formId);
        setRestoreValuesFromStore(false);
      }
    }
  }, [restoreValuesFromStore]);

  // Special Commission modal handler
  const handleOpenSpecialCommissionModal = () => {
    // Only require Ledger/Account to open Special Commission
    const requiredFields = ['account_ledger', 'account_id'];
    const missingFields = requiredFields.filter(
      (field) => !formikRef.current.values[field]
    );
    if (missingFields.length > 0) {
      const touchedFields = {};
      requiredFields.forEach((field) => {
        touchedFields[field] = true;
      });
      formikRef.current.setTouched({
        ...formikRef.current.touched,
        ...touchedFields,
      });
      // Show field errors on Ledger and Account
      missingFields.forEach((field) => {
        if (field === 'account_ledger') {
          formikRef.current.setFieldError(
            'account_ledger',
            'Ledger is required'
          );
        }
        if (field === 'account_id') {
          formikRef.current.setFieldError('account_id', 'Account is required');
        }
      });
      showToast(
        'Please select Ledger and Account before Special Commission',
        'error'
      );
      return;
    }
    // Get the first valid row for Special Commission
    const validRows = Object.values(rows).filter((row) => {
      return row.currency && row.fcAmount && !isNaN(parseFloat(row.fcAmount));
    });
    if (validRows.length === 0) {
      // Highlight missing Currency/FC Amount on all rows
      const nextErrors = {};
      Object.values(rows).forEach((r) => {
        const currencyError = !r.currency;
        const amountError = !r.fcAmount || isNaN(parseFloat(r.fcAmount));
        if (currencyError || amountError) {
          nextErrors[r.id] = {
            currency: currencyError,
            fcAmount: amountError,
          };
        }
      });
      setRowFieldErrors(nextErrors);
      showToast(
        'Please add at least one valid row with Currency and FC Amount',
        'error'
      );
      return;
    }
    // Clear any previous row field errors once validation passes
    if (Object.keys(rowFieldErrors).length) setRowFieldErrors({});
    setShowSCModal(true);
  };

  // Remove automatic validation - table validation should only show on Save click

  // Special Commission navigation handler (pattern from NewCurrencyTransfer)
  const handleNavigateToSpecialCommissionPage = () => {
    // Check if required fields are filled
    const requiredFields = [
      'account_ledger',
      'account_id',
      'office',
      'vatType',
    ];
    const missingFields = requiredFields.filter(
      (field) => !formikRef.current.values[field]
    );
    if (missingFields.length > 0) {
      const touchedFields = {};
      requiredFields.forEach((field) => {
        touchedFields[field] = true;
      });
      formikRef.current.setTouched({
        ...formikRef.current.touched,
        ...touchedFields,
      });
      showToast(
        'Please fill all required fields before adding Special Commission',
        'error'
      );
      return;
    }
    // Get the first valid row for Special Commission
    const validRows = Object.values(rows).filter((row) => {
      return row.currency && row.fcAmount && !isNaN(parseFloat(row.fcAmount));
    });
    if (validRows.length === 0) {
      showToast(
        'Please add at least one row with Currency and FC Amount',
        'error'
      );
      return;
    }
    const firstValidRow = validRows[0];
    // Prepare Special Commission values following
    const scValues = {
      date: date,
      current: lastVoucherNumbers?.current,
      transaction_no: getVoucherNo(),
      commission_type:
        addedSpecialCommissionValues?.commission_type || 'Income',
      ledger:
        ledgerOptions.find(
          (x) => x.value === formikRef.current.values.account_ledger
        )?.label || '',
      account:
        getAccountsByTypeOptions(formikRef.current.values.account_ledger).find(
          (x) => x.value === formikRef.current.values.account_id
        )?.label || '',
      currency:
        currencyOptions?.find((x) => x.value === firstValidRow.currency)
          ?.label || '',
      amount: firstValidRow.fcAmount,
      currency_id: firstValidRow.currency,
    };
    // Save form data before navigating
    if (formikRef.current && !isDisabled) {
      const dataToSave = {
        values: formikRef.current.values,
        rows,
        addedAttachments,
        addedSpecialCommissionValues,
      };
      saveFormValues(formId, dataToSave);
      setLastVisitedPage(formId, 'special-commission');
    }
    // If editing existing Special Commission, save the data for restoration
    const hasExistingCommission = !!addedSpecialCommissionValues;
    if (hasExistingCommission && addedSpecialCommissionValues) {
      saveFormValues('special-commission', {
        commission_type: addedSpecialCommissionValues.commission_type,
        commission: addedSpecialCommissionValues.commission,
        total_commission: addedSpecialCommissionValues.total_commission,
        description: addedSpecialCommissionValues.description,
        distributions: addedSpecialCommissionValues.distributions || [],
      });
    }

    navigate('/transactions/special-commission', {
      state: {
        fromPage: 'new_inward_payment_order',
        values: {
          ...scValues,
          current: getVoucherNo(),
          isEdit: hasExistingCommission,
          amount: firstValidRow.fcAmount,
          currency_id: firstValidRow.currency,
        },
      },
    });
  };

  // Update handleVatOutOfScope
  const handleVatOutOfScope = (values) => {
    setOutOfScope(values.reason || values.out_of_scope || '');
    setShowOutOfScopeModal(false);
    // Keep the selected "Out of Scope" VAT option selected; do not clear fields
  };

  return (
    <>
      <div className="d-card">
        <Formik
          innerRef={formikRef}
          initialValues={{
            account_ledger: '',
            account_id: '',
            office: '',
            vatType: '',
            vatTerm: '',
            currency: '',
            rate: '',
            vat_terms: 0, // VAT percentage following
            vat_amount: 0, // VAT amount following
            date: date || '', // Ensure date is in initial values
            vat_terms_id: '', // <-- Add this line for dropdown safety
            vat_terms_type: '', // NEW: managed by Formik
            vat_terms_percentage: 0, // NEW: managed by Formik
          }}
          validate={(values) => {
            const errors = {};

            // Ledger validation - must be selected first
            if (!values.account_ledger) {
              errors.account_ledger = 'Ledger is required';
            }

            // Account validation - only required if ledger is selected
            if (values.account_ledger && !values.account_id) {
              errors.account_id = 'Account is required';
            }

            // VAT Type validation - only required when commission is applied
            const hasAnyCommission = addedSpecialCommissionValues ||
              Object.values(rows).some(r => parseFloat(r.commission) > 0);

            if (hasAnyCommission && !values.vatType) {
              errors.vatType = 'VAT Type is required when commission is applied';
            }

            // VAT validation when commission is applied
            if (hasAnyCommission) {
              if (vatData?.vatType?.vat_type === 'variable') {
                if (!values.vat_terms_id) {
                  errors.vat_terms_id = 'VAT % is required';
                }
                // VAT Amount validation
                if (values.vat_amount === '' || values.vat_amount === null || values.vat_amount === undefined) {
                  errors.vat_amount = 'VAT Amount is required';
                }
              }
            }

            return errors;
          }}
          onSubmit={handleSubmit}
        >
          {({ values, handleChange, handleBlur, setFieldValue, errors }) => {
            // VAT Calculation useEffect following
            useEffect(() => {
              let commission = 0;
              if (values.vat_terms_type === 'variable') {
                // Use special commission if present, else sum of row commissions
                if (
                  addedSpecialCommissionValues &&
                  addedSpecialCommissionValues.total_commission
                ) {
                  commission =
                    parseFloat(addedSpecialCommissionValues.total_commission) ||
                    0;
                } else {
                  commission = Object.values(rows).reduce(
                    (sum, row) => sum + (parseFloat(row.commission) || 0),
                    0
                  );
                }
              } else if (values.vat_terms_type === 'fixed') {
                // Always use sum of all commissions (row + special commission)
                commission = Object.values(rows).reduce(
                  (sum, row) => sum + (parseFloat(row.commission) || 0),
                  0
                );
                if (
                  addedSpecialCommissionValues &&
                  addedSpecialCommissionValues.total_commission
                ) {
                  commission +=
                    parseFloat(addedSpecialCommissionValues.total_commission) ||
                    0;
                }
              }
              // Get VAT percentage
              let vatPercentage = 0;
              if (values.vat_terms_type === 'fixed') {
                vatPercentage = Number(values.vat_terms_percentage) || 10; // fallback to 10 for debug
              } else {
                vatPercentage = parseFloat(values.vat_terms) || 0;
              }
              // Only calculate VAT if not out of scope
              if (!outOfScope) {
                const vatAmount = commission * (vatPercentage / 100);
                setFieldValue('vat_amount', vatAmount);
                setCurrentVatPercentage(vatPercentage);
              } else {
                setFieldValue('vat_amount', 0);
                setCurrentVatPercentage(0);
              }
            }, [
              values.vat_terms,
              values.vat_terms_type,
              values.vat_terms_percentage,
              rows,
              setFieldValue,
              outOfScope,
              addedSpecialCommissionValues,
            ]);

            // Place this effect INSIDE the render function and use Formik's values
            useEffect(() => {
              if (onFormDataChange) {
                onFormDataChange({
                  values,
                  rows,
                  addedAttachments,
                });
              }
            }, [values, rows, addedAttachments, onFormDataChange]);

            // Remove automatic Account validation - only show on Save click

            return (
              <Form>
                <div className="row mb-4">
                  <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
                    <div className="row">
                      {/* Debit Account Section */}
                      <div className="col-12 col-sm-6">
                        <div className="row">
                          <div className="col-12 mb-45">
                            <CombinedInputs
                              label="Ledger"
                              type1="select"
                              type2="select"
                              name1="account_ledger"
                              name2="account_id"
                              value1={values.account_ledger}
                              value2={
                                values.account_id || newlyCreatedAccount?.id
                              }
                              options1={ledgerOptions}
                              options2={getAccountsByTypeOptions(
                                values.account_ledger
                              )}
                              isDisabled={isDisabled}
                              handleBlur={handleBlur}
                              placeholder1="Ledger"
                              placeholder2="Select Account"
                              className1="ledger"
                              className2="account"
                              onChange1={(selected) => {
                                if (
                                  selected.label
                                    ?.toLowerCase()
                                    ?.startsWith('add new')
                                ) {
                                  setShowAddLedgerModal(
                                    selected.label?.toLowerCase()
                                  );
                                } else {
                                  setFieldValue(
                                    'account_ledger',
                                    selected.value
                                  );
                                  setFieldValue('account_id', '');
                                  setFieldValue('beneficiary_id', '');
                                  setFieldValue('bank_name', '');
                                  setFieldValue('bank_account_no', '');
                                  setFieldValue('city', '');
                                  setFieldValue('purpose_id', '');
                                  // Reset selected ledger account to hide balance card when ledger changes
                                  setSelectedLedgerAccount(null);
                                }
                              }}
                              onChange2={(selected) => {
                                if (
                                  selected.label
                                    ?.toLowerCase()
                                    ?.startsWith('add new')
                                ) {
                                  setShowAddLedgerModal(
                                    selected.label?.toLowerCase()
                                  );
                                } else {
                                  setFieldValue('account_id', selected.value);
                                  setSelectedLedgerAccount({
                                    value: selected.value,
                                    label: selected.label,
                                    accountType: values.account_ledger,
                                  });
                                  setFieldValue('beneficiary_id', '');
                                  setFieldValue('bank_name', '');
                                  setFieldValue('bank_account_no', '');
                                  setFieldValue('city', '');
                                  setFieldValue('purpose_id', '');
                                }
                              }}
                            />
                            <ErrorMessage
                              name="account_ledger"
                              component="div"
                              className="input-error-message text-danger"
                            />
                            <ErrorMessage
                              name="account_id"
                              component="div"
                              className="input-error-message text-danger"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Credit Account Section replaced with Office and VAT Term */}
                      <div className="col-12 col-sm-6 mb-45">
                        <SearchableSelect
                          name={'office'}
                          label={'Office'}
                          options={
                            isLoadingOffices
                              ? [
                                {
                                  label: 'Loading...',
                                  value: null,
                                  isDisabled: true,
                                },
                              ]
                              : Array.isArray(officeLocations)
                                ? officeLocations.map((office) => ({
                                  label:
                                    office.office_location ||
                                    office.office_location,
                                  value: office.id,
                                }))
                                : []
                          }
                          isDisabled={isDisabled || isLoadingOffices}
                          placeholder={'Select Office'}
                          value={values.office}
                          onChange={(selected) => {
                            setFieldValue('office', selected.value);
                          }}
                          onBlur={handleBlur}
                        />
                        <ErrorMessage
                          name="office"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>

                      {/* VAT Type Dropdown */}
                      <div className="col-12 col-sm-6 mb-45">
                        <SearchableSelect
                          name={'vatType'}
                          label={'VAT Type'}
                          options={[
                            { label: 'Charge', value: 'charge' },
                            { label: 'Absorb', value: 'absorb' },
                          ]}
                          isDisabled={isDisabled || isLoadingVatType}
                          placeholder={'Select VAT Type'}
                          value={values.vatType}
                          onChange={(selected) => {
                            setFieldValue('vatType', selected.value);
                            setFieldValue('vatTerm', '');
                            setFieldValue('vat_terms_id', '');
                            setFieldValue('vat_terms', '');
                          }}
                          onBlur={handleBlur}
                        />
                      </div>

                      {/* VAT Terms */}
                      {vatData?.vatType?.vat_type === 'variable' && (
                        <div className="col-12 col-sm-6 mb-45">
                          <SearchableSelect
                            name={'vat_terms'}
                            label={'VAT %'}
                            options={getVATTermsOptions()}
                            isDisabled={isDisabled}
                            placeholder={'Select VAT %'}
                            value={values.vat_terms_id}
                            onChange={(selected) => {
                              if (selected.label.startsWith('Out of Scope')) {
                                setShowOutOfScopeModal(true);
                                // Keep selection as Out of Scope with 0%
                                setFieldValue('vat_terms_id', selected.value);
                                setFieldValue('vat_terms', 0);
                              } else {
                                setFieldValue('vat_terms_id', selected.value);
                                setFieldValue(
                                  'vat_terms',
                                  parseFloat(selected.percentage)
                                );
                              }
                            }}
                            onBlur={handleBlur}
                          />
                          <ErrorMessage
                            name="vat_terms_id"
                            component="div"
                            className="input-error-message text-danger"
                          />
                        </div>
                      )}
                      {vatData?.vatType?.vat_type === 'fixed' && (
                        <div className="col-12 col-sm-6 mb-3">
                          <CustomInput
                            name={'vat_percentage'}
                            label={'VAT %'}
                            type={'number'}
                            disabled={true}
                            placeholder={'Enter VAT Percentage'}
                            value={
                              vatData.vatType?.vat_percentage
                                ? vatData.vatType?.vat_percentage
                                : !isNaN(values.vat_terms)
                                  ? values.vat_terms
                                  : ''
                            }
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                          <ErrorMessage
                            name="vat_amount"
                            component="div"
                            className="input-error-message text-danger"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-12 col-xxl-2" />

                  <div className="col-12 col-lg-10 col-xl-9 col-xxl-3">
                    {selectedLedgerAccount &&
                      getAccountBalanceSettings('inward_payment_order') && (
                        <div className='row'>
                          <div className="col-12 mb-5" style={{ maxWidth: '350px' }}>
                            <AccountBalanceCard
                              heading="Account Balance"
                              accountName={selectedLedgerAccount.label}
                              balances={
                                ledgerAccountBalance?.balances ||
                                ledgerAccountBalance?.detail?.balances ||
                                (Array.isArray(ledgerAccountBalance)
                                  ? ledgerAccountBalance
                                  : [])
                              }
                              loading={ledgerAccountBalance === undefined}
                            />
                          </div>
                        </div>
                      )}
                  </div>

                  <div className="col-12">
                    <CustomTable
                      displayCard={false}
                      headers={inwardPaymentOrderNewHeaders}
                      isPaginated={false}
                      className={'inputTable'}
                      hideSearch
                      hideItemsPerPage
                    >
                      <tbody>
                        {Object.values(rows).map((row, index) => (
                          <InwardPaymentOrderRow
                            key={row.id}
                            row={row}
                            index={index}
                            isDisabled={isDisabled}
                            handleDeleteRow={handleDeleteRow}
                            updateField={updateField}
                            setCurrencyToSelect={setCurrencyToSelect}
                            setSelectedCurrency={setSelectedCurrency}
                            setHasShownMissingRateModal={
                              setHasShownMissingRateModal
                            }
                            currencyOptions={currencyOptions || []}
                            selectedLedgerAccount={selectedLedgerAccount}
                            formId="new_inward_payment_order"
                            onOpenWalkinModal={handleOpenWalkinModal} // pass handler
                            walkInCustomersData={walkInCustomersData} // pass walk-in customers for suggestions
                            hasSpecialCommission={
                              !!addedSpecialCommissionValues
                            }
                            fieldErrors={rowFieldErrors[row.id] || {}}
                            forceShowErrors={!!rowsTouched[row.id]}
                          />
                        ))}
                      </tbody>
                    </CustomTable>

                    {/* Add the summary table using CustomTable - only show if there are values */}
                    {!isDisabled && calculateSummaryData(values).length > 0 && (
                      <div className="mt-4" key={`summary-${addedSpecialCommissionValues?.total_commission || 0}-${addedSpecialCommissionValues?.amount || 0}-${Object.values(rows).reduce((sum, r) => sum + (parseFloat(r.fcAmount) || 0), 0)}`}>
                        <CustomTable
                          displayCard={false}
                          headers={SUMMARY_TABLE_HEADERS}
                          data={calculateSummaryData(values)}
                          isPaginated={false}
                          hideSearch
                          hideItemsPerPage
                        >
                          <tbody>
                            {calculateSummaryData(values).map((row, index) => (
                              <tr key={`${row.currencyId}-${index}-${addedSpecialCommissionValues?.total_commission || 0}-${addedSpecialCommissionValues?.amount || 0}`}>
                                <td>{row.currency}</td>
                                <td>{formatNumberForDisplay(row.total, 2)}</td>
                                <td>{formatNumberForDisplay(row.totalCommission, 2)}</td>
                                <td>{formatNumberForDisplay(row.vatAmount, 2)}</td>
                                <td>{formatNumberForDisplay(row.netTotal, 2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </CustomTable>
                      </div>
                    )}

                    <FileDisplayList
                      files={addedAttachments}
                      onRemoveFile={handleRemoveFile}
                    />

                    <div className="my-3">
                      <CustomButton
                        text={
                          addedSpecialCommissionValues
                            ? 'Edit Special Commission'
                            : 'Add Special Commission'
                        }
                        variant="secondary"
                        disabled={
                          isDisabled ||
                          !values.account_ledger ||
                          !values.account_id ||
                          // Require at least one row with Currency and FC Amount
                          !Object.values(rows).some(
                            (r) =>
                              r.currency &&
                              r.fcAmount &&
                              !isNaN(parseFloat(r.fcAmount))
                          )
                        }
                        type="button"
                        className="w-auto px-5"
                        onClick={handleOpenSpecialCommissionModal}
                      />
                    </div>
                    {/* Display Special Commission Text */}
                    {!!addedSpecialCommissionValues ? (
                      <div key={`sc-wrapper-${addedSpecialCommissionValues?.total_commission || 0}-${addedSpecialCommissionValues?.amount || 0}`}>
                        <p
                          className={`fs-5 ${addedSpecialCommissionValues.commission_type?.toLowerCase() ===
                            'income'
                            ? 'text-success'
                            : 'text-danger'
                            }`}
                        >
                          {formatNumberForDisplay(
                            addedSpecialCommissionValues?.commission,
                            2
                          )}
                          %{' '}
                          {addedSpecialCommissionValues?.commission_type?.toLowerCase() ===
                            'income'
                            ? 'receivable'
                            : 'payable'}{' '}
                          commission of{' '}
                          {currencyOptions?.find(
                            (x) =>
                              x.value ==
                              (addedSpecialCommissionValues.currency_id ||
                                values.currency_id)
                          )?.label || ''}{' '}
                          {formatNumberForDisplay(
                            addedSpecialCommissionValues?.total_commission,
                            2
                          )}{' '}
                          on{' '}
                          {currencyOptions?.find(
                            (x) =>
                              x.value ==
                              (addedSpecialCommissionValues.currency_id ||
                                values.currency_id)
                          )?.label || ''}{' '}
                          {formatNumberForDisplay(
                            addedSpecialCommissionValues?.amount || 0,
                            2
                          )}
                        </p>
                      </div>
                    ) : null}
                    <div className="d-flex flex-wrap justify-content-between mt-3 mb-5">
                      <div className="d-inline-block mt-3">
                        <CustomCheckbox
                          label="Account Balance"
                          checked={getAccountBalanceSettings(
                            'inward_payment_order'
                          )}
                          disabled={isDisabled}
                          style={{ border: 'none', margin: 0 }}
                          onChange={(e) =>
                            updateAccountBalanceSetting(
                              'inward_payment_order',
                              e.target.checked
                            )
                          }
                          readOnly={isDisabled}
                        />
                        <CustomCheckbox
                          label="Print"
                          disabled={!hasPrintPermission}
                          checked={getPrintSettings('inward_payment_order')}
                          onChange={(e) =>
                            updatePrintSetting(
                              'inward_payment_order',
                              e.target.checked
                            )
                          }
                          readOnly={isDisabled}
                          style={{ border: 'none', margin: 0 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
      <VoucherNavigationBar
        isDisabled={isDisabled}
        actionButtons={[
          { text: 'Add Rows', onClick: handleAddRows, disabled: isDisabled },
          {
            text: 'Save',
            onClick: handleSubmit,
            disabled: isDisabled,
          },
          { text: 'Cancel', onClick: handleCancel, variant: 'secondaryButton' },
        ]}
        onAttachmentClick={() => setUploadAttachmentsModal(true)}
        loading={createInwardPaymentOrderMutation.isPending}
        lastVoucherNumbers={lastVoucherNumbers}
        setPageState={setPageState}
        setWriteTerm={setWriteTerm}
        setSearchTerm={setSearchTerm}
      />
      {/* Upload Attachments Modal - Following  */}
      <CustomModal
        show={uploadAttachmentsModal}
        close={() => setUploadAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          uploadOnly
          getUploadedFiles={setAddedAttachments}
          closeUploader={() => setUploadAttachmentsModal(false)}
        />
      </CustomModal>
      <CustomModal
        show={showOutOfScopeModal}
        close={() => setShowOutOfScopeModal(false)}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle">Out of Scope Reason</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{
              reason: '',
            }}
            onSubmit={handleVatOutOfScope}
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form>
                <div className="mb-45">
                  <CustomInput
                    label="Reason"
                    name="reason"
                    required
                    id="reason"
                    type="textarea"
                    rows={1}
                    placeholder="Enter reason"
                    value={values.reason}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.reason && errors.reason}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {/* {!addClassificationMutation.isPending ? ( */}
                  <>
                    <CustomButton type="submit" text={'Save'} />
                    <CustomButton
                      variant={'secondaryButton'}
                      text={'Cancel'}
                      type={'button'}
                      onClick={() => setShowOutOfScopeModal(false)}
                    />
                  </>
                  {/* ) : (
                    <PulseLoader size={11} className="modalLoader" />
                  )} */}
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </CustomModal>

      <CustomModal
        show={walkinModal}
        close={handleCloseWalkinModal}
        background={true}
        size="xl"
      >
        <section>
          <h2 className="screen-title mb-3">Walk-in Customer Search</h2>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            showFilterBorders={true}
            headers={walkInHeaders}
            isPaginated={false}
            hideItemsPerPage={true}
            isLoading={isLoading}
            searchPlaceholder="Search Beneficiary"
          >
            {(walkInCustomersData?.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={walkInHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch Walk-in customers at this time
                      </p>
                    </td>
                  </tr>
                )}
                {walkInCustomersData
                  ?.filter((item) => {
                    const search = filters.search?.toLowerCase() || '';

                    return (
                      !search ||
                      (item.title || '').toLowerCase().includes(search) ||
                      (item.address || '').toLowerCase().includes(search) ||
                      (item.id_number || '').toLowerCase().includes(search) ||
                      (item.mobile_number_full || '')
                        .toLowerCase()
                        .includes(search) ||
                      (item.telephone_number_full || '')
                        .toLowerCase()
                        .includes(search) ||
                      (item.expiry_date || '').toLowerCase().includes(search) ||
                      (item.nationality?.name || '')
                        .toLowerCase()
                        .includes(search) || // ✅ Search by nationality
                      (item.id_type?.description || '')
                        .toLowerCase()
                        .includes(search) // ✅ Search by ID type
                    );
                  })
                  .map((item) => (
                    <tr
                      key={item.id}
                      style={{ cursor: 'pointer' }}
                      className="table-row-hover"
                      onClick={() => handleSelectWalkinCustomer(item)}
                    >
                      <td>{item.title}</td>
                      <td>{item.address}</td>
                      <td>{item.telephone_number_full}</td>
                      <td>{item.mobile_number_full}</td>
                      <td>{item.nationality?.name}</td>
                      <td>{item.id_type?.description}</td>{' '}
                      {/* ✅ show readable name */}
                      <td>{item.id_number}</td>
                      <td>{item.expiry_date}</td>
                    </tr>
                  ))}
              </tbody>
            )}
          </CustomTable>
        </section>
      </CustomModal>

      {/* Special Commission Modal */}
      <CustomModal
        show={showSCModal}
        close={() => setShowSCModal(false)}
        size="xl"
        closeOnOutsideClick={false}
      >
        <SpecialCommission
          preFilledValues={(() => {
            const firstValidRow = Object.values(rows).find((row) => {
              return (
                row.currency && row.fcAmount && !isNaN(parseFloat(row.fcAmount))
              );
            });

            // If editing existing Special Commission, use its currency
            // Otherwise, use the first valid row's currency
            const selectedCurrency = addedSpecialCommissionValues?.currency_id
              ? currencyOptions?.find(
                (c) => c.value === addedSpecialCommissionValues.currency_id
              )
              : currencyOptions?.find(
                (c) => c.value === firstValidRow?.currency
              );

            return {
              date: addedSpecialCommissionValues?.date || date,
              transaction_no:
                addedSpecialCommissionValues?.transaction_no ||
                lastVoucherNumbers?.current ||
                lastVoucherNumbers?.last ||
                '',
              commission_type:
                addedSpecialCommissionValues?.commission_type || 'Income',
              ledger: {
                value:
                  addedSpecialCommissionValues?.ledger ||
                  formikRef?.current?.values.account_ledger ||
                  '',
                label:
                  addedSpecialCommissionValues?.ledger_name ||
                  ledgerOptions.find(
                    (x) => x.value === formikRef?.current?.values.account_ledger
                  )?.label ||
                  '',
              },
              ledger_name:
                addedSpecialCommissionValues?.ledger_name ||
                ledgerOptions.find(
                  (x) => x.value === formikRef?.current?.values.account_ledger
                )?.label ||
                '',
              account: {
                value:
                  addedSpecialCommissionValues?.account_id ||
                  formikRef?.current?.values.account_id ||
                  '',
                label:
                  addedSpecialCommissionValues?.account ||
                  getAccountsByTypeOptions(
                    formikRef?.current?.values.account_ledger
                  ).find(
                    (x) => x.value === formikRef?.current?.values.account_id
                  )?.label ||
                  '',
              },
              account_id:
                addedSpecialCommissionValues?.account_id ||
                formikRef?.current?.values.account_id ||
                '',
              currency: selectedCurrency || '',
              currency_id:
                addedSpecialCommissionValues?.currency_id ||
                firstValidRow?.currency ||
                '',
              amount:
                addedSpecialCommissionValues?.amount ||
                firstValidRow?.fcAmount ||
                0,
              commission: addedSpecialCommissionValues?.commission || 0,
              total_commission:
                addedSpecialCommissionValues?.total_commission || 0,
              description: addedSpecialCommissionValues?.description || '',
              distributions: addedSpecialCommissionValues?.distributions || [],
            };
          })()}
          sCValues={addedSpecialCommissionValues}
          isEdit={!!addedSpecialCommissionValues}
          availableCurrencies={(() => {
            const currenciesFromRows = {};
            Object.values(rows).forEach((row) => {
              if (
                row.currency &&
                row.fcAmount &&
                !isNaN(parseFloat(row.fcAmount))
              ) {
                const currency = currencyOptions?.find(
                  (c) => c.value === row.currency
                );
                if (currency) {
                  currenciesFromRows[row.currency] = {
                    ...currency,
                    amount: parseFloat(row.fcAmount) || 0,
                    rowId: row.id,
                  };
                }
              }
            });
            return Object.values(currenciesFromRows);
          })()}
          onSubmit={(sCValues) => {
            setAddedSpecialCommissionValues(sCValues);
            setShowSCModal(false);
          }}
          onCancel={() => setShowSCModal(false)}
          onDelete={() => {
            setAddedSpecialCommissionValues(null);
            setShowSCModal(false);
          }}
        />
      </CustomModal>

      {/* Missing Currency Rate Modal (following Receipt Voucher pattern) */}
      <CustomModal
        show={showMissingCurrencyRateModal}
        close={() => setShowMissingCurrencyRateModal(false)}
        title={'Missing Rate of Exchange'}
        description={'Rate of exchange is missing for selected currency.'}
        variant={'error'}
        btn1Text={'Update Rate of Exchange'}
        action={() => {
          // Save form data before navigation (following Receipt Voucher pattern)
          if (formikRef.current) {
            saveFormValues(formId, {
              values: formikRef.current.values,
              rows,
              addedAttachments,
              addedSpecialCommissionValues,
              date,
            });
            setLastVisitedPage(formId, 'rate-of-exchange');
          }
          navigate('/transactions/remittance-rate-of-exchange', {
            state: { currencyToSelect },
          });
        }}
      />
    </>
  );
};

export default withModal(NewInwardPaymentOrder);
