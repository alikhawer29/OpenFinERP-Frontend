import { Navigate, Route, Routes } from 'react-router-dom';

import AdminLogin from './Auth/AdminLogin';
import ForgetPassword from './Auth/ForgetPassword';
import ForgetPassword2 from './Auth/ForgetPassword2';
import ForgetPassword3 from './Auth/ForgetPassword3';
import Dashboard from './Dashboard';
import Notifications from './Notifications/Notifications';
import AdminSubscriptionLogs from './SubscriptionLogs/AdminSubscriptionLogs';
import EditSubscription from './SubscriptionManagement/EditSubscription';
import NewSubscription from './SubscriptionManagement/NewSubscription';
import SubscriptionManagement from './SubscriptionManagement/SubscriptionManagement';
import SubscriptionRequestDetails from './SubscriptionManagement/SubscriptionRequestDetails';
import SubscriptionRequests from './SubscriptionManagement/SubscriptionRequests';
import SupportLogDetails from './SupportLogs/SupportLogDetails';
import SupportLogs from './SupportLogs/SupportLogs';
import SupportTypeManagement from './SupportTypeManagement/SupportTypeManagement';
import UnlockRequestDetails from './UnlockRequestManagement/UnlockRequestDetails';
import UnlockRequestManagement from './UnlockRequestManagement/UnlockRequestManagement';
import UserDetails from './UserManagement/UserDetails';
import UserManagement from './UserManagement/UserManagement';
import DocumentRegister from '../Admin/DocumentRegister/DocumentRegister';
import NewDocumentRegister from '../Admin/DocumentRegister/NewDocumentRegister';
import DocumentRegisterDetails from '../Admin/DocumentRegister/DocumentRegisterDetails';
import EditDocumentRegister from '../Admin/DocumentRegister/EditDocumentRegister';
import NewRequest from './SupportLogs/NewRequest';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="client-management" element={<UserManagement />} />
      <Route path="client-management/:id" element={<UserDetails />} />
       <Route path="document-register" element={<DocumentRegister />} />
      <Route path="document-register/new" element={<NewDocumentRegister />} />
      <Route path="document-register/:id" element={<DocumentRegisterDetails />} />
      <Route path="document-register/:id/edit" element={<EditDocumentRegister />} />
      <Route path="unlock-req-management" element={<UnlockRequestManagement />} />
      <Route path="unlock-req-management/:id" element={<UnlockRequestDetails />} />
      <Route path="subscription-management" element={<SubscriptionManagement />} />
      <Route path="subscription-management/new" element={<NewSubscription />} />
      <Route path="subscription-management/requests" element={<SubscriptionRequests />} />
      <Route path="subscription-management/requests/:id" element={<SubscriptionRequestDetails />} />
      <Route path="subscription-management/requests/:id/new" element={<NewSubscription />} />
      <Route path="subscription-management/:id/edit" element={<EditSubscription />} />
      <Route path="subscription-logs" element={<AdminSubscriptionLogs />} />
      <Route path="support-type-management" element={<SupportTypeManagement />} />
      <Route path="support-logs" element={<SupportLogs />} />
      <Route path="support-logs/:id" element={<SupportLogDetails />} />
      <Route path="support-logs/new-request" element={<NewRequest />} />
      <Route path="*" element={<Navigate to="/admin/dashboard" />} />
    </Routes>
  );
};

export default AdminRoutes;

export {
  AdminLogin,
  AdminSubscriptionLogs,
  Dashboard,
  EditSubscription,
  ForgetPassword,
  ForgetPassword2,
  ForgetPassword3,
  NewSubscription,
  Notifications,
  SubscriptionManagement,
  SubscriptionRequestDetails,
  SubscriptionRequests,
  SupportLogDetails,
  SupportLogs,
  SupportTypeManagement,
  UnlockRequestDetails,
  UnlockRequestManagement,
  UserDetails,
  UserManagement,
  NewRequest,
};
