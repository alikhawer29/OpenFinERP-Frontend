import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { FaMagnifyingGlass } from 'react-icons/fa6';
import { useLocation, useNavigate } from 'react-router-dom';
import AttachmentsView from '../../../../Components/AttachmentsView/AttachmentsView';
import BackButton from '../../../../Components/BackButton';
import CustomCheckbox from '../../../../Components/CustomCheckbox/CustomCheckbox';
import CustomInput from '../../../../Components/CustomInput';
import CustomModal from '../../../../Components/CustomModal';
import CustomTable from '../../../../Components/CustomTable/CustomTable';
import FileDisplayList from '../../../../Components/FileDisplayList/FileDisplayList';
import SearchableSelect from '../../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import { usePageTitle } from '../../../../Hooks/usePageTitle';
import {
  createConfirmation,
  getPartyAccounts,
  getTTRDetails,
  getTTRDocuments,
  getTTRVoucherNumber,
} from '../../../../Services/Transaction/TtrRegister';

import TTRConfirmationRow from './TTRConfirmationRow';
import useSettingsStore from '../../../../Stores/SettingsStore';
import { showErrorToast } from '../../../../Utils/Utils';
import withModal from '../../../../HOC/withModal';
import { formatNumberWithCommas } from '../../../../Utils/Helpers';

const generateInitialRows = (count) => {
  const rows = {};
  for (let i = 0; i < count; i++) {
    const id = crypto.randomUUID();
    rows[id] = {
      id,
      doc_type: '',
      doc_no: '',
      narration: '',
      tmn_amount: '',
    };
  }
  return rows;
};

const INITIAL_STATE = generateInitialRows(4);

const NewTTRConfirmation = ({ selectedConfirmationData, showModal }) => {
  usePageTitle('New TTR Confirmation');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isDisabled, setIsDisabled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [writeTerm, setWriteTerm] = useState('');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [debitAccount, setDebitAccount] = useState('');

  // const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [uploadAttachmentsModal, setUploadAttachmentsModal] = useState(false);
  const [addedAttachment, setAddedAttachment] = useState([]);
  const [rows, setRows] = useState(INITIAL_STATE);
  const [unConfirmed, setUnConfirmed] = useState(
    selectedConfirmationData?.unconfirmed_amount || 0
  );
  const [totalConfirmed, setTotalConfirmed] = useState(0);
  const [tmnBalance, setTmnBalance] = useState(0);
  const { getPrintSettings, updatePrintSetting } = useSettingsStore();
  // Add lastVoucherNumbers state
  const [lastVoucherNumbers, setLastVoucherNumbers] = useState({
    heading: 'Last TTR  Number: ',
    current: '',
    previous: '',
    next: '',
    isLoadingVoucherNumber: false,
    isErrorVoucherNumber: false,
    errorVoucherNumber: null,
  });

  const location = useLocation();
  const selectedId = location.state?.selectedId;

  // Data fetching
  const {
    data: confirmationData = {},
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['getTTRDetails', selectedId],
    queryFn: () => getTTRDetails(selectedId),
    enabled: !!selectedId,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Document fetching
  const {
    data: documentsData = [],
    isLoading: documentsIsLoading,
    isError: documentsIsError,
    error: documentsError,
  } = useQuery({
    queryKey: ['getTTRDocuments'],
    queryFn: getTTRDocuments,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Get last voucher number
  const {
    data: voucherNumber,
    isLoading: isLoadingVoucherNumber,
    isError: isErrorVoucherNumber,
    error: errorVoucherNumber,
  } = useQuery({
    queryKey: ['ttr-voucherNumber', selectedId],
    queryFn: () => getTTRVoucherNumber(selectedId),
    enabled: !!selectedId,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  useEffect(() => {
    if (confirmationData?.confirmation)
      setUnConfirmed(confirmationData?.confirmation);
  }, [confirmationData]);

  // Update lastVoucherNumbers
  useEffect(() => {
    setLastVoucherNumbers({
      heading: 'Last TTR  Number: ',
      last: voucherNumber?.default_voucher_no,
      current: voucherNumber?.current_voucher_no,
      previous: voucherNumber?.previous_voucher_no,
      next: voucherNumber?.next_voucher_no,
      isLoadingVoucherNumber: isLoadingVoucherNumber,
      isErrorVoucherNumber: isErrorVoucherNumber,
      errorVoucherNumber: errorVoucherNumber,
    });
  }, [
    voucherNumber,
    isLoadingVoucherNumber,
    isErrorVoucherNumber,
    errorVoucherNumber,
  ]);

  const { data: partyAccounts = [], isSuccess } = useQuery({
    queryKey: ['partyAccounts'],
    queryFn: getPartyAccounts,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Handler functions for rows
  const updateField = useCallback(
    (id, field, value) => {
      setRows((prev) => {
        const newRows = {
          ...prev,
          [id]: {
            ...prev[id],
            [field]: value,
          },
        };

        // Calculate totalConfirmed from tmn_amount
        const totalConfirmed = Object.values(newRows).reduce((sum, row) => {
          const amount = parseFloat(row.tmn_amount) || 0;
          return sum + amount;
        }, 0);

        setTotalConfirmed(totalConfirmed);

        // Update unConfirmed - this should remain constant from the selected data
        const unconfirmedFromData = parseFloat(
          selectedConfirmationData?.unconfirmed_amount ||
            confirmationData?.confirmation ||
            0
        );

        // Calculate balance: Unconfirmed Amount - Confirmed Amount = Balance
        const balance = unconfirmedFromData - totalConfirmed;
        setTmnBalance(balance);

        return newRows;
      });
    },
    [selectedConfirmationData, confirmationData]
  );

  const addRows = (count) => {
    const newRows = {};
    Array.from({ length: count }).forEach(() => {
      const id = crypto.randomUUID();
      newRows[id] = {
        id,
        doc_type: '',
        doc_no: '',
        narration: '',
        tmn_amount: '',
      };
    });
    setRows((prevRows) => ({ ...prevRows, ...newRows }));
  };
  const deleteRow = (id) => {
    setRows((prevRows) => {
      const newState = { ...prevRows };
      delete newState[id];
      return newState;
    });
  };
  const resetRows = () => {
    setRows(generateInitialRows(4));
  };

  // Table Row Actions
  const handleAddRows = () => {
    addRows(6);
  };

  const handleResetRows = () => {
    resetRows();
    setIsDisabled(true);
  };

  const handleCancel = () => {
    // Navigate back to main TTR Register page with confirmation tab
    navigate('/transactions/ttr-register', {
      state: { selectedTab: 'confirmation' },
    });
  };

  const handleSubmit = () => {
    if (tmnBalance < 0) {
      showToast('TMN Balance cannot be negative', 'error');
      return;
    }

    // Validate that date is provided
    if (!date) {
      showToast('Date is required', 'error');
      return;
    }

    // Filter rows that have the amount field filled
    const filteredRows = Object.values(rows).filter((row) => row.tmn_amount);

    if (filteredRows.length === 0) {
      showToast('At least one row of Tmn Amount is required', 'error');
      return;
    }

    const payload = {
      date: date,
      confirmation: filteredRows,
      ...addedAttachment,
    };

    // Add confirmation details as individual form fields
    filteredRows.forEach((row, index) => {
      payload[`confirmation[${index}][doc_type_id]`] = row.doc_type;
      payload[`confirmation[${index}][doc_no]`] = row.doc_no;
      payload[`confirmation[${index}][narration]`] = row.narration;
      payload[`confirmation[${index}][tmn_amount]`] = row.tmn_amount;
    });

    delete payload.confirmation;
    createTtrConfirmationMutation.mutate(payload);
  };

  // Mutation to create confirmation
  const createTtrConfirmationMutation = useMutation({
    mutationFn: (formData) => {
      return createConfirmation(selectedId, formData);
    },
    onSuccess: (data) => {
      showToast(
        `TTR Confirmation ${data?.detail?.voucher_no} added successfully!`,
        'success'
      );
      // Print functionality
      if (getPrintSettings('ttr_confirmation')) {
        window.open(data?.detail?.pdf_url, '_blank');
      }
      // Invalidate relevant queries
      queryClient.invalidateQueries(['getTTRAllocationListing']);
      queryClient.invalidateQueries(['ttr-confirmation-listing']);
      queryClient.invalidateQueries(['getTTRListing']);

      handleResetRows();

      setTimeout(() => {
        // Navigate back to the main TTR Register page with confirmation tab
        navigate('/transactions/ttr-register', {
          state: {
            selectedTab: 'confirmation',
          },
        });
      }, 300);
    },
    onError: (error) => {
      if (error.message == 'Voucher limit reached for this branch.') {
        showModal(
          'Cannot Create',
          'You have reached the maximum number of TTR. To create new transactions you need to increase the transaction count form the Transaction Number Register.',
          null,
          'error'
        );
      } else {
        showErrorToast(error);
      }
    },
  });

  // Add this helper function to calculate total confirmed amount
  const calculateTotalConfirmedAmount = (rows) => {
    return Object.values(rows).reduce((total, row) => {
      return total + (parseFloat(row.tmn_amount) || 0);
    }, 0);
  };

  return (
    <>
      <section className="position-relative">
        <div className="d-flex gap-3 justify-content-between flex-wrap mb-4">
          <div className="d-flex flex-column gap-2">
            <BackButton />
            <h2 className="screen-title mb-0">New TTR Confirmation</h2>
          </div>
        </div>
        <Row>
          <Col xs={12}>
            <div className="d-flex align-items-start justify-content-between flex-wrap-reverse">
              <div className="d-flex gap-3 align-items-end">
                <CustomInput
                  style={{ width: '180px' }}
                  type="text"
                  placeholder="Search"
                  error={false}
                  showBorders={false}
                  borderRadius={10}
                  name="search"
                  rightIcon={FaMagnifyingGlass}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                  }}
                  onButtonClick={() => {
                    navigate(
                      `/transactions/ttr-register/confirmation/${searchTerm}/view`
                    );
                  }}
                />

                <SearchableSelect
                  label="Debit Account"
                  name="debitAccount"
                  options={partyAccounts?.map((item) => ({
                    value: item.id,
                    label: item.title,
                  }))}
                  borderRadius={10}
                  value={confirmationData?.debit_party_id || ''}
                  onChange={(e) => {
                    setDebitAccount(e.target.value);
                  }}
                  isDisabled={true}
                />

                <SearchableSelect
                  label="Credit Account"
                  name="creditAccount"
                  options={partyAccounts?.map((item) => ({
                    value: item.id,
                    label: item.title,
                  }))}
                  borderRadius={10}
                  value={confirmationData?.credit_party_id || ''}
                  onChange={(e) => {
                    setDebitAccount(e.target.value);
                  }}
                  isDisabled={true}
                />
              </div>
              <div>
                <CustomInput
                  name="Date"
                  label={'Date'}
                  type="date"
                  showBorders={false}
                  error={false}
                  borderRadius={10}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                  }}
                />
              </div>
            </div>

            <CustomTable
              headers={[
                'Document Type',
                'Document No',
                'Narration',
                'TMN Amount',
              ]}
              isPaginated={false}
              className={'inputTable noActions'}
              hideSearch
              hideItemsPerPage
            >
              <tbody>
                {Object.values(rows).map((row, index) => (
                  <TTRConfirmationRow
                    key={row.id}
                    row={row}
                    index={index}
                    isDisabled={isDisabled}
                    updateField={updateField}
                    documentOptions={documentsData}
                    removeRow={deleteRow}
                    unConfirmed={unConfirmed}
                    totalConfirmedAmount={calculateTotalConfirmedAmount(rows)} // Add this prop
                  />
                ))}
              </tbody>
            </CustomTable>
            <div className="d-flex justify-content-between gap-3 mt-45 mb-5">
              <div>
                <CustomCheckbox
                  label="Print"
                  checked={getPrintSettings('ttr_confirmation')}
                  onChange={(e) => {
                    updatePrintSetting('ttr_confirmation', e.target.checked);
                  }}
                  style={{ border: 'none', margin: 0 }}
                  readOnly={isDisabled}
                />
              </div>
              <div className="d-flex flex-column gap-2 mt-1">
                <CustomInput
                  name="unConfirmed"
                  label={'Un-Confirmed'}
                  labelClass={'fw-medium'}
                  type="number"
                  showBorders={false}
                  error={false}
                  borderRadius={10}
                  value={formatNumberWithCommas(
                    selectedConfirmationData?.unconfirmed_amount ||
                      confirmationData?.confirmation ||
                      unConfirmed ||
                      0
                  )}
                  readOnly
                />
                <CustomInput
                  name="totalConfirmed"
                  label={'Confirmed Amount'}
                  labelClass={'fw-medium'}
                  type="number"
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
                  type="number"
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

        {/* File Display List */}
        <div className="mt-4">
          <FileDisplayList
            files={addedAttachment}
            onRemoveFile={(fileToRemove) => {
              const newAttachments = { ...addedAttachment };
              // Find and remove the file
              Object.keys(newAttachments).forEach((key) => {
                if (newAttachments[key] === fileToRemove) {
                  delete newAttachments[key];
                }
              });
              setAddedAttachment(
                Object.keys(newAttachments).length > 0 ? newAttachments : []
              );
            }}
          />
        </div>
      </section>

      <VoucherNavigationBar
        searchTerm={selectedId}
        isDisabled={isDisabled}
        actionButtons={[
          { text: 'Add Rows', onClick: handleAddRows },
          { text: 'Save', onClick: handleSubmit },
          {
            text: 'Cancel',
            onClick: handleCancel,
            variant: 'secondaryButton',
          },
        ]}
        loading={createTtrConfirmationMutation.isPending}
        onAttachmentClick={() => setUploadAttachmentsModal(true)}
        lastVoucherNumbers={lastVoucherNumbers}
        setPageState={(newState) => {
          if (newState === 'view') {
            navigate(
              `/transactions/ttr-register/confirmation/${selectedId}/view`
            );
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
      <CustomModal
        show={uploadAttachmentsModal}
        close={() => setUploadAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          uploadOnly
          getUploadedFiles={setAddedAttachment}
          closeUploader={() => setUploadAttachmentsModal(false)}
        />
      </CustomModal>
    </>
  );
};

export default withModal(NewTTRConfirmation);
