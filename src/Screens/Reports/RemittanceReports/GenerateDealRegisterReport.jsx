import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Formik } from 'formik';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { getCurrencyOptions } from '../../../Utils/Utils';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { ledgerOptions } from '../../../Utils/Constants/SelectOptions';

const GenerateDealRegisterReport = () => {
    const currencyOptions = getCurrencyOptions();
    const navigate = useNavigate();
    usePageTitle('Deal Register Report');

    const handleSubmit = (values) => {
        navigate(`generated`, { state: values });
    };

    const sortByOptions = [
        { value: 'date', label: 'Date' },
        { value: 'account', label: 'Account' },
    ];

    return (
        <section>
            <div className="d-flex gap-3 justify-content-between flex-wrap mb-4">
                <h2 className="screen-title mb-0">Deal Register Report</h2>
            </div>
            <div className="d-card">
                <div className="row">
                    <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
                        <Formik
                            initialValues={{
                                ledger: 'all',
                                fcy: 'all',
                                sort_by: 'date',
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
                                        <div className="col-sm-6">

                                            <div className="row">
                                                <div className="col-12 mb-3">
                                                    <SearchableSelect
                                                        label="Ledger"
                                                        name="ledger"
                                                        id="ledger"
                                                        options={[{ label: 'All', value: 'all' }, ...ledgerOptions]}
                                                        value={values.ledger}
                                                        onChange={(v) => setFieldValue('ledger', v.value)}
                                                        placeholder="Select Ledger"
                                                    />
                                                </div>

                                                <div className="col-12 mb-3">
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

                                                <div className="col-12 mb-3">
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

                                                <div className="col-12">
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

export default GenerateDealRegisterReport;
