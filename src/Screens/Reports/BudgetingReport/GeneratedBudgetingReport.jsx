import React, { useMemo, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CustomButton from '../../../Components/CustomButton';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import withFilters from '../../../HOC/withFilters ';
import {
  budgetingReportHeaders,
  yearlyBudgetingReportHeaders,
} from '../../../Utils/Constants/TableHeaders';
import CustomModal from '../../../Components/CustomModal';
import CustomInput from '../../../Components/CustomInput';
import { Form, Formik } from 'formik';
import {
  getBudgetReportData,
  postRemarks,
} from '../../../Services/Reports/BudgetingReportService';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { useMutation, useQuery } from '@tanstack/react-query';
import { showToast } from '../../../Components/Toast/Toast';
import { useQueryClient } from '@tanstack/react-query';
import { downloadFile, reportPrint } from '../../../Utils/Utils';
import BackButton from '../../../Components/BackButton';
import useModulePermissions from '../../../Hooks/useModulePermissions';

const GeneratedBudgetingReport = ({ filters, setFilters, pagination }) => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [remarkMode, setRemarkMode] = useState('add');
  const [searchParams] = useSearchParams();
  const urlData = Object.fromEntries(searchParams.entries());
  const queryClient = useQueryClient();

    const permissions = useModulePermissions("reports" , "budgeting_forecasting_report")
  const {allowToExcel , allowToPdf} = permissions;


  // query to get budgeting report based on the report type
  const {
    data: reportsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['getBudgetReportData'],
    queryFn: () => getBudgetReportData(urlData),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  //  mutation to pas remarks
  const { mutate: submitRemarks, isPending: remarksLoading } = useMutation({
    mutationFn: postRemarks,
    retry: 1,
    onSuccess: () => {
      showToast('Remarks submitted successfully!', 'success');
      setShowRemarkModal(false);
      queryClient.invalidateQueries(['getBudgetReportData']);
    },
    onError: (error) => {
      showToast(`Remarks Error: ${error}`, 'error');
    },
  });

  const totals = useMemo(() => {
    const budgeted = rows.reduce(
      (sum, r) => sum + Number(r?.budgetedAmount || 0),
      0
    );
    const actual = rows.reduce(
      (sum, r) => sum + Number(r?.actualAmount || 0),
      0
    );
    const variance = rows.reduce(
      (sum, r) => sum + Number(r?.varianceAmount || 0),
      0
    );
    const variancePercent = budgeted
      ? ((variance / budgeted) * 100).toFixed(0)
      : 0;
    return { budgeted, actual, variance, variancePercent };
  }, [rows]);
  const summaryRows = (
    <>
      <tr>
        <td
          colSpan={budgetingReportHeaders.length - 6}
          style={{ textAlign: 'right', fontWeight: 'bold' }}
        >
          Net Profit
        </td>
        <td>{reportsData?.summary?.net_profit_budgeted}</td>
        <td>{reportsData?.summary?.net_profit_actual}</td>
        <td>{reportsData?.summary?.net_profit_variance}</td>
        <td>{reportsData?.summary?.total_variance_percent}</td>
        <td colSpan={2}></td>
      </tr>
    </>
  );

  const openAdd = (row) => {
    setSelectedRow(row);
    setRemarkMode('add');
    setShowRemarkModal(true);
  };

  const openEdit = (row) => {
    setSelectedRow(row);
    setRemarkMode('edit');
    setShowRemarkModal(true);
  };

  const handleRemarks = (values) => {
    const payload = {
      budget_detail_id: selectedRow?.budget_detail_id,
      remarks: values?.remarks,
    };
    submitRemarks(payload);
  };
  return (
    <section>
      <BackButton />
      <div className="d-flex justify-content-between flex-wrap mb-3">
        <div className="mb-2">
          <h2 className="screen-title m-0 d-inline">Budgeting Report</h2>
          <strong className="d-block mt-1">
            Fiscal Period: {urlData?.date_from || '-'} -{' '}
            {urlData?.date_to || '-'}
          </strong>
        </div>
        <div className="d-flex gap-3 flex-wrap">
          <CustomButton
            text={'View Graph'}
            variant={'secondaryButton'}
            onClick={() => {
              const searchParams = new URLSearchParams(urlData);
              navigate(
                `/reports/budgeting-report/graph?${searchParams.toString()}`
              );
            }}
          />
          {
            allowToExcel &&
            <CustomButton
              text={'Export to Excel'}
              variant={'secondaryButton'}
              onClick={() => {
                const searchParams = new URLSearchParams(urlData);
                downloadFile('budget-report', 'xlsx', searchParams.toString());
              }}
            />
          }
          {
            allowToPdf &&
            <CustomButton
              text={'Export to PDF'}
              variant={'secondaryButton'}
              onClick={() => {
                const searchParams = new URLSearchParams(urlData);
                downloadFile('budget-report', 'pdf', searchParams.toString());
              }}
            />
          }
          <CustomButton
            text={'Print'}
            onClick={() => {
              const searchParams = new URLSearchParams(urlData);
              reportPrint('budget-report', searchParams.toString());
            }}
          />
        </div>
      </div>
      <Row>
        <Col xs={12}>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            isLoading={isLoading}
            headers={
              urlData?.report_type === 'yearly'
                ? yearlyBudgetingReportHeaders
                : budgetingReportHeaders
            }
            pagination={pagination}
            summaryRows={summaryRows}
            isPaginated={false}
            hideSearch
            hideItemsPerPage
          >
            {(reportsData?.report_data?.length || isError) && (
              <>
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={budgetingReportHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {reportsData?.report_data?.map((item) => (
                    <tr key={item.id}>
                      <td>{item.fiscal_year}</td>
                      <>
                        {urlData?.report_type !== 'yearly' && (
                          <td>{item.period}</td>
                        )}
                      </>
                      <td>{item.account_group}</td>
                      <td>{item.account_name}</td>
                      <td>{item.budgeted_amount}</td>
                      <td>{item.actual_amount}</td>
                      <td>{item.variance_amount}</td>
                      <td>{item.variance_percent}</td>
                      <td>{item.remarks || '-'}</td>
                      <td>
                        {item.remarks ? (
                          <TableActionDropDown
                            actions={[
                              {
                                name: 'Edit Remark',
                                onClick: () => openEdit(item),
                              },
                            ]}
                          />
                        ) : (
                          <TableActionDropDown
                            actions={[
                              {
                                name: 'Add Remark',
                                onClick: () => openAdd(item),
                              },
                            ]}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
          </CustomTable>
        </Col>
      </Row>

      {/* Add/Edit Remark Modal */}
      <CustomModal
        show={showRemarkModal}
        close={() => setShowRemarkModal(false)}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle">
            {remarkMode === 'edit' ? 'Edit Remark' : 'Add Remark'}
          </h4>
        </div>
        <div className="px-sm-5">
          <Formik
            enableReinitialize
            initialValues={{
              remarks: remarkMode === 'edit' ? selectedRow?.remarks || '' : '',
            }}
            onSubmit={handleRemarks}
          >
            {({ values, handleChange }) => (
              <Form>
                <div className="mb-45">
                  <CustomInput
                    label="Remark"
                    name="remarks"
                    type="text"
                    placeholder="Enter Remark"
                    value={values.remarks}
                    onChange={handleChange}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {remarkMode === 'edit' ? (
                    <CustomButton
                      type="submit"
                      loading={remarksLoading}
                      text={'Update'}
                    />
                  ) : (
                    <CustomButton
                      type="submit"
                      loading={remarksLoading}
                      text={'Add'}
                    />
                  )}
                  <CustomButton
                    variant={'secondaryButton'}
                    text={'Cancel'}
                    type={'button'}
                    onClick={() => setShowRemarkModal(false)}
                  />
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </CustomModal>
    </section>
  );
};

export default withFilters(GeneratedBudgetingReport);
