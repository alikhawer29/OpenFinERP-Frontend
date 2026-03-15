import { useMutation, useQuery } from '@tanstack/react-query';
import { ErrorMessage, FastField, Form, Formik } from 'formik';
import React from 'react';
import PhoneInput, { parsePhoneNumber } from 'react-phone-number-input';
import { useCountries, useNationalities } from '../../Hooks/countriesAndStates';
import { getClassificationsWithType } from '../../Services/General';
import {
  addBeneficiaryRegister,
} from '../../Services/Masters/BeneficiaryRegister';
import { isNullOrEmpty, showErrorToast } from '../../Utils/Utils';
import { addBeneficiaryRegisterValidationSchema } from '../../Utils/Validations/ValidationSchemas';
import CustomButton from '../CustomButton';
import CustomInput from '../CustomInput';
import SearchableSelect from '../SearchableSelect/SearchableSelect';
import { showToast } from '../Toast/Toast';
import { useQueryClient } from '@tanstack/react-query';
import useAutoFocus from '../../Hooks/useAutoFocus';
import CombinedInputs from '../CombinedInputs/CombinedInputs';
import { useAccountsByType } from '../../Hooks/useAccountsByType';

const BeneficiaryRegisterForm = ({ onSuccess, onCancel, inPopup = false }) => {
  const queryClient = useQueryClient();

  const firstInputFocusRef = useAutoFocus();

  const { data: nationalities, isLoading: loadingNationalities } =
    useNationalities();
  const { data: countries, isLoading: loadingCountries } = useCountries();

  // Get account options using custom hook
  const { getAccountsByTypeOptions } = useAccountsByType();

  const addBeneficiaryRegisterMutation = useMutation({
    mutationFn: addBeneficiaryRegister,
    onSuccess: (data) => {
      showToast('Beneficiary Added!', 'success');
      queryClient.invalidateQueries(['beneficiaryRegister']);
      if (onSuccess) onSuccess(data?.detail);
    },
    onError: (error) => {
      console.error('Error adding Beneficiary', error);
      showErrorToast(error);
    },
  });

  // Get Classification Types
  const {
    data: classificationPurposeTypes,
    isLoading: typesLoading,
    isError: typesError,
    error,
  } = useQuery({
    queryKey: ['classificationTypes', 'purpose'],
    queryFn: () => getClassificationsWithType({ type: 'Purpose' }),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Function to fetch Classification Types and show loading/error if api fails
  const getTypeOptions = () => {
    if (!typesLoading && !typesError) {
      return classificationPurposeTypes?.map((x) => ({
        value: x.id,
        label: x.description,
      }));
    } else {
      if (typesError) {
        console.error('Unable to fetch clasification types', error);
        return [{ label: 'Unable to fetch types', value: null }];
      } else {
        return [{ label: 'Loading...', value: null, isDisabled: true }];
      }
    }
  };

  const handleSubmit = (values) => {
    let parsedMobileNumber;
    if (values.contact_no?.length > 3) {
      parsedMobileNumber = parsePhoneNumber(values.contact_no, 'US');
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

    addBeneficiaryRegisterMutation.mutate(formData);
  };

  return (
    <>
      <div className={`${inPopup ? 'px-4 pt-2' : 'd-card'}`}>
        {inPopup ? (
          <h2 className="screen-title-body">Beneficiary Register</h2>
        ) : null}
        <div className="row">
          <div
            className={`${inPopup ? 'col-12' : 'col-12 col-lg-10 col-xl-9 col-xxl-7'
              }`}
          >
            <Formik
              initialValues={{
                account: '',
                type: '',
                name: '',
                company: '',
                address: '',
                nationality: '',
                contact_no: '',
                country_code: '',
                bank_name: '',
                bank_account_number: '',
                swift_bic_code: '',
                routing_number: '',
                iban: '',
                bank_address: '',
                city: '',
                country: '',
                corresponding_bank: '',
                corresponding_bank_account_number: '',
                corresponding_swift_bic_code: '',
                corresponding_routing_number: '',
                corresponding_iban: '',
                purpose: '',
                branch: '',
                ifsc_code: '',
              }}
              // validateOnChange={false}
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
              }) => (
                <Form>
                  <div className="row mb-4">
                    <div className="col-12 col-sm-6 mb-3">
                      <CombinedInputs
                        label="Ledger"
                        type1="select"
                        type2="select"
                        name1="type"
                        name2="account"
                        value1={values.type}
                        value2={values.account}
                        options1={[
                          { label: 'Party', value: 'party', disabled: true},
                          { label: 'Walk-in Customer', value: 'walkin' },
                        ]}
                        options2={getAccountsByTypeOptions(values.type)}
                        isDisabled={false}
                        handleBlur={handleBlur}
                        placeholder1="Account"
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
                    <div className="col-12 col-sm-6 mb-45">
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
                        onChange={(v) => {
                          setFieldValue('nationality', v.value);
                        }}
                        value={values.nationality}
                        placeholder={'Select nationality'}
                      />
                      <ErrorMessage
                        name="nationality"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
                    <div className="col-12 col-sm-6 inputWrapper">
                      <label className="mainLabel">Contact Number</label>
                      <FastField name="contact_no">
                        {({ field }) => (
                          <PhoneInput
                            {...field}
                            international
                            withCountryCallingCode
                            placeholder="Enter Contact Number"
                            className="mainInput"
                            defaultCountry="US"
                            onChange={(value) => {
                              setFieldValue('contact_no', value);
                            }}
                            onBlur={() =>
                              handleBlur({ target: { name: 'contact_no' } })
                            }
                          />
                        )}
                      </FastField>
                      <ErrorMessage
                        name="contact_no"
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
                        error={touched.swift_bic_code && errors.swift_bic_code}
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
                        error={touched.routing_number && errors.routing_number}
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
                        options={
                          typesLoading
                            ? [
                              {
                                label: 'Loading...',
                                value: null,
                                isDisabled: true,
                              },
                            ]
                            : getTypeOptions()
                        }
                        onChange={(v) => {
                          setFieldValue('purpose', v.value);
                        }}
                        value={values.purpose}
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
                      loading={addBeneficiaryRegisterMutation.isPending}
                      disabled={addBeneficiaryRegisterMutation.isPending}
                      type={'submit'}
                      text={'Save'}
                    />
                    {!addBeneficiaryRegisterMutation.isPending && (
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() => {
                          if (onCancel) onCancel();
                        }}
                      />
                    )}
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </>
  );
};

export default BeneficiaryRegisterForm;
