import axiosInstance from '../../Config/axiosConfig';

// GET
export const getJournalReportFilters = async (ledger) => {
  try {
    const data = await axiosInstance.get(
      `/user-api/reports/journal-report-filters?ledger=${ledger}`
    );
    return data.data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// USERS
export const getJournalReportUserFilters = async () => {
  try {
    const data = await axiosInstance.get(
      `/user-api/journal-reports/users`
    );
    return data.data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET
export const getJournalReport = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/journal-reports', {
      params,
    });
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};


// GET
export const getReportAttachments = async (id) => {
  try {
    const { data } = await axiosInstance.get(`/user-api/journal-reports/view-attachments/${id}`, {
    });
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET
export const getStatementOfAccountReportAttachments = async (id) => {
  try {
    const { data } = await axiosInstance.get(`/user-api/statement-of-account/view-attachments/${id}`, {
    });
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// POST - Statement of Account Excel (with filters/params)
export const emailAsExcel = async (params) => {
  try {
    const { data } = await axiosInstance.post(
      `/user-api/statement-of-account/email/excel`,
      params || {}
    );
    return data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// POST - Statement of Account PDF (with filters/params)
export const emailAsPdf = async (params) => {
  try {
    const { data } = await axiosInstance.post(
      `/user-api/statement-of-account/email/pdf`,
      params || {}
    );
    return data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// POST
export const markedStatus = async (id, type, formData) => {
  try {
    const { data } = await axiosInstance.post(`/user-api/${type}/mark-status/${id}`, formData);
    return data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// POST
export const accountOfStatementMarkStatus = async (id, type, formData) => {
  try {
    const { data } = await axiosInstance.post(`/user-api/${type}/mark-status/${id}`, formData);
    return data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET
export const getStatementOfAccountsReport = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/statement-of-account', {
      params,
    });
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET
export const getOutstandingBalanceReport = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/outstanding-balance', {
      params,
    });
    return data?.detail?.data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};