import { useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { Col, Row } from 'react-bootstrap';
import { FaRegMoneyBill1 } from 'react-icons/fa6';
import {
  HiOutlineEye,
  HiOutlinePencilSquare,
  HiOutlineTrash,
} from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../../../Components/CustomButton';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { showToast } from '../../../Components/Toast/Toast';
import withFilters from '../../../HOC/withFilters ';
import withModal from '../../../HOC/withModal';
import useDataMutations from '../../../Hooks/useDataMutations';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';
import {
  deleteCurrencyRegister,
  getCurrencyRegisterListing,
} from '../../../Services/Masters/CurrencyRegister';
import { currencyRegisterHeaders } from '../../../Utils/Constants/TableHeaders';
import { showErrorToast } from '../../../Utils/Utils';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import { filterActions, filterHeaders } from '../../../Utils/Helpers';

const CurrencyRegister = ({
  showModal,
  closeModal,
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Currency Register');

  const {
    data: { data: currencyRegisterData = [] } = {},
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'currencyRegisterListing',
    filters,
    updatePagination,
    getCurrencyRegisterListing
  );
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { deleteMutation } = useDataMutations({
    onDeleteSuccessCallback: () => {
      closeModal();
      showToast('Currency Deleted Successfully', 'success');
      queryClient.invalidateQueries(['currencyRegisterListing', filters]);
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

  // Function to handle Delete action
  const handleDelete = (item) => {
    showModal(
      'Delete',
      `Are you sure you want to delete Currency ${item?.currency_name}?`,
      () => {
        deleteMutation.mutate({
          serviceFunction: deleteCurrencyRegister,
          id: item.id,
        });
      }
    );
  };

  if (isError) {
    showErrorToast(error);
  }

  const permissions = useModulePermissions('master', 'currency_register');

  const {
    create: hasCreatePermission,
    edit: hasEditPermission,
    delete: hasDeletePermission,
  } = permissions;

  return (
    <>
      <section>
        <div className="d-flex justify-content-between flex-wrap mb-3">
          <h2 className="screen-title mb-0">Currency Register</h2>
          {hasCreatePermission && (
            <CustomButton text={'New'} onClick={() => navigate('new')} />
          )}
        </div>
        <Row>
          <Col xs={12}>
            <CustomTable
              filters={filters}
              setFilters={setFilters}
              headers={currencyRegisterHeaders}
              pagination={pagination}
              isLoading={isLoading}
              className={'currency-register-table'}
            >
              {(currencyRegisterData.length || isError) && (
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={currencyRegisterHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {currencyRegisterData?.map((item) => (
                    <tr key={item.id}>
                      <td>{item.currency_code}</td>
                      <td>{item.currency_name}</td>
                      <td>{item.rate_type}</td>
                      <td>{item.rate_variation}</td>
                      <td>{item.currency_type}</td>
                      <td>
                        <div className="checkbox-wrapper">
                          <label
                            style={{ cursor: 'default' }}
                            className="checkbox-container"
                          >
                            <input
                              key={'allow_online_rate'}
                              checked={item.allow_online_rate}
                              disabled={true}
                              type="checkbox"
                              name="allow_online_rate"
                            />
                            <span className="custom-checkbox not-hover"></span>
                          </label>
                        </div>
                      </td>
                      <td>
                        <div className="checkbox-wrapper">
                          <label
                            style={{ cursor: 'default' }}
                            className="checkbox-container"
                          >
                            <input
                              key={'allow_auto_pairing'}
                              checked={item.allow_auto_pairing}
                              disabled={true}
                              type="checkbox"
                              name="allow_auto_pairing"
                            />
                            <span className="custom-checkbox not-hover"></span>
                          </label>
                        </div>
                      </td>
                      <td>
                        <div className="checkbox-wrapper">
                          <label
                            style={{ cursor: 'default' }}
                            className="checkbox-container"
                          >
                            <input
                              key={'allow_second_preference'}
                              checked={item.allow_second_preference}
                              disabled={true}
                              type="checkbox"
                              name="allow_second_preference"
                            />
                            <span className="custom-checkbox not-hover"></span>
                          </label>
                        </div>
                      </td>
                      <td>
                        <div className="checkbox-wrapper">
                          <label
                            style={{ cursor: 'default' }}
                            className="checkbox-container"
                          >
                            <input
                              key={'special_rate_currency'}
                              checked={item.special_rate_currency}
                              disabled={true}
                              type="checkbox"
                              name="special_rate_currency"
                            />
                            <span className="custom-checkbox not-hover"></span>
                          </label>
                        </div>
                      </td>
                      <td>
                        <div className="checkbox-wrapper">
                          <label
                            style={{ cursor: 'default' }}
                            className="checkbox-container"
                          >
                            <input
                              key={'restrict_pair'}
                              checked={item.restrict_pair}
                              disabled={true}
                              type="checkbox"
                              name="restrict_pair"
                            />
                            <span className="custom-checkbox not-hover"></span>
                          </label>
                        </div>
                      </td>
                      <td>{item.group}</td>
                      <td>
                        <TableActionDropDown
                          actions={filterActions(
                            [
                              {
                                name: 'View',
                                icon: HiOutlineEye,
                                onClick: () => navigate(`${item.id}`),
                                className: 'view',
                              },
                              {
                                name: 'Edit',
                                icon: HiOutlinePencilSquare,
                                onClick: () => navigate(`${item.id}/edit`),
                                className: 'edit',
                              },
                              {
                                name: 'Delete',
                                icon: HiOutlineTrash,
                                onClick: () => handleDelete(item),
                                className: 'delete',
                              },
                              {
                                name: 'Denomination',
                                icon: FaRegMoneyBill1,
                                onClick: () => console.log(''),
                                className: 'attachments',
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
    </>
  );
};

export default withModal(withFilters(CurrencyRegister));
