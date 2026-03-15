import { Form, Formik } from 'formik';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../../../../Components/CustomButton';
import CustomInput from '../../../../Components/CustomInput';
import SearchableSelect from '../../../../Components/SearchableSelect/SearchableSelect';
import { getCurrencyOptions } from '../../../../Utils/Utils';
import { usePageTitle } from '../../../../Hooks/usePageTitle';

const ExchangeProfitLossReport = () => {
  usePageTitle('Exchange Profit Loss Report');

  const navigate = useNavigate();
  const handleSubmit = (values) => {
    navigate(`generated`, { state: values });
  };
  const currencyOptions = getCurrencyOptions();

  // Get current date in YYYY-MM-DD format
  const currentDate = new Date().toLocaleDateString('en-CA');

  return (
    <section>
      <div className="d-flex gap-3 justify-content-between flex-wrap mb-4">
        <h2 className="screen-title mb-0">Exchange Profit & Loss</h2>
      </div>
      <div className="d-card">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
              initialValues={{
                report_type: 'remittance_profit_loss',
                currency_id: 'all',
                period_from: currentDate,
                period_to: currentDate,
              }}
              onSubmit={handleSubmit}
            >
              {({ values, handleChange, handleBlur, setFieldValue }) => (
                <Form>
                  <div className="row mb-4">
                    <div className="col-sm-6">
                      <div className="row">
                        <div className="col-12 mb-3">
                          <SearchableSelect
                            label="Report Type"
                            name="report_type"
                            options={[
                              {
                                label: 'Remittance Profit & Loss',
                                value: 'remittance_profit_loss',
                              },
                              {
                                label: 'Combine Profit & Loss',
                                value: 'combine_profit_loss',
                              },
                            ]}
                            value={values.report_type}
                            onChange={(v) =>
                              setFieldValue('report_type', v.value)
                            }
                            placeholder="Select Account"
                          />
                        </div>
                        <div className="col-12">
                          <div className="row flex-wrap">
                            <label htmlFor="period_from">Period From</label>
                            <div className="col-12 col-xl-6 mb-3">
                              <CustomInput
                                name="period_from"
                                type="date"
                                value={values.period_from}
                                onChange={handleChange}
                                onBlur={handleBlur}
                              />
                            </div>
                            <div className="col-12 col-xl-6 mb-3">
                              <CustomInput
                                name="period_to"
                                type="date"
                                value={values.period_to}
                                onChange={handleChange}
                                onBlur={handleBlur}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="col-12 mb-45">
                          <SearchableSelect
                            label="Currency"
                            name="currency_id"
                            options={[
                              { label: 'All', value: 'all' },
                              ...currencyOptions,
                            ]}
                            value={values.currency_id}
                            onChange={(v) =>
                              setFieldValue('currency_id', v.value)
                            }
                            placeholder="Select Currency"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex mb-4">
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

export default ExchangeProfitLossReport;
