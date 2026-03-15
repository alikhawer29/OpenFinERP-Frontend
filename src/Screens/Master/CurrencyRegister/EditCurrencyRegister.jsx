import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import React, { useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast';
import useAutoFocus from '../../../Hooks/useAutoFocus';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import {
  editCurrencyRegister,
  getCurrencyCodes,
  getCurrencyGroups,
  viewCurrencyRegister,
} from '../../../Services/Masters/CurrencyRegister';
import {
  currencyTypeOptions,
  rateTypeOptions,
} from '../../../Utils/Constants/SelectOptions';
import { isNullOrEmpty, showErrorToast } from '../../../Utils/Utils';
import { editCurrencyRegisterValidationSchema } from '../../../Utils/Validations/ValidationSchemas';

const EditCurrencyRegister = () => {
  usePageTitle('Currency Register - Edit');
  const { id } = useParams();
  const queryClient = useQueryClient();
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

  const editCurrencyRegisterMutation = useMutation({
    mutationFn: (formData) => editCurrencyRegister(id, formData),
    onSuccess: () => {
      showToast('Currency Updated!', 'success');
      queryClient.invalidateQueries('currencyRegisterListing');
      setTimeout(() => {
        navigate(-1);
      }, 300);
    },
    onError: (error) => {
      console.error('Error updating Currency', error);
      showErrorToast(error);
    },
  });

  const handleSubmit = (values) => {
    editCurrencyRegisterMutation.mutate(values);
  };

  // Queries and Mutations
  const {
    data: currencyRegister,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['currencyRegisterDetails', id],
    queryFn: () => viewCurrencyRegister(id),
    refetchOnWindowFocus: false,
    retry: 1,
  });

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

  if (isLoading) {
    return (
      <div>
        <div className="d-flex flex-column gap-2 mb-4">
          <BackButton />
          <h2 className="screen-title m-0">Currency Register</h2>
        </div>

        <div className="d-card ">
          <div className="row">
            <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
              <div className="row mb-4">
                {Array.from({ length: 6 }).map((_, i) => (
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
        <div className="d-flex flex-column gap-2 mb-4">
          <BackButton />
          <h2 className="screen-title m-0">Currency Register</h2>
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
      <div className="d-flex flex-column gap-2 mb-4">
        <BackButton />
        <h2 className="screen-title m-0">Currency Register</h2>
      </div>

      <div className="d-card ">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
              initialValues={{
                ...currencyRegister,
              }}
              validationSchema={editCurrencyRegisterValidationSchema}
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
                      {values?.is_custom ? (
                        <CustomInput
                          name={'currency_code'}
                          type={'text'}
                          required
                          ref={
                            values?.is_custom ? firstInputFocusRef : undefined
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
                            options={getCurrencyCodeOptions()}
                            ref={
                              !values?.is_custom
                                ? firstInputFocusRef
                                : undefined
                            }
                            onChange={(v) => {
                              setFieldValue('currency_code', v.value);
                              !isNullOrEmpty(allCurrencyCodes)
                                ? allCurrencyCodes.find(
                                    (x) => x.currency === v.value
                                  )?.currency_name || ''
                                : '';
                            }}
                            placeholder={'Select Currency Code'}
                            menuPlacement="auto"
                            value={values.currency_code}
                          />
                          <ErrorMessage
                            name="currency_code"
                            component="div"
                            className="input-error-message text-danger"
                          />
                        </>
                      )}

                      <div className="mb-2 checkbox-wrapper">
                        <label className="checkbox-container">
                          <input
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
                            checked={values.is_custom}
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
                        error={
                          touched.currency_name &&
                          (isNewCurrencyCode ? errors.currency_name : true)
                        }
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
                        value={values.group}
                        onChange={(v) => {
                          setFieldValue('group', v.value);
                        }}
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
                    ].map(({ label, key, disabled = false }) => (
                      <div key={key} className="col-4 mb-2 checkbox-wrapper">
                        <label className="checkbox-container align-items-start">
                          <input
                            disabled={disabled}
                            className={disabled ? 'checkbox-disabled' : ''}
                            type="checkbox"
                            name={key}
                            checked={values[key]} // Reflect the correct initial state from API
                            onChange={(e) => {
                              setFieldValue(key, e.target.checked ? 1 : 0);
                              if (key === 'special_rate_currency') {
                                setFieldValue('allow_online_rate', 0);
                              }
                              if (key === 'restrict_pair') {
                                setFieldValue('allow_auto_pairing', 0);
                              }
                            }}
                          />
                          <span className="custom-checkbox"></span>
                          {label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="d-flex gap-3 ms-auto mb-3 mb-md-0">
                    <CustomButton
                      loading={editCurrencyRegisterMutation.isPending}
                      disabled={editCurrencyRegisterMutation.isPending}
                      type={'submit'}
                      text={'Update'}
                    />
                    {!editCurrencyRegisterMutation.isPending && (
                      <CustomButton
                        type={'button'}
                        variant={'secondaryButton'}
                        text={'Cancel'}
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

export default EditCurrencyRegister;
