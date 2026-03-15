import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import BackButton from '../../../../Components/BackButton';
import CustomButton from '../../../../Components/CustomButton';
import CustomInput from '../../../../Components/CustomInput';
import SearchableSelect from '../../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../../Components/Toast/Toast';
import { usePageTitle } from '../../../../Hooks/usePageTitle';
import {
  createBankDetailsDeal,
  getPartyAccounts,
} from '../../../../Services/Transaction/TtrRegister';
import { showErrorToast } from '../../../../Utils/Utils';

// Constants
const INITIAL_VALUES = {
  date: '',
  credit_party_id: '',
  bank_name: '',
  bank_account: '',
  remarks: '',
  tmn_amount: '',
};

const VALIDATION_SCHEMA = Yup.object().shape({
  credit_party_id: Yup.string().required('Credit Party is required'),
  tmn_amount: Yup.number()
    .required('TMN Amount is required')
    .positive('Amount must be positive'),
});

const NewBankDetail = () => {
  usePageTitle('New Bank Details');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Get current date in YYYY-MM-DD format
  const currentDate = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  // Fetch party accounts
  const { data: partyAccounts = [], isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['partyAccounts'],
    queryFn: getPartyAccounts,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Transform party accounts for select options
  const partyOptions = useMemo(
    () =>
      partyAccounts.map((item) => ({
        value: item.id,
        label: item.title,
      })),
    [partyAccounts]
  );

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createBankDetailsDeal,
    onSuccess: () => {
      showToast('Bank Details Created Successfully!', 'success');

      // Invalidate relevant queries
      queryClient.invalidateQueries(['getTTRListing']);
      queryClient.invalidateQueries(['getTTRAllocationListing']);

      // Redirect to listing page with bank_details tab selected
      navigate('/transactions/ttr-register', {
        state: { selectedTab: 'bank_details' },
        replace: true,
      });
    },
    onError: (error) => {
      console.error('Error creating bank details:', error);
      showErrorToast(error);
    },
  });

  // Handle form submission
  const handleSubmit = useCallback(
    (values) => {
      createMutation.mutate(values);
    },
    [createMutation]
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    navigate('/transactions/ttr-register', {
      state: { selectedTab: 'bank_details' },
    });
  }, [navigate]);

  // Handle back button
  const handleBack = useCallback(() => {
    navigate('/transactions/ttr-register', {
      state: { selectedTab: 'bank_details' },
    });
  }, [navigate]);

  // Initial values with current date
  const formInitialValues = useMemo(
    () => ({
      ...INITIAL_VALUES,
      date: currentDate,
    }),
    [currentDate]
  );

  return (
    <div className="container-fluid">
      {/* Header Section */}
      <div className="d-flex flex-column gap-2 mb-4">
        <BackButton handleBack={handleBack} />
        <h2 className="screen-title m-0">New Bank Details</h2>
      </div>

      {/* Form Section */}
      <div className="d-card">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
              initialValues={formInitialValues}
              validationSchema={VALIDATION_SCHEMA}
              onSubmit={handleSubmit}
              enableReinitialize
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
                  <div className="row">
                    {/* Date Field */}
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name="date"
                        type="date"
                        label="Date"
                        placeholder="dd/mm/yyyy"
                        value={values.date}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </div>

                    {/* Credit Party Field */}
                    <div className="col-12 col-sm-6 mb-3">
                      <SearchableSelect
                        label="Credit Party"
                        name="credit_party_id"
                        options={partyOptions}
                        value={values.credit_party_id}
                        onChange={(option) =>
                          setFieldValue('credit_party_id', option?.value || '')
                        }
                        onBlur={handleBlur}
                        placeholder="Select Credit Party"
                        isLoading={isLoadingAccounts}
                        isClearable
                        required
                        error={touched.credit_party_id && errors.credit_party_id}
                      />

                    </div>

                    {/* Bank Name Field */}
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name="bank_name"
                        type="text"
                        label="Bank Name"
                        placeholder="Enter Bank Name"
                        value={values.bank_name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </div>

                    {/* Bank Account Field */}
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name="bank_account"
                        type="text"
                        label="Bank Account"
                        placeholder="Enter Bank Account Number"
                        value={values.bank_account}
                        onChange={(e) => {
                          if (/^\d*$/.test(e.target.value)) {
                            handleChange(e);
                          }
                        }}
                        onBlur={handleBlur}
                      />
                    </div>

                    {/* TMN Amount Field */}
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name="tmn_amount"
                        type="number"
                        label="TMN Amount"
                        placeholder="Enter TMN Amount"
                        value={values.tmn_amount}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.tmn_amount && errors.tmn_amount}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    {/* Remarks Field */}
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name="remarks"
                        type="text"
                        label="Remarks"
                        placeholder="Enter Remarks (Optional)"
                        value={values.remarks}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex gap-3 ms-auto">
                    <CustomButton
                      type="submit"
                      text="Save"
                      loading={createMutation.isPending}
                      disabled={createMutation.isPending}
                    />
                    <CustomButton
                      variant="secondaryButton"
                      text="Cancel"
                      type="button"
                      onClick={handleCancel}
                      disabled={createMutation.isPending}
                    />
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewBankDetail;
