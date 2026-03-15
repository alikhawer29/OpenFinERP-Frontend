import React, { useState } from 'react';
import {
  deleteDocumentRegister,
  viewDocumentRegister,
} from '../../../Services/Masters/DocumentRegister';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import Skeleton from 'react-loading-skeleton';
import BackButton from '../../../Components/BackButton';
import { useNavigate, useParams } from 'react-router-dom';
import DOC from '../../../assets/images/doc.svg?react';
import PDF from '../../../assets/images/pdf.svg?react';
import TXT from '../../../assets/images/txt.svg?react';
import XLS from '../../../assets/images/xls.svg?react';
import XML from '../../../assets/images/xml.svg?react';
import CustomButton from '../../../Components/CustomButton';
import useDataMutations from '../../../Hooks/useDataMutations';
import withModal from '../../../HOC/withModal';
import { showToast } from '../../../Components/Toast/Toast';
import {
  documentTypes,
  formatDate,
  imageTypes,
  isNullOrEmpty,
  showErrorToast,
} from '../../../Utils/Utils';
import CustomModal from '../../../Components/CustomModal';
import { FaFile } from 'react-icons/fa6';
import { RxOpenInNewWindow } from 'react-icons/rx';
import useModulePermissions from '../../../Hooks/useModulePermissions';

export const getIcon = (type) => {
  switch (type) {
    case 'doc':
    case 'docx':
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return <DOC />;

    case 'pdf':
    case 'application/pdf':
      return <PDF />;

    case 'txt':
    case 'text/plain':
      return <TXT />;

    case 'application/vnd.ms-excel':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    case 'xls':
    case 'xlsx':
      return <XLS />;

    case 'application/xml':
    case 'text/xml':
      return <XML />;

    default:
      return <FaFile size={22} />;
  }
};

const DocumentRegisterDetails = ({ showModal, closeModal }) => {
  usePageTitle('Document Register - Details');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const [selectedFile, setSelectedFile] = useState(null);
  const [showAttachement, setShowAttachement] = useState(false);

  const {
    data: documentRegister,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['documentRegisterDetails', id],
    queryFn: () => viewDocumentRegister(id),
    refetchOnWindowFocus: false,
    retry: 1,
  });
  //  --- MUTATIONS ---
  const { deleteMutation } = useDataMutations({
    onDeleteSuccessCallback: () => {
      closeModal();
      showToast('Document Register Deleted Successfully', 'success');
      [['documentRegisterDetails', id], 'documentRegisterListing'].forEach(
        (key) => queryClient.invalidateQueries({ queryKey: [...key] })
      );
      setTimeout(() => {
        navigate(-1);
      }, 300);
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

  // Functions to handle table action
  const handleDelete = () => {
    showModal(
      'Delete',
      `Are you sure you want to delete this document?`,
      () => {
        deleteMutation.mutate({
          serviceFunction: deleteDocumentRegister,
          id,
        });
      }
    );
  };
  if (isLoading) {
    return (
      <div>
        <div className="d-flex flex-column gap-2 mb-4">
          <BackButton />
          <h2 className="screen-title m-0">Document Register</h2>
        </div>

        <div className="d-card ">
          <div className="row">
            <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
              <div className="row mb-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="col-12 col-sm-6 mb-3 align-items-center"
                    style={{ height: 56 }}
                  >
                    <Skeleton
                      style={{ marginBottom: 28 }}
                      duration={1}
                      width={'100%'}
                      baseColor="#ddd"
                      height={42}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (isError) {
    return (
      <div>
        <div className="d-flex flex-column gap-2 mb-4">
          <BackButton />
          <h2 className="screen-title m-0">Document Register</h2>
        </div>

        <div className="d-card ">
          <div className="row">
            <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
              <div className="row mb-4">{error.message}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="d-flex align-items-start mb-4 justify-content-between flex-wrap">
        <div className="d-flex flex-column gap-2">
          <BackButton />
          <h2 className="screen-title m-0 d-inline">Document Register</h2>
        </div>
        {hasEditPermission && (
          <div className="d-flex gap-2 flex-wrap">
            <CustomButton text={'Edit'} onClick={() => navigate('edit')} />
          </div>
        )}
      </div>
      <div className="d-card ">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <div className="row">
              {[
                {
                  label: 'Group',
                  value: documentRegister?.group?.type,
                },
                {
                  label: 'Type',
                  value: documentRegister?.classification?.description,
                },
                { label: 'Number', value: documentRegister?.number },
                { label: 'Description', value: documentRegister?.description },
                { label: 'Issue Date', value: documentRegister?.issue_date },
                { label: 'Due Date', value: documentRegister?.due_date },
              ].map((x, i) => {
                if (isNullOrEmpty(x.value)) return null;
                return (
                  <div key={i} className="col-12 col-sm-6 mb-4">
                    <p className="detail-title detail-label-color mb-1">
                      {x.label}
                    </p>
                    <p className="detail-text wrapText mb-0">{x.value}</p>
                  </div>
                );
              })}
              {documentRegister.files?.length ? (
                <div className="col-12 mb-4">
                  <p className="detail-title detail-label-color mb-1">
                    File{documentRegister.files?.length > 1 ? 's' : ''}
                  </p>
                  <div className="detail-text wrapText">
                    {documentRegister.files.map((file) => (
                      <div key={file.id} className="uploadedFiles mb-3">
                        <div className="nameIconWrapper">
                          <div style={{ minWidth: 28 }}>
                            {getIcon(file.name.split('.').pop())}
                          </div>
                          <a
                            style={{ width: 126, margin: 0 }}
                            className="d-flex flex-column flex-1 cp"
                            onClick={() => {
                              setSelectedFile(file), setShowAttachement(true);
                            }}
                          >
                            <p className="fileName">{file.name}</p>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                ''
              )}
            </div>
            <div className="row mb-4">
              <div className="col-12 d-flex">
                {hasDeletePermission && (
                  <CustomButton
                    text={'Delete'}
                    variant={'danger'}
                    onClick={handleDelete}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        {documentRegister?.created_at && (
          <p className="detail-title detail-label-color mb-1">
            Created on{' '}
            {formatDate(documentRegister?.created_at, 'DD/MM/YYYY - HH:MM:SS')}{' '}
            by {documentRegister?.creator?.user_name}
          </p>
        )}
        {!isNullOrEmpty(documentRegister?.editor) && (
          <p className="detail-title detail-label-color mb-0">
            Last Edited on{' '}
            {formatDate(documentRegister?.updated_at, 'DD/MM/YYYY - HH:MM:SS')}{' '}
            by {documentRegister?.editor?.user_name}
          </p>
        )}
      </div>
      {!isNullOrEmpty(selectedFile) ? (
        imageTypes.includes(selectedFile?.name.split('.').pop()) ? ( // If uploaded type is image
          <div className="backdrop" onClick={() => setSelectedFile(null)}>
            <div className="image-container">
              <img
                src={selectedFile.file_url}
                alt={selectedFile.name}
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
            {documentTypes.includes(selectedFile?.name.split('.').pop()) ? ( // If uploaded type is document
              <>
                <a
                  href={selectedFile?.file_url}
                  target="_blank"
                  className="mb-3 d-inline-block"
                >
                  Open in new tab <RxOpenInNewWindow className="d-inline " />
                </a>
                <object
                  data={selectedFile?.file_url}
                  type={
                    selectedFile?.name
                      ? (() => {
                          switch (selectedFile?.name.split('.').pop()) {
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
                    <a href={selectedFile.file_url}>this link!</a>
                  </p>
                </object>
              </>
            ) : (
              () => {
                window.open(selectedFile?.file_url, '_blank');
                setShowAttachement(false);
                setSelectedFile(false);
              }
            )}
          </CustomModal>
        )
      ) : null}
    </div>
  );
};

export default withModal(DocumentRegisterDetails);
