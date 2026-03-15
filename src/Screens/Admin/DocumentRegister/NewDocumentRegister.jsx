import { useMutation, useQuery } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast';
import UploadAndDisplayFiles from '../../../Components/UploadAndDisplayFiles/UploadAndDisplayFiles';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import {
  addDocumentRegister,
  getGroups,
  getGroupTypes,
} from '../../../Services/Admin/DocumentRegister';
import { addDocumentRegisterValidationSchema } from '../../../Utils/Validations/ValidationSchemas';
import { showErrorToast } from '../../../Utils/Utils';
import useAutoFocus from '../../../Hooks/useAutoFocus';

const NewDocumentRegister = () => {
  usePageTitle('Document Register - Create');

  const navigate = useNavigate();
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(''); // For issue Date restriction
  const firstInputFocusRef = useAutoFocus();

  const addDocumentRegisterMutation = useMutation({
    mutationFn: addDocumentRegister,
    onSuccess: () => {
      showToast('Document Register Added!', 'success');
      setTimeout(() => {
        navigate(-1);
      }, 300);
    },
    onError: (error) => {
      console.error('Error adding Document Register', error);
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

    addDocumentRegisterMutation.mutate(payload);
  };

  // Get Group Types
  const {
    data: allGroup,
    isLoading: isLoadingGroup,
    isError: IsErrorGroup,
    error: ErrorGroup,
  } = useQuery({
    queryKey: ['group', selectedGroupId],
    queryFn: () => getGroups(),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Function to fetch Groups and show loading/error if api fails
  const getGroupsOptions = () => {
    if (!isLoadingGroup && !IsErrorGroup) {
      return allGroup?.map((x) => ({
        value: x.id,
        label: x.type,
      }));
    } else {
      if (IsErrorGroup) {
        console.error('Unable to fetch Group', ErrorGroup);
        return [{ label: 'Unable to fetch Group', value: null }];
      } else {
        return [{ label: 'Loading...', value: null, isDisabled: true }];
      }
    }
  };

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

  // Function to fetch Group Type and show loading/error if api fails
  const getGroupTypeOptions = () => {
    if (!isLoadingGroupTypes && !IsErrorGroupTypes) {
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

  return (
    <div>
      <div className="d-flex flex-column align-items-start gap-2 mb-4">
        <BackButton />
        <h2 className="screen-title m-0">Document Register</h2>
      </div>

      <div className="d-card ">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
              initialValues={{
                group_name: '',
                type: '',
                description: '',
                number: '',
                issue_date: '',
                due_date: '',
                files: [],
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
                    <div className="col-12 col-sm-6 mb-4">
                      <SearchableSelect
                        label={'Group'}
                        name="group_name"
                        ref={firstInputFocusRef}
                        value={values.group_name}
                        options={getGroupsOptions()}
                        onChange={(v) => {
                          setSelectedGroup(v.label);
                          setFieldValue('issue_date', '');
                          setFieldValue('group_name', v.value);
                          setFieldValue('type', '');
                          setSelectedType(undefined);
                          setSelectedGroupId(v.value);
                        }}
                        placeholder={'Select Group Type'}
                      />
                      <ErrorMessage
                        name="group_name"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-4">
                      <SearchableSelect
                        label={'Type'}
                        name="type"
                        options={
                          !selectedGroupId
                            ? [
                                {
                                  label: 'Select Group Type First',
                                  value: null,
                                  isDisabled: true,
                                },
                              ]
                            : getGroupTypeOptions()
                        }
                        onChange={(v) => {
                          setFieldValue('type', v.value);
                          setSelectedType(v.value);
                        }}
                        value={selectedType}
                        placeholder={'Select Your Type'}
                      />
                      <ErrorMessage
                        name="type"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
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
                    <div className="col-12 col-sm-6 col-lg-4 col-xl-4 mb-3">
                      <CustomInput
                        name={'issue_date'}
                        label={'Issue Date'}
                        type={'date'}
                        required
                        value={values.issue_date}
                        {...(selectedGroup.toLocaleLowerCase() !== 'office' && {
                          max: new Date().toLocaleDateString('en-CA'),
                        })}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.issue_date && errors.issue_date}
                      />
                    </div>
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
                    <div className="col-12 mb-3">
                      <UploadAndDisplayFiles
                        label={'Attachments'}
                        numberOfFiles={5}
                        onChange={(files) => {
                          setFieldValue('files', files);
                        }}
                      />
                    </div>
                  </div>
                  <div className="d-flex gap-3">
                    <CustomButton
                      text={'Save'}
                      type={'submit'}
                      disabled={addDocumentRegisterMutation.isPending}
                      loading={addDocumentRegisterMutation.isPending}
                    />
                    <CustomButton
                      text={'Cancel'}
                      variant={'secondaryButton'}
                      type={'button'}
                      disabled={addDocumentRegisterMutation.isPending}
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

export default NewDocumentRegister;
