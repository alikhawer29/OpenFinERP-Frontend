import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useMemo } from 'react';
import { Col, Row } from 'react-bootstrap';
import { useLocation, useSearchParams } from 'react-router-dom';
import AttachmentsView from '../../../../Components/AttachmentsView/AttachmentsView';
import BackButton from '../../../../Components/BackButton';
import CustomButton from '../../../../Components/CustomButton';
import CustomModal from '../../../../Components/CustomModal';
import CustomTable from '../../../../Components/CustomTable/CustomTable';
import { showToast } from '../../../../Components/Toast/Toast';
import withFilters from '../../../../HOC/withFilters ';
import useAccountsByType from '../../../../Hooks/useAccountsByType';
import useModulePermissions from '../../../../Hooks/useModulePermissions';
import { usePageTitle } from '../../../../Hooks/usePageTitle';
import {
  accountOfStatementMarkStatus,
  getStatementOfAccountReportAttachments,
  getStatementOfAccountsReport,
} from '../../../../Services/Reports/JournalReport';
import {
  ledgerOptions,
  transactionTypeOptionsWithName,
} from '../../../../Utils/Constants/SelectOptions';
import { statementOfAccountsHeaders } from '../../../../Utils/Constants/TableHeaders';
import {
  downloadFile,
  formatDate,
  getCurrencyOptions,
  reportPrint,
  showErrorToast,
} from '../../../../Utils/Utils';

const GeneratedStatemenOfAccount = ({ filters, setFilters, pagination }) => {
  usePageTitle('Statement of Accounts');
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  // const [tableData, setTableData] = useState(null);

  const permissions = useModulePermissions('reports', 'statement_of_account');
  const { allowToExcel, allowToPdf, emailAsExcel, emailAsPdf } = permissions;

  const queryClient = useQueryClient();

  const location = useLocation();
  const { state } = location;

  // Get search params from URL
  const [searchParams, setSearchParams] = useSearchParams();
  const urlData = Object.fromEntries(searchParams.entries());

  const { getAccountsByTypeOptions } = useAccountsByType();
  const currencyOptions = getCurrencyOptions();

  const {
    mutate: fetchAttachments,
    data: attachmentsData,
    isPending: attachmentApiState,
  } = useMutation({
    mutationFn: (id) => getStatementOfAccountReportAttachments(id),
  });

  const {
    mutate: emailExcel,
    isPending: emailExcelStatus,
    data: emailExcelData,
  } = useMutation({
    mutationFn: (params) => emailAsExcel(params),
    onSuccess: (data) => {
      showToast(data?.message, 'success');
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  const {
    mutate: emailPdf,
    isPending: emailPdfStatus,
    data: emailPdfData,
  } = useMutation({
    mutationFn: (params) => emailAsPdf(params),
    onSuccess: (data) => {
      showToast(data?.message, 'success');
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  // const statementOfAccountsData = useMutation({
  //   mutationFn: async (params) => {
  //     const response = await getStatementOfAccountsReport(params);
  //     return response;
  //   },
  //   onSuccess: (data) => {},
  //   onError: (error) => {
  //     console.error(error);
  //   },
  // });

  const statementOfAccountsData = useQuery({
    queryKey: ['statement-of-accounts', filters],
    queryFn: () => getStatementOfAccountsReport(filters),
    refetchOnWindowFocus: true,
    enabled: !!filters, // prevent auto run if params not ready
  });

  const { mutate: markStatus, isPending: isMarkingStatus } = useMutation({
    mutationFn: ([id, type, is_marked]) =>
      accountOfStatementMarkStatus(id, type, { is_marked }),
    onSuccess: (_, variables) => {
      // Update the selected item
      setSelectedItem((prev) => {
        if (!prev) return prev;
        return { ...prev, is_marked: prev.is_marked ? 0 : 1 };
      });

      // Invalidate queries if needed
      queryClient.invalidateQueries(['getStatementOfAccountsReport']);
      statementOfAccountsData.refetch();
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const handleRowClick = (item, index) => {
    // Toggle selection if the same transaction group is clicked
    if (
      selectedItem?.transaction_no === item?.transaction_no &&
      selectedItem?.type === item?.type
    ) {
      setSelectedItem(null);
    } else {
      setSelectedItem(item);
    }
  };

  const {
    mutate,
    isPending,
    isError,
    data: fullReportData,
    error,
  } = statementOfAccountsData;

  const sortedTableData = useMemo(() => {
    const tableData = fullReportData?.data;
    const approxTotal = fullReportData?.approximate_total_base_currency;
    const balanceBroughtForward = fullReportData?.balance_brought_forward || [];
    const balanceCarriedForward = fullReportData?.balance_carried_forward || [];

    if (!tableData) return [];

    const transactions = [];
    const totals = [];
    const balancesFromData = [];
    const others = [];

    tableData.forEach((item) => {
      if (item.narrations?.trim() === 'TOTAL') {
        totals.push(item);
      } else if (item.narrations?.trim() === 'BALANCE C/F') {
        balancesFromData.push(item);
      } else if (item.narrations?.includes('Approx. Total')) {
        others.push(item);
      } else {
        transactions.push(item);
      }
    });

    // Sort TOTAL by currency alphabetically
    totals.sort((a, b) => (a.fcy || '').localeCompare(b.fcy || ''));

    // Build BALANCE C/F rows:
    // - Prefer backend's balance_carried_forward (final balances)
    // - Fallback to BALANCE C/F rows from data if balance_carried_forward is empty
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

    // Sort BALANCE C/F by currency alphabetically
    balances.sort((a, b) => (a.fcy || '').localeCompare(b.fcy || ''));

    // Build Balance B/F rows (one per currency) and sort by currency
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

    // Add Approx Total row if it exists and Show Base Value is enabled
    if (
      approxTotal &&
      (filters?.show_base_value === 'true' || filters?.show_base_value === true)
    ) {
      others.push({
        narrations: `Approx. Total in ${approxTotal.base_currency}`,
        fcy: approxTotal.base_currency,
        lc_balance: approxTotal.formatted_total,
        sign: approxTotal.sign,
        is_approx_total: true, // Flag for styling if needed
      });
    }

    // Order: Balance B/F rows at top, then transactions, then totals & balances, then approx total
    return [...balanceBfRows, ...transactions, ...totals, ...balances, ...others];
  }, [fullReportData, filters]);

  useEffect(() => {
    if (state) {
      const newFilters = {
        ...state,
      };
      setFilters(newFilters);
    }
  }, [state]);

  useEffect(() => {
    const paramsToSend = { ...urlData, ...filters };
    const paramsString = JSON.stringify(paramsToSend);

    if (paramsString !== statementOfAccountsData.lastParams) {
      statementOfAccountsData.refetch();
      statementOfAccountsData.lastParams = paramsString;
    }
  }, [JSON.stringify(filters), JSON.stringify(urlData)]);

  return (
    <section>
      <BackButton />
      <div className="d-flex justify-content-between flex-wrap flex-lg-nowrap gap-3 mb-3">
        <h2 className="screen-title m-0 d-inline text-nowrap">
          Statement of Accounts
        </h2>
        <div
          className="d-flex gap-3 flex-wrap align-content-start"
          style={{ direction: 'rtl' }}
        >
          <CustomButton
            text={'Print'}
            onClick={() => {
              const params = { ...urlData, ...filters };
              reportPrint('statement-of-account', params);
            }}
          />
          {allowToPdf && (
            <CustomButton
              text={'Export to PDF'}
              variant={'secondaryButton'}
              onClick={() => {
                const params = { ...urlData, ...filters };
                downloadFile('statement-of-account', 'pdf', params);
              }}
            />
          )}
          {allowToExcel && (
            <CustomButton
              text={'Export to Excel'}
              variant={'secondaryButton'}
              onClick={() => {
                const params = { ...urlData, ...filters };
                downloadFile('statement-of-account', 'xlsx', params);
              }}
            />
          )}
          {emailAsPdf && (
            <CustomButton
              text={'Email as PDF'}
              loading={emailPdfStatus}
              variant={'secondaryButton'}
              onClick={() => {
                const params = { ...urlData, ...filters };
                emailPdf(params);
              }}
            />
          )}
          {emailAsExcel && (
            <CustomButton
              text={'Email as Excel'}
              variant={'secondaryButton'}
              loading={emailExcelStatus}
              onClick={() => {
                const params = { ...urlData, ...filters };
                emailExcel(params);
              }}
            />
          )}

          <CustomButton
            text={'View Attachment'}
            variant={'secondaryButton'}
            loading={attachmentApiState}
            onClick={() => {
              if (selectedItem?.voucher_id) {
                fetchAttachments(selectedItem?.voucher_id);
                setShowAttachmentsModal(true);
              }
            }}
          />
          <CustomButton
            text={
              selectedItem?.is_marked
                ? 'UnMark'
                : selectedItem?.is_marked === 0
                ? 'Mark'
                : 'Mark/Unmark'
            }
            loading={isMarkingStatus}
            disabled={selectedItem === null}
            variant={'secondaryButton'}
            onClick={() => {
              if (!selectedItem) return;
              markStatus([
                selectedItem?.transaction_id,
                'statement-of-account',
                selectedItem?.is_marked ? 0 : 1,
              ]);
            }}
          />
        </div>
      </div>
      <div className="d-flex gap-3 flex-wrap">
        Account: {fullReportData?.selected_account_name}
      </div>

      <Row>
        <Col xs={12}>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={statementOfAccountsHeaders}
            pagination={pagination}
            isPaginated={false}
            isLoading={isPending}
            hideSearch
            hideItemsPerPage={true}
            selectOptions={[
              {
                label: 'ledger',
                title: 'account_type',
                options: [{ label: 'All', value: 'all' }, ...ledgerOptions],
                disabled: true,
                hide: true,
              },
              {
                label: 'Account',
                title: 'account_id',
                disabled: true,
                options: getAccountsByTypeOptions(filters.account_type, false),
                hide: true,
              },
              {
                title: 'transaction_type',
                label: 'Transaction Type',
                options: transactionTypeOptionsWithName,
              },
              {
                title: 'currency',
                label: 'Currency',
                options: [{ value: 'all', label: 'All' }, ...currencyOptions],
              },
              {
                label: 'Mark Type',
                title: 'mark_type',
                options: [
                  { label: 'All', value: 'all' },
                  { label: 'Marked', value: 'marked' },
                  { label: 'Unmarked', value: 'unmarked' },
                ],
              },
            ]}
            rangeFilters={[
              { title: 'fcy_amount_range', label: 'FCy Amount Range' },
            ]}
            dateFilters={[{ title: 'period', label: 'Period', readOnly: true }]}
          >
            {(sortedTableData?.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={statementOfAccountsHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {sortedTableData?.map((item, index) => (
                  <tr
                    className={`${
                      selectedItem?.transaction_no === item?.transaction_no &&
                      selectedItem?.type === item?.type
                        ? 'selected-row'
                        : ''
                    }  ${
                      item?.narrations === 'TOTAL' ||
                      item?.narrations === 'BALANCE C/F' ||
                      item?.narrations === 'BALANCE B/F' ||
                      item?.is_balance_bf_row ||
                      item?.is_approx_total
                        ? 'fw-bold'
                        : ''
                    }`}
                    key={index}
                    onClick={() => handleRowClick(item, index)}
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
                      className={`${item.is_marked ? 'highlight-marked' : ''}`}
                    >
                      {item.transaction_no}
                    </td>
                    <td
                      className={`${item.is_marked ? 'highlight-marked' : ''}`}
                    >
                      {item.narrations}
                    </td>
                    <td
                      className={`${item.is_marked ? 'highlight-marked' : ''}`}
                    >
                      {item.fcy}
                    </td>
                    <td
                      className={`${item.is_marked ? 'highlight-marked' : ''}`}
                    >
                      {item.narrations === 'BALANCE C/F' ||
                      item.narrations === 'BALANCE B/F'
                        ? ''
                        : item.debit}
                    </td>
                    <td
                      className={`${item.is_marked ? 'highlight-marked' : ''}`}
                    >
                      {item.narrations === 'BALANCE C/F' ||
                      item.narrations === 'BALANCE B/F'
                        ? ''
                        : item.credit}
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
                      {formatDate(item.value_date, 'DD/MM/YYYY')}
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </CustomTable>
        </Col>
      </Row>
      <CustomModal
        show={showAttachmentsModal}
        close={() => setShowAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          viewOnly
          item={attachmentsData}
          ToInvalidate={'attachments'}
          closeUploader={setShowAttachmentsModal}
        />
      </CustomModal>
    </section>
  );
};

export default withFilters(GeneratedStatemenOfAccount);
