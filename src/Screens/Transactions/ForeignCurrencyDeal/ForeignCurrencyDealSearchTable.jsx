import React from 'react';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import withFilters from '../../../HOC/withFilters ';
import { useFetchTableData } from '../../../Hooks/useTable';
import { getForeignCurrencyDealListingOrDetails } from '../../../Services/Transaction/ForeignCurrencyDeal';
import { foreignCurrencyDealHeaders } from '../../../Utils/Constants/TableHeaders';
import { formatDate, formatNumberForDisplay, showErrorToast } from '../../../Utils/Utils';
import CommissionTypeDisplay from '../../../Components/CommissionTypeDisplay';

const ForeignCurrencyDealSearchTable = ({
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
    data: { data: foreignCurrencyDealData = [] } = {},
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'foreignCurrencyDealListing',
    {
      ...filters,
      date: date,
    },
    updatePagination,
    getForeignCurrencyDealListingOrDetails
  );
  if (isError) {
    showErrorToast(error);
  }

  return (
    <CustomTable
      hasFilters={false}
      headers={foreignCurrencyDealHeaders}
      isLoading={isLoading}
      pagination={pagination}
      hideItemsPerPage
      hideSearch
      setFilters={setFilters}
    >
      {(foreignCurrencyDealData?.length || isError) && (
        <tbody>
          {isError && (
            <tr>
              <td colSpan={foreignCurrencyDealHeaders.length}>
                <p className="text-danger mb-0">
                  Unable to fetch data at this time
                </p>
              </td>
            </tr>
          )}
          {foreignCurrencyDealData?.map((row) => (
            <tr key={row.id}>
              <td>{formatDate(row.voucher?.date, 'DD/MM/YYYY')}</td>
              <td
                className="cp"
                onClick={() => {
                  setWriteTerm(row.voucher.voucher_no);
                  setSearchTerm(row.voucher.voucher_no);
                  setPageState('view');
                }}
              >
                <p className="hyper-link text-decoration-underline mb-0">
                  {row.voucher.voucher_no}
                </p>
              </td>
              <td>{row.new_debit_ledger}</td>
              <td>{row.debit_account_details?.title}</td>
              <td>{row.new_credit_ledger}</td>
              <td>{row.credit_account_details?.title}</td>
              <td>{row.buy_fcy?.currency_code}</td>
              <td>{formatNumberForDisplay(row.buy_fcy_dr_amount, 2)}</td>
              <td>{formatNumberForDisplay(row.rate, 8)}</td>
              <td>{row.sell_fcy?.currency_code}</td>
              <td>{formatNumberForDisplay(row.sell_fc_cr_amount, 2)}</td>
              <td>
                {parseFloat(row?.commission)
                  ? row.commission_fcy?.currency_code
                  : row?.special_commission?.amount_type?.currency_code ??
                  row.commission_fcy?.currency_code}
              </td>
              <td>
                <CommissionTypeDisplay item={row}>
                  {parseFloat(row?.commission)
                    ? formatNumberForDisplay(row?.commission, 2)
                    : row?.special_commission?.total_commission
                      ? formatNumberForDisplay(
                        row?.special_commission?.total_commission,
                        2
                      )
                      : ''}
                </CommissionTypeDisplay>
              </td>
              <td>{row.creator?.user_name}</td>
              <td>{formatDate(row.created_at, 'HH:MM')}</td>
              <td>
                {row.attachments?.charAt(0).toUpperCase() +
                  row?.attachments?.slice(1)}
              </td>
            </tr>
          ))}
        </tbody>
      )}
    </CustomTable>
  );
};

export default withFilters(ForeignCurrencyDealSearchTable);
