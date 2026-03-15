import { ErrorMessage, Form, Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../../../../Components/CustomButton';
import CustomInput from '../../../../Components/CustomInput';
import SearchableSelect from '../../../../Components/SearchableSelect/SearchableSelect';
import CustomSelect from '../../../../Components/CustomSelect';
import { getCurrencyOptions, isNullOrEmpty } from '../../../../Utils/Utils';
import { useQuery } from '@tanstack/react-query';
import { getAccountType } from '../../../../Services/Masters/BeneficiaryRegister';
import CustomCheckbox from '../../../../Components/CustomCheckbox/CustomCheckbox';
import useAccountsByType from '../../../../Hooks/useAccountsByType';
import CombinedInputs from '../../../../Components/CombinedInputs/CombinedInputs';
import { getAccountsbyType } from '../../../../Services/Transaction/JournalVoucher';
import { statementOfAccountsValidationSchema } from '../../../../Utils/Validations/ValidationSchemas';
import { usePageTitle } from '../../../../Hooks/usePageTitle';
import useFormStore from '../../../../Stores/FormStore';

const GenerateStatementOfAccounts = () => {
  usePageTitle('Statement of Accounts');

  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState(null);

  const navigate = useNavigate();
  const [type, setType] = useState('');

  // Persist filters so they are restored when returning from Generated page
  const { getFormValues, saveFormValues, clearFormValues } = useFormStore();
  const formId = 'statement-of-account-filters';

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

  const currencyOptions = getCurrencyOptions();
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

  const handleSubmit = (values) => {
    // Save current filters so they can be restored when user comes back
    saveFormValues(formId, values);
    navigate(`generated`, { state: values });
  };

  // If page was hard-refreshed, clear any persisted filters so form starts empty
  useEffect(() => {
    const navEntry = performance.getEntriesByType('navigation')[0];
    if (navEntry && navEntry.type === 'reload') {
      clearFormValues(formId);
    }
  }, [clearFormValues]);

  // Get period_from and period_to for preset period types (YYYY-MM-DD, using local date to avoid timezone shift)
  const getPeriodDatesForType = (periodType) => {
    const today = new Date();
    const toDateString = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    if (periodType === 'current_date') {
      const date = toDateString(today);
      return { period_from: date, period_to: date };
    }
    if (periodType === 'current_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        period_from: toDateString(firstDay),
        period_to: toDateString(today),
      };
    }
    if (periodType === 'last_month ' || periodType === 'last_month') {
      const periodTo = toDateString(today);
      const periodFrom = new Date(today);
      periodFrom.setMonth(periodFrom.getMonth() - 1);
      return { period_from: toDateString(periodFrom), period_to: periodTo };
    }
    return null;
  };

  // Get Account Types
  const {
    data: accountTypes,
    isLoading: accountTypeLoading,
    isError: accountTypeError,
    error: accountError,
  } = useQuery({
    queryKey: ['accountType', type],
    queryFn: () => getAccountType(type),
    enabled: !!type,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  // Function to fetch accountType and show loading/error if api fails
  const getAccountTypeOptions = () => {
    if (!type && isNullOrEmpty(accountTypes)) {
      return [{ label: 'Select Type First', value: null }];
    } else if (type && accountTypeLoading) {
      return [{ label: `Loading...`, value: null }];
    } else if (!accountTypeLoading && !accountTypeError) {
      if (isNullOrEmpty(accountTypes)) {
        return [{ label: `No Accounts for type ${type}`, value: null }];
      }
      let options = accountTypes?.map((x) => ({
        value: x.id,
        label: x.name,
      }));
      options.unshift({ label: 'Select Account', value: null, disabled: true });
      return options;
    } else {
      if (accountTypeError) {
        console.error('Unable to fetch account Type', accountError);
      }
      return [{ label: 'Unable to fetch account Type', value: null }];
    }
  };

  const defaultInitialValues = {
    account_type: '',
    account_id: '',
    currency: 'all',
    period_type: 'blank_dates',
    period_from: '',
    period_to: '',
    number_of_days: '',
    show_base_value: '',
  };

  const savedValues = getFormValues(formId);
  const initialValues = savedValues
    ? { ...defaultInitialValues, ...savedValues }
    : defaultInitialValues;

  return (
    <section>
      <div className="d-flex gap-3 justify-content-between flex-wrap mb-4">
        <h2 className="screen-title mb-0">Statement of Account</h2>
      </div>
      <div className="d-card">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
              initialValues={initialValues}
              enableReinitialize={true}
              validationSchema={statementOfAccountsValidationSchema}
              onSubmit={handleSubmit}
            >
              {({
                values,
                handleChange,
                handleBlur,
                setFieldValue,
                errors,
              }) => (
                <Form>
                  <div className="row mb-4">
                    <div className="col-12 col-sm-6 mb-43">
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
                    <div className="col-12 col-sm-6 mb-45">
                      <SearchableSelect
                        label="Currency"
                        name="currency"
                        options={[
                          { label: 'All', value: 'all' },
                          ...currencyOptions,
                        ]}
                        value={values.currency}
                        onChange={(v) => setFieldValue('currency', v.value)}
                        placeholder="Select Currency"
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-45">
                      <SearchableSelect
                        label="Period Type"
                        name="period_type"
                        options={[
                          {
                            label: 'Blank Dates (full report)',
                            value: 'blank_dates',
                          },
                          {
                            label: 'User Selected Date',
                            value: 'user_selected_range',
                          },
                          { label: 'Current Date', value: 'current_date' },
                          { label: 'Open Period', value: 'open_period ' },
                          {
                            label: 'From begining of the current month ',
                            value: 'current_month',
                          },
                          { label: 'Last one month', value: 'last_month ' },
                          {
                            label: 'User selected days',
                            value: 'user_selected_days',
                          },
                        ]}
                        value={values.period_type}
                        onChange={(v) => {
                          setFieldValue('period_type', v.value);
                          // Handle preset ranges
                          if (v.value === 'blank_dates') {
                            // Full report: clear dates and number of days
                            setFieldValue('period_from', '');
                            setFieldValue('period_to', '');
                            setFieldValue('number_of_days', '');
                          } else if (v.value === 'user_selected_range') {
                            // Let user choose both dates; do not auto-fill
                            setFieldValue('number_of_days', '');
                          } else if (v.value === 'user_selected_days') {
                            // Days-based: clear explicit dates
                            setFieldValue('period_from', '');
                            setFieldValue('period_to', '');
                          } else {
                            // Preset date ranges (current_date, current_month, last_month)
                            const dates = getPeriodDatesForType(v.value);
                            if (dates) {
                              setFieldValue('period_from', dates.period_from);
                              setFieldValue('period_to', dates.period_to);
                            }
                          }
                        }}
                        placeholder="Select Period Type"
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <div className="row flex-wrap">
                        <label htmlFor="period_from">Period From</label>
                        <div className="col-12 col-xl-6 mb-3">
                          <CustomInput
                            name="period_from"
                            type="date"
                            value={values.period_from}
                            disabled={
                              values.period_type !== 'user_selected_range'
                            }
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                        </div>
                        <div className="col-12 col-xl-6 mb-3">
                          <CustomInput
                            name="period_to"
                            type="date"
                            value={values.period_to}
                            disabled={
                              values.period_type !== 'user_selected_range'
                            }
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        label="Number of Days"
                        name="number_of_days"
                        type="number"
                        min={1}
                        placeholder="From"
                        value={values.number_of_days}
                        disabled={values.period_type !== 'user_selected_days'}
                        show
                        onChange={(e) => {
                          handleChange(e);

                          if (values.period_type === 'user_selected_days') {
                            const raw = e.target.value;
                            const days = parseInt(raw, 10);

                            if (!isNaN(days) && days > 0) {
                              const today = new Date();
                              const toDate = new Date(
                                today.getFullYear(),
                                today.getMonth(),
                                today.getDate()
                              );
                              const fromDate = new Date(toDate);
                              fromDate.setDate(fromDate.getDate() - (days - 1));

                              const toStr = [
                                toDate.getFullYear(),
                                String(toDate.getMonth() + 1).padStart(2, '0'),
                                String(toDate.getDate()).padStart(2, '0'),
                              ].join('-');

                              const fromStr = [
                                fromDate.getFullYear(),
                                String(fromDate.getMonth() + 1).padStart(2, '0'),
                                String(fromDate.getDate()).padStart(2, '0'),
                              ].join('-');

                              setFieldValue('period_from', fromStr);
                              setFieldValue('period_to', toStr);
                            } else {
                              // Invalid / empty number: clear the range
                              setFieldValue('period_from', '');
                              setFieldValue('period_to', '');
                            }
                          }
                        }}
                        onBlur={handleBlur}
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <CustomCheckbox
                        style={{ border: 'none', marginBottom: 0 }}
                        checked={values.show_base_value}
                        label={'Show Base Value'}
                        onChange={() =>
                          setFieldValue(
                            'show_base_value',
                            !values.show_base_value
                          )
                        }
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

export default GenerateStatementOfAccounts;
