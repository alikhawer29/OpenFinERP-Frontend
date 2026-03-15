import { Form, Formik } from 'formik';
import React from 'react';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { passwordResetValidationSchema } from '../../../Utils/Validations/ValidationSchemas';
import { useMutation } from '@tanstack/react-query';
import { showToast } from '../../../Components/Toast/Toast';
import { passwordUpdate } from '../../../Services/Administration/Profile';
import useUserStore from '../../../Stores/UserStore';
import { isNullOrEmpty } from '../../../Utils/Utils';

const PasswordReset = () => {
  usePageTitle('Password Reset');

  let { user } = useUserStore();

  const handleSubmit = (values, resetForm) => {
    updatePasswordMutation.mutate(values, {
      onSuccess: () => {
        resetForm();
        showToast('Password Updated Successfully', 'success');
      },
    });
  };
  const updatePasswordMutation = useMutation({
    mutationFn: (values, resetForm) => passwordUpdate(values, resetForm),
    onError: (error) => {
      console.error('Failed to update password', error);
      if (!isNullOrEmpty(error.errors?.current_password)) {
        showToast(error.errors.current_password[0], 'error');
      }
      showToast(error.message, 'error');
    },
  });

  return (
    <>
      <div className="d-flex justify-content-between flex-wrap mb-3">
        <h2 className="screen-title mb-0">Password Reset</h2>
      </div>
      <div className="d-card py-45 mb-45">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
              initialValues={{
                user_id: user?.user_id,
                current_password: '',
                password: '',
                password_confirmation: '',
              }}
              validationSchema={passwordResetValidationSchema}
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
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'user_id'}
                        type={'text'}
                        disabled={true}
                        required
                        label={'User ID'}
                        placeholder={'Enter User ID'}
                        value={values.user_id}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.user_id && errors.user_id}
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'current_password'}
                        type={'password'}
                        required
                        label={'Old Password'}
                        placeholder={'Enter Old Password'}
                        value={values.current_password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={
                          touched.current_password && errors.current_password
                        }
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'password'}
                        type={'password'}
                        required
                        label={'New Password'}
                        placeholder={'Enter New Password'}
                        value={values.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.password && errors.password}
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'password_confirmation'}
                        type={'password'}
                        required
                        label={'Password Confirmation'}
                        placeholder={'Enter Password Confirmation'}
                        value={values.password_confirmation}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={
                          touched.password_confirmation &&
                          errors.password_confirmation
                        }
                      />
                    </div>
                    <div className="d-flex gap-3 ms-auto mb-3 mb-md-0">
                      <CustomButton
                        loading={updatePasswordMutation.isPending}
                        disabled={updatePasswordMutation.isPending}
                        type={'submit'}
                        text={'Update'}
                      />
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </>
  );
};

export default PasswordReset;
