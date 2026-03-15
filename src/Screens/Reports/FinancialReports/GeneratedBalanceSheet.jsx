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
import { getBalanceSheetReport } from '../../../Services/Reports/OutwardRemittanceReport';
import { financialReportHeaders } from '../../../Utils/Constants/TableHeaders';
import {
  downloadFile,
  formatNumberForDisplay,
  reportPrint,
  showErrorToast,
} from '../../../Utils/Utils';

const BalanceSheet = ({ filters, setFilters, pagination }) => {
  usePageTitle('Balance Sheet');
  const [searchParams] = useSearchParams();
  const { state } = useLocation();

  const getBackgroundColor = (level) => {
    if (level === 1) return '#FFF4E0';
    if (level === 2) return '#81FFEB';
    if (level === 3) return '#FFBCBC';
    if (level === 4) return '#F7C8FF';
    return 'unset';
  };

  const urlData = Object.fromEntries(searchParams.entries());

  const permissions = useModulePermissions('reports', 'balance_sheet');
  const { allowToExcel, allowToPdf } = permissions;

  const {
    data: balanceSheetData,
    isLoading: isLoadingBalanceSheet,
    isError: isErrorBalanceSheet,
    error: errorBalanceSheet,
  } = useQuery({
    queryKey: ['balanceSheet', filters],
    queryFn: () => getBalanceSheetReport(filters),
    refetchOnWindowFocus: true,
    retry: 1,
  });

  if (isErrorBalanceSheet) {
    showErrorToast(errorBalanceSheet || 'Unable to fetch data at this time');
  }

  const lastParamsRef = useRef(null);

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
          {balanceSheetData?.summary?.total_debit &&
            formatNumberForDisplay(balanceSheetData?.summary?.total_debit, 2)}
        </td>
        <td>
          {balanceSheetData?.summary?.total_credit &&
            formatNumberForDisplay(balanceSheetData?.summary?.total_credit, 2)}
        </td>
      </tr>
      <tr className="table-summary-row">
        <td>Net {balanceSheetData?.net_profit_loss?.is_profit}</td>
        <td></td>
        <td></td>
        <td></td>
        <td>
          {balanceSheetData?.net_profit_loss?.is_profit === 'Loss' &&
            balanceSheetData?.net_profit_loss?.net_profit_loss &&
            formatNumberForDisplay(
              Math.abs(balanceSheetData.net_profit_loss.net_profit_loss),
              2
            )}
        </td>

        <td>
          {balanceSheetData?.net_profit_loss?.is_profit === 'Profit' &&
            balanceSheetData?.net_profit_loss?.net_profit_loss &&
            formatNumberForDisplay(
              Math.abs(balanceSheetData.net_profit_loss.net_profit_loss),
              2
            )}
        </td>
      </tr>
      <tr className="table-summary-row">
        <td>Grand Total</td>
        <td></td>
        <td></td>
        <td></td>
        <td>
          {balanceSheetData?.summary?.grand_total_lc_debit &&
            formatNumberForDisplay(
              balanceSheetData?.summary?.grand_total_lc_debit,
              2
            )}
        </td>
        <td>
          {balanceSheetData?.summary?.grand_total_lc_credit &&
            formatNumberForDisplay(
              balanceSheetData?.summary?.grand_total_lc_credit,
              2
            )}
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
          <h2 className="screen-title mb-0">Balance Sheet</h2>
        </div>

        <div className="d-flex gap-3 flex-wrap">
          {allowToExcel && (
            <CustomButton
              text={'Export to Excel'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile('balance-sheet', 'xlsx');
              }}
            />
          )}
          {allowToPdf && (
            <CustomButton
              text={'Export to PDF'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile('balance-sheet', 'pdf');
              }}
            />
          )}
          <CustomButton
            text={'Print'}
            onClick={() => {
              reportPrint('balance-sheet');
            }}
          />
        </div>
      </div>
      <Row>
        <Col xs={12}>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            isLoading={isLoadingBalanceSheet}
            headers={financialReportHeaders}
            isPaginated={false}
            summaryRows={summaryRows}
            hideSearch
            additionalFilters={[{ title: 'Date', type: 'date' }]}
            hideItemsPerPage
          >
            {(balanceSheetData?.accounts?.length || isErrorBalanceSheet) && (
              <tbody>
                {isErrorBalanceSheet && (
                  <tr>
                    <td colSpan={financialReportHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {balanceSheetData?.accounts?.map((item, index) => (
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
                    }}
                  >
                    <td>
                      {item.account_code}-{item.account_name}
                    </td>
                    <td>{item.fcy ?? ''}</td>
                    <td>
                      {item.fc_debit && item.fc_debit !== 0
                        ? formatNumberForDisplay(item?.fc_debit, 2)
                        : ''}
                    </td>
                    <td>
                      {item.fc_credit && item.fc_credit !== 0
                        ? formatNumberForDisplay(item?.fc_credit, 2)
                        : ''}
                    </td>
                    <td>
                      {item.lc_debit && item.lc_debit !== 0
                        ? formatNumberForDisplay(item?.lc_debit, 2)
                        : ''}
                    </td>
                    <td>
                      {item.lc_credit && item.lc_credit !== 0
                        ? formatNumberForDisplay(item?.lc_credit, 2)
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

export default withFilters(BalanceSheet);
