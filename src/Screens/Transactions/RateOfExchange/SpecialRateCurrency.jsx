import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FaLock, FaLockOpen } from 'react-icons/fa6';
import { HiOutlineTrash } from 'react-icons/hi2';
import { useLocation, useNavigate } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { showToast } from '../../../Components/Toast/Toast';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import {
  createSpecialRateCurrency,
  getSpecialRateCurrency,
} from '../../../Services/Transaction/SpecialRateCurrency';
import { deleteRemittanceRate } from '../../../Services/Transaction/RemittanceRate';
import { specialRateCurrencyHeaders } from '../../../Utils/Constants/TableHeaders';
import {
  getCurrencyOptions,
  isNullOrEmpty,
  showErrorToast,
} from '../../../Utils/Utils';

const removePartiallyFilledRows = (data) => {
  return Object.fromEntries(
    Object.entries(data).filter(([key, value]) => {
      if (
        typeof value === 'object' &&
        'buy_rate' in value &&
        'buy_from' in value &&
        'buy_upto' in value &&
        'sell_rate' in value &&
        'sell_from' in value &&
        'sell_upto' in value &&
        'ag_fcy_id' in value &&
        'currency_id' in value
      ) {
        return !(
          value.buy_rate === '' ||
          value.buy_from === '' ||
          value.buy_upto === '' ||
          value.sell_rate === '' ||
          value.sell_from === '' ||
          value.sell_upto === '' ||
          !value.ag_fcy_id ||
          !value.currency_id
        );
      }
      return true;
    })
  );
};

const SpecialRateCurrency = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  usePageTitle('Special Rate Currency');
  const [searchTerm, setSearchTerm] = useState('');
  const [editableRows, setEditableRows] = useState({});
  const [editedData, setEditedData] = useState({});
  const currencyOptions = getCurrencyOptions();

  const { state } = useLocation();
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [activeTab, setActiveTab] = useState('remittance');
  const [agFc, setAgFc] = useState('');
  const [showOnlineRatesSuccess, setShowOnlineRatesSuccess] = useState(false);

  const [newRows, setNewRows] = useState([
    state?.currencyToSelect
      ? {
        id: crypto.randomUUID(),
        action: 'unlock',
        currency_id: { id: state?.currencyToSelect } || null,
        ag_fcy_id: null,
        buy_rate: '',
        buy_from: '',
        buy_upto: '',
        sell_rate: '',
        sell_from: '',
        sell_upto: '',
        is_new: 1,
        date: date,
      }
      : {
        id: crypto.randomUUID(),
        action: 'unlock',
        currency_id: null,
        ag_fcy_id: null,
        buy_rate: '',
        buy_from: '',
        buy_upto: '',
        sell_rate: '',
        sell_from: '',
        sell_upto: '',
        is_new: 1,
        date: date,
      },
  ]); // Track custom added rows
  const [currency, setCurrency] = useState('');

  const {
    data: specialRateCurrency = [],
    isLoading: isLoadingSpecialRateCurrency,
    isError: isErrorSpecialRateCurrency,
    error: errorSpecialRateCurrency,
  } = useQuery({
    queryKey: ['specialRateCurrency', currency, agFc, date],
    queryFn: () => getSpecialRateCurrency(currency, agFc, date),
  });

  const currencyOptionsFilter = [
    { label: 'All', value: '' },
    ...currencyOptions,
  ];

  const handleDelete = async (item) => {
    // Store the current state for rollback if needed
    const previousEditedData = { ...editedData };
    const previousEditableRows = { ...editableRows };
    const previousNewRows = [...newRows];

    try {
      if (!item.id.toString().startsWith('new')) {
        // Optimistically update UI state
        if (editedData[item.id]) {
          setEditedData((prev) => {
            const newData = { ...prev };
            delete newData[item.id];
            return newData;
          });
        }

        if (editableRows[item.id]) {
          setEditableRows((prev) => {
            const newData = { ...prev };
            delete newData[item.id];
            return newData;
          });
        }

        // Optimistically update the query cache
        queryClient.setQueryData(
          ['specialRateCurrency', currency, agFc, date],
          (oldData) => {
            if (!oldData) return [];
            return oldData.filter((rate) => rate.id !== item.id);
          }
        );

        // Make the API call
        await deleteRemittanceRate(item.id);
        // Not showing success message as optimistically deleting the entry. Only error will be shown
        // showToast('Rate deleted successfully', 'success');

        // After successful deletion, invalidate to ensure sync with server
        queryClient.invalidateQueries({ queryKey: ['specialRateCurrency'] });
      } else {
        // For new rows, just update the local state
        setNewRows((prev) => prev.filter((row) => row.id !== item.id));

        // Also remove from editedData
        setEditedData((prev) => {
          const newData = { ...prev };
          delete newData[item.id];
          return newData;
        });

        // Also remove from editableRows if present
        if (editableRows[item.id]) {
          setEditableRows((prev) => {
            const newData = { ...prev };
            delete newData[item.id];
            return newData;
          });
        }
      }
    } catch (error) {
      // Revert all optimistic updates on error
      setEditedData(previousEditedData);
      setEditableRows(previousEditableRows);
      setNewRows(previousNewRows);

      // Revert the query cache
      queryClient.setQueryData(
        ['specialRateCurrency', currency, agFc, date],
        (oldData) => {
          if (!oldData) return [item];
          return [...oldData, item];
        }
      );

      showErrorToast(error || 'Failed to delete rate');
    }
  };

  const handleEdit = (item) => {
    setEditableRows((prev) => ({
      ...prev,
      [item.id]: !prev[item.id],
    }));

    // Initialize edited data for this row if not exists
    if (!editedData[item.id]) {
      setEditedData((prev) => ({
        ...prev,
        [item.id]: {
          ...item,
          action: item.action === 'lock' ? 'unlock' : 'lock',
          buy_rate: item.buy_rate,
          buy_from: item.buy_from,
          buy_upto: item.buy_upto,
          sell_rate: item.sell_rate,
          sell_from: item.sell_from,
          sell_upto: item.sell_upto,
        },
      }));
    } else {
      setEditedData((prev) => ({
        ...prev,
        [item.id]: {
          ...editedData[item.id],
          action: editedData[item.id].action === 'lock' ? 'unlock' : 'lock',
        },
      }));
    }
  };

  const handleInputChange = (itemId, field, value) => {
    setEditedData((prev) => {
      // Find the original item from specialRateCurrency or newRows
      const originalItem = [...(specialRateCurrency || []), ...newRows].find(
        (item) => item.id === itemId
      );

      // Ensure the original item exists
      if (!originalItem) return prev;
      return {
        ...prev,
        [itemId]: {
          ...(prev[itemId] || originalItem), // Use previous edits if they exist, otherwise start with originalItem
          [field]: value, // Update only the specific field
        },
      };
    });
  };

  const handleAddRows = () => {
    const newRows = Array.from({ length: 10 }, (_, index) => {
      const id = `new-${index}`; // Ensure unique IDs
      return {
        id,
        action: 'unlock',
        currency_id: '',
        ag_fcy_id: '',
        buy_rate: '',
        buy_from: '',
        buy_upto: '',
        sell_rate: '',
        sell_from: '',
        sell_upto: '',
        is_new: 1, // Flag to identify new rows
        date: date,
      };
    });

    setNewRows((prev) => [...prev, ...newRows]);

    // Make all new rows editable by default
    setEditableRows((prev) => ({
      ...prev,
      ...Object.fromEntries(newRows.map((row) => [row.id, true])),
    }));

    // Initialize edited data for all new rows
    setEditedData((prev) => ({
      ...prev,
      ...Object.fromEntries(
        newRows.map((row) => [
          row.id,
          {
            action: 'unlock',
            currency_id: '',
            ag_fcy_id: '',
            buy_rate: '',
            buy_from: '',
            buy_upto: '',
            sell_rate: '',
            sell_from: '',
            sell_upto: '',
            is_new: 1,
            date: date,
          },
        ])
      ),
    }));
  };

  const handleCurrencyChange = (itemId, field, selected) => {
    setEditedData((prev) => {
      const originalItem = [...(specialRateCurrency || []), ...newRows].find(
        (item) => item.id === itemId
      );

      if (!originalItem) return prev;

      return {
        ...prev,
        [itemId]: {
          ...(prev[itemId] || originalItem), // Use previous edits if they exist, otherwise start with originalItem
          [field]: selected,
          action: 'unlock',
        },
      };
    });
  };

  function handleCancel() {
    navigate(-1);
  }

  if (errorSpecialRateCurrency) {
    showErrorToast(errorSpecialRateCurrency);
  }

  // Mutation
  const createSpecialRateCurrencyMutation = useMutation({
    mutationFn: createSpecialRateCurrency,
    onSuccess: () => {
      showToast('Rate updated successfully', 'success');
      queryClient.invalidateQueries(['specialRateCurrency']);
      queryClient.removeQueries({ queryKey: ['currencyRate'] });
      setEditedData({});
      setNewRows([]);
      setEditableRows({});
    },
    onError: (error) => {
      console.error('Error adding special rate currency', error);
      showErrorToast(error);
    },
  });

  return (
    <>
      <div className="d-flex gap-3 justify-content-start flex-wrap mb-4">
        <div>
          <BackButton />
          <h2 className="screen-title mb-0">Special Rate Currency</h2>
        </div>
      </div>

      <CustomTable
        headers={specialRateCurrencyHeaders}
        isLoading={isLoadingSpecialRateCurrency}
        isPaginated={false}
        className={'inputTable'}
        hideSearch
        hideItemsPerPage
      >
        {(specialRateCurrency?.length ||
          newRows.length ||
          isErrorSpecialRateCurrency) && (
            <tbody>
              {isErrorSpecialRateCurrency && !newRows.length && (
                <tr>
                  <td colSpan={specialRateCurrencyHeaders.length}>
                    <p className="text-danger mb-0">
                      Unable to fetch data at this time
                    </p>
                  </td>
                </tr>
              )}
              {[...(specialRateCurrency || []), ...newRows].map((item) => {
                const editedItem = editedData[item.id];
                const isLocked =
                  (!editableRows[item.id] && item.action === 'lock') ||
                  editedData[item.id]?.action === 'lock';
                return (
                  <tr key={item.id}>
                    <td>
                      <SearchableSelect
                        name="currency_id"
                        isDisabled={isLocked}
                        options={currencyOptions}
                        value={editedItem?.currency_id ?? item.currency_id ?? ''}
                        onChange={(selected) =>
                          handleCurrencyChange(
                            item.id,
                            'currency_id',
                            selected.value
                          )
                        }
                        borderRadius={10}
                      />
                    </td>
                    <td>
                      <SearchableSelect
                        name="ag_fcy_id"
                        isDisabled={isLocked}
                        options={currencyOptions}
                        value={editedItem?.ag_fcy_id ?? item.ag_fcy_id}
                        onChange={(selected) =>
                          handleCurrencyChange(
                            item.id,
                            'ag_fcy_id',
                            selected.value
                          )
                        }
                        borderRadius={10}
                      />
                    </td>
                    <td>
                      <CustomInput
                        name={'buy_rate'}
                        type={'number'}
                        value={editedItem?.buy_rate ?? item.buy_rate}
                        disabled={isLocked}
                        onChange={(e) =>
                          handleInputChange(item.id, 'buy_rate', e.target.value)
                        }
                        borderRadius={10}
                        style={{ maxWidth: 140 }}
                      />
                    </td>
                    <td>
                      <CustomInput
                        name={'buy_from'}
                        type={'number'}
                        value={editedItem?.buy_from ?? item.buy_from}
                        disabled={isLocked}
                        onChange={(e) =>
                          handleInputChange(item.id, 'buy_from', e.target.value)
                        }
                        borderRadius={10}
                        style={{ maxWidth: 140 }}
                      />
                    </td>
                    <td>
                      <CustomInput
                        name={'buy_upto'}
                        type={'number'}
                        value={editedItem?.buy_upto ?? item.buy_upto}
                        disabled={isLocked}
                        onChange={(e) =>
                          handleInputChange(item.id, 'buy_upto', e.target.value)
                        }
                        borderRadius={10}
                        style={{ maxWidth: 140 }}
                      />
                    </td>
                    <td>
                      <CustomInput
                        name={'sell_rate'}
                        type={'number'}
                        value={editedItem?.sell_rate ?? item.sell_rate}
                        disabled={isLocked}
                        onChange={(e) =>
                          handleInputChange(item.id, 'sell_rate', e.target.value)
                        }
                        borderRadius={10}
                        style={{ maxWidth: 140 }}
                      />
                    </td>
                    <td>
                      <CustomInput
                        name={'sell_from'}
                        type={'number'}
                        value={editedItem?.sell_from ?? item.sell_from}
                        disabled={isLocked}
                        onChange={(e) =>
                          handleInputChange(item.id, 'sell_from', e.target.value)
                        }
                        borderRadius={10}
                        style={{ maxWidth: 140 }}
                      />
                    </td>
                    <td>
                      <CustomInput
                        name={'sell_upto'}
                        type={'number'}
                        value={editedItem?.sell_upto ?? item.sell_upto}
                        disabled={isLocked}
                        onChange={(e) =>
                          handleInputChange(item.id, 'sell_upto', e.target.value)
                        }
                        borderRadius={10}
                        style={{ maxWidth: 140 }}
                      />
                    </td>
                    <td>
                      <TableActionDropDown
                        actions={[
                          {
                            name: editableRows[item.id] ? 'Lock' : 'Unlock',
                            icon: editedItem
                              ? editedItem.action === 'lock'
                                ? FaLock
                                : FaLockOpen
                              : item.action === 'lock'
                                ? FaLock
                                : FaLockOpen,
                            onClick: () => handleEdit(item),
                            className: editableRows[item.id] ? 'view' : 'delete',
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
                );
              })}
            </tbody>
          )}
      </CustomTable>

      <div className="d-flex gap-3 flex-wrap mb-5 pb-5">
        <CustomButton
          text={'Add Rows'}
          disabled={createSpecialRateCurrencyMutation.isPending}
          onClick={handleAddRows}
        />
        <CustomButton
          variant={'secondaryButton'}
          text={'Save'}
          loading={createSpecialRateCurrencyMutation.isPending}
          disabled={createSpecialRateCurrencyMutation.isPending}
          onClick={() => {
            let formData = {
              rate: [
                ...Object.values(removePartiallyFilledRows(editedData)),
              ].map((item) => {
                if (item.id?.toString().startsWith('new')) {
                  const { id, ...rest } = item;
                  return { ...rest, date };
                }
                return { ...item, date };
              }),
            };
            if (!isNullOrEmpty(formData.rate)) {
              createSpecialRateCurrencyMutation.mutate(formData);
            }
          }}
        />
        <CustomButton
          variant={'secondaryButton'}
          text={'Cancel'}
          disabled={createSpecialRateCurrencyMutation.isPending}
          onClick={handleCancel}
        />
      </div>
    </>
  );
};

export default SpecialRateCurrency;
