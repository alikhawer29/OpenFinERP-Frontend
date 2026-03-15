import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import BackButton from '../../../../Components/BackButton';
import CustomButton from '../../../../Components/CustomButton';
import CustomTable from '../../../../Components/CustomTable/CustomTable';
import withFilters from '../../../../HOC/withFilters ';
import useModulePermissions from '../../../../Hooks/useModulePermissions';
import { getEchangeProfitAndLossData } from '../../../../Services/Reports/OutwardRemittanceReport';
import {
  exchangeProfitLossReportHeaders,
  exchangeProfitLossReportHeadersForCombine,
} from '../../../../Utils/Constants/TableHeaders';
import {
  downloadFile,
  formatNumberForDisplay,
  getCurrencyOptions,
  reportPrint,
  showErrorToast,
} from '../../../../Utils/Utils';
import { formatNumberWithCommas } from '../../../../Utils/Helpers';
import { usePageTitle } from '../../../../Hooks/usePageTitle';
import { useQuery } from '@tanstack/react-query';

const ExchangeProfitLossReport = ({ filters, setFilters, pagination }) => {
  usePageTitle('Exchange Profit Loss Report');
  const currencyOptions = getCurrencyOptions();
  const navigate = useNavigate();

  const permissions = useModulePermissions('reports', 'exchange_profit_loss');
  const { allowToExcel, allowToPdf } = permissions;

  const [searchParams] = useSearchParams();
  const urlData = Object.fromEntries(searchParams.entries());

  const location = useLocation();
  const { state } = location;

  const handleCurrencyClick = (currency, currencyId) => {
    // Find currency ID from currencyOptions if not provided
    const currencyOption = currencyOptions.find(
      (opt) => opt.label === currency || opt.value === currency
    );
    const finalCurrencyId = currencyId || currencyOption?.value || currency;

    navigate('/reports/exchange-profit-loss-report/daily-transaction-summary', {
      state: {
        currency_id: finalCurrencyId,
        currency: currency,
        period_from:
          filters?.period_from || state?.period_from || urlData?.period_from,
        period_to: filters?.period_to || state?.period_to || urlData?.period_to,
        report_type:
          filters?.report_type || state?.report_type || urlData?.report_type,
      },
    });
  };

  const {
    data: exchangeProfitLossData,
    isLoading: isLoadingExchangeProfitLoss,
    isError: isErrorExchangeProfitLoss,
    error: errorExchangeProfitLoss,
  } = useQuery({
    queryKey: ['exchangeProfitLoss', filters],
    queryFn: () => getEchangeProfitAndLossData(filters),
    refetchOnWindowFocus: true,
    retry: 1,
  });
  if (isErrorExchangeProfitLoss) {
    showErrorToast(
      errorExchangeProfitLoss || 'Unable to fetch data at this time'
    );
  }

  const summaryRow = (
    <tr key="tmn-summary" className="table-summary-row">
      <td>
        <strong>Total</strong>
      </td>
      <td colSpan={4}></td>
      <td>
        {exchangeProfitLossData?.grand_total?.total_buy
          ? formatNumberWithCommas(
              exchangeProfitLossData?.grand_total?.total_buy
            )
          : '-'}
      </td>
      <td colSpan={1}></td>
      <td>
        {exchangeProfitLossData?.grand_total?.buy_in_lc
          ? formatNumberWithCommas(
              exchangeProfitLossData?.grand_total?.buy_in_lc
            )
          : '-'}
      </td>
      <td>
        {exchangeProfitLossData?.grand_total?.total_sell
          ? formatNumberWithCommas(
              exchangeProfitLossData?.grand_total?.total_sell
            )
          : '-'}
      </td>
      <td colSpan={1}></td>
      <td>
        {exchangeProfitLossData?.grand_total?.sell_in_lc
          ? formatNumberWithCommas(
              exchangeProfitLossData?.grand_total?.sell_in_lc
            )
          : '-'}
      </td>
      <td colSpan={3}></td>
      <td>
        {exchangeProfitLossData?.grand_total?.sell_in_lc
          ? formatNumberWithCommas(
              exchangeProfitLossData?.grand_total?.sell_in_lc
            )
          : '-'}
      </td>
      <td>
        {exchangeProfitLossData?.grand_total?.cost_of_sale_in_lc
          ? formatNumberWithCommas(
              exchangeProfitLossData?.grand_total?.cost_of_sale_in_lc
            )
          : '-'}
      </td>
      {/* {tableData?.data?.length && tableData?.data[0]?.type === 'Exchange' ? (
        <td colSpan={1}></td>
      ) : null} */}
      <td>
        {exchangeProfitLossData?.grand_total?.profit_loss_in_lc
          ? formatNumberWithCommas(
              exchangeProfitLossData?.grand_total?.profit_loss_in_lc
            )
          : '-'}
      </td>
    </tr>
  );

  const lastParamsRef = useRef(null);
  const filtersInitializedRef = useRef(false);

  useEffect(() => {
    if (state) {
      setFilters(() => ({
        ...state,
      }));
      filtersInitializedRef.current = true;
    } else {
      // If no state, mark as initialized anyway to prevent blocking
      filtersInitializedRef.current = true;
    }
  }, []);

  useEffect(() => {
    // Wait for filters to be initialized
    if (!filtersInitializedRef.current) {
      return;
    }

    // Use state directly if available, otherwise use filters
    // This ensures we use the correct values from navigation state
    const effectiveFilters = state || filters;
    const paramsToSend = { ...urlData, ...effectiveFilters };

    // Only proceed if we have the required report parameters
    // This prevents the initial call with empty default filters
    const hasRequiredParams =
      paramsToSend.report_type &&
      paramsToSend.period_from &&
      paramsToSend.period_to;

    if (!hasRequiredParams) {
      return;
    }

    const paramsString = JSON.stringify(paramsToSend);

    if (paramsString !== lastParamsRef.current) {
      // mutate(paramsToSend);
      // mutate(paramsToSend);
      lastParamsRef.current = paramsString;
    }
  }, [urlData, filters, state]);

  // Helper function to get current params for download
  const getDownloadParams = () => {
    const effectiveFilters = state || filters;
    return { ...urlData, ...effectiveFilters };
  };

  return (
    <section>
      <div className="d-flex justify-content-between flex-wrap mb-3">
        <div className="d-flex flex-column gap-2 mb-4">
          <BackButton />
          <h2 className="screen-title m-0 d-inline">
            Exchange Profit & Loss Report
          </h2>
        </div>
        <div className="d-flex gap-3 flex-wrap">
          {allowToExcel && (
            <CustomButton
              text={'Export to Excel'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile(
                  'exchange-profit-loss',
                  'xlsx',
                  getDownloadParams()
                );
              }}
            />
          )}
          {allowToPdf && (
            <CustomButton
              text={'Export to PDF'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile(
                  'exchange-profit-loss',
                  'pdf',
                  getDownloadParams()
                );
              }}
            />
          )}
          <CustomButton
            text={'Print'}
            onClick={() => {
              reportPrint('exchange-profit-loss', getDownloadParams());
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
              exchangeProfitLossData?.data?.length &&
              exchangeProfitLossData?.data[0]?.type === 'Exchange'
                ? exchangeProfitLossReportHeadersForCombine
                : exchangeProfitLossReportHeaders
            }
            pagination={pagination}
            isLoading={isLoadingExchangeProfitLoss}
            summaryRows={summaryRow}
            isPaginated={false}
            hideSearch
          >
            {(exchangeProfitLossData?.data?.length ||
              isErrorExchangeProfitLoss) && (
              <tbody>
                {isErrorExchangeProfitLoss && (
                  <tr>
                    <td colSpan={exchangeProfitLossReportHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {exchangeProfitLossData?.data?.map((item, index) => (
                  <tr key={index}>
                    <td>{item.type}Exchange</td>
                    <td>
                      <span
                        style={{
                          cursor: 'pointer',
                          color: '#007bff',
                          textDecoration: 'underline',
                        }}
                        onClick={() =>
                          handleCurrencyClick(item.currency, item.currency_id)
                        }
                        title="Click to view daily transaction summary"
                      >
                        {item.currency}
                      </span>
                    </td>
                    <td>
                      {item.opening_bal
                        ? formatNumberWithCommas(item.opening_bal)
                        : ''}
                    </td>
                    <td>
                      {item.open_rate
                        ? formatNumberForDisplay(item.open_rate, 8)
                        : ''}
                    </td>
                    <td>
                      {item.open_in_lc
                        ? formatNumberWithCommas(item.open_in_lc)
                        : ''}
                    </td>
                    <td>
                      {item.total_buy
                        ? formatNumberWithCommas(item.total_buy)
                        : ''}
                    </td>
                    <td>
                      {item.avg_buy_rate
                        ? formatNumberForDisplay(item.avg_buy_rate, 8)
                        : ''}
                    </td>
                    <td>
                      {item.buy_in_lc
                        ? formatNumberWithCommas(item.buy_in_lc)
                        : ''}
                    </td>
                    <td>
                      {item.total_sell
                        ? formatNumberWithCommas(item.total_sell)
                        : ''}
                    </td>
                    <td>
                      {item.avg_sell_rate
                        ? formatNumberForDisplay(item.avg_sell_rate, 8)
                        : ''}
                    </td>
                    <td>
                      {item.sell_in_lc
                        ? formatNumberWithCommas(item.sell_in_lc)
                        : ''}
                    </td>
                    <td>
                      {item.closing_bal
                        ? formatNumberWithCommas(item.closing_bal)
                        : ''}
                    </td>
                    <td>
                      {item.avg_close_lc
                        ? formatNumberForDisplay(item.avg_close_lc, 8)
                        : ''}
                    </td>
                    <td>
                      {item.close_in_lc
                        ? formatNumberWithCommas(item.close_in_lc)
                        : ''}
                    </td>
                    <td>
                      {item.sale_value_in_lc
                        ? formatNumberWithCommas(item.sale_value_in_lc)
                        : ''}
                    </td>
                    <td>
                      {item.cost_of_sale_in_lc
                        ? formatNumberWithCommas(item.cost_of_sale_in_lc)
                        : ''}
                    </td>
                    <td>
                      {item.profit_loss_in_lc
                        ? formatNumberWithCommas(item.profit_loss_in_lc)
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

export default withFilters(ExchangeProfitLossReport);
