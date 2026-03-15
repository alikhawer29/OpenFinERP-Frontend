import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import { useEffect, useRef, useState } from 'react';
import { HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
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
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
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
import { createForeignCurrencyDeal } from '../../../Services/Transaction/ForeignCurrencyDeal';
import useFormStore from '../../../Stores/FormStore';
import useSettingsStore from '../../../Stores/SettingsStore';
import useUserStore from '../../../Stores/UserStore';
import { ledgerOptions } from '../../../Utils/Constants/SelectOptions';
import { fCDMultiDealHeaders } from '../../../Utils/Constants/TableHeaders';
import {
  formatNumberForDisplay,
  isNullOrEmpty,
  showErrorToast,
} from '../../../Utils/Utils';
import {
  formatNumberWithCommas,
  formatRateValue,
} from '../../../Utils/Helpers';
import SpecialCommission from '../SpecialCommission/SpecialCommission';

const NewForeignCurrencyDeal = ({
  showModal,
  date,
  setDate,
  newDealType,
  setNewDealType,
  isDisabled = false,
  setIsDisabled,
  setPageState,
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
  const formId = 'new_foreign_currency_deal';

  const [newAccountTriggeredFrom, setNewAccountTriggeredFrom] = useState('');
  const [buyCurrency, setBuyCurrency] = useState(null);
  const [sellCurrency, setSellCurrency] = useState(null);
  const [selectedDebitLedgerAccount, setSelectedDebitLedgerAccount] =
    useState(null);
  const [selectedCreditLedgerAccount, setSelectedCreditLedgerAccount] =
    useState(null);
  const [uploadAttachmentsModal, setUploadAttachmentsModal] = useState(false);
  const [addedAttachments, setAddedAttachments] = useState({});
  const [hasShownMissingRateModal, setHasShownMissingRateModal] =
    useState(false);
  const [showMissingCurrencyRateModal, setShowMissingCurrencyRateModal] =
    useState(false);
  const [currencyToSelect, setCurrencyToSelect] = useState('');
  const [missingRateContext, setMissingRateContext] = useState('pair');

  const [multiDealEntries, setMultiDealEntries] = useState([]);
  const [commissionCurrency, setCommissionCurrency] = useState('');
  const [baseRateCurrency, setBaseRateCurrency] = useState('');
  const [showRateError, setShowRateError] = useState(false);
  const [showBaseRateError, setShowBaseRateError] = useState(false);

  // Special Commission state
  const [addedSpecialCommissionValues, setAddedSpecialCommissionValues] =
    useState(null);
  const [showSCModal, setShowSCModal] = useState(false);
  const [exchangeRatesInverse, setExchangeRatesInverse] = useState(false);
  //for store base rate data to release pair
  const [baseRatesData, setBaseRatesData] = useState();

  const isRestoringRef = useRef(false);

  // Create Mutation
  const createForeignCurrencyDealMutation = useMutation({
    mutationFn: createForeignCurrencyDeal,
    onSuccess: (data) => {
      showToast(
        `CBS ${data?.detail?.voucher_no ? `${data.detail.voucher_no} ` : ''
        } Created!`,
        'success'
      );
      if (hasPrintPermission && getPrintSettings('foreign_currency_deal')) {
        window.open(data.detail?.pdf_url, '_blank');
      }
      queryClient.invalidateQueries(['foreignCurrencyDealListing']);
      handleResetForm();
    },
    onError: (error) => {
      console.error('Error creating Foreign Currency Deal', error);
      if (error.message == 'Voucher limit reached for this branch.') {
        showModal(
          'Cannot Create',
          'You have reached the maximum number of CBS. To create new transactions you need to increase the transaction count form the Transaction Number Register.',
          null,
          'error'
        );
      } else {
        showErrorToast(error);
      }
    },
  });

  // Update deal_type in Formik when newDealType changes
  useEffect(() => {
    if (formikRef.current && !isRestoringRef.current) {
      formikRef.current.setFieldValue('deal_type', newDealType);
    }
  }, [newDealType]);

  // Restore form data from store for Rate of Exchange flow
  useEffect(() => {
    if (restoreValuesFromStore) {
      const savedFormData = getFormValues(formId);
      if (savedFormData && formikRef.current) {
        formikRef.current.setValues(savedFormData.values || {});
        if (savedFormData?.date) {
          setDate(savedFormData?.date);
        }
        setMultiDealEntries(savedFormData.multiDealEntries || []);
        setNewDealType(savedFormData.newDealType || 'single');
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
        setIsDisabled(false);
        clearFormValues(formId);
        clearLastVisitedPage(formId);
      }
    }
  }, [restoreValuesFromStore]);

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
      setSellCurrency(null);
      setMissingRateContext('pair');
      setShowMissingCurrencyRateModal(true);
      setHasShownMissingRateModal(true);
    } else if (currencyRatesPair?.direct_rate) {
      formikRef.current.setFieldValue('rate_type', 'direct_from');
      formikRef.current.setFieldValue('rate', currencyRatesPair?.direct_rate);
    }
  }, [
    buyCurrency?.value,
    sellCurrency?.value,
    currencyRatesPair?.direct_rate,
    hasShownMissingRateModal,
  ]);

  // Update base rate currency when buy/sell changes if not set
  useEffect(() => {
    if (!baseRateCurrency && (buyCurrency?.value || sellCurrency?.value)) {
      setBaseRateCurrency(buyCurrency?.value || sellCurrency?.value);
      if (formikRef.current) {
        formikRef.current.setFieldValue('base_rate_currency_id', buyCurrency?.value || sellCurrency?.value);
      }
    }
  }, [buyCurrency, sellCurrency]);

  // Fetch account balances
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
    // if (isLoadingCurrencyRatesPair) {
    //   return [{ label: 'Loading...', value: '' }];
    // }
    if (!buyCurrency && !sellCurrency) {
      return [{ label: 'Select Buy/Sell Currency', value: '' }];
    }
    if (buyCurrency && !sellCurrency) {
      return [{ label: buyCurrency?.label, value: buyCurrency?.value }];
    }
    if (!buyCurrency && sellCurrency) {
      return [{ label: sellCurrency?.label, value: sellCurrency?.value }];
    }
    if (buyCurrency === sellCurrency) {
      return [{ label: buyCurrency?.label, value: buyCurrency?.value }];
    }
    return [
      { label: buyCurrency?.label, value: buyCurrency?.value },
      { label: sellCurrency?.label, value: sellCurrency?.value },
    ];
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
      // Flatten the SC object
      const converted = {};
      const sc = addedSpecialCommissionValues;

      for (const key in sc) {
        if (key === 'distributions' && Array.isArray(sc[key])) {
          sc[key].forEach((item, index) => {
            for (const subKey in item) {
              converted[
                `[special_commission][distribution][${index}][${subKey}]`
              ] = item[subKey];
            }
          });
        } else {
          converted[`[special_commission][${key}]`] = sc[key];
        }
      }
      return converted;
    }
  };

  const parseSCObject = (converted) => {
    const result = {};
    const distribution = [];

    for (const key in converted) {
      const value = converted[key];

      // Match distribution keys like: [special_commission][distribution][0][amount]
      const distMatch = key.match(
        /^\[special_commission\]\[distribution\]\[(\d+)\]\[(.+)\]$/
      );
      if (distMatch) {
        const index = parseInt(distMatch[1], 10);
        const subKey = distMatch[2];

        if (!distribution[index]) {
          distribution[index] = {};
        }

        distribution[index][subKey] = value;
      } else {
        // Match general keys like: [special_commission][account_id]
        const mainMatch = key.match(/^\[special_commission\]\[(.+)\]$/);
        if (mainMatch) {
          const mainKey = mainMatch[1];
          result[mainKey] = value;
        }
      }
    }

    if (distribution.length > 0) {
      result.distribution = distribution;
    }

    return result;
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
    setIsDisabled(true);
    setBuyCurrency(null);
    setSellCurrency(null);
    setSelectedDebitLedgerAccount(null);
    setSelectedCreditLedgerAccount(null);
    setBaseRateCurrency('');
    setAddedSpecialCommissionValues(null);
    setMultiDealEntries([]); // Clear multiDealEntries
    setAddedAttachments({});
    if (formikRef.current) {
      formikRef.current.resetForm();
    }
    clearFormValues(formId);
    clearFormValues('special-commission');
    setDate(new Date().toLocaleDateString('en-CA'));
  };

  // Transform rate_type values for backend compatibility
  const transformRateType = (rateType) => {
    console.log(rateType, 'rateType');
    if (rateType === 'direct_from') return 'X';
    if (rateType === 'direct_upto') return '/';
    return rateType;
  };

  const handleSubmit = async () => {
    if (!formikRef.current) return;

    const formValues = formikRef.current.values;
    let payload = {};

    const isSpecialCommission = (key) => key.startsWith('[special_commission]');
    const isFileKey = (key) => key.startsWith('files');

    const transformKey = (key, index) => {
      if (isSpecialCommission(key)) return `deals[${index}]${key}`;
      if (isFileKey(key)) {
        const [base, rest] = key.split('[');
        return `deals[${index}][${base}][${rest}`;
      }
      return `deals[${index}][${key}]`;
    };

    if (newDealType === 'multi' && multiDealEntries.length) {
      // In multi mode with saved entries, skip current form validation
      // since entries were already validated when added
      multiDealEntries.forEach((entry, index) => {
        Object.entries(entry).forEach(([key, value]) => {
          if (key === 'voucher_date') {
            payload['voucher_date'] = date;
          } else if (key === 'rate_type') {
            // Transform rate_type for backend compatibility
            payload[transformKey(key, index)] = transformRateType(value);
          } else {
            payload[transformKey(key, index)] = value;
          }
        });
      });

      handlePairReleased();
      setDate(new Date().toLocaleDateString('en-CA'));
      createForeignCurrencyDealMutation.mutate(payload);
      return;
    } else {
      // In single mode, validate the form before submitting
      let isValid = await validateForm();
      if (!isValid) return;

      if (showRateError) {
        const officialRate =
          formValues.rate_type === 'direct_from'
            ? parseFloat(currencyRatesPair?.direct_rate)
            : parseFloat(currencyRatesPair?.reverse_rate);
        const minRange =
          formValues.rate_type === 'direct_from'
            ? parseFloat(currencyRatesPair?.direct_from)
            : parseFloat(currencyRatesPair?.reverse_from);
        const maxRange =
          formValues.rate_type === 'direct_from'
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

      payload = {
        ...formValues,
        ...createSCObject(),
        ...addedAttachments,
      };

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

      // Transform payload keys
      Object.entries(payload).forEach(([key, value]) => {
        if (key === 'voucher_date') {
          payload['voucher_date'] = date;
        } else {
          const transformedKey = transformKey(key, 0);
          payload[transformedKey] = value;
          delete payload[key];
        }
      });

      setDate(new Date().toLocaleDateString('en-CA'));
      handlePairReleased();
      createForeignCurrencyDealMutation.mutate(payload);
      return;
    }
  };

  const getSCValues = () => {
    // Prepare Special Commission values
    const currentBuyCurrencyId = formikRef.current?.values?.buy_fcy_dr_id;
    const currentBuyCurrencyName = formikRef.current?.values?.buy_fcy_dr_name;
    const currentBuyAmount = formikRef.current?.values?.buy_fcy_dr_amount;

    return {
      date: date,
      transaction_no: lastVoucherNumbers?.current,
      account:
        getAccountsByTypeOptions(formikRef?.current?.values.debit_ledger).find(
          (x) => x.value === formikRef?.current?.values.debit_ledger_account_id
        ) || '',
      currency:
        currencyOptions.find((x) => x.value === currentBuyCurrencyId) ||
        currentBuyCurrencyName ||
        '',
      currency_id: currentBuyCurrencyId || '',
      amount: currentBuyAmount || 0,
      ...addedSpecialCommissionValues,
      // Do not move the ledger field above the ...addedSpecialCommissionValues
      ledger:
        ledgerOptions.find(
          (x) => x.value === formikRef?.current?.values.debit_ledger
        ) || '',
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
  return (
    <>
      <div className="d-card">
        <Formik
          initialValues={{
            voucher_date: date,
            deal_type: newDealType,
            debit_ledger_initials: '',
            debit_ledger: '',
            debit_ledger_account_id: '',
            debit_ledger_account_name: '',
            credit_ledger_initials: '',
            credit_ledger: '',
            credit_ledger_account_id: '',
            credit_ledger_account_name: '',
            buy_fcy_dr_id: '',
            buy_fcy_dr_name: '',
            sell_fc_cr_id: '',
            sell_fc_cr_name: '',
            buy_fcy_dr_amount: '',
            sell_fc_cr_amount: '',
            net_total_currency_id: '',
            net_total_currency_name: '',
            net_total: '', // Commission Amount + Buy/Sell amout
            lcy_amount: '',
            base_rates: '',
            base_rate_currency_id: '',
            rate_type: 'direct_from',
            rate: '',
            commission_type: '',
            commission_currency_id: '',
            commission_currency_name: '',
            commission: '',
            narration: '',
            comment: '',
          }}
          innerRef={formikRef}
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
              setBaseRatesData(baseRateCurrencyRate, 'baseRateCurrencyRate');
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
                setFieldValue('commission', '');
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
              if (baseRateCurrencyRate?.rate) {
                setFieldValue('base_rates', baseRateCurrencyRate.rate);
              } else if (isLoadingBaseRateCurrencyRate) {
                setFieldValue('base_rates', '');
              } else if (
                baseRateCurrencyRate &&
                !isLoadingBaseRateCurrencyRate &&
                values.base_rate_currency_id
              ) {
                setFieldValue('base_rates', '');
                setMissingRateContext('base');
                setShowMissingCurrencyRateModal(true);
                setFieldValue('base_rate_currency_id', '');
              }
            }, [
              baseRateCurrencyRate?.rate,
              isLoadingBaseRateCurrencyRate,
              values.base_rate_currency_id,
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
                          isDisabled={isDisabled}
                          handleBlur={handleBlur}
                          placeholder1="Ledger"
                          placeholder2="Account"
                          onChange1={(selected) => {
                            setFieldValue('debit_ledger', selected.value);
                            // Reset selected account when ledger changes
                            setFieldValue('debit_ledger_account_id', '');
                            setFieldValue('debit_ledger_account_name', '');
                            setFieldValue('debit_ledger_initials', '');
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
                              setFieldValue(
                                'debit_ledger_initials',
                                ledgerOptions.find(
                                  (x) => x.value == values.debit_ledger
                                )?.label
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
                              setFieldValue('debit_ledger_initials', '');
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
                          isDisabled={isDisabled}
                          handleBlur={handleBlur}
                          placeholder1="Ledger"
                          placeholder2="Account"
                          onChange1={(selected) => {
                            setFieldValue('credit_ledger', selected.value);
                            // Reset selected account when ledger changes
                            setFieldValue('credit_ledger_account_id', '');
                            setFieldValue('credit_ledger_account_name', '');
                            setFieldValue('credit_ledger_initials', '');
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
                              setFieldValue(
                                'credit_ledger_initials',
                                ledgerOptions.find(
                                  (x) => x.value == values.credit_ledger
                                )?.label
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
                              setFieldValue('credit_ledger_initials', '');
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
                          isDisabled={isDisabled}
                          handleBlur={handleBlur}
                          placeholder1="Currency"
                          placeholder2="Amount"
                          inputType2="number"
                          onChange1={(selected) => {
                            setFieldValue('buy_fcy_dr_id', selected.value);
                            setFieldValue('buy_fcy_dr_name', selected.label);
                            setHasShownMissingRateModal(false);
                            setBuyCurrency(selected);
                            setBaseRateCurrency(selected.value); // Sync base rate currency state so range updates
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
                          isDisabled={isDisabled}
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
                            // Mark field as touched to show error immediately
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
                          isDisabled={isDisabled}
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
                          isDisabled={isDisabled}
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
                            isDisabled ||
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
                      <div className="col-12 col-sm-6 mb-2">
                        <CombinedInputs
                          label="Commission"
                          type1="select"
                          type2="input"
                          name1="commission_currency_id"
                          name2="commission"
                          value1={values.commission_currency_id}
                          value2={values.commission}
                          options1={getCommissionCurrencyOptions()}
                          // isfirstInputDisabled={true}
                          isDisabled={
                            isDisabled || addedSpecialCommissionValues
                          }
                          handleBlur={handleBlur}
                          placeholder1="Currency"
                          placeholder2="Amount"
                          inputType2="number"
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

                      <div className="col-12 col-sm-6 mb-4">
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
                          disabled={isDisabled}
                        />
                      </div>
                      {/* Comment */}
                      <div className="col-12 mb-2">
                        <CustomInput
                          name={'comment'}
                          label={'Comment'}
                          type={'textarea'}
                          placeholder={'Enter Comment'}
                          value={values.comment}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled={isDisabled}
                        />
                      </div>

                      {/* File Attachments */}
                      <div className="col-12 mb-3">
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
                                    accountName={selectedDebitLedgerAccount.label}
                                    balances={
                                      selectedDebitLedgerAccountBalance?.balances ||
                                      selectedDebitLedgerAccountBalance?.detail?.balances ||
                                      (Array.isArray(selectedDebitLedgerAccountBalance)
                                        ? selectedDebitLedgerAccountBalance
                                        : [])
                                    }
                                    loading={selectedDebitLedgerAccountBalance === undefined}
                                  />
                                )}
                              </div>
                              <div>
                                {/* Credit Account Balance */}
                                {selectedCreditLedgerAccount && (
                                  <AccountBalanceCard
                                    heading="Account Balance"
                                    accountName={selectedCreditLedgerAccount.label}
                                    balances={
                                      selectedCreditLedgerAccountBalance?.balances ||
                                      selectedCreditLedgerAccountBalance?.detail?.balances ||
                                      (Array.isArray(selectedCreditLedgerAccountBalance)
                                        ? selectedCreditLedgerAccountBalance
                                        : [])
                                    }
                                    loading={selectedCreditLedgerAccountBalance === undefined}
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
                    disabled={isDisabled || values.commission}
                  />
                </div>

                {/* Save Entry Button */}
                {newDealType === 'multi' && (
                  <div className="d-flex mb-45">
                    <CustomButton
                      type={'button'}
                      onClick={async () => {
                        let isValid = await validateForm();
                        if (!isValid) return;

                        if (showRateError || showBaseRateError) {
                          if (showRateError || showBaseRateError) {
                            showModal(
                              `${showRateError ? 'Rate Error' : 'Base Rate Error'}`,
                              `${showRateError ? 'Your selected rate is outside this range ' : 'your selected base rate is outside this range'}`,
                              () => closeModal(),
                              'error'
                            );
                            return;
                          }
                          return;
                        }
                        setMultiDealEntries([
                          ...multiDealEntries,
                          {
                            id: crypto.randomUUID(),
                            ...values,
                            ...createSCObject(),
                            ...addedAttachments,
                          },
                        ]);

                        formikRef.current.resetForm();
                        setBuyCurrency(null);
                        setSellCurrency(null);
                        setAddedAttachments({});
                        setAddedSpecialCommissionValues(null);
                      }}
                      text={'Save Entry'}
                      disabled={isDisabled}
                    />
                  </div>
                )}

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
                      readOnly={isDisabled}
                    />
                    <CustomCheckbox
                      label="Print"
                      checked={getPrintSettings('foreign_currency_deal')}
                      onChange={(e) => {
                        updatePrintSetting(
                          'foreign_currency_deal',
                          e.target.checked
                        );
                      }}
                      style={{ border: 'none', margin: 0 }}
                      readOnly={isDisabled}
                    />
                  </div>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
      {/* Multi Deal Entries table */}
      {newDealType === 'multi' && multiDealEntries.length > 0 && (
        <div className="mt-45">
          <CustomTable
            hasFilters={false}
            setFilters={false}
            headers={fCDMultiDealHeaders}
            isLoading={false}
            sortKey={false}
            sortOrder={false}
            handleSort={false}
            isPaginated={false}
          >
            <tbody>
              {multiDealEntries?.map((row, i) => (
                <tr key={row.id}>
                  <td>{i + 1}</td>
                  <td>{row.debit_ledger_initials || '-'}</td>
                  <td>{row.debit_ledger_account_name || '-'}</td>
                  <td>{row.credit_ledger_initials || '-'}</td>
                  <td>{row.credit_ledger_account_name || '-'}</td>
                  <td>{row.buy_fcy_dr_name || '-'}</td>
                  <td>{formatNumberWithCommas(row.buy_fcy_dr_amount || "-")}</td>
                  <td>{formatRateValue(row.rate || "-")}</td>
                  <td>{row.sell_fc_cr_name || '-'}</td>
                  <td>{formatNumberWithCommas(row.sell_fc_cr_amount || "-")}</td>
                  <td>{row.commission_type || row['[special_commission][commission_type]'] || "-"}</td>
                  <td>
                    {row.commission_currency_name ||
                      currencyOptions.find(
                        (x) =>
                          x.value == row['[special_commission][currency_id]']
                      )?.label || "-"}
                  </td>
                  <td>
                    {formatNumberWithCommas(
                      row.commission || row['[special_commission][total_commission]']
                    )}
                  </td>
                  <td>{row.narration || '-'}</td>
                  <td>{row['files[0]'] ? 'Yes' : 'No'}</td>
                  <td>
                    <TableActionDropDown
                      actions={[
                        {
                          name: 'Edit',
                          icon: HiOutlinePencilSquare,
                          onClick: () => {
                            formikRef.current.setValues(row);

                            // Update local states to keep UI synced with Formik values
                            if (row.buy_fcy_dr_id) {
                              setBuyCurrency(currencyOptions?.find((c) => c.value === row.buy_fcy_dr_id));
                            }
                            if (row.sell_fc_cr_id) {
                              setSellCurrency(currencyOptions?.find((c) => c.value === row.sell_fc_cr_id));
                            }
                            if (row.debit_ledger && row.debit_ledger_account_id) {
                              const account = getAccountsByTypeOptions(row.debit_ledger)?.find((a) => a.value === row.debit_ledger_account_id);
                              if (account) setSelectedDebitLedgerAccount({
                                value: account.value,
                                label: account.label,
                                accountType: row.debit_ledger,
                              });
                            }
                            if (row.credit_ledger && row.credit_ledger_account_id) {
                              const account = getAccountsByTypeOptions(row.credit_ledger)?.find((a) => a.value === row.credit_ledger_account_id);
                              if (account) setSelectedCreditLedgerAccount({
                                value: account.value,
                                label: account.label,
                                accountType: row.credit_ledger,
                              });
                            }
                            if (row.base_rate_currency_id) {
                              setBaseRateCurrency(row.base_rate_currency_id);
                            }

                            // Extract special commission and attachments flattened in the row
                            const scResult = {};
                            const attachments = {};
                            for (const key in row) {
                              if (key.startsWith('[special_commission]')) {
                                scResult[key] = row[key];
                              } else if (key.startsWith('files[')) {
                                attachments[key] = row[key];
                              }
                            }

                            if (Object.keys(scResult).length > 0) {
                              setAddedSpecialCommissionValues(parseSCObject(scResult));
                            } else {
                              setAddedSpecialCommissionValues(null);
                            }

                            setAddedAttachments(attachments);

                            setMultiDealEntries(
                              multiDealEntries.filter((x) => x.id !== row.id)
                            );
                          },
                          className: 'edit',
                        },
                        {
                          name: 'Delete',
                          icon: HiOutlineTrash,
                          onClick: () => {
                            setMultiDealEntries(
                              multiDealEntries.filter((x) => x.id !== row.id)
                            );
                          },
                          className: 'delete',
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </CustomTable>
        </div>
      )}

      <VoucherNavigationBar
        isDisabled={isDisabled}
        disableSubmit={newDealType === 'multi' && multiDealEntries.length === 0}
        actionButtons={[
          { text: 'Save', onClick: handleSubmit },
          {
            text: 'Cancel',
            onClick: handleResetForm,
            variant: 'secondaryButton',
          },
        ]}
        loading={createForeignCurrencyDealMutation.isPending}
        onAttachmentClick={() => setUploadAttachmentsModal(true)}
        lastVoucherNumbers={lastVoucherNumbers}
        setPageState={setPageState}
        setWriteTerm={setWriteTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* Upload Attachments Modal */}
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
              multiDealEntries,
              newDealType,
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

export default withModal(NewForeignCurrencyDeal);
