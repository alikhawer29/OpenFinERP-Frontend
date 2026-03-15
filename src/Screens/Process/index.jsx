import { Route, Routes } from 'react-router-dom';

import BalanceWriteOff from './BalanceWriteOff/BalanceWriteOff';
import PayableCancelled from './PDCProcessing/PayableCancelled';
import PayableOpen from './PDCProcessing/PayableOpen';
import PayableSettled from './PDCProcessing/PayableSettled';
import PDCProcess from './PDCProcessing/PDCProcess';
import ReceivableCancelled from './PDCProcessing/ReceivableCancelled';
import ReceivableCollection from './PDCProcessing/ReceivableCollection';
import ReceivableDiscountedCollection from './PDCProcessing/ReceivableDiscountedCollection';
import ReceivableOpen from './PDCProcessing/ReceivableOpen';
import ReceivableSettled from './PDCProcessing/ReceivableSettled';
import PDCRPaymentPosting from './PDCRPaymentPosting/PDCRPaymentPosting';
import PeriodicAccountsClosing from './PeriodicAccountsClosing/PeriodicAccountsClosing';
import UnlockAccountingPeriodRequest from './PeriodicAccountsClosing/UnlockAccountingPeriodRequest';
import ProfitAndLossPosting from './ProfitAndLossPosting/ProfitAndLossPosting';
import RateReValuation from './ProfitAndLossPosting/RateReValuation';
import TransactionApproval from './Transaction/TransactionApproval';
import TransactionLock from './Transaction/TransactionLock';
import BudgetSetup from './BudgetSetup/BudgetSetup';
import BudgetSetupNewAccounts from './BudgetSetup/BudgetSetupNewAccounts';
import BudgetSetupEntries from './BudgetSetup/BudgetSetupEntries';

const ProcessRoutes = () => {
  return (
    <Routes>
      <Route path="pdc-processing" element={<PDCProcess />} />
      <Route path="pdc-processing/:id/receivable/open" element={<ReceivableOpen />} />
      <Route path="pdc-processing/:id/receivable/settled" element={<ReceivableSettled />} />
      <Route path="pdc-processing/:id/receivable/collection" element={<ReceivableCollection />} />
      <Route path="pdc-processing/:id/receivable/discounted_collection" element={<ReceivableDiscountedCollection />} />
      <Route path="pdc-processing/:id/receivable/cancelled" element={<ReceivableCancelled />} />
      <Route path="pdc-processing/:id/payable/open" element={<PayableOpen />} />
      <Route path="pdc-processing/:id/payable/settled" element={<PayableSettled />} />
      <Route path="pdc-processing/:id/payable/cancelled" element={<PayableCancelled />} />
      <Route path="pdcr-payment-posting" element={<PDCRPaymentPosting />} />
      <Route path="periodic-accounts-closing" element={<PeriodicAccountsClosing />} />
      <Route path="periodic-accounts-closing/unlock-request" element={<UnlockAccountingPeriodRequest />} />
      <Route path="balance-write-off" element={<BalanceWriteOff />} />
      <Route path="transaction-lock" element={<TransactionLock />} />
      <Route path="transaction-approval" element={<TransactionApproval />} />
      <Route path="profit-loss-posting" element={<ProfitAndLossPosting />} />
      <Route path="profit-loss-posting/rate-revaluation" element={<RateReValuation />} />
      <Route path="budget-setup" element={<BudgetSetup />} />
      <Route path="budget-setup/new-account" element={<BudgetSetupNewAccounts />} />
      <Route path="budget-setup/edit/:id" element={<BudgetSetup />} />
      <Route path="budget-setup/new-account/edit/:id" element={<BudgetSetupNewAccounts />} />
      <Route path="entries" element={<BudgetSetupEntries/>} />
      <Route path="entries/edit/:id" element={<BudgetSetupEntries/>} />

      <Route path="*" element={<h1>404</h1>} />
    </Routes>
  );
};


export default ProcessRoutes;

export {
    BalanceWriteOff,
    PayableCancelled,
    PayableOpen,
    PayableSettled,
    PDCProcess,
    PDCRPaymentPosting,
    PeriodicAccountsClosing,
    ProfitAndLossPosting,
    RateReValuation,
    ReceivableCancelled,
    ReceivableCollection,
    ReceivableDiscountedCollection,
    ReceivableOpen,
    ReceivableSettled,
    TransactionApproval,
    TransactionLock,
    UnlockAccountingPeriodRequest,
    BudgetSetup,
    BudgetSetupNewAccounts,
    BudgetSetupEntries,
};

