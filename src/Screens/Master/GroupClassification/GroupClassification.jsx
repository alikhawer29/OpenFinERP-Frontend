import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import withFilters from '../../../HOC/withFilters ';
import { Col, Row } from 'react-bootstrap';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import { ledgerOptions } from '../../../Utils/Constants/SelectOptions';
import { groupClassificationHeaders } from '../../../Utils/Constants/TableHeaders';
import useAccountsByType from '../../../Hooks/useAccountsByType';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { HiOutlineEye, HiOutlineTrash } from 'react-icons/hi';
import { HiOutlinePencilSquare } from 'react-icons/hi2';
import useDataMutations from '../../../Hooks/useDataMutations';
import { useFetchTableData } from '../../../Hooks/useTable';
import { getGroupMasterListing } from '../../../Services/Masters/GroupMaster';

const GroupClassification = ({
  showModal,
  closeModal,
  filters,
  setFilters,
  pagination,
  updatePagination,
}) => {
  const navigate = useNavigate();
  const { getAccountsByTypeOptions } = useAccountsByType();
  // State to track non-triggering filter values
  const [nonTriggeringFilters, setNonTriggeringFilters] = useState({});

  // Handle non-triggering filter changes
  const handleNonTriggeringFiltersChange = (updatedFilters) => {
    if (updatedFilters.ledger?.value === 'all') {
      updatedFilters.account = { label: 'All', value: 'all' };
    } else if (!updatedFilters.account) {
      updatedFilters.account = null; // or remove it
    }

    setNonTriggeringFilters(updatedFilters);
  };

  const { data, isLoading, isError, error } = useFetchTableData(
    'groupMasterListing',
    filters,
    updatePagination,
    getGroupMasterListing
  );

  const groupMasterData = data?.data || [];

  //  --- MUTATIONS ---
  const { deleteMutation, editMutation } = useDataMutations({
    onDeleteSuccessCallback: () => {
      closeModal();
      showToast('Group Deleted Successfully', 'success');
      queryClient.invalidateQueries(['groupMasterListing']);
    },
    onDeleteErrorCallback: (error) => {
      if (
        error.message.toLowerCase() ==
        'the group master cannot be deleted as it is currently in use.'
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
    onEditSuccessCallback: () => {
      setShowEditGroupMasterModal(false);
      showToast('Group Updated Successfully', 'success');
      queryClient.invalidateQueries(['groupMasterListing']);
    },
    onEditErrorCallback: (error) => {
      setShowEditGroupMasterModal(false);
      showErrorToast(error);
    },
  });

  // Functions to handle table action
  const handleDelete = (item) => {
    showModal(
      'Delete',
      `Are you sure you want to delete group ${item.code}?`,
      () => {
        deleteMutation.mutate({
          serviceFunction: deleteGroupMaster,
          id: item.id,
        });
      }
    );
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowEditGroupMasterModal(true);
  };

  const handleAddGroupMaster = (values) => {
    addGroupMasterMutation.mutate(values);
  };
  const handleEditGroupMaster = (values) => {
    editMutation.mutate({
      serviceFunction: editGroupMaster,
      id: selectedItem.id,
      formData: values,
    });
  };

  if (isError) {
    showErrorToast(error);
  }

  return (
    <>
      <div className="d-flex align-items-start mb-4 justify-content-between flex-wrap">
        <div className="d-flex flex-column gap-2">
          <BackButton />
          <h2 className="screen-title m-0 d-inline">Group Classification</h2>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <CustomButton
            text={'Create Group'}
            onClick={() => navigate('create-group-classification')}
          />
        </div>
      </div>
      <Row>
        <Col xs={12}>
          <CustomTable
            filters={filters}
            setFilters={setFilters}
            headers={groupClassificationHeaders}
            pagination={pagination}
            isLoading={isLoading}
            onNonTriggeringFiltersChange={handleNonTriggeringFiltersChange}
            hideSearch={true}
            selectOptions={[
              {
                title: 'ledger',
                triggerFilterOnChange: false,
                options: [{ label: 'All', value: 'all' }, ...ledgerOptions],
              },
              {
                title: 'Account',
                options: [
                  ...(nonTriggeringFilters?.ledger?.value !== 'all'
                    ? getAccountsByTypeOptions(
                        nonTriggeringFilters.ledger,
                        false
                      )
                    : []),
                ],
              },
            ]}
            dateFilters={[
              {
                label: 'Creation Date Range',
                title: 'creation_date_range',
                type: 'date',
              },
            ]}
          >
            {(groupMasterData?.length || isError) && (
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={groupMasterHeaders.length}>
                      <p className="text-danger mb-0">
                        Unable to fetch data at this time
                      </p>
                    </td>
                  </tr>
                )}
                {groupMasterData?.map((item) => (
                  <tr key={item.id}>
                    <td>{item.code}</td>
                    <td>{item.group_type}</td>
                    <td>{item.description}</td>
                    <td>
                      <TableActionDropDown
                        actions={[
                          {
                            name: 'View',
                            icon: HiOutlineEye,
                            onClick: () => navigate(`${item.id}`),
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
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </CustomTable>
        </Col>
      </Row>
    </>
  );
};

export default withFilters(GroupClassification);
