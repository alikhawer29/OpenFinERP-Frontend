import { useState, useEffect, useRef, useMemo } from 'react';
import { Col, Row } from 'react-bootstrap';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi2';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import SearchableSelect from '../../../Components/SearchableSelect/SearchableSelect';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import useFormStore from '../../../Stores/FormStore';
import { budgetSetupAccountsHeaders } from '../../../Utils/Constants/TableHeaders';
import {
  getBudgetPreferenceAccounts,
  getBudgetSetupById,
} from '../../../Services/Process/BudgetSetup';
import { formatDate, showErrorToast } from '../../../Utils/Utils';
import Skeleton from 'react-loading-skeleton';

const BudgetSetupNewAccounts = ({ onCancel }) => {
  usePageTitle('Budget Setup Accounts');
  const navigate = useNavigate();
  const { id } = useParams();
  const { state } = useLocation();

  const fiscalPeriodData = useFormStore((x) => x.getFormValues('budget_setup'));
  const {
    saveFormValues,
    getFormValues,
    hasFormValues,
    clearFormValues,
    setLastVisitedPage,
    getLastVisitedPage,
    clearLastVisitedPage,
  } = useFormStore();

  const [rows, setRows] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const isRestoringRef = useRef(false);
  const formId = 'budget_setup_accounts';

  // fetch preference accounts
  const {
    data: preferenceData,
    isLoading: isPrefLoading,
    isError: isPrefError,
    error: prefError,
  } = useQuery({
    queryKey: ['getBudgetPreferenceAccounts'],
    queryFn: getBudgetPreferenceAccounts,
  });

  // stable account options
  const accountOptions = useMemo(() => {
    return preferenceData
      ? preferenceData.map((acc) => ({
          label: `${acc.title} (${acc.type})`,
          value: acc.id,
          group:
            acc.type === 'revenue'
              ? 'Revenue'
              : acc.type === 'expense'
              ? 'Expense'
              : acc.type,
          raw: acc,
        }))
      : [];
  }, [preferenceData]);

  const editId = id || state?.searchTerm;

  // fetch budget setup by id for edit
  const {
    data: budgetSetupData,
    isLoading: isLoadingDetails,
    isError: isErrorDetails,
    error: errorDetails,
  } = useQuery({
    queryKey: ['budgetSetupDetails', editId],
    queryFn: () => getBudgetSetupById(editId),
    enabled: !!editId,
  });

  // setup rows
  useEffect(() => {
    if (editId && budgetSetupData) {
      setIsEditMode(true);

      const existingData = budgetSetupData.accounts || [];
      
      const prefilledRows = existingData.map((existingItem, index) => {
        const matchedOption = accountOptions.find(
          (opt) => opt.value === existingItem.account_id
        );
        return {
          id: index + 1,
          accountGroup:
            existingItem?.account_group ||
            matchedOption?.group ||
            existingItem?.account_name?.group ||
            '',
          accountName: matchedOption
            ? matchedOption
            : existingItem?.account_name
            ? {
                label: existingItem.account_name?.label,
                value: existingItem.account_id,
                group:
                  existingItem?.account_group ||
                  existingItem?.account_name?.group ||
                  '',
              }
            : null,
        };
      });

      setRows(prefilledRows);
    } else if (!editId) {
      // new mode default rows
      setRows(
        Array.from({ length: 5 }, (_, idx) => ({
          id: idx + 1,
          accountName: null,
          accountGroup: '',
        }))
      );
    }
  }, [editId, budgetSetupData, accountOptions]);

  // restore saved values when coming back
  useEffect(() => {
    const lastPage = getLastVisitedPage(formId);
    if (lastPage === 'entries' && hasFormValues(formId)) {
      const savedValues = getFormValues(formId);
      if (savedValues && savedValues.length > 0) {
        isRestoringRef.current = true;
        const restoredRows = savedValues.map((savedItem, index) => ({
          id: savedItem.id || index + 1,
          accountGroup: savedItem.account_group || '',
          accountName: savedItem.account_name
            ? {
                label: savedItem.account_name.label,
                value: savedItem.account_name.value,
                group: savedItem.account_group,
              }
            : null,
        }));
        setRows(restoredRows);
        clearFormValues(formId);
        clearLastVisitedPage(formId);
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 200);
      }
    }
  }, []);

  if (isErrorDetails) {
    showErrorToast(errorDetails);
  }

  const addRow = () => {
    setRows((prev) => {
      const lastId = prev[prev.length - 1]?.id || 0;
      const newRows = Array.from({ length: 5 }, (_, idx) => ({
        id: lastId + idx + 1,
        accountName: null,
        accountGroup: '',
      }));
      return [...prev, ...newRows];
    });
  };

  const deleteRow = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const onAccountChange = (id, option) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, accountName: option, accountGroup: option?.group || '' }
          : r
      )
    );
  };

  const handleNext = () => {
    const filteredRows = rows
      .filter((r) => r.accountName)
      .map((r) => ({
        id: r.id,
        account_group: r.accountGroup,
        account_name: {
          label: r.accountName.label,
          value: r.accountName.value,
        },
      }));

    saveFormValues(formId, filteredRows);
    setLastVisitedPage(formId, 'new-account');

    if (isEditMode) {
      navigate(`/process/entries/edit/${editId}`);
    } else {
      navigate('/process/entries');
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/process/budget-setup');
    }
  };

  return (
    <section>
      <div className="mb-3">
        <div className="d-flex flex-column gap-2 mb-1">
          <BackButton
            handleBack={() => {
              const currentData = rows.map((r) => ({
                id: r.id,
                account_group: r.accountGroup,
                account_name: r.accountName
                  ? { label: r.accountName.label, value: r.accountName.value }
                  : null,
              }));
              saveFormValues(formId, currentData);
              setLastVisitedPage(formId, 'new-account');
              navigate('/process/budget-setup');
            }}
          />
          <h2 className="screen-title m-0 d-inline">Budget Setup</h2>
        </div>
        <p className="mb-0">
          Fiscal Period :{' '}
          <span>
            {isPrefLoading ? (
              <Skeleton width={100} height={18} />
            ) : isEditMode ? (
              `${formatDate(budgetSetupData?.fiscal_year_start ,"YYYY/MM")} - ${formatDate( budgetSetupData?.fiscal_year_end ,  "YYYY/MM")}`
            ) : (
              `${formatDate(fiscalPeriodData?.startLabel , "YYYY/MM" || '-' )} - ${formatDate( fiscalPeriodData?.endLabel , "YYYY/MM" || '-')
              }`
            )}
          </span>
        </p>
      </div>
      <Row>
        <Col xs={12}>
          <CustomTable
            hasFilters={false}
            headers={budgetSetupAccountsHeaders}
            isPaginated={false}
            className={'inputTable'}
            isLoading={isPrefLoading}
          >
            {isPrefError && (
              <tbody>
                <tr>
                  <td colSpan={3} className="text-danger text-center">
                    {prefError?.message || 'Failed to load accounts'}
                  </td>
                </tr>
              </tbody>
            )}

            {!isPrefLoading && !isPrefError && !!rows.length && (
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id}>
                    <td>{item.accountGroup || '-'}</td>
                    <td style={{ minWidth: '300px' }}>
                      <SearchableSelect
                        name="account_name"
                        options={accountOptions}
                        value={
                          item.accountName
                            ? accountOptions.find(
                                (opt) => opt.value === item.accountName.value
                              ) || item.accountName
                            : null
                        }
                        onChange={(opt) => onAccountChange(item.id, opt)}
                        getOptionLabel={(opt) => opt.label}
                        getOptionValue={(opt) => opt.value}
                        placeholder="Select"
                        className="w-100 fixed-select"
                      />
                    </td>
                    <td>
                      <TableActionDropDown
                        actions={[
                          {
                            name: 'Delete',
                            icon: HiOutlineTrash,
                            onClick: () => deleteRow(item.id),
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
          <div className="d-flex gap-2 mt-3">
            <CustomButton
              text="Add Rows"
              icon={HiOutlinePlus}
              onClick={addRow}
            />
            <CustomButton text="Next" onClick={handleNext} />
            <CustomButton
              text="Cancel"
              variant="secondaryButton"
              onClick={handleCancel}
            />
          </div>
        </Col>
      </Row>
    </section>
  );
};

export default BudgetSetupNewAccounts;
