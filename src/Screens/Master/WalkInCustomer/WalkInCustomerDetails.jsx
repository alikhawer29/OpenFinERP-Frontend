import { useQuery, useQueryClient } from '@tanstack/react-query';
import { capitalize } from 'lodash';
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
  deleteWalkInCustomer,
  viewWalkInCustomer,
} from '../../../Services/Masters/WalkInCustomer';
import {
  formatDate,
  getCountryFlag,
  isNullOrEmpty,
  showErrorToast,
} from '../../../Utils/Utils';
import useModulePermissions from '../../../Hooks/useModulePermissions';

const WalkInCustomerDetails = ({ showModal, closeModal }) => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  usePageTitle('Walk In Customer - Details');

  const permissions = useModulePermissions('master', 'walk_in_customer');
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
        <h2 className="screen-title m-0 d-inline">Walk-in Customer Register</h2>
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
      showToast('Walk-In Customer deleted Successfully', 'success');
      // Invalidate multiple queries
      [['walkInCustomerDetails', id], 'walkInCustomerListing'].forEach((key) =>
        queryClient.invalidateQueries({ queryKey: [...key] })
      );
      setTimeout(() => {
        navigate(-1);
      }, 300);
    },
    onDeleteErrorCallback: (error) => {
      if (
        error.message.toLowerCase() ==
        'the walk-in customer cannot be deleted as it is currently in use.'
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
    data: walkInCustomer,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['walkInCustomerDetails', id],
    queryFn: () => viewWalkInCustomer(id),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Function to handle Delete action
  const handleDelete = (item) => {
    showModal(
      'Delete',
      `Are you sure you want to delete Walk-in Customer ${item.customer_name}?`,
      () => {
        deleteMutation.mutate({
          serviceFunction: deleteWalkInCustomer,
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
      <div className="d-card">
        <>
          <div className="row ">
            <div className="col-12 col-lg-10 col-xl-9 col-xxl-7 mb-4">
              <div className="row">
                {[
                  {
                    label: 'Customer Name',
                    value: walkInCustomer.customer_name,
                  },
                  { label: 'Company', value: walkInCustomer?.company },
                  { label: 'Address', value: walkInCustomer?.address },
                  { label: 'City', value: walkInCustomer?.city },
                  { label: 'Designation', value: walkInCustomer?.designation },
                  {
                    label: 'Mobile Number',
                    value: (
                      <>
                        <span>
                          {getCountryFlag(walkInCustomer.mobile_number_full)}
                        </span>{' '}
                        {walkInCustomer.mobile_number_full}
                      </>
                    ),
                  },
                  {
                    label: 'Telephone Number',
                    value: (
                      <>
                        <span>
                          {getCountryFlag(walkInCustomer.telephone_number_full)}
                        </span>{' '}
                        {walkInCustomer.telephone_number_full}
                      </>
                    ),
                  },
                  {
                    label: 'Fax',
                    value: (
                      <>
                        <span>
                          {getCountryFlag(walkInCustomer?.fax_number_full)}
                        </span>{' '}
                        {walkInCustomer?.fax_number_full || "-"}
                      </>
                    ),
                  },
                  { label: 'Email', value: walkInCustomer?.email },
                  {
                    label: 'ID Type',
                    value: walkInCustomer?.id_type?.description,
                  },
                  { label: 'ID Number', value: walkInCustomer?.id_number },
                  {
                    label: 'Issue Date',
                    value: walkInCustomer?.issue_date
                      ? formatDate(walkInCustomer?.issue_date)
                      : null,
                  },
                  {
                    label: 'Expiry Date',
                    value: walkInCustomer?.expiry_date
                      ? formatDate(walkInCustomer?.expiry_date)
                      : null,
                  },
                  {
                    label: 'Place of Issue',
                    value: walkInCustomer?.issue_place,
                  },
                  {
                    label: 'Nationality',
                    value: walkInCustomer?.nationality?.name,
                  },
                  {
                    label: 'Status',
                    value: capitalize(walkInCustomer?.status),
                  },
                  { label: 'VAT TRN', value: walkInCustomer?.vat_trn },
                  {
                    label: 'VAT Country',
                    value: walkInCustomer?.vat_country?.name,
                  },
                  {
                    label: 'VAT State',
                    value: walkInCustomer?.vat_state?.name,
                  },
                  {
                    label: 'VAT Exempted',
                    value: walkInCustomer?.vat_exempted ? 'Yes' : 'No',
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
              <div className="col-12 d-flex">
                {hasDeletePermission && (
                  <CustomButton
                    text={'Delete'}
                    variant={'danger'}
                    onClick={() => handleDelete(walkInCustomer)}
                  />
                )}
              </div>
            </div>
          </div>
        </>
        {walkInCustomer?.created_at && (
          <p className="detail-title detail-label-color mb-1">
            Created on{' '}
            {formatDate(walkInCustomer?.created_at, 'DD/MM/YYYY - HH:MM:SS')} by{' '}
            {walkInCustomer.creator?.user_name}
          </p>
        )}
        {!isNullOrEmpty(walkInCustomer?.editor) && (
          <p className="detail-title detail-label-color mb-0">
            Last Edited on{' '}
            {formatDate(walkInCustomer?.updated_at, 'DD/MM/YYYY - HH:MM:SS')} by{' '}
            {walkInCustomer.editor?.user_name}
          </p>
        )}
      </div>
    </section>
  );
};

export default withModal(WalkInCustomerDetails);
