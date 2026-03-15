import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';

import { transactionTypeOptionsWithName } from '../../../../Utils/Constants/SelectOptions';

import CombinedInputs from '../../../../Components/CombinedInputs/CombinedInputs';
import CustomButton from '../../../../Components/CustomButton';
import CustomInput from '../../../../Components/CustomInput';
import SearchableSelect from '../../../../Components/SearchableSelect/SearchableSelect';
import { usePageTitle } from '../../../../Hooks/usePageTitle';
import { getAccountsbyType } from '../../../../Services/Transaction/JournalVoucher';
import useUserStore from '../../../../Stores/UserStore';
import { getCurrencyOptions } from '../../../../Utils/Utils';

const GenerateAccountEnquiry = () => {
  usePageTitle('Account Enquiry');
  const currencyOptions = getCurrencyOptions();
  const { user: { base_currency } = {} } = useUserStore();

  const [selectedAccountType, setSelectedAccountType] = useState('all');
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState(null);
  const [showAddLedgerModal, setShowAddLedgerModal] = useState('');
  const navigate = useNavigate();

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

  const handleSubmit = (values) => {
    navigate(`generated`, { state: values });
  };

  // Helper to get current month start and end dates in YYYY-MM-DD format
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  return (
    <section>
      <div className="d-flex gap-3 justify-content-between flex-wrap mb-4">
        <h2 className="screen-title mb-0">Account Enquiry</h2>
      </div>
      <div className="d-card">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
              initialValues={{
                account_type: '',
                account_id: '',
                transaction_type:
                  transactionTypeOptionsWithName[0]?.value || '',
                currency_id: '',
                period_from: formatDate(firstDayOfMonth),
                period_to: formatDate(lastDayOfMonth),
                lc_amount_from: '',
                lc_amount_to: '',
                fc_amount_from: '',
                fc_amount_to: '',
                transaction_range_from: '',
                transaction_range_to: '',
              }}
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
                  <div className="row mb-4">
                    {/* Ledger Field */}
                    <div className="col-12 col-sm-6 mb-3">
                      <CombinedInputs
                        label="Account"
                        type1="select"
                        type2="select"
                        name1="account_type"
                        name2="account_id"
                        value1={values.account_type}
                        value2={values.account_id}
                        options1={[
                          { label: 'PL', value: 'party' },
                          { label: 'GL', value: 'general' },
                          { label: 'WIC', value: 'walkin' },
                        ]}
                        options2={getAccountsByTypeOptions(values.account_type)}
                        handleBlur={handleBlur}
                        placeholder1="Ledger"
                        placeholder2="Account"
                        className1="account_type"
                        className2="account"
                        onChange1={(selected) => {
                          if (
                            selected.label?.toLowerCase()?.startsWith('add new')
                          ) {
                            setShowAddLedgerModal(
                              selected.label?.toLowerCase()
                            );
                          } else {
                            setFieldValue('account_type', selected.value);
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
                              accountType: values.account_type,
                            });
                          }
                        }}
                      />
                      <ErrorMessage
                        name="account_type"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>

                    <div className="col-12 col-sm-6 mb-3">
                      <SearchableSelect
                        label="Transaction Type"
                        name="transaction_type"
                        id="transaction_type"
                        options={transactionTypeOptionsWithName}
                        value={values.transaction_type}
                        onChange={(v) =>
                          setFieldValue('transaction_type', v.value)
                        }
                        placeholder="Select Transaction Type"
                        error={errors.transaction_type}
                      />
                    </div>

                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        label="Transaction From"
                        name="transaction_range_from"
                        id="transaction_range_from"
                        type="text"
                        placeholder="From"
                        value={values.transaction_range_from}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.transaction_range_from}
                      />
                    </div>

                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        label="Transaction To"
                        name="transaction_range_to"
                        id="transaction_range_to"
                        type="text"
                        placeholder="To"
                        value={values.transaction_range_to}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.transaction_range_to}
                      />
                    </div>

                    <div className="col-sm-12">
                      <div className="row flex-wrap">
                        <label htmlFor="period_from">Period</label>
                        <div className="col-12 col-xl-6 mb-3">
                          <CustomInput
                            name="period_from"
                            id="period_from"
                            type="date"
                            value={values.period_from}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.period_from}
                          />
                        </div>
                        <div className="col-12 col-xl-6 mb-3">
                          <CustomInput
                            name="period_to"
                            id="period_to"
                            type="date"
                            value={values.period_to}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.period_to}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-sm-6 mb-3">
                      <SearchableSelect
                        label="Currency"
                        name="currency_id"
                        id="currency_id"
                        options={currencyOptions}
                        value={values.currency_id}
                        onChange={(v) => setFieldValue('currency_id', v.value)}
                        placeholder="Select FCy"
                        error={errors.currency_id}
                      />
                    </div>

                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        label={`${base_currency || 'LC'} Amount From`}
                        name="lc_amount_from"
                        id="lc_amount_from"
                        type="text"
                        placeholder="From"
                        value={values.lc_amount_from}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.lc_amount_from}
                      />
                    </div>

                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        label={`${base_currency || 'LC'} Amount To`}
                        name="lc_amount_to"
                        id="lc_amount_to"
                        type="text"
                        placeholder="To"
                        value={values.lc_amount_to}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.lc_amount_to}
                      />
                    </div>

                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        label="FC Amount From"
                        name="fc_amount_from"
                        id="fc_amount_from"
                        type="text"
                        placeholder="From"
                        value={values.fc_amount_from}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.fc_amount_from}
                      />
                    </div>

                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        label="FC Amount To"
                        name="fc_amount_to"
                        id="fc_amount_to"
                        type="text"
                        placeholder="To"
                        value={values.fc_amount_to}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.fc_amount_to}
                      />
                    </div>
                  </div>

                  <div className="d-flex mb-4">
                    <CustomButton type="submit" text="Generate" />
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GenerateAccountEnquiry;
