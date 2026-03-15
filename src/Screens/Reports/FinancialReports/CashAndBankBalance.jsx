import { useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { Col, Row } from 'react-bootstrap';
import CustomButton from '../../../Components/CustomButton';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { cashAndBankBalanceHeaders } from '../../../Utils/Constants/TableHeaders';
import {
  downloadFile,
  reportPrint,
  showErrorToast,
} from '../../../Utils/Utils';
import { getCashAndBankBalanceListing } from '../../../Services/Reports/WalkinCustomeReport';

const CashAndBankBalance = () => {
  usePageTitle('Cash and Bank Balance');
  const queryClient = useQueryClient();
  const permissions = useModulePermissions('reports', 'cash_bank_balance');
  const { allowToExcel, allowToPdf } = permissions;

  const {
    data: cashAndBankBalanceData,
    isLoading: isLoadingCashAndBankBalance,
    isError: isErrorCashAndBankBalance,
    error: errorCashAndBankBalance,
  } = useQuery({
    queryKey: ['cashAndBankBalance'],
    queryFn: () => getCashAndBankBalanceListing(),
    refetchOnWindowFocus: true,
    retry: 1,
  });

  if (isErrorCashAndBankBalance) {
    showErrorToast(
      errorCashAndBankBalance || 'Unable to fetch data at this time'
    );
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center flex-wrap mb-45">
        <h2 className="screen-title m-0 d-inline">Cash and Bank Balance</h2>
        <div className="d-flex gap-3 mt-4 flex-wrap">
          <CustomButton
            text={'Refresh'}
            onClick={() =>
              queryClient.invalidateQueries({
                queryKey: ['cashAndBankBalance'],
              })
            }
          />
          {allowToExcel && (
            <CustomButton
              text={'Export to Excel'}
              onClick={() => {
                downloadFile('cash-bank-balance', 'xlsx');
              }}
            />
          )}
          {allowToPdf && (
            <CustomButton
              text={'Export to PDF'}
              onClick={() => {
                downloadFile('cash-bank-balance', 'pdf');
              }}
            />
          )}
          <CustomButton
            text={'Print'}
            onClick={() => {
              reportPrint('cash-bank-balance');
            }}
          />
        </div>
      </div>
      <Row className="g-1">
        <Col xs={12} lg={6}>
          <div
            style={{ backgroundColor: '#228606' }}
            className="py-2 d-flex justify-content-center align-items-center m-0 rounded-3"
          >
            <h3 className="m-0 fw-normal text-white fs-5">Cash Balance</h3>
          </div>
          <CustomTable
            headers={cashAndBankBalanceHeaders}
            hasFilters={false}
            isLoading={isLoadingCashAndBankBalance}
            hideSearch
            isPaginated={false}
          >
            {(cashAndBankBalanceData?.cash_balance?.length ||
              isErrorCashAndBankBalance) && (
              <tbody>
                {isErrorCashAndBankBalance && (
                  <tr>
                    <td colSpan={cashAndBankBalanceHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {cashAndBankBalanceData?.cash_balance?.map((item, index) => (
                  <tr key={index++}>
                    <td
                      style={{
                        fontWeight:
                          item.account === 'Total' ? 'bold' : 'normal',
                      }}
                    >
                      {item.account}
                    </td>
                    <td
                      style={{
                        fontWeight:
                          item.account === 'Total' ? 'bold' : 'normal',
                      }}
                    >
                      {item.fcy}
                    </td>
                    <td
                      style={{
                        fontWeight:
                          item.account === 'Total' ? 'bold' : 'normal',
                      }}
                    >
                      {item.balance}
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </CustomTable>
        </Col>
        <Col xs={12} lg={6}>
          <div
            style={{ backgroundColor: '#000058' }}
            className="py-2 d-flex justify-content-center align-items-center m-0 rounded-3"
          >
            <h3 className="m-0 fw-normal text-white fs-5">Bank Balance</h3>
          </div>
          <CustomTable
            headers={cashAndBankBalanceHeaders}
            hasFilters={false}
            isLoading={isLoadingCashAndBankBalance}
            hideSearch
            isPaginated={false}
          >
            {(cashAndBankBalanceData?.bank_balance?.length ||
              isErrorCashAndBankBalance) && (
              <tbody>
                {isErrorCashAndBankBalance && (
                  <tr>
                    <td colSpan={cashAndBankBalanceHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {cashAndBankBalanceData?.bank_balance?.map((item, index) => (
                  <tr key={index++}>
                    <td
                      style={{
                        fontWeight:
                          item.bank_name === 'Total' ? 'bold' : 'normal',
                      }}
                    >
                      {item.bank_name}
                    </td>
                    <td
                      style={{
                        fontWeight:
                          item.bank_name === 'Total' ? 'bold' : 'normal',
                      }}
                    >
                      {item.fcy}
                    </td>
                    <td
                      style={{
                        fontWeight:
                          item.bank_name === 'Total' ? 'bold' : 'normal',
                      }}
                    >
                      {item.balance}
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </CustomTable>
        </Col>
      </Row>
    </>
  );
};

export default CashAndBankBalance;
