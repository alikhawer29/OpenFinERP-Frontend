import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as Yup from 'yup';
import BackButton from '../../../../Components/BackButton';
import CustomButton from '../../../../Components/CustomButton';
import CustomInput from '../../../../Components/CustomInput';
import SearchableSelect from '../../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../../Components/Toast/Toast';
import { usePageTitle } from '../../../../Hooks/usePageTitle';
import {
  getPartyAccounts,
  getTTRBankDetails,
  updateBankDetailsDeal,
} from '../../../../Services/Transaction/TtrRegister';
import { showErrorToast } from '../../../../Utils/Utils';

const TTRRegisterEditBankDetails = () => {
  usePageTitle('Edit Bank Details');
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [minAmount, setMinAmount] = useState(0);
  const [unAllocatedAmount, setUnAllocatedAmount] = useState(0);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['getTTRBankDetails', id],
    queryFn: () => getTTRBankDetails(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const bankDetailsData = data || {}; // Ensure it's always an object

  useEffect(() => {
    if (bankDetailsData?.total_allocated) {
      setMinAmount(bankDetailsData?.total_allocated);
      setUnAllocatedAmount(
        bankDetailsData?.tmn_amount - bankDetailsData?.total_allocated
      );
    }
  }, [bankDetailsData?.total_allocated]);

  if (isError) {
    console.error('Error fetching bank details:', error);
  }

  const validationSchema = Yup.object().shape({
    credit_party_id: Yup.string().required('Credit Party is required'),
    tmn_amount: Yup.number().required('TMN Amount is required'),
  });

  const handleSubmit = (values) => {
    updateMutation.mutate(values);
  };

  const { data: partyAccounts = [], isSuccess } = useQuery({
    queryKey: ['partyAccounts'],
    queryFn: getPartyAccounts,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Mutation: Update Bank Details
  const updateMutation = useMutation({
    mutationFn: (data) => updateBankDetailsDeal(id, data),
    onSuccess: () => {
      showToast('Updated Successfully!', 'success');

      // Invalidate relevant queries
      queryClient.invalidateQueries(['getTTRListing']);
      queryClient.invalidateQueries(['getTTRAllocationListing']);
      queryClient.invalidateQueries(['ttr-bank-details']);

      setTimeout(() => {
        navigate('/transactions/ttr-register', {
          state: { selectedTab: 'bank_details' },
        });
      }, 300);
    },
    onError: (error) => {
      console.error('Error updating bank details', error);
      showErrorToast(error);
    },
  });

  return (
    <>
      <div className="d-flex flex-column gap-2 mb-4">
        <BackButton />
        <h2 className="screen-title m-0 d-inline">Edit Bank Details</h2>
      </div>

      <div className="d-card">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
              enableReinitialize
              initialValues={{
                date: bankDetailsData?.date || date || '',
                credit_party_id: bankDetailsData?.credit_party_id || '',
                bank_name: bankDetailsData?.bank_name || '',
                bank_account: bankDetailsData?.bank_account || '',
                remarks: bankDetailsData?.remarks || '',
                tmn_amount: bankDetailsData?.tmn_amount || '',
              }}
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

                    <div className="col-12 col-sm-6 mb-3">
                      <SearchableSelect
                        label="Credit Party"
                        name="credit_party_id"
                        options={partyAccounts?.map((item) => ({
                          value: item.id,
                          label: item.title,
                        }))}
                        value={values.credit_party_id}
                        onChange={(v) =>
                          setFieldValue('credit_party_id', v.value)
                        }
                        placeholder="Select Account"
                        error={touched.credit_party_id && errors.credit_party_id}
                      />
                    </div>

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

                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name="bank_account"
                        type="text"
                        label="Bank Account"
                        placeholder="Enter Bank Account"
                        value={values.bank_account}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </div>

                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name="remarks"
                        type="text"
                        label="Remarks"
                        placeholder="Enter Remarks"
                        value={values.remarks}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </div>

                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name="tmn_amount"
                        type="number"
                        label="TMN Amount"
                        placeholder="Enter TMN Amount"
                        value={values.tmn_amount}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        min={minAmount}
                        error={touched.tmn_amount && errors.tmn_amount}
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name="allocateds_amount"
                        type="number"
                        label="Allocated Amount"
                        value={minAmount}
                        disabled={true}
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name="unallocateds_amount"
                        type="number"
                        label="Unallocated Amount"
                        value={unAllocatedAmount}
                        disabled={true}
                      />
                    </div>
                  </div>

                  <div className="d-flex gap-3 ms-auto">
                    <CustomButton type="submit" text="Save" />
                    <CustomButton
                      variant="secondaryButton"
                      text="Cancel"
                      type="button"
                      onClick={() => {
                        navigate('/transactions/ttr-register', {
                          state: { selectedTab: 'bank_details' },
                        });
                      }}
                    />
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </>
  );
};

export default TTRRegisterEditBankDetails;
