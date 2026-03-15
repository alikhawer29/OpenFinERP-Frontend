import axiosInstance from '../../Config/axiosConfig';

// GET - Get account enquiry filters
export const getAccountEnquiryFilters = async () => {
  try {
    const data = await axiosInstance.get(
      `/user-api/reports/account-enquiry-filters`
    );
    return data.data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// POST - Get account enquiry report data
export const getAccountEnquiryReport = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/account-enquiry', {
      params,
    });
    return data?.data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// Get account inward remittance report data
export const getInwardRemittanceReport = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/inward-remittance-report', {
      params,
    });
    return data?.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};