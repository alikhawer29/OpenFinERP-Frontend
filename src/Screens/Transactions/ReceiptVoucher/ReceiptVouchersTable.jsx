import React from 'react';
import { Col, Row } from 'react-bootstrap';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import withFilters from '../../../HOC/withFilters ';
import { useFetchTableData } from '../../../Hooks/useTable';
import { receiptVoucherTableHeaders } from '../../../Utils/Constants/TableHeaders';
import { formatDate, formatNumberForDisplay, showErrorToast } from '../../../Utils/Utils';
import CommissionTypeDisplay from '../../../Components/CommissionTypeDisplay';
import { getReceiptVoucherListing } from '../../../Services/Transaction/ReceiptVoucher';

const ReceiptVouchersTable = ({
  date,
  filters,
  setFilters,
  pagination,
  updatePagination,
  setPageState,
  setSearchTerm,
}) => {
  const {
    data: { data: receiptVoucherData = [] } = {},
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'receiptVoucherListing',
    {
      ...filters,
      date: date,
    },
    updatePagination,
    getReceiptVoucherListing
  );

  if (isError) {
    showErrorToast(error);
  }

  return (
    <Row>
      <Col xs={12}>
        <CustomTable
          hasFilters={false}
          setFilters={setFilters}
          headers={receiptVoucherTableHeaders}
          pagination={pagination}
          updatePagination={updatePagination}
          isLoading={isLoading}
          hideItemsPerPage
          hideSearch
        >
          {(receiptVoucherData?.length || isError) && (
            <tbody>
              {isError && (
                <tr>
                  <td colSpan={receiptVoucherTableHeaders.length}>
                    <p className="text-danger mb-0">
                      Unable to fetch data at this time
                    </p>
                  </td>
                </tr>
              )}
              {receiptVoucherData?.map((item) => (
                <tr key={item.id}>
                  <td>{formatDate(item.voucher?.date, 'DD/MM/YYYY')}</td>
                  <td
                    onClick={() => {
                      setSearchTerm(item.voucher.voucher_no);
                      setPageState('view');
                    }}
                  >
                    <p className="hyper-link text-decoration-underline cp mb-0">
                      {item.voucher.voucher_no}
                    </p>
                  </td>
                  <td>{item.new_ledger}</td>
                  <td>{item.account_details?.title}</td>
                  <td>{item.received_from?.name}</td>
                  <td>{item.amount_account?.currency_code}</td>
                  <td>{formatNumberForDisplay(item.amount, 2)}</td>
                  <td>
                    <CommissionTypeDisplay item={item}>
                      {formatNumberForDisplay(item.commission_amount || item?.special_commission?.total_commission || "", 2)}
                    </CommissionTypeDisplay>
                  </td>
                  <td>{formatNumberForDisplay(item?.vat_amount || "", 2)}</td>
                  <td>{formatNumberForDisplay(item.net_total, 2)}</td>
                  <td>{formatNumberForDisplay(item?.lc_net_total, 2)}</td>
                  <td>{item.creator?.user_id}</td>
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

export default withFilters(ReceiptVouchersTable);
