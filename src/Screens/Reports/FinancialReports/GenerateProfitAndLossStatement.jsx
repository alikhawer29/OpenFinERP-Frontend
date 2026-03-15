import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Formik } from 'formik';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import { usePageTitle } from '../../../Hooks/usePageTitle';

const GenerateProfitAndLossStatement = () => {
    const navigate = useNavigate();
    usePageTitle('Profit & Loss Statement');

    // Get current month's first and last dates in YYYY-MM-DD format
    const getCurrentMonthDates = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); // 0 = January, 1 = February, ...

        // First day of the month
        const firstDay = new Date(year, month, 1);
        const firstDayStr = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-${String(firstDay.getDate()).padStart(2, '0')}`;

        // Last day of the month
        const lastDay = new Date(year, month + 1, 0);
        const lastDayStr = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

        return {
            date_from: firstDayStr,
            date_to: lastDayStr,
        };
    };

    // Initialize with current month's dates
    const [initialValues] = useState(getCurrentMonthDates());

    const handleSubmit = (values) => {
        navigate(`generated`, { state: values });
    };

    return (
        <section>
            <div className="d-flex gap-3 justify-content-between flex-wrap mb-4">
                <h2 className="screen-title mb-0">Profit & Loss Statement</h2>
            </div>
            <div className="d-card">
                <div className="row">
                    <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
                        <Formik
                            initialValues={initialValues}
                            onSubmit={handleSubmit}
                            enableReinitialize={true}
                        >
                            {({ values, handleChange, handleBlur }) => (
                                <Form>
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

                                    <div className="d-flex">
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

export default GenerateProfitAndLossStatement;
