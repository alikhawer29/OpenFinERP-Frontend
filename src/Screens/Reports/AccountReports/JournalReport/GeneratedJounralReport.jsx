import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import AttachmentsView from '../../../../Components/AttachmentsView/AttachmentsView';
import BackButton from '../../../../Components/BackButton';
import CustomButton from '../../../../Components/CustomButton';
import CustomModal from '../../../../Components/CustomModal';
import CustomTable from '../../../../Components/CustomTable/CustomTable';
import withFilters from '../../../../HOC/withFilters ';
import { useFileDownloader } from '../../../../Hooks/useFileDownloader';
import useModulePermissions from '../../../../Hooks/useModulePermissions';
import { usePageTitle } from '../../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../../Hooks/useTable';
import {
  getJournalReport,
  getJournalReportUserFilters,
  getReportAttachments,
  markedStatus,
} from '../../../../Services/Reports/JournalReport';
import { getAccountsbyType } from '../../../../Services/Transaction/JournalVoucher';
import { transactionTypeOptionsWithName } from '../../../../Utils/Constants/SelectOptions';
import { journalReportHeaders } from '../../../../Utils/Constants/TableHeaders';
import {
  formatDate,
  getCurrencyOptions,
  reportPrint,
} from '../../../../Utils/Utils';

const GeneratedJounralReport = ({
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedTransactionNo, setSelectedTransactionNo] = useState(null);
  usePageTitle('Journal Report');
  const queryClient = useQueryClient();
  const navigate = useNavigate('');
  const location = useLocation();
  const { state } = location;

  const permissions = useModulePermissions('reports', 'journal_report');
  const { view, allowToExcel, allowToPdf } = permissions;

  // Get search params from URL
  const [searchParams] = useSearchParams();
  const urlData = Object.fromEntries(searchParams.entries());

  const currencyOptions = getCurrencyOptions();

  // Query for user filters
  const {
    data: journalReportUserFilters,
    isLoading: isLoadingJournalReportUserFilters,
    isError: isErrorJournalReportUserFilters,
  } = useQuery({
    queryKey: ['journalReportUserFilters'],
    queryFn: () => getJournalReportUserFilters(),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Query for party accounts
  const { data: partyAccounts, isLoading: isLoadingParty } = useQuery({
    queryKey: ['accounts', 'party'],
    queryFn: () => getAccountsbyType('party'),
    staleTime: 1000 * 60 * 5,
  });

  // Query for general accounts
  const { data: generalAccounts, isLoading: isLoadingGeneral } = useQuery({
    queryKey: ['accounts', 'general'],
    queryFn: () => getAccountsbyType('general'),
    staleTime: 1000 * 60 * 5,
  });

  // Query for walkin accounts
  const { data: walkinAccounts, isLoading: isLoadingWalkin } = useQuery({
    queryKey: ['accounts', 'walkin'],
    queryFn: () => getAccountsbyType('walkin'),
    staleTime: 1000 * 60 * 5,
  });

  const {
    mutate: fetchAttachments,
    data: attachmentsData,
    isPending: attachmentApiState,
  } = useMutation({
    mutationFn: (id) => getReportAttachments(id),
  });

  const {
    data: { data: tableData = [] } = {},
    isLoading: isGeneratingReport,
    isFetching,
    isError,
    error,
  } = useFetchTableData(
    'journalReport',
    filters,
    updatePagination,
    getJournalReport
  );

  const { mutate: markStatus, isPending: isMarkingStatus } = useMutation({
    mutationFn: ([id, type, is_marked]) =>
      markedStatus(id, type, { is_marked }),
    onSuccess: () => {
      setSelectedItem((prev) => {
        if (!prev) return prev;
        return { ...prev, is_marked: prev.is_marked ? 0 : 1 };
      });

      queryClient.invalidateQueries(['journalReport']);
    },
  });

  const handleRowClick = (item, index) => {
    if (
      selectedItem?.transaction_no === item?.transaction_no &&
      selectedItem?.type === item?.type
    ) {
      setSelectedItem(null);
    } else {
      setSelectedItem(item);
    }
  };
  const lastParamsRef = useRef(null);

  // Merge navigation state (report filters) into existing filters so page, per_page, search, from, to, status are preserved
  useEffect(() => {
    if (state && Object.keys(state).length > 0) {
      setFilters((prev) => ({
        ...prev,
        ...state,
      }));
    }
  }, []);

  useEffect(() => {
    const paramsToSend = { ...urlData, ...filters };
    const paramsString = JSON.stringify(paramsToSend);

    if (paramsString !== lastParamsRef.current) {
      getJournalReport(paramsToSend);
      lastParamsRef.current = paramsString;
    }
  }, [JSON.stringify(filters), JSON.stringify(urlData)]);

  const { downloadingType, handleDownload } = useFileDownloader();

  // Get user filter options
  const getUserFilterOptions = () => {
    if (isLoadingJournalReportUserFilters) {
      return [{ label: 'Loading...', value: null, isDisabled: true }];
    }
    if (isErrorJournalReportUserFilters) {
      return [{ label: 'Unable to fetch users', value: null }];
    }
    return [
      { label: 'All', value: '' },
      ...(journalReportUserFilters?.map((x) => ({
        value: x?.id,
        label: x?.user_id,
      })) || []),
    ];
  };

  return (
    <section>
      <div className="d-flex justify-content-between flex-wrap mb-3">
        <div className="d-flex flex-column gap-2 mb-4">
          <BackButton />
          <h2 className="screen-title m-0 d-inline">Journal Report</h2>
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
            disabled={selectedItem === null}
            variant={'secondaryButton'}
            loading={isMarkingStatus}
            onClick={() => {
              if (!selectedItem) return;
              markStatus([
                selectedItem?.ledger_entry_id,
                'journal-reports',
                selectedItem?.is_marked ? 0 : 1,
              ]);
            }}
          />
          <CustomButton
            text={'View Attachment'}
            variant={'secondaryButton'}
            loading={attachmentApiState}
            onClick={() => {
              if (selectedItem?.id) {
                fetchAttachments(selectedItem?.ledger_entry_id);
                setShowAttachmentsModal(true);
              }
            }}
            disabled={urlData?.attachments == 'no' || !selectedItem}
          />
          {allowToExcel && (
            <CustomButton
              variant="secondaryButton"
              text={
                downloadingType === 'xlsx'
                  ? 'Downloading...'
                  : 'Export to Excel'
              }
              onClick={() => handleDownload('journal-reports', 'xlsx')}
              disabled={!!downloadingType}
              loading={downloadingType === 'xlsx'}
            />
          )}

          {allowToPdf && (
            <CustomButton
              variant="secondaryButton"
              text={
                downloadingType === 'pdf' ? 'Downloading...' : 'Export to PDF'
              }
              onClick={() => handleDownload('journal-reports', 'pdf')}
              disabled={!!downloadingType}
              loading={downloadingType === 'pdf'}
            />
          )}

          <CustomButton
            text={'Print'}
            onClick={() => reportPrint('journal-reports')}
          />
        </div>
      </div>
      <Row>
        <Col xs={12}>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={journalReportHeaders}
            pagination={pagination}
            isLoading={isGeneratingReport || isFetching}
            hideSearch
            useClearButton={true}
            selectOptions={[
              {
                label: 'Transaction Type',
                title: 'transaction_type',
                options: [
                  { label: 'All', value: '' },
                  ...transactionTypeOptionsWithName,
                ],
              },

              {
                label: 'User ID',
                title: 'user_id',
                options: getUserFilterOptions(),
              },

              {
                label: 'FCy',
                title: 'currency_id',
                options: [{ label: 'All', value: '' }, ...currencyOptions],
              },
            ]}
            additionalFilters={[
              {
                label: 'FCy Amount From',
                title: 'fcy_amount_range_from',
                type: 'number',
                placeholder: 'Min Amount',
              },
              {
                label: 'FCy Amount To',
                title: 'fcy_amount_range_to',
                type: 'number',
                placeholder: 'Max Amount',
              },
              {
                label: 'Transaction Date From',
                title: 'transaction_date_range_from',
                type: 'date',
              },
              {
                label: 'Transaction Date To',
                title: 'transaction_date_range_to',
                type: 'date',
              },
              {
                label: 'Entry Date From',
                title: 'entry_date_range_from',
                type: 'date',
              },
              {
                label: 'Entry Date To',
                title: 'entry_date_range_to',
                type: 'date',
              },
              {
                label: 'Narration',
                title: 'narration',
                type: 'text',
                placeholder: 'Search by narration',
              },
            ]}
          >
            {(tableData?.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={journalReportHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {(() => {
                  // Stripe by group:
                  // - If entry_type === 'voucher': group by transaction_no + type (e.g. JV + 1)
                  // - Otherwise: group by entry_no
                  let lastGroupKey = null;
                  let isStripedGroup = false;

                  const getGroupKey = (row, rowIndex) => {
                    if (row.entry_type === 'voucher') {
                      return `voucher-${row.type ?? ''}-${row.transaction_no ?? ''}`;
                    }
                    return `entry-${row.entry_no ?? row.transaction_no ?? row.ledger_entry_id ?? rowIndex}`;
                  };

                  return tableData?.map((item, index) => {
                    const groupKey = getGroupKey(item, index);
                    if (groupKey !== lastGroupKey) {
                      isStripedGroup = !isStripedGroup;
                      lastGroupKey = groupKey;
                    }
                    const stripeClass = isStripedGroup ? 'journal-stripe-row' : '';

                    return (
                      <tr
                        className={`${stripeClass} ${
                          selectedItem?.transaction_no === item?.transaction_no &&
                          selectedItem?.type === item?.type
                            ? 'selected-row'
                            : ''
                        }`}
                        key={index}
                        onClick={() => handleRowClick(item, index)}
                      >
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
                      {formatDate(item.value_date)}
                    </td>
                    <td
                      style={{ cursor: 'pointer' }}
                      onClick={() =>
                        navigate('/reports/statement-of-accounts/generated', {
                          state: {
                            account_id: item.account_id,
                            account_type: item.ledger,
                          },
                        })
                      }
                      className={`text-decoration-underline  ${
                        item.is_marked ? 'highlight-marked' : ''
                      }`}
                    >
                      {item.account}
                    </td>
                    <td
                      className={`${item.is_marked ? 'highlight-marked' : ''}`}
                    >
                      {item.narration}
                    </td>
                    <td
                      className={`${item.is_marked ? 'highlight-marked' : ''}`}
                    >
                      {item.currency}
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
                      {item.credit &&
                      item.credit !== '' &&
                      item.credit !== '0' &&
                      item.credit !== 0
                        ? `-${item.base_amount}`
                        : item.base_amount}
                    </td>
                    <td
                      className={`${item.is_marked ? 'highlight-marked' : ''}`}
                    >
                      {item.cost_center}
                    </td>
                    <td
                      className={`${item.is_marked ? 'highlight-marked' : ''}`}
                    >
                      {item.user_id}
                    </td>
                    <td
                      className={`${item.is_marked ? 'highlight-marked' : ''}`}
                    >
                      {formatDate(item.updated_on)}
                    </td>
                    <td
                      className={`${item.is_marked ? 'highlight-marked' : ''}`}
                    >
                      {item.attachment}
                    </td>
                  </tr>
                    );
                  });
                })()}
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

export default withFilters(GeneratedJounralReport);
