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
  deleteCommissionMaster,
  getCommissionMasterListing,
} from '../../../Services/Masters/CommissionMaster';
import { commisionMasterHeaders } from '../../../Utils/Constants/TableHeaders';
import { showErrorToast } from '../../../Utils/Utils';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import { filterActions, filterHeaders } from '../../../Utils/Helpers';

const CommissionMaster = ({
  showModal,
  closeModal,
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('CB Classification Register');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    data: { data: commissionMasterData = [] } = {},
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'commissionMaster',
    filters,
    updatePagination,
    getCommissionMasterListing,
    { retry: 0 }
  );

  const { deleteMutation } = useDataMutations({
    onDeleteSuccessCallback: () => {
      closeModal();
      showToast('Commission Register Deleted Successfully', 'success');
      queryClient.invalidateQueries(['commissionMaster', filters]);
    },
    onDeleteErrorCallback: (error) => {
      if (
        error.message.toLowerCase() ==
        'the commission cannot be deleted as it is currently in use.'
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
      'Are you sure you want to delete this Commission Register?',
      () => {
        deleteMutation.mutate({
          serviceFunction: deleteCommissionMaster,
          id: item.id,
        });
      }
    );
  };

  if (isError) {
    showErrorToast(error);
  }

  const permissions = useModulePermissions('master', 'commission_register');
  const {
    create: hasCreatePermission,
    edit: hasEditPermission,
    delete: hasDeletePermission,
  } = permissions;

  const visibleHeaders = filterHeaders(commisionMasterHeaders, {
    Action: hasEditPermission || hasDeletePermission,
  });

  return (
    <>
      <section>
        <div className="d-flex justify-content-between flex-wrap mb-3">
          <h2 className="screen-title mb-0">Commission Register</h2>
          {hasCreatePermission && (
            <CustomButton text={'New'} onClick={() => navigate('new')} />
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
              {(commissionMasterData.length || isError) && (
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
                  {commissionMasterData?.map((item, index) => (
                    <tr key={item.id}>
                      <td>{item?.account_type_name}</td>
                      <td>{item?.account_details?.title}</td>
                      <td>{item?.commission_type}</td>
                      <td>{item?.receipt_percentage}</td>
                      <td>{item?.payment_percentage}</td>
                      <td>{item?.tmn_buy_remittance_percentage}</td>
                      <td>{item?.tmn_sell_remittance_percentage}</td>
                      <td>{item?.currency_transfer_request_percentage}</td>
                      <td>{item?.outward_remittance_percentage}</td>
                      <td>{item?.currency_buy_sell_percentage}</td>
                      <td>{item?.inward_remittance_percentage}</td>
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

export default withModal(withFilters(CommissionMaster));
