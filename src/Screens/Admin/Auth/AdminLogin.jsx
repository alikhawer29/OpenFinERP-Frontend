import { Form, Formik } from 'formik';
import { Link } from 'react-router-dom';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import { useLogin } from '../../../Hooks/useLogin';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { AuthLayout } from '../../../Layout/AuthLayout';
import { adminLoginValidationSchema } from '../../../Utils/Validations/ValidationSchemas';
import './Auth.css';

const AdminLogin = () => {
  const loginMutation = useLogin('admin');
  usePageTitle('Admin Login');

  const handleSubmit = (values) => {
    loginMutation.mutate(values);
  };

  return (
    <AuthLayout authTitle="Sysadmin Login" authPara="Login into your Account">
      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={adminLoginValidationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, handleBlur }) => (
          <Form className=" login-form">
            <div className="mb-3">
              <CustomInput
                name="email"
                label="Email Address"
                required
                type="text"
                className="mb-0"
                placeholder="Enter Your Email"
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.email}
                error={touched.email && errors.email}
              />
            </div>
            <div className="mb-3">
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
              />
            </div>
            <div className="d-flex align-items-baseline flex-wrap justify-content-between mt-1">
              <div className="checkBox">
                <input
                  type="checkbox"
                  name="rememberMe"
                  id="rememberMe"
                  className="me-1"
                />
                <label htmlFor="rememberMe">Remember Me</label>
              </div>
              <div className="mt-2">
                <Link to={'/admin/forget-password'} className="text-link">
                  Forgot Password?
                </Link>
              </div>
            </div>
            <div className="mt-4 text-center beechMein">
              <CustomButton
                type="submit"
                text="Login"
                loading={loginMutation.isPending}
                disabled={loginMutation.isPending}
              />
            </div>
          </Form>
        )}
      </Formik>
    </AuthLayout>
  );
};

export default AdminLogin;
