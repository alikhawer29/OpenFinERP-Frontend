import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { useLocation, useSearchParams } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import withFilters from '../../../HOC/withFilters ';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import { getDealRegisterReport } from '../../../Services/Reports/OutwardRemittanceReport';
import { ledgerOptions } from '../../../Utils/Constants/SelectOptions';
import { dealRegisterReportHeaders } from '../../../Utils/Constants/TableHeaders';
import {
  downloadFile,
  getCurrencyOptions,
  reportPrint,
  showErrorToast,
} from '../../../Utils/Utils';

const DealRegisterReport = ({
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  const [tableData, setTableData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const currencyOptions = getCurrencyOptions();
  const [searchParams] = useSearchParams();
  const urlData = Object.fromEntries(searchParams.entries());

  const permissions = useModulePermissions('reports', 'deal_register_report');
  const { view, allowToExcel, allowToPdf } = permissions;

  const {
    data: dealRegisterReportData,
    isLoading: isLoadingDealRegisterReport,
    isError: isErrorDealRegisterReport,
    error: errorDealRegisterReport,
  } = useQuery({
    queryKey: ['dealRegisterReport', filters],
    queryFn: () => getDealRegisterReport(filters),
    refetchOnWindowFocus: true,
    retry: 1,
  });

  if (isErrorDealRegisterReport) {
    showErrorToast(
      errorDealRegisterReport || 'Unable to fetch data at this time'
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

  useEffect(() => {
    const paramsToSend = { ...urlData, ...filters };
    const paramsString = JSON.stringify(paramsToSend);

    if (paramsString !== lastParamsRef.current) {
      // mutate(paramsToSend);
      lastParamsRef.current = paramsString;
    }
  }, [urlData, filters]);

  const summaryRow = dealRegisterReportData?.totals?.map((item, index) => {
    return (
      <>
        <tr key={index++} className="table-summary-row">
          <td>
            <strong>Total</strong>
          </td>
          <td>{item?.currency}</td>
          <td>{item?.buy_amount}</td>
          <td></td>
          <td>{item?.sell_amount}</td>
          <td colSpan={7}></td>
        </tr>
      </>
    );
  });

  return (
    <section>
      <div className="d-flex justify-content-between flex-wrap mb-3">
        <div className="d-flex flex-column">
          <BackButton />
          <h2 className="screen-title m-0 d-inline">Deal Register Report</h2>
        </div>
        <div className="d-flex gap-3 flex-wrap">
          {allowToExcel && (
            <CustomButton
              text={'Export to Excel'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile('deal-register-report', 'xlsx');
              }}
            />
          )}
          {allowToPdf && (
            <CustomButton
              text={'Export to PDF'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile('deal-register-report', 'pdf');
              }}
            />
          )}
          <CustomButton
            text={'Print'}
            onClick={() => {
              reportPrint('deal-register-report');
            }}
          />
        </div>
      </div>
      <Row>
        <Col xs={12}>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={dealRegisterReportHeaders}
            pagination={pagination}
            isPaginated={false}
            isLoading={isLoadingDealRegisterReport}
            hideSearch
            summaryRows={summaryRow} // Extra Rows
            selectOptions={[
              {
                title: 'ledger',
                label: 'Ledger',
                options: [{ label: 'All', value: 'all' }, ...ledgerOptions],
              },
              {
                title: 'fcy',
                label: 'FCy',
                options: [{ label: 'All', value: 'all' }, ...currencyOptions],
              },
              {
                title: 'sort_by',
                label: 'Sort By',
                options: [
                  { value: 'date', label: 'Date' },
                  { value: 'account', label: 'Account' },
                ],
              },
            ]}
            dateFilters={[{ title: 'date', label: 'Date Range' }]}
          >
            {(dealRegisterReportData?.data?.length ||
              isErrorDealRegisterReport) && (
              <tbody>
                {isErrorDealRegisterReport && (
                  <tr>
                    <td colSpan={dealRegisterReportHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {dealRegisterReportData?.data?.map((item, index) => (
                  <tr key={index++}>
                    <td>{item.account}</td>
                    <td>{item.buy_fcy}</td>
                    <td>{item.buy_fc_amount}</td>
                    <td>{item.sell_fcy}</td>
                    <td>{item.sell_fc_amount}</td>
                    <td>{item.rate}</td>
                    <td>{item.convert_rate}</td>
                    <td>{item.tran_no}</td>
                    <td>{item.value_date}</td>
                    <td>{item.user_id}</td>
                    <td>{item.date}</td>
                    <td>{item.time}</td>
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

export default withFilters(DealRegisterReport);
