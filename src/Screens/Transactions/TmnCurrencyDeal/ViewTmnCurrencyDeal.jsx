import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import { showToast } from '../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import {
  getAccountBalances,
  getBanksTRQ,
  getCities,
  getDocTypes,
  getExchangeRates,
} from '../../../Services/General';
import {
  checkTransactionLockStatus,
  lockTransaction,
} from '../../../Services/Process/TransactionLock';
import {
  deleteTMNCurrencyDeal,
  getTMNCurrencyDealListingOrDetails,
} from '../../../Services/Transaction/TMNCurrencyDeal';
import useSettingsStore from '../../../Stores/SettingsStore';
import { formatNumberForDisplay, showErrorToast, getCurrencyOptions } from '../../../Utils/Utils';

const ViewTmnCurrencyDeal = ({
  searchTerm,
  setDate,
  setWriteTerm,
  setSearchTerm,
  setPageState,
  lastVoucherNumbers,
  searchType, // 'buy' or 'sell'
  permissions,
  hasViewPermission,
  hasEditPermission,
  hasDeletePermission,
  hasPrintPermission,
}) => {
  const queryClient = useQueryClient();
  const prevSearchType = useRef(null);

  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [exchangeRatesInverse, setExchangeRatesInverse] = useState(false);

  const { getAccountBalanceSettings } = useSettingsStore();

  // Get currency options
  const currencyOptions = getCurrencyOptions();

  // Get bank options
  // const { bankOptions } = useBanks();

  const {
    data: bankOptions,
    isLoading: isLoadingBanks,
    isError: isErrorBanks,
    error: errorBanks,
  } = useQuery({
    queryKey: ['banks'],
    queryFn: getBanksTRQ,
    refetchOnWindowFocus: false,
  });

  // Get document types
  const { data: docTypes } = useQuery({
    queryKey: ['doc-types'],
    queryFn: getDocTypes,
    refetchOnWindowFocus: false,
  });

  // Get cities
  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: getCities,
    refetchOnWindowFocus: false,
  });

  // Helper function to get bank name by ID
  const getBankNameById = (bankId) => {
    if (!bankId) return '';
    const bank = bankOptions.find((b) => b.id == bankId);
    return bank?.description || '';
  };

  // Helper function to get document type name by ID
  const getDocTypeNameById = (docTypeId) => {
    if (!docTypeId) return '';
    const docType = docTypes?.find((d) => d.id === docTypeId);
    return docType?.description || '';
  };

  // Helper function to get city name by ID
  const getCityNameById = (cityId) => {
    if (!cityId) return '';
    const city = cities?.find((c) => c.id === cityId);
    return city?.description || '';
  };

  const voucherName =
    searchType === 'buy' ? 'tmn_buy_currency_deal' : 'tmn_sell_currency_deal';
  const {
    data: { data: [tmnCurrencyDealData] = [] } = {},
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ['tmnCurrencyDeal', searchTerm, searchType],
    queryFn: () =>
      getTMNCurrencyDealListingOrDetails({
        search: searchTerm,
        type: searchType,
      }),
    refetchOnWindowFocus: false,
  });

  const tmnCurrencyDeal = tmnCurrencyDealData?.tmn_currency_deal;

  // Account balance for the selected ledger account
  const { data: ledgerAccountBalance } = useQuery({
    queryKey: [
      'accountBalance',
      tmnCurrencyDeal?.account_id,
      tmnCurrencyDeal?.account_ledger,
    ],
    queryFn: () =>
      getAccountBalances(
        tmnCurrencyDeal?.account_id,
        tmnCurrencyDeal?.account_ledger
      ),
    enabled:
      !!tmnCurrencyDeal?.account_id &&
      !!tmnCurrencyDeal?.account_ledger &&
      getAccountBalanceSettings('tmn_currency_deal'),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

  // Exchange rates
  const {
    data: exchangeRatesData,
    isLoading: isLoadingExchangeRates,
    isError: isErrorExchangeRates,
  } = useQuery({
    queryKey: ['exchangeRates', exchangeRatesInverse],
    queryFn: () => getExchangeRates(exchangeRatesInverse),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  useEffect(() => {
    if (tmnCurrencyDealData?.voucher_no) {
      setDate(tmnCurrencyDealData.date);
      setWriteTerm(tmnCurrencyDealData.voucher_no);
    }
  }, [tmnCurrencyDealData?.voucher_no]);

  // redirect to list page when search type changes
  useEffect(() => {
    // skip on initial mount
    if (prevSearchType.current && prevSearchType.current !== searchType) {
      setSearchTerm('');
      setWriteTerm('');
      setPageState('list');
    }
    prevSearchType.current = searchType;
  }, [searchType]);

  // Check Transaction lock status to enable/disable actions
  const {
    isLoading: isLoadingLockStatus,
    isError: isErrorLockStatus,
    error: errorLockStatus,
  } = useQuery({
    queryKey: [
      'lock_status',
      voucherName,
      tmnCurrencyDealData?.id || tmnCurrencyDeal?.id,
    ],
    queryFn: () =>
      checkTransactionLockStatus({
        transaction_type: voucherName,
        transaction_id: tmnCurrencyDealData?.id || tmnCurrencyDeal?.id,
      }),
    enabled: !!(tmnCurrencyDealData || tmnCurrencyDeal),
    retry: false,
  });

  useEffect(() => {
    if (errorLockStatus?.detail?.locked) {
      showToast(errorLockStatus?.message, 'warn');
    }
  }, [errorLockStatus]);

  // Lock Transaction on Edit
  const lockTransactionMutation = useMutation({
    mutationFn: lockTransaction,
  });

  // Delete Mutation
  const deleteTmnCurrencyDealMutation = useMutation({
    mutationFn: (id) => deleteTMNCurrencyDeal(id, tmnCurrencyDeal?.type),
    onSuccess: (_, variables) => {
      showToast(
        `${tmnCurrencyDealData?.voucher_type === 'tmn_buy_currency_deal'
          ? 'TSN'
          : 'TBN'
        } ${tmnCurrencyDealData?.voucher_no} deleted successfully!`,
        'success'
      );
      // Clear all queries to prevent fetching deleted voucher
      queryClient.removeQueries(['tmnCurrencyDeal', searchTerm]);
      queryClient.removeQueries(['tmnCurrencyDeal', searchTerm, searchType]);
      queryClient.invalidateQueries(['voucherNumber', searchTerm]);
      queryClient.invalidateQueries(['voucherNumber', variables]);
      queryClient.invalidateQueries(['voucherNumber', '']);
      setShowDeleteModal(false);
      setPageState('new');
      setWriteTerm('');
      setSearchTerm('');
      setDate(''); // Clear date to prevent query with old searchTerm
      // Don't reset searchType here as it should remain the same
    },
    onError: (error) => {
      setShowDeleteModal(false);
      showErrorToast(error);
    },
  });

  const handleEdit = () => {
    const transactionId = tmnCurrencyDealData?.id || tmnCurrencyDeal?.id;
    if (transactionId) {
      lockTransactionMutation.mutate({
        transaction_type: voucherName,
        transaction_id: transactionId,
      });
    }
    setPageState('edit');
  };

  if (isError) {
    showErrorToast(error);
    return (
      <div className="d-card">
        <p className="text-danger mb-0">Error fetching TMN Currency Deal</p>
      </div>
    );
  }

  if (isLoading || isFetching) {
    return (
      <div className="d-card">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <div className="row mb-3">
              {Array.from({ length: 14 }).map((_, i) => (
                <div
                  key={i}
                  className="col-12 col-sm-6 mb-3 align-items-center"
                  style={{ height: 56 }}
                >
                  <Skeleton
                    style={{ marginTop: 28 }}
                    duration={1}
                    width={'50%'}
                    baseColor="#ddd"
                    height={22}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tmnCurrencyDeal) {
    return (

      <div className="d-card">
        <p className="text-danger mb-0">
          No TMN Currency Deal found for ID {searchTerm}
        </p>
      </div>
    );
  }

  if (!hasViewPermission) {
    return (
      <div className="d-card text-center">
        <p className="text-danger">You are not authorized to view this TMN currency deal</p>
      </div>
    );
  }

  let scText = tmnCurrencyDealData?.special_commission_text;

  return (
    <>
      <div className="d-card">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7 mb-4">
            <div className="row">
              {[
                {
                  label: 'Type',
                  value: tmnCurrencyDeal?.type || '-',
                },
                {
                  label: 'Mode',
                  value: tmnCurrencyDeal?.mode || '-',
                },
                {
                  label: 'Account',
                  value: tmnCurrencyDeal?.account_details?.title || '-',
                },
                {
                  label: 'Beneficiary',
                  value: tmnCurrencyDeal?.beneficiary?.name || '-',
                },
                {
                  label: 'Bank',
                  value: tmnCurrencyDeal?.bank_name || '-',
                },
                {
                  label: 'Bank Account No.',
                  value: tmnCurrencyDeal?.bank_account_no || '-',
                },
                {
                  label: 'City',
                  value: tmnCurrencyDeal?.city || '-',
                },
                {
                  label: 'Purpose',
                  value: tmnCurrencyDeal?.purpose?.description || '-',
                },
                {
                  label: `${searchType === 'buy' ? 'Buy' : 'Sell'} FCy`,
                  value: `${tmnCurrencyDeal?.fcy?.currency_code} ${formatNumberForDisplay(tmnCurrencyDeal?.fc_amount, 2)}`,
                },
                {
                  label: 'Rate Type',
                  value: `${tmnCurrencyDeal?.rate_type} ${formatNumberForDisplay(tmnCurrencyDeal?.rate, 8)}`,
                },
                {
                  label: 'Ag FCy',
                  value: `${tmnCurrencyDeal?.against_f_cy?.currency_code} ${formatNumberForDisplay(tmnCurrencyDeal?.ag_amount, 2)}`,
                },
                // Commission - always show label, value depends on commission type
                {
                  label: 'Commission',
                  value: tmnCurrencyDealData?.special_commission_text
                    ? '–'
                    : tmnCurrencyDeal?.commission_amount
                      ? `${tmnCurrencyDeal?.fcy?.currency_code} ${formatNumberForDisplay(tmnCurrencyDeal?.commission_amount, 2)}`
                      : '–',
                },

                // VAT Terms - always show label
                {
                  label: 'VAT Terms',
                  value: (() => {
                    if (tmnCurrencyDeal?.vat_type === 'fixed') {
                      return `Fixed ${tmnCurrencyDeal?.vat_percentage}%`;
                    } else if (tmnCurrencyDeal?.vat_type === 'variable') {
                      const title =
                        tmnCurrencyDeal?.vats?.title ||
                        tmnCurrencyDeal?.vat_terms ||
                        '';
                      const percentage =
                        tmnCurrencyDeal?.vat_percentage || '';
                      return title && percentage
                        ? `${title} - ${percentage}%`
                        : title || percentage;
                    }
                    return '–';
                  })(),
                },
                // VAT - always show label
                {
                  label: 'VAT',
                  value: tmnCurrencyDeal?.vat_amount && Number(tmnCurrencyDeal?.vat_amount) !== 0
                    ? tmnCurrencyDeal?.vat_currency_id
                      ? `${currencyOptions.find((x) => x.value === tmnCurrencyDeal.vat_currency_id)?.label || ''} ${formatNumberForDisplay(tmnCurrencyDeal?.vat_amount, 2)}`
                      : tmnCurrencyDeal?.fcy?.currency_code
                        ? `${tmnCurrencyDeal?.fcy?.currency_code} ${formatNumberForDisplay(tmnCurrencyDeal?.vat_amount, 2)}`
                        : '–'
                    : '–',
                },
                {
                  label: 'Total',
                  value: tmnCurrencyDeal?.total_currency_id
                    ? `${currencyOptions.find(x => x.value === tmnCurrencyDeal.total_currency_id)?.label || ''} ${formatNumberForDisplay(tmnCurrencyDeal?.total_amount, 2)}`
                    : `${tmnCurrencyDeal?.fcy?.currency_code} ${formatNumberForDisplay(tmnCurrencyDeal?.total_amount, 2)}`,
                },
              ].map((x, i) => {
                // if (isNullOrEmpty(x.value)) return null;
                return (
                  <div key={i} className="col-12 col-sm-6 mb-4">
                    <p className="detail-title detail-label-color mb-1">
                      {x.label}
                    </p>
                    <p className="detail-text wrapText mb-0">
                      {/* \u00A0 is added to maintain the height of the row*/}
                      {x?.value || '\u00A0'}{' '}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="col-0 col-xxl-2" />

        </div>
        <div className="d-flex justify-content-between flex-wrap">
          {scText ? (
            <p className="wrapText mb-0">
              <span
                className={`${scText?.includes('payable')
                  ? 'text-danger'
                  : scText?.includes('receivable')
                    ? 'text-success'
                    : ''
                  }`}
              >
                {scText}
              </span>
            </p>
          ) : (
            <div />
          )}
        </div>
      </div>
      {/* { Allocation table */}
      {tmnCurrencyDeal?.allocations?.length > 0 && (
        <div className="mt-45">
          <CustomTable
            hasFilters={false}
            setFilters={false}
            headers={[
              'Sell No',
              'Account Name',
              'Amount',
              'Doc Type',
              'Number',
              'Bank',
              'Code',
              'City',
              'Description',
            ]}
            isLoading={false}
            sortKey={false}
            sortOrder={false}
            handleSort={false}
            isPaginated={false}
          >
            <tbody>
              {tmnCurrencyDeal?.allocations?.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.account_details?.title}</td>
                  <td>{formatNumberForDisplay(row.amount, 2)}</td>
                  <td>
                    {getDocTypeNameById(row.document_type_id) ||
                      row.document_type}
                  </td>
                  <td>{row.number}</td>
                  <td>{getBankNameById(row.bank_id) || row.bank_name}</td>
                  <td>{row.code}</td>
                  <td>{getCityNameById(row.city_id) || row.city}</td>
                  <td>{row.description}</td>
                </tr>
              ))}
            </tbody>
          </CustomTable>
        </div>
      )}
      <VoucherNavigationBar
        searchTerm={searchTerm}
        actionButtons={[
          ...(hasEditPermission ? [
            {
              text: 'Edit',
              onClick: handleEdit,
              disabled:
                isLoadingLockStatus ||
                isErrorLockStatus ||
                errorLockStatus?.detail?.locked,
            },
          ] : []),
          ...(hasDeletePermission ? [
            {
              text: 'Delete',
              onClick: () => setShowDeleteModal(true),
              variant: 'secondaryButton',
              disabled:
                isLoadingLockStatus ||
                isErrorLockStatus ||
                errorLockStatus?.detail?.locked,
            },
          ] : []),
          ...(hasPrintPermission ? [
            ...(tmnCurrencyDealData?.pdf_url
              ? [
                {
                  text: 'Print',
                  onClick: () => {
                    if (tmnCurrencyDealData?.pdf_url) {
                      window.open(tmnCurrencyDealData?.pdf_url, '_blank');
                    }
                  },
                  variant: 'secondaryButton',
                },
              ]
              : []),
          ] : []),


        ]}
        loading={isLoading || isFetching}
        onAttachmentClick={() => setShowAttachmentsModal(true)}
        lastVoucherNumbers={lastVoucherNumbers}
        setPageState={setPageState}
        setWriteTerm={setWriteTerm}
        setSearchTerm={setSearchTerm}
      />
      {/* Attachments Modal */}
      <CustomModal
        show={showAttachmentsModal}
        close={() => setShowAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          viewOnly
          item={tmnCurrencyDealData}
          closeUploader={() => setShowAttachmentsModal(false)}
        />
      </CustomModal>

      {/* Delete Modal */}
      <CustomModal
        show={showDeleteModal}
        close={() => {
          setShowDeleteModal(false); // Close the modal on cancel
        }}
        action={() => {
          if (tmnCurrencyDeal) {
            deleteTmnCurrencyDealMutation.mutate(
              tmnCurrencyDealData?.voucher_no
            );
          }
        }}
        title="Delete"
        description={`Are you sure you want to delete ${tmnCurrencyDealData?.voucher_type === 'tmn_buy_currency_deal'
          ? 'TSN'
          : 'TBN'
          } ${tmnCurrencyDealData?.voucher_no}?`}
        disableClick={deleteTmnCurrencyDealMutation.isPending}
      />
    </>
  );
};

export default ViewTmnCurrencyDeal;
