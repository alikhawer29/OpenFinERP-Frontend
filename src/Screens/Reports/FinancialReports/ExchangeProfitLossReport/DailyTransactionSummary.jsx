import React, { useEffect, useRef, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { dailyTransactionSummaryHeaders } from '../../../../Utils/Constants/TableHeaders';
import CustomButton from '../../../../Components/CustomButton';
import CustomTable from '../../../../Components/CustomTable/CustomTable';
import BackButton from '../../../../Components/BackButton';
import {
  downloadFileWithId,
  formatDate,
  formatNumberForDisplay,
  getCurrencyOptions,
  reportPrintWithId,
} from '../../../../Utils/Utils';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { getDailyTransactionSummaryData } from '../../../../Services/Reports/OutwardRemittanceReport';
import useModulePermissions from '../../../../Hooks/useModulePermissions';

const DailyTransactionSummary = () => {
  const [tableData, setTableData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const permissions = useModulePermissions('reports', 'exchange_profit_loss');
  const { allowToExcel, allowToPdf } = permissions;
  const currencyOptions = getCurrencyOptions();

  const [searchParams] = useSearchParams();
  const urlData = Object.fromEntries(searchParams.entries());

  const location = useLocation();
  const { state } = location;

  // Get currency name from currency_id
  const getCurrencyName = () => {
    const currencyId =
      state?.currency_id || urlData?.currency_id || tableData?.currency;
    const currencyName = state?.currency || urlData?.currency;

    // If currency name is already provided, use it
    if (currencyName) {
      return currencyName;
    }

    // Otherwise, find it from currencyOptions
    if (currencyId && currencyOptions) {
      const currencyOption = currencyOptions.find(
        (opt) =>
          opt.value === parseInt(currencyId) ||
          opt.value === currencyId ||
          opt.label === currencyId
      );
      return currencyOption?.label || currencyId || 'Currency';
    }

    return currencyId || tableData?.currency || 'Currency';
  };

  const { mutate, isError } = useMutation({
    mutationFn: async (params) => {
      const response = await getDailyTransactionSummaryData(params);
      return response;
    },
    onSuccess: (data) => {
      setIsLoading(false);
      setTableData(data);
    },
    onError: (error) => {
      console.error(error);
      setIsLoading(false);
    },
  });

  const summaryRow = (
    <tr key="daily-summary" className="table-summary-row">
      <td>
        <strong>Total</strong>
      </td>
      <td>
        {tableData?.grand_total?.total_opening
          ? formatNumberForDisplay(tableData?.grand_total?.total_opening, 2)
          : '-'}
      </td>
      <td colSpan={1}></td>
      <td>
        {tableData?.grand_total?.total_buy
          ? formatNumberForDisplay(tableData?.grand_total?.total_buy, 2)
          : '-'}
      </td>
      <td colSpan={1}></td>
      <td>
        {tableData?.grand_total?.total_sell
          ? formatNumberForDisplay(tableData?.grand_total?.total_sell, 2)
          : '-'}
      </td>
      <td colSpan={1}></td>
      <td>
        {tableData?.grand_total?.total_closing
          ? formatNumberForDisplay(tableData?.grand_total?.total_closing, 2)
          : '-'}
      </td>
      <td colSpan={1}></td>
      <td>
        {tableData?.grand_total?.total_sale_value_in_dhs
          ? formatNumberForDisplay(
              tableData?.grand_total?.total_sale_value_in_dhs,
              2
            )
          : '-'}
      </td>
      <td>
        {tableData?.grand_total?.total_cost_of_sale_in_dhs
          ? formatNumberForDisplay(
              tableData?.grand_total?.total_cost_of_sale_in_dhs,
              2
            )
          : '-'}
      </td>
      <td
        style={{
          color:
            tableData?.grand_total?.total_difference &&
            parseFloat(tableData?.grand_total?.total_difference) < 0
              ? 'red'
              : 'inherit',
        }}
      >
        {tableData?.grand_total?.total_difference
          ? formatNumberForDisplay(tableData?.grand_total?.total_difference, 2)
          : '-'}
      </td>
    </tr>
  );

  const lastParamsRef = useRef(null);

  useEffect(() => {
    const paramsToSend = { ...urlData, ...(state || {}) };
    const paramsString = JSON.stringify(paramsToSend);

    if (paramsString !== lastParamsRef.current) {
      mutate(paramsToSend);
      lastParamsRef.current = paramsString;
    }
  }, [urlData, state]);

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <section>
      <div className="d-flex justify-content-between flex-wrap mb-3">
        <div className="d-flex flex-column gap-2 mb-4">
          <BackButton onClick={handleBack} />
          <h2 className="screen-title m-0 d-inline">
            Daily Transaction Summary for {getCurrencyName()}
          </h2>
        </div>
        <div className="d-flex gap-3 flex-wrap">
          {allowToExcel && (
            <CustomButton
              text={'Export to Excel'}
              variant={'secondaryButton'}
              onClick={() => {
                const currencyId = state?.currency_id || urlData?.currency_id;
                downloadFileWithId(
                  'exchange-profit-loss/currency',
                  'xlsx',
                  currencyId
                );
              }}
            />
          )}
          {allowToPdf && (
            <CustomButton
              text={'Export to PDF'}
              variant={'secondaryButton'}
              onClick={() => {
                const currencyId = state?.currency_id || urlData?.currency_id;
                downloadFileWithId(
                  'exchange-profit-loss/currency',
                  'pdf',
                  currencyId
                );
              }}
            />
          )}
          <CustomButton
            text={'Print'}
            onClick={() => {
              const currencyId = state?.currency_id || urlData?.currency_id;
              reportPrintWithId('exchange-profit-loss/currency', currencyId);
            }}
          />
        </div>
      </div>
      <Row>
        <Col xs={12}>
          <CustomTable
            headers={dailyTransactionSummaryHeaders}
            pagination={false}
            isLoading={isLoading}
            summaryRows={summaryRow}
            isPaginated={false}
            hideSearch
            hideFilters
          >
            {(tableData?.data?.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={dailyTransactionSummaryHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {tableData?.data?.map((item, index) => (
                  <tr key={index}>
                    <td>{formatDate(item.date)}</td>
                    <td>
                      {item.opening
                        ? formatNumberForDisplay(item.opening, 2)
                        : '-'}
                    </td>
                    <td>
                      {item.avg_open_rate
                        ? formatNumberForDisplay(item.avg_open_rate, 8)
                        : '-'}
                    </td>
                    <td>
                      {item.buy ? formatNumberForDisplay(item.buy, 2) : '-'}
                    </td>
                    <td>
                      {item.avg_buy_rate
                        ? formatNumberForDisplay(item.avg_buy_rate, 8)
                        : '-'}
                    </td>
                    <td>
                      {item.sell ? formatNumberForDisplay(item.sell, 2) : '-'}
                    </td>
                    <td>
                      {item.avg_sell_rate
                        ? formatNumberForDisplay(item.avg_sell_rate, 8)
                        : '-'}
                    </td>
                    <td>
                      {item.closing
                        ? formatNumberForDisplay(item.closing, 2)
                        : '-'}
                    </td>
                    <td>
                      {item.avg_closing_rate
                        ? formatNumberForDisplay(item.avg_closing_rate, 8)
                        : '-'}
                    </td>
                    <td>
                      {item.sale_value_in_dhs
                        ? formatNumberForDisplay(item.sale_value_in_dhs, 2)
                        : '-'}
                    </td>
                    <td>
                      {item.cost_of_sale_in_dhs
                        ? formatNumberForDisplay(item.cost_of_sale_in_dhs, 2)
                        : '-'}
                    </td>
                    <td
                      style={{
                        color:
                          item.difference && parseFloat(item.difference) < 0
                            ? 'red'
                            : 'inherit',
                      }}
                    >
                      {item.difference
                        ? formatNumberForDisplay(item.difference, 2)
                        : '-'}
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

export default DailyTransactionSummary;
