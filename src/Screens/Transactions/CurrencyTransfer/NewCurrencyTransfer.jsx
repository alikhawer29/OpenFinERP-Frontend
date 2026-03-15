import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import { useCallback, useEffect, useRef, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import AccountBalanceCard from '../../../Components/AccountBalanceCard/AccountBalanceCard';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CombinedInputs from '../../../Components/CombinedInputs/CombinedInputs';
import CustomButton from '../../../Components/CustomButton';
import CustomCheckbox from '../../../Components/CustomCheckbox/CustomCheckbox';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import ExchangeRatesCard from '../../../Components/ExchangeRatesCard/ExchangeRatesCard';
import FileDisplayList from '../../../Components/FileDisplayList/FileDisplayList';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import useAccountsByType from '../../../Hooks/useAccountsByType';
import {
  getAccountBalances,
  getCities,
  getDocTypes,
  getExchangeRates,
  pairReleased,
} from '../../../Services/General';
import {
  createCurrencyTransfer,
  getCTBanks,
  getCurrencyTransferListing,
} from '../../../Services/Transaction/CurrencyTransfer';
import useFormStore from '../../../Stores/FormStore';
import useSettingsStore from '../../../Stores/SettingsStore';
import { ledgerOptions } from '../../../Utils/Constants/SelectOptions.js';
import { currencyTransferNewHeaders } from '../../../Utils/Constants/TableHeaders';
import { formatNumberWithCommas } from '../../../Utils/Helpers.js';
import { isNullOrEmpty, showErrorToast } from '../../../Utils/Utils';
import { currencyTransferValidationSchema } from '../../../Utils/Validations/ValidationSchemas';
import SpecialCommission from '../SpecialCommission/SpecialCommission';
import CurrencyTransferRow from './CurrencyTransferRow';

const generateInitialRows = (count, currencyOptions = []) => {
  const rows = {};

  // Filter out loading/disabled options
  const validCurrencyOptions = currencyOptions.filter(
    (option) => option.value && !option.isDisabled
  );

  // Always prioritize TMN currency as default - try multiple variations
  const tmnCurrency = validCurrencyOptions.find(
    (x) =>
      x.label === 'TMN' || x.label === 'tmn' || x.label?.toUpperCase() === 'TMN'
  );

  // TMN currency found, will be used as default

  const defaultCurrency = tmnCurrency
    ? tmnCurrency.value
    : validCurrencyOptions[0]?.value || 'DHS';
  const defaultCurrencyId = tmnCurrency
    ? tmnCurrency.value
    : validCurrencyOptions[0]?.value || null;

  for (let i = 0; i < count; i++) {
    const id = crypto.randomUUID();
    rows[id] = {
      id,
      currency: defaultCurrency,
      currency_id: defaultCurrencyId,
      amount: '',
      narration: '',
      docType: '',
      docNo: '',
      bank: '',
      city: '',
      code: '',
    };
  }

  return rows;
};

// INITIAL_STATE will be set dynamically when currencyOptions are available

const NewCurrencyTransfer = ({
  state,
  isDisabled = false,
  setIsDisabled,
  setShowAddLedgerModal,
  newlyCreatedAccount,
  uploadAttachmentsModal,
  setUploadAttachmentsModal,
  setShowMissingCurrencyRateModal,
  lastVoucherNumbers,
  setCurrencyToSelect,
  currencyOptions = [],
  date,
  setDate,
  // Clone functionality props (following Journal Voucher pattern)
  cloneCT,
  setCloneCT,
  setWriteCloneTerm,
  setSearchTerm,
  setPageState,
  // Form data handling props (following TMN Currency Deal pattern)
  onFormDataChange,
  restoreValuesFromStore,
  permissions,
  hasPrintPermission,
}) => {
  const [rows, setRows] = useState({});
  const [currencyTotals, setCurrencyTotals] = useState([]); // Track totals by currency
  const [rowFieldErrors, setRowFieldErrors] = useState({});
  const [rowsTouched, setRowsTouched] = useState({});
  const [showSubmitError, setShowSubmitError] = useState(false);
  const formikRef = useRef();

  // Form store for handling navigation state (following TMN Currency Deal pattern)
  const {
    getFormValues,
    hasFormValues,
    clearFormValues,
    clearLastVisitedPage,
    getLastVisitedPage,
  } = useFormStore();
  const formId = 'currency-transfer'; // Unique identifier for this form (consistent with parent)

  // Attachment state (following Journal Voucher pattern)
  const [addedAttachments, setAddedAttachments] = useState({});

  // Row-level attachment state
  const [rowAttachments, setRowAttachments] = useState({}); // Store attachments by row ID
  const [rowAttachmentsModal, setRowAttachmentsModal] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState(null);

  // Special Commission state (following Account to Account pattern)
  const [addedSpecialCommissionValues, setAddedSpecialCommissionValues] =
    useState(null);
  const [showSCModal, setShowSCModal] = useState(false);

  // Track previous rows for Special Commission sync rules
  const prevRowsRef = useRef({});

  // Restoration ref to prevent calculations during form restoration (following Account to Account pattern)
  const isRestoringRef = useRef(false);

  // Account selection state
  const [selectedDebitAccount, setSelectedDebitAccount] = useState(null);
  const [selectedCreditAccount, setSelectedCreditAccount] = useState(null);
  const [newAccountTriggeredFrom, setNewAccountTriggeredFrom] = useState('');

  // Exchange rates state (following Receipt Voucher pattern)
  const [exchangeRatesInverse, setExchangeRatesInverse] = useState(false);
  const handleResetForm = () => {
    if (formikRef.current) {
      formikRef.current.resetForm();
    }
    setAddedAttachments([]);
    setIsDisabled(true);
  };

  const queryClient = useQueryClient();

  // Create Currency Transfer mutation (following Journal Voucher pattern)
  const createCurrencyTransferMutation = useMutation({
    mutationFn: createCurrencyTransfer,
    onSuccess: (data) => {
      showToast('Currency Transfer created successfully!', 'success');

      // Print if enabled and PDF URL is available (following TMN Currency Deal pattern)
      if (hasPrintPermission && getPrintSettings('currency_transfer') && data?.detail?.pdf_url) {
        window.open(data.detail.pdf_url, '_blank');
      }
      queryClient.invalidateQueries(['currencyTransferListing']);
      // Reset form and state
      handleCancel();
      handleResetForm();
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  useEffect(() => {
    if (date && formikRef.current) {
      formikRef.current.setFieldValue('date', date);
    }
    // Update Special Commission date if it exists
    if (date && addedSpecialCommissionValues) {
      setAddedSpecialCommissionValues((prev) => ({
        ...prev,
        date: date,
      }));
    }
  }, [date]);

  // Get account options using custom hook
  const { getAccountsByTypeOptions } = useAccountsByType({
    includeBeneficiary: false,
    staleTime: 1000 * 60 * 5,
  });

  const {
    getPrintSettings,
    updatePrintSetting,
    getAccountBalanceSettings,
    updateAccountBalanceSetting,
  } = useSettingsStore();

  // No longer needed - Special Commission uses modal approach (following Account to Account pattern)


  // Handle navigation from Rate of Exchange page (following Account to Account pattern)
  useEffect(() => {
    const lastPage = getLastVisitedPage(formId);
    if (lastPage === 'remittanceRateOfExchange') {
      const savedFormData = getFormValues(formId);
      if (savedFormData) {
        // Set page state to new and enable the form
        setPageState('new');
        setIsDisabled(false);
        // The parent will handle setting restoreValuesFromStore
      }
    }
  }, []);

  useEffect(() => {
    if (isRestoringRef.current) {
      return;
    }

    if (restoreValuesFromStore) {
      const savedFormData = getFormValues(formId);

      if (savedFormData && formikRef.current) {
        // Set ref to prevent calculations during restoration
        isRestoringRef.current = true;

        formikRef.current.setValues(savedFormData.values || savedFormData);
        setAddedAttachments(savedFormData.addedAttachments || {});
        // Restore table row data
        if (savedFormData.rows) {
          setRows(savedFormData.rows);
        }
        // Restore row-level attachments
        if (savedFormData.rowAttachments) {
          setRowAttachments(savedFormData.rowAttachments);
        }
        // Restore Special Commission data
        if (savedFormData.addedSpecialCommissionValues) {
          setAddedSpecialCommissionValues(
            savedFormData.addedSpecialCommissionValues
          );
        }
        // Restore selected accounts for balance cards
        if (savedFormData.selectedDebitAccount) {
          setSelectedDebitAccount(savedFormData.selectedDebitAccount);
        }
        if (savedFormData.selectedCreditAccount) {
          setSelectedCreditAccount(savedFormData.selectedCreditAccount);
        }
        setIsDisabled(false);

        // Reset the flag after a delay
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 500);

        clearFormValues(formId);
        clearLastVisitedPage(formId);
      }
    }
  }, [restoreValuesFromStore]);

  // Notify parent of form data changes (for saving before navigation) (following TMN Currency Deal pattern)
  useEffect(() => {
    // DO NOT notify parent if we are restoring or if rows are not yet initialized
    if (isRestoringRef.current || Object.keys(rows).length === 0) {
      return;
    }

    if (onFormDataChange && formikRef?.current) {
      onFormDataChange({
        values: formikRef.current?.values,
        addedAttachments,
        rows, // Include table row data
        rowAttachments, // Include row-level attachments
        addedSpecialCommissionValues, // Include Special Commission data
        selectedDebitAccount, // Include accounts for balance cards
        selectedCreditAccount,
      });
    }
  }, [
    formikRef.current?.values,
    addedAttachments,
    rows,
    rowAttachments,
    addedSpecialCommissionValues,
    selectedDebitAccount,
    selectedCreditAccount,
    onFormDataChange,
  ]);

  useEffect(() => {
    // Don't generate initial rows if we're restoring from Special Commission
    if (isRestoringRef.current) {
      return;
    }

    if (
      Object.keys(rows).length === 0 &&
      currencyOptions.length > 0 &&
      currencyOptions[0].value && // Ensure we have real data, not loading state
      !currencyOptions[0].isDisabled && // Ensure it's not the loading placeholder
      !cloneCT && // Only generate initial rows if not cloning
      !restoreValuesFromStore // Don't generate initial rows if we're restoring data
    ) {
      setRows(generateInitialRows(4, currencyOptions));
    }
  }, [currencyOptions, cloneCT, restoreValuesFromStore]);

  // (Cheque number logic removed for Currency Transfer)

  // Fetch account balances
  const { data: debitAccountBalance } = useQuery({
    queryKey: ['accountBalance', selectedDebitAccount?.value],
    queryFn: () =>
      getAccountBalances(
        selectedDebitAccount.value,
        selectedDebitAccount.accountType
      ),
    enabled: !!selectedDebitAccount?.value,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
  const { data: creditAccountBalance } = useQuery({
    queryKey: ['accountBalance', selectedCreditAccount?.value],
    queryFn: () =>
      getAccountBalances(
        selectedCreditAccount.value,
        selectedCreditAccount.accountType
      ),
    enabled: !!selectedCreditAccount?.value,
    staleTime: 1000 * 60 * 2,
  });

  // Exchange rates (following Receipt Voucher pattern)
  const {
    data: exchangeRatesData,
    isLoading: isLoadingExchangeRates,
    isError: isErrorExchangeRates,
    error: errorExchangeRates,
  } = useQuery({
    queryKey: ['exchangeRates', exchangeRatesInverse],
    queryFn: () => getExchangeRates(exchangeRatesInverse),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  // Fetch Banks
  const {
    data: banks,
    isLoading: isLoadingBanks,
    isError: isErrorBanks,
    error: errorBanks,
  } = useQuery({
    queryKey: ['banks'],
    queryFn: getCTBanks,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // Fetch Document Types (following General.js pattern)
  const {
    data: docTypes,
    isLoading: isLoadingDocTypes,
    isError: isErrorDocTypes,
    error: errorDocTypes,
  } = useQuery({
    queryKey: ['doc-types'],
    queryFn: getDocTypes,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // Fetch Cities (following General.js pattern)
  const {
    data: cities,
    isLoading: isLoadingCities,
    isError: isErrorCities,
    error: errorCities,
  } = useQuery({
    queryKey: ['cities'],
    queryFn: getCities,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // Clone Currency Transfer API call (following Journal Voucher pattern)
  const {
    data: { data: [currencyTransferData] = [] } = {}, // [currencyTransferData] = destructuring array first item
    isLoading: isLoadingCloneCT,
    isError: isErrorCloneCT,
    error: errorCloneCT,
  } = useQuery({
    queryKey: ['currencyTransfer', cloneCT],
    queryFn: () => getCurrencyTransferListing({ search: cloneCT }),
    enabled: !!cloneCT,
  });

  // Helper functions to transform data into options
  const getBankOptions = () => {
    if (isLoadingBanks) {
      return [{ label: 'Loading...', value: null, isDisabled: true }];
    }
    if (isErrorBanks) {
      return [{ label: 'Unable to fetch banks', value: null }];
    }
    return (
      banks?.map((x) => ({
        value: x?.id,
        label: x?.description,
      })) || []
    );
  };

  const getDocTypeOptions = () => {
    if (isLoadingDocTypes) {
      return [{ label: 'Loading...', value: null, isDisabled: true }];
    }
    if (isErrorDocTypes) {
      return [{ label: 'Unable to fetch document types', value: null }];
    }
    return (
      docTypes?.map((x) => ({
        value: x?.id,
        label: x?.description,
      })) || []
    );
  };

  const getCityOptions = () => {
    if (isLoadingCities) {
      return [{ label: 'Loading...', value: null, isDisabled: true }];
    }
    if (isErrorCities) {
      return [{ label: 'Unable to fetch cities', value: null }];
    }
    return (
      cities?.map((x) => ({
        value: x?.id,
        label: x?.description,
      })) || []
    );
  };

  // Function to calculate currency totals from rows
  const calculateCurrencyTotals = (rowsData) => {
    const totals = {};

    // Iterate through all rows and sum amounts by currency
    Object.values(rowsData).forEach((row) => {
      if (row.currency && row.amount && !isNaN(parseFloat(row.amount))) {
        // Find the actual currency label for this row
        const currencyOption = currencyOptions.find(
          (x) => x.value === row.currency
        );
        const currencyLabel = currencyOption?.label || row.currency;
        const amount = parseFloat(row.amount);

        if (totals[currencyLabel]) {
          totals[currencyLabel] += amount;
        } else {
          totals[currencyLabel] = amount;
        }
      }
    });

    // Convert to array format for display
    return Object.entries(totals).map(([currency, total]) => ({
      currency,
      net_total: total.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    }));
  };

  // Update currency totals whenever rows change
  useEffect(() => {
    const newTotals = calculateCurrencyTotals(rows);
    setCurrencyTotals(newTotals);
  }, [rows, currencyOptions]);

  // Special Commission Sync and Recalculation Rules
  useEffect(() => {
    // Skip if SC is not added, or we're currently restoring a form
    if (!addedSpecialCommissionValues || isRestoringRef.current) {
      prevRowsRef.current = rows;
      return;
    }

    const scCurrencyId = addedSpecialCommissionValues.currency_id;
    let shouldClear = false;

    // Rule: The Special Commission should be deleted only when that currency is removed from the LAST remaining row where it is used.
    const rowList = Object.values(rows);

    // Safeguard: Do not clear SC if rows are completely empty (prevents clearing during initialization/restoration)
    if (rowList.length === 0) {
      return;
    }

    // Check if the SC currency exists in any of the current rows
    const currencyStillExists = rowList.some(
      (row) => row.currency_id == scCurrencyId
    );

    if (!currencyStillExists) {
      shouldClear = true;
    }

    if (shouldClear) {
      setAddedSpecialCommissionValues(null);
    } else {
      // Auto-recalculate amount if currency is still valid
      const totalAmountForCurrency = Object.values(rows)
        .filter(
          (row) =>
            row.currency_id == scCurrencyId &&
            row.amount &&
            !isNaN(parseFloat(row.amount))
        )
        .reduce((sum, row) => sum + parseFloat(row.amount), 0);

      // Rule: If the total amount becomes 0 (even if currency exists), clear the Special Commission
      if (totalAmountForCurrency <= 0.000001) {
        setAddedSpecialCommissionValues(null);
      }
      // Update Special Commission amount if total changed and is non-zero
      else if (
        totalAmountForCurrency !== parseFloat(addedSpecialCommissionValues.amount)
      ) {
        const commissionPercentage =
          parseFloat(addedSpecialCommissionValues.commission) || 0;
        const newTotalCommission =
          (totalAmountForCurrency * commissionPercentage) / 100;

        setAddedSpecialCommissionValues((prev) => ({
          ...prev,
          amount: totalAmountForCurrency,
          total_commission: newTotalCommission.toFixed(2),
        }));
      }
    }

    // Update ref for next comparison
    prevRowsRef.current = rows;
  }, [rows, addedSpecialCommissionValues]);

  // Process cloned Currency Transfer data (following Journal Voucher pattern)
  useEffect(() => {
    // Don't process clone data if we're restoring from Special Commission
    if (isRestoringRef.current) return;

    if (
      !isNullOrEmpty(currencyTransferData?.currency_transfer?.details) &&
      !restoreValuesFromStore
    ) {
      setRows(() => {
        const editRows = {};

        currencyTransferData.currency_transfer.details.forEach((x) => {
          const id = crypto.randomUUID();
          editRows[id] = {
            id,
            currency: x.currency?.id || '', // Set currency ID for proper selection (not currency_code)
            currency_id: x.currency?.id || null,
            amount: x.amount || '',
            narration: x.narration || '',
            // Clone all fields including Doc Type, Doc No, and Bank
            docType: x.doc_type?.id || '',
            docNo: x.doc_no || '',
            bank: x.bank?.id || '', // Set bank ID for proper selection
            city: x.city?.id || '', // Set city ID for proper selection
            code: x.code || '',
            error: false,
          };
        });

        return { ...editRows };
      });

      // Set Formik values for the main fields
      if (formikRef.current && currencyTransferData.currency_transfer) {
        const ct = currencyTransferData.currency_transfer;
        formikRef.current.setValues({
          debitLedger: ct.debit_account_ledger || '',
          debitAccount: ct.debit_account_id || '',
          creditLedger: ct.credit_account_ledger || '',
          creditAccount: ct.credit_account_id || '',
          accountTitle: ct.account_title || 'show',
          date: ct.date || date || '',
        });
      }
    }
  }, [currencyTransferData, restoreValuesFromStore]);

  // Reset rows when clone is cleared (following Journal Voucher pattern)
  useEffect(() => {
    if (isRestoringRef.current) return;

    if (!cloneCT && Object.keys(rows).length > 0 && !restoreValuesFromStore) {
      handleResetRows();
    }
  }, [cloneCT, restoreValuesFromStore]);

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
  }, []);

  const hasValidCTRows = () => {
    const rowIds = Object.keys(rows);
    let validRows = [];

    rowIds.forEach((rowId, index) => {
      const row = rows[rowId];
      const isFirstRow = index === 0;

      // For rows other than the first, check if any field other than currency is filled
      const otherFieldsHaveData = row.amount

      // For first row OR any row with other data, it must have BOTH currency and amount to be valid
      if (isFirstRow || otherFieldsHaveData) {
        if (row.currency_id && row.amount) {
          validRows.push(row);
        }
      }
    });

    return validRows;
  };
  const handleAddRows = () => {
    let count = 6; // Number of rows to add (following Journal Voucher pattern)
    const newRows = {};

    // Filter out loading/disabled options
    const validCurrencyOptions = currencyOptions.filter(
      (option) => option.value && !option.isDisabled
    );

    // Find TMN currency option, fallback to first available currency - try multiple variations
    const tmnCurrency = validCurrencyOptions.find(
      (x) =>
        x.label === 'TMN' ||
        x.label === 'tmn' ||
        x.label?.toUpperCase() === 'TMN'
    );

    const defaultCurrency = tmnCurrency
      ? tmnCurrency.value
      : validCurrencyOptions[0]?.value || 'DHS';
    const defaultCurrencyId = tmnCurrency
      ? tmnCurrency.value
      : validCurrencyOptions[0]?.value || null;

    Array.from({ length: count }).forEach(() => {
      const id = crypto.randomUUID();
      newRows[id] = {
        id,
        currency: defaultCurrency,
        currency_id: defaultCurrencyId,
        amount: '',
        narration: '',
        docType: '',
        docNo: '',
        bank: '',
        city: '',
        code: '',
        error: false,
      };
    });
    setRows((prevRows) => ({ ...prevRows, ...newRows }));
  };

  // Helper function to get available currencies for Special Commission
  const getAvailableCurrenciesForSC = () => {
    // Get unique currency IDs that are selected in the rows
    const selectedCurrencyIds = [...new Set(Object.values(rows)
      .map(row => row.currency_id)
      .filter(id => id))];

    // Filter currencyOptions to only include those selected in rows
    // and attach the total amount for each currency
    return currencyOptions
      .filter(opt => selectedCurrencyIds.includes(opt.value))
      .map(opt => {
        const totalAmount = Object.values(rows)
          .filter(row => row.currency_id === opt.value && row.amount && !isNaN(parseFloat(row.amount)))
          .reduce((sum, row) => sum + parseFloat(row.amount), 0);

        return {
          ...opt,
          amount: totalAmount
        };
      });
  };

  // Helper function to get Special Commission pre-filled values (following Account to Account pattern)
  const getSCValues = () => {
    // Get the first valid row with currency and amount for Special Commission
    const validRows = hasValidCTRows();
    const firstValidRow = validRows.length > 0 ? validRows[0] : null;

    // When editing SC, use existing SC values for currency if available, otherwise use first valid row
    const scCurrencyId =
      addedSpecialCommissionValues?.currency_id || firstValidRow?.currency_id;

    // Calculate total amount for the selected currency across all rows
    const totalAmountForCurrency = Object.values(rows)
      .filter(row => row.currency_id === scCurrencyId && row.amount && !isNaN(parseFloat(row.amount)))
      .reduce((sum, row) => sum + parseFloat(row.amount), 0);

    const scAmount = totalAmountForCurrency || 0;

    // Commission type options for select
    const commissionTypeOptions = [
      { value: 'Expense', label: 'Expense' },
      { value: 'Income', label: 'Income' },
    ];

    // Get the commission type value (either from existing data or default)
    const commissionTypeValue =
      addedSpecialCommissionValues?.commission_type || 'Income';

    // Prepare Special Commission values
    return {
      date: date,
      transaction_no: lastVoucherNumbers?.last || lastVoucherNumbers?.current,
      // Spread existing values first
      ...addedSpecialCommissionValues,
      // Then override with properly formatted select options (these must come AFTER the spread)
      account:
        formikRef?.current?.values
          ? getAccountsByTypeOptions(formikRef.current.values.debitLedger).find(
            (x) => x.value === formikRef.current.values.debitAccount
          ) || ''
          : '',
      currency: currencyOptions.find((x) => x.value === scCurrencyId) || '',
      amount: scAmount,
      // Ensure currency_id is set for the backend
      currency_id: scCurrencyId,
      ledger:
        formikRef?.current?.values
          ? ledgerOptions.find(
            (x) => x.value === formikRef.current.values.debitLedger
          ) || ''
          : '',
      commission_type:
        commissionTypeOptions.find((x) => x.value === commissionTypeValue) ||
        commissionTypeOptions[0],
    };
  };

  // Helper function to get available accounts for Special Commission (following Account to Account pattern)
  const getAvailableAccountsForSC = () => {
    const accounts = [];

    // Add debit account if selected
    if (
      formikRef?.current?.values?.debitAccount &&
      formikRef?.current?.values?.debitLedger
    ) {
      const debitAccount = getAccountsByTypeOptions(
        formikRef.current.values.debitLedger
      ).find((x) => x.value === formikRef.current.values.debitAccount);
      if (debitAccount) {
        accounts.push({
          label: debitAccount.label,
          value: debitAccount.value,
          ledgerType: formikRef.current.values.debitLedger,
          ledgerLabel:
            ledgerOptions.find(
              (x) => x.value === formikRef.current.values.debitLedger
            )?.label || '',
        });
      }
    }

    // Add credit account if selected
    if (
      formikRef?.current?.values?.creditAccount &&
      formikRef?.current?.values?.creditLedger
    ) {
      const creditAccount = getAccountsByTypeOptions(
        formikRef.current?.values?.creditLedger
      ).find((x) => x.value === formikRef.current?.values?.creditAccount);
      if (creditAccount) {
        accounts.push({
          label: creditAccount.label,
          value: creditAccount.value,
          ledgerType: formikRef.current?.values?.creditLedger,
          ledgerLabel:
            ledgerOptions.find(
              (x) => x.value === formikRef.current?.values?.creditLedger
            )?.label || '',
        });
      }
    }

    return accounts;
  };

  // Special Commission modal handler (following Account to Account pattern)
  const handleOpenSpecialCommissionModal = () => {
    // Check if required fields are filled
    const requiredFields = [
      'debitLedger',
      'debitAccount',
      'creditLedger',
      'creditAccount',
    ];
    const missingFields = requiredFields.filter(
      (field) => !formikRef.current?.values?.[field]
    );
    if (missingFields.length > 0) {
      // Set touched for all required fields to show errors
      const touchedFields = {};
      requiredFields.forEach((field) => {
        touchedFields[field] = true;
      });
      formikRef.current.setTouched({
        ...formikRef.current.touched,
        ...touchedFields,
      });
      return;
    }

    // Get the first valid row with currency and amount for Special Commission
    const validRows = hasValidCTRows();

    if (validRows.length === 0) {
      // Show errors for rows if no valid row is found
      setRowsTouched((prev) => {
        const allTouched = {};
        Object.keys(rows).forEach((id) => (allTouched[id] = true));
        return allTouched;
      });
      setShowSubmitError(true);
      return;
    }

    // Open the modal
    setShowSCModal(true);
  };

  const handleSubmit = async () => {
    if (!formikRef.current) return;

    let hasTableErrors = false;
    // Check for any rows with errors
    if (Object.keys(rowFieldErrors).length > 0) {
      setRowsTouched((prev) => {
        const allTouched = {};
        Object.keys(rows).forEach((id) => (allTouched[id] = true));
        return allTouched;
      });
      hasTableErrors = true;
      setShowSubmitError(true);
    }

    // Validate the form
    const errors = await formikRef.current.validateForm();
    if (Object.keys(errors).length > 0) {
      // Mark only relevant fields as touched to show errors (only on submit)
      const touchedFields = {};

      // Always show ledger errors on submit
      if (errors.debitLedger) touchedFields.debitLedger = true;
      if (errors.creditLedger) touchedFields.creditLedger = true;

      // Only show account errors if corresponding ledger is filled
      if (errors.debitAccount && formikRef.current.values.debitLedger) {
        touchedFields.debitAccount = true;
      }
      if (errors.creditAccount && formikRef.current.values.creditLedger) {
        touchedFields.creditAccount = true;
      }

      formikRef.current.setTouched({
        ...formikRef.current.touched,
        ...touchedFields,
      });
    }

    if (hasTableErrors || Object.keys(errors).length > 0) {
      return;
    }

    const formValues = formikRef.current?.values;

    const validRows = hasValidCTRows();

    if (validRows.length === 0) {
      setShowSubmitError(true);
      return;
    }

    // Transform rows data to match API structure
    const details = {};
    validRows.forEach((row, index) => {
      if (row.currency_id)
        details[`details[${index}][currency_id]`] = row.currency_id;
      if (row.amount)
        details[`details[${index}][amount]`] = parseFloat(row.amount);
      if (row.narration)
        details[`details[${index}][narration]`] = row.narration;
      if (row.docType) details[`details[${index}][doc_type_id]`] = row.docType;
      if (row.docNo) details[`details[${index}][doc_no]`] = row.docNo;
      if (row.bank) details[`details[${index}][bank_id]`] = row.bank;
      if (row.city) details[`details[${index}][city_id]`] = row.city;
      if (row.code) details[`details[${index}][code]`] = row.code;

      // Add row-level attachments in the required format: details[0][files][0], details[0][files][1], etc.
      const rowAttachmentFiles = rowAttachments[row.id];
      if (rowAttachmentFiles) {
        Object.keys(rowAttachmentFiles).forEach((fileKey, fileIndex) => {
          details[`details[${index}][files][${fileIndex}]`] =
            rowAttachmentFiles[fileKey];
        });
      }
    });

    // Prepare the payload matching Postman structure exactly
    const payload = {
      date: formValues?.date || date, // Use form date or fallback to prop
      debit_account_ledger: formValues?.debitLedger,
      debit_account_id: formValues?.debitAccount,
      credit_account_ledger: formValues?.creditLedger,
      credit_account_id: formValues?.creditAccount,
      ...details,
      ...addedAttachments,
    };

    // Include account_title in payload with the actual selected value
    if (formValues?.accountTitle) {
      payload.account_title = formValues.accountTitle;
    }

    // Add Special Commission data if available (following Account to Account Edit pattern)
    if (addedSpecialCommissionValues) {
      // Flatten the SC object
      const converted = {};
      const sc = {
        transaction_no: lastVoucherNumbers?.last || lastVoucherNumbers?.current,
        date,
        ledger: formValues?.debitLedger, // Use string value, not object
        account_id: formValues?.debitAccount,
        currency_id: validRows[0]?.currency_id, // Use first valid row's currency
        amount: parseFloat(validRows[0]?.amount) || 0, // Convert to number
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
        } else if (
          key === 'ledger' &&
          typeof sc[key] === 'object' &&
          sc[key] !== null
        ) {
          // Skip the ledger object, use the string value instead
          converted[`special_commission[${key}]`] = formValues?.debitLedger;
        } else if (
          key === 'account' &&
          typeof sc[key] === 'object' &&
          sc[key] !== null
        ) {
          // Skip the account object, already have account_id
          continue;
        } else if (
          key === 'currency' &&
          typeof sc[key] === 'object' &&
          sc[key] !== null
        ) {
          // Skip the currency object, already have currency_id
          continue;
        } else if (key === 'commission_type') {
          // Handle commission_type - extract value if object, otherwise use as-is
          let ctValue =
            typeof sc[key] === 'object' && sc[key] !== null
              ? sc[key]?.value || 'Expense'
              : sc[key] || 'Expense';

          // Capitalize first letter (expense -> Expense, income -> Income)
          ctValue =
            ctValue.charAt(0).toUpperCase() + ctValue.slice(1).toLowerCase();

          converted[`special_commission[${key}]`] = ctValue;
        } else if (
          typeof sc[key] === 'object' &&
          sc[key] !== null &&
          !Array.isArray(sc[key])
        ) {
          // Skip other objects that aren't arrays
          continue;
        } else if (sc[key] !== undefined && sc[key] !== null) {
          // Include all other non-null primitive values
          converted[`special_commission[${key}]`] = sc[key];
        }
      }

      // Add converted SC data to payload
      Object.assign(payload, converted);
    }

    setDate(new Date().toLocaleDateString('en-CA'))
    handlePairReleased()
    // Submit the form using mutation
    createCurrencyTransferMutation.mutate(payload);
  };

  // Row validation effect (following Internal Payment Voucher pattern)
  useEffect(() => {
    const nextErrors = {};
    const rowIds = Object.keys(rows);

    // Check individual rows
    rowIds.forEach((rowId, index) => {
      const r = rows[rowId];
      const isFirstRow = index === 0;

      // Check if row has any data in any field other than currency
      const otherFieldsHaveData = r.amount || r.narration || r.docType || r.docNo || r.bank || r.city || r.code;

      // For first row or any row with other data, Currency and Amount are required
      if (isFirstRow || otherFieldsHaveData) {
        const errors = {};

        if (!r.currency_id) errors.currency = true;
        if (!r.amount) errors.amount = true;

        if (Object.keys(errors).length > 0) {
          nextErrors[r.id] = errors;
        }
      }
    });

    setRowFieldErrors(nextErrors);
    setShowSubmitError(false); // Clear error message when user modifies rows
  }, [rows]);

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
      .map((row) => row?.currency_id)
      .filter((item) => item?.currency_id !== '');
    // Remove duplicates
    const uniquePairIds = [...new Set(pairIds)];

    // Release each pair_id
    uniquePairIds.forEach((pairId) => {
      pairReleasedMutation.mutate(pairId);
    });
  };

  const handleCancel = () => {
    setIsDisabled(true)
    handlePairReleased()
    handleResetRows(); // Use the common reset function
    // Reset selected accounts (specific to cancel operation)
    setSelectedDebitAccount(null);
    setSelectedCreditAccount(null);
    setNewAccountTriggeredFrom('');
    // Reset form
    if (formikRef.current) {
      formikRef.current.resetForm();
    }
    setDate(new Date().toLocaleDateString('en-CA'))
  };

  const handleDeleteRow = (id) => {
    setRows((prevRows) => {
      const newState = { ...prevRows };
      delete newState[id];
      return newState;
    });
    // Also remove any attachments for this row
    setRowAttachments((prevAttachments) => {
      const newAttachments = { ...prevAttachments };
      delete newAttachments[id];
      return newAttachments;
    });
  };

  const handleResetRows = () => {
    // Only generate new rows if currency options are available
    if (
      currencyOptions.length > 0 &&
      currencyOptions[0].value &&
      !currencyOptions[0].isDisabled
    ) {
      setRows(generateInitialRows(4, currencyOptions));
    } else {
      setRows({});
    }
    setCloneCT('');
    setWriteCloneTerm('');
    setSearchTerm('');
    // Don't disable the form after reset - keep it enabled for continuous data entry
    // setIsDisabled(true);
    setAddedAttachments({});
    setRowAttachments({});
    setCurrencyTotals([]);
    setAddedSpecialCommissionValues(null); // Reset Special Commission data
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

  // Row-level attachment handlers
  const handleRowAttachmentClick = (rowId) => {
    setSelectedRowId(rowId);
    setRowAttachmentsModal(true);
  };

  const handleRowAttachmentsUpload = (files) => {
    if (selectedRowId) {
      setRowAttachments((prev) => ({
        ...prev,
        [selectedRowId]: files,
      }));
      showToast('Row attachments uploaded successfully!', 'success');
    }
    setRowAttachmentsModal(false);
    setSelectedRowId(null);
  };

  const getRowAttachmentCount = (rowId) => {
    const attachments = rowAttachments[rowId];
    if (!attachments) return 0;
    return Object.keys(attachments).length;
  };

  return (
    <div>
      <div className="d-card">
        <Formik
          innerRef={formikRef}
          initialValues={{
            debitLedger: '',
            debitAccount: '',
            creditLedger: '',
            creditAccount: '',
            accountTitle: 'show', // Set default value to 'show'
            date: date || '', // Add date field
          }}
          validationSchema={currencyTransferValidationSchema}
          enableReinitialize={false}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleBlur, setFieldValue, setFieldTouched, validateField }) => {
            // Helper function to handle account loading
            const handleLedgerChange = (
              ledgerType,
              fieldName,
              setAccountField,
              accountSetter // Add account setter parameter
            ) => {
              if (setFieldValue) {
                setFieldValue(fieldName, ledgerType);
                setFieldValue(setAccountField, ''); // Clear account when ledger changes

                // Reset selected account state when ledger changes
                if (accountSetter) {
                  accountSetter(null);
                }

                // Show immediate validation for ledger field
                setFieldTouched(fieldName, true);
                setTimeout(() => {
                  validateField(fieldName);
                }, 0);

                // Show immediate validation for account if ledger is filled but account is empty
                if (ledgerType) {
                  setFieldTouched(setAccountField, true);
                  // Trigger validation to show the error immediately
                  setTimeout(() => {
                    validateField(setAccountField);
                  }, 0);
                }

                // Rule: Clear Special Commission if ledger/account changes at top level
                if (addedSpecialCommissionValues) {
                  setAddedSpecialCommissionValues(null);
                }
              }
            };

            return (
              <Form>
                <div className="row justify-content-between">
                  <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
                    <div className="row mb-4">
                      {/* Debit Account Section */}
                      <div className="col-12 col-md-6 mb-45">
                        <CombinedInputs
                          label="Debit Account"
                          type1="select"
                          type2="select"
                          name1="debitLedger"
                          name2="debitAccount"
                          value1={values?.debitLedger}
                          value2={
                            values?.debitAccount ||
                            (newlyCreatedAccount?.id &&
                              newAccountTriggeredFrom === 'debit'
                              ? newlyCreatedAccount.id
                              : '')
                          }
                          options1={[
                            { label: 'PL', value: 'party' },
                            { label: 'GL', value: 'general' },
                            { label: 'WIC', value: 'walkin' },
                          ]}
                          options2={getAccountsByTypeOptions(
                            values?.debitLedger
                          )}

                          isDisabled={isDisabled}
                          handleBlur={handleBlur}
                          placeholder1="Ledger"
                          placeholder2="Account"
                          className1="ledger"
                          className2="account"
                          onChange1={(selected) => {
                            handleLedgerChange(
                              selected.value,
                              'debitLedger',
                              'debitAccount',
                              setSelectedDebitAccount
                            );
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
                              setSelectedDebitAccount({
                                value: selected.value,
                                label: selected.label,
                                accountType: values?.debitLedger,
                              });
                            } else if (selected.value === '') {
                              // Handle deselection - clear account field and state
                              setFieldValue('debitAccount', '');
                              setSelectedDebitAccount(null);
                            } else {
                              setFieldValue('debitAccount', selected.value);
                              // Track selected debit account for balance fetching
                              setSelectedDebitAccount({
                                value: selected.value,
                                label: selected.label,
                                accountType: values?.debitLedger,
                              });
                              // Show immediate validation if debit account is empty and debit ledger is filled
                              if (values?.debitLedger && !selected.value) {
                                setFieldTouched('debitAccount', true);
                                // Trigger validation to show the error immediately
                                setTimeout(() => {
                                  validateField('debitAccount');
                                }, 0);
                              }

                              // Rule: Clear Special Commission if account changes at top level
                              if (addedSpecialCommissionValues) {
                                setAddedSpecialCommissionValues(null);
                              }
                            }
                          }}
                        />

                        <div>
                          <ErrorMessage
                            name="debitLedger"
                            component="div"
                            className="input-error-message text-danger"
                          />
                        </div>
                        <div>
                          <ErrorMessage
                            name="debitAccount"
                            component="div"
                            className="input-error-message text-danger"
                          />
                        </div>
                      </div>
                      {/* Credit Account Section */}
                      <div className="col-12 col-md-6 mb-45">
                        <CombinedInputs
                          label="Credit Account"
                          type1="select"
                          type2="select"
                          name1="creditLedger"
                          name2="creditAccount"
                          value1={values?.creditLedger}
                          value2={
                            values?.creditAccount ||
                            (newlyCreatedAccount?.id &&
                              newAccountTriggeredFrom === 'credit'
                              ? newlyCreatedAccount.id
                              : '')
                          }
                          options1={[
                            { label: 'PL', value: 'party' },
                            { label: 'GL', value: 'general' },
                            { label: 'WIC', value: 'walkin' },
                          ]}
                          options2={getAccountsByTypeOptions(
                            values?.creditLedger
                          )}

                          isDisabled={isDisabled}
                          handleBlur={handleBlur}
                          placeholder1="Ledger"
                          placeholder2="Account"
                          className1="ledger"
                          className2="account"
                          onChange1={(selected) => {
                            handleLedgerChange(
                              selected.value,
                              'creditLedger',
                              'creditAccount',
                              setSelectedCreditAccount
                            );
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
                              setNewAccountTriggeredFrom('credit');
                            } else if (selected.value === '') {
                              // Handle deselection - clear account field and state
                              setFieldValue('creditAccount', '');
                              setSelectedCreditAccount(null);
                            } else {
                              setFieldValue('creditAccount', selected.value);
                              // Track selected credit account for balance fetching
                              setSelectedCreditAccount({
                                value: selected.value,
                                label: selected.label,
                                accountType: values?.creditLedger,
                              });
                              // Show immediate validation if credit account is empty and credit ledger is filled
                              if (values?.creditLedger && !selected.value) {
                                setFieldTouched('creditAccount', true);
                                // Trigger validation to show the error immediately
                                setTimeout(() => {
                                  validateField('creditAccount');
                                }, 0);
                              }

                              // Rule: Clear Special Commission if account changes at top level
                              if (addedSpecialCommissionValues) {
                                setAddedSpecialCommissionValues(null);
                              }
                            }
                          }}
                        />

                        <div>
                          <ErrorMessage
                            name="creditLedger"
                            component="div"
                            className="input-error-message text-danger"
                          />
                        </div>
                        <div>
                          <ErrorMessage
                            name="creditAccount"
                            component="div"
                            className="input-error-message text-danger"
                          />
                        </div>
                      </div>
                      {/* Account Title */}
                      <div className="col-12 col-md-6 mb-45">
                        <SearchableSelect
                          name="accountTitle"
                          label="Account Title"
                          options={[
                            { label: 'Show', value: 'show' },
                            { label: 'Hide', value: 'hide' },
                          ]}
                          value={values?.accountTitle ? 
                            [{ label: values?.accountTitle === 'show' ? 'Show' : 'Hide', value: values?.accountTitle }] : 
                            []
                          }
                          onChange={(selected) =>
                            setFieldValue('accountTitle', selected.value)
                          }
                          onBlur={handleBlur}
                          placeholder="Show"
                          isDisabled={isDisabled}
                        />
                  
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-xxl-2"></div>
                  {!isDisabled && (
                    <div className="col-12 col-lg-10 col-xl-9 col-xxl-3">
                      <div className="row">
                        {getAccountBalanceSettings('currency_transfer') && (
                          <>
                            {selectedDebitAccount && (
                              <div
                                className="col-12 mb-2"
                                style={{ maxWidth: '350px' }}
                              >
                                <AccountBalanceCard
                                  heading="Debit Account Balance"
                                  accountName={selectedDebitAccount.label}
                                  balances={
                                    debitAccountBalance?.balances ||
                                    debitAccountBalance?.detail?.balances ||
                                    (Array.isArray(debitAccountBalance)
                                      ? debitAccountBalance
                                      : [])
                                  }
                                  loading={debitAccountBalance === undefined}
                                />
                              </div>
                            )}
                            {selectedCreditAccount && (
                              <div
                                className="col-12 mb-2"
                                style={{ maxWidth: '350px' }}
                              >
                                <AccountBalanceCard
                                  heading="Credit Account Balance"
                                  accountName={selectedCreditAccount.label}
                                  balances={
                                    creditAccountBalance?.balances ||
                                    creditAccountBalance?.detail?.balances ||
                                    (Array.isArray(creditAccountBalance)
                                      ? creditAccountBalance
                                      : [])
                                  }
                                  loading={creditAccountBalance === undefined}
                                />
                              </div>
                            )}
                          </>
                        )}
                        <div
                          className="col-12 mb-2"
                          style={{ maxWidth: '350px' }}
                        >
                          <ExchangeRatesCard
                            rates={
                              exchangeRatesData?.detail || exchangeRatesData
                            }
                            loading={isLoadingExchangeRates}
                            error={isErrorExchangeRates}
                            onInverseChange={setExchangeRatesInverse}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <CustomTable
                    displayCard={false}
                    headers={currencyTransferNewHeaders}
                    isPaginated={false}
                    className={'inputTable'}
                    hideSearch
                    hideItemsPerPage
                  >
                    <tbody>
                      {isLoadingBanks ||
                        isLoadingDocTypes ||
                        isLoadingCities ||
                        isLoadingCloneCT ||
                        Object.keys(rows).length === 0 ? (
                        // Show skeleton while essential data is loading or rows are not initialized
                        [1, 2, 3, 4].map((i) => (
                          <tr key={i}>
                            <td style={{ height: '78px' }}>
                              <Skeleton height={20} width={30} />
                            </td>
                            <td style={{ height: '78px' }}>
                              <Skeleton height={20} width={60} />
                            </td>
                            <td style={{ height: '78px' }}>
                              <Skeleton height={20} width={80} />
                            </td>
                            <td style={{ height: '78px' }}>
                              <Skeleton height={20} width={150} />
                            </td>
                            <td style={{ height: '78px' }}>
                              <Skeleton height={20} width={100} />
                            </td>
                            <td style={{ height: '78px' }}>
                              <Skeleton height={20} width={80} />
                            </td>
                            <td style={{ height: '78px' }}>
                              <Skeleton height={20} width={100} />
                            </td>
                            <td style={{ height: '78px' }}>
                              <Skeleton height={20} width={80} />
                            </td>
                            <td style={{ height: '78px' }}>
                              <Skeleton height={20} width={60} />
                            </td>
                            <td style={{ height: '78px' }}>
                              <Skeleton height={20} width={50} />
                            </td>
                          </tr>
                        ))
                      ) : isErrorCloneCT ? (
                        <tr>
                          <td colSpan={currencyTransferNewHeaders.length}>
                            <p className="text-danger mb-0">
                              Unable to fetch data at this time
                            </p>
                          </td>
                        </tr>
                      ) : isNullOrEmpty(
                        currencyTransferData?.currency_transfer?.details
                      ) && !!cloneCT ? (
                        <tr>
                          <td colSpan={currencyTransferNewHeaders.length}>
                            <p className="text-danger mb-0">
                              Currency Transfer Request {cloneCT} not found
                            </p>
                          </td>
                        </tr>
                      ) : (
                        Object.values(rows).map((row, index) => (
                          <CurrencyTransferRow
                            key={row.id}
                            row={row}
                            index={index}
                            isDisabled={isDisabled}
                            handleDeleteRow={handleDeleteRow}
                            updateField={updateField}
                            setShowMissingCurrencyRateModal={
                              setShowMissingCurrencyRateModal
                            }
                            setCurrencyToSelect={setCurrencyToSelect}
                            currencyOptions={currencyOptions}
                            date={date}
                            bankOptions={getBankOptions()}
                            docTypeOptions={getDocTypeOptions()}
                            cityOptions={getCityOptions()}
                            onRowAttachmentClick={handleRowAttachmentClick}
                            getRowAttachmentCount={getRowAttachmentCount}
                            fieldErrors={rowFieldErrors[row.id] || {}}
                            forceShowErrors={!!rowsTouched[row.id]}
                          />
                        ))
                      )}
                    </tbody>
                  </CustomTable>
                  {showSubmitError && (
                    <div className="text-danger mt-2">
                      Please add at least one row with currency and amount
                    </div>
                  )}
                  <div className="my-3 d-flex justify-content-between flex-wrap">
                    {/* Special Commission Button (following Account to Account pattern) */}
                    <div className="d-flex flex-column gap-3">
                      <CustomButton
                        text={
                          addedSpecialCommissionValues
                            ? 'Edit Special Commission'
                            : 'Add Special Commission'
                        }
                        variant="secondary"
                        disabled={isDisabled}
                        type="button"
                        className="w-auto px-5"
                        onClick={handleOpenSpecialCommissionModal}
                      />
                      {/* Display Special Commission Text */}
                      {!!addedSpecialCommissionValues ? (
                        <p
                          className={`fs-5 ${(typeof addedSpecialCommissionValues.commission_type ===
                            'string'
                            ? addedSpecialCommissionValues.commission_type
                            : addedSpecialCommissionValues.commission_type
                              ?.value
                          )?.toLowerCase() === 'income'
                            ? 'text-success'
                            : 'text-danger'
                            }`}
                        >
                          {addedSpecialCommissionValues?.commission}%{' '}
                          {(typeof addedSpecialCommissionValues.commission_type ===
                            'string'
                            ? addedSpecialCommissionValues.commission_type
                            : addedSpecialCommissionValues.commission_type
                              ?.value
                          )?.toLowerCase() === 'income'
                            ? 'receivable'
                            : 'payable'}{' '}
                          commission of{' '}
                          {
                            currencyOptions.find(
                              (x) =>
                                x.value ==
                                addedSpecialCommissionValues?.currency_id
                            )?.label
                          }{' '}
                          {formatNumberWithCommas(addedSpecialCommissionValues?.total_commission)} on{' '}
                          {
                            currencyOptions.find(
                              (x) =>
                                x.value ==
                                addedSpecialCommissionValues?.currency_id
                            )?.label
                          }{' '}
                          {formatNumberWithCommas(addedSpecialCommissionValues?.amount)}
                        </p>
                      ) : null}
                    </div>
                    {currencyTotals.length > 0 && (
                      <div className="d-card account-balance-card">
                        <table className="w-100">
                          <thead>
                            <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                              <th
                                style={{
                                  padding: '8px 0',
                                  color: '#6B7280',
                                  fontWeight: '500',
                                }}
                              >
                                Currency
                              </th>
                              <th
                                style={{
                                  padding: '8px 0',
                                  color: '#6B7280',
                                  fontWeight: '500',
                                }}
                              >
                                Net Total
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {currencyTotals.length > 0 ? (
                              currencyTotals.map((total, index) => (
                                <tr key={index}>
                                  <td style={{ padding: '8px 0' }}>
                                    {total.currency}
                                  </td>
                                  <td style={{ padding: '8px 0' }}>
                                    {total.net_total}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan="2"
                                  style={{
                                    padding: '8px 0',
                                    textAlign: 'center',
                                    color: '#6B7280',
                                  }}
                                >
                                  No currencies selected
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  <div>
                    <FileDisplayList
                      files={addedAttachments}
                      onRemoveFile={handleRemoveFile}
                    />
                  </div>
                  <div className="d-flex flex-wrap justify-content-between ">
                    <div className="d-inline-block mb-3">
                      <CustomCheckbox
                        label="Account Balance"
                        checked={getAccountBalanceSettings('currency_transfer')}
                        style={{ border: 'none', margin: 0 }}
                        onChange={(e) => {
                          updateAccountBalanceSetting(
                            'currency_transfer',
                            e.target.checked
                          );
                        }}
                        readOnly={isDisabled}
                      />
                      {hasPrintPermission && (
                        <CustomCheckbox
                          label="Print"
                          checked={getPrintSettings('currency_transfer')}
                          onChange={(e) => {
                            updatePrintSetting(
                              'currency_transfer',
                              e.target.checked
                            );
                          }}
                          style={{ border: 'none', margin: 0 }}
                          readOnly={isDisabled}
                        />
                      )}
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
          {
            text: 'Save',
            onClick: () => handleSubmit(),
          },

          { text: 'Add Rows', onClick: handleAddRows },
          { text: 'Cancel', onClick: handleCancel, variant: 'secondaryButton' },
        ]}
        loading={createCurrencyTransferMutation.isPending}
        onAttachmentClick={() => setUploadAttachmentsModal(true)}
        lastVoucherNumbers={lastVoucherNumbers}
        setPageState={setPageState}
        setSearchTerm={setSearchTerm}
      />
      {/* Upload Attachements Modal - Following Journal Voucher pattern */}
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

      {/* Row-level Attachments Modal - Using same structure as voucher attachments */}
      <CustomModal
        show={rowAttachmentsModal}
        close={() => {
          setRowAttachmentsModal(false);
          setSelectedRowId(null);
        }}
        background={true}
      >
        <AttachmentsView
          uploadOnly
          getUploadedFiles={handleRowAttachmentsUpload}
          closeUploader={() => {
            setRowAttachmentsModal(false);
            setSelectedRowId(null);
          }}
        />
      </CustomModal>

      {/* Special Commission Modal (following Account to Account pattern) */}
      <CustomModal
        show={showSCModal}
        close={() => setShowSCModal(false)}
        size="xl"
        closeOnOutsideClick={false}
      >
        <SpecialCommission
          preFilledValues={getSCValues()}
          sCValues={addedSpecialCommissionValues}
          isEdit={!!addedSpecialCommissionValues}
          isTwoLedgerVoucher={true}
          availableAccounts={getAvailableAccountsForSC()}
          availableCurrencies={getAvailableCurrenciesForSC()}
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
    </div>
  );
};

export default NewCurrencyTransfer;
