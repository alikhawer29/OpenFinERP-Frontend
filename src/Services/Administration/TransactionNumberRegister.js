import axiosInstance from '../../Config/axiosConfig';

// GET
export const getTransactionNumberListing = async (params) => {
  try {
    const { data } = await axiosInstance.get(
      'user-api/transaction-number-registers',
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

// UPDATE
export const editTransactionNumber = async (id, formData) => {
  try {
    const response = await axiosInstance.post(
      `/user-api/transaction-number-registers/${id}`,
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
