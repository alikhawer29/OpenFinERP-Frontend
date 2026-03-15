import { Col, Row } from 'react-bootstrap';
import CustomButton from '../../../../Components/CustomButton';
import CustomInput from '../../../../Components/CustomInput';
import CustomTable from '../../../../Components/CustomTable/CustomTable';
import withFilters from '../../../../HOC/withFilters ';
import {
  vatTaxReportHeaders,
  vatTaxReportOtherOutputHeaders,
  vatTaxReportOutOfScopeHeaders,
  vatTaxZeroReportHeaders,
} from '../../../../Utils/Constants/TableHeaders';
import { useFetchTableData } from '../../../../Hooks/useTable';
import {
  editVatReportDetails,
  getReportEditData,
  getVatReportDetails,
} from '../../../../Services/Reports/VatReport';
import { useRef, useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  downloadFile,
  reportPrint,
  showErrorToast,
} from '../../../../Utils/Utils';
import withModal from '../../../../HOC/withModal';
import CustomModal from '../../../../Components/CustomModal';
import { ErrorMessage, Form, Formik } from 'formik';
import { editVatDetailsSchema } from '../../../../Utils/Validations/ValidationSchemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import SearchableSelect from '../../../../Components/SearchableSelect/SearchableSelect';
import {
  useNationalities,
  useStates,
} from '../../../../Hooks/countriesAndStates';
import CustomCheckbox from '../../../../Components/CustomCheckbox/CustomCheckbox';
import { PulseLoader } from 'react-spinners';
import { showToast } from '../../../../Components/Toast/Toast';
import BackButton from '../../../../Components/BackButton';
import { formatDateString } from '../../../../Utils/Helpers';
import useModulePermissions from '../../../../Hooks/useModulePermissions';

const VATReportInput = ({
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVATCountry, setSelectedVATCountry] = useState(null);
  const [formData, setFormData] = useState({});
  const formRef = useRef();

  const queryClient = useQueryClient();

    const permissions = useModulePermissions("reports" , "vat_report")
  const {allowToExcel , allowToPdf} = permissions;


  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlData = useMemo(
    () => Object.fromEntries(searchParams.entries()),
    [searchParams]
  );

  const {
    data: vatTaxReportData,
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'getVatReportDetails',
    filters,
    updatePagination,
    getVatReportDetails
  );
  const tableData = vatTaxReportData?.data || [];

  const editDetails = useMutation({
    mutationFn: async (params) => {
      const response = await getReportEditData(params);
      return response;
    },
  });

  const { data: nationalities, isLoading: loadingNationalities } =
    useNationalities();

  // Fetch states based on the selected VAT Country
  const { data: states, isLoading: loadingStates } =
    useStates(selectedVATCountry);

  const handleRowClick = (item, index) => {
    if (selectedRowIndex === index) {
      setSelectedRowIndex(null);
      setSelectedItem(null);
    } else {
      setSelectedRowIndex(index);
      setSelectedItem(item);
    }
  };

  const editVatReport = useMutation({
    mutationFn: (formData) => editVatReportDetails(formData),
    onSuccess: () => {
      showToast('VAT Details Updated Successfully!', 'success');
      queryClient.invalidateQueries(['vatTaxReportData', filters]);
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  const hanldeTransactionNavigation = (item) => {
    if (item.type === 'RV') {
      navigate('/transactions/receipt-voucher', {
        state: { transactionId: item.transaction_no },
      });
    }
    if (item.type === 'PV') {
      navigate('/transactions/payment-voucher', {
        state: { transactionId: item.transaction_no },
      });
    }
    if (item.type === 'TSN') {
      navigate('/transactions/tmn-currency-deal', {
        state: { transactionId: item.transaction_no, transactionType: 'buy' },
      });
    }
    if (item.type === 'TBN') {
      navigate('/transactions/tmn-currency-deal', {
        state: { transactionId: item.transaction_no, transactionType: 'sell' },
      });
    }
    if (item.type === 'JV') navigate('/transactions/journal-voucher');
    if (item.type === 'FSN') {
      navigate('/transactions/outward-remittance', {
        state: { transactionId: item.transaction_no },
      });
    }
    if (item.type === 'BDV') navigate('/transactions/bank-transactions');
    if (item.type === 'BWV') navigate('/transactions/bank-transactions');
    if (item.type === 'BITTV') navigate('/transactions/bank-transactions');
    if (item.type === 'PPV') navigate('/transactions/pdcr-issue-as-pdcp');
    if (item.type === 'A2A') navigate('/transactions/account-to-account');
    if (item.type === 'IPV') {
      navigate('/transactions/internal-payment-voucher', {
        state: { transactionId: item.transaction_no },
      });
    }
    if (item.type === 'CBS') navigate('/transactions/foreign-currency-deal');
    if (item.type === 'TRQ') navigate('/transactions/currency-transfer');
    if (item.type === 'FBN')
      navigate('/transactions/outward-remittance-register');
    if (item.type === 'DBN') {
      navigate('/transactions/inward-payment-order', {
        state: { transactionId: item.transaction_no },
      });
    }
    if (item.type === 'DPV') navigate('/transactions/inward-payment');
    if (item.type === 'SVR') navigate('/transactions/suspense-voucher');
    if (item.type === 'SJV') navigate('/transactions/suspense-posting');
    if (item.type === 'TTR') navigate('/transactions/ttr-register');
    if (item.type === 'DPV') navigate('/transactions/inward-payment');
    if (item.type === 'DPV') navigate('/transactions/inward-payment');
  };

  const handleEdit = (values) => {
    const payload = {
      ...values,
      voucher_id: selectedItem?.voucher_id,
      voucher_type: selectedItem?.voucher_type,
      vat_exempted: values?.vat_exempted,
    };
    editVatReport.mutate(payload);
    setShowEditModal(false);
  };

  useEffect(() => {
    if (selectedItem) {
      editDetails.mutate({
        voucher_type: selectedItem?.voucher_type,
        voucher_id: selectedItem?.voucher_id,
      });
    }
  }, [selectedItem]);

  useEffect(() => {
    if (editDetails?.data) {
      const { current_vat_country, current_vat_state } = editDetails.data;

      formRef?.current?.setFieldValue('vat_country', current_vat_country);
      formRef?.current?.setFieldValue('vat_state', current_vat_state);

      setFormData((prev) => ({
        ...prev,
        vat_country: current_vat_country,
        vat_state: current_vat_state,
      }));

      setSelectedVATCountry(current_vat_country);
    }
  }, [editDetails.data]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      ...urlData,
    }));
  }, [urlData, setFilters]);

  return (
    <>
      <BackButton />
      <section>
        <div className="d-flex justify-content-between flex-wrap mb-3">
          <h2 className="screen-title m-0 d-inline">
            VAT Report -{' '}
            {vatTaxReportData &&
              (vatTaxReportData?.vat_type === 'exempted'
                ? 'Exempted Input'
                : vatTaxReportData?.vat_type === 'standard_rate'
                ? 'Standard Rate Input'
                : vatTaxReportData?.vat_type === 'zero_rate'
                ? 'Zero Rate Input'
                : vatTaxReportData?.vat_type === 'out_of_scope'
                ? 'Out Of Scope Input'
                : 'Other Input')}
          </h2>
          <div className="d-flex gap-3 flex-wrap">
            <CustomButton
              text={'Edit VAT Detail'}
              variant={'secondaryButton'}
              disabled={selectedItem === null || !editDetails?.data}
              onClick={() => setShowEditModal(true)}
            />
            {
              allowToExcel &&
              <CustomButton
                text={'Export to Excel'}
                variant={'secondaryButton'}
                onClick={() => {
                  const searchParams = new URLSearchParams(urlData);
                  downloadFile(
                    'vat-report/detail',
                    'xlsx',
                    searchParams.toString()
                  );
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
                  downloadFile(
                    'vat-report/detail',
                    'pdf',
                    searchParams.toString()
                  );
                }}
              />
            }
            <CustomButton
              text={'Print'}
              onClick={() => {
                const searchParams = new URLSearchParams(urlData);
                reportPrint('vat-report/detail', searchParams.toString());
              }}
            />
          </div>
        </div>
        <Row>
          <Col xs={12}>
            <CustomTable
              filters={filters}
              setFilters={setFilters}
              headers={
                urlData?.vat_type === 'standard_rate' ||
                urlData?.vat_type === 'exempted'
                  ? vatTaxReportHeaders
                  : urlData?.vat_type === 'zero_rate'
                  ? vatTaxZeroReportHeaders
                  : urlData?.vat_type === 'out_of_scope'
                  ? vatTaxReportOutOfScopeHeaders
                  : vatTaxReportOtherOutputHeaders
              }
              pagination={pagination}
              hideItemsPerPage={true}
              isLoading={isLoading}
              hideSearch
              renderAtEnd={
                urlData?.vat_type === 'standard_rate' && (
                  <div className="d-flex justify-content-end mb-2">
                    <CustomInput
                      label="Total VAT Amount"
                      className="tableInputs"
                      type="text"
                      borderRadius={10}
                      showBorders={false}
                      style={{ fontWeight: '700' }}
                      readOnly
                      value={vatTaxReportData?.total_base_vat_amount || ''}
                    />
                  </div>
                )
              }
            >
              {(tableData?.length || isError) && (
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={vatTaxReportHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {tableData?.map((item, index) => (
                    <tr
                      key={index++}
                      className={`${
                        selectedRowIndex === index ? 'selected-row' : ''
                      }`}
                      onClick={() => handleRowClick(item, index)}
                    >
                      <td>{formatDateString(item.date)}</td>
                      <td>{item.type}</td>
                      <td onClick={() => hanldeTransactionNavigation(item)}>
                        <p className="text-decoration-underline cp mb-0">
                          {item.transaction_no}
                        </p>
                      </td>
                      <td>{item.ledger}</td>
                      <td>{item.account}</td>
                      <td>{item.trn}</td>
                      <td>{item.country}</td>
                      <td>{item.state}</td>
                      <td>{item.fcy}</td>
                      <td>{item.fc_taxable_amount}</td>
                      {item.vat_percentage && (
                        <td>{item.vat_percentage || '-'}</td>
                      )}

                      {item.vat_term && <td>{item.vat_term}</td>}
                      <td>{item.fc_vat_amount || '0.00'}</td>

                      {urlData?.vat_type !== 'zero_rate' && (
                        <>
                          <td>{item.base_taxable_amount || '-'}</td>
                          {item.reason && <td>{item.reason}</td>}
                          {item.base_vat_amount && (
                            <td>{item.base_vat_amount || '-'}</td>
                          )}
                          <td>{item.cost_center}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              )}
            </CustomTable>
          </Col>
        </Row>
      </section>
      <CustomModal show={showEditModal} close={() => setShowEditModal(false)}>
        <div className="text-center mb-3">
          <h4 className="modalTitle">Edit VAT Detail</h4>
        </div>
        <div className="m-5">
          <p>
            {' '}
            <strong>Ledger : </strong>
            {selectedItem?.ledger}
          </p>
          <p>
            {' '}
            <strong>Account : </strong>
            {selectedItem?.account}
          </p>
        </div>
        <div className="px-sm-5">
          <Formik
            enableReinitialize
            initialValues={{
              vat_trn: editDetails?.data?.current_vat_trn || '',
              vat_country: editDetails?.data?.current_vat_country || '',
              vat_state: editDetails?.data?.current_vat_state || '',
              vat_exempted: editDetails?.data?.current_vat_exempted || false,
            }}
            validationSchema={editVatDetailsSchema}
            innerRef={formRef}
            onSubmit={handleEdit}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              setFieldValue,
            }) => (
              <Form>
                <div className="mb-3">
                  <CustomInput
                    name={'vat_trn'}
                    type={'text'}
                    required
                    label={'VAT TRN'}
                    placeholder={'Enter VAT TRN'}
                    value={values.vat_trn}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.vat_trn && errors.vat_trn}
                  />
                  <CustomCheckbox
                    name="vat_exempted"
                    checked={values.vat_exempted}
                    style={{
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    label="VAT Exempted"
                    onChange={(e) =>
                      setFieldValue('vat_exempted', e.target.checked ? 1 : 0)
                    }
                    error={touched.vat_exempted && errors.vat_exempted}
                  />
                  <ErrorMessage
                    name="vat_trn"
                    component="div"
                    className="input-error-message text-danger"
                  />
                </div>
                <div className="mb-3">
                  <SearchableSelect
                    label={'VAT Country'}
                    name="vat_country"
                    options={
                      loadingNationalities
                        ? [
                            {
                              label: 'Loading...',
                              value: null,
                              isDisabled: true,
                            },
                          ]
                        : nationalities
                    }
                    onChange={(v) => {
                      setFieldValue('vat_country', v.value);
                      setFieldValue('vat_state', null);
                      setFormData((prev) => ({
                        ...prev,
                        vat_country: v ? v.value : '',
                        vat_state: null,
                      }));
                      setSelectedVATCountry(v.value);
                    }}
                    value={values.vat_country}
                    placeholder={'Select VAT Country'}
                    menuPlacement="auto"
                  />
                  <ErrorMessage
                    name="vat_country"
                    component="div"
                    className="input-error-message text-danger"
                  />
                </div>
                <div className="mb-3">
                  <SearchableSelect
                    label={'VAT State'}
                    name="vat_state"
                    options={
                      !selectedVATCountry
                        ? [
                            {
                              label: 'Select Country First',
                              value: null,
                              isDisabled: true,
                            },
                          ]
                        : loadingStates
                        ? [
                            {
                              label: 'Loading...',
                              value: null,
                              isDisabled: true,
                            },
                          ]
                        : states
                    }
                    onChange={(v) => {
                      setFieldValue('vat_state', v.value);
                      setFormData({ ...formData, vat_state: v.value });
                    }}
                    value={values.vat_state}
                    placeholder={'Select VAT State'}
                  />
                  <ErrorMessage
                    name="vat_state"
                    component="div"
                    className="input-error-message text-danger"
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {!editVatReport.isPending ? (
                    <>
                      <CustomButton
                        type="submit"
                        text={'Save'}
                        onClick={() => !errors && setShowEditModal(false)}
                      />
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() => setShowEditModal(false)}
                      />
                    </>
                  ) : (
                    <PulseLoader size={11} className="modalLoader" />
                  )}
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </CustomModal>
    </>
  );
};

export default withModal(withFilters(VATReportInput));
