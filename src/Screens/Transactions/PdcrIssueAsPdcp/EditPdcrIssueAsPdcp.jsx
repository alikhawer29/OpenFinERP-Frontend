import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import { useEffect, useRef, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import AccountBalanceCard from '../../../Components/AccountBalanceCard/AccountBalanceCard';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CombinedInputs from '../../../Components/CombinedInputs/CombinedInputs';
import CustomCheckbox from '../../../Components/CustomCheckbox/CustomCheckbox';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import { showToast } from '../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import useAccountsByType from '../../../Hooks/useAccountsByType';
import { getAccountBalances } from '../../../Services/General';
import {
  addPdcrVoucherAttachment,
  deletePdcrVoucherAttachment,
  getPdcrListing,
  updatePdcrVoucher,
} from '../../../Services/Transaction/PdcrVoucher.js';
import { getReceiptVoucherDataForPdcr } from '../../../Services/Transaction/ReceiptVoucher.js';
import useSettingsStore from '../../../Stores/SettingsStore';
import { pdcrTableHeaders } from '../../../Utils/Constants/TableHeaders';
import {
  buildFormData,
  formatDate,
  isNullOrEmpty,
  showErrorToast,
} from '../../../Utils/Utils';

const EditPdcrIssueAsPdcp = ({
  date,
  setDate,
  getAccountsByTypeOptions,
  currencyOptions,
  isDisabled = false,
  searchTerm,
  setPageState,
  setSearchTerm,
  setShowAddLedgerModal,
  hasPrintPermission,
  lastVoucherNumbers,
}) => {
  const queryClient = useQueryClient();
  const formikRef = useRef();

  // Settings Store
  const {
    getPrintSettings,
    getAccountBalanceSettings,
    updateAccountBalanceSetting,
    updatePrintSetting,
  } = useSettingsStore();

  const [ledger, setLedger] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [narration, setNarration] = useState('');
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [addedAttachments, setAddedAttachments] = useState({});
  const [selectedPdcr, setSelectedPdcr] = useState(null);
  const [selectedPdcrError, setSelectedPdcrError] = useState(null);
  const [selectedPdcrId, setSelectedPdcrId] = useState(null);
  const [chequeNumber, setChequeNumber] = useState('');
  const [currency, setCurrency] = useState('');
  const [fcAmount, setFcAmount] = useState('');
  const [receiptVoucherData, setReceiptVoucherData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [error, setError] = useState(null);
  const isInitializingRef = useRef(false);
  const initialFetchDoneRef = useRef(false);
  const isFetchingRef = useRef(false);
  const [deletedAttachments, setDeletedAttachments] = useState([]); // Track IDs of attachments to delete
  const [currentFiles, setCurrentFiles] = useState([]); // Track current files for UI display
  const filesInitializedRef = useRef(false); // Track if files have been initialized

  // Handle voucher-level attachment uploads (Deferred pattern)
  const handleVoucherAttachmentsUpload = (files) => {
    // Update the addedAttachments state with new files
    setAddedAttachments((prev) => ({
      ...prev,
      ...files,
    }));
    showToast('Attachments will be updated when voucher is updated', 'success');
    setShowAttachmentsModal(false);
  };

  // Handle attachment deletion in deferred mode
  const handleDeletedAttachments = (attachmentId) => {
    setDeletedAttachments((prev) => [...prev, attachmentId]);
    // Remove from current files display
    setCurrentFiles((prev) => prev.filter((f) => f.id !== attachmentId));
  };

  // Debug for attachments
  useEffect(() => {}, [addedAttachments]);

  // Handle selectedPdcrError toast
  useEffect(() => {
    if (selectedPdcrError) {
      showToast(selectedPdcrError, 'error');
      setSelectedPdcrError(null); // Clear error after showing toast
    }
  }, [selectedPdcrError]);

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

  // Keep filter date empty by default (override any automatic setting)
  useEffect(() => {
    if (filters.date !== '') {
      setFilters((prev) => ({
        ...prev,
        date: '',
      }));
    }
  }, [filters.date]);

  // State for selected accounts for balance
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState(null);

  // Fetch Account Balance
  const { data: ledgerAccountBalance, isLoading: isLoadingBalance } = useQuery({
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

  const {
    data: { data: [pdcrVoucherData] = [] } = {},
    isLoading,
    isFetching,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ['pdcrVoucher', searchTerm],
    queryFn: () => getPdcrListing({ search: searchTerm }),
    staleTime: 1000 * 60 * 5,
  });

  const pdcrVoucher = pdcrVoucherData;

  const fetchReceiptVoucherData = async (
    preserveSelection = false,
    selectedVoucherData = null,
    selectedVoucherId = null
  ) => {
    if (isFetchingRef.current) return;
    try {
      isFetchingRef.current = true;
      setLoadingSearch(true);
      setError(null);

      // Build API parameters - same as New page
      const apiParams = {
        date: filters.date || '', // Use filter date instead of always empty string
        search: filters.search || '',
        currency: filters.currency || '',
        fc_amount: filters.fc_amount || '',
        cheque_number: filters.cheque_number || '',
        ledger: filters.ledger || '',
        account: filters.account || '',
      };

      const response = await getReceiptVoucherDataForPdcr(apiParams);

      // If we're preserving selection and have a selected voucher, add it to the response if not present
      if (
        preserveSelection &&
        (selectedVoucherId || selectedPdcrId) &&
        (selectedVoucherData || selectedPdcr)
      ) {
        const voucherId = selectedVoucherId || selectedPdcrId;
        const voucherData = selectedVoucherData || selectedPdcr;

        // Check if the selected voucher is already in the response
        const selectedVoucherExists = response.some(
          (item) => item.id === voucherId
        );

        if (!selectedVoucherExists) {
          // Add the selected voucher to the beginning of the response
          response.unshift(voucherData);
        }
      }

      setReceiptVoucherData(response);
    } catch (err) {
      showErrorToast(err);
      setError(err);
    } finally {
      setLoadingSearch(false);
      isFetchingRef.current = false;
    }
  };

  // Initial load - wait for voucher if editing
  useEffect(() => {
    if (!isDisabled && !pdcrVoucher && !initialFetchDoneRef.current) {
      initialFetchDoneRef.current = true;
      fetchReceiptVoucherData();
    }
  }, [isDisabled, pdcrVoucher]);

  // Auto-fetch when filters change - but skip if initializing
  useEffect(() => {
    if (
      !isDisabled &&
      !isInitializingRef.current &&
      initialFetchDoneRef.current
    ) {
      fetchReceiptVoucherData(true, selectedPdcr, selectedPdcrId);
    }
  }, [filters, isDisabled]);

  // Pre-fill form data when voucher data is loaded
  useEffect(() => {
    if (pdcrVoucher) {
      // Try different possible ledger fields
      const ledgerValue =
        pdcrVoucher?.issued_ledger ||
        pdcrVoucher?.ledger ||
        pdcrVoucher?.account_type;
      setLedger(ledgerValue);
      setSelectedAccount(pdcrVoucher?.account_id);
      setNarration(pdcrVoucher?.narration);
      // Convert date to proper format for form input (YYYY-MM-DD)
      const voucherDate = pdcrVoucher?.date
        ? new Date(pdcrVoucher.date).toISOString().split('T')[0]
        : '';
      setDate(voucherDate);
      setChequeNumber(pdcrVoucher?.cheque_number);
      setCurrency(pdcrVoucher?.currency);
      setFcAmount(pdcrVoucher?.fc_net_total);

      // Set selected PDCR for this voucher

      // Extract selected voucher from selected_voucher_ids
      if (
        pdcrVoucher?.selected_voucher_ids &&
        pdcrVoucher.selected_voucher_ids.length > 0
      ) {
        const selectedVoucher = pdcrVoucher.selected_voucher_ids[0];

        // Prepare selected voucher data
        const selectedVoucherData = {
          id: selectedVoucher.receipt_vouchers.id,
          account:
            selectedVoucher.receipt_vouchers.account_details?.title || '-',
          cheque_number: selectedVoucher.receipt_vouchers.cheque_number,
          due_date: selectedVoucher.receipt_vouchers.due_date,
          currency:
            selectedVoucher.receipt_vouchers.amount_account?.currency_code ||
            '-',
          fc_amount:
            selectedVoucher.receipt_vouchers.commission_type === 'Expense'
              ? selectedVoucher.receipt_vouchers.net_total
              : selectedVoucher.receipt_vouchers.amount,
          bank: selectedVoucher.receipt_vouchers.party_bank,
          ledger: selectedVoucher.receipt_vouchers.ledger,
        };

        // Update filters and selections
        isInitializingRef.current = true;

        // Batch updates to minimize re-renders
        setSelectedPdcr(selectedVoucherData);
        setSelectedPdcrId(selectedVoucher.receipt_vouchers.id);

        setFilters((prev) => ({
          ...prev,
          date: voucherDate,
        }));

        // Now that seeds are set, fetch immediately once with these values
        // We bypass the watcher here but ensure it doesn't fire concurrently
        fetchReceiptVoucherData(
          true,
          selectedVoucherData,
          selectedVoucher.receipt_vouchers.id
        ).then(() => {
          isInitializingRef.current = false;
          initialFetchDoneRef.current = true;
        });
      } else {
        // Just fetch normally if no selection
        fetchReceiptVoucherData(true).then(() => {
          initialFetchDoneRef.current = true;
        });
      }

      // Load existing attachments (Receipt Voucher pattern)
      if (!filesInitializedRef.current) {
        const filesData = pdcrVoucher.files || [];
        setCurrentFiles(filesData);
        filesInitializedRef.current = true;
      }

      // Set selected ledger account for balance display
      if (pdcrVoucher?.account_id) {
        const ledgerType =
          pdcrVoucher?.issued_ledger || pdcrVoucher?.ledger || 'party';
        const accountOptions = getAccountsByTypeOptions(ledgerType);

        const accountOption = accountOptions.find(
          (acc) => acc.value === pdcrVoucher?.account_id
        );

        if (accountOption) {
          const balanceAccount = {
            value: accountOption.value,
            label: accountOption.label,
            accountType: ledgerType,
          };
          setSelectedLedgerAccount(balanceAccount);
        } else {
          showErrorToast(
            'No account option found for ID: ' + pdcrVoucher?.account_id
          );
        }
      }

      // Data extraction and selection done above
    }
  }, [pdcrVoucher]);

  const handleSearchReceiptVouchers = () => {
    fetchReceiptVoucherData(true, selectedPdcr, selectedPdcrId);
  };

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
      selected_voucher_ids: [selectedPdcrId],
    };

    // Convert to FormData
    const formData = new FormData();

    // Ensure date is valid before appending
    const formattedDate = date
      ? new Date(date).toISOString().split('T')[0]
      : new Date().toLocaleDateString('en-CA');

    // Add basic fields
    formData.append('date', formattedDate);
    formData.append('ledger', payload.ledger);
    formData.append('account_id', payload.account_id);
    formData.append('narration', payload.narration);

    // Add selected_voucher_ids array properly
    payload.selected_voucher_ids.forEach((id, index) => {
      formData.append(`selected_voucher_ids[${index}]`, id);
    });

    // Add deleted attachments if any
    if (deletedAttachments && deletedAttachments.length > 0) {
      deletedAttachments.forEach((attachmentId, index) => {
        formData.append(`deleted_attachments[${index}]`, attachmentId);
      });
    }

    // Add attachments using buildFormData (Deferred pattern)
    Object.keys(addedAttachments || {}).forEach((key) => {
      const attachment = addedAttachments[key];
      if (attachment instanceof File) {
        formData.append(key, attachment);
      } else if (attachment && typeof attachment === 'object') {
        buildFormData(formData, attachment, key);
      }
    });

    updatePdcrMutation.mutate({ id: searchTerm, formData: formData });
  };

  const updatePdcrMutation = useMutation({
    mutationFn: ({ id, formData }) => updatePdcrVoucher(id, formData),
    onSuccess: (data) => {
      showToast('Pdcr Voucher Updated!', 'success');
      if (getPrintSettings('pdcr_issue_as_pdcp')) {
        window.open(data.detail?.pdf_url, '_blank');
      }
      setLoading(false);
      setPageState('view');
      // Clear attachment tracking after successful update
      setAddedAttachments({});
      setDeletedAttachments([]);
      queryClient.invalidateQueries(['pdcrVoucher']);
    },
    onError: (error) => {
      showErrorToast(error || 'Error updating Pdcr Voucher');
      setLoading(false);
    },
  });

  const handleCancel = () => {
    setAddedAttachments({});
    setDeletedAttachments([]);
    filesInitializedRef.current = false;
    setPageState('view');
  };

  if (isLoading || !searchTerm) {
    return (
      <div className="d-card">
        <div className="d-flex flex-column gap-4">
          <div className="d-flex gap-3 flex-wrap justify-content-between">
            <div className="flex-grow-1" style={{ maxWidth: '523px' }}>
              <Skeleton height={20} width={100} />
              <Skeleton height={40} width={400} />
              <div className="mt-3">
                <Skeleton height={20} width={100} />
                <Skeleton height={100} width={400} />
              </div>
            </div>
            <div style={{ width: '350px' }} className="mt-3">
              <Skeleton height={200} width={350} />
            </div>
          </div>
          <div className="flex-grow-1">
            <table className="table table-bordered">
              <thead>
                <tr>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <th key={i}>
                      <Skeleton
                        duration={1}
                        width={'80%'}
                        baseColor="#ddd"
                        height={20}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <td key={i}>
                      <Skeleton
                        duration={1}
                        width={'70%'}
                        baseColor="#ddd"
                        height={20}
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <Skeleton height={40} width={200} />
            <div className="d-flex gap-2">
              <Skeleton height={40} width={80} />
              <Skeleton height={40} width={80} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="d-card">
        <div className="text-center py-4">
          <p className="text-danger mb-0">
            {isNullOrEmpty(queryError?.message)
              ? 'Unable to fetch data at this time'
              : queryError.message}
          </p>
        </div>
      </div>
    );
  }

  if (!pdcrVoucher) {
    return (
      <div className="d-card">
        <div className="text-center py-4">
          <p className="text-muted mb-0">No PDCR voucher found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Formik
        innerRef={formikRef}
        onSubmit={handleSave}
        enableReinitialize={true}
        initialValues={{
          ledger: ledger || '',
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
        }) => {
          return (
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
                              selected.label
                                ?.toLowerCase()
                                ?.startsWith('add new')
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
                              selected.label
                                ?.toLowerCase()
                                ?.startsWith('add new')
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
                                  `PDCR issued to ${selected.label} (${ledgerLabel})`
                                );
                                setNarration(
                                  `PDCR issued to ${selected.label} (${ledgerLabel})`
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
                                  loading={isLoadingBalance}
                                  error={ledgerAccountBalance?.error || null}
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
                      {
                        title: 'Date',
                        type: 'date',
                        placeholder: 'Enter Date',
                      },
                      {
                        title: 'FC Amount',
                        type: 'number',
                        placeholder: 'Enter FC Amount',
                      },
                    ]}
                  >
                    <tbody>
                      {receiptVoucherData.length > 0
                        ? receiptVoucherData.map((item) => (
                            <tr
                              key={item.id}
                              style={
                                item.id === selectedPdcrId
                                  ? { backgroundColor: '#e3f2fd' }
                                  : {}
                              }
                            >
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
              </div>
            </Form>
          );
        }}
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
          { text: 'Update', onClick: handleSave },
          {
            text: 'Cancel',
            onClick: handleCancel,
            variant: 'secondaryButton',
          },
        ]}
        loading={loading}
        onAttachmentClick={() => setShowAttachmentsModal(true)}
        lastVoucherNumbers={lastVoucherNumbers}
        setSearchTerm={setSearchTerm}
        setPageState={setPageState}
      />

      {/* Attachments Modal (Receipt Voucher Edit Pattern) */}
      <CustomModal
        show={showAttachmentsModal}
        close={() => setShowAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          showModal={showAttachmentsModal}
          closeModal={() => setShowAttachmentsModal(false)}
          item={pdcrVoucherData}
          deleteService={deletePdcrVoucherAttachment}
          uploadService={addPdcrVoucherAttachment}
          closeUploader={() => setShowAttachmentsModal(false)}
          voucherAttachment={true}
          queryToInvalidate={['pdcrVoucher', searchTerm]}
          deferredMode={true}
          getUploadedFiles={handleVoucherAttachmentsUpload}
          getDeletedAttachments={handleDeletedAttachments}
          currentFiles={currentFiles}
          setCurrentFiles={setCurrentFiles}
        />
      </CustomModal>
    </>
  );
};

export default EditPdcrIssueAsPdcp;
