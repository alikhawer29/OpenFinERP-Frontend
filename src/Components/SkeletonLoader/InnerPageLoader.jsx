import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

/**
 * InnerPageLoader - A skeleton loader for page content only.
 * Does NOT include Sidebar or Navbar because it's used inside the AppLayout.
 */
const InnerPageLoader = () => {
    return (
        <div className="appContainer">
            <div className="d-flex justify-content-between align-items-center mb-5">
                <Skeleton width={200} height={32} />
                <Skeleton width={80} height={32} borderRadius={8} />
            </div>
            <div className="d-flex flex-column gap-3">
                <Skeleton height={38} width={'100%'} />
                <Skeleton height={38} width={'90%'} />
                <Skeleton height={38} width={'80%'} />
                <Skeleton height={150} width={'100%'} className="mt-4" />
                <div className="d-flex gap-3 mt-4">
                    <Skeleton height={100} width={'31%'} />
                    <Skeleton height={100} width={'31%'} />
                    <Skeleton height={100} width={'31%'} />
                </div>
            </div>
        </div>
    );
};

export default InnerPageLoader;
