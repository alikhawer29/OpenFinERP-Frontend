import { useMutation } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../../Components/CustomButton';
import CustomInput from '../../Components/CustomInput';
import { showToast } from '../../Components/Toast/Toast';
import { usePageTitle } from '../../Hooks/usePageTitle';
import { AuthLayout } from '../../Layout/AuthLayout';
import { sendVerificationCodeId } from '../../Services/Auth';
import { isNullOrEmpty } from '../../Utils/Utils';
import { forgotEmail } from '../../Utils/Validations/ValidationSchemas';

const ForgetId = () => {
  usePageTitle('Forget-Id');
  const [email, setEmail] = useState('ege');
  const navigate = useNavigate();
  const getVerificationCode = useMutation({
    mutationFn: sendVerificationCodeId,
    onSuccess: () => {
      navigate('forget-id2', { state: { email } });
    },
    onError: (error) => {
      console.error('Failed to send verification code', error);
      if (!isNullOrEmpty(error.errors?.email)) {
        showToast(error.errors.email[0], 'error');
      }
    },
  });
  const handleSubmit = (values) => {
    setEmail(values.email);
    getVerificationCode.mutate(values);
  };

  return (
    <AuthLayout
      authTitle="Forgot ID"
      authMain
      authParagraph="Enter your email address to receive a verification code."
      backOption={true}
    >
      <Formik
        initialValues={{ email: '' }}
        validationSchema={forgotEmail}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, handleBlur }) => (
          <Form className="px-lg-5 mx-lg-5 px-2 mx-2">
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

export default ForgetId;
