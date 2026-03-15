import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useRef } from 'react';
import { Col, Row } from 'react-bootstrap';
import { useLocation, useSearchParams } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import withFilters from '../../../HOC/withFilters ';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { profitAndLossStatementReport } from '../../../Services/Reports/OutwardRemittanceReport';
import { financialReportHeaders } from '../../../Utils/Constants/TableHeaders';
import {
  downloadFile,
  formatNumberForDisplay,
  reportPrint,
  showErrorToast,
} from '../../../Utils/Utils';

const ProfitLossStatement = ({ filters, setFilters, pagination }) => {
  usePageTitle('Profit & Loss Statement');
  const getBackgroundColor = (level) => {
    if (level === 1) return '#FFF4E0';
    if (level === 2) return '#81FFEB';
    if (level === 3) return '#FFBCBC';
    if (level === 4) return '#F7C8FF';
    return 'unset';
  };

  const [searchParams] = useSearchParams();
  const urlData = Object.fromEntries(searchParams.entries());

  const permissions = useModulePermissions('reports', 'profit_loss_statement');
  const { allowToExcel, allowToPdf } = permissions;

  const {
    data: profitAndLossStatementData,
    isLoading: isLoadingProfitAndLossStatement,
    isError: isErrorProfitAndLossStatement,
    error: errorProfitAndLossStatement,
  } = useQuery({
    queryKey: ['profitAndLossStatement', filters],
    queryFn: () => profitAndLossStatementReport(filters),
    refetchOnWindowFocus: true,
    retry: 1,
  });

  if (isErrorProfitAndLossStatement) {
    showErrorToast(
      errorProfitAndLossStatement || 'Unable to fetch data at this time'
    );
  }

  const lastParamsRef = useRef(null);
  const { state } = useLocation();

  useEffect(() => {
    if (state) {
      setFilters((prev) => ({
        ...prev,
        ...state,
      }));
    }
  }, [state]);

  const summaryRows = (
    <>
      <tr className="table-summary-row">
        <td>Total</td>
        <td></td>
        <td></td>
        <td></td>
        <td>
          {profitAndLossStatementData?.summary?.total_debit
            ? formatNumberForDisplay(
                profitAndLossStatementData?.summary?.total_debit,
                2
              )
            : ''}
        </td>
        <td>
          {profitAndLossStatementData?.summary?.total_credit
            ? formatNumberForDisplay(
                profitAndLossStatementData?.summary?.total_credit,
                2
              )
            : ''}
        </td>
      </tr>
      <tr className="table-summary-row">
        <td>Net {profitAndLossStatementData?.net_profit_loss?.is_profit}</td>
        <td></td>
        <td></td>
        <td></td>
        <td>
          {profitAndLossStatementData?.net_profit_loss?.lc_debit
            ? formatNumberForDisplay(
                profitAndLossStatementData?.net_profit_loss?.lc_debit,
                2
              )
            : ''}
        </td>
        <td>
          {profitAndLossStatementData?.net_profit_loss?.lc_credit
            ? formatNumberForDisplay(
                profitAndLossStatementData?.net_profit_loss?.lc_credit,
                2
              )
            : ''}
        </td>
      </tr>
      <tr className="table-summary-row">
        <td>Grand Total</td>
        <td></td>
        <td></td>
        <td></td>
        <td>
          {profitAndLossStatementData?.summary?.grand_total_debit
            ? formatNumberForDisplay(
                profitAndLossStatementData?.summary?.grand_total_debit,
                2
              )
            : ''}
        </td>
        <td>
          {profitAndLossStatementData?.summary?.grand_total_credit
            ? formatNumberForDisplay(
                profitAndLossStatementData?.summary?.grand_total_credit,
                2
              )
            : ''}
        </td>
      </tr>
    </>
  );

  useEffect(() => {
    const paramsToSend = { ...urlData, ...filters };
    const paramsString = JSON.stringify(paramsToSend);

    if (paramsString !== lastParamsRef.current) {
      // mutate(paramsToSend);
      lastParamsRef.current = paramsString;
    }
  }, [urlData, filters]);
  return (
    <section>
      <div className="d-flex justify-content-between flex-wrap mb-3">
        <div className="d-flex flex-column">
          <BackButton />
          <h2 className="screen-title mb-0">Profit & Loss Statement</h2>
        </div>

        <div className="d-flex gap-3 flex-wrap">
          {allowToExcel && (
            <CustomButton
              text={'Export to Excel'}
              variant={'secondaryButton'}
              onClick={() => {
                const params = {
                  date_from: filters.date_from,
                  date_to: filters.date_to,
                };
                downloadFile('profit-loss-statement', 'xlsx', params);
              }}
            />
          )}
          {allowToPdf && (
            <CustomButton
              text={'Export to PDF'}
              variant={'secondaryButton'}
              onClick={() => {
                const params = {
                  date_from: filters.date_from,
                  date_to: filters.date_to,
                };
                downloadFile('profit-loss-statement', 'pdf', params);
              }}
            />
          )}
          <CustomButton
            text={'Print'}
            onClick={() => {
              const params = {
                date_from: filters.date_from,
                date_to: filters.date_to,
              };
              reportPrint('profit-loss-statement', params);
            }}
          />
        </div>
      </div>
      <Row>
        <Col xs={12}>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            isLoading={isLoadingProfitAndLossStatement}
            headers={financialReportHeaders}
            isPaginated={false}
            hideSearch
            summaryRows={summaryRows}
            hideItemsPerPage
            dateFilters={[{ title: 'date', label: 'Date Range' }]}
          >
            {(profitAndLossStatementData?.accounts?.length ||
              isErrorProfitAndLossStatement) && (
              <tbody>
                {isErrorProfitAndLossStatement && (
                  <tr>
                    <td colSpan={financialReportHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {profitAndLossStatementData?.accounts?.map((item, index) => (
                  <tr
                    key={index}
                    style={{
                      // backgroundColor: getBackgroundColor(item.level),
                      fontWeight:
                        item.type === 'account_header' ||
                        item.type === 'main_account' ||
                        item.type === 'total'
                          ? 'bold'
                          : 'normal',
                      fontSize:
                        item.type === 'account_header' ||
                        item.type === 'main_account'
                          ? '1.5rem'
                          : '1rem',
                    }}
                  >
                    <td>
                      {item.account_code} - {item.account_name}
                    </td>
                    <td>{item.fcy ?? ''}</td>
                    <td>{formatNumberForDisplay(item.fc_debit, 2) ?? ''}</td>
                    <td>{formatNumberForDisplay(item.fc_credit, 2) ?? ''}</td>
                    <td>
                      {item.lc_debit
                        ? formatNumberForDisplay(item.lc_debit, 2)
                        : ''}
                    </td>
                    <td>
                      {item.lc_credit
                        ? formatNumberForDisplay(item.lc_credit, 2)
                        : ''}
                    </td>
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

export default withFilters(ProfitLossStatement);
