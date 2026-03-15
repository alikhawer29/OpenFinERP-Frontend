import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import {
  HiOutlineEye,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiPaperClip,
} from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import AttachmentsView from '../../../Components/AttachmentsView/AttachmentsView';
import CustomButton from '../../../Components/CustomButton';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { showToast } from '../../../Components/Toast/Toast';
import withFilters from '../../../HOC/withFilters ';
import withModal from '../../../HOC/withModal';
import useDataMutations from '../../../Hooks/useDataMutations';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';
import {
  addBeneficiaryRegisterAttachment,
  deleteBeneficiaryRegister,
  deleteBeneficiaryRegisterAttachment,
  getBeneficiaryRegisterListing,
} from '../../../Services/Masters/BeneficiaryRegister';
import { beneficiaryRegisterHeaders } from '../../../Utils/Constants/TableHeaders';
import { showErrorToast } from '../../../Utils/Utils';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import { filterActions, filterHeaders } from '../../../Utils/Helpers';

const BeneficiaryRegister = ({
  showModal,
  closeModal,
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  usePageTitle('Beneficiary Register');
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const { data, isLoading, isPending, isError, error } = useFetchTableData(
    'beneficiaryRegisterListing',
    filters,
    updatePagination,
    getBeneficiaryRegisterListing
  );
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { deleteMutation } = useDataMutations({
    onDeleteSuccessCallback: () => {
      closeModal();
      showToast('Beneficiary Deleted Successfully', 'success');
      queryClient.invalidateQueries(['beneficiaryRegisterListing', filters]);
    },
    onDeleteErrorCallback: (error) => {
      if (
        error.message.toLowerCase() ==
        'the classification cannot be deleted as it is currently in use.'
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

  const beneficiaryRegisterData = data?.data || [];

  // Function to handle Delete action
  const handleDelete = (item) => {
    showModal(
      'Delete',
      `Are you sure you want to delete Beneficiary ${item?.name}?`,
      () => {
        deleteMutation.mutate({
          serviceFunction: deleteBeneficiaryRegister,
          id: item.id,
        });
      }
    );
  };

  const handleAttachments = (item) => {
    setSelectedItem(item);
    setShowAttachmentsModal(true);
  };

  useEffect(() => {
    if (selectedItem?.id && !isPending) {
      setShowAttachmentsModal(false);
      setSelectedItem(
        beneficiaryRegisterData.find((item) => item.id === selectedItem.id)
      );
      setShowAttachmentsModal(true);
    }
  }, [isPending]);

  if (isError) {
    showErrorToast(error);
  }

  // Permission checks using optimized hook
  const permissions = useModulePermissions('master', 'beneficiary_register');

  const {
    create: hasCreatePermission,
    edit: hasEditPermission,
    delete: hasDeletePermission,
    view: hasViewPermission,
  } = permissions;

  return (
    <>
      <section>
        <div className="d-flex justify-content-between flex-wrap mb-3">
          <h2 className="screen-title mb-0">Beneficiary Register</h2>
          {hasCreatePermission && (
            <CustomButton text={'New'} onClick={() => navigate('new')} />
          )}
        </div>
        <Row>
          <Col xs={12}>
            <CustomTable
              filters={filters}
              setFilters={setFilters}
              headers={beneficiaryRegisterHeaders}
              pagination={pagination}
              isLoading={isLoading}
            >
              {(beneficiaryRegisterData.length || isError) && (
                <tbody>
                  {isError && (
                    <tr>
                      <td colSpan={beneficiaryRegisterHeaders.length}>
                        <p className="text-danger mb-0">
                          Unable to fetch data at this time
                        </p>
                      </td>
                    </tr>
                  )}
                  {beneficiaryRegisterData?.map((item, index) => (
                    <tr key={item.id}>
                      <td>{item?.name}</td>
                      <td>{item?.address}</td>
                      <td>{item?.account}</td>
                      <td>{item?.nationality?.name}</td>
                      <td>{item?.purpose?.description}</td>
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
                                name: 'Attachments',
                                icon: HiPaperClip,
                                onClick: () => handleAttachments(item),
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
      <CustomModal
        show={showAttachmentsModal}
        close={() => setShowAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          item={selectedItem}
          queryToInvalidate={'beneficiaryRegisterListing'}
          deleteService={deleteBeneficiaryRegisterAttachment}
          uploadService={addBeneficiaryRegisterAttachment}
          closeUploader={setShowAttachmentsModal}
        />
      </CustomModal>
    </>
  );
};

export default withModal(withFilters(BeneficiaryRegister));
