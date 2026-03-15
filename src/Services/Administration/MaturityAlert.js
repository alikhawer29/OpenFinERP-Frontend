import axiosInstance from '../../Config/axiosConfig';

// GET
export const getMaturityAlertTabs = async () => {
  try {
    const { data } = await axiosInstance.get('user-api/maturity-alert');
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET TAB LISTING
export const getMaturityAlertTabListing = async (tab, params) => {
  try {
    const { data } = await axiosInstance.get(
      `user-api/maturity-alert/list?tab=${tab}`,
      {
        params,
      }
    );
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// POST
export const updateMaturityAlertTabs = async (formData) => {
  try {
    const response = await axiosInstance.post(
      'user-api/maturity-alert',
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
