import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import { showToast } from '../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import withFilters from '../../../HOC/withFilters ';
import {
  checkTransactionLockStatus,
  lockTransaction,
} from '../../../Services/Process/TransactionLock';
import {
  deleteJournalVoucher,
  getJournalVoucherListing,
} from '../../../Services/Transaction/JournalVoucher';
import { journalVoucherViewHeaders } from '../../../Utils/Constants/TableHeaders';
import { formatNumberForDisplay, isNullOrEmpty, showErrorToast } from '../../../Utils/Utils';

const ViewJournalVoucher = ({
  searchTerm,
  setSearchTerm,
  setWriteTerm,
  setPageState,
  setDate,
  lastVoucherNumbers,
  hasEditPermission,
  hasDeletePermission,
  hasPrintPermission,
  hasViewPermission,
}) => {
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [attachmentsModal, setAttachmentsModal] = useState(false);

  const {
    data: { data: [journalVoucherData] = [] } = {}, // [journalVoucherData] = destructuring array first item
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['journalVoucher', searchTerm],
    queryFn: () => getJournalVoucherListing({ search: searchTerm }),
  });

  // Calculate totals from journal_vouchers array (fallback if API totals are not available)
  const calculatedTotals = journalVoucherData?.journal_vouchers?.reduce(
    (acc, item) => {
      const debitAmount = item.sign === 'Debit' ? parseFloat(item.lc_amount) || 0 : 0;
      const creditAmount = item.sign === 'Credit' ? parseFloat(item.lc_amount) || 0 : 0;
      return {
        totalDebit: acc.totalDebit + debitAmount,
        totalCredit: acc.totalCredit + creditAmount,
      };
    },
    { totalDebit: 0, totalCredit: 0 }
  ) || { totalDebit: 0, totalCredit: 0 };

  // Use API totals if available, otherwise use calculated totals
  const totalDebit = journalVoucherData?.total_debit ? parseFloat(journalVoucherData.total_debit) : calculatedTotals.totalDebit;
  const totalCredit = journalVoucherData?.total_credit ? parseFloat(journalVoucherData.total_credit) : calculatedTotals.totalCredit;



  // Check Transaction lock status to enable/disable
  const {
    isLoading: isLoadingLockStatus,
    isError: isErrorLockStatus,
    error: errorLockStatus,
  } = useQuery({
    queryKey: ['lock_status', 'journal_voucher', journalVoucherData?.id],
    queryFn: () =>
      checkTransactionLockStatus({
        transaction_type: 'journal_voucher',
        transaction_id: journalVoucherData?.id,
      }),
    enabled: !isNullOrEmpty(journalVoucherData),
    retry: false,
  });

  useEffect(() => {
    if (errorLockStatus?.detail?.locked) {
      showToast(errorLockStatus?.message, 'warn');
    }
  }, [errorLockStatus]);

  // Lock Transaction on Edit
  const lockTransactionMutation = useMutation({
    mutationFn: lockTransaction,
  });

  useEffect(() => {
    if (journalVoucherData?.date) {
      setDate(journalVoucherData?.date);
      setWriteTerm(journalVoucherData?.voucher_no);
    }
  }, [journalVoucherData?.date]);
  // Mutation for delete
  const deleteJournalVoucherMutation = useMutation({
    mutationFn: (id) => deleteJournalVoucher(id), // Call the API to delete the package
    onSuccess: (_, variables) => {
      showToast('Journal Voucher deleted successfully!', 'success');
      queryClient.invalidateQueries(['journalVoucher', searchTerm]);
      queryClient.invalidateQueries(['voucherNumber', searchTerm]);
      queryClient.invalidateQueries(['voucherNumber', variables]);
      queryClient.invalidateQueries(['voucherNumber', '']);
      setShowDeleteModal(false);
      setPageState('new');
      setWriteTerm('');
      setSearchTerm('');
      setDate(new Date().toLocaleDateString('en-CA'));
    },
    onError: (error) => {
      showErrorToast(error);
      setShowDeleteModal(false);
    },
  });

  // Navigation Actions
  const handleEdit = () => {
    lockTransactionMutation.mutate({
      transaction_type: 'journal_voucher',
      transaction_id: journalVoucherData?.id,
    });
    setPageState('edit');
  };
  const handleDelete = () => {
    setShowDeleteModal(true);
  };
  const handlePrint = () => {
    if (journalVoucherData?.pdf_url) {
      window.open(journalVoucherData?.pdf_url, '_blank');
    }
  };

  if (isError) {
    showErrorToast(error);
  }

  if (!hasViewPermission) {
    return (
      <div className="d-card text-center">
        <p className="text-danger mb-0">You are not authorized to view this journal voucher</p>
      </div>
    );
  }
  return (
    <>
      <CustomTable
        hasFilters={false}
        headers={journalVoucherViewHeaders}
        isPaginated={false}
        isLoading={isLoading}
        hideItemsPerPage
        hideSearch
      >
        {
          <tbody>
            {isError ? (
              <tr>
                <td colSpan={journalVoucherViewHeaders.length}>
                  <p className="text-danger mb-0">
                    Unable to fetch data at this time
                  </p>
                </td>
              </tr>
            ) : (
              isNullOrEmpty(journalVoucherData?.journal_vouchers) && (
                <tr>
                  <td colSpan={journalVoucherViewHeaders.length}>
                    <p className="text-danger mb-0">
                      No Journal Voucher found for ID {searchTerm}
                    </p>
                  </td>
                </tr>
              )
            )}
            {journalVoucherData?.journal_vouchers?.map((item, index) => (
              <tr key={item.id}>
                <td className='text-center' >{index + 1}</td>
                <td>{item.new_ledger}</td>
                <td>{item.account_details?.title}</td>
                <td>{item?.narration}</td>
                <td>{item.currency?.currency_code}</td>
                <td>{formatNumberForDisplay(item.fc_amount, 2)}</td>
                <td>{formatNumberForDisplay(item.lc_amount, 2)}</td>
                <td>{formatNumberForDisplay(item.rate, 8)}</td>
                <td>{item.sign}</td>
              </tr>
            ))}
          </tbody>
        }
      </CustomTable>
      <div className="d-flex justify-content-end gap-3 mt-45 mb-5">
        <div className="d-flex flex-column gap-2 mt-1">
          {!isLoading && !isError && !isNullOrEmpty(journalVoucherData) && (
            <>
              <CustomInput
                name="totalDebit"
                label={'Total Debit'}
                labelClass={'fw-medium'}
                type="number"
                showBorders={false}
                error={false}
                borderRadius={10}
                value={formatNumberForDisplay(totalDebit || 0, 2)}
                defaultValue={formatNumberForDisplay(totalDebit || 0, 2)}
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
                value={formatNumberForDisplay(totalCredit || 0, 2)}
                defaultValue={formatNumberForDisplay(totalCredit || 0, 2)}
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
                value={formatNumberForDisplay(parseFloat(totalDebit || 0) - parseFloat(totalCredit || 0), 2) || ''}
                defaultValue={formatNumberForDisplay(parseFloat(totalDebit || 0) - parseFloat(totalCredit || 0), 2) || ''}
                readOnly
              />
            </>
          )}
        </div>
      </div>
      <VoucherNavigationBar
        isDisabled={isLoading || isError || isNullOrEmpty(journalVoucherData)}
        actionButtons={[
          hasEditPermission && {
            text: 'Edit',
            onClick: handleEdit,
            disabled:
              isLoadingLockStatus ||
              isErrorLockStatus ||
              errorLockStatus?.detail?.locked,
          },
          hasDeletePermission && {
            text: 'Delete',
            onClick: handleDelete,
            variant: 'secondaryButton',
            disabled:
              isLoadingLockStatus ||
              isErrorLockStatus ||
              errorLockStatus?.detail?.locked,
          },
          hasPrintPermission && {
            text: 'Print',
            onClick: handlePrint,
            variant: 'secondaryButton',
          },
        ].filter(Boolean)} // 👈 removes false entries
        onAttachmentClick={() => setAttachmentsModal(true)}
        lastVoucherNumbers={lastVoucherNumbers}
        setPageState={setPageState}
        setSearchTerm={setSearchTerm}
      />

      {/* Attachements Modal */}
      <CustomModal
        show={attachmentsModal}
        close={() => setAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          viewOnly
          item={journalVoucherData}
          closeUploader={() => setAttachmentsModal(false)}
        />
      </CustomModal>

      {/* Delete Modal */}
      <CustomModal
        show={showDeleteModal}
        close={() => {
          setShowDeleteModal(false);
        }}
        action={() => {
          if (journalVoucherData) {
            deleteJournalVoucherMutation.mutate(journalVoucherData.voucher_no);
          }
        }}
        title="Delete"
        description={`Are you sure you want to delete JV Number ${journalVoucherData?.voucher_no}?`}
        disableClick={deleteJournalVoucherMutation.isPending}
      />
    </>
  );
};

export default withFilters(ViewJournalVoucher);
