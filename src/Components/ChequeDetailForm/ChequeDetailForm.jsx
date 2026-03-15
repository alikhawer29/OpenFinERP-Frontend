import { useQuery } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { useState, useEffect, useRef } from 'react';
import { getChequeNumbersByBank } from '../../Services/Transaction/AccountToAccount';
import { useBanks } from '../../Hooks/useBanks';
import CustomButton from '../CustomButton';
import CustomInput from '../CustomInput';
import SearchableSelect from '../SearchableSelect/SearchableSelect';

const ChequeDetailForm = ({
  inPopup = false,
  settleThru,
  voucherDate,
  onSuccess,
  onCancel,
  initialValues,
}) => {
  
  const [selectedBank, setSelectedBank] = useState(initialValues?.bank_id || '');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [chequeNotFound, setChequeNotFound] = useState(false);
  const formikRef = useRef();

  // Update selectedBank when initialValues change
  useEffect(() => {
    if (initialValues?.bank_id) {
      setSelectedBank(initialValues.bank_id);
      setIsInitialLoad(false);
    } else if (!initialValues) {
      // Reset if initialValues is undefined (data not loaded yet)
      setSelectedBank('');
      setIsInitialLoad(true);
    }
  }, [initialValues?.bank_id, initialValues]);

  // Preserve cheque number when bank changes back to initial bank
  useEffect(() => {
    if (selectedBank && initialValues?.bank_id === selectedBank && initialValues?.cheque_number) {
      // Bank is back to initial value, restore the cheque number
      // This will be handled by Formik's enableReinitialize
    }
  }, [selectedBank, initialValues?.bank_id, initialValues?.cheque_number]);

  // Reset selectedBank when user changes bank selection
  const handleBankChange = (v, setFieldValue) => {
    setFieldValue('bank_id', v.value);
    setSelectedBank(v.value);
    // Clear cheque number when bank changes, unless it's the initial value for this bank or initial load
    if (!isInitialLoad && initialValues?.bank_id !== v.value) {
      setFieldValue('cheque_number', '');
    }
    setIsInitialLoad(false);
  };

  const handleSubmit = (values) => {
    onSuccess(values);
  };

  const { bankOptions } = useBanks();

  // Fetch cheque numbers when a bank is selected
  const {
    data: chequeNumbersData,
    isloading: isLoadingChequeNumbers,
    isError: isErrorChequeNumbers,
    error: errorChequeNumbers,
  } = useQuery({
    queryKey: ['chequeNumbers', selectedBank],
    queryFn: () => getChequeNumbersByBank(selectedBank),
    enabled: !!selectedBank,
  });

  // Handle timing issue where cheque number needs to be set after options are loaded
  useEffect(() => {
    if (
      selectedBank && 
      initialValues?.cheque_number && 
      !isLoadingChequeNumbers && 
      chequeNumbersData?.length > 0 &&
      formikRef.current
    ) {
      // Skip if the form already has the correct value
      if (formikRef.current.values.cheque_number == initialValues.cheque_number) {
        setChequeNotFound(false);
        return;
      }
      
      // Check if the current cheque number value matches any option
      const matchingOption = chequeNumbersData.find(
        (cheque) => cheque.id == initialValues.cheque_number // Use loose equality to handle string/number conversion
      );

    
      
      if (matchingOption && formikRef.current.values.cheque_number !== initialValues.cheque_number) {
        // Set the cheque number if it's not already set correctly
        formikRef.current.setFieldValue('cheque_number', initialValues.cheque_number);
        setChequeNotFound(false);
      } else if (!matchingOption && !formikRef.current.values.cheque_number) {
        // Only clear if no matching option found AND field is already empty
        // Don't clear if we have a value that's just not in the current options
        setChequeNotFound(true);
      }
    }
  }, [selectedBank, initialValues?.cheque_number, isLoadingChequeNumbers, chequeNumbersData]);

  const getChequeNumbersByBankOptions = () => {
    if (!selectedBank) {
      return [{ label: 'Select Bank First', value: null, isDisabled: true }];
    }
    if (isLoadingChequeNumbers) {
      return [{ label: 'Loading...', value: null, isDisabled: true }];
    }
    if (isErrorChequeNumbers) {
      console.error('Unable to fetch cheque numbers', errorChequeNumbers);
      return [{ label: 'Unable to fetch cheque numbers', value: null }];
    }
    const options = (
      chequeNumbersData?.map((x) => ({
        ...x,
        label: x?.cheque_number,
        value: x?.id,
      })) || []
    );
    
    // If we have an initial cheque number that's not in the options, append it
    if (initialValues?.cheque_number && !options.find(opt => opt.value == initialValues.cheque_number)) {
      // Try to find the cheque in the original data to get its number
      const originalCheque = chequeNumbersData?.find(c => c.id == initialValues.cheque_number);
      if (originalCheque) {
        options.unshift({
          ...originalCheque,
          label: originalCheque?.cheque_number,
          value: originalCheque?.id,
        });
      } else {
        // If not found in current data, create an option from initialValues
        // Use the cheque_number_label if available, otherwise fallback to ID
        const chequeLabel = initialValues?.cheque_number_label || `Cheque ${initialValues.cheque_number}`;
        options.unshift({
          label: chequeLabel,
          value: initialValues.cheque_number,
        });
      }
    }
  
    return options;
  };

  return (
    <>
      <div className={`${inPopup ? 'px-4 pt-2' : 'd-card'}`}>
        {inPopup ? <h2 className="screen-title-body">Cheque Detail</h2> : null}
        <div className="row">
          <div
            className={`${
              inPopup ? 'col-12' : 'col-12 col-lg-10 col-xl-9 col-xxl-7'
            }`}
          >
            <Formik
              innerRef={formikRef}
              enableReinitialize={true}
              initialValues={{
                bank_id: initialValues?.bank_id || '',
                cheque_number: initialValues?.cheque_number || '',
                due_date: initialValues?.due_date || 
                  (settleThru === 'bank'
                    ? new Date().toLocaleDateString('en-CA')
                    : settleThru === 'pdc'
                    ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    : ''),
              }}
              onSubmit={handleSubmit}
            >
              {({
                values,
                errors,
                touched,
                handleChange,
                handleBlur,
                setFieldValue,
              }) => {
                
                return (
                <Form>
                  <div className="row mb-4">
                    <div className="col-12 col-sm-6 mb-3">
                      <SearchableSelect
                        name={'bank_id'}
                        label={'Bank'}
                        options={bankOptions}
                        placeholder={'Select Bank'}
                        value={values.bank_id}
                        onChange={(v) => {
                          handleBankChange(v, setFieldValue);
                        }}
                        onBlur={handleBlur}
                        error={touched.bank_id && errors.bank_id}
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <SearchableSelect
                        name={'cheque_number'}
                        label={'Cheque Number'}
                        options={getChequeNumbersByBankOptions()}
                        placeholder={'Select Cheque Number'}
                        value={values.cheque_number}
                        onChange={(v) => {
                          setFieldValue('cheque_number', v.value);
                        }}
                        onBlur={handleBlur}
                        error={touched.cheque_number && errors.cheque_number}
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'due_date'}
                        type={'date'}
                        label={'Due Date'}
                        required
                        placeholder={'Enter Due Date'}
                        value={values.due_date}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.due_date && errors.due_date}
                      />
                    </div>
                  </div>
                  <div className="d-flex gap-3 ms-auto mb-3 mb-md-0">
                    <CustomButton
                      //   loading={addBeneficiaryRegisterMutation.isPending}
                      //   disabled={addBeneficiaryRegisterMutation.isPending}
                      type={'submit'}
                      text={'Save'}
                    />
                    {/* {!addBeneficiaryRegisterMutation.isPending && ( */}
                    <CustomButton
                      variant={'secondaryButton'}
                      text={'Cancel'}
                      type={'button'}
                      onClick={onCancel}
                    />
                    {/* )} */}
                  </div>
                </Form>
                );
              }}
            </Formik>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChequeDetailForm;
