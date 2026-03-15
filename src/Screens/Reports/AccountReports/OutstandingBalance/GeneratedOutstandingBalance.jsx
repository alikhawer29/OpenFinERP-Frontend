import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { useLocation, useSearchParams } from 'react-router-dom';
import CustomButton from '../../../../Components/CustomButton';
import CustomTable from '../../../../Components/CustomTable/CustomTable';
import withFilters from '../../../../HOC/withFilters ';
import useModulePermissions from '../../../../Hooks/useModulePermissions';
import { getOutstandingBalanceReport } from '../../../../Services/Reports/JournalReport';
import {
  generatedOutstandingBalanceHeaders,
  outstandingBalanceHeaders,
} from '../../../../Utils/Constants/TableHeaders';
import {
  downloadFile,
  getCurrencyOptions,
  reportPrint,
} from '../../../../Utils/Utils';
import BackButton from '../../../../Components/BackButton';
import { usePageTitle } from '../../../../Hooks/usePageTitle';

const OutstandingBalance = ({ filters, setFilters, pagination }) => {
  usePageTitle('Outstanding Balance Report');
  const currencyOptions = getCurrencyOptions();
  // Get search params from URL
  const [searchParams] = useSearchParams();
  const urlData = Object.fromEntries(searchParams.entries());

  const permissions = useModulePermissions('reports', 'outstanding_balance');
  const { allowToExcel, allowToPdf } = permissions;

  const outstandingBalanceData = useQuery({
    queryKey: ['outstanding-balance', filters],
    queryFn: () => getOutstandingBalanceReport(filters),
    refetchOnWindowFocus: true,
    enabled: !!filters, // prevent auto run if params not ready
  });

  const { state } = useLocation();

  const lastParamsRef = useRef('');

  useEffect(() => {
    if (state) {
      setFilters((prev) => {
        const newFilters = {
          ...prev,
          ...state,
          // Explicitly ensure checkbox values are included
          show_summary_in_base_value: state.show_summary_in_base_value || false,
          generate_report_in_base_currency:
            state.generate_report_in_base_currency || false,
          include_zero_balance_accounts:
            state.include_zero_balance_accounts || false,
        };
        return newFilters;
      });
    }
  }, [state, setFilters]);

  useEffect(() => {
    const paramsToSend = { ...urlData, ...filters };
    const paramsString = JSON.stringify(paramsToSend);

    if (paramsString !== lastParamsRef.current) {
      outstandingBalanceData.refetch();
      lastParamsRef.current = paramsString;
    }
  }, [JSON.stringify(filters), JSON.stringify(urlData)]);

  return (
    <section>
      <div className="d-flex justify-content-between flex-wrap mb-3">
        <div className="d-flex  flex-column gap-2">
          <BackButton />
          <h2 className="screen-title m-0 d-inline">Outstanding Balance</h2>
        </div>
        <div className="d-flex gap-3 flex-wrap">
          {allowToExcel && (
            <CustomButton
              text={'Export to Excel'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile('outstanding-balance', 'xlsx');
              }}
            />
          )}
          {allowToPdf && (
            <CustomButton
              text={'Export to PDF'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile('outstanding-balance', 'pdf');
              }}
            />
          )}
          <CustomButton
            text={'Print'}
            onClick={() => {
              reportPrint('outstanding-balance');
            }}
          />
        </div>
      </div>
      <Row>
        <Col xs={12}>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={
              filters?.generate_report_in_base_currency
                ? generatedOutstandingBalanceHeaders
                : outstandingBalanceHeaders
            }
            pagination={pagination}
            isPaginated={false}
            isLoading={outstandingBalanceData?.isLoading}
            hideSearch
            selectOptions={[
              {
                label: ' Account Group',
                title: 'account_group',
                options: [
                  { value: 'all', label: 'All' },
                  {
                    value: 'All Party Ledger Accounts',
                    label: 'All Party Ledger Accounts',
                  },
                  {
                    value: 'All General Ledger Accounts',
                    label: 'All General Ledger Accounts',
                  },
                  {
                    value: 'All Walk-in Customer Accounts',
                    label: 'All Walk-in Customer Accounts',
                  },
                  { value: 'Accounts Payable', label: 'Accounts Payable' },
                  {
                    value: 'Administrative Expenses',
                    label: 'Administrative Expenses',
                  },
                  { value: 'Asset', label: 'Asset' },
                ],
              },
              {
                title: 'currency',
                label: 'Currency',
                options: [{ value: 'all', label: 'All' }, ...currencyOptions],
              },
              {
                label: 'Sort By',
                title: 'sort_by',
                options: [
                  { value: 'title_of_account', label: 'Title of Account' },
                  { value: 'balance', label: 'Balance' },
                ],
              },
              {
                title: 'balance_type',
                label: 'Balance Type',
                options: [
                  { value: 'all', label: 'All' },
                  {
                    value: 'debit_balances_only',
                    label: 'Debit Balances Only',
                  },
                  {
                    value: 'credit_balances_only',
                    label: 'Credit Balances Only ',
                  },
                ],
              },
            ]}
            additionalFilters={[
              { title: 'period_upto', label: 'Period Upto', type: 'date' },
            ]}
            checkBoxFilters={[
              {
                title: 'show_summary_in_base_value',
                label: 'Show Summary in Base Value',
              },
              {
                title: 'generate_report_in_base_currency',
                label: 'Generate Report in Base Currecny',
              },
              {
                title: 'include_zero_balance_accounts',
                label: 'Include ZERO Balance Accounts',
              },
            ]}
          >
            {!outstandingBalanceData?.isLoading &&
              (outstandingBalanceData?.data?.length ||
                outstandingBalanceData?.isError) && (
                <tbody>
                  {outstandingBalanceData?.isError && (
                    <tr>
                      <td colSpan={outstandingBalanceHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {outstandingBalanceData?.data?.map((item, index) => (
                    <tr
                      style={{
                        fontWeight:
                          item?.title_of_account === 'Sub Total' ||
                          item?.title_of_account === 'Grand Total'
                            ? 'bold'
                            : '',
                      }}
                      key={index++}
                    >
                      <td>{item.title_of_account}</td>
                      <td>{item.fcy}</td>
                      <td>{item.debit}</td>
                      <td>{item.credit}</td>
                      {filters?.generate_report_in_base_currency && (
                        <td>{item.base_currency_value}</td>
                      )}
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

export default withFilters(OutstandingBalance);
