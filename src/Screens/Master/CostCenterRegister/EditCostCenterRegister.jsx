import { useMutation, useQuery } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import React from 'react';
import Skeleton from 'react-loading-skeleton';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast';
import useAutoFocus from '../../../Hooks/useAutoFocus';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import {
  updateCostCenterRegister,
  viewCostCenterRegister,
} from '../../../Services/Masters/CostCenterRegister';
import { showErrorToast } from '../../../Utils/Utils';
import { addCostCenterRegisterValidationSchema } from '../../../Utils/Validations/ValidationSchemas';

const EditCostCenterRegister = () => {
  const { id } = useParams();
  usePageTitle('Cost Center Register - Edit');

  const navigate = useNavigate();
  const firstInputFocusRef = useAutoFocus();

  // Queries and Mutations
  const {
    data: costCenterRegister,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['costCenterRegisterDetails', id],
    queryFn: () => viewCostCenterRegister(id),
    refetchOnWindowFocus: false,
    retry: 1,
    gcTime: 0,
  });

  const editCostCenterRegisterMutation = useMutation({
    mutationFn: (formData) => updateCostCenterRegister(id, formData),
    onSuccess: () => {
      showToast('Cost Center Updated!', 'success');
      setTimeout(() => {
        navigate(-1);
      }, 300);
    },
    onError: (error) => {
      console.error('Error adding Cost Center', error);
      showErrorToast(error);
    },
  });

  const handleSubmit = (values) => {
    editCostCenterRegisterMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div>
        <div className="d-flex flex-column gap-2 mb-4">
          <BackButton />
          <h2 className="screen-title m-0 d-inline">Cost Center Register</h2>
        </div>

        <div className="d-card ">
          <div className="row">
            <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
              <div className="row mb-4">
                {Array.from({ length: 2 }).map((_, i) => (
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
                <div
                  className="col-12 mb-3 align-items-center"
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
          <h2 className="screen-title m-0 d-inline">Cost Center Register</h2>
        </div>

        <div className="d-card ">
          <div className="row">
            <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
              <div className="row mb-3">Unable to fetch</div>
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
        <h2 className="screen-title m-0 d-inline">Cost Center Register</h2>
      </div>

      <div className="d-card ">
        <div className="row">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
            <Formik
              initialValues={costCenterRegister}
              validationSchema={addCostCenterRegisterValidationSchema}
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
                    {/* Type */}
                    <div className="col-12 col-sm-6 mb-45">
                      <SearchableSelect
                        label={'Type'}
                        name="type"
                        ref={firstInputFocusRef}
                        required
                        options={[
                          {
                            label: 'Detail',
                            value: 'detail',
                          },
                          {
                            label: 'Group',
                            value: 'group',
                          },
                        ]}
                        value={values.type}
                        onChange={(v) => {
                          setFieldValue('type', v.value);
                        }}
                        placeholder={'Select Type'}
                      />
                      <ErrorMessage
                        name="type"
                        component="div"
                        className="input-error-message text-danger"
                      />
                    </div>
                    {/* Group */}
                    <div className="col-12 col-sm-6 mb-3 mt-auto">
                      <CustomInput
                        label={'Group'}
                        type={'text'}
                        name={'group'}
                        required
                        placeholder={'Enter Group'}
                        value={values.group}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.group && errors.group}
                      />
                    </div>
                    {/* Description */}
                    <div className="col-12 mb-3 mt-auto">
                      <CustomInput
                        label={'Description'}
                        type={'textarea'}
                        name={'description'}
                        required
                        placeholder={'Enter Description'}
                        value={values.description}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.description && errors.description}
                      />
                    </div>
                    {/* Default */}
                    <div className="col-12 checkbox-wrapper mb-4">
                      <label className="checkbox-container align-items-start">
                        <input
                          onChange={(v) => {
                            setFieldValue('default', v.target.checked ? 1 : 0);
                          }}
                          checked={values.default}
                          type="checkbox"
                          name={'default'}
                        />
                        <span className="custom-checkbox"></span>
                        Default
                      </label>
                    </div>
                  </div>
                  {/* Form Buttons */}
                  <div className="d-flex gap-3 ms-auto mb-3 mb-md-0">
                    <CustomButton
                      loading={editCostCenterRegisterMutation.isPending}
                      disabled={editCostCenterRegisterMutation.isPending}
                      type={'submit'}
                      text={'Update'}
                    />
                    {!editCostCenterRegisterMutation.isPending && (
                      <CustomButton
                        onClick={() => navigate(-1)}
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
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

export default EditCostCenterRegister;
