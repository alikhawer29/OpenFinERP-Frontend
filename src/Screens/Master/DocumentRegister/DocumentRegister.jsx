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
import {
  addDocumentRegisterAttachment,
  deleteDocumentRegister,
  deleteDocumentRegisterAttachment,
  getDocumentRegisterListing,
} from '../../../Services/Masters/DocumentRegister';
import { documentRegisterHeaders } from '../../../Utils/Constants/TableHeaders';
import { formatDate, showErrorToast } from '../../../Utils/Utils';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import { filterActions } from '../../../Utils/Helpers';

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

  const permissions = useModulePermissions('master', 'document_register');

  const {
    create: hasCreatePermission,
    edit: hasEditPermission,
    delete: hasDeletePermission,
    view: hasViewPermission,
  } = permissions;

  return (
    <>
      <section>
        <div className="d-flex justify-content-between flex-wrap mb-3">
          <h2 className="screen-title mb-0">Document Register</h2>
          {hasCreatePermission && (
            <CustomButton text={'New'} onClick={() => navigate('new')} />
          )}
        </div>
        <Row>
          <Col xs={12}>
            <CustomTable
              filters={filters}
              setFilters={setFilters}
              headers={documentRegisterHeaders}
              pagination={pagination}
              isLoading={isLoading}
            >
              {(documentRegisterData.length || isError) && (
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={documentRegisterHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {documentRegisterData?.map((item) => (
                    <tr key={item.id}>
                      <td>{item?.group?.type}</td>
                      <td>{item?.classification?.description}</td>
                      <td>{item.description}</td>
                      <td>{item.number}</td>
                      <td>{formatDate(item.issue_date)}</td>
                      <td>{formatDate(item.due_date)}</td>
                      <td>{item.creator.user_id}</td>
                      <td>{formatDate(item.updated_at)}</td>
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
