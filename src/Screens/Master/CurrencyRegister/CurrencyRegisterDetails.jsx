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
  deleteCurrencyRegister,
  viewCurrencyRegister,
} from '../../../Services/Masters/CurrencyRegister';
import {
  formatDate,
  isNullOrEmpty,
  showErrorToast,
} from '../../../Utils/Utils';
import useModulePermissions from '../../../Hooks/useModulePermissions';

const CurrencyRegisterDetails = ({ showModal, closeModal }) => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  usePageTitle('Currency Register - Details');

  const topSection = () => (
    <div className="d-flex align-items-start mb-4 justify-content-between flex-wrap">
      <div className="d-flex flex-column gap-2">
        <BackButton />
        <h2 className="screen-title m-0 d-inline">Currency Register</h2>
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
      showToast('Currency deleted Successfully', 'success');
      // Invalidate multiple queries
      [['currencyRegisterDetails', id], 'currencyRegisterListing'].forEach(
        (key) => queryClient.invalidateQueries({ queryKey: [...key] })
      );
      setTimeout(() => {
        navigate(-1);
      }, 300);
    },
    onDeleteErrorCallback: (error) => {
      if (
        error.message.toLowerCase() ==
        'the currency cannot be deleted as it is currently in use.'
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
    data: currencyRegister,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['currencyRegisterDetails', id],
    queryFn: () => viewCurrencyRegister(id),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Function to handle Delete action
  const handleDelete = (item) => {
    showModal(
      'Delete',
      `Are you sure you want to delete currency ${item.currency_name}?`,
      () => {
        deleteMutation.mutate({
          serviceFunction: deleteCurrencyRegister,
          id: item.id,
        });
      }
    );
  };
  const permissions = useModulePermissions('master', 'currency_register');
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
                {Array.from({ length: 11 }).map((_, i) => (
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
                {
                  label: 'Currency Code',
                  value: currencyRegister?.currency_code,
                },
                {
                  label: 'Currency Name',
                  value: currencyRegister?.currency_name,
                },
                { label: 'Rate Type', value: currencyRegister?.rate_type },
                {
                  label: 'Currency Type',
                  value: currencyRegister?.currency_type,
                },
                {
                  label: 'Rate Variation',
                  value: currencyRegister?.rate_variation,
                },
                { label: 'Group', value: currencyRegister?.group },
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
              <div className="row">
                <div className="col-12 col-sm-6 mb-4">
                  <p className="detail-title detail-label-color mb-1"></p>
                  <p className="detail-text wrapText mb-0">
                    <div className="checkbox-wrapper">
                      <label
                        style={{ cursor: 'default' }}
                        className="checkbox-container"
                      >
                        <input
                          key={'allow_online_rate'}
                          defaultChecked={currencyRegister.allow_online_rate}
                          disabled={true}
                          type="checkbox"
                          name="allow_online_rate"
                        />
                        <span className="custom-checkbox not-hover"></span>
                        Allow Online Rate
                      </label>
                    </div>
                  </p>
                </div>

                <div className="col-12 col-sm-6 mb-4">
                  <p className="detail-title detail-label-color mb-1"></p>
                  <p className="detail-text wrapText mb-0">
                    <div className="checkbox-wrapper">
                      <label
                        style={{ cursor: 'default' }}
                        className="checkbox-container"
                      >
                        <input
                          key={'allow_auto_pairing'}
                          defaultChecked={currencyRegister.allow_auto_pairing}
                          disabled={true}
                          type="checkbox"
                          name="allow_auto_pairing"
                        />
                        <span className="custom-checkbox not-hover"></span>
                        Allow Auto-Pairing
                      </label>
                    </div>
                  </p>
                </div>

                <div className="col-12 col-sm-6 mb-4">
                  <p className="detail-title detail-label-color mb-1"></p>
                  <p className="detail-text wrapText mb-0">
                    <div className="checkbox-wrapper">
                      <label
                        style={{ cursor: 'default' }}
                        className="checkbox-container"
                      >
                        <input
                          key={'allow_second_preference'}
                          defaultChecked={
                            currencyRegister.allow_second_preference
                          }
                          disabled={true}
                          type="checkbox"
                          name="allow_second_preference"
                        />
                        <span className="custom-checkbox not-hover"></span>
                        Allow Second Preference
                      </label>
                    </div>
                  </p>
                </div>

                <div className="col-12 col-sm-6 mb-4">
                  <p className="detail-title detail-label-color mb-1"></p>
                  <p className="detail-text wrapText mb-0">
                    <div className="checkbox-wrapper">
                      <label
                        style={{ cursor: 'default' }}
                        className="checkbox-container"
                      >
                        <input
                          key={'special_rate_currency'}
                          defaultChecked={
                            currencyRegister.special_rate_currency
                          }
                          disabled={true}
                          type="checkbox"
                          name="special_rate_currency"
                        />
                        <span className="custom-checkbox not-hover"></span>
                        Special Rate Currency
                      </label>
                    </div>
                  </p>
                </div>

                <div className="col-12 col-sm-6 mb-4">
                  <p className="detail-title detail-label-color mb-1"></p>
                  <p className="detail-text wrapText mb-0">
                    <div className="checkbox-wrapper">
                      <label
                        style={{ cursor: 'default' }}
                        className="checkbox-container"
                      >
                        <input
                          key={'restrict_pair'}
                          defaultChecked={currencyRegister.restrict_pair}
                          disabled={true}
                          type="checkbox"
                          name="restrict_pair"
                        />
                        <span className="custom-checkbox not-hover"></span>
                        Restrict Pair
                      </label>
                    </div>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="row mb-4">
            <div className="col-12 d-flex">
              {hasDeletePermission && (
                <CustomButton
                  text={'Delete'}
                  variant={'danger'}
                  onClick={() => handleDelete(currencyRegister)}
                />
              )}
            </div>
          </div>
        </div>
        {currencyRegister?.created_at && (
          <p className="detail-title detail-label-color mb-1">
            Created on{' '}
            {formatDate(currencyRegister?.created_at, 'DD/MM/YYYY - HH:MM:SS')}{' '}
            by {currencyRegister?.creator?.user_name}
          </p>
        )}
        {!isNullOrEmpty(currencyRegister?.editor) && (
          <p className="detail-title detail-label-color mb-0">
            Last Edited on{' '}
            {formatDate(currencyRegister?.updated_at, 'DD/MM/YYYY - HH:MM:SS')}{' '}
            by {currencyRegister?.editor?.user_name}
          </p>
        )}
      </div>
    </section>
  );
};

export default withModal(CurrencyRegisterDetails);
