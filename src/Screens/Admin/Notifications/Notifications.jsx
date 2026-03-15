import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { PulseLoader } from 'react-spinners';
import CustomButton from '../../../Components/CustomButton';
import CustomSelect from '../../../Components/CustomSelect';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import {
  editNotification,
  getNotifications,
} from '../../../Services/Admin/Notifications';
import useUserStore from '../../../Stores/UserStore';
import { notificationOptions } from '../../../Utils/Constants/SelectOptions';
import { formatDate, showErrorToast } from '../../../Utils/Utils';
import './notifications.css';

const Notifications = () => {
  usePageTitle('Notifications');
  const { role } = useUserStore();

  const [load, setLoad] = useState(false);
  const [loadMore, setLoadMore] = useState(true);
  const queryClient = useQueryClient();
  const [params, setParams] = useState({ per_page: 10 });
  const handleLoadMore = () => {
    setParams((prev) => ({ ...prev, per_page: prev.per_page + 10 }));
  };

  const markAsRead = (id, index) => {
    editNotificationMutation.mutate(id);
  };

  //GET NOTIFICATIONS
  const {
    data: notificationsData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['getNotifications', params],
    queryFn: () => getNotifications(params),
    refetchOnWindowFocus: false,
    enabled: role === 'admin',
    retry: 1,
  });

  const notifications = notificationsData?.notifications?.data ?? [];

  if (isError) {
    console.error('Error Fetching Notifications:', error);
    showErrorToast(error);
  }

  const editNotificationMutation = useMutation({
    mutationFn: (id) => editNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries('PackageDetails');
    },
    onError: (error) => {
      console.error('Error updating notification', error);
      showErrorToast(error);
    },
  });

  // Handle CustomSelect Change
  const handleFilterChange = (selectedOption) => {
    const value = selectedOption.target.value;
    setParams((prev) => ({ ...prev, status: value })); // Directly set the selected value
  };

  return (
    <>
      <div className="mb-3">
        <h2 className="screen-title mb-0">Notifications</h2>
      </div>
      <div className="d-card">
        <div className="col-12">
          <div className="d-flex align-items-center justify-content-end flex-wrap gap-sm-3 gap-0">
            <div className="d-flex "></div>
            <div>
              <CustomSelect
                name="unread_only"
                options={notificationOptions}
                firstIsLabel={false}
                className="gray"
                onChange={handleFilterChange} // Updates params on selection
              />
            </div>
          </div>
        </div>

        <div className="row mt-4">
          {load ? (
            <PulseLoader />
          ) : (
            <>
              {notifications?.map((notification, index) => (
                <div
                  className={`col-12 notification-card ${
                    !notification.read_at ? 'unread' : ''
                  }`}
                  key={notification.id}
                >
                  <div className="notification-content">
                    <p>{notification.data.body}</p>
                    <div
                      style={{ height: 26 }}
                      className=" d-flex justify-content-between flex-wrap"
                    >
                      <div className="date-and-time d-flex gap-3 gap-md-4">
                        <div>
                          Date: <p>{formatDate(notification.created_at)}</p>
                        </div>
                        <div>
                          Time:{' '}
                          <p>{formatDate(notification.created_at, 'HH:MM')}</p>
                        </div>
                      </div>
                      <div className="notification-status-button">
                        {!notification.read_at && (
                          <button
                            className={'notButton text-link'}
                            onClick={() => markAsRead(notification.id, index)}
                          >
                            Mark as Read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      {loadMore && (
        <div className="beechMein mt-4">
          <CustomButton
            className="secondaryBtn px-5"
            text="Load More"
            onClick={handleLoadMore}
          />
        </div>
      )}
    </>
  );
};

export default Notifications;
