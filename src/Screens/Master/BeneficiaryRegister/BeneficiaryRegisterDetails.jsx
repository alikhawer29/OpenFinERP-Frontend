import { useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import Skeleton from 'react-loading-skeleton';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import { showToast } from '../../../Components/Toast/Toast';
import withModal from '../../../HOC/withModal';
import useDataMutations from '../../../Hooks/useDataMutations';
import {
  deleteBeneficiaryRegister,
  viewBeneficiaryRegister,
} from '../../../Services/Masters/BeneficiaryRegister';
import {
  formatDate,
  getCountryFlag,
  isNullOrEmpty,
  showErrorToast,
} from '../../../Utils/Utils';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import useModulePermissions from '../../../Hooks/useModulePermissions';

const BeneficiaryRegisterDetails = ({ showModal, closeModal }) => {
  usePageTitle('Beneficiary Register - Details');

  const { id } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const topSection = () => (
    <div className="d-flex align-items-start mb-4 justify-content-between flex-wrap">
      <div className="d-flex flex-column gap-2">
        <BackButton />
        <h2 className="screen-title m-0 d-inline">Beneficiary Register</h2>
      </div>
      <div className="d-flex gap-2 flex-wrap">
        {hasEditPermission && (
          <CustomButton text={'Edit'} onClick={() => navigate('edit')} />
        )}
      </div>
    </div>
  );
  const { deleteMutation } = useDataMutations({
    onDeleteSuccessCallback: () => {
      closeModal();
      showToast('Beneficiary Register deleted Successfully', 'success');
      // Invalidate multiple queries
      [
        ['beneficiaryRegisterDetails', id],
        'beneficiaryRegisterListing',
      ].forEach((key) => queryClient.invalidateQueries({ queryKey: [...key] }));
      setTimeout(() => {
        navigate(-1);
      }, 300);
    },
    onDeleteErrorCallback: (error) => {
      if (
        error.message.toLowerCase() ==
        'The beneficiary cannot be deleted as it is currently in use.'
      ) {
        showModal(
          'Cannot be Deleted',
          error.message,
          () => closeModal(),
          'error'
        );
      } else {
        showErrorToast(error);
      }
    },
  });

  // Queries and Mutations
  const {
    data: beneficiaryRegister,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['beneficiaryRegisterDetails', id],
    queryFn: () => viewBeneficiaryRegister(id),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Function to handle Delete action
  const handleDelete = (item) => {
    showModal(
      'Delete',
      `Are you sure you want to delete Beneficiary Register ${item.name}?`,
      () => {
        deleteMutation.mutate({
          serviceFunction: deleteBeneficiaryRegister,
          id: item.id,
        });
      }
    );
  };

  // Permission checks using optimized hook
  const permissions = useModulePermissions('master', 'beneficiary_register');

  const {
    create: hasCreatePermission,
    edit: hasEditPermission,
    delete: hasDeletePermission,
  } = permissions;

  if (isLoading) {
    return (
      <>
        {topSection()}
        <div className="d-card ">
          <div className="row">
            <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
              <div className="row mb-4">
                {Array.from({ length: 22 }).map((_, i) => (
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
      <div className="d-card">
        <div className="row ">
          <div className="col-12 col-lg-10 col-xl-9 col-xxl-7 mb-4">
            <div className="row">
              {[
                { label: 'Account', value: beneficiaryRegister?.account_name },
                { label: 'Name', value: beneficiaryRegister?.name },
                { label: 'Company', value: beneficiaryRegister?.company },
                { label: 'Address', value: beneficiaryRegister?.address },
                {
                  label: 'Nationality',
                  value: beneficiaryRegister?.nationality?.name,
                },
                {
                  label: 'Contact No.',
                  value: beneficiaryRegister?.contact_no ? (
                    <>
                      <span>
                        {getCountryFlag(beneficiaryRegister?.contact_no)}
                      </span>
                      {beneficiaryRegister?.contact_no}
                    </>
                  ) : null,
                },
                { label: 'Bank Name', value: beneficiaryRegister?.bank_name },
                {
                  label: 'Bank Account Number',
                  value: beneficiaryRegister?.bank_account_number,
                },
                {
                  label: 'SWIFT/ BIC Code',
                  value: beneficiaryRegister?.swift_bic_code,
                },
                {
                  label: 'Routing Number',
                  value: beneficiaryRegister?.routing_number,
                },
                { label: 'IBAN', value: beneficiaryRegister?.iban },
                {
                  label: 'Bank Address',
                  value: beneficiaryRegister?.bank_address,
                },
                { label: 'City', value: beneficiaryRegister?.city },
                {
                  label: 'Country',
                  value: beneficiaryRegister?.country?.country,
                },
                {
                  label: 'Corresponding Bank',
                  value: beneficiaryRegister?.corresponding_bank,
                },
                {
                  label: 'Bank Account Number',
                  value: beneficiaryRegister?.corresponding_bank_account_number,
                },
                {
                  label: 'SWIFT/BIC Code',
                  value: beneficiaryRegister?.corresponding_swift_bic_code,
                },
                {
                  label: 'Routing Number',
                  value: beneficiaryRegister?.corresponding_routing_number,
                },
                {
                  label: 'IBAN',
                  value: beneficiaryRegister?.corresponding_iban,
                },
                {
                  label: 'Purpose',
                  value: beneficiaryRegister?.purpose?.description,
                },
                { label: 'Branch', value: beneficiaryRegister?.branch },
                { label: 'IFSC Code', value: beneficiaryRegister?.ifsc_code },
              ].map((x, i) => {
                return (
                  <div key={i} className="col-12 col-sm-6 mb-4">
                    <p className="detail-title detail-label-color mb-1">
                      {x.label}
                    </p>
                    <p className="detail-text wrapText mb-0">
                      {isNullOrEmpty(x.value) ? '-' : x.value}
                    </p>
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
                  onClick={() => handleDelete(beneficiaryRegister)}
                />
              )}
            </div>
          </div>
        </div>
        {beneficiaryRegister?.created_at && (
          <p className="detail-title detail-label-color mb-1">
            Created on{' '}
            {formatDate(
              beneficiaryRegister?.created_at,
              'DD/MM/YYYY - HH:MM:SS'
            )}{' '}
            by {beneficiaryRegister?.creator?.user_name}
          </p>
        )}
        {!isNullOrEmpty(beneficiaryRegister?.editor) && (
          <p className="detail-title detail-label-color mb-0">
            Last Edited on{' '}
            {formatDate(
              beneficiaryRegister?.updated_at,
              'DD/MM/YYYY - HH:MM:SS'
            )}{' '}
            by {beneficiaryRegister?.editor?.user_name}
          </p>
        )}
      </div>
    </section>
  );
};

export default withModal(BeneficiaryRegisterDetails);
