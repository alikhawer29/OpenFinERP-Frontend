import { useMutation } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import React, { useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import PhoneInput, { parsePhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Link, useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import { showToast } from '../../../Components/Toast/Toast';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { AuthLayout } from '../../../Layout/AuthLayout';
import { setUserId, signUpUser } from '../../../Services/Auth';
import { showErrorToast } from '../../../Utils/Utils';
import { signUpValidationSchema } from '../../../Utils/Validations/ValidationSchemas';

const SignUp = () => {
  usePageTitle('Milestone | Sign Up');
  const navigate = useNavigate();

  const signUpMutation = useMutation({
    mutationFn: signUpUser,
    onSuccess: (data) => {
      showToast('Sign up successful', 'success');
      setTimeout(() => {
        navigate('/login');
      }, 300);
    },
    onError: (error) => {
      console.error('Sign up Failed', error);
      showErrorToast(error);
    },
  });

  const handleSubmit = (values) => {
    let parsedPhoneNumber;
    if (values.phone?.length > 3) {
      parsedPhoneNumber = parsePhoneNumber(values.phone, 'US');
    }

    const finalValues = {
      ...values,
      ...(parsedPhoneNumber && {
        country_code: parsedPhoneNumber
          ? `+${parsedPhoneNumber.countryCallingCode}`
          : '',
        phone: parsedPhoneNumber
          ? parsedPhoneNumber.nationalNumber
          : values.phone,
      }),
    };

    signUpMutation.mutate(finalValues);
  };

  const [userIdSuggestions, setUserIdSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionError, setSuggestionError] = useState('');

  const handleUserIDChange = async (e) => {
    const userName = e;

    if (userName.length > 2) {
      // Fetch suggestions if input is valid
      try {
        setLoadingSuggestions(true);
        const response = await setUserId(userName);
        setUserIdSuggestions(response || []); // Assuming API returns `suggestions`
        setSuggestionError('');
      } catch (error) {
        setSuggestionError(error?.message);
        console.error('Error fetching user ID suggestions:', error);
      } finally {
        setLoadingSuggestions(false);
      }
    } else {
      setUserIdSuggestions([]);
    }
  };

  return (
    <AuthLayout authTitle="Sign Up">
      <Formik
        initialValues={{
          business_name: '',
          user_name: '',
          user_id: '',
          email: '',
          password: '',
          password_confirmation: '',
        }}
        validationSchema={signUpValidationSchema}
        onSubmit={handleSubmit}
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
            <Row>
              <Col xs={12}>
                <CustomInput
                  label="Business Name"
                  name="business_name"
                  required
                  id="business_name"
                  type="text"
                  placeholder="Enter Business Name"
                  value={values.business_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.business_name && errors.business_name}
                />
              </Col>

              <Col md={6} xs={12}>
                <CustomInput
                  label="Full Name"
                  required
                  name="user_name"
                  id="user_name"
                  type="text"
                  placeholder="Enter Full Name"
                  value={values.user_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.user_name && errors.user_name}
                />
              </Col>

              <Col md={6} xs={12}>
                <CustomInput
                  label="User ID"
                  required
                  id="user_id"
                  name={'user_id'}
                  type="text"
                  placeholder="Enter User ID"
                  value={values.user_id}
                  onChange={(e) => {
                    handleUserIDChange(e.target.value); // Call your custom function
                    handleChange(e);
                  }}
                  onBlur={handleBlur}
                  error={(touched.user_id && errors.user_id) || suggestionError}
                  // disabled
                />
              </Col>
              <Col md={6} xs={12}></Col>
              <Col md={6} xs={12}>
                {/* Suggestion Dropdown */}
                {userIdSuggestions?.length > 0 && (
                  <div className="suggestions-dropdown">
                    <p style={{ marginTop: '-1rem' }} className="text-danger">
                      This user ID is taken
                    </p>
                    {loadingSuggestions ? (
                      <p>Suggestions: Loading...</p>
                    ) : (
                      <div className="suggestion-item-wrapper">
                        <div style={{ color: '#333' }} className="me-2">
                          Suggestions:{' '}
                        </div>
                        {userIdSuggestions.map((suggestion, index) => (
                          <p
                            key={index}
                            className="suggestion-item mb-0"
                            onClick={() => setFieldValue('user_id', suggestion)}
                          >
                            {suggestion},
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Col>

              <Col md={6} xs={12}>
                <CustomInput
                  label="E-Mail Address"
                  required
                  id="email"
                  name={'email'}
                  type="text"
                  placeholder="Enter E-Mail Address"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email && errors.email}
                />
              </Col>

              <Col md={6} xs={12} className="inputWrapper">
                <label className="mainLabel bold">Phone Number</label>
                <PhoneInput
                  placeholder="Enter phone number"
                  className="mainInput"
                  defaultCountry="US"
                  international
                  withCountryCallingCode
                  focusInputOnCountrySelection={false}
                  value={values.phone}
                  onChange={(value) => setFieldValue('phone', value)}
                  onBlur={() => handleBlur({ target: { name: 'phone' } })}
                />
                <ErrorMessage
                  name="phone"
                  component="div"
                  className="input-error-message text-danger"
                />
              </Col>

              <Col md={6} xs={12}>
                <CustomInput
                  label="Password"
                  required
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Enter Password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password && errors.password}
                />
              </Col>

              <Col md={6} xs={12}>
                <CustomInput
                  label="Confirm Password"
                  required
                  id="password_confirmation"
                  name="password_confirmation"
                  type="password"
                  placeholder="Confirm Password"
                  value={values.password_confirmation}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={
                    touched.password_confirmation &&
                    errors.password_confirmation
                  }
                />
              </Col>

              <Col xs={12}>
                <div className="my-md-3 my-2 beechMein">
                  <CustomButton
                    type="submit"
                    loading={signUpMutation.isLoading}
                    disabled={signUpMutation.isPending}
                  >
                    Register
                  </CustomButton>
                </div>
              </Col>
            </Row>
          </Form>
        )}
      </Formik>

      <Row>
        <Col xs={12}>
          <div className="text-center mt-3">
            <p>
              Already Have An Account?
              <span className="ms-2">
                <Link to="/login" className="text-link">
                  Login
                </Link>
              </span>
            </p>
          </div>
        </Col>
      </Row>
    </AuthLayout>
  );
};

export default SignUp;
