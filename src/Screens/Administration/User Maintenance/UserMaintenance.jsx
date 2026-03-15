import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import {
  HiOutlineEye,
  HiOutlinePencilSquare,
  HiOutlineTrash,
} from 'react-icons/hi2';
import { Link, useNavigate } from 'react-router-dom';
import CustomButton from '../../../Components/CustomButton';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import StatusChip from '../../../Components/StatusChip/StatusChip';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { showToast } from '../../../Components/Toast/Toast';
import withFilters from '../../../HOC/withFilters ';
import withModal from '../../../HOC/withModal';
import useDataMutations from '../../../Hooks/useDataMutations';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';
import {
  deleteUser,
  getUserMaintenanceListing,
} from '../../../Services/Administration/UserMaintenance';
import { userStatusFiltersConfig } from '../../../Utils/Constants/TableFilter';
import { userMaintenanceHeaders } from '../../../Utils/Constants/TableHeaders';
import { serialNum, showErrorToast } from '../../../Utils/Utils';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import { filterActions } from '../../../Utils/Helpers';

const UserMaintenance = ({
  showModal,
  closeModal,
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('User Maintenance');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedItem, setSelectedItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const permissions = useModulePermissions("administration", "user_maintenance")
  const {create,} = permissions;

  const { data, isLoading, isError, error } = useFetchTableData(
    'userMaintenanceListing',
    filters,
    updatePagination,
    getUserMaintenanceListing
  );

  const userMaintenanceData = data?.data || [];

  //  --- MUTATIONS ---
  const { deleteMutation } = useDataMutations({
    onDeleteSuccessCallback: () => {
      closeModal();
      showToast('User Deleted Successfully', 'success');
      setShowDeleteModal(false);
      queryClient.invalidateQueries(['userMaintenanceListing', filters]);
    },
    onDeleteErrorCallback: (error) => {
      if (
        error.message.toLowerCase() ==
        'the user cannot be deleted as it is currently in use.'
      ) {
        showModal(
          'Cannot be Deleted',
          error.message,
          () => closeModal(),
          'error'
        );
      } else {
        showErrorToast(error);
      }
    },
  });
  //  --- MUTATIONS END ---

  // Function to handle edit action
  const handleEdit = (item) => {
    navigate(`${item.id}/edit`);
  };

  // Function to handle Delete action
  const handleDelete = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  if (isError) {
    showErrorToast(error);
  }

  return (
    <>
      <section>
        <div className="d-flex justify-content-between flex-wrap mb-3">
          <h2 className="screen-title mb-0">User Maintenance</h2>
          {
            create &&
          <Link to={'new'}>
            <CustomButton text={'New'} />
          </Link>
          }
        </div>
        <Row>
          <Col xs={12}>
            <CustomTable
              filters={filters}
              setFilters={setFilters}
              headers={userMaintenanceHeaders}
              pagination={pagination}
              isLoading={isLoading}
              selectOptions={[
                {
                  title: 'status',
                  options: userStatusFiltersConfig,
                },
              ]}
            >
              {(userMaintenanceData.length || isError) && (
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={userMaintenanceHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {userMaintenanceData?.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        {serialNum(
                          (filters?.page - 1) * filters?.per_page + index + 1
                        )}
                      </td>

                      <td>{item.user_id}</td>
                      <td>{item.user_name}</td>
                      <td>{item.phone_number}</td>
                      <td>
                        <StatusChip status={item.status_detail} />
                      </td>
                      <td>
                        <TableActionDropDown
                          actions={filterActions([
                            {
                              name: 'View',
                              icon: HiOutlineEye,
                              onClick: () => navigate(`${item.id}`),
                              className: 'view',
                            },
                            {
                              name: 'Edit',
                              icon: HiOutlinePencilSquare,
                              onClick: () => handleEdit(item),
                              className: 'edit',
                            },
                            {
                              name: 'Delete',
                              icon: HiOutlineTrash,
                              onClick: () => handleDelete(item),
                              className: 'delete',
                            },
                          ],permissions)}
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
        show={showDeleteModal}
        close={() => setShowDeleteModal(false)}
        disableClick={deleteMutation.isPending} // Disable action button during mutation
        action={() => {
          deleteMutation.mutate({
            serviceFunction: deleteUser,
            id: selectedItem.id,
          });
        }}
        title={'Delete?'}
        description={`Are you sure you want to delete user ${selectedItem?.user_name}?`}
      />
    </>
  );
};

export default withModal(withFilters(UserMaintenance));
