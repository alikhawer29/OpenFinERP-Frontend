import { Form, Formik } from 'formik';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../../../../Components/CustomButton';
import CustomInput from '../../../../Components/CustomInput';
import SearchableSelect from '../../../../Components/SearchableSelect/SearchableSelect';
import { getExpenseJournalAccountStatement } from '../../../../Services/Reports/WalkinCustomeReport';
import { useQuery } from '@tanstack/react-query';
import { getJournalReportUserFilters } from '../../../../Services/Reports/JournalReport';
import CustomCheckbox from '../../../../Components/CustomCheckbox/CustomCheckbox';
import { usePageTitle } from '../../../../Hooks/usePageTitle';

const ExpenseJournal = () => {
  usePageTitle('Expense Journal');
  const navigate = useNavigate();

  const handleSubmit = (values) => {
    navigate(`generated`, { state: values });
  };

  // Query for walkin customer filters
  const { data: expenseJournalFilters } = useQuery({
    queryKey: ['expenseJournalFilters'],
    queryFn: () => getExpenseJournalAccountStatement(),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Query for journal report user filters
  const {
    data: expenseJournalUserFilters,
    isLoading: isLoadingJournalReportUserFilters,
    isError: isErrorJournalReportUserFilters,
    error: errorJournalReportUserFilters,
  } = useQuery({
    queryKey: ['expenseJournalUserFilters'],
    queryFn: () => getJournalReportUserFilters(),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // for getting user ids
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
        <h2 className="screen-title mb-0">Expense Journal</h2>
      </div>
      <div className="d-card">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
              initialValues={{
                account_id: '',
                // Default to current month start/end, but user can still change them
                transaction_date_from: formatDate(firstDayOfMonth),
                transaction_date_to: formatDate(lastDayOfMonth),
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
                            label="Account"
                            name="account_id"
                            options={
                              (expenseJournalFilters &&
                                expenseJournalFilters?.accounts &&
                                expenseJournalFilters?.accounts.map(
                                  (account) => ({
                                    value: account?.id,
                                    label: account?.name,
                                  })
                                )) ||
                              []
                            }
                            value={values.account_id}
                            onChange={(v) =>
                              setFieldValue('account_id', v.value)
                            }
                            placeholder="Select Account"
                          />
                        </div>
                        <div className="col-12 ">
                          <div className="row flex-wrap">
                            <label htmlFor="date_from">Date Range</label>
                            <div className="col-12 col-xl-6 mb-3">
                              <CustomInput
                                name="transaction_date_from"
                                type="date"
                                value={values.transaction_date_from}
                                onChange={handleChange}
                                onBlur={handleBlur}
                              />
                            </div>
                            <div className="col-12 col-xl-6 mb-3">
                              <CustomInput
                                name="transaction_date_to"
                                type="date"
                                value={values.transaction_date_to}
                                onChange={handleChange}
                                onBlur={handleBlur}
                              />
                            </div>
                          </div>
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

export default ExpenseJournal;
