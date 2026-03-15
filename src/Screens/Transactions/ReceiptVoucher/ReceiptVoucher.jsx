import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';
import { Col, Row } from 'react-bootstrap';
import { FaMagnifyingGlass } from 'react-icons/fa6';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
import {
  getCOAAccountsbyMode,
  getRVVoucherNumber,
  getVATType,
} from '../../../Services/Transaction/ReceiptVoucher';
import useFormStore from '../../../Stores/FormStore';
import useSettingsStore from '../../../Stores/SettingsStore';
import { getCurrencyOptions } from '../../../Utils/Utils';
import EditReceiptVoucher from './EditReceiptVoucher';
import NewReceiptVoucher from './NewReceiptVoucher';
import ReceiptVouchersTable from './ReceiptVouchersTable';
import ViewReceiptVoucher from './ViewReceiptVoucher';
import useModulePermissions from '../../../Hooks/useModulePermissions';

const ReceiptVoucher = () => {
  usePageTitle('Receipt Voucher');
  const currencyOptions = getCurrencyOptions();
  const { state } = useLocation();
  const navigate = useNavigate();
  const {
    getFormValues,
    getLastVisitedPage,
    setLastVisitedPage,
    saveFormValues,
  } = useFormStore();
  const { updatePrintSetting } = useSettingsStore();
  const [pageState, setPageState] = useState(state?.pageState || 'new');
  const [isDisabled, setIsDisabled] = useState(true);
  const [writeTerm, setWriteTerm] = useState(state?.searchTerm || ''); // To Make search term only work on ButtonClick (Not passing ref as do not want to change component at this stage)
  const [searchTerm, setSearchTerm] = useState(state?.searchTerm || '');


  const location = useLocation();
  const { transactionId } = location.state || {};


  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [showAddLedgerModal, setShowAddLedgerModal] = useState('');
  const [showMissingCurrencyRateModal, setShowMissingCurrencyRateModal] =
    useState(false);
  const [currencyToSelect, setCurrencyToSelect] = useState(null);
  const clearCurrencyCallbackRef = useRef(null);
  const [newlyCreatedAccount, setNewlyCreatedAccount] = useState(null);
  const [newlyCreatedBeneficiary, setNewlyCreatedBeneficiary] = useState(null);
  // Add a new state to hold form data for saving
  const [formData, setFormData] = useState({});
  // Add a flag for restoring from store
  const [restoreValuesFromStore, setRestoreValuesFromStore] = useState(false);
  
  // Add a flag to prevent date reset when returning from Rate of Exchange page
  const [isReturningFromRateExchange, setIsReturningFromRateExchange] = useState(false);
  const [lastVoucherNumbers, setLastVoucherNumbers] = useState({
    heading: 'Last RV Number: ',
    current: '',
    previous: '',
    next: '',
    isLoadingVoucherNumber: false,
    isErrorVoucherNumber: false,
    errorVoucherNumber: null,
  });

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
  });

  const vatData = {
    vatType,
    isLoadingVatType,
    isErrorVatType,
    errorVatType,
  };
  // Get last voucher number //
  const {
    data: voucherNumber,
    isLoading: isLoadingVoucherNumber,
    isError: isErrorVoucherNumber,
    error: errorVoucherNumber,
  } = useQuery({
    queryKey: ['voucherNumber', searchTerm],
    queryFn: () => getRVVoucherNumber(searchTerm),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // setting the write term
  useEffect(() => {
    if (transactionId) {
      setSearchTerm(transactionId)
      setPageState('view')
    }
  }, [])

  useEffect(() => {
    setLastVoucherNumbers({
      heading: 'Last RV Number: ',
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
      console.error('Unable to fetch Accounts', errorMessage);
      return [{ label: 'Unable to fetch Accounts', value: null }];
    }
    let options =
      data?.map((x) => ({
        value: x?.id,
        label: x?.account_name,
      })) || [];

    return options;
  };

  // Handle navigation from Rate of Exchange page
  useEffect(() => {
    const lastPageNew = getLastVisitedPage('receipt-voucher');
    const lastPageEdit = getLastVisitedPage('edit-receipt-voucher');
    
    if (lastPageNew === 'rate-of-exchange') {
      const savedFormData = getFormValues('receipt-voucher');
      if (savedFormData) {
        // Set flag to prevent date reset
        setIsReturningFromRateExchange(true);
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
      const savedFormData = getFormValues('edit-receipt-voucher');
      if (savedFormData) {
        // Set flag to prevent date reset
        setIsReturningFromRateExchange(true);
        // Restore the date from saved form data
        if (savedFormData.date) {
          setDate(savedFormData.date);
        }
        // Set page state to edit and enable the form
        setPageState('edit');
        setIsDisabled(false);
        setRestoreValuesFromStore(true);
      }
    }
  }, [getLastVisitedPage, getFormValues, setPageState, setIsDisabled, setRestoreValuesFromStore]);

  // Handle returning from Special Commission page
  useEffect(() => {
    if (state?.specialCommissionData) {
      // Save the returned SC data for the calling page to access
      saveFormValues('special-commission', state.specialCommissionData);
    }
    // Update page state and search term if provided
    if (state?.pageState) {
      setPageState(state.pageState);
    }
    if (state?.searchTerm) {
      setSearchTerm(state.searchTerm);
      setWriteTerm(state.searchTerm);
    }
  }, [state]);

  const permissions = useModulePermissions('transactions', 'receipt_voucher');
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
        <NewReceiptVoucher
          date={date}
          state={state}
          getAccountsByTypeOptions={getAccountsByTypeOptions}
          getCOAAccountsByModeOptions={getCOAAccountsByModeOptions}
          currencyOptions={currencyOptions}
          vatData={vatData}
          isDisabled={isDisabled}
          setIsDisabled={setIsDisabled}
          setSearchTerm={setSearchTerm}
          setPageState={setPageState}
          setShowAddLedgerModal={setShowAddLedgerModal}
          setCurrencyToSelect={setCurrencyToSelect}
          setShowMissingCurrencyRateModal={setShowMissingCurrencyRateModal}
          newlyCreatedAccount={newlyCreatedAccount}
          newlyCreatedBeneficiary={newlyCreatedBeneficiary}
          lastVoucherNumbers={lastVoucherNumbers}
          updatePrintSetting={updatePrintSetting}
          onFormDataChange={setFormData}
          restoreValuesFromStore={restoreValuesFromStore}
          permissions={permissions}
          hasPrintPermission={hasPrintPermission}
          onMissingRateModalClose={(callback) => {
            clearCurrencyCallbackRef.current = callback;
          }}
          onResetDate={() => setDate(new Date().toLocaleDateString('en-CA'))}
        />
      ),
      view: (
        <ViewReceiptVoucher
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
        <ReceiptVouchersTable
          date={date}
          setSearchTerm={setSearchTerm}
          setPageState={setPageState}
          permissions={permissions}
        />
      ),
      edit: (
        <EditReceiptVoucher
          date={date}
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
          onFormDataChange={setFormData}
          permissions={permissions}
          hasEditPermission={hasEditPermission}
          hasDeletePermission={hasDeletePermission}
          hasPrintPermission={hasPrintPermission}
          hasViewPermission={hasViewPermission}
          onMissingRateModalClose={(callback) => {
            clearCurrencyCallbackRef.current = callback;
          }}
        />
      ),
    };

    return pageComponents[pageState] || null;
  };

  return (
    <>
      <section className="position-relative">
        <div className="header-fixed d-card">
          <div
            className="d-flex gap-3 justify-content-between align-items-center flex-wrap"
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
                        setIsDisabled(true);
                        // Reset date when going back from new form, but not if returning from Rate of Exchange
                        if (!isReturningFromRateExchange) {
                          setDate(new Date().toLocaleDateString('en-CA'));
                        }
                      } else {
                        // Reset date when going back, but not if returning from Rate of Exchange
                        if (!isReturningFromRateExchange) {
                          setDate(new Date().toLocaleDateString('en-CA'));
                        }
                        setPageState('new');
                        setWriteTerm('');
                        setSearchTerm('');
                      }
                      // Reset the flag after using it
                      setIsReturningFromRateExchange(false);
                    }}
                  />
                )}
              <h2 className="screen-title mb-0">Receipt Voucher</h2>
            </div>

            {hasCreatePermission && pageState == 'new' && isDisabled && (
              <div className="d-flex gap-2">
                <CustomButton text={'New'} onClick={() => {
                  // Reset date when clicking New, but not if returning from Rate of Exchange
                  if (!isReturningFromRateExchange) {
                    setDate(new Date().toLocaleDateString('en-CA'));
                  }
                  setIsDisabled(false);
                  // Reset the flag after using it
                  setIsReturningFromRateExchange(false);
                }} />
              </div>
            )}
          </div>
        </div>
        <Row>
          <Col xs={12}>
            <div className="d-flex align-items-start justify-content-between flex-wrap-reverse mb-3">
              <div className="d-flex align-items-end mt-3">
                <CustomInput
                  style={{ width: '180px' }}
                  type="text"
                  placeholder="Search RV"
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
                      // Reset date when searching with empty term, but not if returning from Rate of Exchange
                      if (!isReturningFromRateExchange) {
                        setDate(new Date().toLocaleDateString('en-CA'));
                      }
                      setPageState('list');
                    } else {
                      setPageState('view');
                    }
                    // Reset the flag after using it
                    setIsReturningFromRateExchange(false);
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
      >
        {renderAddLedgerForm()}
      </CustomModal>

      {/* Missing Currency Rate Modal */}
      <CustomModal
        show={showMissingCurrencyRateModal}
        close={() => {
          setShowMissingCurrencyRateModal(false);
          // Clear currency when modal is closed without action
          if (clearCurrencyCallbackRef.current) {
            clearCurrencyCallbackRef.current();
          }
        }}
        title={'Missing Rate of Exchange'}
        description={'Rate of exchange is missing for selected currency.'}
        variant={'error'}
        btn1Text={'Update Rate of Exchange'}
        action={() => {
          switch (pageState) {
            case 'edit':
              setLastVisitedPage('edit-receipt-voucher', 'rate-of-exchange');
              saveFormValues('edit-receipt-voucher', {
                ...formData,
                date,
              });
              break;
            case 'new':
              setLastVisitedPage('receipt-voucher', 'rate-of-exchange');
              saveFormValues('receipt-voucher', {
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

export default ReceiptVoucher;
