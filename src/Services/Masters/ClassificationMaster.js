import axiosInstance from '../../Config/axiosConfig';

export const getClassificationMasterListing = async (params) => {
  try {
    const { data } = await axiosInstance.get(
      '/user-api/classification-master',
      { params }
    );
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
export const viewClassificationMaster = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/classification-master/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
export const addClassificationMaster = async (formData) => {
  try {
    const response = await axiosInstance.post(
      '/user-api/classification-master',
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
export const editClassificationMaster = async (id, formData) => {
  try {
    const response = await axiosInstance.post(
      `/user-api/classification-master/${id}`,
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
export const deleteClassificationMaster = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `/user-api/classification-master/${id}`
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

// Classification Types
export const getClassificationMasterTypes = async () => {
  try {
    const { data } = await axiosInstance.get('/user-api/classification-type');
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const addClassificationMasterType = async (formData) => {
  try {
    const response = await axiosInstance.post(
      '/user-api/classification-type',
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
