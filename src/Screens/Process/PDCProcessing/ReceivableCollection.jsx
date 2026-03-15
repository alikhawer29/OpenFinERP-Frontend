import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast';
import { useBanks } from '../../../Hooks/useBanks';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { postPDCProcess } from '../../../Services/Process/PDCProcesses';
import { PDCProcessCollectionTypeOptions } from '../../../Utils/Constants/SelectOptions';
import {
  isNullOrEmpty,
  showErrorToast,
  toSnakeCase,
} from '../../../Utils/Utils';
import {
  pdcProcessRCOpenValidationSchema,
  pdcProcessRCSettledValidationSchema,
} from '../../../Utils/Validations/ValidationSchemas';

const ReceivableCollection = () => {
  usePageTitle('PDC Processes');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const previousPage = '/process/pdc-processing?tab=receivables';
  const { id } = useParams();
  const location = useLocation();
  const pdcRC = location?.state?.pdc || {};
  const [selectedType, setSelectedType] = useState(
    PDCProcessCollectionTypeOptions[0].value
  );
  const { bankOptions } = useBanks();

  const postPDCProcessRCMutation = useMutation({
    mutationFn: (values) => postPDCProcess(id, 'receivables', values),
    onSuccess: () => {
      showToast('PDC Process successful', 'success');
      queryClient.invalidateQueries({
        queryKey: ['PDCProcessesReceivablesListing'],
      });
      navigate(previousPage);
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  useEffect(() => {
    if (isNullOrEmpty(pdcRC)) {
      navigate(previousPage);
    }
    if (pdcRC?.status && pdcRC?.status.toLowerCase() !== 'collection') {
      navigate(
        `/process/pdc-processing/${id}/receivable/${toSnakeCase(pdcRC?.status)}`
      );
    }
  }, [pdcRC]);

  const handleSubmit = (values) => {
    let payload = {
      processing_type: selectedType,
      ...values,
      remarks: pdcRC?.narration,
      type: 'receivables',
    };

    postPDCProcessRCMutation.mutate(payload);
  };

  const renderForm = () => {
    switch (selectedType) {
      case PDCProcessCollectionTypeOptions[0].value /* Settled on due date */:
        return (
          <>
            <Formik
              key={selectedType}
              initialValues={{
                date: '',
                bank_account_id: pdcRC?.bank?.id,
                collection_account_id: pdcRC?.bank?.id,
              }}
              enableReinitialize
              validationSchema={pdcProcessRCSettledValidationSchema}
              onSubmit={handleSubmit}
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
                  <div className="row mb-4">
                    {/* Date */}
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'date'}
                        type={'date'}
                        required
                        label={'Date'}
                        placeholder={'Enter Date'}
                        value={values.date}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.date && errors.date}
                      />
                    </div>
                    {/* Bank Account */}
                    <div className="col-12 col-sm-6 mb-45">
                      <SearchableSelect
                        name="bank_account_id"
                        label="Bank Account"
                        placeholder="Select Bank Account"
                        options={bankOptions}
                        value={values.bank_account_id}
                        onChange={(v) =>
                          setFieldValue('bank_account_id', v.value)
                        }
                      />
                      <ErrorMessage
                        name="bank_account_id"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
                    {/* Collection account */}
                    <div className="col-12 col-sm-6 mb-45">
                      <CustomInput
                        name="collection_account_name"
                        label="Collection account"
                        placeholder="Select Collection account"
                        value={pdcRC?.bank?.name}
                        disabled
                      />
                    </div>
                    <div className="mb-4">
                      <p className="mb-0">Remarks:</p>
                      <p className="muted-text">{pdcRC?.remarks}</p>
                    </div>
                    <div className="d-flex gap-3 ms-auto mb-3 mb-md-0">
                      <CustomButton
                        loading={postPDCProcessRCMutation.isPending}
                        disabled={postPDCProcessRCMutation.isPending}
                        type={'submit'}
                        text={'Process'}
                      />
                      <CustomButton
                        disabled={postPDCProcessRCMutation.isPending}
                        type={'button'}
                        text={'Cancel'}
                        variant="secondaryButton"
                        onClick={() => navigate(previousPage)}
                      />
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
          </>
        );
      case PDCProcessCollectionTypeOptions[1].value /* Cancelled on due date */:
        return (
          <>
            <Formik
              key={selectedType}
              initialValues={{
                date: '',
                process_method: '',
              }}
              enableReinitialize
              validationSchema={pdcProcessRCOpenValidationSchema}
              onSubmit={handleSubmit}
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
                  <div className="row mb-4">
                    {/* Date */}
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'date'}
                        type={'date'}
                        required
                        label={'Date'}
                        placeholder={'Enter Date'}
                        value={values.date}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.date && errors.date}
                      />
                    </div>
                    {/* Process Method */}
                    <div className="col-12 col-sm-6 mb-45">
                      <SearchableSelect
                        name="process_method"
                        label="Process Method"
                        placeholder="Select Process Method"
                        options={[
                          {
                            label: 'Reverse Collection Entry',
                            value: 'reverse_collection_entry',
                          },
                          {
                            label: 'Delete Collection Entry',
                            value: 'delete_collection_entry',
                          },
                        ]}
                        value={values.process_method}
                        onChange={(v) =>
                          setFieldValue('process_method', v.value)
                        }
                      />
                      <ErrorMessage
                        name="process_method"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
                    <div className="mb-4">
                      <p className="mb-0">Remarks:</p>
                      <p className="muted-text">{pdcRC?.remarks}</p>
                    </div>
                    <div className="d-flex gap-3 ms-auto mb-3 mb-md-0">
                      <CustomButton
                        loading={postPDCProcessRCMutation.isPending}
                        disabled={postPDCProcessRCMutation.isPending}
                        type={'submit'}
                        text={'Process'}
                      />
                      <CustomButton
                        disabled={postPDCProcessRCMutation.isPending}
                        type={'button'}
                        text={'Cancel'}
                        variant="secondaryButton"
                        onClick={() => navigate(previousPage)}
                      />
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
          </>
        );
      default:
        return <p>Coming soon...</p>;
    }
  };
  return (
    <>
      <div className="mb-3">
        <BackButton url={`/process/pdc-processing?tab=receivables`} />
        <h2 className="screen-title mb-0">PDC Processes</h2>
      </div>
      <div className="d-card py-45 mb-45">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <div className="row mb-3">
              <div className="col-12 col-sm-6 mb-3">
                <SearchableSelect
                  name="process_type"
                  label="Process Type"
                  placeholder="Select Process Type"
                  options={PDCProcessCollectionTypeOptions}
                  value={selectedType}
                  onChange={(v) => setSelectedType(v.value)}
                />
              </div>
            </div>
            {renderForm()}
          </div>
        </div>
      </div>
    </>
  );
};

export default ReceivableCollection;
