import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import React, { useEffect, useRef, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import { useNavigate } from 'react-router-dom';
import AccountBalanceCard from '../../../Components/AccountBalanceCard/AccountBalanceCard';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CombinedInputs from '../../../Components/CombinedInputs/CombinedInputs.jsx';
import CustomButton from '../../../Components/CustomButton';
import CustomCheckbox from '../../../Components/CustomCheckbox/CustomCheckbox';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import ExchangeRatesCard from '../../../Components/ExchangeRatesCard/ExchangeRatesCard';
import FileDisplayList from '../../../Components/FileDisplayList/FileDisplayList.jsx';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import withModal from '../../../HOC/withModal';
import useCurrencyRate from '../../../Hooks/useCurrencyRate.js';
import {
  getAccountBalances,
  getExchangeRates,
  getCurrencyRate,
} from '../../../Services/General';
import {
  checkTransactionLockStatus,
  releaseTransaction,
} from '../../../Services/Process/TransactionLock.js';
import {
  addReceiptVoucherAttachment,
  deleteReceiptVoucherAttachment,
  getBenefeciariesByAccount,
  getReceiptVoucherListing,
  updateReceiptVoucher,
} from '../../../Services/Transaction/ReceiptVoucher';
import useFormStore from '../../../Stores/FormStore';
import useSettingsStore from '../../../Stores/SettingsStore';
import { showErrorToast } from '../../../Utils/Utils';
import {
  formatNumberWithCommas,
  formatNumberTwoDecimals,
} from '../../../Utils/Helpers';
import SpecialCommission from '../SpecialCommission/SpecialCommission';

const EditReceiptVoucher = ({
  date,
  state,
  showModal,
  getAccountsByTypeOptions,
  getCOAAccountsByModeOptions,
  currencyOptions,
  vatData,
  isDisabled = false,
  setIsDisabled,
  searchTerm,
  setPageState,
  setSearchTerm,
  setShowAddLedgerModal,
  setCurrencyToSelect,
  setShowMissingCurrencyRateModal,
  newlyCreatedAccount,
  newlyCreatedBeneficiary,
  lastVoucherNumbers,
  updatePrintSetting,
  onFormDataChange,
  permissions,
  hasViewPermission,
  hasPrintPermission,
  onMissingRateModalClose,
}) => {
  const queryClient = useQueryClient();
  const formikRef = useRef();
  const voucherName = 'receipt_voucher';

  // Access the form store
  const {
    saveFormValues,
    getFormValues,
    hasFormValues,
    clearFormValues,
    getLastVisitedPage,
    clearLastVisitedPage,
  } = useFormStore();
  const formId = 'edit-receipt-voucher'; // Unique identifier for this form

  // For getting print checkbox state from BE
  const {
    getPrintSettings,
    getAccountBalanceSettings,
    updateAccountBalanceSetting,
  } = useSettingsStore();

  const [showVatOutOfScopeModal, setShowVatOutOfScopeModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState(null);
  const [hasShownModal, setHasShownModal] = useState(false);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [outOfScope, setOutOfScope] = useState('');
  const [specialCommissionValues, setSpecialCommissionValues] = useState({});
  const [addedSpecialCommissionValues, setAddedSpecialCommissionValues] =
    useState(null);
  const [showSCModal, setShowSCModal] = useState(false);
  const [addedAttachments, setAddedAttachments] = useState({});
  const [deletedAttachments, setDeletedAttachments] = useState([]); // Track IDs of attachments to delete
  const [currentFiles, setCurrentFiles] = useState([]); // Track current files for UI display
  const filesInitializedRef = useRef(false); // Track if files have been initialized
  const [selectedModeAccount, setSelectedModeAccount] = useState(null);
  const [exchangeRatesInverse, setExchangeRatesInverse] = useState(false);

  const {
    data: { data: [receiptVoucherData] = [] } = {},
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['receiptVoucher', searchTerm],
    queryFn: () => getReceiptVoucherListing({ search: searchTerm }),
  });

  // Check Transaction lock status to enable/disable
  const { isLoading: isLoadingLockStatus, refetch: checkFormStatus } = useQuery(
    {
      queryKey: ['save_lock_status', voucherName, receiptVoucherData?.id],
      queryFn: () =>
        checkTransactionLockStatus({
          transaction_type: voucherName,
          transaction_id: receiptVoucherData?.id,
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
    if (receiptVoucherData?.id) {
      releaseTransactionMutation.mutate({
        transaction_type: voucherName,
        transaction_id: receiptVoucherData?.id,
      });
      releaseExecutedRef.current = true;
    }
  }, [receiptVoucherData?.id]);
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

  // Fetch currency rate for the selected Currency
  const { data: currencyRate, isLoading: isLoadingCurrencyRate } =
    useCurrencyRate(selectedCurrency, date);

  // Load saved form if present
  useEffect(() => {
    const lastPage = getLastVisitedPage(formId);

    if (
      lastPage === 'special-commission' &&
      hasFormValues(formId) &&
      formikRef.current
    ) {
      const savedValues = getFormValues(formId);
      let specialCommissionData = { ...savedValues };

      specialCommissionData.ledger = [
        { label: 'PL', value: 'party' },
        { label: 'GL', value: 'general' },
        { label: 'WIC', value: 'walkin' },
      ].find((x) => savedValues.ledger == x.value);
      specialCommissionData.account_id = getAccountsByTypeOptions(
        specialCommissionData?.ledger?.value
      ).find((x) => x.value == savedValues?.account_id);

      specialCommissionData.currency = currencyOptions.find(
        (x) => x.value == savedValues?.currency_id
      );

      setSpecialCommissionValues(specialCommissionData);
      formikRef.current.setValues(savedValues);
      setIsDisabled(false);
    } else if (lastPage === 'rate-of-exchange' && hasFormValues(formId) && formikRef.current) {
      // Handle returning from Rate of Exchange page
      const savedFormData = getFormValues(formId);
      const savedValues = savedFormData.values || {};
      const savedCurrencyId = savedValues.currency_id;
      const savedDate = savedFormData.date || date;

      // Check if rate was added for the currency and date
      if (savedCurrencyId) {
        getCurrencyRate(savedCurrencyId, savedDate)
          .then((rateData) => {
            if (!rateData?.rate) {
              // No rate was added, clear currency field
              if (formikRef.current) {
                formikRef.current.setFieldValue('currency_id', '');
                setSelectedCurrency(null);
              }
            } else {
              // Rate exists, restore form values
              formikRef.current.setValues(savedValues);
              setSelectedCurrency(savedCurrencyId);
              setIsDisabled(false);
            }
            clearFormValues(formId);
            clearLastVisitedPage(formId);
          })
          .catch((error) => {
            // Error checking rate, assume no rate was added and clear currency
            console.error('Error checking currency rate:', error);
            if (formikRef.current) {
              formikRef.current.setFieldValue('currency_id', '');
              setSelectedCurrency(null);
            }
            // Still restore other form values
            const { currency_id, ...otherValues } = savedValues;
            formikRef.current.setValues(otherValues);
            setIsDisabled(false);
            clearFormValues(formId);
            clearLastVisitedPage(formId);
          });
      } else {
        // No currency was saved, just restore form values
        formikRef.current.setValues(savedValues);
        setIsDisabled(false);
        clearFormValues(formId);
        clearLastVisitedPage(formId);
      }
    } else if (lastPage !== 'special-commission') {
      if (hasFormValues('special-commission')) {
        const scValues = getFormValues('special-commission');
        // Ensure currency is properly formatted
        if (scValues && (!scValues.currency || !scValues.currency.label)) {
          const currencyId = scValues.currency_id || scValues.currency?.value;
          scValues.currency = currencyOptions.find(c => c.value === currencyId) || scValues.currency;
        }
        setAddedSpecialCommissionValues(scValues);
      }
    }
    // Clear lastVisitedPage so it doesn't persist beyond one use
    clearLastVisitedPage(formId);
  }, []);

  // Update selectedCurrency when receipt voucher data changes
  useEffect(() => {
    if (receiptVoucherData?.receipt_vouchers?.amount_account_id?.id) {
      setSelectedCurrency(receiptVoucherData.receipt_vouchers.amount_account_id.id);
    }
  }, [receiptVoucherData?.receipt_vouchers?.amount_account_id?.id]);

  // Ensure currency exists in options, otherwise clear it
  useEffect(() => {
    if (receiptVoucherData?.receipt_vouchers && currencyOptions.length > 0) {
      const currencyId = receiptVoucherData.receipt_vouchers.amount_account_id?.id;
      const matchingOption = currencyOptions.find(option => option.value === currencyId);

      // If currency doesn't exist in options, clear it from form
      if (currencyId && !matchingOption && formikRef.current) {
        formikRef.current.setFieldValue('currency_id', '');
        setSelectedCurrency(null);
      }
    }
  }, [receiptVoucherData?.receipt_vouchers, currencyOptions]);

  // Additional effect to ensure currency is properly set when form values change
  useEffect(() => {
    if (formikRef.current && currencyOptions.length > 0) {
      const currentCurrencyId = formikRef.current.values.currency_id;
      const hasMatchingOption = currencyOptions.some(option => option.value === currentCurrencyId);


      // If current currency value doesn't exist in options, clear it
      if (currentCurrencyId && !hasMatchingOption) {
        formikRef.current.setFieldValue('currency_id', '');
        setSelectedCurrency(null);
      }

      // If form currency is empty but we have receipt data with valid currency, set it
      if (!currentCurrencyId && receiptVoucherData?.receipt_vouchers?.amount_account_id?.id) {
        const receiptCurrencyId = receiptVoucherData.receipt_vouchers.amount_account_id.id;
        const hasReceiptMatchingOption = currencyOptions.some(option => option.value === receiptCurrencyId);

        if (hasReceiptMatchingOption) {
          formikRef.current.setFieldValue('currency_id', receiptCurrencyId);
          setSelectedCurrency(receiptCurrencyId);
        }
      }
    }
  }, [formikRef, currencyOptions, receiptVoucherData]);

  // Update special commission values when receipt voucher data changes
  useEffect(() => {
    const lastPage = getLastVisitedPage(formId);
    let rv = receiptVoucherData?.receipt_vouchers;
    if (rv && !filesInitializedRef.current) {
      // Initialize current files from receipt voucher data only once
      const filesData = rv.files || receiptVoucherData?.files || [];
      setCurrentFiles(filesData);
      filesInitializedRef.current = true;
      setOutOfScope(rv?.out_of_scope);
      setSpecialCommissionValues({
        ledger: {
          value: rv.ledger,
          label:
            rv.ledger === 'party'
              ? 'PL'
              : rv.ledger === 'general'
                ? 'GL'
                : 'WIC',
        },
        account: {
          value: rv.account_id,
          label: rv.account_name || '',
        },
        amount: rv.amount,
        currency: {
          value: rv.amount_account_id?.id,
          label: rv.amount_account_id?.currency_code || '',
        },
        commission_type: {
          value: rv.commission_type,
          label: rv.commission_type,
        },
        date: rv.date,
      });

      // Initialize selected accounts for Account Balance Card
      setSelectedLedgerAccount({
        value: rv.account_id,
        label: rv.account_details?.title || rv.account_name || '',
        accountType: rv.ledger,
      });
      if (rv?.mode_account_id?.id) {
        setSelectedModeAccount({
          value: rv.mode_account_id.id,
          label: rv.mode_account_id?.account_name || '',
          accountType: (rv.mode || '').toLowerCase(),
        });
      }

      if (rv?.special_commission && lastPage !== 'special-commission') {
        // Map ledger type to ledger name
        const getLedgerName = (ledgerType) => {
          const ledgerMap = {
            'party': 'PL',
            'general': 'GL',
            'walkin': 'WIC'
          };
          return ledgerMap[ledgerType] || ledgerType;
        };

        // Save the SC form values with properly formatted currency
        const specialCommissionData = {
          ...rv?.special_commission,
          ledger: rv?.special_commission?.account_type,
          ledger_name: getLedgerName(rv?.special_commission?.account_type),
          distributions: [...rv?.special_commission?.commission_distribution],
          // Ensure currency is in the correct format with label and value
          currency: rv?.special_commission?.currency
            ? (typeof rv.special_commission.currency === 'object' && rv.special_commission.currency.label
              ? rv.special_commission.currency
              : currencyOptions.find(c => c.value === rv.special_commission.currency_id) || {
                value: rv.amount_account_id?.id,
                label: rv.amount_account_id?.currency_code || '',
              })
            : {
              value: rv.amount_account_id?.id,
              label: rv.amount_account_id?.currency_code || '',
            },
        };
        saveFormValues('special-commission', specialCommissionData);
        // Also update addedSpecialCommissionValues directly
        setAddedSpecialCommissionValues(specialCommissionData);
      }
    } else if (rv) {
      // If files are already initialized, just update other values
      setOutOfScope(rv?.out_of_scope);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiptVoucherData?.receipt_vouchers?.id]);

  // Check if mode is selected but account is missing when form loads
  useEffect(() => {
    if (formikRef.current && receiptVoucherData?.receipt_vouchers) {
      const rv = receiptVoucherData.receipt_vouchers;
      const mode = rv.mode;
      const modeAccountId = rv.mode_account_id?.id || rv.mode_account_id || '';

      // If mode exists but account is missing, mark as touched to show error
      if (mode && !modeAccountId) {
        // Small delay to ensure formik is initialized
        setTimeout(() => {
          if (formikRef.current) {
            formikRef.current.setFieldTouched('mode_account_id', true);
            formikRef.current.validateForm();
          }
        }, 100);
      }

      // Set default cheque_number to "Cash" for Bank/PDC modes if empty
      if ((mode === 'Bank' || mode === 'PDC') && formikRef.current) {
        const currentChequeNumber = formikRef.current.values.cheque_number;
        if (!currentChequeNumber || currentChequeNumber.trim() === '') {
          formikRef.current.setFieldValue('cheque_number', 'Cash');
        }
      }
    }
  }, [receiptVoucherData?.receipt_vouchers?.id, receiptVoucherData?.receipt_vouchers?.mode, receiptVoucherData?.receipt_vouchers?.mode_account_id]);

  useEffect(() => {
    if (lastVoucherNumbers?.current) {
      setSpecialCommissionValues((prev) => ({
        ...prev,
        current: lastVoucherNumbers?.current,
      }));
    }
    if (date) {
      setSpecialCommissionValues((prev) => ({
        ...prev,
        date: date,
      }));
      // Set due_date to date if mode is Bank
      if (formikRef.current?.values.mode === 'Bank') {
        formikRef.current.setFieldValue('due_date', date);
      }
    }
  }, [lastVoucherNumbers?.current, date]);

  // Get Benefeciaries from selected Ledger+Account
  const {
    data: beneficiaryAccounts,
    isLoading: isLoadingBeneficiary,
    isError: isErrorBeneficiary,
    error: errorBeneficiary,
  } = useQuery({
    queryKey: ['beneficiaries', selectedLedgerAccount],
    queryFn: () =>
      getBenefeciariesByAccount(
        selectedLedgerAccount?.value || selectedLedgerAccount
      ),
    enabled: !!selectedLedgerAccount,
  });

  // Make options array from the benfeciary queries call
  const getBeneficiaryOptions = (account_id) => {
    if (!account_id) {
      return [{ label: 'Select Ledger', value: null, isDisabled: true }];
    }

    const data = beneficiaryAccounts;
    const loading = isLoadingBeneficiary;
    const error = isErrorBeneficiary;
    const errorMessage = errorBeneficiary;

    if (loading) {
      return [{ label: 'Loading...', value: null, isDisabled: true }];
    }

    if (error) {
      return [{ label: 'Unable to fetch beneficiaries', value: null }];
    }
    let options =
      data?.map((x) => ({
        value: x?.id,
        label: x?.title,
      })) || [];

    options.push({
      label: `Add New Beneficiary`,
      value: null,
    });

    return options;
  };

  // Handle modal close callback - clear currency when modal is closed without action
  useEffect(() => {
    if (onMissingRateModalClose) {
      // Provide function to parent to clear currency when modal closes
      const clearCurrencyCallback = () => {
        if (formikRef.current) {
          formikRef.current.setFieldValue('currency_id', '');
        }
        setSelectedCurrency(null);
        setHasShownModal(false);
      };
      onMissingRateModalClose(clearCurrencyCallback);
    }
  }, [onMissingRateModalClose]);

  // Check for missing currency rate when currency or date changes
  useEffect(() => {
    // Reset hasShownModal when currency changes to allow re-checking
    if (selectedCurrency) {
      setHasShownModal(false);
    }
  }, [selectedCurrency]);

  // Show Missing currency rate modal if rate not present
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

  // Notify parent of form data changes (for saving before navigation)
  useEffect(() => {
    if (onFormDataChange && formikRef.current) {
      onFormDataChange({
        values: formikRef.current.values,
        addedAttachments,
      });
    }
  }, [formikRef.current?.values, addedAttachments, onFormDataChange]);

  const handleCancel = () => {
    releaseLock();
    if (formikRef.current) {
      formikRef.current.resetForm();
    }
    // Clear saved form values when resetting
    clearFormValues(formId);
    clearFormValues('special-commission');
    setAddedSpecialCommissionValues(null);
    setAddedAttachments({});
    setDeletedAttachments([]);
    // Reset files to original state and allow re-initialization
    filesInitializedRef.current = false;
    if (receiptVoucherData?.receipt_vouchers?.files || receiptVoucherData?.files) {
      setCurrentFiles(receiptVoucherData?.receipt_vouchers?.files || receiptVoucherData?.files || []);
    } else {
      setCurrentFiles([]);
    }
    setPageState('view');
  };

  const updateReceiptVoucherMutation = useMutation({
    mutationFn: ({ searchTerm, payload }) =>
      updateReceiptVoucher(searchTerm, payload),
    onSuccess: (data) => {
      showToast('Receipt Voucher Updated!', 'success');
      if (getPrintSettings('receipt_voucher')) {
        if (data?.detail?.pdf_url) {
          window.open(data.detail.pdf_url, '_blank');
        }
      }
      queryClient.invalidateQueries(['receiptVoucherListing']);
      queryClient.invalidateQueries(['receiptVoucher', searchTerm]);
      // Clear attachment tracking after successful update
      setAddedAttachments({});
      setDeletedAttachments([]);
      handleCancel();
    },
    onError: (error) => {
      console.error('Error creating Receipt Voucher', error);
      if (
        error.message.toLowerCase() ==
        'receipt voucher limit reached for this branch.'
      ) {
        showModal(
          'Cannot Create',
          'The maximum number of receipt vouchers has been reached. To create new transactions, please increase the transaction number count in the Transaction Number Register.',
          null,
          'error'
        );
      } else {
        showErrorToast(error);
      }
    },
  });

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

  // Helper function to check if commission is present
  const hasCommission = (values) => {
    return values.commission || addedSpecialCommissionValues;
  };

  // Helper function to check if VAT should be applied
  const shouldApplyVat = (values) => {
    return hasCommission(values);
  };

  // Helper function to get VAT display value
  const getVatAmountDisplayValue = (values) => {
    if (!shouldApplyVat(values)) {
      return ''; // Show empty when VAT is not applied
    }

    if (vatData.isLoadingVatType) {
      return 'Loading...';
    }

    // For exempted/zero rated/out of scope, show 0 instead of empty
    if (shouldVatAmountBeZero(values.vat_terms)) {
      return 0;
    }

    return values.vat_amount || ''; // Return raw value for CustomInput to format
  };

  // Check if VAT types match between branch and existing voucher
  const isVatTypeMismatch = () => {
    const branchVatType = vatData?.vatType?.vat_type;
    const voucherVatType = receiptVoucherData?.receipt_vouchers?.vat_type;

    // If either is missing, don't disable
    if (!branchVatType || !voucherVatType) return false;

    // Check if types are different
    return branchVatType !== voucherVatType;
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

  const handleVatOutOfScope = (values) => {
    setOutOfScope(values.out_of_scope);
    // Set VAT terms to "Out of Scope" and VAT percentage to 0
    if (formikRef.current) {
      formikRef.current.setFieldValue('vat_terms', 'Out of Scope');
      formikRef.current.setFieldValue('vat_percentage', 0);
      formikRef.current.setFieldValue('vat_amount', 0);

      // Find the "Out of Scope" option and set its ID
      const outOfScopeOption = getVATTermsOptions().find(option =>
        option.title?.toLowerCase().includes('out of scope') ||
        option.percentage?.toString().startsWith('A small popup will appear')
      );
      if (outOfScopeOption) {
        formikRef.current.setFieldValue('vat_terms_id', outOfScopeOption.id);
      }
    }
    setShowVatOutOfScopeModal(false);
  };

  const handleSubmit = async () => {
    if (!formikRef.current) return;
    // Validate the form
    const errors = await formikRef.current.validateForm();

    // Enhanced VAT validation: If commission is used, VAT must be properly configured
    const formValues = formikRef.current.values;
    const hasCommissionValue = hasCommission(formValues);

    // Ledger validation - must be selected first
    if (!formValues.ledger) {
      errors.ledger = 'Ledger is required';
    }

    // Account validation - only required if ledger is selected
    if (formValues.ledger && !formValues.account_id) {
      errors.account_id = 'Account is required';
    }

    // Currency validation - must be selected first
    if (!formValues.currency_id) {
      errors.currency_id = 'Currency is required';
    }

    // Amount validation - only required if currency is selected
    if (formValues.currency_id && !formValues.amount) {
      errors.amount = 'Amount is required';
    }
    // Amount must be greater than zero
    if (formValues.currency_id && formValues.amount) {
      const amountValue = parseFloat(formValues.amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        errors.amount = 'Amount must be greater than zero';
      }
    }

    // Explicit validation for Mode and Account
    if (!formValues.mode) {
      errors.mode = 'Mode is required';
    }
    // Strict validation: mode_account_id must be a valid positive number/ID
    if (formValues.mode) {
      const modeAccountId = formValues.mode_account_id;
      if (!modeAccountId ||
        modeAccountId === '' ||
        modeAccountId === null ||
        modeAccountId === undefined ||
        modeAccountId === 0 ||
        (typeof modeAccountId === 'string' && modeAccountId.trim() === '')) {
        errors.mode_account_id = 'Account is required';
      }
    }

    if (hasCommissionValue) {
      // Commission is present, VAT must be configured
      if (vatData?.vatType?.vat_type === 'variable' || (isVatTypeMismatch() && receiptVoucherData?.receipt_vouchers?.vat_type === 'variable')) {
        // Check if vat_terms_id is truly empty (not 0, which could be valid)
        // Also ensure vat_terms is not already set (to avoid showing error when value exists)
        if ((formValues.vat_terms_id === '' || formValues.vat_terms_id === null || formValues.vat_terms_id === undefined) && !formValues.vat_terms) {
          errors.vat_terms = 'VAT % is required';
        }
        // Additional validation for VAT Amount when variable VAT type
        // For VAT amount, 0 is valid for exempted cases, only check if truly empty
        if (formValues.vat_amount === '' || formValues.vat_amount === null || formValues.vat_amount === undefined) {
          errors.vat_amount = 'VAT Amount is required';
        }
      } else if (vatData?.vatType?.vat_type === 'fixed' || (isVatTypeMismatch() && receiptVoucherData?.receipt_vouchers?.vat_type === 'fixed')) {
        // For fixed VAT, ensure VAT percentage is available
        if (!vatData?.vatType?.vat_percentage && !receiptVoucherData?.receipt_vouchers?.vat_percentage) {
          errors.vat_terms = 'VAT configuration is missing for fixed VAT type';
        }
      }

      // Commission Type validation - only required for normal commission, not special commission
      // If normal commission exists (not special commission), commission_type is required
      if (formValues.commission && !formValues.commission_type && !addedSpecialCommissionValues) {
        errors.commission_type = 'Please select Commission Type';
      }
    }

    // Final validation check - ensure mode_account_id is NEVER empty when mode exists
    // This is a critical check that MUST prevent submission
    if (formValues.mode) {
      const modeAccountId = formValues.mode_account_id;
      // Check all possible empty/falsy values
      const isEmpty = !modeAccountId ||
        modeAccountId === '' ||
        modeAccountId === null ||
        modeAccountId === undefined ||
        modeAccountId === 0 ||
        (typeof modeAccountId === 'string' && modeAccountId.trim() === '');

      if (isEmpty) {
        errors.mode_account_id = 'Account is required';
      }
    }

    // CRITICAL: Do not proceed if there are ANY errors
    if (Object.keys(errors).length > 0) {
      // Mark all fields as touched to show errors
      formikRef.current.setTouched(
        Object.keys(errors).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {})
      );
      // Show toast for critical errors
      if (errors.mode_account_id) {
        showToast('Please select an account for the selected mode', 'error');
      }
      // ABSOLUTELY prevent submission - return early
      return; // Do not submit if there are errors
    }

    // Double-check mode_account_id before proceeding - final safety check
    if (formValues.mode) {
      const modeAccountId = formValues.mode_account_id;
      const isEmpty = !modeAccountId ||
        modeAccountId === '' ||
        modeAccountId === null ||
        modeAccountId === undefined ||
        modeAccountId === 0 ||
        (typeof modeAccountId === 'string' && modeAccountId.trim() === '');

      if (isEmpty) {
        showToast('Account is required for the selected mode', 'error');
        formikRef.current.setFieldTouched('mode_account_id', true);
        formikRef.current.setFieldError('mode_account_id', 'Account is required');
        return; // Prevent submission
      }
    }
    // run status check first
    const { error: errorLockStatus } = await checkFormStatus();

    if (errorLockStatus?.detail?.locked) {
      showToast(errorLockStatus?.message, 'warn');
      return;
    }

    // Calculate VAT amount and percentage based on conditions - only if commission is applied
    let finalVatAmount = 0;
    let finalVatPercentage = 0;

    if (hasCommissionValue) {
      finalVatAmount = formValues.vat_amount || 0;
      finalVatPercentage = formValues.vat_percentage || 0;

      if (shouldVatAmountBeZero(formValues.vat_terms)) {
        finalVatAmount = 0;
        finalVatPercentage = 0;
      }
    }


    // Determine which VAT type to send (only if commission is applied)
    let vatTypeToSend = '';
    let vatTermsIdPayload = {};

    if (hasCommissionValue) {
      // If branch and voucher VAT types are the same, send branch VAT type
      // If they are different, send voucher VAT type (preserve original)
      vatTypeToSend = isVatTypeMismatch()
        ? receiptVoucherData?.receipt_vouchers?.vat_type  // Different: use voucher's VAT type
        : (vatData?.vatType?.vat_type || receiptVoucherData?.receipt_vouchers?.vat_type || ''); // Same: use branch's VAT type


      // Validate and prepare VAT terms ID
      // Check if the vat_terms_id is valid in current branch's VAT terms
      const isValidInCurrentBranch = vatData?.vatType?.vats?.some(
        vat => vat.id === formValues.vat_terms_id
      );

      // IMPORTANT: If voucher's VAT type is 'variable', vat_terms_id is REQUIRED by backend
      if (vatTypeToSend === 'variable') {
        // For variable VAT type vouchers, vat_terms_id is mandatory
        if (formValues.vat_terms_id && !isNaN(formValues.vat_terms_id) && formValues.vat_terms_id !== '') {
          // Check if it's valid in current branch first
          if (isValidInCurrentBranch) {
            // Use existing vat_terms_id only if valid
            vatTermsIdPayload = { vat_terms_id: formValues.vat_terms_id };
          } else if (vatData?.vatType?.vat_type === 'variable' && vatData?.vatType?.vats && vatData.vatType.vats.length > 0) {
            // If not valid, use first available from current branch
            vatTermsIdPayload = { vat_terms_id: vatData.vatType.vats[0].id };
          }
        } else if (vatData?.vatType?.vat_type === 'variable' && vatData?.vatType?.vats && vatData.vatType.vats.length > 0) {
          // If somehow not set, use first available VAT term
          vatTermsIdPayload = { vat_terms_id: vatData.vatType.vats[0].id };
        }
      } else if (vatTypeToSend === 'fixed') {
        // For fixed VAT type, vat_terms_id is optional - only include if valid
        if (formValues.vat_terms_id && !isNaN(formValues.vat_terms_id) && formValues.vat_terms_id !== '' && isValidInCurrentBranch) {
          vatTermsIdPayload = { vat_terms_id: formValues.vat_terms_id };
        }
      }

    }

    // Create a copy of formValues without vat_terms_id (we'll add it back conditionally)
    // Also exclude commission fields if special commission exists - they'll be sent within special_commission
    const {
      vat_terms_id: _,
      commission_type: _ct,
      commission: _c,
      commission_amount: _ca,
      ...formValuesWithoutVatTermsId
    } = formValues;

    // Set cheque_number to "Cash" if empty for Bank or PDC modes
    let chequeNumber = formValues.cheque_number;
    if ((formValues.mode === 'Bank' || formValues.mode === 'PDC') && (!chequeNumber || chequeNumber.trim() === '')) {
      chequeNumber = 'Cash';
      // Update the field value to show "Cash" in the input after submission
      if (formikRef.current) {
        formikRef.current.setFieldValue('cheque_number', 'Cash');
      }
    }

    let payload = {
      date,
      ...formValuesWithoutVatTermsId,
      ...(addedAttachments || {}),
      ...((formValues.vat_terms?.startsWith?.('A small popup') ||
        formValues.vat_terms?.toLowerCase() === 'out of scope') && {
        out_of_scope_reason: outOfScope,
      }),
      mode: formValues.mode.charAt(0).toUpperCase() + formValues.mode.slice(1),
      cheque_number: chequeNumber,
    };

    // Include deleted attachments in payload if any
    if (deletedAttachments && deletedAttachments.length > 0) {
      deletedAttachments.forEach((attachmentId, index) => {
        payload[`deleted_attachments[${index}]`] = attachmentId;
      });
    }

    // Only include VAT fields if commission is applied
    if (hasCommissionValue) {
      payload = {
        ...payload,
        vat_amount: finalVatAmount,
        vat_percentage: finalVatPercentage,
        vat_terms:
          formValues.vat_terms ||
          (formValues.vat_percentage !== '' && !isNaN(formValues.vat_percentage)
            ? Number(formValues.vat_percentage)
            : ''),
        vat_type: vatTypeToSend,
        ...vatTermsIdPayload, // Only include vat_terms_id if it's valid
      };

      // If Special Commission exists, don't include normal commission fields
      // They will be sent within special_commission flattened structure
      if (!addedSpecialCommissionValues) {
        // Normal commission: include commission_type, commission, commission_amount
        payload = {
          ...payload,
          commission_type: formValues.commission_type,
          commission: formValues.commission,
          commission_amount: formValues.commission_amount,
        };
      }
    }
    // Flatten Special Commission similar to PV/FCD
    if (addedSpecialCommissionValues) {
      const scConverted = {};

      // Capitalize commission_type if it's lowercase (from API)
      const normalizedCommissionType = addedSpecialCommissionValues.commission_type
        ? addedSpecialCommissionValues.commission_type.charAt(0).toUpperCase() +
        addedSpecialCommissionValues.commission_type.slice(1).toLowerCase()
        : '';

      const sc = {
        transaction_no:
          lastVoucherNumbers?.current || lastVoucherNumbers?.last || '',
        date,
        ledger: formValues.ledger,
        account_id: formValues.account_id,
        currency_id: formValues.currency_id,
        amount: formValues.amount,
        ...addedSpecialCommissionValues,
        commission_type: normalizedCommissionType, // Override with normalized value
      };
      for (const key in sc) {
        if (key === 'distributions' && Array.isArray(sc[key])) {
          sc[key].forEach((item, index) => {
            for (const subKey in item) {
              scConverted[
                `special_commission[distribution][${index}][${subKey}]`
              ] = item[subKey];
            }
          });
        } else {
          scConverted[`special_commission[${key}]`] = sc[key];
        }
      }
      payload = { ...payload, ...scConverted };
    }
    updateReceiptVoucherMutation.mutate({ searchTerm, payload });
  };
  const handleNavigateToSpecialCommissionPage = async () => {
    if (!formikRef.current) return;

    // Check required fields for Special Commission
    const formValues = formikRef.current.values;
    const touchedFields = { ...formikRef.current.touched };
    let hasErrors = false;

    // Check Ledger - always show if missing
    if (!formValues.ledger) {
      touchedFields.ledger = true;
      hasErrors = true;
    }

    // Check Account - only if Ledger is selected
    if (formValues.ledger && !formValues.account_id) {
      touchedFields.account_id = true;
      hasErrors = true;
    }

    // Check Currency - always show if missing
    if (!formValues.currency_id) {
      touchedFields.currency_id = true;
      hasErrors = true;
    }

    // Check Amount - only if Currency is selected
    // When Currency is selected, ensure Amount field is also marked as touched
    if (formValues.currency_id && !formValues.amount) {
      touchedFields.currency_id = true; // Keep currency touched
      touchedFields.amount = true;
      hasErrors = true;
    }

    // Only check these 4 fields for Special Commission modal
    // Ignore all other validation errors (mode, commission_amount, vat_amount, etc.)
    if (hasErrors) {
      formikRef.current.setTouched(touchedFields);
      return;
    }

    setShowSCModal(true);
  };

  // Remove a newly added (local) attachment before final save
  const handleRemoveAttachedFile = (file) => {
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
    setDeletedAttachments((prev) => [...prev, attachmentId]);
    // Remove from current files display
    setCurrentFiles((prev) => prev.filter((f) => f.id !== attachmentId));
  };


  if (isError) {
    console.log(error);
  }

  if (isLoading) {
    return (
      <div className="d-card ">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <div className="row mb-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="col-12 col-sm-6 mb-3 align-items-center"
                  style={{ height: 56 }}
                >
                  <Skeleton
                    style={{ marginTop: 28 }}
                    duration={1}
                    width={'50%'}
                    baseColor="#ddd"
                    height={22}
                  />
                </div>
              ))}
              <div
                className="col-12 mb-3 align-items-center"
                style={{ height: 56 }}
              >
                <Skeleton
                  style={{ marginTop: 28 }}
                  duration={1}
                  width={'100%'}
                  baseColor="#ddd"
                  height={22}
                />
              </div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="col-12 col-sm-6 mb-3 align-items-center"
                  style={{ height: 56 }}
                >
                  <Skeleton
                    style={{ marginTop: 28 }}
                    duration={1}
                    width={'50%'}
                    baseColor="#ddd"
                    height={22}
                  />
                </div>
              ))}
              <div
                className="col-12 mb-3 align-items-center"
                style={{ height: 56 }}
              >
                <Skeleton
                  style={{ marginTop: 28 }}
                  duration={1}
                  width={'100%'}
                  baseColor="#ddd"
                  height={22}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
      getAccountBalanceSettings('receipt_voucher'),
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
      getAccountBalanceSettings('receipt_voucher'),
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

  return (
    <>
      <div className="d-card">
        <Formik
          innerRef={formikRef}
          initialValues={{
            ledger: receiptVoucherData?.receipt_vouchers.ledger || '',
            account_id: receiptVoucherData?.receipt_vouchers.account_id || '',
            received_from:
              receiptVoucherData?.receipt_vouchers.received_from?.id || '',
            mode: receiptVoucherData?.receipt_vouchers.mode || '',
            mode_account_id:
              receiptVoucherData?.receipt_vouchers.mode_account_id?.id ||
              receiptVoucherData?.receipt_vouchers.mode_account_id ||
              '',
            party_bank: receiptVoucherData?.receipt_vouchers.party_bank || '',
            cheque_number: (() => {
              const mode = receiptVoucherData?.receipt_vouchers.mode || '';
              const chequeNumber = receiptVoucherData?.receipt_vouchers.cheque_number || '';
              // Set default to "Cash" if mode is Bank or PDC and cheque_number is empty
              if ((mode === 'Bank' || mode === 'PDC') && (!chequeNumber || chequeNumber.trim() === '')) {
                return 'Cash';
              }
              return chequeNumber;
            })(),
            due_date: receiptVoucherData?.receipt_vouchers.due_date || '',
            narration: receiptVoucherData?.receipt_vouchers.narration || '',

            amount: receiptVoucherData?.receipt_vouchers.amount || '',
            currency_id:
              receiptVoucherData?.receipt_vouchers.amount_account_id?.id || '',
            commission_type:
              receiptVoucherData?.receipt_vouchers.commission_type || '',
            commission: receiptVoucherData?.receipt_vouchers.commission || '',
            vat_terms: receiptVoucherData?.receipt_vouchers.vat_terms || '',
            vat_terms_id:
              receiptVoucherData?.receipt_vouchers.vat_terms_id || '', // Add VAT terms ID field
            vat_percentage:
              receiptVoucherData?.receipt_vouchers.vat_percentage || '',
            vat_amount: receiptVoucherData?.receipt_vouchers.vat_amount || '',
            net_total: receiptVoucherData?.receipt_vouchers.net_total || '',
            comment: receiptVoucherData?.receipt_vouchers.comment || '',
            commission_amount:
              receiptVoucherData?.receipt_vouchers.commission_amount || '',
          }}
          validate={(values) => {
            const errors = {};

            // Ledger validation - must be selected first
            if (!values.ledger) {
              errors.ledger = 'Ledger is required';
            }

            // Account validation - only required if ledger is selected
            if (values.ledger && !values.account_id) {
              errors.account_id = 'Account is required';
            }

            // Currency validation - must be selected first
            if (!values.currency_id) {
              errors.currency_id = 'Currency is required';
            }

            // Amount validation - only required if currency is selected
            if (values.currency_id && !values.amount) {
              errors.amount = 'Amount is required';
            }
            // Amount must be greater than zero
            if (values.currency_id && values.amount) {
              const amountValue = parseFloat(values.amount);
              if (isNaN(amountValue) || amountValue <= 0) {
                errors.amount = 'Amount must be greater than zero';
              }
            }

            if (!values.narration) errors.narration = 'Narration is required';
            if (!values.mode) errors.mode = 'Mode is required';
            // Strict validation: mode_account_id must be a valid positive number/ID
            if (values.mode) {
              const modeAccountId = values.mode_account_id;
              if (!modeAccountId ||
                modeAccountId === '' ||
                modeAccountId === null ||
                modeAccountId === undefined ||
                modeAccountId === 0 ||
                (typeof modeAccountId === 'string' && modeAccountId.trim() === '')) {
                errors.mode_account_id = 'Account is required';
              }
            }



            // Enhanced VAT validation - only required if commission is used
            if (hasCommission(values)) {
              // Check VAT type: if voucher was created with different VAT type than branch, preserve voucher's type
              const effectiveVatType = isVatTypeMismatch()
                ? receiptVoucherData?.receipt_vouchers?.vat_type
                : vatData?.vatType?.vat_type;

              if (effectiveVatType === 'variable') {
                // Check if vat_terms_id is truly empty (not 0, which could be valid)
                // Also ensure vat_terms is not already set (to avoid showing error when value exists)
                if ((values.vat_terms_id === '' || values.vat_terms_id === null || values.vat_terms_id === undefined) && !values.vat_terms) {
                  errors.vat_terms = 'VAT % is required';
                }
              }

              // VAT Amount validation for both fixed and variable types when commission is applied
              // For VAT amount, 0 is valid for exempted cases, only check if truly empty or 0 when it shouldn't be
              const isVatExempted = shouldVatAmountBeZero(values.vat_terms);
              const commissionAmount = parseFloat(values.commission_amount || values.commission || addedSpecialCommissionValues?.total_commission) || 0;

              if (values.vat_amount === '' || values.vat_amount === null || values.vat_amount === undefined) {
                errors.vat_amount = 'VAT Amount is required';
              } else if (!isVatExempted && commissionAmount > 0 && (parseFloat(values.vat_amount) === 0 || !values.vat_amount)) {
                // Show error if VAT amount is 0 when commission exists and VAT is not exempted
                errors.vat_amount = 'VAT Amount is required';
              }
            }

            // Commission Type validation - only required for normal commission, not special commission
            // If normal commission exists (not special commission), commission_type is required
            if (values.commission && !values.commission_type && !addedSpecialCommissionValues) {
              errors.commission_type = 'Please select Commission Type';
            }

            if (values.commission !== '' && isNaN(values.commission)) {
              errors.commission = 'Amount must be a number';
            }

            // Commission amount validation - should not exceed base amount
            if (values.commission_amount && values.amount) {
              const commissionAmount = parseFloat(values.commission_amount) || 0;
              const baseAmount = parseFloat(values.amount) || 0;
              if (commissionAmount > baseAmount) {
                errors.commission_amount = 'Commission amount cannot exceed base amount';
              }
              if (commissionAmount < 0) {
                errors.commission_amount = 'Commission amount must be greater than or equal to 0';
              }
            }

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
            setFieldTouched,
            validateForm,
          }) => {
            // --- VAT Calculation useEffect inside Formik render ---
            React.useEffect(() => {
              // Only calculate VAT if commission is applied
              const hasCommissionValue = hasCommission(values);

              let vatPercentage = 0;
              let vatAmount = 0;

              if (hasCommissionValue) {
                // Determine effective VAT percentage based on VAT type
                const effectiveVatType = isVatTypeMismatch()
                  ? receiptVoucherData?.receipt_vouchers?.vat_type
                  : vatData?.vatType?.vat_type;

                if (effectiveVatType === 'fixed') {
                  // For fixed VAT, use voucher's VAT percentage if it exists, otherwise use branch's
                  vatPercentage = receiptVoucherData?.receipt_vouchers?.vat_percentage ||
                    vatData.vatType?.vat_percentage ||
                    (!isNaN(values.vat_percentage) ? values.vat_percentage : 0);
                } else {
                  // For variable VAT, use the selected VAT percentage
                  vatPercentage = !isNaN(values.vat_percentage) ? values.vat_percentage : 0;
                }

                // Calculate VAT on commission amount
                if (shouldVatAmountBeZero(values.vat_terms)) {
                  vatAmount = 0;
                } else if (values.amount && vatPercentage) {
                  // Determine commission amount (normal commission or special commission)
                  let commissionAmount = 0;
                  if (values.commission) {
                    // Normal commission: calculate from percentage
                    commissionAmount = (parseFloat(values.commission) / 100) * parseFloat(values.amount);
                  } else if (addedSpecialCommissionValues?.total_commission) {
                    // Special commission: use the total commission amount
                    commissionAmount = addedSpecialCommissionValues.total_commission;
                  }

                  // Calculate VAT on commission amount
                  if (commissionAmount > 0) {
                    vatAmount = (commissionAmount * vatPercentage) / 100;
                  }
                }
              }

              // Only set VAT amount if commission is present, otherwise leave empty
              if (hasCommissionValue) {
                // For exempted/zero rated/out of scope, set 0 instead of empty
                if (shouldVatAmountBeZero(values.vat_terms)) {
                  setFieldValue('vat_amount', 0);
                } else {
                  setFieldValue('vat_amount', vatAmount);
                }
              } else {
                setFieldValue('vat_amount', ''); // Empty when no commission
              }

              // Calculate commission on base amount only (not VAT-inclusive)
              let commissionAmount = 0;
              let finalCommissionAmount = 0;

              if (values.commission && values.amount) {
                // Normal commission calculated on base amount only
                commissionAmount = (parseFloat(values.commission) / 100) * parseFloat(values.amount);
                // Round to avoid floating-point precision issues (round to 8 decimal places)
                commissionAmount = Math.round(commissionAmount * 100000000) / 100000000;
                // Ensure commission amount doesn't exceed base amount
                const baseAmount = parseFloat(values.amount);
                if (commissionAmount > baseAmount) {
                  commissionAmount = baseAmount;
                }
                // Commission Amount field shows only Commission Amount (not VAT + Commission)
                setFieldValue('commission_amount', commissionAmount);
                finalCommissionAmount = commissionAmount;
              } else if (addedSpecialCommissionValues?.total_commission) {
                // Special commission: use the total commission amount
                finalCommissionAmount = addedSpecialCommissionValues.total_commission;
                // For Special Commission, keep commission_amount empty in main field
                setFieldValue('commission_amount', '');
              }

              // Calculate Net Total: Currency Amount + VAT Amount + Commission Amount
              let netTotal = '';
              if (values.amount) {
                const baseAmount = parseFloat(values.amount);
                const vatAmountToAdd = hasCommissionValue ? parseFloat(vatAmount || 0) : 0;
                const commissionAmountToAdd = parseFloat(finalCommissionAmount || 0);

                netTotal = Math.round(
                  (baseAmount - vatAmountToAdd - commissionAmountToAdd - Number.EPSILON) * 1000000
                ) / 1000000;
                setFieldValue('net_total', netTotal);
              }
            }, [
              addedSpecialCommissionValues?.total_commission,
              values.commission_amount,
              values.commission,
              values.amount,
              values.vat_percentage,
              values.vat_terms,
              vatData.vatType?.vat_percentage,
              receiptVoucherData?.receipt_vouchers?.vat_percentage,
              setFieldValue,
            ]);
            // Ensure vat_percentage is synced for fixed VAT type - only if commission is applied
            React.useEffect(() => {
              const hasCommissionValue = hasCommission(values);
              const effectiveVatType = isVatTypeMismatch()
                ? receiptVoucherData?.receipt_vouchers?.vat_type
                : vatData?.vatType?.vat_type;

              if (
                hasCommissionValue &&
                effectiveVatType === 'fixed' &&
                !values.vat_percentage
              ) {
                // Set VAT percentage from voucher or branch
                const vatPercentage = receiptVoucherData?.receipt_vouchers?.vat_percentage ||
                  vatData?.vatType?.vat_percentage;
                if (vatPercentage !== undefined && vatPercentage !== null) {
                  setFieldValue('vat_percentage', vatPercentage);
                  setFieldValue('vat_terms', 'Fixed');
                  // For fixed VAT type, set the first available VAT term ID if available
                  if (vatData?.vatType?.vats && vatData.vatType.vats.length > 0) {
                    setFieldValue('vat_terms_id', vatData.vatType.vats[0].id);
                  }
                }
              }
            }, [
              values.commission,
              addedSpecialCommissionValues,
              vatData?.vatType?.vat_type,
              vatData?.vatType?.vat_percentage,
              vatData?.vatType?.vats,
              receiptVoucherData?.receipt_vouchers?.vat_type,
              receiptVoucherData?.receipt_vouchers?.vat_percentage,
              values.vat_percentage,
              values.vat_terms,
              setFieldValue,
            ]);
            // --- End VAT Calculation useEffect ---
            return (
              <Form>
                <div className="row">
                  <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
                    <div className="row">
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
                              selected.label
                                ?.toLowerCase()
                                ?.startsWith('add new')
                            ) {
                              setShowAddLedgerModal(
                                selected.label?.toLowerCase()
                              );
                            } else {
                              setFieldValue('ledger', selected.value);
                              // Clear account_id and dependent fields when ledger changes to ensure correct accounts are shown
                              setFieldValue('account_id', '');
                              setFieldValue('received_from', '');
                              setSelectedLedgerAccount(null);
                              setSpecialCommissionValues((prev) => ({
                                ...prev,
                                ledger: selected,
                                account_id: '',
                              }));
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
                                accountType: values.ledger,
                              });
                              setSpecialCommissionValues((prev) => ({
                                ...prev,
                                account_id: selected,
                              }));
                            }
                          }}
                        />
                        <ErrorMessage
                          name="ledger"
                          component="div"
                          className="input-error-message text-danger"
                        />
                        <ErrorMessage
                          name="account_id"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>
                      <div className="col-12 col-sm-6 mb-45">
                        <SearchableSelect
                          name={'received_from'}
                          label={'Received From'}
                          options={getBeneficiaryOptions(values.account_id)}
                          isDisabled={isDisabled}
                          placeholder={'Select Received From'}
                          value={
                            values.received_from || newlyCreatedBeneficiary?.id
                          }
                          onChange={(selected) => {
                            if (
                              selected.label
                                ?.toLowerCase()
                                ?.startsWith('add new')
                            ) {
                              setShowAddLedgerModal(
                                selected.label?.toLowerCase()
                              );
                            } else {
                              setFieldValue('received_from', selected.value);
                            }
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
                          options1={[
                            {
                              label: 'Cash',
                              value: 'Cash',
                            },
                            {
                              label: 'Bank',
                              value: 'Bank',
                            },
                            {
                              label: 'PDC',
                              value: 'PDC',
                            },
                            {
                              label: 'Online',
                              value: 'Online',
                            },
                          ]}
                          options2={getCOAAccountsByModeOptions(values.mode)}
                          isDisabled={isDisabled}
                          handleBlur={handleBlur}
                          placeholder1="Mode"
                          placeholder2="Account"
                          className1="mode"
                          className2="account"
                          onChange1={(selected) => {
                            setFieldValue('mode', selected.value, true);
                            setFieldTouched('mode', true);
                            // Clear mode_account_id when mode changes to force re-selection
                            setFieldValue('mode_account_id', '');
                            setSelectedModeAccount(null);
                            // Always mark account as touched when mode is selected to show error if empty
                            if (selected.value) {
                              setFieldTouched('mode_account_id', true);
                              // Validate immediately to show account error if empty
                              setTimeout(() => {
                                validateForm();
                              }, 0);
                            }
                            if (selected.value === 'Online') {
                              setFieldValue('cheque_number', '');
                            } else if (selected.value == 'Cash') {
                              setFieldValue('cheque_number', '');
                              setFieldValue('party_bank', '');
                            } else if (selected.value == 'Bank') {
                              setFieldValue('due_date', date);
                              // Always set to "Cash" as default for Bank mode
                              setFieldValue('cheque_number', 'Cash');
                            } else if (selected.value == 'PDC') {
                              setFieldValue(
                                'due_date',
                                new Date(
                                  new Date(date).setDate(
                                    new Date(date).getDate() + 1
                                  )
                                )
                                  .toISOString()
                                  .split('T')[0]
                              );
                              // Always set to "Cash" as default for PDC mode
                              setFieldValue('cheque_number', 'Cash');
                            }
                          }}
                          onChange2={(selected) => {
                            const accountId = selected?.value || '';
                            setFieldValue('mode_account_id', accountId, true);
                            setFieldTouched('mode_account_id', true);
                            // Validate immediately to show/clear error
                            setTimeout(() => {
                              validateForm();
                            }, 0);
                            if (!values.narration) {
                              setFieldValue(
                                'narration',
                                'This is placeholder text for narration'
                              );
                            }
                            if (accountId) {
                              setSelectedModeAccount({
                                value: accountId,
                                label: selected.label,
                                accountType: (values.mode || '').toLowerCase(),
                              });
                            } else {
                              setSelectedModeAccount(null);
                            }
                          }}
                        />
                        <ErrorMessage
                          name="mode"
                          component="div"
                          className="input-error-message text-danger"
                        />
                        <ErrorMessage
                          name="mode_account_id"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>
                      {(values.mode === 'Bank' || values.mode === 'Online' || values.mode === 'PDC') && (
                        <div className="col-12 col-sm-6 mb-3">
                          <CustomInput
                            name={'party_bank'}
                            label={'Party Bank'}
                            disabled={isDisabled}
                            placeholder={'Enter Party Bank'}
                            value={values.party_bank}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />

                        </div>
                      )}
                      {(values.mode === 'Bank' || values.mode === 'PDC') && (
                        <div className="col-12 col-sm-6 mb-3">
                          <CustomInput
                            name={'cheque_number'}
                            label={'Cheque Number'}
                            disabled={isDisabled}
                            placeholder={'Cash'}
                            value={values.cheque_number || ''}
                            onChange={handleChange}
                            onBlur={(e) => {
                              handleBlur(e);
                              // If field is empty on blur, revert to "Cash"
                              if (!e.target.value || e.target.value.trim() === '') {
                                setFieldValue('cheque_number', 'Cash');
                              }
                            }}

                          />

                        </div>
                      )}
                      {(values.mode === 'Bank' || values.mode === 'PDC') && (
                        <div className="col-12 col-sm-6 mb-3">
                          <CustomInput
                            name={'due_date'}
                            label={'Due Date'}
                            type={'date'}


                            disabled={
                              isDisabled ||
                              !(values.mode === 'Bank' || values.mode == 'PDC')
                            }
                            value={values.due_date}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.due_date && errors.due_date}
                          />
                        </div>
                      )}
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
                      {/* Combined Currency and Amount Select */}
                      <div className="col-12 col-sm-6 mb-45">
                        <CombinedInputs
                          label="Currency"
                          type1="select"
                          type2="input"
                          name1="currency_id"
                          name2="amount"
                          value1={(() => {
                            // Get the current currency value
                            const currentValue = values.currency_id;

                            // Find the matching option in currencyOptions
                            const matchingOption = currencyOptions.find(option => option.value === currentValue);
                            // Return the matching option object if found, otherwise return empty string
                            return matchingOption || '';
                          })()}
                          value2={values.amount}
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
                            setSpecialCommissionValues((prev) => ({
                              ...prev,
                              currency: selected,
                            }));

                            // Recalculate Special Commission if it exists and currency changed
                            if (addedSpecialCommissionValues && values.amount) {
                              const commissionPercentage = parseFloat(addedSpecialCommissionValues.commission) || 0;
                              const amount = parseFloat(values.amount) || 0;
                              const newTotalCommission = (commissionPercentage / 100) * amount;

                              // Recalculate distribution amounts based on percentages
                              let updatedDistributions = [];
                              if (addedSpecialCommissionValues.distributions && Array.isArray(addedSpecialCommissionValues.distributions)) {
                                updatedDistributions = addedSpecialCommissionValues.distributions.map(dist => {
                                  const percentage = parseFloat(dist.percentage) || 0;
                                  const newAmount = (percentage * newTotalCommission) / 100;
                                  return {
                                    ...dist,
                                    amount: Math.round(newAmount * 100) / 100, // Round to 2 decimal places
                                  };
                                });
                              }

                              // Update Special Commission values with new currency and recalculated commission
                              setAddedSpecialCommissionValues((prev) => ({
                                ...prev,
                                currency_id: selected.value,
                                currency: selected,
                                amount: amount,
                                total_commission: newTotalCommission,
                                distributions: updatedDistributions.length > 0 ? updatedDistributions : prev.distributions,
                              }));
                            }
                          }}
                          onChange2={(e) => {
                            handleChange(e);
                            let amount = parseFloat(e.target.value || 0);

                            setSpecialCommissionValues((prev) => ({
                              ...prev,
                              amount,
                            }));

                            // Recalculate Special Commission if it exists and amount changed
                            if (addedSpecialCommissionValues && addedSpecialCommissionValues.commission) {
                              const commissionPercentage = parseFloat(addedSpecialCommissionValues.commission) || 0;
                              const newTotalCommission = (commissionPercentage / 100) * amount;

                              // Get current currency object or find it from currencyOptions
                              const currentCurrency = addedSpecialCommissionValues.currency ||
                                currencyOptions.find(c => c.value === values.currency_id);

                              // Recalculate distribution amounts based on percentages
                              let updatedDistributions = [];
                              if (addedSpecialCommissionValues.distributions && Array.isArray(addedSpecialCommissionValues.distributions)) {
                                updatedDistributions = addedSpecialCommissionValues.distributions.map(dist => {
                                  const percentage = parseFloat(dist.percentage) || 0;
                                  const newAmount = (percentage * newTotalCommission) / 100;
                                  return {
                                    ...dist,
                                    amount: Math.round(newAmount * 100) / 100, // Round to 2 decimal places
                                  };
                                });
                              }

                              // Update Special Commission values with new amount and recalculated commission
                              setAddedSpecialCommissionValues((prev) => ({
                                ...prev,
                                amount: amount,
                                total_commission: newTotalCommission,
                                currency_id: values.currency_id,
                                currency: currentCurrency || prev.currency,
                                distributions: updatedDistributions.length > 0 ? updatedDistributions : prev.distributions,
                              }));
                            }

                            // VAT and Net Total will be recalculated by useEffect
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

                      <div className="col-12 col-sm-6 mb-45">
                        <SearchableSelect
                          name={'commission_type'}
                          label={'Commission Type'}
                          options={[
                            {
                              label: 'Income',
                              value: 'Income',
                            },
                            {
                              label: 'Expense',
                              value: 'Expense',
                            },
                            ...(values.commission_type ? [{
                              label: 'Add New Remove Commission Type',
                              value: '',
                              displayLabel: 'Remove Commission Type', // Custom display label
                            }] : []),
                          ]}
                          isDisabled={isDisabled || !!addedSpecialCommissionValues?.commission_type}
                          placeholder={'Select Commission Type'}
                          value={values.commission_type}
                          onChange={(selected) => {
                            // Handle "Remove Commission Type" option
                            if (
                              selected.label
                                ?.toLowerCase()
                                ?.startsWith('add new remove commission type')
                            ) {
                              setFieldValue('commission_type', '');
                              // Clear commission fields
                              setFieldValue('commission', '');
                              setFieldValue('commission_amount', '');
                              // Clear VAT fields
                              setFieldValue('vat_terms', '');
                              setFieldValue('vat_terms_id', '');
                              setFieldValue('vat_percentage', '');
                              setFieldValue('vat_amount', '');

                              setSpecialCommissionValues((prev) => ({
                                ...prev,
                                commission_type: '',
                              }));
                            } else {
                              // Allow clearing the selection
                              const newValue = selected?.value || '';
                              setFieldValue('commission_type', newValue);
                              setSpecialCommissionValues((prev) => ({
                                ...prev,
                                commission_type: newValue,
                              }));
                            }
                          }}
                          onBlur={handleBlur}
                          formatOptionLabel={(option) => {
                            // Use displayLabel if available, otherwise use label
                            return option.displayLabel || option.label;
                          }}
                        />
                        <ErrorMessage
                          name="commission_type"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>
                      {/* <div className="col-12 col-sm-6 mb-0 mb-sm-4" /> */}

                      <div className="col-12 col-sm-6 mb-45">
                        <CombinedInputs
                          label="Commission Percentage"
                          type1="input"
                          type2="input"
                          name1="commission"
                          name2="commission_amount"
                          value1={values.commission}
                          value2={addedSpecialCommissionValues?.total_commission ? '' : values.commission_amount || ''}
                          isDisabled={
                            isDisabled ||
                            addedSpecialCommissionValues?.total_commission
                          }
                          handleBlur={handleBlur}
                          placeholder1="%"
                          placeholder2="Amount"
                          inputType1="number"
                          inputType2="number"
                          className1="commission"
                          className2="commission-amount"
                          inputProps1={{
                            min: 0,
                            max: 100,
                          }}
                          inputProps2={{
                            min: 0,
                            max: values.amount && parseFloat(values.amount) > 0 ? parseFloat(values.amount) : undefined,
                          }}
                          onChange1={(v) => {
                            if (v.target.value < 0) {
                              return;
                            }
                            let inputCommission = parseFloat(v.target.value || 0);
                            let amount = parseFloat(values.amount || 0);

                            // Cap commission percentage at 100%
                            let commission = inputCommission;
                            if (commission > 100) {
                              commission = 100;
                            }

                            // Calculate commission amount from percentage
                            let commissionAmount = 0;
                            if (commission && amount) {
                              commissionAmount = (commission / 100) * amount;
                              // Round to avoid floating-point precision issues (round to 8 decimal places)
                              commissionAmount = Math.round(commissionAmount * 100000000) / 100000000;
                              // Ensure commission amount doesn't exceed base amount
                              if (commissionAmount > amount) {
                                commissionAmount = amount;
                                commission = 100; // Set to 100% if commission equals base amount
                              }
                            }

                            // Only set commission_amount if not using special commission
                            if (!addedSpecialCommissionValues?.total_commission) {
                              setFieldValue('commission_amount', commissionAmount);
                            } else {
                              setFieldValue('commission_amount', '');
                            }

                            // Set commission percentage (use setFieldValue instead of handleChange to avoid conflicts)
                            setFieldValue('commission', commission);

                            // VAT and Net Total will be recalculated by useEffect
                          }}
                          onChange2={(e) => {
                            let inputValue = e.target.value;
                            // Remove commas and parse the value
                            const cleanedValue = inputValue.replace(/,/g, '');
                            let commissionAmount = parseFloat(cleanedValue || 0);
                            let amount = parseFloat(values.amount || 0);

                            // Validate commission amount doesn't exceed base amount - clamp immediately
                            if (isNaN(commissionAmount) || commissionAmount < 0) {
                              commissionAmount = 0;
                            }
                            if (commissionAmount > amount && amount > 0) {
                              commissionAmount = amount;
                            }

                            // Calculate commission percentage from amount
                            // Round to avoid floating-point precision issues when recalculating
                            let commission = amount !== 0 ? (commissionAmount / amount) * 100 : 0;
                            // Round percentage to reasonable precision (8 decimal places)
                            commission = Math.round(commission * 100000000) / 100000000;

                            // Recalculate commission amount from rounded percentage to ensure consistency
                            let recalculatedCommissionAmount = amount !== 0 ? (commission / 100) * amount : 0;
                            recalculatedCommissionAmount = Math.round(recalculatedCommissionAmount * 100000000) / 100000000;

                            // Use the recalculated value to ensure precision consistency
                            const finalCommissionAmount = recalculatedCommissionAmount;

                            // Set both values with the properly rounded amounts
                            setFieldValue('commission_amount', finalCommissionAmount);
                            setFieldValue('commission', commission);

                            // VAT and Net Total will be recalculated by useEffect
                          }}
                        />
                        <ErrorMessage
                          name="commission_amount"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>
                      {((vatData?.vatType?.vat_type === 'variable' && receiptVoucherData?.receipt_vouchers?.vat_type !== 'fixed') || (isVatTypeMismatch() && receiptVoucherData?.receipt_vouchers?.vat_type === 'variable')) && (
                        <div className="col-12 col-sm-6 mb-45">
                          <SearchableSelect
                            name={'vat_terms'}
                            label={'VAT %'}
                            options={isVatTypeMismatch() ? [{
                              label: `${values.vat_terms}${values.vat_percentage ? ' - ' + values.vat_percentage + '%' : ''}`,
                              value: values.vat_terms_id,
                              id: values.vat_terms_id,
                              title: values.vat_terms,
                              percentage: values.vat_percentage
                            }] : (() => {
                              const currentOptions = getVATTermsOptions() || [];
                              // Check if selected option exists in current options
                              const selectedExists = currentOptions.find(opt => opt.value === values.vat_terms_id);

                              // If selected value exists, return current options
                              if (selectedExists || !values.vat_terms_id) {
                                return currentOptions;
                              }

                              // If selected doesn't exist, add it to options so it displays
                              return [
                                ...currentOptions,
                                {
                                  label: `${values.vat_terms}${values.vat_percentage && values.vat_percentage !== 'Nill' ? ' - ' + values.vat_percentage + '%' : ''}`,
                                  value: values.vat_terms_id,
                                  id: values.vat_terms_id,
                                  title: values.vat_terms,
                                  percentage: values.vat_percentage
                                }
                              ];
                            })()}
                            isDisabled={isDisabled || isVatTypeMismatch()}
                            placeholder={'Select VAT %'}
                            value={values.vat_terms_id}
                            onChange={(selected) => {
                              if (
                                selected.percentage?.toString().startsWith(
                                  'A small popup will appear'
                                )
                              ) {
                                setShowVatOutOfScopeModal(true);
                              } else {
                                // For variable VAT, store the selected option as vat_terms
                                const vatTerms = selected?.title ?? '';
                                const vatPercentage = selected?.percentage ?? '';
                                setFieldValue('vat_terms', vatTerms);
                                setFieldValue('vat_terms_id', selected.id); // Store VAT terms ID

                                // Set VAT percentage to 0 for exempted/zero rate/out of scope conditions
                                if (shouldVatAmountBeZero(vatTerms)) {
                                  setFieldValue('vat_percentage', 0);
                                } else {
                                  setFieldValue('vat_percentage', vatPercentage);
                                }
                                let commission = parseFloat(
                                  values.commission || 0
                                );
                                let amount = parseFloat(
                                  values.amount ??
                                  getFormValues('special-commission')
                                    ?.total_commission ??
                                  0
                                );
                                let commissionAmount =
                                  (commission / 100) * amount;

                                // Check if VAT amount should be 0 based on VAT terms
                                let vat = '';
                                if (shouldVatAmountBeZero(vatTerms)) {
                                  vat = 0;
                                } else if (vatPercentage) {
                                  vat = (commissionAmount * vatPercentage) / 100;
                                }

                                setFieldValue('vat_amount', vat); // Set VAT amount
                                setFieldValue(
                                  'net_total',
                                  Math.round(
                                    (amount -
                                      commissionAmount -
                                      (vat || 0) -
                                      Number.EPSILON) *
                                    1000000
                                  ) / 1000000
                                );
                              }
                            }}
                            onBlur={handleBlur}
                          />
                          <ErrorMessage
                            name="vat_terms"
                            component="div"
                            className="input-error-message text-danger"
                          />
                        </div>
                      )}
                      {(vatData?.vatType?.vat_type === 'fixed' || (isVatTypeMismatch() && receiptVoucherData?.receipt_vouchers?.vat_type === 'fixed')) && (
                        <div className="col-12 col-sm-6 mb-3">
                          <CustomInput
                            name={'vat_percentage'}
                            label={'VAT %'}
                            type={'text'}
                            disabled={true}
                            placeholder={'Enter VAT %'}
                            value={receiptVoucherData?.receipt_vouchers?.vat_type === 'fixed'
                              ? `Fixed - ${values.vat_percentage}%`
                              : values.vat_percentage}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                        </div>
                      )}
                      <div className="col-12 col-sm-6 mb-45">
                        <CustomInput
                          name={'vat_amount'}
                          label={'VAT Amount'}
                          type={'text'}
                          disabled={true}
                          isAmount={true}
                          placeholder={''}
                          value={getVatAmountDisplayValue(values)}
                          onBlur={handleBlur}
                          error={touched.vat_amount && errors.vat_amount}
                        />
                      </div>
                      <div className="col-12 col-sm-6 mb-45">
                        <CustomInput
                          name={'net_total'}
                          label={'Net Received'}
                          type={'text'}
                          disabled={true}
                          placeholder={'Enter Net Received'}
                          value={values.net_total ? formatNumberTwoDecimals(values.net_total) : ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>
                      <div className="col-12 mb-3">
                        <CustomInput
                          name={'comment'}
                          label={'Comment'}
                          type={'textarea'}
                          rows={1}
                          placeholder={'Enter Comment'}
                          disabled={isDisabled}
                          value={values.comment}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.comment && errors.comment}
                        />
                      </div>
                    </div>

                    {/* File Attachments */}
                    <div className="col-12 mb-3">
                      <FileDisplayList
                        files={addedAttachments}
                        onRemoveFile={handleRemoveAttachedFile}
                      />
                    </div>

                    <div className="d-flex mb-5">
                      <CustomButton
                        type={'button'}
                        onClick={handleNavigateToSpecialCommissionPage}
                        text={`${addedSpecialCommissionValues ? 'Edit' : 'Add'} Special Commission`}
                        disabled={!!values.commission || !!values.commission_type || isDisabled}
                      />
                    </div>
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
                        {addedSpecialCommissionValues.total_commission} on{' '}
                        {
                          currencyOptions.find(
                            (x) =>
                              x.value ==
                              addedSpecialCommissionValues.currency_id
                          )?.label
                        }{' '}
                        {addedSpecialCommissionValues.amount}
                      </p>
                    ) : null}
                  </div>
                  <div className="col-0  col-xxl-2" />
                  {!isDisabled && (
                    <div className="col-12 col-lg-10 col-xl-9 col-xxl-3">
                      <div className="row">
                        <div
                          className="col-12 mb-5"
                          style={{ maxWidth: '350px' }}
                        >
                          {getAccountBalanceSettings('receipt_voucher') && (
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
                              {selectedModeAccount && (
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

                  <div className="d-flex flex-wrap justify-content-start mb-45">
                    <div className="d-inline-block mt-3">
                      <CustomCheckbox
                        label="Account Balance"
                        checked={getAccountBalanceSettings('receipt_voucher')}
                        disabled={isDisabled}
                        style={{ border: 'none', margin: 0 }}
                        onChange={(e) =>
                          updateAccountBalanceSetting(
                            'receipt_voucher',
                            e.target.checked
                          )
                        }
                      />
                      {hasPrintPermission && (
                        <CustomCheckbox
                          label="Print"
                          checked={getPrintSettings('receipt_voucher')}
                          onChange={(e) => {
                            updatePrintSetting(
                              'receipt_voucher',
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
            );
          }}
        </Formik>
      </div>
      <VoucherNavigationBar
        isDisabled={isDisabled}
        actionButtons={[
          {
            text: 'Update',
            onClick: handleSubmit,
            loading: isLoadingLockStatus,
          },
          {
            text: 'Cancel',
            onClick: handleCancel,
            variant: 'secondaryButton',
          },
        ]}
        loading={updateReceiptVoucherMutation.isPending}
        onAttachmentClick={() => setShowAttachmentsModal(true)}
        lastVoucherNumbers={lastVoucherNumbers}
        setPageState={setPageState}
        setSearchTerm={setSearchTerm}
      />

      {/* Special Commission Modal */}
      <CustomModal
        show={showSCModal}
        close={() => setShowSCModal(false)}
        size="xl"
        closeOnOutsideClick={false}
      >
        <SpecialCommission
          key={addedSpecialCommissionValues ? 'edit' : 'new'}
          preFilledValues={{
            ...addedSpecialCommissionValues,
            // Override with current form values to ensure correct data
            date,
            transaction_no:
              lastVoucherNumbers?.current || lastVoucherNumbers?.last || '',
            account:
              getAccountsByTypeOptions(formikRef?.current?.values.ledger).find(
                (x) => x.value === formikRef?.current?.values.account_id
              ) || '',
            amount: formikRef?.current?.values.amount || 0,
            ledger:
              [
                { label: 'PL', value: 'party' },
                { label: 'GL', value: 'general' },
                { label: 'WIC', value: 'walkin' },
              ].find((x) => x.value === formikRef?.current?.values.ledger) ||
              '',
            commission_type:
              addedSpecialCommissionValues?.commission_type ||
              formikRef?.current?.values.commission_type ||
              'Income',
            // Always ensure currency is properly set from current form values
            currency:
              addedSpecialCommissionValues?.currency ||
              currencyOptions.find(
                (x) => x.value === formikRef?.current?.values.currency_id
              ) ||
              '',
            currency_id: formikRef?.current?.values.currency_id || addedSpecialCommissionValues?.currency_id || '',
          }}
          sCValues={addedSpecialCommissionValues}
          isEdit={true}
          onSubmit={(sCValues) => {
            setAddedSpecialCommissionValues(sCValues);
            // Clear outer commission_type when Special Commission has commission_type
            if (sCValues?.commission_type && formikRef.current) {
              formikRef.current.setFieldValue('commission_type', '');
              // Also clear commission and commission_amount to ensure clean state
              if (!formikRef.current.values.commission) {
                formikRef.current.setFieldValue('commission', '');
                formikRef.current.setFieldValue('commission_amount', '');
              }
            }
            setShowSCModal(false);
          }}
          onCancel={() => setShowSCModal(false)}
          onDelete={() => {
            setAddedSpecialCommissionValues(null);
            // Allow outer commission_type to be editable again after deleting Special Commission
            if (formikRef.current) {
              // Don't clear commission_type on delete, let user decide
            }
            setShowSCModal(false);
          }}
          onCommissionTypeChange={(commissionType) => {
            // Clear the outer Commission Type field when Special Commission commission_type is set
            if (formikRef.current && commissionType) {
              formikRef.current.setFieldValue('commission_type', '');
            }
          }}
        />
      </CustomModal>
      {/* Upload Attachements Modal */}
      <CustomModal
        show={showAttachmentsModal}
        close={() => setShowAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          showModal={showAttachmentsModal}
          closeModal={() => setShowAttachmentsModal(false)}
          item={receiptVoucherData}
          deleteService={deleteReceiptVoucherAttachment}
          uploadService={addReceiptVoucherAttachment}
          closeUploader={() => setShowAttachmentsModal(false)}
          voucherAttachment={true}
          queryToInvalidate={['receiptVoucher', searchTerm]}
          deferredMode={true}
          getUploadedFiles={handleVoucherAttachmentsUpload}
          getDeletedAttachments={handleDeletedAttachments}
          currentFiles={currentFiles}
          setCurrentFiles={setCurrentFiles}
        />
      </CustomModal>

      {/* VAT Out Of Scope Modal  */}
      <CustomModal
        show={showVatOutOfScopeModal}
        close={() => {
          formikRef.current.values.vat_terms = '';
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
            validate={(values) => {
              const errors = {};
              if (!values.out_of_scope || values.out_of_scope.trim() === '') {
                errors.out_of_scope = 'Reason is required';
              }
              return errors;
            }}
            onSubmit={(values, { setSubmitting }) => {
              if (values.out_of_scope && values.out_of_scope.trim() !== '') {
                handleVatOutOfScope(values);
                setSubmitting(false);
              }
            }}
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
                  {/* {!addOfficeLocationMutation.isPending ? ( */}
                  <>
                    <CustomButton type="submit" text={'Submit'} />
                    <CustomButton
                      variant={'secondaryButton'}
                      text={'Cancel'}
                      type={'button'}
                      onClick={() => {
                        setShowVatOutOfScopeModal(false);
                        formikRef.current.values.vat_terms = '';
                      }}
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
    </>
  );
};

export default withModal(EditReceiptVoucher);
