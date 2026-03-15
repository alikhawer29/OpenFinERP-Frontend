import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { RxOpenInNewWindow } from 'react-icons/rx';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomModal from '../../../Components/CustomModal';
import StatusChip from '../../../Components/StatusChip/StatusChip';
import { showToast } from '../../../Components/Toast/Toast';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import {
  updateSupportStatus,
  viewSupport,
} from '../../../Services/Admin/Support';
import {
  documentTypes,
  formatDate,
  imageTypes,
  isNullOrEmpty,
} from '../../../Utils/Utils';
import { getIcon } from '../../Master/DocumentRegister/DocumentRegisterDetails';

const SupportLogDetails = () => {
  usePageTitle('Support Log - Details');
  const { id } = useParams();
  const navigate = useNavigate();
  let queryClient = useQueryClient();

  const [showAttachement, setShowAttachement] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Support Details
  const {
    data: supportLogDetails,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['supportLogDetails', id],
    queryFn: () => viewSupport(id),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const getRenewalStatusChip = (status) => {
    const statusMap = {
      resolved: 'success',
      pending: 'warning',
      canclled: 'danger',
    };
    return <StatusChip status={status} className={statusMap[status]} />;
  };

  const markStatus = (status) => {
    const formData = { status };
    updateStatusMutation({ id, formData }); // pass as a single object
  };

  const { mutate: updateStatusMutation, isPending: isStatusUpdating } =
    useMutation({
      mutationFn: async ({ id, formData }) =>
        await updateSupportStatus(id, formData),
      onSuccess: (data) => {
        showToast('Status updated successfully', 'success');
        queryClient.invalidateQueries(['supportLogDetails', id]);
      },
      onError: (error) => {
        showToast('Failed to update status', 'error');
      },
    });

  if (isLoading) {
    return (
      <>
        <div className="d-flex align-items-start mb-4 justify-content-between flex-wrap">
          <div className="d-flex flex-column gap-2">
            <BackButton />
            <h2 className="screen-title m-0 d-inline">Support Details</h2>
          </div>
        </div>
        <div className="d-card">
          <div className="row">
            <div className="col-12 col-lg-10 col-xl-9 col-xxl-7 mb-4">
              <div className="mb-45">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="mb-4">
                    <Skeleton
                      width={150}
                      height={16}
                      baseColor="#ddd"
                      style={{ marginBottom: 8 }}
                    />
                    <Skeleton
                      width="100%"
                      height={20}
                      baseColor="#ddd"
                    />
                  </div>
                ))}
              </div>
              <div className="d-flex gap-2">
                <Skeleton width={150} height={43} baseColor="#ddd" />
                <Skeleton width={150} height={43} baseColor="#ddd" />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <div className="d-flex align-items-start mb-4 justify-content-between flex-wrap">
          <div className="d-flex flex-column gap-2">
            <BackButton />
            <h2 className="screen-title m-0 d-inline">Support Details</h2>
          </div>
        </div>
        <div className="d-card">
          <div className="row">
            <div className="col-12 col-lg-10 col-xl-9 col-xxl-7 mb-4">
              <p className="text-danger">
                {error?.message || 'Unable to fetch support details at this time'}
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="d-flex align-items-start mb-4 justify-content-between flex-wrap">
        <div className="d-flex flex-column gap-2">
          <BackButton />
          <h2 className="screen-title m-0 d-inline">Support Details</h2>
        </div>
   
      </div>
      <div className="d-card position-relative">
        <div className="status-right-top  d-flex align-items-center gap-2">
          <p className="text-label">Status</p>
          <p className="text-data mb-0 p-0">
            {getRenewalStatusChip(supportLogDetails?.status)}
          </p>
        </div>
        <div className="row ">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7 mb-4">
            <div className="mb-45">
              {[
                {
                  label: 'User ID',
                  value: supportLogDetails?.user?.user_id,
                },
                {
                  label: 'User Name',
                  value: supportLogDetails?.name,
                },
                {
                  label: 'Email',
                  value: supportLogDetails?.email,
                },
                {
                  label: 'Contact No.',
                  value: supportLogDetails?.contact_no,
                },
                {
                  label: 'Support Type',
                  value: supportLogDetails?.type?.name,
                },
                {
                  label: 'Date',
                  value: formatDate(supportLogDetails?.created_at),
                },
                {
                  label: 'Message',
                  value: supportLogDetails?.message,
                },
                {
                  label: 'Resolved / Cancelled By',
                  value: supportLogDetails?.resolved_cancelled_by?.first_name,
                },
              ].map((x, i) => {
                if (isNullOrEmpty(x.value)) return null;
                return (
                  <div key={i} className="mb-4">
                    <p className="detail-title detail-label-color mb-1">
                      {x.label}
                    </p>
                    <p className="detail-text wrapText mb-0">{x.value}</p>
                  </div>
                );
              })}
              {supportLogDetails?.files?.length ? (
                <div className="col-12 mb-4">
                  <p className="detail-title detail-label-color mb-1">
                    Attachment
                    {supportLogDetails.files?.length > 1 ? 's' : ''}
                  </p>
                  <div className="detail-text wrapText">
                    {supportLogDetails.files.map((file) => (
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
            <div className="d-flex align-items-center gap-2">
              {supportLogDetails?.status === 'pending' && (
                <>
                  <div>
                    <CustomButton
                      onClick={() => markStatus('resolved')}
                      text="Mark As Resolved"
                    />
                  </div>
                  <div>
                    <CustomButton
                      onClick={() => markStatus('cancelled')}
                      text="Mark As Cancelled"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
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
    </>
  );
};

export default SupportLogDetails;
