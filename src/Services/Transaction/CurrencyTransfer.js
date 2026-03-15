import axiosInstance from '../../Config/axiosConfig';
import { buildFormData } from '../../Utils/Utils';

// GET CURRENCIES
export const getCurrencies = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/currency-transfer/currency`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET ACCOUNTS BY TYPE
export const getAccountsbyType = async (type) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/currency-transfer/accounts?type=${type}`
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
      `/user-api/currency-transfer/account-balance?account_id=${accountId}&account_type=${accountType}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET CURRENCY_TRANSFER BANKS
export const getCTBanks = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/currency-transfer/modes?type=bank`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET MODES BY TYPE
export const getModesByType = async (type) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/currency-transfer/modes?type=${type}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET CURRENCY VOUCHER NUMBER
export const getCTVoucherNumber = async (voucher_no = '') => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/currency-transfer/voucher-number?voucher_no=${voucher_no}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
// GET CURRENCY TRANSFER LISTING
export const getCurrencyTransferListing = async (params) => {
  try {
    const { data } = await axiosInstance.get(`/user-api/currency-transfer`, {
      params,
    });
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CREATE CURRENCY TRANSFER
export const createCurrencyTransfer = async (formData) => {
  const payload = new FormData();
  buildFormData(payload, formData);
  try {
    const response = await axiosInstance.post(
      '/user-api/currency-transfer',
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

// UPDATE CURRENCY TRANSFER
export const updateCurrencyTransfer = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const { data } = await axiosInstance.post(
      `/user-api/currency-transfer/${id}`,
      payload
    );
    const { message, status, detail } = data;
    return { message, status, detail };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// DELETE CURRENCY TRANSFER
export const deleteCurrencyTransfer = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/currency-transfer/${id}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET CURRENCY TRANSFER DETAILS
export const getCurrencyTransferDetails = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/currency-transfer/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// ADD CURRENCY TRANSFER ATTACHMENT
export const addCurrencyTransferAttachment = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const response = await axiosInstance.post(
      `/user-api/currency-transfer/attachments/${id}`,
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

// GET CURRENCY TRANSFER ATTACHMENTS
export const getCurrencyTransferAttachments = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/currency-transfer/attachments/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// DELETE CURRENCY TRANSFER ATTACHMENT
export const deleteCurrencyTransferAttachment = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/currency-transfer/attachments/${id}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET CHEQUE NUMBER BY BANK
export const getChequeNumberByBank = async (bankId) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/currency-transfer/cheque-number?bank_id=${bankId}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET CURRENCY RATE
export const getCurrencyRate = async (currencyId) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/currency-transfer/currency-rate?currency_id=${currencyId}`
    );
    return data.detail; // Assume this returns success obj
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
      `/user-api/currency-transfer/exchange-rates`
    );
    return data.detail;
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
