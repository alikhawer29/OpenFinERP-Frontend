import React from 'react';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import { useFetchTableData } from '../../../Hooks/useTable';
import { getCurrencyTransferListing } from '../../../Services/Transaction/CurrencyTransfer';
import { currencyTransferTableHeaders } from '../../../Utils/Constants/TableHeaders';
import withFilters from '../../../HOC/withFilters ';
import { formatDate } from '../../../Utils/Utils';

const CurrencyTransferTable = ({
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
    data: { data: currencyTransferData = [] } = {},
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'currencyTransferListing',
    {
      ...filters,
      date
    },
    updatePagination,
    getCurrencyTransferListing
  );
  return (
    <CustomTable
      headers={currencyTransferTableHeaders}
      hasFilters={false}
      pagination={pagination}
      updatePagination={updatePagination}
      isLoading={isLoading}
      hideItemsPerPage
      hideSearch
      setFilters={setFilters}
    >
      {(currencyTransferData?.length || isError) && (
        <tbody>
          {isError && (
            <tr>
              <td colSpan={currencyTransferTableHeaders.length}>
                <p className="text-danger mb-0">
                  Unable to fetch data at this time
                </p>
              </td>
            </tr>
          )}
          {currencyTransferData?.map((x, i) =>
            x.details?.map((detail, j) => (
              <tr key={`${i}-${j}`}>
                <td>{formatDate(x.date)}</td>
                <td
                  onClick={() => {
                    setSearchTerm(x.voucher?.voucher_no);
                    setWriteTerm(x.voucher?.voucher_no);
                    setPageState('view');
                  }}
                >
                  <p className="hyper-link text-decoration-underline cp mb-0">
                    {x.voucher?.voucher_no}
                  </p>
                </td>
                <td>{x.new_debit_ledger}</td>
                <td>{x.debit_account_details?.title}</td>
                <td>{x.new_credit_ledger}</td>
                <td>{x.credit_account_details?.title}</td>
                <td>{detail?.doc_type?.description}</td>
                <td>{detail?.doc_no}</td>
                <td>{detail?.bank?.description}</td>
                <td>{detail?.city?.description}</td>
                <td>{detail?.currency?.currency_code}</td>
                <td>{detail?.amount}</td>
                <td>{x.creator?.user_id}</td>
                <td>{formatDate(x?.updated_at, 'HH:MM')}</td>
                <td>{x?.attachments === 'yes' ? 'Yes' : 'No'}</td>
              </tr>
            ))
          )}
        </tbody>
      )}
    </CustomTable>
  );
};

export default withFilters(CurrencyTransferTable);
