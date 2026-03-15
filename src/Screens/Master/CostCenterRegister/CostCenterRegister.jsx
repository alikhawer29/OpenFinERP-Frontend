import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import { Link, useNavigate } from 'react-router-dom';
import CustomButton from '../../../Components/CustomButton';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { showToast } from '../../../Components/Toast/Toast';
import withFilters from '../../../HOC/withFilters ';
import withModal from '../../../HOC/withModal';
import useDataMutations from '../../../Hooks/useDataMutations';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';
import {
  deleteCostCenterRegister,
  getCostCenterRegisterListing,
} from '../../../Services/Masters/CostCenterRegister';
import { costCenterRegisterHeaders } from '../../../Utils/Constants/TableHeaders';
import { showErrorToast } from '../../../Utils/Utils';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import { filterActions, filterHeaders } from '../../../Utils/Helpers';

const CostCenterRegister = ({
  showModal,
  closeModal,
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Cost Center Register');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    data: { data: costCenterRegisterData = [] } = {},
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'costCenterRegister',
    filters,
    updatePagination,
    getCostCenterRegisterListing,
    { retry: 0 }
  );

  const { deleteMutation } = useDataMutations({
    onDeleteSuccessCallback: () => {
      closeModal();
      showToast('Cost Center Register Deleted Successfully', 'success');
      queryClient.invalidateQueries(['costCenterRegister', filters]);
    },
    onDeleteErrorCallback: (error) => {
      if (
        error.message.toLowerCase() ==
        'the cost center register cannot be deleted as it is currently in use.'
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

  // Function to handle Delete action
  const handleDelete = (item) => {
    showModal(
      'Delete',
      `Are you sure you want to delete Cost Center ${item?.code}?`,
      () => {
        deleteMutation.mutate({
          serviceFunction: deleteCostCenterRegister,
          id: item.id,
        });
      }
    );
  };

  if (isError) {
    showErrorToast(error);
  }
  const permissions = useModulePermissions('master', 'cost_center_register');
  const {
    create: hasCreatePermission,
    edit: hasEditPermission,
    delete: hasDeletePermission,
  } = permissions;
  const visibleHeaders = filterHeaders(costCenterRegisterHeaders, {
    Action: hasEditPermission || hasDeletePermission,
  });

  return (
    <>
      <section>
        <div className="d-flex justify-content-between flex-wrap mb-3">
          <h2 className="screen-title mb-0">Cost Center Register</h2>
          {hasCreatePermission && (
            <Link to="new">
              <CustomButton text={'New'} />
            </Link>
          )}
        </div>
        <Row>
          <Col xs={12}>
            <CustomTable
              filters={filters}
              setFilters={setFilters}
              headers={visibleHeaders}
              pagination={pagination}
              isLoading={isLoading}
            >
              {(costCenterRegisterData.length || isError) && (
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={visibleHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {costCenterRegisterData?.map((item) => (
                    <tr key={item.id}>
                      <td>{item.code}</td>
                      <td>{item.description}</td>
                      <td>{item.group}</td>
                      <td>{item.default === 1 ? 'Yes' : 'No'}</td>
                      {hasEditPermission ||
                        (hasDeletePermission && (
                          <td>
                            <TableActionDropDown
                              actions={filterActions(
                                [
                                  {
                                    name: 'Edit',
                                    icon: HiOutlinePencilSquare,
                                    onClick: () => navigate(`${item.id}/edit`),
                                    className: 'edit',
                                  },
                                  {
                                    name: 'Delete',
                                    icon: HiOutlineTrash,
                                    onClick: () => handleDelete(item),
                                    className: 'delete',
                                  },
                                ],
                                permissions
                              )}
                            />
                          </td>
                        ))}
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

export default withModal(withFilters(CostCenterRegister));
