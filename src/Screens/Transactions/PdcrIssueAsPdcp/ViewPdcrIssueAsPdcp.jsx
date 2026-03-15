import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import BackButton from '../../../Components/BackButton';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import { showToast } from '../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import {
  deletePdcrVoucher,
  getPdcrListing,
} from '../../../Services/Transaction/PdcrVoucher';
import { pdcrViewTableHeaders } from '../../../Utils/Constants/TableHeaders';
import {
  formatDate,
  isNullOrEmpty,
  showErrorToast,
} from '../../../Utils/Utils';

const ViewPdcrIssueAsPdcp = ({
  searchTerm,
  setDate,
  setWriteTerm,
  setSearchTerm,
  setPageState,
  lastVoucherNumbers,
  hasPrintPermission,
  hasViewPermission,
  hasEditPermission,
  hasDeletePermission,
  hasCreatePermission,
  disabled = false,
}) => {
  const queryClient = useQueryClient();
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    data: { data: pdcrVoucherData } = {},
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['pdcrVoucher', searchTerm],
    queryFn: () => getPdcrListing({ search: searchTerm }),
    enabled: !!searchTerm, // Only search when we have a searchTerm
  });

  const [isUserInitiatedBack, setIsUserInitiatedBack] = useState(false);

  const voucher = Array.isArray(pdcrVoucherData) ? pdcrVoucherData[0] : null;

  useEffect(() => {
    const voucherFromArray = Array.isArray(pdcrVoucherData)
      ? pdcrVoucherData[0]
      : null;
    if (voucherFromArray?.voucher_no) {
      setDate(voucherFromArray?.date);
      setWriteTerm(voucherFromArray?.voucher_no);
    } else if (!searchTerm) {
      // Clear writeTerm when no searchTerm (for new page)
      setWriteTerm('');
    }
  }, [pdcrVoucherData, searchTerm]);
  const deletePdcrMutation = useMutation({
    mutationFn: (id) => deletePdcrVoucher(searchTerm),
    onSuccess: (data, variables) => {
      showToast(data?.message, 'success');
      setShowDeleteModal(false);

      // Clear all search and form data
      setSearchTerm('');
      setDate(new Date().toLocaleDateString('en-CA'));
      setWriteTerm('');

      // Redirect to new page
      setPageState('new');

      // Clear all cached data
      queryClient.invalidateQueries(['pdcrVoucher']);
      queryClient.removeQueries(['pdcrVoucher']);
      
      // Add navigation query invalidation
      queryClient.invalidateQueries(['voucherNumber', searchTerm]);
      queryClient.invalidateQueries(['voucherNumber', variables]); // Use deleted voucher ID
      queryClient.invalidateQueries(['voucherNumber', '']);
    },
    onError: (error) => {
      setShowDeleteModal(false);
      showErrorToast(error);
    },
  });

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handlePrint = () => {
    if (voucher?.pdf_url) {
      window.open(voucher?.pdf_url, '_blank');
    }
  };

  const handleEdit = () => {
    setPageState('edit');
  };

  // Show loading skeleton when loading or when there's no searchTerm
  if (isLoading || !searchTerm) {
    return (
      <div className="d-card">
        <div className="d-flex flex-column gap-4">
          {/* Loading skeleton */}
          <div className="d-flex gap-3 justify-content-between">
            <div style={{ maxWidth: '500px' }}>
              <Skeleton height={20} width={100} />
              <div className="mt-3">
                <Skeleton height={20} width={200} />
              </div>
              <div className="mt-4">
                <Skeleton height={20} width={100} />
                <Skeleton height={60} width={400} />
              </div>
            </div>
          </div>

          {/* Table loading skeleton */}
          <div className="d-flex justify-content-between">
            <div className="flex-grow-1">
              <table className="table ">
                <thead>
                  <tr>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <th key={i}>
                        <Skeleton width={120} height={20} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <td key={i}>
                        <Skeleton width={80} height={20} />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Navigation buttons skeleton */}
          <div className="d-flex justify-content-between align-items-center">
            <Skeleton height={40} width={120} />
            <div className="d-flex gap-2">
              <Skeleton height={40} width={80} />
              <Skeleton height={40} width={80} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="d-card">
        <div className="text-center py-4">
          <p className="text-danger mb-0">
            {isNullOrEmpty(error?.message)
              ? 'Unable to fetch data at this time'
              : error.message}
          </p>
        </div>
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="d-card">
        <div className="text-center py-4">
          <p className="text-muted mb-0">No PDCR voucher found</p>
        </div>
      </div>
    );
  }
  if (!hasViewPermission) {
    return (
      <div className="d-card">
        <div className="text-center py-4">
          <p className="text-danger mb-0">
            You are not authorized to view PDCR Voucher
          </p>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="d-card">
        <div className="d-flex flex-column gap-4">
          {/* Voucher Information Section */}
          <div className="d-flex gap-3 justify-content-between">
            <div style={{ maxWidth: '500px' }}>
              <div>
                <label>Issued To</label>
                <div className="d-flex gap-2">
                  <span>{voucher?.ledger || '-'}</span> |
                  <span>{voucher?.issued_to || '-'}</span>
                </div>
              </div>
              <div className="mt-4">
                <label>Narration</label>
                <p>{voucher?.narration || '-'}</p>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="d-flex justify-content-between">
            <div className="flex-grow-1">
              <CustomTable
                hasFilters={false}
                headers={pdcrViewTableHeaders}
                hideSearch={true}
                hideItemsPerPage={true}
                isPaginated={false}
                displayCard={false}
                isLoading={isLoading}
              >
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={pdcrViewTableHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}

                  {!isError && !isLoading && voucher && (
                    <tr key={voucher.voucher_id}>
                      <td>
                        {voucher?.selected_voucher_ids?.[0]?.receipt_vouchers
                          ?.account_details?.title || '-'}
                      </td>
                      <td>
                        {voucher?.selected_voucher_ids?.[0]?.receipt_vouchers
                          ?.cheque_number || '-'}
                      </td>
                      <td>
                        {formatDate(
                          voucher?.selected_voucher_ids?.[0]?.receipt_vouchers
                            ?.due_date,
                          'DD/MM/YYYY'
                        ) || '-'}
                      </td>
                      <td>
                        {voucher?.selected_voucher_ids?.[0]?.receipt_vouchers
                          ?.amount_account?.currency_code || '-'}
                      </td>
                      <td>
                        {voucher?.selected_voucher_ids?.[0]?.receipt_vouchers
                          ?.commission_type === 'Expense'
                          ? voucher?.selected_voucher_ids?.[0]?.receipt_vouchers
                              ?.net_total
                          : voucher?.selected_voucher_ids?.[0]?.receipt_vouchers
                              ?.amount || '-'}
                      </td>
                      <td>
                        {voucher?.selected_voucher_ids?.[0]?.receipt_vouchers
                          ?.party_bank || '-'}
                      </td>
                    </tr>
                  )}

                  {!isError && !isLoading && !voucher && (
                    <tr>
                      <td colSpan={pdcrViewTableHeaders.length}>
                        <p className="text-muted mb-0">No data available</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </CustomTable>
            </div>
          </div>

          <VoucherNavigationBar
            isDisabled={
              disabled || isLoading || isError || isNullOrEmpty(voucher)
            }
            actionButtons={[
              ...(hasEditPermission
                ? [
                    {
                      text: 'Edit',
                      onClick: handleEdit,
                    },
                  ]
                : []),
              ...(hasDeletePermission
                ? [
                    {
                      text: 'Delete',
                      onClick: handleDelete,
                      variant: 'secondaryButton',
                    },
                  ]
                : []),
              ...(hasPrintPermission
                ? [
                    ...(voucher?.pdf_url
                      ? [
                          {
                            text: 'Print',
                            onClick: handlePrint,
                            variant: 'secondaryButton',
                          },
                        ]
                      : []),
                  ]
                : []),
            ].filter(Boolean)}
            onAttachmentClick={() => setShowAttachmentsModal(true)}
            loading={isLoading}
            lastVoucherHeading="Last PDCR Number"
            lastVoucherNumbers={lastVoucherNumbers}
            setPageState={setPageState}
            setSearchTerm={setSearchTerm}
          />
        </div>
      </div>

      {/* Attachments Modal */}
      <CustomModal
        show={showAttachmentsModal}
        close={() => setShowAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          item={voucher}
          viewOnly
          closeUploader={() => setShowAttachmentsModal(false)}
        />
      </CustomModal>

      {/* Delete Modal */}
      <CustomModal
        show={showDeleteModal}
        close={() => !deletePdcrMutation.isPending && setShowDeleteModal(false)}
        action={() => {
          if (voucher?.id || voucher?.voucher_id) {
            // Use ID instead of voucher_no for API call
            const deleteId = voucher.id || voucher.voucher_id;
            deletePdcrMutation.mutate(deleteId);
          }
        }}
        description={`Are you sure you want to delete PDCR Voucher ${voucher?.voucher_no}?`}
        title="Delete"
        disableClick={deletePdcrMutation.isPending}
        btn1Text={deletePdcrMutation.isPending ? 'Deleting...' : 'Yes'}
      />
    </>
  );
};

export default ViewPdcrIssueAsPdcp;
