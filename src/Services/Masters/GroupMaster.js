import axiosInstance from '../../Config/axiosConfig';

// GET
export const getGroupMasterListing = async (params) => {
  try {
    const { data } = await axiosInstance.get(
      '/user-api/group-master',
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
export const viewGroupMaster = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/group-master/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CREATE
export const addGroupMaster = async (formData) => {
  try {
    const response = await axiosInstance.post(
      '/user-api/group-master',
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
export const editGroupMaster = async (id, formData) => {
  try {
    const response = await axiosInstance.post(
      `/user-api/group-master/${id}`,
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
export const deleteGroupMaster = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `/user-api/group-master/${id}`
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
