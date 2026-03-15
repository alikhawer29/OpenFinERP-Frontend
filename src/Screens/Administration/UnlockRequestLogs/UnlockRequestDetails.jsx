import { Form, Formik } from 'formik';
import React, { useState } from 'react';
import { RxOpenInNewWindow } from 'react-icons/rx';
import { useParams } from 'react-router-dom';
import { PulseLoader } from 'react-spinners';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { unlockRequestDetailsData } from '../../../Mocks/MockData';
import { statusClassMap } from '../../../Utils/Constants/SelectOptions';
import Skeleton from 'react-loading-skeleton';
import {
  documentTypes,
  formatDate,
  imageTypes,
  isNullOrEmpty,
} from '../../../Utils/Utils';
import { getIcon } from '../../Master/DocumentRegister/DocumentRegisterDetails';
import { getUnlockRequestetails } from '../../../Services/Administration/UnlockRequest';
import { useQuery } from '@tanstack/react-query';

const UnlockRequestDetails = () => {
  usePageTitle('Unlock Request - Details');
  const { id } = useParams();

  const [selectedFile, setSelectedFile] = useState(null);
  const [showAttachement, setShowAttachement] = useState(false);
  const [approveRequestModal, setApproveRequestModal] = useState(false);
  const [rejectRequestModal, setRejectRequestModal] = useState(false);
  const [rejectRequestReasonModal, setRejectRequestReasonModal] =
    useState(false);

  const {
    data: unlockRequestDetail,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['getUnlockRequestetails', id],
    queryFn: () => getUnlockRequestetails(id),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  if (isError) {
    return (
      <>
        <div className="d-card">
          <p className="text-danger">{error.message}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="d-flex align-items-start mb-4 justify-content-between flex-wrap">
        <div className="d-flex flex-column gap-2">
          <BackButton />
          <h2 className="screen-title m-0 d-inline">Unlock Request Detail</h2>
        </div>
      </div>
      <div className="d-card">
        <div className="mb-4">
          <div className="row mb-4">
            {isLoading && Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="col-12 col-sm-6 mb-3 align-items-center"
                style={{ height: 56 }}
              >
                <Skeleton
                  duration={1}
                  width={'100%'}
                  baseColor="#ddd"
                  height={42}
                />
              </div>
            ))}
          </div>
          {
            unlockRequestDetail &&
            <>
              <div className="d-flex justify-content-between">
                <h4 className="details-page-header pb-2">Requestor Information</h4>
                <p className="text-label">
                  Status:{' '}
                  <span
                    className={`status ${statusClassMap[unlockRequestDetail?.status?.toLowerCase()]
                      }`} // change with status
                  >
                    {unlockRequestDetail?.status}
                  </span>
                </p>
              </div>
              <div className="row ">
                <div className="col-12 col-lg-10 col-xl-9 col-xxl-7 mb-4">
                  <div className="row mb-3">
                    {[
                      {
                        label: 'Full Name',
                        value: unlockRequestDetail?.user?.user_name,
                      },
                      {
                        label: 'Email Address',
                        value: unlockRequestDetail?.user?.email,
                      },
                      {
                        label: 'Role',
                        value:
                          unlockRequestDetail?.user?.role === 'user'
                            ? 'Owner'
                            : unlockRequestDetail?.user?.role,
                      },
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
                  </div>
                  <h4 className="details-page-header pb-2">
                    Accounting Period to Unlock
                  </h4>
                  <div className="row mb-3">
                    <div className="mb-45">
                      {[
                        {
                          label: 'Start Date',
                          value: formatDate(
                            unlockRequestDetail?.start_date,
                            'DD/MM/YYYY'
                          ),
                        },
                        {
                          label: 'End Date',
                          value: formatDate(
                            unlockRequestDetail?.end_date,
                            'DD/MM/YYYY'
                          ),
                        },
                        {
                          label: 'Unlocking Reason',
                          value: unlockRequestDetail?.reason,
                        },
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
                    </div>
                    {unlockRequestDetail?.files?.length ? (
                      <div className="col-12 mb-4">
                        <h4 className="details-page-header pb-2">
                          Supporting Document
                          {unlockRequestDetail?.files?.length > 1 ? 's' : ''}
                        </h4>
                        <div className="detail-text wrapText">
                          {unlockRequestDetail?.files.map((file) => (
                            <div key={file.id} className="uploadedFiles mb-3">
                              <div className="nameIconWrapper">
                                <div style={{ minWidth: 28 }}>
                                  {getIcon(file?.name.split('.').pop())}
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
                  <div className="row mb-3">
                    <h4 className="details-page-header pb-2">
                      Request Details
                    </h4>
                    {[
                      {
                        label: 'Request Date Time',
                        value: formatDate(
                          unlockRequestDetail?.created_at,
                          'DD/MM/YYYY - HH:MM'
                        ),
                      },
                      {
                        label: `${unlockRequestDetail?.status === "rejected" ? "Rejection Date Time" : "Approval Date Time"}`,
                        reason: `${unlockRequestDetail?.reject_reason}`,
                        value: formatDate(
                          unlockRequestDetail?.reviewed_at,
                          'DD/MM/YYYY - HH:MM'
                        ),
                      },
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
                    {[
                      {
                        label: 'Rejection Reason',
                        value: unlockRequestDetail?.reject_reason,
                      },
                    ].map((x, i) => {
                      if (isNullOrEmpty(x.value)) return null;
                      return (
                        <div key={i} className="col-12 mb-4">
                          <p className="detail-title detail-label-color mb-1">
                            {x.label}
                          </p>
                          <p className="detail-text wrapText mb-0">{x.value}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          }
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
      <CustomModal
        show={approveRequestModal}
        close={() => {
          setApproveRequestModal(false);
        }}
        // disableClick={changeStatusMutation.isPending}
        action={() => console.log('')}
        title={'Approve'}
        description={`Are you sure you want to approve this Unlock Request?`}
      />
      <CustomModal
        show={rejectRequestModal}
        close={() => {
          setRejectRequestModal(false);
        }}
        // disableClick={changeStatusMutation.isPending}
        action={() => {
          setRejectRequestModal(false);
          setRejectRequestReasonModal(true);
        }}
        title={'Reject'}
        description={`Are you sure you want to reject this Unlock Request?`}
      />
      <CustomModal
        show={rejectRequestReasonModal}
        close={() => {
          setRejectRequestReasonModal(false);
        }}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle">Rejection Reason</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{
              rejection_reason: '',
            }}
            // validationSchema={addGroupMasterValidationSchema}
            onSubmit={(values) => console.log(values)}
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form>
                <div className="mb-45">
                  <CustomInput
                    name={'rejection_reason'}
                    type={'textarea'}
                    rows={1}
                    required
                    label={'Rejection Reason'}
                    placeholder={'Enter Rejection Reason'}
                    value={values.rejection_reason}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.rejection_reason && errors.rejection_reason}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {
                    //   !editMutation.isPending
                    true ? (
                      <>
                        <CustomButton
                          type="submit"
                          text={'Submit'}
                          onClick={setRejectRequestReasonModal(false)}
                        />
                        <CustomButton
                          variant={'secondaryButton'}
                          text={'Cancel'}
                          type={'button'}
                          onClick={() => setRejectRequestReasonModal(false)}
                        />
                      </>
                    ) : (
                      <PulseLoader size={11} className="modalLoader" />
                    )
                  }
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </CustomModal>
    </>
  );
};

export default UnlockRequestDetails;
