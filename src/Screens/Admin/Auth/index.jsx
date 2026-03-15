import AdminLogin from './AdminLogin';
import ForgetPassword from './ForgetPassword';
import ForgetPassword2 from './ForgetPassword2';
import ForgetPassword3 from './ForgetPassword3';

const AdminAuthScreens = ({ screen }) => {
  switch (screen) {
    case "login":
      return <AdminLogin />;
    case "forget-password":
      return <ForgetPassword />;
    case "forget-password2":
      return <ForgetPassword2 />;
    case "forget-password3":
      return <ForgetPassword3 />;
    default:
      return null;
  }
};

export default AdminAuthScreens;
