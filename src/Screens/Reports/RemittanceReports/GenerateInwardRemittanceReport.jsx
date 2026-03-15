import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Formik } from 'formik';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { getCurrencyOptions } from '../../../Utils/Utils';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import useAccountsByType from '../../../Hooks/useAccountsByType';
import { ledgerOptions } from '../../../Utils/Constants/SelectOptions';

const GenerateInwardRemittanceReport = () => {
    const currencyOptions = getCurrencyOptions();
    const navigate = useNavigate();
    usePageTitle('Inward Remittance Report');
    const { getAccountsByTypeOptions } = useAccountsByType();

    const handleSubmit = (values) => {
        navigate(`generated`, { state: values });
    };

    return (
        <section>
            <div className="d-flex gap-3 justify-content-between flex-wrap mb-4">

                <h2 className="screen-title mb-0">Inward Remittance Report</h2>
            </div>
            <div className="d-card">
                <div className="row">
                    <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
                        <Formik
                            initialValues={{
                                ledger_type: 'all',
                                all_accounts: true,
                                from_account: '',
                                to_account: '',
                                fcy: 'all',
                                fcy_amount_from: '',
                                fcy_amount_to: '',
                                date_from: '',
                                date_to: '',
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
                                            <SearchableSelect
                                                label="Ledger Type"
                                                name="ledger_type"
                                                id="ledger_type"
                                                options={[{ label: 'All', value: 'all' }, ...ledgerOptions]}
                                                value={values.ledger_type}
                                                onChange={(v) => {
                                                    setFieldValue('ledger_type', v.value);
                                                    if (v.value === 'all') {
                                                        setFieldValue('all_accounts', true);
                                                    }
                                                }}
                                                placeholder="Select Ledger Type"
                                            />
                                        </div>

                                        <div className="col-12 col-sm-6 mb-3 d-flex align-items-end">
                                            <label className="checkbox-container mb-2">
                                                <input
                                                    type="checkbox"
                                                    name="all_accounts"
                                                    checked={values.ledger_type === 'all' ? true : values.all_accounts}
                                                    onChange={handleChange}
                                                    disabled={values.ledger_type === 'all'}
                                                />
                                                <span className="custom-checkbox"></span>
                                                All Accounts
                                            </label>
                                        </div>

                                        {values.ledger_type !== 'all' && !values.all_accounts && (
                                            <>
                                                <div className="col-12 col-sm-6 mb-3">
                                                    <SearchableSelect
                                                        label="From Account"
                                                        name="from_account"
                                                        id="from_account"
                                                        options={getAccountsByTypeOptions(values.ledger_type, false)}
                                                        value={values.from_account}
                                                        onChange={(v) => setFieldValue('from_account', v.value)}
                                                        placeholder="Select From Account"
                                                    />
                                                </div>
                                                <div className="col-12 col-sm-6 mb-3">
                                                    <SearchableSelect
                                                        label="To Account"
                                                        name="to_account"
                                                        id="to_account"
                                                        options={getAccountsByTypeOptions(values.ledger_type, false)}
                                                        value={values.to_account}
                                                        onChange={(v) => setFieldValue('to_account', v.value)}
                                                        placeholder="Select To Account"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        <div className="col-12 col-sm-6 mb-3">
                                            <SearchableSelect
                                                label="FCy"
                                                name="fcy"
                                                id="fcy"
                                                options={[{ label: "All", value: "all" }, ...currencyOptions]}
                                                value={values.fcy}
                                                onChange={(v) => setFieldValue('fcy', v.value)}
                                                placeholder="Select FCy"
                                            />
                                        </div>

                                        <div className="col-12 col-sm-6">
                                            <div className="row flex-wrap">
                                                <label htmlFor="fcy_amount_from">
                                                    FCy Amount Range
                                                </label>
                                                <div className="col-12 col-xl-6 mb-3">
                                                    <CustomInput
                                                        name="fcy_amount_from"
                                                        id="fcy_amount_from"
                                                        type="number"
                                                        placeholder="From"
                                                        value={values.fcy_amount_from}
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                    />
                                                </div>
                                                <div className="col-12 col-xl-6 mb-3">
                                                    <CustomInput
                                                        name="fcy_amount_to"
                                                        id="fcy_amount_to"
                                                        type="number"
                                                        placeholder="To"
                                                        value={values.fcy_amount_to}
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-12 col-sm-6">
                                            <div className="row flex-wrap">
                                                <label htmlFor="date_from">
                                                    Date Range
                                                </label>
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

export default GenerateInwardRemittanceReport;
