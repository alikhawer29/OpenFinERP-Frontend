import { useMutation, useQuery } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import React, { useEffect, useRef, useState } from 'react';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import UploadAndDisplayFiles from '../../../Components/UploadAndDisplayFiles/UploadAndDisplayFiles';
import { unlockAccountingPeriodRequest , getPeriodAccountLocking } from '../../../Services/Process/PeriodAccountLocking';
import useUserStore from '../../../Stores/UserStore';
import { capitilize, showErrorToast } from '../../../Utils/Utils';
import { unlockAccountingPeriodRequestValidationSchema } from '../../../Utils/Validations/ValidationSchemas';
import { showToast } from '../../../Components/Toast/Toast';
import { useNavigate } from 'react-router-dom';

const UnlockAccountingPeriodRequest = () => {
  const { user, role } = useUserStore();
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const [addedAttachments, setAddedAttachments] = useState(null);
  const navigate = useNavigate();
  const formikRef = useRef();

  const {
    data: getPeriodicAccountLocking,
  } = useQuery({
    queryKey: ['periodic-account-locking'],
    queryFn: getPeriodAccountLocking,
  });

  const unlockAccountingPeriodRequestMutation = useMutation({
    mutationFn: unlockAccountingPeriodRequest,
    onSuccess: () => {
      showToast('Unlock period account request successful', 'success');
      navigate('/process/periodic-accounts-closing');
    },
    onError: (error) => {
      console.error('Error making unlock period account request', error);
      showErrorToast(error);
    },
  });

  const handleSubmit = (values) => {
    let payload = {
      ...values,
      ...addedAttachments,
    };

    unlockAccountingPeriodRequestMutation.mutate(payload);
  };
  
  return (
    <>
      <div className="d-flex align-items-start mb-4 justify-content-between flex-wrap">
        <div className="d-flex flex-column gap-2">
          <BackButton />
          <h2 className="screen-title m-0 d-inline">
            Unlock Accounting Period Request
          </h2>
        </div>
      </div>
      <div className="d-card">
        <h4 className="details-page-header mb-4">Requestor Information</h4>
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
             innerRef={formikRef}
             enableReinitialize
              initialValues={{
                start_date: '',
                end_date: getPeriodicAccountLocking?.last_locking_date,
                reason: '',
              }}
              validationSchema={unlockAccountingPeriodRequestValidationSchema}
              onSubmit={handleSubmit}
            >
              {({ values, errors, touched, handleChange, handleBlur }) => (
                <Form>
                  <div className="row mb-4">
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'user_id'}
                        type={'text'}
                        label={'User ID'}
                        value={user?.user_id}
                        disabled
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'email_address'}
                        type={'text'}
                        label={'Email Address'}
                        value={user?.email}
                        disabled
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'role'}
                        type={'text'}
                        label={'Role'}
                        value={capitilize(role)}
                        disabled
                      />
                    </div>
                    <h4 className="details-page-header mt-45 mb-4">
                      Accounting Period to Unlock
                    </h4>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'start_date'}
                        type={'date'}
                        required
                        label={'Start Date'}
                        placeholder={'Enter Start Date'}
                        value={values.start_date}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.start_date && errors.start_date}
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'end_date'}
                        type={'date'}
                        required
                        label={'End Date'}
                        placeholder={'Enter End Date'}
                        value={values.end_date}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.end_date && errors.end_date}
                        disabled={true}
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <CustomInput
                        name={'reason'}
                        type={'textarea'}
                        rows={1}
                        required
                        label={'Unlocking Reason'}
                        placeholder={'Enter Unlocking Reason'}
                        value={values.reason}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.reason && errors.reason}
                      />
                    </div>
                    <h4 className="details-page-header  mt-45 mb-4">
                      Supporting Documents
                    </h4>
                    <div className="col-12 mb-5">
                      <UploadAndDisplayFiles
                        numberOfFiles={5}
                        onChange={(files) => {
                          const formData = files.reduce((acc, file, index) => {
                            acc[`files[${index}]`] = file;
                            return acc;
                          }, {});
                          setAddedAttachments(formData);
                        }}
                        label={'Supporting Documents'}
                        errorFromParent={touched.files && errors.files}
                      />
                    </div>
                    <div className="d-inline-flex align-items-center mb-5">
                      <div className="checkbox-wrapper">
                        <label className="checkbox-container">
                          <input
                            type="checkbox"
                            defaultChecked={false}
                            onChange={(e) => {
                              setHasAgreedToTerms(e.target.checked);
                            }}
                            name="terms&conditions"
                          />
                          <span className="custom-checkbox"></span>I agree to
                          the terms & conditions
                        </label>
                      </div>
                    </div>
                    <div className="d-flex gap-3 ms-auto mb-3 mb-md-0">
                      <CustomButton
                        loading={
                          unlockAccountingPeriodRequestMutation.isPending
                        }
                        disabled={
                          !hasAgreedToTerms ||
                          unlockAccountingPeriodRequestMutation.isPending
                        }
                        type={'submit'}
                        text={'Submit'}
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

export default UnlockAccountingPeriodRequest;
