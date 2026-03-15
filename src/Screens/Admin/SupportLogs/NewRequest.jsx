import { useMutation, useQuery } from '@tanstack/react-query';
import { ErrorMessage, FastField, Form, Formik } from 'formik';
import React from 'react';
import PhoneInput from 'react-phone-number-input';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast';
import UploadAndDisplayFiles from '../../../Components/UploadAndDisplayFiles/UploadAndDisplayFiles';
import withModal from '../../../HOC/withModal';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { getSupportTypesList, getUserListingForSupport, sendNewSupportForm } from '../../../Services/Admin/Support';
import { supportStatusOptions } from '../../../Utils/Constants/SelectOptions';
import { showErrorToast } from '../../../Utils/Utils';
import { NewRequestValidationSchema } from '../../../Utils/Validations/ValidationSchemas';

const NewRequest = () => {
  usePageTitle('New Request');
  const navigate = useNavigate();

  const submitSupportFormMutation = useMutation({
    mutationFn: sendNewSupportForm,
    onSuccess: () => {
      showToast('New Request Submitted Successfully!', 'success');
      navigate(-1);
    },
    onError: (error) => {
      console.error('Error sending message!', error);
      showErrorToast(error);
    },
  });

  const handleSubmit = (values, resetForm) => {
    const fileObject = values.files.reduce((acc, file, index) => {
      acc[`files[${index}]`] = file;
      return acc;
    }, {});
    const { files, ...otherValues } = values; // Exclude the original files array from values
    const payload = {
      ...otherValues,
      ...fileObject, // Add the formatted file keys to the payload
    };
    submitSupportFormMutation.mutate(payload, {
      onSuccess: () => {
        resetForm();
      },
    });
  };



  // Get User Listing
  const {
    data: userListingForSupport,
    isLoading: isLoadingUserListing,
    isError: IsErrorUserListing,
    error: ErrorUserListing,
  } = useQuery({
    queryKey: ['UserListingForSupport'],
    queryFn: getUserListingForSupport,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Get Types
  const {
    data: allSupportTypes,
    isLoading: isLoadingSupportTypes,
    isError: IsErrorSupportTypes,
    error: ErrorSupportTypes,
  } = useQuery({
    queryKey: ['SupportTypes'],
    queryFn: getSupportTypesList,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Function to fetch Support Options by calling API and returning desired options array. Also show loading/error if api fails
  const getSupportTypeOptions = () => {
    if (!isLoadingSupportTypes && !IsErrorSupportTypes) {
      return allSupportTypes?.map((x) => ({
        value: x.id,
        label: x.name,
      }));
    } else {
      if (IsErrorSupportTypes) {
        console.error('Unable to fetch Support Types', ErrorSupportTypes);
        return [{ label: 'Unable to fetch Support Types', value: null }];
      } else {
        return [{ label: 'Loading...', value: null, isDisabled: true }];
      }
    }
  };

  return (
    <div>
      <div className="d-flex flex-column gap-2 mb-4">
        <BackButton />
        <h2 className="screen-title m-0 d-inline">New Request</h2>
      </div>

      <div className="d-card ">
        <div className="row mt-2">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
              initialValues={{
                user_id: '',
                name: '',
                email: '',
                contact_no: '',
                support_type: '',
                message: '',
                status: '',
                files: [],
              }}
              validationSchema={NewRequestValidationSchema}
              onSubmit={(values, { resetForm }) => {
                handleSubmit(values, resetForm);
              }}
              enableReinitialize
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
                  <div className="row mb-4">
                    <div className="col-12 col-sm-8 mb-3">
                      <SearchableSelect
                        name={'user_id'}
                        label={'User ID'}
                        placeholder={'Select User ID'}
                        options={
                          isLoadingUserListing
                            ? [{ label: 'Loading...', value: null, isDisabled: true }]
                            : IsErrorUserListing
                              ? [{ label: 'Unable to fetch users', value: null }]
                              : userListingForSupport?.map((x) => ({
                                value: x.id,
                                label: `${x.user_id}`,
                              })) || []
                        }
                        value={values.user_id}
                        onChange={(v) => {
                          const selectedUser = userListingForSupport?.find(
                            (user) => user.id === v.value
                          );
                          if (selectedUser) {
                            setFieldValue('user_id', selectedUser.id);
                            setFieldValue('name', selectedUser.user_name);
                            setFieldValue('email', selectedUser.email);
                          }
                        }}
                        error={touched.user_id && errors.user_id}
                      />

                    </div>
                    <div className="col-12 col-sm-8 mb-3">
                      <CustomInput
                        name={'name'}
                        type={'text'}
                        required
                        label={'Full Name'}
                        placeholder={'Enter Full Name'}
                        value={values.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.name && errors.name}
                        disabled
                      />
                    </div>
                    <div className="col-12 col-sm-8 mb-3">
                      <CustomInput
                        name={'email'}
                        type={'text'}
                        required
                        label={'Email'}
                        placeholder={'Enter Email'}
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.email && errors.email}
                        disabled
                      />
                    </div>
                    <div className="col-12 col-sm-8 mb-3">
                      <label className="mainLabel">
                        Contact Number
                        <span className="text-danger">*</span>
                      </label>
                      <FastField name="contact_no">
                        {({ field }) => (
                          <PhoneInput
                            {...field}
                            international
                            withCountryCallingCode
                            placeholder="Enter Contact Number"
                            className="mainInput"
                            defaultCountry="AE"
                            onChange={(value) => setFieldValue('contact_no', value)}
                            onBlur={() =>
                              handleBlur({ target: { name: 'contact_no' } })
                            }
                          />
                        )}
                      </FastField>
                      <ErrorMessage
                        name="contact_no"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
                    <div className="col-12 col-sm-8 mb-3">
                      <SearchableSelect
                        name="support_type"
                        label="Support Type"
                        placeholder="Support Type"
                        options={getSupportTypeOptions()}
                        value={values.support_type}
                        onChange={(v) => setFieldValue('support_type', v.value)}
                      />
                      <ErrorMessage
                        name="support_type"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
                    <div className="col-12 col-sm-8">
                      <CustomInput
                        name={'message'}
                        type={'textarea'}
                        rows={1}
                        required
                        label={'Message'}
                        placeholder={'Enter Message'}
                        value={values.message}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.message && errors.message}
                      />
                    </div>
                    <div className="col-12 col-sm-8 mb-45">
                      <SearchableSelect
                        label={'Status'}
                        name="status"
                        options={supportStatusOptions}
                        value={values.status}
                        onChange={(v) => {
                          setFieldValue('status', v.value);
                        }}
                        placeholder={'Select Status'}

                      />
                      <ErrorMessage
                        name="status"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
                    <div className="col-12 col-sm-8 mb-45">
                      <UploadAndDisplayFiles
                        label={'Attachments'}
                        required
                        numberOfFiles={5}
                        files={values.files}
                        onChange={(files) => {
                          setFieldValue('files', files);
                        }}
                        errorFromParent={touched.files && errors.files}
                      />
                    </div>
                    <div className="d-flex gap-3 ms-auto mb-3 mb-md-0">
                      <CustomButton
                        loading={submitSupportFormMutation.isPending}
                        disabled={submitSupportFormMutation.isPending}
                        type={'submit'}
                        text={'Submit'}
                      />
                      {!submitSupportFormMutation.isPending && (
                        <CustomButton
                          onClick={() => navigate(-1)}
                          variant={'secondaryButton'}
                          text={'Cancel'}
                          type={'button'}
                        />
                      )}
                    </div>
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

export default withModal(NewRequest);
