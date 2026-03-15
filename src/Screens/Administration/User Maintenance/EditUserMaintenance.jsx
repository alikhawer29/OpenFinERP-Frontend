import { useMutation, useQuery } from '@tanstack/react-query';
import { ErrorMessage, FastField, Form, Formik } from 'formik';
import { useEffect, useState, useRef } from 'react';
import Skeleton from 'react-loading-skeleton';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import { showToast } from '../../../Components/Toast/Toast';
import { usePageTitle } from '../../../Hooks/usePageTitle';
// import { userMaintenanceValidationSchema } from '../../../Utils/Validations/ValidationSchemas';
import { Col } from 'react-bootstrap';
import PhoneInput, { parsePhoneNumber } from 'react-phone-number-input';
import { useNavigate, useParams } from 'react-router-dom';
import Accordion from '../../../Components/Accordion/Accordion';
import ChartOfAccountDropdown from '../../../Components/ChartOfAccountDropdown/ChartOfAccountDropdown';
import CheckboxAccordion from '../../../Components/CheckboxAccordion/CheckboxAccordion';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import {
  editUser,
  getAccessRights,
  getAccountPermissions,
  viewUserMaintenance,
} from '../../../Services/Administration/UserMaintenance';
import useThemeStore from '../../../Stores/ThemeStore';
import { themeDictionary } from '../../../Utils/Constants/ColorConstants';
import {
  getUsersOptions,
  isNullOrEmpty,
  showErrorToast,
} from '../../../Utils/Utils';
import './UserMaintenance.css';
import BackButton from '../../../Components/BackButton';

const FULL_ACCESS_SECTION_NAMES = [
  'Assets',
  'Liabilities',
  'Capital',
  'Revenue',
  'Expense',
];

const extractAccountCodes = (permissions = []) => {
  if (!Array.isArray(permissions)) {
    permissions = [permissions];
  }

  const codes = new Set();

  const traverse = (node) => {
    if (!node) {
      return;
    }

    if (Array.isArray(node)) {
      node.forEach(traverse);
      return;
    }

    if (typeof node === 'string' || typeof node === 'number') {
      codes.add(node.toString().trim());
      return;
    }

    if (typeof node === 'object') {
      if ('account_code' in node) {
        const isGranted = [node.granted, node.value, node.selected].some(
          (val) => val === true || val === 'true'
        );

        if (isGranted && node.account_code) {
          codes.add(node.account_code.toString().trim());
        }

        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }

        return;
      }

      Object.entries(node).forEach(([key, value]) => {
        if (value === true || value === 'true') {
          const normalizedKey = key.toString().trim();
          if (/^[0-9]+$/.test(normalizedKey)) {
            codes.add(normalizedKey);
          }
        } else if (value && typeof value === 'object') {
          traverse(value);
        }
      });
    }
  };

  traverse(permissions);

  return Array.from(codes);
};

const EditUserMaintenance = () => {
  usePageTitle('User Maintenance - Create');
  const { id } = useParams();

  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const [copyFrom, setCopyFrom] = useState({
    access_rights_copy_from: '',
    account_permissions_copy_from: '',
  });

  const [otherAccessUserId, setOtherAccessUserId] = useState('');
  const [otherPermissionUserId, setOtherPermissionUserId] = useState('');

  const getUserAccessRights = async () => {
    if (copyFrom.access_rights_copy_from) {
      setOtherAccessUserId(copyFrom.access_rights_copy_from);
    }
  };

  const getUserAccountPermissions = async () => {
    if (copyFrom.account_permissions_copy_from) {
      setOtherPermissionUserId(copyFrom.account_permissions_copy_from);
    }
  };

  // Get User Details
  const {
    data: userMaintenance,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['viewUserMaintenance', id],
    queryFn: () => viewUserMaintenance(id),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Get Other User Access Rights
  const {
    data: otherUserAccessRights,
    isLoading: isLoadingUserAccessRights,
    isError: IsErrorUserAccessRights,
    error: ErrorUserAccessRights,
  } = useQuery({
    queryKey: ['UserAccessRights', otherAccessUserId], // Ensure the query key uniquely identifies the query
    queryFn: () => getAccessRights(otherAccessUserId),
    enabled: !!otherAccessUserId,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Get Other User Account Permission
  const {
    data: otherUserAccountPermissions,
    isLoading: isLoadingUserAccountPermissions,
    isError: IsErrorUserAccountPermissions,
    error: ErrorUserAccountPermissions,
  } = useQuery({
    queryKey: ['UserAccountPermissions', otherPermissionUserId],
    queryFn: () => getAccountPermissions(otherPermissionUserId),
    enabled: !!otherPermissionUserId,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  function removeFalseValues(obj) {
    // Iterate through each key in the object
    for (const key in obj) {
      // If the value is an object, recursively call the function on it
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        removeFalseValues(obj[key]);
      }

      // If the value is false, delete the key
      if (obj[key] === false || isNullOrEmpty(obj[key])) {
        delete obj[key];
      }
    }
    return obj;
  }

  const handleSubmit = (values) => {
    // Combine all permission states into a single object
    const combinedAccessRights = {
      master: masterPermissions,
      transactions: transactionPermissions,
      process: processPermissions,
      reports: reportsPermissions,
      administration: administrationPermissions,
    };
    const transformedMasterAccessRights =
      removeFalseValues(combinedAccessRights);

    //chart of accounts permissions transformed
    const transformedPermissions = accountFinalPermissions?.map((detail) => ({
      [detail]: true,
    }));

    const payload = {
      ...values,
      phone: values.phone,
      country_code: values.country_code,
      apply_time_restriction: values.apply_time_restriction,
      time_slots: values.time_slots,
      access_rights: transformedMasterAccessRights,
      accounts_permission: transformedPermissions,
    };

    editUserMutation.mutate(payload);
  };

  const editUserMutation = useMutation({
    mutationFn: (formData) => editUser(id, formData),
    onSuccess: () => {
      showToast('User Updated!', 'success');
      setTimeout(() => {
        navigate(-1);
      }, 300);
    },
    onError: (error) => {
      console.error('Error updating User', error);
      showErrorToast(error);
    },
  });

  const timeSlots = [
    { day: 'Monday' },
    { day: 'Tuesday' },
    { day: 'Wednesday' },
    { day: 'Thursday' },
    { day: 'Friday' },
    { day: 'Saturday' },
    { day: 'Sunday' },
  ];

  //in this state we set chart of accounts codes after update
  const [accountFinalPermissions, setAccountFinalPermissions] = useState([]);

  //set all user current chart of accounts permissions
  const [userAccountPermissions, setUserAccountPermissions] = useState([]);
  const [selectableAccountCodes, setSelectableAccountCodes] = useState([]);
  const formikRef = useRef(null);

  //set all access rights permissions
  const [masterPermissions, setMasterPermissions] = useState({});
  const [transactionPermissions, setTransactionPermissions] = useState({});
  const [processPermissions, setProcessPermissions] = useState({});
  const [reportsPermissions, setReportPermissions] = useState({});
  const [administrationPermissions, setAdministrationPermissions] = useState(
    {}
  );

  useEffect(() => {
    if (userMaintenance) {
      setMasterPermissions(userMaintenance?.access_rights?.master || {});
      setTransactionPermissions(
        userMaintenance?.access_rights?.transactions || {}
      );
      setProcessPermissions(userMaintenance?.access_rights?.process || {});
      setReportPermissions(userMaintenance?.access_rights?.reports || {});
      
      const adminPermissions = userMaintenance?.access_rights?.administration || {};
      
      // Ensure branch selection has at least one branch selected
      if (adminPermissions.branch_selection) {
        const branchKeys = Object.keys(adminPermissions.branch_selection).filter(key => 
          key.includes('Dubai') || key.includes('Silicon') || key.includes('Gitex') || key.includes('Valley')
        );
        const checkedBranches = branchKeys.filter(key => adminPermissions.branch_selection[key]);
        
        // If no branches are selected, select the first one by default
        if (checkedBranches.length === 0 && branchKeys.length > 0) {
          adminPermissions.branch_selection[branchKeys[0]] = true;
        }
      }
      
      setAdministrationPermissions(adminPermissions);

      const existingAccountCodes = extractAccountCodes(
        userMaintenance?.accounts_permission || []
      );
      setAccountFinalPermissions(existingAccountCodes);
      setUserAccountPermissions(userMaintenance?.accounts_permission || []);
    }
  }, [userMaintenance, otherUserAccessRights, otherUserAccountPermissions]);

  useEffect(() => {
    if (!otherUserAccessRights) return;
    const adminPermissions = otherUserAccessRights?.administration || {};
    
    // Ensure branch selection has at least one branch selected
    if (adminPermissions.branch_selection) {
      const branchKeys = Object.keys(adminPermissions.branch_selection).filter(key => 
        key.includes('Dubai') || key.includes('Silicon') || key.includes('Gitex') || key.includes('Valley')
      );
      const checkedBranches = branchKeys.filter(key => adminPermissions.branch_selection[key]);
      
      // If no branches are selected, select the first one by default
      if (checkedBranches.length === 0 && branchKeys.length > 0) {
        adminPermissions.branch_selection[branchKeys[0]] = true;
      }
    }
    
    setMasterPermissions(otherUserAccessRights?.master || {});
    setTransactionPermissions(otherUserAccessRights?.transactions || {});
    setProcessPermissions(otherUserAccessRights?.process || {});
    setReportPermissions(otherUserAccessRights?.reports || {});
    setAdministrationPermissions(adminPermissions);
  }, [otherUserAccessRights]);

  useEffect(() => {
    if (!otherUserAccountPermissions) return;
    setUserAccountPermissions(otherUserAccountPermissions || []);
  }, [otherUserAccountPermissions, otherUserAccessRights]);

  useEffect(() => {
    if (!formikRef.current) return;
    if (!selectableAccountCodes.length) {
      return;
    }

    const normalizedSelected = new Set(
      (accountFinalPermissions || []).map((code) => code.toString().trim())
    );
    const allSelected = selectableAccountCodes.every((code) =>
      normalizedSelected.has(code.toString().trim())
    );

    if (allSelected && !formikRef.current.values.copy_all) {
      formikRef.current.setFieldValue('copy_all', true, false);
    } else if (!allSelected && formikRef.current.values.copy_all) {
      formikRef.current.setFieldValue('copy_all', false, false);
    }
  }, [selectableAccountCodes, accountFinalPermissions]);

  // Reusable AccessRights List Component
  const PermissionsList = ({ module, onChange, sectionType }) => {
    return (
      <div className="row justify-content-center">
        <div className="col-12 col-xl-12">
          <div className="row justify-content-center">
            {Object.entries(module).map(([feature, actions], index) => (
              <div key={feature} className="col-12 col-xl-5">
                <CheckboxAccordion
                  title={formatTitle(feature)}
                  color={themeDictionary[theme][0]}
                  module={Object.entries(actions).map(([key, value]) => ({
                    name: key,
                    value,
                  }))}
                  onPermissionsChange={(newPermissions) => {
                    // Auto-check view when edit/delete is checked - ONLY for transactions section
                    const updatedPermissions = { ...newPermissions };

                    // Apply permission dependencies only for transactions section
                    if (sectionType === 'transactions') {
                      // If edit is being checked, also check view
                      if (newPermissions.edit && !newPermissions.view) {
                        updatedPermissions.view = true;
                      }

                      // If create is being checked, also check view
                      // if (newPermissions.create && !newPermissions.view) {
                      //   updatedPermissions.view = true;
                      // }

                      // If delete is being checked, also check view
                      if (newPermissions.delete && !newPermissions.view) {
                        updatedPermissions.view = true;
                      }

                      // Prevent unchecking view if edit, create, or delete is still checked
                      if (
                        !newPermissions.view &&
                        (newPermissions.edit ||
                          // newPermissions.create ||
                          newPermissions.delete)
                      ) {
                        updatedPermissions.view = true;
                      }
                    }

                     // Apply permission dependencies for reports section
                    if (sectionType === 'reports') {
                      // If edit is being checked, also check view
                      if (newPermissions.export_to_excel && !newPermissions.view) {
                        updatedPermissions.view = true;
                      }

                      
                      // Prevent unchecking view if export is still checked
                      if (
                        !newPermissions.view &&
                        (newPermissions.export_to_excel ||
                          newPermissions.export_to_pdf ||
                          newPermissions.email_as_excel ||
                          newPermissions.email_as_pdf
                        )
                      ) {
                        updatedPermissions.view = true;
                      }
                    }
                    
                    // Apply permission dependencies for subscription logs
                    if (sectionType === 'administration') {
                      // If edit is being checked, also check view
                      if ((newPermissions.renew_subscription || newPermissions.cancel_subscription || newPermissions.change_subscription || newPermissions.buy_custom_subscription || newPermissions.request_custom_subscription) && !newPermissions.view_subscription_logs) {
                        updatedPermissions.view_subscription_logs = true;
                      }

                      
                      // Prevent unchecking view if export is still checked
                      if (
                        !newPermissions.view_subscription_logs &&
                        (newPermissions.renew_subscription ||
                          newPermissions.cancel_subscription ||
                          newPermissions.change_subscription ||
                          newPermissions.buy_custom_subscription ||
                          newPermissions.request_custom_subscription                    
                        )
                      ) {
                        updatedPermissions.view_subscription_logs = true;
                      }

                      // Special handling for Branch Selection in Administration section
                      if (feature === 'branch_selection') {
                        const branchKeys = Object.keys(newPermissions).filter(key => 
                          key.includes('Dubai') || key.includes('Silicon') || key.includes('Gitex') || key.includes('Valley')
                        );
                        const checkedBranches = branchKeys.filter(key => newPermissions[key]);
                        
                        // Ensure at least one branch is always selected
                        if (checkedBranches.length === 0) {
                          // If no branches are selected, select the first one by default
                          const firstBranch = branchKeys[0];
                          if (firstBranch) {
                            updatedPermissions[firstBranch] = true;
                          }
                        }
                      }
                    }

                    onChange(feature, updatedPermissions);
                  }}
                />
                {index % 2 === 0 && <div className="col-xl-1"></div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Utility function to format section titles
  const formatTitle = (text) =>
    text.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

  if (isLoading) {
    return (
      <>
        <div className="d-card">
          <div className="row">
            <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
              <div className="row mb-4">
                {Array.from({ length: 19 }).map((_, i) => (
                  <div
                    key={i}
                    className="col-12 col-sm-6 mb-3 align-items-center"
                    style={{ height: 56 }}
                  >
                    <Skeleton
                      style={{ marginTop: 28 }}
                      duration={1}
                      width={'50%'}
                      baseColor="#ddd"
                      height={22}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <div className="d-card">
          <p className="text-danger">{error.message}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-3">
        <BackButton />
        <h2 className="screen-title mb-0"> User Maintenance</h2>
      </div>
      <div className="d-card py-45 mb-45">
        <div className="row">
          <Formik
            innerRef={formikRef}
            initialValues={{
              user_name: userMaintenance?.user_name || '',
              user_id: userMaintenance?.user_id || '',
              email: userMaintenance?.email || '',
              phone: userMaintenance?.phone || '',
              country_code: userMaintenance?.country_code || '',
              phone_number: userMaintenance?.phone_number || '',
              apply_time_restriction:
                userMaintenance?.apply_time_restriction || 0,
              time_slots:
                userMaintenance?.time_slots?.map((slot) => ({
                  day: slot.day,
                  from: slot.from.substring(0, 5), // Extracts HH:MM from HH:MM:SS
                  to: slot.to.substring(0, 5),
                })) ||
                timeSlots.map((slot) => ({
                  day: slot.day,
                  from: '09:00',
                  to: '17:00',
                })),
              copy_all: false, // Add copy_all field for Allow Full Access
            }}
            //   validationSchema={userMaintenanceValidationSchema}
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
                <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
                  {/* User Details */}
                  <div className="row">
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'user_name'}
                        type={'text'}
                        required
                        label={'User Name'}
                        placeholder={'Enter User Name'}
                        value={values.user_name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.user_name && errors.user_name}
                      />
                    </div>
                    <Col md={6} xs={12}>
                      <CustomInput
                        label="User ID"
                        required
                        id="user_id"
                        name={'user_id'}
                        type="text"
                        placeholder="Enter User ID"
                        value={values.user_id}
                        disabled
                      />
                    </Col>
                    <div className="col-12 col-sm-6 mb-3">
                      <CustomInput
                        name={'email'}
                        type={'email'}
                        required
                        label={'Email'}
                        placeholder={'Enter Email'}
                        value={values.email}
                        disabled
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-4 inputWrapper">
                      <label className="mainLabel">
                        Contact No
                        <span className="text-danger">*</span>
                      </label>
                      <FastField name="phone_number">
                        {({ field }) => (
                          // Handling the phone number and country code in the field's onChange rather than handleSubmit Function
                          <PhoneInput
                            {...field}
                            international
                            withCountryCallingCode
                            placeholder="Enter Contact Number"
                            className="mainInput"
                            defaultCountry="US"
                            onChange={(value) => {
                              let parsedMobileNumber;
                              if (value?.length > 3) {
                                parsedMobileNumber = parsePhoneNumber(
                                  value,
                                  'US'
                                );
                              }
                              setFieldValue(
                                'phone',
                                parsedMobileNumber?.nationalNumber
                              );
                              setFieldValue(
                                'country_code',
                                parsedMobileNumber
                                  ? `+${parsedMobileNumber.countryCallingCode}`
                                  : ''
                              );
                              setFieldValue('phone_number', value);
                            }}
                            onBlur={() =>
                              handleBlur({ target: { name: 'phone' } })
                            }
                          />
                        )}
                      </FastField>
                      <ErrorMessage
                        name="phone"
                        component="div"
                        className="text-danger"
                      />
                    </div>
                  </div>
                  {/* Time Restriction */}
                  <div className="row mb-4">
                    <div className="col-12 mb-4">
                      <div className="d-flex align-items-center">
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            name="apply_time_restriction"
                            id="apply_time_restriction"
                            checked={values.apply_time_restriction}
                            onChange={(e) =>
                              setFieldValue(
                                'apply_time_restriction',
                                e.target.checked ? 1 : 0
                              )
                            }
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        <label
                          htmlFor="apply_time_restriction"
                          className="ms-3 cp user-select-none"
                        >
                          Apply Time Restrictions
                        </label>
                      </div>
                    </div>

                    {/* Time Restriction Table */}
                    {values.apply_time_restriction === 1 && (
                      <div className="col-12 mb-4">
                        <div className="table-responsive">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>Day</th>
                                <th>From Time</th>
                                <th>To Time</th>
                              </tr>
                            </thead>
                            <tbody className="time-slots-table-body">
                              {timeSlots.map((slot, index) => (
                                <tr key={slot.day}>
                                  <td width={'47%'}>{slot.day}</td>
                                  <td width={'23%'}>
                                    <CustomInput
                                      type="time"
                                      name={`time_slots.${index}.from`}
                                      style={{
                                        marginBottom: '0px',
                                        minWidth: '150px',
                                        width: '150px',
                                      }}
                                      value={
                                        values.time_slots[index]?.from || ''
                                      }
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      error={
                                        touched.time_slots?.[index]?.from &&
                                        errors.time_slots?.[index]?.from
                                      }
                                    />
                                  </td>
                                  <td width={'23%'}>
                                    <CustomInput
                                      type="time"
                                      name={`time_slots.${index}.to`}
                                      style={{
                                        marginBottom: '0px',
                                        minWidth: '150px',
                                        width: '150px',
                                      }}
                                      value={values.time_slots[index]?.to || ''}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      error={
                                        touched.time_slots?.[index]?.to &&
                                        errors.time_slots?.[index]?.to
                                      }
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Access Rights */}
                  <div className="row mb-4">
                    <h3 className="screen-title-body mb-3">Access Rights</h3>
                    {/* Copy From */}
                    <div className="col-12 col-sm-6 mb-45 ">
                      <SearchableSelect
                        name="access_rights_copy_from"
                        label="Copy From"
                        placeholder="Select User"
                        options={getUsersOptions()}
                        value={copyFrom.access_rights_copy_from}
                        onChange={(v) =>
                          setCopyFrom({
                            ...copyFrom,
                            access_rights_copy_from: v.value,
                          })
                        }
                      />
                    </div>
                    <div className="col-12 col-sm-6 mb-45 d-flex align-items-end">
                      <CustomButton
                        type="button"
                        text={'Copy'}
                        onClick={getUserAccessRights}
                        disabled={isLoadingUserAccessRights}
                        loading={isLoadingUserAccessRights}
                      />
                    </div>
                  </div>
                </div>
                {/* Access Rights Dropdowns*/}
                <div className="col-12 mb-45">
                  <Accordion title="Masters">
                    <PermissionsList
                      module={masterPermissions}
                      sectionType="master"
                      onChange={(feature, newPermissions) =>
                        setMasterPermissions((prev) => ({
                          ...prev,
                          [feature]: newPermissions,
                        }))
                      }
                    />
                  </Accordion>

                  <Accordion title="Transactions">
                    <PermissionsList
                      module={transactionPermissions}
                      sectionType="transactions"
                      onChange={(feature, newPermissions) =>
                        setTransactionPermissions((prev) => ({
                          ...prev,
                          [feature]: newPermissions,
                        }))
                      }
                    />
                  </Accordion>

                  <Accordion title="Process">
                    <PermissionsList
                      module={processPermissions}
                      sectionType="process"
                      onChange={(feature, newPermissions) =>
                        setProcessPermissions((prev) => ({
                          ...prev,
                          [feature]: newPermissions,
                        }))
                      }
                    />
                  </Accordion>

                  <Accordion title="Reports">
                    <PermissionsList
                      module={reportsPermissions}
                      sectionType="reports"
                      onChange={(feature, newPermissions) =>
                        setReportPermissions((prev) => ({
                          ...prev,
                          [feature]: newPermissions,
                        }))
                      }
                    />
                  </Accordion>

                  <Accordion title="Administration">
                    <PermissionsList
                      module={administrationPermissions}
                      sectionType="administration"
                      onChange={(feature, newPermissions) =>
                        setAdministrationPermissions((prev) => ({
                          ...prev,
                          [feature]: newPermissions,
                        }))
                      }
                    />
                  </Accordion>

                  <Accordion title="Account Permissions">
                    {/* Copy From */}
                    <div className="row mb-4">
                      <div className="col-12 col-xl-6 mb-45 ">
                        <SearchableSelect
                          name="account_permissions_copy_from"
                          label="Copy From"
                          placeholder="Select User"
                          options={getUsersOptions()}
                          value={copyFrom.account_permissions_copy_from}
                          onChange={(v) =>
                            setCopyFrom({
                              ...copyFrom,
                              account_permissions_copy_from: v.value,
                            })
                          }
                        />
                      </div>
                      <div className="col-12 col-sm-6 mb-45 d-flex align-items-end">
                        <CustomButton
                          type="button"
                          text={'Copy'}
                          onClick={getUserAccountPermissions}
                          disabled={isLoadingUserAccountPermissions}
                          loading={isLoadingUserAccountPermissions}
                        />
                      </div>
                      <div className="checkbox-wrapper">
                        <label className="checkbox-container">
                          <input
                            checked={values.copy_all}
                            onChange={(e) =>
                              setFieldValue('copy_all', e.target.checked)
                            }
                            type="checkbox"
                            name="copy_all"
                          />
                          <span className="custom-checkbox"></span>
                          Allow Full Access
                        </label>
                      </div>
                    </div>
                    <div className="row mb-4">
                      <div className="col-12 col-xl-6 mb-45 ">
                        <ChartOfAccountDropdown
                          userAccountPermissions={userAccountPermissions} // Pass Current User permissions to the dropdown
                          otherUserAccountPermissions={
                            otherUserAccountPermissions
                          } // Pass Other User permissions to the dropdown
                          allowFullAccess={values.copy_all}
                          allowFullAccessSections={FULL_ACCESS_SECTION_NAMES}
                          selectedAccountCodes={accountFinalPermissions}
                          onSelectableCodesChange={setSelectableAccountCodes}
                          onSelectionChange={(selectedItems) => {
                            setAccountFinalPermissions(selectedItems);
                          }}
                        />
                      </div>
                    </div>
                  </Accordion>
                </div>
                <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
                  {/* Form Button */}
                  <div className="d-flex gap-3 ms-auto mb-3 mb-md-0">
                    <div className="d-flex gap-3 justify-content-center mb-3">
                      <CustomButton
                        loading={editUserMutation.isPending}
                        disabled={editUserMutation.isPending}
                        type="submit"
                        text={'Update'}
                      />
                      <CustomButton
                        text={'Cancel'}
                        variant={'secondaryButton'}
                        type={'button'}
                        onClick={() => navigate(-1)}
                      />
                    </div>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </>
  );
};

export default EditUserMaintenance;
