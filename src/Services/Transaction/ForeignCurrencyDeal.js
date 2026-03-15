import axiosInstance from '../../Config/axiosConfig';
import { buildFormData } from '../../Utils/Utils';

// GET VOUCHER NUMBER
export const getForeignCurrencyDealVoucherNumber = async (voucher_no = '') => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/foreign-currency-deal/voucher-number?voucher_no=${voucher_no}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET FOREIGN CURRENCY DEAL LISTING AND DETAILS
export const getForeignCurrencyDealListingOrDetails = async (params) => {
  // If param has search it will fetch details else it will fetch listing
  try {
    const { data } = await axiosInstance.get(
      `/user-api/foreign-currency-deal`,
      {
        params,
      }
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// CREATE FOREIGN CURRENCY DEAL
export const createForeignCurrencyDeal = async (formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const { data } = await axiosInstance.post(
      `/user-api/foreign-currency-deal`,
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

// UPDATE FOREIGN CURRENCY DEAL
export const updateForeignCurrencyDeal = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const { data } = await axiosInstance.post(
      `/user-api/foreign-currency-deal/${id}`,
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

// DELETE FOREIGN CURRENCY DEAL
export const deleteForeignCurrencyDeal = async (id) => {
  try {
    const { data } = await axiosInstance.delete(
      `/user-api/foreign-currency-deal/${id}`
    );
    const { message, status, detail } = data;
    return { message, status, detail };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// ATTACHMENTS // FOREIGN CURRENCY DEAL
// ADD
export const addForeignCurrencyDealAttachment = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const response = await axiosInstance.post(
      `/user-api/foreign-currency-deal/attachments/${id}`,
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

// DELETE FOREIGN CURRENCY DEAL ATTACHMENT
export const deleteForeignCurrencyDealAttachment = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/foreign-currency-deal/attachments/${id}`
    );
    return { message, status };
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
