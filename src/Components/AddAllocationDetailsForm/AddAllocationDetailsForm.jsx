import { ErrorMessage, Form, Formik } from 'formik';
import React, { useState } from 'react';
import * as Yup from 'yup';
import CustomButton from '../CustomButton';
import CustomInput from '../CustomInput';
import SearchableSelect from '../SearchableSelect/SearchableSelect';
import { formatNumberForDisplay } from '../../Utils/Utils';

const AddAllocationDetailsForm = ({
  balanceAmount = 0,
  telexTransferAmount = 0,
  bankOptions = [],
  docTypeOptions = [],
  cityOptions = [],
  getAccountsByTypeOptions = [],
  onSuccess,
  onCancel,
  inPopup = false,
  allocationData = null,
}) => {
  const handleSubmit = (values) => {
    if (onSuccess) {
      onSuccess(values);
    }
  };

  const validationSchema = Yup.object().shape({
    ledger: Yup.string().required('Ledger is required'),
    account_id: Yup.string().required('Account is required'),
    amount: Yup.number()
      .required('Amount is required')
      .positive('Amount must be positive')
      .typeError('Amount must be a number')
      .max(balanceAmount, 'Amount cannot exceed balance amount'),
    telex_transfer_amount: Yup.number()
      .required('Telex Transfer Amount is required')
      .positive('Telex Transfer Amount must be positive')
      .typeError('Telex Transfer Amount must be a number'),
    // document_type_id: Yup.string().required('Document Type is required'),
    // number: Yup.string().required('Number is required'),
    // bank: Yup.string().required('Bank is required'),
    // code: Yup.string()
    //   .required('Code is required')
    //   .matches(
    //     /^[a-zA-Z0-9]+$/,
    //     'Code must only contain alphanumeric characters'
    //   ),
    // city_id: Yup.string().required('City is required'),
  });

  // Prepare initial values based on whether we're in edit mode or create mode
  const getInitialValues = () => {
    if (allocationData) {
      // Edit mode - use allocationData values
      return {
        id: allocationData.id || crypto.randomUUID(),
        ledger: allocationData.ledger || '',
        account_id: allocationData.account_id || '',
        account_name: allocationData.account_details?.title || allocationData.account_name || '',
        telex_transfer_amount:
          allocationData.telex_transfer_amount || telexTransferAmount,
        amount: allocationData.amount || '',
        balance_amount: allocationData.balance_amount || balanceAmount,
        document_type_id: allocationData.document_type_id || '',
        document_type: allocationData.document_type || '',
        number: allocationData.number || '',
        bank: allocationData.bank_id || allocationData.bank || '',
        bank_name: allocationData.bank_name || '',
        code: allocationData.code || '',
        city_id: allocationData.city_id || '',
        city: allocationData.city || '',
        description: allocationData.description || '',
      };
    }

    // Create mode - use default values
    return {
      id: crypto.randomUUID(),
      ledger: '',
      account_id: '',
      account_name: '',
      telex_transfer_amount: telexTransferAmount,
      amount: '',
      balance_amount: balanceAmount,
      document_type_id: '',
      document_type: '',
      number: '',
      bank: '',
      bank_name: '',
      code: '',
      city_id: '',
      city: '',
      description: '',
    };
  };

  return (
    <div className={`${inPopup ? 'px-4 pt-2' : 'd-card'}`}>
      <div className="row">
        <div
          className={`${inPopup ? 'col-12' : 'col-12 col-lg-10 col-xl-9 col-xxl-7'
            }`}
        >
          <Formik
            initialValues={getInitialValues()}
            validationSchema={validationSchema}
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
                  <div className="col-12 col-sm-6 mb-45">
                    <SearchableSelect
                      label="Ledger"
                      name="ledger"
                      options={[
                        { label: 'PL', value: 'party' },
                        { label: 'GL', value: 'general' },
                        { label: 'WIC', value: 'walkin' },
                      ]}
                      value={values.ledger}
                      onChange={(e) => {
                        setFieldValue('ledger', e.value);
                      }}
                      placeholder="Select Ledger"
                    />
                    <ErrorMessage
                      name="ledger"
                      component="div"
                      className="input-error-message text-danger"
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-45">
                    <SearchableSelect
                      label="Account"
                      name="account_id"
                      options={getAccountsByTypeOptions(values.ledger)}
                      value={values.account_id}
                      onChange={(e) => {
                        setFieldValue('account_id', e.value);
                        setFieldValue('account_name', e.label);
                      }}
                      placeholder="Select Account"
                    />
                    <ErrorMessage
                      name="account_id"
                      component="div"
                      className="input-error-message text-danger"
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      name="telex_transfer_amount"
                      type="number"
                      label="Telex Transfer Amount"
                      disabled={true}
                      placeholder="Enter Telex Transfer Amount"
                      value={formatNumberForDisplay(values.telex_transfer_amount)}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={
                        touched.telex_transfer_amount &&
                        errors.telex_transfer_amount
                      }
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      name="amount"
                      type="number"
                      label="Amount"
                      placeholder="Enter Amount"
                      value={formatNumberForDisplay(values.amount)}
                      onChange={(e) => {
                        const amountValue = parseFloat(e.target.value) || 0;
                        const telexAmount = parseFloat(values.telex_transfer_amount) || 0;
                        setFieldValue('amount', e.target.value);
                        setFieldValue(
                          'balance_amount',
                          telexAmount - amountValue
                        );
                      }}
                      onBlur={handleBlur}
                      error={touched.amount && errors.amount}
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      name="balance_amount"
                      type="number"
                      label="Balance Amount"
                      disabled={true}
                      value={formatNumberForDisplay(values.balance_amount)}
                      readOnly
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <SearchableSelect
                      label="Document Type"
                      name="document_type_id"
                      value={values.document_type_id}
                      options={docTypeOptions}
                      placeholder="Select Document Type"
                      onChange={(e) => {
                        setFieldValue('document_type_id', e.value);
                        setFieldValue('document_type', e.label);
                      }}
                    />
                    <ErrorMessage
                      name="document_type_id"
                      component="div"
                      className="input-error-message text-danger"
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <CustomInput
                      name="number"
                      type="text"
                      label="Number"
                      placeholder="Enter Number"
                      value={values.number}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.number && errors.number}
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <SearchableSelect
                      label="Bank"
                      name="bank"
                      value={values.bank}
                      options={bankOptions}
                      placeholder="Select Bank"
                      onChange={(e) => {
                        setFieldValue('bank', e.value);
                        setFieldValue('bank_name', e.label);
                      }}
                      onBlur={handleBlur}
                    />
                    <ErrorMessage
                      name="bank"
                      component="div"
                      className="input-error-message text-danger"
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    {/* Will only accept alpha numeric characters */}
                    <CustomInput
                      name="code"
                      type="text"
                      label="Code"
                      placeholder="Alphanumeric characters only"
                      value={values.code}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.code && errors.code}
                    />
                  </div>
                  <div className="col-12 col-sm-6 mb-3">
                    <SearchableSelect
                      label="City"
                      name="city_id"
                      options={cityOptions}
                      placeholder="Select City"
                      value={values.city_id}
                      onChange={(e) => {
                        setFieldValue('city_id', e.value);
                        setFieldValue('city', e.label);
                      }}
                    />
                    <ErrorMessage
                      name="city_id"
                      component="div"
                      className="input-error-message text-danger"
                    />
                  </div>
                  <div className="col-12 mb-3">
                    <CustomInput
                      name="description"
                      type="textarea"
                      label="Description"
                      placeholder="Enter Description"
                      value={values.description}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.description && errors.description}
                    />
                  </div>
                </div>
                <div className="d-flex gap-3 ms-auto">
                  <CustomButton
                    type="submit"
                    text={allocationData ? 'Update' : 'Add'}
                  />
                  <CustomButton
                    variant="secondaryButton"
                    text="Cancel"
                    type="button"
                    onClick={onCancel}
                  />
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default AddAllocationDetailsForm;
