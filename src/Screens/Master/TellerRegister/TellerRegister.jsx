import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Col, Row } from 'react-bootstrap';
import { HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../../../Components/CustomButton';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { showToast } from '../../../Components/Toast/Toast';
import withFilters from '../../../HOC/withFilters ';
import withModal from '../../../HOC/withModal';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';
import {
  deleteTellerRegister,
  getTellerRegisterListing,
} from '../../../Services/Masters/TellerRegister';
import { tellerRegisterHeaders } from '../../../Utils/Constants/TableHeaders';
import { filterHeaders } from '../../../Utils/Helpers';
import { showErrorToast } from '../../../Utils/Utils';

const TellerRegister = ({
  showModal,
  closeModal,
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Teller Register');
  const navigate = useNavigate();

  // Permission checks using optimized hook
  const permissions = useModulePermissions('master', 'teller_register');

  const {
    create: hasCreatePermission,
    edit: hasEditPermission,
    delete: hasDeletePermission,
  } = permissions;

  // Show Action column only if user has edit or delete permission
  const visibleHeaders = filterHeaders(tellerRegisterHeaders, {
    Action: hasEditPermission || hasDeletePermission,
  });

  const { data, isLoading, isError, error } = useFetchTableData(
    'tellerRegisterListing',
    filters,
    updatePagination,
    getTellerRegisterListing
  );

  const queryClient = useQueryClient();

  const tellerRegisterData = data?.data || [];

  //  --- MUTATIONS ---
  // Delete Teller Mutation
  const deleteTellerMutation = useMutation({
    mutationFn: deleteTellerRegister,
    onSuccess: () => {
      closeModal();
      showToast('Teller Deleted Successfully', 'success');
      queryClient.invalidateQueries(['tellerRegisterListing', filters]);
    },
    onError: (error) => {
      if (
        error.message.toLowerCase() ==
        'the teller register cannot be deleted as it is currently in use.'
      ) {
        showModal(
          'Cannot be Deleted',
          error.message,
          () => closeModal(),
          'error'
        );
      }
      showErrorToast(error);
    },
  });
  //  --- MUTATIONS END ---

  // Function to handle Delete action
  const handleDelete = (item) => {
    showModal(
      'Delete',
      `Are you sure you want to delete teller ${item.code}?`,
      () => {
        deleteTellerMutation.mutate(item.id);
      }
    );
  };

  if (isError) {
    showErrorToast(error);
  }
  return (
    <>
      <section>
        <div className="d-flex justify-content-between flex-wrap mb-3">
          <h2 className="screen-title mb-0">Teller Register</h2>
          {hasCreatePermission && (
            <CustomButton
              text={'New'}
              onClick={() => {
                navigate('new');
              }}
            />
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
              {(tellerRegisterData?.length || isError) && (
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
                  {tellerRegisterData?.map((item) => (
                    <tr key={item.id}>
                      <td>{item.code}</td>
                      <td>{item?.employee?.user_name}</td>
                      <td>{item.cash_account}</td>

                      {(hasEditPermission || hasDeletePermission) && (
                        <td>
                          <TableActionDropDown
                            actions={[
                              ...(hasEditPermission
                                ? [
                                    {
                                      name: 'Edit',
                                      icon: HiOutlinePencilSquare,
                                      onClick: () =>
                                        navigate(`${item.id}/edit`),
                                      className: 'edit',
                                    },
                                  ]
                                : []),
                              ...(hasDeletePermission
                                ? [
                                    {
                                      name: 'Delete',
                                      icon: HiOutlineTrash,
                                      onClick: () => handleDelete(item),
                                      className: 'delete',
                                    },
                                  ]
                                : []),
                            ]}
                          />
                        </td>
                      )}
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

export default withModal(withFilters(TellerRegister));
