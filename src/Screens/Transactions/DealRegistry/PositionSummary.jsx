import { useQuery } from '@tanstack/react-query';
import { Col, Row } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import withFilters from '../../../HOC/withFilters ';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { getDealRegisterPositionSummary } from '../../../Services/Transaction/DealRegister';
import { positionSummaryHeaders } from '../../../Utils/Constants/TableHeaders';
import { formatDate } from '../../../Utils/Utils';
import { formatNumberWithCommas } from '../../../Utils/Helpers';

const PositionSummary = () => {
  usePageTitle('Position Summary');
  const location = useLocation();
  const selectedDate = location?.state?.selectedDate;

  // Data fetching
  const {
    data: positionData = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['getDealRegisterPositionSummary', selectedDate],
    queryFn: () => getDealRegisterPositionSummary(selectedDate),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return (
    <section>
      <div className="d-flex flex-column gap-2 mb-4">
        <BackButton />
        <h2 className="screen-title mb-3">Position Summary</h2>
        <p>Date: {selectedDate ? formatDate(selectedDate) : ''}</p>
      </div>
      <Row>
        <Col xs={12}>
          <CustomTable
            hideItemsPerPage
            hasFilters={false}
            headers={positionSummaryHeaders}
            isLoading={isLoading}
            isPaginated={false}
            hideSearch
          >
            {(positionData?.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={positionSummaryHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {positionData?.map((item, index) => (
                  <tr key={index++}>
                    <td>{item.currency}</td>
                    <td>{item.currency_name}</td>
                    <td>{formatNumberWithCommas(item.fc_opening)}</td>
                    <td>{formatNumberWithCommas(item.fc_buy)}</td>
                    <td>{formatNumberWithCommas(item.fc_sell)}</td>
                    <td>{formatNumberWithCommas(item.fc_closing)}</td>
                    <td>{item.avg_closing_rate}</td>
                  </tr>
                ))}
              </tbody>
            )}
          </CustomTable>
        </Col>
      </Row>
    </section>
  );
};
export default withFilters(PositionSummary);
