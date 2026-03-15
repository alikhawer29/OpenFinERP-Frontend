import { useMutation, useQuery } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import {
  addTellerRegister,
  getCashAccount,
  getEmployees,
} from '../../../Services/Masters/TellerRegister';
import { addTellerRegisterValidationSchema } from '../../../Utils/Validations/ValidationSchemas';
import { showErrorToast } from '../../../Utils/Utils';
import useAutoFocus from '../../../Hooks/useAutoFocus';

const NewTellerRegister = () => {
  usePageTitle('Teller Register - Create');
  const firstInputFocusRef = useAutoFocus();

  const navigate = useNavigate();

  const addTellerRegisterMutation = useMutation({
    mutationFn: addTellerRegister,
    onSuccess: () => {
      showToast('Teller Register Added!', 'success');
      setTimeout(() => {
        navigate(-1);
      }, 300);
    },
    onError: (error) => {
      console.error('Error adding Walk-in Customer', error);
      showErrorToast(error);
    },
  });

  const handleSubmit = (values) => {
    addTellerRegisterMutation.mutate(values);
  };

  // Get Employees
  const {
    data: allEmployees,
    isLoading: isLoadingEmployees,
    isError: IsErrorEmployees,
    error: ErrorEmployees,
  } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Function to fetch Employees and show loading/error if api fails
  const getEmployeesOptions = () => {
    if (!isLoadingEmployees && !IsErrorEmployees) {
      return allEmployees?.map((x) => ({
        value: x.id,
        label: x.user_name,
      }));
    } else {
      if (IsErrorEmployees) {
        console.error('Unable to fetch Employees', ErrorEmployees);
        return [{ label: 'Unable to fetch Employees', value: null }];
      } else {
        return [{ label: 'Loading...', value: null, isDisabled: true }];
      }
    }
  };

  // Get Cash Accounts
  const {
    data: allCashAccount,
    isLoading: isLoadingCashAccount,
    isError: IsErrorCashAccount,
    error: ErrorCashAccount,
  } = useQuery({
    queryKey: ['cashAccount'],
    queryFn: getCashAccount,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Function to fetch CashAccount and show loading/error if api fails
  const getCashAccountOptions = () => {
    if (isLoadingCashAccount) {
      return [
        {
          label: 'Loading...',
          value: null,
          isDisabled: true,
        },
      ];
    } else if (!isLoadingCashAccount && !IsErrorCashAccount) {
      return allCashAccount?.map((x) => ({
        value: x.id,
        label: x.account_name,
      }));
    } else {
      if (IsErrorCashAccount) {
        console.error('Unable to fetch CashAccount', ErrorCashAccount);
        return [{ label: 'Unable to fetch CashAccount', value: null }];
      } else {
        return [{ label: 'Loading...', value: null, isDisabled: true }];
      }
    }
  };

  return (
    <div>
      <div className="d-flex flex-column gap-2 mb-4">
        <BackButton />
        <h2 className="screen-title m-0 d-inline">Teller Register</h2>
      </div>

      <div className="d-card ">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
              initialValues={{
                till_assigned_to_user: '',
                cash_account: '',
              }}
              validationSchema={addTellerRegisterValidationSchema}
              onSubmit={handleSubmit}
            >
              {({ values, setFieldValue }) => (
                <Form>
                  <div className="row mb-4">
                    <div className="col-12 col-sm-6 mb-4">
                      <SearchableSelect
                        label={'Till Assigned To User'}
                        name="till_assigned_to_user"
                        ref={firstInputFocusRef}
                        options={getEmployeesOptions()}
                        onChange={(v) => {
                          setFieldValue('till_assigned_to_user', v.value);
                        }}
                        value={values.till_assigned_to_user}
                        placeholder={'Select Till Assigned To User'}
                        menuPlacement="auto"
                      />
                      <ErrorMessage
                        name="till_assigned_to_user"
                        component="div"
                        className="input-error-message text-danger"
                      />

                      <ErrorMessage
                        name="till_assigned_to_user"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-4">
                      <SearchableSelect
                        label={'Cash Account'}
                        name="cash_account"
                        options={getCashAccountOptions()}
                        onChange={(v) => {
                          setFieldValue('cash_account', v.value);
                        }}
                        value={values.cash_account}
                        placeholder={'Select Cash Account'}
                      />
                      <ErrorMessage
                        name="cash_account"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
                  </div>
                  <div className="d-flex gap-3">
                    <CustomButton
                      text={'Save'}
                      type={'submit'}
                      disabled={addTellerRegisterMutation.isPending}
                      loading={addTellerRegisterMutation.isPending}
                    />
                    <CustomButton
                      text={'Cancel'}
                      variant={'secondaryButton'}
                      type={'button'}
                      disabled={addTellerRegisterMutation.isPending}
                      onClick={() => navigate(-1)}
                    />
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

export default NewTellerRegister;
