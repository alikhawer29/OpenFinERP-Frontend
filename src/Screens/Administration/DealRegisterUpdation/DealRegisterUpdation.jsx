import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import { showToast } from '../../../Components/Toast/Toast';
import withFilters from '../../../HOC/withFilters ';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';
import { getDealRegisterUpdationListing } from '../../../Services/Administration/DealRegisterUpdation';
import { dealRegisterUpdationHeaders } from '../../../Utils/Constants/TableHeaders';
import { formatDate, showErrorToast } from '../../../Utils/Utils';

const DealRegisterUpdation = ({
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Deal Register Updation');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRecalculating, setIsRecalculating] = useState(false);

  const { data, isLoading, isError, error } = useFetchTableData(
    'branchManagementListing',
    filters,
    updatePagination,
    getDealRegisterUpdationListing
  );

  const dealRegisterUpdation = data || [];

  if (isError) {
    showErrorToast(error);
  }
  if (isLoading) {
    return <>loading...</>;
  }
  return (
    <>
      <section>
        <div className=" mb-3">
          <h2 className="screen-title mb-0">Deal Register Updation</h2>
          <div className="d-flex gap-3 align-items-center flex-wrap  mt-5">
            <div className="d-flex gap-3 align-items-center">
              <div className="filterWrapper gap-md-2 d-flex align-items-center flex-wrap mb-0">
                <CustomInput
                  inputClass={'tableInputs'}
                  borderRadius={10}
                  label="Date Range"
                  type="date"
                  placeholder="dd/mm/yyyy"
                  name="date_range_from"
                  onChange={(e) =>
                    setFilters({ ...filters, date_range_from: e.target.value })
                  }
                  value={filters?.date_range_from || ''}
                />
                <div className="separator d-sm-block d-none mt-0">
                  <span>-</span>
                </div>
                <CustomInput
                  inputClass={'tableInputs'}
                  borderRadius={10}
                  label=" "
                  type="date"
                  name="date_range_to"
                  placeholder="dd/mm/yyyy"
                  onChange={(e) =>
                    setFilters({ ...filters, date_range_to: e.target.value })
                  }
                  value={filters?.date_range_to || ''}
                />
              </div>
            </div>

            <div className="d-flex gap-3 align-items-center">
              <CustomButton
                text={'Update Deal Register'}
                loading={isLoading}
                onClick={() => {
                  console.log('');
                }}
              />
              <CustomButton
                loading={isRecalculating}
                text={'Recalculate Closing Rates'}
                onClick={() => {
                  setIsRecalculating(true);
                  setTimeout(() => {
                    showToast('Closing Rates Recalculated', 'success');
                    setIsRecalculating(false);
                  }, 3000);
                }}
              />
            </div>
          </div>
        </div>
        <Row>
          <Col xs={12}>
            <CustomTable
              filters={filters}
              setFilters={setFilters}
              headers={dealRegisterUpdationHeaders}
              pagination={pagination}
              isPaginated={false}
              isLoading={isLoading}
              selectOptions={[
                {
                  title: 'FCy',
                  options: [
                    { label: 'USD', value: 'USD' },
                    { label: 'EUR', value: 'EUR' },
                  ],
                },
              ]}
              dateFilters={[
                {
                  title: 'Period',
                  label: 'Period',
                },
              ]}
            >
              {(dealRegisterUpdation.length || isError) && (
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={dealRegisterUpdationHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {dealRegisterUpdation?.map((item, index) => (
                    <tr key={index++}>
                      <td>{formatDate(item.date)}</td>
                      <td>{item.fcy}</td>
                      <td>{item.total_account}</td>
                      <td>{item.total_deal_register}</td>
                      <td></td>
                      <td>{item.total_difference}</td>
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

export default withFilters(DealRegisterUpdation);
