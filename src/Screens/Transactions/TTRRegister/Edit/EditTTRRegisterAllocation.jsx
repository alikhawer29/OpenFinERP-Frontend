import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CustomButton from '../../../../Components/CustomButton';
import BackButton from '../../../../Components/BackButton';
import CustomInput from '../../../../Components/CustomInput';
import CustomTable from '../../../../Components/CustomTable/CustomTable';
import { showToast } from '../../../../Components/Toast/Toast';
import withFilters from '../../../../HOC/withFilters ';
import {
  createAllocations,
  getPartyAccounts,
  getTTRListing,
  getTTRnewAllocations,
  updateAllocation,
  viewTTRAllocation,
} from '../../../../Services/Transaction/TtrRegister';
import { ttrRegisterAllocationUpdateHeaders } from '../../../../Utils/Constants/TableHeaders';
import { formatDate, showErrorToast } from '../../../../Utils/Utils';
import { formatNumberWithCommas } from '../../../../Utils/Helpers';

const EditTTRRegisterAllocation = ({ filters, setFilters, pagination }) => {
  const navigate = useNavigate();
  const [tableData, setTableData] = useState([]);
  const [selectedPartyAccount, setSelectedPartyAccount] = useState('');
  const { id } = useParams();
  const [showRowRateError, setShowRowRateError] = useState(false);
  const [totalAmount, setTotalAmount] = useState();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['viewTTRAllocation', id],
    queryFn: () => viewTTRAllocation(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const allocationDetailsData = data;

  // Initialize tableData from fetched data
  useEffect(() => {
    if (allocationDetailsData) {
      // Ensure it's always treated as an array
      const normalizedData = Array.isArray(allocationDetailsData)
        ? allocationDetailsData
        : [allocationDetailsData];
      setTableData(normalizedData);
      setTotalAmount(
        (allocationDetailsData?.tmn_amount || 0) +
          (allocationDetailsData?.allocated_amount || 0)
      );
    }
  }, [allocationDetailsData]);

  // Calculate total allocated TMN
  const totalAllocated = tableData.reduce(
    (sum, item) => sum + parseFloat(item.allocated_amount || 0),
    0
  );

  const { data: partyAccounts = [], isSuccess } = useQuery({
    queryKey: ['partyAccounts'],
    queryFn: getPartyAccounts,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  useEffect(() => {
    if (filters?.debit_party_id) {
      setSelectedPartyAccount(filters?.debit_party_id);
    }
  }, [filters?.debit_party_id]);

  // Mutation: Update Allocations
  const updateMutation = useMutation({
    mutationFn: (data) => updateAllocation(id, data),
    onSuccess: () => {
      showToast('Updated Successfully!', 'success');

      // Invalidate relevant queries
      queryClient.invalidateQueries(['getTTRListing']);
      queryClient.invalidateQueries(['getTTRAllocationListing']);
      queryClient.invalidateQueries(['ttr-allocation-details']);

      setTimeout(() => {
        navigate('/transactions/ttr-register', {
          state: { selectedTab: 'allocation' },
        });
      }, 300);
    },
    onError: (error) => {
      console.error('Error creating Allocations', error);
      showErrorToast(error);
    },
  });

  return (
    <>
      <div className="d-flex flex-column gap-2 mb-4">
        <BackButton />
        <h2 className="screen-title m-0 d-inline">Edit TTR Allocation</h2>
      </div>

      <CustomTable
        filters={filters}
        setFilters={setFilters}
        headers={ttrRegisterAllocationUpdateHeaders}
        pagination={pagination}
        isLoading={isLoading}
        isPaginated={false}
        hideItemsPerPage={true}
        hideSearch={true}
        selectOptions={[
          {
            disabled: true,
            title: 'debit_party_id',
            label: 'Party Account',
            options: [
              {
                value: id,
                label: allocationDetailsData?.credit_party_account,
              },
            ],
          },
        ]}
        renderAtEnd={
          <div className="d-flex justify-content-end mb-4">
            <CustomInput
              type="text"
              label="Total Allocated TMN"
              borderRadius={10}
              value={totalAllocated.toLocaleString()}
              readOnly
            />
          </div>
        }
      >
        {(tableData.length || isError) && (
          <tbody>
            {isError && (
              <tr>
                <td colSpan={ttrRegisterAllocationUpdateHeaders.length}>
                  <p className="text-danger mb-0">
                    Unable to fetch data at this time
                  </p>
                </td>
              </tr>
            )}
            {tableData.map((item, index) => (
              <tr key={item.id || index}>
                <td>{formatDate(item.date, 'DD/MM/YYYY' || '-')}</td>
                <td>{item?.debit_party_account || '-'}</td>
                <td>{item?.bank_name || '-'}</td>
                <td>{item?.bank_account || '-'}</td>
                <td>{item?.remarks || '-'}</td>
                <td>{formatNumberWithCommas(totalAmount) || '-'}</td>
                <td>
                  <CustomInput
                    max={totalAmount}
                    name="allocated_amount"
                    type="number"
                    borderRadius={10}
                    style={{ maxWidth: '150px' }}
                    value={item.allocated_amount || ''}
                    error={
                      showRowRateError
                        ? `Range: ${item?.confirmed_amount} - ${totalAmount}`
                        : ''
                    }
                    onChange={(e) => {
                      const newValue = parseFloat(e.target.value) || 0;
                      const tmnAmount = totalAmount;
                      const unAllocatedAmount = tmnAmount - newValue;
                      const isError =
                        newValue < item?.confirmed_amount ||
                        newValue > tmnAmount;
                      setShowRowRateError(isError);
                      setTableData((prev) =>
                        prev.map((row) =>
                          row.id === item.id
                            ? {
                                ...row,
                                allocated_amount: newValue,
                                unallocated_amount: unAllocatedAmount,
                              }
                            : row
                        )
                      );
                    }}
                  />
                </td>
                <td>{formatNumberWithCommas(item.unallocated_amount)}</td>
                <td>{formatNumberWithCommas(item?.confirmed_amount)}</td>
              </tr>
            ))}
          </tbody>
        )}
      </CustomTable>

      <div className="d-flex justify-content-start gap-2">
        <CustomButton
          text="Save"
          onClick={() => {
            const editedItem = tableData.find(
              (item) => parseFloat(item.allocated_amount || 0) > 0
            );
            if (!editedItem) {
              showToast('Please allocate an amount.', 'error');
              return;
            }

            const payload = {
              allocated_amount: parseFloat(editedItem.allocated_amount),
              id: editedItem.id,
            };

            updateMutation.mutate(payload);
          }}
          loading={updateMutation.isPending}
          disabled={updateMutation.isPending}
        />
        <CustomButton
          text="Cancel"
          variant="secondaryButton"
          disabled={updateMutation.isPending}
          onClick={() => {
            // Navigate back to main TTR Register page with allocation tab
            navigate('/transactions/ttr-register', {
              state: { selectedTab: 'allocation' },
            });
          }}
        />
      </div>
    </>
  );
};

export default withFilters(EditTTRRegisterAllocation);
