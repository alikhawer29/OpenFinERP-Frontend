import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { FaMagnifyingGlass } from 'react-icons/fa6';
import { useLocation, useNavigate } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import ChartOfAccountForm from '../../../Components/ChartOfAccountForm/ChartOfAccountForm';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import PartyLedgerForm from '../../../Components/PartyLedgerForm/PartyLedgerForm';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import WalkInCustomerForm from '../../../Components/WalkInCustomerForm/WalkInCustomerForm';
import useAccountsByType from '../../../Hooks/useAccountsByType';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { getForeignCurrencyDealVoucherNumber } from '../../../Services/Transaction/ForeignCurrencyDeal';
import useFormStore from '../../../Stores/FormStore';
import { getCurrencyOptions } from '../../../Utils/Utils';
import EditForeignCurrencyDeal from './EditForeignCurrencyDeal';
import ForeignCurrencyDealSearchTable from './ForeignCurrencyDealSearchTable';
import NewForeignCurrencyDeal from './NewForeignCurrencyDeal';
import ViewForeignCurrencyDeal from './ViewForeignCurrencyDeal';
import useModulePermissions from '../../../Hooks/useModulePermissions';

const ForeignCurrencyDeal = () => {
  usePageTitle('Foreign Currency Deal');
  const { state } = useLocation();
  const navigate = useNavigate();
  const location = useLocation();
  const currencyOptions = getCurrencyOptions();

  const { getFormValues, getLastVisitedPage, saveFormValues } = useFormStore();

  // Get account options using custom hook //
  const { getAccountsByTypeOptions } = useAccountsByType();

  const [pageState, setPageState] = useState('new');
  const [isDisabled, setIsDisabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [writeTerm, setWriteTerm] = useState(state?.searchTerm || '');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [showAddLedgerModal, setShowAddLedgerModal] = useState('');
  const [newlyCreatedAccount, setNewlyCreatedAccount] = useState(null);
  const [newlyCreatedBeneficiary, setNewlyCreatedBeneficiary] = useState(null);
  const [newDealType, setNewDealType] = useState('single');
  const [lastVoucherNumbers, setLastVoucherNumbers] = useState(null);

  const [restoreValuesFromStore, setRestoreValuesFromStore] = useState(false); // Flag for restoring from store

  // Get last voucher number //
  const {
    data: voucherNumber,
    isLoading: isLoadingVoucherNumber,
    isError: isErrorVoucherNumber,
    error: errorVoucherNumber,
  } = useQuery({
    queryKey: ['foreign-currency-deal-voucherNumber', searchTerm],
    queryFn: () => getForeignCurrencyDealVoucherNumber(searchTerm),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  useEffect(() => {
    setLastVoucherNumbers({
      heading: `Last CBS Number: `,
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

  // Handle return from Rate of Exchange page
  useEffect(() => {
    const lastPageOfNew = getLastVisitedPage('new_foreign_currency_deal');
    if (lastPageOfNew === 'rate-of-exchange') {
      const savedFormData = getFormValues('new_foreign_currency_deal');
      if (savedFormData) {
        // Set page state to new and enable the table
        setPageState('new');
        setIsDisabled(false);
        setRestoreValuesFromStore(true);
        if (savedFormData.date) {
          setDate(savedFormData.date);
        }
      }
    }
    const lastPageOfEdit = getLastVisitedPage('edit_foreign_currency_deal');
    if (lastPageOfEdit === 'rate-of-exchange') {
      const savedFormData = getFormValues('edit_foreign_currency_deal');
      if (savedFormData) {
        // Set page state to edit and enable the table
        setPageState('edit');
        setIsDisabled(false);
        setRestoreValuesFromStore(true);
        if (savedFormData.date) {
          setDate(savedFormData.date);
        }
      }
    }
  }, []);

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
  const permissions = useModulePermissions('transactions', 'foreign_currency_deal');
  const {
    edit: hasEditPermission,
    create: hasCreatePermission,
    delete: hasDeletePermission,
    print: hasPrintPermission,
    view: hasViewPermission,
    create_single_deal: hasCreateSingleDealPermission,
    create_multiple_deals: hasCreateMultipleDealsPermission,
  } = permissions || {};

  // Get deal type options based on permissions
  const getDealTypeOptions = () => {
    const options = [];
    if (hasCreateSingleDealPermission) {
      options.push({ label: 'Single', value: 'single' });
    }
    if (hasCreateMultipleDealsPermission) {
      options.push({ label: 'Multi', value: 'multi' });
    }
    return options;
  };

  // Set default deal type based on permissions
  useEffect(() => {
    if (!hasCreateSingleDealPermission && !hasCreateMultipleDealsPermission) {
      // No permissions, keep default
      return;
    }
    if (hasCreateSingleDealPermission && !hasCreateMultipleDealsPermission) {
      // Only single permission
      setNewDealType('single');
    } else if (!hasCreateSingleDealPermission && hasCreateMultipleDealsPermission) {
      // Only multi permission
      setNewDealType('multi');
    }
    // If both permissions, keep current value or default to 'single'
  }, [hasCreateSingleDealPermission, hasCreateMultipleDealsPermission]);

  // Placeholder for rendering page content
  const renderPageContent = () => {
    const pageComponents = {
      new: (
        <NewForeignCurrencyDeal
          state={state}
          date={date}
          setDate={setDate}
          newDealType={newDealType}
          setNewDealType={setNewDealType}
          isDisabled={isDisabled}
          setIsDisabled={setIsDisabled}
          setPageState={setPageState}
          setSearchTerm={setSearchTerm}
          setWriteTerm={setWriteTerm}
          getAccountsByTypeOptions={getAccountsByTypeOptions}
          newlyCreatedAccount={newlyCreatedAccount}
          setShowAddLedgerModal={setShowAddLedgerModal}
          currencyOptions={currencyOptions}
          lastVoucherNumbers={lastVoucherNumbers}
          restoreValuesFromStore={restoreValuesFromStore}
          permissions={permissions}
          hasPrintPermission={hasPrintPermission}
          hasCreateSingleDealPermission={hasCreateSingleDealPermission}
          hasCreateMultipleDealsPermission={hasCreateMultipleDealsPermission}
        />
      ),
      view: (
        <ViewForeignCurrencyDeal
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
        <ForeignCurrencyDealSearchTable
          date={date}
          setPageState={setPageState}
          setSearchTerm={setSearchTerm}
          setWriteTerm={setWriteTerm}
          permissions={permissions}
        />
      ),
      edit: (
        <EditForeignCurrencyDeal
          state={state}
          date={date}
          setDate={setDate}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          setWriteTerm={setWriteTerm}
          setPageState={setPageState}
          getAccountsByTypeOptions={getAccountsByTypeOptions}
          newlyCreatedAccount={newlyCreatedAccount}
          newlyCreatedBeneficiary={newlyCreatedBeneficiary}
          setShowAddLedgerModal={setShowAddLedgerModal}
          currencyOptions={currencyOptions}
          lastVoucherNumbers={lastVoucherNumbers}
          restoreValuesFromStore={restoreValuesFromStore}
          permissions={permissions}
          hasViewPermission={hasViewPermission}
          hasPrintPermission={hasPrintPermission}
          hasCreateSingleDealPermission={hasCreateSingleDealPermission}
          hasCreateMultipleDealsPermission={hasCreateMultipleDealsPermission}
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
            <h2 className="screen-title mb-0">Foreign Currency Deal</h2>
          </div>
          {(hasCreateSingleDealPermission || hasCreateMultipleDealsPermission) && pageState === 'new' && isDisabled && (
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
            <CustomInput
              style={{ width: '180px' }}
              type="text"
              placeholder={`Search`}
              error={false}
              showBorders={false}
              value={writeTerm}
              borderRadius={10}
              name="search"
              rightIcon={FaMagnifyingGlass}
              onChange={(e) => {
                setWriteTerm(e.target.value);
              }}
              onButtonClick={() => {
                setSearchTerm(writeTerm);
                if (writeTerm === '') {
                  setPageState('list');
                  setDate(new Date().toLocaleDateString('en-CA'));
                } else {
                  setPageState('view');
                }
              }}
            />
          </div>

          <div className="d-flex flex-wrap align-items-end  gap-3">
            {pageState === 'new' && getDealTypeOptions().length > 0 && (
              <SearchableSelect
                name="newDealType"
                options={getDealTypeOptions()}
                showBorders={false}
                borderRadius={10}
                isDisabled={!isDisabled || (!hasCreateSingleDealPermission && !hasCreateMultipleDealsPermission)}
                value={newDealType}
                onChange={(selected) => {
                  setNewDealType(selected.value);
                }}
              />
            )}
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

export default ForeignCurrencyDeal;
