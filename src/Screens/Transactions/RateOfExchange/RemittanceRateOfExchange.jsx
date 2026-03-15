import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FaLock, FaLockOpen } from 'react-icons/fa6';
import { HiOutlineTrash } from 'react-icons/hi2';
import { useLocation, useNavigate } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomCheckbox from '../../../Components/CustomCheckbox/CustomCheckbox';
import CustomInput from '../../../Components/CustomInput';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import HorizontalTabs from '../../../Components/HorizontalTabs/HorizontalTabs';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { showToast } from '../../../Components/Toast/Toast';
import withFilters from '../../../HOC/withFilters ';
import withModal from '../../../HOC/withModal';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import useModulePermissions from '../../../Hooks/useModulePermissions';
import {
  createRemittanceRates,
  deleteRemittanceRate,
  getOnlineRates,
  getRemittanceRates,
} from '../../../Services/Transaction/RemittanceRate';
import { remittanceRateOfExchangeHeaders } from '../../../Utils/Constants/TableHeaders';
import {
  getCurrencyOptions,
  isNullOrEmpty,
  showErrorToast,
} from '../../../Utils/Utils';
import { getCurrencies } from '../../../Services/Transaction/InwardPayment';
import { filterHeaders } from '../../../Utils/Helpers';

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

const RemittanceRateOfExchange = ({ showModal, closeModal }) => {
  usePageTitle('Rate Of Exchange');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Permissions
  const permissions = useModulePermissions('transactions', 'rate_of_exchange');
  const {
    create: hasCreatePermission,
    edit: hasEditPermission,
    delete: hasDeletePermission,
  } = permissions || {};

  const { state } = useLocation();
  const [date, setDate] = useState(
    state?.date || new Date().toLocaleDateString('en-CA')
  );
  const [activeTab, setActiveTab] = useState('remittance');
  const [agFc, setAgFc] = useState('');
  const [editableRows, setEditableRows] = useState({});
  const [editedData, setEditedData] = useState({});
  const [showOnlineRatesSuccess, setShowOnlineRatesSuccess] = useState(false);
  const [autoPairEnabled, setAutoPairEnabled] = useState(false);

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
  const currencyOptions = getCurrencyOptions();

  // Fetch full currency data with rate_variation
  const { data: currenciesData = [] } = useQuery({
    queryKey: ['currenciesWithRateVariation'],
    queryFn: getCurrencies,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  // Helper function to get currency rate variation
  const getCurrencyRateVariation = (currencyId) => {
    const currency = currenciesData.find((c) => c.id === parseInt(currencyId));
    const rateVariation = currency?.rate_variation
      ? parseFloat(currency.rate_variation)
      : 1.0;
    console.log(
      `Currency ID: ${currencyId}, Rate Variation: ${rateVariation}`,
      currency
    );
    return rateVariation;
  };

  // Helper function to calculate From and Upto rates based on rate variation
  const calculateRateRange = (baseRate, rateVariation) => {
    if (!baseRate || !rateVariation || parseFloat(baseRate) <= 0) {
      return { from: '', upto: '' };
    }

    const rate = parseFloat(baseRate);
    const variation = parseFloat(rateVariation) / 100;

    // Calculate From and Upto rates
    const from = (rate * (1 - variation)).toFixed(8);
    const upto = (rate * (1 + variation)).toFixed(8);

    console.log(
      `Calculating rates: Base=${rate}, Variation=${variation}, From=${from}, Upto=${upto}`
    );
    return { from, upto };
  };

  // Helper function to get currency pair name for display
  const getCurrencyPairName = (item) => {
    const editedItem = editedData[item?.id];
    const currentItem = editedItem || item;

    const fromCurrency =
      currencyOptions?.find(
        (option) => option.value === currentItem.currency_id
      )?.label || 'Unknown';

    const toCurrency =
      currencyOptions?.find((option) => option.value === currentItem.ag_fcy_id)
        ?.label || 'Unknown';

    return `${fromCurrency}-${toCurrency}`;
  };

  // Helper function to check if currency pair has complete rate information
  const hasCompleteRates = (item) => {
    const editedItem = editedData[item?.id];
    const currentItem = editedItem || item;

    // Both currencies must be selected
    if (!currentItem.currency_id || !currentItem.ag_fcy_id) {
      return false;
    }

    // Validate all buy-related fields
    const hasCompleteBuyRate =
      parseFloat(currentItem.buy_rate) > 0 &&
      parseFloat(currentItem.buy_from) > 0 &&
      parseFloat(currentItem.buy_upto) > 0;

    // Validate all sell-related fields
    const hasCompleteSellRate =
      parseFloat(currentItem.sell_rate) > 0 &&
      parseFloat(currentItem.sell_from) > 0 &&
      parseFloat(currentItem.sell_upto) > 0;

    // ✅ Return true only if *all* rate fields are complete and valid
    return hasCompleteBuyRate && hasCompleteSellRate;
  };

  const tabs = [
    { label: 'Remittance Rates', value: 'remittance' },
    { label: 'Counter Rates', value: 'counter' },
  ];
  const currencyOptionsFilter = [
    { label: 'All', value: '' },
    ...currencyOptions,
  ];

  // Mutation
  const createRemittanceRateMutation = useMutation({
    mutationFn: createRemittanceRates,
    onSuccess: () => {
      showToast('Rate updated successfully', 'success');
      queryClient.invalidateQueries(['remittanceRates']);
      queryClient.removeQueries({ queryKey: ['currencyRate'] });
      setEditedData({});
      setNewRows([]);
      setEditableRows({});
    },
    onError: (error) => {
      console.error('Error adding remittance rates', error);
      showErrorToast(error);
    },
  });

  const {
    data: remittanceRates = [],
    isLoading: isLoadingRemittance,
    isError: isErrorRemittance,
    error: errorRemittance,
  } = useQuery({
    queryKey: ['remittanceRates', currency, agFc, date],
    queryFn: () => getRemittanceRates(currency, agFc, date),
  });

  // Online rates mutation - using mutation instead of query
  const { mutate: fetchOnlineRates, isLoading: isLoadingOnline } = useMutation({
    mutationFn: getOnlineRates,
    onSuccess: (onlineRatesData) => {
      // Update the remittanceRates query data with online rates
      queryClient.setQueryData(
        ['remittanceRates', currency, agFc, date],
        (oldData) => {
          if (!oldData) return [];

          return oldData.map((existingRate) => {
            // Find matching online rate by currency pair
            const onlineRate = onlineRatesData.find(
              (online) =>
                online.currency_id === existingRate.currency_id &&
                online.ag_fcy_id === existingRate.ag_fcy_id
            );

            if (onlineRate) {
              // Return updated rate with online values
              return {
                ...existingRate,
                buy_rate: onlineRate.buy_rate,
                buy_from: onlineRate.buy_from,
                buy_upto: onlineRate.buy_upto,
                sell_rate: onlineRate.sell_rate,
                sell_from: onlineRate.sell_from,
                sell_upto: onlineRate.sell_upto,
                isOnlineRate: true, // Flag to identify online rates
              };
            }
            return existingRate;
          });
        }
      );

      // Show success message
      setShowOnlineRatesSuccess(true);
      setTimeout(() => setShowOnlineRatesSuccess(false), 3000);

      showToast('Online rates applied successfully!', 'success');
    },
    onError: (error) => {
      console.error('Error fetching online rates:', error);
      showErrorToast(error || 'Failed to fetch online rates');
    },
  });

  const handleGetOnlineRates = () => {
    fetchOnlineRates();
  };

  const handleDelete = (item) => {
    const currencyPairName = getCurrencyPairName(item);

    // Check if currency pair has complete rate information - only for API-sourced rows
    // New rows can be deleted regardless of completion status
    if (!item.id.toString().startsWith('new') && !hasCompleteRates(item)) {
      showModal(
        'Cannot Delete',
        `Cannot delete the ${currencyPairName} currency pair. Please make sure both currencies are selected and all buy and sell rate fields are filled in.`,
        null,
        'error'
      );
      return;
    }
    showModal(
      'Delete Currency Pair',
      `Are you sure you want to delete the ${currencyPairName} currency pair?`,
      async () => {
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
              ['remittanceRates', currency, agFc, date],
              (oldData) => {
                if (!oldData) return [];
                return oldData.filter((rate) => rate.id !== item.id);
              }
            );

            // Make the API call
            await deleteRemittanceRate(item.id);

            // Close the modal after successful deletion
            closeModal();

            showToast(
              `${currencyPairName} currency pair deleted successfully`,
              'success'
            );

            // After successful deletion, invalidate to ensure sync with server
            queryClient.invalidateQueries({ queryKey: ['remittanceRates'] });
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

            // Close the modal after successful removal
            closeModal();

            showToast(
              `${currencyPairName} currency pair removed successfully`,
              'success'
            );
          }
        } catch (error) {
          // Revert all optimistic updates on error
          setEditedData(previousEditedData);
          setEditableRows(previousEditableRows);
          setNewRows(previousNewRows);

          // Revert the query cache
          queryClient.setQueryData(
            ['remittanceRates', currency, agFc, date],
            (oldData) => {
              if (!oldData) return [item];
              return [...oldData, item];
            }
          );

          // Close the modal even on error
          closeModal();

          showErrorToast(
            error || `Failed to delete ${currencyPairName} currency pair`
          );
        }
      },
      'info'
    );
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
      // Find the original item from remittanceRates or newRows
      const originalItem = [...(remittanceRates || []), ...newRows].find(
        (item) => item.id === itemId
      );

      // Ensure the original item exists
      if (!originalItem) return prev;

      const updatedItem = {
        ...(prev[itemId] || originalItem),
        [field]: value,
      };

      // Auto-calculate From and Upto rates when Buy Rate or Sell Rate changes
      if (field === 'buy_rate' && value) {
        const currencyId = updatedItem.currency_id;
        if (currencyId) {
          const rateVariation = getCurrencyRateVariation(currencyId);
          const { from, upto } = calculateRateRange(value, rateVariation);
          updatedItem.buy_from = from;
          updatedItem.buy_upto = upto;
        }
      } else if (field === 'sell_rate' && value) {
        const currencyId = updatedItem.currency_id;
        if (currencyId) {
          const rateVariation = getCurrencyRateVariation(currencyId);
          const { from, upto } = calculateRateRange(value, rateVariation);
          updatedItem.sell_from = from;
          updatedItem.sell_upto = upto;
        }
      }

      const newEditedData = {
        ...prev,
        [itemId]: updatedItem,
      };

      // Auto pair logic: update opposite pair when rates are changed
      if (
        autoPairEnabled &&
        updatedItem.currency_id &&
        updatedItem.ag_fcy_id &&
        (field === 'buy_rate' || field === 'sell_rate')
      ) {
        // Find existing opposite pair
        const allItems = [...(remittanceRates || []), ...newRows];
        const oppositePair = allItems.find(
          (item) =>
            item.currency_id === updatedItem.ag_fcy_id &&
            item.ag_fcy_id === updatedItem.currency_id
        );

        if (oppositePair) {
          // Update the opposite pair's rates
          const oppositeField = field === 'buy_rate' ? 'sell_rate' : 'buy_rate';
          const invertedRate = value ? (1 / parseFloat(value)).toFixed(8) : '';

          newEditedData[oppositePair.id] = {
            ...(newEditedData[oppositePair.id] || oppositePair),
            [oppositeField]: invertedRate,
          };
        }
      }

      return newEditedData;
    });
  };

  const handleAddRows = () => {
    const newRows = Array.from({ length: 10 }, (_, index) => {
      const id = `new-${index}`; // Ensure unique IDs
      return {
        id,
        action: 'unlock',
        currency_id: '',
        ag_fcy_id: 'null',
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

  // Helper function to create opposite currency pair
  const createOppositePair = (originalItem, editedItem) => {
    const currentItem = editedItem || originalItem;

    // Only create opposite pair if both currencies are selected
    if (!currentItem.currency_id || !currentItem.ag_fcy_id) {
      return null;
    }

    // Check if opposite pair already exists
    const allItems = [...(remittanceRates || []), ...newRows];
    const oppositeExists = allItems.some(
      (item) =>
        item.currency_id === currentItem.ag_fcy_id &&
        item.ag_fcy_id === currentItem.currency_id
    );

    if (oppositeExists) {
      return null; // Don't create if opposite pair already exists
    }

    // Create opposite pair with swapped currencies and inverted rates
    const oppositePair = {
      id: crypto.randomUUID(),
      action: 'unlock',
      currency_id: currentItem.ag_fcy_id,
      ag_fcy_id: currentItem.currency_id,
      buy_rate: currentItem.sell_rate
        ? (1 / parseFloat(currentItem.sell_rate)).toFixed(8)
        : '',
      buy_from: currentItem.sell_from || '',
      buy_upto: currentItem.sell_upto || '',
      sell_rate: currentItem.buy_rate
        ? (1 / parseFloat(currentItem.buy_rate)).toFixed(8)
        : '',
      sell_from: currentItem.buy_from || '',
      sell_upto: currentItem.buy_upto || '',
      is_new: 1,
      date: date,
    };

    return oppositePair;
  };

  const handleCurrencyChange = (itemId, field, selected) => {
    setEditedData((prev) => {
      const originalItem = [...(remittanceRates || []), ...newRows].find(
        (item) => item.id === itemId
      );

      if (!originalItem) return prev;

      const updatedItem = {
        ...(prev[itemId] || originalItem),
        [field]: selected,
        action: 'unlock',
      };

      // Recalculate From/Upto rates when currency changes and rates exist
      if (field === 'currency_id' && selected) {
        const rateVariation = getCurrencyRateVariation(selected);

        // Recalculate buy rates if buy_rate exists
        if (updatedItem.buy_rate) {
          const { from, upto } = calculateRateRange(
            updatedItem.buy_rate,
            rateVariation
          );
          updatedItem.buy_from = from;
          updatedItem.buy_upto = upto;
        }

        // Recalculate sell rates if sell_rate exists
        if (updatedItem.sell_rate) {
          const { from, upto } = calculateRateRange(
            updatedItem.sell_rate,
            rateVariation
          );
          updatedItem.sell_from = from;
          updatedItem.sell_upto = upto;
        }
      }

      const newEditedData = {
        ...prev,
        [itemId]: updatedItem,
      };

      // Auto pair logic: create opposite pair when both currencies are selected
      if (autoPairEnabled && updatedItem.currency_id && updatedItem.ag_fcy_id) {
        const oppositePair = createOppositePair(originalItem, updatedItem);

        if (oppositePair) {
          // Find the index of the current item in newRows
          const currentItemIndex = newRows.findIndex(
            (item) => item.id === itemId
          );

          if (currentItemIndex !== -1) {
            // Insert opposite pair right after the current item
            setNewRows((prevRows) => {
              const newRowsCopy = [...prevRows];
              newRowsCopy.splice(currentItemIndex + 1, 0, oppositePair);
              return newRowsCopy;
            });
          } else {
            // If current item is not in newRows (it's from remittanceRates), add to beginning of newRows
            setNewRows((prevRows) => [oppositePair, ...prevRows]);
          }

          // Make the opposite pair editable
          setEditableRows((prevEditable) => ({
            ...prevEditable,
            [oppositePair.id]: true,
          }));

          // Add opposite pair to edited data
          newEditedData[oppositePair.id] = oppositePair;
        }
      }

      return newEditedData;
    });
  };

  function handleCancel() {
    navigate(-1);
  }

  if (errorRemittance) {
    showErrorToast(errorRemittance);
  }
  // Show Action column only if user has edit or delete permission
  const visibleHeaders = filterHeaders(remittanceRateOfExchangeHeaders, {
    Action: hasEditPermission || hasDeletePermission,
  });
  return (
    <>
      <div className="d-flex justify-content-center">
        <HorizontalTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
      <div className="d-flex gap-3 justify-content-between flex-wrap mb-4">
        <div className="d-flex flex-column">
          <BackButton />
          <h2 className="screen-title mb-0">Rate Of Exchange</h2>
        </div>
        <div className="d-flex gap-2">
          <CustomButton
            text={'Get Online Rates'}
            onClick={handleGetOnlineRates}
            loading={isLoadingOnline}
          />
          <CustomButton
            text={'Get Special Rates'}
            onClick={() => {
              navigate('/transactions/special-rate-currency');
            }}
          />
        </div>
      </div>
      {/* Table Filters and Date picker */}
      {/* Using separate filters here because of additional functionality */}
      <div className="d-flex align-items-start justify-content-between flex-wrap-reverse">
        <div className="d-flex gap-3 align-items-end mt-3">
          <SearchableSelect
            label={'Currency'}
            options={currencyOptionsFilter}
            placeholder=""
            value={currency}
            onChange={(selected) => {
              setCurrency(selected.value);
            }}
            borderRadius={10}
            minWidth={100}
          />
          <SearchableSelect
            label={'Ag. FCy'}
            options={currencyOptionsFilter}
            placeholder=""
            value={agFc}
            onChange={(selected) => {
              setAgFc(selected.value);
            }}
            borderRadius={10}
            minWidth={100}
          />
        </div>
        <div className="d-flex gap-3 align-items-end ">
          <CustomCheckbox
            style={{ border: 'none', marginBottom: 0 }}
            label={'Auto Currency Pair Definition'}
            checked={autoPairEnabled}
            onChange={(e) => setAutoPairEnabled(e.target.checked)}
          />
          <CustomInput
            name="Date"
            label={'Date'}
            type="date"
            showBorders={false}
            error={false}
            borderRadius={10}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
            }}
          />
        </div>
      </div>
      <CustomTable
        headers={visibleHeaders}
        isLoading={isLoadingRemittance}
        isPaginated={false}
        className={'inputTable'}
        hideSearch
        hideItemsPerPage
      >
        {(remittanceRates?.length || newRows.length || isErrorRemittance) && (
          <tbody>
            {isErrorRemittance && !newRows.length && (
              <tr>
                <td colSpan={visibleHeaders.length}>
                  <p className="text-danger mb-0">
                    Unable to fetch data at this time
                  </p>
                </td>
              </tr>
            )}
            {[...(remittanceRates || []), ...newRows].map((item, i) => {
              const editedItem = editedData[item?.id];
              const isLocked =
                (!editableRows[item.id] && item.action === 'lock') ||
                editedData[item.id]?.action === 'lock';
              const isOnlineRate = item.isOnlineRate; // Check if this is an online rate

              return (
                <tr
                  id={`${item.id}-${i}`}
                  key={`${item.id}-${i}`}
                  className={isOnlineRate ? 'table-success' : ''} // Highlight online rates
                >
                  <td>
                    <SearchableSelect
                      name="currency_id"
                      isDisabled={isLocked}
                      options={currencyOptions}
                      value={editedItem?.currency_id ?? item.currency_id ?? ''}
                      onChange={(selected) => {
                        handleCurrencyChange(
                          item.id,
                          'currency_id',
                          selected.value
                        );
                      }}
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
                      className={isOnlineRate ? 'bg-light-green' : ''}
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
                      className={isOnlineRate ? 'bg-light-green' : ''}
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
                      className={isOnlineRate ? 'bg-light-green' : ''}
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
                      className={isOnlineRate ? 'bg-light-green' : ''}
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
                      className={isOnlineRate ? 'bg-light-green' : ''}
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
                      className={isOnlineRate ? 'bg-light-green' : ''}
                    />
                  </td>
                  <td>
                    <TableActionDropDown
                      actions={[
                        ...(hasEditPermission
                          ? [
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
                                className: editableRows[item.id]
                                  ? 'view'
                                  : 'delete',
                              },
                            ]
                          : []),
                        ...(hasDeletePermission
                          ? [
                              {
                                name: 'Delete',
                                icon: HiOutlineTrash,
                                onClick: () => handleDelete(item),
                                className: 'delete',
                              },
                            ]
                          : []),
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
        {hasCreatePermission && (
          <CustomButton
            text={'Add Rows'}
            disabled={createRemittanceRateMutation.isPending}
            onClick={handleAddRows}
          />
        )}
        {hasCreatePermission && (
          <CustomButton
            variant={'secondaryButton'}
            text={'Save'}
            loading={createRemittanceRateMutation.isPending}
            disabled={createRemittanceRateMutation.isPending}
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
                createRemittanceRateMutation.mutate(formData);
              }
            }}
          />
        )}
        <CustomButton
          variant={'secondaryButton'}
          text={'Cancel'}
          disabled={createRemittanceRateMutation.isPending}
          onClick={handleCancel}
        />
      </div>
    </>
  );
};

export default withModal(withFilters(RemittanceRateOfExchange));
