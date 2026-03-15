import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
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
import { createInternalPaymentVoucher } from '../../../Services/Transaction/InternalPaymentVoucher.js';
import { getChequeNumberByBank } from '../../../Services/Transaction/JournalVoucher.js';
import { getVATType } from '../../../Services/Transaction/PaymentVoucher.js';
import useFormStore from '../../../Stores/FormStore.js';
import useSettingsStore from '../../../Stores/SettingsStore.js';
import { internalPaymentVoucherHeaders } from '../../../Utils/Constants/TableHeaders';
import { showErrorToast } from '../../../Utils/Utils.jsx';
import InternalPaymentVoucherRow from './InternalPaymentVoucherRow';
import FileDisplayList from '../../../Components/FileDisplayList/FileDisplayList.jsx';
import withModal from '../../../HOC/withModal.jsx';

const generateInitialRows = (count) => {
  const rows = {};
  Array.from({ length: count }).forEach(() => {
    const id = crypto.randomUUID();
    rows[id] = {
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
      total: '',
    };
  });
  return rows;
};
const INITIAL_STATE = generateInitialRows(5);

const NewInternalPaymentVoucher = ({
  showModal,
  isDisabled = false,
  setIsDisabled,
  setShowAddLedgerModal,
  uploadAttachmentsModal,
  setUploadAttachmentsModal,
  accountData,
  currencyOptions,
  date,
  setDate,
  lastVoucherNumbers,
  getAccountsByTypeOptions,
  getCOAAccountsByModeOptions,
  setCurrencyToSelect,
  setShowMissingCurrencyRateModal,
  onFormDataChange,
  restoreValuesFromStore,
  setPageState,
  setSearchTerm,
  setWriteTerm,
  hasPrintPermission,
}) => {
  const formikRef = useRef();
  const [rows, setRows] = useState(INITIAL_STATE);
  const [showVatOutOfScopeModal, setShowVatOutOfScopeModal] = useState(false);
  const [rowFieldErrors, setRowFieldErrors] = useState({});
  const [rowsTouched, setRowsTouched] = useState({});
  const [selectedBank, setSelectedBank] = useState(null);
  const [dueDate, setDueDate] = useState('');
  const [isDueDateEditable, setIsDueDateEditable] = useState(false);

  const [currentMode, setCurrentMode] = useState('');

  const [totalNetTotal, setTotalNetTotal] = useState(0);
  const [showSubmitError, setShowSubmitError] = useState(false);
  const [outOfScope, setOutOfScope] = useState('');
  const [currentRowForVat, setCurrentRowForVat] = useState(null);
  const {
    getPrintSettings,
    getAccountBalanceSettings,
    updateAccountBalanceSetting,
    updatePrintSetting,
  } = useSettingsStore();
  const [addedAttachments, setAddedAttachments] = useState([]);
  const queryClient = useQueryClient();
  const [isChequeFieldEnabled, setIsChequeFieldEnabled] = useState(false);
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState(null);
  const [selectedModeAccount, setSelectedModeAccount] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [hasShownModal, setHasShownModal] = useState(false);
  const [exchangeRatesInverse, setExchangeRatesInverse] = useState(false);
  const [selectedGLType, setSelectedGLType] = useState(null);



  const { getFormValues, clearFormValues, clearLastVisitedPage } =
    useFormStore();
  const formId = 'internal-payment-voucher'; // Unique identifier for this form

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
      return allModeOptions.filter(option => option.value !== 'Cash');
    }

    return allModeOptions;
  };

  const handleSubmit = async () => {
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



    // Filter out only rows with all required fields (except narration which is optional)
    // Check if VAT is applied for each row
    const validRows = Object.values(rows).filter(
      (row) => {
        const isVatApplied =
          (row.vat_percentage !== '' && row.vat_percentage !== null && row.vat_percentage !== undefined && parseFloat(row.vat_percentage) !== 0) ||
          (row.vat_amount !== '' && row.vat_amount !== null && row.vat_amount !== undefined && parseFloat(row.vat_amount) !== 0);

        return (
          row.ledger &&
          row.debit_account_id &&
          row.currency_id &&
          row.amount &&
          row.total &&
          // If VAT is applied, require VAT terms; otherwise, VAT fields are optional
          (!isVatApplied || (isVatApplied && row.vat_terms && row.vat_terms !== ''))
        );
      }
    );

    // Check for rows where VAT is applied but VAT terms are missing
    const rowsWithMissingVatTerms = Object.values(rows).filter((row) => {
      const hasRequiredFields =
        row.ledger &&
        row.debit_account_id &&
        row.currency_id &&
        row.amount &&
        row.total;

      if (!hasRequiredFields) return false;

      const isVatApplied =
        (row.vat_percentage !== '' && row.vat_percentage !== null && row.vat_percentage !== undefined && parseFloat(row.vat_percentage) !== 0) ||
        (row.vat_amount !== '' && row.vat_amount !== null && row.vat_amount !== undefined && parseFloat(row.vat_amount) !== 0);

      // Only require VAT terms if VAT is actually being applied
      return isVatApplied && (!row.vat_terms || row.vat_terms === '');
    });

    if (rowsWithMissingVatTerms.length > 0) {
      showToast('VAT Terms is required for one or more rows!', 'error');
      return;
    }

    if (validRows.length === 0) {
      setShowSubmitError(true);
      return;
    }

    // Process each row to apply VAT calculations similar to Payment Voucher
    const processedRows = validRows.map((row) => {
      // Calculate VAT amount and percentage based on conditions
      let finalVatAmount = row.vat_amount;
      let finalVatPercentage = row.vat_percentage;

      if (shouldVatAmountBeZero(row.vat_terms)) {
        finalVatAmount = 0;
        finalVatPercentage = 0;
      }

      // Check if VAT is not applied (empty, null, or 0)
      const isVatNotApplied =
        (!row.vat_percentage || row.vat_percentage === '' || parseFloat(row.vat_percentage) === 0) &&
        (!row.vat_amount || row.vat_amount === '' || parseFloat(row.vat_amount) === 0) ||
        (finalVatAmount === 0 && finalVatPercentage === 0);

      return {
        ...row,
        vat_amount: isVatNotApplied ? '' : finalVatAmount,
        vat_percentage: isVatNotApplied ? '' : finalVatPercentage,
        vat_terms: isVatNotApplied ? '' : (
          row.vat_terms ||
          (row.vat_percentage !== '' && !isNaN(row.vat_percentage)
            ? Number(row.vat_percentage)
            : '')
        ),
        vat_type: isVatNotApplied ? '' : (vatData?.vatType?.vat_type || ''), // Add VAT type
        vat_terms_id: isVatNotApplied ? '' : (row.vat_terms_id || ''), // Add VAT terms ID
        ...((row.vat_terms?.startsWith?.('A small popup') ||
          row.vat_terms?.toLowerCase() === 'out of scope') && {
          out_of_scope_reason: outOfScope,
        }),
      };
    });

    // Transform valid rows to the format expected by the API
    const transformedTransactions = processedRows?.reduce((acc, t, index) => {
      Object.entries(t).forEach(([key, value]) => {
        acc[`vats[${index}][${key}]`] = value;
      });
      return acc;
    }, {});

    // Calculate total from valid rows only
    const validRowsTotal = processedRows.reduce((sum, row) => {
      const total = parseFloat(row.total || 0);
      return sum + (isNaN(total) ? 0 : total);
    }, 0);

    const payload = {
      ...formValues,
      date,
      amount: parseFloat(validRowsTotal.toFixed(2)),
      mode: formValues.mode.charAt(0).toUpperCase() + formValues.mode.slice(1).toLowerCase(),
      due_date: dueDate,
      ...transformedTransactions,
      ...addedAttachments,
    };
    handlePairReleased()
    createInternalPaymentVoucherMutation.mutate(payload);

    // Clear validation errors after successful submission
    setRowFieldErrors({});
    setRowsTouched({});
  };

  const handleResetRows = () => {
    setIsDisabled(true);
    setRows(INITIAL_STATE); // Reset rows to initial state
    setTotalNetTotal(0); // Reset total
    setShowSubmitError(false); // Reset submit error
    if (formikRef.current) {
      formikRef.current.resetForm();
      // Clear all form validation errors
      formikRef.current.setErrors({});
      formikRef.current.setTouched({});
    }
    // Clear table validation errors
    setRowFieldErrors({});
    setRowsTouched({});
    // Clear saved form values when resetting
    clearFormValues(formId);
    clearFormValues('special-commission');
  };

  const handleRemoveFile = (file) => {
    setAddedAttachments((prevFiles) => {
      const updatedFiles = { ...prevFiles };
      delete updatedFiles[file];
      return updatedFiles;
    });
  };

  const createInternalPaymentVoucherMutation = useMutation({
    mutationFn: createInternalPaymentVoucher,
    onSuccess: (data) => {
      showToast(data.message, 'success');
      if (getPrintSettings('internal_payment_voucher')) {
        window.open(data.detail?.pdf_url, '_blank');
      }
      queryClient.invalidateQueries(['internalPaymentVoucherListing']);
      handleResetRows();
      setAddedAttachments([]); // Clear attachments after successful submission
      // Clear validation errors after successful submission
      setRowFieldErrors({});
      setRowsTouched({});
    },
    onError: (error) => {
      if (error.message == 'Voucher limit reached for this branch.') {
        showModal(
          'Cannot Create',
          'The maximum number of IPV has been reached. To create new transactions, please increase the transaction number count in the Transaction Number Register.',
          null,
          'error'
        );
      } else {
        showErrorToast(error);
      }
    },
  });

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
      vat_terms: '',
      vat_terms_id: '', // Add VAT terms ID field
      vat_type: '', // Add VAT type field
      vat_percentage: '',
      vat_amount: '',
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
    if (currencyRate) {
      pairReleasedMutation.mutate(currencyRate?.id);
    }
  };

  const handleCancel = () => {
    handlePairReleased();
    setIsDisabled(true);
    setRows(INITIAL_STATE);
    if (formikRef.current) {
      formikRef.current.resetForm();
      // Clear all form validation errors
      formikRef.current.setErrors({});
      formikRef.current.setTouched({});
    }
    // Clear table validation errors
    setRowFieldErrors({});
    setRowsTouched({});
    setTotalNetTotal(0);
    setShowSubmitError(false);
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
      showErrorToast(vatData.errorMessage);
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


  const {
    data: modeCheques,
    isLoading: isLoadingCheques, es,
  } = useQuery({
    queryKey: ['cheques', selectedBank],
    queryFn: () => getChequeNumberByBank(selectedBank),
    enabled:
      !!selectedBank && (currentMode === 'Bank' || currentMode === 'PDC'),
    staleTime: 1000 * 60 * 5,
  });



  const chequeOptions =
    Array.isArray(modeCheques) ? modeCheques.map((cheque) => ({
      label: String(cheque.cheque_number),
      value: String(cheque.cheque_number),
    })) : [];

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

  // Check for missing currency rate and show modal
  useEffect(() => {
    if (
      selectedCurrency &&
      currencyRate &&
      !currencyRate?.rate &&
      !hasShownModal
    ) {
      formikRef.current.setFieldValue('currency_id', '');
      setCurrencyToSelect(selectedCurrency);
      setShowMissingCurrencyRateModal(true);
      setHasShownModal(true);
    }
  }, [selectedCurrency, currencyRate?.rate, hasShownModal]);

  // Query
  // Get VAT Type //
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

  const vatData = {
    vatType,
    isLoadingVatType,
    isErrorVatType,
    errorVatType,
  };

  useEffect(() => {
    const total = Object.values(rows).reduce((sum, row) => {
      const net = parseFloat(row.total);
      return sum + (isNaN(net) ? 0 : net);
    }, 0);

    setTotalNetTotal(total);
  }, [rows]);

  // Restore form data from store for Rate of Exchange flow
  useEffect(() => {
    if (restoreValuesFromStore) {
      const savedFormData = getFormValues(formId);
      if (savedFormData && formikRef.current) {
        formikRef.current.setValues(savedFormData.values || {});
        if (savedFormData.values?.currency_id) {
          setSelectedCurrency(savedFormData.values.currency_id);
        }
        if (savedFormData.values?.mode) {
          setCurrentMode(savedFormData.values.mode);
        }
        if (savedFormData.values?.mode_account_id) {
          setSelectedBank(savedFormData.values.mode_account_id);
        }
        if (savedFormData.values?.due_date) {
          setDueDate(savedFormData.values.due_date);
        }
        if (savedFormData.rows) {
          setRows(savedFormData.rows);
        }
        setAddedAttachments(savedFormData.addedAttachments || []);
        setIsDisabled(false);
        clearFormValues(formId);
        clearLastVisitedPage(formId);
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

  useEffect(() => {
    // Don't show validation errors when form is disabled
    if (isDisabled) {
      setRowFieldErrors({});
      setRowsTouched({});
      setShowSubmitError(false);
      // Also clear Formik errors when disabled
      if (formikRef.current) {
        formikRef.current.setErrors({});
        formikRef.current.setTouched({});
      }
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

  return (
    <>
      <div className="d-card">
        <Formik
          innerRef={formikRef}
          initialValues={{
            ledger: '',
            account_id: '',
            cost_center_id: '',
            mode: '',
            mode_account_id: '',
            cheque_number: '',
            due_date: '',
            currency_id: '',
            amount: '',
            narration: '',
          }}
          validate={(values) => {
            const errors = {};

            // Required fields for special commission
            if (!values.ledger) errors.ledger = 'Ledger is required';
            if (!values.account_id) errors.account_id = 'Account is required';
            // if (!values.amount) errors.amount = 'Amount is required';
            if (!values.currency_id)
              errors.currency_id = 'Currency is required';
            // if (!values.commission_type)
            //   errors.commission_type = 'Commission Type is required';

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
                        placeholder2="Account"
                        className1="ledger"
                        className2="account"
                        onChange1={(selected) => {
                          if (
                            selected.label?.toLowerCase()?.startsWith('add new')
                          ) {
                            setShowAddLedgerModal(
                              selected.label?.toLowerCase()
                            );
                          } else {
                            setFieldValue('ledger', selected.value);
                            // Reset GL type when ledger changes
                            setSelectedGLType(null);
                            // Reset mode fields when ledger changes
                            setFieldValue('mode', '');
                            setFieldValue('mode_account_id', '');
                            // Reset account selections when ledger changes
                            setSelectedLedgerAccount(null);
                            setSelectedModeAccount(null);
                            // Clear account_id when ledger changes
                            setFieldValue('account_id', '');
                          }
                        }}
                        onChange2={(selected) => {
                          if (
                            selected.label?.toLowerCase()?.startsWith('add new')
                          ) {
                            setShowAddLedgerModal(
                              selected.label?.toLowerCase()
                            );
                          } else {
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
                          }
                        }}
                      />
                      <ErrorMessage
                        name="ledger"
                        component="div"
                        className="input-error-message text-danger"
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
                    {/* Combined Mode and Account Select */}
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
                        placeholder2="Account"
                        className1="mode"
                        className2="account"
                        onChange1={(selected) => {
                          setFieldValue('mode', selected.value);
                          setCurrentMode(selected.value);
                          if (selected.value === 'Online') {
                            setFieldValue('cheque_number', '');
                            setIsChequeFieldEnabled(false);
                            setDueDate('');
                            setIsDueDateEditable(false);
                          } else if (selected.value == 'Cash') {
                            setFieldValue('cheque_number', '');
                            setIsChequeFieldEnabled(false);
                            setDueDate('');
                            setIsDueDateEditable(false);
                          } else if (selected.value == 'Bank') {
                            setFieldValue('due_date', date);
                            setIsChequeFieldEnabled(true);
                            setDueDate(date);
                            setIsDueDateEditable(true);
                          } else if (selected.value == 'PDC') {
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
                          if (!values.narration) {
                            setFieldValue(
                              'narration',
                              'This is Internal Payment Voucher text for narration'
                            );
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
                          if (!values.narration) {
                            setFieldValue(
                              'narration',
                              'This is placeholder text for narration'
                            );
                          }
                        }}
                      />
                      <ErrorMessage
                        name="mode_account_id"
                        component="div"
                        className="input-error-message text-danger"
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
                    {(values.mode === 'bank' || values.mode === 'pdc') && (
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'due_date'}
                          label={'Due Date'}
                          type={'date'}
                          min={
                            values.mode == 'PDC'
                              ? new Date(
                                new Date(date).setDate(
                                  new Date(date).getDate() + 1
                                )
                              )
                                .toISOString()
                                .split('T')[0]
                              : new Date(date).toISOString().split('T')[0]
                          }
                          {...(values.mode == 'Bank' && {
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

                    {/* Combined Currency and Amount Select */}
                    <div className="col-12 col-sm-6 mb-45">
                      <CombinedInputs
                        label="Currency"
                        type1="select"
                        type2="input"
                        name1="currency_id"
                        name2="amount"
                        value1={values.currency_id}
                        value2={totalNetTotal.toFixed(2)}
                        options1={currencyOptions}
                        isDisabled={isDisabled}
                        handleBlur={handleBlur}
                        placeholder1="Currency"
                        placeholder2="Enter Amount"
                        inputType2="number"
                        className1="currency"
                        className2="amount"
                        onChange1={(selected) => {
                          setSelectedCurrency(selected.value);
                          setHasShownModal(false);
                          setFieldValue('currency_id', selected.value);
                        }}
                        onChange2={(e) => {
                          // Amount is calculated from table rows, so this is read-only
                        }}
                        inputProps2={{
                          readOnly: true,
                        }}
                        additionalProps={{
                          isLoadingCurrencyRate: isLoadingCurrencyRate,
                        }}
                      />
                      <ErrorMessage
                        name="currency_id"
                        component="div"
                        className="input-error-message text-danger"
                      />
                      <ErrorMessage
                        name="amount"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <CustomInput
                        name={'narration'}
                        label={'Narration'}
                        type={'textarea'}
                        rows={1}
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
                <div className="col-12 col-xxl-2" />
                {!isDisabled && (
                  <div className="col-12 col-lg-10 col-xl-9 col-xxl-3">
                    <div className="row">
                      <div
                        className="col-12 mb-5"
                        style={{ maxWidth: '350px' }}
                      >
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
                )}

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
                        isDisabled={isDisabled}
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
                        fieldErrors={rowFieldErrors[row.id] || {}}
                        forceShowErrors={!!rowsTouched[row.id]}
                      />
                    ))}
                  </tbody>
                </CustomTable>
                <FileDisplayList
                  files={addedAttachments}
                  onRemoveFile={handleRemoveFile}
                />
                <div className="d-flex flex-wrap justify-content-start mb-45">
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
                        disabled={isDisabled}
                        onChange={(e) =>
                          updatePrintSetting(
                            'internal_payment_voucher',
                            e.target.checked
                          )
                        }
                        readOnly={isDisabled}
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
        isDisabled={isDisabled}
        actionButtons={[
          { text: 'Add Rows', onClick: handleAddRows },
          { text: 'Save', onClick: handleSubmit },
          { text: 'Cancel', onClick: handleCancel, variant: 'secondaryButton' },
        ]}
        loading={createInternalPaymentVoucherMutation.isPending}
        onAttachmentClick={() => setUploadAttachmentsModal(true)}
        lastVoucherHeading="Last IPV Number"
        lastVoucherNumbers={lastVoucherNumbers}
        setPageState={setPageState}
        setSearchTerm={setSearchTerm}
        setWriteTerm={setWriteTerm}
      />
      {/* Upload Attachements Modal */}
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

      {/* VAT Out Of Scope Modal  */}
      <CustomModal
        show={showVatOutOfScopeModal}
        close={() => {
          if (formikRef.current) {
            formikRef.current.setFieldValue('vat_terms', '');
            formikRef.current.setFieldValue('vat_percentage', '');
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

export default withModal(NewInternalPaymentVoucher);
