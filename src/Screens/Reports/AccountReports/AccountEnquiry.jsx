import React from 'react';
import { Col, Row } from 'react-bootstrap';
import CustomButton from '../../../Components/CustomButton';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import withFilters from '../../../HOC/withFilters ';
import {
  accountEnquiryData
} from '../../../Mocks/MockData';
import {
  accountEnquiryHeaders
} from '../../../Utils/Constants/TableHeaders';
import useUserStore from '../../../Stores/UserStore';
import { formatNumberForDisplay } from '../../../Utils/Utils';

const AccountEnquiry = ({ filters, setFilters, pagination }) => {
  const { user: { base_currency } = {} } = useUserStore();
  const tableData = accountEnquiryData.detail;
  const isLoading = false;
  const isError = false;

  return (
    <section>
      <div className="d-flex justify-content-between flex-wrap mb-3">
        <h2 className="screen-title m-0 d-inline">Account Enquiry</h2>
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
            headers={accountEnquiryHeaders}
            pagination={pagination}
            isLoading={isLoading}
            hideSearch
            selectOptions={[
              {
                title: 'Account Type',
                options: [{ value: 'All', label: 'All' }],
              },
              {
                title: 'Account',
                options: [{ value: 'All', label: 'All' }],
              },
              {
                title: 'Transaction Type',
                options: [{ value: 'All', label: 'All' }],
              },
              { title: 'FCy', options: [{ value: 'All', label: 'All' }] },
            ]}
            dateFilters={[{ title: 'Period' }]}
            rangeFilters={[
              { title: `${base_currency || 'LC'} Amount Range` },
              { title: 'FC Amount Range' },
              { title: 'Transaction Range' },
            ]}
          >
            {(tableData?.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={accountEnquiryHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {tableData?.map((item) => (
                  <tr key={item.id}>
                    <td>{item.type}</td>
                    <td>{item.number}</td>
                    <td>{item.date}</td>
                    <td>{item.title_of_account}</td>
                    <td>{item.narration}</td>
                    <td>{item.debit ? formatNumberForDisplay(item.debit, 2) : ''}</td>
                    <td>{item.credit ? formatNumberForDisplay(item.credit, 2) : ''}</td>
                    <td>{item.fcy}</td>
                    <td>{item.fc_amount ? formatNumberForDisplay(item.fc_amount, 2) : ''}</td>
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

export default withFilters(AccountEnquiry);
