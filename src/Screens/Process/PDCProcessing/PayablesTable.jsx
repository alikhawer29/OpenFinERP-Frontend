import React, { useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { HiOutlineEye } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import StatusChip from '../../../Components/StatusChip/StatusChip';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import withFilters from '../../../HOC/withFilters ';
import useAccountsByType from '../../../Hooks/useAccountsByType';
import { useBanks } from '../../../Hooks/useBanks';
import { useFetchTableData } from '../../../Hooks/useTable';
import { getPDCProcesses } from '../../../Services/Process/PDCProcesses';
import { ledgerOptions, PDCProcessReceivableFilterOptions } from '../../../Utils/Constants/SelectOptions';
import { pdcProcessHeaders } from '../../../Utils/Constants/TableHeaders';
import { formatDate, showErrorToast, toSnakeCase } from '../../../Utils/Utils';

const PayablesTable = ({
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  const navigate = useNavigate();
  const { bankOptions } = useBanks();
  const { getAccountsByTypeOptions } = useAccountsByType();
  const [nonTriggeringFilters, setNonTriggeringFilters] = useState({});

  const {
    data: { data: payablesData = [] } = {},
    isLoading: isLoadingPayables,
    isError: isErrorPayables,
    error: payablesError,
  } = useFetchTableData(
    'PDCProcessesPayablesListing',
    filters,
    updatePagination,
    () => getPDCProcesses('payables', filters)
  );

  if (payablesError) {
    showErrorToast(payablesError, 'error');
  }

  const handleNonTriggeringFiltersChange = (newNonTriggeringFilters) => {
    setNonTriggeringFilters(newNonTriggeringFilters);
  };

  return (
    <Row>
      <Col xs={12}>
        <CustomTable
          filters={filters}
          setFilters={setFilters}
          headers={pdcProcessHeaders}
          pagination={pagination}
          isLoading={isLoadingPayables}
          onNonTriggeringFiltersChange={handleNonTriggeringFiltersChange}
            selectOptions={[
                     {
                       title: 'status',
                       options: PDCProcessReceivableFilterOptions,
                     },
                     {
                       title: 'bank',
                       options: [{ label: 'All', value: '' }, ...bankOptions],
                     },
                     {
                       title: 'ledger',
                       triggerFilterOnChange: false,
                       options: [{ label: 'All', value: '' }, ...ledgerOptions],
                     },
                     // show account options only if ledger is selected
                     ...(nonTriggeringFilters.ledger
                       ? [
                           {
                             label:"Account",
                             title: 'account_id',
                             options: getAccountsByTypeOptions(
                               nonTriggeringFilters.ledger,
                               false
                             ),
                           },
                         ]
                       : []),
                   ]}
                   additionalFilters={[
                     { title:"posting_date" , label: 'Posting Date', type: 'date' },
                     { title:"due_date" , label: 'Due Date', type: 'date' },
                     {
                       label: "Cheque No",
                       title: 'cheque_no',
                       type:"text",
                       placeholder:"Enter Cheque No"
                     },
                   ]}
        >
          {(payablesData?.length || isErrorPayables) && (
            <tbody>
              {isErrorPayables && (
                <tr>
                  <td colSpan={pdcProcessHeaders?.length}>
                    <p className="text-danger mb-0">
                      Unable to fetch data at this time
                    </p>
                  </td>
                </tr>
              )}
              {payablesData?.map((item) => (
                <tr key={item.id}>
                  <td>{item.cheque_number}</td>
                  <td>{formatDate(item.due_date, 'DD/MM/YYYY')}</td>
                  <td>{formatDate(item.posting_date, 'DD/MM/YYYY')}</td>
                  <td>{item.currency}</td>
                  <td>{item.amount}</td>
                  <td>{item.bank?.name}</td>
                  <td>{item.title_of_account}</td>
                  {/* show tooltip with complete narration on hover */}
                  <td
                    className="tooltip-toggle"
                    aria-label={item.narration}
                    // title={item.narration}
                  >
                    {item.narration.slice(0, 50)}
                    {item.narration?.length > 50 ? '...' : ''}
                  </td>
                  <td>
                    <StatusChip status={item.status} />
                  </td>
                  <td>
                    <TableActionDropDown
                      actions={[
                        {
                          name: 'View',
                          icon: HiOutlineEye,
                          onClick: () =>
                            navigate(
                              `${item?.voucher_id}/payable/${toSnakeCase(item.status)}`,
                              {
                                state: { pdc: item },
                              }
                            ),
                          className: 'view',
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </CustomTable>
      </Col>
    </Row>
  );
};

export default withFilters(PayablesTable);
