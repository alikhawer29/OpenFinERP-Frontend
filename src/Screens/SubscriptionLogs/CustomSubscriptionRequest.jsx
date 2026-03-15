import { useMutation } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../Components/BackButton';
import CustomButton from '../../Components/CustomButton';
import CustomInput from '../../Components/CustomInput';
import { showToast } from '../../Components/Toast/Toast';
import { usePageTitle } from '../../Hooks/usePageTitle';
import { customSubscriptionRequest } from '../../Services/Masters/Subscription';
import useUserStore from '../../Stores/UserStore';
import { showErrorToast } from '../../Utils/Utils';
import { customSubscriptionRequestValidationSchema } from '../../Utils/Validations/ValidationSchemas';

const CustomSubscriptionRequest = () => {
  const navigate = useNavigate();
  usePageTitle('Custom Subscription Request');

  let { user } = useUserStore();

  const subscriptionStatus = user?.subscription_status ?? 'no_subscription';
  const hasFullAccess = ['active', 'cancelled_active'].includes(subscriptionStatus);
  const hasRestrictedAccess = subscriptionStatus === 'grace_period';
  const noAccess = ['expired', 'cancelled_expired', 'no_subscription'].includes(subscriptionStatus);


  const customSubscriptionRequestMutation = useMutation({
    mutationFn: customSubscriptionRequest,
    onSuccess: () => {
      showToast(
        'Custom Subscription Request Submitted Successfully',
        'success'
      );
      // if (['full_access', 'restricted_access'].includes(user?.has_subscription_full_access)) {
      //   navigate('/administration/subscription-logs');
      // } else {
      //   navigate(-1);
      // }

      if (hasFullAccess || hasRestrictedAccess) {
        navigate('/administration/subscription-logs');
      } else {
        navigate(-1);
      }

    },
    onError: (error) => {
      showErrorToast(error.message, 'error');
    },
  });

  const handleSubmit = (values, resetForm) => {
    customSubscriptionRequestMutation.mutate(values, {
      onSuccess: () => {
        resetForm();
      },
    });
  };

  return (
    <>
      <div className="d-flex flex-column gap-2 mb-4">
        <BackButton />
        <h2 className="screen-title mb-0">Custom Subscription Request</h2>
      </div>

      <div className="d-card py-45 mb-45">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <p className="mb-4 muted-text-big">
              Please let us know about the customization you want to use in our
              system
            </p>
            <Formik
              initialValues={{
                user_name: user?.business_name,
                email: user?.email,
                no_of_users: '',
                branches: '',
                comments: '',
              }}
              validationSchema={customSubscriptionRequestValidationSchema}
              onSubmit={(values, { resetForm }) => {
                handleSubmit(values, resetForm);
              }}
            >
              {({ values, errors, touched, handleChange, handleBlur }) => (
                <Form>
                  <div className="row mb-4">
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name="user_name"
                        type="text"
                        required
                        label="Business Name"
                        placeholder="Enter Business Name"
                        value={values.user_name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.user_name && errors.user_name}
                        disabled
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name="email"
                        type="email"
                        required
                        label="Email"
                        placeholder="Enter Email"
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.email && errors.email}
                        disabled
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name="no_of_users"
                        type="number"
                        required
                        label="Expected No. Of Users"
                        placeholder="Enter Expected No. of Users"
                        value={values.no_of_users}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.no_of_users && errors.no_of_users}
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name="branches"
                        type="number"
                        required
                        label="Expected No. Of Branches"
                        placeholder="Enter Expected No. of Branches"
                        value={values.branches}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.branches && errors.branches}
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <CustomInput
                        name="comments"
                        type="textarea"
                        rows={1}
                        label="Additional Comment"
                        placeholder="Enter Additional Comment"
                        value={values.comments}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.comments && errors.comments}
                      />
                    </div>
                    <div className="col-12 d-flex">
                      <CustomButton
                        loading={customSubscriptionRequestMutation.isPending}
                        disabled={customSubscriptionRequestMutation.isPending}
                        type="submit"
                        text="Submit"
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

export default CustomSubscriptionRequest;
