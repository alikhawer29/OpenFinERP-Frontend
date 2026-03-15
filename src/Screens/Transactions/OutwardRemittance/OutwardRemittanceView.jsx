import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CustomModal from '../../../Components/CustomModal';
import { showToast } from '../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import withModal from '../../../HOC/withModal';
import {
  checkTransactionLockStatus,
  lockTransaction,
} from '../../../Services/Process/TransactionLock';
import {
  deleteOutwardRemittance,
  getOutwardRemittanceListingOrDetails,
} from '../../../Services/Transaction/OutwardRemittance';
import useSettingsStore from '../../../Stores/SettingsStore';
import useUserStore from '../../../Stores/UserStore';
import {
  formatDate,
  formatNumberForDisplay,
  isNullOrEmpty,
  showErrorToast,
} from '../../../Utils/Utils';
import { formatNumberWithCommas } from '../../../Utils/Helpers';

const OutwardRemittanceView = ({
  setDate,
  setValueDate,
  setPageState,
  searchTerm,
  setSearchTerm,
  setWriteTerm,
  lastVoucherNumbers,
  hasEditPermission,
  hasDeletePermission,
  hasPrintPermission,
}) => {
  const queryClient = useQueryClient();
  const [deleteModal, setDeleteModal] = useState(false);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const voucherName = 'outward_remittance';
  const { getAccountBalanceSettings } = useSettingsStore();
  const { user: { base_currency } = {} } = useUserStore();

  const {
    data: { data: [outwardRemittanceData] = [] } = {},
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ['outwardRemittance', searchTerm],
    queryFn: () =>
      getOutwardRemittanceListingOrDetails({
        search: searchTerm,
      }),
  });

  const outwardRemittance = outwardRemittanceData?.outward_remittance;

  // Check Transaction lock status to enable/disable actions
  const {
    isLoading: isLoadingLockStatus,
    isError: isErrorLockStatus,
    error: errorLockStatus,
  } = useQuery({
    queryKey: ['lock_status', voucherName, outwardRemittanceData?.id],
    queryFn: () =>
      checkTransactionLockStatus({
        transaction_type: voucherName,
        transaction_id: outwardRemittanceData?.id,
      }),
    enabled: !isNullOrEmpty(outwardRemittanceData),
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
    if (outwardRemittanceData?.voucher_no) {
      setDate(outwardRemittanceData.date);
      setValueDate(outwardRemittance.value_date);
      setWriteTerm(outwardRemittance.voucher_no);
    }
  }, [outwardRemittanceData?.voucher_no]);

  // Special Commission text
  let scText = outwardRemittanceData?.special_commission_text;
  // Delete Mutation
  const deleteOutwardRemittanceMutation = useMutation({
    mutationFn: (id) => deleteOutwardRemittance(id),
    onSuccess: () => {
      showToast(
        `FSN ${outwardRemittance?.voucher_no} deleted successfully!`,
        'success'
      );
      queryClient.invalidateQueries(['outwardRemittance', searchTerm]);
      setDeleteModal(false);
      setPageState('new');
      setWriteTerm('');
      setSearchTerm('');
      setDate(new Date().toLocaleDateString('en-CA'));
    },
    onError: (error) => {
      // setShowDeleteModal(false);
      showErrorToast(error);
    },
  });

  // Navigation Actions
  const handleEdit = () => {
    lockTransactionMutation.mutate({
      transaction_type: voucherName,
      transaction_id: outwardRemittanceData?.id,
    });
    setPageState('edit');
  };

  const handlePrint = () => {
    if (outwardRemittanceData?.pdf_url) {
      window.open(outwardRemittanceData?.pdf_url, '_blank');
    }
  };


  if (isError) {
    showErrorToast(error);
    return (
      <div className="d-card">
        <p className="text-danger mb-0">Error fetching Outward Remittance</p>
      </div>
    );
  }

  if (isLoading || isFetching) {
    return (
      <div className="d-card">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <div className="row mb-3">
              {Array.from({ length: 14 }).map((_, i) => (
                <div
                  key={i}
                  className="col-12 col-sm-4 mb-3 align-items-center"
                  style={{ height: 56 }}
                >
                  <Skeleton
                    style={{ marginTop: 28 }}
                    duration={1}
                    width={'60%'}
                    baseColor="#ddd"
                    height={30}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!outwardRemittanceData) {
    return (
      <>
        <div className="d-card">
          <p className="text-danger mb-0">
            No Outward Remittance found for ID {searchTerm}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="d-card">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <div className="row mb-4">
              {[
                {
                  label: 'Reference Number',
                  value: outwardRemittance?.reference_no,
                },
                {
                  label: 'Ledger',
                  value:
                    outwardRemittance?.new_ledger +
                    ' - ' +
                    outwardRemittance?.account_details?.title,
                },
                {
                  label: 'Beneficiary',
                  value: outwardRemittance?.beneficiary?.name,
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
              {/* Beneficiary Details */}
              {[
                {
                  label: 'Address',
                  value: outwardRemittance?.beneficiary?.address,
                },
                {
                  label: 'Nationality',
                  value: outwardRemittance?.beneficiary?.nationality?.name,
                },
                {
                  label: 'Bank Name',
                  value: outwardRemittance?.beneficiary?.bank_name,
                },
                {
                  label: 'Bank A/C',
                  value: outwardRemittance?.beneficiary?.bank_account_number,
                },
                {
                  label: 'SWIFT Code',
                  value: outwardRemittance?.beneficiary?.swift_bic_code,
                },
                {
                  label: 'Routing Number',
                  value: outwardRemittance?.beneficiary?.routing_number,
                },
                {
                  label: 'City',
                  value: outwardRemittance?.beneficiary?.city,
                },
                {
                  label: 'Country',
                  value: outwardRemittance?.beneficiary?.country?.country,
                },
                {
                  label: 'Corresponding Bank',
                  value: outwardRemittance?.beneficiary?.corresponding_bank,
                },
                {
                  label: 'Bank Account Number',
                  value:
                    outwardRemittance?.beneficiary
                      ?.corresponding_bank_account_number,
                },
                {
                  label: 'Purpose',
                  value: outwardRemittance?.beneficiary?.purpose?.description,
                },
              ].map((x, i) => {
                return (
                  <div key={i} className="col-12 col-sm-6 mb-3">
                    <p className="detail-title detail-label-color mb-0">
                      {x.label}
                    </p>
                    <p className="detail-text wrapText mb-0">{x.value || '-'}</p>
                  </div>
                );
              })}
              <div className="mb-4" />

              {[
                {
                  label: 'By Order',
                  value: outwardRemittance?.by_order,
                },
                {
                  label: 'Send FC',
                  value: outwardRemittance?.fc_currency?.currency_code,
                },
                {
                  label: 'Send Amount',
                  value: formatNumberForDisplay(outwardRemittance?.send_amount, 2),
                },
                {
                  label: 'Rate',
                  value: formatNumberForDisplay(outwardRemittance?.rate, 8),
                },
                {
                  label: 'Against',
                  value: outwardRemittance?.againts_currency?.currency_code,
                },
                {
                  label: 'Against Amount',
                  value: formatNumberForDisplay(outwardRemittance?.against_amount, 2),
                },
                {
                  label: 'Currency Charges',
                  value: formatNumberForDisplay(outwardRemittance?.currency_charges, 2),
                },
                {
                  label: 'VAT Terms',
                  value: (() => {
                    // Check if vat_terms is 'Fixed'
                    if (outwardRemittance?.vat_terms === 'Fixed') {
                      return `${outwardRemittance?.vat_terms} - ${outwardRemittance?.vat_percentage}%`;
                    }

                    // If vat_terms is null or empty, use the vat object
                    if (!outwardRemittance?.vat_terms && outwardRemittance?.vat) {
                      const vatTitle = outwardRemittance.vat.title;
                      const vatPercentage = outwardRemittance.vat.percentage;

                      // If percentage is "Nill", show "0%"
                      if (vatPercentage === 'Nill') {
                        return `${vatTitle}`;
                      }

                      // Otherwise show the title and percentage
                      return vatPercentage ? `${vatTitle} ${vatPercentage}%` : vatTitle;
                    }

                    // Fallback to vat_terms if available
                    return outwardRemittance?.vat_terms || '';
                  })()
                },
                {
                  label: 'VAT Amount',
                  value: outwardRemittance?.vat_amount ? `${outwardRemittance?.againts_currency?.currency_code} ${formatNumberWithCommas(outwardRemittance?.vat_amount)}` : '-',
                },
                {
                  label: 'Net Total',
                  value: formatNumberWithCommas(outwardRemittance?.net_total),
                },
                {
                  label: 'Base Rate',
                  value: formatNumberForDisplay(outwardRemittance?.base_rate, 8),
                },
                {
                  label: `${base_currency || 'LC'} Amount`,
                  value: formatNumberForDisplay(outwardRemittance?.lcy_amount, 2),
                },
                {
                  label: 'Settle Thru',
                  value: outwardRemittance?.settle_thru === 'on_account'
                    ? 'On A/C'
                    : outwardRemittance?.settle_thru?.charAt(0)?.toUpperCase() + outwardRemittance?.settle_thru?.slice(1),
                },
                {
                  label: 'FBN',
                  value: outwardRemittance?.allocations?.length > 0
                    ? outwardRemittance.allocations.map(allocation => {
                      const voucherNo = allocation.voucher?.voucher_no;
                      return voucherNo && parseInt(voucherNo) < 10 ? `0${voucherNo}` : voucherNo;
                    }).join(', ')
                    : outwardRemittance?.fbn,
                }
              ].map((x, i) => {
                return (
                  <div key={i} className="col-12 col-sm-6 mb-4">
                    <p className="detail-title detail-label-color mb-1">
                      {x.label}
                    </p>
                    <p className="detail-text wrapText mb-0">{x.value || '-'}</p>
                  </div>
                );
              })}
            </div>
          </div>
          {/* <div className="col-0  col-xxl-2" /> */}
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-3">
            <div className="row">
              {[
                {
                  label: 'Remitter',
                  value: outwardRemittance?.remittance_details?.account_title,
                },
                {
                  label: 'Remitter Telephone Number',
                  value:
                    outwardRemittance?.remittance_details?.telephone_number,
                },
                {
                  label: 'ID No',
                  value: outwardRemittance?.remittance_details?.id_number,
                },
                {
                  label: 'Valid Upto',
                  value: formatDate(
                    outwardRemittance?.remittance_details?.valid_upto
                  ),
                },
                {
                  label: 'Company',
                  value: outwardRemittance?.remittance_details?.company_name,
                },
              ].map((x, i) => {
                return (
                  <div key={i} className="col-12 col-sm-6 col-xxl-12 mb-3">
                    <p className="detail-title detail-label-color mb-1">
                      {x.label}
                    </p>
                    <p className="detail-text wrapText mb-0">{x.value || '-'}</p>
                  </div>
                );
              })}
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
      <VoucherNavigationBar
        searchTerm={searchTerm}
        actionButtons={[
          // Only show Edit and Delete buttons if no allocations exist
          ...(outwardRemittance?.allocations?.length === 0 && hasEditPermission ? [
            {
              text: 'Edit',
              onClick: handleEdit,
              disabled:
                isLoadingLockStatus ||
                isErrorLockStatus ||
                errorLockStatus?.detail?.locked,
            },
          ] : []),
          ...(outwardRemittance?.allocations?.length === 0 && hasDeletePermission ? [
            {
              text: 'Delete',
              onClick: () => setDeleteModal(true),
              variant: 'secondaryButton',
              disabled:
                isLoadingLockStatus ||
                isErrorLockStatus ||
                errorLockStatus?.detail?.locked,
            },
          ] : []),
          ...(outwardRemittanceData?.pdf_url && hasPrintPermission
            ? [
              {
                text: 'Print',
                onClick: handlePrint,
                variant: 'secondaryButton',
              },
            ]
            : []),
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
          item={outwardRemittanceData}
          closeUploader={() => setShowAttachmentsModal(false)}
        />
      </CustomModal>

      <CustomModal
        show={deleteModal}
        close={() => {
          setDeleteModal(false);
        }}
        disableClick={deleteOutwardRemittanceMutation.isPending}
        action={() =>
          deleteOutwardRemittanceMutation.mutate(
            outwardRemittanceData?.voucher_no
          )
        }
        title="Delete?"
        description={`Are you sure you want to delete FSN ${outwardRemittanceData?.voucher_no} ?`}
      />
    </>
  );
};

export default withModal(OutwardRemittanceView);
