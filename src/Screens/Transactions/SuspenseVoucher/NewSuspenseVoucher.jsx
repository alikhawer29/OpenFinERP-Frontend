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
import FileDisplayList from '../../../Components/FileDisplayList/FileDisplayList';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import useCurrencyRate from '../../../Hooks/useCurrencyRate';
import { createSuspenseVoucher } from '../../../Services/Transaction/SuspenseVoucher';
import useFormStore from '../../../Stores/FormStore';
import useSettingsStore from '../../../Stores/SettingsStore';
import { suspenseVoucherNewHeaders } from '../../../Utils/Constants/TableHeaders';
import { formatNumberForDisplay, showErrorToast } from '../../../Utils/Utils';
import { getAccountBalances, pairReleased } from '../../../Services/General';
import SuspenseVoucherRow from './SuspenseVoucherRow';
import withModal from '../../../HOC/withModal';

const generateInitialRows = (count) => {
  const rows = {};
  Array.from({ length: count }).forEach(() => {
    const id = crypto.randomUUID();
    rows[id] = {
      id,
      narration: '',
      debit: '',
      credit: '',
      status: 'open',
    };
  });
  return rows;
};
const INITIAL_STATE = generateInitialRows(5);

const NewSuspenseVoucher = ({
  showModal,
  date,
  setDate,
  currencyOptions,
  getAccountsByTypeOptions,
  getOfficeLocationOptions,
  isDisabled = false,
  setIsDisabled,
  setShowAddOfficeLocationModal,
  setShowAddLedgerModal,
  newlyCreatedAccount,
  uploadAttachmentsModal,
  setUploadAttachmentsModal,
  setSelectedFiles,
  lastVoucherNumbers,
  setPageState,
  setSearchTerm,
  updatePrintSetting,
  onFormDataChange,
  restoreValuesFromStore,
  // Missing Rate of Exchange props (following Receipt Voucher pattern)
  setCurrencyToSelect,
  setShowMissingCurrencyRateModal,
  permissions,
  hasPrintPermission,
}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [rows, setRows] = useState(INITIAL_STATE);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState(null);
  const [addedAttachments, setAddedAttachments] = useState([]);
  const [rowErrors, setRowErrors] = useState({});
  const formikRef = useRef();

  // Missing Rate of Exchange state variables (following Receipt Voucher pattern)
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
  const formId = 'suspense-voucher'; // Unique identifier for this form

  // For getting print checkbox state and account balance settings from BE
  const {
    getPrintSettings,
    getAccountBalanceSettings,
    updateAccountBalanceSetting,
  } = useSettingsStore();

  // Fetch currency rate for the selected Currency (following Receipt Voucher pattern)
  const { data: currencyRate, isLoading: isLoadingCurrencyRate } =
    useCurrencyRate(selectedCurrency, date);

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

  // Check if all rows have both debit and credit amounts (either validation)
  const hasValidRows = () => {
    const validRows = Object.values(rows).filter((row) => {
      const debit = parseFloat(row.debit) || 0;
      const credit = parseFloat(row.credit) || 0;
      return (debit > 0 || credit > 0);
    });

    return validRows.length > 0;
  };

  // Handle navigation to Missing Rate of Exchange page (following Receipt Voucher pattern)
  const handleNavigateToMissingRatePage = () => {
    // Save form data before navigating
    if (formikRef.current && !isDisabled) {
      const dataToSave = {
        values: formikRef.current.values,
        addedAttachments,
        rows,
      };
      saveFormValues(formId, dataToSave);
      setLastVisitedPage(formId, 'rate-of-exchange');
    }

    navigate('/transactions/remittance-rate-of-exchange', {
      state: {
        fromPage: 'suspense-voucher',
        currencyToSelect: selectedCurrency,
        date: date,
      },
    });
  };

  // Missing Rate of Exchange modal logic (following Receipt Voucher pattern)
  useEffect(() => {
    if (
      selectedCurrency &&
      !isLoadingCurrencyRate &&
      (currencyRate === null ||
        currencyRate === undefined ||
        (currencyRate && !currencyRate?.rate)) &&
      !hasShownModal
    ) {
      formikRef.current.setFieldValue('currency', '');
      setCurrencyToSelect(selectedCurrency);
      setShowMissingCurrencyRateModal(true);
      setHasShownModal(true);
    }
  }, [selectedCurrency, currencyRate, hasShownModal, isLoadingCurrencyRate]);

  // Load saved form if returning from Missing Rate of Exchange page (following Receipt Voucher pattern)
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

        // Restore date from saved form data
        if (savedFormData.date && setDate) {
          setDate(savedFormData.date);
        }

        // Restore account options properly (following Receipt Voucher pattern)
        if (savedValues.ledger && savedValues.account) {
          const ledgerOption = [
            { label: 'PL', value: 'party' },
            { label: 'GL', value: 'general' },
            { label: 'WIC', value: 'walkin' },
          ].find((x) => savedValues.ledger === x.value);

          if (ledgerOption) {
            setSelectedLedger(ledgerOption.value);
            const accountOption = getAccountsByTypeOptions(
              ledgerOption.value
            ).find((x) => x.value === savedValues.account);
            if (accountOption) {
              setSelectedLedgerAccount(accountOption);
            }
          }
        }

        // Restore currency option and set selectedCurrency state
        if (savedValues.currency) {
          const currencyOption = currencyOptions.find(
            (x) => x.value === savedValues.currency
          );
          if (currencyOption) {
            setSelectedCurrency(savedValues.currency);
          }
        }

        formikRef.current.setValues(savedValues);
        setAddedAttachments(savedFormData.addedAttachments || []);
        setRows(savedFormData.rows || INITIAL_STATE);
        setIsDisabled(false);
        clearFormValues(formId);
        clearLastVisitedPage(formId);
      }
    }
  }, []);

  // Restore form data from store for Rate of Exchange flow
  useEffect(() => {
    if (restoreValuesFromStore) {
      const savedFormData = getFormValues(formId);
      if (savedFormData && formikRef.current) {
        const savedValues = savedFormData.values || {};

        // Don't restore date here as it's already handled by parent component
        // The parent component sets the date and passes it as a prop

        // Restore account options properly (following Receipt Voucher pattern)
        if (savedValues.ledger && savedValues.account) {
          const ledgerOption = [
            { label: 'PL', value: 'party' },
            { label: 'GL', value: 'general' },
            { label: 'WIC', value: 'walkin' },
          ].find((x) => savedValues.ledger === x.value);

          if (ledgerOption) {
            setSelectedLedger(ledgerOption.value);
            const accountOption = getAccountsByTypeOptions(
              ledgerOption.value
            ).find((x) => x.value === savedValues.account);
            if (accountOption) {
              setSelectedLedgerAccount(accountOption);
            }
          }
        }

        // Restore currency option and set selectedCurrency state
        if (savedValues.currency) {
          const currencyOption = currencyOptions.find(
            (x) => x.value === savedValues.currency
          );
          if (currencyOption) {
            setSelectedCurrency(savedValues.currency);
          }
        }

        formikRef.current.setValues(savedValues);
        setAddedAttachments(savedFormData.addedAttachments || []);
        setRows(savedFormData.rows || INITIAL_STATE);
        setIsDisabled(false);
        clearFormValues(formId);
        clearLastVisitedPage(formId);
      }
    }
  }, [restoreValuesFromStore, getFormValues, formId, getAccountsByTypeOptions, currencyOptions, clearFormValues, clearLastVisitedPage]);

  // Notify parent of form data changes (for saving before navigation)
  useEffect(() => {
    if (onFormDataChange && formikRef.current) {
      onFormDataChange({
        values: formikRef.current.values,
        addedAttachments,
        rows,
        date,
      });
    }
  }, [formikRef.current?.values, addedAttachments, rows, date]);

  // Account balances for selected ledger account
  const { data: ledgerAccountBalance } = useQuery({
    queryKey: ['accountBalance', selectedLedgerAccount?.value],
    queryFn: () =>
      getAccountBalances(
        selectedLedgerAccount.value,
        selectedLedgerAccount.accountType
      ),
    enabled:
      !!selectedLedgerAccount?.value &&
      getAccountBalanceSettings('suspense_voucher'),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

  // Create suspense voucher mutation
  const createSuspenseVoucherMutation = useMutation({
    mutationFn: createSuspenseVoucher,
    onSuccess: (data) => {
      showToast('Suspense Voucher Created!', 'success');
      if (hasPrintPermission && getPrintSettings('suspense_voucher')) {
        window.open(data.detail?.pdf_url, '_blank');
      }
      queryClient.invalidateQueries(['suspenseVoucherListing']);
      handleCancel();
      // Clear saved form values after successful creation
      clearFormValues(formId);
    },
    onError: (error) => {
      if (error.message == 'Voucher limit reached for this branch.') {
        showModal(
          'Cannot Create',
          'You have reached the maximum number of SVR. To create new transactions you need to increase the transaction count form the Transaction Number Register.',
          null,
          'error'
        );
      } else {
        showErrorToast(error);
      }
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
    setRows((prevRows) => ({ ...prevRows, ...newRows }));
  };

  const handleSubmit = async () => {
    if (!formikRef.current) return;

    const formValues = formikRef.current.values;

    // Validate the form
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

    const validRows = Object.values(rows).filter(
      (row) => row.narration || parseFloat(row.debit) > 0 || parseFloat(row.credit) > 0
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
      acc[`transactions[${index}][status]`] = row.status === 'open' ? '1' : '0';
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
      ...addedAttachments,
    };
    handlePairReleased();
    createSuspenseVoucherMutation.mutate(payload);
  };

  //mutation for pair released
  const pairReleasedMutation = useMutation({
    mutationFn: pairReleased,
    onSuccess: (data) => {
      console.log('Pair Released Successfully');
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });


  //pair id release
  const handlePairReleased = async () => {
    if (currencyRate) {
      pairReleasedMutation.mutate(currencyRate?.id);
    }
  };

  const handleCancel = () => {
    handlePairReleased();
    setRows(generateInitialRows(5));
    setTotalDebit(0);
    setTotalCredit(0);
    setIsDisabled(true);
    setSelectedLedger(null);
    setSelectedLedgerAccount(null);
    setSelectedFiles([]);
    setAddedAttachments([]);
    if (formikRef.current) {
      formikRef.current.resetForm();
    }
    // Clear saved form values when canceling
    clearFormValues(formId);
    setRowErrors({});
  };

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

      // Clear only the error for the specific field being updated
      setRowErrors((prevErrors) => {
        if (prevErrors[id] && prevErrors[id][field]) {
          const nextErrors = { ...prevErrors };
          nextErrors[id] = { ...nextErrors[id] };
          delete nextErrors[id][field];

          // Small optimization: If no errors left in this row object, remove row key
          if (Object.keys(nextErrors[id]).length === 0) {
            delete nextErrors[id];
          }
          return nextErrors;
        }
        return prevErrors;
      });

      return newRows;
    });
  }, []);

  const handleDeleteRow = (id) => {
    setRows((prevRows) => {
      const newState = { ...prevRows };
      delete newState[id];
      return newState;
    });
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

  // Get ledger options
  const getLedgerOptions = () => {
    return [
      { label: 'PL', value: 'party' },
      { label: 'GL', value: 'general' },
      { label: 'WIC', value: 'walkin' },
    ];
  };

  return (
    <>
      <div className="d-card">
        <Formik
          innerRef={formikRef}
          initialValues={{
            ledger: '',
            account: '',
            office: '',
            currency: '',
          }}
          validate={(values) => {
            const errors = {};

            // Required fields validation
            if (!values.ledger) {
              errors.ledger = 'Ledger is required';
            } else if (!values.account) {
              errors.account = 'Account is required';
            }
            if (!values.currency) errors.currency = 'Currency is required';

            return errors;
          }}
        >
          {({ values, handleBlur, setFieldValue, setFieldTouched, touched, errors }) => (
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
                        options2={getAccountsByTypeOptions(selectedLedger)}
                        isDisabled={isDisabled}
                        handleBlur={handleBlur}
                        placeholder1="Ledger"
                        placeholder2="Account"
                        className1="ledger"
                        className2="account"
                        onChange1={(selected) => {
                          if (
                            selected.label?.toLowerCase()?.startsWith('add new')
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
                            setFieldValue('account', selected.value);
                            setSelectedLedgerAccount({
                              value: selected.value,
                              label: selected.label,
                              accountType: selectedLedger,
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
                        isDisabled={isDisabled}
                        placeholder={'Select Office'}
                        value={values.office}
                        onChange={(selected) => {
                          if (
                            selected.label?.toLowerCase()?.startsWith('add new')
                          ) {
                            setShowAddOfficeLocationModal(true);
                          } else {
                            setFieldValue('office', selected.value);
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
                        options={currencyOptions}
                        isDisabled={isDisabled}
                        placeholder={'Select Currency'}
                        value={values.currency}
                        onChange={(selected) => {
                          setFieldValue('currency', selected.value);
                          setSelectedCurrency(selected.value);
                          setHasShownModal(false); // Reset modal state when currency changes
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
                <div className="col-12 col-lg-10 col-xl-9 col-xxl-3">
                  <div className="row">
                    {/* Right side cards */}
                    <div className="col-12 mb-5" style={{ maxWidth: '350px' }}>
                      {getAccountBalanceSettings('suspense_voucher') && (
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
                        </>
                      )}
                    </div>
                  </div>
                </div>
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

                <div className="d-flex flex-wrap justify-content-between mt-3 mb-5">
                  <div className="d-flex flex-column gap-2">
                    <CustomCheckbox
                      label="Account Balance"
                      checked={getAccountBalanceSettings('suspense_voucher')}
                      disabled={isDisabled}
                      style={{ border: 'none', margin: 0 }}
                      onChange={(e) =>
                        updateAccountBalanceSetting(
                          'suspense_voucher',
                          e.target.checked
                        )
                      }
                      readOnly={isDisabled}
                    />
                    {hasPrintPermission && (
                      <CustomCheckbox
                        label="Print"
                        readOnly={isDisabled}
                        disabled={isDisabled}
                        style={{ border: 'none', margin: 0 }}
                        checked={getPrintSettings('suspense_voucher')}
                        onChange={(e) =>
                          updatePrintSetting('suspense_voucher', e.target.checked)
                        }
                      />
                    )}
                    <FileDisplayList
                      files={addedAttachments}
                      onRemoveFile={handleRemoveFile}
                    />
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
          )}
        </Formik>
      </div>
      <VoucherNavigationBar
        isDisabled={isDisabled}
        actionButtons={[
          { text: 'Add Rows', onClick: handleAddRows },
          { text: 'Save', onClick: handleSubmit },
          { text: 'Cancel', onClick: handleCancel, variant: 'secondaryButton' },
        ]}
        // disableSubmit={!hasValidDebitCreditRows()}
        loading={createSuspenseVoucherMutation.isPending}
        onAttachmentClick={() => setUploadAttachmentsModal(true)}
        lastVoucherNumbers={lastVoucherNumbers}
        setPageState={setPageState}
        setSearchTerm={setSearchTerm}
      />
      {/* Upload Attachements Modal */}
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
    </>
  );
};

export default withModal(NewSuspenseVoucher);
