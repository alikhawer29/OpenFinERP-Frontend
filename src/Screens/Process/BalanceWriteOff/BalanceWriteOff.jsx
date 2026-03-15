import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import CustomButton from '../../../Components/CustomButton';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import withFilters from '../../../HOC/withFilters ';
import withModal from '../../../HOC/withModal';
import { useFetchTableData } from '../../../Hooks/useTable';
import {
  getBalanceWriteOff,
  getBalanceWriteOffOptions,
} from '../../../Services/Process/BalanceWriteOff';
import { showErrorToast } from '../../../Utils/Utils';

const BalanceWriteOff = ({
  filters,
  setFilters,
  pagination,
  updatePagination,
  showModal,
}) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [currencyOptions, setCurrencyOptions] = useState([]);
  const [accountOptions, setAccountOptions] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const {
    data: { data: balanceWriteOffData = [] } = {},
    isLoading: isLoadingbalanceWriteOff,
    isError: isErrorbalanceWriteOff,
    error: balanceWriteOffError,
  } = useFetchTableData(
    'balanceWriteOffListing',
    filters,
    updatePagination,
    getBalanceWriteOff
  );

  // Get filter options
  const {
    data: balanceWriteOffOptions,
    isLoading: isLoadingBalanceWriteOffOptions,
    isError: isErrorBalanceWriteOffOptions,
    error: balanceWriteOffOptionsError,
  } = useQuery({
    queryKey: ['balanceWriteOffOptions'],
    queryFn: getBalanceWriteOffOptions,
  });

  useEffect(() => {
    if (balanceWriteOffOptions) {
      setCurrencyOptions(
        balanceWriteOffOptions?.currencies?.map((item) => ({
          value: item.id,
          label: item.currency_code,
        }))
      );
      setAccountOptions(
        balanceWriteOffOptions?.accounts?.map((item) => ({
          value: item.id,
          label: item.account_name,
        }))
      );
    }
  }, [balanceWriteOffOptions]);

  if (balanceWriteOffOptionsError) {
    showErrorToast(balanceWriteOffOptionsError, 'error');
  }

  const isAllSelected =
    balanceWriteOffData.length > 0 &&
    balanceWriteOffData.every((item) =>
      selectedRows.some((x) => x.id === item.id)
    );

  const handlePostClick = () => {
    showModal(
      'Balance',
      'Balance has been Written-Off using JV# 17600',
      null,
      'success'
    );
  };

  const balanceWriteOffHeaders = [
    <div className="checkbox-wrapper">
      <label className="checkbox-container">
        <input
          type="checkbox"
          checked={isAllSelected}
          onChange={(e) => {
            e.target.checked
              ? setSelectedRows(balanceWriteOffData)
              : setSelectedRows([]);
          }}
          name={'header'}
        />
        <span className="custom-checkbox"></span>
      </label>
    </div>,
    'Ledger',
    'Account Name',
    'FCy',
    'Debit Balance',
    'Credit Balance',
  ];

  if (balanceWriteOffError) {
    showErrorToast(balanceWriteOffError, 'error');
  }

  return (
    <>
      <div className="d-flex justify-content-between flex-wrap mb-4">
        <h2 className="screen-title mb-0">Balance Write-Off</h2>
      </div>
      <Row>
        <Col xs={12}>
          <div className="d-flex justify-content-between align-items-center flex-wrap mb-45">
            <SearchableSelect
              label="Posting Account"
              borderRadius="10px"
              minWidth={250}
              placeholder="Select Account"
              options={accountOptions}
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.value)}
            />
            <CustomButton
              disabled={
                !selectedRows?.length ||
                isLoadingbalanceWriteOff ||
                !selectedAccount
              }
              text={'Post'}
              onClick={handlePostClick}
            />
          </div>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={balanceWriteOffHeaders}
            pagination={pagination}
            isLoading={isLoadingbalanceWriteOff}
            selectOptions={[
              {
                label: "FCy",
                title: 'currency_id',
                options: isErrorBalanceWriteOffOptions
                  ? [{ value: '', label: 'Unable to fetch options' }]
                  : isLoadingBalanceWriteOffOptions
                    ? [{ value: '', label: 'Loading...' }]
                    : currencyOptions,
              },
            ]}
            dateFilters={[{ label: "Date Range", title: 'date', type: 'date' }]}
            rangeFilters={[{ label: 'Amount', title: 'amount', type: 'number' }]}
          >
            {(balanceWriteOffData.length || isErrorbalanceWriteOff) && (
              <tbody>
                {isErrorbalanceWriteOff && (
                  <tr>
                    <td colSpan={balanceWriteOffHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {balanceWriteOffData?.map((item) => {
                  const netBalance =
                    parseFloat(item?.total_debit) -
                    parseFloat(item?.total_credit);

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="checkbox-wrapper">
                          <label className="checkbox-container">
                            <input
                              type="checkbox"
                              checked={
                                selectedRows.some((x) => item.id === x.id) ||
                                false
                              }
                              onChange={(e) => {
                                e.target.checked
                                  ? setSelectedRows([...selectedRows, item])
                                  : setSelectedRows([
                                    ...selectedRows.filter(
                                      (x) => x.id != item.id
                                    ),
                                  ]);
                              }}
                              name={item.id}
                            />
                            <span className="custom-checkbox"></span>
                          </label>
                        </div>
                      </td>
                      <td>{item?.ledger}</td>
                      <td>{item?.account_name}</td>
                      <td>{item?.fcy || '-'}</td>
                      <td>{item?.debit_balance || '-'}</td>
                      <td>{item?.credit_balance || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </CustomTable>
        </Col>
      </Row>
    </>
  );
};

export default withModal(withFilters(BalanceWriteOff));
