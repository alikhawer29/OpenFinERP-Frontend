import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import withFilters from '../../../HOC/withFilters ';
import { getTTRAllocationListing } from '../../../Services/Transaction/TtrRegister';
import { ttrRegisterConfirmationHeaders } from '../../../Utils/Constants/TableHeaders';
import NewTTRConfirmation from './New/NewTTRConfirmation';
import ViewTTRRegisterConfirmation from './ViewTTRRegisterConfirmation';
import EditTTRConfirmation from './Edit/EditTTRConfirmation';
import { formatDate } from '../../../Utils/Utils';
import { formatNumberWithCommas } from '../../../Utils/Helpers';

const TTRRegisterConfirmation = ({
  filters,
  setFilters,
  pagination,
  setSelectedConfirmationId,
}) => {
  const navigate = useNavigate();

  const [selectedRowId, setSelectedRowId] = useState(null);
  const [pageState, setPageState] = useState('list'); // Changed to 'list' to show table first
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));

  // Initialize lastVoucherNumbers state following codebase pattern
  const [lastVoucherNumbers, setLastVoucherNumbers] = useState({
    heading: 'Last TTR Confirmation Number: ',
    current: '',
    previous: '',
    next: '',
    isLoadingVoucherNumber: false,
    isErrorVoucherNumber: false,
    errorVoucherNumber: null,
  });

  // Data fetching
  const {
    data: confirmationData = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['getTTRAllocationListing', filters],
    queryFn: () => getTTRAllocationListing(filters),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const getAllocationSummary = (data) => {
    let totalAllocated = 0;
    let totalUnconfirmed = 0;

    data?.forEach((item) => {
      totalAllocated += parseFloat(item?.allocated_amount || 0);
      totalUnconfirmed += parseFloat(item?.unconfirmed_amount || 0);
    });

    return {
      totalAllocated: totalAllocated.toFixed(2),
      totalUnconfirmed: totalUnconfirmed.toFixed(2),
    };
  };

  const allocationSummary = getAllocationSummary(confirmationData);

  const summaryRow = (
    <tr key="tmn-summary" className="table-summary-row">
      <td colSpan={5}></td>
      <td>
        <strong>Total </strong>
      </td>
      <td>
        <strong>
          {formatNumberWithCommas(allocationSummary.totalAllocated)}
        </strong>
      </td>
      <td></td>
      <td>
        <strong>
          {formatNumberWithCommas(allocationSummary.totalUnconfirmed)}
        </strong>
      </td>
    </tr>
  );

  const renderPageContent = () => {
    const selectedData = confirmationData?.find(
      (item) => item.id === selectedRowId
    );

    const pageComponents = {
      new: <NewTTRConfirmation selectedConfirmationData={selectedData} />,
      view: (
        <ViewTTRRegisterConfirmation
          setDate={setDate}
          setPageState={setPageState}
          lastVoucherNumbers={lastVoucherNumbers}
        />
      ),
      edit: (
        <EditTTRConfirmation
          setDate={setDate}
          setPageState={setPageState}
          lastVoucherNumbers={lastVoucherNumbers}
        />
      ),
      list: (
        <CustomTable
          filters={filters}
          setFilters={setFilters}
          headers={ttrRegisterConfirmationHeaders}
          pagination={pagination}
          isLoading={isLoading}
          isPaginated={false}
          summaryRows={summaryRow}
        >
          {(confirmationData.length || isError) && (
            <tbody>
              {isError && (
                <tr>
                  <td colSpan={ttrRegisterConfirmationHeaders.length}>
                    <p className="text-danger mb-0">
                      Unable to fetch data at this time
                    </p>
                  </td>
                </tr>
              )}
              {confirmationData?.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => {
                    const isSelected = selectedRowId === item.id;
                    const newSelectedId = isSelected ? null : item.id;

                    setSelectedRowId(newSelectedId);
                    setSelectedConfirmationId(newSelectedId);

                    // Only select the row, don't automatically go to New page
                  }}
                  className={`${
                    selectedRowId === item.id ? 'table-selected-row' : ''
                  }`}
                >
                  <td>{formatDate(item.date, 'DD/MM/YYYY' || '-')}</td>
                  <td>{item.credit_party_account || '-'}</td>
                  <td>{item.debit_party_account || '-'}</td>
                  <td>{item.bank_name || '-'}</td>
                  <td>{item.bank_account || '-'}</td>
                  <td>{item.remarks || '-'}</td>
                  <td>
                    {formatNumberWithCommas(item.allocated_amount) || '-'}
                  </td>
                  <td>
                    {formatNumberWithCommas(item.confirmed_amount) || '-'}
                  </td>
                  <td>
                    {formatNumberWithCommas(item.unconfirmed_amount) || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </CustomTable>
      ),
    };

    return pageComponents[pageState] || null;
  };

  return <>{renderPageContent()}</>;
};

export default withFilters(TTRRegisterConfirmation);
