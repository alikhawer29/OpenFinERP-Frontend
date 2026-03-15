import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import { useCallback, useEffect, useRef, useState } from 'react';
import { HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import Skeleton from 'react-loading-skeleton';
import { useNavigate } from 'react-router-dom';
import AccountBalanceCard from '../../../Components/AccountBalanceCard/AccountBalanceCard.jsx';
import AddAllocationDetailsForm from '../../../Components/AddAllocationDetailsForm/AddAllocationDetailsForm.jsx';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView.jsx';
import CombinedInputs from '../../../Components/CombinedInputs/CombinedInputs.jsx';
import CustomButton from '../../../Components/CustomButton/index.jsx';
import CustomCheckbox from '../../../Components/CustomCheckbox/CustomCheckbox.jsx';
import CustomInput from '../../../Components/CustomInput/index.jsx';
import CustomModal from '../../../Components/CustomModal/index.jsx';
import CustomTable from '../../../Components/CustomTable/CustomTable.jsx';
import ExchangeRatesCard from '../../../Components/ExchangeRatesCard/ExchangeRatesCard';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect.jsx';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown.jsx';
import { showToast } from '../../../Components/Toast/Toast.jsx';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar.jsx';
import useCurrencyRate from '../../../Hooks/useCurrencyRate';
import { useVATTypes } from '../../../Hooks/useVATTypes.js';

import {
    getAccountBalances,
    getBanksTRQ,
    getCities,
    getCurrencyRatesPair,
    getDocTypes,
    getExchangeRates,
    pairReleased,
} from '../../../Services/General.js';
import {
    checkTransactionLockStatus,
    releaseTransaction,
} from '../../../Services/Process/TransactionLock.js';
import { getBenefeciariesByAccount } from '../../../Services/Transaction/ReceiptVoucher.js';
import {
    addTMNCurrencyDealAttachment,
    deleteTMNCurrencyDealAttachment,
    getPurposes,
    getTMNCurrencyDealAttachments,
    getTMNCurrencyDealListingOrDetails,
    updateTMNCurrencyDeal,
} from '../../../Services/Transaction/TMNCurrencyDeal.js';
import useFormStore from '../../../Stores/FormStore.js';
import useSettingsStore from '../../../Stores/SettingsStore.js';
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

const EditTmnCurrencyDeal = ({
    state,
    date,
    setDate,
    isDisabled = false,
    setIsDisabled,
    setPageState,
    setSearchTerm,
    setWriteTerm,
    searchTerm,
    searchType, // 'buy' or 'sell'
    getAccountsByTypeOptions,
    newlyCreatedAccount,
    newlyCreatedBeneficiary,
    setShowAddLedgerModal,
    currencyOptions,
    lastVoucherNumbers,
    restoreValuesFromStore,
    permissions,
    hasEditPermission,
    hasViewPermission,
    hasPrintPermission,
    showModal,
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
    const formId = 'edit_tmn_currency_deal'; // Unique identifier for this form
    const voucherName =
        searchType === 'buy' ? 'tmn_buy_currency_deal' : 'tmn_sell_currency_deal';

    // For getting print checkbox state from BE
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
    const [allocationsError, setAllocationsError] = useState(false);
    const [showMissingCurrencyRateModal, setShowMissingCurrencyRateModal] =
        useState(false);
    const [showSCModal, setShowSCModal] = useState(false);
    const [exchangeRatesInverse, setExchangeRatesInverse] = useState(false);

    const [baseRateCurrency, setBaseRateCurrency] = useState('');
    const [showRateError, setShowRateError] = useState(false);

    const isRestoringRef = useRef(false);
    const [isRestoringFromStore, setIsRestoringFromStore] = useState(false);
    const isLoadingInitialDataRef = useRef(false);

    const [deletedAttachments, setDeletedAttachments] = useState([]);
    const [currentFiles, setCurrentFiles] = useState([]);
    const filesInitializedRef = useRef(false);

    // Get VAT Type and terms options using custom hook
    const {
        vatType,
        vatTermsOptions,
        isLoadingVatType,
        isErrorVatType,
        errorVatType,
    } = useVATTypes();

    // Banks
    // const { bankOptions, getBankOptions } = useBanks();

    const {
        data: bankOptions,
        isLoading: isLoadingBanks,
        isError: isErrorBanks,
        error: errorBanks,
    } = useQuery({
        queryKey: ['banks'],
        queryFn: getBanksTRQ,
        refetchOnWindowFocus: false,
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

    // Fetch TMN Currency Deal details for editing
    const {
        data: { data: [tmnCurrencyDealData] = [] } = {},
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ['tmnCurrencyDeal', searchTerm, searchType],
        queryFn: () =>
            getTMNCurrencyDealListingOrDetails({
                search: searchTerm,
                type: searchType,
            }),
        enabled: !!searchTerm && !!searchType,
    });

    const tmnCurrencyDeal = tmnCurrencyDealData?.tmn_currency_deal;

    // Initialize files for display once data is loaded
    useEffect(() => {
        if (
            (tmnCurrencyDealData?.files || tmnCurrencyDeal?.files) &&
            !filesInitializedRef.current
        ) {
            const dbFiles =
                tmnCurrencyDealData?.files || tmnCurrencyDeal?.files || [];
            const mappedFiles = dbFiles.map((file) => ({
                ...file,
                name: file.filename || file.name,
                size: file.file_size || file.size,
                type: file.file_type || file.type,
            }));
            setCurrentFiles(mappedFiles);
            filesInitializedRef.current = true;
        }
    }, [tmnCurrencyDeal, tmnCurrencyDealData]);

    // Check Transaction lock status to enable/disable Save
    const { isLoading: isLoadingLockStatus, refetch: checkFormStatus } = useQuery(
        {
            queryKey: ['save_lock_status', voucherName, tmnCurrencyDealData?.id],
            queryFn: () =>
                checkTransactionLockStatus({
                    transaction_type: voucherName,
                    transaction_id: tmnCurrencyDealData?.id,
                }),
            enabled: false,
            retry: false,
        }
    );

    const updateTMNCurrencyDealMutation = useMutation({
        mutationFn: ({ id, payload }) => updateTMNCurrencyDeal(id, payload),
        onSuccess: (data) => {
            setIsSubmitting(false);
            showToast('TMN Currency Deal Updated!', 'success');
            if (hasPrintPermission && getPrintSettings('tmn_currency_deal')) {
                window.open(data.detail?.pdf_url, '_blank');
            }
            queryClient.invalidateQueries(['tmnCurrencyDealListing']);
            queryClient.invalidateQueries([
                'tmnCurrencyDeal',
                searchTerm,
                searchType,
            ]);
            handleResetRows();
            setPageState('new');
            setIsDisabled(true);
            setSearchTerm('');
            setWriteTerm('');
        },
        onError: (error) => {
            setIsSubmitting(false);
            showErrorToast(error);
            if (
                error.message.toLowerCase() ==
                'tmn currency deal limit reached for this branch.'
            ) {
                showModal(
                    'Cannot Update',
                    'You have reached the maximum number of TBN/TSN. To create new transactions you need to increase the transaction count form the Transaction Number Register.',
                    null,
                    'error'
                );
            } else {
                showErrorToast(error);
            }
        },
    });

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

    // Handle returning from Special Commission page
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

    // Handle Special Commission data when returning from SC page
    useEffect(() => {
        if (state?.specialCommissionData) {
            setAddedSpecialCommissionValues(state.specialCommissionData);
        }

        if (state?.specialCommissionDeleted) {
            setAddedSpecialCommissionValues(null);
        }
    }, [state]);

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

    // Document Types
    const {
        data: docTypes,
        isLoading: isLoadingDocTypes,
        isError: isErrorDocTypes,
        error: errorDocTypes,
    } = useQuery({
        queryKey: ['doc-types'],
        queryFn: getDocTypes,
        refetchOnWindowFocus: false,
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
        queryKey: ['cities'],
        queryFn: getCities,
        refetchOnWindowFocus: false,
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

    // Helper function to get bank name by ID
    const getBankNameById = (bankId) => {
        if (!bankId) return '';
        const bank = bankOptions.find((b) => b.id == bankId);
        return bank?.description || '';
    };

    // Helper function to get document type name by ID
    const getDocTypeNameById = (docTypeId) => {
        if (!docTypeId) return '';
        const docType = docTypes?.find((d) => d.id === docTypeId);
        return docType?.description || '';
    };

    // Helper function to get city name by ID
    const getCityNameById = (cityId) => {
        if (!cityId) return '';
        const city = cities?.find((c) => c.id === cityId);
        return city?.description || '';
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
        // Don't auto-update rate during initial data load or restoration
        if (isLoadingInitialDataRef.current || isRestoringRef.current) return;

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
        } else if (currencyRatesPair?.direct_rate && !formikRef.current?.values?.rate) {
            // Only set rate if it's empty (for new currency selection)
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
            console.log(data.messege);
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



    // Handle voucher-level attachment uploads (for new attachments in edit mode)
    const handleVoucherAttachmentsUpload = (files) => {
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
        setCurrentFiles((prev) => prev.filter((f) => f.id !== attachmentId));
    };

    // Handle form reset
    const handleResetRows = () => {
        handlePairReleased();
        // Release lock then reset
        releaseLock();
        setIsDisabled(true);
        setAllocations([]);
        setAddedAttachments([]);
        setDeletedAttachments([]);
        filesInitializedRef.current = false;
        setCurrentFiles([]);
        if (
            tmnCurrencyDealData?.files ||
            tmnCurrencyDealData?.tmn_currency_deal?.files
        ) {
            setCurrentFiles(
                (tmnCurrencyDealData?.files || tmnCurrencyDealData?.tmn_currency_deal?.files || []).map((file) => ({
                    ...file,
                    name: file.filename || file.name,
                    size: file.file_size || file.size,
                    type: file.file_type || file.type,
                }))
            );
        }
        setOutOfScope('');
        setSelectedCurrency(null);
        setAddedSpecialCommissionValues(null);
        if (formikRef.current) {
            formikRef.current.resetForm();
        }
        clearFormValues(formId);
        clearFormValues('special-commission');
        setPageState('view');
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

        // Open modal instead of navigating
        setShowSCModal(true);
    };

    // Handle form submission
    const handleSubmit = async () => {
        setIsSubmitting(true);

        // run status check first
        const { error: errorLockStatus } = await checkFormStatus();
        if (errorLockStatus?.detail?.locked) {
            showToast(errorLockStatus?.message, 'warn');
            setIsSubmitting(false);
            return;
        }
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

        // Rate Range Modal Validation - check against outer state (set by inner useEffect, but access data here)
        // Note: We need a way to check if rate is erroneous without relying on Formik errors if we want to show modal
        // But Formik errors block submission. 
        // Wait, the Formik `validate` function adds errors.rate. If errors exist, we return above.
        // So if "Range: ..." error exists, we never reach here.
        // In Foreign Currency Deal, `validateForm` returns true even if rate error exists?
        // Let's check NewForeignCurrencyDeal again. 
        // Ah, in NewForeignCurrencyDeal `validateForm` manually filters out rate errors before returning true!
        // I need to implement similar logic here if I want the modal to show instead of just blocking with inline error.

        // However, the current code just checks Object.keys(errors).length > 0.
        // If I want the modal, I should check if ONLY rate errors exist, and if so proceed to show Modal.
        const nonRateErrors = Object.keys(errors).filter(key => key !== 'rate' && key !== 'base_rates');
        if (nonRateErrors.length > 0) {
            setIsSubmitting(false);
            return;
        }

        // Now check for rate errors to show modal
        if (errors.rate || errors.base_rates) {
            setIsSubmitting(false);
            // Show Rate Modal
            if (errors.rate) {
                const officialRate = parseFloat(
                    formikRef.current.values.rate_type === '/'
                        ? currencyRatesPair?.reverse_rate
                        : currencyRatesPair?.direct_rate
                );

                let minRange, maxRange;
                if (formikRef.current.values.rate_type === '/') {
                    // Use reverse rate ranges for divide
                    minRange = parseFloat(
                        currencyRatesPair?.reverse_from ?? (officialRate * 0.99)
                    );
                    maxRange = parseFloat(
                        currencyRatesPair?.reverse_upto ?? (officialRate * 1.01)
                    );
                } else {
                    // Use direct rate ranges for multiply
                    minRange = parseFloat(
                        currencyRatesPair?.direct_from ?? (officialRate * 0.99)
                    );
                    maxRange = parseFloat(
                        currencyRatesPair?.direct_upto ?? (officialRate * 1.01)
                    );
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
                    () => {
                        // Explicitly handle modal close
                        return true;
                    },
                    'error'
                );
                return;
            }

            if (errors.base_rates) {
                const officialBaseRate = parseFloat(baseRateCurrencyRate?.rate);
                const minRange = officialBaseRate * 0.99;
                const maxRange = officialBaseRate * 1.01;

                showModal(
                    'Exchange Rate Control',
                    <>
                        Exchange Rate for Base Rate is {formatRateValue(baseRateCurrencyRate?.rate)}
                        <br />
                        Acceptable range is from {formatRateValue(minRange)} to {formatRateValue(maxRange)}
                        <br />
                        your selected base rate is outside this range
                    </>,
                    () => {
                        // Explicitly handle modal close
                        return true;
                    },
                    'error'
                );
                return;
            }
        }

        const formValues = formikRef.current.values;
        let payload = {
            date: formValues.date || date,
            ...formValues,
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

        // Add deleted attachments if any
        if (deletedAttachments.length > 0) {
            deletedAttachments.forEach((id, index) => {
                payload[`deleted_attachments[${index}]`] = id;
            });
        }

        // If allocations are present and mode is regular, then transform allocations and add to payload
        if (
            allocations.length > 0 &&
            formikRef.current?.values?.mode === 'regular'
        ) {
            const transformedAllocations = {};
            allocations.forEach((allocation, index) => {
                Object.entries(allocation).forEach(([key, value]) => {
                    if (key !== 'id') {
                        transformedAllocations[`allocations[${index}][${key}]`] = value;
                    }
                });
            });

            payload = {
                ...payload,
                ...transformedAllocations,
            };
        }

        // Handle Special Commission
        // Only send SC if it's newly added OR modified (not the same as original)
        const hasExistingSC = tmnCurrencyDeal?.special_commission;
        const scModified =
            hasExistingSC &&
            JSON.stringify(addedSpecialCommissionValues) !==
            JSON.stringify(tmnCurrencyDeal.special_commission);

        if (
            addedSpecialCommissionValues &&
            (!hasExistingSC || scModified) // Send if new OR modified
        ) {
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

        // If SC exists but user hasn't modified it, still send commission_amount
        if (hasExistingSC && addedSpecialCommissionValues && !scModified) {
            payload.commission_amount =
                addedSpecialCommissionValues?.total_commission;
        }

        updateTMNCurrencyDealMutation.mutate({
            id: tmnCurrencyDealData?.voucher_no,
            payload,
        });
    };

    // Release lock on unmount or cancel
    const releaseExecutedRef = useRef(false);
    const releaseTransactionMutation = useMutation({
        mutationFn: releaseTransaction,
    });
    const releaseLock = useCallback(() => {
        if (releaseExecutedRef.current) return;
        if (tmnCurrencyDealData?.id) {
            releaseTransactionMutation.mutate({
                transaction_type: voucherName,
                transaction_id: tmnCurrencyDealData?.id,
            });
            releaseExecutedRef.current = true;
        }
    }, [tmnCurrencyDealData?.id]);

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

    useEffect(() => {
        if (formikRef.current?.values && !formikRef.current.values.ag_currency_id) {
            formikRef.current.values.ag_currency_id =
                currencyOptions.find((x) => x.label === 'TMN')?.value || '';
        }
    }, [currencyOptions]);

    // Set allocations when TMN Currency Deal data is loaded
    useEffect(() => {
        if (tmnCurrencyDeal) {
            // Set flag to prevent calculations during initial data load
            isLoadingInitialDataRef.current = true;

            // Set allocations if present
            if (
                tmnCurrencyDeal?.allocations &&
                tmnCurrencyDeal.allocations.length > 0
            ) {
                setAllocations(tmnCurrencyDeal.allocations);
            }

            setSelectedCurrency(tmnCurrencyDeal?.fc_currency_id);

            if (tmnCurrencyDeal?.account_id) {
                setSelectedLedgerAccount({
                    value: tmnCurrencyDeal?.account_id,
                    label:
                        tmnCurrencyDeal?.account_details?.title ||
                        tmnCurrencyDeal?.account_name ||
                        '',
                    accountType: tmnCurrencyDeal?.account_ledger,
                });
            }

            if (tmnCurrencyDeal?.special_commission) {
                // Transform commission_distribution to distributions for the Special Commission component
                const scData = {
                    ...tmnCurrencyDeal.special_commission,
                    // Extract currency_id from the currency object
                    currency_id: tmnCurrencyDeal.special_commission.currency?.id || tmnCurrencyDeal.special_commission.amount_type?.id,
                    distributions: tmnCurrencyDeal.special_commission.commission_distribution || [],
                };
                // Remove the old field name if it exists
                delete scData.commission_distribution;

                setAddedSpecialCommissionValues(scData);
            }

            // Reset the flag after a delay to allow form to stabilize
            setTimeout(() => {
                isLoadingInitialDataRef.current = false;
            }, 300);

            // Update baseRateCurrency state
            if (tmnCurrencyDeal?.base_rate_currency_id) {
                setBaseRateCurrency(tmnCurrencyDeal.base_rate_currency_id);
            }
        }
    }, [tmnCurrencyDeal]);

    const getBaseCurrencyOptions = () => {
        const fcCurrency = formikRef.current?.values?.fc_currency_id;
        const agCurrency = formikRef.current?.values?.ag_currency_id;
        const baseRateCurrency = formikRef.current?.values?.base_rate_currency_id;

        // If no currencies selected/loaded, return empty state
        if (!fcCurrency && !agCurrency && !baseRateCurrency) {
            return [{ label: 'Select FC/AG Currency', value: '' }];
        }

        // If currency options not loaded yet, return placeholder
        if (!currencyOptions || currencyOptions.length === 0) {
            return [{ label: 'Loading currencies...', value: '' }];
        }

        const options = [];
        const addedCurrencies = new Set(); // Track added currencies to avoid duplicates

        // Convert to number for consistent comparison (handles both string and number values)
        const baseRateCurrencyNum = baseRateCurrency
            ? Number(baseRateCurrency)
            : null;
        const fcCurrencyNum = fcCurrency ? Number(fcCurrency) : null;
        const agCurrencyNum = agCurrency ? Number(agCurrency) : null;

        // First priority: Add base_rate_currency_id if it exists (for edit mode)
        if (baseRateCurrencyNum) {
            const baseRateCurrencyObj = currencyOptions.find(
                (x) => Number(x.value) === baseRateCurrencyNum
            );
            if (baseRateCurrencyObj) {
                options.push({
                    label: baseRateCurrencyObj.label,
                    value: baseRateCurrencyObj.value,
                });
                addedCurrencies.add(baseRateCurrencyNum);
            }
        }

        // Second: Add FC currency if different
        if (fcCurrencyNum && !addedCurrencies.has(fcCurrencyNum)) {
            const fcCurrencyObj = currencyOptions.find(
                (x) => Number(x.value) === fcCurrencyNum
            );
            if (fcCurrencyObj) {
                options.push({
                    label: fcCurrencyObj.label,
                    value: fcCurrencyObj.value,
                });
                addedCurrencies.add(fcCurrencyNum);
            }
        }

        // Third: Add AG currency if different
        if (agCurrencyNum && !addedCurrencies.has(agCurrencyNum)) {
            const agCurrencyObj = currencyOptions.find(
                (x) => Number(x.value) === agCurrencyNum
            );
            if (agCurrencyObj) {
                options.push({
                    label: agCurrencyObj.label,
                    value: agCurrencyObj.value,
                });
                addedCurrencies.add(agCurrencyNum);
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

    // Check if VAT types match between branch and existing voucher
    const isVatTypeMismatch = () => {
        const branchVatType = vatType?.vat_type;
        const voucherVatType = tmnCurrencyDeal?.vat_type;

        // If either is missing, don't disable
        if (!branchVatType || !voucherVatType) return false;

        // Check if types are different
        return branchVatType !== voucherVatType;
    };

    const getVATTermsOptions = () => {
        if (isLoadingVatType) return [{ label: 'Loading...', value: '' }];
        if (isErrorVatType) {
            return [{ label: 'Unable to fetch VAT Terms', value: null }];
        }
        return vatTermsOptions;
    };

    // Function to map API response to initial values
    const getInitialValues = () => {
        // Check if we have saved form values from Rate of Exchange navigation
        const savedFormData = getFormValues(formId);

        if (isRestoringFromStore && savedFormData && hasFormValues(formId)) {
            // Return saved values to preserve form state
            return savedFormData;
        }

        // Default initial values from API data
        const initialValues = {
            date: tmnCurrencyDeal?.date || date || '',
            type: tmnCurrencyDeal?.type || 'buy',
            mode: tmnCurrencyDeal?.mode || '',
            account_ledger: tmnCurrencyDeal?.account_ledger || '',
            account_id: tmnCurrencyDeal?.account_id || '',
            beneficiary_id: tmnCurrencyDeal?.beneficiary_id || '',
            bank_id: tmnCurrencyDeal?.bank_id ? Number(tmnCurrencyDeal.bank_id) : '',
            bank_name: tmnCurrencyDeal?.bank_name || '',
            bank_account_no: tmnCurrencyDeal?.bank_account_no || '',
            city: tmnCurrencyDeal?.city || '',
            purpose_id: tmnCurrencyDeal?.purpose_id
                ? Number(tmnCurrencyDeal.purpose_id)
                : '',
            fc_currency_id: tmnCurrencyDeal?.fc_currency_id || '',
            fc_amount: tmnCurrencyDeal?.fc_amount || '',
            rate_type: tmnCurrencyDeal?.rate_type || 'X',
            rate: tmnCurrencyDeal?.rate || '',
            ag_currency_id: tmnCurrencyDeal?.ag_currency_id || '',
            ag_amount: tmnCurrencyDeal?.ag_amount || '',
            commission_currency_id: tmnCurrencyDeal?.commission_currency_id || '',
            // Don't populate commission_amount if there's a special commission
            commission_amount: tmnCurrencyDeal?.special_commission
                ? ''
                : tmnCurrencyDeal?.commission_amount || '',
            vat_type: tmnCurrencyDeal?.vat_type || '',
            vat_terms:
                tmnCurrencyDeal?.vats?.title || tmnCurrencyDeal?.vat_terms || '',
            vat_percentage: tmnCurrencyDeal?.vat_percentage || '',
            vat_terms_id:
                tmnCurrencyDeal?.vats?.id ||
                (tmnCurrencyDeal?.vat_terms_id
                    ? Number(tmnCurrencyDeal.vat_terms_id)
                    : ''),
            vat_currency_id: tmnCurrencyDeal?.vat_currency_id || '',
            vat_amount: tmnCurrencyDeal?.vat_amount || '',
            total_currency_id: tmnCurrencyDeal?.total_currency_id || '',
            total_amount: tmnCurrencyDeal?.total_amount || '',
            base_rate_currency_id: tmnCurrencyDeal?.base_rate_currency_id || '',
            base_rates: tmnCurrencyDeal?.base_rates || '',
            lcy_amount: tmnCurrencyDeal?.lcy_amount || '',
            telex_transfer_amount: tmnCurrencyDeal?.telex_transfer_amount || '',
            allocated: tmnCurrencyDeal?.allocated || '',
            balance_amount: tmnCurrencyDeal?.balance_amount || '',
        };

        return initialValues;
    };

    // Handle loading state
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

    // Handle error state
    if (isError) {
        showErrorToast(error);
        return (
            <div className="d-card">
                <p className="text-danger mb-0">Error fetching TMN Currency Deal</p>
            </div>
        );
    }

    return (
        <>
            <div className="d-card">
                <Formik
                    innerRef={formikRef}
                    initialValues={getInitialValues()}
                    validate={(values) => {
                        const errors = {};

                        // Required fields validation
                        if (!values.date) errors.date = 'Value Date is required';
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
                            const rateValue = parseFloat(values.rate);
                            if (!isNaN(rateValue)) {
                                const officialRate = parseFloat(
                                    values.rate_type === '/'
                                        ? currencyRatesPair?.reverse_rate
                                        : currencyRatesPair?.direct_rate
                                );

                                if (officialRate) {
                                    let minRange, maxRange;
                                    if (values.rate_type === '/') {
                                        // Use reverse rate ranges for divide
                                        minRange = parseFloat(
                                            currencyRatesPair?.reverse_from ?? (officialRate * 0.99)
                                        );
                                        maxRange = parseFloat(
                                            currencyRatesPair?.reverse_upto ?? (officialRate * 1.01)
                                        );
                                    } else {
                                        // Use direct rate ranges for multiply
                                        minRange = parseFloat(
                                            currencyRatesPair?.direct_from ?? (officialRate * 0.99)
                                        );
                                        maxRange = parseFloat(
                                            currencyRatesPair?.direct_upto ?? (officialRate * 1.01)
                                        );
                                    }

                                    if (rateValue < minRange || rateValue > maxRange) {
                                        errors.rate = `Range: ${formatRateValue(minRange)} - ${formatRateValue(maxRange)}`;
                                        setShowRateError(true);
                                    }
                                    else {
                                        setShowRateError(false);
                                    }
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
                    }) => {
                        // Auto-set fixed VAT percentage when VAT type is fixed

                        // Auto-set fixed VAT percentage when VAT type is fixed
                        // ONLY for new vouchers or when voucher doesn't have VAT data yet
                        useEffect(() => {
                            // Don't override if voucher already has VAT data set
                            if (tmnCurrencyDeal?.vat_type) {
                                return; // Preserve existing voucher VAT data
                            }

                            if (vatType?.vat_type === 'fixed' && vatType?.vat_percentage) {
                                const fixedVatPercentage = parseFloat(vatType.vat_percentage);
                                setFieldValue('vat_type', 'fixed');
                                setFieldValue('vat_percentage', fixedVatPercentage);
                                setFieldValue('vat_terms_id', null); // Clear variable term
                                setFieldValue('vat_terms', 'Fixed'); // Set "Fixed" as the label for fixed VAT type
                            }
                        }, [
                            vatType?.vat_type,
                            vatType?.vat_percentage,
                            tmnCurrencyDeal?.vat_type,
                            setFieldValue,
                        ]);

                        // Initialize VAT percentage when vat_terms_id changes (for variable VAT rates)
                        useEffect(() => {
                            // If vat_terms_id is not set but we have API data, set it directly
                            if (!values.vat_terms_id && tmnCurrencyDeal?.vat_terms_id && vatTermsOptions) {
                                setFieldValue('vat_terms_id', Number(tmnCurrencyDeal.vat_terms_id));
                            }

                            if (values.vat_terms_id && vatTermsOptions) {
                                const selectedVatTerm = vatTermsOptions.find(option => option.value === values.vat_terms_id);
                                if (selectedVatTerm && selectedVatTerm.percentage) {
                                    setFieldValue('vat_percentage', selectedVatTerm.percentage);
                                }
                            }
                        }, [values.vat_terms_id, vatTermsOptions, setFieldValue]);

                        // Initialize total_currency_id when fc_currency_id is set
                        useEffect(() => {
                            if (values.fc_currency_id && !values.total_currency_id) {
                                setFieldValue('total_currency_id', values.fc_currency_id);
                            }
                        }, [values.fc_currency_id, values.total_currency_id, setFieldValue]);

                        // Sync baseRateCurrency state from Formik values (for Hook)
                        useEffect(() => {
                            if (values.base_rate_currency_id && values.base_rate_currency_id !== baseRateCurrency) {
                                setBaseRateCurrency(values.base_rate_currency_id);
                            }
                        }, [values.base_rate_currency_id]);



                        useEffect(() => {
                            // Don't recalculate if we're loading initial data
                            if (isLoadingInitialDataRef.current) return;

                            if (!values.base_rate_currency_id) {
                                setFieldValue('base_rates', '');
                                return;
                            }

                            if (isLoadingBaseRateCurrencyRate) {
                                return;
                            }

                            if (baseRateCurrencyRate) {
                                // Calculate middle values from rate ranges
                                let calculatedRate = null;

                                // Determine if this is buy or sell based on the selected currency
                                const isFcCurrency =
                                    values.base_rate_currency_id === values.fc_currency_id;

                                if (isFcCurrency) {
                                    // Use buy rate for FC currency
                                    if (
                                        baseRateCurrencyRate.buy_from !== undefined &&
                                        baseRateCurrencyRate.buy_upto !== undefined
                                    ) {
                                        const buyFrom =
                                            parseFloat(baseRateCurrencyRate.buy_from) || 0;
                                        const buyUpto =
                                            parseFloat(baseRateCurrencyRate.buy_upto) || 0;
                                        calculatedRate = (buyFrom + buyUpto) / 2;
                                    } else if (baseRateCurrencyRate.buy_rate !== undefined) {
                                        calculatedRate = parseFloat(baseRateCurrencyRate.buy_rate);
                                    }
                                } else {
                                    // Use sell rate for other currency
                                    if (
                                        baseRateCurrencyRate.sell_from !== undefined &&
                                        baseRateCurrencyRate.sell_upto !== undefined
                                    ) {
                                        const sellFrom =
                                            parseFloat(baseRateCurrencyRate.sell_from) || 0;
                                        const sellUpto =
                                            parseFloat(baseRateCurrencyRate.sell_upto) || 0;
                                        calculatedRate = (sellFrom + sellUpto) / 2;
                                    } else if (baseRateCurrencyRate.sell_rate !== undefined) {
                                        calculatedRate = parseFloat(baseRateCurrencyRate.sell_rate);
                                    }
                                }

                                // Fallback to rate field if no buy/sell rates available
                                if (
                                    calculatedRate === null &&
                                    baseRateCurrencyRate.rate !== undefined
                                ) {
                                    calculatedRate = parseFloat(baseRateCurrencyRate.rate);
                                }

                                if (calculatedRate !== null && !isNaN(calculatedRate)) {
                                    setFieldValue('base_rates', calculatedRate);
                                } else {
                                    setFieldValue('base_rates', '');
                                }
                            }
                        }, [
                            baseRateCurrencyRate,
                            isLoadingBaseRateCurrencyRate,
                            values.base_rate_currency_id,
                            values.fc_currency_id,
                        ]);

                        // Calculate LCy amount from total_amount and base_rates
                        useEffect(() => {
                            // Don't recalculate if we're loading initial data
                            if (isLoadingInitialDataRef.current) return;

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
                                ? addedSpecialCommissionValues.total_commission
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
                                // For Standard Rate without commission, calculate VAT on base amount
                                vatAmount = (baseAmountForTotal * vatPercentage) / 100;
                            }

                            const totalAmount =
                                parseFloat(baseAmountForTotal) +
                                parseFloat(commission) +
                                parseFloat(vatAmount || 0);

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
                            // Don't recalculate if we're restoring from saved values or loading initial data
                            if (isRestoringRef.current || isLoadingInitialDataRef.current)
                                return;

                            const fcAmount = parseFloat(values.fc_amount) || 0;
                            const rate = parseFloat(values.rate) || 0;

                            if (rate === 0 || fcAmount === 0) return;

                            let agAmount;
                            if (values.rate_type == '/') {
                                agAmount = fcAmount / parseFloat(rate);
                            } else {
                                agAmount = fcAmount * parseFloat(rate);
                            }
                            setFieldValue('ag_amount', agAmount);
                            setFieldValue('telex_transfer_amount', agAmount);
                            setFieldValue('balance_amount', agAmount);
                        }, [values.fc_amount, values.rate, values.rate_type]);

                        useEffect(() => {
                            setShouldShowAllocationTable(
                                allocations.length > 0 && values?.mode === 'regular'
                            );
                        }, [allocations, values?.mode]);

                        // Sync baseRateCurrency state from Formik values (for Hook)
                        useEffect(() => {
                            if (values.base_rate_currency_id && values.base_rate_currency_id !== baseRateCurrency) {
                                setBaseRateCurrency(values.base_rate_currency_id);
                            }
                        }, [values.base_rate_currency_id]);

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

                                    const oldTotalCommission =
                                        parseFloat(addedSpecialCommissionValues.total_commission) ||
                                        0;
                                    const oldAmount =
                                        parseFloat(addedSpecialCommissionValues.amount) || 0;

                                    // Only update if changed
                                    if (
                                        Math.abs(newTotalCommission - oldTotalCommission) > 0.01 ||
                                        Math.abs(currentBaseAmount - oldAmount) > 0.01
                                    ) {
                                        // Recalculate distribution
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
                                                            amount: Math.round(newTotalComm * 100) / 100,
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
                            if (date && date !== values.date) {
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
                                                        } else {
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
                                                            //   }));
                                                        }
                                                    }}
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
                                                            // Only update bank fields if beneficiary has bank data
                                                            if (selected.bank_id) {
                                                                setFieldValue(
                                                                    'bank_id',
                                                                    Number(selected.bank_id)
                                                                );
                                                            }
                                                            if (selected.bank_name) {
                                                                setFieldValue('bank_name', selected.bank_name);
                                                            }
                                                            if (selected.bank_account_number) {
                                                                setFieldValue(
                                                                    'bank_account_no',
                                                                    selected.bank_account_number
                                                                );
                                                            }
                                                            if (selected.city) {
                                                                setFieldValue('city', selected.city);
                                                            }
                                                            if (selected.purpose) {
                                                                setFieldValue(
                                                                    'purpose_id',
                                                                    Number(selected.purpose)
                                                                );
                                                            }
                                                        }
                                                    }}
                                                    onBlur={handleBlur}
                                                />
                                            </div>

                                            {/* Bank */}
                                            <div className="col-12 col-sm-6 mb-45">
                                                <CustomInput
                                                    name={'bank_name'}
                                                    label={'Bank Name'}
                                                    disabled={true}
                                                    value={values.bank_name}
                                                />
                                                {/* Bank Account No */}
                                            </div>
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
                                                    value={
                                                        values.purpose_id
                                                            ? Number(values.purpose_id)
                                                            : values.purpose_id
                                                    }
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
                                                    }}
                                                    onChange2={handleChange}
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
                                                    onChange2={handleChange}
                                                    inputProps2={{
                                                        inputClass: showRateError ? 'text-danger' : '',
                                                    }}
                                                />
                                                {showRateError && errors.rate && currencyRatesPair && (
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
                                                                minRange = parseFloat(
                                                                    currencyRatesPair?.reverse_from ?? (officialRate * 0.99)
                                                                );
                                                                maxRange = parseFloat(
                                                                    currencyRatesPair?.reverse_upto ?? (officialRate * 1.01)
                                                                );
                                                            } else {
                                                                // Use direct rate ranges for multiply
                                                                minRange = parseFloat(
                                                                    currencyRatesPair?.direct_from ?? (officialRate * 0.99)
                                                                );
                                                                maxRange = parseFloat(
                                                                    currencyRatesPair?.direct_upto ?? (officialRate * 1.01)
                                                                );
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
                                                    value1={
                                                        values.base_rate_currency_id
                                                            ? Number(values.base_rate_currency_id)
                                                            : values.base_rate_currency_id
                                                    }
                                                    value2={formatNumberForDisplay(values.base_rates)}
                                                    options1={getBaseCurrencyOptions()}
                                                    isDisabled={true}
                                                    isfirstInputDisabled={true}
                                                    // isSecondInputDisabled={true}
                                                    handleBlur={handleBlur}
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
                                                {errors.base_rates && baseRateCurrencyRate && (
                                                    <div className="input-error-message text-danger">
                                                        {(() => {
                                                            const officialBaseRate = parseFloat(baseRateCurrencyRate?.rate);
                                                            const minRange = officialBaseRate * 0.99;
                                                            const maxRange = officialBaseRate * 1.01;
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

                                                    {(tmnCurrencyDeal?.vat_type === 'variable' ||
                                                        (!tmnCurrencyDeal?.vat_type &&
                                                            vatType?.vat_type === 'variable')) && (
                                                            <div className="col-12 col-sm-6 mb-45">
                                                                <SearchableSelect
                                                                    name={'vat_terms_id'}
                                                                    label={'VAT %'}
                                                                    options={
                                                                        isVatTypeMismatch()
                                                                            ? [
                                                                                {
                                                                                    label: `${values.vat_terms}${values.vat_percentage
                                                                                        ? ' - ' +
                                                                                        values.vat_percentage +
                                                                                        '%'
                                                                                        : ''
                                                                                        }`,
                                                                                    value: values.vat_terms_id,
                                                                                    id: values.vat_terms_id,
                                                                                    title: values.vat_terms,
                                                                                    percentage: values.vat_percentage,
                                                                                },
                                                                            ]
                                                                            : (() => {
                                                                                const currentOptions =
                                                                                    getVATTermsOptions() || [];
                                                                                // Check if selected option exists in current options
                                                                                const selectedExists =
                                                                                    currentOptions.find(
                                                                                        (opt) =>
                                                                                            opt.value === values.vat_terms_id
                                                                                    );

                                                                                // If selected value exists, return current options
                                                                                if (
                                                                                    selectedExists ||
                                                                                    !values.vat_terms_id
                                                                                ) {
                                                                                    return currentOptions;
                                                                                }

                                                                                // If selected doesn't exist, add it to options so it displays
                                                                                return [
                                                                                    ...currentOptions,
                                                                                    {
                                                                                        label: `${values.vat_terms}${values.vat_percentage &&
                                                                                            values.vat_percentage !== 'Nill'
                                                                                            ? ' - ' +
                                                                                            values.vat_percentage +
                                                                                            '%'
                                                                                            : ''
                                                                                            }`,
                                                                                        value: values.vat_terms_id,
                                                                                        id: values.vat_terms_id,
                                                                                        title: values.vat_terms,
                                                                                        percentage: values.vat_percentage,
                                                                                    },
                                                                                ];
                                                                            })()
                                                                    }
                                                                    isDisabled={
                                                                        isDisabled ||
                                                                        (isVatTypeMismatch() &&
                                                                            tmnCurrencyDeal?.vat_type === 'variable') ||
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
                                                    {(tmnCurrencyDeal?.vat_type === 'fixed' ||
                                                        (!tmnCurrencyDeal?.vat_type &&
                                                            vatType?.vat_type === 'fixed')) && (
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
                                                    value2={values.total_amount}
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
                                    <div className="col-0 col-xxl-2" />

                                    <div className="col-12 col-lg-10 col-xl-9 col-xxl-3">
                                        <div className="row">
                                            {!isDisabled && (
                                                <div className="row">
                                                    <div
                                                        className="col-12 mb-45"
                                                        style={{ maxWidth: '350px' }}
                                                    >
                                                        <ExchangeRatesCard
                                                            rates={
                                                                exchangeRatesData?.detail || exchangeRatesData
                                                            }
                                                            loading={isLoadingExchangeRates}
                                                            error={isErrorExchangeRates}
                                                            onInverseChange={setExchangeRatesInverse}
                                                        />
                                                    </div>
                                                    <div
                                                        className="col-12 mb-2"
                                                        style={{ maxWidth: '350px' }}
                                                    >
                                                        {getAccountBalanceSettings('tmn_currency_deal') && (
                                                            <>
                                                                {selectedLedgerAccount && (
                                                                    <AccountBalanceCard
                                                                        heading="Account Balance"
                                                                        accountName={selectedLedgerAccount.label}
                                                                        balances={
                                                                            selectedLedgerAccountBalance?.balances ||
                                                                            selectedLedgerAccountBalance?.detail
                                                                                ?.balances ||
                                                                            (Array.isArray(
                                                                                selectedLedgerAccountBalance
                                                                            )
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
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {/* Telex Transfer Amount */}
                                            <div className="col-12 col-sm-6 col-xxl-8 offset-xxl-3 mb-2">
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
                                            <div className="col-12 col-sm-6 col-xxl-8 offset-xxl-3 mb-2">
                                                <CustomInput
                                                    name={'allocated'}
                                                    label={'Allocated'}
                                                    disabled={true}
                                                    value={formatNumberForDisplay(values.allocated)}
                                                />
                                            </div>
                                            {/* Balance Amount */}
                                            <div className="col-12 col-sm-6 col-xxl-8 offset-xxl-3 mb-2">
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
                                                    (x.value) ===
                                                    (addedSpecialCommissionValues?.currency_id)
                                            )?.label
                                        }{' '}
                                        {formatNumberWithCommas(
                                            addedSpecialCommissionValues?.total_commission
                                        )}{' '}
                                        on{' '}
                                        {
                                            currencyOptions.find(
                                                (x) =>
                                                    (x.value) ===
                                                    (addedSpecialCommissionValues?.currency_id)
                                            )?.label
                                        }{' '}
                                        {formatNumberWithCommas(
                                            addedSpecialCommissionValues?.amount
                                        )}
                                    </p>
                                ) : null}

                                {/* Print and Account Balance Checkboxes */}
                                <div className="d-flex flex-wrap justify-content-start mb-5">
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
                                        <CustomCheckbox
                                            label="Print"
                                            checked={getPrintSettings('tmn_currency_deal')}
                                            onChange={(e) => {
                                                updatePrintSetting(
                                                    'tmn_currency_deal',
                                                    e.target.checked
                                                );
                                            }}
                                            disabled={!hasPrintPermission}
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
                                    <td>{row.account_details?.title || row.account_name}</td>
                                    <td>{formatNumberForDisplay(row.amount, 2)}</td>
                                    <td>
                                        {getDocTypeNameById(row.document_type_id) ||
                                            row.document_type}
                                    </td>
                                    <td>{row.number}</td>
                                    <td>
                                        {getBankNameById(row.bank_id) ||
                                            row.bank_name ||
                                            row.bank?.name ||
                                            ''}
                                    </td>
                                    <td>{row.code}</td>
                                    <td>{getCityNameById(row.city_id) || row.city}</td>
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
                    {
                        text: 'Update',
                        onClick: handleSubmit,
                        loading: isLoadingLockStatus,
                    },
                    {
                        text: 'Cancel',
                        onClick: handleResetRows,
                        variant: 'secondaryButton',
                    },
                ]}
                loading={updateTMNCurrencyDealMutation.isPending}
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
                    showModal={uploadAttachmentsModal}
                    closeModal={() => setUploadAttachmentsModal(false)}
                    item={tmnCurrencyDealData}
                    deleteService={deleteTMNCurrencyDealAttachment}
                    uploadService={addTMNCurrencyDealAttachment}
                    getAttachmentsService={getTMNCurrencyDealAttachments}
                    closeUploader={() => setUploadAttachmentsModal(false)}
                    voucherAttachment={true}
                    useItemId={true}
                    queryToInvalidate={'tmnCurrencyDeal'}
                    deferredMode={true}
                    getUploadedFiles={handleVoucherAttachmentsUpload}
                    getDeletedAttachments={handleDeletedAttachments}
                    currentFiles={currentFiles}
                    setCurrentFiles={setCurrentFiles}
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
                description={'Rate of exchange is missing for selected currency.'}
                variant={'error'}
                btn1Text={'Update Rate of Exchange'}
                action={() => {
                    // Save current form state before navigating
                    if (formikRef.current) {
                        saveFormValues(formId, {
                            ...formikRef.current.values,
                            date,
                            addedAttachments,
                            addedSpecialCommissionValues,
                            allocations,
                        });
                        setLastVisitedPage(formId, 'rate-of-exchange');
                    }
                    navigate('/transactions/remittance-rate-of-exchange', {
                        state: { currencyToSelect: missingRateContext === 'base' ? currencyToSelect : selectedCurrency, date },
                    });
                }}
            />

            {/* Special Commission Modal */}
            <CustomModal
                show={showSCModal}
                close={() => {
                    setShowSCModal(false);
                }}
                size="xl"
                closeOnOutsideClick={false}
            >
                <SpecialCommission
                    preFilledValues={(() => {
                        const preFilled = {
                            date,
                            transaction_no:
                                lastVoucherNumbers?.current || lastVoucherNumbers?.last || '',
                            account:
                                getAccountsByTypeOptions(
                                    formikRef?.current?.values.account_ledger
                                ).find(
                                    (x) => x.value === formikRef?.current?.values.account_id
                                ) || '',
                            amount: (() => {
                                const selectedCurrencyId = addedSpecialCommissionValues?.currency_id ?? formikRef?.current?.values.fc_currency_id;
                                // Use ag_amount if it matches the base currency (tMNCurrencyObj) or the special commission currency
                                if (selectedCurrencyId === tMNCurrencyObj?.value || selectedCurrencyId === addedSpecialCommissionValues?.currency_id) {
                                    return formikRef?.current?.values.ag_amount || 0;
                                }
                                return formikRef?.current?.values.fc_amount || 0;
                            })(),
                            ...addedSpecialCommissionValues,
                            // Prefer SC currency_id if present, else fall back to fc_currency_id
                            // This must come AFTER the spread to override any currency from addedSpecialCommissionValues
                            currency_id: addedSpecialCommissionValues?.currency_id ?? formikRef?.current?.values.fc_currency_id,
                            currency: {
                                label: currencyOptions.find(
                                    (x) =>
                                        x.value ==
                                        (addedSpecialCommissionValues?.currency_id ??
                                            formikRef?.current?.values.fc_currency_id)
                                )?.label || currencyOptions.find(
                                    (x) =>
                                        x.value ==
                                        (addedSpecialCommissionValues?.currency_id ??
                                            formikRef?.current?.values.fc_currency_id)
                                )?.description,
                                value: addedSpecialCommissionValues?.currency_id ??
                                    formikRef?.current?.values.fc_currency_id
                            } || '',
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
                        };

                        return preFilled;
                    })()}
                    availableCurrencies={currencyOptions
                        .filter(
                            (c) =>
                                c.value === tMNCurrencyObj?.value ||
                                c.value === formikRef.current?.values.fc_currency_id ||
                                c.value === (addedSpecialCommissionValues?.currency_id)
                        )
                        .map((c) => ({
                            label: c.label || c.description,
                            value: c.value,
                            amount:
                                c.value === tMNCurrencyObj?.value
                                    ? formikRef.current?.values.ag_amount
                                    : c.value === addedSpecialCommissionValues?.currency_id
                                        ? (() => {
                                            const selectedCurrencyId = addedSpecialCommissionValues?.currency_id;
                                            // Use ag_amount for special commission currency (TMN)
                                            return formikRef.current?.values.ag_amount || 0;
                                        })()
                                        : formikRef.current?.values.fc_amount,
                        }))}
                    sCValues={addedSpecialCommissionValues}
                    isEdit={true}
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
        </>
    );
};

export default EditTmnCurrencyDeal;