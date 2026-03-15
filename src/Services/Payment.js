import axiosInstance from '../Config/axiosConfig';

export const processPayment = async (params, id) => {
  try {
    const { data } = await axiosInstance.post(
      `/user-api/packages/${id}`,
      params
    );
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
