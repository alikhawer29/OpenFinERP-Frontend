import { Route, Routes } from 'react-router-dom';

import BranchManagement from './BranchManagement/BranchManagement';
import BranchManagementDetails from './BranchManagement/BranchManagementDetails';
import EditBranchManagement from './BranchManagement/EditBranchManagement';
import NewBranchManagement from './BranchManagement/NewBranchManagement';
import BranchSelection from './BranchSelection/BranchSelection';
import ChequeRegister from './ChequeRegister/ChequeRegister';
import DealRegisterUpdation from './DealRegisterUpdation/DealRegisterUpdation';
import MaturityAlert from './MaturityAlert/MaturityAlert';
import PasswordReset from './PasswordReset/PasswordReset';
import SystemIntegrityCheck from './SystemIntegrityCheck/SystemIntegrityCheck';
import TransactionLogs from './TransactionLogs/TransactionLogs';
import TransactionNumberRegister from './TransactionNumberRegister/TransactionNumberRegister';
import UnlockRequestDetails from './UnlockRequestLogs/UnlockRequestDetails';
import UnlockRequestLogs from './UnlockRequestLogs/UnlockRequestLogs';
import EditUserMaintenance from './User Maintenance/EditUserMaintenance';
import NewUserMaintenance from './User Maintenance/NewUserMaintenance';
import UserMaintenance from './User Maintenance/UserMaintenance';
import UserMaintenanceDetails from './User Maintenance/UserMaintenanceDetails';
import UserLogs from './UserLogs/UserLogs';
import SubscriptionLogs from '../SubscriptionLogs/SubscriptionLogs';
import CustomSubscriptionRequest from '../SubscriptionLogs/CustomSubscriptionRequest';
import DownGradeAdjustment from '../SubscriptionLogs/DownGradeAdjustment';
import ChangeSubscription from '../SubscriptionLogs/ChangeSubscription';

const AdministrationRoutes = () => {
  return (
    <Routes>
      <Route path="user-maintenance" element={<UserMaintenance />} />
      <Route path="user-maintenance/new" element={<NewUserMaintenance />} />
      <Route path="user-maintenance/:id" element={<UserMaintenanceDetails />} />
      <Route path="user-maintenance/:id/edit" element={<EditUserMaintenance />} />
      <Route path="subscription-logs" element={<SubscriptionLogs />} />
      <Route path="subscription-logs/change" element={<ChangeSubscription />} />
      <Route path="subscription-logs/request" element={<CustomSubscriptionRequest />} />
      <Route path="subscription-logs/change/downgrade-adjustment" element={<DownGradeAdjustment />} />
      <Route path="password-reset" element={<PasswordReset />} />
      <Route path="branch-management" element={<BranchManagement />} />
      <Route path="branch-management/new" element={<NewBranchManagement />} />
      <Route path="branch-management/:id" element={<BranchManagementDetails />} />
      <Route path="branch-management/:id/edit" element={<EditBranchManagement />} />
      <Route path="branch-selection" element={<BranchSelection />} />
      <Route path="user-logs" element={<UserLogs />} />
      <Route path="unlock-request-logs" element={<UnlockRequestLogs />} />
      <Route path="unlock-request-logs/:id" element={<UnlockRequestDetails />} />
      <Route path="cheque-register" element={<ChequeRegister />} />
      <Route path="transaction-number-register" element={<TransactionNumberRegister />} />
      <Route path="transaction-logs" element={<TransactionLogs />} />
      <Route path="maturity-alert" element={<MaturityAlert />} />
      <Route path="system-integrity-check" element={<SystemIntegrityCheck />} />
      <Route path="deal-register-updation" element={<DealRegisterUpdation />} />
      <Route path="*" element={<h1>404</h1>} />
    </Routes>
  );
};

export default AdministrationRoutes;

export {
  BranchManagement,
  BranchManagementDetails,
  BranchSelection,
  ChequeRegister,
  DealRegisterUpdation,
  EditBranchManagement,
  EditUserMaintenance,
  MaturityAlert,
  NewBranchManagement,
  NewUserMaintenance,
  PasswordReset,
  SystemIntegrityCheck,
  TransactionLogs,
  TransactionNumberRegister,
  UnlockRequestDetails,
  UnlockRequestLogs,
  UserLogs,
  UserMaintenance,
  UserMaintenanceDetails,
};
