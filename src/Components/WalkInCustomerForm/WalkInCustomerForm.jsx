import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, FastField, Form, Formik } from 'formik';
import React, { useState } from 'react';
import PhoneInput, { parsePhoneNumber } from 'react-phone-number-input';
import { useNationalities, useStates } from '../../Hooks/countriesAndStates';
import useAutoFocus from '../../Hooks/useAutoFocus';
import { getPartyLedgerIDTypes } from '../../Services/Masters/PartyLedger';
import { addWalkInCustomer } from '../../Services/Masters/WalkInCustomer';
import { statusOptions } from '../../Utils/Constants/SelectOptions';
import { showErrorToast } from '../../Utils/Utils';
import { addWalkInCustomerValidationSchema } from '../../Utils/Validations/ValidationSchemas';
import CustomButton from '../CustomButton';
import CustomInput from '../CustomInput';
import SearchableSelect from '../SearchableSelect/SearchableSelect';
import { showToast } from '../Toast/Toast';

const WalkInCustomerForm = ({ onSuccess, onCancel, inPopup = false }) => {
  const queryClient = useQueryClient();
  const { data: nationalities, isLoading: loadingNationalities } =
    useNationalities();
  const [selectedVATCountry, setSelectedVATCountry] = useState(null);
  const firstInputFocusRef = useAutoFocus();

  // Fetch states based on the selected VAT Country
  const { data: states, isLoading: loadingStates } =
    useStates(selectedVATCountry);

  const addWalkInCustomerMutation = useMutation({
    mutationFn: addWalkInCustomer,
    onSuccess: (data) => {
      showToast('Walk-in Customer Added!', 'success');
      queryClient.invalidateQueries(['accounts', 'walkin']);
      if (onSuccess) onSuccess(data?.detail);
    },
    onError: (error) => {
      console.error('Error adding Walk-in Customer', error);
      showErrorToast(error);
    },
  });

  const handleSubmit = (values) => {
    let parsedMobileNumber, parsedTelephoneNumber, parsedFaxNumber;
    if (values.mobile_number?.length > 3) {
      parsedMobileNumber = parsePhoneNumber(values.mobile_number, 'US');
    }
    if (values.telephone_number?.length > 3) {
      parsedTelephoneNumber = parsePhoneNumber(values.telephone_number, 'US');
    }
    if (values.fax_number?.length > 3) {
      parsedFaxNumber = parsePhoneNumber(values.fax_number, 'US');
    }

    let formData = {
      ...values,
      ...(parsedMobileNumber && {
        mobile_number: parsedMobileNumber.nationalNumber,
        mobile_country_code: parsedMobileNumber
          ? `+${parsedMobileNumber.countryCallingCode}`
          : '',
      }),

      ...(parsedTelephoneNumber && {
        telephone_number: parsedTelephoneNumber.nationalNumber,
        telephone_country_code: parsedTelephoneNumber
          ? `+${parsedTelephoneNumber.countryCallingCode}`
          : '',
      }),

      ...(parsedFaxNumber && {
        fax_number: parsedFaxNumber.nationalNumber,
        fax_country_code: parsedFaxNumber
          ? `+${parsedFaxNumber.countryCallingCode}`
          : '',
      }),
    };

    addWalkInCustomerMutation.mutate(formData);
  };

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

  return (
    <>
      <div className={`${inPopup ? 'px-4 pt-2' : 'd-card'}`}>
        {inPopup ? (
          <h2 className="screen-title-body">Walk-in Customer</h2>
        ) : null}
        <div className="row">
          <div
            className={`${inPopup ? 'col-12' : 'col-12 col-lg-10 col-xl-9 col-xxl-7'
              }`}
          >
            <Formik
              initialValues={{
                customer_name: '',
                company: '',
                address: '',
                city: '',
                designation: '',
                mobile_number: '',
                mobile_country_code: '',
                telephone_number: '',
                telephone_country_code: '',
                fax_number: '',
                fax_country_code: '',
                email: '',
                id_type: '',
                id_number: '',
                issue_date: '',
                expiry_date: '',
                issue_place: '',
                nationality: '',
                status: '',
                vat_trn: '',
                vat_country: '',
                vat_state: '',
                vat_exempted: 0,
              }}
              // validateOnChange={false}
              validationSchema={addWalkInCustomerValidationSchema}
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
                        name={'customer_name'}
                        type={'text'}
                        required
                        ref={firstInputFocusRef}
                        label={'Customer Name'}
                        placeholder={'Enter Customer Name'}
                        value={values.customer_name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.customer_name && errors.customer_name}
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'company'}
                        type={'text'}
                        required
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
                      <CustomInput
                        name={'city'}
                        type={'text'}
                        required
                        label={'City'}
                        placeholder={'Enter City'}
                        value={values.city}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.city && errors.city}
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'designation'}
                        type={'text'}
                        label={'Designation'}
                        placeholder={'Enter Designation'}
                        value={values.designation}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.designation && errors.designation}
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-45 inputWrapper">
                      <label className="mainLabel">
                        Mobile Number
                        <span className="text-danger">*</span>
                      </label>
                      <FastField name="mobile_number">
                        {({ field }) => (
                          <PhoneInput
                            {...field}
                            international
                            withCountryCallingCode
                            placeholder="Enter phone number"
                            className="mainInput"
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
                      />{' '}
                    </div>
                    <div className="col-12 col-sm-6 mb-45 inputWrapper">
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
                      />{' '}
                    </div>
                    <div className="col-12 col-sm-6 mb-45 inputWrapper">
                      <label className="mainLabel">Fax Number</label>
                      <FastField name="fax_number">
                        {({ field }) => (
                          <PhoneInput
                            {...field}
                            international
                            withCountryCallingCode
                            placeholder="Enter fax number"
                            className="mainInput"
                            defaultCountry="US"
                            onChange={(value) =>
                              setFieldValue('fax_number', value)
                            }
                            onBlur={() =>
                              handleBlur({ target: { name: 'fax_number' } })
                            }
                          />
                        )}
                      </FastField>
                      <ErrorMessage
                        name="fax_number"
                        component="div"
                        className="input-error-message text-danger"
                      />{' '}
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
                      <SearchableSelect
                        label={'ID Type'}
                        name="id_type"
                        options={getIDTypesOptions()}
                        required
                        value={values.id_type}
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
                        name={'expiry_date'}
                        type={'date'}
                        required
                        label={'Expiry Date'}
                        placeholder={'Select Expiry Date'}
                        value={values.expiry_date}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.expiry_date && errors.expiry_date}
                      />
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
                        required
                        onChange={(v) => {
                          setFieldValue('nationality', v.value);
                        }}
                        placeholder={'Select nationality'}
                      />
                      <ErrorMessage
                        name="nationality"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <SearchableSelect
                        label={'Status'}
                        name="status"
                        options={statusOptions}
                        required
                        value={values.status}
                        onChange={(v) => {
                          setFieldValue('status', v.value);
                        }}
                        placeholder={'Select status'}
                      />
                      <ErrorMessage
                        name="status"
                        component="div"
                        className="input-error-message text-danger"
                      />{' '}
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'vat_trn'}
                        type={'text'}
                        label={'VAT TRN'}
                        placeholder={'Enter VAT TRN'}
                        value={values.vat_trn}
                        onChange={handleChange}
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
                        value={values.vat_country}
                        onChange={(v) => {
                          setFieldValue('vat_country', v.value);
                          setSelectedVATCountry(v.value);
                        }}
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
                        value={values.vat_state}
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
                        }}
                        placeholder={'Select VAT State'}
                      />
                      <ErrorMessage
                        name="vat_state"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
                  </div>
                  <div className="d-flex gap-3 ms-auto mb-3 mb-md-0">
                    <CustomButton
                      loading={addWalkInCustomerMutation.isPending}
                      disabled={addWalkInCustomerMutation.isPending}
                      type={'submit'}
                      text={'Save'}
                    />
                    {!addWalkInCustomerMutation.isPending && (
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() => {
                          if (onCancel) {
                            onCancel();
                          }
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

export default WalkInCustomerForm;
