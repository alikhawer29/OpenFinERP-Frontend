import { useEffect } from 'react';
import { Col, Row } from 'react-bootstrap';
import BackButton from '../../../../Components/BackButton';
import CustomButton from '../../../../Components/CustomButton';
import CustomTable from '../../../../Components/CustomTable/CustomTable';
import withFilters from '../../../../HOC/withFilters ';
import { postDatedChequesHeaders } from '../../../../Utils/Constants/TableHeaders';
import { useLocation } from 'react-router-dom';
import { downloadFile, reportPrint } from '../../../../Utils/Utils';
import { postDatedChequeReportsListing } from '../../../../Services/Reports/WalkinCustomeReport';
import { useFetchTableData } from '../../../../Hooks/useTable';
import useModulePermissions from '../../../../Hooks/useModulePermissions';
import { usePageTitle } from '../../../../Hooks/usePageTitle';
import { useQuery } from '@tanstack/react-query';

const GeneratedPostDatedChequeReport = ({
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Post Dated Cheque Report');

  const location = useLocation();
  const { state } = location;

  const permissions = useModulePermissions(
    'reports',
    'post_dated_cheque_report'
  );
  const { allowToExcel, allowToPdf } = permissions;

  const tableData = useQuery({
    queryKey: ['post-dated-cheque-report', filters],
    queryFn: () => postDatedChequeReportsListing(filters),
    refetchOnWindowFocus: true,
    enabled: !!filters, // prevent auto run if params not ready
  });

  const { mutate, isPending, isError, data: fullReportData, error } = tableData;

  console.log('Post Dated Cheque Report Data:', fullReportData);

  useEffect(() => {
    if (state) {
      setFilters((prev) => ({
        ...state,
      }));
    }
  }, []);

  // Extract the actual data from the API response
  // The service function now returns the data array directly
  const reportData = fullReportData || [];

  return (
    <section>
      <div className="d-flex justify-content-between flex-wrap mb-3">
        <div className="d-flex flex-column gap-2 mb-4">
          <BackButton />
          <h2 className="screen-title m-0 d-inline">
            Post Dated Cheque Report
          </h2>
        </div>
        <div className="d-flex gap-3 flex-wrap">
          {allowToExcel && (
            <CustomButton
              text={'Export to Excel'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile('post-dated-cheque-report', 'excel');
              }}
            />
          )}
          {allowToPdf && (
            <CustomButton
              text={'Export to PDF'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile('post-dated-cheque-report', 'pdf');
              }}
            />
          )}
          <CustomButton
            text={'Print'}
            onClick={() => {
              reportPrint('post-dated-cheque-report');
            }}
          />
        </div>
      </div>
      <Row>
        <Col xs={12}>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={postDatedChequesHeaders}
            pagination={pagination}
            isLoading={isPending}
            hideSearch
            isPaginated={false}
          >
            {(reportData?.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={postDatedChequesHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {reportData?.map((item, index) => (
                  <tr
                    key={item.id || index}
                    style={{
                      fontWeight: item?.is_total_row ? 'bold' : 'normal',
                      backgroundColor: item?.is_total_row
                        ? '#f8f9fa'
                        : 'transparent',
                    }}
                  >
                    <td>{item.title_of_account}</td>
                    <td>{item.cheque_no}</td>
                    <td>{item.base_amount}</td>
                    <td>{item.due_date}</td>
                    <td>{item.drawn_on}</td>
                    <td>{item.posting_date}</td>
                    <td>{item.status}</td>
                    <td>{item.fcy}</td>
                    <td>{item.fc_amount}</td>
                    <td>{item.cost_center}</td>
                    <td>{item.discount_collection_bank || '-'}</td>
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

export default withFilters(GeneratedPostDatedChequeReport);
