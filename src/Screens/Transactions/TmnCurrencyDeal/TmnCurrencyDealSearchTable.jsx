import React from 'react';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import { formatDate, formatNumberForDisplay, showErrorToast } from '../../../Utils/Utils';
import { useFetchTableData } from '../../../Hooks/useTable';
import { getTMNCurrencyDealListingOrDetails } from '../../../Services/Transaction/TMNCurrencyDeal';
import withFilters from '../../../HOC/withFilters ';
import { AttachmentIcon } from '../../../Utils/Constants/TableHeaders';
import CommissionTypeDisplay from '../../../Components/CommissionTypeDisplay';

const TmnCurrencyDealSearchTable = ({
  date,
  searchType,
  filters,
  pagination,
  updatePagination,
  setPageState,
  setSearchTerm,
  setWriteTerm,
  setFilters,
}) => {
  const tMNCurrencyDealTableHeaders = [
    'Date',
    `${searchType === 'buy' ? 'TSN' : 'TBN'} No.`,
    'Ledger Name',
    'Account Name',
    'Beneficiary',
    'Bank',
    `${searchType === 'buy' ? 'Buy' : 'Sell'} FCy`,
    `${searchType === 'buy' ? 'Buy' : 'Sell'} FC Amount`,
    'Rate',
    'Ag. FCy',
    'Ag. FC Amount',
    ...(searchType === 'buy' ? ['Commission'] : []),
    ...(searchType === 'buy' ? ['VAT'] : []),
    'FC Net Total',
    'User ID',
    'Time',
    AttachmentIcon,
  ];

  const {
    data: { data: tMNCurrencyDealData = [] } = {},
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'tMNCurrencyDealListing',
    {
      ...filters,
      date: date,
      type: searchType,
    },
    updatePagination,
    getTMNCurrencyDealListingOrDetails
  );
  if (isError) {
    showErrorToast(error);
  }

  return (
    <CustomTable
      hasFilters={false}
      headers={tMNCurrencyDealTableHeaders}
      isLoading={isLoading}
      pagination={pagination}
      hideItemsPerPage
      hideSearch
      setFilters={setFilters}
    >
      {(tMNCurrencyDealData?.length || isError) && (
        <tbody>
          {isError && (
            <tr>
              <td colSpan={tMNCurrencyDealTableHeaders.length}>
                <p className="text-danger mb-0">
                  Unable to fetch data at this time
                </p>
              </td>
            </tr>
          )}
          {tMNCurrencyDealData?.map((row) => (
            <tr key={row.id}>
              <td>{formatDate(row.voucher?.date, 'DD/MM/YYYY')}</td>
              <td
                onClick={() => {
                  setWriteTerm(row.voucher.voucher_no);
                  setSearchTerm(row.voucher.voucher_no);
                  setPageState('view');
                }}
                className="cp"
              >
                <p className="text-hyperlink hyper-link text-decoration-underline mb-0">
                  {row.voucher.voucher_no}
                </p>
              </td>
              <td>{row.new_ledger}</td>
              <td>{row.account_details?.title}</td>
              <td>{row.beneficiary?.name}</td>
              <td>{row.bank_name}</td>
              <td>{row.fcy?.currency_code}</td>
              <td>{formatNumberForDisplay(row.fc_amount, 2)}</td>
              <td>{formatNumberForDisplay(row.rate, 8)}</td>
              <td>{row.against_f_cy?.currency_code}</td>
              <td>{formatNumberForDisplay(row.ag_amount, 2)}</td>
              {searchType === 'buy' && (
                <>
                  <td>
                    <CommissionTypeDisplay item={row}>
                      {formatNumberForDisplay(row.commission_amount, 2)}
                    </CommissionTypeDisplay>
                  </td>
                  <td>{formatNumberForDisplay(row.vat_amount, 2)}</td>
                </>
              )}
              <td>{formatNumberForDisplay(row.total_amount, 2)}</td>
              <td>{row.creator?.user_id}</td>
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

export default withFilters(TmnCurrencyDealSearchTable);
