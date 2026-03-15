import axiosInstance from '../../Config/axiosConfig';

export const getTransactionLogs = async (params) => {
  try {
    const { data } = await axiosInstance.get('user-api/transaction-logs', {
      params,
    });
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
