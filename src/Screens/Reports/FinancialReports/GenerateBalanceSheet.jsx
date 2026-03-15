import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Formik } from 'formik';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import { usePageTitle } from '../../../Hooks/usePageTitle';

const GenerateBalanceSheet = () => {
  const navigate = useNavigate();
  usePageTitle('Balance Sheet');

  const handleSubmit = (values) => {
    navigate(`generated`, { state: values });
  };

  // Get current month end date in YYYY-MM-DD format for date input
  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    // Get the last day of the current month by setting day to 0 of next month
    const lastDay = new Date(year, month + 1, 0);
    // Format manually to avoid timezone issues with toISOString()
    const day = String(lastDay.getDate()).padStart(2, '0');
    const monthStr = String(lastDay.getMonth() + 1).padStart(2, '0');
    const yearStr = lastDay.getFullYear();
    return `${yearStr}-${monthStr}-${day}`;
  };

  return (
    <section>
      <div className="d-flex gap-3 justify-content-between flex-wrap mb-4">
        <h2 className="screen-title mb-0">Balance Sheet</h2>
      </div>
      <div className="d-card">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
              initialValues={{
                date: getCurrentDate(),
              }}
              onSubmit={handleSubmit}
            >
              {({
                values,
                handleChange, // Formik's handleChange handles check/uncheck for checkboxes if name matches
                handleBlur,
                setFieldValue,
              }) => (
                <Form>
                  <div className="row">
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        label="Date"
                        name="date"
                        id="date"
                        type="date"
                        value={values.date}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </div>
                  </div>

                  <div className="d-flex mt-3">
                    <CustomButton type="submit" text="Generate" />
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

export default GenerateBalanceSheet;
