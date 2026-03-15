import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import { PulseLoader } from 'react-spinners';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { showToast } from '../../../Components/Toast/Toast';
import withFilters from '../../../HOC/withFilters ';
import withModal from '../../../HOC/withModal';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';
import {
  addSupportType,
  deleteSupportType,
  editSupportType,
  getSupportManagementListing,
} from '../../../Services/Admin/Support';
import { supportManagementHeaders } from '../../../Utils/Constants/TableHeaders';
import { formatDate, serialNum, showErrorToast } from '../../../Utils/Utils';
import { addSupportTypeSchema } from '../../../Utils/Validations/ValidationSchemas';

const SupportTypeManagement = ({
  showModal,
  closeModal,
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Support Type Management');
  const navigate = useNavigate();
  const [showAddSupportModal, setShowAddSupportModal] = useState(false);
  const [showEditSupportModal, setShowEditSupportModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  let queryClient = useQueryClient();

  //GET SUPPORT TYPES
  const {
    data: supportTypes,
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'getSupportManagementListing',
    filters,
    updatePagination,
    getSupportManagementListing
  );

  const supportTypeManagement = supportTypes?.data ?? [];

  const handleDelete = (item) => {
    showModal(
      'Delete',
      `Are you sure you want to delete Support Type ${item.name}?`,
      () => {
        deleteSupportTypeMutation.mutate(item.id);
      }
    );
  };

  // Mutation for deleting support type
  const deleteSupportTypeMutation = useMutation({
    mutationFn: (id) => deleteSupportType(id),
    onSuccess: () => {
      showToast('Support Type deleted successfully!', 'success');
      queryClient.invalidateQueries(['getSupportManagementListing', filters]);
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  const handleAddSupportType = (values) => {
    addSupportTypeMutation.mutate(values);
  };

  // Mutation for adding support type
  const addSupportTypeMutation = useMutation({
    mutationFn: (formData) => addSupportType(formData),
    onSuccess: () => {
      showToast('Support Type Added Successfully!', 'success');
      setShowAddSupportModal(false);
      queryClient.invalidateQueries(['getSupportManagementListing', filters]);
    },
    onError: (error) => {
      console.error('Error adding Support Type:', error);
      showErrorToast(error);
    },
  });

  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowEditSupportModal(true);
  };

  // Mutation for updating support type
  const editSupportTypeMutation = useMutation({
    mutationFn: (formData) => editSupportType(selectedItem.id, formData),
    onSuccess: () => {
      showToast('Support Type Updated!', 'success');
      setShowEditSupportModal(false);
      queryClient.invalidateQueries(['getSupportManagementListing', filters]);
    },
    onError: (error) => {
      console.error('Error updating Support Type:', error);
      showErrorToast(error);
    },
  });

  const handleEditSupportType = (values) => {
    editSupportTypeMutation.mutate(values);
  };

  if (isError) {
    showErrorToast(error);
  }

  return (
    <>
      <section>
        <div className="d-flex justify-content-between flex-wrap mb-3">
          <h2 className="screen-title mb-0">Support Type Managment</h2>
          <CustomButton
            text={'Support'}
            onClick={() => setShowAddSupportModal(true)}
          />
        </div>
        <Row>
          <Col xs={12}>
            <CustomTable
              filters={filters}
              setFilters={setFilters}
              headers={supportManagementHeaders}
              pagination={pagination}
              isLoading={isLoading}
              dateFilters={[
                {
                  title: 'Date',
                  from: 'from',
                  to: 'to',
                  label: 'Date',
                },
              ]}
            >
              {(supportTypeManagement?.length || isError) && (
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={supportManagementHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {supportTypeManagement?.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        {serialNum(
                          (filters?.page - 1) * filters?.per_page + index + 1
                        )}
                      </td>
                      <td>{item?.name}</td>
                      <td>{formatDate(item?.created_at)}</td>
                      <td>
                        <TableActionDropDown
                          actions={[
                            // {
                            //   name: 'View',
                            //   icon: HiOutlineEye,
                            //   onClick: () => navigate(item.id),
                            //   className: 'view',
                            // },
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
      {/* Add Salesman Modal  */}
      <CustomModal
        show={showAddSupportModal}
        close={() => setShowAddSupportModal(false)}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle">Add New Support Type</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{ name: '' }}
            validationSchema={addSupportTypeSchema}
            onSubmit={handleAddSupportType}
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form>
                <div className="mb-45">
                  <CustomInput
                    name={'name'}
                    type={'text'}
                    required
                    label={'Support Type Name'}
                    placeholder={'Enter Support Type Name'}
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.name && errors.name}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {!addSupportTypeMutation.isPending ? (
                    <>
                      <CustomButton
                        type="submit"
                        text={'Save'}
                        onClick={() => setShowAddSupportModal(false)}
                      />
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() => setShowAddSupportModal(false)}
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
        show={showEditSupportModal}
        close={() => setShowEditSupportModal(false)}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle">Edit Support Type</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{ name: selectedItem?.name }}
            validationSchema={addSupportTypeSchema}
            onSubmit={handleEditSupportType}
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form>
                <div className="mb-45">
                  <CustomInput
                    name={'name'}
                    type={'text'}
                    required
                    label={'Support Type Name'}
                    placeholder={'Enter Support Type Name'}
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.name && errors.name}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {!editSupportTypeMutation.isPending ? (
                    <>
                      <CustomButton
                        type="submit"
                        text={'Save'}
                        onClick={() => setShowAddSupportModal(false)}
                      />
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() => setShowEditSupportModal(false)}
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

export default withModal(withFilters(SupportTypeManagement));
