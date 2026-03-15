import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import React, { useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useNavigate, useParams } from 'react-router-dom';
import { PulseLoader } from 'react-spinners';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast';
import withModal from '../../../HOC/withModal';
import useDataMutations from '../../../Hooks/useDataMutations';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import {
  deleteGroupMaster,
  editGroupMaster,
  viewGroupMaster,
} from '../../../Services/Masters/GroupMaster';
import {
  formatDate,
  isNullOrEmpty,
  showErrorToast,
} from '../../../Utils/Utils';
import { addGroupMasterValidationSchema } from '../../../Utils/Validations/ValidationSchemas';
import useModulePermissions from '../../../Hooks/useModulePermissions';

const GroupMasterDetails = ({ showModal, closeModal }) => {
  usePageTitle('Group Register - Details');

  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showEditGroupMasterModal, setShowEditGroupMasterModal] =
    useState(false);

  // Queries and Mutations
  const {
    data: groupMaster = {},
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['groupMaster', id],
    queryFn: () => viewGroupMaster(id),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  //  --- MUTATIONS ---
  const { deleteMutation, editMutation } = useDataMutations({
    onDeleteSuccessCallback: () => {
      closeModal();
      showToast('Group Deleted Successfully', 'success');
      [['groupMaster', id], 'groupMasterListing'].forEach((key) =>
        queryClient.invalidateQueries({ queryKey: [...key] })
      );
      setTimeout(() => {
        navigate(-1);
      }, 300);
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

      [['groupMaster', id], 'groupMasterListing'].forEach((key) =>
        queryClient.invalidateQueries({ queryKey: [...key] })
      );
    },
    onEditErrorCallback: (error) => {
      setShowEditGroupMasterModal(false);
      showErrorToast(error);
    },
  });

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
  const handleEdit = () => {
    setShowEditGroupMasterModal(true);
  };

  const handleEditGroupMaster = (values) => {
    editMutation.mutate({
      serviceFunction: editGroupMaster,
      id: groupMaster.id,
      formData: values,
    });
  };

  const permissions = useModulePermissions('master', 'group_register');
  const {
    create: hasCreatePermission,
    edit: hasEditPermission,
    delete: hasDeletePermission,
    view: hasViewPermission,
  } = permissions;

  return (
    <>
      <div className="d-flex align-items-start mb-4 justify-content-between flex-wrap">
        <div className="d-flex flex-column gap-2">
          <BackButton />
          <h2 className="screen-title m-0 d-inline">Group Register</h2>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {hasEditPermission && (
            <CustomButton text={'Edit'} onClick={handleEdit} />
          )}
        </div>
      </div>
      <div className="d-card py-4">
        {isLoading ? (
          <div className="row">
            <div className="col-12 col-sm-5 col-md-3 col-xl-2 mb-3 mb-sm-0">
              <p className="detail-title secondary-text mb-1">
                <Skeleton width={80} />
              </p>
              <Skeleton width={'100%'} height={20} />
            </div>
            <div className="col-12 col-sm-7 col-md-9 col-xl-10 mb-3 mb-sm-0">
              <p className="detail-title secondary-text mb-1">
                <Skeleton width={100} />
              </p>
              <Skeleton width={'100%'} height={20} />
            </div>
            <div className="row pt-4 mb-4">
              <div className="col-12 d-flex">
                <CustomButton text={'Delete'} variant={'danger'} />
              </div>
            </div>
          </div>
        ) : isError ? (
          <p className="text-danger">
            Error: {error?.message || 'Failed to fetch data.'}
          </p>
        ) : (
          <>
            <div className="row mb-45">
              <div className="col-12 col-sm-5 col-md-3 col-xl-2 mb-3 mb-sm-0">
                <p className="detail-title detail-label-color mb-1">
                  Group Type
                </p>
                <p className="detail-text wrapText mb-0">
                  {groupMaster?.group_type}
                </p>
              </div>
              <div className="col-12 col-sm-7 col-md-9 col-xl-10 mb-3 mb-sm-0">
                <p className="detail-title detail-label-color mb-1">
                  Description
                </p>
                <p className="detail-text wrapText mb-0">
                  {groupMaster?.description}
                </p>
              </div>
            </div>
            <div className="row mb-4">
              <div className="col-12 d-flex">
                {hasDeletePermission && (
                  <CustomButton
                    text={'Delete'}
                    variant={'danger'}
                    onClick={() => handleDelete(groupMaster)}
                  />
                )}
              </div>
            </div>
          </>
        )}
        {groupMaster?.created_at && (
          <p className="detail-title detail-label-color mb-1">
            Created on{' '}
            {formatDate(groupMaster?.created_at, 'DD/MM/YYYY - HH:MM:SS')} by{' '}
            {groupMaster?.creator?.user_name}
          </p>
        )}
        {!isNullOrEmpty(groupMaster?.editor) && (
          <p className="detail-title detail-label-color mb-0">
            Last Edited on{' '}
            {formatDate(groupMaster?.updated_at, 'DD/MM/YYYY - HH:MM:SS')} by{' '}
            {groupMaster?.editor?.user_name}
          </p>
        )}
      </div>
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
              group_type: groupMaster?.group_type,
              description: groupMaster?.description,
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
                    required
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

export default withModal(GroupMasterDetails);
