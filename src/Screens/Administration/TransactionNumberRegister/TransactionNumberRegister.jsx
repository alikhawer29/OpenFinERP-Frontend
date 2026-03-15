import { useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import React, { useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { HiOutlinePencilSquare } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import { PulseLoader } from 'react-spinners';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { showToast } from '../../../Components/Toast/Toast';
import withFilters from '../../../HOC/withFilters ';
import useDataMutations from '../../../Hooks/useDataMutations';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';
import {
  editTransactionNumber,
  getTransactionNumberListing,
} from '../../../Services/Administration/TransactionNumberRegister';
import { transactionNumberHeaders, transactionNumberHeadersAccess } from '../../../Utils/Constants/TableHeaders';
import { showErrorToast } from '../../../Utils/Utils';
import useModulePermissions from '../../../Hooks/useModulePermissions';

const TransactionNumberRegister = ({
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Transaction Number Register');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedItem, setSelectedItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const permissions = useModulePermissions
    ("administration", "transaction_number_register")
  const { edit } = permissions;

  const { data, isLoading, isError, error } = useFetchTableData(
    'transactionNumberListing',
    filters,
    updatePagination,
    getTransactionNumberListing
  );

  const transactionNumberData = data || [];

  //  --- MUTATIONS ---
  const { editMutation } = useDataMutations({
    onEditSuccessCallback: () => {
      setShowEditModal(false);
      showToast('Transaction Number Register Updated Successfully', 'success');
      queryClient.invalidateQueries(['transactionNumberListing', filters]);
    },
    onEditErrorCallback: (error) => {
      setShowEditModal(false);
      showErrorToast(error);
    },
  });

  //  --- MUTATIONS END ---

  // Function to handle edit action
  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleEditTransaction = (values) => {
    if (values.auto_generate_transaction_number === 1) {
      values.transaction_number_limit = null;
    }
    if (values.isLastDeleted === false) {
      values.next_transaction_no = null;
    }
    editMutation.mutate({
      serviceFunction: editTransactionNumber,
      id: selectedItem.id,
      formData: values,
    });
  };
  if (isError) {
    showErrorToast(error);
  }

  return (
    <>
      <section>
        <div className="d-flex justify-content-between flex-wrap mb-4">
          <h2 className="screen-title mb-0">Transaction Number Register</h2>
        </div>
        <Row>
          <Col xs={12}>
            <CustomTable
              filters={filters}
              setFilters={setFilters}
              headers={edit ? transactionNumberHeaders : transactionNumberHeadersAccess}
              pagination={pagination}
              isLoading={isLoading}
              hasFilters={false}
              isPaginated={false}
            >
              {(transactionNumberData.length || isError) && (
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={transactionNumberHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {transactionNumberData?.map((item, index) => (
                    <tr key={item.id}>
                      <td>{item?.transaction_type}</td>
                      <td>{item?.prefix}</td>
                      <td>{item?.starting_no}</td>
                      <td>{item?.next_transaction_no}</td>
                      <td>{item?.transaction_number_limit || '-'}</td>
                      {
                        edit &&
                        <td>
                          <TableActionDropDown
                            actions={[
                              {
                                name: 'Edit',
                                icon: HiOutlinePencilSquare,
                                onClick: () => handleEdit(item),
                                className: 'edit',
                              },
                            ]}
                          />
                        </td>
                      }
                    </tr>
                  ))}
                </tbody>
              )}
            </CustomTable>
          </Col>
        </Row>
      </section>
      {/* Edit Transaction Number Modal */}
      <CustomModal show={showEditModal} close={() => setShowEditModal(false)}>
        <h4 className="text-center mt-2 mb-3 modalTitle fs-4">
          Edit Transaction Number Register
        </h4>
        <p className="text-center mb-4">
          <span className="fw-semibold">Transaction Type: </span>
          {selectedItem?.transaction_type}
        </p>
        <div className="px-sm-5">
          <Formik
            initialValues={{
              transaction_number_limit: selectedItem?.transaction_number_limit,
              auto_generate_transaction_number:
                selectedItem?.auto_generate_transaction_number,
              next_transaction_no: selectedItem?.next_transaction,
              isLastDeleted: selectedItem?.isLastDeleted,
            }}
            // validationSchema={addClassificationSchema}
            onSubmit={handleEditTransaction}
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
                <div className="mb-4">
                  <CustomInput
                    name="transaction_number_limit"
                    id="transaction_number_limit"
                    label="Transaction Number Limit"
                    required={!values.auto_generate_transaction_number}
                    type="number"
                    placeholder="Enter Transaction Number Limit"
                    value={values.transaction_number_limit}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={
                      touched.transaction_number_limit &&
                      errors.transaction_number_limit
                    }
                    disabled={values.auto_generate_transaction_number === 1} // Disable when auto_generate_transaction_number is 1
                  />
                </div>
                <div className="d-inline-flex align-items-center mb-4">
                  <div className="checkbox-wrapper">
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        defaultChecked={values.auto_generate_transaction_number}
                        onChange={(e) => {
                          const isChecked = e.target.checked ? 1 : 0;

                          setFieldValue(
                            'auto_generate_transaction_number',
                            isChecked
                          );
                        }}
                        name="auto_generate_transaction_number"
                      />
                      <span className="custom-checkbox"></span>Auto-Generate
                      Transaction Number
                    </label>
                  </div>
                </div>
                <div className="mb-45">
                  <CustomInput
                    name="next_transaction_no"
                    id="next_transaction_no"
                    label="Next Transaction Number"
                    type="text"
                    placeholder="Enter Next Transaction Number"
                    value={values.next_transaction_no}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={
                      touched.next_transaction_no && errors.next_transaction_no
                    }
                    disabled={!selectedItem.isLastDeleted}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {!editMutation.isPending ? (
                    <>
                      <CustomButton type="submit" text={'Save'} />
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() => setShowEditModal(false)}
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

export default withFilters(TransactionNumberRegister);
