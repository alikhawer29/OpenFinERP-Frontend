import { useMutation, useQuery } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import { useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import AccountBalanceCard from '../../../Components/AccountBalanceCard/AccountBalanceCard';
import CombinedInputs from '../../../Components/CombinedInputs/CombinedInputs';
import CustomButton from '../../../Components/CustomButton';
import CustomCheckbox from '../../../Components/CustomCheckbox/CustomCheckbox';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import ExchangeRatesCard from '../../../Components/ExchangeRatesCard/ExchangeRatesCard';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast';
import withModal from '../../../HOC/withModal';
import useAccountsByType from '../../../Hooks/useAccountsByType';
import useCurrencyRate from '../../../Hooks/useCurrencyRate';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useVATTypes } from '../../../Hooks/useVATTypes';
import {
  getAccountBalances,
  getCurrencyRatesPair,
  getExchangeRates,
} from '../../../Services/General';
import {
  allocationOutwardRemittance,
  officeLocation,
  viewRemittanceRegister,
} from '../../../Services/Transaction/OutwardRemittance';
import useFormStore from '../../../Stores/FormStore';
import useSettingsStore from '../../../Stores/SettingsStore';
import useUserStore from '../../../Stores/UserStore';
import {
  getCurrencyOptions,
  isNullOrEmpty,
  showErrorToast,
} from '../../../Utils/Utils';
import { formatRateValue } from '../../../Utils/Helpers';

const OutwardRemittanceAllocation = ({
  isDisabled = false,
  setIsDisabled,
  setShowAddLedgerModal,
  setShowMissingCurrencyRateModal,
  setPairMissingCurrencyRateModal,
  setPageState,
  remittanceRegisterId = null,
  onFormDataChange,
  restoreValuesFromStore,
  onSuccess,
  showModal,
  hasCreatePermission,
}) => {
  usePageTitle('Outward Remittance Allocation');
  const formikRef = useRef();
  const sigCanvas = useRef(null);
  const [trimmedDataURL, setTrimmedDataURL] = useState(null);
  const { getAccountsByTypeOptions } = useAccountsByType();
  const currencyOptions = getCurrencyOptions();
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [selectedCurrencyTitle, setSelectedCurrencyTitle] = useState(null);
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState(null);
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [showVatOutOfScopeModal, setShowVatOutOfScopeModal] = useState(false);
  const [outOfScope, setOutOfScope] = useState('');
  const [exchangeRatesInverse, setExchangeRatesInverse] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [errorSignature, setErrorSignature] = useState(false);
  const [showRateError, setShowRateError] = useState(false);
  const [showBaseRateError, setShowBaseRateError] = useState(false);

  const { vatType, vatTermsOptions } = useVATTypes();
  const { getAccountBalanceSettings, updateAccountBalanceSetting } =
    useSettingsStore();
  const { user: { base_currency } = {} } = useUserStore();
  const formId = 'outward_remittance_allocation';
  const settingsID = 'outward_remittance';

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

  // Access the form store
  const { getFormValues, clearFormValues, clearLastVisitedPage } =
    useFormStore();

  // Map backend rate_type values to UI/internal values
  const mapIncomingRateType = (rateType) => {
    if (rateType === 'X') return 'X';
    if (rateType === '/') return '/';
    return rateType || 'X';
  };

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

  // Account balances for Ledger and Mode accounts
  const { data: ledgerAccountBalance } = useQuery({
    queryKey: ['accountBalance', selectedLedgerAccount?.value],
    queryFn: () =>
      getAccountBalances(
        selectedLedgerAccount.value,
        selectedLedgerAccount.accountType
      ),
    enabled: !!selectedLedgerAccount?.value,
    staleTime: 0,
    retry: 1,
  });

  // Notify parent of form data changes (for saving before navigation)
  useEffect(() => {
    if (onFormDataChange && formikRef.current) {
      onFormDataChange({
        values: formikRef.current.values,
      });
    }
  }, [formikRef.current?.values, onFormDataChange]);

  // Restore form data from store for Rate of Exchange flow
  useEffect(() => {
    if (restoreValuesFromStore) {
      const savedFormData = getFormValues(formId);
      if (savedFormData && formikRef?.current) {
        formikRef.current.setValues(savedFormData.values || {});
        setIsDisabled(false);
        clearFormValues(formId);
        clearLastVisitedPage(formId);
      }
    }
  }, [restoreValuesFromStore]);

  function clear() {
    sigCanvas.current.clear();
    setTrimmedDataURL(null);
    setErrorSignature(false);
  }

  function trim() {
    setTrimmedDataURL(sigCanvas.current.toDataURL());
    setErrorSignature(false);
  }

  // Queries and Mutations
  const {
    data: queryOutwardRemittanceData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['viewRemittanceRegister', remittanceRegisterId],
    queryFn: () => viewRemittanceRegister(remittanceRegisterId),
    enabled: !!remittanceRegisterId,
    retry: 1,
  });



  const sourceData = queryOutwardRemittanceData;

  const handleSubmit = async () => {
    setAttemptedSubmit(true);

    const formValuesForValidation = formikRef.current?.values || {};

    // Exchange rate & base rate range validation (similar to Edit)
    let hasRateError = false;
    let hasBaseRateError = false;

    const rateValue = parseFloat(formValuesForValidation.rate);
    const officialRate = parseFloat(currencyRatesPair?.direct_rate);

    if (rateValue && officialRate && currencyRatesPair) {
      const minRange = parseFloat(
        currencyRatesPair?.direct_from
      );
      const maxRange = parseFloat(
        currencyRatesPair?.direct_upto
      );

      hasRateError = rateValue < minRange || rateValue > maxRange;
      setShowRateError(hasRateError);

      if (hasRateError) {
        showModal(
          'Exchange Rate Control',
          <>
            Exchange Rate for {sourceData?.fc_currency?.currency_code}/
            {selectedCurrencyTitle} is {formatRateValue(officialRate)}
            <br />
            Acceptable range is from {formatRateValue(minRange)} to{' '}
            {formatRateValue(maxRange)}
            <br />
            Your selected rate is outside this range
          </>,
          null,
          'error'
        );
      }
    } else {
      setShowRateError(false);
    }

    const baseRateValue = parseFloat(formValuesForValidation.base_rates);
    const officialBaseRate = parseFloat(currencyRate?.rate);

    if (baseRateValue && officialBaseRate) {
      const minBaseRange = officialBaseRate * 0.99;
      const maxBaseRange = officialBaseRate * 1.01;
      hasBaseRateError =
        baseRateValue < minBaseRange || baseRateValue > maxBaseRange;

      setShowBaseRateError(hasBaseRateError);

      if (hasBaseRateError) {
        showModal(
          'Exchange Rate Control',
          <>
            Exchange Rate for Base Rate is {formatRateValue(officialBaseRate)}
            <br />
            Acceptable range is from {formatRateValue(minBaseRange)} to{' '}
            {formatRateValue(maxBaseRange)}
            <br />
            your selected base rate is outside this range
          </>,
          null,
          'error'
        );
      }
    } else {
      setShowBaseRateError(false);
    }

    if (hasRateError || hasBaseRateError) {
      return;
    }

    // Validate form using Formik
    const errors = await formikRef.current.validateForm();

    // Enhanced VAT validation: If commission is used, VAT must be properly configured
    const formValues = formikRef.current.values;
    const hasCommissionValue = () => {
      const commission = parseFloat(formValues.commission || 0);
      const commissionAmount = parseFloat(formValues.commission_amount || 0);
      return commission > 0 || commissionAmount > 0;
    };

    if (Object.keys(errors).length > 0) {
      formikRef.current.setTouched(
        Object.keys(errors).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {})
      );
      return;
    }

    const payload = {
      ...formValues,
      signature: trimmedDataURL,
      ...(outOfScope && {
        out_of_scope_reason: outOfScope,
      }),
      // VAT payload structure matching OutwardRemittanceAdd
      vat_type: vatType?.vat_type || '',
      vat_terms: formValues.vat_terms || '',
      vat_terms_id: formValues.vat_terms_id || '',
    };
    createAllocationMutation.mutate(payload);
  };

  // Mutation: Pay Inward Payment
  const createAllocationMutation = useMutation({
    mutationFn: (formData) =>
      allocationOutwardRemittance(remittanceRegisterId, formData),
    onSuccess: (data) => {
      showToast('Outward Remittance Allocated Successfully!', 'success');
      if (onSuccess) {
        onSuccess(data);
      } else {
      }
    },
    onError: (error) => {
      showErrorToast('Error during allocation:', error?.message);
      if (error?.message == 'Voucher limit reached for this branch.') {
        showModal(
          'Cannot Allocate',
          'You have reached the maximum number of FBN. To create new transactions you need to increase the transaction count form the Transaction Number Register.',
          null,
          'error'
        );
      } else {
        showErrorToast(error);
      }
    },
  });

  // Office Location fetching
  const {
    data: officeLocationData,
    isLoading: isLoadingOfficeLocations,
    isError: isErrorOfficeLocations,
    error: errorOfficeLocations,
  } = useQuery({
    queryKey: ['officeLocation'],
    queryFn: () => officeLocation(),
    retry: 1,
  });

  const getOfficeLocationOptions = () => {
    if (isLoadingOfficeLocations) {
      return [{ label: 'Loading...', value: null, isDisabled: true }];
    }

    if (isErrorOfficeLocations) {
      showErrorToast('Unable to fetch Office Locations', errorOfficeLocations);
      return [{ label: 'Unable to fetch Office Locations', value: null }];
    }

    let options =
      officeLocationData?.map((x) => ({
        value: x?.id,
        label: x?.office_location,
      })) || [];

    return options;
  };

  // Fetch dual currency rate for the selected Currency and against currency
  const { data: currencyRatesPair, isLoading: isLoadingCurrencyRatesPair } =
    useQuery({
      queryKey: [
        'dual-currency-rate',
        sourceData?.fc_currency?.id, // Currency 1
        selectedCurrency, // Against Currency  2
        date,
        'buy', // Deal type (buy/sell)
      ],
      queryFn: () =>
        getCurrencyRatesPair(
          sourceData?.fc_currency?.id,
          selectedCurrency,
          date,
          'buy'
        ),
      enabled: !!selectedCurrency && !!sourceData?.fc_currency?.id,
    });

  //for base rates
  const { data: currencyRate, isLoading: isLoadingCurrencyRate } =
    useCurrencyRate(selectedCurrency, date, {
      enabled:
        !!selectedCurrency &&
        !isLoadingCurrencyRatesPair &&
        !!currencyRatesPair?.direct_rate,
    });

  useEffect(() => {
    if (currencyRate?.rate) {
      formikRef.current?.setFieldValue('base_rates', currencyRate.rate);
      formikRef.current?.setFieldValue(
        'base_currency_code',
        currencyRate.local_currency
      );
      // Set base_currency_id from the currency rate data or fallback to source data
      if (currencyRate.base_currency_id) {
        formikRef.current?.setFieldValue(
          'base_currency_id',
          currencyRate.base_currency_id
        );
      } else if (sourceData?.base_currency_id) {
        formikRef.current?.setFieldValue(
          'base_currency_id',
          sourceData.base_currency_id
        );
      }
    } else if (currencyRate && !isLoadingCurrencyRate) {
      setSelectedCurrency('');
      setSelectedCurrencyTitle('');
      formikRef.current.setFieldValue('rate', '');
      formikRef.current.setFieldValue('against_currency_id', '');
      setShowMissingCurrencyRateModal(true);
      setPairMissingCurrencyRateModal(false);
    }
  }, [currencyRate?.rate, isLoadingCurrencyRate]);

  // Set base_currency_id from source data when available
  useEffect(() => {
    if (sourceData?.base_currency_id && formikRef.current) {
      formikRef.current.setFieldValue(
        'base_currency_id',
        sourceData.base_currency_id
      );
    }
  }, [sourceData?.base_currency_id]);

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

  return (
    <div className="d-card">
      <Formik
        innerRef={formikRef}
        enableReinitialize={true}
        initialValues={{
          reference_number: sourceData?.reference_no || '',
          selling_no: sourceData?.voucher?.voucher_no || '',
          beneficiary: sourceData?.beneficiary?.name || '',
          remitter:
            sourceData?.remittance_details?.customer_name ||
            sourceData?.remittance_details?.account_title ||
            '',
          date: sourceData?.date || '',
          buy_amount: sourceData?.balance_amount || '',
          buy_currency_id: sourceData?.fc_currency?.id || '', //buy currency
          tt_amount_currency_code: sourceData?.fc_currency?.currency_code || '',
          tt_amount: sourceData?.balance_amount || '',
          send_amount:
            sourceData?.balance_amount || sourceData?.send_amount || '',
          againts_currency: sourceData?.againts_currency?.currency_code || '',
          rate_type: mapIncomingRateType(sourceData?.rate_type),
          ledger: '',
          account_id: '',
          against_currency_id: '',
          against_amount: '',
          rate: sourceData?.rate ? Number(sourceData.rate).toFixed(8) : '',
          currency_charges: '',
          vat_type: vatType?.vat_type === 'fixed' ? 'fixed' : 'variable', // fixed or variable
          vat_percentage:
            vatType?.vat_type === 'fixed'
              ? vatType?.vat_percentage || '0'
              : '0',
          vat_terms_id: '', // id of the vat terms (Standard, Exempted, Out of Scope, etc.)
          vat_terms: '', // VAT terms label
          vat_amount: '', // amount of the vat
          net_total: '',
          base_rates: sourceData?.base_rate ? Number(sourceData.base_rate).toFixed(8) : '',
          base_currency_id: sourceData?.base_currency_id || '',
          lcy_amount: '',
          signature: '',
          office_location_id: '',
          out_of_scope_reason: '',
          base_currency_code: '',
        }}
        validate={(values) => {
          const errors = {};

          // Helper function to check if commission is applied
          const hasCommissionValue = () => {
            const commission = parseFloat(values.commission || 0);
            const commissionAmount = parseFloat(values.commission_amount || 0);
            return commission > 0 || commissionAmount > 0;
          };

          // Required fields validation
          if (!values.ledger) {
            errors.ledger = 'Ledger is required';
          } else if (!values.account_id) {
            errors.account_id = 'Account is required';
          }

          if (!values.buy_amount) {
            errors.buy_amount = 'Buy Amount is required';
          } else if (parseFloat(values.buy_amount) <= 0) {
            errors.buy_amount = 'Buy Amount must be greater than 0';
          }

          if (!values.against_currency_id) {
            errors.against_currency_id = 'Against Currency is required';
          }

          if (!values.rate) {
            errors.rate = 'Rate is required';
          }

          if (!values.base_rates) {
            errors.base_rates = 'Base Rate is required';
          }

          // Enhanced VAT validation - only required if commission is used
          if (hasCommissionValue()) {
            if (vatType?.vat_type === 'variable') {
              if (!values.vat_terms_id) {
                errors.vat_terms = 'VAT % is required';
              }
            }
            // VAT Amount is required when commission is applied
            if (!values.vat_amount || values.vat_amount === '') {
              errors.vat_amount = 'VAT Amount is required';
            }
            // For fixed VAT type, the percentage is already set from vatType
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
        }) => {
          useEffect(() => {
            if (!selectedCurrency || !sourceData?.fc_currency?.id) return;

            if (
              currencyRatesPair?.direct_rate !== undefined &&
              currencyRatesPair?.direct_rate !== null
            ) {
              setFieldValue('rate', currencyRatesPair.direct_rate);
              setShowMissingCurrencyRateModal(false); // close if previously opened
            } else if (
              !isLoadingCurrencyRatesPair &&
              !isNullOrEmpty(currencyRatesPair)
            ) {
              setSelectedCurrency('');
              setFieldValue('rate', '');
              setSelectedCurrencyTitle('');
              setFieldValue('against_currency_id', '');
              setPairMissingCurrencyRateModal(true);
              setShowMissingCurrencyRateModal(true); // only show when loading is done
            }
          }, [
            currencyRate,
            currencyRatesPair,
            selectedCurrency,
            sourceData?.fc_currency?.id,
            isLoadingCurrencyRatesPair,
          ]);

          useEffect(() => {
            const rate = parseFloat(values.rate || 0);
            const buyAmount = parseFloat(values.buy_amount || 0);

            if (!isNaN(rate) && !isNaN(buyAmount)) {
              const result = rate * buyAmount;
              setFieldValue('against_amount', result.toFixed(2)); // update `amount` or any field
            }
          }, [values.rate, values.buy_amount]);

          // Auto-set fixed VAT percentage when VAT type is fixed
          useEffect(() => {
            if (vatType?.vat_type === 'fixed' && vatType?.vat_percentage) {
              const fixedVatPercentage = parseFloat(vatType?.vat_percentage);
              setFieldValue('vat_type', 'fixed');
              setFieldValue('vat_percentage', fixedVatPercentage);
              setFieldValue('vat_terms_id', null); // Clear variable term
              setFieldValue('vat_terms', 'Fixed'); // Set "Fixed" as the label for fixed VAT type
            }
          }, [vatType?.vat_type, vatType?.vat_percentage, setFieldValue]);

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
          }, [values.vat_percentage, setFieldValue]);

          // Calculates VAT and Net Total correctly (matching Foreign Currency logic)
          useEffect(() => {
            const sendAmount = parseFloat(values.send_amount) || 0;
            const currencyChargesAmount =
              parseFloat(values.currency_charges) || 0;
            const commissionAmount = parseFloat(values.commission_amount) || 0;
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

            // Helper function to check if commission is applied
            const hasCommissionValue = () => {
              const commission = parseFloat(values.commission || 0);
              const commissionAmt = parseFloat(values.commission_amount || 0);
              return commission > 0 || commissionAmt > 0;
            };

            // Check if VAT amount should be 0 based on VAT terms
            let vatAmount = 0;
            if (shouldVatAmountBeZero(values.vat_terms)) {
              vatAmount = 0;
            } else if (
              hasCommissionValue() &&
              commissionAmount &&
              vatPercentage
            ) {
              // Calculate VAT on commission amount when commission is applied
              vatAmount = (commissionAmount * vatPercentage) / 100;
            } else if (currencyChargesAmount && vatPercentage) {
              vatAmount = (currencyChargesAmount * vatPercentage) / 100;
            } else if (
              sendAmount &&
              vatPercentage &&
              !currencyChargesAmount &&
              !hasCommissionValue()
            ) {
              // For Standard Rate, calculate VAT on the send amount when no currency charges
              vatAmount = (sendAmount * vatPercentage) / 100;
            }

            setFieldValue('vat_amount', vatAmount);
          }, [
            values.send_amount,
            values.currency_charges,
            values.commission_amount,
            values.commission,
            values.vat_percentage,
            values.vat_terms,
            setFieldValue,
          ]);

          useEffect(() => {
            if (!values.vat_amount && !values.against_amount)
              setFieldValue('net_total', '');
            const vatAmount = parseFloat(values.vat_amount) || 0;
            const againstAmount = parseFloat(values.against_amount) || 0;
            const currencyChargesAmount =
              parseFloat(values.currency_charges) || 0;
            const commissionAmount = parseFloat(values.commission_amount) || 0;
            const netTotal =
              againstAmount +
              currencyChargesAmount +
              commissionAmount +
              vatAmount;
            setFieldValue('net_total', netTotal);
          }, [
            values.vat_amount,
            values.currency_charges,
            values.commission_amount,
            values.against_amount,
            setFieldValue,
          ]);

          useEffect(() => {
            const rate = parseFloat(values.rate || 0);
            const commissionAmount = parseFloat(values.commission_amount || 0);

            if (!isNaN(rate) && !isNaN(commissionAmount)) {
              const result = rate * commissionAmount;
              setFieldValue('currency_charges', result.toFixed(2)); // update `amount` or any field
            }
          }, [values.rate, values.commission_amount]);

          // Calculates VAT and Net Total correctly (matching OutwardRemittanceAdd logic)
          useEffect(() => {
            // Helper function to check if commission is applied
            const hasCommissionValue = () => {
              const commission = parseFloat(values.commission || 0);
              const commissionAmount = parseFloat(
                values.commission_amount || 0
              );
              return commission > 0 || commissionAmount > 0;
            };

            const buyAmount = parseFloat(values.buy_amount) || 0;
            const currencyChargesAmount =
              parseFloat(values.currency_charges) || 0;
            const vatPercentage = parseFloat(values.vat_percentage) || 0;

            // Check if VAT amount should be 0 based on VAT terms
            let vatAmount = 0;
            if (hasCommissionValue()) {
              if (shouldVatAmountBeZero(values.vat_terms)) {
                vatAmount = 0;
              } else if (currencyChargesAmount && vatPercentage) {
                vatAmount = (currencyChargesAmount * vatPercentage) / 100;
              } else if (buyAmount && vatPercentage && !currencyChargesAmount) {
                // For Standard Rate, calculate VAT on the buy amount when no currency charges
                vatAmount = (buyAmount * vatPercentage) / 100;
              }
            }

            // Only set VAT amount if commission is present, otherwise leave empty
            if (hasCommissionValue()) {
              setFieldValue('vat_amount', vatAmount);
            } else {
              setFieldValue('vat_amount', '');
            }
          }, [
            values.buy_amount,
            values.currency_charges,
            values.vat_percentage,
            values.vat_terms,
            values.commission,
            values.commission_amount,
          ]);

          useEffect(() => {
            const againstAmount = parseFloat(values.against_amount || 0);
            const charges = parseFloat(values.currency_charges || 0);
            const vatAmount = parseFloat(values.vat_amount || 0);

            if (!isNaN(charges) && !isNaN(againstAmount) && !isNaN(vatAmount)) {
              const result = charges + vatAmount + againstAmount;
              setFieldValue('net_total', result.toFixed(2)); // update `amount` or any field
            }
          }, [
            values.currency_charges,
            values.vat_amount,
            values.against_amount,
          ]);

          useEffect(() => {
            const netTotal = parseFloat(values.net_total || 0);
            const baseRates = parseFloat(values.base_rates || 0);

            if (!isNaN(netTotal) && !isNaN(baseRates)) {
              const result = netTotal * baseRates;
              setFieldValue('lcy_amount', result.toFixed(2)); // update `amount` or any field
            }
          }, [values.base_rates, values.net_total]);

          // Live range validation display for rate
          useEffect(() => {
            const rateVal = parseFloat(values.rate);
            const official = parseFloat(currencyRatesPair?.direct_rate);

            if (
              rateVal &&
              official &&
              currencyRatesPair &&
              !isNaN(rateVal) &&
              !isNaN(official)
            ) {
              const minRange = parseFloat(
                currencyRatesPair?.direct_from
              );
              const maxRange = parseFloat(
                currencyRatesPair?.direct_upto
              );

              if (official && (rateVal < minRange || rateVal > maxRange)) {
                setShowRateError(true);
              } else {
                setShowRateError(false);
              }
            } else {
              setShowRateError(false);
            }
          }, [values.rate, currencyRatesPair]);

          // Live range validation display for base rate
          useEffect(() => {
            const baseVal = parseFloat(values.base_rates);
            const official = parseFloat(currencyRate?.rate);

            if (baseVal && official && !isNaN(baseVal) && !isNaN(official)) {
              const min = official * 0.99;
              const max = official * 1.01;

              if (baseVal < min || baseVal > max) {
                setShowBaseRateError(true);
              } else {
                setShowBaseRateError(false);
              }
            } else {
              setShowBaseRateError(false);
            }
          }, [values.base_rates, currencyRate]);

          return (
            <Form>
              <div className="row justify-content-between">
                <div className="col-8 col-lg-10 col-xl-9 col-xxl-7">
                  <div className="row mb-4">
                    <h5 className="mb-4">FSN Details</h5>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'selling_no'}
                        type={'text'}
                        label={'Selling No'}
                        placeholder={'Enter Selling No'}
                        value={values.selling_no}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={true}
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'reference_number'}
                        type={'text'}
                        disabled={true}
                        label={'Reference Number'}
                        placeholder={'Enter Reference Number'}
                        value={values.reference_number}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-45">
                      <CustomInput
                        name={'beneficiary'}
                        disabled={true}
                        label={'Beneficiary'}
                        value={values.beneficiary}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'remitter'}
                        type={'text'}
                        disabled={true}
                        label={'Remitter'}
                        placeholder={'Enter Remitter'}
                        value={values.remitter}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'tt_amount'}
                        type={'text'}
                        label={`TT Amount ${values?.tt_amount_currency_code}`}
                        placeholder={'Enter TT Amount USD'}
                        value={values.tt_amount}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={true}
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'date'}
                        type={'date'}
                        disabled={true}
                        label={'Date'}
                        placeholder={'Enter Date'}
                        value={values.date}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </div>
                    <div className="border my-45"></div>
                    <h5 className="mb-4">Allocation Details</h5>
                    {/* Combined Ledger and Account Select */}
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
                        ]}
                        options2={getAccountsByTypeOptions(values.ledger)}
                        isDisabled={isDisabled}
                        handleBlur={handleBlur}
                        placeholder1="Ledger"
                        placeholder2="Account"
                        className1="ledger"
                        className2="account_id"
                        onChange1={(selected) => {
                          if (
                            selected.label?.toLowerCase()?.startsWith('add new')
                          ) {
                            setShowAddLedgerModal(
                              selected.label?.toLowerCase()
                            );
                          } else {
                            setFieldValue('ledger', selected.value);
                            // Clear account field and selected ledger account when ledger changes
                            setFieldValue('account_id', '');
                            setSelectedLedgerAccount(null);
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
                    <div className="col-12 col-sm-6 mb-3">
                      <SearchableSelect
                        name="office_location_id"
                        label="Office Location"
                        options={getOfficeLocationOptions()}
                        placeholder="Select Office Location"
                        value={values.office_location_id}
                        onChange={(selected) =>
                          setFieldValue('office_location_id', selected?.value)
                        }
                        onBlur={handleBlur}
                      />
                    </div>
                    {/* commission */}
                    <div className="col-12 col-sm-6 mb-3">
                      <CombinedInputs
                        label={`${values?.tt_amount_currency_code} Commission`}
                        type1="input"
                        type2="input"
                        name1="commission"
                        name2="commission_amount"
                        value1={values.commission}
                        value2={values.commission_amount}
                        isDisabled={isDisabled}
                        handleBlur={handleBlur}
                        placeholder1="Commission %"
                        placeholder2="Amount"
                        inputType1="number"
                        inputType2="number"
                        className1="commission"
                        className2="commission-amount"
                        inputProps1={{
                          min: 0,
                          max: 100,
                        }}
                        onChange1={(v) => {
                          handleChange(v);
                          if (v.target.value < 0) {
                            return;
                          }
                          let commission = parseFloat(v.target.value || 0);
                          let amount = parseFloat(values.tt_amount || 0);
                          let commissionAmount = (commission / 100) * amount;

                          setFieldValue('commission_amount', commissionAmount);

                          // Mark VAT fields as touched when commission is entered
                          if (commission > 0) {
                            setFieldTouched('vat_terms_id', true);
                            setFieldTouched('vat_amount', true);
                          } else if (commission === 0) {
                            // Clear commission fields if commission is cleared
                            setFieldValue('commission_amount', '');
                            setFieldValue('vat_amount', '');
                          }
                        }}
                        onChange2={(e) => {
                          handleChange(e);
                          let commissionAmount = parseFloat(
                            e.target.value || 0
                          );
                          let amount = parseFloat(values.tt_amount || 0);
                          let commission =
                            amount !== 0
                              ? (commissionAmount / amount) * 100
                              : 0;

                          setFieldValue('commission', commission);

                          // Mark VAT fields as touched when commission is entered
                          if (commissionAmount > 0) {
                            setFieldTouched('vat_terms_id', true);
                            setFieldTouched('vat_amount', true);
                          } else if (commissionAmount === 0) {
                            // Clear commission fields if commission is cleared
                            setFieldValue('commission', '');
                            setFieldValue('vat_amount', '');
                          }
                        }}
                      />
                    </div>
                    {/* Combined Buy Currency and Amount */}
                    <div className="col-12 col-sm-6 mb-45">
                      <CombinedInputs
                        label={'Buy'}
                        type1="select"
                        type2="input"
                        name1="buy_currency_id"
                        name2="buy_amount"
                        value1={values.buy_currency_id}
                        value2={values.buy_amount}
                        options1={currencyOptions}
                        isDisabled={isDisabled}
                        handleBlur={handleBlur}
                        placeholder1="Currency"
                        placeholder2="Amount"
                        inputType2="number"
                        className1="fc-currency"
                        className2="fc-amount"
                        isfirstInputDisabled
                        min2={0}
                        max2={values.send_amount} // this ensures max=100
                        onChange1={handleChange}
                        onChange2={handleChange}
                      />
                      <ErrorMessage
                        name="buy_amount"
                        component="div"
                        className="input-error-message text-danger"
                      />
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
                        options1={[{ label: 'X', value: 'X' }]}
                        isfirstInputDisabled={true}
                        isDisabled={isDisabled}
                        handleBlur={handleBlur}
                        placeholder2="Enter Rate"
                        inputType2="number"
                        className1="rate-type"
                        className2="rate"
                        onChange1={handleChange}
                        onChange2={handleChange}
                        error={touched.rate && errors.rate}
                      />
                      <ErrorMessage
                        name="rate"
                        component="div"
                        className="input-error-message text-danger"
                      />
                      {showRateError && currencyRatesPair && (
                        <div className="input-error-message text-danger">
                          {(() => {
                            const officialRate = parseFloat(
                              currencyRatesPair?.direct_rate
                            );

                            const minRange = parseFloat(
                              currencyRatesPair?.direct_from ??
                              officialRate * 0.99
                            );
                            const maxRange = parseFloat(
                              currencyRatesPair?.direct_upto ??
                              officialRate * 1.01
                            );

                            return `Range: ${formatRateValue(
                              minRange
                            )} - ${formatRateValue(maxRange)}`;
                          })()}
                        </div>
                      )}
                    </div>
                    {/* Combined Ag Currency and Amount Select */}
                    <div className="col-12 col-sm-6 mb-45">
                      <CombinedInputs
                        label="Against Currency"
                        type1="select"
                        type2="input"
                        name1="against_currency_id"
                        name2="against_amount"
                        value1={values.against_currency_id}
                        value2={values.against_amount}
                        options1={currencyOptions}
                        isSecondInputDisabled={true}
                        handleBlur={handleBlur}
                        placeholder1="Currency"
                        placeholder2="Enter Amount"
                        inputType2="number"
                        className1="currency"
                        className2="amount"
                        onChange1={(selected) => {
                          setSelectedCurrency(selected.value);
                          setSelectedCurrencyTitle(selected.label);
                          setFieldValue('against_currency_id', selected.value);
                        }}
                        onChange2={handleChange}
                        additionalProps={{
                          isLoadingCurrencyRate: isLoadingCurrencyRatesPair,
                        }}
                      />
                      <ErrorMessage
                        name="against_currency_id"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
                    {/* Combined Rate Type and Rate */}
                    {/* rate * commission = charges */}
                    <div className="col-12 col-sm-6 mb-45">
                      <CombinedInputs
                        label="Charges"
                        type1="select"
                        type2="input"
                        name1="ag_currency"
                        name2="currency_charges"
                        value1={values?.against_currency_id}
                        value2={values.currency_charges}
                        options1={currencyOptions}
                        isfirstInputDisabled={true}
                        isDisabled={isDisabled}
                        handleBlur={handleBlur}
                        placeholder1="Currency"
                        placeholder2="Charges"
                        inputType2="number"
                        className1="rate-type"
                        className2="rate"
                        onChange1={handleChange}
                        onChange2={handleChange}
                      />
                    </div>

                    {vatType?.vat_type === 'variable' && (
                      <div className="col-12 col-sm-6 mb-45">
                        <SearchableSelect
                          name={'vat_terms'}
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
                              const vatPercentage = selected?.percentage ?? '';
                              setFieldValue('vat_terms', vatTerms);
                              setFieldValue('vat_terms_id', selected.id); // Store VAT terms ID

                              // Set VAT percentage to 0 for exempted/zero rate/out of scope conditions
                              if (shouldVatAmountBeZero(vatTerms)) {
                                setFieldValue('vat_percentage', 0);
                              } else {
                                setFieldValue('vat_percentage', vatPercentage);
                              }
                              setFieldValue('vat_type', 'variable');
                            }
                          }}
                          onBlur={handleBlur}
                          error={touched.vat_terms && errors.vat_terms}
                        />
                      </div>
                    )}
                    {vatType?.vat_type === 'fixed' && (
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'vat_percentage'}
                          label={'VAT %'}
                          type={'number'}
                          disabled={true}
                          placeholder={'Enter VAT Percentage'}
                          value={values?.vat_percentage}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>
                    )}

                    <div className="col-1 col-sm-1 mb-45">
                      <CustomInput
                        name={'currency_charges'}
                        label={'VAT Amount'}
                        value={selectedCurrencyTitle}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={true}
                      />
                    </div>

                    {/* charges * vat percentage */}
                    <div className="col-12 col-sm-5 mb-3">
                      <CustomInput
                        name={'vat_amount'}
                        type={'text'}
                        disabled={isDisabled}
                        label={' '}
                        placeholder={'Currency A | 0.00'}
                        value={values.vat_amount}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.vat_amount && errors.vat_amount}
                      />
                    </div>

                    <div className="col-1 col-sm-1 mb-45">
                      <CustomInput
                        name={'currency_charges'}
                        label={'Net Total'}
                        value={selectedCurrencyTitle}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={true}
                      />
                    </div>
                    <div className="col-12 col-sm-5 mb-3">
                      <CustomInput
                        name={'net_total'}
                        type={'text'}
                        disabled={isDisabled}
                        label={'  '}
                        placeholder={'0.00'}
                        value={values.net_total}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </div>

                    {/* base currency rate */}
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'base_rates'}
                        type={'number'}
                        disabled={isDisabled}
                        label={'Base Rate'}
                        placeholder={'Enter Base Rate'}
                        value={values.base_rates}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={
                          touched.base_rates && errors.base_rates
                            ? errors.base_rates
                            : showBaseRateError && currencyRate?.rate
                              ? 'Range: ' +
                              (parseFloat(currencyRate.rate) * 0.99).toFixed(
                                6
                              ) +
                              ' - ' +
                              (parseFloat(currencyRate.rate) * 1.01).toFixed(
                                6
                              )
                              : ''
                        }
                      />
                    </div>
                    {/* base rate * net total */}

                    <div className="col-1 col-sm-1 mb-45">
                      <CustomInput
                        name={'base_currency_code'}
                        label={`${base_currency || 'LC'} Amount`}
                        value={values?.base_currency_code}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={true}
                      />
                    </div>
                    <div className="col-12 col-sm-5 mb-3">
                      <CustomInput
                        name={'lcy_amount'}
                        type={'text'}
                        disabled={true}
                        label={' '}
                        placeholder={'Currency A | 0.00'}
                        value={values.lcy_amount}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </div>

                    {/* signature */}
                    <div className="col-12 mb-3">
                      <label>Signature</label>

                      <SignatureCanvas
                        ref={sigCanvas}
                        penColor="green"
                        canvasProps={{
                          height: 200,
                          className: 'sigCanvas',
                        }}
                      />
                      {trimmedDataURL ? (
                        <img alt="signature" src={trimmedDataURL} />
                      ) : null}

                      <div className="mt-4">
                        <button
                          type="button"
                          className="customButton"
                          style={{ width: '20px', marginRight: '15px' }}
                          onClick={clear}
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          className="customButton"
                          style={{ width: '20px' }}
                          onClick={trim}
                        >
                          Trim
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-4 col-lg-2 col-xl-3 col-xxl-3">
                  <div className="w-100">
                    {/* live exchange rates */}
                    <ExchangeRatesCard
                      rates={exchangeRatesData?.detail || exchangeRatesData}
                      loading={isLoadingExchangeRates}
                      error={isErrorExchangeRates}
                      onInverseChange={setExchangeRatesInverse}
                    />
                    {/* ledger account */}
                    {getAccountBalanceSettings(
                      'outward_remittance_allocation'
                    ) &&
                      selectedLedgerAccount && (
                        <div className="mt-4">
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
                        </div>
                      )}
                  </div>
                </div>
                <div className="row">
                  <div className="col-12 col-lg-6 d-flex justify-content-between mt-3 mb-5">
                    <div>
                      <div className="d-inline-block mt-3">
                        <CustomCheckbox
                          label="Account Balance"
                          checked={getAccountBalanceSettings(
                            'outward_remittance_allocation'
                          )}
                          disabled={isDisabled}
                          style={{ border: 'none', margin: 0 }}
                          onChange={(e) =>
                            updateAccountBalanceSetting(
                              'outward_remittance_allocation',
                              e.target.checked
                            )
                          }
                          readOnly={isDisabled}
                        />
                        {/* Print checkbox - can be added if print permission is needed */}
                      </div>
                    </div>
                  </div>
                </div>
                {!isDisabled && hasCreatePermission && (
                  <div className="d-flex gap-3 ms-auto mb-3 mb-md-0">
                    <CustomButton
                      type={'button'}
                      loading={createAllocationMutation.isPending}
                      text={'Save'}
                      onClick={() => {
                        handleSubmit();
                      }}
                    />
                    <CustomButton
                      variant={'secondaryButton'}
                      text={'Cancel'}
                      type={'button'}
                      onClick={() => {
                        setPageState('new');
                      }}
                    />
                  </div>
                )}
              </div>
            </Form>
          );
        }}
      </Formik>
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
            // validationSchema={addOfficeLocationValidationSchema}
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
                    <CustomButton
                      type="submit"
                      text={'Submit'}
                      loading={createAllocationMutation.isPending}
                    />
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
                  </>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </CustomModal>
    </div>
  );
};

export default withModal(OutwardRemittanceAllocation);
