import { useQuery } from '@tanstack/react-query';
import { Col, Row } from 'react-bootstrap';
import { HiOutlineEye } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../../../Components/CustomButton';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import withFilters from '../../../HOC/withFilters ';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';
import {
  getSupportLogListing,
  getSupportTypes,
} from '../../../Services/Admin/Support';
import { supportLogsHeaders } from '../../../Utils/Constants/TableHeaders';
import {
  downloadFileAdmin,
  formatDate,
  serialNum,
  showErrorToast,
} from '../../../Utils/Utils';
import StatusChip from '../../../Components/StatusChip/StatusChip';

const SupportLogs = ({ filters, setFilters, pagination, updatePagination }) => {
  usePageTitle('Support Logs');
  const navigate = useNavigate();

  //GET SUPPORT LOGS
  const {
    data: fetchSupportLogs, // Renamed to avoid confusion with the derived `userManagement`
    isLoading,
    isError,
    error,
    refetch,
  } = useFetchTableData(
    'getSupportLogListing',
    filters,
    updatePagination,
    getSupportLogListing
  );

  // Provide a default value for `userManagement`
  const supportLogs = fetchSupportLogs?.data ?? [];

  //GET SUPPORT TYPES
  const {
    data: SupportTypes,
    isLoading: isLoadingSupportTypes,
    isError: IsErrorSupportTypes,
    error: ErrorSupportTypes,
  } = useQuery({
    queryKey: ['SupportTypes'],
    queryFn: getSupportTypes,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const getTypesOptions = () => {
    if (!isLoadingSupportTypes && !IsErrorSupportTypes) {
      const allOption = { value: '', label: 'All' };

      return [
        allOption,
        ...SupportTypes?.map((x) => ({
          value: x.id,
          label: x.name,
        })),
      ];
    } else {
      if (IsErrorSupportTypes) {
        console.error('Unable to fetch Types', ErrorSupportTypes);
        return [
          {
            label: 'Unable to fetch Types',
            value: null,
          },
        ];
      } else {
        return [{ label: 'Loading...', value: null, isDisabled: true }];
      }
    }
  };

  if (isError || IsErrorSupportTypes) {
    showErrorToast(error);
  }

  // Helper function to get renewal status chip
  const getRenewalStatusChip = (status) => {
    const statusMap = {
      resolved: 'success',
      pending: 'warning',
      canclled: 'danger',
    };
    return <StatusChip status={status} className={statusMap[status]} />;
  };

  return (
    <>
      <section>
        <div className="d-flex justify-content-between flex-wrap mb-3">
          <h2 className="screen-title mb-0">Support Logs</h2>
          <div className="d-flex gap-2">
            <CustomButton
              text={'New Request'}
              onClick={() => navigate('/admin/support-logs/new-request')}
            />
            <CustomButton
              text={'Export To PDF'}
              onClick={() => downloadFileAdmin('feedback', 'pdf')}
            />
            <CustomButton
              text={'Export To Excel'}
              onClick={() => downloadFileAdmin('feedback', 'xlsx')}
            />
          </div>
        </div>
        <Row>
          <Col xs={12}>
            <CustomTable
              filters={filters}
              setFilters={setFilters}
              headers={supportLogsHeaders}
              pagination={pagination}
              isLoading={isLoading}
              dateFilters={[
                {
                  title: 'Registration Date',
                  from: 'from',
                  to: 'to',
                  label: 'Date',
                },
              ]}
              selectOptions={[
                {
                  title: 'type',
                  options: getTypesOptions(),
                },
              ]}
            >
              {(supportLogs?.length || isError) && (
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={supportLogsHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {supportLogs?.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        {serialNum(
                          (filters?.page - 1) * filters?.per_page + index + 1
                        )}
                      </td>
                      <td>{item?.name}</td>
                      <td>{item?.email}</td>
                      <td>{item?.type?.name}</td>
                      <td>{formatDate(item?.created_at)}</td>
                      <td>{getRenewalStatusChip(item?.status)}</td>

                      <td>
                        {item?.resolved_cancelled_by?.first_name}{' '}
                        {item?.resolved_cancelled_by?.last_name}
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
      </section>
    </>
  );
};

export default withFilters(SupportLogs);
