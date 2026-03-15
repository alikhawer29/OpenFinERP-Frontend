import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CustomCheckbox from '../../../Components/CustomCheckbox/CustomCheckbox';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import FileDisplayList from '../../../Components/FileDisplayList/FileDisplayList';
import { showToast } from '../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import withModal from '../../../HOC/withModal';
import {
  createJournalVoucher,
  getJournalVoucherListing,
} from '../../../Services/Transaction/JournalVoucher';
import useFormStore from '../../../Stores/FormStore';
import useSettingsStore from '../../../Stores/SettingsStore';
import { journalVoucherHeaders } from '../../../Utils/Constants/TableHeaders';
import {
  formatNumberForDisplay,
  isNullOrEmpty,
  showErrorToast,
} from '../../../Utils/Utils';
import JournalVoucherRow from './JournalVoucherRow';
import { pairReleased } from '../../../Services/General';

const generateInitialRows = (count) => {
  const rows = {};
  Array.from({ length: count }).forEach(() => {
    const id = crypto.randomUUID();
    rows[id] = {
      id,
      ledger: '',
      account_id: '',
      narration: '',
      currency_id: '',
      fc_amount: '',
      rate: '1.00000000',
      lc_amount: '',
      sign: 'Debit',
      error: false,
      pair_id: '',
    };
  });
  return rows;
};

const INITIAL_STATE = generateInitialRows(4);

const NewJournalVoucher = ({
  date,
  setDate,
  showModal,
  getAccountsByTypeOptions,
  currencyOptions,
  setShowMissingCurrencyRateModal,
  setCurrencyToSelect,
  setShowAddLedgerModal,
  newlyCreatedAccount,
  setAddLedgerRowId,
  setPageState,
  cloneJV,
  setCloneJV,
  setWriteCloneTerm,
  setSearchTerm,
  isDisabled,
  setIsDisabled,
  lastVoucherNumbers,
  onFormDataChange,
  restoreValuesFromStore,
  updatePrintSetting,
  inputErrorClass,
  closeModal,
  hasPrintPermission,
}) => {
  const [rows, setRows] = useState(INITIAL_STATE);
  const queryClient = useQueryClient();
  const { getFormValues, clearFormValues, clearLastVisitedPage } =
    useFormStore();
  // For getting print checkbox state from BE
  const { getPrintSettings } = useSettingsStore();

  const [uploadAttachmentsModal, setUploadAttachmentsModal] = useState(false);
  const [addedAttachments, setAddedAttachments] = useState([]);
  const [showSubmitError, setShowSubmitError] = useState(false);

  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [showError, setShowError] = useState(false);

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
        sign: 'Debit',
        error: false,
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
      console.log('Pair Released Successfully');
    },
    onError: (error) => {
      console.log(error);
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

    setRows(generateInitialRows(4));
    setTotalDebit(0);
    setTotalCredit(0);
    setSearchTerm('');
    setWriteCloneTerm('');
    setCloneJV('');
    setIsDisabled(true);
    setAddedAttachments([]);
  };

  const {
    data: { data: [journalVoucherData] = [] } = {}, // [journalVoucherData] = destructuring array first item
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['journalVoucher', cloneJV],
    queryFn: () => getJournalVoucherListing({ search: cloneJV }),
    enabled: !!cloneJV,
  });

  const createJournalVoucherMutation = useMutation({
    mutationFn: createJournalVoucher,
    onSuccess: (data) => {
      showToast('Journal Voucher Created!', 'success');
      if (getPrintSettings('journal_voucher')) {
        window.open(data.detail?.pdf_url, '_blank');
      }
      queryClient.invalidateQueries(['journalVoucherListing']);
      handleResetRows();
      setDate(new Date().toLocaleDateString('en-CA'));
    },
    onError: (error) => {
      if (error.message == 'Voucher limit reached for this branch.') {
        showModal(
          'Cannot Create',
          'The maximum number of JV has been reached. To create new transactions, please increase the transaction number count in the Transaction Number Register.',
          null,
          'error'
        );
      } else {
        showErrorToast(error);
      }
    },
  });

  useEffect(() => {
    if (!isNullOrEmpty(journalVoucherData?.journal_vouchers)) {
      setRows(() => {
        const editRows = {};
        let totalDebit = 0;
        let totalCredit = 0;

        journalVoucherData?.journal_vouchers.forEach((x) => {
          const amount = parseFloat(x.lc_amount) || 0;
          if (x.sign === 'Debit') {
            totalDebit += amount;
          } else if (x.sign === 'Credit') {
            totalCredit += amount;
          }

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
            pair_id: x.pair_id,
          };
        });

        setTotalDebit(Math.round(totalDebit * 100) / 100);
        setTotalCredit(Math.round(totalCredit * 100) / 100);

        return { ...editRows };
      });
    }
  }, [journalVoucherData]);

  // Restore form data if returning from Rate of Exchange page
  useEffect(() => {
    if (restoreValuesFromStore) {
      const savedFormData = getFormValues('journalVoucher');
      if (savedFormData) {
        setRows(savedFormData.rows);
        setTotalDebit(Math.round((savedFormData.totalDebit || 0) * 100) / 100);
        setTotalCredit(Math.round((savedFormData.totalCredit || 0) * 100) / 100);
        setAddedAttachments(savedFormData.addedAttachments);
        // Clear the saved data after restoring
        clearFormValues('journalVoucher');
        clearLastVisitedPage('journalVoucher');
      }
    }
  }, [restoreValuesFromStore, getFormValues, clearFormValues, clearLastVisitedPage]);

  // Notify parent of form data changes
  useEffect(() => {
    onFormDataChange?.({
      rows,
      totalDebit,
      totalCredit,
      addedAttachments,
    });
  }, [rows, totalDebit, totalCredit, addedAttachments, onFormDataChange]);

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
  const handleRateChange = useCallback((rateData) => {
    if (rateData.isError) {
      showModal(
        'Exchange Rate Control',
        <>
          Exchange Rate for {rateData.currency}
          <br />
          Range: {rateData.minRange?.toFixed(8)} - {rateData.maxRange?.toFixed(8)}
          <br />
          Your selected rate is {rateData.currentRate?.toFixed(8)}
          <br />
          Your selected rate is outside this range
        </>,
        () => closeModal(),
        'error'
      );
    }
  }, [showModal]);

  // Expose updateField globally for modal callback
  React.useEffect(() => {
    window.updateJVRowField = updateField;
    return () => {
      delete window.updateJVRowField;
    };
  }, [updateField]);

  const handleSubmit = () => {
    const roundedDebit = Math.round(totalDebit * 100) / 100;
    const roundedCredit = Math.round(totalCredit * 100) / 100;
    if (roundedDebit - roundedCredit !== 0) {
      setShowError(true);
      return;
    }
    // Check for any rows with rate validation errors (not just any error)
    const firstRateErrorRow = Object.values(rows).find((row) => {
      // It's a rate error if:
      // 1. row.error is true (manually edited out of range)
      // 2. OR it has a currency but rate is empty/zero
      const isRateEmptyOrZero = !row.rate || row.rate === '' || row.rate === '0' || row.rate === 0;
      return row.currency_id && (row.error === true || isRateEmptyOrZero);
    });

    if (firstRateErrorRow) {
      handleRateChange({
        rowId: firstRateErrorRow.id,
        currencyId: firstRateErrorRow.currency_id,
        currentRate: parseFloat(firstRateErrorRow.rate) || 0,
        minRange: parseFloat(firstRateErrorRow.minRange),
        maxRange: parseFloat(firstRateErrorRow.maxRange),
        currency: currencyOptions.find(opt => opt.value === firstRateErrorRow.currency_id)?.label || 'Unknown',
        isError: true
      });
      return;
    }

    let payload = {
      ...rows,
    };

    // Remove rows that have empty values
    let transactions = Object.fromEntries(
      Object.entries(payload).filter(([_, obj]) => {
        // Check if row is completely empty (no ledger, account, amount, narration)
        const isEmpty = !obj.ledger && !obj.account_id && !obj.fc_amount && !obj.narration;
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

    transactions = Object.values(transactions).map(({ id, ...rest }) => rest);

    const transformedTransactions = transactions?.reduce((acc, t, index) => {
      Object.entries(t).forEach(([key, value]) => {
        acc[`transactions[${index}][${key}]`] = value;
      });
      return acc;
    }, {});

    payload = {
      total_debit: Math.round(totalDebit * 100) / 100,
      total_credit: Math.round(totalCredit * 100) / 100,
      ...transformedTransactions,
      ...addedAttachments,
      date,
    };

    createJournalVoucherMutation.mutate(payload);
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

  if (isError) {
    console.log(error);
  }

  useEffect(() => {
    if (!cloneJV) {
      handleResetRows();
    }
  }, [cloneJV]);

  // Check if any row has validation error
  const hasRowErrors = Object.values(rows).some((row) => row.error === true);

  return (
    <>
      <Row>
        <Col>
          <CustomTable
            hasFilters={false}
            headers={journalVoucherHeaders}
            isPaginated={false}
            className={`inputTable ${showSubmitError || hasRowErrors ? 'validation-error' : ''}`}
            isLoading={isLoading}
            hideSearch
            hideItemsPerPage
          >
            <tbody>
              {isError ? (
                <tr>
                  <td colSpan={journalVoucherHeaders.length}>
                    <p className="text-danger mb-0">
                      Unable to fetch data at this time
                    </p>
                  </td>
                </tr>
              ) : isNullOrEmpty(journalVoucherData?.journal_vouchers) &&
                !!cloneJV ? (
                <tr>
                  <td colSpan={journalVoucherHeaders.length}>
                    <p className="text-danger mb-0">
                      No Journal Voucher found for ID {cloneJV}
                    </p>
                  </td>
                </tr>
              ) : (
                Object.values(rows).map((row, index) => (
                  <JournalVoucherRow
                    date={date}
                    key={row.id}
                    inputErrorClass={inputErrorClass}
                    row={row}
                    length={Object.values(rows).length}
                    index={index}
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
                ))
              )}
            </tbody>
          </CustomTable>
          {showSubmitError && !isDisabled && (
            <p className="text-danger">
              Please fill all fields in a row to save
            </p>
          )}
          <div className="d-flex justify-content-between gap-3 mt-45 mb-5">
            <div className="d-flex flex-column gap-2">
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
              <FileDisplayList
                files={addedAttachments}
                onRemoveFile={handleRemoveFile}
              />
            </div>
            <div className="d-flex flex-column gap-2 mt-1">
              <CustomInput
                name="totalDebit"
                label={'Total Debit'}
                labelClass={'fw-medium'}
                type="number"
                showBorders={isDisabled}
                disabled={isDisabled}
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
                showBorders={isDisabled}
                disabled={isDisabled}
                readOnly
                error={false}
                borderRadius={10}
                value={formatNumberForDisplay(totalCredit, 2)}
              />
              <CustomInput
                name="difference"
                label={'Difference'}
                labelClass={'fw-medium'}
                type="number"
                showBorders={isDisabled}
                disabled={isDisabled}
                readOnly
                error={false}
                borderRadius={10}
                value={formatNumberForDisplay(totalDebit - totalCredit, 2)}
                onChange={() => {
                  Math.round((totalDebit - totalCredit) * 100) / 100 !== 0 &&
                    setShowError(false);
                }}
              />
              {Math.round((totalDebit - totalCredit) * 100) / 100 !== 0 &&
                showError && (
                  <p className="text-danger">Difference must be 0</p>
                )}
            </div>
          </div>
        </Col>
      </Row>
      <VoucherNavigationBar
        isDisabled={isDisabled}
        actionButtons={[
          { text: 'Add Rows', onClick: handleAddRows },
          { text: 'Save', onClick: handleSubmit },
          {
            text: 'Cancel',
            onClick: handleResetRows,
            variant: 'secondaryButton',
          },
        ]}
        loading={createJournalVoucherMutation.isPending}
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

export default withModal(NewJournalVoucher);
