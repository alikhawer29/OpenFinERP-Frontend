import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Form, Formik } from 'formik';
import { useQuery } from '@tanstack/react-query';

import { getOutwardRemittanceFilters } from '../../../../Services/Reports/OutwardRemittanceReport';
import {
  ledgerOptions,
  transactionTypeOptionsWithName,
} from '../../../../Utils/Constants/SelectOptions';

import CustomButton from '../../../../Components/CustomButton';
import CustomInput from '../../../../Components/CustomInput';
import SearchableSelect from '../../../../Components/SearchableSelect/SearchableSelect';
import { getCurrencyOptions } from '../../../../Utils/Utils';
import useAccountsByType from '../../../../Hooks/useAccountsByType';
import CustomCheckbox from '../../../../Components/CustomCheckbox/CustomCheckbox';
import { usePageTitle } from '../../../../Hooks/usePageTitle';

const GenerateOutwardRemittanceReport = () => {
  usePageTitle('Outward Remittance Report');
  const currencyOptions = getCurrencyOptions();
  const { getAccountsByTypeOptions } = useAccountsByType();

  const [selectedLedger, setSelectedLedger] = useState('all');

  const navigate = useNavigate();

  const handleSubmit = (values) => {
    navigate(`generated`, { state: values });
  };

  return (
    <section>
      <div className="d-flex gap-3 justify-content-between flex-wrap mb-4">
        <h2 className="screen-title mb-0">Outward Remittance Report</h2>
      </div>
      <div className="d-card">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
              initialValues={{
                transaction_type: 'all',
                ledger_type: 'all',
                from_account: '',
                to_account: '',
                fcy: '',
                status: 'all',
                all_accounts: true,
                transaction_no_from: '',
                transaction_no_to: '',
                fcy_amount_from: '',
                fcy_amount_to: '',
                date_from: '',
                date_to: '',
              }}
              onSubmit={handleSubmit}
            >
              {({
                values,
                errors,
                handleChange,
                handleBlur,
                setFieldValue,
              }) => (
                <Form>
                  <div className="row mb-4">
                    <div className="col-12 col-sm-6 mb-3">
                      <SearchableSelect
                        label="Transaction Type"
                        name="transaction_type"
                        id="transaction_type"
                        options={[
                          { label: 'All', value: 'all' },
                          { label: 'FSN', value: 'fsn' },
                          { label: 'FBN', value: 'fbn' },
                        ]}
                        value={values.transaction_type}
                        onChange={(v) =>
                          setFieldValue('transaction_type', v.value)
                        }
                        placeholder="Select Transaction Type"
                        error={errors.transaction_type}
                      />
                    </div>

                    <div className="col-12 col-sm-6 mb-3">
                      <SearchableSelect
                        label="Status"
                        name="status"
                        id="status"
                        options={[
                          { label: 'All', title: 'all' },
                          { label: 'Open', title: 'open' },
                          { label: 'Closed', title: 'closed' },
                        ]}
                        value={values.status}
                        onChange={(v) => setFieldValue('status', v.value)}
                        placeholder="Select Status"
                        error={errors.status}
                      />
                    </div>

                    <div className="col-12 col-sm-6 mb-3">
                      <SearchableSelect
                        label="Ledger"
                        name="ledger_type"
                        id="ledger_type"
                        options={[
                          { label: 'All', value: 'all' },
                          ...ledgerOptions,
                        ]}
                        value={values.ledger_type}
                        onChange={(v) => {
                          setSelectedLedger(v.value);
                          setFieldValue('ledger_type', v.value);
                        }}
                        placeholder="Select Ledger"
                        error={errors.ledger_type}
                      />
                    </div>

                    {values.ledger_type !== 'all' && !values.all_accounts && (
                      <div className="col-12 col-sm-6 mb-3">
                        <SearchableSelect
                          label="From Account"
                          name="from_account"
                          id="from_account"
                          options={getAccountsByTypeOptions(
                            values.ledger_type,
                            false
                          )}
                          value={values.from_account}
                          onChange={(v) =>
                            setFieldValue('from_account', v.value)
                          }
                          placeholder="Select From Account"
                          error={errors.from_account}
                        />
                      </div>
                    )}

                    {values.ledger_type !== 'all' && !values.all_accounts && (
                      <div className="col-12 col-sm-6 mb-3">
                        <SearchableSelect
                          label="To Account"
                          name="to_account"
                          id="to_account"
                          options={getAccountsByTypeOptions(
                            values.ledger_type,
                            false
                          )}
                          value={values.to_account}
                          onChange={(v) => setFieldValue('to_account', v.value)}
                          placeholder="Select To Account"
                          error={errors.to_account}
                        />
                      </div>
                    )}

                    <div className="col-12 col-sm-6 mt-4">
                      <CustomCheckbox
                        label="All Accounts"
                        name="all_accounts"
                        id="all_accounts"
                        value={values.all_accounts}
                        error={errors.to_account}
                        style={{ border: 'none' }}
                        onChange={(e) =>
                          setFieldValue('all_accounts', e.target.checked)
                        }
                        checked={
                          values.ledger_type === 'all'
                            ? true
                            : values.all_accounts
                        }
                        readOnly={values.ledger_type === 'all'}
                      />
                    </div>

                    <div className="col-12 col-sm-6 mb-3">
                      <SearchableSelect
                        label="FCy"
                        name="fcy"
                        id="fcy"
                        options={currencyOptions}
                        value={values.fcy}
                        onChange={(v) => setFieldValue('fcy', v.value)}
                        placeholder="Select FCy"
                        error={errors.fcy}
                      />
                    </div>

                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        label="Transaction No. From"
                        name="transaction_no_from"
                        id="transaction_no_from"
                        type="text"
                        placeholder="From"
                        value={values.transaction_no_from}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.transaction_no_from}
                      />
                    </div>

                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        label="Transaction No. To"
                        name="transaction_no_to"
                        id="transaction_no_to"
                        type="text"
                        placeholder="To"
                        value={values.transaction_no_to}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.transaction_no_to}
                      />
                    </div>

                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        label="FCy Amount From"
                        name="fcy_amount_from"
                        id="fcy_amount_from"
                        type="text"
                        placeholder="From"
                        value={values.fcy_amount_from}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.fcy_amount_from}
                      />
                    </div>

                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        label="FCy Amount To"
                        name="fcy_amount_to"
                        id="fcy_amount_to"
                        type="text"
                        placeholder="To"
                        value={values.fcy_amount_to}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.fcy_amount_to}
                      />
                    </div>

                    <div className="col-12 col-sm-6">
                      <div className="row flex-wrap">
                        <label htmlFor="date_from">Due Date Range</label>
                        <div className="col-12 col-xl-6 mb-3">
                          <CustomInput
                            name="date_from"
                            id="date_from"
                            type="date"
                            value={values.date_from}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.date_from}
                          />
                        </div>
                        <div className="col-12 col-xl-6 mb-3">
                          <CustomInput
                            name="date_to"
                            id="date_to"
                            type="date"
                            value={values.date_to}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.date_to}
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

export default GenerateOutwardRemittanceReport;
