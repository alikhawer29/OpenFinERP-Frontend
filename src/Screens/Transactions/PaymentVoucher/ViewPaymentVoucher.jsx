import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CustomModal from '../../../Components/CustomModal';
import { showToast } from '../../../Components/Toast/Toast.jsx';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import {
  checkTransactionLockStatus,
  lockTransaction,
} from '../../../Services/Process/TransactionLock';
import {
  deletePaymentVoucher,
  getPaymentVoucherListing,
} from '../../../Services/Transaction/PaymentVoucher.js';
import {
  formatDate,
  formatNumberForDisplay,
  isNullOrEmpty,
  showErrorToast,
} from '../../../Utils/Utils';

const ViewPaymentVoucher = ({
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
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const voucherName = 'payment_voucher';

  const apiBaseUrl = import.meta.env.VITE_MILESTONE_BASE_URL;

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '';
    return formatNumberForDisplay(value, 2);
  };

  const queryClient = useQueryClient();
  const {
    data: { data: [paymentVoucherData] = [] } = {},
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ['paymentVoucher', searchTerm],
    queryFn: () => getPaymentVoucherListing({ search: searchTerm }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true
  });

  const paymentVoucher = paymentVoucherData?.payment_vouchers;

  useEffect(() => {
    if (paymentVoucherData?.voucher_no) {
      setDate(paymentVoucherData.date);
      setWriteTerm(paymentVoucherData.voucher_no);
    }
  }, [paymentVoucherData?.voucher_no]);

  // Check Transaction lock status to enable/disable actions
  const {
    isLoading: isLoadingLockStatus,
    isError: isErrorLockStatus,
    error: errorLockStatus,
  } = useQuery({
    queryKey: ['lock_status', voucherName, paymentVoucherData?.id],
    queryFn: () =>
      checkTransactionLockStatus({
        transaction_type: voucherName,
        transaction_id: paymentVoucherData?.id,
      }),
    enabled: !isNullOrEmpty(paymentVoucherData),
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

  // Mutation for delete
  const deletePaymentVoucherMutation = useMutation({
    mutationFn: (id) => deletePaymentVoucher(id),
    onSuccess: (_, variables) => {
      // Invalidate with current searchTerm first
      queryClient.invalidateQueries(['paymentVoucher', searchTerm]);
      queryClient.invalidateQueries(['voucherNumber', searchTerm]);
      // Also invalidate with the deleted voucher number to ensure navigation updates
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
      transaction_id: paymentVoucherData?.id,
    });
    setPageState('edit');
  };
  const handleDelete = () => {
    setShowDeleteModal(true);
  };
  const handlePrint = () => {
    if (paymentVoucherData?.pdf_url) {
      window.open(paymentVoucherData?.pdf_url, '_blank');
    }
  };

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
  if (isNullOrEmpty(paymentVoucher)) {
    return (
      <>
        <div className="d-card">
          <p className="text-danger">
            No Payment Voucher found for ID {searchTerm}
          </p>
        </div>
      </>
    );
  }

  let scText = paymentVoucherData?.special_commission_text;
  if (!hasViewPermission) {
    return (
      <div className="d-card text-center">
        <p className="text-danger">You are not authorized to view this payment voucher</p>
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
                { label: 'Ledger', value: paymentVoucher?.new_ledger },
                {
                  label: 'Account',
                  value: paymentVoucher?.account_details?.title,
                },
                {
                  label: 'Paid to Account',
                  value: paymentVoucher?.paid_to?.name,
                },
                { label: 'Mode', value: paymentVoucher?.mode },
                {
                  label: 'Paid from Account',
                  value: paymentVoucher?.mode_account_id?.account_name,
                },
                {
                  label: 'Cheque Number',
                  value: paymentVoucher?.cheque_number,
                },
                {
                  label: 'Due Date',
                  value: formatDate(paymentVoucher?.due_date),
                },
                { label: 'Narration', value: paymentVoucher?.narration },
                {
                  label: 'Currency',
                  value: paymentVoucher?.currency?.currency_code,
                },
                {
                  label: 'Amount',
                  value:
                    Number(paymentVoucher?.amount) > 0
                      ? formatNumberForDisplay(paymentVoucher?.amount, 2)
                      : null,
                },
                {
                  label: 'Commission Type',
                  value: paymentVoucher?.commission_type,
                },
                {
                  label: 'Commission Percentage',
                  value: Number(paymentVoucher?.commission) > 0 ? `${paymentVoucher?.commission} %` : null,
                },
                {
                  label: 'Commission Amount',
                  value:
                    Number(paymentVoucher?.commission_amount) > 0
                      ? formatNumberForDisplay(
                        paymentVoucher?.commission_amount,
                        2
                      )
                      : null,
                },
                {
                  label: 'VAT Terms',
                  value:
                    paymentVoucher?.vat_terms && paymentVoucher?.vat_percentage
                      ? `${paymentVoucher?.vat_terms} - ${paymentVoucher?.vat_percentage}%`
                      : null,
                },
                {
                  label: 'VAT Amount',
                  value:
                    Number(paymentVoucher?.vat_amount) > 0
                      ? formatNumberForDisplay(paymentVoucher?.vat_amount, 2)
                      : null,
                },
                {
                  label: 'Net Paid',
                  value:
                    Number(paymentVoucher?.net_total) > 0
                      ? formatNumberForDisplay(paymentVoucher?.net_total, 2)
                      : null,
                },
                { label: 'Comment', value: paymentVoucher?.comment },
                { label: 'Signature', value: paymentVoucher?.signature },
              ].map((x, i) => {
                return (
                  <div
                    key={i}
                    className={`col-12 ${x.label === 'Signature' ||
                      x.label === 'Comment' ||
                      x.label === 'Narration'
                      ? ''
                      : 'col-sm-6'
                      } mb-4`}
                  >
                    <p className="detail-title detail-label-color mb-1">
                      {x.label}
                    </p>

                    {x.label === 'Signature' ? (
                      x.value ? (
                        <img
                          src={apiBaseUrl + `/${x.value}`}
                          alt="Signature"
                          style={{ maxWidth: '100%', height: 'auto' }}
                        />
                      ) : (
                        '-'
                      )
                    ) : (
                      <p className="detail-text wrapText mb-0">
                        {isNullOrEmpty(x.value) ? '-' : x.value}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {paymentVoucherData?.special_commission_text && (
            <p className="wrapText mb-0">
              <span
                className={`${paymentVoucherData?.special_commission_text?.includes(
                  'payable'
                )
                  ? 'text-danger'
                  : paymentVoucherData?.special_commission_text?.includes(
                    'receivable'
                  )
                    ? 'text-success'
                    : ''
                  }`}
              >
                {paymentVoucherData?.special_commission_text}
              </span>
            </p>
          )}
        </div>
      </div>
      <VoucherNavigationBar
        actionButtons={[
          hasEditPermission && paymentVoucher?.can_edit_delete && {
            text: 'Edit',
            onClick: handleEdit,
            disabled:
              isLoadingLockStatus ||
              isErrorLockStatus ||
              errorLockStatus?.detail?.locked,
          },
          hasDeletePermission && paymentVoucher?.can_edit_delete && {
            text: 'Delete',
            onClick: handleDelete,
            variant: 'secondaryButton',
            disabled:
              isLoadingLockStatus ||
              isErrorLockStatus ||
              errorLockStatus?.detail?.locked,
          },
          ...(hasPrintPermission ? [
            ...(paymentVoucherData?.pdf_url
              ? [
                {
                  text: 'Print',
                  onClick: handlePrint,
                  variant: 'secondaryButton',
                },
              ]
              : []),
          ] : []),
        ].filter(Boolean)}
        onAttachmentClick={() => setShowAttachmentsModal(true)}
        loading={isLoading || isFetching}
        lastVoucherHeading="Last PV Number"
        lastVoucherNumbers={lastVoucherNumbers}
        setPageState={setPageState}
        setSearchTerm={setSearchTerm}
        setWriteTerm={setWriteTerm}
      />
      {/* Upload Attachements Modal */}
      <CustomModal
        show={showAttachmentsModal}
        close={() => setShowAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          viewOnly
          item={paymentVoucherData}
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
          if (paymentVoucherData) {
            deletePaymentVoucherMutation.mutate(paymentVoucherData.voucher_no);
          }
        }}
        title="Delete"
        description={`Are you sure you want to delete Payment Voucher ${searchTerm}?`}
        disableClick={deletePaymentVoucherMutation.isPending} // Disable modal actions while loading
      />
    </>
  );
};

export default ViewPaymentVoucher;
