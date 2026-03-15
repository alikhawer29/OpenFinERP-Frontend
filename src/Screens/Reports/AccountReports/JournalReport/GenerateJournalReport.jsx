import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import {
  getJournalReportFilters,
  getJournalReportUserFilters,
} from '../../../../Services/Reports/JournalReport';
import { getAccountsbyType } from '../../../../Services/Transaction/JournalVoucher';
import { transactionTypeOptionsWithName } from '../../../../Utils/Constants/SelectOptions';
import BeneficiaryRegisterForm from '../../../../Components/BeneficiaryRegisterForm/BeneficiaryRegisterForm';
import ChartOfAccountForm from '../../../../Components/ChartOfAccountForm/ChartOfAccountForm';
import CustomButton from '../../../../Components/CustomButton';
import CustomInput from '../../../../Components/CustomInput';
import CustomModal from '../../../../Components/CustomModal';
import PartyLedgerForm from '../../../../Components/PartyLedgerForm/PartyLedgerForm';
import SearchableSelect from '../../../../Components/SearchableSelect/SearchableSelect';
import WalkInCustomerForm from '../../../../Components/WalkInCustomerForm/WalkInCustomerForm';
import { usePageTitle } from '../../../../Hooks/usePageTitle';
import { attachmentFilterOptions } from '../../../../Utils/Constants/TableFilter';
import { getCurrencyOptions } from '../../../../Utils/Utils';

const GenerateJournalReport = () => {
  const currencyOptions = getCurrencyOptions();
  const queryClient = useQueryClient();

  const [selectedLedger, setSelectedLedger] = useState('all');
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState(null);
  const [showAddLedgerModal, setShowAddLedgerModal] = useState('');
  const [newlyCreatedAccount, setNewlyCreatedAccount] = useState(null);
  const [newlyCreatedBeneficiary, setNewlyCreatedBeneficiary] = useState(null);

  const navigate = useNavigate();
  usePageTitle('Journal Report');

  // Get current date in YYYY-MM-DD format
  const currentDate = new Date().toLocaleDateString('en-CA');

  const handleSubmit = (values) => {
    navigate(`generated`, { state: values });
  };

  // Query for journal report user filters
  const {
    data: journalReportUserFilters,
    isLoading: isLoadingJournalReportUserFilters,
    isError: isErrorJournalReportUserFilters,
    error: errorJournalReportUserFilters,
  } = useQuery({
    queryKey: ['journalReportUserFilters'],
    queryFn: () => getJournalReportUserFilters(),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const getUserFilterOptions = () => {
    if (isLoadingJournalReportUserFilters) {
      return [{ label: 'Loading...', value: null, isDisabled: true }];
    }
    if (isErrorJournalReportUserFilters) {
      return [{ label: 'Unable to fetch users', value: null }];
    }
    return (
      journalReportUserFilters?.map((x) => ({
        value: x?.id,
        label: x?.user_id,
      })) || []
    );
  };

  const {
    data: partyAccounts,
    isLoading: isLoadingParty,
    isError: isErrorParty,
    error: errorParty,
  } = useQuery({
    queryKey: ['accounts', 'party'],
    queryFn: () => getAccountsbyType('party'),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: generalAccounts,
    isLoading: isLoadingGeneral,
    isError: isErrorGeneral,
    error: errorGeneral,
  } = useQuery({
    queryKey: ['accounts', 'general'],
    queryFn: () => getAccountsbyType('general'),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: walkinAccounts,
    isLoading: isLoadingWalkin,
    isError: isErrorWalkin,
    error: errorWalkin,
  } = useQuery({
    queryKey: ['accounts', 'walkin'],
    queryFn: () => getAccountsbyType('walkin'),
    staleTime: 1000 * 60 * 5,
  });

  const accountData = {
    party: {
      data: partyAccounts,
      loading: isLoadingParty,
      error: isErrorParty,
      errorMessage: errorParty,
    },
    general: {
      data: generalAccounts,
      loading: isLoadingGeneral,
      error: isErrorGeneral,
      errorMessage: errorGeneral,
    },
    walkin: {
      data: walkinAccounts,
      loading: isLoadingWalkin,
      error: isErrorWalkin,
      errorMessage: errorWalkin,
    },
  };

  const getAccountsByTypeOptions = (accountType) => {
    if (!accountType) {
      return [{ label: 'Select Ledger', value: null, isDisabled: true }];
    }

    const { data, loading } = accountData[accountType] || {};

    if (loading) {
      return [{ label: 'Loading...', value: null, isDisabled: true }];
    }

    let options =
      data?.map((x) => ({
        value: x?.id,
        label: x?.title,
      })) || [];
    switch (accountType) {
      case 'party':
        options.push({ label: `Add New PL`, value: null });
        break;
      case 'general':
        options.push({ label: `Add New GL`, value: null });
        break;
      case 'walkin':
        options.push({ label: `Add New WIC`, value: null });
        break;
      default:
        break;
    }
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
              queryClient.invalidateQueries(['accounts', 'party']);
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
              queryClient.invalidateQueries(['accounts', 'walkin']);
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
              queryClient.invalidateQueries(['accounts', 'general']);
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
              setNewlyCreatedAccount(newlyCreatedAccount);
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

  return (
    <section>
      <div className="d-flex gap-3 justify-content-between flex-wrap mb-4">
        <h2 className="screen-title mb-0">Journal Report</h2>
      </div>
      <div className="d-card">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
              initialValues={{
                transaction_type:
                  transactionTypeOptionsWithName[0]?.value || '',
                transaction_no_range_from: '',
                transaction_no_range_to: '',
                ledger: '',
                account_id: '',
                currency_id: '',
                fcy_amount_range_from: '',
                fcy_amount_range_to: '',
                transaction_date_range_from: currentDate,
                transaction_date_range_to: currentDate,
                entry_date_range_from: '',
                entry_date_range_to: '',
                user_id: '',
                attachments: 'all',
              }}
              // validationSchema={generateJournalReportValidationSchema}
              onSubmit={handleSubmit}
            >
              {({
                values,
                errors,
                handleChange,
                handleBlur,
                setFieldValue,
              }) => (
                <Form>
                  <div className="row ">
                    <div className="col-12 col-sm-6 mb-3">
                      <SearchableSelect
                        label="Transaction Type"
                        name="transaction_type"
                        id="transaction_type"
                        options={transactionTypeOptionsWithName}
                        value={
                          values.transaction_type ||
                          transactionTypeOptionsWithName[0].value
                        }
                        onChange={(v) => {
                          setFieldValue('transaction_type', v.value);
                        }}
                        placeholder="Select Transaction Type"
                        error={errors.transaction_type}
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <div className="row flex-wrap">
                        <label htmlFor="fcy_amount_range_from">
                          Transaction No Range
                        </label>
                        <div className="col-12 col-sm-6 mb-3">
                          <CustomInput
                            name="transaction_no_range_from"
                            id="transaction_no_range_from"
                            type="text"
                            placeholder="From"
                            value={values.transaction_no_range_from}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            disabled={values.transaction_type == 'all'}
                            error={errors.transaction_no_range_from}
                          />
                        </div>
                        <div className="col-12 col-sm-6 mb-3">
                          <CustomInput
                            name="transaction_no_range_to"
                            id="transaction_no_range_to"
                            type="text"
                            placeholder="To"
                            value={values.transaction_no_range_to}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            disabled={values.transaction_type == 'all'}
                            error={errors.transaction_no_range_to}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Ledger Field */}
                    {/* <div className="col-12 col-sm-6 mb-43">
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
                            setSelectedLedgerAccount(null);
                            setFieldValue('account_id', '');
                          }
                        }}
                        onChange2={(selected) => {
                          if (
                            selected.label?.toLowerCase()?.startsWith('add new')
                          ) {
                            setShowAddLedgerModal(
                              selected.label?.toLowerCase()
                            );
                          } else {
                            setFieldValue('account_id', selected.value);
                            setSelectedLedgerAccount({
                              value: selected.value,
                              label: selected.label,
                              accountType: values.ledger,
                            });
                          }
                        }}
                      />
                      <ErrorMessage
                        name="ledger"
                        component="div"
                        className="input-error-message text-danger"
                      />

                    </div> */}

                    <div className="col-12 col-sm-6 mb-3">
                      <SearchableSelect
                        label="FCy"
                        name="currency_id"
                        id="currency_id"
                        options={currencyOptions}
                        value={values.currency_id}
                        onChange={(v) => setFieldValue('currency_id', v.value)}
                        placeholder="Select FCy"
                        error={errors.currency_id}
                      />
                    </div>

                    <div className="col-12 col-sm-6">
                      <div className="row flex-wrap">
                        <label htmlFor="fcy_amount_range_from">
                          FCy Amount Range
                        </label>
                        <div className="col-12 col-xl-6 mb-3">
                          <CustomInput
                            name="fcy_amount_range_from"
                            id="fcy_amount_range_from"
                            type="number"
                            placeholder="From"
                            value={values.fcy_amount_range_from}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.fcy_amount_range_from}
                          />
                        </div>
                        <div className="col-12 col-xl-6 mb-3">
                          <CustomInput
                            name="fcy_amount_range_to"
                            id="fcy_amount_range_to"
                            type="number"
                            placeholder="To"
                            value={values.fcy_amount_range_to}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.fcy_amount_range_to}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-sm-6">
                      <div className="row flex-wrap">
                        <label htmlFor="transactionDateFrom">
                          Transaction Date Range
                        </label>
                        <div className="col-12 col-xl-6 mb-3">
                          <CustomInput
                            name="transaction_date_range_from"
                            id="transaction_date_range_from"
                            type="date"
                            value={values.transaction_date_range_from}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.transaction_date_range_from}
                          />
                        </div>
                        <div className="col-12 col-xl-6 mb-3">
                          <CustomInput
                            name="transaction_date_range_to"
                            id="transaction_date_range_to"
                            type="date"
                            value={values.transaction_date_range_to}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.transaction_date_range_to}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-sm-6">
                      <div className="row flex-wrap">
                        <label htmlFor="entry_date_range_from">
                          Entry Date Range
                        </label>
                        <div className="col-12 col-xl-6 mb-3">
                          <CustomInput
                            name="entry_date_range_from"
                            id="entry_date_range_from"
                            type="date"
                            value={values.entry_date_range_from}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.entry_date_range_from}
                          />
                        </div>

                        <div className="col-12 col-xl-6 mb-3">
                          <CustomInput
                            name="entry_date_range_to"
                            id="entry_date_range_to"
                            type="date"
                            value={values.entry_date_range_to}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.entry_date_range_to}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-sm-6 mb-45">
                      <SearchableSelect
                        label="User ID"
                        name="user_id"
                        id="user_id"
                        options={getUserFilterOptions()}
                        value={values.user_id}
                        onChange={(v) => setFieldValue('user_id', v.value)}
                        placeholder="Select User ID"
                        isDisabled={isLoadingJournalReportUserFilters}
                        error={errors.user_id}
                      />
                    </div>

                    <div className="col-12 col-sm-6 mb-3">
                      <SearchableSelect
                        label="Attachments"
                        name="attachments"
                        id="attachments"
                        options={attachmentFilterOptions}
                        value={values.attachments}
                        onChange={(v) => setFieldValue('attachments', v.value)}
                        placeholder="Select Attachment"
                        isDisabled={isLoadingJournalReportUserFilters}
                        error={errors.attachments}
                      />
                    </div>

                    {/* <div className="col-12 col-sm-6 mb-3">
                      <SearchableSelect
                        label="Mark Type"
                        name="is_marked"
                        id="is_marked"
                        options={markTypeBoolean}
                        value={values.is_marked}
                        onChange={(v) => setFieldValue('is_marked', v.value)}
                        placeholder="Select Mark Type"
                        isDisabled={isLoadingJournalReportFilters}
                        error={errors.is_marked}
                      />
                    </div> */}
                  </div>

                  <div className="d-flex ">
                    <CustomButton type="submit" text="Generate" />
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
      {/* Add New Ledger Modal */}
      <CustomModal
        show={!!showAddLedgerModal}
        close={() => setShowAddLedgerModal('')}
        size="xl"
        style={{ minHeight: '812px' }}
      >
        {renderAddLedgerForm()}
      </CustomModal>
    </section>
  );
};

export default GenerateJournalReport;
