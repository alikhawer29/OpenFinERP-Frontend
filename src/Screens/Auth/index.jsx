import Login from './Login';
import ForgetId from './ForgetId';
import ForgetId2 from './ForgetId2';
import ForgetPassword from './ForgetPassword';
import ForgetPassword2 from './ForgetPassword2';
import ForgetPassword3 from './ForgetPassword3';
import Signup from './Signup/Signup';

const UserAuthScreens = ({ screen }) => {
  switch (screen) {
    case 'login':
      return <Login />;
    case 'forget-id':
      return <ForgetId />;
    case 'forget-id2':
      return <ForgetId2 />;
    case 'forget-password':
      return <ForgetPassword />;
    case 'forget-password2':
      return <ForgetPassword2 />;
    case 'forget-password3':
      return <ForgetPassword3 />;
    case 'signup':
      return <Signup />;
    default:
      return null;
  }
};

export default UserAuthScreens;
