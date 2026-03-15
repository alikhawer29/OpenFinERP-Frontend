import { Route, Routes } from 'react-router-dom';

import BeneficiaryRegister from './BeneficiaryRegister/BeneficiaryRegister';
import BeneficiaryRegisterDetails from './BeneficiaryRegister/BeneficiaryRegisterDetails';
import EditBeneficiaryRegister from './BeneficiaryRegister/EditBeneficiaryRegister';
import NewBeneficiaryRegister from './BeneficiaryRegister/NewBeneficiaryRegister';
import CBClassificationMaster from './CBClassificationMaster/CBClassificationMaster';
import ChartOfAccount from './ChartOfAccount/ChartOfAccount';
import ClassificationMaster from './ClassificationMaster/ClassificationMaster';
import ClassificationMasterDetail from './ClassificationMaster/ClassificationMasterDetail';
import CommissionMaster from './CommissionMaster/CommissionMaster';
import NewCommissionMaster from './CommissionMaster/NewCommissionMaster';
import CostCenterRegister from './CostCenterRegister/CostCenterRegister';
import EditCostCenterRegister from './CostCenterRegister/EditCostCenterRegister';
import NewCostCenterRegister from './CostCenterRegister/NewCostCenterRegister';
import CountryRegister from './CountryRegister/CountryRegister';
import CurrencyRegister from './CurrencyRegister/CurrencyRegister';
import CurrencyRegisterDetails from './CurrencyRegister/CurrencyRegisterDetails';
import EditCurrencyRegister from './CurrencyRegister/EditCurrencyRegister';
import NewCurrencyRegister from './CurrencyRegister/NewCurrencyRegister';
import DocumentRegister from './DocumentRegister/DocumentRegister';
import DocumentRegisterDetails from './DocumentRegister/DocumentRegisterDetails';
import EditDocumentRegister from './DocumentRegister/EditDocumentRegister';
import NewDocumentRegister from './DocumentRegister/NewDocumentRegister';
import GroupMaster from './GroupMaster/GroupMaster';
import GroupMasterDetails from './GroupMaster/GroupMasterDetails';
import OfficeLocationMaster from './OfficeLocationMaster/OfficeLocationMaster';
import EditPartyLedger from './PartyLedger/EditPartyLedger';
import NewPartyLedger from './PartyLedger/NewPartyLedger';
import PartyLedger from './PartyLedger/PartyLedger';
import PartyLedgerDetails from './PartyLedger/PartyLedgerDetails';
import SalesmanMaster from './SalesmanMaster/SalesmanMaster';
import EditTellerRegister from './TellerRegister/EditTellerRegister';
import NewTellerRegister from './TellerRegister/NewTellerRegister';
import TellerRegister from './TellerRegister/TellerRegister';
import EditWalkInCustomer from './WalkInCustomer/EditWalkInCustomer';
import NewWalkInCustomer from './WalkInCustomer/NewWalkInCustomer';
import WalkInCustomer from './WalkInCustomer/WalkInCustomer';
import WalkInCustomerDetails from './WalkInCustomer/WalkInCustomerDetails';
import WarehouseMaster from './WarehouseMaster/WarehouseMaster';
import EditCommissionMaster from './CommissionMaster/EditCommissionMaster';
import GroupClassification from './GroupClassification/GroupClassification';
import GroupClassificationDetails from './GroupClassification/GroupClassificationDetails';
import CreateGroupClassfification from './GroupClassification/CreateGroupClassification';

const MasterRoutes = () => {
  return (
    <Routes>
      <Route path="chart-of-accounts" element={<ChartOfAccount />} />
      <Route path="party-ledger" element={<PartyLedger />} />
      <Route path="party-ledger/new" element={<NewPartyLedger />} />
      <Route path="party-ledger/:id" element={<PartyLedgerDetails />} />
      <Route path="party-ledger/:id/edit" element={<EditPartyLedger />} />
      <Route path="walk-in-customer" element={<WalkInCustomer />} />
      <Route path="walk-in-customer/new" element={<NewWalkInCustomer />} />
      <Route path="walk-in-customer/:id" element={<WalkInCustomerDetails />} />
      <Route path="walk-in-customer/:id/edit" element={<EditWalkInCustomer />} />
      <Route path="teller-register" element={<TellerRegister />} />
      <Route path="teller-register/new" element={<NewTellerRegister />} />
      <Route path="teller-register/:id/edit" element={<EditTellerRegister />} />
      <Route path="warehouse-master" element={<WarehouseMaster />} />
      <Route path="CB-classification-master" element={<CBClassificationMaster />} />
      <Route path="classification-master" element={<ClassificationMaster />} />
      <Route path="classification-master/:id" element={<ClassificationMasterDetail />} />
      <Route path="beneficiary-register" element={<BeneficiaryRegister />} />
      <Route path="beneficiary-register/new" element={<NewBeneficiaryRegister />} />
      <Route path="beneficiary-register/:id" element={<BeneficiaryRegisterDetails />} />
      <Route path="beneficiary-register/:id/edit" element={<EditBeneficiaryRegister />} />
      <Route path="document-register" element={<DocumentRegister />} />
      <Route path="document-register/new" element={<NewDocumentRegister />} />
      <Route path="document-register/:id" element={<DocumentRegisterDetails />} />
      <Route path="document-register/:id/edit" element={<EditDocumentRegister />} />
      <Route path="salesman-register" element={<SalesmanMaster />} />
      <Route path="commission-master" element={<CommissionMaster />} />
      <Route path="commission-master/new" element={<NewCommissionMaster />} />
      <Route path="commission-master/:id/edit" element={<EditCommissionMaster />} />
      <Route path="currency-register" element={<CurrencyRegister />} />
      <Route path="country-register" element={<CountryRegister />} />
      <Route path="currency-register/new" element={<NewCurrencyRegister />} />
      <Route path="currency-register/:id/" element={<CurrencyRegisterDetails />} />
      <Route path="currency-register/:id/edit" element={<EditCurrencyRegister />} />
      <Route path="office-location-master" element={<OfficeLocationMaster />} />
      <Route path="group-master" element={<GroupMaster />} />
      <Route path="group-master/:id" element={<GroupMasterDetails />} />
      <Route path="cost-center-register" element={<CostCenterRegister />} />
      <Route path="cost-center-register/new" element={<NewCostCenterRegister />} />
      <Route path="cost-center-register/:id/edit" element={<EditCostCenterRegister />} />
      <Route path='group-classification' element={<GroupClassification/>} />
      <Route path='group-classification/:id' element={<GroupClassificationDetails/>} />
      <Route path='group-classification/create-group-classification' element={<CreateGroupClassfification/>} />
      <Route path="*" element={<h1>404</h1>} />
    </Routes>
  );
};

export default MasterRoutes;

export {
  BeneficiaryRegister,
  BeneficiaryRegisterDetails,
  CBClassificationMaster,
  ChartOfAccount,
  ClassificationMaster,
  ClassificationMasterDetail,
  CommissionMaster,
  CostCenterRegister,
  CountryRegister,
  CurrencyRegister,
  CurrencyRegisterDetails,
  DocumentRegister,
  DocumentRegisterDetails,
  EditBeneficiaryRegister,
  EditCommissionMaster,
  EditCostCenterRegister,
  EditCurrencyRegister,
  EditDocumentRegister,
  EditPartyLedger,
  EditTellerRegister,
  EditWalkInCustomer,
  GroupMaster,
  GroupMasterDetails,
  NewBeneficiaryRegister,
  NewCommissionMaster,
  NewCostCenterRegister,
  NewCurrencyRegister,
  NewDocumentRegister,
  NewPartyLedger,
  NewTellerRegister,
  NewWalkInCustomer,
  OfficeLocationMaster,
  PartyLedger,
  PartyLedgerDetails,
  SalesmanMaster,
  TellerRegister,
  WalkInCustomer,
  WalkInCustomerDetails,
  WarehouseMaster,
};
