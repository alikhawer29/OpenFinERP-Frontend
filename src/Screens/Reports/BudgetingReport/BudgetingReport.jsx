import { useQuery } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { useEffect, useRef } from 'react';
import { Col, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import withFilters from '../../../HOC/withFilters ';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { checkBudgetPreference } from '../../../Services/Reports/BudgetingReportService';
import { budgetReportValidationSchema } from '../../../Utils/Validations/ValidationSchemas';

const BudgetingReport = () => {
  const navigate = useNavigate();
  const formRef = useRef();
  usePageTitle('Budgeting Report');

  // Query for checking preference
  const { data: preferenceCheck } = useQuery({
    queryKey: ['preferenceCheck'],
    queryFn: () => checkBudgetPreference(),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const handleSubmit = (values) => {
    const searchParams = new URLSearchParams(values);
    navigate(`generated?${searchParams.toString()}`);
  };

  useEffect(() => {
    if (preferenceCheck?.detail?.preference && formRef.current) {
      formRef.current.setFieldValue(
        'report_type',
        preferenceCheck?.detail?.preference
      );
    }
  }, [preferenceCheck]);

  return (
    <section>
      <div className="d-flex justify-content-between flex-wrap mb-3">
        <h2 className="screen-title m-0 d-inline">Budgeting Report</h2>
      </div>
      <div className="d-card  mb-4">
        <Row>
          <Col xs={12} md={10} lg={10} xl={12}>
            <div>
              <Formik
                innerRef={formRef}
                initialValues={{
                  date_from: '',
                  date_to: '',
                  report_type: '',
                }}
                validationSchema={budgetReportValidationSchema}
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
                          <label htmlFor="date_from">Period</label>
                          <div className="col-12 col-xl-6 mb-3">
                            <CustomInput
                              id="date_from"
                              name="date_from"
                              type="date"
                              value={values.date_from}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              error={errors.date_from}
                              touched={touched.date_from}
                            />
                          </div>
                          <div className="col-12 col-xl-6 mb-3">
                            <CustomInput
                              id="date_to"
                              name="date_to"
                              type="date"
                              value={values.date_to}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              error={errors.date_to}
                              touched={touched.date_to}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-4">
                      <CustomButton
                        text="Cancel"
                        variant={'secondaryButton'}
                        onClick={() => formRef.current.resetForm()}
                      />
                      <div>
                        <CustomButton type="submit" text="Generate" />
                      </div>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </Col>
        </Row>
      </div>
    </section>
  );
};

export default withFilters(BudgetingReport);
