import { useMutation, useQuery } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import {
  editCommissionMaster,
  viewCommissionMaster,
} from '../../../Services/Masters/CommissionMaster';
import { getAccountOptions, showErrorToast } from '../../../Utils/Utils';
import { addCommissionValidationSchema } from '../../../Utils/Validations/ValidationSchemas';
import Skeleton from 'react-loading-skeleton';
import useAutoFocus from '../../../Hooks/useAutoFocus';

const EditCommissionMaster = () => {
  const { id } = useParams();
  usePageTitle('Commission Register - Edit');

  const navigate = useNavigate();
  const firstInputFocusRef = useAutoFocus();

  // Queries and Mutations
  const {
    data: commissionMaster,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['commissionMasterDetails', id],
    queryFn: () => viewCommissionMaster(id),
    refetchOnWindowFocus: false,
    retry: 1,
    gcTime: 0,
  });

  const editCommissionMasterMutation = useMutation({
    mutationFn: (formData) => editCommissionMaster(id, formData),
    onSuccess: () => {
      showToast('Commission Register Updated!', 'success');
      setTimeout(() => {
        navigate(-1);
      }, 300);
    },
    onError: (error) => {
      console.error('Error updated Commission Register', error);
      showErrorToast(error);
    },
  });

  const handleSubmit = (values) => {
    editCommissionMasterMutation.mutate(values);
  };
  if (isLoading) {
    return (
      <div>
        <div className="d-flex flex-column gap-2 mb-4">
          <BackButton />
          <h2 className="screen-title m-0 d-inline">Commission Register</h2>
        </div>

        <div className="d-card ">
          <div className="row">
            <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
              <div className="row mb-4">
                {Array.from({ length: 11 }).map((_, i) => (
                  <div
                    key={i}
                    className="col-12 col-sm-6 mb-3  align-items-center"
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
          <h2 className="screen-title m-0 d-inline">Commission Register</h2>
        </div>

        <div className="d-card ">
          <div className="row">
            <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
              <div className="row mb-3">Unable to fetch</div>
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
        <h2 className="screen-title m-0 d-inline">Commission Register</h2>
      </div>

      <div className="d-card ">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
              initialValues={commissionMaster}
              validationSchema={addCommissionValidationSchema}
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
                    {/* Account Type */}
                    <div className="col-12 col-sm-6 mb-45">
                      <SearchableSelect
                        label={'Account Type'}
                        name="account_type"
                        required
                        ref={firstInputFocusRef}
                        options={[
                          {
                            label: 'Party',
                            value: 'party',
                          },
                          {
                            label: 'General',
                            value: 'general',
                          },
                          {
                            label: 'Walk-In Customer',
                            value: 'walkin',
                          },
                        ]}
                        value={values.account_type}
                        onChange={(v) => {
                          setFieldValue('account_type', v.value);
                        }}
                        placeholder={'Select Account Type'}
                      />
                      <ErrorMessage
                        name="account_type"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
                    {/* Account */}
                    <div className="col-12 col-sm-6 mb-45">
                      <SearchableSelect
                        label={'Account'}
                        name="account"
                        options={getAccountOptions(values.account_type)}
                        required
                        value={values.account}
                        onChange={(v) => {
                          setFieldValue('account', v.value);
                        }}
                        placeholder={'Select Account'}
                      />
                      <ErrorMessage
                        name="account"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
                    {/* Commission Type */}
                    <div className="col-12 col-sm-6 mb-45">
                      <SearchableSelect
                        label={'Commission Type'}
                        name="commission_type"
                        options={[
                          {
                            label: 'Income',
                            value: 'income',
                          },
                          {
                            label: 'Expense',
                            value: 'expense',
                          },
                        ]}
                        required
                        value={values.commission_type}
                        onChange={(v) => {
                          setFieldValue('commission_type', v.value);
                        }}
                        placeholder={'Select Commission Type'}
                      />
                      <ErrorMessage
                        name="commission_type"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
                    {/* receipt_percentage */}
                    <div className="col-12 col-sm-6 mb-3 mt-auto">
                      <CustomInput
                        name={'receipt_percentage'}
                        type={'text'}
                        required
                        label={'Receipt (RV) %'}
                        placeholder={'Enter Receipt (RV) %'}
                        value={values.receipt_percentage}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={
                          touched.receipt_percentage &&
                          errors.receipt_percentage
                        }
                      />
                    </div>
                    {/* payment_percentage */}
                    <div className="col-12 col-sm-6 mb-3 mt-auto">
                      <CustomInput
                        name={'payment_percentage'}
                        type={'text'}
                        required
                        label={'Payment (PV) %'}
                        placeholder={'Enter Payment (PV) %'}
                        value={values.payment_percentage}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={
                          touched.payment_percentage &&
                          errors.payment_percentage
                        }
                      />
                    </div>
                    {/* tmn_buy_remittance_percentage */}
                    <div className="col-12 col-sm-6 mb-3 mt-auto">
                      <CustomInput
                        name={'tmn_buy_remittance_percentage'}
                        type={'text'}
                        required
                        label={'TMN Buy Remittance (TBN) %'}
                        placeholder={'Enter TMN Buy Remittance (TBN) %'}
                        value={values.tmn_buy_remittance_percentage}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={
                          touched.tmn_buy_remittance_percentage &&
                          errors.tmn_buy_remittance_percentage
                        }
                      />
                    </div>
                    {/* tmn_sell_remittance_percentage */}
                    <div className="col-12 col-sm-6 mb-3 mt-auto">
                      <CustomInput
                        name={'tmn_sell_remittance_percentage'}
                        type={'text'}
                        required
                        label={'TMN Sell Remittance (TSN) %'}
                        placeholder={'Enter TMN Sell Remittance (TSN) %'}
                        value={values.tmn_sell_remittance_percentage}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={
                          touched.tmn_sell_remittance_percentage &&
                          errors.tmn_sell_remittance_percentage
                        }
                      />
                    </div>
                    {/* currency_transfer_request_percentage */}
                    <div className="col-12 col-sm-6 mb-3 mt-auto">
                      <CustomInput
                        name={'currency_transfer_request_percentage'}
                        type={'text'}
                        required
                        label={'Currency Transfer Request (TRQ) %'}
                        placeholder={'Enter Currency Transfer Request (TRQ) %'}
                        value={values.currency_transfer_request_percentage}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={
                          touched.currency_transfer_request_percentage &&
                          errors.currency_transfer_request_percentage
                        }
                      />
                    </div>
                    {/* outward_remittance_percentage */}
                    <div className="col-12 col-sm-6 mb-3 mt-auto">
                      <CustomInput
                        name={'outward_remittance_percentage'}
                        type={'text'}
                        required
                        label={'Outward Remittance (FSN) %'}
                        placeholder={'Enter Outward Remittance (FSN) %'}
                        value={values.outward_remittance_percentage}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={
                          touched.outward_remittance_percentage &&
                          errors.outward_remittance_percentage
                        }
                      />
                    </div>
                    {/* currency_buy_sell_percentage */}
                    <div className="col-12 col-sm-6 mb-3 mt-auto">
                      <CustomInput
                        name={'currency_buy_sell_percentage'}
                        type={'text'}
                        required
                        label={'Currency Buy/Sell (CBS) %'}
                        placeholder={'Enter Currency Buy/Sell (CBS) %'}
                        value={values.currency_buy_sell_percentage}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={
                          touched.currency_buy_sell_percentage &&
                          errors.currency_buy_sell_percentage
                        }
                      />
                    </div>
                    {/* inward_remittance_percentage */}
                    <div className="col-12 col-sm-6 mb-3 mt-auto">
                      <CustomInput
                        name={'inward_remittance_percentage'}
                        type={'text'}
                        required
                        label={'Inward Remittance (DBN) %'}
                        placeholder={'Enter Inward Remittance (DBN) %'}
                        value={values.inward_remittance_percentage}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={
                          touched.inward_remittance_percentage &&
                          errors.inward_remittance_percentage
                        }
                      />
                    </div>
                  </div>
                  {/* Form Buttons */}
                  <div className="d-flex gap-3 ms-auto mb-3 mb-md-0">
                    <CustomButton
                      loading={editCommissionMasterMutation.isPending}
                      disabled={editCommissionMasterMutation.isPending}
                      type={'submit'}
                      text={'Update'}
                    />
                    {!editCommissionMasterMutation.isPending && (
                      <CustomButton
                        onClick={() => navigate(-1)}
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
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

export default EditCommissionMaster;
