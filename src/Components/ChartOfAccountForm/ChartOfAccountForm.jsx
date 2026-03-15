import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import React, { useState } from 'react';
import {
  addChartOfAccount,
  getLevel1and2Dropdowns,
  getLevel3and4Dropdowns,
} from '../../Services/Masters/ChartOfAccount';
import { convertCOAAccountsToDropdownOptions } from '../../Utils/Helpers';
import { showErrorToast } from '../../Utils/Utils';
import { addCOAValidationSchema } from '../../Utils/Validations/ValidationSchemas';
import CustomButton from '../CustomButton';
import CustomInput from '../CustomInput';
import SearchableSelect from '../SearchableSelect/SearchableSelect';
import { showToast } from '../Toast/Toast';

const ChartOfAccountForm = ({ inPopup, onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const [selectedAccountType, setSelectedAccountType] = useState(null);

  //  Get Account Types
  const {
    data: accountTypesData,
    isLoading: isLoadingAccountTypes,
    isError: isErrorAccountTypes,
    error: errorAccountTypes,
  } = useQuery({
    queryKey: ['chartOfAccountAccountTypes'],
    queryFn: getLevel1and2Dropdowns,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  //  Get Parent Account Types
  const {
    data: parentAccountTypesData,
    isLoading: isLoadingParentAccountTypes,
    isError: isErrorParentAccountTypes,
    error: errorParentAccountTypes,
  } = useQuery({
    queryKey: ['chartOfAccountParentAccountTypes', selectedAccountType],
    queryFn: () => getLevel3and4Dropdowns(selectedAccountType),
    enabled: !!selectedAccountType,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const addChartOfAccountMutation = useMutation({
    mutationFn: addChartOfAccount,
    onSuccess: (data) => {
      showToast('Account Added!', 'success');
      queryClient.invalidateQueries(['accounts', 'general']);
      if (onSuccess) onSuccess(data.detail);
    },
    onError: (error) => {
      console.error('Error adding account', error);
      showErrorToast(error);
    },
  });

  // Handle Form Submit
  const handleAccountSubmit = (values) => {
    addChartOfAccountMutation.mutate(values);
  };

  const getAccountTypeOptions = () => {
    if (!isLoadingAccountTypes && !isErrorAccountTypes) {
      return convertCOAAccountsToDropdownOptions(accountTypesData);
    } else {
      if (isErrorAccountTypes) {
        console.error('Unable to fetch Account Options', errorAccountTypes);
        return [{ label: 'Unable to fetch Account Options', value: null }];
      } else {
        return [{ label: 'Loading...', value: null, isDisabled: true }];
      }
    }
  };
  const getParentAccountTypeOptions = () => {
    if (!selectedAccountType)
      return [
        {
          label: 'Select Account Type',
          value: null,
          isDisabled: true,
        },
      ];
    if (!isLoadingParentAccountTypes && !isErrorParentAccountTypes) {
      return convertCOAAccountsToDropdownOptions(parentAccountTypesData);
    } else {
      if (isErrorParentAccountTypes) {
        console.error(
          'Unable to fetch Account Options',
          errorParentAccountTypes
        );
        return [{ label: 'Unable to fetch Account Options', value: null }];
      } else {
        return [{ label: 'Loading...', value: null, isDisabled: true }];
      }
    }
  };

  return (
    <div className={`${inPopup ? 'px-4 pt-3' : 'd-card'}`}>
      {inPopup ? <h2 className="screen-title-body">Chart Of Account</h2> : null}
      <div className="row">
        <div
          className={`${
            inPopup ? 'col-12' : 'col-12 col-lg-10 col-xl-9 col-xxl-7'
          }`}
        >
          <Formik
            initialValues={{
              account_type: '',
              account_name: '',
              parent_account_id: '',
              is_sub_account: 0 || '',
              description: '',
            }}
            validationSchema={addCOAValidationSchema}
            onSubmit={(values) => {
              handleAccountSubmit(values);
            }}
          >
            {({
              values,
              touched,
              errors,
              handleChange,
              handleBlur,
              setFieldValue,
            }) => (
              <Form>
                <div className="row mb-4">
                  <div className="col-12 col-lg-6 mb-3">
                    <SearchableSelect
                      label={'Account Type'}
                      name="account_type"
                      required
                      options={getAccountTypeOptions()}
                      onChange={(v) => {
                        setFieldValue('account_type', v.value);
                        setSelectedAccountType(v.value);
                        setFieldValue('is_sub_account', 0);
                      }}
                      value={values.account_type}
                      placeholder={'Select Account Type'}
                    />
                    <ErrorMessage
                      name="account_type"
                      component="div"
                      className="input-error-message text-danger"
                    />
                  </div>
                  <div className="col-12 col-lg-6 mb-3">
                    <CustomInput
                      name={'account_name'}
                      label={'Account Name'}
                      type={'text'}
                      required
                      value={values.account_name}
                      placeholder={'Enter Account Name'}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.account_name && errors.account_name}
                    />
                  </div>
                  <div className="col-12 mb-4">
                    <div className="checkbox-wrapper">
                      <label className="checkbox-container">
                        <input
                          onChange={(v) =>
                            setFieldValue(
                              'is_sub_account',
                              v.target.checked ? 1 : 0
                            )
                          }
                          type="checkbox"
                          name="is_sub_account"
                          checked={values.is_sub_account}
                        />
                        <span className="custom-checkbox"></span>
                        Make this a sub-account
                      </label>
                    </div>
                  </div>
                  {values.is_sub_account ? (
                    <div className="col-12 mb-4">
                      <SearchableSelect
                        label={'Parent Account*'}
                        name="parent_account_id"
                        options={getParentAccountTypeOptions()}
                        onChange={(v) => {
                          setFieldValue('parent_account_id', v.value);
                        }}
                        value={values.parent_account_id}
                        placeholder={'Select Parent Account'}
                      />
                      <ErrorMessage
                        name="parent_account_id"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
                  ) : null}
                  <div className="col-12">
                    <CustomInput
                      name={'description'}
                      label={'Description'}
                      type={'textarea'}
                      rows={1}
                      required
                      placeholder={'Enter Description'}
                      value={values.description}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.description && errors.description}
                    />
                  </div>
                </div>
                <div className="d-flex gap-3">
                  <CustomButton
                    text={'Save'}
                    type={'submit'}
                    disabled={addChartOfAccountMutation.isPending}
                    loading={addChartOfAccountMutation.isPending}
                  />
                  <CustomButton
                    text={'Cancel'}
                    variant={'secondaryButton'}
                    type={'button'}
                    disabled={addChartOfAccountMutation.isPending}
                    onClick={() => {
                      if (onCancel) onCancel();
                    }}
                  />
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default ChartOfAccountForm;
