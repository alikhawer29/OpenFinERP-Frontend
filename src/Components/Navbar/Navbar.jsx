import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Navbar as BootstrapNavbar, Dropdown } from 'react-bootstrap';
import { GoBell } from 'react-icons/go';
import { HiMenu, HiOutlineColorSwatch } from 'react-icons/hi';
import { LuLogOut } from 'react-icons/lu';
import { RiUserSettingsLine } from 'react-icons/ri';
import { Link, useNavigate } from 'react-router-dom';
import { useLogout } from '../../Hooks/useLogout';
import {
  editNotification,
  getNotifications,
} from '../../Services/Admin/Notifications';
import useUserStore from '../../Stores/UserStore';
import { calculateTimePassed } from '../../Utils/Utils';
import CustomButton from '../CustomButton';
import CustomModal from '../CustomModal';
import TableActionDropDown from '../TableActionDropDown/TableActionDropDown';
import './navbar.css';

const Navbar = ({ sideBarToggle, sideBarClass }) => {
  let navigate = useNavigate();
  const { user, role } = useUserStore();
  const logoutMutation = useLogout();
  const branch_name = user?.branch_name;
  const [logoutModal, setLogoutModal] = useState(false);
  const queryClient = useQueryClient();
  const [params, setParams] = useState({ unread_only: 1 });

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
    retry: 1,
    enabled: role === 'admin',
  });

  const notificationState = notificationsData?.notifications?.data ?? [];

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

  const getInitials = (name = '') => {
    return name
      ?.split(' ')
      ?.map((word) => word?.[0]?.toUpperCase())
      ?.join('');
  };
  const handleLogoutClick = () => {
    setLogoutModal(true);
  };

  const logoutAdmin = () => {
    logoutMutation.mutate(role);
  };

  const markAsRead = (id) => {
    editNotificationMutation.mutate(id);
  };

  return (
    <>
      <BootstrapNavbar className={`customHeader ${sideBarClass}`} expand="md">
        <div className="d-flex gap-2 gap-sm-3">
          <div
            className={`toggleSidebarButton beechMein ${sideBarClass}`}
            onClick={sideBarToggle}
          >
            <HiMenu size={26} />
          </div>
          <h4 className="screen-title-body header-branch-name mb-0">
            {branch_name}
          </h4>
        </div>

        <div className="d-flex gap-2 gap-sm-3">
          {role !== 'admin' && (
            <CustomButton onClick={() => navigate('support')}>
              Support
            </CustomButton>
          )}

          <Dropdown className="notiDropdown d-flex ">
            <Dropdown.Toggle
              variant="transparent"
              className="position-relative notButton  p-0"
            >
              <GoBell className="notification-bell-icon" size={28} />
              <span className="badge">
                {notificationState.length > 9 ? '9+' : notificationState.length}
              </span>
            </Dropdown.Toggle>
            <Dropdown.Menu className={`notiMenu`} align="end">
              <div className="notificationsBody">
                <div className="notificationsBodyHeader py-2">
                  <p className="mb-0 fw-medium">Notifications</p>
                  <div className="newNotificationCount">
                    <p>{notificationState.length} new</p>
                  </div>
                </div>
                <hr className="my-0" />
                {notificationState?.map((notification, index) => (
                  <div
                    className={`singleNoti gap-2 ${
                      notification.read_at ? 'read' : 'unread'
                    }`}
                    key={notification.id}
                  >
                    <div className="notificationBell">
                      <GoBell size={18} />
                    </div>
                    <div className="singleNotiContent flex-grow-1 d-flex flex-column justify-content-between gap-2">
                      <p className="notiTitle">{notification.data.body}</p>
                      <div className="d-flex align-items-end justify-content-between">
                        <div className="d-flex flex-wrap gap-0 gap-sm-2">
                          <p className="notiDateTime d-flex gap-2">
                            {calculateTimePassed(notification.created_at)}
                          </p>
                        </div>
                        {!notification.read_at && (
                          <button
                            className={`notification-btn flex-shrink-0${
                              notification.read ? 'read-btn' : ' unread-btn'
                            }`}
                            onClick={() => markAsRead(notification?.id)}
                          >
                            Mark As Read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="notiFooter">
                <Dropdown.Toggle
                  variant="transparent"
                  className="notButton notifi-btn p-0"
                >
                  <Link to={'/notifications'}>View All</Link>
                </Dropdown.Toggle>
              </div>
            </Dropdown.Menu>
          </Dropdown>

          {/* <CustomButton onClick={() => toggleTheme()}>
            Toggle Theme
          </CustomButton> */}
          <TableActionDropDown
            actions={[
              {
                name: 'My Profile',
                icon: RiUserSettingsLine,
                onClick: () => {
                  if (user?.role === 'admin') {
                    navigate('/admin/profile');
                  } else {
                    navigate('/profile');
                  }
                },
              },
              {
                name: 'Themes',
                icon: HiOutlineColorSwatch,
                onClick: () => navigate('/preferences'),
              },
              // {
              //   name: 'Subscription Logs',
              //   icon: HiOutlineCalendarDays,
              //   onClick: () => navigate('/subscription-logs'),
              // },
              // {
              //   name: 'Payment Logs',
              //   icon: BsCashCoin,
              // },
              {
                name: 'Logout',
                icon: LuLogOut,
                onClick: handleLogoutClick,
              },
            ]}
          >
            <div className="userImage beechMein">
              <h6>{getInitials(user?.user_name)}</h6>
            </div>
          </TableActionDropDown>
        </div>
      </BootstrapNavbar>
      <CustomModal
        show={logoutModal}
        close={() => {
          setLogoutModal(false);
        }}
        disableClick={logoutMutation.isPending}
        action={logoutAdmin}
        title="Logout?"
        description="Are you sure you want to logout?"
      />
    </>
  );
};

export default Navbar;
