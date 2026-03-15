import axiosInstance from '../../Config/axiosConfig';

export const checkTransactionLockStatus = async (params) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/transaction-lock/check`,
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

// To lock the different Vouchers/Transactions when user is editing them
export const lockTransaction = async (payload) => {
  try {
    const { data } = await axiosInstance.post(
      `/user-api/transaction-lock/lock`,
      payload
    );
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// To Release locked transaction
export const releaseTransaction = async (payload) => {
  try {
    const { data } = await axiosInstance.post(
      `/user-api/transaction-lock/release`,
      payload
    );
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const getOutwardRemittancePDF = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/outward-remittance/print-voucher/${id}`
    );
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};  
