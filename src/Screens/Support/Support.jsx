import { useMutation, useQuery } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik  ,FastField } from 'formik';
import React, { useRef } from 'react';
import PhoneInput from 'react-phone-number-input';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../Components/BackButton';
import CustomButton from '../../Components/CustomButton';
import CustomInput from '../../Components/CustomInput';
import SearchableSelect from '../../Components/SearchableSelect/SearchableSelect';
import withModal from '../../HOC/withModal';
import { usePageTitle } from '../../Hooks/usePageTitle';
import { getSupportType, sendSupportForm } from '../../Services/General';
import useUserStore from '../../Stores/UserStore';
import { showErrorToast } from '../../Utils/Utils';
import { supportFormSchema } from '../../Utils/Validations/ValidationSchemas';
import UploadAndDisplayFiles from '../../Components/UploadAndDisplayFiles/UploadAndDisplayFiles';

const Support = ({ showModal }) => {
  usePageTitle('Support');
  const navigate = useNavigate();
  let { user } = useUserStore();
  const resetFormRef = useRef(null);

  const submitSupportFormMutation = useMutation({
    mutationFn: sendSupportForm,
    onSuccess: () => {
      showModal(
        'Thank you!',
        'Thank you for contacting us. One of our support agents will get in touch with you soon!',
        null,
        'success',
        () => {
          if (resetFormRef.current) {
            resetFormRef.current();
          }
        }
      );
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  const handleSubmit = (values, resetForm) => {
    // Store resetForm in ref so it can be accessed in modal's postAction
    resetFormRef.current = resetForm;
    
    const fileObject = values.files.reduce((acc, file, index) => {
      acc[`files[${index}]`] = file;
      return acc;
    }, {});
    const { files, ...otherValues } = values; // Exclude the original files array from values
    const payload = {
      ...otherValues,
      ...fileObject, // Add the formatted file keys to the payload
    };
    submitSupportFormMutation.mutate(payload);
  };

  // Get Types
  const {
    data: allSupportTypes,
    isLoading: isLoadingSupportTypes,
    isError: IsErrorSupportTypes,
    error: ErrorSupportTypes,
  } = useQuery({
    queryKey: ['SupportTypes'],
    queryFn: getSupportType,
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
        <h2 className="screen-title m-0 d-inline">Contact Us</h2>
      </div>

      <div className="d-card ">
        <div className="row mt-2">
          <h4 className="screen-title mb-45">
            Please let us know how we can improve your experience
          </h4>
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
              initialValues={{
                user_id: user?.user_id,
                name: user?.user_name,
                email: user?.email,
                contact_no: '',
                support_type: '',
                message: '',
                files: [],
              }}
              validationSchema={supportFormSchema}
              onSubmit={(values, { resetForm }) => {
                handleSubmit(values, resetForm);
              }}
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
                      <CustomInput
                        name={'user_id'}
                        type={'text'}
                        required
                        label={'User ID'}
                        value={values.user_id}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.user_id && errors.user_id}
                        disabled
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
                            value={values.contact_no}
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
                        placeholder="Support Typer"
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
                    <div className="col-12 col-sm-8 mb-3">
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
                      <UploadAndDisplayFiles
                        label={'Attachments'}
                        required
                        numberOfFiles={5}
                        files={values.files}
                        onChange={(files) => {
                          setFieldValue('files', files);
                        }}
                        resetForm={resetFormRef.current}
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

export default withModal(Support);
