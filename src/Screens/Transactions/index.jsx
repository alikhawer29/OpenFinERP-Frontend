import { Route, Routes } from 'react-router-dom';

import AccountToAccount from './AccountToAccount/AccountToAccount';
import BankTransactions from './BankTransactions/BankTransactions';
import CurrencyTransfer from './CurrencyTransfer/CurrencyTransfer';
import DealRegistry from './DealRegistry/DealRegistry';
import PositionSummary from './DealRegistry/PositionSummary';
import ForeignCurrencyDeal from './ForeignCurrencyDeal/ForeignCurrencyDeal';
import InternalPaymentVoucher from './InternalPaymentVoucher/InternalPaymentVoucher';
import InwardPayment from './InwardPaymentOrder/InwardPayment/InwardPayment';
import InwardPaymentCancellation from './InwardPaymentOrder/InwardPaymentCancellation/InwardPaymentCancellation';
import InwardPaymentOrder from './InwardPaymentOrder/InwardPaymentOrder';
import InwardPaymentPay from './InwardPaymentOrder/InwardPaymentPay/InwardPaymentPay';
import JournalVoucher from './JournalVoucher/JournalVoucher';
import ApplicationPrinting from './OutwardRemittance/ApplicationPrinting/ApplicationPrinting';
import OutwardRemittance from './OutwardRemittance/OutwardRemittance';
import OutwardRemittanceRegister from './OutwardRemittance/OutwardRemittanceRegister/OutwardRemittanceRegister';
import PaymentVoucher from './PaymentVoucher/PaymentVoucher';
import PdcrIssueAsPdcp from './PdcrIssueAsPdcp/PdcrIssueAsPdcp';
import RemittanceRateOfExchange from './RateOfExchange/RemittanceRateOfExchange';
import SpecialRateCurrency from './RateOfExchange/SpecialRateCurrency';
import ReceiptVoucher from './ReceiptVoucher/ReceiptVoucher';
import SpecialCommission from './SpecialCommission/SpecialCommission';
import SuspencePosting from './SuspencePosting/SuspencePosting';
import SuspenseVoucher from './SuspenseVoucher/SuspenseVoucher';
import TmnCurrencyDeal from './TmnCurrencyDeal/TmnCurrencyDeal';
import EditTTRConfirmation from './TTRRegister/Edit/EditTTRConfirmation';
import TTRRegisterEditBankDetails from './TTRRegister/Edit/TTRRegisterEditBankDetails';
import NewBankDetail from './TTRRegister/New/NewBankDetail';
import NewTTRConfirmation from './TTRRegister/New/NewTTRConfirmation';
import NewTTRRegisterAllocation from './TTRRegister/New/NewTTRRegisterAllocation';
import EditTTRRegisterAllocation from './TTRRegister/Edit/EditTTRRegisterAllocation';

import TTRRegister from './TTRRegister/TTRRegister';
import ViewTTRRegisterConfirmation from './TTRRegister/ViewTTRRegisterConfirmation';

const TransactionRoutes = () => {
  return (
    <Routes>
      <Route path="journal-voucher" element={<JournalVoucher />} />
      <Route path="receipt-voucher" element={<ReceiptVoucher />} />
      <Route
        path="remittance-rate-of-exchange"
        element={<RemittanceRateOfExchange />}
      />
      <Route path="special-rate-currency" element={<SpecialRateCurrency />} />

      {/* Account Transactions */}
      <Route path="payment-voucher" element={<PaymentVoucher />} />
      <Route
        path="internal-payment-voucher"
        element={<InternalPaymentVoucher />}
      />
      <Route path="bank-transactions" element={<BankTransactions />} />
      <Route path="account-to-account" element={<AccountToAccount />} />
      <Route path="pdcr-issue-as-pdcp" element={<PdcrIssueAsPdcp />} />
      <Route path="suspense-voucher" element={<SuspenseVoucher />} />
      <Route path="suspense-posting" element={<SuspencePosting />} />

      <Route path="position-summary" element={<PositionSummary />} />
      {/* Account Transactions End */}

      {/* Remittance Deals */}
      <Route path="foreign-currency-deal" element={<ForeignCurrencyDeal />} />
      <Route path="tmn-currency-deal" element={<TmnCurrencyDeal />} />
      <Route path="currency-transfer" element={<CurrencyTransfer />} />
      <Route path="deal-registry" element={<DealRegistry />} />
      <Route path="ttr-register" element={<TTRRegister />} />
      <Route path="ttr-register/bank-details/new" element={<NewBankDetail />} />
      <Route
        path="ttr-register/bank-details/:id/edit"
        element={<TTRRegisterEditBankDetails />}
      />
      <Route
        path="ttr-register/confirmation/new"
        element={<NewTTRConfirmation />}
      />
      <Route
        path="ttr-register/confirmation/edit"
        element={<EditTTRConfirmation />}
      />
      <Route
        path="ttr-register/confirmation/:id/view"
        element={<ViewTTRRegisterConfirmation />}
      />

      <Route
        path="ttr-register/allocation/:id/edit"
        element={<EditTTRRegisterAllocation />}
      />

      <Route
        path="ttr-register/allocation/new"
        element={<NewTTRRegisterAllocation />}
      />

      {/* Remittance Deals End */}

      {/* Outward Remittance */}
      <Route path="outward-remittance" element={<OutwardRemittance />} />
      <Route
        path="outward-remittance-register"
        element={<OutwardRemittanceRegister />}
      />
      <Route path="application-printing" element={<ApplicationPrinting />} />
      {/* Outward Remittance End */}

      {/* Inward Remittance */}
      <Route path="inward-payment-order" element={<InwardPaymentOrder />} />
      <Route
        path="inward-payment-cancellation"
        element={<InwardPaymentCancellation />}
      />
      <Route path="inward-payment" element={<InwardPayment />} />
      <Route path="inward-payment/pay/:id" element={<InwardPaymentPay />} />
      <Route path="inward-payment-pay/view/:id" element={<InwardPaymentPay />} />
      {/* Inward Remittance End */}

      <Route path="special-commission" element={<SpecialCommission />} />
      <Route path="*" element={<h1>404</h1>} />
    </Routes>
  );
};

export default TransactionRoutes;

export {
  AccountToAccount,
  ApplicationPrinting,
  BankTransactions,
  CurrencyTransfer,
  DealRegistry,
  EditTTRConfirmation,
  ForeignCurrencyDeal,
  InternalPaymentVoucher,
  InwardPayment,
  InwardPaymentCancellation,
  InwardPaymentOrder,
  InwardPaymentPay,
  JournalVoucher,
  NewBankDetail,
  NewTTRConfirmation,
  OutwardRemittance,
  OutwardRemittanceRegister,
  PaymentVoucher,
  PdcrIssueAsPdcp,
  PositionSummary,
  ReceiptVoucher,
  RemittanceRateOfExchange,
  SpecialCommission,
  SpecialRateCurrency,
  SuspencePosting,
  SuspenseVoucher,
  TmnCurrencyDeal,
  TTRRegister,
  TTRRegisterEditBankDetails,
  ViewTTRRegisterConfirmation,
};
