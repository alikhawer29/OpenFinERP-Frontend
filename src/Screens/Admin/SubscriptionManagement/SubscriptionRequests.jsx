import React from 'react';
import BackButton from '../../../Components/BackButton';
import { Col, Row } from 'react-bootstrap';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import { subscriptionRequestHeaders } from '../../../Utils/Constants/TableHeaders';
import { useNavigate } from 'react-router-dom';
import { subscriptionRequestsData } from '../../../Mocks/MockData';
import { statusClassMap } from '../../../Utils/Constants/SelectOptions';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { HiOutlineEye } from 'react-icons/hi2';
import withFilters from '../../../HOC/withFilters ';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';
import { getPackageListing } from '../../../Services/Admin/Package';
import { serialNum } from '../../../Utils/Utils';
import StatusChip from '../../../Components/StatusChip/StatusChip';

const SubscriptionRequests = ({
  pagination,
  updatePagination,
  filters,
  setFilters,
}) => {
  usePageTitle('Subscription Requests');
  const navigate = useNavigate();
  const updatedFilters = { ...filters, type: 'request' };

  //GET SUBSCRIPTIONS REQUEST
  const {
    data: subscriptions,
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'getPackageListing',
    updatedFilters,
    updatePagination,
    getPackageListing
  );

  const subscriptionRequests = subscriptions?.data ?? [];

  if (isError) {
    showErrorToast(error);
  }
  return (
    <>
      <div className="d-flex align-items-start mb-4 justify-content-between flex-wrap">
        <div className="d-flex flex-column gap-2">
          <BackButton />
          <h2 className="screen-title m-0 d-inline">
            Request For Custom Subscription
          </h2>
        </div>
      </div>
      <Row>
        <Col xs={12}>
          <CustomTable
            headers={subscriptionRequestHeaders}
            pagination={pagination}
            isLoading={isLoading}
            hasFilters={false}
          >
            {(subscriptionRequests?.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={subscriptionRequestHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {subscriptionRequests?.map((item, index) => (
                  <tr key={item.id}>
                    <td>
                      {serialNum(
                        (filters?.page - 1) * filters?.per_page + index + 1
                      )}
                    </td>
                    <td>{item?.user?.user_name}</td>
                    <td>{item?.user?.email}</td>
                    <td>{item?.no_of_users}</td>
                    <td>{item?.branches}</td>
                    <td>
                      <StatusChip status={item.status_detail} />
                    </td>
                    <td>
                      <TableActionDropDown
                        actions={[
                          {
                            name: 'View',
                            icon: HiOutlineEye,
                            onClick: () => navigate(`${item.id}`),
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
        </Col>
      </Row>
    </>
  );
};

export default withFilters(SubscriptionRequests);
