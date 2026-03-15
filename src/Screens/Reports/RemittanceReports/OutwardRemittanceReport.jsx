import React from 'react';
import { Col, Row } from 'react-bootstrap';
import CustomButton from '../../../Components/CustomButton';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import withFilters from '../../../HOC/withFilters ';
import { outwardRemittanceReportData } from '../../../Mocks/MockData';
import { outwardRemittanceReportHeaders } from '../../../Utils/Constants/TableHeaders';
import { usePageTitle } from '../../../Hooks/usePageTitle';

const OutwardRemittanceReport = ({ filters, setFilters, pagination }) => {
  usePageTitle('Outward Remittance Report');
  const tableData = outwardRemittanceReportData.detail;
  const isLoading = false;
  const isError = false;

  return (
    <section>
      <div className="d-flex justify-content-between flex-wrap mb-3">
        <h2 className="screen-title m-0 d-inline">Outward Remittance Report</h2>
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
            headers={outwardRemittanceReportHeaders}
            pagination={pagination}
            isLoading={isLoading}
            hideSearch
            selectOptions={[
              {
                title: 'Transaction Type',
                options: [{ value: 'All', label: 'All' }],
              },
              { title: 'Status', options: [{ value: 'All', label: 'All' }] },
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
              { title: 'Sort By', options: [{ value: 'All', label: 'All' }] },
              { title: 'User', options: [{ value: 'All', label: 'All' }] },
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
                    <td colSpan={outwardRemittanceReportHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {tableData?.map((item) => (
                  <tr key={item.id}>
                    <td>{item.tran_type}</td>
                    <td>{item.tran_no}</td>
                    <td>{item.date}</td>
                    <td>{item.account}</td>
                    <td>{item.beneficiary}</td>
                    <td>{item.fcy}</td>
                    <td>{item.fc_amount}</td>
                    <td>{item.against_fcy}</td>
                    <td>{item.rate}</td>
                    <td>{item.commission}</td>
                    <td>{item.doc_swift}</td>
                    <td>{item.against_fc_amount}</td>
                    <td>{item.confirmation_status}</td>
                    <td>{item.comment}</td>
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

export default withFilters(OutwardRemittanceReport);
