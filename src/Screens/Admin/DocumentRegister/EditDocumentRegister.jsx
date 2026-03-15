import { useMutation, useQuery } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast';
import UploadAndDisplayFiles from '../../../Components/UploadAndDisplayFiles/UploadAndDisplayFiles';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import {
  editDocumentRegister,
  getGroups,
  getGroupTypes,
  viewDocumentRegister,
} from '../../../Services/Admin/DocumentRegister';
import { isNullOrEmpty, showErrorToast } from '../../../Utils/Utils';
import { addDocumentRegisterValidationSchema } from '../../../Utils/Validations/ValidationSchemas';
import useAutoFocus from '../../../Hooks/useAutoFocus';

const EditDocumentRegister = () => {
  usePageTitle('Document Register - Edit');
  const { id } = useParams();

  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(''); // For issue Date restriction
  const [currentGroupName, setCurrentGroupName] = useState(null); // Track current group selection
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Track initial load
  const firstInputFocusRef = useAutoFocus();

  // Get Details
  const {
    data: documentRegister,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['documentRegisterDetails', id],
    queryFn: () => viewDocumentRegister(id),
    refetchOnWindowFocus: false,
    retry: 1,
  });
  // Get Groups
  const allGroup = [
    { id: 1, type: 'Office' },
    { id: 2, type: 'Vehicle' },
    { id: 3, type: 'Employee' },
  ];
  // Get Group Types
  const {
    data: allGroupTypes,
    isLoading: isLoadingGroupTypes,
    isError: IsErrorGroupTypes,
    error: ErrorGroupTypes,
  } = useQuery({
    queryKey: ['groupTypes', selectedGroupId],
    queryFn: () => getGroupTypes(selectedGroupId),
    enabled: !!selectedGroupId,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const editDocumentRegisterMutation = useMutation({
    mutationFn: (payload) => editDocumentRegister(id, payload),
    onSuccess: () => {
      showToast('Document Register Updated!', 'success');
      setTimeout(() => {
        navigate(-1);
      }, 300);
    },
    onError: (error) => {
      console.error('Error Updating Document Register', error);
      showErrorToast(error);
    },
  });

  const handleSubmit = (values) => {
    const fileObject = values.files.reduce((acc, file, index) => {
      acc[`files[${index}]`] = file;
      return acc;
    }, {});
    const { files, ...otherValues } = values; // Exclude the original files array from values
    const payload = {
      ...otherValues,
      ...fileObject, // Add the formatted file keys to the payload
    };
    editDocumentRegisterMutation.mutate(payload);
  };

  // Function to fetch Group Type and show loading/error if api fails
  const getGroupTypeOptions = () => {
    if (!selectedGroupId) {
      return [
        {
          label: 'Select Group Type First',
          value: null,
          isDisabled: true,
        },
      ];
    } else if (isLoadingGroupTypes) {
      return [
        {
          label: 'Loading...',
          value: null,
          isDisabled: true,
        },
      ];
    } else if (!isLoadingGroupTypes && !IsErrorGroupTypes) {
      return allGroupTypes?.map((x) => ({
        value: x.id,
        label: x.description,
      }));
    } else {
      if (IsErrorGroupTypes) {
        console.error('Unable to fetch Group Type', ErrorGroupTypes);
        return [{ label: 'Unable to fetch Group Type', value: null }];
      } else {
        return [{ label: 'Loading...', value: null, isDisabled: true }];
      }
    }
  };

  useEffect(() => {
    if (!isNullOrEmpty(allGroup) && isInitialLoad) {
      if (documentRegister?.group_name) {
        // Ensure the group_name matches the option value format
        const groupId = allGroup.find(
          (x) => x.id == documentRegister?.group_name
        )?.id;
        if (groupId) {
          setSelectedGroupId(documentRegister?.group_name);
          setCurrentGroupName(groupId); // Set initial group name with correct format
          setIsInitialLoad(false); // Mark initial load as complete
        }
      }
    }
  }, [documentRegister?.group_name, allGroup, isInitialLoad]);

  useEffect(() => {
    if (!isNullOrEmpty(allGroupTypes)) {
      if (documentRegister?.type) {
        // Convert string type to number to match allGroupTypes id format
        setSelectedType(parseInt(documentRegister?.type));
      }
    }
  }, [documentRegister?.type, allGroupTypes]);

  if (isLoading) {
    return (
      <div>
        <div className="d-flex flex-column gap-2 mb-4">
          <BackButton />
          <h2 className="screen-title m-0">Document Register</h2>
        </div>

        <div className="d-card ">
          <div className="row">
            <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
              <div className="row mb-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="col-12 col-sm-6 mb-3 align-items-center"
                    style={{ height: 90 }}
                  >
                    <Skeleton
                      style={{ marginTop: 28 }}
                      duration={1}
                      width={'100%'}
                      baseColor="#ddd"
                      height={43}
                    />
                  </div>
                ))}
                <div className="col-12 mb-3 " style={{ height: 120 }}>
                  <Skeleton
                    style={{ marginTop: 28 }}
                    duration={1}
                    width={'100%'}
                    baseColor="#ddd"
                    height={43}
                  />
                </div>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="col-12 col-lg-4 col-xl-4 mb-3 align-items-center"
                    style={{ height: 90 }}
                  >
                    <Skeleton
                      style={{ marginTop: 28 }}
                      duration={1}
                      width={'100%'}
                      baseColor="#ddd"
                      height={43}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (isError) {
    return (
      <div>
        <div className="d-flex flex-column gap-2 mb-4">
          <BackButton />
          <h2 className="screen-title m-0">Document Register</h2>
        </div>

        <div className="d-card ">
          <div className="row">
            <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
              <div className="row mb-4">{error.message}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="d-flex flex-column gap-2 mb-4">
        <BackButton />
        <h2 className="screen-title m-0">Document Register</h2>
      </div>
      <div className="d-card ">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
              enableReinitialize
              initialValues={{
                ...documentRegister,
                // Use current group name to prevent reverting to original value
                group_name:
                  currentGroupName !== null
                    ? currentGroupName
                    : allGroup.find((x) => x.id == documentRegister?.group_name)
                      ?.id || '',
                // Convert type to number to match allGroupTypes id format
                type:
                  selectedType ||
                  (documentRegister?.type
                    ? parseInt(documentRegister.type)
                    : ''),
              }}
              validationSchema={addDocumentRegisterValidationSchema}
              onSubmit={handleSubmit}
            >
              {({
                values,
                touched,
                errors,
                handleChange,
                handleBlur,
                setFieldValue,
              }) => (
                <Form>
                  <div className="row mb-4">
                    {/* --- GROUP FIELD --- */}
                    <div className="col-12 col-sm-6 mb-4">
                      <SearchableSelect
                        label={'Group'}
                        name="group_name"
                        value={values.group_name}
                        ref={firstInputFocusRef}
                        options={allGroup.map((x) => ({
                          value: x.id,
                          label: x.type,
                        }))}
                        onChange={(v) => {
                          setSelectedGroup(v.label);
                          setFieldValue('issue_date', '');
                          setFieldValue('group_name', v.value);
                          setFieldValue('type', '');
                          setSelectedType('');
                          setSelectedGroupId(v.value);
                          setCurrentGroupName(v.value); // Update current group name
                        }}
                        placeholder={'Select Group'}
                      />
                      <ErrorMessage
                        name="group_name"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>

                    {/* --- TYPE FIELD --- */}
                    <div className="col-12 col-sm-6 mb-4">
                      <SearchableSelect
                        label={'Type'}
                        name="type"
                        options={getGroupTypeOptions()}
                        onChange={(v) => {
                          setFieldValue('type', v.value);
                          setSelectedType(v.value);
                        }}
                        value={values.type}
                        placeholder={'Select Type'}
                      />
                      <ErrorMessage
                        name="type"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>

                    {/* --- DESCRIPTION --- */}
                    <div className="col-12">
                      <CustomInput
                        name={'description'}
                        label={'Description'}
                        type={'textarea'}
                        rows={1}
                        required
                        placeholder={'Enter Description'}
                        value={values.description}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.description && errors.description}
                      />
                    </div>

                    {/* --- NUMBER --- */}
                    <div className="col-12 col-lg-4 col-xl-4 mb-3">
                      <CustomInput
                        name={'number'}
                        label={'Number'}
                        type={'text'}
                        required
                        placeholder={'Enter Number'}
                        value={values.number}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.number && errors.number}
                      />
                    </div>

                    {/* --- ISSUE DATE --- */}
                    <div className="col-12 col-sm-6 col-lg-4 col-xl-4 mb-3">
                      <CustomInput
                        name={'issue_date'}
                        label={'Issue Date'}
                        type={'date'}
                        required
                        value={values.issue_date}
                        {...(selectedGroup.toLowerCase() !== 'office' && {
                          max: new Date().toLocaleDateString('en-CA'),
                        })}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.issue_date && errors.issue_date}
                      />
                    </div>

                    {/* --- DUE DATE --- */}
                    <div className="col-12 col-sm-6 col-lg-4 col-xl-4 mb-3">
                      <CustomInput
                        name={'due_date'}
                        label={'Due Date'}
                        type={'date'}
                        min={values.issue_date}
                        required
                        value={values.due_date}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.due_date && errors.due_date}
                      />
                    </div>

                    {/* --- FILES --- */}
                    <div className="col-12 mb-3">
                      <UploadAndDisplayFiles
                        label={'Attachments'}
                        numberOfFiles={5}
                        files={values.files}
                        onChange={(files) => {
                          setFieldValue('files', files);
                        }}
                        onDelete={(a) => {
                          setFieldValue('delete_ids', [
                            ...(values.delete_ids || []),
                            a,
                          ]);
                        }}
                      />
                    </div>
                  </div>

                  {/* --- BUTTONS --- */}
                  <div className="d-flex gap-3">
                    <CustomButton
                      text={'Update'}
                      type={'submit'}
                      disabled={editDocumentRegisterMutation.isPending}
                      loading={editDocumentRegisterMutation.isPending}
                    />
                    <CustomButton
                      text={'Cancel'}
                      variant={'secondaryButton'}
                      type={'button'}
                      disabled={editDocumentRegisterMutation.isPending}
                      onClick={() => navigate(-1)}
                    />
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditDocumentRegister;
