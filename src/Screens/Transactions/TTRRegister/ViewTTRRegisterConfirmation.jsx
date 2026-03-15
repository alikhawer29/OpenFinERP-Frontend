import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { FaMagnifyingGlass } from 'react-icons/fa6';
import { useNavigate, useParams } from 'react-router-dom';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import { showToast } from '../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import {
  deleteTTRConfirmation,
  getTTRConfirmationBySearch,
  getTTRVoucherNumber,
  getTTRRegisterAttachment,
} from '../../../Services/Transaction/TtrRegister';
import { newTTRConfirmationHeaders } from '../../../Utils/Constants/TableHeaders';
import { formatDate, showErrorToast } from '../../../Utils/Utils';
import { formatNumberWithCommas } from '../../../Utils/Helpers';

const generateInitialRows = (count) => {
  const rows = {};
  Array.from({ length: count }).forEach(() => {
    const id = crypto.randomUUID();
    rows[id] = {
      id,
      doc_type: '12',
      doc_no: '111',
      narration: 'Lorem ipsum',
      tmn_amount: '100000',
    };
  });
  return rows;
};

const TTRConfirmationRow = ({ row }) => {
  return (
    <tr>
      <td>{row?.doc_type || "-"}</td>
      <td>{row.doc_no || "-"}</td>
      <td>{row.narration || "-"}</td>
      <td>{formatNumberWithCommas(row.tmn_amount || "-")}</td>
    </tr>
  );
};

const ViewTTRRegisterConfirmation = () => {
  usePageTitle('View TTR Confirmation');

  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [isDisabled, setIsDisabled] = useState(false);
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [debitAccount, setDebitAccount] = useState('');
  const [creditAccount, setCreditAccount] = useState('');
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [rows, setRows] = useState({});
  const [unConfirmed, setUnConfirmed] = useState(0);
  const [totalConfirmed, setTotalConfirmed] = useState(0);
  const [tmnBalance, setTmnBalance] = useState(0);
  const [deleteModal, setDeleteModal] = useState(false);
  const [lastVoucherNumbers, setLastVoucherNumbers] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [writeTerm, setWriteTerm] = useState('');

  // Fetch TTR confirmation data
  const {
    data: ttrConfirmationData,
    isLoading: isLoadingConfirmation,
    isError: isErrorConfirmation,
    error: errorConfirmation,
  } = useQuery({
    queryKey: ['ttr-confirmation-view', id],
    queryFn: () => getTTRConfirmationBySearch(id),
    enabled: !!id,
  });

  // Fetch voucher numbers
  const {
    data: voucherNumber,
    isLoading: isLoadingVoucherNumber,
    isError: isErrorVoucherNumber,
    error: errorVoucherNumber,
  } = useQuery({
    queryKey: ['ttr-voucherNumber-view', id],
    queryFn: () => getTTRVoucherNumber(id),
    enabled: !!id,
  });

  // Update lastVoucherNumbers when voucher data is available
  useEffect(() => {
    if (voucherNumber) {
      const voucherData = {
        heading: `TTR Confirmation Number: `,
        last:
          voucherNumber?.current_voucher_no ||
          voucherNumber?.default_voucher_no,
        current: voucherNumber?.current_voucher_no,
        previous: voucherNumber?.previous_voucher_no,
        next: voucherNumber?.next_voucher_no,
        isLoadingVoucherNumber: isLoadingVoucherNumber,
        isErrorVoucherNumber: isErrorVoucherNumber,
        errorVoucherNumber: errorVoucherNumber,
      };
      setLastVoucherNumbers(voucherData);
    }
  }, [
    voucherNumber,
    isLoadingVoucherNumber,
    isErrorVoucherNumber,
    errorVoucherNumber,
  ]);

  // Update data when confirmation data is available
  useEffect(() => {
    if (ttrConfirmationData) {
      setDate(
        ttrConfirmationData.date || new Date().toLocaleDateString('en-CA')
      );
      setDebitAccount(ttrConfirmationData.debit_party_account?.account_title);
      setCreditAccount(ttrConfirmationData.credit_party_account?.account_title);
      setUnConfirmed(ttrConfirmationData.un_confirmed_amount);
      setTotalConfirmed(ttrConfirmationData.confirmed_amount);
      setTmnBalance(ttrConfirmationData.balance_amount);
      setWriteTerm(ttrConfirmationData.voucher_no || '');

      // Load confirmation details into rows
      if (
        ttrConfirmationData.ttr_confirmation &&
        ttrConfirmationData.ttr_confirmation.length > 0
      ) {
        const newRows = {};
        ttrConfirmationData.ttr_confirmation.forEach((detail, index) => {
          const rowId = crypto.randomUUID();
          newRows[rowId] = {
            id: rowId,
            doc_type: detail.document?.description || '',
            doc_no: detail.doc_no || '',
            narration: detail.narration || '',
            tmn_amount: detail.tmn_amount || '',
          };
        });
        setRows(newRows);
      }
    }
  }, [ttrConfirmationData]);

  // Delete mutation
  const deleteTTRConfirmationMutation = useMutation({
    mutationFn: (id) => deleteTTRConfirmation(id),
    onSuccess: () => {
      showToast('TTR Confirmation deleted successfully!', 'success');

      // Invalidate relevant queries
      queryClient.invalidateQueries(['ttr-confirmation-listing']);
      queryClient.invalidateQueries(['getTTRAllocationListing']);
      queryClient.invalidateQueries(['getTTRListing']);

      navigate('/transactions/ttr-register', {
        state: { selectedTab: 'confirmation' },
      });
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  return (
    <>
      <section className="position-relative">
        <div className="d-flex gap-3 justify-content-between flex-wrap mb-4">
          <div className="d-flex flex-column gap-2">
            <BackButton
              handleBack={() =>
                navigate('/transactions/ttr-register', {
                  state: { selectedTab: 'confirmation' },
                })
              }
            />
            <h2 className="screen-title mb-0">View TTR Confirmations</h2>
          </div>
          <div className="d-flex gap-2">
            {isDisabled ? (
              <CustomButton text={'New'} onClick={() => setIsDisabled(false)} />
            ) : null}
          </div>
        </div>
        <Row>
          <Col xs={12}>
            <div className="d-flex align-items-start justify-content-between flex-wrap-reverse mb-3 gap-3">
              <div className="flex-grow-1">
                <CustomInput
                  style={{ width: '180px' }}
                  type="text"
                  placeholder="Search TTR Confirmation"
                  error={false}
                  showBorders={false}
                  borderRadius={10}
                  name="search"
                  rightIcon={FaMagnifyingGlass}
                  value={writeTerm}
                  onChange={(e) => setWriteTerm(e.target.value)}
                  onButtonClick={() => {
                    if (writeTerm.trim()) {
                      setSearchTerm(writeTerm.trim());
                      navigate(
                        `/transactions/ttr-register/confirmation/${writeTerm.trim()}/view`
                      );
                    }
                  }}
                />
              </div>
              <div className="d-flex flex-column gap-1">
                <CustomInput
                  name="Date"
                  label={'Date'}
                  type="date"
                  showBorders={false}
                  error={false}
                  borderRadius={10}
                  value={date}
                  readOnly={true}
                  onChange={(e) => {
                    setDate(e.target.value);
                  }}
                />

              </div>
            </div>
            <div className="d-flex gap-3">
              <div className="d-flex gap-2">
                <p className="mb-0">Debit Account: </p>
                <p className="fw-medium mb-0">{debitAccount}</p>
              </div>
              <div className="d-flex gap-2">
                <p className="mb-0">Credit Account: </p>
                <p className="fw-medium mb-0">{creditAccount}</p>
              </div>
            </div>
            <div></div>
            <CustomTable
              headers={newTTRConfirmationHeaders}
              isPaginated={false}
              hideSearch
              hideItemsPerPage
              isLoading={isLoadingConfirmation}
            >
              <tbody>
                {isErrorConfirmation && (
                  <tr>
                    <td colSpan={4}>
                      <p className="text-danger mb-0">
                        {errorConfirmation?.message || 'Unknown error'}
                      </p>
                    </td>
                  </tr>
                )}
                {Object.values(rows).map((row) => (
                  <TTRConfirmationRow key={row.id} row={row} />
                ))}
              </tbody>
            </CustomTable>
            <div className="d-flex justify-content-end gap-3 mt-45 mb-5">
              <div className="d-flex flex-column gap-2 mt-1">
                <CustomInput
                  name="unConfirmed"
                  label={'Un-Confirmed'}
                  labelClass={'fw-medium'}
                  type="text"
                  showBorders={false}
                  error={false}
                  borderRadius={10}
                  value={formatNumberWithCommas(unConfirmed)}
                  readOnly
                />
                <CustomInput
                  name="totalConfirmed"
                  label={'Total Confirmed'}
                  labelClass={'fw-medium'}
                  type="text"
                  showBorders={false}
                  error={false}
                  borderRadius={10}
                  value={formatNumberWithCommas(totalConfirmed)}
                  readOnly
                />
                <CustomInput
                  name="tmnBalance"
                  label={'TMN Balance'}
                  labelClass={'fw-medium'}
                  type="text"
                  showBorders={false}
                  error={false}
                  borderRadius={10}
                  value={formatNumberWithCommas(tmnBalance)}
                  readOnly
                />
              </div>
            </div>
          </Col>
        </Row>
        <VoucherNavigationBar
          actionButtons={[
            {
              text: 'Edit',
              onClick: () =>
                navigate(`/transactions/ttr-register/confirmation/edit`, {
                  state: {
                    selectedId: id,
                    voucherNo: ttrConfirmationData?.voucher_no,
                  },
                }),
            },
            {
              text: 'Delete',
              onClick: () => setDeleteModal(true),
              variant: 'secondaryButton',
            },
            ...(ttrConfirmationData?.pdf_url
              ? [
                {
                  text: 'Print',
                  onClick: () => {
                    if (ttrConfirmationData?.pdf_url) {
                      window.open(ttrConfirmationData?.pdf_url, '_blank');
                    }
                  },
                  variant: 'secondaryButton',
                },
              ]
              : []),
          ]}
          loading={
            isLoadingConfirmation || deleteTTRConfirmationMutation.isPending
          }
          onAttachmentClick={() => setShowAttachmentsModal(true)}
          lastVoucherNumbers={lastVoucherNumbers}
          setPageState={(newState) => {
            if (newState === 'view') {
              navigate(`/transactions/ttr-register/confirmation/${id}/view`);
            }
          }}
          setWriteTerm={setWriteTerm}
          setSearchTerm={(newSearchTerm) => {
            if (newSearchTerm) {
              setWriteTerm(newSearchTerm);
              navigate(
                `/transactions/ttr-register/confirmation/${newSearchTerm}/view`
              );
            }
          }}
        />
      </section>

      {/* Attachments Modal */}
      <CustomModal
        show={showAttachmentsModal}
        close={() => setShowAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          viewOnly
          item={ttrConfirmationData}
          closeUploader={() => setShowAttachmentsModal(false)}
          getAttachmentsService={getTTRRegisterAttachment}
          queryToInvalidate={['ttr-confirmation-view', id]}
        />
      </CustomModal>
      {/* Delete Confirmation Modal */}
      <CustomModal
        show={deleteModal}
        close={() => {
          setDeleteModal(false);
        }}
        disableClick={deleteTTRConfirmationMutation.isPending}
        action={() => {
          deleteTTRConfirmationMutation.mutate(id);
          setDeleteModal(false);
        }}
        title="Delete?"
        description="Are you sure you want to delete this TTR Confirmation?"
      />
    </>
  );
};

export default ViewTTRRegisterConfirmation;
