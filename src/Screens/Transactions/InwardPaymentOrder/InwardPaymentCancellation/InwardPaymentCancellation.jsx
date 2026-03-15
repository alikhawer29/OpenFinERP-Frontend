import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { HiOutlineTrash } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import CustomModal from '../../../../Components/CustomModal';
import CustomTable from '../../../../Components/CustomTable/CustomTable';
import TableActionDropDown from '../../../../Components/TableActionDropDown/TableActionDropDown';
import { showToast } from '../../../../Components/Toast/Toast';
import withFilters from '../../../../HOC/withFilters ';
import { usePageTitle } from '../../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../../Hooks/useTable';
import {
  deleteInwardPayment,
  getInwardPaymentCancelListing
} from '../../../../Services/Transaction/InwardPayment';
import { inwardPaymentCancellationHeaders } from '../../../../Utils/Constants/TableHeaders';
import { showErrorToast } from '../../../../Utils/Utils';

const InwardPaymentCancellation = ({
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Inward Payment Cancellation');
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const paymentTypeOptions = [
    { label: 'All', value: '' },
    { label: 'DPV - Payment Voucher', value: 'dpv' },
    { label: 'CA - Credit Adjustment', value: 'ca' },
  ];

  const {
    data: inwardPaymentCancelationData,
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'getInwardPaymentCancelListing',
    filters,
    updatePagination,
    getInwardPaymentCancelListing
  );

  const inwardPaymentCancelData = inwardPaymentCancelationData?.data || [];

  if (isError) {
    showErrorToast(error);
  }

  const handleDelete = (id, type, settlementNo) => {
    setSelectedItem({ id, type, settlementNo });
    setShowDeleteModal(true);
  };

  const getDeleteMessage = () => {
    if (!selectedItem) return '';
    if (selectedItem.type === 'credit_adjustment') {
      return `Are you sure you want to delete Credit Adjustment ${selectedItem.settlementNo}?`;
    } else if (selectedItem.type === 'debit_note_payment_voucher') {
      return `Are you sure you want to delete Debit Note Payment Voucher ${selectedItem.settlementNo}?`;
    } else {
      return `Are you sure you want to delete ${selectedItem.settlementNo}?`;
    }
  };

  // Mutation: Pay Inward Cancellation
  const cancelInwardPaymentMutation = useMutation({
    mutationFn: ({ id, type }) => deleteInwardPayment(id, type),
    onSuccess: (success) => {
      queryClient.invalidateQueries(['getInwardPaymentCancelListing', filters]);
      showToast(success.message, 'success');
      setShowDeleteModal(false);
      setSelectedItem(null);
    },
    onError: (error) => {
      console.error('Error cancelling inward payment', error);
      showErrorToast(error);
      setShowDeleteModal(false);
    },
  });

  return (
    <section>
      <h2 className="screen-title mb-3">Inward Payment Cancellation</h2>
      <Row>
        <Col xs={12}>
          <CustomTable
            headers={inwardPaymentCancellationHeaders}
            data={inwardPaymentCancelData}
            filters={filters}
            setFilters={setFilters}
            pagination={pagination}
            hideSearch
            dateFilters={[
              { label: 'Period', title: 'Paid Date', from: 'from', to: 'to' },
            ]}
            selectOptions={[
              {
                title: 'type',
                options: paymentTypeOptions,
              },
            ]}
            isLoading={isLoading}
            useClearButton
          >
            {(inwardPaymentCancelData?.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={inwardPaymentCancellationHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {inwardPaymentCancelData?.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <p onClick={() => {
                        navigate('/transactions/inward-payment-order', {
                          state: { transactionId: item?.debit_note_number, fromCancellation: true }
                        });
                      }}
                        className="hyper-link text-decoration-underline cp mb-0 d-inline-block">
                        {item?.debit_note_number}
                      </p>
                    </td>
                    <td

                    >
                      <p onClick={() => {
                        navigate(`/transactions/inward-payment-pay/view/${item?.id}`, {
                          state: { cancelledPaymentData: item }
                        });
                      }}
                        className="hyper-link text-decoration-underline cp mb-0 d-inline-block">
                        {item?.type === 'credit_adjustment' ? 'CA-' : 'DVP-'}{item?.settlement_no}
                      </p>
                    </td>

                    <td>{item?.pay_date}</td>
                    <td>{item?.account}</td>
                    <td>{item?.walkin}</td>
                    <td>{item?.mode ?? '-'}</td>
                    <td>{item?.currency}</td>
                    <td>{item?.fc_amount}</td>
                    <td>{item?.paid_by}</td>
                    <td>
                      <TableActionDropDown
                        actions={[
                          {
                            name: 'Delete',
                            icon: HiOutlineTrash,
                            onClick: () =>
                              handleDelete(
                                item.id,
                                item.type,
                                item.settlement_no
                              ),
                            className: 'delete',
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

      {/* Delete Confirmation Modal */}
      <CustomModal
        show={showDeleteModal}
        close={() => {
          if (!cancelInwardPaymentMutation.isPending) {
            setShowDeleteModal(false);
            setSelectedItem(null);
          }
        }}
        action={() => {
          if (selectedItem) {
            cancelInwardPaymentMutation.mutate({
              id: selectedItem.id,
              type: selectedItem.type
            });
          }
        }}
        title="Delete"
        description={getDeleteMessage()}
        disableClick={cancelInwardPaymentMutation.isPending}
        closeOnOutsideClick={!cancelInwardPaymentMutation.isPending}
      />
    </section>
  );
};
export default withFilters(InwardPaymentCancellation);
