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
import useDataMutations from '../../../Hooks/useDataMutations';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';
import {
  addCBClassificationMaster,
  deleteCBClassificationMaster,
  editCBClassificationMaster,
  getCBClassificationMasterListing,
} from '../../../Services/Masters/CBClassificationMaster';
import { cbClassificationMasterHeaders } from '../../../Utils/Constants/TableHeaders';
import { serialNum, showErrorToast } from '../../../Utils/Utils';
import { addCBClassificationSchema } from '../../../Utils/Validations/ValidationSchemas';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import { filterActions, filterHeaders } from '../../../Utils/Helpers';

const CBClassificationMaster = ({
  showModal,
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('CB Classification Register');
  const queryClient = useQueryClient();

  const [showAddCBClassificationModal, setShowAddCBClassificationModal] =
    useState(false);
  const [showUpdateCBClassificationModal, setShowUpdateCBClassificationModal] =
    useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const firstInputFocusRef = useAutoFocus();

  const {
    data: { data: cbClassificationMasterData = [] } = {},
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'cbClassificationMasterListing',
    filters,
    updatePagination,
    getCBClassificationMasterListing
  );

  const { deleteMutation, editMutation } = useDataMutations({
    onDeleteSuccessCallback: () => {
      setShowDeleteModal(false);
      showToast('CB Classification Deleted Successfully', 'success');
      queryClient.invalidateQueries(['cbClassificationMasterListing', filters]);
    },
    onDeleteErrorCallback: (error) => {
      if (
        error.message.toLowerCase() ==
        'the cb classification cannot be deleted as it is currently in use.'
      ) {
        setShowDeleteModal(false);
        showModal(
          'Cannot be Deleted',
          `The CB classification ${selectedItem.title} cannot be deleted as it is currently in use.`,
          () => closeModal(),
          'error'
        );
      } else {
        showErrorToast(error);
      }
    },
    onEditSuccessCallback: () => {
      setShowUpdateCBClassificationModal(false);
      showToast('CB Classification Updated Successfully', 'success');
      queryClient.invalidateQueries(['cbClassificationMasterListing', filters]);
    },
    onEditErrorCallback: (error) => {
      setShowUpdateCBClassificationModal(false);
      showErrorToast(error);
    },
  });

  //  --- MUTATIONS ---

  // Add Classification Mutation
  const addCBClassificationMutation = useMutation({
    mutationFn: addCBClassificationMaster,
    onSuccess: () => {
      setShowAddCBClassificationModal(false);
      showToast('New CB Classification Added', 'success');
      queryClient.invalidateQueries(['cbClassificationMasterListing', filters]);
    },
    onError: (error) => {
      setShowAddCBClassificationModal(false);
      showErrorToast(error);
    },
  });

  //  --- MUTATIONS END ---

  // Function to handle add Classification Register
  const handleAddClassification = (values) => {
    addCBClassificationMutation.mutate(values);
  };

  // Function to handle edit action
  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowUpdateCBClassificationModal(true);
  };

  // Function to Update Classification
  const updateCBClassification = (values) => {
    editMutation.mutate({
      serviceFunction: editCBClassificationMaster,
      id: selectedItem.id,
      formData: values,
    });
  };

  // Function to handle Delete action
  const handleDelete = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  if (isError) {
    showErrorToast(error);
  }

  // Permission checks using optimized hook
  const permissions = useModulePermissions('master', 'cb_classification');

  const {
    create: hasCreatePermission,
    edit: hasEditPermission,
    delete: hasDeletePermission,
  } = permissions;

  // Show Action column only if user has edit or delete permission
  const visibleHeaders = filterHeaders(cbClassificationMasterHeaders, {
    Action: hasEditPermission || hasDeletePermission,
  });

  return (
    <>
      <section>
        <div className="d-flex justify-content-between flex-wrap mb-3">
          <h2 className="screen-title mb-0">CB Classification Register</h2>
          {hasCreatePermission && (
            <CustomButton
              text={'New'}
              onClick={() => {
                setShowAddCBClassificationModal(true);
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
              {(cbClassificationMasterData.length || isError) && (
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
                  {cbClassificationMasterData?.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        {serialNum(
                          (filters?.page - 1) * filters?.per_page + index + 1
                        )}
                      </td>
                      <td>{item.group}</td>
                      <td>{item.title}</td>
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
      {/* Add CB Classification Modal  */}
      <CustomModal
        show={showAddCBClassificationModal}
        close={() => setShowAddCBClassificationModal(false)}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle">New Classification</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{
              group: '',
              title: '',
            }}
            validationSchema={addCBClassificationSchema}
            onSubmit={handleAddClassification}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              setFieldValue,
            }) => (
              <Form>
                <div className="mb-3">
                  <CustomInput
                    label="Group"
                    required
                    ref={firstInputFocusRef}
                    name="group"
                    id="group"
                    type="text"
                    rows={1}
                    placeholder="Enter Group"
                    value={values.group}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.group && errors.group}
                  />
                </div>
                <div className="mb-45">
                  <CustomInput
                    label="Title"
                    required
                    name="title"
                    id="title"
                    type="text"
                    rows={1}
                    placeholder="Enter Title"
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.title && errors.title}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {!addCBClassificationMutation.isPending ? (
                    <>
                      <CustomButton type="submit" text={'Save'} />
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() => setShowAddCBClassificationModal(false)}
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
      {/* Update CB Classification Modal  */}
      <CustomModal
        show={showUpdateCBClassificationModal}
        close={() => setShowUpdateCBClassificationModal(false)}
      >
        <div className="text-center text-center mb-3">
          <h4 className="modalTitle">Edit CB Classification</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{ ...selectedItem }}
            validationSchema={addCBClassificationSchema}
            onSubmit={updateCBClassification}
            key={selectedItem?.id || 'new'}
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form>
                <div className="mb-3">
                  <CustomInput
                    label="Group"
                    required
                    ref={firstInputFocusRef}
                    name="group"
                    id="group"
                    type="text"
                    rows={1}
                    placeholder="Enter Group"
                    value={values.group}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.group && errors.group}
                  />
                </div>
                <div className="mb-45">
                  <CustomInput
                    label="Title"
                    required
                    name="title"
                    id="title"
                    type="text"
                    rows={1}
                    placeholder="Enter Title"
                    value={values.title}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.title && errors.title}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {!editMutation.isPending ? (
                    <>
                      <CustomButton type="submit" text={'Update'} />
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() =>
                          setShowUpdateCBClassificationModal(false)
                        }
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
      {/* Delete CB Classification Modal */}
      <CustomModal
        show={showDeleteModal}
        close={() => setShowDeleteModal(false)}
        action={() => {
          deleteMutation.mutate({
            serviceFunction: deleteCBClassificationMaster,
            id: selectedItem.id,
          });
        }}
        title={'Delete?'}
        description={`Are you sure you want to delete ${selectedItem?.title} CB Classification?`}
        disableClick={deleteMutation.isPending}
      />
    </>
  );
};

export default withModal(withFilters(CBClassificationMaster));
