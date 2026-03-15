import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import { Link, useNavigate, useParams } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import { showToast } from '../../../Components/Toast/Toast';
import withModal from '../../../HOC/withModal';
import useDataMutations from '../../../Hooks/useDataMutations';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import {
  formatDate,
  getCountryFlag,
  isNullOrEmpty,
  showErrorToast,
} from '../../../Utils/Utils';
import {
  changeBranchStatus,
  viewBranch,
} from '../../../Services/Administration/BranchManagement';
import CustomCheckbox from '../../../Components/CustomCheckbox/CustomCheckbox';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import { statusClassMap } from '../../../Utils/Constants/SelectOptions';
import CustomModal from '../../../Components/CustomModal';
import useModulePermissions from '../../../Hooks/useModulePermissions';

const deleteBranchManagement = (id) => {
  return Promise.resolve({ message: 'Deleted successfully' });
};

const BranchManagementDetails = ({ showModal, closeModal }) => {
  const { id } = useParams();
  const [changeBranchStatusModal, setChangeBranchStatusModal] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  usePageTitle('Branch Management - Details');

    const permissions = useModulePermissions("administration", "branch_management")
  const {blockUnblock} = permissions;

  const topSection = () => (
    <div className="d-flex align-items-start mb-4">
      <div className="d-flex flex-column gap-2">
        <BackButton />
        <h2 className="screen-title m-0 d-inline">Branch Management Details</h2>
      </div>
    </div>
  );

  const { deleteMutation } = useDataMutations({
    onDeleteSuccessCallback: () => {
      closeModal();
      showToast('Branch deleted Successfully', 'success');
      [['branchManagementDetails', id], 'branchManagementListing'].forEach(
        (key) => queryClient.invalidateQueries({ queryKey: [...key] })
      );
      setTimeout(() => {
        navigate(-1);
      }, 300);
    },
    onDeleteErrorCallback: (error) => {
      showErrorToast(error);
    },
  });

  const {
    data: branch,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['branchManagementDetails', id],
    queryFn: () => viewBranch(id),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Mutation for updating status
  const changeBranchStatusMutation = useMutation({
    mutationFn: async (id) => await changeBranchStatus(id),
    onSuccess: () => {
      showToast('Branch status updated successfully', 'success');
      setChangeBranchStatusModal(false);
      queryClient.invalidateQueries(['branchManagementDetails', id]);
    },
    onError: (error) => {
      showToast('Failed to change branch status', 'error');
      console.error('Error updating status:', error);
      setChangeBranchStatusModal(false);
    },
  });

  const handleDelete = (item) => {
    showModal(
      'Delete',
      `Are you sure you want to delete Branch ${item.name}?`,
      () => {
        deleteMutation.mutate({
          serviceFunction: deleteBranchManagement,
          id: item.id,
        });
      }
    );
  };

  if (isLoading) {
    return (
      <>
        {topSection()}
        <div className="d-card">
          <div className="row">
            <div className="d-flex justify-content-between mb-2">
              <h3 className="screen-title-body mb-4">Branch Details</h3>
            </div>

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

  return (
    <section>
      {topSection()}
      <div className="d-card">
        <>
          <div className="row">
            <div className="d-flex justify-content-between mb-2">
              <h3 className="screen-title-body mb-4">Branch Details</h3>
              <div className="d-flex flex-column gap-2 align-items-end">
                <p className="text-label">
                  Status:{' '}
                  <span
                    className={`status ${
                      statusClassMap[branch?.status.toLowerCase()]
                    }`}
                  >
                    {branch?.status}
                  </span>
                </p>
                {
                  blockUnblock &&
                  <CustomButton
                    text={
                      branch?.status == 'Unblocked'
                        ? 'Block Branch'
                        : 'Unblock Branch'
                    }
                    onClick={() => setChangeBranchStatusModal(true)}
                  />
                }
              </div>
            </div>
            <div className="col-12 col-lg-10 col-xl-9 col-xxl-7 mb-4">
              <div className="row mb-4">
                {[
                  { label: 'Branch Name', value: branch?.name },
                  { label: 'Address', value: branch?.address },
                  { label: 'City', value: branch?.city },
                  {
                    label: 'Contact Number',
                    value: (
                      <>
                        <span>{getCountryFlag(branch?.phone_number)}</span>{' '}
                        {branch?.phone_number}
                      </>
                    ),
                  },
                  { label: 'Manager', value: branch?.manager?.user_name },
                  { label: 'Supervisor', value: branch?.supervisor?.user_name },
                  { label: 'Base Currency', value: branch?.currency?.currency },
                ].map((x, i) => {
                  if (isNullOrEmpty(x.value)) return null;
                  return (
                    <div key={i} className="col-12 col-sm-6 mb-4">
                      <p className="detail-title detail-label-color mb-1">
                        {x.label}
                      </p>
                      <p className="detail-text wrapText mb-0">{x.value}</p>
                    </div>
                  );
                })}
              </div>
              <h3 className="screen-title-body mb-4">Posting Account</h3>
              <div className="row mb-4">
                {[
                  {
                    label: 'Account Payable',
                    value: 'Account Payable',
                  },
                  {
                    label: 'Account Receivable',
                    value: 'Account Receivable',
                  },
                  {
                    label: 'PDCR Account',
                    value: 'Post Dated CHQS RECD',
                  },
                  {
                    label: 'PDCP Account',
                    value: 'Post Dated CHQS Payable',
                  },
                  {
                    label: 'Walk-In Customer',
                    value: 'Cash Customer',
                  },
                  {
                    label: 'Suspense Account',
                    value: 'Bank suspence A/c',
                  },
                  {
                    label: 'Inward Payment Order',
                    value: 'Inward Remittance Payment',
                  },
                  {
                    label: 'Foreign Currency Remittance',
                    value: 'FC Remittance A/C',
                  },
                  {
                    label: 'Commission Income',
                    value: 'Commission A/C',
                  },
                  {
                    label: 'Commission Expense',
                    value: 'Commission Expense A/C',
                  },
                  {
                    label: 'Discount Account',
                    value: 'Discount EXP A/C',
                  },
                  {
                    label: 'VIWT Receievable A/C',
                    value: 'IWT Recievable A/c',
                  },
                  {
                    label: 'VAT Input Account',
                    value: 'VAT Input A/c',
                  },
                  {
                    label: 'VAT Output Account',
                    value: 'VAT Output A/c',
                  },
                  {
                    label: 'Remittance Income',
                    value: 'Remittance Income',
                  },
                  {
                    label: 'Counter Income',
                    value: 'Counter Income',
                  },
                  {
                    label: 'VAT Absorb Expense Account',
                    value: 'VAT Absorb Expense A/c',
                  },
                  {
                    label: 'Cost Of Sale A/C',
                    value: 'Cost Of Sale A/c',
                  },
                  {
                    label: 'Stock In Hand',
                    value: 'Stock In Hand A/c',
                  },
                  {
                    label: 'Depreciation Expense Amount',
                    value: 'Depreciation EXP',
                  },
                  {
                    label: 'Gain or Loss on Sale Account',
                    value: 'MISC EXP',
                  },
                  {
                    label: 'Write Off Account',
                    value: 'MISC EXP',
                  },
                ].map((x, i) => {
                  if (isNullOrEmpty(x.value)) return null;
                  return (
                    <div key={i} className="col-12 col-sm-6 mb-4">
                      <p className="detail-title detail-label-color mb-1">
                        {x.label}
                      </p>
                      <p className="detail-text wrapText mb-0">{x.value}</p>
                    </div>
                  );
                })}
              </div>
              <h3 className="screen-title-body mb-4">System Dates</h3>
              <div className="row mb-4">
                {[
                  {
                    label: 'Opening Date',
                    value: branch?.opening_date
                      ? formatDate(branch?.opening_date)
                      : null,
                  },
                  {
                    label: 'Closed Up To',
                    value: branch?.closed_upto_date
                      ? formatDate(branch?.closed_upto_date)
                      : null,
                  },
                  {
                    label: 'Accept Data Up To',
                    value: branch?.closed_upto_date
                      ? formatDate(branch?.accept_data_upto_date)
                      : null,
                  },
                ].map((x, i) => {
                  if (isNullOrEmpty(x.value)) return null;
                  return (
                    <div key={i} className="col-12 col-sm-6 mb-4">
                      <p className="detail-title detail-label-color mb-1">
                        {x.label}
                      </p>
                      <p className="detail-text wrapText mb-0">{x.value}</p>
                    </div>
                  );
                })}
              </div>
              <h3 className="screen-title-body mb-4">Dashboard</h3>
              <div className="row mb-4">
                {[
                  {
                    label: 'Startup Alert Period',
                    value: branch?.startup_alert_period,
                  },
                  {
                    label: 'Currency Rate Trend',
                    value: branch?.currency_rate_trend,
                  },
                  {
                    label: 'Dashboard Comparison',
                    value: branch?.dashboard_comparison_period,
                  },
                ].map((x, i) => {
                  if (isNullOrEmpty(x.value)) return null;
                  return (
                    <div key={i} className="col-12 col-sm-6 mb-4">
                      <p className="detail-title detail-label-color mb-1">
                        {x.label}
                      </p>
                      <p className="detail-text wrapText mb-0">{x.value}</p>
                    </div>
                  );
                })}
              </div>
              <h3 className="screen-title-body mb-4">Central Bank Limits</h3>
              <div className="row mb-4">
                {[
                  {
                    label: 'Inwards Payment Order',
                    value: branch?.inward_payment_order_limit,
                  },
                  {
                    label: 'Outwards Remittance',
                    value: branch?.outwards_remittance_limit,
                  },
                  {
                    label: 'Counter Transaction',
                    value: branch?.counter_transaction_limit,
                  },
                  {
                    label: 'Cash Limit',
                    value: branch?.cash_limit,
                  },
                  {
                    label: 'Cash/Bank Pay Limit',
                    value: branch?.cash_bank_pay_limit,
                  },
                  {
                    label: 'Monthly Transaction',
                    value: branch?.monthly_transaction_limit,
                  },
                  {
                    label: 'Counter Commission',
                    value: branch?.counter_commission_limit,
                  },
                ].map((x, i) => {
                  if (isNullOrEmpty(x.value)) return null;
                  return (
                    <div key={i} className="col-12 col-sm-6 mb-4">
                      <p className="detail-title detail-label-color mb-1">
                        {x.label}
                      </p>
                      <p className="detail-text wrapText mb-0">{x.value}</p>
                    </div>
                  );
                })}
              </div>
              <h3 className="screen-title-body mb-4">VAT Parameters</h3>
              <div className="row mb-4">
                {[
                  {
                    label: 'VAT Transaction Number',
                    value: branch?.vat_trn,
                  },
                  {
                    label: 'Country',
                    value: branch?.vat_country?.name,
                  },
                  {
                    label: 'Your Default City',
                    value: branch?.default_city,
                  },
                  {
                    label: 'Cities',
                    value: branch?.cities,
                  },
                  {
                    label: 'VAT Type',
                    value: branch?.vat_type,
                  },
                  {
                    label: 'VAT Percentage',
                    value:
                      branch?.vat_type === 'fixed'
                        ? branch?.vat_percentage
                        : null,
                  },
                  {
                    label: 'VAT Rates',
                    value:
                      branch?.vat_type === 'variable'
                        ? branch?.vat_rates
                            ?.map((rate) => rate.title)
                            .join(', ')
                        : null,
                  },
                ].map((x, i) => {
                  if (isNullOrEmpty(x.value)) return null;
                  return (
                    <div key={i} className="col-12 col-sm-6 mb-4">
                      <p className="detail-title detail-label-color mb-1">
                        {x.label}
                      </p>
                      <p className="detail-text wrapText mb-0">{x.value}</p>
                    </div>
                  );
                })}
                {branch?.vat_type === 'variable' && branch?.vats.length > 0 && (
                  <CustomTable
                    hasFilters={false}
                    isPaginated={false}
                    headers={['Title', 'VAT Percentage']}
                    className="vat-table"
                  >
                    {branch?.vats?.length && (
                      <tbody>
                        {branch?.vats?.map((item) => (
                          <tr key={item.id}>
                            <td>{item.title}</td>
                            <td className="text-start text-wrap">
                              {item.percentage}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    )}
                  </CustomTable>
                )}
              </div>
              <h3 className="screen-title-body mb-4">
                Miscellaneous Parameters
              </h3>
              <div className="row mb-4">
                <div className="mb-4">
                  <h3 className="screen-title-body mb-3">
                    Party & Beneficiary
                  </h3>
                  <CustomCheckbox
                    label="Disable Party ID Validation"
                    checked={branch?.disable_party_id_validation}
                    readOnly={true}
                    name="disable_party_id"
                  />
                  <CustomCheckbox
                    label="Disable Beneficiary Checking"
                    checked={branch?.disable_beneficiary_checking}
                    readOnly={true}
                    name="disable_beneficiary"
                  />
                  <CustomCheckbox
                    label="Enabled Personalised Marking"
                    checked={branch?.enable_personalized_marking}
                    readOnly={true}
                    name="enable_personalized_marking"
                  />
                </div>

                <div className="mb-4">
                  <h3 className="screen-title-body mb-3">Agent Commission</h3>
                  <CustomCheckbox
                    label="Show Agent Commission Section in CBS"
                    checked={branch?.show_agent_commission_in_cbs}
                    readOnly={true}
                    name="show_agent_commission_cbs"
                  />
                  <CustomCheckbox
                    label="Show Agent Commission Section in FSN"
                    checked={branch?.show_agent_commission_in_fsn}
                    readOnly={true}
                    name="show_agent_commission_fsn"
                  />
                  <CustomCheckbox
                    label="Show Agent Commission Section in FBN"
                    checked={branch?.show_agent_commission_in_fbn}
                    readOnly={true}
                    name="show_agent_commission_fbn"
                  />
                  <CustomCheckbox
                    label="Allow Advance Commission"
                    checked={branch?.allow_advance_commission}
                    readOnly={true}
                    name="allow_advance_commission"
                  />
                </div>

                <div className="mb-4">
                  <h3 className="screen-title-body mb-3">
                    Transaction Approval Control
                  </h3>
                  <CustomCheckbox
                    label="FSN entry to be posted in the book of account upon approval only"
                    checked={branch?.fsn_post_on_approval}
                    readOnly={true}
                    name="fsn_entry_approval"
                  />
                  <CustomCheckbox
                    label="FBN entry to be posted in the book of account upon approval only"
                    checked={branch?.fbn_post_on_approval}
                    readOnly={true}
                    name="fbn_entry_approval"
                  />
                  <CustomCheckbox
                    label="CBS entry to be posted in the book of account upon approval only"
                    checked={branch?.cbs_post_on_approval}
                    readOnly={true}
                    name="cbs_entry_approval"
                  />
                  <CustomCheckbox
                    label="RV entry to be posted in the book of account upon approval only"
                    checked={branch?.rv_post_on_approval}
                    readOnly={true}
                    name="rv_entry_approval"
                  />
                  <CustomCheckbox
                    label="PV entry to be posted in the book of account upon approval only"
                    checked={branch?.pv_post_on_approval}
                    readOnly={true}
                    name="pv_entry_approval"
                  />
                  <CustomCheckbox
                    label="TRQ entry to be posted in the book of account upon approval only"
                    checked={branch?.trq_post_on_approval}
                    readOnly={true}
                    name="trq_entry_approval"
                  />
                  <CustomCheckbox
                    label="A2A entry to be posted in the book of account upon approval only"
                    checked={branch?.a2a_post_on_approval}
                    readOnly={true}
                    name="a2a_entry_approval"
                  />
                  <CustomCheckbox
                    label="JV entry to be posted in the book of account upon approval only"
                    checked={branch?.jv_post_on_approval}
                    readOnly={true}
                    name="jv_entry_approval"
                  />
                  <CustomCheckbox
                    label="TSN & TBN entry to be posted in the book of account upon approval only"
                    checked={branch?.tsn_tbn_post_on_approval}
                    readOnly={true}
                    name="tsn_tbn_entry_approval"
                  />
                  <CustomCheckbox
                    label="Enable Two Setup Approval"
                    checked={branch?.enable_two_step_approval}
                    readOnly={true}
                    name="enable_two_setup_approval"
                  />
                </div>
              </div>
              <h3 className="screen-title-body mb-4">Party Ledger</h3>
              <div className="row mb-4">
                {[
                  {
                    label: 'Debit Posting Account',
                    value: branch?.debit_account?.account_name,
                  },
                  {
                    label: 'Credit Posting Account',
                    value: branch?.credit_account?.account_name,
                  },
                ].map((x, i) => {
                  if (isNullOrEmpty(x.value)) return null;
                  return (
                    <div key={i} className="col-12 col-sm-6 mb-4">
                      <p className="detail-title detail-label-color mb-1">
                        {x.label}
                      </p>
                      <p className="detail-text wrapText mb-0">{x.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-12 d-flex gap-2 gap-sm-4">
                <Link to={'edit'}>
                  <CustomButton text="Edit" />
                </Link>
                <CustomButton
                  text={'Delete'}
                  variant={'danger'}
                  onClick={() => handleDelete(branch)}
                />
              </div>
            </div>
          </div>
        </>
      </div>
      <CustomModal
        show={changeBranchStatusModal}
        close={() => setChangeBranchStatusModal(false)}
        disableClick={changeBranchStatusMutation.isPending}
        action={() => {
          changeBranchStatusMutation.mutate(id);
        }}
        title={branch?.status == 'Unblocked' ? 'Block' : 'Unblock'}
        description={`Are you sure you want to ${
          branch?.status == 'Unblocked' ? 'Block' : 'Unblock'
        } this branch?`}
      />
    </section>
  );
};

export default withModal(BranchManagementDetails);
