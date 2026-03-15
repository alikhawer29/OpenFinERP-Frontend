import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import CustomTable from '../../../Components/CustomTable/CustomTable';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { showToast } from '../../../Components/Toast/Toast';
import withFilters from '../../../HOC/withFilters ';
import withModal from '../../../HOC/withModal';
import useAutoFocus from '../../../Hooks/useAutoFocus';
import useDataMutations from '../../../Hooks/useDataMutations';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';
import {
  addGroupMaster,
  deleteGroupMaster,
  editGroupMaster,
  getGroupMasterListing,
} from '../../../Services/Masters/GroupMaster';
import { groupMasterHeaders } from '../../../Utils/Constants/TableHeaders';
import { showErrorToast } from '../../../Utils/Utils';
import { addGroupMasterValidationSchema } from '../../../Utils/Validations/ValidationSchemas';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import { filterActions, filterHeaders } from '../../../Utils/Helpers';

const GroupMaster = ({
  showModal,
  closeModal,
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Group Register');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [showAddGroupMasterModal, setShowAddGroupMasterModal] = useState(false);
  const [showEditGroupMasterModal, setShowEditGroupMasterModal] =
    useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const firstInputFocusRef = useAutoFocus();

  const { data, isLoading, isError, error } = useFetchTableData(
    'groupMasterListing',
    filters,
    updatePagination,
    getGroupMasterListing
  );

  const groupMasterData = data?.data || [];

  //  --- MUTATIONS ---
  const { deleteMutation, editMutation } = useDataMutations({
    onDeleteSuccessCallback: () => {
      closeModal();
      showToast('Group Deleted Successfully', 'success');
      queryClient.invalidateQueries(['groupMasterListing']);
    },
    onDeleteErrorCallback: (error) => {
      if (
        error.message.toLowerCase() ==
        'the group master cannot be deleted as it is currently in use.'
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
      setShowEditGroupMasterModal(false);
      showToast('Group Updated Successfully', 'success');
      queryClient.invalidateQueries(['groupMasterListing']);
    },
    onEditErrorCallback: (error) => {
      setShowEditGroupMasterModal(false);
      showErrorToast(error);
    },
  });

  // Add Office Location Mutation
  const addGroupMasterMutation = useMutation({
    mutationFn: addGroupMaster,
    onSuccess: () => {
      setShowAddGroupMasterModal(false);
      showToast('New Group Added Successfully', 'success');
      queryClient.invalidateQueries(['groupMasterListing', filters]);
    },
    onError: (error) => {
      setShowAddGroupMasterModal(false);
      showErrorToast(error);
    },
  });
  //  --- MUTATIONS END ---

  // Functions to handle table action
  const handleDelete = (item) => {
    showModal(
      'Delete',
      `Are you sure you want to delete group ${item.code}?`,
      () => {
        deleteMutation.mutate({
          serviceFunction: deleteGroupMaster,
          id: item.id,
        });
      }
    );
  };
  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowEditGroupMasterModal(true);
  };

  const handleAddGroupMaster = (values) => {
    addGroupMasterMutation.mutate(values);
  };
  const handleEditGroupMaster = (values) => {
    editMutation.mutate({
      serviceFunction: editGroupMaster,
      id: selectedItem.id,
      formData: values,
    });
  };

  if (isError) {
    showErrorToast(error);
  }
  const permissions = useModulePermissions('master', 'group_register');
  const {
    create: hasCreatePermission,
    edit: hasEditPermission,
    delete: hasDeletePermission,
    view: hasViewPermission,
  } = permissions;
  const visibleHeaders = filterHeaders(groupMasterHeaders, {
    Action: hasEditPermission || hasDeletePermission || hasViewPermission,
  });
  return (
    <>
      <section>
        <div className="d-flex justify-content-between flex-wrap mb-3">
          <h2 className="screen-title mb-0">Group Register</h2>
          {hasCreatePermission && (
            <CustomButton
              text={'New'}
              onClick={() => {
                setShowAddGroupMasterModal(true);
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
              {(groupMasterData?.length || isError) && (
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
                  {groupMasterData?.map((item) => (
                    <tr key={item.id}>
                      <td>{item.code}</td>
                      <td>{item.group_type}</td>
                      <td>{item.description}</td>
                      <td>
                        <TableActionDropDown
                          actions={filterActions(
                            [
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
      {/* Add Group Modal  */}
      <CustomModal
        show={showAddGroupMasterModal}
        close={() => setShowAddGroupMasterModal(false)}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle">New Group</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{ group_type: '', description: '' }}
            validationSchema={addGroupMasterValidationSchema}
            onSubmit={handleAddGroupMaster}
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
                <div className="mb-45">
                  <SearchableSelect
                    label={'Group Type'}
                    name="group_type"
                    ref={firstInputFocusRef}
                    required
                    options={[
                      {
                        label: 'Main-Group',
                        value: 'Main-Group',
                      },
                      {
                        label: 'Sub-Group',
                        value: 'Sub-Group',
                      },
                      {
                        label: 'Trd-Group',
                        value: 'Trd-Group',
                      },
                    ]}
                    value={values.group_type}
                    onChange={(v) => {
                      setFieldValue('group_type', v.value);
                    }}
                    placeholder={'Select Group Type'}
                  />
                  <ErrorMessage
                    name="group_type"
                    component="div"
                    className="input-error-message text-danger"
                  />
                </div>
                <div className="mb-45">
                  <CustomInput
                    name={'description'}
                    type={'textarea'}
                    required
                    label={'Description'}
                    placeholder={'Enter Description'}
                    value={values.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.description && errors.description}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {!addGroupMasterMutation.isPending ? (
                    <>
                      <CustomButton type="submit" text={'Save'} />
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() => setShowAddGroupMasterModal(false)}
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
      {/* Edit Group Modal  */}
      <CustomModal
        show={showEditGroupMasterModal}
        close={() => setShowEditGroupMasterModal(false)}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle">Edit Group</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{
              group_type: selectedItem?.group_type,
              description: selectedItem?.description,
            }}
            validationSchema={addGroupMasterValidationSchema}
            onSubmit={handleEditGroupMaster}
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
                <div className="mb-45">
                  <SearchableSelect
                    label={'Group Type'}
                    name="group_type"
                    ref={firstInputFocusRef}
                    required
                    options={[
                      {
                        label: 'Main-Group',
                        value: 'Main-Group',
                      },
                      {
                        label: 'Sub-Group',
                        value: 'Sub-Group',
                      },
                      {
                        label: 'Trd-Group',
                        value: 'Trd-Group',
                      },
                    ]}
                    value={values.group_type}
                    onChange={(v) => {
                      setFieldValue('group_type', v.value);
                    }}
                    placeholder={'Select Group Type'}
                  />
                  <ErrorMessage
                    name="group_type"
                    component="div"
                    className="input-error-message text-danger"
                  />
                </div>
                <div className="mb-45">
                  <CustomInput
                    name={'description'}
                    type={'textarea'}
                    required
                    label={'Description'}
                    placeholder={'Enter Description'}
                    value={values.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.description && errors.description}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {!editMutation.isPending ? (
                    <>
                      <CustomButton type="submit" text={'Save'} />
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() => setShowEditGroupMasterModal(false)}
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

export default withModal(withFilters(GroupMaster));
