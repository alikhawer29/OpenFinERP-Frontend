/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import { showToast } from '../../../Components/Toast/Toast.jsx';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import {
  checkTransactionLockStatus,
  lockTransaction,
} from '../../../Services/Process/TransactionLock';
import {
  deleteInternalPaymentVoucher,
  getInternalPaymentVoucherListing,
} from '../../../Services/Transaction/InternalPaymentVoucher.js';
import { internalPaymentVoucherHeaders } from '../../../Utils/Constants/TableHeaders';
import { formatNumberForDisplay, isNullOrEmpty, showErrorToast } from '../../../Utils/Utils';

const ViewInternalPaymentVoucher = ({
  setPageState,

  searchTerm,
  setDate,
  setWriteTerm,
  setSearchTerm,
  lastVoucherNumbers,
  permissions,
  hasViewPermission,
  hasEditPermission,
  hasDeletePermission,
  hasPrintPermission,
}) => {
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const voucherName = 'internal_payment_voucher';

  const queryClient = useQueryClient();
  const {
    data: { data: [paymentVoucherData] = [] } = {},
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ['internalPaymentVoucher', searchTerm],
    queryFn: () => getInternalPaymentVoucherListing({ search: searchTerm }),
    staleTime: 1000 * 60 * 5,
  });

  const paymentVoucher = paymentVoucherData?.internal_payment_vouchers;
  const ipvVatDetails =
    paymentVoucherData?.internal_payment_vouchers?.vat_details;

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
  const deleteInternalPaymentVoucherMutation = useMutation({
    mutationFn: (id) => deleteInternalPaymentVoucher(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['internalPaymentVoucher', searchTerm]);
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
          <p className="text-danger text-center">
            No Internal Payment Voucher found for ID {searchTerm}
          </p>
        </div>
      </>
    );
  }

  if (!hasViewPermission) {
    return (
      <div className="d-card text-center">
        <p className="text-danger mb-0">You are not authorized to view this internal payment voucher</p>
      </div>
    );
  }

  // Debug actionButtons
  const actionButtons = [
    ...(hasEditPermission ? [
      {
        text: 'Edit',
        onClick: handleEdit,
        disabled:
          isLoadingLockStatus ||
          isErrorLockStatus ||
          errorLockStatus?.detail?.locked,
      },
    ] : []),
    ...(hasDeletePermission ? [
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
  ];


  return (
    <>
      <div className="d-card">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7 mb-4">
            <div className="row text-capitalize">
              {[
                {
                  label: 'Ledger',
                  value: paymentVoucher?.ledger,
                },
                {
                  label: 'Credit Account',
                  value: paymentVoucher?.credit_account_details?.title,
                },

                {
                  label: 'Cost Center',
                  value: paymentVoucher?.cost_center?.code,
                },
                {
                  label: 'Mode',
                  value: paymentVoucher?.mode,
                },
                {
                  label: 'Paid From Account',
                  value: paymentVoucher?.mode_account_id?.account_name,
                },
                {
                  label: 'Cheque Number',
                  value: paymentVoucher?.cheque?.cheque_number,
                },
                {
                  label: 'Due Date',
                  value: paymentVoucher?.due_date,
                },
                {
                  label: 'Currency',
                  value: paymentVoucher?.currency?.currency_code,
                },
                {
                  label: 'Amount',
                  value: paymentVoucher?.amount,
                },
                {
                  label: 'Narration',
                  value: paymentVoucher?.narration,
                },
              ].map((x, i) => {
                if (isNullOrEmpty(x.value)) return null;
                return (
                  <div key={i} className="col-12 col-sm-6 mb-4">
                    <p className="detail-title detail-label-color mb-1">
                      {x.label}
                    </p>
                    <p className="detail-text wrapText mb-0">{x.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <CustomTable
          displayCard={false}
          headers={internalPaymentVoucherHeaders.filter((h) => h !== 'Action')}
          isPaginated={false}
          hideSearch
          hideItemsPerPage
        >
          <tbody>
            {ipvVatDetails && ipvVatDetails.length > 0 ? (
              ipvVatDetails.map((x, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{x.ledger}</td>
                  <td>{x.debit_account_details?.title}</td>
                  <td>{x.narration}</td>
                  <td>{formatNumberForDisplay(x.amount, 2)}</td>
                  <td>
                    {x.vat_percentage !== null && x.vat_percentage !== undefined ? `${x.vat_terms} - ${x.vat_percentage}%` : x.vat_terms || "-"}
                  </td>
                  <td>{x.vat_amount ? formatNumberForDisplay(x.vat_amount, 2) : "-"}</td>
                  <td>{formatNumberForDisplay(x.total, 2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8">No VAT details available</td>
              </tr>
            )}
          </tbody>
        </CustomTable>
      </div>

      <VoucherNavigationBar
        isDisabled={isLoading || isError || isNullOrEmpty(paymentVoucher)}
        actionButtons={actionButtons}
        loading={isLoading || isFetching}
        onAttachmentClick={() => setShowAttachmentsModal(true)}
        lastVoucherNumbers={lastVoucherNumbers}
        setPageState={setPageState}
        setSearchTerm={setSearchTerm}
      />
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
            deleteInternalPaymentVoucherMutation.mutate(
              paymentVoucherData.voucher_no
            );
          }
        }}
        title="Delete"
        description={`Are you sure you want to delete Internal Payment Voucher ${searchTerm}?`}
        disableClick={deleteInternalPaymentVoucherMutation.isPending} // Disable modal actions while loading
      />
    </>
  );
};

export default ViewInternalPaymentVoucher;
