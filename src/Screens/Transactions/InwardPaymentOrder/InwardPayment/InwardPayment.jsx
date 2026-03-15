import { Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { HiPaperClip, HiPrinter } from 'react-icons/hi2';
import CustomButton from '../../../../Components/CustomButton';
import CustomInput from '../../../../Components/CustomInput';
import CustomModal from '../../../../Components/CustomModal';
import CustomTable from '../../../../Components/CustomTable/CustomTable';
import StatusChip from '../../../../Components/StatusChip/StatusChip';
import TableActionDropDown from '../../../../Components/TableActionDropDown/TableActionDropDown';
import withFilters from '../../../../HOC/withFilters ';
import { usePageTitle } from '../../../../Hooks/usePageTitle';
import useModulePermissions from '../../../../Hooks/useModulePermissions';
import { inwardPaymentHeaders } from '../../../../Utils/Constants/TableHeaders';
import { useNavigate } from 'react-router-dom';
import { useFetchTableData } from '../../../../Hooks/useTable';
import {
  addInwardPaymentAttachment,
  changeInwardPaymentStatus,
  deleteInwardPaymentAttachment,
  getAccountsbyType,
  getCurrencies,
  getInwardPaymentListing,
  printInwardPayment,
} from '../../../../Services/Transaction/InwardPayment';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { showToast } from '../../../../Components/Toast/Toast';
import {
  formatDate,
  formatNumberForDisplay,
  showErrorToast,
  isNullOrEmpty,
} from '../../../../Utils/Utils';
import AttachmentsView from '../../../../Components/AttachmentsView/AttachmentsView';
import { PulseLoader } from 'react-spinners';
import CustomFilters from '../../../../Components/CustomFilters/CustomFilters';

const InwardPayment = ({
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Inward Payment');
  const [showHoldingReasonModal, setShowHoldingReasonModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const navigate = useNavigate();
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [printItem, setPrintItem] = useState(null); // used only for print
  const queryClient = useQueryClient();

  // Permissions
  const permissions = useModulePermissions('transactions', 'inward_payment');
  const { pay: hasPayPermission, print: hasPrintPermission } = permissions || {};

  // Advanced Filter State
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

  // Handle when filters are cleared (CustomFilters sets filters to '')
  useEffect(() => {
    if (
      filters === '' ||
      (typeof filters === 'object' && Object.keys(filters).length === 0)
    ) {
      // Preserve ledger when clearing filters - don't reset ledger state
      setFilters({
        page: 1,
        per_page: 10,
        search: '',
      });
      // Don't clear ledger filter and selectedLedger on clear
      // setLedgerFilter('');
      // setSelectedLedger('');
    }
  }, [filters, setFilters]);

  // Fetch Table Data
  const { data, isLoading, isError, error } = useFetchTableData(
    'inwardPaymentListing',
    filters,
    updatePagination,
    getInwardPaymentListing
  );

  const inwardPaymentData = data?.data || [];

  // Mutation: Update Inward Payment Status
  const updateInwardPaymentMutation = useMutation({
    mutationFn: (data) => changeInwardPaymentStatus(data.id, data),
    onSuccess: () => {
      showToast('Status Updated!', 'success');
      queryClient.invalidateQueries(['inwardPaymentListing']);
      setSelectedItem(null); // Reset selected item to hide loader
    },
    onError: (error) => {
      console.error('Error updating Inward Payment Status', error);
      showErrorToast(error);
      setSelectedItem(null); // Reset selected item to hide loader
    },
  });

  const handleHoldingReasonSubmit = (values) => {
    updateInwardPaymentMutation.mutate({
      id: selectedItem?.id,
      status: 'hold',
      reason: values.comment, // sending reason to backend
    });
    setShowHoldingReasonModal(false);
  };

  const {
    data: inwardPaymentPrint,
    isLoading: inwardPaymentIsLoading,
    isError: inwardPaymentIsError,
    error: inwardPaymentError,
  } = useQuery({
    queryKey: ['printInwardPayment', printItem?.id],
    queryFn: () => printInwardPayment(printItem?.id),
    enabled: !!printItem?.id, // Only triggers when printItem is set
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // useEffect(() => {
  //   if (inwardPaymentPrint?.pdf_url || inwardPaymentPrint?.print_url) {
  //     const url = inwardPaymentPrint.pdf_url || inwardPaymentPrint.print_url;
  //     window.open(url, '_blank');
  //     setPrintItem(null); // reset after printing
  //   }
  // }, [inwardPaymentPrint]);

  if (isError) {
    showErrorToast(error);
  }

  if (inwardPaymentIsError) {
    showErrorToast(inwardPaymentError);
  }

  const payTypeMap = {
    cash_deposit: 'Cash Deposit',
    cash_payment: 'Cash Payment',
    pdc: 'PDC',
    cheque_payment: 'Cheque Payment',
    cheque_deposit: 'Cheque Deposit',
  };

  //extra rows data
  const getCurrencySummaries = (data) => {
    const summaries = {};

    data?.forEach((item) => {
      const currency = item?.currency?.currency_code || 'N/A';
      const fcAmount = parseFloat(item?.fc_amount || 0);
      const balanceAmount = parseFloat(
        item?.paid?.balance_amount || item?.fc_amount
      );
      const status = item?.status;

      if (!summaries[currency]) {
        summaries[currency] = {
          fc_total: 0,
          fc_balance: 0,
          approved: 0,
          unapproved: 0,
        };
      }

      summaries[currency].fc_total += fcAmount;
      summaries[currency].fc_balance += balanceAmount;

      if (['approve', 'partial-paid'].includes(status)) {
        summaries[currency].approved += balanceAmount;
      } else {
        summaries[currency].unapproved += balanceAmount;
      }
    });

    return summaries;
  };

  const currencySummaries = getCurrencySummaries(inwardPaymentData);

  const summaryRows = Object.entries(currencySummaries).map(
    ([currency, summary]) => (
      <tr key={`summary-${currency}`} className="table-summary-row">
        <td colSpan={5}></td>
        <td>
          <strong>{currency}</strong>
        </td>
        <td>{formatNumberForDisplay(summary.fc_balance, 2)}</td>
        <td>{formatNumberForDisplay(summary.fc_total, 2)}</td>
        <td colSpan={3}>
          <strong>
            Approved: {formatNumberForDisplay(summary.approved, 2)} - Unapproved:
            {formatNumberForDisplay(summary.unapproved, 2)}
          </strong>
        </td>
        <td colSpan={6}></td>
      </tr>
    )
  );

  const { data: currencies = [] } = useQuery({
    queryKey: ['currenciesTypes'],
    queryFn: getCurrencies,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const [type, setType] = useState('');
  const [ledgerFilter, setLedgerFilter] = useState('');
  const [selectedLedger, setSelectedLedger] = useState(''); // For immediate ledger tracking
  const [preservedNonTriggeringFilters, setPreservedNonTriggeringFilters] = useState({}); // Preserve nonTriggeringFilters when advanced filter closes

  // Fetch Ledger-Specific Accounts using React Query (using selectedLedger for immediate updates)
  const {
    data: ledgerAccounts,
    isLoading: ledgerAccountsLoading,
    isError: ledgerAccountsError,
  } = useQuery({
    queryKey: ['ledgerAccounts', selectedLedger],
    queryFn: () => getAccountsbyType(selectedLedger),
    enabled: !!selectedLedger && selectedLedger !== '',
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Handle ledger change and reset account
  useEffect(() => {
    if (
      filters.ledger &&
      filters.ledger !== ledgerFilter &&
      filters.ledger !== ''
    ) {
      // Only reset account if ledger actually changed (not just applied)
      const ledgerChanged =
        ledgerFilter !== '' && filters.ledger !== ledgerFilter;

      setLedgerFilter(filters.ledger);
      setSelectedLedger(filters.ledger); // Update selected ledger

      // Reset account only when ledger changes, not when applying filters
      if (ledgerChanged && filters.account) {
        setFilters((prev) => ({ ...prev, account: '' }));
      }
    } else if (!filters.ledger || filters.ledger === '') {
      // Only clear ledger state if there's no ledger selected anywhere (not in filters, not in nonTriggeringFilters, not in selectedLedger)
      // This prevents clearing when ledger is in nonTriggeringFilters (non-triggering filter)
      const hasLedgerSelected = selectedLedger || ledgerFilter || preservedNonTriggeringFilters?.ledger;
      
      if (!hasLedgerSelected) {
        // Clear account when ledger is set to "All" (no ledger selected anywhere)
        if (filters.account) {
          setFilters((prev) => ({ ...prev, account: '' }));
        }
        setLedgerFilter('');
        setSelectedLedger('');
      }
    }
  }, [filters.ledger, ledgerFilter, setFilters, selectedLedger, preservedNonTriggeringFilters]);

  // Sync selectedLedger when advanced filter opens with existing ledger filter
  useEffect(() => {
    if (showAdvancedFilter) {
      // Sync from filters.ledger, ledgerFilter, or preserved state
      const ledgerToSync = filters.ledger || ledgerFilter || preservedNonTriggeringFilters?.ledger;
      if (ledgerToSync && ledgerToSync !== '' && selectedLedger !== ledgerToSync) {
        setSelectedLedger(ledgerToSync);
      }
    }
  }, [showAdvancedFilter, filters.ledger, ledgerFilter, preservedNonTriggeringFilters, selectedLedger]);

  // Handle non-triggering filter changes (for immediate ledger updates)
  const handleNonTriggeringFilters = (nonTriggeringFilters) => {
    if (nonTriggeringFilters.ledger !== undefined) {
      setSelectedLedger(nonTriggeringFilters.ledger);
      // Also update preserved state
      setPreservedNonTriggeringFilters(nonTriggeringFilters);
    }
  };

  // Handle clear filters - preserve ledger
  const handleClearFilters = (setNonTriggeringFilters) => {
    // Preserve ledger in nonTriggeringFilters when clearing
    const preservedLedger = selectedLedger || ledgerFilter || filters.ledger || preservedNonTriggeringFilters?.ledger;
    const newNonTriggeringFilters = {};
    if (preservedLedger && preservedLedger !== '') {
      newNonTriggeringFilters.ledger = preservedLedger;
      setSelectedLedger(preservedLedger);
      setPreservedNonTriggeringFilters(newNonTriggeringFilters);
    } else {
      setPreservedNonTriggeringFilters({});
    }
    setNonTriggeringFilters(newNonTriggeringFilters);
  };

  // Handle apply filters - preserve ledger in nonTriggeringFilters
  const handleApplyFilters = (apiFilters, setNonTriggeringFilters, currentNonTriggeringFilters) => {
    // Preserve ledger in nonTriggeringFilters when applying
    const preservedLedger = selectedLedger || ledgerFilter || filters.ledger || currentNonTriggeringFilters?.ledger || preservedNonTriggeringFilters?.ledger;
    const newNonTriggeringFilters = {};
    if (preservedLedger && preservedLedger !== '') {
      // Keep ledger in nonTriggeringFilters so it remains in UI
      newNonTriggeringFilters.ledger = preservedLedger;
      setLedgerFilter(preservedLedger);
      setSelectedLedger(preservedLedger);
    }
    // Update both local and preserved state
    setNonTriggeringFilters(newNonTriggeringFilters);
    setPreservedNonTriggeringFilters(newNonTriggeringFilters);
    // Apply the API filters (without ledger, as it's non-triggering)
    setFilters(apiFilters);
    // Hide advanced filter after applying
    if (showAdvancedFilter) {
      setShowAdvancedFilter(false);
    }
  };

  // Wrapper for setFilters to hide advanced filter after applying (not clearing)
  const handleSetFilters = (newFilters) => {
    setFilters(newFilters);
    // Hide advanced filter after applying filters (not when clearing)
    // Only close if filters are being applied (not empty string/object)
    const isEmpty =
      newFilters === '' ||
      (typeof newFilters === 'object' &&
        newFilters !== null &&
        Object.keys(newFilters).length === 0);
    
    if (showAdvancedFilter && !isEmpty) {
      setShowAdvancedFilter(false);
    }
  };

  // Get account options based on ledger selection
  const getAccountOptions = () => {
    if (!selectedLedger || selectedLedger === '') {
      return [{ value: '', label: 'Select Ledger First' }];
    }
    if (ledgerAccountsLoading) {
      return [{ value: '', label: 'Loading...' }];
    }
    if (ledgerAccountsError) {
      return [{ value: '', label: 'Error loading accounts' }];
    }
    if (!ledgerAccounts || ledgerAccounts.length === 0) {
      return [{ value: '', label: 'No accounts found' }];
    }

    const options = ledgerAccounts.map((acc) => ({
      value: acc.id,
      label: acc.title || acc.name,
    }));
    return [{ value: '', label: 'All' }, ...options];
  };

  const accountOptions = getAccountOptions();

  const {
    data: accountTypes,
    isLoading: accountTypeLoading,
    isError: accountTypeError,
    error: accountError,
  } = useQuery({
    queryKey: ['accountTypes', type],
    queryFn: () => getAccountsbyType(type),
    enabled: !!type,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const getAccountTypeOptions = () => {
    if (!type) return [{ label: 'Select Type First', value: null }];
    if (accountTypeLoading) return [{ label: 'Loading...', value: null }];
    if (accountTypeError)
      return [{ label: 'Unable to fetch account Type', value: null }];
    if (isNullOrEmpty(accountTypes))
      return [{ label: `No Accounts for type ${type}`, value: null }];

    const options = accountTypes.map((x) => ({ value: x.id, label: x.title }));
    return [
      { label: 'Select Account', value: null, disabled: true },
      ...options,
    ];
  };

  //make mutation for print
  const printInwardPaymentMutation = useMutation({
    mutationFn: (id) => printInwardPayment(id),
    onSuccess: (data) => {
      if (data?.pdf_url) {
        window.open(data.pdf_url, '_blank');
      }
    },
    onError: (error) => {
      console.error('Error fetching PDF:', error);
    },
  });

  const handlePrint = (item) => {
    printInwardPaymentMutation.mutate(item?.voucher?.voucher_no);
  };

  return (
    <section>
      <div className="d-flex flex-wrap mb-3">
        <h2 className="screen-title m-0 d-inline">Inward Payment</h2>
      </div>
      <div
        className={`d-flex justify-content-between align-items-center flex-wrap gap-2 gap-lg-4 ${
          showAdvancedFilter ? 'mb-5 mb-lg-0' : 'mb-3 mb-lg-0'
        }`}
      >
        <CustomFilters
          filters={filters}
          setFilters={setFilters}
          searchPlaceholder="Search DPV"
          additionalFilters={[
            {
              label: 'FC Amount',
              title: 'FC Amount',
              placeholder: 'Enter FC Amount',
              type: 'number',
            },
          ]}
          selectOptions={[
            {
              title: 'currency',
              label: 'Currency',
              options: [
                { value: '', label: 'All' },
                ...currencies.map((c) => ({
                  value: c.id,
                  label: c.currency_code,
                })),
              ],
            },
          ]}
          hideItemsPerPage={true}
        />
        {/* Advanced Filter Toggle */}
        <div className="mb-3 mb-lg-0">
          <CustomButton
            className="cp"
            variant={showAdvancedFilter ? 'secondaryButton' : 'primaryButton'}
            text={
              showAdvancedFilter ? 'Hide Advanced Filter' : 'Advance Filter'
            }
            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
          />
        </div>
      </div>
      {/* Advanced Filters Section */}
      {showAdvancedFilter && (
        <div className="advanced-filter-container mb-4 mt-3">
          <h5 className="advanced-filter-title">Advance Filters</h5>
          <CustomFilters
            filters={filters}
            setFilters={handleSetFilters}
            hideItemsPerPage={true}
            searchPlaceholder="Search Here"
            onNonTriggeringFiltersChange={handleNonTriggeringFilters}
            onClearFilters={handleClearFilters}
            onApplyFilters={handleApplyFilters}
            initialNonTriggeringFilters={preservedNonTriggeringFilters}
            selectOptions={[
              {
                title: 'ledger',
                label: 'Ledger',
                triggerFilterOnChange: false, // Don't trigger API call immediately
                options: [
                  { value: '', label: 'All' },
                  { value: 'general', label: 'GL' },
                  { value: 'party', label: 'PL' },
                  { value: 'walkin', label: 'WIC' },
                ],
              },
              // Only show Account field when ledger is selected (not "All")
              ...((selectedLedger && selectedLedger !== '') ||
              (filters.ledger && filters.ledger !== '')
                ? [
                    {
                      title: 'account',
                      label: 'Account',
                      options: accountOptions,
                    },
                  ]
                : []),
              {
                title: 'currency',
                label: 'Currency',
                options: [
                  { value: '', label: 'All' },
                  ...currencies.map((c) => ({
                    value: c.id,
                    label: c.currency_code,
                  })),
                ],
              },
            ]}
            dateFilters={[
              { label: 'Pay Date', title: 'Pay Date' },
              { label: 'Debit Note Date', title: 'Debit Note Date' },
            ]}
            rangeFilters={[
              { label: 'Debit Note Range', title: 'Debit Note Range' },
              { label: 'Amount', title: 'Amount' },
            ]}
            useApplyButton={true}
            useClearButton={true}
          />
        </div>
      )}

      <Row>
        <Col xs={12}>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={inwardPaymentHeaders}
            pagination={pagination}
            isLoading={isLoading}
            hasFilters={false}
            isPaginated={false}
            summaryRows={summaryRows}
          >
            {(inwardPaymentData?.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={inwardPaymentHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {inwardPaymentData?.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      background: item?.status === 'pending' ? '#f8d5d5' : '',
                    }}
                  >
                    <td>{formatDate(item?.pay_date)}</td>
                    <td>{item?.walkin_customer?.customer_name}</td>
                    <td>{item?.id_number}</td>
                    <td>{item?.sender}</td>
                    <td>{item?.contact_no}</td>
                    <td>{item?.currency?.currency_code}</td>
                    <td>{formatNumberForDisplay(item?.balance_amount || 0, 2)}</td>
                    <td>{formatNumberForDisplay(item?.fc_amount, 2)}</td>
                    <td>{item?.ref_no}</td>
                    <td>{item?.order?.voucher?.voucher_no}</td>
                    <td>{formatDate(item?.order?.date)}</td>
                    <td>{item?.order?.debit_account_details?.title}</td>
                    <td>{payTypeMap[item?.pay_type] || item?.pay_type}</td>
                    <td>{item?.bank_name}</td>
                    <td>{item?.narration}</td>
                    <td>{item?.reason}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        {item?.status === 'pending' && (
                          <>
                            {updateInwardPaymentMutation.isPending &&
                            selectedItem?.id === item?.id ? (
                              <PulseLoader size={8} className="ms-2" />
                            ) : (
                              <StatusChip
                                status="Approve"
                                className="ms-2 cp"
                                onClick={() => {
                                  setSelectedItem(item);
                                  updateInwardPaymentMutation.mutate({
                                    id: item?.id,
                                    status: 'approve',
                                  });
                                }}
                              />
                            )}
                          </>
                        )}

                        {item?.status === 'approve' && (
                          <>
                            {updateInwardPaymentMutation.isPending &&
                            selectedItem?.id === item?.id ? (
                              <PulseLoader size={8} className="ms-2" />
                            ) : (
                              <StatusChip
                                status="Hold"
                                className="ms-2 cp"
                                onClick={() => {
                                  setShowHoldingReasonModal(true);
                                  setSelectedItem(item);
                                }}
                              />
                            )}
                            {hasPayPermission && (
                              <StatusChip
                                status="Pay"
                                className="ms-2 cp"
                                onClick={() => {
                                  navigate(
                                    `/transactions/inward-payment/pay/${item?.id}`
                                  );
                                }}
                              />
                            )}
                          </>
                        )}

                        {item?.status === 'partial-paid' && hasPayPermission && (
                          <StatusChip
                            status="Pay"
                            className="ms-2 cp"
                            onClick={() => {
                              navigate(
                                `/transactions/inward-payment/pay/${item?.id}`
                              );
                            }}
                          />
                        )}

                        {selectedItem?.id === item?.id &&
                        inwardPaymentIsLoading ? (
                          <PulseLoader size={8} className="ms-2" />
                        ) : (
                          <TableActionDropDown
                            displaySeparator={false}
                            actions={[
                              {
                                name: 'Attachment',
                                icon: HiPaperClip,
                                onClick: () => {
                                  setSelectedItem(item); // ✅ set the selected row item
                                  setShowAttachmentsModal(true); // ✅ open the modal
                                },
                                className: 'edit',
                              },
                              ...(hasPrintPermission
                                ? [
                                    {
                                      name: 'Print',
                                      icon: HiPrinter,
                                      onClick: () => {
                                        setSelectedItem(item);
                                        setPrintItem(item); // This will trigger useQuery
                                        handlePrint(item);
                                      },
                                      className: 'attachments',
                                    },
                                  ]
                                : []),
                            ]}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </CustomTable>
        </Col>
      </Row>

      {/* Attachements Modal */}
      <CustomModal
        show={showAttachmentsModal}
        close={() => setShowAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          showModal={showAttachmentsModal}
          closeModal={() => setShowAttachmentsModal(false)}
          item={selectedItem}
          deleteService={deleteInwardPaymentAttachment}
          uploadService={addInwardPaymentAttachment}
          closeUploader={() => setShowAttachmentsModal(false)}
          voucherAttachment={false}
          queryToInvalidate={['inwardPaymentListing']}
        />
      </CustomModal>

      {/* Holding Reason Modal */}
      <CustomModal
        show={showHoldingReasonModal}
        close={() => setShowHoldingReasonModal(false)}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle">Holding Reason</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{
              comment: '',
            }}
            // validationSchema={outOfScopeSchema}
            onSubmit={handleHoldingReasonSubmit}
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form>
                <div className="mb-45">
                  <CustomInput
                    label="Comment"
                    name="comment"
                    required
                    id="comment"
                    type="textarea"
                    rows={1}
                    placeholder="Enter comment"
                    value={values.comment}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.comment && errors.comment}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {!updateInwardPaymentMutation.isPending ? (
                    <>
                      <CustomButton type="submit" text={'Save'} />
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() => setShowHoldingReasonModal(false)}
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
    </section>
  );
};
export default withFilters(InwardPayment);
