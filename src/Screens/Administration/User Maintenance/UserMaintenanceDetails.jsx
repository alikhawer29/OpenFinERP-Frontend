import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Accordion from '../../../Components/Accordion/Accordion';
import ChartOfAccountDropdown from '../../../Components/ChartOfAccountDropdown/ChartOfAccountDropdown';
import CheckboxAccordion from '../../../Components/CheckboxAccordion/CheckboxAccordion';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import { showToast } from '../../../Components/Toast/Toast';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import {
  changeUserStatus,
  viewUserMaintenance,
} from '../../../Services/Administration/UserMaintenance';
import useThemeStore from '../../../Stores/ThemeStore';
import { themeDictionary } from '../../../Utils/Constants/ColorConstants';
import { getCountryFlag, isNullOrEmpty } from '../../../Utils/Utils';
import './UserMaintenance.css';

import Skeleton from 'react-loading-skeleton';
import BackButton from '../../../Components/BackButton';
import CustomModal from '../../../Components/CustomModal';
import { statusClassMap } from '../../../Utils/Constants/SelectOptions';
import useModulePermissions from '../../../Hooks/useModulePermissions';

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
        const isGranted = [
          node.granted,
          node.value,
          node.selected,
        ].some((val) => val === true || val === 'true');

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

const UserMaintenanceDetails = () => {
  const { id } = useParams();

  usePageTitle('User Maintenance - Details');
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const [changeUserStatusModal, setChangeUserStatusModal] = useState(false);
  const queryClient = useQueryClient();

    const permissions = useModulePermissions("administration", "user_maintenance")
    const {blockUnblock} = permissions;

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

  // Mutation for updating status
  const changeUserStatusMutation = useMutation({
    mutationFn: async (id) => await changeUserStatus(id),
    onSuccess: () => {
      showToast('User status updated successfully', 'success');
      setChangeUserStatusModal(false);
      queryClient.invalidateQueries(['viewUserMaintenance', id]);
    },
    onError: (error) => {
      showToast('Failed to change user status', 'error');
      console.error('Error updating status:', error);
      setChangeUserStatusModal(false);
    },
  });

  const topSection = () => (
    <div className="d-flex align-items-start mb-4">
      <div className="d-flex flex-column gap-2">
        <BackButton />
        <h2 className="screen-title m-0 d-inline">User Maintenance</h2>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <>
        {topSection()}
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
        {topSection()}
        <div className="d-card">
          <p className="text-danger">{error.message}</p>
        </div>
      </>
    );
  }

  const PermissionsList = ({ module }) => {
    return (
      <div key="master" className="row justify-content-center">
        <div className="col-12 col-xl-12">
          <div className="row justify-content-center">
            {Object.entries(module).map(([feature, actions], index) => (
              <div key={feature} className="col-12 col-xl-5">
                <CheckboxAccordion
                  readOnly={true}
                  title={formatTitle(feature)}
                  color={themeDictionary[theme][0]}
                  module={Object.entries(actions).map(([key, value]) => ({
                    name: key,
                    value,
                  }))}
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

  return (
    <section>
      {topSection()}
      <div className="d-card position-relative">
        <div className="row flex-wrap-reverse">
          <div className="col-12 col-sm-9 col-xl-9 col-xxl-7">
            <div className="row mb-4" style={{ top: 0 }}>
              {[
                { label: 'User Name', value: userMaintenance?.user_name },
                { label: 'User ID', value: userMaintenance?.user_id },
                { label: 'Email', value: userMaintenance?.email },
                {
                  label: 'Phone Number',
                  value: (
                    <>
                      <span>
                        {getCountryFlag(userMaintenance?.phone_number)}
                      </span>{' '}
                      {userMaintenance?.phone_number}
                    </>
                  ),
                },
              ].map((x, i) => {
                if (isNullOrEmpty(x.value)) return null;
                return (
                  <div key={i} className="col-12 col-lg-6 mb-4">
                    <p className="detail-title detail-label-color mb-1">
                      {x.label}
                    </p>
                    <p className="detail-text wrapText mb-0">{x.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="col-sm-3 d-flex justify-content-end ms-auto mb-4">
            <div className="d-flex flex-column gap-2 align-items-end">
              <p className="text-label mb-2">
                Status:{' '}
                <span
                  className={`status ${
                    statusClassMap[
                      userMaintenance?.status_detail?.toLowerCase()
                    ]
                  }`}
                >
                  {userMaintenance?.status_detail}
                </span>
              </p>
              {
                blockUnblock &&
              <CustomButton
                text={
                  userMaintenance?.status_detail?.toLowerCase() == 'active' ||
                  userMaintenance?.status_detail?.toLowerCase() == 'inactive'
                    ? 'Block User'
                    : 'Unblock User'
                }
                onClick={() => setChangeUserStatusModal(true)}
              />
              }
            </div>
          </div>
        </div>
        <div className="row mb-4">
          <div className="col-12 mb-4">
            <div className="d-flex align-items-center">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="apply_time_restriction"
                  id="apply_time_restriction"
                  checked={userMaintenance?.apply_time_restriction}
                />
                <span className="toggle-slider"></span>
              </label>
              <label
                htmlFor="apply_time_restriction"
                className="ms-3 cp user-select-none align-items-center"
              >
                Apply Time Restrictions
              </label>
            </div>
          </div>
          {/* Time Restriction Table */}
          {userMaintenance?.apply_time_restriction === 1 && (
            <div className="col-12 col-sm-9 col-xl-9 col-xxl-7 mb-4">
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
                    {userMaintenance?.time_slots?.map((slot, index) => (
                      <tr key={slot.id}>
                        <td width={'47%'}>{slot.day}</td>
                        <td width={'23%'}>
                          <CustomInput
                            type="time"
                            name={`time_slots.${index}.from`}
                            value={slot.from.substring(0, 5)} // Extracts HH:MM
                            disabled
                            style={{
                              marginBottom: '0px',
                              minWidth: '150px',
                              width: '150px',
                            }}
                          />
                        </td>
                        <td width={'23%'}>
                          <CustomInput
                            type="time"
                            name={`time_slots.${index}.to`}
                            value={slot.to.substring(0, 5)} // Extracts HH:MM
                            disabled
                            style={{
                              marginBottom: '0px',
                              minWidth: '150px',
                              width: '150px',
                            }}
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
        <div className="row mb-4">
          <h3 className="screen-title-body mb-3">Access Rights</h3>
        </div>
        {/* Access Rights Dropdowns*/}
        <div className="col-12 mb-45">
          <Accordion title="Masters">
            <PermissionsList
              module={userMaintenance?.access_rights?.master}
            />
          </Accordion>
          <Accordion title="Transactions">
            <PermissionsList
              module={userMaintenance?.access_rights?.transactions}
            />
          </Accordion>
          <Accordion title="Process">
            <PermissionsList
              module={userMaintenance?.access_rights?.process}
            />
          </Accordion>

          <Accordion title="Reports">
            <PermissionsList
              module={userMaintenance?.access_rights?.reports}
            />
          </Accordion>

          <Accordion title="Administration">
            <PermissionsList
              module={userMaintenance?.access_rights?.administration}
            />
          </Accordion>
          <Accordion title="Account Permissions">
            <div className="row mb-4">
              <div className="col-12 col-xl-6 mb-45 ">
                <ChartOfAccountDropdown
                  selectedAccountCodes={extractAccountCodes(
                    userMaintenance?.accounts_permission || []
                  )}
                  allowFullAccessSections={FULL_ACCESS_SECTION_NAMES}
                  readOnly
                />
              </div>
            </div>
          </Accordion>
        </div>
      </div>
      <CustomModal
        show={changeUserStatusModal}
        close={() => setChangeUserStatusModal(false)}
        disableClick={changeUserStatusMutation.isPending}
        action={() => {
          changeUserStatusMutation.mutate(id);
        }}
        title={
          userMaintenance?.status_detail?.toLowerCase() == 'active'
            ? 'Block'
            : 'Unblock'
        }
        description={`Are you sure you want to ${
          userMaintenance?.status_detail?.toLowerCase() == 'active'
            ? 'Block'
            : 'Unblock'
        } this user?`}
      />
    </section>
  );
};

export default UserMaintenanceDetails;
