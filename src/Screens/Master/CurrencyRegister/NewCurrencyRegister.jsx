import { useMutation, useQuery } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast';
import useAutoFocus from '../../../Hooks/useAutoFocus';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import {
  addCurrencyRegister,
  getCurrencyCodes,
  getCurrencyGroups,
} from '../../../Services/Masters/CurrencyRegister';
import {
  currencyTypeOptions,
  rateTypeOptions,
} from '../../../Utils/Constants/SelectOptions';
import { isNullOrEmpty, showErrorToast } from '../../../Utils/Utils';
import { addCurrencyRegisterValidationSchema } from '../../../Utils/Validations/ValidationSchemas';

const NewCurrencyRegister = () => {
  usePageTitle('Currency Register - Create');
  const [isNewCurrencyCode, setIsNewCurrencyCode] = useState(false);
  const navigate = useNavigate();
  const firstInputFocusRef = useAutoFocus();

  // Get Currency Codes
  const {
    data: allCurrencyCodes,
    isLoading: isLoadingCurrencyCodes,
    isError: IsErrorCurrency,
    error: ErrorCurrency,
  } = useQuery({
    queryKey: ['currencyCodes'],
    queryFn: getCurrencyCodes,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Get Currency Groups
  const {
    data: allCurrencyGroups,
    isLoading: isLoadingCurrencyGroups,
    isError: IsErrorCurrencyGroups,
    error: ErrorCurrencyGroups,
  } = useQuery({
    queryKey: ['currencyGroups'],
    queryFn: getCurrencyGroups,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const addCurrencyRegisterMutation = useMutation({
    mutationFn: addCurrencyRegister,
    onSuccess: () => {
      showToast('Currency Added!', 'success');
      setTimeout(() => {
        navigate(-1);
      }, 300);
    },
    onError: (error) => {
      console.error('Error adding currency', error);
      showErrorToast(error);
    },
  });

  const handleSubmit = (values) => {
    addCurrencyRegisterMutation.mutate(values);
  };

  // Function to fetch Classification Types and show loading/error if api fails
  const getCurrencyCodeOptions = () => {
    if (!isLoadingCurrencyCodes && !IsErrorCurrency) {
      return allCurrencyCodes?.map((x) => ({
        value: x.currency,
        label: x.currency,
      }));
    } else {
      if (IsErrorCurrency) {
        console.error('Unable to fetch Currency Codes', ErrorCurrency);
        return [{ label: 'Unable to fetch Currency codes', value: null }];
      } else {
        return [{ label: 'Loading...', value: null, isDisabled: true }];
      }
    }
  };

  // Function to fetch Currency Group and show loading/error if api fails
  const getCurrencyGroupOptions = () => {
    if (!isLoadingCurrencyGroups && !IsErrorCurrencyGroups) {
      return allCurrencyGroups?.map((x) => ({
        value: x.currency_code,
        label: x.currency_code,
      }));
    } else {
      if (IsErrorCurrencyGroups) {
        console.error('Unable to fetch Currency Group', ErrorCurrencyGroups);
        return [{ label: 'Unable to fetch Currency Group', value: null }];
      } else {
        return [{ label: 'Loading...', value: null, isDisabled: true }];
      }
    }
  };

  return (
    <div>
      <div className="d-flex flex-column gap-2 mb-4">
        <BackButton />
        <h2 className="screen-title m-0">Currency Register</h2>
      </div>

      <div className="d-card ">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
              initialValues={{
                is_custom: 0,
                currency_code: '',
                currency_name: '',
                rate_type: '',
                currency_type: '',
                rate_variation: '',
                group: '',
                allow_online_rate: 0,
                allow_auto_pairing: 0,
                allow_second_preference: 0,
                special_rate_currency: 0,
                restrict_pair: 0,
              }}
              // validateOnChange={false}
              validationSchema={addCurrencyRegisterValidationSchema}
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
                      {isNewCurrencyCode ? (
                        <CustomInput
                          name={'currency_code'}
                          type={'text'}
                          required
                          ref={
                            isNewCurrencyCode ? firstInputFocusRef : undefined
                          }
                          label={'Currency Code'}
                          placeholder={'Enter Currency Code'}
                          value={values.currency_code}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.currency_code && errors.currency_code}
                        />
                      ) : (
                        <>
                          <SearchableSelect
                            label={'Currency Code'}
                            name="currency_code"
                            ref={
                              !isNewCurrencyCode
                                ? firstInputFocusRef
                                : undefined
                            }
                            options={getCurrencyCodeOptions()}
                            onChange={(v) => {
                              setFieldValue('currency_code', v.value);
                              setFieldValue(
                                'currency_name',
                                !isNullOrEmpty(allCurrencyCodes)
                                  ? allCurrencyCodes.find(
                                      (x) => x.currency === v.value
                                    )?.currency_name || ''
                                  : ''
                              );
                            }}
                            value={values.currency_code}
                            placeholder={'Select Currency Code'}
                            menuPlacement="auto"
                            required
                          />
                          <ErrorMessage
                            name="currency_code"
                            component="div"
                            className="input-error-message text-danger"
                          />
                        </>
                      )}

                      <div
                        className={`mb-2 checkbox-wrapper ${
                          values.is_custom ? '' : 'mt-3'
                        }`}
                      >
                        <label className="checkbox-container">
                          <input
                            defaultChecked={false}
                            onChange={() => {
                              setIsNewCurrencyCode(!isNewCurrencyCode);
                              setFieldValue(
                                'is_custom',
                                !isNewCurrencyCode ? 1 : 0
                              );
                              setFieldValue('currency_code', '');
                              setFieldValue('currency_name', '');
                            }}
                            type="checkbox"
                            name={'isNewCurrencyCode'}
                            value={isNewCurrencyCode}
                          />
                          <span className="custom-checkbox"></span>
                          Add New Code
                        </label>
                      </div>
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'currency_name'}
                        type={'text'}
                        required
                        label={'Currency Name'}
                        placeholder={'Enter Currency Name'}
                        value={
                          values.is_custom
                            ? values.currency_name
                            : !isNullOrEmpty(allCurrencyCodes)
                            ? allCurrencyCodes.find(
                                (x) => x.currency == values.currency_code
                              )?.currency_name || ''
                            : ''
                        }
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.currency_name && errors.currency_name}
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-45">
                      <SearchableSelect
                        label={'Rate Type'}
                        name="rate_type"
                        options={rateTypeOptions}
                        value={values.rate_type}
                        onChange={(v) => {
                          setFieldValue('rate_type', v.value);
                        }}
                        required
                        placeholder={'Select Rate Type'}
                        menuPlacement="auto"
                      />
                      <ErrorMessage
                        name="rate_type"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-45">
                      <SearchableSelect
                        label={'Currency Type'}
                        name="currency_type"
                        options={currencyTypeOptions}
                        value={values.currency_type}
                        onChange={(v) => {
                          setFieldValue('currency_type', v.value);
                        }}
                        required
                        placeholder={'Select Currency Type'}
                        menuPlacement="auto"
                      />
                      <ErrorMessage
                        name="currency_type"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'rate_variation'}
                        type={'number'}
                        required
                        label={'Rate Variation %'}
                        placeholder={'Enter Rate Variation %'}
                        value={values.rate_variation}
                        min={0}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.rate_variation && errors.rate_variation}
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-45">
                      <SearchableSelect
                        label={'Group'}
                        name="group"
                        options={getCurrencyGroupOptions()}
                        onChange={(v) => {
                          setFieldValue('group', v.value);
                        }}
                        value={values.group}
                        placeholder={'Select Group'}
                        menuPlacement="auto"
                      />
                      <ErrorMessage
                        name="group"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
                    {[
                      {
                        label: 'Allow Online Rate',
                        key: 'allow_online_rate',
                        disabled: !!values.special_rate_currency,
                      },
                      {
                        label: 'Allow Auto-Pairing',
                        key: 'allow_auto_pairing',
                        disabled: !!values.restrict_pair,
                      },
                      {
                        label: 'Allow Second Preference',
                        key: 'allow_second_preference',
                      },
                      {
                        label: 'Special Rate Currency',
                        key: 'special_rate_currency',
                      },
                      { label: 'Restrict Pair', key: 'restrict_pair' },
                    ].map((x) => (
                      <div key={x.key} className="col-4 mb-2 checkbox-wrapper">
                        <label className="checkbox-container align-items-start">
                          <input
                            disabled={x.disabled}
                            className={x.disabled ? 'checkbox-disabled' : ''}
                            onChange={(v) => {
                              setFieldValue(x.key, v.target.checked ? 1 : 0);
                              if (x.key === 'special_rate_currency') {
                                setFieldValue('allow_online_rate', 0);
                              }
                              if (x.key === 'restrict_pair') {
                                setFieldValue('allow_auto_pairing', 0);
                              }
                            }}
                            checked={values[x.key]}
                            type="checkbox"
                            name={x.key}
                          />
                          <span className="custom-checkbox"></span>
                          {x.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="d-flex gap-3 ms-auto mb-3 mb-md-0">
                    <CustomButton
                      loading={addCurrencyRegisterMutation.isPending}
                      disabled={addCurrencyRegisterMutation.isPending}
                      type={'submit'}
                      text={'Save'}
                    />
                    {!addCurrencyRegisterMutation.isPending && (
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() => navigate(-1)}
                      />
                    )}
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewCurrencyRegister;
