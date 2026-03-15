import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { FaMagnifyingGlass, FaRegClone } from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import ChartOfAccountForm from '../../../Components/ChartOfAccountForm/ChartOfAccountForm';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import PartyLedgerForm from '../../../Components/PartyLedgerForm/PartyLedgerForm';
import WalkInCustomerForm from '../../../Components/WalkInCustomerForm/WalkInCustomerForm';
import useAccountsByType from '../../../Hooks/useAccountsByType';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { getVoucherNumber } from '../../../Services/Transaction/JournalVoucher';
import useFormStore from '../../../Stores/FormStore';
import useSettingsStore from '../../../Stores/SettingsStore';
import { getCurrencyOptions } from '../../../Utils/Utils';
import EditJournalVoucher from './EditJournalVoucher';
import JournalVouchersTable from './JournalVouchersTable';
import NewJournalVoucher from './NewJournalVoucher';
import ViewJournalVoucher from './ViewJournalVoucher';

// Constants
const PAGE_STATES = {
  NEW: 'new',
  EDIT: 'edit',
  VIEW: 'view',
  LIST: 'list',
};

const LEDGER_MODAL_TYPES = {
  PARTY_LEDGER: 'add new pl',
  WALK_IN_CUSTOMER: 'add new wic',
  GENERAL_LEDGER: 'add new gl',
};

const INITIAL_FORM_DATA = {
  rows: {},
  totalDebit: 0,
  totalCredit: 0,
  addedAttachments: [],
};

const getTodayDate = () => new Date().toLocaleDateString('en-CA');

// const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// console.log(timezone);

const JournalVoucher = () => {
  usePageTitle('Journal Voucher');
  const navigate = useNavigate();

  // Store hooks - extract stable references
  const {
    getFormValues,
    getLastVisitedPage,
    saveFormValues,
    setLastVisitedPage,
  } = useFormStore();
  const { updatePrintSetting } = useSettingsStore();

  // Hook calls must be at the top level and in consistent order
  const currencyOptions = getCurrencyOptions();
  const permissions = useModulePermissions('transactions', 'journal_voucher');
  const { getAccountsByTypeOptions } = useAccountsByType();

  // State management
  const [pageState, setPageState] = useState(PAGE_STATES.NEW);
  const [isDisabled, setIsDisabled] = useState(true);
  const [date, setDate] = useState(getTodayDate());

  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [writeTerm, setWriteTerm] = useState('');
  const [writeCloneTerm, setWriteCloneTerm] = useState(''); // To Make search term only work on ButtonClick (Not passing ref as do not want to change component at this stage)
  const [cloneJV, setCloneJV] = useState('');

  // Form and modal states
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [restoreValuesFromStore, setRestoreValuesFromStore] = useState(false);
  const [isReturningFromRateExchange, setIsReturningFromRateExchange] =
    useState(false);
  const [showAddLedgerModal, setShowAddLedgerModal] = useState('');
  const [newlyCreatedAccount, setNewlyCreatedAccount] = useState(null);
  const [addLedgerRowId, setAddLedgerRowId] = useState(null);
  const [showMissingCurrencyRateModal, setShowMissingCurrencyRateModal] =
    useState(false);
  const [currencyToSelect, setCurrencyToSelect] = useState(null);

  // Voucher number query
  const {
    data: voucherNumber,
    isLoading: isLoadingVoucherNumber,
    isError: isErrorVoucherNumber,
    error: errorVoucherNumber,
  } = useQuery({
    queryKey: ['voucherNumber', searchTerm],
    queryFn: () => getVoucherNumber(searchTerm),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Memoized voucher numbers object
  const lastVoucherNumbers = useMemo(
    () => ({
      heading: 'Last JV Number: ',
      last: voucherNumber?.default_voucher_no,
      current: voucherNumber?.current_voucher_no,
      previous: voucherNumber?.previous_voucher_no,
      next: voucherNumber?.next_voucher_no,
      isLoadingVoucherNumber,
      isErrorVoucherNumber,
      errorVoucherNumber,
    }),
    [
      voucherNumber,
      isLoadingVoucherNumber,
      isErrorVoucherNumber,
      errorVoucherNumber,
    ]
  );

  // Queries

  // Handle navigation from Rate of Exchange page
  useEffect(() => {
    const lastPageNew = getLastVisitedPage('journalVoucher');
    const lastPageEdit = getLastVisitedPage('editJournalVoucher');

    if (lastPageNew === 'remittanceRateOfExchange') {
      const savedFormData = getFormValues('journalVoucher');
      if (savedFormData) {
        // Set flag to prevent date reset
        setIsReturningFromRateExchange(true);
        // Restore the date from saved form data
        if (savedFormData.date) {
          setDate(savedFormData.date);
        }
        setPageState(PAGE_STATES.NEW);
        setIsDisabled(false);
        setRestoreValuesFromStore(true);
      }
    } else if (lastPageEdit === 'remittanceRateOfExchange') {
      const savedFormData = getFormValues('editJournalVoucher');
      if (savedFormData) {
        // Set flag to prevent date reset
        setIsReturningFromRateExchange(true);
        // Restore the date from saved form data
        if (savedFormData.date) {
          setDate(savedFormData.date);
        }
        // Restore the searchTerm so the query can find the voucher data
        if (savedFormData.searchTerm) {
          setSearchTerm(savedFormData.searchTerm);
          setWriteTerm(savedFormData.searchTerm);
        }
        setPageState(PAGE_STATES.EDIT);
        setIsDisabled(false);
        setRestoreValuesFromStore(true);
      }
    }
  }, [
    getLastVisitedPage,
    getFormValues,
    setPageState,
    setIsDisabled,
    setRestoreValuesFromStore,
    setDate,
  ]);

  const {
    create: hasCreatePermission,
    edit: hasEditPermission,
    delete: hasDeletePermission,
    print: hasPrintPermission,
    view: hasViewPermission,
  } = permissions || {};

  const handleNewLedgerSuccess = useCallback((newAccount, rowId) => {
    if (rowId && typeof window.updateJVRowField === 'function') {
      window.updateJVRowField(rowId, 'account_id', newAccount.id);
    }
    setShowAddLedgerModal('');
    setAddLedgerRowId(null);
  }, []);

  const handlePartyLedgerSuccess = useCallback((newAccount) => {
    setNewlyCreatedAccount(newAccount);
    setShowAddLedgerModal('');
  }, []);

  const renderPageContent = useCallback(() => {
    const commonProps = {
      date,
      setDate,
      searchTerm,
      setSearchTerm,
      lastVoucherNumbers,
    };
    const pageComponents = {
      [PAGE_STATES.NEW]: (
        <NewJournalVoucher
          {...commonProps}
          isDisabled={isDisabled}
          setIsDisabled={setIsDisabled}
          getAccountsByTypeOptions={getAccountsByTypeOptions}
          currencyOptions={currencyOptions}
          setShowMissingCurrencyRateModal={setShowMissingCurrencyRateModal}
          setCurrencyToSelect={setCurrencyToSelect}
          setShowAddLedgerModal={setShowAddLedgerModal}
          setAddLedgerRowId={setAddLedgerRowId}
          setPageState={setPageState}
          cloneJV={cloneJV}
          setCloneJV={setCloneJV}
          setWriteCloneTerm={setWriteCloneTerm}
          onFormDataChange={setFormData}
          restoreValuesFromStore={restoreValuesFromStore}
          updatePrintSetting={updatePrintSetting}
          hasPrintPermission={hasPrintPermission}
        />
      ),
      [PAGE_STATES.VIEW]: (
        <ViewJournalVoucher
          {...commonProps}
          setWriteTerm={setWriteTerm}
          setPageState={setPageState}
          hasEditPermission={hasEditPermission}
          hasDeletePermission={hasDeletePermission}
          hasPrintPermission={hasPrintPermission}
          hasViewPermission={hasViewPermission}
        />
      ),
      list: (
        <JournalVouchersTable
          setSearchTerm={setSearchTerm}
          setPageState={setPageState}
          date={date}
        />
      ),
      [PAGE_STATES.LIST]: (
        <JournalVouchersTable {...commonProps} setPageState={setPageState} />
      ),
      [PAGE_STATES.EDIT]: (
        <EditJournalVoucher
          {...commonProps}
          getAccountsByTypeOptions={getAccountsByTypeOptions}
          currencyOptions={currencyOptions}
          setShowMissingCurrencyRateModal={setShowMissingCurrencyRateModal}
          setCurrencyToSelect={setCurrencyToSelect}
          setShowAddLedgerModal={setShowAddLedgerModal}
          newlyCreatedAccount={newlyCreatedAccount}
          setPageState={setPageState}
          isDisabled={false}
          setIsDisabled={setIsDisabled}
          updatePrintSetting={updatePrintSetting}
          hasPrintPermission={hasPrintPermission}
          onFormDataChange={setFormData}
          restoreValuesFromStore={restoreValuesFromStore}
        />
      ),
    };

    return pageComponents[pageState] || null;
  }, [
    pageState,
    date,
    isDisabled,
    searchTerm,
    cloneJV,
    lastVoucherNumbers,
    getAccountsByTypeOptions,
    currencyOptions,
    newlyCreatedAccount,
    restoreValuesFromStore,
    updatePrintSetting,
    permissions,
  ]);

  const showBackButton = useMemo(
    () =>
      (pageState === PAGE_STATES.NEW && !isDisabled) ||
      pageState === PAGE_STATES.VIEW ||
      pageState === PAGE_STATES.LIST ||
      pageState === PAGE_STATES.EDIT,
    [pageState, isDisabled]
  );

  const handleBackButton = useCallback(() => {
    if (pageState === PAGE_STATES.EDIT) {
      setPageState(PAGE_STATES.VIEW);
    } else if (pageState === PAGE_STATES.NEW && !isDisabled) {
      setIsDisabled(true);
      setCloneJV('');
      setWriteCloneTerm('');
      setSearchTerm('');
      // Reset date when going back from new form, but not if returning from Rate of Exchange
      if (!isReturningFromRateExchange) {
        setDate(getTodayDate());
      }
    } else {
      // Reset date when going back, but not if returning from Rate of Exchange
      if (!isReturningFromRateExchange) {
        setDate(getTodayDate());
      }
      setPageState(PAGE_STATES.NEW);
      setWriteTerm('');
      setSearchTerm('');
      setCloneJV('');
      setWriteCloneTerm('');
    }
    // Reset the flag after using it
    setIsReturningFromRateExchange(false);
  }, [pageState, isDisabled, isReturningFromRateExchange]);

  const handleNewButton = useCallback(() => {
    // Reset date when clicking New, but not if returning from Rate of Exchange
    if (!isReturningFromRateExchange) {
      setDate(getTodayDate());
    }
    setIsDisabled(false);
    setCloneJV('');
    setWriteCloneTerm('');
    setSearchTerm('');
    // Reset the flag after using it
    setIsReturningFromRateExchange(false);
  }, [isReturningFromRateExchange]);

  const handleSearch = useCallback(() => {
    setSearchTerm(writeTerm);
    setCloneJV(writeCloneTerm);

    if (writeTerm === '') {
      setDate(getTodayDate());
      setPageState(PAGE_STATES.LIST);
    } else {
      setPageState(PAGE_STATES.VIEW);
    }
  }, [writeTerm, writeCloneTerm]);

  const handleCloneJV = useCallback(() => {
    setCloneJV(writeCloneTerm);
    setIsDisabled(false);
  }, [writeCloneTerm]);

  const handleModalClose = useCallback(() => {
    setShowAddLedgerModal('');
  }, []);

  const handleMissingCurrencyRate = useCallback(() => {
    if (pageState === PAGE_STATES.NEW) {
      saveFormValues('journalVoucher', { ...formData, date });
      setLastVisitedPage('journalVoucher', 'remittanceRateOfExchange');
    } else if (pageState === PAGE_STATES.EDIT) {
      saveFormValues('editJournalVoucher', { ...formData, date, searchTerm });
      setLastVisitedPage('editJournalVoucher', 'remittanceRateOfExchange');
    }
    navigate('/transactions/remittance-rate-of-exchange', {
      state: { currencyToSelect, date },
    });
  }, [
    pageState,
    formData,
    date,
    currencyToSelect,
    saveFormValues,
    setLastVisitedPage,
    navigate,
  ]);

  const renderAddLedgerForm = useCallback(() => {
    const modalProps = {
      inPopup: true,
      onCancel: handleModalClose,
    };

    switch (showAddLedgerModal) {
      case LEDGER_MODAL_TYPES.PARTY_LEDGER:
        return (
          <PartyLedgerForm
            {...modalProps}
            onSuccess={handlePartyLedgerSuccess}
          />
        );
      case LEDGER_MODAL_TYPES.WALK_IN_CUSTOMER:
        return (
          <WalkInCustomerForm
            {...modalProps}
            onSuccess={(account) =>
              handleNewLedgerSuccess(account, addLedgerRowId)
            }
          />
        );
      case LEDGER_MODAL_TYPES.GENERAL_LEDGER:
        return (
          <ChartOfAccountForm
            {...modalProps}
            onSuccess={(account) =>
              handleNewLedgerSuccess(account, addLedgerRowId)
            }
          />
        );
      default:
        return null;
    }
  }, [
    showAddLedgerModal,
    addLedgerRowId,
    handleModalClose,
    handlePartyLedgerSuccess,
    handleNewLedgerSuccess,
  ]);

  return (
    <>
      <section className="position-relative">
        <div
          style={{ height: 43 }}
          className="d-flex gap-3 justify-content-between align-items-center flex-wrap mb-4"
        >
          <div>
            {showBackButton && <BackButton handleBack={handleBackButton} />}
            <h2 className="screen-title mb-0">Journal Voucher</h2>
          </div>

          {hasCreatePermission &&
            pageState === PAGE_STATES.NEW &&
            isDisabled && (
              <div className="d-flex gap-2">
                <CustomButton text="New" onClick={handleNewButton} />
              </div>
            )}
        </div>
        <Row>
          <Col xs={12}>
            <div className="d-flex align-items-start justify-content-between flex-wrap-reverse mb-3">
              <div className="d-flex gap-3 align-items-end mt-3">
                <CustomInput
                  style={{ width: '180px' }}
                  type="text"
                  placeholder="Search"
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
                  onButtonClick={handleSearch}
                />
                {pageState === PAGE_STATES.NEW && (
                  <CustomInput
                    style={{ width: '180px' }}
                    type="text"
                    placeholder="Clone JV"
                    error={false}
                    borderRadius={10}
                    name="clonejv"
                    rightIcon={FaRegClone}
                    value={writeCloneTerm}
                    onChange={(e) => setWriteCloneTerm(e.target.value)}
                    onButtonClick={handleCloneJV}
                  />
                )}
              </div>
              <div>
                <CustomInput
                  name="Date"
                  label="Date"
                  type="date"
                  showBorders={false}
                  error={false}
                  borderRadius={10}
                  value={date}
                  readOnly={pageState === PAGE_STATES.VIEW}
                  onChange={(e) => setDate(e.target.value)}
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
        close={handleModalClose}
        size="xl"
      >
        {renderAddLedgerForm()}
      </CustomModal>

      {/* Missing Currency Rate Modal */}
      <CustomModal
        show={showMissingCurrencyRateModal}
        close={() => setShowMissingCurrencyRateModal(false)}
        title="Missing Rate of Exchange"
        description="Rate of exchange is missing for selected currency."
        variant="error"
        btn1Text="Update Rate of Exchange"
        action={handleMissingCurrencyRate}
      />
    </>
  );
};

export default JournalVoucher;
