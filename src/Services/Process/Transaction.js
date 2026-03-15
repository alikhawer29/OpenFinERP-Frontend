import axiosInstance from '../../Config/axiosConfig';

// GET
export const getPendingTransactionApprovalListing = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/transaction-approval', {
      params,
    });
    // return transactionApprovalData.detail;
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const getTransactionLockListing = async (params) => {
  try {
    const { data } = await axiosInstance.get('/user-api/transaction-lock', {
      params,
    });
    return data.detail; // Assume this returns the listing object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const updateStatusTransactionApproval = async (
  { id, status, voucherId },
  payload
) => {
  try {
    const { data } = await axiosInstance.post(
      `/user-api/transaction-approval/${id}/${status}/${voucherId}`,
      payload
    );
    return data.detail; // listing object from backend
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

