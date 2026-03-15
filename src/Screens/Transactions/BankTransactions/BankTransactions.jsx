import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import { useEffect, useRef, useState } from 'react';
import { FaMagnifyingGlass } from 'react-icons/fa6';
import Skeleton from 'react-loading-skeleton';
import { useLocation, useNavigate } from 'react-router-dom';
import AccountBalanceCard from '../../../Components/AccountBalanceCard/AccountBalanceCard.jsx';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import BackButton from '../../../Components/BackButton';
import ChartOfAccountForm from '../../../Components/ChartOfAccountForm/ChartOfAccountForm';
import CombinedInputs from '../../../Components/CombinedInputs/CombinedInputs.jsx';
import CustomButton from '../../../Components/CustomButton';
import CustomCheckbox from '../../../Components/CustomCheckbox/CustomCheckbox';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import ExchangeRatesCard from '../../../Components/ExchangeRatesCard/ExchangeRatesCard.jsx';
import FileDisplayList from '../../../Components/FileDisplayList/FileDisplayList.jsx';
import PartyLedgerForm from '../../../Components/PartyLedgerForm/PartyLedgerForm';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import WalkInCustomerForm from '../../../Components/WalkInCustomerForm/WalkInCustomerForm';
import withFilters from '../../../HOC/withFilters ';
import withModal from '../../../HOC/withModal';
import { useBanks } from '../../../Hooks/useBanks';
import useCurrencyRate from '../../../Hooks/useCurrencyRate.js';
import useModulePermissions from '../../../Hooks/useModulePermissions.js';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable.js';
import {
  getAccountBalances,
  getExchangeRates,
  pairReleased,
} from '../../../Services/General.js';
import {
  checkTransactionLockStatus,
  lockTransaction,
} from '../../../Services/Process/TransactionLock.js';
import {
  createBankTransaction,
  deleteAttachment,
  deleteBankTransaction,
  getBankTransactionChequeNumberByBank,
  getBankTransactionListing,
  getVoucherNumber,
  updateBankTransaction,
  uploadAttachment,
} from '../../../Services/Transaction/BankTransactions';
import { getAccountsbyType } from '../../../Services/Transaction/InternalPaymentVoucher';
import { getPaymentVoucherMode } from '../../../Services/Transaction/JournalVoucher';
import useFormStore from '../../../Stores/FormStore';
import useSettingsStore from '../../../Stores/SettingsStore';
import {
  depositTableHeaders,
  inwardTTTableHeaders,
  withdrawalTableHeaders,
} from '../../../Utils/Constants/TableHeaders';
import {
  formatDate,
  getCountryOptions,
  getCurrencyOptions,
  isNullOrEmpty,
  showErrorToast,
} from '../../../Utils/Utils';
import { formatNumberWithCommas } from '../../../Utils/Helpers.js';
import { Button } from 'react-bootstrap';

const BankTransactions = ({
  showModal,
  closeModal,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Bank Transactions');
  const queryClient = useQueryClient();
  const [isDisabled, setIsDisabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [writeTerm, setWriteTerm] = useState(''); // To Make search term only work on ButtonClick
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [currency, setCurrency] = useState('DHS');
  const [headerTransactionType, setHeaderTransactionType] = useState('deposit');
  const [uploadAttachmentsModal, setUploadAttachmentsModal] = useState(false);
  const [newlyCreatedAccount, setNewlyCreatedAccount] = useState(null);
  const [showAddLedgerModal, setShowAddLedgerModal] = useState('');
  const [showMissingCurrencyRateModal, setShowMissingCurrencyRateModal] =
    useState(false);
  const [currencyToSelect, setCurrencyToSelect] = useState(null);
  const [exchangeRatesInverse, setExchangeRatesInverse] = useState(false);
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState(null);
  const [selectedModeAccount, setSelectedModeAccount] = useState(null);
  const [selectedFromAccount, setSelectedFromAccount] = useState(null);
  const [selectedToAccount, setSelectedToAccount] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [formData, setFormData] = useState({});
  const [isEdit, setIsEdit] = useState(false);
  const [cheque, setCheque] = useState();

  const {
    getAccountBalanceSettings,
    updateAccountBalanceSetting,
    updatePrintSetting,
  } = useSettingsStore();

  // Add new state for showing the right cards
  const [showRightCards, setShowRightCards] = useState(false);

  // Add new states for inward TT specific fields
  const [selectedBank, setSelectedBank] = useState(null);
  const [transactionDetail, setTransactionDetail] = useState(null);
  // Add new state for ledger
  const [viewMode, setViewMode] = useState(false);

  const headerTransactionTypeValue =
    headerTransactionType === 'inward_tt' ? 'inward' : headerTransactionType;
  const { state } = useLocation();
  const [pageState, setPageState] = useState(state?.pageState || 'new');

  const getSearchPlaceholder = (type) => {
    switch (type) {
      case 'withdrawal':
        return 'Search BWV';
      case 'inward_tt':
        return 'Search BITTV';
      default:
        return 'Search BDV';
    }
  };

  const getLastNumberText = (type) => {
    switch (type) {
      case 'withdrawal':
        return 'Last BWV Number: ' + searchTerm;
      case 'inward_tt':
        return 'Last BITTV Number: ' + searchTerm;
      default:
        return 'Last BDV Number: ' + searchTerm;
    }
  };

  const getVoucherText = (type) => {
    switch (type) {
      case 'withdrawal':
        return 'Last BWV Number: ';
      case 'inward_tt':
        return 'Last BITTV Number: ';
      default:
        return 'Last BDV Number: ';
    }
  };

  const permissions = useModulePermissions('transactions', 'bank_transactions');
  const {
    edit: hasEditPermission,
    create: hasCreatePermission,
    delete: hasDeletePermission,
    print: hasPrintPermission,
    view: hasViewPermission,
  } = permissions || {};


  const [lastVoucherNumbers, setLastVoucherNumbers] = useState({
    heading: getVoucherText(headerTransactionType),
    current: '',
    previous: '',
    next: '',
    isLoadingVoucherNumber: false,
    isErrorVoucherNumber: false,
    errorVoucherNumber: null,
  });

  const {
    data: transactionDataRes,
    isFetching,
    isError,
    refetch: transactionSearchRefetch,
  } = useFetchTableData(
    ['transactionData', searchInput, date],
    {
      search: searchInput,
      transaction_type: headerTransactionTypeValue,
      date: date,
    },
    updatePagination,
    getBankTransactionListing,
    {
      enabled: false,
      staleTime: 1000 * 60 * 5,
    }
  );

  const activeTransaction = transactionDataRes?.data;

  // Get last voucher number //
  const {
    data: voucherNumber,
    isLoading: isLoadingVoucherNumber,
    isError: isErrorVoucherNumber,
    error: errorVoucherNumber,
  } = useQuery({
    queryKey: [
      'voucherNumber',
      searchTerm,
      headerTransactionTypeValue,
      searchInput,
      date,
    ],
    queryFn: () =>
      getVoucherNumber({
        voucher_no: searchTerm,
        transaction_type:
          headerTransactionTypeValue === 'inward_tt'
            ? 'inward'
            : headerTransactionTypeValue,
        date: date,
      }),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Check Transaction lock status to enable/disable
  const {
    isLoading: isLoadingLockStatus,
    isError: isErrorLockStatus,
    error: errorLockStatus,
  } = useQuery({
    queryKey: [
      'lock_status',
      transactionDetail?.voucher_type,
      transactionDetail?.id,
    ],
    queryFn: () =>
      checkTransactionLockStatus({
        transaction_type: transactionDetail?.voucher_type,
        transaction_id: transactionDetail?.id,
      }),
    enabled: !isNullOrEmpty(transactionDetail),
    retry: false,
  });

  useEffect(() => {
    if (errorLockStatus?.detail?.locked) {
      showToast(errorLockStatus?.message, 'warn');
    }
  }, [errorLockStatus]);

  // Lock Transaction on Edit
  const lockTransactionMutation = useMutation({
    mutationFn: lockTransaction,
  });

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
      getAccountBalanceSettings('bank_transaction'),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

  // Account balances for selected from account
  const { data: FromAccountBalance } = useQuery({
    queryKey: ['accountBalance', selectedFromAccount?.value],
    queryFn: () =>
      getAccountBalances(
        selectedFromAccount.value,
        selectedFromAccount.accountType
      ),
    enabled:
      !!selectedFromAccount?.value &&
      getAccountBalanceSettings('bank_transaction'),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

  // Account balances for selected to account
  const { data: ToAccountBalance } = useQuery({
    queryKey: ['accountBalance', selectedToAccount?.value],
    queryFn: () =>
      getAccountBalances(
        selectedToAccount.value,
        selectedToAccount.accountType
      ),
    enabled:
      !!selectedToAccount?.value &&
      getAccountBalanceSettings('bank_transaction'),
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
      getAccountBalanceSettings('bank_transaction'),
    staleTime: 1000 * 60 * 2,
  });

  // Fetch currency rate for the selected Currency
  const { data: currencyRate, isLoading: isLoadingCurrencyRate } =
    useCurrencyRate(selectedCurrency, date);

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

  useEffect(() => {
    setLastVoucherNumbers({
      heading: getVoucherText(headerTransactionType),
      last: voucherNumber?.default_voucher_no,
      current: voucherNumber?.current_voucher_no,
      previous: voucherNumber?.previous_voucher_no,
      next: voucherNumber?.next_voucher_no,
      isLoadingVoucherNumber: isLoadingVoucherNumber,
      isErrorVoucherNumber: isErrorVoucherNumber,
      errorVoucherNumber: errorVoucherNumber,
    });
  }, [
    voucherNumber,
    isLoadingVoucherNumber,
    isErrorVoucherNumber,
    errorVoucherNumber,
  ]);
  const currencyOptions = getCurrencyOptions();
  const countryOptions = getCountryOptions();

  const { bankOptions: banksList } = useBanks();

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

  const initialValues = {
    transaction_type: headerTransactionType,
    cheque_number: '',
    from_account_id: '',
    to_account_id: '',
    amount: '',
    currency: '', // Start with empty to trigger validation
    narration: '',
    ledger: '',
    bank: '',
    commissionType: '',
    commissionPercentage: '',
    commissionAmount: '',
    country: '',
    date: new Date().toLocaleDateString('en-CA'),
  };

  const formId = 'bank-transaction'; // Unique identifier for this form

  // Add formikRef near the top of the component
  const formikRef = useRef();

  const { getPrintSettings } = useSettingsStore();

  // Add new state for showing transaction details
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [addedAttachments, setAddedAttachments] = useState({});
  const [deletedAttachments, setDeletedAttachments] = useState([]); // Track IDs of attachments to delete
  const [currentFiles, setCurrentFiles] = useState([]); // Track current files for UI display
  const filesInitializedRef = useRef(false); // Track if files have been initialized
  const [hasShownModal, setHasShownModal] = useState(false);
  const [voucherActions, setVoucherActions] = useState(false);
  const [restoreValuesFromStore, setRestoreValuesFromStore] = useState(false);

  // Add these new states
  const [showDepositTable, setShowDepositTable] = useState(false);

  const [sortKey, setSortKey] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  // Add this handler function
  const handleSort = (key) => {
    setSortKey(key);
    setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
  };

  // Modify the New button click handler
  const handleNewClick = () => {
    // Preserve the current transaction type when creating new transaction
    const currentTransactionType = headerTransactionType;
    setPageState('new');
    setIsDisabled(false);
    setShowRightCards(false);
    setShowTransactionDetails(false);
    setShowDepositTable(false);
    setSearchTerm('');
    setSearchInput('');
    setWriteTerm('');
    setDate(new Date().toLocaleDateString('en-CA'));
    // Ensure transaction type is preserved after state changes
    setTimeout(() => {
      setHeaderTransactionType(currentTransactionType);
    }, 0);
  };


  // Formik submit handler
  const handleFormikSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      setAddedAttachments(addedAttachments || {});

      const accountKey =
        values.transaction_type === 'inward_tt'
          ? 'from_account_type'
          : 'from_account_id';

      let payload = {
        date: values.date || date,
        currency_id: values.currency,
        country_id: values.country,
        transaction_type:
          values.transaction_type === 'inward_tt'
            ? 'inward'
            : values.transaction_type,
        [accountKey]: values.from_account_id,
        ...(values.transaction_type === 'inward_tt' && {
          from_account_type: values.ledger,
        }),
        ...(values.transaction_type === 'inward_tt' && {
          from_account_id: values.from_account_id,
        }),
        to_account_id: values.to_account_id ?? null,
        bank_id: values.bank ?? null,
        cheque_number: values.cheque_number?.value
          ? values.cheque_number?.value
          : values.cheque_number,
        amount: parseFloat(values.amount),
        commission_type: values.commissionType ?? null,
        commission_percentage: values.commissionPercentage ?? null,
        commission_value: values.commissionAmount ?? null,
        narration: values.narration ?? null,
        ...(addedAttachments || {}),
      };

      // Include deleted attachments in payload if any
      if (deletedAttachments && deletedAttachments.length > 0) {
        deletedAttachments.forEach((attachmentId, index) => {
          payload[`deleted_attachments[${index}]`] = attachmentId;
        });
      }

      //for update
      if (searchInput > 0) {
        await updateBankTransactionMutation.mutateAsync({
          id: searchInput,
          formData: payload,
        });
        handlePairReleased();
        transactionSearchRefetch();
      } else {
        //for create
        handlePairReleased();
        await createBankTransactionMutation.mutateAsync(payload);
      }

      setIsEdit(false);
      setDate(new Date().toLocaleDateString('en-CA'));
    } catch (error) {
      showErrorToast(error)
      // Handle specific validation errors from backend
      if (error.response?.data?.errors && setErrors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      if (setSubmitting) {
        setSubmitting(false);
      }
    }
  };

  // Manual submit handler for buttons
  const handleSubmit = async () => {
    if (formikRef.current) {
      // Trigger Formik validation and submission
      formikRef.current.handleSubmit();
    }
  };

  const createBankTransactionMutation = useMutation({
    mutationFn: createBankTransaction,
    onSuccess: (data) => {
      showToast('Bank Transaction Created!', 'success');
      if (getPrintSettings('bank_transaction')) {
        if (data?.detail?.pdf_url) {
          window.open(data.detail.pdf_url, '_blank');
        }
      }
      queryClient.invalidateQueries(['bankTransactionListing', isEdit]);
      setAddedAttachments({}); // Clear attachments after successful submission
      // Preserve current transaction type when resetting
      const currentTransactionType = headerTransactionType;
      handleResetRows();
      // Restore transaction type after reset
      setTimeout(() => {
        setHeaderTransactionType(currentTransactionType);
      }, 0);
    },
    onError: (error) => {
      if (
        error.message == 'Bank Deposit Voucher limit reached for this branch.'
      ) {
        showModal(
          'Cannot Create',
          'The maximum number of BDV has been reached. To create new transactions, please increase the transaction number count in the Transaction Number Register.',
          () => closeModal(),
          'error'
        );
      } else if (
        error.message ==
        'Bank Withdrawal Voucher limit reached for this branch.'
      ) {
        showModal(
          'Cannot Create',
          'The maximum number of BWV has been reached. To create new transactions, please increase the transaction number count in the Transaction Number Register.',
          () => closeModal(),
          'error'
        );
      } else if (
        error.message == 'Bank Inward TT Voucher limit reached for this branch.'
      ) {
        showModal(
          'Cannot Create',
          'The maximum number of BITTV has been reached. To create new transactions, please increase the transaction number count in the Transaction Number Register.',
          () => closeModal(),
          'error'
        );
      } else {
        showErrorToast(error);
      }
      showErrorToast(error.message);
    },
  });

  const updateBankTransactionMutation = useMutation({
    // mutationFn: ({ searchTerm, formData }) => updateBankTransaction(searchTerm, formData),
    mutationFn: ({ id, formData }) => updateBankTransaction(id, formData),
    onSuccess: (data) => {
      showToast('Bank Transaction   Updated!', 'success');
      if (getPrintSettings('bank_transaction')) {
        if (data?.detail?.pdf_url) {
          window.open(data.detail.pdf_url, '_blank');
        }
      }
      queryClient.invalidateQueries([
        'bankTransaction',
        searchTerm,
        searchInput,
      ]);
      // Preserve current transaction type when changing page state
      const currentTransactionType = headerTransactionType;
      setPageState('view');
      // Ensure transaction type is preserved after state change
      setTimeout(() => {
        setHeaderTransactionType(currentTransactionType);
      }, 0);
      // Clear attachment tracking after successful update
      setAddedAttachments({});
      setDeletedAttachments([]);
      handleResetRows();
      transactionSearchRefetch();
    },
    onError: (error) => {
      showErrorToast(searchInput);
      showErrorToast(error.message);
    },
  });

  const handleResetRows = () => {
    setIsDisabled(true);
    if (formikRef.current) {
      // Preserve the current header transaction type before resetting
      const currentTransactionType = headerTransactionType;
      formikRef.current.resetForm();
      // Restore the transaction type after reset using headerTransactionType
      formikRef.current.setFieldValue('transaction_type', currentTransactionType);
    }
    // Clear saved form values when resetting
    clearFormValues(formId);
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
    // Preserve the current transaction type when canceling
    const currentTransactionType = headerTransactionType;
    handlePairReleased();

    // Check if we're in edit mode and should navigate to view
    if (pageState === 'edit' && searchInput) {
      // Navigate to view mode with the current transaction data
      setPageState('view');
      setIsDisabled(true);
      setShowRightCards(true);
      setShowTransactionDetails(true);
      setVoucherActions(true);

      // Reset form but keep transaction detail for view
      if (formikRef.current) {
        formikRef.current.resetForm();
        formikRef.current.setFieldValue('transaction_type', currentTransactionType);
      }

      // Clear attachment states but keep files for view
      setAddedAttachments({});
      setDeletedAttachments([]);
      filesInitializedRef.current = false;
      if (transactionDetail?.files) {
        setCurrentFiles(transactionDetail.files.filter(f => f != null));
      }
    } else {
      // Original cancel behavior for new mode or other cases
      if (formikRef.current) {
        formikRef.current.resetForm();
        formikRef.current.setFieldValue('transaction_type', currentTransactionType);
      }

      setIsDisabled(true);
      setShowRightCards(true);
      setVoucherActions(false);
      setTransactionDetail([]);
      setSearchInput('');
      setSearchTerm('');
      setWriteTerm('');
      setDate(new Date().toLocaleDateString('en-CA'));

      // Clear attachment states
      setAddedAttachments({});
      setDeletedAttachments([]);
      filesInitializedRef.current = false;
      if (transactionDetail?.files) {
        setCurrentFiles(transactionDetail.files.filter(f => f != null));
      }
    }

    // Ensure transaction type is preserved after state changes
    setTimeout(() => {
      setHeaderTransactionType(currentTransactionType);
    }, 0);
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
    setUploadAttachmentsModal(false);
  };

  // Handle attachment deletion in deferred mode
  const handleDeletedAttachments = (attachmentId) => {
    setDeletedAttachments((prev) => [...prev, attachmentId]);
    // Remove from current files display
    setCurrentFiles((prev) => prev.filter((f) => f && f.id !== attachmentId));
  };

  const navigate = useNavigate();

  // Handle search button click - only triggers search when button is clicked
  const handleSearchButtonClick = () => {
    setSearchTerm(writeTerm);
    if (writeTerm) {
      setSearchInput(writeTerm);
      setPageState("view");
      // For specific voucher search, show transaction details directly
      setShowDepositTable(false);
      setShowTransactionDetails(true);
      setCurrentTransaction(null);
      setIsDisabled(false);
      setVoucherActions(true);
      setShowRightCards(true);
    }
    else {
      setSearchInput('');
      setPageState("list");
      // For empty search, show table with all results
      setShowDepositTable(true);
      setShowTransactionDetails(false);
      setCurrentTransaction(null);
      setIsDisabled(true);
      setVoucherActions(false);
      setShowRightCards(false);
    }
    transactionSearchRefetch();
  };

  // Modify the search term onChange handler
  const handleSearchChange = () => {
    // This function is kept for compatibility but no longer triggers automatic search
    // Search is now only triggered by handleSearchButtonClick
  };

  // Notify parent of form data changes (for saving before navigation) - REMOVED to prevent auto-saving
  // useEffect(() => {
  //   if (formikRef.current) {
  //     setFormData({
  //       values: formikRef.current.values,
  //       addedAttachments,
  //     });
  //   }
  // }, [formikRef.current?.values, addedAttachments]);

  // Handle navigation from Rate of Exchange page
  useEffect(() => {
    const lastPage = getLastVisitedPage('bank-transaction');
    if (lastPage === 'rate-of-exchange') {
      const savedFormData = getFormValues('bank-transaction');
      if (savedFormData) {
        // Set page state to new and enable the table
        setPageState('new');
        setIsDisabled(false);
        setRestoreValuesFromStore(true);
      }
    }
  }, []);

  // Restore form data from store for Rate of Exchange flow
  useEffect(() => {
    if (restoreValuesFromStore) {
      const savedFormData = getFormValues('bank-transaction');
      if (savedFormData && formikRef.current) {
        // Restore form values
        formikRef.current.setValues(savedFormData.values || {});
        setAddedAttachments(savedFormData.addedAttachments || {});

        // Restore the selected date from saved form data
        if (savedFormData.date) {
          setDate(savedFormData.date);
        }

        // Restore selected currency if available
        if (savedFormData.values?.currency) {
          setSelectedCurrency(savedFormData.values.currency);
        }

        setIsDisabled(false);
        clearFormValues(formId);
        clearLastVisitedPage(formId);
        clearLastVisitedPage('bank-transaction');
        setRestoreValuesFromStore(false);
      }
    }
  }, [restoreValuesFromStore]);

  // Trigger validation when ledger field changes for inward_tt
  useEffect(() => {
    if (formikRef.current && formikRef.current.values) {
      const { transaction_type, ledger } = formikRef.current.values;

      // If transaction type is inward_tt and ledger has a value, trigger validation
      if (transaction_type === 'inward_tt' && ledger) {
        // Trigger validation for from_account_id field
        formikRef.current.setFieldTouched('from_account_id', true);
      }
    }
  }, [formikRef.current?.values?.ledger]);

  // Check for missing currency rate only after loading is complete
  useEffect(() => {
    if (
      date &&
      selectedCurrency &&
      currencyRate && // Ensure currencyRate has loaded
      !currencyRate?.rate && // Check if rate is missing
      !hasShownModal &&
      !isLoadingCurrencyRate // Ensure loading is complete
    ) {
      // Check if we're in New or Edit mode
      if (pageState === 'new' || pageState === 'edit') {
        // Save current form state before showing modal - ONLY if formikRef is available
        if (formikRef.current) {
          const currentFormValues = formikRef.current.values;
          setFormData({
            values: currentFormValues,
            addedAttachments,
          });
        }

        // Show Missing Rate of Exchange modal instead of auto-redirect
        if (formikRef.current) {
          formikRef.current.setFieldValue('currency', '');
        }
        setCurrencyToSelect(selectedCurrency);
        setShowMissingCurrencyRateModal(true);
        setHasShownModal(true);
      }
    }
  }, [date, selectedCurrency, currencyRate, pageState, hasShownModal, isLoadingCurrencyRate]);

  useEffect(() => {
    if (
      selectedCurrency &&
      currencyRate && // Ensure currencyRate has loaded
      !currencyRate?.rate && // Check if rate is missing
      !hasShownModal &&
      !isLoadingCurrencyRate // Ensure loading is complete
    ) {
      // Only show modal if not in New or Edit mode (to avoid conflict with auto-redirect)
      if (pageState !== 'new' && pageState !== 'edit') {
        if (formikRef.current) {
          formikRef.current.setFieldValue('currency', '');
        }
        setCurrencyToSelect(selectedCurrency);
        setShowMissingCurrencyRateModal(true);
        setHasShownModal(true);
      }
    }
  }, [selectedCurrency, currencyRate, pageState, hasShownModal, isLoadingCurrencyRate]);

  useEffect(() => {
    if (searchTerm) {
      setSearchInput(searchTerm);
      // Also update writeTerm to keep input in sync when searchTerm is set from external sources
      setWriteTerm(searchTerm);
      // Trigger search refetch when searchTerm is set from voucher navigation
      transactionSearchRefetch();
      // For specific voucher search, show transaction details directly
      setShowDepositTable(false);
      setShowTransactionDetails(true);
      setCurrentTransaction(null);
      setIsDisabled(false);
      setVoucherActions(true);
      setShowRightCards(true);
      setPageState("view");
    }
  }, [searchTerm]);

  useEffect(() => {
    if (searchInput) {
      setSearchTerm(searchInput);
    }
  }, [searchInput]);

  useEffect(() => {
    transactionSearchRefetch();
  }, [date]);

  useEffect(() => {
    // Only reset edit state if we're not in edit mode
    if (pageState !== 'edit') {
      setIsEdit(false);
    }
    if (searchInput) {
      setVoucherActions(true);
    }
    if (searchInput === '') {
      setVoucherActions(false);
      // Only disable if we're not in edit or new mode
      if (pageState !== 'edit' && pageState !== 'new') {
        setIsDisabled(true);
      }
    }
  }, [searchInput, pageState]);


  useEffect(() => {
    if (transactionDataRes) {
      setTransactionDetail(() => {
        return (
          transactionDataRes?.data?.find((item) => {
            const itemVoucherNo =
              item?.voucher?.voucher_no ??
              item?.voucher_no ??
              item?.voucher?.voucher_no;
            return String(itemVoucherNo) === String(searchInput);
          }) || null
        );
      });
    }
  }, [searchInput, transactionDataRes, isEdit]);

  // Initialize current files when transaction detail loads
  useEffect(() => {
    if (transactionDetail?.files && !filesInitializedRef.current) {
      setCurrentFiles(transactionDetail.files.filter(f => f != null));
      filesInitializedRef.current = true;
    }
  }, [transactionDetail]);

  useEffect(() => {
    if (headerTransactionType) transactionSearchRefetch();
  }, [headerTransactionType]);

  // Sync searchInput with searchTerm when navigation occurs
  useEffect(() => {
    if (searchTerm && searchTerm !== searchInput) {
      setSearchInput(searchTerm);
    }
  }, [searchTerm]);

  // Fetch transaction data when searchInput changes
  useEffect(() => {
    if (searchInput) {
      transactionSearchRefetch();
    }
  }, [searchInput]);

  useEffect(() => {
    if (headerTransactionTypeValue) {
    }
  }, [headerTransactionTypeValue, activeTransaction]);

  // Synchronize form transaction_type with headerTransactionType when pageState changes
  useEffect(() => {
    if (formikRef.current && pageState === 'list') {
      // Ensure the form's transaction_type matches the header transaction type
      if (formikRef.current.values.transaction_type !== headerTransactionType) {
        formikRef.current.setFieldValue('transaction_type', headerTransactionType);
      }
    }
  }, [pageState, headerTransactionType]);

  const getAccountsByTypeMode = (mode) => {
    if (!mode) {
      return [{ label: 'Select Mode', value: null, isDisabled: true }];
    }

    mode = 'bank_cash';

    if (mode === 'bank_cash') {
      const banks = modesData.bank;
      const cash = modesData.cash;

      if (banks.loading || cash.loading) {
        return [{ label: 'Loading...', value: null, isDisabled: true }];
      }

      if (banks.error || cash.error) {
        console.error(
          'Unable to fetch Bank/Cash Mode',
          banks.errorMessage || cash.errorMessage
        );
        return [{ label: 'Unable to fetch Bank/Cash Mode', value: null }];
      }

      const merged = [...(banks.data || []), ...(cash.data || [])];

      return merged.map((x) => ({
        value: x?.id,
        label: x?.account_name,
      }));
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

  const getAccountsByTypeOptions = (accountType) => {
    if (!accountType) {
      return [{ label: 'Select Ledger', value: null, isDisabled: true }];
    }

    const { data, loading, error, errorMessage } =
      accountData[accountType] || {};

    if (loading) {
      return [{ label: 'Loading...', value: null, isDisabled: true }];
    }

    if (error) {
      return [{ label: 'Unable to fetch Accounts', value: null }];
    }
    let options =
      data?.map((x) => ({
        value: x?.id,
        label: x?.title,
      })) || [];
    switch (accountType) {
      case 'party':
        options.push({
          label: `Add New PL`,
          value: null,
        });
        break;
      case 'general':
        options.push({
          label: `Add New GL`,
          value: null,
        });
        break;
      case 'walkin':
        options.push({
          label: `Add New WIC`,
          value: null,
        });
        break;
      default:
        break;
    }
    return options;
  };

  // Get account options //
  const {
    data: partyAccounts,
    isLoading: isLoadingParty,
    isError: isErrorParty,
    error: errorParty,
  } = useQuery({
    queryKey: ['accounts', 'party'],
    queryFn: () => getAccountsbyType('party'),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: generalAccounts,
    isLoading: isLoadingGeneral,
    isError: isErrorGeneral,
    error: errorGeneral,
  } = useQuery({
    queryKey: ['accounts', 'general'],
    queryFn: () => getAccountsbyType('general'),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: walkinAccounts,
    isLoading: isLoadingWalkin,
    isError: isErrorWalkin,
    error: errorWalkin,
  } = useQuery({
    queryKey: ['accounts', 'walkin'],
    queryFn: () => getAccountsbyType('walkin'),
    staleTime: 1000 * 60 * 5,
  });

  const accountData = {
    party: {
      data: partyAccounts,
      loading: isLoadingParty,
      error: isErrorParty,
      errorMessage: errorParty,
    },
    general: {
      data: generalAccounts,
      loading: isLoadingGeneral,
      error: isErrorGeneral,
      errorMessage: errorGeneral,
    },
    walkin: {
      data: walkinAccounts,
      loading: isLoadingWalkin,
      error: isErrorWalkin,
      errorMessage: errorWalkin,
    },
  };

  // get modes

  const {
    data: modeBank,
    isLoading: isLoadingBank,
    isError: isErrorBank,
    error: errorBank,
  } = useQuery({
    queryKey: ['type', 'Bank'],
    queryFn: () => getPaymentVoucherMode('Bank'),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: modeCash,
    isLoading: isLoadingCash,
    isError: isErrorCash,
    error: errorCash,
  } = useQuery({
    queryKey: ['type', 'Cash'],
    queryFn: () => getPaymentVoucherMode('Cash'),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: modePdc,
    isLoading: isLoadingPdc,
    isError: isErrorPdc,
    error: errorPdc,
  } = useQuery({
    queryKey: ['type', 'Pdc'],
    queryFn: () => getPaymentVoucherMode('Pdc'),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: modeOnline,
    isLoading: isLoadingOnline,
    isError: isErrorOnline,
    error: errorOnline,
  } = useQuery({
    queryKey: ['type', 'Online'],
    queryFn: () => getPaymentVoucherMode('Online'),
    staleTime: 1000 * 60 * 5,
  });

  const modesData = {
    bank: {
      data: modeBank,
      loading: isLoadingBank,
      error: isErrorBank,
      errorMessage: errorBank,
    },
    cash: {
      data: modeCash,
      loading: isLoadingBank,
      error: isErrorBank,
      errorMessage: errorBank,
    },
    pdc: {
      data: modePdc,
      loading: isLoadingPdc,
      error: isErrorPdc,
      errorMessage: errorPdc,
    },
    online: {
      data: modeOnline,
      loading: isLoadingOnline,
      error: isErrorOnline,
      errorMessage: errorOnline,
    },
  };

  // Check if cheque field should be enabled
  const isChequeFieldEnabled = () => {
    // Only enable for withdrawal or deposit transaction types
    if (!['withdrawal', 'deposit'].includes(headerTransactionType)) {
      return false;
    }
    // Only enable when from account is selected and is a bank type
    if (!selectedFromAccount?.value || selectedFromAccount?.accountType !== 'general') {
      return false;
    }
    // Check if the selected from account is a bank (from bank modes)
    const isBankAccount = modesData.bank.data?.some(
      bank => bank.id === selectedFromAccount.value
    );
    return isBankAccount;
  };

  // Enhanced cheque field visibility check that persists across state changes
  const shouldShowChequeField = () => {
    // Base condition: only for withdrawal or deposit
    if (!['withdrawal', 'deposit'].includes(headerTransactionType)) {
      return false;
    }

    // Check form values for from_account_id
    const fromAccountId = formikRef.current?.values?.from_account_id;
    if (!fromAccountId) {
      return false;
    }

    // Check if the from account is a bank account
    const isBankAccount = modesData.bank.data?.some(
      bank => bank.id === fromAccountId
    );

    return isBankAccount;
  };

  const {
    data: modeCheques,
    isLoading: isLoadingCheques,
    isError: isErrorCheques,
    error: errorCheques,
  } = useQuery({
    queryKey: ['bank_id', selectedBank],
    queryFn: () => getBankTransactionChequeNumberByBank(selectedBank),
    staleTime: 1000 * 60 * 5,
    enabled: !!selectedBank && isChequeFieldEnabled(),
    retry: (failureCount, error) => {
      // Don't retry if the error is "No Cheque Found"
      if (error?.message === 'No Cheque Found') {
        return false;
      }
      return failureCount < 2;
    },
    onError: (error) => {
      // Only log error if it's not the "No Cheque Found" message
      if (error?.message !== 'No Cheque Found') {
        console.error('Error fetching cheques:', error);
      }
    },
  });

  const chequeOptions =
    (Array.isArray(modeCheques) ? modeCheques : []).map((cheque) => ({
      label: cheque.cheque_number,
      value: cheque.id,
    })) || [];

  useEffect(() => {
    modeCheques;
  }, [modeCheques]);

  useEffect(() => {
    if (formData?.values?.from_account_id) {
      setSelectedBank(formData?.values?.from_account_id);
    }
  }, [formData?.values?.from_account_id]); // Only trigger when from_account_id changes

  // Update selectedBank when from account changes and is a bank account
  useEffect(() => {
    if (selectedFromAccount?.value && selectedFromAccount?.accountType === 'general') {
      const isBankAccount = modesData.bank.data?.some(
        bank => bank.id === selectedFromAccount.value
      );
      if (isBankAccount) {
        setSelectedBank(selectedFromAccount.value);
      } else {
        setSelectedBank(null);
        // Clear cheque number if from account is not a bank
        if (formikRef.current) {
          formikRef.current.setFieldValue('cheque_number', '');
        }
      }
    } else {
      setSelectedBank(null);
      // Clear cheque number if from account is not set or not a bank
      if (formikRef.current) {
        formikRef.current.setFieldValue('cheque_number', '');
      }
    }
  }, [selectedFromAccount, modesData.bank.data]);

  // Clear cheque number when transaction type changes to non-supported type
  useEffect(() => {
    if (!['withdrawal', 'deposit'].includes(headerTransactionType) && formikRef.current) {
      formikRef.current.setFieldValue('cheque_number', '');
    }
  }, [headerTransactionType]);

  // Modify the form content based on transaction type
  const renderFormContent = ({
    values,
    errors,
    touched,
    handleChange,
    onChange,
    handleBlur,
    setFieldValue,
    setFieldTouched,
  }) => {
    useEffect(() => {
      const amount = parseFloat(values.amount);
      const percentage = parseFloat(values.commissionPercentage);

      if (!isNaN(amount) && !isNaN(percentage)) {
        const commission = (amount * percentage) / 100;
        setFieldValue('commissionAmount', commission.toFixed(2));
      } else {
        setFieldValue('commissionAmount', '');
      }
    }, [values.amount, values.commissionPercentage, setFieldValue]);

    if (values.transaction_type === 'inward_tt') {
      return (
        <div className="col-12 col-lg-10 col-xl-9 col-xxl-9">
          {/* Transaction Type and Bank */}
          <div className="row">
            <div className="col-12 col-sm-6 mb-45">
              <SearchableSelect
                label="Transaction Type"
                name="transaction_type"
                options={[
                  { label: 'Deposit', value: 'deposit' },
                  { label: 'Inward TT', value: 'inward_tt' },
                  { label: 'Withdrawal', value: 'withdrawal' },
                ]}
                value={values.transaction_type}
                onChange={(selected) => {
                  setFieldValue('transaction_type', selected.value);
                  setHeaderTransactionType(selected.value);
                  // Reset all account selections when transaction type changes
                  setSelectedLedgerAccount(null);
                  setSelectedFromAccount(null);
                  setSelectedToAccount(null);
                  setSelectedModeAccount(null);
                  // Clear form fields
                  setFieldValue('from_account_id', '');
                  setFieldValue('to_account_id', '');
                }}
                placeholder="Select Transaction Type"
                isDisabled={isDisabled}
                error={touched.transaction_type && errors.transaction_type}
              />
            </div>
            <div className="col-12 col-sm-6 mb-45">
              <SearchableSelect
                label="Bank"
                name="bank"
                options={banksList}
                value={values.bank}
                onChange={(selected) => {
                  setFieldValue('bank', selected.value);
                }}
                placeholder="Select Bank"
                isDisabled={isDisabled}
                error={touched.bank && errors.bank}
              />
            </div>

            {/* Ledger Field */}
            <div className="col-12 col-sm-6 mb-45">
              <CombinedInputs
                label="From Account"
                type1="select"
                type2="select"
                name1="ledger"
                name2="from_account_id"
                value1={values.ledger}
                value2={values.from_account_id}
                options1={[
                  { label: 'PL', value: 'party' },
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
                  if (selected.label?.toLowerCase()?.startsWith('add new')) {
                    setShowAddLedgerModal(selected.label?.toLowerCase());
                  } else {
                    setFieldValue('ledger', selected.value);
                    setSelectedLedgerAccount(null);
                    setFieldValue('from_account_id', '');
                    // Trigger validation immediately
                    setFieldTouched('ledger', true);
                    setFieldTouched('from_account_id', true);
                  }
                }}
                onBlur1={() => {
                  setFieldTouched('ledger', true);
                  setFieldTouched('from_account_id', true);
                }}
                onChange2={(selected) => {
                  if (selected.label?.toLowerCase()?.startsWith('add new')) {
                    setShowAddLedgerModal(selected.label?.toLowerCase());
                  } else if (selected && selected.value) {
                    setFieldValue('from_account_id', selected.value);
                    setSelectedLedgerAccount({
                      value: selected.value,
                      label: selected.label,
                      accountType: values.ledger,
                    });
                  } else {
                    // Handle deselection
                    setFieldValue('from_account_id', '');
                    setSelectedLedgerAccount(null);
                  }
                }}
              />
              <ErrorMessage
                name="ledger"
                component="div"
                className="input-error-message text-danger"
              />
              <ErrorMessage
                name="from_account_id"
                component="div"
                className="input-error-message text-danger"
              />
            </div>

            {/* Currency and Amount Field */}
            <div className="col-12 col-sm-6 mb-45">
              <CombinedInputs
                label="Amount"
                type1="select"
                type2="number"
                name1="currency"
                name2="amount"
                value1={values.currency}
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
                  setFieldValue('currency', selected.value);
                }}
                onBlur1={() => {
                  setFieldTouched('currency', true);
                }}
                onChange2={(e) => {
                  handleChange(e);
                }}
                onBlur2={(e) => {
                  handleBlur(e);
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
                name="amount"
                component="div"
                className="input-error-message text-danger"
              />
            </div>

            <div className="col-12 col-sm-6 mb-45">
              <SearchableSelect
                label="Comm Type"
                name="commissionType"
                options={[
                  { label: 'Commission Income', value: 'income' },
                  { label: 'Commission Expense', value: 'expense' },
                  ...(values.commissionType ? [{
                    label: 'Add New Remove Commission Type',
                    value: '',
                    displayLabel: 'Remove Commission Type', // Custom display label
                  }] : []),
                ]}
                value={values.commissionType}
                onChange={(selected) => {
                  // Handle "Remove Commission Type" option
                  if (
                    selected.label
                      ?.toLowerCase()
                      ?.startsWith('add new remove commission type')
                  ) {
                    setFieldValue('commissionType', '');
                    // Clear commission fields
                    setFieldValue('commissionPercentage', '');
                    setFieldValue('commissionAmount', '');

                    // Recalculate net received amount based on original amount
                    const amount = parseFloat(values.amount || 0);
                    setFieldValue('net_total', amount);
                  } else {
                    // Allow normal selection
                    setFieldValue('commissionType', selected.value);
                  }
                }}
                placeholder="Commission Income"
                isDisabled={isDisabled}
                error={touched.commissionType && errors.commissionType}
                formatOptionLabel={(option) => {
                  // Use displayLabel if available, otherwise use label
                  return option.displayLabel || option.label;
                }}
              />
            </div>
            <div className="col-12 col-sm-6 mb-45">
              <CustomInput
                label="Commission %"
                name="commissionPercentage"
                type="number"
                placeholder="Enter commission %"
                value={values.commissionPercentage}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isDisabled}
                max={100}
                rightText="%"
                error={
                  touched.commissionPercentage && errors.commissionPercentage
                }
                style={{ marginBottom: 0 }}
              />
            </div>
            <div className="col-12 col-sm-6 mb-45">
              <CustomInput
                label="Commission"
                name="commissionAmount"
                type="number"
                value={values.commissionAmount}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={true}
                error={touched.commissionAmount && errors.commissionAmount}
                style={{ marginBottom: 0 }}
              />
            </div>
            <div className="col-12 col-sm-6 mb-45">
              <SearchableSelect
                label="Country"
                name="country"
                options={countryOptions}
                value={values.country}
                onChange={(selected) =>
                  setFieldValue('country', selected.value)
                }
                placeholder="Select Country"
                isDisabled={isDisabled}
              />
            </div>
          </div>
          {/* Narration */}
          <div>
            <label>Narration</label>
            <CustomInput
              name="narration"
              type="textarea"
              placeholder="Enter Narration"
              value={values.narration}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isDisabled}
            />
          </div>

          {/* File Attachments */}
          {(pageState === 'new' || pageState === 'edit') && (
            <div className="col-12 mb-3">
              <FileDisplayList
                files={addedAttachments}
                onRemoveFile={handleRemoveAttachedFile}
              />
            </div>
          )}
        </div>
      );
    }

    // Regular deposit/withdrawal form
    return (
      <div className="col-12 col-lg-10 col-xl-9 col-xxl-9">
        {/* Transaction Type and Cheque Number */}
        <div className="row">
          <div className="col-12 col-sm-6 mb-45">
            <SearchableSelect
              label="Transaction Type"
              name="transaction_type"
              options={[
                { label: 'Deposit', value: 'deposit' },
                { label: 'Inward TT', value: 'inward_tt' },
                { label: 'Withdrawal', value: 'withdrawal' },
              ]}
              value={values.transaction_type}
              onChange={(selected) => {
                setFieldValue('transaction_type', selected.value);
                setHeaderTransactionType(selected.value);
                // Reset all account selections when transaction type changes
                setSelectedLedgerAccount(null);
                setSelectedFromAccount(null);
                setSelectedToAccount(null);
                setSelectedModeAccount(null);
                // Clear form fields
                setFieldValue('from_account_id', '');
                setFieldValue('to_account_id', '');
              }}
              placeholder="Select Transaction Type"
              isDisabled={isDisabled}
              error={touched.transaction_type && errors.transaction_type}
            />
          </div>
          <div className="col-12 mb-45">
            <div className="d-flex gap-3 flex-md-nowrap flex-wrap">
              <div style={{ width: '100%' }}>
                <SearchableSelect
                  name="from_account_id"
                  label="From Account"
                  options={getAccountsByTypeMode('bank_cash')}
                  value={values.from_account_id}
                  onChange={(selected) => {
                    if (selected && selected.value) {
                      setFieldValue('from_account_id', selected.value);
                      setSelectedFromAccount({
                        value: selected.value,
                        label: selected.label,
                        accountType: 'general',
                      });
                    } else {
                      // Handle deselection
                      setFieldValue('from_account_id', '');
                      setSelectedFromAccount(null);
                    }
                    setCheque();
                  }}
                  placeholder="Select From Account"
                  isDisabled={isDisabled}
                  error={touched.from_account_id && errors.from_account_id}
                />
              </div>
              <div style={{ width: '100%' }}>
                <SearchableSelect
                  label="To Account"
                  name="to_account_id"
                  options={getAccountsByTypeMode('bank_cash')?.filter(
                    (item) => item?.value !== values?.from_account_id
                  )}
                  value={values.to_account_id}
                  onChange={(selected) => {
                    if (selected && selected.value) {
                      setFieldValue('to_account_id', selected.value);
                      setSelectedToAccount({
                        value: selected.value,
                        label: selected.label,
                        accountType: 'general',
                      });
                    } else {
                      // Handle deselection
                      setFieldValue('to_account_id', '');
                      setSelectedToAccount(null);
                    }
                  }}
                  placeholder="Select To Account"
                  isDisabled={isDisabled}
                  error={touched.to_account_id && errors.to_account_id}
                />
              </div>
              <div className="flex-shrink-0 d-flex align-items-end">
                <CustomButton
                  text="Switch Account"
                  type="button"
                  onClick={() => {
                    const tempFrom = values.from_account_id;

                    // swap formik values
                    setFieldValue('from_account_id', values.to_account_id);
                    setFieldValue('to_account_id', tempFrom);

                    // swap selected bank if it matches
                    setSelectedBank((prev) => {
                      if (prev === values?.from_account_id) {
                        return values?.to_account_id;
                      } else {
                        return values?.from_account_id;
                      }
                    });

                    // Account swapping handled by Formik field values

                    // swap the selected account objects that drive the right-side cards
                    setSelectedFromAccount((prevFrom) => {
                      // if we have a selectedToAccount, make it the new from
                      if (selectedToAccount) return selectedToAccount;
                      // otherwise build a minimal object from the new value
                      return values.to_account_id
                        ? {
                          value: values.to_account_id,
                          label: '',
                          accountType: 'general',
                        }
                        : null;
                    });

                    setSelectedToAccount((prevTo) => {
                      if (selectedFromAccount) return selectedFromAccount;
                      return tempFrom
                        ? { value: tempFrom, label: '', accountType: 'general' }
                        : null;
                    });

                    // Clear cheque number when switching accounts to avoid data inconsistency
                    setFieldValue('cheque_number', '');
                    setCheque(null);
                  }}
                  disabled={isDisabled}
                />
              </div>
            </div>
          </div>
          {shouldShowChequeField() && (
            <div className="col-12 col-sm-6 mb-45">
              <SearchableSelect
                label="Cheque Number"
                name="cheque_number"
                options={cheque ? [...chequeOptions, cheque] : chequeOptions}
                value={
                  values.cheque_number
                    ? chequeOptions.find(
                      (option) => option.value === values.cheque_number
                    ) || values.cheque_number
                    : ''
                }
                onChange={(selected) =>
                  setFieldValue('cheque_number', selected.value)
                }
                placeholder="Select Cheque Number"
                isDisabled={isDisabled}
                error={touched.cheque_number && errors.cheque_number}
              />
            </div>
          )}
          {/* Currency and Amount Field */}
          <div className="col-12 col-sm-6 mb-45">
            <CombinedInputs
              label="Amount"
              type1="select"
              type2="number"
              name1="currency"
              name2="amount"
              value1={values.currency}
              value2={values.amount}
              options1={currencyOptions}
              isDisabled={isDisabled}
              handleBlur={handleBlur}
              placeholder1="currency"
              placeholder2="Enter Amount"
              inputType2="number"
              className1="currency"
              className2="amount"
              onChange1={(selected) => {
                setSelectedCurrency(selected.value);
                setHasShownModal(false);
                setFieldValue('currency', selected.value);
              }}
              onChange2={(e) => {
                handleChange(e);
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
              name="amount"
              component="div"
              className="input-error-message text-danger"
            />
          </div>
        </div>


        {/* Narration */}
        <div>
          <label>Narration</label>
          <CustomInput
            name="narration"
            type="textarea"
            placeholder="Enter Narration"
            value={values.narration}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isDisabled}
          />
        </div>

        {/* File Attachments */}
        {(pageState === 'new' || pageState === 'edit') && (
          <div className="col-12 mb-3">
            <FileDisplayList
              files={addedAttachments}
              onRemoveFile={handleRemoveAttachedFile}
            />
          </div>
        )}
      </div>
    );
  };

  const handleDelete = () => {
    showModal(
      'Delete',
      `Are you sure you want to delete ${getLastNumberText(
        headerTransactionType
      )}?`,
      () => {
        if (currentTransaction) {
          var type =
            currentTransaction?.bank_transaction_vouchers?.transaction_type?.toLowerCase();

          deleteBankTransactionMutation.mutate({
            id: currentTransaction?.bank_transaction_vouchers?.voucher
              ?.voucher_no,
            transaction_type: type,
          });
        }
      }
    );
  };
  const handlePrint = () => {
    if (currentTransaction?.pdf_url)
      window.open(currentTransaction?.pdf_url, '_blank');
  };

  const handleEdit = () => {
    lockTransactionMutation.mutate({
      transaction_type: transactionDetail?.voucher_type,
      transaction_id: transactionDetail?.id,
    });
    setPageState('edit');
    setIsEdit(true);

    // Format the transaction data
    const formatted = {
      transaction_type: headerTransactionType,
      // cheque_number: parseInt(currentTransaction?.bank_transaction_vouchers?.cheque) || '',
      cheque_number:
        currentTransaction?.bank_transaction_vouchers?.cheque?.id || '',
      from_account_id:
        currentTransaction?.bank_transaction_vouchers?.from_account_details
          ?.id || '',
      fromAccountType:
        currentTransaction?.bank_transaction_vouchers?.from_account_type || '',
      to_account_id:
        currentTransaction?.bank_transaction_vouchers?.to_account_details?.id ||
        '',
      amount: currentTransaction?.bank_transaction_vouchers?.amount || '',
      currency: currentTransaction?.bank_transaction_vouchers?.currency?.id, //parseInt(transactionDetail.currency?.id),
      narration: currentTransaction?.bank_transaction_vouchers?.narration || '',
      date:
        currentTransaction?.bank_transaction_vouchers?.date ||
        new Date().toLocaleDateString('en-CA'),
      bank:
        parseInt(currentTransaction?.bank_transaction_vouchers?.bank_id) || '',
      commissionType:
        currentTransaction?.bank_transaction_vouchers?.commission_type || '',
      commissionPercentage:
        currentTransaction?.bank_transaction_vouchers?.commission_percentage ||
        '',
      commissionAmount:
        currentTransaction?.bank_transaction_vouchers?.commission_value || '',
      country: currentTransaction?.bank_transaction_vouchers?.country_id || '',
      ledger:
        currentTransaction?.bank_transaction_vouchers?.from_account_type || '',
    };

    // Update header transaction type and date
    setHeaderTransactionType(formatted.transaction_type);
    setCurrency(formatted.currency);
    setDate(formatted.date);
    setCheque({
      label:
        currentTransaction?.bank_transaction_vouchers?.cheque?.cheque_number,
      value: currentTransaction?.bank_transaction_vouchers?.cheque?.id,
    });

    // Reset Formik form
    setFormattedTransaction(formatted); // ✅ triggers useEffect to apply

    // if (formikRef.current) {
    //   formikRef.current.setValues(formatted );
    // }

    // Update UI state
    setIsDisabled(false);
    setShowTransactionDetails(false);
    setShowRightCards(true);
  };

  // Mutation for delete
  const deleteBankTransactionMutation = useMutation({
    mutationFn: ({ id, transaction_type }) =>
      deleteBankTransaction(id, transaction_type),

    onSuccess: (_data, variables) => {
      const { transaction_type, id } = variables; // ✅ Access transaction_type and id safely

      showToast('Bank Transaction deleted successfully!', 'success');
      // Invalidate the correct transaction data query
      queryClient.invalidateQueries(['transactionData', searchInput, date]);
      queryClient.invalidateQueries(['voucherNumber', searchTerm]);
      queryClient.invalidateQueries(['voucherNumber', id]);
      queryClient.invalidateQueries(['voucherNumber', '']);
      
      // Refetch data to ensure proper refresh
      transactionSearchRefetch();

      setPageState('new'); // Same as Receipt Voucher
      setHeaderTransactionType(transaction_type);
      setSearchTerm('');
      setSearchInput('');
      setCurrentTransaction(null); // Clear any stale transaction data
      setShowDepositTable(false); // Hide the transaction table
      setShowTransactionDetails(false); // Hide transaction details
      setIsDisabled(true); // Show disabled page
      closeModal(); // Close modal to stop loading state
    },

    onError: (error) => {
      showErrorToast(error);
      closeModal(); // Close modal to stop loading state
    },
  });

  // Mutation for attachment delete
  const deleteAttachmentMutation = useMutation({
    mutationFn: ({ id }) => deleteAttachment(id),
    onSuccess: () => {
      showToast('Attachment deleted successfully!', 'success');
      queryClient.invalidateQueries(['bankTransaction', searchTerm]);

      setSearchTerm('');
      setShowDepositTable(true);
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  const [formattedTransaction, setFormattedTransaction] = useState(null);

  useEffect(() => {
    if (formikRef.current && formattedTransaction) {
      formikRef.current.setValues(formattedTransaction);
      setFormattedTransaction(null);
    }
  }, [formikRef.current, formattedTransaction]);

  useEffect(() => {
    if (pageState === "view") {
      setViewMode(true)
    }
    else { setViewMode(false) }

  }, [pageState])

  // Update currentTransaction when activeTransaction or searchTerm changes
  useEffect(() => {
    setCurrentTransaction(() => {
      return (
        activeTransaction?.find((item) => item?.voucher_no === searchTerm) ||
        null
      );
    });
  }, [activeTransaction, searchTerm]);

  // Update TransactionDetails component
  const TransactionDetails = () => {

    // if (loading
    if (isFetching)
      return (
        <div className="row mb-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="col-12 col-sm-6 mb-3 align-items-center"
              style={{ height: 90 }}
            >
              <Skeleton
                style={{ marginTop: 28 }}
                duration={1}
                width={'50%'}
                baseColor="#ddd"
                height={43}
              />
            </div>
          ))}
        </div>
      );

    if (!transactionDetail) return <div className="text-center">No Data Found!</div>;


    if (!hasViewPermission) {
      return (
        <p className="text-danger text-center align-self-center m-0 p-0">You are not authorized to view this bank transaction voucher</p>
      );
    }

    if (headerTransactionType === 'inward_tt') {
      return (
        <div className="transaction-details">
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="text-muted">Transaction Type</label>
                <p className="mb-0">
                  {
                    transactionDetail?.bank_transaction_vouchers
                      ?.transaction_type
                  }
                </p>
              </div>
              <div className="mb-3">
                <label className="text-muted">Bank</label>
                <p className="mb-0">
                  {
                    transactionDetail?.bank_transaction_vouchers?.bank
                      ?.account_name
                  }
                </p>
              </div>
              <div className="mb-3">
                <label className="text-muted">From Account</label>
                <p className="mb-0">
                  {
                    transactionDetail?.bank_transaction_vouchers
                      ?.from_account_details?.title || '-'
                  }
                </p>
              </div>
              <div className="mb-3">
                <label className="text-muted">Amount</label>
                <p className="mb-0">
                  {
                    transactionDetail?.bank_transaction_vouchers?.currency
                      ?.currency_code
                  }{' '}
                  {formatNumberWithCommas(transactionDetail?.bank_transaction_vouchers?.amount || '-')}
                </p>
              </div>
              <div className="mb-3">
                <label className="text-muted">Commission %</label>
                <p className="mb-0">
                  {transactionDetail?.bank_transaction_vouchers?.commission_percentage
                    ? `${transactionDetail.bank_transaction_vouchers.commission_percentage}%`
                    : "-"}
                </p>
              </div>
            </div>
            <div className="col-md-6">

              <div className="mb-3">
                <label className="text-muted">Commission Type</label>
                <p className="mb-0">
                  {
                    transactionDetail?.bank_transaction_vouchers
                      ?.commission_type || "-"
                  }
                </p>
              </div>
              <div className="mb-3">
                <label className="text-muted">Commission</label>
                <p className="mb-0">
                  {
                    formatNumberWithCommas(transactionDetail?.bank_transaction_vouchers?.commission_value) || "-"}
                </p>
              </div>
              <div className="mb-3">
                <label className="text-muted">Country</label>
                <p className="mb-0">
                  {
                    transactionDetail?.bank_transaction_vouchers?.country
                      ?.country || "-"
                  }
                </p>
              </div>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-muted">Narration</label>
            <p className="mb-0">
              {transactionDetail?.bank_transaction_vouchers?.narration}
            </p>
          </div>
        </div>
      );
    }

    // transaction details
    return (
      <>
        <div className="transaction-details">
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="text-muted">Transaction Type</label>
                <p className="mb-0">
                  {
                    transactionDetail?.bank_transaction_vouchers
                      ?.transaction_type || "-"
                  }
                </p>
              </div>
              <div className="mb-3">
                <label className="text-muted">From Account</label>
                <p className="mb-0">
                  {
                    transactionDetail?.bank_transaction_vouchers
                      ?.from_account_details?.title || "-"
                  }
                </p>
              </div>
              <div className="mb-3">
                <label className="text-muted">Currency</label>
                <p className="mb-0">
                  {
                    transactionDetail?.bank_transaction_vouchers?.currency
                      ?.currency_code
                  }{' '}
                  {formatNumberWithCommas(
                    transactionDetail?.bank_transaction_vouchers?.amount || "-"
                  )}
                </p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="text-muted">Cheque Number</label>
                <p className="mb-0">
                  {
                    transactionDetail?.bank_transaction_vouchers?.cheque
                      ?.cheque_number || "-"
                  }
                </p>
              </div>
              <div className="mb-3">
                <label className="text-muted">To Account</label>
                <p className="mb-0">
                  {
                    transactionDetail?.bank_transaction_vouchers
                      ?.to_account_details?.title
                    || "-"
                  }
                </p>
              </div>

            </div>
          </div>
          <div className="">
            <label className="text-muted">Narration</label>
            <p className="mb-0">
              {transactionDetail?.bank_transaction_vouchers?.narration || "-"}
            </p>
          </div>
        </div>
      </>
    );
  };

  const renderAddLedgerForm = () => {
    switch (showAddLedgerModal) {
      case 'add new pl':
        return (
          <PartyLedgerForm
            inPopup
            onSuccess={(newlyCreatedAccount) => {
              setNewlyCreatedAccount(newlyCreatedAccount);
              setShowAddLedgerModal('');
            }}
            onCancel={() => setShowAddLedgerModal('')}
          />
        );
      case 'add new wic':
        return (
          <WalkInCustomerForm
            inPopup
            onSuccess={(newlyCreatedAccount) => {
              setNewlyCreatedAccount(newlyCreatedAccount);
              setShowAddLedgerModal('');
            }}
            onCancel={() => setShowAddLedgerModal('')}
          />
        );
      case 'add new gl':
        return (
          <ChartOfAccountForm
            inPopup
            onSuccess={(newlyCreatedAccount) => {
              setNewlyCreatedAccount(newlyCreatedAccount);
              setShowAddLedgerModal('');
            }}
            onCancel={() => setShowAddLedgerModal('')}
          />
        );
      default:
        break;
    }
  };

  return (
    <>
      {/* initial render table */}
      <section className="position-relative">
        <div className="d-flex gap-3 justify-content-between flex-wrap mb-4">
          <div className="">
            {(showDepositTable ||
              showTransactionDetails ||
              !isDisabled ||
              pageState === 'view') && (
                <BackButton
                  handleBack={() => {
                    // Preserve the current transaction type when navigating back
                    const currentTransactionType = headerTransactionType;
                    if (pageState === 'edit') {
                      setPageState('view');
                      setIsDisabled(true);
                    } else {
                      setPageState('new');
                      setIsDisabled(true);
                      setShowRightCards(false);
                      setShowTransactionDetails(false);
                      setShowDepositTable(false);
                      setSearchTerm('');
                      setSearchInput('');
                      setWriteTerm('');
                      formikRef?.current?.resetForm();
                      setDate(new Date().toLocaleDateString('en-CA'));
                    }
                    // Ensure transaction type is preserved after state changes
                    setTimeout(() => {
                      setHeaderTransactionType(currentTransactionType);
                    }, 0);
                  }}
                />
              )}
            <h2 className="screen-title mb-0">Bank Transactions</h2>
          </div>
          {hasCreatePermission && isDisabled && !showDepositTable && !searchTerm && !searchInput && (
            <CustomButton text={'New'} onClick={handleNewClick} />
          )}
        </div>
        <div className="d-flex justify-content-between align-items-end gap-2 flex-wrap mb-3">
          <div className="col-md-3 col-sm-12">
            <CombinedInputs
              type1="select"
              type2="input"
              name1="transaction_type"
              name2="search"
              rightIcon={FaMagnifyingGlass}
              value1={headerTransactionType}
              value2={writeTerm}
              options1={[
                { label: 'Deposit', value: 'deposit' },
                { label: 'Inward TT', value: 'inward_tt' },
                { label: 'Withdrawal', value: 'withdrawal' },
              ]}
              placeholder1="Ledger"
              placeholder2={getSearchPlaceholder(headerTransactionType)}
              className1="ledger"
              className2="account"
              setFieldValue={formikRef?.current?.setFieldValue}
              onChange1={(selected) => {
                if (typeof setFieldValue === 'function') {
                  setFieldValue('transaction_type', selected.value);
                }
                setHeaderTransactionType(selected.value);
                transactionSearchRefetch();
              }}
              onChange2={(e) => setWriteTerm(e.target.value)}
              onButtonClick={() => {
                setDate(new Date().toLocaleDateString('en-CA'));
                handleSearchButtonClick();
              }}
            />
          </div>
          <div>
            <CustomInput
              name="Date"
              label={'Date'}
              type="date"
              showBorders={false}
              error={false}
              borderRadius={10}
              value={date}
              readOnly={pageState === 'view'}
              onChange={(e) => {
                setDate(e.target.value);
              }}
            />
          </div>
        </div>
        {showDepositTable ? (
          <CustomTable
            hasFilters={false}
            setFilters={false}
            headers={
              headerTransactionType === 'withdrawal'
                ? withdrawalTableHeaders
                : headerTransactionType === 'inward_tt'
                  ? inwardTTTableHeaders
                  : depositTableHeaders
            }
            pagination={pagination}
            updatePagination={updatePagination}
            isLoading={isFetching}
            sortKey={false}
            sortOrder={false}
            handleSort={false}
          >
            {(activeTransaction?.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={withdrawalTableHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {activeTransaction?.map((item) => (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td
                      onClick={() => {
                        setShowDepositTable(false);
                        setShowTransactionDetails(true);

                        setTransactionDetail(item);

                        const transaction = {
                          id: item?.voucher?.voucher_no,
                          transaction_type:
                            item.transaction_type?.toUpperCase(), // e.g., 'DEPOSIT'
                          cheque_number: item.cheque?.cheque_number || null,
                          from_account_id:
                            item.from_account_details?.title || null,
                          to_account_id: item.to_account_details?.title || null,
                          currency: item.currency?.currency_code || null,
                          amount: Number(item.amount).toLocaleString(), // 500 => "500"
                          narration: item.narration || 'No narration',
                          commissionType: item.commission_type || "-",
                          commissionPercentage:
                            item.commission_percentage || "-",
                          commissionAmount: item.commission_value || "-",
                          country: item.country?.country || "-", // if country is object
                          pdf_url: item?.pdf_url || "-",
                          voucher_no: item?.voucher?.voucher_no || "-",
                          bank_id: item.bank_id || "-",
                          bank_name: item.bank?.account_name || "-",
                        };

                        setCurrentTransaction(transaction);
                        setShowRightCards(true);
                        setIsDisabled(false);

                        setSearchTerm(item?.voucher?.voucher_no);
                        setSearchInput(item?.voucher?.voucher_no);

                        setPageState('view');
                      }}
                    >
                      <p className="hyper-link text-decoration-underline cp mb-0">
                        {item.voucher?.voucher_no}
                      </p>
                    </td>

                    {/* Inward TT specific columns */}
                    {headerTransactionType === 'inward_tt' && (
                      <>
                        <td>{item.bank?.account_name}</td>
                        <td>{item.from_account_type}</td>
                      </>
                    )}

                    {/* Common columns */}
                    <td>{item.from_account_details?.title}</td>
                    {item.to_account_details?.title && (
                      <td>{item.to_account_details?.title}</td>
                    )}
                    <td>{item?.currency?.currency_code}</td>
                    <td>{formatNumberWithCommas(item?.fc_net_total)}</td>
                    <td>{formatNumberWithCommas(item?.lc_net_total)}</td>

                    {/* Inward TT commission columns */}
                    {headerTransactionType === 'inward_tt' && (
                      <>
                        <td>{item?.commission_type || '-'}</td>
                        <td>
                          <p
                            className={`mb-0 ${item.commission_type == 'income'
                              ? 'text-success'
                              : item.commission_type == 'expense'
                                ? 'text-danger'
                                : ''
                              }`}
                          >
                            {item.commission_percentage
                              ? `${item.commission_percentage}%`
                              : '-'}
                          </p>
                        </td>
                      </>
                    )}

                    {/* Common columns */}
                    {item.creator?.user_id && <td>{item.creator?.user_id}</td>}
                    <td>{formatDate(item.created_at, 'HH:MM:SS')}</td>
                    {item.attachments && <td>{item.attachments}</td>}
                  </tr>
                ))}
              </tbody>
            )}
          </CustomTable>
        ) : // Original form view
          showTransactionDetails || pageState === 'view' ? (
            <>
              <div className="d-card">
                <TransactionDetails />
              </div>
            </>
          ) : (
            <div className="d-card">
              <Formik
                innerRef={formikRef}
                initialValues={initialValues}
                validate={(values) => {
                  const errors = {};

                  // Currency validation - must be selected first
                  if (!values.currency || values.currency === '' || values.currency === null || values.currency === undefined) {
                    errors.currency = 'Currency is required';
                  }

                  // Amount validation - only required if currency is selected
                  if (values.currency && !values.amount) {
                    errors.amount = 'Amount is required';
                  }
                  // Amount must be greater than zero
                  if (values.currency && values.amount) {
                    const amountValue = parseFloat(values.amount);
                    if (isNaN(amountValue) || amountValue <= 0) {
                      errors.amount = 'Amount must be greater than zero';
                    }
                  }

                  // Transaction type validation
                  if (!values.transaction_type) {
                    errors.transaction_type = 'Transaction type is required';
                  }

                  // Ledger validation - only required for inward_tt transactions
                  if (values.transaction_type === 'inward_tt') {
                    if (!values.ledger) {
                      errors.ledger = 'Ledger is required';
                    }
                  }

                  // From account validation - different logic for different transaction types
                  if (values.transaction_type === 'inward_tt') {
                    // For inward_tt: From account is required when ledger is selected
                    if (values.ledger && (!values.from_account_id || values.from_account_id === '')) {
                      errors.from_account_id = 'From account is required';
                    }
                  } else {
                    // For deposit/withdrawal: From account is always required
                    if (!values.from_account_id) {
                      errors.from_account_id = 'From account is required';
                    }
                  }

                  // To account validation - not required for inward_tt transactions
                  if (values.transaction_type !== 'inward_tt') {
                    if (!values.to_account_id) {
                      errors.to_account_id = 'To account is required';
                    }
                  }

                  // Cheque number validation - only required for bank accounts (not cash accounts) and not for inward_tt transactions
                  if (values.transaction_type !== 'inward_tt') {
                    // Check if the selected from account is a bank account
                    const isBankAccount = modesData.bank.data?.some(
                      bank => bank.id === values.from_account_id
                    );
                    
                    // Only require cheque number for bank accounts, not cash accounts
                    if (isBankAccount && !values.cheque_number) {
                      errors.cheque_number = 'Cheque number is required';
                    }
                  }


                  // Conditional validations for inward_tt transaction type
                  if (values.transaction_type === 'inward_tt') {
                    if (!values.bank) {
                      errors.bank = 'Bank is required';
                    }

                  }

                  // Commission validation - Commission % and Commission Amount are required when Commission Type is selected
                  if (values.commissionType) {
                    if (!values.commissionPercentage) {
                      errors.commissionPercentage = 'Commission percentage is required';
                    }
                    if (!values.commissionAmount) {
                      errors.commissionAmount = 'Commission amount is required';
                    }
                  }

                  
                  return errors;
                }}
                onSubmit={(values, actions) => {
                  handleFormikSubmit(values, actions);
                }}
                enableReinitialize={false} // Prevent automatic form reinitialization
              >
                {(formikProps) => (
                  <Form>
                    <div className="row justify-content-between">
                      <div className="col-12 col-xxl-9">
                        {renderFormContent(formikProps)}
                      </div>
                      <div className="col-12 col-lg-10 col-xl-9 col-xxl-3">
                        {!isDisabled && (
                          <div className="">
                            <div className="row">
                              <div
                                className="col-12 mb-5"
                                style={{ maxWidth: '350px' }}
                              >
                                {getAccountBalanceSettings(
                                  'bank_transaction'
                                ) && (
                                    <>
                                      {selectedFromAccount && (
                                        <AccountBalanceCard
                                          heading="Account Balance"
                                          accountName={selectedFromAccount.label}
                                          balances={
                                            FromAccountBalance?.balances ||
                                            FromAccountBalance?.detail?.balances ||
                                            (Array.isArray(FromAccountBalance)
                                              ? FromAccountBalance
                                              : [])
                                          }
                                          loading={FromAccountBalance === undefined}
                                        />
                                      )}
                                      {selectedToAccount && (
                                        <AccountBalanceCard
                                          heading="Account Balance"
                                          accountName={selectedToAccount.label}
                                          balances={
                                            ToAccountBalance?.balances ||
                                            ToAccountBalance?.detail?.balances ||
                                            (Array.isArray(ToAccountBalance)
                                              ? ToAccountBalance
                                              : [])
                                          }
                                          loading={ToAccountBalance === undefined}
                                        />
                                      )}
                                      {selectedLedgerAccount && (
                                        <AccountBalanceCard
                                          heading="Account Balance"
                                          accountName={selectedLedgerAccount.label}
                                          balances={
                                            ledgerAccountBalance?.balances ||
                                            ledgerAccountBalance?.detail
                                              ?.balances ||
                                            (Array.isArray(ledgerAccountBalance)
                                              ? ledgerAccountBalance
                                              : [])
                                          }
                                          loading={
                                            ledgerAccountBalance === undefined
                                          }
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
                      </div>
                    </div>

                    {/* Checkboxes and Save Button */}
                    <div className="d-flex flex-wrap justify-content-between align-items-center mb-5">
                      <div className="d-inline-block mt-3">
                        <CustomCheckbox
                          label="Account Balance"
                          checked={getAccountBalanceSettings('bank_transaction')}
                          style={{ border: 'none', margin: 0 }}
                          onChange={(e) =>
                            updateAccountBalanceSetting(
                              'bank_transaction',
                              e.target.checked
                            )
                          }
                          readOnly={isDisabled}
                        />

                        {
                          hasPrintPermission &&
                          <CustomCheckbox
                            label="Print"
                            checked={getPrintSettings('bank_transaction')}
                            onChange={(e) => {
                              updatePrintSetting(
                                'bank_transaction',
                                e.target.checked
                              );
                            }}
                            style={{ border: 'none', margin: 0 }}
                            readOnly={isDisabled}
                          />
                        }
                      </div>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          )}
      </section>

      {(!showDepositTable) && (

        <VoucherNavigationBar
          actionButtons={
            voucherActions && transactionDetail && !isEdit
              ? [
                // Only show buttons if the user has the respective permissions
                ...(hasEditPermission
                  ? [
                    {
                      text: 'Edit',
                      onClick: handleEdit,
                      disabled:
                        isLoadingLockStatus ||
                        isErrorLockStatus ||
                        errorLockStatus?.detail?.locked,
                    },
                  ]
                  : []),
                ...(hasDeletePermission
                  ? [
                    {
                      text: 'Delete',
                      onClick: handleDelete,
                      variant: 'secondaryButton',
                      disabled:
                        isLoadingLockStatus ||
                        isErrorLockStatus ||
                        errorLockStatus?.detail?.locked,
                    },
                  ]
                  : []),
                ...(hasPrintPermission
                  ? [
                    {
                      text: 'Print',
                      onClick: handlePrint,
                      variant: 'secondaryButton',
                    },
                  ]
                  : []),
              ]
              : (!isDisabled && (pageState === 'new' || pageState === 'edit'))
                ? [
                  // Save (create/update) requires create permission for new, edit permission for updates; Cancel always present
                  ...((pageState === 'new' && hasCreatePermission) || (pageState === 'edit' && hasEditPermission)
                    ? [{ text: isEdit ? 'Update' : 'Save', onClick: handleSubmit }]
                    : []),
                  {
                    text: 'Cancel',
                    onClick: () => handleCancel(),
                    variant: 'secondaryButton',
                  },
                ]
                : []
          }
          onAttachmentClick={() => setUploadAttachmentsModal(true)}
          loading={
            searchInput > 0
              ? updateBankTransactionMutation.isPending
              : createBankTransactionMutation.isPending
          }
          lastVoucherHeading={getLastNumberText(headerTransactionType)}
          setPageState={setPageState}
          lastVoucherNumbers={lastVoucherNumbers}
          setSearchTerm={setSearchTerm}
          setWriteTerm={setWriteTerm}
        />
        // :
        // (pageState === "view" || pageState === "list" && hasViewPermission)
        // && null

      )}
      <CustomModal
        show={!!showAddLedgerModal}
        close={() => setShowAddLedgerModal('')}
        size="xl"
        style={{ minHeight: '812px' }}
      >
        {renderAddLedgerForm()}
      </CustomModal>
      <CustomModal
        show={uploadAttachmentsModal}
        close={() => setUploadAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          {...(pageState === 'new' && {
            uploadOnly: true,
            getUploadedFiles: setAddedAttachments,
            closeUploader: () => setUploadAttachmentsModal(false),
          })}
          {...(pageState === 'edit' && {
            showModal: uploadAttachmentsModal,
            closeModal: () => setUploadAttachmentsModal(false),
            item: transactionDetail,
            deleteService: deleteAttachment,
            uploadService: uploadAttachment,
            closeUploader: () => setUploadAttachmentsModal(false),
            voucherAttachment: true,
            queryToInvalidate: ['bankTransaction', searchTerm],
            deferredMode: true,
            getUploadedFiles: handleVoucherAttachmentsUpload,
            getDeletedAttachments: handleDeletedAttachments,
            currentFiles: currentFiles,
            setCurrentFiles: setCurrentFiles,
          })}
          {...(pageState === 'view' && {
            viewOnly: true,
            showModal: uploadAttachmentsModal,
            item: transactionDetail,
            closeUploader: () => setUploadAttachmentsModal(false),
          })}
        />
      </CustomModal>
      <CustomModal
        show={showMissingCurrencyRateModal}
        close={() => setShowMissingCurrencyRateModal(false)}
        title={'Missing Rate of Exchange'}
        description={'Rate of exchange is missing for selected currency.'}
        variant={'error'}
        btn1Text={'Update Rate of Exchange'}
        action={() => {
          switch (pageState) {
            case 'edit':
              setLastVisitedPage('bank-transaction', 'rate-of-exchange');
              saveFormValues('bank-transaction', {
                ...formData,
                date,
              });
              break;
            case 'new':
              setLastVisitedPage('bank-transaction', 'rate-of-exchange');
              saveFormValues('bank-transaction', {
                ...formData,
                date,
              });
              break;
            default:
              break;
          }
          navigate('/transactions/remittance-rate-of-exchange', {
            state: { currencyToSelect, date },
          });
        }}
      />
    </>
  );
};

export default withFilters(withModal(BankTransactions));
