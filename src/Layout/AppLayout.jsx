import React, { useEffect, useState, Suspense } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import InnerPageLoader from '../Components/SkeletonLoader/InnerPageLoader';
import Navbar from '../Components/Navbar/Navbar.jsx';
import Sidebar from '../Components/Sidebar/Sidebar.jsx';
import './appLayout.css';

const AppLayout = ({ disableSidebar = false, redirectPath = null }) => {
  const [sideBarClass, setSideBarClass] = useState(
    window.innerWidth < 991 ? 'collapsed' : ''
  );
  const navigate = useNavigate();
  const [isSidebarHovering, setIsSidebarHovering] = useState(false);

  function sideBarToggle() {
    setSideBarClass((prevClass) => (prevClass === '' ? 'collapsed' : ''));
  }

  const handleResize = () => {
    if (window.innerWidth < 767) {
      setSideBarClass('collapsed');
    }
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (redirectPath) {
      return navigate(redirectPath);
    }
  }, [redirectPath]);

  const effectiveSideBarClass =
    sideBarClass === 'collapsed' && isSidebarHovering ? '' : sideBarClass;

  return (
    <div>
      <Navbar sideBarToggle={sideBarToggle} sideBarClass={effectiveSideBarClass} />
      <div className="">
        <Sidebar
          sideBarToggle={sideBarToggle}
          sideBarClass={sideBarClass}
          onHoverChange={setIsSidebarHovering}
          disable={disableSidebar}
        />
        <div
          className={`screensSectionContainer ${effectiveSideBarClass ? 'expanded' : ''
            }`}
        >
          <div className="appContainer">
            <Suspense fallback={<InnerPageLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
