import { useMutation } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import { showToast } from '../../../Components/Toast/Toast';
import useAutoFocus from '../../../Hooks/useAutoFocus';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { addCostCenterRegister } from '../../../Services/Masters/CostCenterRegister';
import { showErrorToast } from '../../../Utils/Utils';
import { addCostCenterRegisterValidationSchema } from '../../../Utils/Validations/ValidationSchemas';

const NewCostCenterRegister = () => {
  usePageTitle('Cost Center Register - Create');

  const navigate = useNavigate();
  const firstInputFocusRef = useAutoFocus();

  const addCostCenterRegisterMutation = useMutation({
    mutationFn: addCostCenterRegister,
    onSuccess: () => {
      showToast('Cost Center Added!', 'success');
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
    addCostCenterRegisterMutation.mutate(values);
  };

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
              initialValues={{
                type: '',
                group: '',
                description: '',
                default: 0,
              }}
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
                        required
                        ref={firstInputFocusRef}
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
                      loading={addCostCenterRegisterMutation.isPending}
                      disabled={addCostCenterRegisterMutation.isPending}
                      type={'submit'}
                      text={'Save'}
                    />
                    {!addCostCenterRegisterMutation.isPending && (
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

export default NewCostCenterRegister;
