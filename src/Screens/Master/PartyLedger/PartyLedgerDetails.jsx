import { useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import Skeleton from 'react-loading-skeleton';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import { showToast } from '../../../Components/Toast/Toast';
import withModal from '../../../HOC/withModal';
import useDataMutations from '../../../Hooks/useDataMutations';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import {
  deletePartyLedger,
  viewPartyLedger,
} from '../../../Services/Masters/PartyLedger';
import {
  formatDate,
  getCountryFlag,
  isNullOrEmpty,
  showErrorToast,
} from '../../../Utils/Utils';
import useModulePermissions from '../../../Hooks/useModulePermissions';

const PartyLedgerDetails = ({ showModal, closeModal }) => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  usePageTitle('Party Ledger - Details');

  const permissions = useModulePermissions('master', 'party_ledger');
  const {
    create: hasCreatePermission,
    edit: hasEditPermission,
    delete: hasDeletePermission,
    view: hasViewPermission,
  } = permissions;

  const topSection = () => (
    <div className="d-flex align-items-start mb-4 justify-content-between flex-wrap">
      <div className="d-flex flex-column gap-2">
        <BackButton />
        <h2 className="screen-title m-0 d-inline">Party Ledger</h2>
      </div>
      {hasEditPermission && (
        <div className="d-flex gap-2 flex-wrap">
          <CustomButton text={'Edit'} onClick={() => navigate('edit')} />
        </div>
      )}
    </div>
  );
  const { deleteMutation } = useDataMutations({
    onDeleteSuccessCallback: () => {
      closeModal();
      showToast('Party Ledger deleted Successfully', 'success');
      // Invalidate multiple queries
      [['partyLedgerDetails', id], 'partyLedgerListing'].forEach((key) =>
        queryClient.invalidateQueries({ queryKey: [...key] })
      );
      setTimeout(() => {
        navigate(-1);
      }, 300);
    },
    onDeleteErrorCallback: (error) => {
      // Ensure the confirmation modal is closed and loader stops before showing error
      closeModal();
      if (
        error.message.toLowerCase() ==
        'the party ledger cannot be deleted as it is currently in use.'
      ) {
        showModal('Cannot be Deleted', error.message, closeModal, 'error');
      } else {
        showErrorToast(error);
      }
    },
  });

  // Queries and Mutations
  const {
    data: partyLedger,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['partyLedgerDetails', id],
    queryFn: () => viewPartyLedger(id),
    refetchOnWindowFocus: false,
    retry: 1,
    gcTime: 0,
  });

  // Function to handle Delete action
  const handleDelete = (item) => {
    showModal(
      'Delete',
      `Are you sure you want to delete Customer ${item.account_title}?`,
      () => {
        deleteMutation.mutate({
          serviceFunction: deletePartyLedger,
          id: item.id,
        });
      }
    );
  };

  if (isLoading) {
    return (
      <>
        {topSection()}
        <div className="d-card ">
          <div className="row">
            <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
              <div className="row mb-4">
                {Array.from({ length: 19 }).map((_, i) => (
                  <div
                    key={i}
                    className="col-12 col-sm-6 mb-3  align-items-center"
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
      <div className="d-card pt-4">
        <div className="row ">
          <h4 className="details-page-header pb-2">Account Detail</h4>
          <hr style={{ opacity: 0.11 }} className="mb-4" />
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7 mb-4">
            <div className="row">
              {/* ACCOUNT DETAIL */}
              {[
                { label: 'Account Code', value: partyLedger?.account_code },
                { label: 'Account Title', value: partyLedger?.account_title },
                { label: 'RTL Title', value: partyLedger?.rtl_title },
                {
                  label: 'Classification',
                  value: partyLedger?.classifications?.classification,
                },
                {
                  label: 'Central Bank Group',
                  value: partyLedger?.central_bank_group?.classification,
                },
                { label: 'Status', value: partyLedger?.status },
                {
                  label: 'Offline IWT Entry',
                  value:
                    partyLedger?.offline_iwt_entry === null
                      ? null
                      : partyLedger?.offline_iwt_entry
                        ? 'Yes'
                        : 'No',
                },
                {
                  label: 'Money Service Agent',
                  value:
                    partyLedger?.money_service_agent === null
                      ? null
                      : partyLedger?.money_service_agent
                        ? 'Yes'
                        : 'No',
                },
                { label: 'Debit Limit', value: partyLedger?.debit_limit },
                { label: 'Credit Limit', value: partyLedger?.credit_limit },
                {
                  label: 'Office',
                  value: partyLedger?.office_location?.office_location,
                },
              ].map((x, i) => {
                return (
                  <div key={i} className="col-12 col-sm-6 mb-4">
                    <p className="detail-title detail-label-color mb-1">
                      {x.label}
                    </p>
                    <p
                      className={`detail-text wrapText mb-0 ${x.label === 'RTL Title' ? 'rtl' : ''
                        }`}
                    >
                      {x.value || '-'}
                    </p>
                  </div>
                );
              })}
              {/* Debit and Credit Posting Accounts - Always shown parallel */}
              <div className="col-12 col-sm-6 mb-4">
                <p className="detail-title detail-label-color mb-1">
                  Debit Posting Account
                </p>
                <p className="detail-text wrapText mb-0">
                  {partyLedger?.debit_account?.account_name || '-'}
                </p>
              </div>
              <div className="col-12 col-sm-6 mb-4">
                <p className="detail-title detail-label-color mb-1">
                  Credit Posting Account
                </p>
                <p className="detail-text wrapText mb-0">
                  {partyLedger?.credit_account?.account_name || '-'}
                </p>
              </div>
            </div>
          </div>

          <h4 className="details-page-header pb-2">Contact Detail</h4>
          <hr style={{ opacity: 0.11 }} className="mb-4" />
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7 mb-4">
            <div className="row">
              {/* CONTACT DETAIL */}
              {[
                { label: 'Company Name', value: partyLedger?.company_name },
                { label: 'Address', value: partyLedger?.address },
                {
                  label: 'Telephone Number',
                  value: partyLedger?.telephone_no ? (
                    <>
                      <span>{getCountryFlag(partyLedger?.telephone_no)}</span>{' '}
                      {partyLedger?.telephone_no}
                    </>
                  ) : null,
                },
                {
                  label: 'Fax',
                  value: partyLedger?.fax_no ? (
                    <>
                      <span>{getCountryFlag(partyLedger?.fax_no)}</span>{' '}
                      {partyLedger?.fax_no}
                    </>
                  ) : null,
                },
                { label: 'Email', value: partyLedger?.email },
                {
                  label: 'Contact Person',
                  value: partyLedger?.contact_person,
                },
                {
                  label: 'Mobile Number',
                  value: partyLedger?.mobile_no ? (
                    <>
                      <span>{getCountryFlag(partyLedger?.mobile_no)}</span>{' '}
                      {partyLedger?.mobile_no}
                    </>
                  ) : null,
                },
                {
                  label: 'Nationality',
                  value: partyLedger?.nationality?.name,
                },
                { label: 'Entity', value: partyLedger?.entity },
              ].map((x, i) => {
                return (
                  <div key={i} className="col-12 col-sm-6 mb-4">
                    <p className="detail-title detail-label-color mb-1">
                      {x.label}
                    </p>
                    <p className="detail-text wrapText mb-0">{x.value || '-'}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <h4 className="details-page-header pb-2">ID Detail</h4>
          <hr style={{ opacity: 0.11 }} className="mb-4" />
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7 mb-4">
            <div className="row">
              {/* ID DETAIL */}
              {[
                {
                  label: 'ID Type',
                  value: partyLedger?.id_type?.description,
                },
                { label: 'ID Number', value: partyLedger?.id_number },
                {
                  label: 'Issue Date',
                  value: partyLedger?.issue_date
                    ? formatDate(partyLedger?.issue_date)
                    : null,
                },
                {
                  label: 'Valid Upto',
                  value: partyLedger?.valid_upto
                    ? formatDate(partyLedger?.valid_upto)
                    : null,
                },
                { label: 'Place of Issue', value: partyLedger?.issue_place },
              ].map((x, i) => {
                return (
                  <div key={i} className="col-12 col-sm-6 mb-4">
                    <p className="detail-title detail-label-color mb-1">
                      {x.label}
                    </p>
                    <p className="detail-text wrapText mb-0">{x.value || '-'}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <h4 className="details-page-header pb-2">VAT Detail</h4>
          <hr style={{ opacity: 0.11 }} className="mb-4" />
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7 mb-4">
            <div className="row">
              {/* VAT DETAIL */}
              {[
                { label: 'VAT TRN', value: partyLedger?.vat_trn },
                {
                  label: 'VAT Country',
                  value: partyLedger?.vat_country?.name,
                },
                { label: 'VAT State', value: partyLedger?.vat_state?.name },
                {
                  label: 'VAT Exempted',
                  value: partyLedger?.vat_exempted ? 'Yes' : 'No',
                },
                //   {
                //     label: 'Outward TT Commission',
                //     value: partyLedger.outward_tt_commission,
                //   },
              ].map((x, i) => {
                return (
                  <div key={i} className="col-12 col-sm-6 mb-4">
                    <p className="detail-title detail-label-color mb-1">
                      {x.label}
                    </p>
                    <p className="detail-text wrapText mb-0">{x.value || '-'}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="row mb-4">
            <div className="col-12 d-flex">
              {hasDeletePermission && (
                <CustomButton
                  text={'Delete'}
                  variant={'danger'}
                  onClick={() => handleDelete(partyLedger)}
                />
              )}
            </div>
          </div>
        </div>
        {partyLedger?.created_at && (
          <p className="detail-title detail-label-color mb-1">
            Created on{' '}
            {formatDate(partyLedger?.created_at, 'DD/MM/YYYY - HH:MM:SS')} by{' '}
            {partyLedger?.creator?.user_name}
          </p>
        )}
        {!isNullOrEmpty(partyLedger?.editor) && (
          <p className="detail-title detail-label-color mb-0">
            Last Edited on{' '}
            {formatDate(partyLedger?.updated_at, 'DD/MM/YYYY - HH:MM:SS')} by{' '}
            {partyLedger?.editor?.user_name}
          </p>
        )}
      </div>
    </section>
  );
};

export default withModal(PartyLedgerDetails);
