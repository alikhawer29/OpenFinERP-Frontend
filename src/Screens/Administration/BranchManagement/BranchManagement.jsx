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
import { serialNum, showErrorToast } from '../../../Utils/Utils';
import {
  deleteBranch,
  getBranchManagementListing,
} from '../../../Services/Administration/BranchManagement';
import { branchManagementHeaders } from '../../../Utils/Constants/TableHeaders';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import { filterActions } from '../../../Utils/Helpers';

const BranchManagement = ({
  showModal,
  closeModal,
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Branch Management');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedItem, setSelectedItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

    const permissions = useModulePermissions("administration", "branch_management")
  const {create,} = permissions;

  const { data, isLoading, isError, error } = useFetchTableData(
    'branchManagementListing',
    filters,
    updatePagination,
    getBranchManagementListing
  );

  const branchManagementData = data?.data || [];

  //  --- MUTATIONS ---
  const { deleteMutation } = useDataMutations({
    onDeleteSuccessCallback: () => {
      closeModal();
      setShowDeleteModal(false);
      showToast('Branch Deleted Successfully', 'success');
      queryClient.invalidateQueries(['branchManagementListing', filters]);
    },
    onDeleteErrorCallback: (error) => {
      if (
        error.message.toLowerCase() ==
        'the branch cannot be deleted as it is currently in use.'
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
          <h2 className="screen-title mb-0">Branch Management</h2>
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
              headers={branchManagementHeaders}
              pagination={pagination}
              isLoading={isLoading}
            >
              {(branchManagementData.length || isError) && (
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={branchManagementHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {branchManagementData?.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        {serialNum(
                          (filters?.page - 1) * filters?.per_page + index + 1
                        )}
                      </td>

                      <td>{item?.name}</td>
                      <td>{item?.address}</td>
                      <td>{item?.manager?.user_name}</td>
                      <td>{item?.supervisor?.user_name}</td>
                      <td>{item?.currency?.currency}</td>
                      <td>
                        <StatusChip status={item.status} />
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
        disableClick={deleteMutation.isPending}
        action={() => {
          deleteMutation.mutate({
            serviceFunction: deleteBranch,
            id: selectedItem.id,
          });
        }}
        title={'Delete?'}
        description={`Are you sure you want to delete branch ${selectedItem?.name}?`}
      />
    </>
  );
};

export default withModal(withFilters(BranchManagement));
