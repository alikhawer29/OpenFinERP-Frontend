import { Form, Formik } from 'formik';
import { useCallback, useEffect, useRef, useState } from 'react';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import CustomModal from '../../../Components/CustomModal';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import PartyLedgerForm from '../../../Components/PartyLedgerForm/PartyLedgerForm';
import ChartOfAccountForm from '../../../Components/ChartOfAccountForm/ChartOfAccountForm';
import WalkInCustomerForm from '../../../Components/WalkInCustomerForm/WalkInCustomerForm';
import useCurrencyRate from '../../../Hooks/useCurrencyRate';
import { specialCommissionHeaders } from '../../../Utils/Constants/TableHeaders';
import { specialCommissionValidationSchema } from '../../../Utils/Validations/ValidationSchemas';
import { formatAmountValue, formatNumberWithCommas } from '../../../Utils/Helpers';
import SpecialCommissionRow from './SpecialCommissionRow';

const generateInitialRows = (count) => {
  const rows = {};
  Array.from({ length: count }).forEach(() => {
    const id = crypto.randomUUID();
    rows[id] = {
      id,
      ledger: '',
      credit_account_id: '',
      narration: '',
      percentage: '',
      amount: '',
      isManuallySet: false,
    };
  });
  return rows;
};
const INITIAL_STATE = generateInitialRows(3);

const SpecialCommission = ({
  preFilledValues = {},
  onSubmit,
  onCancel,
  onDelete,
  isTwoLedgerVoucher = false,
  availableAccounts = [],
  availableCurrencies = [], // Add currency options for IPO integration
  onCommissionTypeChange, // Add callback for commission type changes
}) => {
  const formikRef = useRef();

  // Special Commission form state
  const [rows, setRows] = useState(INITIAL_STATE);
  const [totalCommission, setTotalCommission] = useState(0);
  const [commissionAmount, setCommissionAmount] = useState(0);
  const [difference, setDifference] = useState(0);
  const [totalPercentage, setTotalPercentage] = useState(0);

  // Modal state for adding new accounts
  const [showAddLedgerModal, setShowAddLedgerModal] = useState('');
  const [newlyCreatedAccount, setNewlyCreatedAccount] = useState(null);
  const [currentRowId, setCurrentRowId] = useState(null); // Track which row is adding account

  useEffect(() => {
    // Restore table rows
    if (preFilledValues.distributions?.length > 0) {
      const restoredRows = {};
      preFilledValues?.distributions.forEach((row, index) => {
        const id = crypto.randomUUID();
        // Preserve the isManuallySet flag if it exists, otherwise mark as manually set for restored data
        // This prevents automatic recalculation that might change saved percentages
        restoredRows[id] = {
          id,
          ledger: row.ledger,
          credit_account_id: row.credit_account_id,
          narration: row.narration,
          percentage: row.percentage,
          amount: row.amount,
          isManuallySet: row.isManuallySet !== undefined ? row.isManuallySet : true,
        };
      });
      setRows(restoredRows); // Completely replace initial state
      // Initialize totals/difference for edit mode
      const total = Object.values(restoredRows).reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
      setTotalCommission(total);
      const tc = parseFloat(preFilledValues?.total_commission) || 0;
      setDifference(tc - total);
      setCommissionAmount(tc);
    } else {
      // Reset to initial state if no distributions (for Add mode)
      // For Expense type, ensure at least one row exists
      const commissionType = formikRef.current?.values?.commission_type || preFilledValues?.commission_type;
      if (commissionType === 'Expense' && Object.keys(rows).length === 0) {
        setRows(generateInitialRows(1));
      } else if (Object.keys(rows).length === 0) {
        setRows(INITIAL_STATE);
      }
      setTotalCommission(0);
      setDifference(0);
      setCommissionAmount(0);
    }
  }, [preFilledValues.distributions, preFilledValues?.total_commission]);

  // Update amount when currency changes (for IPO integration)
  useEffect(() => {
    if (availableCurrencies.length > 0 && formikRef.current) {
      const selectedCurrency = formikRef.current.values.currency_id;
      const currencyData = availableCurrencies.find(c => c.value === selectedCurrency);
      if (currencyData && currencyData.amount) {
        formikRef.current.setFieldValue('amount', currencyData.amount);
        // Set current currency for rate fetching
        setCurrentCurrencyId(selectedCurrency);
        setBaseAmount(currencyData.amount);
      }
    }
  }, [availableCurrencies]);

  // Initialize currency when component loads with pre-filled values
  useEffect(() => {
    if (preFilledValues?.currency_id && formikRef.current) {
      setCurrentCurrencyId(preFilledValues.currency_id);
      if (preFilledValues.amount) {
        setBaseAmount(preFilledValues.amount);
      }
    }
  }, [preFilledValues?.currency_id, preFilledValues?.amount]);

  // Format commission and total_commission values when preFilledValues are loaded
  useEffect(() => {
    if (formikRef.current && (preFilledValues?.commission || preFilledValues?.total_commission)) {
      // Format commission percentage to 2 decimal places
      if (preFilledValues?.commission) {
        const commValue = parseFloat(preFilledValues.commission);
        if (!isNaN(commValue)) {
          const formattedComm = commValue.toFixed(2);
          if (formikRef.current.values.commission !== formattedComm) {
            formikRef.current.setFieldValue('commission', formattedComm);
          }
        }
      }

      // Format total_commission to 2 decimal places
      if (preFilledValues?.total_commission) {
        const tcValue = parseFloat(preFilledValues.total_commission);
        if (!isNaN(tcValue)) {
          const formattedTc = tcValue.toFixed(2);
          if (formikRef.current.values.total_commission !== formattedTc) {
            formikRef.current.setFieldValue('total_commission', formattedTc);
          }
        }
      }
    }
  }, [preFilledValues?.commission, preFilledValues?.total_commission]);

  // Set commission_type when preFilledValues change
  useEffect(() => {
    if (preFilledValues?.commission_type && formikRef.current) {
      let capitalizedType;
      if (typeof preFilledValues.commission_type === 'string') {
        capitalizedType = preFilledValues.commission_type.charAt(0).toUpperCase() +
          preFilledValues.commission_type.slice(1).toLowerCase();
      } else {
        // If it's an object, extract the value and capitalize it
        const value = preFilledValues.commission_type?.value || preFilledValues.commission_type || '';
        capitalizedType = typeof value === 'string'
          ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
          : value;
      }

      // Only set if the value has actually changed to prevent infinite loops
      if (formikRef.current.values.commission_type !== capitalizedType) {
        formikRef.current.setFieldValue('commission_type', capitalizedType);
      }
    }
  }, [preFilledValues?.commission_type]);

  // Preserve account field and ledger details when preFilledValues change (for two-ledger vouchers)
  useEffect(() => {
    if (isTwoLedgerVoucher && formikRef.current) {
      const { account_id, ledger } = formikRef.current.values;

      // Aggressively sync account if preFilled is available
      if (preFilledValues?.account_id && String(account_id) !== String(preFilledValues.account_id)) {
        formikRef.current.setFieldValue('account_id', preFilledValues.account_id);
        const accountLabel = preFilledValues.account?.label ||
          preFilledValues.account?.title ||
          preFilledValues.account || '';
        formikRef.current.setFieldValue('account', accountLabel);
      }

      // Aggressively sync ledger if preFilled is available
      const preFilledLedger = preFilledValues?.ledger?.value || preFilledValues?.ledger || '';
      if (preFilledLedger && String(ledger) !== String(preFilledLedger)) {
        const ledgerLabel = preFilledValues.ledger?.label || preFilledValues.ledger_name || '';
        formikRef.current.setFieldValue('ledger', preFilledLedger);
        formikRef.current.setFieldValue('ledger_name', ledgerLabel);
      }
    }
  }, [
    preFilledValues?.account_id,
    preFilledValues?.account,
    preFilledValues?.ledger,
    preFilledValues?.ledger_name,
    isTwoLedgerVoucher,
  ]);

  const isDisabled = (typeof preFilledValues?.commission_type === 'string'
    ? preFilledValues?.commission_type === 'Income'
    : preFilledValues?.commission_type?.value === 'Income');

  // State to track current currency for rate fetching
  const [currentCurrencyId, setCurrentCurrencyId] = useState(null);
  const [baseAmount, setBaseAmount] = useState(0); // Store the base amount for conversion

  // Fetch currency rate when currency changes
  const { data: currencyRate } = useCurrencyRate(currentCurrencyId, preFilledValues?.date);

  // Function to recalculate commission amount based on currency conversion
  const recalculateCommissionAmount = useCallback((newAmount, newCurrencyId, currentCommissionPercentage) => {
    if (!formikRef.current || !currentCommissionPercentage || !newAmount) return;

    // Calculate new commission amount based on the new amount and percentage
    const newCommissionAmount = (parseFloat(currentCommissionPercentage) * parseFloat(newAmount)) / 100;

    // Update the form fields
    formikRef.current.setFieldValue('total_commission', newCommissionAmount);
    setCommissionAmount(newCommissionAmount);

    // Update base amount for future conversions
    setBaseAmount(newAmount);
  }, []);

  // Effect to handle currency rate changes and recalculate commission
  useEffect(() => {
    if (currencyRate && currentCurrencyId && formikRef.current) {
      const currentCommissionPercentage = formikRef.current.values.commission;
      const currentAmount = formikRef.current.values.amount;

      if (currentCommissionPercentage && currentAmount) {
        // Recalculate commission with the new amount
        recalculateCommissionAmount(currentAmount, currentCurrencyId, currentCommissionPercentage);
      }
    }
  }, [currencyRate, currentCurrencyId, recalculateCommissionAmount]);

  // Effect to recalculate commission when amount changes
  useEffect(() => {
    if (formikRef.current && baseAmount) {
      const currentCommissionPercentage = formikRef.current.values.commission;
      const currentAmount = formikRef.current.values.amount;

      // Only recalculate if amount has changed and commission percentage exists
      if (currentCommissionPercentage && currentAmount && currentAmount !== baseAmount) {
        const newCommissionAmount = (parseFloat(currentCommissionPercentage) * parseFloat(currentAmount)) / 100;
        formikRef.current.setFieldValue('total_commission', newCommissionAmount);
        setCommissionAmount(newCommissionAmount);
      }
    }
  }, [baseAmount]);

  // Keep totals and difference in sync with form values and row edits
  useEffect(() => {
    if (formikRef.current) {
      const total = Object.values(rows).reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
      setTotalCommission(total);

      // Calculate total percentage across all rows
      const totalPct = Object.values(rows).reduce((acc, r) => {
        const pct = parseFloat(r.percentage) || 0;
        return acc + pct;
      }, 0);
      setTotalPercentage(totalPct);

      const tc = parseFloat(formikRef.current.values.total_commission) || 0;
      setCommissionAmount(tc);

      // For Income commission type, if no distributions are filled, difference should be 0
      const isIncomeType = formikRef.current.values.commission_type === 'Income';
      const hasValidDistributions = Object.values(rows).some(row =>
        row.ledger && row.credit_account_id && row.percentage && row.amount
      );

      let newDiff;
      if (isIncomeType && !hasValidDistributions) {
        // For Income type with no distributions, difference should be 0
        newDiff = 0;
      } else {
        newDiff = tc - total;
      }

      setDifference(newDiff);
    }
  }, [rows]);

  // Helper function to recalculate amounts only (percentages are entered manually)
  const recalculatePercentagesAndAmounts = useCallback((rows, commissionAmount) => {
    const updatedRows = { ...rows };

    // DISABLED: Auto percentage calculation
    // Only update amounts based on manually entered percentages
    Object.keys(updatedRows).forEach((rowId) => {
      const percentage = parseFloat(updatedRows[rowId].percentage) || 0;
      if (percentage > 0) {
        const calculatedAmount = (percentage * commissionAmount) / 100;
        updatedRows[rowId] = {
          ...updatedRows[rowId],
          amount: Math.round(calculatedAmount * 100) / 100,
        };
      } else if (updatedRows[rowId].percentage === '' || updatedRows[rowId].percentage === null) {
        updatedRows[rowId] = {
          ...updatedRows[rowId],
          amount: '',
        };
      }
    });

    return updatedRows;
  }, []);

  // Handle commission type changes and ensure proper difference calculation
  useEffect(() => {
    if (formikRef.current) {
      const isIncomeType = formikRef.current.values.commission_type === 'Income';
      const hasValidDistributions = Object.values(rows).some(row =>
        row.ledger && row.credit_account_id && row.percentage && row.amount
      );

      if (isIncomeType && !hasValidDistributions) {
        // For Income type with no distributions, force difference to 0
        setDifference(0);
      }
    }
  }, [rows]);

  // Trigger percentage recalculation when commission amount changes (for Expense type)
  useEffect(() => {
    if (formikRef.current &&
      formikRef.current.values.commission_type === 'Expense' &&
      commissionAmount > 0) {
      setRows((prevRows) => {
        return recalculatePercentagesAndAmounts(prevRows, commissionAmount);
      });
    }
  }, [commissionAmount, recalculatePercentagesAndAmounts]);

  // Special Commission form handlers
  const handleAddRows = () => {
    const newRows = generateInitialRows(5); // Add 5 rows at once
    setRows((prevRows) => ({ ...prevRows, ...newRows }));
  };

  const handleFormSubmit = () => {
    // Validate distributions if not disabled
    if (!isDisabled) {
      // Check if difference is 0 (total commission is fully distributed)
      if (Math.abs(difference) > 0.01) {
        // Allow small floating point differences
        alert(
          `The difference must be 0. Currently there is a difference of ${difference.toFixed(
            2
          )}. Please adjust the distribution amounts.`
        );
        return;
      }
    }

    // Clean up distributions - remove empty rows
    const cleanDistributions = Object.values(rows)
      .filter((row) => {
        // Keep row if all required fields are filled (skip narration as it's optional)
        return (
          row.ledger && row.credit_account_id && row.percentage && row.amount
        );
      })
      .map(({ id, ...rest }) => rest); // Remove only the UI-specific id field, keep isManuallySet

    // For expense commission types, require at least one valid distribution row
    if (formikRef.current.values.commission_type === 'Expense' && cleanDistributions.length === 0) {
      alert('At least one distribution row must be filled for expense commission types.');
      return;
    }

    const { currency, ...rest } =
      formikRef.current.values;

    if (onSubmit) {
      onSubmit({
        ...rest,
        account: formikRef.current.values.account, // Include account field
        ledger_name: formikRef.current.values.ledger_name, // Include ledger_name field
        distributions: cleanDistributions,
        // Ensure currency_id is included in the submission
        currency_id: rest.currency_id || rest.currency?.value || rest.currency
      });
    }
  };
  const handleCancel = () => {
    if (onCancel) {
      // Pass current form values to preserve account selection
      onCancel(formikRef.current.values);
    }
  };
  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };


  // Handler functions for rows
  const updateField = useCallback(
    (id, field, value, isManual = false) => {
      setRows((prev) => {
        // Calculate current total percentage
        const currentTotalPercentage = Object.values(prev).reduce((acc, row) => {
          const pct = parseFloat(row.percentage) || 0;
          return acc + pct;
        }, 0);

        // Prevent entry in ledger and credit_account_id when total is 100% and row doesn't have percentage
        if ((field === 'ledger' || field === 'credit_account_id') && currentTotalPercentage >= 100) {
          const currentRow = prev[id];
          const rowHasPercentage = !!(currentRow?.percentage && parseFloat(currentRow.percentage) > 0);
          // Only prevent if this row doesn't have a percentage (new entry)
          if (!rowHasPercentage) {
            return prev; // Don't allow new entries when total is 100%
          }
        }

        const newRows = {
          ...prev,
          [id]: {
            ...prev[id],
            [field]: value,
            ...(field === 'percentage' && { isManuallySet: isManual }),
          },
        };

        if (field === 'percentage') {
          if (value === '' || value === null || value === undefined) {
            newRows[id] = {
              ...newRows[id],
              amount: '',
            };
            return newRows;
          }
          // Check if disabled based on form values
          const commissionType = formikRef.current?.values?.commission_type;
          const isActuallyDisabled = commissionType === 'Income' || !formikRef.current?.values?.total_commission;

          // Get the current commission amount from form values
          const currentCommissionAmount = parseFloat(formikRef.current?.values?.total_commission) || parseFloat(commissionAmount) || 0;

          // Parse the entered percentage value (handle empty string, null, undefined, and leading zeros)
          // Handle leading zeros: "050" should be treated as 50
          let normalizedValue = value;
          if (normalizedValue && typeof normalizedValue === 'string' && normalizedValue.trim() !== '') {
            // Remove leading zeros but keep at least one digit if all zeros
            normalizedValue = normalizedValue.replace(/^0+/, '') || '0';
            // If original was like "000", keep as "0", otherwise use normalized value
            if (value.replace(/^0+/, '') === '' && value.length > 1) {
              normalizedValue = '0';
            }
          }
          const enteredPercentage = normalizedValue === '' || normalizedValue === null || normalizedValue === undefined ? 0 : parseFloat(normalizedValue) || 0;


          // Only proceed if not disabled and we have a valid commission amount
          if (!isActuallyDisabled && currentCommissionAmount > 0) {
            // Update the value with normalized value (remove leading zeros) if different
            if (normalizedValue !== value && normalizedValue !== '') {
              newRows[id] = {
                ...newRows[id],
                percentage: normalizedValue,
              };
            }

            // Update amounts for all rows based on their percentages
            // Only update amounts for rows that have a percentage value
            Object.keys(newRows).forEach((rowId) => {
              const percentage = parseFloat(newRows[rowId].percentage) || 0;
              if (percentage > 0) {
                const calculatedAmount = (percentage * currentCommissionAmount) / 100;
                newRows[rowId] = {
                  ...newRows[rowId],
                  amount: Math.round(calculatedAmount * 100) / 100, // Round to 2 decimal places
                };
              } else if (percentage === 0 && newRows[rowId].percentage === '0') {
                // Only clear amount if percentage is explicitly set to 0 (not empty)
                newRows[rowId] = {
                  ...newRows[rowId],
                  amount: '',
                };
              } else if (newRows[rowId].percentage === '') {
                // If percentage is empty string, clear the amount as well
                newRows[rowId] = {
                  ...newRows[rowId],
                  amount: '',
                };
              }
            });
          }
        }

        if (field === 'amount') {
          const total = Object.values(newRows).reduce((acc, row) => {
            const amount = parseFloat(row.amount) || 0;
            return acc + amount;
          }, 0);
          setTotalCommission(total);
          const tc = parseFloat(formikRef.current.values.total_commission) || 0;
          setDifference(tc - total);
        }
        return newRows;
      });
    },
    [commissionAmount, isDisabled]
  );
  const handleDeleteRow = (id) => {
    setRows((prevRows) => {
      const newState = { ...prevRows };
      // For Expense commission type, ensure at least one row remains
      const commissionType = formikRef.current?.values?.commission_type;
      const currentRowCount = Object.keys(prevRows).length;

      if (commissionType === 'Expense' && currentRowCount <= 1) {
        // Don't allow deletion if it's the last row for Expense type
        return prevRows;
      }

      delete newState[id];

      // If no rows remain after deletion, add at least one empty row for Expense type
      if (commissionType === 'Expense' && Object.keys(newState).length === 0) {
        return generateInitialRows(1);
      }

      return newState;
    });
  };

  // Handle newly created account
  useEffect(() => {
    if (newlyCreatedAccount?.id && currentRowId) {
      // Update the row with the newly created account
      setRows((prev) => ({
        ...prev,
        [currentRowId]: {
          ...prev[currentRowId],
          credit_account_id: newlyCreatedAccount.id,
        },
      }));
      // Reset states
      setNewlyCreatedAccount(null);
      setCurrentRowId(null);
    }
  }, [newlyCreatedAccount, currentRowId]);

  // Handler for opening add ledger modal with row context
  const handleShowAddLedgerModal = (modalType, rowId) => {
    setShowAddLedgerModal(modalType);
    setCurrentRowId(rowId);
  };

  // Render modal forms for adding new accounts
  const renderAddLedgerForm = () => {
    switch (showAddLedgerModal) {
      case 'add new pl':
        return (
          <PartyLedgerForm
            inPopup
            onSuccess={(newlyCreatedAccount) => {
              setNewlyCreatedAccount(newlyCreatedAccount);
              setShowAddLedgerModal('');
            }}
            onCancel={() => {
              setShowAddLedgerModal('');
              setCurrentRowId(null);
            }}
          />
        );
      case 'add new wic':
        return (
          <WalkInCustomerForm
            inPopup
            onSuccess={(newlyCreatedAccount) => {
              setNewlyCreatedAccount(newlyCreatedAccount);
              setShowAddLedgerModal('');
            }}
            onCancel={() => {
              setShowAddLedgerModal('');
              setCurrentRowId(null);
            }}
          />
        );
      case 'add new gl':
        return (
          <ChartOfAccountForm
            inPopup
            onSuccess={(newlyCreatedAccount) => {
              setNewlyCreatedAccount(newlyCreatedAccount);
              setShowAddLedgerModal('');
            }}
            onCancel={() => {
              setShowAddLedgerModal('');
              setCurrentRowId(null);
            }}
          />
        );
      default:
        break;
    }
  };

  return (
    <>
      <div className="px-4 pt-2">
        <h2 className="screen-title-body mb-45">Special Commission</h2>
        <div>
          <Formik
            innerRef={formikRef}
            enableReinitialize={true}
            initialValues={{
              transaction_no: preFilledValues?.transaction_no || '',
              date: preFilledValues?.date || '',
              commission_type: preFilledValues?.commission_type
                ? typeof preFilledValues.commission_type === 'string'
                  ? preFilledValues.commission_type.charAt(0).toUpperCase() +
                  preFilledValues.commission_type.slice(1).toLowerCase()
                  : preFilledValues.commission_type?.value ||
                  preFilledValues.commission_type ||
                  ''
                : '',
              ledger:
                preFilledValues?.ledger?.value || preFilledValues?.ledger || '',
              ledger_name:
                preFilledValues?.ledger_name ||
                preFilledValues?.ledger?.label ||
                '',
              account:
                preFilledValues?.account?.label ||
                preFilledValues?.account?.title ||
                preFilledValues?.account ||
                '',
              account_id:
                preFilledValues?.account_id ||
                preFilledValues?.account?.value ||
                preFilledValues?.account?.id ||
                '',
              currency:
                preFilledValues?.currency?.label ||
                preFilledValues?.currency ||
                '',
              currency_id:
                preFilledValues?.currency?.value ||
                preFilledValues?.currency_id ||
                '',
              amount: preFilledValues?.amount || '',
              commission: preFilledValues?.commission
                ? (() => {
                  const commValue = parseFloat(preFilledValues.commission);
                  return !isNaN(commValue) ? commValue.toFixed(2) : '';
                })()
                : '',
              total_commission: preFilledValues?.total_commission
                ? (() => {
                  const tcValue = parseFloat(preFilledValues.total_commission);
                  return !isNaN(tcValue) ? tcValue.toFixed(2) : '';
                })()
                : '',
              description: preFilledValues?.description || '',
            }}
            validationSchema={specialCommissionValidationSchema}
            onSubmit={handleFormSubmit}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              setFieldValue,
            }) => {


              return (
                <Form>
                  <div className="row">
                    <div className="col-12 col-xl-10">
                      <div className="row mb-4">
                        {/* Transaction No */}
                        <div className="col-12 col-sm-6 mb-4">
                          <CustomInput
                            name={'transaction_no'}
                            label={'Transaction No'}
                            type={'text'}
                            value={values.transaction_no}
                            disabled={true}
                            readOnly
                          />
                        </div>
                        {/* Date */}
                        <div className="col-12 col-sm-6 mb-3">
                          <CustomInput
                            name={'date'}
                            label={'Date'}
                            type={'date'}
                            value={values.date}
                            disabled={true}
                            readOnly
                          />
                        </div>
                        {/* Commission Type */}
                        <div className="col-12 col-sm-6 mb-45">
                          <SearchableSelect
                            name={'commission_type'}
                            label={'Commission Type'}
                            placeholder={'Select Commission Type'}
                            options={[
                              {
                                label: 'Income',
                                value: 'Income',
                              },
                              {
                                label: 'Expense',
                                value: 'Expense',
                              },
                            ]}
                            value={values.commission_type}
                            onChange={(v) => {
                              setFieldValue('commission_type', v.value);

                              // Notify parent component about commission type change
                              if (onCommissionTypeChange) {
                                onCommissionTypeChange(v.value);
                              }

                              // Clear all distribution rows completely when commission type changes
                              setRows((prevRows) => {
                                // For Expense type, ensure at least one row exists
                                if (v.value === 'Expense') {
                                  const updatedRows = {};
                                  Object.keys(prevRows).forEach((rowId) => {
                                    updatedRows[rowId] = {
                                      ...prevRows[rowId],
                                      ledger: '',
                                      credit_account_id: '',
                                      narration: '',
                                      percentage: '',
                                      amount: '',
                                      isManuallySet: false,
                                    };
                                  });
                                  // If no rows exist, create at least one
                                  if (Object.keys(updatedRows).length === 0) {
                                    return generateInitialRows(1);
                                  }
                                  return updatedRows;
                                } else {
                                  // For Income type, clear all rows
                                  const updatedRows = {};
                                  Object.keys(prevRows).forEach((rowId) => {
                                    updatedRows[rowId] = {
                                      ...prevRows[rowId],
                                      ledger: '',
                                      credit_account_id: '',
                                      narration: '',
                                      percentage: '',
                                      amount: '',
                                      isManuallySet: false,
                                    };
                                  });
                                  return updatedRows;
                                }
                              });

                              // Reset difference and totals when commission type changes
                              setDifference(0);
                              setTotalCommission(0);
                            }}
                            onBlur={handleBlur}
                          />
                        </div>
                        <div className="col-12 col-sm-6 mb-3" />

                        {/* Ledger Name */}
                        <div className="col-12 col-sm-6 mb-45">
                          <CustomInput
                            name={'ledger_name'}
                            label={'Ledger Name'}
                            type={'text'}
                            value={values.ledger_name}
                            disabled={true}
                          />
                        </div>
                        {/* Account Name - Show dropdown for two-ledger vouchers */}
                        <div className="col-12 col-sm-6 mb-45">
                          {isTwoLedgerVoucher ? (
                            <SearchableSelect
                              name={'account_id'}
                              label={'Account'}
                              placeholder={'Select Account'}
                              options={availableAccounts}
                              value={values.account_id}
                              isLoose={true}
                              onChange={(selected) => {
                                setFieldValue('account_id', selected.value);
                                setFieldValue('account', selected.label);
                                // Auto-fetch and set the ledger based on selected account
                                const selectedAccount = availableAccounts.find(acc => String(acc.value) === String(selected.value));
                                if (selectedAccount) {
                                  setFieldValue('ledger', selectedAccount.ledgerType);
                                  setFieldValue('ledger_name', selectedAccount.ledgerLabel);
                                }
                              }}
                              onBlur={handleBlur}
                              error={touched.account_id && errors.account_id}
                            />
                          ) : (
                            <CustomInput
                              name={'account'}
                              label={'Account'}
                              type={'text'}
                              value={values.account}
                              disabled={true}
                            />
                          )}
                        </div>
                        {/* Currency */}
                        <div className="col-12 col-sm-6 mb-45">
                          {availableCurrencies.length > 0 ? (
                            <SearchableSelect
                              label={'Currency'}
                              options={availableCurrencies}
                              value={values.currency_id}
                              onChange={(selected) => {
                                setFieldValue('currency_id', selected.value);
                                setFieldValue('currency', selected.label);

                                // Update amount when currency changes
                                if (selected.amount) {
                                  setFieldValue('amount', selected.amount);
                                }

                                // Set current currency for rate fetching and commission recalculation
                                setCurrentCurrencyId(selected.value);

                                // Recalculate commission amount if commission percentage exists
                                const currentCommissionPercentage = values.commission;
                                if (currentCommissionPercentage && selected.amount) {
                                  const newCommissionAmount = (parseFloat(currentCommissionPercentage) * parseFloat(selected.amount)) / 100;
                                  setFieldValue('total_commission', newCommissionAmount);
                                  setCommissionAmount(newCommissionAmount);
                                  setBaseAmount(selected.amount);
                                }
                              }}
                              placeholder="Select Currency"
                            />
                          ) : (
                            <CustomInput
                              name={'currency'}
                              label={'Currency'}
                              type={'text'}
                              value={values.currency}
                              disabled={true}
                            />
                          )}
                        </div>
                        {/* Amount */}
                        <div className="col-12 col-sm-6 mb-3">
                          <CustomInput
                            name={'amount'}
                            label={'Amount'}
                            type={'number'}
                            disabled={true}
                            value={values.amount}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.amount && errors.amount}
                          />
                        </div>
                        {/* Commission Percentage */}
                        <div className="col-12 col-sm-6 mb-3">
                          <CustomInput
                            name={'commission'}
                            label={'Commission Percentage'}
                            type={'number'}
                            value={values.commission || ''}
                            max={100}
                            inputClass={'amount'}
                            onChange={(v) => {
                              let value = v.target.value;

                              // Handle empty value
                              if (value === '' || value === null || value === undefined) {
                                setFieldValue('commission', '');
                                setFieldValue('total_commission', '');
                                setCommissionAmount(0);
                                return;
                              }

                              // Strict validation: Only allow numbers with maximum 2 decimal places
                              // Regex pattern: allows numbers with optional decimal point and max 2 decimal digits
                              const decimalPattern = /^-?\d*\.?\d{0,2}$/;

                              // Check if the value matches the pattern (allows typing up to 2 decimals)
                              if (!decimalPattern.test(value)) {
                                // If it doesn't match, prevent the input
                                return;
                              }

                              // Prevent negative values
                              if (value.startsWith('-')) {
                                return;
                              }

                              // Prevent values greater than 100
                              const numValue = parseFloat(value);
                              if (!isNaN(numValue) && numValue > 100) {
                                return;
                              }

                              // Handle leading zeros: "050" should be treated as 50
                              if (value && typeof value === 'string' && value.trim() !== '') {
                                // Don't normalize if user is typing a decimal (e.g., "0.5" should stay as "0.5")
                                if (!value.includes('.')) {
                                  const normalizedValue = value.replace(/^0+/, '') || '0';
                                  if (value.replace(/^0+/, '') === '' && value.length > 1) {
                                    value = '0';
                                  } else if (normalizedValue !== value) {
                                    value = normalizedValue;
                                  }
                                }
                              }

                              // Update field value
                              setFieldValue('commission', value);

                              // Calculate commission amount if we have a valid percentage and amount
                              if (value && !isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                                const amount = parseFloat(values.amount || 0);
                                let commission = numValue;

                                let newCommissionAmount = (commission * amount) / 100;
                                // Round to 2 decimal places
                                newCommissionAmount = Math.round(newCommissionAmount * 100) / 100;
                                // Ensure commission amount doesn't exceed base amount
                                if (newCommissionAmount > amount && amount > 0) {
                                  newCommissionAmount = amount;
                                  commission = 100;
                                  setFieldValue('commission', '100');
                                }

                                setFieldValue('total_commission', newCommissionAmount);
                                setCommissionAmount(newCommissionAmount);

                                // Update row amounts when commission percentage changes
                                if (commission && values.amount) {
                                  setRows((prevRows) => {
                                    const updatedRows = {};
                                    Object.keys(prevRows).forEach((rowId) => {
                                      const row = prevRows[rowId];
                                      if (row.percentage && !row.isManuallySet) {
                                        const newAmount = (parseFloat(row.percentage) * newCommissionAmount) / 100;
                                        updatedRows[rowId] = {
                                          ...row,
                                          amount: Math.round(newAmount * 100) / 100,
                                        };
                                      } else {
                                        updatedRows[rowId] = { ...row };
                                      }
                                    });
                                    return updatedRows;
                                  });
                                }
                              }
                            }}
                            onBlur={(e) => {
                              handleBlur(e);
                              // On blur, ensure the value is rounded to 2 decimal places and formatted
                              const value = e.target.value;
                              if (value && value !== '' && value !== null && value !== undefined) {
                                const numValue = parseFloat(value.replace(/,/g, '')); // Remove commas if present
                                if (!isNaN(numValue)) {
                                  // Round to 2 decimal places
                                  const roundedValue = Math.round(numValue * 100) / 100;
                                  // Format to ensure 2 decimal places are always shown (e.g., "50" -> "50.00", "5.5" -> "5.50")
                                  const formattedValue = roundedValue.toFixed(2);

                                  // Set the formatted value (with 2 decimal places)
                                  setFieldValue('commission', formattedValue);

                                  // Recalculate commission amount with rounded percentage
                                  const amount = parseFloat(values.amount || 0);
                                  const commission = roundedValue;
                                  const newCommissionAmount = Math.round((commission * amount) / 100 * 100) / 100;
                                  setFieldValue('total_commission', newCommissionAmount);
                                  setCommissionAmount(newCommissionAmount);
                                }
                              }
                            }}
                            error={touched.commission && errors.commission}
                          />
                        </div>
                        {/* Commission Amount */}
                        <div className="col-12 col-sm-6 mb-3">
                          <CustomInput
                            name={'total_commission'}
                            label={'Commission Amount'}
                            type={'number'}
                            value={values.total_commission || ''}
                            inputClass={'amount'}
                            max={values.amount && parseFloat(values.amount) > 0 ? parseFloat(values.amount) : undefined}
                            onChange={(v) => {
                              let value = v.target.value;
                              const amount = parseFloat(values.amount || 0);

                              // Handle empty value
                              if (value === '' || value === null || value === undefined) {
                                setFieldValue('total_commission', '');
                                setFieldValue('commission', '');
                                setCommissionAmount(0);
                                return;
                              }

                              // Strict validation: Only allow numbers with maximum 2 decimal places
                              // Regex pattern: allows numbers with optional decimal point and max 2 decimal digits
                              const decimalPattern = /^-?\d*\.?\d{0,2}$/;

                              // Check if the value matches the pattern (allows typing up to 2 decimals)
                              if (!decimalPattern.test(value)) {
                                // If it doesn't match, prevent the input
                                return;
                              }

                              // Prevent negative values
                              if (value.startsWith('-')) {
                                return;
                              }

                              // Remove commas for parsing
                              const cleanValue = value.replace(/,/g, '');
                              let newCommissionAmount = parseFloat(cleanValue || 0);

                              // Validate commission amount doesn't exceed base amount - PREVENT TYPING IF EXCEEDS
                              if (isNaN(newCommissionAmount) || newCommissionAmount < 0) {
                                return; // Prevent invalid values
                              }

                              // Prevent typing values greater than base amount
                              if (amount > 0 && newCommissionAmount > amount) {
                                return; // Don't allow typing values greater than amount
                              }

                              // If value is valid, proceed with updates
                              value = cleanValue;

                              // Store the raw value (allow natural typing, format on blur)
                              setFieldValue('total_commission', value);

                              // Calculate commission percentage from amount for real-time updates
                              if (newCommissionAmount > 0 && amount > 0) {
                                let commission = (newCommissionAmount * 100) / amount;
                                // Round percentage to 2 decimal places
                                commission = Math.round(commission * 100) / 100;

                                // Cap commission percentage at 100%
                                if (commission > 100) {
                                  commission = 100;
                                  newCommissionAmount = amount;
                                  value = amount.toString();
                                  setFieldValue('total_commission', value);
                                }

                                setFieldValue('commission', commission.toString());
                              } else {
                                setFieldValue('commission', '0');
                              }

                              // Use rounded value for calculations
                              const roundedCommissionAmount = Math.round(newCommissionAmount * 100) / 100;
                              setCommissionAmount(roundedCommissionAmount);

                              // Trigger difference recalculation
                              const total = Object.values(rows).reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
                              const newDiff = roundedCommissionAmount - total;
                              setDifference(newDiff);

                              // Update row amounts when commission amount changes
                              if (roundedCommissionAmount && values.amount) {
                                setRows((prevRows) => {
                                  const updatedRows = {};
                                  Object.keys(prevRows).forEach((rowId) => {
                                    const row = prevRows[rowId];
                                    if (row.percentage && !row.isManuallySet) {
                                      const newAmount = (parseFloat(row.percentage) * roundedCommissionAmount) / 100;
                                      updatedRows[rowId] = {
                                        ...row,
                                        amount: Math.round(newAmount * 100) / 100,
                                      };
                                    } else {
                                      updatedRows[rowId] = { ...row };
                                    }
                                  });
                                  return updatedRows;
                                });
                              }
                            }}
                            onBlur={(e) => {
                              handleBlur(e);
                              // On blur, ensure the value is rounded to 2 decimal places
                              const value = e.target.value;
                              if (value && value !== '' && value !== null && value !== undefined) {
                                const numValue = parseFloat(value.replace(/,/g, '')); // Remove commas if present
                                if (!isNaN(numValue)) {
                                  const amount = parseFloat(values.amount || 0);

                                  // Ensure commission amount doesn't exceed base amount
                                  let finalAmount = numValue;
                                  if (finalAmount > amount && amount > 0) {
                                    finalAmount = amount;
                                  }

                                  // Round to 2 decimal places
                                  const roundedValue = Math.round(finalAmount * 100) / 100;
                                  // Format to ensure only 2 decimal places are shown
                                  const formattedValue = roundedValue.toFixed(2);

                                  // Calculate commission percentage
                                  let commission = amount !== 0 ? (roundedValue * 100) / amount : 0;
                                  commission = Math.round(commission * 100) / 100;

                                  if (commission > 100) {
                                    commission = 100;
                                    finalAmount = amount;
                                  }

                                  if (formattedValue !== value || commission !== parseFloat(values.commission || 0)) {
                                    setFieldValue('total_commission', finalAmount.toFixed(2));
                                    setFieldValue('commission', commission.toFixed(2));
                                    setCommissionAmount(finalAmount);

                                    // Recalculate row amounts
                                    setRows((prevRows) => {
                                      const updatedRows = {};
                                      Object.keys(prevRows).forEach((rowId) => {
                                        const row = prevRows[rowId];
                                        if (row.percentage && !row.isManuallySet) {
                                          const newAmount = (parseFloat(row.percentage) * finalAmount) / 100;
                                          updatedRows[rowId] = {
                                            ...row,
                                            amount: Math.round(newAmount * 100) / 100,
                                          };
                                        } else {
                                          updatedRows[rowId] = { ...row };
                                        }
                                      });
                                      return updatedRows;
                                    });
                                  }
                                }
                              }
                            }}
                            error={
                              touched.total_commission && errors.total_commission
                            }
                          />
                        </div>
                        {/* Description */}
                        <div className="col-12 mb-3">
                          <CustomInput
                            name={'description'}
                            label={'Description'}
                            placeholder={'Enter Description'}
                            type={'textarea'}
                            value={values.description}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.description && errors.description}
                          />
                        </div>
                      </div>
                    </div>
                    <h2 className="screen-title-body ">Commission Distribution</h2>
                    <CustomTable
                      displayCard={false}
                      headers={specialCommissionHeaders}
                      isPaginated={false}
                      className={'inputTable'}
                      hideSearch
                      hideItemsPerPage
                    >
                      <tbody>
                        {Object.values(rows).map((row, index) => {
                          const commissionType = values.commission_type;
                          const rowCount = Object.keys(rows).length;
                          // For Expense type, disable delete if it's the last row
                          const isDeleteDisabled = values.commission_type === 'Income' ||
                            !values.total_commission ||
                            (commissionType === 'Expense' && rowCount <= 1);

                          return (
                            <SpecialCommissionRow
                              key={row.id}
                              row={row}
                              commissionAmount={values.total_commission}
                              isDisabled={
                                values.commission_type === 'Income' ||
                                !values.total_commission
                              }
                              index={index}
                              handleDeleteRow={handleDeleteRow}
                              updateField={updateField}
                              isDeleteDisabled={isDeleteDisabled}
                              setShowAddLedgerModal={handleShowAddLedgerModal}
                            />
                          );
                        })}
                      </tbody>
                    </CustomTable>

                    <div className="d-flex flex-wrap align-items-end justify-content-between mt-3 mb-5">
                      <div className="d-flex gap-3 flex-wrap">
                        <CustomButton
                          type={'submit'}
                          text="Save"
                          disabled={
                            // For Income type, only check if total_commission exists
                            (values.commission_type === 'Income' && !values.total_commission) ||
                            // For Expense type, check difference and row validation
                            (values.commission_type === 'Expense' && (
                              Math.abs(difference) > 0.01 ||
                              !values.total_commission ||
                              // Helper function to check if a row is complete and valid
                              (() => {
                                const validRows = Object.values(rows).filter(row =>
                                  row.ledger &&
                                  row.credit_account_id &&
                                  row.percentage &&
                                  row.amount &&
                                  parseFloat(row.amount) > 0
                                );

                                // Must have at least one valid complete row
                                if (validRows.length === 0) return true;

                                // Check if any row has partial data (percentage/amount but missing required fields)
                                const hasIncompleteRows = Object.values(rows).some(row =>
                                  (row.percentage || row.amount) &&
                                  (!row.ledger || !row.credit_account_id)
                                );

                                // Check if any row has all fields but amount is zero or negative
                                const hasInvalidAmountRows = Object.values(rows).some(row =>
                                  row.ledger &&
                                  row.credit_account_id &&
                                  row.percentage &&
                                  row.amount &&
                                  parseFloat(row.amount) <= 0
                                );

                                return hasIncompleteRows || hasInvalidAmountRows;
                              })()
                            ))
                          }
                        />

                        {values.commission_type === 'Expense' && (
                          <CustomButton
                            text="Add Rows"
                            type="button"
                            onClick={handleAddRows}
                            variant="secondaryButton"
                          />
                        )}
                        {(preFilledValues?.total_commission > 0 || preFilledValues?.distributions?.length > 0 || preFilledValues?.commission_type || preFilledValues?.account || preFilledValues?.currency) && (
                          <CustomButton
                            text="Delete"
                            type="button"
                            onClick={handleDelete}
                            variant="secondaryButton"
                          />
                        )}
                        <CustomButton
                          text="Cancel"
                          type="button"
                          onClick={handleCancel}
                          variant="secondaryButton"
                        />
                      </div>
                      <div className="d-flex flex-column gap-2 mt-1 debit-credit-inputs">
                        <CustomInput
                          name="totalCommission"
                          label={'Total Commission'}
                          labelClass={'fw-medium'}
                          type="number"
                          error={false}
                          borderRadius={10}
                          value={
                            values.commission_type === 'Income'
                              ? (values.total_commission ? formatNumberWithCommas(values.total_commission) : '')
                              : (totalCommission > 0 ? formatNumberWithCommas(totalCommission.toFixed(2)) : '0.00')
                          }
                          readOnly
                        />
                        <CustomInput
                          name="difference"
                          label={'Difference'}
                          labelClass={'fw-medium'}
                          type="number"
                          error={false}
                          borderRadius={10}
                          value={difference.toFixed(2)}
                          readOnly
                        />
                        {Math.abs(difference) > 0.01 && values.commission_type === 'Expense' && (
                          <p className="text-danger">Difference must be 0</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Form>
              );
            }}
          </Formik>
        </div>
      </div>

      {/* Add New Ledger Modal */}
      <CustomModal
        show={!!showAddLedgerModal}
        close={() => {
          setShowAddLedgerModal('');
          setCurrentRowId(null);
        }}
        size="xl"
      >
        {renderAddLedgerForm()}
      </CustomModal>
    </>
  );
};

export default SpecialCommission;
