import { useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../../../../Components/CustomButton';
import CustomInput from '../../../../Components/CustomInput';
import withFilters from '../../../../HOC/withFilters ';
import { Form, Formik } from 'formik';
import { generateVatReportValidationSchema } from '../../../../Utils/Validations/ValidationSchemas';
import { usePageTitle } from '../../../../Hooks/usePageTitle';

const VATReport = () => {
  usePageTitle('VAT Report');

  const navigate = useNavigate();

  const handleSubmit = (values) => {
    const searchParams = new URLSearchParams(values);
    navigate(`summary?${searchParams.toString()}`);
  };

  return (
    <section>
      <div className="d-flex justify-content-between flex-wrap mb-3">
        <h2 className="screen-title m-0 d-inline">VAT Report</h2>
      </div>
      <div className="d-card">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
              initialValues={{
                period_from: new Date().toLocaleDateString('en-CA'),
                period_to: new Date().toLocaleDateString('en-CA'),
              }}
              validationSchema={generateVatReportValidationSchema}
              enableReinitialize
              onSubmit={handleSubmit}
            >
              {({
                values,
                handleChange,
                handleBlur,
                setFieldValue,
                errors,
                touched,
              }) => (
                <Form>
                  <div className="row mb-4">
                    <div className="col-12 col-sm-6">
                      <div className="row flex-wrap">
                        <label htmlFor="period_range_from">Period</label>
                        <div className="col-12 col-xl-6 mb-3">
                          <CustomInput
                            id="period_from"
                            name="period_from"
                            type="date"
                            value={values.period_from}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.period_from}
                            touched={touched.period_from}
                          />
                        </div>
                        <div className="col-12 col-xl-6 mb-3">
                          <CustomInput
                            id="period_to"
                            name="period_to"
                            type="date"
                            value={values.period_to}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.period_to}
                            touched={touched.period_to}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex mb-4 gap-4">
                    <CustomButton type="submit" text="Generate" />
                    <CustomButton
                      text={'Cancel'}
                      type={'button'}
                      onClick={() => navigate('/dashboard')}
                    />
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </section>
  );
};

export default withFilters(VATReport);
