import axiosInstance from '../../Config/axiosConfig';
import { buildFormData } from '../../Utils/Utils';

// GET VOUCHER NUMBER
export const getTMNVoucherNumber = async (voucher_no = '', type) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/tmn-currency-deal/voucher-number?voucher_no=${voucher_no}&type=${type}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET TMN CURRENCY DEAL LISTING AND DETAILS
export const getTMNCurrencyDealListingOrDetails = async (params) => {
  // If param has search it will fetch details else it will fetch listing
  try {
    const { data } = await axiosInstance.get(`/user-api/tmn-currency-deal`, {
      params,
    });
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CREATE TMN CURRENCY DEAL
export const createTMNCurrencyDeal = async (formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const { data } = await axiosInstance.post(
      `/user-api/tmn-currency-deal`,
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

// UPDATE TMN CURRENCY DEAL
export const updateTMNCurrencyDeal = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const { data } = await axiosInstance.post(
      `/user-api/tmn-currency-deal/${id}`,
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

// DELETE TMN CURRENCY DEAL
export const deleteTMNCurrencyDeal = async (id, type) => {
  try {
    const { data } = await axiosInstance.delete(
      `/user-api/tmn-currency-deal/${id}/${type}`
    );
    const { message, status, detail } = data;
    return { message, status, detail };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET Purposes
export const getPurposes = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/tmn-currency-deal/purpose`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET ACCOUNT BALANCE
export const getAccountBalance = async (id, type) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/tmn-currency-deal/account-balance?account_type=${type}&account_id=${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// ATTACHMENTS


export const addTMNCurrencyDealAttachment = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const response = await axiosInstance.post(
      `/user-api/tmn-currency-deal/attachments/${id}`,
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

// GET SUSPENSE VOUCHER ATTACHMENTS
export const getTMNCurrencyDealAttachments = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/tmn-currency-deal/attachments/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// DELETE SUSPENSE VOUCHER ATTACHMENT
export const deleteTMNCurrencyDealAttachment = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/tmn-currency-deal/attachments/${id}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
