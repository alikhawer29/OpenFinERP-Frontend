import axiosInstance from '../../Config/axiosConfig';

export const getCBClassificationMasterListing = async (params) => {
  try {
    const { data } = await axiosInstance.get(
      '/user-api/cb-classification-master',
      { params }
    );
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
export const viewCBClassificationMaster = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/cb-classification-master/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
export const addCBClassificationMaster = async (formData) => {
  try {
    const response = await axiosInstance.post(
      '/user-api/cb-classification-master',
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
export const editCBClassificationMaster = async (id, formData) => {
  try {
    const response = await axiosInstance.post(
      `/user-api/cb-classification-master/${id}`,
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
export const deleteCBClassificationMaster = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `/user-api/cb-classification-master/${id}`
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
