import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import { useCallback, useEffect, useRef, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
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
import withModal from '../../../HOC/withModal';
import useCurrencyRate from '../../../Hooks/useCurrencyRate';
import {
  getCurrencyRatesPair,
  getAccountBalances,
  getExchangeRates,
  pairReleased,
} from '../../../Services/General';
import {
  checkTransactionLockStatus,
  releaseTransaction,
} from '../../../Services/Process/TransactionLock.js';
import {
  addForeignCurrencyDealAttachment,
  deleteForeignCurrencyDealAttachment,
  getForeignCurrencyDealListingOrDetails,
  updateForeignCurrencyDeal,
} from '../../../Services/Transaction/ForeignCurrencyDeal';
import useFormStore from '../../../Stores/FormStore';
import useSettingsStore from '../../../Stores/SettingsStore';
import useUserStore from '../../../Stores/UserStore';
import { ledgerOptions } from '../../../Utils/Constants/SelectOptions';
import {
  transformSpecialCommission,
  formatNumberWithCommas,
  formatRateValue,
} from '../../../Utils/Helpers';
import { isNullOrEmpty, showErrorToast } from '../../../Utils/Utils';
import SpecialCommission from '../SpecialCommission/SpecialCommission';

const EditForeignCurrencyDeal = ({
  showModal,
  date,
  setDate,
  setPageState,
  searchTerm,
  setSearchTerm,
  setWriteTerm,
  getAccountsByTypeOptions,
  newlyCreatedAccount,
  setShowAddLedgerModal,
  currencyOptions,
  lastVoucherNumbers,
  restoreValuesFromStore,
  hasPrintPermission,
  closeModal,
  isDisabled = false, // Add isDisabled parameter with default value
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formikRef = useRef();
  // Access the form store
  const {
    saveFormValues,
    getFormValues,
    clearFormValues,
    setLastVisitedPage,
    clearLastVisitedPage,
  } = useFormStore();

  // For getting print and account balance checkbox state from BE
  const {
    getPrintSettings,
    updatePrintSetting,
    getAccountBalanceSettings,
    updateAccountBalanceSetting,
  } = useSettingsStore();

  const { user: { base_currency } = {} } = useUserStore(); // For LCy Field
  const formId = 'edit_foreign_currency_deal';
  const voucherName = 'foreign_currency_deal';

  const [newAccountTriggeredFrom, setNewAccountTriggeredFrom] = useState('');
  const [buyCurrency, setBuyCurrency] = useState(null);
  const [sellCurrency, setSellCurrency] = useState(null);
  const [selectedDebitLedgerAccount, setSelectedDebitLedgerAccount] =
    useState(null);
  const [selectedCreditLedgerAccount, setSelectedCreditLedgerAccount] =
    useState(null);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [addedAttachments, setAddedAttachments] = useState({});
  const [hasShownMissingRateModal, setHasShownMissingRateModal] =
    useState(false);
  const [showMissingCurrencyRateModal, setShowMissingCurrencyRateModal] =
    useState(false);
  const [currencyToSelect, setCurrencyToSelect] = useState('');
  const [missingRateContext, setMissingRateContext] = useState('pair');

  const [deletedAttachments, setDeletedAttachments] = useState([]); // Track IDs of attachments to delete
  const [currentFiles, setCurrentFiles] = useState([]); // Track current files for UI display
  const filesInitializedRef = useRef(false); // Track if files have been initialized
  const [currenciesManuallyChanged, setCurrenciesManuallyChanged] = useState(false); // Track if currencies changed by user

  // Special Commission state
  const [addedSpecialCommissionValues, setAddedSpecialCommissionValues] =
    useState(null);
  const [showSCModal, setShowSCModal] = useState(false);
  const [exchangeRatesInverse, setExchangeRatesInverse] = useState(false);

  const [commissionCurrency, setCommissionCurrency] = useState('');
  const [showRateError, setShowRateError] = useState(false);
  const [showBaseRateError, setShowBaseRateError] = useState(false);

  const [baseRateCurrency, setBaseRateCurrency] = useState('');
  //for store base rate data to release pair
  const [baseRatesData, setBaseRatesData] = useState();

  // Fetch Foreign Currency Deal details for editing
  const {
    data: { data: [foreignCurrencyDealData] = [] } = {},
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['foreignCurrencyDeal', searchTerm],
    queryFn: () =>
      getForeignCurrencyDealListingOrDetails({
        search: searchTerm,
      }),
    enabled: !!searchTerm,
  });

  const foreignCurrencyDeal = foreignCurrencyDealData?.foreign_currency_deal;

  // Check Transaction lock status to enable/disable Save
  const { isLoading: isLoadingLockStatus, refetch: checkFormStatus } = useQuery(
    {
      queryKey: ['save_lock_status', voucherName, foreignCurrencyDealData?.id],
      queryFn: () =>
        checkTransactionLockStatus({
          transaction_type: voucherName,
          transaction_id: foreignCurrencyDealData?.id,
        }),
      enabled: false,
      retry: false,
    }
  );

  const updateForeignCurrencyDealMutation = useMutation({
    mutationFn: ({ id, payload }) => updateForeignCurrencyDeal(id, payload),
    onSuccess: (data) => {
      showToast(
        `CBS ${data?.detail?.voucher_no ? `${data.detail.voucher_no} ` : ''
        } Updated!`,
        'success'
      );
      if (
        hasPrintPermission &&
        getPrintSettings('foreign_currency_deal') &&
        data.detail?.pdf_url
      ) {
        window.open(data.detail.pdf_url, '_blank');
      }
      queryClient.invalidateQueries(['foreignCurrencyDealListing']);
      queryClient.invalidateQueries(['foreignCurrencyDeal', searchTerm]);
      // Clear attachment tracking after successful update
      setAddedAttachments({});
      setDeletedAttachments([]);
      handleResetForm();
      setPageState('view');
      setSearchTerm(searchTerm);
      setWriteTerm(searchTerm);
    },
    onError: (error) => {
      console.error('Error updating Foreign Currency Deal', error);
      if (
        error.message.toLowerCase() ==
        'foreign currency deal limit reached for this branch.'
      ) {
        showModal(
          'Cannot Update',
          'You have reached the maximum number of Foreign Currency Deal. To create new transactions you need to increase the transaction count form the Transaction Number Register.',
          null,
          'error'
        );
      } else {
        showErrorToast(error);
      }
    },
  });

  useEffect(() => {
    if (foreignCurrencyDeal?.special_commission) {
      setAddedSpecialCommissionValues(
        transformSpecialCommission(foreignCurrencyDeal.special_commission)
      );
    } else {
      // Reset special commission values if no special commission exists
      setAddedSpecialCommissionValues(null);
    }

    // Initialize files for display once data is loaded
    if (
      (foreignCurrencyDealData?.files || foreignCurrencyDeal?.files) &&
      !filesInitializedRef.current
    ) {
      const dbFiles =
        foreignCurrencyDealData?.files || foreignCurrencyDeal?.files || [];
      const mappedFiles = dbFiles.map((file) => ({
        ...file,
        name: file.filename || file.name,
        size: file.file_size || file.size,
        type: file.file_type || file.type,
      }));
      setCurrentFiles(mappedFiles);
      filesInitializedRef.current = true;
    }
  }, [foreignCurrencyDeal, foreignCurrencyDealData]);

  // Update Selected Currencies and Accounts
  useEffect(() => {
    if (foreignCurrencyDeal?.base_rate_currency_id) {
      setBaseRateCurrency(foreignCurrencyDeal.base_rate_currency_id);
    }

    if (
      foreignCurrencyDeal?.buy_fcy_dr_id &&
      foreignCurrencyDeal?.sell_fc_cr_id
    ) {
      setBuyCurrency(
        currencyOptions.find(
          (x) => x.value == foreignCurrencyDeal?.buy_fcy_dr_id
        )
      );
      setSellCurrency(
        currencyOptions.find(
          (x) => x.value == foreignCurrencyDeal?.sell_fc_cr_id
        )
      );
    }

    // Set selected accounts for dropdowns
    if (foreignCurrencyDeal?.debit_ledger_account_id) {
      const debitAccount = getAccountsByTypeOptions(
        foreignCurrencyDeal?.debit_ledger
      ).find((x) => x.value == foreignCurrencyDeal?.debit_ledger_account_id);
      if (debitAccount) {
        setSelectedDebitLedgerAccount({
          value: debitAccount.value,
          label: debitAccount.label,
          accountType: foreignCurrencyDeal?.debit_ledger,
        });
      }
    }

    if (foreignCurrencyDeal?.credit_ledger_account_id) {
      const creditAccount = getAccountsByTypeOptions(
        foreignCurrencyDeal?.credit_ledger
      ).find((x) => x.value == foreignCurrencyDeal?.credit_ledger_account_id);
      if (creditAccount) {
        setSelectedCreditLedgerAccount({
          value: creditAccount.value,
          label: creditAccount.label,
          accountType: foreignCurrencyDeal?.credit_ledger,
        });
      }
    }

    if (!restoreValuesFromStore) {
      setDate(foreignCurrencyDeal?.voucher_date);
    }
  }, [
    foreignCurrencyDeal?.buy_fcy_dr_id,
    foreignCurrencyDeal?.sell_fc_cr_id,
    foreignCurrencyDeal?.debit_ledger_account_id,
    foreignCurrencyDeal?.credit_ledger_account_id,
    foreignCurrencyDeal?.debit_ledger,
    foreignCurrencyDeal?.credit_ledger,
    foreignCurrencyDeal?.base_rate_currency_id,
  ]);

  // Update base rate currency when buy/sell changes if not set
  useEffect(() => {
    if (isLoading) return; // Wait for data to load
    if (!baseRateCurrency && (buyCurrency?.value || sellCurrency?.value)) {
      const fallbackId = buyCurrency?.value || sellCurrency?.value;
      setBaseRateCurrency(fallbackId);
      if (formikRef.current && !formikRef.current.values.base_rate_currency_id) {
        formikRef.current.setFieldValue('base_rate_currency_id', fallbackId);
      }
    }
  }, [buyCurrency, sellCurrency, isLoading]);

  // Restore form data from store for Rate of Exchange flow
  useEffect(() => {
    if (restoreValuesFromStore) {
      const savedFormData = getFormValues(formId);
      if (savedFormData && formikRef.current) {
        formikRef.current.setValues(savedFormData.values || {});
        setBuyCurrency(
          currencyOptions.find(
            (x) => x.value == savedFormData?.values?.buy_fcy_dr_id
          )
        );
        setSellCurrency(
          currencyOptions.find(
            (x) => x.value == savedFormData?.values?.sell_fc_cr_id
          )
        );
        setAddedAttachments(savedFormData.addedAttachments || null);
        setAddedSpecialCommissionValues(
          savedFormData.addedSpecialCommissionValues || null
        );
        if (savedFormData?.date) {
          setDate(savedFormData?.date);
        }
        clearFormValues(formId);
        clearLastVisitedPage(formId);
      }
    }
  }, [restoreValuesFromStore]);

  // Manually update form values when foreignCurrencyDeal data loads
  useEffect(() => {
    if (foreignCurrencyDeal && formikRef.current) {
      const newValues = getInitialValues();
      formikRef.current.setValues(newValues);
    }
  }, [foreignCurrencyDeal]);

  const { data: currencyRatesPair, isLoading: isLoadingCurrencyRatesPair } =
    useQuery({
      queryKey: [
        'dual-currency-rate',
        buyCurrency, // Currency 1
        sellCurrency, // Currency 2
        date,
        'buy', // Which rate to fetch (buy/sell) //TODO: Make this dynamic
      ],
      queryFn: () =>
        getCurrencyRatesPair(
          buyCurrency?.value,
          sellCurrency?.value,
          date,
          'buy' // Which rate to fetch (buy/sell) //TODO: Make this dynamic
        ),
      staleTime: 1000 * 5,
      gcTime: 1000 * 5,
      enabled: !!buyCurrency && !!sellCurrency,
    });

  // Fetch base rate currency rate
  const {
    data: baseRateCurrencyRate,
    isLoading: isLoadingBaseRateCurrencyRate,
  } = useCurrencyRate(baseRateCurrency, date);

  // To update Rate field and show missing rate modal if rate not present
  useEffect(() => {
    if (
      buyCurrency?.value &&
      sellCurrency?.value &&
      !isNullOrEmpty(currencyRatesPair) &&
      !currencyRatesPair?.direct_rate &&
      !hasShownMissingRateModal
    ) {
      formikRef.current.setFieldValue('commission_currency_id', '');
      formikRef.current.setFieldValue('rate', '');
      formikRef.current.setFieldValue('sell_fc_cr_id', '');
      setCurrencyToSelect(sellCurrency?.value || '');
      setShowMissingCurrencyRateModal(true);
      setHasShownMissingRateModal(true);
      setSellCurrency(null);
    } else if (currencyRatesPair?.direct_rate && currenciesManuallyChanged) {
      formikRef.current.setFieldValue('rate_type', 'direct_from');
      formikRef.current.setFieldValue('rate', currencyRatesPair?.direct_rate);
    }
  }, [
    buyCurrency?.value,
    sellCurrency?.value,
    currencyRatesPair?.direct_rate,
    hasShownMissingRateModal,
    currenciesManuallyChanged,
  ]);

  // Account balances for Debit and Credit Ledger accounts
  const { data: selectedDebitLedgerAccountBalance } = useQuery({
    queryKey: ['accountBalance', selectedDebitLedgerAccount?.value],
    queryFn: () =>
      getAccountBalances(
        selectedDebitLedgerAccount.value,
        selectedDebitLedgerAccount.accountType
      ),
    enabled:
      !!selectedDebitLedgerAccount?.value &&
      getAccountBalanceSettings('foreign_currency_deal'),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

  const { data: selectedCreditLedgerAccountBalance } = useQuery({
    queryKey: ['accountBalance', selectedCreditLedgerAccount?.value],
    queryFn: () =>
      getAccountBalances(
        selectedCreditLedgerAccount.value,
        selectedCreditLedgerAccount.accountType
      ),
    enabled:
      !!selectedCreditLedgerAccount?.value &&
      getAccountBalanceSettings('foreign_currency_deal'),
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

  // Commission Currency Options
  const getCommissionCurrencyOptions = () => {
    const options = [];

    // Add existing base rate currency if it exists
    if (foreignCurrencyDeal?.base_rate_currency_id) {
      const existingCurrency = currencyOptions.find(
        (x) => x.value == foreignCurrencyDeal?.base_rate_currency_id
      );
      if (
        existingCurrency &&
        !options.find((opt) => opt.value === existingCurrency.value)
      ) {
        options.push(existingCurrency);
      }
    }

    // Add existing commission currency if it exists and is not already in options
    if (foreignCurrencyDeal?.commission_currency_id) {
      const existingCurrency = currencyOptions.find(
        (x) => x.value == foreignCurrencyDeal?.commission_currency_id
      );
      if (
        existingCurrency &&
        !options.find((opt) => opt.value === existingCurrency.value)
      ) {
        options.push(existingCurrency);
      }
    }

    // Add buy currency if available
    if (
      buyCurrency &&
      !options.find((opt) => opt.value === buyCurrency.value)
    ) {
      options.push(buyCurrency);
    }

    // Add sell currency if available and different from buy currency
    if (
      sellCurrency &&
      !options.find((opt) => opt.value === sellCurrency.value)
    ) {
      options.push(sellCurrency);
    }

    // If no currencies are available yet, show a placeholder
    if (options.length === 0) {
      return [{ label: 'Select Buy/Sell Currency', value: '' }];
    }

    return options;
  };

  const validateForm = async () => {
    if (!formikRef.current) return false;
    // Validate the form
    const errors = await formikRef.current.validateForm();

    // Check if there are any errors other than rate and base_rates variation errors
    const otherErrors = Object.keys(errors).filter(
      (key) => key !== 'rate' && key !== 'base_rates'
    );

    if (otherErrors.length > 0) {
      // Mark all fields as touched to show errors
      formikRef.current.setTouched(
        Object.keys(errors).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {})
      );
      return false; // Do not submit if there are mandatory fields missing
    }
    return true; // ✅ Form is valid (ignoring rate range errors here to show modal in handleSubmit)
  };

  // Returns object with special commission data (add it in your payload)
  const createSCObject = () => {
    if (addedSpecialCommissionValues) {
      // Get complete SC values including ledger field
      const scValues = getSCValues();

      // Flatten the SC object
      const converted = {};
      const sc = scValues;

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
      return converted;
    }
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

  // Handle file removal
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

  // Fill required fields before opening SC Modal
  const handleSCClick = () => {
    // Check if required fields are filled
    const requiredFields = [
      'debit_ledger',
      'debit_ledger_account_id',
      'credit_ledger',
      'credit_ledger_account_id',
      'buy_fcy_dr_id',
      'buy_fcy_dr_amount',
      'rate',
      'sell_fc_cr_id',
      'sell_fc_cr_amount',
      'base_rate_currency_id',
      'base_rates',
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
    if (baseRatesData) {
      pairReleasedMutation.mutate(baseRatesData?.id);
    }
    if (currencyRatesPair) {
      pairReleasedMutation.mutate(currencyRatesPair?.direct_pair_id);
      pairReleasedMutation.mutate(currencyRatesPair?.reverse_pair_id);
    }
  };

  const handleResetForm = () => {
    handlePairReleased();
    // Release lock then navigate back
    releaseLock();
    clearFormValues(formId);
    clearFormValues('special-commission');
    setBaseRateCurrency('');
    setAddedAttachments({});
    setDeletedAttachments([]);
    // Reset files to original state and allow re-initialization
    filesInitializedRef.current = false;
    if (
      foreignCurrencyDealData?.files ||
      foreignCurrencyDealData?.foreign_currency_deal?.files
    ) {
      setCurrentFiles(
        foreignCurrencyDealData?.files ||
        foreignCurrencyDealData?.foreign_currency_deal?.files ||
        []
      );
    } else {
      setCurrentFiles([]);
    }
    setPageState('view');
  };

  // Transform rate_type values for backend compatibility
  const transformRateType = (rateType) => {
    if (rateType === 'direct_from') return 'X';
    if (rateType === 'direct_upto') return '/';
    return rateType;
  };

  const handleSubmit = async () => {
    // run status check first
    const { error: errorLockStatus } = await checkFormStatus();
    if (errorLockStatus?.detail?.locked) {
      showToast(errorLockStatus?.message, 'warn');
      return;
    }
    if (!formikRef.current) return;
    let isValid = await validateForm();
    if (!isValid) return;

    if (showRateError) {
      const officialRate =
        formikRef.current.values.rate_type === 'direct_from'
          ? parseFloat(currencyRatesPair?.direct_rate)
          : parseFloat(currencyRatesPair?.reverse_rate);
      const minRange =
        formikRef.current.values.rate_type === 'direct_from'
          ? parseFloat(currencyRatesPair?.direct_from)
          : parseFloat(currencyRatesPair?.reverse_from);
      const maxRange =
        formikRef.current.values.rate_type === 'direct_from'
          ? parseFloat(currencyRatesPair?.direct_upto)
          : parseFloat(currencyRatesPair?.reverse_upto);

      showModal(
        'Exchange Rate Control',
        <>
          Exchange Rate for {buyCurrency?.label}/{sellCurrency?.label} is {formatRateValue(officialRate)}
          <br />
          Acceptable range is from {formatRateValue(minRange)} to {formatRateValue(maxRange)}
          <br />
          Your selected rate is outside this range
        </>,
        () => closeModal(),
        'error'
      );
      return;
    }

    if (showBaseRateError) {
      const officialBaseRate = parseFloat(baseRateCurrencyRate?.rate);
      const minRange = parseFloat(baseRateCurrencyRate?.min_range);
      const maxRange = parseFloat(baseRateCurrencyRate?.max_range);
      const baseRateCurrencyLabel = (currencyOptions && baseRateCurrency) ? currencyOptions.find(c => c.value == baseRateCurrency)?.label : 'Currency';

      showModal(
        'Exchange Rate Control',
        <>
          Exchange Rate for {baseRateCurrencyLabel} is {formatRateValue(officialBaseRate)}
          <br />
          Acceptable range is from {formatRateValue(minRange)} to {formatRateValue(maxRange)}
          <br />
          your selected base rate is outside this range
        </>,
        () => closeModal(),
        'error'
      );
      return;
    }

    const formValues = formikRef.current.values;
    let payload = {};

    payload = {
      ...formValues,
      ...createSCObject(),
      ...addedAttachments,
    };

    // Add deleted attachments if any
    if (deletedAttachments.length > 0) {
      deletedAttachments.forEach((id, index) => {
        payload[`deleted_attachments[${index}]`] = id;
      });
    }

    // Transform rate_type for backend compatibility
    if (payload.rate_type) {
      payload.rate_type = transformRateType(payload.rate_type);
    }

    // Remove empty/null fields
    Object.keys(payload).forEach((key) => {
      if (payload[key] === '' || payload[key] === null) {
        delete payload[key];
      }
    });

    if (!payload.commission) {
      delete payload.commission_currency_id;
      delete payload.commission_currency_name;
    }

    handlePairReleased();
    updateForeignCurrencyDealMutation.mutate({
      id: searchTerm,
      payload,
    });
    return;
  };

  // Release lock on unmount or cancel
  const releaseExecutedRef = useRef(false);
  const releaseTransactionMutation = useMutation({
    mutationFn: releaseTransaction,
  });
  const releaseLock = useCallback(() => {
    if (releaseExecutedRef.current) return;
    if (foreignCurrencyDealData?.id) {
      releaseTransactionMutation.mutate({
        transaction_type: voucherName,
        transaction_id: foreignCurrencyDealData?.id,
      });
      releaseExecutedRef.current = true;
    }
  }, [foreignCurrencyDealData?.id]);

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

  const getSCValues = () => {
    // Prepare Special Commission values
    const currentBuyCurrencyId = formikRef.current?.values?.buy_fcy_dr_id;
    const currentBuyCurrencyName = formikRef.current?.values?.buy_fcy_dr_name;
    const currentBuyAmount = formikRef.current?.values?.buy_fcy_dr_amount;

    const accountObj = getAccountsByTypeOptions(formikRef?.current?.values.debit_ledger).find(
      (x) => x.value === formikRef?.current?.values.debit_ledger_account_id
    );
    const currencyObj = currencyOptions.find((x) => x.value === currentBuyCurrencyId);
    const ledgerObj = ledgerOptions.find(
      (x) => x.value === formikRef?.current?.values.debit_ledger
    );

    return {
      date: date,
      transaction_no: lastVoucherNumbers?.current,
      account: accountObj?.label || '',
      account_id: accountObj?.value || '',
      currency: currencyObj?.label || currentBuyCurrencyName || '',
      currency_id: currentBuyCurrencyId || '',
      amount: currentBuyAmount || 0,
      ...addedSpecialCommissionValues,
      // Do not move the ledger field above the ...addedSpecialCommissionValues
      ledger: ledgerObj?.value || '',
      ledger_name: ledgerObj?.label || '',
      commission_type:
        addedSpecialCommissionValues?.commission_type ||
        formikRef?.current?.values.commission_type ||
        'Income', // Default
    };
  };


  const getAvailableAccountsForSC = () => {
    const accounts = [];

    // Add debit account if selected
    if (
      formikRef?.current?.values.debit_ledger_account_id &&
      formikRef?.current?.values.debit_ledger
    ) {
      const debitAccount = getAccountsByTypeOptions(
        formikRef.current.values.debit_ledger
      ).find((x) => x.value === formikRef.current.values.debit_ledger_account_id);
      if (debitAccount) {
        accounts.push({
          label: debitAccount.label,
          value: debitAccount.value,
          ledgerType: formikRef.current.values.debit_ledger,
          ledgerLabel:
            ledgerOptions.find(
              (x) => x.value === formikRef.current.values.debit_ledger
            )?.label || '',
        });
      }
    }

    // Add credit account if selected
    if (
      formikRef?.current?.values.credit_ledger_account_id &&
      formikRef?.current?.values.credit_ledger
    ) {
      const creditAccount = getAccountsByTypeOptions(
        formikRef.current.values.credit_ledger
      ).find((x) => x.value === formikRef.current.values.credit_ledger_account_id);
      if (creditAccount) {
        accounts.push({
          label: creditAccount.label,
          value: creditAccount.value,
          ledgerType: formikRef.current.values.credit_ledger,
          ledgerLabel:
            ledgerOptions.find(
              (x) => x.value === formikRef.current.values.credit_ledger
            )?.label || '',
        });
      }
    }

    return accounts;
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="d-card">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <div className="row mb-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="col-12 col-sm-6 mb-45 align-items-center"
                  style={{ height: 56 }}
                >
                  <Skeleton
                    style={{ marginTop: 28 }}
                    duration={1}
                    width={'75%'}
                    baseColor="#ddd"
                    height={22}
                  />
                </div>
              ))}
            </div>
            <div className="row mb-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="col-12 mb-45 align-items-center"
                  style={{ height: 56 }}
                >
                  <Skeleton
                    style={{ marginTop: 28 }}
                    duration={1}
                    width={'88%'}
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

  // Handle error state
  if (isError) {
    showErrorToast(error);
    return (
      <div className="d-card">
        <p className="text-danger mb-0">Error fetching TMN Currency Deal</p>
      </div>
    );
  }

  // Map backend rate_type values to UI/internal values
  const mapIncomingRateType = (rateType) => {
    if (rateType === 'X') return 'direct_from';
    if (rateType === '/') return 'direct_upto';
    return rateType || 'direct_from';
  };

  const getInitialValues = () => {
    return {
      voucher_date: foreignCurrencyDeal?.voucher_date,
      deal_type: foreignCurrencyDeal?.deal_type || 'single',
      debit_ledger: foreignCurrencyDeal?.debit_ledger || '',
      debit_ledger_account_id: foreignCurrencyDeal?.debit_ledger_account_id,
      debit_ledger_account_name:
        foreignCurrencyDeal?.debit_account_details?.title || '',
      credit_ledger: foreignCurrencyDeal?.credit_ledger || '',
      credit_ledger_account_id:
        foreignCurrencyDeal?.credit_ledger_account_id || '',
      credit_ledger_account_name:
        foreignCurrencyDeal?.credit_account_details?.title || '',
      buy_fcy_dr_id: foreignCurrencyDeal?.buy_fcy_dr_id || '',
      buy_fcy_dr_name:
        currencyOptions.find(
          (x) => x.value == foreignCurrencyDeal?.buy_fcy_dr_id
        )?.label || '',
      sell_fc_cr_id: foreignCurrencyDeal?.sell_fc_cr_id || '',
      sell_fc_cr_name:
        currencyOptions.find(
          (x) => x.value == foreignCurrencyDeal?.sell_fc_cr_id
        )?.label || '',
      buy_fcy_dr_amount:
        parseFloat(foreignCurrencyDeal?.buy_fcy_dr_amount) || '',
      sell_fc_cr_amount:
        parseFloat(foreignCurrencyDeal?.sell_fc_cr_amount) || '',
      net_total_currency_id: foreignCurrencyDeal?.commission_currency_id || foreignCurrencyDeal?.base_rate_currency_id || '',
      rate_type: mapIncomingRateType(foreignCurrencyDeal?.rate_type),
      rate: foreignCurrencyDeal?.rate ? Number(foreignCurrencyDeal.rate).toFixed(8) : '',
      commission_type: foreignCurrencyDeal?.commission_type || '',
      commission_currency_id: foreignCurrencyDeal?.commission_currency_id || '',
      commission_currency_name:
        foreignCurrencyDeal?.commission_currency_name || '',
      commission: parseFloat(foreignCurrencyDeal?.commission) || '',
      net_total: parseFloat(foreignCurrencyDeal?.net_total) || '',
      net_total_currency_name:
        foreignCurrencyDeal?.commission_fcy?.currency_code ||
        foreignCurrencyDeal?.special_commission?.amount_type?.currency_code ||
        '',
      base_rates: foreignCurrencyDeal?.base_rates ? Number(foreignCurrencyDeal.base_rates).toFixed(8) : '',
      base_rate_currency_id:
        foreignCurrencyDeal?.base_rate_currency_id ||
        foreignCurrencyDeal?.commission_currency_id ||
        '',
      lcy_amount: parseFloat(foreignCurrencyDeal?.lcy_amount) || '',
      narration: foreignCurrencyDeal?.narration || '',
      comment: foreignCurrencyDeal?.comment || '',
    };
  };

  return (
    <>
      <div className="d-card">
        <Formik
          initialValues={getInitialValues()}
          innerRef={formikRef}
          enableReinitialize={false}
          validate={(values) => {
            const errors = {};
            // Required fields validation
            if (!values.voucher_date)
              errors.voucher_date = 'Value Date is required';

            // Debit Ledger and Account validation - conditional
            if (!values.debit_ledger) {
              errors.debit_ledger = 'Debit Ledger is required';
            } else if (!values.debit_ledger_account_id) {
              errors.debit_ledger_account_id = 'Debit Account is required';
            }

            // Credit Ledger and Account validation - conditional
            if (!values.credit_ledger) {
              errors.credit_ledger = 'Credit Ledger is required';
            } else if (!values.credit_ledger_account_id) {
              errors.credit_ledger_account_id = 'Credit Account is required';
            }

            // Buy FCy validation - conditional
            if (!values.buy_fcy_dr_id) {
              errors.buy_fcy_dr_id = 'Buy FCy Currency is required';
            } else if (!values.buy_fcy_dr_amount) {
              errors.buy_fcy_dr_amount = 'Buy FCy Amount is required';
            } else if (isNaN(values.buy_fcy_dr_amount)) {
              errors.buy_fcy_dr_amount = 'Amount must be a number';
            } else if (values.buy_fcy_dr_amount <= 0) {
              errors.buy_fcy_dr_amount = 'Amount must be greater than 0';
            }

            // Rate validation
            if (!values.rate) errors.rate = 'Rate is required';

            // Sell FCy validation - conditional
            if (!values.sell_fc_cr_id) {
              errors.sell_fc_cr_id = 'Sell FCy Currency is required';
            } else if (!values.sell_fc_cr_amount) {
              errors.sell_fc_cr_amount = 'Sell FCy Amount is required';
            } else if (isNaN(values.sell_fc_cr_amount)) {
              errors.sell_fc_cr_amount = 'Amount must be a number';
            } else if (values.sell_fc_cr_amount <= 0) {
              errors.sell_fc_cr_amount = 'Amount must be greater than 0';
            }

            // Base Rate validation - conditional
            if (!values.base_rate_currency_id) {
              errors.base_rate_currency_id = 'Base Rate Currency is required';
            } else if (!values.base_rates) {
              errors.base_rates = 'Base Rate is required';
            }

            // Commission validation - commission type, currency, and amount are all required when commission is applied
            if (values.commission_currency_id || values.commission) {
              if (!values.commission_type) {
                errors.commission_type = 'Commission type is required';
              }
              if (!values.commission_currency_id) {
                errors.commission_currency_id = 'Commission currency is required';
              }
              if (!values.commission) {
                errors.commission = 'Commission amount is required';
              } else if (isNaN(values.commission)) {
                errors.commission = 'Amount must be a number';
              } else if (parseFloat(values.commission) <= 0) {
                errors.commission = 'Amount must be greater than 0';
              }
            }

            // Rate Variation Validation (using backend-provided range)
            const rate = parseFloat(values.rate);
            const minRateRange =
              values.rate_type === 'direct_from'
                ? parseFloat(currencyRatesPair?.direct_from)
                : parseFloat(currencyRatesPair?.reverse_from);
            const maxRateRange =
              values.rate_type === 'direct_from'
                ? parseFloat(currencyRatesPair?.direct_upto)
                : parseFloat(currencyRatesPair?.reverse_upto);

            if (
              !isNaN(minRateRange) &&
              !isNaN(maxRateRange) &&
              !isNaN(rate) &&
              rate !== 0
            ) {
              if (rate < minRateRange || rate > maxRateRange) {
                errors.rate = `Range: ${formatRateValue(minRateRange)} - ${formatRateValue(maxRateRange)}`;
              }
            }

            // Base Rate Variation Validation (using backend-provided range)
            const baseRate = parseFloat(values.base_rates);
            const minBaseRange = parseFloat(baseRateCurrencyRate?.min_range);
            const maxBaseRange = parseFloat(baseRateCurrencyRate?.max_range);

            if (
              !isNaN(minBaseRange) &&
              !isNaN(maxBaseRange) &&
              !isNaN(baseRate) &&
              baseRate !== 0
            ) {
              if (baseRate < minBaseRange || baseRate > maxBaseRange) {
                errors.base_rates = `Range: ${formatRateValue(minBaseRange)} - ${formatRateValue(maxBaseRange)}`;
              }
            }

            return errors;
          }}
          onSubmit={handleSubmit}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            setFieldValue,
            setFieldError,
            setFieldTouched,
          }) => {
            // Recalculate Special Commission when relevant amounts or currencies change
            useEffect(() => {
              if (
                addedSpecialCommissionValues &&
                addedSpecialCommissionValues.commission
              ) {
                const commissionPercentage =
                  parseFloat(addedSpecialCommissionValues.commission) || 0;
                const scCurrencyId =
                  addedSpecialCommissionValues.currency_id ||
                  addedSpecialCommissionValues.currency?.value;

                let currentBaseAmount = 0;
                let currentCurrency = null;

                if (scCurrencyId == values.buy_fcy_dr_id) {
                  currentBaseAmount = parseFloat(values.buy_fcy_dr_amount) || 0;
                  currentCurrency = currencyOptions.find(
                    (x) => x.value == values.buy_fcy_dr_id
                  );
                } else if (scCurrencyId == values.sell_fc_cr_id) {
                  currentBaseAmount = parseFloat(values.sell_fc_cr_amount) || 0;
                  currentCurrency = currencyOptions.find(
                    (x) => x.value == values.sell_fc_cr_id
                  );
                }

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
                      currency: currentCurrency || prev.currency,
                      currency_id: scCurrencyId,
                      distributions:
                        updatedDistributions.length > 0
                          ? updatedDistributions
                          : prev.distributions,
                    }));
                  }
                }
              }
            }, [
              values.buy_fcy_dr_amount,
              values.buy_fcy_dr_id,
              values.sell_fc_cr_amount,
              values.sell_fc_cr_id,
              addedSpecialCommissionValues?.commission,
              addedSpecialCommissionValues?.currency_id,
            ]);
            // Fetch base rate for commission currency using hook
            const { data: currencyRate, isLoading: isLoadingCurrencyRate } =
              useCurrencyRate(values.commission_currency_id, date, {
                enabled: !!values.commission_currency_id,
              });

            // Fetch base rate for base rate currency using hook
            const {
              data: baseRateCurrencyRate,
              isLoading: isLoadingBaseRateCurrencyRate,
            } = useCurrencyRate(values.base_rate_currency_id, date, {
              enabled: !!values.base_rate_currency_id,
            });

            useEffect(() => {
              setBaseRatesData(baseRateCurrencyRate);
            }, [baseRateCurrencyRate]);

            useEffect(() => {
              if (!values.commission_currency_id) {
                setFieldValue('commission', '');
                setFieldValue('commission_currency_name', '');
                return;
              }
              if (currencyRate?.rate) {
                // Commission currency rate is handled separately
              } else if (isLoadingCurrencyRate) {
                // Don't clear commission amount while loading in edit mode
                // setFieldValue('commission', '');
              } else if (
                currencyRate &&
                !isLoadingCurrencyRate &&
                values.commission_currency_id
              ) {
                setMissingRateContext('base');
                setShowMissingCurrencyRateModal(true);
                setFieldValue('commission_currency_id', '');
                setFieldValue('commission', '');
                setFieldValue('commission_currency_name', '');
              }
            }, [
              currencyRate?.rate,
              isLoadingCurrencyRate,
              values.commission_currency_id,
            ]);

            useEffect(() => {
              if (!values.base_rate_currency_id) {
                setFieldValue('base_rates', '');
                return;
              }

              // In edit mode, if we have a saved rate and haven't changed the currency, 
              // we should keep it instead of clearing it while loading.
              const isInitialLoad = !touched.base_rate_currency_id;
              const hasSavedRate = !!foreignCurrencyDeal?.base_rates;

              if (baseRateCurrencyRate?.rate) {
                // If it's a fresh fetch or the field is empty, update it
                if (!isInitialLoad || !values.base_rates) {
                  setFieldValue('base_rates', baseRateCurrencyRate.rate);
                }
              } else if (isLoadingBaseRateCurrencyRate) {
                // Only clear if it's not the initial load (meaning user explicitly changed it)
                if (!isInitialLoad) {
                  setFieldValue('base_rates', '');
                }
              } else if (
                baseRateCurrencyRate &&
                !isLoadingBaseRateCurrencyRate &&
                values.base_rate_currency_id
              ) {
                // Only handle error/missing rate if it's not the initial load or if base_rates is missing
                if (!isInitialLoad || !values.base_rates) {
                  setFieldValue('base_rates', '');
                  setMissingRateContext('base');
                  setShowMissingCurrencyRateModal(true);
                  setFieldValue('base_rate_currency_id', '');
                }
              }
            }, [
              baseRateCurrencyRate?.rate,
              isLoadingBaseRateCurrencyRate,
              values.base_rate_currency_id,
              touched.base_rate_currency_id
            ]);

            useEffect(() => {
              if (addedSpecialCommissionValues) {
                setFieldValue('commission', '');
                setFieldValue('commission_currency_id', '');
                setFieldValue('commission_currency_name', '');
              }
            }, [addedSpecialCommissionValues, setFieldValue]);

            useEffect(() => {
              // if (!values.rate || !values.buy_fcy_dr_amount) return;
              const rate = parseFloat(values.rate) || 0;
              const buyAmount = parseFloat(values.buy_fcy_dr_amount) || 0;
              if (values.rate_type === 'direct_from') {
                const sellAmount = buyAmount * rate;
                setFieldValue('sell_fc_cr_amount', sellAmount);
              } else if (values.rate_type === 'direct_upto') {
                const sellAmount = buyAmount / rate;
                setFieldValue('sell_fc_cr_amount', sellAmount);
              }
            }, [values?.rate, values?.buy_fcy_dr_amount, values?.rate_type]);

            useEffect(() => {
              // Determine target currency for Net Total
              // Priority: Commission Currency (Regular/Special) -> Fallback to Buy Currency
              const targetCurrencyId =
                values.commission_currency_id ||
                addedSpecialCommissionValues?.currency_id ||
                addedSpecialCommissionValues?.currency?.value ||
                values.buy_fcy_dr_id;

              // Get currency name for display
              const targetCurrencyOption = currencyOptions.find(
                (x) => x.value == targetCurrencyId
              );
              const targetCurrencyName =
                targetCurrencyOption?.label || values.buy_fcy_dr_name || '';

              setFieldValue('net_total_currency_name', targetCurrencyName);

              // Amount from selected currency (Buy or Sell)
              let amountForTotal = 0;
              if (targetCurrencyId == (values.buy_fcy_dr_id || buyCurrency?.value)) {
                amountForTotal = parseFloat(values.buy_fcy_dr_amount) || 0;
              } else if (
                targetCurrencyId == (values.sell_fc_cr_id || sellCurrency?.value)
              ) {
                amountForTotal = parseFloat(values.sell_fc_cr_amount) || 0;
              }

              // Commission Value (Special or Regular)
              const commissionValue =
                parseFloat(
                  addedSpecialCommissionValues?.total_commission ??
                  values.commission
                ) || 0;

              const netTotal = commissionValue + amountForTotal;
              setFieldValue('net_total', netTotal !== 0 ? netTotal : '');
            }, [
              values.buy_fcy_dr_id,
              values.buy_fcy_dr_amount,
              values.buy_fcy_dr_name,
              values.sell_fc_cr_id,
              values.sell_fc_cr_amount,
              values.sell_fc_cr_name,
              values.commission,
              values.commission_currency_id,
              values.base_rate_currency_id,
              values.net_total_currency_id,
              addedSpecialCommissionValues,
              addedSpecialCommissionValues?.total_commission,
              buyCurrency?.value,
              sellCurrency?.value,
            ]);

            useEffect(() => {
              const netTotalAmount = parseFloat(values.net_total || 0);
              const baseRate = parseFloat(values.base_rates || 0);

              if (
                !isNaN(netTotalAmount) &&
                !isNaN(baseRate) &&
                netTotalAmount
              ) {
                const result = netTotalAmount * baseRate;
                setFieldValue('lcy_amount', result);
              } else {
                setFieldValue('lcy_amount', '');
              }
            }, [values.base_rates, values.net_total]);

            // Sync date prop with Formik values
            useEffect(() => {
              if (date !== values.voucher_date) {
                setFieldValue('voucher_date', date);
              }
            }, [date]);

            return (
              <Form>
                <div className="row">
                  <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
                    <div className="row">
                      {/* Combined Debit Ledger and Account */}
                      <div className="col-12 col-sm-6 mb-45">
                        <CombinedInputs
                          label="Debit Ledger"
                          type1="select"
                          type2="select"
                          name1="debit_ledger"
                          name2="debit_ledger_account_id"
                          value1={values.debit_ledger}
                          value2={
                            values.debit_ledger_account_id ||
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
                            values.debit_ledger
                          )}
                          handleBlur={handleBlur}
                          placeholder1="Ledger"
                          placeholder2="Account"
                          onChange1={(selected) => {
                            setFieldValue('debit_ledger', selected.value);
                            // Reset selected account when ledger changes
                            setFieldValue('debit_ledger_account_id', '');
                            setFieldValue('debit_ledger_account_name', '');
                            setSelectedDebitLedgerAccount(null);
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
                              setFieldValue(
                                'debit_ledger_account_id',
                                selected.value
                              );
                              setFieldValue(
                                'debit_ledger_account_name',
                                selected.label
                              );
                              setSelectedDebitLedgerAccount({
                                value: selected.value,
                                label: selected.label,
                                accountType: values.debit_ledger,
                              });
                            } else {
                              // Handle deselection
                              setFieldValue('debit_ledger_account_id', '');
                              setFieldValue('debit_ledger_account_name', '');
                              setSelectedDebitLedgerAccount(null);
                            }
                          }}
                        />
                        <ErrorMessage
                          name="debit_ledger"
                          component="div"
                          className="input-error-message text-danger"
                        />
                        <ErrorMessage
                          name="debit_ledger_account_id"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>
                      {/* Combined Credit Ledger and Account */}
                      <div className="col-12 col-sm-6 mb-45">
                        <CombinedInputs
                          label="Credit Ledger"
                          type1="select"
                          type2="select"
                          name1="credit_ledger"
                          name2="credit_ledger_account_id"
                          value1={values.credit_ledger}
                          value2={
                            values.credit_ledger_account_id ||
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
                            values.credit_ledger
                          )}
                          handleBlur={handleBlur}
                          placeholder1="Ledger"
                          placeholder2="Account"
                          onChange1={(selected) => {
                            setFieldValue('credit_ledger', selected.value);
                            // Reset selected account when ledger changes
                            setFieldValue('credit_ledger_account_id', '');
                            setFieldValue('credit_ledger_account_name', '');
                            setSelectedCreditLedgerAccount(null);
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
                                'credit_ledger_account_id',
                                selected.value
                              );
                              setFieldValue(
                                'credit_ledger_account_name',
                                selected.label
                              );
                              setSelectedCreditLedgerAccount({
                                value: selected.value,
                                label: selected.label,
                                accountType: values.credit_ledger,
                              });
                            } else {
                              // Handle deselection
                              setFieldValue('credit_ledger_account_id', '');
                              setFieldValue('credit_ledger_account_name', '');
                              setSelectedCreditLedgerAccount(null);
                            }
                          }}
                        />
                        <ErrorMessage
                          name="credit_ledger"
                          component="div"
                          className="input-error-message text-danger"
                        />
                        <ErrorMessage
                          name="credit_ledger_account_id"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>
                      {/* Combined Buy FCy (Dr) and Amount */}
                      <div className="col-12 col-sm-6 mb-45">
                        <CombinedInputs
                          label="Buy FCy (Dr)"
                          type1="select"
                          type2="input"
                          name1="buy_fcy_dr_id"
                          name2="buy_fcy_dr_amount"
                          min2={0}
                          value1={values.buy_fcy_dr_id}
                          value2={values.buy_fcy_dr_amount}
                          options1={currencyOptions}
                          handleBlur={handleBlur}
                          placeholder1="Currency"
                          placeholder2="Amount"
                          inputType2="number"
                          onChange1={(selected) => {
                            setFieldValue('buy_fcy_dr_id', selected.value);
                            setFieldValue('buy_fcy_dr_name', selected.label);
                            setHasShownMissingRateModal(false);
                            setBuyCurrency(selected);
                            setCurrenciesManuallyChanged(true); // Mark that user changed currency
                            setBaseRateCurrency(selected.value); // Sync base rate currency state so range updates
                            setFieldTouched('base_rate_currency_id', true); // Mark as touched so base rate value updates
                            setFieldValue(
                              'base_rate_currency_id',
                              selected.value
                            );
                            setFieldValue(
                              'net_total_currency_id',
                              selected.value
                            );

                            // Sync Commission Currency and Net Total Currency
                            if (!addedSpecialCommissionValues) {
                              setFieldValue(
                                'net_total_currency_name',
                                selected.label
                              );
                            }
                          }}
                          onChange2={(e) => {
                            const newAmount = parseFloat(e.target.value || 0);
                            const oldAmount = parseFloat(
                              values.buy_fcy_dr_amount || 0
                            );

                            handleChange(e);

                            // Recalculate Normal Commission
                            if (
                              !addedSpecialCommissionValues &&
                              values.commission &&
                              oldAmount > 0
                            ) {
                              const currentCommission =
                                parseFloat(values.commission) || 0;
                              const ratio = currentCommission / oldAmount;
                              const newCommission = newAmount * ratio;
                              setFieldValue(
                                'commission',
                                newCommission.toFixed(2)
                              );
                            }
                          }}
                        />
                        <ErrorMessage
                          name="buy_fcy_dr_id"
                          component="div"
                          className="input-error-message text-danger"
                        />
                        {!isLoadingCurrencyRatesPair && (
                          <ErrorMessage
                            name="buy_fcy_dr_amount"
                            component="div"
                            className="input-error-message text-danger"
                          />
                        )}
                      </div>
                      {/* Combined Rate Type and Rate */}
                      <div className="col-12 col-sm-6 mb-45">
                        <CombinedInputs
                          label="Rate"
                          type1="select"
                          type2="input"
                          name1="rate_type"
                          name2="rate"
                          value1={values.rate_type}
                          value2={values.rate}
                          options1={[
                            { label: 'x', value: 'direct_from' },
                            { label: '/', value: 'direct_upto' },
                          ]}
                          handleBlur={handleBlur}
                          placeholder2="Rate"
                          inputType2="number"
                          onChange1={(selected) => {
                            setFieldValue('rate_type', selected.value);
                            // Auto-populate rate based on selection if available
                            if (
                              selected.value === 'direct_from' &&
                              currencyRatesPair?.direct_rate
                            ) {
                              setFieldValue(
                                'rate',
                                parseFloat(currencyRatesPair?.direct_rate)
                              );
                            } else if (
                              selected.value === 'direct_upto' &&
                              currencyRatesPair?.reverse_rate
                            ) {
                              setFieldValue(
                                'rate',
                                parseFloat(currencyRatesPair?.reverse_rate)
                              );
                            }
                          }}
                          onChange2={(e) => {
                            handleChange(e);
                            // Mark field as touched
                            setFieldTouched('rate', true, true);

                            const enteredRate = parseFloat(e.target.value);
                            const minRange =
                              values.rate_type === 'direct_from'
                                ? parseFloat(currencyRatesPair?.direct_from)
                                : parseFloat(currencyRatesPair?.reverse_from);
                            const maxRange =
                              values.rate_type === 'direct_from'
                                ? parseFloat(currencyRatesPair?.direct_upto)
                                : parseFloat(currencyRatesPair?.reverse_upto);

                            if (
                              !isNaN(minRange) &&
                              !isNaN(maxRange) &&
                              !isNaN(enteredRate) &&
                              enteredRate !== 0
                            ) {
                              const isError =
                                enteredRate < minRange || enteredRate > maxRange;
                              setShowRateError(isError);
                            } else {
                              setShowRateError(false);
                            }
                          }}
                          inputProps2={{
                            inputClass:
                              errors.rate && touched.rate ? 'text-danger' : '',
                          }}
                        />
                        <ErrorMessage
                          name="rate"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>
                      {/* Combined Sell FCy (Cr) and Amount */}
                      <div className="col-12 col-sm-6 mb-45">
                        <CombinedInputs
                          label="Sell FCy (Cr)"
                          type1="select"
                          type2="input"
                          name1="sell_fc_cr_id"
                          name2="sell_fc_cr_amount"
                          min2={0}
                          value1={values.sell_fc_cr_id}
                          value2={values.sell_fc_cr_amount}
                          options1={currencyOptions}
                          isSecondInputDisabled
                          handleBlur={handleBlur}
                          placeholder1="Currency"
                          placeholder2="Amount"
                          inputType2="number"
                          onChange1={(selected) => {
                            setFieldValue('sell_fc_cr_id', selected.value);
                            setFieldValue('sell_fc_cr_name', selected.label);
                            setHasShownMissingRateModal(false);
                            setSellCurrency(selected);
                            setCurrenciesManuallyChanged(true); // Mark that user changed currency
                          }}
                          additionalProps={{
                            isLoadingCurrencyRate: isLoadingCurrencyRatesPair,
                          }}
                        />
                        <ErrorMessage
                          name="sell_fc_cr_id"
                          component="div"
                          className="input-error-message text-danger"
                        />
                        <ErrorMessage
                          name="sell_fc_cr_amount"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>

                      {/* Base Rate */}
                      <div className="col-12 col-sm-6 mb-3">
                        <CombinedInputs
                          label="Base Rate"
                          type1="select"
                          type2="input"
                          name1="base_rate_currency_id"
                          name2="base_rates"
                          value1={values.base_rate_currency_id}
                          value2={values.base_rates}
                          options1={getCommissionCurrencyOptions()}
                          handleBlur={handleBlur}
                          placeholder1="Currency"
                          placeholder2="Rate"
                          inputType2="number"
                          onChange1={(selected) => {
                            setFieldTouched('base_rate_currency_id', true);
                            setFieldValue(
                              'base_rate_currency_id',
                              selected.value
                            );

                            setBaseRateCurrency(selected?.value);
                          }}
                          onChange2={(e) => {
                            handleChange(e);
                            // Mark field as touched
                            setFieldTouched('base_rates', true, true);

                            const enteredRate = parseFloat(e.target.value);
                            const minRange = parseFloat(baseRateCurrencyRate?.min_range);
                            const maxRange = parseFloat(baseRateCurrencyRate?.max_range);

                            if (
                              !isNaN(minRange) &&
                              !isNaN(maxRange) &&
                              !isNaN(enteredRate) &&
                              enteredRate !== 0
                            ) {
                              const isError =
                                enteredRate < minRange || enteredRate > maxRange;
                              setShowBaseRateError(isError);
                            } else {
                              setShowBaseRateError(false);
                            }
                          }}
                          inputProps2={{
                            inputClass:
                              errors.base_rates && touched.base_rates
                                ? 'text-danger'
                                : '',
                          }}
                        />
                        {isLoadingBaseRateCurrencyRate && (
                          <p className="m-0 position-absolute primary-color-text">
                            Fetching rate...
                          </p>
                        )}
                        <ErrorMessage
                          name="base_rate_currency_id"
                          component="div"
                          className="input-error-message text-danger"
                        />
                        <ErrorMessage
                          name="base_rates"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>

                      {/* <div className="col-12 col-sm-6 mb-45" /> */}
                      {/* Commission Type */}
                      <div className="col-12 col-sm-6 mb-45">
                        <SearchableSelect
                          name={'commission_type'}
                          label={'Commission Type'}
                          placeholder={'Select Commission Type'}
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
                          value={values.commission_type}
                          onChange={(v) => {
                            if (
                              v.label
                                ?.toLowerCase()
                                ?.startsWith('add new remove commission type')
                            ) {
                              setFieldValue('commission_type', '');
                              setFieldValue('commission_currency_id', '');
                              setFieldValue('commission_currency_name', '');
                              setFieldValue('commission', '');
                              setAddedSpecialCommissionValues(null);
                            } else {
                              setFieldValue('commission_type', v.value);
                            }
                          }}
                          formatOptionLabel={(option) => {
                            return option.displayLabel || option.label;
                          }}
                          isDisabled={
                            !!addedSpecialCommissionValues?.commission_type
                          }
                          onBlur={handleBlur}
                        />
                        <ErrorMessage
                          name="commission_type"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>
                      {/* Commission Currency */}
                      <div className="col-12 col-sm-6 mb-45">
                        <CombinedInputs
                          label="Commission"
                          type1="select"
                          type2="input"
                          inputType2="number"
                          name1="commission_currency_id"
                          name2="commission"
                          value1={values.commission_currency_id}
                          value2={values.commission}
                          options1={getCommissionCurrencyOptions()}
                          // isfirstInputDisabled={true}
                          isDisabled={addedSpecialCommissionValues}
                          handleBlur={handleBlur}
                          placeholder1="Currency"
                          placeholder2="Amount"
                          onChange1={(selected) => {
                            setFieldTouched('commission_currency_id', true);
                            setFieldValue(
                              'commission_currency_id',
                              selected.value
                            );
                            setFieldValue(
                              'commission_currency_name',
                              selected.label
                            );
                            setFieldValue(
                              'net_total_currency_id',
                              selected.value
                            );
                            setFieldValue(
                              'net_total_currency_name',
                              selected.label
                            );
                            setCommissionCurrency(selected?.value);
                          }}
                          onChange2={handleChange}
                        />
                        <ErrorMessage
                          name="commission_currency_id"
                          component="div"
                          className="input-error-message text-danger"
                        />
                        <ErrorMessage
                          name="commission"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>

                      {/* Net Total */}
                      <div className="col-12 col-sm-6 mb-45">
                        <CombinedInputs
                          label="Net Total"
                          type1="input"
                          type2="input"
                          name2="net_total"
                          value1={values.net_total_currency_name}
                          value2={values.net_total}
                          isDisabled={true}
                          placeholder1="Currency"
                          placeholder2="Net Total"
                          inputType2="number"
                        />
                      </div>

                      {/* LCy Amount */}
                      {/* <div className="col-12 col-sm-6 mb-3">
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
                      </div> */}
                      {/* Narration */}
                      <div className="col-12 mb-2">
                        <CustomInput
                          name={'narration'}
                          label={'Narration'}
                          type={'textarea'}
                          placeholder={'Enter Narration'}
                          value={values.narration}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>
                      {/* Comment */}
                      <div className="col-12 mb-3">
                        <CustomInput
                          name={'comment'}
                          label={'Comment'}
                          type={'textarea'}
                          placeholder={'Enter Comment'}
                          value={values.comment}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>

                      {/* File Attachments */}
                      <div className="col-12 mb-3">
                        {/* List of current attachments */}
                        {/* {currentFiles && currentFiles.length > 0 && (
                          <FileDisplayList
                            files={currentFiles}
                            onRemoveFile={(file) => handleDeletedAttachments(file.id)}
                          />
                        )} */}

                        {/* List of newly added attachments */}
                        <FileDisplayList
                          files={addedAttachments}
                          onRemoveFile={handleRemoveAttachedFile}
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
                          {getAccountBalanceSettings('foreign_currency_deal') && (
                            <>
                              <div>
                                {/* Debit Account Balance */}
                                {selectedDebitLedgerAccount && (
                                  <AccountBalanceCard
                                    heading="Account Balance"
                                    accountName={
                                      selectedDebitLedgerAccount?.label
                                    }
                                    balances={
                                      selectedDebitLedgerAccountBalance?.balances ||
                                      selectedDebitLedgerAccountBalance?.detail
                                        ?.balances ||
                                      (Array.isArray(
                                        selectedDebitLedgerAccountBalance
                                      )
                                        ? selectedDebitLedgerAccountBalance
                                        : [])
                                    }
                                    loading={
                                      selectedDebitLedgerAccountBalance ===
                                      undefined
                                    }
                                  />
                                )}
                              </div>
                              <div>
                                {/* Credit Account Balance */}
                                {selectedCreditLedgerAccount && (
                                  <AccountBalanceCard
                                    heading="Account Balance"
                                    accountName={
                                      selectedCreditLedgerAccount?.label
                                    }
                                    balances={
                                      selectedCreditLedgerAccountBalance?.balances ||
                                      selectedCreditLedgerAccountBalance?.detail
                                        ?.balances ||
                                      (Array.isArray(
                                        selectedCreditLedgerAccountBalance
                                      )
                                        ? selectedCreditLedgerAccountBalance
                                        : [])
                                    }
                                    loading={
                                      selectedCreditLedgerAccountBalance ===
                                      undefined
                                    }
                                  />
                                )}
                              </div>
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
                </div>


                {/* Special Commission */}
                <div className="d-flex mb-45">
                  <CustomButton
                    type={'button'}
                    onClick={handleSCClick}
                    text={
                      addedSpecialCommissionValues
                        ? 'Edit Special Commission'
                        : 'Add Special Commission'
                    }
                    disabled={values.commission}
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
                    {formatNumberWithCommas(addedSpecialCommissionValues?.commission)}%{' '}
                    {addedSpecialCommissionValues?.commission_type?.toLowerCase() ==
                      'income'
                      ? 'receivable'
                      : 'payable'}{' '}
                    commission of{' '}
                    {
                      currencyOptions.find(
                        (x) =>
                          x.value ==
                          (addedSpecialCommissionValues?.currency_id ||
                            addedSpecialCommissionValues?.currency?.value ||
                            values.buy_fcy_dr_id)
                      )?.label
                    }{' '}
                    {formatNumberWithCommas(addedSpecialCommissionValues?.total_commission)} on{' '}
                    {
                      currencyOptions.find(
                        (x) =>
                          x.value ==
                          (addedSpecialCommissionValues?.currency_id ||
                            addedSpecialCommissionValues?.currency?.value ||
                            values.buy_fcy_dr_id)
                      )?.label
                    }{' '}
                    {formatNumberWithCommas(
                      addedSpecialCommissionValues?.amount ||
                      values.buy_fcy_dr_amount
                    )}
                  </p>
                ) : null}

                {/* Print and Account Balance Checkboxes */}
                <div className="d-flex flex-wrap justify-content-start mb-4">
                  <div className="d-inline-block mt-3">
                    <CustomCheckbox
                      label="Account Balance"
                      checked={getAccountBalanceSettings(
                        'foreign_currency_deal'
                      )}
                      style={{ border: 'none', margin: 0 }}
                      onChange={(e) => {
                        updateAccountBalanceSetting(
                          'foreign_currency_deal',
                          e.target.checked
                        );
                      }}
                    />
                    <CustomCheckbox
                      label="Print"
                      disabled={!hasPrintPermission}
                      checked={getPrintSettings('foreign_currency_deal')}
                      onChange={(e) => {
                        updatePrintSetting(
                          'foreign_currency_deal',
                          e.target.checked
                        );
                      }}
                      style={{ border: 'none', margin: 0 }}
                    />
                  </div>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>

      <VoucherNavigationBar
        actionButtons={[
          {
            text: 'Update',
            onClick: handleSubmit,
            loading: isLoadingLockStatus,
          },
          {
            text: 'Cancel',
            onClick: handleResetForm,
            variant: 'secondaryButton',
          },
        ]}
        loading={updateForeignCurrencyDealMutation.isPending}
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
          item={foreignCurrencyDealData}
          deleteService={deleteForeignCurrencyDealAttachment}
          uploadService={addForeignCurrencyDealAttachment}
          closeUploader={() => setShowAttachmentsModal(false)}
          voucherAttachment={true}
          queryToInvalidate={['foreignCurrencyDeal', searchTerm]}
          deferredMode={true}
          getUploadedFiles={handleVoucherAttachmentsUpload}
          getDeletedAttachments={handleDeletedAttachments}
          currentFiles={currentFiles}
          setCurrentFiles={setCurrentFiles}
        />
      </CustomModal>

      {/* Missing Currency Rate Modal */}
      <CustomModal
        show={showMissingCurrencyRateModal}
        close={() => setShowMissingCurrencyRateModal(false)}
        title={'Missing Rate of Exchange'}
        description={
          missingRateContext === 'base'
            ? `Rate of exchange is missing for the selected currency against base currency (${base_currency}).`
            : 'Rate of exchange is missing for selected currency.'
        }
        variant={'error'}
        btn1Text={'Update Rate of Exchange'}
        action={() => {
          // Save current form state before navigating
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
          isTwoLedgerVoucher={true}
          availableAccounts={getAvailableAccountsForSC()}
          availableCurrencies={(() => {
            const currencies = [];
            const values = formikRef.current?.values;
            if (!values) return currencies;

            // Buy Currency
            if (values.buy_fcy_dr_id && values.buy_fcy_dr_amount) {
              const c = currencyOptions?.find(
                (x) => x.value == values.buy_fcy_dr_id
              );
              if (c) {
                currencies.push({
                  ...c,
                  amount: parseFloat(values.buy_fcy_dr_amount) || 0,
                });
              }
            }

            // Sell Currency
            if (values.sell_fc_cr_id && values.sell_fc_cr_amount) {
              const c = currencyOptions?.find(
                (x) => x.value == values.sell_fc_cr_id
              );
              if (c && !currencies.find((existing) => existing.value == c.value)) {
                currencies.push({
                  ...c,
                  amount: parseFloat(values.sell_fc_cr_amount) || 0,
                });
              }
            }
            return currencies;
          })()}
          isEdit={false}
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

export default withModal(EditForeignCurrencyDeal);
