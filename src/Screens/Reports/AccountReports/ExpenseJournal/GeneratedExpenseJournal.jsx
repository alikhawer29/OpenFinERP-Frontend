import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { useLocation, useSearchParams } from 'react-router-dom';
import BackButton from '../../../../Components/BackButton';
import CustomButton from '../../../../Components/CustomButton';
import CustomTable from '../../../../Components/CustomTable/CustomTable';
import withFilters from '../../../../HOC/withFilters ';
import useModulePermissions from '../../../../Hooks/useModulePermissions';
import { usePageTitle } from '../../../../Hooks/usePageTitle';
import { getJournalReportUserFilters } from '../../../../Services/Reports/JournalReport';
import {
  getExpenseJournalAccountStatement,
  getExpenseJournalListing,
} from '../../../../Services/Reports/WalkinCustomeReport';
import { transactionTypeOptionsWithName } from '../../../../Utils/Constants/SelectOptions';
import { expenseJournalHeaders } from '../../../../Utils/Constants/TableHeaders';
import {
  downloadFile,
  getCurrencyOptions,
  reportPrint,
} from '../../../../Utils/Utils';

const GeneratedExpenseJournal = ({ filters, setFilters, pagination }) => {
  usePageTitle('Expense Journal');
  const isLoading = false;
  const isError = false;
  const currencyOptions = getCurrencyOptions();
  const [tableData, setTableData] = useState([]);

  const [searchParams] = useSearchParams();
  const urlData = Object.fromEntries(searchParams.entries());

  const location = useLocation();
  const { state } = location;

  const permissions = useModulePermissions('reports', 'expense_journal');
  const { allowToExcel, allowToPdf } = permissions;

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

  // listing
  const expenseJournalListing = useQuery({
    queryKey: ['expenseJournalListing', filters],
    queryFn: () => getExpenseJournalListing(filters),
    refetchOnWindowFocus: true,
    retry: 1,
    enabled: !!filters,
  });

  useEffect(() => {
    setFilters(() => ({
      ...state,
    }));
  }, []);

  useEffect(() => {
    const paramsToSend = { ...urlData, ...filters };
    const paramsString = JSON.stringify(paramsToSend);

    if (paramsString !== expenseJournalListing.lastParams) {
      expenseJournalListing.refetch();
      expenseJournalListing.lastParams = paramsString;
    }
  }, [JSON.stringify(filters), JSON.stringify(urlData)]);

  return (
    <section>
      <div className="d-flex justify-content-between flex-wrap mb-3">
        <div className="d-flex flex-column gap-2 mb-4">
          <BackButton />
          <h2 className="screen-title m-0 d-inline">Expense Journal</h2>
        </div>
        <div className="d-flex gap-3 flex-wrap">
          {allowToExcel && (
            <CustomButton
              text={'Export to Excel'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile('expense-journal', 'xlsx');
              }}
            />
          )}
          {allowToPdf && (
            <CustomButton
              text={'Export to PDF'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile('expense-journal', 'pdf');
              }}
            />
          )}
          <CustomButton
            text={'Print'}
            onClick={() => {
              reportPrint('expense-journal');
            }}
          />
        </div>
      </div>
      <Row>
        <Col xs={12}>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={expenseJournalHeaders}
            pagination={pagination}
            isPaginated={false}
            isLoading={isLoading}
            hideSearch
            showFilterBorders={true}
            selectOptions={[
              {
                label: 'Account',
                title: 'account_id',
                disabled: true,
                options: expenseJournalFilters?.accounts.map((account) => ({
                  value: account?.id,
                  label: account?.name,
                })),
              },
              {
                label: 'Transaction Type',
                title: 'transaction_type',
                options: transactionTypeOptionsWithName,
              },
              {
                label: 'FCy',
                title: 'fcy',
                options: [{ label: 'All', value: 'all' }, ...currencyOptions],
              },
            ]}
            dateFilters={[
              {
                disabled: true,
                label: 'Transaction Date',
                title: 'transaction_date',
                type: 'date ',
              },
            ]}
          >
            {(expenseJournalListing?.data?.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={expenseJournalHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {expenseJournalListing?.data?.map((item, index) => (
                  <tr key={index}>
                    <td>{item.type}</td>
                    <td>{item.tran_no}</td>
                    <td>{item.date}</td>
                    <td>{item.account_title}</td>
                    <td>{item.narration}</td>
                    <td>{item.fcy}</td>
                    <td>{item.fcy_amount}</td>
                    <td>{item.base_currency_value}</td>
                    <td>{item.user_id}</td>
                  </tr>
                ))}
              </tbody>
            )}
          </CustomTable>
        </Col>
      </Row>
    </section>
  );
};

export default withFilters(GeneratedExpenseJournal);
