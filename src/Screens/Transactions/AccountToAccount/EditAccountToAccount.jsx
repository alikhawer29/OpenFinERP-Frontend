import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import AccountBalanceCard from '../../../Components/AccountBalanceCard/AccountBalanceCard';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CombinedInputs from '../../../Components/CombinedInputs/CombinedInputs';
import CustomButton from '../../../Components/CustomButton';
import CustomCheckbox from '../../../Components/CustomCheckbox/CustomCheckbox';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import ExchangeRatesCard from '../../../Components/ExchangeRatesCard/ExchangeRatesCard';
import FileDisplayList from '../../../Components/FileDisplayList/FileDisplayList';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import useAccountsByType from '../../../Hooks/useAccountsByType';
import { getExchangeRates, pairReleased } from '../../../Services/General';
import {
  checkTransactionLockStatus,
  releaseTransaction,
} from '../../../Services/Process/TransactionLock';
import {
  addAccountToAccountAttachment,
  deleteAccountToAccountAttachment,
  getAccountBalance,
  getAccountToAccountListing,
  getBanks,
  getChequeNumbersByBank,
  getCurrencyRate,
  updateAccountToAccount,
} from '../../../Services/Transaction/AccountToAccount';
import useFormStore from '../../../Stores/FormStore';
import useSettingsStore from '../../../Stores/SettingsStore';
import { ledgerOptions } from '../../../Utils/Constants/SelectOptions';
import { formatNumberWithCommas, transformSpecialCommission } from '../../../Utils/Helpers';
import { showErrorToast } from '../../../Utils/Utils';
import { accountToAccountvalidationSchema } from '../../../Utils/Validations/ValidationSchemas';
import SpecialCommission from '../SpecialCommission/SpecialCommission';

const EditAccountToAccount = ({
  state,
  date,
  setDate,
  isDisabled,
  setIsDisabled,
  currencyOptions,
  setShowAddLedgerModal,
  setPageState,
  lastVoucherNumbers,
  setSearchTerm,
  setWriteTerm,
  searchTerm,
  newlyCreatedAccount,
  hasPrintPermission,
}) => {
  const formikRef = useRef();
  const isRestoringRef = useRef(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Form store for Special Commission navigation
  const {
    saveFormValues,
    getFormValues,
    hasFormValues,
    setLastVisitedPage,
    getLastVisitedPage,
    clearLastVisitedPage,
    clearFormValues,
  } = useFormStore();
  const formId = 'edit-account_to_account';
  const voucherName = 'account_to_account';

  // Attachments state (following Payment Voucher Edit pattern)
  const [addedAttachments, setAddedAttachments] = useState({});
  const [deletedAttachments, setDeletedAttachments] = useState([]); // Track IDs of attachments to delete
  const [currentFiles, setCurrentFiles] = useState([]); // Track current files for UI display
  const filesInitializedRef = useRef(false); // Track if files have been initialized
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);

  // Cheque numbers and bank logic
  const [selectedBank, setSelectedBank] = useState('');
  const [chequeOptions, setChequeOptions] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [showChequeNumber, setShowChequeNumber] = useState(false);
  // Account selection
  const [selectedDebitAccount, setSelectedDebitAccount] = useState(null);
  const [selectedCreditAccount, setSelectedCreditAccount] = useState(null);
  const [newAccountTriggeredFrom, setNewAccountTriggeredFrom] = useState('');

  // Special Commission state (following New page pattern)
  const [addedSpecialCommissionValues, setAddedSpecialCommissionValues] =
    useState(null);
  const [showSCModal, setShowSCModal] = useState(false);

  // Missing Currency Rate Modal state (following Journal Voucher pattern)
  const [showMissingCurrencyRateModal, setShowMissingCurrencyRateModal] =
    useState(false);
  const [currencyToSelect, setCurrencyToSelect] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [exchangeRatesInverse, setExchangeRatesInverse] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);

  // Add a flag to prevent date reset when returning from Rate of Exchange page
  const [isReturningFromRateExchange, setIsReturningFromRateExchange] = useState(false);
  const [restoreValuesFromStore, setRestoreValuesFromStore] = useState(false);

  // Print settings
  const {
    getPrintSettings,
    updatePrintSetting,
    getAccountBalanceSettings,
    updateAccountBalanceSetting,
  } = useSettingsStore();

  // Fetch the voucher details
  const {
    data: { data: [accountToAccountData] = [] } = {},
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['accountToAccount', searchTerm],
    queryFn: () => getAccountToAccountListing({ search: searchTerm }),
    enabled: !!searchTerm,
  });

  // Get account options using custom hook
  const { getAccountsByTypeOptions } = useAccountsByType({
    includeBeneficiary: false,
    staleTime: 1000 * 60 * 5,
  });

  // Handle navigation from Rate of Exchange page (following NewAccountToAccount pattern)
  useEffect(() => {
    const lastPage = getLastVisitedPage(formId);
    if (lastPage === 'rate-of-exchange') {
      const savedFormData = getFormValues(formId);
      if (savedFormData) {
        // Set flag to prevent date reset
        setIsReturningFromRateExchange(true);
        // Restore the date from saved form data
        if (savedFormData.date) {
          setDate(savedFormData.date);
        }
        // Note: Page state and isDisabled are handled by parent component
        // Just trigger value restoration
        setRestoreValuesFromStore(true);
      }
    }
  }, []);

  // Restore form values when restoreValuesFromStore is true (following NewAccountToAccount pattern)
  useEffect(() => {
    if (restoreValuesFromStore && hasFormValues(formId) && formikRef.current) {
      const savedFormData = getFormValues(formId);
      const savedValues = savedFormData.values || {};
      const savedCurrencyId = savedValues.currency;
      const savedDate = savedFormData.date || date;

      // Set ref immediately to prevent interference during restoration
      isRestoringRef.current = true;

      // Check if rate was added for the currency and date
      if (savedCurrencyId) {
        getCurrencyRate(savedCurrencyId, savedDate)
          .then((rateData) => {
            if (!rateData?.rate) {
              // No rate was added, clear currency field
              if (formikRef.current) {
                formikRef.current.setFieldValue('currency', '');
                setSelectedCurrency(null);
              }
            } else {
              // Rate exists, restore form values
              // Update query cache to prevent clearing and ensure hook has latest data
              queryClient.setQueryData(['currencyRate', savedCurrencyId, savedDate, 'a2a-edit'], rateData);
              formikRef.current.setValues(savedValues);
              setSelectedCurrency(savedCurrencyId);
              // Restore Special Commission if it was saved
              if (savedFormData.addedSpecialCommissionValues) {
                setAddedSpecialCommissionValues(savedFormData.addedSpecialCommissionValues);
              }
            }
            clearFormValues(formId);
            clearLastVisitedPage(formId);
            setRestoreValuesFromStore(false);
            setIsReturningFromRateExchange(false);
            // Reset the flag after restoration
            setTimeout(() => {
              isRestoringRef.current = false;
            }, 200);
          })
          .catch((error) => {
            // Error checking rate, assume no rate was added and clear currency
            if (formikRef.current) {
              formikRef.current.setFieldValue('currency', '');
              setSelectedCurrency(null);
            }
            // Still restore other form values
            const { currency, ...otherValues } = savedValues;
            formikRef.current.setValues(otherValues);
            // Restore Special Commission if it was saved
            if (savedFormData.addedSpecialCommissionValues) {
              setAddedSpecialCommissionValues(savedFormData.addedSpecialCommissionValues);
            }
            clearFormValues(formId);
            clearLastVisitedPage(formId);
            setRestoreValuesFromStore(false);
            setIsReturningFromRateExchange(false);
            // Reset the flag after restoration
            setTimeout(() => {
              isRestoringRef.current = false;
            }, 200);
          });
      } else {
        // No currency was saved, just restore form values
        formikRef.current.setValues(savedValues);
        // Restore Special Commission if it was saved
        if (savedFormData.addedSpecialCommissionValues) {
          setAddedSpecialCommissionValues(savedFormData.addedSpecialCommissionValues);
        }
        clearFormValues(formId);
        clearLastVisitedPage(formId);
        setRestoreValuesFromStore(false);
        setIsReturningFromRateExchange(false);
        // Reset the flag after restoration
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 200);
      }
    }
  }, [restoreValuesFromStore, date]);

  // Handle currency clearing when returning from Rate page via Back button without entering rate
  useEffect(() => {
    // Check if we have form data that indicates navigation to Rate page
    const hasRateNavigationData = hasFormValues(formId);
    if (hasRateNavigationData && !restoreValuesFromStore && !isReturningFromRateExchange) {
      const formData = getFormValues(formId);
      // If we have saved form data but we're not in the process of restoring from Rate page,
      // it means user returned via Back button
      if (formData && formikRef.current && formData.values?.currency) {
        // Set the currency to check if rate exists
        setSelectedCurrency(formData.values.currency);
        // Also update Formik value to ensure the field shows the selected currency
        formikRef.current.setFieldValue('currency', formData.values.currency);

        // Restore Special Commission if it was saved
        if (formData.addedSpecialCommissionValues) {
          setAddedSpecialCommissionValues(formData.addedSpecialCommissionValues);
        }
        // The existing currencyRate query will check for the rate
        // If no rate exists, the currency rate response will be empty
      }
      // Don't clear form data immediately - let the rate check complete first
    }
  }, [formId, restoreValuesFromStore, isReturningFromRateExchange]);

  // Restore special commission and form state if returning from special commission page
  useEffect(() => {
    const lastPage = getLastVisitedPage(formId);
    if (
      lastPage === 'special-commission' &&
      hasFormValues(formId) &&
      formikRef.current
    ) {
      const savedValues = getFormValues(formId);
      formikRef.current.setValues(savedValues);
      setIsDisabled(false);
      if (hasFormValues('special-commission')) {
        setAddedSpecialCommissionValues(getFormValues('special-commission'));
      }
      clearLastVisitedPage(formId);
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

  // Initialize current files from accountToAccount data
  useEffect(() => {
    const ata = accountToAccountData?.account_to_account;
    if (ata && !filesInitializedRef.current) {
      // Initialize current files from account to account data only once
      const filesData = ata.files || accountToAccountData?.files || [];
      setCurrentFiles(filesData);
      filesInitializedRef.current = true;
    }
  }, [accountToAccountData]);

  // Note: Special commission values are handled directly in navigation function
  // following the New page pattern, so no need for separate state management

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
    return (bankAccountsData || []).some((bank) => bank.id === accountId);
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
  }, [selectedDebitAccount, selectedCreditAccount, bankAccountsData]);

  // Fetch cheque numbers when a bank is selected
  const { data: chequeNumbersData } = useQuery({
    queryKey: ['chequeNumbers', selectedBank],
    queryFn: () => getChequeNumbersByBank(selectedBank),
    enabled: !!selectedBank && showChequeNumber,
  });

  // Update cheque options when cheque numbers data changes
  useEffect(() => {
    if (showChequeNumber) {
      if (chequeNumbersData) {
        setChequeOptions(
          chequeNumbersData.map((cheque) => ({
            label: cheque.cheque_number,
            value: cheque.id,
          }))
        );
      } else if (selectedBank) {
        setChequeOptions([
          { label: 'Loading...', value: null, isDisabled: true },
        ]);
      } else {
        setChequeOptions([
          { label: 'Select Bank Account First', value: null, isDisabled: true },
        ]);
      }
    } else {
      setChequeOptions([]);
    }
  }, [chequeNumbersData, selectedBank, showChequeNumber]);

  // Account balances
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

  // Submission logic (fix stack error by not calling setState in render or in a loop)
  const updateAccountToAccountMutation = useMutation({
    mutationFn: (payload) =>
      updateAccountToAccount(accountToAccountData.voucher_no, payload),
    onSuccess: (data) => {
      showToast('Account to Account Updated!', 'success');
      if (getPrintSettings('account_to_account')) {
        if (data?.detail?.pdf_url) {
          window.open(data.detail.pdf_url, '_blank');
        }
      }
      // Invalidate and refetch queries following Receipt Voucher pattern
      queryClient.invalidateQueries(['accountToAccount', searchTerm]);
      queryClient.refetchQueries(['accountToAccount', searchTerm]);
      queryClient.invalidateQueries(['accountToAccountListing']);
      queryClient.refetchQueries(['accountToAccountListing']);

      // Clear special commission immediately on successful submission (following NewAccountToAccount pattern)
      setAddedSpecialCommissionValues(null);
      clearFormValues('special-commission');

      // Release lock on successful update
      releaseLock();
      // Reset form and state
      handleResetForm();
    },
    onError: (error) => {
      showToast(error.message || 'Error updating Account to Account', 'error');
    },
  });

  // Check Transaction lock status to enable/disable Save
  const { isLoading: isLoadingLockStatus, refetch: checkFormStatus } = useQuery(
    {
      queryKey: ['save_lock_status', voucherName, accountToAccountData?.id],
      queryFn: () =>
        checkTransactionLockStatus({
          transaction_type: voucherName,
          transaction_id: accountToAccountData?.id,
        }),
      enabled: false,
      retry: false,
    }
  );

  // Fetch currency rate for the selected Currency (following Journal Voucher pattern)
  const { data: currencyRate, isLoading: isLoadingCurrencyRate } = useQuery({
    queryKey: ['currencyRate', selectedCurrency, date, 'a2a-edit'],
    queryFn: () => getCurrencyRate(selectedCurrency, date),
    enabled: !!selectedCurrency,
    retry: 1,
    staleTime: 0, // Mark data as stale immediately after fetching
    gcTime: 0, // Remove data from cache immediately after becoming unused
    refetchOnMount: true,
  });

  // Handle currency rate response (following EditReceiptVoucher pattern)
  useEffect(() => {
    // Skip during restoration or when returning from Rate of Exchange page to prevent interference
    if (isRestoringRef.current || isReturningFromRateExchange) return;

    if (
      selectedCurrency &&
      date &&
      currencyRate &&
      !currencyRate?.rate &&
      !hasShownModal
    ) {
      setCurrencyToSelect(selectedCurrency);
      setShowMissingCurrencyRateModal(true);
      setHasShownModal(true);

      // Clear form data if we have rate navigation data and no rate was found
      // This handles the case when user returns via Back button without adding rate
      if (hasFormValues(formId)) {
        clearFormValues(formId);
        clearLastVisitedPage(formId);
      }
    }
  }, [selectedCurrency, date, currencyRate?.rate, hasShownModal, isReturningFromRateExchange, formId]);

  // Reset hasShownModal when currency changes to allow re-checking
  useEffect(() => {
    if (selectedCurrency) {
      setHasShownModal(false);
    }
  }, [selectedCurrency]);

  // Check rate availability when date changes
  useEffect(() => {
    // Skip when returning from Rate of Exchange page to prevent interference
    if (isReturningFromRateExchange) return;

    if (selectedCurrency && date) {
      // The currencyRate query will automatically refetch when date changes
      // due to the date dependency in the query key
      // This will trigger the rate checking logic above
    }
  }, [date, selectedCurrency, isReturningFromRateExchange]);


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

  // Try different possible data structures
  const account_to_account = accountToAccountData?.account_to_account;

  const initialValues = {
    debitLedger: account_to_account?.debit_account_ledger,
    creditLedger: account_to_account?.credit_account_ledger,
    debitAccount: account_to_account?.debit_account_details?.id,
    creditAccount: account_to_account?.credit_account_details?.id,
    accountTitle: account_to_account?.account_title,
    accountTitleDisplay: account_to_account?.account_title,
    chequeNumber: account_to_account?.cheque?.id,
    currency: account_to_account?.currency?.id,
    fcAmount: account_to_account?.fc_amount,
    debitNarration: account_to_account?.debit_account_narration || '',
    creditNarration: account_to_account?.credit_account_narration || '',
    comment: account_to_account?.comment || '',
    commission_type:
      account_to_account?.special_commission?.commission_type ||
      account_to_account?.commission_type ||
      '',
  };

  useEffect(() => {
    if (account_to_account && getAccountsByTypeOptions) {
      if (
        account_to_account.debit_account_details &&
        account_to_account.debit_account_ledger &&
        !selectedDebitAccount &&
        formikRef.current?.values?.debitLedger === account_to_account.debit_account_ledger
      ) {
        const debitAccount = getAccountsByTypeOptions(
          account_to_account.debit_account_ledger
        ).find((x) => String(x.value) === String(account_to_account.debit_account_details.id));
        if (debitAccount) {
          setSelectedDebitAccount({
            value: debitAccount.value,
            label: debitAccount.label,
            accountType: account_to_account.debit_account_ledger,
          });
        }
      }

      if (
        account_to_account.credit_account_details &&
        account_to_account.credit_account_ledger &&
        !selectedCreditAccount &&
        formikRef.current?.values?.creditLedger === account_to_account.credit_account_ledger
      ) {
        const creditAccount = getAccountsByTypeOptions(
          account_to_account.credit_account_ledger
        ).find((x) => String(x.value) === String(account_to_account.credit_account_details.id));
        if (creditAccount) {
          setSelectedCreditAccount({
            value: creditAccount.value,
            label: creditAccount.label,
            accountType: account_to_account.credit_account_ledger,
          });
        }
      }

      // Load Special Commission data from API response
      if (
        account_to_account?.special_commission &&
        !addedSpecialCommissionValues
      ) {
        // Transform the API response using the helper function
        const transformedSC = transformSpecialCommission(
          account_to_account.special_commission
        );
        setAddedSpecialCommissionValues(transformedSC);
      }

      // Set selected currency for rate checking when form loads
      if (
        account_to_account?.currency?.id &&
        !selectedCurrency
      ) {
        setSelectedCurrency(account_to_account.currency.id);
      }
    }
  }, [
    account_to_account,
    getAccountsByTypeOptions,
    selectedDebitAccount,
    selectedCreditAccount,
    addedSpecialCommissionValues,
    selectedCurrency,
  ]);

  const handleSubmit = async () => {

    // run status check first
    const { error: errorLockStatus } = await checkFormStatus();
    if (errorLockStatus?.detail?.locked) {
      showToast(errorLockStatus?.message, 'error');
      return;
    }

    // AGGRESSIVE CHECK: Block submission if special commission account is empty
    if (addedSpecialCommissionValues) {

      // Check if SC data exists but appears empty in UI
      const scDataExists = addedSpecialCommissionValues.account_id &&
        addedSpecialCommissionValues.account_id !== '' &&
        addedSpecialCommissionValues.account_id !== null &&
        addedSpecialCommissionValues.account_id !== undefined &&
        addedSpecialCommissionValues.account &&
        addedSpecialCommissionValues.account !== '';

      if (!scDataExists) {
        showErrorToast({ message: 'Please select an account in Special Commission before submitting the form.' });
        return; // IMMEDIATELY BLOCK SUBMISSION
      }
    } else {
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

    // Map form fields to API fields (same as New page)
    let payload = {
      debit_account_ledger: values.debitLedger,
      debit_account_id: values.debitAccount,
      credit_account_ledger: values.creditLedger,
      credit_account_id: values.creditAccount,
      account_title: values.accountTitleDisplay,
      currency_id: values.currency,
      fc_amount: values.fcAmount,
      debit_account_narration: debitNarration,
      credit_account_narration: creditNarration,
      comment: values.comment,
      date,
      // Only include cheque_number_id if selected
      ...(values.chequeNumber ? { cheque_number_id: values.chequeNumber } : {}),
      // Include attachments in update payload (following Payment Voucher Edit pattern)
      ...(addedAttachments || {}),
      // Include deleted attachments for removal
      ...(deletedAttachments && deletedAttachments.length > 0 && {
        deleted_attachments: deletedAttachments
      }),
    };

    // Special Commission (following New page pattern)
    if (addedSpecialCommissionValues) {
      // Flatten the SC object
      const converted = {};
      const sc = {
        transaction_no: lastVoucherNumbers?.current,
        date,
        // Use the selected account from special commission, not hardcoded debit account
        ledger: addedSpecialCommissionValues?.ledger || values.debitLedger, // Use string value, not object
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
        } else if (key === 'ledger' && typeof sc[key] === 'object') {
          // Skip the ledger object from addedSpecialCommissionValues, use the string value instead
          converted[`special_commission[${key}]`] = values.debitLedger;
        } else if (key !== 'ledger' || typeof sc[key] !== 'object') {
          // Include all other fields, but skip ledger object
          converted[`special_commission[${key}]`] = sc[key];
        }
      }

      payload = {
        ...payload,
        ...converted,
      };
    }
    handlePairReleased()
    setDate(new Date().toLocaleDateString('en-CA'))
    updateAccountToAccountMutation.mutate(payload);
  };

  // Reset form function following Receipt Voucher pattern
  const handleResetForm = () => {
    setPageState('view');
    setIsDisabled(true);
    if (formikRef.current) {
      formikRef.current.resetForm();
    }
    setAddedAttachments({});
    setDeletedAttachments([]);
    // Reset files to original state and allow re-initialization
    filesInitializedRef.current = false;
    if (accountToAccountData?.account_to_account?.files || accountToAccountData?.files) {
      setCurrentFiles(accountToAccountData?.account_to_account?.files || accountToAccountData?.files || []);
    } else {
      setCurrentFiles([]);
    }
    clearFormValues(formId);
    clearFormValues('special-commission');
    clearFormValues('edit-account-to-account');
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
    setHasShownModal(false);
    // Reset rate exchange flags
    setIsReturningFromRateExchange(false);
    setRestoreValuesFromStore(false);
  };

  const getSCValues = () => {
    // Determine the source for ledger and account display
    // If addedSpecialCommissionValues exists, it should take precedence
    const scLedger = addedSpecialCommissionValues?.ledger?.value || addedSpecialCommissionValues?.ledger || formikRef?.current?.values.debitLedger;
    const scAccount = addedSpecialCommissionValues?.account_id || formikRef?.current?.values.debitAccount;

    // Resolve labels from options
    const resolvedLedger = ledgerOptions.find(x => x.value === scLedger);
    const resolvedAccount = getAccountsByTypeOptions(scLedger).find(x => String(x.value) === String(scAccount));

    // Determine ledger_name: prioritize from resolved ledger, then from saved SC data
    let ledgerName = '';
    if (resolvedLedger?.label) {
      ledgerName = resolvedLedger.label;
    } else if (addedSpecialCommissionValues?.ledger?.label) {
      ledgerName = addedSpecialCommissionValues.ledger.label;
    } else if (addedSpecialCommissionValues?.ledger_name) {
      ledgerName = addedSpecialCommissionValues.ledger_name;
    }

    // Determine account: prioritize from resolved account, then from saved SC data
    let account = '';
    if (resolvedAccount) {
      account = resolvedAccount;
    } else if (addedSpecialCommissionValues?.account) {
      // Check if account is already an object with label and value
      if (typeof addedSpecialCommissionValues.account === 'object' && addedSpecialCommissionValues.account.label) {
        account = addedSpecialCommissionValues.account;
      } else if (typeof addedSpecialCommissionValues.account === 'string') {
        // If it's a string, create an object
        account = {
          label: addedSpecialCommissionValues.account,
          value: scAccount
        };
      }
    }

    return {
      date: date,
      transaction_no: lastVoucherNumbers?.current,
      ledger: resolvedLedger || addedSpecialCommissionValues?.ledger || '',
      ledger_name: ledgerName,
      account: account,
      account_id: scAccount || '',
      currency:
        currencyOptions.find(
          (x) => x.value === formikRef?.current?.values.currency
        ) || '',
      currency_id: formikRef?.current?.values.currency || '',
      amount: formikRef?.current?.values.fcAmount || 0,
      // Preserve all other special commission data
      ...addedSpecialCommissionValues,
      commission_type:
        addedSpecialCommissionValues?.commission_type ||
        formikRef?.current?.values.commission_type ||
        'Income', // Default
    };
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

    // Ensure the saved special commission account is in the available accounts list
    // This is critical for showing the selected label in the dropdown on edit page load
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

  // Handle voucher-level attachment uploads (following Payment Voucher Edit pattern)
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

  // Handle attachment deletion in deferred mode
  const handleDeletedAttachments = (attachmentId) => {
    setDeletedAttachments((prev) => [...prev, attachmentId]);
    // Remove from current files display
    setCurrentFiles((prev) => prev.filter((f) => f.id !== attachmentId));
  };

  // Release lock on unmount or cancel
  const releaseExecutedRef = useRef(false);
  const releaseTransactionMutation = useMutation({
    mutationFn: releaseTransaction,
  });
  const releaseLock = useCallback(() => {
    if (releaseExecutedRef.current) return;
    if (accountToAccountData?.id) {
      releaseTransactionMutation.mutate({
        transaction_type: voucherName,
        transaction_id: accountToAccountData?.id,
      });
      releaseExecutedRef.current = true;
    }
  }, [accountToAccountData?.id]);

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
    // Release pair lock
    handlePairReleased();
    // Release transaction lock
    releaseLock();
    // Reset date
    setDate(new Date().toLocaleDateString('en-CA'));
    // Go back to view mode (this will be handled by parent component's back button logic)
    setPageState('view');
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

    // Save form values before opening Special Commission modal (following NewAccountToAccount pattern)
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

  if (isError) {
    showErrorToast(error);
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

  return (
    <>
      <div className="d-card">
        <Formik
          innerRef={formikRef}
          initialValues={initialValues}
          validationSchema={accountToAccountvalidationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
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
                  <div
                    className={
                      isDisabled
                        ? 'col-12 col-lg-10 col-xl-9 col-xxl-7'
                        : 'col-12 col-lg-10 col-xl-9 col-xxl-7'
                    }
                  >
                    <div className="row">
                      {/* Debit Account Section */}
                      <div className="col-12 col-sm-5 mb-45">
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
                      <div className="col-12 col-sm-7 mb-45">
                        <div className="d-flex align-items-end gap-2">
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

                          </div>
                          {/* Switch Account Button */}
                          <div className="d-flex justify-content-end mt-2 flex-shrink-0 position-relative">
                            <CustomButton
                              text="Switch Account"
                              type="button"
                              variant="secondaryButton"
                              size="sm"
                              disabled={
                                isDisabled ||
                                (!values.debitAccount && !values.creditAccount)
                              }
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
                        <div className="col-12 col-sm-6 mb-45">
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
                      <div className="col-12 col-sm-6 mb-45">
                        <SearchableSelect
                          name="accountTitleDisplay"
                          label="Account Title"
                          options={[
                            { label: 'Show', value: 'show' },
                            { label: 'Hide', value: 'hide' },
                          ]}
                          value={values.accountTitleDisplay}
                          onChange={(selected) =>
                            setFieldValue('accountTitleDisplay', selected.value)
                          }
                          onBlur={handleBlur}
                          placeholder="Show"
                          isDisabled={isDisabled}
                        />
                      </div>

                      {/* Currency and FC Amount */}
                      <div className="col-12 col-sm-6 mb-45">
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
                            setHasShownModal(false);
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
                      {!!showChequeNumber && (
                        <div className="col-0 col-sm-6 mb-45" />
                      )}
                      {/* Debit Account Narration */}
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name="debitNarration"
                          label="Debit Account Narration"
                          type="textarea"
                          value={values.debitNarration}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Enter Debit Account Narration"
                          disabled={isDisabled}
                          error={
                            touched.debitNarration && errors.debitNarration
                          }
                        />
                      </div>

                      {/* Credit Account Narration */}
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name="creditNarration"
                          label="Credit Account Narration"
                          type="textarea"
                          value={values.creditNarration}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Enter Credit Account Narration"
                          disabled={isDisabled}
                          error={
                            touched.creditNarration && errors.creditNarration
                          }
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

                      {/* Attachments Display (following Receipt Voucher Edit pattern) */}
                      <div className="col-12 mb-3">
                        <FileDisplayList
                          files={addedAttachments}
                          onRemoveFile={handleRemoveAttachedFile}
                        />
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
                  <div className="col-0 col-xxl-2" />
                  {!isDisabled && (
                    <div className="col-12 col-lg-10 col-xl-9 col-xxl-3">
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
        loading={updateAccountToAccountMutation.isPending}
        onAttachmentClick={() => setShowAttachmentsModal(true)}
        lastVoucherNumbers={lastVoucherNumbers}
        setPageState={setPageState}
        setSearchTerm={setSearchTerm}
        setWriteTerm={setWriteTerm}
      />

      {/* Upload Attachements Modal */}
      <CustomModal
        show={showAttachmentsModal}
        close={() => setShowAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          showModal={showAttachmentsModal}
          closeModal={() => setShowAttachmentsModal(false)}
          item={accountToAccountData}
          deleteService={deleteAccountToAccountAttachment}
          uploadService={addAccountToAccountAttachment}
          getUploadedFiles={handleVoucherAttachmentsUpload}
          getDeletedAttachments={handleDeletedAttachments}
          currentFiles={currentFiles}
          setCurrentFiles={setCurrentFiles}
          closeUploader={() => setShowAttachmentsModal(false)}
          voucherAttachment={true}
          queryToInvalidate={['accountToAccount', searchTerm]}
        />
      </CustomModal>

      {/* Missing Currency Rate Modal (following Journal Voucher pattern) */}
      <CustomModal
        show={showMissingCurrencyRateModal}
        close={() => {
          setShowMissingCurrencyRateModal(false);
          setHasShownModal(false);
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
          // Save form data before navigation (following EditReceiptVoucher pattern)
          if (formikRef.current) {
            saveFormValues(formId, {
              values: formikRef.current.values,
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
          isEdit={true}
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

export default EditAccountToAccount;
