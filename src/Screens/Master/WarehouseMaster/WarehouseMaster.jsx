import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import { PulseLoader } from 'react-spinners';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { showToast } from '../../../Components/Toast/Toast';
import withFilters from '../../../HOC/withFilters ';
import withModal from '../../../HOC/withModal';
import useAutoFocus from '../../../Hooks/useAutoFocus';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';
import {
  addWarehouse,
  deleteWarehouse,
  editWarehouse,
  getWarehouseListing,
} from '../../../Services/Masters/Warehouse';
import { warehouseHeaders } from '../../../Utils/Constants/TableHeaders';
import { filterActions, filterHeaders } from '../../../Utils/Helpers';
import { formatDate, showErrorToast } from '../../../Utils/Utils';
import { newWareHouseSchema } from '../../../Utils/Validations/ValidationSchemas';

const WarehouseMaster = ({
  showModal,
  closeModal,
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Warehouse Register');

  const { data, isLoading, isError, error } = useFetchTableData(
    'warehouseListing',
    filters,
    updatePagination,
    getWarehouseListing
  );
  const queryClient = useQueryClient();

  const [showAddWareHouseModal, setShowAddWareHouseModal] = useState(false);
  const [showUpdateWareHouseModal, setShowUpdateWareHouseModal] =
    useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const firstInputFocusRef = useAutoFocus();

  const warehouseData = data?.data || [];

  //  --- MUTATIONS ---
  // Add Warehouse Mutation
  const addWarehouseMutation = useMutation({
    mutationFn: addWarehouse,
    onSuccess: () => {
      setShowAddWareHouseModal(false);
      showToast('New Warehouse Added', 'success');
      queryClient.invalidateQueries(['warehouseListing', filters]);
    },
    onError: (error) => {
      setShowAddWareHouseModal(false);
      showErrorToast(error);
    },
  });
  // Edit Warehouse Mutation
  const updateWarehouseMutation = useMutation({
    mutationFn: (values) => editWarehouse(selectedItem.id, values),
    onSuccess: () => {
      setShowUpdateWareHouseModal(false);
      showToast('Warehouse Updated Successfully', 'success');
      queryClient.invalidateQueries(['warehouseListing', filters]);
    },
    onError: (error) => {
      setShowUpdateWareHouseModal(false);
      showErrorToast(error);
    },
  });
  // Delete Warehouse Mutation
  const deleteWarehouseMutation = useMutation({
    mutationFn: deleteWarehouse,
    onSuccess: () => {
      closeModal();
      showToast('Warehouse Deleted Successfully', 'success');
      queryClient.invalidateQueries(['warehouseListing', filters]);
    },
    onError: (error) => {
      if (
        error.message.toLowerCase() ==
        'the warehouse cannot be deleted as it is currently in use.'
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

  // Function to handle add warehouse
  const handleAddWarehouse = (values, { resetForm }) => {
    addWarehouseMutation.mutate(values);
  };

  // Function to handle edit action
  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowUpdateWareHouseModal(true);
  };

  // Function to Update Warehouse action
  const updateWarehouse = (values) => {
    updateWarehouseMutation.mutate(values);
    setShowUpdateWareHouseModal(true);
  };

  // Function to handle Delete action
  const handleDelete = (item) => {
    showModal('Delete', 'Are you sure you want to delete?', () => {
      deleteWarehouseMutation.mutate(item.id);
    });
  };

  if (isError) {
    showErrorToast(error);
  }

  // Permission checks using optimized hook
  const permissions = useModulePermissions('master', 'warehouse_register');

  const {
    create: hasCreatePermission,
    edit: hasEditPermission,
    delete: hasDeletePermission,
  } = permissions;

  // Show Action column only if user has edit or delete permission
  const visibleHeaders = filterHeaders(warehouseHeaders, {
    Action: hasEditPermission || hasDeletePermission,
  });

  return (
    <>
      <section className="warehouse">
        <div className="d-flex justify-content-between flex-wrap mb-3">
          <h2 className="screen-title mb-0">Warehouse Register</h2>
          {hasCreatePermission && (
            <CustomButton
              text={'New'}
              onClick={() => {
                setShowAddWareHouseModal(true);
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
              {(warehouseData?.length || isError) && (
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
                  {warehouseData?.map((item) => (
                    <tr key={item.id}>
                      <td>{item.code}</td>
                      <td>{item.name}</td>
                      <td>{formatDate(item.created_at)}</td>
                      <td>
                        <TableActionDropDown
                          actions={filterActions(
                            [
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
      {/* Add ware house Modal  */}
      <CustomModal
        show={showAddWareHouseModal}
        close={() => setShowAddWareHouseModal(false)}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle">New Warehouse</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{ name: '' }}
            validationSchema={newWareHouseSchema}
            onSubmit={handleAddWarehouse}
          >
            {({ errors, touched, handleChange, values, handleBlur }) => (
              <Form>
                <div className="mb-45">
                  <CustomInput
                    label="Name"
                    name="name"
                    required
                    ref={firstInputFocusRef}
                    id="name"
                    type="text"
                    placeholder="Enter New Warehouse Name"
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.name && errors.name}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {!addWarehouseMutation.isPending ? (
                    <>
                      <CustomButton type="submit" text={'Save'} />
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() => setShowAddWareHouseModal(false)}
                      />
                    </>
                  ) : (
                    <PulseLoader size={11} className="modalLoader" />
                  )}
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </CustomModal>
      {/* Update ware house Modal  */}
      <CustomModal
        show={showUpdateWareHouseModal}
        close={() => setShowUpdateWareHouseModal(false)}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle">Edit Warehouse</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{ name: selectedItem?.name || '' }}
            validationSchema={newWareHouseSchema}
            onSubmit={updateWarehouse}
            key={selectedItem?.id || 'new'}
          >
            {({ errors, touched, handleChange, values, handleBlur }) => (
              <Form>
                <div className="mb-45">
                  <CustomInput
                    label="Name"
                    name="name"
                    required
                    ref={firstInputFocusRef}
                    id="name"
                    type="text"
                    placeholder="Enter New Warehouse Name"
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.name && errors.name}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {!addWarehouseMutation.isPending ? (
                    <>
                      <CustomButton type="submit" text={'Update'} />
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() => setShowUpdateWareHouseModal(false)}
                      />
                    </>
                  ) : (
                    <PulseLoader size={11} className="modalLoader" />
                  )}
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </CustomModal>
    </>
  );
};

export default withModal(withFilters(WarehouseMaster));
