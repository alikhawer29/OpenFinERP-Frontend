import React from 'react';
import { Col, Row } from 'react-bootstrap';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import StatusChip from '../../../Components/StatusChip/StatusChip';
import withFilters from '../../../HOC/withFilters ';
import withModal from '../../../HOC/withModal';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';
import { getSubscriptionLogListing } from '../../../Services/Admin/Subscription';
import {
  generalStatusFiltersConfig,
  statusFiltersConfig,
} from '../../../Utils/Constants/TableFilter';
import { adminSubscriptionLogsHeaders } from '../../../Utils/Constants/TableHeaders';
import {
  downloadFile,
  downloadFileWithId,
  formatDate,
  serialNum,
  showErrorToast,
} from '../../../Utils/Utils';
import CustomButton from '../../../Components/CustomButton';

const AdminSubscriptionLogs = ({
  filters,
  setFilters,
  pagination,
  updatePagination,
  businessId,
}) => {
  usePageTitle('Subscription Logs');

  //GET SUBSCRIPTIONS LOGS
  const {
    data: fetchSubscriptionLogs, // Renamed to avoid confusion with the derived `userManagement`
    isLoading,
    isError,
    error,
    refetch,
  } = useFetchTableData(
    'getSubscriptionLogListing',
    //add business id to filters if it exists
    businessId ? { ...filters, user_id: businessId } : filters,
    updatePagination,
    getSubscriptionLogListing
  );

  // Provide a default value for `userManagement`
  const subscriptionLogs = fetchSubscriptionLogs?.data ?? [];

  if (isError) {
    showErrorToast(error);
  }

  return (
    <>
      <section>
        <div className="d-flex justify-content-between flex-wrap mb-3">
          <h2 className="screen-title mb-0">Subscription Logs</h2>

          {businessId && (
            <div className="d-flex gap-2">
              <CustomButton
                text={'Export To PDF'}
                onClick={() =>
                  downloadFileWithId('subscription', 'pdf', businessId, 'admin')
                }
              />
              <CustomButton
                text={'Export To Excel'}
                onClick={() =>
                  downloadFileWithId(
                    'subscription',
                    'xlsx',
                    businessId,
                    'admin'
                  )
                }
              />
            </div>
          )}

          {!businessId && (
            <div className="d-flex gap-2">
              <CustomButton
                text={'Export To PDF'}
                onClick={() =>
                  downloadFileWithId('subscription', 'pdf', 'admin')
                }
              />
              <CustomButton
                text={'Export To Excel'}
                onClick={() =>
                  downloadFileWithId('subscription', 'xlsx', 'admin')
                }
              />
            </div>
          )}
        </div>
        <Row>
          <Col xs={12}>
            <CustomTable
              filters={filters}
              setFilters={setFilters}
              headers={adminSubscriptionLogsHeaders}
              pagination={pagination}
              isLoading={isLoading}
              selectOptions={[
                {
                  title: 'status',
                  options: generalStatusFiltersConfig,
                },
              ]}
              dateFilters={[
                {
                  title: 'Subscription Date',
                  from: 'from',
                  to: 'to',
                  label: 'Subscription Date',
                },
              ]}
            >
              {(subscriptionLogs?.length || isError) && (
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={adminSubscriptionLogsHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {subscriptionLogs?.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        {serialNum(
                          (filters?.page - 1) * filters?.per_page + index + 1
                        )}
                      </td>
                      <td>{item?.owner?.business_name}</td>
                      <td>{item?.package?.title}</td>
                      <td>{item?.package?.branches}</td>
                      <td>{item?.package?.no_of_users}</td>
                      <td>{item?.subscription_amount}</td>
                      <td>{item?.type}</td>
                      <td>{formatDate(item?.created_at)}</td>
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
      </section>
    </>
  );
};

export default withModal(withFilters(AdminSubscriptionLogs));
