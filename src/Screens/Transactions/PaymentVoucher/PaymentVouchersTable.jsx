import { Col, Row } from 'react-bootstrap';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import withFilters from '../../../HOC/withFilters ';
import { useFetchTableData } from '../../../Hooks/useTable';
import { getPaymentVoucherListing } from '../../../Services/Transaction/PaymentVoucher.js';
import { paymentVoucherTableHeaders } from '../../../Utils/Constants/TableHeaders';
import { formatDate, formatNumberForDisplay } from '../../../Utils/Utils';
import CommissionTypeDisplay from '../../../Components/CommissionTypeDisplay/CommissionTypeDisplay.jsx';

const PaymentVouchersTable = ({
  date,
  filters,
  setFilters,
  pagination,
  updatePagination,
  setPageState,
  setSearchTerm,
}) => {
  const {
    data: { data: paymentVoucherData = [] } = {},
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'paymentVoucherListing',
    {
      ...filters,
      date: date,
    },
    updatePagination,
    getPaymentVoucherListing
  );


  if (isError) {
    console.error(error);
  }

  return (
    <Row>
      <Col xs={12}>
        <CustomTable
          setFilters={setFilters}
          headers={paymentVoucherTableHeaders}
          pagination={pagination}
          updatePagination={updatePagination}
          isLoading={isLoading}
          hideItemsPerPage
          hideSearch
        >
          {(paymentVoucherData?.length || isError) && (
            <tbody>
              {isError && (
                <tr>
                  <td colSpan={paymentVoucherTableHeaders.length}>
                    <p className="text-danger mb-0">
                      Unable to fetch data at this time
                    </p>
                  </td>
                </tr>
              )}
              {paymentVoucherData?.map((item) => (
                <tr key={item.id}>
                  <td>{formatDate(item.date, 'DD/MM/YYYY')}</td>
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
                  <td>{item.short_ledger || "-"}</td>
                  <td>{item.account_details?.title || "-"}</td>
                  <td>{item.paid_to?.name || "-"}</td>
                  <td>{item.mode || "-"}</td>
                  <td>{item.mode_account_id?.account_name || "-"}</td>
                  <td>{item.currency?.currency_code || "-"}</td>
                  <td>{formatNumberForDisplay(item.amount, 2 || "-")}</td>
                  <td>
                    <CommissionTypeDisplay item={item}>
                      {Number(
                        item.commission ||
                        item?.special_commission?.total_commission
                      ) > 0
                        ? formatNumberForDisplay(
                          item.commission ||
                          item?.special_commission?.total_commission,
                          2
                        )
                        : '-'}
                    </CommissionTypeDisplay>
                  </td>

                  <td>
                    {item?.vat_terms === 'Fixed'
                      ? `${item?.vat_terms} - ${item?.vat_percentage || "-"}%`
                      : item?.vat_terms || "-"}
                  </td>
                  <td>{formatNumberForDisplay(item.net_total, 2 || "-")}</td>
                  <td>{formatNumberForDisplay(item?.lc_net_total, 2 || "-")}</td>
                  <td>{item.creator?.user_name || "-"}</td>
                  <td>{formatDate(item.created_at, 'HH:MM') || "-"}</td>
                  <td>
                    {item.attachments?.charAt(0).toUpperCase() +
                      item?.attachments?.slice(1) || "-"}
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

export default withFilters(PaymentVouchersTable);
