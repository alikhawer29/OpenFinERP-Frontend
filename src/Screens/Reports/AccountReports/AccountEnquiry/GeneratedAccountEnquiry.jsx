import React, { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import BackButton from '../../../../Components/BackButton';
import CustomButton from '../../../../Components/CustomButton';
import CustomTable from '../../../../Components/CustomTable/CustomTable';
import withFilters from '../../../../HOC/withFilters ';
import useModulePermissions from '../../../../Hooks/useModulePermissions';
import { useFetchTableData } from '../../../../Hooks/useTable';
import { getAccountEnquiryReport } from '../../../../Services/Reports/AccountEnquiryReport';
import { accountEnquiryHeaders } from '../../../../Utils/Constants/TableHeaders';
import {
  downloadFile,
  formatNumberForDisplay,
  reportPrint,
} from '../../../../Utils/Utils';
import { usePageTitle } from '../../../../Hooks/usePageTitle';

const GeneratedAccountEnquiry = ({
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Account Enquiry');
  const [selectedItem, setSelectedItem] = useState(null);

  const permissions = useModulePermissions('reports', 'account_enquiry');
  const { allowToExcel, allowToPdf } = permissions;

  const location = useLocation();
  const { state } = location;

  const {
    data: generateAccountEnquiryReport,
    isLoading,
    isError,
  } = useFetchTableData(
    'getAccountEnquiryReport',
    filters,
    updatePagination,
    getAccountEnquiryReport
  );

  const tableData = generateAccountEnquiryReport?.data || [];

  // Merge navigation state (filters from Generate page) into existing filters
  // so we KEEP page, per_page, search, from, to, status from withFilters
  useEffect(() => {
    if (state && Object.keys(state).length > 0) {
      setFilters((prev) => ({
        ...prev,
        ...state,
      }));
    }
  }, [state, setFilters]);

  return (
    <section>
      <div className="d-flex justify-content-between flex-wrap mb-3">
        <div className="d-flex flex-column gap-2 mb-4">
          <BackButton />
          <h2 className="screen-title m-0 d-inline">Account Enquiry</h2>
        </div>
        <div className="d-flex gap-3 flex-wrap">
          {allowToExcel && (
            <CustomButton
              text={'Export to Excel'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile('account-enquiry', 'xlsx');
              }}
            />
          )}
          {allowToPdf && (
            <CustomButton
              text={'Export to PDF'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile('account-enquiry', 'pdf');
              }}
            />
          )}
          <CustomButton
            text={'Print'}
            onClick={() => {
              reportPrint('account-enquiry');
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
                {tableData?.map((item, index) => (
                  <tr key={index++} onClick={() => setSelectedItem(item)}>
                    <td>{item.type}</td>
                    <td>{item.number}</td>
                    <td>{item.date}</td>
                    <td>{item.title_of_account}</td>
                    <td>{item.narration}</td>
                    <td>{item.debit || ''}</td>
                    <td>{item.credit || ''}</td>
                    <td>{item.fcy}</td>
                    <td>{item.fc_amount || ''}</td>
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

export default withFilters(GeneratedAccountEnquiry);
