import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CustomModal from '../../../Components/CustomModal';
import { showToast } from '../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import {
  deleteSuspenseVoucher,
  getSuspenseVoucherAttachments,
  getSuspenseVoucherListing,
} from '../../../Services/Transaction/SuspenseVoucher';
import { formatNumberForDisplay, isNullOrEmpty, showErrorToast } from '../../../Utils/Utils';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import { suspenseVoucherHeaders } from '../../../Utils/Constants/TableHeaders';
import { statusClassMap } from '../../../Utils/Constants/SelectOptions';
import {
  checkTransactionLockStatus,
  lockTransaction,
} from '../../../Services/Process/TransactionLock';

const ViewSuspenseVoucher = ({
  searchTerm,
  setSearchTerm,
  setWriteTerm,
  setPageState,
  lastVoucherNumbers,
  permissions,
  hasViewPermission,
  hasEditPermission,
  hasDeletePermission,
  hasPrintPermission,
}) => {
  const queryClient = useQueryClient();
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    data: { data: [suspenseVoucherData] = [] } = {},
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ['suspenseVoucher', searchTerm],
    queryFn: () => getSuspenseVoucherListing({ search: searchTerm }),
    staleTime: 1000 * 5, // 5 seconds - data becomes stale quickly
    refetchOnWindowFocus: true, // Only refresh when tab becomes active
  });

  const suspenseVoucher = suspenseVoucherData?.suspense_vouchers;

  const voucherName = 'suspense_voucher';

  // Check Transaction lock status to enable/disable
  const {
    isLoading: isLoadingLockStatus,
    isError: isErrorLockStatus,
    error: errorLockStatus,
  } = useQuery({
    queryKey: ['lock_status', voucherName, suspenseVoucherData?.id],
    queryFn: () =>
      checkTransactionLockStatus({
        transaction_type: voucherName,
        transaction_id: suspenseVoucherData?.id,
      }),
    enabled: !isNullOrEmpty(suspenseVoucherData),
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
    if (suspenseVoucherData?.voucher_no && searchTerm) {
      setSearchTerm(suspenseVoucherData.voucher_no);
      setWriteTerm && setWriteTerm(suspenseVoucherData.voucher_no);
    }
  }, [suspenseVoucherData?.voucher_no, searchTerm, setWriteTerm]);

  // Mutation for delete
  const deleteSuspenseVoucherMutation = useMutation({
    mutationFn: (id) => deleteSuspenseVoucher(id),
    onSuccess: (_, variables) => {
      showToast('Suspense Voucher deleted successfully!', 'success');
      queryClient.invalidateQueries(['suspenseVoucher', searchTerm]);
      queryClient.invalidateQueries(['suspenseVoucherListing']);
      queryClient.invalidateQueries(['voucherNumber', searchTerm]);
      queryClient.invalidateQueries(['voucherNumber', variables]);
      queryClient.invalidateQueries(['voucherNumber', '']);
      setShowDeleteModal(false);
      setPageState('new');
      setWriteTerm('');
      setSearchTerm('');
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
      transaction_id: suspenseVoucherData?.id,
    });
    setPageState('edit');
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handlePrint = () => {
    if (suspenseVoucherData?.pdf_url) {
      window.open(suspenseVoucherData?.pdf_url, '_blank');
    }
  };

  // Check if all rows are settled
  const areAllRowsSettled = () => {
    const rows = suspenseVoucher?.suspense_voucher_rows || [];
    if (rows.length === 0) return false;
    return rows.every((row) => row.status_detail === 'Settle');
  };

  // Check if any row is settled
  const hasAnySettledRow = () => {
    const rows = suspenseVoucher?.suspense_voucher_rows || [];
    return rows.some((row) => row.status_detail === 'Settle');
  };

  const allRowsSettled = areAllRowsSettled();
  const anyRowSettled = hasAnySettledRow();

  if (isLoading || isFetching) {
    return (
      <div className="d-card">
        {/* Header Details Skeleton */}
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7 mb-4">
            <div className="row">
              {[1, 2, 3].map((i) => (
                <div key={i} className="col-12 col-sm-6 mb-4">
                  <Skeleton height={16} width={80} className="mb-1" />
                  <Skeleton height={20} width={200} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>
                  <Skeleton height={20} width={40} />
                </th>
                <th>
                  <Skeleton height={20} width={120} />
                </th>
                <th>
                  <Skeleton height={20} width={100} />
                </th>
                <th>
                  <Skeleton height={20} width={100} />
                </th>
                <th>
                  <Skeleton height={20} width={80} />
                </th>
              </tr>
            </thead>
            <tbody>
              {[1, 2].map((i) => (
                <tr key={i}>
                  <td>
                    <Skeleton height={20} width={30} />
                  </td>
                  <td>
                    <Skeleton height={20} width={250} />
                  </td>
                  <td>
                    <Skeleton height={20} width={80} />
                  </td>
                  <td>
                    <Skeleton height={20} width={80} />
                  </td>
                  <td>
                    <Skeleton height={20} width={60} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="d-card">
        <div className="text-center">
          <p className="text-danger mb-0">
            Unable to fetch Suspense Voucher data at this time
          </p>
        </div>
      </div>
    );
  }

  if (!suspenseVoucherData) {
    return (
      <div className="d-card">
        <div className="text-center">
          <p className="text-muted mb-0">No Suspense Voucher found for ID {searchTerm}</p>
        </div>
      </div>
    );
  }

  if (!hasViewPermission) {
    return (
      <div className="d-card text-center">
        <p className="text-danger">You are not authorized to view this suspense voucher</p>
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
                  label: 'Account',
                  value: suspenseVoucher?.account_details?.title,
                },
                {
                  label: 'Office',
                  value: suspenseVoucher?.office?.office_location,
                },
                {
                  label: 'Currency',
                  value: suspenseVoucher?.currency?.currency_code,
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
          headers={suspenseVoucherHeaders}
          isPaginated={false}
          hideSearch
          hideItemsPerPage
        >
          <tbody>
            {suspenseVoucher?.suspense_voucher_rows?.map((x, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{x.narration}</td>
                <td>{formatNumberForDisplay(x.debit, 2)}</td>
                <td>{formatNumberForDisplay(x.credit, 2)}</td>
                <td>
                  <p
                    className={`text-${statusClassMap[x.status_detail?.toLowerCase()]
                      } mb-0`}
                  >
                    {x.status_detail === 'Settle' ? 'Settled' : x?.status_detail}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </CustomTable>
      </div>
      <VoucherNavigationBar
        actionButtons={[
          // Edit button: Hide only if ALL rows are settled
          ...(hasEditPermission && !allRowsSettled ? [
            {
              text: 'Edit',
              onClick: handleEdit,
              disabled:
                isLoadingLockStatus ||
                isErrorLockStatus ||
                errorLockStatus?.detail?.locked,
            },
          ] : []),
          // Delete button: Hide if ANY row is settled
          ...(hasDeletePermission && !anyRowSettled ? [
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
            ...(suspenseVoucherData?.pdf_url
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
          viewOnly
          item={suspenseVoucherData}
          getAttachmentsService={getSuspenseVoucherAttachments}
          closeUploader={() => setShowAttachmentsModal(false)}
        />
      </CustomModal>

      {/* Delete Modal */}
      <CustomModal
        show={showDeleteModal}
        close={() => {
          setShowDeleteModal(false);
        }}
        action={() => {
          if (suspenseVoucherData) {
            deleteSuspenseVoucherMutation.mutate(
              suspenseVoucherData.voucher_no
            );
          }
        }}
        title="Delete"
        description={`Are you sure you want to delete SV Number ${suspenseVoucherData?.voucher_no}?`}
        disableClick={deleteSuspenseVoucherMutation.isPending}
      />
    </>
  );
};

export default ViewSuspenseVoucher;
