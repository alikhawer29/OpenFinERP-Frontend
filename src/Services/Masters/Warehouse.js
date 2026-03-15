import axiosInstance from '../../Config/axiosConfig';

export const getWarehouseListing = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/warehouse', { params });
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const addWarehouse = async (formData) => {
  try {
    const response = await axiosInstance.post('/user-api/warehouse', formData);
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

export const editWarehouse = async (id, formData) => {
  try {
    const response = await axiosInstance.post(
      `/user-api/warehouse/${id}`,
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
export const deleteWarehouse = async (id) => {
  try {
    const response = await axiosInstance.delete(`/user-api/warehouse/${id}`);
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
