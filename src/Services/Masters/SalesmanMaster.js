import axiosInstance from '../../Config/axiosConfig';

// GET
export const getSalesmanMasterListing = async (params) => {
  try {
    const { data } = await axiosInstance.get(
      '/user-api/salesman-master',
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

// DETAILS
export const viewSalesmanMaster = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/salesman-master/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CREATE
export const addSalesmanMaster = async (formData) => {
  try {
    const response = await axiosInstance.post(
      '/user-api/salesman-master',
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
export const editSalesmanMaster = async (id, formData) => {
  try {
    const response = await axiosInstance.post(
      `/user-api/salesman-master/${id}`,
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
export const deleteSalesmanMaster = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `/user-api/salesman-master/${id}`
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
