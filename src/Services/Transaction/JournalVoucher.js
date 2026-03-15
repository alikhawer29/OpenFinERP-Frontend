import axiosInstance from '../../Config/axiosConfig';
import { buildFormData } from '../../Utils/Utils';

// GET CURRENCIES
export const getCurrencies = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/journal-voucher/currency`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET CURRENCY RATE
export const getCurrencyRate = async (currency_id, date = null) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/journal-voucher/rates?currency_id=${currency_id}&date=${date}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET ACCOUNTS BY TYPE -- party,walkin,general
export const getAccountsbyType = async (AccountType) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/journal-voucher/account?type=${AccountType}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// GET VOUCHER NUMBER
export const getVoucherNumber = async (voucher_no = '') => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/journal-voucher/voucher-number?voucher_no=${voucher_no}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// GET VOUCHER LISTING AND DETAILS
export const getJournalVoucherListing = async (params) => {
  try {
    const { data } = await axiosInstance.get(`/user-api/journal-voucher`, {
      params,
    });
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CREATE
export const createJournalVoucher = async (formData) => {
  const payload = new FormData();
  buildFormData(payload, formData);
  try {
    const response = await axiosInstance.post(
      '/user-api/journal-voucher',
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

// UPDATE
export const updateJournalVoucher = async (id, formData) => {
  const payload = new FormData();
  buildFormData(payload, formData);
  try {
    const response = await axiosInstance.post(
      `/user-api/journal-voucher/${id}`,
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

// DELETE JOURNAL VOUCHER
export const deleteJournalVoucher = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/journal-voucher/${id}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// ATTACHMENTS
// ADD
export const addJournalVoucherAttachment = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const response = await axiosInstance.post(
      `/user-api/journal-voucher/attachments/${id}`,
      payload
    );
    const {
      data: { message, status },
    } = response;
    return { message, status }; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// DELETE JOURNAL VOUCHER ATTACHMENT
export const deleteJournalVoucherAttachment = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/journal-voucher/attachments/${id}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET PAYMENT VOUCHER MODE

export const getPaymentVoucherMode = async (Mode) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/payment-voucher/modes?type=${Mode}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

export const getChequeNumberByBank = async (Bank) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/payment-voucher/cheques?bank_id=${Bank}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
