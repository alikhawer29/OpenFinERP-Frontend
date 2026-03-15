import React from 'react';
import { Col, Row } from 'react-bootstrap';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import withFilters from '../../../HOC/withFilters ';
import { useFetchTableData } from '../../../Hooks/useTable';
import { getJournalVoucherListing } from '../../../Services/Transaction/JournalVoucher';
import { journalVoucherListHeaders } from '../../../Utils/Constants/TableHeaders';
import { formatDate, formatNumberForDisplay } from '../../../Utils/Utils';

const JournalVouchersTable = ({
  date,
  filters,
  pagination,
  updatePagination,
  setPageState,
  setSearchTerm,
  setFilters,
}) => {
  const {
    data: { data: journalVoucherData = [] } = {},
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    ['journalVoucherListing', date],
    {
      ...filters,
      date: date,
    },
    updatePagination,
    getJournalVoucherListing
  );

  if (isError) {
    console.error(error);
  }

  return (
    <Row>
      <Col xs={12}>
        <CustomTable
          hasFilters={false}
          headers={journalVoucherListHeaders}
          pagination={pagination}
          updatePagination={updatePagination}
          isLoading={isLoading}
          hideItemsPerPage
          hideSearch
          setFilters={setFilters}
        >
          {(journalVoucherData?.length || isError) && (
            <tbody>
              {isError && (
                <tr>
                  <td colSpan={journalVoucherListHeaders.length}>
                    <p className="text-danger mb-0">
                      Unable to fetch data at this time
                    </p>
                  </td>
                </tr>
              )}
              {journalVoucherData?.map((item) => (
                <tr key={item.id}>
                  <td>{formatDate(item?.voucher?.date)}</td>
                  <td
                    onClick={() => {
                      setSearchTerm(item.voucher?.voucher_no);
                      setPageState('view');
                    }}
                  >
                    <p className="hyper-link text-decoration-underline cp mb-0">
                      {item.voucher?.voucher_no}
                    </p>
                  </td>
                  <td>{item.new_ledger}</td>
                  <td>{item.account_details?.title}</td>
                  <td>{item?.narration}</td>
                  <td>{item.currency?.currency_code}</td>
                  <td>{formatNumberForDisplay(item.fc_amount, 2)}</td>
                  <td>{formatNumberForDisplay(item.lc_amount, 2)}</td>
                  <td>{item.sign}</td>
                  <td>{item?.creator?.user_name}</td>
                  <td>{formatDate(item.created_at, 'HH:MM')}</td>
                  <td>
                    {item.attachments?.charAt(0).toUpperCase() +
                      item?.attachments?.slice(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </CustomTable>
      </Col>
    </Row>
  );
};

export default withFilters(JournalVouchersTable);
