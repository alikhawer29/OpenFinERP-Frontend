import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Formik } from 'formik';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { getCurrencyOptions } from '../../../Utils/Utils';
import { usePageTitle } from '../../../Hooks/usePageTitle';

const GenerateAccountTurnOverReport = () => {
  const currencyOptions = getCurrencyOptions();
  const navigate = useNavigate();
  usePageTitle('Account Turnover Report');

  const handleSubmit = (values) => {
    navigate(`generated`, { state: values });
  };

  const accountGroupOptions = [
    { value: 'All', label: 'All' },
    { value: 'All Party Ledger Accounts', label: 'All Party Ledger Accounts' },
    {
      value: 'All General Ledger Accounts',
      label: 'All General Ledger Accounts',
    },
    {
      value: 'All Walk-in Customer Accounts',
      label: 'All Walk-in Customer Accounts',
    },
    { value: 'Accounts Payable', label: 'Accounts Payable' },
    { value: 'Administrative Expenses', label: 'Administrative Expenses' },
    { value: 'Asset', label: 'Asset' },
  ];

  // Helper to get current month start and end dates in YYYY-MM-DD format
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  return (
    <section>
      <div className="d-flex gap-3 justify-content-between flex-wrap mb-4">
        <h2 className="screen-title mb-0">Account Turnover Report</h2>
      </div>
      <div className="d-card">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
              initialValues={{
                account_group: 'All',
                fcy: 'all',
                date_from: formatDate(firstDayOfMonth),
                date_to: formatDate(lastDayOfMonth),
              }}
              onSubmit={handleSubmit}
            >
              {({ values, handleChange, handleBlur, setFieldValue }) => (
                <Form>
                  <div className="row">
                    <div className="col-12 col-sm-6 mb-3">
                      <SearchableSelect
                        label="Account Group"
                        name="account_group"
                        id="account_group"
                        options={accountGroupOptions}
                        value={values.account_group}
                        onChange={(v) =>
                          setFieldValue('account_group', v.value)
                        }
                        placeholder="Select Account Group"
                      />
                    </div>

                    <div className="col-12 col-sm-6 mb-3">
                      <SearchableSelect
                        label="FCy"
                        name="fcy"
                        id="fcy"
                        options={[
                          { label: 'All', value: 'all' },
                          ...currencyOptions,
                        ]}
                        value={values.fcy}
                        onChange={(v) => setFieldValue('fcy', v.value)}
                        placeholder="Select FCy"
                      />
                    </div>

                    <div className="col-12 col-sm-6">
                      <div className="row flex-wrap">
                        <label htmlFor="date_from">Date Range</label>
                        <div className="col-12 col-xl-6 mb-3">
                          <CustomInput
                            name="date_from"
                            id="date_from"
                            type="date"
                            placeholder="From"
                            value={values.date_from}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                        </div>
                        <div className="col-12 col-xl-6 mb-3">
                          <CustomInput
                            name="date_to"
                            id="date_to"
                            type="date"
                            placeholder="To"
                            value={values.date_to}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                        </div>
                      </div>
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

export default GenerateAccountTurnOverReport;
