import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CustomModal from '../../../Components/CustomModal';
import { showToast } from '../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import {
  checkTransactionLockStatus,
  lockTransaction,
} from '../../../Services/Process/TransactionLock';
import {
  addAccountToAccountAttachment,
  deleteAccountToAccount,
  deleteAccountToAccountAttachment,
  getAccountBalance,
  getAccountToAccountAttachments,
  getAccountToAccountListing,
} from '../../../Services/Transaction/AccountToAccount';
import { formatNumberForDisplay, isNullOrEmpty } from '../../../Utils/Utils';

const ViewAccountToAccount = ({
  searchTerm,
  setSearchTerm,
  setWriteTerm,
  setPageState,
  lastVoucherNumbers,
  permissions,
  hasPrintPermission,
  hasEditPermission,
  hasDeletePermission,
  hasViewPermission,
}) => {
  const queryClient = useQueryClient();
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const voucherName = 'account_to_account';

  // Fetch main A2A data
  const {
    data: { data: [accountToAccountData] = [] } = {},
    isLoading,
    isError,
    isFetching,
  } = useQuery({
    queryKey: ['accountToAccount', searchTerm],
    queryFn: () => getAccountToAccountListing({ search: searchTerm }),
  });

  // Check Transaction lock status to enable/disable actions
  const {
    isLoading: isLoadingLockStatus,
    isError: isErrorLockStatus,
    error: errorLockStatus,
  } = useQuery({
    queryKey: ['lock_status', voucherName, accountToAccountData?.id],
    queryFn: () =>
      checkTransactionLockStatus({
        transaction_type: voucherName,
        transaction_id: accountToAccountData?.id,
      }),
    enabled: !isNullOrEmpty(accountToAccountData),
    retry: false,
  });

  useEffect(() => {
    if (errorLockStatus?.detail?.locked) {
      showToast(errorLockStatus?.message, 'warn');
    }
  }, [errorLockStatus]);

  // Set write term when voucher data loads
  useEffect(() => {
    if (accountToAccountData?.voucher_no) {
      setWriteTerm && setWriteTerm(accountToAccountData.voucher_no);
    }
  }, [accountToAccountData?.voucher_no, setWriteTerm]);

  // Lock Transaction on Edit
  const lockTransactionMutation = useMutation({
    mutationFn: lockTransaction,
  });

  // Helper function to map ledger to account type
  const mapLedgerToAccountType = (ledger) => {
    switch (ledger?.toLowerCase()) {
      case 'gl':
        return 'general';
      case 'pl':
        return 'party';
      case 'wic':
        return 'walkin';
      default:
        return ledger?.toLowerCase() || 'general';
    }
  };

  // Fetch account balances for debit and credit accounts
  const { data: debitAccountBalance, error: debitBalanceError } = useQuery({
    queryKey: [
      'accountBalance',
      accountToAccountData?.debit_account_details?.id,
    ],
    queryFn: () =>
      getAccountBalance(
        accountToAccountData?.debit_account_details?.id,
        mapLedgerToAccountType(accountToAccountData?.debit_ledger)
      ),
    enabled:
      !!accountToAccountData?.debit_account_details?.id &&
      !!accountToAccountData?.debit_ledger,
  });
  const { data: creditAccountBalance, error: creditBalanceError } = useQuery({
    queryKey: [
      'accountBalance',
      accountToAccountData?.credit_account_details?.id,
    ],
    queryFn: () =>
      getAccountBalance(
        accountToAccountData?.credit_account_details?.id,
        mapLedgerToAccountType(accountToAccountData?.credit_ledger)
      ),
    enabled:
      !!accountToAccountData?.credit_account_details?.id &&
      !!accountToAccountData?.credit_ledger,
  });
  if (debitBalanceError) {
    showToast(debitBalanceError.message, 'error');
  }
  if (creditBalanceError) {
    showToast(creditBalanceError.message, 'error');
  }

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAccountToAccount(id),
    onSuccess: (_, variables) => {
      showToast(`A2A Number ${accountToAccountData?.voucher_no} deleted successfully!`, 'success');
      queryClient.invalidateQueries(['accountToAccount', searchTerm]);
      queryClient.invalidateQueries(['voucherNumber', searchTerm]);
      queryClient.invalidateQueries(['voucherNumber', variables]);
      queryClient.invalidateQueries(['voucherNumber', '']);
      setShowDeleteModal(false);
      setPageState('new');
      setSearchTerm('');
    },
    onError: (error) => {
      setShowDeleteModal(false);
      showToast(error.message || 'Error deleting Voucher', 'error');
    },
  });

  // Navigation Actions
  const handleEdit = () => {
    lockTransactionMutation.mutate({
      transaction_type: voucherName,
      transaction_id: accountToAccountData?.id,
    });
    setPageState('edit');
  };
  let scText = accountToAccountData?.special_commission_text ? accountToAccountData?.special_commission_text : '-';
  if (isLoading) {
    return (
      <>
        <div className="d-card mt-3">
          <div className="row">
            {/* Left: Details */}
            <div className="col-xxl-9 col-12">
              <div style={{ maxWidth: 780 }}>
                <div className="row">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="col-md-6 mb-4">
                      <div className="mb-2">
                        <Skeleton
                          duration={1}
                          width={'40%'}
                          baseColor="#ddd"
                          height={16}
                        />
                      </div>
                      <div>
                        <Skeleton
                          duration={1}
                          width={'80%'}
                          baseColor="#ddd"
                          height={20}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="col-12 mb-4">
                    <div className="mb-2">
                      <Skeleton
                        duration={1}
                        width={'20%'}
                        baseColor="#ddd"
                        height={16}
                      />
                    </div>
                    <div>
                      <Skeleton
                        duration={1}
                        width={'100%'}
                        baseColor="#ddd"
                        height={20}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  if (isError || !accountToAccountData) {
    return (
      <div className="d-card">
        <p className="text-danger mb-0">
          Unable to fetch Account to Account data
        </p>
      </div>
    );
  }
  if (!hasViewPermission) {
    return (
      <div className="d-card">
        <div className="text-center py-4">
          <p className="text-danger mb-0">You are not authorized to view Account to Account</p>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="d-card mt-3">
        <div className="row">
          {/* Left: Details */}
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <div style={{ maxWidth: 780 }}>
              <div className="row">
                {[
                  {
                    label: 'Debit Account',
                    value:
                      accountToAccountData?.account_to_account
                        ?.debit_account_details?.title,
                    col: 'col-md-6',
                  },
                  {
                    label: 'Credit Account',
                    value:
                      accountToAccountData?.account_to_account
                        ?.credit_account_details?.title,
                    col: 'col-md-6',
                  },
                  {
                    label: 'Account Title',
                    value:
                      accountToAccountData?.account_to_account?.account_title,
                    col: 'col-md-6',
                  },
                  {
                    label: 'Cheque Number',
                    value:
                      accountToAccountData?.account_to_account?.cheque
                        ?.cheque_number,
                    col: 'col-md-6',
                    condition: accountToAccountData?.account_to_account?.cheque,
                  },
                  {
                    label: 'Currency',
                    value:
                      accountToAccountData?.account_to_account?.currency
                        ?.currency_code,
                    col: 'col-md-6',
                  },
                  {
                    label: 'FC Amount',
                    value: formatNumberForDisplay(accountToAccountData?.account_to_account?.fc_amount, 2),
                    col: 'col-md-6',
                  },
                  {
                    label: 'Debit Account Narration',
                    value:
                      accountToAccountData?.account_to_account
                        ?.debit_account_narration,
                    col: 'col-md-6',
                  },
                  {
                    label: 'Credit Account Narration',
                    value:
                      accountToAccountData?.account_to_account
                        ?.credit_account_narration,
                    col: 'col-md-6',
                  },
                  {
                    label: 'Comment',
                    value: accountToAccountData?.account_to_account?.comment,
                    col: 'col-12',
                  },
                ]
                  .filter(
                    (field) =>
                      field.condition !== false && !isNullOrEmpty(field.value)
                  )
                  .map((field, index) => (
                    <div key={index} className={field.col}>
                      <div className="mb-4">
                        <label className="text-muted mb-2">{field.label}</label>
                        <div>{field.value}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
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
      <VoucherNavigationBar
        isDisabled={isLoading || isError || isNullOrEmpty(accountToAccountData)}
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
            ...(accountToAccountData?.pdf_url
              ? [
                {
                  text: 'Print',
                  onClick: () => {
                    if (accountToAccountData.pdf_url) {
                      window.open(accountToAccountData.pdf_url, '_blank');
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
        setSearchTerm={setSearchTerm}
      />
      {/* Attachments Modal */}
      <CustomModal
        show={showAttachmentsModal}
        close={() => setShowAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          showModal={showAttachmentsModal}
          closeModal={() => setShowAttachmentsModal(false)}
          item={accountToAccountData}
          deleteService={deleteAccountToAccountAttachment}
          uploadService={addAccountToAccountAttachment}
          getAttachmentsService={getAccountToAccountAttachments}
          closeUploader={() => setShowAttachmentsModal(false)}
          voucherAttachment={true}
          viewOnly
          queryToInvalidate={['accountToAccount', searchTerm]}
        />
      </CustomModal>
      {/* Delete Modal */}
      <CustomModal
        show={showDeleteModal}
        close={() => setShowDeleteModal(false)}
        action={() => {
          if (accountToAccountData) {
            deleteMutation.mutate(accountToAccountData?.voucher_no);
          }
        }}
        title="Delete"
        description={`Are you sure you want to delete A2A Number ${accountToAccountData?.voucher_no}?`}
        disableClick={deleteMutation.isPending}
      />
    </>
  );
};

export default ViewAccountToAccount;
