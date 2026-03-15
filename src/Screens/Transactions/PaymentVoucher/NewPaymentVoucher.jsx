import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import React, { useEffect, useRef, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import AccountBalanceCard from '../../../Components/AccountBalanceCard/AccountBalanceCard';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CombinedInputs from '../../../Components/CombinedInputs/CombinedInputs.jsx';
import CustomButton from '../../../Components/CustomButton';
import CustomCheckbox from '../../../Components/CustomCheckbox/CustomCheckbox';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import ExchangeRatesCard from '../../../Components/ExchangeRatesCard/ExchangeRatesCard';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import useFormStore from '../../../Stores/FormStore.js';

import SignatureCanvas from 'react-signature-canvas';
import FileDisplayList from '../../../Components/FileDisplayList/FileDisplayList.jsx';
import { showToast } from '../../../Components/Toast/Toast.jsx';
import withModal from '../../../HOC/withModal.jsx';
import useCurrencyRate from '../../../Hooks/useCurrencyRate';
import {
  getAccountBalances,
  getExchangeRates,
  pairReleased,
} from '../../../Services/General';
import { getChequeNumberByBank } from '../../../Services/Transaction/JournalVoucher.js';
import { createPaymentVoucher } from '../../../Services/Transaction/PaymentVoucher.js';
import { getBenefeciariesByAccount } from '../../../Services/Transaction/ReceiptVoucher.js';
import useSettingsStore from '../../../Stores/SettingsStore.js';
import {
  formatNumberWithCommas,
  formatNumberTwoDecimals,
} from '../../../Utils/Helpers';
import { showErrorToast } from '../../../Utils/Utils.jsx';
import { paymentValidationSchema } from '../../../Utils/Validations/ValidationSchemas.jsx';
import SpecialCommission from '../SpecialCommission/SpecialCommission';


const NewPaymentVoucher = ({
  showModal,
  isDisabled = false,
  setIsDisabled,
  setPageState,
  setSearchTerm,
  setShowAddLedgerModal,
  uploadAttachmentsModal,
  setUploadAttachmentsModal,
  newlyCreatedBeneficiary,
  accountData,
  modesData,
  date,
  setDate,
  vatData,
  lastVoucherNumbers,
  updatePrintSetting,
  onFormDataChange,
  restoreValuesFromStore,
  currencyOptions,
  setCurrencyToSelect,
  setWriteTerm,
  setShowMissingCurrencyRateModal,
  hasPrintPermission,
}) => {
  const queryClient = useQueryClient();
  const formikRef = useRef();
  const [showVatOutOfScopeModal, setShowVatOutOfScopeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);
  const [hasShownModal, setHasShownModal] = useState(false);
  const [voucherDate, setVoucherDate] = useState(
    new Date().toLocaleDateString('en-CA')
  );
  const [dueDate, setDueDate] = useState('');
  const [isDueDateEditable, setIsDueDateEditable] = useState(false);
  const [isChequeFieldEnabled, setIsChequeFieldEnabled] = useState(false);
  const [addedAttachments, setAddedAttachments] = useState({});
  const [outOfScope, setOutOfScope] = useState('');
  const [specialCommissionValues, setSpecialCommissionValues] = useState({});
  const [addedSpecialCommissionValues, setAddedSpecialCommissionValues] =
    useState(null);
  const sigCanvas = useRef(null);
  const [trimmedDataURL, setTrimmedDataURL] = useState(null);
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState(null);
  const [errorSignature, setErrorSignature] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [showSCModal, setShowSCModal] = useState(false);
  const [selectedModeAccount, setSelectedModeAccount] = useState(null);
  const [exchangeRatesInverse, setExchangeRatesInverse] = useState(false);

  function clear() {
    sigCanvas.current.clear();
  }

  function trim() {
    setTrimmedDataURL(sigCanvas.current.toDataURL());
    setErrorSignature(false);
  }

  // Access the form store
  const {
    getFormValues,
    hasFormValues,
    clearFormValues,
    getLastVisitedPage,
    clearLastVisitedPage,
    saveFormValues, // Added this line
  } = useFormStore();
  const formId = 'payment-voucher';

  // For getting print checkbox state from BE
  const {
    getPrintSettings,
    getAccountBalanceSettings,
    updateAccountBalanceSetting,
  } = useSettingsStore();

  // Load saved form if present
  useEffect(() => {
    const lastPage = getLastVisitedPage(formId);

    if (
      lastPage === 'special-commission' &&
      hasFormValues(formId) &&
      formikRef.current
    ) {
      const savedValues = getFormValues(formId);
      let specialCommissionData = {};

      specialCommissionData.commission_type = savedValues?.commission_type;
      specialCommissionData.amount = savedValues?.amount;
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

      if (hasFormValues('special-commission')) {
        setAddedSpecialCommissionValues(getFormValues('special-commission'));
      }
      clearLastVisitedPage(formId);
    }
  }, []);

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
    }
  }, [lastVoucherNumbers?.current, date]);

  useEffect(() => {
    formikRef.current?.setFieldValue('signature', trimmedDataURL);
  }, [trimmedDataURL]);

  // Fetch currency rate for the selected Currency
  const { data: currencyRate, isLoading: isLoadingCurrencyRate } =
    useCurrencyRate(selectedCurrency, date);

  // Bank/PDC mode detection for cheque field
  useEffect(() => {
    if (formikRef.current) {
      const { values, setFieldValue } = formikRef.current;

      if (values.mode === 'bank' || values.mode === 'pdc') {
        setIsChequeFieldEnabled(true);

        if (values.mode === 'bank') {
          setFieldValue('due_date', voucherDate);
          setDueDate(voucherDate);
          setIsDueDateEditable(true);
        } else if (values.mode === 'pdc') {
          const tomorrow = new Date(voucherDate);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowDate = tomorrow.toISOString().split('T')[0];
          setFieldValue('due_date', tomorrowDate);
          setDueDate(tomorrowDate);
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
  }, [formikRef.current?.values.mode, voucherDate]);

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

  const handleResetRows = () => {

    handlePairReleased()
    setIsDisabled(true);
    if (formikRef.current) {
      formikRef.current.resetForm();
    }
    clearFormValues(formId);
    clearFormValues('special-commission');
    setAddedSpecialCommissionValues(null);
    setAddedAttachments({});
    setTrimmedDataURL(null);
    setErrorSignature(false);
    setAttemptedSubmit(false);
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
    setDate(new Date().toLocaleDateString('en-CA'))
  };
  // Fill required fields before opening SC Modal - Match Receipt Voucher logic
  const handleSCClick = async () => {
    if (!formikRef.current) return;

    // Check required fields for Special Commission
    const formValues = formikRef.current.values;
    const touchedFields = { ...formikRef.current.touched };
    let hasErrors = false;

    // Check Ledger - always show if missing
    if (!formValues.ledger) {
      touchedFields.ledger = true;
      hasErrors = true;
    }

    // Check Account - only if Ledger is selected
    if (formValues.ledger && !formValues.account_id) {
      touchedFields.account_id = true;
      hasErrors = true;
    }

    // Check Currency - always show if missing
    if (!formValues.currency_id) {
      touchedFields.currency_id = true;
      hasErrors = true;
    }

    // Check Amount - only if Currency is selected
    // When Currency is selected, ensure Amount field is also marked as touched
    if (formValues.currency_id && !formValues.amount) {
      touchedFields.currency_id = true; // Keep currency touched
      touchedFields.amount = true;
      hasErrors = true;
    }

    // Only check these 4 fields for Special Commission modal
    // Ignore all other validation errors (mode, commission_amount, vat_amount, etc.)
    if (hasErrors) {
      formikRef.current.setTouched(touchedFields);
      return;
    }

    // Save current form values before navigating to Special Commission
    saveFormValues(formId, {
      values: formikRef.current.values,
      addedAttachments,
    });

    setShowSCModal(true);
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

  const createPaymentVoucherMutation = useMutation({
    mutationFn: createPaymentVoucher,
    onSuccess: (data) => {
      showToast('Payment Voucher Created!', 'success');
      if (getPrintSettings('payment_voucher')) {
        window.open(data.detail?.pdf_url, '_blank');
      }
      queryClient.invalidateQueries(['paymentVoucherListing']);
      handleResetRows();
      setPaymentData(null);
    },
    onError: (error) => {
      if (error.message == 'Voucher limit reached for this branch.') {
        showModal(
          'Cannot Create',
          'The maximum number of PV has been reached. To create new transactions, please increase the transaction number count in the Transaction Number Register.',
          null,
          'error'
        );
      } else if (
        error.message == 'Payment failed: Your card number is incorrect.'
      ) {
        setShowPaymentModal(true);
        setPaymentData(null);
      } else {
        showErrorToast(error);
      }
      console.error('Error creating Payment Voucher', error);
    },
  });

  const handleSubmit = async (paymentFormData = null) => {
    if (!formikRef.current) return;

    // If mode is online and no payment data provided, open payment modal
    if (
      formikRef.current?.values?.mode &&
      formikRef.current?.values?.mode.toLowerCase() === 'online' &&
      // !paymentFormData &&
      !paymentData
    ) {
      setShowPaymentModal(true);
      return;
    }
    setAttemptedSubmit(true);

    // Validate the form
    const errors = await formikRef.current.validateForm();

    // Enhanced VAT validation: If commission is used, VAT must be properly configured
    const formValues = formikRef.current.values;
    const hasCommissionValue = hasCommission(formValues);

    // Ledger validation - must be selected first
    if (!formValues.ledger) {
      errors.ledger = 'Ledger is required';
    }

    // Account validation - only required if ledger is selected
    if (formValues.ledger && !formValues.account_id) {
      errors.account_id = 'Account is required';
    }

    // Currency validation - must be selected first
    if (!formValues.currency_id) {
      errors.currency_id = 'Currency is required';
    }

    // Amount validation - only required if currency is selected
    if (formValues.currency_id && !formValues.amount) {
      errors.amount = 'Amount is required';
    }
    // Amount must be greater than zero
    if (formValues.currency_id && formValues.amount) {
      const amountValue = parseFloat(formValues.amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        errors.amount = 'Amount must be greater than zero';
      }
    }

    // Explicit validation for Mode and Account
    if (!formValues.mode) {
      errors.mode = 'Mode is required';
    }
    if (formValues.mode && (!formValues.mode_account_id || formValues.mode_account_id === '' || formValues.mode_account_id === null || formValues.mode_account_id === undefined)) {
      errors.mode_account_id = 'Account is required';
    }

    if (hasCommissionValue) {
      // Commission is present, VAT must be configured
      if (vatData?.vatType?.vat_type === 'variable') {
        if (!formValues.vat_terms_id) {
          errors.vat_terms = 'VAT % is required';
        }
        // Additional validation for VAT Amount when variable VAT type
        // For VAT amount, 0 is valid for exempted cases, only check if truly empty
        if (formValues.vat_amount === '' || formValues.vat_amount === null || formValues.vat_amount === undefined) {
          errors.vat_amount = 'VAT Amount is required';
        }
      } else if (vatData?.vatType?.vat_type === 'fixed') {
        // For fixed VAT, ensure VAT percentage is available
        if (!vatData?.vatType?.vat_percentage) {
          errors.vat_terms = 'VAT configuration is missing for fixed VAT type';
        }
      } else {
        errors.vat_terms = 'VAT configuration is missing';
      }

      // Commission Type validation - only required for normal commission, not special commission
      // If normal commission exists (not special commission), commission_type is required
      if (formValues.commission && !formValues.commission_type && !addedSpecialCommissionValues) {
        errors.commission_type = 'Please select Commission Type';
      }
    }

    if (formValues.commission !== '' && isNaN(formValues.commission)) {
      errors.commission = 'Amount must be a number';
    }

    // Commission amount validation - should not exceed base amount
    if (formValues.commission_amount && formValues.amount) {
      const commissionAmount = parseFloat(formValues.commission_amount) || 0;
      const baseAmount = parseFloat(formValues.amount) || 0;
      if (commissionAmount > baseAmount) {
        errors.commission_amount = 'Commission amount cannot exceed base amount';
      }
    }

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

    // Calculate VAT amount and percentage based on conditions - only if commission is applied
    let finalVatAmount = 0;
    let finalVatPercentage = 0;

    if (hasCommissionValue) {
      finalVatAmount = formValues.vat_amount || 0;
      finalVatPercentage = formValues.vat_percentage || 0;

      if (shouldVatAmountBeZero(formValues.vat_terms)) {
        finalVatAmount = 0;
        finalVatPercentage = 0;
      }
    }

    // Set cheque_number to "Cash" if empty for Bank or PDC modes
    let chequeNumber = formValues.cheque_number;
    if ((formValues.mode === 'bank' || formValues.mode === 'pdc') && (!chequeNumber || chequeNumber.trim() === '')) {
      chequeNumber = 'Cash';
      // Update the field value to show "Cash" in the input after submission
      if (formikRef.current) {
        formikRef.current.setFieldValue('cheque_number', 'Cash');
      }
    }

    let payload = {
      date,
      ...formValues,
      signature: trimmedDataURL,
      ...(addedAttachments || {}),
      ...((formValues.vat_terms?.startsWith?.('A small popup') ||
        formValues.vat_terms?.toLowerCase() === 'out of scope') && {
        out_of_scope_reason: outOfScope,
      }),
      mode: formValues.mode.charAt(0).toUpperCase() + formValues.mode.slice(1),
      cheque_number: chequeNumber,

      vat_amount: finalVatAmount,
      vat_percentage: finalVatPercentage,
      vat_terms:
        formValues.vat_terms ||
        (formValues.vat_percentage !== '' && !isNaN(formValues.vat_percentage)
          ? Number(formValues.vat_percentage)
          : ''),
      vat_type: '', // Add VAT type
      vat_terms_id: formValues.vat_terms_id || '', // Add VAT terms ID
      // Include payment data if provided (for online mode)
      ...(formValues.mode && 
        (formValues.mode.toLowerCase() === 'online') &&
        (paymentFormData || paymentData) && {
        'payment_details[cardholder_name]':
          (paymentFormData || paymentData).cardholder_name || '',
        'payment_details[card_number]':
          (paymentFormData || paymentData).card_number || '',
        'payment_details[cvv_number]':
          (paymentFormData || paymentData).cvv_number || '',
        'payment_details[validity_date]':
          (paymentFormData || paymentData).validity_date || '',
        'payment_details[bank_account_number]':
          (paymentFormData || paymentData).bank_account_number || '',
        'payment_details[swift_bic_code]':
          (paymentFormData || paymentData).swift_bic_code || '',
        'payment_details[routing_number]':
          (paymentFormData || paymentData).routing_number || '',
        'payment_details[iban]': (paymentFormData || paymentData).iban || '',
        'payment_details[account_name]':
          (paymentFormData || paymentData).account_name || '',
        'payment_details[exp_month]':
          (paymentFormData || paymentData).exp_month || '',
        'payment_details[exp_year]':
          (paymentFormData || paymentData).exp_year || '',
      }),
    };

    // Debug logging to track payment data
    console.log('Form Values Mode:', formValues.mode);
    console.log('Payment Form Data:', paymentFormData);
    console.log('Payment Data State:', paymentData);
    console.log('Should include payment details:', formValues.mode && 
      (formValues.mode.toLowerCase() === 'online') &&
      (paymentFormData || paymentData));

    // Only include commission_type and VAT fields if commission is applied
    if (hasCommissionValue) {
      payload.commission_type = formValues.commission_type;
      payload.vat_type = vatData?.vatType?.vat_type || '';
    } else {
      // Remove commission_type and VAT fields when no commission
      delete payload.commission_type;
      delete payload.vat_type;
      delete payload.vat_amount;
      delete payload.vat_percentage;
      delete payload.vat_terms;
      delete payload.vat_terms_id;
    }

    // Flatten Special Commission like Receipt Voucher
    if (addedSpecialCommissionValues) {
      // Calculate VAT for special commission
      const commissionAmount =
        addedSpecialCommissionValues?.total_commission || 0;
      const vatPercentage =
        vatData.vatType?.vat_percentage ||
        (!isNaN(formValues.vat_terms) ? formValues.vat_terms : 0);

      // Check if VAT amount should be 0 based on VAT terms
      let vatAmount = 0;
      if (shouldVatAmountBeZero(formValues.vat_terms)) {
        vatAmount = 0;
      } else if (commissionAmount && vatPercentage) {
        vatAmount = (commissionAmount * vatPercentage) / 100;
      }

      const scConverted = {};
      const sc = {
        transaction_no: lastVoucherNumbers?.current,
        date,
        ledger: formValues.ledger,
        account_id: formValues.account_id,
        currency_id: formValues.currency_id,
        amount: formValues.amount,
        commission_amount: commissionAmount,
        vat_percentage: vatPercentage,
        vat_amount: vatAmount,
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
    setDate(new Date().toLocaleDateString('en-CA'))
    
    // Debug logging to show final payload
    console.log('Final Payload being sent:', payload);
    
    createPaymentVoucherMutation.mutate(payload);
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

  // Restore form data from store
  useEffect(() => {
    if (restoreValuesFromStore) {
      const savedFormData = getFormValues(formId);
      if (savedFormData && formikRef.current) {
        const savedValues = savedFormData.values || {};
        formikRef.current.setValues(savedValues);
        setSelectedCurrency(savedValues.currency_id);
        setAddedAttachments(savedFormData.addedAttachments || null);
        setIsDisabled(false);
        clearFormValues(formId);
        clearLastVisitedPage(formId);
      }
    }
  }, [restoreValuesFromStore]);

  useEffect(() => {
    if (onFormDataChange && formikRef.current) {
      onFormDataChange({
        values: formikRef.current.values,
        addedAttachments,
      });
    }
  }, [formikRef.current?.values, addedAttachments, onFormDataChange]);

  const getAccountsByTypeOptions = (accountType) => {
    if (!accountType) {
      return [{ label: 'Select Ledger', value: null, isDisabled: true }];
    }

    const { data, loading } = accountData[accountType] || {};

    if (loading) {
      return [{ label: 'Loading...', value: null, isDisabled: true }];
    }

    let options =
      data?.map((x) => ({
        value: x?.id,
        label: x?.title,
      })) || [];
    switch (accountType) {
      case 'party':
        options.push({ label: `Add New PL`, value: null });
        break;
      case 'general':
        options.push({ label: `Add New GL`, value: null });
        break;
      case 'walkin':
        options.push({ label: `Add New WIC`, value: null });
        break;
      default:
        break;
    }
    return options;
  };

  const getAccountsByTypeMode = (mode) => {
    if (!mode) {
      return [{ label: 'Select Mode', value: null, isDisabled: true }];
    }

    const { data, loading, error, errorMessage } = modesData[mode] || {};

    if (loading) {
      return [{ label: 'Loading...', value: null, isDisabled: true }];
    }

    if (error) {
      console.error('Unable to fetch Mode', errorMessage);
      return [{ label: 'Unable to fetch Mode', value: null }];
    }

    return (
      data?.map((x) => ({
        value: x?.id,
        label: x?.account_name,
      })) || []
    );
  };

  const getVATTermsOptions = () => {
    if (vatData.isLoadingVatType) return [{ label: 'Loading...', value: '' }];
    if (vatData.isErrorVatType) {
      console.error('Unable to fetch VAT Terms', vatData.errorMessage);
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

  // Helper function to check if commission is present
  const hasCommission = (values) => {
    return values.commission || addedSpecialCommissionValues;
  };

  // Helper function to check if VAT should be applied
  const shouldApplyVat = (values) => {
    return hasCommission(values);
  };

  // Helper function to get VAT display value
  const getVatAmountDisplayValue = (values) => {
    if (!shouldApplyVat(values)) {
      return ''; // Show empty when VAT is not applied
    }

    if (vatData.isLoadingVatType) {
      return 'Loading...';
    }

    // For exempted/zero rated/out of scope, show 0 instead of empty
    if (shouldVatAmountBeZero(values.vat_terms)) {
      return formatNumberWithCommas(0);
    }

    return formatNumberWithCommas(values.vat_amount || ''); // Show calculated value formatted
  };


  // Fetch cheques for selected bank - FIXED API ENDPOINT
  const {
    data: modeCheques,
    isLoading: isLoadingCheques,
    isError: isErrorCheques,
    error: errorCheques,
  } = useQuery({
    queryKey: ['cheques', selectedBank],
    queryFn: () => getChequeNumberByBank(selectedBank),
    enabled:
      !!selectedBank &&
      (formikRef.current?.values.mode === 'bank' ||
        formikRef.current?.values.mode === 'pdc'),
    staleTime: 1000 * 60 * 5,
  });

  const chequeOptions =
    modeCheques?.map((cheque) => ({
      label: cheque.cheque_number,
      value: cheque.cheque_number,
    })) || [];

  // Get Beneficiaries from selected Ledger+Account
  const {
    data: beneficiaryAccounts,
    isLoading: isLoadingBeneficiary,
    isError: isErrorBeneficiary,
    error: errorBeneficiary,
  } = useQuery({
    queryKey: ['beneficiaries', selectedLedgerAccount],
    queryFn: () =>
      getBenefeciariesByAccount(
        selectedLedgerAccount?.value || selectedLedgerAccount
      ),
    enabled: !!selectedLedgerAccount,
  });

  // Get current beneficiary details for payment modal
  const getCurrentBeneficiaryDetails = () => {
    if (formikRef.current?.values?.mode === 'online' && 
        (formikRef.current?.values?.ledger === 'party' || formikRef.current?.values?.ledger === 'walkin') &&
        formikRef.current?.values?.account_id &&
        beneficiaryAccounts?.length > 0) {
      
      const selectedBeneficiaryId = formikRef.current?.values?.account_id;
      const beneficiary = beneficiaryAccounts.find(acc => acc.id === selectedBeneficiaryId);
      
      // If no exact match found, try to use the first available beneficiary as fallback
      const fallbackBeneficiary = beneficiary || beneficiaryAccounts[0];
      
      if (fallbackBeneficiary) {
        return {
          bank_account_number: fallbackBeneficiary.bank_account_number || '',
          swift_bic_code: fallbackBeneficiary.swift_bic_code || '',
          routing_number: fallbackBeneficiary.routing_number || '',
          iban: fallbackBeneficiary.iban || '',
          account_name: fallbackBeneficiary.title || '',
          // Add corresponding bank details
          corresponding_bank: fallbackBeneficiary.corresponding_bank || '',
          corresponding_bank_account_number: fallbackBeneficiary.corresponding_bank_account_number || '',
          corresponding_swift_bic_code: fallbackBeneficiary.corresponding_swift_bic_code || '',
        };
      }
    }
    
    return {
      bank_account_number: '',
      swift_bic_code: '',
      routing_number: '',
      iban: '',
      account_name: '',
      // Add corresponding bank details
      corresponding_bank: '',
      corresponding_bank_account_number: '',
      corresponding_swift_bic_code: '',
    };
  };

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
      })) || [];

    options.push({
      label: `Add New Beneficiary`,
      value: null,
    });

    return options;
  };

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
  useEffect(() => {
    if (isDisabled && sigCanvas.current) {
      sigCanvas.current.off(); // turns off drawing
    } else if (sigCanvas.current) {
      sigCanvas.current.on(); // re-enable
    }
  }, [isDisabled]);

  const getSCValues = () => {
    // Prepare Special Commission values (kept for compatibility; main flow now mirrors Receipt Voucher)
    const values = {
      date,
      transaction_no:
        lastVoucherNumbers?.current || lastVoucherNumbers?.last || '',
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
      ledger:
        [
          { label: 'PL', value: 'party' },
          { label: 'GL', value: 'general' },
          { label: 'WIC', value: 'walkin' },
        ].find((x) => x.value === formikRef?.current?.values.ledger) || '',
      commission_type:
        formikRef?.current?.values.commission_type ||
        addedSpecialCommissionValues?.commission_type ||
        'Income',
    };

    return values;
  };

  const handlePayment = (paymentFormData) => {
    // Process payment data to match backend validation structure
    const processedPaymentData = {
      cardholder_name: paymentFormData.cardholder_name || null,
      card_number: paymentFormData.card_number
        ? paymentFormData.card_number.replace(/\s/g, '')
        : null,
      cvv_number: paymentFormData.cvv_number || null,
      validity_date: paymentFormData.exp_month || null,
      bank_account_number: paymentFormData.bank_account_number || null,
      swift_bic_code: paymentFormData.swift_bic_code || null,
      routing_number: paymentFormData.routing_number || null,
      iban: paymentFormData.iban || null,
      account_name: paymentFormData.account_name,
      // Split exp_month into separate fields
      ...(paymentFormData.exp_month && {
        exp_month: parseInt(paymentFormData.exp_month.split('-')[1]) || null,
        exp_year: parseInt(paymentFormData.exp_month.split('-')[0]) || null,
      }),
    };

    // Store payment data and call handleSubmit with it
    setPaymentData(processedPaymentData);
    setShowPaymentModal(false);
    // Call handleSubmit with payment data to automatically save the voucher
    handleSubmit(processedPaymentData);
  };

  return (
    <>
      <div className="d-card">
        <Formik
          innerRef={formikRef}
          initialValues={{
            ledger: '',
            account_id: '',
            paid_to: '',
            paid_to_id: '',
            mode: '',
            mode_account_id: '',
            cheque_number: '',
            due_date: '',
            narration: '',
            currency_id: '',
            amount: '',
            commission_type: '',
            commission: '',
            commission_amount: '',
            vat_terms: '',
            vat_terms_id: '', // Add VAT terms ID field
            vat_amount: '',
            net_total: '',
            comment: '',
            signature: '',
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

            if (!values.mode) errors.mode = 'Mode is required';
            if (values.mode && (!values.mode_account_id || values.mode_account_id === '' || values.mode_account_id === null || values.mode_account_id === undefined)) {
              errors.mode_account_id = 'Account is required';
            }
            // Enhanced VAT validation - only required if commission is used
            if (hasCommission(values)) {
              if (vatData?.vatType?.vat_type === 'variable') {
                if (!values.vat_terms_id) {
                  errors.vat_terms = 'VAT % is required';
                }
                // Additional validation for VAT Amount when variable VAT type
                // For VAT amount, 0 is valid for exempted cases, only check if truly empty
                if (values.vat_amount === '' || values.vat_amount === null || values.vat_amount === undefined) {
                  errors.vat_amount = 'VAT Amount is required';
                }
              }
            }

            // Commission Type validation - only required for normal commission, not special commission
            // If normal commission exists (not special commission), commission_type is required
            if (values.commission && !values.commission_type && !addedSpecialCommissionValues) {
              errors.commission_type = 'Please select Commission Type';
            }
            if (values.commission !== '' && isNaN(values.commission)) {
              errors.commission = 'Amount must be a number';
            }

            // Due Date validation
            if (
              (values.mode === 'bank' || values.mode === 'pdc') &&
              !values.due_date
            ) {
              errors.due_date = 'Due Date is required for Bank or PDC mode';
            }

            // Commission amount validation - should not exceed base amount
            if (values.commission_amount && values.amount) {
              const commissionAmount = parseFloat(values.commission_amount) || 0;
              const baseAmount = parseFloat(values.amount) || 0;
              if (commissionAmount > baseAmount) {
                errors.commission_amount = 'Commission amount cannot exceed base amount';
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
          }) => {
            // --- VAT and Net Total Calculation useEffect - Match Receipt Voucher ---
            React.useEffect(() => {
              const hasCommissionValue = hasCommission(values);

              // Calculate VAT percentage
              let vatPercentage = 0;
              let vatAmount = 0;

              if (hasCommissionValue) {
                vatPercentage = vatData.vatType?.vat_percentage || (!isNaN(values.vat_percentage) ? values.vat_percentage : 0);

                // Check if VAT amount should be 0 based on VAT terms
                if (!shouldVatAmountBeZero(values.vat_terms)) {
                  // Determine commission amount (normal commission or special commission)
                  let commissionAmount = 0;
                  if (values.commission) {
                    // Normal commission: calculate from percentage
                    commissionAmount = (parseFloat(values.commission) / 100) * parseFloat(values.amount);
                  } else if (addedSpecialCommissionValues?.total_commission) {
                    // Special commission: use the total commission amount
                    commissionAmount = addedSpecialCommissionValues.total_commission;
                  }


                  // Calculate VAT on commission amount
                  if (commissionAmount > 0) {
                    vatAmount = (commissionAmount * vatPercentage) / 100;
                  }
                }
              }

              // Only set VAT amount if commission is present, otherwise leave empty
              if (hasCommissionValue) {
                // For exempted/zero rated/out of scope, set 0 instead of empty
                if (shouldVatAmountBeZero(values.vat_terms)) {
                  setFieldValue('vat_amount', 0);
                } else {
                  setFieldValue('vat_amount', vatAmount);
                }
              } else {
                setFieldValue('vat_amount', ''); // This will show "Not Applied" via getVatAmountDisplayValue
              }

              // Calculate commission on base amount only (not VAT-inclusive)
              let commissionAmount = 0;
              let finalCommissionAmount = 0;

              if (values.commission && values.amount) {
                // Normal commission calculated on base amount only
                commissionAmount = (parseFloat(values.commission) / 100) * parseFloat(values.amount);
                // Round to avoid floating-point precision issues (round to 8 decimal places)
                commissionAmount = Math.round(commissionAmount * 100000000) / 100000000;
                // Ensure commission amount doesn't exceed base amount
                const baseAmount = parseFloat(values.amount);
                if (commissionAmount > baseAmount) {
                  commissionAmount = baseAmount;
                }
                // Commission Amount field shows only Commission Amount (not VAT + Commission)
                setFieldValue('commission_amount', commissionAmount);
                finalCommissionAmount = commissionAmount;
              } else if (addedSpecialCommissionValues?.total_commission) {
                // Special commission: use the total commission amount
                finalCommissionAmount = addedSpecialCommissionValues.total_commission;
                // For Special Commission, keep commission_amount empty in main field
                setFieldValue('commission_amount', '');
              }

              // Calculate Net Total: Currency Amount + VAT Amount + Commission Amount
              let netTotal = '';
              if (values.amount) {
                const baseAmount = parseFloat(values.amount);
                const vatAmountToAdd = hasCommissionValue ? parseFloat(vatAmount || 0) : 0;
                const commissionAmountToAdd = parseFloat(finalCommissionAmount || 0);

                netTotal = Math.round(
                  (baseAmount - vatAmountToAdd - commissionAmountToAdd - Number.EPSILON) * 1000000
                ) / 1000000;
                setFieldValue('net_total', netTotal);
              }
            }, [
              addedSpecialCommissionValues?.total_commission,
              values.commission_amount,
              values.commission,
              values.amount,
              values.vat_percentage,
              values.vat_terms,
              vatData.vatType?.vat_percentage,
              setFieldValue,
            ]);

            // Auto-set VAT for fixed VAT type
            React.useEffect(() => {
              const hasCommissionValue = hasCommission(values);

              if (
                hasCommissionValue &&
                vatData?.vatType?.vat_type === 'fixed' &&
                vatData?.vatType?.vat_percentage !== undefined &&
                vatData?.vatType?.vat_percentage !== null &&
                !values.vat_terms
              ) {
                setFieldValue('vat_percentage', vatData.vatType.vat_percentage);
                setFieldValue('vat_terms', 'Fixed');
                // For fixed VAT type, set the first available VAT term ID if available
                if (vatData?.vatType?.vats && vatData.vatType.vats.length > 0) {
                  setFieldValue('vat_terms_id', vatData.vatType.vats[0].id);
                }
              }
            }, [
              values.commission,
              addedSpecialCommissionValues,
              vatData?.vatType?.vat_type,
              vatData?.vatType?.vat_percentage,
              vatData?.vatType?.vats,
              values.vat_terms,
              setFieldValue,
            ]);
            // --- End VAT Calculation useEffect ---

            return (
              <Form>
                <div className="row">
                  <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
                    <div className="row mb-4">
                      {/* Special Commission Modal */}
                      <CustomModal
                        show={showSCModal}
                        close={() => setShowSCModal(false)}
                        size="xl"
                        closeOnOutsideClick={false}
                      >
                        <SpecialCommission
                          key={addedSpecialCommissionValues ? 'edit' : 'new'}
                          preFilledValues={{
                            date,
                            transaction_no:
                              lastVoucherNumbers?.current ||
                              lastVoucherNumbers?.last ||
                              '',
                            account:
                              getAccountsByTypeOptions(
                                formikRef?.current?.values.ledger
                              ).find(
                                (x) =>
                                  x.value ===
                                  formikRef?.current?.values.account_id
                              ) || '',
                            currency:
                              addedSpecialCommissionValues?.currency ||
                              currencyOptions.find(
                                (x) =>
                                  x.value ===
                                  formikRef?.current?.values.currency_id
                              ) || '',
                            amount: formikRef?.current?.values.amount || 0,
                            ...addedSpecialCommissionValues,
                            ledger:
                              [
                                { label: 'PL', value: 'party' },
                                { label: 'GL', value: 'general' },
                                { label: 'WIC', value: 'walkin' },
                              ].find(
                                (x) =>
                                  x.value ===
                                  formikRef?.current?.values.ledger
                              ) || '',
                            commission_type:
                              formikRef?.current?.values.commission_type ||
                              addedSpecialCommissionValues?.commission_type ||
                              'Income',
                          }}
                          sCValues={addedSpecialCommissionValues}
                          isEdit={false}
                          onSubmit={(sCValues) => {
                            setAddedSpecialCommissionValues(sCValues);
                            // Clear outer commission_type when Special Commission has commission_type
                            if (sCValues?.commission_type && formikRef.current) {
                              formikRef.current.setFieldValue(
                                'commission_type',
                                ''
                              );
                              // Also clear commission and commission_amount to ensure clean state
                              if (!formikRef.current.values.commission) {
                                formikRef.current.setFieldValue(
                                  'commission',
                                  ''
                                );
                                formikRef.current.setFieldValue(
                                  'commission_amount',
                                  ''
                                );
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
                              formikRef.current.setFieldValue(
                                'commission_type',
                                ''
                              );
                            }
                          }}
                        />
                      </CustomModal>

                      {/* Ledger Field */}
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

                      {/* Paid To Field */}
                      <div className="col-12 col-sm-6 mb-45">
                        <SearchableSelect
                          name={'paid_to'}
                          label={'Paid To'}
                          options={getBeneficiaryOptions(values.account_id)}
                          isDisabled={isDisabled}
                          placeholder={'Select Paid To'}
                          value={values.paid_to || newlyCreatedBeneficiary?.id}
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
                          isDisabled={isDisabled}
                          handleBlur={handleBlur}
                          placeholder1="Mode"
                          placeholder2="Select Account"
                          className1="mode"
                          className2="mode-account"
                          onChange1={(selected) => {
                            setFieldValue('mode', selected.value);
                            setFieldValue('mode_account_id', '');
                            setSelectedModeAccount(null);
                            setSelectedBank(null);
                          }}
                          onChange2={(selected) => {
                            setFieldValue('mode_account_id', selected.value);
                            setSelectedBank(selected.value);
                            if (!values.narration) {
                              setFieldValue(
                                'narration',
                                'This is Payment Voucher text for narration'
                              );
                            }
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

                      {/* Due Date Field */}
                      {(values.mode === 'bank' || values.mode === 'pdc') && (
                        <div className="col-12 col-sm-6 mb-3">
                          <CustomInput
                            name={'due_date'}
                            label={'Due Date'}
                            type={'date'}
                            disabled={!isDueDateEditable || isDisabled}
                            value={values.due_date}
                            onChange={(e) => {
                              handleChange(e);
                              setDueDate(e.target.value);
                            }}
                            onBlur={handleBlur}
                            error={touched.due_date && errors.due_date}
                          />
                        </div>
                      )}

                      {/* Narration Field */}
                      <div className="col-12 mb-3">
                        <CustomInput
                          name={'narration'}
                          label={'Narration'}
                          type={'textarea'}
                          placeholder={'Enter Narration'}
                          disabled={isDisabled}
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
                            setFieldValue('currency_id', selected.value);
                            setSpecialCommissionValues((prev) => ({
                              ...prev,
                              currency: selected,
                            }));
                            // Recalculate Special Commission if it exists and currency changed
                            if (
                              addedSpecialCommissionValues &&
                              values.amount
                            ) {
                              const commissionPercentage = parseFloat(
                                addedSpecialCommissionValues.commission
                              ) || 0;
                              const amount =
                                parseFloat(values.amount) || 0;
                              const newTotalCommission =
                                (commissionPercentage / 100) * amount;

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

                              // Update Special Commission values with new currency and recalculated commission
                              setAddedSpecialCommissionValues((prev) => ({
                                ...prev,
                                currency_id: selected.value,
                                currency: selected,
                                amount,
                                total_commission: newTotalCommission,
                                distributions:
                                  updatedDistributions.length > 0
                                    ? updatedDistributions
                                    : prev.distributions,
                              }));
                            }
                          }}
                          onChange2={(e) => {
                            handleChange(e);
                            let commission = parseFloat(values.commission || 0);
                            let amount = parseFloat(e.target.value || 0);
                            const hasCommissionValue = hasCommission(values);

                            // Recalculate Special Commission if it exists and amount/currency changed
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
                              setFieldValue('vat_amount', ''); // This will show "Not Applied"
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

                      {/* Commission Type Field */}
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
                                  displayLabel: 'Remove Commission Type', // Custom display label
                                },
                              ]
                              : []),
                          ]}
                          isDisabled={
                            isDisabled ||
                            !!addedSpecialCommissionValues?.commission_type
                          }
                          placeholder={'Select Commission Type'}
                          value={values.commission_type}
                          onChange={(selected) => {
                            // Handle "Remove Commission Type" option
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

                              setSpecialCommissionValues((prev) => ({
                                ...prev,
                                commission_type: '',
                              }));
                            } else {
                              // Allow clearing the selection
                              const newValue = selected?.value || '';
                              setFieldValue('commission_type', newValue);
                              setSpecialCommissionValues((prev) => ({
                                ...prev,
                                commission_type: newValue,
                              }));
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
                            isDisabled ||
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

                            let inputCommission = parseFloat(
                              v.target.value || 0
                            );
                            let amount = parseFloat(values.amount || 0);
                            const hasCommissionValue = hasCommission(values);

                            // Cap commission percentage at 100%
                            let commission = inputCommission;
                            if (commission > 100) {
                              commission = 100;
                            }

                            // Calculate commission amount from percentage
                            let commissionAmount = 0;
                            if (commission && amount) {
                              commissionAmount = (commission / 100) * amount;
                              // Round to avoid floating-point precision issues (round to 8 decimal places)
                              commissionAmount =
                                Math.round(commissionAmount * 100000000) /
                                100000000;
                              // Ensure commission amount doesn't exceed base amount
                              if (commissionAmount > amount) {
                                commissionAmount = amount;
                                commission = 100; // Set to 100% if commission equals base amount
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

                            // Set commission percentage (use setFieldValue instead of handleChange to avoid conflicts)
                            setFieldValue('commission', commission);

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

                            // Calculate Net Total: Currency Amount + VAT Amount + Commission Amount
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
                            const hasCommissionValue = hasCommission(values);

                            // Validate commission amount doesn't exceed base amount - clamp immediately
                            if (isNaN(commissionAmount) || commissionAmount < 0) {
                              commissionAmount = 0;
                            }
                            if (commissionAmount > amount && amount > 0) {
                              commissionAmount = amount;
                            }

                            // Calculate commission percentage from amount
                            // Round to avoid floating-point precision issues when recalculating
                            let commission =
                              amount !== 0
                                ? (commissionAmount / amount) * 100
                                : 0;
                            // Round percentage to reasonable precision (8 decimal places)
                            commission =
                              Math.round(commission * 100000000) / 100000000;

                            // Recalculate commission amount from rounded percentage to ensure consistency
                            let recalculatedCommissionAmount =
                              amount !== 0 ? (commission / 100) * amount : 0;
                            recalculatedCommissionAmount =
                              Math.round(recalculatedCommissionAmount * 100000000) /
                              100000000;

                            // Use the recalculated value to ensure precision consistency
                            const finalCommissionAmount =
                              recalculatedCommissionAmount;

                            // Set both values with the properly rounded amounts
                            setFieldValue(
                              'commission_amount',
                              finalCommissionAmount
                            );
                            setFieldValue('commission', commission);

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

                            // Calculate Net Total: Currency Amount + VAT Amount + Commission Amount
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

                      {/* VAT Fields */}
                      {vatData?.vatType?.vat_type === 'variable' && (
                        <div className="col-12 col-sm-6 mb-45">
                          <SearchableSelect
                            name={'vat_terms'}
                            label={'VAT %'}
                            options={getVATTermsOptions()}
                            isDisabled={isDisabled || !hasCommission(values)}
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
                                if (shouldVatAmountBeZero(vatTerms)) {
                                  setFieldValue('vat_percentage', 0);
                                } else {
                                  setFieldValue(
                                    'vat_percentage',
                                    vatPercentage
                                  );
                                }

                                let commission = parseFloat(
                                  values.commission || 0
                                );
                                let amount = parseFloat(values.amount || 0);
                                const hasCommissionValue =
                                  hasCommission(values);

                                // Calculate VAT on commission amount first - only if commission is applied
                                let vatAmount = 0;
                                if (
                                  hasCommissionValue &&
                                  !shouldVatAmountBeZero(vatTerms) &&
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
                                    // Special commission: use the total commission amount
                                    commissionAmount =
                                      addedSpecialCommissionValues.total_commission;
                                  }

                                  // Calculate VAT on commission amount
                                  if (commissionAmount > 0) {
                                    vatAmount =
                                      (commissionAmount * vatPercentage) / 100;
                                  }
                                }

                                // Calculate commission on base amount only (not VAT-inclusive)
                                let commissionAmount =
                                  (commission / 100) * amount; // Commission on base amount only

                                // Use Special Commission total if available, otherwise use calculated commission amount
                                let finalCommissionAmount =
                                  addedSpecialCommissionValues?.total_commission ??
                                  commissionAmount;

                                // Only set VAT amount if commission is present
                                if (hasCommissionValue) {
                                  setFieldValue('vat_amount', vatAmount);
                                } else {
                                  setFieldValue('vat_amount', '');
                                }
                                setFieldValue(
                                  'net_total',
                                  Math.round(
                                    (amount -
                                      vatAmount -
                                      finalCommissionAmount -
                                      Number.EPSILON) *
                                    1000000
                                  ) / 1000000
                                );
                                // Commission Amount field shows only Commission Amount (not VAT + Commission)
                                if (
                                  !addedSpecialCommissionValues?.total_commission
                                ) {
                                  setFieldValue(
                                    'commission_amount',
                                    commissionAmount
                                  );
                                } else {
                                  // For Special Commission, keep commission_amount empty in main field
                                  setFieldValue('commission_amount', '');
                                }
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

                      {vatData?.vatType?.vat_type === 'fixed' && (
                        <div className="col-12 col-sm-6 mb-3">
                          <CustomInput
                            name={'vat_terms'}
                            label={'VAT %'}
                            type={'text'}
                            disabled={true}
                            placeholder={'VAT Terms'}
                            value={`Fixed - ${values.vat_percentage}%`}
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
                        <ErrorMessage
                          name="vat_amount"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>

                      <div className="col-12 col-sm-6 mb-45">
                        <CustomInput
                          name={'net_total'}
                          label={'Net Paid'}
                          type={'text'}
                          disabled={true}
                          placeholder={'Enter Net Paid'}
                          value={
                            values.net_total
                              ? formatNumberTwoDecimals(values.net_total)
                              : ''
                          }
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>

                      {/* Comment Field */}
                      <div className="col-12 mb-3">
                        <CustomInput
                          name={'comment'}
                          label={'Comment'}
                          type={'textarea'}
                          placeholder={'Enter Comment'}
                          disabled={isDisabled}
                          value={values.comment}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.comment && errors.comment}
                        />
                      </div>

                      {/* Signature Field */}
                      <div className="col-12 mb-3">
                        <div
                          className={`${isDisabled ? 'signature-disabled' : ''
                            }`}
                        >
                          <label>Signature</label>
                          <SignatureCanvas
                            ref={sigCanvas}
                            penColor="green"
                            canvasProps={{
                              height: 200,
                              className: 'sigCanvas',
                            }}
                          />
                          <span style={{ color: 'red' }}>
                            {errorSignature && 'Signature is Required'}
                          </span>
                        </div>
                        <div className="d-flex gap-2 mt-3">
                          <CustomButton
                            text={'Clear'}
                            type={'submit'}
                            disabled={isDisabled}
                            onClick={clear}
                          />
                          <CustomButton
                            text={'Trim'}
                            type={'submit'}
                            disabled={isDisabled}
                            onClick={trim}
                          />
                        </div>
                        {trimmedDataURL ? (
                          <img alt="signature" src={trimmedDataURL} />
                        ) : null}
                      </div>
                    </div>
                    <FileDisplayList
                      files={addedAttachments}
                      onRemoveFile={handleRemoveAttachedFile}
                    />

                    {/* Special Commission */}
                    <div className="d-flex mb-3">
                      <CustomButton
                        type={'button'}
                        onClick={handleSCClick}
                        text={
                          addedSpecialCommissionValues
                            ? 'Edit Special Commission'
                            : 'Add Special Commission'
                        }
                        disabled={
                          !!values.commission ||
                          !!values.commission_type ||
                          isDisabled
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
                            (x) =>
                              x.value ==
                              addedSpecialCommissionValues.currency_id
                          )?.label
                        }{' '}
                        {formatNumberTwoDecimals(addedSpecialCommissionValues?.total_commission)} on{' '}
                        {
                          currencyOptions.find(
                            (x) =>
                              x.value ==
                              addedSpecialCommissionValues.currency_id
                          )?.label
                        }{' '}
                        {formatNumberTwoDecimals(addedSpecialCommissionValues.amount)}
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
                  <div className="d-flex flex-wrap justify-content-start mb-5">
                    <div className="d-inline-block mt-3">
                      <CustomCheckbox
                        label="Account Balance"
                        checked={getAccountBalanceSettings('payment_voucher')}
                        style={{ border: 'none', margin: 0 }}
                        onChange={(e) =>
                          updateAccountBalanceSetting(
                            'payment_voucher',
                            e.target.checked
                          )
                        }
                        readOnly={isDisabled}
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
          { text: 'Save', onClick: handleSubmit },
          {
            text: 'Cancel',
            onClick: handleResetRows,
            variant: 'secondaryButton',
          },
        ]}
        loading={createPaymentVoucherMutation.isPending}
        onAttachmentClick={() => setUploadAttachmentsModal(true)}
        lastVoucherNumbers={lastVoucherNumbers}
        setPageState={setPageState}
        setSearchTerm={setSearchTerm}
        setWriteTerm={setWriteTerm}
      />

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

      {/* VAT Out Of Scope Modal  */}
      <CustomModal
        show={showVatOutOfScopeModal}
        close={() => {
          formikRef.current.values.vat_terms = '';
          formikRef.current.values.vat_percentage = '';
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
                    r
                    rows={1}
                    value={values.out_of_scope}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.out_of_scope && errors.out_of_scope}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
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
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </CustomModal>

      {/* Payment Modal */}
      <CustomModal
        show={showPaymentModal}
        close={() => {
          setShowPaymentModal(false);
        }}
        size="lg"
      >
        <div className="text-center mb-3 mt-5">
          <h4 className="modalTitle px-5">Payment</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{
              cardholder_name: '',
              card_number: '',
              cvv_number: '',
              exp_month: '',
              ...getCurrentBeneficiaryDetails(),
            }}
            validationSchema={paymentValidationSchema}
            onSubmit={(values) => {
              setShowPaymentModal(false);
              handlePayment(values);
            }}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              setFieldValue,
            }) => {
              // Helper function to create card number display with hyphens
              const getCardNumberDisplay = (value) => {
                // Remove all non-numeric characters
                const cleanValue = String(value || '').replace(/\D/g, '');

                // Limit to max 16 digits (standard card length)
                const limitedValue = cleanValue.slice(0, 16);

                // Insert spaces every 4 digits
                const formattedValue = limitedValue
                  .replace(/(.{4})/g, '$1 ')
                  .trim();

                return formattedValue;
              };

              // Input validation functions
              const handleAlphabetsOnly = (e, fieldName) => {
                const value = e.target.value.replace(/[^a-zA-Z\s]/g, ''); // Only letters and spaces
                setFieldValue(fieldName, value);
              };

              const handleNumericOnly = (e, fieldName) => {
                const value = e.target.value.replace(/\D/g, ''); // Only digits
                setFieldValue(fieldName, value);
              };

              const handleAlphanumericOnly = (e, fieldName) => {
                const value = e.target.value.replace(/[^a-zA-Z0-9]/g, ''); // Only letters and numbers
                setFieldValue(fieldName, value);
              };

              const handleCardNumberChange = (e) => {
                const inputValue = e.target.value;

                // Extract only the digits from the input, ignoring underscores and spaces
                const digitsOnly = inputValue.replace(/[^0-9]/g, '');

                // Limit to 16 digits maximum
                if (digitsOnly.length <= 16) {
                  setFieldValue('card_number', digitsOnly);
                }
              };

              return (
                <Form>
                  <Row className="mb-3">
                    <h4 className="screen-title-body">Payer’s Detail</h4>
                    <Col xs={12} sm={6} className="mb-3">
                      <CustomInput
                        name="cardholder_name"
                        label="Cardholder Name"
                        placeholder="Enter Cardholder Name"
                        required
                        value={values.cardholder_name}
                        onChange={(e) =>
                          handleAlphabetsOnly(e, 'cardholder_name')
                        }
                        onBlur={handleBlur}
                        error={
                          touched.cardholder_name && errors.cardholder_name
                        }
                      />
                    </Col>
                    <Col xs={12} sm={6} className="mb-3">
                      <CustomInput
                        name="card_number"
                        label="Card Number"
                        placeholder="____ ____ ____ ____"
                        required
                        value={getCardNumberDisplay(values.card_number)}
                        onChange={handleCardNumberChange}
                        onBlur={handleBlur}
                        error={touched.card_number && errors.card_number}
                        maxLength={19} // 16 digits + 3 spaces
                      />
                    </Col>
                    <Col xs={12} sm={6} className="mb-3">
                      <CustomInput
                        name="cvv_number"
                        label="CVV Number"
                        placeholder="Enter CVV"
                        required
                        value={values.cvv_number}
                        onChange={(e) => handleNumericOnly(e, 'cvv_number')}
                        onBlur={handleBlur}
                        error={touched.cvv_number && errors.cvv_number}
                        maxLength={4}
                      />
                    </Col>
                    <Col xs={12} sm={6} className="mb-3">
                      <CustomInput
                        name="exp_month"
                        label="Validaty"
                        placeholder="MM/YYYY"
                        required
                        type="month"
                        min="1"
                        max="12"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.exp_month && errors.exp_month}
                      />
                    </Col>
                  </Row>
                  <Row>
                    <h4 className="screen-title-body">Receiver's Detail</h4>
                    <Col xs={12} sm={6} className="mb-3">
                      <CustomInput
                        name={!values.bank_account_number && values.corresponding_bank ? 'corresponding_bank' : 'bank_account_number'}
                        type={'text'}
                        label={!values.bank_account_number && values.corresponding_bank ? 'Corresponding Bank' : 'Bank Account Number'}
                        placeholder={!values.bank_account_number && values.corresponding_bank ? 'Enter Corresponding Bank' : 'Enter Bank Account Number'}
                        value={!values.bank_account_number && values.corresponding_bank ? values.corresponding_bank : values.bank_account_number}
                        onChange={(e) =>
                          !values.bank_account_number && values.corresponding_bank
                            ? handleAlphabetsOnly(e, 'corresponding_bank')
                            : handleNumericOnly(e, 'bank_account_number')
                        }
                        onBlur={handleBlur}
                        error={
                          !values.bank_account_number && values.corresponding_bank
                            ? touched.corresponding_bank && errors.corresponding_bank
                            : touched.bank_account_number && errors.bank_account_number
                        }
                      />
                    </Col>
                    <Col xs={12} sm={6} className="mb-3">
                      <CustomInput
                        name={!values.bank_account_number && values.corresponding_bank ? 'corresponding_bank_account_number' : 'swift_bic_code'}
                        type={'text'}
                        label={!values.bank_account_number && values.corresponding_bank ? 'Corresponding Bank Account Number' : 'SWIFT/BIC Code'}
                        placeholder={!values.bank_account_number && values.corresponding_bank ? 'Enter Corresponding Bank Account Number' : 'Enter SWIFT Code'}
                        value={!values.bank_account_number && values.corresponding_bank ? values.corresponding_bank_account_number : values.swift_bic_code}
                        onChange={(e) =>
                          !values.bank_account_number && values.corresponding_bank
                            ? handleNumericOnly(e, 'corresponding_bank_account_number')
                            : handleAlphanumericOnly(e, 'swift_bic_code')
                        }
                        onBlur={handleBlur}
                        error={
                          !values.bank_account_number && values.corresponding_bank
                            ? touched.corresponding_bank_account_number && errors.corresponding_bank_account_number
                            : touched.swift_bic_code && errors.swift_bic_code
                        }
                      />
                    </Col>
                    <Col xs={12} sm={6} className="mb-3">
                      <CustomInput
                        name={!values.bank_account_number && values.corresponding_bank ? 'corresponding_swift_bic_code' : 'routing_number'}
                        type={'text'}
                        label={!values.bank_account_number && values.corresponding_bank ? 'Corresponding SWIFT/BIC Code' : 'Routing Number'}
                        placeholder={!values.bank_account_number && values.corresponding_bank ? 'Enter Corresponding SWIFT Code' : 'Enter Routing Number'}
                        value={!values.bank_account_number && values.corresponding_bank ? values.corresponding_swift_bic_code : values.routing_number}
                        onChange={(e) =>
                          !values.bank_account_number && values.corresponding_bank
                            ? handleAlphanumericOnly(e, 'corresponding_swift_bic_code')
                            : handleAlphanumericOnly(e, 'routing_number')
                        }
                        onBlur={handleBlur}
                        error={
                          !values.bank_account_number && values.corresponding_bank
                            ? touched.corresponding_swift_bic_code && errors.corresponding_swift_bic_code
                            : touched.routing_number && errors.routing_number
                        }
                      />
                    </Col>
                    <Col xs={12} sm={6} className="mb-3">
                      <CustomInput
                        name={'iban'}
                        type={'text'}
                        label={'IBAN'}
                        placeholder={'Enter IBAN'}
                        value={values.iban}
                        onChange={(e) => handleAlphanumericOnly(e, 'iban')}
                        onBlur={handleBlur}
                        error={touched.iban && errors.iban}
                      />
                    </Col>
                    <Col xs={12} sm={6} className="mb-3">
                      <CustomInput
                        name={'account_name'}
                        type={'text'}
                        label={'Account Name'}
                        placeholder={'Enter Account Name'}
                        value={values.account_name}
                        onChange={(e) => handleAlphabetsOnly(e, 'account_name')}
                        onBlur={handleBlur}
                        error={touched.account_name && errors.account_name}
                      />
                    </Col>
                  </Row>
                  <div className="d-flex justify-content-start gap-3 mt-4">
                    <CustomButton
                      variant="primary"
                      type="submit"
                      text="Pay Now"
                    />
                    <CustomButton
                      variant="secondaryButton"
                      type="button"
                      text="Cancel"
                      onClick={() => {
                        setShowPaymentModal(false);
                      }}
                    />
                  </div>
                </Form>
              );
            }}
          </Formik>
        </div>
      </CustomModal>
    </>
  );
};

export default withModal(NewPaymentVoucher);
