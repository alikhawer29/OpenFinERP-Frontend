import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import React, { useEffect, useRef, useState } from 'react';
import { FaXmark } from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';
import AccountBalanceCard from '../../../Components/AccountBalanceCard/AccountBalanceCard';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CombinedInputs from '../../../Components/CombinedInputs/CombinedInputs';
import CustomButton from '../../../Components/CustomButton';
import CustomCheckbox from '../../../Components/CustomCheckbox/CustomCheckbox';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import ExchangeRatesCard from '../../../Components/ExchangeRatesCard/ExchangeRatesCard';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import SpecialCommission from '../SpecialCommission/SpecialCommission';
import useAccountsByType from '../../../Hooks/useAccountsByType';
import {
  createAccountToAccount,
  getAccountBalance,
  getBanks,
  getChequeNumbersByBank,
  getCurrencyRate,
} from '../../../Services/Transaction/AccountToAccount';
import { getExchangeRates, pairReleased } from '../../../Services/General';
import useFormStore from '../../../Stores/FormStore';
import useSettingsStore from '../../../Stores/SettingsStore';
import { ledgerOptions } from '../../../Utils/Constants/SelectOptions';
import { formatFileSize, getIcon, showErrorToast } from '../../../Utils/Utils';
import { accountToAccountvalidationSchema } from '../../../Utils/Validations/ValidationSchemas';
import Styles from '../Attachments.module.css';
import withModal from '../../../HOC/withModal';
import { formatNumberWithCommas } from '../../../Utils/Helpers';

const NewAccountToAccount = ({
  showModal,
  state,
  date,
  setDate,
  isDisabled,
  setIsDisabled,
  currencyOptions,
  setShowAddLedgerModal,
  uploadAttachmentsModal,
  setUploadAttachmentsModal,
  setPageState,
  lastVoucherNumbers,
  setSearchTerm,
  newlyCreatedAccount,
  hasPrintPermission,
}) => {
  const formikRef = useRef();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Form store for form persistence
  const {
    saveFormValues,
    getFormValues,
    hasFormValues,
    setLastVisitedPage,
    getLastVisitedPage,
    clearLastVisitedPage,
    clearFormValues,
  } = useFormStore();
  const formId = 'account_to_account';

  // Attachments state (following Journal Voucher pattern - starts as array, becomes object)
  const [addedAttachments, setAddedAttachments] = useState([]);
  // Cheque numbers and bank logic
  const [selectedBank, setSelectedBank] = useState('');
  const [chequeOptions, setChequeOptions] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [showChequeNumber, setShowChequeNumber] = useState(false);
  // Account selection
  const [selectedDebitAccount, setSelectedDebitAccount] = useState(null);
  const [selectedCreditAccount, setSelectedCreditAccount] = useState(null);
  const [newAccountTriggeredFrom, setNewAccountTriggeredFrom] = useState('');

  // Special Commission state (mirroring Receipt Voucher logic)
  const [addedSpecialCommissionValues, setAddedSpecialCommissionValues] =
    useState(null);
  const [showSCModal, setShowSCModal] = useState(false);

  // Missing Currency Rate Modal state (following Journal Voucher pattern)
  const [showMissingCurrencyRateModal, setShowMissingCurrencyRateModal] =
    useState(false);
  const [currencyToSelect, setCurrencyToSelect] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [restoreValuesFromStore, setRestoreValuesFromStore] = useState(false);
  const [exchangeRatesInverse, setExchangeRatesInverse] = useState(false);

  // Add a flag to prevent date reset when returning from Rate of Exchange page
  const [isReturningFromRateExchange, setIsReturningFromRateExchange] = useState(false);
  const [shouldCheckFormValues, setShouldCheckFormValues] = useState(true);

  const isRestoringRef = useRef(false);

  // Print settings
  const {
    getPrintSettings,
    updatePrintSetting,
    getAccountBalanceSettings,
    updateAccountBalanceSetting,
  } = useSettingsStore();

  // Get account options using custom hook
  const { getAccountsByTypeOptions } = useAccountsByType({
    includeBeneficiary: false,
    staleTime: 1000 * 60 * 5,
  });

  // Handle navigation from Rate of Exchange page (following Journal Voucher pattern)
  useEffect(() => {
    const lastPage = getLastVisitedPage(formId);
    if (lastPage === 'rate-of-exchange') {
      const savedFormData = getFormValues('account-to-account');
      if (savedFormData) {
        // Set flag to prevent date reset
        setIsReturningFromRateExchange(true);
        // Restore the date from saved form data
        if (savedFormData.date) {
          setDate(savedFormData.date);
        }
        // Set page state to new and enable the form
        setPageState('new');
        setIsDisabled(false);
        setRestoreValuesFromStore(true);
      }
    }
  }, []);

  // Handle currency clearing when returning from Rate page via Back button without entering rate
  useEffect(() => {
    if (!shouldCheckFormValues) return;

    // Check if we have form data that indicates navigation to Rate page
    const hasRateNavigationData = hasFormValues('account-to-account');
    if (hasRateNavigationData && !restoreValuesFromStore && !isReturningFromRateExchange) {
      const formData = getFormValues('account-to-account');
      // If we have saved form data but we're not in the process of restoring from Rate page,
      // it means user returned via Back button
      if (formData && formikRef.current && formData.currency) {
        // Set the currency to check if rate exists
        setSelectedCurrency(formData.currency);
        // Also update Formik value to ensure the field shows the selected currency
        formikRef.current.setFieldValue('currency', formData.currency);

        // Restore Special Commission if it was saved
        if (formData.addedSpecialCommissionValues) {
          setAddedSpecialCommissionValues(formData.addedSpecialCommissionValues);
        }
        // The existing currencyRate query will check for the rate
        // If no rate exists, the currency rate response will be empty
      }
      // Don't clear form data immediately - let the rate check complete first
    }
    setShouldCheckFormValues(false);
  }, [shouldCheckFormValues, restoreValuesFromStore, isReturningFromRateExchange]);

  // Load saved form if returning from special Commission and FormStore has values
  useEffect(() => {
    const lastPage = getLastVisitedPage(formId);
    if (
      lastPage === 'special-commission' &&
      hasFormValues(formId) &&
      formikRef.current
    ) {
      const savedValues = getFormValues(formId);

      // Set ref immediately to prevent calculations during restoration
      isRestoringRef.current = true;

      // Restore form values and allocations

      formikRef.current.setValues(savedValues);
      setSelectedDebitAccount(savedValues?.account_id);
      setIsDisabled(false);

      // Reset the flags after a short delay to allow form to settle
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 200);

      // Clear the calling page data after restoration
      clearLastVisitedPage(formId);
      clearFormValues(formId);

      // Check if we have Special Commission data to restore
      if (hasFormValues('special-commission')) {
        setAddedSpecialCommissionValues(getFormValues('special-commission'));
      }
    }
  }, []);

  // Handle Special Commission data when returning from SC page
  useEffect(() => {
    if (state?.specialCommissionData) {
      setAddedSpecialCommissionValues(state.specialCommissionData);
    }

    if (state?.specialCommissionDeleted) {
      setAddedSpecialCommissionValues(null);
    }
  }, [state]);

  // Restore form data if returning from Rate of Exchange page (following Journal Voucher pattern)
  useEffect(() => {
    if (restoreValuesFromStore) {
      const savedFormData = getFormValues('account-to-account');
      if (savedFormData && formikRef.current) {
        formikRef.current.setValues(savedFormData);
        setAddedAttachments(savedFormData.addedAttachments || []);
        // Restore currency selection
        if (savedFormData.currency) {
          setSelectedCurrency(savedFormData.currency);
        }
        // Restore Special Commission if it was saved
        if (savedFormData.addedSpecialCommissionValues) {
          setAddedSpecialCommissionValues(savedFormData.addedSpecialCommissionValues);
        }
        // Clear the saved data after restoration
        clearFormValues('account-to-account');
        clearLastVisitedPage(formId);
        setRestoreValuesFromStore(false);
        // Reset the flag after restoration
        setTimeout(() => {
          setIsReturningFromRateExchange(false);
        }, 100);
      }
    }
  }, [restoreValuesFromStore]);

  // Fetch bank accounts to determine which accounts are banks
  const { data: bankAccountsData } = useQuery({
    queryKey: ['bankAccounts'],
    queryFn: () => getBanks('bank'),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // Update bank accounts list when data is fetched
  useEffect(() => {
    if (bankAccountsData) {
      setBankAccounts(bankAccountsData);
    }
  }, [bankAccountsData]);

  // Helper function to check if an account is a bank account
  const isBankAccount = (accountId) => {
    return bankAccounts.some((bank) => bank.id === accountId);
  };

  // Logic to show/hide cheque number field and set selected bank
  useEffect(() => {
    let shouldShowCheque = false;
    let bankId = null;

    // Check if debit account is a bank
    if (
      selectedDebitAccount?.value &&
      isBankAccount(selectedDebitAccount.value)
    ) {
      shouldShowCheque = true;
      bankId = selectedDebitAccount.value;
    }
    // Check if credit account is a bank
    else if (
      selectedCreditAccount?.value &&
      isBankAccount(selectedCreditAccount.value)
    ) {
      shouldShowCheque = true;
      bankId = selectedCreditAccount.value;
    }

    setShowChequeNumber(shouldShowCheque);

    if (bankId && bankId !== selectedBank) {
      setSelectedBank(bankId);
    } else if (!shouldShowCheque) {
      setSelectedBank('');
      setChequeOptions([]);
    }
  }, [selectedDebitAccount, selectedCreditAccount, bankAccounts]);

  // Fetch cheque numbers when a bank is selected
  const {
    data: chequeNumbersData,
    isLoading: isLoadingChequeNumbers,
    isError: isChequeError,
    error: chequeError,
  } = useQuery({
    queryKey: ['chequeNumbers', selectedBank],
    queryFn: () => getChequeNumbersByBank(selectedBank),
    enabled: !!selectedBank && showChequeNumber,
    retry: false, // Don't retry on error
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Update cheque options when cheque numbers data changes
  useEffect(() => {
    if (showChequeNumber) {
      if (isLoadingChequeNumbers) {
        // 1. While loading
        setChequeOptions([
          { label: 'Loading...', value: null, isDisabled: true },
        ]);
      } else if (isChequeError && chequeError?.message) {
        // 2. If there's an error with a message, show it
        setChequeOptions([
          { label: chequeError.message, value: null, isDisabled: true },
        ]);
      } else if (isChequeError) {
        // 3. If there's an error without message, just clear options
        setChequeOptions([]);
      } else if (chequeNumbersData) {
        // 4. Check if API returned error response with message
        if (chequeNumbersData.status === false && chequeNumbersData.message) {
          setChequeOptions([
            { label: chequeNumbersData.message, value: null, isDisabled: true },
          ]);
        }
        // 5. If we have cheque numbers array with data
        else if (
          Array.isArray(chequeNumbersData) &&
          chequeNumbersData.length > 0
        ) {
          setChequeOptions(
            chequeNumbersData.map((cheque) => ({
              label: cheque.cheque_number,
              value: cheque.id,
            }))
          );
        }
        // 6. Empty array
        else {
          setChequeOptions([]);
        }
      } else if (!selectedBank) {
        setChequeOptions([
          { label: 'Select Bank Account First', value: null, isDisabled: true },
        ]);
      } else {
        // No data and not loading - set empty options
        setChequeOptions([]);
      }
    } else {
      setChequeOptions([]);
    }
  }, [
    chequeNumbersData,
    selectedBank,
    showChequeNumber,
    isLoadingChequeNumbers,
    isChequeError,
    chequeError,
  ]);
  // Fetch currency rate for the selected Currency (following Journal Voucher pattern)
  const { data: currencyRate, isLoading: isLoadingCurrencyRate } = useQuery({
    queryKey: ['currencyRate', selectedCurrency, date, 'a2a'],
    queryFn: () => getCurrencyRate(selectedCurrency, date),
    enabled: !!selectedCurrency,
    retry: 1,
    staleTime: 0, // Mark data as stale immediately after fetching
    gcTime: 0, // Remove data from cache immediately after becoming unused
    refetchOnMount: true,
  });

  // Handle currency rate response (following Journal Voucher pattern)
  useEffect(() => {
    if (currencyRate?.rate) {
      // Currency rate is available, no action needed
    } else if (currencyRate && selectedCurrency) {
      // Currency rate is missing, show modal
      setCurrencyToSelect(selectedCurrency);
      setShowMissingCurrencyRateModal(true);
      // Note: We no longer clear setSelectedCurrency(null) here to keep it selected
    }
  }, [currencyRate, selectedCurrency]);

  // Effect to handle currency clearing based on rate availability (only when returning from Rate page)
  useEffect(() => {
    if (!shouldCheckFormValues) return;

    const hasRateNavigationData = hasFormValues('account-to-account');
    if (hasRateNavigationData && !restoreValuesFromStore && !isReturningFromRateExchange) {
      const formData = getFormValues('account-to-account');
      if (formData && formikRef.current && formData.currency && selectedCurrency) {
        // Check if rate exists for this currency
        if (!currencyRate?.rate) {
          // No rate exists, clear the currency field
          formikRef.current.setFieldValue('currency', '');
          setSelectedCurrency(null);
        } else {
          // Rate exists, keep the currency selected and clear form data
          // Currency is already set in the previous useEffect, so we don't need to do anything
        }
        // Clear the saved form data after processing
        clearFormValues('account-to-account');
        clearLastVisitedPage(formId);
      }
    }
  }, [currencyRate, selectedCurrency, shouldCheckFormValues, restoreValuesFromStore, isReturningFromRateExchange]);

  const { data: debitAccountBalance } = useQuery({
    queryKey: ['accountBalance', selectedDebitAccount?.value],
    queryFn: () =>
      getAccountBalance(
        selectedDebitAccount.value,
        selectedDebitAccount.accountType
      ),
    enabled:
      !!selectedDebitAccount?.value &&
      getAccountBalanceSettings('account_to_account'),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
  const { data: creditAccountBalance } = useQuery({
    queryKey: ['accountBalance', selectedCreditAccount?.value],
    queryFn: () =>
      getAccountBalance(
        selectedCreditAccount.value,
        selectedCreditAccount.accountType
      ),
    enabled:
      !!selectedCreditAccount?.value &&
      getAccountBalanceSettings('account_to_account'),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });


  // Validate special commission when main form accounts change
  useEffect(() => {
    if (addedSpecialCommissionValues && formikRef.current) {
      const currentDebitAccount = formikRef.current.values.debitAccount;
      const currentCreditAccount = formikRef.current.values.creditAccount;

      // Check if the currently selected SC account is still one of the main accounts
      // If it's not, we empty the account fields in SC but keep the SC record
      if (addedSpecialCommissionValues.account_id) {
        if (
          String(addedSpecialCommissionValues.account_id) !== String(currentDebitAccount) &&
          String(addedSpecialCommissionValues.account_id) !== String(currentCreditAccount)
        ) {


          setAddedSpecialCommissionValues((prev) => ({
            ...prev,
            account: '',
            account_id: '',
            ledger: '',
            ledger_name: '',
          }));
        }
      }
    }
  }, [
    formikRef.current?.values?.debitAccount,
    formikRef.current?.values?.creditAccount,
  ]);

  // Submission logic (fix stack error by not calling setState in render or in a loop)
  const createMutation = useMutation({
    mutationFn: createAccountToAccount,
    onSuccess: (data) => {
      showToast('Account to Account Created!', 'success');
      if (getPrintSettings('account_to_account')) {
        if (data?.detail?.pdf_url) {
          window.open(data.detail.pdf_url, '_blank');
        }
      }
      // Invalidate and refetch queries following Receipt Voucher pattern
      queryClient.invalidateQueries(['accountToAccountListing']);
      queryClient.refetchQueries(['accountToAccountListing']);

      // Clear special commission immediately on successful submission (before form reset)
      setAddedSpecialCommissionValues(null);
      clearFormValues('special-commission');

      // Force a small delay to ensure the UI updates before form reset
      setTimeout(() => {
        // Reset form and state
        handleResetForm();
      }, 100);
    },
    onError: (error) => {
      if (error.message == 'Voucher limit reached for this branch.') {
        showModal(
          'Cannot Create',
          'You have reached the maximum number of A2A. To create new transactions you need to increase the transaction count form the Transaction Number Register.',
          null,
          'error'
        );
      } else {
        showErrorToast(error);
      }
    },
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
  // Reset form function following Receipt Voucher pattern
  const handleResetForm = () => {
    setPageState('new');
    setIsDisabled(true);
    if (formikRef.current) {
      formikRef.current.resetForm();
    }
    setAddedAttachments([]);
    clearFormValues(formId);
    clearFormValues('special-commission');
    clearFormValues('account-to-account');
    setAddedSpecialCommissionValues(null);
    // Reset selected accounts
    setSelectedDebitAccount(null);
    setSelectedCreditAccount(null);
    setSelectedBank(null);
    setChequeOptions([]);
    // Reset currency-related state
    setSelectedCurrency(null);
    setCurrencyToSelect(null);
    setShowMissingCurrencyRateModal(false);
    setRestoreValuesFromStore(false);
  };

  // Handle file removal (following SuspenseVoucher pattern)
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
    handleResetForm();
    handlePairReleased();
    // Reset date only if not returning from rate exchange
    if (!isReturningFromRateExchange) {
      setDate(new Date().toLocaleDateString('en-CA'));
    }
  };

  // Keyboard shortcut handler for toggling settings
  const handleSettingsKeyDown = (e) => {
    if (e.altKey && !isDisabled) {
      if (e.key.toLowerCase() === 'b') {
        // Toggle Account Balance
        updateAccountBalanceSetting(
          'account_to_account',
          !getAccountBalanceSettings('account_to_account')
        );
        e.preventDefault();
      } else if (e.key.toLowerCase() === 'p') {
        // Toggle Print
        updatePrintSetting(
          'account_to_account',
          !getPrintSettings('account_to_account')
        );
        e.preventDefault();
      }
    }
  };

  // Special Commission modal handler (following Foreign Currency Deal pattern)
  const handleSCClick = () => {
    // Check if required fields are filled
    const requiredFields = [
      'debitLedger',
      'debitAccount',
      'creditLedger',
      'creditAccount',
      'fcAmount',
      'currency',
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

    // Save form values before opening Special Commission modal (following Rate of Exchange pattern)
    if (formikRef.current) {
      saveFormValues(formId, {
        ...formikRef.current.values,
        addedAttachments,
        date,
      });
      setLastVisitedPage(formId, 'special-commission');
    }

    setShowSCModal(true);
  };

  const handleSubmit = async () => {

    // A2A Block: Check if special commission account is empty
    if (addedSpecialCommissionValues) {
      const isSCEmpty =
        !addedSpecialCommissionValues.account_id ||
        addedSpecialCommissionValues.account_id === '' ||
        addedSpecialCommissionValues.account_id === null ||
        addedSpecialCommissionValues.account_id === undefined ||
        !addedSpecialCommissionValues.account ||
        addedSpecialCommissionValues.account === '';

      if (isSCEmpty) {
        showErrorToast({ message: 'Please select an account in Special Commission before submitting the form.' });
        return; // IMMEDIATELY BLOCK SUBMISSION
      }
    }

    if (!formikRef.current) return;

    // Clear previous errors first
    formikRef.current.setErrors({});

    const values = formikRef.current.values;
    const errors = {};

    // Progressive validation - only validate account if ledger is selected
    // Debit Ledger & Account validation
    if (!values.debitLedger) {
      errors.debitLedger = 'Debit Ledger is required';
    } else if (values.debitLedger && !values.debitAccount) {
      // Only show account error if ledger is filled
      errors.debitAccount = 'Debit Account is required';
    }

    // Credit Ledger & Account validation  
    if (!values.creditLedger) {
      errors.creditLedger = 'Credit Ledger is required';
    } else if (values.creditLedger && !values.creditAccount) {
      // Only show account error if ledger is filled
      errors.creditAccount = 'Credit Account is required';
    }

    // Currency and Amount validation - always check both together
    if (!values.currency) {
      errors.currency = 'Currency is required';
    }

    if (!values.fcAmount) {
      errors.fcAmount = 'Amount is required';
    } else {
      const amountValue = parseFloat(values.fcAmount);
      if (isNaN(amountValue) || amountValue <= 0) {
        errors.fcAmount = 'Amount must be greater than zero';
      }
    }

    // Special Commission validation - check if account field is empty when SC is applied
    if (addedSpecialCommissionValues) {


      // Check if account_id is empty, null, undefined, or empty string
      if (!addedSpecialCommissionValues.account_id ||
        addedSpecialCommissionValues.account_id === '' ||
        addedSpecialCommissionValues.account_id === null ||
        addedSpecialCommissionValues.account_id === undefined) {
        errors.specialCommission = 'Account field in Special Commission is required. Please fill the Account field in the Special Commission section before submitting.';
      }
    }

    // Set touched fields only for errors that exist
    const touchedFields = {};
    Object.keys(errors).forEach(key => {
      touchedFields[key] = true;
    });

    if (Object.keys(errors).length > 0) {
      formikRef.current.setErrors(errors);
      formikRef.current.setTouched(touchedFields);

      // Show toast for special commission error
      if (errors.specialCommission) {
        showErrorToast(errors.specialCommission);
      }

      return;
    }

    // Auto-generate narration if not provided
    let debitNarration = values.debitNarration;
    let creditNarration = values.creditNarration;

    // if (!debitNarration && values.debitAccount && values.debitLedger) {
    //   const debitAccount = getAccountsByTypeOptions(values.debitLedger).find(
    //     (x) => x.value === values.debitAccount
    //   );
    //   if (debitAccount) {
    //     debitNarration = `Transfer to ${debitAccount.label}`;
    //   }
    // }

    // if (!creditNarration && values.creditAccount && values.creditLedger) {
    //   const creditAccount = getAccountsByTypeOptions(values.creditLedger).find(
    //     (x) => x.value === values.creditAccount
    //   );
    //   if (creditAccount) {
    //     creditNarration = `Transfer from ${creditAccount.label}`;
    //   }
    // }

    // Map form fields to API fields
    let payload = {
      debit_account_ledger: values.debitLedger,
      debit_account_id: values.debitAccount,
      credit_account_ledger: values.creditLedger,
      credit_account_id: values.creditAccount,
      account_title: values.account_title,
      currency_id: values.currency,
      fc_amount: values.fcAmount,
      debit_account_narration: debitNarration,
      credit_account_narration: creditNarration,
      comment: values.comment,
      date,
      // Only include cheque_number_id if selected
      ...(values.chequeNumber ? { cheque_number_id: values.chequeNumber } : {}),
      ...addedAttachments,
    };

    if (addedSpecialCommissionValues) {
      // Flatten the SC object
      const converted = {};
      const sc = {
        transaction_no: lastVoucherNumbers?.current,
        date,
        // Use the selected account from special commission, not hardcoded debit account
        ledger: addedSpecialCommissionValues?.ledger || values.debitLedger,
        account_id: addedSpecialCommissionValues?.account_id || values.debitAccount,
        currency_id: values.currency,
        amount: values.fcAmount,
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

      payload = {
        ...payload,
        ...converted,
        // commission_amount: addedSpecialCommissionValues?.total_commission,
      };
    }
    handlePairReleased();
    createMutation.mutate(payload);
  };

  const getSCValues = () => {
    // Prepare Special Commission values
    const currentFormValues = {
      debitLedger: formikRef?.current?.values.debitLedger,
      debitAccount: formikRef?.current?.values.debitAccount,
      creditLedger: formikRef?.current?.values.creditLedger,
      creditAccount: formikRef?.current?.values.creditAccount,
    };

    const scValues = {
      date: date,
      transaction_no: lastVoucherNumbers?.current,
      // Current form values should take precedence for display fields
      ledger:
        ledgerOptions.find(
          (x) => x.value === formikRef?.current?.values.debitLedger
        ) || '',
      ledger_name:
        ledgerOptions.find(
          (x) => x.value === formikRef?.current?.values.debitLedger
        )?.label || '',
      // For account, use the currently selected account from special commission or default to debit account
      account: addedSpecialCommissionValues?.account ||
        getAccountsByTypeOptions(formikRef?.current?.values.debitLedger).find(
          (x) => x.value === formikRef?.current?.values.debitAccount
        ) || '',
      account_id: addedSpecialCommissionValues?.account_id || formikRef?.current?.values.debitAccount || '',
      currency:
        currencyOptions.find(
          (x) => x.value === formikRef?.current?.values.currency
        ) || '',
      currency_id: formikRef?.current?.values.currency || '',
      amount: formikRef?.current?.values.fcAmount || 0,
      // Preserve special commission data but don't override display fields
      ...addedSpecialCommissionValues,
      commission_type:
        addedSpecialCommissionValues?.commission_type ||
        formikRef?.current?.values.commission_type ||
        'Income', // Default
    };

    return scValues;
  };

  const getAvailableAccountsForSC = () => {
    const accounts = [];

    // Add debit account first (prioritize current selection)
    if (
      formikRef?.current?.values.debitAccount &&
      formikRef?.current?.values.debitLedger
    ) {
      const debitAccount = getAccountsByTypeOptions(
        formikRef.current.values.debitLedger
      ).find((x) => String(x.value) === String(formikRef.current.values.debitAccount));
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

    // Add credit account second
    if (
      formikRef?.current?.values.creditAccount &&
      formikRef?.current?.values.creditLedger
    ) {
      const creditAccount = getAccountsByTypeOptions(
        formikRef.current.values.creditLedger
      ).find((x) => String(x.value) === String(formikRef.current.values.creditAccount));
      if (creditAccount) {
        // Avoid duplicates
        const isDuplicate = accounts.some(acc => String(acc.value) === String(creditAccount.value));
        if (!isDuplicate) {
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
    }

    // Include the account from Special Commission if it's already set
    if (addedSpecialCommissionValues?.account_id) {
      const isAlreadyInList = accounts.some(
        (acc) => String(acc.value) === String(addedSpecialCommissionValues.account_id)
      );

      if (!isAlreadyInList) {
        accounts.push({
          label:
            addedSpecialCommissionValues.account?.label ||
            addedSpecialCommissionValues.account ||
            '',
          value: addedSpecialCommissionValues.account_id,
          ledgerType:
            addedSpecialCommissionValues.ledger?.value ||
            addedSpecialCommissionValues.ledger ||
            '',
          ledgerLabel:
            addedSpecialCommissionValues.ledger?.label ||
            addedSpecialCommissionValues.ledger_name ||
            '',
        });
      }
    }

    return accounts;
  };

  return (
    <>
      <div className="d-card">
        <Formik
          innerRef={formikRef}
          initialValues={{
            debitLedger: '',
            debitAccount: '',
            creditLedger: '',
            creditAccount: '',
            chequeNumber: '',
            account_title: 'show',
            currency: '',
            fcAmount: '',
            debitNarration: '',
            creditNarration: '',
            comment: '',
          }}
          validationSchema={accountToAccountvalidationSchema}
          onSubmit={handleSubmit}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            setFieldValue,
            setFieldTouched,
            validateForm,
          }) => {
            // Helper function to handle account loading

            const handleLedgerChange = (
              ledgerType,
              fieldName,
              setAccountField
            ) => {
              setFieldValue(fieldName, ledgerType);
              setFieldValue(setAccountField, ''); // Clear account when ledger changes
              
              // Reset selected account states when ledger changes
              if (setAccountField === 'debitAccount') {
                setSelectedDebitAccount(null);
              } else if (setAccountField === 'creditAccount') {
                setSelectedCreditAccount(null);
              }
            };

            return (
              <Form>
                <div className="row">
                  <div className={'col-12 col-lg-10 col-xl-9 col-xxl-7'}>
                    <div className="row">
                      {/* Debit Account Section */}
                      <div className="col-12 col-md-5 mb-4">
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
                              'debitAccount'
                            );
                            // Progressive validation: show account error when ledger is selected
                            if (selected.value && !values.debitAccount) {
                              setFieldTouched('debitAccount', true);
                              setTimeout(() => {
                                validateForm();
                              }, 0);
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
                              setNewAccountTriggeredFrom('debit');
                            } else if (selected && selected.value) {
                              setFieldValue('debitAccount', selected.value);
                              // Track selected debit account for balance fetching
                              setSelectedDebitAccount({
                                value: selected.value,
                                label: selected.label,
                                accountType: values.debitLedger,
                              });
                              // Progressive validation: clear error when account is selected
                              setFieldTouched('debitAccount', true);
                              setTimeout(() => {
                                validateForm();
                              }, 0);
                            } else {
                              // Handle deselection
                              setFieldValue('debitAccount', '');
                              setSelectedDebitAccount(null);
                            }
                          }}
                        />
                        {/* Error messages moved outside the CombinedInputs */}
                        <ErrorMessage
                          name="debitLedger"
                          component="div"
                          className="input-error-message text-danger"
                        />
                        <ErrorMessage
                          name="debitAccount"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>

                      {/* Credit Account Section */}
                      <div className="col-12 col-md-7 mb-4">
                        <div
                          className={`d-flex ${(touched.creditAccount && errors.creditAccount && errors.creditAccount.toString().trim() !== '')
                            ? 'align-items-center'
                            : 'align-items-end'
                            } gap-2`}
                        >
                          <div className="flex-grow-1">
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
                                  'creditAccount'
                                );
                                // Progressive validation: show account error when ledger is selected
                                if (selected.value && !values.creditAccount) {
                                  setFieldTouched('creditAccount', true);
                                  setTimeout(() => {
                                    validateForm();
                                  }, 0);
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
                                  setNewAccountTriggeredFrom('credit');
                                } else if (selected && selected.value) {
                                  setFieldValue(
                                    'creditAccount',
                                    selected.value
                                  );
                                  // Track selected credit account for balance fetching
                                  setSelectedCreditAccount({
                                    value: selected.value,
                                    label: selected.label,
                                    accountType: values.creditLedger,
                                  });
                                  // Progressive validation: clear error when account is selected
                                  setFieldTouched('creditAccount', true);
                                  setTimeout(() => {
                                    validateForm();
                                  }, 0);
                                } else {
                                  // Handle deselection
                                  setFieldValue('creditAccount', '');
                                  setSelectedCreditAccount(null);
                                }
                              }}
                            />
                            {/* Error messages moved outside the CombinedInputs */}
                            <ErrorMessage
                              name="debitLedger"
                              component="div"
                              className="input-error-message text-danger"
                              text="Switch Account"
                              type="button"
                              variant="primaryButton"
                              size="sm"
                              disabled={isDisabled}
                              onClick={() => {
                                // Switch debit and credit accounts
                                const tempDebitLedger =
                                  values.debitLedger || '';
                                const tempDebitAccount =
                                  values.debitAccount || '';
                                const tempCreditLedger =
                                  values.creditLedger || '';
                                const tempCreditAccount =
                                  values.creditAccount || '';
                                const tempSelectedDebit = selectedDebitAccount;
                                const tempSelectedCredit =
                                  selectedCreditAccount;

                                // Update form values
                                setFieldValue('debitLedger', tempCreditLedger);
                                setFieldValue(
                                  'debitAccount',
                                  tempCreditAccount
                                );
                                setFieldValue('creditLedger', tempDebitLedger);
                                setFieldValue(
                                  'creditAccount',
                                  tempDebitAccount
                                );

                                // Update selected account states
                                setSelectedDebitAccount(tempSelectedCredit);
                                setSelectedCreditAccount(tempSelectedDebit);
                              }}
                            />
                          </div>
                        </div>
                        {/* Error messages moved outside the flex container */}
                        <ErrorMessage
                          name="creditLedger"
                          component="div"
                          className="input-error-message text-danger"
                        />
                        <ErrorMessage
                          name="creditAccount"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>
                      {/* Cheque Number - Only show when a bank account is selected */}
                      {showChequeNumber && (
                        <div className="col-12 col-md-6 mb-4">
                          <SearchableSelect
                            name="chequeNumber"
                            label="Cheque Number"
                            options={chequeOptions}
                            value={values.chequeNumber}
                            onChange={(selected) =>
                              setFieldValue('chequeNumber', selected.value)
                            }
                            onBlur={handleBlur}
                            placeholder="Select Cheque Number"
                            isDisabled={isDisabled}
                          />
                          <ErrorMessage
                            name="chequeNumber"
                            component="div"
                            className="input-error-message text-danger"
                          />
                        </div>
                      )}
                      {/* Account Title Show/Hide */}
                      <div className="col-12 col-md-6 mb-4">
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
                          placeholder="Show"
                          isDisabled={isDisabled}
                        />
                      </div>
                      {/* Currency and FC Amount */}
                      <div className="col-12 col-md-6 mb-4">
                        <CombinedInputs
                          label="Currency"
                          type1="select"
                          type2="input"
                          name1="currency"
                          name2="fcAmount"
                          value1={values.currency}
                          value2={values.fcAmount}
                          options1={currencyOptions}
                          isDisabled={isDisabled}
                          handleBlur={handleBlur}
                          placeholder1="Currency"
                          placeholder2="Amount"
                          inputType2="number"
                          className1="currency"
                          className2="amount"
                          onChange1={(selected) => {
                            setFieldValue('currency', selected.value);
                            setSelectedCurrency(selected.value);
                          }}
                          onChange2={(e) => {
                            handleChange(e);
                            
                            // Recalculate Special Commission if it exists and amount changed
                            if (addedSpecialCommissionValues && addedSpecialCommissionValues.commission) {
                              const commissionPercentage = parseFloat(addedSpecialCommissionValues.commission) || 0;
                              const amount = parseFloat(e.target.value || 0);
                              const newTotalCommission = (commissionPercentage / 100) * amount;

                              // Update Special Commission values with new amount and recalculated commission
                              setAddedSpecialCommissionValues((prev) => ({
                                ...prev,
                                amount: amount,
                                total_commission: newTotalCommission,
                              }));
                            }
                          }}
                          additionalProps={{
                            isLoadingCurrencyRate: isLoadingCurrencyRate,
                          }}
                        />
                        <ErrorMessage
                          name="currency"
                          component="div"
                          className="input-error-message text-danger"
                        />
                        <ErrorMessage
                          name="fcAmount"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>

                      {/* Debit Account Narration */}
                      <div className="col-12 col-md-6 mb-3">
                        <CustomInput
                          name="debitNarration"
                          label="Debit Account Narration"
                          type="textarea"
                          value={values.debitNarration}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Enter Debit Account Narration"
                          disabled={isDisabled}
                        />
                      </div>

                      {/* Credit Account Narration */}
                      <div className="col-12 col-md-6 mb-3">
                        <CustomInput
                          name="creditNarration"
                          label="Credit Account Narration"
                          type="textarea"
                          value={values.creditNarration}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Enter Credit Account Narration"
                          disabled={isDisabled}
                        />
                      </div>

                      {/* Comment */}
                      <div className="col-12 mb-3">
                        <CustomInput
                          name="comment"
                          label="Comment"
                          type="textarea"
                          value={values.comment}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Enter Comment"
                          disabled={isDisabled}
                          error={touched.comment && errors.comment}
                        />
                      </div>

                      {/* Attachments Display (following Journal Voucher pattern) */}
                      <div className="col-12 mb-3">
                        <div className="d-flex flex-wrap gap-2">
                          {Object.values(addedAttachments)?.map(
                            (file, index) => (
                              <div key={index} style={{ position: 'relative' }}>
                                <div className={Styles.uploadedFiles}>
                                  <div className={Styles.nameIconWrapper}>
                                    <div
                                      className="beechMein"
                                      style={{ minWidth: 28 }}
                                    >
                                      {getIcon(file.type)}
                                    </div>
                                    <div
                                      style={{ width: 126 }}
                                      className="d-flex flex-column flex-1"
                                    >
                                      <p className={Styles.fileName}>
                                        {file.name}
                                      </p>
                                      <p className={Styles.size}>
                                        {formatFileSize(file.size)}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    className={Styles.fileRemoveButton}
                                    onClick={() => {
                                      handleRemoveFile(file);
                                    }}
                                    disabled={isDisabled}
                                  >
                                    <FaXmark size={16} />
                                  </button>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Add Special Commission Button */}
                    <div className="d-flex mb-4">
                      <CustomButton
                        type="button"
                        onClick={handleSCClick}
                        text={`${!!addedSpecialCommissionValues ? 'Edit' : 'Add'
                          } Special Commission`}
                        disabled={isDisabled}
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
                            (x) => x.value == values.currency
                          )?.label
                        }{' '}
                        {formatNumberWithCommas(addedSpecialCommissionValues?.total_commission)} on{' '}
                        {
                          currencyOptions.find(
                            (x) => x.value == values.currency
                          )?.label
                        }{' '}
                        {formatNumberWithCommas(values.fcAmount)}
                      </p>
                    ) : null}

                    {/* Checkboxes */}
                    <div className="d-inline-block mt-3">
                      <CustomCheckbox
                        label="Account Balance"
                        checked={getAccountBalanceSettings(
                          'account_to_account'
                        )}
                        style={{ border: 'none', margin: 0 }}
                        onChange={(e) => {
                          updateAccountBalanceSetting(
                            'account_to_account',
                            e.target.checked
                          );
                        }}
                        readOnly={isDisabled}
                      />
                      {hasPrintPermission && (
                        <CustomCheckbox
                          label="Print"
                          checked={getPrintSettings('account_to_account')}
                          onChange={(e) => {
                            updatePrintSetting(
                              'account_to_account',
                              e.target.checked
                            );
                          }}
                          style={{ border: 'none', margin: 0 }}
                          readOnly={isDisabled}
                        />
                      )}
                    </div>
                  </div>
                  {!isDisabled && (
                    <div className="col-12 col-lg-10 col-xl-9 col-xxl-3 offset-0 offset-xxl-2 ">
                      <div className="row">
                        {/* Right side cards */}
                        <div
                          className="col-12 mb-5"
                          style={{ maxWidth: '350px' }}
                        >
                          {getAccountBalanceSettings('account_to_account') && (
                            <>
                              {selectedDebitAccount && (
                                <AccountBalanceCard
                                  heading="Debit Account Balance"
                                  accountName={selectedDebitAccount.label}
                                  balances={debitAccountBalance?.balances || []}
                                  loading={debitAccountBalance === undefined}
                                />
                              )}
                              {selectedCreditAccount && (
                                <AccountBalanceCard
                                  heading="Credit Account Balance"
                                  accountName={selectedCreditAccount.label}
                                  balances={
                                    creditAccountBalance?.balances || []
                                  }
                                  loading={creditAccountBalance === undefined}
                                />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Form>
            );
          }}
        </Formik >
      </div >

      <VoucherNavigationBar
        isDisabled={isDisabled}
        actionButtons={[
          { text: 'Save', onClick: handleSubmit },
          {
            text: 'Cancel',
            onClick: handleCancel,
            variant: 'secondaryButton',
          },
        ]}
        loading={createMutation.isPending}
        onAttachmentClick={() => setUploadAttachmentsModal(true)}
        lastVoucherNumbers={lastVoucherNumbers}
        setPageState={setPageState}
        setSearchTerm={setSearchTerm}
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

      {/* Missing Currency Rate Modal (following Journal Voucher pattern) */}
      <CustomModal
        show={showMissingCurrencyRateModal}
        close={() => {
          setShowMissingCurrencyRateModal(false);
          // Clear currency selection when modal is closed without action
          if (formikRef.current) {
            formikRef.current.setFieldValue('currency', '');
            setSelectedCurrency(null);
          }
        }}
        title={'Missing Rate of Exchange'}
        description={'Rate of exchange is missing for selected currency.'}
        variant={'error'}
        btn1Text={'Update Rate of Exchange'}
        action={() => {
          // Save form data before navigation (following Journal Voucher pattern)
          if (formikRef.current) {
            saveFormValues('account-to-account', {
              ...formikRef.current.values,
              addedAttachments,
              addedSpecialCommissionValues,
              date,
            });
            setLastVisitedPage(formId, 'rate-of-exchange');
          }
          navigate('/transactions/remittance-rate-of-exchange', {
            state: { currencyToSelect, date },
          });
        }}
      />

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
          isEdit={false}
          isTwoLedgerVoucher={true}
          availableAccounts={getAvailableAccountsForSC()}
          onSubmit={(sCValues) => {
            setAddedSpecialCommissionValues(sCValues);
            setShowSCModal(false);
          }}
          onCancel={(currentValues) => {
            // Save current form state when canceling to preserve account selection
            if (currentValues && (currentValues.account_id || currentValues.account)) {
              setAddedSpecialCommissionValues(currentValues);
            }
            setShowSCModal(false);
          }}
          onDelete={() => {
            setAddedSpecialCommissionValues(null);
            setShowSCModal(false);
          }}
        />
      </CustomModal>
    </>
  );
};

export default withModal(NewAccountToAccount);
