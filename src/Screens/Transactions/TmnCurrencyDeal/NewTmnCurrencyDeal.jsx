import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import { useEffect, useRef, useState } from 'react';
import { HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import AccountBalanceCard from '../../../Components/AccountBalanceCard/AccountBalanceCard.jsx';
import AddAllocationDetailsForm from '../../../Components/AddAllocationDetailsForm/AddAllocationDetailsForm.jsx';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CombinedInputs from '../../../Components/CombinedInputs/CombinedInputs.jsx';
import CustomButton from '../../../Components/CustomButton';
import CustomCheckbox from '../../../Components/CustomCheckbox/CustomCheckbox';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable.jsx';
import ExchangeRatesCard from '../../../Components/ExchangeRatesCard/ExchangeRatesCard';
import FileDisplayList from '../../../Components/FileDisplayList/FileDisplayList.jsx';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown.jsx';
import { showToast } from '../../../Components/Toast/Toast.jsx';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import withModal from '../../../HOC/withModal.jsx';
import useCurrencyRate from '../../../Hooks/useCurrencyRate';
import { useVATTypes } from '../../../Hooks/useVATTypes';
import {
  getAccountBalances,
  getBanksTRQ,
  getCities,
  getDocTypes,
  getExchangeRates,
  pairReleased,
} from '../../../Services/General';
import { getCurrencyRatesPair } from '../../../Services/General.js';
import { getBenefeciariesByAccount } from '../../../Services/Transaction/ReceiptVoucher';
import {
  createTMNCurrencyDeal,
  getPurposes,
} from '../../../Services/Transaction/TMNCurrencyDeal.js';
import useFormStore from '../../../Stores/FormStore';
import useSettingsStore from '../../../Stores/SettingsStore';
import useUserStore from '../../../Stores/UserStore';
import { ledgerOptions } from '../../../Utils/Constants/SelectOptions.js';
import {
  formatNumberWithCommas,
  formatRateValue,
} from '../../../Utils/Helpers';
import {
  formatNumberForDisplay,
  isNullOrEmpty,
  showErrorToast,
} from '../../../Utils/Utils.jsx';
import SpecialCommission from '../SpecialCommission/SpecialCommission';

const NewTmnCurrencyDeal = ({
  showModal,
  state,
  date,
  setDate,
  isDisabled = false,
  setIsDisabled,
  setPageState,
  setSearchTerm,
  setWriteTerm,
  getAccountsByTypeOptions,
  newlyCreatedAccount,
  newlyCreatedBeneficiary,
  setShowAddLedgerModal,
  currencyOptions,
  lastVoucherNumbers,
  restoreValuesFromStore,
  searchType,
  permissions,
  closeModal,
  hasPrintPermission,
}) => {
  const navigate = useNavigate();
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
  const formId = 'new_tmn_currency_deal'; // Unique identifier for this form

  // For getting print and account balance checkbox state from BE
  const {
    getPrintSettings,
    updatePrintSetting,
    getAccountBalanceSettings,
    updateAccountBalanceSetting,
  } = useSettingsStore();
  const { user: { base_currency } = {} } = useUserStore();

  // State variables
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState(null);
  const [showAddAllocationModal, setShowAddAllocationModal] = useState(false);
  const [uploadAttachmentsModal, setUploadAttachmentsModal] = useState(false);
  const [addedAttachments, setAddedAttachments] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [editAllocationRow, setEditAllocationRow] = useState(null);
  const [shouldShowAllocationTable, setShouldShowAllocationTable] =
    useState(false);
  const [showVatOutOfScopeModal, setShowVatOutOfScopeModal] = useState(false);
  const [outOfScope, setOutOfScope] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [hasShownMissingRateModal, setHasShownMissingRateModal] =
    useState(false);
  const [tMNCurrencyObj, setTMNCurrencyObj] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Special Commission state
  const [addedSpecialCommissionValues, setAddedSpecialCommissionValues] =
    useState(null);
  const [showSCModal, setShowSCModal] = useState(false);
  const [allocationsError, setAllocationsError] = useState(false);
  const [showMissingCurrencyRateModal, setShowMissingCurrencyRateModal] =
    useState(false);
  const [missingRateContext, setMissingRateContext] = useState('pair');
  const [currencyToSelect, setCurrencyToSelect] = useState('');
  const [exchangeRatesInverse, setExchangeRatesInverse] = useState(false);
  const [showRateError, setShowRateError] = useState(false);
  const [showBaseRateError, setShowBaseRateError] = useState(false);

  const [baseRateCurrency, setBaseRateCurrency] = useState('');
  const [previousRateType, setPreviousRateType] = useState('X'); // Initialize with default rate type

  const isRestoringRef = useRef(false);
  const [isRestoringFromStore, setIsRestoringFromStore] = useState(false);

  // Get VAT Type and terms options using custom hook
  const { vatType, vatTermsOptions } = useVATTypes();

  // Banks
  // const { bankOptions } = useBanks();

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
      setSelectedLedgerAccount(savedValues?.account_id);
      setAllocations(savedValues?.allocations || []);
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

  // Handle Special Commission data when returning from SC page - NO LONGER NEEDED
  // useEffect(() => {
  //   if (state?.specialCommissionData) {
  //     setAddedSpecialCommissionValues(state.specialCommissionData);
  //   }

  //   if (state?.specialCommissionDeleted) {
  //     setAddedSpecialCommissionValues(null);
  //   }
  // }, [state]);

  // Handle returning from Rate of Exchange page
  useEffect(() => {
    const lastPage = getLastVisitedPage(formId);
    if (
      lastPage === 'rate-of-exchange' &&
      hasFormValues(formId)
    ) {
      // Set restoration flag before component renders
      setIsRestoringFromStore(true);

      // Clear the calling page data
      clearLastVisitedPage(formId);
    }
  }, []);

  // Handle returning from Rate of Exchange page - actual restoration
  useEffect(() => {
    if (isRestoringFromStore && hasFormValues(formId) && formikRef.current) {
      const savedValues = getFormValues(formId);

      // Set ref immediately to prevent calculations during restoration
      isRestoringRef.current = true;

      // Restore form values and allocations
      formikRef.current.setValues(savedValues);
      setSelectedLedgerAccount(savedValues?.account_id);
      setAllocations(savedValues?.allocations || []);
      setAddedAttachments(savedValues?.addedAttachments || null);
      setAddedSpecialCommissionValues(savedValues?.addedSpecialCommissionValues || null);
      if (savedValues.date) {
        setDate(savedValues.date);
      }
      setIsDisabled(false);

      // Reset the flags after a short delay to allow form to settle
      setTimeout(() => {
        isRestoringRef.current = false;
        setIsRestoringFromStore(false);
      }, 200);

      // Clear the form values after restoration
      clearFormValues(formId);
    }
  }, [isRestoringFromStore, formikRef.current]);

  // Restore form data from store for Rate of Exchange flow
  useEffect(() => {
    if (restoreValuesFromStore) {
      const savedFormData = getFormValues(formId);
      if (savedFormData && formikRef.current) {
        formikRef.current.setValues(savedFormData || {});
        setSelectedLedgerAccount(savedFormData.selectedLedgerAccount);
        setAllocations(savedFormData.allocations || []);
        setAddedAttachments(savedFormData.addedAttachments || null);
        setAddedSpecialCommissionValues(
          savedFormData?.addedSpecialCommissionValues || null
        );
        if (savedFormData.date) {
          setDate(savedFormData.date);
        }
        setIsDisabled(false);
        clearFormValues(formId);
        clearLastVisitedPage(formId);
      }
    }
  }, [restoreValuesFromStore]);

  // Initialize previousRateType when form is ready
  useEffect(() => {
    if (formikRef.current && formikRef.current.values?.rate_type && previousRateType === 'X') {
      // Set the initial rate type from the form
      setPreviousRateType(formikRef.current.values.rate_type);
    }
  }, [formikRef.current?.values?.rate_type, previousRateType]);

  // Clear allocations when rate type changes (but not during initial restoration)
  useEffect(() => {
    if (formikRef.current && !isRestoringRef.current) {
      const currentRateType = formikRef.current.values.rate_type;
      
      // Clear allocations if rate type has changed between X and / and allocations exist
      if (previousRateType !== currentRateType && allocations.length > 0) {
        setAllocations([]);
        setEditAllocationRow(null);
        setAllocationsError(false);
        setShouldShowAllocationTable(false);
        // Reset allocation-related form fields
        formikRef.current.setFieldValue('allocated', 0);
        formikRef.current.setFieldValue('balance_amount', formikRef.current.values.telex_transfer_amount || 0);
      }
      
      setPreviousRateType(currentRateType);
    }
  }, [formikRef.current?.values?.rate_type, previousRateType]);

  // Calculate allocated amount from allocations
  useEffect(() => {
    if (allocations.length) {
      setAllocationsError(false);
    }
    if (formikRef.current) {
      const totalAllocated = allocations.reduce((sum, allocation) => {
        return sum + (parseFloat(allocation.amount) || 0);
      }, 0);
      // Also update balance amount (telex_transfer_amount - allocated)
      const telexTransferAmount =
        parseFloat(formikRef.current.values.telex_transfer_amount) || 0;
      const balanceAmount = telexTransferAmount - totalAllocated;

      if (formikRef.current?.values?.mode === 'regular') {
        formikRef.current.setFieldValue('allocated', totalAllocated);
        formikRef.current.setFieldValue('balance_amount', balanceAmount);
      } else {
        formikRef.current.setFieldValue('allocated', 0);
        formikRef.current.setFieldValue('balance_amount', telexTransferAmount);
      }
    }
  }, [allocations, formikRef.current?.values?.mode]);

  const createTMNCurrencyDealMutation = useMutation({
    mutationFn: createTMNCurrencyDeal,
    onSuccess: (data) => {
      setIsSubmitting(false);
      showToast('TMN Currency Deal Created!', 'success');
      if (hasPrintPermission && getPrintSettings('tmn_currency_deal')) {
        window.open(data.detail?.pdf_url, '_blank');
      }
      queryClient.invalidateQueries(['tmnCurrencyDealListing']);
      handleResetRows();
    },
    onError: (error) => {
      setIsSubmitting(false);
      if (
        error.message == 'Touman Buying Note limit reached for this branch.'
      ) {
        showModal(
          'Cannot Create',
          'You have reached the maximum number of TBN. To create new transactions you need to increase the transaction count form the Transaction Number Register.',
          null,
          'error'
        );
      } else if (
        error.message == 'Touman Selling Note limit reached for this branch.'
      ) {
        showModal(
          'Cannot Create',
          'You have reached the maximum number of TSN. To create new transactions you need to increase the transaction count form the Transaction Number Register.',
          null,
          'error'
        );
      } else {
        showErrorToast(error);
      }
    },
  });

  // Fetch account balances
  const {
    data: selectedLedgerAccountBalance,
    isLoading: isLoadingSelectedLedgerAccountBalance,
    isError: isErrorSelectedLedgerAccountBalance,
    error: errorSelectedLedgerAccountBalance,
  } = useQuery({
    queryKey: ['tmn-account-balance', selectedLedgerAccount?.value],
    queryFn: () =>
      getAccountBalances(
        selectedLedgerAccount?.value,
        formikRef?.current.values.account_ledger
      ),
    enabled:
      !!selectedLedgerAccount?.value &&
      !!formikRef?.current?.values?.account_ledger &&
      getAccountBalanceSettings('tmn_currency_deal'),
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

  // Get Purposes dropdown options
  const {
    data: purposes,
    isLoading: isLoadingPurposes,
    isError: isErrorPurposes,
    error: errorPurposes,
  } = useQuery({
    queryKey: ['tmn-currency-deal-purposes'],
    queryFn: getPurposes,
    refetchOnWindowFocus: false,
  });

  const getPurposeOptions = () => {
    if (isLoadingPurposes) {
      return [{ label: 'Loading...', value: null, isDisabled: true }];
    }

    if (isErrorPurposes) {
      showErrorToast(errorPurposes);
      return [{ label: 'Unable to fetch purposes', value: null }];
    }

    return purposes?.map((x) => ({
      value: x?.id,
      label: x?.description,
    }));
  };

  // Get Benefeciaries from selected Ledger+Account
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
    refetchOnWindowFocus: false,
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
      showErrorToast(errorMessage);
      return [{ label: 'Unable to fetch beneficiaries', value: null }];
    }
    let options =
      data?.map((x) => ({
        value: x?.id,
        label: x?.title,
        bank_id: x?.bank_id || x?.bank?.id || '',
        bank_account_number: x?.bank_account_number || '',
        bank_name: x?.bank_name || x?.bank?.name || '',
        city: x?.city || '',
        purpose: x?.purpose?.id || '',
      })) || [];

    options.push({
      label: `Add New Beneficiary`,
      value: null,
    });

    return options;
  };

  // Banks TRQ
  const {
    data: bankOptions,
    isLoading: isLoadingBanks,
    isError: isErrorBanks,
    error: errorBanks,
  } = useQuery({
    queryKey: ['banks', 'classificationMasterListing'],
    queryFn: getBanksTRQ,
    refetchOnWindowFocus: true,
  });

  const getBankOptions = () => {
    if (isLoadingBanks)
      return [
        {
          label: 'Loading...',
          value: '',
        },
      ];

    if (isErrorBanks) {
      console.error('Unable to fetch Banks', errorBanks);
      return [{ label: 'Unable to fetch Banks', value: null }];
    }

    return (
      bankOptions?.map((item) => ({
        id: item.id,
        label: item.description,
        value: item.id,
      })) || []
    );
  };

  // Document Types
  const {
    data: docTypes,
    isLoading: isLoadingDocTypes,
    isError: isErrorDocTypes,
    error: errorDocTypes,
  } = useQuery({
    queryKey: ['doc-types', 'classificationMasterListing'],
    queryFn: getDocTypes,
    refetchOnWindowFocus: true,
  });

  const getDocTypeOptions = () => {
    if (isLoadingDocTypes) {
      return [{ label: 'Loading...', value: null, isDisabled: true }];
    }
    if (isErrorDocTypes) {
      return [{ label: 'Unable to fetch document types', value: null }];
    }
    return docTypes?.map((x) => ({
      value: x?.id,
      label: x?.description,
    }));
  };

  // Cities
  const {
    data: cities,
    isLoading: isLoadingCities,
    isError: isErrorCities,
    error: errorCities,
  } = useQuery({
    queryKey: ['cities', 'classificationMasterListing'],
    queryFn: getCities,
    refetchOnWindowFocus: true,
  });
  const getCityOptions = () => {
    if (isLoadingCities) {
      return [{ label: 'Loading...', value: null, isDisabled: true }];
    }
    if (isErrorCities) {
      return [{ label: 'Unable to fetch cities', value: null }];
    }
    return cities?.map((x) => ({
      value: x?.id,
      label: x?.description,
    }));
  };

  // Fetch dual currency rate for the selected Currency
  const { data: currencyRatesPair, isLoading: isLoadingCurrencyRatesPair } =
    useQuery({
      queryKey: [
        'dual-currency-rate',
        selectedCurrency, // Currency 1
        tMNCurrencyObj.value, // Currency 2
        date,
        formikRef.current?.values?.type, // Deal type (buy/sell)
      ],
      queryFn: () =>
        getCurrencyRatesPair(
          selectedCurrency,
          tMNCurrencyObj.value,
          date,
          formikRef.current?.values?.type
        ),
      refetchOnWindowFocus: false,
      staleTime: 1000 * 5,
      gcTime: 1000 * 5,
      enabled: !!selectedCurrency && !!tMNCurrencyObj?.value && !isSubmitting,
    });

  // Fetch base rate currency rate
  const {
    data: baseRateCurrencyRate,
    isLoading: isLoadingBaseRateCurrencyRate,
  } = useCurrencyRate(baseRateCurrency, date, {
    enabled: !!baseRateCurrency && !isSubmitting,
  });

  // To update Rate field and show missing rate modal if rate not present
  useEffect(() => {
    if (
      selectedCurrency &&
      !isNullOrEmpty(currencyRatesPair) &&
      !currencyRatesPair?.direct_rate &&
      !hasShownMissingRateModal
    ) {
      formikRef.current.setFieldValue('fc_currency_id', '');
      formikRef.current.setFieldValue('total_currency_id', '');
      formikRef.current.setFieldValue('vat_currency_id', '');
      formikRef.current.setFieldValue('commission_currency_id', '');
      formikRef.current.setFieldValue('rate', '');
      setShowMissingCurrencyRateModal(true);
      setHasShownMissingRateModal(true);
      setMissingRateContext('pair');
    } else if (currencyRatesPair?.direct_rate) {
      formikRef.current.setFieldValue('rate', currencyRatesPair?.direct_rate);
    }
  }, [
    selectedCurrency,
    currencyRatesPair?.direct_rate,
    hasShownMissingRateModal,
  ]);

  useEffect(() => {
    if (currencyOptions.length === 1 && !currencyOptions[0].value) {
    } else {
      // If TMN not present then aler user to add currency first
      if (!currencyOptions.find((x) => x.label === 'TMN')) {
        // alert('Please add TMN currency first');
        // navigate('/master/currency-register');
      } else {
        setTMNCurrencyObj(currencyOptions.find((x) => x.label === 'TMN') || {});
      }
    }
  }, [currencyOptions]);

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
      console.log('Pair Released Successfully');
    },
    onError: (error) => {
      console.log(error);
    },
  });

  //pair id release
  const handlePairReleased = async () => {
    if (baseRateCurrency) {
      pairReleasedMutation.mutate(baseRateCurrency);
    }
    if (currencyRatesPair?.direct_pair_id) {
      pairReleasedMutation.mutate(currencyRatesPair?.direct_pair_id);
    }
    if (currencyRatesPair?.reverse_pair_id) {
      pairReleasedMutation.mutate(currencyRatesPair?.reverse_pair_id);
    }
  };

  // Handle form reset
  const handleResetRows = () => {
    console.log('handlePairReleased2');
    handlePairReleased();
    setIsDisabled(true);
    setAllocations([]);
    setAddedAttachments([]);
    setOutOfScope('');
    setSelectedCurrency(null);
    setAddedSpecialCommissionValues(null);
    setCurrencyToSelect('');
    if (formikRef.current) {
      formikRef.current.resetForm();
    }
    clearFormValues(formId);
    clearFormValues('special-commission');
    setDate(new Date().toLocaleDateString('en-CA'));
  };

  // Handle file removal
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

  // Handle Allocation Submit
  const handleAddAllocation = (allocationValues) => {
    setShowAddAllocationModal(false);
    if (editAllocationRow) {
      setAllocations(
        allocations.map((x) =>
          x.id === editAllocationRow.id ? allocationValues : x
        )
      );
    } else {
      setAllocations([...allocations, allocationValues]);
    }
    setEditAllocationRow(null);
  };

  const handleNavigateToSpecialCommissionPage = () => {
    // Check if required fields are filled
    const requiredFields = [
      'account_ledger',
      'account_id',
      'ag_amount',
      'fc_currency_id',
      'fc_amount',
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

    // Open the modal instead of navigating
    setShowSCModal(true);
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);

    if (!formikRef.current) {
      setIsSubmitting(false);
      return;
    }

    if (formikRef.current?.values?.mode === 'regular' && !allocations.length) {
      setAllocationsError(true);
      setIsSubmitting(false);
      return;
    }
    setAllocationsError(false);

    // Validate the form
    const errors = await formikRef.current.validateForm();

    // Check for rate errors before blocking submission
    const rateValue = parseFloat(formikRef.current.values.rate);
    const officialRate = parseFloat(
      formikRef.current.values.rate_type === '/'
        ? currencyRatesPair?.reverse_rate
        : currencyRatesPair?.direct_rate
    );

    let hasRateError = false;
    if (rateValue && officialRate && currencyRatesPair) {
      let minRange, maxRange;

      if (formikRef.current.values.rate_type === '/') {
        // Use reverse rate ranges for divide
        minRange = parseFloat(currencyRatesPair?.reverse_from);
        maxRange = parseFloat(currencyRatesPair?.reverse_upto);
      } else {
        // Use direct rate ranges for multiply
        minRange = parseFloat(currencyRatesPair?.direct_from);
        maxRange = parseFloat(currencyRatesPair?.direct_upto);
      }

      hasRateError =
        !isNaN(minRange) &&
        !isNaN(maxRange) &&
        (rateValue < minRange || rateValue > maxRange);
    }

    // Check for base rate errors
    const baseRateValue = parseFloat(formikRef.current.values.base_rates);
    const officialBaseRate = parseFloat(baseRateCurrencyRate?.rate);
    let hasBaseRateError = false;
    if (baseRateValue && officialBaseRate) {
      const minBaseRange = parseFloat(baseRateCurrencyRate?.min_range);
      const maxBaseRange = parseFloat(baseRateCurrencyRate?.max_range);
      hasBaseRateError =
        !isNaN(minBaseRange) &&
        !isNaN(maxBaseRange) &&
        (baseRateValue < minBaseRange || baseRateValue > maxBaseRange);
    }

    // Show error modals if needed
    if (hasRateError || hasBaseRateError) {
      setIsSubmitting(false);

      if (hasRateError) {
        let minRange, maxRange;
        if (formikRef.current.values.rate_type === '/') {
          // Use reverse rate ranges for divide
          minRange = parseFloat(currencyRatesPair?.reverse_from);
          maxRange = parseFloat(currencyRatesPair?.reverse_upto);
        } else {
          // Use direct rate ranges for multiply
          minRange = parseFloat(currencyRatesPair?.direct_from);
          maxRange = parseFloat(currencyRatesPair?.direct_upto);
        }

        showModal(
          'Exchange Rate Control',
          <>
            Exchange Rate for{' '}
            {
              currencyOptions.find(
                (x) => x.value === formikRef.current.values.fc_currency_id
              )?.label
            }
            /{tMNCurrencyObj?.label} is {formatRateValue(officialRate)}
            <br />
            Acceptable range is from {formatRateValue(minRange)} to{' '}
            {formatRateValue(maxRange)}
            <br />
            Your selected rate is outside this range
          </>,
          () => closeModal(),
          'error'
        );
      }

      if (hasBaseRateError) {
        const minRange = parseFloat(baseRateCurrencyRate?.min_range);
        const maxRange = parseFloat(baseRateCurrencyRate?.max_range);

        showModal(
          'Exchange Rate Control',
          <>
            Exchange Rate for Base Rate is {formatRateValue(baseRateCurrencyRate?.rate)}
            <br />
            Acceptable range is from {formatRateValue(minRange)} to {formatRateValue(maxRange)}
            <br />
            your selected base rate is outside this range
          </>,
          () => closeModal(),
          'error'
        );
      }
      return;
    }

    if (Object.keys(errors).length > 0) {
      // Mark all fields as touched to show errors
      formikRef.current.setTouched(
        Object.keys(errors).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {})
      );
      setIsSubmitting(false);
      return; // Do not submit if there are errors
    }

    const formValues = formikRef.current.values;
    let payload = {
      date: formValues.date || null,
      ...formValues,
      ...addedAttachments,
      ...(outOfScope && {
        out_of_scope_reason: outOfScope,
      }),
    };

    // Remove commission currency and VAT amount if not applicable
    if (!payload.commission_amount && !addedSpecialCommissionValues) {
      delete payload.commission_currency_id;
    }
    // Only remove VAT amount if no VAT term is selected
    if (!payload.vat_terms_id) {
      delete payload.vat_amount;
    }

    // If allocations are present and mode is regular, then transform allocations and add to payload
    if (
      allocations.length > 0 &&
      formikRef.current?.values?.mode === 'regular'
    ) {
      const transformAllocations = (values, index = 0) => {
        return Object.entries(values).reduce((acc, [key, value]) => {
          if (key === 'id') return acc;
          // Rename 'bank' to 'bank_id' for backend compatibility
          const fieldName = key === 'bank' ? 'bank_id' : key;
          acc[`allocations[${index}][${fieldName}]`] = value;
          return acc;
        }, {});
      };

      payload = {
        ...payload,
        // iterate over allocations and call transformAllocations for each allocation
        allocations: allocations.map((allocation, index) =>
          transformAllocations(allocation, index)
        ),
      };
    }

    if (addedSpecialCommissionValues) {
      // Flatten the SC object
      const converted = {};
      const sc = {
        transaction_no: lastVoucherNumbers?.current,
        date,
        commission_type:
          addedSpecialCommissionValues?.commission_type ||
          (formValues.type == 'buy' ? 'Income' : 'Expense'),
        ledger: formValues.account_ledger,
        account_id: formValues.account_id,
        currency_id: addedSpecialCommissionValues?.currency_id || formValues.fc_currency_id,
        amount: formValues.fc_amount,
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
        commission_amount: addedSpecialCommissionValues?.total_commission,
      };
    }
    setDate(new Date().toLocaleDateString('en-CA'));
    handlePairReleased();
    createTMNCurrencyDealMutation.mutate(payload);
  };

  useEffect(() => {
    if (formikRef.current) {
      const tmnCurrencyId = currencyOptions.find((x) => x.label === 'TMN')?.value || '';
      formikRef.current.setFieldValue('ag_currency_id', tmnCurrencyId);
    }
  }, [currencyOptions, formikRef.current]);

  const getBaseCurrencyOptions = () => {
    const fcCurrency = formikRef.current?.values?.fc_currency_id;
    const agCurrency = formikRef.current?.values?.ag_currency_id;

    if (!fcCurrency && !agCurrency) {
      return [{ label: 'Select FC/AG Currency', value: '' }];
    }

    const options = [];

    if (fcCurrency) {
      const fcCurrencyLabel = currencyOptions.find(
        (x) => x.value === fcCurrency
      )?.label;
      if (fcCurrencyLabel) {
        options.push({ label: fcCurrencyLabel, value: fcCurrency });
      }
    }

    if (agCurrency && agCurrency !== fcCurrency) {
      const agCurrencyLabel = currencyOptions.find(
        (x) => x.value === agCurrency
      )?.label;
      if (agCurrencyLabel) {
        options.push({ label: agCurrencyLabel, value: agCurrency });
      }
    }

    return options.length > 0
      ? options
      : [{ label: 'No Currency Available', value: '' }];
  };

  // Helper function to check if VAT amount should be zero
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

  // Get initial values, checking if we're restoring from store
  const getInitialValues = () => {
    // Check if we have saved form values from Rate of Exchange navigation
    const savedFormData = getFormValues(formId);

    if (isRestoringFromStore && savedFormData && hasFormValues(formId)) {
      // Return saved values to preserve form state
      return savedFormData;
    }

    // Default initial values
    return {
      date: date || '',
      type: searchType,
      mode: '',
      account_ledger: '',
      account_id: '',
      beneficiary_id: '',
      bank_id: '',
      bank_name: '',
      bank_account_no: '',
      city: '',
      purpose_id: '',
      fc_currency_id: '',
      fc_amount: '',
      rate_type: 'X',
      rate: '',
      ag_currency_id: '',
      ag_amount: '',
      allocated: '',
      balance_amount: '',
      telex_transfer_amount: '',
      base_rate_currency_id: '',
      base_rate: '',
      total_currency_id: '',
      total_amount: '',
      vat_type_id: '',
      vat_percentage: '',
      vat_amount: '',
      vat_terms_id: '',
      out_of_scope: '',
      narration: '',
    };
  };

  return (
    <>
      <div className="d-card">
        <Formik
          innerRef={formikRef}
          initialValues={getInitialValues()}
          validate={(values) => {
            const errors = {};

            // Required fields validation
            // if (!values.date) errors.date = 'Value Date is required';
            if (!values.account_ledger)
              errors.account_ledger = 'Ledger is required';
            if (!values.account_id) errors.account_id = 'Account is required';
            if (!values.type) errors.type = 'Deal Type is required';
            if (!values.mode) errors.mode = 'Mode is required';
            if (!values.fc_currency_id)
              errors.fc_currency_id = 'FC Currency is required';
            if (!values.fc_amount) errors.fc_amount = 'FC Amount is required';
            if (!values.rate) errors.rate = 'Rate is required';
            if (!values.ag_currency_id)
              errors.ag_currency_id = 'AG Currency is required';
            if (!values.ag_amount) errors.ag_amount = 'AG Amount is required';

            // Base Rate validation - conditional
            if (!values.base_rate_currency_id) {
              errors.base_rate_currency_id = 'Base Rate Currency is required';
            } else if (!values.base_rates) {
              errors.base_rates = 'Base Rate is required';
            }


            // Rate validation - check if rate is within min/max range
            if (values.rate) {
              /* Rate range validation handled via Modal in handleSubmit */
            }

            // VAT Validation
            const commissionAmount = parseFloat(values.commission_amount) || 0;
            const hasSpecialCommission = !!addedSpecialCommissionValues;
            // Check if VAT is required (Present commission) and missing
            // We ignore if terms are "Out of Scope" or similar which sets amount to 0 but has a term/id
            // Ideally we check if vat_percentage or vat_amount is set, or if vat_terms_id is selected.
            // If vat_type is 'variable' we need vat_terms_id. If 'fixed', we assume it's prefilled.

            if ((commissionAmount > 0 || hasSpecialCommission) && values.type === 'buy') {
              // If we have commission, we MUST have VAT info.
              // Assuming vat_terms_id is the dropdown value.
              if (vatType?.vat_type === 'variable' && !values.vat_terms_id && !values.vat_terms) {
                errors.vat_terms_id = 'VAT is required';
              }
            }

            return errors;
          }}
        >
          {({ values, handleChange, handleBlur, setFieldValue, touched, errors }) => {

            // Check Rate Range
            useEffect(() => {
              if (values.rate && currencyRatesPair) {
                const rateValue = parseFloat(values.rate);
                const officialRate = parseFloat(
                  values.rate_type === '/'
                    ? currencyRatesPair?.reverse_rate
                    : currencyRatesPair?.direct_rate
                );

                // Use API ranges based on rate type
                let minRange, maxRange;
                if (values.rate_type === '/') {
                  // Use reverse rate ranges for divide
                  minRange = parseFloat(currencyRatesPair?.reverse_from);
                  maxRange = parseFloat(currencyRatesPair?.reverse_upto);
                } else {
                  // Use direct rate ranges for multiply
                  minRange = parseFloat(currencyRatesPair?.direct_from);
                  maxRange = parseFloat(currencyRatesPair?.direct_upto);
                }

                if (officialRate && (rateValue < minRange || rateValue > maxRange)) {
                  setShowRateError(true);
                } else {
                  setShowRateError(false);
                }
              } else {
                setShowRateError(false);
              }
            }, [values.rate, currencyRatesPair, values.rate_type]);




            // Auto-set fixed VAT percentage when VAT type is fixed
            useEffect(() => {
              if (vatType?.vat_type === 'fixed' && vatType?.vat_percentage) {
                const fixedVatPercentage = parseFloat(vatType.vat_percentage);
                setFieldValue('vat_type', 'fixed');
                setFieldValue('vat_percentage', fixedVatPercentage);
                setFieldValue('vat_terms_id', null); // Clear variable term
                setFieldValue('vat_terms', 'Fixed'); // Set "Fixed" as the label for fixed VAT type
              }
            }, [vatType?.vat_type, vatType?.vat_percentage, setFieldValue]);

            // Initialize total_currency_id when fc_currency_id is set
            useEffect(() => {
              if (values.fc_currency_id && !values.total_currency_id) {
                setFieldValue('total_currency_id', values.fc_currency_id);
              }
            }, [values.fc_currency_id, values.total_currency_id, setFieldValue]);

            // Sync baseRateCurrency state for hook
            useEffect(() => {
              if (values.base_rate_currency_id !== baseRateCurrency) {
                setBaseRateCurrency(values.base_rate_currency_id);
              }
            }, [values.base_rate_currency_id]);



            // Check Base Rate Range
            useEffect(() => {
              const entered = parseFloat(values.base_rates);
              const min = parseFloat(baseRateCurrencyRate?.min_range);
              const max = parseFloat(baseRateCurrencyRate?.max_range);

              if (
                values.base_rates &&
                baseRateCurrencyRate &&
                !isNaN(entered) &&
                !isNaN(min) &&
                !isNaN(max)
              ) {
                setShowBaseRateError(entered < min || entered > max);
              } else {
                setShowBaseRateError(false);
              }
            }, [values.base_rates, baseRateCurrencyRate, values.base_rate_currency_id, values.fc_currency_id]);

            useEffect(() => {
              if (!values.base_rate_currency_id) {
                setFieldValue('base_rates', '');
                return;
              }

              if (isLoadingBaseRateCurrencyRate) {
                setFieldValue('base_rates', '');
                return;
              }

              if (baseRateCurrencyRate?.rate) {
                setFieldValue('base_rates', baseRateCurrencyRate.rate);
                return;
              }

              if (baseRateCurrencyRate && !isLoadingBaseRateCurrencyRate) {
                setFieldValue('base_rates', '');
                setMissingRateContext('base');
                setCurrencyToSelect(values.base_rate_currency_id);
                setShowMissingCurrencyRateModal(true);
                setFieldValue('base_rate_currency_id', '');
              }
            }, [
              baseRateCurrencyRate,
              isLoadingBaseRateCurrencyRate,
              values.base_rate_currency_id,
              values.fc_currency_id,
            ]);

            // Calculate LCy amount from ag_amount and base_rates
            useEffect(() => {
              const totalAmount = parseFloat(values.total_amount || 0);
              const baseRate = parseFloat(values.base_rates || 0);

              if (
                !isNaN(totalAmount) &&
                !isNaN(baseRate) &&
                totalAmount &&
                baseRate
              ) {
                const result = totalAmount * baseRate;
                setFieldValue('lcy_amount', result);
              } else {
                setFieldValue('lcy_amount', '');
              }
            }, [values.base_rates, values.total_amount]);

            // Calculates VAT and Net Total correctly
            useEffect(() => {
              const fcAmount = parseFloat(values.fc_amount) || 0;
              const agAmount = parseFloat(values.ag_amount) || 0;
              const commission = addedSpecialCommissionValues
                ? parseFloat(addedSpecialCommissionValues.total_commission)
                : parseFloat(values.commission_amount) || 0;
              const vatPercentage = parseFloat(values.vat_percentage) || 0;

              // Determine the base amount for total calculation based on special commission currency
              let baseAmountForTotal = fcAmount; // Default to fc_amount

              if (addedSpecialCommissionValues && addedSpecialCommissionValues.currency_id) {
                // If special commission is applied, use the amount in the commission currency
                if (addedSpecialCommissionValues.currency_id === values.fc_currency_id) {
                  baseAmountForTotal = fcAmount;
                } else if (addedSpecialCommissionValues.currency_id === values.ag_currency_id) {
                  baseAmountForTotal = agAmount;
                }
              }

              // Check if VAT amount should be 0 based on VAT terms
              let vatAmount = 0;

              // Only apply VAT if there's commission (normal or special)
              const hasCommission = commission > 0;

              if (shouldVatAmountBeZero(values.vat_terms)) {
                vatAmount = 0;
              } else if (hasCommission && vatPercentage) {
                // Calculate VAT on commission amount when commission is present
                vatAmount = (commission * vatPercentage) / 100;
              } else if (
                baseAmountForTotal &&
                vatPercentage &&
                !addedSpecialCommissionValues &&
                !values.commission_amount
              ) {
                // For Standard Rate without commission, calculate VAT on the base amount
                vatAmount = (baseAmountForTotal * vatPercentage) / 100;
              }

              const totalAmount = baseAmountForTotal + commission + (vatAmount || 0);

              // Update total_currency_id to match special commission currency when applicable
              if (addedSpecialCommissionValues?.currency_id) {
                setFieldValue('total_currency_id', addedSpecialCommissionValues.currency_id);
                setFieldValue('vat_currency_id', addedSpecialCommissionValues.currency_id);
              }

              setFieldValue('vat_amount', vatAmount);
              setFieldValue('total_amount', totalAmount);
            }, [
              values.fc_amount,
              values.ag_amount,
              values.commission_amount,
              values.vat_percentage,
              values.vat_terms,
              values.fc_currency_id,
              values.ag_currency_id,
              addedSpecialCommissionValues?.total_commission,
              addedSpecialCommissionValues?.currency_id,
            ]);

            // Auto-clear VAT when commission is removed
            useEffect(() => {
              const hasCommission = addedSpecialCommissionValues || (values.commission_amount && parseFloat(values.commission_amount) > 0);

              if (!hasCommission) {
                // Clear VAT fields when no commission is present
                setFieldValue('vat_amount', 0);
                setFieldValue('vat_percentage', 0);
                setFieldValue('vat_terms', '');
                setFieldValue('vat_terms_id', '');
              }
            }, [
              values.commission_amount,
              addedSpecialCommissionValues,
              setFieldValue,
            ]);

            useEffect(() => {
              // Don't recalculate if we're restoring from saved values
              if (isRestoringRef.current) return;

              const fcAmount = parseFloat(values.fc_amount) || 0;
              const rate = parseFloat(values.rate) || 0;

              if (rate === 0) return;

              let agAmount;
              if (values.rate_type == '/') {
                agAmount = fcAmount / parseFloat(rate);
              } else {
                agAmount = fcAmount * parseFloat(rate);
              }

              setFieldValue('ag_amount', agAmount);
              setFieldValue('telex_transfer_amount', agAmount);
              setFieldValue('balance_amount', agAmount);
            }, [values.fc_amount, values.rate]);

            useEffect(() => {
              setShouldShowAllocationTable(
                allocations.length > 0 && values?.mode === 'regular'
              );
            }, [allocations, values?.mode]);

            // Recalculate Special Commission when relevant amounts or currencies change
            useEffect(() => {
              if (
                addedSpecialCommissionValues &&
                addedSpecialCommissionValues.commission
              ) {
                const commissionPercentage =
                  parseFloat(addedSpecialCommissionValues.commission) || 0;

                // Determine the base amount based on the commission currency
                let currentBaseAmount = 0;

                if (addedSpecialCommissionValues.currency_id === values.fc_currency_id) {
                  currentBaseAmount = parseFloat(values.fc_amount) || 0;
                } else if (addedSpecialCommissionValues.currency_id === values.ag_currency_id) {
                  currentBaseAmount = parseFloat(values.ag_amount) || 0;
                } else {
                  // Fallback to fc_amount if currency doesn't match
                  currentBaseAmount = parseFloat(values.fc_amount) || 0;
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
                      distributions:
                        updatedDistributions.length > 0
                          ? updatedDistributions
                          : prev.distributions,
                    }));
                  }
                }
              }
            }, [
              values.fc_amount,
              values.ag_amount,
              values.fc_currency_id,
              values.ag_currency_id,
              addedSpecialCommissionValues?.commission,
              addedSpecialCommissionValues?.currency_id,
            ]);

            useEffect(() => {
              setFieldValue('type', searchType);
            }, [searchType]);

            // Sync date prop with Formik values
            useEffect(() => {
              if (date !== values.date) {
                setFieldValue('date', date);
              }
            }, [date]);

            return (
              <Form>
                <div className="row">
                  <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
                    <div className="row">
                      {/* Deal Type */}
                      <div className="col-12 col-sm-6 mb-45">
                        <SearchableSelect
                          name={'type'}
                          label={'Type'}
                          options={[
                            { label: 'Buy', value: 'buy' },
                            { label: 'Sell', value: 'sell' },
                          ]}
                          isDisabled={true}
                          placeholder={'Select Type'}
                          value={values.type}
                          onBlur={handleBlur}
                        />
                        <ErrorMessage
                          name="type"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>

                      {/* Mode */}
                      <div className="col-12 col-sm-6 mb-45">
                        <SearchableSelect
                          name={'mode'}
                          label={'Mode'}
                          options={[
                            { label: 'On A/C', value: 'on A/C' },
                            { label: 'Regular', value: 'regular' },
                          ]}
                          isDisabled={isDisabled}
                          placeholder={'Select Mode'}
                          value={values.mode}
                          onChange={(selected) => {
                            setFieldValue('mode', selected.value);
                          }}
                          onBlur={handleBlur}
                        />
                        <ErrorMessage
                          name="mode"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>

                      {/* Combined Ledger and Account Select */}
                      <div className="col-12 col-sm-6 mb-45">
                        <CombinedInputs
                          label="Ledger"
                          type1="select"
                          type2="select"
                          name1="account_ledger"
                          name2="account_id"
                          value1={values.account_ledger}
                          value2={values.account_id || newlyCreatedAccount?.id}
                          options1={ledgerOptions}
                          options2={getAccountsByTypeOptions(
                            values.account_ledger
                          )}
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
                              setFieldValue('account_ledger', selected.value);
                              // Reset selected account when ledger changes
                              setFieldValue('account_id', '');
                              setSelectedLedgerAccount(null);
                              setFieldValue('beneficiary_id', '');
                              setFieldValue('bank_id', '');
                              setFieldValue('bank_name', '');
                              setFieldValue('bank_account_no', '');
                              setFieldValue('city', '');
                              setFieldValue('purpose_id', '');
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
                            } else if (selected && selected.value) {
                              setFieldValue('account_id', selected.value);
                              setSelectedLedgerAccount({
                                value: selected.value,
                                label: selected.label,
                                accountType: values.account_ledger,
                              });
                              setFieldValue('beneficiary_id', '');
                              setFieldValue('bank_id', '');
                              setFieldValue('bank_name', '');
                              setFieldValue('bank_account_no', '');
                              setFieldValue('city', '');
                              setFieldValue('purpose_id', '');
                              //   setSpecialCommissionValues((prev) => ({
                              //     ...prev,
                              //     account_id: selected,
                              //   })));
                            } else {
                              // Handle deselection
                              setFieldValue('account_id', '');
                              setSelectedLedgerAccount(null);
                              setFieldValue('beneficiary_id', '');
                              setFieldValue('bank_id', '');
                              setFieldValue('bank_name', '');
                              setFieldValue('bank_account_no', '');
                              setFieldValue('city', '');
                              setFieldValue('purpose_id', '');
                            }
                          }}
                        />
                        <ErrorMessage
                          name="account_id"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>
                      <div className="col-12 col-sm-6 mb-45">
                        <SearchableSelect
                          name={'beneficiary_id'}
                          label={'Beneficiary'}
                          options={getBeneficiaryOptions(selectedLedgerAccount)}
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

                              // Try to match bank_id from bankOptions if bank_id is empty but bank_name exists
                              let bankId = selected.bank_id || '';
                              if (!bankId && selected.bank_name) {
                                const matchingBank = bankOptions.find(
                                  (bank) =>
                                    bank.label?.toLowerCase() ===
                                    selected.bank_name?.toLowerCase()
                                );
                                if (matchingBank) {
                                  bankId = matchingBank.value;
                                }
                              }

                              setFieldValue('bank_id', bankId);
                              setFieldValue('bank_name', selected.bank_name);
                              setFieldValue(
                                'bank_account_no',
                                selected.bank_account_number
                              );
                              setFieldValue('city', selected.city);
                              setFieldValue('purpose_id', selected.purpose);
                            }
                          }}
                          onBlur={handleBlur}
                        />
                      </div>
                      {/* Bank Name */}
                      <div className="col-12 col-sm-6 mb-45">
                        <CustomInput
                          name={'bank_name'}
                          label={'Bank Name'}
                          disabled={true}
                          value={values.bank_name}
                        />
                      </div>
                      {/* Bank Account No */}
                      <div className="col-12 col-sm-6 mb-45">
                        <CustomInput
                          name={'bank_account_no'}
                          label={'Bank Account'}
                          disabled={true}
                          value={values.bank_account_no}
                        />
                      </div>
                      {/* City */}
                      <div className="col-12 col-sm-6 mb-45">
                        <CustomInput
                          name={'city'}
                          label={'City'}
                          disabled={true}
                          value={values.city}
                        />
                      </div>

                      {/* Purpose */}
                      <div className="col-12 col-sm-6 mb-45">
                        <SearchableSelect
                          name={'purpose_id'}
                          label={'Purpose'}
                          options={getPurposeOptions()}
                          isDisabled={isDisabled}
                          placeholder={'Select Purpose'}
                          value={values.purpose_id}
                          onChange={(selected) => {
                            setFieldValue('purpose_id', selected.value);
                          }}
                          onBlur={handleBlur}
                        />
                      </div>

                      {/* Combined FC Currency and Amount */}
                      <div className="col-12 col-sm-6 mb-45">
                        <CombinedInputs
                          label={`${values.type == 'buy' ? 'Buy' : 'Sell'} FCy`}
                          type1="select"
                          type2="input"
                          name1="fc_currency_id"
                          name2="fc_amount"
                          value1={values.fc_currency_id}
                          value2={values.fc_amount}
                          options1={currencyOptions}
                          isDisabled={isDisabled}
                          handleBlur={handleBlur}
                          placeholder1="Currency"
                          placeholder2="Amount"
                          inputType2="number"
                          className1="fc-currency"
                          className2="fc-amount"
                          onChange1={(selected) => {
                            setSelectedCurrency(selected.value);
                            setHasShownMissingRateModal(false);
                            setFieldValue('fc_currency_id', selected.value);
                            setFieldValue('total_currency_id', selected.value);
                            setFieldValue('vat_currency_id', selected.value);
                            if (!addedSpecialCommissionValues) {
                              setFieldValue(
                                'commission_currency_id',
                                selected.value
                              );
                            }
                            setFieldValue(
                              'base_rate_currency_id',
                              selected.value
                            );
                          }}
                          onChange2={(e) => {
                            handleChange(e);
                            // Clear allocations when Buy FCy amount changes
                            if (allocations.length > 0) {
                              setAllocations([]);
                              setAllocationsError(false);
                            }
                          }}
                          additionalProps={{
                            isLoadingCurrencyRate: isLoadingCurrencyRatesPair,
                          }}
                        />
                        {!isLoadingCurrencyRatesPair && (
                          <ErrorMessage
                            name="fc_amount"
                            component="div"
                            className="input-error-message text-danger"
                          />
                        )}
                      </div>

                      {/* Combined Rate Type and Rate */}
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
                          isSecondInputDisabled={!values.fc_currency_id}
                          isDisabled={isDisabled}
                          handleBlur={handleBlur}
                          placeholder2="Enter Rate"
                          inputType2="number"
                          className1="rate-type"
                          className2="rate"
                          onChange1={(selected) => {
                            if (
                              selected.value === '/' &&
                              !currencyRatesPair?.reverse_rate
                            ) {
                              setShowMissingCurrencyRateModal(true);
                            } else {
                              const currentRateType = values.rate_type;
                              
                              // Clear allocations immediately if rate type is changing and allocations exist
                              if (currentRateType !== selected.value && allocations.length > 0) {
                                setAllocations([]);
                                setEditAllocationRow(null);
                                setAllocationsError(false);
                                setShouldShowAllocationTable(false);
                                // Reset allocation-related form fields
                                setFieldValue('allocated', 0);
                                setFieldValue('balance_amount', values.telex_transfer_amount || 0);
                              }
                              
                              setFieldValue('rate_type', selected.value);
                              if (selected.value === '/') {
                                setFieldValue(
                                  'rate',
                                  currencyRatesPair?.reverse_rate
                                );
                              } else {
                                setFieldValue(
                                  'rate',
                                  currencyRatesPair?.direct_rate
                                );
                              }
                            }
                          }}
                          onChange2={(e) => {
                            handleChange(e);
                            
                            // Clear allocations when rate value changes and allocations exist
                            if (allocations.length > 0) {
                              setAllocations([]);
                              setEditAllocationRow(null);
                              setAllocationsError(false);
                              setShouldShowAllocationTable(false);
                              // Reset allocation-related form fields
                              setFieldValue('allocated', 0);
                              setFieldValue('balance_amount', values.telex_transfer_amount || 0);
                            }
                          }}
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
                                values.rate_type === '/'
                                  ? currencyRatesPair?.reverse_rate
                                  : currencyRatesPair?.direct_rate
                              );

                              let minRange, maxRange;
                              if (values.rate_type === '/') {
                                // Use reverse rate ranges for divide
                                minRange = parseFloat(currencyRatesPair?.reverse_from);
                                maxRange = parseFloat(currencyRatesPair?.reverse_upto);
                              } else {
                                // Use direct rate ranges for multiply
                                minRange = parseFloat(currencyRatesPair?.direct_from);
                                maxRange = parseFloat(currencyRatesPair?.direct_upto);
                              }

                              return `Range: ${formatRateValue(minRange)} - ${formatRateValue(maxRange)}`;
                            })()}
                          </div>
                        )}
                      </div>

                      {/* Combined AG Currency and Amount */}
                      <div className="col-12 col-sm-6 mb-45">
                        <CombinedInputs
                          label="AG FCy"
                          type1="select"
                          type2="input"
                          name1="ag_currency_id"
                          name2="ag_amount"
                          value1={tMNCurrencyObj?.value}
                          value2={values.ag_amount}
                          isDisabled={true}
                          inputType2="number"
                          min2={0}
                          options1={currencyOptions}
                          placeholder1="Currency"
                          placeholder2="Amount"
                          className1="ag-currency"
                          className2="ag-amount"
                          handleBlur={handleBlur}
                          onChange2={handleChange}
                        />
                        <ErrorMessage
                          name="ag_currency_id"
                          component="div"
                          className="input-error-message text-danger"
                        />
                        <ErrorMessage
                          name="ag_amount"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>

                      {/* Combined Base Rate Currency and Base Rate */}
                      <div className="col-12 col-sm-6 mb-45">
                        <CombinedInputs
                          label="Base Rate"
                          type1="select"
                          type2="input"
                          name1="base_rate_currency_id"
                          name2="base_rates"
                          value1={values.base_rate_currency_id}
                          value2={values.base_rates}
                          options1={getBaseCurrencyOptions()}
                          handleBlur={handleBlur}
                          isDisabled={isDisabled}
                          isfirstInputDisabled={true}
                          // isSecondInputDisabled={true}
                          placeholder1="Currency"
                          placeholder2="Rate"
                          inputType2="number"
                          onChange1={(selected) => {
                            setFieldValue(
                              'base_rate_currency_id',
                              selected.value
                            );
                            // setFieldValue('fc_currency_id', selected.value);
                            setFieldValue('total_currency_id', selected.value);
                            setFieldValue('vat_currency_id', selected.value);
                            if (!addedSpecialCommissionValues) {
                              setFieldValue(
                                'commission_currency_id',
                                selected.value
                              );
                            }
                            setBaseRateCurrency(selected?.value);
                          }}
                          onChange2={handleChange}
                          inputProps2={{
                            inputClass: showBaseRateError ? 'text-danger' : '',
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
                        {showBaseRateError && baseRateCurrencyRate && (
                          <div className="input-error-message text-danger">
                            {(() => {
                              const minRange = parseFloat(baseRateCurrencyRate?.min_range);
                              const maxRange = parseFloat(baseRateCurrencyRate?.max_range);
                              return `Range: ${formatRateValue(minRange)} - ${formatRateValue(maxRange)}`;
                            })()}
                          </div>
                        )}
                      </div>

                      {/* VAT and Commission */}
                      {values.type == 'buy' && (
                        <>
                          {/* Combined Commission Currency and Amount */}
                          <div className="col-12 col-sm-6 mb-45">
                            <CombinedInputs
                              label="Commission"
                              type1="select"
                              type2="input"
                              name1="commission_currency_id"
                              name2="commission_amount"
                              value1={
                                addedSpecialCommissionValues
                                  ? ''
                                  : values.commission_currency_id
                              }
                              value2={
                                addedSpecialCommissionValues
                                  ? ''
                                  : values.commission_amount
                              }
                              options1={currencyOptions}
                              isDisabled={isDisabled}
                              isfirstInputDisabled={true}
                              isSecondInputDisabled={
                                addedSpecialCommissionValues
                              }
                              handleBlur={handleBlur}
                              placeholder1="Currency"
                              placeholder2="Amount"
                              inputType2="number"
                              min2={0}
                              className1="commission-currency"
                              className2="commission-amount"
                              onChange1={(selected) => {
                                setFieldValue(
                                  'commission_currency_id',
                                  selected.value
                                );
                              }}
                              onChange2={(e) => {
                                handleChange(e);
                              }}
                            />
                            <ErrorMessage
                              name="commission_amount"
                              component="div"
                              className="input-error-message text-danger"
                            />
                          </div>

                          {vatType?.vat_type === 'variable' && (
                            <div className="col-12 col-sm-6 mb-45">
                              <SearchableSelect
                                name={'vat_terms_id'}
                                label={'VAT %'}
                                options={vatTermsOptions}
                                isDisabled={
                                  isDisabled ||
                                  (!addedSpecialCommissionValues && !values.commission_amount)
                                }
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
                                      selected?.percentageNumeric ??
                                      selected?.percentage ??
                                      '';
                                    setFieldValue('vat_type', 'variable');
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

                                    const fcAmount =
                                      parseFloat(values.fc_amount) || 0;
                                    const commission =
                                      addedSpecialCommissionValues
                                        ? addedSpecialCommissionValues.total_commission
                                        : parseFloat(
                                          values.commission_amount
                                        ) || 0;

                                    // Check if VAT amount should be 0 based on VAT terms
                                    let vat = 0;
                                    if (shouldVatAmountBeZero(vatTerms)) {
                                      vat = 0;
                                    } else if (
                                      commission &&
                                      !isNaN(vatPercentage)
                                    ) {
                                      vat = (commission * vatPercentage) / 100;
                                    } else if (
                                      fcAmount &&
                                      !isNaN(vatPercentage) &&
                                      !addedSpecialCommissionValues
                                    ) {
                                      vat = (fcAmount * vatPercentage) / 100;
                                    }

                                    setFieldValue('vat_amount', vat); // Set VAT amount
                                    setFieldValue(
                                      'total_amount',
                                      fcAmount + commission + (vat || 0)
                                    );
                                  }
                                }}
                                onBlur={handleBlur}
                              />
                              <ErrorMessage
                                name="vat_terms_id"
                                component="div"
                                className="input-error-message text-danger"
                              />
                            </div>
                          )}
                          {vatType?.vat_type === 'fixed' && (
                            <div className="col-12 col-sm-6 mb-3">
                              <CustomInput
                                name={'vat_percentage'}
                                label={'VAT %'}
                                type={'text'}
                                disabled={
                                  true ||
                                  (!addedSpecialCommissionValues && !values.commission_amount)
                                }
                                placeholder={'Enter VAT Percentage'}
                                value={
                                  values.vat_percentage
                                    ? `Fixed ${values.vat_percentage}%`
                                    : ''
                                }
                                onChange={handleChange}
                                onBlur={handleBlur}
                              />
                            </div>
                          )}
                          {/* Combined VAT Currency and Amount */}
                          <div className="col-12 col-sm-6 mb-45">
                            <CombinedInputs
                              label="VAT Amount"
                              type1="select"
                              type2="input"
                              name1="vat_currency_id"
                              name2="vat_amount"
                              value1={values.vat_currency_id}
                              value2={formatNumberForDisplay(values.vat_amount)}
                              options1={currencyOptions}
                              isDisabled={true}
                              handleBlur={handleBlur}
                              placeholder1="Currency"
                              placeholder2="Amount"
                              inputType2="number"
                              min2={0}
                              className1="vat-currency"
                              className2="vat-amount"
                            />
                          </div>
                        </>
                      )}

                      {/* Combined Total Currency and Amount */}
                      <div className="col-12 col-sm-6 mb-45">
                        <CombinedInputs
                          label="Total"
                          type1="select"
                          type2="input"
                          name1="total_currency_id"
                          name2="total_amount"
                          value1={(() => {
                            // Prioritize special commission currency when it exists
                            // Otherwise use total_currency_id
                            const value = addedSpecialCommissionValues?.currency_id || values.total_currency_id || '';
                            return value;
                          })()}
                          value2={formatNumberForDisplay(values.total_amount)}
                          options1={currencyOptions}
                          isDisabled={true}
                          handleBlur={handleBlur}
                          placeholder1="Currency"
                          placeholder2="Amount"
                          inputType2="number"
                          min2={0}
                          className1="total-currency"
                          className2="total-amount"
                          onChange2={(e) => {
                            handleChange(e);
                          }}
                        />
                      </div>


                    </div>
                  </div>

                  <div className="col-12 col-lg-10 col-xl-9 col-xxl-5">
                    {!isDisabled && (
                      <div className="row">
                        <div className="col-12 col-sm-6 col-xxl-8 offset-xxl-4 mb-3">
                          {/* Exchange Rates Card */}
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
                          {getAccountBalanceSettings('tmn_currency_deal') && (
                            <div>
                              {/* Debit Account Balance */}
                              {selectedLedgerAccount && (
                                <AccountBalanceCard
                                  heading="Account Balance"
                                  accountName={selectedLedgerAccount.label}
                                  balances={
                                    selectedLedgerAccountBalance?.balances ||
                                    selectedLedgerAccountBalance?.detail
                                      ?.balances ||
                                    (Array.isArray(selectedLedgerAccountBalance)
                                      ? selectedLedgerAccountBalance
                                      : [])
                                  }
                                  loading={
                                    selectedLedgerAccountBalance === undefined
                                  }
                                  error={
                                    isErrorSelectedLedgerAccountBalance &&
                                    errorSelectedLedgerAccountBalance?.message
                                  }
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="row">
                      {/* Telex Transfer Amount */}
                      <div className="col-12 col-sm-6 col-xxl-8 offset-xxl-4 mb-3">
                        <CustomInput
                          name={'telex_transfer_amount'}
                          label={'Telex Transfer Amount'}
                          disabled={true}
                          value={formatNumberForDisplay(
                            values.telex_transfer_amount
                          )}
                        />
                      </div>
                      {/* Allocated */}
                      <div className="col-12 col-sm-6 col-xxl-8 offset-xxl-4 mb-3">
                        <CustomInput
                          name={'allocated'}
                          label={'Allocated'}
                          disabled={true}
                          value={formatNumberForDisplay(values.allocated)}
                        />
                      </div>
                      {/* Balance Amount */}
                      <div className="col-12 col-sm-6 col-xxl-8 offset-xxl-4 mb-3">
                        <CustomInput
                          name={'balance_amount'}
                          label={'Balance Amount'}
                          disabled={true}
                          value={formatNumberForDisplay(values.balance_amount)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <FileDisplayList
                  files={addedAttachments}
                  onRemoveFile={handleRemoveFile}
                />

                {/* Add Allocation */}
                <div className="d-flex gap-2 align-items-center mb-4">
                  <span
                    className={
                      parseFloat(values?.balance_amount) <= 0 &&
                        (parseFloat(values?.telex_transfer_amount) || 0 != 0)
                        ? 'tooltip-toggle tooltip-toggle-high'
                        : ''
                    }
                    aria-label="No remaining balance to allocate"
                  >
                    <CustomButton
                      disabled={
                        isDisabled ||
                        values?.mode != 'regular' ||
                        values?.ag_amount === '' ||
                        parseFloat(values?.balance_amount) <= 0
                      }
                      variant="primary"
                      type="button"
                      text="Add Allocation"
                      onClick={() => setShowAddAllocationModal(true)}
                    />
                  </span>
                  {allocationsError ? (
                    <span className="text-danger ms-2">
                      Allocations are required for regular mode.
                    </span>
                  ) : null}
                </div>

                {/* Special Commission */}
                <div className="d-flex mb-45">
                  <CustomButton
                    type={'button'}
                    onClick={handleNavigateToSpecialCommissionPage}
                    text={
                      addedSpecialCommissionValues
                        ? 'Edit Special Commission'
                        : 'Add Special Commission'
                    }
                    disabled={
                      isDisabled ||
                      values.commission_amount
                    }
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
                          addedSpecialCommissionValues?.currency_id
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
                          addedSpecialCommissionValues?.currency_id
                      )?.label
                    }{' '}
                    {formatNumberWithCommas(
                      addedSpecialCommissionValues?.amount
                    )}
                  </p>
                ) : null}
                {/* Print and Account Balance Checkboxes */}
                <div className="d-flex flex-wrap justify-content-start mb-4">
                  <div className="d-inline-block mt-3">
                    <CustomCheckbox
                      label="Account Balance"
                      checked={getAccountBalanceSettings('tmn_currency_deal')}
                      style={{ border: 'none', margin: 0 }}
                      onChange={(e) => {
                        updateAccountBalanceSetting(
                          'tmn_currency_deal',
                          e.target.checked
                        );
                      }}
                      readOnly={isDisabled}
                    />
                    {hasPrintPermission && (
                      <CustomCheckbox
                        label="Print"
                        checked={getPrintSettings('tmn_currency_deal')}
                        onChange={(e) => {
                          updatePrintSetting(
                            'tmn_currency_deal',
                            e.target.checked
                          );
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

      {/* { Allocation table */}
      {shouldShowAllocationTable && (
        <div className="mt-45">
          <CustomTable
            hasFilters={false}
            setFilters={false}
            headers={[
              'S. No.',
              'Account Name',
              'Amount',
              'Doc Type',
              'Number',
              'Bank',
              'Code',
              'City',
              'Description',
              'Action',
            ]}
            isLoading={false}
            sortKey={false}
            sortOrder={false}
            handleSort={false}
            isPaginated={false}
          >
            <tbody>
              {allocations?.map((row, index) => (
                <tr key={row.id}>
                  <td>{index + 1}</td>
                  <td>{row.account_name}</td>
                  <td>{formatNumberForDisplay(row.amount, 2)}</td>
                  <td>{row.document_type}</td>
                  <td>{row.number}</td>
                  <td>{row.bank_name}</td>
                  <td>{row.code}</td>
                  <td>{row.city}</td>
                  <td>{row.description}</td>
                  <td>
                    <TableActionDropDown
                      actions={[
                        {
                          name: 'Edit',
                          icon: HiOutlinePencilSquare,
                          onClick: () => {
                            setShowAddAllocationModal(true);
                            setEditAllocationRow(
                              allocations.find((x) => x.id === row.id)
                            );
                          },
                          className: 'edit',
                        },
                        {
                          name: 'Delete',
                          icon: HiOutlineTrash,
                          onClick: () => {
                            setAllocations(
                              allocations.filter((x) => x.id !== row.id)
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
        actionButtons={[
          { text: 'Save', onClick: handleSubmit },
          {
            text: 'Cancel',
            onClick: handleResetRows,
            variant: 'secondaryButton',
          },
        ]}
        loading={createTMNCurrencyDealMutation.isPending}
        onAttachmentClick={() => setUploadAttachmentsModal(true)}
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
              getAccountsByTypeOptions(
                formikRef?.current?.values.account_ledger
              ).find(
                (x) => x.value === formikRef?.current?.values.account_id
              ) || '',
            amount: formikRef?.current?.values.fc_amount || 0,
            ...addedSpecialCommissionValues,
            // Prefer SC currency_id if present, else fall back to fc_currency_id
            // This must come AFTER the spread to override any currency from addedSpecialCommissionValues
            currency:
              currencyOptions.find(
                (x) =>
                  x.value ==
                  (addedSpecialCommissionValues?.currency_id ??
                    formikRef?.current?.values.fc_currency_id)
              ) || '',
            ledger:
              ledgerOptions.find(
                (x) => x.value === formikRef?.current?.values.account_ledger
              ) || '',
            // Normalize commission_type to exactly 'Income' or 'Expense'
            commission_type: (() => {
              const raw = (
                addedSpecialCommissionValues?.commission_type || 'Income'
              )
                .toString()
                .trim()
                .toLowerCase();
              return raw === 'income' ? 'Income' : 'Expense';
            })(),
            // Map distributions to distributions for the SpecialCommission component
            distributions:
              addedSpecialCommissionValues?.distributions || [],
          }}
          availableCurrencies={currencyOptions
            .filter(
              (c) =>
                c.value === formikRef.current?.values.ag_currency_id ||
                c.value === formikRef.current?.values.fc_currency_id
            )
            .map((c) => ({
              ...c,
              amount:
                c.value === formikRef.current?.values.ag_currency_id
                  ? formikRef.current?.values.ag_amount
                  : formikRef.current?.values.fc_amount,
            }))}
          sCValues={addedSpecialCommissionValues}
          isEdit={false}
          onSubmit={(sCValues) => {
            setAddedSpecialCommissionValues(sCValues);
            // Clear normal commission currency and amount when Special Commission is added
            if (formikRef.current) {
              formikRef.current.setFieldValue('commission_currency_id', '');
              formikRef.current.setFieldValue('commission_amount', '');
            }
            setShowSCModal(false);
          }}
          onCancel={() => setShowSCModal(false)}
          onDelete={() => {
            setAddedSpecialCommissionValues(null);
            if (formikRef.current) {
              // Restore commission currency
              formikRef.current.setFieldValue('commission_currency_id', formikRef.current.values.fc_currency_id || '');
            }
            setShowSCModal(false);
          }}
        />
      </CustomModal>

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

      {/* Allocation Modal */}
      <CustomModal
        show={!!showAddAllocationModal}
        close={() => setShowAddAllocationModal('')}
        size="xl"
        style={{ minHeight: '812px' }}
      >
        <AddAllocationDetailsForm
          inPopup
          allocationData={editAllocationRow}
          onSuccess={handleAddAllocation}
          bankOptions={getBankOptions()}
          balanceAmount={formikRef.current?.values?.balance_amount}
          telexTransferAmount={formikRef.current?.values?.ag_amount}
          docTypeOptions={getDocTypeOptions()}
          cityOptions={getCityOptions()}
          getAccountsByTypeOptions={getAccountsByTypeOptions}
          onCancel={() => {
            setEditAllocationRow(null);
            setShowAddAllocationModal('');
          }}
        />
      </CustomModal>

      {/* VAT Out Of Scope Modal  */}
      <CustomModal
        show={showVatOutOfScopeModal}
        close={() => {
          formikRef.current.setFieldValue('vat_terms', '');
          formikRef.current.setFieldValue('vat_percentage', '');
          formikRef.current.setFieldValue('vat_terms_id', '');
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
              if (!values.out_of_scope) {
                errors.out_of_scope = 'Reason is required';
              }
              return errors;
            }}
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
                      formikRef.current.setFieldValue('vat_terms', '');
                      formikRef.current.setFieldValue('vat_percentage', '');
                      formikRef.current.setFieldValue('vat_terms_id', '');
                    }}
                  />
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </CustomModal>

      {/* Missing Currency Rate Modal */}
      <CustomModal
        show={showMissingCurrencyRateModal}
        close={() => setShowMissingCurrencyRateModal(false)}
        title={'Missing Rate of Exchange'}
        description={
          missingRateContext === 'base'
            ? `Rate of exchange is missing for the selected currency against base currency (TMN).`
            : 'Rate of exchange is missing for selected currency.'
        }
        variant={'error'}
        btn1Text={'Update Rate of Exchange'}
        action={() => {
          setLastVisitedPage(formId, 'rate-of-exchange');
          saveFormValues(formId, {
            ...formikRef.current.values,
            date,
            selectedLedgerAccount,
            tMNCurrencyObj,
            allocations,
            addedSpecialCommissionValues,
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

export default withModal(NewTmnCurrencyDeal);
