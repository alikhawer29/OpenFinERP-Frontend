import React from 'react';
import { Col, Row } from 'react-bootstrap';
import { HiOutlineEye } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import StatusChip from '../../../Components/StatusChip/StatusChip';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import withFilters from '../../../HOC/withFilters ';
import withModal from '../../../HOC/withModal';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { unlockRequestData } from '../../../Mocks/MockData';
import {
  generalStatusFiltersConfig,
  statusFiltersConfig,
  subscriptionStatusFiltersConfig,
} from '../../../Utils/Constants/TableFilter';
import { unlockRequestHeaders } from '../../../Utils/Constants/TableHeaders';
import { formatDate, showErrorToast } from '../../../Utils/Utils';
import { useFetchTableData } from '../../../Hooks/useTable';
import { getUnlockRequestListing } from '../../../Services/Admin/UnlockRequest';

const UnlockRequestManagement = ({
  showModal,
  closeModal,
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Unlock Request Management');
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useFetchTableData(
    'unlockRequestLogs',
    filters,
    updatePagination,
    getUnlockRequestListing
  );

  const unlockRequestManagement = data?.data || [];
  if (isError) {
    showErrorToast(error);
  }

  return (
    <>
      <section>
        <div className="d-flex justify-content-between flex-wrap mb-3">
          <h2 className="screen-title mb-0">Unlock Request Management</h2>
        </div>
        <Row>
          <Col xs={12}>
            <CustomTable
              filters={filters}
              setFilters={setFilters}
              headers={unlockRequestHeaders}
              pagination={pagination}
              isLoading={isLoading}
              selectOptions={[
                {
                  title: 'status',
                  options: subscriptionStatusFiltersConfig,
                },
              ]}
            >
              {(unlockRequestManagement?.length || isError) && (
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={unlockRequestHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {unlockRequestManagement?.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {formatDate(item?.created_at, 'DD/MM/YYYY - HH:MM')}
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
                              onClick: () => navigate(`${item.id}`),
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

export default withModal(withFilters(UnlockRequestManagement));
