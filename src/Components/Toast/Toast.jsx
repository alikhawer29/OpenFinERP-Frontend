import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Toast = () => {
  return <ToastContainer theme="dark" />;
};

export const showToast = (message, type) => {
  const fn = toast[type] || toast;
  fn(message);
};

export default Toast;
