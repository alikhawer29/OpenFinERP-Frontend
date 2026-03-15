import axiosInstance from '../../Config/axiosConfig';
import { buildFormData } from '../../Utils/Utils';

// CREATE
export const createBankTransaction = async (formData) => {
  const payload = new FormData();
  buildFormData(payload, formData);
  try {
    const response = await axiosInstance.post(
      '/user-api/bank-transaction',
      payload
    );
    const {
      data: { message, status, detail },
    } = response;
    return { message, status, detail }; // Assume this returns the success object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET ACCOUNTS BY TYPE -- party,walkin,general
export const getBankTransactionListing = async (params) => {
  try {
    const { data } = await axiosInstance.get(`/user-api/bank-transaction`, {
      params,
    });

    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const updateBankTransaction = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);

    const response = await axiosInstance.post(
      `/user-api/bank-transaction/${id}`,
      payload
    );
    const {
      data: { message, status, detail },
    } = response;
    return { message, status, detail }; // Assume this returns the success object
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET COUNTRIES
export const getCountriesListing = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/bank-transaction/country`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const getBankTransactionChequeNumberByBank = async (Bank) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/bank-transaction/cheques?bank_id=${Bank}`
    );
    
    // If status is false and message is "No Cheque Found", return empty array
    if (data.status === false && data.message === 'No Cheque Found') {
      return [];
    }
    
    return data.detail || []; // Return empty array if detail is null/undefined
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const getVoucherNumber = async ({
  voucher_no = '',
  transaction_type,
}) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/bank-transaction/voucher-number`,  
      {
        params: {
          voucher_no,
          transaction_type,
        },
      }
    );
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const deleteBankTransaction = async (id, transactionType) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/bank-transaction/${id}?transaction_type=${transactionType}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const deleteAttachment = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/bank-transaction/attachments/${id}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const uploadAttachment = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    // Add type field for attachment validation
    payload.append('type', 'bank_transaction');
    const response = await axiosInstance.post(
      `/user-api/bank-transaction/attachments/${id}`,
      payload
    );
    const {
      data: { message, status },
    } = response;
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
