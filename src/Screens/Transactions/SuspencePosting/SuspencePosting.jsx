// SuspensePosting.js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { PulseLoader } from 'react-spinners';

// Components
import CustomButton from '../../../Components/CustomButton';
import CustomCheckbox from '../../../Components/CustomCheckbox/CustomCheckbox';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast';

// HOC & Hooks
import withFilters from '../../../HOC/withFilters ';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';
import useModulePermissions from '../../../Hooks/useModulePermissions';

// Services & Utils
import {
  getAccountsbyType,
  getCurrencies,
  getOffices,
  getSuspensePostingListing,
  updateSuspensePosting,
} from '../../../Services/Transaction/SuspensePosting';
import { suspencePostingHeaders } from '../../../Utils/Constants/TableHeaders';
import { isNullOrEmpty, showErrorToast } from '../../../Utils/Utils';
import withModal from '../../../HOC/withModal';
import useSettingsStore from '../../../Stores/SettingsStore';
import { postingDetailsSchema } from '../../../Utils/Validations/ValidationSchemas';

const SuspencePosting = ({
  showModal,
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Suspense Posting');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));

  const { getPrintSettings, updatePrintSetting } = useSettingsStore();

  // Permissions
  const permissions = useModulePermissions('transactions', 'suspense_posting');
  const {
    print: hasPrintPermission,
    post: hasPostPermission,
    cancel_posting: hasCancelPostingPermission,
  } = permissions || {};

  const queryClient = useQueryClient();
  const [showPostingDetailsModal, setShowPostingDetailsModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [type, setType] = useState('');
  const [ledgerFilter, setLedgerFilter] = useState('');
  const [accountOptions, setAccountOptions] = useState([
    { value: 'All', label: 'All' },
  ]);

  // Individual loading states for each button action
  const [loadingStates, setLoadingStates] = useState({
    cancelPosting: {},
    approve: {},
    hold: {},
    post: {},
    modalSubmit: false,
  });

  // Fetch Table Data
  const { data, isLoading, isError, error } = useFetchTableData(
    'suspensePostingListing',
    filters,
    updatePagination,
    getSuspensePostingListing
  );

  const suspensePostingData = data || [];

  // Mutation: Update Posting Status
  const updatePostingMutation = useMutation({
    mutationFn: ({ id, status, formData, actionType }) => {
      // Set loading state for specific action and item
      setLoadingStates((prev) => ({
        ...prev,
        [actionType]: { ...prev[actionType], [id]: true },
      }));
      return updateSuspensePosting(id, status, formData);
    },
    onSuccess: (data, variables) => {
      showToast(data.message, 'success');
      queryClient.invalidateQueries(['suspensePostingListing']);
      // Clear loading state for specific action and item
      setLoadingStates((prev) => ({
        ...prev,
        [variables.actionType]: {
          ...prev[variables.actionType],
          [variables.id]: false,
        },
      }));
    },
    onError: (error, variables) => {
      if (error.message == 'Voucher limit reached for this branch.') {
        showModal(
          'Cannot Create',
          'You have reached the maximum number of SJV. To create new transactions you need to increase the transaction count form the Transaction Number Register.',
          null,
          'error'
        );
      } else {
        showErrorToast(error);
      }
      setLoadingStates((prev) => ({
        ...prev,
        [variables.actionType]: {
          ...prev[variables.actionType],
          [variables.id]: false,
        },
      }));
    },
  });

  // Show toast if table error
  if (isError) showErrorToast(error);

  // Fetch Ledger-Specific Accounts for Filter
  useEffect(() => {
    if (filters.ledger && filters.ledger !== ledgerFilter) {
      setLedgerFilter(filters.ledger);
    }
  }, [filters.ledger]);

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!ledgerFilter) return;
      try {
        const data = await getAccountsbyType(ledgerFilter);
        const options = data.map((acc) => ({
          value: acc.id,
          label: acc.title || acc.name,
        }));
        setAccountOptions([{ value: 'All', label: 'All' }, ...options]);
      } catch (err) {
        console.error('Failed to load account types', err);
        setAccountOptions([{ value: 'All', label: 'All' }]);
      }
    };
    fetchAccounts();
  }, [ledgerFilter]);

  // Queries for Currencies, Offices, Accounts for Modal
  const { data: currencies = [] } = useQuery({
    queryKey: ['currenciesTypes'],
    queryFn: getCurrencies,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const { data: offices = [] } = useQuery({
    queryKey: ['officesTypes'],
    queryFn: getOffices,
    refetchOnWindowFocus: false,
    retry: 1,
  });

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

  const handleStatusUpdate = (item, status, actionType) => {
    updatePostingMutation.mutate({
      id: item.id,
      status,
      formData: {},
      actionType,
    });
  };

  // Use the standard ledgerOptions with correct order: PL → GL → WIC
  const ledgerOptions = [
    { label: 'PL', value: 'party' },
    { label: 'GL', value: 'general' },
    { label: 'WIC', value: 'walkin' },
  ];

  return (
    <>
      <div className="d-flex justify-content-end flex-wrap mb-3">
        <h2 className="screen-title flex-grow-1">Suspense Posting</h2>
      </div>

      <Row>
        <Col xs={12}>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={suspencePostingHeaders}
            pagination={pagination}
            isPaginated={false}
            useClearButton={true}
            selectOptions={[
              {
                title: 'ledger',
                options: [
                  { value: 'party', label: 'PL' },
                  { value: 'general', label: 'GL' },
                  { value: 'walkin', label: 'WIC' },
                ],
              },
              { title: 'account', options: accountOptions },
              {
                title: 'currency',
                options: [
                  { value: 'All', label: 'All' },
                  ...currencies.map((c) => ({
                    value: c.id,
                    label: c.currency_code,
                  })),
                ],
              },
              {
                title: 'office',
                options: [
                  { value: 'All', label: 'All' },
                  ...offices.map((c) => ({
                    value: c.id,
                    label: c.office_location,
                  })),
                ],
              },
              {
                title: 'status',
                options: [
                  { value: 'All', label: 'All' },
                  { value: '1', label: 'UnApproved' },
                  { value: '2', label: 'UnPosted' },
                  { value: '3', label: 'Posted' },
                ],
              },
            ]}
            dateFilters={[{ label: 'Period', title: 'Period' }]}
            rangeFilters={[
              { label: 'Debit Amount', title: 'Debit Amount' },
              { label: 'Credit Amount', title: 'Credit Amount' },
            ]}
            isLoading={isLoading}
          >
            {(suspensePostingData.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={suspencePostingHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {suspensePostingData.map((item) => (
                  <tr key={item.id}>
                    <td>{item.svr_no}</td>
                    <td>{item.date}</td>
                    <td>{item.account}</td>
                    <td>{item.narration}</td>
                    <td>{item.currency_code}</td>
                    <td>{item.debit}</td>
                    <td>{item.credit}</td>
                    <td>{item.sjv_no}</td>
                    <td>{item.posted_account}</td>
                    <td>{item.approved_by}</td>
                    <td className="d-flex gap-2 justify-content-center">
                      {item.status_detail === 'Settle' &&
                        hasCancelPostingPermission && (
                          <CustomButton
                            text={
                              loadingStates.cancelPosting[item.id] ? (
                                <PulseLoader size={8} color="#fff" />
                              ) : (
                                'Cancel Posting'
                              )
                            }
                            onClick={() =>
                              handleStatusUpdate(item, 5, 'cancelPosting')
                            }
                            className="red-button actionn-btn"
                            disabled={loadingStates.cancelPosting[item.id]}
                          />
                        )}
                      {item.status_detail === 'Open' && (
                        <CustomButton
                          text={
                            loadingStates.approve[item.id] ? (
                              <PulseLoader size={8} color="#fff" />
                            ) : (
                              'Approve'
                            )
                          }
                          onClick={() => handleStatusUpdate(item, 2, 'approve')}
                          className="yellow-button actionn-btn"
                          disabled={loadingStates.approve[item.id]}
                        />
                      )}
                      {item.status_detail === 'Approved' && (
                        <>
                          <CustomButton
                            text={
                              loadingStates.hold[item.id] ? (
                                <PulseLoader size={8} color="#fff" />
                              ) : (
                                'Hold'
                              )
                            }
                            onClick={() => handleStatusUpdate(item, 4, 'hold')}
                            className="orange-button actionn-btn"
                            disabled={loadingStates.hold[item.id]}
                          />
                          {hasPostPermission && (
                            <CustomButton
                              text={
                                loadingStates.post[item.id] ? (
                                  <PulseLoader size={8} color="#fff" />
                                ) : (
                                  'Post'
                                )
                              }
                              onClick={() => {
                                setCurrentItem(item);
                                setShowPostingDetailsModal(true);
                                setType('');
                              }}
                              className="green-button actionn-btn"
                              disabled={loadingStates.post[item.id]}
                            />
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </CustomTable>
        </Col>
      </Row>

      {/* Posting Details Modal */}
      <CustomModal
        show={showPostingDetailsModal}
        close={() => setShowPostingDetailsModal(false)}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle">Posting Details</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{
              settle_date: date || '',
              ledger: '',
              account_id: '',
              description: '',
              is_print:
                hasPrintPermission && getPrintSettings('suspense_posting')
                  ? 1
                  : 0,
            }}
            validationSchema={postingDetailsSchema}
            onSubmit={async (values) => {
              try {
                setLoadingStates((prev) => ({ ...prev, modalSubmit: true }));
                const res = await updatePostingMutation.mutateAsync({
                  id: currentItem.id,
                  status: 3,
                  formData: values,
                  actionType: 'modalSubmit',
                });
                setShowPostingDetailsModal(false);
                if (values.is_print === 1 && res?.detail?.pdf_url) {
                  window.open(res.detail.pdf_url, '_blank');
                }
              } catch (err) {
                console.error(err);
              } finally {
                setLoadingStates((prev) => ({ ...prev, modalSubmit: false }));
              }
            }}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              setFieldValue,
            }) => (
              <Form>
                <div className="mb-3">
                  <CustomInput
                    name="settle_date"
                    type="date"
                    label="Settlement Date"
                    value={values.settle_date}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>
                <div className="mb-3">
                  <SearchableSelect
                    name="ledger"
                    label="Ledger"
                    required
                    placeholder="Select Ledger"
                    options={ledgerOptions}
                    value={values.ledger}
                    onChange={(selected) => {
                      setType(selected.value);
                      handleChange({
                        target: { name: 'ledger', value: selected.value },
                      });
                    }}
                    onBlur={handleBlur}
                    error={touched.ledger && errors.ledger}
                  />
                </div>
                <div className="mb-3">
                  <SearchableSelect
                    name="account_id"
                    required
                    label="Account"
                    placeholder="Select Account"
                    options={getAccountTypeOptions()}
                    onChange={(v) => {
                      setFieldValue('account_id', v.value);
                    }}
                    value={values.account_id}
                    onBlur={handleBlur}
                    error={touched.account_id && errors.account_id}
                  />
                </div>
                <div className="mb-45">
                  <CustomInput
                    name="description"
                    type="textarea"
                    placeholder="Enter Description"
                    label="Description"
                    value={values.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.description && errors.description}
                  />
                </div>
                <div className="mb-45">
                  {hasPrintPermission && (
                    <CustomCheckbox
                      name="is_print"
                      label="Print"
                      checked={values.is_print === 1}
                      onChange={(e) => {
                        setFieldValue('is_print', e.target.checked ? 1 : 0);
                        updatePrintSetting(
                          'suspense_posting',
                          e.target.checked
                        );
                      }}
                      onBlur={handleBlur}
                      style={{ border: 'none', margin: 0, padding: 0 }}
                    />
                  )}
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {!loadingStates.modalSubmit ? (
                    <>
                      <CustomButton type="submit" text="Save" />
                      <CustomButton
                        variant="secondaryButton"
                        text="Cancel"
                        type="button"
                        onClick={() => setShowPostingDetailsModal(false)}
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
    </>
  );
};

export default withModal(withFilters(SuspencePosting));
