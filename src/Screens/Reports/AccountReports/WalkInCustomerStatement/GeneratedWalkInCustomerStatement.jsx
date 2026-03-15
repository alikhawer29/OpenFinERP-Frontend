import { useEffect, useMemo, useRef, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import BackButton from '../../../../Components/BackButton';
import CustomButton from '../../../../Components/CustomButton';
import CustomTable from '../../../../Components/CustomTable/CustomTable';
import withFilters from '../../../../HOC/withFilters ';
// import {
//   walkInCustomerStatementData,
//   walkInCustomerStatementData2,
// } from '../../../../Mocks/MockData';
import { walkInCustomerStatementHeaders } from '../../../../Utils/Constants/TableHeaders';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  getWalkInCustomerAccountStatement,
  getWalkInCustomerStatementFilters,
} from '../../../../Services/Reports/WalkinCustomeReport';
import CustomSelect from '../../../../Components/CustomSelect';
import {
  downloadFile,
  getCurrencyOptions,
  reportPrint,
  formatNumberForDisplay,
} from '../../../../Utils/Utils';
import { markedStatus } from '../../../../Services/Reports/JournalReport';
import { useFetchTableData } from '../../../../Hooks/useTable';
import { getAccountType } from '../../../../Services/Admin/Support';
import { transactionTypeOptionsWithName } from '../../../../Utils/Constants/SelectOptions';
import { getAccountsbyType } from '../../../../Services/Transaction/JournalVoucher';
import useModulePermissions from '../../../../Hooks/useModulePermissions';
import { usePageTitle } from '../../../../Hooks/usePageTitle';

const GeneratedWalkInCustomerStatement = ({
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Walk-In Customer Statement');

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);

  const currencyOptions = getCurrencyOptions();

  const permissions = useModulePermissions(
    'reports',
    'walk_in_customer_statement'
  );
  const { allowToExcel, allowToPdf } = permissions;

  const [searchParams] = useSearchParams();
  const urlData = Object.fromEntries(searchParams.entries());

  const location = useLocation();
  const { state } = location;

  // Use useEffect to only call the service once on mount, or when urlData changes meaningfully
  // Use a state to ensure we don't call mutate repeatedly for the same urlData
  const [lastUrlData, setLastUrlData] = useState(null);

  const { mutate: markStatus, isPending: isMarkingStatus } = useMutation({
    mutationFn: ([id, type, is_marked]) =>
      markedStatus(id, type, { is_marked }),
    onSuccess: () => {
      setSelectedItem((prev) => {
        if (!prev) return prev;
        return { ...prev, is_marked: prev.is_marked ? 0 : 1 };
      });
      queryClient.invalidateQueries(['walkInCustomerAccountStatement']);
    },
  });

  const {
    data: walkinCustomerStatementFilters,
    isLoading: isLoadingWalkinCustomerFilters,
    isError: isErrorWalkinCustomerFilters,
  } = useQuery({
    queryKey: ['walkinCustomerFilters'],
    queryFn: () => getWalkInCustomerStatementFilters(),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const { data: walkinAccounts } = useQuery({
    queryKey: ['getAccountsbyType'],
    queryFn: () => getAccountsbyType('walkin'),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const {
    data: fullReportData,
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'walkInCustomerAccountStatement',
    filters,
    updatePagination,
    getWalkInCustomerAccountStatement
  );

  const handleRowClick = (item, index) => {
    if (selectedRowIndex === index) {
      setSelectedRowIndex(null);
      setSelectedItem(null);
    } else {
      setSelectedRowIndex(index);
      setSelectedItem(item);
    }
  };
  const lastParamsRef = useRef(null);

  // Shape data similar to Statement of Account:
  // - Show Balance B/F rows at the top (from balance_brought_forward)
  // - Then all transaction rows
  // - Then TOTAL and BALANCE C/F rows per currency (BALANCE C/F from balance_carried_forward)
  const sortedTableData = useMemo(() => {
    const tableData = fullReportData?.data;
    const balanceBroughtForward =
      fullReportData?.balance_brought_forward || [];
    const balanceCarriedForward =
      fullReportData?.balance_carried_forward || [];
    const currencyTotals = fullReportData?.currency_totals || {};

    if (!tableData) return [];

    const transactions = [];
    const totals = [];
    const balancesFromData = [];

    tableData.forEach((item) => {
      const narr = (item.narrations || item.narration || '').trim();
      if (narr === 'TOTAL') {
        totals.push(item);
      } else if (narr === 'BALANCE C/F') {
        balancesFromData.push(item);
      } else {
        transactions.push(item);
      }
    });

    // Sort TOTAL rows by currency
    totals.sort((a, b) => (a.fcy || '').localeCompare(b.fcy || ''));

    // BALANCE C/F rows: prefer balance_carried_forward summary
    let balances = [];
    if (balanceCarriedForward.length) {
      balances = balanceCarriedForward.map((bc) => ({
        date: '',
        type: '',
        transaction_no: '',
        narrations: 'BALANCE C/F',
        fcy: bc.currency,
        debit: '',
        credit: '',
        lc_balance: bc.formatted_balance,
        sign: bc.sign,
        is_balance_cf_row: true,
      }));
    } else {
      balances = [...balancesFromData];
    }
    balances.sort((a, b) => (a.fcy || '').localeCompare(b.fcy || ''));

    // Balance B/F rows at the top (one per currency)
    const balanceBfRows = balanceBroughtForward
      .map((bf) => ({
        date: '',
        type: '',
        transaction_no: '',
        narrations: 'BALANCE B/F',
        fcy: bf.currency,
        debit: '',
        credit: '',
        lc_balance: bf.formatted_balance,
        sign: bf.sign,
        is_balance_bf_row: true,
      }))
      .sort((a, b) => (a.fcy || '').localeCompare(b.fcy || ''));

    // Build TOTAL rows from currency_totals (single row per currency with both debit & credit)
    const totalRows = Object.entries(currencyTotals).map(
      ([currency, totalsObj]) => ({
        date: '',
        type: '',
        transaction_no: '',
        narrations: 'TOTAL',
        fcy: currency,
        debit:
          totalsObj.debit != null
            ? formatNumberForDisplay(totalsObj.debit, 2)
            : '',
        credit:
          totalsObj.credit != null
            ? formatNumberForDisplay(totalsObj.credit, 2)
            : '',
        lc_balance: '',
        sign: '',
        is_total_row: true,
      })
    );
    // Sort TOTAL rows by currency alphabetically
    totalRows.sort((a, b) => (a.fcy || '').localeCompare(b.fcy || ''));

    return [...balanceBfRows, ...transactions, ...totalRows, ...balances];
  }, [fullReportData]);

  useEffect(() => {
    setFilters(() => ({
      ...state,
    }));
  }, []);

  useEffect(() => {
    const paramsToSend = { ...urlData, ...filters };
    const paramsString = JSON.stringify(paramsToSend);

    if (paramsString !== lastParamsRef.current) {
      getWalkInCustomerAccountStatement(paramsToSend);
      lastParamsRef.current = paramsString;
    }
  }, [JSON.stringify(filters), JSON.stringify(urlData)]);

  return (
    <section>
      <div className="d-flex justify-content-between flex-wrap mb-3">
        <div className="d-flex flex-column gap-2 mb-4">
          <BackButton />
          <h2 className="screen-title m-0 d-inline">WIC Statement</h2>
        </div>
        <div className="d-flex gap-3 flex-wrap">
          <CustomButton
            text={
              selectedItem?.is_marked
                ? 'UnMark'
                : selectedItem?.is_marked === 0
                ? 'Mark'
                : 'Mark/Unmark'
            }
            loading={isMarkingStatus}
            variant={'secondaryButton'}
            disabled={selectedItem === null}
            onClick={() => {
              if (!selectedItem) return;
              markStatus([
                selectedItem?.id,
                'walk-in-customer-statement',
                selectedItem?.is_marked ? 0 : 1,
              ]);
            }}
          />
          {allowToExcel && (
            <CustomButton
              text={'Export to Excel'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile('walk-in-customer-statement', 'xlsx');
              }}
            />
          )}
          {allowToPdf && (
            <CustomButton
              text={'Export to PDF'}
              variant={'secondaryButton'}
              onClick={() => {
                downloadFile('walk-in-customer-statement', 'pdf');
              }}
            />
          )}
          <CustomButton
            text={'Print'}
            onClick={() => {
              reportPrint('walk-in-customer-statement');
            }}
          />
        </div>
      </div>
      <Row>
        <Col xs={12}>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={walkInCustomerStatementHeaders}
            isLoading={isLoading}
            pagination={pagination}
            isPaginated={false}
            hideSearch
            selectOptions={[
              {
                title: 'account_id',
                label: 'Account',
                options: walkinAccounts?.map((account) => ({
                  value: account?.id,
                  label: account?.title,
                })),
              },
              {
                title: 'transaction_type',
                label: 'Transaction Type',
                options: transactionTypeOptionsWithName,
              },
              {
                title: 'currency_id',
                label: 'Currency',
                options: [{ label: 'All', value: 'all' }, ...currencyOptions],
              },
              {
                title: 'is_marked',
                label: 'Mark type',
                options: isErrorWalkinCustomerFilters
                  ? [{ value: '', label: 'Unable to fetch options' }]
                  : isLoadingWalkinCustomerFilters
                  ? [{ value: '', label: 'Loading...' }]
                  : walkinCustomerStatementFilters?.mark_type?.map(
                      (markType) => ({
                        value: markType?.id,
                        label: markType?.label,
                      })
                    ),
              },
            ]}
            rangeFilters={[
              {
                label: 'FCy Amount Range',
                title: 'fcy_amount_range',
                type: 'number',
              },
            ]}
            dateFilters={[
              { label: 'Period', title: 'period_range', type: 'date' },
            ]}
          >
            {(sortedTableData?.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={walkInCustomerStatementHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {sortedTableData?.map((item, index) => {
                  const narr = (item.narrations || item.narration || '').trim();
                  const isBoldRow =
                    narr === 'TOTAL' ||
                    narr === 'BALANCE C/F' ||
                    narr === 'BALANCE B/F' ||
                    item.is_total_row ||
                    item.is_balance_cf_row ||
                    item.is_balance_bf_row;

                  const isSummaryRow =
                    narr === 'TOTAL' ||
                    narr === 'BALANCE C/F' ||
                    narr === 'BALANCE B/F' ||
                    item.is_total_row ||
                    item.is_balance_cf_row ||
                    item.is_balance_bf_row;

                  return (
                    <tr
                      key={item.id ?? index}
                      className={`${selectedRowIndex === index ? 'selected-row' : ''} ${
                        isBoldRow ? 'fw-bold' : ''
                      }`}
                      onClick={() => {
                        // Do not allow clicking summary rows (TOTAL / BALANCE B/F / BALANCE C/F)
                        if (!isSummaryRow) {
                          handleRowClick(item, index);
                        }
                      }}
                    >
                    <td
                      className={`${item.is_marked ? 'highlight-marked' : ''}`}
                    >
                      {item.date}
                    </td>
                    <td
                      className={`${item.is_marked ? 'highlight-marked' : ''}`}
                    >
                      {item.type}
                    </td>
                    <td
                      onClick={() => {
                        if (!isSummaryRow) {
                          const searchParams = new URLSearchParams(item);
                          navigate(`account-journal?${searchParams.toString()}`);
                        }
                      }}
                      className={`${!isSummaryRow ? 'cp underlineOnHover' : ''} ${
                        item.is_marked ? 'highlight-marked ' : ''
                      }`}
                    >
                      {item.transaction_no}
                    </td>
                    <td
                      className={`${item.is_marked ? 'highlight-marked' : ''}`}
                    >
                      {item.narrations ?? item.narration}
                    </td>
                    <td
                      className={`${item.is_marked ? 'highlight-marked' : ''}`}
                    >
                      {item.fcy}
                    </td>
                    <td
                      className={`${item.is_marked ? 'highlight-marked' : ''}`}
                    >
                      {item.debit}
                    </td>
                    <td
                      className={`${item.is_marked ? 'highlight-marked' : ''}`}
                    >
                      {item.credit}
                    </td>
                    <td
                      className={`${item.is_marked ? 'highlight-marked' : ''}`}
                    >
                      {item.lc_balance}
                    </td>
                    <td
                      className={`${item.is_marked ? 'highlight-marked' : ''}`}
                    >
                      {item.sign}
                    </td>
                    <td
                      className={`${item.is_marked ? 'highlight-marked' : ''}`}
                    >
                      {item.value_date}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            )}
          </CustomTable>
        </Col>
      </Row>
    </section>
  );
};

export default withFilters(GeneratedWalkInCustomerStatement);
