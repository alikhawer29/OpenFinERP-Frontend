import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import {
  editTellerRegister,
  getCashAccount,
  getEmployees,
  viewTellerRegister,
} from '../../../Services/Masters/TellerRegister';
import { addTellerRegisterValidationSchema } from '../../../Utils/Validations/ValidationSchemas';
import Skeleton from 'react-loading-skeleton';
import { showErrorToast } from '../../../Utils/Utils';
import useAutoFocus from '../../../Hooks/useAutoFocus';

const EditTellerRegister = () => {
  usePageTitle('Teller Register - Edit');

  const { id } = useParams();
  const navigate = useNavigate();
  const firstInputFocusRef = useAutoFocus();

  const queryClient = useQueryClient();
  const {
    data: tellerRegister,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['tellerRegisterDetails', id],
    queryFn: () => viewTellerRegister(id),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const updateTellerRegisterMutation = useMutation({
    mutationFn: ({ id, data }) => editTellerRegister(id, data),
    onSuccess: () => {
      showToast('Teller Register Updated!', 'success');
      queryClient.invalidateQueries(['tellerRegisterDetails', id]);
      setTimeout(() => {
        navigate(-1);
      }, 300);
    },
    onError: (error) => {
      console.error('Error updating Teller Register', error);
      showErrorToast(error);
    },
  });

  const handleSubmit = (values) => {
    updateTellerRegisterMutation.mutate({ id, data: values });
  };

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
      return [{ label: 'Loading...', value: null }];
    }
    if (!isLoadingCashAccount && !IsErrorCashAccount) {
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

  if (isLoading || isLoadingCashAccount) {
    return (
      <div>
        <div className="d-flex flex-column gap-2 mb-4">
          <BackButton />
          <h2 className="screen-title m-0 d-inline">Teller Register</h2>
        </div>

        <div className="d-card ">
          <div className="row">
            <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
              <div className="row mb-4">
                {Array.from({ length: 2 }).map((_, i) => (
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
        <div className="d-flex align-items-center mb-4">
          <BackButton />
          <h2 className="screen-title m-0">Teller Register</h2>
        </div>

        <div className="d-card ">
          <div className="row mb-4">{error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex align-items-center mb-4">
        <BackButton />
        <h2 className="screen-title m-0">Teller Register</h2>
      </div>

      <div className="d-card ">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
              initialValues={{
                till_assigned_to_user:
                  tellerRegister?.till_assigned_to_user || '',
                cash_account: tellerRegister?.cash_account?.id || '',
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
                        value={values.till_assigned_to_user}
                        options={getEmployeesOptions()}
                        onChange={(v) => {
                          setFieldValue('till_assigned_to_user', v.value);
                        }}
                        placeholder={'Select Till Assigned To User'}
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
                        value={values.cash_account}
                        options={getCashAccountOptions()}
                        onChange={(v) => {
                          setFieldValue('cash_account', v.value);
                        }}
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
                      text={'Update'}
                      type={'submit'}
                      disabled={updateTellerRegisterMutation.isPending}
                      loading={updateTellerRegisterMutation.isPending}
                    />
                    <CustomButton
                      text={'Cancel'}
                      variant={'secondaryButton'}
                      type={'button'}
                      disabled={updateTellerRegisterMutation.isPending}
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

export default EditTellerRegister;
