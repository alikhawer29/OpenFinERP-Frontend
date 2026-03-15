import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { FaMagnifyingGlass } from 'react-icons/fa6';
import AttachmentsView from '../../../../Components/AttachmentsView/AttachmentsView';
import BackButton from '../../../../Components/BackButton';
import CustomCheckbox from '../../../../Components/CustomCheckbox/CustomCheckbox';
import CustomInput from '../../../../Components/CustomInput';
import CustomModal from '../../../../Components/CustomModal';
import CustomTable from '../../../../Components/CustomTable/CustomTable';
import SearchableSelect from '../../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../../Components/Toast/Toast';
import VoucherNavigationBar from '../../../../Components/VoucherNavigationBar/VoucherNavigationBar';
import {
  addTTRRegisterAttachment,
  deleteTTRRegisterAttachment,
  getPartyAccounts,
  getTTRConfirmationBySearch,
  getTTRDetails,
  getTTRDocuments,
  getTTRRegisterAttachment,
  getTTRVoucherNumber,
  updateTTRConfirmation,
} from '../../../../Services/Transaction/TtrRegister';
import useSettingsStore from '../../../../Stores/SettingsStore';
import { isNullOrEmpty, showErrorToast } from '../../../../Utils/Utils';
import TTRConfirmationRow from '../New/TTRConfirmationRow';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { formatNumberWithCommas } from '../../../../Utils/Helpers';

const EditTTRConfirmation = ({ setDate, setPageState = {} }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getPrintSettings, updatePrintSetting } = useSettingsStore();

  const queryClient = useQueryClient();
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [uploadAttachmentsModal, setUploadAttachmentsModal] = useState(false);
  const [addedAttachment, setAddedAttachment] = useState([]);
  const [hasUserModifiedRows, setHasUserModifiedRows] = useState(false);
  const recordNotFoundRef = useRef(false);
  const [date, setLocalDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [debitAccountId, setDebitAccountId] = useState('');
  const [creditAccountId, setCreditAccountId] = useState('');
  const [totalConfirmed, setTotalConfirmed] = useState(0);
  const [tmnBalance, setTmnBalance] = useState(0);
  // Get ID from navigation state or URL params
  const [searchTerm, setSearchTerm] = useState(location.state?.voucherNo || '');
  const [writeTerm, setWriteTerm] = useState(location.state?.voucherNo || '');
  const [lastVoucherNumbers, setLastVoucherNumbers] = useState(null);

  const [unConfirmed, setUnConfirmed] = useState(0);
  // Initialize search term from navigation state
  // useEffect(() => {
  //   if (selectedId) {
  //     setSearchTerm(selectedId);
  //     setWriteTerm(selectedId);
  //   }
  // }, [selectedId]);

  // Initialize rows state with 4 empty rows by default
  const [rows, setRows] = useState(() => {
    const initialRows = {};
    for (let i = 0; i < 4; i++) {
      const rowId = crypto.randomUUID();
      initialRows[rowId] = {
        id: rowId,
        doc_type: '',
        doc_no: '',
        narration: '',
        tmn_amount: '',
      };
    }

    return initialRows;
  });

  // Fetch TTR confirmation by search
  const {
    data: searchConfirmationData,
    isLoading: isLoadingSearch,
    isError: isErrorSearch,
    error: errorSearch,
  } = useQuery({
    queryKey: ['ttr-confirmation-search', searchTerm],
    queryFn: () => getTTRConfirmationBySearch(searchTerm),
    enabled: !!searchTerm && searchTerm.length > 0,
    retry: 0,
  });

  useEffect(() => {
    if (searchConfirmationData) {
      setUnConfirmed(searchConfirmationData?.confirmed_amount || 0);
    }
  }, [searchConfirmationData]);

  // Fetch documents
  const {
    data: documentsData,
    isLoading: isLoadingDocuments,
    isError: isErrorDocuments,
    error: errorDocuments,
  } = useQuery({
    queryKey: ['ttr-documents'],
    queryFn: getTTRDocuments,
  });

  // Fetch voucher numbers - primary query using searchTerm
  const {
    data: voucherNumber,
    isLoading: isLoadingVoucherNumber,
    isError: isErrorVoucherNumber,
    error: errorVoucherNumber,
  } = useQuery({
    queryKey: ['ttr-voucherNumber', searchTerm],
    queryFn: () => getTTRVoucherNumber(searchTerm),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  useEffect(() => {
    if (voucherNumber) {
      setLastVoucherNumbers({
        heading: `Last TTR Confirmation Number: `,
        last: voucherNumber?.default_voucher_no,
        current: voucherNumber?.current_voucher_no,
        previous: voucherNumber?.previous_voucher_no,
        next: voucherNumber?.next_voucher_no,
        isLoadingVoucherNumber: isLoadingVoucherNumber,
        isErrorVoucherNumber: isErrorVoucherNumber,
        errorVoucherNumber: errorVoucherNumber,
      });
    }
  }, [
    voucherNumber,
    isLoadingVoucherNumber,
    isErrorVoucherNumber,
    errorVoucherNumber,
  ]);

  // Fetch party accounts
  const {
    data: partyAccounts,
    isLoading: isLoadingPartyAccounts,
    isError: isErrorPartyAccounts,
    error: errorPartyAccounts,
  } = useQuery({
    queryKey: ['party-accounts'],
    queryFn: getPartyAccounts,
  });

  // Transform party accounts to correct format for SearchableSelect
  const transformedPartyAccounts = partyAccounts
    ? partyAccounts.map((account) => ({
        value: account.id || account.value,
        label:
          account.title ||
          account.account_title ||
          account.label ||
          account.name,
        ...account,
      }))
    : [];

  // Reset record not found ref when search term changes
  useEffect(() => {
    recordNotFoundRef.current = false;
  }, [searchTerm]);

  // Handle search data
  useEffect(() => {
    if (searchConfirmationData && !hasUserModifiedRows) {
      // Extract data from the API response structure
      const data = searchConfirmationData;

      setLocalDate(data.date || new Date().toLocaleDateString('en-CA'));
      setDebitAccountId(data.debit_party_account?.id || '');
      setCreditAccountId(data.credit_party_account?.id || '');
      setTotalConfirmed(data.confirmed_amount || 0);
      setTmnBalance(data.balance_amount || 0);

      // Load confirmation details into rows
      if (data.ttr_confirmation && data.ttr_confirmation.length > 0) {
        const newRows = {};
        data.ttr_confirmation.forEach((detail, index) => {
          const rowId = crypto.randomUUID();
          newRows[rowId] = {
            id: rowId,
            doc_type: detail.doc_type_id || '',
            doc_no: detail.doc_no || '',
            narration: detail.narration || '',
            tmn_amount: detail.tmn_amount || '',
          };
        });
        setRows(newRows);
      }
    }
    if (isNullOrEmpty(searchConfirmationData) && searchTerm) {
      setRows({});
    }
  }, [searchConfirmationData, setDate, setWriteTerm, hasUserModifiedRows]);

  // Update Mutation
  const updateTTRConfirmationMutation = useMutation({
    mutationFn: ({ id, payload }) => updateTTRConfirmation(id, payload),
    onSuccess: (data) => {
      showToast(
        `TTR Confirmation ${searchConfirmationData?.voucher_no} updated successfully!`,
        'success'
      );
      if (getPrintSettings('ttr_confirmation')) {
        window.open(data?.detail?.pdf_url, '_blank');
      }
      queryClient.invalidateQueries(['ttr-confirmation-listing']);
      queryClient.invalidateQueries(['ttr-confirmation-view']);
      queryClient.invalidateQueries(['ttr-confirmation-search']);
      setHasUserModifiedRows(false); // Reset the flag after successful update

      // Navigate back to view page
      if (searchConfirmationData?.voucher_no) {
        navigate(
          `/transactions/ttr-register/confirmation/${searchConfirmationData.voucher_no}/view`
        );
      } else {
        navigate('/transactions/ttr-register', {
          state: { selectedTab: 'confirmation' },
        });
      }
    },
    onError: (error) => {
      // showErrorToast(error);
      console.error(error);
    },
  });

  // Handler functions for rows
  const updateField = (id, field, value) => {
    setHasUserModifiedRows(true); // Mark that user has modified the rows
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

      const confirmedAmount = searchConfirmationData?.confirmed_amount || 0;
      setTotalConfirmed(totalConfirmed);
      const unconfirmedAmount =
        searchConfirmationData?.un_confirmed_amount || 0;
      setTmnBalance(confirmedAmount - totalConfirmed);

      return newRows;
    });
  };

  const addRows = () => {
    setHasUserModifiedRows(true); // Mark that user has modified the rows
    const newRowId = crypto.randomUUID();
    setRows((prev) => ({
      ...prev,
      [newRowId]: {
        id: newRowId,
        doc_type: '',
        doc_no: '',
        narration: '',
        tmn_amount: '',
      },
    }));
  };

  const removeRow = (id) => {
    setHasUserModifiedRows(true); // Mark that user has modified the rows
    setRows((prev) => {
      const newRows = { ...prev };
      delete newRows[id];
      return newRows;
    });
  };

  const handleSubmit = async () => {
    // Prepare the payload as JSON object
    let payload = {
      date: date,
      debit_party_id: debitAccountId,
      credit_party_id: creditAccountId,
      ttr_allocation_id: searchConfirmationData?.ttr_allocation_id,
      ttr_register_id: searchConfirmationData?.ttr_register_id,
      confirmation: [],
    };

    // Add confirmation data in the correct format
    Object.values(rows).forEach((row) => {
      if (row.doc_type || row.doc_no || row.narration || row.tmn_amount) {
        payload.confirmation.push({
          doc_type_id: row.doc_type,
          doc_no: row.doc_no,
          narration: row.narration,
          tmn_amount: row.tmn_amount,
        });
      }
    });

    const voucherNo = searchConfirmationData?.voucher_no;
    if (!voucherNo) {
      showErrorToast({ message: 'Confirmation ID not found' });
      return;
    }

    // Filter rows that have all required fields filled
    // Filter rows that have the amount field filled
    const filteredRows = Object.values(rows).filter((row) => row.tmn_amount);

    if (filteredRows.length === 0) {
      showToast('At least one row of Tmn Amount is required', 'error');
      return;
    }

    // Add confirmation details as individual form fields
    filteredRows.forEach((row, index) => {
      payload[`confirmation[${index}][doc_type_id]`] = row.doc_type;
      payload[`confirmation[${index}][doc_no]`] = row.doc_no;
      payload[`confirmation[${index}][narration]`] = row.narration;
      payload[`confirmation[${index}][tmn_amount]`] = row.tmn_amount;
    });

    updateTTRConfirmationMutation.mutate({ id: voucherNo, payload });
  };

  return (
    <>
      <section className="position-relative">
        <div className="d-flex gap-3 justify-content-between flex-wrap mb-4">
          <div className="d-flex flex-column gap-2">
            <BackButton
              handleBack={() => {
                navigate('/transactions/ttr-register', {
                  state: { selectedTab: 'confirmation' },
                });
              }}
            />
            <h2 className="screen-title mb-0">Edit TTR Confirmation</h2>
          </div>
        </div>

        <Row>
          <Col xs={12}>
            <div className="d-flex align-items-start justify-content-between flex-wrap-reverse mb-3 gap-3">
              <div className="d-flex gap-3 align-items-end">
                <CustomInput
                  style={{ width: '180px' }}
                  type="text"
                  placeholder={`Search`}
                  error={false}
                  showBorders={false}
                  value={writeTerm}
                  borderRadius={10}
                  name="search"
                  rightIcon={FaMagnifyingGlass}
                  onChange={(e) => {
                    setWriteTerm(e.target.value);
                  }}
                  onButtonClick={() => {
                    if (writeTerm !== '') {
                      setSearchTerm(writeTerm.trim());
                    }
                  }}
                />

                <SearchableSelect
                  label="Debit Account"
                  options={transformedPartyAccounts || []}
                  borderRadius={10}
                  value={debitAccountId}
                  onChange={(selected) => {
                    setDebitAccountId(selected?.value || '');
                  }}
                  placeholder="Select..."
                  isDisabled={true}
                />

                <SearchableSelect
                  label="Credit Account"
                  options={transformedPartyAccounts || []}
                  value={creditAccountId}
                  borderRadius={10}
                  onChange={(selected) => {
                    setCreditAccountId(selected?.value || '');
                  }}
                  placeholder="Select..."
                  isDisabled={true}
                />
              </div>
              <div>
                <CustomInput
                  label="Date"
                  type="date"
                  borderRadius={10}
                  showBorders={false}
                  error={false}
                  value={date}
                  onChange={(e) => setLocalDate(e.target.value)}
                />
              </div>
            </div>
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <CustomTable
              headers={[
                'Document Type',
                'Document No',
                'Narration',
                'TMN Amount',
              ]}
              isPaginated={false}
              className={
                Object.entries(rows).length > 0 && !isLoadingSearch
                  ? 'inputTable noActions'
                  : 'noActions'
              }
              hideSearch
              hideItemsPerPage
              isLoading={isLoadingSearch}
            >
              <tbody>
                {isErrorSearch && (
                  <tr>
                    <td colSpan={4}>
                      <p className="text-danger mb-0">
                        {errorSearch?.message || 'Unknown error'}
                      </p>
                    </td>
                  </tr>
                )}
                {Object.values(rows).map((row, index) => (
                  <TTRConfirmationRow
                    key={row.id}
                    row={row}
                    index={index}
                    updateField={updateField}
                    documentOptions={documentsData}
                    removeRow={removeRow}
                    unConfirmed={unConfirmed}
                    totalConfirmedAmount={totalConfirmed}
                  />
                ))}
              </tbody>
            </CustomTable>
          </Col>
        </Row>
        <div className="d-flex justify-content-between align-items-start mt-45 mb-5">
          <div>
            <CustomCheckbox
              label="Print"
              checked={getPrintSettings('ttr_confirmation')}
              onChange={(e) => {
                updatePrintSetting('ttr_confirmation', e.target.checked);
              }}
              style={{ border: 'none', margin: 0 }}
            />
          </div>
          <div className="d-flex justify-content-end gap-3 ">
            <div className="d-flex flex-column gap-2 mt-1">
              <CustomInput
                name="unConfirmed"
                label={'Un-Confirmed'}
                labelClass={'fw-medium'}
                type="number"
                showBorders={false}
                error={false}
                borderRadius={10}
                // value={formatNumberWithCommas(
                //   searchConfirmationData?.un_confirmed_amount || 0
                // )}
                readOnly
              />
              <CustomInput
                name="totalConfirmed"
                label={'Total Confirmed'}
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
        </div>

        <VoucherNavigationBar
          searchTerm={searchConfirmationData?.voucher_no}
          actionButtons={[
            { text: 'Add Rows', onClick: addRows },
            { text: 'Update', onClick: handleSubmit },
            {
              text: 'Cancel',
              onClick: () => {
                if (searchConfirmationData?.voucher_no) {
                  // If we have data, go back to view page
                  navigate(
                    `/transactions/ttr-register/confirmation/${searchConfirmationData.voucher_no}/view`
                  );
                } else {
                  // Otherwise go back to main TTR Register page with confirmation tab
                  navigate('/transactions/ttr-register', {
                    state: { selectedTab: 'confirmation' },
                  });
                }
              },
              variant: 'secondaryButton',
            },
          ]}
          loading={isLoadingSearch || updateTTRConfirmationMutation.isPending}
          onAttachmentClick={() => setShowAttachmentsModal(true)}
          lastVoucherNumbers={lastVoucherNumbers}
          setPageState={(newState) => {
            if (newState === 'view') {
              navigate(
                `/transactions/ttr-register/confirmation/${searchConfirmationData?.voucher_no}/view`
              );
            }
          }}
          setWriteTerm={setWriteTerm}
          setSearchTerm={(newSearchTerm) => {
            if (newSearchTerm) {
              navigate(
                `/transactions/ttr-register/confirmation/${newSearchTerm}/view`
              );
            }
          }}
        />

        {/* View Attachments Modal */}
        <CustomModal
          show={showAttachmentsModal}
          close={() => setShowAttachmentsModal(false)}
          background={true}
        >
          <AttachmentsView
            showModal={showAttachmentsModal}
            closeModal={() => setShowAttachmentsModal(false)}
            item={searchConfirmationData}
            deleteService={deleteTTRRegisterAttachment}
            uploadService={addTTRRegisterAttachment}
            closeUploader={() => setShowAttachmentsModal(false)}
            voucherAttachment={true}
            queryToInvalidate={['ttr-confirmation-search', searchTerm]}
            getAttachmentsService={getTTRRegisterAttachment}
          />
        </CustomModal>

        {/* Upload Attachments Modal */}
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
      </section>
    </>
  );
};

export default EditTTRConfirmation;
