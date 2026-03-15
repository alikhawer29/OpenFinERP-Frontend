import axiosInstance from "../../Config/axiosConfig";

export const getUserLogs = async (params) => {
  try {
    const { data } = await axiosInstance.get('user-api/user-maintenance/user-logs', {
      params,
    });
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};