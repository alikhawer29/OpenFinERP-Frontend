import React from 'react';
import { Navbar as BootstrapNavbar } from 'react-bootstrap';
import { GoBell } from 'react-icons/go';
import { HiMenu } from 'react-icons/hi';
import Skeleton from 'react-loading-skeleton';

const StaticNavbar = ({ sideBarToggle, sideBarClass }) => {
  return (
    <BootstrapNavbar className={`customHeader ${sideBarClass}`} expand="md">
      <div className="d-flex gap-2 gap-sm-3">
        <div
          className={`toggleSidebarButton beechMein ${sideBarClass}`}
          onClick={sideBarToggle}
        >
          <HiMenu size={26} />
        </div>
        <Skeleton width={200} height={24} />
      </div>

      <div className="d-flex gap-2 gap-sm-3 align-items-center">
        <GoBell className="notification-bell-icon" size={28} />
        <div className="userImage beechMein" />
      </div>
    </BootstrapNavbar>
  );
};

export default StaticNavbar;
