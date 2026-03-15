import React, { useState, useEffect } from 'react';
import { Col, Row } from 'react-bootstrap';
import CustomButton from '../../../Components/CustomButton';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import withFilters from '../../../HOC/withFilters ';
import { accountTurnoverReportData } from '../../../Mocks/MockData';
import { accountTurnoverReportHeaders } from '../../../Utils/Constants/TableHeaders';
import {
  downloadFile,
  getCurrencyOptions,
  reportPrint,
} from '../../../Utils/Utils';
import { getAccountTurnoverReportListing } from '../../../Services/Reports/WalkinCustomeReport';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import BackButton from '../../../Components/BackButton';

const AccountTurnOverReport = ({ filters, setFilters, pagination }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [searchParams] = useSearchParams();
  const { state } = useLocation();
  const urlData = Object.fromEntries(searchParams.entries());
  const currencyOptions = getCurrencyOptions();

  const permissions = useModulePermissions(
    'reports',
    'account_turnover_report'
  );
  const { allowToExcel, allowToPdf } = permissions;

  const [tableData, setTableData] = useState([]);
  // listing
  const accountTurnoverListing = useMutation({
    mutationFn: async (params) => {
      const response = await getAccountTurnoverReportListing(params);
      return response;
    },
    onSuccess: (data) => {
      setIsLoading(false);
      setTableData(data);
    },
    onError: (error) => {
      setIsLoading(false);
      setIsError(true);
      console.error(error);
    },
  });

  const summaryRows = tableData?.totals?.map((item, index) => {
    return (
      <tr key={index}>
        <td colSpan={2}></td>
        <td>
          <strong>Total</strong>
        </td>
        <td>
          <strong>{item?.currency}</strong>
        </td>
        <td>
          <strong>{item?.balance_brf}</strong>
        </td>
        <td>
          <strong>{item?.total_debit}</strong>
        </td>
        <td>
          <strong>{item?.total_credit}</strong>
        </td>
        <td>
          <strong>{item?.balance_crf}</strong>
        </td>
      </tr>
    );
  });

  useEffect(() => {
    if (state) {
      setFilters((prev) => ({
        ...prev,
        ...state,
      }));
    }
  }, [state]);

  useEffect(() => {
    const paramsToSend = { ...urlData, ...filters };
    const paramsString = JSON.stringify(paramsToSend);

    if (paramsString !== accountTurnoverListing.lastParams) {
      accountTurnoverListing.mutate(paramsToSend);
      accountTurnoverListing.lastParams = paramsString;
    }
  }, [JSON.stringify(filters), JSON.stringify(urlData)]);

  return (
    <section>
      <div className="d-flex justify-content-between flex-wrap mb-3">
        <div className="d-flex flex-column">
          <BackButton />
          <h2 className="screen-title m-0 d-inline">Account Turnover Report</h2>
        </div>

        <div className="d-flex gap-3 flex-wrap">
          {allowToExcel && (
            <CustomButton
              text={'Export to Excel'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile('account-turnover-report', 'xlsx');
              }}
            />
          )}
          {allowToPdf && (
            <CustomButton
              text={'Export to PDF'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile('account-turnover-report', 'pdf');
              }}
            />
          )}
          <CustomButton
            text={'Print'}
            onClick={() => {
              reportPrint('account-turnover-report');
            }}
          />
        </div>
      </div>
      <Row>
        <Col xs={12}>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={accountTurnoverReportHeaders}
            pagination={pagination}
            isLoading={isLoading}
            hideItemsPerPage={true}
            isPaginated={false}
            summaryRows={summaryRows}
            hideSearch
            selectOptions={[
              {
                label: ' Account Group',
                title: 'account_group',
                options: [
                  { value: 'All', label: 'All' },
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
                label: 'FCy',
                title: 'fcy',
                options: [{ label: 'All', value: 'all' }, ...currencyOptions],
              },
            ]}
            dateFilters={[{ label: 'Date Range', title: 'date', type: 'date' }]}
          >
            {(tableData?.accounts?.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={accountTurnoverReportHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {tableData?.accounts?.map((item, index) => (
                  <tr key={index}>
                    <td>{item.ledger}</td>
                    <td>{item.account}</td>
                    <td>{item.contact_no}</td>
                    <td>{item.fcy}</td>
                    <td>{item.balance_brf}</td>
                    <td>{item.total_debit}</td>
                    <td>{item.total_credit}</td>
                    <td>{item.balance_crf}</td>
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

export default withFilters(AccountTurnOverReport);
