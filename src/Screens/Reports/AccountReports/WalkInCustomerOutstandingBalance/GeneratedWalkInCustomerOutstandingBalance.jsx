import React, { useState, useEffect } from 'react';
import { Col, Row } from 'react-bootstrap';
import BackButton from '../../../../Components/BackButton';
import CustomButton from '../../../../Components/CustomButton';
import CustomTable from '../../../../Components/CustomTable/CustomTable';
import withFilters from '../../../../HOC/withFilters ';
import { walkInCustomerOutstandingBalanceData } from '../../../../Mocks/MockData';
import { walkInCustomerOutstandingBalanceHeaders } from '../../../../Utils/Constants/TableHeaders';
import { getWalkInCustomerOutstandingBalance } from '../../../../Services/Reports/WalkinCustomeReport';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSearchParams, useLocation } from 'react-router-dom';
import { currencyTypeOptions } from '../../../../Utils/Constants/SelectOptions';
import {
  downloadFile,
  getCurrencyOptions,
  reportPrint,
} from '../../../../Utils/Utils';
import useModulePermissions from '../../../../Hooks/useModulePermissions';

const GeneratedWalkInCustomerOutstandingBalance = ({
  filters,
  setFilters,
  pagination,
}) => {
  const isLoading = false;
  const isError = false;

  // Holds full API detail: { data: [...], currency_totals, grand_totals, ... }
  const [tableData, setTableData] = useState(null);
  const [searchParams] = useSearchParams();
  const urlData = Object.fromEntries(searchParams.entries());
  const currencyOptions = getCurrencyOptions();

  const permissions = useModulePermissions(
    'reports',
    'walk_in_customer_outstanding_balance'
  );
  const { view, allowToExcel, allowToPdf } = permissions;

  const generateWalkInCustomerOutstandingBalance = useQuery({
    queryKey: ['walk-in-customer-outstanding-balance', filters],
    queryFn: () => getWalkInCustomerOutstandingBalance(filters),
    refetchOnWindowFocus: true,
    enabled: !!filters, // prevent auto run if params not ready
  });

  useEffect(() => {
    if (generateWalkInCustomerOutstandingBalance?.data) {
      // Save the full detail object so we can use data + totals
      setTableData(generateWalkInCustomerOutstandingBalance.data);
    }
  }, [generateWalkInCustomerOutstandingBalance?.data]);

  const renderSummaryRows = () => {
    const rows = [];

    const summaryObj = tableData?.currency_totals;
    const grandTotal = tableData?.grand_totals_per_currency;
    if (summaryObj && Object.keys(summaryObj).length) {
      Object.entries(summaryObj).forEach(([currency, totals]) => {
        rows.push(
          <tr key={`tmn-summary-${currency}`} className="table-summary-row">
            <td>
              <strong>Sub Total</strong>
            </td>
            <td>{currency || '-'}</td>
            <td>{totals?.debit ?? '-'}</td>
            <td>{totals?.credit ?? '-'}</td>
          </tr>
        );
      });
    }

    if (grandTotal && Object.keys(grandTotal).length) {
      Object.entries(grandTotal).forEach(([currency, totals]) => {
        rows.push(
          <tr key={`tmn-summary-${currency}`} className="table-summary-row">
            <td>
              <strong>Grand Total</strong>
            </td>
            <td>{currency || '-'}</td>
            <td>{totals?.debit ?? '-'}</td>
            <td>{totals?.credit ?? '-'}</td>
          </tr>
        );
      });
    }

    return rows.length ? rows : null;
  };

  const summaryRowsNodes = renderSummaryRows();

  useEffect(() => {
    const paramsToSend = { ...urlData, ...filters };
    const paramsString = JSON.stringify(paramsToSend);

    if (paramsString !== generateWalkInCustomerOutstandingBalance.lastParams) {
      generateWalkInCustomerOutstandingBalance.refetch();
      generateWalkInCustomerOutstandingBalance.lastParams = paramsString;
    }
  }, [JSON.stringify(filters), JSON.stringify(urlData)]);

  const { state } = useLocation();
  useEffect(() => {
    if (state) {
      setFilters((prev) => ({
        ...prev,
        ...state,
      }));
    }
  }, [state]);

  return (
    <section>
      <div className="d-flex justify-content-between flex-wrap mb-3">
        <div className="d-flex flex-column">
          <BackButton />
          <h2 className="screen-title m-0 d-inline">
            WIC Outstanding Balance Report
          </h2>
        </div>
        <div className="d-flex gap-3 flex-wrap">
          {allowToExcel && (
            <CustomButton
              text={'Export to Excel'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile('walk-in-customer-outstanding-balance', 'xlsx');
              }}
            />
          )}
          {allowToPdf && (
            <CustomButton
              text={'Export to PDF'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile('walk-in-customer-outstanding-balance', 'pdf');
              }}
            />
          )}
          <CustomButton
            text={'Print'}
            onClick={() => {
              reportPrint('walk-in-customer-outstanding-balance');
            }}
          />
        </div>
      </div>
      <Row>
        <Col xs={12}>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={walkInCustomerOutstandingBalanceHeaders}
            pagination={pagination}
            isPaginated={false}
            summaryRows={summaryRowsNodes}
            isLoading={generateWalkInCustomerOutstandingBalance?.isLoading}
            hideSearch
            selectOptions={[
              {
                label: 'Currency',
                title: 'currency',
                options: [{ label: 'All', value: 'all' }, ...currencyOptions],
              },
              {
                label: 'Sort By',
                title: 'sort_by',
                options: [
                  { value: 'title_of_account ', label: 'Title of Account' },
                  { value: 'balance', label: 'Balance' },
                ],
              },
              {
                label: 'Balance Type',
                title: 'balance_type',
                options: [
                  { value: 'all ', label: 'All' },
                  {
                    value: 'debit_balances_only',
                    label: 'Debit Balances Only',
                  },
                  {
                    value: 'credit_balances_only',
                    label: 'Credit Balances Only',
                  },
                  {
                    value: 'include_zero_balances',
                    label: 'Include Debit Balances',
                  },
                ],
              },
            ]}
            additionalFilters={[
              { label: 'Period Upto', title: 'period_upto', type: 'date' },
            ]}
          >
            {(tableData?.data?.length ||
              generateWalkInCustomerOutstandingBalance?.isError) && (
              <tbody>
                {generateWalkInCustomerOutstandingBalance?.isError && (
                  <tr>
                    <td
                      colSpan={walkInCustomerOutstandingBalanceHeaders.length}
                    >
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {tableData?.data?.map((item, index) => (
                  <tr key={index}>
                    <td>{item.title_of_account}</td>
                    <td>{item.fcy}</td>
                    <td>{item.debit}</td>
                    <td>{item.credit}</td>
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

export default withFilters(GeneratedWalkInCustomerOutstandingBalance);
