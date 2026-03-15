import axiosInstance from '../../Config/axiosConfig';

// GET Receivables
export const getPDCRPaymentPosting = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/pdcr-payment-posting', {
      params,
    });
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// Change Status
export const updateStatusPDCRPaymentPosting = async (id, status) => {
  try {
    const { data } = await axiosInstance.post(
      `/user-api/pdcr-payment-posting/${id}/${status}`
    );
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
