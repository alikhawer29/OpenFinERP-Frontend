import { useQuery } from '@tanstack/react-query';
import { usePageTitle } from '../../Hooks/usePageTitle';
import { getDashboardData } from '../../Services/Dashboard';
import useThemeStore from '../../Stores/ThemeStore';
import { themeDictionary } from '../../Utils/Constants/ColorConstants';
import { showErrorToast } from '../../Utils/Utils';
import './style.css';

const Dashboard = () => {
  usePageTitle('Dashboard');

  const { theme } = useThemeStore();

  // Queries and Mutations
  const {
    data: dashboardData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['getDashboardData'],
    queryFn: () => getDashboardData(),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Get theme colors
  const themeColors = themeDictionary[theme] || themeDictionary.default;

  // CSS variables for dynamic theming
  const dashboardStyle = {
    '--primary-color': themeColors[0],
    '--secondary-color': themeColors[1],
    '--accent-color': themeColors[2],
    '--highlight-color': themeColors[3],
    '--table-header-bg': `${themeColors[0]}15`,
    '--table-border-color': `${themeColors[0]}30`,
    '--card-shadow': `0 2px 8px ${themeColors[0]}10`,
  };

  if (isError) {
    showErrorToast(error);
  }

  // Helper function to render table rows with loading, error, and empty states
  const renderTableContent = (data, columns, key) => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={columns}>
            <div className="text-center py-3">
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <span className="ms-2">Loading {key}...</span>
            </div>
          </td>
        </tr>
      );
    }

    if (isError) {
      return (
        <tr>
          <td colSpan={columns}>
            <p className="text-danger mb-0 text-center py-3">
              Unable to fetch {key} at this time
            </p>
          </td>
        </tr>
      );
    }

    if (!data || data.length === 0) {
      return (
        <tr>
          <td colSpan={columns}>
            <p className="text-muted mb-0 text-center py-3">
              No {key} records found
            </p>
          </td>
        </tr>
      );
    }

    return null;
  };

  return (
    <div style={dashboardStyle}>
      <h2
        className="screen-title d-inline-block"
        style={{ color: themeColors[0] }}
      >
        Dashboard
      </h2>

      {isLoading && (
        <div className="text-center py-5">
          <div
            className="spinner-border"
            style={{ color: themeColors[0] }}
            role="status"
          >
            <span className="visually-hidden">Loading dashboard...</span>
          </div>
          <p className="mt-2">Loading dashboard data...</p>
        </div>
      )}

      {isError && (
        <div className="alert alert-danger text-center">
          <h5>Unable to load dashboard</h5>
          <p className="mb-0">Please try refreshing the page</p>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="row mt-0 mt-xxl-4">
          {/* Commitment Summary - Full Width */}
          <div className="col-12 mb-4">
            <div className="dashboard-card chart-padding">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0" style={{ color: themeColors[0] }}>
                  Commitment Summary
                </h5>
              </div>
              <div className="table-responsive">
                <table className="table table-bordered table-hover dashboard-table">
                  <thead className="dashboard-table-header">
                    <tr>
                      <th>Currency</th>
                      <th>Commitment</th>
                      <th>Cash Balance</th>
                      <th>Bank Balance</th>
                      <th>Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderTableContent(
                      dashboardData?.commitment_summary,
                      5,
                      'commitment summary'
                    )}
                    {dashboardData?.commitment_summary?.map((item, index) => (
                      <tr key={index++}>
                        <td>{item.currency}</td>
                        <td className="text-end">{item.commitment}</td>
                        <td className="text-end">{item.cash_balance}</td>
                        <td className="text-end">{item.bank_balance}</td>
                        <td className="text-end">{item.difference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Cash Balance */}
          <div className="col-12 col-lg-6 mb-4">
            <div className="dashboard-card chart-padding">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0" style={{ color: themeColors[0] }}>
                  Cash Balance
                </h5>
              </div>
              <div className="table-responsive">
                <table className="table table-bordered table-hover dashboard-table">
                  <thead className="dashboard-table-header">
                    <tr>
                      <th>Account</th>
                      <th>Currency</th>
                      <th>FC Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderTableContent(
                      dashboardData?.cash_balance,
                      3,
                      'cash balance'
                    )}
                    {dashboardData?.cash_balance?.map((item, index) => (
                      <tr key={index++}>
                        <td>{item.account}</td>
                        <td>{item.currency}</td>
                        <td className="text-end">{item.fc_amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bank Balance */}
          <div className="col-12 col-lg-6 mb-4">
            <div className="dashboard-card chart-padding">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0" style={{ color: themeColors[0] }}>
                  Bank Balance
                </h5>
              </div>
              <div className="table-responsive">
                <table className="table table-bordered table-hover dashboard-table">
                  <thead className="dashboard-table-header">
                    <tr>
                      <th>Account</th>
                      <th>Currency</th>
                      <th>FC Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderTableContent(
                      dashboardData?.bank_balance,
                      3,
                      'bank balance'
                    )}
                    {dashboardData?.bank_balance?.map((item, index) => (
                      <tr key={index++}>
                        <td>{item.account}</td>
                        <td>{item.currency}</td>
                        <td className="text-end">{item.fc_amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pending Inward Payment */}
          <div className="col-12 col-lg-6 mb-4">
            <div className="dashboard-card chart-padding">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0" style={{ color: themeColors[0] }}>
                  Pending Inward Payment
                </h5>
              </div>
              <div className="table-responsive">
                <table className="table table-bordered table-hover dashboard-table">
                  <thead className="dashboard-table-header">
                    <tr>
                      <th>Currency</th>
                      <th>FC Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderTableContent(
                      dashboardData?.pending_inward_payment,
                      2,
                      'pending inward payments'
                    )}
                    {dashboardData?.pending_inward_payment?.map(
                      (item, index) => (
                        <tr key={index++}>
                          <td>{item.currency}</td>
                          <td className="text-end">{item.fc_amount}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pending Outward Payment */}
          <div className="col-12 col-lg-6 mb-4">
            <div className="dashboard-card chart-padding">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0" style={{ color: themeColors[0] }}>
                  Pending Outward Payment
                </h5>
              </div>
              <div className="table-responsive">
                <table className="table table-bordered table-hover dashboard-table">
                  <thead className="dashboard-table-header">
                    <tr>
                      <th>Currency</th>
                      <th>FC Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderTableContent(
                      dashboardData?.pending_outward_payment,
                      2,
                      'pending outward payments'
                    )}
                    {dashboardData?.pending_outward_payment?.map(
                      (item, index) => (
                        <tr key={index++}>
                          <td>{item.currency}</td>
                          <td className="text-end">{item.fc_amount}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Outstanding Balance */}
          <div className="col-12 col-lg-6 mb-4">
            <div className="dashboard-card chart-padding">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0" style={{ color: themeColors[0] }}>
                  Outstanding Balance
                </h5>
              </div>
              <div className="table-responsive">
                <table className="table table-bordered table-hover dashboard-table">
                  <thead className="dashboard-table-header">
                    <tr>
                      <th>Account</th>
                      <th>Currency</th>
                      <th>FC Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderTableContent(
                      dashboardData?.outstanding_balance,
                      3,
                      'outstanding balance'
                    )}
                    {dashboardData?.outstanding_balance?.map((item, index) => (
                      <tr key={index++}>
                        <td>{item.account}</td>
                        <td>{item.currency}</td>
                        <td className="text-end">{item.fc_amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Classification-wise Outstanding Balance */}
          <div className="col-12 col-lg-6 mb-4">
            <div className="dashboard-card chart-padding">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0" style={{ color: themeColors[0] }}>
                  Classification-wise Outstanding Balance
                </h5>
              </div>
              <div className="table-responsive">
                <table className="table table-bordered table-hover dashboard-table">
                  <thead className="dashboard-table-header">
                    <tr>
                      <th>Classification</th>
                      <th>Currency</th>
                      <th>FC Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderTableContent(
                      dashboardData?.classification_wise_outstanding_balance,
                      3,
                      'classification-wise outstanding balance'
                    )}
                    {dashboardData?.classification_wise_outstanding_balance?.map(
                      (item, index) => (
                        <tr key={index++}>
                          <td>{item.classification}</td>
                          <td>{item.currency}</td>
                          <td className="text-end">{item.fc_amount}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Maturity Alert */}
          <div className="col-12 col-lg-6 mb-4">
            <div className="dashboard-card chart-padding">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0" style={{ color: themeColors[0] }}>
                  Maturity Alert
                </h5>
              </div>
              <div className="table-responsive">
                <table className="table table-bordered table-hover dashboard-table">
                  <thead className="dashboard-table-header">
                    <tr>
                      <th>Type</th>
                      <th>Currency</th>
                      <th>FC Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderTableContent(
                      dashboardData?.maturity_alert,
                      3,
                      'maturity alerts'
                    )}
                    {dashboardData?.maturity_alert?.map((item, index) => (
                      <tr key={index++}>
                        <td>{item.type}</td>
                        <td>{item.currency}</td>
                        <td className="text-end">{item.fc_amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
