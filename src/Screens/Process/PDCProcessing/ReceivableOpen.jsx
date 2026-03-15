import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
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
import { PDCProcessOpenTypeOptions } from '../../../Utils/Constants/SelectOptions';
import {
  isNullOrEmpty,
  showErrorToast,
  toSnakeCase,
} from '../../../Utils/Utils';
import {
  pdcProcessRODiscountedCollectionValidationSchema,
  pdcProcessROValidationSchema,
  pdcProcessROValidationSchemaCancelled,
} from '../../../Utils/Validations/ValidationSchemas';
import useAccountsByType from '../../../Hooks/useAccountsByType';

const ReceivableOpen = () => {
  usePageTitle('PDC Processes');
  const navigate = useNavigate();
  let previousPage = '/process/pdc-processing?tab=receivables';
  const queryClient = useQueryClient();
  const { id } = useParams();
  const location = useLocation();
  const pdcRO = location?.state?.pdc || {};
  const [selectedType, setSelectedType] = useState(
    PDCProcessOpenTypeOptions[0].value
  );

  const { getAccountsByTypeOptions } = useAccountsByType();

  const postPDCProcessROMutation = useMutation({
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
    if (isNullOrEmpty(pdcRO)) {
      navigate(previousPage);
    }
    if (pdcRO?.status && pdcRO?.status.toLowerCase() !== 'open') {
      navigate(
        `/process/pdc-processing/${id}/receivable/${toSnakeCase(pdcRO?.status)}`
      );
    }
  }, [pdcRO]);

  const handleSubmit = (values) => {
    let payload = {
      processing_type: selectedType,
      ...values,
      remarks: pdcRO?.narration,
      type: 'receivables',
    };

    postPDCProcessROMutation.mutate(payload);
  };

  const renderForm = () => {
    switch (selectedType) {
      case PDCProcessOpenTypeOptions[0].value /* Settled on due date */:
        return (
          <>
            <Formik
              key={selectedType}
              enableReinitialize
              initialValues={{
                date: pdcRO?.due_date,
                bank_account_id: pdcRO?.bank?.id,
                processing_type: selectedType,
              }}
              validationSchema={pdcProcessROValidationSchema}
              onSubmit={handleSubmit}
            >
              {({ values, errors, touched, handleChange, handleBlur }) => (
                <Form>
                  <div className="row mb-4">
                    <div className="col-12 col-sm-6 mb-3">
                      <SearchableSelect
                        name="process_type"
                        label="Process Type"
                        placeholder="Select Process Type"
                        options={PDCProcessOpenTypeOptions}
                        value={selectedType}
                        onChange={(v) => setSelectedType(v.value)}
                      />
                    </div>
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
                        disabled
                        label="Bank Account"
                        value={pdcRO?.bank?.name}
                      />
                    </div>
                    <div className="mb-4">
                      <p className="mb-0">Remarks:</p>
                      <p className="muted-text">{pdcRO?.remarks}</p>
                    </div>
                    <div className="d-flex gap-3 ms-auto mb-3 mb-md-0">
                      <CustomButton
                        loading={postPDCProcessROMutation.isPending}
                        disabled={postPDCProcessROMutation.isPending}
                        type={'submit'}
                        text={'Process'}
                      />
                      <CustomButton
                        disabled={postPDCProcessROMutation.isPending}
                        type={'button'}
                        text={'Cancel'}
                        variant="secondaryButton"
                        onClick={() =>
                          navigate(`/process/pdc-processing?tab=receivables`)
                        }
                      />
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
          </>
        );
      case PDCProcessOpenTypeOptions[1].value /* Cancelled on due date */:
        return (
          <>
            <Formik
              key={selectedType}
              enableReinitialize
              initialValues={{
                date: '',
                processing_type: selectedType,
              }}
              validationSchema={pdcProcessROValidationSchemaCancelled}
              onSubmit={handleSubmit}
            >
              {({ values, errors, touched, handleChange, handleBlur }) => (
                <Form>
                  <div className="row mb-4">
                    <div className="col-12 col-sm-6 mb-3">
                      <SearchableSelect
                        name="process_type"
                        label="Process Type"
                        placeholder="Select Process Type"
                        options={PDCProcessOpenTypeOptions}
                        value={selectedType}
                        onChange={(v) => setSelectedType(v.value)}
                      />
                    </div>
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
                      <p className="muted-text">{pdcRO?.remarks}</p>
                    </div>
                    <div className="d-flex gap-3 ms-auto mb-3 mb-md-0">
                      <CustomButton
                        loading={postPDCProcessROMutation.isPending}
                        disabled={postPDCProcessROMutation.isPending}
                        type={'submit'}
                        text={'Process'}
                      />
                      <CustomButton
                        disabled={postPDCProcessROMutation.isPending}
                        type={'button'}
                        text={'Cancel'}
                        variant="secondaryButton"
                        onClick={() =>
                          navigate(`/process/pdc-processing?tab=receivables`)
                        }
                      />
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
          </>
        );
      case PDCProcessOpenTypeOptions[2].value /* Discount Through Bank */:
        return (
          <>
            <Formik
              key={selectedType}
              enableReinitialize
              initialValues={{
                processing_type: selectedType,
                date: pdcRO?.due_date,
                bank_account_id: pdcRO?.bank?.id,
                discounted_amount: pdcRO?.amount || 0,
                collection_account_id: '',
                collection_amount: '',
                commission_account_id: '',
                commission_amount: '',
                lbd_number: '',
              }}
              validationSchema={
                pdcProcessRODiscountedCollectionValidationSchema
              }
              onSubmit={handleSubmit}
            >
              {({
                values,
                errors,
                touched,
                handleChange,
                handleBlur,
                setFieldValue,
                setFieldTouched,
              }) => (
                <Form>
                  <div className="row mb-4">
                    <div className="col-12 col-sm-6 mb-3">
                      <SearchableSelect
                        name="process_type"
                        label="Process Type"
                        placeholder="Select Process Type"
                        options={PDCProcessOpenTypeOptions}
                        value={selectedType}
                        onChange={(v) => setSelectedType(v.value)}
                      />
                    </div>
                    {/* Date */}
                    <div className="col-12 col-sm-6">
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
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name="bank_account_name"
                        disabled
                        label="Bank Account"
                        value={pdcRO?.bank?.name}
                      />
                    </div>
                    {/* Discounted Amount */}
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        disabled
                        name={'discounted_amount'}
                        required
                        type={'number'}
                        label={'Discounted Amount'}
                        placeholder={'Enter Discounted Amount'}
                        value={values.discounted_amount}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={
                          touched.discounted_amount && errors.discounted_amount
                        }
                      />
                    </div>
                    {/* Collection account */}
                    <div className="col-12 col-sm-6 mb-45">
                      <SearchableSelect
                        name="collection_account_id"
                        required
                        label="Collection Account"
                        placeholder="Select Collection account"
                        options={getAccountsByTypeOptions('general', false)}
                        value={values.collection_account_id}
                        onBlur={() =>
                          setFieldTouched('collection_account_id', true, true)
                        }
                        onChange={(v) =>
                          setFieldValue('collection_account_id', v.value)
                        }
                        error={
                          touched.collection_account_id &&
                          errors.collection_account_id
                        }
                      />
                    </div>
                    {/* Collection Amount */}
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'collection_amount'}
                        required
                        type={'number'}
                        label={'Collection Amount'}
                        placeholder={'Enter Collection Amount'}
                        value={values.collection_amount}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={
                          touched.collection_amount && errors.collection_amount
                        }
                      />
                    </div>
                    {/* Commission account */}
                    <div className="col-12 col-sm-6 mb-45">
                      <SearchableSelect
                        required
                        name="commission_account_id"
                        label="Commission Account"
                        placeholder="Select Commission account"
                        options={getAccountsByTypeOptions('general', false)}
                        value={values.commission_account_id}
                        onBlur={() =>
                          setFieldTouched('commission_account_id', true, true)
                        }
                        onChange={(v) => {
                          setFieldValue('commission_account_id', v.value);
                        }}
                        error={
                          touched.commission_account_id &&
                          errors.commission_account_id
                        }
                      />
                    </div>
                    {/* Commission Amount */}
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'commission_amount'}
                        required
                        type={'number'}
                        label={'Commission Amount'}
                        placeholder={'Enter Commission Amount'}
                        value={values.commission_amount}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={
                          touched.commission_amount && errors.commission_amount
                        }
                      />
                    </div>
                    {/* LBD Number */}
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'lbd_number'}
                        type={'text'}
                        // required
                        label={'LBD Number'}
                        placeholder={'Enter LBD Number'}
                        value={values.lbd_number}
                        onChange={(e) => {
                          // Only allow numbers
                          const numericValue = e.target.value.replace(
                            /[^0-9]/g,
                            ''
                          );
                          const event = {
                            target: {
                              ...e.target,
                              name: 'lbd_number',
                              value: numericValue,
                            },
                          };
                          handleChange(event);
                        }}
                        onBlur={handleBlur}
                        error={touched.lbd_number && errors.lbd_number}
                      />
                    </div>

                    <div className="mb-4">
                      <p className="mb-0">Remarks:</p>
                      <p className="muted-text">{pdcRO?.remarks}</p>
                    </div>
                    <div className="d-flex gap-3 ms-auto mb-3 mb-md-0">
                      <CustomButton
                        loading={postPDCProcessROMutation.isPending}
                        disabled={postPDCProcessROMutation.isPending}
                        type={'submit'}
                        text={'Process'}
                      />
                      <CustomButton
                        disabled={postPDCProcessROMutation.isPending}
                        type={'button'}
                        text={'Cancel'}
                        variant="secondaryButton"
                        onClick={() =>
                          navigate(`/process/pdc-processing?tab=receivables`)
                        }
                      />
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
          </>
        );
      case PDCProcessOpenTypeOptions[3].value /* Collection given to Bank */:
        return (
          <>
            <Formik
              key={selectedType}
              enableReinitialize
              initialValues={{
                date: '',
                bank_account_id: pdcRO?.bank?.id,
                processing_type: selectedType,
              }}
              validationSchema={pdcProcessROValidationSchema}
              onSubmit={handleSubmit}
            >
              {({ values, errors, touched, handleChange, handleBlur }) => (
                <Form>
                  <div className="row mb-4">
                    <div className="col-12 col-sm-6 mb-3">
                      <SearchableSelect
                        name="process_type"
                        label="Process Type"
                        placeholder="Select Process Type"
                        options={PDCProcessOpenTypeOptions}
                        value={selectedType}
                        onChange={(v) => setSelectedType(v.value)}
                      />
                    </div>
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
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name="bank_account_id"
                        disabled
                        label="Bank Account"
                        value={pdcRO?.bank?.name}
                      />
                    </div>
                    {/* Remarks */}
                    <div className="mb-4">
                      <p className="mb-0">Remarks:</p>
                      <p className="muted-text">{pdcRO?.remarks}</p>
                    </div>
                    {/* Buttons */}
                    <div className="d-flex gap-3 ms-auto mb-3 mb-md-0">
                      <CustomButton
                        loading={postPDCProcessROMutation.isPending}
                        disabled={postPDCProcessROMutation.isPending}
                        type={'submit'}
                        text={'Process'}
                      />
                      <CustomButton
                        disabled={postPDCProcessROMutation.isPending}
                        type={'button'}
                        text={'Cancel'}
                        variant="secondaryButton"
                        onClick={() =>
                          navigate(`/process/pdc-processing?tab=receivables`)
                        }
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
        <BackButton url={`/process/pdc-processing?tab=receivables`} />
        <h2 className="screen-title mb-0">PDC Processes</h2>
      </div>
      <div className="d-card py-45 mb-45">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            {renderForm()}
          </div>
        </div>
      </div>
    </>
  );
};

export default ReceivableOpen;
