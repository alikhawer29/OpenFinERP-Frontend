import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import {
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiPrinter,
} from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import { PulseLoader } from 'react-spinners';
import CustomButton from '../../../../Components/CustomButton';
import CustomInput from '../../../../Components/CustomInput';
import CustomModal from '../../../../Components/CustomModal';
import CustomTable from '../../../../Components/CustomTable/CustomTable';
import StatusChip from '../../../../Components/StatusChip/StatusChip';
import TableActionDropDown from '../../../../Components/TableActionDropDown/TableActionDropDown';
import { showToast } from '../../../../Components/Toast/Toast';
import withFilters from '../../../../HOC/withFilters ';
import withModal from '../../../../HOC/withModal';
import { usePageTitle } from '../../../../Hooks/usePageTitle';
import {
  checkTransactionLockStatus,
  getOutwardRemittancePDF,
  lockTransaction,
} from '../../../../Services/Process/TransactionLock';
import { getCurrencies } from '../../../../Services/Transaction/JournalVoucher';
import {
  changeOutwardRemittanceStatus,
  deteleOutwardAllocation,
  getOutwardRemittanceRegisterListing,
} from '../../../../Services/Transaction/OutwardRemittance';
import { outwardRemittanceRegisterHeaders } from '../../../../Utils/Constants/TableHeaders';
import { formatDate, showErrorToast } from '../../../../Utils/Utils';
import { holdingCommentValidationSchema } from '../../../../Utils/Validations/ValidationSchemas';
import { useFetchTableData } from '../../../../Hooks/useTable';
import useModulePermissions from '../../../../Hooks/useModulePermissions';
const OutwardRemittanceRegister = ({
  filters,
  setFilters,
  pagination,
  updatePagination,
  showModal,
  closeModal,
}) => {
  usePageTitle('Outward Remittance Register');

  // Permissions
  const permissions = useModulePermissions(
    'transactions',
    'outward_remittance_register'
  );
  const {
    post: hasPostPermission,
    edit: hasEditPermission,
    delete: hasDeletePermission,
    print: hasPrintPermission,
  } = permissions || {};
  const voucherName = 'outward_remittance_register';
  const [showHoldingReasonModal, setShowHoldingReasonModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [lockStatuses, setLockStatuses] = useState({});
  const [isLoadingLockStatuses, setIsLoadingLockStatuses] = useState({});
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Individual loading states for each button action
  const [loadingStates, setLoadingStates] = useState({
    approve: {},
    hold: {},
    post: {},
    modalSubmit: false,
  });

  // data fetching
  const {
    data: outwardRemittanceRegister = [],
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'getSupportManagementListing',
    filters,
    updatePagination,
    getOutwardRemittanceRegisterListing
  );

  const outwardRemittanceRegisterData = outwardRemittanceRegister?.data || [];

  // Check lock status for all items when data changes
  useEffect(() => {
    if (outwardRemittanceRegisterData?.length > 0) {
      const checkAllLockStatuses = async () => {
        const newLockStatuses = {};
        const newLoadingStatuses = {};

        // Set loading state for all items
        outwardRemittanceRegisterData.forEach((item) => {
          if (item?.voucher_id) {
            newLoadingStatuses[item.voucher_id] = true;
          }
        });
        setIsLoadingLockStatuses(newLoadingStatuses);

        // Check lock status for each item
        for (const item of outwardRemittanceRegisterData) {
          if (item?.voucher_id) {
            try {
              const result = await checkTransactionLockStatus({
                transaction_type: voucherName,
                transaction_id: item.voucher_id,
              });
              newLockStatuses[item.voucher_id] = result;
            } catch (error) {
              newLockStatuses[item.voucher_id] = {
                error: true,
                detail: { locked: false },
              };
            }
          }
        }

        setLockStatuses(newLockStatuses);
        setIsLoadingLockStatuses({});
      };

      checkAllLockStatuses();
    }
  }, [outwardRemittanceRegisterData, voucherName]);

  // Mutation: Update Inward Payment Status
  const updateOutwardStatusMutation = useMutation({
    mutationFn: ({ id, status, reason, actionType }) => {
      // Set loading state for specific action and item
      if (actionType && id) {
        setLoadingStates((prev) => ({
          ...prev,
          [actionType]: { ...prev[actionType], [id]: true },
        }));
      }
      return changeOutwardRemittanceStatus(id, { status, reason });
    },
    onSuccess: (data, variables) => {
      showToast('Status Updated!', 'success');
      queryClient.invalidateQueries(['getOutwardRemittanceRegisterListing']);
      setShowHoldingReasonModal(false);
      // Clear loading state for specific action and item
      if (variables.actionType && variables.actionType === 'modalSubmit') {
        setLoadingStates((prev) => ({ ...prev, modalSubmit: false }));
      } else if (variables.actionType && variables.id) {
        setLoadingStates((prev) => ({
          ...prev,
          [variables.actionType]: {
            ...prev[variables.actionType],
            [variables.id]: false,
          },
        }));
      }
    },
    onError: (error, variables) => {
      console.error('Error updating Outward Allocation Status', error);
      showErrorToast(error);
      // Clear loading state for specific action and item
      if (variables.actionType && variables.actionType === 'modalSubmit') {
        setLoadingStates((prev) => ({ ...prev, modalSubmit: false }));
      } else if (variables.actionType && variables.id) {
        setLoadingStates((prev) => ({
          ...prev,
          [variables.actionType]: {
            ...prev[variables.actionType],
            [variables.id]: false,
          },
        }));
      }
    },
  });

  const handleDelete = (item) => {
    showModal(
      'Delete',
      `Are you sure you want to delete Outward Remittance of voucher No: ${item?.fsn_number}?`,
      () => {
        deleteAllocationMutation.mutate(item?.allocation_id);
      }
    );
  };

  // Mutation: Delete Outward Remittance Register
  const deleteAllocationMutation = useMutation({
    mutationFn: (id) => deteleOutwardAllocation(id),
    onSuccess: () => {
      showToast('Outward Remittance Register deleted successfully!', 'success');
      queryClient.invalidateQueries(['getOutwardRemittanceRegisterListing']);
      closeModal();
    },
    onError: (error) => {
      console.error('Error deleting allocation', error);
      showErrorToast(error);
    },
  });

  const { data: currencies = [] } = useQuery({
    queryKey: ['currenciesTypes'],
    queryFn: getCurrencies,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const handleHoldingReasonSubmit = ({ comment }) => {
    setLoadingStates((prev) => ({ ...prev, modalSubmit: true }));
    updateOutwardStatusMutation.mutate({
      id: selectedItem?.id,
      status: 'hold',
      reason: comment,
      actionType: 'modalSubmit',
    });
  };

  // Handle locking transaction before editing
  const handleEditWithLock = async (item) => {
    if (!item?.allocation_id) return;

    try {
      // Lock the transaction
      await lockTransaction({
        transaction_type: voucherName,
        transaction_id: item.voucher_id,
      });

      // Navigate to edit page
      navigate(`/transactions/outward-remittance`, {
        state: {
          pageState: 'allocation-update',
          id: item?.allocation_id,
          fromRegister: true,
        },
      });
    } catch (error) {
      console.error('Error locking transaction:', error);
      // Still navigate even if lock fails
      navigate(`/transactions/outward-remittance`, {
        state: {
          pageState: 'allocation-update',
          id: item?.allocation_id,
          fromRegister: true,
        },
      });
    }
  };

  useEffect(() => {
    setFilters(() => ({
      status: 'open',
    }));
  }, []);

  const getOutwardRemittancePDFMutation = useMutation({
    mutationFn: (id) => getOutwardRemittancePDF(id),
    onSuccess: (data) => {
      if (data?.pdf_url) {
        window.open(data.pdf_url, '_blank');
      }
    },
    onError: (error) => {
      console.error('Error fetching PDF:', error);
    },
  });

  const handlePrint = (item) => {
    getOutwardRemittancePDFMutation.mutate(item?.fbn_number);
  };

  return (
    <section>
      <div className="d-flexflex-wrap mb-3">
        <h2 className="screen-title m-0 d-inline">
          Outward Remittance Register
        </h2>
      </div>
      <Row>
        <Col xs={12}>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={outwardRemittanceRegisterHeaders}
            pagination={pagination}
            isLoading={isLoading}
            // isPaginated={false}
            useClearButton
            selectOptions={[
              {
                label: 'status',
                title: 'status',
                options: [
                  { value: '', label: 'All' },
                  { value: 'open', label: 'Open' },
                  { value: 'closed', label: 'Close' },
                ],
              },
              {
                title: 'fcy',
                label: 'FCy',
                options: [
                  { value: '', label: 'All' },
                  ...currencies.map((c) => ({
                    value: c.id,
                    label: c.currency_code,
                  })),
                ],
              },
              {
                title: 'confirmation',
                options: [
                  { value: '', label: 'All' },
                  { value: 'confirm', label: 'Confirmed' },
                  { value: 'not Confirmed', label: 'Not Confirmed' },
                ],
              },
              {
                title: 'doc_swift',
                label: 'Doc Swift',
                options: [
                  { value: '', label: 'All' },
                  { value: 'received', label: 'Received' },
                  { value: 'not received', label: 'Not Received' },
                ],
              },
            ]}
            dateFilters={[{ title: 'Period', label: 'Period' }]}
          >
            {(outwardRemittanceRegisterData?.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={outwardRemittanceRegisterHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {outwardRemittanceRegisterData?.map((item, index) => (
                  <tr
                    key={index + 1}
                    style={{
                      background: item?.status === 'approve' ? '' : '#f8d5d5ff',
                    }}
                  >
                    <td>{item?.fsn_number}</td>
                    <td>{formatDate(item?.date, 'DD/MM/YYYY')}</td>
                    <td>{item?.account_name}</td>
                    <td>{item?.beneficiary}</td>
                    <td>{item?.fcy}</td>
                    <td>{item?.fc_amount}</td>
                    <td>{item?.against_fcy}</td>
                    <td>{item?.against_amount}</td>
                    <td>
                      {item?.against_tt && item?.paid_type !== 'pending-balance'
                        ? `FBN ${item.against_tt}`
                        : ''}
                    </td>
                    <td>{item?.fbn_account_name}</td>
                    <td>
                      {item?.paid_type === 'pending-balance'
                        ? ''
                        : item?.fc_payment_amount}
                    </td>
                    <td>
                      {item?.paid_type === 'pending-balance'
                        ? ''
                        : item?.fc_balance_amount}
                    </td>
                    <td>{item?.pay_from_account}</td>
                    <td>{item?.office_location}</td>
                    <td>{item?.doc_swift}</td>
                    <td>{item?.confirmation}</td>
                    <td>
                      {item?.allocation_status === 'closed' ? 'Close' : 'Open'}
                    </td>
                    <td>{item?.approved_by}</td>
                    <td>{item?.comment}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        {item?.status === 'pending' && (
                          <div className="ms-2">
                            {loadingStates.approve[item?.id] ? (
                              <span
                                className="chip cp disabled d-flex align-items-center justify-content-center"
                                style={{ minWidth: '80px' }}
                              >
                                <PulseLoader size={8} color="#fff" />
                              </span>
                            ) : (
                              <StatusChip
                                status="Approve"
                                className="cp"
                                onClick={() => {
                                  updateOutwardStatusMutation.mutate({
                                    id: item?.id,
                                    status: 'approve',
                                    actionType: 'approve',
                                  });
                                }}
                              />
                            )}
                          </div>
                        )}

                        {/* 2. Approved - Show Hold & Post */}
                        {item?.status === 'approve' &&
                          item?.paid_type !== 'partial' &&
                          item?.paid_type !== 'full' &&
                          item?.paid_type !== 'pending-balance' && (
                            <>
                              <div className="ms-2">
                                {loadingStates.hold[item?.id] ? (
                                  <span
                                    className="chip cp disabled d-flex align-items-center justify-content-center"
                                    style={{ minWidth: '60px' }}
                                  >
                                    <PulseLoader size={8} color="#fff" />
                                  </span>
                                ) : (
                                  <StatusChip
                                    status="Hold"
                                    className="cp"
                                    onClick={() => {
                                      setShowHoldingReasonModal(true);
                                      setSelectedItem(item);
                                    }}
                                  />
                                )}
                              </div>
                              {hasPostPermission && (
                                <div className="ms-2">
                                  {loadingStates.post[item?.id] ? (
                                    <span
                                      className="chip cp disabled d-flex align-items-center justify-content-center"
                                      style={{ minWidth: '60px' }}
                                    >
                                      <PulseLoader size={8} color="#fff" />
                                    </span>
                                  ) : (
                                    <StatusChip
                                      status="Post"
                                      className="cp"
                                      onClick={() => {
                                        setLoadingStates((prev) => ({
                                          ...prev,
                                          post: {
                                            ...prev.post,
                                            [item?.id]: true,
                                          },
                                        }));
                                        navigate(
                                          `/transactions/outward-remittance`,
                                          {
                                            state: {
                                              pageState: 'allocation',
                                              id: item?.id,
                                              fromRegister: true,
                                            },
                                          }
                                        );
                                        // Clear loading state after navigation
                                        setTimeout(() => {
                                          setLoadingStates((prev) => ({
                                            ...prev,
                                            post: {
                                              ...prev.post,
                                              [item?.id]: false,
                                            },
                                          }));
                                        }, 1000);
                                      }}
                                    />
                                  )}
                                </div>
                              )}
                            </>
                          )}

                        {/* 3. Pending-Balance - Only allow Post again */}
                        {item?.status === 'approve' &&
                          item?.paid_type === 'pending-balance' &&
                          hasPostPermission && (
                            <div className="ms-2">
                              {loadingStates.post[item?.id] ? (
                                <span
                                  className="chip cp disabled d-flex align-items-center justify-content-center"
                                  style={{ minWidth: '60px' }}
                                >
                                  <PulseLoader size={8} color="#fff" />
                                </span>
                              ) : (
                                <StatusChip
                                  status="Post"
                                  className="cp"
                                  onClick={() => {
                                    setLoadingStates((prev) => ({
                                      ...prev,
                                      post: { ...prev.post, [item?.id]: true },
                                    }));
                                    navigate(
                                      `/transactions/outward-remittance`,
                                      {
                                        state: {
                                          pageState: 'allocation',
                                          id: item?.id,
                                          fromRegister: true,
                                        },
                                      }
                                    );
                                    // Clear loading state after navigation
                                    setTimeout(() => {
                                      setLoadingStates((prev) => ({
                                        ...prev,
                                        post: {
                                          ...prev.post,
                                          [item?.id]: false,
                                        },
                                      }));
                                    }, 1000);
                                  }}
                                />
                              )}
                            </div>
                          )}

                        {/* 4. If allocation is closed - allow Edit, Delete, Print */}
                        {item?.status === 'approve' &&
                          item?.paid_type !== null &&
                          item?.paid_type !== 'pending-balance' && (
                            <TableActionDropDown
                              displaySeparator={false}
                              actions={[
                                ...(hasEditPermission
                                  ? [
                                      {
                                        name: 'Edit',
                                        icon: HiOutlinePencilSquare,
                                        onClick: () => handleEditWithLock(item),
                                        className: 'edit',
                                        disabled:
                                          isLoadingLockStatuses[
                                            item?.voucher_id
                                          ] ||
                                          lockStatuses[item?.voucher_id]?.detail
                                            ?.locked,
                                      },
                                    ]
                                  : []),
                                ...(hasDeletePermission
                                  ? [
                                      {
                                        name: 'Delete',
                                        icon: HiOutlineTrash,
                                        onClick: () => {
                                          handleDelete(item);
                                        },
                                        className: 'delete',
                                        disabled:
                                          isLoadingLockStatuses[
                                            item?.voucher_id
                                          ] ||
                                          lockStatuses[item?.voucher_id]?.detail
                                            ?.locked,
                                      },
                                    ]
                                  : []),
                                ...(hasPrintPermission
                                  ? [
                                      {
                                        name: 'Print',
                                        icon: HiPrinter,
                                        onClick: () => handlePrint(item),
                                        className: 'attachments',
                                      },
                                    ]
                                  : []),
                              ]}
                            />
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </CustomTable>
        </Col>
      </Row>

      {/* Holding Reason Modal */}
      <CustomModal
        show={showHoldingReasonModal}
        close={() => setShowHoldingReasonModal(false)}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle">Holding Reason</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{
              comment: '',
            }}
            validationSchema={holdingCommentValidationSchema}
            onSubmit={handleHoldingReasonSubmit}
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form>
                <div className="mb-45">
                  <CustomInput
                    label="Comment"
                    name="comment"
                    required
                    id="comment"
                    type="textarea"
                    rows={1}
                    placeholder="Enter comment"
                    value={values.comment}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.comment && errors.comment}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {!loadingStates.modalSubmit ? (
                    <>
                      <CustomButton type="submit" text={'Save'} />
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() => setShowHoldingReasonModal(false)}
                      />
                    </>
                  ) : (
                    <PulseLoader size={11} className="modalLoader" />
                  )}
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </CustomModal>
    </section>
  );
};
export default withModal(withFilters(OutwardRemittanceRegister));
