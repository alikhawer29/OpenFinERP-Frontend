import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { Col, Row } from 'react-bootstrap';
import CustomButton from '../../Components/CustomButton';
import CustomTable from '../../Components/CustomTable/CustomTable';
import StatusChip from '../../Components/StatusChip/StatusChip';
import withFilters from '../../HOC/withFilters ';
import { usePageTitle } from '../../Hooks/usePageTitle';
import { useFetchTableData } from '../../Hooks/useTable';
import {
  cancelSubscription,
  getCurrentSubscription,
  getSubscriptionListing,
} from '../../Services/Masters/Subscription';
import { filterActiveAndInactive } from '../../Utils/Constants/SelectOptions';
import { subscriptionLogsHeaders } from '../../Utils/Constants/TableHeaders';
import { formatDate, serialNum, showErrorToast } from '../../Utils/Utils';
import Skeleton from 'react-loading-skeleton';
import { Link } from 'react-router-dom';
import { showToast } from '../../Components/Toast/Toast';
import useModulePermissions from '../../Hooks/useModulePermissions';

const SubscriptionLogs = ({
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Subscription Logs');
  let queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useFetchTableData(
    'subscriptionsListing',
    filters,
    updatePagination,
    getSubscriptionListing
  );

  const permissions = useModulePermissions("administration", "subscription_logs")
  const { cancel_subscription , change_subscription, renew_subscription } = permissions;

  const {
    data: currentSubscription,
    isLoading: isLoadingCurrentSubscription,
    isError: isErrorCurrentSubscription,
    error: errorCurrentSubscription,
  } = useQuery({
    queryKey: ['currentSubscription'],
    queryFn: () => getCurrentSubscription(), // Call the function
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const subscriptionData = data?.data || [];
  const currentSubscriptionData = currentSubscription || [];

  const cancelCurrentSubscription = (item) => {
    cancelSubscriptionMutation.mutate(item.id);
  };

  // Mutation for Cancel Subscription
  const cancelSubscriptionMutation = useMutation({
    mutationFn: (id) => cancelSubscription(id),
    onSuccess: () => {
      showToast('Subscription cancel successfully!', 'success'); // Show success message
      queryClient.invalidateQueries([
        'currentSubscription',
        currentSubscription,
      ]);
    },
    onError: (error) => {
      showErrorToast(error || 'An error occurred'); // Show error message
    },
  });

  return (
    <div>
      <h2 className="screen-title">Current Subscription</h2>
      <div className="d-card py-45 mb-45">
        {isLoadingCurrentSubscription ? (
          <>
            <div
              className="col-12 col-sm-6 mb-3  align-items-center"
              style={{ height: 56 }}
            >
              <Skeleton
                style={{ marginTop: 20 }}
                duration={1}
                width={180}
                baseColor="#ddd"
                height={22}
              />
            </div>
            <div className="d-flex gap-3 ">
              <div style={{ height: 48 }}>
                <Skeleton
                  style={{ marginTop: 12 }}
                  duration={1}
                  width={180}
                  baseColor="#ddd"
                  height={22}
                />
              </div>
              <div
                className="col-12 col-sm-6 mb-3  align-items-center"
                style={{ height: 48 }}
              >
                <Skeleton
                  style={{ marginTop: 12 }}
                  duration={1}
                  width={180}
                  baseColor="#ddd"
                  height={22}
                />
              </div>
            </div>
            <div style={{ height: 23 }}>
              <Skeleton duration={1} width={180} baseColor="#ddd" height={22} />
            </div>
          </>
        ) : (
          <>
            <div className="d-flex justify-content-between flex-wrap-reverse">
              <div>
                <p className="text-label">Subscription Title</p>
                <p className="text-data">
                  {currentSubscriptionData?.package?.title}
                </p>
              </div>
              <div className="d-flex gap-3 ms-auto mb-3 mb-md-0">
                {currentSubscriptionData?.auto_renewal !== 1 ||
                  (currentSubscriptionData?.is_cancelled == 0 && renew_subscription && (
                    <Link
                      to={'/payment'}
                      state={{ currentSubscription, renew: true }}
                    >
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Renew Subscription'}
                      />
                    </Link>
                  ))}
                {
                  change_subscription &&
                  <Link to={'change'}>
                    <CustomButton text={'Change Subscription'} />
                  </Link>
                }
                {currentSubscription?.is_cancelled === 0 && cancel_subscription && (
                  <CustomButton
                    text={'Cancel Subscription'}
                    onClick={() =>
                      cancelCurrentSubscription(currentSubscription)
                    }
                  />
                )}
              </div>
            </div>
            <div className="d-flex gap-md-5 gap-3 mt-3">
              <div className="d-inline">
                <p className="text-label">Subscription Date</p>
                <p className="text-data">
                  {formatDate(currentSubscriptionData?.created_at)}
                </p>
              </div>
              <div>
                <p className="text-label">Expiry Date</p>
                <p className="text-data">
                  {formatDate(currentSubscriptionData?.expire_date)}
                </p>
              </div>
            </div>
            <div className="checkbox-wrapper mt-md-4 mt-3">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  name="auto-renew"
                  checked={Boolean(currentSubscriptionData?.auto_renewal)}
                  onChange={(e) => console.log('')}
                />
                <span className="custom-checkbox"></span>
                Auto-Renew
              </label>
            </div>
          </>
        )}
      </div>
      <h2 className="screen-title">Subscription Logs</h2>
      <Row>
        <Col xs={12}>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={subscriptionLogsHeaders}
            pagination={pagination}
            isLoading={isLoading}
            dateFilters={[
              {
                label: 'Subscription Date',
                title: 'Subscription Date',
                from: 'from',
                to: 'to',
              },
              {
                label: 'Expiry Date',
                title: 'Expiry Date',
                from: 'from',
                to: 'to',
              },
            ]}
            selectOptions={[
              {
                title: 'Status',
                options: filterActiveAndInactive,
              },
            ]}
          >
            {(subscriptionData.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={subscriptionLogsHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {subscriptionData?.map((item, index) => (
                  <tr key={item.id}>
                    {/* Updated the serial number calculation */}
                    <td>
                      {serialNum(
                        (filters?.page - 1) * filters?.per_page + index + 1
                      )}
                    </td>

                    {/* Set the user name and email */}
                    <td>{item?.package?.title}</td>
                    <td>${item.subscription_amount}</td>

                    {/* Format the created date */}
                    <td>{formatDate(item.created_at)}</td>
                    <td>{formatDate(item.expire_date)}</td>
                    <td>
                      <StatusChip status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </CustomTable>
        </Col>
      </Row>
    </div>
  );
};

export default withFilters(SubscriptionLogs);
