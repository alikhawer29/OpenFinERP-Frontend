import axiosInstance from '../../Config/axiosConfig';

// Mock service for Budgeting Report
// Later replace the implementation to call actual API endpoint

export const getBudgetingReport = async ({ fromDate, toDate, periodType = 'Monthly' }) => {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Generate mock rows based on dates to keep interface stable
  const quarterlyRows = [
    {
      id: '1',
      fiscalYear: '2024',
      quarter: 'Q1',
      accountGroup: 'Revenue',
      accountName: 'Account A',
      budgetedAmount: 1000,
      actualAmount: 900,
      varianceAmount: 100,
      variancePercent: 10,
      remarks: '',
    },
    {
      id: '2',
      fiscalYear: '2024',
      quarter: 'Q2',
      accountGroup: 'Expense',
      accountName: 'Account B',
      budgetedAmount: 1000,
      actualAmount: 900,
      varianceAmount: 100,
      variancePercent: 10,
      remarks: 'Lorem ipsum dolor sit amet,',
    },
    {
      id: '3',
      fiscalYear: '2024',
      quarter: 'Q3',
      accountGroup: 'Expense',
      accountName: 'Account C',
      budgetedAmount: 1000,
      actualAmount: 900,
      varianceAmount: 100,
      variancePercent: 10,
      remarks: '',
    },
  ];

  let detail = quarterlyRows;
  if (periodType === 'Yearly') {
    detail = quarterlyRows.map((r) => ({ ...r, quarter: undefined }));
  }
  if (periodType === 'Monthly') {
    detail = quarterlyRows
      .slice(0, 3)
      .map((r, idx) => ({ ...r, quarter: undefined, fiscalYear: '2024', month: [`Jan`, `Feb`, `Mar`][idx] }));
  }

  return {
    success: true,
    fromDate,
    toDate,
    periodType,
    detail,
  };
};


// GET
export const checkBudgetPreference = async () => {
  try {
    const { data } = await axiosInstance.get('/user-api/budget-setup/preference');
    return data
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET
export const getBudgetReportData = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/budget-report', {
      params
    });
    return data.data
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// POST
export const postRemarks = async (payload) => {
  try {
    const { data } = await axiosInstance.post('/user-api/budget-report/update-remarks', payload);
    return data.data
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET
export const getChartsData = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/budget-report/chart-data', {
      params
    });
    return data.data
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};