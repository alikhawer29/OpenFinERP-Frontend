import { Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import CustomInput from '../../../../Components/CustomInput';
import BackButton from '../../../../Components/BackButton';
import { walkInCustomerAccountJournalHeaders } from '../../../../Utils/Constants/TableHeaders';
import CustomTable from '../../../../Components/CustomTable/CustomTable';
import { useQuery } from '@tanstack/react-query';
import CustomSelect from '../../../../Components/CustomSelect';
import { getWalkInCustomerAccountJournal } from '../../../../Services/Reports/WalkinCustomeReport';
import { usePageTitle } from '../../../../Hooks/usePageTitle';

const WalkInCustomerAccountJournal = () => {
  usePageTitle('Walk-In Customer Account Journal');
  const navigate = useNavigate();
  const isError = false;
  const [filters, setFilters] = useState({
    transaction_type: '',
    user_id: '',
  });

  const [searchParams] = useSearchParams();
  const urlData = Object.fromEntries(searchParams.entries());

  const {
    data: walkinCustomerAccountJournal,
    isLoading: isLoadingWalkinCustomerAccountJournal,
  } = useQuery({
    queryKey: ['walkinCustomerAccountJournal', urlData?.transaction_id],
    queryFn: () => getWalkInCustomerAccountJournal(urlData?.transaction_id),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const handleSubmit = (values) => {};

  function convertDateToISO(dateStr) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  useEffect(() => {
    if (urlData?.transaction_id) {
      getWalkInCustomerAccountJournal(urlData?.transaction_id);
    }
  }, []);

  return (
    <section>
      <div className="d-flex gap-3 justify-content-between flex-wrap mb-4">
        <div className="d-flex flex-column gap-2 mb-4">
          <BackButton />
          <h2 className="screen-title m-0 d-inline">Account Journal</h2>
        </div>
      </div>
      <div className="d-card">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
              initialValues={{
                transaction_type:
                  walkinCustomerAccountJournal?.filters?.transaction_type || '',
                transaction_no:
                  walkinCustomerAccountJournal?.filters?.transaction_no || '',
                date: walkinCustomerAccountJournal?.filters?.date || '',
                user_id: walkinCustomerAccountJournal?.filters?.user_id || '',
              }}
              enableReinitialize
              onSubmit={handleSubmit}
            >
              {({ values, handleChange, handleBlur, setFieldValue }) => (
                <Form>
                  <div className="row mb-4">
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        label="Transaction Type"
                        name="transaction_type"
                        type="text"
                        value={urlData?.type}
                        disabled={true}
                      />
                    </div>

                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        label="Transaction No"
                        name="transaction_no"
                        type="text"
                        value={urlData?.transaction_no}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={true}
                      />
                    </div>

                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        label="Date"
                        name="date"
                        type="date"
                        value={convertDateToISO(urlData.value_date)}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={true}
                      />
                    </div>
                  </div>

                  {/* <div className="d-flex mb-4">
                    <CustomButton type="submit" text="Generate" />
                  </div> */}
                </Form>
              )}
            </Formik>
          </div>
        </div>
        <CustomTable
          displayCard={false}
          headers={walkInCustomerAccountJournalHeaders}
          hasFilters={false}
          isPaginated={false}
          hideSearch
          hideItemsPerPage
          hideFilters
        >
          {(walkinCustomerAccountJournal?.length ||
            isError ||
            isLoadingWalkinCustomerAccountJournal) && (
            <tbody>
              {isLoadingWalkinCustomerAccountJournal && (
                <tr>
                  <td colSpan={walkInCustomerAccountJournalHeaders.length}>
                    <p className="text-center mb-0">Loading...</p>
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={walkInCustomerAccountJournalHeaders.length}>
                    <p className="text-danger mb-0">
                      Unable to fetch data at this time
                    </p>
                  </td>
                </tr>
              )}
              {walkinCustomerAccountJournal?.map((item) => (
                <tr key={item.id}>
                  <td>{item.account_title}</td>
                  <td>{item.narration}</td>
                  <td>{item.currency_code}</td>
                  <td>{item.debit}</td>
                  <td>{item.credit}</td>
                </tr>
              ))}
            </tbody>
          )}
        </CustomTable>
      </div>
    </section>
  );
};

export default WalkInCustomerAccountJournal;
