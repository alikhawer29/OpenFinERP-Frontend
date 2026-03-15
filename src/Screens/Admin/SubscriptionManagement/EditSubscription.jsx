import { ErrorMessage, Form, Formik } from 'formik';
import React from 'react';
import { FaDollarSign } from 'react-icons/fa6';
import Skeleton from 'react-loading-skeleton';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { addPackageValidationSchema } from '../../../Utils/Validations/ValidationSchemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { editPackage, viewPackage } from '../../../Services/Admin/Package';
import { showToast } from '../../../Components/Toast/Toast';
import { showErrorToast } from '../../../Utils/Utils';

const EditSubscription = () => {
  usePageTitle('Subscription - Edit');

  const navigate = useNavigate();
  const { id } = useParams();
  const { state } = useLocation();
  const activeTab = state?.activeTab ?? '';
  const queryClient = useQueryClient();

  // Queries and Mutations
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['PackageDetails', id],
    queryFn: () => viewPackage(id),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const editPackageMutation = useMutation({
    mutationFn: (formData) => editPackage(id, formData),
    onSuccess: () => {
      showToast('Package Updated!', 'success');
      queryClient.invalidateQueries('PackageDetails');
      setTimeout(() => {
        navigate('/admin/subscription-management', {
          state: {
            switchToCustomTab: activeTab === 'custom',
            refreshData: true,
          },
        });
      }, 300);
    },
    onError: (error) => {
      console.error('Error updating Currency', error);
      showErrorToast(error);
    },
  });

  const handleSubmit = (values) => {
    editPackageMutation.mutate(values);
  };
  if (isLoading) {
    return (
      <div>
        <div className="d-flex flex-column gap-2 mb-4">
          <BackButton />
          <h2 className="screen-title m-0 d-inline">Edit Subscription</h2>
        </div>

        <div className="d-card ">
          <div className="row">
            <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
              <div className="row mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="col-12 col-sm-6 mb-3  align-items-center"
                    style={{ height: 90 }}
                  >
                    <Skeleton
                      style={{ marginTop: 28 }}
                      duration={1}
                      width={'100%'}
                      baseColor="#ddd"
                      height={43}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (isError) {
    return (
      <div>
        <div className="d-flex flex-column gap-2 mb-4">
          <BackButton />
          <h2 className="screen-title m-0 d-inline">Edit Subscription</h2>
        </div>

        <div className="d-card ">
          <div className="row">
            <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
              <div className="row mb-4">{error.message}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="d-flex flex-column gap-2 mb-4">
        <BackButton />
        <h2 className="screen-title m-0 d-inline">
          Edit {activeTab === 'custom' ? 'Custom Subscription' : 'Subscription'}
        </h2>
      </div>

      <div className="d-card ">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
              initialValues={{
                title: data?.title || '',
                no_of_users: data?.no_of_users || '',
                branches: data?.branches || '',
                price_monthly: data?.price_monthly || '',
                price_yearly: data?.price_yearly || '',
                type: data?.type,
                user_id: data?.user_id || '',
              }}
              validationSchema={addPackageValidationSchema}
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
                        name={'title'}
                        type={'text'}
                        required
                        label={'Subscription Name'}
                        placeholder={'Enter Name'}
                        value={values.title}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.title && errors.title}
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'no_of_users'}
                        type={'number'}
                        required
                        label={'Number of Users'}
                        // placeholder={''}
                        value={values.no_of_users}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.no_of_users && errors.no_of_users}
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-45">
                      <CustomInput
                        name={'branches'}
                        type={'number'}
                        required
                        label={'Number of Branches'}
                        placeholder={'Enter Number of Branches'}
                        value={values.branches}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.branches && errors.branches}
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'price_monthly'}
                        type={'number'}
                        required
                        label={'Price Monthly'}
                        rightIcon={FaDollarSign}
                        value={values.price_monthly}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.price_monthly && errors.price_monthly}
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'price_yearly'}
                        type={'number'}
                        required
                        label={'Price Yearly'}
                        rightIcon={FaDollarSign}
                        value={values.price_yearly}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.price_yearly && errors.price_yearly}
                      />
                    </div>
                  </div>
                  <div className="d-flex gap-3 ms-auto mb-3 mb-md-0">
                    <CustomButton
                      loading={editPackageMutation.isPending}
                      disabled={editPackageMutation.isPending}
                      type={'submit'}
                      text={'Update'}
                    />
                    {!editPackageMutation.isPending && (
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() => navigate(-1)}
                      />
                    )}
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

export default EditSubscription;
