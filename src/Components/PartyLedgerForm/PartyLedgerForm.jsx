import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, FastField, Form, Formik } from 'formik';
import React, { useState } from 'react';
import PhoneInput from 'react-phone-number-input';
import { PulseLoader } from 'react-spinners';
import { useNationalities, useStates } from '../../Hooks/countriesAndStates';
import useAutoFocus from '../../Hooks/useAutoFocus';
import {
  addPartyLedger,
  addPartyLedgerClassification,
  getCBGroups,
  getOfficeLocations,
  getPartyLedgerClassifications,
  getPartyLedgerIDTypes,
  getPostingAccounts,
} from '../../Services/Masters/PartyLedger';
import useUserStore from '../../Stores/UserStore';
import { statusOptions } from '../../Utils/Constants/SelectOptions';
import { showErrorToast } from '../../Utils/Utils';
import {
  addPartyLedgerClassificationSchema,
  partyLedgerAccountValidationSchema,
  partyLedgerContactValidationSchema,
  partyLedgerIdValidationSchema,
  partyLedgerVatValidationSchema,
} from '../../Utils/Validations/ValidationSchemas';
import CustomButton from '../CustomButton';
import CustomInput from '../CustomInput';
import CustomModal from '../CustomModal';
import HorizontalTabs from '../HorizontalTabs/HorizontalTabs';
import SearchableSelect from '../SearchableSelect/SearchableSelect';
import { showToast } from '../Toast/Toast';

const PartyLedgerForm = ({
  initialValues,
  isLoading,
  onSuccess,
  onCancel,
  inPopup = false,
}) => {
  const newAccountType = useUserStore(
    (state) => state.user.party_ledgers_account_type
  );
  // const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('account');
  const [warnings, setWarnings] = useState({});
  const [formData, setFormData] = useState({});
  const [selectedVATCountry, setSelectedVATCountry] = useState(null);
  const [
    showAddNewPartyLedgerClassificationModal,
    setShowAddNewPartyLedgerClassificationModal,
  ] = useState(false);
  const firstInputFocusRef = useAutoFocus();
  const { data: nationalities, isLoading: loadingNationalities } =
    useNationalities();

  // Fetch states based on the selected VAT Country
  const { data: states, isLoading: loadingStates } =
    useStates(selectedVATCountry);

  const addPartyLedgerMutation = useMutation({
    mutationFn: addPartyLedger,
    onSuccess: (data) => {
      showToast('Party Ledger Added!', 'success');
      queryClient.invalidateQueries(['accounts', 'party']);
      if (onSuccess) {
        onSuccess(data?.detail);
      }
    },
    onError: (error) => {
      console.error('Error adding Party Ledger', error);
      showErrorToast(error);
    },
  });
  // Add Classification Mutation
  const addPartyLedgerClassificationMutation = useMutation({
    mutationFn: addPartyLedgerClassification,
    onSuccess: () => {
      setShowAddNewPartyLedgerClassificationModal(false);
      showToast('New Classification Added', 'success');
      queryClient.invalidateQueries(['partyLedgerClassifications']);
    },
    onError: (error) => {
      setShowAddNewPartyLedgerClassificationModal(false);
      showErrorToast(error);
    },
  });

  const handleSubmit = (values) => {
    const tabSequence = ['account', 'contact', 'id', 'vat'];
    const currentIndex = tabSequence.indexOf(activeTab);
    if (activeTab === 'vat') {
      let payload = { ...formData, ...values };
      
      // Remove account_code from payload if not required (when account type is not manual)
      if (newAccountType !== 'manual') {
        delete payload.account_code;
      }
      
      setFormData(payload);
      if (
        !payload.account_title ||
        !payload.classification ||
        !payload.debit_posting_account ||
        !payload.credit_posting_account
      ) {
        setActiveTab('account');
      } else if (!payload.company_name || !payload.telephone_number) {
        setActiveTab('contact');
      } else if (
        !payload.id_type ||
        !payload.id_number ||
        !payload.issue_date ||
        !payload.valid_upto
      ) {
        setActiveTab('id');
      } else {
        addPartyLedgerMutation.mutate(payload);
      }
    } else {
      setFormData({ ...formData, ...values });
      if (currentIndex < tabSequence.length - 1) {
        // Move to the next tab if not the last tab
        setActiveTab(tabSequence[currentIndex + 1]);
      }
    }
  };

  // Get Debit Posting Accounts
  const {
    data: debitPostingAccount,
    isLoading: isLoadingdebitPostingAccount,
    isError: IsErrordebitPostingAccount,
    error: ErrordebitPostingAccount,
  } = useQuery({
    queryKey: ['debitPostingAccount'],
    queryFn: () => getPostingAccounts('debit'),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Get Credit Posting Accounts
  const {
    data: creditPostingAccount,
    isLoading: isLoadingcreditPostingAccount,
    isError: IsErrorcreditPostingAccount,
    error: ErrorcreditPostingAccount,
  } = useQuery({
    queryKey: ['creditPostingAccount'],
    queryFn: () => getPostingAccounts('credit'),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Get Office Locations
  const {
    data: allOfficeLocations,
    isLoading: isLoadingOfficeLocations,
    isError: IsErrorOfficeLocations,
    error: ErrorOfficeLocations,
  } = useQuery({
    queryKey: ['officeLocations'],
    queryFn: getOfficeLocations,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Get Classifications
  const {
    data: partyLedgerClassifications,
    isLoading: isLoadingPartyLedgerClassifications,
    isError: IsErrorPartyLedgerClassifications,
    error: ErrorPartyLedgerClassifications,
  } = useQuery({
    queryKey: ['partyLedgerClassifications'],
    queryFn: getPartyLedgerClassifications,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  // Get CB Groups
  const {
    data: CBGroups,
    isLoading: isLoadingCBGroups,
    isError: IsErrorCBGroups,
    error: ErrorCBGroups,
  } = useQuery({
    queryKey: ['CBGroups'],
    queryFn: getCBGroups,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  // Get ID Types
  const {
    data: IDTypes,
    isLoading: isLoadingIDTypes,
    isError: IsErrorIDTypes,
    error: ErrorIDTypes,
  } = useQuery({
    queryKey: ['IDTypes'],
    queryFn: getPartyLedgerIDTypes,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Function to fetch Office Location Options by calling API and returning desired options array. Also show loading/error if api fails
  const getOfficeLocationOptions = () => {
    if (!isLoadingOfficeLocations && !IsErrorOfficeLocations) {
      return allOfficeLocations?.map((x) => ({
        value: x.id,
        label: x.office_location,
      }));
    } else {
      if (IsErrorOfficeLocations) {
        console.error('Unable to fetch Office Location', ErrorOfficeLocations);
        return [{ label: 'Unable to fetch Office Location', value: null }];
      } else {
        return [{ label: 'Loading...', value: null, isDisabled: true }];
      }
    }
  };
  const getClassificationOptions = () => {
    if (
      !isLoadingPartyLedgerClassifications &&
      !IsErrorPartyLedgerClassifications
    ) {
      let options = partyLedgerClassifications?.map((x) => ({
        value: x.id,
        label: x.classification,
      }));
      options.push({ label: 'Add New Classification', value: null });
      return options;
    } else {
      if (IsErrorPartyLedgerClassifications) {
        console.error(
          'Unable to fetch Party Ledger Classifications',
          ErrorPartyLedgerClassifications
        );
        return [
          {
            label: 'Unable to fetch Party Ledger Classifications',
            value: null,
          },
          { label: 'Add New Classification', value: null },
        ];
      } else {
        return [
          { label: 'Loading...', value: null, isDisabled: true },
          { label: 'Add New Classification', value: null },
        ];
      }
    }
  };
  const getCBGroupsOptions = () => {
    if (!isLoadingCBGroups && !IsErrorCBGroups) {
      return CBGroups?.map((x) => ({
        value: x.id,
        label: x.title,
      }));
    } else {
      if (IsErrorCBGroups) {
        console.error('Unable to fetch Central Bank Groups', ErrorCBGroups);
        return [
          {
            label: 'Unable to fetch Central Bank Groups',
            value: null,
          },
        ];
      } else {
        return [{ label: 'Loading...', value: null, isDisabled: true }];
      }
    }
  };
  const getIDTypesOptions = () => {
    if (!isLoadingIDTypes && !IsErrorIDTypes) {
      return IDTypes?.map((x) => ({
        value: x.id,
        label: x.description,
      }));
    } else {
      if (IsErrorIDTypes) {
        console.error('Unable to fetch ID Types', ErrorIDTypes);
        return [
          {
            label: 'Unable to fetch ID Types',
            value: null,
          },
        ];
      } else {
        return [{ label: 'Loading...', value: null, isDisabled: true }];
      }
    }
  };

  // Function to handle add Classification Register
  const handleAddPartyLedgerClassification = (values) => {
    addPartyLedgerClassificationMutation.mutate(values);
  };

  const tabs = [
    { label: 'Account Detail', value: 'account' },
    { label: 'Contact Detail', value: 'contact' },
    { label: 'ID Detail', value: 'id' },
    { label: 'VAT Detail', value: 'vat' },
  ];

  const renderTab = (tab) => {
    switch (tab) {
      case 'account':
        return (
          <Formik
            key="account"
            enableReinitialize={true}
            initialValues={{
              account_code: '',
              account_title: '',
              rtl_title: '',
              classification: '',
              central_bank_group: '',
              status: 'active',
              offline_iwt_entry: '',
              money_service_agent: '',
              office: '',
              debit_limit: '',
              credit_limit: '',
              ...formData,
              // Always use defaults for posting accounts
              debit_posting_account: debitPostingAccount?.id || formData?.debit_posting_account || '',
              credit_posting_account: creditPostingAccount?.id || formData?.credit_posting_account || '',
              vat_country: nationalities?.find(
                (x) => x?.value === formData?.vat_country?.id
              )?.value,
              vat_state: states?.find(
                (x) => x?.value === formData?.vat_state?.id
              ),
            }}
            validationSchema={partyLedgerAccountValidationSchema}
            validate={(values) => {
              const errors = {};
              const numericRegex = /^[0-9]*$/; // Only numeric characters
              if (newAccountType === 'manual' && !values.account_code) {
                errors.account_code = 'Account Code is required';
              } else if (
                newAccountType === 'manual' &&
                !numericRegex.test(values.account_code)
              ) {
                errors.account_code = 'Account Code must contain only numbers';
              }
              return errors;
            }}
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
                  {newAccountType === 'manual' ? (
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'account_code'}
                        type={'text'}
                        label={'Account Code'}
                        required={newAccountType === 'manual'}
                        placeholder={'Enter Account Code'}
                        value={values.account_code}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        ref={
                          newAccountType === 'manual'
                            ? firstInputFocusRef
                            : undefined
                        }
                        error={touched.account_code && errors.account_code}
                      />
                    </div>
                  ) : null}
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      name={'account_title'}
                      type={'text'}
                      required
                      label={'Account Title'}
                      placeholder={'Enter Account Title'}
                      value={values.account_title}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      maxLength={30}
                      ref={
                        newAccountType !== 'manual'
                          ? firstInputFocusRef
                          : undefined
                      }
                      error={touched.account_title && errors.account_title}
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      name={'rtl_title'}
                      type={'text'}
                      direction={'rtl'}
                      label={'RTL Title'}
                      placeholder={'Enter RTL Title'}
                      value={values.rtl_title}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.rtl_title && errors.rtl_title}
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-4">
                    <SearchableSelect
                      name="classification"
                      label={'Classification'}
                      required
                      placeholder={'Select Classification'}
                      options={getClassificationOptions()}
                      value={values.classification}
                      onChange={(v) => {
                        if (v.label?.toLowerCase()?.startsWith('add new')) {
                          setShowAddNewPartyLedgerClassificationModal(true);
                        }
                        setFieldValue('classification', v.value);
                      }}
                    />
                    <ErrorMessage
                      name="classification"
                      component="div"
                      className="input-error-message text-danger"
                    />
                  </div>
                  {newAccountType !== 'manual' && (
                    <div className="col-12 col-sm-6 mb-4" />
                  )}
                  <div className="col-12 col-sm-6 mb-4">
                    <SearchableSelect
                      name="debit_posting_account"
                      label={'Debit Posting Account'}
                      placeholder={'Select Debit Posting Account'}
                      options={[
                        {
                          label: debitPostingAccount?.title,
                          value: debitPostingAccount?.id,
                        },
                      ]}
                      value={values.debit_posting_account}
                      required
                      isDisabled={true}
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
                      options={[
                        {
                          label: creditPostingAccount?.title,
                          value: creditPostingAccount?.id,
                        },
                      ]}
                      value={values.credit_posting_account}
                      required
                      isDisabled={true}
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
                  <div className="col-12 col-sm-6 mb-3">
                    <SearchableSelect
                      label={'Central Bank Group'}
                      name="central_bank_group"
                      options={getCBGroupsOptions()}
                      value={values.central_bank_group}
                      onChange={(v) => {
                        setFieldValue('central_bank_group', v.value);
                      }}
                      placeholder={'Select Central Bank Group'}
                    />
                    <ErrorMessage
                      name="central_bank_group"
                      component="div"
                      className="input-error-message text-danger"
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-4">
                    <SearchableSelect
                      label={'Status'}
                      name="status"
                      options={statusOptions}
                      value={values.status}
                      onChange={(v) => {
                        setFieldValue('status', v.value);
                      }}
                      placeholder={'Select Status'}
                    />
                    <ErrorMessage
                      name="status"
                      component="div"
                      className="input-error-message text-danger"
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-4">
                    <SearchableSelect
                      name="offline_iwt_entry"
                      label={'Offline IWT Entry'}
                      options={[
                        { label: 'Yes', value: true },
                        { label: 'No', value: false },
                      ]}
                      value={values.offline_iwt_entry}
                      onChange={(v) => {
                        setFieldValue('offline_iwt_entry', v.value);
                      }}
                      placeholder={'Select Offline IWT Entry'}
                    />
                    <ErrorMessage
                      name="offline_iwt_entry"
                      component="div"
                      className="input-error-message text-danger"
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-4">
                    <SearchableSelect
                      name="money_service_agent"
                      label={'Money Service Agent'}
                      options={[
                        { label: 'Yes', value: true },
                        { label: 'No', value: false },
                      ]}
                      value={values.money_service_agent}
                      onChange={(v) => {
                        setFieldValue('money_service_agent', v.value);
                      }}
                      placeholder={'Select Money Service Agent'}
                    />
                    <ErrorMessage
                      name="money_service_agent"
                      component="div"
                      className="input-error-message text-danger"
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      name={'debit_limit'}
                      type={'number'}
                      label={'Debit Limit'}
                      placeholder={'Enter Debit Limit'}
                      value={values.debit_limit}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.debit_limit && errors.debit_limit}
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      name={'credit_limit'}
                      type={'number'}
                      label={'Credit Limit'}
                      placeholder={'Enter Credit Limit'}
                      value={values.credit_limit}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.credit_limit && errors.credit_limit}
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <SearchableSelect
                      label={'Office Location'}
                      name="office"
                      options={getOfficeLocationOptions()}
                      onChange={(v) => {
                        setFieldValue('office', v.value);
                      }}
                      value={values.office}
                      placeholder={'Select Office Location'}
                      menuPlacement="auto"
                    />
                    <ErrorMessage
                      name="office"
                      component="div"
                      className="input-error-message text-danger"
                    />
                  </div>
                </div>
                <div className="d-flex gap-3">
                  <CustomButton
                    isLoading={addPartyLedgerMutation.isPending}
                    disabled={addPartyLedgerMutation.isPending}
                    text={'Save and Next'}
                    type={'submit'}
                  />
                  <CustomButton
                    text={'Cancel'}
                    variant={'secondaryButton'}
                    type={'button'}
                    disabled={addPartyLedgerMutation.isPending}
                    onClick={() => {
                      if (onCancel) {
                        onCancel();
                      }
                    }}
                  />
                </div>
              </Form>
            )}
          </Formik>
        );
      case 'contact':
        return (
          <Formik
            key="contact"
            initialValues={{
              company_name: '',
              address: '',
              telephone_number: '',
              telephone_country_code: '',
              fax: '',
              fax_country_code: '',
              email: '',
              contact_person: '',
              mobile_number: '',
              mobile_country_code: '',
              nationality: '',
              entity: '',
              ...formData,
            }}
            validationSchema={partyLedgerContactValidationSchema}
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
                      name={'company_name'}
                      type={'text'}
                      required
                      label={'Company Name'}
                      placeholder={'Enter company Name'}
                      value={values.company_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.company_name && errors.company_name}
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      name={'address'}
                      type={'text'}
                      label={'Address'}
                      placeholder={'Enter Address'}
                      value={values.address}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.address && errors.address}
                    />
                  </div>

                  <div className="col-12 col-sm-6 mb-4 inputWrapper">
                    <label className="mainLabel">
                      Telephone Number
                      <span className="text-danger">*</span>
                    </label>
                    <FastField name="telephone_number">
                      {({ field }) => (
                        <PhoneInput
                          {...field}
                          international
                          withCountryCallingCode
                          placeholder="Enter Telephone number"
                          className="mainInput"
                          defaultCountry="US"
                          onChange={(value) =>
                            setFieldValue('telephone_number', value)
                          }
                          onBlur={() =>
                            handleBlur({
                              target: { name: 'telephone_number' },
                            })
                          }
                        />
                      )}
                    </FastField>
                    <ErrorMessage
                      name="telephone_number"
                      component="div"
                      className="input-error-message text-danger"
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3 inputWrapper">
                    <label className="mainLabel">Fax Number</label>
                    <FastField name="fax">
                      {({ field }) => (
                        <PhoneInput
                          {...field}
                          international
                          withCountryCallingCode
                          placeholder="Enter fax number"
                          className="mainInput mb-3"
                          defaultCountry="US"
                          onChange={(value) => setFieldValue('fax', value)}
                          onBlur={() => handleBlur({ target: { name: 'fax' } })}
                        />
                      )}
                    </FastField>
                    <ErrorMessage
                      name="fax"
                      component="div"
                      className="input-error-message text-danger"
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      name={'email'}
                      type={'email'}
                      label={'Email'}
                      placeholder={'Enter Email'}
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.email && errors.email}
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      name={'contact_person'}
                      type={'contact_person'}
                      label={'Contact Person'}
                      placeholder={'Enter Contact Person'}
                      value={values.contact_person}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.contact_person && errors.contact_person}
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3 inputWrapper">
                    <label className="mainLabel">Mobile Number</label>
                    <FastField name="mobile_number">
                      {({ field }) => (
                        <PhoneInput
                          {...field}
                          international
                          withCountryCallingCode
                          placeholder="Enter phone number"
                          className="mainInput mb-3"
                          defaultCountry="US"
                          onChange={(value) => {
                            setFieldValue('mobile_number', value);
                          }}
                          onBlur={() =>
                            handleBlur({ target: { name: 'mobile_number' } })
                          }
                        />
                      )}
                    </FastField>
                    <ErrorMessage
                      name="mobile_number"
                      component="div"
                      className="input-error-message text-danger"
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <SearchableSelect
                      name="nationality"
                      label={'Nationality'}
                      value={values.nationality}
                      options={
                        loadingNationalities
                          ? [
                              {
                                label: 'Loading...',
                                value: '',
                                isDisabled: true,
                              },
                            ]
                          : nationalities
                      }
                      onChange={(v) => {
                        setFieldValue('nationality', v.value);
                      }}
                      placeholder={'Select Nationality'}
                    />
                    <ErrorMessage
                      name="nationality"
                      component="div"
                      className="input-error-message text-danger"
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <SearchableSelect
                      name="entity"
                      label={'Entity'}
                      value={values.entity}
                      options={[
                        {
                          label: 'Company',
                          value: 'Company',
                        },
                        {
                          label: 'Individual',
                          value: 'Individual',
                        },
                      ]}
                      onChange={(v) => {
                        setFieldValue('entity', v.value);
                      }}
                      placeholder={'Select Entity'}
                    />
                    <ErrorMessage
                      name="entity"
                      component="div"
                      className="input-error-message text-danger"
                    />
                  </div>
                </div>
                <div className="d-flex gap-3">
                  <CustomButton
                    isLoading={addPartyLedgerMutation.isPending}
                    disabled={addPartyLedgerMutation.isPending}
                    text={'Save and Next'}
                    type={'submit'}
                  />
                  <CustomButton
                    text={'Cancel'}
                    variant={'secondaryButton'}
                    type={'button'}
                    disabled={addPartyLedgerMutation.isPending}
                    onClick={() => navigate(-1)}
                  />
                </div>
              </Form>
            )}
          </Formik>
        );
      case 'id':
        return (
          <Formik
            key="id"
            initialValues={{
              id_type: '',
              id_number: '',
              issue_date: '',
              valid_upto: '',
              issue_place: '',
              ...formData,
            }}
            validationSchema={partyLedgerIdValidationSchema}
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
                    <SearchableSelect
                      name="id_type"
                      label={'ID Type'}
                      value={values.id_type}
                      required
                      options={getIDTypesOptions()}
                      onChange={(v) => {
                        setFieldValue('id_type', v.value);
                      }}
                      placeholder={'Select ID Type'}
                    />
                    <ErrorMessage
                      name="id_type"
                      component="div"
                      className="input-error-message text-danger"
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      name={'id_number'}
                      type={'text'}
                      required
                      label={'ID Number'}
                      placeholder={'Enter ID Number'}
                      value={values.id_number}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.id_number && errors.id_number}
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      name={'issue_date'}
                      type={'date'}
                      required
                      label={'Issue Date'}
                      placeholder={'Select Issue Date'}
                      value={values.issue_date}
                      max={new Date().toLocaleDateString('en-CA')}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.issue_date && errors.issue_date}
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      name={'valid_upto'}
                      type={'date'}
                      required
                      label={'Valid Upto'}
                      placeholder={'Select Valid Upto'}
                      value={values.valid_upto}
                      onChange={(e) => {
                        if (new Date(e.target.value) < new Date()) {
                          setWarnings({
                            ...warnings,
                            valid_upto: 'ID has expired',
                          });
                        } else {
                          setWarnings({
                            ...warnings,
                            valid_upto: null,
                          });
                        }
                        handleChange(e);
                      }}
                      onBlur={handleBlur}
                      error={touched.valid_upto && errors.valid_upto}
                    />
                    {!errors.valid_upto && warnings?.valid_upto && (
                      <p style={{ marginTop: '-1rem' }} className="text-danger">
                        {warnings.valid_upto}
                      </p>
                    )}
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      name={'issue_place'}
                      type={'text'}
                      label={'Place of Issue'}
                      placeholder={'Enter Place of Issue'}
                      value={values.issue_place}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.issue_place && errors.issue_place}
                    />
                  </div>
                </div>
                <div className="d-flex gap-3">
                  <CustomButton
                    isLoading={addPartyLedgerMutation.isPending}
                    disabled={addPartyLedgerMutation.isPending}
                    text={'Save and Next'}
                    type={'submit'}
                  />
                  <CustomButton
                    text={'Cancel'}
                    variant={'secondaryButton'}
                    type={'button'}
                    disabled={addPartyLedgerMutation.isPending}
                    onClick={() => navigate(-1)}
                  />
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
              vat_trn: formData?.vat_trn,
              vat_country: formData?.vat_country || '',
              vat_state: formData?.vat_state || null,
            }}
            validationSchema={partyLedgerVatValidationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, handleBlur, setFieldValue }) => (
              <Form>
                <div className="row mb-4">
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      name={'vat_trn'}
                      type={'text'}
                      label={'VAT TRN'}
                      placeholder={'Enter VAT TRN'}
                      value={values.vat_trn}
                      onChange={(v) => {
                        setFieldValue('vat_trn', v.target.value);
                        setFormData((prev) => ({
                          ...prev,
                          vat_trn: v.target.value,
                        }));
                      }}
                      onBlur={handleBlur}
                      error={touched.vat_trn && errors.vat_trn}
                    />
                    <div className="checkbox-wrapper">
                      <label className="checkbox-container">
                        <input
                          defaultChecked={false}
                          onChange={(v) =>
                            setFieldValue(
                              'vat_exempted',
                              v.target.checked ? 1 : 0
                            )
                          }
                          type="checkbox"
                          name="vat_exempted"
                        />
                        <span className="custom-checkbox"></span>
                        VAT Exempted
                      </label>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <SearchableSelect
                      label={'VAT Country'}
                      name="vat_country"
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
                        setFieldValue('vat_country', v.value);
                        setFieldValue('vat_state', null);
                        setFormData((prev) => ({
                          ...prev,
                          vat_country: v ? v.value : '',
                          vat_state: null,
                        }));
                        setSelectedVATCountry(v.value);
                      }}
                      value={values.vat_country}
                      placeholder={'Select VAT Country'}
                      menuPlacement="auto"
                    />
                    <ErrorMessage
                      name="vat_country"
                      component="div"
                      className="input-error-message text-danger"
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <SearchableSelect
                      label={'VAT State'}
                      name="vat_state"
                      options={
                        !selectedVATCountry
                          ? [
                              {
                                label: 'Select Country First',
                                value: null,
                                isDisabled: true,
                              },
                            ]
                          : loadingStates
                          ? [
                              {
                                label: 'Loading...',
                                value: null,
                                isDisabled: true,
                              },
                            ]
                          : states
                      }
                      onChange={(v) => {
                        setFieldValue('vat_state', v.value);
                        setFormData({ ...formData, vat_state: v.value });
                      }}
                      value={values.vat_state}
                      placeholder={'Select VAT State'}
                    />
                    <ErrorMessage
                      name="vat_state"
                      component="div"
                      className="input-error-message text-danger"
                    />
                  </div>
                </div>
                <div className="d-flex gap-3">
                  <CustomButton
                    loading={addPartyLedgerMutation.isPending}
                    disabled={addPartyLedgerMutation.isPending}
                    text={'Save'}
                    type={'submit'}
                  />
                  <CustomButton
                    text={'Cancel'}
                    variant={'secondaryButton'}
                    type={'button'}
                    disabled={addPartyLedgerMutation.isPending}
                    onClick={() => navigate(-1)}
                  />
                </div>
              </Form>
            )}
          </Formik>
        );
      default:
        break;
    }
    return <p>{tab}</p>;
  };

  return (
    <>
      {inPopup ? <h2 className="screen-title-body">Party Ledger</h2> : null}
      <HorizontalTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <div className={`${inPopup ? 'px-4 pt-3' : 'd-card'}`}>
        <div className="row">
          <div
            className={`${
              inPopup ? 'col-12' : 'col-12 col-lg-10 col-xl-9 col-xxl-7'
            }`}
          >
            {renderTab(activeTab)}
            {activeTab !== 'vat' ? (
              <p style={{ fontSize: 14 }} className="fw-light mt-3 mb-0">
                Click save after making any changes before moving to the next
                tab
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <CustomModal
        show={showAddNewPartyLedgerClassificationModal}
        close={() => {
          setShowAddNewPartyLedgerClassificationModal(false);
        }}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle">New Classification</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{ classification: '' }}
            validationSchema={addPartyLedgerClassificationSchema}
            onSubmit={handleAddPartyLedgerClassification}
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form>
                <div className="mb-45">
                  <CustomInput
                    label="Classification"
                    name="classification"
                    required
                    id="classification"
                    type="text"
                    placeholder="Enter Classification"
                    value={values.classification}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.classification && errors.classification}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {!addPartyLedgerClassificationMutation.isPending ? (
                    <>
                      <CustomButton type="submit" text={'Save'} />
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() => {
                          setShowAddNewPartyLedgerClassificationModal(false);
                        }}
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

export default PartyLedgerForm;
