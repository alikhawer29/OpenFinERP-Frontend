import { Col, Row } from 'react-bootstrap';
import CustomButton from '../../../../Components/CustomButton';
import CustomInput from '../../../../Components/CustomInput';
import CustomTable from '../../../../Components/CustomTable/CustomTable';
import withFilters from '../../../../HOC/withFilters ';
import { vatTaxReportData } from '../../../../Mocks/MockData';
import { VATSummaryReportHeaders } from '../../../../Utils/Constants/TableHeaders';
import { useMutation } from '@tanstack/react-query';
import { getVatSummary } from '../../../../Services/Reports/VatReport';
import { useEffect, useState } from 'react';
import { json, useNavigate, useSearchParams } from 'react-router-dom';
import {
  downloadFile,
  formatNumberForDisplay,
  reportPrint,
  roundToFils,
} from '../../../../Utils/Utils';
import BackButton from '../../../../Components/BackButton';
import { usePageTitle } from '../../../../Hooks/usePageTitle';
import useModulePermissions from '../../../../Hooks/useModulePermissions';

const VATSummaryReport = ({ filters, setFilters, pagination }) => {
  usePageTitle('VAT Summary Report');

  const [tableData, setTableData] = useState([]);

  const [searchParams] = useSearchParams();
  const urlData = Object.fromEntries(searchParams.entries());

    const permissions = useModulePermissions("reports" , "vat_report")
  const {allowToExcel , allowToPdf} = permissions;


  const navigate = useNavigate();

  const vatSummary = useMutation({
    mutationFn: async (params) => {
      const response = await getVatSummary(params);
      return response;
    },
    onSuccess: (data) => {
      setTableData(data);
    },
    onError: (error) => {
      console.error('Error', error);
    },
  });

  const { isLoading, isError } = vatSummary;

  const handleItemClick = (item, category) => {
    if (category === 'output') {
      const values = {
        vat_type:
          item?.description === 'Standard Rate Output'
            ? 'standard_rate'
            : item?.description === 'Exempted Output'
            ? 'exempted'
            : item?.description === 'Zero Rate Output'
            ? 'zero_rate'
            : item?.description === 'Out of Scope Output'
            ? 'out_of_scope'
            : 'other',
        category: category,
        period_from: urlData?.period_from,
        period_to: urlData?.period_to,
      };
      const searchParams = new URLSearchParams(values);
      navigate(`/reports/vat-report/output?${searchParams.toString(values)}`);
    }

    if (category === 'input') {
      const values = {
        vat_type:
          item?.description === 'Standard Rate Input'
            ? 'standard_rate'
            : item?.description === 'Exempted Input'
            ? 'exempted'
            : item?.description === 'Zero Rate Input'
            ? 'zero_rate'
            : item?.description === 'Out of Scope Input'
            ? 'out_of_scope'
            : 'other',
        category: category,
      };
      const searchParams = new URLSearchParams(values);
      navigate(`/reports/vat-report/input?${searchParams.toString(values)}`);
    }

    if (category === 'expense') {
      const values = {
        vat_type:
          item?.description === 'Standard Rate Expense'
            ? 'standard_rate'
            : item?.description === 'Exempted Expense'
            ? 'exempted'
            : item?.description === 'Zero Rate Expense'
            ? 'zero_rate'
            : item?.description === 'Out of Scope Expense'
            ? 'out_of_scope'
            : 'other',
        category: category,
      };
      const searchParams = new URLSearchParams(values);
      navigate(`/reports/vat-report/expense?${searchParams.toString(values)}`);
    }
  };

  useEffect(() => {
    const paramsToSend = { ...urlData, ...filters };
    const paramsString = JSON.stringify(paramsToSend);

    if (paramsString !== vatSummary.lastParams) {
      vatSummary.mutate(paramsToSend);
      vatSummary.lastParams = paramsString;
    }
  }, [JSON.stringify(filters), JSON.stringify(urlData)]);

  return (
    <section>
      <BackButton />
      <div className="d-flex justify-content-between flex-wrap">
        <h2 className="screen-title m-0 d-inline">VAT Summary Report</h2>

        <div className="d-flex gap-3 flex-wrap">
          {
            allowToExcel &&
            <CustomButton
              text={'Export to Excel'}
              variant={'secondaryButton'}
              onClick={() => {
                const searchParams = new URLSearchParams(urlData);
                downloadFile('vat-report', 'xlsx', searchParams.toString());
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
              downloadFile('vat-report', 'pdf', searchParams.toString());
            }}
          />
          }
          <CustomButton
            text={'Print'}
            onClick={() => {
              const searchParams = new URLSearchParams(urlData);
              reportPrint('vat-report', searchParams.toString());
            }}
          />
        </div>
      </div>
      <div>
        <p>
          {' '}
          <strong>VAT Type: </strong>
          {tableData?.vat_type}
        </p>
        <p>
          <strong>VAT Report Period:&nbsp;</strong>
          {searchParams.get('period_from')
            ? new Date(searchParams.get('period_from')).toLocaleDateString(
                'en-GB'
              )
            : '—'}{' '}
          -{' '}
          {searchParams.get('period_to')
            ? new Date(searchParams.get('period_to')).toLocaleDateString(
                'en-GB'
              )
            : '—'}
        </p>
        <p>
          <strong>TRN#: </strong>
          {tableData?.trn}
        </p>
        <p>
          <strong>Base Currency: </strong>
          {tableData?.base_currency}
        </p>
      </div>
      <Row>
        {/* vat on outputs */}
        <Col xs={12} className="mb-4">
          <div className="d-card py-3">
            <div className="accordion-header mb-2">
              <h6 className="mb-0 fw-bold">A. VAT on Outputs</h6>
            </div>
            <CustomTable
              filters={filters}
              setFilters={setFilters}
              hasFilters={false}
              isPaginated={false}
              headers={VATSummaryReportHeaders}
              pagination={pagination}
              isLoading={isLoading}
              hideSearch
              displayCard={false}
            >
              {(tableData?.vat_summary?.vat_on_outputs?.length || isError) && (
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={VATSummaryReportHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {tableData?.vat_summary?.vat_on_outputs?.map(
                    (item, index) => (
                      <tr
                        style={{
                          fontWeight:
                            item.description === 'Total Output VAT'
                              ? 'bold'
                              : '',
                        }}
                        key={index++}
                      >
                        <td
                          onClick={() => {
                            item.description !== 'Total Output VAT' &&
                              handleItemClick(item, 'output');
                          }}
                        >
                          <p
                            className={`${
                              item.description === 'Total Output VAT'
                                ? ''
                                : 'text-decoration-underline'
                            } cp mb-0`}
                          >
                            {item.description}
                          </p>
                        </td>
                        <td>{item.base_taxable_amount ? formatNumberForDisplay(item.base_taxable_amount, 2) : ''}</td>
                        <td>{item.vat_amount ? formatNumberForDisplay(item.vat_amount, 2) : ''}</td>
                      </tr>
                    )
                  )}
                </tbody>
              )}
            </CustomTable>
          </div>
        </Col>
        {/* vat on inputs */}
        <Col xs={12} className="mb-4">
          <div className="d-card py-3">
            <div className="accordion-header mb-2">
              <h6 className="mb-0 fw-bold">B. VAT on Inputs</h6>
            </div>
            <CustomTable
              filters={filters}
              setFilters={setFilters}
              hasFilters={false}
              isPaginated={false}
              headers={VATSummaryReportHeaders}
              pagination={pagination}
              isLoading={isLoading}
              hideSearch
              displayCard={false}
            >
              {(tableData?.vat_summary?.vat_on_inputs?.length || isError) && (
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={VATSummaryReportHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {tableData?.vat_summary?.vat_on_inputs?.map((item, index) => (
                    <tr
                      style={{
                        fontWeight:
                          item.description === 'Total Input VAT' ? 'bold' : '',
                      }}
                      key={index++}
                    >
                      <td
                        onClick={() => {
                          item.description !== 'Total Input VAT' &&
                            handleItemClick(item, 'input');
                        }}
                      >
                        <p
                          className={`${
                            item.description === 'Total Input VAT'
                              ? ''
                              : 'text-decoration-underline'
                          } cp mb-0`}
                        >
                          {item.description}
                        </p>
                      </td>
                      <td>{item.base_taxable_amount ? formatNumberForDisplay(item.base_taxable_amount, 2) : ''}</td>
                      <td>{item.vat_amount ? formatNumberForDisplay(item.vat_amount, 2) : ''}</td>
                    </tr>
                  ))}
                </tbody>
              )}
            </CustomTable>
          </div>
        </Col>
        {/* vat on expenses */}
        <Col xs={12} className="mb-4">
          <div className="d-card py-3">
            <div className="accordion-header mb-2">
              <h6 className="mb-0 fw-bold">C. VAT on Expenses</h6>
            </div>
            <CustomTable
              filters={filters}
              setFilters={setFilters}
              hasFilters={false}
              isPaginated={false}
              headers={VATSummaryReportHeaders}
              pagination={pagination}
              isLoading={isLoading}
              hideSearch
              displayCard={false}
            >
              {(tableData?.vat_summary?.vat_on_expenses?.length || isError) && (
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={VATSummaryReportHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {tableData?.vat_summary?.vat_on_expenses?.map(
                    (item, index) => (
                      <tr
                        style={{
                          fontWeight:
                            item.description === 'Total Expense VAT'
                              ? 'bold'
                              : '',
                        }}
                        key={index++}
                      >
                        <td
                          onClick={() => {
                            item.description !== 'Total Expense VAT' &&
                              handleItemClick(item, 'expense');
                          }}
                        >
                          <p
                            className={`${
                              item.description === 'Total Expense VAT'
                                ? ''
                                : 'text-decoration-underline'
                            } cp mb-0`}
                          >
                            {item.description}
                          </p>
                        </td>
                        <td>{item.base_taxable_amount ? formatNumberForDisplay(item.base_taxable_amount, 2) : ''}</td>
                        <td>{item.vat_amount ? formatNumberForDisplay(item.vat_amount, 2) : ''}</td>
                      </tr>
                    )
                  )}
                </tbody>
              )}
            </CustomTable>
          </div>
        </Col>
        {/* net vat due */}
        <Col xs={12} className="mb-4">
          <div className="d-card py-3">
            <div className="accordion-header mb-2">
              <h6 className="mb-0 fw-bold">Net VAT Due</h6>
            </div>
            <CustomTable
              filters={filters}
              setFilters={setFilters}
              hasFilters={false}
              isPaginated={false}
              headers={VATSummaryReportHeaders}
              pagination={pagination}
              isLoading={isLoading}
              hideSearch
              displayCard={false}
            >
              {(tableData?.vat_summary?.net_vat_due?.length || isError) && (
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={VATSummaryReportHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {tableData?.vat_summary?.net_vat_due?.map((item, index) => {
                    const isVATSummary = item.description?.includes('A-(B+C)');
                    const amount = Number(item.base_taxable_amount);
                    const textClass = isVATSummary
                      ? amount < 0
                        ? 'text-danger'
                        : 'text-success'
                      : '';

                    return (
                      <tr key={index++}>
                        <td>
                          <p className={`mb-0 fw-bold ${textClass}`}>
                            {item.description}
                          </p>
                        </td>
                        <td className={textClass}>
                          {roundToFils(item.base_taxable_amount)}
                        </td>
                        <td className={textClass}>
                          {roundToFils(item.base_vat_amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              )}
            </CustomTable>
          </div>
        </Col>
      </Row>
    </section>
  );
};

export default withFilters(VATSummaryReport);
