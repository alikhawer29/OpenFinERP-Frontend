import axiosInstance from '../../Config/axiosConfig';

// GET
export const getOfficeLocationMasterListing = async (params) => {
  try {
    const { data } = await axiosInstance.get(
      '/user-api/office-location-master',
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
export const viewOfficeLocationMaster = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/office-location-master/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CREATE
export const addOfficeLocationMaster = async (formData) => {
  try {
    const response = await axiosInstance.post(
      '/user-api/office-location-master',
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
export const editOfficeLocationMaster = async (id, formData) => {
  try {
    const response = await axiosInstance.post(
      `/user-api/office-location-master/${id}`,
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
export const deleteOfficeLocationMaster = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `/user-api/office-location-master/${id}`
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
