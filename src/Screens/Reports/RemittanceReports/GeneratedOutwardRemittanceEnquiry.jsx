import React, { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import CustomButton from '../../../Components/CustomButton';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import withFilters from '../../../HOC/withFilters ';
import { outwardRemittanceEnquiryData, outwardRemittanceReportData } from '../../../Mocks/MockData';
import { outwardRemittanceEnquiryHeaders, outwardRemittanceReportHeaders } from '../../../Utils/Constants/TableHeaders';
import { downloadFile, getCurrencyOptions, reportPrint } from '../../../Utils/Utils';
import useAccountsByType from '../../../Hooks/useAccountsByType';
import { ledgerOptions } from '../../../Utils/Constants/SelectOptions';
import { getOutwardRemittanceEnquiryReport } from '../../../Services/Reports/OutwardRemittanceReport';
import { useFetchTableData } from '../../../Hooks/useTable';
import { getJournalReportUserFilters } from '../../../Services/Reports/JournalReport';
import { useQuery } from '@tanstack/react-query';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import { useLocation } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';

const OutwardRemittanceEnquiry = ({ filters, setFilters, pagination, updatePagination }) => {

  const { getAccountsByTypeOptions } = useAccountsByType();
  const currencyOptions = getCurrencyOptions();

  const permissions = useModulePermissions("reports", "outward_remittance_enquiry")
  const { allowToExcel, allowToPdf } = permissions;


  // State to track non-triggering filter values
  const [nonTriggeringFilters, setNonTriggeringFilters] = useState({});

  // Handle non-triggering filter changes
  const handleNonTriggeringFiltersChange = (newNonTriggeringFilters) => {
    setNonTriggeringFilters(newNonTriggeringFilters);
  };


  const {
    data: generateOutwardRemittanceReport,
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'getOutwardRemittanceEnquiryReport',
    filters,
    updatePagination,
    getOutwardRemittanceEnquiryReport
  );

  // Query for journal report user filters
  const {
    data: expenseJournalUserFilters,
    isLoading: isLoadingJournalReportUserFilters,
    isError: isErrorJournalReportUserFilters,
    error: errorJournalReportUserFilters,
  } = useQuery({
    queryKey: ['expenseJournalUserFilters'],
    queryFn: () => getJournalReportUserFilters(),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // for getting user ids
  const getUserFilterOptions = () => {
    if (isLoadingJournalReportUserFilters) {
      return [{ label: 'Loading...', value: null, isDisabled: true }];
    }
    if (isErrorJournalReportUserFilters) {
      return [{ label: 'Unable to fetch users', value: null }];
    }
    return (
      expenseJournalUserFilters?.map((x) => ({
        value: x?.id,
        label: x?.user_id,
      })) || []
    );
  };

  const tableData = generateOutwardRemittanceReport?.data || [];


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
      setFilters(prev => {
        const { from_account_id, to_account_id, ...rest } = prev;
        return rest;
      });
    }
  }, [filters.all_accounts, filters.ledger_type]);

  const { state } = useLocation();
  useEffect(() => {
    if (state) {
      setFilters((prev) => ({
        ...prev,
        ...state
      }));
    }
  }, [state]);



  return (
    <section>
      <div className="d-flex justify-content-between flex-wrap mb-3">
        <div className="d-flex flex-column">
          <BackButton />
          <h2 className="screen-title m-0 d-inline">Outward Remittance Enquiry</h2>
        </div>
        <div className="d-flex gap-3 flex-wrap">
          {
            allowToExcel &&
            <CustomButton
              text={'Export to Excel'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile("outward-remittance-enquiry", "xlsx")
              }}
            />
          }
          {
            allowToPdf &&
            <CustomButton
              text={'Export to PDF'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile("outward-remittance-enquiry", "pdf")
              }}
            />
          }
          <CustomButton
            text={'Print'}
            onClick={() => {
              reportPrint("outward-remittance-enquiry")
            }}
          />
        </div>
      </div>
      <Row>
        <Col xs={12}>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={outwardRemittanceEnquiryHeaders}
            onNonTriggeringFiltersChange={handleNonTriggeringFiltersChange}
            pagination={pagination}
            isLoading={isLoading}
            hideSearch
            selectOptions={[
              {
                label: "Transaction Type",
                title: 'transaction_type',
                options: [{ label: "All", title: "all" }, { label: "FSN", title: "fsn" }, { label: "FBN", title: "fbn" }]
              },
              {
                label: "ledger",
                title: 'ledger_type',
                options: [{ label: 'Select Ledger', value: '', disabled: true }, { label: 'All', value: 'all' }, ...ledgerOptions],
              },
              ...(
                filters.ledger_type !== 'all' && !filters.all_accounts
                  ? [
                    {
                      label: 'From Account',
                      title: 'from_account_id',
                      options: getAccountsByTypeOptions(filters.ledger_type, false),
                    },
                    {
                      label: 'To Account',
                      title: 'to_account_id',
                      options: getAccountsByTypeOptions(filters.ledger_type, false),
                    },
                  ]
                  : []
              ),

              {
                label: "FCy",
                title: "fcy",
                options: [{ label: "All", value: "all" }, ...currencyOptions],
              },
              {
                label: "Sort By",
                title: "sort_by",
                options: [
                  { label: "Transaction Number", value: "transaction_number" },
                  { label: "Account", value: "account" },
                  { label: "Beneficiary", value: "beneficiary" },
                ]
              },
              {
                label: "User ID",
                title: "user_id",
                options: getUserFilterOptions()
              },
              {
                label: "Status",
                title: 'status',
                options: [{ label: "All", title: "all" }, { label: "Open", title: "open" }, { label: "Closed", title: "closed" }]
              },
            ]}
            checkBoxFilters={[
              {
                title: "all_accounts",
                label: "All Accounts",
                checked: filters.ledger_type === 'all' ? true : !!filters.all_accounts,
                readOnly: filters.ledger_type === 'all',
              }
            ]}
            rangeFilters={[
              { title: "transaction_no", label: 'Transaction No. Range', type: 'number' },
              { title: "fcy_amount", label: 'FCy Amount Range', type: 'number' },
            ]}
            dateFilters={[
              { label: 'Date Range', title: "date", type: "date" },
              { label: 'Posting Date Range', type: "date", title: "posting_date" },
            ]}
          >
            {(tableData?.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={outwardRemittanceEnquiryHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {tableData?.map((item) => (
                  <tr key={item.id}>
                    <td>{item.tran_type}</td>
                    <td>{item.tran_no}</td>
                    <td>{item.date}</td>
                    <td>{item.account}</td>
                    <td>{item.beneficiary}</td>
                    <td>{item.fcy}</td>
                    <td>{item.fc_amount}</td>
                    <td>{item.against_fcy}</td>
                    <td>{item.rate}</td>
                    <td>{item.user_id}</td>
                    <td>{item.status}</td>
                    <td>{item.against_fc_amount}</td>
                    <td title={item.linked_fbn_numbers || ''}>{item.opposing_no}</td>
                    <td>{item.opposing_account}</td>
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

export default withFilters(OutwardRemittanceEnquiry);
