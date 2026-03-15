import axiosInstance from '../../Config/axiosConfig';

export const getCommissionMasterListing = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/commission-master', {
      params,
    });
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
export const viewCommissionMaster = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/commission-master/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// CREATE
export const addCommissionMaster = async (formData) => {
  try {
    const response = await axiosInstance.post(
      '/user-api/commission-master',
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
// UPDATE
export const editCommissionMaster = async (id, formData) => {
  try {
    const response = await axiosInstance.post(
      `/user-api/commission-master/${id}`,
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
// DELETE
export const deleteCommissionMaster = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `/user-api/commission-master/${id}`
    );
    const {
      data: { message, status },
    } = response;
    return { message, status }; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// GET ACCOUNTS
export const getCommissionMasterAccounts = async (type) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/commission-master/account?type=${type}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
