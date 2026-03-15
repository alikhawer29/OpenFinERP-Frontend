import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { HiOutlineTrash } from 'react-icons/hi2';
import { PulseLoader } from 'react-spinners';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import StatusChip from '../../../Components/StatusChip/StatusChip';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { showToast } from '../../../Components/Toast/Toast';
import withFilters from '../../../HOC/withFilters ';
import withModal from '../../../HOC/withModal';
import { useBanks } from '../../../Hooks/useBanks';
import useDataMutations from '../../../Hooks/useDataMutations';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';
import {
  addChequeBookRegister,
  deleteCheque,
  deleteChequeBook,
  getChequeRegisterListing,
  getReference,
} from '../../../Services/Administration/ChequeRegister';
import {
  chequeRegisterHeaders,
  chequeRegisterHeadersAccess,
} from '../../../Utils/Constants/TableHeaders';
import { serialNum, showErrorToast } from '../../../Utils/Utils';
import {
  addChequeBookValidationSchema,
  deleteChequeBookValidationSchema,
} from '../../../Utils/Validations/ValidationSchemas';

const ChequeRegister = ({
  showModal,
  closeModal,
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Cheque Register');
  const queryClient = useQueryClient();

  const [selectedItem, setSelectedItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteChequeBookModal, setShowDeleteChequeBookModal] =
    useState(false);
  const [
    showConfirmDeleteChequeBookModal,
    setShowConfirmDeleteChequeBookModal,
  ] = useState(false);
  const [chequeBookToDelete, setChequeBookToDelete] = useState(null);
  const [showAddChequeBookModal, setShowAddChequeBookModal] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState(null); // Store selected bank ID
  const [deleteChequeBookFormValues, setDeleteChequeBookFormValues] = useState({
    bank: '',
    reference_no: '',
  });

  const permissions = useModulePermissions('administration', 'cheque_register');
  const { create_cheque_book, delete_cheque_book, delete_single_cheque } =
    permissions;

  const { bankOptions } = useBanks();
  const { data, isLoading, isError, error } = useFetchTableData(
    'chequeRegisterListing',
    filters,
    updatePagination,
    getChequeRegisterListing
  );

  const chequeRegisterData = data?.data || [];

  //  --- MUTATIONS ---
  const {
    data: reference,
    isLoading: referenceLoading,
    isError: referenceError,
    error: referenceErrorMessage,
  } = useQuery({
    queryKey: ['reference', selectedBankId], // Ensure it updates on change
    queryFn: () => getReference(selectedBankId), // Use separate state value
    enabled: !!selectedBankId, // Run query only if bank ID is set
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const { deleteMutation } = useDataMutations({
    onDeleteSuccessCallback: () => {
      closeModal();
      showToast('Cheque Deleted Successfully', 'success');
      setShowDeleteModal(false);
      queryClient.invalidateQueries(['chequeRegisterListing', filters]);
    },
    onDeleteErrorCallback: (error) => {
      if (
        error.message.toLowerCase() ==
        'the cheque register cannot be deleted as it is currently in use.'
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

  // Delete Cheque Book Mutation
  const deleteChequeBookMutation = useMutation({
    mutationFn: deleteChequeBook,
    onSuccess: () => {
      setShowDeleteChequeBookModal(false);
      setShowConfirmDeleteChequeBookModal(false);
      showToast('Cheque Book Deleted Successfully', 'success');
      queryClient.invalidateQueries(['chequeRegisterListing', filters]);
    },
    onError: (error) => {
      setShowConfirmDeleteChequeBookModal(false);
      if (error.message.toLowerCase().endsWith == 'currently in use.') {
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

  // Add Cheque Book Mutation
  const addChequeBookMutation = useMutation({
    mutationFn: addChequeBookRegister,
    onSuccess: () => {
      setShowAddChequeBookModal(false);
      showToast('Cheque Book Created Successfully', 'success');
      queryClient.invalidateQueries(['chequeRegisterListing', filters]);
    },
    onError: (error) => {
      setShowAddChequeBookModal(false);
      showErrorToast(error);
    },
  });

  //  --- MUTATIONS END ---

  // Function to handle Delete action
  const handleDelete = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleDeleteChequeBook = (values) => {
    // Debug the actual values received
    console.log('Raw values:', deleteChequeBookFormValues);

    // Get bank name from the selected bank option
    const selectedBankOption = bankOptions.find(
      (opt) => opt.value === (values.bank?.value || values.bank)
    );
    const bankName = selectedBankOption?.label || '';

    // Extract the actual values for API submission
    const submissionData = {
      bank: typeof values.bank === 'object' ? values.bank.value : values.bank,
      reference_no: values.reference_no.label,
    };

    const submissionData2 = {
      bank: bankName,
      reference_no: values.reference_no.label,
      bank_name: bankName, // Include bank name for confirmation modal
    };

    console.log('Submission data:', submissionData2); // Debug log

    // Set the selected item with bank name for the confirmation modal
    setSelectedItem(submissionData2);
    setChequeBookToDelete(submissionData);
    setShowConfirmDeleteChequeBookModal(true);
    setShowDeleteChequeBookModal(false);
  };
  const handleAddChequeBook = (values) => {
    addChequeBookMutation.mutate(values);
  };

  // Auto-select reference number when there's only one option
  useEffect(() => {
    if (
      selectedBankId && // Bank is selected
      !deleteChequeBookFormValues.reference_no && // Reference not already selected
      !referenceLoading && // Not loading
      !referenceError && // No error
      reference && // Reference data exists
      reference.length === 1 && // Only one option
      reference[0].id !== null // Valid option
    ) {
      // Find the full option object to match what SearchableSelect expects
      const referenceOptions = getReferenceOptions();

      const fullOption = referenceOptions.find(
        (opt) => opt.value === reference[0].id
      );

      if (fullOption) {
        setDeleteChequeBookFormValues((prev) => ({
          ...prev,
          reference_no: fullOption,
        }));
      }
    }
  }, [
    selectedBankId,
    reference,
    referenceLoading,
    referenceError,
    deleteChequeBookFormValues.reference_no,
  ]);

  // Reset form when modal closes
  useEffect(() => {
    if (!showDeleteChequeBookModal) {
      setDeleteChequeBookFormValues({
        bank: '',
        reference_no: '',
      });
      setSelectedBankId(null);
    }
  }, [showDeleteChequeBookModal]);

  const getReferenceOptions = () => {
    if (!referenceLoading && !referenceError) {
      return reference?.map((x) => ({
        value: x.id,
        label: x.reference_no,
      }));
    } else {
      if (referenceError) {
        console.error('Unable to fetch reference', referenceErrorMessage);
        return [{ label: 'Unable to fetch reference', value: null }];
      } else {
        return [{ label: 'Loading...', value: null, isDisabled: true }];
      }
    }
  };

  if (isError) {
    showErrorToast(error);
  }

  return (
    <>
      <section>
        <div className="d-flex gap-3 justify-content-between flex-wrap mb-3">
          <h2 className="screen-title mb-0">Cheque Register</h2>
          <div className="d-flex gap-2">
            {delete_cheque_book && (
              <CustomButton
                text={'Delete Cheque Book'}
                onClick={() => setShowDeleteChequeBookModal(true)}
              />
            )}
            {create_cheque_book && (
              <CustomButton
                text={'New'}
                onClick={() => setShowAddChequeBookModal(true)}
              />
            )}
          </div>
        </div>
        <Row>
          <Col xs={12}>
            <CustomTable
              filters={filters}
              setFilters={setFilters}
              headers={
                delete_single_cheque
                  ? chequeRegisterHeaders
                  : chequeRegisterHeadersAccess
              }
              pagination={pagination}
              isLoading={isLoading}
            >
              {(chequeRegisterData.length || isError) && (
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={chequeRegisterHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {chequeRegisterData?.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        {serialNum(
                          (filters?.page - 1) * filters?.per_page + index + 1
                        )}
                      </td>

                      <td>{item.cheque_number || '-'}</td>
                      <td>{item.bank_name?.account_name || '-'}</td>
                      <td>{item.transaction_no || '-'}</td>
                      <td>{item?.voucher?.date || '-'}</td>
                      <td>{item?.issued_user?.title || '-'}</td>
                      <td>{item.amount || '-'}</td>
                      <td>{item.reference_no || '-'}</td>
                      <td>
                        <StatusChip status={item.status} />
                      </td>
                      {delete_single_cheque && (
                        <td>
                          <TableActionDropDown
                            actions={[
                              {
                                name: 'Delete',
                                icon: HiOutlineTrash,
                                onClick: () => handleDelete(item),
                                className: 'delete',
                                disabled: !item.can_delete,
                              },
                            ]}
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              )}
            </CustomTable>
          </Col>
        </Row>
      </section>
      {/* Add Cheque Book Form */}
      <CustomModal
        show={showAddChequeBookModal}
        close={() => setShowAddChequeBookModal(false)}
      >
        <div className="text-center mb-45">
          <h4 className="modalTitle">New Cheque Book</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            initialValues={{ bank: '', starting_no: '', count: '' }}
            validationSchema={addChequeBookValidationSchema}
            onSubmit={handleAddChequeBook}
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
                <div className="mb-3">
                  <SearchableSelect
                    label={'Bank Account'}
                    name="bank"
                    options={bankOptions}
                    required
                    onChange={(v) => {
                      setFieldValue('bank', v.value);
                    }}
                    value={values.bank}
                    placeholder={'Select a Bank Account'}
                  />
                  <ErrorMessage
                    name="bank"
                    component="div"
                    className="input-error-message text-danger"
                  />
                </div>
                <div className="mb-3">
                  <CustomInput
                    name={'starting_no'}
                    label={'Starting No'}
                    placeholder={'Enter Starting No'}
                    required
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.starting_no && errors.starting_no}
                  />
                </div>
                <div className="mb-45">
                  <CustomInput
                    name={'count'}
                    label={'Count'}
                    placeholder={'Enter Count'}
                    required
                    type={'number'}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.count && errors.count}
                  />
                </div>
                <div className="d-flex gap-3 justify-content-center mb-3">
                  {addChequeBookMutation.isPending ? (
                    <PulseLoader size={11} className="modalLoader" />
                  ) : (
                    <>
                      <CustomButton
                        variant={'primary'}
                        type="submit"
                        text={'Create'}
                        disabled={addChequeBookMutation.isPending}
                      />
                      <CustomButton
                        variant={'secondaryButton'}
                        text={'Cancel'}
                        type={'button'}
                        onClick={() => setShowAddChequeBookModal(false)}
                      />
                    </>
                  )}
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </CustomModal>
      <CustomModal
        show={showDeleteModal}
        close={() => setShowDeleteModal(false)}
        disableClick={deleteMutation.isPending} // Disable action button during mutation
        action={() => {
          deleteMutation.mutate({
            serviceFunction: deleteCheque,
            id: selectedItem.id,
          });
        }}
        title={'Delete?'}
        description={`Are you sure you want to delete cheque ${selectedItem?.cheque_number}?`}
      />
      {/* Delete Cheque Book Form */}
      <CustomModal
        show={showDeleteChequeBookModal}
        close={() => setShowDeleteChequeBookModal(false)}
      >
        <div className="text-center mb-45">
          <h4 className="modalTitle">Delete Cheque Book</h4>
        </div>
        <div className="px-sm-5">
          <Formik
            key={`${deleteChequeBookFormValues.bank}-${deleteChequeBookFormValues.reference_no}`}
            initialValues={deleteChequeBookFormValues}
            validationSchema={deleteChequeBookValidationSchema}
            onSubmit={handleDeleteChequeBook}
            enableReinitialize
          >
            {({ values, errors, touched, handleBlur, setFieldValue }) => {
              return (
                <Form>
                  <div className="mb-4">
                    <SearchableSelect
                      label={'Bank Account'}
                      name="bank"
                      options={bankOptions}
                      required
                      onChange={(v) => {
                        setFieldValue('bank', v.value);
                        setSelectedBankId(v.value);
                        // Update external state
                        setDeleteChequeBookFormValues((prev) => ({
                          ...prev,
                          bank: v.value,
                          reference_no: '', // Reset reference when bank changes
                        }));
                      }}
                      value={values.bank}
                      placeholder={'Select a Bank Account'}
                      error={touched.bank && errors.bank}
                    />
                  </div>
                  <div className="mb-5">
                    <SearchableSelect
                      name={'reference_no'}
                      label={'Reference No'}
                      placeholder={'Select Reference No'}
                      options={getReferenceOptions()}
                      value={values.reference_no}
                      required
                      onChange={(v) => {
                        setFieldValue('reference_no', v);
                        // Update external state
                        setDeleteChequeBookFormValues((prev) => ({
                          ...prev,
                          reference_no: v,
                        }));
                      }}
                      onBlur={handleBlur}
                      error={touched.reference_no && errors.reference_no}
                    />
                  </div>
                  <div className="d-flex gap-3 justify-content-center mb-3">
                    <CustomButton
                      variant={'danger'}
                      type="submit"
                      text={'Delete'}
                    />
                    <CustomButton
                      variant={'secondaryButton'}
                      text={'Cancel'}
                      type={'button'}
                      onClick={() => setShowDeleteChequeBookModal(false)}
                    />
                  </div>
                </Form>
              );
            }}
          </Formik>
        </div>
      </CustomModal>
      {/* Confirm Delete Cheque Book Modal */}
      <CustomModal
        show={showConfirmDeleteChequeBookModal}
        close={() => setShowConfirmDeleteChequeBookModal(false)}
        action={() => {
          deleteChequeBookMutation.mutate(chequeBookToDelete);
        }}
        disableClick={deleteChequeBookMutation.isPending}
        title={'Delete'}
        description={`Are you sure you want to delete the Cheque Book ${selectedItem?.reference_no} associated with ${selectedItem?.bank_name}?`}
      />
    </>
  );
};

export default withModal(withFilters(ChequeRegister));
