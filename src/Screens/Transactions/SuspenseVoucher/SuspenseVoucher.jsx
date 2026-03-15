import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Col, Row } from 'react-bootstrap';
import { FaMagnifyingGlass } from 'react-icons/fa6';
import BackButton from '../../../Components/BackButton';
import ChartOfAccountForm from '../../../Components/ChartOfAccountForm/ChartOfAccountForm';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import PartyLedgerForm from '../../../Components/PartyLedgerForm/PartyLedgerForm';
import WalkInCustomerForm from '../../../Components/WalkInCustomerForm/WalkInCustomerForm';
import { showToast } from '../../../Components/Toast/Toast';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { addOfficeLocationMaster } from '../../../Services/Masters/OfficeLocationMaster';
import {
  getAccountsbyType,
  getOfficeLocations,
  // addOfficeLocation,
  getSuspenseVoucherListing,
  getSVVoucherNumber,
} from '../../../Services/Transaction/SuspenseVoucher';
import useFormStore from '../../../Stores/FormStore';
import useSettingsStore from '../../../Stores/SettingsStore';
import { getCurrencyOptions, showErrorToast } from '../../../Utils/Utils';
import { addOfficeLocationValidationSchema } from '../../../Utils/Validations/ValidationSchemas';
import '../transactionStyles.css';
import EditSuspenseVoucher from './EditSuspenseVoucher';
import NewSuspenseVoucher from './NewSuspenseVoucher';
import SuspenseVouchersTable from './SuspenseVouchersTable';
import ViewSuspenseVoucher from './ViewSuspenseVoucher';
import { PulseLoader } from 'react-spinners';
import useModulePermissions from '../../../Hooks/useModulePermissions';

const SuspenseVoucher = () => {
  usePageTitle('Suspense Voucher');
  const navigate = useNavigate();
  const currencyOptions = getCurrencyOptions();
  const { updatePrintSetting } = useSettingsStore();
  const queryClient = useQueryClient();

  // Access the form store for saving form data before navigation
  const {
    saveFormValues,
    getFormValues,
    setLastVisitedPage,
    getLastVisitedPage,
  } = useFormStore();

  // [new, view, edit, listing]
  // View is for specific Suspense Voucher search and view it's detail
  // Edit is for editing the specific Suspense Voucher's detail
  // Listing is for Suspense Voucher listing table
  const [pageState, setPageState] = useState('new');

  const [isDisabled, setIsDisabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [writeTerm, setWriteTerm] = useState('');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  // Add a new state to hold form data for saving
  const [formData, setFormData] = useState({});
  const [lastVoucherNumbers, setLastVoucherNumbers] = useState(null);
  const [showAddLedgerModal, setShowAddLedgerModal] = useState('');
  const [newlyCreatedAccount, setNewlyCreatedAccount] = useState(null);
  const [showAddOfficeLocationModal, setShowAddOfficeLocationModal] =
    useState(false);
  // Upload Only Modal
  const [uploadAttachmentsModal, setUploadAttachmentsModal] = useState(false);
  // Upload And View Modal
  const [attachmentsModal, setAttachmentsModal] = useState(false);
  // Selected files from UploadAttachments Modal
  const [selectedFiles, setSelectedFiles] = useState(null);

  // Missing Rate of Exchange modal state (following Receipt Voucher pattern)
  const [currencyToSelect, setCurrencyToSelect] = useState(null);
  const [showMissingCurrencyRateModal, setShowMissingCurrencyRateModal] =
    useState(false);

  // Add a flag for restoring from store (following Receipt Voucher pattern)
  const [restoreValuesFromStore, setRestoreValuesFromStore] = useState(false);

  // Add a flag to prevent date reset when returning from Rate of Exchange page
  const [isReturningFromRateExchange, setIsReturningFromRateExchange] = useState(false);

  // Query for voucher number
  const {
    data: voucherNumber,
    isLoading: isLoadingVoucherNumber,
    isError: isErrorVoucherNumber,
    error: errorVoucherNumber,
  } = useQuery({
    queryKey: ['suspenseVoucherNumber', searchTerm],
    queryFn: () => getSVVoucherNumber(searchTerm),
    retry: 1,
  });

  // Update last voucher numbers
  useEffect(() => {
    setLastVoucherNumbers({
      heading: 'Last SVR Number: ',
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

  // Queries for accounts by type
  const {
    data: partyAccounts,
    isLoading: isLoadingPartyAccounts,
    isError: isErrorPartyAccounts,
    error: errorPartyAccounts,
  } = useQuery({
    queryKey: ['suspenseVoucherAccounts', 'party'],
    queryFn: () => getAccountsbyType('party'),
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: walkinAccounts,
    isLoading: isLoadingWalkinAccounts,
    isError: isErrorWalkinAccounts,
    error: errorWalkinAccounts,
  } = useQuery({
    queryKey: ['suspenseVoucherAccounts', 'walkin'],
    queryFn: () => getAccountsbyType('walkin'),
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: generalAccounts,
    isLoading: isLoadingGeneralAccounts,
    isError: isErrorGeneralAccounts,
    error: errorGeneralAccounts,
  } = useQuery({
    queryKey: ['suspenseVoucherAccounts', 'general'],
    queryFn: () => getAccountsbyType('general'),
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  // Query for office locations
  const {
    data: officeLocations,
    isLoading: isLoadingOfficeLocations,
    isError: isErrorOfficeLocations,
    error: errorOfficeLocations,
  } = useQuery({
    queryKey: ['suspenseVoucherOfficeLocations'],
    queryFn: getOfficeLocations,
    refetchOnWindowFocus: false,
    queryInvalidateOnMount: true,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  // Query for suspense voucher data (for edit mode)
  const {
    data: { data: [suspenseVoucherData] = [] } = {},
    isLoading: isLoadingSuspenseVoucher,
    isError: isErrorSuspenseVoucher,
    error: errorSuspenseVoucher,
  } = useQuery({
    queryKey: ['suspenseVoucher', searchTerm],
    queryFn: () => getSuspenseVoucherListing({ search: searchTerm }),
    staleTime: 1000 * 60 * 5,
    enabled: pageState === 'edit' && !!searchTerm,
  });

  // Add Office Location Mutation
  const addOfficeLocationMutation = useMutation({
    mutationFn: addOfficeLocationMaster,
    onSuccess: () => {
      setShowAddOfficeLocationModal(false);
      showToast('New Office Location Added', 'success');
      queryClient.invalidateQueries(['suspenseVoucherOfficeLocations']);
    },
    onError: (error) => {
      setShowAddOfficeLocationModal(false);
      showErrorToast(error);
    },
  });

  const handleAddOfficeLocation = (values) => {
    addOfficeLocationMutation.mutate(values);
  };

  const suspenseVoucher = suspenseVoucherData?.suspense_vouchers;

  // Organize accounts data
  const accountsData = {
    party: {
      data: partyAccounts,
      loading: isLoadingPartyAccounts,
      error: isErrorPartyAccounts,
      errorMessage: errorPartyAccounts,
    },
    walkin: {
      data: walkinAccounts,
      loading: isLoadingWalkinAccounts,
      error: isErrorWalkinAccounts,
      errorMessage: errorWalkinAccounts,
    },
    general: {
      data: generalAccounts,
      loading: isLoadingGeneralAccounts,
      error: isErrorGeneralAccounts,
      errorMessage: errorGeneralAccounts,
    },
  };

  // Helper function to get accounts by type options
  const getAccountsByTypeOptions = (AccountType) => {
    if (!AccountType) {
      return [{ label: 'Select Account', value: null, isDisabled: true }];
    }

    const { data, loading, error, errorMessage } =
      accountsData[AccountType] || {};

    if (loading) {
      return [{ label: 'Loading...', value: null, isDisabled: true }];
    }

    if (error) {
      console.error('Unable to fetch Accounts', errorMessage);
      return [{ label: 'Unable to fetch Accounts', value: null }];
    }
    let options =
      data?.map((x) => ({
        value: x?.id?.toString(),
        label: x?.title || x?.account_name,
      })) || [];

    switch (AccountType) {
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
      default:
        break;
    }

    return options;
  };

  // Helper function to get office location options
  const getOfficeLocationOptions = () => {
    if (isLoadingOfficeLocations) {
      return [{ label: 'Loading...', value: null, isDisabled: true }];
    }

    if (isErrorOfficeLocations) {
      console.error('Unable to fetch Office Locations', errorOfficeLocations);
      return [{ label: 'Unable to fetch Office Locations', value: null }];
    }

    let options =
      officeLocations?.map((x) => ({
        value: x?.id?.toString(),
        label: x?.office_location,
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
      default:
        break;
    }
  };

  // Memoized callback to prevent infinite loops
  const handleFormDataChange = useCallback(
    (formData) => {
      setFormData(formData);
      saveFormValues('suspense-voucher', formData);
    },
    [saveFormValues]
  );

  // Handle navigation from Rate of Exchange page (following Receipt Voucher pattern)
  useEffect(() => {
    const lastPageNew = getLastVisitedPage('suspense-voucher');
    const lastPageEdit = getLastVisitedPage('edit-suspense-voucher');

    if (lastPageNew === 'rate-of-exchange') {
      const savedFormData = getFormValues('suspense-voucher');
      if (savedFormData) {
        // Set flag to prevent date reset
        setIsReturningFromRateExchange(true);
        // Restore the date from saved form data
        if (savedFormData.date) {
          setDate(savedFormData.date);
        }
        // Set page state to new and enable the form
        setPageState('new');
        setIsDisabled(false);
        setRestoreValuesFromStore(true);
      }
    } else if (lastPageEdit === 'rate-of-exchange') {
      const savedFormData = getFormValues('edit-suspense-voucher');
      if (savedFormData) {
        // Set flag to prevent date reset
        setIsReturningFromRateExchange(true);
        // Restore the date from saved form data
        if (savedFormData.date) {
          setDate(savedFormData.date);
        }
        // Restore searchTerm to ensure voucher data is fetched
        if (savedFormData.searchTerm) {
          setSearchTerm(savedFormData.searchTerm);
          setWriteTerm(savedFormData.searchTerm); // Also set writeTerm to display in search field
        }
        // Set page state to edit and enable the form
        setPageState('edit');
        setIsDisabled(false);
        setRestoreValuesFromStore(true);
      }
    }
  }, [getLastVisitedPage, getFormValues, setPageState, setIsDisabled, setRestoreValuesFromStore]);

  // Sync writeTerm with searchTerm when searchTerm changes (e.g., when restoring from rate page)
  useEffect(() => {
    if (searchTerm && searchTerm !== writeTerm) {
      setWriteTerm(searchTerm);
    }
  }, [searchTerm]);

  // Permissions
  const permissions = useModulePermissions('transactions', 'suspense_voucher');
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
        <NewSuspenseVoucher
          date={date}
          setDate={setDate}
          currencyOptions={currencyOptions}
          getAccountsByTypeOptions={getAccountsByTypeOptions}
          getOfficeLocationOptions={getOfficeLocationOptions}
          isDisabled={isDisabled}
          setIsDisabled={setIsDisabled}
          setShowAddOfficeLocationModal={setShowAddOfficeLocationModal}
          setShowAddLedgerModal={setShowAddLedgerModal}
          newlyCreatedAccount={newlyCreatedAccount}
          uploadAttachmentsModal={uploadAttachmentsModal}
          setUploadAttachmentsModal={setUploadAttachmentsModal}
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
          lastVoucherNumbers={lastVoucherNumbers}
          setPageState={setPageState}
          setSearchTerm={setSearchTerm}
          updatePrintSetting={updatePrintSetting}
          onFormDataChange={handleFormDataChange}
          restoreValuesFromStore={restoreValuesFromStore}
          setCurrencyToSelect={setCurrencyToSelect}
          setShowMissingCurrencyRateModal={setShowMissingCurrencyRateModal}
          permissions={permissions}
          hasPrintPermission={hasPrintPermission}
        />
      ),
      view: (
        <ViewSuspenseVoucher
          searchTerm={searchTerm}
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
        <SuspenseVouchersTable
          date={date}
          setPageState={setPageState}
          setWriteTerm={setWriteTerm}
          setSearchTerm={setSearchTerm}
          permissions={permissions}
        />
      ),
      edit: (
        <EditSuspenseVoucher
          date={date}
          setDate={setDate}
          currencyOptions={currencyOptions}
          getAccountsByTypeOptions={getAccountsByTypeOptions}
          getOfficeLocationOptions={getOfficeLocationOptions}
          setPageState={setPageState}
          setShowAddOfficeLocationModal={setShowAddOfficeLocationModal}
          setShowAddLedgerModal={setShowAddLedgerModal}
          newlyCreatedAccount={newlyCreatedAccount}
          setAddLedgerRowId={() => { }}
          lastVoucherNumbers={lastVoucherNumbers}
          setSearchTerm={setSearchTerm}
          searchTerm={searchTerm}
          isDisabled={false}
          setIsDisabled={setIsDisabled}
          updatePrintSetting={updatePrintSetting}
          setCurrencyToSelect={setCurrencyToSelect}
          setShowMissingCurrencyRateModal={setShowMissingCurrencyRateModal}
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
              pageState == 'listing' ||
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
            <h2 className="screen-title mb-0">Suspense Voucher</h2>
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
        <Row>
          <Col xs={12}>
            <div className="d-flex align-items-start justify-content-between flex-wrap-reverse mb-3">
              <div className="d-flex align-items-end mt-3">
                <CustomInput
                  style={{ width: '180px' }}
                  type="text"
                  placeholder="Search"
                  error={false}
                  showBorders={false}
                  borderRadius={10}
                  name="search"
                  rightIcon={FaMagnifyingGlass}
                  value={writeTerm}
                  onChange={(e) => {
                    // setSearchTerm(e.target.value);
                    setWriteTerm(e.target.value);
                  }}
                  onButtonClick={() => {
                    setSearchTerm(writeTerm);
                    if (writeTerm === '') {
                      setPageState('listing');
                      // Reset date when searching with empty term, but not if returning from Rate of Exchange
                      if (!isReturningFromRateExchange) {
                        setDate(new Date().toLocaleDateString('en-CA'));
                      }
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
                  onChange={(e) => {
                    setDate(e.target.value);
                    setFormData(prev => ({ ...prev, date: e.target.value }));
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

      {/* Add Office Location Modal  */}
      <CustomModal
        show={showAddOfficeLocationModal}
        close={() => setShowAddOfficeLocationModal(false)}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle">New Office Location</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{ office_location: '' }}
            validationSchema={addOfficeLocationValidationSchema}
            onSubmit={handleAddOfficeLocation}

          // onSubmit={() => {
          //   setShowAddOfficeLocationModal(false);
          // }}
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form>
                <div className="mb-45">
                  <CustomInput
                    name={'office_location'}
                    type={'text'}
                    required
                    label={'Office Location'}
                    placeholder={'Enter Office Location'}
                    value={values.office_location}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.office_location && errors.office_location}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {!addOfficeLocationMutation.isPending ? (
                    <>
                      <CustomButton type="submit" text={'Save'} />
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() => setShowAddOfficeLocationModal(false)}
                      />
                    </>
                  ) : (
                    <PulseLoader size={11} className="modalLoader" />
                  )}
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </CustomModal>

      {/* Missing Currency Rate Modal (following Receipt Voucher pattern) */}
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
              setLastVisitedPage('edit-suspense-voucher', 'rate-of-exchange');
              saveFormValues('edit-suspense-voucher', {
                ...formData,
                date,
                searchTerm, // Save searchTerm for edit mode
              });
              break;
            case 'new':
              setLastVisitedPage('suspense-voucher', 'rate-of-exchange');
              saveFormValues('suspense-voucher', {
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
        btn2Text={'Cancel'}
        btn2Action={() => setShowMissingCurrencyRateModal(false)}
      />
    </>
  );
};

export default SuspenseVoucher;
