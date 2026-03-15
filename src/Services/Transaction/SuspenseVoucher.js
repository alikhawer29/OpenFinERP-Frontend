import axiosInstance from '../../Config/axiosConfig';
import { buildFormData } from '../../Utils/Utils';

// GET VOUCHER NUMBER
export const getSVVoucherNumber = async (voucher_no = '') => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/suspense-voucher/voucher-number?voucher_no=${voucher_no}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET VOUCHER LISTING AND DETAILS
export const getSuspenseVoucherListing = async (params) => {
  try {
    const { data } = await axiosInstance.get(`/user-api/suspense-voucher`, {
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
export const createSuspenseVoucher = async (formData) => {
  const payload = new FormData();
  buildFormData(payload, formData, '');
  try {
    const response = await axiosInstance.post(
      '/user-api/suspense-voucher',
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
export const updateSuspenseVoucher = async (id, formData) => {
  const payload = new FormData();
  buildFormData(payload, formData, '');
  try {
    const response = await axiosInstance.post(
      `/user-api/suspense-voucher/${id}`,
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

// DELETE SUSPENSE VOUCHER
export const deleteSuspenseVoucher = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/suspense-voucher/${id}`
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
export const addSuspenseVoucherAttachment = async (id, formData) => {
  try {
    const payload = new FormData();
    buildFormData(payload, formData);
    const response = await axiosInstance.post(
      `/user-api/suspense-voucher/attachments/${id}`,
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
export const getSuspenseVoucherAttachments = async (id) => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/suspense-voucher/attachments/${id}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// DELETE SUSPENSE VOUCHER ATTACHMENT
export const deleteSuspenseVoucherAttachment = async (id) => {
  try {
    const { data: { message, status } = {} } = await axiosInstance.delete(
      `/user-api/suspense-voucher/attachments/${id}`
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
      `/user-api/suspense-voucher/account?type=${AccountType}`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

// GET OFFICE LOCATIONS
export const getOfficeLocations = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/suspense-voucher/office`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};

  
// GET CURRENCIES
export const getCurrencies = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/user-api/suspense-voucher/currency`
    );
    return data.detail; // Assume this returns success obj
  } catch (error) {
    throw error.response
      ? error.response.data
      : { message: 'Unknown error occurred' };
  }
};
