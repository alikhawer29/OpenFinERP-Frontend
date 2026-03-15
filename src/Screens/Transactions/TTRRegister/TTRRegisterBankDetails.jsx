import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FaCircleXmark } from 'react-icons/fa6';
import { HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { showToast } from '../../../Components/Toast/Toast';
import withFilters from '../../../HOC/withFilters ';
import withModal from '../../../HOC/withModal';
import {
  cancelUnallocated,
  deleteBankDetails,
  getTTRListing,
} from '../../../Services/Transaction/TtrRegister';
import { ttrRegisterBankDetailsHeaders } from '../../../Utils/Constants/TableHeaders';
import { formatDate, showErrorToast } from '../../../Utils/Utils';
import { formatNumberWithCommas } from '../../../Utils/Helpers';

const TTRRegisterBankDetails = ({
  filters,
  setFilters,
  pagination,
  showModal,
  closeModal,
  hasEditPermission,
  hasDeletePermission,

}) => {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const queryClient = useQueryClient();

  // Data fetching
  const {
    data: bankDetailsData = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['getTTRListing', filters],
    queryFn: () => getTTRListing(filters, 'bank_details'),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const getTmnSummary = (data) => {
    let totalTmn = 0;
    let totalUnallocated = 0;

    data?.forEach((item) => {
      totalTmn += parseFloat(item?.tmn_amount || 0);
      totalUnallocated += parseFloat(item?.unallocated_amount || 0);
    });

    return {
      totalTmn: totalTmn.toFixed(2),
      totalUnallocated: totalUnallocated.toFixed(2),
    };
  };

  const tmnSummary = getTmnSummary(bankDetailsData);

  const summaryRow = (
    <tr key="tmn-summary" className="table-summary-row">
      <td colSpan={4}></td>
      <td>
        <strong>Total </strong>
      </td>
      <td>
        <strong>{formatNumberWithCommas(tmnSummary.totalTmn)}</strong>
      </td>
      <td></td>
      <td>
        <strong>{formatNumberWithCommas(tmnSummary.totalUnallocated)}</strong>
      </td>
      <td colSpan={4}></td>
    </tr>
  );

  const handleDelete = (id) => {
    showModal('Delete', 'Are you sure you want to delete Bank Detail?', () => {
      closeModal(); // Close confirmation modal first
      deleteTTRBankDetailsMutation.mutate({ id }); // Trigger the mutation
    });
  };

  const handleUnallocate = (id) => {
    showModal('Cancel', 'Are you sure you want to Cancel Unallocated?', () => {
      closeModal(); // Close confirmation modal first
      cancelUnallocateMutation.mutate({ id }); // Trigger the mutation
    });
  };

  // Mutation: Delete Bank Details
  const deleteTTRBankDetailsMutation = useMutation({
    mutationFn: ({ id }) => deleteBankDetails(id),
    onSuccess: () => {
      showToast('Bank Details Deleted Successfully!', 'success');
      queryClient.invalidateQueries(['getTTRListing', filters]);
      showModal(
        'Deleted',
        'Bank Details Deleted Successfully',
        false,
        'success'
      );
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  // Mutation: Cancel Unallocate
  const cancelUnallocateMutation = useMutation({
    mutationFn: ({ id }) => cancelUnallocated(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['getTTRListing', filters]);
      showModal(
        'Cancel Unallocated',
        'Cancel Unallocated Successfully',
        () => closeModal(),
        'success'
      );
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  return (
    <>
      <CustomTable
        filters={filters}
        setFilters={setFilters}
        headers={ttrRegisterBankDetailsHeaders}
        pagination={pagination}
        isLoading={isLoading}
        isPaginated={false}
        summaryRows={summaryRow} // Extra Rows
      >
        {(bankDetailsData.length || isError) && (
          <tbody>
            {isError && (
              <tr>
                <td colSpan={ttrRegisterBankDetailsHeaders.length}>
                  <p className="text-danger mb-0">
                    Unable to fetch data at this time
                  </p>
                </td>
              </tr>
            )}
            {bankDetailsData?.map((item, index) => (
              <tr key={item.id}>
                <td>{formatDate(item.date, 'DD/MM/YYYY' || "-")}</td>
                <td>{item.credit_party_account || "-"}</td>
                <td>{item.bank_name || "-"}</td>
                <td>{item.bank_account || "-"}</td>
                <td>{item.remarks || "-"}</td>
                <td>{formatNumberWithCommas(item.tmn_amount) || "-"}</td>
                <td>{formatNumberWithCommas(item.allocated_amount) || "-"}</td>
                <td>{formatNumberWithCommas(item.unallocated_amount) || "-"}</td>
                <td>{formatNumberWithCommas(item.confirmed_amount) || "-"}</td>
                <td>{formatNumberWithCommas(item.unconfirmed_amount) || "-"}</td>
                <td>{item.user_id || "-"}</td>
                <td>
                  <TableActionDropDown
                    actions={[
                      ...(hasEditPermission
                        ? [
                          {
                            name: 'Edit',
                            icon: HiOutlinePencilSquare,
                            onClick: () => {
                              navigate(
                                `/transactions/ttr-register/bank-details/${item.id}/edit`
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
                            name: 'Cancel Unallocated',
                            icon: FaCircleXmark,
                            onClick: () => handleUnallocate(item.id),
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
      <CustomModal
        show={showDeleteModal}
        close={() => {
          setShowDeleteModal(false);
        }}
        title="Delete Bank Details"
        description="Are you sure you want to delete this bank details?"
        action={() => setShowDeleteModal(false)}
      // disableClick={deletePackageMutation.isLoading}o
      />
    </>
  );
};

export default withModal(withFilters(TTRRegisterBankDetails));
