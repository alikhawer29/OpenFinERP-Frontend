import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { FaPaperclip } from 'react-icons/fa6';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { showToast } from '../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import { getAccountBalances, getExchangeRates } from '../../../Services/General';
import {
  checkTransactionLockStatus,
  lockTransaction,
} from '../../../Services/Process/TransactionLock';
import {
  deleteCurrencyTransfer,
  deleteCurrencyTransferAttachment,
  getCurrencyTransferListing,
} from '../../../Services/Transaction/CurrencyTransfer';
import useSettingsStore from '../../../Stores/SettingsStore';
import { currencyTransferNewHeaders } from '../../../Utils/Constants/TableHeaders';
import { formatNumberForDisplay, isNullOrEmpty, showErrorToast } from '../../../Utils/Utils';
import { formatNumberWithCommas } from '../../../Utils/Helpers';

const ViewCurrencyTransfer = ({
  searchTerm,
  setSearchTerm,
  setWriteTerm,
  setPageState,
  setDate,
  lastVoucherNumbers,
  permissions,
  hasViewPermission,
  hasEditPermission,
  hasDeletePermission,
  hasPrintPermission,
}) => {
  const queryClient = useQueryClient();
  const voucherName = 'currency_transfer_request';
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [attachmentsModal, setAttachmentsModal] = useState(false);

  // Row-level attachment states
  const [rowAttachmentsModal, setRowAttachmentsModal] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState(null);

  // Exchange rates state (following Receipt Voucher pattern)
  const [exchangeRatesInverse, setExchangeRatesInverse] = useState(false);

  const {
    data: { data: [currencyTransferData] = [] } = {},
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ['currencyTransfer', searchTerm],
    queryFn: () => getCurrencyTransferListing({ search: searchTerm }),
    enabled: !!searchTerm,
    staleTime: 0, // Always refetch to get latest attachment data
    gcTime: 0, // Remove from cache immediately
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid unnecessary calls
  });

  // Check Transaction lock status to enable/disable
  const {
    isLoading: isLoadingLockStatus,
    isError: isErrorLockStatus,
    error: errorLockStatus,
  } = useQuery({
    queryKey: ['lock_status', voucherName, currencyTransferData?.id],
    queryFn: () =>
      checkTransactionLockStatus({
        transaction_type: voucherName,
        transaction_id: currencyTransferData?.id,
      }),
    enabled: !isNullOrEmpty(currencyTransferData),
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
    if (currencyTransferData?.date) {
      setDate(currencyTransferData?.date);
      setWriteTerm(currencyTransferData?.voucher_no);
    }
  }, [currencyTransferData?.date, currencyTransferData]);

  // Mutation for delete
  const deleteCurrencyTransferMutation = useMutation({
    mutationFn: (id) => deleteCurrencyTransfer(id), // Call the API to delete the package
    onSuccess: () => {
      showToast('Currency Transfer Voucher deleted successfully!', 'success');
      queryClient.invalidateQueries(['currencyTransfer', searchTerm]);
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

  // Handle row-level attachment functions
  const handleRowAttachmentClick = (rowId) => {
    setSelectedRowId(rowId);
    setRowAttachmentsModal(true);
  };

  // Navigation Actions
  const handleEdit = () => {
    lockTransactionMutation.mutate({
      transaction_type: voucherName,
      transaction_id: currencyTransferData?.id,
    });
    setPageState('edit');
  };
  const handleDelete = () => {
    setShowDeleteModal(true);
  };
  const handlePrint = () => {
    window.open(currencyTransferData?.pdf_url, '_blank');
  };

  // Add settings store for balance card toggle
  const { getAccountBalanceSettings } = useSettingsStore();

  // Fetch debit and credit account info from loaded data
  const debitAccountId =
    currencyTransferData?.currency_transfer?.debit_account_details?.id;
  const debitAccountType =
    currencyTransferData?.currency_transfer?.debit_account_ledger;
  const debitAccountName =
    currencyTransferData?.currency_transfer?.debit_account_details?.title;
  const creditAccountId =
    currencyTransferData?.currency_transfer?.credit_account_details?.id;
  const creditAccountType =
    currencyTransferData?.currency_transfer?.credit_account_ledger;
  const creditAccountName =
    currencyTransferData?.currency_transfer?.credit_account_details?.title;

  // Fetch balances using react-query (following NewCurrencyTransfer pattern)
  const { data: debitAccountBalance, isLoading: isLoadingDebitBalance } =
    useQuery({
      queryKey: ['accountBalance', debitAccountId, debitAccountType],
      queryFn: () => getAccountBalances(debitAccountId, debitAccountType),
      enabled: !!debitAccountId && !!debitAccountType,
      staleTime: 1000 * 60 * 2,
    });
  const { data: creditAccountBalance, isLoading: isLoadingCreditBalance } =
    useQuery({
      queryKey: ['accountBalance', creditAccountId, creditAccountType],
      queryFn: () => getAccountBalances(creditAccountId, creditAccountType),
      enabled: !!creditAccountId && !!creditAccountType,
      staleTime: 1000 * 60 * 2,
    });

  // Exchange rates (following Receipt Voucher pattern)
  const {
    data: exchangeRatesData,
    isLoading: isLoadingExchangeRates,
    isError: isErrorExchangeRates,
    error: errorExchangeRates,
  } = useQuery({
    queryKey: ['exchangeRates', exchangeRatesInverse],
    queryFn: () => getExchangeRates(exchangeRatesInverse),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  if (isError) {
    console.error(error);
  }
  let scText = currencyTransferData?.special_commission_text;
  if (isLoading) {
    return (
      <div className="d-card">
        {/* Header Details Skeleton */}
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7 mb-4">
            <div className="row">
              {[1, 2, 3].map((i) => (
                <div key={i} className="col-12 col-sm-6 mb-4">
                  <Skeleton height={16} width={120} className="mb-1" />
                  <Skeleton height={20} width={200} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table Skeleton */}
        <CustomTable
          displayCard={false}
          headers={currencyTransferNewHeaders}
          isPaginated={false}
          hideSearch
          hideItemsPerPage
        >
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                <td>
                  <Skeleton height={20} width={30} />
                </td>
                <td>
                  <Skeleton height={20} width={60} />
                </td>
                <td>
                  <Skeleton height={20} width={80} />
                </td>
                <td>
                  <Skeleton height={20} width={150} />
                </td>
                <td>
                  <Skeleton height={20} width={100} />
                </td>
                <td>
                  <Skeleton height={20} width={80} />
                </td>
                <td>
                  <Skeleton height={20} width={100} />
                </td>
                <td>
                  <Skeleton height={20} width={80} />
                </td>
                <td>
                  <Skeleton height={20} width={60} />
                </td>
                <td>
                  <Skeleton height={20} width={50} />
                </td>
              </tr>
            ))}
          </tbody>
        </CustomTable>
      </div>
    );
  }

  if (isNullOrEmpty(currencyTransferData)) {
    return (
      <div className="d-card">
        <div className="text-center">
          <p className="text-danger mb-0">
            Currency Transfer Request {searchTerm} not found
          </p>
        </div>
      </div>
    );
  }

  if (!hasViewPermission) {
    return (
      <div className="d-card text-center">
        <p className="text-danger">You are not authorized to view this currency transfer</p>
      </div>
    );
  }

  return (
    <>
      <div className="d-card">
        <div className="row justify-content-between">
          <div className="col-12 col-xl-9 col-xxl-7 mb-4">
            <div className="row">
              <div className="col-12 col-md-6 mb-4">
                <p className="detail-title detail-label-color mb-1">
                  Debit Account
                </p>
                <p className="detail-text wrapText mb-0">
                  {
                    currencyTransferData?.currency_transfer
                      ?.debit_account_details?.title
                  }
                </p>
              </div>
              <div className="col-12 col-md-6 mb-4">
                <p className="detail-title detail-label-color mb-1">
                  Credit Account
                </p>
                <p className="detail-text wrapText mb-0">
                  {currencyTransferData?.currency_transfer
                    ?.credit_account_details?.title || '-'}
                </p>
              </div>
              <div className="col-12 col-md-6 mb-4">
                <p className="detail-title detail-label-color mb-1">
                  Account Title
                </p>
                <p className="detail-text wrapText mb-0">
                  {currencyTransferData?.currency_transfer?.account_title ||
                    '-'}
                </p>
              </div>
              <div className="col-12">
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
            </div>
          </div>

        </div>
        <CustomTable
          displayCard={false}
          headers={currencyTransferNewHeaders}
          isPaginated={false}
          hideSearch
          hideItemsPerPage
        >
          {
            <tbody>
              {isError ? (
                <tr>
                  <td colSpan={currencyTransferData.length}>
                    <p className="text-danger mb-0">
                      Unable to fetch data at this time
                    </p>
                  </td>
                </tr>
              ) : (
                isNullOrEmpty(currencyTransferData) && (
                  <tr>
                    <td colSpan={currencyTransferNewHeaders.length}>
                      <p className="text-danger mb-0">
                        Currency Transfer Request {searchTerm} not found
                      </p>
                    </td>
                  </tr>
                )
              )}
              {Array.isArray(
                currencyTransferData?.currency_transfer?.details
              ) &&
                currencyTransferData.currency_transfer.details.map(
                  (item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.currency?.currency_code || '-'}</td>
                      <td>{formatNumberWithCommas(item.amount) || '-'}</td>
                      <td>{item.narration || '-'}</td>
                      <td>{item.doc_type?.description || '-'}</td>
                      <td>{item.doc_no || '-'}</td>
                      <td>{item.bank?.description || '-'}</td>
                      <td>{item.city?.description || '-'}</td>
                      <td>{item.code || '-'}</td>
                      <td>
                        <TableActionDropDown
                          actions={[
                            {
                              name: 'View Attachments',
                              icon: FaPaperclip,
                              onClick: () => handleRowAttachmentClick(item.id),
                              className: 'view',
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  )
                )}
            </tbody>
          }
        </CustomTable>

      </div>
      <VoucherNavigationBar
        isDisabled={isLoading || isError || isNullOrEmpty(currencyTransferData) || !searchTerm}
        loading={isLoading || isFetching}
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
              onClick: handleDelete,
              variant: 'secondaryButton',
              disabled:
                isLoadingLockStatus ||
                isErrorLockStatus ||
                errorLockStatus?.detail?.locked,
            },
          ] : []),
          ...(hasPrintPermission ? [
            ...(currencyTransferData?.pdf_url
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
        onAttachmentClick={() => setAttachmentsModal(true)}
        lastVoucherNumbers={lastVoucherNumbers}
        setPageState={setPageState}
        setSearchTerm={setSearchTerm}
      />
      {/* Voucher Attachments Modal */}
      <CustomModal
        show={attachmentsModal}
        close={() => setAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          showModal={attachmentsModal}
          closeModal={() => setAttachmentsModal(false)}
          item={currencyTransferData}
          deleteService={deleteCurrencyTransferAttachment}
          closeUploader={() => setAttachmentsModal(false)}
          voucherAttachment={true}
          viewOnly={true}
          queryToInvalidate={['currencyTransfer', searchTerm]}
        />
      </CustomModal>

      {/* Delete Currency Transfer Voucher Modal */}
      {/* Delete Modal */}
      <CustomModal
        show={showDeleteModal}
        close={() => {
          setShowDeleteModal(false);
        }}
        action={() => {
          if (currencyTransferData) {
            deleteCurrencyTransferMutation.mutate(
              currencyTransferData.voucher_no
            );
          }
        }}
        title="Delete"
        description={`Are you sure you want to delete Currency Trasfer ${currencyTransferData?.voucher_no}?`}
        disableClick={deleteCurrencyTransferMutation.isPending}
      />

      {/* Row-level Attachments Modal - Using same structure as voucher attachments */}
      <CustomModal
        show={rowAttachmentsModal}
        close={() => {
          setRowAttachmentsModal(false);
          setSelectedRowId(null);
        }}
        background={true}
      >
        <AttachmentsView
          showModal={rowAttachmentsModal}
          closeModal={() => {
            setRowAttachmentsModal(false);
            setSelectedRowId(null);
          }}
          viewOnly={true}
          item={{
            id: selectedRowId,
            files:
              currencyTransferData?.currency_transfer?.details?.find(
                (detail) => detail.id === selectedRowId
              )?.files || [],
            title: `Transaction Row Attachments`,
          }}
          closeUploader={() => {
            setRowAttachmentsModal(false);
            setSelectedRowId(null);
          }}
        />
      </CustomModal>
    </>
  );
};

export default ViewCurrencyTransfer;
