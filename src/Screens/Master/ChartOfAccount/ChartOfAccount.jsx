import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import { useCallback, useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import MultiLevelDropdown from '../../../Components/MultiLevelDropdown/MultiLevelDropdown';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast';
import withModal from '../../../HOC/withModal';
import useDataMutations from '../../../Hooks/useDataMutations';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import {
  addChartOfAccount,
  deleteChartOfAccount,
  editChartOfAccount,
  getChartOfAccountListing,
  getLevel1and2Dropdowns,
  getLevel3and4Dropdowns,
  viewChartOfAccount,
} from '../../../Services/Masters/ChartOfAccount';
import { convertCOAAccountsToDropdownOptions } from '../../../Utils/Helpers';
import {
  downloadFile,
  formatDate,
  isNullOrEmpty,
  showErrorToast,
} from '../../../Utils/Utils';
import {
  addCOAValidationSchema,
  editCOAValidationSchema,
} from '../../../Utils/Validations/ValidationSchemas';

const ChartOfAccount = ({ showModal, closeModal }) => {
  usePageTitle('Chart of Account');
  const [rightSectionType, setRightSectionType] = useState('new');
  const [isDisabled, setIsDisabled] = useState(true);
  const [selectedAccountType, setSelectedAccountType] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [expandedItems, setExpandedItems] = useState([]);
  const [activeItemId, setActiveItemId] = useState(null);
  const [pdfState, setPdfState] = useState(false);
  const [excelState, setExcelState] = useState(false);
  const [pendingExpandAccountId, setPendingExpandAccountId] = useState(null);
  const queryClient = useQueryClient();

  const permissions = useModulePermissions('master', 'chart_of_account');

  const {
    create: hasCreatePermission,
    edit: hasEditPermission,
    delete: hasDeletePermission,
    view: hasViewPermission,
  } = permissions;

  const topSection = () => (
    <>
      <div className="d-flex justify-content-end flex-wrap mb-3">
        <h2 className="screen-title mb-0 flex-grow-1">Chart Of Account</h2>
        <div className="d-flex gap-2 flex-wrap">
          <CustomButton
            variant="secondaryButton"
            text={'Export to Excel'}
            loading={excelState}
            onClick={async () => {
              setExcelState(true);
              const res = await downloadFile('chart-of-accounts', 'xlsx');
              if (res) setExcelState(false);
            }}
          />
          <CustomButton
            variant="secondaryButton"
            text={'Export to PDF'}
            loading={pdfState}
            onClick={async () => {
              setPdfState(true);
              const res = await downloadFile('chart-of-accounts', 'pdf');
              if (res) setPdfState(false);
            }}
          />
          {hasCreatePermission && isDisabled && (
            <CustomButton
              text={'New'}
              onClick={() => {
                setIsDisabled(false);
                setActiveItemId(null);
                setSelectedAccount(null);
                setRightSectionType('new');
              }}
            />
          )}
        </div>
      </div>
    </>
  );
  const {
    data: chartOfAccounts,
    isLoading,
    isError,
    error,
    isSuccess,
  } = useQuery({
    queryKey: ['chartOfAccount'],
    queryFn: getChartOfAccountListing,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const {
    data: accountTypesData,
    isLoading: isLoadingAccountTypes,
    isError: isErrorAccountTypes,
    error: errorAccountTypes,
  } = useQuery({
    queryKey: ['chartOfAccountAccountTypes'],
    queryFn: getLevel1and2Dropdowns,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const {
    data: parentAccountTypesData,
    isLoading: isLoadingParentAccountTypes,
    isError: isErrorParentAccountTypes,
    error: errorParentAccountTypes,
  } = useQuery({
    queryKey: ['chartOfAccountParentAccountTypes', selectedAccountType],
    queryFn: () => getLevel3and4Dropdowns(selectedAccountType),
    enabled: !!selectedAccountType,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const {
    data: chartOfAccountDetails,
    isLoading: isLoadingAccountDetails,
    isError: isErrorAccountDetails,
    error: errorAccountDetails,
  } = useQuery({
    queryKey: ['chartOfAccountDetails', selectedAccount],
    queryFn: () => viewChartOfAccount(selectedAccount),
    enabled: !!selectedAccount,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Helper function to find parent hierarchy and expand tree
  const expandToAccount = useCallback((accountId, accounts) => {
    const findParents = (targetId, items, parents = []) => {
      for (const item of items) {
        // Compare both as numbers and strings to handle type mismatches
        if (item.id == targetId) {
          return parents;
        }
        if (item.children && item.children.length > 0) {
          const result = findParents(targetId, item.children, [
            ...parents,
            item.id,
          ]);
          if (result) return result;
        }
      }
      return null;
    };

    const parentIds = findParents(accountId, accounts);
    if (parentIds && parentIds.length > 0) {
      setExpandedItems(parentIds);
    }
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      const accountType = chartOfAccountDetails?.account_type_id;
      setSelectedAccountType(accountType);
    }
  }, [selectedAccount, chartOfAccountDetails]);

  // Auto-expand tree when new account is added
  useEffect(() => {
    if (pendingExpandAccountId && chartOfAccounts && !isLoading && isSuccess) {
      // Small delay to ensure React has finished rendering the updated tree
      setTimeout(() => {
        expandToAccount(pendingExpandAccountId, chartOfAccounts);
        setPendingExpandAccountId(null);
      }, 100);
    }
  }, [
    pendingExpandAccountId,
    chartOfAccounts,
    isLoading,
    isSuccess,
    expandToAccount,
  ]);

  const addChartOfAccountMutation = useMutation({
    mutationFn: addChartOfAccount,
    onError: (error) => {
      console.error('Error adding account', error);
      showErrorToast(error);
      if (!isNullOrEmpty(error.errors)) {
        for (const [key, value] of Object.entries(error.errors)) {
          value.map((err) => showToast(err, 'error'));
        }
      }
    },
  });

  const editChartOfAccountMutation = useMutation({
    mutationFn: (formData) => editChartOfAccount(selectedAccount, formData),
    onSuccess: () => {
      showToast('Account Updated!', 'success');
      queryClient.invalidateQueries(['chartOfAccountDetails', selectedAccount]);
      queryClient.invalidateQueries(['chartOfAccount']);
      setRightSectionType('view');
    },
    onError: (error) => {
      console.error('Error updating account', error);
      showErrorToast(error);
    },
  });

  const { deleteMutation } = useDataMutations({
    onDeleteSuccessCallback: () => {
      closeModal();
      showToast('Account Deleted Successfully', 'success');
      queryClient.invalidateQueries(['chartOfAccount']);
      setRightSectionType('new');
      setIsDisabled(true);
      setSelectedAccount(null);
      setActiveItemId(null);
    },
    onDeleteErrorCallback: (error) => {
      if (
        error.message.toLowerCase() ==
        'the chart of account cannot be deleted as it is currently in use.'
      ) {
        showModal(
          'Cannot be Deleted',
          error.message,
          () => closeModal(),
          'error'
        );
      } else {
        showErrorToast(error);
      }
    },
  });

  //add new
  const handleAccountSubmit = (values, resetForm) => {
    rightSectionType === 'new'
      ? addChartOfAccountMutation.mutate(values, {
          onSuccess: async (data) => {
            const newAccountId = data?.detail?.id;

            showToast('Account Added!', 'success');

            // First, invalidate queries to trigger refetch
            await queryClient.invalidateQueries(['chartOfAccount']);
            await queryClient.invalidateQueries([
              'chartOfAccountDetails',
              newAccountId,
            ]);

            // Set states after invalidation to ensure they persist
            setSelectedAccount(newAccountId);
            setActiveItemId(newAccountId);
            setPendingExpandAccountId(newAccountId);
            setIsDisabled(true);

            resetForm({
              values: {
                account_name: '',
                account_type: '',
                description: '',
                is_sub_account: 0 || '',
                parent_account_id: '',
              },
            });
          },
        })
      : editChartOfAccountMutation.mutate(values);
  };

  // Function to handle Delete action
  const handleDelete = (item) => {
    showModal(
      'Delete',
      `Are you sure you want to delete Account ${item?.account_name}?`,
      () => {
        deleteMutation.mutateAsync({
          serviceFunction: deleteChartOfAccount,
          id: item.id,
        });
      }
    );
  };

  if (isLoading || isLoadingAccountTypes) {
    return (
      <>
        {topSection()}
        <div className="d-card p-0">
          <div className="d-flex flex-column flex-lg-row">
            <div className="coa-box">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton
                  key={i}
                  style={{ marginBottom: 12 }}
                  duration={1}
                  width={'100%'}
                  baseColor="#ddd"
                  height={46}
                />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }
  if (isError) {
    return (
      <>
        {topSection()}
        <div className="d-card p-0 text-center py-5">
          You don’t have permission to view this section.
        </div>
      </>
    );
  }

  const rightSection = (type = '') => {
    switch (type) {
      case 'new':
        return (
          <>
            <h2 className="screen-title">New Account</h2>
            <Formik
              initialValues={{
                account_type: '',
                account_name: '',
                parent_account_id: '',
                is_sub_account: 0 || '',
                description: '',
              }}
              validationSchema={addCOAValidationSchema}
              onSubmit={(values, { resetForm }) => {
                handleAccountSubmit(values, resetForm);
              }}
            >
              {({
                values,
                touched,
                errors,
                handleChange,
                handleBlur,
                setFieldValue,
                resetForm,
              }) => (
                <Form>
                  <div className="row mb-4">
                    <div className="col-12 col-lg-6 mb-3">
                      <SearchableSelect
                        label={'Account Type'}
                        name="account_type"
                        required
                        isDisabled={isDisabled}
                        options={
                          isErrorAccountTypes
                            ? [
                                {
                                  label: 'Unable to fetch Account Types',
                                  value: null,
                                  isDisabled: true,
                                },
                              ]
                            : convertCOAAccountsToDropdownOptions(
                                accountTypesData
                              )
                        }
                        onChange={(v) => {
                          setFieldValue('account_type', v.value);
                          setSelectedAccountType(v.value);
                          setFieldValue('is_sub_account', 0);
                        }}
                        value={values.account_type}
                        placeholder={'Select Account Type Type'}
                      />
                      <ErrorMessage
                        name="account_type"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
                    <div className="col-12 col-lg-6 mb-3">
                      <CustomInput
                        name={'account_name'}
                        label={'Account Name'}
                        type={'text'}
                        disabled={isDisabled}
                        required
                        value={values.account_name}
                        placeholder={'Enter Account Name'}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.account_name && errors.account_name}
                      />
                    </div>
                    <div className="col-12 mb-4">
                      <div className="checkbox-wrapper">
                        <label className="checkbox-container">
                          <input
                            disabled={isDisabled}
                            onChange={(v) =>
                              setFieldValue(
                                'is_sub_account',
                                v.target.checked ? 1 : 0
                              )
                            }
                            type="checkbox"
                            name="is_sub_account"
                            checked={values.is_sub_account}
                          />
                          <span className="custom-checkbox"></span>
                          Make this a sub-account
                        </label>
                      </div>
                    </div>
                    {values.is_sub_account ? (
                      <div className="col-12 mb-4">
                        <SearchableSelect
                          label={'Parent Account*'}
                          name="parent_account_id"
                          isDisabled={isDisabled}
                          options={
                            !selectedAccountType
                              ? [
                                  {
                                    label: 'Select Account Type',
                                    value: null,
                                    isDisabled: true,
                                  },
                                ]
                              : isLoadingParentAccountTypes
                              ? [
                                  {
                                    label: 'Loading...',
                                    value: null,
                                    isDisabled: true,
                                  },
                                ]
                              : convertCOAAccountsToDropdownOptions(
                                  parentAccountTypesData
                                )
                          }
                          onChange={(v) => {
                            setFieldValue('parent_account_id', v.value);
                          }}
                          value={values.parent_account_id}
                          placeholder={'Select Parent Account'}
                        />
                        <ErrorMessage
                          name="parent_account_id"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>
                    ) : null}
                    <div className="col-12">
                      <CustomInput
                        name={'description'}
                        label={'Description'}
                        type={'textarea'}
                        rows={1}
                        disabled={isDisabled}
                        placeholder={'Enter Description'}
                        value={values.description}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.description && errors.description}
                      />
                    </div>
                  </div>
                  {!isDisabled && (
                    <div className="d-flex gap-3">
                      <CustomButton
                        text={'Save'}
                        type={'submit'}
                        disabled={addChartOfAccountMutation.isPending}
                        loading={addChartOfAccountMutation.isPending}
                      />
                      <CustomButton
                        text={'Cancel'}
                        variant={'secondaryButton'}
                        type={'button'}
                        disabled={addChartOfAccountMutation.isPending}
                        onClick={() => {
                          setIsDisabled(true);
                          setSelectedAccount(null);
                          setActiveItemId(null);
                          resetForm({
                            values: {
                              account_type: '',
                              account_name: '',
                              parent_account_id: '',
                              is_sub_account: 0 || '',
                              description: '',
                            },
                          });
                        }}
                      />
                    </div>
                  )}
                </Form>
              )}
            </Formik>
          </>
        );
      case 'edit':
        if (isLoadingAccountDetails) {
          return (
            <>
              <div className="d-flex justify-content-between">
                <h2 className="screen-title mb-0">Loading...</h2>
              </div>
            </>
          );
        } else if (isErrorAccountDetails) {
          return (
            <>
              <div className="d-flex justify-content-between">
                <p>Unable to fetch details</p>
              </div>
            </>
          );
        }
        return (
          <>
            {console.log('chartOfAccountDetails', chartOfAccountDetails)}
            <h2 className="screen-title">Edit Account</h2>
            <Formik
              initialValues={{
                parent_account_id:
                  chartOfAccountDetails?.parent_account?.id || '',
                account_type: chartOfAccountDetails?.account_type_id || '',
                account_name: chartOfAccountDetails?.account_name || '',
                description: chartOfAccountDetails?.description || '',
                is_sub_account: !isNullOrEmpty(
                  chartOfAccountDetails?.parent_account
                )
                  ? chartOfAccountDetails?.level > 3
                    ? 1
                    : 0
                  : 0,
              }}
              validationSchema={editCOAValidationSchema}
              onSubmit={handleAccountSubmit}
              enableReinitialize
            >
              {({
                values,
                touched,
                errors,
                handleChange,
                handleBlur,
                setFieldValue,
              }) => (
                <Form>
                  <div className="row mb-4">
                    <div className="col-12 col-lg-6 mb-3">
                      <SearchableSelect
                        label={'Account Type'}
                        name="account_type"
                        required
                        options={
                          isErrorAccountTypes
                            ? [
                                {
                                  label: 'Unable to fetch Account Types',
                                  value: null,
                                  isDisabled: true,
                                },
                              ]
                            : convertCOAAccountsToDropdownOptions(
                                accountTypesData
                              )
                        }
                        onChange={(v) => {
                          setFieldValue('account_type', v.value);
                          setSelectedAccountType(v.value);
                        }}
                        value={values.account_type}
                        placeholder={'Select Account Type'}
                      />

                      <ErrorMessage
                        name="account_type"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
                    <div className="col-12 col-lg-6 mb-3">
                      <CustomInput
                        name={'account_name'}
                        label={'Account Name'}
                        type={'text'}
                        required
                        value={values.account_name}
                        placeholder={'Enter Account Name'}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.account_name && errors.account_name}
                      />
                    </div>
                    {chartOfAccountDetails?.level > 3 ? (
                      <div className="col-12 mb-4">
                        <div className="checkbox-wrapper">
                          <label className="checkbox-container">
                            <input
                              onChange={(v) =>
                                setFieldValue(
                                  'is_sub_account',
                                  v.target.checked ? 1 : 0
                                )
                              }
                              type="checkbox"
                              name="is_sub_account"
                              checked={values?.is_sub_account}
                              value={values?.is_sub_account}
                            />
                            <span className="custom-checkbox"></span>
                            Make this a sub-account
                          </label>
                        </div>
                      </div>
                    ) : null}
                    {values?.is_sub_account &&
                    chartOfAccountDetails?.level > 3 ? (
                      <div className="col-12 mb-4">
                        <SearchableSelect
                          label={'Parent Account*'}
                          name="parent_account_id"
                          options={
                            !selectedAccountType
                              ? [
                                  {
                                    label: 'Select Account Type',
                                    value: null,
                                    isDisabled: true,
                                  },
                                ]
                              : isLoadingParentAccountTypes
                              ? [
                                  {
                                    label: 'Loading...',
                                    value: null,
                                    isDisabled: true,
                                  },
                                ]
                              : convertCOAAccountsToDropdownOptions(
                                  parentAccountTypesData
                                )
                          }
                          onChange={(v) => {
                            setFieldValue('parent_account_id', v.value);
                          }}
                          value={values.parent_account_id}
                          placeholder={'Select Parent Account'}
                        />
                        <ErrorMessage
                          name="parent_account_id"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>
                    ) : null}
                    <div className="col-12">
                      <CustomInput
                        name={'description'}
                        label={'Description'}
                        type={'textarea'}
                        rows={1}
                        placeholder={'Enter Description'}
                        value={values.description}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.description && errors.description}
                      />
                    </div>
                  </div>
                  <div className="d-flex gap-3">
                    <CustomButton
                      text={'Update'}
                      type={'submit'}
                      disabled={editChartOfAccountMutation.isPending}
                      loading={editChartOfAccountMutation.isPending}
                    />
                    <CustomButton
                      text={'Cancel'}
                      variant={'secondaryButton'}
                      type={'button'}
                      disabled={editChartOfAccountMutation.isPending}
                      onClick={() => setRightSectionType('view')}
                    />
                  </div>
                </Form>
              )}
            </Formik>
          </>
        );
      case 'view':
        if (isLoadingAccountDetails) {
          return (
            <>
              <div className="d-flex justify-content-between">
                <h2 className="screen-title mb-0">Loading...</h2>
              </div>
            </>
          );
        } else if (isErrorAccountDetails) {
          return (
            <>
              <div className="d-flex justify-content-between">
                <p>Unable to fetch details</p>
              </div>
            </>
          );
        } else if (isNullOrEmpty(chartOfAccountDetails)) return null;
        return (
          <div className="d-flex flex-column flex-grow-1 justify-content-start">
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="screen-title mb-0">
                  {chartOfAccountDetails?.level === 5
                    ? 'Sub-Subsidiary Account'
                    : chartOfAccountDetails?.level === 4
                    ? chartOfAccountDetails?.status === 'active'
                      ? 'Unlocked Subsidiary Account'
                      : 'Locked Subsidiary Account'
                    : chartOfAccountDetails?.level === 3
                    ? chartOfAccountDetails?.status === 'active'
                      ? 'Unlocked Controlling Account'
                      : 'Locked Controlling Account'
                    : ''}
                </h2>
                <div className="d-flex gap-2">
                  {chartOfAccountDetails?.level === 5 ||
                  (chartOfAccountDetails?.level > 2 &&
                    chartOfAccountDetails?.status === 'active') ? (
                    <CustomButton
                      text={'Edit'}
                      onClick={() => setRightSectionType('edit')}
                    />
                  ) : null}
                  <CustomButton
                    text={'Cancel'}
                    variant={'secondaryButton'}
                    onClick={() => {
                      setRightSectionType('new');
                      setIsDisabled(true);
                      setSelectedAccount(null);
                      setActiveItemId(null);
                    }}
                  />
                </div>
              </div>
              <div className="row">
                {[
                  {
                    label: 'Account Type',
                    value: chartOfAccountDetails?.account_type,
                  },
                  {
                    label: 'Account Name',
                    value: chartOfAccountDetails?.account_name,
                  },
                ].map((x, i) => {
                  if (isNullOrEmpty(x.value)) return null;
                  return (
                    <div key={i} className="col-12 col-sm-6 mb-4">
                      <p className="detail-title detail-label-color mb-1">
                        {x.label}
                      </p>
                      <p className="detail-text wrapText mb-0">{x.value}</p>
                    </div>
                  );
                })}
                {[
                  ...(chartOfAccountDetails?.level > 3 &&
                  !isNullOrEmpty(chartOfAccountDetails?.parent_account) // Conditionally show parent account if it has one
                    ? [
                        {
                          label: 'Parent Account',
                          value:
                            chartOfAccountDetails?.parent_account?.account_name,
                        },
                      ]
                    : []),
                  {
                    label: 'Description',
                    value: chartOfAccountDetails?.description,
                  },
                ].map((x, i) => {
                  if (isNullOrEmpty(x.value)) return null;
                  return (
                    <div key={i} className="col-12 mb-4">
                      <p className="detail-title detail-label-color mb-1">
                        {x.label}
                      </p>
                      <p className="detail-text wrapText mb-0">{x.value}</p>
                    </div>
                  );
                })}
                {chartOfAccountDetails?.level === 5 ||
                (chartOfAccountDetails?.level > 2 &&
                  chartOfAccountDetails?.status === 'active') ? (
                  <div className="row mb-4">
                    <div className="col-12 d-flex">
                      <CustomButton
                        text={'Delete'}
                        variant={'danger'}
                        onClick={() => handleDelete(chartOfAccountDetails)}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="justify-content-end mt-2">
              {chartOfAccountDetails?.created_at && (
                <p className="detail-title detail-label-color mb-1">
                  Created on{' '}
                  {formatDate(
                    chartOfAccountDetails?.created_at,
                    'DD/MM/YYYY - HH:MM:SS'
                  )}{' '}
                  {console.log('chartOfAccountDetails', chartOfAccountDetails)}
                  by {chartOfAccountDetails?.creator?.user_name}
                </p>
              )}
              {!isNullOrEmpty(chartOfAccountDetails?.editor) && (
                <p className="detail-title detail-label-color mb-0">
                  Updated on
                  {formatDate(
                    chartOfAccountDetails?.updated_at,
                    'DD/MM/YYYY - HH:MM:SS'
                  )}{' '}
                  by {chartOfAccountDetails?.editor?.user_name}
                </p>
              )}
            </div>
          </div>
        );
      default:
        break;
    }
  };
  const handleToggleExpand = (id) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleClick = (item, clickType) => {
    if (clickType === 'view') {
      setRightSectionType('view');
      setActiveItemId(item.id);
    } else if (clickType === 'edit') {
      setRightSectionType('edit');
      setActiveItemId(item.id);
    } else if (clickType === 'delete') {
      handleDelete(item);
    }

    setSelectedAccount(item.id);
  };

  return (
    <>
      {topSection()}

      <div className="d-card p-0">
        <div className="d-flex flex-column flex-lg-row align-items-stretch">
          <div
            className="coa-box"
            style={{
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              maxHeight: 'calc(100vh - 180px)',
              paddingRight: 8,
            }}
          >
            {chartOfAccounts && (
              <MultiLevelDropdown
                data={chartOfAccounts}
                handleAccountClick={handleClick}
                expandedItems={expandedItems}
                activeItemId={activeItemId}
                onToggleExpand={handleToggleExpand}
              />
            )}
          </div>
          <div className="coa-box d-flex flex-column">
            {rightSection(rightSectionType)}
          </div>
        </div>
      </div>
    </>
  );
};

export default withModal(ChartOfAccount);
