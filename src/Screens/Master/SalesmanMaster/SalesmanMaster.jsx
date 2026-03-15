import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import React, { useState } from 'react';
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
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';
import {
  addSalesmanMaster,
  deleteSalesmanMaster,
  editSalesmanMaster,
  getSalesmanMasterListing,
} from '../../../Services/Masters/SalesmanMaster';
import { salesmanHeaders } from '../../../Utils/Constants/TableHeaders';
import { showErrorToast } from '../../../Utils/Utils';
import { addSalesmanValidationSchema } from '../../../Utils/Validations/ValidationSchemas';
import { filterActions, filterHeaders } from '../../../Utils/Helpers';
import useModulePermissions from '../../../Hooks/useModulePermissions';

const SalesmanMaster = ({
  showModal,
  closeModal,
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Salesman Register');
  const queryClient = useQueryClient();

  const [showAddSalesmanModal, setShowAddSalesmanModal] = useState(false);
  const [showEditSalesmanModal, setShowEditSalesmanModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const firstInputFocusRef = useAutoFocus();

  const {
    data: { data: salesmanMasterData = [] } = {},
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'salesmanMasterListing',
    filters,
    updatePagination,
    getSalesmanMasterListing
  );

  //  --- MUTATIONS ---
  // Delete Salesman Mutation
  const deleteSalesmanMutation = useMutation({
    mutationFn: deleteSalesmanMaster,
    onSuccess: () => {
      closeModal();
      showToast('Salesman Deleted Successfully', 'success');
      queryClient.invalidateQueries(['salesmanMasterListing', filters]);
    },
    onError: (error) => {
      if (
        error.message.toLowerCase() ==
        'the sales master cannot be deleted as it is currently in use.'
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
  // Add Salesman Mutation
  const addSalesmanMutation = useMutation({
    mutationFn: addSalesmanMaster,
    onSuccess: () => {
      setShowAddSalesmanModal(false);
      showToast('New Salesman Added', 'success');
      queryClient.invalidateQueries(['salesmanMasterListing', filters]);
    },
    onError: (error) => {
      setShowAddSalesmanModal(false);
      showErrorToast(error);
    },
  });
  // Edit Salesman Mutation
  const editSalesmanMutation = useMutation({
    mutationFn: (values) => editSalesmanMaster(selectedItem.id, values),
    onSuccess: () => {
      setShowEditSalesmanModal(false);
      showToast('Salesman Updated Successfully', 'success');
      queryClient.invalidateQueries(['salesmanMasterListing', filters]);
    },
    onError: (error) => {
      setShowEditSalesmanModal(false);
      showErrorToast(error);
    },
  });

  //  --- MUTATIONS END ---

  // Function to handle Delete action
  const handleDelete = (item) => {
    showModal(
      'Delete',
      `Are you sure you want to delete salesman ${item.name}?`,
      () => {
        deleteSalesmanMutation.mutate(item.id);
      }
    );
  };
  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowEditSalesmanModal(true);
  };

  const handleAddSalesman = (values) => {
    addSalesmanMutation.mutate(values);
  };
  const handleEditSalesman = (values) => {
    editSalesmanMutation.mutate(values);
  };

  if (isError) {
    showErrorToast(error);
  }

  const permissions = useModulePermissions('master', 'salesman_register');
  const {
    create: hasCreatePermission,
    edit: hasEditPermission,
    delete: hasDeletePermission,
  } = permissions;
  const visibleHeaders = filterHeaders(salesmanHeaders, {
    Action: hasEditPermission || hasDeletePermission,
  });
  return (
    <>
      <section>
        <div className="d-flex justify-content-between flex-wrap mb-3">
          <h2 className="screen-title mb-0">Salesman Register</h2>
          {hasCreatePermission && (
            <CustomButton
              text={'New'}
              onClick={() => {
                setShowAddSalesmanModal(true);
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
              {(salesmanMasterData?.length || isError) && (
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
                  {salesmanMasterData?.map((item, index) => (
                    <tr key={item.id}>
                      <td>{item.code}</td>
                      <td>{item.name}</td>
                      <td>{item.creator?.user_id}</td>
                      {/* <td>{formatDate(item.created_at)}</td> */}
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
      {/* Add Salesman Modal  */}
      <CustomModal
        show={showAddSalesmanModal}
        close={() => setShowAddSalesmanModal(false)}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle">New Salesman</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{ name: '' }}
            validationSchema={addSalesmanValidationSchema}
            onSubmit={handleAddSalesman}
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form>
                <div className="mb-45">
                  <CustomInput
                    name={'name'}
                    type={'text'}
                    required
                    ref={firstInputFocusRef}
                    label={'Name'}
                    placeholder={'Enter Name'}
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={30}
                    error={touched.name && errors.name}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {!addSalesmanMutation.isPending ? (
                    <>
                      <CustomButton type="submit" text={'Save'} />
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() => setShowAddSalesmanModal(false)}
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
      {/* Edit Salesman Modal  */}
      <CustomModal
        show={showEditSalesmanModal}
        close={() => setShowEditSalesmanModal(false)}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle">Edit Salesman</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{ name: selectedItem?.name }}
            validationSchema={addSalesmanValidationSchema}
            onSubmit={handleEditSalesman}
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form>
                <div className="mb-45">
                  <CustomInput
                    name={'name'}
                    type={'text'}
                    required
                    ref={firstInputFocusRef}
                    label={'Name'}
                    placeholder={'Enter Name'}
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={30}
                    error={touched.name && errors.name}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {!editSalesmanMutation.isPending ? (
                    <>
                      <CustomButton type="submit" text={'Save'} />
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() => setShowEditSalesmanModal(false)}
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

export default withModal(withFilters(SalesmanMaster));
