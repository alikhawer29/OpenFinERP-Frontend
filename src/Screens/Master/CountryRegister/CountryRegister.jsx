import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import React, { useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { HiOutlineTrash } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import { PulseLoader } from 'react-spinners';
import CustomButton from '../../../Components/CustomButton';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { showToast } from '../../../Components/Toast/Toast';
import withFilters from '../../../HOC/withFilters ';
import withModal from '../../../HOC/withModal';
import { useNationalities } from '../../../Hooks/countriesAndStates';
import useAutoFocus from '../../../Hooks/useAutoFocus';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';
import {
  addCountryRegister,
  deleteCountryRegister,
  getCountryRegisterListing,
} from '../../../Services/Masters/CountryRegister';
import { countryRegisterHeaders } from '../../../Utils/Constants/TableHeaders';
import { showErrorToast } from '../../../Utils/Utils';
import { addCountryValidationSchema } from '../../../Utils/Validations/ValidationSchemas';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import { filterActions, filterHeaders } from '../../../Utils/Helpers';

const CountryRegister = ({
  showModal,
  closeModal,
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Country Register');
  const navigate = useNavigate();
  const [showAddCountryModal, setShowAddCountryModal] = useState(false);
  const firstInputFocusRef = useAutoFocus();

  const { data, isLoading, isError, error } = useFetchTableData(
    'countryRegisterListing',
    filters,
    updatePagination,
    getCountryRegisterListing
  );
  const {
    data: countries,
    isLoading: loadingCountries,
    isError: errorCountries,
  } = useNationalities();

  const queryClient = useQueryClient();

  const countryRegisterData = data?.data || [];

  //  --- MUTATIONS ---
  // Delete Country Mutation
  const deleteCountryMutation = useMutation({
    mutationFn: deleteCountryRegister,
    onSuccess: () => {
      closeModal();
      showToast('Country Deleted Successfully', 'success');
      queryClient.invalidateQueries(['countryRegisterListing', filters]);
    },
    onError: (error) => {
      if (
        error.message.toLowerCase() ==
        'the country register cannot be deleted as it is currently in use.'
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
  // Add Country Mutation
  const addCountryMutation = useMutation({
    mutationFn: addCountryRegister,
    onSuccess: () => {
      setShowAddCountryModal(false);
      showToast('New Country Added', 'success');
      queryClient.invalidateQueries(['countryListing', filters]);
    },
    onError: (error) => {
      setShowAddCountryModal(false);
      showErrorToast(error);
    },
  });

  //  --- MUTATIONS END ---

  // Function to handle Delete action
  const handleDelete = (item) => {
    showModal(
      'Delete',
      `Are you sure you want to delete country ${item.country}?`,
      () => {
        deleteCountryMutation.mutate(item.id);
      }
    );
  };
  const handleAddCountry = (values) => {
    addCountryMutation.mutate(values);
  };

  // Function to fetch Countries and show loading/error if api fails
  const getCountriesOptions = () => {
    if (!loadingCountries && !errorCountries) {
      return countries;
    } else {
      if (errorCountries) {
        console.error('Unable to fetch clasification types', error);
        return [{ label: 'Unable to fetch Countries', value: null }];
      } else {
        return [{ label: 'Loading...', value: null, isDisabled: true }];
      }
    }
  };
  if (isError) {
    showErrorToast(error);
  }
  const permissions = useModulePermissions('master', 'country_register');
  const {
    create: hasCreatePermission,
    edit: hasEditPermission,
    delete: hasDeletePermission,
  } = permissions;
  const visibleHeaders = filterHeaders(countryRegisterHeaders, {
    Action: hasDeletePermission,
  });
  return (
    <>
      <section>
        <div className="d-flex justify-content-between flex-wrap mb-3">
          <h2 className="screen-title mb-0">Country Register</h2>
          {hasCreatePermission && (
            <CustomButton
              text={'New'}
              onClick={() => {
                setShowAddCountryModal(true);
              }}
            />
          )}
        </div>
        <Row>
          <Col xs={12}>
            <CustomTable
              filters={filters}
              setFilters={setFilters}
              headers={visibleHeaders}
              pagination={pagination}
              isLoading={isLoading}
            >
              {(countryRegisterData?.length || isError) && (
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={visibleHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {countryRegisterData?.map((item) => (
                    <tr key={item.id}>
                      <td width={'33%'}>{item.code}</td>
                      <td width={'34%'}>{item.country}</td>
                      <td width={'33%'}>
                        <TableActionDropDown
                          actions={filterActions(
                            [
                              {
                                name: 'Delete',
                                icon: HiOutlineTrash,
                                onClick: () => handleDelete(item),
                                className: 'delete',
                              },
                            ],
                            permissions
                          )}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </CustomTable>
          </Col>
        </Row>
      </section>
      {/* Add ware house Modal  */}
      <CustomModal
        show={showAddCountryModal}
        close={() => setShowAddCountryModal(false)}
      >
        <div className="text-center mb-3">
          <h4 className="modalTitle">New Country</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{ country: '' }}
            validationSchema={addCountryValidationSchema}
            onSubmit={handleAddCountry}
          >
            {({ setFieldValue, values }) => (
              <Form>
                <div className="mb-45">
                  <SearchableSelect
                    label={'Country'}
                    name="country"
                    ref={firstInputFocusRef}
                    options={getCountriesOptions()}
                    required
                    onChange={(v) => {
                      setFieldValue('country', v.value.toString());
                    }}
                    value={Number(values.country)}
                    placeholder={'Select a Country'}
                  />
                  <ErrorMessage
                    name="country"
                    component="div"
                    className="input-error-message text-danger"
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {!addCountryMutation.isPending ? (
                    <>
                      <CustomButton type="submit" text={'Save'} />
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() => setShowAddCountryModal(false)}
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

export default withModal(withFilters(CountryRegister));
