import { Form, Formik } from 'formik';
import React, { useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { HiPrinter } from 'react-icons/hi2';
import CustomButton from '../../../../Components/CustomButton';
import CustomModal from '../../../../Components/CustomModal';
import CustomTable from '../../../../Components/CustomTable/CustomTable';
import TableActionDropDown from '../../../../Components/TableActionDropDown/TableActionDropDown';
import withFilters from '../../../../HOC/withFilters ';
import { MOCK_APPLICATION_PRINTING_DATA } from '../../../../Mocks/MockData';
import { applicationPrintingHeaders } from '../../../../Utils/Constants/TableHeaders';
import SearchableSelect from '../../../../Components/SearchableSelect/SearchableSelect';
import { usePageTitle } from '../../../../Hooks/usePageTitle';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createApplicationPrinting,
  getApplicationPrintingListing,
  getOutwardRemittanceRegisterListing,
} from '../../../../Services/Transaction/OutwardRemittance';
import { showErrorToast } from '../../../../Utils/Utils';
import { useFetchTableData } from '../../../../Hooks/useTable';
import { showToast } from '../../../../Components/Toast/Toast';
import CombinedInputs from '../../../../Components/CombinedInputs/CombinedInputs';
import useAccountsByType from '../../../../Hooks/useAccountsByType';
import { PulseLoader } from 'react-spinners';
import useModulePermissions from '../../../../Hooks/useModulePermissions';

const ApplicationPrinting = ({
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Application Printing');

  // Permissions
  const permissions = useModulePermissions('transactions', 'application_printing');
  const { print: hasPrintPermission } = permissions || {};
  const [showAssignAccountModal, setShowAssignAccountModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const queryClient = useQueryClient();

  // Data fetching
  const {
    data: { data: applicationPrintingData = [] } = {},
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'getApplicationPrintingListing',
    filters,
    updatePagination,
    getApplicationPrintingListing
  );

  if (isError) {
    showErrorToast(error);
  }

  const handleAssignAccountSubmit = (values) => {
    createApplicationPrintingMutation.mutate({
      id: selectedItem.id,
      formData: values,
    });
  };

  // Mutation: Create Application Printing
  const createApplicationPrintingMutation = useMutation({
    mutationFn: ({ id, formData }) => createApplicationPrinting(id, formData),
    onSuccess: (data) => {
      showToast('Status Updated!', 'success');
      setShowAssignAccountModal(false);

      if (data?.detail?.pdf_url) {
        window.open(data.detail.pdf_url, '_blank');
      }

      queryClient.invalidateQueries(['getApplicationPrintingListing']);
    },
    onError: (error) => {
      console.error('Error updating Application Printing Status', error);
      showErrorToast(error);
    },
  });

  const { getAccountsByTypeOptions } = useAccountsByType();
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState(null);

  const isPrinted = selectedItem?.application_printing?.is_printed === 1;

  const options1 = isPrinted
    ? [{ label: 'GL', value: 'general' }]
    : [
        { label: 'PL', value: 'party' },
        { label: 'GL', value: 'general' },
      ];

  const initialValues = {
    ledger: isPrinted ? 'general' : '',
    ledger_id: '',
    output: '',
  };

  return (
    <section>
      <div className="d-flexflex-wrap mb-3">
        <h2 className="screen-title m-0 d-inline">Application Printing</h2>
      </div>
      <Row>
        <Col xs={12}>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={applicationPrintingHeaders}
            pagination={pagination}
            isLoading={isLoading}
            // hideSearch
            selectOptions={[
              {
                title: 'Status',
                options: [{ value: 'All', label: 'All' }],
              },
            ]}
          >
            {(applicationPrintingData?.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={applicationPrintingHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {applicationPrintingData?.map((item) => (
                  <tr key={item.id}>
                    <td>FSN {item?.voucher?.voucher_no}</td>
                    <td>{item?.date}</td>
                    <td>{item?.fc_currency?.currency_code}</td>
                    <td>{item?.send_amount}</td>
                    <td>{item?.beneficiary?.name}</td>
                    <td>{item?.account_details?.title}</td>
                    <td>{item?.beneficiary?.bank_account_number}</td>
                    <td>
                      {item?.application_printing?.status === 'printed'
                        ? 'Printed'
                        : 'Not Printed'}
                    </td>
                    <td>
                      {hasPrintPermission && (
                        <div className="d-flex align-items-center">
                          <TableActionDropDown
                            actions={[
                              {
                                name: 'Print',
                                icon: HiPrinter,
                                onClick: () => {
                                  setSelectedItem(item);
                                  setShowAssignAccountModal(true);
                                },
                                className: 'attachments',
                              },
                            ]}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </CustomTable>
        </Col>
      </Row>

      {/* Assign Account Modal */}
      <CustomModal
        show={showAssignAccountModal}
        close={() => setShowAssignAccountModal(false)}
        size={'lg'}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle">Assign Account</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={initialValues}
            // validationSchema={outOfScopeSchema}
            onSubmit={handleAssignAccountSubmit}
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
                <div className="d-flex gap-3 mb-45">
                  <CombinedInputs
                    label="Ledger"
                    type1="select"
                    type2="select"
                    name1="ledger"
                    name2="ledger_id"
                    value1={values.ledger}
                    value2={values.ledger_id}
                    options1={options1}
                    isfirstInputDisabled={
                      selectedItem?.application_printing?.is_printed === 1
                    }
                    options2={getAccountsByTypeOptions(
                      values.ledger,
                      false,
                      values.ledger === 'general'
                    )}
                    handleBlur={handleBlur}
                    placeholder1="Select Ledger"
                    placeholder2="Select Account"
                    className1="ledger"
                    className2="ledger_id"
                    onChange1={(selected) => {
                      setFieldValue('ledger', selected.value);
                    }}
                    onChange2={(selected) => {
                      setFieldValue('ledger_id', selected.value);
                      setSelectedLedgerAccount(selected.value);
                    }}
                  />
                </div>
                {values?.ledger === 'general' && (
                  <div className="mb-45">
                    <SearchableSelect
                      label="Output"
                      name="output"
                      id="output"
                      type="select"
                      options={[
                        {
                          label: 'Application Letter',
                          value: 'application_letter',
                        },
                        {
                          label: 'Bank Application Form',
                          value: 'bank_application_form',
                        },
                      ]}
                      value={values.output}
                      onChange={(e) => {
                        setFieldValue('output', e.value);
                      }}
                      placeholder="Select Output"
                      onBlur={handleBlur}
                      error={touched.output && errors.output}
                    />
                  </div>
                )}

                <div className="d-flex gap-3 justify-content-center mb-3">
                  {!createApplicationPrintingMutation.isPending ? (
                    <>
                      <CustomButton type="submit" text={'Print'} />
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() => setShowAssignAccountModal(false)}
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
    </section>
  );
};
export default withFilters(ApplicationPrinting);
