import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CustomModal from '../../../Components/CustomModal';
import { showToast } from '../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import {
  checkTransactionLockStatus,
  lockTransaction,
} from '../../../Services/Process/TransactionLock';
import {
  deleteForeignCurrencyDeal,
  getForeignCurrencyDealListingOrDetails,
} from '../../../Services/Transaction/ForeignCurrencyDeal';
import { isNullOrEmpty, showErrorToast } from '../../../Utils/Utils';
import { formatNumberWithCommas, formatRateValue } from '../../../Utils/Helpers';

const ViewForeignCurrencyDeal = ({
  searchTerm,
  setDate,
  setWriteTerm,
  setSearchTerm,
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
  const voucherName = 'foreign_currency_deal';

  const {
    data: { data: [foreignCurrencyDealData] = [] } = {},
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ['foreignCurrencyDeal', searchTerm],
    queryFn: () =>
      getForeignCurrencyDealListingOrDetails({
        search: searchTerm,
      }),
    refetchOnWindowFocus: false,
  });

  const foreignCurrencyDeal = foreignCurrencyDealData?.foreign_currency_deal;
  useEffect(() => {
    if (foreignCurrencyDealData?.voucher_no) {
      setDate(foreignCurrencyDeal?.voucher_date);
      setWriteTerm(foreignCurrencyDealData?.voucher_no);
    }
  }, [foreignCurrencyDealData?.voucher_no]);

  // Check Transaction lock status to enable/disable actions
  const {
    isLoading: isLoadingLockStatus,
    isError: isErrorLockStatus,
    error: errorLockStatus,
  } = useQuery({
    queryKey: ['lock_status', voucherName, foreignCurrencyDealData?.id],
    queryFn: () =>
      checkTransactionLockStatus({
        transaction_type: voucherName,
        transaction_id: foreignCurrencyDealData?.id,
      }),
    enabled: !isNullOrEmpty(foreignCurrencyDealData),
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

  // Delete Mutation
  const deleteForeignCurrencyDealMutation = useMutation({
    mutationFn: (id) => deleteForeignCurrencyDeal(id),
    onSuccess: (_, variables) => {
      showToast('Foreign Currency Deal deleted successfully!', 'success');
      queryClient.invalidateQueries(['foreignCurrencyDeal', searchTerm]);
      queryClient.invalidateQueries(['voucherNumber', searchTerm]);
      queryClient.invalidateQueries(['voucherNumber', variables]);
      queryClient.invalidateQueries(['voucherNumber', '']);
      setShowDeleteModal(false);
      setPageState('new'); // Show disabled page
      setWriteTerm('');
      setSearchTerm('');
      setDate(''); // Clear date to prevent query with old searchTerm
    },
    onError: (error) => {
      setShowDeleteModal(false);
      showErrorToast(error);
    },
  });

  const handleEdit = () => {
    lockTransactionMutation.mutate({
      transaction_type: voucherName,
      transaction_id: foreignCurrencyDealData?.id,
    });
    setPageState('edit');
  };

  if (isError) {
    showErrorToast(error);
    return (
      <div className="d-card">
        <p className="text-danger mb-0">Error fetching Foreign Currency Deal</p>
      </div>
    );
  }

  if (isLoading || isFetching) {
    return (
      <div className="d-card">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <div className="row mb-3">
              {Array.from({ length: 10 }).map((_, i) => (
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!foreignCurrencyDeal) {
    return (

      <div className="d-card">
        <p className="text-danger mb-0">
          No Foreign Currency Deal found for ID {searchTerm}
        </p>
      </div>

    );
  }

  if (!hasViewPermission) {
    return (
      <div className="d-card text-center">
        <p className="text-danger">You are not authorized to view this foreign currency deal</p>
      </div>
    );
  }

  let scText = foreignCurrencyDealData?.special_commission_text;

  return (
    <>
      <div className="d-card">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7 mb-4">
            <div className="row">
              {[
                {
                  label: 'Dr. Ledger',
                  value: foreignCurrencyDeal?.new_debit_ledger
                    ? `${foreignCurrencyDeal?.new_debit_ledger} - ${foreignCurrencyDeal?.debit_account_details?.title}`
                    : null,
                },
                {
                  label: 'Cr. Ledger',
                  value: foreignCurrencyDeal?.new_credit_ledger
                    ? `${foreignCurrencyDeal?.new_credit_ledger} - ${foreignCurrencyDeal?.credit_account_details?.title}`
                    : null,
                },
                {
                  label: 'Buy FCY (Dr)',
                  value: foreignCurrencyDeal?.buy_fcy?.currency_code
                    ? `${foreignCurrencyDeal?.buy_fcy?.currency_code} ${formatNumberWithCommas(
                      foreignCurrencyDeal?.buy_fcy_dr_amount,

                    )}`
                    : null,
                },
                {
                  label: 'Sell FC (cr)',
                  value: foreignCurrencyDeal?.sell_fcy?.currency_code
                    ? `${foreignCurrencyDeal?.sell_fcy?.currency_code} ${formatNumberWithCommas(
                      foreignCurrencyDeal?.sell_fc_cr_amount,

                    )}`
                    : null,
                },
                {
                  label: 'Rate',
                  value: formatRateValue(foreignCurrencyDeal?.rate),
                },
                {
                  label: 'Commission',
                  value: parseFloat(foreignCurrencyDeal?.commission)
                    ? `${foreignCurrencyDeal?.commission_fcy?.currency_code} ${formatNumberWithCommas(
                      foreignCurrencyDeal?.commission,

                    )}`
                    : null,
                },
                {
                  label: 'Base Rates',
                  value: formatRateValue(foreignCurrencyDeal?.base_rates),
                },

                {
                  label: 'Commission Type',
                  value: foreignCurrencyDeal?.commission_type
                    ? foreignCurrencyDeal.commission_type.charAt(0).toUpperCase() +
                    foreignCurrencyDeal.commission_type.slice(1)
                    : null,
                },
                {
                  label: 'Narration',
                  value: foreignCurrencyDeal?.narration,
                },
                {
                  label: 'Comment',
                  value: foreignCurrencyDeal?.comment,
                },
              ].map((x, i) => {
                return (
                  <div key={i} className="col-12 col-sm-6 mb-4">
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
        </div>
        {scText && (
          <p className="wrapText mb-0">
            <span
              className={`${scText?.includes('payable')
                ? 'text-danger'
                : scText?.includes('receivable')
                  ? 'text-success'
                  : ''
                }`}
            >
              {scText}
            </span>
          </p>
        )}
      </div>
      <VoucherNavigationBar
        searchTerm={searchTerm}
        actionButtons={[
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
              onClick: () => setShowDeleteModal(true),
              variant: 'secondaryButton',
              disabled:
                isLoadingLockStatus ||
                isErrorLockStatus ||
                errorLockStatus?.detail?.locked,
            },
          ] : []),
          ...(hasPrintPermission ? [
            ...(foreignCurrencyDealData?.pdf_url
              ? [
                {
                  text: 'Print',
                  onClick: () => {
                    if (foreignCurrencyDealData?.pdf_url) {
                      window.open(foreignCurrencyDealData?.pdf_url, '_blank');
                    }
                  },
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
        setWriteTerm={setWriteTerm}
        setSearchTerm={setSearchTerm}
      />
      {/* Attachments Modal */}
      <CustomModal
        show={showAttachmentsModal}
        close={() => setShowAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          viewOnly
          item={foreignCurrencyDealData}
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
          if (foreignCurrencyDeal) {
            deleteForeignCurrencyDealMutation.mutate(
              foreignCurrencyDealData.voucher_no
            );
          }
        }}
        title="Delete"
        description={`Are you sure you want to delete Foreign Currency Deal ${foreignCurrencyDealData?.voucher_no}?`}
        disableClick={deleteForeignCurrencyDealMutation.isPending}
      />
    </>
  );
};

export default ViewForeignCurrencyDeal;
