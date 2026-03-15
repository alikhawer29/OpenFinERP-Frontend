import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import { useNavigate } from 'react-router-dom';
import AccountBalanceCard from '../../../Components/AccountBalanceCard/AccountBalanceCard';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import ChequeDetailForm from '../../../Components/ChequeDetailForm/ChequeDetailForm';
import CombinedInputs from '../../../Components/CombinedInputs/CombinedInputs';
import CustomButton from '../../../Components/CustomButton';
import CustomCheckbox from '../../../Components/CustomCheckbox/CustomCheckbox';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import FileDisplayList from '../../../Components/FileDisplayList/FileDisplayList';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import withModal from '../../../HOC/withModal';
import useAccountsByType from '../../../Hooks/useAccountsByType';
import useCurrencyRate from '../../../Hooks/useCurrencyRate';
import { useVATTypes } from '../../../Hooks/useVATTypes';
import {
  getCurrencyRatesPair,
  getAccountBalances,
} from '../../../Services/General';
import {
  checkTransactionLockStatus,
  releaseTransaction,
} from '../../../Services/Process/TransactionLock';
import {
  addOutwardRemittanceAttachment,
  deleteOutwardRemittanceAttachment,
  getOutwardRemittanceListingOrDetails,
  updateOutwardRemittance,
} from '../../../Services/Transaction/OutwardRemittance';
import { getBenefeciariesByAccount } from '../../../Services/Transaction/ReceiptVoucher';
import useFormStore from '../../../Stores/FormStore';
import useSettingsStore from '../../../Stores/SettingsStore';
import useUserStore from '../../../Stores/UserStore';
import {
  ledgerOptions,
  settleThruOptions,
} from '../../../Utils/Constants/SelectOptions';
import {
  formatNumberForDisplay,
  getCurrencyOptions,
  isNullOrEmpty,
  showErrorToast,
} from '../../../Utils/Utils';
import { formatNumberWithCommas } from '../../../Utils/Helpers';
import { outwardRemittanceValidationSchema } from '../../../Utils/Validations/ValidationSchemas';
import SpecialCommission from '../SpecialCommission/SpecialCommission';

const OutwardRemittanceEdit = ({
  showModal,
  date,
  setDate,
  valueDate,
  setValueDate,
  isDisabled = false,
  setIsDisabled,
  setShowAddLedgerModal,
  newlyCreatedAccount,
  newlyCreatedBeneficiary,
  setPageState,
  setWriteTerm,
  setSearchTerm,
  searchTerm,
  lastVoucherNumbers,
  restoreValuesFromStore,
  onSuccess,
  hasEditPermission,
  closeModal,
}) => {
  const navigate = useNavigate();

  // For getting print and account balance checkbox state from BE
  const {
    getPrintSettings,
    updatePrintSetting,
    getAccountBalanceSettings,
    updateAccountBalanceSetting,
    getBackToBackSettings,
    updateBackToBackSetting,
  } = useSettingsStore();

  const {
    setLastVisitedPage,
    saveFormValues,
    getFormValues,
    hasFormValues,
    clearFormValues,
    clearLastVisitedPage,
    getLastVisitedPage,
  } = useFormStore();

  const { user: { base_currency } = {} } = useUserStore(); // For LCy Field
  const queryClient = useQueryClient();
  const formId = 'edit_outward_remittance';
  const settingsID = 'outward_remittance';
  const voucherName = 'outward_remittance';

  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState(null);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [sendCurrency, setSendCurrency] = useState(null);
  const [againstCurrency, setAgainstCurrency] = useState(null);
  const [hasShownMissingRateModal, setHasShownMissingRateModal] =
    useState(false);
  const [outOfScope, setOutOfScope] = useState('');
  const [showVatOutOfScopeModal, setShowVatOutOfScopeModal] = useState(false);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [addedAttachments, setAddedAttachments] = useState({});
  const [deletedAttachments, setDeletedAttachments] = useState([]); // Track IDs of attachments to delete
  const [currentFiles, setCurrentFiles] = useState([]); // Track current files for UI display
  const filesInitializedRef = useRef(false); // Track if files have been initialized
  const [showAddChequeDetailModal, setShowAddChequeDetailModal] =
    useState(false);
  const [chequeDetails, setChequeDetails] = useState(null);
  const [isSubmittingFromChequeModal, setIsSubmittingFromChequeModal] =
    useState(false);

  const [showMissingCurrencyRateModal, setShowMissingCurrencyRateModal] =
    useState(false);
  const [pairMissingCurrencyRateModal, setPairMissingCurrencyRateModal] =
    useState(false);
  const [currencyToSelect, setCurrencyToSelect] = useState(null);
  const [addedSpecialCommissionValues, setAddedSpecialCommissionValues] =
    useState(null);
  const [showSCModal, setShowSCModal] = useState(false);
  const [showRateError, setShowRateError] = useState(false);
  const [showBaseRateError, setShowBaseRateError] = useState(false);
  const [currenciesManuallyChanged, setCurrenciesManuallyChanged] = useState(false); // Track if currencies changed by user

  // Helper function to check if commission is present
  const hasCommission = (values) => {
    return (
      values.currency_charges ||
      values.currency_charges_amount ||
      addedSpecialCommissionValues
    );
  };

  // Helper function to validate rate range using backend-provided range
  const validateRateRange = (rate, currencyRateData, rateType) => {
    if (!rate || !currencyRateData) {
      return false;
    }
    
    const numRate = parseFloat(rate);
    if (isNaN(numRate)) {
      return true;
    }

    // Use backend-provided range based on rate type
    if (rateType === '/') {
      const minRange = parseFloat(currencyRateData.reverse_from);
      const maxRange = parseFloat(currencyRateData.reverse_upto);
      return isNaN(minRange) || isNaN(maxRange) || numRate < minRange || numRate > maxRange;
    } else {
      // Default to 'X' (direct_from) rate type
      const minRange = parseFloat(currencyRateData.direct_from);
      const maxRange = parseFloat(currencyRateData.direct_upto);
      return isNaN(minRange) || isNaN(maxRange) || numRate < minRange || numRate > maxRange;
    }
  };

  // Helper function to validate base rate range - using backend ranges when available
  const validateBaseRateRange = (rate, baseRateData) => {
    if (!rate || !baseRateData?.rate) {
      return false;
    }
    
    const numRate = parseFloat(rate);
    
    // If rate is not a number, show error
    if (isNaN(numRate)) {
      return true;
    }
    
    // Use backend-provided ranges if available, otherwise calculate 1% range
    if (baseRateData?.min_range && baseRateData?.max_range) {
      const minRange = parseFloat(baseRateData.min_range);
      const maxRange = parseFloat(baseRateData.max_range);
      return numRate < minRange || numRate > maxRange;
    } else {
      // Fallback to calculated 1% range when backend ranges not available
      const officialRate = parseFloat(baseRateData.rate);
      const minRange = officialRate * 0.99;
      const maxRange = officialRate * 1.01;
      return numRate < minRange || numRate > maxRange;
    }
  };

  const { getAccountsByTypeOptions } = useAccountsByType();
  const currencyOptions = getCurrencyOptions();
  const formikRef = useRef();

  // Get VAT data using the hook
  const {
    vatType,
    isLoadingVatType,
    isErrorVatType,
    errorVatType,
    vatTermsOptions,
  } = useVATTypes();

  // Create vatData variable to handle all VAT-related functionality (following Receipt Voucher pattern)
  const vatData = {
    vatType,
    isLoadingVatType,
    isErrorVatType,
    errorVatType,
  };

  // Helper function to check if VAT amount should be 0 based on VAT terms
  const shouldVatAmountBeZero = (vatTerms, vatPercentage = null) => {
    // If VAT terms is null but VAT percentage is 0, it should be zero
    if (!vatTerms && vatPercentage === 0) {
      return true;
    }

    // If VAT percentage is "Nill", it should be zero
    if (
      vatPercentage === 'Nill' ||
      vatPercentage === 'NIL' ||
      vatPercentage === 'nil'
    ) {
      return true;
    }

    if (!vatTerms) return false;

    const vatTermsLower = vatTerms.toLowerCase();
    const shouldBeZero =
      vatTermsLower === 'exempted' ||
      vatTermsLower.includes('zero rate') ||
      vatTermsLower === 'out of scope' ||
      vatTermsLower.includes('0.00%');

    return shouldBeZero;
  };

  // Check if VAT types match between branch and existing voucher
  const isVatTypeMismatch = () => {
    const branchVatType = vatData?.vatType?.vat_type;
    const voucherVatType = outwardRemittance?.vat_type;

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
      label: `${item.title}${
        !isNaN(parseFloat(item.percentage)) ? ' - ' + item.percentage + '%' : ''
      }`,
      value: item.id, // Use ID as value for proper selection
      id: item.id, // Include the VAT term ID
      title: item.title, // Include the title for VAT condition checks
      percentage: item.percentage, // Include the percentage for calculations
    }));
  };

  // Check if we're returning from Rate of Exchange page
  const isReturningFromRateOfExchange =
    getLastVisitedPage(formId) === 'rate-of-exchange' && hasFormValues(formId);

  // Fetch Outward Remittance details for editing
  const {
    data: { data: [outwardRemittanceData] = [] } = {},
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['outwardRemittance', searchTerm],
    queryFn: () =>
      getOutwardRemittanceListingOrDetails({
        search: searchTerm,
      }),
    enabled: !!searchTerm && !isReturningFromRateOfExchange,
  });

  const outwardRemittance = outwardRemittanceData?.outward_remittance;

  // Check Transaction lock status to enable/disable Save
  const { isLoading: isLoadingLockStatus, refetch: checkFormStatus } = useQuery(
    {
      queryKey: ['save_lock_status', voucherName, outwardRemittanceData?.id],
      queryFn: () =>
        checkTransactionLockStatus({
          transaction_type: voucherName,
          transaction_id: outwardRemittanceData?.id,
        }),
      enabled: false,
      retry: false,
    }
  );

  // Set selected accounts, currencies and initialie form when data is loaded
  useEffect(() => {
    if (outwardRemittance?.value_date) {
      setValueDate(outwardRemittance.value_date);
    }
    if (
      outwardRemittance?.send_fc_id &&
      outwardRemittance?.against_currency_id
    ) {
      setSendCurrency(
        currencyOptions.find((x) => x.value == outwardRemittance?.send_fc_id)
      );
      setAgainstCurrency(
        currencyOptions.find(
          (x) => x.value == outwardRemittance?.against_currency_id
        )
      );
      // Reset the manually changed flag when loading initial data
      setCurrenciesManuallyChanged(false);
    }
    if (outwardRemittanceData?.date) {
      setDate(outwardRemittanceData.date);
    }
    if (outwardRemittance?.account_id && outwardRemittance?.account_details) {
      setSelectedLedgerAccount({
        value: outwardRemittance?.remittance_details?.id,
        label: outwardRemittance?.remittance_details?.account_title,
        accountType: outwardRemittance?.ledger,
        ...outwardRemittance.remittance_details,
      });
    }
    if (outwardRemittance?.beneficiary_id && outwardRemittance?.beneficiary) {
      setSelectedBeneficiary(outwardRemittance.beneficiary);
    }
    if (outwardRemittance?.cheque_details) {
      setChequeDetails(outwardRemittance.cheque_details);
    }
    if (outwardRemittance?.out_of_scope) {
      setOutOfScope(outwardRemittance.out_of_scope);
    }

    // Initialize Special Commission values if they exist
    if (outwardRemittance?.special_commission) {
      // Map ledger type to ledger name
      const getLedgerName = (ledgerType) => {
        const ledgerMap = {
          party: 'PL',
          general: 'GL',
          walkin: 'WIC',
        };
        return ledgerMap[ledgerType] || ledgerType;
      };

      // Save the SC form values with properly formatted currency
      const specialCommissionData = {
        ...outwardRemittance?.special_commission,
        ledger: outwardRemittance?.special_commission?.account_type,
        ledger_name: getLedgerName(
          outwardRemittance?.special_commission?.account_type
        ),
        distributions: [
          ...(outwardRemittance?.special_commission?.commission_distribution ||
            []),
        ],
        // Ensure currency is in the correct format with label and value
        currency: outwardRemittance?.special_commission?.currency
          ? typeof outwardRemittance.special_commission.currency === 'object' &&
            outwardRemittance.special_commission.currency.label
            ? outwardRemittance.special_commission.currency
            : currencyOptions.find(
                (c) =>
                  c.value === outwardRemittance.special_commission.currency_id
              ) || {
                value: outwardRemittance?.send_fc_id,
                label: outwardRemittance?.fc_currency?.currency_code || '',
              }
          : {
              value: outwardRemittance?.send_fc_id,
              label: outwardRemittance?.fc_currency?.currency_code || '',
            },
      };
      saveFormValues('special-commission', specialCommissionData);
      // Also update addedSpecialCommissionValues directly
      setAddedSpecialCommissionValues(specialCommissionData);
    }

    // Initialize current files from outward remittance data only once
    if (outwardRemittance && !filesInitializedRef.current) {
      const filesData =
        outwardRemittance.files || outwardRemittanceData?.files || [];
      setCurrentFiles(filesData);
      filesInitializedRef.current = true;
    }
  }, [outwardRemittance]);

  const updateOutwardRemittanceMutation = useMutation({
    mutationFn: ({ id, payload }) => updateOutwardRemittance(id, payload),
    onSuccess: (data) => {
      showToast('Outward Remittance Updated!', 'success');
      if (getPrintSettings(settingsID) && data?.detail?.pdf_url) {
        window.open(data.detail.pdf_url, '_blank');
      }
      queryClient.invalidateQueries(['outwardRemittanceListing']);
      queryClient.invalidateQueries(['outwardRemittance', searchTerm]);
      // Clear attachment tracking after successful update
      setAddedAttachments({});
      setDeletedAttachments([]);
      // Reset files to original state and allow re-initialization
      filesInitializedRef.current = false;
      // Release lock on successful update
      releaseLock();
      if (onSuccess) {
        onSuccess(data, getBackToBackSettings(settingsID));
      } else {
        handleResetForm();
        setPageState('view');
        setSearchTerm(searchTerm);
        setWriteTerm(searchTerm);
      }
    },
    onError: (error) => {
      showErrorToast(error);
      if (
        error.message.toLowerCase() ==
        'outward remittance limit reached for this branch.'
      ) {
        showModal(
          'Cannot Update',
          'You have reached the maximum number of Outward Remittance. To create new transactions you need to increase the transaction count form the Transaction Number Register.',
          null,
          'error'
        );
      } else {
        showErrorToast(error);
      }
    },
  });

  // Fetch account balances for Ledger Account
  const {
    data: selectedLedgerAccountBalance,
    isLoading: isLoadingSelectedLedgerAccountBalance,
    isError: isErrorSelectedLedgerAccountBalance,
    error: errorSelectedLedgerAccountBalance,
  } = useQuery({
    queryKey: ['accountBalance', selectedLedgerAccount?.value, selectedLedgerAccount?.accountType],
    queryFn: () => {
      return getAccountBalances(
        selectedLedgerAccount?.value,
        selectedLedgerAccount?.accountType
      );
    },
    enabled:
      !!selectedLedgerAccount?.value &&
      !!selectedLedgerAccount?.accountType &&
      getAccountBalanceSettings('outward_remittance'),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

  
  // Fetch dual currency rate for the selected Currency
  const { data: currencyRatesPair, isLoading: isLoadingCurrencyRatesPair } =
    useQuery({
      queryKey: [
        'dual-currency-rate',
        sendCurrency?.value, // Currency 1
        againstCurrency?.value, // Currency 2
        date,
        'buy', // Which rate to fetch (buy/sell) //TODO: Make this dynamic
      ],
      queryFn: () =>
        getCurrencyRatesPair(
          sendCurrency?.value,
          againstCurrency?.value,
          date,
          'buy' // Which rate to fetch (buy/sell) //TODO: Make this dynamic
        ),
      staleTime: 1000 * 5,
      gcTime: 1000 * 5,
      enabled: !!sendCurrency && !!againstCurrency,
    });

  // Base rates - Get rate from against currency to base currency (Currency Against FCy)
  const { data: currencyRate, isLoading: isLoadingCurrencyRate } =
    useCurrencyRate(againstCurrency?.value, date, {
      enabled:
        !!againstCurrency?.value &&
        !isLoadingCurrencyRatesPair &&
        !!currencyRatesPair?.direct_rate,
    });

  // Restore form data from store for Rate of Exchange flow
  useEffect(() => {
    if (restoreValuesFromStore) {
      const savedFormData = getFormValues(formId);
      if (savedFormData && formikRef.current) {
        formikRef.current.setValues(savedFormData || {});
        setDate(savedFormData?.date);
        setValueDate(savedFormData?.value_date);
        setSendCurrency(savedFormData?.sendCurrency);
        setAgainstCurrency(savedFormData?.againstCurrency);
        setSelectedLedgerAccount(savedFormData?.selectedLedgerAccount);
        setSelectedBeneficiary(savedFormData?.selectedBeneficiary);
        setAddedAttachments(savedFormData?.addedAttachments || {});
        setIsDisabled(false);
        clearFormValues(formId);
        clearLastVisitedPage(formId);
      }
    }
  }, [restoreValuesFromStore]);

  // BASE RATE: To update Rate field and show missing rate modal if base rate not present
  useEffect(() => {
    if (currencyRate?.rate && formikRef.current) {
      // In edit mode, if we have a saved rate and haven't changed the currency, 
      // we should keep it instead of clearing it while loading.
      const isInitialLoad = !formikRef.current.touched?.base_rate_currency_id;
      const hasSavedRate = !!outwardRemittance?.base_rate;

      // If it's a fresh fetch or the field is empty, update it
      if (!isInitialLoad || !formikRef.current.values.base_rate) {
        formikRef.current.setFieldValue('base_rate', currencyRate.rate);
      }
      formikRef.current.setFieldValue(
        'base_currency_code',
        currencyRate.local_currency
      );
    } else if (currencyRate && !isLoadingCurrencyRate) {
      // Only handle error/missing rate if it's not the initial load or if base_rate is missing
      const isInitialLoad = !formikRef.current?.touched?.base_rate_currency_id;
      const hasSavedRate = !!outwardRemittance?.base_rate;
      
      if (!isInitialLoad || !formikRef.current?.values?.base_rate) {
        setSendCurrency(null);
        formikRef.current.setFieldValue('rate', '');
        formikRef.current.setFieldValue('against_currency_id', '');
        setCurrencyToSelect(sendCurrency || '');
        setShowMissingCurrencyRateModal(true);
        setPairMissingCurrencyRateModal(false);
      }
    }
  }, [currencyRate?.rate, isLoadingCurrencyRate, againstCurrency?.value, date]);

  // PAIR RATE: To update Rate field and show missing rate modal if rate pair not present
  useEffect(() => {
    if (!sendCurrency?.value || !againstCurrency?.value) return;
    if (
      !isNullOrEmpty(currencyRatesPair) &&
      !currencyRatesPair?.direct_rate &&
      !hasShownMissingRateModal
    ) {
      formikRef.current.setFieldValue('rate', '');
      formikRef.current.setFieldValue('against_currency_id', '');
      formikRef.current.setFieldValue('against_amount', '');
      setAgainstCurrency(null);
      setCurrencyToSelect(sendCurrency || '');
      setShowMissingCurrencyRateModal(true);
      setPairMissingCurrencyRateModal(true);
      setHasShownMissingRateModal(true);
    } else if (currencyRatesPair?.direct_rate && currenciesManuallyChanged) {
      // Set rate type from API and update rate accordingly when user changes currencies
      formikRef.current.setFieldValue('rate_type', 'X');
      formikRef.current.setFieldValue('rate', currencyRatesPair?.direct_rate);
    }
  }, [
    sendCurrency?.value,
    againstCurrency?.value,
    currencyRatesPair?.direct_rate,
    currencyRatesPair?.reverse_rate,
    hasShownMissingRateModal,
    currenciesManuallyChanged,
  ]);

  // Get Benefeciaries from selected Ledger+Account
  const {
    data: beneficiaryAccounts,
    isLoading: isLoadingBeneficiary,
    isError: isErrorBeneficiary,
    error: errorBeneficiary,
  } = useQuery({
    queryKey: ['beneficiaries', selectedLedgerAccount?.value],
    queryFn: () => getBenefeciariesByAccount(selectedLedgerAccount?.value),
    enabled: !!selectedLedgerAccount?.value,
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
      console.error('Unable to fetch beneficiaries', errorMessage);
      return [{ label: 'Unable to fetch beneficiaries', value: null }];
    }
    let options =
      data?.map((x) => ({
        value: x?.id,
        label: x?.title,
        purpose: x?.purpose?.id || '',
        ...x,
      })) || [];

    options.push({
      label: `Add New Beneficiary`,
      value: null,
    });

    return options;
  };

  // Remove a newly added (local) attachment before final save
  const handleRemoveAttachedFile = (file) => {
    setAddedAttachments((prevFiles) => {
      const updatedFiles = { ...prevFiles };

      for (const key in updatedFiles) {
        if (updatedFiles[key] === file) {
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
    showToast(
      'Attachments will be uploaded when voucher is updated',
      'success'
    );
    setShowAttachmentsModal(false);
  };

  // Handle attachment deletion in deferred mode
  const handleDeletedAttachments = (attachmentId) => {
    setDeletedAttachments((prev) => [...prev, attachmentId]);
    // Remove from current files display
    setCurrentFiles((prev) => prev.filter((f) => f.id !== attachmentId));
  };

  const handleVatOutOfScope = (values) => {
    setOutOfScope(values.out_of_scope);
    // Set VAT terms to "Out of Scope" and VAT percentage to 0
    if (formikRef.current) {
      formikRef.current.setFieldValue('vat_terms', 'Out of Scope');
      formikRef.current.setFieldValue('vat_percentage', 0);
      formikRef.current.setFieldValue('vat_amount', 0);

      // Find the "Out of Scope" option and set its ID
      const outOfScopeOption = getVATTermsOptions().find(
        (option) =>
          option.title?.toLowerCase().includes('out of scope') ||
          option.percentage?.toString().startsWith('A small popup will appear')
      );
      if (outOfScopeOption) {
        formikRef.current.setFieldValue('vat_terms_id', outOfScopeOption.id);
      }
    }
    setShowVatOutOfScopeModal(false);
  };
  // Release lock on unmount or cancel
  const releaseExecutedRef = useRef(false);
  const releaseTransactionMutation = useMutation({
    mutationFn: releaseTransaction,
  });
  const releaseLock = useCallback(() => {
    if (releaseExecutedRef.current) return;
    if (outwardRemittanceData?.id) {
      releaseTransactionMutation.mutate({
        transaction_type: voucherName,
        transaction_id: outwardRemittanceData?.id,
      });
      releaseExecutedRef.current = true;
    }
  }, [outwardRemittanceData?.id]);

  const handleNavigateToSpecialCommissionPage = () => {
    // Check if required fields are filled
    const requiredFields = [
      'ledger',
      'account_id',
      'against_amount',
      'against_currency_id',
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
    setShowSCModal(true);
  };

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

  const handleResetForm = () => {
    // Release lock then navigate back
    releaseLock();
    clearFormValues(formId);
    // Reset cheque detail state so next edit with bank/PDC reopens the popup
    setChequeDetails(null);
    setShowAddChequeDetailModal(false);
    setIsSubmittingFromChequeModal(false);
    setPageState('view');
    setSearchTerm(searchTerm);
    setWriteTerm(searchTerm);
  };
  const handleSubmit = async () => {
    // run status check first
    const { error: errorLockStatus } = await checkFormStatus();
    if (errorLockStatus?.detail?.locked) {
      setIsSubmittingFromChequeModal(false); // Reset flag when submission fails
      showToast(errorLockStatus?.message, 'warn');
      return;
    }

    if (!formikRef.current) {
      setIsSubmittingFromChequeModal(false); // Reset flag when formik ref is not available
      return;
    }

    // Check if rate is out of range before submission
    if (showRateError) {
      const formValues = formikRef.current.values;
      const officialRate = formValues.rate_type === '/' 
        ? parseFloat(currencyRatesPair?.reverse_rate)
        : parseFloat(currencyRatesPair?.direct_rate);
      const minRange = formValues.rate_type === '/'
        ? parseFloat(currencyRatesPair?.reverse_from)
        : parseFloat(currencyRatesPair?.direct_from);
      const maxRange = formValues.rate_type === '/'
        ? parseFloat(currencyRatesPair?.reverse_upto)
        : parseFloat(currencyRatesPair?.direct_upto);

      showModal(
        'Exchange Rate Control',
        <>
          Exchange Rate for {sendCurrency?.label}/{againstCurrency?.label} is{' '}
          {officialRate?.toFixed(6)}
          <br />
          Acceptable range is from {minRange?.toFixed(6)} to{' '}
          {maxRange?.toFixed(6)}
          <br />
          Your selected rate is outside this range
        </>,
        () => closeModal(),
        'error'
      );
      setIsSubmittingFromChequeModal(false); // Reset flag when rate is out of range
      return;
    }

    // Check if base rate is out of range before submission - removed frontend calculation
    if (showBaseRateError) {
      const officialBaseRate = parseFloat(currencyRate?.rate);
      const baseRateCurrencyLabel = againstCurrency?.label || 'Currency';

      showModal(
        'Exchange Rate Control',
        <>
          Exchange Rate for {baseRateCurrencyLabel}/{base_currency} is{' '}
          {officialBaseRate?.toFixed(6)}
          <br />
          Your selected base rate is invalid
        </>,
        () => closeModal(),
        'error'
      );
      setIsSubmittingFromChequeModal(false); // Reset flag when base rate is out of range
      return;
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
      setIsSubmittingFromChequeModal(false); // Reset flag when form validation fails
      return; // Do not submit if there are errors
    }

    const formValues = formikRef.current.values;

    // Get VAT terms data from the selected vat_terms_id
    let vatTermsData = null;
    if (formValues.vat_terms_id && vatData?.vatType?.vats) {
      vatTermsData = vatData.vatType.vats.find(
        (vat) => vat.id === formValues.vat_terms_id
      );
    }

    // Calculate VAT amount and percentage based on conditions
    let finalVatAmount = formValues.vat_amount;
    let finalVatPercentage = formValues.vat_percentage;

    // If VAT percentage is empty but we have VAT terms data, use the percentage from VAT terms
    if (!finalVatPercentage && vatTermsData?.percentage) {
      finalVatPercentage = vatTermsData.percentage;
    }

    // Handle "Nill" percentage as 0
    if (
      finalVatPercentage === 'Nill' ||
      finalVatPercentage === 'NIL' ||
      finalVatPercentage === 'nil'
    ) {
      finalVatPercentage = 0;
    }

    if (shouldVatAmountBeZero(formValues.vat_terms, finalVatPercentage)) {
      finalVatAmount = 0;
      finalVatPercentage = 0;
    }

    // Determine which VAT type to send
    // If branch and voucher VAT types are the same, send branch VAT type
    // If they are different, send voucher VAT type (preserve original)
    const vatTypeToSend = isVatTypeMismatch()
      ? outwardRemittance?.vat_type // Different: use voucher's VAT type
      : vatData?.vatType?.vat_type || outwardRemittance?.vat_type || ''; // Same: use branch's VAT type

    // Validate and prepare VAT terms ID
    let vatTermsIdPayload = {};

    // Check if the vat_terms_id is valid in current branch's VAT terms
    const isValidInCurrentBranch = vatData?.vatType?.vats?.some(
      (vat) => vat.id === formValues.vat_terms_id
    );

    // IMPORTANT: If voucher's VAT type is 'variable', vat_terms_id is REQUIRED by backend
    if (vatTypeToSend === 'variable') {
      // For variable VAT type vouchers, vat_terms_id is mandatory
      if (
        formValues.vat_terms_id &&
        !isNaN(formValues.vat_terms_id) &&
        formValues.vat_terms_id !== ''
      ) {
        // Check if it's valid in current branch first
        if (isValidInCurrentBranch) {
          // Use existing vat_terms_id only if valid
          vatTermsIdPayload = { vat_terms_id: formValues.vat_terms_id };
        } else if (
          vatData?.vatType?.vat_type === 'variable' &&
          vatData?.vatType?.vats &&
          vatData.vatType.vats.length > 0
        ) {
          // If not valid, use first available from current branch
          vatTermsIdPayload = { vat_terms_id: vatData.vatType.vats[0].id };
        }
      } else if (
        vatData?.vatType?.vat_type === 'variable' &&
        vatData?.vatType?.vats &&
        vatData.vatType.vats.length > 0
      ) {
        // If somehow not set, use first available VAT term
        vatTermsIdPayload = { vat_terms_id: vatData.vatType.vats[0].id };
      }
    } else if (vatTypeToSend === 'fixed') {
      // For fixed VAT type, vat_terms_id is optional - only include if valid
      if (
        formValues.vat_terms_id &&
        !isNaN(formValues.vat_terms_id) &&
        formValues.vat_terms_id !== '' &&
        isValidInCurrentBranch
      ) {
        vatTermsIdPayload = { vat_terms_id: formValues.vat_terms_id };
      }
    }

    // Create a copy of formValues without vat_terms_id (we'll add it back conditionally)
    const { vat_terms_id: _, ...formValuesWithoutVatTermsId } = formValues;

    // Check if cheque details are required
    if (
      !isSubmittingFromChequeModal &&
      !showAddChequeDetailModal && // Don't open if modal is already open
      (formValues.settle_thru === 'pdc' || formValues.settle_thru === 'bank')
    ) {
      // Always open modal for bank/PDC to allow editing cheque details
      setShowAddChequeDetailModal(true);
      return;
    }

    // Prepare cheque details for payload
    const getChequeDetailsForPayload = () => {
      if (
        formValues.settle_thru === 'pdc' ||
        formValues.settle_thru === 'bank'
      ) {
        // If we have local cheque details (from modal), use those
        if (chequeDetails) {
          return chequeDetails;
        }
        // If no local cheque details but we have existing API data, use that
        if (
          outwardRemittance?.cheque_detail_bank_id &&
          outwardRemittance?.cheque_detail_cheque_number
        ) {
          return {
            cheque_detail_bank_id: outwardRemittance.cheque_detail_bank_id,
            cheque_detail_cheque_number:
              outwardRemittance.cheque_detail_cheque_number,
            cheque_detail_due_date: outwardRemittance.cheque_detail_due_date,
          };
        }
      }
      return {};
    };

    let payload = {
      date,
      value_date: valueDate,
      ...formValues,
      ...addedAttachments,
      ...((formValues.vat_terms?.startsWith?.('A small popup') ||
        formValues.vat_terms?.toLowerCase() === 'out of scope') && {
        out_of_scope_reason: outOfScope,
      }),
      ...((formValues.settle_thru === 'pdc' ||
        formValues.settle_thru === 'bank') &&
      getChequeDetailsForPayload()
        ? getChequeDetailsForPayload()
        : {}), // Only including chequeDetails the user hasn't selected any other settle_thru after filling the form
      back_to_back: getBackToBackSettings(settingsID),
      vat_type:
        formValues.vat_percentage === null ||
        formValues.vat_percentage === '' ||
        formValues.vat_percentage === undefined
          ? null
          : vatType?.vat_type || '',
      vat_terms:
        formValues.vat_percentage === null ||
        formValues.vat_percentage === '' ||
        formValues.vat_percentage === undefined
          ? null
          : formValues.vat_terms ||
            vatTermsData?.title ||
            (finalVatPercentage !== '' && !isNaN(finalVatPercentage)
              ? Number(finalVatPercentage)
              : ''),
      vat_terms_id:
        formValues.vat_percentage === null ||
        formValues.vat_percentage === '' ||
        formValues.vat_percentage === undefined
          ? null
          : Object.keys(vatTermsIdPayload).length > 0
            ? vatTermsIdPayload.vat_terms_id
            : null,
      vat_amount: finalVatAmount,
      vat_percentage: finalVatPercentage,
    };



    // Include deleted attachments in payload if any
    if (deletedAttachments && deletedAttachments.length > 0) {
      deletedAttachments.forEach((attachmentId, index) => {
        payload[`deleted_attachments[${index}]`] = attachmentId;
      });
    }


    // Flatten Special Commission like Receipt Voucher
    if (addedSpecialCommissionValues) {
      const scConverted = {};

      // Capitalize commission_type if it's lowercase (from API)
      const normalizedCommissionType =
        addedSpecialCommissionValues.commission_type
          ? addedSpecialCommissionValues.commission_type
              .charAt(0)
              .toUpperCase() +
            addedSpecialCommissionValues.commission_type.slice(1).toLowerCase()
          : '';

      const sc = {
        transaction_no:
          addedSpecialCommissionValues?.transaction_no ||
          lastVoucherNumbers?.current ||
          lastVoucherNumbers?.last ||
          '',
        date,
        ledger: formValues.ledger,
        account_id: formValues.account_id,
        currency_id: formValues.send_fc_id,
        amount: formValues.send_amount,
        // Only include specific special commission fields, not all of them
        commission_type: normalizedCommissionType,
        account_type: addedSpecialCommissionValues.account_type,
        description: addedSpecialCommissionValues.description,
        commission: addedSpecialCommissionValues.commission,
        total_commission: addedSpecialCommissionValues.total_commission,
        business_id: addedSpecialCommissionValues.business_id,
        branch_id: addedSpecialCommissionValues.branch_id,
        // Only include distributions if they exist
        ...(addedSpecialCommissionValues.distributions && {
          distributions: addedSpecialCommissionValues.distributions,
        }),
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

    updateOutwardRemittanceMutation.mutate({
      id: searchTerm,
      payload,
    });
  };

  // Map backend rate_type values to UI/internal values
  const mapIncomingRateType = (rateType) => {
    if (rateType === 'X') return 'X';
    if (rateType === '/') return '/';
    return rateType || 'X';
  };

  const getInitialValues = () => {
    return {
      reference_no: outwardRemittance?.reference_no || '',
      ledger: outwardRemittance?.ledger || '',
      account_id: outwardRemittance?.account_id || '',
      beneficiary_id: outwardRemittance?.beneficiary_id || '',
      by_order: outwardRemittance?.by_order || '',
      send_fc_id: outwardRemittance?.send_fc_id || '',
      send_amount: parseFloat(outwardRemittance?.send_amount) || '',
      against_currency_id: outwardRemittance?.against_currency_id || '',
      against_amount: parseFloat(outwardRemittance?.against_amount) || '',
      rate_type: mapIncomingRateType(outwardRemittance?.rate_type),
      rate: outwardRemittance?.rate ? Number(outwardRemittance.rate).toFixed(8) : '',
      currency_charges: parseFloat(outwardRemittance?.currency_charges) || '',
      currency_charges_amount:
        parseFloat(outwardRemittance?.currency_charges_amount) || '',
      vat_type: outwardRemittance?.vat_type || '',
      vat_percentage: parseFloat(outwardRemittance?.vat_percentage) || '',
      vat_terms: outwardRemittance?.vat_terms || '',
      vat_terms_id: outwardRemittance?.vat_terms_id || null,
      vat_amount: parseFloat(outwardRemittance?.vat_amount) || 0,
      net_total: parseFloat(outwardRemittance?.net_total) || '',
      base_rate: outwardRemittance?.base_rate ? Number(outwardRemittance.base_rate).toFixed(8) : '',
      lcy_amount: parseFloat(outwardRemittance?.lcy_amount) || '',
      settle_thru: outwardRemittance?.settle_thru || '',
    };
  };

  if (isError) {
    showErrorToast(error);
    return (
      <div className="d-card">
        <p className="text-danger mb-0">Error fetching Outward Remittance</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="d-card">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <div className="row mb-3">
              {Array.from({ length: 14 }).map((_, i) => (
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="d-card">
        <Formik
          initialValues={getInitialValues()}
          validationSchema={outwardRemittanceValidationSchema(base_currency)}
          innerRef={formikRef}
          enableReinitialize={true}
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

            // Send FC validation - must be selected first
            if (!values.send_fc_id) {
              errors.send_fc_id = 'Send FC is required';
            }

            // Send Amount validation - only required if Send FC is selected
            if (values.send_fc_id && !values.send_amount) {
              errors.send_amount = 'Send Amount is required';
            }

            // Against Currency validation - must be selected first
            if (!values.against_currency_id) {
              errors.against_currency_id = 'Against Currency is required';
            }

            // Against Amount validation - only required if Against Currency is selected
            if (values.against_currency_id && !values.against_amount) {
              errors.against_amount = 'Against Amount is required';
            }

            // Rate validation - always required
            if (!values.rate) {
              errors.rate = 'Rate is required';
            }

            // Base Rate validation - always required
            if (!values.base_rate) {
              errors.base_rate = 'Base Rate is required';
            }

            // Settle Thru validation - always required
            if (!values.settle_thru) {
              errors.settle_thru = 'Settle Thru is required';
            }

            // Enhanced VAT validation - only required if commission is used
            if (hasCommission(values)) {
              if (vatType?.vat_type === 'variable') {
                if (!values.vat_terms_id) {
                  errors.vat_terms_id = 'VAT % is required';
                }
                // Additional validation for VAT Amount when variable VAT type
                // For VAT amount, 0 is valid for exempted cases, only check if truly empty
                if (
                  values.vat_amount === '' ||
                  values.vat_amount === null ||
                  values.vat_amount === undefined
                ) {
                  errors.vat_amount = 'VAT Amount is required';
                }
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
            useEffect(() => {
              const sendAmount = parseFloat(values.send_amount) || 0;
              const rate = parseFloat(values.rate) || 0;
              if (rate === 0) return;
              const againstAmount = sendAmount * rate;
              setFieldValue('against_amount', againstAmount);
            }, [values.send_amount, values.rate]);

            useEffect(() => {
              if (!values.currency_charges)
                setFieldValue('currency_charges_amount', '');
              const currencyCharges = parseFloat(values.currency_charges) || 0;
              const rate = parseFloat(values.rate) || 0;
              if (rate === 0) return;
              let currencyChargesAmount;
              if (values.rate_type === '/') {
                currencyChargesAmount = currencyCharges / parseFloat(rate);
              } else {
                currencyChargesAmount = currencyCharges * rate;
              }
              setFieldValue('currency_charges_amount', currencyChargesAmount);
            }, [values.currency_charges, values.rate, values.rate_type]);

            // Recalculate Special Commission when relevant amounts or currencies change
            useEffect(() => {
              if (
                addedSpecialCommissionValues &&
                addedSpecialCommissionValues.commission
              ) {
                const commissionPercentage =
                  parseFloat(addedSpecialCommissionValues.commission) || 0;

                // For Outward Remittance, commission can be on send_amount or against_amount
                // Use against_amount as primary, fallback to send_amount
                const currentBaseAmount =
                  parseFloat(values.against_amount) ||
                  parseFloat(values.send_amount) ||
                  0;

                if (currentBaseAmount > 0) {
                  const newTotalCommission =
                    (commissionPercentage / 100) * currentBaseAmount;

                  // Only update if the amount or total commission actually changed
                  const oldTotalCommission =
                    parseFloat(addedSpecialCommissionValues.total_commission) ||
                    0;
                  const oldAmount =
                    parseFloat(addedSpecialCommissionValues.amount) || 0;

                  if (
                    Math.abs(newTotalCommission - oldTotalCommission) > 0.01 ||
                    Math.abs(currentBaseAmount - oldAmount) > 0.01
                  ) {
                    // Recalculate distribution amounts based on percentages
                    let updatedDistributions = [];
                    if (
                      addedSpecialCommissionValues.distributions &&
                      Array.isArray(addedSpecialCommissionValues.distributions)
                    ) {
                      updatedDistributions =
                        addedSpecialCommissionValues.distributions.map(
                          (dist) => {
                            const percentage = parseFloat(dist.percentage) || 0;
                            const newTotalComm =
                              (percentage * newTotalCommission) / 100;
                            return {
                              ...dist,
                              amount: Math.round(newTotalComm * 100) / 100, // Round to 2 decimal places
                            };
                          }
                        );
                    }

                    setAddedSpecialCommissionValues((prev) => ({
                      ...prev,
                      amount: currentBaseAmount,
                      total_commission: newTotalCommission.toFixed(2),
                      distributions:
                        updatedDistributions.length > 0
                          ? updatedDistributions
                          : prev.distributions,
                    }));
                  }
                }
              }
            }, [
              values.send_amount,
              values.against_amount,
              addedSpecialCommissionValues?.commission,
            ]);

            // Clear all VAT fields when vat_percentage is null or empty
            useEffect(() => {
              const vatPercentage = values.vat_percentage;

              if (
                vatPercentage === null ||
                vatPercentage === '' ||
                vatPercentage === undefined
              ) {
                setFieldValue('vat_type', '');
                setFieldValue('vat_terms_id', '');
                setFieldValue('vat_terms', '');
                setFieldValue('vat_amount', '');
              }
            }, [values.vat_percentage]);

            // Calculate VAT on commission amount only (currency charges or special commission)
            useEffect(() => {
              if (
                values.vat_percentage === null ||
                values.vat_percentage === '' ||
                values.vat_percentage === undefined
              ) {
                setFieldValue('vat_amount', 0);
                return;
              }

              let currencyChargesAmount =
                parseFloat(values.currency_charges_amount) || 0;
              const specialCommissionAmount =
                addedSpecialCommissionValues?.total_commission
                  ? parseFloat(addedSpecialCommissionValues.total_commission) ||
                    0
                  : 0;

              let vatPercentage =
                vatData?.vatType?.vat_percentage ||
                (!isNaN(values.vat_percentage) ? values.vat_percentage : 0);

              // Check if VAT amount should be 0 based on VAT terms
              let vatAmount = 0; // Initialize to 0 instead of empty string
              if (shouldVatAmountBeZero(values.vat_terms, vatPercentage)) {
                vatAmount = 0;
              } else if (currencyChargesAmount && vatPercentage) {
                // VAT on normal commission (currency charges)
                vatAmount = (currencyChargesAmount * vatPercentage) / 100;
              } else if (specialCommissionAmount && vatPercentage) {
                // VAT on special commission amount
                vatAmount = (specialCommissionAmount * vatPercentage) / 100;
              }
              setFieldValue('vat_amount', vatAmount);
            }, [
              values.currency_charges_amount,
              values.vat_percentage,
              values.vat_terms,
              vatData?.vatType?.vat_percentage,
              addedSpecialCommissionValues?.total_commission,
              setFieldValue,
            ]);

            // Ensure vat_terms_id is synced for fixed VAT type
            React.useEffect(() => {
              if (
                vatData?.vatType?.vat_type === 'fixed' &&
                vatData?.vatType?.vats &&
                vatData.vatType.vats.length > 0 &&
                !values.vat_terms_id
              ) {
                // For fixed VAT type, set the first available VAT term ID if not already set
                setFieldValue('vat_terms_id', vatData.vatType.vats[0].id);
              }
            }, [
              vatData?.vatType?.vat_type,
              vatData?.vatType?.vats,
              values.vat_terms_id,
              setFieldValue,
            ]);

            // Handle VAT percentage changes for fixed VAT type when editable
            React.useEffect(() => {
              // If vat_percentage is null, empty, or undefined, set VAT amount to 0
              if (
                values.vat_percentage === null ||
                values.vat_percentage === '' ||
                values.vat_percentage === undefined
              ) {
                setFieldValue('vat_amount', 0);
                return;
              }

              if (
                vatData?.vatType?.vat_type === 'fixed' &&
                !isVatTypeMismatch() &&
                values.vat_percentage &&
                !isNaN(values.vat_percentage)
              ) {
                // Recalculate VAT amount when VAT percentage changes for fixed type
                let currencyChargesAmount =
                  parseFloat(values.currency_charges_amount) || 0;

                let vatAmount = '';
                if (
                  shouldVatAmountBeZero(values.vat_terms, values.vat_percentage)
                ) {
                  vatAmount = 0;
                } else if (currencyChargesAmount && values.vat_percentage) {
                  vatAmount =
                    (currencyChargesAmount * values.vat_percentage) / 100;
                } else if (
                  values.against_amount &&
                  values.vat_percentage &&
                  !currencyChargesAmount
                ) {
                  // For Standard Rate, calculate VAT on the against amount when no currency charges
                  vatAmount =
                    (values.against_amount * values.vat_percentage) / 100;
                }

                setFieldValue('vat_amount', vatAmount);
              }
            }, [
              values.vat_percentage,
              values.against_amount,
              values.currency_charges_amount,
              values.vat_terms,
              setFieldValue,
            ]);
            // --- End VAT Calculation useEffect ---

            useEffect(() => {
              if (!values.vat_amount && !values.against_amount)
                setFieldValue('net_total', '');
              const vatAmount = parseFloat(values.vat_amount) || 0;
              const againstAmount = parseFloat(values.against_amount) || 0;
              const currencyChargesAmount =
                parseFloat(values.currency_charges_amount) || 0;
              const specialCommissionAmount =
                addedSpecialCommissionValues?.total_commission
                  ? parseFloat(addedSpecialCommissionValues.total_commission) ||
                    0
                  : 0;
              const netTotal =
                againstAmount +
                currencyChargesAmount +
                vatAmount +
                specialCommissionAmount;
              setFieldValue('net_total', netTotal);
            }, [
              values.vat_amount,
              values.currency_charges_amount,
              values.against_amount,
              addedSpecialCommissionValues?.total_commission,
            ]);

            // Calculate LCy amount from net_total and base_rate
            useEffect(() => {
              const netTotal = parseFloat(values.net_total || 0);
              const baseRate = parseFloat(values.base_rate || 0);

              if (
                !isNaN(netTotal) &&
                !isNaN(baseRate) &&
                netTotal &&
                baseRate
              ) {
                const result = netTotal * baseRate;
                setFieldValue('lcy_amount', result);
              } else {
                setFieldValue('lcy_amount', '');
              }
            }, [values.base_rate, values.net_total]);

            // Handle settlement method changes
            useEffect(() => {
              const settleThru = values.settle_thru;
              if (settleThru === 'pdc' || settleThru === 'bank') {
                // Check if we have existing cheque details from the API
                const hasExistingChequeDetails =
                  outwardRemittance?.cheque_detail_bank_id &&
                  outwardRemittance?.cheque_detail_cheque_number;

                if (!hasExistingChequeDetails) {
                  // No existing cheque details, clear any previous cheque details
                  setChequeDetails(null);
                }
              } else {
                // Not PDC or Bank, clear cheque details
                setChequeDetails(null);
              }
            }, [
              values.settle_thru,
              outwardRemittance?.cheque_detail_bank_id,
              outwardRemittance?.cheque_detail_cheque_number,
            ]);

            // Set default rate_type if it's null or undefined (matching Add page behavior)
            useEffect(() => {
              if (!values.rate_type && formikRef.current) {
                formikRef.current.setFieldValue('rate_type', 'X');
              }
            }, [values.rate_type]);

            return (
              <Form>
                <div className="row">
                  <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
                    <div className="row mb-4">
                      {/* Referece Number */}
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'reference_no'}
                          type={'text'}
                          disabled={isDisabled}
                          label={'Reference Number'}
                          placeholder={!isDisabled && 'Enter Reference Number'}
                          value={values.reference_no}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.reference_no && errors.reference_no}
                        />
                      </div>
                      <div className="col-0 col-sm-6 mb-3" />

                      {/* Combined Ledger and Account Select */}
                      <div className="col-12 col-sm-6 mb-45">
                        <CombinedInputs
                          label="Ledger"
                          type1="select"
                          type2="select"
                          name1="ledger"
                          name2="account_id"
                          value1={values.ledger}
                          value2={values.account_id || newlyCreatedAccount?.id}
                          options1={ledgerOptions}
                          options2={getAccountsByTypeOptions(values.ledger)}
                          isDisabled={isDisabled}
                          handleBlur={handleBlur}
                          placeholder1="Ledger"
                          placeholder2="Account"
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
                              setFieldValue('account_id', '');
                              setSelectedBeneficiary(null);
                              setFieldValue('beneficiary_id', '');
                              // Always mark account as touched when ledger is selected to show error if empty
                              if (selected.value) {
                                setFieldTouched('account_id', true);
                                // Validate immediately to show account error if empty
                                setTimeout(() => {
                                  validateForm();
                                }, 0);
                              }
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
                              setFieldValue('beneficiary_id', '');
                              setSelectedLedgerAccount({
                                value: selected.value,
                                label: selected.label,
                                accountType: values.ledger,
                              });
                              setSelectedBeneficiary(null);
                              // Validate immediately to clear error
                              setTimeout(() => {
                                validateForm();
                              }, 0);
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
                      {/* Beneficiary */}
                      <div className="col-12 col-sm-6 mb-45">
                        <SearchableSelect
                          name={'beneficiary_id'}
                          label={'Beneficiary'}
                          options={getBeneficiaryOptions(
                            selectedLedgerAccount?.value
                          )}
                          isDisabled={isDisabled}
                          placeholder={'Select Beneficiary'}
                          value={
                            values.beneficiary_id || newlyCreatedBeneficiary?.id
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
                              setFieldValue('beneficiary_id', selected.value);
                              setSelectedBeneficiary(selected);
                            }
                          }}
                          onBlur={handleBlur}
                        />
                        <ErrorMessage
                          name="beneficiary_id"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>
                      {/* Address */}
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'address'}
                          type={'text'}
                          disabled={true}
                          label={'Address'}
                          value={selectedBeneficiary?.address || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>
                      {/* Nationality */}
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'nationality'}
                          type={'text'}
                          disabled={true}
                          label={'Nationality'}
                          placeholder={'Enter Nationality'}
                          value={selectedBeneficiary?.nationality?.name || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>
                      {/* Bank Name */}
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'bank_name'}
                          type={'text'}
                          disabled={true}
                          label={'Bank Name'}
                          placeholder={'Enter Bank Name'}
                          value={selectedBeneficiary?.bank_name || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>
                      {/* Bank Account */}
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'bank_account'}
                          type={'text'}
                          disabled={true}
                          label={'Bank A/C'}
                          placeholder={'Enter Bank A/C'}
                          value={selectedBeneficiary?.bank_account_number || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>
                      {/* Swift Code */}
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'swift_code'}
                          type={'text'}
                          disabled={true}
                          label={'SWIFT Code'}
                          value={selectedBeneficiary?.swift_bic_code || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>
                      {/* Routing Number */}
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'routing_number'}
                          type={'text'}
                          disabled={true}
                          label={'Routing Number'}
                          value={selectedBeneficiary?.routing_number || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>
                      {/* City */}
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'city'}
                          type={'text'}
                          disabled={true}
                          label={'City'}
                          placeholder={'Enter City'}
                          value={selectedBeneficiary?.city || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>
                      {/* Country */}
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'country'}
                          type={'text'}
                          disabled={true}
                          label={'Country'}
                          placeholder={'Enter Country'}
                          value={selectedBeneficiary?.country?.country || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>
                      {/* Corresponding Bank */}
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'corresponding_bank'}
                          type={'text'}
                          disabled={true}
                          label={'Corresponding Bank'}
                          value={selectedBeneficiary?.corresponding_bank || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>
                      {/* Bank Account Number */}
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'bank_account_number'}
                          type={'text'}
                          disabled={true}
                          label={'Bank Account Number'}
                          value={
                            selectedBeneficiary?.corresponding_bank_account_number ||
                            ''
                          }
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>
                      {/* Purpose */}
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'purpose'}
                          type={'text'}
                          disabled={true}
                          label={'Purpose'}
                          placeholder={'Enter Purpose'}
                          value={
                            selectedBeneficiary?.purpose?.description || ''
                          }
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>
                      {/* By Order */}
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'by_order'}
                          type={'text'}
                          disabled={isDisabled}
                          label={'By Order'}
                          placeholder={'Enter By Order'}
                          value={values.by_order}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.by_order && errors.by_order}
                        />
                      </div>
                      {/* Send FC And Amount*/}
                      <div className="col-12 col-sm-6 mb-45">
                        <CombinedInputs
                          label="Send FC"
                          type1="select"
                          type2="input"
                          name1="send_fc_id"
                          name2="send_amount"
                          value1={values.send_fc_id}
                          value2={values.send_amount}
                          options1={currencyOptions}
                          isDisabled={isDisabled}
                          handleBlur={handleBlur}
                          placeholder1="Currency"
                          placeholder2="Amount"
                          inputType2="number"
                          inputProps2={{ inputClass: 'amount-field' }}
                          onChange1={(selected) => {
                            setSendCurrency(selected);
                            setFieldValue('send_fc_id', selected.value);
                            setHasShownMissingRateModal(false);
                            setCurrenciesManuallyChanged(true); // Mark that user changed currency
                            // Clear base rate when Send FC changes
                            setFieldValue('base_rate', '');
                            setFieldValue('lcy_amount', '');
                            // Always mark send_amount as touched when send_fc is selected to show error if empty
                            if (selected.value) {
                              setFieldTouched('send_amount', true);
                              // Validate immediately to show send_amount error if empty
                              setTimeout(() => {
                                validateForm();
                              }, 0);
                            }
                          }}
                          onChange2={handleChange}
                          additionalProps={{
                            isLoadingCurrencyRate: isLoadingCurrencyRatesPair,
                          }}
                        />
                        {!isLoadingCurrencyRatesPair && (
                          <>
                            <ErrorMessage
                              name="send_fc_id"
                              component="div"
                              className="input-error-message text-danger"
                            />
                            <ErrorMessage
                              name="send_amount"
                              component="div"
                              className="input-error-message text-danger"
                            />
                          </>
                        )}
                      </div>
                      {/* Rate Type and Rate */}
                      <div className="col-12 col-sm-6 mb-45">
                        <CombinedInputs
                          label="Rate Type"
                          type1="select"
                          type2="input"
                          name1="rate_type"
                          name2="rate"
                          value1={values.rate_type}
                          value2={values.rate}
                          options1={[
                            { label: 'X', value: 'X' },
                            { label: '/', value: '/' },
                          ]}
                          isfirstInputDisabled={false}
                          isSecondInputDisabled={false}
                          isDisabled={isDisabled}
                          handleBlur={handleBlur}
                          placeholder2="Rate"
                          inputType2="number"
                          inputProps2={{
                            inputClass: `rate-field ${showRateError ? 'text-danger' : ''}`,
                          }}
                          onChange1={(selected) => {
                            setFieldValue('rate_type', selected.value);

                            // Clear rate error when changing rate type
                            setShowRateError(false);

                            // Update rate based on rate type and available rates
                            if (
                              selected.value === '/' &&
                              currencyRatesPair?.reverse_rate
                            ) {
                              setFieldValue(
                                'rate',
                                currencyRatesPair.reverse_rate
                              );
                            } else if (
                              selected.value === 'X' &&
                              currencyRatesPair?.direct_rate
                            ) {
                              setFieldValue(
                                'rate',
                                currencyRatesPair.direct_rate
                              );
                            }
                          }}
                          onChange2={(e) => {
                            const newRate = e.target.value;
                            handleChange(e);

                            // Validate rate range using backend-provided range and clear error if rate is now valid
                            const isError = validateRateRange(
                              newRate,
                              currencyRatesPair,
                              values.rate_type
                            );
                            setShowRateError(isError);

                            // Clear error if rate is empty or valid
                            if (!newRate || !isError) {
                              setShowRateError(false);
                            }
                          }}
                        />
                        {showRateError && currencyRatesPair && (
                          <div className="text-danger input-error-message py-0">
                            Range:{' '}
                            {values.rate_type === '/'
                              ? `${parseFloat(currencyRatesPair.reverse_from || 0).toFixed(6)} - ${parseFloat(currencyRatesPair.reverse_upto || 0).toFixed(6)}`
                              : `${parseFloat(currencyRatesPair.direct_from || 0).toFixed(6)} - ${parseFloat(currencyRatesPair.direct_upto || 0).toFixed(6)}`
                            }
                          </div>
                        )}
                        <ErrorMessage
                          name="rate"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>
                      {/* Against Currency And Amount */}
                      <div className="col-12 col-sm-6 mb-45">
                        <CombinedInputs
                          label="Against"
                          type1="select"
                          type2="input"
                          name1="against_currency_id"
                          name2="against_amount"
                          value1={values.against_currency_id}
                          value2={formatNumberForDisplay(values.against_amount)}
                          isSecondInputDisabled
                          options1={currencyOptions}
                          isDisabled={isDisabled}
                          handleBlur={handleBlur}
                          placeholder1="Currency"
                          placeholder2="Amount"
                          inputType2="number"
                          inputProps2={{
                            inputClass: 'amount-field',
                            readOnly: true,
                          }}
                          onChange1={(selected) => {
                            setAgainstCurrency(selected);
                            setFieldValue(
                              'against_currency_id',
                              selected.value
                            );
                            setHasShownMissingRateModal(false);
                            setCurrenciesManuallyChanged(true); // Mark that user changed currency
                            // Clear base rate when Against currency changes
                            setFieldValue('base_rate', '');
                            setFieldValue('lcy_amount', '');
                            // Always mark against_amount as touched when against_currency is selected to show error if empty
                            if (selected.value) {
                              setFieldTouched('against_amount', true);
                              // Validate immediately to show against_amount error if empty
                              setTimeout(() => {
                                validateForm();
                              }, 0);
                            }
                          }}
                          additionalProps={{
                            isLoadingCurrencyRate: isLoadingCurrencyRatesPair,
                          }}
                        />
                        {!isLoadingCurrencyRatesPair && (
                          <>
                            <ErrorMessage
                              name="against_currency_id"
                              component="div"
                              className="input-error-message text-danger"
                            />
                            <ErrorMessage
                              name="against_amount"
                              component="div"
                              className="input-error-message text-danger"
                            />
                          </>
                        )}
                      </div>
                      <div className="col-12 col-sm-6 mb-45" />

                      {/* Currency Send Charges */}
                      <div className="col-12 col-sm-6 mb-4">
                        <CustomInput
                          name={'currency_charges'}
                          type={'number'}
                          label={`${
                            sendCurrency?.label
                              ? `Currency ${sendCurrency.label} Charges`
                              : 'Select Send FC'
                          }`}
                          placeholder={'Enter Charges'}
                          value={values.currency_charges}
                          onChange={(e) => {
                            handleChange(e);
                            // Always mark VAT fields as touched when commission is entered to show VAT errors
                            const commissionValue =
                              parseFloat(e.target.value) || 0;
                            if (commissionValue > 0) {
                              setFieldTouched('vat_terms', true);
                              setFieldTouched('vat_amount', true);
                              // Validate immediately to show VAT errors if empty
                              setTimeout(() => {
                                validateForm();
                              }, 0);
                            }
                          }}
                          onBlur={handleBlur}
                          disabled={
                            isDisabled || !!addedSpecialCommissionValues
                          }
                          error={
                            touched.currency_charges && errors.currency_charges
                          }
                        />
                      </div>
                      {/* Currency Against Charges */}
                      <div className="col-12 col-sm-6 mb-4">
                        <CombinedInputs
                          label={`${
                            againstCurrency?.label
                              ? `Currency ${againstCurrency?.label} Charges`
                              : 'Select Against'
                          }`}
                          type1="input"
                          type2="input"
                          name1="currency_charges"
                          name2="currency_charges_amount"
                          min2={0}
                          value1={againstCurrency?.label}
                          value2={values.currency_charges_amount}
                          handleBlur={handleBlur}
                          placeholder1="Currency"
                          placeholder2="Amount"
                          inputType2="number"
                          onChange2={(e) => {
                            const newAgainstCharges = e.target.value;
                            setFieldValue(
                              'currency_charges_amount',
                              newAgainstCharges
                            );

                            // Calculate and update Send Currency charges based on Against Currency charges
                            const rate = parseFloat(values.rate) || 0;
                            if (rate !== 0 && newAgainstCharges) {
                              let sendCharges;
                              if (values.rate_type === '/') {
                                sendCharges =
                                  parseFloat(newAgainstCharges) *
                                  parseFloat(rate);
                              } else {
                                sendCharges =
                                  parseFloat(newAgainstCharges) / rate;
                              }
                              setFieldValue('currency_charges', sendCharges);
                            } else if (!newAgainstCharges) {
                              setFieldValue('currency_charges', '');
                            }

                            // Mark VAT fields as touched when Against Currency charges are entered
                            const commissionValue =
                              parseFloat(newAgainstCharges) || 0;
                            if (commissionValue > 0) {
                              setFieldTouched('vat_terms_id', true);
                              setFieldTouched('vat_amount', true);
                              // Validate immediately to show VAT errors if empty
                              setTimeout(() => {
                                validateForm();
                              }, 0);
                            }
                          }}
                          isDisabled={
                            isDisabled || !!addedSpecialCommissionValues
                          }
                        />
                        <ErrorMessage
                          name="currency_charges_amount"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>
                      {/* VAT Terms */}
                      {((vatData?.vatType?.vat_type === 'variable' &&
                        outwardRemittance?.vat_type !== 'fixed') ||
                        (isVatTypeMismatch() &&
                          outwardRemittance?.vat_type === 'variable')) && (
                        <div className="col-12 col-sm-6 mb-45">
                          <SearchableSelect
                            name={'vat_terms'}
                            label={'VAT %'}
                            options={
                              isVatTypeMismatch()
                                ? [
                                    {
                                      label: `${values.vat_terms}${
                                        values.vat_percentage
                                          ? ' - ' + values.vat_percentage + '%'
                                          : ''
                                      }`,
                                      value: values.vat_terms_id,
                                      id: values.vat_terms_id,
                                      title: values.vat_terms,
                                      percentage: values.vat_percentage,
                                    },
                                  ]
                                : (() => {
                                    const currentOptions =
                                      getVATTermsOptions() || [];
                                    // Check if selected option exists in current options
                                    const selectedExists = currentOptions.find(
                                      (opt) => opt.value === values.vat_terms_id
                                    );

                                    // If selected value exists, return current options
                                    if (
                                      selectedExists ||
                                      !values.vat_terms_id
                                    ) {
                                      return currentOptions;
                                    }

                                    // If selected doesn't exist, add it to options so it displays
                                    return [
                                      ...currentOptions,
                                      {
                                        label: `${values.vat_terms}${
                                          values.vat_percentage &&
                                          values.vat_percentage !== 'Nill'
                                            ? ' - ' +
                                              values.vat_percentage +
                                              '%'
                                            : ''
                                        }`,
                                        value: values.vat_terms_id,
                                        id: values.vat_terms_id,
                                        title: values.vat_terms,
                                        percentage: values.vat_percentage,
                                      },
                                    ];
                                  })()
                            }
                            isDisabled={isDisabled || isVatTypeMismatch()}
                            placeholder={'Select VAT %'}
                            value={values.vat_terms_id}
                            onChange={(selected) => {
                              if (
                                selected.percentage
                                  ?.toString()
                                  .startsWith('A small popup will appear')
                              ) {
                                setShowVatOutOfScopeModal(true);
                              } else {
                                // For variable VAT, store the selected option as vat_terms
                                const vatTerms = selected?.title ?? '';
                                const vatPercentage =
                                  selected?.percentage ?? '';
                                setFieldValue('vat_terms', vatTerms);
                                setFieldValue('vat_terms_id', selected.id); // Store VAT terms ID

                                // Set VAT percentage to 0 for exempted/zero rate/out of scope conditions
                                if (
                                  shouldVatAmountBeZero(vatTerms, vatPercentage)
                                ) {
                                  setFieldValue('vat_percentage', 0);
                                } else {
                                  setFieldValue(
                                    'vat_percentage',
                                    vatPercentage
                                  );
                                }
                                let currencyChargesAmount =
                                  parseFloat(values.currency_charges_amount) ||
                                  0;

                                // Check if VAT amount should be 0 based on VAT terms
                                let vat = '';
                                if (
                                  shouldVatAmountBeZero(vatTerms, vatPercentage)
                                ) {
                                  vat = 0;
                                } else if (vatPercentage) {
                                  vat =
                                    (currencyChargesAmount * vatPercentage) /
                                    100;
                                } else if (
                                  values.against_amount &&
                                  vatPercentage &&
                                  !currencyChargesAmount
                                ) {
                                  // For Standard Rate, calculate VAT on the against amount when no currency charges
                                  vat =
                                    (values.against_amount * vatPercentage) /
                                    100;
                                }

                                setFieldValue('vat_amount', vat); // Set VAT amount
                                const specialCommissionAmount =
                                  addedSpecialCommissionValues?.total_commission
                                    ? parseFloat(
                                        addedSpecialCommissionValues.total_commission
                                      ) || 0
                                    : 0;
                                setFieldValue(
                                  'net_total',
                                  Math.round(
                                    (parseFloat(values.against_amount || 0) +
                                      currencyChargesAmount +
                                      (vat || 0) +
                                      specialCommissionAmount +
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
                      {(vatData?.vatType?.vat_type === 'fixed' ||
                        (isVatTypeMismatch() &&
                          outwardRemittance?.vat_type === 'fixed')) && (
                        <div className="col-12 col-sm-6 mb-3">
                          <CustomInput
                            name={'vat_percentage'}
                            label={'VAT %'}
                            type={'text'}
                            disabled={true}
                            placeholder={'Enter VAT %'}
                            value={
                              outwardRemittance?.vat_type === 'fixed'
                                ? `Fixed - ${values.vat_percentage}%`
                                : values.vat_percentage
                            }
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                        </div>
                      )}

                      {/* Fallback VAT field - always show when other conditions don't match */}
                      {!(
                        (vatData?.vatType?.vat_type === 'variable' &&
                          outwardRemittance?.vat_type !== 'fixed') ||
                        (isVatTypeMismatch() &&
                          outwardRemittance?.vat_type === 'variable')
                      ) &&
                        !(
                          vatData?.vatType?.vat_type === 'fixed' ||
                          (isVatTypeMismatch() &&
                            outwardRemittance?.vat_type === 'fixed')
                        ) && (
                          <div className="col-12 col-sm-6 mb-45">
                            <SearchableSelect
                              name={'vat_terms'}
                              label={'VAT %'}
                              options={vatTermsOptions || getVATTermsOptions()}
                              isDisabled={isDisabled}
                              placeholder={'Select VAT %'}
                              value={values.vat_terms_id}
                              onChange={(selected) => {
                                if (
                                  selected.percentage
                                    ?.toString()
                                    .startsWith('A small popup will appear')
                                ) {
                                  setShowVatOutOfScopeModal(true);
                                } else {
                                  const vatTerms = selected?.title ?? '';
                                  const vatPercentage =
                                    selected?.percentage ?? '';
                                  setFieldValue('vat_terms', vatTerms);
                                  setFieldValue('vat_terms_id', selected.id);
                                  if (
                                    shouldVatAmountBeZero(
                                      vatTerms,
                                      vatPercentage
                                    )
                                  ) {
                                    setFieldValue('vat_percentage', 0);
                                  } else {
                                    setFieldValue(
                                      'vat_percentage',
                                      vatPercentage
                                    );
                                  }
                                  let currencyChargesAmount =
                                    parseFloat(
                                      values.currency_charges_amount
                                    ) || 0;
                                  let vat = '';
                                  if (
                                    shouldVatAmountBeZero(
                                      vatTerms,
                                      vatPercentage
                                    )
                                  ) {
                                    vat = 0;
                                  } else if (vatPercentage) {
                                    vat =
                                      (currencyChargesAmount * vatPercentage) /
                                      100;
                                  } else if (
                                    values.against_amount &&
                                    vatPercentage &&
                                    !currencyChargesAmount
                                  ) {
                                    // For Standard Rate, calculate VAT on the against amount when no currency charges
                                    vat =
                                      (values.against_amount * vatPercentage) /
                                      100;
                                  }
                                  setFieldValue('vat_amount', vat);
                                  setFieldValue(
                                    'net_total',
                                    Math.round(
                                      (parseFloat(values.against_amount || 0) +
                                        currencyChargesAmount +
                                        (vat || 0) +
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

                      <div className="col-12 col-sm-6 mb-45">
                        <CustomInput
                          name={'vat_amount'}
                          label={'VAT Amount'}
                          type={'text'}
                          disabled={true}
                          placeholder={'Enter VAT Amount'}
                          value={
                            vatData.isLoadingVatType
                              ? 'Loading...'
                              : values.vat_amount === 0
                                ? 0
                                : values.vat_amount || ''
                          }
                          onBlur={handleBlur}
                        />
                      </div>
                      {/* Net Total */}
                      <div className="col-12 col-sm-6 mb-3">
                        <CombinedInputs
                          label="Net Total"
                          type1="input"
                          type2="input"
                          name2="net_total"
                          value1={againstCurrency?.label}
                          value2={values.net_total}
                          isDisabled={true}
                          placeholder1="Currency"
                          placeholder2="Net Total"
                        />
                      </div>
                      {/* Base Rate */}
                      <div className="col-12 col-sm-6 mb-45">
                        <CustomInput
                          name={'base_rate'}
                          type={'number'}
                          disabled={false}
                          label={'Base Rate'}
                          placeholder={'Rate'}
                          value={values.base_rate}
                          onChange={(e) => {
                            handleChange(e);

                            // Validate base rate range and clear error if valid
                            const newRate = e.target.value;
                            const isError = validateBaseRateRange(
                              newRate,
                              currencyRate
                            );
                            setShowBaseRateError(isError);

                            // Clear error if rate is empty or valid
                            if (!newRate || !isError) {
                              setShowBaseRateError(false);
                            }
                          }}
                          onBlur={handleBlur}
                          error={
                            (touched.base_rate && errors.base_rate) ||
                              showBaseRateError
                              ? currencyRate?.rate
                                ? currencyRate?.min_range && currencyRate?.max_range
                                  ? `Range: ${parseFloat(currencyRate.min_range).toFixed(6)} - ${parseFloat(currencyRate.max_range).toFixed(6)}`
                                  : `Range: ${(parseFloat(currencyRate.rate) * 0.99).toFixed(6)} - ${(parseFloat(currencyRate.rate) * 1.01).toFixed(6)}`
                                : 'Invalid rate'
                              : ''
                          }
                          inputClass={showBaseRateError ? 'text-danger' : ''}
                        />
                      </div>
                      {/* LCy Amount */}
                      <div className="col-12 col-sm-6 mb-3">
                        <CombinedInputs
                          label={`${base_currency || 'LC'} Amount`}
                          type1="input"
                          type2="input"
                          name2="lcy_amount"
                          value1={base_currency}
                          value2={values.lcy_amount}
                          isDisabled={true}
                          placeholder1="Currency"
                          placeholder2="Amount"
                          inputType2="number"
                        />
                      </div>
                      {/* Settle Thru */}
                      <div className="col-12 col-sm-6 mb-3">
                        <SearchableSelect
                          name={'settle_thru'}
                          label={'Settle Thru'}
                          isDisabled={isDisabled}
                          placeholder={'Settle Thru'}
                          options={settleThruOptions}
                          value={values.settle_thru}
                          onChange={(e) => {
                            setFieldValue('settle_thru', e.value);
                          }}
                          onBlur={handleBlur}
                        />
                        <ErrorMessage
                          name="settle_thru"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>
                      <div className="d-flex my-4">
                        <CustomButton
                          type={'button'}
                          onClick={handleNavigateToSpecialCommissionPage}
                          text={`${
                            !!addedSpecialCommissionValues ? 'Edit' : 'Add'
                          } Special Commission`}
                          disabled={!!values.currency_charges || isDisabled}
                        />
                      </div>
                      {!!addedSpecialCommissionValues ? (
                        <p
                          className={`fs-5 ${
                            addedSpecialCommissionValues.commission_type?.toLowerCase() ===
                            'income'
                              ? 'text-success'
                              : 'text-danger'
                          }`}
                        >
                          {addedSpecialCommissionValues?.commission}%{' '}
                          {addedSpecialCommissionValues?.commission_type?.toLowerCase() ==
                          'income'
                            ? 'receivable'
                            : 'payable'}{' '}
                          commission of{' '}
                          {
                            currencyOptions.find(
                              (x) => x.value == values.against_currency_id
                            )?.label
                          }{' '}
                          {formatNumberWithCommas(
                            addedSpecialCommissionValues?.total_commission
                          )}{' '}
                          on{' '}
                          {
                            currencyOptions.find(
                              (x) => x.value == values.send_fc_id
                            )?.label
                          }{' '}
                          {formatNumberWithCommas(
                            addedSpecialCommissionValues?.amount
                          )}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="col-12 col-lg-10 col-xl-9 col-xxl-3 mt-3 mt-xxl-0 offset-xxl-2">
                    <div className="row">
                      {/* Right side cards */}
                      {getAccountBalanceSettings(settingsID) && (
                        <div>
                          {/* Debit Account Balance */}
                          {selectedLedgerAccount?.value && values.account_id && (
                            <AccountBalanceCard
                              heading="Account Balance"
                              accountName={selectedLedgerAccount?.label}
                              balances={
                                selectedLedgerAccountBalance?.detail?.balances || []
                              }
                              loading={isLoadingSelectedLedgerAccountBalance}
                              error={
                                isErrorSelectedLedgerAccountBalance &&
                                errorSelectedLedgerAccountBalance?.message
                              }
                            />
                          )}
                        </div>
                      )}
                      {/* Remitter */}
                      <div>
                        <CustomInput
                          name={'remitter'}
                          type={'text'}
                          disabled={true}
                          label={'Remitter'}
                          placeholder={'Enter Remitter'}
                          value={selectedLedgerAccount?.account_title || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>
                      {/* Remitter Telephone Number */}
                      <div>
                        <CustomInput
                          name={'remitter_telephone_number'}
                          type={'text'}
                          disabled={true}
                          label={'Remitter Telephone Number'}
                          placeholder={'Enter Remitter Telephone Number'}
                          value={selectedLedgerAccount?.telephone_number || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>
                      {/* Remitter Nationality */}
                      <div>
                        <CustomInput
                          name={'nationality'}
                          type={'text'}
                          disabled={true}
                          label={'Nationality'}
                          placeholder={'Enter Nationality'}
                          value={selectedLedgerAccount?.nationality?.name || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>
                      {/* ID No */}
                      <div>
                        <CustomInput
                          name={'id_no'}
                          type={'text'}
                          disabled={true}
                          label={'ID No'}
                          placeholder={'Enter ID No'}
                          value={selectedLedgerAccount?.id_number || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>
                      {/* Valid Upto */}
                      <div>
                        <CustomInput
                          name={'valid_upto'}
                          type={'date'}
                          disabled={true}
                          label={'Valid Upto'}
                          placeholder={'Enter Valid Upto'}
                          value={selectedLedgerAccount?.valid_upto || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>
                      {/* Company */}
                      <div>
                        <CustomInput
                          name={'company'}
                          type={'text'}
                          disabled={true}
                          label={'Company'}
                          placeholder={'Enter Company'}
                          value={selectedLedgerAccount?.company_name || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attachments */}
                <FileDisplayList
                  files={addedAttachments}
                  onRemoveFile={handleRemoveAttachedFile}
                />
                {/* Print and Account Balance Checkboxes */}
                <div className="row">
                  <div className="d-flex flex-wrap justify-content-start mb-45">
                    <div className="d-inline-block mt-3 mb-45">
                      {/* Print and Account Balance Checkboxes */}
                      <CustomCheckbox
                        label="Account Balance"
                        checked={getAccountBalanceSettings(settingsID)}
                        style={{ border: 'none', margin: 0 }}
                        onChange={(e) => {
                          updateAccountBalanceSetting(
                            settingsID,
                            e.target.checked
                          );
                        }}
                        readOnly={isDisabled}
                      />
                      <CustomCheckbox
                        label="Back to Back Entry"
                        style={{
                          border: 'none',
                          margin: 0,
                          display: 'inline-block !important',
                        }}
                        readOnly={isDisabled}
                        checked={getBackToBackSettings(settingsID)}
                        onChange={(e) => {
                          updateBackToBackSetting(settingsID, e.target.checked);
                        }}
                      />
                      <CustomCheckbox
                        label="Print"
                        checked={getPrintSettings(settingsID)}
                        onChange={(e) => {
                          updatePrintSetting(settingsID, e.target.checked);
                        }}
                        style={{ border: 'none', margin: 0 }}
                        readOnly={isDisabled}
                      />
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
            disabled: !hasEditPermission,
          },
          {
            text: 'Cancel',
            onClick: handleResetForm,
            variant: 'secondaryButton',
          },
        ]}
        loading={updateOutwardRemittanceMutation.isPending}
        onAttachmentClick={() => setShowAttachmentsModal(true)}
        lastVoucherNumbers={lastVoucherNumbers}
        setPageState={setPageState}
        setWriteTerm={setWriteTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* Upload Attachments Modal */}
      <CustomModal
        show={showAttachmentsModal}
        close={() => setShowAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          showModal={showAttachmentsModal}
          closeModal={() => setShowAttachmentsModal(false)}
          item={outwardRemittanceData}
          uploadService={addOutwardRemittanceAttachment}
          deleteService={deleteOutwardRemittanceAttachment}
          closeUploader={() => setShowAttachmentsModal(false)}
          voucherAttachment={true}
          queryToInvalidate={['outwardRemittance', searchTerm]}
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
          setShowVatOutOfScopeModal(false);
        }}
        hideClose={true}
      >
        <div className="text-center mb-3 mt-5">
          <h4 className="modalTitle px-5">Out Of Scope</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{ out_of_scope: outOfScope }}
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
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </CustomModal>

      {/* Special Commission Modal */}
      <CustomModal
        show={showSCModal}
        close={() => setShowSCModal(false)}
        size="xl"
        closeOnOutsideClick={false}
      >
        <SpecialCommission
          preFilledValues={{
            date,
            transaction_no: outwardRemittance?.transaction_no || '',
            account:
              getAccountsByTypeOptions(formikRef?.current?.values.ledger).find(
                (x) => x.value === formikRef?.current?.values.account_id
              ) || '',
            currency: addedSpecialCommissionValues?.currency_id
              ? (currencyOptions || []).find(
                  (x) => x.value === addedSpecialCommissionValues.currency_id
                ) || ''
              : (currencyOptions || []).find(
                  (x) =>
                    x.value === formikRef?.current?.values.against_currency_id
                ) || '',
            amount: formikRef?.current?.values.against_amount || 0,
            ...addedSpecialCommissionValues,
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
          }}
          sCValues={addedSpecialCommissionValues}
          isEdit={true}
          availableCurrencies={currencyOptions
            .filter(
              (c) =>
                c.value === formikRef.current?.values.send_fc_id ||
                c.value === formikRef.current?.values.against_currency_id
            )
            .map((c) => ({
              ...c,
              amount:
                c.value === formikRef.current?.values.send_fc_id
                  ? formikRef.current?.values.send_amount
                  : formikRef.current?.values.against_amount,
            }))}
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

      {/* Add Cheque Detail Modal */}
      <CustomModal
        show={!!showAddChequeDetailModal}
        close={() => setShowAddChequeDetailModal('')}
        size="lg"
        closeOnOutsideClick={false}
      >
        <ChequeDetailForm
          voucherDate={date}
          settleThru={formikRef?.current?.values?.settle_thru}
          inPopup
          initialValues={
            outwardRemittance
              ? (() => {
                const initialValues = {
                  bank_id:
                    outwardRemittance?.cheque_detail_bank_id ||
                    outwardRemittance?.bank?.id ||
                    '',
                  cheque_number:
                    outwardRemittance?.cheque?.id ||
                    outwardRemittance?.cheque_detail_cheque_number ||
                    '',
                  cheque_number_label: outwardRemittance?.cheque?.cheque_number || outwardRemittance?.cheque_detail_cheque_number || '',
                  due_date: outwardRemittance?.cheque_detail_due_date || '',
                };
      
                return initialValues;
              })()
              : undefined
          }
          onSuccess={(data) => {
            // Add cheque_detail_ to every key of data
            const chequeData = {
              ...Object.fromEntries(
                Object.entries(data).map(([key, value]) => [
                  `cheque_detail_${key}`,
                  value,
                ])
              ),
            };
            setChequeDetails(chequeData);
            setShowAddChequeDetailModal(false);

            // After setting cheque details, automatically submit the voucher
            setIsSubmittingFromChequeModal(true);
            setTimeout(() => {
              handleSubmit();
            }, 100);
          }}
          onCancel={() => {
            setShowAddChequeDetailModal(false);
            setIsSubmittingFromChequeModal(false); // Reset flag when modal is cancelled
          }}
        />
      </CustomModal>

      {/* Missing Currency Rate Modal */}
      <CustomModal
        show={showMissingCurrencyRateModal}
        close={() => setShowMissingCurrencyRateModal(false)}
        title={'Missing Rate of Exchange'}
        description={`${
          pairMissingCurrencyRateModal
            ? 'No exchange rate is available between Send and Against currency.'
            : 'Rate of exchange is missing for selected currency.'
        }`}
        variant={'error'}
        btn1Text={'Update Rate of Exchange'}
        action={() => {
          setLastVisitedPage(formId, 'rate-of-exchange');
          saveFormValues(formId, {
            ...formikRef.current.values,
            date,
            value_date: valueDate,
            sendCurrency,
            againstCurrency,
            selectedLedgerAccount,
            selectedBeneficiary,
            addedAttachments,
          });

          navigate('/transactions/remittance-rate-of-exchange', {
            state: { currencyToSelect, date },
          });
        }}
      />
    </>
  );
};

export default withModal(OutwardRemittanceEdit);
