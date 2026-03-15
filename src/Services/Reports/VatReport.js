import axiosInstance from '../../Config/axiosConfig';

// GET
export const getVatSummary = async (params) => {
  try {
    const data = await axiosInstance.get(
      `/user-api/vat-report`, { params }
    );
    return data.data.data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET
export const getVatReportDetails = async (params) => {
  try {
    const data = await axiosInstance.get(
      `/user-api/vat-report/detail`, { params }
    );
    return data.data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// UPDATE
export const editVatReportDetails = async (formData) => {
  try {
    const response = await axiosInstance.put(
      '/user-api/vat-report/edit',
      formData
    );
    const {
      data: { message, status },
    } = response;
    return { message, status }; // Assume this returns the success object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET
export const getReportEditData = async (params) => {
  try {
    const data = await axiosInstance.get(
      `/user-api/vat-report/edit/view`, { params }
    );
    return data.data.data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

