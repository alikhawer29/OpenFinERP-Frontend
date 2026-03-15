import { Form, Formik } from 'formik';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../../../../Components/CustomButton';
import CustomInput from '../../../../Components/CustomInput';
import SearchableSelect from '../../../../Components/SearchableSelect/SearchableSelect';
import { usePageTitle } from '../../../../Hooks/usePageTitle';
import { getCurrencyOptions } from '../../../../Utils/Utils';

const GenerateOutstandingBalance = () => {
    const currencyOptions = getCurrencyOptions();
    const navigate = useNavigate();
    usePageTitle('Outstanding Balance Report');

    // Get today's date as YYYY-MM-DD (local time) for Period Upto default
    const today = new Date();
    const currentDate = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0'),
    ].join('-');

    const handleSubmit = (values) => {
        navigate(`generated`, { state: values });
    };

    const accountGroupOptions = [
        { value: 'all', label: 'All' },
        { value: 'All Party Ledger Accounts', label: 'All Party Ledger Accounts' },
        { value: 'All General Ledger Accounts', label: 'All General Ledger Accounts' },
        { value: 'All Walk-in Customer Accounts', label: 'All Walk-in Customer Accounts' },
        { value: 'Accounts Payable', label: 'Accounts Payable' },
        { value: 'Administrative Expenses', label: 'Administrative Expenses' },
        { value: 'Asset', label: 'Asset' },
    ];

    const sortByOptions = [
        { value: 'title_of_account', label: 'Title of Account' },
        { value: 'balance', label: 'Balance' },
    ];

    const balanceTypeOptions = [
        { value: 'all', label: 'All' },
        { value: 'debit_balances_only', label: 'Debit Balances Only' },
        { value: 'credit_balances_only', label: 'Credit Balances Only ' },
    ];

    return (
        <section>
            <div className=" mb-4">
                <h2 className="screen-title mb-0">Outstanding Balance Report</h2>
            </div>
            <div className="d-card">
                <div className="row">
                    <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
                        <Formik
                            initialValues={{
                                account_group: 'all',
                                currency: 'all',
                                sort_by: 'title_of_account',
                                balance_type: 'all',
                                // Default to today's date, but user can change it
                                period_upto: currentDate,
                                show_summary_in_base_value: false,
                                generate_report_in_base_currency: false,
                                include_zero_balance_accounts: false,
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
                                                label="Account Group"
                                                name="account_group"
                                                id="account_group"
                                                options={accountGroupOptions}
                                                value={values.account_group}
                                                onChange={(v) => setFieldValue('account_group', v.value)}
                                                placeholder="Select Account Group"
                                            />
                                        </div>

                                        <div className="col-12 col-sm-6 mb-3">
                                            <SearchableSelect
                                                label="Currency"
                                                name="currency"
                                                id="currency"
                                                options={[{ value: 'all', label: 'All' }, ...currencyOptions]}
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

                                        <div className="col-12 mb-3">
                                            <div className="d-flex flex-wrap gap-4">
                                                <label className="checkbox-container">
                                                    <input
                                                        type="checkbox"
                                                        name="show_summary_in_base_value"
                                                        checked={values.show_summary_in_base_value}
                                                        onChange={handleChange}
                                                    />
                                                    <span className="custom-checkbox"></span>
                                                    Show Summary in Base Value
                                                </label>

                                                <label className="checkbox-container">
                                                    <input
                                                        type="checkbox"
                                                        name="generate_report_in_base_currency"
                                                        checked={values.generate_report_in_base_currency}
                                                        onChange={handleChange}
                                                    />
                                                    <span className="custom-checkbox"></span>
                                                    Generate Report in Base Currency
                                                </label>

                                                <label className="checkbox-container">
                                                    <input
                                                        type="checkbox"
                                                        name="include_zero_balance_accounts"
                                                        checked={values.include_zero_balance_accounts}
                                                        onChange={handleChange}
                                                    />
                                                    <span className="custom-checkbox"></span>
                                                    Include ZERO Balance Accounts
                                                </label>
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

export default GenerateOutstandingBalance;
