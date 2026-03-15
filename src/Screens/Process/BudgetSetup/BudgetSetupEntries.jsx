import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { HiOutlineTrash } from 'react-icons/hi2';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import BackButton from '../../../Components/BackButton';
import CustomButton from '../../../Components/CustomButton';
import CustomInput from '../../../Components/CustomInput';
import CustomTable from '../../../Components/CustomTable/CustomTable';
import TableActionDropDown from '../../../Components/TableActionDropDown/TableActionDropDown';
import { showToast } from '../../../Components/Toast/Toast';
import { usePageTitle } from '../../../Hooks/usePageTitle';
import {
  createbudgetSetup,
  getBudgetSetupById,
  updateBudgetSetup,
} from '../../../Services/Process/BudgetSetup';
import useFormStore from '../../../Stores/FormStore';
import { budgetSetupEntriesHeaders } from '../../../Utils/Constants/TableHeaders';
import { formatDate, showErrorToast } from '../../../Utils/Utils';
import Skeleton from 'react-loading-skeleton';

//
// 🔹 Helpers
//
// const getFiscalYears = (start, end) => {
//   console.log(new Date(start).getMonth() , "--------------------------------------------------")
//   console.log(new Date(end).getMonth())
//   console.log(end)
//   const startYear = new Date(start).getFullYear();
//   const endYear = new Date(end).getFullYear();
//   const years = [];
//   console.log("Start Year: " , startYear)
//   console.log("End Year: " , endYear)
//   for (let y = startYear; y <= endYear; y++) {
//     years.push(y);
//   }
//   return years;
// };

const getFiscalYears = (start, end) => {
  const parseYearMonth = (ym) => {
    const [year, month] = ym.split('-').map(Number);
    return { year, month: month - 1 }; // JS months are 0-indexed
  };

  const startParsed = parseYearMonth(start);
  const endParsed = parseYearMonth(end);
  let startYear = startParsed.year;
  const endYear = endParsed.year;

  // If the start month is January (0), increment the start year
  // if (startParsed.month === 0) {
  //   startYear += 1;
  // }

  const years = [];
  for (let y = startYear; y <= endYear; y++) {
    years.push(y);
  }

  return years;
};

const isPastPeriod = (fiscalYear, period, preference) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-based (Jan=0)

  if (preference === 'yearly') {
    // disable if year < current year
    return fiscalYear < currentYear;
  }

  if (preference === 'quarterly') {
    // Q1=Jan-Mar, Q2=Apr-Jun, Q3=Jul-Sep, Q4=Oct-Dec
    const qMap = { Q1: 2, Q2: 5, Q3: 8, Q4: 11 }; // last month index of quarter
    const quarterEndMonth = qMap[period];

    if (fiscalYear < currentYear) return true; // past year = disabled
    if (fiscalYear > currentYear) return false; // future year = enabled

    // same year → disable if quarter already ended
    return quarterEndMonth < currentMonth;
  }

  if (preference === 'monthly') {
    // e.g. period = "January", "February"
    const monthIndex = new Date(`${period} 1, ${fiscalYear}`).getMonth();

    if (fiscalYear < currentYear) return true; // past year = disabled
    if (fiscalYear > currentYear) return false; // future year = enabled

    // same year → disable if month already passed
    return monthIndex < currentMonth;
  }

  return false;
};

//
// 🔹 Main Component
//
const BudgetSetupEntries = () => {
  usePageTitle('Budget Setup');
  const navigate = useNavigate();
  const { id } = useParams();
  const { state } = useLocation();


  const fiscalPeriodData = useFormStore((s) => s.getFormValues('budget_setup'));
  const savedAccounts =
    useFormStore((s) => s.getFormValues('budget_setup_accounts')) || [];
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
  const formId = 'budget_setup_entries';


  // Mutations
  const createBudgetSetupMutation = useMutation({
    mutationFn: createbudgetSetup,
    onSuccess: () => {
      showToast('Budget setup saved successfully!', 'success');
      navigate('/process/budget-setup');
    },
    onError: (error) => showErrorToast(error),
  });

  const updateBudgetSetupMutation = useMutation({
    mutationFn: updateBudgetSetup,
    onSuccess: () => {
      showToast('Budget setup updated successfully!', 'success');
      navigate('/process/budget-setup');
    },
    onError: (error) => showErrorToast(error),
  });

  // Fetch for edit mode
  const {
    data: budgetSetupData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['budgetSetupDetails', id],
    queryFn: () => getBudgetSetupById(id),
    enabled: !!id,
  });

  //
  // Restore rows if navigating back from "new-account"
  //
  useEffect(() => {
    const lastPage = getLastVisitedPage(formId);
    if (lastPage === 'new-account' && hasFormValues(formId)) {
      const savedValues = getFormValues(formId);
      if (savedValues?.length) {
        isRestoringRef.current = true;
        setRows(savedValues);
        clearFormValues(formId);
        clearLastVisitedPage(formId);
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 200);
      }
    }
  }, []);

  useEffect(() => {
    if (id || state?.searchTerm) {
      setIsEditMode(true);
    }
  }, [id, state?.searchTerm]);

  //
  // Load rows
  //
  useEffect(() => {
    if (isEditMode && budgetSetupData) {
      const currentBudget = budgetSetupData;
      const preference = currentBudget?.preference?.period?.toLowerCase();
      let prefilledRows = [];

      // Case 1: entries
      if (currentBudget.entries?.length) {
        prefilledRows = currentBudget.entries.map((entry, idx) => ({
          id: entry.id || idx + 1,
          fiscalYear: entry.fiscal_year,
          period: entry.period,
          accountName: {
            label: entry.account_name?.label || entry.account_name || '',
            value: entry.account_id,
          },
          accountGroup: entry.account_group || '',
          budgetAmount: entry.budget_amount || '',
          remarks: entry.remarks || '',
          isDisabled: isPastPeriod(entry.fiscal_year, entry.period, preference),
        }));
      }
      // Case 2: accounts with details
      else if (currentBudget.accounts?.length) {
        currentBudget.accounts.forEach((acc, accIdx) => {
          acc.details?.forEach((detail, dIdx) => {
            prefilledRows.push({
              id: `${accIdx}_${dIdx}`,
              fiscalYear: detail.fiscal_year,
              period: detail.period, // 👈 FIXED
              accountName: {
                label: acc.chart_of_account?.account_name || '',
                value: acc.account_id,
              },
              accountGroup: acc.account_group || '',
              budgetAmount: detail.budget_amount || '',
              remarks: detail.remarks || '',
              chart_of_account: acc.chart_of_account || null,
              isDisabled: isPastPeriod(
                detail.fiscal_year,
                detail.period,
                preference
              ),
            });
          });
        });
      }

      setRows(prefilledRows);
    }
    //
    // New mode
    //
    else if (!isEditMode && savedAccounts?.length && fiscalPeriodData) {
      const years = getFiscalYears(
        fiscalPeriodData.start_date,
        fiscalPeriodData.end_date
      );

      const periods = fiscalPeriodData?.periods || [];
      const preference = fiscalPeriodData?.periodPreference?.toLowerCase();
      const initialRows = [];

      years.forEach((y) => {
        periods.forEach((p) => {
          savedAccounts.forEach((acc, idx) => {
            initialRows.push({
              id: `${y}_${p}_${idx + 1}`,
              fiscalYear: y,
              period: p,
              accountName: {
                label: acc.account_name?.label || '',
                value: acc.account_name?.value || '',
              },
              accountGroup: acc.account_group || '',
              budgetAmount: '',
              remarks: '',
              isDisabled: isPastPeriod(y, p, preference),
            });
          });
        });
      });

      setRows(initialRows);
    }
  }, [isEditMode, budgetSetupData, fiscalPeriodData, savedAccounts, id]);

  if (isError) {
    showErrorToast(error);
  }

  //
  // Handlers
  //
  const deleteRow = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleChange = (id, field, value) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleSave = () => {
    const currentBudget = budgetSetupData;
    const fiscalYearStart =
      currentBudget?.fiscal_year_start || fiscalPeriodData?.start_date;
    const fiscalYearEnd =
      currentBudget?.fiscal_year_end || fiscalPeriodData?.end_date;

    const accountsMap = {};
    rows.forEach((r) => {
      const accId = r.accountName?.value;
      if (!accId) return;
      if (!accountsMap[accId]) {
        accountsMap[accId] = {
          account_group: r.accountGroup,
          account_id: accId,
          details: [],
        };
      }
      accountsMap[accId].details.push({
        fiscal_year: r.fiscalYear,
        period: r.period,
        budget_amount: Number(r.budgetAmount) || 0,
        remarks: r.remarks || '',
      });
    });

    const payload = {
      preference: {
        period:
          currentBudget?.preference?.period?.toLowerCase() ||
          fiscalPeriodData?.periodPreference?.toLowerCase() ||
          'monthly',
      },
      fiscal_year_start: fiscalYearStart,
      fiscal_year_end: fiscalYearEnd,
      accounts: Object.values(accountsMap),
    };



    if (isEditMode) {
      updateBudgetSetupMutation.mutate({ id, payload });
    } else {
      createBudgetSetupMutation.mutate(payload);
    }
  };

  const handleCancel = () => {
    navigate('/process/budget-setup');
  };

  const currentBudget = isEditMode ? budgetSetupData : null;
  const preference = isEditMode
    ? currentBudget?.preference?.period?.toLowerCase()
    : fiscalPeriodData?.periodPreference?.toLowerCase();

  const tableHeaders =
    preference === 'yearly'
      ? budgetSetupEntriesHeaders.filter((x) => x !== 'Period')
      : budgetSetupEntriesHeaders;

  //
  // Render
  //

  return (
    <section>
      <div className="mb-3">
        <div className="d-flex flex-column gap-2 mb-1">
          <BackButton
            handleBack={() => {
              const currentData = rows.map((r) => ({
                id: r.id,
                fiscal_year: r.fiscalYear,
                period: r.period,
                account_group: r.accountGroup,
                account_name: {
                  label: r.accountName?.label || '',
                  value: r.accountName?.value || '',
                },
                budget_amount: r.budgetAmount,
                remarks: r.remarks,
              }));
              saveFormValues(formId, currentData);
              setLastVisitedPage(formId, 'entries');
              if (isEditMode) {
                navigate(`/process/budget-setup/new-account/edit/${id}`);
              } else {
                navigate('/process/budget-setup/new-account');
              }
            }}
          />
          <h2 className="screen-title m-0 d-inline">Budget Setup</h2>
        </div>
        <p className="mb-0">
          Fiscal Period:{' '}
          {isLoading ? (
            <Skeleton width={100} height={18} />
          ) : isEditMode ? (
            `${formatDate(currentBudget?.startLabel, "YYYY/MM") ||
            formatDate(currentBudget?.fiscal_year_start, "YYYY/MM") ||
            '-'
            } - ${formatDate(currentBudget?.endLabel, "YYYY/MM") || formatDate(currentBudget?.fiscal_year_end, "YYYY/MM" || '-')
            }`
          ) : (
            `${formatDate(fiscalPeriodData?.startLabel, "YYYY/MM") || '-'} - ${formatDate(fiscalPeriodData?.endLabel, "YYYY/MM") || '-'
            }`
          )}
        </p>
      </div>

      <Row>
        <Col xs={12}>
          <CustomTable
            hasFilters={false}
            headers={tableHeaders}
            isPaginated={false}
            className={'inputTable'}
          >
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td>{item.fiscalYear}</td>
                  {preference !== 'yearly' && (
                    <td>
                      {item.period}
                    </td>
                  )}
                  <td>{item.accountGroup}</td>
                  <td>{item?.accountName?.label}</td>
                  <td>
                    <CustomInput
                      name={`budgetAmount_${item.id}`}
                      type="number"
                      placeholder="Enter Budget Amount"
                      borderRadius={10}
                      value={parseFloat(item.budgetAmount)}
                      onChange={(e) =>
                        handleChange(item.id, 'budgetAmount', e.target.value)
                      }
                      disabled={isEditMode && item.isDisabled}
                    />
                  </td>
                  <td>
                    <CustomInput
                      name={`remarks_${item.id}`}
                      type="text"
                      placeholder="Enter Remarks"
                      value={item.remarks}
                      borderRadius={10}
                      onChange={(e) =>
                        handleChange(item.id, 'remarks', e.target.value)
                      }
                      disabled={isEditMode && item.isDisabled}
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
                          disabled: isEditMode && item.isDisabled,
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </CustomTable>

          <div className="d-flex gap-2 mt-3">
            <CustomButton
              text={isEditMode ? 'Update' : 'Save'}
              onClick={handleSave}
              disabled={isLoading}
              loading={
                isEditMode
                  ? updateBudgetSetupMutation.isPending
                  : createBudgetSetupMutation.isPending
              }
            />
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

export default BudgetSetupEntries;
