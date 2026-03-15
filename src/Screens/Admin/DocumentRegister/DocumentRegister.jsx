import { useQueryClient } from '@tanstack/react-query';
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
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { showToast } from '../../../Components/Toast/Toast';
import withFilters from '../../../HOC/withFilters ';
import withModal from '../../../HOC/withModal';
import useDataMutations from '../../../Hooks/useDataMutations';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';

import { documentRegisterAdminHeaders } from '../../../Utils/Constants/TableHeaders';
import { formatDate, showErrorToast } from '../../../Utils/Utils';
import {
  addDocumentRegisterAttachment,
  deleteDocumentRegister,
  deleteDocumentRegisterAttachment,
  getDocumentRegisterListing,
} from '../../../Services/Admin/DocumentRegister';

const DocumentRegister = ({
  showModal,
  closeModal,
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Document Register');
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const {
    data: { data: documentRegisterData = [] } = {},
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'documentRegisterListing',
    filters,
    updatePagination,
    getDocumentRegisterListing
  );
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { deleteMutation } = useDataMutations({
    onDeleteSuccessCallback: () => {
      closeModal();
      showToast('Document Deleted Successfully', 'success');
      queryClient.invalidateQueries(['documentRegisterListing', filters]);
    },
    onDeleteErrorCallback: (error) => {
      if (
        error.message.toLowerCase() ==
        'the document register cannot be deleted as it is currently in use.'
      ) {
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

  // Function to handle Delete action
  const handleDelete = (item) => {
    showModal('Delete', `Are you sure you want to delete document?`, () => {
      deleteMutation.mutate({
        serviceFunction: deleteDocumentRegister,
        id: item.id,
      });
    });
  };

  const handleAttachments = (item) => {
    setSelectedItem(item);
    setShowAttachmentsModal(true);
  };

  if (isError) {
    showErrorToast(error);
  }

  const groupMap = {
    1: 'Office',
    2: 'Vehicle',
    3: 'Employee',
  };
  const typeMap = {
    101: 'Office Rent',
    102: 'Office Utilities',
    103: 'Office Supplies',
    201: 'Fuel Expense',
    202: 'Maintenance',
    203: 'Insurance',
    301: 'Salary Expense',
    302: 'Travel Allowance',
    303: 'Medical Reimbursement',
  };
  return (
    <>
      <section>
        <div className="d-flex justify-content-between flex-wrap mb-3">
          <h2 className="screen-title mb-0">Document Register</h2>
          <CustomButton text={'New'} onClick={() => navigate('new')} />
        </div>
        <Row>
          <Col xs={12}>
            <CustomTable
              filters={filters}
              setFilters={setFilters}
              headers={documentRegisterAdminHeaders}
              pagination={pagination}
              isLoading={isLoading}
            >
              {(documentRegisterData.length || isError) && (
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={documentRegisterAdminHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {documentRegisterData?.map((item) => (
                    <tr key={item.id}>
                      <td>{groupMap[item?.group_name] || 'Unknown'}</td>
                      <td>{typeMap[item?.type] || 'Unknown'}</td>
                      <td>{item?.description}</td>
                      <td>{item?.number}</td>
                      <td>{formatDate(item?.issue_date)}</td>
                      <td>{formatDate(item?.due_date)}</td>
                      <td>{formatDate(item?.updated_at)}</td>
                      <td>
                        <TableActionDropDown
                          actions={[
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
      </section>
      <CustomModal
        show={showAttachmentsModal}
        close={() => setShowAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          item={selectedItem}
          queryToInvalidate={'documentRegisterListing'}
          deleteService={deleteDocumentRegisterAttachment}
          uploadService={addDocumentRegisterAttachment}
          closeUploader={setShowAttachmentsModal}
        />
      </CustomModal>
    </>
  );
};

export default withModal(withFilters(DocumentRegister));
