import React, { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import CustomButton from '../../../Components/CustomButton';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import withFilters from '../../../HOC/withFilters ';
import { inwardRemittanceReportHeaders } from '../../../Utils/Constants/TableHeaders';
import {
  downloadFile,
  getCurrencyOptions,
  reportPrint,
} from '../../../Utils/Utils';
import useAccountsByType from '../../../Hooks/useAccountsByType';
import { ledgerOptions } from '../../../Utils/Constants/SelectOptions';
import { useFetchTableData } from '../../../Hooks/useTable';
import { getInwardRemittanceReport } from '../../../Services/Reports/AccountEnquiryReport';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import BackButton from '../../../Components/BackButton';

const InwardRemittanceReport = ({
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  const { getAccountsByTypeOptions } = useAccountsByType();

  const permissions = useModulePermissions(
    'reports',
    'inward_remittance_report'
  );
  const { allowToExcel, allowToPdf } = permissions;

  const {
    data: generateInwardRemittanceReport,
    isLoading,
    isError,
  } = useFetchTableData(
    'getInwardRemittanceReport',
    filters,
    updatePagination,
    getInwardRemittanceReport
  );

  const tableData = generateInwardRemittanceReport?.data || [];

  const currencyOptions = getCurrencyOptions();
  // State to track non-triggering filter values
  const [nonTriggeringFilters, setNonTriggeringFilters] = useState({});

  // Handle non-triggering filter changes
  const handleNonTriggeringFiltersChange = (newNonTriggeringFilters) => {
    setNonTriggeringFilters(newNonTriggeringFilters);
  };

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
    setFilters((prev) => {
      if (!prev.ledger_type) {
        return {
          ...prev,
          ledger_type: 'all',
          all_accounts: true,
        };
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    // When ledger_type is NOT 'all' and all_accounts is checked,
    // remove from_account_id and to_account_id filters so From/To accounts disappear
    if (filters.ledger_type !== 'all' && filters.all_accounts) {
      setFilters((prev) => {
        const { from_account_id, to_account_id, ...rest } = prev;
        return rest;
      });
    }
  }, [filters.all_accounts, filters.ledger_type]);

  return (
    <section>
      <div className="d-flex justify-content-between flex-wrap mb-3">
        <div className="d-flex flex-column">
          <BackButton />
          <h2 className="screen-title mb-0">Inward Remittance Report</h2>
        </div>

        <div className="d-flex gap-3 flex-wrap">
          {allowToExcel && (
            <CustomButton
              text={'Export to Excel'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile('inward-remittance-report', 'xlsx');
              }}
            />
          )}
          {allowToPdf && (
            <CustomButton
              text={'Export to PDF'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile('inward-remittance-report', 'pdf');
              }}
            />
          )}
          <CustomButton
            text={'Print'}
            onClick={() => {
              reportPrint('inward-remittance-report');
            }}
          />
        </div>
      </div>
      <Row>
        <Col xs={12}>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={inwardRemittanceReportHeaders}
            pagination={pagination}
            isLoading={isLoading}
            onNonTriggeringFiltersChange={handleNonTriggeringFiltersChange}
            hideSearch
            selectOptions={[
              {
                label: 'ledger',
                title: 'ledger_type',
                options: [
                  { label: 'Select Ledger', value: '', disabled: true },
                  { label: 'All', value: 'all' },
                  ...ledgerOptions,
                ],
              },
              ...(filters.ledger_type !== 'all' && !filters.all_accounts
                ? [
                    {
                      label: 'From Account',
                      title: 'from_account',
                      options: getAccountsByTypeOptions(
                        filters.ledger_type,
                        false
                      ),
                    },
                    {
                      label: 'to Account',
                      title: 'to_account',
                      options: getAccountsByTypeOptions(
                        filters.ledger_type,
                        false
                      ),
                    },
                  ]
                : []),
              {
                label: 'FCy',
                title: 'fcy',
                options: [{ label: 'All', value: 'all' }, ...currencyOptions],
              },
            ]}
            checkBoxFilters={[
              {
                title: 'all_accounts',
                label: 'All Accounts',
                checked:
                  filters.ledger_type === 'all' ? true : !!filters.all_accounts,
                readOnly: filters.ledger_type === 'all',
              },
            ]}
            rangeFilters={[{ label: 'FCy Amount Range', title: 'fcy_amount' }]}
            dateFilters={[{ label: 'Date Range', title: 'date' }]}
          >
            {(tableData?.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={inwardRemittanceReportHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {tableData?.map((item, index) => (
                  <tr key={index++}>
                    <td>{item.tran_no}</td>
                    <td>{item.tran_date}</td>
                    <td>{item.account}</td>
                    <td>{item.nationality}</td>
                    <td>{item.beneficiary_name}</td>
                    <td>{item.beneficiary_place_of_work}</td>
                    <td>{item.beneficiary_nationality}</td>
                    <td>{item.beneficiary_id_no}</td>
                    <td>{item.contact_number}</td>
                    <td>{item.country_of_origin}</td>
                    <td>{item.purpose}</td>
                    <td>{item.fcy}</td>
                    <td>{item.fc_amount}</td>
                    <td>{item.lc_amount}</td>
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

export default withFilters(InwardRemittanceReport);
