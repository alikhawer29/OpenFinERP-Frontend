import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { FaMagnifyingGlass, FaRegClone } from 'react-icons/fa6';
import { useLocation, useNavigate } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import ChartOfAccountForm from '../../../Components/ChartOfAccountForm/ChartOfAccountForm';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import PartyLedgerForm from '../../../Components/PartyLedgerForm/PartyLedgerForm';
import WalkInCustomerForm from '../../../Components/WalkInCustomerForm/WalkInCustomerForm';
import useAccountsByType from '../../../Hooks/useAccountsByType';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { getCTVoucherNumber } from '../../../Services/Transaction/CurrencyTransfer';
import useFormStore from '../../../Stores/FormStore';
import { getCurrencyOptions } from '../../../Utils/Utils';
import '../transactionStyles.css';
import CurrencyTransferTable from './CurrencyTransferTable';
import EditCurrencyTransfer from './EditCurrencyTransfer';
import NewCurrencyTransfer from './NewCurrencyTransfer';
import ViewCurrencyTransfer from './ViewCurrencyTransfer';
import useModulePermissions from '../../../Hooks/useModulePermissions';
// import EditSuspenseVoucher from './EditSuspenseVoucher';

const CurrencyTransfer = () => {
  usePageTitle('Currency Transfer Request');
  const currencyOptions = getCurrencyOptions();
  const navigate = useNavigate();
  const { state } = useLocation();

  // Form store for handling navigation state
  const {
    getFormValues,
    getLastVisitedPage,
    setLastVisitedPage,
    saveFormValues,
  } = useFormStore();

  // [new, view, edit,  list]
  // View is for specific Suspense Voucher search and view it's detail
  // Edit is for editing the specific Suspense Voucher's detail
  // List is for Suspense Voucher list table
  const [pageState, setPageState] = useState('new');

  const [isDisabled, setIsDisabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [writeTerm, setWriteTerm] = useState(''); // To Make search term only work on ButtonClick (following Journal Voucher pattern)
  const [writeCloneTerm, setWriteCloneTerm] = useState(''); // To Make clone term only work on ButtonClick (following Journal Voucher pattern)
  const [cloneCT, setCloneCT] = useState(''); // Clone Currency Transfer (following Journal Voucher pattern)
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [showAddLedgerModal, setShowAddLedgerModal] = useState('');
  const [newlyCreatedAccount, setNewlyCreatedAccount] = useState(null);
  const [showAddOfficeLocationModal, setShowAddOfficeLocationModal] =
    useState(false);
  // Upload Only Modal
  const [uploadAttachmentsModal, setUploadAttachmentsModal] = useState(false);
  // Upload And View Modal
  const [showMissingCurrencyRateModal, setShowMissingCurrencyRateModal] =
    useState(false);
  const [currencyToSelect, setCurrencyToSelect] = useState(null);

  // Form data state for Rate of Exchange navigation (following TMN Currency Deal pattern)
  const [formData, setFormData] = useState(null);
  const [restoreValuesFromStore, setRestoreValuesFromStore] = useState(false);
  // Add a flag to prevent date reset when returning from Rate of Exchange page
  const [isReturningFromRateExchange, setIsReturningFromRateExchange] = useState(false);
  const [lastVoucherNumbers, setLastVoucherNumbers] = useState({
    heading: 'Last TRQ Number: ',
    current: '',
    previous: '',
    next: '',
    isLoadingVoucherNumber: false,
    isErrorVoucherNumber: false,
    errorVoucherNumber: null,
  });
  // Queries
  // Get last voucher number //
  const {
    data: voucherNumber,
    isLoading: isLoadingVoucherNumber,
    isError: isErrorVoucherNumber,
    error: errorVoucherNumber,
  } = useQuery({
    queryKey: ['voucherNumber', searchTerm],
    queryFn: () => getCTVoucherNumber(searchTerm),
    refetchOnWindowFocus: false,
    retry: 1,
  });
  // Get account options using custom hook
  const { getAccountsByTypeOptions } = useAccountsByType({
    includeBeneficiary: false,
    staleTime: 1000 * 60 * 5,
  });

  // Handle navigation from Rate of Exchange page (following Account to Account pattern)
  useEffect(() => {
    const lastPage = getLastVisitedPage('currency-transfer');
    if (lastPage === 'remittanceRateOfExchange') {
      const savedFormData = getFormValues('currency-transfer');
      if (savedFormData) {
        // Set flag to prevent date reset
        setIsReturningFromRateExchange(true);
        // Restore page state and common fields
        setPageState(savedFormData.pageState || 'new');
        if (savedFormData.date) {
          setDate(savedFormData.date);
        }
        setIsDisabled(false);
        setRestoreValuesFromStore(true);
      }
    }
  }, []);

  // Handle missing currency rate modal (following Account to Account pattern)
  const handleMissingCurrencyRate = () => {
    if (currencyToSelect) {
      // Safety check: Don't save if formData is missing or rows are empty (indicates component unmounting or state reset)
      if (!formData || (formData.rows && Object.keys(formData.rows).length === 0)) {
        console.warn('Attempted to save empty form data, navigation cancelled.');
        return;
      }

      saveFormValues('currency-transfer', {
        ...formData, // Save all fields from formData (values, rows, attachments, SC, accounts)
        date,
        pageState, // Save page state to restore it on return
      });
      setLastVisitedPage('currency-transfer', 'remittanceRateOfExchange');

      navigate('/transactions/remittance-rate-of-exchange', {
        state: { currencyToSelect, date },
      });
    }
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
      default:
        break;
    }
  };

  // Permissions
  const permissions = useModulePermissions('transactions', 'currency_transfer');
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
        <NewCurrencyTransfer
          state={state}
          isDisabled={isDisabled}
          setIsDisabled={setIsDisabled}
          getAccountsByTypeOptions={getAccountsByTypeOptions}
          setShowAddOfficeLocationModal={setShowAddOfficeLocationModal}
          setShowAddLedgerModal={setShowAddLedgerModal}
          newlyCreatedAccount={newlyCreatedAccount}
          uploadAttachmentsModal={uploadAttachmentsModal}
          setUploadAttachmentsModal={setUploadAttachmentsModal}
          setShowMissingCurrencyRateModal={setShowMissingCurrencyRateModal}
          lastVoucherNumbers={lastVoucherNumbers}
          setCurrencyToSelect={setCurrencyToSelect}
          currencyOptions={currencyOptions}
          date={date}
          setDate={setDate}
          cloneCT={cloneCT}
          setCloneCT={setCloneCT}
          setWriteCloneTerm={setWriteCloneTerm}
          setSearchTerm={setSearchTerm}
          setPageState={setPageState}
          onFormDataChange={setFormData}
          restoreValuesFromStore={restoreValuesFromStore}
          permissions={permissions}
          hasPrintPermission={hasPrintPermission}
        />
      ),
      view: (
        <ViewCurrencyTransfer
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          setWriteTerm={setWriteTerm}
          setDate={setDate}
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
        <CurrencyTransferTable
          date={date}
          setPageState={setPageState}
          setSearchTerm={setSearchTerm}
          setWriteTerm={setWriteTerm}
          permissions={permissions}
        />
      ),
      edit: (
        <EditCurrencyTransfer
          state={state}
          isDisabled={isDisabled}
          setIsDisabled={setIsDisabled}
          setShowAddLedgerModal={setShowAddLedgerModal}
          newlyCreatedAccount={newlyCreatedAccount}
          uploadAttachmentsModal={uploadAttachmentsModal}
          setUploadAttachmentsModal={setUploadAttachmentsModal}
          setShowMissingCurrencyRateModal={setShowMissingCurrencyRateModal}
          showMissingCurrencyRateModal={showMissingCurrencyRateModal}
          lastVoucherNumbers={lastVoucherNumbers}
          setCurrencyToSelect={setCurrencyToSelect}
          currencyToSelect={currencyToSelect}
          currencyOptions={currencyOptions}
          date={date}
          setDate={setDate}
          setWriteCloneTerm={setWriteCloneTerm}
          setSearchTerm={setSearchTerm}
          setPageState={setPageState}
          searchTerm={searchTerm}
          onFormDataChange={setFormData}
          restoreValuesFromStore={restoreValuesFromStore}
          permissions={permissions}
          hasViewPermission={hasViewPermission}
          hasPrintPermission={hasPrintPermission}
        />
      ),
    };

    return pageComponents[pageState] || null;
  };
  useEffect(() => {
    setLastVoucherNumbers({
      heading: 'Last TRQ Number: ',
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

  // Auto-enable form when navigating to edit mode (following Account to Account pattern)
  useEffect(() => {
    if (pageState === 'edit') {
      setIsDisabled(false);
    }
  }, [pageState]);
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
                      if (!isReturningFromRateExchange) {
                        setDate(new Date().toLocaleDateString('en-CA'));
                      }
                      setIsDisabled(true);
                    } else {
                      if (!isReturningFromRateExchange) {
                        setDate(new Date().toLocaleDateString('en-CA'));
                      }
                      setPageState('new');
                      setIsDisabled(true);
                      setWriteTerm('');
                      setSearchTerm('');
                    }
                    // Reset the flag after use
                    setIsReturningFromRateExchange(false);
                  }}
                />
              )}
            <h2 className="screen-title mb-0">Currency Transfer Request</h2>
          </div>
          {hasCreatePermission && pageState == 'new' && isDisabled && (
            <div className="d-flex gap-2">
              <CustomButton text={'New'} onClick={() => {
                if (!isReturningFromRateExchange) {
                  setDate(new Date().toLocaleDateString('en-CA'));
                }
                setIsDisabled(false);
                // Reset the flag after use
                setIsReturningFromRateExchange(false);
              }} />
            </div>
          )}
        </div>
        <Row>
          <Col xs={12}>
            <div className="d-flex align-items-start justify-content-between flex-wrap-reverse mb-3">
              <div className="d-flex align-items-end gap-2 flex-wrap mt-3">
                <CustomInput
                  style={{ width: '180px' }}
                  type="text"
                  placeholder="Search TRQ"
                  error={false}
                  showBorders={false}
                  borderRadius={10}
                  name="search"
                  autoComplete="off"
                  rightIcon={FaMagnifyingGlass}
                  value={writeTerm}
                  onChange={(e) => {
                    setWriteTerm(e.target.value);
                  }}
                  onButtonClick={() => {
                    setSearchTerm(writeTerm);
                    setCloneCT(writeCloneTerm);
                    if (writeTerm === '') {
                      setPageState('list');
                      if (!isReturningFromRateExchange) {
                        setDate(new Date().toLocaleDateString('en-CA'));
                      }
                    } else {
                      setPageState('view');
                    }
                  }}
                />
                {pageState == 'new' && (
                  <CustomInput
                    style={{ width: '180px' }}
                    type="text"
                    placeholder="Clone TRQ"
                    error={false}
                    showBorders={false}
                    borderRadius={10}
                    name="cloneTRQ"
                    disabled={isDisabled}
                    rightIcon={FaRegClone}
                    value={writeCloneTerm}
                    onChange={(e) => {
                      setWriteCloneTerm(e.target.value);
                    }}
                    onButtonClick={() => {
                      setCloneCT(writeCloneTerm);
                      setIsDisabled(false);
                    }}
                  />
                )}
              </div>
              <div>
                <CustomInput
                  name="Date"
                  label={'Date'}
                  type="date"
                  showBorders={false}
                  error={false}
                  borderRadius={10}
                  readOnly={pageState === 'view'}
                  value={date}
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

      <CustomModal
        show={showMissingCurrencyRateModal}
        close={() => setShowMissingCurrencyRateModal(false)}
        title={'Missing Rate of Exchange'}
        description={'Rate of exchange is missing for selected currency.'}
        variant={'error'}
        btn1Text={'Update Rate of Exchange'}
        action={() => {
          setShowMissingCurrencyRateModal(false);
          handleMissingCurrencyRate();
        }}
      />
    </>
  );
};

export default CurrencyTransfer;
