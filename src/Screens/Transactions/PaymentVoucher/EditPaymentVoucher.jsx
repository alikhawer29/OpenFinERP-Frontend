import { ErrorMessage, Form, Formik } from 'formik';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import AccountBalanceCard from '../../../Components/AccountBalanceCard/AccountBalanceCard';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CustomButton from '../../../Components/CustomButton';
import CustomCheckbox from '../../../Components/CustomCheckbox/CustomCheckbox';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import ExchangeRatesCard from '../../../Components/ExchangeRatesCard/ExchangeRatesCard';
import FileDisplayList from '../../../Components/FileDisplayList/FileDisplayList';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import SignatureCanvas from 'react-signature-canvas';
import CombinedInputs from '../../../Components/CombinedInputs/CombinedInputs.jsx';
import { showToast } from '../../../Components/Toast/Toast.jsx';
import useCurrencyRate from '../../../Hooks/useCurrencyRate.js';
import {
  getAccountBalances,
  getCurrencyRate,
  getExchangeRates,
  pairReleased,
} from '../../../Services/General';
import { getBeneficiaryRegisterListing } from '../../../Services/Masters/BeneficiaryRegister.js';
import {
  checkTransactionLockStatus,
  releaseTransaction,
} from '../../../Services/Process/TransactionLock.js';
import { getChequeNumberByBank } from '../../../Services/Transaction/JournalVoucher.js';
import {
  addPaymentVoucherAttachment,
  deletePaymentVoucherAttachment,
  getBenefeciariesByAccount,
  getPaymentVoucherListing,
  updatePaymentVoucher,
} from '../../../Services/Transaction/PaymentVoucher.js';
import useFormStore from '../../../Stores/FormStore.js';
import useSettingsStore from '../../../Stores/SettingsStore.js';
import { formatNumberTwoDecimals, transformSpecialCommission } from '../../../Utils/Helpers';
import { showErrorToast } from '../../../Utils/Utils.jsx';
import SpecialCommission from '../SpecialCommission/SpecialCommission';

const EditPaymentVoucher = ({
  setWriteTerm,
  date,
  setDate,
  showModal,
  getAccountsByTypeOptions,
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
  lastVoucherNumbers,
  onFormDataChange,
  accountData,
  modesData,
  hasPrintPermission,
}) => {
  // const navigate = useNavigate();
  // const formikRef = useRef();
  // const [showVatOutOfScopeModal, setShowVatOutOfScopeModal] = useState(false);

  const queryClient = useQueryClient();
  const formikRef = useRef();

  // Access the form store
  const {
    saveFormValues,
    getFormValues,
    hasFormValues,
    clearFormValues,
    setLastVisitedPage,
    getLastVisitedPage,
    clearLastVisitedPage,
  } = useFormStore();
  const formId = 'edit-payment-voucher'; // Unique identifier for this form
  const voucherName = 'payment_voucher';

  // For getting print checkbox state from BE
  const {
    getPrintSettings,
    getAccountBalanceSettings,
    updateAccountBalanceSetting,
    updatePrintSetting,
  } = useSettingsStore();

  const [showVatOutOfScopeModal, setShowVatOutOfScopeModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState(null);
  const [selectedModeAccount, setSelectedModeAccount] = useState(null);
  const [exchangeRatesInverse, setExchangeRatesInverse] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [outOfScope, setOutOfScope] = useState('');
  const [specialCommissionValues, setSpecialCommissionValues] = useState({});
  const [addedSpecialCommissionValues, setAddedSpecialCommissionValues] =
    useState(null);
  const [showSCModal, setShowSCModal] = useState(false);

  const [voucherDate, setVoucherDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);
  const [isDueDateEditable, setIsDueDateEditable] = useState(false);
  const [isChequeFieldEnabled, setIsChequeFieldEnabled] = useState(false);
  const [addedAttachments, setAddedAttachments] = useState({});
  const [deletedAttachments, setDeletedAttachments] = useState([]); // Track IDs of attachments to delete
  const [currentFiles, setCurrentFiles] = useState([]); // Track current files for UI display
  const filesInitializedRef = useRef(false); // Track if files have been initialized

  const apiBaseUrl = import.meta.env.VITE_MILESTONE_BASE_URL;

  const sigCanvas = useRef(null);
  const [trimmedDataURL, setTrimmedDataURL] = useState(null);
  const [errorSignature, setErrorSignature] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [isNewSignatureDrawn, setIsNewSignatureDrawn] = useState(false); // Flag for whether a new signature was drawn
  const returningFromRateOfExchange = useRef(false); // Track if returning from rate-of-exchange
  const {
    data: { data: [paymentVoucherData] = [] } = {},
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['paymentVoucher', searchTerm],
    queryFn: () => getPaymentVoucherListing({ search: searchTerm }),
  });

  // Check Transaction lock status to enable/disable Save
  const { isLoading: isLoadingLockStatus, refetch: checkFormStatus } = useQuery(
    {
      queryKey: ['save_lock_status', voucherName, paymentVoucherData?.id],
      queryFn: () =>
        checkTransactionLockStatus({
          transaction_type: voucherName,
          transaction_id: paymentVoucherData?.id,
        }),
      enabled: false,
      retry: false,
    }
  );

  // Fetch currency rate for the selected Currency
  const { data: currencyRate, isLoading: isLoadingCurrencyRate } =
    useCurrencyRate(selectedCurrency, date);

  // Account balances
  const { data: ledgerAccountBalance } = useQuery({
    queryKey: ['accountBalance', selectedLedgerAccount?.value],
    queryFn: () =>
      getAccountBalances(
        selectedLedgerAccount.value,
        selectedLedgerAccount.accountType
      ),
    enabled:
      !!selectedLedgerAccount?.value &&
      getAccountBalanceSettings('payment_voucher'),
    staleTime: 1000 * 60 * 2,
    retry: 1,
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

  const { data: modeAccountBalance } = useQuery({
    queryKey: ['accountBalance', selectedModeAccount?.value],
    queryFn: () =>
      getAccountBalances(
        selectedModeAccount.value,
        selectedModeAccount.accountType
      ),
    enabled:
      !!selectedModeAccount?.value &&
      getAccountBalanceSettings('payment_voucher'),
    staleTime: 1000 * 60 * 2,
  });

  function clear() {
    sigCanvas.current.clear();
    setTrimmedDataURL(null);
    setErrorSignature(false);
    setIsNewSignatureDrawn(false); // Reset the flag when clearing
  }

  function trim() {
    setTrimmedDataURL(sigCanvas.current.toDataURL());
    setErrorSignature(false);
    setIsNewSignatureDrawn(true); // Mark that a new signature was drawn
  }

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
      returningFromRateOfExchange.current = true; // Set flag
      const savedFormData = getFormValues(formId);
      const savedValues = savedFormData.values || {};
      const savedCurrencyId = savedValues.currency_id;
      const savedDate = savedFormData.date || date;

      // Helper function to restore all state variables
      const restoreAllState = () => {
        // Restore selected accounts
        if (savedFormData.selectedLedgerAccount) {
          setSelectedLedgerAccount(savedFormData.selectedLedgerAccount);
        }
        if (savedFormData.selectedModeAccount) {
          setSelectedModeAccount(savedFormData.selectedModeAccount);
        }
        if (savedFormData.selectedBank) {
          setSelectedBank(savedFormData.selectedBank);
        }

        // Restore attachments
        if (savedFormData.addedAttachments) {
          setAddedAttachments(savedFormData.addedAttachments);
        }
        if (savedFormData.deletedAttachments) {
          setDeletedAttachments(savedFormData.deletedAttachments);
        }
        if (savedFormData.currentFiles) {
          setCurrentFiles(savedFormData.currentFiles);
        }

        // Restore special commission
        if (savedFormData.addedSpecialCommissionValues) {
          setAddedSpecialCommissionValues(savedFormData.addedSpecialCommissionValues);
        }

        // Restore VAT out of scope
        if (savedFormData.outOfScope) {
          setOutOfScope(savedFormData.outOfScope);
        }

        // Restore signature
        if (savedFormData.trimmedDataURL) {
          setTrimmedDataURL(savedFormData.trimmedDataURL);
        }
        if (savedFormData.isNewSignatureDrawn !== undefined) {
          setIsNewSignatureDrawn(savedFormData.isNewSignatureDrawn);
        }

        // Restore due date
        if (savedFormData.dueDate) {
          setDueDate(savedFormData.dueDate);
        }
      };

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
              // Restore other form values (excluding currency)
              const { currency_id, ...otherValues } = savedValues;
              formikRef.current.setValues(otherValues);
            } else {
              // Rate exists, restore ALL form values including currency
              formikRef.current.setValues(savedValues);
              setSelectedCurrency(savedCurrencyId);
            }

            // Restore all other state variables
            restoreAllState();
            setIsDisabled(false);

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

            // Restore all other state variables
            restoreAllState();
            setIsDisabled(false);

            clearFormValues(formId);
            clearLastVisitedPage(formId);
          });
      } else {
        // No currency was saved, just restore all form values and state
        formikRef.current.setValues(savedValues);

        // Restore all other state variables
        restoreAllState();
        setIsDisabled(false);

        clearFormValues(formId);
        clearLastVisitedPage(formId);
      }
    } else if (lastPage !== 'special-commission') {
      if (hasFormValues('special-commission')) {
        setAddedSpecialCommissionValues(getFormValues('special-commission'));
      }
    }
    // Clear lastVisitedPage so it doesn't persist beyond one use
    clearLastVisitedPage(formId);
  }, []);



  // Update special commission values when payment voucher data changes
  useEffect(() => {
    const lastPage = getLastVisitedPage(formId);
    let pv = paymentVoucherData?.payment_vouchers;
    if (pv) {
      setOutOfScope(pv?.out_of_scope);
      setSpecialCommissionValues({
        ledger: {
          value: pv.ledger,
          label:
            pv.ledger === 'party'
              ? 'PL'
              : pv.ledger === 'general'
                ? 'GL'
                : 'WIC',
        },
        account: {
          value: pv.account_id,
          label: pv.account_name || pv.name,
        },
        amount: pv.amount,
        currency: {
          value: pv.amount_account_id?.id,
          label: pv.amount_account_id?.currency_code || '',
        },
        commission_type: {
          value: pv.commission_type,
          label: pv.commission_type,
        },
        date: pv.date,
      });

      if (pv?.special_commission && lastPage !== 'special-commission') {
        // Save the SC form values
        saveFormValues('special-commission', {
          ...pv?.special_commission,
          ledger: pv?.special_commission?.account_type,
          distributions: [...pv?.special_commission?.commission_distribution],
        });
      }

      // Initialize current files from payment voucher data only once
      const filesData = pv.files || paymentVoucherData?.files || [];
      if (!filesInitializedRef.current) {
        setCurrentFiles(filesData);
        filesInitializedRef.current = true;
      }

      // Initialize selected accounts for Account Balance
      if (pv.account_id) {
        const resolvedLabel =
          pv.account_name ||
          pv.account_title ||
          pv?.account_details?.title ||
          accountData?.[pv.ledger]?.data?.find((x) => x?.id === pv.account_id)
            ?.title ||
          '';

        setSelectedLedgerAccount({
          value: pv.account_id,
          label: resolvedLabel,
          accountType: pv.ledger,
        });
      }
      if (pv.mode_account_id?.id) {
        setSelectedModeAccount({
          value: pv.mode_account_id.id,
          label: pv.mode_account_id.account_name || '',
          accountType: pv.mode,
        });
        // Set selectedBank to fetch cheques for bank/pdc modes
        if (pv.mode?.toLowerCase() === 'bank' || pv.mode?.toLowerCase() === 'pdc') {
          setSelectedBank(pv.mode_account_id.id);
        }
      }

      // Initialize special commission data from existing payment voucher data
      if (pv?.special_commission) {
        setAddedSpecialCommissionValues(
          transformSpecialCommission(pv.special_commission)
        );
      }
    }
  }, [paymentVoucherData]);

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
    queryKey: ['beneficiaries', selectedLedgerAccount?.value],
    queryFn: () => {
      return getBenefeciariesByAccount(selectedLedgerAccount?.value);
    },
    enabled: !!selectedLedgerAccount?.value,
    staleTime: 1000 * 60 * 5, // 5 minutes
    onSuccess: (data) => {
      showToast('Beneficiaries fetched successfully:', data);
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  // Make options array from the benfeciary queries call
  const getBeneficiaryOptions = (account_id) => {
    if (!account_id) {
      return [{ label: 'Select Account First', value: null, isDisabled: true }];
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

  useEffect(() => {
    getBeneficiaryOptions(paymentVoucherData?.payment_vouchers?.account_id);
  }, [paymentVoucherData]);

  // Show Missing currency rate modal if rate not present
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
    handlePairReleased()
    // Release lock then navigate back
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
    if (paymentVoucherData?.payment_vouchers?.files || paymentVoucherData?.files) {
      setCurrentFiles(paymentVoucherData?.payment_vouchers?.files || paymentVoucherData?.files || []);
    } else {
      setCurrentFiles([]);
    }
    setTrimmedDataURL(null);
    setErrorSignature(false);
    setAttemptedSubmit(false);
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
    setPageState('view');
  };

  // Handle attachment deletion in deferred mode
  const handleDeletedAttachments = (attachmentId) => {
    setDeletedAttachments((prev) => [...prev, attachmentId]);
    // Remove from current files display
    setCurrentFiles((prev) => prev.filter((f) => f.id !== attachmentId));
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

  const updatePaymentVoucherMutation = useMutation({
    mutationFn: ({ searchTerm, payload }) =>
      updatePaymentVoucher(searchTerm, payload),
    onSuccess: (data) => {
      showToast('Payment Voucher Updated!', 'success');
      if (getPrintSettings('payment_voucher')) {
        if (data?.detail?.pdf_url) {
          window.open(data.detail.pdf_url, '_blank');
        }
      }
      queryClient.invalidateQueries(['paymentVoucherListing']);
      queryClient.invalidateQueries(['paymentVoucher', searchTerm]);
      handleCancel();
    },
    onError: (error) => {
      showErrorToast(error);
      if (
        error.message.toLowerCase() ==
        'payment voucher limit reached for this branch.'
      ) {
        showModal(
          'Cannot Create',
          'The maximum number of payment vouchers has been reached. To create new transactions, please increase the transaction number count in the Transaction Number Register.',
          null,
          'error'
        );
      } else {
        showErrorToast(error);
      }
    },
  });

  // Release lock on unmount or cancel
  const releaseExecutedRef = useRef(false);
  const releaseTransactionMutation = useMutation({
    mutationFn: releaseTransaction,
  });
  const releaseLock = useCallback(() => {
    if (releaseExecutedRef.current) return;
    if (paymentVoucherData?.id) {
      releaseTransactionMutation.mutate({
        transaction_type: voucherName,
        transaction_id: paymentVoucherData?.id,
      });
      releaseExecutedRef.current = true;
    }
  }, [paymentVoucherData?.id]);

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

  // Notify parent of form data changes (for saving before navigation)
  useEffect(() => {
    if (onFormDataChange && formikRef.current) {
      onFormDataChange({
        values: formikRef.current.values,
        addedAttachments,
        selectedLedgerAccount,
        selectedModeAccount,
        selectedBank,
        addedSpecialCommissionValues,
        outOfScope,
        trimmedDataURL,
        isNewSignatureDrawn,
        dueDate,
        currentFiles,
        deletedAttachments,
      });
    }
  }, [
    formikRef.current?.values,
    addedAttachments,
    selectedLedgerAccount,
    selectedModeAccount,
    selectedBank,
    addedSpecialCommissionValues,
    outOfScope,
    trimmedDataURL,
    isNewSignatureDrawn,
    dueDate,
    currentFiles,
    deletedAttachments,
    onFormDataChange,
  ]);


  const getAccountsByTypeMode = (mode) => {
    if (!mode) {
      return [{ label: 'Select Mode', value: null, isDisabled: true }];
    }

    const { data, loading, error, errorMessage } = modesData[mode] || {};

    if (loading) {
      return [{ label: 'Loading...', value: null, isDisabled: true }];
    }

    if (error) {
      return [{ label: 'Unable to fetch Mode', value: null }];
    }
    return (
      data?.map((x) => ({
        value: x?.id,
        label: x?.account_name,
      })) || []
    );
  };


  const handleSubmit = async () => {
    // run status check first
    const { error: errorLockStatus } = await checkFormStatus();
    if (errorLockStatus?.detail?.locked) {
      showToast(errorLockStatus?.message, 'warn');
      return;
    }
    if (!formikRef.current) return;
    setAttemptedSubmit(true);

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
      return; // Do not submit if there are errors
    }
    const formValues = formikRef.current.values;

    // Calculate VAT amount and percentage based on conditions
    let finalVatAmount = formValues.vat_amount;
    let finalVatPercentage = formValues.vat_percentage;

    if (shouldVatAmountBeZero(formValues.vat_terms)) {
      finalVatAmount = 0;
      finalVatPercentage = 0;
    }

    // Handle signature - only send new signature if actually drawn, otherwise send empty
    let signatureToSend = isNewSignatureDrawn ? trimmedDataURL : '';


    // Determine which VAT type to send
    // If branch and voucher VAT types are the same, send branch VAT type
    // If they are different, send voucher VAT type (preserve original)
    const vatTypeToSend = isVatTypeMismatch()
      ? paymentVoucherData?.payment_vouchers?.vat_type  // Different: use voucher's VAT type
      : (vatData?.vatType?.vat_type || paymentVoucherData?.payment_vouchers?.vat_type || ''); // Same: use branch's VAT type

    // Validate and prepare VAT terms ID
    let vatTermsIdPayload = {};

    // Check if the vat_terms_id is valid in current branch's VAT terms
    const isValidInCurrentBranch = vatData?.vatType?.vats?.some(
      vat => vat.id === formValues.vat_terms_id
    );
    // IMPORTANT: If voucher's VAT type is 'variable', vat_terms_id is REQUIRED by backend
    if (vatTypeToSend === 'variable') {
      // For variable VAT type vouchers, vat_terms_id is mandatory
      if (formValues.vat_terms_id && !isNaN(formValues.vat_terms_id) && formValues.vat_terms_id !== '') {
        // Use existing vat_terms_id
        vatTermsIdPayload = { vat_terms_id: formValues.vat_terms_id };
      } else if (isValidInCurrentBranch) {
        // If somehow not set but valid in current branch, use it
        vatTermsIdPayload = { vat_terms_id: formValues.vat_terms_id };
      } else if (vatData?.vatType?.vat_type === 'variable' && vatData?.vatType?.vats && vatData.vatType.vats.length > 0) {
        // If current branch is also variable and has VAT terms, use first one
        vatTermsIdPayload = { vat_terms_id: vatData.vatType.vats[0].id };
      }
    } else if (vatTypeToSend === 'fixed') {
      // For fixed VAT type, vat_terms_id is optional - only include if valid
      if (formValues.vat_terms_id && !isNaN(formValues.vat_terms_id) && formValues.vat_terms_id !== '') {
        vatTermsIdPayload = { vat_terms_id: formValues.vat_terms_id };
      }
    }

    // Create a copy of formValues without vat_terms_id (we'll add it back conditionally)
    const { vat_terms_id: _, ...formValuesWithoutVatTermsId } = formValues;

    let payload = {
      date,
      ...formValuesWithoutVatTermsId,
      signature: signatureToSend,
      ...(addedAttachments || {}),
      ...((formValues.vat_terms?.startsWith?.('A small popup') ||
        formValues.vat_terms?.toLowerCase() === 'out of scope') && {
        out_of_scope_reason: outOfScope,
      }),
      mode: formValues.mode.charAt(0).toUpperCase() + formValues.mode.slice(1),
      vat_amount: finalVatAmount,
      vat_percentage: finalVatPercentage,
      vat_terms:
        formValues.vat_terms ||
        (formValues.vat_percentage !== '' && !isNaN(formValues.vat_percentage)
          ? Number(formValues.vat_percentage)
          : ''),
      vat_type: vatTypeToSend, // Send voucher's VAT type if mismatch, else branch's VAT type
      ...vatTermsIdPayload, // Only include vat_terms_id if it's valid
      ...(addedSpecialCommissionValues
        ? { special_commission: addedSpecialCommissionValues }
        : {}),
    };

    // Include deleted attachments in payload if any
    if (deletedAttachments && deletedAttachments.length > 0) {
      deletedAttachments.forEach((attachmentId, index) => {
        payload[`deleted_attachments[${index}]`] = attachmentId;
      });
    }

    handlePairReleased();
    updatePaymentVoucherMutation.mutate({ searchTerm, payload });
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
  const handleSCClick = () => {
    // Check if required fields are filled
    const requiredFields = [
      'ledger',
      'account_id',
      'amount',
      'currency_id',
      // 'commission_type',
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

  let getBeneficiariesData = [];

  const {
    data: modeBeneficiaries,
    isLoading: isLoadingBeneficiaries,
    isError: isErrorBeneficiaries,
    error: errorBeneficiaries,
  } = useQuery({
    queryKey: ['per_page', 50],
    queryFn: getBeneficiaryRegisterListing,
    staleTime: 1000 * 60 * 5,
  });

  // Defensive check depending on API structure
  if (Array.isArray(modeBeneficiaries)) {
    getBeneficiariesData = modeBeneficiaries.map((ben) => ({
      label: ben.account,
      value: ben.id,
    }));
  } else if (Array.isArray(modeBeneficiaries?.data)) {
    getBeneficiariesData = modeBeneficiaries.data.map((ben) => ({
      label: ben.account,
      value: ben.id,
    }));
  }

  useEffect(() => {
    modeBeneficiaries;
  }, [modeBeneficiaries]);

  const {
    data: modeCheques,
    isLoading: isLoadingCheques,
    isError: isErrorCheques,
    error: errorCheques,
  } = useQuery({
    queryKey: ['bank_id', selectedBank],
    queryFn: () => getChequeNumberByBank(selectedBank),
    staleTime: 1000 * 60 * 5,
    enabled: !!selectedBank,
  });

  const chequeOptions = React.useMemo(() => {
    let options = modeCheques?.map((cheque) => ({
      label: cheque.cheque_number,
      value: cheque.cheque_number,
    })) || [];

    // Include the current voucher's cheque number if it's not in the list
    const currentCheque = paymentVoucherData?.payment_vouchers?.cheque_number;
    if (currentCheque && !options.find(o => o.value === currentCheque)) {
      options.unshift({
        label: currentCheque,
        value: currentCheque
      });
    }
    return options;
  }, [modeCheques, paymentVoucherData?.payment_vouchers?.cheque_number]);

  useEffect(() => {
    modeCheques;
  }, [modeCheques]);

  const getVATTermsOptions = () => {
    if (vatData.isLoadingVatType)
      return [
        {
          label: 'Loading...',
          value: '',
        },
      ];
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

  // Check if VAT types match between branch and existing voucher
  // Check if VAT types match between branch and existing voucher
  const isVatTypeMismatch = () => {
    // If we're loading or don't have data yet, assume match to avoid flashing error
    if (!paymentVoucherData || !vatData) return false;

    const branchVatType = vatData?.vatType?.vat_type;
    const voucherVatType = paymentVoucherData?.payment_vouchers?.vat_type;

    // If either is missing, we can't determine mismatch
    if (!branchVatType || !voucherVatType) return false;

    return branchVatType !== voucherVatType;
  };

  const getVatAmountDisplayValue = (values) => {
    if (values.vat_amount === 0) return 0;
    if (!values.vat_amount) return '';
    return values.vat_amount;
  };

  if (isError) {
    showErrorToast(error);
  }

  const getSCValues = () => {
    // Prepare Special Commission values - exactly like Foreign Currency Deal
    return {
      date: date,
      transaction_no: lastVoucherNumbers?.current,
      account:
        getAccountsByTypeOptions(formikRef?.current?.values.ledger).find(
          (x) => x.value === formikRef?.current?.values.account_id
        ) || '',
      currency:
        currencyOptions.find(
          (x) => x.value === formikRef?.current?.values.currency_id
        ) || '',
      amount: formikRef?.current?.values.amount || 0,
      ...addedSpecialCommissionValues,
      // Do not move the ledger field above the ...addedSpecialCommissionValues
      ledger:
        [
          { label: 'PL', value: 'party' },
          { label: 'GL', value: 'general' },
          { label: 'WIC', value: 'walkin' },
        ].find((x) => x.value === formikRef?.current?.values.ledger) || '',
      commission_type:
        addedSpecialCommissionValues?.commission_type ||
        formikRef?.current?.values.commission_type ||
        'Income', // Default
    };
  };

  useEffect(() => {
    if (paymentVoucherData?.payment_vouchers) {
      setDueDate(paymentVoucherData.payment_vouchers.due_date);
      setVoucherDate(paymentVoucherData.payment_vouchers.due_date);
      // Only set date from paymentVoucherData if NOT returning from rate-of-exchange
      // (parent component already restored the correct date)
      if (!returningFromRateOfExchange.current) {
        setDate(paymentVoucherData.payment_vouchers.date);
      }
    }
  }, [paymentVoucherData]);

  // Bank/PDC mode detection for cheque field and due date
  useEffect(() => {
    if (formikRef.current) {
      const { values, setFieldValue } = formikRef.current;

      if (values.mode === 'bank' || values.mode === 'pdc') {
        setIsChequeFieldEnabled(true);

        if (values.mode === 'bank') {
          // If returning to the original bank mode, restore original due date
          if (values.mode === paymentVoucherData?.payment_vouchers?.mode?.toLowerCase()) {
            setFieldValue('due_date', paymentVoucherData.payment_vouchers.due_date);
            setDueDate(paymentVoucherData.payment_vouchers.due_date);
          } else {
            setFieldValue('due_date', date);
            setDueDate(date);
          }
          setIsDueDateEditable(true);
        } else if (values.mode === 'pdc') {
          // logic for tomorrow if not original
          if (values.mode === paymentVoucherData?.payment_vouchers?.mode?.toLowerCase()) {
            setFieldValue('due_date', paymentVoucherData.payment_vouchers.due_date);
            setDueDate(paymentVoucherData.payment_vouchers.due_date);
          } else {
            const tomorrow = new Date(date);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowDate = tomorrow.toISOString().split('T')[0];
            setFieldValue('due_date', tomorrowDate);
            setDueDate(tomorrowDate);
          }
          setIsDueDateEditable(true);
        }
      } else {
        setIsChequeFieldEnabled(false);
        setFieldValue('due_date', '');
        setDueDate('');
        setIsDueDateEditable(false);
        setFieldValue('cheque_number', '');
      }
    }
  }, [formikRef.current?.values.mode, paymentVoucherData, date]);

  // Add loading check to prevent accessing undefined paymentVoucherData
  if (isLoading || !paymentVoucherData || !paymentVoucherData.payment_vouchers) {
    return (
      <div className="d-card">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading payment voucher data...</p>
          </div>
        </div>
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
            ledger: paymentVoucherData?.payment_vouchers.ledger || '',
            account_id: paymentVoucherData?.payment_vouchers.account_id || '',
            paid_to_id: paymentVoucherData?.payment_vouchers.paid_to_id || '',
            paid_to: paymentVoucherData?.payment_vouchers.paid_to_id || '',
            mode: paymentVoucherData?.payment_vouchers.mode.toLowerCase() || '',
            mode_account_id:
              paymentVoucherData?.payment_vouchers.mode_account_id?.id || '',
            party_bank: paymentVoucherData?.payment_vouchers.party_bank || '',
            cheque_number:
              paymentVoucherData?.payment_vouchers.cheque_number || '',
            due_date: paymentVoucherData?.payment_vouchers.due_date || '',
            narration: paymentVoucherData?.payment_vouchers.narration || '',

            amount: paymentVoucherData?.payment_vouchers.amount || '',
            currency_id: paymentVoucherData?.payment_vouchers.currency_id || '',
            commission_type:
              paymentVoucherData?.payment_vouchers.commission_type || '',
            commission: paymentVoucherData?.payment_vouchers.commission || '',
            commission_percentage:
              paymentVoucherData?.payment_vouchers.commission || '',
            commission_amount:
              paymentVoucherData?.payment_vouchers.commission_amount || '',
            vat_terms: paymentVoucherData?.payment_vouchers.vat_terms || '',
            vat_terms_id:
              paymentVoucherData?.payment_vouchers.vat_terms_id || '', // Add VAT terms ID field
            vat_percentage:
              paymentVoucherData?.payment_vouchers.vat_percentage || '',
            vat_amount: paymentVoucherData?.payment_vouchers.vat_amount || '',
            net_total: paymentVoucherData?.payment_vouchers.net_total || '',
            comment: paymentVoucherData?.payment_vouchers.comment || '',
            signature: paymentVoucherData?.payment_vouchers.signature_url,
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

            // Mode validation
            if (!values.mode) {
              errors.mode = 'Mode is required';
            }
            if (
              values.mode &&
              (!values.mode_account_id ||
                values.mode_account_id === '' ||
                values.mode_account_id === null ||
                values.mode_account_id === undefined)
            ) {
              errors.mode_account_id = 'Account is required';
            }

            // VAT validation: only required if commission is used
            const hasCommission =
              values.commission || addedSpecialCommissionValues;
            if (hasCommission) {
              if (vatData?.vatType?.vat_type === 'variable') {
                if (!values.vat_terms_id) {
                  errors.vat_terms = 'VAT % is required';
                }
              }
            }

            // Due Date validation
            if (
              (values.mode === 'bank' || values.mode === 'pdc') &&
              !values.due_date
            ) {
              errors.due_date = 'Due Date is required for Bank or PDC mode';
            }

            // Special Commission / Commission validation
            if (values.commission && !values.commission_type && !addedSpecialCommissionValues) {
              errors.commission_type = 'Please select Commission Type';
            }
            if (values.commission !== '' && isNaN(values.commission)) {
              errors.commission = 'Amount must be a number';
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
          }) => {
            // Determine if form should be disabled based on mode
            // Fields that should remain editable even when mode is online
            const editableFieldsInOnlineMode = ['narration', 'comment'];
            
            // Helper function to determine if a field should be disabled
            const shouldFieldBeDisabled = (fieldName) => {
              if (values.mode === 'online') {
                return !editableFieldsInOnlineMode.includes(fieldName);
              }
              return isDisabled;
            };
            // Prepare Account select options and selected option
            const accountOptions = getAccountsByTypeOptions(values.ledger);
            const selectedAccountOption = React.useMemo(() => {
              if (!values.account_id) return null;
              const match = accountOptions?.find?.(
                (o) => o.value === values.account_id
              );
              if (match) return match;
              const ad = paymentVoucherData?.payment_vouchers?.account_details;
              if (ad?.id === values.account_id)
                return { value: ad.id, label: ad.title };
              return null;
            }, [values.account_id, accountOptions, paymentVoucherData]);

            // --- VAT Calculation useEffect for Special Commission ---
            React.useEffect(() => {
              let commissionAmount =
                addedSpecialCommissionValues?.total_commission ??
                values.commission_amount;

              let vatPercentage =
                vatData.vatType?.vat_percentage ||
                (!isNaN(values.vat_percentage) ? values.vat_percentage : 0);

              // Check if VAT amount should be 0 based on VAT terms
              let vatAmount = '';
              if (shouldVatAmountBeZero(values.vat_terms)) {
                vatAmount = 0;
              } else if (commissionAmount && vatPercentage) {
                vatAmount = (commissionAmount * vatPercentage) / 100;
              } else if (values.amount && vatPercentage && !addedSpecialCommissionValues) {
                // For Standard Rate, calculate VAT on the main amount when no special commission
                vatAmount = (values.amount * vatPercentage) / 100;
              }

              setFieldValue('vat_amount', vatAmount);
            }, [
              addedSpecialCommissionValues?.total_commission,
              values.commission_amount,
              values.amount,
              values.vat_percentage,
              values.vat_terms,
              vatData.vatType?.vat_percentage,
              setFieldValue,
            ]);
            // Ensure vat_terms_id is synced for fixed VAT type
            React.useEffect(() => {
              if (
                vatData?.vatType?.vat_type === 'fixed' &&
                vatData?.vatType?.vats &&
                vatData.vatType.vats.length > 0
              ) {
                // Check if current vat_terms_id is valid in the current branch's VAT terms
                const isValidVatTermId = vatData.vatType.vats.some(
                  vat => vat.id === values.vat_terms_id
                );

                // If not valid or not set, use the first available VAT term ID
                if (!values.vat_terms_id || !isValidVatTermId) {
                  setFieldValue('vat_terms_id', vatData.vatType.vats[0].id);
                  setFieldValue('vat_percentage', vatData.vatType.vats[0].percentage || vatData.vatType.vat_percentage);
                  setFieldValue('vat_terms', vatData.vatType.vats[0].title);
                }
              }
            }, [
              vatData?.vatType?.vat_type,
              vatData?.vatType?.vats,
              setFieldValue,
            ]);

            // Handle VAT percentage changes for fixed VAT type when editable
            React.useEffect(() => {
              if (
                vatData?.vatType?.vat_type === 'fixed' &&
                !isVatTypeMismatch() &&
                values.vat_percentage &&
                !isNaN(values.vat_percentage)
              ) {
                // Recalculate VAT amount when VAT percentage changes for fixed type
                let commissionAmount =
                  addedSpecialCommissionValues?.total_commission ??
                  values.commission_amount;

                let vatAmount = '';
                if (shouldVatAmountBeZero(values.vat_terms)) {
                  vatAmount = 0;
                } else if (commissionAmount && values.vat_percentage) {
                  vatAmount = (commissionAmount * values.vat_percentage) / 100;
                } else if (values.amount && values.vat_percentage && !addedSpecialCommissionValues) {
                  // For Standard Rate, calculate VAT on the main amount when no special commission
                  vatAmount = (values.amount * values.vat_percentage) / 100;
                }

                setFieldValue('vat_amount', vatAmount);
              }
            }, [
              values.vat_percentage,
              values.amount,
              values.commission_amount,
              addedSpecialCommissionValues?.total_commission,
              values.vat_terms,
              setFieldValue,
            ]);
            // --- End VAT Calculation useEffect ---
            return (
              <Form>
                <div className="row">
                  <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
                    <div className="row mb-4">
                      {/* Ledger Field */}
                      <div className="col-12 col-sm-6 mb-45">
                        <CombinedInputs
                          label="Ledger"
                          type1="select"
                          type2="select"
                          name1="ledger"
                          name2="account_id"
                          value1={values.ledger}
                          value2={selectedAccountOption ?? values.account_id}
                          options1={[
                            { label: 'PL', value: 'party' },
                            { label: 'GL', value: 'general' },
                            { label: 'WIC', value: 'walkin' },
                          ]}
                          options2={accountOptions}
                          isDisabled={shouldFieldBeDisabled('ledger')}
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
                              setSelectedLedgerAccount(null);
                              setFieldValue('account_id', '');
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
                      <div className="col-12 col-sm-6 mb-30">
                        <SearchableSelect
                          name={'paid_to'}
                          label={'Paid To'}
                          options={getBeneficiaryOptions(values.account_id)}
                          isDisabled={shouldFieldBeDisabled('paid_to')}
                          placeholder={'Select Paid To'}
                          value={values.paid_to}
                          // value={values.paid_to || newlyCreatedBeneficiary?.id}
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
                              setFieldValue('paid_to', selected.value);
                              setFieldValue('paid_to_id', selected.value);
                            }
                          }}
                          onBlur={handleBlur}
                        />
                      </div>
                      {/* Mode Field */}
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
                            { label: 'Cash', value: 'cash' },
                            { label: 'Bank', value: 'bank' },
                            { label: 'PDC', value: 'pdc' },
                            { label: 'Online', value: 'online' },
                          ]}
                          options2={getAccountsByTypeMode(values.mode)}
                          isDisabled={shouldFieldBeDisabled('mode')}
                          handleBlur={handleBlur}
                          placeholder1="Mode"
                          placeholder2="Select Account"
                          className1="mode"
                          className2="mode-account"
                          onChange1={(selected) => {
                            setFieldValue('mode', selected.value);
                            setFieldValue('mode_account_id', '');
                            setSelectedBank(null);
                          }}
                          onChange2={(selected) => {
                            setFieldValue('mode_account_id', selected.value);
                            setSelectedBank(selected.value);
                            setSelectedModeAccount({
                              value: selected.value,
                              label: selected.label,
                              accountType: values.mode,
                            });
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
                      {/* Cheque Number Field - ONLY SHOWS FOR BANK/PDC */}
                      {(values.mode === 'bank' || values.mode === 'pdc') && (
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
                                : 'Select Cheque Number'
                            }
                            value={values.cheque_number}
                            onChange={(selected) => {
                              setFieldValue('cheque_number', selected.value);
                            }}
                            onBlur={handleBlur}
                          />
                        </div>
                      )}
                      {(values.mode === 'bank' || values.mode === 'pdc') && (
                        <div className="col-12 col-sm-6 mb-3">
                          <CustomInput
                            name={'due_date'}
                            label={'Due Date'}
                            type={'date'}
                            value={dueDate}
                            onChange={(e) => {
                              handleChange(e);
                              setDueDate(e.target.value);
                              setVoucherDate(e.target.value)
                            }}
                            onBlur={handleBlur}
                            error={touched.due_date && errors.due_date}
                            disabled={shouldFieldBeDisabled('due_date')}
                          />
                        </div>
                      )}
                      <div className="col-12 mb-3">
                        <CustomInput
                          name={'narration'}
                          label={'Narration'}
                          type={'textarea'}
                          placeholder={'Enter Narration'}
                          value={values.narration}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.narration && errors.narration}
                        />
                      </div>
                      {/* Currency and Amount Field */}
                      <div className="col-12 col-sm-6 mb-45">
                        <CombinedInputs
                          label="Currency"
                          type1="select"
                          type2="input"
                          name1="currency_id"
                          name2="amount"
                          value1={values.currency_id}
                          value2={values.amount}
                          options1={currencyOptions}
                          isDisabled={shouldFieldBeDisabled('currency')}
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
                          }}
                          onChange2={(e) => {
                            handleChange(e);
                            let commission = parseFloat(values.commission || 0);
                            let amount = parseFloat(e.target.value || 0);
                            const hasCommissionValue = values.commission || addedSpecialCommissionValues;

                            // Recalculate Special Commission if it exists and amount changed
                            if (
                              addedSpecialCommissionValues &&
                              addedSpecialCommissionValues.commission
                            ) {
                              const commissionPercentage = parseFloat(
                                addedSpecialCommissionValues.commission
                              ) || 0;
                              const newTotalCommission =
                                (commissionPercentage / 100) * amount;

                              // Get current currency object or find it from currencyOptions
                              const currentCurrency =
                                addedSpecialCommissionValues.currency ||
                                currencyOptions.find(
                                  (c) => c.value === values.currency_id
                                );

                              // Recalculate distribution amounts based on percentages
                              let updatedDistributions = [];
                              if (
                                addedSpecialCommissionValues.distributions &&
                                Array.isArray(
                                  addedSpecialCommissionValues.distributions
                                )
                              ) {
                                updatedDistributions =
                                  addedSpecialCommissionValues.distributions.map(
                                    (dist) => {
                                      const percentage =
                                        parseFloat(dist.percentage) || 0;
                                      const newAmount =
                                        (percentage * newTotalCommission) /
                                        100;
                                      return {
                                        ...dist,
                                        amount:
                                          Math.round(newAmount * 100) / 100, // Round to 2 decimal places
                                      };
                                    }
                                  );
                              }

                              // Update Special Commission values with new amount and recalculated commission
                              setAddedSpecialCommissionValues((prev) => ({
                                ...prev,
                                amount,
                                total_commission: newTotalCommission,
                                currency_id: values.currency_id,
                                currency: currentCurrency || prev.currency,
                                distributions:
                                  updatedDistributions.length > 0
                                    ? updatedDistributions
                                    : prev.distributions,
                              }));
                            }

                            // Calculate VAT on commission amount - only if commission is applied
                            let vatPercentage = 0;
                            let vatAmount = 0;
                            if (hasCommissionValue) {
                              vatPercentage =
                                vatData.vatType?.vat_percentage ||
                                (!isNaN(values.vat_percentage)
                                  ? values.vat_percentage
                                  : 0);
                              if (
                                !shouldVatAmountBeZero(values.vat_terms) &&
                                amount &&
                                vatPercentage
                              ) {
                                // Determine commission amount (normal commission or special commission)
                                let commissionAmount = 0;
                                if (commission) {
                                  // Normal commission: calculate from percentage
                                  commissionAmount =
                                    (commission / 100) * amount;
                                } else if (
                                  addedSpecialCommissionValues?.total_commission
                                ) {
                                  // Special commission: use the recalculated total commission amount
                                  commissionAmount =
                                    addedSpecialCommissionValues.total_commission;
                                }

                                // Calculate VAT on commission amount
                                if (commissionAmount > 0) {
                                  vatAmount =
                                    (commissionAmount * vatPercentage) / 100;
                                }
                              }
                            }

                            // Calculate commission on base amount only (not VAT-inclusive)
                            let commissionAmount = 0;
                            let finalCommissionAmount = 0;

                            if (commission) {
                              // Normal commission: calculate from percentage
                              commissionAmount =
                                (commission / 100) * amount;
                              finalCommissionAmount = commissionAmount;
                            } else if (
                              addedSpecialCommissionValues?.total_commission
                            ) {
                              // Special commission: use the recalculated total commission amount
                              commissionAmount =
                                addedSpecialCommissionValues.total_commission;
                              finalCommissionAmount = commissionAmount;
                            }

                            let value =
                              Math.round(
                                (amount -
                                  vatAmount -
                                  finalCommissionAmount -
                                  Number.EPSILON) *
                                1000000
                              ) / 1000000;

                            // Only set VAT amount if commission is present
                            if (hasCommissionValue) {
                              setFieldValue('vat_amount', vatAmount);
                            } else {
                              setFieldValue('vat_amount', ''); // This will show empty when no commission
                            }
                            setFieldValue('net_total', value);
                            // Commission Amount field shows only Commission Amount (not VAT + Commission)
                            setFieldValue('commission_amount', commissionAmount);
                            setSpecialCommissionValues((prev) => ({
                              ...prev,
                              amount,
                            }));
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
                            ...(values.commission_type
                              ? [
                                {
                                  label: 'Add New Remove Commission Type',
                                  value: '',
                                  displayLabel: 'Remove Commission Type',
                                },
                              ]
                              : []),
                          ]}
                          isDisabled={shouldFieldBeDisabled('commission_type')}
                          placeholder={'Select Commission Type'}
                          value={values.commission_type}
                          onChange={(selected) => {
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
                            } else {
                              const newValue = selected?.value || '';
                              setFieldValue('commission_type', newValue);
                            }
                          }}
                          onBlur={handleBlur}
                          formatOptionLabel={(option) => {
                            return option.displayLabel || option.label;
                          }}
                        />
                        <ErrorMessage
                          name="commission_type"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>
                      {/* Commission Fields */}
                      <div className="col-12 col-sm-6 mb-3">
                        <CombinedInputs
                          label="Commission"
                          type1="input"
                          type2="input"
                          name1="commission"
                          name2="commission_amount"
                          value1={
                            addedSpecialCommissionValues?.total_commission
                              ? ''
                              : values.commission
                          }
                          value2={
                            addedSpecialCommissionValues?.total_commission
                              ? ''
                              : values.commission_amount
                          }
                          isDisabled={
                            shouldFieldBeDisabled('commission') ||
                            addedSpecialCommissionValues?.total_commission
                          }
                          handleBlur={handleBlur}
                          placeholder1="Enter %"
                          placeholder2="Commission Amount"
                          inputType1="number"
                          inputType2="number"
                          className1="commission"
                          className2="commission-amount"
                          inputProps1={{
                            min: 0,
                            max: 100
                          }}
                          onChange1={(v) => {
                            if (v.target.value < 0) return;

                            let inputValue = v.target.value;
                            // Check if cleared
                            if (inputValue === '' || inputValue === null) {
                              setFieldValue('commission', '');
                              setFieldValue('commission_amount', '');
                              setFieldValue('vat_amount', '');
                              let amount = parseFloat(values.amount || 0);
                              setFieldValue('net_total', amount);
                              return;
                            }

                            let inputCommission = parseFloat(inputValue || 0);
                            let amount = parseFloat(values.amount || 0);
                            const hasCommissionValue =
                              inputCommission > 0 || addedSpecialCommissionValues;

                            // Cap commission percentage at 100%
                            let commission = inputCommission;
                            if (commission > 100) {
                              commission = 100;
                            }

                            // Calculate commission amount from percentage
                            let commissionAmount = 0;
                            if (commission && amount) {
                              commissionAmount = (commission / 100) * amount;
                              // Round to avoid floating-point precision issues
                              commissionAmount =
                                Math.round(commissionAmount * 100000000) /
                                100000000;
                              // Ensure commission amount doesn't exceed base amount
                              if (commissionAmount > amount) {
                                commissionAmount = amount;
                                commission = 100;
                              }
                            }

                            // Only set commission_amount if not using special commission
                            if (
                              !addedSpecialCommissionValues?.total_commission
                            ) {
                              setFieldValue(
                                'commission_amount',
                                commissionAmount
                              );
                            } else {
                              setFieldValue('commission_amount', '');
                            }

                            setFieldValue('commission', commission);

                            // Calculate VAT on commission amount
                            let vatPercentage = 0;
                            let vatAmount = 0;
                            if (hasCommissionValue) {
                              vatPercentage =
                                vatData.vatType?.vat_percentage ||
                                (!isNaN(values.vat_percentage)
                                  ? values.vat_percentage
                                  : 0);
                              if (
                                !shouldVatAmountBeZero(values.vat_terms) &&
                                commissionAmount > 0 &&
                                vatPercentage
                              ) {
                                vatAmount =
                                  (commissionAmount * vatPercentage) / 100;
                              }
                            }

                            // Only set VAT amount if commission is present
                            if (hasCommissionValue) {
                              if (shouldVatAmountBeZero(values.vat_terms)) {
                                setFieldValue('vat_amount', 0);
                              } else {
                                setFieldValue('vat_amount', vatAmount);
                              }
                            } else {
                              setFieldValue('vat_amount', '');
                            }

                            // Calculate Net Total
                            let netTotal =
                              amount - vatAmount - commissionAmount;
                            setFieldValue(
                              'net_total',
                              Math.round(
                                (netTotal - Number.EPSILON) * 1000000
                              ) / 1000000
                            );
                          }}
                          onChange2={(e) => {
                            let inputValue = e.target.value;
                            // Remove commas and parse the value
                            const cleanedValue = inputValue.replace(/,/g, '');
                            let commissionAmount = parseFloat(
                              cleanedValue || 0
                            );
                            let amount = parseFloat(values.amount || 0);
                            const hasCommissionValue =
                              commissionAmount > 0 || addedSpecialCommissionValues;

                            // Validate commission amount
                            if (isNaN(commissionAmount) || commissionAmount < 0) {
                              commissionAmount = 0;
                            }
                            if (commissionAmount > amount && amount > 0) {
                              commissionAmount = amount;
                            }

                            // Calculate commission percentage from amount
                            let commission =
                              amount !== 0
                                ? (commissionAmount / amount) * 100
                                : 0;
                            commission =
                              Math.round(commission * 100000000) / 100000000;

                            // Recalculate commission amount for consistency
                            let recalculatedCommissionAmount =
                              amount !== 0 ? (commission / 100) * amount : 0;
                            recalculatedCommissionAmount =
                              Math.round(recalculatedCommissionAmount * 100000000) /
                              100000000;

                            const finalCommissionAmount =
                              recalculatedCommissionAmount;

                            setFieldValue(
                              'commission_amount',
                              finalCommissionAmount
                            );
                            setFieldValue('commission', commission);

                            // Calculate VAT on commission amount
                            let vatPercentage = 0;
                            let vatAmount = 0;
                            if (hasCommissionValue) {
                              vatPercentage =
                                vatData.vatType?.vat_percentage ||
                                (!isNaN(values.vat_percentage)
                                  ? values.vat_percentage
                                  : 0);
                              if (
                                !shouldVatAmountBeZero(values.vat_terms) &&
                                commissionAmount > 0 &&
                                vatPercentage
                              ) {
                                vatAmount =
                                  (commissionAmount * vatPercentage) / 100;
                              }
                            }

                            // Only set VAT amount if commission is present
                            if (hasCommissionValue) {
                              if (shouldVatAmountBeZero(values.vat_terms)) {
                                setFieldValue('vat_amount', 0);
                              } else {
                                setFieldValue('vat_amount', vatAmount);
                              }
                            } else {
                              setFieldValue('vat_amount', '');
                            }

                            // Calculate Net Total
                            let netTotal = amount - vatAmount - commissionAmount;
                            setFieldValue(
                              'net_total',
                              Math.round(
                                (netTotal - Number.EPSILON) * 1000000
                              ) / 1000000
                            );
                          }}
                        />
                        <ErrorMessage
                          name="commission"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>

                      {(vatData?.vatType?.vat_type === 'variable' || (isVatTypeMismatch() && paymentVoucherData?.payment_vouchers?.vat_type === 'variable')) && (
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
                              const currentOptions = getVATTermsOptions();
                              const selectedOption = currentOptions.find(opt => opt.value === values.vat_terms_id);

                              // If the selected option exists in current options, return current options
                              if (selectedOption) {
                                return currentOptions;
                              }

                              // If selected option doesn't exist, add it to the options
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
                            isDisabled={
                              shouldFieldBeDisabled('vat_terms') ||
                              isVatTypeMismatch() ||
                              !(
                                values.commission_type ||
                                addedSpecialCommissionValues?.commission_type
                              ) ||
                              !(
                                values.commission ||
                                addedSpecialCommissionValues?.total_commission
                              )
                            }
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
                        </div>
                      )}
                      {(vatData?.vatType?.vat_type === 'fixed' || (isVatTypeMismatch() && paymentVoucherData?.payment_vouchers?.vat_type === 'fixed')) && (
                        <div className="col-12 col-sm-6 mb-3">
                          <CustomInput
                            name={'vat_percentage'}
                            label={'VAT %'}
                            type={'text'}
                            disabled={true}
                            placeholder={'Enter VAT %'}
                            value={vatData?.vatType?.vat_type === 'fixed' && paymentVoucherData?.payment_vouchers?.vat_type === 'fixed'
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
                          placeholder={'Enter VAT Amount'}
                          value={getVatAmountDisplayValue(values)}
                          onBlur={handleBlur}
                        />
                      </div>
                      <div className="col-12 col-sm-6 mb-45">
                        <CustomInput
                          name={'net_total'}
                          label={'Net Paid'}
                          type={'number'}
                          disabled={true}
                          placeholder={'Enter Net Paid'}
                          value={values.net_total}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>

                      <div className="col-12 mb-3">
                        <CustomInput
                          name={'comment'}
                          label={'Comment'}
                          type={'textarea'}
                          placeholder={'Enter Comment'}
                          value={values.comment}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.comment && errors.comment}
                        />
                      </div>
                      {/* Signature Field */}
                      <div className="col-12 mb-3">
                        <div>
                          <label>Signature</label>
                          <SignatureCanvas
                            ref={sigCanvas}
                            penColor="green"
                            canvasProps={{
                              height: 200,
                              className: 'sigCanvas',
                            }}
                          />
                          <div className="my-3">
                            <span style={{ color: 'red' }}>
                              {errorSignature && !values.signature && 'Signature is Required'}
                            </span>
                          </div>
                        </div>
                        <div className="d-flex gap-2 mt-3">
                          <CustomButton
                            text={'Clear'}
                            type={'submit'}
                            disabled={shouldFieldBeDisabled('signature_clear')}
                            onClick={clear}
                          />
                          <CustomButton
                            text={'Trim'}
                            type={'submit'}
                            disabled={shouldFieldBeDisabled('signature_trim')}
                            onClick={trim}
                          />
                        </div>
                        {trimmedDataURL ? (
                          <div className="mt-3">
                            <img alt="signature" src={trimmedDataURL} />
                          </div>
                        ) : null}

                        {values.signature && !trimmedDataURL && (
                          <div className="mt-5">
                            <img
                              src={values.signature}
                              alt="Signature"
                              style={{ maxWidth: '100%', height: 'auto' }}
                            />
                          </div>
                        )}

                      </div>
                      {/* Attachments Section */}
                      <div className="col-12 mb-3">
                        <FileDisplayList
                          files={addedAttachments}
                          onRemoveFile={handleRemoveAttachedFile}
                        />
                      </div>
                    </div>
                    <div className="d-flex mb-3">
                      <CustomButton
                        type={'button'}
                        onClick={handleSCClick}
                        text={`${!!addedSpecialCommissionValues ? 'Edit' : 'Add'
                          } Special Commission`}
                        disabled={
                          shouldFieldBeDisabled('special_commission_button') ||
                          !!values.commission ||
                          !!values.commission_type
                        }
                      />
                    </div>

                    {/* Display Special Commission Text */}
                    {!!addedSpecialCommissionValues ? (
                      <p
                        className={`fs-5 ${addedSpecialCommissionValues.commission_type?.toLowerCase() ===
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
                            (x) => x.value == values.currency_id
                          )?.label
                        }{' '}
                        {formatNumberTwoDecimals(addedSpecialCommissionValues?.total_commission)} on{' '}
                        {
                          currencyOptions.find(
                            (x) => x.value == values.currency_id
                          )?.label
                        }{' '}
                        {formatNumberTwoDecimals(values.amount)}
                      </p>
                    ) : null}
                  </div>
                  <div className="col-12 col-xxl-2" />
                  {!isDisabled && (
                    <div className="col-12 col-lg-10 col-xl-9 col-xxl-3">
                      <div className="row">
                        {/* Right side cards */}
                        <div
                          className="col-12 mb-5"
                          style={{ maxWidth: '350px' }}
                        >
                          {getAccountBalanceSettings('payment_voucher') && (
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
                                  accountName={selectedModeAccount?.label}
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

                  <div className="d-flex flex-wrap justify-content-start mb-5">
                    <div className="d-inline-block mt-3">
                      <CustomCheckbox
                        label="Account Balance"
                        checked={getAccountBalanceSettings('payment_voucher')}
                        disabled={shouldFieldBeDisabled('account_balance')}
                        style={{ border: 'none', margin: 0 }}
                        onChange={(e) =>
                          updateAccountBalanceSetting(
                            'payment_voucher',
                            e.target.checked
                          )
                        }
                      />
                      {hasPrintPermission && (
                        <CustomCheckbox
                          label="Print"
                          checked={getPrintSettings('payment_voucher')}
                          onChange={(e) => {
                            updatePrintSetting(
                              'payment_voucher',
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
        loading={updatePaymentVoucherMutation.isPending}
        onAttachmentClick={() => setShowAttachmentsModal(true)}
        lastVoucherNumbers={lastVoucherNumbers}
        setPageState={setPageState}
        setSearchTerm={setSearchTerm}
        setWriteTerm={setWriteTerm}
      />

      <CustomModal
        show={showAttachmentsModal}
        close={() => setShowAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          showModal={showAttachmentsModal}
          closeModal={() => setShowAttachmentsModal(false)}
          item={paymentVoucherData}
          deleteService={deletePaymentVoucherAttachment}
          uploadService={addPaymentVoucherAttachment}
          getUploadedFiles={handleVoucherAttachmentsUpload}
          closeUploader={() => setShowAttachmentsModal(false)}
          voucherAttachment={true}
          queryToInvalidate={['paymentVoucher', searchTerm]}
          deferredMode={true}
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
            initialValues={{ out_of_scope: outOfScope }}
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

      {/* Special Commission Modal */}
      <CustomModal
        show={showSCModal}
        close={() => setShowSCModal(false)}
        size="xl"
        closeOnOutsideClick={false}
      >
        <SpecialCommission
          preFilledValues={getSCValues()}
          sCValues={addedSpecialCommissionValues}
          isEdit={true}
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

export default EditPaymentVoucher;
