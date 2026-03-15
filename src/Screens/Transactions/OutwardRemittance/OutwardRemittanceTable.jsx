import CustomTable from '../../../Components/CustomTable/CustomTable';
import withFilters from '../../../HOC/withFilters ';
import { useFetchTableData } from '../../../Hooks/useTable';
import { getOutwardRemittanceListingOrDetails } from '../../../Services/Transaction/OutwardRemittance';
import { outwardRemittanceHeaders } from '../../../Utils/Constants/TableHeaders';
import { formatDate, formatNumberForDisplay } from '../../../Utils/Utils';

const OutwardRemittanceTable = ({
  date,
  filters,
  pagination,
  updatePagination,
  setPageState,
  setSearchTerm,
  setWriteTerm,
  setFilters,
}) => {
  const {
    data: { data: outwardRemittanceDealData = [] } = {},
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'outwardRemittanceListing',
    {
      ...filters,
      date: date,
      // type: searchType,
    },
    updatePagination,
    getOutwardRemittanceListingOrDetails
  );

  if (isError) {
    console.error(error);
  }

  return (
    <CustomTable
      headers={outwardRemittanceHeaders}
      pagination={pagination}
      isLoading={isLoading}
      hasFilters={false}
      hideItemsPerPage
      hideSearch
      setFilters={setFilters}
    >
      {(outwardRemittanceDealData?.length || isError) && (
        <tbody>
          {isError && (
            <tr>
              <td colSpan={outwardRemittanceHeaders.length}>
                <p className="text-danger mb-0">
                  Unable to fetch data at this time
                </p>
              </td>
            </tr>
          )}
          {outwardRemittanceDealData?.map((row) => (
            <tr key={row.id}>
              <td>{formatDate(row?.date)}</td>
              <td
                className="cp"
                onClick={() => {
                  setWriteTerm(row.voucher.voucher_no);
                  setSearchTerm(row.voucher.voucher_no);
                  setPageState('view');
                }}
              >
                <p className="text-link hyper-link text-decoration-underline mb-0">
                  {row?.voucher?.voucher_no}
                </p>
              </td>
              <td>{row?.new_ledger}</td>
              <td>{row?.account_details?.title}</td>
              <td>{row?.reference_no}</td>
              <td>{row?.beneficiary?.name}</td>
              <td>{row?.fc_currency?.currency_code}</td>
              <td>{formatNumberForDisplay(row?.send_amount, 2)}</td>
              <td>{row?.againts_currency?.currency_code}</td>
              <td>{formatNumberForDisplay(row?.against_amount, 2)}</td>
              <td>{formatNumberForDisplay(row?.currency_charges, 2)}</td>
              <td>{formatNumberForDisplay(row?.vat_amount, 2)}</td>
              <td>{formatNumberForDisplay(row?.net_total, 2)}</td>
              <td>{row?.creator?.user_id}</td>
              <td>{formatDate(row?.created_at, 'HH:MM')}</td>
              <td>
                {row.attachments?.charAt(0).toUpperCase() +
                  row?.attachments?.slice(1)}
              </td>
            </tr>
          ))}
        </tbody>
      )}
    </CustomTable>
  );
};

export default withFilters(OutwardRemittanceTable);
