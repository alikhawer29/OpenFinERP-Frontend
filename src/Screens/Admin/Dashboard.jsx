import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { HiOutlineEye } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import User from '../../assets/images/dash-user.svg?react';
import Receivable from '../../assets/images/receivable.svg?react';
import CustomButton from '../../Components/CustomButton';
import CustomSelect from '../../Components/CustomSelect';
import CustomTable from '../../Components/CustomTable/CustomTable';
import { showToast } from '../../Components/Toast/Toast';
import HorizontalTabs from '../../Components/HorizontalTabs/HorizontalTabs';
import StatusChip from '../../Components/StatusChip/StatusChip';
import TableActionDropDown from '../../Components/TableActionDropDown/TableActionDropDown';
import withModal from '../../HOC/withModal';
import { usePageTitle } from '../../Hooks/usePageTitle';
import { lineGraphOptions } from '../../Mocks/MockData';
import {
  getDashboardData,
  getEarningChart,
  getPendingRequests,
  getUpcomingSubscriptionRenewal,
  getUserChart,
  sendReminder,
} from '../../Services/Admin/Dashboard';
import useThemeStore from '../../Stores/ThemeStore';
import { themeDictionary } from '../../Utils/Constants/ColorConstants';
import { dateRangeSelectOptions } from '../../Utils/Constants/SelectOptions';
import { showErrorToast } from '../../Utils/Utils';
import {
  customSubscriptionRequestHeaders,
  supportLogsAdminHeaders,
  unlockRequestAdminHeaders,
  upcomingSubscriptionRenewalHeaders,
} from '../../Utils/Constants/TableHeaders';
import { formatDate } from '../../Utils/Utils';

ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler
);

const Dashboard = ({ showModal, closeModal }) => {
  usePageTitle('Dashboard');
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  let queryClient = useQueryClient();

  const [userChartType, setUserChartType] = useState('yearly');
  const [earningChartType, setEarningChartType] = useState('yearly');
  const [linegraphStyling, setLineGraphStyling] = useState({});
  const [selectedPendingTab, setSelectedPendingTab] = useState(
    'custom_subscription'
  );
  useEffect(() => {
    const graphStyling = {
      borderColor: '',
      pointBorderColor: '',
      backgroundColor: '',
    };
    graphStyling.borderColor = themeDictionary[theme][0];
    graphStyling.pointBorderColor = themeDictionary[theme][1];
    graphStyling.backgroundColor = `${themeDictionary[theme][0]}55`;
    setLineGraphStyling(graphStyling);
  }, [theme]);

  const handleDateRangeSelect = (graph, v) => {
    if (graph === 'totalUsers') setUserChartType(v.target.value);
    if (graph === 'totalEarning') setEarningChartType(v.target.value);
  };

  // Get Dashboard Card Data
  const { data: cardData, isLoading: cardDataLoading } = useQuery({
    queryKey: ['cardData', 'card'],
    queryFn: getDashboardData,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Get Charts Data based on selected type
  const { data: userChart } = useQuery({
    queryKey: ['userChart', userChartType],
    queryFn: () => getUserChart(userChartType),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const { data: earningChart } = useQuery({
    queryKey: ['earningChart', earningChartType],
    queryFn: () => getEarningChart(earningChartType),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Get Pending Requests based on selected tab
  const {
    data: pendingRequests,
    isLoading: pendingRequestsLoading,
    isError: pendingRequestsIsError,
    error: pendingRequestsError,
  } = useQuery({
    queryKey: ['pendingRequests', selectedPendingTab],
    queryFn: () => getPendingRequests(selectedPendingTab),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Get Upcoming Subscription Renewal
  const {
    data: upcomingSubscriptionRenewal,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['upcomingSubscriptionRenewal'],
    queryFn: getUpcomingSubscriptionRenewal,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Tab configuration for pending requests
  const pendingRequestTabs = [
    { label: 'Custom Subscription', value: 'custom_subscription' },
    { label: 'Support', value: 'support' },
    { label: 'Unlock Accounting Period', value: 'unlock_accounting_period' },
  ];

  // Helper function to get renewal status chip
  const getRenewalStatusChip = (status) => {
    const statusMap = {
      'Pending Renewal': 'warning',
      'Auto-Renew Enabled': 'success',
      'Grace Period': 'warning',
      Expired: 'danger',
    };
    return <StatusChip status={status} className={statusMap[status]} />;
  };

  const sendReminderMutation = useMutation({
    mutationFn: sendReminder,
    onSuccess: () => {
      closeModal(); // Close the modal first
      showToast('Reminder sent successfully!', 'success');
      queryClient.invalidateQueries(['upcomingSubscriptionRenewal']);
    },
    onError: (error) => {
      closeModal(); // Close the modal on error too
      showErrorToast(error);
    },
  });

  const sendReminderFunction = (item) => {
    showModal(
      'Send Reminder',
      'Are you sure you want to send reminder?',
      () => {
        sendReminderMutation.mutate(item.id);
      }
    );
  };

  // Reusable Chart Component
  const renderChart = (title, chartData, chartType, handleChange) => {
    return (
      <div className="d-card chart-padding mt-3">
        <div className="d-flex justify-content-between mb-3">
          <h4 className="d-card-title">{title}</h4>
          <CustomSelect
            name="Monthly"
            options={dateRangeSelectOptions}
            firstIsLabel={false}
            className="gray"
            onChange={(e) => handleChange(chartType, e)}
            value={userChartType}
          />
        </div>
        <div style={{ height: 600 }} className="dashboardChart">
          <Line
            data={{
              labels: chartData?.map((item) => item[0]),
              datasets: [
                {
                  data: chartData?.map((item) => item[1]),
                  borderRadius: 50,
                  tension: 0.4,
                  pointRadius: 0,
                  pointHoverRadius: 6,
                  pointBorderWidth: 5,
                  pointHoverBorderWidth: 5,
                  pointBackgroundColor: '#fff',
                  borderWidth: 2,
                  fill: { target: 'origin' },
                  ...linegraphStyling,
                },
              ],
            }}
            options={lineGraphOptions}
          />
        </div>
      </div>
    );
  };

  return (
    <div>
      <h2 className="screen-title d-inline-block">Dashboard</h2>
      <div className="row">
        <div className="col-12 col-sm-6 col-xxl-3 mb-4 mb-xxl-0">
          <div className="d-card chart-padding">
            <div className="d-flex gap-3 gap-md-3">
              <div className="dash-icon-wrapper">
                <User className="dash-icon user" />
              </div>
              <div className="glance-info-text">
                <h6>New Users</h6>
                <h4>{cardData?.users}</h4>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xxl-3 mb-4 mb-xxl-0">
          <div className="d-card chart-padding">
            <div className="d-flex gap-3 gap-md-3">
              <div className="dash-icon-wrapper">
                <Receivable className="dash-icon" />
              </div>
              <div className="glance-info-text">
                <h6>Total Earnings</h6>
                <h4>${cardData?.earnings}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      {renderChart(
        'Total Users',
        userChart,
        'totalUsers',
        handleDateRangeSelect
      )}
      {renderChart(
        'Total Earnings',
        earningChart,
        'totalEarning',
        handleDateRangeSelect
      )}

      {/* Upcoming Subscription Renewal Table */}
      <div className="row mt-0 mt-xxl-4">
        <div className="col-12 col-lg-12 mb-4">
          <div className="d-card chart-padding">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0" style={{ color: themeDictionary[theme][0] }}>
                Upcoming Subscription Renewal
              </h5>
            </div>
            <div className="table-responsive">
              <CustomTable
                hasFilters={false}
                isPaginated={false}
                hideSearch={true}
                hideItemsPerPage={true}
                headers={upcomingSubscriptionRenewalHeaders}
                isLoading={isLoading}
                showFilterBorders={false}
              >
                {(upcomingSubscriptionRenewal?.length || isError) && (
                  <tbody>
                    {isError && (
                      <tr>
                        <td colSpan={upcomingSubscriptionRenewalHeaders.length}>
                          <p className="text-danger mb-0">
                            Unable to fetch data at this time
                          </p>
                        </td>
                      </tr>
                    )}
                    {upcomingSubscriptionRenewal?.map((item, index) => (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>{item?.business_name}</td>
                        <td>{item?.subscription_name}</td>
                        <td>{item?.subscription_date}</td>
                        <td>{item?.renewal_date}</td>
                        <td>{item?.remaining_days}</td>
                        <td>{getRenewalStatusChip(item?.renewal_status)}</td>
                        <td>{item?.last_emailed_on}</td>
                        <td>
                          {item?.renewal_status !== 'Auto-Renew Enabled' && (
                            <CustomButton
                              text={'Send Reminder'}
                              onClick={() =>
                                sendReminderFunction(item, 'send_reminder')
                              }
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </CustomTable>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-0 mt-xxl-4">
        {/* Pending Requests Section with Tabs */}
        <div className="col-12 col-lg-12 mb-4">
          <div className="d-card chart-padding">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0" style={{ color: themeDictionary[theme][0] }}>
                Pending Requests
              </h5>
            </div>

            {/* Tabs */}
            <div className="beechMein mb-4">
              <HorizontalTabs
                tabs={pendingRequestTabs}
                activeTab={selectedPendingTab}
                onTabChange={setSelectedPendingTab}
              />
            </div>

            {/* Custom Subscription Tab */}
            {selectedPendingTab === 'custom_subscription' && (
              <div className="table-responsive">
                <CustomTable
                  hasFilters={false}
                  isPaginated={false}
                  hideSearch={true}
                  hideItemsPerPage={true}
                  headers={customSubscriptionRequestHeaders}
                  isLoading={isLoading}
                  showFilterBorders={false}
                >
                  {(pendingRequests?.length || isError) && (
                    <tbody>
                      {isError && (
                        <tr>
                          <td colSpan={customSubscriptionRequestHeaders.length}>
                            <p className="text-danger mb-0">
                              Unable to fetch data at this time
                            </p>
                          </td>
                        </tr>
                      )}
                      {pendingRequests?.map((item, index) => (
                        <tr key={item.id}>
                          <td>{index + 1}</td>
                          <td>{item?.business_name}</td>
                          <td>{item?.email}</td>
                          <td>{item?.expected_users}</td>
                          <td>{item?.expected_branches}</td>
                          <td>
                            <TableActionDropDown
                              actions={[
                                {
                                  name: 'View',
                                  icon: HiOutlineEye,
                                  onClick: () =>
                                    navigate(
                                      `/admin/subscription-management/requests/${item.id}`
                                    ),
                                  className: 'view',
                                },
                              ]}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  )}
                </CustomTable>
              </div>
            )}

            {/* Support Tab */}
            {selectedPendingTab === 'support' && (
              <div className="table-responsive">
                <CustomTable
                  hasFilters={false}
                  isPaginated={false}
                  hideSearch={true}
                  hideItemsPerPage={true}
                  headers={supportLogsAdminHeaders}
                  isLoading={isLoading}
                  showFilterBorders={false}
                >
                  {(pendingRequests?.length || isError) && (
                    <tbody>
                      {isError && (
                        <tr>
                          <td colSpan={supportLogsAdminHeaders.length}>
                            <p className="text-danger mb-0">
                              Unable to fetch data at this time
                            </p>
                          </td>
                        </tr>
                      )}
                      {pendingRequests?.map((item, index) => (
                        <tr
                          key={item.id}
                          className={
                            item?.highlight === true ? 'pending-red' : ''
                          }
                        >
                          <td>{index + 1}</td>
                          <td>{item?.name}</td>
                          <td>{item?.email}</td>
                          <td>{item?.support_type_name}</td>
                          <td>{formatDate(item?.created_at)}</td>
                          <td>
                            <TableActionDropDown
                              actions={[
                                {
                                  name: 'View',
                                  icon: HiOutlineEye,
                                  onClick: () =>
                                    navigate(`/admin/support-logs/${item.id}`),
                                  className: 'view',
                                },
                              ]}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  )}
                </CustomTable>
              </div>
            )}

            {/* Unlock Accounting Period Tab */}
            {selectedPendingTab === 'unlock_accounting_period' && (
              <div className="table-responsive">
                <CustomTable
                  hasFilters={false}
                  isPaginated={false}
                  hideSearch={true}
                  hideItemsPerPage={true}
                  headers={unlockRequestAdminHeaders}
                  isLoading={isLoading}
                  showFilterBorders={false}
                >
                  {(pendingRequests?.length || isError) && (
                    <tbody>
                      {isError && (
                        <tr>
                          <td colSpan={unlockRequestAdminHeaders.length}>
                            <p className="text-danger mb-0">
                              Unable to fetch data at this time
                            </p>
                          </td>
                        </tr>
                      )}
                      {pendingRequests?.map((item, index) => (
                        <tr
                          key={item.id}
                          className={
                            item?.highlight === true ? 'pending-red' : ''
                          }
                        >
                          {' '}
                          <td>
                            {formatDate(item?.created_at, 'DD/MM/YYYY - HH:MM')}
                          </td>
                          <td>{item?.requestor_name}</td>
                          <td>
                            {formatDate(
                              item?.reviewed_at,
                              'DD/MM/YYYY - HH:MM'
                            )}
                          </td>
                          <td>
                            <TableActionDropDown
                              actions={[
                                {
                                  name: 'View',
                                  icon: HiOutlineEye,
                                  onClick: () =>
                                    navigate(
                                      `/admin/unlock-req-management/${item.id}`
                                    ),
                                  className: 'view',
                                },
                              ]}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  )}
                </CustomTable>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default withModal(Dashboard);
