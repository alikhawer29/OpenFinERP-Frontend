import { useMutation } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CustomButton from '../../Components/CustomButton';
import CustomInput from '../../Components/CustomInput';
import { showToast } from '../../Components/Toast/Toast';
import { usePageTitle } from '../../Hooks/usePageTitle';
import { AuthLayout } from '../../Layout/AuthLayout';
import {
  sendVerificationCode,
  verifyVerificationCodeId,
} from '../../Services/Auth';
import { showErrorToast } from '../../Utils/Utils';
import { forgotCode } from '../../Utils/Validations/ValidationSchemas';

const ForgetId2 = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [timer, setTimer] = useState(60);
  const [isDisabled, setIsDisabled] = useState(false);
  const [startCountdown, setStartCountdown] = useState(false);

  usePageTitle('Forget-Id');

  useEffect(() => {
    let countdown;
    if (startCountdown && timer > 0) {
      countdown = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsDisabled(false);
      setStartCountdown(false);
      setTimer(60);
    }
    return () => clearInterval(countdown);
  }, [timer, startCountdown]);

  const getVerificationCode = useMutation({
    mutationFn: sendVerificationCode,
    onSuccess: () => {
      setStartCountdown(true);
      showToast('Verification code resent', 'success');
    },
    onError: (error) => {
      console.error('Failed to send verification code', error);
      showErrorToast(error);
    },
  });

  const submitVerificationCode = useMutation({
    mutationFn: verifyVerificationCodeId,
    onSuccess: () => {
      showToast('Code verified successfully, Kindly Check Email', 'success');
      navigate('/login');
    },
    onError: (error) => {
      console.error('Failed to verify code', error);
      showErrorToast(error);
    },
  });

  const handleResend = () => {
    if (state.email) {
      setIsDisabled(true);
      getVerificationCode.mutate(state);
    } else {
      console.error('Resend failed');
    }
  };

  const handleSubmit = (values) => {
    submitVerificationCode.mutate({
      email: state.email,
      code: values.verificationCode,
    });
  };

  return (
    <AuthLayout
      authTitle="Forgot ID"
      authMain
      authParagraph="An email has been sent to you with a verification code. Please enter it here."
      backOption={true}
    >
      <Formik
        initialValues={{ verificationCode: '' }}
        validationSchema={forgotCode}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleBlur, setFieldValue }) => (
          <Form className="px-lg-5 mx-lg-5 px-2 mx-2">
            <CustomInput
              label="Verification Code"
              required
              id="verificationCode"
              type="text"
              placeholder="Enter Verification Code"
              value={values.verificationCode}
              onChange={(e) => {
                const numericValue = e.target.value
                  .replace(/[^0-9]/g, '')
                  .slice(0, 4);
                setFieldValue('verificationCode', numericValue);
              }}
              onBlur={handleBlur}
              error={touched.verificationCode && errors.verificationCode}
            />
            <div
              className={`d-flex align-items-center ${
                isDisabled ? 'justify-content-between ' : 'justify-content-end '
              }`}
            >
              {isDisabled && (
                <p className="m-0 primary-text-color">
                  Resend in 00:{timer < 10 ? `0${timer}` : timer}
                </p>
              )}
              <button
                type="button"
                onClick={handleResend}
                disabled={isDisabled}
                className="text-link text-decoration-underline"
                style={{
                  color: isDisabled ? 'gray' : '#0075ff',
                  background: 'none',
                  border: 'none',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                }}
              >
                Resend Code
              </button>
            </div>
            <div className="mt-4 beechMein">
              <CustomButton
                type="submit"
                text="Continue"
                loading={submitVerificationCode.isPending}
                disabled={submitVerificationCode.isPending}
              />
            </div>
          </Form>
        )}
      </Formik>
    </AuthLayout>
  );
};

export default ForgetId2;
