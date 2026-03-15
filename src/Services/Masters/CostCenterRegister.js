import axiosInstance from '../../Config/axiosConfig';

export const getCostCenterRegisterListing = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/cost-center-register', {
      params,
    });
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
export const viewCostCenterRegister = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/cost-center-register/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// CREATE
export const addCostCenterRegister = async (formData) => {
  try {
    const response = await axiosInstance.post(
      '/user-api/cost-center-register',
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
export const updateCostCenterRegister = async (id, formData) => {
  try {
    const response = await axiosInstance.post(
      `/user-api/cost-center-register/${id}`,
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
export const deleteCostCenterRegister = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `/user-api/cost-center-register/${id}`
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
