import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Formik } from 'formik';
import { useQuery } from '@tanstack/react-query';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { getCurrencyOptions } from '../../../Utils/Utils';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import useAccountsByType from '../../../Hooks/useAccountsByType';
import { ledgerOptions } from '../../../Utils/Constants/SelectOptions';
import { getJournalReportUserFilters } from '../../../Services/Reports/JournalReport';

const GenerateOutwardRemittanceEnquiry = () => {
    const currencyOptions = getCurrencyOptions();
    const navigate = useNavigate();
    usePageTitle('Outward Remittance Enquiry');
    const { getAccountsByTypeOptions } = useAccountsByType();

    const {
        data: expenseJournalUserFilters,
        isLoading: isLoadingJournalReportUserFilters,
        isError: isErrorJournalReportUserFilters,
    } = useQuery({
        queryKey: ['expenseJournalUserFilters'],
        queryFn: () => getJournalReportUserFilters(),
        refetchOnWindowFocus: false,
        retry: 1,
    });

    const getUserFilterOptions = () => {
        if (isLoadingJournalReportUserFilters) {
            return [{ label: 'Loading...', value: null, isDisabled: true }];
        }
        if (isErrorJournalReportUserFilters) {
            return [{ label: 'Unable to fetch users', value: null }];
        }
        return (
            expenseJournalUserFilters?.map((x) => ({
                value: x?.id,
                label: x?.user_id,
            })) || []
        );
    };

    const handleSubmit = (values) => {
        navigate(`generated`, { state: values });
    };

    return (
        <section>
            <div className="d-flex gap-3 justify-content-between flex-wrap mb-4">
                <h2 className="screen-title mb-0">Outward Remittance Enquiry</h2>
            </div>
            <div className="d-card">
                <div className="row">
                    <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
                        <Formik
                            initialValues={{
                                transaction_type: 'all',
                                ledger_type: 'all',
                                all_accounts: true,
                                from_account_id: '',
                                to_account_id: '',
                                fcy: 'all',
                                sort_by: 'transaction_number',
                                user_id: '',
                                status: 'all',
                                transaction_no_from: '',
                                transaction_no_to: '',
                                fcy_amount_from: '',
                                fcy_amount_to: '',
                                date_from: '',
                                date_to: '',
                                posting_date_from: '',
                                posting_date_to: '',
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
                                                label="Transaction Type"
                                                name="transaction_type"
                                                id="transaction_type"
                                                options={[{ label: "All", value: "all" }, { label: "FSN", value: "fsn" }, { label: "FBN", value: "fbn" }]}
                                                value={values.transaction_type}
                                                onChange={(v) => setFieldValue('transaction_type', v.value)}
                                                placeholder="Select Transaction Type"
                                            />
                                        </div>

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
                                                        name="from_account_id"
                                                        id="from_account_id"
                                                        options={getAccountsByTypeOptions(values.ledger_type, false)}
                                                        value={values.from_account_id}
                                                        onChange={(v) => setFieldValue('from_account_id', v.value)}
                                                        placeholder="Select From Account"
                                                    />
                                                </div>
                                                <div className="col-12 col-sm-6 mb-3">
                                                    <SearchableSelect
                                                        label="To Account"
                                                        name="to_account_id"
                                                        id="to_account_id"
                                                        options={getAccountsByTypeOptions(values.ledger_type, false)}
                                                        value={values.to_account_id}
                                                        onChange={(v) => setFieldValue('to_account_id', v.value)}
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

                                        <div className="col-12 col-sm-6 mb-3">
                                            <SearchableSelect
                                                label="Sort By"
                                                name="sort_by"
                                                id="sort_by"
                                                options={[
                                                    { label: "Transaction Number", value: "transaction_number" },
                                                    { label: "Account", value: "account" },
                                                    { label: "Beneficiary", value: "beneficiary" },
                                                ]}
                                                value={values.sort_by}
                                                onChange={(v) => setFieldValue('sort_by', v.value)}
                                                placeholder="Select Sort By"
                                            />
                                        </div>

                                        <div className="col-12 col-sm-6 mb-3">
                                            <SearchableSelect
                                                label="User ID"
                                                name="user_id"
                                                id="user_id"
                                                options={[{ label: "Select User", value: "" }, ...getUserFilterOptions()]}
                                                value={values.user_id}
                                                onChange={(v) => setFieldValue('user_id', v.value)}
                                                isLoading={isLoadingJournalReportUserFilters}
                                                placeholder="Select User"
                                            />
                                        </div>

                                        <div className="col-12 col-sm-6 mb-3">
                                            <SearchableSelect
                                                label="Status"
                                                name="status"
                                                id="status"
                                                options={[{ label: "All", value: "all" }, { label: "Open", value: "open" }, { label: "Closed", value: "closed" }]}
                                                value={values.status}
                                                onChange={(v) => setFieldValue('status', v.value)}
                                                placeholder="Select Status"
                                            />
                                        </div>

                                        <div className="col-12 col-sm-6">
                                            <div className="row flex-wrap">
                                                <label htmlFor="transaction_no_from">
                                                    Transaction No. Range
                                                </label>
                                                <div className="col-12 col-xl-6 mb-3">
                                                    <CustomInput
                                                        name="transaction_no_from"
                                                        id="transaction_no_from"
                                                        type="number"
                                                        placeholder="From"
                                                        value={values.transaction_no_from}
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                    />
                                                </div>
                                                <div className="col-12 col-xl-6 mb-3">
                                                    <CustomInput
                                                        name="transaction_no_to"
                                                        id="transaction_no_to"
                                                        type="number"
                                                        placeholder="To"
                                                        value={values.transaction_no_to}
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                    />
                                                </div>
                                            </div>
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

                                        <div className="col-12 col-sm-6">
                                            <div className="row flex-wrap">
                                                <label htmlFor="posting_date_from">
                                                    Posting Date Range
                                                </label>
                                                <div className="col-12 col-xl-6 mb-3">
                                                    <CustomInput
                                                        name="posting_date_from"
                                                        id="posting_date_from"
                                                        type="date"
                                                        placeholder="From"
                                                        value={values.posting_date_from}
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                    />
                                                </div>
                                                <div className="col-12 col-xl-6 mb-3">
                                                    <CustomInput
                                                        name="posting_date_to"
                                                        id="posting_date_to"
                                                        type="date"
                                                        placeholder="To"
                                                        value={values.posting_date_to}
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

export default GenerateOutwardRemittanceEnquiry;
