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
import CustomSelect from '../../../Components/CustomSelect';
import { showToast } from '../../../Components/Toast/Toast';
import withModal from '../../../HOC/withModal';
import useDataMutations from '../../../Hooks/useDataMutations';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import {
  deleteClassificationMaster,
  editClassificationMaster,
  getClassificationMasterTypes,
  viewClassificationMaster,
} from '../../../Services/Masters/ClassificationMaster';
import {
  formatDate,
  isNullOrEmpty,
  showErrorToast,
} from '../../../Utils/Utils';
import { addClassificationSchema } from '../../../Utils/Validations/ValidationSchemas';
import useModulePermissions from '../../../Hooks/useModulePermissions';

const ClassificationMasterDetail = ({ showModal }) => {
  usePageTitle('Classification Register - Details');

  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showUpdateClassificationModal, setShowUpdateClassificationModal] =
    useState(false);

  const { deleteMutation, editMutation } = useDataMutations({
    onDeleteSuccessCallback: () => {
      closeModal();
      showToast('Classification Deleted Successfully', 'success');
      queryClient.invalidateQueries(['classificationMasterListing']);
      setTimeout(() => {
        navigate(-1);
      }, 300);
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
      queryClient.invalidateQueries(['classificationMaster', id]);
    },
    onEditErrorCallback: (error) => {
      setShowUpdateClassificationModal(false);
      showErrorToast(error);
    },
  });

  // Queries and Mutations
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['classificationMaster', id],
    queryFn: () => viewClassificationMaster(id),
  });
  // Get Classification Types
  const {
    data: classificationTypes,
    isLoading: typesLoading,
    isError: typesError,
  } = useQuery({
    queryKey: ['classificationTypes'],
    queryFn: getClassificationMasterTypes,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const detailData = data || {};

  // Function to handle edit action
  const handleEdit = () => {
    setShowUpdateClassificationModal(true);
  };
  // Function to Update Classification
  const updateClassification = (values) => {
    editMutation.mutate({
      serviceFunction: editClassificationMaster,
      id: id,
      formData: values,
    });
  };

  // Function to handle Delete action
  const handleDelete = (item) => {
    showModal(
      'Delete',
      `Are you sure you want to delete classification ${item.classification_type.type}?`,
      () => {
        deleteMutation.mutate({
          serviceFunction: deleteClassificationMaster,
          id: item.id,
        });
      }
    );
  };

  // Function to fetch Classification Types and show loading/error if api fails
  const getTypeOptions = () => {
    if (!typesLoading && !typesError) {
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
  const permissions = useModulePermissions('master', 'classification_register');
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
          <h2 className="screen-title m-0 d-inline">Classification Register</h2>
        </div>
        {hasEditPermission && (
          <div className="d-flex gap-2 flex-wrap">
            <CustomButton text={'Edit'} onClick={handleEdit} />
          </div>
        )}
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
                  Classification
                </p>
                <p className="detail-text wrapText mb-0">
                  {detailData?.classification_type?.type}
                </p>
              </div>
              <div className="col-12 col-sm-7 col-md-9 col-xl-10 mb-3 mb-sm-0">
                <p className="detail-title detail-label-color mb-1">
                  Description
                </p>
                <p className="detail-text wrapText mb-0">
                  {detailData?.description}
                </p>
              </div>
            </div>
            <div className="row mb-4">
              <div className="col-12 d-flex">
                {hasDeletePermission && (
                  <CustomButton
                    text={'Delete'}
                    variant={'danger'}
                    onClick={() => handleDelete(detailData)}
                  />
                )}
              </div>
            </div>
          </>
        )}
        {detailData?.created_at && (
          <p className="detail-title detail-label-color mb-1">
            Created on{' '}
            {formatDate(detailData?.created_at, 'DD/MM/YYYY - HH:MM:SS')} by{' '}
            {detailData?.creator?.user_name}
          </p>
        )}
        {!isNullOrEmpty(detailData?.editor) && (
          <p className="detail-title detail-label-color mb-0">
            Last Edited on{' '}
            {formatDate(detailData?.updated_at, 'DD/MM/YYYY - HH:MM:SS')} by{' '}
            {detailData?.editor?.user_name}
          </p>
        )}
      </div>
      {/* Update Classification Modal  */}
      <CustomModal
        show={showUpdateClassificationModal}
        close={() => setShowUpdateClassificationModal(false)}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle">Edit Classification</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={detailData}
            validationSchema={addClassificationSchema}
            onSubmit={updateClassification}
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
                    value={values.classification}
                    options={getTypeOptions()}
                    onChange={(v) =>
                      setFieldValue('classification', v.target.value)
                    }
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
                  {!updateClassification.isPending ? (
                    <>
                      <CustomButton type="submit" text={'Update'} />
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() => setShowUpdateClassificationModal(false)}
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

export default withModal(ClassificationMasterDetail);
