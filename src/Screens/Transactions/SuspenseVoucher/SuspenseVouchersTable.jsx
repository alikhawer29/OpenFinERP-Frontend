import React from 'react';
import { Col, Row } from 'react-bootstrap';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import withFilters from '../../../HOC/withFilters ';
import { useFetchTableData } from '../../../Hooks/useTable';
import { suspenseVouchersTableHeaders } from '../../../Utils/Constants/TableHeaders';
import { formatDate } from '../../../Utils/Utils';
import { getSuspenseVoucherListing } from '../../../Services/Transaction/SuspenseVoucher';
import { statusClassMap } from '../../../Utils/Constants/SelectOptions';

const SuspenseVouchersTable = ({
  date,
  filters,
  pagination,
  updatePagination,
  setPageState,
  setSearchTerm,
  setFilters,
}) => {
  const {
    data: { data: suspenseVoucherData = [] } = {},
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'suspenseVoucherListing',
    {
      ...filters,
      date: date,
    },
    updatePagination,
    getSuspenseVoucherListing
  );


  if (isError) {
    console.error(error);
  }

  return (
    <Row>
      <Col xs={12}>
        <CustomTable
          headers={suspenseVouchersTableHeaders}
          pagination={pagination}
          updatePagination={updatePagination}
          isLoading={isLoading}
          hideItemsPerPage
          hideSearch
          setFilters={setFilters}
        >
          {(suspenseVoucherData?.length || isError) && (
            <tbody>
              {isError && (
                <tr>
                  <td colSpan={suspenseVouchersTableHeaders.length}>
                    <p className="text-danger mb-0">
                      Unable to fetch data at this time
                    </p>
                  </td>
                </tr>
              )}
              {suspenseVoucherData?.map((item) => (
                <>
                  {item?.suspense_voucher_rows?.map((row) => (
                    <tr key={row.id}>
                      <td>{formatDate(item.voucher.date, 'DD/MM/YYYY')}</td>
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
                      <td>{item?.new_ledger}</td>
                      <td>{item?.account_details?.title}</td>
                      <td>{item?.currency?.currency_code}</td>

                      <td>{row?.debit}</td>
                      <td>{row?.credit}</td>
                      <td>
                        <p
                          className={`text-${statusClassMap[row.status_detail?.toLowerCase()]
                            } mb-0`}
                        >
                          {row?.status_detail === 'Settle' ? 'Settled' : row?.status_detail}

                        </p>
                      </td>

                      <td>{item?.creator?.user_name}</td>
                      <td>{formatDate(item?.created_at, 'HH:MM')}</td>
                      <td>{item?.attachments === 'yes' ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          )}
        </CustomTable>
      </Col>
    </Row>
  );
};

export default withFilters(SuspenseVouchersTable);
