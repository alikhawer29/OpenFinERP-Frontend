import axiosInstance from '../../Config/axiosConfig';
import { buildFormData } from '../../Utils/Utils';


// GET UNLOCK REQUEST LISTING
export const getUnlockRequestListing = async (params) => {
  // If param has search it will fetch details else it will fetch listing
  try {
    const { data } = await axiosInstance.get(
      `/admin-api/unlock-request-logs`,
      {
        params,
      }
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET UNLOCK REQUEST DETAILS
export const getUnlockRequestetails = async (id) => {
  try {
    const { data } = await axiosInstance.get(`/admin-api/unlock-request-logs/${id}`);
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CREATE STATUS FOR UNLOCK REQ MANAGEMENT
export const unlockReqStatus = async (id , formData) => {
  try {
    const response = await axiosInstance.post(
      `/admin-api/unlock-request-logs/${id}/status`,
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