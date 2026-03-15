import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { FaMagnifyingGlass } from 'react-icons/fa6';
import { useLocation, useNavigate } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import BeneficiaryRegisterForm from '../../../Components/BeneficiaryRegisterForm/BeneficiaryRegisterForm';
import ChartOfAccountForm from '../../../Components/ChartOfAccountForm/ChartOfAccountForm';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import PartyLedgerForm from '../../../Components/PartyLedgerForm/PartyLedgerForm';
import WalkInCustomerForm from '../../../Components/WalkInCustomerForm/WalkInCustomerForm';
import useAccountsByType from '../../../Hooks/useAccountsByType';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { getIPVoucherNumber } from '../../../Services/Transaction/InternalPaymentVoucher.js';
import { getAccountsbyType } from '../../../Services/Transaction/PaymentVoucher.js';
import { getCOAAccountsbyMode } from '../../../Services/Transaction/ReceiptVoucher';
import useSettingsStore from '../../../Stores/SettingsStore.js';
import useFormStore from '../../../Stores/FormStore.js';
import { getCurrencyOptions, showErrorToast } from '../../../Utils/Utils';
import '../transactionStyles.css';
import EditInternalPaymentVoucher from './EditInternalPaymentVoucher';
import InternalPaymentVouchersTable from './InternalPaymentVouchersTable';
import NewInternalPaymentVoucher from './NewInternalPaymentVoucher';
import ViewInternalPaymentVoucher from './ViewInternalPaymentVoucher';
import useModulePermissions from '../../../Hooks/useModulePermissions.js';
// Add a flag for restoring from store

const InternalPaymentVoucher = () => {
  usePageTitle('Internal Payment Voucher');
  const { state } = useLocation();
  const navigate = useNavigate();
  const { updatePrintSetting } = useSettingsStore();
  const {
    getFormValues,
    getLastVisitedPage,
    setLastVisitedPage,
    saveFormValues,
  } = useFormStore();
  const [pageState, setPageState] = useState(state?.pageState || 'new');
  const [isDisabled, setIsDisabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState(state?.searchTerm || '');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [showAddLedgerModal, setShowAddLedgerModal] = useState('');
  const [showMissingCurrencyRateModal, setShowMissingCurrencyRateModal] =
    useState(false);
  const [currencyToSelect, setCurrencyToSelect] = useState(null);
  const [newlyCreatedAccount, setNewlyCreatedAccount] = useState(null);
  const [uploadAttachmentsModal, setUploadAttachmentsModal] = useState(false);
  const [attachmentsModal, setAttachmentsModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState(null);
  const [writeTerm, setWriteTerm] = useState(state?.searchTerm || '');
  const currencyOptions = getCurrencyOptions();
  // Add a new state to hold form data for saving
  const [formData, setFormData] = useState({});
  const [restoreValuesFromStore, setRestoreValuesFromStore] = useState(false);
  const [lastVoucherNumbers, setLastVoucherNumbers] = useState({
    heading: 'Last IPV Number: ',
    current: '',
    previous: '',
    next: '',
    isLoadingVoucherNumber: false,
    isErrorVoucherNumber: false,
    errorVoucherNumber: null,
  });

  // Get last voucher number //
  const {
    data: voucherNumber,
    isLoading: isLoadingVoucherNumber,
    isError: isErrorVoucherNumber,
    error: errorVoucherNumber,
  } = useQuery({
    queryKey: ['voucherNumber', searchTerm],
    queryFn: () => getIPVoucherNumber(searchTerm),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const location = useLocation();
  const { transactionId } = location.state || {};

  // setting the write term
  useEffect(() => {
    if (transactionId) {
      setWriteTerm(transactionId);
      setSearchTerm(transactionId);
      setPageState('view');
    }
  }, []);

  useEffect(() => {
    setLastVoucherNumbers({
      heading: 'Last IPV Number: ',
      last: voucherNumber?.default_voucher_no,
      current: voucherNumber?.current_voucher_no,
      previous: voucherNumber?.previous_voucher_no,
      next: voucherNumber?.next_voucher_no,
      isLoadingVoucherNumber: isLoadingVoucherNumber,
      isErrorVoucherNumber: isErrorVoucherNumber,
      errorVoucherNumber: errorVoucherNumber,
    });
  }, [
    voucherNumber,
    isLoadingVoucherNumber,
    isErrorVoucherNumber,
    errorVoucherNumber,
  ]);

  // Get account options //
  const {
    data: partyAccounts,
    isLoading: isLoadingParty,
    isError: isErrorParty,
    error: errorParty,
  } = useQuery({
    queryKey: ['accounts', 'party'],
    queryFn: () => getAccountsbyType('party'),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: generalAccounts,
    isLoading: isLoadingGeneral,
    isError: isErrorGeneral,
    error: errorGeneral,
  } = useQuery({
    queryKey: ['accounts', 'general'],
    queryFn: () => getAccountsbyType('general'),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: walkinAccounts,
    isLoading: isLoadingWalkin,
    isError: isErrorWalkin,
    error: errorWalkin,
  } = useQuery({
    queryKey: ['accounts', 'walkin'],
    queryFn: () => getAccountsbyType('walkin'),
    staleTime: 1000 * 60 * 5,
  });

  const accountData = {
    party: {
      data: partyAccounts,
      loading: isLoadingParty,
      error: isErrorParty,
      errorMessage: errorParty,
    },
    general: {
      data: generalAccounts,
      loading: isLoadingGeneral,
      error: isErrorGeneral,
      errorMessage: errorGeneral,
    },
    walkin: {
      data: walkinAccounts,
      loading: isLoadingWalkin,
      error: isErrorWalkin,
      errorMessage: errorWalkin,
    },
  };

  // Get account options using custom hook //
  const { getAccountsByTypeOptions } = useAccountsByType();

  // COA ACCOUNTS (Mode)//
  const {
    data: coaCashAccounts,
    isLoading: isLoadingCoaCashAccounts,
    isError: isErrorCoaCashAccounts,
    error: errorCoaCashAccounts,
  } = useQuery({
    queryKey: ['coaAccounts', 'Cash'],
    queryFn: () => getCOAAccountsbyMode('Cash'),
    staleTime: 1000 * 60 * 5,
  });
  const {
    data: coaBankAccounts,
    isLoading: isLoadingCoaBankAccounts,
    isError: isErrorCoaBankAccounts,
    error: errorCoaBankAccounts,
  } = useQuery({
    queryKey: ['coaAccounts', 'Bank'],
    queryFn: () => getCOAAccountsbyMode('Bank'),
    staleTime: 1000 * 60 * 5,
  });
  const {
    data: coaPDCAccounts,
    isLoading: isLoadingCoaPDCAccounts,
    isError: isErrorCoaPDCAccounts,
    error: errorCoaPDCAccounts,
  } = useQuery({
    queryKey: ['coaAccounts', 'PDC'],
    queryFn: () => getCOAAccountsbyMode('PDC'),
    staleTime: 1000 * 60 * 5,
  });
  const {
    data: coaOnlineAccounts,
    isLoading: isLoadingCoaOnlineAccounts,
    isError: isErrorCoaOnlineAccounts,
    error: errorCoaOnlineAccounts,
  } = useQuery({
    queryKey: ['coaAccounts', 'Online'],
    queryFn: () => getCOAAccountsbyMode('Online'),
    staleTime: 1000 * 60 * 5,
  });

  const coaAccountsData = {
    Cash: {
      data: coaCashAccounts,
      loading: isLoadingCoaCashAccounts,
      error: isErrorCoaCashAccounts,
      errorMessage: errorCoaCashAccounts,
    },
    Bank: {
      data: coaBankAccounts,
      loading: isLoadingCoaBankAccounts,
      error: isErrorCoaBankAccounts,
      errorMessage: errorCoaBankAccounts,
    },
    PDC: {
      data: coaPDCAccounts,
      loading: isLoadingCoaPDCAccounts,
      error: isErrorCoaPDCAccounts,
      errorMessage: errorCoaPDCAccounts,
    },
    Online: {
      data: coaOnlineAccounts,
      loading: isLoadingCoaOnlineAccounts,
      error: isErrorCoaOnlineAccounts,
      errorMessage: errorCoaOnlineAccounts,
    },
  };

  const getCOAAccountsByModeOptions = (modeType) => {
    if (!modeType) {
      return [{ label: 'Select Mode', value: null, isDisabled: true }];
    }

    const { data, loading, error, errorMessage } =
      coaAccountsData[modeType] || {};

    if (loading) {
      return [{ label: 'Loading...', value: null, isDisabled: true }];
    }

    if (error) {
      showErrorToast(errorMessage);
      return [{ label: 'Unable to fetch Accounts', value: null }];
    }
    let options =
      data?.map((x) => ({
        value: x?.id,
        label: x?.account_name,
      })) || [];

    return options;
  };

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
  const permissions = useModulePermissions('transactions', 'internal_payment_voucher');
  const {
    edit: hasEditPermission,
    create: hasCreatePermission,
    delete: hasDeletePermission,
    print: hasPrintPermission,
    view: hasViewPermission,
  } = permissions || {};



  const renderPageContent = () => {
    const pageComponents = {
      new: (
        <NewInternalPaymentVoucher
          isDisabled={isDisabled}
          setIsDisabled={setIsDisabled}
          setSearchTerm={setSearchTerm}
          setWriteTerm={setWriteTerm}
          setPageState={setPageState}
          setShowAddLedgerModal={setShowAddLedgerModal}
          setCurrencyToSelect={setCurrencyToSelect}
          setShowMissingCurrencyRateModal={setShowMissingCurrencyRateModal}
          newlyCreatedAccount={newlyCreatedAccount}
          uploadAttachmentsModal={uploadAttachmentsModal}
          lastVoucherNumbers={lastVoucherNumbers}
          setUploadAttachmentsModal={setUploadAttachmentsModal}
          selectedFiles={selectedFiles}
          updatePrintSetting={updatePrintSetting}
          setSelectedFiles={setSelectedFiles}
          accountData={accountData}
          currencyOptions={currencyOptions}
          date={date}
          setDate={setDate}
          getAccountsByTypeOptions={getAccountsByTypeOptions}
          getCOAAccountsByModeOptions={getCOAAccountsByModeOptions}
          onFormDataChange={setFormData}
          restoreValuesFromStore={restoreValuesFromStore}
          permissions={permissions}
          hasCreatePermission={hasCreatePermission}
          hasPrintPermission={hasPrintPermission}
        />
      ),
      view: (
        <ViewInternalPaymentVoucher
          searchTerm={searchTerm}
          setDate={setDate}
          setSearchTerm={setSearchTerm}
          setWriteTerm={setWriteTerm}
          setPageState={setPageState}
          attachmentsModal={attachmentsModal}
          setAttachmentsModal={setAttachmentsModal}
          lastVoucherNumbers={lastVoucherNumbers}
          permissions={permissions}
          hasViewPermission={hasViewPermission}
          hasEditPermission={hasEditPermission}
          hasDeletePermission={hasDeletePermission}
          hasPrintPermission={hasPrintPermission}
        />
      ),
      listing: (
        <InternalPaymentVouchersTable
          setSearchTerm={setSearchTerm}
          setPageState={setPageState}
          date={date}
          permissions={permissions}
          hasViewPermission={hasViewPermission}
        />
      ),
      edit: (
        <EditInternalPaymentVoucher
          setPageState={setPageState}
          setShowAddLedgerModal={setShowAddLedgerModal}
          setCurrencyToSelect={setCurrencyToSelect}
          setShowMissingCurrencyRateModal={setShowMissingCurrencyRateModal}
          newlyCreatedAccount={newlyCreatedAccount}
          uploadAttachmentsModal={uploadAttachmentsModal}
          setUploadAttachmentsModal={setUploadAttachmentsModal}
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          restoreValuesFromStore={restoreValuesFromStore}
          accountData={accountData}
          currencyOptions={currencyOptions}
          date={date}
          setDate={setDate}
          lastVoucherNumbers={lastVoucherNumbers}
          isDisabled={false}
          setIsDisabled={setIsDisabled}
          updatePrintSetting={updatePrintSetting}
          getAccountsByTypeOptions={getAccountsByTypeOptions}
          getCOAAccountsByModeOptions={getCOAAccountsByModeOptions}
          permissions={permissions}
          hasEditPermission={hasEditPermission}
          hasDeletePermission={hasDeletePermission}
          hasPrintPermission={hasPrintPermission}
          onFormDataChange={setFormData}
        />
      ),
    };

    return pageComponents[pageState] || null;
  };

  // Handle navigation from Rate of Exchange page
  useEffect(() => {
    const lastPageNew = getLastVisitedPage('internal-payment-voucher');
    const lastPageEdit = getLastVisitedPage('edit-internal-payment-voucher');

    if (lastPageNew === 'rate-of-exchange') {
      const savedFormData = getFormValues('internal-payment-voucher');
      if (savedFormData) {
        if (savedFormData.date) {
          setDate(savedFormData.date);
        }
        // Set page state to new and enable the table
        setPageState('new');
        setIsDisabled(false);
        setRestoreValuesFromStore(true);
      }
    } else if (lastPageEdit === 'rate-of-exchange') {
      const savedFormData = getFormValues('edit-internal-payment-voucher');
      if (savedFormData) {
        if (savedFormData.date) {
          setDate(savedFormData.date);
        }
        setPageState('edit');
        setIsDisabled(false);
        setRestoreValuesFromStore(true);
      }
    }
  }, []);

  return (
    <>
      <section className="position-relative">
        <div
          style={{ height: 43 }}
          className="d-flex gap-3 justify-content-between align-items-center flex-wrap mb-4"
        >
          <div>
            {((pageState == 'new' && !isDisabled) ||
              pageState == 'view' ||
              pageState == 'listing' ||
              pageState == 'edit') && (
                <BackButton
                  handleBack={() => {
                    if (pageState == 'edit') {
                      setPageState('view');
                    } else if (pageState == 'new' && !isDisabled) {
                      setIsDisabled(true);
                    } else {
                      setDate(new Date().toLocaleDateString('en-CA'));
                      setPageState('new');
                      setWriteTerm('');
                      setSearchTerm('');
                    }
                  }}
                />
              )}

            <h2 className="screen-title mb-0">Internal Payment Voucher</h2>
          </div>
          {hasCreatePermission && pageState == 'new' && isDisabled && (
            <div className="d-flex gap-2">
              <CustomButton text={'New'} onClick={() => {
                setDate(new Date().toLocaleDateString('en-CA'));
                setIsDisabled(false);
              }} />
            </div>
          )}
        </div>
        <Row>
          <Col xs={12}>
            <div className="d-flex align-items-start justify-content-between flex-wrap-reverse mb-3">
              <div className="d-flex align-items-end mt-3">
                <CustomInput
                  style={{ width: '180px' }}
                  type="text"
                  placeholder="Search IPV"
                  error={false}
                  showBorders={false}
                  borderRadius={10}
                  name="search"
                  rightIcon={FaMagnifyingGlass}
                  value={writeTerm}
                  onChange={(e) => {
                    setWriteTerm(e.target.value);
                  }}
                  onButtonClick={() => {
                    setSearchTerm(writeTerm);
                    setDate(new Date().toLocaleDateString('en-CA'));
                    if (writeTerm === '') {
                      setPageState('listing');
                    } else {
                      setPageState('view');
                    }
                  }}
                />
              </div>
              <div>
                <CustomInput
                  name="Date"
                  label={'Date'}
                  type="date"
                  showBorders={false}
                  error={false}
                  borderRadius={10}
                  value={date}
                  readOnly={pageState === 'view'}
                  onChange={(e) => {
                    setDate(e.target.value);
                  }}
                />
              </div>
            </div>
            {renderPageContent()}
          </Col>
        </Row>
      </section>

      {/* Add New Ledger Modal */}
      <CustomModal
        show={!!showAddLedgerModal}
        close={() => setShowAddLedgerModal('')}
        size="xl"
        style={{ minHeight: '812px' }}
      >
        {renderAddLedgerForm()}
      </CustomModal>

      {/* Missing Currency Rate Modal */}
      <CustomModal
        show={showMissingCurrencyRateModal}
        close={() => setShowMissingCurrencyRateModal(false)}
        title={'Missing Rate of Exchange'}
        description={'Rate of exchange is missing for selected currency.'}
        variant={'error'}
        btn1Text={'Update Rate of Exchange'}
        action={() => {
          switch (pageState) {
            case 'edit':
              setLastVisitedPage(
                'edit-internal-payment-voucher',
                'rate-of-exchange'
              );
              saveFormValues('edit-internal-payment-voucher', {
                ...formData,
                date,
              });
              break;
            case 'new':
              setLastVisitedPage(
                'internal-payment-voucher',
                'rate-of-exchange'
              );
              saveFormValues('internal-payment-voucher', {
                ...formData,
                date,
              });
              break;
            default:
              setLastVisitedPage(
                'internal-payment-voucher',
                'rate-of-exchange'
              );
              break;
          }
          navigate('/transactions/remittance-rate-of-exchange', {
            state: { currencyToSelect, date },
          });
        }}
      />
    </>
  );
};

export default InternalPaymentVoucher;
