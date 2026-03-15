import React from 'react';
import { Col, Row } from 'react-bootstrap';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import withFilters from '../../../HOC/withFilters ';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';
import { formatDate, serialNum, showErrorToast } from '../../../Utils/Utils';
import { userLogsHeaders } from '../../../Utils/Constants/TableHeaders';
import { getUserLogs } from '../../../Services/Administration/UserLogs';

const UserLogs = ({ filters, setFilters, pagination, updatePagination }) => {
  usePageTitle('User Logs');

  const { data, isLoading, isError, error } = useFetchTableData(
    'userLogs',
    filters,
    updatePagination,
    getUserLogs
  );

  const userLogData = data?.data || [];

  if (isError) {
    showErrorToast(error);
  }

  return (
    <>
      <section>
        <div className="d-flex justify-content-between flex-wrap mb-3">
          <h2 className="screen-title mb-0">User Logs</h2>
        </div>
        <Row>
          <Col xs={12}>
            <CustomTable
              filters={filters}
              setFilters={setFilters}
              headers={userLogsHeaders}
              pagination={pagination}
              isLoading={isLoading}
            >
              {(userLogData.length || isError) && (
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={userLogsHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {userLogData?.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        {serialNum(
                          (filters?.page - 1) * filters?.per_page + index + 1
                        )}
                      </td>

                      <td>{item?.user?.user_name}</td>
                      <td>
                        {formatDate(item?.updated_at, 'DD/MM/YYYY - HH:MM:SS')}
                      </td>
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

export default withFilters(UserLogs);
