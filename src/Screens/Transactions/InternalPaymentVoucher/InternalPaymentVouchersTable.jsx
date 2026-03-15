import React from 'react';
import { Col, Row } from 'react-bootstrap';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import withFilters from '../../../HOC/withFilters ';
import { useFetchTableData } from '../../../Hooks/useTable.js';
import { getInternalPaymentVoucherListing } from '../../../Services/Transaction/InternalPaymentVoucher.js';
import {
  internalPaymentVoucherTableHeaders
} from '../../../Utils/Constants/TableHeaders';
import { formatDate, formatNumberForDisplay } from '../../../Utils/Utils';

const InternalPaymentVouchersTable = ({
  date,
  filters,
  pagination,
  updatePagination,
  setPageState,
  setSearchTerm,
  pageState,
  setFilters,
}) => {
  const {
    data: { data: internalPaymentVoucherData = [] } = {},
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'internalPaymentVoucherListing',
    {
      ...filters,
      date: date
    },
    updatePagination,
    getInternalPaymentVoucherListing
  );

  if (isError) {
    console.error(error);
  }

  return (
    <Row>
      <Col xs={12}>
        <CustomTable
          headers={internalPaymentVoucherTableHeaders}
          pagination={pagination}
          updatePagination={updatePagination}
          isLoading={isLoading}
          hideItemsPerPage
          hideSearch
          setFilters={setFilters}
        >

          {(internalPaymentVoucherData?.length || isError) && (
            <tbody>
              {isError && (
                <tr>
                  <td colSpan={internalPaymentVoucherTableHeaders.length}>
                    <p className="text-danger mb-0">
                      Unable to fetch data at this time
                    </p>
                  </td>
                </tr>
              )}
              {internalPaymentVoucherData?.map((item, index) => (
                <tr key={index}>
                  <td>{formatDate(item?.voucher_date)}</td>
                  <td
                    onClick={() => {
                      setSearchTerm(item.voucher_no);
                      setPageState('view');
                    }}
                  >
                    <p className="hyper-link text-decoration-underline cp mb-0">
                      {item.voucher_no}
                    </p>
                  </td>
                  <td>{item.credit_ledger
                    ?.split(' ')
                    .map(word => word.charAt(0))
                    .join('')
                  }</td>
                  <td>{item.credit_account}</td>
                  <td>{item.debit_ledger
                    ?.split(' ')
                    .map(word => word.charAt(0))
                    .join('')
                  }</td>
                  <td>{item.debit_account}</td>
                  <td>{item.currency}</td>
                  <td>{formatNumberForDisplay(item.vat_detail.amount, 2)}</td>
                  <td>{item.vat_detail?.vat_terms === 'Fixed'
                    ? `${item.vat_detail?.vat_terms} - ${item.vat_detail?.vat_percentage}%`
                    : formatNumberForDisplay(item.vat_detail?.vat_amount, 2)
                  }</td>
                  <td>{formatNumberForDisplay(item.fc_net_total, 2)}</td>
                  <td>{formatNumberForDisplay(item.lc_net_total, 2)}</td>
                  <td>{item.creator}</td>
                  <td>
                    {formatDate(item.vat_detail.created_at, 'DD/MM/YYYY - HH:MM:SS')}</td>
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

export default withFilters(InternalPaymentVouchersTable);
