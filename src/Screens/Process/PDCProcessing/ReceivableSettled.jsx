import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { postPDCProcess } from '../../../Services/Process/PDCProcesses';
import { PDCProcessSettledTypeOptions } from '../../../Utils/Constants/SelectOptions';
import {
  isNullOrEmpty,
  showErrorToast,
  toSnakeCase,
} from '../../../Utils/Utils';
import { pdcProcessRSValidationSchema } from '../../../Utils/Validations/ValidationSchemas';

const ReceivableSettled = () => {
  usePageTitle('PDC Processes');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const previousPage = '/process/pdc-processing?tab=receivables';
  const { id } = useParams();
  const location = useLocation();
  const pdcRS = location?.state?.pdc || {};

  const postPDCProcessRSMutation = useMutation({
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
    if (isNullOrEmpty(pdcRS)) {
      navigate(previousPage);
    }
    if (pdcRS?.status && pdcRS?.status.toLowerCase() !== 'settled') {
      navigate(
        `/process/pdc-processing/${id}/receivable/${toSnakeCase(pdcRS?.status)}`
      );
    }
  }, [pdcRS]);

  const handleSubmit = (values) => {
    let payload = {
      processing_type: values?.processing_type,
      ...values,
      remarks: pdcRS?.narration,
      type: 'receivables',
    };

    postPDCProcessRSMutation.mutate(payload);
  };

  const renderForm = () => {
    return (
      <Formik
        initialValues={{
          date: '',
          processing_type: 'recall_settled_cheque' || 'cancel_settled_cheque',
        }}
        validationSchema={pdcProcessRSValidationSchema}
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
              <div className="col-12 col-sm-7 mb-3">
                <SearchableSelect
                  name="processing_type"
                  label="Process Type"
                  placeholder="Select Process Type"
                  options={PDCProcessSettledTypeOptions}
                  value={values.processing_type}
                  onChange={(v) => setFieldValue('processing_type', v.value)} // Use setFieldValue
                />
              </div>
              <div className="col-12 col-sm-7 mb-3">
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
              <div className="mb-4">
                <p className="mb-0">Remarks:</p>
                <p className="muted-text">{pdcRS?.remarks}</p>
              </div>
              <div className="d-flex gap-3 ms-auto mb-3 mb-md-0">
                <CustomButton
                  loading={postPDCProcessRSMutation.isPending}
                  disabled={postPDCProcessRSMutation.isPending}
                  type={'submit'}
                  text={'Process'}
                />
                <CustomButton
                  disabled={postPDCProcessRSMutation.isPending}
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
    );
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
            {/* <div className="row mb-3">
              <div className="col-12 col-sm-6 mb-3">
                <SearchableSelect
                  name="processing_type"
                  label="Process Type"
                  placeholder="Select Process Type"
                  options={PDCProcessSettledTypeOptions}
                  value={selectedType}
                  onChange={(v) => setSelectedType(v.value)}
                />
              </div>
            </div> */}
            {renderForm()}
          </div>
        </div>
      </div>
    </>
  );
};

export default ReceivableSettled;
