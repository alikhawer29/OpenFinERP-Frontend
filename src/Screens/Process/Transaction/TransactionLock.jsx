import { Col, Row } from 'react-bootstrap';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import withFilters from '../../../HOC/withFilters ';
import withModal from '../../../HOC/withModal';
import { useFetchTableData } from '../../../Hooks/useTable';
import { getTransactionLockListing } from '../../../Services/Process/Transaction';
import { statusFiltersConfig } from '../../../Utils/Constants/TableFilter';
import { transactionLockHeaders } from '../../../Utils/Constants/TableHeaders';
import { formatDate, showErrorToast } from '../../../Utils/Utils';

const TransactionLock = ({
  filters,
  setFilters,
  pagination,
  updatePagination,
  showModal,
}) => {
  const {
    data: { data: transactionLockData = [] } = {},
    isLoading: isLoadingTransactionLock,
    isError: isErrorTransactionLock,
    error: TransactionLockError,
  } = useFetchTableData(
    'TransactionLockListing',
    filters,
    updatePagination,
    getTransactionLockListing
  );

  if (TransactionLockError) {
    showErrorToast(TransactionLockError, 'error');
  }

  return (
    <>
      <div className="d-flex justify-content-between flex-wrap mb-4">
        <h2 className="screen-title mb-0">Transaction Lock</h2>
      </div>
      <Row>
        <Col xs={12}>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={transactionLockHeaders}
            pagination={pagination}
            isLoading={isLoadingTransactionLock}
            selectOptions={[
              {
                title: 'Trans. Type',
                options: statusFiltersConfig,
              },
            ]}
            dateFilters={[{ title: 'Period', type: 'date', label: 'Period' }]}
            rangeFilters={[{ title: 'Transaction No.', type: 'number', label: 'Trans No.' }]}
          >
            {(transactionLockData.length || isErrorTransactionLock) && (
              <tbody>
                {isErrorTransactionLock && (
                  <tr>
                    <td colSpan={transactionLockHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {transactionLockData?.map((item) => (
                  <tr key={item.id}>
                    <td>{item?.transaction}</td>
                    <td>{item?.transaction_no}</td>
                    <td>{formatDate(item?.transaction_date)}</td>
                    <td>{item?.party}</td>
                    <td>{item?.currency}</td>
                    <td>{item?.amount}</td>
                    <td>{item?.locked_by}</td>
                    <td>
                      {formatDate(item?.locked_at, 'DD/MM/YYYY - HH:MM:SS')}
                    </td>
                    <td>
                      <p className="text-link warning cp mb-0">Release</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </CustomTable>
        </Col>
      </Row>
    </>
  );
};

export default withModal(withFilters(TransactionLock));
