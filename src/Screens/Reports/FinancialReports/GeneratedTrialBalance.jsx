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
import { getTrialBalanceReport } from '../../../Services/Reports/OutwardRemittanceReport';
import { financialReportHeaders } from '../../../Utils/Constants/TableHeaders';
import {
  downloadFile,
  formatNumberForDisplay,
  reportPrint,
  showErrorToast,
} from '../../../Utils/Utils';

const TrialBalance = ({ filters, setFilters, pagination }) => {
  usePageTitle('Trial Balance');
  const [searchParams] = useSearchParams();
  const urlData = Object.fromEntries(searchParams.entries());

  const permissions = useModulePermissions('reports', 'trial_balance');
  const { allowToExcel, allowToPdf } = permissions;

  const {
    data: trialBalanceData,
    isLoading: isLoadingTrialBalance,
    isError: isErrorTrialBalance,
    error: errorTrialBalance,
  } = useQuery({
    queryKey: ['trialBalance', filters],
    queryFn: () => getTrialBalanceReport(filters),
    refetchOnWindowFocus: true,
    retry: 1,
  });

  if (isErrorTrialBalance) {
    showErrorToast(errorTrialBalance || 'Unable to fetch data at this time');
  }

  const getBackgroundColor = (level) => {
    if (level === 1) return '#FFF4E0';
    if (level === 2) return '#81FFEB';
    if (level === 3) return '#FFBCBC';
    if (level === 4) return '#F7C8FF';
    return 'unset';
  };

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

  const summaryRows = (
    <>
      <tr className="table-summary-row">
        <td>Total</td>
        <td></td>
        <td></td>
        <td></td>
        <td>
          {trialBalanceData?.summary?.total_debit &&
            formatNumberForDisplay(trialBalanceData?.summary?.total_debit, 2)}
        </td>
        <td>
          {trialBalanceData?.summary?.total_credit &&
            formatNumberForDisplay(trialBalanceData?.summary?.total_credit, 2)}
        </td>
      </tr>
    </>
  );

  return (
    <section>
      <div className="d-flex justify-content-between flex-wrap mb-3">
        <div className="d-flex flex-column">
          <BackButton />
          <h2 className="screen-title mb-0">Trial Balance</h2>
        </div>

        <div className="d-flex gap-3 flex-wrap">
          {allowToExcel && (
            <CustomButton
              text={'Export to Excel'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile('trial-balance-report', 'xlsx');
              }}
            />
          )}
          {allowToPdf && (
            <CustomButton
              text={'Export to PDF'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile('trial-balance-report', 'pdf');
              }}
            />
          )}
          <CustomButton
            text={'Print'}
            onClick={() => {
              reportPrint('trial-balance-report');
            }}
          />
        </div>
      </div>
      <Row>
        <Col xs={12}>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            isLoading={isLoadingTrialBalance}
            headers={financialReportHeaders}
            isPaginated={false}
            summaryRows={summaryRows}
            hideSearch
            additionalFilters={[{ label: 'Date', title: 'date', type: 'date' }]}
            hideItemsPerPage
          >
            {(trialBalanceData?.accounts?.length || isErrorTrialBalance) && (
              <tbody>
                {isErrorTrialBalance && (
                  <tr>
                    <td colSpan={financialReportHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {trialBalanceData?.accounts?.map((item, index) => (
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
                      {item.account_code} - {item.account_name}
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

export default withFilters(TrialBalance);
