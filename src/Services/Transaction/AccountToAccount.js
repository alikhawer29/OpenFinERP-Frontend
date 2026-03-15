import axiosInstance from '../../Config/axiosConfig';
import { buildFormData } from '../../Utils/Utils';

// GET VOUCHER NUMBER
export const getAAVoucherNumber = async (voucher_no = '') => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/account-to-account/voucher-number?voucher_no=${voucher_no}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET VOUCHER LISTING AND DETAILS
export const getAccountToAccountListing = async (params) => {
  try {
    const { data } = await axiosInstance.get(`/user-api/account-to-account`, {
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
export const createAccountToAccount = async (formData) => {
  const payload = new FormData();
  buildFormData(payload, formData, '');
  try {
    const response = await axiosInstance.post(
      '/user-api/account-to-account',
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
export const updateAccountToAccount = async (id, formData) => {
  const payload = new FormData();
  buildFormData(payload, formData, '');
  try {
    const response = await axiosInstance.post(
      `/user-api/account-to-account/${id}`,
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

// DELETE ACCOUNT TO ACCOUNT VOUCHER
export const deleteAccountToAccount = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/account-to-account/${id}`
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
export const addAccountToAccountAttachment = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const response = await axiosInstance.post(
      `/user-api/account-to-account/attachments/${id}`,
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

// GET ACCOUNT TO ACCOUNT ATTACHMENTS
export const getAccountToAccountAttachments = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/account-to-account/attachments/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// DELETE ACCOUNT TO ACCOUNT ATTACHMENT
export const deleteAccountToAccountAttachment = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/account-to-account/attachments/${id}`
    );
    return { message, status };
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
      `/user-api/account-to-account/account?type=${AccountType}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET CURRENCIES
export const getCurrencies = async (bankId) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/account-to-account/currency?bank_id=${bankId}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET ACCOUNT BALANCE
export const getAccountBalance = async (accountId, accountType) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/account-to-account/account-balance?account_type=${accountType}&account_id=${accountId}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET BANKS
export const getBanks = async (type) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/account-to-account/modes?type=${type}`
    );
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET CHEQUE NUMBERS BY BANK
export const getChequeNumbersByBank = async (bank_id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/account-to-account/cheques?bank_id=${bank_id}`
    );
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET EXCHANGE RATES
export const getExchangeRates = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/account-to-account/exchange-rates`
    );
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET CURRENCY RATE (using Journal Voucher endpoint as per pattern)
export const getCurrencyRate = async (currency_id, date = null) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/journal-voucher/rates?currency_id=${currency_id}&date=${date}`
    );
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
