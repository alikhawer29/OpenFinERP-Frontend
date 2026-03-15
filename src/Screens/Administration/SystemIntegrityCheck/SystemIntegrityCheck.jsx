import React from 'react';
import { Col, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { systemIntegrityData } from '../../../Mocks/MockData';
import {
  statusFiltersConfig,
  systemIntegrityFiltersConfig,
} from '../../../Utils/Constants/TableFilter';
import { systemIntegrityHeaders } from '../../../Utils/Constants/TableHeaders';
import withFilters from '../../../HOC/withFilters ';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { formatDate, showErrorToast } from '../../../Utils/Utils';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import { useFetchTableData } from '../../../Hooks/useTable';
import { getSystemIntegrityCheckListing } from '../../../Services/Administration/SystemIntegrityCheck';
import useModulePermissions from '../../../Hooks/useModulePermissions';

const SystemIntegrityCheck = ({
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('System Integrity Check');
  const { data, isLoading, isError, error } = useFetchTableData(
    'systemIntegrityCheckListing',
    filters,
    updatePagination,
    getSystemIntegrityCheckListing
  );
  const systemIntegrity = data?.data || [];

  if (isError) {
    showErrorToast(error);
  }

  return (
    <>
      <section>
        <div className="d-flex justify-content-between flex-wrap mb-4">
          <h2 className="screen-title mb-0">System Integrity Check</h2>
        </div>
        <Row>
          <Col xs={12}>
            <CustomTable
              filters={filters}
              setFilters={setFilters}
              headers={systemIntegrityHeaders}
              pagination={pagination}
              isLoading={isLoading}
              dateFilters={[{ label: 'Date', title: 'date', type: 'date' }]}
              hideSearch={true}
              selectOptions={[
                {
                  title: 'code',
                  label: 'Code',
                  options: systemIntegrityFiltersConfig,
                },
              ]}
              useClearButton={true}
            >
              {(systemIntegrity.length || isError) && (
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={systemIntegrityHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {systemIntegrity?.map((item) => (
                    <tr key={item.id}>
                      <td>{item?.type}</td>
                      <td>{item?.number}</td>
                      <td>{formatDate(item?.date, 'DD/MM/YYYY')}</td>
                      <td>{item?.title_of_account}</td>
                      <td>{item?.narration}</td>
                      <td>{item?.fcy}</td>
                      <td>{item?.fc_amount}</td>
                      <td>{item?.lc_debit}</td>
                      <td>{item?.lc_credit}</td>
                      <td>{item?.cost_center}</td>
                      <td>{item?.user_id}</td>
                      <td>{item?.issue_descriptions}</td>
                    </tr>
                  ))}
                </tbody>
              )}
            </CustomTable>
          </Col>
        </Row>
      </section>
    </>
  );
};

export default withFilters(SystemIntegrityCheck);
