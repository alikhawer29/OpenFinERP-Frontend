import React from 'react';
import { Col, Row } from 'react-bootstrap';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import withFilters from '../../../HOC/withFilters ';
import { useFetchTableData } from '../../../Hooks/useTable';
import { getAccountToAccountListing } from '../../../Services/Transaction/AccountToAccount';
import { formatDate } from '../../../Utils/Utils';
import { accountToAccountTableHeaders } from '../../../Utils/Constants/TableHeaders';

const AccountToAccountTable = ({
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
    data: { data: accountToAccountData = [] } = {},
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'accountToAccountListing',
    {
      ...filters,
      date: date,
    },
    updatePagination,
    getAccountToAccountListing
  );
  return (
    <Row>
      <Col xs={12}>
        <CustomTable
          hasFilters={false}
          headers={accountToAccountTableHeaders}
          pagination={pagination}
          updatePagination={updatePagination}
          isLoading={isLoading}
          hideItemsPerPage
          hideSearch
          setFilters={setFilters}
        >
          {(accountToAccountData?.length || isError) && (
            <tbody>
              {isError && (
                <tr>
                  <td colSpan={accountToAccountTableHeaders.length}>
                    <p className="text-danger mb-0">
                      Unable to fetch data at this time
                    </p>
                  </td>
                </tr>
              )}
              {accountToAccountData?.map((item) => (
                <tr key={item.id}>
                  <td>{formatDate(item.date)}</td>
                  <td
                    onClick={() => {
                      setSearchTerm(item.voucher.voucher_no);
                      setWriteTerm(item.voucher.voucher_no);
                      setPageState('view');
                    }}
                  >
                    <p className="hyper-link text-decoration-underline cp mb-0">
                      {item.voucher?.voucher_no}
                    </p>
                  </td>
                  <td>{item.debit_ledger}</td>
                  <td>{item.debit_account_details?.title}</td>
                  <td>{item.credit_ledger}</td>
                  <td>{item.credit_account_details?.title}</td>
                  <td>{item.currency?.currency_code}</td>
                  <td>{item.fc_amount}</td>
                  <td>{item.lc_amount}</td>
                  <td>{item.creator?.user_id}</td>
                  <td>{formatDate(item?.updated_at, 'HH:MM')}</td>
                  <td>{item?.attachments === 'yes' ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          )}
        </CustomTable>
      </Col>
    </Row>
  );
};

export default withFilters(AccountToAccountTable);
