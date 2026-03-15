import React, { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import {
  HiOutlineCheckCircle,
  HiOutlinePencilSquare,
  HiOutlineXCircle,
} from 'react-icons/hi2';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import withFilters from '../../../HOC/withFilters ';
import withModal from '../../../HOC/withModal';
import { usePageTitle } from '../../../Hooks/usePageTitle';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import CustomButton from '../../../Components/CustomButton';
import CustomModal from '../../../Components/CustomModal';
import { showToast } from '../../../Components/Toast/Toast';
import { useFetchTableData } from '../../../Hooks/useTable';
import {
  deletePackage,
  getPackageListing,
} from '../../../Services/Admin/Package';
import {
  subscriptionManagemenAdminHeaders,
  subscriptionManagementCustomHeaders,
} from '../../../Utils/Constants/TableHeaders';
import { formatDate, serialNum, showErrorToast } from '../../../Utils/Utils';

const SubscriptionManagement = ({
  showModal,
  closeModal,
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Subscription Management');
  const navigate = useNavigate();
  const location = useLocation();
  const [changeStatusModal, setChangeStatusModal] = useState(false);
  const [selectedObj, setSelectedObj] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  let queryClient = useQueryClient();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFilters((prevFilters) => ({
      ...prevFilters,
      type: tab, // Set filter type based on the selected tab
    }));
  };

  useEffect(() => {
    setFilters((prevFilters) => ({ ...prevFilters, type: 'general' }));
  }, [setFilters]);

  // Handle navigation state to switch tabs and refresh data
  useEffect(() => {
    if (location.state?.switchToCustomTab) {
      setActiveTab('custom');
      setFilters((prevFilters) => ({ ...prevFilters, type: 'custom' }));
      // Clear the state after using it
      navigate(location.pathname, { replace: true, state: {} });
    }
    if (location.state?.refreshData) {
      queryClient.invalidateQueries(['getPackageListing']);
    }
  }, [location.state, setFilters, navigate, queryClient]);

  //GET SUBSCRIPTIONS
  const {
    data: subscriptions,
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'getPackageListing',
    filters,
    updatePagination,
    getPackageListing
  );

  const subscriptionManagement = subscriptions?.data ?? [];

  if (isError) {
    showErrorToast(error);
  }
  const isStatusActive = (item) => {
    return item?.status?.toLowerCase() === 'active';
  };

  //confirm model
  const handleDelete = (item) => {
    setSelectedObj(item);
    setChangeStatusModal(true);
  };

  // Mutation for delete
  const deletePackageMutation = useMutation({
    mutationFn: (id) => deletePackage(id), // Call the API to delete the package
    onSuccess: () => {
      showToast('Package deleted successfully!', 'success'); // Show success message
      queryClient.invalidateQueries(['getPackageListing', filters]); // Refresh the data
      setChangeStatusModal(false); // Close the modal
    },
    onError: (error) => {
      showErrorToast(error); // Show error message
      setChangeStatusModal(false); // Close the modal on error
    },
  });

  return (
    <>
      <section>
        <div className="d-flex justify-content-between flex-wrap mb-3">
          <h2 className="screen-title mb-0">Subscription Management</h2>
          {activeTab === 'custom' ? (
            <Link to={'requests'}>
              <CustomButton text={'Requests'} />
            </Link>
          ) : (
            <Link to={'new'}>
              <CustomButton text={'New Subscription'} />
            </Link>
          )}
        </div>
        <div className="d-flex justify-content-center my-4">
          <div className="attachment-tabs mb-2">
            <button
              onClick={() => handleTabChange('general')}
              className={`secondaryButton tab-button ${
                activeTab === 'general' && 'active'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => handleTabChange('custom')}
              className={`secondaryButton tab-button ${
                activeTab === 'custom' && 'active'
              }`}
            >
              Custom
            </button>
          </div>
        </div>
        <Row>
          <Col xs={12}>
            <CustomTable
              filters={filters}
              setFilters={setFilters}
              headers={
                activeTab === 'general'
                  ? subscriptionManagemenAdminHeaders
                  : subscriptionManagementCustomHeaders
              }
              pagination={pagination}
              isLoading={isLoading}
              hasFilters={false}
            >
              {(subscriptionManagement?.length || isError) && (
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={subscriptionManagementCustomHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {subscriptionManagement?.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        {serialNum(
                          (filters?.page - 1) * filters?.per_page + index + 1
                        )}
                      </td>
                      <td>{item?.title}</td>
                      <td>{item?.no_of_users}</td>
                      {activeTab === 'custom' && <td>{item?.id}</td>}
                      <td>{item?.branches}</td>
                      <td>${item?.price_monthly}</td>
                      <td>${item?.price_yearly}</td>
                      <td>{formatDate(item?.updated_at)}</td>
                      <td>
                        <TableActionDropDown
                          actions={[
                            {
                              name: 'Edit',
                              icon: HiOutlinePencilSquare,
                              onClick: () =>
                                navigate(`${item.id}/edit`, {
                                  state: {
                                    activeTab,
                                  },
                                }),
                              className: 'edit',
                            },
                            {
                              name: isStatusActive(item)
                                ? 'Deactivate'
                                : 'Activate',
                              icon: isStatusActive(item)
                                ? HiOutlineXCircle
                                : HiOutlineCheckCircle,
                              onClick: () => handleDelete(item),
                              className: isStatusActive(item)
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
        </Row>
      </section>
      <CustomModal
        show={changeStatusModal}
        close={() => {
          setChangeStatusModal(false); // Close the modal on cancel
        }}
        action={() => {
          if (selectedObj) {
            deletePackageMutation.mutate(selectedObj.id); // Trigger delete mutation
          }
        }}
        title="Delete Package"
        description={`Are you sure you want to delete the package "${selectedObj?.title}"?`}
        disableClick={deletePackageMutation.isLoading} // Disable modal actions while loading
      />
    </>
  );
};

export default withModal(withFilters(SubscriptionManagement));
