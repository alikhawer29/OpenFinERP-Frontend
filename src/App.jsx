import { lazy, Suspense, useEffect, useState } from 'react';
import 'react-phone-number-input/style.css';
import { Navigate, Route, Routes } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import SkeletonLoader from './Components/SkeletonLoader/SkeletonLoader';
import Toast, { showToast } from './Components/Toast/Toast';
import AppLayout from './Layout/AppLayout';
import ReportsLayout from './Layout/ReportsLayout';
import PublicRoutes from './Router/PublicRoutes';
import useUserStore from './Stores/UserStore';

// Freelance work: move all these imports to their respective files -> Lazy load module wise
import CustomModal from './Components/CustomModal';
import GenerateAccountEnquiry from './Screens/Reports/AccountReports/AccountEnquiry/GenerateAccountEnquiry';
import GeneratedAccountEnquiry from './Screens/Reports/AccountReports/AccountEnquiry/GeneratedAccountEnquiry';
import GenerateAccountTurnOverReport from './Screens/Reports/AccountReports/GenerateAccountTurnOverReport';
import GeneratedAccountTurnOverReport from './Screens/Reports/AccountReports/GeneratedAccountTurnOverReport';
import GenerateExpenseJournal from './Screens/Reports/AccountReports/ExpenseJournal/GenerateExpenseJournal';
import GeneratedExpenseJournal from './Screens/Reports/AccountReports/ExpenseJournal/GeneratedExpenseJournal';
import GenerateJournalReport from './Screens/Reports/AccountReports/JournalReport/GenerateJournalReport';
import GeneratedJounralReport from './Screens/Reports/AccountReports/JournalReport/GeneratedJounralReport';
import GenerateOutstandingBalance from './Screens/Reports/AccountReports/OutstandingBalance/GenerateOutstandingBalance';
import GeneratedOutstandingBalance from './Screens/Reports/AccountReports/OutstandingBalance/GeneratedOutstandingBalance';
import GeneratedPostDatedChequeReport from './Screens/Reports/AccountReports/PostDatedChequeReport/GeneratedPostDatedChequeReport';
import GenerateStatementOfAccounts from './Screens/Reports/AccountReports/StatementOfAccounts/GenerateStatementOfAccounts';
import GeneratedStatemenOfAccount from './Screens/Reports/AccountReports/StatementOfAccounts/GeneratedStatemenOfAccount';
import GeneratedWalkInCustomerOutstandingBalance from './Screens/Reports/AccountReports/WalkInCustomerOutstandingBalance/GeneratedWalkInCustomerOutstandingBalance';
import GenerateWalkInCustomerOutstandingBalance from './Screens/Reports/AccountReports/WalkInCustomerOutstandingBalance/GenerateWalkInCustomerOutstandingBalance';
import GenerateWalkInCustomerStatement from './Screens/Reports/AccountReports/WalkInCustomerStatement/GenerateWalkInCustomerStatement';
import GeneratedWalkInCustomerStatement from './Screens/Reports/AccountReports/WalkInCustomerStatement/GeneratedWalkInCustomerStatement';
import WalkInCustomerAccountJournal from './Screens/Reports/AccountReports/WalkInCustomerStatement/WalkInCustomerAccountJournal';
import BudgetingReport from './Screens/Reports/BudgetingReport/BudgetingReport';
import GeneratedBudgetingReport from './Screens/Reports/BudgetingReport/GeneratedBudgetingReport';
import GenerateProfitAndLossStatement from './Screens/Reports/FinancialReports/GenerateProfitAndLossStatement';
import GeneratedProfitAndLossStatement from './Screens/Reports/FinancialReports/GeneratedProfitAndLossStatement';

import CashAndBankBalance from './Screens/Reports/FinancialReports/CashAndBankBalance';
import GenerateBalanceSheet from './Screens/Reports/FinancialReports/GenerateBalanceSheet';
import GeneratedBalanceSheet from './Screens/Reports/FinancialReports/GeneratedBalanceSheet';
import ExchangeProfitLossReport from './Screens/Reports/FinancialReports/ExchangeProfitLossReport/ExchangeProfitLossReport';
import GeneratedExchangeProfitLossReport from './Screens/Reports/FinancialReports/ExchangeProfitLossReport/GeneratedExchangeProfitLossReport';
import DailyTransactionSummary from './Screens/Reports/FinancialReports/ExchangeProfitLossReport/DailyTransactionSummary';
import GenerateTrialBalance from './Screens/Reports/FinancialReports/GenerateTrialBalance';
import GeneratedTrialBalance from './Screens/Reports/FinancialReports/GeneratedTrialBalance';

import GenerateCurrencyTransferRegisterReport from './Screens/Reports/RemittanceReports/CurrencyTransferRegisterReport/GenerateCurrencyTransferRegisterReport';
import GeneratedCurrencyTransferRegisterReport from './Screens/Reports/RemittanceReports/CurrencyTransferRegisterReport/GeneratedCurrencyTransferRegisterReport';
import GenerateDealRegisterReport from './Screens/Reports/RemittanceReports/GenerateDealRegisterReport';
import GeneratedDealRegisterReport from './Screens/Reports/RemittanceReports/GeneratedDealRegisterReport';
import InwardRemittanceReport from './Screens/Reports/RemittanceReports/GenerateInwardRemittanceReport';
import GeneratedInwardRemittanceReport from './Screens/Reports/RemittanceReports/GeneratedInwardRemittanceReport';
import GenerateOutwardRemittanceEnquiry from './Screens/Reports/RemittanceReports/GenerateOutwardRemittanceEnquiry';
import GeneratedOutwardRemittanceEnquiry from './Screens/Reports/RemittanceReports/GeneratedOutwardRemittanceEnquiry';

import GenerateOutwardRemittanceReport from './Screens/Reports/RemittanceReports/OutwardRemittanceReport/GenerateOutwardRemittanceReport';
import GeneratedOutwardRemittanceReport from './Screens/Reports/RemittanceReports/OutwardRemittanceReport/GeneratedOutwardRemittanceReport';
import VATTaxReport from './Screens/Reports/TaxReports/VATReportOutput/VATReportOutput';
import SubscriptionLogs from './Screens/SubscriptionLogs/SubscriptionLogs';
import { copyPreviousRates } from './Services/Transaction/RemittanceRate';
import BudgetingReportGraph from './Screens/Reports/BudgetingReport/BudgetingReportGraph';
import VATSummaryReport from './Screens/Reports/TaxReports/VATSummaryReport/VATSummaryReport';
import VATReport from './Screens/Reports/TaxReports/VATReport/VATReport';
import VATReportOutput from './Screens/Reports/TaxReports/VATReportOutput/VATReportOutput';
import VATReportInput from './Screens/Reports/TaxReports/VATReportInput/VATReportInput';
import VATReportExpense from './Screens/Reports/TaxReports/VATReportExpense/VATReportExpense';
import GeneratePostDatedChequeReport from './Screens/Reports/AccountReports/PostDatedChequeReport/GeneratePostDatedChequeReport';

// User auth components
const UserAuthScreens = lazy(() => import('./Screens/Auth/index'));

// Admin auth components loaded together as a group
const AdminAuthScreens = lazy(() => import('./Screens/Admin/Auth/index'));

// Admin screens should be loaded separately from admin auth screens
const AdminScreens = lazy(() => import('./Screens/Admin/index'));

// Grouped lazy loaded Modules
const ProcessScreens = lazy(() => import('./Screens/Process/index'));
const TransactionScreens = lazy(() => import('./Screens/Transactions/index'));
const AdministrationScreens = lazy(() => import('./Screens/Administration/index'));
const MasterScreens = lazy(() => import('./Screens/Master/index'));

// Other individual components
const NewBranchManagement = lazy(() => import('./Screens/Administration/BranchManagement/NewBranchManagement'));
const Dashboard = lazy(() => import('./Screens/Dashboard/Dashboard'));
const Payment = lazy(() => import('./Screens/Payment/Payment'));
const AdminProfile = lazy(() => import('./Screens/Profile/AdminProfile'));
const Profile = lazy(() => import('./Screens/Profile/Profile'));
const ChangeSubscription = lazy(() => import('./Screens/SubscriptionLogs/ChangeSubscription'));
const Notifications = lazy(() => import('./Screens/Admin/Notifications/Notifications'));
const Support = lazy(() => import('./Screens/Support/Support'));
const Preferences = lazy(() => import('./Screens/Theme/Preferences'));

const AuthenticatedLayout = () => {
  const { user, role = 'guest' } = useUserStore();
  const isAuthenticated = !!user;
  const subscriptionAccess = user?.has_subscription_full_access ?? (role === 'admin' ? 'full_access' : 'no_access');
  const hasSubscriptionAccess = ['full_access', 'restricted_access'].includes(subscriptionAccess);
  const completeProfile = user?.complete_profile ?? false;
  const selectedBranch = user?.selected_branch ?? false;

  const isSubscribed = hasSubscriptionAccess;
  const userActionRequired = role !== 'admin' ? !isSubscribed || !completeProfile || !selectedBranch : false;

  const getRedirectPath = () => {
    if (role !== 'admin') {
      if (!hasSubscriptionAccess) return '/buy-subscription';
      if (!completeProfile) return '/complete-profile';
      if (!selectedBranch) return '/administration/branch-selection';
    }
    return null;
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout
      disableSidebar={userActionRequired}
      redirectPath={getRedirectPath()}
    />
  );
};

function App() {
  const { user, role = 'guest' } = useUserStore();
  const subscriptionAccess = user?.has_subscription_full_access ?? (role === 'admin' ? 'full_access' : 'no_access');
  const hasSubscriptionAccess = ['full_access', 'restricted_access'].includes(subscriptionAccess);
  const isAuthenticated = !!user; // Checks if user is logged in
  // remember last known role while authenticated so we can redirect correctly after logout
  const [lastRole, setLastRole] = useState(role);
  const isSubscribed = hasSubscriptionAccess;
  const completeProfile = user?.complete_profile ?? false;
  const selectedBranch = user?.selected_branch ?? false;
  const haveTodayRates = user?.have_today_rates ?? true;
  // State for the today rates modal
  const [showTodayRatesModal, setShowTodayRatesModal] = useState(false);

  // Determine if user action is required
  let userActionRequired = role !== 'admin' ? !isSubscribed || !completeProfile || !selectedBranch : false;
  if (role != 'admin') {
    userActionRequired = !isSubscribed || !completeProfile || !selectedBranch;
  } else {
    userActionRequired = false;
  }
  // Prevent scrolling when inputting numbers
  useEffect(() => {
    const handleWheel = (e) => {
      if (document.activeElement.type === 'number' && document.activeElement === e.target) {
        e.preventDefault();
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // Function to get the redirect path based on the status of the user
  const getRedirectPath = () => {
    if (role != 'admin') {
      // If user is business or employee check if he has met the following conditions only then let them go to other routes
      if (!hasSubscriptionAccess) return '/buy-subscription';
      if (!completeProfile) return '/complete-profile';
      if (!selectedBranch) return '/administration/branch-selection';
    }
    return null;
  };

  // Effect to show modal when user doesn't have today's rates
  useEffect(() => {
    if (isAuthenticated && !haveTodayRates && !userActionRequired) {
      const timer = setTimeout(() => {
        setShowTodayRatesModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, haveTodayRates, userActionRequired]);

  // Track last role while authenticated so redirect logic on logout can still use it
  useEffect(() => {
    if (isAuthenticated && role) setLastRole(role);
  }, [isAuthenticated, role]);

  // return <SkeletonLoader />;

  const handleRateUpdate = async (decision) => {
    try {
      const data = await copyPreviousRates(decision);
      if (decision === 'yes') {
        // update have_today_rates to true
        const updatedUser = { ...user, have_today_rates: 'yes' };
        useUserStore.getState().setUser(updatedUser);
        showToast('Rates updated successfully!', 'success');
      } else {
        const updatedUser = { ...user, have_today_rates: 'no' };
        useUserStore.getState().setUser(updatedUser);
        showToast('Rates update skipped for today.', 'info');
      }

      return data;
    } catch (error) {
      showToast(error.message || 'Failed to process request', 'error');
      throw error;
    }
  };

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route
          element={
            <Suspense fallback={<SkeletonLoader />}>
              <PublicRoutes
                isAuthenticated={isAuthenticated}
                redirectTo={isAuthenticated ? (role === 'admin' ? '/admin' : '/dashboard') : lastRole === 'admin' ? '/admin/login' : '/login'}
              />
            </Suspense>
          }
        >
          {/* User auth routes - loaded together */}
          <Route path="login" element={<UserAuthScreens screen="login" />} />
          <Route path="forget-id" element={<UserAuthScreens screen="forget-id" />} />
          <Route path="forget-id2" element={<UserAuthScreens screen="forget-id2" />} />
          <Route path="forget-password" element={<UserAuthScreens screen="forget-password" />} />
          <Route path="forget-password2" element={<UserAuthScreens screen="forget-password2" />} />
          <Route path="forget-password3" element={<UserAuthScreens screen="forget-password3" />} />
          <Route path="signup" element={<UserAuthScreens screen="signup" />} />

          {/* Admin auth routes - loaded together */}
          <Route path="admin/login" element={<AdminAuthScreens screen="login" />} />
          <Route path="admin/forget-password" element={<AdminAuthScreens screen="forget-password" />} />
          <Route path="admin/forget-password2" element={<AdminAuthScreens screen="forget-password2" />} />
          <Route path="admin/forget-password3" element={<AdminAuthScreens screen="forget-password3" />} />
        </Route>

        {/* Authenticated Routes */}
        <Route element={<AuthenticatedLayout />}>
          <Route path="complete-profile" element={<NewBranchManagement />} />
          <Route path="buy-subscription" element={<ChangeSubscription firstTimeLanding={true} />} />

          {/* Common Routes for logged in users irrespective of role */}
          <Route path="preferences" element={<Preferences />} />
          <Route path="profile" element={<Profile />} />
          <Route path="admin/profile" element={<AdminProfile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="payment" element={<Payment />} />

          {/* Business Routes */}
          {(role === 'user' || role === 'employee') && (
            <>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="subscription-logs" element={<SubscriptionLogs />} />

              {/* Master Routes */}
              <Route path="masters/*" element={<MasterScreens />} />

              {/* Administration Routes */}
              <Route path="administration/*" element={<AdministrationScreens />} />

              {/* Process Routes */}
              <Route path="process/*" element={<ProcessScreens />} />

              {/* Transaction Routes */}
              <Route path="transactions/*" element={<TransactionScreens />} />

              {/* Reports Routes */}
              <Route path="reports" element={<ReportsLayout />}>
                {/* Account Reports */}
                <Route path="statement-of-accounts" element={<GenerateStatementOfAccounts />} />
                <Route path="statement-of-accounts/generated" element={<GeneratedStatemenOfAccount />} />
                <Route path="outstanding-balance-report" element={<GenerateOutstandingBalance />} />
                <Route path="outstanding-balance-report/generated" element={<GeneratedOutstandingBalance />} />
                <Route path="journal-report" element={<GenerateJournalReport />} />
                <Route path="journal-report/generated" element={<GeneratedJounralReport />} />
                <Route path="walk-in-customer-statement" element={<GenerateWalkInCustomerStatement />} />
                <Route path="walk-in-customer-statement/generated" element={<GeneratedWalkInCustomerStatement />} />
                <Route path="walk-in-customer-statement/generated/account-journal" element={<WalkInCustomerAccountJournal />} />
                <Route path="walk-in-customer-outstanding-balance-report" element={<GenerateWalkInCustomerOutstandingBalance />} />
                <Route path="walk-in-customer-outstanding-balance-report/generated" element={<GeneratedWalkInCustomerOutstandingBalance />} />
                <Route path="expense-journal-report" element={<GenerateExpenseJournal />} />
                <Route path="expense-journal-report/generated" element={<GeneratedExpenseJournal />} />
                <Route path="post-dated-cheque-report" element={<GeneratePostDatedChequeReport />} />
                <Route path="post-dated-cheque-report/generated" element={<GeneratedPostDatedChequeReport />} />
                <Route path="account-enquiry" element={<GenerateAccountEnquiry />} />
                <Route path="account-enquiry/generated" element={<GeneratedAccountEnquiry />} />
                <Route path="account-turnover-report" element={<GenerateAccountTurnOverReport />} />
                <Route path="account-turnover-report/generated" element={<GeneratedAccountTurnOverReport />} />
                {/* Account Reports End */}

                {/* Tax Reports */}
                <Route path="vat-report" element={<VATReport />} />
                <Route path="vat-report/summary" element={<VATSummaryReport />} />
                <Route path="vat-report/output" element={<VATReportOutput />} />
                <Route path="vat-report/input" element={<VATReportInput />} />
                <Route path="vat-report/expense" element={<VATReportExpense />} />
                {/* Tax Reports End */}

                {/* Remittance Reports */}
                <Route path="inward-remittance-report" element={<InwardRemittanceReport />} />
                <Route path="inward-remittance-report/generated" element={<GeneratedInwardRemittanceReport />} />
                <Route path="outward-remittance-report" element={<GenerateOutwardRemittanceReport />} />
                <Route path="outward-remittance-report/generated" element={<GeneratedOutwardRemittanceReport />} />
                <Route path="currency-transfer-register-report/generated" element={<GeneratedCurrencyTransferRegisterReport />} />
                <Route path="currency-transfer-register-report" element={<GenerateCurrencyTransferRegisterReport />} />
                <Route path="deal-register-report" element={<GenerateDealRegisterReport />} />
                <Route path="deal-register-report/generated" element={<GeneratedDealRegisterReport />} />
                <Route path="outward-remittance-enquiry" element={<GenerateOutwardRemittanceEnquiry />} />
                <Route path="outward-remittance-enquiry/generated" element={<GeneratedOutwardRemittanceEnquiry />} />
                {/* Remittance Reports End */}

                {/* Financial Reports */}
                <Route path="profit-and-loss-statement" element={<GenerateProfitAndLossStatement />} />
                <Route path="profit-and-loss-statement/generated" element={<GeneratedProfitAndLossStatement />} />
                <Route path="balance-sheet" element={<GenerateBalanceSheet />} />
                <Route path="balance-sheet/generated" element={<GeneratedBalanceSheet />} />
                <Route path="trial-balance" element={<GenerateTrialBalance />} />
                <Route path="trial-balance/generated" element={<GeneratedTrialBalance />} />
                <Route path="exchange-profit-loss-report" element={<ExchangeProfitLossReport />} />
                <Route path="exchange-profit-loss-report/generated" element={<GeneratedExchangeProfitLossReport />} />
                <Route path="exchange-profit-loss-report/daily-transaction-summary" element={<DailyTransactionSummary />} />
                <Route path="cash-bank-balance-position" element={<CashAndBankBalance />} />
                {/* Financial Reports End */}

                {/* Budgeting & Forecasting Report */}
                <Route path="budgeting-report" element={<BudgetingReport />} />
                <Route path="budgeting-report/generated" element={<GeneratedBudgetingReport />} />
                <Route path="budgeting-report/graph" element={<BudgetingReportGraph />} />
                {/* Budgeting & Forecasting Report End */}

                <Route path="*" element={<h1>404</h1>} />
              </Route>

              <Route path="support" element={<Support />} />
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </>
          )}

          {/* Admin Routes - use the grouped component for admin routes */}
          {role === 'admin' && (
            <>
              <Route path="admin/*" element={<AdminScreens />} />
              <Route path="/" element={<Navigate to="/admin/dashboard" />} />
            </>
          )}
          <Route path="/" element={<Navigate to={'dashboard'} />} />
        </Route>

        {/* Optional: Catch all for 404 */}
        <Route
          path="*"
          element={
            isAuthenticated ? (
              role === 'admin' ? (
                <Navigate to="/admin" />
              ) : (
                <Navigate to="/dashboard" />
              )
            ) : lastRole === 'admin' ? (
              <Navigate to="/admin/login" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>

      {/* Today Rates Modal */}
      <CustomModal
        show={showTodayRatesModal}
        close={() => {
          setShowTodayRatesModal(false);
          // Optionally handle "no" on close
          handleRateUpdate('no');
        }}
        title="Today's Exchange Rates Missing"
        description="Do you want to carry forward previous day's rates?"
        variant="rates"
        btn1Text="Yes"
        btn2Text="No"
        action={() => handleRateUpdate('yes').then(() => setShowTodayRatesModal(false))}
        onBtn2Click={() => handleRateUpdate('no').then(() => setShowTodayRatesModal(false))}
        closeOnOutsideClick={false}
      />

      <Toast />
    </>
  );
}

export default App;
