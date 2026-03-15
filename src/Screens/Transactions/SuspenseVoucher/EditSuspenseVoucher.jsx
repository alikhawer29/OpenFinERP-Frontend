import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountBalanceCard from '../../../Components/AccountBalanceCard/AccountBalanceCard';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CombinedInputs from '../../../Components/CombinedInputs/CombinedInputs';
import CustomCheckbox from '../../../Components/CustomCheckbox/CustomCheckbox';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import useCurrencyRate from '../../../Hooks/useCurrencyRate';
import {
  addSuspenseVoucherAttachment,
  deleteSuspenseVoucherAttachment,
  getSuspenseVoucherAttachments,
  getSuspenseVoucherListing,
  updateSuspenseVoucher,
} from '../../../Services/Transaction/SuspenseVoucher';
import useFormStore from '../../../Stores/FormStore';
import useSettingsStore from '../../../Stores/SettingsStore';
import { suspenseVoucherNewHeaders } from '../../../Utils/Constants/TableHeaders';
import { formatNumberForDisplay, showErrorToast } from '../../../Utils/Utils';
import {
  checkTransactionLockStatus,
  releaseTransaction,
} from '../../../Services/Process/TransactionLock.js';
import { getAccountBalances, pairReleased } from '../../../Services/General';
import SuspenseVoucherRow from './SuspenseVoucherRow';

const generateInitialRows = (transactions = []) => {
  const rows = {};
  if (transactions.length > 0) {
    transactions.forEach((transaction) => {
      const id = crypto.randomUUID();
      rows[id] = {
        id,
        narration: transaction.narration || '',
        debit: transaction.debit?.toString() || '',
        credit: transaction.credit?.toString() || '',
        status: transaction.status,
      };
    });
  } else {
    // Fallback to empty rows if no transactions
    Array.from({ length: 5 }).forEach(() => {
      const id = crypto.randomUUID();
      rows[id] = {
        id,
        narration: '',
        debit: '',
        credit: '',
        status: 'open',
      };
    });
  }
  return rows;
};

const EditSuspenseVoucher = ({
  date,
  setDate,
  currencyOptions,
  getAccountsByTypeOptions,
  getOfficeLocationOptions,
  setPageState,
  setShowAddOfficeLocationModal,
  setShowAddLedgerModal,
  newlyCreatedAccount,
  lastVoucherNumbers,
  setSearchTerm,
  searchTerm,
  updatePrintSetting,
  isDisabled = false,
  setIsDisabled,
  // Missing Rate of Exchange props 
  // 
  setCurrencyToSelect,
  setShowMissingCurrencyRateModal,
  restoreValuesFromStore,
  permissions,
  hasViewPermission,
  hasPrintPermission,
}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [rows, setRows] = useState({});
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState(null);
  const [rowErrors, setRowErrors] = useState({});
  const formikRef = useRef();

  // Missing Rate of Exchange state variables 
  // 
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [hasShownModal, setHasShownModal] = useState(false);

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
  const formId = 'edit-suspense-voucher'; // Unique identifier for this form

  // For getting print checkbox state from BE
  const { getPrintSettings, getAccountBalanceSettings, updateAccountBalanceSetting } = useSettingsStore();

  // Fetch currency rate for the selected Currency 
  // 
  const { data: currencyRate, isLoading: isLoadingCurrencyRate } =
    useCurrencyRate(selectedCurrency, date);

  // Account balances for selected ledger account 
  // 
  const { data: ledgerAccountBalance } = useQuery({
    queryKey: ['accountBalance', selectedLedgerAccount?.value],
    queryFn: () =>
      getAccountBalances(
        selectedLedgerAccount.value,
        selectedLedgerAccount.accountType
      ),
    enabled:
      !!selectedLedgerAccount?.value &&
      (getAccountBalanceSettings('suspense_voucher') || getAccountBalanceSettings('receipt_voucher')),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

  // State to track original data for change detection
  const [originalFormData, setOriginalFormData] = useState(null);
  const [originalRows, setOriginalRows] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [originalStatus, setOriginalStatus] = useState(null);

  // Attachment modal state - matching Journal Voucher pattern
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);

  // Fetch suspense voucher data directly - matching Journal Voucher pattern
  const {
    data: { data: [suspenseVoucherData] = [] } = {},
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['suspenseVoucher', searchTerm],
    queryFn: () => getSuspenseVoucherListing({ search: searchTerm }),
  });

  const suspenseVoucher = suspenseVoucherData?.suspense_vouchers;
  const voucherName = 'suspense_voucher';

  // Check Transaction lock status to enable/disable Save
  const { isLoading: isLoadingLockStatus, refetch: checkFormStatus } = useQuery(
    {
      queryKey: ['save_lock_status', voucherName, suspenseVoucherData?.id],
      queryFn: () =>
        checkTransactionLockStatus({
          transaction_type: voucherName,
          transaction_id: suspenseVoucherData?.id,
        }),
      enabled: false,
      retry: false,
    }
  );

  // Release lock on unmount or cancel
  const releaseExecutedRef = useRef(false);
  const releaseTransactionMutation = useMutation({
    mutationFn: releaseTransaction,
  });
  const releaseLock = useCallback(() => {
    if (releaseExecutedRef.current) return;
    if (suspenseVoucherData?.id) {
      releaseTransactionMutation.mutate({
        transaction_type: voucherName,
        transaction_id: suspenseVoucherData?.id,
      });
      releaseExecutedRef.current = true;
    }
  }, [suspenseVoucherData?.id]);

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

  // Initialize rows when suspenseVoucherData changes
  useEffect(() => {
    if (suspenseVoucher) {
      // Transform the API data structure to match the expected format
      const transformedData = {
        id: suspenseVoucher.id,
        ledger: suspenseVoucher.ledger,
        account_id: suspenseVoucher.account_id,
        office_id: suspenseVoucher.office?.id,
        currency_id: suspenseVoucher.currency?.id,
        date: suspenseVoucher.voucher_date,
        transactions:
          suspenseVoucher.suspense_voucher_rows?.map((row) => ({
            narration: row.narration,
            debit: row.debit,
            credit: row.credit,
            status: row.status_detail,
          })) || [],
      };

      const initialRows = generateInitialRows(transformedData.transactions);
      setRows(initialRows);
      setSelectedLedger(transformedData.ledger);

      // Set selectedLedgerAccount for account balance card (Edit page should show balance immediately)
      if (suspenseVoucher.ledger && suspenseVoucher.account_id) {
        const accountOptions = getAccountsByTypeOptions(suspenseVoucher.ledger);
        const accountOption = accountOptions.find((x) => x.value === suspenseVoucher.account_id);

        if (accountOption) {
          setSelectedLedgerAccount({
            value: accountOption.value,
            label: accountOption.label,
            accountType: suspenseVoucher.ledger
          });

        } else {
          // If account option not found, create a basic one
          setSelectedLedgerAccount({
            value: suspenseVoucher.account_id,
            label: `Account ${suspenseVoucher.account_id}`,
            accountType: suspenseVoucher.ledger
          });

        }
      } else {
        console.log('');
      }

      // Store original data for change detection
      setOriginalFormData({
        ledger: suspenseVoucher.ledger || '',
        account: suspenseVoucher.account_id?.toString() || '',
        currency: suspenseVoucher.currency?.id?.toString() || '',
      });
      setOriginalRows(initialRows);
      setOriginalStatus(suspenseVoucher.status_detail);
      setHasChanges(false);
    }
  }, [suspenseVoucher]);

  // Refresh form data when suspenseVoucherData changes (e.g., after update)
  useEffect(() => {
    if (suspenseVoucher && formikRef.current) {
      // Reset form with updated data
      formikRef.current.setValues({
        ledger: suspenseVoucher.ledger || '',
        account: suspenseVoucher.account_id?.toString() || '',
        office: suspenseVoucher.office?.id?.toString() || '',
        currency: suspenseVoucher.currency || suspenseVoucher.currency_id || suspenseVoucher.currency?.id?.toString() || '',
      });

      // Update selected ledger
      setSelectedLedger(suspenseVoucher.ledger);

      // Set selectedLedgerAccount for account balance card (Edit page should show balance immediately)
      if (suspenseVoucher.ledger && suspenseVoucher.account_id) {
        const accountOptions = getAccountsByTypeOptions(suspenseVoucher.ledger);
        const accountOption = accountOptions.find((x) => x.value === suspenseVoucher.account_id);
        if (accountOption) {
          setSelectedLedgerAccount({
            value: accountOption.value,
            label: accountOption.label,
            accountType: suspenseVoucher.ledger
          });
        }
      }

      // Update original data for change detection
      setOriginalFormData({
        ledger: suspenseVoucher.ledger || '',
        account: suspenseVoucher.account_id?.toString() || '',
        currency: suspenseVoucher.currency?.id?.toString() || '',
      });
      setOriginalStatus(suspenseVoucher.status_detail);
      setHasChanges(false);
    }
  }, [suspenseVoucher]);

  // Additional useEffect to handle form initialization when data is loaded
  useEffect(() => {
    if (suspenseVoucher && formikRef.current) {
      // Force update form values
      const newValues = {
        ledger: suspenseVoucher.ledger || '',
        account: suspenseVoucher.account_id?.toString() || '',
        office: suspenseVoucher.office?.id?.toString() || '',
        currency: suspenseVoucher.currency?.id?.toString() || '',
      };

      formikRef.current.setValues(newValues);
      setSelectedLedger(suspenseVoucher.ledger);
    }
  }, [suspenseVoucher]);

  // Calculate totals whenever rows change
  React.useEffect(() => {
    const debitTotal = Object.values(rows).reduce((sum, row) => {
      return sum + (parseFloat(row.debit) || 0);
    }, 0);
    const creditTotal = Object.values(rows).reduce((sum, row) => {
      return sum + (parseFloat(row.credit) || 0);
    }, 0);
    setTotalDebit(debitTotal);
    setTotalCredit(creditTotal);
  }, [rows]);

  // Handle navigation to Missing Rate of Exchange page 
  const handleNavigateToMissingRatePage = () => {
    // Save form data before navigating
    if (formikRef.current && !isDisabled) {
      const dataToSave = {
        values: formikRef.current.values,
        rows,
        date,
      };
      saveFormValues(formId, dataToSave);
      setLastVisitedPage(formId, 'rate-of-exchange');
    }

    navigate('/transactions/remittance-rate-of-exchange', {
      state: {
        fromPage: 'edit-suspense-voucher',
        currencyToSelect: selectedCurrency,
        date: date,
      },
    });
  };

  // Missing Rate of Exchange modal logic 
  // 
  useEffect(() => {
    if (
      selectedCurrency &&
      !isLoadingCurrencyRate &&
      (currencyRate === null || currencyRate === undefined || (currencyRate && !currencyRate?.rate)) &&
      !hasShownModal
    ) {
      // Save form data before showing modal
      if (formikRef.current && !isDisabled) {
        const dataToSave = {
          values: formikRef.current.values,
          rows,
          searchTerm, // Save search term to restore voucher data
          date,
        };
        saveFormValues(formId, dataToSave);
      }

      formikRef.current.setFieldValue('currency', '');
      setCurrencyToSelect(selectedCurrency);
      setShowMissingCurrencyRateModal(true);
      setHasShownModal(true);
    }
  }, [selectedCurrency, currencyRate, hasShownModal, isLoadingCurrencyRate]);

  // Load saved form if returning from Missing Rate of Exchange page 
  // 
  useEffect(() => {
    const lastPage = getLastVisitedPage(formId);

    if (
      lastPage === 'rate-of-exchange' &&
      hasFormValues(formId) &&
      formikRef.current
    ) {
      const savedFormData = getFormValues(formId);

      if (savedFormData) {
        const savedValues = savedFormData.values || {};

        // Note: searchTerm and date are restored by parent component
        // We only restore form-specific data here

        // Restore account options properly 
        // 
        if (savedValues.ledger && savedValues.account) {
          const ledgerOption = [
            { label: 'PL', value: 'party' },
            { label: 'GL', value: 'general' },
            { label: 'WIC', value: 'walkin' },
          ].find((x) => savedValues.ledger === x.value);

          if (ledgerOption) {
            setSelectedLedger(ledgerOption.value);
            const accountOption = getAccountsByTypeOptions(ledgerOption.value)
              .find((x) => x.value === savedValues.account);
            if (accountOption) {
              setSelectedLedgerAccount({
                value: accountOption.value,
                label: accountOption.label,
                accountType: ledgerOption.value
              });
            }
          }
        }

        // Restore currency option and set selectedCurrency state
        if (savedValues.currency) {
          const currencyOption = currencyOptions.find((x) => x.value === savedValues.currency);
          if (currencyOption) {
            setSelectedCurrency(savedValues.currency);
          }
        }

        formikRef.current.setValues(savedValues);
        setRows(savedFormData.rows || {});
        clearFormValues(formId);
        clearLastVisitedPage(formId);
      }
    }
  }, []);

  // Restore form data from store for Rate of Exchange flow 
  // 
  useEffect(() => {
    if (restoreValuesFromStore) {
      const savedFormData = getFormValues(formId);
      if (savedFormData && formikRef.current) {
        const savedValues = savedFormData.values || {};

        // Don't restore date here as it's already handled by parent component
        // The parent component sets the date and passes it as a prop

        // Restore account options properly 
        // 
        if (savedValues.ledger && savedValues.account) {
          const ledgerOption = [
            { label: 'PL', value: 'party' },
            { label: 'GL', value: 'general' },
            { label: 'WIC', value: 'walkin' },
          ].find((x) => savedValues.ledger === x.value);

          if (ledgerOption) {
            setSelectedLedger(ledgerOption.value);
            const accountOption = getAccountsByTypeOptions(ledgerOption.value)
              .find((x) => x.value === savedValues.account);
            if (accountOption) {
              setSelectedLedgerAccount({
                value: accountOption.value,
                label: accountOption.label,
                accountType: ledgerOption.value
              });
            }
          }
        }

        // Restore currency option and set selectedCurrency state
        if (savedValues.currency) {
          const currencyOption = currencyOptions.find((x) => x.value === savedValues.currency);
          if (currencyOption) {
            setSelectedCurrency(savedValues.currency);
          }
        }

        formikRef.current.setValues(savedValues);
        setRows(savedFormData.rows || {});
        setIsDisabled(false);
        clearFormValues(formId);
        clearLastVisitedPage(formId);
      }
    }
  }, [restoreValuesFromStore, getFormValues, formId, getAccountsByTypeOptions, currencyOptions, clearFormValues, clearLastVisitedPage]);

  // Function to check for changes and update status
  const checkForChanges = useCallback(
    (currentFormData, currentRows) => {
      if (!originalFormData || !originalRows) return;

      // Check if form data has changed
      const formDataChanged =
        currentFormData.ledger !== originalFormData.ledger ||
        currentFormData.account !== originalFormData.account ||
        currentFormData.office !== originalFormData.office ||
        currentFormData.currency !== originalFormData.currency;

      // Check if rows have changed
      const currentRowsArray = Object.values(currentRows);
      const originalRowsArray = Object.values(originalRows);

      const rowsChanged =
        currentRowsArray.length !== originalRowsArray.length ||
        currentRowsArray.some((row, index) => {
          const originalRow = originalRowsArray[index];
          if (!originalRow) return true;
          return (
            row.narration !== originalRow.narration ||
            row.debit !== originalRow.debit ||
            row.credit !== originalRow.credit
          );
        });

      const hasAnyChanges = formDataChanged || rowsChanged;
      setHasChanges(hasAnyChanges);

      // If original status was "Approved" and there are changes, update row statuses to "Open"
      if (originalStatus === 'Approved' && hasAnyChanges) {
        setRows((prevRows) => {
          const updatedRows = {};
          Object.keys(prevRows).forEach((key) => {
            updatedRows[key] = {
              ...prevRows[key],
              status: 'open',
            };
          });
          return updatedRows;
        });
      }
    },
    [originalFormData, originalRows, originalStatus]
  );

  // Update suspense voucher mutation
  const updateSuspenseVoucherMutation = useMutation({
    mutationFn: (payload) =>
      updateSuspenseVoucher(payload.id, payload.formData),
    onSuccess: (data) => {
      showToast('Suspense Voucher Updated Successfully!', 'success');

      if (hasPrintPermission && getPrintSettings('suspense_voucher')) {
        window.open(data.detail?.pdf_url, '_blank');
      }

      // Invalidate all related queries to force a fresh fetch
      queryClient.invalidateQueries(['suspenseVoucher', searchTerm]);
      queryClient.invalidateQueries(['suspenseVoucherListing']);

      // Force a refetch to ensure we have the latest data
      queryClient.refetchQueries(['suspenseVoucher', searchTerm]);

      // Reset change detection state since the update was successful
      setHasChanges(false);

      // Add a small delay to ensure data is refetched before navigating
      setTimeout(() => {
        // Navigate back to view mode to see the updated data
        setPageState('view');
      }, 500);
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  const handleAddRows = () => {
    let count = 5; // Number of rows to add
    const newRows = {};
    Array.from({ length: count }).forEach(() => {
      const id = crypto.randomUUID();
      newRows[id] = {
        id,
        narration: '',
        debit: '',
        credit: '',
        status: 'open',
      };
    });
    setRows((prevRows) => {
      const updatedRows = { ...prevRows, ...newRows };

      // Check for changes after adding new rows
      if (formikRef.current) {
        const currentFormData = formikRef.current.values;
        checkForChanges(currentFormData, updatedRows);
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
    const formValues = formikRef.current.values;

    // Validate form
    const formErrors = await formikRef.current.validateForm();

    // Validate table rows
    const nextRowErrors = {};
    let hasTableData = false;
    let hasTableErrors = false;

    Object.values(rows).forEach((row) => {
      const debit = parseFloat(row.debit) || 0;
      const credit = parseFloat(row.credit) || 0;

      // If row has any data (narration or amounts), validate it
      if (row.narration || debit > 0 || credit > 0) {
        hasTableData = true;

        // At least one of debit or credit must be filled
        if (debit === 0 && credit === 0) {
          nextRowErrors[row.id] = {
            debit: 'Debit is required',
            credit: 'Credit is required'
          };
          hasTableErrors = true;
        } else if (debit > 0 && credit > 0 && debit === credit) {
          nextRowErrors[row.id] = {
            debit: 'Cannot enter same amount in both',
            credit: 'Cannot enter same amount in both'
          };
          hasTableErrors = true;
        }
      }
    });

    // If no row has any data, mark the first row as having error
    if (!hasTableData) {
      const firstRowId = Object.keys(rows)[0];
      if (firstRowId) {
        nextRowErrors[firstRowId] = {
          debit: 'Debit is required',
          credit: 'Credit is required'
        };
      }
      hasTableErrors = true;
    }

    setRowErrors(nextRowErrors);

    // Show validation errors using Formik
    if (Object.keys(formErrors).length > 0) {
      formikRef.current.setTouched(
        Object.keys(formErrors).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {})
      );
      return;
    }

    if (hasTableErrors) {
      return;
    }

    // Validate rows - allow rows with only credit or only debit, but require narration
    const validRows = Object.values(rows).filter(
      (row) =>
        row.narration || parseFloat(row.debit) > 0 || parseFloat(row.credit) > 0
    );

    // Transform transactions to match backend expectations
    const transformedTransactions = validRows.reduce((acc, row, index) => {
      acc[`transactions[${index}][narration]`] = row.narration;
      acc[`transactions[${index}][debit]`] = parseFloat(
        row.debit || 0
      ).toString();
      acc[`transactions[${index}][credit]`] = parseFloat(
        row.credit || 0
      ).toString();
      // Map status values to backend format
      let statusValue;
      switch (row.status) {
        case 'open':
          statusValue = '1';
          break;
        case 'closed':
          statusValue = '0';
          break;
        case 'Approved':
          statusValue = '2';
          break;
        case 'Settle':
          statusValue = '3';
          break;
        default:
          statusValue = '1'; // Default to open
      }
      acc[`transactions[${index}][status]`] = statusValue;
      return acc;
    }, {});

    const payload = {
      total_debit: totalDebit.toString(),
      total_credit: totalCredit.toString(),
      ledger: formValues.ledger,
      account_id: formValues.account.toString(),
      office_id: formValues.office?.toString() || '',
      currency_id: formValues.currency.toString(),
      date: date,
      ...transformedTransactions,
    };

    handlePairReleased();

    updateSuspenseVoucherMutation.mutate({
      id: suspenseVoucherData.voucher_no,
      formData: payload,
    });
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
    handlePairReleased()
    releaseLock();
    setRowErrors({});
    setPageState('view');
    setSearchTerm(suspenseVoucherData?.voucher_no || '');
  };

  // Handler functions for rows
  const updateField = useCallback(
    (id, field, value) => {
      setRows((prev) => {
        const newRows = {
          ...prev,
          [id]: {
            ...prev[id],
            [field]: value,
          },
        };

        // Clear only the error for the specific field being updated
        setRowErrors((prevErrors) => {
          if (prevErrors[id] && prevErrors[id][field]) {
            const nextErrors = { ...prevErrors };
            nextErrors[id] = { ...nextErrors[id] };
            delete nextErrors[id][field];

            // If no errors left in this row object, remove row key
            if (Object.keys(nextErrors[id]).length === 0) {
              delete nextErrors[id];
            }
            return nextErrors;
          }
          return prevErrors;
        });

        // Check for changes after updating the row
        if (formikRef.current) {
          const currentFormData = formikRef.current.values;
          checkForChanges(currentFormData, newRows);
        }

        return newRows;
      });
    },
    [checkForChanges]
  );

  const handleDeleteRow = (id) => {
    setRows((prevRows) => {
      const newState = { ...prevRows };
      delete newState[id];

      // Check for changes after deleting the row
      if (formikRef.current) {
        const currentFormData = formikRef.current.values;
        checkForChanges(currentFormData, newState);
      }

      return newState;
    });
  };

  // Before rendering, ensure currencyOptions is always [{label, value: string}]
  const normalizedCurrencyOptions = (currencyOptions || []).map((opt) => ({
    label: opt.label,
    value: String(opt.value),
  }));

  // Get ledger options
  const getLedgerOptions = () => {
    return [
      { label: 'PL', value: 'party' },
      { label: 'GL', value: 'general' },
      { label: 'WIC', value: 'walkin' },
    ];
  };

  if (isLoading) {
    return (
      <div className="d-card">
        <div className="text-center">
          <p className="text-muted mb-0">Loading Suspense Voucher data...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="d-card">
        <div className="text-center">
          <p className="text-danger mb-0">
            Unable to fetch Suspense Voucher data
          </p>
        </div>
      </div>
    );
  }

  if (!suspenseVoucherData || !suspenseVoucher) {
    return (
      <div className="d-card">
        <div className="text-center">
          <p className="text-muted mb-0">No Suspense Voucher data found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="d-card">
        <Formik
          key={`${suspenseVoucherData?.id || 'loading'}-${suspenseVoucher?.ledger || ''
            }-${suspenseVoucher?.account_id || ''}-${suspenseVoucher?.office?.id || ''
            }-${suspenseVoucher?.currency?.id || ''}`}
          innerRef={formikRef}
          enableReinitialize={true}
          initialValues={{
            ledger: '',
            account: '',
            office: '',
            currency: '',
          }}
          validate={(values) => {
            const errors = {};
            if (!values.ledger) {
              errors.ledger = 'Ledger is required';
            } else if (!values.account) {
              errors.account = 'Account is required';
            }
            if (!values.currency) errors.currency = 'Currency is required';
            return errors;
          }}
          onSubmit={() => { }}
        >
          {({
            values,
            handleBlur,
            setFieldValue,
            setFieldTouched,
            touched,
            errors,
          }) => {
            return (
              <Form>
                <div className="row">
                  <div className="col-12 col-xxl-9">
                    <div className="row">
                      <div className="col-12 col-md-6 col-lg-5 mb-md-45 mb-3">
                        <CombinedInputs
                          label="Ledger"
                          type1="select"
                          type2="select"
                          name1="ledger"
                          name2="account"
                          value1={values.ledger}
                          value2={values.account || newlyCreatedAccount?.id}
                          options1={getLedgerOptions()}
                          options2={getAccountsByTypeOptions(
                            selectedLedger || values.ledger
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
                              setFieldValue('ledger', selected.value);
                              setSelectedLedger(selected.value);
                              setFieldValue('account', ''); // Reset account when ledger changes
                              setSelectedLedgerAccount(null); // Reset selected account

                              // Small timeout to ensure Formik state is updated before triggering validation
                              setTimeout(() => {
                                setFieldTouched('account', true, true);
                              }, 0);
                              // Check for changes after updating form
                              setTimeout(() => {
                                if (formikRef.current) {
                                  checkForChanges(
                                    formikRef.current.values,
                                    rows
                                  );
                                }
                              }, 0);
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
                              setFieldValue('account', selected.value);
                              setSelectedLedgerAccount({
                                value: selected.value,
                                label: selected.label,
                                accountType: selectedLedger || values.ledger
                              });
                              // Check for changes after updating form
                              setTimeout(() => {
                                if (formikRef.current) {
                                  checkForChanges(
                                    formikRef.current.values,
                                    rows
                                  );
                                }
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
                          name="account"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>
                      <div className="col-12 col-md-6 col-lg-5 mb-md-45 mb-3">
                        <SearchableSelect
                          name={'office'}
                          label={'Office'}
                          options={[
                            ...getOfficeLocationOptions(),
                            {
                              label: 'Add New Office',
                              value: null,
                            },
                          ]}
                          placeholder={'Select Office'}
                          value={values.office}
                          isDisabled={isDisabled}
                          onChange={(selected) => {
                            if (
                              selected.label
                                ?.toLowerCase()
                                ?.startsWith('add new')
                            ) {
                              setShowAddOfficeLocationModal(true);
                            } else {
                              setFieldValue('office', selected.value);
                              // Check for changes after updating form
                              setTimeout(() => {
                                if (formikRef.current) {
                                  checkForChanges(
                                    formikRef.current.values,
                                    rows
                                  );
                                }
                              }, 0);
                            }
                          }}
                          onBlur={handleBlur}
                        />
                      </div>
                    </div>
                    <div className="row mb-md-45 mb-4">
                      <div className="col-12 col-md-6 col-lg-5 mb-md-45 mb-3">
                        <SearchableSelect
                          name={'currency'}
                          label={'Currency'}
                          options={normalizedCurrencyOptions}
                          isDisabled={isDisabled}
                          placeholder={'Select Currency'}
                          value={values.currency}
                          onChange={(selected) => {
                            setFieldValue('currency', selected.value);
                            setSelectedCurrency(selected.value);
                            setHasShownModal(false); // Reset modal state when currency changes
                            // Check for changes after updating form
                            setTimeout(() => {
                              if (formikRef.current) {
                                checkForChanges(
                                  formikRef.current.values,
                                  rows
                                );
                              }
                            }, 0);
                          }}
                          onBlur={handleBlur}
                        />
                        <ErrorMessage
                          name="currency"
                          component="div"
                          className="input-error-message text-danger"
                        />
                        {isLoadingCurrencyRate && (
                          <p className="m-0 position-absolute primary-color-text">
                            Fetching currency rate...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-lg-4 col-xl-3 col-xxl-3 offset-xxl-2">
                    <div className="row">
                      {/* Right side cards */}
                      <div
                        className="col-12 mb-5"
                        style={{ maxWidth: '350px' }}
                      >
                        {(getAccountBalanceSettings('suspense_voucher') || getAccountBalanceSettings('receipt_voucher')) && (
                          <>
                            {selectedLedgerAccount && (
                              <AccountBalanceCard
                                heading="Account Balance"
                                accountName={selectedLedgerAccount.label}
                                balances={
                                  (ledgerAccountBalance?.balances ||
                                    ledgerAccountBalance?.detail?.balances ||
                                    (Array.isArray(ledgerAccountBalance)
                                      ? ledgerAccountBalance
                                      : []))
                                }
                                loading={ledgerAccountBalance === undefined}
                              />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <CustomTable
                      displayCard={false}
                      headers={suspenseVoucherNewHeaders}
                      isPaginated={false}
                      className={'inputTable'}
                      hideSearch
                      hideItemsPerPage
                    >
                      <tbody>
                        {Object.values(rows).map((row, index) => (
                          <SuspenseVoucherRow
                            key={row.id}
                            row={row}
                            index={index}
                            isDisabled={isDisabled}
                            handleDeleteRow={handleDeleteRow}
                            updateField={updateField}
                            errors={rowErrors[row.id] || {}}
                          />
                        ))}
                      </tbody>
                    </CustomTable>
                  </div>

                  <div className="d-flex flex-wrap justify-content-between mt-3 mb-5">
                    <div className="d-inline-block mt-3">
                      <CustomCheckbox
                        label="Account Balance"
                        style={{ border: 'none', margin: 0 }}
                        disabled={isDisabled}
                        checked={getAccountBalanceSettings('suspense_voucher') || getAccountBalanceSettings('receipt_voucher')}
                        onChange={(e) => {
                          updateAccountBalanceSetting(
                            'suspense_voucher',
                            e.target.checked
                          );
                        }}
                      />
                      {hasPrintPermission && (
                        <CustomCheckbox
                          label="Print"
                          style={{ border: 'none', margin: 0 }}
                          disabled={isDisabled}
                          checked={getPrintSettings('suspense_voucher')}
                          onChange={() =>
                            updatePrintSetting(
                              'suspense_voucher',
                              !getPrintSettings('suspense_voucher')
                            )
                          }
                        />
                      )}
                    </div>
                    <div className="d-flex flex-column gap-2 mt-1 debit-credit-inputs">
                      <CustomInput
                        name="totalDebit"
                        label={'Total Debit'}
                        labelClass={'fw-medium'}
                        type="number"
                        error={false}
                        borderRadius={10}
                        value={formatNumberForDisplay(totalDebit, 2)}
                        readOnly
                      />
                      <CustomInput
                        name="totalCredit"
                        label={'Total Credit'}
                        labelClass={'fw-medium'}
                        type="number"
                        error={false}
                        borderRadius={10}
                        value={formatNumberForDisplay(totalCredit, 2)}
                        readOnly
                      />
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
          { text: 'Add Rows', onClick: handleAddRows },
          { text: 'Update', onClick: handleSubmit, loading: isLoadingLockStatus },
          { text: 'Cancel', onClick: handleCancel, variant: 'secondaryButton' },
        ]}
        loading={updateSuspenseVoucherMutation.isPending}
        onAttachmentClick={() => setShowAttachmentsModal(true)}
        lastVoucherNumbers={lastVoucherNumbers}
        setPageState={setPageState}
        setSearchTerm={setSearchTerm}
      />
      {/* Attachements Modal */}
      <CustomModal
        show={showAttachmentsModal}
        close={() => setShowAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          key={`${suspenseVoucherData?.id}-${suspenseVoucherData?.files?.length || 0
            }`}
          showModal={showAttachmentsModal}
          closeModal={() => setShowAttachmentsModal(false)}
          item={suspenseVoucherData}
          deleteService={deleteSuspenseVoucherAttachment}
          uploadService={addSuspenseVoucherAttachment}
          getAttachmentsService={getSuspenseVoucherAttachments}
          closeUploader={() => setShowAttachmentsModal(false)}
          voucherAttachment={true}
          queryToInvalidate={['suspenseVoucher', searchTerm]}
        />
      </CustomModal>
    </>
  );
};

export default EditSuspenseVoucher;
