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
import { usePageTitle } from '../../../Hooks/usePageTitle';
import {
  getAccountsbyType,
  getPaymentVoucherMode,
} from '../../../Services/Transaction/JournalVoucher.js';
import {
  getCOAAccountsbyMode,
  getPVVoucherNumber,
  getVATType,
} from '../../../Services/Transaction/PaymentVoucher.js';
import useFormStore from '../../../Stores/FormStore.js';
import useSettingsStore from '../../../Stores/SettingsStore.js';
import { getCurrencyOptions } from '../../../Utils/Utils';
import '../transactionStyles.css';
import EditPaymentVoucher from './EditPaymentVoucher';
import NewPaymentVoucher from './NewPaymentVoucher';
import PaymentVouchersTable from './PaymentVouchersTable';
import ViewPaymentVoucher from './ViewPaymentVoucher';
import useModulePermissions from '../../../Hooks/useModulePermissions.js';

const PaymentVoucher = () => {
  usePageTitle('Payment Voucher');
  const currencyOptions = getCurrencyOptions();
  const { state } = useLocation();
  const navigate = useNavigate();
  const {
    getFormValues,
    getLastVisitedPage,
    setLastVisitedPage,
    saveFormValues,
  } = useFormStore();
  // [new, view, edit,  listing]
  // View is for specific Voucher search and view it's detail
  // Edit is for editing the specific Voucher's detail
  // Listing is for Voucher listing table
  const { updatePrintSetting } = useSettingsStore();
  // Add a new state to hold form data for saving
  const [formData, setFormData] = useState({});
  const [pageState, setPageState] = useState(state?.pageState || 'new');
  const [isDisabled, setIsDisabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [writeTerm, setWriteTerm] = useState(state?.searchTerm || ''); // To Make search term only work on ButtonClick (Not passing ref as do not want to change component at this stage)
  const [showAddLedgerModal, setShowAddLedgerModal] = useState('');
  const [newlyCreatedAccount, setNewlyCreatedAccount] = useState(null);
  const [newlyCreatedBeneficiary, setNewlyCreatedBeneficiary] = useState(null);
  const [showMissingCurrencyRateModal, setShowMissingCurrencyRateModal] =
    useState(false);
  const [currencyToSelect, setCurrencyToSelect] = useState(null);

  // Upload Only Modal
  const [uploadAttachmentsModal, setUploadAttachmentsModal] = useState(false);
  // Upload And View Modal
  // Selected files from UploadAttachments Modal
  const [selectedFiles, setSelectedFiles] = useState(null);

  const location = useLocation();
  const { transactionId } = location.state || {};

  // setting the write term
  useEffect(() => {
    if (transactionId) {
      setSearchTerm(transactionId);
      setPageState('view');
    }
  }, []);

  // Handle navigation from Rate of Exchange page
  useEffect(() => {
    const lastPageNew = getLastVisitedPage('payment-voucher');
    const lastPageEdit = getLastVisitedPage('edit-payment-voucher');

    if (lastPageNew === 'rate-of-exchange') {
      const savedFormData = getFormValues('payment-voucher');
      if (savedFormData) {
        // Restore the date from saved form data
        if (savedFormData.date) {
          setDate(savedFormData.date);
        }
        // Set page state to new and enable the table
        setPageState('new');
        setIsDisabled(false);
        setRestoreValuesFromStore(true);
      }
    } else if (lastPageEdit === 'rate-of-exchange') {
      const savedFormData = getFormValues('edit-payment-voucher');
      if (savedFormData) {
        // Restore the date from saved form data
        if (savedFormData.date) {
          setDate(savedFormData.date);

        }
        // Restore the searchTerm to fetch the correct voucher
        if (savedFormData.searchTerm) {
          setSearchTerm(savedFormData.searchTerm);
          setWriteTerm(savedFormData.searchTerm);
        }
        // Set page state to edit and enable the form
        setPageState('edit');
        setIsDisabled(false);
      }
    }
  }, []);
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

  // const {
  //   data: beneficiaryAccounts,
  //   isLoading: isLoadingBeneficiary,
  //   isError: isErrorBeneficiary,
  //   error: errorBeneficiary,
  // } = useQuery({
  //   queryKey: ['accounts', 'beneficiary'],
  //   queryFn: () => getAccountsbyType('beneficiary'),
  //   staleTime: 1000 * 60 * 5,
  // });

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
    // beneficiary: {
    //   data: beneficiaryAccounts,
    //   loading: isLoadingBeneficiary,
    //   error: isErrorBeneficiary,
    //   errorMessage: errorBeneficiary,
    // },
  };

  const getAccountsByTypeOptions = (accountType) => {
    if (!accountType) {
      return [{ label: 'Select Ledger', value: null, isDisabled: true }];
    }

    const { data, loading, error, errorMessage } =
      accountData[accountType] || {};

    if (loading) {
      return [{ label: 'Loading...', value: null, isDisabled: true }];
    }

    if (error) {
      console.error('Unable to fetch Accounts', errorMessage);
      return [{ label: 'Unable to fetch Accounts', value: null }];
    }
    let options =
      data?.map((x) => ({
        value: x?.id,
        label: x?.title,
      })) || [];
    switch (accountType) {
      case 'party':
        options.push({
          label: `Add New PL`,
          value: null,
        });
        break;
      case 'general':
        options.push({
          label: `Add New GL`,
          value: null,
        });
        break;
      case 'walkin':
        options.push({
          label: `Add New WIC`,
          value: null,
        });
        break;
      case 'beneficiary':
        options.push({
          label: `Add New Beneficiary`,
          value: null,
        });
        break;
      default:
        break;
    }
    return options;
  };

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
      return [{ label: 'Unable to fetch Accounts', value: null }];
    }
    let options =
      data?.map((x) => ({
        value: x?.id,
        label: x?.account_name,
      })) || [];

    return options;
  };

  // get modes

  const {
    data: modeBank,
    isLoading: isLoadingBank,
    isError: isErrorBank,
    error: errorBank,
  } = useQuery({
    queryKey: ['type', 'Bank'],
    queryFn: () => getPaymentVoucherMode('Bank'),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: modeCash,
    isLoading: isLoadingCash,
    isError: isErrorCash,
    error: errorCash,
  } = useQuery({
    queryKey: ['type', 'Cash'],
    queryFn: () => getPaymentVoucherMode('Cash'),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: modePdc,
    isLoading: isLoadingPdc,
    isError: isErrorPdc,
    error: errorPdc,
  } = useQuery({
    queryKey: ['type', 'PDC'],
    queryFn: () => getPaymentVoucherMode('PDC'),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: modeOnline,
    isLoading: isLoadingOnline,
    isError: isErrorOnline,
    error: errorOnline,
  } = useQuery({
    queryKey: ['type', 'Online'],
    queryFn: () => getPaymentVoucherMode('Online'),
    staleTime: 1000 * 60 * 5,
  });

  const modesData = {
    bank: {
      data: modeBank,
      loading: isLoadingBank,
      error: isErrorBank,
      errorMessage: errorBank,
    },
    cash: {
      data: modeCash,
      loading: isLoadingBank,
      error: isErrorBank,
      errorMessage: errorBank,
    },
    pdc: {
      data: modePdc,
      loading: isLoadingPdc,
      error: isErrorPdc,
      errorMessage: errorPdc,
    },
    online: {
      data: modeOnline,
      loading: isLoadingOnline,
      error: isErrorOnline,
      errorMessage: errorOnline,
    },
  };

  // Add a flag for restoring from store
  const [restoreValuesFromStore, setRestoreValuesFromStore] = useState(false);
  const [lastVoucherNumbers, setLastVoucherNumbers] = useState({
    heading: 'Last PV Number: ',
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
    queryFn: () => getPVVoucherNumber(searchTerm),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  useEffect(() => {
    setLastVoucherNumbers({
      heading: 'Last PV Number: ',
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

  // Query
  // Get VAT Type //
  const {
    data: vatType,
    isLoading: isLoadingVatType,
    isError: isErrorVatType,
    error: errorVatType,
  } = useQuery({
    queryKey: ['vatType'],
    queryFn: getVATType,
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  const vatData = {
    vatType,
    isLoadingVatType,
    isErrorVatType,
    errorVatType,
  };

  const permissions = useModulePermissions('transactions', 'payment_voucher');
  const {
    edit: hasEditPermission,
    create: hasCreatePermission,
    delete: hasDeletePermission,
    print: hasPrintPermission,
    view: hasViewPermission,
  } = permissions || {};

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
              setNewlyCreatedBeneficiary(newlyCreatedAccount);
              setShowAddLedgerModal('');
            }}
            onCancel={() => setShowAddLedgerModal('')}
          />
        );
      default:
        break;
    }
  };

  const renderPageContent = () => {
    const pageComponents = {
      new: (
        <NewPaymentVoucher
          isDisabled={isDisabled}
          setIsDisabled={setIsDisabled}
          setSearchTerm={setSearchTerm}
          setPageState={setPageState}
          setShowAddLedgerModal={setShowAddLedgerModal}
          newlyCreatedAccount={newlyCreatedAccount}
          uploadAttachmentsModal={uploadAttachmentsModal}
          setUploadAttachmentsModal={setUploadAttachmentsModal}
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
          lastVoucherNumbers={lastVoucherNumbers}
          onFormDataChange={setFormData}
          restoreValuesFromStore={restoreValuesFromStore}
          setCurrencyToSelect={setCurrencyToSelect}
          setShowMissingCurrencyRateModal={setShowMissingCurrencyRateModal}
          updatePrintSetting={updatePrintSetting}
          currencyOptions={currencyOptions}
          accountData={accountData}
          modesData={modesData}
          date={date}
          setDate={setDate}
          vatData={vatData}
          permissions={permissions}
          hasPrintPermission={hasPrintPermission}
        />
      ),
      view: (
        <ViewPaymentVoucher
          searchTerm={searchTerm}
          setDate={setDate}
          setWriteTerm={setWriteTerm}
          setSearchTerm={setSearchTerm}
          setPageState={setPageState}
          lastVoucherNumbers={lastVoucherNumbers}
          permissions={permissions}
          hasViewPermission={hasViewPermission}
          hasEditPermission={hasEditPermission}
          hasDeletePermission={hasDeletePermission}
          hasPrintPermission={hasPrintPermission}
        />
      ),
      list: (
        <PaymentVouchersTable
          date={date}
          setSearchTerm={setSearchTerm}
          setPageState={setPageState}
        />
      ),
      edit: (
        <EditPaymentVoucher
          date={date}
          setDate={setDate}
          state={state}
          getAccountsByTypeOptions={getAccountsByTypeOptions}
          getCOAAccountsByModeOptions={getCOAAccountsByModeOptions}
          currencyOptions={currencyOptions}
          vatData={vatData}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          setPageState={setPageState}
          isDisabled={false}
          setIsDisabled={setIsDisabled}
          setShowAddLedgerModal={setShowAddLedgerModal}
          setCurrencyToSelect={setCurrencyToSelect}
          setShowMissingCurrencyRateModal={setShowMissingCurrencyRateModal}
          newlyCreatedAccount={newlyCreatedAccount}
          newlyCreatedBeneficiary={newlyCreatedBeneficiary}
          lastVoucherNumbers={lastVoucherNumbers}
          updatePrintSetting={updatePrintSetting}
          uploadAttachmentsModal={uploadAttachmentsModal}
          setUploadAttachmentsModal={setUploadAttachmentsModal}
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
          onFormDataChange={setFormData}
          restoreValuesFromStore={restoreValuesFromStore}
          accountData={accountData}
          modesData={modesData}
          permissions={permissions}
          hasViewPermission={hasViewPermission}
          hasEditPermission={hasEditPermission}
          hasDeletePermission={hasDeletePermission}
          hasPrintPermission={hasPrintPermission}
        />
      ),
    };

    return pageComponents[pageState] || null;
  };

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
              pageState == 'list' ||
              pageState == 'edit') && (
                <BackButton
                  handleBack={() => {
                    if (pageState == 'edit') {
                      setPageState('view');
                    } else if (pageState == 'new' && !isDisabled) {
                      // Reset date when going back from new form
                      setDate(new Date().toLocaleDateString('en-CA'));
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
            <h2 className="screen-title mb-0">Payment Voucher</h2>
          </div>
          {hasCreatePermission && pageState == 'new' && isDisabled && (
            <div className="d-flex gap-2">
              <CustomButton
                text={'New'}
                onClick={() => {
                  setDate(new Date().toLocaleDateString('en-CA'));
                  setIsDisabled(false);
                }}
              />
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
                  placeholder="Search PV"
                  error={false}
                  showBorders={false}
                  borderRadius={10}
                  name="search"
                  rightIcon={FaMagnifyingGlass}
                  value={writeTerm}
                  onChange={(e) => {
                    if (location.search) {
                      navigate(location.pathname, { replace: true });
                    }
                    setWriteTerm(e.target.value);
                  }}
                  onButtonClick={() => {
                    setSearchTerm(writeTerm);
                    if (writeTerm === '') {
                      setDate(new Date().toLocaleDateString('en-CA'));
                      setPageState('list');
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
              setLastVisitedPage('edit-payment-voucher', 'rate-of-exchange');
              saveFormValues('edit-payment-voucher', {
                ...formData,
                date,
                searchTerm,
              });
              break;
            case 'new':
              setLastVisitedPage('payment-voucher', 'rate-of-exchange');
              saveFormValues('payment-voucher', {
                ...formData,
                date,
              });
              break;
            default:
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

export default PaymentVoucher;
