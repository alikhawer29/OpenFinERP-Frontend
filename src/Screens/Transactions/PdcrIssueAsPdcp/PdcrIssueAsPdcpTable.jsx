import React, { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import withFilters from '../../../HOC/withFilters ';
import { useFetchTableData } from '../../../Hooks/useTable';
import { searchTableHeaders } from '../../../Utils/Constants/TableHeaders';
import {
  formatDate,
  getCurrencyOptions,
  showErrorToast,
} from '../../../Utils/Utils';
import { getPdcrListing } from '../../../Services/Transaction/PdcrVoucher';
import useAccountsByType from '../../../Hooks/useAccountsByType';

const PdcrIssueAsPdcpTable = ({
  date,
  filters,
  pagination,
  updatePagination,
  setPageState,
  setSearchTerm,
}) => {
  const [ledgerAccountOptions, setLedgerAccountOptions] = useState([
    { value: 'All', label: 'All' },
  ]);

  // Get account options using custom hook
  const { getAccountsByTypeOptions } = useAccountsByType();
  const currencyOptions = getCurrencyOptions();

  // Fetch Ledger-Specific Accounts for Filter
  useEffect(() => {
    if (filters.ledger) {
      setLedgerAccountOptions(getAccountsByTypeOptions(filters.ledger, false));
    }
  }, [filters.ledger]);

  const {
    data: { data: pdcrVoucherData = [] } = {},
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'pdcrListing',
    {
      ...filters,
      date: date,
    },
    updatePagination,
    getPdcrListing
  );

  if (isError) {
    showErrorToast(error);
  }

  return (
    <Row>
      <Col xs={12}>
        <CustomTable
          hasFilters={false}
          headers={searchTableHeaders}
          pagination={pagination}
          updatePagination={updatePagination}
          isLoading={isLoading}
          hideSearch={true}
          hideItemsPerPage={true}
        >
          {(pdcrVoucherData?.length || isError) && (
            <tbody>
              {isError && (
                <tr>
                  <td colSpan={searchTableHeaders.length}>
                    <p className="text-danger mb-0">
                      Unable to fetch data at this time
                    </p>
                  </td>
                </tr>
              )}
              {pdcrVoucherData?.map((item, index) => (
                <tr key={index}>
                  <td>{formatDate(item?.voucher_date)}</td>
                  <td
                    onClick={() => {
                      setSearchTerm(item.voucher_no);
                      setPageState('view');
                    }}
                  >
                    <p className="hyper-link text-decoration-underline cp mb-0">
                      {item.voucher_no}
                    </p>
                  </td>
                  <td>{item.new_ledger}</td>
                  <td>{item.pdcr_party}</td>
                  <td>{item.party_bank}</td>
                  <td>{item.cheque_number}</td>
                  <td>{formatDate(item?.due_date, 'DD/MM/YYYY')}</td>
                  <td>{item.currency}</td>
                  <td>{item.fc_net_total}</td>
                  <td>{item.lc_net_total}</td>
                  <td>{item.user_id}</td>
                  <td>{formatDate(item.time, 'HH:MM')}</td>
                  <td>{item.attachments}</td>
                </tr>
              ))}
            </tbody>
          )}
        </CustomTable>
      </Col>
    </Row>
  );
};

export default withFilters(PdcrIssueAsPdcpTable);
