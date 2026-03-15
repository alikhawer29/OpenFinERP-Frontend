import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import CustomButton from '../../Components/CustomButton';
import CustomInput from '../../Components/CustomInput';
import { showToast } from '../../Components/Toast/Toast';
import { usePageTitle } from '../../Hooks/usePageTitle';
import { processPayment } from '../../Services/Payment';
import { isNullOrEmpty, showErrorToast } from '../../Utils/Utils';
import {
  paymentValidationSchema,
  subscriptionPaymentValidationSchema,
} from '../../Utils/Validations/ValidationSchemas';
import useUserStore from '../../Stores/UserStore';
import BackButton from '../../Components/BackButton';

const Payment = () => {
  usePageTitle('Payment');
  const queryClient = useQueryClient();
  const location = useLocation();
  const { renew, currentSubscription } = location.state || {};
  const { setSubscriptionAccessStatus } = useUserStore();
  const [plan, setPlan] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNullOrEmpty(currentSubscription) && renew) {
      setPlan({
        id: currentSubscription.package_id,
        price: currentSubscription?.subscription_amount,
        type: currentSubscription?.type,
      });
    } else {
      setPlan({
        id: location.state.id,
        price: location.state?.price,
        type: location.state?.type,
      });
    }
  }, [location.state]);

  // Payment Mutation
  const paymentMutation = useMutation({
    mutationFn: (formData) => processPayment(formData, plan?.id),
    onSuccess: () => {
      showToast('Payment Processed Successfully', 'success');
      // Technical Debt
      setSubscriptionAccessStatus('full_access');
      queryClient.invalidateQueries(['payments']);
      if (renew) {
        navigate('/administration/subscription-logs');
      } else {
        navigate('/dashboard');
      }
    },
    onError: (error) => {
      showErrorToast(error, 'error');
    },
  });

  const handlePayment = (values) => {
    const rawCardNumber = values.number.replace(/-/g, ''); // remove dashes

    // Transform form values to match API format
    const card_details = {
      number: rawCardNumber,
      cvc: values.cvv,
      exp_month: values.exp_month.split('-')[1],
      exp_year: values.exp_month.split('-')[0],
      auto_renewal: values.auto_renewal,
      type: plan?.type,
    };
    paymentMutation.mutate({ card_details });
  };

  return (
    <>
      <div className="mb-3">
        <BackButton />
        <h2 className="screen-title mb-0">Payment</h2>
      </div>

      <div className="d-card">
        <Row>
          <Col xs={12} lg={10} xl={9} xxl={7}>
            <p className="mb-4">
              Total Amount: <span className="fw-bold">${plan?.price}</span>
            </p>
            <Formik
              initialValues={{
                cardholderName: '',
                number: '',
                cvv: '',
                exp_month: '',
                type: plan?.type,
                auto_renewal: 0,
              }}
              validationSchema={subscriptionPaymentValidationSchema}
              onSubmit={handlePayment}
            >
              {({
                values,
                errors,
                touched,
                handleChange,
                handleBlur,
                setFieldValue,
                setErrors,
              }) => (
                <Form>
                  <Row>
                    <Col xs={12} sm={6} className="mb-3">
                      <CustomInput
                        name="cardholderName"
                        label="Cardholder Name"
                        placeholder="Enter Cardholder Name"
                        required
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.cardholderName && errors.cardholderName}
                      />
                    </Col>
                    <Col xs={12} sm={6} className="mb-3">
                      <CustomInput
                        name="number"
                        label="Card Number"
                        placeholder="4242-4242-4242-4242"
                        required
                        inputMode="numeric"
                        maxLength={19} // 16 digits + 3 dashes
                        value={values.number}
                        onChange={(e) => {
                          // remove all non-digits
                          let val = e.target.value.replace(/\D/g, '');
                          // limit to 16 digits max
                          val = val.substring(0, 16);
                          // add dash after every 4 digits
                          const formatted = val.replace(
                            /(\d{4})(?=\d)/g,
                            '$1-'
                          );
                          setFieldValue('number', formatted);
                        }}
                        onBlur={handleBlur}
                        error={touched.number && errors.number}
                      />
                    </Col>
                    <Col xs={12} sm={6} className="mb-3">
                      <CustomInput
                        name="cvv"
                        label="CVV Number"
                        placeholder="Enter CVV"
                        required
                        inputMode="numeric" // shows number keypad on mobile
                        maxLength={3} // restricts to 3 digits
                        value={values.cvv}
                        onChange={(e) => {
                          // allow only digits, max 3
                          const val = e.target.value
                            .replace(/\D/g, '')
                            .slice(0, 3);
                          setFieldValue('cvv', val);
                        }}
                        onBlur={handleBlur}
                        error={touched.cvv && errors.cvv}
                      />
                    </Col>
                    <Col xs={12} sm={6} className="mb-3">
                      <CustomInput
                        name="exp_month"
                        label="Validity"
                        placeholder="MM/YYYY"
                        required
                        type="month"
                        min={new Date().toISOString().slice(0, 7)} // disables old months in picker
                        onChange={(e) => {
                          const selected = new Date(e.target.value + '-01');
                          const current = new Date();
                          current.setDate(1); // only compare month/year

                          if (selected < current) {
                            // show validation error in Formik
                            setErrors({
                              exp_month: 'Past months are not allowed',
                            });
                            // reset value to current month
                            e.target.value = new Date()
                              .toISOString()
                              .slice(0, 7);
                            handleChange({
                              target: {
                                name: 'exp_month',
                                value: e.target.value,
                              },
                            });
                          } else {
                            // clear any previous errors
                            setErrors({});
                            handleChange(e);
                          }
                        }}
                        onBlur={handleBlur}
                        error={touched.exp_month && errors.exp_month}
                      />
                    </Col>
                    <Col xs={12} sm={6} className="mb-3">
                      <div className="d-inline-flex mt-0 mt-sm-3">
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            name="auto_renewal"
                            id="auto_renewal"
                            checked={values.auto_renewal}
                            onChange={(e) =>
                              setFieldValue(
                                'auto_renewal',
                                e.target.checked ? 1 : 0
                              )
                            }
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        <label
                          htmlFor="auto_renewal"
                          className="beechMein ms-2 cp user-select-none"
                        >
                          Auto Renew
                        </label>
                      </div>
                    </Col>
                  </Row>
                  <div className="d-flex justify-content-start mt-4">
                    <CustomButton
                      variant="primary"
                      type="submit"
                      text="Pay Now"
                      loading={paymentMutation.isPending}
                      disabled={paymentMutation.isPending}
                    />
                  </div>
                </Form>
              )}
            </Formik>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default Payment;
