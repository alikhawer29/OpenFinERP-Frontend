import { useMutation, useQuery } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import React, { useState } from 'react';
import { HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import PhoneInput, { parsePhoneNumber } from 'react-phone-number-input';
import { useNavigate, useLocation } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomCheckbox from '../../../Components/CustomCheckbox/CustomCheckbox';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { showToast } from '../../../Components/Toast/Toast';
import { useNationalities } from '../../../Hooks/countriesAndStates';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import {
  addBranch,
  getAccounts,
  getCurrency,
} from '../../../Services/Administration/BranchManagement';
import { currencyPairs } from '../../../Utils/Constants/SelectOptions';
import { vatRateHeaders } from '../../../Utils/Constants/TableHeaders';
import { convertCOAAccountsToDropdownOptions } from '../../../Utils/Helpers';
import {
  getUsersOptions,
  isNullOrEmpty,
  showErrorToast,
} from '../../../Utils/Utils';
import {
  branchCentralBankValidationSchema,
  branchDashboardValidationSchema,
  branchManagementValidationSchema,
  branchMiscParametersValidationSchema,
  branchSystemDatesValidationSchema,
  branchVatParametersValidationSchema,
  branchVatRateValidationSchema,
} from '../../../Utils/Validations/ValidationSchemas';
import './BranchManagement.css';
import HorizontalTabs from '../../../Components/HorizontalTabs/HorizontalTabs';
import useUserStore from '../../../Stores/UserStore';

const NewBranchManagement = () => {
  // Get the current URL to check if we're coming from complete-profile
  const location = useLocation();
  const isCompleteProfile = location.pathname.includes('complete-profile');
  const { setIsProfileCompleted, setSelectedBranch, setBranchName } =
    useUserStore();

  // Set page title conditionally
  usePageTitle(
    isCompleteProfile ? 'Complete Profile' : 'Branch Management - Create'
  );

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('branch');
  // Initialize formData with empty values for all possible fields
  const [formData, setFormData] = useState({
    // Branch tab
    name: '',
    address: '',
    city: '',
    phone: '',
    manager: '',
    supervisor: '',
    base_currency: '',

    // System dates tab
    opening_date: '',
    closed_upto_date: '',
    accept_data_upto_date: '',

    // Dashboard tab
    startup_alert_period: '',
    currency_rate_trend: '',
    dashboard_comparison_period: '',
    // currency_pairs: [],

    // Central Bank tab
    inward_payment_order_limit: '',
    outward_remittance_limit: '',
    counter_transaction_limit: '',
    cash_limit: '',
    cash_bank_pay_limit: '',
    monthly_transaction_limit: '',
    counter_commission_limit: '',

    // VAT tab
    vat_trn: '',
    vat_country: '',
    default_city: '',
    cities: '',
    vat_type: '',
    vat_percentage: '',

    // Misc tab
    disable_party_id_validation: false,
    disable_beneficiary_checking: false,
    enable_personalized_marking: false,
    show_agent_commission_in_cbs: false,
    show_agent_commission_in_fsn: false,
    show_agent_commission_in_fbn: false,
    allow_advance_commission: false,
    debit_posting_account: '',
    credit_posting_account: '',
  });

  const [showAddVatRateModal, setShowAddVatRateModal] = useState(false);
  const [showEditVatRateModal, setShowEditVatRateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [vatRates, setVatRates] = useState([
    { id: 1, title: 'Standard Rate', percentage: '5.00' },
    { id: 2, title: 'Exempted', percentage: 'Nill' },
    { id: 3, title: 'Zero Rate', percentage: '0.00' },
    {
      id: 4,
      title: 'Out of Scope',
      percentage:
        'A small popup will appear to the user to write the reason why does the VAT Amount is out of scope',
    },
  ]);

  const addBranchMutation = useMutation({
    mutationFn: addBranch,
    onSuccess: (data) => {
      if (isCompleteProfile) {
        showToast('Profile Completed!', 'success');
        setIsProfileCompleted(true);
        setSelectedBranch(data.id);
        setBranchName(data.branch_name);
        setTimeout(() => {
          navigate('/dashboard');
        }, 300);
      } else {
        showToast('Branch Added!', 'success');
        setTimeout(() => {
          navigate(-1);
        }, 300);
      }
    },
    onError: (error) => {
      console.error('Error adding Branch', error);
      showErrorToast(error);
    },
  });

  const handleSubmit = (values) => {
    let parsedMobileNumber;
    if (formData.phone?.length > 3) {
      parsedMobileNumber = parsePhoneNumber(formData.phone, 'US');
    }

    const tabSequence = [
      'branch',
      'posting',
      'system',
      'dashboard',
      'central',
      'vat',
      'misc',
    ];
    const currentIndex = tabSequence.indexOf(activeTab);
    if (activeTab === 'misc') {
      let payload = { ...formData, ...values };
      setFormData(payload);

      const transformedVATs = vatRates?.map((detail, index) => ({
        [`vats[${index}][title]`]: detail?.title,
        [`vats[${index}][percentage]`]: detail?.percentage,
      }));

      let finalData = {
        ...payload,
        ...(parsedMobileNumber && {
          phone: parsedMobileNumber.nationalNumber,
          country_code: parsedMobileNumber
            ? `+${parsedMobileNumber.countryCallingCode}`
            : '',
        }),
        // vats: vatRates,
        ...transformedVATs.reduce((acc, cur) => ({ ...acc, ...cur }), {}),
      };
      delete finalData.vats;
      addBranchMutation.mutate(finalData);
    } else {
      setFormData({ ...formData, ...values });
      if (currentIndex < tabSequence.length - 1) {
        // Move to the next tab if not the last tab
        setActiveTab(tabSequence[currentIndex + 1]);
      }
    }
  };
  const handleAddVatRate = (values) => {
    setVatRates([...vatRates, { id: vatRates.length + 1, ...values }]);
    setShowAddVatRateModal(false);
  };
  const handleEditVatRate = (item) => {
    setSelectedItem(item);
    setShowEditVatRateModal(true);
  };
  const handleUpdateVatRate = (values) => {
    setVatRates(
      vatRates.map((item) =>
        item.id === selectedItem.id ? { ...item, ...values } : item
      )
    );
    setShowEditVatRateModal(false);
  };
  const handleDeleteVatRate = (id) => {
    setVatRates(vatRates.filter((item) => item.id !== id));
  };

  // Get Currency query
  const {
    data: allCurrency,
    isLoading: isLoadingCurrency,
    isError: IsErrorCurrency,
    error: ErrorCurrency,
  } = useQuery({
    queryKey: ['Currency'],
    queryFn: getCurrency,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Get Accounts query
  const {
    data: allAccounts,
    isLoading: isLoadingAccounts,
    isError: IsErrorAccounts,
    error: ErrorAccounts,
  } = useQuery({
    queryKey: ['Accounts'],
    queryFn: getAccounts,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Helper functions to get Currency dropdown options. Also show loading/error if api fails
  const getCurrencyOptions = () => {
    if (!isLoadingCurrency && !IsErrorCurrency) {
      return allCurrency?.map((x) => ({
        value: x.id,
        label: x.currency,
      }));
    } else {
      if (IsErrorCurrency) {
        console.error('Unable to fetch Currency', ErrorCurrency);
        return [{ label: 'Unable to fetch Currency', value: null }];
      } else {
        return [{ label: 'Loading...', value: null, isDisabled: true }];
      }
    }
  };

  // Helper functions to get Account dropdown options. Also show loading/error if api fails
  const getAccountsOptions = () => {
    if (!isLoadingAccounts && !IsErrorAccounts) {
      return convertCOAAccountsToDropdownOptions(allAccounts);
    } else {
      if (IsErrorAccounts) {
        console.error('Unable to fetch Accounts', ErrorAccounts);
        return [{ label: 'Unable to fetch Accounts', value: null }];
      } else {
        return [{ label: 'Loading...', value: null, isDisabled: true }];
      }
    }
  };

  const { data: nationalities, isLoading: loadingNationalities } =
    useNationalities();

  const tabs = [
    { value: 'branch', label: 'Branch Detail' },
    { value: 'posting', label: 'Posting Account' },
    { value: 'system', label: 'System Dates' },
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'central', label: 'Central Bank Limit' },
    { value: 'vat', label: 'VAT Parameters' },
    { value: 'misc', label: 'Misc. Parameters' },
  ];

  const renderTab = (tab) => {
    switch (tab) {
      case 'branch':
        return (
          <Formik
            key="branch"
            initialValues={{
              name: formData.name || '',
              address: formData.address || '',
              city: formData.city || '',
              phone: formData.phone || '',
              manager: formData.manager || '',
              supervisor: formData.supervisor || '',
              base_currency: formData.base_currency || '',
            }}
            validationSchema={branchManagementValidationSchema}
            onSubmit={handleSubmit}
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
                <div className="row mb-4">
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      name="name"
                      type="text"
                      label="Branch Name"
                      required
                      placeholder="Enter Branch Name"
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.name && errors.name}
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      name="address"
                      type="text"
                      label="Address"
                      required
                      placeholder="Enter Address"
                      value={values.address}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.address && errors.address}
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      name="city"
                      type="text"
                      label="City"
                      required
                      placeholder="Enter City"
                      value={values.city}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.city && errors.city}
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-4 inputWrapper">
                    <label className="mainLabel">
                      Contact No
                      <span className="text-danger">*</span>
                    </label>
                    <PhoneInput
                      international
                      withCountryCallingCode
                      placeholder="Enter Contact Number"
                      className="mainInput"
                      defaultvat_country="US"
                      value={values.phone}
                      onChange={(value) => setFieldValue('phone', value)}
                      onBlur={() => handleBlur({ target: { name: 'phone' } })}
                    />
                    <ErrorMessage
                      name="phone"
                      component="div"
                      className="input-error-message text-danger"
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-45">
                    <SearchableSelect
                      name="manager"
                      label="Manager"
                      placeholder="Select Manager"
                      options={getUsersOptions()}
                      value={values.manager}
                      onChange={(v) => setFieldValue('manager', v.value)}
                    />
                    <ErrorMessage
                      name="manager"
                      component="div"
                      className="input-error-message text-danger"
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-45">
                    <SearchableSelect
                      name="supervisor"
                      label="Supervisor"
                      required
                      placeholder="Select Supervisor"
                      options={getUsersOptions()}
                      value={values.supervisor}
                      onChange={(v) => setFieldValue('supervisor', v.value)}
                    />
                    <ErrorMessage
                      name="supervisor"
                      component="div"
                      className="input-error-message text-danger"
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <SearchableSelect
                      name="base_currency"
                      label="Base Currency"
                      placeholder="Select Base Currency"
                      options={getCurrencyOptions()}
                      value={values.base_currency}
                      onChange={(v) => setFieldValue('base_currency', v.value)}
                    />
                    <ErrorMessage
                      name="base_currency"
                      component="div"
                      className="input-error-message text-danger"
                    />
                  </div>
                </div>
                <div className="d-flex gap-3">
                  <CustomButton text="Save and Next" type="submit" />
                </div>
              </Form>
            )}
          </Formik>
        );
      case 'posting':
        return (
          <div className="row">
            {[
              {
                label: 'Account Payable',
                value: 'Account Payable',
              },
              {
                label: 'Account Receivable',
                value: 'Account Receivable',
              },
              {
                label: 'Post Dated CHQS RECD',
                value: 'Post Dated CHQS RECD',
              },
              {
                label: 'Post Dated CHQS Payable',
                value: 'Post Dated CHQS Payable',
              },
              {
                label: 'Cash Customer',
                value: 'Cash Customer',
              },
              {
                label: 'Bank Suspense A/c',
                value: 'Bank suspence A/c',
              },
              {
                label: 'Inward Remittance Payment',
                value: 'Inward Remittance Payment',
              },
              {
                label: 'FC Remittance A/C',
                value: 'FC Remittance A/C',
              },
              {
                label: 'Commission A/C',
                value: 'Commission A/C',
              },
              {
                label: 'Commission Expense A/C',
                value: 'Commission Expense A/C',
              },
              {
                label: 'Discount EXP A/C',
                value: 'Discount EXP A/C',
              },
              {
                label: 'IWT Recievable A/c',
                value: 'IWT Recievable A/c',
              },
              {
                label: 'VAT Input A/c',
                value: 'VAT Input A/c',
              },
              {
                label: 'VAT Output A/c',
                value: 'VAT Output A/c',
              },
              {
                label: 'Remittance Income',
                value: 'Remittance Income',
              },
              {
                label: 'Counter Income',
                value: 'Counter Income',
              },
              {
                label: 'VAT Absorb Expense A/c',
                value: 'VAT Absorb Expense A/c',
              },
              {
                label: 'Cost Of Sale A/c',
                value: 'Cost Of Sale A/c',
              },
              {
                label: 'Stock In Hand A/c',
                value: 'Stock In Hand A/c',
              },
              {
                label: 'Depreciation EXP',
                value: 'Depreciation EXP',
              },
              {
                label: 'MISC EXP',
                value: 'MISC EXP',
              },
              {
                label: 'Write Off Account',
                value: 'Write Off Account',
              },
            ].map((item, i) => {
              if (isNullOrEmpty(item.value)) return null;
              return (
                <div key={i} className="col-12 col-sm-6 mb-4">
                  <p className="detail-title detail-label-color mb-1">
                    {item.label}
                  </p>
                  <p className="detail-text wrapText mb-0">{item.value}</p>
                </div>
              );
            })}
            <div className="d-flex gap-3 mt-45">
              <CustomButton
                text="Save and Next"
                type="button"
                onClick={() => setActiveTab('system')}
              />
            </div>
          </div>
        );
      case 'system':
        return (
          <Formik
            key="system"
            initialValues={{
              opening_date: formData.opening_date || '',
              closed_upto_date: formData.closed_upto_date || '',
              accept_data_upto_date: formData.accept_data_upto_date || '',
            }}
            validationSchema={branchSystemDatesValidationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form>
                <div className="row mb-4">
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      label="Opening Date"
                      name="opening_date"
                      type="date"
                      required
                      placeholder="DD/MM/YYYY"
                      value={values.opening_date}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.opening_date && errors.opening_date}
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      label="Closed Upto"
                      name="closed_upto_date"
                      type="date"
                      required
                      placeholder="DD/MM/YYYY"
                      value={values.closed_upto_date}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={
                        touched.closed_upto_date && errors.closed_upto_date
                      }
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      label="Accept Data Upto"
                      name="accept_data_upto_date"
                      type="date"
                      required
                      placeholder="DD/MM/YYYY"
                      value={values.accept_data_upto_date}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={
                        touched.accept_data_upto_date &&
                        errors.accept_data_upto_date
                      }
                    />
                  </div>
                </div>
                <div className="d-flex gap-3">
                  <CustomButton text="Save and Next" type="submit" />
                </div>
              </Form>
            )}
          </Formik>
        );
      case 'dashboard':
        return (
          <Formik
            key="dashboard"
            initialValues={{
              startup_alert_period: formData.startup_alert_period || '',
              currency_rate_trend: formData.currency_rate_trend || '',
              dashboard_comparison_period:
                formData.dashboard_comparison_period || '',
              currency_pairs: formData.currency_pairs || [],
            }}
            validationSchema={branchDashboardValidationSchema}
            onSubmit={handleSubmit}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              setFieldValue,
              setFieldTouched,
            }) => (
              <Form>
                <div className="row mb-4">
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      label="Startup Alert Period"
                      name="startup_alert_period"
                      type="number"
                      required
                      placeholder="Enter period in months"
                      value={values.startup_alert_period}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={
                        touched.startup_alert_period &&
                        errors.startup_alert_period
                      }
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      label="Currency Rate Trend (In Months)"
                      name="currency_trend_period"
                      type="text"
                      required
                      placeholder="Enter months"
                      value={values.currency_rate_trend}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setFieldValue('currency_rate_trend', val);
                      }}
                      onBlur={() =>
                        setFieldTouched('currency_rate_trend', true)
                      }
                      error={
                        touched.currency_rate_trend &&
                        errors.currency_rate_trend
                      }
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      label="Dashboard Comparison (In Days)"
                      name="dashboard_comparison_period"
                      type="number"
                      required
                      placeholder="Enter days"
                      value={values.dashboard_comparison_period}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={
                        touched.dashboard_comparison_period &&
                        errors.dashboard_comparison_period
                      }
                    />
                  </div>
                </div>

                <div>
                  <h3 className="screen-title-body mb-3">Currency Pairs</h3>
                  <div className="currency-pairs-table mb-45">
                    <div className="table-header">
                      <div className="checkbox-column">
                        <label className="checkbox-container">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              const allPairIds = currencyPairs.map(
                                (pair) => pair.id
                              );
                              setFieldValue(
                                'currency_pairs',
                                e.target.checked ? allPairIds : []
                              );
                            }}
                            checked={
                              values.currency_pairs?.length ===
                                currencyPairs?.length &&
                              currencyPairs?.length > 0
                            }
                            ref={(el) => {
                              if (el) {
                                el.indeterminate =
                                  values.currency_pairs?.length > 0 &&
                                  values.currency_pairs?.length <
                                    currencyPairs?.length;
                              }
                            }}
                          />
                          <span className="custom-checkbox"></span>
                          Select All
                        </label>
                      </div>
                      <div className="currency-column header">Currency</div>
                      <div className="currency-column header">Ag.FCy</div>
                    </div>

                    {currencyPairs.map((pair, index) => (
                      <div className="table-row" key={index}>
                        <div className="checkbox-column">
                          <label className="checkbox-container">
                            <input
                              type="checkbox"
                              checked={values.currency_pairs?.includes(pair.id)}
                              onChange={(e) => {
                                const updatedPairs = e.target.checked
                                  ? [...values.currency_pairs, pair.id]
                                  : values.currency_pairs.filter(
                                      (id) => id !== pair.id
                                    );
                                setFieldValue('currency_pairs', updatedPairs);
                              }}
                            />
                            <span className="custom-checkbox"></span>
                          </label>
                        </div>
                        <div className="currency-column">{pair.currency}</div>
                        <div className="currency-column">{pair.agcy}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="d-flex gap-3">
                  <CustomButton text="Save and Next" type="submit" />
                </div>
              </Form>
            )}
          </Formik>
        );
      case 'central':
        return (
          <Formik
            key="central"
            initialValues={{
              inward_payment_order_limit:
                formData.inward_payment_order_limit || '',
              outward_remittance_limit: formData.outward_remittance_limit || '',
              counter_transaction_limit:
                formData.counter_transaction_limit || '',
              cash_limit: formData.cash_limit || '',
              cash_bank_pay_limit: formData.cash_bank_pay_limit || '',
              monthly_transaction_limit:
                formData.monthly_transaction_limit || '',
              counter_commission_limit: formData.counter_commission_limit || '',
            }}
            validationSchema={branchCentralBankValidationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form>
                <div className="row mb-4">
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      label="Inwards Payment Order"
                      name="inward_payment_order_limit"
                      type="number"
                      required
                      placeholder="Enter amount"
                      value={values.inward_payment_order_limit}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={
                        touched.inward_payment_order_limit &&
                        errors.inward_payment_order_limit
                      }
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      label="Outwards Remittance"
                      name="outward_remittance_limit"
                      type="number"
                      required
                      placeholder="Enter amount"
                      value={values.outward_remittance_limit}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={
                        touched.outward_remittance_limit &&
                        errors.outward_remittance_limit
                      }
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      label="Counter Transaction"
                      name="counter_transaction_limit"
                      type="number"
                      required
                      placeholder="Enter amount"
                      value={values.counter_transaction_limit}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={
                        touched.outward_remittance_limit &&
                        errors.outward_remittance_limit
                      }
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      label="Cash Limit"
                      name="cash_limit"
                      type="number"
                      required
                      placeholder="Enter amount"
                      value={values.cash_limit}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.cash_limit && errors.cash_limit}
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      label="Cash/Bank Pay Limit"
                      name="cash_bank_pay_limit"
                      type="number"
                      required
                      placeholder="Enter amount"
                      value={values.cash_bank_pay_limit}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={
                        touched.cash_bank_pay_limit &&
                        errors.cash_bank_pay_limit
                      }
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      label="Monthly Transaction"
                      name="monthly_transaction_limit"
                      type="number"
                      required
                      placeholder="Enter amount"
                      value={values.monthly_transaction_limit}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={
                        touched.monthly_transaction_limit &&
                        errors.monthly_transaction_limit
                      }
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      label="Counter Commission"
                      name="counter_commission_limit"
                      type="number"
                      required
                      placeholder="Enter amount"
                      value={values.counter_commission_limit}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={
                        touched.counter_commission_limit &&
                        errors.counter_commission_limit
                      }
                    />
                  </div>
                </div>
                <div className="d-flex gap-3">
                  <CustomButton text="Save and Next" type="submit" />
                </div>
              </Form>
            )}
          </Formik>
        );
      case 'vat':
        return (
          <Formik
            key="vat"
            initialValues={{
              vat_trn: formData.vat_trn || '',
              vat_country: formData.vat_country || '',
              default_city: formData.default_city || '',
              cities: formData.cities || '',
              vat_type: formData.vat_type || '',
              vat_percentage: formData.vat_percentage || '',
            }}
            validationSchema={branchVatParametersValidationSchema}
            onSubmit={handleSubmit}
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
                <div className="row mb-4">
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      label="VAT TRN"
                      name="vat_trn"
                      type="text"
                      required
                      placeholder="Enter VAT TRN"
                      value={values.vat_trn}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.vat_trn && errors.vat_trn}
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <SearchableSelect
                      name="vat_country"
                      label="Country"
                      placeholder="Select Country"
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
                      value={values.vat_country}
                      onChange={(v) => setFieldValue('vat_country', v.value)}
                    />
                    <ErrorMessage
                      name="vat_country"
                      component="div"
                      className="input-error-message text-danger"
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      label="Your Default City"
                      name="default_city"
                      type="text"
                      required
                      placeholder="Enter Default City"
                      value={values.default_city}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.default_city && errors.default_city}
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      label="Cities"
                      name="cities"
                      type="text"
                      required
                      placeholder="Enter cities separated by comma"
                      value={values.cities}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.cities && errors.cities}
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <SearchableSelect
                      name="vat_type"
                      label="VAT Type"
                      placeholder="Select VAT Type"
                      options={[
                        { label: 'Fixed Rate', value: 'fixed' },
                        { label: 'Variable Rate', value: 'variable' },
                      ]}
                      value={values.vat_type}
                      onChange={(v) => setFieldValue('vat_type', v.value)}
                    />
                  </div>
                  {values.vat_type !== 'variable' && (
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        label="VAT %"
                        name="vat_percentage"
                        type="number"
                        required
                        placeholder="0.00"
                        value={values.vat_percentage}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.vat_percentage && errors.vat_percentage}
                      />
                    </div>
                  )}
                </div>

                {values.vat_type === 'variable' && (
                  <div className="mb-4">
                    <CustomTable
                      hasFilters={false}
                      isPaginated={false}
                      headers={vatRateHeaders}
                      className="mt-4"
                    >
                      <tbody>
                        {vatRates?.map((item) => (
                          <tr key={item.id}>
                            <td>{item.title}</td>
                            <td style={{ textWrap: 'wrap' }}>
                              {item.percentage}
                            </td>
                            <td>
                              <TableActionDropDown
                                actions={[
                                  {
                                    name: 'Edit',
                                    icon: HiOutlinePencilSquare,
                                    onClick: () => handleEditVatRate(item),
                                    className: 'edit',
                                    disabled:
                                      item.title === 'Exempted' ||
                                      item.title === 'Zero Rate' ||
                                      item.title === 'Out of Scope',
                                  },
                                  {
                                    name: 'Delete',
                                    icon: HiOutlineTrash,
                                    onClick: () => handleDeleteVatRate(item),
                                    className: 'delete',
                                    disabled:
                                      item.title === 'Standard Rate' ||
                                      item.title === 'Exempted' ||
                                      item.title === 'Zero Rate' ||
                                      item.title === 'Out of Scope',
                                  },
                                ]}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </CustomTable>

                    <div className="mt-3">
                      <CustomButton
                        text="Add New VAT Rate"
                        type="button"
                        onClick={() => setShowAddVatRateModal(true)}
                      />
                    </div>
                  </div>
                )}

                <div className="d-flex gap-3">
                  <CustomButton text="Save and Next" type="submit" />
                </div>
              </Form>
            )}
          </Formik>
        );
      case 'misc':
        return (
          <Formik
            key="misc"
            initialValues={{
              disable_party_id_validation:
                formData.disable_party_id_validation || 0,
              disable_beneficiary_checking:
                formData.disable_beneficiary_checking || 0,
              enable_personalized_marking:
                formData.enable_personalized_marking || 0,
              show_agent_commission_in_cbs:
                formData.show_agent_commission_in_cbs || 0,
              show_agent_commission_in_fsn:
                formData.show_agent_commission_in_fsn || 0,
              show_agent_commission_in_fbn:
                formData.show_agent_commission_in_fbn || 0,
              allow_advance_commission: formData.allow_advance_commission || 0,
              fsn_post_on_approval: formData.fsn_post_on_approval || 0,
              fbn_post_on_approval: formData.fbn_post_on_approval || 0,
              cbs_post_on_approval: formData.cbs_post_on_approval || 0,
              rv_post_on_approval: formData.rv_post_on_approval || 0,
              pv_post_on_approval: formData.pv_post_on_approval || 0,
              trq_post_on_approval: formData.trq_post_on_approval || 0,
              a2a_post_on_approval: formData.a2a_post_on_approval || 0,
              jv_post_on_approval: formData.jv_post_on_approval || 0,
              tsn_tbn_post_on_approval: formData.tsn_tbn_post_on_approval || 0,
              enable_two_step_approval: formData.enable_two_step_approval || 0,
              debit_posting_account: formData.debit_posting_account || '',
              credit_posting_account: formData.credit_posting_account || '',
              rounding_off: formData.rounding_off || 0,
            }}
            validationSchema={branchMiscParametersValidationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, setFieldValue }) => (
              <Form>
                <div className="mb-4">
                  <h3 className="screen-title-body mb-3">
                    Party & Beneficiary
                  </h3>
                  <CustomCheckbox
                    label="Disable Party ID Validation"
                    checked={values.disable_party_id_validation}
                    onChange={(e) =>
                      setFieldValue(
                        'disable_party_id_validation',
                        e.target.checked ? 1 : 0
                      )
                    }
                    name="disable_party_id_validation"
                  />
                  <CustomCheckbox
                    label="Disable Beneficiary Checking"
                    checked={values.disable_beneficiary_checking}
                    onChange={(e) =>
                      setFieldValue(
                        'disable_beneficiary_checking',
                        e.target.checked ? 1 : 0
                      )
                    }
                    name="disable_beneficiary_checking"
                  />
                  <CustomCheckbox
                    label="Enabled Personalised Marking"
                    checked={values.enable_personalized_marking}
                    onChange={(e) =>
                      setFieldValue(
                        'enable_personalized_marking',
                        e.target.checked ? 1 : 0
                      )
                    }
                    name="enable_personalized_marking"
                  />
                </div>

                <div className="mb-4">
                  <h3 className="screen-title-body mb-3">Agent Commission</h3>
                  <CustomCheckbox
                    label="Show Agent Commission Section in CBS"
                    checked={values.show_agent_commission_in_cbs}
                    onChange={(e) =>
                      setFieldValue(
                        'show_agent_commission_in_cbs',
                        e.target.checked ? 1 : 0
                      )
                    }
                    name="show_agent_commission_in_cbs"
                  />
                  <CustomCheckbox
                    label="Show Agent Commission Section in FSN"
                    checked={values.show_agent_commission_in_fsn}
                    onChange={(e) =>
                      setFieldValue(
                        'show_agent_commission_in_fsn',
                        e.target.checked ? 1 : 0
                      )
                    }
                    name="show_agent_commission_in_fsn"
                  />
                  <CustomCheckbox
                    label="Show Agent Commission Section in FBN"
                    checked={values.show_agent_commission_in_fbn}
                    onChange={(e) =>
                      setFieldValue(
                        'show_agent_commission_in_fbn',
                        e.target.checked ? 1 : 0
                      )
                    }
                    name="show_agent_commission_in_fbn"
                  />
                  <CustomCheckbox
                    label="Allow Advance Commission"
                    checked={values.allow_advance_commission}
                    onChange={(e) =>
                      setFieldValue(
                        'allow_advance_commission',
                        e.target.checked ? 1 : 0
                      )
                    }
                    name="allow_advance_commission"
                  />
                </div>

                <div className="mb-4">
                  <h3 className="screen-title-body mb-3">
                    Transaction Approval Control
                  </h3>
                  <CustomCheckbox
                    label="FSN entry to be posted in the book of account upon approval only"
                    checked={values.fsn_post_on_approval}
                    onChange={(e) =>
                      setFieldValue(
                        'fsn_post_on_approval',
                        e.target.checked ? 1 : 0
                      )
                    }
                    name="fsn_post_on_approval"
                  />
                  <CustomCheckbox
                    label="FBN entry to be posted in the book of account upon approval only"
                    checked={values.fbn_post_on_approval}
                    onChange={(e) =>
                      setFieldValue(
                        'fbn_post_on_approval',
                        e.target.checked ? 1 : 0
                      )
                    }
                    name="fbn_post_on_approval"
                  />
                  <CustomCheckbox
                    label="CBS entry to be posted in the book of account upon approval only"
                    checked={values.cbs_post_on_approval}
                    onChange={(e) =>
                      setFieldValue(
                        'cbs_post_on_approval',
                        e.target.checked ? 1 : 0
                      )
                    }
                    name="cbs_post_on_approval"
                  />
                  <CustomCheckbox
                    label="RV entry to be posted in the book of account upon approval only"
                    checked={values.rv_post_on_approval}
                    onChange={(e) =>
                      setFieldValue(
                        'rv_post_on_approval',
                        e.target.checked ? 1 : 0
                      )
                    }
                    name="rv_post_on_approval"
                  />
                  <CustomCheckbox
                    label="PV entry to be posted in the book of account upon approval only"
                    checked={values.pv_post_on_approval}
                    onChange={(e) =>
                      setFieldValue(
                        'pv_post_on_approval',
                        e.target.checked ? 1 : 0
                      )
                    }
                    name="pv_post_on_approval"
                  />
                  <CustomCheckbox
                    label="TRQ entry to be posted in the book of account upon approval only"
                    checked={values.trq_post_on_approval}
                    onChange={(e) =>
                      setFieldValue(
                        'trq_post_on_approval',
                        e.target.checked ? 1 : 0
                      )
                    }
                    name="trq_post_on_approval"
                  />
                  <CustomCheckbox
                    label="A2A entry to be posted in the book of account upon approval only"
                    checked={values.a2a_post_on_approval}
                    onChange={(e) =>
                      setFieldValue(
                        'a2a_post_on_approval',
                        e.target.checked ? 1 : 0
                      )
                    }
                    name="a2a_post_on_approval"
                  />
                  <CustomCheckbox
                    label="JV entry to be posted in the book of account upon approval only"
                    checked={values.jv_post_on_approval}
                    onChange={(e) =>
                      setFieldValue(
                        'jv_post_on_approval',
                        e.target.checked ? 1 : 0
                      )
                    }
                    name="jv_post_on_approval"
                  />
                  <CustomCheckbox
                    label="TSN & TBN entry to be posted in the book of account upon approval only"
                    checked={values.tsn_tbn_post_on_approval}
                    onChange={(e) =>
                      setFieldValue(
                        'tsn_tbn_post_on_approval',
                        e.target.checked ? 1 : 0
                      )
                    }
                    name="tsn_tbn_post_on_approval"
                  />
                  <CustomCheckbox
                    label="Enable Two Setup Approval"
                    checked={values.enable_two_step_approval}
                    onChange={(e) =>
                      setFieldValue(
                        'enable_two_step_approval',
                        e.target.checked ? 1 : 0
                      )
                    }
                    name="enable_two_step_approval"
                  />
                </div>

                <div className="mb-4 mt-5 pt-3">
                  <h3 className="screen-title-body mb-3">Party Ledger</h3>
                  <div className="row mb-4">
                    <div className="col-12 col-sm-6 mb-4">
                      <SearchableSelect
                        name="debit_posting_account"
                        label={'Debit Posting Account'}
                        placeholder={'Select Debit Posting Account'}
                        options={getAccountsOptions()}
                        value={values.debit_posting_account}
                        required
                        onChange={(v) => {
                          setFieldValue('debit_posting_account', v.value);
                        }}
                      />
                      <ErrorMessage
                        name="debit_posting_account"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-4">
                      <SearchableSelect
                        name="credit_posting_account"
                        label={'Credit Posting Account'}
                        placeholder={'Select Credit Posting Account'}
                        options={getAccountsOptions()}
                        value={values.credit_posting_account}
                        required
                        onChange={(v) => {
                          setFieldValue('credit_posting_account', v.value);
                        }}
                      />
                      <ErrorMessage
                        name="credit_posting_account"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
                  </div>
                </div>

                <div className="my-4">
                  <h3 className="screen-title-body mb-3">Rounding Off</h3>
                  <div className="row mb-4">
                    <div className="col-12 mb-4">
                      <div className="d-inline-flex align-items-center">
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            name="rounding_off"
                            id="rounding_off"
                            checked={values.rounding_off}
                            onChange={(e) =>
                              setFieldValue(
                                'rounding_off',
                                e.target.checked ? 1 : 0
                              )
                            }
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        <label
                          htmlFor="rounding_off"
                          className="ms-3 cp user-select-none"
                        >
                          Round Off Amounts
                        </label>
                      </div>
                      <p className="muted-text mt-2">
                        By enabling this feature system will round off all the
                        amounts except the rates
                      </p>
                    </div>
                  </div>
                </div>
                <div className="d-flex gap-3">
                  <CustomButton
                    loading={addBranchMutation.isPending}
                    disabled={addBranchMutation.isPending}
                    text="Save"
                    type="submit"
                  />
                </div>
              </Form>
            )}
          </Formik>
        );
      // Other cases will be implemented later
      default:
        return <p>Tab content coming soon...</p>;
    }
  };

  return (
    <div>
      <div className="d-flex flex-column gap-2 mb-4">
        {isCompleteProfile ? (
          <h2 className="screen-title m-0 d-inline">Complete Profile</h2>
        ) : (
          <>
            <BackButton />
            <h2 className="screen-title m-0 d-inline">Branch Management</h2>
          </>
        )}
      </div>

      <HorizontalTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="mb-4"
      />

      <div className="d-card">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            {renderTab(activeTab)}
            {activeTab !== 'misc' && (
              <p style={{ fontSize: 14 }} className="fw-light mt-3 mb-0">
                Click save after making any changes before moving to the next
                tab
              </p>
            )}
          </div>
        </div>
      </div>
      {/* Add Vat Percentage Modal  */}
      <CustomModal
        show={showAddVatRateModal}
        close={() => setShowAddVatRateModal(false)}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle">Add New Vat Percentage</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{ title: '', percentage: '' }}
            validationSchema={branchVatRateValidationSchema}
            onSubmit={handleAddVatRate}
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form>
                <div className="mb-45">
                  <CustomInput
                    name={'title'}
                    type={'text'}
                    required
                    label={'Title'}
                    placeholder={'Enter Title'}
                    value={values.title}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.title && errors.title}
                  />
                </div>
                <div className="mb-45">
                  <CustomInput
                    name={'percentage'}
                    type={'number'}
                    max={100}
                    min={0}
                    required
                    label={'Percentage'}
                    placeholder={'Enter Percentage'}
                    value={values.percentage}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.percentage && errors.percentage}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  <CustomButton type="submit" text={'Save'} />
                  <CustomButton
                    variant={'secondaryButton'}
                    text={'Cancel'}
                    type={'button'}
                    onClick={() => setShowAddVatRateModal(false)}
                  />
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </CustomModal>
      {/* Edit Vat Percentage Modal  */}
      <CustomModal
        show={showEditVatRateModal}
        close={() => setShowEditVatRateModal(false)}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle">Edit Vat Percentage</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{
              title: selectedItem?.title,
              percentage: selectedItem?.percentage,
            }}
            validationSchema={branchVatRateValidationSchema}
            onSubmit={handleUpdateVatRate}
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form>
                <div className="mb-45">
                  <CustomInput
                    name={'title'}
                    type={'text'}
                    required
                    label={'Title'}
                    placeholder={'Enter Title'}
                    value={values.title}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.title && errors.title}
                  />
                </div>
                <div className="mb-45">
                  <CustomInput
                    name={'percentage'}
                    type={'number'}
                    max={100}
                    min={0}
                    required
                    label={'Percentage'}
                    placeholder={'Enter Percentage'}
                    value={values.percentage}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.percentage && errors.percentage}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {/* {!editVatRateMutation.isPending ? ( */}
                  <>
                    <CustomButton type="submit" text={'Update'} />
                    <CustomButton
                      variant={'secondaryButton'}
                      text={'Cancel'}
                      type={'button'}
                      onClick={() => setShowEditVatRateModal(false)}
                    />
                  </>
                  {/* ) : (
                    <PulseLoader size={11} className="modalLoader" />
                  )} */}
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </CustomModal>
    </div>
  );
};

export default NewBranchManagement;
