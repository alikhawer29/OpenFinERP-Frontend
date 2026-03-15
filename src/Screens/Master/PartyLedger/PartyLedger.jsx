import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import {
  HiOutlineEye,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiPaperClip,
} from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CustomButton from '../../../Components/CustomButton';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import StatusChip from '../../../Components/StatusChip/StatusChip';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { showToast } from '../../../Components/Toast/Toast';
import withFilters from '../../../HOC/withFilters ';
import withModal from '../../../HOC/withModal';
import useDataMutations from '../../../Hooks/useDataMutations';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';
import {
  accountCodePreferences,
  addPartyLedgerAttachment,
  deletePartyLedger,
  deletePartyLedgerAttachment,
  getPartyLedgerListing,
} from '../../../Services/Masters/PartyLedger';
import useUserStore from '../../../Stores/UserStore';
import { generalStatusFiltersConfig } from '../../../Utils/Constants/TableFilter';
import { partyLedgerHeaders } from '../../../Utils/Constants/TableHeaders';
import { downloadFile, showErrorToast } from '../../../Utils/Utils';
import { useFileDownloader } from '../../../Hooks/useFileDownloader';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import { filterActions, filterHeaders } from '../../../Utils/Helpers';

const PartyLedger = ({
  showModal,
  closeModal,
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Party Ledger');
  const { downloadingType, handleDownload } = useFileDownloader();
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [newAccountCodeType, setNewAccountCodeType] = useState('');
  const newAccountType = useUserStore(
    (state) => state.user.party_ledgers_account_type
  );
  const setNewAccountType = useUserStore((state) => state.setNewAccountType);
  const {
    data: { data: partyLedgerData = [] } = {},
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'partyLedgerListing',
    filters,
    updatePagination,
    getPartyLedgerListing
  );
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { deleteMutation } = useDataMutations({
    onDeleteSuccessCallback: () => {
      closeModal();
      showToast('Party Ledger Deleted Successfully', 'success');
      queryClient.invalidateQueries(['partyLedgerListing', filters]);
    },
    onDeleteErrorCallback: (error) => {
      if (
        error.message.toLowerCase() ==
        'the party ledger cannot be deleted as it is currently in use.'
      ) {
        closeModal();
        showModal(
          'Cannot be Deleted',
          error.message,
          () => closeModal(),
          'error'
        );
      } else {
        showErrorToast(error);
      }
    },
  });

  const setAccountCodePreference = useMutation({
    mutationFn: accountCodePreferences,
    onSuccess: (data) => {
      setNewAccountType(data.detail?.account_code);
      setTimeout(() => {
        navigate('new');
      }, 300);
    },
    onError: (error) => {
      console.error('Failed to set new account preference', error);
      if (!isNullOrEmpty(error.errors?.email)) {
        showToast(error.errors.email[0], 'error');
      }
    },
  });

  // Function to handle Delete action
  const handleDelete = (item) => {
    showModal(
      'Delete',
      `Are you sure you want to delete Customer ${item?.account_title}?`,
      () => {
        deleteMutation.mutate({
          serviceFunction: deletePartyLedger,
          id: item.id,
        });
      }
    );
  };
  const handleNewClick = () => {
    setAccountCodePreference.mutate({ type: newAccountCodeType });
  };
  const handleAttachments = (item) => {
    setSelectedItem(item);
    setShowAttachmentsModal(true);
  };

  if (isError) {
    showErrorToast(error);
  }

  // Permission checks using optimized hook
  const permissions = useModulePermissions('master', 'party_ledger');

  const {
    create: hasCreatePermission,
    edit: hasEditPermission,
    delete: hasDeletePermission,
    view: hasViewPermission,
  } = permissions;

  // // Show Action column only if user has edit or delete permission
  // const visibleHeaders = filterHeaders(partyLedgerHeaders, {
  //   Action: hasEditPermission || hasDeletePermission || hasViewPermission,
  // });

  return (
    <>
      <section>
        <div className="d-flex justify-content-between flex-wrap mb-3">
          <h2 className="screen-title mb-0">Party Ledger</h2>
          <div className="d-flex gap-2 flex-wrap">
            <CustomButton
              variant="secondaryButton"
              text={
                downloadingType === 'xlsx'
                  ? 'Downloading...'
                  : 'Export to Excel'
              }
              onClick={() => handleDownload('party-ledger', 'xlsx')}
              disabled={!!downloadingType}
              loading={downloadingType === 'xlsx'}
            />

            <CustomButton
              variant="secondaryButton"
              text={
                downloadingType === 'pdf' ? 'Downloading...' : 'Export to PDF'
              }
              onClick={() => handleDownload('party-ledger', 'pdf')}
              disabled={!!downloadingType}
              loading={downloadingType === 'pdf'}
            />
            {hasCreatePermission && (
              <CustomButton
                text={'New'}
                onClick={() => {
                  if (newAccountType) {
                    navigate('new');
                  } else {
                    setShowNewAccountModal(true);
                  }
                }}
              />
            )}
          </div>
        </div>
        <Row>
          <Col xs={12}>
            <CustomTable
              filters={filters}
              setFilters={setFilters}
              headers={partyLedgerHeaders}
              pagination={pagination}
              isLoading={isLoading}
              selectOptions={[
                {
                  title: 'status',
                  options: generalStatusFiltersConfig,
                },
              ]}
            >
              {(partyLedgerData.length || isError) && (
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={partyLedgerHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {partyLedgerData?.map((item) => (
                    <tr key={item.id}>
                      <td>{item.account_code}</td>
                      <td>{item.account_title}</td>
                      <td>{item.telephone_no}</td>
                      <td>{item.mobile_no}</td>
                      <td>{item.debit_limit}</td>
                      <td>{item.classifications?.classification}</td>
                      <td>
                        <StatusChip status={item.status} />
                      </td>
                      <td>
                        <TableActionDropDown
                          actions={filterActions(
                            [
                              {
                                name: 'View',
                                icon: HiOutlineEye,
                                onClick: () => navigate(`${item.id}`),
                                className: 'view',
                              },
                              {
                                name: 'Edit',
                                icon: HiOutlinePencilSquare,
                                onClick: () => navigate(`${item.id}/edit`),
                                className: 'edit',
                              },
                              {
                                name: 'Delete',
                                icon: HiOutlineTrash,
                                onClick: () => handleDelete(item),
                                className: 'delete',
                              },
                              {
                                name: 'Attachments',
                                icon: HiPaperClip,
                                onClick: () => handleAttachments(item),
                                className: 'attachments',
                              },
                            ],
                            permissions
                          )}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </CustomTable>
          </Col>
        </Row>
      </section>
      <CustomModal
        show={showNewAccountModal}
        close={() => setShowNewAccountModal(false)}
      >
        <h4 className="modalTitle text-center mb-4">
          Account Code Preferences
        </h4>
        <div className="radio-group mb-4 beechMein">
          <label>
            <input
              type="radio"
              name="inputType"
              value="manual"
              onClick={(e) => {
                setNewAccountCodeType(e.target.value);
              }}
            />
            <span>Enter Manually</span>
          </label>
          <label>
            <input
              type="radio"
              name="inputType"
              value="auto"
              onClick={(e) => {
                setNewAccountCodeType(e.target.value);
              }}
            />
            <span>Auto Generated</span>
          </label>
        </div>
        <div className="beechMein">
          <CustomButton
            text={'Set Preference'}
            disabled={!newAccountCodeType}
            onClick={() => {
              if (newAccountCodeType) {
                handleNewClick();
              }
            }}
          />
        </div>
      </CustomModal>
      <CustomModal
        show={showAttachmentsModal}
        close={() => setShowAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          item={selectedItem}
          queryToInvalidate={'partyLedgerListing'}
          deleteService={deletePartyLedgerAttachment}
          uploadService={addPartyLedgerAttachment}
          closeUploader={setShowAttachmentsModal}
        />
      </CustomModal>
    </>
  );
};

export default withModal(withFilters(PartyLedger));
