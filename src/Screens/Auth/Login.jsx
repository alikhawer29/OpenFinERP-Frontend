import { Form, Formik } from 'formik';
import { Link } from 'react-router-dom';
import CustomButton from '../../Components/CustomButton';
import CustomInput from '../../Components/CustomInput';
import { useLogin } from '../../Hooks/useLogin';
import { usePageTitle } from '../../Hooks/usePageTitle';
import { AuthLayout } from '../../Layout/AuthLayout';
import { loginValidationSchema } from '../../Utils/Validations/ValidationSchemas';
import './Auth.css';

const LogIn = () => {
  const loginMutation = useLogin();

  const handleSubmit = (values) => {
    loginMutation.mutate(values);
  };

  usePageTitle('Login');

  return (
    <AuthLayout authTitle="Login" authPara="Login into your Account">
      <Formik
        initialValues={{ user_id: '', password: '' }}
        validationSchema={loginValidationSchema}
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
          <Form className="login-form">
            <CustomInput
              label="User ID"
              required
              id="user_id"
              type="text"
              className="mb-0"
              placeholder="Enter Your User ID"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.email}
              error={touched.email && errors.email}
              tabIndex={1}
              autoFocus
            />
            <div className="mt-2 d-flex align-items-baseline flex-wrap justify-content-end ">
              <Link to={'/forget-id'} className="text-link" tabIndex={4}>
                Forgot ID?
              </Link>
            </div>
            <CustomInput
              label="Password"
              required
              id="password"
              type="password"
              placeholder="Enter Password"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.password}
              error={touched.password && errors.password}
              tabIndex={2}
            />
            <div className="d-flex align-items-baseline flex-wrap justify-content-between mt-1">
              <div className="checkbox-wrapper">
                <label className="checkbox-container">
                  <input type="checkbox" id="rememberMe" name="rememberMe" />
                  <span className="custom-checkbox"></span>
                  Remember Me
                </label>
              </div>
              <div className="mt-2">
                <Link
                  to={'/forget-password'}
                  className="text-link"
                  tabIndex={5}
                >
                  Forgot Password?
                </Link>
              </div>
            </div>
            <div className="mt-4 text-center beechMein">
              <CustomButton
                type="submit"
                text="Login"
                tabIndex={3}
                loading={loginMutation.isPending}
                disabled={loginMutation.isPending}
              />
            </div>
            <div className="mt-3 mt-md-5 text-center">
              <p>
                Not a user?
                <span className="ms-2">
                  <Link className="text-link" to="/signup">
                    Register Now
                  </Link>
                </span>
              </p>
            </div>
          </Form>
        )}
      </Formik>
    </AuthLayout>
  );
};

export default LogIn;
