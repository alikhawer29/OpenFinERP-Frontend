import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { HiOutlineTrash } from 'react-icons/hi2';
import Skeleton from 'react-loading-skeleton';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { showToast } from '../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import {
  checkTransactionLockStatus,
  lockTransaction,
} from '../../../Services/Process/TransactionLock';
import {
  addInwardPaymentOrderAttachment,
  deleteInwardPaymentOrder,
  deleteInwardPaymentOrderAttachment,
  getInwardPaymentOrderAttachments,
  getInwardPaymentOrderListing,
} from '../../../Services/Transaction/InwardPaymentOrder';
import {
  inwardPaymentOrderNewHeaders,
  SUMMARY_TABLE_HEADERS,
} from '../../../Utils/Constants/TableHeaders';
import { formatNumberForDisplay, showErrorToast } from '../../../Utils/Utils';

const ViewInwardPaymentOrder = ({
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
  const voucherName = 'inward_payment_order';
  // Fetch order details by voucher number
  const {
    data: { data: orderList = [] } = {},
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ['inwardPaymentOrder', searchTerm],
    queryFn: () => getInwardPaymentOrderListing({ search: searchTerm }),
    enabled: !!searchTerm,
    refetchOnWindowFocus: false,
  });

  // Check Transaction lock status to enable/disable actions
  const {
    isLoading: isLoadingLockStatus,
    isError: isErrorLockStatus,
    error: errorLockStatus,
  } = useQuery({
    queryKey: ['lock_status', voucherName, orderList?.[0]?.id],
    queryFn: () =>
      checkTransactionLockStatus({
        transaction_type: voucherName,
        transaction_id: orderList?.[0]?.id,
      }),
    enabled: !!(orderList && Array.isArray(orderList) && orderList.length > 0),
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
    if (orderList && Array.isArray(orderList) && orderList.length > 0) {
      const inward = orderList[0]?.inward_payment_order;
      if (inward) {
        setDate(inward.date);
        setWriteTerm(orderList[0].voucher_no);
      }
    }
  }, [orderList]);

  // Delete Mutation
  const deleteOrderMutation = useMutation({
    mutationFn: (id) => deleteInwardPaymentOrder(id),
    onSuccess: (_, variables) => {
      showToast('Inward Payment Order deleted successfully!', 'success');
      queryClient.invalidateQueries(['inwardPaymentOrderListing']);
      queryClient.invalidateQueries(['voucherNumber', searchTerm]);
      queryClient.invalidateQueries(['voucherNumber', variables]);
      queryClient.invalidateQueries(['voucherNumber', '']);
      setShowDeleteModal(false);
      setPageState('list');
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
    if (orderList && Array.isArray(orderList) && orderList.length > 0) {
      lockTransactionMutation.mutate({
        transaction_type: voucherName,
        transaction_id: orderList[0].id,
      });
      setPageState('edit');
    }
  };

  // --- Map details and calculate commission/vat/net total for each detail row ---
  // For each order in orderList, get its inward_payment_order.details
  const allDetailRows = useMemo(() => {
    if (!orderList || !Array.isArray(orderList) || orderList.length === 0)
      return [];
    return orderList.flatMap((order) => {
      const inward = order.inward_payment_order;
      if (!inward || !Array.isArray(inward.details)) return [];
      // Extract VAT type and percentage from the order (payload style)
      const vatType = inward.vat_terms_type || inward.vat?.type || '-';
      const vatPercentage =
        inward.vat_terms_percentage != null
          ? parseFloat(inward.vat_terms_percentage)
          : inward.vat?.percentage != null
          ? parseFloat(inward.vat.percentage)
          : 0;
      return inward.details.map((detail) => {
        const commission = parseFloat(detail.commission) || 0;
        const fcAmount = parseFloat(detail.fc_amount) || 0;
        // Use correct VAT percentage for this row
        let rowVatPercentage =
          vatType === 'variable'
            ? detail.vat_percentage != null
              ? parseFloat(detail.vat_percentage)
              : vatPercentage
            : vatPercentage;
        const vatAmount = commission * (rowVatPercentage / 100);

        // Apply VAT calculation based on VAT Type
        const vatTypeFromOrder = inward.vat_type || 'absorb';
        let netTotal;
        if (vatTypeFromOrder === 'absorb') {
          // If VAT Type is "Absorb": Net Total = Total + Commission
          netTotal = fcAmount + commission;
        } else {
          // If VAT Type is "Charge": Net Total = Total + Commission + VAT Amount
          netTotal = fcAmount + commission + vatAmount;
        }

        return {
          ...detail,
          commission: formatNumberForDisplay(commission, 2),
          vatAmount: formatNumberForDisplay(vatAmount, 2),
          netTotal: formatNumberForDisplay(netTotal, 2),
          currency: detail.currency?.currency_code,
          vatType,
          vatPercentage: rowVatPercentage,
        };
      });
    });
  }, [orderList]);

  const firstOrder = orderList[0]?.inward_payment_order || {};

  // --- Summary Table Calculation ---
  const summaryRows = useMemo(() => {
    // Group by currency
    const groups = {};
    const vatType = firstOrder?.vat_type || 'absorb';

    allDetailRows.forEach((row) => {
      const currency = row.currency || '-';
      if (!groups[currency]) {
        groups[currency] = {
          currency,
          total: 0,
          commission: 0,
          specialCommission: 0,
          vatAmount: 0,
          netTotal: 0,
        };
      }
      const total = parseFloat(row.fc_amount) || 0;
      const commission = parseFloat(row.commission) || 0;
      const vatAmount = parseFloat(row.vatAmount) || 0;

      groups[currency].total += total;
      groups[currency].commission += commission;
      groups[currency].vatAmount += vatAmount;
    });

    // Add Special Commission to the appropriate currency group
    if (firstOrder?.special_commission && firstOrder.special_commission.total_commission) {
      const scCurrency = firstOrder.special_commission.currency?.currency_code || '-';
      const scAmount = parseFloat(firstOrder.special_commission.total_commission) || 0;

      if (!groups[scCurrency]) {
        groups[scCurrency] = {
          currency: scCurrency,
          total: 0,
          commission: 0,
          specialCommission: 0,
          vatAmount: 0,
          netTotal: 0,
        };
      }
      groups[scCurrency].specialCommission += scAmount;
    }

    return Object.values(groups).map((g) => {
      // Calculate total commission (row commissions + special commission)
      const totalCommission = g.commission + g.specialCommission;

      // Calculate VAT amount for special commission
      let specialCommissionVatAmount = 0;
      if (g.specialCommission > 0) {
        // Try multiple sources for VAT percentage
        let vatPercentage = 0;
        if (firstOrder?.vat_terms_percentage) {
          vatPercentage = parseFloat(firstOrder.vat_terms_percentage) || 0;
        } else if (firstOrder?.vat?.percentage) {
          vatPercentage = parseFloat(firstOrder.vat.percentage) || 0;
        }
        
        if (vatPercentage > 0) {
          specialCommissionVatAmount = g.specialCommission * (vatPercentage / 100);
        }
      }

      // Total VAT amount (row VAT + special commission VAT)
      const totalVatAmount = g.vatAmount + specialCommissionVatAmount;

      // Apply VAT calculation based on VAT Type
      let netTotal;
      if (vatType === 'absorb') {
        // If VAT Type is "Absorb": Net Total = Total + Total Commission
        netTotal = g.total + totalCommission;
      } else {
        // If VAT Type is "Charge": Net Total = Total + Total Commission + VAT Amount
        netTotal = g.total + totalCommission + totalVatAmount;
      }

      return {
        ...g,
        total: formatNumberForDisplay(g.total, 2),
        commission: formatNumberForDisplay(g.commission, 2),
        specialCommission: formatNumberForDisplay(g.specialCommission, 2),
        totalCommission: formatNumberForDisplay(totalCommission, 2),
        vatAmount: formatNumberForDisplay(totalVatAmount, 2),
        netTotal: formatNumberForDisplay(netTotal, 2),
      };
    });
  }, [allDetailRows, firstOrder?.vat_type, firstOrder?.special_commission, firstOrder?.vat_terms_percentage, firstOrder?.vat]);

  // --- Details Section (top) ---
  // Use the first order for the details section
  const details = [
    {
      label: 'Debit Account',
      value: firstOrder?.debit_account_ledger + " - " + firstOrder?.debit_account_details?.title,
    },
    { label: 'Office', value: firstOrder?.office?.office_location },
    {
      label: 'VAT Type',
      value: (() => {
        // Use the correct field from API data
        const vatType = firstOrder?.vat_type || '';
        if (vatType === 'absorb') return 'Absorb';
        if (vatType === 'charge') return 'Charge';
        return vatType || '-';
      })(),
    },
    {
      label: 'VAT Terms',
      value: (() => {
        // Use the correct fields from API data
        const percent = firstOrder?.vat_terms_percentage;
        const vatType = firstOrder?.vat_terms_type;
        const vatTitle = firstOrder?.vat?.title || '';
        const vatTerms = firstOrder?.vat_terms;

        // If there's a VAT terms title (like "Standard Rate"), use it
        if (vatTitle && percent != null && percent !== '') {
          return `${vatTitle} ${percent}%`;
        }
        
        // If there's a VAT terms field (like "Standard Rate"), use it
        if (vatTerms && percent != null && percent !== '') {
          return `${vatTerms} ${percent}%`;
        }
        
        // If VAT type is fixed, show "Fixed X%"
        if (vatType === 'fixed' && percent != null && percent !== '') {
          return `Fixed ${percent}%`;
        }
        
        // If VAT type is variable, show just the percentage
        if (vatType === 'variable' && percent != null && percent !== '') {
          return `${percent}%`;
        }
        
        // Fallback to just percentage if available
        if (percent != null && percent !== '') {
          return `${percent}%`;
        }
        
        // Fallback to VAT terms if available
        if (vatTerms) {
          return vatTerms;
        }
        
        // Fallback to VAT title if available
        if (vatTitle) {
          return vatTitle;
        }
        
        return '-';
      })(),
    },
  ];

  if (isError) {
    showErrorToast(error);
    return (
      <div className="d-card">
        <p className="text-danger mb-0">Error fetching Inward Payment Order</p>
      </div>
    );
  }

  if (isLoading || isFetching) {
    return (
      <>
        <div className="d-card">
          <div className="row">
            <div className="col-12 col-lg-10 col-xl-9 col-xxl-7 mb-4">
              <div className="row">
                {/* Details section skeleton - 4 fields */}
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="col-12 col-sm-6 mb-4">
                    <Skeleton
                      duration={1}
                      width={'40%'}
                      baseColor="#ddd"
                      height={16}
                      style={{ marginBottom: 4 }}
                    />
                    <Skeleton
                      duration={1}
                      width={'70%'}
                      baseColor="#ddd"
                      height={20}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main table skeleton */}
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  {Array.from({ length: 15 }).map((_, i) => (
                    <th key={i}>
                      <Skeleton
                        duration={1}
                        width={'80%'}
                        baseColor="#ddd"
                        height={16}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 3 }).map((_, rowIndex) => (
                  <tr key={rowIndex}>
                    {Array.from({ length: 15 }).map((_, colIndex) => (
                      <td key={colIndex}>
                        <Skeleton
                          duration={1}
                          width={'90%'}
                          baseColor="#ddd"
                          height={16}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary table skeleton */}
          <div className="mt-4">
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <th key={i}>
                        <Skeleton
                          duration={1}
                          width={'80%'}
                          baseColor="#ddd"
                          height={16}
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 2 }).map((_, rowIndex) => (
                    <tr key={rowIndex}>
                      {Array.from({ length: 5 }).map((_, colIndex) => (
                        <td key={colIndex}>
                          <Skeleton
                            duration={1}
                            width={'70%'}
                            baseColor="#ddd"
                            height={16}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Navigation bar skeleton */}
        <div className="d-card mt-3">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex gap-2">
              <Skeleton duration={1} width={80} baseColor="#ddd" height={36} />
              <Skeleton duration={1} width={80} baseColor="#ddd" height={36} />
            </div>
            <div className="d-flex gap-2">
              <Skeleton duration={1} width={60} baseColor="#ddd" height={36} />
              <Skeleton duration={1} width={80} baseColor="#ddd" height={36} />
              <Skeleton duration={1} width={80} baseColor="#ddd" height={36} />
            </div>
          </div>
        </div>
      </>
    );
  }

  const noData =
    !orderList || !Array.isArray(orderList) || orderList.length === 0;
  if (noData) {
    return (
      <>
        <div className="d-card">
          <p className="text-danger mb-0">
            No Inward Payment Order found for voucher {searchTerm}
          </p>
        </div>
      </>
    );
  }

  if (!hasViewPermission) {
    return (
      <div className="d-card text-center">
        <p className="text-danger">You are not authorized to view this inward payment order</p>
      </div>
    );
  }

  let scText = orderList[0]?.special_commission_text;

  return (
    <>
      <div className="d-card">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7 mb-4">
            <div className="row">
              {details.map((x, i) => (
                <div key={i} className="col-12 col-sm-6 mb-4">
                  <p className="detail-title detail-label-color mb-1">
                    {x.label}
                  </p>
                  <p className="detail-text wrapText mb-0">
                    {x.value
                      ? x.value.charAt(0).toUpperCase() +
                        x.value.slice(1).toLowerCase()
                      : '-'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <CustomTable
          displayCard={false}
          headers={inwardPaymentOrderNewHeaders}
          isPaginated={false}
          hideSearch
          hideItemsPerPage
        >
          <tbody>
            {allDetailRows.map((row) => (
              <tr key={row.id}>
                <td>{row?.id}</td>
                <td>{row?.ref_no || "-"}</td>
                <td>
                  {row?.pay_type
                    ? row.pay_type
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (c) => c.toUpperCase())
                    : '-'}
                </td>
                <td>{row.walkin_customer?.customer_name || "-"}</td>
                <td>{row.sender || "-"}</td>
                <td>{row.id_number || "-"}</td>
                <td>{row.contact_no || "-"}</td>
                <td>{row.currency || "-"}</td>
                <td>{formatNumberForDisplay(row.fc_amount, 2) || "-"}</td>
                <td>{formatNumberForDisplay(row.commission, 2) || "-" }</td>
                <td>{row.pay_date || "-"}</td>
                <td>{row.bank_name || "-"}</td>
                <td>{row.bank_account || "-"}</td>
                <td>{row.narration || "-"}</td>
                <td>
                  <TableActionDropDown
                    actions={[
                      {
                        name: 'Delete',
                        icon: HiOutlineTrash,
                        onClick: () => handleDeleteRow(row.id),
                        className: 'delete',
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </CustomTable>
        <div className="mt-4">
          <CustomTable
            displayCard={false}
            headers={SUMMARY_TABLE_HEADERS}
            data={summaryRows}
            isPaginated={false}
            hideSearch
            hideItemsPerPage
          >
            <tbody>
              {summaryRows.map((row, index) => (
                <tr key={index}>
                  <td>{row.currency}</td>
                  <td>{formatNumberForDisplay(row.total, 2)}</td>
                  <td>{formatNumberForDisplay(row.totalCommission, 2)}</td>
                  <td>{formatNumberForDisplay(row.vatAmount, 2)}</td>
                  <td>{formatNumberForDisplay(row.netTotal, 2)}</td>
                </tr>
              ))}
            </tbody>
          </CustomTable>
        </div>

        {/* Special Commission Display */}
        {orderList[0]?.special_commission && (
          <div className="mt-4">
            <h5 className="mb-3">Special Commission Details</h5>
            <div className="row">
              <div className="col-12 col-md-6">
                <p className="detail-title detail-label-color mb-1">Commission Type</p>
                <p className="detail-text mb-2">
                  {orderList[0].special_commission.commission_type || '-'}
                </p>
              </div>
              <div className="col-12 col-md-6">
                <p className="detail-title detail-label-color mb-1">Commission Rate</p>
                <p className="detail-text mb-2">
                  {orderList[0].special_commission.commission ? 
                    `${formatNumberForDisplay(orderList[0].special_commission.commission, 2)}%` : '-'}
                </p>
              </div>
              <div className="col-12 col-md-6">
                <p className="detail-title detail-label-color mb-1">Total Commission</p>
                <p className="detail-text mb-2">
                  {orderList[0].special_commission.total_commission ? 
                    formatNumberForDisplay(orderList[0].special_commission.total_commission, 2) : '-'}
                </p>
              </div>
              <div className="col-12 col-md-6">
                <p className="detail-title detail-label-color mb-1">Currency</p>
                <p className="detail-text mb-2">
                  {orderList[0].special_commission.currency?.currency_code || '-'}
                </p>
              </div>
              {orderList[0].special_commission.description && (
                <div className="col-12">
                  <p className="detail-title detail-label-color mb-1">Description</p>
                  <p className="detail-text mb-2">
                    {orderList[0].special_commission.description}
                  </p>
                </div>
              )}
            </div>
            
            {/* Commission Distribution Table */}
            {orderList[0].special_commission.commission_distribution && 
             orderList[0].special_commission.commission_distribution.length > 0 && (
              <div className="mt-3">
                <h6 className="mb-3">Commission Distribution</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Ledger</th>
                        <th>Account</th>
                        <th>Percentage</th>
                        <th>Amount</th>
                        <th>Narration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderList[0].special_commission.commission_distribution.map((dist, index) => (
                        <tr key={index}>
                          <td>{dist.ledger || '-'}</td>
                          <td>{dist.account_details?.title || '-'}</td>
                          <td>{dist.percentage ? `${formatNumberForDisplay(dist.percentage, 2)}%` : '-'}</td>
                          <td>
                            {dist.amount ? formatNumberForDisplay(dist.amount, 2) : '-'}
                          </td>
                          <td>{dist.narration || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fallback to legacy special commission text if no structured data */}
        <div className="d-flex justify-content-between flex-wrap">
          {scText ? (
            <p className="wrapText mb-0">
              <span
                className={`${
                  scText?.includes('payable')
                    ? 'text-danger'
                    : scText?.includes('receivable')
                    ? 'text-success'
                    : ''
                }`}
              >
                {scText}
              </span>
            </p>
          ) : (
            <div />
          )}
        </div>
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
            ...(orderList[0]?.pdf_url
              ? [
                {
                  text: 'Print',
                  onClick: () => {
                    if (orderList[0]?.pdf_url) {
                      window.open(orderList[0]?.pdf_url, '_blank');
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
          item={orderList[0]}
          getAttachmentsService={getInwardPaymentOrderAttachments}
          deleteService={deleteInwardPaymentOrderAttachment}
          uploadService={addInwardPaymentOrderAttachment}
          closeUploader={() => setShowAttachmentsModal(false)}
          voucherAttachment={true}
          queryToInvalidate={['inwardPaymentOrder', searchTerm]}
        />
      </CustomModal>
      {/* Delete Modal */}
      <CustomModal
        show={showDeleteModal}
        close={() => {
          setShowDeleteModal(false);
        }}
        action={() => {
          if (orderList && Array.isArray(orderList) && orderList.length > 0) {
            deleteOrderMutation.mutate(orderList[0].voucher_no);
          }
        }}
        title="Delete"
        description={`Are you sure you want to delete Inward Payment Order ${orderList[0]?.voucher_no}?`}
        disableClick={deleteOrderMutation.isPending}
      />
    </>
  );
};

export default ViewInwardPaymentOrder;
