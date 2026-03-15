import { Form, Formik } from 'formik';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../../../../Components/CustomButton';
import CustomInput from '../../../../Components/CustomInput';
import SearchableSelect from '../../../../Components/SearchableSelect/SearchableSelect';
import { useQuery } from '@tanstack/react-query';
import { getWalkinCustomerFilters } from '../../../../Services/Reports/WalkinCustomeReport';
import { getCurrencyOptions } from '../../../../Utils/Utils';
import { generateWalkinCustomerStatementValidationSchema } from '../../../../Utils/Validations/ValidationSchemas';
import { getAccountsbyType } from '../../../../Services/Transaction/JournalVoucher';
import { usePageTitle } from '../../../../Hooks/usePageTitle';

const GenerateWalkInCustomerStatement = () => {
  usePageTitle('Walk-In Customer Statement');
  const navigate = useNavigate();
  const currencyOptions = getCurrencyOptions();

  const handleSubmit = (values) => {
    navigate(`generated`, { state: values });
  };

  const { data: walkinAccounts } = useQuery({
    queryKey: ['getAccountsbyType'],
    queryFn: () => getAccountsbyType('walkin'),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return (
    <section>
      <div className="d-flex gap-3 justify-content-between flex-wrap mb-4">
        <h2 className="screen-title mb-0">WIC Statement</h2>
      </div>
      <div className="d-card">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
              initialValues={{
                account_id: walkinAccounts ? walkinAccounts[0].id : '',
                currency_id: 'all',
                period_range_from: new Date().toLocaleDateString('en-CA'),
                period_range_to: new Date().toLocaleDateString('en-CA'),
              }}
              validationSchema={generateWalkinCustomerStatementValidationSchema}
              enableReinitialize
              onSubmit={handleSubmit}
            >
              {({
                values,
                handleChange,
                handleBlur,
                setFieldValue,
                errors,
                touched,
              }) => (
                <Form>
                  <div className="row mb-4">
                    <div className="col-12 col-lg-12 col-xl-10 col-xxl-6">
                      <div className="row ">
                        <div className="col-12 mb-3">
                          <SearchableSelect
                            label="Account"
                            name="account_id"
                            id="account"
                            error={errors.account_id}
                            touched={touched.account_id}
                            options={walkinAccounts?.map((account) => ({
                              value: account?.id,
                              label: account?.title,
                            }))}
                            value={values.account_id}
                            onChange={(v) =>
                              setFieldValue('account_id', v.value)
                            }
                            placeholder="Select Account"
                          />
                        </div>

                        <div className="col-12 mb-3">
                          <SearchableSelect
                            label="Currency"
                            name="currency_id"
                            id="currency_id"
                            error={errors.currency_id}
                            touched={touched.currency_id}
                            options={[
                              { label: 'All', value: 'all' },
                              ...currencyOptions,
                            ]}
                            value={
                              values.currency_id ||
                              currencyOptions[0]?.value ||
                              ''
                            }
                            onChange={(v) =>
                              setFieldValue('currency_id', v.value)
                            }
                            placeholder="Select Currency"
                            isDisabled={currencyOptions.length < 1}
                          />
                        </div>

                        <div className="col-12">
                          <div className="row flex-wrap">
                            <label htmlFor="period_range_from">Period</label>
                            <div className="col-12 col-sm-6 mb-3">
                              <CustomInput
                                id="period_range_from"
                                name="period_range_from"
                                type="date"
                                value={values.period_range_from}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={errors.period_range_from}
                                touched={touched.period_range_from}
                              />
                            </div>
                            <div className="col-12 col-sm-6 mb-3">
                              <CustomInput
                                id="period_range_to"
                                name="period_range_to"
                                type="date"
                                value={values.period_range_to}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={errors.period_range_to}
                                touched={touched.period_range_to}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex">
                        <CustomButton type="submit" text="Generate" />
                      </div>
                    </div>
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

export default GenerateWalkInCustomerStatement;
