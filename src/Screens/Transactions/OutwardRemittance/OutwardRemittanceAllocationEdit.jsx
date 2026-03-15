import { useMutation, useQuery } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import { useCallback, useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import CombinedInputs from '../../../Components/CombinedInputs/CombinedInputs';
import CustomButton from '../../../Components/CustomButton';
import CustomCheckbox from '../../../Components/CustomCheckbox/CustomCheckbox';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
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
  checkTransactionLockStatus,
  releaseTransaction,
} from '../../../Services/Process/TransactionLock';
import {
  officeLocation,
  updateAllocationOutwardRemittance,
  viewRemittanceRegisterEdit,
} from '../../../Services/Transaction/OutwardRemittance';
import useFormStore from '../../../Stores/FormStore';
import useSettingsStore from '../../../Stores/SettingsStore';
import useUserStore from '../../../Stores/UserStore';
import { formatRateValue } from '../../../Utils/Helpers';
import {
  getCurrencyOptions,
  isNullOrEmpty,
  showErrorToast,
} from '../../../Utils/Utils';
import ExchangeRatesCard from '../../../Components/ExchangeRatesCard/ExchangeRatesCard';
import AccountBalanceCard from '../../../Components/AccountBalanceCard/AccountBalanceCard';

const OutwardRemittanceAllocationEdit = ({
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
  hasEditPermission,
  showModal,
}) => {
  usePageTitle('Outward Remittance Allocation Edit');
  const formikRef = useRef();
  const sigCanvas = useRef(null);
  const [trimmedDataURL, setTrimmedDataURL] = useState(null);
  const { getAccountsByTypeOptions } = useAccountsByType();
  const currencyOptions = getCurrencyOptions();
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState(null);
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [showVatOutOfScopeModal, setShowVatOutOfScopeModal] = useState(false);
  const [exchangeRatesInverse, setExchangeRatesInverse] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [showRateError, setShowRateError] = useState(false);
  const [showBaseRateError, setShowBaseRateError] = useState(false);

  const { vatType, vatTermsOptions } = useVATTypes();
  const { getAccountBalanceSettings, updateAccountBalanceSetting } =
    useSettingsStore();
  const { user: { base_currency } = {} } = useUserStore();
  const formId = 'outward_remittance_allocation';
  const voucherName = 'outward_remittance_register';
  // Access the form store
  const { getFormValues, clearFormValues, clearLastVisitedPage } =
    useFormStore();

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
  }

  function trim() {
    setTrimmedDataURL(sigCanvas.current.toDataURL());
  }

  // Check Transaction lock status to enable/disable Save
  const { isLoading: isLoadingLockStatus, refetch: checkFormStatus } = useQuery(
    {
      queryKey: ['save_lock_status', voucherName, remittanceRegisterId],
      queryFn: () =>
        checkTransactionLockStatus({
          transaction_type: voucherName,
          transaction_id: remittanceRegisterId,
        }),
      enabled: false,
      retry: false,
    }
  );

  // Queries and Mutations
  const {
    data: queryOutwardRemittanceData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['viewRemittanceRegisterEdit', remittanceRegisterId],
    queryFn: () => viewRemittanceRegisterEdit(remittanceRegisterId),
    enabled: !!remittanceRegisterId, // ✅ Only run if truthy
    retry: 1,
  });

  const sourceData = queryOutwardRemittanceData;
  const hasInitializedLedgerAccount = useRef(false);

  // Initialize selectedLedgerAccount from sourceData
  useEffect(() => {
    if (
      sourceData?.account_id &&
      sourceData?.ledger &&
      formikRef.current &&
      !hasInitializedLedgerAccount.current
    ) {
      const accountOptions = getAccountsByTypeOptions(sourceData.ledger);
      const selectedAccount = accountOptions.find(
        (opt) => opt.value === sourceData.account_id
      );
      if (selectedAccount) {
        setSelectedLedgerAccount({
          value: selectedAccount.value,
          label: selectedAccount.label,
          accountType: sourceData.ledger,
        });
        hasInitializedLedgerAccount.current = true;
      }
    }
  }, [sourceData?.account_id, sourceData?.ledger]);

  const [selectedCurrencyTitle, setSelectedCurrencyTitle] = useState('');

  const handleSubmit = async () => {
    // run status check first
    const { data: lockStatusData, error: errorLockStatus } =
      await checkFormStatus();
    if (lockStatusData?.locked || errorLockStatus?.detail?.locked) {
      showToast(
        lockStatusData?.message ||
        errorLockStatus?.message ||
        'Transaction is locked',
        'warn'
      );
      return;
    }

    setAttemptedSubmit(true);

    const formValuesForValidation = formikRef.current?.values || {};

    // Exchange rate & base rate range validation (same behavior pattern as NewTmnCurrencyDeal)
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
            Exchange Rate for{' '}
            {sourceData?.remittance?.fc_currency?.currency_code}/
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
    if (Object.keys(errors).length > 0) {
      formikRef.current.setTouched(
        Object.keys(errors).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {})
      );
      return;
    }

    const formValues = formikRef.current?.values || {};

    const payload = {
      ...formValues,
      signature: trimmedDataURL || sourceData?.signature || '',
    };

    updateAllocationMutation.mutate([remittanceRegisterId, payload]);
  };

  // Release lock on unmount or cancel
  const releaseExecutedRef = useRef(false);
  const releaseTransactionMutation = useMutation({
    mutationFn: releaseTransaction,
  });
  const releaseLock = useCallback(() => {
    if (releaseExecutedRef.current) return;
    if (remittanceRegisterId) {
      releaseTransactionMutation.mutate({
        transaction_type: voucherName,
        transaction_id: remittanceRegisterId,
      });
      releaseExecutedRef.current = true;
    }
  }, [remittanceRegisterId]);

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

  // Mutation: Pay Inward Payment
  const updateAllocationMutation = useMutation({
    mutationFn: ([id, formData]) =>
      updateAllocationOutwardRemittance(id, formData),
    onSuccess: (data) => {
      showToast('Outward Remittance Updated Successfully!', 'success');
      // Release lock on successful update
      releaseLock();

      // Call parent success handler instead of internal navigation
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error) => {
      console.error('Error during allocation:', error);
      showErrorToast(error || 'Something went wrong.');
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
      console.error('Unable to fetch Office Locations', errorOfficeLocations);
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
        sourceData?.remittance?.fc_currency?.id, // Currency 1
        selectedCurrency, // Against Currency  2
        date,
        'buy', // Deal type (buy/sell)
      ],
      queryFn: () =>
        getCurrencyRatesPair(
          sourceData?.remittance?.fc_currency?.id,
          selectedCurrency,
          date,
          'buy'
        ),
      enabled: !!selectedCurrency && !!sourceData?.remittance?.fc_currency?.id,
    });

  //for base rates
  const { data: currencyRate, isLoading: isLoadingCurrencyRate } =
    useCurrencyRate(selectedCurrency, date, {
      enabled:
        !!selectedCurrency &&
        !isLoadingCurrencyRatesPair &&
        !!currencyRatesPair?.direct_rate,
    });

  // Account balances for Ledger accounts
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

  useEffect(() => {
    if (currencyRate?.rate) {
      formikRef.current?.setFieldValue('base_rates', currencyRate.rate);
      formikRef.current?.setFieldValue(
        'base_currency_code',
        currencyRate.local_currency
      );
    } else if (currencyRate && !isLoadingCurrencyRate) {
      setSelectedCurrency('');
      setSelectedCurrencyTitle('');
      formikRef.current.setFieldValue('rate', '');
      formikRef.current.setFieldValue('against_currency_id', '');
      setShowMissingCurrencyRateModal(true);
      setPairMissingCurrencyRateModal(false);
    }
  }, [currencyRate?.rate, isLoadingCurrencyRate]);

  // Initialize selectedCurrency from existing data so that rate validation works on load
  useEffect(() => {
    if (!sourceData?.against_currency_id || selectedCurrency) return;
    const existingCurrencyOption = currencyOptions.find(
      (opt) => opt.value === sourceData.against_currency_id
    );
    if (existingCurrencyOption) {
      setSelectedCurrency(existingCurrencyOption.value);
      setSelectedCurrencyTitle(existingCurrencyOption.label);
    }
  }, [sourceData?.against_currency_id, currencyOptions, selectedCurrency]);

  const handleVatOutOfScope = (values) => {
    formikRef.current.values.out_of_scope_reason = values?.out_of_scope;
    setShowVatOutOfScopeModal(false);
  };

  const newAmount =
    parseFloat(sourceData?.remittance?.balance_amount) +
    parseFloat(sourceData?.buy_amount);

  // parseFloat(sourceData?.buy_amount) +
  // parseFloat(sourceData?.fc_balance_amount);

  return (
    <div className="d-card">
      <Formik
        innerRef={formikRef}
        enableReinitialize={true}
        initialValues={{
          remittance_id: sourceData?.remittance?.id || '',
          reference_number: sourceData?.remittance?.reference_no || '',
          selling_no: sourceData?.remittance?.voucher?.voucher_no || '',
          beneficiary: sourceData?.remittance?.beneficiary?.name || '',
          remitter:
            sourceData?.remittance_details?.customer_name ||
            sourceData?.remittance_details?.account_title ||
            '',
          date: sourceData?.remittance?.date || '',
          buy_amount: sourceData?.buy_amount || '',
          buy_currency_id: sourceData?.remittance?.fc_currency?.id || '', //buy currency
          tt_amount_currency_code:
            sourceData?.remittance?.fc_currency?.currency_code || '',
          tt_amount: newAmount || '',
          send_amount: newAmount || '',
          againts_currency:
            sourceData?.remittance?.againts_currency?.currency_code || '',
          rate_type: mapIncomingRateType(sourceData?.remittance?.rate_type),
          ledger: sourceData?.ledger || '',
          account_id: sourceData?.account_id || '',
          against_currency_id: sourceData?.against_currency_id || '',
          against_amount: sourceData?.remittance?.against_amount || '',
          rate: sourceData?.rate ? Number(sourceData.rate).toFixed(8) : '',
          currency_charges: sourceData?.charges || '',
          vat_type: sourceData?.vat_type || 'fixed', // fixed or variable
          vat_percentage: sourceData?.vat_percentage || '', // Percentage
          vat_terms_id: sourceData?.vat_terms_id || '', // id of the vat terms (Standard, Exempted, Out of Scope, etc.)
          vat_terms: sourceData?.vat_terms,
          vat_amount: sourceData?.vat_amount || '',
          net_total: sourceData?.net_total || '',
          base_rates: sourceData?.remittance?.base_rate ? Number(sourceData.remittance.base_rate).toFixed(8) : '',
          base_currency_id: sourceData?.remittance?.base_currency_id || '',
          base_currency_code:
            sourceData?.remittance?.base_currency?.currency_code || '',
          lcy_amount: sourceData?.lcy_amount || '',
          signature: sourceData?.signature_url || '',
          office_location_id: sourceData?.office_location_id || '',
          out_of_scope_reason: sourceData?.out_of_scope || '',
          commission_amount:
            sourceData?.commission && parseFloat(sourceData?.commission) !== 0
              ? sourceData?.commission
              : '',
          commission:
            sourceData?.commission_percentage &&
              parseFloat(sourceData?.commission_percentage) !== 0
              ? sourceData?.commission_percentage
              : '',
        }}
        validate={(values) => {
          const errors = {};

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

          const hasCommission =
            parseFloat(values.commission || 0) > 0 ||
            parseFloat(values.commission_amount || 0) > 0;

          if (hasCommission) {
            if (!values.vat_amount && values.vat_amount !== 0) {
              errors.vat_amount = 'VAT Amount is required';
            }
            if (vatType?.vat_type === 'variable' && !values.vat_terms_id) {
              errors.vat_terms = 'VAT % is required';
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
          setFieldTouched,
        }) => {
          useEffect(() => {
            if (!selectedCurrency || !sourceData?.remittance?.fc_currency?.id)
              return;
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
            sourceData?.remittance?.fc_currency?.id,
            isLoadingCurrencyRatesPair,
          ]);

          useEffect(() => {
            const rate = parseFloat(values.rate || 0);
            const buyAmount = parseFloat(values.buy_amount || 0);

            if (!isNaN(rate) && !isNaN(buyAmount)) {
              const result = rate * buyAmount;
              setFieldValue('against_amount', result.toFixed(2)); // update `amount` or any field
              setSelectedCurrencyTitle(
                sourceData?.againts_currency?.currency_code
              );
            }
          }, [values.rate, values.buy_amount]);

          // Auto-set fixed VAT percentage when VAT type is fixed
          useEffect(() => {
            if (vatType?.vat_type === 'fixed' && vatType?.vat_percentage) {
              const fixedVatPercentage = parseFloat(vatType.vat_percentage);
              // setFieldValue('vat_type', 'fixed');
              setFieldValue('vat_percentage', fixedVatPercentage);
              // setFieldValue('vat_terms_id', null); // Clear variable term
            }
          }, [vatType?.vat_type, vatType?.vat_percentage, setFieldValue]);

          useEffect(() => {
            const rate = parseFloat(values.rate || 0);
            const commissionAmountRaw = values.commission_amount;

            if (
              commissionAmountRaw === '' ||
              commissionAmountRaw === null ||
              commissionAmountRaw === undefined
            ) {
              setFieldValue('currency_charges', '');
            } else {
              const commissionAmount = parseFloat(commissionAmountRaw || 0);
              if (!isNaN(rate) && !isNaN(commissionAmount)) {
                const result = rate * commissionAmount;
                setFieldValue('currency_charges', result.toFixed(2)); // update `amount` or any field
              }
            }
          }, [values.rate, values.commission_amount]);

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

          // Calculates VAT and Net Total (matching main allocation logic)
          useEffect(() => {
            const sendAmount = parseFloat(values.send_amount) || 0;
            const currencyChargesAmount =
              parseFloat(values.currency_charges) || 0;
            const commissionAmount = parseFloat(values.commission_amount) || 0;
            const vatPercentage = parseFloat(values.vat_percentage) || 0;

            if (
              values.vat_percentage === null ||
              values.vat_percentage === '' ||
              values.vat_percentage === undefined
            ) {
              setFieldValue('vat_amount', 0);
              return;
            }

            const hasCommissionValue = () => {
              const commission = parseFloat(values.commission || 0);
              const commissionAmt = parseFloat(values.commission_amount || 0);
              return commission > 0 || commissionAmt > 0;
            };

            let vatAmount = 0;
            if (shouldVatAmountBeZero(values.vat_terms)) {
              vatAmount = 0;
            } else if (
              hasCommissionValue() &&
              commissionAmount &&
              vatPercentage
            ) {
              vatAmount = (commissionAmount * vatPercentage) / 100;
            } else if (currencyChargesAmount && vatPercentage) {
              vatAmount = (currencyChargesAmount * vatPercentage) / 100;
            } else if (
              sendAmount &&
              vatPercentage &&
              !currencyChargesAmount &&
              !hasCommissionValue()
            ) {
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
              setFieldValue('currency_charges', result.toFixed(2));
            }
          }, [values.rate, values.commission_amount]);

          useEffect(() => {
            const againstAmount = parseFloat(values.against_amount || 0);
            const charges = parseFloat(values.currency_charges || 0);
            const vatAmount = parseFloat(values.vat_amount || 0);

            if (!isNaN(charges) && !isNaN(againstAmount) && !isNaN(vatAmount)) {
              const result = charges + vatAmount + againstAmount;
              setFieldValue('net_total', result.toFixed(2));
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
              setFieldValue('lcy_amount', result.toFixed(2));
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
                    <h5>FSN Details</h5>
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
                    <h5 className="">Allocation Details</h5>
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
                        inputProps2={{
                          inputClass: showRateError ? 'text-danger' : '',
                        }}
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
                        error={
                          touched.currency_charges && errors.currency_charges
                        }
                      />
                    </div>

                    {vatType?.vat_type === 'variable' &&
                      sourceData?.vat_type === 'variable' && (
                        <div className="col-12 col-sm-6 mb-45">
                          <SearchableSelect
                            name={'vat_terms'}
                            label={'VAT %'}
                            options={vatTermsOptions}
                            isDisabled={
                              !(
                                parseFloat(values.commission || 0) > 0 ||
                                parseFloat(values.commission_amount || 0) > 0
                              )
                            }
                            placeholder={'Select VAT %'}
                            value={values.vat_terms_id}
                            onChange={(selected) => {
                              if (selected.label.startsWith('Out of Scope')) {
                                setShowVatOutOfScopeModal(true);
                              }
                              setFieldValue('vat_terms_id', selected.value);
                              setFieldValue('vat_type', 'variable');
                              setFieldValue(
                                'vat_percentage',
                                parseFloat(selected.percentage)
                              );
                            }}
                            onBlur={handleBlur}
                            error={touched.vat_terms && errors.vat_terms}
                          />
                        </div>
                      )}

                    {vatType?.vat_type === 'variable' &&
                      sourceData?.vat_type === 'fixed' && (
                        <div className="col-12 col-sm-6 mb-3">
                          <CustomInput
                            name={'vat_terms'}
                            label={'VAT %'}
                            disabled={true}
                            value={
                              sourceData.vat_terms_id !== null
                                ? values.vat_terms_id
                                : sourceData?.vat_type === 'fixed'
                                  ? `Fixed - ${values.vat_percentage}%`
                                  : values.vat_terms_id
                            }
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                        </div>
                      )}

                    {vatType?.vat_type === 'fixed' && (
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'vat_percentage'}
                          label={'VAT %'}
                          disabled={true}
                          placeholder={'Enter VAT Percentage'}
                          // value={vatType?.vat_percentage}
                          value={
                            vatType?.vat_type === 'fixed' &&
                              sourceData?.vat_type === 'fixed'
                              ? vatType?.vat_percentage
                              : vatType?.vat_type === 'fixed' &&
                                sourceData?.remittance?.vat_terms !== 'fixed'
                                ? sourceData?.vat_terms +
                                ' ' +
                                sourceData?.vat_percentage +
                                '%'
                                : vatType?.vat_percentage
                          }
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
                        disabled={true}
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
                        inputClass={showBaseRateError ? 'text-danger' : ''}
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

                      <div className="mt-4">
                        <button
                          type="button"
                          className="customButton"
                          style={{ width: '20px', marginRight: '15px' }}
                          onClick={() => {
                            sigCanvas.current.clear();
                            setTrimmedDataURL(null);
                          }}
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          className="customButton"
                          style={{ width: '20px' }}
                          onClick={() => {
                            setTrimmedDataURL(sigCanvas.current.toDataURL());
                          }}
                        >
                          Trim
                        </button>
                      </div>

                      {trimmedDataURL ? (
                        <img alt="signature" src={trimmedDataURL} />
                      ) : sourceData?.signature ? (
                        <img
                          alt="old signature"
                          src={sourceData.signature_url}
                        />
                      ) : null}
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
                        <CustomCheckbox
                          label="Print"
                          disabled={isDisabled}
                          style={{ border: 'none', margin: 0 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {!isDisabled && hasEditPermission && (
                  <div className="d-flex gap-3 ms-auto mb-3 mb-md-0">
                    <CustomButton
                      type={'button'}
                      text={'Update'}
                      onClick={() => {
                        handleSubmit();
                      }}
                      loading={
                        isLoadingLockStatus ||
                        updateAllocationMutation.isPending
                      }
                    />
                    <CustomButton
                      variant={'secondaryButton'}
                      text={'Cancel'}
                      type={'button'}
                      onClick={() => {
                        releaseLock();
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
          formikRef.current.values.vat_terms_id = '';
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
                  {/* {!addOfficeLocationMutation.isPending ? ( */}
                  <>
                    <CustomButton type="submit" text={'Submit'} />
                    <CustomButton
                      variant={'secondaryButton'}
                      text={'Cancel'}
                      type={'button'}
                      onClick={() => {
                        setShowVatOutOfScopeModal(false);
                        formikRef.current.values.vat_terms_id = '';
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
    </div>
  );
};

export default withModal(OutwardRemittanceAllocationEdit);
