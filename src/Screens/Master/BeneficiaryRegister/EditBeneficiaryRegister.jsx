import { useMutation, useQuery } from '@tanstack/react-query';
import { ErrorMessage, FastField, Form, Formik } from 'formik';
import React from 'react';
import Skeleton from 'react-loading-skeleton';
import PhoneInput, { parsePhoneNumber } from 'react-phone-number-input';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import CombinedInputs from '../../../Components/CombinedInputs/CombinedInputs';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast';
import {
  useCountries,
  useNationalities,
} from '../../../Hooks/countriesAndStates';
import { useAccountsByType } from '../../../Hooks/useAccountsByType';
import useAutoFocus from '../../../Hooks/useAutoFocus';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { getClassificationsWithType } from '../../../Services/General';
import {
  editBeneficiaryRegister,
  viewBeneficiaryRegister,
} from '../../../Services/Masters/BeneficiaryRegister';
import { isNullOrEmpty, showErrorToast } from '../../../Utils/Utils';
import { addBeneficiaryRegisterValidationSchema } from '../../../Utils/Validations/ValidationSchemas';

const EditBeneficiaryRegister = () => {
  usePageTitle('Beneficiary Register - Edit');

  const { id } = useParams();
  const navigate = useNavigate();
  const firstInputFocusRef = useAutoFocus();

  const { data: nationalities, isLoading: loadingNationalities } =
    useNationalities();

  const { data: countries, isLoading: loadingCountries } = useCountries();

  // Get account options using custom hook
  const { getAccountsByTypeOptions } = useAccountsByType();

  // Queries and Mutations
  const {
    data: beneficiaryRegister,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['beneficiaryRegisterDetails', id],
    queryFn: () => viewBeneficiaryRegister(id),
    refetchOnWindowFocus: false,
    retry: 1,
    gcTime: 0,
  });

  const editBeneficiaryRegisterMutation = useMutation({
    mutationFn: (formData) => editBeneficiaryRegister(id, formData),
    onSuccess: () => {
      showToast('Beneficiary Updated!', 'success');
      setTimeout(() => {
        navigate(-1);
      }, 300);
    },
    onError: (error) => {
      console.error('Error updating Beneficiary', error);
      showErrorToast(error);
    },
  });

  // Get Classification Types
  const {
    data: classificationPurposeTypes,
    isLoading: typesLoading,
    isError: typesIsError,
    error: typesError,
  } = useQuery({
    queryKey: ['classificationTypes', 'purpose'],
    queryFn: () => getClassificationsWithType({ type: 'Purpose' }),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Function to fetch Classification Types and show loading/error if api fails
  const getTypeOptions = () => {
    if (!typesLoading && !typesIsError) {
      return classificationPurposeTypes?.map((x) => ({
        value: x.id,
        label: x.description,
      }));
    } else {
      if (typesIsError) {
        console.error('Unable to fetch clasification types', typesError);
        return [{ label: 'Unable to fetch types', value: null }];
      } else {
        return [{ label: 'Loading...', value: null, isDisabled: true }];
      }
    }
  };

  const handleSubmit = (values) => {
    let parsedMobileNumber;
    if (values.contact_number?.length > 3) {
      parsedMobileNumber = parsePhoneNumber(values.contact_number, 'US');
    }

    let formData = {
      ...values,
      ...(parsedMobileNumber && {
        contact_no: parsedMobileNumber.nationalNumber,
        country_code: parsedMobileNumber
          ? `+${parsedMobileNumber.countryCallingCode}`
          : '',
      }),
    };

    editBeneficiaryRegisterMutation.mutate(formData);
  };

  if (isLoading || isNullOrEmpty(nationalities)) {
    return (
      <div>
        <div className="d-flex flex-column align-items-start gap-2 mb-4">
          <BackButton />
          <h2 className="screen-title m-0">Beneficiary Register</h2>
        </div>

        <div className="d-card ">
          <div className="row">
            <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
              <div className="row ">
                {Array.from({ length: 19 }).map((_, i) => (
                  <div
                    key={i}
                    className="col-12 col-sm-6 mb-3 align-items-center"
                    style={{ height: 90 }}
                  >
                    <Skeleton
                      style={{ marginTop: 28 }}
                      duration={1}
                      width={'100%'}
                      baseColor="#ddd"
                      height={43}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (isError) {
    return (
      <div>
        <div className="d-flex flex-column align-items-start gap-2 mb-4">
          <BackButton />
          <h2 className="screen-title m-0">Beneficiary Register</h2>
        </div>

        <div className="d-card ">
          <div className="row">
            <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
              <div className="row mb-4">{error.message}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="d-flex flex-column align-items-start gap-2 mb-4">
        <BackButton />
        <h2 className="screen-title m-0">Beneficiary Register</h2>
      </div>

      <div className="d-card ">
        <div className="row">
          <div className="col-12 col-lg-11 col-xl-10 col-xxl-8">
            <Formik
              initialValues={{
                ...beneficiaryRegister,
                account:
                  beneficiaryRegister?.account?.id ||
                  beneficiaryRegister?.account?.toString() ||
                  beneficiaryRegister?.account ||
                  '',
                purpose: beneficiaryRegister?.purpose?.id,
                nationality: nationalities?.find(
                  (x) => x.value === beneficiaryRegister?.nationality?.id
                )?.value,
                country: countries?.find(
                  (x) => x?.value === beneficiaryRegister?.countries?.id
                )?.value,
              }}
              validationSchema={addBeneficiaryRegisterValidationSchema}
              onSubmit={handleSubmit}
              validateOnChange={false}
              validateOnBlur={true}
            >
              {({
                values,
                errors,
                touched,
                handleChange,
                handleBlur,
                setFieldValue,
              }) => {
                // Prepare Account select options and selected option
                const baseAccountOptions = getAccountsByTypeOptions(
                  values.type
                );

                // If account is not in options but we have account_name from API, add it to options
                const accountOptions = React.useMemo(() => {
                  if (
                    !values.account ||
                    !beneficiaryRegister?.account_name ||
                    !values.type
                  ) {
                    return baseAccountOptions;
                  }

                  const accountValue = values.account;
                  const accountStr = String(accountValue);
                  const accountNum = Number(accountValue);

                  const existsInOptions = baseAccountOptions?.some?.((o) => {
                    const optionValue = o.value;
                    return (
                      optionValue === accountValue ||
                      String(optionValue) === accountStr ||
                      Number(optionValue) === accountNum
                    );
                  });

                  if (!existsInOptions) {
                    // Add the account to options using account_name from API
                    return [
                      ...(baseAccountOptions || []),
                      {
                        value: accountValue,
                        label: beneficiaryRegister.account_name,
                      },
                    ];
                  }

                  return baseAccountOptions;
                }, [
                  baseAccountOptions,
                  values.account,
                  values.type,
                  beneficiaryRegister,
                ]);

                const selectedAccountOption = React.useMemo(() => {
                  if (!values.account) return null;

                  // Convert account value to string and number for comparison
                  const accountValue = values.account;
                  const accountStr = String(accountValue);
                  const accountNum = Number(accountValue);

                  // Try to find match with type coercion (string/number)
                  const match = accountOptions?.find?.((o) => {
                    const optionValue = o.value;
                    return (
                      optionValue === accountValue ||
                      String(optionValue) === accountStr ||
                      Number(optionValue) === accountNum
                    );
                  });

                  if (match) return match.value;

                  return accountValue;
                }, [values.account, accountOptions]);

                return (
                  <Form>
                    <div className="row mb-4">
                      <div className="col-12 col-sm-6 mb-3">
                        <CombinedInputs
                          label="Account"
                          type1="select"
                          type2="select"
                          name1="type"
                          name2="account"
                          value1={values.type}
                          value2={selectedAccountOption ?? values.account ?? ''}
                          options1={[
                            { label: 'Party', value: 'party', disabled: true },
                            { label: 'Walk-in Customer', value: 'walkin' },
                          ]}
                          options2={accountOptions}
                          isDisabled={false}
                          handleBlur={handleBlur}
                          placeholder1="Ledger"
                          placeholder2="Account"
                          className1="type"
                          className2="account"
                          onChange1={(selected) => {
                            setFieldValue('type', selected.value);
                            setFieldValue('account', ''); // Reset account when type changes
                          }}
                          onChange2={(selected) => {
                            setFieldValue('account', selected.value);
                          }}
                          setFieldValue={setFieldValue}
                          values={values}
                        />
                        <ErrorMessage
                          name="type"
                          component="div"
                          className="input-error-message text-danger"
                        />
                        <ErrorMessage
                          name="account"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'company'}
                          type={'text'}
                          label={'Company'}
                          placeholder={'Enter Company'}
                          value={values.company}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.company && errors.company}
                        />
                      </div>
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'name'}
                          type={'text'}
                          label={'Name'}
                          required
                          placeholder={'Enter Name'}
                          value={values.name}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.name && errors.name}
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
                      <div className="col-12 col-sm-6 mb-3">
                        <SearchableSelect
                          label={'Nationality'}
                          name="nationality"
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
                          value={values.nationality}
                          onChange={(v) => {
                            setFieldValue('nationality', v.value);
                            //   setSelectedNationality(v.value);
                          }}
                          placeholder={'Select Nationality'}
                        />
                        <ErrorMessage
                          name="nationality"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>
                      <div className="col-12 col-sm-6 inputWrapper">
                        <label className="mainLabel">Contact Number</label>
                        <FastField name="contact_number">
                          {({ field }) => (
                            <PhoneInput
                              {...field}
                              international
                              withCountryCallingCode
                              placeholder="Enter Contact Number"
                              className="mainInput"
                              defaultCountry="US"
                              onChange={(value) => {
                                setFieldValue('contact_number', value);
                              }}
                              onBlur={() =>
                                handleBlur({
                                  target: { name: 'contact_number' },
                                })
                              }
                            />
                          )}
                        </FastField>
                        <ErrorMessage
                          name="contact_number"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'bank_name'}
                          type={'text'}
                          label={'Bank Name'}
                          placeholder={'Enter Bank Name'}
                          value={values.bank_name}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.bank_name && errors.bank_name}
                        />
                      </div>
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'bank_account_number'}
                          type={'text'}
                          label={'Bank Account Number'}
                          placeholder={'Enter Bank Account Number'}
                          value={values.bank_account_number}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={
                            touched.bank_account_number &&
                            errors.bank_account_number
                          }
                        />
                      </div>
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'swift_bic_code'}
                          type={'text'}
                          label={'SWIFT/BIC Code'}
                          placeholder={'Enter SWIFT Code'}
                          value={values.swift_bic_code}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={
                            touched.swift_bic_code && errors.swift_bic_code
                          }
                        />
                      </div>
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'routing_number'}
                          type={'text'}
                          label={'Routing Number'}
                          placeholder={'Enter Routing Number'}
                          value={values.routing_number}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={
                            touched.routing_number && errors.routing_number
                          }
                        />
                      </div>
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'iban'}
                          type={'text'}
                          label={'IBAN'}
                          placeholder={'Enter IBAN'}
                          value={values.iban}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.iban && errors.iban}
                        />
                      </div>
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'bank_address'}
                          type={'text'}
                          label={'Bank Address'}
                          placeholder={'Enter Bank Address'}
                          value={values.bank_address}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.bank_address && errors.bank_address}
                        />
                      </div>
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'city'}
                          type={'text'}
                          label={'City'}
                          placeholder={'Enter City'}
                          value={values.city}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.city && errors.city}
                        />
                      </div>
                      <div className="col-12 col-sm-6 mb-3">
                        <SearchableSelect
                          name="country"
                          label={'Country'}
                          placeholder={'Select Country'}
                          options={
                            loadingCountries
                              ? [
                                  {
                                    label: 'Loading...',
                                    value: null,
                                    isDisabled: true,
                                  },
                                ]
                              : countries
                          }
                          value={values.country}
                          onChange={(v) => {
                            setFieldValue('country', v.value);
                          }}
                        />
                        <ErrorMessage
                          name="country"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'corresponding_bank'}
                          type={'text'}
                          label={'Corresponding Bank'}
                          placeholder={'Select Corresponding Bank'}
                          value={values.corresponding_bank}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={
                            touched.corresponding_bank &&
                            errors.corresponding_bank
                          }
                        />
                      </div>
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'corresponding_bank_account_number'}
                          type={'text'}
                          label={'Corresponding Bank Account Number'}
                          placeholder={'Enter Account Number'}
                          value={values.corresponding_bank_account_number}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={
                            touched.corresponding_bank_account_number &&
                            errors.corresponding_bank_account_number
                          }
                        />
                      </div>
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'corresponding_swift_bic_code'}
                          type={'text'}
                          label={'Corresponding SWIFT/BIC Code'}
                          placeholder={'Enter SWIFT Code'}
                          value={values.corresponding_swift_bic_code}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={
                            touched.corresponding_swift_bic_code &&
                            errors.corresponding_swift_bic_code
                          }
                        />
                      </div>
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'corresponding_routing_number'}
                          type={'text'}
                          label={'Corresponding Routing Number'}
                          placeholder={'Enter Routing Number'}
                          value={values.corresponding_routing_number}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={
                            touched.corresponding_routing_number &&
                            errors.corresponding_routing_number
                          }
                        />
                      </div>
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'corresponding_iban'}
                          type={'text'}
                          label={'Corresponding IBAN'}
                          placeholder={'Enter IBAN'}
                          value={values.corresponding_iban}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={
                            touched.corresponding_iban &&
                            errors.corresponding_iban
                          }
                        />
                      </div>
                      <div className="col-12 col-sm-6 mb-3">
                        <SearchableSelect
                          label={'Purpose'}
                          name="purpose"
                          options={getTypeOptions()}
                          value={values.purpose}
                          onChange={(v) => {
                            setFieldValue('purpose', v.value);
                          }}
                          placeholder={'Select Purpose'}
                        />

                        <ErrorMessage
                          name="purpose"
                          component="div"
                          className="input-error-message text-danger"
                        />
                      </div>
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'branch'}
                          type={'text'}
                          label={'Branch'}
                          placeholder={'Enter Branch'}
                          value={values.branch}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.branch && errors.branch}
                        />
                      </div>
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'ifsc_code'}
                          type={'text'}
                          label={'IFSC Code'}
                          placeholder={'Enter IFSC Code'}
                          value={values.ifsc_code}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.ifsc_code && errors.ifsc_code}
                        />
                      </div>
                    </div>
                    <div className="d-flex gap-3 ms-auto mb-3 mb-md-0">
                      <CustomButton
                        loading={editBeneficiaryRegisterMutation.isPending}
                        disabled={editBeneficiaryRegisterMutation.isPending}
                        type={'submit'}
                        text={'Update'}
                      />
                      {!editBeneficiaryRegisterMutation.isPending && (
                        <CustomButton
                          variant={'secondaryButton'}
                          text={'Cancel'}
                          type={'button'}
                          disabled={editBeneficiaryRegisterMutation.isPending}
                          onClick={() => navigate(-1)}
                        />
                      )}
                    </div>
                  </Form>
                );
              }}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditBeneficiaryRegister;
