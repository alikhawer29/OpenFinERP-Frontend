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
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';
import {
  addOfficeLocationMaster,
  deleteOfficeLocationMaster,
  editOfficeLocationMaster,
  getOfficeLocationMasterListing,
} from '../../../Services/Masters/OfficeLocationMaster';
import { officeLocationMasterHeaders } from '../../../Utils/Constants/TableHeaders';
import { serialNum, showErrorToast } from '../../../Utils/Utils';
import { addOfficeLocationValidationSchema } from '../../../Utils/Validations/ValidationSchemas';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import { filterActions, filterHeaders } from '../../../Utils/Helpers';

const OfficeLocationMaster = ({
  showModal,
  closeModal,
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Office Location Register');
  const queryClient = useQueryClient();

  const [showAddOfficeLocationModal, setShowAddOfficeLocationModal] =
    useState(false);
  const [showEditOfficeLocationModal, setShowEditOfficeLocationModal] =
    useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const firstInputFocusRef = useAutoFocus();

  const { data, isLoading, isError, error } = useFetchTableData(
    'officeLocationMasterListing',
    filters,
    updatePagination,
    getOfficeLocationMasterListing
  );

  const officeLocationMasterData = data?.data || [];

  //  --- MUTATIONS ---
  // Delete Office Location Mutation
  const deleteOfficeLocationMutation = useMutation({
    mutationFn: deleteOfficeLocationMaster,
    onSuccess: () => {
      closeModal();
      showToast('Office Deleted Successfully', 'success');
      queryClient.invalidateQueries(['officeLocationMasterListing', filters]);
    },
    onError: (error) => {
      if (
        error.message.toLowerCase() ==
        'the office location cannot be deleted as it is currently in use.'
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
  // Add Office Location Mutation
  const addOfficeLocationMutation = useMutation({
    mutationFn: addOfficeLocationMaster,
    onSuccess: () => {
      setShowAddOfficeLocationModal(false);
      showToast('New Office Location Added', 'success');
      queryClient.invalidateQueries(['officeLocationMasterListing', filters]);
    },
    onError: (error) => {
      setShowAddOfficeLocationModal(false);
      showErrorToast(error);
    },
  });
  // Edit Office Location Mutation
  const editOfficeLocationMutation = useMutation({
    mutationFn: (values) => editOfficeLocationMaster(selectedItem.id, values),
    onSuccess: () => {
      setShowEditOfficeLocationModal(false);
      showToast('Office Location Updated Successfully', 'success');
      queryClient.invalidateQueries(['officeLocationMasterListing', filters]);
    },
    onError: (error) => {
      setShowEditOfficeLocationModal(false);
      showErrorToast(error);
    },
  });

  //  --- MUTATIONS END ---

  // Function to handle Delete action
  const handleDelete = (item) => {
    showModal(
      'Delete',
      `Are you sure you want to delete office ${item.office_location}?`,
      () => {
        deleteOfficeLocationMutation.mutate(item.id);
      }
    );
  };
  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowEditOfficeLocationModal(true);
  };

  const handleAddOfficeLocation = (values) => {
    addOfficeLocationMutation.mutate(values);
  };
  const handleEditOfficeLocation = (values) => {
    editOfficeLocationMutation.mutate(values);
  };

  if (isError) {
    showErrorToast(error);
  }
  const permissions = useModulePermissions(
    'master',
    'office_location_register'
  );
  const {
    create: hasCreatePermission,
    edit: hasEditPermission,
    delete: hasDeletePermission,
  } = permissions;
  const visibleHeaders = filterHeaders(officeLocationMasterHeaders, {
    Action: hasEditPermission || hasDeletePermission,
  });
  return (
    <>
      <section>
        <div className="d-flex justify-content-between flex-wrap mb-3">
          <h2 className="screen-title mb-0">Office Location Register</h2>
          {hasCreatePermission && (
            <CustomButton
              text={'New'}
              onClick={() => {
                setShowAddOfficeLocationModal(true);
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
              {(officeLocationMasterData?.length || isError) && (
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
                  {officeLocationMasterData?.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        {serialNum(
                          (filters?.page - 1) * filters?.per_page + index + 1
                        )}
                      </td>
                      <td>{item.office_location}</td>
                      <td style={{ width: '10%' }}>
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
      {/* Add Office Location Modal  */}
      <CustomModal
        show={showAddOfficeLocationModal}
        close={() => setShowAddOfficeLocationModal(false)}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle">New Office Location</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{ office_location: '' }}
            validationSchema={addOfficeLocationValidationSchema}
            onSubmit={handleAddOfficeLocation}
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form>
                <div className="mb-45">
                  <CustomInput
                    name={'office_location'}
                    type={'text'}
                    required
                    ref={firstInputFocusRef}
                    label={'Office Location'}
                    placeholder={'Enter Office Location'}
                    value={values.office_location}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.office_location && errors.office_location}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {!addOfficeLocationMutation.isPending ? (
                    <>
                      <CustomButton type="submit" text={'Save'} />
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() => setShowAddOfficeLocationModal(false)}
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
      {/* Edit Office Location Modal  */}
      <CustomModal
        show={showEditOfficeLocationModal}
        close={() => setShowEditOfficeLocationModal(false)}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle">Edit Office Location</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{ office_location: selectedItem?.office_location }}
            validationSchema={addOfficeLocationValidationSchema}
            onSubmit={handleEditOfficeLocation}
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form>
                <div className="mb-45">
                  <CustomInput
                    name={'office_location'}
                    type={'text'}
                    required
                    ref={firstInputFocusRef}
                    label={'Office Location'}
                    placeholder={'Enter Office Location'}
                    value={values.office_location}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.office_location && errors.office_location}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {!editOfficeLocationMutation.isPending ? (
                    <>
                      <CustomButton type="submit" text={'Save'} />
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() => setShowEditOfficeLocationModal(false)}
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

export default withModal(withFilters(OfficeLocationMaster));
