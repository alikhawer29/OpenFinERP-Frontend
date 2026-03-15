import { useMutation } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { useLocation, useNavigate } from 'react-router-dom';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import { showToast } from '../../../Components/Toast/Toast';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { AuthLayout } from '../../../Layout/AuthLayout';
import { AdminSetNewPassword } from '../../../Services/Admin/AdminAuth';
import { isNullOrEmpty } from '../../../Utils/Utils';
import { forgotPassword } from '../../../Utils/Validations/ValidationSchemas';

const ForgetPassword3 = () => {
  usePageTitle('Forget-Password');
  const { state } = useLocation();
  const { email, verificationCode } = state || {};
  const navigate = useNavigate();

  const submitUpdatePassword = useMutation({
    mutationFn: AdminSetNewPassword,
    onSuccess: () => {
      showToast('Password was reset', 'success');
      navigate('/admin/login');
    },
    onError: (error) => {
      if (!isNullOrEmpty(error.errors?.password)) {
        showToast(error.errors.password[0], 'error');
      }
    },
  });
  const handleSubmit = (values) => {
    submitUpdatePassword.mutate({
      email,
      code: verificationCode,
      password: values.password,
      password_confirmation: values.password_confirmation,
    });
  };

  return (
    <AuthLayout
      authTitle="Password Recovery"
      authMain
      authParagraph="Set a New Password for Your Account"
      backOption={true}
      adminAuth={true}
    >
      <Formik
        initialValues={{ password: '', password_confirmation: '' }}
        validationSchema={forgotPassword}
        onSubmit={handleSubmit}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          isSubmitting,
        }) => (
          <Form >
            <CustomInput
              label="New Password"
              required
              id="password"
              type="password"
              placeholder="Enter New Password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.password && errors.password}
            />

            <CustomInput
              label="Confirm Password"
              required
              id="password_confirmation"
              type="password"
              placeholder="Confirm New Password"
              value={values.password_confirmation}
              onChange={handleChange}
              onBlur={handleBlur}
              error={
                touched.password_confirmation && errors.password_confirmation
              }
            />

            <div className="mt-4 beechMein">
              <CustomButton
                type="submit"
                text="Update"
                loading={submitUpdatePassword.isPending}
                disabled={submitUpdatePassword.isPending}
              />
            </div>
          </Form>
        )}
      </Formik>
    </AuthLayout>
  );
};

export default ForgetPassword3;
