import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../../../..//Components/CustomButton';
import BackButton from '../../../../Components/BackButton';
import CustomInput from '../../../../Components/CustomInput';
import CustomTable from '../../../../Components/CustomTable/CustomTable';
import { showToast } from '../../../../Components/Toast/Toast';
import withFilters from '../../../../HOC/withFilters ';
import {
  createAllocations,
  getPartyAccounts,
  getTTRnewAllocations,
} from '../../../../Services/Transaction/TtrRegister';
import { ttrRegisterAllocationUpdateHeaders } from '../../../../Utils/Constants/TableHeaders';
import { formatDate, showErrorToast } from '../../../../Utils/Utils';
import { formatNumberWithCommas } from '../../../../Utils/Helpers';

const NewTTRRegisterAllocation = ({ filters, setFilters, pagination }) => {
  const navigate = useNavigate();
  const [allocationAmounts, setAllocationAmounts] = useState({});
  const queryClient = useQueryClient();

  // Memoize debit party ID to prevent unnecessary re-renders
  const debitPartyId = useMemo(() => filters?.debit_party_id || '', [filters?.debit_party_id]);

  // Data fetching
  const {
    data: bankDetailsData = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['getTTRnewAllocations'],
    queryFn: () => getTTRnewAllocations({}, 'bank_details'),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const { data: partyAccounts = [] } = useQuery({
    queryKey: ['partyAccounts'],
    queryFn: getPartyAccounts,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Prepare party account options for select
  const partyAccountOptions = useMemo(
    () => [
      {
        value: '',
        label: 'Select Party Account',
        disabled: true,
      },
      ...(partyAccounts?.map((item) => ({
        value: item.id,
        label: item.title,
      })) || []),
    ],
    [partyAccounts]
  );

  // Calculate filtered table data and total allocated TMN in one useMemo
  const { tableData, totalAllocated } = useMemo(() => {
    if (!bankDetailsData?.length) {
      return { tableData: [], totalAllocated: 0 };
    }
    
    const filtered = bankDetailsData.filter(
      (row) => String(row?.check_id) !== String(debitPartyId)
    );
    
    const total = filtered.reduce(
      (sum, item) => sum + parseFloat(allocationAmounts[item.id] || 0),
      0
    );
    
    return { tableData: filtered, totalAllocated: total };
  }, [bankDetailsData, debitPartyId, allocationAmounts]);

  
  // Mutation: Create Allocations
  const createMutation = useMutation({
    mutationFn: (data) => createAllocations(data),
    onSuccess: () => {
      showToast('Allocations Created Successfully!', 'success');

      // Invalidate relevant queries
      queryClient.invalidateQueries(['getTTRListing']);
      queryClient.invalidateQueries(['getTTRAllocationListing']);

      // ✅ Redirect to listing page with allocation tab selected
      navigate('/transactions/ttr-register', {
        state: { selectedTab: 'allocation' },
        replace: true,
      });
    },
    onError: (error) => {
      console.error('Error creating Allocations', error);
      showErrorToast(error);
    },
  });

  // Handle allocation amount change
  const handleAllocationChange = useCallback((itemId, newValue) => {
    setAllocationAmounts(prev => ({
      ...prev,
      [itemId]: newValue
    }));
  }, []);

  // Handle save allocations
  const handleSave = useCallback(() => {
    if (!debitPartyId) {
      showToast('Please select a party account.', 'error');
      return;
    }

    const allocations = {};
    let totalAllocatedAmount = 0;

    tableData.forEach((item) => {
      const amount = parseFloat(allocationAmounts[item.id] || 0);
      if (amount > 0) {
        allocations[`allocation[${item.id}][allocated_amount]`] = amount;
        totalAllocatedAmount += amount;
      }
    });

    if (!Object.keys(allocations).length) {
      showToast('Please allocate at least one amount.', 'error');
      return;
    }

    const payload = {
      debit_party_id: debitPartyId,
      total_allocated: totalAllocatedAmount,
      ...allocations,
    };

    createMutation.mutate(payload);
  }, [debitPartyId, tableData, allocationAmounts, createMutation]);

  // Handle cancel/reset
  const handleCancel = useCallback(() => {
    // Navigate back to main TTR Register page with allocation tab
    navigate('/transactions/ttr-register', {
      state: { selectedTab: 'allocation' },
    });
  }, [navigate]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate('/transactions/ttr-register', {
      state: { selectedTab: 'allocation' },
    });
  }, [navigate]);

  // Table body content
  const tableBodyContent = useMemo(() => {
    if (isError) {
      return (
        <tr>
          <td colSpan={ttrRegisterAllocationUpdateHeaders.length}>
            <p className="text-danger mb-0">
              Unable to fetch data at this time
            </p>
          </td>
        </tr>
      );
    }

    return tableData.map((item) => (
      <tr key={item.id}>
        <td>{formatDate(item.date)}</td>
        <td>{item?.credit_party_account || '-'}</td>
        <td>{item?.bank_name || '-'}</td>
        <td>{item?.bank_account || '-'}</td>
        <td>{item?.remarks || '-'}</td>
        <td>{formatNumberWithCommas(item?.tmn_amount) || '-'}</td>
        <td>
          <CustomInput
            name="allocated_amount"
            type="number"
            borderRadius={10}
            style={{ maxWidth: '150px' }}
            value={allocationAmounts[item.id] || ''}
            onChange={(e) => handleAllocationChange(item.id, e.target.value)}
            min={0}
            max={parseFloat(item?.tmn_amount) || 0}
          />
        </td>
        <td>{formatNumberWithCommas(Math.max(0, parseFloat(item?.tmn_amount || 0) - parseFloat(allocationAmounts[item.id] || 0)))}</td>
        <td>{formatNumberWithCommas(item?.confirmation_total_amount) || 0}</td>
      </tr>
    ));
  }, [tableData, isError, handleAllocationChange, allocationAmounts]);

  return (
    <div className="container-fluid">
      {/* Header Section */}
      <div className="d-flex flex-column gap-2 mb-4">
        <BackButton handleBack={handleBack} />
        <h2 className="screen-title m-0">TTR Allocation</h2>
      </div>

      {/* Table Section */}
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
            title: 'debit_party_id',
            label: 'Party Account',
            options: partyAccountOptions,
          },
        ]}
        renderAtEnd={
          <div className="d-flex justify-content-end mb-4">
            <CustomInput
              type="text"
              label="Total Allocated TMN"
              borderRadius={10}
              value={formatNumberWithCommas(totalAllocated)}
              readOnly
              style={{ maxWidth: '200px' }}
            />
          </div>
        }
      >
        {(tableData.length || isError) && <tbody>{tableBodyContent}</tbody>}
      </CustomTable>

      {/* Action Buttons */}
      <div className="d-flex justify-content-start gap-2 mt-4">
        <CustomButton
          text="Save"
          onClick={handleSave}
          loading={createMutation.isPending}
          disabled={createMutation.isPending}
        />
        <CustomButton
          text="Cancel"
          variant="secondaryButton"
          onClick={handleCancel}
          disabled={createMutation.isPending}
        />
      </div>
    </div>
  );
};

export default withFilters(NewTTRRegisterAllocation);
