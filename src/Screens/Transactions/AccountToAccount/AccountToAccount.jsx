import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { FaMagnifyingGlass } from 'react-icons/fa6';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import withFilters from '../../../HOC/withFilters ';
import withModal from '../../../HOC/withModal';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { getAAVoucherNumber } from '../../../Services/Transaction/AccountToAccount';
import AccountToAccountTable from './AccountToAccountTable';
import EditAccountToAccount from './EditAccountToAccount';
import NewAccountToAccount from './NewAccountToAccount';
import ViewAccountToAccount from './ViewAccountToAccount';
import WalkInCustomerForm from '../../../Components/WalkInCustomerForm/WalkInCustomerForm';
import PartyLedgerForm from '../../../Components/PartyLedgerForm/PartyLedgerForm';
import ChartOfAccountForm from '../../../Components/ChartOfAccountForm/ChartOfAccountForm';
import { getCurrencyOptions } from '../../../Utils/Utils';
import { useLocation } from 'react-router-dom';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import useFormStore from '../../../Stores/FormStore';

const AccountToAccount = () => {
  usePageTitle('Account to Account');
  const currencyOptions = getCurrencyOptions();
  const [pageState, setPageState] = useState('new');
  const { state } = useLocation();

  // Form store for checking navigation from Rate page
  const { getLastVisitedPage, clearLastVisitedPage } = useFormStore();
  const formId = 'account_to_account';

  const [isDisabled, setIsDisabled] = useState(true);
  const [writeTerm, setWriteTerm] = useState(state?.searchTerm || ''); // To Make search term only work on ButtonClick
  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [showAddLedgerModal, setShowAddLedgerModal] = useState('');
  const [uploadAttachmentsModal, setUploadAttachmentsModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState(null);
  const [newlyCreatedAccount, setNewlyCreatedAccount] = useState(null);
  const [attachmentsModal, setAttachmentsModal] = useState(false);

  // Add a flag to prevent date reset when returning from Rate of Exchange page
  const [isReturningFromRateExchange, setIsReturningFromRateExchange] = useState(false);

  const [lastVoucherNumbers, setLastVoucherNumbers] = useState({
    heading: 'Last A2A Number: ',
    last: '',
    current: '',
    previous: '',
    next: '',
    isLoadingVoucherNumber: false,
    isErrorVoucherNumber: false,
    errorVoucherNumber: null,
  });

  const {
    data: voucherNumber,
    isLoading: isLoadingVoucherNumber,
    isError: isErrorVoucherNumber,
    error: errorVoucherNumber,
  } = useQuery({
    queryKey: ['accountToAccountVoucherNumber', searchTerm],
    queryFn: () => getAAVoucherNumber(searchTerm),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  useEffect(() => {
    setLastVoucherNumbers({
      heading: 'Last A2A Number: ',
      last: voucherNumber?.default_voucher_no,
      current: voucherNumber?.current_voucher_no,
      previous: voucherNumber?.previous_voucher_no,
      next: voucherNumber?.next_voucher_no,
      isLoadingVoucherNumber: isLoadingVoucherNumber,
      isErrorVoucherNumber: isErrorVoucherNumber,
      error: errorVoucherNumber,
    });
  }, [
    voucherNumber,
    isLoadingVoucherNumber,
    isErrorVoucherNumber,
    errorVoucherNumber,
  ]);

  // Check if returning from Rate of Exchange page
  useEffect(() => {
    const lastPageNew = getLastVisitedPage('account_to_account');
    const lastPageEdit = getLastVisitedPage('edit-account_to_account');

    if (lastPageNew === 'rate-of-exchange') {
      // Returning from rate page to New page
      setIsReturningFromRateExchange(true);
      setPageState('new');
      setIsDisabled(false);
      // Reset the flag after a short delay
      setTimeout(() => {
        setIsReturningFromRateExchange(false);
      }, 100);
    } else if (lastPageEdit === 'rate-of-exchange') {
      // Returning from rate page to Edit page  
      setIsReturningFromRateExchange(true);
      setPageState('edit');
      setIsDisabled(false);
      // Reset the flag after a short delay
      setTimeout(() => {
        setIsReturningFromRateExchange(false);
      }, 100);
    }
  }, [getLastVisitedPage]);

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
  const permissions = useModulePermissions('transactions', 'account_to_account');
  const {
    create: hasCreatePermission,
    edit: hasEditPermission,
    delete: hasDeletePermission,
    print: hasPrintPermission,
    view: hasViewPermission,
  } = permissions;
  const renderPageContent = () => {
    const pageComponents = {
      new: (
        <NewAccountToAccount
          date={date}
          setDate={setDate}
          isDisabled={isDisabled}
          setIsDisabled={setIsDisabled}
          currencyOptions={currencyOptions}
          setShowAddLedgerModal={setShowAddLedgerModal}
          uploadAttachmentsModal={uploadAttachmentsModal}
          setUploadAttachmentsModal={setUploadAttachmentsModal}
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
          lastVoucherNumbers={lastVoucherNumbers}
          setPageState={setPageState}
          setSearchTerm={setSearchTerm}
          newlyCreatedAccount={newlyCreatedAccount}
          permissions={permissions}
          hasPrintPermission={hasPrintPermission}
        />
      ),
      view: (
        <ViewAccountToAccount
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          setWriteTerm={setWriteTerm}
          setPageState={setPageState}
          lastVoucherNumbers={lastVoucherNumbers}
          attachmentsModal={attachmentsModal}
          setAttachmentsModal={setAttachmentsModal}
          permissions={permissions}
          hasPrintPermission={hasPrintPermission}
          hasEditPermission={hasEditPermission}
          hasDeletePermission={hasDeletePermission}
          hasViewPermission={hasViewPermission}
          hasCreatePermission={hasCreatePermission}
        />
      ),
      list: (
        <AccountToAccountTable
          date={date}
          setPageState={setPageState}
          setSearchTerm={setSearchTerm}
          setWriteTerm={setWriteTerm}
          permissions={permissions}
          hasPrintPermission={hasPrintPermission}
        />
      ),
      edit: (
        <EditAccountToAccount
          state={state}
          date={date}
          setDate={setDate}
          setPageState={setPageState}
          currencyOptions={currencyOptions}
          setShowAddLedgerModal={setShowAddLedgerModal}
          lastVoucherNumbers={lastVoucherNumbers}
          setSearchTerm={setSearchTerm}
          setWriteTerm={setWriteTerm}
          searchTerm={searchTerm}
          isDisabled={false}
          setIsDisabled={setIsDisabled}
          newlyCreatedAccount={newlyCreatedAccount}
          permissions={permissions}
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
          className="d-flex gap-3 flex-sm-nowrap flex-wrap justify-content-between align-items-center mb-4"
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
                      // Reset date only if not returning from rate exchange
                      if (!isReturningFromRateExchange) {
                        setDate(new Date().toLocaleDateString('en-CA'));
                      }
                      setIsDisabled(true);
                    } else {
                      // Reset date only if not returning from rate exchange
                      if (!isReturningFromRateExchange) {
                        setDate(new Date().toLocaleDateString('en-CA'));
                      }
                      setPageState('new');
                      setWriteTerm('');
                      setSearchTerm('');
                    }
                  }}
                />
              )}
            <h2 className="screen-title mb-0">Account to Account</h2>
          </div>
          {hasCreatePermission && pageState === 'new' && isDisabled && (
            <CustomButton text={'New'} onClick={() => {
              setDate(new Date().toLocaleDateString('en-CA'));
              setIsDisabled(false);
            }} />
          )}
        </div>
        <div className="d-flex justify-content-between align-items-end gap-3 mb-3">
          <CustomInput
            type="text"
            placeholder="Search A2A"
            value={writeTerm}
            style={{ width: '180px' }}
            showBorders={false}
            borderRadius={10}
            error={false}
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

          <CustomInput
            type="date"
            label="Date"
            showBorders={false}
            borderRadius={10}
            error={false}
            value={date}
            readOnly={pageState === 'view'}
            onChange={(e) => setDate(e.target.value)}
          />

        </div>
        <>{renderPageContent()}</>
      </section>

      {/* Add New Ledger Modal */}
      <CustomModal
        show={!!showAddLedgerModal}
        close={() => setShowAddLedgerModal('')}
        size="xl"
      // style={{ maxHeight: '812px' }}
      >
        {renderAddLedgerForm()}
      </CustomModal>
    </>
  );
};

export default withFilters(withModal(AccountToAccount));
