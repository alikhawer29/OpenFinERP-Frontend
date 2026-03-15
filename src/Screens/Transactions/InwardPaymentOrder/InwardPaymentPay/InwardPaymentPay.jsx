import { useState, useEffect } from 'react';
import { Col, Row } from 'react-bootstrap';
import { useParams, useLocation } from 'react-router-dom';
import BackButton from '../../../../Components/BackButton';
import BeneficiaryRegisterForm from '../../../../Components/BeneficiaryRegisterForm/BeneficiaryRegisterForm';
import ChartOfAccountForm from '../../../../Components/ChartOfAccountForm/ChartOfAccountForm';
import CustomModal from '../../../../Components/CustomModal';
import PartyLedgerForm from '../../../../Components/PartyLedgerForm/PartyLedgerForm';
import WalkInCustomerForm from '../../../../Components/WalkInCustomerForm/WalkInCustomerForm';
import { usePageTitle } from '../../../../Hooks/usePageTitle';
import useModulePermissions from '../../../../Hooks/useModulePermissions';
import useSettingsStore from '../../../../Stores/SettingsStore';
import '../../transactionStyles.css';
import NewInwardPaymentPay from './NewInwardPaymentPay';
import ViewInwardPaymentPay from './ViewInwardPaymentPay';

const InwardPaymentPay = () => {
  const location = useLocation();
  const isViewMode = location.pathname.includes('/view/');
  const { cancelledPaymentData } = location.state || {};
  usePageTitle(isViewMode ? 'Inward Payment' : 'Inward Payment Pay');
  const { id } = useParams();

  const [pageState, setPageState] = useState('new');
  const [showAddLedgerModal, setShowAddLedgerModal] = useState('');
  const [newlyCreatedAccount, setNewlyCreatedAccount] = useState(null);
  const [uploadAttachmentsModal, setUploadAttachmentsModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState({});

  // Permissions
  const permissions = useModulePermissions('transactions', 'inward_payment');
  const { pay: hasPayPermission, print: hasPrintPermission, delete: hasDeletePermission } = permissions || {};

  // For print settings
  const { updatePrintSetting } = useSettingsStore();

  const renderAddLedgerForm = () => {
    switch (showAddLedgerModal) {
      case 'add new pl':
        return (
          <PartyLedgerForm
            inPopup
            onSuccess={(newlyCreatedAccount) => {
              setNewlyCreatedAccount(newlyCreatedAccount);
              setShowAddLedgerModal('');
            }}
            onCancel={() => setShowAddLedgerModal('')}
          />
        );
      case 'add new wic':
        return (
          <WalkInCustomerForm
            inPopup
            onSuccess={(newlyCreatedAccount) => {
              setNewlyCreatedAccount(newlyCreatedAccount);
              setShowAddLedgerModal('');
            }}
            onCancel={() => setShowAddLedgerModal('')}
          />
        );
      case 'add new gl':
        return (
          <ChartOfAccountForm
            inPopup
            onSuccess={(newlyCreatedAccount) => {
              setNewlyCreatedAccount(newlyCreatedAccount);
              setShowAddLedgerModal('');
            }}
            onCancel={() => setShowAddLedgerModal('')}
          />
        );
      case 'add new beneficiary':
        return (
          <BeneficiaryRegisterForm
            inPopup
            onSuccess={(newlyCreatedAccount) => {
              setNewlyCreatedAccount(newlyCreatedAccount);
              setShowAddLedgerModal('');
            }}
            onCancel={() => setShowAddLedgerModal('')}
          />
        );
      default:
        break;
    }
  };

  const [searchTerm, setSearchTerm] = useState(id || '');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [writeTerm, setWriteTerm] = useState('');
  const [lastVoucherNumbers, setLastVoucherNumbers] = useState({});

  // Update searchTerm when id parameter changes
  useEffect(() => {
    if (id && isViewMode) {
      setSearchTerm(id);
    }
  }, [id, isViewMode]);

  return (
    <>
      <section className="position-relative">
        <div
          style={{ height: 43 }}
          className="d-flex gap-3 justify-content-between align-items-center flex-wrap mb-4"
        >
          <div>
            {(pageState == 'listing' || pageState == 'view' || isViewMode) && (
              <BackButton
                handleBack={() => {
                  if (isViewMode) {
                    window.history.back();
                  } else {
                    setPageState('new');
                  }
                }}
              />
            )}
            <h2 className="screen-title mb-0">
              {isViewMode ? 'Inward Payment' : 'Inward Payment'}
            </h2>
          </div>
        </div>
        <Row>
          <Col xs={12}>
            {isViewMode ? (
              <ViewInwardPaymentPay
                searchTerm={searchTerm}
                setDate={setDate}
                setWriteTerm={setWriteTerm}
                setSearchTerm={setSearchTerm}
                setPageState={setPageState}
                lastVoucherNumbers={lastVoucherNumbers}
                cancelledPaymentData={cancelledPaymentData}
                permissions={permissions}
                hasDeletePermission={hasDeletePermission}
                hasPrintPermission={hasPrintPermission}
              />
            ) : (
              <NewInwardPaymentPay
                setShowAddLedgerModal={setShowAddLedgerModal}
                newlyCreatedAccount={newlyCreatedAccount}
                uploadAttachmentsModal={uploadAttachmentsModal}
                setUploadAttachmentsModal={setUploadAttachmentsModal}
                selectedFiles={selectedFiles}
                setSelectedFiles={setSelectedFiles}
                updatePrintSetting={updatePrintSetting}
                hasPayPermission={hasPayPermission}
                hasPrintPermission={hasPrintPermission}
              />
            )}
          </Col>
        </Row>
      </section>

      {/* Add New Ledger Modal */}
      {!isViewMode && (
        <CustomModal
          show={!!showAddLedgerModal}
          close={() => setShowAddLedgerModal('')}
          size="xl"
          style={{ minHeight: '812px' }}
        >
          {renderAddLedgerForm()}
        </CustomModal>
      )}
    </>
  );
};

export default InwardPaymentPay;
