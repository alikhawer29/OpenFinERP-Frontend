import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CustomCheckbox from '../../../Components/CustomCheckbox/CustomCheckbox';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import { showToast } from '../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import {
  checkTransactionLockStatus,
  releaseTransaction,
} from '../../../Services/Process/TransactionLock';
import {
  addJournalVoucherAttachment,
  deleteJournalVoucherAttachment,
  getJournalVoucherListing,
  updateJournalVoucher,
} from '../../../Services/Transaction/JournalVoucher';
import { pairReleased } from '../../../Services/General';
import useFormStore from '../../../Stores/FormStore';
import useSettingsStore from '../../../Stores/SettingsStore';
import { journalVoucherHeaders } from '../../../Utils/Constants/TableHeaders';
import {
  formatNumberForDisplay,
  isNullOrEmpty,
  showErrorToast,
} from '../../../Utils/Utils';
import JournalVoucherRow from './JournalVoucherRow';

const EditJournalVoucher = ({
  date,
  getAccountsByTypeOptions,
  currencyOptions,
  setShowMissingCurrencyRateModal,
  setCurrencyToSelect,
  setShowAddLedgerModal,
  newlyCreatedAccount,
  setAddLedgerRowId,
  setPageState,
  searchTerm,
  setSearchTerm,
  isDisabled,
  setIsDisabled,
  lastVoucherNumbers,
  updatePrintSetting,
  hasPrintPermission,
  showModal,
  closeModal,
  onFormDataChange,
  restoreValuesFromStore,
}) => {
  const [rows, setRows] = useState({});
  const restoredFromStoreRef = React.useRef(false);
  const queryClient = useQueryClient();
  const voucherName = 'journal_voucher';

  // Access the form store
  const { getFormValues, clearFormValues, clearLastVisitedPage } =
    useFormStore();

  // For getting print checkbox state from BE
  const { getPrintSettings } = useSettingsStore();
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [showError, setShowError] = useState(false);
  const [showSubmitError, setShowSubmitError] = useState(false);

  // Table Row Actions
  const handleAddRows = () => {
    let count = 6; // Number of rows to add
    const newRows = {};
    Array.from({ length: count }).forEach(() => {
      const id = crypto.randomUUID();
      newRows[id] = {
        id,
        ledger: '',
        account_id: '',
        narration: '',
        currency_id: '',
        fc_amount: '',
        rate: '1.00000000',
        lc_amount: '',
        sign: 'debit',
        pair_id: '',
      };
    });
    setRows((prevRows) => ({ ...prevRows, ...newRows }));
  };
  const handleDeleteRow = (id) => {
    setRows((prevRows) => {
      const newState = { ...prevRows };
      delete newState[id];
      return newState;
    });
  };
  //mutation for pair released
  const pairReleasedMutation = useMutation({
    mutationFn: pairReleased,
    onSuccess: (data) => {
      console.log(data.message, 'success');
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  //pair id release
  const handlePairReleased = async () => {
    // Collect all unique pair_ids from current rows
    const pairIds = Object.values(rows)
      .map((row) => row.pair_id)
      .filter((pairId) => pairId && pairId !== ''); // Only include non-empty pair_ids

    // Remove duplicates
    const uniquePairIds = [...new Set(pairIds)];

    // Release each pair_id
    uniquePairIds.forEach((pairId) => {
      pairReleasedMutation.mutate(pairId);
    });
  };

  const handleResetRows = () => {
    // Release pair IDs before resetting
    handlePairReleased();

    releaseLock();
    // setRows(generateInitialRows(4));
    setIsDisabled(true);
    setPageState('view');
  };

  const updateJournalVoucherMutation = useMutation({
    mutationFn: ({ id, formData }) => updateJournalVoucher(id, formData),
    onSuccess: (data) => {
      showToast(data?.message, 'success');
      if (getPrintSettings('journal_voucher')) {
        if (data?.detail?.pdf_url) {
          window.open(data.detail.pdf_url, '_blank');
        }
      }
      queryClient.invalidateQueries(['journalVoucher', searchTerm]);
      handleResetRows();
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  const {
    data: { data: [journalVoucherData] = [] } = {}, // [journalVoucherData] = destructuring array first item
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['journalVoucher', searchTerm],
    queryFn: () => getJournalVoucherListing({ search: searchTerm }),
  });

  // Check Transaction lock status to enable/disable
  const { isLoading: isLoadingLockStatus, refetch: checkFormStatus } = useQuery(
    {
      queryKey: ['save_lock_status', voucherName, journalVoucherData?.id],
      queryFn: () =>
        checkTransactionLockStatus({
          transaction_type: voucherName,
          transaction_id: journalVoucherData?.id,
        }),
      enabled: false,
      retry: false,
    }
  );

  // Release lock on unmount or cancel
  const releaseExecutedRef = React.useRef(false);
  const releaseTransactionMutation = useMutation({
    mutationFn: releaseTransaction,
  });
  const releaseLock = React.useCallback(() => {
    if (releaseExecutedRef.current) return;
    if (journalVoucherData?.id) {
      releaseTransactionMutation.mutate({
        transaction_type: voucherName,
        transaction_id: journalVoucherData?.id,
      });
      releaseExecutedRef.current = true;
    }
  }, [journalVoucherData?.id]);
  // Avoid releasing immediately on mount in React 18 StrictMode by deferring cleanup
  const ignoreCleanupRef = React.useRef(true);
  React.useEffect(() => {
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
    // Skip overwriting rows if we just restored from the form store
    // (e.g., returning from Rate of Exchange page with updated rates)
    if (restoredFromStoreRef.current) {
      restoredFromStoreRef.current = false;
      return;
    }
    if (!isNullOrEmpty(journalVoucherData?.journal_vouchers)) {
      setRows(() => {
        const editRows = {};

        journalVoucherData?.journal_vouchers.forEach((x) => {
          editRows[x.id] = {
            id: x.id,
            ledger: x.ledger,
            account_id: x.account_id,
            narration: x.narration,
            currency_id: x.currency_id,
            fc_amount: x.fc_amount,
            rate: x.rate,
            lc_amount: x.lc_amount,
            sign: x.sign,
            pair_id: x.pair_id || '',
          };
        });
        setTotalDebit(
          Math.round((parseFloat(journalVoucherData?.total_debit) || 0) * 100) /
          100
        );
        setTotalCredit(
          Math.round(
            (parseFloat(journalVoucherData?.total_credit) || 0) * 100
          ) / 100
        );

        return { ...editRows };
      });
    }
  }, [journalVoucherData]);

  // Restore form data if returning from Rate of Exchange page
  useEffect(() => {
    if (restoreValuesFromStore) {
      const savedFormData = getFormValues('editJournalVoucher');
      if (savedFormData) {
        // Mark that we restored from the store so the journalVoucherData
        // effect does not overwrite the restored rows with stale API data
        restoredFromStoreRef.current = true;
        setRows(savedFormData.rows || {});
        setTotalDebit(Math.round((savedFormData.totalDebit || 0) * 100) / 100);
        setTotalCredit(
          Math.round((savedFormData.totalCredit || 0) * 100) / 100
        );
        // Clear the saved data after restoring
        clearFormValues('editJournalVoucher');
        clearLastVisitedPage('editJournalVoucher');
      }
    }
  }, [
    restoreValuesFromStore,
    getFormValues,
    clearFormValues,
    clearLastVisitedPage,
  ]);

  // Notify parent of form data changes
  useEffect(() => {
    onFormDataChange?.({
      rows,
      totalDebit,
      totalCredit,
    });
  }, [rows, totalDebit, totalCredit, onFormDataChange]);

  // Handler functions for rows
  const updateField = useCallback((id, field, value) => {
    setShowSubmitError(false);
    setRows((prev) => {
      const newRows = {
        ...prev,
        [id]: {
          ...prev[id],
          [field]: value,
        },
      };

      // Calculate total debit whenever lc_amount or sign changes
      if (field === 'lc_amount' || field === 'sign') {
        const totalDebit = Object.values(newRows).reduce((sum, row) => {
          const amount = parseFloat(row.lc_amount) || 0;
          return row.sign === 'Debit' ? sum + amount : sum;
        }, 0);
        setTotalDebit(Math.round(totalDebit * 100) / 100);
        const totalCredit = Object.values(newRows).reduce((sum, row) => {
          const amount = parseFloat(row.lc_amount) || 0;
          return row.sign === 'Credit' ? sum + amount : sum;
        }, 0);
        setTotalCredit(Math.round(totalCredit * 100) / 100);
      }

      return newRows;
    });
  }, []);

  // Handle exchange rate changes from child components
  const handleRateChange = useCallback(
    (rateData) => {
      if (rateData.isError) {
        showModal(
          'Exchange Rate Control',
          <>
            Exchange Rate for {rateData.currency}
            <br />
            Range: {rateData.minRange?.toFixed(8)} -{' '}
            {rateData.maxRange?.toFixed(8)}
            <br />
            Your selected rate is {rateData.currentRate?.toFixed(8)}
            <br />
            Your selected rate is outside this range
          </>,
          () => closeModal(),
          'error'
        );
      }
    },
    [showModal, closeModal]
  );

  // Expose updateField globally for modal callback
  React.useEffect(() => {
    window.updateJVRowField = updateField;
    return () => {
      delete window.updateJVRowField;
    };
  }, [updateField]);

  const handleSubmit = async () => {
    const roundedDebit = Math.round(totalDebit * 100) / 100;
    const roundedCredit = Math.round(totalCredit * 100) / 100;
    if (roundedDebit - roundedCredit !== 0) {
      setShowError(true);
      return;
    }
    // run status check first
    const { error: errorLockStatus } = await checkFormStatus();

    if (errorLockStatus?.detail?.locked) {
      showToast(errorLockStatus?.message, 'warn');
      return;
    }

    // Check for any rows with rate validation errors (not just any error)
    const firstRateErrorRow = Object.values(rows).find((row) => {
      // It's a rate error if:
      // 1. row.error is true (manually edited out of range)
      // 2. OR it has a currency but rate is empty/zero
      const isRateEmptyOrZero =
        !row.rate || row.rate === '' || row.rate === '0' || row.rate === 0;
      return row.currency_id && (row.error === true || isRateEmptyOrZero);
    });

    if (firstRateErrorRow) {
      handleRateChange({
        rowId: firstRateErrorRow.id,
        currencyId: firstRateErrorRow.currency_id,
        currentRate: parseFloat(firstRateErrorRow.rate) || 0,
        minRange: parseFloat(firstRateErrorRow.minRange),
        maxRange: parseFloat(firstRateErrorRow.maxRange),
        currency:
          currencyOptions.find((opt) => opt.value === firstRateErrorRow.currency_id)
            ?.label || 'Unknown',
        isError: true,
      });
      return;
    }

    let payload = {
      ...rows,
    };

    let transactions = Object.fromEntries(
      Object.entries(payload).filter(([_, obj]) => {
        // Check if row is completely empty (no ledger, account, amount, narration)
        const isEmpty =
          !obj.ledger && !obj.account_id && !obj.fc_amount && !obj.narration;
        if (isEmpty) return false;

        return true;
      })
    );

    // Validate that all remaining (non-empty) rows are fully filled
    const hasIncompleteRows = Object.values(transactions).some((row) => {
      // Check required fields
      return (
        !row.ledger ||
        !row.account_id ||
        !row.narration ||
        !row.fc_amount ||
        !row.currency_id ||
        !row.sign
      );
    });

    if (isNullOrEmpty(transactions) || hasIncompleteRows) {
      setShowSubmitError(true);
      return;
    }

    // Debug log to see what transactions we have

    transactions = Object.values(transactions).map(({ id, ...rest }) => rest);

    const transformedTransactions = transactions?.reduce((acc, t, index) => {
      Object.entries(t).forEach(([key, value]) => {
        acc[`transactions[${index}][${key}]`] = value;
      });
      return acc;
    }, {});

    // Debug log to see the final payload

    payload = {
      total_debit: Math.round(totalDebit * 100) / 100,
      total_credit: Math.round(totalCredit * 100) / 100,
      ...transformedTransactions,
      date,
    };

    if (!journalVoucherData?.voucher_no) {
      showErrorToast({ message: 'Voucher data is not available. Please try again.' });
      return;
    }

    updateJournalVoucherMutation.mutate({
      id: journalVoucherData.voucher_no,
      formData: payload,
    });
  };

  // Check if any row has validation error
  const hasRowErrors = Object.values(rows).some((row) => row.error === true);

  if (isError) {
    showErrorToast(error.message);
  }

  return (
    <>
      <Row>
        <Col>
          <CustomTable
            headers={journalVoucherHeaders}
            isPaginated={false}
          className={`inputTable ${showSubmitError || hasRowErrors ? 'validation-error' : ''}`}
            isLoading={isLoading}
            hideSearch
            hideItemsPerPage
          >
            <tbody>
              {isError && (
                <tr>
                  <td colSpan={journalVoucherHeaders.length}>
                    <p className="text-danger mb-0">
                      Unable to fetch data at this time
                    </p>
                  </td>
                </tr>
              )}
              {Object.values(rows).map((row, index) => (
                <JournalVoucherRow
                  key={row.id}
                  row={row}
                  index={index}
                  date={date}
                  isDisabled={isDisabled}
                  getAccountsByTypeOptions={getAccountsByTypeOptions}
                  currencyOptions={currencyOptions}
                  handleDeleteRow={handleDeleteRow}
                  updateField={updateField}
                  setShowMissingCurrencyRateModal={
                    setShowMissingCurrencyRateModal
                  }
                  newlyCreatedAccount={newlyCreatedAccount}
                  setShowAddLedgerModal={(modalType) => {
                    setShowAddLedgerModal(modalType);
                    setAddLedgerRowId(row.id);
                  }}
                  setCurrencyToSelect={setCurrencyToSelect}
                  onRateChange={handleRateChange}
                />
              ))}
            </tbody>
          </CustomTable>
          {showSubmitError && !isDisabled && (
            <p className="text-danger">
              Please fill all fields in a row to save
            </p>
          )}
          <div className="d-flex justify-content-between gap-3 mt-45 mb-5">
            <div>
              {hasPrintPermission && (
                <CustomCheckbox
                  readOnly={isDisabled}
                  checked={getPrintSettings('journal_voucher')}
                  style={{ border: 'none', userSelect: 'none' }}
                  onChange={(e) => {
                    updatePrintSetting('journal_voucher', e.target.checked);
                  }}
                  label={'Print'}
                />
              )}
            </div>
            <div className="d-flex flex-column gap-2 mt-1">
              {!isLoading && !isError && (
                <>
                  <CustomInput
                    name="totalDebit"
                    label={'Total Debit'}
                    labelClass={'fw-medium'}
                    type="number"
                    showBorders={false}
                    error={false}
                    borderRadius={10}
                    value={formatNumberForDisplay(totalDebit, 2) || ''}
                    readOnly
                  />
                  <CustomInput
                    name="totalCredit"
                    label={'Total Credit'}
                    labelClass={'fw-medium'}
                    type="number"
                    showBorders={false}
                    error={false}
                    borderRadius={10}
                    value={formatNumberForDisplay(totalCredit, 2) || ''}
                    readOnly
                  />
                  <CustomInput
                    name="difference"
                    label={'Difference'}
                    labelClass={'fw-medium'}
                    type="number"
                    showBorders={false}
                    error={false}
                    borderRadius={10}
                    value={
                      formatNumberForDisplay(
                        parseFloat(totalDebit) - parseFloat(totalCredit),
                        2
                      ) || ''
                    }
                    readOnly
                  />
                  {Math.round((totalDebit - totalCredit) * 100) / 100 !== 0 &&
                    showError && (
                      <p className="text-danger">Difference must be 0</p>
                    )}
                </>
              )}
            </div>
          </div>
        </Col>
      </Row>
      <VoucherNavigationBar
        isDisabled={isDisabled}
        actionButtons={[
          { text: 'Add Rows', onClick: handleAddRows },
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
        loading={updateJournalVoucherMutation.isPending}
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
          showModal={showAttachmentsModal}
          closeModal={() => setShowAttachmentsModal(false)}
          item={journalVoucherData}
          deleteService={deleteJournalVoucherAttachment}
          uploadService={addJournalVoucherAttachment}
          closeUploader={() => setShowAttachmentsModal(false)}
          voucherAttachment={true}
          queryToInvalidate={['journalVoucher', searchTerm]}
        />
      </CustomModal>
    </>
  );
};

export default EditJournalVoucher;
