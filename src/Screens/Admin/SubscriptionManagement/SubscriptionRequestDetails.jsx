import { Form, Formik } from 'formik';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PulseLoader } from 'react-spinners';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { isNullOrEmpty, showErrorToast } from '../../../Utils/Utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  rejectPackageRequest,
  viewPackage,
} from '../../../Services/Admin/Package';
import { showToast } from '../../../Components/Toast/Toast';

const SubscriptionRequestDetails = () => {
  usePageTitle('Subscription Request - Details');
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [approveRequestModal, setApproveRequestModal] = useState(false);

  const [rejectRequestModal, setRejectRequestModal] = useState(false);
  const [rejectRequestReasonModal, setRejectRequestReasonModal] =
    useState(false);

  // Queries and Mutations
  const {
    data: subcriptionRequestDetail,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['PackageDetails', id],
    queryFn: () => viewPackage(id),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const rejectPackageMutation = useMutation({
    mutationFn: (formData) => rejectPackageRequest(id, formData),
    onSuccess: () => {
      showToast('Request Rejected!', 'success');
      queryClient.invalidateQueries('PackageDetails');
      setRejectRequestReasonModal(false);
    },
    onError: (error) => {
      console.error('Error updating Package', error);
      showErrorToast(error);
    },
  });

  const handleSubmit = (values) => {
    const formData = {
      reject_reason: values.reject_reason,
      status: 'inactive', // Assuming status should be inactive for rejected packages
    };
    rejectPackageMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <>
        <div className="d-flex align-items-start mb-4 justify-content-between flex-wrap">
          <div className="d-flex flex-column gap-2">
            <BackButton />
            <h2 className="screen-title m-0 d-inline">View Request</h2>
          </div>
        </div>
        <div className="d-card">
          <div className="row">
            <div className="col-12 col-lg-10 col-xl-9 col-xxl-7 mb-4">
              <div className="mb-45">
                {Array.from({ length: 6 }).map((_, i) => (
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
              <div className="d-flex gap-3">
                <Skeleton width={100} height={43} baseColor="#ddd" />
                <Skeleton width={100} height={43} baseColor="#ddd" />
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
            <h2 className="screen-title m-0 d-inline">View Request</h2>
          </div>
        </div>
        <div className="d-card">
          <div className="row">
            <div className="col-12 col-lg-10 col-xl-9 col-xxl-7 mb-4">
              <p className="text-danger">
                {error?.message || 'Unable to fetch request details at this time'}
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
          <h2 className="screen-title m-0 d-inline">View Request</h2>
        </div>
      </div>
      <div className="d-card">
        <div className="row ">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7 mb-4">
            <div className="mb-45">
              {[
                {
                  label: 'Business Name',
                  value: subcriptionRequestDetail?.user?.user_name,
                },
                {
                  label: 'Business ID',
                  value: subcriptionRequestDetail?.user?.id,
                },
                {
                  label: 'Email',
                  value: subcriptionRequestDetail?.user?.email,
                },
                {
                  label: 'Expected No. of Users',
                  value: subcriptionRequestDetail?.no_of_users,
                },
                {
                  label: 'Expected No. of Branches',
                  value: subcriptionRequestDetail?.branches,
                },
                {
                  label: 'Additional Comments',
                  value: subcriptionRequestDetail?.comments,
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
            </div>
            {subcriptionRequestDetail?.status === 'pending' && (
              <div className="d-flex gap-3">
                <CustomButton
                  text={'Approve'}
                  type={'submit'}
                  onClick={() => setApproveRequestModal(true)}
                />
                <CustomButton
                  text={'Reject'}
                  variant={'danger'}
                  type={'button'}
                  onClick={() => setRejectRequestModal(true)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <CustomModal
        show={approveRequestModal}
        close={() => {
          setApproveRequestModal(false);
        }}
        // disableClick={changeStatusMutation.isPending}
        action={() =>
          navigate('new', {
            state: {
              fromRequestSubscription: true,
              user_id: subcriptionRequestDetail?.user_id,
              no_of_users: subcriptionRequestDetail?.no_of_users,
              branches: subcriptionRequestDetail?.branches,
            },
          })
        }
        title={'Approve'}
        description={`Are you sure you want to approve this Subscription Request?`}
      />

      <CustomModal
        show={rejectRequestModal}
        close={() => setRejectRequestModal(false)}
        action={() => {
          setRejectRequestModal(false);
          setRejectRequestReasonModal(true);
        }}
        disableClick={rejectPackageMutation.isPending}
        title={'Reject'}
        description={`Are you sure you want to reject this Subscription Request?`}
      />

      {/* Reject Reason Modal */}
      <CustomModal
        show={rejectRequestReasonModal}
        close={() => setRejectRequestReasonModal(false)}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle">Rejection Reason</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{
              reject_reason: '',
            }}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form>
                <div className="mb-45">
                  <CustomInput
                    name={'reject_reason'}
                    type={'textarea'}
                    rows={1}
                    required
                    label={'Rejection Reason'}
                    placeholder={'Enter Rejection Reason'}
                    value={values.reject_reason}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.reject_reason && errors.reject_reason}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {rejectPackageMutation.isLoading ? (
                    <PulseLoader size={11} className="modalLoader" />
                  ) : (
                    <>
                      <CustomButton type="submit" text={'Submit'} />
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() => setRejectRequestReasonModal(false)}
                      />
                    </>
                  )}
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </CustomModal>
    </>
  );
};

export default SubscriptionRequestDetails;
