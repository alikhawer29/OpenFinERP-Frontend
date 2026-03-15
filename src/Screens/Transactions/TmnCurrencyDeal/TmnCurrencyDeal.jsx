import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { FaMagnifyingGlass } from 'react-icons/fa6';
import { useLocation } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import BeneficiaryRegisterForm from '../../../Components/BeneficiaryRegisterForm/BeneficiaryRegisterForm';
import ChartOfAccountForm from '../../../Components/ChartOfAccountForm/ChartOfAccountForm';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import PartyLedgerForm from '../../../Components/PartyLedgerForm/PartyLedgerForm';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import WalkInCustomerForm from '../../../Components/WalkInCustomerForm/WalkInCustomerForm';
import useAccountsByType from '../../../Hooks/useAccountsByType';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { getTMNVoucherNumber } from '../../../Services/Transaction/TMNCurrencyDeal';
import useFormStore from '../../../Stores/FormStore';
import { getCurrencyOptions } from '../../../Utils/Utils';
import EditTmnCurrencyDeal from './EditTmnCurrencyDeal';
import NewTmnCurrencyDeal from './NewTmnCurrencyDeal';
import TmnCurrencyDealSearchTable from './TmnCurrencyDealSearchTable';
import ViewTmnCurrencyDeal from './ViewTmnCurrencyDeal';
import CombinedInputs from '../../../Components/CombinedInputs/CombinedInputs';
import useModulePermissions from '../../../Hooks/useModulePermissions';
// Add validation schema

const TmnCurrencyDeal = () => {
  usePageTitle('TMN Currency Deal');
  const { state } = useLocation();
  const currencyOptions = getCurrencyOptions();

  const location = useLocation();
  const { transactionId, transactionType } = location.state || {};

  const { getFormValues, getLastVisitedPage, saveFormValues } = useFormStore();

  const [pageState, setPageState] = useState('new');
  const [isDisabled, setIsDisabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [writeTerm, setWriteTerm] = useState(state?.searchTerm || '');

  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [showAddLedgerModal, setShowAddLedgerModal] = useState('');
  const [newlyCreatedAccount, setNewlyCreatedAccount] = useState(null);
  const [newlyCreatedBeneficiary, setNewlyCreatedBeneficiary] = useState(null);
  const [searchType, setSearchType] = useState('buy');
  const [lastVoucherNumbers, setLastVoucherNumbers] = useState(null);

  // Add a flag for restoring from store
  const [restoreValuesFromStore, setRestoreValuesFromStore] = useState(false);

  // Get account options using custom hook //
  const { getAccountsByTypeOptions } = useAccountsByType();

  // Get last voucher number //
  const {
    data: voucherNumber,
    isLoading: isLoadingVoucherNumber,
    isError: isErrorVoucherNumber,
    error: errorVoucherNumber,
  } = useQuery({
    queryKey: ['tmn-voucherNumber', searchTerm, searchType],
    queryFn: () => getTMNVoucherNumber(searchTerm, searchType),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // setting the write term
  useEffect(() => {
    if (transactionId && transactionType) {
      setSearchType(transactionType);
      setSearchTerm(transactionId);
      setWriteTerm(transactionId);
      setPageState('view');
    }
  }, []);

  useEffect(() => {
    setLastVoucherNumbers({
      heading: `Last ${searchType === 'buy' ? 'TSN' : 'TBN'} Number: `,
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

  // Handle return from Rate of Exchange page
  useEffect(() => {
    const lastPageOfNew = getLastVisitedPage('new_tmn_currency_deal');
    if (lastPageOfNew === 'rate-of-exchange') {
      const savedFormData = getFormValues('new_tmn_currency_deal');
      if (savedFormData) {
        // Set page state to new and enable the table
        setPageState('new');
        setIsDisabled(false);
        setRestoreValuesFromStore(true);
      }
    }
    const lastPageOfEdit = getLastVisitedPage('edit_tmn_currency_deal');
    if (lastPageOfEdit === 'rate-of-exchange') {
      const savedFormData = getFormValues('edit_tmn_currency_deal');
      if (savedFormData) {
        // Set page state to new and enable the table
        setPageState('edit');
        setIsDisabled(false);
        setRestoreValuesFromStore(true);
      }
    }
  }, []);

  // Permissions
  const permissions = useModulePermissions('transactions', 'tmn_currency_deal');
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
        <NewTmnCurrencyDeal
          searchType={searchType}
          state={state}
          date={date}
          setDate={setDate}
          isDisabled={isDisabled}
          setIsDisabled={setIsDisabled}
          setPageState={setPageState}
          setSearchTerm={setSearchTerm}
          setWriteTerm={setWriteTerm}
          currencyOptions={currencyOptions}
          getAccountsByTypeOptions={getAccountsByTypeOptions}
          newlyCreatedAccount={newlyCreatedAccount}
          newlyCreatedBeneficiary={newlyCreatedBeneficiary}
          setShowAddLedgerModal={setShowAddLedgerModal}
          lastVoucherNumbers={lastVoucherNumbers}
          restoreValuesFromStore={restoreValuesFromStore}
          permissions={permissions}
          hasPrintPermission={hasPrintPermission}
        />
      ),
      view: (
        <ViewTmnCurrencyDeal
          searchTerm={searchTerm}
          setDate={setDate}
          setWriteTerm={setWriteTerm}
          setSearchTerm={setSearchTerm}
          setPageState={setPageState}
          lastVoucherNumbers={lastVoucherNumbers}
          searchType={searchType}
          permissions={permissions}
          hasViewPermission={hasViewPermission}
          hasEditPermission={hasEditPermission}
          hasDeletePermission={hasDeletePermission}
          hasPrintPermission={hasPrintPermission}
        />
      ),
      list: (
        <TmnCurrencyDealSearchTable
          date={date}
          searchType={searchType}
          setSearchTerm={setSearchTerm}
          setWriteTerm={setWriteTerm}
          setPageState={setPageState}
          permissions={permissions}
        />
      ),
      edit: (
        <EditTmnCurrencyDeal
          state={state}
          date={date}
          setDate={setDate}
          isDisabled={false}
          setIsDisabled={setIsDisabled}
          setPageState={setPageState}
          setSearchTerm={setSearchTerm}
          setWriteTerm={setWriteTerm}
          searchTerm={searchTerm}
          searchType={searchType}
          currencyOptions={currencyOptions}
          getAccountsByTypeOptions={getAccountsByTypeOptions}
          newlyCreatedAccount={newlyCreatedAccount}
          newlyCreatedBeneficiary={newlyCreatedBeneficiary}
          setShowAddLedgerModal={setShowAddLedgerModal}
          lastVoucherNumbers={lastVoucherNumbers}
          restoreValuesFromStore={restoreValuesFromStore}
          permissions={permissions}
          hasViewPermission={hasViewPermission}
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
            <h2 className="screen-title mb-0">TMN Currency Deal</h2>
          </div>
          {hasCreatePermission && pageState == 'new' && isDisabled && (
            <div className="d-flex gap-2">
              <CustomButton
                text="New"
                onClick={() => {
                  setDate(new Date().toLocaleDateString('en-CA'));
                  setIsDisabled(false);
                }}
                className="mb-0"
              />
            </div>
          )}
        </div>

        <div className="d-flex justify-content-between flex-wrap align-items-end mb-3 gap-3">
          <div className="d-flex gap-3">
            <CombinedInputs
              type1="select"
              type2="input"
              name1="searchType"
              name2="search"
              rightIcon={FaMagnifyingGlass}
              value1={searchType}
              value2={writeTerm}
              options1={[
                { label: 'Buy', value: 'buy' },
                { label: 'Sell', value: 'sell' },
              ]}
              placeholder1="Select Type"
              placeholder2={`Search ${searchType === 'buy' ? 'TSN' : 'TBN'}`}
              className1="ledger"
              className2="account"
              onChange1={(selected) => {
                setSearchType(selected.value);
                setSearchTerm('');
              }}
              onChange2={(e) => setWriteTerm(e.target.value)}
              onButtonClick={() => {
                setSearchTerm(writeTerm);
                if (writeTerm === '') {
                  setPageState('list');
                  setDate(new Date().toLocaleDateString('en-CA'));
                } else {
                  setPageState('view');
                }
              }}
              isDisabled={pageState == 'edit'}
            />
          </div>

          <CustomInput
            name="Date"
            label={'Date'}
            type="date"
            readOnly={pageState == 'view'}
            showBorders={false}
            error={false}
            borderRadius={10}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
            }}
          />
        </div>
        {renderPageContent()}
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
    </>
  );
};

export default TmnCurrencyDeal;
