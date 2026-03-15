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
import { PDCProcessPayableOpenTypeOptions } from '../../../Utils/Constants/SelectOptions';
import {
  isNullOrEmpty,
  showErrorToast,
  toSnakeCase,
} from '../../../Utils/Utils';
import {
  pdcProcessPOCancelledValidationSchema,
  pdcProcessPOSettledValidationSchema,
} from '../../../Utils/Validations/ValidationSchemas';

const PayableOpen = () => {
  usePageTitle('PDC Processes');
  const navigate = useNavigate();
  let previousPage = '/process/pdc-processing?tab=payables';
  const queryClient = useQueryClient();
  const { id } = useParams();
  const location = useLocation();
  const pdcPO = location?.state?.pdc || {};
  const [selectedType, setSelectedType] = useState(
    PDCProcessPayableOpenTypeOptions[0].value
  );

  const postPDCProcessPOMutation = useMutation({
    mutationFn: (values) => postPDCProcess(id, 'payables', values),
    onSuccess: () => {
      showToast('PDC Process successful', 'success');
      queryClient.invalidateQueries({
        queryKey: ['PDCProcessesPayablesListing'],
      });
      navigate(previousPage);
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  useEffect(() => {
    if (isNullOrEmpty(pdcPO)) {
      navigate(previousPage);
    }
    if (pdcPO?.status && pdcPO?.status.toLowerCase() !== 'open') {
      navigate(
        `/process/pdc-processing/${id}/payable/${toSnakeCase(pdcPO?.status)}`
      );
    }
  }, [pdcPO]);

  const handleSubmit = (values) => {
    let payload = {
      processing_type: selectedType,
      ...values,
      remarks: pdcPO?.narration,
      type: 'payables',
    };
    postPDCProcessPOMutation.mutate(payload);
  };

  const renderForm = () => {
    switch (selectedType) {
      case PDCProcessPayableOpenTypeOptions[0].value /* Settled on due date */:
        return (
          <>
            <Formik
              key={selectedType}
              initialValues={{
                date: '',
                processing_type: selectedType,
                bank_account_id: pdcPO?.bank?.id,
              }}
              enableReinitialize
              validationSchema={pdcProcessPOSettledValidationSchema}
              onSubmit={handleSubmit}
            >
              {({ values, errors, touched, handleChange, handleBlur }) => (
                <Form>
                  <div className="row mb-4">
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
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name="bank_account_name"
                        label="Bank Account"
                        disabled
                        value={pdcPO?.bank?.name}
                      />
                    </div>
                    <div className="mb-4">
                      <p className="mb-0">Remarks:</p>
                      <p className="muted-text">{pdcPO?.remarks}</p>
                    </div>
                    <div className="d-flex gap-3 ms-auto mb-3 mb-md-0">
                      <CustomButton
                        loading={postPDCProcessPOMutation.isPending}
                        disabled={postPDCProcessPOMutation.isPending}
                        type={'submit'}
                        text={'Process'}
                      />
                      <CustomButton
                        disabled={postPDCProcessPOMutation.isPending}
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
      case PDCProcessPayableOpenTypeOptions[1]
        .value /* Cancelled on due date */:
        return (
          <>
            <Formik
              key={selectedType}
              initialValues={{
                date: '',
                processing_type: selectedType,
              }}
              enableReinitialize
              validationSchema={pdcProcessPOCancelledValidationSchema}
              onSubmit={handleSubmit}
            >
              {({ values, errors, touched, handleChange, handleBlur }) => (
                <Form>
                  <div className="row mb-4">
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
                    <div className="mb-4">
                      <p className="mb-0">Remarks:</p>
                      <p className="muted-text">{pdcPO?.remarks}</p>
                    </div>
                    <div className="d-flex gap-3 ms-auto mb-3 mb-md-0">
                      <CustomButton
                        disabled={postPDCProcessPOMutation.isPending}
                        type={'submit'}
                        text={'Process'}
                      />
                      <CustomButton
                        disabled={postPDCProcessPOMutation.isPending}
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
        break;
    }
  };

  return (
    <>
      <div className="mb-3">
        <BackButton url={`/process/pdc-processing?tab=payables`} />
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
                  options={PDCProcessPayableOpenTypeOptions}
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

export default PayableOpen;
