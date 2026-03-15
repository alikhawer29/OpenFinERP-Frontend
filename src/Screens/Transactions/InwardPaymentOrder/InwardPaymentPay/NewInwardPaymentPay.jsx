import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import AccountBalanceCard from '../../../../Components/AccountBalanceCard/AccountBalanceCard';
import AttachmentsView from '../../../../Components/AttachmentsView/AttachmentsView';
import CombinedInputs from '../../../../Components/CombinedInputs/CombinedInputs';
import CustomButton from '../../../../Components/CustomButton';
import CustomCheckbox from '../../../../Components/CustomCheckbox/CustomCheckbox';
import CustomInput from '../../../../Components/CustomInput';
import CustomModal from '../../../../Components/CustomModal';
import SearchableSelect from '../../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import { useNationalities } from '../../../../Hooks/countriesAndStates';
import {
  getClassificationsWithType,
  getAccountBalances,
} from '../../../../Services/General';
import {
  getCOAAccountsbyMode,
  getWalkInCustomerListing,
  payInwardPayment,
  viewInwardPayment,
} from '../../../../Services/Transaction/InwardPayment';
import {
  getAccountsbyType,
  getChequeNumberByBank,
} from '../../../../Services/Transaction/JournalVoucher';
import { getVATType } from '../../../../Services/Transaction/ReceiptVoucher';
import { showErrorToast } from '../../../../Utils/Utils';
import {
  inwardPayValidationSchema,
  vatOutOfScopeValidationSchema,
} from '../../../../Utils/Validations/ValidationSchemas';
import useSettingsStore from '../../../../Stores/SettingsStore';
import FileDisplayList from '../../../../Components/FileDisplayList/FileDisplayList';
import withModal from '../../../../HOC/withModal';

const NewInwardPaymentPay = ({
  setShowAddLedgerModal,
  uploadAttachmentsModal,
  setUploadAttachmentsModal,
  selectedFiles,
  setSelectedFiles,
  updatePrintSetting,
  showModal,
  hasPayPermission,
  hasPrintPermission,
}) => {
  // For getting print checkbox state from BE
  const {
    getPrintSettings,
    getAccountBalanceSettings,
    updateAccountBalanceSetting,
  } = useSettingsStore();
  const navigate = useNavigate();
  const formikRef = useRef();
  const [showVatOutOfScopeModal, setShowVatOutOfScopeModal] = useState(false);
  const [outOfScopeReason, setOutOfScopeReason] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState(null);

  // Helper function to check if VAT amount should be 0 based on VAT terms
  const shouldVatAmountBeZero = (vatTerms) => {
    if (!vatTerms) return false;

    const vatTermsLower = vatTerms.toLowerCase();
    return (
      vatTermsLower === 'exempted' ||
      vatTermsLower.includes('zero rate') ||
      vatTermsLower === 'out of scope' ||
      vatTermsLower.includes('0.00%')
    );
  };

  const { id } = useParams();
  const queryClient = useQueryClient();
  const { data: nationalities, isLoading: loadingNationalities } =
    useNationalities();

  const sigCanvas = useRef(null);
  const [trimmedDataURL, setTrimmedDataURL] = useState(null);
  function clear() {
    sigCanvas.current.clear();
  }
  function trim() {
    setTrimmedDataURL(sigCanvas.current.toDataURL());
  }

  // Data fetching
  const {
    data: inwardPaymentData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['viewInwardPayment', id],
    queryFn: () => viewInwardPayment(id),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const handleSubmit = async (values) => {
    // if (formikRef?.current?.errors?.purpose_id || formikRef?.current?.errors?.ledger_account || formikRef?.current?.errors?.account_id || formikRef?.current?.errors?.amount) return

    if (!formikRef.current) return;
    // Validate the form
    const errors = await formikRef.current.validateForm();
    if (Object.keys(errors).length > 0) {
      // Mark all fields as touched to show errors
      formikRef.current.setTouched(
        Object.keys(errors).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {})
      );
      return; // Do not submit if there are errors
    }

    const formValues = formikRef.current.values;

    // Build payload with conditional VAT terms
    let payload = {
      ...formValues,
      ...selectedFiles,
      signature: trimmedDataURL,
    };

    // VAT Terms Logic based on Receipt Voucher implementation:
    // Always include vat_type in payload as it's required
    payload.vat_type = formValues.vat_type;

    // If VAT type is variable, include vat_terms_id and vat_terms
    // If VAT type is fixed, do not include vat_terms_id but include vat_terms as "Fixed"
    if (vatType?.vat_type === 'variable') {
      // Include vat_terms_id for variable VAT
      payload.vat_terms_id = formValues.vat_terms_id;
      payload.vat_terms = formValues.vat_terms;
      payload.vat_percentage = formValues.vat_trn;
      payload.vat_terms_type = 'variable';
    } else if (vatType?.vat_type === 'fixed') {
      // For fixed VAT, set vat_terms to "Fixed" and remove vat_terms_id
      payload.vat_terms = 'Fixed';
      payload.vat_percentage = vatType?.vat_percentage;
      payload.vat_terms_type = 'fixed';
      delete payload.vat_terms_id;
    }

    // Always include out_of_scope_reason if it exists
    if (outOfScopeReason) {
      payload.out_of_scope_reason = outOfScopeReason;
    }

    // Commission Logic:
    // If no commission is applied, make VAT terms optional but keep vat_type
    const hasCommission = parseFloat(formValues.commission) > 0;
    if (!hasCommission) {
      // Remove VAT terms fields when no commission, but keep vat_type
      delete payload.vat_terms_id;
      delete payload.vat_terms;
      delete payload.vat_percentage;
      delete payload.vat_terms_type;
      delete payload.vat_amount;
      delete payload.vat_trn;
      delete payload.out_of_scope_reason;
    }

    payInwardPaymentMutation.mutate(payload);
  };

  const handleVatOutOfScope = (values) => {
    setOutOfScopeReason(values.out_of_scope);
    // Set VAT terms to "Out of Scope" and VAT percentage to 0
    if (formikRef.current) {
      formikRef.current.setFieldValue('vat_terms', 'Out of Scope');
      formikRef.current.setFieldValue('vat_trn', 0);
      formikRef.current.setFieldValue('vat_amount', 0);

      // Find the "Out of Scope" option and set its ID
      const outOfScopeOption = getVATTermsOptions().find(
        (option) =>
          option.title?.toLowerCase().includes('out of scope') ||
          option.percentage?.toString().startsWith('A small popup will appear')
      );
      if (outOfScopeOption) {
        formikRef.current.setFieldValue('vat_terms_id', outOfScopeOption.id);
      }
    }
    setShowVatOutOfScopeModal(false);
  };

  const handleCancel = () => {
    if (formikRef.current) {
      formikRef.current.resetForm();
      navigate(-1);
    }
  };

  const payTypeMap = {
    cash_deposit: 'Cash Deposit',
    cash_payment: 'Cash Payment',
    pdc: 'PDC',
    cheque_payment: 'Cheque Payment',
    cheque_deposit: 'Cheque Deposit',
  };

  // Get Classification Types
  const {
    data: classificationPurposeTypes,
    isLoading: typesLoading,
    isError: typesIsError,
    error: typesError,
  } = useQuery({
    queryKey: ['classificationTypes', 'purpose'],
    queryFn: () => getClassificationsWithType({ type: 'Purpose' }),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Function to fetch Classification Types and show loading/error if api fails
  const getTypeOptions = () => {
    if (!typesLoading && !typesError) {
      return classificationPurposeTypes?.map((x) => ({
        value: x.id,
        label: x.description,
      }));
    } else {
      if (typesError) {
        console.error('Unable to fetch clasification types', error);
        return [{ label: 'Unable to fetch types', value: null }];
      } else {
        return [{ label: 'Loading...', value: null, isDisabled: true }];
      }
    }
  };

  // Get VAT Type
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

  const getVATTermsOptions = () => {
    if (isLoadingVatType)
      return [
        {
          label: 'Loading...',
          value: '',
        },
      ];
    if (isErrorVatType) {
      console.error('Unable to fetch VAT Terms', errorVatType);
      return [{ label: 'Unable to fetch VAT Terms', value: null }];
    }
    return vatType?.vats?.map((item) => ({
      label: `${item.title}${
        !isNaN(parseFloat(item.percentage)) ? ' - ' + item.percentage + '%' : ''
      }`,
      value: item.id, // Use ID as value for proper selection
      id: item.id, // Include the VAT term ID
      title: item.title, // Include the title for VAT condition checks
      percentage: item.percentage, // Include the percentage for calculations
    }));
  };

  // CHEQUE NUMBERS
  const {
    data: modeCheques,
    isLoading: isLoadingCheques,
    isError: isErrorCheques,
    error: errorCheques,
  } = useQuery({
    queryKey: ['bank_id', selectedBank],
    queryFn: () => getChequeNumberByBank(selectedBank),
    enabled:
      (selectedMode === 'Bank' || selectedMode === 'PDC') && !!selectedBank,
    staleTime: 1000 * 60 * 5,
  });

  // Memoized options
  const chequeOptions = useMemo(
    () =>
      modeCheques?.map((cheque) => ({
        label: cheque.cheque_number,
        value: cheque.id,
      })) || [],
    [modeCheques]
  );

  // Get account options //
  const { data: partyAccounts } = useQuery({
    queryKey: ['accounts', 'party'],
    queryFn: () => getAccountsbyType('party'),
    staleTime: 1000 * 60 * 5,
  });

  const { data: generalAccounts } = useQuery({
    queryKey: ['accounts', 'general'],
    queryFn: () => getAccountsbyType('general'),
    staleTime: 1000 * 60 * 5,
  });

  const { data: walkinAccounts } = useQuery({
    queryKey: ['accounts', 'walkin'],
    queryFn: () => getAccountsbyType('walkin'),
    staleTime: 1000 * 60 * 5,
  });

  //GET WALK-IN CUSTOMER
  const {
    data: walkinCustomer,
    isLoading: isLoadingWalkinCustomer,
    isError: isErrorWalkinCustomer,
    error: errorWalkinCustomer,
  } = useQuery({
    queryKey: ['walkinCustomer'],
    queryFn: () => getWalkInCustomerListing(),
    staleTime: 1000 * 60 * 5,
  });

  const getWalkInCustomerOptions = () => {
    if (!isLoadingWalkinCustomer && !isErrorWalkinCustomer) {
      const options =
        walkinCustomer?.map((x) => ({
          value: x.id,
          label: x.customer_name,
        })) || [];

      return [...options, { label: 'Add New Beneficiary', value: null }];
    } else {
      if (isErrorWalkinCustomer) {
        console.error('Unable to fetch walk-in customer', errorWalkinCustomer);
        return [{ label: 'Unable to fetch walk-in customer', value: null }];
      } else {
        return [{ label: 'Loading...', value: null, isDisabled: true }];
      }
    }
  };

  const getAccountsByTypeOptions = (accountType) => {
    if (!accountType)
      return [{ label: 'Select Ledger', value: null, isDisabled: true }];

    const accounts =
      {
        party: partyAccounts,
        general: generalAccounts,
        walkin: walkinAccounts,
      }[accountType] || [];

    const options =
      accounts.map((x) => ({
        value: x?.id,
        label: x?.title,
      })) || [];

    const addNewLabel = {
      party: 'Add New PL',
      general: 'Add New GL',
      walkin: 'Add New WIC',
    }[accountType];

    if (addNewLabel) {
      options.push({ label: addNewLabel, value: null });
    }

    return options;
  };

  const {
    data: modeAccounts,
    isLoading: isLoadingModeAccounts,
    isError: isErrorModeAccounts,
    error: errorModeAccounts,
  } = useQuery({
    queryKey: ['modeAccounts', selectedMode],
    queryFn: () => getCOAAccountsbyMode(selectedMode),
    enabled: !!selectedMode,
    staleTime: 1000 * 60 * 5,
  });

  const getModeAccountOptions = () => {
    if (!isLoadingModeAccounts && !isErrorModeAccounts) {
      return (
        modeAccounts?.map((x) => ({
          value: x.id,
          label: x.account_name,
        })) || []
      );
    } else {
      if (isErrorModeAccounts) {
        console.error('Unable to fetch mode accounts', errorModeAccounts);
        return [{ label: 'Unable to fetch mode accounts', value: null }];
      } else {
        return [{ label: 'Loading...', value: null, isDisabled: true }];
      }
    }
  };

  // Account balances for Ledger and Mode accounts
  const { data: ledgerAccountBalance } = useQuery({
    queryKey: ['accountBalance', selectedLedgerAccount?.value],
    queryFn: () =>
      getAccountBalances(
        selectedLedgerAccount.value,
        selectedLedgerAccount.accountType
      ),
    enabled:
      !!selectedLedgerAccount?.value &&
      getAccountBalanceSettings('inward_payment_pay'),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

  // Mutation: Pay Inward Payment
  const payInwardPaymentMutation = useMutation({
    mutationFn: (formData) => payInwardPayment(id, formData),
    onSuccess: (data) => {
      showToast(data?.message, 'success');

      if (getPrintSettings('inward_payment_pay')) {
        window.open(data?.detail?.pdf_url, '_blank');
      }
      setTimeout(() => {
        navigate(-1);
      }, 300);
    },

    onError: (error) => {
      if (error.message == 'Credit Adjustment limit reached for this branch.') {
        showModal(
          'Cannot Create',
          'You have reached the maximum number of CA. To create new transactions you need to increase the transaction count form the Transaction Number Register.',
          null,
          'error'
        );
      } else if (
        error.message ==
        'Debit Note Payment Voucher limit reached for this branch.'
      ) {
        showModal(
          'Cannot Create',
          'You have reached the maximum number of DPV. To create new transactions you need to increase the transaction count form the Transaction Number Register.',
          null,
          'error'
        );
      } else {
        showErrorToast(error);
      }
    },
  });

  const initialValues = useMemo(
    () => ({
      debite_note_number:
        'DBN' + (inwardPaymentData?.order?.voucher?.voucher_no || ''),
      date: inwardPaymentData?.order?.date || '',
      account: inwardPaymentData?.order?.debit_account_details?.title || '',
      pay_date: inwardPaymentData?.pay_date || '',
      pay_type:
        payTypeMap[inwardPaymentData?.pay_type] ||
        inwardPaymentData?.pay_type ||
        '',
      order_amount: inwardPaymentData?.fc_amount || '',
      ref_no: inwardPaymentData?.ref_no || '',
      balance_amount:
        inwardPaymentData?.paid?.balance_amount ||
        inwardPaymentData?.fc_amount ||
        '',
      walkin_id: inwardPaymentData?.walkin_id || '',
      contact_no: '',
      id_detail: '',
      nationality: '',
      place_of_issue: '',

      vat_type: '',
      ledger_account: '',
      vat_terms_id: '',
      vat_terms: '',
      vat_percentage: '',
      vat_terms_type: '',
      sender_nationality_id: '',
      settle_date: inwardPaymentData?.pay_date || '',

      cheque_id: '',
      sender: inwardPaymentData?.sender || '',
      due_date: inwardPaymentData?.pay_date || '',
      amount: inwardPaymentData?.balance_amount || '',
      origin_id: '',
      commission: '',
      purpose_id: '',
      vat_amount: '',
      net_total: '',
      narration: '',
      signature: '',
      mode: '',
      currency: '',
      account_id: '',
      vat_trn: 0,
      base_currency: inwardPaymentData?.currency?.currency_code || '',
      currency_id: inwardPaymentData?.currency?.id || '',
      out_of_scope_reason: '',
    }),
    [inwardPaymentData]
  );

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="d-card">
        <div className="p-4">
          <div className="row">
            <div className="col-12 col-sm-6 mb-3">
              <div 
                className="skeleton-loader" 
                style={{ 
                  height: '40px', 
                  borderRadius: '4px',
                  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'loading 1.5s infinite'
                }}
              ></div>
            </div>
            <div className="col-12 col-sm-6 mb-3">
              <div 
                className="skeleton-loader" 
                style={{ 
                  height: '40px', 
                  borderRadius: '4px',
                  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'loading 1.5s infinite'
                }}
              ></div>
            </div>
            <div className="col-12 col-sm-6 mb-3">
              <div 
                className="skeleton-loader" 
                style={{ 
                  height: '40px', 
                  borderRadius: '4px',
                  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'loading 1.5s infinite'
                }}
              ></div>
            </div>
            <div className="col-12 col-sm-6 mb-3">
              <div 
                className="skeleton-loader" 
                style={{ 
                  height: '40px', 
                  borderRadius: '4px',
                  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'loading 1.5s infinite'
                }}
              ></div>
            </div>
            <div className="col-12 col-sm-6 mb-3">
              <div 
                className="skeleton-loader" 
                style={{ 
                  height: '40px', 
                  borderRadius: '4px',
                  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'loading 1.5s infinite'
                }}
              ></div>
            </div>
            <div className="col-12 col-sm-6 mb-3">
              <div 
                className="skeleton-loader" 
                style={{ 
                  height: '40px', 
                  borderRadius: '4px',
                  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'loading 1.5s infinite'
                }}
              ></div>
            </div>
            <div className="col-12 mb-3">
              <div 
                className="skeleton-loader" 
                style={{ 
                  height: '100px', 
                  borderRadius: '4px',
                  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'loading 1.5s infinite'
                }}
              ></div>
            </div>
          </div>
        </div>
        <style>{`
          @keyframes loading {
            0% {
              background-position: 200% 0;
            }
            100% {
              background-position: -200% 0;
            }
          }
        `}</style>
      </div>
    );
  }

  // Show error state if data fetch fails
  if (isError) {
    return (
      <div className="d-card">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
          <div className="text-danger">Error: {error?.message || 'Failed to load data'}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="d-card">
        <Formik
          innerRef={formikRef}
          enableReinitialize={true}
          validationSchema={inwardPayValidationSchema}
          initialValues={initialValues}
          onSubmit={handleSubmit}
        >
          {({
            values,
            touched,
            errors,
            handleChange,
            handleBlur,
            setFieldValue,
          }) => {
            // Auto-set fixed VAT if vat_type is 'fixed'
            useEffect(() => {
              if (vatType?.vat_type === 'fixed') {
                const vatValue = parseFloat(vatType?.vat_percentage);
                setFieldValue('vat_trn', vatValue);
                setFieldValue('vat_terms', 'Fixed');
                setFieldValue('vat_terms_id', null); // Clear variable term
                setFieldValue('vat_type', 'charge'); // Set VAT type
              } else if (vatType?.vat_type === 'variable') {
                setFieldValue('vat_type', 'charge'); // Set VAT type for variable
              }
            }, [vatType?.vat_type, vatType?.vat_percentage]);

            // Calculates VAT and Net Total correctly based on Receipt Voucher logic
            useEffect(() => {
              const amount = parseFloat(values.amount) || 0;
              const commission = parseFloat(values.commission) || 0;
              const commissionAmount = commission; // Commission is already in amount format

              // Get VAT percentage from different sources
              let vatPercentage = 0;
              if (vatType?.vat_type === 'fixed') {
                vatPercentage = parseFloat(vatType?.vat_percentage) || 0;
              } else if (vatType?.vat_type === 'variable') {
                vatPercentage = parseFloat(values.vat_trn) || 0;
              }

              // Check if VAT amount should be 0 based on VAT terms
              let vatAmount = 0;
              if (shouldVatAmountBeZero(values.vat_terms)) {
                vatAmount = 0;
              } else if (commissionAmount && vatPercentage) {
                vatAmount = (commissionAmount * vatPercentage) / 100;
              }

              // Calculate net total: amount minus commission and VAT
              const netTotal = amount - commissionAmount - vatAmount;

              setFieldValue('vat_amount', vatAmount.toFixed(2));
              setFieldValue(
                'net_total',
                Math.round((netTotal + Number.EPSILON) * 1000000) / 1000000
              );
            }, [
              values.amount,
              values.commission,
              values.vat_trn,
              values.vat_terms,
              vatType,
            ]);

            useEffect(() => {
              if (values.settle_date) {
                if (values.mode === 'Bank') {
                  setFieldValue('due_date', values.settle_date);
                } else if (values.mode === 'PDC') {
                  const settleDate = new Date(values.settle_date);
                  settleDate.setDate(settleDate.getDate() + 1);
                  setFieldValue(
                    'due_date',
                    settleDate.toISOString().split('T')[0]
                  ); // format as YYYY-MM-DD
                }
              }
            }, [values.mode, values.settle_date]);

            useEffect(() => {
              if (values.walkin_id && walkinCustomer?.length > 0) {
                const selectedCustomer = walkinCustomer.find(
                  (cust) => cust.id === values.walkin_id
                );
                if (selectedCustomer) {
                  setFieldValue(
                    'contact_no',
                    selectedCustomer.mobile_number_full || ''
                  );
                  setFieldValue(
                    'nationality',
                    selectedCustomer.nationalities?.name || ''
                  );
                  setFieldValue(
                    'id_detail',
                    `${selectedCustomer?.id_types?.description || ''}, ${
                      selectedCustomer?.id_number || ''
                    }, ${selectedCustomer?.expiry_date || ''}`
                  );
                  setFieldValue(
                    'place_of_issue',
                    selectedCustomer.issue_place || ''
                  );
                }
              }
            }, [values.walkin_id, walkinCustomer]);

            return (
              <Form>
                <div className="row">
                  <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
                    <div className="row mb-4">
                      {/* First Row */}
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name="debite_note_number"
                          label="Debit Note Number"
                          placeholder={values.debite_note_number && 'DN15'}
                          value={values.debite_note_number}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled
                        />
                      </div>
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name="date"
                          label="Date"
                          type="date"
                          value={values.date}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled
                        />
                      </div>
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name="account"
                          label="Account"
                          placeholder={values.account && 'Enter Account'}
                          value={values.account}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled
                        />
                      </div>

                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name="pay_date"
                          label="Pay Date"
                          type="date"
                          value={values.pay_date}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled
                        />
                      </div>

                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name="pay_type"
                          label="Pay Type"
                          value={values.pay_type}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled
                        />
                      </div>

                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name="order_amount"
                          label="Order Amount"
                          placeholder={values.order_amount && 'EUR 5,000.00'}
                          value={values.order_amount}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled
                        />
                      </div>

                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name="ref_no"
                          label="Ref.No."
                          placeholder="003"
                          value={values.ref_no}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled
                        />
                      </div>
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name="balance_amount"
                          label="Balance Amount"
                          placeholder={values.balance_amount && 'EUR 5,000.00'}
                          value={values.balance_amount}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled
                        />
                      </div>

                      <div className="col-12 col-sm-6 mb-3">
                        <SearchableSelect
                          name="walkin_id"
                          label="Beneficiary"
                          options={getWalkInCustomerOptions()}
                          value={values.walkin_id}
                          onChange={(selected) => {
                            if (
                              selected.label
                                ?.toLowerCase()
                                ?.startsWith('add new')
                            ) {
                              setShowAddLedgerModal(
                                selected.label?.toLowerCase()
                              );
                            } else {
                              const selectedCustomer = walkinCustomer?.find(
                                (cust) => cust.id === selected.value
                              );
                              if (selectedCustomer) {
                                setFieldValue('walkin_id', selectedCustomer.id);
                                setFieldValue(
                                  'contact_no',
                                  selectedCustomer.mobile_number_full || ''
                                );
                                setFieldValue(
                                  'nationality',
                                  selectedCustomer.nationalities?.name || ''
                                );
                                setFieldValue(
                                  'id_detail',
                                  `${
                                    selectedCustomer?.id_types?.description ||
                                    ''
                                  }, ${selectedCustomer?.id_number || ''}, ${
                                    selectedCustomer?.expiry_date || ''
                                  }`
                                );
                                setFieldValue(
                                  'place_of_issue',
                                  selectedCustomer.issue_place || ''
                                );
                              }

                              // setFieldValue('walkin_id', selected.value);
                            }
                          }}
                        />
                        <ErrorMessage
                          name="walkin_id"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>

                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name="contact_no"
                          label="Contact No"
                          placeholder={
                            values.contact_no &&
                            'Select Walk-In Customer for Contact No'
                          }
                          value={values.contact_no}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled
                        />
                      </div>

                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name="nationality"
                          label="Nationality"
                          placeholder={
                            values.nationality &&
                            'Select Walk-In Customer for Nationality'
                          }
                          value={values.nationality}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled
                        />
                      </div>

                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name="id_detail"
                          label="ID Detail"
                          placeholder={
                            values.id_detail &&
                            'Select Walk-In Customer for ID Details'
                          }
                          value={values.id_detail}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled
                        />
                      </div>

                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name="place_of_issue"
                          label="Place of Issue"
                          placeholder={
                            values.place_of_issue &&
                            'Select Walk-In Customer for Place Of Issue'
                          }
                          value={values.place_of_issue}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled
                        />
                      </div>

                      <div className="col-12 col-sm-6 mb-3"></div>

                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name="sender"
                          label="Sender"
                          placeholder="Account ABC"
                          value={values.sender}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled
                        />
                      </div>

                      <div className="col-12 col-sm-6 mb-4">
                        <SearchableSelect
                          label={'Nationality'}
                          name="sender_nationality_id"
                          options={
                            loadingNationalities
                              ? [
                                  {
                                    label: 'Loading...',
                                    value: null,
                                    isDisabled: true,
                                  },
                                ]
                              : nationalities
                          }
                          onChange={(v) => {
                            setFieldValue('sender_nationality_id', v.value);
                          }}
                          value={values.sender_nationality_id}
                          placeholder={'Select nationality'}
                        />
                      </div>

                      <div className="col-12 col-sm-6 mb-3">
                        <SearchableSelect
                          label={'Origin'}
                          name="origin_id"
                          options={
                            loadingNationalities
                              ? [
                                  {
                                    label: 'Loading...',
                                    value: null,
                                    isDisabled: true,
                                  },
                                ]
                              : nationalities
                          }
                          onChange={(v) => {
                            setFieldValue('origin_id', v.value);
                          }}
                          value={values.origin_id}
                          placeholder={'Select Origin'}
                          error={touched.origin_id && errors.origin_id}
                        />
                      </div>

                      <div className="col-12 col-sm-6 mb-3">
                        <SearchableSelect
                          label={'Purpose'}
                          name="purpose_id"
                          options={
                            typesLoading
                              ? [
                                  {
                                    label: 'Loading...',
                                    value: null,
                                    isDisabled: true,
                                  },
                                ]
                              : getTypeOptions()
                          }
                          onChange={(v) => {
                            setFieldValue('purpose_id', v.value);
                          }}
                          value={values.purpose_id}
                          placeholder={'Select Purpose'}
                        />
                        <ErrorMessage
                          name="purpose_id"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>

                      {/* Second Row */}
                      <div className="col-12 col-sm-6 mb-45">
                        <CombinedInputs
                          label="Ledger"
                          type1="select"
                          type2="select"
                          name1="ledger_account"
                          name2="account_id"
                          value1={values.ledger_account}
                          value2={values.account_id}
                          options1={[
                            { label: 'PL', value: 'party' },
                            { label: 'GL', value: 'general' },
                            { label: 'WIC', value: 'walkin' },
                          ]}
                          options2={getAccountsByTypeOptions(
                            values.ledger_account
                          )}
                          handleBlur={handleBlur}
                          placeholder1="Ledger"
                          placeholder2="Account"
                          className1="ledger"
                          className2="account"
                          onChange1={(selected) => {
                            if (
                              selected.label
                                ?.toLowerCase()
                                ?.startsWith('add new')
                            ) {
                              setShowAddLedgerModal(
                                selected.label?.toLowerCase()
                              );
                            } else {
                              setFieldValue('ledger_account', selected.value);
                              setFieldValue('account_id', '');
                              // Reset selectedLedgerAccount to hide account balance card
                              setSelectedLedgerAccount(null);
                              setSelectedBank(null); //for cheque number
                              // Immediately validate and touch account_id field to show error
                              setTimeout(() => {
                                formikRef.current.setFieldTouched({
                                  account_id: true,
                                });
                                formikRef.current.validateField('account_id');
                              }, 0);
                            }
                          }}
                          onChange2={(selected) => {
                            if (
                              selected.label
                                ?.toLowerCase()
                                ?.startsWith('add new')
                            ) {
                              setShowAddLedgerModal(
                                selected.label?.toLowerCase()
                              );
                            } else {
                              setFieldValue('account_id', selected.value);
                              setSelectedLedgerAccount({
                                value: selected.value,
                                label: selected.label,
                                accountType: values.ledger_account,
                              });
                              setSelectedBank(selected.value); //for cheque number
                            }
                          }}
                        />
                        <ErrorMessage
                          name="ledger_account"
                          component="div"
                          className="input-error-message text-danger"
                        />
                        <ErrorMessage
                          name="account_id"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>

                      {values.ledger_account === 'general' && (
                        <div className="col-12 col-sm-6 mb-3">
                          <SearchableSelect
                            name="mode"
                            label="Mode"
                            options={[
                              { label: 'Cash', value: 'Cash' },
                              { label: 'Bank', value: 'Bank' },
                              { label: 'PDC', value: 'PDC' },
                              { label: 'Online', value: 'Online' },
                            ]}
                            value={values.mode}
                            onChange={(selected) => {
                              (setFieldValue('mode', selected.value),
                                setSelectedMode(selected.value),
                                setSelectedBank(''));
                            }}
                            onBlur={handleBlur}
                          />
                          <ErrorMessage
                            name="mode"
                            component="div"
                            className="input-error-message text-danger"
                          />
                        </div>
                      )}

                      <div className="col-12 col-sm-6 mb-3">
                        <SearchableSelect
                          name="vat_type"
                          label="VAT Type"
                          options={[
                            { label: 'Charge', value: 'charge' },
                            { label: 'Absorb', value: 'absorb' },
                          ]}
                          value={values.vat_type}
                          onChange={(selected) =>
                            setFieldValue('vat_type', selected.value)
                          }
                          isDisabled={parseFloat(values.commission || 0) <= 0}
                        />
                      </div>

                      {vatType?.vat_type === 'variable' && (
                        <div className="col-12 col-sm-6 mb-3">
                          <SearchableSelect
                            name="vat_terms_id"
                            label="VAT Terms"
                            options={getVATTermsOptions()}
                            value={values.vat_terms_id}
                            onChange={(selected) => {
                              if (
                                selected.percentage
                                  ?.toString()
                                  .startsWith('A small popup will appear')
                              ) {
                                setShowVatOutOfScopeModal(true);
                              } else {
                                // For variable VAT, store the selected option as vat_terms
                                const vatTerms = selected?.title ?? '';
                                const vatPercentage =
                                  selected?.percentage ?? '';
                                setFieldValue('vat_terms', vatTerms);
                                setFieldValue('vat_terms_id', selected.id); // Store VAT terms ID

                                // Set VAT percentage to 0 for exempted/zero rate/out of scope conditions
                                if (shouldVatAmountBeZero(vatTerms)) {
                                  setFieldValue('vat_trn', 0);
                                } else {
                                  setFieldValue('vat_trn', vatPercentage);
                                }

                                // Recalculate VAT amount and net total
                                const amount = parseFloat(values.amount) || 0;
                                const commission =
                                  parseFloat(values.commission) || 0;
                                const commissionAmount = commission;

                                let vat = 0;
                                if (shouldVatAmountBeZero(vatTerms)) {
                                  vat = 0;
                                } else if (vatPercentage) {
                                  vat =
                                    (commissionAmount * vatPercentage) / 100;
                                }

                                setFieldValue('vat_amount', vat.toFixed(2));
                                setFieldValue(
                                  'net_total',
                                  Math.round(
                                    (amount -
                                      commissionAmount -
                                      vat +
                                      Number.EPSILON) *
                                      1000000
                                  ) / 1000000
                                );
                              }
                            }}
                            isDisabled={
                              vatType?.vat_type === 'fixed' ||
                              !values.commission ||
                              parseFloat(values.commission) <= 0
                            }
                          />
                          <ErrorMessage
                            name="vat_terms_id"
                            component="div"
                            className="input-error-message text-danger"
                          />
                        </div>
                      )}

                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name="settle_date"
                          label="Settle Date"
                          type="date"
                          value={values.settle_date}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.settle_date && errors.settle_date}
                        />
                      </div>
                      {(values.mode === 'Bank' || values.mode === 'PDC') && (
                        <div className="col-12 col-sm-6 mb-3">
                          <SearchableSelect
                            name={'cheque_id'}
                            label="Cheque Number"
                            options={chequeOptions}
                            placeholder={'Select Cheque Number'}
                            value={values.cheque_id}
                            onChange={(selected) => {
                              setFieldValue('cheque_id', selected.value);
                            }}
                            onBlur={handleBlur}
                          />
                          <ErrorMessage
                            name="cheque_id"
                            component="div"
                            className="input-error-message text-danger"
                          />
                        </div>
                      )}
                      {(values.mode === 'Bank' || values.mode === 'PDC') && (
                        <div className="col-12 col-sm-6 mb-3">
                          <CustomInput
                            name="due_date"
                            label="Due Date"
                            type="date"
                            value={values.due_date}
                            onChange={(e) =>
                              setFieldValue('due_date', e.target.value)
                            }
                            onBlur={handleBlur}
                            min={
                              values.mode === 'PDC' && values.settle_date
                                ? (() => {
                                    const date = new Date(values.settle_date);
                                    date.setDate(date.getDate() + 1);
                                    return date.toISOString().split('T')[0];
                                  })()
                                : undefined
                            }
                            error={touched.due_date && errors.due_date}
                          />
                          <ErrorMessage
                            name="due_date"
                            component="div"
                            className="input-error-message text-danger"
                          />
                        </div>
                      )}

                      <div className="col-1 col-sm-1 mb-3">
                        <CustomInput
                          name="base_currency"
                          label="Amount"
                          value={values.base_currency}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled
                        />
                      </div>

                      <div className="col-12 col-sm-5 mb-3">
                        <CustomInput
                          name="amount"
                          label=" "
                          type="number"
                          placeholder="Enter Amount"
                          value={values.amount}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.amount && errors.amount}
                        />
                      </div>

                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name="commission"
                          label="Less Commission"
                          type="number"
                          placeholder="Enter Commission"
                          value={values.commission}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>

                      <div className="col-1 col-sm-1 mb-3">
                        <CustomInput
                          name="vat_trn"
                          label="VAT Amount"
                          value={`${parseFloat(values?.vat_trn).toFixed(0)}%`}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled
                        />
                      </div>

                      <div className="col-12 col-sm-5 mb-3">
                        <CustomInput
                          name="vat_amount"
                          label="."
                          type="number"
                          placeholder="0.00"
                          value={values.vat_amount}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled
                        />
                      </div>

                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name="net_total"
                          label="Net Total"
                          placeholder="0.00"
                          value={values.net_total}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>

                      {/* Narration and Signature */}
                      <div className="col-12 mb-3">
                        <CustomInput
                          name="narration"
                          label="Narration"
                          type="textarea"
                          placeholder="Enter Narration"
                          value={values.narration}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>

                      {/* File Attachments */}
                      <div className="col-12 mb-3">
                        <FileDisplayList
                          files={selectedFiles}
                          onRemoveFile={(file) => {
                            // Handle file removal logic
                            setSelectedFiles((prevFiles) => {
                              const updatedFiles = { ...prevFiles };
                              for (const key in updatedFiles) {
                                if (
                                  updatedFiles[key]?.name === file.name &&
                                  updatedFiles[key]?.size === file.size
                                ) {
                                  delete updatedFiles[key];
                                  break;
                                }
                              }
                              return updatedFiles;
                            });
                          }}
                        />
                      </div>

                      <div className="col-12 mb-3">
                        <label>Signature</label>

                        <SignatureCanvas
                          ref={sigCanvas}
                          penColor="green"
                          canvasProps={{
                            height: 200,
                            className: 'sigCanvas',
                          }}
                        />
                        <div className="mt-4">
                          <button
                            type="button" // ✅ prevent submit
                            className="customButton"
                            style={{ width: '20px', marginRight: '15px' }}
                            onClick={clear}
                          >
                            Clear
                          </button>
                          <button
                            type="button" // ✅ prevent submit
                            className="customButton"
                            style={{ width: '20px' }}
                            onClick={trim}
                          >
                            Trim
                          </button>
                        </div>
                        {trimmedDataURL ? (
                          <img alt="signature" src={trimmedDataURL} />
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="col-0  col-xxl-2" />
                  <div className="col-12 col-lg-10 col-xl-9 col-xxl-3">
                    <div className="row">
                      {/* Right side cards */}
                      <div
                        className="col-12 mb-5"
                        style={{ maxWidth: '350px' }}
                      >
                        {getAccountBalanceSettings('inward_payment_pay') && (
                          <>
                            {selectedLedgerAccount && (
                              <AccountBalanceCard
                                heading="Account Balance"
                                accountName={selectedLedgerAccount.label}
                                balances={
                                  ledgerAccountBalance?.balances ||
                                  ledgerAccountBalance?.detail?.balances ||
                                  (Array.isArray(ledgerAccountBalance)
                                    ? ledgerAccountBalance
                                    : [])
                                }
                                loading={ledgerAccountBalance === undefined}
                              />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap justify-content-start mb-5">
                    <div className="d-inline-block mt-3">
                      <CustomCheckbox
                        label="Account Balance"
                        checked={getAccountBalanceSettings(
                          'inward_payment_pay'
                        )}
                        style={{ border: 'none', margin: 0 }}
                        onChange={(e) =>
                          updateAccountBalanceSetting(
                            'inward_payment_pay',
                            e.target.checked
                          )
                        }
                      />
                      {hasPrintPermission && (
                        <CustomCheckbox
                          label="Print"
                          checked={getPrintSettings('inward_payment_pay')}
                          style={{ border: 'none', margin: 0 }}
                          onChange={(e) => {
                            updatePrintSetting(
                              'inward_payment_pay',
                              e.target.checked
                            );
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
      <VoucherNavigationBar
        isNavigationShow={false}
        actionButtons={[
          ...(hasPayPermission
            ? [
                {
                  text: 'Save',
                  onClick: handleSubmit,
                  loading: payInwardPaymentMutation.isPending,
                },
              ]
            : []),
          { text: 'Cancel', onClick: handleCancel, variant: 'secondaryButton' },
        ]}
        onAttachmentClick={() => setUploadAttachmentsModal(true)}
        loading={payInwardPaymentMutation.isPending}
        lastVoucherNumbersShow={false}
      />
      {/* Upload Attachements Modal */}
      <CustomModal
        show={uploadAttachmentsModal}
        close={() => setUploadAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          uploadOnly
          getUploadedFiles={setSelectedFiles}
          closeUploader={() => setUploadAttachmentsModal(false)}
        />
      </CustomModal>

      {/* VAT Out Of Scope Modal  */}
      <CustomModal
        show={showVatOutOfScopeModal}
        close={() => {
          formikRef.current.setFieldValue('vat_terms_id', '');
          setOutOfScopeReason('');
          setShowVatOutOfScopeModal(false);
        }}
        hideClose={true}
      >
        <div className="text-center mb-3 mt-5">
          <h4 className="modalTitle px-5">Out Of Scope</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{ out_of_scope: outOfScopeReason }}
            validationSchema={vatOutOfScopeValidationSchema}
            onSubmit={handleVatOutOfScope}
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form>
                <div className="mb-45">
                  <CustomInput
                    name={'out_of_scope'}
                    type={'textarea'}
                    required
                    label={'Reason'}
                    value={values.out_of_scope}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.out_of_scope && errors.out_of_scope}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  <CustomButton type="submit" text={'Submit'} />
                  <CustomButton
                    variant={'secondaryButton'}
                    text={'Cancel'}
                    type={'button'}
                    onClick={() => {
                      formikRef.current.setFieldValue('vat_terms_id', '');
                      setOutOfScopeReason('');
                      setShowVatOutOfScopeModal(false);
                    }}
                  />
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </CustomModal>
    </>
  );
};

export default withModal(NewInwardPaymentPay);
