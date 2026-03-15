import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import {
  HiOutlineCheckCircle,
  HiOutlineEye,
  HiOutlineXCircle,
} from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { showToast } from '../../../Components/Toast/Toast';
import withFilters from '../../../HOC/withFilters ';
import withModal from '../../../HOC/withModal';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';
import {
  getUsersListing,
  updateStatus,
} from '../../../Services/Admin/UserManagement';
import { statusClassMap } from '../../../Utils/Constants/SelectOptions';
import { userStatusFilters } from '../../../Utils/Constants/TableFilter';
import { userManagementHeaders } from '../../../Utils/Constants/TableHeaders';
import { formatDate, serialNum, showErrorToast } from '../../../Utils/Utils';
import AdminSubscriptionLogs from '../SubscriptionLogs/AdminSubscriptionLogs';

const UserManagement = ({
  showModal,
  closeModal,
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Client Management');
  const navigate = useNavigate();
  const [changeStatusModal, setChangeStatusModal] = useState(false);
  const [selectedObj, setSelectedObj] = useState(null);
  let queryClient = useQueryClient();

  //GET USERS
  const {
    data: fetchedData, // Renamed to avoid confusion with the derived `userManagement`
    isLoading,
    isError,
    error,
    refetch,
  } = useFetchTableData(
    'userListing',
    filters,
    updatePagination,
    getUsersListing
  );

  // Provide a default value for `userManagement`
  const userManagement = fetchedData?.data ?? [];

  if (isError) {
    showErrorToast(error);
  }
  const isStatusActive = (item) => {
    return item?.status_detail === 'Active';
  };

  //UPDATE STATUS
  const handleStatusChange = (item) => {
    setSelectedObj(item);
    setChangeStatusModal(true);
  };

  // Mutation for updating status
  const { mutate: updateStatusMutation, isPending: isStatusUpdating } =
    useMutation({
      mutationFn: async (id) => await updateStatus(id),
      onSuccess: (data) => {
        showToast('Status updated successfully', 'success');
        setChangeStatusModal(false);
        queryClient.invalidateQueries(['userListing', filters]);
      },
      onError: (error) => {
        console.error('Error updating status:', error);
      },
    });

  // Confirm status change
  const confirmStatusChange = () => {
    if (selectedObj) {
      updateStatusMutation(selectedObj.id);
    }
  };

  return (
    <>
      <section>
        <div className="d-flex justify-content-between flex-wrap mb-3">
          <h2 className="screen-title mb-0">Client Management</h2>
        </div>
        <Row>
          <Col xs={12}>
            <CustomTable
              filters={filters}
              setFilters={setFilters}
              headers={userManagementHeaders}
              pagination={pagination}
              isLoading={isLoading}
              selectOptions={[
                {
                  title: 'status',
                  options: userStatusFilters,
                },
              ]}
              dateFilters={[
                {
                  label: 'Registration Date',
                  title: 'registration_date',
                  from: 'from',
                  to: 'to',
                },
              ]}
            >
              {(userManagement?.length || isError) && (
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={userManagementHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {userManagement?.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        {serialNum(
                          (filters?.page - 1) * filters?.per_page + index + 1
                        )}
                      </td>
                      <td>{item?.id}</td>
                      <td>{item?.business_name}</td>
                      <td>{item?.user_name}</td>
                      <td>{item?.user_id}</td>
                      <td>{item?.phone_number}</td>
                      <td>{item?.email}</td>
                      <td>{formatDate(item?.created_at)}</td>
                      <td>
                        <span
                          className={`chip ${
                            statusClassMap[item.status_detail]
                          }`}
                        >
                          {item?.status_detail}
                        </span>
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
                            {
                              name: isStatusActive(item)
                                ? 'Deactivate'
                                : 'Activate',
                              icon: isStatusActive(item)
                                ? HiOutlineXCircle
                                : HiOutlineCheckCircle,
                              onClick: () => handleStatusChange(item),
                              className: isStatusActive(item)
                                ? 'delete with-color'
                                : 'view with-color',
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

      <CustomModal
        show={changeStatusModal}
        close={() => setChangeStatusModal(false)}
        disableClick={isStatusUpdating} // Disable action button during mutation
        action={confirmStatusChange} // Perform status change on confirm
        title={isStatusActive(selectedObj) ? 'Deactivate' : 'Activate'}
        description={`Are you sure you want to ${
          isStatusActive(selectedObj) ? 'deactivate' : 'activate'
        } this user?`}
      />
    </>
  );
};

export default withModal(withFilters(UserManagement));
