import axiosInstance from '../../Config/axiosConfig';
import { buildFormData } from '../../Utils/Utils';

// GET
export const getNotifications = async (params) => {
  try {
    const { data } = await axiosInstance.get('/admin-api/notifications', {
      params,
    });
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

//MARK READ
export const editNotification = async (id) => {
  try {
    const response = await axiosInstance.post(
      `/admin-api/notifications/${id}`);
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

