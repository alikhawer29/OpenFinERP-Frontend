import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import { useEffect, useRef, useState } from 'react';
import AccountBalanceCard from '../../../Components/AccountBalanceCard/AccountBalanceCard';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CombinedInputs from '../../../Components/CombinedInputs/CombinedInputs.jsx';
import CustomCheckbox from '../../../Components/CustomCheckbox/CustomCheckbox';
import CustomInput from '../../../Components/CustomInput/index.jsx';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import FileDisplayList from '../../../Components/FileDisplayList/FileDisplayList';
import { showToast } from '../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import useAccountsByType from '../../../Hooks/useAccountsByType';
import { getAccountBalances } from '../../../Services/General';
import { createPdcrVoucher } from '../../../Services/Transaction/PdcrVoucher.js';
import { getReceiptVoucherDataForPdcr } from '../../../Services/Transaction/ReceiptVoucher.js';
import useSettingsStore from '../../../Stores/SettingsStore';
import { pdcrTableHeaders } from '../../../Utils/Constants/TableHeaders';
import { showErrorToast, formatDate } from '../../../Utils/Utils.jsx';
import withModal from '../../../HOC/withModal.jsx';

const NewPdcrIssueAsPdcp = ({
  showModal,
  date,
  setDate,
  getAccountsByTypeOptions,
  currencyOptions,
  isDisabled = false,
  setIsDisabled,
  setPageState,
  setSearchTerm,
  setWriteTerm,
  setShowAddLedgerModal,
  lastVoucherNumbers,
  hasPrintPermission,
}) => {
  const formikRef = useRef();
  const queryClient = useQueryClient();

  // Settings Store
  const {
    getPrintSettings,
    getAccountBalanceSettings,
    updateAccountBalanceSetting,
    updatePrintSetting,
  } = useSettingsStore();

  const [ledger, setLedger] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState(null);
  const [narration, setNarration] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterLedger, setFilterLedger] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [currency, setCurrency] = useState('');
  const [fcAmount, setFcAmount] = useState('');
  const [uploadAttachmentsModal, setUploadAttachmentsModal] = useState(false);
  const [addedAttachments, setAddedAttachments] = useState({});

  // Debug function to track attachment changes
  const handleSetAddedAttachments = (attachments) => {
    setAddedAttachments(attachments);
  };

  // Debug useEffect to track addedAttachments changes
  useEffect(() => {}, [addedAttachments]);
  const [selectedPdcr, setSelectedPdcr] = useState(null);
  const [selectedPdcrError, setSelectedPdcrError] = useState(null);
  const [selectedPdcrId, setSelectedPdcrId] = useState(null);
  // const [receiptVoucherData, setReceiptVoucherData] = useState([]);
  const [loading, setLoading] = useState(false);
  // const [loadingSearch, setLoadingSearch] = useState(false);
  // const [error, setError] = useState(null);

  // Filter state for CustomTable
  const [filters, setFilters] = useState({
    search: '',
    ledger: '',
    account: '',
    currency: '',
    cheque_number: '',
    date: '', // Initialize with empty date instead of current date
    fc_amount: '',
  });

  const [ledgerAccountOptions, setLedgerAccountOptions] = useState([
    { value: 'All', label: 'All' },
  ]);

  // Get account options using custom hook
  const { getAccountsByTypeOptions: getAccountsByTypeOptionsHook } =
    useAccountsByType();

  // Fetch Account Balance
  const { data: ledgerAccountBalance } = useQuery({
    queryKey: ['accountBalance', selectedLedgerAccount?.value],
    queryFn: () =>
      getAccountBalances(
        selectedLedgerAccount.value,
        selectedLedgerAccount.accountType
      ),
    enabled:
      !!selectedLedgerAccount?.value &&
      getAccountBalanceSettings('pdcr_issue_as_pdcp'),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

  // Fetch Ledger-Specific Accounts for Filter
  useEffect(() => {
    if (filters.ledger) {
      setLedgerAccountOptions(
        getAccountsByTypeOptionsHook(filters.ledger, false)
      );
      // Reset account filter when ledger changes to avoid invalid account selection
      setFilters((prev) => ({
        ...prev,
        account: '', // Reset account to 'All'
      }));
    } else {
      // Reset to All when no ledger is selected
      setLedgerAccountOptions([{ value: 'All', label: 'All' }]);
      // Also reset account filter when ledger is cleared
      setFilters((prev) => ({
        ...prev,
        account: '', // Reset account to 'All'
      }));
    }
  }, [filters.ledger]);

  // Fetch Receipt Voucher Data
  const {
    data: receiptVoucherData = [],
    isLoading: loadingSearch,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'receipt-voucher-data',
      filters.date,
      filters.search,
      filters.currency,
      filters.fc_amount,
      filters.cheque_number,
      filters.ledger,
      filters.account,
    ],
    queryFn: () =>
      getReceiptVoucherDataForPdcr({
        date: filters.date || '',
        search: filters.search || '',
        currency: filters.currency || '',
        fc_amount: filters.fc_amount || '',
        cheque_number: filters.cheque_number || '',
        ledger: filters.ledger || '',
        account: filters.account || '',
      }),
    enabled: !isDisabled,
    refetchOnWindowFocus: 'always',
    staleTime: 0,
    retry: 1,
    keepPreviousData: true,
  });

  if (isError) {
    showErrorToast(error);
  }

  // When screen is disabled, don't show any receipt voucher rows
  const displayedReceiptVoucherData = isDisabled ? [] : receiptVoucherData;

  const handleSave = async () => {
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

    if (selectedPdcr == null) {
      setSelectedPdcrError('Please Select Pdcr');
      return;
    }
    setSelectedPdcrError('');
    setLoading(true);

    let payload = {
      date: date,
      ledger: ledger,
      account_id: selectedAccount,
      narration: narration,
      selected_voucher_ids: [selectedPdcr.id],
      ...(addedAttachments || {}),
    };

    // Convert to FormData if attachments are present
    const formData = new FormData();

    // Add basic fields
    formData.append('date', payload.date);
    formData.append('ledger', payload.ledger);
    formData.append('account_id', payload.account_id);
    formData.append('narration', payload.narration);

    // Add selected_voucher_ids array properly
    payload.selected_voucher_ids.forEach((id, index) => {
      formData.append(`selected_voucher_ids[${index}]`, id);
    });

    // Add attachments
    Object.keys(addedAttachments || {}).forEach((key) => {
      formData.append(key, addedAttachments[key]);
    });
    setDate(new Date().toLocaleDateString('en-CA'));
    createPdcrMutation.mutate(formData);
  };

  // Remove a newly added (local) attachment before final save
  const handleRemoveAttachedFile = (file) => {
    setAddedAttachments((prevFiles) => {
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
  };

  const createPdcrMutation = useMutation({
    mutationFn: createPdcrVoucher,
    onSuccess: (data, variables) => {
      showToast('Pdcr Voucher Created!', 'success');
      setLoading(false);
      
      // Add navigation query invalidation
      queryClient.invalidateQueries(['voucherNumber', '']);
      queryClient.invalidateQueries(['voucherNumber', data?.voucher_no]);
      
      handleCancel();
    },
    onError: (error) => {
      if (error.message == 'Voucher limit reached for this branch.') {
        showModal(
          'Cannot Create',
          'The maximum number of PPV has been reached. To create new transactions, please increase the transaction number count in the Transaction Number Register.',
          null,
          'error'
        );
      } else {
        showErrorToast(error);
      }
      setLoading(false);
    },
  });

  const handleCancel = () => {
    setIsDisabled(true);
    setLedger('');
    setSelectedAccount('');
    setSelectedLedgerAccount(null);
    setNarration('');
    setChequeNumber('');
    setFilterDate('');
    setFilterLedger('');
    setFilterAccount('');
    setCurrency('');
    setFcAmount('');
    setSelectedPdcr(null);
    setSelectedPdcrId(null);
    setSelectedPdcrError('');
    // setReceiptVoucherData([]);
    setAddedAttachments({});
    setFilters({
      search: '',
      ledger: '',
      account: '',
      currency: '',
      cheque_number: '',
      date: '',
      fc_amount: '',
    });
    setLedgerAccountOptions([{ value: 'All', label: 'All' }]);
    formikRef.current?.resetForm();
    setDate(new Date().toLocaleDateString('en-CA'));
  };

  // Show error toast when selectedPdcrError changes
  useEffect(() => {
    if (selectedPdcrError) {
      showToast(selectedPdcrError, 'error');
      setSelectedPdcrError(''); // Clear error after showing
    }
  }, [selectedPdcrError]);

  return (
    <>
      <Formik
        innerRef={formikRef}
        onSubmit={handleSave}
        initialValues={{
          ledger: ledger,
          account_id: selectedAccount || '',
          narration: narration || '',
        }}
        validate={(values) => {
          const errors = {};
          if (!values.ledger) {
            errors.ledger = 'Ledger is required';
          } else if (!values.account_id) {
            errors.account_id = 'Account is required';
          }
          return errors;
        }}
      >
        {({
          values,
          setFieldValue,
          setFieldTouched,
          validateForm,
          handleChange,
          errors,
          touched,
          handleBlur,
        }) => (
          <Form>
            <div className="d-card mb-45">
              <div className="row">
                <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
                  <div className="row">
                    <div className="col-12 col-sm-7 mb-45">
                      <CombinedInputs
                        label="Ledger"
                        type1="select"
                        type2="select"
                        name1="ledger"
                        name2="account_id"
                        value1={values.ledger}
                        value2={values.account_id}
                        options1={[
                          { label: 'PL', value: 'party' },
                          { label: 'GL', value: 'general' },
                          { label: 'WIC', value: 'walkin' },
                        ]}
                        options2={getAccountsByTypeOptions(values.ledger)}
                        isDisabled={isDisabled}
                        handleBlur={handleBlur}
                        placeholder1="Ledger"
                        placeholder2="Account"
                        className1="ledger"
                        className2="account"
                        onChange1={(selected) => {
                          if (
                            selected.label?.toLowerCase()?.startsWith('add new')
                          ) {
                            setShowAddLedgerModal(
                              selected.label?.toLowerCase()
                            );
                          } else {
                            setFieldValue('ledger', selected.value);
                            setFieldTouched('ledger', true);
                            setLedger(selected.value);
                            setFieldValue('account_id', '');
                            setFieldTouched('account_id', true);
                            // Reset selected account when ledger changes
                            setSelectedAccount('');
                            setSelectedLedgerAccount(null);
                            // Validate immediately to show account error if empty
                            setTimeout(() => {
                              validateForm();
                            }, 0);
                          }
                        }}
                        onChange2={(selected) => {
                          if (
                            selected.label?.toLowerCase()?.startsWith('add new')
                          ) {
                            setShowAddLedgerModal(
                              selected.label?.toLowerCase()
                            );
                          } else if (selected && selected.value) {
                            setFieldValue('account_id', selected.value);
                            setFieldTouched('account_id', true);
                            // Validate immediately to remove error
                            setTimeout(() => {
                              validateForm();
                            }, 0);
                            setSelectedAccount(selected.value);
                            setSelectedLedgerAccount({
                              value: selected.value,
                              label: selected.label,
                              accountType: values.ledger,
                            });
                            // Auto-generate narration when account is selected
                            if (!values.narration) {
                              const ledgerLabel =
                                [
                                  { label: 'PL', value: 'party' },
                                  { label: 'GL', value: 'general' },
                                  { label: 'WIC', value: 'walkin' },
                                ].find((x) => x.value === values.ledger)
                                  ?.label || 'Ledger';
                              setFieldValue(
                                'narration',
                                `PDCR Issued as PDCP Against ${ledgerLabel} Account - ${selected.label}`
                              );
                            }
                          } else {
                            // Handle deselection
                            setFieldValue('account_id', '');
                            setSelectedAccount('');
                            setSelectedLedgerAccount(null);
                          }
                        }}
                      />
                      <ErrorMessage
                        name="ledger"
                        component="div"
                        className="input-error-message text-danger"
                      />
                      <ErrorMessage
                        name="account_id"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
                    <div className="col-12 col-sm-7 mb-3">
                      <CustomInput
                        name={'narration'}
                        label={'Narration'}
                        type={'textarea'}
                        rows={1}
                        placeholder={'Enter Narration'}
                        disabled={isDisabled}
                        value={values.narration}
                        onChange={(e) => {
                          handleChange(e);
                          setNarration(e.target.value);
                        }}
                        onBlur={handleBlur}
                        error={touched.narration && errors.narration}
                      />
                    </div>
                  </div>
                </div>
                <div className="col-12 col-xxl-2" />
                {!isDisabled && (
                  <div className="col-12 col-lg-10 col-xl-9 col-xxl-3">
                    <div className="row">
                      <div
                        className="col-12 mb-5"
                        style={{ maxWidth: '350px' }}
                      >
                        {getAccountBalanceSettings('pdcr_issue_as_pdcp') && (
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
                )}
              </div>
            </div>

            <div className="d-flex flex-column gap-4">
              {/* PDCR Selection Table with Integrated Filters */}
              <div className={isDisabled ? 'pe-none opacity-50' : ''}>
                <CustomTable
                  hasFilters={true}
                  filters={filters}
                  setFilters={setFilters}
                  headers={pdcrTableHeaders}
                  hideSearch={true}
                  hideItemsPerPage={true}
                  isPaginated={false}
                  isLoading={loadingSearch}
                  useClearButton
                  selectOptions={[
                    {
                      label: 'Ledger',
                      title: 'ledger',
                      options: [
                        { value: '', label: 'All' },
                        { value: 'general', label: 'GL' },
                        { value: 'party', label: 'PL' },
                        { value: 'walkin', label: 'WIC' },
                      ],
                    },
                    ...(filters.ledger
                      ? [
                          {
                            label: 'Account',
                            title: 'account',
                            options: [
                              { value: '', label: 'All' },
                              ...ledgerAccountOptions.filter(
                                (option) => option.value !== 'All'
                              ),
                            ],
                          },
                        ]
                      : []),
                    {
                      label: 'Currency',
                      title: 'currency',
                      options: [
                        { value: '', label: 'All' },
                        ...(currencyOptions?.map((currency) => ({
                          value: currency.label, // Use currency_code instead of ID
                          label: currency.label,
                        })) || []),
                      ],
                    },
                  ]}
                  additionalFilters={[
                    {
                      title: 'Cheque Number',
                      type: 'text',
                      placeholder: 'Enter Cheque Number',
                    },
                    { title: 'Date', type: 'date', placeholder: 'Enter Date' },
                    {
                      title: 'FC Amount',
                      type: 'number',
                      placeholder: 'Enter FC Amount',
                    },
                  ]}
                >
                  <tbody>
                    {displayedReceiptVoucherData.length > 0
                      ? displayedReceiptVoucherData.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <label>
                                <input
                                  type="radio"
                                  name="pdcr"
                                  checked={item.id === selectedPdcrId}
                                  onChange={() => {
                                    setSelectedPdcr(item);
                                    setSelectedPdcrId(item.id);
                                  }}
                                />
                                <span>{/* Empty span for styling */}</span>
                              </label>
                            </td>
                            <td>{item.account || '-'}</td>
                            <td>{item.cheque_number || '-'}</td>
                            <td>
                              {formatDate(item.due_date, 'DD/MM/YYYY') || '-'}
                            </td>
                            <td>{item.currency || '-'}</td>
                            <td>{item.fc_amount || '-'}</td>
                            <td>{item.bank || '-'}</td>
                          </tr>
                        ))
                      : !loadingSearch && (
                          <tr>
                            <td
                              colSpan={pdcrTableHeaders.length}
                              style={{ textAlign: 'center' }}
                            >
                              No PDCR records found
                            </td>
                          </tr>
                        )}
                  </tbody>
                </CustomTable>
              </div>
              {/* File Attachments */}
              <FileDisplayList
                files={addedAttachments || {}}
                onRemoveFile={handleRemoveAttachedFile}
              />
            </div>
          </Form>
        )}
      </Formik>

      <div className="d-flex flex-wrap justify-content-start mb-45">
        <div className="d-inline-block mt-3">
          <CustomCheckbox
            label="Account Balance"
            checked={getAccountBalanceSettings('pdcr_issue_as_pdcp')}
            disabled={isDisabled}
            style={{ border: 'none', margin: 0 }}
            onChange={(e) =>
              updateAccountBalanceSetting(
                'pdcr_issue_as_pdcp',
                e.target.checked
              )
            }
            readOnly={isDisabled}
          />
          {hasPrintPermission && (
            <CustomCheckbox
              label="Print"
              checked={getPrintSettings('pdcr_issue_as_pdcp')}
              onChange={(e) => {
                updatePrintSetting('pdcr_issue_as_pdcp', e.target.checked);
              }}
              style={{ border: 'none', margin: 0 }}
              readOnly={isDisabled}
            />
          )}
        </div>
      </div>
      <VoucherNavigationBar
        isDisabled={isDisabled}
        actionButtons={[
          { text: 'Save', onClick: handleSave },
          {
            text: 'Cancel',
            onClick: handleCancel,
            variant: 'secondaryButton',
          },
        ]}
        loading={loading}
        onAttachmentClick={() => setUploadAttachmentsModal(true)}
        lastVoucherNumbers={lastVoucherNumbers}
        setSearchTerm={setSearchTerm}
        setPageState={setPageState}
        setWriteTerm={setWriteTerm}
        additionalRefetch={refetch}
      />

      <CustomModal
        show={uploadAttachmentsModal}
        close={() => setUploadAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          uploadOnly
          getUploadedFiles={handleSetAddedAttachments}
          closeUploader={() => setUploadAttachmentsModal(false)}
        />
      </CustomModal>
    </>
  );
};

export default withModal(NewPdcrIssueAsPdcp);
