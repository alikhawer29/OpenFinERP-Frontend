import React from 'react';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import { inwardPaymentOrderTableHeaders } from '../../../Utils/Constants/TableHeaders';
import { useFetchTableData } from '../../../Hooks/useTable';
import { formatDate, formatNumberForDisplay, showErrorToast } from '../../../Utils/Utils';
import { getInwardPaymentOrderListing } from '../../../Services/Transaction/InwardPaymentOrder';
import withFilters from '../../../HOC/withFilters ';
import CommissionTypeDisplay from '../../../Components/CommissionTypeDisplay';

const InwardPaymentOrderTable = ({
  date,
  filters,
  pagination,
  updatePagination,
  setPageState,
  setSearchTerm,
  setWriteTerm,
  setFilters,
}) => {
  const {
    data: { data: inwardData = [] } = {},
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    ['inwardPaymentOrderListing', date],
    {
      ...filters,
      date: date,
    },
    updatePagination,
    getInwardPaymentOrderListing
  );

  if (isError) {
    showErrorToast(error);
  }

  return (
    <CustomTable
      headers={inwardPaymentOrderTableHeaders}
      hasFilters={false}
      pagination={pagination}
      updatePagination={updatePagination}
      isLoading={isLoading}
      hideItemsPerPage
      hideSearch
      setFilters={setFilters}
    >
      {(inwardData.length || isError) && (
        <tbody>
          {isError && (
            <tr>
              <td colSpan={inwardPaymentOrderTableHeaders.length}>
                <p className="text-danger mb-0">
                  Unable to fetch data at this time
                </p>
              </td>
            </tr>
          )}
          {inwardData.map((x, i) => (
            <tr key={i}>
              <td>{formatDate(x?.voucher?.date)}</td>
              <td
                onClick={() => {
                  setSearchTerm(x.voucher.voucher_no);
                  setWriteTerm(x.voucher.voucher_no);
                  setPageState('view');
                }}
              >
                <p className="hyper-link text-decoration-underline cp mb-0">
                  {x.voucher?.voucher_no}
                </p>
              </td>
              <td>{x.new_debit_ledger}</td>
              <td>{x.debit_account_details?.title}</td>
              <td>{x.detail.ref_no}</td>
              <td>
                {x.detail?.pay_type
                  ? x.detail.pay_type
                    .replace(/_/g, ' ') // Replace underscores with spaces
                    .replace(/\b\w/g, (c) => c.toUpperCase()) // Capitalize each word
                  : '-'}
              </td>

              <td>{formatDate(x.detail.pay_date)}</td>
              <td>{x.detail.walkin_customer.customer_name}</td>
              <td>{x.detail.sender}</td>
              <td>{x.detail.currency.currency_code}</td>
              <td>{formatNumberForDisplay(x.detail.fc_amount, 2)}</td>
              <td>
                <CommissionTypeDisplay item={x}>
                  {formatNumberForDisplay(
                    (x.detail?.commission && x.detail?.commission !== "0.000000") ? x.detail.commission :
                    (x.special_commission?.total_commission && x.special_commission?.total_commission !== "0.00") ? x.special_commission.total_commission :
                    (x.special_commission?.commission && x.special_commission?.commission !== "0.00") ? x.special_commission.commission :
                    0,
                    2
                  )}
                </CommissionTypeDisplay>
              </td>
              <td>{formatNumberForDisplay(x.detail?.vat_amount, 2)}</td>
              <td>{formatNumberForDisplay(x.net_total, 2)}</td>
              <td>{x.creator?.user_id}</td>
              <td>{formatDate(x?.updated_at, 'HH:MM')}</td>
              <td>{x?.attachments === 'yes' ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      )}
    </CustomTable>
  );
};

export default withFilters(InwardPaymentOrderTable);
