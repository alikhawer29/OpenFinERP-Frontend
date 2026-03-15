import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import {
  HiMiniArrowDownTray,
  HiOutlineEye,
  HiOutlineTrash,
} from 'react-icons/hi2';
import { RxOpenInNewWindow } from 'react-icons/rx';
import withModal from '../../HOC/withModal';
import { attachmentsTableHeaders } from '../../Utils/Constants/TableHeaders';
import {
  documentTypes,
  imageTypes,
  isNullOrEmpty,
  showErrorToast,
} from '../../Utils/Utils';
import { addAttachmentValidationSchema } from '../../Utils/Validations/ValidationSchemas';
import CustomButton from '../CustomButton';
import CustomModal from '../CustomModal';
import CustomTable from '../CustomTable/CustomTable';
import TableActionDropDown from '../TableActionDropDown/TableActionDropDown';
import { showToast } from '../Toast/Toast';
import UploadAndDisplayFiles from '../UploadAndDisplayFiles/UploadAndDisplayFiles';

const AttachmentsView = ({
  showModal,
  closeModal,
  item = {},
  deleteService,
  uploadService,
  getAttachmentsService,
  closeUploader,
  queryToInvalidate,
  viewOnly,
  uploadOnly,
  getUploadedFiles,
  voucherAttachment,
  useItemId = false, // New prop to determine if we should use item.id instead of voucher_no
  deferredMode = false, // New prop: if true, don't call APIs, just track changes
  getDeletedAttachments, // Callback for tracking deleted attachments in deferred mode
  currentFiles, // Current files state (for deferred mode)
  setCurrentFiles, // Setter for current files (for deferred mode)
}) => {
  const { id, files: filesFromParent } = item ?? {};
  const [activeTab, setActiveTab] = useState(
    uploadOnly ? 'attach' : 'attached'
  );
  const [numberOfFiles, setNumberOfFiles] = useState(0);
  const [showAttachement, setShowAttachement] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [files, setFiles] = useState(filesFromParent || []);
  let queryClient = useQueryClient();

  // Fetch attachments if service is provided and modal is shown
  const {
    data: attachmentsData,
    isLoading: isLoadingAttachments,
    refetch: refetchAttachments,
  } = useQuery({
    queryKey: [
      'attachments',
      useItemId ? item?.id : item?.voucher_no || item?.id,
    ],
    queryFn: () =>
      getAttachmentsService(
        useItemId ? item?.id : item?.voucher_no || item?.id
      ),
    enabled: !!getAttachmentsService && !!showModal && !uploadOnly,
  });

  // Update files state when item prop changes or attachments are fetched
  useEffect(() => {
    // Use fetched attachments data if available, otherwise fall back to item properties
    const filesData = attachmentsData || item?.files || item?.attachments || [];
    if (deferredMode && setCurrentFiles) {
      // In deferred mode, use the external state setter
      setCurrentFiles(filesData);
    } else {
      setFiles(filesData);
    }
  }, [
    item?.files,
    item?.attachments,
    item?.id,
    attachmentsData,
    deferredMode,
    setCurrentFiles,
  ]);

  // Use external files state in deferred mode
  const displayFiles = deferredMode && currentFiles ? currentFiles : files;

  const uploadAttachmentMutation = useMutation({
    mutationFn: (formData) => {
      // Determine which ID to use based on useItemId prop
      const uploadId = voucherAttachment
        ? useItemId
          ? item?.id
          : item?.voucher_no || item?.id
        : id;

      return uploadService(uploadId, formData);
    },
    onSuccess: () => {
      showToast(
        `Attachment${numberOfFiles > 1 ? 's' : ''} uploaded!`,
        'success'
      );
      if (queryToInvalidate) {
        queryClient.invalidateQueries([queryToInvalidate]);
        // Force refetch to ensure we get the latest data
        queryClient.refetchQueries([queryToInvalidate]);
      }
      // // Refetch attachments if service is available
      // if (getAttachmentsService) {
      refetchAttachments();
      // }
      closeUploader();
    },
    onError: (error) => {
      console.error(
        `Error uploading Attachment${numberOfFiles > 1 ? 's' : ''}`,
        error
      );
      showErrorToast(error);
    },
  });

  // Delete Attachment Mutation
  const deleteAttachmentMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: (_, id) => {
      closeModal();
      showToast('Attachment Deleted Successfully', 'success');
      if (queryToInvalidate) {
        queryClient.invalidateQueries([queryToInvalidate]);
        // Force refetch to ensure we get the latest data
        queryClient.refetchQueries([queryToInvalidate]);
      }
      // Refetch attachments if service is available
      if (getAttachmentsService) {
        refetchAttachments();
      }
      setFiles(files.filter((f) => f.id !== id));
    },
    onError: (error) => {
      closeModal();
      if (
        error.message.toLowerCase() ==
        'the attachment cannot be deleted as it is currently in use.'
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
  const handleDelete = (attachment) => {
    if (deferredMode && getDeletedAttachments) {
      // In deferred mode, just track the deletion locally
      showModal(
        'Delete',
        `Are you sure you want to delete attachment ${attachment?.name}?`,
        () => {
          // Notify parent about the deletion
          getDeletedAttachments(attachment?.id);
          // Update local UI state
          if (setCurrentFiles && currentFiles) {
            setCurrentFiles(
              currentFiles.filter((f) => f.id !== attachment?.id)
            );
          } else {
            setFiles(files.filter((f) => f.id !== attachment?.id));
          }
          showToast(
            'Attachment will be deleted when voucher is updated',
            'success'
          );
          closeModal(); // Close the modal after deletion
        }
      );
    } else {
      // Normal mode: call the API immediately
      showModal(
        'Delete',
        `Are you sure you want to delete attachment ${attachment?.name}?`,
        () => {
          deleteAttachmentMutation.mutate(attachment?.id);
        }
      );
    }
  };

  const handleSubmit = (values) => {
    const formData = values.files.reduce((acc, file, index) => {
      acc[`files[${index}]`] = file;
      return acc;
    }, {});
    setNumberOfFiles(values.files.length);
    if (getUploadedFiles) {
      getUploadedFiles(formData);
      closeUploader();
    } else {
      uploadAttachmentMutation.mutate(formData);
    }
  };

  return (
    <div>
      <h4 className="text-center modalTitle mb-3">
        {activeTab === 'attached' ? 'Attachments' : 'Attach'}
      </h4>
      {viewOnly || uploadOnly ? null : (
        <div className="d-flex justify-content-center">
          <div className="attachment-tabs mb-2">
            <button
              onClick={() => setActiveTab('attached')}
              className={`secondaryButton tab-button ${activeTab === 'attached' && 'active'
                }`}
            >
              Attached Document{displayFiles?.length > 1 ? 's' : ''}
            </button>
            <button
              onClick={() => setActiveTab('attach')}
              className={`secondaryButton tab-button ${activeTab === 'attach' && 'active'
                }`}
            >
              Attach Documents
            </button>
          </div>
        </div>
      )}
      {activeTab === 'attached' ? (
        <div className="my-4">
          <CustomTable
            headers={attachmentsTableHeaders}
            hasFilters={false}
            isPaginated={false}
            isLoading={isLoadingAttachments}
          >
            {displayFiles?.length > 0 && (
              <tbody>
                {displayFiles?.map((file, index) => {
                  let type = (file?.name || '').split('.').pop();
                  let isDocType =
                    type === 'xls' ||
                    type === 'xlsx' ||
                    type === 'doc' ||
                    type === 'docx';
                  return (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{file.name}</td>
                      <td width={100}>
                        <TableActionDropDown
                          actions={[
                            {
                              name: isDocType ? 'Download' : 'View',
                              icon: isDocType
                                ? HiMiniArrowDownTray
                                : HiOutlineEye,
                              onClick: () => {
                                isDocType
                                  ? window.open(file?.file_url, '_blank')
                                  : (setShowAttachement(true),
                                    setSelectedItem(file));
                              },
                              className: 'view',
                            },
                            ...(!viewOnly
                              ? [
                                {
                                  name: 'Delete',
                                  icon: HiOutlineTrash,
                                  onClick: () => handleDelete(file),
                                  className: 'delete',
                                },
                              ]
                              : []),
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </CustomTable>
        </div>
      ) : (
        <>
          <Formik
            initialValues={{
              files: [],
            }}
            validationSchema={addAttachmentValidationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, setFieldValue }) => (
              <Form>
                <div className="my-4">
                  <UploadAndDisplayFiles
                    numberOfFiles={5}
                    onChange={(files) => {
                      setFieldValue('files', files);
                    }}
                    showNumberOfFilesText
                    errorFromParent={touched.files && errors.files}
                  />
                </div>
                <div className="d-flex justify-content-center gap-3">
                  <CustomButton
                    text={'Upload'}
                    type={'submit'}
                    disabled={uploadAttachmentMutation.isPending}
                    loading={uploadAttachmentMutation.isPending}
                  />
                  <CustomButton
                    text={'Cancel'}
                    variant={'secondaryButton'}
                    type={'button'}
                    disabled={uploadAttachmentMutation.isPending}
                    onClick={() => {
                      closeUploader(false);
                    }}
                  />
                </div>
              </Form>
            )}
          </Formik>
        </>
      )}
      {!isNullOrEmpty(selectedItem) ? (
        imageTypes.includes((selectedItem?.name || '').split('.').pop()) ? ( // If uploaded type is image
          // <ImageGallery images={[selectedItem?.file_url]} />

          <div className="backdrop" onClick={() => setSelectedItem(null)}>
            <div className="image-container">
              <img
                src={selectedItem.file_url}
                alt={selectedItem.name}
                width={'100%'}
              />
            </div>
          </div>
        ) : (
          <CustomModal
            show={showAttachement}
            close={() => setShowAttachement(false)}
            background={true}
          >
            {documentTypes.includes((selectedItem?.name || '').split('.').pop()) ? ( // If uploaded type is document
              <>
                <a
                  href={selectedItem?.file_url}
                  target="_blank"
                  className="mb-3 d-inline-block"
                >
                  Open in new tab <RxOpenInNewWindow className="d-inline " />
                </a>
                <object
                  data={selectedItem?.file_url}
                  type={
                    selectedItem?.name
                      ? (() => {
                        switch ((selectedItem?.name || '').split('.').pop()) {
                          case 'txt':
                            return 'text/plain';
                          case 'pdf':
                            return 'application/pdf';
                          default:
                            return 'application/pdf';
                        }
                      })()
                      : 'application/pdf'
                  }
                  width="100%"
                  height="800px"
                >
                  <p>
                    If the file doesn't load, click{' '}
                    <a href={selectedItem.file_url}>this link!</a>
                  </p>
                </object>
              </>
            ) : (
              () => {
                window.open(selectedItem?.file_url, '_blank');
                setShowAttachement(false);
                setSelectedItem(false);
              }
            )}
          </CustomModal>
        )
      ) : null}
    </div>
  );
};

export default withModal(AttachmentsView);
