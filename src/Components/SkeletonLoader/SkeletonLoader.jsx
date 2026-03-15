import React, { useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import StaticNavbar from './StaticNavbar';
import StaticSidebar from './StaticSidebar';

const SkeletonLoader = () => {
  const [sideBarClass, setSideBarClass] = useState(
    window.innerWidth < 991 ? 'collapsed' : ''
  );

  const sideBarToggle = () => {
    setSideBarClass((prevClass) => (prevClass === '' ? 'collapsed' : ''));
  };

  return (
    <div>
      <StaticNavbar sideBarToggle={sideBarToggle} sideBarClass={sideBarClass} />
      <div>
        <StaticSidebar sideBarClass={sideBarClass} />
        <div
          className={`screensSectionContainer ${
            sideBarClass ? 'expanded' : ''
          }`}
        >
          <div className="appContainer">
            <div className="d-flex justify-content-between align-items-center mb-5">
              <Skeleton width={200} height={32} />
              <Skeleton width={80} height={32} borderRadius={8} />
            </div>
            <div className="d-flex flex-column gap-3">
              <Skeleton height={38} width={'100%'} />
              <Skeleton height={38} width={'90%'} />
              <Skeleton height={38} width={'80%'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;
