import axiosInstance from '../../Config/axiosConfig';
import { buildFormData } from '../../Utils/Utils';


// GET UNLOCK REQUEST LISTING
export const getUnlockRequestListing = async (params) => {
  // If param has search it will fetch details else it will fetch listing
  try {
    const { data } = await axiosInstance.get(
      `/user-api/unlock-request-logs`,
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
    const { data } = await axiosInstance.get(`/user-api/unlock-request-logs/${id}`);
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
