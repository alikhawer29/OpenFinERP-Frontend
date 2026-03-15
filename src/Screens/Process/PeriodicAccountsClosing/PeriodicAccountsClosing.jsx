import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import { showToast } from '../../../Components/Toast/Toast';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import {
  getPeriodAccountLocking,
  lockPeriodAccount,
} from '../../../Services/Process/PeriodAccountLocking';
import { showErrorToast } from '../../../Utils/Utils';

const PeriodicAccountsClosing = () => {
  usePageTitle('Periodic Account Locking');
  const navigate = useNavigate();
  const formikRef = useRef(null);
  const queryClient = useQueryClient();
  // Periodic Account Locking
  const {
    data: getPeriodicAccountLocking,
    isLoading,
    isPending,
    isFetching,
  } = useQuery({
    queryKey: ['periodic-account-locking'],
    queryFn: getPeriodAccountLocking,
  });

  const lockPeriodAccountMutation = useMutation({
    mutationFn: lockPeriodAccount,
    onSuccess: () => {
      showToast('Periodic account locked successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['periodic-account-locking'] });
    },
    onError: (error) => {
      showErrorToast(error.response.data.message);
    },
  });

  const handleSubmit = (values) => {
    lockPeriodAccountMutation.mutate({ locking_date: values.locking_date });
  };

  useEffect(() => {
    if (formikRef.current) {
      if (getPeriodicAccountLocking?.last_locking_date) {
        formikRef.current.setFieldValue(
          'last_locking_date',
          getPeriodicAccountLocking.last_locking_date
        );
      }
      if (getPeriodicAccountLocking?.locking_date) {
        formikRef.current.setFieldValue(
          'locking_date',
          getPeriodicAccountLocking.locking_date
        );
      }
    }
  }, [getPeriodicAccountLocking]);

  return (
    <>
      <div className="d-flex justify-content-between flex-wrap mb-4">
        <h2 className="screen-title mb-0">Periodic Account Locking</h2>
        <CustomButton
          text={'Unlock Accounting Period Request'}
          onClick={() => {
            navigate('unlock-request');
          }}
          disabled={getPeriodicAccountLocking?.last_locking_date !== null ? false : true}
        />
      </div>
      <div className="d-card py-45 mb-45">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
              innerRef={formikRef}
              initialValues={{
                last_locking_date: '',
                locking_date: '',
              }}
              //   validationSchema={periodicAccountsClosingValidationSchema}
              onSubmit={handleSubmit}
            >
              {({ values, errors, touched, handleChange, handleBlur }) => (
                <Form>
                  <div className="row mb-4">
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'last_locking_date'}
                        type={'date'}
                        label={'Last Locking Date'}
                        placeholder={'Enter Last Locking Date'}
                        value={values.last_locking_date}
                        disabled
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={
                          touched.last_locking_date && errors.last_locking_date
                        }
                        textBelowInput={
                          isLoading || isFetching ? 'Loading...' : ''
                        }
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'locking_date'}
                        type={'date'}
                        label={'Locking Date'}
                        placeholder={'Enter Locking Date'}
                        value={values.locking_date}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.locking_date && errors.locking_date}
                        textBelowInput={
                          isLoading || isFetching ? 'Loading...' : ''
                        }
                      />
                    </div>

                    <p className="muted-text text-danger mb-4 mt-2">
                      <b>Warning: </b>Processing this option will permanently lock your accounting books up to the selected year and month. This action is irreversible. Ensure you have a complete backup before proceeding. Consider the implications carefully before making this change.
                    </p>
                    <div className="d-flex gap-3 ms-auto mb-3 mb-md-0">
                      <CustomButton
                        loading={lockPeriodAccountMutation.isPending}
                        disabled={lockPeriodAccountMutation.isPending}
                        type={'submit'}
                        text={'Process'}
                      />
                    </div>
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

export default PeriodicAccountsClosing;
