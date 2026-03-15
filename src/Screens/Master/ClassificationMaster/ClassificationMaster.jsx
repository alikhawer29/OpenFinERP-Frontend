import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import React, { useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import {
  HiOutlineEye,
  HiOutlinePencilSquare,
  HiOutlineTrash,
} from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import { PulseLoader } from 'react-spinners';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import CustomSelect from '../../../Components/CustomSelect';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { showToast } from '../../../Components/Toast/Toast';
import withFilters from '../../../HOC/withFilters ';
import withModal from '../../../HOC/withModal';
import useDataMutations from '../../../Hooks/useDataMutations';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';
import {
  addClassificationMaster,
  addClassificationMasterType,
  deleteClassificationMaster,
  editClassificationMaster,
  getClassificationMasterListing,
  getClassificationMasterTypes,
} from '../../../Services/Masters/ClassificationMaster';
import { classificationMasterHeaders } from '../../../Utils/Constants/TableHeaders';
import { serialNum, showErrorToast } from '../../../Utils/Utils';
import {
  addClassificationSchema,
  addClassificationTypeSchema,
} from '../../../Utils/Validations/ValidationSchemas';
import useAutoFocus from '../../../Hooks/useAutoFocus';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import { filterActions, filterHeaders } from '../../../Utils/Helpers';

const ClassificationMaster = ({
  showModal,
  closeModal,
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Classification Register');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [
    showAddNewClassificationTypeModal,
    setShowAddNewClassificationTypeModal,
  ] = useState(false);
  const [showAddClassificationModal, setShowAddClassificationModal] =
    useState(false);
  const [showUpdateClassificationModal, setShowUpdateClassificationModal] =
    useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [lastOpenedModal, setLastOpenedModal] = useState('new');
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState('');
  const firstInputFocusRef = useAutoFocus();

  const { data, isLoading, isError, error } = useFetchTableData(
    'classificationMasterListing',
    filters,
    updatePagination,
    getClassificationMasterListing,
    { retry: 0 }
  );

  const { deleteMutation, editMutation } = useDataMutations({
    onDeleteSuccessCallback: () => {
      closeModal();
      showToast('Classification Deleted Successfully', 'success');
      queryClient.invalidateQueries(['classificationMasterListing', filters]);
    },
    onDeleteErrorCallback: (error) => {
      if (
        error.message.toLowerCase() ==
        'the classification cannot be deleted as it is currently in use.'
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
    onEditSuccessCallback: () => {
      setShowUpdateClassificationModal(false);
      showToast('Classification Updated Successfully', 'success');
      queryClient.invalidateQueries(['classificationMasterListing', filters]);
    },
    onEditErrorCallback: (error) => {
      setShowUpdateClassificationModal(false);
      showErrorToast(error);
    },
  });

  const classificationMasterData = data?.data || [];

  //  --- MUTATIONS ---
  // Get Classification Types
  const {
    data: classificationTypes,
    isLoading: typesLoading,
    isPending: typesPending,
    isError: typesError,
  } = useQuery({
    queryKey: ['classificationTypes'],
    queryFn: getClassificationMasterTypes,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Add Classification Mutation
  const addClassificationMutation = useMutation({
    mutationFn: addClassificationMaster,
    onSuccess: () => {
      setShowAddClassificationModal(false);
      showToast('New Classification Added', 'success');
      // queryClient.invalidateQueries(['classificationMasterListing', filters]);
      queryClient.invalidateQueries({
        queryKey: ['classificationMasterListing', filters],
        exact: false,
      });
    },
    onError: (error) => {
      setShowAddClassificationModal(false);
      showErrorToast(error);
    },
  });
  // Add Classification Type Mutation
  const addClassificationTypeMutation = useMutation({
    mutationFn: addClassificationMasterType,
    onSuccess: () => {
      setShowAddNewClassificationTypeModal(false);
      if (lastOpenedModal === 'new') setShowAddClassificationModal(true);
      else setShowUpdateClassificationModal(true);
      showToast('New Classification Type Added', 'success');
      queryClient.invalidateQueries(['classificationTypes']);
    },
    onError: (error) => {
      setShowAddNewClassificationTypeModal(false);
      if (lastOpenedModal === 'new') setShowAddClassificationModal(true);
      else setShowUpdateClassificationModal(true);
      showErrorToast(error);
    },
  });
  //  --- MUTATIONS END ---

  // Function to handle add Classification Register
  const handleAddClassification = (values) => {
    addClassificationMutation.mutate(values);
  };
  // Function to handle add Classification Type
  const handleAddClassificationType = (values) => {
    addClassificationTypeMutation.mutate(values);
  };

  // Function to handle edit action
  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowUpdateClassificationModal(true);
  };

  // Function to Update Classification
  const updateClassification = (values) => {
    editMutation.mutate({
      serviceFunction: editClassificationMaster,
      id: selectedItem.id,
      formData: values,
    });
  };

  // Function to handle Delete action
  const handleDelete = (item) => {
    showModal(
      'Delete',
      'Are you sure you want to delete ABC Classification?',
      () => {
        deleteMutation.mutate({
          serviceFunction: deleteClassificationMaster,
          id: item.id,
        });
      }
    );
  };
  // Handle sorting function
  const handleSort = (key) => {
    setFilters((prev) => ({
      ...prev,
      'sort[column]': key,
      'sort[order]': prev['sort[order]'] === 'asc' ? 'desc' : 'asc',
    }));
    setSortOrder((prevDirection) => (prevDirection === 'asc' ? 'desc' : 'asc'));
  };

  // Function to fetch Classification Types and show loading/error if api fails
  const getTypeOptions = () => {
    if (!typesPending && !typesError) {
      return classificationTypes.map((x) => ({
        value: x.id,
        label: x.type,
      }));
    } else {
      if (typesError) {
        console.error('unable to fetch clasification types');
        return [{ label: 'Unable to fetch types', value: null }];
      } else {
        return [{ label: 'Loading...', value: null, isDisabled: true }];
      }
    }
  };

  if (isError) {
    showErrorToast(error);
  }

  const permissions = useModulePermissions('master', 'classification_register');
  const {
    create: hasCreatePermission,
    edit: hasEditPermission,
    delete: hasDeletePermission,
    view: hasViewPermission,
  } = permissions;

  // Show Action column only if user has edit or delete permission
  const visibleHeaders = filterHeaders(classificationMasterHeaders, {
    Action: hasEditPermission || hasDeletePermission || hasViewPermission,
  });

  return (
    <>
      <section>
        <div className="d-flex justify-content-between flex-wrap mb-3">
          <h2 className="screen-title mb-0">Classification Register</h2>

          {hasCreatePermission && (
            <CustomButton
              text={'New'}
              onClick={() => {
                setShowAddClassificationModal(true);
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
              sortKey={sortKey}
              sortOrder={sortOrder}
              handleSort={handleSort}
            >
              {(classificationMasterData.length || isError) && (
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
                  {classificationMasterData?.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        {serialNum(
                          (filters?.page - 1) * filters?.per_page + index + 1
                        )}
                      </td>
                      <td>{item.classification_type?.type}</td>
                      <td>{item.description}</td>
                      {(hasDeletePermission ||
                        hasEditPermission ||
                        hasViewPermission) && (
                        <td>
                          <TableActionDropDown
                            actions={filterActions(
                              [
                                hasViewPermission && {
                                  name: 'View',
                                  icon: HiOutlineEye,
                                  onClick: () => navigate(`${item.id}`),
                                  className: 'view',
                                },
                                hasEditPermission && {
                                  name: 'Edit',
                                  icon: HiOutlinePencilSquare,
                                  onClick: () => handleEdit(item),
                                  className: 'edit',
                                },
                                hasDeletePermission && {
                                  name: 'Delete',
                                  icon: HiOutlineTrash,
                                  onClick: () => handleDelete(item),
                                  className: 'delete',
                                },
                              ].filter(Boolean), // removes false entries
                              permissions
                            )}
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
      {!typesLoading && (
        <>
          {/* Add Classification Modal  */}
          <CustomModal
            show={showAddClassificationModal}
            close={() => setShowAddClassificationModal(false)}
          >
            <div className="text-center mb-3">
              <h4 className="modalTitle">New Classification</h4>
            </div>
            <div className="px-sm-5">
              <Formik
                initialValues={{
                  classification: getTypeOptions()[0]?.value,
                  description: '',
                }}
                validationSchema={addClassificationSchema}
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
                      <CustomSelect
                        name="classification"
                        className={'mainInput'}
                        label={'Classification'}
                        required
                        fullWidth={true}
                        options={[
                          ...getTypeOptions(),
                          { label: 'Add New Classification', value: '' },
                        ]}
                        onChange={(v) => {
                          if (
                            v.target?.selectedOptions?.[0].innerText
                              ?.toLowerCase()
                              ?.startsWith('add new')
                          ) {
                            setLastOpenedModal('new');
                            setShowAddNewClassificationTypeModal(true);
                            setShowAddClassificationModal(false);
                          }
                          setFieldValue('classification', v.target.value);
                        }}
                      />
                      <ErrorMessage
                        name="classification"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
                    <div className="mb-45">
                      <CustomInput
                        label="Description"
                        name="description"
                        required
                        id="description"
                        type="textarea"
                        rows={1}
                        placeholder="Enter description"
                        value={values.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.description && errors.description}
                      />
                    </div>
                    <div className="d-flex gap-3 justify-content-center mb-3">
                      {!addClassificationMutation.isPending ? (
                        <>
                          <CustomButton type="submit" text={'Save'} />
                          <CustomButton
                            variant={'secondaryButton'}
                            text={'Cancel'}
                            type={'button'}
                            onClick={() => setShowAddClassificationModal(false)}
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
          {/* Update Classification Modal  */}
          <CustomModal
            show={showUpdateClassificationModal}
            close={() => setShowUpdateClassificationModal(false)}
          >
            <div className="text-center text-center mb-3">
              <h4 className="modalTitle">Edit Classification</h4>
            </div>
            <div className="px-sm-5">
              <Formik
                initialValues={{ ...selectedItem }}
                validationSchema={addClassificationSchema}
                onSubmit={updateClassification}
                key={selectedItem?.id || 'new'}
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
                      <CustomSelect
                        name="classification"
                        className={'mainInput'}
                        label={'Classification'}
                        required
                        ref={firstInputFocusRef}
                        fullWidth={true}
                        value={values.classification}
                        options={[
                          ...getTypeOptions(),
                          { label: 'Add New Classification', value: '' },
                        ]}
                        onChange={(v) => {
                          if (
                            v.target?.selectedOptions?.[0].innerText
                              ?.toLowerCase()
                              ?.startsWith('add new')
                          ) {
                            setLastOpenedModal('edit');
                            setShowAddNewClassificationTypeModal(true);
                            setShowUpdateClassificationModal(false);
                          }
                          setFieldValue('classification', v.target.value);
                        }}
                      />
                      <ErrorMessage
                        name="classification"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
                    <div className="mb-45">
                      <CustomInput
                        label="Description"
                        name="description"
                        required
                        id="description"
                        type="textarea"
                        rows={1}
                        placeholder="Enter description"
                        value={values.description}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.description && errors.description}
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
                              setShowUpdateClassificationModal(false)
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
          <CustomModal
            show={showAddNewClassificationTypeModal}
            close={() => {
              setShowAddNewClassificationTypeModal(false);
              if (lastOpenedModal === 'new')
                setShowAddClassificationModal(true);
              else setShowUpdateClassificationModal(true);
            }}
          >
            <div className="text-center mb-3">
              <h4 className="modalTitle">New Classification Type</h4>
            </div>
            <div className="px-sm-5">
              <Formik
                initialValues={{ type: '' }}
                validationSchema={addClassificationTypeSchema}
                onSubmit={handleAddClassificationType}
              >
                {({ values, errors, touched, handleChange, handleBlur }) => (
                  <Form>
                    <div className="mb-45">
                      <CustomInput
                        label="Type"
                        name="type"
                        required
                        id="type"
                        type="text"
                        placeholder="Enter Type"
                        value={values.type}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.type && errors.type}
                      />
                    </div>
                    <div className="d-flex gap-3 justify-content-center mb-3">
                      {!addClassificationTypeMutation.isPending ? (
                        <>
                          <CustomButton type="submit" text={'Save'} />
                          <CustomButton
                            variant={'secondaryButton'}
                            text={'Cancel'}
                            type={'button'}
                            onClick={() => {
                              setShowAddNewClassificationTypeModal(false);
                              if (lastOpenedModal === 'new')
                                setShowAddClassificationModal(true);
                              else setShowUpdateClassificationModal(true);
                            }}
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
      )}
    </>
  );
};

export default withModal(withFilters(ClassificationMaster));
