import React, { useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import {
  HiMiniCheckCircle,
  HiMiniXCircle,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiPaperClip,
} from 'react-icons/hi2';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import StatusChip from '../../../Components/StatusChip/StatusChip';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import withFilters from '../../../HOC/withFilters ';
import withModal from '../../../HOC/withModal';
import { useFetchTableData } from '../../../Hooks/useTable';
import {
  getPendingTransactionApprovalListing,
  updateStatusTransactionApproval,
} from '../../../Services/Process/Transaction';
import { statusFiltersConfig } from '../../../Utils/Constants/TableFilter';
import { transactionApprovalHeaders } from '../../../Utils/Constants/TableHeaders';
import { capitilize, formatDate, showErrorToast } from '../../../Utils/Utils';
import CustomModal from '../../../Components/CustomModal';
import { Form, Formik } from 'formik';
import CustomInput from '../../../Components/CustomInput';
import CustomButton from '../../../Components/CustomButton';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionApprovalTypes, transactionTypeStatus } from '../../../Utils/Constants/SelectOptions';

const TransactionApproval = ({
  filters,
  setFilters,
  pagination,
  updatePagination,
  showModal,
}) => {
  const queryClient = useQueryClient();

  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const {
    data: { data: pendingTransactionApprovalData = [] } = {},
    isLoading: isLoadingPendingTransactionApproval,
    isError: isErrorPendingTransactionApproval,
    error: pendingTransactionApprovalError,
  } = useFetchTableData(
    'pendingTransactionApprovalListing',
    filters,
    updatePagination,
    getPendingTransactionApprovalListing
  );

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, voucherId, payload = {} }) =>
      updateStatusTransactionApproval(
        { id, status, voucherId }, // query params
        payload // request body
      ),

    // Optimistically update before the server responds
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries([
        'pendingTransactionApprovalListing',
        filters,
      ]);

      const previousData = queryClient.getQueryData([
        'pendingTransactionApprovalListing',
        filters,
      ]);

      // Optimistically update the cache
      queryClient.setQueryData(
        ['pendingTransactionApprovalListing', filters],
        (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((item) =>
              item.voucher_id === id ? { ...item, status } : item
            ),
          };
        }
      );

      return { previousData }; // for rollback
    },

    onError: (error, variables, context) => {
      // Rollback to previous data if mutation fails
      if (context?.previousData) {
        queryClient.setQueryData(
          ['pendingTransactionApprovalListing', filters],
          context.previousData
        );
      }
      console.error(`Error updating status`, error);
      showErrorToast(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries([
        'pendingTransactionApprovalListing',
        filters,
      ]);
    },
  });

  const handleApproveClick = (item) => {
    updateStatusMutation.mutate({
      id: item.id,
      status: 'approved',
      voucherId: item.voucher_id, // ✅ camelCase used here
    });
  };

  const handleRejectClick = (item) => {
    setSelectedItem(item);
    setShowRejectionModal(true);
  };

  const handleReject = (values) => {
    updateStatusMutation.mutate({
      id: selectedItem.id,
      status: 'un-approved',
      voucherId: selectedItem.voucher_id, // ✅ camelCase used here
      payload: {
        comments: values.rejection_reason,
      },
    });
    setShowRejectionModal(false);
    setSelectedItem(null);
  };

  const handleAttachmentClick = (item) => {
    setSelectedItem(item);
    setShowAttachmentsModal(true);
  };

  if (pendingTransactionApprovalError) {
    showErrorToast(pendingTransactionApprovalError, 'error');
  }

  return (
    <>
      <div className="d-flex justify-content-between flex-wrap mb-4">
        <h2 className="screen-title mb-0">Transaction Approval</h2>
      </div>
      <Row>
        <Col xs={12}>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={transactionApprovalHeaders}
            pagination={pagination}
            isLoading={isLoadingPendingTransactionApproval}
            selectOptions={[
              {
                label: 'Trans. Type',
                title: 'transaction_type',
                options: transactionApprovalTypes,
              }, {
                label: 'Status',
                title: 'status',
                options: transactionTypeStatus,
              },
            ]}
            dateFilters={[{ title: 'Period', type: 'date', label: 'Period' }]}
            rangeFilters={[{ title: 'transaction', label: "Trans. No", type: 'number' }]}
          >
            {(pendingTransactionApprovalData.length ||
              isErrorPendingTransactionApproval) && (
                <tbody>
                  {isErrorPendingTransactionApproval && (
                    <tr>
                      <td colSpan={transactionApprovalHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {pendingTransactionApprovalData?.map((item) => (
                    <tr key={item.id}>
                      <td>{item?.transaction_no}</td>
                      <td>{formatDate(item?.transaction_date)}</td>
                      <td>{item?.party}</td>
                      <td>{item?.secondry_account}</td>
                      <td className='text-center'>{item?.transaction_type}</td>
                      <td>{item?.currency}</td>
                      <td>{item?.amount}</td>
                      <td>{item?.user_id}</td>
                      <td>{item?.approved_by}</td>
                      <td>{item?.received_from}</td>
                      <td>{item?.comment}</td>
                      <td>
                        <StatusChip status={item?.status} />
                      </td>
                      <td>{capitilize(item?.attachments || 'No')}</td>
                      <td>
                        <TableActionDropDown
                          actions={[
                            ...(item?.status?.toLowerCase() === 'pending'
                              ? [
                                {
                                  name: 'Approve',
                                  icon: HiMiniCheckCircle,
                                  onClick: () => handleApproveClick(item),
                                  className: 'view with-color',
                                },
                                {
                                  name: 'Reject',
                                  icon: HiMiniXCircle,
                                  onClick: () => handleRejectClick(item),
                                  className: 'delete with-color',
                                },
                              ]
                              : []),
                            ...(item?.attachments?.toLowerCase() === 'yes'
                              ? [
                                {
                                  name: 'Attachment',
                                  icon: HiPaperClip,
                                  className: 'attachments',
                                  onClick: () => handleAttachmentClick(item),
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
        </Col>
      </Row>
      {/* Profit & Loss Posting Modal  */}
      <CustomModal
        show={showRejectionModal}
        close={() => {
          setSelectedItem(null);
          setShowRejectionModal(false);
        }}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle px-5">Rejection Reason</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{ rejection_reason: '' }}
            // validationSchema={addOfficeLocationValidationSchema}
            onSubmit={handleReject}
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form>
                <div className="mb-45">
                  <CustomInput
                    name={'rejection_reason'}
                    type={'textarea'}
                    required
                    label={'Comments'}
                    value={values.rejection_reason}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.rejection_reason && errors.rejection_reason}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {/* {!addOfficeLocationMutation.isPending ? ( */}
                  <>
                    <CustomButton type="submit" text={'Submit'} />
                    <CustomButton
                      variant={'secondaryButton'}
                      text={'Cancel'}
                      type={'button'}
                      onClick={() => {
                        setSelectedItem(null);
                        setShowRejectionModal(false);
                      }}
                    />
                  </>
                  {/* ) : (
                    <PulseLoader size={11} className="modalLoader" />
                  )} */}
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </CustomModal>
      {/* Attachments Modal */}
      <CustomModal
        show={showAttachmentsModal}
        close={() => setShowAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          item={selectedItem}
          // queryToInvalidate={'documentRegisterListing'}
          // deleteService={deleteDocumentRegisterAttachment}
          // uploadService={addDocumentRegisterAttachment}
          closeUploader={setShowAttachmentsModal}
        />
      </CustomModal>
    </>
  );
};

export default withModal(withFilters(TransactionApproval));
