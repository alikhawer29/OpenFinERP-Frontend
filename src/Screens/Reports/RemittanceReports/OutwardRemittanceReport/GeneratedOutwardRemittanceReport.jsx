import { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import BackButton from '../../../../Components/BackButton';
import CustomButton from '../../../../Components/CustomButton';
import CustomTable from '../../../../Components/CustomTable/CustomTable';
import withFilters from '../../../../HOC/withFilters ';
import useModulePermissions from '../../../../Hooks/useModulePermissions';
import { useFetchTableData } from '../../../../Hooks/useTable';
import { getOutwardRemittanceReport } from '../../../../Services/Reports/OutwardRemittanceReport';
import { outwardRemittanceReportHeaders } from '../../../../Utils/Constants/TableHeaders';
import { downloadFile, reportPrint } from '../../../../Utils/Utils';
import { usePageTitle } from '../../../../Hooks/usePageTitle';

const GeneratedOutwardRemittanceReport = ({
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Outward Remittance Report');
  const [selectedItem, setSelectedItem] = useState(null);

  const location = useLocation();
  const { state } = location;

  const permissions = useModulePermissions(
    'reports',
    'outward_remittance_report'
  );
  const { allowToExcel, allowToPdf } = permissions;

  const {
    data: generateOutwardRemittanceReport,
    isLoading,
    isError,
  } = useFetchTableData(
    'getOutwardRemittanceReport',
    filters,
    updatePagination,
    getOutwardRemittanceReport
  );

  const tableData = generateOutwardRemittanceReport?.data || [];

  useEffect(() => {
    setFilters(() => ({
      ...state,
    }));
  }, []);

  return (
    <section>
      <div className="d-flex justify-content-between flex-wrap mb-3">
        <div className="d-flex flex-column gap-2 mb-4">
          <BackButton />
          <h2 className="screen-title m-0 d-inline">
            Outward Remittance Report
          </h2>
        </div>
        <div className="d-flex gap-3 flex-wrap">
          {allowToExcel && (
            <CustomButton
              text={'Export to Excel'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile('outward-remittance-report', 'xlsx');
              }}
            />
          )}
          {allowToPdf && (
            <CustomButton
              text={'Export to PDF'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile('outward-remittance-report', 'pdf');
              }}
            />
          )}
          <CustomButton
            text={'Print'}
            onClick={() => {
              reportPrint('outward-remittance-report');
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
                {tableData?.map((item, index) => (
                  <tr key={index++} onClick={() => setSelectedItem(item)}>
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
                    <td>{item.confirm}</td>
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

export default withFilters(GeneratedOutwardRemittanceReport);
