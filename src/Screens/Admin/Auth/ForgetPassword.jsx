import { useMutation } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { AuthLayout } from '../../../Layout/AuthLayout';
import { AdminSendVerificationCode } from '../../../Services/Admin/AdminAuth';
import { showErrorToast } from '../../../Utils/Utils';
import { forgotEmail } from '../../../Utils/Validations/ValidationSchemas';

const ForgetPassword = () => {
  usePageTitle('Forget-Password');
  const [email, setEmail] = useState('ege');
  const navigate = useNavigate();
  const getVerificationCode = useMutation({
    mutationFn: AdminSendVerificationCode,
    onSuccess: () => {
      navigate('/admin/forget-password2', { state: { email } });
    },
    onError: (error) => {
      console.error('Failed to send verification code', error);
      showErrorToast(error);
    },
  });
  const handleSubmit = (values) => {
    setEmail(values.email);
    getVerificationCode.mutate(values);
  };

  return (
    <AuthLayout
      authTitle="Forgot Password"
      authMain
      authParagraph="Enter your email address to receive a verification code."
      backOption={true}
      adminAuth={true}
    >
      <Formik
        initialValues={{ email: '' }}
        validationSchema={forgotEmail}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, handleBlur }) => (
          <Form>
            <CustomInput
              label="Email Address"
              required
              id="email"
              type="email"
              placeholder="Enter Your Email Address"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email && errors.email}
            />
            <div className="mt-4 beechMein">
              <CustomButton
                type="submit"
                text="Continue"
                loading={getVerificationCode.isPending}
                disabled={getVerificationCode.isPending}
              />
            </div>
          </Form>
        )}
      </Formik>
    </AuthLayout>
  );
};

export default ForgetPassword;
