import { Form, Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { FaMagnifyingGlass } from 'react-icons/fa6';
import { useLocation, useNavigate } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import ChartOfAccountForm from '../../../Components/ChartOfAccountForm/ChartOfAccountForm';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import PartyLedgerForm from '../../../Components/PartyLedgerForm/PartyLedgerForm';
import WalkInCustomerForm from '../../../Components/WalkInCustomerForm/WalkInCustomerForm';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import '../transactionStyles.css';
import EditInwardPaymentOrder from './EditInwardPaymentOrder';
import InwardPaymentOrderTable from './InwardPaymentOrderTable';
import NewInwardPaymentOrder from './NewInwardPaymentOrder';
import ViewInwardPaymentOrder from './ViewInwardPaymentOrder';
import { getIPOVoucherNumber } from '../../../Services/Transaction/InwardPaymentOrder';
import useAccountsByType from '../../../Hooks/useAccountsByType';
import { useQuery } from '@tanstack/react-query';
import useModulePermissions from '../../../Hooks/useModulePermissions';
// import EditSuspenseVoucher from './EditSuspenseVoucher';

const InwardPaymentOrder = () => {
  usePageTitle('Inward Payment Order');
  const navigate = useNavigate();

  // [new, view, edit,  list]
  const [pageState, setPageState] = useState('new');
  const [isDisabled, setIsDisabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [writeTerm, setWriteTerm] = useState('');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [showAddLedgerModal, setShowAddLedgerModal] = useState('');
  const [newlyCreatedAccount, setNewlyCreatedAccount] = useState(null);
  const [showAddOfficeLocationModal, setShowAddOfficeLocationModal] =
    useState(false);
  const [uploadAttachmentsModal, setUploadAttachmentsModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState(null);
  const [showMissingCurrencyRateModal, setShowMissingCurrencyRateModal] =
    useState(false);
  const [currencyToSelect, setCurrencyToSelect] = useState(null);
  const [formData, setFormData] = useState(null);
  const [lastVoucherNumbers, setLastVoucherNumbers] = useState(null);
  // Get account options using custom hook //
  const { getAccountsByTypeOptions } = useAccountsByType();

  // Get last voucher number //
  const {
    data: voucherNumber,
    isLoading: isLoadingVoucherNumber,
    isError: isErrorVoucherNumber,
    error: errorVoucherNumber,
  } = useQuery({
    queryKey: ['ipo-voucherNumber', searchTerm],
    queryFn: () => getIPOVoucherNumber(searchTerm),
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const location = useLocation();
  const { transactionId, fromCancellation } = location.state || {};

  // setting the write term
  useEffect(() => {
    if (transactionId) {
      setWriteTerm(transactionId)
      setSearchTerm(transactionId)
      setPageState('view')
    }
  }, [])

  useEffect(() => {
    setLastVoucherNumbers({
      heading: `Last DBN Number: `,
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

  // Permissions
  const permissions = useModulePermissions('transactions', 'inward_payment_order');
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
        <NewInwardPaymentOrder
          date={date}
          setDate={setDate}
          isDisabled={isDisabled}
          setPageState={setPageState}
          setIsDisabled={setIsDisabled}
          selectedFiles={selectedFiles}
          setSearchTerm={setSearchTerm}
          setWriteTerm={setWriteTerm}
          onFormDataChange={setFormData}
          setSelectedFiles={setSelectedFiles}
          newlyCreatedAccount={newlyCreatedAccount}
          currencyToSelect={currencyToSelect}
          setCurrencyToSelect={setCurrencyToSelect}
          setShowAddLedgerModal={setShowAddLedgerModal}
          uploadAttachmentsModal={uploadAttachmentsModal}
          getAccountsByTypeOptions={getAccountsByTypeOptions}
          setUploadAttachmentsModal={setUploadAttachmentsModal}
          setShowAddOfficeLocationModal={setShowAddOfficeLocationModal}
          setShowMissingCurrencyRateModal={setShowMissingCurrencyRateModal}
          lastVoucherNumbers={lastVoucherNumbers}
          permissions={permissions}
          hasPrintPermission={hasPrintPermission}
        />
      ),
      view: (
        <ViewInwardPaymentOrder
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
        <InwardPaymentOrderTable
          date={date}
          setSearchTerm={setSearchTerm}
          setWriteTerm={setWriteTerm}
          setPageState={setPageState}
          permissions={permissions}
        />
      ),
      edit: (
        <EditInwardPaymentOrder
          searchTerm={searchTerm}
          setPageState={setPageState}
          setShowAddOfficeLocationModal={setShowAddOfficeLocationModal}
          setShowAddLedgerModal={setShowAddLedgerModal}
          getAccountsByTypeOptions={getAccountsByTypeOptions}
          newlyCreatedAccount={newlyCreatedAccount}
          uploadAttachmentsModal={uploadAttachmentsModal}
          setUploadAttachmentsModal={setUploadAttachmentsModal}
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
          setShowMissingCurrencyRateModal={setShowMissingCurrencyRateModal}
          setCurrencyToSelect={setCurrencyToSelect}
          lastVoucherNumbers={lastVoucherNumbers}
          setIsDisabled={setIsDisabled}
          isDisabled={isDisabled}
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
            {(pageState == 'view' ||
              pageState == 'list' ||
               pageState == 'new' && !isDisabled ||
              pageState == 'edit') && (
                <BackButton
                  handleBack={() => {
                    if (pageState == 'edit') {
                      setPageState('view');
                    } else if (pageState == 'new' && !isDisabled) {
                      setIsDisabled(true);
                    } else if (fromCancellation) {
                      navigate('/transactions/inward-payment-cancellation');
                    } else {
                      setDate(new Date().toLocaleDateString('en-CA'));
                      setPageState('new');
                      setWriteTerm('');
                      setSearchTerm('');
                    }
                  }}
                />
              )}
              
            <h2 className="screen-title mb-0">Inward Payment Order</h2>
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
              <div className="mt-3">
                <CustomInput
                  style={{ width: '180px' }}
                  type="text"
                  placeholder="Search DBN"
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
                    if (writeTerm === '') {
                      setPageState('list');
                      setDate(new Date().toLocaleDateString('en-CA'));
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
      <CustomModal
        show={!!showAddLedgerModal}
        close={() => setShowAddLedgerModal('')}
        size="xl"
        style={{ minHeight: '812px' }}
      >
        {renderAddLedgerForm()}
      </CustomModal>
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
            onSubmit={() => {
              setShowAddOfficeLocationModal(false);
            }}
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
                  <>
                    <CustomButton type="submit" text={'Save'} />
                    <CustomButton
                      variant={'secondaryButton'}
                      text={'Cancel'}
                      type={'button'}
                      onClick={() => setShowAddOfficeLocationModal(false)}
                    />
                  </>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </CustomModal>
      <CustomModal
        show={showMissingCurrencyRateModal}
        close={() => setShowMissingCurrencyRateModal(false)}
        title={'Missing Rate of Exchange'}
        description={'Rate of exchange is missing for selected currency.'}
        variant={'error'}
        btn1Text={'Update Rate of Exchange'}
        action={() => {
          if (formData) {
            // Save form data before navigation (following TMN pattern)
            // (optional, can be removed if not needed)
          }
          navigate('/transactions/remittance-rate-of-exchange', {
            state: { currencyToSelect },
          });
        }}
      />
    </>
  );
};

export default InwardPaymentOrder;
