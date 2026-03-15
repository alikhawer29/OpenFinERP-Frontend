import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../../../Components/CustomButton';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import { showToast } from '../../../Components/Toast/Toast';
import withFilters from '../../../HOC/withFilters ';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import {
  getDealCurrencyOptions,
  getDealRegisterListing,
  getDealRegisterSummary,
  printDealRegister,
} from '../../../Services/Transaction/DealRegister';
import { getCurrencies } from '../../../Services/Transaction/JournalVoucher';
import {
  dealRegistryHeaders,
  summaryTableHeaders,
} from '../../../Utils/Constants/TableHeaders';
import {
  formatDate,
  formatNumberForDisplay,
  showErrorToast,
} from '../../../Utils/Utils';

const DealRegistry = ({ filters, setFilters }) => {
  usePageTitle('Deal Register');
  const navigate = useNavigate();
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));

  // Permissions
  const permissions = useModulePermissions('transactions', 'deal_register');
  const { print: hasPrintPermission } = permissions || {};

  // Data fetching
  const {
    data: dealRegisterData = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['getOutwardRemittanceRegisterListing', filters],
    queryFn: () => getDealRegisterListing(filters),
    // refetchOnWindowFocus: true,
    retry: 1,
  });

  // Summary fetching
  const {
    data: dealRegisterSummaryData = [],
    isLoading: summaryIsLoading,
    isError: summaryIsError,
    error: summaryError,
  } = useQuery({
    queryKey: ['getDealRegisterSummary', filters?.date, filters?.currency],
    queryFn: (params) =>
      getDealRegisterSummary(filters?.date, filters?.currency),
    // refetchOnWindowFocus: true,
    retry: 1,
    enabled: !!filters?.date && !!filters?.currency, // Ensure it only runs when values are present
  });

  if (isError || summaryIsError) {
    showErrorToast(error || summaryError);
  }

  const { data: currencies = [], isSuccess } = useQuery({
    queryKey: ['currenciesTypes'],
    queryFn: getDealCurrencyOptions,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Use useEffect to handle side effects (like setting the default value)
  useEffect(() => {
    if (isSuccess && currencies.length > 0) {
      setSelectedCurrency(currencies[0].id);
    }
  }, [isSuccess, currencies]);

  useEffect(() => {
    if (selectedCurrency && typeof setFilters === 'function') {
      setFilters((prev) => ({
        ...prev,
        currency: selectedCurrency,
        date: date,
      }));
    }
  }, [selectedCurrency, date, setFilters]);

  // Mutation setup
  const { mutate: handlePrint, isLoading: isPrinting } = useMutation({
    mutationFn: () => printDealRegister(filters?.date, filters?.currency),
    onSuccess: (res) => {
      const url = res?.pdf_url;
      if (url) {
        window.open(url, '_blank'); // open PDF in new tab
      } else {
        showToast('PDF URL not found.', 'error');
      }
    },
    onError: (error) => {
      console.error('Failed to fetch PDF:', error);
      showErrorToast(error);
    },
  });

  return (
    <section>
      <div className="d-flex flex-wrap align-items-center gap-3 justify-content-between mb-3">
        <h2 className="screen-title m-0 d-inline">Deal Register</h2>
        <div className="d-flex align-items-center flex-wrap gap-3">
          {hasPrintPermission && (
            <CustomButton
              className="secondaryButton"
              text={isPrinting ? 'Printing...' : 'Print'}
              onClick={() => handlePrint()}
            />
          )}
          <CustomButton
            className={'secondaryButton'}
            text={'Position Summary'}
            onClick={() =>
              navigate('/transactions/position-summary', {
                state: {
                  selectedDate: filters?.date, // or any specific date value you want to send
                },
              })
            }
          />
        </div>
      </div>
      <Row>
        <Col xs={12}>
          <CustomTable
            hideItemsPerPage
            filters={filters}
            setFilters={setFilters}
            headers={dealRegistryHeaders}
            isLoading={isLoading}
            isPaginated={false}
            hideSearch
            className={'inputTable'}
            selectOptions={[
              {
                title: 'currency',
                options: currencies.map((c) => ({
                  value: c.id,
                  label: c.currency_code,
                })),
              },
            ]}
            additionalFilters={[
              {
                title: 'Date',
                type: 'date',
              },
            ]}
          >
            {(dealRegisterData?.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={dealRegistryHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {dealRegisterData?.map((item, index) => (
                  <tr key={index++}>
                    <td>{item?.account}</td>
                    <td className="">{item?.buy_amount}</td>
                    <td className="">{item?.sell_amount}</td>
                    <td>{item?.ag_fc_currency}</td>
                    <td className="">{item?.ag_fc_amount}</td>
                    <td className="">{item?.rate}</td>
                    <td>{item?.user_id}</td>
                    <td className="">{item?.convert_rate}</td>
                    <td>{item?.transaction_no}</td>
                    <td>{formatDate(item?.value_date)}</td>
                    <td>{item?.description}</td>
                    <td className="">{item?.balance}</td>
                  </tr>
                ))}
              </tbody>
            )}
          </CustomTable>

          {/* Add Summary Table */}
          <CustomTable
            hideItemsPerPage
            hideSearch
            className={'inputTable'}
            isPaginated={false}
            headers={summaryTableHeaders}
            isLoading={isLoading}
            styles={{ minHeight: 'unset', fontSize: '1px' }}
          >
            <tbody>
              {dealRegisterSummaryData?.map((item, index) => (
                <tr key={index++}>
                  <th>{item.type}</th>
                  <td
                    className={` ${
                      parseFloat(item.fcAmount) < 0 ? 'text-danger' : ''
                    }`}
                  >
                    {/* {formatNumberForDisplay(item.fcAmount, 2)} */}
                    {item.fcAmount}
                  </td>
                  <td className="">
                    {/* {formatNumberForDisplay(item.rate, 8)} */}
                    {item.rate}
                  </td>
                  <td
                    className={` ${
                      parseFloat(item.baseValue) < 0 ? 'text-danger' : ''
                    }`}
                  >
                    {/* {formatNumberForDisplay(item.baseValue, 2)} */}
                    {item.baseValue}
                  </td>
                </tr>
              ))}
            </tbody>
          </CustomTable>
        </Col>
      </Row>
    </section>
  );
};
export default withFilters(DealRegistry);
