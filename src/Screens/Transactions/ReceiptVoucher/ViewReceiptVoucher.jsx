import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CustomModal from '../../../Components/CustomModal';
import { showToast } from '../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import {
  deleteReceiptVoucher,
  getReceiptVoucherListing,
} from '../../../Services/Transaction/ReceiptVoucher';
import {
  formatDate,
  formatNumberForDisplay,
  isNullOrEmpty,
  showErrorToast,
} from '../../../Utils/Utils';
import {
  checkTransactionLockStatus,
  lockTransaction,
} from '../../../Services/Process/TransactionLock';

const ViewReceiptVoucher = ({
  searchTerm,
  setDate,
  setWriteTerm,
  setSearchTerm,
  setPageState,
  lastVoucherNumbers,
  hasViewPermission,
  hasEditPermission,
  hasDeletePermission,
  hasPrintPermission,
}) => {
  const queryClient = useQueryClient();
  const voucherName = 'receipt_voucher';
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const {
    data: { data: [receiptVoucherData] = [] } = {},
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ['receiptVoucher', searchTerm],
    queryFn: () => getReceiptVoucherListing({ search: searchTerm }),
    staleTime: 1000 * 60 * 5,
  });
  const receiptVoucher = receiptVoucherData?.receipt_vouchers;

  // Check Transaction lock status to enable/disable
  const {
    isLoading: isLoadingLockStatus,
    isError: isErrorLockStatus,
    error: errorLockStatus,
  } = useQuery({
    queryKey: ['lock_status', voucherName, receiptVoucherData?.id],
    queryFn: () =>
      checkTransactionLockStatus({
        transaction_type: voucherName,
        transaction_id: receiptVoucherData?.id,
      }),
    enabled: !isNullOrEmpty(receiptVoucherData),
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
    if (receiptVoucherData?.voucher_no) {
      setDate(receiptVoucherData.date);
      setWriteTerm(receiptVoucherData.voucher_no);
    }
  }, [receiptVoucherData?.voucher_no]);

  // Mutation for delete
  const deleteReceiptVoucherMutation = useMutation({
    mutationFn: (id) => deleteReceiptVoucher(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['receiptVoucher', searchTerm]);
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
      setShowDeleteModal(false);
      showErrorToast(error);
    },
  });

  // Navigation Actions
  const handleEdit = () => {
    lockTransactionMutation.mutate({
      transaction_type: voucherName,
      transaction_id: receiptVoucherData?.id,
    });
    setPageState('edit');
  };
  const handleDelete = () => {
    setShowDeleteModal(true);
  };
  const handlePrint = () => {
    if (receiptVoucherData?.pdf_url) {
      window.open(receiptVoucherData?.pdf_url, '_blank');
    }
  };
  let scText = receiptVoucherData?.special_commission_text;

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

  if (isError) {
    return (
      <>
        <div className="d-card">
          <p className="text-danger">{error.message}</p>
        </div>
      </>
    );
  }
  if (isNullOrEmpty(receiptVoucher)) {
    return (
      <>
        <div className="d-card">
          <p className="text-danger">
            No Receipt Voucher found for ID {searchTerm}
          </p>
        </div>
      </>
    );
  }

  if (!hasViewPermission) {
    return (
      <div className="d-card text-center">
        <p className="text-danger">You are not authorized to view this receipt voucher</p>
      </div>
    );
  }

  return (
    <>
      <div className="d-card">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7 mb-4">
            <div className="row">
              {[
                {
                  label: 'Ledger',
                  value: receiptVoucher?.new_ledger,
                },
                {
                  label: 'Account',
                  value: receiptVoucher?.account_details?.title,
                },
                {
                  label: 'Received From',
                  value: receiptVoucher?.received_from?.name,
                },
                {
                  label: 'Mode',
                  value: receiptVoucher?.mode,
                },
                {
                  label: 'Mode Account',
                  value: receiptVoucher?.mode_account_id?.account_name,
                },
                {
                  label: `Party's Bank`,
                  value: receiptVoucher?.party_bank,
                },
                {
                  label: 'Cheque Number',
                  value: receiptVoucher?.cheque_number,
                },
                {
                  label: 'Due Date',
                  value: formatDate(receiptVoucher?.due_date),
                },
                {
                  label: 'Narration',
                  value: receiptVoucher?.narration,
                },
                {
                  label: 'Currency',
                  value: receiptVoucher?.amount_account_id?.currency_code,
                },
                {
                  label: 'Amount',
                  value: formatNumberForDisplay(receiptVoucher?.amount, 2),
                },
                {
                  label: 'Commission Type',
                  value: receiptVoucher?.commission_type,
                },
                {
                  label: 'Commission %',
                  value: receiptVoucher?.commission ? `${receiptVoucher?.commission} %` : null,
                },
                {
                  label: 'Commission Amount',
                  value:
                    Number(receiptVoucher?.commission_amount) > 0
                      ? formatNumberForDisplay(
                        receiptVoucher?.commission_amount,
                        2
                      )
                      : null,
                },
                {
                  label: 'VAT Terms',
                  value: receiptVoucher?.vat_terms && receiptVoucher?.vat_percentage
                    ? `${receiptVoucher?.vat_terms} - ${receiptVoucher?.vat_percentage}%`
                    : null,
                },
                {
                  label: 'VAT Amount',
                  value: receiptVoucher?.vat_amount ? formatNumberForDisplay(receiptVoucher?.vat_amount, 2) : null,
                },
                {
                  label: 'Received Net Total',
                  value: formatNumberForDisplay(receiptVoucher?.net_total, 2),
                },

                {
                  label: 'Out of Scope Reason',
                  value: receiptVoucher?.out_of_scope_reason,
                },
              ].map((x, i) => {
                return (
                  <div
                    key={i}
                    className={`col-12 ${x.label === 'Comment' || x.label === 'Narration'
                      ? ''
                      : 'col-sm-6'
                      } mb-4`}
                  >
                    <p className="detail-title detail-label-color mb-1">
                      {x.label}
                    </p>
                    <p className="detail-text wrapText mb-0">
                      {isNullOrEmpty(x.value) ? '-' : x.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="col-0 col-xxl-2" />
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-3">
            <div className="row">
              {/* Right side cards */}
              <div className="col-12 mb-5" style={{ maxWidth: '350px' }}>
                {/* <AccountBalanceCard />
                <ExchangeRatesCard rates={MOCK_EXCHANGE_RATES} /> */}
              </div>
            </div>
          </div>
          <div className="d-flex justify-content-between flex-wrap">
            {scText && (
              <p className="wrapText mb-0">
                <span
                  className={`${scText?.includes('payable') ? 'text-danger' : 'text-success'
                    }`}
                >
                  {scText ? scText : '-'}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
      <VoucherNavigationBar
        isDisabled={isLoading || isError || isNullOrEmpty(receiptVoucher)}
        actionButtons={[
          ...(hasEditPermission && receiptVoucher?.can_edit_delete ? [
            {
              text: 'Edit',
              onClick: handleEdit,
              disabled:
                isLoadingLockStatus ||
                isErrorLockStatus ||
                errorLockStatus?.detail?.locked,
            },
          ] : []),
          ...(hasDeletePermission && receiptVoucher?.can_edit_delete ? [
            {
              text: 'Delete',
              onClick: handleDelete,
              variant: 'secondaryButton',
              disabled:
                isLoadingLockStatus ||
                isErrorLockStatus ||
                errorLockStatus?.detail?.locked,
            },
          ] : []),
          ...(hasPrintPermission ? [
            ...(receiptVoucherData?.pdf_url
              ? [
                {
                  text: 'Print',
                  onClick: handlePrint,
                  variant: 'secondaryButton',
                },
              ]
              : []),
          ] : []),
        ]}
        loading={isLoading || isFetching}
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
          viewOnly
          showModal={showAttachmentsModal}
          item={receiptVoucherData}
          closeUploader={() => setShowAttachmentsModal(false)}
        />
      </CustomModal>

      {/* Delete Modal */}
      <CustomModal
        show={showDeleteModal}
        close={() => {
          setShowDeleteModal(false); // Close the modal on cancel
        }}
        action={() => {
          if (receiptVoucherData) {
            deleteReceiptVoucherMutation.mutate(receiptVoucherData.voucher_no);
          }
        }}
        title="Delete"
        description={`Are you sure you want to delete Receipt Voucher ${receiptVoucherData.voucher_no}?`}
        disableClick={deleteReceiptVoucherMutation.isPending}
      />
    </>
  );
};

export default ViewReceiptVoucher;
