import React from 'react';
import { Col, Row } from 'react-bootstrap';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import withFilters from '../../../HOC/withFilters ';
import { currencyTransferRegisterReportData } from '../../../Mocks/MockData';
import { currencyTransferRegisterReportHeaders } from '../../../Utils/Constants/TableHeaders';

const CurrencyTransferRegisterReport = ({
  filters,
  setFilters,
  pagination,
}) => {
  const tableData = currencyTransferRegisterReportData.detail;
  const isLoading = false;
  const isError = false;

  return (
    <section>
      <div className="d-flex justify-content-between flex-wrap mb-3">
        <h2 className="screen-title m-0 d-inline">
          Currency Transfer Register Report
        </h2>
        <div className="d-flex gap-3 flex-wrap">
          <CustomButton
            text={'Export to Excel'}
            variant={'secondaryButton'}
            onClick={() => {
              console.log('Export to Excel');
            }}
          />
          <CustomButton
            text={'Export to PDF'}
            variant={'secondaryButton'}
            onClick={() => {
              console.log('Export to PDF');
            }}
          />
          <CustomButton
            text={'Print'}
            onClick={() => {
              console.log('Print');
            }}
          />
        </div>
      </div>
      <Row>
        <Col xs={12}>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={currencyTransferRegisterReportHeaders}
            pagination={pagination}
            isLoading={isLoading}
            hideSearch
            selectOptions={[
              { title: 'Ledger', options: [{ value: 'All', label: 'All' }] },
              {
                title: 'From Account',
                options: [{ value: 'All', label: 'All' }],
              },
              {
                title: 'To Account',
                options: [{ value: 'All', label: 'All' }],
              },
              { title: 'FCy', options: [{ value: 'All', label: 'All' }] },

              {
                title: 'Showing',
                options: [{ value: 'All', label: 'All' }],
              },
            ]}
            rangeFilters={[
              { title: 'Transaction No. Range' },
              { title: 'FCy Amount Range' },
            ]}
            dateFilters={[{ title: 'Due Date Range' }]}
          >
            {(tableData?.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={currencyTransferRegisterReportHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {tableData?.map((item) => (
                  <tr key={item.id}>
                    <td>{item.tran_no}</td>
                    <td>{item.date}</td>
                    <td>{item.time}</td>
                    <td>{item.from_account}</td>
                    <td>{item.to_account}</td>
                    <td>{item.currency}</td>
                    <td>{item.amount}</td>
                    <td>{item.narration}</td>
                    <td>{item.net_total}</td>
                    <td>{item.doc_type}</td>
                    <td>{item.doc_no}</td>
                    <td>{item.bank}</td>
                    <td>{item.city}</td>
                    <td>{item.code}</td>
                  </tr>
                ))}
              </tbody>
            )}
          </CustomTable>
        </Col>
      </Row>
    </section>
  );
};

export default withFilters(CurrencyTransferRegisterReport);
