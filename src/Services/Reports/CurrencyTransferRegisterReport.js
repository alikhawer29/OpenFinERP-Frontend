import axiosInstance from '../../Config/axiosConfig';

// GET - Get currency transfer register filters
export const getCurrencyTransferRegisterFilters = async () => {
  try {
    const data = await axiosInstance.get(
      `/user-api/reports/currency-transfer-register-filters`
    );
    return data.data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// POST - Get currency transfer register report data
export const getCurrencyTransferRegisterReport = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/currency-transfer-register-report', {
      params,
    });
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
