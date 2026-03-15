import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { FaMagnifyingGlass } from 'react-icons/fa6';
import { useLocation, useNavigate } from 'react-router-dom';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import BackButton from '../../../Components/BackButton';
import BeneficiaryRegisterForm from '../../../Components/BeneficiaryRegisterForm/BeneficiaryRegisterForm';
import ChartOfAccountForm from '../../../Components/ChartOfAccountForm/ChartOfAccountForm';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import PartyLedgerForm from '../../../Components/PartyLedgerForm/PartyLedgerForm';
import WalkInCustomerForm from '../../../Components/WalkInCustomerForm/WalkInCustomerForm';
import {
  outwardRemittanceData,
  supportLogsData,
} from '../../../Mocks/MockData';
import { getOutwardRemittanceVoucherNumber } from '../../../Services/Transaction/OutwardRemittance';
import useFormStore from '../../../Stores/FormStore';
import OutwardRemittanceAdd from './OutwardRemittanceAdd';
import OutwardRemittanceAllocation from './OutwardRemittanceAllocation';
import OutwardRemittanceAllocationEdit from './OutwardRemittanceAllocationEdit';
import OutwardRemittanceEdit from './OutwardRemittanceEdit';
import OutwardRemittanceTable from './OutwardRemittanceTable';
import OutwardRemittanceView from './OutwardRemittanceView';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import useModulePermissions from '../../../Hooks/useModulePermissions';

const OutwardRemittance = () => {
  // usePageTitle('Outward Remittance');
  const navigate = useNavigate();
  const location = useLocation();

  const {
    setLastVisitedPage,
    saveFormValues,
    getFormValues,
    getLastVisitedPage,
  } = useFormStore();

  // ['new', 'view', 'edit', 'list', 'allocation','allocation-update']
  const [pageState, setPageState] = useState(
    location.state?.pageState || 'new'
  );
  const [remittanceRegisterId, setRemittanceRegisterId] = useState(
    location.state?.id || null
  ); //from outward remittance register pay button



  const [isDisabled, setIsDisabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [writeTerm, setWriteTerm] = useState(location.state?.searchTerm || '');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [valueDate, setValueDate] = useState(
    new Date().toLocaleDateString('en-CA')
  );
  const [lastVoucherNumbers, setLastVoucherNumbers] = useState(null);
  const [uploadAttachmentsModal, setUploadAttachmentsModal] = useState(false);
  const [addedAttachment, setAddedAttachment] = useState(null);
  const [newlyCreatedAccount, setNewlyCreatedAccount] = useState(null);
  const [newlyCreatedBeneficiary, setNewlyCreatedBeneficiary] = useState(null);
  const [showAddLedgerModal, setShowAddLedgerModal] = useState(false);
  const [showMissingCurrencyRateModal, setShowMissingCurrencyRateModal] =
    useState(false);
  const [pairMissingCurrencyRateModal, setPairMissingCurrencyRateModal] =
    useState(false);
  const [currencyToSelect, setCurrencyToSelect] = useState(null);
  const [formData, setFormData] = useState({});
  const [restoreValuesFromStore, setRestoreValuesFromStore] = useState(false);
  usePageTitle('Outward Remittance');

  // Permissions
  const permissions = useModulePermissions(
    'transactions',
    'outward_remittance'
  );
  const {
    view: hasViewPermission,
    create: hasCreatePermission,
    back_to_back_entry: hasBackToBackEntryPermission,
    edit: hasEditPermission,
    delete: hasDeletePermission,
    print: hasPrintPermission,
  } = permissions || {};
  // Success handlers for different components
  const handleOutwardRemittanceAddSuccess = (data, shouldGoToAllocation) => {
    if (shouldGoToAllocation) {
      if (data?.detail?.outward_remittance?.id) {
        setRemittanceRegisterId(data.detail.outward_remittance.id);
      }
      setPageState('allocation');
    } else {
      // Reset to new form for next entry
      setDate(new Date().toLocaleDateString('en-CA'));
      setValueDate(new Date().toLocaleDateString('en-CA'));
      setPageState('new');
      setWriteTerm('');
      setSearchTerm('');
      setIsDisabled(true);
    }
  };

  const handleOutwardRemittanceAllocationSuccess = (data) => {
    // Check if we came from the register page (via location state)
    const cameFromRegister = location.state?.fromRegister === true;

    if (cameFromRegister) {
      navigate('/transactions/outward-remittance-register');
    } else {
      setPageState('new');
      setIsDisabled(true);
      setDate(new Date().toLocaleDateString('en-CA'));
      setValueDate(new Date().toLocaleDateString('en-CA'));
      setWriteTerm('');
      setSearchTerm('');
      setRemittanceRegisterId(null);
      navigate('/transactions/outward-remittance');
    }
  };

  const handleOutwardRemittanceAllocationEditSuccess = (data) => {
    // Check if we came from the register page (via location state)
    const cameFromRegister = location.state?.fromRegister === true;

    if (cameFromRegister) {
      // Navigate back to the Outward Remittance Register
      navigate('/transactions/outward-remittance-register');
    } else {
      setPageState('new');
      setIsDisabled(true);
      setDate(new Date().toLocaleDateString('en-CA'));
      setValueDate(new Date().toLocaleDateString('en-CA'));
      setWriteTerm('');
      setSearchTerm('');
      setRemittanceRegisterId(null);
      navigate('/transactions/outward-remittance');
    }
  };

  const handleOutwardRemittanceEditSuccess = (data, shouldGoToAllocation) => {
    if (shouldGoToAllocation) {
      // After update, API returns the updated voucher directly in data.detail
      const updatedId = data?.detail?.navigate_id;

      if (updatedId) {
        setRemittanceRegisterId(updatedId);
      } else if (searchTerm) {
        // Fallback to previous behaviour if ID is missing
        setRemittanceRegisterId(searchTerm);
      }

      setPageState('allocation');
    } else {
      setPageState('view');
    }
  };

  const { transactionId } = location.state || {};

  // setting the write term
  useEffect(() => {
    if (transactionId) {
      setSearchTerm(transactionId);
      setWriteTerm(transactionId);
      setPageState('view');
    }
  }, []);

  // Get last voucher number //
  const {
    data: voucherNumber,
    isLoading: isLoadingVoucherNumber,
    isError: isErrorVoucherNumber,
    error: errorVoucherNumber,
  } = useQuery({
    queryKey: ['outward-remittance-voucherNumber', searchTerm],
    queryFn: () => getOutwardRemittanceVoucherNumber(searchTerm),
    retry: 1,
  });

  useEffect(() => {
    setLastVoucherNumbers({
      heading: `Last FSN Number: `,
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

  // Handle navigation from Rate of Exchange page
  useEffect(() => {
    // Check for outward remittance allocation
    const lastPageAllocation = getLastVisitedPage(
      'outward_remittance_allocation'
    );
    if (lastPageAllocation === 'rate-of-exchange') {
      const savedFormData = getFormValues('outward_remittance_allocation');
      if (savedFormData) {
        // Set page state and enable the table
        if (pageState === 'allocation') {
          setPageState('allocation');
        } else {
          setPageState('allocation-update');
        }
        setIsDisabled(false);
        setRestoreValuesFromStore(true);
        return;
      }
    }

    const lastPageNew = getLastVisitedPage('new_outward_remittance');
    if (lastPageNew === 'rate-of-exchange') {
      const savedFormData = getFormValues('new_outward_remittance');
      if (savedFormData) {
        // Set page state to new and enable the table
        setPageState('new');
        setIsDisabled(false);
        setRestoreValuesFromStore(true);
        return;
      }
    }

    const lastPageEdit = getLastVisitedPage('edit_outward_remittance');
    if (lastPageEdit === 'rate-of-exchange') {
      const savedFormData = getFormValues('edit_outward_remittance');
      if (savedFormData) {
        // Set page state to edit and enable the table
        setPageState('edit');
        setIsDisabled(false);
        setRestoreValuesFromStore(true);
        return;
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
              setShowAddLedgerModal('');
              setNewlyCreatedAccount(newlyCreatedAccount);
            }}
            onCancel={() => setShowAddLedgerModal('')}
          />
        );
      case 'add new wic':
        return (
          <WalkInCustomerForm
            inPopup
            onSuccess={(newlyCreatedAccount) => {
              setShowAddLedgerModal('');
              setNewlyCreatedAccount(newlyCreatedAccount);
            }}
            onCancel={() => setShowAddLedgerModal('')}
          />
        );
      case 'add new gl':
        return (
          <ChartOfAccountForm
            inPopup
            onSuccess={(newlyCreatedAccount) => {
              setShowAddLedgerModal('');
              setNewlyCreatedAccount(newlyCreatedAccount);
            }}
            onCancel={() => setShowAddLedgerModal('')}
          />
        );
      case 'add new beneficiary':
        return (
          <BeneficiaryRegisterForm
            inPopup
            onSuccess={(newlyCreatedAccount) => {
              setShowAddLedgerModal('');
              setNewlyCreatedBeneficiary(newlyCreatedAccount);
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
        <OutwardRemittanceAdd
          date={date}
          setDate={setDate}
          valueDate={valueDate}
          setValueDate={setValueDate}
          isDisabled={isDisabled}
          setIsDisabled={setIsDisabled}
          newlyCreatedAccount={newlyCreatedAccount}
          newlyCreatedBeneficiary={newlyCreatedBeneficiary}
          setShowAddLedgerModal={setShowAddLedgerModal}
          setShowMissingCurrencyRateModal={setShowMissingCurrencyRateModal}
          setPairMissingCurrencyRateModal={setPairMissingCurrencyRateModal}
          setCurrencyToSelect={setCurrencyToSelect}
          setPageState={setPageState}
          setWriteTerm={setWriteTerm}
          setSearchTerm={setSearchTerm}
          lastVoucherNumbers={lastVoucherNumbers}
          restoreValuesFromStore={restoreValuesFromStore}
          setRemittanceRegisterId={setRemittanceRegisterId}
          onSuccess={handleOutwardRemittanceAddSuccess}
          permissions={permissions}
          hasCreatePermission={hasCreatePermission}
          hasBackToBackEntryPermission={hasBackToBackEntryPermission}
          hasPrintPermission={hasPrintPermission}
        />
      ),
      view: (
        <OutwardRemittanceView
          setDate={setDate}
          setValueDate={setValueDate}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          setWriteTerm={setWriteTerm}
          outwardRemittanceData={outwardRemittanceData}
          setPageState={setPageState}
          lastVoucherNumbers={lastVoucherNumbers}
          permissions={permissions}
          hasViewPermission={hasViewPermission}
          hasEditPermission={hasEditPermission}
          hasDeletePermission={hasDeletePermission}
          hasPrintPermission={hasPrintPermission}
        />
      ),
      edit: (
        <OutwardRemittanceEdit
          date={date}
          valueDate={valueDate}
          setDate={setDate}
          setValueDate={setValueDate}
          outwardRemittanceData={outwardRemittanceData}
          setIsDisabled={setIsDisabled}
          setShowAddLedgerModal={setShowAddLedgerModal}
          setShowMissingCurrencyRateModal={setShowMissingCurrencyRateModal}
          setCurrencyToSelect={setCurrencyToSelect}
          setPageState={setPageState}
          setWriteTerm={setWriteTerm}
          setSearchTerm={setSearchTerm}
          searchTerm={searchTerm}
          lastVoucherNumbers={lastVoucherNumbers}
          restoreValuesFromStore={restoreValuesFromStore}
          setRemittanceRegisterId={setRemittanceRegisterId}
          onSuccess={handleOutwardRemittanceEditSuccess}
          permissions={permissions}
          hasEditPermission={hasEditPermission}
          hasPrintPermission={hasPrintPermission}
        />
      ),
      list: (
        <OutwardRemittanceTable
          date={date}
          setSearchTerm={setSearchTerm}
          setWriteTerm={setWriteTerm}
          setPageState={setPageState}
        />
      ),
      allocation: (
        <OutwardRemittanceAllocation
          outwardRemittanceData={outwardRemittanceData}
          isDisabled={false}
          setIsDisabled={setIsDisabled}
          setShowAddLedgerModal={setShowAddLedgerModal}
          setShowMissingCurrencyRateModal={setShowMissingCurrencyRateModal}
          setPairMissingCurrencyRateModal={setPairMissingCurrencyRateModal}
          setCurrencyToSelect={setCurrencyToSelect}
          setPageState={setPageState}
          remittanceRegisterId={remittanceRegisterId}
          onFormDataChange={setFormData}
          restoreValuesFromStore={restoreValuesFromStore}
          onSuccess={handleOutwardRemittanceAllocationSuccess}
          permissions={permissions}
          hasBackToBackEntryPermission={hasBackToBackEntryPermission}
          hasCreatePermission={hasCreatePermission}
        />
      ),
      'allocation-update': (
        <OutwardRemittanceAllocationEdit
          outwardRemittanceData={outwardRemittanceData}
          isDisabled={false}
          setIsDisabled={setIsDisabled}
          newlyCreatedAccount={newlyCreatedAccount}
          newlyCreatedBeneficiary={newlyCreatedBeneficiary}
          setShowAddLedgerModal={setShowAddLedgerModal}
          setShowMissingCurrencyRateModal={setShowMissingCurrencyRateModal}
          setPairMissingCurrencyRateModal={setPairMissingCurrencyRateModal}
          setCurrencyToSelect={setCurrencyToSelect}
          setPageState={setPageState}
          remittanceRegisterId={remittanceRegisterId}
          onFormDataChange={setFormData}
          restoreValuesFromStore={restoreValuesFromStore}
          onSuccess={handleOutwardRemittanceAllocationEditSuccess}
          permissions={permissions}
          hasEditPermission={hasEditPermission}
        />
      ),
    };

    return pageComponents[pageState] || null;
  };

  return (
    <div>
      <div
        className="d-flex gap-3 justify-content-between align-items-center flex-wrap mb-45"
        style={{ height: 43 }}
      >
        <div>
          <div>
            {(pageState === 'list' ||
              (pageState === 'new' && !isDisabled) ||
              pageState === 'view' ||
              pageState === 'allocation' ||
              pageState === 'allocation-update' ||
              pageState === 'edit') && (
                <BackButton
                  handleBack={() => {
                    if (
                      pageState === 'allocation' ||
                      pageState === 'allocation-update'
                    ) {
                      // Check if we came from the register page
                      const cameFromRegister = location.state?.fromRegister === true;

                      if (cameFromRegister) {
                        // Navigate back to the register
                        navigate(-1);
                      } else {
                        // Reset to new form (back-to-back transaction flow)
                        setDate(new Date().toLocaleDateString('en-CA'));
                        setValueDate(new Date().toLocaleDateString('en-CA'));
                        setPageState('new');
                        setWriteTerm('');
                        setSearchTerm('');
                        setIsDisabled(true);
                        setRemittanceRegisterId(null);
                      }
                    } else if (pageState === 'edit') {
                      // Go back to view mode
                      setPageState('view');
                    } else {
                      // Reset to new form
                      setDate(new Date().toLocaleDateString('en-CA'));
                      setValueDate(new Date().toLocaleDateString('en-CA'));
                      setPageState('new');
                      setWriteTerm('');
                      setSearchTerm('');
                      setIsDisabled(true);
                    }
                  }}
                />
              )}
            <h2 className="screen-title mb-0">
              Outward Remittance
              {pageState === 'allocation' || pageState === 'allocation-update'
                ? ' Allocation'
                : ''}
            </h2>
          </div>
        </div>
        <div className="d-flex align-items-center gap-3 voucher-navigation-wrapper align-items-center">
          {hasCreatePermission && isDisabled && pageState === 'new' && (
            <CustomButton
              text={'New'}
              onClick={() => {
                setDate(new Date().toLocaleDateString('en-CA'));
                setIsDisabled(false);
              }}
            />
          )}
        </div>
      </div>
      {/* Voucher Date Field */}
      {(pageState === 'allocation' || pageState === 'allocation-update') && (
        <div className="d-flex justify-content-end">
          <CustomInput
            label="Date"
            type="date"
            placeholder="Date"
            value={new Date().toLocaleDateString('en-CA')}
            showBorders={false}
            borderRadius={10}
            style={{ width: '180px', marginBottom: '0px' }}
          />
        </div>
      )}
      {/* Search Bar */}
      <div className="d-flex justify-content-between flex-wrap align-items-end mb-3 gap-3">
        {!['allocation', 'allocation-update'].includes(pageState) && (
          <CustomInput
            style={{ width: '180px' }}
            type="text"
            placeholder={`Search FSN`}
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
        )}
        <div className="d-flex gap-3 flex-wrap">
          {!['allocation', 'allocation-update', 'list'].includes(pageState) && (
            <CustomInput
              label="Value Date"
              type="date"
              placeholder="Value Date"
              error={false}
              value={valueDate}
              readOnly={pageState == 'view'}
              showBorders={false}
              onChange={(e) => setValueDate(e.target.value)}
              borderRadius={10}
            />
          )}

          {!['allocation', 'allocation-update'].includes(pageState) && (
            <CustomInput
              label="Date"
              type="date"
              placeholder="Date"
              value={date}
              error={false}
              readOnly={pageState == 'view'}
              showBorders={false}
              onChange={(e) => setDate(e.target.value)}
              borderRadius={10}
            />
          )}
        </div>
      </div>

      <>{renderPageContent()}</>

      {/* Upload Attachments Modal */}
      <CustomModal
        show={uploadAttachmentsModal}
        close={() => setUploadAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          {...(pageState === 'new' && { uploadOnly: true })}
          {...(pageState === 'view' && { item: supportLogsData[0] })}
          getUploadedFiles={setAddedAttachment}
          closeUploader={() => setUploadAttachmentsModal(false)}
        />
      </CustomModal>

      {/* Missing Currency Rate Modal */}
      <CustomModal
        show={showMissingCurrencyRateModal}
        close={() => setShowMissingCurrencyRateModal(false)}
        title={'Missing Rate of Exchange'}
        description={`${pairMissingCurrencyRateModal
          ? 'No exchange rate is available between the Buy currency and the selected currency.'
          : 'Rate of exchange is missing for selected currency.'
          }`}
        variant={'error'}
        btn1Text={'Update Rate of Exchange'}
        action={() => {
          switch (pageState) {
            case 'new':
              setLastVisitedPage('new_outward_remittance', 'rate-of-exchange');
              break;
            case 'edit':
              setLastVisitedPage('edit_outward_remittance', 'rate-of-exchange');
              break;
            case 'allocation':
              setLastVisitedPage(
                'outward_remittance_allocation',
                'rate-of-exchange'
              );
              saveFormValues('outward_remittance_allocation', {
                ...formData,
                date,
              });
              break;
            case 'allocation-update':
              setLastVisitedPage(
                'outward_remittance_allocation',
                'rate-of-exchange'
              );
              saveFormValues('outward_remittance_allocation', {
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

      {/* Add New Ledger Modal */}
      <CustomModal
        show={!!showAddLedgerModal}
        close={() => setShowAddLedgerModal('')}
        size="xl"
        style={{ minHeight: '812px' }}
      >
        {renderAddLedgerForm()}
      </CustomModal>
    </div>
  );
};

export default OutwardRemittance;
