import { useMutation } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import React from 'react';
import { FaDollarSign } from 'react-icons/fa6';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import { showToast } from '../../../Components/Toast/Toast';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { addPackage } from '../../../Services/Admin/Package';
import { addPackageValidationSchema } from '../../../Utils/Validations/ValidationSchemas';
import { showErrorToast } from '../../../Utils/Utils';

const NewSubscription = () => {
  usePageTitle('Subscription - Create');

  const navigate = useNavigate();
  const { id } = useParams();
  const { state } = useLocation();
  const fromRequestSubscription = state?.fromRequestSubscription ?? '';
  const user_id = state?.user_id ?? null;
  const no_of_users = state?.no_of_users ?? null;
  const branches = state?.branches ?? null;

  // Mutation for adding package
  const addPackageMutation = useMutation({
    mutationFn: (formData) => addPackage(formData),
    onSuccess: () => {
      showToast('Package Added Successfully!', 'success');
      setTimeout(() => {
        navigate("/admin/subscription-management", {
          state: {
            switchToCustomTab: fromRequestSubscription,
            refreshData: true,
          },
        });
      }, 300);
    },
    onError: (error) => {
      console.error('Error adding Support Type:', error);
      showErrorToast(error);
    },
  });

  const handleSubmit = (values) => {
    addPackageMutation.mutate(values);
  };

  return (
    <div>
      <div className="d-flex flex-column gap-2 mb-4">
        <BackButton />
        <h2 className="screen-title m-0 d-inline">
          {fromRequestSubscription ? 'Request' : 'New'} Subscription
        </h2>
      </div>

      <div className="d-card ">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
              initialValues={{
                title: fromRequestSubscription ? 'Custom Subscription' : '',
                no_of_users: no_of_users || '',
                branches: branches || '',
                price_monthly: '',
                price_yearly: '',
                type: fromRequestSubscription ? 'custom' : 'general',
                user_id: user_id,
              }}
              validationSchema={addPackageValidationSchema}
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
                        name={'title'}
                        type={'text'}
                        required
                        label={'Subscription Name'}
                        placeholder={'Enter Subscription Name'}
                        value={values.title}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.title && errors.title}
                        disabled={fromRequestSubscription}
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'no_of_users'}
                        type={'number'}
                        required
                        label={'Number of Users'}
                        placeholder={'Enter Number of Users'}
                        value={values.no_of_users}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.no_of_users && errors.no_of_users}
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-45">
                      <CustomInput
                        name={'branches'}
                        type={'number'}
                        required
                        label={'Number of Branches'}
                        placeholder={'Enter Number of Branches'}
                        value={values.branches}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.branches && errors.branches}
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'price_monthly'}
                        type={'number'}
                        required
                        label={'Price Monthly'}
                        placeholder={'Enter Price Monthly'}
                        rightIcon={FaDollarSign}
                        value={values.price_monthly}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.price_monthly && errors.price_monthly}
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'price_yearly'}
                        type={'number'}
                        required
                        label={'Price Yearly'}
                        rightIcon={FaDollarSign}
                        placeholder={'Enter Price Yearly'}
                        value={values.price_yearly}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.price_yearly && errors.price_yearly}
                      />
                    </div>
                    {fromRequestSubscription && (
                      <div className="col-12 col-sm-6 mb-3">
                        <CustomInput
                          name={'user_id'}
                          type={'number'}
                          required
                          label={'Business ID'}
                          value={values.user_id}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.user_id && errors.user_id}
                          disabled
                        />
                      </div>
                    )}
                  </div>
                    <div className="d-flex gap-3 ms-auto mb-3 mb-md-0">
                      <CustomButton
                        loading={addPackageMutation.isPending}
                        disabled={addPackageMutation.isPending}
                        type={'submit'}
                        text={'Create'}
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

export default NewSubscription;
