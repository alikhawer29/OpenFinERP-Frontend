import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import { useEffect, useRef, useState } from 'react';
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
  getAccountBalances,
  getCurrencyRatesPair,
  pairReleased,
} from '../../../Services/General';
import { createOutwardRemittance } from '../../../Services/Transaction/OutwardRemittance';
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
import { outwardRemittanceValidationSchema } from '../../../Utils/Validations/ValidationSchemas';
import SpecialCommission from '../SpecialCommission/SpecialCommission';
import ExchangeRatesCard from '../../../Components/ExchangeRatesCard/ExchangeRatesCard';
import { formatNumberWithCommas } from '../../../Utils/Helpers';

const OutwardRemittanceAdd = ({
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
  lastVoucherNumbers,
  restoreValuesFromStore,
  setRemittanceRegisterId,
  onSuccess,
  hasCreatePermission,
  hasBackToBackEntryPermission,
  hasPrintPermission,
  closeModal,
}) => {
  const navigate = useNavigate();

  // For getting print, account balance, and back to back checkbox state from BE
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
    clearFormValues,
    clearLastVisitedPage,
  } = useFormStore();

  const { user: { base_currency } = {} } = useUserStore(); // For LCy Field
  const queryClient = useQueryClient();
  const formId = 'new_outward_remittance';
  const settingsID = 'outward_remittance';

  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState(null);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [sendCurrency, setSendCurrency] = useState(null);
  const [againstCurrency, setAgainstCurrency] = useState(null);
  const [hasShownMissingRateModal, setHasShownMissingRateModal] =
    useState(false);
  const [outOfScope, setOutOfScope] = useState('');
  const [showVatOutOfScopeModal, setShowVatOutOfScopeModal] = useState(false);
  const [showUploadAttachmentsModal, setShowUploadAttachmentsModal] =
    useState(false);
  const [addedAttachments, setAddedAttachments] = useState([]);
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
  const { vatType, vatTermsOptions } = useVATTypes();

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

  const createOutwardRemittanceMutation = useMutation({
    mutationFn: createOutwardRemittance,
    onSuccess: (data) => {
      setRemittanceRegisterId(data?.detail?.outward_remittance?.id);
      showToast('Outward Remittance Created!', 'success');
      if (getPrintSettings(settingsID) && data?.detail?.pdf_url) {
        window.open(data.detail.pdf_url, '_blank');
      }
      queryClient.invalidateQueries(['outwardRemittanceListing']);
      handleResetForm();

      // Call parent success handler instead of internal navigation
      if (onSuccess) {
        onSuccess(data, getBackToBackSettings(settingsID));
      }
    },
    onError: (error) => {
      console.error('Error creating Outward Remittance', error);
      if (error.message == 'Voucher limit reached for this branch.') {
        showModal(
          'Cannot Create',
          'You have reached the maximum number of FSN. To create new transactions you need to increase the transaction count form the Transaction Number Register.',
          null,
          'error'
        );
      } else {
        showErrorToast(error);
      }
    },
  });

  // Fetch account balances for Ledger Account
  const { data: ledgerAccountBalance } = useQuery({
    queryKey: ['accountBalance', selectedLedgerAccount?.value, selectedLedgerAccount?.accountType],
    queryFn: () =>
      getAccountBalances(
        selectedLedgerAccount.value,
        selectedLedgerAccount.accountType
      ),
    enabled:
      !!selectedLedgerAccount?.value &&
      getAccountBalanceSettings('outward_remittance'),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

  // Fetch account balances for Mode Account (if needed)
  const [selectedModeAccount, setSelectedModeAccount] = useState(null);
  const [exchangeRatesInverse, setExchangeRatesInverse] = useState(false);

  const { data: modeAccountBalance } = useQuery({
    queryKey: ['accountBalance', selectedModeAccount?.value, selectedModeAccount?.accountType],
    queryFn: () =>
      getAccountBalances(
        selectedModeAccount.value,
        selectedModeAccount.accountType
      ),
    enabled:
      !!selectedModeAccount?.value &&
      getAccountBalanceSettings('outward_remittance'),
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
        setSelectedModeAccount(savedFormData?.selectedModeAccount);
        setAddedAttachments(savedFormData?.addedAttachments || []);
        setIsDisabled(false);
        clearFormValues(formId);
        clearLastVisitedPage(formId);
      }
    }
  }, [restoreValuesFromStore]);

  // BASE RATE: To update Rate field and show missing rate modal if base rate not present
  useEffect(() => {
    if (currencyRate?.rate) {
      formikRef.current?.setFieldValue('base_rate', currencyRate.rate);
      formikRef.current?.setFieldValue(
        'base_currency_code',
        currencyRate.local_currency
      );
    } else if (currencyRate && !isLoadingCurrencyRate) {
      setSendCurrency(null);
      formikRef.current.setFieldValue('rate', '');
      formikRef.current.setFieldValue('against_currency_id', '');
      setCurrencyToSelect(sendCurrency || '');
      setShowMissingCurrencyRateModal(true);
      setPairMissingCurrencyRateModal(false);
    }
  }, [currencyRate?.rate, isLoadingCurrencyRate]);

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
      // setAgainstCurrency(null);
      setCurrencyToSelect(sendCurrency || '');
      setShowMissingCurrencyRateModal(true);
      setPairMissingCurrencyRateModal(true);
      setHasShownMissingRateModal(true);
    } else if (currencyRatesPair?.direct_rate) {
      // Set rate and rate type based on current rate type
      const currentRateType = formikRef.current?.values?.rate_type || 'X';
      if (currentRateType === '/') {
        formikRef.current.setFieldValue(
          'rate',
          currencyRatesPair?.reverse_rate || currencyRatesPair?.direct_rate
        );
      } else {
        formikRef.current.setFieldValue('rate', currencyRatesPair?.direct_rate);
      }
    }
  }, [
    sendCurrency?.value,
    againstCurrency?.value,
    currencyRatesPair?.direct_rate,
    currencyRatesPair?.reverse_rate,
    hasShownMissingRateModal,
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
  const handleVatOutOfScope = (values) => {
    setOutOfScope(values.out_of_scope);
    // Set VAT terms to "Out of Scope" and VAT percentage to 0
    if (formikRef.current) {
      formikRef.current.setFieldValue('vat_terms', 'Out of Scope');
      formikRef.current.setFieldValue('vat_percentage', 0);
      formikRef.current.setFieldValue('vat_amount', 0);

      // Find the "Out of Scope" option and set its ID
      const outOfScopeOption = vatTermsOptions.find(
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

  //mutation for pair released
  const pairReleasedMutation = useMutation({
    mutationFn: pairReleased,
    onSuccess: (data) => {
      console.log(data?.message);
    },
    onError: (error) => {
      showErrorToast(error?.message);
    },
  });

  //pair id release
  const handlePairReleased = async () => {
    if (currencyRate) {
      pairReleasedMutation.mutate(currencyRate?.id);
    }
  };

  const handleResetForm = () => {
    handlePairReleased();
    if (formikRef.current) {
      formikRef.current.resetForm();
    }
    setSendCurrency(null);
    setAgainstCurrency(null);
    setSelectedBeneficiary(null);
    setSelectedLedgerAccount(null);
    setSelectedModeAccount(null);
    setAddedAttachments([]);
    setAddedSpecialCommissionValues(null);
    setIsDisabled(true);
    // Reset cheque detail state so next voucher with bank/PDC reopens the popup
    setChequeDetails(null);
    setShowAddChequeDetailModal(false);
    setIsSubmittingFromChequeModal(false);
  };
  const handleSubmit = async () => {
    if (!formikRef.current) return;

    // Check if rate is out of range before submission
    if (showRateError) {
      const officialRate = values.rate_type === '/' 
        ? parseFloat(currencyRatesPair?.reverse_rate)
        : parseFloat(currencyRatesPair?.direct_rate);
      const minRange = values.rate_type === '/'
        ? parseFloat(currencyRatesPair?.reverse_from)
        : parseFloat(currencyRatesPair?.direct_from);
      const maxRange = values.rate_type === '/'
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
      console.log('errors', errors);
      return; // Do not submit if there are errors
    }

    const formValues = formikRef.current.values;

    // Check if cheque details are required but not yet filled
    // Skip this check if we're submitting from the cheque modal
    if (
      !isSubmittingFromChequeModal &&
      (formValues.settle_thru === 'pdc' || formValues.settle_thru === 'bank') &&
      !chequeDetails
    ) {
      setShowAddChequeDetailModal(true);
      return;
    }

    let payload = {
      date,
      value_date: valueDate,
      ...formValues,
      ...addedAttachments,
      ...(outOfScope && {
        out_of_scope_reason: outOfScope,
      }),
      ...((formValues.settle_thru === 'pdc' ||
        formValues.settle_thru === 'bank') &&
        chequeDetails
        ? chequeDetails
        : {}), // Only including chequeDetails the user hasn't selected any other settle_thru after filling the form
      back_to_back: getBackToBackSettings(settingsID),
      // VAT payload structure - send null if vat_percentage is null/empty
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
          : formValues.vat_terms || '',
      vat_terms_id:
        formValues.vat_percentage === null ||
          formValues.vat_percentage === '' ||
          formValues.vat_percentage === undefined
          ? null
          : formValues.vat_terms_id || '',
    };

    // Flatten Special Commission like Receipt Voucher
    if (addedSpecialCommissionValues) {
      const scConverted = {};
      const sc = {
        transaction_no:
          lastVoucherNumbers?.current || lastVoucherNumbers?.last || '',
        date,
        ledger: formValues.ledger,
        account_id: formValues.account_id,
        currency_id: formValues.send_fc_id,
        amount: formValues.send_amount,
        ...addedSpecialCommissionValues,
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

    handlePairReleased();
    createOutwardRemittanceMutation.mutate(payload);
  };

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

  const getCurrency = (currency_id) => {
    const currency = currencyOptions?.find(
      (item) => item?.value == currency_id
    );
    return currency?.label;
  };

  return (
    <>
      <div className="d-card">
        <Formik
          initialValues={{
            reference_no: '',
            ledger: '',
            account_id: '',
            beneficiary_id: '',
            by_order: '',
            send_fc_id: '',
            send_amount: '',
            against_currency_id: '',
            against_amount: '',
            rate_type: 'X',
            rate: '',
            currency_charges: '',
            currency_charges_amount: '', // rate * commission
            vat_type: '', // fixed or variable
            vat_percentage: '', // Percentage
            vat_terms_id: '', // id of the vat terms (Standard, Exempted, Out of Scope, etc.)
            vat_terms: '', // label of the vat terms (Standard Rate - 5.00%, Exempted, etc.)
            vat_amount: '', // amount of the vat
            net_total: '', // Against Amount + Charges + VAT Amount
            base_rate: '',
            lcy_amount: '',
            settle_thru: '',
          }}
          validationSchema={outwardRemittanceValidationSchema(base_currency)}
          innerRef={formikRef}
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

              let againstAmount;
              if (values.rate_type === '/') {
                againstAmount = sendAmount / parseFloat(rate);
              } else {
                againstAmount = sendAmount * parseFloat(rate);
              }

              setFieldValue('against_amount', againstAmount);
            }, [values.send_amount, values.rate, values.rate_type]);

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

            // Auto-set fixed VAT percentage when VAT type is fixed
            useEffect(() => {
              if (vatType?.vat_type === 'fixed' && vatType?.vat_percentage) {
                const fixedVatPercentage = parseFloat(vatType.vat_percentage);
                setFieldValue('vat_type', 'fixed');
                setFieldValue('vat_percentage', fixedVatPercentage);
                setFieldValue('vat_terms_id', null); // Clear variable term
                setFieldValue('vat_terms', 'Fixed'); // Set "Fixed" as the label for fixed VAT type
              }
            }, [vatType?.vat_type, vatType?.vat_percentage]);

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

            // Calculates VAT on commission amount only (currency charges or special commission)
            useEffect(() => {
              const currencyChargesAmount =
                parseFloat(values.currency_charges_amount) || 0;
              const specialCommissionAmount =
                addedSpecialCommissionValues?.total_commission
                  ? parseFloat(addedSpecialCommissionValues.total_commission) ||
                  0
                  : 0;
              const vatPercentage = parseFloat(values.vat_percentage) || 0;

              // If vat_percentage is null, empty, or undefined, set VAT amount to 0
              if (
                values.vat_percentage === null ||
                values.vat_percentage === '' ||
                values.vat_percentage === undefined
              ) {
                setFieldValue('vat_amount', 0);
                return;
              }

              // Check if VAT amount should be 0 based on VAT terms
              let vatAmount = 0;
              if (shouldVatAmountBeZero(values.vat_terms)) {
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
              addedSpecialCommissionValues?.total_commission,
            ]);

            // Recalculate Special Commission when send_amount or against_amount changes
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
                          placeholder={'Enter Reference Number'}
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
                          isSecondInputDisabled={false}
                          isDisabled={isDisabled}
                          handleBlur={handleBlur}
                          placeholder2="Rate"
                          inputType2="number"
                          inputProps2={{
                            inputClass: `rate-field ${showRateError ? 'text-danger' : ''
                              }`,
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
                          label={`${sendCurrency?.label
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
                              setFieldTouched('vat_terms_id', true);
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
                          label={`${againstCurrency?.label
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
                      {vatType?.vat_type === 'fixed' && (
                        <div className="col-12 col-sm-6 mb-3">
                          <CustomInput
                            name={'vat_percentage'}
                            label={'VAT %'}
                            type={'number'}
                            disabled={true}
                            placeholder={'Enter VAT Percentage'}
                            value={values.vat_percentage || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                        </div>
                      )}
                      {vatType?.vat_type === 'variable' && (
                        <div className="col-12 col-sm-6 mb-45">
                          <SearchableSelect
                            name={'vat_terms_id'}
                            label={'VAT %'}
                            options={vatTermsOptions}
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
                                setOutOfScope('');
                                // For variable VAT, store the selected option as vat_terms
                                const vatTerms = selected?.title ?? '';
                                const vatPercentage =
                                  selected?.percentage ?? '';
                                setFieldValue('vat_terms', vatTerms);
                                setFieldValue('vat_terms_id', selected.id); // Store VAT terms ID

                                // Set VAT percentage to 0 for exempted/zero rate/out of scope conditions
                                if (shouldVatAmountBeZero(vatTerms)) {
                                  setFieldValue('vat_percentage', 0);
                                } else {
                                  setFieldValue(
                                    'vat_percentage',
                                    vatPercentage
                                  );
                                }
                                setFieldValue('vat_type', 'variable');
                              }
                            }}
                            onBlur={handleBlur}
                            error={
                              touched.currency_charges &&
                              errors.currency_charges
                            }
                          />
                          <ErrorMessage
                            name="vat_terms_id"
                            component="div"
                            className="input-error-message text-danger"
                          />
                        </div>
                      )}

                      {/* VAT Currency and Amount */}
                      <div className="col-12 col-sm-6 mb-3">
                        <CombinedInputs
                          label="VAT Amount"
                          type1="input"
                          type2="input"
                          name2="vat_amount"
                          inputType2="number"
                          value1={againstCurrency?.label}
                          value2={
                            formatNumberForDisplay(values.vat_amount) || '0'
                          }
                          isDisabled={true}
                          handleBlur={handleBlur}
                          placeholder1="Currency"
                          placeholder2="VAT Amount"
                        />
                        <ErrorMessage
                          name="vat_amount"
                          component="div"
                          className="input-error-message text-danger"
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
                          label={'Base Rate'}
                          placeholder={'Rate'}
                          disabled={isDisabled}
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

                            // Set mode account based on settle_thru selection
                            if (e.value === 'cash') {
                              setSelectedModeAccount({
                                value: 'cash',
                                label: 'Cash',
                                accountType: 'cash',
                              });
                            } else if (
                              e.value === 'bank' ||
                              e.value === 'pdc'
                            ) {
                              // You might want to add a mode account selection here
                              // For now, we'll just set a placeholder
                              setSelectedModeAccount({
                                value: 'bank',
                                label: 'Bank Account',
                                accountType: 'bank',
                              });
                            }
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
                          text={`${!!addedSpecialCommissionValues ? 'Edit' : 'Add'
                            } Special Commission`}
                          disabled={!!values.currency_charges || isDisabled}
                        />
                      </div>
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
                              (x) =>
                                x.value ==
                                (addedSpecialCommissionValues?.currency_id ||
                                  values.commission_currency_id)
                            )?.label
                          }{' '}
                          {formatNumberWithCommas(
                            addedSpecialCommissionValues?.total_commission
                          )}{' '}
                          on{' '}
                          {
                            currencyOptions.find(
                              (x) =>
                                x.value ==
                                (addedSpecialCommissionValues?.currency_id ==
                                  values.against_currency_id
                                  ? values.against_currency_id
                                  : values.send_currency_id)
                            )?.label
                          }{' '}
                          {formatNumberWithCommas(
                            addedSpecialCommissionValues?.currency_id ==
                              values.against_currency_id
                              ? values.against_amount
                              : values.send_amount
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
                          {/* Ledger Account Balance */}
                          {selectedLedgerAccount?.value && values.account_id && (
                            <AccountBalanceCard
                              heading="Account Balance"
                              accountName={selectedLedgerAccount?.label}
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
                          {/* Mode Account Balance */}
                          {selectedModeAccount?.value && (
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
                          <div className="mb-3">
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
                      )}
                      {/* Remitter */}
                      <div>
                        <CustomInput
                          name={'remitter'}
                          type={'text'}
                          disabled={true}
                          label={'Remitter'}
                          placeholder={'Enter Remitter'}
                          value={selectedLedgerAccount?.title || ''}
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
                  onRemoveFile={handleRemoveFile}
                />
                {/* Print and Account Balance Checkboxes */}
                <div className="row">
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
                    {hasBackToBackEntryPermission && (
                      <CustomCheckbox
                        label="Back to Back Entry"
                        checked={getBackToBackSettings(settingsID)}
                        disabled={isDisabled}
                        style={{ border: 'none', margin: 0 }}
                        onChange={(e) => {
                          updateBackToBackSetting(settingsID, e.target.checked);
                        }}
                        readOnly={isDisabled}
                      />
                    )}
                    {hasPrintPermission && (
                      <CustomCheckbox
                        label="Print"
                        checked={getPrintSettings(settingsID)}
                        onChange={(e) => {
                          updatePrintSetting(settingsID, e.target.checked);
                        }}
                        style={{ border: 'none', margin: 0 }}
                        readOnly={isDisabled}
                      />
                    )}
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
            text: 'Save',
            onClick: handleSubmit,
            loading: createOutwardRemittanceMutation.isPending,
            disabled: !hasCreatePermission,
          },
          {
            text: 'Cancel',
            onClick: handleResetForm,
            variant: 'secondaryButton',
          },
        ]}
        loading={createOutwardRemittanceMutation.isPending}
        onAttachmentClick={() => setShowUploadAttachmentsModal(true)}
        lastVoucherNumbers={lastVoucherNumbers}
        setPageState={setPageState}
        setWriteTerm={setWriteTerm}
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
          preFilledValues={{
            date,
            transaction_no:
              lastVoucherNumbers?.current || lastVoucherNumbers?.last || '',
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
          isEdit={false}
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

      {/* Upload Attachments Modal */}
      <CustomModal
        show={showUploadAttachmentsModal}
        close={() => setShowUploadAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          uploadOnly
          getUploadedFiles={setAddedAttachments}
          closeUploader={() => setShowUploadAttachmentsModal(false)}
        />
      </CustomModal>

      {/* VAT Out Of Scope Modal  */}
      <CustomModal
        show={showVatOutOfScopeModal}
        close={() => {
          formikRef.current.setFieldValue('vat_percentage', '');
          formikRef.current.setFieldValue('vat_terms_id', '');
          formikRef.current.setFieldValue('vat_terms', '');
          setShowVatOutOfScopeModal(false);
        }}
        hideClose={true}
      >
        <div className="text-center mb-3 mt-5">
          <h4 className="modalTitle px-5">Out Of Scope</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{ out_of_scope: '' }}
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
                      formikRef.current.setFieldValue('vat_percentage', '');
                      formikRef.current.setFieldValue('vat_terms_id', '');
                      formikRef.current.setFieldValue('vat_terms', '');
                    }}
                  />
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </CustomModal>

      {/* Add Cheque Detail Modal */}
      <CustomModal
        show={!!showAddChequeDetailModal}
        close={() => setShowAddChequeDetailModal(false)}
        size="lg"
        closeOnOutsideClick={false}
      >
        <ChequeDetailForm
          voucherDate={date}
          settleThru={formikRef?.current?.values?.settle_thru}
          inPopup
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

            // Auto-submit the main form after cheque details are saved
            setIsSubmittingFromChequeModal(true);

            // Use a longer timeout to ensure state updates are complete
            setTimeout(async () => {
              // Sync date prop with Formik values
              const errors = await formikRef.current.validateForm();
              if (Object.keys(errors).length > 0) {
                // Mark all fields as touched to show errors
                formikRef.current.setTouched(
                  Object.keys(errors).reduce((acc, key) => {
                    acc[key] = true;
                    return acc;
                  }, {})
                );
                setIsSubmittingFromChequeModal(false);
                return;
              }

              // Create the payload directly and submit
              const formValues = formikRef.current.values;
              let payload = {
                date,
                value_date: valueDate,
                ...formValues,
                ...addedAttachments,
                ...(outOfScope && {
                  out_of_scope_reason: outOfScope,
                }),
                ...chequeData, // Include the cheque details
                ...chequeData, // Include the cheque details
                back_to_back: getBackToBackSettings(settingsID),
                // VAT payload structure - send null if vat_percentage is null/empty
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
                    : formValues.vat_terms || '',
                vat_terms_id:
                  formValues.vat_percentage === null ||
                    formValues.vat_percentage === '' ||
                    formValues.vat_percentage === undefined
                    ? null
                    : formValues.vat_terms_id || '',
              };

              // Flatten Special Commission like Receipt Voucher
              if (addedSpecialCommissionValues) {
                const scConverted = {};
                const sc = {
                  transaction_no:
                    lastVoucherNumbers?.current ||
                    lastVoucherNumbers?.last ||
                    '',
                  date,
                  ledger: formValues.ledger,
                  account_id: formValues.account_id,
                  currency_id: formValues.send_fc_id,
                  amount: formValues.send_amount,
                  ...addedSpecialCommissionValues,
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

              // Submit directly without going through handleSubmit
              createOutwardRemittanceMutation.mutate(payload);

              // Reset the flag after submission
              setTimeout(() => {
                setIsSubmittingFromChequeModal(false);
              }, 1000);
            }, 200);
          }}
          onCancel={() => setShowAddChequeDetailModal(false)}
        />
      </CustomModal>

      {/* Missing Currency Rate Modal */}
      <CustomModal
        show={showMissingCurrencyRateModal}
        close={() => setShowMissingCurrencyRateModal(false)}
        title={'Missing Rate of Exchange'}
        description={`${pairMissingCurrencyRateModal
            ? `Exchange rate not defined for the selected ${getCurrency(
              sendCurrency?.value
            )} - ${getCurrency(
              againstCurrency?.value
            )} currency pair.Please update the Rate of Exchange Register.`
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
            selectedModeAccount,
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

export default withModal(OutwardRemittanceAdd);
