import axiosInstance from '../../Config/axiosConfig';

// GET
export const getWalkinCustomerFilters = async () => {
  try {
    const data = await axiosInstance.get(
      `/user-api/reports/walk-in-customer-filters`
    );
    return data.data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET
export const getWalkInCustomerAccountStatement = async (payload) => {
  try {
    const { data } = await axiosInstance.get('/user-api/walk-in-customer-statement', {
      params: payload,
    });
    return data.detail
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET
export const getExpenseJournalAccountStatement = async (data) => {
  try {
    const response = await axiosInstance.get('/user-api/expense-journal/expense-accounts', {
      params: data,
    });
    return response.data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

//GET
export const getWalkInCustomerStatementFilters = async () => {
  try {
    const response = await axiosInstance.get(
      '/user-api/reports/walk-in-customer-filters'
    );
    return response.data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

//GET
export const getWalkInCustomerAccountJournal = async (transaction_id) => {
  try {
    const response = await axiosInstance.get(
      `/user-api/walk-in-customer-statement/account-journal/${transaction_id}`
    );
    return response.data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET
export const getWalkInCustomerOutstandingBalance = async (data) => {
  try {
    const response = await axiosInstance.get('/user-api/walk-in-customer-outstanding-balance', {
      params: data,
    });
    return response.data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET
export const getExpenseJournalListing = async (data) => {
  try {
    const response = await axiosInstance.get('/user-api/expense-journal', {
      params: data,
    });
    return response.data.detail.data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET
export const postDatedChequeReportsListing = async (data) => {
  try {
    const response = await axiosInstance.get('/user-api/post-dated-cheque-report', {
      params: data,
    });
    return response.data.data || response.data.detail || []; // Handle both response structures
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET
export const getAccountTurnoverReportListing = async (data) => {
  try {
    const response = await axiosInstance.get('/user-api/account-turnover-report', {
      params: data,
    });
    return response.data.data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET
export const getCashAndBankBalanceListing = async () => {
  try {
    const response = await axiosInstance.get('/user-api/cash-bank-balance');
    return response.data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};