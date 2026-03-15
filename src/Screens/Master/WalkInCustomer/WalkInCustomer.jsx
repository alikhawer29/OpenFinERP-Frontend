import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
import StatusChip from '../../../Components/StatusChip/StatusChip';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { showToast } from '../../../Components/Toast/Toast';
import withFilters from '../../../HOC/withFilters ';
import withModal from '../../../HOC/withModal';
import useDataMutations from '../../../Hooks/useDataMutations';
import { useFileDownloader } from '../../../Hooks/useFileDownloader';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import { useFetchTableData } from '../../../Hooks/useTable';
import {
  addWalkInCustomerAttachment,
  deleteWalkInCustomer,
  deleteWalkInCustomerAttachment,
  getWalkInCustomerListing,
} from '../../../Services/Masters/WalkInCustomer';
import { generalStatusFiltersConfig } from '../../../Utils/Constants/TableFilter';
import { walkInCustomerHeaders } from '../../../Utils/Constants/TableHeaders';
import { formatDate, showErrorToast } from '../../../Utils/Utils';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import { filterActions } from '../../../Utils/Helpers';

const WalkInCustomer = ({
  showModal,
  closeModal,
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  usePageTitle('Walk In Customer');
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const { downloadingType, handleDownload } = useFileDownloader();

  const permissions = useModulePermissions('master', 'walk_in_customer');
  const {
    create: hasCreatePermission,
    edit: hasEditPermission,
    delete: hasDeletePermission,
    view: hasViewPermission,
  } = permissions;

  const {
    data: { data: walkInCustomersData = [] } = {},
    isLoading,
    isError,
    error,
  } = useFetchTableData(
    'walkInCustomerListing',
    filters,
    updatePagination,
    getWalkInCustomerListing
  );

  const { deleteMutation } = useDataMutations({
    onDeleteSuccessCallback: () => {
      closeModal();
      showToast('Walk-In Customer deleted Successfully', 'success');
      queryClient.invalidateQueries(['walkInCustomerListing']);
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

  const handleEdit = (item) => {
    navigate(`${item.id}/edit`);
  };

  const handleView = (item) => {
    navigate(`${item.id}`);
  };

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

  const handleAttachments = (item) => {
    setSelectedItem(item);
    setShowAttachmentsModal(true);
  };

  if (isError) {
    console.error(error.message);
  }

  return (
    <>
      <div className="d-flex justify-content-end flex-wrap mb-3">
        <h2 className="screen-title flex-grow-1">Walk-in Customer Register</h2>
        <div className="d-flex gap-2 flex-wrap">
          <CustomButton
            variant="secondaryButton"
            text={
              downloadingType === 'xlsx' ? 'Downloading...' : 'Export to Excel'
            }
            onClick={() => handleDownload('walk-in-customer', 'xlsx')}
            disabled={!!downloadingType}
            loading={downloadingType === 'xlsx'}
          />
          <CustomButton
            variant="secondaryButton"
            text={
              downloadingType === 'pdf' ? 'Downloading...' : 'Export to Excel'
            }
            onClick={() => handleDownload('walk-in-customer', 'pdf')}
            disabled={!!downloadingType}
            loading={downloadingType === 'pdf'}
          />
          {hasCreatePermission && (
            <CustomButton text={'New'} onClick={() => navigate('new')} />
          )}
        </div>
      </div>
      <Row>
        <Col xs={12}>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={walkInCustomerHeaders}
            pagination={pagination}
            selectOptions={[
              {
                title: 'status',
                options: generalStatusFiltersConfig,
              },
            ]}
            isLoading={isLoading}
          >
            {(walkInCustomersData?.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={walkInCustomerHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {walkInCustomersData?.map((item) => (
                  <tr key={item.id}>
                    <td>{item.customer_name}</td>
                    <td>{item.company}</td>
                    <td>{item.mobile_number_full}</td>
                    <td>{item.nationality.name}</td>
                    <td>{item?.id_type?.description}</td>
                    <td>{item.id_number}</td>
                    <td>{formatDate(item.expiry_date)}</td>
                    <td>
                      <StatusChip status={item.status} />
                    </td>
                    <td>{item.city}</td>
                    <td>
                      <TableActionDropDown
                        actions={filterActions(
                          [
                            {
                              name: 'View',
                              icon: HiOutlineEye,
                              onClick: () => handleView(item),
                              className: 'view',
                            },
                            {
                              name: 'Edit',
                              icon: HiOutlinePencilSquare,
                              onClick: () => handleEdit(item),
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
      <CustomModal
        show={showAttachmentsModal}
        close={() => setShowAttachmentsModal(false)}
        background={true}
      >
        <AttachmentsView
          item={selectedItem}
          queryToInvalidate={'walkInCustomerListing'}
          deleteService={deleteWalkInCustomerAttachment}
          uploadService={addWalkInCustomerAttachment}
          closeUploader={setShowAttachmentsModal}
        />
      </CustomModal>
    </>
  );
};

export default withModal(withFilters(WalkInCustomer));
