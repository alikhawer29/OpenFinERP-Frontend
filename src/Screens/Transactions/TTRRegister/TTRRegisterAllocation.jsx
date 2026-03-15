import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FaCircleXmark } from 'react-icons/fa6';
import { HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import CustomInput from '../../../Components/CustomInput';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { showToast } from '../../../Components/Toast/Toast';
import withFilters from '../../../HOC/withFilters ';
import withModal from '../../../HOC/withModal';
import {
  cancelUnconfirmed,
  deleteAllocation,
  getTTRAllocationListing,
} from '../../../Services/Transaction/TtrRegister';
import { ttrRegisterAllocationHeaders } from '../../../Utils/Constants/TableHeaders';
import { formatDate, showErrorToast } from '../../../Utils/Utils';
import { formatNumberWithCommas } from '../../../Utils/Helpers';

const TTRRegisterAllocation = ({
  filters,
  setFilters,
  pagination,
  showModal,
  closeModal,
  hasEditPermission,
  hasDeletePermission,
}) => {
  const navigate = useNavigate();
  const [inEditMode, setInEditMode] = useState(false);
  const queryClient = useQueryClient();

  // Data fetching
  const {
    data: allocationsData = [],
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

  const allocationSummary = getAllocationSummary(allocationsData);

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
      <td colSpan={1}></td>
    </tr>
  );

  const handleDelete = (id) => {
    showModal('Delete', 'Are you sure you want to delete Allocation?', () => {
      closeModal(); // Close confirmation modal first
      deleteTTRAllocationMutation.mutate({ id }); // Trigger the mutation
    });
  };

  const handleUconfirmed = (id) => {
    showModal('Cancel', 'Are you sure you want to Cancel Uconfirmed?', () => {
      closeModal(); // Close confirmation modal first
      cancelUconfirmedMutation.mutate({ id }); // Trigger the mutation
    });
  };

  // Mutation: Cancel Unallocate
  const cancelUconfirmedMutation = useMutation({
    mutationFn: ({ id }) => cancelUnconfirmed(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['getTTRListing', filters]);
      showModal(
        'Cancel Unconfirmed',
        'Cancel Unconfirmed Successfully',
        () => closeModal(),
        'success'
      );
    },
    onError: (error) => {
      console.error('Error Cancel Unconfirmed', error);
      showErrorToast(error);
    },
  });

  // Mutation: Delete Bank Details
  const deleteTTRAllocationMutation = useMutation({
    mutationFn: ({ id }) => deleteAllocation(id),
    onSuccess: (data) => {
      showToast(data?.message, 'success');
      queryClient.invalidateQueries(['getTTRAllocationListing', filters]);
      // showModal('Deleted', 'Allocation Deleted Successfully', false, 'success');
    },
    onError: (error) => {
      console.error('Error deleting allocation', error);
      showErrorToast(error);
    },
  });

  return (
    <>
      <CustomTable
        filters={filters}
        setFilters={setFilters}
        headers={ttrRegisterAllocationHeaders}
        pagination={pagination}
        isLoading={isLoading}
        isPaginated={false}
        summaryRows={summaryRow} // Extra Rows
        renderAtEnd={
          inEditMode && (
            <div className="d-flex justify-content-end mb-4">
              <CustomInput
                type="text"
                label={'Total Allocated TMN'}
                borderRadius={10}
                value={allocationsData?.reduce((sum, item) => {
                  return (
                    sum +
                    parseInt(formatNumberWithCommas(item.allocated_amount), 10)
                  );
                }, 0)}
              />
            </div>
          )
        }
      >
        {(allocationsData.length || isError) && (
          <tbody>
            {isError && (
              <tr>
                <td colSpan={ttrRegisterAllocationHeaders.length}>
                  <p className="text-danger mb-0">
                    Unable to fetch data at this time
                  </p>
                </td>
              </tr>
            )}
            {allocationsData?.map((item) => (
              <tr key={item.id}>
                <td>{formatDate(item.date, 'DD/MM/YYYY' || '-')}</td>
                <td>{item.credit_party_account || '-'}</td>
                <td>{item.debit_party_account || '-'}</td>
                <td>{item.bank_name || '-'}</td>
                <td>{item.bank_account || '-'}</td>
                <td>{item.remarks || '-'} </td>
                <td>{formatNumberWithCommas(item.allocated_amount || '-')}</td>
                <td>{formatNumberWithCommas(item.confirmed_amount || '-')}</td>
                <td>
                  {formatNumberWithCommas(item.unconfirmed_amount) || '-'}
                </td>
                <td>
                  <TableActionDropDown
                    actions={[
                      ...(hasEditPermission
                        ? [
                          {
                            name: 'Edit',
                            icon: HiOutlinePencilSquare,
                            onClick: () => {
                              setInEditMode(true);
                              navigate(
                                `/transactions/ttr-register/allocation/${item.id}/edit`
                              );
                            },
                            className: 'edit',
                          },
                        ]
                        : []),
                      ...(hasDeletePermission
                        ? [
                          {
                            name: 'Delete',
                            icon: HiOutlineTrash,
                            onClick: () => handleDelete(item.id),
                            className: 'delete',
                          },
                          {
                            name: 'Cancel Unconfirmed',
                            icon: FaCircleXmark,
                            onClick: () => handleUconfirmed(item.id),
                            className: 'delete',
                          },
                        ]
                        : []),
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        )}
      </CustomTable>
    </>
  );
};

export default withModal(withFilters(TTRRegisterAllocation));
