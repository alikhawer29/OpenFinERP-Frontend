import axiosInstance from '../../Config/axiosConfig';

// GET
export const getChartOfAccountListing = async () => {
  try {
    const { data } = await axiosInstance.get('/user-api/chart-of-accounts');
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// GET Level 1 and 2 Dropdown options
export const getLevel1and2Dropdowns = async () => {
  try {
    const { data } = await axiosInstance.get(
      '/user-api/chart-of-accounts/accountType'
    );
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// GET Level 3 and 4 Dropdown options
export const getLevel3and4Dropdowns = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/chart-of-accounts/subAccounts/${id}`
    );
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CREATE
export const addChartOfAccount = async (formData) => {
  try {
    const { data: { message, status, detail } = {} } = await axiosInstance.post(
      '/user-api/chart-of-accounts',
      formData
    );
    return { message, status, detail }; // Assume this returns the success object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// UPDATE
export const editChartOfAccount = async (id, formData) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.post(
      `/user-api/chart-of-accounts/${id}`,
      formData
    );
    return { message, status }; // Assume this returns the success object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// DETAILS
export const viewChartOfAccount = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/chart-of-accounts/${id}`
    );
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// DELETE
export const deleteChartOfAccount = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/chart-of-accounts/${id}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
