import React, { useEffect, useState } from 'react';
import { useFetchTableData } from '../../Hooks/useTable';
import { usePageTitle } from '../../Hooks/usePageTitle';
import withFilters from '../../HOC/withFilters ';
import { useLocation, useNavigate } from 'react-router-dom';
import { isNullOrEmpty, serialNum, showErrorToast } from '../../Utils/Utils';
import StatusChip from '../../Components/StatusChip/StatusChip';
import { Col } from 'react-bootstrap';
import CustomTable from '../../Components/CustomTable/CustomTable';
import {
  branchDowngradeHeaders,
  userDowngradeHeaders,
} from '../../Utils/Constants/TableHeaders';
import {
  changeDowngradeStatus,
  checkDowngrade,
  getDowngradeBranchListing,
  getDowngradeUserListing,
} from '../../Services/Masters/Subscription';
import BackButton from '../../Components/BackButton';
import TableActionDropDown from '../../Components/TableActionDropDown/TableActionDropDown';
import { HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deletePackage } from '../../Services/Admin/Package';
import { showToast } from '../../Components/Toast/Toast';
import CustomButton from '../../Components/CustomButton';

const DownGradeAdjustment = ({
  filters,
  setFilters,
  updatePagination,
  pagination,
}) => {
  usePageTitle('Downgrade Adjustment');
  const navigate = useNavigate();
  let queryClient = useQueryClient();

  const { state: { downgradeStatus, id, type, price } = {} } = useLocation();
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [users, setUsers] = useState(false);
  const [branches, setBranches] = useState(false);
  const [userFilters, setUserFilters] = useState(filters);
  const [branchFilters, setBranchFilters] = useState(filters);
  const [userPagination, setUserPagination] = useState(pagination);
  const [branchPagination, setBranchPagination] = useState(pagination);

  useEffect(() => {
    if (!isNullOrEmpty(downgradeStatus)) {
      const { users, branches } = downgradeStatus;
      setUsers(users);
      setBranches(branches);
    }
  }, [downgradeStatus]);

  const {
    data: userData,
    isLoading: isUserLoading,
    isError: isUserError,
    error: userError,
    refetch: refetchUsers, // Ensure refetch function is available
  } = useFetchTableData(
    'userListing',
    userFilters,
    setUserPagination,
    getDowngradeUserListing
  );

  const usersData = userData?.data || [];

  const {
    data: branchData,
    isLoading: isBranchLoading,
    isError: isBranchError,
    error: branchError,
    refetch: refetchBranches, // Ensure refetch function is available
  } = useFetchTableData(
    'branchListing',
    branchFilters,
    setBranchPagination,
    getDowngradeBranchListing
  );

  const branchsData = branchData?.data || [];

  if (isUserError) {
    showErrorToast(userError);
  }

  if (isBranchError) {
    showErrorToast(branchError);
  }
  const isUsersStatusActive = (item) => {
    return item?.status == 1;
  };
  const isBranchStatusActive = (item) => {
    return item?.status?.toLowerCase() === 'unblocked';
  };

  // Confirm model functions
  const handleUpdateUser = (item) => {
    changeStatusMutation.mutate({ id: item.id, type: 'user' });
  };

  const handleUpdateBranch = (item) => {
    changeStatusMutation.mutate({ id: item.id, type: 'branch' });
  };

  // Mutation for Changing Status
  const changeStatusMutation = useMutation({
    mutationFn: ({ id, type }) => changeDowngradeStatus(id, type),
    onSuccess: (_, { type }) => {
      showToast('Status changed successfully!', 'success'); // Show success message

      // Ensure proper data refresh
      if (type === 'user') {
        queryClient.invalidateQueries(['userListing', userFilters]);
        refetchUsers(); // Force re-fetch
      } else if (type === 'branch') {
        queryClient.invalidateQueries(['branchListing', branchFilters]);
        refetchBranches(); // Force re-fetch
      }
    },
    onError: (error) => {
      showErrorToast(error || 'An error occurred'); // Show error message
    },
  });

  //Check Downgrade Again
  const {
    data: downgradeStatusNew,
    isLoading: isLoadingDowngrade,
    isError: isErrorDowngrade,
    error: errorDowngrade,
  } = useQuery({
    queryKey: ['downgradeStatus', selectedSubscription],
    queryFn: () => checkDowngrade(selectedSubscription),
    onError: (error) => {
      console.error('Error fetching downgrade status:', error);
      showErrorToast(error, 'error');
    },
    enabled: !!selectedSubscription, // Ensure the query runs only if `id` is available
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    setSelectedSubscription(id);
  }, [id]);

  const handleNextClick = () => {
    // Check the downgrade status
    if (
      (selectedSubscription && downgradeStatusNew.users) ||
      downgradeStatusNew.branches
    ) {
      // If users or branches need downgrading
      let message = 'You need to downgrade ';

      if (downgradeStatusNew.users && downgradeStatusNew.branches) {
        message += 'users and branches';
      } else if (downgradeStatusNew.users) {
        message += 'users';
      } else if (downgradeStatusNew.branches) {
        message += 'branches';
      }

      // Show the toast with the message
      showToast(message, 'error');
    } else {
      // If both users and branches are fine (false)
      // Navigate to /payment
      navigate('/payment', {
        state: { id, type, price },
      });
    }
  };

  return (
    <>
      <div>
        <BackButton />
        <h2 className="screen-title">Downgrade Adjustment</h2>
      </div>

      <div className="row">
        <div className="col-12 col-lg-10 col-xl-9 col-xxl-7 ">
          <p className="muted-text mb-4">
            As you downgrade your package, you will need to select the users and
            branches you wish to block. You can unblock these users and branches
            at any time by blocking other users or branches later on
          </p>
        </div>
      </div>
      {users && (
        <>
          <h4 className="screen-title-body">Users</h4>
          <Col xs={12}>
            <CustomTable
              headers={userDowngradeHeaders}
              filters={userFilters}
              setFilters={setUserFilters}
              pagination={userPagination}
              isLoading={isUserLoading}
            >
              {(usersData.length || isUserError) && (
                <tbody>
                  {isUserError && (
                    <tr>
                      <td colSpan={usersData.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {usersData?.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        {serialNum(
                          (filters?.page - 1) * filters?.per_page + index + 1
                        )}
                      </td>

                      <td>{item.user_id}</td>
                      <td>{item.user_name}</td>
                      <td>{item.phone_number}</td>
                      <td>
                        <StatusChip
                          status={item.status == 1 ? 'Active' : 'Inactive'}
                        />
                      </td>
                      <td>
                        <TableActionDropDown
                          actions={[
                            {
                              name: isUsersStatusActive(item)
                                ? 'Block'
                                : 'Unblock',
                              icon: isUsersStatusActive(item)
                                ? HiOutlineXCircle
                                : HiOutlineCheckCircle,
                              onClick: () => handleUpdateUser(item),
                              className: isUsersStatusActive(item)
                                ? 'delete with-color'
                                : 'view with-color',
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
        </>
      )}
      {branches && (
        <>
          <h4 className="screen-title-body">Branches</h4>

          <Col xs={12}>
            <CustomTable
              headers={branchDowngradeHeaders}
              filters={branchFilters}
              setFilters={setBranchFilters}
              pagination={branchPagination}
              isLoading={isBranchLoading}
            >
              {(branchsData.length || isBranchError) && (
                <tbody>
                  {isBranchError && (
                    <tr>
                      <td colSpan={branchsData.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {branchsData?.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        {serialNum(
                          (filters?.page - 1) * filters?.per_page + index + 1
                        )}
                      </td>

                      <td>{item?.name}</td>
                      <td>{item?.address}</td>
                      <td>{item?.manager?.user_name}</td>
                      <td>{item?.supervisor?.user_name}</td>
                      <td>{item?.currency?.currency}</td>
                      <td>
                        <StatusChip status={item.status} />
                      </td>
                      <td>
                        <TableActionDropDown
                          actions={[
                            {
                              name: isBranchStatusActive(item)
                                ? 'Block'
                                : 'Unblock',
                              icon: isBranchStatusActive(item)
                                ? HiOutlineXCircle
                                : HiOutlineCheckCircle,
                              onClick: () => handleUpdateBranch(item),
                              className: isBranchStatusActive(item)
                                ? 'delete with-color'
                                : 'view with-color',
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
        </>
      )}

      <div className="d-flex justify-content-start mt-4">
        <CustomButton variant="primary" onClick={handleNextClick} text="Next" />
      </div>
    </>
  );
};

export default withFilters(DownGradeAdjustment);
