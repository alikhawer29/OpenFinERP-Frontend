import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import Skeleton from 'react-loading-skeleton';
import { useParams } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import StatusChip from '../../../Components/StatusChip/StatusChip';
import { showToast } from '../../../Components/Toast/Toast';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import {
  getUserBranches,
  updateStatus,
  viewUser,
} from '../../../Services/Admin/UserManagement';
import AdminSubscriptionLogs from '../SubscriptionLogs/AdminSubscriptionLogs';
import { statusClassMap } from '../../../Utils/Constants/SelectOptions';
import { branchLogHeaders } from '../../../Utils/Constants/TableHeaders';
import { formatDate } from '../../../Utils/Utils';
import './styles.css';

const UserDetails = ({ showModal, closeModal, updatePagination }) => {
  usePageTitle('Client Details');
  const [changeStatusModal, setChangeStatusModal] = useState(false);
  const { id } = useParams();
  let queryClient = useQueryClient();

  // Mutation for updating status
  const { mutate: updateStatusMutation, isPending: isStatusUpdating } =
    useMutation({
      mutationFn: async () => await updateStatus(id),
      onSuccess: (data) => {
        showToast('Status updated successfully', 'success');
        setChangeStatusModal(false);
        queryClient.invalidateQueries(['userDetails', id]);
      },
      onError: (error) => {
        showToast('Failed to update status', 'error');
        console.error('Error updating status:', error);
      },
    });

  const handleStatusChange = () => {
    const newStatus = user?.status_detail === 'Active' ? 'Inactive' : 'Active';
    updateStatusMutation(newStatus);
  };

  // User Details
  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['userDetails', id],
    queryFn: () => viewUser(id),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // User Branches
  const {
    data: branches = [],
    isLoading: isLoadingBranchLogs,
    isError: isErrorBranchLogs,
    error: errorBranchLogs,
  } = useQuery({
    queryKey: ['branches', id],
    queryFn: () => getUserBranches(id),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const branchLogs = branches?.data ?? [];

  if (isLoading && isLoadingBranchLogs) {
    return (
      <>
        <div className="d-card ">
          <div className="row">
            <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
              <div className="row mb-4">
                {Array.from({ length: 19 }).map((_, i) => (
                  <div
                    key={i}
                    className="col-12 col-sm-6 mb-3  align-items-center"
                    style={{ height: 56 }}
                  >
                    <Skeleton
                      style={{ marginTop: 28 }}
                      duration={1}
                      width={'50%'}
                      baseColor="#ddd"
                      height={22}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isError && isErrorBranchLogs) {
    return (
      <>
        <div className="d-card">
          <p className="text-danger">{error.message}</p>
        </div>
      </>
    );
  }

  return (
    <div>
      <div className="d-flex align-items-start mb-4 justify-content-between flex-wrap">
        <div className="d-flex flex-column gap-2">
          <BackButton />
          <h2 className="screen-title m-0 d-inline">Client Profile</h2>
        </div>
      </div>
      <div className="d-card py-45 mb-45">
        <div className="d-flex justify-content-between flex-wrap-reverse">
          <div>
            <p className="text-label">Business ID</p>
            <p className="text-data">{user?.id}</p>
          </div>
          <div className="d-flex flex-column align-items-center gap-1 ms-auto mb-3 mb-md-0">
            <p className="text-label">
              Status:{' '}
              <span
                className={`status ${statusClassMap[user?.status_detail]}`} // change with user status
              >
                {user?.status_detail}
              </span>
            </p>
            <CustomButton
              onClick={() => setChangeStatusModal(true)}
              text={
                user?.status_detail === 'Active' ? 'Deactivate' : 'Activate'
              }
            />
          </div>
        </div>
        <div className="d-flex gap-3 mt-3 detailsWrapper">
          <div className="detailItem">
            <p className="text-label">Business Name</p>
            <p className="text-data">{user?.business_name}</p>
          </div>
          <div className="detailItem">
            <p className="text-label">Contact Person</p>
            <p className="text-data">{user?.user_name}</p>
          </div>
          <div className="detailItem">
            <p className="text-label">User ID</p>
            <p className="text-data">{user?.user_id}</p>
          </div>
          <div className="detailItem">
            <p className="text-label">Phone No.</p>
            <p className="text-data">{user?.phone_number}</p>
          </div>
          <div className="detailItem">
            <p className="text-label">Email Address</p>
            <p className="text-data">{user?.email}</p>
          </div>
          <div className="detailItem">
            <p className="text-label">Reg. Date</p>
            <p className="text-data">{formatDate(user?.created_at)}</p>
          </div>
        </div>
      </div>

      <h2 className="screen-title">Branch Logs</h2>
      <Row>
        <Col xs={12}>
          <CustomTable
            hasFilters={false}
            isPaginated={false}
            headers={branchLogHeaders}
          >
            <tbody>
              {branchLogs?.map((item, index) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.no_of_users}</td>
                  <td>{item.address}</td>
                  <td>{item?.manager?.user_name}</td>
                  <td>{item?.supervisor?.user_name}</td>
                  <td>{item?.currency?.currency}</td>
                  <td>
                    <StatusChip status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </CustomTable>
        </Col>
      </Row>

      {/* subscribtion logs */}
      <AdminSubscriptionLogs businessId={id} />

      <CustomModal
        show={changeStatusModal}
        close={() => setChangeStatusModal(false)}
        action={handleStatusChange}
        disableClick={isStatusUpdating}
        title={user?.status_detail === 'Active' ? 'Deactivate' : 'Activate'}
        description={`Are you sure you want to ${
          user?.status_detail === 'Active' ? 'deactivate' : 'activate'
        } this user?`}
      />
    </div>
  );
};

export default UserDetails;
