import { Form, Formik } from 'formik';
import React, { useState } from 'react';
import CustomButton from '../../Components/CustomButton';
import CustomInput from '../../Components/CustomInput';
import CustomModal from '../../Components/CustomModal';
import useUserStore from '../../Stores/UserStore';
import { isNullOrEmpty } from '../../Utils/Utils';
import {
  changePasswordSchema,
  editAdminProfileSchema,
  editProfileSchema,
} from '../../Utils/Validations/ValidationSchemas';
import { useMutation } from '@tanstack/react-query';
import { passwordUpdate, profileUpdate } from '../../Services/Admin/Profile';
import { showToast } from '../../Components/Toast/Toast';
import { PulseLoader } from 'react-spinners';
import { usePageTitle } from '../../Hooks/usePageTitle';
import PhoneInput, { parsePhoneNumber } from 'react-phone-number-input';

const AdminProfile = () => {
  usePageTitle('My Profile');

  let { user } = useUserStore();
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const setUser = useUserStore((state) => state.setUser);

  const updateProfileMutation = useMutation({
    mutationFn: profileUpdate,
    onSuccess: (value) => {
      setUser(value.detail);
      showToast('Profile Updated Successfully', 'success');
      setEditProfileModal(false);
    },
    onError: (error) => {
      console.error('Failed to update profile', error);
      if (!isNullOrEmpty(error.errors?.email)) {
        showToast(error.errors.email[0], 'error');
      }
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: passwordUpdate,
    onSuccess: () => {
      showToast('Password Updated Successfully', 'success');
      setChangePasswordModal(false);
    },
    onError: (error) => {
      console.error('Failed to update password', error);
      if (!isNullOrEmpty(error.errors?.email)) {
        showToast(error.errors.email[0], 'error');
      }
      showToast(error.message, 'error');
    },
  });

  const handleEditProfileSubmit = (values) => {
    let parsedMobileNumber;
    if (values.phone?.length > 3) {
      parsedMobileNumber = parsePhoneNumber(values.phone, 'US');
    }

    let finalData = {
      ...values,
      ...(parsedMobileNumber && {
        phone: parsedMobileNumber.nationalNumber,
        country_code: parsedMobileNumber
          ? `+${parsedMobileNumber.countryCallingCode}`
          : '',
      }),
    };

    updateProfileMutation.mutate(finalData);
  };

  const handleChangePasswordSubmit = (values) => {
    updatePasswordMutation.mutate(values);
  };

  return (
    <>
      <h2 className="screen-title">Profile</h2>
      <div className="d-card py-45 d-flex justify-content-between">
        <div className="row flex-grow-1">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7 mb-4">
            {[
              {
                label: 'User Name',
                value: user?.first_name,
              },
              {
                label: 'Phone Number.',
                value: user?.phone_number,
              },
              {
                label: 'Email Address',
                value: user?.email,
              },
            ].map((x, i) => {
              if (isNullOrEmpty(x.value)) return null;
              return (
                <div key={i} className="mb-4">
                  <p className="detail-title detail-label-color mb-1">
                    {x.label}
                  </p>
                  <p className="detail-text wrapText mb-0">{x.value}</p>
                </div>
              );
            })}
            <div className="d-flex mt-45">
              <CustomButton
                text={'Edit Profile'}
                onClick={() => setEditProfileModal(true)}
              />
            </div>
          </div>
        </div>
        <div className="d-flex">
          <CustomButton
            text={'Change Password'}
            onClick={() => setChangePasswordModal(true)}
          />
        </div>
      </div>
      {/* Edit Profile Modal  */}
      <CustomModal
        show={editProfileModal}
        close={() => setEditProfileModal(false)}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle">Edit Profile</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{ ...user }}
            validationSchema={editAdminProfileSchema}
            onSubmit={handleEditProfileSubmit}
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
                <div className="mb-45">
                  <CustomInput
                    name={'first_name'}
                    type={'text'}
                    required
                    label={'First Name'}
                    placeholder={'Enter First Name'}
                    value={values.first_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.first_name && errors.first_name}
                  />
                </div>
                <div className="mb-45">
                  <CustomInput
                    name={'last_name'}
                    type={'text'}
                    required
                    label={'Last Name'}
                    placeholder={'Enter Last Name'}
                    value={values.last_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.last_name && errors.last_name}
                  />
                </div>
                <div className="mb-45">
                  <label className="mainLabel">
                    Phone No
                    <span className="text-danger">*</span>
                  </label>
                  <PhoneInput
                    international
                    withCountryCallingCode
                    placeholder="Enter Phone Number"
                    className="mainInput"
                    defaultvat_country="US"
                    value={values.phone_number}
                    onChange={(value) => setFieldValue('phone', value)}
                    onBlur={() => handleBlur({ target: { name: 'phone' } })}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {!updateProfileMutation.isPending ? (
                    <>
                      <CustomButton type="submit" text={'Update'} />
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() => setEditProfileModal(false)}
                      />
                    </>
                  ) : (
                    <PulseLoader size={11} className="modalLoader" />
                  )}
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </CustomModal>
      {/* Change Password Modal  */}
      <CustomModal
        show={changePasswordModal}
        close={() => setChangePasswordModal(false)}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle">Change Password</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{
              current_password: '',
              password: '',
              password_confirmation: '',
            }}
            validationSchema={changePasswordSchema}
            onSubmit={handleChangePasswordSubmit}
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form>
                <div>
                  <CustomInput
                    name={'current_password'}
                    type={'password'}
                    required
                    label={'Current Password'}
                    placeholder={'Enter Current Password'}
                    value={values.current_password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.current_password && errors.current_password}
                  />
                </div>
                <div>
                  <CustomInput
                    name={'password'}
                    type={'password'}
                    required
                    label={'New Password'}
                    placeholder={'Enter New Password'}
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.password && errors.password}
                  />
                </div>
                <div>
                  <CustomInput
                    name={'password_confirmation'}
                    type={'password'}
                    required
                    label={'Confirm Password'}
                    placeholder={'Re-Enter New Password'}
                    value={values.password_confirmation}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={
                      touched.password_confirmation &&
                      errors.password_confirmation
                    }
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mt-45 mb-3">
                  {!updatePasswordMutation.isPending ? (
                    <>
                      <CustomButton type="submit" text={'Update Password'} />
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() => setChangePasswordModal(false)}
                      />
                    </>
                  ) : (
                    <PulseLoader size={11} className="modalLoader" />
                  )}
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </CustomModal>
    </>
  );
};

export default AdminProfile;
