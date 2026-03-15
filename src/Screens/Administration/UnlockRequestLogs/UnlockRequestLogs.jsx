import React from 'react';
import { Col, Row } from 'react-bootstrap';
import { HiOutlineEye } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import StatusChip from '../../../Components/StatusChip/StatusChip';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import withFilters from '../../../HOC/withFilters ';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';
import { unlockRequestFilterOptions } from '../../../Utils/Constants/TableFilter';
import { unlockRequestLogsHeaders } from '../../../Utils/Constants/TableHeaders';
import { formatDate, serialNum, showErrorToast } from '../../../Utils/Utils';
import { unlockRequestLogsData } from '../../../Mocks/MockData';
import { getUnlockRequestListing } from '../../../Services/Administration/UnlockRequest';

const UnlockRequestLogs = ({
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Unlock Request Logs');
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useFetchTableData(
    'unlockRequestLogs',
    filters,
    updatePagination,
    getUnlockRequestListing
  );

  const unlockRequestData = data?.data || [];
  if (isError) {
    showErrorToast(error);
  }

  return (
    <>
      <section>
        <div className="d-flex justify-content-between flex-wrap mb-3">
          <h2 className="screen-title mb-0">Unlock Request Logs</h2>
        </div>
        <Row>
          <Col xs={12}>
            <CustomTable
              filters={filters}
              setFilters={setFilters}
              headers={unlockRequestLogsHeaders}
              pagination={pagination}
              isLoading={isLoading}
              selectOptions={[
                {
                  title: 'status',
                  options: unlockRequestFilterOptions,
                },
              ]}
            >
              {(unlockRequestData.length || isError) && (
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={unlockRequestLogsHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {unlockRequestData?.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        {formatDate(item?.start_date, 'DD/MM/YYYY - HH:MM')}
                      </td>
                      <td>{item?.user?.user_name}</td>
                      <td>
                        {formatDate(item?.reviewed_at, 'DD/MM/YYYY - HH:MM')}
                      </td>
                      <td>
                        <StatusChip status={item.status} />
                      </td>
                      <td>
                        <TableActionDropDown
                          actions={[
                            {
                              name: 'View',
                              icon: HiOutlineEye,
                              onClick: () => {
                                navigate(`${item.id}`);
                              },
                              className: 'view',
                            },
                          ]}
                        />
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

export default withFilters(UnlockRequestLogs);
