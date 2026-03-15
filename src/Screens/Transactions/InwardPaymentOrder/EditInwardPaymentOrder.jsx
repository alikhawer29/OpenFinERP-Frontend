import { useMutation, useQuery } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AccountBalanceCard from '../../../Components/AccountBalanceCard/AccountBalanceCard.jsx';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CombinedInputs from '../../../Components/CombinedInputs/CombinedInputs';
import CustomButton from '../../../Components/CustomButton';
import CustomCheckbox from '../../../Components/CustomCheckbox/CustomCheckbox';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import useCurrencyRate from '../../../Hooks/useCurrencyRate';
import {
  checkTransactionLockStatus,
  releaseTransaction,
} from '../../../Services/Process/TransactionLock';
import { getAccountBalances, pairReleased } from '../../../Services/General.js';
import { getWalkInCustomerListing } from '../../../Services/Transaction/InwardPayment';
import {
  addInwardPaymentOrderAttachment,
  deleteInwardPaymentOrderAttachment,
  getInwardPaymentOrderListing,
  getIPOCurrencies,
  getIPOOfficeLocations,
  getIPOVATType,
  updateInwardPaymentOrder,
} from '../../../Services/Transaction/InwardPaymentOrder';
import useFormStore from '../../../Stores/FormStore';
import useSettingsStore from '../../../Stores/SettingsStore';
import { ledgerOptions } from '../../../Utils/Constants/SelectOptions.js';
import {
  inwardPaymentOrderNewHeaders,
  SUMMARY_TABLE_HEADERS,
  walkInHeaders,
} from '../../../Utils/Constants/TableHeaders';
import { formatDate, formatNumberForDisplay } from '../../../Utils/Utils.jsx';
import SpecialCommission from '../SpecialCommission/SpecialCommission';
import InwardPaymentOrderRow from './InwardPaymentOrderRow';

const EditInwardPaymentOrder = ({
  searchTerm,
  newlyCreatedAccount,
  setPageState,
  setShowAddLedgerModal,
  lastVoucherNumbers,
  setWriteTerm,
  setSearchTerm,
  getAccountsByTypeOptions,
  setIsDisabled,
  isDisabled = false,
  selectedFiles,
  setSelectedFiles,
  permissions,
  hasViewPermission,
  hasPrintPermission,
}) => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const id = searchTerm;
  const [rows, setRows] = useState({});
  //  attachment state management

  // State variables
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(null);

  // Missing Currency Rate Modal state (following Receipt Voucher pattern)
  const [showMissingCurrencyRateModal, setShowMissingCurrencyRateModal] =
    useState(false);
  const [currencyToSelect, setCurrencyToSelect] = useState(null);
  const [hasShownMissingRateModal, setHasShownMissingRateModal] = useState(false);
  const [restoreValuesFromStore, setRestoreValuesFromStore] = useState(false);

  const [selectedWalkin, setSelectedWalkin] = useState(null);
  const [specialCommission, setSpecialCommission] = useState(null);
  const [walkinModal, setWalkinModal] = useState(false);
  const [walkinModalRowId, setWalkinModalRowId] = useState(null);
  const [filters, setFilters] = useState({});
  const [walkinSearchTerm, setWalkinSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [addedSpecialCommissionValues, setAddedSpecialCommissionValues] =
    useState(null);
  const [showSCModal, setShowSCModal] = useState(false);
  const [showOutOfScopeModal, setShowOutOfScopeModal] = useState(false);
  const [outOfScope, setOutOfScope] = useState('');
  const [rowFieldErrors, setRowFieldErrors] = useState({});
  const [rowsTouched, setRowsTouched] = useState({});
  const [isError, setIsError] = useState(false);
  const [currentVatPercentage, setCurrentVatPercentage] = useState(0); // Track current VAT percentage

  const formikRef = useRef();

  // Required fields for a row
  const REQUIRED_ROW_FIELDS = [
    'payType',
    'walkInCustomerId',
    'currency',
    'fcAmount',
    'payDate',
    'bankName',
    'bankAc',
  ];

  // Restoration ref to prevent calculations during form restoration
  const isRestoringRef = useRef(false);

  // Form store for TMN pattern
  const {
    saveFormValues,
    getFormValues,
    hasFormValues,
    clearFormValues,
    setLastVisitedPage,
    getLastVisitedPage,
    clearLastVisitedPage,
  } = useFormStore();
  const formId = 'edit_inward_payment_order';
  const voucherName = 'inward_payment_order';

  // Out of Scope handler
  const handleVatOutOfScope = (values) => {
    setOutOfScope(values.reason || values.out_of_scope || '');
    setShowOutOfScopeModal(false);
    // Keep selected Out of Scope VAT option; do not clear fields
  };

  // Get settings store functions
  const {
    getPrintSettings,
    getAccountBalanceSettings,
    updateAccountBalanceSetting,
    updatePrintSetting,
  } = useSettingsStore();

  // Fetch currencies
  const { data: currencyOptions } = useQuery({
    queryKey: ['ipoCurrencies'],
    queryFn: getIPOCurrencies,
    staleTime: 1000 * 60 * 5,
    retry: 1,
    select: (data) => {
      return Array.isArray(data)
        ? data.map((currency) => ({
          label: currency.currency_code || currency.title,
          value: currency.id,
        }))
        : [];
    },
  });

  // Fetch currency rate for the selected Currency (following Receipt Voucher pattern)
  const { data: currencyRate, isLoading: isLoadingCurrencyRate } =
    useCurrencyRate(selectedCurrency, new Date().toLocaleDateString('en-CA'));

  // Fetch office locations (same as NewInwardPaymentOrder)
  const { data: officeLocations, isLoading: isLoadingOffices } = useQuery({
    queryKey: ['ipoOfficeLocations'],
    queryFn: getIPOOfficeLocations,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  // Fetch VAT types (same as NewInwardPaymentOrder)
  const { data: vatType, isLoading: isLoadingVatType } = useQuery({
    queryKey: ['vatType'],
    queryFn: getIPOVATType,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Get accounts by type for the selected ledger

  // Fetch Walk-in customers data
  const { data: walkInCustomersData } = useQuery({
    queryKey: ['walkInCustomers'],
    queryFn: getWalkInCustomerListing,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  // Fetch account balance for selected ledger account (following NewInwardPaymentOrder pattern)
  const { data: ledgerAccountBalance } = useQuery({
    queryKey: ['accountBalance', selectedLedgerAccount?.value],
    queryFn: () =>
      getAccountBalances(
        selectedLedgerAccount.value,
        selectedLedgerAccount.accountType
      ),
    enabled: !!selectedLedgerAccount?.value,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  // Update mutation
  const updateInwardPaymentOrderMutation = useMutation({
    mutationFn: ({ id, formData }) => {
      return updateInwardPaymentOrder(id, formData);
    },
    onSuccess: (data) => {
      showToast(
        data.message,
        'success'
      );
      // Release pairs after successful update
      handlePairReleased();
      // Release lock on successful update
      releaseLock();
      setPageState('view');
    },
    onError: (error) => {
      showToast(
        error.message,
        'error'
      );
    },
  });

  // Fetch order details for edit
  const {
    data: orderData,
    isLoading: isLoadingOrder,
    isError: isErrorOrder,
    error: errorOrder,
  } = useQuery({
    queryKey: ['inwardPaymentOrder', id],
    queryFn: () => getInwardPaymentOrderListing({ search: id }),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  // Check Transaction lock status to enable/disable Save
  const { isLoading: isLoadingLockStatus, refetch: checkFormStatus } = useQuery(
    {
      queryKey: ['save_lock_status', voucherName, orderData?.data?.[0]?.id],
      queryFn: () =>
        checkTransactionLockStatus({
          transaction_type: voucherName,
          transaction_id: orderData?.data?.[0]?.id,
        }),
      enabled: false,
      retry: false,
    }
  );

  if (isLoadingOrder) {
    return <div>Loading...</div>;
  }
  if (isErrorOrder) {
    return <div>Error: {errorOrder.message}</div>;
  }

  // Pre-fill form and state on data load
  useEffect(() => {
    if (orderData && orderData.data && orderData.data.length > 0) {
      const order = orderData.data[0]?.inward_payment_order || {};
      // Pre-fill Formik values
      if (formikRef.current) {
        formikRef.current.setValues({
          account_ledger: order.debit_account_ledger,
          account_id: order.debit_account_id || '',
          office: order.office_id || '',
          vatType: order.vat_type || '',
          vat_terms_id: order.vat_terms_id || '',
          vat_terms_type: order.vat_terms_type || '',
          vat_terms_percentage: order.vat_terms_percentage || 0,
          vat_terms: order.vat_terms || 0,
          vat_amount: order.vat_amount || 0,
          special_commission: order.special_commission || '',
        });

        // Initialize currentVatPercentage from existing data (multiple sources)
        let vatPercentage = 0;
        if (order.vat_terms_percentage) {
          vatPercentage = parseFloat(order.vat_terms_percentage) || 0;
        } else if (order.vat_terms) {
          vatPercentage = parseFloat(order.vat_terms) || 0;
        } else if (order.vat?.percentage) {
          vatPercentage = parseFloat(order.vat.percentage) || 0;
        }



        if (vatPercentage > 0) {
          setCurrentVatPercentage(vatPercentage);
        }
      }

      // Pre-fill rows from details
      if (order.details && order.details.length > 0) {
        const initialRows = {};
        order.details.forEach((detail, index) => {
          initialRows[index] = {
            // Map API field names to component expected field names
            id: index, // Add id for the row
            refNo: detail.ref_no || '',
            payType: detail.pay_type || '',
            walkInCustomer: detail.walkin_customer?.customer_name || '',
            walkInCustomerId: detail.walkin_id || '',
            sender: detail.sender || '',
            idNumber: detail.id_number || '',
            contactNo: detail.contact_no || '',
            currency: detail.currency_id || '', // Use currency_id for dropdown value
            currencyId: detail.currency_id || '',
            fcAmount: detail.fc_amount || '',
            balanceAmount: detail.balance_amount || '',
            commission: detail.commission || '',
            vatAmount: detail.vat_amount || '',
            payDate: detail.pay_date || '',
            bankName: detail.bank_name || '',
            bankAc: detail.bank_account || '',
            narration: detail.narration || '',
            status: detail.status || '',
            // Map other expected fields (ensure all are strings)
            walkInCustomerName: detail.walkin_customer?.customer_name || '',
            walkInCustomerMobile:
              detail.walkin_customer?.mobile_number_full || '',
            walkInCustomerTelephone:
              detail.walkin_customer?.telephone_number_full || '',
            walkInCustomerFax: detail.walkin_customer?.fax_number_full || '',
          };
        });
        setRows(initialRows);

        // Mark first row as touched by default to show validation errors initially
        if (Object.keys(initialRows).length > 0) {
          const firstRowId = Object.keys(initialRows)[0];
          setRowsTouched({ [firstRowId]: true });
        }
      }

      // Pre-fill walk-in info if exists
      if (
        order.details &&
        order.details.length > 0 &&
        order.details[0].walkin_customer
      ) {
        setSelectedWalkin(order.details[0].walkin_customer);
      }

      // Pre-fill special commission following EditReceiptVoucher pattern
      if (order.special_commission) {
        const scData = order.special_commission;
        // Save to form store like EditReceiptVoucher
        const formStoreData = {
          ...scData,
          ledger: scData.account_type,
          distributions: [...scData.commission_distribution],
        };
        saveFormValues('special-commission', formStoreData);

        const specialCommissionData = {
          transaction_no: scData.transaction_no || '',
          date: scData.date || '',
          commission_type: scData.commission_type ? scData.commission_type.charAt(0).toUpperCase() + scData.commission_type.slice(1) : 'Income',
          ledger: scData.account_type || '',
          ledger_name: scData.account_details?.title || '',
          account_id: scData.account_id || '',
          account: scData.account_details?.title || '',
          currency_id: scData.amount_type?.id || scData.currency?.id || '',
          currency: scData.currency?.currency_code || '',
          amount: scData.amount || 0,
          commission: scData.commission || 0,
          total_commission: scData.total_commission || 0,
          description: scData.description || '',
          distributions: scData.commission_distribution || [],
        };


        setAddedSpecialCommissionValues(specialCommissionData);
      }
    }
  }, [orderData]);

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

      // Restore form values and rows
      formikRef.current.setValues(savedValues.values || {});
      if (savedValues.rows) {
        setRows(savedValues.rows);
      }

      // Enable the form after restoration
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
        clearFormValues('special-commission');
      } else if (savedValues.addedSpecialCommissionValues) {
        // Only set from main form values if no special-commission form values exist
        setAddedSpecialCommissionValues(savedValues.addedSpecialCommissionValues);
      }
    } else if (lastPage === 'rate-of-exchange' && hasFormValues('edit-inward-payment-order')) {
      // Set page state to edit and enable the form
      setIsDisabled(false);
      setRestoreValuesFromStore(true);
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

  // Restore form data if returning from Rate of Exchange page (following Account to Account pattern)
  useEffect(() => {
    if (restoreValuesFromStore) {
      const savedFormData = getFormValues('edit-inward-payment-order');
      if (savedFormData && formikRef.current) {
        formikRef.current.setValues(savedFormData);
        setRows(savedFormData.rows || {});
        setAddedSpecialCommissionValues(savedFormData.addedSpecialCommissionValues || null);
        // Clear the saved data after restoring
        clearFormValues('edit-inward-payment-order');
        clearLastVisitedPage(formId);
        setRestoreValuesFromStore(false);
      }
    }
  }, [restoreValuesFromStore]);

  // Initialize selectedLedgerAccount when form loads with existing data
  useEffect(() => {
    if (formikRef.current?.values?.account_id && formikRef.current?.values?.account_ledger) {
      const accountOptions = getAccountsByTypeOptions(formikRef.current.values.account_ledger);
      const selectedAccount = accountOptions.find(
        (option) => option.value === formikRef.current.values.account_id
      );
      
      if (selectedAccount) {
        setSelectedLedgerAccount({
          value: selectedAccount.value,
          label: selectedAccount.label,
          accountType: formikRef.current.values.account_ledger,
        });
      }
    }
  }, [orderData, getAccountsByTypeOptions]);

  // Enable form when component loads (for edit mode)
  useEffect(() => {
    setIsDisabled(false);
  }, []);

  // Handle missing currency rate (following Receipt Voucher pattern)
  useEffect(() => {
    if (
      selectedCurrency &&
      currencyRate &&
      !currencyRate?.rate &&
      !hasShownMissingRateModal
    ) {
      // Clear currency field in all rows (following Receipt Voucher pattern)
      setRows((prevRows) => {
        const updatedRows = { ...prevRows };
        Object.keys(updatedRows).forEach((rowId) => {
          if (updatedRows[rowId].currency === selectedCurrency) {
            updatedRows[rowId] = {
              ...updatedRows[rowId],
              currency: '',
            };
          }
        });
        return updatedRows;
      });

      setCurrencyToSelect(selectedCurrency);
      setShowMissingCurrencyRateModal(true);
      setHasShownMissingRateModal(true);
    }
  }, [selectedCurrency, currencyRate?.rate, hasShownMissingRateModal]);

  // Handle newly created account
  useEffect(() => {
    if (newlyCreatedAccount && formikRef.current) {
      formikRef.current.setFieldValue(
        'account_ledger',
        newlyCreatedAccount.debitLedger
      );
      formikRef.current.setFieldValue(
        'account_id',
        newlyCreatedAccount.debitAccount
      );
    }
  }, [newlyCreatedAccount]);

  // Set VAT terms type and percentage in Formik after vatType loads
  useEffect(() => {
    if (vatType && formikRef.current) {
      formikRef.current.setFieldValue('vat_terms_type', vatType.vat_type || '');
      formikRef.current.setFieldValue(
        'vat_terms_percentage',
        vatType.vat_type === 'fixed'
          ? parseFloat(vatType.vat_percentage) || 0
          : 0
      );
    }
  }, [vatType]);

  // Remove automatic validation - table validation should only show on Save click

  const getVATTermsOptions = () => {
    if (isLoadingVatType)
      return [
        {
          label: 'Loading...',
          value: '',
        },
      ];
    return (
      vatType?.vats?.map((item) => ({
        id: item.id,
        label: `${item.title}${!isNaN(parseFloat(item.percentage))
          ? ' - ' + item.percentage + '%'
          : ''
          }`,
        value: item.id,
        percentage: item.percentage,
      })) || []
    );
  };

  // Helper function to get currency name from ID
  const getCurrencyName = useCallback(
    (currencyId) => {
      if (!currencyOptions || !Array.isArray(currencyOptions)) {
        return String(currencyId || '');
      }

      // Convert currencyId to number for comparison
      const numericCurrencyId = parseInt(currencyId);

      const currency = currencyOptions.find(
        (option) => option.value === numericCurrencyId
      );

      const result = currency
        ? String(currency.label || '')
        : String(currencyId || '');
      return result;
    },
    [currencyOptions]
  );

  // Calculate summary data dynamically based on rows
  const calculateSummaryData = useCallback((formikValues = null) => {
    const validRows = Object.values(rows).filter((row) => {
      return row.currency && row.fcAmount && !isNaN(parseFloat(row.fcAmount));
    });

    // Group by currency and sum amounts
    const currencyGroups = validRows.reduce((acc, row) => {
      const currencyId = String(row.currency || '');
      const currencyName = getCurrencyName(currencyId); // Get currency name instead of ID
      const fcAmount = parseFloat(row.fcAmount) || 0;
      const commission = parseFloat(row.commission) || 0;

      if (!acc[currencyId]) {
        acc[currencyId] = {
          currency: String(currencyName || currencyId || ''), // Use currency name or fallback to ID
          currencyId: currencyId, // Store currency ID for reference
          total: 0,
          commission: 0,
          specialCommission: 0, // Add special commission tracking
          vatAmount: 0,
          netTotal: 0,
        };
      }

      acc[currencyId].total += fcAmount;
      acc[currencyId].commission += commission;

      return acc;
    }, {});

    // Add Special Commission to the appropriate currency group
    if (addedSpecialCommissionValues && addedSpecialCommissionValues.total_commission) {
      const scCurrencyId = String(addedSpecialCommissionValues.currency_id || '');
      const scCurrencyName = getCurrencyName(scCurrencyId);

      // Use the updated total_commission from addedSpecialCommissionValues
      // instead of recalculating it (this ensures it updates when FC amount changes)
      const scAmount = parseFloat(addedSpecialCommissionValues.total_commission) || 0;

      // Find matching currency group or create new one
      // Convert currency keys to string for comparison
      const matchingKey = Object.keys(currencyGroups).find(
        key => String(key) === scCurrencyId
      ) || scCurrencyId;

      if (currencyGroups[matchingKey]) {
        currencyGroups[matchingKey].specialCommission = scAmount; // Use = instead of += to avoid accumulation
      } else {
        currencyGroups[matchingKey] = {
          currency: scCurrencyName,
          currencyId: scCurrencyId,
          total: 0,
          commission: 0,
          specialCommission: scAmount,
          vatAmount: 0,
          netTotal: 0,
        };
      }

    }

    // Calculate VAT and net total for each currency group
    return Object.values(currencyGroups).map((group) => {
      // Use VAT percentage from state variable with fallback to API data
      // Use passed formikValues if available, otherwise fall back to formikRef
      const values = formikValues || formikRef.current?.values || {};
      let vatPercentage = currentVatPercentage;

      // Fallback: if currentVatPercentage is 0, try to get it from form values or API data
      if (vatPercentage === 0 && values.vat_terms_percentage) {
        vatPercentage = parseFloat(values.vat_terms_percentage) || 0;
      }
      if (vatPercentage === 0 && values.vat_terms) {
        vatPercentage = parseFloat(values.vat_terms) || 0;
      }

      // Calculate total commission (row commissions + special commission)
      const totalCommission = group.commission + group.specialCommission;

      // VAT Amount calculation: total commission * (vatPercentage / 100)
      group.vatAmount = totalCommission * (vatPercentage / 100);

      // Apply VAT calculation based on VAT Type from form values
      const vatType = values.vatType || 'absorb';
      if (vatType === 'absorb') {
        // If VAT Type is "Absorb": Net Total = Total + Total Commission
        group.netTotal = group.total + totalCommission;
      } else {
        // If VAT Type is "Charge": Net Total = Total + Total Commission + VAT Amount
        group.netTotal = group.total + totalCommission + group.vatAmount;
      }

      return {
        ...group,
        total: formatNumberForDisplay(group.total, 2),
        commission: formatNumberForDisplay(totalCommission, 2), // Show total commission (regular + special)
        specialCommission: formatNumberForDisplay(group.specialCommission, 2),
        totalCommission: formatNumberForDisplay(totalCommission, 2),
        vatAmount: formatNumberForDisplay(group.vatAmount, 2),
        netTotal: formatNumberForDisplay(group.netTotal, 2),
      };
    });
  }, [rows, addedSpecialCommissionValues, getCurrencyName, currentVatPercentage]);

  const handleAddRows = () => {
    const newRows = {};
    const id = crypto.randomUUID();
    newRows[id] = {
      id,
      refNo: '',
      payType: '',
      beneficiary: '',
      walkInCustomer: '', // Add missing field
      walkInCustomerId: '', // Add missing field
      sender: '',
      idNumber: '',
      contactNo: '',
      currency: '',
      fcAmount: '',
      commission: '',
      payDate: '',
      bankName: '',
      bankAc: '',
      narration: '',
    };
    setRows((prevRows) => {
      const updatedRows = { ...prevRows, ...newRows };

      // If this is the first row (no existing rows), mark it as touched
      if (Object.keys(prevRows).length === 0) {
        setRowsTouched({ [id]: true });
      }

      return updatedRows;
    });
  };

  const handleSubmit = async () => {
    // run status check first
    const { error: errorLockStatus } = await checkFormStatus();
    if (errorLockStatus?.detail?.locked) {
      showToast(errorLockStatus?.message, 'warn');
      return;
    }

    if (!formikRef.current) {
      return;
    }

    // Validate the form using Formik first
    const errors = await formikRef.current.validateForm();

    // Trigger row validation to show errors for only first invalid row
    const nextErrors = {};
    let firstInvalidRowId = null;

    // Find first row with validation errors
    for (const r of Object.values(rows)) {
      const currencyError = !r.currency || r.currency === '';
      const amountError = !r.fcAmount || isNaN(parseFloat(r.fcAmount));
      // Completely remove Pay Type validation
      const beneficiaryError = !r.walkInCustomerId;
      const payDateError = !r.payDate;
      const bankNameError =
        (r.payType === 'cash_deposit' || r.payType === 'cheque_deposit') &&
        r.bankName && r.bankName.trim() === '';
      const bankAccountError =
        (r.payType === 'cash_deposit' || r.payType === 'cheque_deposit') &&
        r.bankAc && r.bankAc.trim() === '';

      if (currencyError || amountError || bankAccountError || bankNameError ||
        beneficiaryError || payDateError) {
        nextErrors[r.id] = {
          currency: currencyError,
          fcAmount: amountError,
          bankName: bankNameError,
          bankAc: bankAccountError,
          walkInCustomerId: beneficiaryError,
          payDate: payDateError,
        };
        firstInvalidRowId = r.id;
        break; // Stop after finding first invalid row
      }
    }
    setRowFieldErrors(nextErrors);

    // Don't automatically mark rows as touched - let user interaction control error display
    // setRowsTouched((prev) => {
    //   const newState = {};
    //   Object.keys(rows).forEach(rowId => {
    //     const row = rows[rowId];
    //     // Mark row as touched ONLY if it has any data
    //     if (row && Object.values(row).some(value => value !== undefined && value !== '' && value !== null)) {
    //       newState[rowId] = true;
    //     }
    //     // Don't keep existing touched state - this prevents errors from showing when data is removed
    //   });
    //   return newState;
    // });

    // Check for validation errors in rows that have data AND are touched (user is actively working on them)
    const rowsWithDataErrors = Object.keys(nextErrors).filter(rowId => {
      const row = rows[rowId];
      // Only block submission if the row has data AND has validation errors AND user is actively working on it
      return row &&
        Object.values(row).some(value => value !== undefined && value !== '' && value !== null) &&
        rowsTouched[rowId];
    });

    // If there are validation errors in rows with data that user is working on, show them and stop
    if (Object.keys(errors).length > 0 || rowsWithDataErrors.length > 0) {
      // Show errors for rows with data by marking them as touched
      const touchedRowsToSet = {};
      rowsWithDataErrors.forEach(rowId => {
        touchedRowsToSet[rowId] = true;
      });
      setRowsTouched(touchedRowsToSet);

      // Set Formik fields as touched to show validation errors
      formikRef.current.setTouched(
        Object.keys(errors).reduce((acc, key) => ({ ...acc, [key]: true }), {})
      );
      return;
    }

    // All validation passed - proceed with API call
    const values = formikRef.current.values;

    // Use only rows that have required fields filled
    const filledRows = Object.values(rows).filter((row) =>
      row &&
      row.payType &&
      row.walkInCustomerId &&
      row.currency &&
      row.fcAmount &&
      row.payDate
      // Bank fields are optional for filled rows check
    );

    // Require at least one filled row
    if (filledRows.length === 0) {
      // Set validation error instead of showing toast
      formikRef.current.setFieldError('filled_rows', 'Please add at least one filled row before submitting');
      formikRef.current.setTouched({ filled_rows: true });
      return;
    }

    // Determine commission presence and VAT application
    const rowCommissionTotal = Object.values(rows).reduce(
      (sum, r) => sum + (parseFloat(r.commission) || 0),
      0
    );
    const hasNormalCommission = rowCommissionTotal > 0;
    const hasSpecialCommission = !!(
      addedSpecialCommissionValues &&
      parseFloat(addedSpecialCommissionValues.total_commission) > 0
    );
    const hasAnyCommission = hasNormalCommission || hasSpecialCommission;
    // VAT % required only when any commission exists and VAT is variable
    if (
      hasAnyCommission &&
      vatType?.vat_type === 'variable' &&
      // Accept either a selected VAT term or an Out of Scope reason
      (!values.vat_terms_id && !outOfScope)
    ) {
      // Set validation error instead of showing toast
      formikRef.current.setFieldError('vat_terms_id', 'Please select VAT %');
      formikRef.current.setTouched({ vat_terms_id: true });
      return;
    }

    // Validate Special Commission if present
    if (addedSpecialCommissionValues) {
      if (!addedSpecialCommissionValues.total_commission ||
        parseFloat(addedSpecialCommissionValues.total_commission) <= 0) {
        // Set validation error instead of showing toast
        formikRef.current.setFieldError('special_commission', 'Special Commission amount must be greater than 0');
        formikRef.current.setTouched({ special_commission: true });
        return;
      }
      if (!addedSpecialCommissionValues.commission_type) {
        // Set validation error instead of showing toast
        formikRef.current.setFieldError('special_commission_type', 'Special Commission type is required');
        formikRef.current.setTouched({ special_commission_type: true });
        return;
      }
      if (!addedSpecialCommissionValues.currency_id) {
        // Set validation error instead of showing toast
        formikRef.current.setFieldError('special_commission_currency', 'Special Commission currency is required');
        formikRef.current.setTouched({ special_commission_currency: true });
        return;
      }

      // Validate that Special Commission currency matches a row currency
      const validRowCurrencies = filledRows.map(row => row.currency).filter(Boolean);
      if (!validRowCurrencies.includes(addedSpecialCommissionValues.currency_id)) {
        // Set validation error instead of showing toast
        formikRef.current.setFieldError('special_commission_currency_match', 'Special Commission currency must match a currency from IPO rows');
        formikRef.current.setTouched({ special_commission_currency_match: true });
        return;
      }
    }

    // Resolve VAT terms with safe fallbacks (matching New page logic)
    const finalVatTermsType = values.vat_terms_type || vatType?.vat_type || '';
    const finalVatTermsPercentage =
      finalVatTermsType === 'fixed'
        ? (Number(values.vat_terms_percentage) || Number(vatType?.vat_percentage) || 0)
        : (parseFloat(values.vat_terms) || 0);

    // If Formik is missing VAT fields, sync them once for consistency
    if (formikRef.current) {
      if (!values.vat_terms_type && vatType?.vat_type) {
        formikRef.current.setFieldValue('vat_terms_type', vatType.vat_type);
      }
      if (
        finalVatTermsType === 'fixed' &&
        !values.vat_terms_percentage &&
        vatType?.vat_percentage != null
      ) {
        formikRef.current.setFieldValue(
          'vat_terms_percentage',
          Number(vatType.vat_percentage) || 0
        );
      }
    }

    // Prepare payload following NewInwardPaymentOrder pattern
    let payload = {
      date: values.date || new Date().toLocaleDateString('en-CA'),
      debit_account_ledger: values.account_ledger,
      debit_account_id: values.account_id,
      office_id: values.office,
      vat_type: values.vatType,
    };

    // Include VAT percentage/terms only if any commission exists
    if (hasAnyCommission) {
      payload = {
        ...payload,
        ...(values.vat_terms_id && { vat_terms_id: values.vat_terms_id }),
        vat_terms_percentage: finalVatTermsPercentage,
        vat_terms_type: finalVatTermsType,
        vat_amount: values.vat_amount || 0,
      };
    }

    // Transform details array to flattened format following NewInwardPaymentOrder pattern
    const transformDetails = (row, index) => {
      return Object.entries({
        ref_no: row.refNo,
        pay_type: row.payType,
        walkin_id: row.walkInCustomerId,
        sender: row.sender,
        id_number: row.idNumber,
        contact_no: row.contactNo,
        currency_id: row.currency,
        fc_amount: row.fcAmount,
        commission: row.commission,
        pay_date: row.payDate,
        bank_name: row.bankName,
        bank_account: row.bankAc,
        narration: row.narration,
      }).reduce((acc, [key, value]) => {
        acc[`details[${index}][${key}]`] = value;
        return acc;
      }, {});
    };

    // Add flattened details to payload (only filled rows)
    filledRows.forEach((row, index) => {
      const flattenedRow = transformDetails(row, index);
      payload = { ...payload, ...flattenedRow };
    });

    // Add summary data to payload in the required format
    const summaryData = calculateSummaryData(values);
    summaryData.forEach((summaryRow, index) => {
      // Parse the formatted values back to numbers for database
      const total = parseFloat(summaryRow.total.replace(/,/g, '')) || 0;
      const commission = parseFloat(summaryRow.commission.replace(/,/g, '')) || 0;
      const vatAmount = parseFloat(summaryRow.vatAmount.replace(/,/g, '')) || 0;
      const netTotal = parseFloat(summaryRow.netTotal.replace(/,/g, '')) || 0;

      // Add required fields
      payload[`summary[${index}][currency_id]`] = summaryRow.currencyId;
      payload[`summary[${index}][total]`] = total;

      // Include commission if any commission is applied (normal or special)
      if (hasAnyCommission) {
        payload[`summary[${index}][commission]`] = commission;
      }

      payload[`summary[${index}][vat_amount]`] = vatAmount;
      payload[`summary[${index}][net_total]`] = netTotal;
    });

    // Add commission_amount or special_commission based on commission type
    if (
      hasSpecialCommission &&
      addedSpecialCommissionValues &&
      addedSpecialCommissionValues.transaction_no
    ) {
      // Special commission is applied - send special_commission[total_commission]
      const converted = {};
      const sc = {
        transaction_no:
          addedSpecialCommissionValues.transaction_no ||
          lastVoucherNumbers?.current ||
          '',
        date:
          addedSpecialCommissionValues.date ||
          new Date().toLocaleDateString('en-CA'),
        commission_type:
          addedSpecialCommissionValues.commission_type || 'Income',
        ledger:
          addedSpecialCommissionValues.ledger || values.account_ledger,
        account_id:
          addedSpecialCommissionValues.account_id || values.account_id,
        currency_id:
          addedSpecialCommissionValues.currency_id || filledRows[0]?.currency,
        amount: addedSpecialCommissionValues.amount || filledRows[0]?.fcAmount,
        description: addedSpecialCommissionValues.description || '',
        commission: addedSpecialCommissionValues.commission || 0,
        total_commission: addedSpecialCommissionValues.total_commission || 0,
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

      // Only add special commission if transaction_no is not empty
      if (sc.transaction_no && sc.transaction_no.trim() !== '') {
        payload = {
          ...payload,
          ...converted,
        };
      }
    } else if (hasNormalCommission) {
      // Normal commission is applied - send commission_amount
      const totalNormalCommission = Object.values(rows).reduce(
        (sum, r) => sum + (parseFloat(r.commission) || 0),
        0
      );
      payload = {
        ...payload,
        commission_amount: totalNormalCommission,
      };
    }
    // Call the update mutation
    updateInwardPaymentOrderMutation.mutate({
      id: searchTerm,
      formData: payload,
    });
  };

  // Release lock on unmount or cancel
  const releaseExecutedRef = useRef(false);
  const releaseTransactionMutation = useMutation({
    mutationFn: releaseTransaction,
  });
  const releaseLock = useCallback(() => {
    if (releaseExecutedRef.current) return;
    if (orderData?.data?.[0]?.id) {
      releaseTransactionMutation.mutate({
        transaction_type: voucherName,
        transaction_id: orderData.data[0].id,
      });
      releaseExecutedRef.current = true;
    }
  }, [orderData?.data?.[0]?.id]);

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
      // Pair released successfully
    },
    onError: (error) => {
      // Error releasing pair
    },
  });

  //pair id release
  const handlePairReleased = async () => {
    // Collect all unique pair_ids from current rows
    const pairIds = Object.values(rows)
      .map((row) => row?.currency)
      .filter((item) => item?.currency !== '');

    // Remove duplicates
    const uniquePairIds = [...new Set(pairIds)];

    // Release each pair_id
    uniquePairIds.forEach((pairId) => {
      pairReleasedMutation.mutate(pairId);
    });
  };

  const handleCancel = () => {
    // Release lock then navigate back
    releaseLock();
    setPageState('new');
  };

  // Helper function to check if a row has Special Commission applied
  const getRowSpecialCommissionStatus = useCallback((rowId) => {
    if (!addedSpecialCommissionValues) return false;

    // Check if the Special Commission is linked to this specific row
    const scCurrencyId = addedSpecialCommissionValues.currency_id;
    const row = Object.values(rows).find(r => r.id === rowId);

    return row && row.currency === scCurrencyId;
  }, [addedSpecialCommissionValues, rows]);

  // Recalculate special commission when FC amounts change (if special commission exists)
  useEffect(() => {
    if (!addedSpecialCommissionValues) return;

    // Calculate current FC amount for special commission currency
    const scCurrencyId = String(addedSpecialCommissionValues.currency_id || '');
    const validRows = Object.values(rows).filter((row) => {
      return row.currency && row.fcAmount && !isNaN(parseFloat(row.fcAmount));
    });

    const currentFcAmount = validRows
      .filter(row => String(row.currency || '') === scCurrencyId)
      .reduce((sum, row) => sum + (parseFloat(row.fcAmount) || 0), 0);

    // Recalculate special commission based on current FC amount
    const baseAmount = currentFcAmount;

    let newCommissionAmount = 0;
    // Check commission type case-insensitively
    const commissionType = (addedSpecialCommissionValues.commission_type || '').toLowerCase();
    if (commissionType === 'percentage') {
      const percentage = parseFloat(addedSpecialCommissionValues.commission) || 0;
      newCommissionAmount = (baseAmount * percentage) / 100;
    } else {
      // For fixed commission, keep the existing commission amount
      newCommissionAmount = parseFloat(addedSpecialCommissionValues.total_commission) || 0;
    }

    // Always update to ensure values are in sync with current rows
    // The check inside setState will prevent unnecessary re-renders
    setAddedSpecialCommissionValues(prev => {
      const currentAmount = parseFloat(prev?.amount || 0);
      const currentCommission = parseFloat(prev?.total_commission || 0);

      // Only update if values actually changed
      if (Math.abs(currentAmount - baseAmount) < 0.01 &&
        Math.abs(currentCommission - newCommissionAmount) < 0.01) {
        return prev; // No change needed, return previous to prevent re-render
      }

      // Values changed, update them
      return {
        ...prev,
        amount: baseAmount,
        total_commission: newCommissionAmount,
      };
    });
  }, [
    rows,
    addedSpecialCommissionValues?.currency_id,
    addedSpecialCommissionValues?.commission_type,
    addedSpecialCommissionValues?.commission
  ]);

  // Handler functions for rows
  const updateField = useCallback((id, field, value) => {
    setRows((prev) => {
      const newRows = {
        ...prev,
        [id]: {
          ...prev[id],
          [field]: value,
        },
      };

      return newRows;
    });

    // Check if the row has any meaningful data after this update
    const updatedRow = { ...rows[id], [field]: value };

    // Only consider important fields for determining if row has data
    const importantFields = [
      'payType', 'walkInCustomerId', 'currency', 'fcAmount',
      'payDate', 'bankName', 'bankAc'
    ];

    const hasAnyData = importantFields.some(key => {
      const val = updatedRow[key];
      return val !== undefined && val !== '' && val !== null && val !== 'null';
    });

    if (hasAnyData) {
      // Row has data - mark as touched and validate IMMEDIATELY
      setRowsTouched((prev) => ({
        ...prev,
        [id]: true,
      }));

      // Validate this row and show errors
      const currencyError = !updatedRow.currency || updatedRow.currency === '';
      const amountError = !updatedRow.fcAmount || isNaN(parseFloat(updatedRow.fcAmount));
      const beneficiaryError = !updatedRow.walkInCustomerId || updatedRow.walkInCustomerId === '';
      const payDateError = !updatedRow.payDate || updatedRow.payDate === '';

      const errors = {
        currency: currencyError,
        fcAmount: amountError,
        walkInCustomerId: beneficiaryError,
        payDate: payDateError,
      };

      // Clear error for the field that was just filled
      if (errors[field]) {
        errors[field] = undefined;
      }

      // Set errors immediately to ensure they show up
      setRowFieldErrors((prev) => ({
        ...prev,
        [id]: errors,
      }));

      // Also ensure touched state is set by using a separate effect
      setTimeout(() => {
        setRowsTouched((prev) => ({
          ...prev,
          [id]: true,
        }));
      }, 0);
    } else {
      // Row is completely empty - remove touched state and clear errors
      setRowsTouched((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });

      setRowFieldErrors((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  }, [rows]);

  const handleDeleteRow = (id) => {
    setRows((prevRows) => {
      const newState = { ...prevRows };
      delete newState[id];
      return newState;
    });
    // remove touched tracking for deleted row
    setRowsTouched((prev) => {
      const copy = { ...prev };
      if (copy[id]) delete copy[id];
      return copy;
    });

    // Recalculate special commission when a row is deleted
    if (addedSpecialCommissionValues) {
      const updatedRows = { ...rows };
      delete updatedRows[id];

      // Recalculate special commission based on remaining amounts
      const validRows = Object.values(updatedRows).filter((row) => {
        return row.currency && row.fcAmount && !isNaN(parseFloat(row.fcAmount));
      });

      // Group by currency and sum amounts
      const currencyGroups = validRows.reduce((acc, row) => {
        const currency = row.currency;
        const fcAmount = parseFloat(row.fcAmount) || 0;

        if (!acc[currency]) {
          acc[currency] = 0;
        }
        acc[currency] += fcAmount;
        return acc;
      }, {});

      const scCurrencyId = addedSpecialCommissionValues.currency_id;
      const baseAmount = currencyGroups[scCurrencyId] || 0;

      let newCommissionAmount = 0;
      // Check commission type case-insensitively
      const commissionType = (addedSpecialCommissionValues.commission_type || '').toLowerCase();
      if (commissionType === 'percentage') {
        const percentage = parseFloat(addedSpecialCommissionValues.commission) || 0;
        newCommissionAmount = (baseAmount * percentage) / 100;
      } else {
        // For fixed commission, keep the existing commission amount
        newCommissionAmount = parseFloat(addedSpecialCommissionValues.total_commission) || 0;
      }

      // Update the special commission values with new calculated amount
      setAddedSpecialCommissionValues(prev => ({
        ...prev,
        amount: baseAmount,
        total_commission: newCommissionAmount,
      }));
    }
  };

  // Walk-in modal logic (same as New)
  const handleOpenWalkinModal = (rowId) => {
    setWalkinModalRowId(rowId);
    setWalkinModal(true);
    setWalkinSearchTerm(rows[rowId]?.walkInCustomer || '');
  };
  const handleSelectWalkinCustomer = (customer) => {
    if (walkinModalRowId !== null && walkinModalRowId !== undefined) {
      setRows((prevRows) => ({
        ...prevRows,
        [walkinModalRowId]: {
          ...prevRows[walkinModalRowId],
          walkInCustomer: customer.customer_name,
          walkInCustomerId: customer.id,
        },
      }));
    }
    setWalkinModal(false);
    setWalkinModalRowId(null);
  };
  const handleCloseWalkinModal = () => {
    setWalkinModal(false);
    setWalkinModalRowId(null);
    setFilters({});
    setIsLoading(false);
    setIsError(false);
    setWalkinSearchTerm('');
  };

  // Special Commission modal handler (matching New page logic)
  const handleOpenSpecialCommissionModal = () => {
    // Only require Ledger/Account to open Special Commission
    const requiredFields = ['account_ledger', 'account_id'];
    const missingFields = requiredFields.filter(
      (field) => !formikRef.current.values[field]
    );
    if (missingFields.length > 0) {
      const touchedFields = {};
      requiredFields.forEach((field) => {
        touchedFields[field] = true;
      });
      formikRef.current.setTouched({
        ...formikRef.current.touched,
        ...touchedFields,
      });
      // Show field errors on Ledger and Account
      missingFields.forEach((field) => {
        if (field === 'account_ledger') {
          formikRef.current.setFieldError('account_ledger', 'Ledger is required');
        }
        if (field === 'account_id') {
          formikRef.current.setFieldError('account_id', 'Account is required');
        }
      });
      showToast('Please select Ledger and Account before Special Commission', 'error');
      return;
    }

    // Validate at least one row with Currency and FC Amount
    const validRows = Object.values(rows).filter((row) => {
      return row.currency && row.fcAmount && !isNaN(parseFloat(row.fcAmount));
    });
    if (validRows.length === 0) {
      showToast('Please add at least one row with Currency and FC Amount', 'error');
      return;
    }

    setShowSCModal(true);
  };

  // Special Commission navigation handler
  const handleNavigateToSpecialCommissionPage = () => {
    // Check if required fields are filled
    const requiredFields = [
      'account_ledger',
      'account_id',
      'office',
      'vatType',
    ];
    const missingFields = requiredFields.filter(
      (field) => !formikRef.current.values[field]
    );
    if (missingFields.length > 0) {
      const touchedFields = {};
      requiredFields.forEach((field) => {
        touchedFields[field] = true;
      });
      formikRef.current.setTouched({
        ...formikRef.current.touched,
        ...touchedFields,
      });
      showToast(
        'Please fill all required fields before adding Special Commission',
        'error'
      );
      return;
    }
    // Get the first valid row for Special Commission
    const validRows = Object.values(rows).filter((row) => {
      return row.currency && row.fcAmount && !isNaN(parseFloat(row.fcAmount));
    });
    if (validRows.length === 0) {
      showToast(
        'Please add at least one valid row with currency and amount',
        'error'
      );
      return;
    }
    const firstValidRow = validRows[0];

    // Save current form state before navigating
    if (formikRef.current) {
      saveFormValues(formId, {
        values: formikRef.current.values,
        rows: rows,
      });
      setLastVisitedPage(formId, 'special-commission');
    }

    // Prepare Special Commission values
    const scValues = {
      date: new Date().toLocaleDateString('en-CA'),
      current: lastVoucherNumbers?.current,
      transaction_no: lastVoucherNumbers?.current,
      commission_type:
        addedSpecialCommissionValues?.commission_type || 'Income',
      ledger:
        ledgerOptions.find(
          (x) => x.value === formikRef.current.values.account_ledger
        )?.label || '',
      account:
        getAccountsByTypeOptions(formikRef.current.values.account_ledger)?.find(
          (x) => x.value === formikRef.current.values.account_id
        )?.label || '',
      currency:
        currencyOptions?.find((x) => x.value === firstValidRow.currency)
          ?.label || '',
      amount: firstValidRow.fcAmount,
      currency_id: firstValidRow.currency,
    };

    navigate('/transactions/special-commission', {
      state: {
        fromPage: formId,
        values: {
          ...scValues,
          current: lastVoucherNumbers?.current,
          isEdit: !!addedSpecialCommissionValues,
          amount: firstValidRow.fcAmount,
          currency_id: firstValidRow.currency,
        },
      },
    });
  };

  return (
    <>
      <div className="d-card">
        <Formik
          innerRef={formikRef}
          initialValues={{
            account_ledger: newlyCreatedAccount?.debitLedger || 'general',
            account_id: newlyCreatedAccount?.debitAccount || '',
            office: newlyCreatedAccount?.office || '',
            vatType: newlyCreatedAccount?.vatType || 'absorb',
            vat_terms: '',
            vat_terms_id: '',
            vat_terms_percentage: 0,
            vat_terms_type: '',
          }}
          validate={(values) => {
            const errors = {};

            // Ledger validation - must be selected first
            if (!values.account_ledger) {
              errors.account_ledger = 'Ledger is required';
            }

            // Account validation - only required if ledger is selected
            if (values.account_ledger && !values.account_id) {
              errors.account_id = 'Account is required';
            }

            // VAT Type validation - only required when commission is applied
            const hasAnyCommission = addedSpecialCommissionValues ||
              Object.values(rows).some(r => parseFloat(r.commission) > 0);

            if (hasAnyCommission && !values.vatType) {
              errors.vatType = 'VAT Type is required when commission is applied';
            }

            // VAT validation when commission is applied
            if (hasAnyCommission) {
              if (vatType?.vat_type === 'variable') {
                if (!values.vat_terms_id) {
                  errors.vat_terms_id = 'VAT % is required';
                }
                // VAT Amount validation
                if (values.vat_amount === '' || values.vat_amount === null || values.vat_amount === undefined) {
                  errors.vat_amount = 'VAT Amount is required';
                }
              }
            }

            return errors;
          }}
          onSubmit={handleSubmit}
        >
          {({ values, handleChange, handleBlur, setFieldValue, errors }) => {
            // VAT calculation effect (matching New page logic)
            useEffect(() => {
              if (isRestoringRef.current) return; // Skip during restoration

              // Calculate total commission from rows and special commission
              const rowCommissionTotal = Object.values(rows).reduce(
                (sum, r) => sum + (parseFloat(r.commission) || 0),
                0
              );
              const specialCommissionTotal = addedSpecialCommissionValues
                ? parseFloat(addedSpecialCommissionValues.total_commission) || 0
                : 0;
              const totalCommission = rowCommissionTotal + specialCommissionTotal;

              if (totalCommission > 0) {
                // Determine VAT percentage (matching New page logic)
                let vatPercentage = 0;
                if (values.vat_terms_type === 'fixed') {
                  vatPercentage = Number(values.vat_terms_percentage) || Number(vatType?.vat_percentage) || 0;
                } else if (values.vat_terms_type === 'variable') {
                  vatPercentage = parseFloat(values.vat_terms) || 0;
                }

                // Only calculate VAT if not out of scope
                if (!outOfScope) {
                  const vatAmount = totalCommission * (vatPercentage / 100);
                  setFieldValue('vat_amount', vatAmount);
                  setCurrentVatPercentage(vatPercentage);
                } else {
                  setFieldValue('vat_amount', 0);
                  setCurrentVatPercentage(0);
                }
              } else {
                setFieldValue('vat_amount', 0);
                setCurrentVatPercentage(0);
              }
            }, [
              values.vat_terms,
              values.vat_terms_type,
              values.vat_terms_percentage,
              rows,
              setFieldValue,
              outOfScope,
              addedSpecialCommissionValues,
              vatType,
            ]);

            // Remove automatic Account validation - only show on Save click

            // Remove automatic first row validation - table validation should only show on Save click

            return (
              <Form>
                <div className="row mb-4">
                  <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
                    <div className="row">
                      {/* Debit Account Section (CombinedInputs) */}
                      <div className="col-12 col-xl-6">
                        <div className="row">
                          <div className="col-12 mb-45">
                            <CombinedInputs
                              label="Ledger"
                              type1="select"
                              type2="select"
                              name1="account_ledger"
                              name2="account_id"
                              value1={values.account_ledger}
                              value2={values.account_id}
                              options1={ledgerOptions}
                              options2={getAccountsByTypeOptions(
                                values.account_ledger
                              )}
                              handleBlur={handleBlur}
                              placeholder1="Ledger"
                              placeholder2="Select Account"
                              className1="ledger"
                              className2="account"
                              isDisabled={isDisabled}
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
                                  setFieldValue('account_id', '');
                                  // Reset selected ledger account to hide balance card when ledger changes
                                  setSelectedLedgerAccount(null);
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
                                  // Set selected ledger account for balance card display
                                  setSelectedLedgerAccount({
                                    value: selected.value,
                                    label: selected.label,
                                    accountType: values.account_ledger,
                                  });
                                }
                              }}
                            />
                            <ErrorMessage
                              name="account_ledger"
                              component="div"
                              className="input-error-message text-danger"
                            />
                            <ErrorMessage
                              name="account_id"
                              component="div"
                              className="input-error-message text-danger"
                            />
                          </div>
                        </div>
                      </div>
                      {/* Credit Account Section replaced with Office and VAT Type */}
                      <div className="col-12 col-sm-6 mb-45">
                        <SearchableSelect
                          name={'office'}
                          label={'Office'}
                          options={
                            isLoadingOffices
                              ? [
                                {
                                  label: 'Loading...',
                                  value: null,
                                  isDisabled: true,
                                },
                              ]
                              : Array.isArray(officeLocations)
                                ? officeLocations.map((office) => ({
                                  label:
                                    office.office_location ||
                                    office.office_location,
                                  value: office.id,
                                }))
                                : []
                          }
                          isDisabled={isLoadingOffices || isDisabled}
                          placeholder={'Select Office'}
                          value={values.office}
                          onChange={(selected) => {
                            setFieldValue('office', selected.value);
                          }}
                          onBlur={handleBlur}
                        />
                      </div>
                      {/* VAT Type Dropdown */}
                      <div className="col-12 col-sm-6 mb-45">
                        <SearchableSelect
                          name={'vatType'}
                          label={'VAT Type'}
                          options={
                            isLoadingVatType
                              ? [
                                {
                                  label: 'Loading...',
                                  value: '',
                                  isDisabled: true,
                                },
                              ]
                              : [
                                { label: 'Charge', value: 'charge' },
                                { label: 'Absorb', value: 'absorb' },
                              ]
                          }
                          isDisabled={isLoadingVatType || isDisabled}
                          placeholder={'Select VAT Type'}
                          value={values.vatType}
                          onChange={(selected) => {
                            setFieldValue('vatType', selected.value);
                            setFieldValue('vat_terms_id', '');
                            setFieldValue('vat_terms', '');
                          }}
                          onBlur={handleBlur}
                        />
                      </div>
                      {vatType?.vat_type === 'variable' && (
                        <div className="col-12 col-sm-6 mb-45">
                          <SearchableSelect
                            name={'vat_terms'}
                            label={'VAT %'}
                            options={getVATTermsOptions()}
                            isDisabled={isLoadingVatType || isDisabled}
                            placeholder={'Select VAT %'}
                            value={values.vat_terms_id}
                            onChange={(selected) => {
                              if (selected.label.startsWith('Out of Scope')) {
                                setShowOutOfScopeModal(true);
                                // Persist Out of Scope as a valid selection with 0%
                                setFieldValue('vat_terms_id', selected.value);
                                setFieldValue('vat_terms', 0);
                              }
                              else {
                                setFieldValue('vat_terms_id', selected.value);
                                setFieldValue(
                                  'vat_terms',
                                  parseFloat(selected.percentage)
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
                            disabled={true}
                            placeholder={'Enter VAT Percentage'}
                            value={
                              values.vat_terms_percentage
                                ? `${values.vat_terms_percentage}%`
                                : vatType.vat_percentage
                                  ? `${vatType.vat_percentage}%`
                                  : ''
                            }
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                          <ErrorMessage
                            name="vat_amount"
                            component="div"
                            className="input-error-message text-danger"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-12 col-xxl-2" />

                  <div className="col-12 col-lg-10 col-xl-9 col-xxl-3">
                    {selectedLedgerAccount &&
                      getAccountBalanceSettings('inward_payment_order') && (
                        <div className="row">
                          <div className="col-12 mb-5" style={{ maxWidth: '350px' }}>

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
                        </div>
                      )}
                  </div>

                  <div className="col-12">
                    <CustomTable
                      displayCard={false}
                      headers={inwardPaymentOrderNewHeaders}
                      isPaginated={false}
                      className={'inputTable'}
                      hideSearch
                      hideItemsPerPage
                    >
                      <tbody>
                        {Object.values(rows).map((row, index) => (
                          <InwardPaymentOrderRow
                            key={index}
                            row={row}
                            index={index}
                            isDisabled={isDisabled}
                            handleDeleteRow={handleDeleteRow}
                            updateField={updateField}
                            setCurrencyToSelect={setCurrencyToSelect}
                            setSelectedCurrency={setSelectedCurrency}
                            setHasShownMissingRateModal={setHasShownMissingRateModal}
                            currencyOptions={currencyOptions || []}
                            selectedLedgerAccount={selectedLedgerAccount}
                            formId="edit_inward_payment_order"
                            onOpenWalkinModal={handleOpenWalkinModal}
                            walkInCustomersData={walkInCustomersData}
                            walkinModal={walkinModal}
                            handleSelectWalkinCustomer={
                              handleSelectWalkinCustomer
                            }
                            handleCloseWalkinModal={handleCloseWalkinModal}
                            walkinSearchTerm={walkinSearchTerm}
                            hasSpecialCommission={!!addedSpecialCommissionValues}
                            fieldErrors={rowFieldErrors[row.id] || {}}
                            forceShowErrors={!!rowsTouched[row.id]}
                            setWalkinSearchTerm={setWalkinSearchTerm}
                            isLoading={isLoading}
                            isError={isError}
                            setIsLoading={setIsLoading}
                            setIsError={setIsError}
                            setFilters={setFilters}
                            filters={filters}
                            setIsWalkinModal={setWalkinModal}
                          />
                        ))}
                      </tbody>
                    </CustomTable>
                    <div className="my-3">
                      <CustomButton
                        text={
                          addedSpecialCommissionValues
                            ? 'Edit Special Commission'
                            : 'Add Special Commission'
                        }
                        variant="secondary"
                        type="button"
                        className="w-auto px-5"
                        disabled={
                          isDisabled ||
                          !values.account_ledger ||
                          !values.account_id ||
                          !Object.values(rows).some(
                            (r) => r.currency && r.fcAmount && !isNaN(parseFloat(r.fcAmount))
                          )
                        }
                        onClick={handleOpenSpecialCommissionModal}
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
                        {formatNumberForDisplay(addedSpecialCommissionValues?.commission, 2)}
                        %{' '}
                        {addedSpecialCommissionValues?.commission_type?.toLowerCase() ===
                          'income'
                          ? 'receivable'
                          : 'payable'}{' '}
                        commission of{' '}
                        {currencyOptions?.find(
                          (x) =>
                            x.value ==
                            (addedSpecialCommissionValues.currency_id ||
                              values.currency_id)
                        )?.label || ''}{' '}
                        {formatNumberForDisplay(
                          addedSpecialCommissionValues?.total_commission,
                          2
                        )}{' '}
                        on{' '}
                        {currencyOptions?.find(
                          (x) =>
                            x.value ==
                            (addedSpecialCommissionValues.currency_id ||
                              values.currency_id)
                        )?.label || ''}{' '}
                        {Number(
                          addedSpecialCommissionValues?.amount || 0
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    ) : null}
                    <div className="d-flex flex-column mt-3 mb-5">

                      <CustomCheckbox
                        label="Account Balance"
                        checked={getAccountBalanceSettings(
                          'inward_payment_order'
                        )}
                        disabled={isDisabled}
                        style={{ border: 'none', margin: 0 }}
                        onChange={(e) => {
                          updateAccountBalanceSetting(
                            'inward_payment_order',
                            e.target.checked
                          );
                        }}
                      />
                      {hasPrintPermission && (
                        <CustomCheckbox
                          label="Print"
                          checked={getPrintSettings('inward_payment_order')}
                          onChange={(e) =>
                            updatePrintSetting(
                              'inward_payment_order',
                              e.target.checked
                            )
                          }
                          style={{ border: 'none', margin: 0 }}
                          readOnly={isDisabled}
                        />
                      )}



                    </div>
                    {/* Show summary table only if there are values */}
                    {calculateSummaryData(values).length > 0 && (
                      <div className="mt-4" key={`summary-${addedSpecialCommissionValues?.total_commission || 0}-${Object.values(rows).reduce((sum, r) => sum + (parseFloat(r.fcAmount) || 0), 0)}`}>
                        <CustomTable
                          displayCard={false}
                          headers={SUMMARY_TABLE_HEADERS}
                          data={calculateSummaryData(values)}
                          isPaginated={false}
                          hideSearch
                          hideItemsPerPage
                        >
                          <tbody>
                            {calculateSummaryData(values).map((row, index) => (
                              <tr key={`${row.currencyId}-${index}-${addedSpecialCommissionValues?.total_commission || 0}`}>
                                <td>{row.currency}</td>
                                <td>{formatNumberForDisplay(row.total, 2)}</td>
                                <td>{formatNumberForDisplay(row.totalCommission, 2)}</td>
                                <td>{formatNumberForDisplay(row.vatAmount, 2)}</td>
                                <td>{formatNumberForDisplay(row.netTotal, 2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </CustomTable>
                      </div>
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
          { text: 'Add Rows', onClick: handleAddRows, disabled: isDisabled },
          {
            text: 'Update',
            onClick: handleSubmit,
            disabled: isDisabled,
            loading: isLoadingLockStatus,
          },
          { text: 'Cancel', onClick: handleCancel, variant: 'secondaryButton' },
        ]}
        loading={updateInwardPaymentOrderMutation.isPending}
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
          item={orderData?.data?.[0]}
          deleteService={deleteInwardPaymentOrderAttachment}
          uploadService={addInwardPaymentOrderAttachment}
          closeUploader={() => setShowAttachmentsModal(false)}
          voucherAttachment={true}
          queryToInvalidate={['inwardPaymentOrder', searchTerm]}
        />
      </CustomModal>

      {/* Out of Scope Modal */}
      <CustomModal
        show={showOutOfScopeModal}
        close={() => setShowOutOfScopeModal(false)}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle">Out of Scope Reason</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{
              reason: '',
            }}
            onSubmit={handleVatOutOfScope}
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form>
                <div className="mb-45">
                  <CustomInput
                    label="Reason"
                    name="reason"
                    required
                    id="reason"
                    type="textarea"
                    rows={1}
                    placeholder="Enter reason"
                    value={values.reason}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.reason && errors.reason}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  <CustomButton type="submit" text={'Save'} />
                  <CustomButton
                    variant={'secondaryButton'}
                    text={'Cancel'}
                    type={'button'}
                    onClick={() => setShowOutOfScopeModal(false)}
                  />
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </CustomModal>

      {/* Walk-in Modal */}
      <CustomModal
        show={walkinModal}
        close={handleCloseWalkinModal}
        background={true}
        size="xl"
      >
        <section>
          <h2 className="screen-title mb-3">Walk-in Customer Search</h2>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            showFilterBorders={true}
            headers={walkInHeaders}
            isPaginated={false}
            hideItemsPerPage={true}
            isLoading={isLoading}
          >
            {(walkInCustomersData?.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={walkInHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch Walk-in customers at this time
                      </p>
                    </td>
                  </tr>
                )}
                {walkInCustomersData
                  ?.filter(
                    (item) =>
                      !filters.search ||
                      (item.customer_name || '')
                        .toLowerCase()
                        .includes(filters.search.toLowerCase())
                  )
                  .map((item) => (
                    <tr
                      key={item.id}
                      style={{ cursor: 'pointer' }}
                      className="table-row-hover"
                      onClick={() => handleSelectWalkinCustomer(item)}
                    >
                      <td>{item.customer_name}</td>
                      <td>{item.address}</td>
                      <td>{item?.telephone_number_full}</td>
                      <td>{item.mobile_number_full}</td>
                      <td>{item.nationality?.name}</td>
                      <td>{item?.id_type?.description}</td>
                      <td>{item.id_number}</td>
                      <td>{formatDate(item.expiry_date)}</td>
                    </tr>
                  ))}
              </tbody>
            )}
          </CustomTable>
        </section>
      </CustomModal>

      {/* Special Commission Modal */}
      <CustomModal
        show={showSCModal}
        close={() => setShowSCModal(false)}
        size="xl"
        closeOnOutsideClick={false}
      >
        <SpecialCommission
          preFilledValues={(() => {
            const firstValidRow = Object.values(rows).find((row) => {
              return row.currency && row.fcAmount && !isNaN(parseFloat(row.fcAmount));
            });

            // If editing existing Special Commission, use its currency
            // Otherwise, use the first valid row's currency
            const selectedCurrency = addedSpecialCommissionValues?.currency_id
              ? currencyOptions?.find(c => c.value === addedSpecialCommissionValues.currency_id)
              : currencyOptions?.find(c => c.value === firstValidRow?.currency);

            const preFilledData = {
              date: addedSpecialCommissionValues?.date || new Date().toLocaleDateString('en-CA'),
              transaction_no: addedSpecialCommissionValues?.transaction_no || lastVoucherNumbers?.current || lastVoucherNumbers?.last || '',
              commission_type: addedSpecialCommissionValues?.commission_type || 'Income',
              ledger: {
                value: addedSpecialCommissionValues?.ledger || formikRef?.current?.values.account_ledger || '',
                label: addedSpecialCommissionValues?.ledger_name || ledgerOptions.find(
                  (x) => x.value === (addedSpecialCommissionValues?.ledger || formikRef?.current?.values.account_ledger)
                )?.label || ''
              },
              ledger_name: addedSpecialCommissionValues?.ledger_name || ledgerOptions.find(
                (x) => x.value === (addedSpecialCommissionValues?.ledger || formikRef?.current?.values.account_ledger)
              )?.label || '',
              account: {
                value: addedSpecialCommissionValues?.account_id || formikRef?.current?.values.account_id || '',
                label: addedSpecialCommissionValues?.account || getAccountsByTypeOptions(formikRef?.current?.values.account_ledger).find(
                  (x) => x.value === formikRef?.current?.values.account_id
                )?.label || ''
              },
              account_id: addedSpecialCommissionValues?.account_id || formikRef?.current?.values.account_id || '',
              currency: selectedCurrency || '',
              currency_id: addedSpecialCommissionValues?.currency_id || firstValidRow?.currency || '',
              amount: addedSpecialCommissionValues?.amount || firstValidRow?.fcAmount || 0,
              commission: addedSpecialCommissionValues?.commission || 0,
              total_commission: addedSpecialCommissionValues?.total_commission || 0,
              description: addedSpecialCommissionValues?.description || '',
              distributions: addedSpecialCommissionValues?.distributions || [],
            };

            return preFilledData;
          })()}
          sCValues={addedSpecialCommissionValues}
          isEdit={!!addedSpecialCommissionValues}
          availableCurrencies={(() => {
            const currenciesFromRows = {};
            Object.values(rows).forEach(row => {
              if (row.currency && row.fcAmount && !isNaN(parseFloat(row.fcAmount))) {
                const currency = currencyOptions?.find(c => c.value === row.currency);
                if (currency) {
                  currenciesFromRows[row.currency] = {
                    ...currency,
                    amount: parseFloat(row.fcAmount) || 0,
                    rowId: row.id
                  };
                }
              }
            });
            return Object.values(currenciesFromRows);
          })()}
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

      {/* Missing Currency Rate Modal (following Receipt Voucher pattern) */}
      <CustomModal
        show={showMissingCurrencyRateModal}
        close={() => setShowMissingCurrencyRateModal(false)}
        title={'Missing Rate of Exchange'}
        description={'Rate of exchange is missing for selected currency.'}
        variant={'error'}
        btn1Text={'Update Rate of Exchange'}
        action={() => {
          // Save form data before navigation (following Receipt Voucher pattern)
          if (formikRef.current) {
            saveFormValues('edit-inward-payment-order', {
              values: formikRef.current.values,
              rows,
              addedSpecialCommissionValues,
              date: new Date().toLocaleDateString('en-CA'),
            });
            setLastVisitedPage(formId, 'rate-of-exchange');
          }
          navigate('/transactions/remittance-rate-of-exchange', {
            state: { currencyToSelect },
          });
        }}
      />
    </>
  );
};

export default EditInwardPaymentOrder;
