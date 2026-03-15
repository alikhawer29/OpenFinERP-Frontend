import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountBalanceCard from '../../../Components/AccountBalanceCard/AccountBalanceCard';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CustomButton from '../../../Components/CustomButton';
import CustomCheckbox from '../../../Components/CustomCheckbox/CustomCheckbox';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import ExchangeRatesCard from '../../../Components/ExchangeRatesCard/ExchangeRatesCard';

import Skeleton from 'react-loading-skeleton';
import CombinedInputs from '../../../Components/CombinedInputs/CombinedInputs';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import useAccountsByType from '../../../Hooks/useAccountsByType';
import { getAccountBalances, getCities, getDocTypes, getExchangeRates, pairReleased } from '../../../Services/General';

import {
  checkTransactionLockStatus,
  releaseTransaction,
} from '../../../Services/Process/TransactionLock.js';
import {
  addCurrencyTransferAttachment,
  deleteCurrencyTransferAttachment,
  getCTBanks,
  getCurrencyTransferListing,
  updateCurrencyTransfer,
} from '../../../Services/Transaction/CurrencyTransfer';
import useFormStore from '../../../Stores/FormStore';
import useSettingsStore from '../../../Stores/SettingsStore';
import { ledgerOptions } from '../../../Utils/Constants/SelectOptions.js';
import { currencyTransferNewHeaders } from '../../../Utils/Constants/TableHeaders';
import { showErrorToast } from '../../../Utils/Utils';
import { currencyTransferValidationSchema } from '../../../Utils/Validations/ValidationSchemas';
import SpecialCommission from '../SpecialCommission/SpecialCommission';
import CurrencyTransferRow from './CurrencyTransferRow';
import { formatNumberWithCommas } from '../../../Utils/Helpers.js';

// Generate initial rows with TMN as default currency (following NewCurrencyTransfer pattern)
const generateInitialRows = (count, currencyOptions = []) => {
  const rows = {};
  // Always prioritize TMN currency as default
  const tmnCurrency = currencyOptions.find((x) => x.label === 'TMN');
  const defaultCurrency = tmnCurrency
    ? tmnCurrency.value
    : currencyOptions[0]?.value || 'DHS';
  const defaultCurrencyId = tmnCurrency
    ? tmnCurrency.value
    : currencyOptions[0]?.value || null;

  Array.from({ length: count }).forEach(() => {
    const id = crypto.randomUUID();
    rows[id] = {
      id,
      currency: defaultCurrency,
      currency_id: defaultCurrencyId,
      rate: '',
      amount: '',
      lc_amount: '',
      narration: '',
      docType: '',
      docNo: '',
      bank: '',
      city: '',
      code: '',
      error: false,
    };
  });
  return rows;
};

const EditCurrencyTransfer = ({
  isDisabled = false,
  setIsDisabled,
  setShowAddLedgerModal,
  newlyCreatedAccount,
  setShowMissingCurrencyRateModal,
  showMissingCurrencyRateModal,
  lastVoucherNumbers,
  setCurrencyToSelect,
  currencyToSelect,
  currencyOptions = [],
  date,
  setPageState,
  searchTerm,
  onFormDataChange,
  restoreValuesFromStore,
  hasPrintPermission,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState({});
  const [currencyTotals, setCurrencyTotals] = useState([]);
  const [rowFieldErrors, setRowFieldErrors] = useState({});
  const [rowsTouched, setRowsTouched] = useState({});
  const [showSubmitError, setShowSubmitError] = useState(false);
  const formikRef = useRef();
  // Track if we are restoring from Special Commission to bypass loading UI
  const isRestoringRef = useRef(false);

  // Form store for handling navigation state (following TMN Currency Deal pattern)
  const {
    getFormValues,
    clearFormValues,
    saveFormValues,
    setLastVisitedPage,
    getLastVisitedPage,
    clearLastVisitedPage,
  } = useFormStore();
  const formId = 'currency-transfer'; // Unique identifier for this form (consistent with NewCurrencyTransfer and parent)
  const voucherName = 'currency_transfer_request';

  // Settings store
  const {
    getPrintSettings,
    updatePrintSetting,
    getAccountBalanceSettings,
    updateAccountBalanceSetting,
  } = useSettingsStore();

  // Attachment states
  const [addedAttachments, setAddedAttachments] = useState({});
  const [rowAttachments, setRowAttachments] = useState({});
  const [rowAttachmentsModal, setRowAttachmentsModal] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [currentFiles, setCurrentFiles] = useState([]); // Track current files for UI display
  const filesInitializedRef = useRef(false); // Track if files have been initialized

  // Account selection states (following NewCurrencyTransfer pattern)
  const [selectedDebitAccount, setSelectedDebitAccount] = useState(null);
  const [selectedCreditAccount, setSelectedCreditAccount] = useState(null);

  // Exchange rates state (following Receipt Voucher pattern)
  const [exchangeRatesInverse, setExchangeRatesInverse] = useState(false);

  // Special Commission state (following Account to Account pattern)
  const [addedSpecialCommissionValues, setAddedSpecialCommissionValues] =
    useState(null);
  const [showSCModal, setShowSCModal] = useState(false);
  const [scModalKey, setScModalKey] = useState(0);

  // Track previous rows for Special Commission sync rules
  const prevRowsRef = useRef({});

  // Get account options using custom hook (following Account to Account Edit pattern)
  const { getAccountsByTypeOptions } = useAccountsByType({
    includeBeneficiary: false,
    staleTime: 1000 * 60 * 5,
  });

  // Account tracking states for balance cards (following Account to Account Edit pattern)
  const [newAccountTriggeredFrom, setNewAccountTriggeredFrom] = useState('');

  // Track if initial server data has been loaded and state initialized
  const isInitializedRef = useRef(false);

  // Load existing Currency Transfer data
  const {
    data: { data: [currencyTransferData] = [] } = {},
    isLoading: isLoadingCurrencyTransfer,
    isError: isErrorCurrencyTransfer,
    error: errorCurrencyTransfer,
    isFetching: isFetchingCurrencyTransfer,
  } = useQuery({
    queryKey: ['currencyTransfer', searchTerm],
    queryFn: () => getCurrencyTransferListing({ search: searchTerm }),
    enabled: !!searchTerm,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
  });

  // Extract currency transfer data for easier access (following Account to Account Edit pattern)
  const currency_transfer = currencyTransferData?.currency_transfer;



  // Check Transaction lock status to enable/disable
  const { isLoading: isLoadingLockStatus, refetch: checkFormStatus } = useQuery(
    {
      queryKey: ['lock_status', voucherName, currencyTransferData?.id],
      queryFn: () =>
        checkTransactionLockStatus({
          transaction_type: voucherName,
          transaction_id: currencyTransferData?.id,
        }),
      enabled: false,
      retry: false,
    }
  );

  // Release lock on unmount or cancel
  const releaseExecutedRef = useRef(false);
  const releaseTransactionMutation = useMutation({
    mutationFn: releaseTransaction,
  });
  const releaseLock = React.useCallback(() => {
    if (releaseExecutedRef.current) return;
    if (currencyTransferData?.id) {
      releaseTransactionMutation.mutate({
        transaction_type: voucherName,
        transaction_id: currencyTransferData?.id,
      });
      releaseExecutedRef.current = true;
    }
  }, [currencyTransferData?.id]);
  // Avoid releasing immediately on mount in React 18 StrictMode by deferring cleanup
  const ignoreCleanupRef = useRef(true);
  useEffect(() => {
    const timeout = setTimeout(() => {
      ignoreCleanupRef.current = false;
    }, 0);
    return () => {
      clearTimeout(timeout);
      if (!ignoreCleanupRef.current) {
        releaseLock();
      }
    };
  }, [releaseLock]);

  // Fetch account balances (following NewCurrencyTransfer pattern)
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

  // Load banks data (following NewCurrencyTransfer pattern)
  const {
    data: banksData,
    isLoading: isLoadingBanks,
    isError: isErrorBanks,
    error: errorBanks,
  } = useQuery({
    queryKey: ['banks'],
    queryFn: getCTBanks,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // Load doc types data (following NewCurrencyTransfer pattern)
  const {
    data: docTypesData,
    isLoading: isLoadingDocTypes,
    isError: isErrorDocTypes,
    error: errorDocTypes,
  } = useQuery({
    queryKey: ['docTypes'],
    queryFn: getDocTypes,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // Load cities data (following NewCurrencyTransfer pattern)
  const {
    data: citiesData,
    isLoading: isLoadingCities,
    isError: isErrorCities,
    error: errorCities,
  } = useQuery({
    queryKey: ['cities'],
    queryFn: getCities,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // Check if data is missing after loading
  const isDataMissing = !isLoadingCurrencyTransfer && !isFetchingCurrencyTransfer && !currency_transfer;
  const isError = isErrorCurrencyTransfer || isErrorBanks || isErrorDocTypes || isErrorCities;

  // Update Currency Transfer mutation
  const updateCurrencyTransferMutation = useMutation({
    mutationFn: ({ id, payload }) => updateCurrencyTransfer(id, payload),
    onSuccess: (data) => {
      showToast('Currency Transfer updated successfully!', 'success');
      // Print if enabled and PDF URL is available (following NewCurrencyTransfer pattern)
      if (hasPrintPermission && getPrintSettings('currency_transfer') && data?.detail?.pdf_url) {
        window.open(data.detail.pdf_url, '_blank');
      }
      // Invalidate both listing and specific record queries to refresh row attachments
      queryClient.invalidateQueries(['currencyTransfer', searchTerm]);
      queryClient.invalidateQueries([
        'currencyTransfer',
        currencyTransferData?.currency_transfer?.id,
      ]);
      // Force refetch to ensure fresh data with new attachments
      queryClient.refetchQueries(['currencyTransfer', searchTerm]);
      // Clear attachment tracking after successful update
      setAddedAttachments({});
      setRowAttachments({});
      setPageState('view');
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });



  // Set selected accounts when data loads (following Account to Account Edit pattern)
  useEffect(() => {
    if (currency_transfer?.debit_account_details?.id) {
      setSelectedDebitAccount({
        value: currency_transfer.debit_account_details.id,
        label: currency_transfer.debit_account_details.title,
        accountType: currency_transfer.debit_account_ledger,
      });
    }
    if (currency_transfer?.credit_account_details?.id) {
      setSelectedCreditAccount({
        value: currency_transfer.credit_account_details.id,
        label: currency_transfer.credit_account_details.title,
        accountType: currency_transfer.credit_account_ledger,
      });
    }
  }, [
    currency_transfer?.debit_account_details?.id,
    currency_transfer?.credit_account_details?.id,
  ]);

  // Handle newly created accounts (following Account to Account Edit pattern)
  useEffect(() => {
    if (newlyCreatedAccount?.id && formikRef.current) {
      if (newAccountTriggeredFrom === 'debit') {
        formikRef.current.setFieldValue('debitAccount', newlyCreatedAccount.id);
        setSelectedDebitAccount({
          value: newlyCreatedAccount.id,
          label: newlyCreatedAccount.title,
          accountType: formikRef.current.values.debitLedger,
        });
      } else if (newAccountTriggeredFrom === 'credit') {
        formikRef.current.setFieldValue(
          'creditAccount',
          newlyCreatedAccount.id
        );
        setSelectedCreditAccount({
          value: newlyCreatedAccount.id,
          label: newlyCreatedAccount.title,
          accountType: formikRef.current.values.creditLedger,
        });
      }
      setNewAccountTriggeredFrom('');
    }
  }, [newlyCreatedAccount]);

  // Initialize form data from existing Currency Transfer (following Account to Account Edit pattern)
  useEffect(() => {
    if (
      !isInitializedRef.current &&
      currency_transfer &&
      !restoreValuesFromStore &&
      !isRestoringRef.current
    ) {
      if (
        currency_transfer.details &&
        Array.isArray(currency_transfer.details) &&
        currency_transfer.details.length > 0
      ) {
        const initialRows = {};
        currency_transfer.details.forEach((detail) => {
          const rowId = detail.id || crypto.randomUUID();
          const currencyOption = currencyOptions.find(
            (opt) =>
              opt.value === detail.currency_id ||
              opt.label === detail.currency?.currency_code ||
              opt.label === detail.currency?.label
          );

          initialRows[rowId] = {
            id: rowId,
            currency: currencyOption?.value || detail.currency_id || '',
            currency_id: detail.currency_id || '',
            rate: detail.rate || '',
            amount: detail.amount || '',
            lc_amount: detail.lc_amount || '',
            narration: detail.narration || '',
            docType: detail.doc_type?.id || detail.doc_type_id || '',
            docNo: detail.doc_no || '',
            bank: detail.bank?.id || detail.bank_id || '',
            city: detail.city?.id || detail.city_id || '',
            code: detail.code || '',
            error: false,
          };
        });
        setRows(initialRows);
        setIsDisabled(false);
      }

      // Initialize Special Commission
      if (currency_transfer.special_commission) {
        const getLedgerName = (ledgerType) => {
          const ledgerMap = { party: 'PL', general: 'GL', walkin: 'WIC' };
          return ledgerMap[ledgerType] || ledgerType;
        };
        const sc = currency_transfer.special_commission;
        const scData = {
          ...sc,
          currency_id: sc.currency_id || sc.currency?.id || sc.amount_type?.id,
          ledger: sc.account_type,
          ledger_name: getLedgerName(sc.account_type),
          distributions: Array.isArray(sc.commission_distribution) ? [...sc.commission_distribution] : [],
        };
        delete scData.commission_distribution;
        setAddedSpecialCommissionValues(scData);
        saveFormValues('special-commission', scData);
      }

      // Initialize current files from currency transfer data only once
      if (!filesInitializedRef.current) {
        const filesData = currency_transfer.files || currencyTransferData?.files || [];
        setCurrentFiles(filesData);
        filesInitializedRef.current = true;
      }

      // Mark as initialized after all settings are applied
      isInitializedRef.current = true;
    }
  }, [
    currency_transfer,
    restoreValuesFromStore,
    currencyOptions,
    formId,
    saveFormValues,
    isLoadingCurrencyTransfer,
    isFetchingCurrencyTransfer,
  ]);



  // Special Commission uses modal - no navigation restoration needed (following Account to Account pattern)

  // Notify parent of form data changes (for saving before navigation) (following NewCurrencyTransfer pattern)
  useEffect(() => {
    // DO NOT notify parent if we are restoring, loading, or if initial data has not been settled
    if (isRestoringRef.current || isLoadingCurrencyTransfer || isFetchingCurrencyTransfer || !isInitializedRef.current) {
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
    isLoadingCurrencyTransfer,
    isFetchingCurrencyTransfer,
  ]);

  // Handle navigation from Rate of Exchange page (following Account to Account pattern)
  useEffect(() => {
    const lastPage = getLastVisitedPage(formId);
    if (lastPage === 'remittanceRateOfExchange') {
      const savedFormData = getFormValues(formId);
      if (savedFormData) {
        // Set page state to edit and enable the form
        setPageState('edit');
        setIsDisabled(false);
        // The parent will handle setting restoreValuesFromStore
      }
    }
  }, []);

  // Restore form data from store for Rate of Exchange flow (following Account to Account pattern)
  useEffect(() => {
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
        isInitializedRef.current = true;
        // Add a small flag to the saved data to indicate it was successfully restored
        savedFormData.restored = true;

        // Reset the flag after a delay
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 500);

        clearFormValues(formId);
        clearLastVisitedPage(formId);
      }
    }
  }, [restoreValuesFromStore]);

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

  // Create initial values from API data (following Account to Account Edit pattern)
  const initialValues = useMemo(() => ({
    debitLedger: currency_transfer?.debit_account_ledger || '',
    debitAccount: currency_transfer?.debit_account_details?.id || '',
    creditLedger: currency_transfer?.credit_account_ledger || '',
    creditAccount: currency_transfer?.credit_account_details?.id || '',
    account_title: currency_transfer?.account_title || 'show',
  }), [currency_transfer]);

  // Row-level attachment functions (following New page pattern)
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

  // Handle voucher-level attachment uploads (for new attachments in edit mode)
  const handleVoucherAttachmentsUpload = (files) => {
    // Update the addedAttachments state with new files
    setAddedAttachments((prev) => ({
      ...prev,
      ...files,
    }));
    showToast('Attachments will be uploaded when voucher is updated', 'success');
    setShowAttachmentsModal(false);
  };

  // Handle attachment deletion in deferred mode
  const handleDeletedAttachments = (attachmentId) => {
    setCurrentFiles((prev) => prev.filter((f) => f.id !== attachmentId));
  };

  const getRowAttachmentCount = (rowId) => {
    // For Edit page, show attachments from API data plus any newly added attachments
    const rowDetail = currencyTransferData?.currency_transfer?.details?.find(
      (detail) => detail.id === rowId
    );
    const existingCount = rowDetail?.attachments_count || 0;
    const newAttachmentsCount = Array.isArray(rowAttachments[rowId])
      ? rowAttachments[rowId].length
      : rowAttachments[rowId]
        ? Object.keys(rowAttachments[rowId]).length
        : 0;

    return existingCount + newAttachmentsCount;
  };

  // Form submission handler (following TMN Currency Deal Edit pattern)
  const handleSubmit = async () => {
    if (!formikRef.current) return;

    // Validate the form
    const errors = await formikRef.current.validateForm();
    if (Object.keys(errors).length > 0) {
      formikRef.current.setTouched(
        Object.keys(errors).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {})
      );
      return;
    }

    // Check for any rows with errors
    if (Object.keys(rowFieldErrors).length > 0) {
      setRowsTouched((prev) => {
        const allTouched = {};
        Object.keys(rows).forEach((id) => (allTouched[id] = true));
        return allTouched;
      });
      setShowSubmitError(true);
      return;
    }
    // run status check first
    const { error: errorLockStatus } = await checkFormStatus();

    if (errorLockStatus?.detail?.locked) {
      showToast(errorLockStatus?.message, 'warn');
      return;
    }

    const formValues = formikRef.current.values;

    // Prepare table data from rows - filter out empty rows based on new validation rules
    const rowIds = Object.keys(rows);
    let validRows = [];

    rowIds.forEach((rowId, index) => {
      const row = rows[rowId];
      const isFirstRow = index === 0;

      // For rows other than the first, check if any field other than currency is filled
      const otherFieldsHaveData = row.amount || row.narration || row.docType || row.docNo || row.bank || row.city || row.code;

      // For first row OR any row with other data, it must have BOTH currency and amount to be valid
      if (isFirstRow || otherFieldsHaveData) {
        if (row.currency_id && row.amount) {
          validRows.push(row);
        }
      }
    });

    if (validRows.length === 0) {
      setShowSubmitError(true);
      return;
    }

    // Transform rows data to match API structure
    const details = {};
    validRows.forEach((row, index) => {
      if (row.currency_id)
        details[`details[${index}][currency_id]`] = row.currency_id;
      if (row.amount) details[`details[${index}][amount]`] = parseFloat(row.amount);
      if (row.narration)
        details[`details[${index}][narration]`] = row.narration;
      if (row.docType) details[`details[${index}][doc_type_id]`] = row.docType;
      if (row.docNo) details[`details[${index}][doc_no]`] = row.docNo;
      if (row.bank) details[`details[${index}][bank_id]`] = row.bank;
      if (row.city) details[`details[${index}][city_id]`] = row.city;
      if (row.code) details[`details[${index}][code]`] = row.code;

      // Add row-level attachments (only new attachments, existing ones are already saved)
      const rowAttachmentFiles = rowAttachments[row.id] || [];

      if (Array.isArray(rowAttachmentFiles) && rowAttachmentFiles.length > 0) {
        rowAttachmentFiles.forEach((file, fileIndex) => {
          details[`details[${index}][files][${fileIndex}]`] = file;
        });
      } else if (rowAttachmentFiles && typeof rowAttachmentFiles === 'object') {
        // Handle object format from AttachmentsView
        const fileValues = Object.values(rowAttachmentFiles);
        fileValues.forEach((file, fileIndex) => {
          details[`details[${index}][files][${fileIndex}]`] = file;
        });
      }
    });

    // Prepare the payload
    const payload = {
      date: formValues.date || date,
      debit_account_ledger: formValues.debitLedger,
      debit_account_id: formValues.debitAccount,
      credit_account_ledger: formValues.creditLedger,
      credit_account_id: formValues.creditAccount,
      ...details,
      ...addedAttachments,
    };

    // Include account_title in payload with the actual selected value
    if (formValues?.account_title) {
      payload.account_title = formValues.account_title;
    }

    // Add Special Commission data if available (following Account to Account Edit pattern)
    if (addedSpecialCommissionValues) {
      // Flatten the SC object
      const converted = {};
      const scCurrencyId = addedSpecialCommissionValues.currency_id;

      // Calculate total amount for the SC currency across valid rows
      const totalAmountForSCCurrency = validRows
        .filter((row) => row.currency_id === scCurrencyId)
        .reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);

      const sc = {
        transaction_no: lastVoucherNumbers?.current || lastVoucherNumbers?.last || '',
        date,
        ledger: formValues.debitLedger, // Use string value, not object
        account_id: formValues.debitAccount,
        currency_id: scCurrencyId,
        amount: totalAmountForSCCurrency,
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
        } else if (key === 'ledger' && typeof sc[key] === 'object' && sc[key] !== null) {
          // Skip the ledger object, use the string value instead
          converted[`special_commission[${key}]`] = formValues.debitLedger;
        } else if (key === 'account' && typeof sc[key] === 'object' && sc[key] !== null) {
          // Skip the account object, already have account_id
          continue;
        } else if (key === 'currency' && typeof sc[key] === 'object' && sc[key] !== null) {
          // Skip the currency object, already have currency_id
          continue;
        } else if (key === 'commission_type') {
          // Handle commission_type - extract value if object, otherwise use as-is
          let ctValue = typeof sc[key] === 'object' && sc[key] !== null
            ? sc[key]?.value || 'Expense'
            : sc[key] || 'Expense';

          // Capitalize first letter (expense -> Expense, income -> Income)
          ctValue = ctValue.charAt(0).toUpperCase() + ctValue.slice(1).toLowerCase();

          converted[`special_commission[${key}]`] = ctValue;
        } else if (typeof sc[key] === 'object' && sc[key] !== null && !Array.isArray(sc[key])) {
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
    handlePairReleased();
    // Submit the update
    updateCurrencyTransferMutation.mutate({
      id: currencyTransferData?.voucher_no,
      payload,
    });
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
      .map((row) => row?.currency_id)
      .filter((item) => item?.currency_id !== '');
    // Remove duplicates
    const uniquePairIds = [...new Set(pairIds)];

    // Release each pair_id
    uniquePairIds.forEach((pairId) => {
      pairReleasedMutation.mutate(pairId);
    });
  };

  // Cancel handler
  const handleCancel = () => {
    handlePairReleased()
    releaseLock();
    // Reset files to original state and allow re-initialization
    filesInitializedRef.current = false;
    if (currencyTransferData?.currency_transfer?.files || currencyTransferData?.files) {
      setCurrentFiles(currencyTransferData?.currency_transfer?.files || currencyTransferData?.files || []);
    } else {
      setCurrentFiles([]);
    }
    setPageState('view');
  };

  // Add rows handler (following NewCurrencyTransfer pattern)
  const handleAddRows = () => {
    const newRows = generateInitialRows(4, currencyOptions);
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
    const validRows = Object.values(rows).filter((row) => {
      return row.currency_id && row.amount && !isNaN(parseFloat(row.amount));
    });
    const firstValidRow = validRows.length > 0 ? validRows[0] : null;

    // When editing, use existing SC values for currency if available, otherwise use first valid row
    const scCurrencyId = addedSpecialCommissionValues?.currency_id || firstValidRow?.currency_id;

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
    const commissionTypeValue = addedSpecialCommissionValues?.commission_type || 'Expense';

    // Prepare Special Commission values
    const ledgerOption = formikRef?.current?.values
      ? ledgerOptions.find(
        (x) => x.value === formikRef.current.values.debitLedger
      )
      : null;

    // Calculate derived total commission to ensure consistency
    const commPct = parseFloat(addedSpecialCommissionValues?.commission) || 0;
    const derivedTotalCommission = (scAmount * commPct) / 100;

    return {
      date: date,
      transaction_no: lastVoucherNumbers?.current || lastVoucherNumbers?.last || '',
      // Spread existing values first
      ...addedSpecialCommissionValues,
      // Then override with properly formatted select options (these must come AFTER the spread)
      account:
        formikRef?.current?.values
          ? getAccountsByTypeOptions(formikRef.current.values.debitLedger).find(
            (x) => x.value === formikRef.current.values.debitAccount
          ) || ''
          : '',
      currency:
        currencyOptions.find((x) => x.value === scCurrencyId) || '',
      amount: scAmount,
      // Ensure currency_id is set for the backend
      currency_id: scCurrencyId,
      ledger: ledgerOption || '',
      ledger_name: ledgerOption?.label || '',
      commission_type:
        commissionTypeOptions.find(
          (x) => x.value.toLowerCase() === commissionTypeValue.toLowerCase()
        ) || commissionTypeOptions[0],
      // Explicitly pass calculated values to prevent zero/empty inputs
      commission: commPct.toFixed(2),
      total_commission: derivedTotalCommission.toFixed(2),
      // Ensure distributions is explicitly passed if it exists in addedSpecialCommissionValues
      distributions: addedSpecialCommissionValues?.distributions || [],
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
        formikRef.current.values.creditLedger
      ).find((x) => x.value === formikRef.current.values.creditAccount);
      if (creditAccount) {
        accounts.push({
          label: creditAccount.label,
          value: creditAccount.value,
          ledgerType: formikRef.current.values.creditLedger,
          ledgerLabel:
            ledgerOptions.find(
              (x) => x.value === formikRef.current.values.creditLedger
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
      (field) => !formikRef.current.values[field]
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
    const validRows = Object.values(rows).filter((row) => {
      return row.currency_id && row.amount && !isNaN(parseFloat(row.amount));
    });

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

    // Increment key to force remount of SpecialCommission component
    // This ensures Formik initializes with fresh values
    setScModalKey((prev) => prev + 1);

    // Open the modal
    setShowSCModal(true);
  };

  // Helper functions to transform data into options (following NewCurrencyTransfer pattern)
  const getBankOptions = () => {
    if (isLoadingBanks) {
      return [{ label: 'Loading...', value: null, isDisabled: true }];
    }
    if (isErrorBanks) {
      console.error('Unable to fetch banks', errorBanks);
      return [{ label: 'Unable to fetch banks', value: null }];
    }
    return (
      banksData?.map((x) => ({
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
      console.error('Unable to fetch document types', errorDocTypes);
      return [{ label: 'Unable to fetch document types', value: null }];
    }
    return (
      docTypesData?.map((x) => ({
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
      console.error('Unable to fetch cities', errorCities);
      return [{ label: 'Unable to fetch cities', value: null }];
    }
    return (
      citiesData?.map((x) => ({
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
        const currencyLabel =
          currencyOptions.find((c) => c.value === row.currency)?.label ||
          row.currency;
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
    // Also skip if we are still loading or if data has not been settled to prevent partial clearing
    if (!addedSpecialCommissionValues || isRestoringRef.current || isLoadingCurrencyTransfer || isFetchingCurrencyTransfer || !isInitializedRef.current) {
      if (Object.keys(rows).length > 0) {
        prevRowsRef.current = rows;
      }
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
      // Only re-calculate if the total amount has actually changed to avoid infinite loops or unnecessary updates
      // Using a small epsilon for float comparison
      else {
        const currentSCAmount = parseFloat(addedSpecialCommissionValues.amount) || 0;
        if (Math.abs(totalAmountForCurrency - currentSCAmount) > 0.000001) {
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
    }

    // Update ref for next comparison
    prevRowsRef.current = rows;
  }, [rows, addedSpecialCommissionValues, isLoadingCurrencyTransfer]);

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

  const handleDeleteRow = (id) => {
    setRows((prevRows) => {
      const newState = { ...prevRows };
      delete newState[id];
      return newState;
    });
  };

  return (
    <>
      <div className="d-card">
        <Formik
          innerRef={formikRef}
          initialValues={initialValues}
          validationSchema={currencyTransferValidationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({
            values,
            errors,
            touched,
            handleBlur,
            setFieldValue,
            setFieldTouched,
            validateField,
          }) => {
            // Helper function to handle account loading (following Account to Account pattern)
            const handleLedgerChange = (
              ledgerType,
              fieldName,
              setAccountField,
              accountSetter
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
                      {/* Debit Account Section (following NewCurrencyTransfer pattern) */}
                      <div className="col-12 col-sm-6 mb-45">
                        <CombinedInputs
                          label="Debit Account"
                          type1="select"
                          type2="select"
                          name1="debitLedger"
                          name2="debitAccount"
                          value1={values.debitLedger}
                          value2={
                            values.debitAccount ||
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
                            values.debitLedger
                          )}
                          isDisabled={isDisabled}
                          handleBlur={handleBlur}
                          placeholder1="Ledger"
                          placeholder2="Select Account"
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
                              setNewAccountTriggeredFrom('debit');
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
                                accountType: values.debitLedger,
                              });
                              // Show immediate validation if debit account is empty and debit ledger is filled
                              if (values.debitLedger && !selected.value) {
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
                          onBlur1={handleBlur}
                          onBlur2={handleBlur}
                          error1={errors.debitLedger && touched.debitLedger}
                          error2={errors.debitAccount && touched.debitAccount}
                          disabled={isDisabled}
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

                      {/* Credit Account Section (following NewCurrencyTransfer pattern) */}
                      <div className="col-12 col-sm-6 mb-45">
                        <CombinedInputs
                          label="Credit Account"
                          type1="select"
                          type2="select"
                          name1="creditLedger"
                          name2="creditAccount"
                          value1={values.creditLedger}
                          value2={
                            values.creditAccount ||
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
                            values.creditLedger
                          )}
                          isDisabled={isDisabled}
                          handleBlur={handleBlur}
                          placeholder1="Ledger"
                          placeholder2="Select Account"
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
                                accountType: values.creditLedger,
                              });
                              // Show immediate validation if credit account is empty and credit ledger is filled
                              if (values.creditLedger && !selected.value) {
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
                          onBlur1={handleBlur}
                          onBlur2={handleBlur}
                          error1={errors.creditLedger && touched.creditLedger}
                          error2={errors.creditAccount && touched.creditAccount}
                          disabled={isDisabled}
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

                      {/* Account Title (following Account to Account Edit pattern) */}
                      <div className="col-12 col-sm-6 mb-45">
                        <SearchableSelect
                          name="account_title"
                          label="Account Title"
                          options={[
                            { label: 'Show', value: 'show' },
                            { label: 'Hide', value: 'hide' },
                          ]}
                          value={values.account_title}
                          onChange={(selected) =>
                            setFieldValue('account_title', selected.value)
                          }
                          onBlur={handleBlur}
                          error={errors.account_title && touched.account_title}
                          disabled={isDisabled}
                          placeholder="Select Title"
                        />
                      </div>
                      
                    </div>
                  </div>
                  {!isDisabled && (
                    <div className="col-12 col-lg-10 col-xl-3 col-xxl-3">
                      <div className="row">
                        {/* Account Balance Cards - show if setting is enabled (following InternalPaymentVoucher pattern) */}
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

                        {/* Exchange Rates Card (following Receipt Voucher pattern) */}
                        <div className="col-12 mb-2" style={{ maxWidth: '350px' }}>
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
                      {((isLoadingBanks ||
                        isLoadingDocTypes ||
                        isLoadingCities ||
                        isLoadingCurrencyTransfer) &&
                        Object.keys(rows).length === 0)
                        ? // Show skeleton while essential data is loading or rows are not initialized
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
                        : Object.values(rows).map((row, index) => (
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
                            // Row-level attachment props
                            onRowAttachmentClick={handleRowAttachmentClick}
                            getRowAttachmentCount={getRowAttachmentCount}
                            fieldErrors={rowFieldErrors[row.id] || {}}
                            forceShowErrors={!!rowsTouched[row.id]}
                          />
                        ))}
                      {(isDataMissing || isError) && (
                        <tr>
                          <td colSpan={currencyTransferNewHeaders.length} className="text-center py-5">
                            <p className="text-danger mb-0">
                              {isError ? 'Unable to fetch data at this time' : `Currency Transfer Request ${searchTerm} not found`}
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </CustomTable>
                  {showSubmitError && (
                    <div className="text-danger mt-2">
                      Please add at least one row with currency and amount
                    </div>
                  )}

                  {/* Special Commission Section (following TMN Currency Deal pattern) */}
                  <div className="my-3 d-flex justify-content-between flex-wrap">
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
                      {!!addedSpecialCommissionValues ? (
                        <p
                          className={`fs-5 ${(addedSpecialCommissionValues.commission_type?.toLowerCase() === 'income' || addedSpecialCommissionValues.commission_type === 'Income')
                            ? 'text-success'
                            : 'text-danger'
                            }`}
                        >
                          {addedSpecialCommissionValues.commission}%{' '}
                          {(addedSpecialCommissionValues.commission_type?.toLowerCase() === 'income' || addedSpecialCommissionValues.commission_type === 'Income')
                            ? 'receivable'
                            : 'payable'}{' '}
                          commission of{' '}
                          {
                            currencyOptions.find(
                              (x) =>
                                x.value ==
                                addedSpecialCommissionValues.currency_id
                            )?.label
                          }{' '}
                          {formatNumberWithCommas(addedSpecialCommissionValues.total_commission)} on{' '}
                          {
                            currencyOptions.find(
                              (x) =>
                                x.value ==
                                addedSpecialCommissionValues.currency_id
                            )?.label
                          }{' '}
                          {formatNumberWithCommas(addedSpecialCommissionValues.amount)}
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

                  <div className="d-flex flex-wrap justify-content-between mt-3 mb-5">
                    <div className="d-inline-block mt-3">
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
        actionButtons={[
          { text: 'Add Rows', onClick: handleAddRows },
          {
            text: 'Update',
            onClick: handleSubmit,
            
            loading: isLoadingLockStatus || updateCurrencyTransferMutation.isPending,
          },
          { text: 'Cancel', onClick: handleCancel, variant: 'secondaryButton' },
        ]}
        onAttachmentClick={() => setShowAttachmentsModal(true)}
        lastVoucherNumbers={lastVoucherNumbers}
      />

      {/* Voucher Attachments Modal - Edit mode allows both viewing and uploading */}
      <CustomModal
        show={showAttachmentsModal}
        close={() => setShowAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          showModal={showAttachmentsModal}
          closeModal={() => setShowAttachmentsModal(false)}
          item={currencyTransferData}
          deleteService={deleteCurrencyTransferAttachment}
          uploadService={addCurrencyTransferAttachment}
          getUploadedFiles={handleVoucherAttachmentsUpload}
          getDeletedAttachments={handleDeletedAttachments}
          closeUploader={() => setShowAttachmentsModal(false)}
          voucherAttachment={true}
          queryToInvalidate={['currencyTransfer', searchTerm]}
          deferredMode={true}
          currentFiles={currentFiles}
          setCurrentFiles={setCurrentFiles}
        />
      </CustomModal>

      {/* Row-level Attachments Modal - Edit mode allows both viewing and uploading */}
      <CustomModal
        show={rowAttachmentsModal}
        close={() => {
          setRowAttachmentsModal(false);
          setSelectedRowId(null);
        }}
        background={true}
      >
        <AttachmentsView
          showModal={rowAttachmentsModal}
          closeModal={() => {
            setRowAttachmentsModal(false);
            setSelectedRowId(null);
          }}
          item={{
            id: selectedRowId,
            files: [
              // Existing attachments from API
              ...(currencyTransferData?.currency_transfer?.details?.find(
                (detail) => detail.id === selectedRowId
              )?.files || []),
              // Newly added attachments from local state
              ...(Array.isArray(rowAttachments[selectedRowId])
                ? rowAttachments[selectedRowId]
                : rowAttachments[selectedRowId]
                  ? Object.values(rowAttachments[selectedRowId])
                  : []),
            ],
            title: `Transaction Row Attachments`,
          }}
          getUploadedFiles={handleRowAttachmentsUpload}
          closeUploader={() => {
            setRowAttachmentsModal(false);
            setSelectedRowId(null);
          }}
          // Enable both viewing and uploading in edit mode
          viewOnly={isDisabled}
          uploadOnly={false}
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
          key={`sc-modal-${scModalKey}`}
          preFilledValues={getSCValues()}
          sCValues={addedSpecialCommissionValues}
          isEdit={!!addedSpecialCommissionValues}
          isTwoLedgerVoucher={true}
          availableCurrencies={getAvailableCurrenciesForSC()}
          availableAccounts={getAvailableAccountsForSC()}
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
    </>
  );
};

export default EditCurrencyTransfer;
