import React, { useEffect, useState } from 'react';
import BackButton from '../../../../Components/BackButton';
import CustomButton from '../../../../Components/CustomButton';
import CustomTable from '../../../../Components/CustomTable/CustomTable';
import { Col, Row } from 'react-bootstrap';
import { currencyTransferRegisterReportHeaders } from '../../../../Utils/Constants/TableHeaders';
import withFilters from '../../../../HOC/withFilters ';
import { getCurrencyTransferRegisterReport } from '../../../../Services/Reports/CurrencyTransferRegisterReport';
import { useFetchTableData } from '../../../../Hooks/useTable';
import { ledgerOptions } from '../../../../Utils/Constants/SelectOptions';
import useAccountsByType from '../../../../Hooks/useAccountsByType';
import { getCurrencies } from '../../../../Services/Transaction/JournalVoucher';
import { useQuery } from '@tanstack/react-query';
import { downloadFile, reportPrint } from '../../../../Utils/Utils';
import { useLocation } from 'react-router-dom';
import useModulePermissions from '../../../../Hooks/useModulePermissions';
import { usePageTitle } from '../../../../Hooks/usePageTitle';

const GeneratedCurrencyTransferRegisterReport = ({
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Currency Transfer Register Report');
  const [selectedItem, setSelectedItem] = useState(null);
  const location = useLocation();
  const { state } = location;

  const permissions = useModulePermissions(
    'reports',
    'currency_transfer_register_report'
  );
  const { allowToExcel, allowToPdf } = permissions;

  const {
    data: generateCurrencyTransferRegisterReport,
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'getCurrencyTransferRegisterReport',
    filters,
    updatePagination,
    getCurrencyTransferRegisterReport
  );

  const { data: currencies = [] } = useQuery({
    queryKey: ['currenciesTypes'],
    queryFn: getCurrencies,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const tableData = generateCurrencyTransferRegisterReport?.data || [];

  useEffect(() => {
    setFilters(() => ({
      ...state,
    }));
  }, []);

  return (
    <section>
      <div className="d-flex justify-content-between flex-wrap mb-3">
        <div className="d-flex flex-column gap-2 mb-4">
          <BackButton />
          <h2 className="screen-title m-0 d-inline">TRQ Report</h2>
        </div>
        <div className="d-flex gap-3 flex-wrap">
          {allowToExcel && (
            <CustomButton
              text={'Export to Excel'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile('currency-transfer-register-report', 'xlsx');
              }}
            />
          )}
          {allowToPdf && (
            <CustomButton
              text={'Export to PDF'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile('currency-transfer-register-report', 'pdf');
              }}
            />
          )}
          <CustomButton
            text={'Print'}
            onClick={() => {
              reportPrint('currency-transfer-register-report');
            }}
          />
        </div>
      </div>
      <Row>
        <Col xs={12}>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={currencyTransferRegisterReportHeaders}
            pagination={pagination}
            isLoading={isLoading}
            hideSearch
          >
            {(tableData?.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={currencyTransferRegisterReportHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {tableData?.map((item, index) => (
                  <tr key={index++} onClick={() => setSelectedItem(item)}>
                    <td>{item.tran_no}</td>
                    <td>{item.date}</td>
                    <td>{item.time}</td>
                    <td>{item.from_account}</td>
                    <td>{item.to_account}</td>
                    <td>{item.currency}</td>
                    <td>{item.amount}</td>
                    <td>{item.narration}</td>
                    <td>{item.net_total}</td>
                    <td>{item.doc_type}</td>
                    <td>{item.doc_no}</td>
                    <td>{item.bank}</td>
                    <td>{item.city}</td>
                    <td>{item.code}</td>
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

export default withFilters(GeneratedCurrencyTransferRegisterReport);
