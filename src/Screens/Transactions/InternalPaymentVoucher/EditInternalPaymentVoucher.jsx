import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { useCallback, useEffect, useRef, useState } from 'react';
import AccountBalanceCard from '../../../Components/AccountBalanceCard/AccountBalanceCard';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CombinedInputs from '../../../Components/CombinedInputs/CombinedInputs';
import CustomButton from '../../../Components/CustomButton';
import CustomCheckbox from '../../../Components/CustomCheckbox/CustomCheckbox';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import ExchangeRatesCard from '../../../Components/ExchangeRatesCard/ExchangeRatesCard';
import FileDisplayList from '../../../Components/FileDisplayList/FileDisplayList';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast.jsx';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import useCurrencyRate from '../../../Hooks/useCurrencyRate';
import {
  getAccountBalances,
  getExchangeRates,
  pairReleased,
} from '../../../Services/General.js';
import { getCostCenterRegisterListing } from '../../../Services/Masters/CostCenterRegister.js';
import {
  checkTransactionLockStatus,
  releaseTransaction,
} from '../../../Services/Process/TransactionLock.js';
import {
  addInternalPaymentVoucherAttachment,
  deleteInternalPaymentVoucherAttachment,
  getCOAAccountsbyMode,
  getInternalPaymentVoucherAttachment,
  getInternalPaymentVoucherListing,
  updateInternalPaymentVoucher,
} from '../../../Services/Transaction/InternalPaymentVoucher.js';
import { getChequeNumberByBank } from '../../../Services/Transaction/JournalVoucher.js';
import { getVATType } from '../../../Services/Transaction/PaymentVoucher.js';
import useFormStore from '../../../Stores/FormStore.js';
import useSettingsStore from '../../../Stores/SettingsStore.js';
import { internalPaymentVoucherHeaders } from '../../../Utils/Constants/TableHeaders';
import { isNullOrEmpty, showErrorToast } from '../../../Utils/Utils.jsx';
import InternalPaymentVoucherRow from './InternalPaymentVoucherRow';

const EditInternalPaymentVoucher = ({
  setPageState,
  setShowAddLedgerModal,
  setUploadAttachmentsModal,
  lastVoucherNumbers,
  accountData,
  currencyOptions,
  date,
  setDate,
  searchTerm,
  isDisabled,
  setIsDisabled,
  updatePrintSetting,
  getAccountsByTypeOptions,
  onFormDataChange,
  permissions,
  hasEditPermission,
  hasDeletePermission,
  hasPrintPermission,
  restoreValuesFromStore,
  setCurrencyToSelect,
  setShowMissingCurrencyRateModal,
}) => {
  const formikRef = useRef();
  const [rows, setRows] = useState([]);
  const [showVatOutOfScopeModal, setShowVatOutOfScopeModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [dueDate, setDueDate] = useState('');
  const [isDueDateEditable, setIsDueDateEditable] = useState(false);
  const [rowFieldErrors, setRowFieldErrors] = useState({});
  const [rowsTouched, setRowsTouched] = useState({});

  const [totalNetTotal, setTotalNetTotal] = useState(0);
  const [outOfScope, setOutOfScope] = useState('');
  const [currentRowForVat, setCurrentRowForVat] = useState(null);
  const {
    getPrintSettings,
    getAccountBalanceSettings,
    updateAccountBalanceSetting,
  } = useSettingsStore();
  const [addedAttachments, setAddedAttachments] = useState({});
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [deletedAttachments, setDeletedAttachments] = useState([]); // Track IDs of attachments to delete
  const [currentFiles, setCurrentFiles] = useState([]); // Track current files for UI display
  const filesInitializedRef = useRef(false); // Track if files have been initialized

  // State for selected accounts and balances
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState(null);
  const [selectedModeAccount, setSelectedModeAccount] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [exchangeRatesInverse, setExchangeRatesInverse] = useState(false);
  const [isChequeFieldEnabled, setIsChequeFieldEnabled] = useState(false);
  const [currentMode, setCurrentMode] = useState('');
  const [selectedGLType, setSelectedGLType] = useState(null);
  const [hasShownModal, setHasShownModal] = useState(false);

  const queryClient = useQueryClient();

  const { clearFormValues, getFormValues } = useFormStore();
  const formId = 'edit-internal-payment-voucher';
  const voucherName = 'internal_payment_voucher';

  // Restore form data from store for Rate of Exchange flow
  useEffect(() => {
    if (restoreValuesFromStore) {
      const savedFormData = getFormValues(formId);
      if (savedFormData && formikRef.current) {
        formikRef.current.setValues(savedFormData.values || {});
        if (savedFormData.values?.currency_id) {
          setSelectedCurrency(savedFormData.values.currency_id);
        }
        if (savedFormData.values?.due_date) {
          setDueDate(savedFormData.values.due_date);
        }
        if (savedFormData.values?.mode) {
          setCurrentMode(savedFormData.values.mode);
        }
        if (savedFormData.values?.mode_account_id) {
          setSelectedBank(savedFormData.values.mode_account_id);
        }
        if (savedFormData.rows) {
          setRows(savedFormData.rows);
        }
        setAddedAttachments(savedFormData.addedAttachments || {}); // Assuming addedAttachments are saved
        clearFormValues(formId);
      }
    }
  }, [restoreValuesFromStore]);

  // Save form data when values change
  useEffect(() => {
    if (onFormDataChange && formikRef.current) {
      const formValues = formikRef.current.values;

      onFormDataChange({
        values: formValues,
        rows: rows,
        addedAttachments,
      });
    }
  }, [formikRef.current?.values, rows, addedAttachments, onFormDataChange]);

  // Helper function to determine if mode field should be disabled
  const isModeDisabled = (ledgerType) => {
    // If form is disabled, mode is also disabled
    if (isDisabled) return true;

    // If ledger is PL or WIC, mode should be disabled
    if (ledgerType === 'party' || ledgerType === 'walkin') {
      return true;
    }

    // If ledger is GL
    if (ledgerType === 'general') {
      // If GL type is cash, mode should be disabled
      if (selectedGLType === 'cash') {
        return true;
      }
      // If GL type is bank, mode should be enabled
      if (selectedGLType === 'bank') {
        return false;
      }
      // For any other GL type, mode should be disabled
      return true;
    }

    // Default: disabled
    return true;
  };

  // Helper function to get filtered mode options
  const getModeOptions = (ledgerType) => {
    const allModeOptions = [
      { label: 'Cash', value: 'Cash' },
      { label: 'Bank', value: 'Bank' },
      { label: 'PDC', value: 'PDC' },
      { label: 'Online', value: 'Online' },
    ];

    // If ledger is GL and type is bank, exclude Cash option
    if (ledgerType === 'general' && selectedGLType === 'bank') {
      return allModeOptions.filter((option) => option.value !== 'Cash');
    }

    return allModeOptions;
  };

  const {
    data: { data: [voucherData] = [] } = {},
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['internalPaymentVoucher', searchTerm],
    queryFn: () => getInternalPaymentVoucherListing({ search: searchTerm }),
    enabled: !!searchTerm,
  });

  // Initialize current files from voucher data
  useEffect(() => {
    let ipv = voucherData?.internal_payment_vouchers;
    if ((ipv || voucherData) && !filesInitializedRef.current) {
      // Initialize current files from voucher data only once
      const filesData = ipv?.files || voucherData?.files || [];
      setCurrentFiles(filesData);
      filesInitializedRef.current = true;
    } else if (ipv || voucherData) {
      // If files are already initialized, no need to reset them unless managing updates
    }
  }, [voucherData?.internal_payment_vouchers?.id, voucherData?.id]);

  // Check Transaction lock status to enable/disable Save
  const { isLoading: isLoadingLockStatus, refetch: checkFormStatus } = useQuery(
    {
      queryKey: ['save_lock_status', voucherName, voucherData?.id],
      queryFn: () =>
        checkTransactionLockStatus({
          transaction_type: voucherName,
          transaction_id: voucherData?.id,
        }),
      enabled: false,
      retry: false,
    }
  );

  useEffect(() => {
    if (!isNullOrEmpty(voucherData?.internal_payment_vouchers?.vat_details)) {
      setRows(() => {
        const editRows = {};

        voucherData?.internal_payment_vouchers?.vat_details.forEach((x) => {
          editRows[x.id] = {
            id: x.id,
            ledger: x.ledger,
            debit_account_id: x.debit_account_id,
            narration: x.narration,
            currency_id: x.currency_id,
            amount: x.amount,
            vat_terms: x.vat_terms,
            vat_terms_id: x.vat_terms_id || '', // Add VAT terms ID field
            vat_type: x.vat_type || '', // Add VAT type field
            vat_percentage: x.vat_percentage,
            vat_amount: x.vat_amount,
            total: x.total,
          };
        });

        return { ...editRows };
      });
    }
  }, []);

  useEffect(() => {
    // Don't show validation errors when form is disabled
    if (isDisabled) {
      setRowFieldErrors({});
      return;
    }

    const nextErrors = {};
    let hasAnyData = false;

    // Check individual rows
    Object.values(rows).forEach((r) => {
      const hasData = r.ledger || r.debit_account_id || r.amount;
      if (hasData) {
        hasAnyData = true;
        const errors = {};
        if (!r.ledger) errors.ledger = true;
        if (!r.debit_account_id) errors.account = true;
        if (!r.amount) errors.amount = true;

        if (Object.keys(errors).length > 0) {
          nextErrors[r.id] = errors;
        }
      }
    });

    // If no row has data, ensure at least the first row shows required errors
    if (!hasAnyData && Object.keys(rows).length > 0) {
      const firstRow = Object.values(rows)[0];
      if (firstRow) {
        nextErrors[firstRow.id] = {
          ledger: true,
          account: true,
          amount: true,
        };
      }
    }

    setRowFieldErrors(nextErrors);
  }, [rows, isDisabled]);

  const handleSubmit = async () => {
    // run status check first
    const { error: errorLockStatus } = await checkFormStatus();
    if (errorLockStatus?.detail?.locked) {
      showToast(errorLockStatus?.message, 'warn');
      return;
    }

    if (!formikRef.current) return;

    if (!formikRef.current) return;

    let hasTableErrors = false;
    // Check for any rows with error=true
    if (Object.keys(rowFieldErrors).length > 0) {
      setRowsTouched((prev) => {
        const allTouched = {};
        Object.keys(rows).forEach((id) => (allTouched[id] = true));
        return allTouched;
      });
      hasTableErrors = true;
    }

    // Validate the form
    const errors = await formikRef.current.validateForm();
    if (Object.keys(errors).length > 0) {
      // Mark all fields as touched to show errors
      formikRef.current.setTouched(
        Object.keys(errors).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {})
      );
    }

    if (hasTableErrors || Object.keys(errors).length > 0) {
      return;
    }

    const formValues = formikRef.current.values;

    let payload = {
      ...rows,
    };

    // Filter out completely empty rows
    const validRowKeys = Object.keys(rows).filter(key => {
      const r = rows[key];
      return r.ledger || r.debit_account_id || r.amount;
    });

    if (validRowKeys.length === 0) {
      showErrorToast({ message: 'At least one row is required' });
      return;
    }

    const filteredRows = {};
    validRowKeys.forEach(key => {
      filteredRows[key] = rows[key];
    });

    let transactions = { ...filteredRows };

    // Get VAT type from first row with vat_type field
    const voucherVatType =
      voucherData?.internal_payment_vouchers?.vat_details?.find(
        (detail) => detail.vat_type
      )?.vat_type;

    const vatTypeToSend = isVatTypeMismatch()
      ? voucherVatType // Different: use voucher's VAT type
      : vatData?.vatType?.vat_type || voucherVatType || ''; // Same: use branch's VAT type

    transactions = Object.values(transactions).map(({ id, ...rest }) => {
      // Process each row to apply VAT calculations similar to Payment Voucher
      // Calculate VAT amount and percentage based on conditions
      let finalVatAmount = rest.vat_amount;
      let finalVatPercentage = rest.vat_percentage;

      if (shouldVatAmountBeZero(rest.vat_terms)) {
        finalVatAmount = 0;
        finalVatPercentage = 0;
      }

      // Check if VAT is not applied (empty, null, or 0)
      const isVatNotApplied =
        (!rest.vat_percentage || rest.vat_percentage === '' || parseFloat(rest.vat_percentage) === 0) &&
        (!rest.vat_amount || rest.vat_amount === '' || parseFloat(rest.vat_amount) === 0) ||
        (finalVatAmount === 0 && finalVatPercentage === 0);

      // Validate and prepare VAT terms ID
      let vatTermsIdPayload = {};

      // Only process VAT terms ID if VAT is applied
      if (!isVatNotApplied) {
        // Check if the vat_terms_id is valid in current branch's VAT terms
        const isValidInCurrentBranch = vatData?.vatType?.vats?.some(
          (vat) => vat.id === rest.vat_terms_id
        );

        // IMPORTANT: If voucher's VAT type is 'variable', vat_terms_id is REQUIRED by backend
        if (vatTypeToSend === 'variable') {
          // For variable VAT type vouchers, vat_terms_id is mandatory
          if (
            rest.vat_terms_id &&
            !isNaN(rest.vat_terms_id) &&
            rest.vat_terms_id !== ''
          ) {
            // Use existing vat_terms_id
            vatTermsIdPayload = { vat_terms_id: rest.vat_terms_id };
          } else if (isValidInCurrentBranch) {
            // If somehow not set but valid in current branch, use it
            vatTermsIdPayload = { vat_terms_id: rest.vat_terms_id };
          } else if (
            vatData?.vatType?.vat_type === 'variable' &&
            vatData?.vatType?.vats &&
            vatData.vatType.vats.length > 0
          ) {
            // If current branch is also variable and has VAT terms, use first one
            vatTermsIdPayload = { vat_terms_id: vatData.vatType.vats[0].id };
          }
        } else if (vatTypeToSend === 'fixed') {
          // For fixed VAT type, vat_terms_id is optional - only include if valid
          if (
            rest.vat_terms_id &&
            !isNaN(rest.vat_terms_id) &&
            rest.vat_terms_id !== ''
          ) {
            vatTermsIdPayload = { vat_terms_id: rest.vat_terms_id };
          }
        }
      }

      return {
        ...rest,
        vat_amount: isVatNotApplied ? '' : finalVatAmount,
        vat_percentage: isVatNotApplied ? '' : finalVatPercentage,
        vat_terms: isVatNotApplied ? '' : (
          rest.vat_terms ||
          (rest.vat_percentage !== '' && !isNaN(rest.vat_percentage)
            ? Number(rest.vat_percentage)
            : '')
        ),
        vat_type: isVatNotApplied ? '' : vatTypeToSend, // Send voucher's VAT type if mismatch, else branch's VAT type
        ...vatTermsIdPayload, // Only include vat_terms_id if it's valid and VAT is applied
        ...((rest.vat_terms?.startsWith?.('A small popup') ||
          rest.vat_terms?.toLowerCase() === 'out of scope') && {
          out_of_scope_reason: outOfScope,
        }),
      };
    });

    const transformedTransactions = transactions?.reduce((acc, t, index) => {
      Object.entries(t).forEach(([key, value]) => {
        acc[`vats[${index}][${key}]`] = value;
      });
      return acc;
    }, {});

    // Build payload - mode key is required by backend, but related fields are conditional
    payload = {
      ledger: formValues.ledger,
      account_id: formValues.account_id,
      ...(formValues.cost_center_id && { cost_center_id: formValues.cost_center_id }),
      mode: formValues?.mode ? formValues.mode.charAt(0).toUpperCase() + formValues.mode.slice(1).toLowerCase() : '',
      ...(formValues?.mode && formValues.mode_account_id && { mode_account_id: formValues.mode_account_id }),
      ...(formValues?.mode && formValues.cheque_number && { cheque_number: formValues.cheque_number }),
      ...(formValues?.mode && dueDate && { due_date: dueDate }),
      date,
      amount: parseFloat(totalNetTotal.toFixed(2)),
      currency_id: formValues.currency_id,
      narration: formValues.narration,
      ...transformedTransactions,
      ...(addedAttachments || {}),
    };

    // Include deleted attachments in payload if any
    if (deletedAttachments && deletedAttachments.length > 0) {
      deletedAttachments.forEach((attachmentId, index) => {
        payload[`deleted_attachments[${index}]`] = attachmentId;
      });
    }

    handlePairReleased();
    updateInternalPaymentVoucherMutation.mutate({
      id: voucherData.voucher_no,
      formData: payload,
    });
  };

  const handleResetRows = () => {
    setIsDisabled(true);
    if (formikRef.current) {
      formikRef.current.resetForm();
    }
    // Clear saved form values when resetting
    clearFormValues(formId);
    clearFormValues('special-commission');
    setAddedAttachments({});
    setDeletedAttachments([]);
    // Reset files to original state and allow re-initialization
    filesInitializedRef.current = false;
    if (voucherData?.internal_payment_vouchers?.files || voucherData?.files) {
      setCurrentFiles(voucherData?.internal_payment_vouchers?.files || voucherData?.files || []);
    } else {
      setCurrentFiles([]);
    }
  };

  const updateInternalPaymentVoucherMutation = useMutation({
    mutationFn: ({ id, formData }) =>
      updateInternalPaymentVoucher(id, formData),
    onSuccess: (data) => {
      showToast('Internal Payment Voucher   Updated!', 'success');
      if (getPrintSettings('internal_payment_voucher')) {
        if (data?.detail?.pdf_url) {
          window.open(data.detail.pdf_url, '_blank');
        }
      }
      queryClient.invalidateQueries(['internalPaymentVoucher', searchTerm]);
      // Clear attachment tracking after successful update
      setAddedAttachments({});
      setDeletedAttachments([]);
      handleResetRows();
      setPageState('view');
      // Clear validation errors after successful update
      setRowFieldErrors({});
      setRowsTouched({});
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  // Release lock on unmount or cancel
  const releaseExecutedRef = useRef(false);
  const releaseTransactionMutation = useMutation({
    mutationFn: releaseTransaction,
    onError: (error) => {
      showErrorToast(error);
    },
  });
  const releaseLock = useCallback(() => {
    if (releaseExecutedRef.current) return;
    if (voucherData?.id) {
      releaseTransactionMutation.mutate({
        transaction_type: voucherName,
        transaction_id: voucherData?.id,
      });
      releaseExecutedRef.current = true;
    }
  }, [voucherData?.id]);

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

  // Handler functions for rows
  const updateField = useCallback((id, field, value) => {
    setRowsTouched((prev) => ({
      ...prev,
      [id]: true,
    }));
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
  const handleAddRows = () => {
    const newRows = {};
    const id = crypto.randomUUID();
    newRows[id] = {
      id,
      ledger: '',
      debit_account_id: '',
      narration: '',
      currency_id: '',
      amount: '',
      vat_percentage: '',
      vat_terms: '',
      vat_terms_id: '', // Add VAT terms ID field
      vat_type: '', // Add VAT type field
      vat_amount: '',
      net_total: '',
    };
    setRows((prevRows) => ({ ...prevRows, ...newRows }));
  };
  const handleDeleteRow = (id) => {
    setRows((prevRows) => {
      const newState = { ...prevRows };
      delete newState[id];
      return newState;
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
    if (currencyRate) pairReleasedMutation.mutate(currencyRate?.id);
  };

  const handleCancel = () => {
    handlePairReleased()
    releaseLock();
    if (formikRef.current) {
      formikRef.current.resetForm();
    }
    clearFormValues(formId);
    clearFormValues('special-commission');
    setAddedAttachments({});
    setDeletedAttachments([]);
    // Reset files to original state and allow re-initialization
    filesInitializedRef.current = false;
    if (voucherData?.internal_payment_vouchers?.files || voucherData?.files) {
      setCurrentFiles(voucherData?.internal_payment_vouchers?.files || voucherData?.files || []);
    } else {
      setCurrentFiles([]);
    }
    setPageState('view');
  };

  const handleVatOutOfScope = (values) => {
    setOutOfScope(values.out_of_scope);

    // Update the specific row that triggered the modal
    if (currentRowForVat) {
      // Find the "Out of Scope" option and set its ID
      const outOfScopeOption = getVATTermsOptions().find(
        (option) =>
          option.title?.toLowerCase().includes('out of scope') ||
          option.percentage?.toString().startsWith('A small popup will appear')
      );

      if (outOfScopeOption) {
        updateField(currentRowForVat, 'vat_terms', 'Out of Scope');
        updateField(currentRowForVat, 'vat_percentage', 0);
        updateField(currentRowForVat, 'vat_amount', 0);
        updateField(currentRowForVat, 'vat_terms_id', outOfScopeOption.id);
        updateField(
          currentRowForVat,
          'vat_type',
          vatData?.vatType?.vat_type || ''
        );
        updateField(
          currentRowForVat,
          'out_of_scope_reason',
          values.out_of_scope
        );

        // Recalculate total for the row
        const rowData = rows[currentRowForVat];
        const amount = parseFloat(rowData?.amount || 0);
        updateField(currentRowForVat, 'total', amount);
      }
    }

    setShowVatOutOfScopeModal(false);
    setCurrentRowForVat(null);
  };

  const getVATTermsOptions = () => {
    if (vatData.isLoadingVatType) return [{ label: 'Loading...', value: '' }];
    if (vatData.isErrorVatType) {
      return [{ label: 'Unable to fetch VAT Terms', value: null }];
    }
    return vatData?.vatType?.vats?.map((item) => ({
      label: `${item.title}${!isNaN(parseFloat(item.percentage)) ? ' - ' + item.percentage + '%' : ''
        }`,
      value: item.id, // Use ID as value for proper selection
      id: item.id, // Include the VAT term ID
      title: item.title, // Include the title for VAT condition checks
      percentage: item.percentage, // Include the percentage for calculations
    }));
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

  // Check if VAT types match between branch and existing voucher
  const isVatTypeMismatch = () => {
    const branchVatType = vatData?.vatType?.vat_type;

    // For Internal Payment Voucher, VAT type is stored in rows/vat_details
    // Get VAT type from the first row with vat_type field
    const voucherVatType =
      voucherData?.internal_payment_vouchers?.vat_details?.find(
        (detail) => detail.vat_type
      )?.vat_type;

    // If either is missing, no mismatch
    if (!branchVatType || !voucherVatType) return false;

    // Check if types are different (case-insensitive comparison)
    return branchVatType?.toLowerCase() !== voucherVatType?.toLowerCase();
  };

  let getcostCenterData = [];

  const {
    data: costCenterData,
    isLoading: isLoadingCostCenterData,
    isError: isErrorCostCenterData,
    error: errorCostCenterData,
  } = useQuery({
    queryKey: ['per_page', 50],
    queryFn: () => getCostCenterRegisterListing(),
    staleTime: 1000 * 60 * 5,
  });

  // Defensive check depending on API structure
  if (Array.isArray(costCenterData)) {
    getcostCenterData = costCenterData.map((cost) => ({
      label: cost.code,
      value: cost.id,
    }));
  } else if (Array.isArray(costCenterData?.data)) {
    getcostCenterData = costCenterData.data.map((cost) => ({
      label: cost.code,
      value: cost.id,
    }));
  }

  useEffect(() => {
    costCenterData;
  }, [costCenterData]);

  const {
    data: modeCheques,
    isLoading: isLoadingCheques,
    isError: isErrorCheques,
    error: errorCheques,
  } = useQuery({
    queryKey: ['cheques', selectedBank],
    queryFn: () => getChequeNumberByBank(selectedBank),
    enabled:
      !!selectedBank && (currentMode === 'Bank' || currentMode === 'PDC'),
    staleTime: 1000 * 60 * 5,
  });



  const chequeOptions = [
    ...(Array.isArray(modeCheques) ? modeCheques.map((cheque) => ({
      label: String(cheque.cheque_number),
      value: String(cheque.cheque_number),
    })) : []),
    ...(voucherData?.internal_payment_vouchers?.cheque_number &&
      !(Array.isArray(modeCheques) ? modeCheques : []).some(
        (c) =>
          String(c.cheque_number) ===
          String(voucherData.internal_payment_vouchers.cheque_number)
      )
      ? [
        {
          label: String(voucherData.internal_payment_vouchers.cheque_number),
          value: String(voucherData.internal_payment_vouchers.cheque_number),
        },
      ]
      : []),
  ];

  useEffect(() => {
    modeCheques;
  }, [modeCheques]);

  useEffect(() => {
    if (
      !selectedBank &&
      (voucherData?.internal_payment_vouchers?.mode_account_id?.id ||
        voucherData?.internal_payment_vouchers?.mode_account_id)
    ) {
      setSelectedBank(
        voucherData?.internal_payment_vouchers?.mode_account_id?.id ||
        voucherData?.internal_payment_vouchers?.mode_account_id
      ); // Set selectedBank so query runs
    }
  }, [
    selectedBank,
    voucherData?.internal_payment_vouchers?.mode_account_id,
  ]);

  const {
    data: vatType,
    isLoading: isLoadingVatType,
    isError: isErrorVatType,
    error: errorVatType,
  } = useQuery({
    queryKey: ['vatType'],
    queryFn: getVATType,
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  // COA ACCOUNTS (Mode) - Separate queries for each mode type
  const {
    data: coaCashAccounts,
    isLoading: isLoadingCoaCashAccounts,
    isError: isErrorCoaCashAccounts,
    error: errorCoaCashAccounts,
  } = useQuery({
    queryKey: ['coaAccounts', 'Cash'],
    queryFn: () => getCOAAccountsbyMode('Cash'),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: coaBankAccounts,
    isLoading: isLoadingCoaBankAccounts,
    isError: isErrorCoaBankAccounts,
    error: errorCoaBankAccounts,
  } = useQuery({
    queryKey: ['coaAccounts', 'Bank'],
    queryFn: () => getCOAAccountsbyMode('Bank'),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: coaPDCAccounts,
    isLoading: isLoadingCoaPDCAccounts,
    isError: isErrorCoaPDCAccounts,
    error: errorCoaPDCAccounts,
  } = useQuery({
    queryKey: ['coaAccounts', 'PDC'],
    queryFn: () => getCOAAccountsbyMode('PDC'),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: coaOnlineAccounts,
    isLoading: isLoadingCoaOnlineAccounts,
    isError: isErrorCoaOnlineAccounts,
    error: errorCoaOnlineAccounts,
  } = useQuery({
    queryKey: ['coaAccounts', 'Online'],
    queryFn: () => getCOAAccountsbyMode('Online'),
    staleTime: 1000 * 60 * 5,
  });

  const coaAccountsData = {
    Cash: {
      data: coaCashAccounts,
      loading: isLoadingCoaCashAccounts,
      error: isErrorCoaCashAccounts,
      errorMessage: errorCoaCashAccounts,
    },
    Bank: {
      data: coaBankAccounts,
      loading: isLoadingCoaBankAccounts,
      error: isErrorCoaBankAccounts,
      errorMessage: errorCoaBankAccounts,
    },
    PDC: {
      data: coaPDCAccounts,
      loading: isLoadingCoaPDCAccounts,
      error: isErrorCoaPDCAccounts,
      errorMessage: errorCoaPDCAccounts,
    },
    Online: {
      data: coaOnlineAccounts,
      loading: isLoadingCoaOnlineAccounts,
      error: isErrorCoaOnlineAccounts,
      errorMessage: errorCoaOnlineAccounts,
    },
  };

  // Account balances for Ledger and Mode accounts
  const { data: ledgerAccountBalance } = useQuery({
    queryKey: ['accountBalance', selectedLedgerAccount?.value],
    queryFn: () =>
      getAccountBalances(
        selectedLedgerAccount.value,
        selectedLedgerAccount.accountType
      ),
    enabled:
      !!selectedLedgerAccount?.value &&
      getAccountBalanceSettings('internal_payment_voucher'),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

  const { data: modeAccountBalance } = useQuery({
    queryKey: ['accountBalance', selectedModeAccount?.value],
    queryFn: () =>
      getAccountBalances(
        selectedModeAccount.value,
        selectedModeAccount.accountType
      ),
    enabled:
      !!selectedModeAccount?.value &&
      getAccountBalanceSettings('internal_payment_voucher'),
    staleTime: 1000 * 60 * 2,
  });

  // Exchange rates
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

  // Fetch currency rate for the selected Currency
  const { data: currencyRate, isLoading: isLoadingCurrencyRate } =
    useCurrencyRate(selectedCurrency, date);

  // Check for missing currency rate on currency change
  useEffect(() => {
    if (selectedCurrency) {
      setHasShownModal(false);
    }
  }, [selectedCurrency]);

  // Check for missing currency rate and show modal
  useEffect(() => {
    if (
      selectedCurrency &&
      date &&
      currencyRate &&
      !currencyRate?.rate &&
      !hasShownModal
    ) {
      formikRef.current.setFieldValue('currency_id', '');
      setCurrencyToSelect(selectedCurrency);
      setShowMissingCurrencyRateModal(true);
      setHasShownModal(true);
    }
  }, [selectedCurrency, date, currencyRate?.rate, hasShownModal]);

  const vatData = {
    vatType,
    isLoadingVatType,
    isErrorVatType,
    errorVatType,
  };

  // Function to get mode account options
  const getCOAAccountsByModeOptions = (modeType) => {
    if (!modeType) {
      return [{ label: 'Select Mode', value: null, isDisabled: true }];
    }

    const { data, loading, error, errorMessage } =
      coaAccountsData[modeType] || {};

    if (loading) {
      return [{ label: 'Loading...', value: null, isDisabled: true }];
    }

    if (error) {
      return [{ label: 'Unable to fetch Accounts', value: null }];
    }

    let options =
      data?.map((x) => ({
        value: x?.id,
        label: x?.account_name,
      })) || [];

    return options;
  };

  useEffect(() => {
    const total = Object.values(
      voucherData?.internal_payment_vouchers?.vat_details || {}
    ).reduce((sum, row) => {
      const net = parseFloat(row.total);
      return sum + (isNaN(net) ? 0 : net);
    }, 0);

    setTotalNetTotal(total);
  }, [voucherData?.internal_payment_vouchers?.vat_details]);

  useEffect(() => {
    const total = Object.values(rows).reduce((sum, row) => {
      const net = parseFloat(row.total);
      return sum + (isNaN(net) ? 0 : net);
    }, 0);

    setTotalNetTotal(total);
  }, [rows]);

  // Set selected accounts from voucher data
  useEffect(() => {
    if (voucherData?.internal_payment_vouchers) {
      const voucher = voucherData.internal_payment_vouchers;

      // Set selected ledger account
      if (voucher.ledger && voucher.account_id) {
        const ledgerOptions = getAccountsByTypeOptions(voucher.ledger);
        const selectedLedger = ledgerOptions.find(
          (option) => option.value === voucher.account_id
        );
        if (selectedLedger) {
          setSelectedLedgerAccount({
            value: selectedLedger.value,
            label: selectedLedger.label,
            accountType: voucher.ledger,
          });

          // If ledger is GL, set the GL type from the selected option
          if (voucher.ledger === 'general' && selectedLedger.type) {
            setSelectedGLType(selectedLedger.type);
          }
        }
      }

      // Set selected mode account
      if (voucher.mode && voucher.mode_account_id?.id) {
        const modeOptions = getCOAAccountsByModeOptions(voucher.mode);
        const selectedMode = modeOptions.find(
          (option) => option.value === voucher.mode_account_id.id
        );

        if (selectedMode) {
          setSelectedModeAccount({
            value: selectedMode.value,
            label: selectedMode.label,
            accountType: (voucher.mode || '').toLowerCase(),
          });
          // Also set selectedBank for cheque number query
          setSelectedBank(voucher.mode_account_id.id);
        }
      }

      // Set selected currency
      if (voucher.currency_id) {
        setSelectedCurrency(voucher.currency_id);
      }

      // Set current mode and initialize cheque/due date states
      if (voucher.mode) {
        setCurrentMode(voucher.mode);

        // Initialize cheque field and due date based on existing mode
        if (voucher.mode === 'Bank' || voucher.mode === 'PDC') {
          setIsChequeFieldEnabled(true);
          setIsDueDateEditable(true);
        } else {
          setIsChequeFieldEnabled(false);
          setIsDueDateEditable(false);
        }

        // Initialize dueDate state from voucher data
        if (voucher.due_date) {
          setDueDate(voucher.due_date.split('T')[0]);
        }
      }
    }
  }, [voucherData, getAccountsByTypeOptions, date]);

  // Handle error state
  if (isError) {
    showErrorToast(error);
    return (
      <div className="d-card">
        <p className="text-danger mb-0">
          Error fetching Internal Payment Voucher
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="d-card">
        <Formik
          innerRef={formikRef}
          enableReinitialize={true}
          initialValues={{
            ledger: voucherData?.internal_payment_vouchers?.ledger,
            account_id: voucherData?.internal_payment_vouchers?.account_id,
            cost_center_id:
              voucherData?.internal_payment_vouchers?.cost_center_id,
            mode: voucherData?.internal_payment_vouchers?.mode,
            mode_account_id:
              voucherData?.internal_payment_vouchers?.mode_account_id?.id ||
              voucherData?.internal_payment_vouchers?.mode_account_id,
            cheque_number:
              voucherData?.internal_payment_vouchers?.cheque_number
                ? String(voucherData.internal_payment_vouchers.cheque_number)
                : '',
            due_date: voucherData?.internal_payment_vouchers?.due_date
              ? voucherData.internal_payment_vouchers.due_date.split('T')[0]
              : '',
            currency_id: voucherData?.internal_payment_vouchers?.currency_id,
            amount: voucherData?.internal_payment_vouchers?.amount,
            narration: voucherData?.internal_payment_vouchers?.narration,
          }}
          validate={(values) => {
            const errors = {};

            if (!values.ledger) errors.ledger = 'Ledger is required';
            if (!values.account_id) errors.account_id = 'Account is required';
            if (!values.currency_id)
              errors.currency_id = 'Currency is required';

            return errors;
          }}
        >
          {({
            values,
            touched,
            errors,
            handleChange,
            handleBlur,
            setFieldValue,
          }) => (
            <Form>
              <div className="row">
                <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
                  <div className="row mb-4">
                    <div className="col-12 col-sm-6 mb-45">
                      <CombinedInputs
                        label="Ledger"
                        type1="select"
                        type2="select"
                        name1="ledger"
                        name2="account_id"
                        value1={values.ledger}
                        value2={values.account_id}
                        options1={[
                          { label: 'PL', value: 'party' },
                          { label: 'GL', value: 'general' },
                          { label: 'WIC', value: 'walkin' },
                        ]}
                        options2={getAccountsByTypeOptions(values.ledger)}
                        isDisabled={isDisabled}
                        handleBlur={handleBlur}
                        placeholder1="Ledger"
                        placeholder2="Select Account"
                        className1="ledger"
                        className2="account"
                        onChange1={(selected) => {
                          setFieldValue('ledger', selected.value);
                          setFieldValue('account_id', '');
                          setSelectedLedgerAccount(null);
                          // Reset GL type when ledger changes
                          setSelectedGLType(null);
                          // Reset mode fields when ledger changes
                          setFieldValue('mode', '');
                          setFieldValue('mode_account_id', '');
                          // Reset mode account selection when ledger changes
                          setSelectedModeAccount(null);
                        }}
                        onChange2={(selected) => {
                          if (
                            selected.label?.toLowerCase()?.startsWith('add new')
                          ) {
                            setShowAddLedgerModal(
                              selected.label?.toLowerCase()
                            );
                          } else if (selected && selected.value) {
                            setFieldValue('account_id', selected.value);
                            setSelectedLedgerAccount({
                              value: selected.value,
                              label: selected.label,
                              accountType: values.ledger,
                            });

                            // If ledger is GL, capture the account type
                            if (values.ledger === 'general') {
                              // Extract type from selected option (if available)
                              setSelectedGLType(selected.type || null);

                              // Reset mode fields when GL account changes
                              setFieldValue('mode', '');
                              setFieldValue('mode_account_id', '');
                            } else {
                              setSelectedGLType(null);
                            }
                          } else {
                            // Handle case when account is deselected
                            setFieldValue('account_id', '');
                            setSelectedLedgerAccount(null);
                            setSelectedGLType(null);
                            // Reset mode fields when ledger account is cleared
                            setFieldValue('mode', '');
                            setFieldValue('mode_account_id', '');
                          }
                        }}
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-45">
                      <SearchableSelect
                        name={'cost_center_id'}
                        label={'Cost Center'}
                        options={getcostCenterData}
                        isDisabled={isDisabled}
                        placeholder={'Select Cost Center'}
                        value={values.cost_center_id}
                        onChange={(selected) => {
                          setFieldValue('cost_center_id', selected.value);
                        }}
                        onBlur={handleBlur}
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-45">
                      <CombinedInputs
                        label="Mode"
                        type1="select"
                        type2="select"
                        name1="mode"
                        name2="mode_account_id"
                        value1={values.mode}
                        value2={values.mode_account_id}
                        options1={getModeOptions(values.ledger)}
                        options2={getCOAAccountsByModeOptions(values.mode)}
                        isDisabled={isModeDisabled(values.ledger)}
                        handleBlur={handleBlur}
                        placeholder1="Mode"
                        placeholder2="Select Account"
                        className1="mode"
                        className2="account"
                        onChange1={(selected) => {
                          setFieldValue('mode', selected.value);
                          setFieldValue('mode_account_id', '');
                          setSelectedModeAccount(null);
                          setCurrentMode(selected.value);

                          // Handle cheque number and due date based on mode
                          if (selected.value === 'Online') {
                            setFieldValue('cheque_number', '');
                            setIsChequeFieldEnabled(false);
                            setDueDate('');
                            setIsDueDateEditable(false);
                          } else if (selected.value === 'Cash') {
                            setFieldValue('cheque_number', '');
                            setIsChequeFieldEnabled(false);
                            setDueDate('');
                            setIsDueDateEditable(false);
                          } else if (selected.value === 'Bank') {
                            setFieldValue('due_date', date);
                            setIsChequeFieldEnabled(true);
                            setDueDate(date);
                            setIsDueDateEditable(true);
                          } else if (selected.value === 'PDC') {
                            const tomorrow = new Date(date);
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            setFieldValue(
                              'due_date',
                              tomorrow.toISOString().split('T')[0]
                            );
                            setIsChequeFieldEnabled(true);
                            setDueDate(tomorrow.toISOString().split('T')[0]);
                            setIsDueDateEditable(true);
                          }
                        }}
                        onChange2={(selected) => {
                          setFieldValue('mode_account_id', selected.value);
                          setSelectedBank(selected.value);
                          setSelectedModeAccount({
                            value: selected.value,
                            label: selected.label,
                            accountType: (values.mode || '').toLowerCase(),
                          });
                        }}
                      />
                    </div>
                    {(values.mode === 'Bank' || values.mode === 'PDC') && (
                      <div className="col-12 col-sm-6 mb-45">
                        <SearchableSelect
                          name={'cheque_number'}
                          label={'Cheque Number'}
                          options={chequeOptions}
                          isDisabled={
                            !isChequeFieldEnabled ||
                            isDisabled ||
                            isLoadingCheques
                          }
                          placeholder={
                            isLoadingCheques
                              ? 'Loading cheques...'
                              : Array.isArray(modeCheques) && modeCheques.length > 0
                                ? 'Select Cheque Number'
                                : modeCheques?.message || 'No Cheque Found'
                          }
                          value={values.cheque_number}
                          onChange={(selected) => {
                            setFieldValue('cheque_number', selected.value);
                          }}
                          onBlur={handleBlur}
                        />
                      </div>
                    )}
                    {/* Due Date Field */}
                    {(values.mode === 'Bank' || values.mode === 'PDC') && (
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'due_date'}
                          label={'Due Date'}
                          type={'date'}
                          min={
                            values.mode === 'PDC'
                              ? new Date(
                                new Date(date).setDate(
                                  new Date(date).getDate() + 1
                                )
                              )
                                .toISOString()
                                .split('T')[0]
                              : new Date(date).toISOString().split('T')[0]
                          }
                          {...(values.mode === 'Bank' && {
                            max: new Date(date).toISOString().split('T')[0],
                          })}
                          disabled={isDisabled}
                          value={values.due_date}
                          onChange={(e) => {
                            handleChange(e);
                            setDueDate(e.target.value);
                          }}
                          onBlur={handleBlur}
                          error={touched.due_date && errors.due_date}
                        />
                      </div>
                    )}

                    <div className="col-12 col-sm-6 mb-45">
                      <CombinedInputs
                        label="Currency"
                        type1="select"
                        type2="input"
                        name1="currency_id"
                        name2="amount"
                        additionalProps={{
                          isLoadingCurrencyRate: isLoadingCurrencyRate,
                        }}
                        value1={values.currency_id}
                        value2={totalNetTotal.toFixed(2)}
                        options1={currencyOptions}
                        isDisabled={isDisabled}
                        isSecondInputDisabled={true}
                        handleBlur={handleBlur}
                        placeholder1="Currency"
                        placeholder2="Enter Amount"
                        className1="currency"
                        className2="amount"
                        inputType2="number"
                        inputProps2={{ readOnly: true }}
                        onChange1={(selected) => {
                          setFieldValue('currency_id', selected.value);
                          setSelectedCurrency(selected.value);
                          setHasShownModal(false);
                        }}
                        onChange2={() => { }} // No-op since it's read-only
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <CustomInput
                        name={'narration'}
                        label={'Narration'}
                        type={'textarea'}
                        placeholder={'Enter Narration'}
                        disabled={isDisabled}
                        value={values.narration}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.narration && errors.narration}
                      />
                    </div>
                  </div>
                </div>
                <div className="col-0  col-xxl-2" />
                <div className="col-12 col-lg-10 col-xl-9 col-xxl-3">
                  <div className="row">
                    {/* Right side cards */}
                    <div className="col-12 mb-5" style={{ maxWidth: '350px' }}>
                      {getAccountBalanceSettings(
                        'internal_payment_voucher'
                      ) && (
                          <>
                            {selectedLedgerAccount && (
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
                            )}
                            {selectedModeAccount && !isModeDisabled(values.ledger) && (
                              <AccountBalanceCard
                                heading="Account Balance"
                                accountName={selectedModeAccount.label}
                                balances={
                                  modeAccountBalance?.balances ||
                                  modeAccountBalance?.detail?.balances ||
                                  (Array.isArray(modeAccountBalance)
                                    ? modeAccountBalance
                                    : [])
                                }
                                loading={modeAccountBalance === undefined}
                              />
                            )}
                          </>
                        )}
                      <ExchangeRatesCard
                        rates={exchangeRatesData?.detail || exchangeRatesData}
                        loading={isLoadingExchangeRates}
                        error={isErrorExchangeRates}
                        onInverseChange={setExchangeRatesInverse}
                      />
                    </div>
                  </div>
                </div>

                <CustomTable
                  displayCard={false}
                  headers={internalPaymentVoucherHeaders}
                  isPaginated={false}
                  className={'inputTable'}
                  hideSearch
                  hideItemsPerPage
                >
                  <tbody>
                    {Object.values(rows).map((row, index) => (
                      <InternalPaymentVoucherRow
                        key={row.id}
                        row={row}
                        index={index}
                        handleDeleteRow={handleDeleteRow}
                        updateField={updateField}
                        accountData={accountData}
                        setShowAddLedgerModal={setShowAddLedgerModal}
                        currencyOptions={currencyOptions}
                        vatData={vatData}
                        currency={values.currency_id}
                        rows={rows}
                        setShowVatOutOfScopeModal={setShowVatOutOfScopeModal}
                        setCurrentRowForVat={setCurrentRowForVat}
                        isVatTypeMismatch={isVatTypeMismatch()}
                        voucherVatType={
                          voucherData?.internal_payment_vouchers?.vat_details?.find(
                            (detail) => detail.vat_type
                          )?.vat_type
                        }
                        fieldErrors={rowFieldErrors[row.id] || {}}
                        forceShowErrors={!!rowsTouched[row.id]}
                      />
                    ))}
                  </tbody>
                </CustomTable>

                {/* File Attachments */}
                <div className="col-12 mb-3">
                  <FileDisplayList
                    files={addedAttachments}
                    onRemoveFile={(file) => {
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
                    }}
                  />
                </div>

                <div className="d-flex flex-wrap justify-content-start mb-5">
                  <div className="d-inline-block mt-3">
                    <CustomCheckbox
                      label="Account Balance"
                      checked={getAccountBalanceSettings(
                        'internal_payment_voucher'
                      )}
                      disabled={isDisabled}
                      style={{ border: 'none', margin: 0 }}
                      onChange={(e) =>
                        updateAccountBalanceSetting(
                          'internal_payment_voucher',
                          e.target.checked
                        )
                      }
                      readOnly={isDisabled}
                    />
                    {hasPrintPermission && (
                      <CustomCheckbox
                        label="Print"
                        checked={getPrintSettings('internal_payment_voucher')}
                        onChange={(e) => {
                          updatePrintSetting(
                            'internal_payment_voucher',
                            e.target.checked
                          );
                        }}
                        style={{ border: 'none', margin: 0 }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>
      <VoucherNavigationBar
        actionButtons={[
          { text: 'Add Rows', onClick: handleAddRows },
          {
            text: 'Update',
            onClick: handleSubmit,
            loading: isLoadingLockStatus,
          },
          { text: 'Cancel', onClick: handleCancel, variant: 'secondaryButton' },
        ]}
        loading={updateInternalPaymentVoucherMutation.isPending}
        onAttachmentClick={() => setShowAttachmentsModal(true)}
        lastVoucherNumbers={lastVoucherNumbers}
        lastVoucherNumber={23}
      />
      <CustomModal
        show={showAttachmentsModal}
        close={() => setShowAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          showModal={showAttachmentsModal}
          closeModal={() => setShowAttachmentsModal(false)}
          item={voucherData}
          deleteService={deleteInternalPaymentVoucherAttachment}
          uploadService={addInternalPaymentVoucherAttachment}
          getAttachmentsService={getInternalPaymentVoucherAttachment}
          closeUploader={() => setShowAttachmentsModal(false)}
          voucherAttachment={true}
          queryToInvalidate={['internalPaymentVoucher', searchTerm]}
          deferredMode={true}
          getUploadedFiles={(files) => {
            // Update the addedAttachments state with new files
            setAddedAttachments((prev) => ({
              ...prev,
              ...files,
            }));
            showToast('Attachments will be uploaded when voucher is updated', 'success');
            setShowAttachmentsModal(false);
          }}
          getDeletedAttachments={(attachmentId) => {
            setDeletedAttachments((prev) => [...prev, attachmentId]);
            // Remove from current files display
            setCurrentFiles((prev) => prev.filter((f) => f.id !== attachmentId));
          }}
          currentFiles={currentFiles}
          setCurrentFiles={setCurrentFiles}
        />
      </CustomModal>

      {/* VAT Out Of Scope Modal  */}
      <CustomModal
        show={showVatOutOfScopeModal}
        close={() => {
          if (formikRef.current) {
            formikRef.current.setFieldValue('vat_terms', '');
          }
          setShowVatOutOfScopeModal(false);
        }}
        hideClose={true}
      >
        <div className="text-center mb-3 mt-5">
          <h4 className="modalTitle px-5">Out Of Scope</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{ out_of_scope: outOfScope || '' }}
            onSubmit={handleVatOutOfScope}
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form>
                <div className="mb-45">
                  <CustomInput
                    name={'out_of_scope'}
                    type={'textarea'}
                    required
                    label={'Reason'}
                    rows={1}
                    value={values.out_of_scope}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.out_of_scope && errors.out_of_scope}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  <>
                    <CustomButton type="submit" text={'Submit'} />
                    <CustomButton
                      variant={'secondaryButton'}
                      text={'Cancel'}
                      type={'button'}
                      onClick={() => {
                        setShowVatOutOfScopeModal(false);
                        if (formikRef.current) {
                          formikRef.current.setFieldValue('vat_terms', '');
                        }
                      }}
                    />
                  </>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </CustomModal>
    </>
  );
};

export default EditInternalPaymentVoucher;
