import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Formik } from 'formik';
import CustomButton from '../../../../Components/CustomButton';
import CustomInput from '../../../../Components/CustomInput';
import SearchableSelect from '../../../../Components/SearchableSelect/SearchableSelect';
import { getCurrencyOptions } from '../../../../Utils/Utils';
import { usePageTitle } from '../../../../Hooks/usePageTitle';

const GenerateWalkInCustomerOutstandingBalance = () => {
    const currencyOptions = getCurrencyOptions();
    const navigate = useNavigate();
    usePageTitle('WIC Outstanding Balance Report');

    // Default Period Upto to today's date (YYYY-MM-DD), but allow user to change it
    const today = new Date();
    const currentDate = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0'),
    ].join('-');

    const handleSubmit = (values) => {
        navigate(`generated`, { state: values });
    };

    const sortByOptions = [
        { value: 'title_of_account ', label: 'Title of Account' },
        { value: 'balance', label: 'Balance' },
    ];

    const balanceTypeOptions = [
        { value: 'all ', label: 'All' },
        { value: 'debit_balances_only', label: 'Debit Balances Only' },
        { value: 'credit_balances_only', label: 'Credit Balances Only' },
        { value: 'include_zero_balances', label: 'Include Debit Balances' },
    ];

    return (
        <section>
            <div className="d-flex gap-3 justify-content-between flex-wrap mb-4">
                <h2 className="screen-title mb-0">WIC Outstanding Balance Report</h2>
            </div>
            <div className="d-card">
                <div className="row">
                    <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
                        <Formik
                            initialValues={{
                                currency: 'all',
                                sort_by: 'title_of_account ',
                                balance_type: 'all ',
                                period_upto: currentDate,
                            }}
                            onSubmit={handleSubmit}
                        >
                            {({
                                values,
                                handleChange,
                                handleBlur,
                                setFieldValue,
                            }) => (
                                <Form>
                                    <div className="row">
                                        <div className="col-12 col-sm-6 mb-3">
                                            <SearchableSelect
                                                label="Currency"
                                                name="currency"
                                                id="currency"
                                                options={[{ label: "All", value: "all" }, ...currencyOptions]}
                                                value={values.currency}
                                                onChange={(v) => setFieldValue('currency', v.value)}
                                                placeholder="Select Currency"
                                            />
                                        </div>

                                        <div className="col-12 col-sm-6 mb-3">
                                            <SearchableSelect
                                                label="Sort By"
                                                name="sort_by"
                                                id="sort_by"
                                                options={sortByOptions}
                                                value={values.sort_by}
                                                onChange={(v) => setFieldValue('sort_by', v.value)}
                                                placeholder="Select Sort By"
                                            />
                                        </div>

                                        <div className="col-12 col-sm-6 mb-3">
                                            <SearchableSelect
                                                label="Balance Type"
                                                name="balance_type"
                                                id="balance_type"
                                                options={balanceTypeOptions}
                                                value={values.balance_type}
                                                onChange={(v) => setFieldValue('balance_type', v.value)}
                                                placeholder="Select Balance Type"
                                            />
                                        </div>

                                        <div className="col-12 col-sm-6 mb-3">
                                            <CustomInput
                                                label="Period Upto"
                                                name="period_upto"
                                                id="period_upto"
                                                type="date"
                                                value={values.period_upto}
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

export default GenerateWalkInCustomerOutstandingBalance;
